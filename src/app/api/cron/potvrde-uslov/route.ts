import { NextRequest, NextResponse } from "next/server";
import { probajEvidentiratiGazdinstvo } from "@/lib/protokol/gazdinstvo";
import { greska } from "@/lib/greska-api";
import { jeCronPoziv } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { probajEvidentiratiPotvrde } from "@/lib/protokol/potvrda-poen";
import { PotvrdaPoenStatus } from "@/generated/prisma/client";
import { podsetiNaZakasnelePozive } from "@/lib/protokol/zahtev-razgovor";

/**
 * POST /api/cron/potvrde-uslov
 *
 * Kupi zabeležene potvrde čiji je uslov u međuvremenu ispunjen i upisuje POEN
 * (Pravilnik o dokazu stvarnosti čl. 19).
 *
 * 🔴 ZAŠTO POSTOJI, kad okidači već zovu `probajEvidentiratiPotvrde` na sva četiri
 * mesta (odobren oglas, potvrđena javna donacija, potvrđeno pokroviteljstvo,
 * verifikovan operativni doprinos): okidač je jedna linija u tuđem toku i lako je
 * promakne nova putanja ka istom kanalu — a tada bi POEN čekao zauvek, bez ijedne
 * greške i bez ikoga ko bi primetio. Uz to okidač ne hvata pad emisije: `potvrda-poen`
 * tada vraća vezu u ZABELEZEN, a nju posle toga niko ne bi ponovo pokušao.
 *
 * Isti razlog iz kog je `glasanje-zatvaranje` morao da dobije cron pored lenjog
 * poziva iz tri ekrana.
 *
 * Pokreće se dnevno (05:30). Idempotentno — prelaz u EVIDENTIRAN rezerviše uslovan
 * `updateMany`, pa ponovljeno pokretanje ne upisuje POEN dvaput.
 */

/** Koliko korisnika se obrađuje u jednom pokretanju. Ostatak čeka sutrašnji prolaz. */
const MAX_KORISNIKA = 500;

/** Budžet izvršenja — Vercel funkcija ne sme da se prekine u pola emisije. */
const BUDZET_MS = 40_000;

export async function POST(req: NextRequest) {
  if (!jeCronPoziv(req)) {
    return await greska("Neautorizovano.", 401);
  }

  const pocetak = Date.now();

  // Jedan red po čoveku: `probajEvidentiratiPotvrde` sam prolazi kroz sve njegove
  // zabeležene potvrde i trag učešća računa jednom.
  const redovi = await prisma.verifikacionaVeza.findMany({
    where: { poenStatus: PotvrdaPoenStatus.ZABELEZEN },
    select: { verifikovaniId: true },
    distinct: ["verifikovaniId"],
    orderBy: { vremenskiZig: "asc" },
    take: MAX_KORISNIKA,
  });

  let upisanoPotvrda = 0;
  let obradjenoKorisnika = 0;
  let prekinuto = false;

  for (const red of redovi) {
    if (Date.now() - pocetak > BUDZET_MS) {
      prekinuto = true;
      break;
    }
    upisanoPotvrda += await probajEvidentiratiPotvrde(red.verifikovaniId);
    obradjenoKorisnika += 1;
  }

  // Doprinos gazdinstva (Pravilnik o gazdinstvima čl. 16) — mreža za slučaj da je neki okidač
  // (oglas, potvrda, odobrenje) promašio. `probajEvidentiratiGazdinstvo` ne baca.
  const gazdinstvaZabelezena = await prisma.doprinosGazdinstva.findMany({
    where: { status: "ZABELEZEN", gazdinstvo: { status: "ODOBRENO" } },
    select: { userId: true },
    take: MAX_KORISNIKA,
  });
  let evidentiranoGazdinstva = 0;
  for (const d of gazdinstvaZabelezena) {
    if (Date.now() - pocetak > BUDZET_MS) {
      prekinuto = true;
      break;
    }
    if (await probajEvidentiratiGazdinstvo(d.userId)) evidentiranoGazdinstva += 1;
  }

  console.log(
    `[Potvrde — uslov] Korisnika pregledano: ${obradjenoKorisnika}/${redovi.length}, ` +
      `upisanih potvrda: ${upisanoPotvrda}${prekinuto ? " (prekinuto zbog budžeta)" : ""}`,
  );

  // Podsetnik Fondaciji dok ima zakasnelih poziva sa spiska (dokaz stvarnosti čl. 11; odluka vlasnika
  // 24.10.2026). Ide uz ovaj jutarnji prolaz da ne bi trebao nov cron; ne baca.
  const zakasnelihPoziva = await podsetiNaZakasnelePozive();

  return NextResponse.json({
    ok: true,
    zakasnelihPoziva,
    obradjenoKorisnika,
    ukupnoSaZabelezenim: redovi.length,
    upisanoPotvrda,
    evidentiranoGazdinstva,
    prekinuto,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
