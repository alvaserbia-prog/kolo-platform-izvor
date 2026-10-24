import { promises as fs } from "fs";
import path from "path";

const BAZA = path.join(process.cwd(), "dokumentacija 4.1");

// Jezici koji imaju sopstveni podfolder sa prevodima (`dokumentacija 4.1/<kod>/`).
// "sr" i "sr-Cyrl" NISU ovde: srpski je original u korenu, a ćirilica se izvodi
// transliteracijom u prikazu (vidi CirilicaProvider) — isti fajl.
//
// Spisak mora da prati jezike iz `src/i18n/routing.ts`. Do 2026-08-09 su ovde bili
// samo en i ru, pa su hrvatski i mađarski posetioci — kojima je interfejs preveden —
// pravne akte dobijali na srpskom, bez ikakvog traga u logu. Uslovi čl. 44 su uz to
// tvrdili da mađarski prevod postoji, a nije ga bilo.
const PREVEDENI: Record<string, string> = {
  en: "en",
  ru: "ru",
  hr: "hr",
  hu: "hu",
};

/**
 * Napomena koja ide NA VRH srpskog originala kad prevod tog akta nedostaje.
 *
 * 🔴 Do 2026-09-13 je fallback bio NEM: čitalac na engleskom bi dobio srpski
 * tekst bez ijedne reči o tome, a upravo tako su hrvatski i mađarski posetioci
 * mesecima dobijali srpske akte. Ćutanje je najgore baš kod akata — čitalac ne
 * može ni da proveri da li gleda ono što je tražio.
 *
 * Oblik je blockquote, isti kao zvanični disklejmer na vrhu svakog prevoda.
 *
 * 🔴 Tekst NE SME da sadrži zvaničan disklejmer prevoda („Neslužbeni prijevod",
 * „Nem hivatalos fordítás") — po njemu `pravni-dokumenti.test.ts` razlikuje
 * serviran prevod od fallbacka.
 */
const NAPOMENA_BEZ_PREVODA: Record<string, string> = {
  en: "> **Translation not yet published.** The translation of this version of the act has not been published yet, so the Serbian original is shown below. The Serbian original is in any case the legally binding version.",
  ru: "> **Перевод ещё не опубликован.** Перевод этой версии акта ещё не опубликован, поэтому ниже приведён сербский оригинал. Сербский оригинал в любом случае является юридически обязывающей версией.",
  hr: "> **Prijevod još nije objavljen.** Prijevod ove verzije akta još nije objavljen, pa je niže prikazan srpski izvornik. Srpski izvornik u svakom je slučaju pravno obvezujuća verzija.",
  hu: "> **A fordítás még nem jelent meg.** Az akta ezen változatának fordítása még nem jelent meg, ezért alább a szerb eredeti olvasható. Mindenképpen a szerb eredeti a jogilag kötelező változat.",
};

/**
 * Učitava pravni markdown dokument za dati jezik.
 *
 * Za jezik sa sopstvenim folderom pokušava `dokumentacija 4.1/<kod>/<file>`; ako
 * prevod tog akta još NE postoji, vraća srpski original — ali sa napomenom na vrhu
 * i uz upozorenje u logu. Stranica nikad ne puca (pad bi značio 500 na javnoj
 * pravnoj stranici, što je za čitaoca gore od obeleženog originala), ali fallback
 * više nije nem.
 *
 * Prevodi sadrže na vrhu zvaničnu napomenu da je merodavan srpski original.
 */
export async function ucitajPravniDokument(file: string, locale: string): Promise<string> {
  const podfolder = PREVEDENI[locale];
  if (podfolder) {
    try {
      return await fs.readFile(path.join(BAZA, podfolder, file), "utf-8");
    } catch {
      // Prevod još nije dodat — srpski original, ali obeležen i zabeležen.
      console.warn(`[pravni-dokument] nedostaje prevod ${podfolder}/${file} — serviran srpski original`);
      const original = await fs.readFile(path.join(BAZA, file), "utf-8");
      const napomena = NAPOMENA_BEZ_PREVODA[locale];
      return napomena ? `${napomena}\n\n${original}` : original;
    }
  }
  return fs.readFile(path.join(BAZA, file), "utf-8");
}
