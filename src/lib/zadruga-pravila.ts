/**
 * Čista pravila Modula Zadruga — Pravilnik o zadrugama (set 5.0).
 *
 * Bez Prisme: uvozi ih i pretraživač (prikaz pragova na `/zadruge`), a servis
 * `protokol/zadruga.ts` ih re-eksportuje, pa server ima jedan ulaz.
 *
 * 🔴 Tabela pragova je JEDNA (`PRAGOVI_RASTA`), i tabela jedinica zadružnog
 * doprinosa (`JEDINICE_ZADRUZNOG_DOPRINOSA`) stoji uz nju. Zadruga je red tabele
 * `Krug` (`zadruga = true`) sa istim dnevnikom pragova `KrugBonusLog`; upis kruga kao
 * zadruge (zadruge do seta 5.0, čl. 11 st. 3) je brisan, pa nijedan drugi modul ne
 * evidentira pragove.
 */

/** Čl. 9 — pragovi broja zadrugara i POEN koji se po njima evidentira. */
export const PRAGOVI_RASTA: readonly { clanovi: number; poen: number }[] = [
  { clanovi: 5, poen: 50_000 },
  { clanovi: 10, poen: 100_000 },
  { clanovi: 20, poen: 200_000 },
  { clanovi: 50, poen: 500_000 },
  { clanovi: 100, poen: 1_000_000 },
  { clanovi: 200, poen: 2_000_000 },
  { clanovi: 500, poen: 5_000_000 },
];

/** Čl. 4 st. 3 — zapis zadruge se otvara (prvi prag) sa najmanje pet zadrugara. */
export const MIN_ZADRUGARA = PRAGOVI_RASTA[0].clanovi;

/**
 * Čl. 5 st. 2 — PRVA zadruga u mestu traži najmanje pedeset UČESNIKA tog mesta
 * (članova bez potvrde, članova Kola, čuvara), i u njenom osnivanju učestvuje
 * Fondacija. Za svaku sledeću u istom mestu ovaj uslov ne važi (st. 3) — dovoljno
 * je pet zadrugara iz čl. 4 st. 3.
 *
 * 🔴 Dva uslova, dva broja: 50 je uslov LOKALITETA, 5 je najmanji broj
 * ZADRUGARA. Ne mešati ih (odluka vlasnika, 18.10.2026).
 */
export const PRAG_PRVE_ZADRUGE = 50;

/** Koliko učesnika mesto mora da ima za NOVU zadrugu. */
export function pragLokalitetaZaNovuZadrugu(postojiZadrugaNaLokalitetu: boolean): number {
  return postojiZadrugaNaLokalitetu ? 0 : PRAG_PRVE_ZADRUGE;
}

/**
 * Čl. 10 — pragovi koji su dostignuti a još nisu evidentirani.
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

// ── Osnovi zapisa (čl. 11) ──────────────────────────────────────────────────

/**
 * Osnovi zapisa zadruge. Svaki ide sopstvenim tipom transakcije — nikad
 * `TRANSFER` (pravilo 5): brojač razmena i zbir prepisa među korisnicima ne smeju
 * ih brojati, a osnov mora ostati u zapisu zauvek.
 *
 * - `PRIJEM`    zadruga → korisnik: dobro primljeno na raspodelu (čl. 12 st. 1)
 * - `DOPRINOS`  zadruga → izvršilac: zadatak zadruge (čl. 16). 🔴 Identifikator ostaje
 *               (pravilo 12), ali od seta 5.0 „zadružni doprinos" znači drugo: nov POEN
 *               iz Protokola kao oblik operativnog doprinosa (čl. 17). Na ekranu je
 *               ovaj osnov „zadatak zadruge".
 * - `USLUGA_PRIMLJENA` zadruga → korisnik: usluga koju zadruga prima (čl. 11 st. 1 t. 5)
 * - `IZDAVANJE` zadrugar ili druga zadruga → zadruga: dobro izdato iz raspodele (čl. 12 st. 2)
 * - `OPREMA`    zadrugar → zadruga: korišćenje opreme, mehanizacije, zemljišta (čl. 11 st. 1 t. 4)
 * - `USLUGA_PRUZENA` zadrugar → zadruga: usluga koju zadruga pruža (čl. 11 st. 1 t. 5)
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
  DOPRINOS: "Zadruga — zadatak zadruge",
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
 * Čl. 6 st. 1 — sa zadrugom se povezuje samo nalog UČESNIKA (član bez potvrde,
 * član Kola, čuvar Kola, osnivač). Keš `tipKorisnika` je `NEVERIFIKOVAN` tačno za
 * korisnika koji nije u Kolu (piše ga samo `preracunajStatusNaloga`).
 */
export function smeBitiZadrugar(k: KandidatZadrugar): Provera {
  if (k.maloletan) {
    return { ok: false, razlog: "Dete ne može biti zadrugar.", status: 403 };
  }
  if (k.status !== "ACTIVE" || k.deaktiviran) {
    return { ok: false, razlog: "Nalog nije aktivan.", status: 400 };
  }
  if (k.tipKorisnika === "NEVERIFIKOVAN") {
    return { ok: false, razlog: "Sa zadrugom se povezuje samo nalog učesnika (člana bez potvrde ili člana Kola).", status: 403 };
  }
  return { ok: true };
}

/**
 * Čl. 11 st. 4 — radnje iz pravilnika ne sprovode se sa nalogom maloletnog
 * korisnika; čl. 16 st. 1 — izvršilac ne potvrđuje sopstveno izvršenje.
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

// ── Mirovanje zadrugara (čl. 6 st. 1) ───────────────────────────────────────

/**
 * Dok zadrugar nije učesnik, svojstvo mu MIRUJE: ne broji se za pragove rasta (ni
 * za jedinice zadružnog doprinosa) i ne prepisuje POEN u zapis zadruge. Povezanost
 * i već evidentirani pragovi ostaju (čl. 10: pad broja ništa ne otpisuje).
 */
export function zadrugarMiruje(jeUcesnik: boolean): boolean {
  return !jeUcesnik;
}

// ── Zamrzavanje zapisa (čl. 22 st. 2) ───────────────────────────────────────

/** Osnovi od kojih se iz zapisa zadruge i u njega ne prepisuje. */
export const OSNOVI_ZAMRZAVANJA = ["OTKAZ_UGOVORA", "BRISANJE_IZ_REGISTRA"] as const;
export type OsnovZamrzavanja = (typeof OSNOVI_ZAMRZAVANJA)[number];

export function jeOsnovZamrzavanja(x: unknown): x is OsnovZamrzavanja {
  return typeof x === "string" && (OSNOVI_ZAMRZAVANJA as readonly string[]).includes(x);
}

/**
 * Od otkaza ugovora o saradnji, odnosno od pokretanja postupka brisanja iz registra,
 * iz zapisa zadruge i u njega se ne prepisuje i zadružni doprinos se ne evidentira
 * (zadruge čl. 22 st. 2; Pravilnik čl. 50 st. 4). Zapis se zatvara tek prestankom.
 */
export function zapisZamrznut(z: { zamrznutoAt: Date | string | null }): boolean {
  return z.zamrznutoAt != null;
}

// ── Zadružni doprinos (čl. 17; operativni čl. 23) ───────────────────────────

/**
 * Čl. 17 st. 3 — broj jedinica prema broju zadrugara. Najveći iznos POEN-a koji
 * izvršioci jedne zadruge mogu dobiti u obračunskom periodu = jedinice × iznos
 * jedinice (iznos utvrđuje UO odlukom, operativni čl. 23 st. 4).
 */
export const JEDINICE_ZADRUZNOG_DOPRINOSA: readonly { clanovi: number; jedinice: number }[] = [
  { clanovi: 5, jedinice: 1 },
  { clanovi: 10, jedinice: 1 },
  { clanovi: 20, jedinice: 2 },
  { clanovi: 50, jedinice: 4 },
  { clanovi: 100, jedinice: 7 },
  { clanovi: 200, jedinice: 12 },
  { clanovi: 500, jedinice: 25 },
  { clanovi: 1000, jedinice: 40 },
];

/**
 * Čl. 17 st. 4 — između dva praga važi NIŽI prag. Ispod prvog praga (5) zapis
 * zadruge nije otvoren (čl. 4 st. 3), pa jedinica nema. Broje se zadrugari koji su
 * učesnici (čl. 6 st. 1 — zadrugar koji miruje se ne broji).
 */
export function brojJedinica(brojZadrugara: number): number {
  let j = 0;
  for (const red of JEDINICE_ZADRUZNOG_DOPRINOSA) if (brojZadrugara >= red.clanovi) j = red.jedinice;
  return j;
}

/**
 * Najveći dnevni iznos zadružnog doprinosa jedne zadruge. 🔴 `null` dok UO nije
 * utvrdio iznos jedinice — tada se zadružni doprinos ne objavljuje i ne potvrđuje;
 * podrazumevani iznos ne postoji.
 */
export function najveciDnevniIznos(brojZadrugara: number, iznosJedinice: number | null): number | null {
  if (iznosJedinice == null) return null;
  return brojJedinica(brojZadrugara) * iznosJedinice;
}

/**
 * Čl. 17 st. 4 i operativni čl. 23 st. 3 — zbir predloženih POEN-a potvrđenih
 * celina jedne zadruge u periodu ne prelazi najveći iznos; VIŠAK NE ULAZI u
 * raspodelu i ne prenosi se u naredni period.
 */
export function uMaksimumZadruge(predlozeni: number, najveci: number, vecPotvrdjenoUPeriodu: number): {
  uRaspodeli: number;
  visak: number;
} {
  const preostalo = Math.max(0, najveci - vecPotvrdjenoUPeriodu);
  const uRaspodeli = Math.min(predlozeni, preostalo);
  return { uRaspodeli, visak: predlozeni - uRaspodeli };
}
