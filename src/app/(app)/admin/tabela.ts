/**
 * Tabele admin panela — jedan stil zaglavlja i ćelije (ujednačavanje 02.11.2026).
 * Pre ovoga je `<th>` postojao u pet oblika (različit razmak, `font-medium` i
 * `font-semibold`, siva podloga zaglavlja ili linija). Admin je alat operative i sme
 * biti gušći, ali sa istim tokenima.
 *
 *   <table className={KLASE_TABELE}>
 *     <thead><tr className={KLASE_ZAGLAVLJA}><th className={klaseTh()}>…</th></tr></thead>
 *     <tbody><tr className={KLASE_REDA}><td className={klaseTd()}>…</td></tr></tbody>
 *   </table>
 *
 * `gusto` je za tabelu u tabeli ili u uskom okviru (spisak vaučera po ugovoru).
 */
export type Poravnanje = "levo" | "desno" | "centar";

const PORAVNANJE: Record<Poravnanje, string> = { levo: "text-left", desno: "text-right", centar: "text-center" };

export const KLASE_TABELE = "w-full text-sm";
/** Red zaglavlja (`<tr>` u `<thead>`). */
export const KLASE_ZAGLAVLJA = "border-b border-kolo-border";
/** Red tela tabele. */
export const KLASE_REDA = "border-b border-kolo-border last:border-0";

export function klaseTh(poravnanje: Poravnanje = "levo", { gusto = false }: { gusto?: boolean } = {}) {
  return `${gusto ? "px-2 py-1" : "px-3 py-2.5"} ${PORAVNANJE[poravnanje]} text-xs font-medium text-kolo-muted`;
}

export function klaseTd(poravnanje: Poravnanje = "levo", { gusto = false }: { gusto?: boolean } = {}) {
  return `${gusto ? "px-2 py-1" : "px-3 py-2.5"} ${PORAVNANJE[poravnanje]} align-top`;
}

export const KLASE_TH = klaseTh();
export const KLASE_TD = klaseTd();
