/**
 * Potvrda člana bez potvrde posle razgovora telefonom i spisak povezanih
 * (Pravilnik o dokazu stvarnosti čl. 4a, 5c, 5d; set 4.8.3) — ČISTA pravila, bez Prisme.
 *
 *  - Čuvar Kola sme da potvrdi člana bez potvrde posle razgovora telefonom samo kad
 *    je ovaj u Kolu najmanje `DANA_U_KOLU_ZA_RAZGOVOR` dana, protiv njega nije
 *    usvojena prijava razmene ni prijava oglasa, i nije završen nadzorni predmet
 *    utvrđenjem lažne verifikacije (čl. 5c st. 2). Iste uslove ispunjava i ko traži
 *    razgovor radi potvrde (čl. 5c st. 3).
 *  - Svakome na spisku Fondacija obezbeđuje poziv u roku od `ROK_POZIVA_DANA` dana;
 *    upisnik ZRNA je prvi, a njemu u roku od `ROK_POZIVA_UPISNIKA_ZRNA_DANA` dana (čl. 4a).
 *  - Spisak povezanih: jedan nivo naniže (koje je uveo dok je bio bez potvrde) i
 *    jedan naviše (ko je njega uveo), samo dok su još članovi bez potvrde (čl. 5d).
 *    Potvrda uvodioca je izuzetak od čl. 12 i uvek je u nadzoru (čl. 5d st. 3).
 *
 * 🔴 Potvrda nikad ne nastupa automatski — svaka je lična odluka onoga ko potvrđuje.
 *
 * Bez Prisme: uvozi ga i pretraživač.
 */

/** Najmanje dana u Kolu pre potvrde posle razgovora telefonom (čl. 5c st. 2 t. 1). */
export const DANA_U_KOLU_ZA_RAZGOVOR = 30;

/** Rok u kome Fondacija obezbeđuje poziv svakome na spisku za poziv (čl. 4a). */
export const ROK_POZIVA_DANA = 7;

/** Rok u kome Fondacija obezbeđuje poziv upisniku ZRNA (čl. 4a). */
export const ROK_POZIVA_UPISNIKA_ZRNA_DANA = 3;

const DAN_MS = 24 * 60 * 60 * 1000;

export type UslovRazgovora = "TRIDESET_DANA" | "PRIJAVA" | "NADZOR";

export type ProveraRazgovora =
  | { ok: true }
  | { ok: false; uslov: UslovRazgovora; /** Samo kod TRIDESET_DANA: od kada je uslov ispunjen. */ odDana: Date | null };

/**
 * Uslovi iz čl. 5c st. 2. `uvedenAt` je trenutak uvođenja u Kolo (verifikaciona
 * veza); `null` znači da učesnik nije uveden.
 */
export function proveriUsloveRazgovora(u: {
  uvedenAt: Date | null;
  usvojenihPrijava: number;
  utvrdjenihLaznih: number;
  sada: Date;
}): ProveraRazgovora {
  if (u.usvojenihPrijava > 0) return { ok: false, uslov: "PRIJAVA", odDana: null };
  if (u.utvrdjenihLaznih > 0) return { ok: false, uslov: "NADZOR", odDana: null };
  if (!u.uvedenAt) return { ok: false, uslov: "TRIDESET_DANA", odDana: null };
  const od = new Date(u.uvedenAt.getTime() + DANA_U_KOLU_ZA_RAZGOVOR * DAN_MS);
  if (u.sada < od) return { ok: false, uslov: "TRIDESET_DANA", odDana: od };
  return { ok: true };
}

/** Do kada Fondacija obezbeđuje poziv upisniku ZRNA (čl. 4a). */
export function rokPozivaUpisnika(naSpiskuOd: Date): Date {
  return new Date(naSpiskuOd.getTime() + ROK_POZIVA_UPISNIKA_ZRNA_DANA * DAN_MS);
}

/** Do kada Fondacija obezbeđuje poziv onome ko je na spisku (čl. 4a); upisniku ZRNA kraći rok. */
export function rokPoziva(naSpiskuOd: Date, upisnikZrna: boolean): Date {
  return upisnikZrna ? rokPozivaUpisnika(naSpiskuOd) : new Date(naSpiskuOd.getTime() + ROK_POZIVA_DANA * DAN_MS);
}

/**
 * Redosled spiska za poziv: upisnici ZRNA koji traže potvrdu prvi (čl. 4a), pa svi
 * ostali po vremenu dospeća.
 */
export function redosledSpiska<T extends { prioritet: boolean; createdAt: Date | string }>(redovi: T[]): T[] {
  const t = (x: Date | string) => (typeof x === "string" ? Date.parse(x) : x.getTime());
  return [...redovi].sort((a, b) => Number(b.prioritet) - Number(a.prioritet) || t(a.createdAt) - t(b.createdAt));
}

export type Povezan = { userId: string; smer: "NANIZE" | "NAVISE" };

/**
 * Spisak povezanih (čl. 5d st. 1) iz grafa: `uveo` su uvođenja koja je učesnik obavio
 * dok je bio član bez potvrde, `uvodilac` je onaj ko je njega uveo. Ostaju samo oni
 * koji su još članovi bez potvrde (`bezPotvrde`).
 */
export function spisakPovezanih(u: {
  uveo: string[];
  uvodilac: string | null;
  bezPotvrde: (id: string) => boolean;
}): Povezan[] {
  const out: Povezan[] = [];
  const vidjeni = new Set<string>();
  for (const id of u.uveo) {
    if (vidjeni.has(id) || !u.bezPotvrde(id)) continue;
    vidjeni.add(id);
    out.push({ userId: id, smer: "NANIZE" });
  }
  if (u.uvodilac && !vidjeni.has(u.uvodilac) && u.bezPotvrde(u.uvodilac)) {
    out.push({ userId: u.uvodilac, smer: "NAVISE" });
  }
  return out;
}
