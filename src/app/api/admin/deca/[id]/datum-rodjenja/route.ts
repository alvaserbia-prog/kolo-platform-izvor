import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";
import { UZRAST_MIN, UZRAST_PUNOLETSTVO, uzrast } from "@/lib/deca-pravila";
import { parsirajDatumRodjenja } from "@/lib/protokol/deca-poziv";

/**
 * POST /api/admin/deca/[id]/datum-rodjenja
 * Body: { pseudonim: string, datumRodjenja: "YYYY-MM-DD" }
 *
 * Ispravka pogrešno unetog datuma rođenja maloletnog naloga.
 *
 * 🔴 Namerno BEZ ulazne tačke u interfejsu (odluka vlasnika 2026-08-18:
 * „mogućnost ostaviti, ali je ne promovisati"). Datum rođenja po čl. 7
 * Pravilnika o učešću dece upisuje roditelj i posle upisa se ne menja — ovo
 * nije redovan tok nego ispravka omaške, koju sprovodi Fondacija na zahtev
 * roditelja. Dugme na ekranu bi je pretvorilo u redovan tok i otvorilo put da
 * dete pomera sopstveno punoletstvo.
 *
 * Zato: samo SUPERADMIN, pseudonim se otkuca i mora da se poklopi, i datum
 * mora da ostavi nalog maloletnim. Prelazak u punoletni nalog vodi isključivo
 * `punoletstvo.ts` (otpis POEN-a iz prijateljstava, brisanje prijateljstava,
 * potvrde roditelja) — ispravkom polja se on ne sme ni pokrenuti ni preskočiti.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);

  const { id } = await params;

  let body: { pseudonim?: unknown; datumRodjenja?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  const potvrda = body.pseudonim;
  if (typeof potvrda !== "string" || !potvrda.trim()) {
    return await greska("Nedostaje potvrda pseudonima.", 400);
  }

  const noviDatum = parsirajDatumRodjenja(body.datumRodjenja);
  if (!noviDatum) return await greska("Datum rođenja mora biti u obliku GGGG-MM-DD.", 400);

  const dete = await prisma.user.findUnique({
    where: { id },
    select: { pseudonim: true, maloletan: true, datumRodjenja: true, deaktiviranAt: true },
  });
  if (!dete) return await greska("Korisnik nije pronađen.", 404);
  if (dete.deaktiviranAt) return await greska("Nalog je ugašen.", 400);
  if (!dete.maloletan) return await greska("Nalog nije maloletan.", 400);
  if (potvrda.trim().toLowerCase() !== dete.pseudonim.toLowerCase()) {
    return await greska("Otkucani pseudonim se ne poklapa sa nalogom.", 400);
  }

  const godine = uzrast(noviDatum, beogradskiDan());
  if (godine < UZRAST_MIN) {
    return await greska(`Nalog maloletnog korisnika otvara se od ${UZRAST_MIN} godina.`, 400);
  }
  if (godine >= UZRAST_PUNOLETSTVO) {
    return await greska(
      "Ispravkom se nalog ne prevodi u punoletni — to sprovodi Protokol na dan punoletstva.",
      400,
    );
  }

  const stari = dete.datumRodjenja;
  await prisma.user.update({
    where: { id },
    // Najava punoletstva je izračunata iz starog datuma, pa se poništava —
    // inače dete ostaje bez obaveštenja mesec dana pre stvarnog prelaza.
    data: { datumRodjenja: noviDatum, punoletstvoNajavaAt: null },
  });

  const ispis = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");
  await logAdminAkcija(
    session.user.id,
    "DATUM_RODJENJA_ISPRAVLJEN",
    id,
    `${dete.pseudonim}: ${ispis(stari)} → ${ispis(noviDatum)}`,
  );

  return NextResponse.json({ ok: true, datumRodjenja: ispis(noviDatum) });
}
