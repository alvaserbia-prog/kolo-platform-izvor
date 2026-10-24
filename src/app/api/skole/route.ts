import { NextRequest, NextResponse } from "next/server";
import { ranglisteSkola, skolePostoje, type TipSkole } from "@/lib/protokol/skole";

/**
 * Nacionalne rang-liste škola — po broju uključene dece i po udelu uključenosti.
 *
 * 🔴 Ruta je OTVORENA i neprijavljenom posetiocu: ovo je čist zbir, bez ijednog
 * imena. Spisak dece jedne škole je druga ruta (`/api/skole/[sifra]`) i on traži
 * prijavu — po čl. 13 gostu nije dostupan ni oglas maloletnog korisnika, pa mu
 * spisak dece ne sme biti dostupniji od toga.
 *
 * Osnovne i srednje škole se traže odvojeno: u jednoj listi bi gimnazija sa
 * devetsto đaka pregazila seosku osnovnu školu i po broju i po procentu, pa bi
 * procentualna lista izgubila baš ono zbog čega postoji.
 */
export async function GET(req: NextRequest) {
  if (!skolePostoje()) return NextResponse.json({ spisakPrazan: true });

  const trazen = req.nextUrl.searchParams.get("tip");
  const tip: TipSkole = trazen === "SREDNJA" ? "SREDNJA" : "OSNOVNA";

  const { poBroju, poProcentu } = await ranglisteSkola(tip);
  return NextResponse.json({ tip, poBroju, poProcentu });
}
