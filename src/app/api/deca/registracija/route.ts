import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { PSEUDONIM_PRAVILO, validanEmail, validanPseudonim } from "@/lib/validacija";
import { porukaZauzeca, proveriZauzece } from "@/lib/pseudonim";
import { rateLimit, klijentIP } from "@/lib/rate-limit";
import { DecaGreska } from "@/lib/protokol/deca";
import { registrujDete } from "@/lib/protokol/deca-poziv";

/** Isti generator kao pri registraciji — hash je javni identifikator naloga. */
function generisiMemberHash(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let hash = "";
  for (let i = 0; i < 8; i++) hash += chars[Math.floor(Math.random() * chars.length)];
  return hash;
}

/**
 * POST /api/deca/registracija — dete otvara nalog samo (Modul Deca, čl. 4a).
 *
 * Traži se pseudonim, lozinka i **imejl roditelja**. Datum rođenja se NE traži —
 * upisuje ga roditelj pri preuzimanju (čl. 7), jer je roditeljska izjava jedina
 * provera godina kojom sistem raspolaže.
 *
 * 🔴 Nalog nema sopstveni imejl. Adresa koja se unosi je adresa TREĆEG LICA i služi
 * isključivo za jednu poruku; ne upisuje se u `User.email` i ne otvara nikakav put
 * za prijavu ni za oporavak lozinke. Dete se prijavljuje pseudonimom.
 */
export async function POST(req: NextRequest) {
  // Nalog na čekanju je najjeftiniji nalog u sistemu — nema imejl koji bi se
  // proveravao. Zato je ograničenje po IP-u strože nego za redovnu registraciju.
  const rl = rateLimit(`deca-reg:${klijentIP(req)}`, 3, 60 * 60 * 1000);
  if (!rl.ok) return await greska("Previše pokušaja. Pokušaj kasnije.", 429);

  let body: { pseudonim?: unknown; lozinka?: unknown; roditeljEmail?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  const { pseudonim, lozinka, roditeljEmail } = body;
  if (
    typeof pseudonim !== "string" ||
    typeof lozinka !== "string" ||
    typeof roditeljEmail !== "string"
  ) {
    return await greska("Sva polja su obavezna.", 400);
  }
  if (!validanPseudonim(pseudonim)) return await greska(PSEUDONIM_PRAVILO, 400);
  if (lozinka.length < 8 || lozinka.length > 200) {
    return await greska("Lozinka mora imati između 8 i 200 znakova.", 400);
  }
  if (!validanEmail(roditeljEmail)) {
    return await greska("Unesi ispravnu imejl adresu roditelja.", 400);
  }

  const pseudonimClean = pseudonim.trim();
  const zauzece = await proveriZauzece(pseudonimClean);
  if (zauzece) return await greska(porukaZauzeca(zauzece), 409);

  let memberHash = generisiMemberHash();
  while (await prisma.user.findUnique({ where: { memberHash } })) {
    memberHash = generisiMemberHash();
  }

  try {
    const rezultat = await registrujDete({
      pseudonim: pseudonimClean,
      passwordHash: await bcrypt.hash(lozinka, 12),
      memberHash,
      roditeljEmail,
      // Link u poruci roditelju mora da vodi na okruženje sa kog je nalog otvoren
      // (test → test): token postoji samo u bazi tog okruženja.
      origin: req.nextUrl.origin,
    });
    return NextResponse.json(rezultat, { status: 201 });
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    console.error("[POST /api/deca/registracija]", e);
    return await greska("Interna greška servera.", 500);
  }
}
