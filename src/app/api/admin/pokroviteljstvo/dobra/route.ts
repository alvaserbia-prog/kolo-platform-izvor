import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";

/**
 * GET /api/admin/pokroviteljstvo/dobra — prijave i ugovori o pokroviteljstvu
 * dobrima i uslugama, sa metapodacima dokaza cene (sam fajl ide kroz zasebnu,
 * takođe administratorsku rutu) i vaučerima.
 *
 * Podnosioca, kontakt davaoca i fotografiju cenovnika vidi samo administratorski
 * tim — radi provere da je cenovnik priložen (donacije čl. 13f st. 2); podaci o
 * davaocu su upoređeni sa registrom pri odobrenju upisa (čl. 6a st. 4). 🔴 Cena se ne upoređuje, pa ni izvora cene ni „najniže
 * cene" ovde nema.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);

  const ugovori = await prisma.ugovorDobra.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      podnosilac: { select: { pseudonim: true } },
      upis: { select: { status: true, obrisanAt: true } },
      dokazi: { select: { id: true, vrsta: true, nazivFajla: true, contentType: true, velicina: true, izvorRedni: true } },
      vauceri: {
        orderBy: { createdAt: "asc" },
        select: { id: true, kod: true, status: true, imalac: { select: { pseudonim: true } }, potvrdio: { select: { pseudonim: true } } },
      },
    },
  });
  const vaucerIds = ugovori.flatMap((u) => u.vauceri.map((v) => v.id));
  const prigovori = vaucerIds.length
    ? await prisma.prigovorNaOdluku.findMany({
        where: { tipOdluke: "VAUCER", predmetId: { in: vaucerIds } },
        select: { predmetId: true, status: true },
      })
    : [];

  return NextResponse.json(
    ugovori.map((u) => ({
      id: u.id,
      podnosilacPseudonim: u.podnosilac.pseudonim,
      logoUrl: u.logoUrl,
      vrstaDavaoca: u.vrstaDavaoca,
      bpg: u.bpg,
      naziv: u.naziv,
      pib: u.pib,
      maticniBroj: u.maticniBroj,
      adresaSedista: u.adresaSedista,
      zastupnikImePrezime: u.zastupnikImePrezime,
      zastupnikFunkcija: u.zastupnikFunkcija,
      odnosPremaDavaocu: u.odnosPremaDavaocu,
      kontaktEmail: u.kontaktEmail,
      kontaktTelefon: u.kontaktTelefon,
      izjavaOvlascenjeAt: u.izjavaOvlascenjeAt?.toISOString() ?? null,
      potvrdaEvidentiranjaAt: u.potvrdaEvidentiranjaAt?.toISOString() ?? null,
      // Poređenje sa registrom je izvršeno pri odobrenju upisa (čl. 6a st. 4).
      upisOdobren: u.upis?.status === "ODOBREN" && !u.upis.obrisanAt,
      vrsta: u.vrsta,
      opis: u.opis,
      brojVaucera: u.brojVaucera,
      cenaPoJedinici: Number(u.cenaPoJedinici),
      vrednostRsd: Number(u.vrednostRsd),
      rokVazenjaMeseci: u.rokVazenjaMeseci,
      mesto: u.mesto,
      adresaPredaje: u.adresaPredaje,
      status: u.status,
      odbijenoRazlog: u.odbijenoRazlog,
      ugovorTekst: u.ugovorTekst,
      potpisanoAt: u.potpisanoAt?.toISOString() ?? null,
      kontrolniBroj: u.kontrolniBroj,
      vaziDo: u.vaziDo?.toISOString() ?? null,
      koeficijent: u.koeficijent == null ? null : Number(u.koeficijent),
      poenEvidentirano: u.poenEvidentirano,
      poenaPoVauceru: u.poenaPoVauceru,
      naredniDozvoljenAt: u.naredniDozvoljenAt?.toISOString() ?? null,
      naredniDozvolaRazlog: u.naredniDozvolaRazlog,
      createdAt: u.createdAt.toISOString(),
      dokazi: u.dokazi,
      vauceri: u.vauceri.map((v) => ({
        id: v.id,
        kod: v.kod,
        status: v.status,
        imalacPseudonim: v.imalac?.pseudonim ?? null,
        // Ko je potvrdio realizaciju — podnosilac ili zaposleni davaoca (čl. 30g st. 1).
        potvrdioPseudonim: v.potvrdio?.pseudonim ?? null,
        prigovor: prigovori.find((p) => p.predmetId === v.id)?.status ?? null,
      })),
    })),
  );
}
