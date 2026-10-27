/**
 * Status učesnika (set 4.8.2) — čista pravila, bez Prisme i bez enum uvoza.
 *
 * Fajl koriste i pretraživač i `proxy.ts`, pa se porede string literali
 * (isti razlog kao `dozvole.ts`). Servisni ulaz je `src/lib/protokol/status.ts`,
 * koji ove funkcije re-eksportuje (CLAUDE.md pravilo 9).
 *
 * Statusi i članovi akata:
 *  - korisnik — punoletan, nije verifikovan (Pravilnik čl. 2, 28; dokaz čl. 3 st. 2);
 *  - član bez potvrde — verifikovan uvođenjem, nije potvrđen (Pravilnik čl. 28 st. 3;
 *    dokaz čl. 2, 4, 6);
 *  - član Kola — potvrđen (Pravilnik čl. 28);
 *  - čuvar Kola — potvrđen i drži ZRNO (Pravilnik čl. 22 st. 2);
 *  - osnivač — uvek potvrđen, čuvar Kola (dokaz čl. 29; Pravilnik čl. 58);
 *  - dete na čekanju / dete sa roditeljem / dete Kola (deca čl. 5, 6, 8, 13).
 *
 * 🔴 Kolone iz kojih se status čita (`verified`, `indeksStvarnosti`, `potvrdjenAt`,
 * `tipKorisnika`) su KEŠ izveden iz grafa i piše ih samo `preracunajStatusNaloga()`.
 * Interni identifikatori (`TipKorisnika`: NEVERIFIKOVAN/REGULARNI/NOSILAC_ZRNA) se
 * ne menjaju (CLAUDE.md pravilo 12). `tipKorisnika === "NOSILAC_ZRNA"` je i dalje
 * tačan znak za čuvara: član bez potvrde koji drži ZRNO ostaje REGULARNI.
 */

/** Verifikovan je onaj čiji je interni indeks ≥ 10. = `FUNKCIONALNI_PRAG_INDEKSA` (test drži jednakost). */
export const PRAG_VERIFIKACIJE = 10;

export type StatusUcesnika =
  | "KORISNIK"
  | "CLAN_BEZ_POTVRDE"
  | "CLAN_KOLA"
  | "CUVAR_KOLA"
  | "OSNIVAC"
  | "DETE_NA_CEKANJU"
  | "DETE_SA_RODITELJEM"
  | "DETE_KOLA";

export const SVI_STATUSI: readonly StatusUcesnika[] = [
  "KORISNIK",
  "CLAN_BEZ_POTVRDE",
  "CLAN_KOLA",
  "CUVAR_KOLA",
  "OSNIVAC",
  "DETE_NA_CEKANJU",
  "DETE_SA_RODITELJEM",
  "DETE_KOLA",
];

export type UlazStatusa = {
  maloletan: boolean;
  jeOsnivac: boolean;
  verified: boolean;
  indeksStvarnosti: number;
  potvrdjenAt: Date | string | null;
  /** "NEVERIFIKOVAN" | "REGULARNI" | "NOSILAC_ZRNA" */
  tipKorisnika: string;
  /** Samo za maloletne — stanje iz `deca.ts` (`stanjeNaloga`). */
  stanjeDeteta?: "NA_CEKANJU" | "POVEZANO" | "AKTIVNO" | null;
  /** `UserStatus` naloga ("ACTIVE" | "SUSPENDED" | "EXCLUDED"); vidi `prestaoStatus`. */
  status?: string | null;
  /** Trenutak gašenja naloga (Pravilnik čl. 33); vidi `prestaoStatus`. */
  deaktiviranAt?: Date | string | null;
};

/**
 * Status učesnika je PRESTAO (Pravilnik čl. 32; Uslovi čl. 30, 32, 33): nalog je
 * isključen (`EXCLUDED`) ili ugašen (`deaktiviranAt`). Takav nalog nema status
 * učesnika — ni verifikovanost, ni potvrđenost, ni položaj čuvara, pa ni osnivač.
 * Veze koje je dao ostaju (dokaz stvarnosti čl. 30), ali njemu ne daju ništa.
 *
 * 🔴 Suspenzija (`SUSPENDED`) NIJE prestanak: učesnik zadržava status (Pravilnik čl. 32 st. 2,
 * Uslovi čl. 31 st. 2).
 */
export function prestaoStatus(u: { status?: string | null; deaktiviranAt?: Date | string | null }): boolean {
  return u.status === "EXCLUDED" || u.deaktiviranAt != null;
}

/**
 * Status učesnika iz zapisa naloga.
 *
 * 🔴 Dete se proverava PRVO: dete nikad nije „korisnik" ni osnivač. Nepoznato
 * stanje deteta je najstrože (dete na čekanju).
 */
export function statusUcesnika(u: UlazStatusa): StatusUcesnika {
  if (u.maloletan) {
    if (u.stanjeDeteta === "AKTIVNO") return "DETE_KOLA";
    if (u.stanjeDeteta === "POVEZANO") return "DETE_SA_RODITELJEM";
    return "DETE_NA_CEKANJU";
  }
  // Isključen ili ugašen nalog nema status — i kad je osnivač (keš je ugašen
  // `preracunajStatusNaloga`, a ova provera pokriva osnivača, čiji se status ne čita iz keša).
  if (prestaoStatus(u)) return "KORISNIK";
  if (u.jeOsnivac) return "OSNIVAC";
  if (!u.verified || u.indeksStvarnosti < PRAG_VERIFIKACIJE) return "KORISNIK";
  if (!u.potvrdjenAt) return "CLAN_BEZ_POTVRDE";
  return u.tipKorisnika === "NOSILAC_ZRNA" ? "CUVAR_KOLA" : "CLAN_KOLA";
}

export const jeDete = (s: StatusUcesnika): boolean => s.startsWith("DETE_");

/** Verifikovan: član bez potvrde, član Kola, čuvar Kola, osnivač. */
export const jeVerifikovan = (s: StatusUcesnika): boolean =>
  s === "CLAN_BEZ_POTVRDE" || s === "CLAN_KOLA" || s === "CUVAR_KOLA" || s === "OSNIVAC";

/** Potvrđen (član Kola u širem smislu): član Kola, čuvar Kola, osnivač. */
export const jePotvrdjen = (s: StatusUcesnika): boolean =>
  s === "CLAN_KOLA" || s === "CUVAR_KOLA" || s === "OSNIVAC";

/** Čuvar Kola: čuvar ili osnivač (dokaz čl. 23 — nadzornik; Pravilnik čl. 22 st. 2). */
export const jeCuvar = (s: StatusUcesnika): boolean => s === "CUVAR_KOLA" || s === "OSNIVAC";

/**
 * Potvrđenost iz sirovih polja (sesija, upiti bez učitavanja deteta). Isto što
 * `jePotvrdjen(statusUcesnika(u))` za punoletan nalog; maloletan nikad.
 */
export function potvrdjenIzPolja(u: {
  maloletan?: boolean | null;
  jeOsnivac?: boolean | null;
  verified?: boolean | null;
  indeksStvarnosti?: number | null;
  potvrdjenAt?: Date | string | null;
  status?: string | null;
  deaktiviranAt?: Date | string | null;
}): boolean {
  if (u.maloletan) return false;
  if (prestaoStatus(u)) return false;
  if (u.jeOsnivac) return true;
  return Boolean(u.verified) && (u.indeksStvarnosti ?? 0) >= PRAG_VERIFIKACIJE && u.potvrdjenAt != null;
}

/**
 * Ključ statusa u namespace-u `status` (`messages/sr.json`, P6): oznaka je
 * `status.<kljuc>`, opis `status.<kljuc>_opis`.
 */
export function porukaStatusa(s: StatusUcesnika): string {
  return s.toLowerCase();
}

// ─── Dozvole po statusu (tabela 1.5 specifikacije prelaza na set 4.8.2) ──────
//
// `DOZVOLE` daje samo STATUSNI preduslov. Dodatni uslovi ostaju u domenskim
// pravilima: uzrast deteta, prijateljstvo, članstvo u gazdinstvu, ko je pozvao,
// da li je osoba na spisku, da li je podnosilac. Kolona „ČK/O" iz tabele je ovde
// razdvojena na CUVAR_KOLA i OSNIVAC (uvek isto pravo).

export type Radnja =
  | "PREGLED_OGLASA"
  | "OBJAVA_OGLASA"
  | "DOPRINOS_PRVI_OGLAS"
  | "PREPIS"
  | "PRICAONICA"
  | "POKRETANJE_RAZGOVORA"
  | "KONTAKT_OGLASIVACA"
  | "EVIDENCIJA_PSEUDONIMI"
  | "LISTA_DONACIJA"
  | "PUN_PROFIL_DRUGOG"
  | "SVI_KANALI_DOPRINOSA"
  | "ULAZ_NA_SPISAK"
  | "ZAHTEV_RADI_POTVRDE"
  | "PRIMA_VERIFIKACIJU"
  | "UVODI_POZNANIKA"
  | "POTVRDJUJE_KORISNIKA"
  | "VIDI_SPISAK_ZA_POZIV"
  | "POTVRDJUJE_CLANA_BEZ_POTVRDE"
  | "POTVRDJUJE_TELEFONOM"
  | "POTVRDJUJE_POSTOJANJE_DETETA"
  | "TRAZI_POTVRDU_POSTOJANJA"
  | "OTVARA_NALOG_DETETU"
  | "DETE_POSTAJE_DETE_KOLA"
  | "POTVRDJUJE_USLOVE_PROGRAMA"
  | "PRIJAVA_NA_PROGRAM"
  | "PREPORUKA"
  | "NADZOR"
  | "ZRNO_UPIS"
  | "ZRNO_AKTIVIRANJE"
  | "ZRNO_OTPIS"
  | "DELEGIRANJE"
  | "GLAS"
  | "NABAVKA"
  | "VAUCER"
  | "POKROVITELJSTVO_DOBRIMA"
  | "DONACIJA"
  | "ZADRUGAR"
  | "OPERATIVNI_IZVRSILAC"
  | "OPERATIVNI_VERIFIKACIJA"
  | "GAZDINSTVO_RPG"
  | "GAZDINSTVO_VAN_RPG"
  | "POZIV_U_GAZDINSTVO"
  | "PRISTUPANJE_GAZDINSTVU"
  | "UPRAVLJANJE_GAZDINSTVOM"
  | "PRIJAVA_LAZNOG_RODITELJSTVA"
  | "UPIS_SKOLE"
  | "SPISAK_SKOLE"
  | "PRIJATELJSTVO";

const ODRASLI = ["KORISNIK", "CLAN_BEZ_POTVRDE", "CLAN_KOLA", "CUVAR_KOLA", "OSNIVAC"] as const;
const VERIFIKOVANI = ["CLAN_BEZ_POTVRDE", "CLAN_KOLA", "CUVAR_KOLA", "OSNIVAC"] as const;
const POTVRDJENI = ["CLAN_KOLA", "CUVAR_KOLA", "OSNIVAC"] as const;
const CUVARI = ["CUVAR_KOLA", "OSNIVAC"] as const;
const DECA = ["DETE_NA_CEKANJU", "DETE_SA_RODITELJEM", "DETE_KOLA"] as const;

export const DOZVOLE: Record<Radnja, readonly StatusUcesnika[]> = {
  // 1. Uslovi 14 st. 2, 17 st. 2; deca 5 st. 1 t. 1–2 — dete na čekanju vidi kao gost,
  //    dete sa roditeljem bez pseudonima oglašivača (osim prijatelja).
  PREGLED_OGLASA: [...ODRASLI, ...DECA],
  // 2. Uslovi 14 st. 2, 18; deca 5, 24 st. 1
  OBJAVA_OGLASA: [...ODRASLI, "DETE_KOLA"],
  // 3. Pravilnik 28 st. 2, 38; deca 33 st. 1
  DOPRINOS_PRVI_OGLAS: [...ODRASLI],
  // 4. Uslovi 14 st. 3; deca 5, 30 st. 6
  PREPIS: [...ODRASLI, "DETE_KOLA"],
  // 5. Uslovi 14 st. 2; deca 5 st. 1 t. 2, 27 — dete sa roditeljem vidi samo prijatelje
  PRICAONICA: [...ODRASLI, "DETE_SA_RODITELJEM", "DETE_KOLA"],
  // 6. Uslovi 14 st. 2; deca 22 st. 6 — korisnik samo povodom oglasa (≤ 3
  //    dnevno), dete sa roditeljem samo prijateljima, dete Kola po čl. 22
  POKRETANJE_RAZGOVORA: [...ODRASLI, "DETE_SA_RODITELJEM", "DETE_KOLA"],
  // 7. Uslovi 14 st. 2, 17 st. 3
  KONTAKT_OGLASIVACA: [...VERIFIKOVANI],
  // 8. Pravilnik 56 st. 1–2; Uslovi 16 st. 3–4 — korisnik vidi samo iznos i vreme
  EVIDENCIJA_PSEUDONIMI: [...VERIFIKOVANI],
  // 9. Pravilnik 56 st. 2; Uslovi 16 st. 5; donacije 11 — ime, iznos, datum; bez pseudonima
  LISTA_DONACIJA: [...ODRASLI],
  // 10. Uslovi 16 st. 3 (korisnik vidi sužen); deca 25 za decu
  PUN_PROFIL_DRUGOG: [...VERIFIKOVANI],
  // 11. Pravilnik 28 st. 2; Uslovi 15 st. 2 — korisnik samo prvi oglas (Pravilnik 38), donacija, pokroviteljstvo
  SVI_KANALI_DOPRINOSA: [...VERIFIKOVANI],
  // 12. dokaz 8; Uslovi 14 st. 5
  ULAZ_NA_SPISAK: ["KORISNIK"],
  // 12a. dokaz 8 st. 4, 16 st. 2 (set 4.8.3) — član bez potvrde traži razgovor radi potvrde
  ZAHTEV_RADI_POTVRDE: ["CLAN_BEZ_POTVRDE"],
  // 13. dokaz 2 st. 2, 5 st. 1, 29 st. 4; deca 29 st. 2 — član bez potvrde prima samo
  //     potvrdu od člana Kola; osnivač nikad
  PRIMA_VERIFIKACIJU: ["KORISNIK", "CLAN_BEZ_POTVRDE"],
  // 14. dokaz 4 st. 2 — član bez potvrde uvek uvodi
  UVODI_POZNANIKA: ["CLAN_BEZ_POTVRDE"],
  // 15. dokaz 4 st. 1; Uslovi 15 st. 1
  POTVRDJUJE_KORISNIKA: [...POTVRDJENI],
  // 16. dokaz 10 st. 1, 12 st. 2, 6 st. 2 t. 1
  VIDI_SPISAK_ZA_POZIV: [...POTVRDJENI],
  // 17. dokaz 5, 6 st. 2 t. 2; Pravilnik 28 st. 3
  POTVRDJUJE_CLANA_BEZ_POTVRDE: [...POTVRDJENI],
  // 17a. dokaz 16 st. 1, 10 st. 1 (set 4.8.3) — samo čuvar Kola, i zahtev radi potvrde vidi samo on
  POTVRDJUJE_TELEFONOM: [...CUVARI],
  // 18. deca 13 st. 3; dokaz 6 st. 2 t. 2 — ne drugi roditelj (domensko)
  POTVRDJUJE_POSTOJANJE_DETETA: [...POTVRDJENI],
  // 19. deca 13 st. 1
  TRAZI_POTVRDU_POSTOJANJA: [...POTVRDJENI],
  // 20. deca 7 st. 1, 11 st. 1
  OTVARA_NALOG_DETETU: [...ODRASLI],
  // 21. deca 5 st. 1 t. 3, st. 2–3 — status roditelja
  DETE_POSTAJE_DETE_KOLA: [...POTVRDJENI],
  // 22. programi 5; dokaz 6 st. 2 t. 2 — ako ga je potvrdio ili lično zna
  POTVRDJUJE_USLOVE_PROGRAMA: [...POTVRDJENI],
  // 23. programi 4 st. 1; 🔴 maloletni korisnik nema pravo na programe podrške
  // (programi 2 st. 3; deca 29 st. 4) — ni dete Kola, ni preko roditelja.
  PRIJAVA_NA_PROGRAM: [...VERIFIKOVANI],
  // 24. dokaz 20 st. 1
  PREPORUKA: [...POTVRDJENI],
  // 25. dokaz 23 st. 1, 6 st. 2 t. 5
  NADZOR: [...CUVARI],
  // 26. Pravilnik 22 st. 3; deca 29 st. 1 — član bez potvrde ostaje to što jeste
  ZRNO_UPIS: [...VERIFIKOVANI],
  // 27. Pravilnik 23 st. 2, 28 st. 3; dokaz 6 st. 2 t. 4, st. 3
  ZRNO_AKTIVIRANJE: [...CUVARI],
  // 28. Pravilnik 23 st. 2, 29 st. 1 — korisniku je ZRNO zamrznuto
  ZRNO_OTPIS: ["CLAN_BEZ_POTVRDE", ...CUVARI],
  // 29. Pravilnik 44 st. 2; Gornje Kolo 14 — daje i prima
  DELEGIRANJE: [...CUVARI],
  // 30. Pravilnik 43, 44; Gornje Kolo 4, 12 — uz aktivno ZRNO (domensko)
  GLAS: [...CUVARI],
  // 31. Uslovi 25 st. 1; nabavke 4
  NABAVKA: [...VERIFIKOVANI],
  // 32. Uslovi 25 st. 1; nabavke 29–34
  VAUCER: [...VERIFIKOVANI],
  // 33. donacije 28
  POKROVITELJSTVO_DOBRIMA: [...VERIFIKOVANI],
  // 34. donacije 3, 16 st. 1, 19 — donacija i novčano pokroviteljstvo
  DONACIJA: [...ODRASLI],
  // 35. zadruge 6, 7
  ZADRUGAR: [...VERIFIKOVANI],
  // 36. operativni 9
  OPERATIVNI_IZVRSILAC: [...VERIFIKOVANI],
  // 37. operativni 13 (Faza 2)
  OPERATIVNI_VERIFIKACIJA: [...CUVARI],
  // 38. gazd. 4 st. 1, 3 st. 3; dokaz 8 st. 1 t. 4 — korisnik i član bez potvrde kao
  //     nosilac, bez članova; izvod se ne prilaže (set 4.8.3; domensko)
  GAZDINSTVO_RPG: [...ODRASLI],
  // 39. gazd. 3 st. 2, 4 (set 4.8.3) — isto kao upisano gazdinstvo
  GAZDINSTVO_VAN_RPG: [...ODRASLI],
  // 40. gazd. 9 st. 2, 11, 14 — kad gazdinstvo sme imati članove (domensko)
  POZIV_U_GAZDINSTVO: [...POTVRDJENI],
  // 41. gazd. 10 — status POZVANOG u trenutku odobrenja
  PRISTUPANJE_GAZDINSTVU: [...POTVRDJENI],
  // 42. gazd. 11, 14 — korisnik i član bez potvrde samo kao podnosilac (domensko)
  UPRAVLJANJE_GAZDINSTVOM: [...ODRASLI],
  // 43. deca 17 st. 1
  PRIJAVA_LAZNOG_RODITELJSTVA: [...ODRASLI, ...DECA],
  // 44. deca 26 st. 1
  UPIS_SKOLE: ["DETE_SA_RODITELJEM", "DETE_KOLA"],
  // 45. deca 26 st. 2–3
  SPISAK_SKOLE: ["DETE_KOLA"],
  // 46. deca 32, 33 st. 2 — 500 POEN tek kad su obe strane dete Kola (domensko)
  PRIJATELJSTVO: [...DECA],
};

/** Statusni preduslov radnje (tabela 1.5). */
export function sme(radnja: Radnja, s: StatusUcesnika): boolean {
  return DOZVOLE[radnja].includes(s);
}
