/**
 * Datum stupanja na snagu nove verzije akata (Admin → Politika).
 *
 * Uslovi čl. 43 st. 3 i Pravilnik čl. 57 st. 2: izmena se objavljuje PRE stupanja na
 * snagu. Zato se u `PolitikaVerzija.efektivnaOd` sme upisati i dan u budućnosti:
 * obaveštenje ide odmah pri upisu, a pristanak se traži tek od tog dana —
 * `pristanakStatus()` i `upisiPrihvatanjeTekuceVerzije()` već čitaju samo verzije sa
 * `efektivnaOd <= sada`.
 *
 * Dan je kalendarski dan po srpskom vremenu; verzija stupa na snagu u ponoć kojom
 * taj dan počinje. Današnji dan znači „od trenutka upisa". Prošli dan se odbija —
 * stupanje se ne upisuje unazad.
 *
 * Bez Prisme.
 */
import { beogradskiDan, ponocUSrbiji } from "@/lib/protokol/obracunski-dan";

export type IshodStupanja = { ok: true; efektivnaOd: Date; unapred: boolean } | { ok: false; razlog: string };

export function trenutakStupanja(unos: unknown, sada: Date = new Date()): IshodStupanja {
  if (unos === undefined || unos === null || unos === "") return { ok: true, efektivnaOd: sada, unapred: false };
  if (typeof unos !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(unos.trim()))
    return { ok: false, razlog: "Datum stupanja na snagu nije ispravan (očekuje se GGGG-MM-DD)." };
  const [g, m, d] = unos.trim().split("-").map(Number);
  const dan = new Date(Date.UTC(g, m - 1, d));
  if (dan.getUTCFullYear() !== g || dan.getUTCMonth() !== m - 1 || dan.getUTCDate() !== d)
    return { ok: false, razlog: "Datum stupanja na snagu nije ispravan (očekuje se GGGG-MM-DD)." };
  const danas = beogradskiDan(sada);
  if (dan.getTime() < danas.getTime())
    return { ok: false, razlog: "Datum stupanja na snagu ne može biti u prošlosti." };
  if (dan.getTime() === danas.getTime()) return { ok: true, efektivnaOd: sada, unapred: false };
  return { ok: true, efektivnaOd: ponocUSrbiji(dan), unapred: true };
}
