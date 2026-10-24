import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ucitajUcesnika } from "@/lib/protokol/deca";
import { smeVidetiSpisakSkole } from "@/lib/deca-pravila";
import {
  decaSkole,
  pozicijaPoBroju,
  rangirajPoBroju,
  rangirajPoProcentu,
  razresiSkolu,
  redoviSkola,
  udeoUkljucenosti,
} from "@/lib/protokol/skole";

/**
 * Jedna škola: mesto na obe nacionalne liste i spisak njene dece.
 *
 * 🔴 Spisak dece vidi SAMO PUNOPRAVNO DETE SVOJE ŠKOLE (odluka vlasnika,
 * 31.08.2026; suženo uz R-03, 13.09.2026). Punoletnom nalogu, gostu, detetu koje
 * još čeka roditelja i detetu druge škole se ne šalje uopšte — vraćaju se samo
 * brojevi i mesto na listama. Oba uslova i razlozi: `smeVidetiSpisakSkole`.
 *
 * Dotad ga je dobijao svako ko je prijavljen, dakle i nalog otvoren pre dva
 * minuta, i to sa PSEUDONIMOM, SLIČICOM i TEKUĆIM STANJEM POENA, poređan od
 * najbogatijeg deteta. Zatvoren profil (`pristupProfiluDeteta`) izričito krije
 * sliku, mesto, školu i stanje — a spisak je nosio upravo to, sabrano i
 * rangirano, samo sa druge strane. Uz to ga roditeljski prekidač nije dodirivao:
 * roditelj koji je isključio komunikaciju sa odraslima i dalje je imao dete na
 * javnoj listi, sa licem i iznosom.
 *
 * Nacionalne liste i svi brojevi ostaju svima — one pokreću ceo mehanizam i ne
 * imenuju nikoga.
 *
 * Sa spiska se NE ulazi ni u čiji profil: klik na dete vodi na zatvoren prikaz.
 * Lista pokazuje da dete postoji — ona nije vrata.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sifra: string }> }
) {
  const { sifra } = await params;
  const skola = razresiSkolu(sifra);
  if (!skola) return await greska("Škola nije pronađena.", 404);

  const redovi = await redoviSkola(skola.tip);
  const poBroju = rangirajPoBroju(redovi);
  const poProcentu = rangirajPoProcentu(redovi);
  const moj = redovi.find((r) => r.sifra === skola.sifra);
  const brojDece = moj?.dece ?? 0;

  const session = await getServerSession(authOptions);
  const posmatrac = session ? await ucitajUcesnika(session.user.id) : null;
  const deca = smeVidetiSpisakSkole(posmatrac, skola.sifra)
    ? await decaSkole(skola.sifra)
    : null;

  return NextResponse.json({
    skola,
    brojDece,
    procenat: udeoUkljucenosti(brojDece, skola.ucenika),
    pozicijaPoBroju: pozicijaPoBroju(poBroju, skola.sifra),
    mestoPoProcentu: poProcentu.findIndex((r) => r.sifra === skola.sifra) + 1 || null,
    ukupnoSkola: redovi.length,
    deca,
  });
}
