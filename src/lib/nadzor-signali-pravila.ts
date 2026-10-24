/**
 * Signali uz verifikaciju i potvrdu koja čeka nadzor (Pravilnik o dokazu stvarnosti
 * čl. 11 st. 8, set 4.8.2).
 *
 * 🔴 Signal NIJE ishod nadzora i ne menja tok: svaka verifikacija koja podleže
 * nadzoru (čl. 9, 10) ide u nadzor i bez signala. Signal samo kaže nadzorniku gde da
 * pogleda prvo i zašto. Ne čuva se — računa se pri svakom prikazu iz podataka koje
 * sistem već ima (vreme verifikacije, vrsta verifikacije, razmene, mesto). Nikad iz
 * IP adrese ni otiska uređaja.
 *
 * Set 4.8.2: ukinut je signal „potvrđen van lanca" (potvrde uplatom i registrom više
 * nema). „Po pozivu" sada znači da je ova verifikacija uvođenje u Kolo sa spiska za
 * poziv; dodat je signal da je verifikator u trenutku verifikacije bio član bez
 * potvrde, a uz potvrdu člana bez potvrde i korak automatske potvrde lanca.
 *
 * Bez Prisme: uvozi ga i pretraživač.
 */

/** Verifikacija je druga ili kasnija koju je verifikator obavio istog dana. */
export const SIGNAL_OD_POTVRDE_U_DANU = 2;

/** Stepenici bez razmene posle verifikacije, u danima. Prikazuje se najviši dostignut. */
export const DANI_BEZ_RAZMENE = [7, 14, 30] as const;

export type SignalNadzora =
  | { kod: "VISE_U_DANU"; redni: number }
  | { kod: "BEZ_POTVRDE" }
  | { kod: "PO_POZIVU" }
  | { kod: "BEZ_RAZMENE"; dana: number }
  | { kod: "DRUGO_MESTO" }
  | { kod: "LANAC"; korak: number }
  | { kod: "UVODILAC" };

export type UlazSignala = {
  /** Koja je ovo po redu verifikacija (ili potvrda) verifikatora tog dana (1 = prva). */
  redniUDanu: number;
  /** Verifikator je u trenutku verifikacije bio član bez potvrde (čl. 5a). */
  verifikatorBezPotvrde: boolean;
  /** Ovo je uvođenje u Kolo sa spiska za poziv (čl. 4a, čl. 5 st. 7). */
  uvodjenjeSaSpiska: boolean;
  /** Pun broj dana od verifikacije do sada. */
  danaOdPotvrde: number;
  /** Verifikovani je posle verifikacije obavio bar jednu razmenu (bilo sa kim). */
  potvrdjeniRazmenio: boolean;
  /** Mesta obe strane; `null` kad mesto nije upisano. */
  mestoVerifikatora: string | null;
  mestoPotvrdjenog: string | null;
  /** Verifikator i verifikovani su ikad razmenili jedan sa drugim. */
  medjusobnaRazmena: boolean;
};

/** Signali uz verifikaciju (potvrdu ili uvođenje u Kolo). */
export function signaliPotvrde(u: UlazSignala): SignalNadzora[] {
  const s: SignalNadzora[] = [];
  if (u.redniUDanu >= SIGNAL_OD_POTVRDE_U_DANU) s.push({ kod: "VISE_U_DANU", redni: u.redniUDanu });
  if (u.verifikatorBezPotvrde) s.push({ kod: "BEZ_POTVRDE" });
  if (u.uvodjenjeSaSpiska) s.push({ kod: "PO_POZIVU" });
  if (!u.potvrdjeniRazmenio) {
    const dostignut = [...DANI_BEZ_RAZMENE].reverse().find((d) => u.danaOdPotvrde >= d);
    if (dostignut) s.push({ kod: "BEZ_RAZMENE", dana: dostignut });
  }
  if (
    u.mestoVerifikatora &&
    u.mestoPotvrdjenog &&
    u.mestoVerifikatora.trim().toLowerCase() !== u.mestoPotvrdjenog.trim().toLowerCase() &&
    !u.medjusobnaRazmena
  ) {
    s.push({ kod: "DRUGO_MESTO" });
  }
  return s;
}

/**
 * Signali uz potvrdu člana bez potvrde i uz potvrdu postojanja deteta (čl. 10 st. 5,
 * čl. 11; otvoreno pitanje 20): koja je po redu u danu (za potvrdu koju je dao
 * čovek), potvrda posle razgovora telefonom (čl. 5c), potvrda uvodioca sa spiska
 * povezanih (čl. 5d st. 3) i korak automatske potvrde lanca (stari zapisi).
 */
export function signaliPotvrdeClana(u: {
  redniUDanu: number | null;
  korakLanca: number | null;
  telefonom?: boolean;
  premaUvodiocu?: boolean;
}): SignalNadzora[] {
  const s: SignalNadzora[] = [];
  if (u.redniUDanu !== null && u.redniUDanu >= SIGNAL_OD_POTVRDE_U_DANU) {
    s.push({ kod: "VISE_U_DANU", redni: u.redniUDanu });
  }
  if (u.telefonom) s.push({ kod: "PO_POZIVU" });
  if (u.premaUvodiocu) s.push({ kod: "UVODILAC" });
  if (u.korakLanca !== null && u.korakLanca > 0) s.push({ kod: "LANAC", korak: u.korakLanca });
  return s;
}
