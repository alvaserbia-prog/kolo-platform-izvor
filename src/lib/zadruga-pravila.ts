/**
 * Čista pravila Modula Zadruga — Pravilnik o zadrugama (set 4.7.0).
 *
 * Bez Prisme: uvozi ih i pretraživač (prikaz pragova na `/zadruge`), a servis
 * `protokol/zadruga.ts` ih re-eksportuje, pa server ima jedan ulaz.
 *
 * 🔴 Krug i zadruga su ISTI kolektivni oblik pod drugim imenom (čl. 11). Zato je
 * tabela pragova jedna, i čita je i `protokol/krug.ts` — dve kopije bi se razišle
 * pri prvoj izmeni, a dostignut prag bi se, posle prelaska kruga u zadrugu,
 * merio po drugoj tabeli.
 */

/** Čl. 10 — pragovi broja zadrugara i POEN koji se po njima evidentira. */
export const PRAGOVI_RASTA: readonly { clanovi: number; poen: number }[] = [
  { clanovi: 5, poen: 50_000 },
  { clanovi: 10, poen: 100_000 },
  { clanovi: 20, poen: 200_000 },
  { clanovi: 50, poen: 500_000 },
  { clanovi: 100, poen: 1_000_000 },
  { clanovi: 200, poen: 2_000_000 },
  { clanovi: 500, poen: 5_000_000 },
];

/** Čl. 5 t. 2 — zapis zadruge se otvara (prvi prag) sa najmanje pet zadrugara. */
export const MIN_ZADRUGARA = PRAGOVI_RASTA[0].clanovi;

/**
 * Čl. 6 st. 2 (set 4.7.1) — PRVA zadruga na lokalitetu traži najmanje pedeset
 * REDOVNIH članova tog lokaliteta, i u njenom osnivanju učestvuje Fondacija.
 * Svaka sledeća na istom lokalitetu ide na inicijativu korisnika i za nju ovaj
 * uslov ne važi (st. 3) — dovoljno je pet zadrugara iz čl. 5.
 *
 * 🔴 Dva uslova, dva broja: 50 je uslov LOKALITETA, 5 je najmanji broj
 * ZADRUGARA. Ne mešati ih (odluka vlasnika, 18.10.2026).
 */
export const PRAG_PRVE_ZADRUGE = 50;

/** Koliko redovnih članova lokalitet mora da ima za NOVU zadrugu. */
export function pragLokalitetaZaNovuZadrugu(postojiZadrugaNaLokalitetu: boolean): number {
  return postojiZadrugaNaLokalitetu ? 0 : PRAG_PRVE_ZADRUGE;
}

/**
 * Čl. 11 — pragovi koji su dostignuti a još nisu evidentirani.
 *
 * Svaki prag jednom: ono što je već upisano (i kao krug) se ne vraća, a pad broja
 * zadrugara ništa ne otpisuje. Vraća SVE dospele pragove, ne samo poslednji — ako
 * broj skoči 9 → 11, prag 10 ne sme da se preskoči.
 */
export function dospeliPragovi(
  brojZadrugara: number,
  vecEvidentirani: readonly number[],
): { clanovi: number; poen: number }[] {
  const upisani = new Set(vecEvidentirani);
  return PRAGOVI_RASTA.filter((p) => brojZadrugara >= p.clanovi && !upisani.has(p.clanovi));
}

/** Sledeći prag koji zadruga još nije dostigla (za prikaz), ili `null`. */
export function sledeciPrag(brojZadrugara: number): { clanovi: number; poen: number } | null {
  return PRAGOVI_RASTA.find((p) => brojZadrugara < p.clanovi) ?? null;
}

// ── Osnovi zapisa (čl. 13) ──────────────────────────────────────────────────

/**
 * Osnovi zapisa zadruge. Svaki ide sopstvenim tipom transakcije — nikad
 * `TRANSFER` (pravilo 5): brojač razmena i zbir prepisa među korisnicima ne smeju
 * ih brojati, a osnov mora ostati u zapisu zauvek.
 *
 * - `PRIJEM`    zadruga → korisnik: dobro primljeno na raspodelu (čl. 14 st. 1)
 * - `DOPRINOS`  zadruga → izvršilac: zadružni doprinos (čl. 17)
 * - `USLUGA_PRIMLJENA` zadruga → korisnik: usluga koju zadruga prima (čl. 13 t. 5)
 * - `IZDAVANJE` zadrugar ili druga zadruga → zadruga: dobro izdato iz raspodele (čl. 14 st. 2)
 * - `OPREMA`    zadrugar → zadruga: korišćenje opreme, mehanizacije, zemljišta (čl. 13 t. 4)
 * - `USLUGA_PRUZENA` zadrugar → zadruga: usluga koju zadruga pruža (čl. 13 t. 5)
 */
export const OSNOVI_IZ_ZAPISA = ["PRIJEM", "DOPRINOS", "USLUGA_PRIMLJENA"] as const;
export const OSNOVI_U_ZAPIS = ["IZDAVANJE", "OPREMA", "USLUGA_PRUZENA"] as const;

export type OsnovIzZapisa = (typeof OSNOVI_IZ_ZAPISA)[number];
export type OsnovUZapis = (typeof OSNOVI_U_ZAPIS)[number];
export type OsnovZapisa = OsnovIzZapisa | OsnovUZapis;

export function jeOsnovIzZapisa(x: unknown): x is OsnovIzZapisa {
  return typeof x === "string" && (OSNOVI_IZ_ZAPISA as readonly string[]).includes(x);
}
export function jeOsnovUZapis(x: unknown): x is OsnovUZapis {
  return typeof x === "string" && (OSNOVI_U_ZAPIS as readonly string[]).includes(x);
}

/** Tip transakcije po osnovu — jedno mesto, da prikaz i upis ne bi pričali dva jezika. */
export const TIP_PO_OSNOVU = {
  PRIJEM: "ZADRUGA_PRIJEM",
  DOPRINOS: "ZADRUGA_DOPRINOS",
  USLUGA_PRIMLJENA: "ZADRUGA_USLUGA",
  IZDAVANJE: "ZADRUGA_IZDAVANJE",
  OPREMA: "ZADRUGA_OPREMA",
  USLUGA_PRUZENA: "ZADRUGA_USLUGA",
} as const satisfies Record<OsnovZapisa, string>;

/** Ključ opisa u `messages` (namespace `transakcije`) po osnovu. */
export const OPIS_PO_OSNOVU: Record<OsnovZapisa, string> = {
  PRIJEM: "transakcije.zadruga_prijem",
  DOPRINOS: "transakcije.zadruga_doprinos",
  USLUGA_PRIMLJENA: "transakcije.zadruga_usluga",
  IZDAVANJE: "transakcije.zadruga_izdavanje",
  OPREMA: "transakcije.zadruga_oprema",
  USLUGA_PRUZENA: "transakcije.zadruga_usluga",
};

/** Srpski opis — rezerva u `Transaction.description` (uvek popunjen). */
export const OPIS_SR: Record<OsnovZapisa, string> = {
  PRIJEM: "Zadruga — dobro primljeno na raspodelu",
  DOPRINOS: "Zadruga — zadružni doprinos",
  USLUGA_PRIMLJENA: "Zadruga — usluga",
  IZDAVANJE: "Zadruga — dobro izdato iz raspodele",
  OPREMA: "Zadruga — korišćenje opreme",
  USLUGA_PRUZENA: "Zadruga — usluga",
};

/** Najduži slobodan opis uz zapis (šta je primljeno, izdato, urađeno). */
export const MAX_OPIS = 200;

// ── Ko sme ──────────────────────────────────────────────────────────────────

export type Provera = { ok: true } | { ok: false; razlog: string; status: 400 | 403 | 409 };

/** Ono što pravila čitaju o korisniku — bez Prisme. */
export type KandidatZadrugar = {
  tipKorisnika: string;
  maloletan: boolean;
  status: string;
  deaktiviran: boolean;
};

/**
 * Čl. 7 — zadrugar može biti isključivo redovan član KOLO sistema.
 *
 * Redovan član = potvrđen nalog (`REGULARNI` ili `NOSILAC_ZRNA`) — potvrđen u
 * lancu ili uplatom (dokaz stvarnosti čl. 4a, set 4.8.0).
 */
export function smeBitiZadrugar(k: KandidatZadrugar): Provera {
  if (k.maloletan) {
    return { ok: false, razlog: "Dete ne može biti zadrugar.", status: 403 };
  }
  if (k.status !== "ACTIVE" || k.deaktiviran) {
    return { ok: false, razlog: "Nalog nije aktivan.", status: 400 };
  }
  if (k.tipKorisnika === "NEVERIFIKOVAN") {
    return { ok: false, razlog: "Zadrugar može biti samo redovan član KOLO sistema.", status: 403 };
  }
  return { ok: true };
}

/**
 * Čl. 13 st. 3 — radnje iz pravilnika ne sprovode se sa nalogom maloletnog
 * korisnika; čl. 17 st. 2 — izvršilac ne potvrđuje sopstveno izvršenje.
 * Isto pravilo važi za svaki osnov: onaj ko radnju sprovodi u ime zadruge ne
 * prepisuje POEN iz zapisa zadruge sam sebi.
 */
export function smePrimitiIzZapisa(primalac: { maloletan: boolean; aktivan: boolean }, jeSprovodilac: boolean): Provera {
  if (primalac.maloletan) {
    return { ok: false, razlog: "Radnje zadruge ne sprovode se sa nalogom deteta.", status: 403 };
  }
  if (!primalac.aktivan) {
    return { ok: false, razlog: "Nalog nije aktivan.", status: 400 };
  }
  if (jeSprovodilac) {
    return { ok: false, razlog: "Ne možete prepisati POEN iz zapisa zadruge sebi.", status: 403 };
  }
  return { ok: true };
}

/** Ceo pozitivan broj POEN-a (pravilo 7), ili `null`. */
export function procitajIznos(x: unknown): number | null {
  const n = Number(x);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}
