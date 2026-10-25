import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { jeCronPoziv } from "@/lib/cron-auth";
import { obradiPunoletstva } from "@/lib/protokol/punoletstvo";
import { obrisiNepreuzeteNaloge } from "@/lib/protokol/deca-poziv";

/**
 * POST /api/cron/deca-punoletstvo
 *
 * Dva posla u istom terminu, oba dnevna i oba nadoknađuju propušteno:
 *
 *  1. **Punoletstvo** (čl. 19) — najava mesec dana ranije, pa na sam dan otpis
 *     POEN-a iz prijateljstava, brisanje prijateljstava, prelazak naloga u
 *     punoletni i potvrde stvarnosti od roditelja.
 *  2. **Nepreuzeti nalozi** (čl. 4b st. 5) — brisanje naloga dece koje niko nije
 *     preuzeo u roku od četrnaest dana od registracije.
 *
 * Termin: dnevno u 20:00 UTC — pre noćne emisije (22:00) i pre isteka roka za
 * potvrde (21:00), da otpis i emisija ne padnu u isti trenutak.
 *
 * 🔴 Poslovi su idempotentni: `punoletstvoNajavaAt` i `punoletstvoObradjenAt`
 * čuvaju da se ni obaveštenje ni otpis ne ponove. Bez toga bi drugo pokretanje
 * istog dana oduzelo POEN dvaput.
 */
export async function POST(req: NextRequest) {
  if (!jeCronPoziv(req)) {
    return await greska("Neautorizovano.", 401);
  }
  // Ugašen modul nema šta da obrađuje, ali ruta ostaje živa da raspored ne puca.
  const punoletstvo = await obradiPunoletstva();
  const nepreuzeti = await obrisiNepreuzeteNaloge();
  console.log(
    `[Deca Cron] Punoletstvo — pregledano ${punoletstvo.pregledano}, obrađeno ${punoletstvo.obradjeno}, najavljeno ${punoletstvo.najavljeno}. ` +
      `Nepreuzeti nalozi — obrisano ${nepreuzeti.obrisano}/${nepreuzeti.pregledano}.`
  );
  return NextResponse.json({ ok: true, punoletstvo, nepreuzeti });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
