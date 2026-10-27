import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { obradiNabavke } from "@/lib/protokol/nabavka";
import { obradiVaucere } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * GET /api/cron/nabavke
 *
 * Jedan prolaz kroz sve nabavke u toku (Pravilnik o projektima i kolektivnim
 * nabavkama čl. 19–22, 26, 10 st. 3):
 *   1. istekle prijave → utvrdi red i pošalji prve pozive;
 *   2. istekli pozivi → mesto se oslobađa;
 *   3. potvrđeni koji nisu došli svog dana → mesto se oslobađa;
 *   4. oslobođena mesta → poziv ide sledećem u redu;
 *   5. istekao period preuzimanja → nabavka se zatvara i brišu se predlozi te reči;
 *   6. predlozi stariji od dvanaest meseci se brišu;
 *   7. istekli vaučeri iz pokroviteljstva dobrima i uslugama prestaju (status
 *      ISTEKAO). 🔴 Poništenje izvršeno pri uzimanju se NE ispravlja i POEN se ne
 *      vraća (nabavke čl. 34 st. 4) — rezervacije kod vaučera nema od seta 4.7.8.
 *      Raspodela je projekat iste vrste, pa ide istim noćnim poslom.
 *
 * 🔴 Bez ovog posla mehanizam stoji: poziv istekne a niko ga ne obori, mesto se ne
 * oslobodi i sledeći u redu nikad ne dobije priliku. Rolanje poziva je jedina stvar
 * u ovom mehanizmu koju ne pokreće ničiji klik.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = bearerSecret ?? req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }

  const izvestaj = await obradiNabavke();
  const vauceri = await obradiVaucere();
  return NextResponse.json({ ok: true, ...izvestaj, vauceraIsteklo: vauceri.isteklo });
}
