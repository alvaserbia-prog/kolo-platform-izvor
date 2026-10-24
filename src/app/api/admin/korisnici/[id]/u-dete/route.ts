import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { razresiKorisnikaIzAdrese } from "@/lib/pseudonim";
import { parsirajDatumRodjenja } from "@/lib/protokol/deca-poziv";
import { PrevodGreska, prevediUMaloletni } from "@/lib/protokol/prevod-u-maloletni";

/**
 * POST /api/admin/korisnici/[id]/u-dete
 * Body: { pseudonim: string, roditelj: string, datumRodjenja: "GGGG-MM-DD" }
 *
 * Prevodi zatečen punoletni nalog u nalog maloletnog korisnika i upisuje mu
 * roditelja. Postupak i obrazloženje: `src/lib/protokol/prevod-u-maloletni.ts`.
 *
 * 🔴 Nepovratno i pogađa i druge naloge: padaju sve potvrde stvarnosti koje
 * nalog dodiruje, pa drugoj strani POEN ide nazad Protokolu, indeks se
 * preračunava i slot oslobađa. Zato:
 *  - samo SUPERADMIN,
 *  - pseudonim naloga se otkuca i mora da se poklopi — klik ne sme da promaši
 *    red u spisku korisnika,
 *  - roditelj se zadaje pseudonimom, ne izborom iz spiska, iz istog razloga.
 *
 * Povratka nema: u punoletni nalog vodi isključivo `punoletstvo.ts`, na dan
 * punoletstva izračunat iz datuma koji se ovde upisuje.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  if (id === session.user.id) return await greska("Sopstveni nalog se ne prevodi.", 400);

  let body: { pseudonim?: unknown; roditeljId?: unknown; roditelj?: unknown; datumRodjenja?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  const potvrda = body.pseudonim;
  if (typeof potvrda !== "string" || !potvrda.trim()) {
    return await greska("Nedostaje potvrda pseudonima.", 400);
  }

  const datumRodjenja = parsirajDatumRodjenja(body.datumRodjenja);
  if (!datumRodjenja) return await greska("Datum rođenja mora biti u obliku GGGG-MM-DD.", 400);

  const meta = await prisma.user.findUnique({ where: { id }, select: { pseudonim: true } });
  if (!meta) return await greska("Korisnik nije pronađen.", 404);
  // Ekran šalje pseudonim koji je prikazao uz nalog; neslaganje znači da je spisak
  // bio zastareo i da bi radnja pogodila drugog čoveka nego što piše na ekranu.
  if (potvrda.trim().toLowerCase() !== meta.pseudonim.toLowerCase()) {
    return await greska("Prikazani pseudonim se ne poklapa sa nalogom. Osveži spisak.", 400);
  }

  // Roditelj se bira iz pretrage, pa u pravilu stiže po ID-u. Pseudonim ostaje kao
  // rezerva; razrešava se i ako je NAPUŠTEN, jer se ime u međuvremenu moglo
  // promeniti a čovek pamti staro.
  let roditeljId: string | null =
    typeof body.roditeljId === "string" && body.roditeljId.trim() ? body.roditeljId.trim() : null;

  if (!roditeljId) {
    const roditeljPseudonim = body.roditelj;
    if (typeof roditeljPseudonim !== "string" || !roditeljPseudonim.trim()) {
      return await greska("Nije izabran roditelj.", 400);
    }
    roditeljId = await razresiKorisnikaIzAdrese(roditeljPseudonim.trim());
  }
  if (!roditeljId) return await greska("Nalog roditelja nije pronađen.", 404);

  const roditelj = await prisma.user.findUnique({
    where: { id: roditeljId },
    select: { id: true },
  });
  if (!roditelj) return await greska("Nalog roditelja nije pronađen.", 404);

  try {
    const rez = await prevediUMaloletni(id, roditelj.id, datumRodjenja);
    await logAdminAkcija(
      session.user.id,
      "NALOG_PREVEDEN_U_MALOLETNI",
      id,
      `${rez.pseudonim} (${rez.godine} god.) → roditelj ${rez.roditeljPseudonim}; ` +
        `${rez.otpisanoNalogu} POEN poništeno sa zapisa, ${rez.ponistenoPotvrda} potvrda palo, ` +
        `${rez.poenVracenOdDrugih} POEN skinuto drugima (${rez.brojUMinusu} u minusu), ` +
        `${rez.zrnaOtpisana} ZRNA otpisano, ${rez.obrisanoZabelezenih} zabeleženih doprinosa obrisano, ` +
        `${rez.ugasenoProgramaPrijava} prijava na programe ugašeno, ` +
        `${rez.brojPotvrdjivaca} izjašnjenja po čl. 6`,
    );
    return NextResponse.json({ ok: true, ...rez });
  } catch (e) {
    if (e instanceof PrevodGreska) return await greska(e.message, e.status);
    throw e;
  }
}
