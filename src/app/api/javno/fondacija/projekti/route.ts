import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { dohvatiDinarskuStranuProjekata, dohvatiGodisnjiProjektniPregled } from "@/lib/protokol/fondacija";

/**
 * GET /api/javno/fondacija/projekti
 *
 * Deo izveštaja o raspolaganju sredstvima Fondacije (Pravilnik čl. 7 st. 5):
 * dinarska strana svake nabavke u celini — sve ponude sa iznosima i nazivom
 * ponuđača, izabrani dobavljač, nabavna cena po jedinici, ukupan dinarski trošak i
 * njegov odnos prema gornjoj granici — i vrednost ugovora o pokroviteljstvu dobrima i
 * uslugama (nabavke čl. 37 st. 2), uz godišnji zbir (čl. 37 st. 5). Javno, i bez prijave.
 *
 * 🔴 Ovde nema broja POEN-a: dinarska strana stoji ODVOJENO od kalkulacije (čl. 18
 * st. 2), jer broj POEN-a po delu nije cena dobra (čl. 17; R-01). Kalkulacija bez
 * dinara je na `GET /api/nabavke/[id]`. Brana: `nabavka-dinarska-strana-izvor.test.ts`.
 */
export async function GET() {
  try {
    const [strana, godisnji] = await Promise.all([
      dohvatiDinarskuStranuProjekata(),
      dohvatiGodisnjiProjektniPregled(),
    ]);
    return NextResponse.json({ godisnji, ...strana });
  } catch (e) {
    return await greska(String(e), 500);
  }
}
