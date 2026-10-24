/**
 * Status učesnika (set 4.8.2) — čista pravila, bez Prisme i bez enum uvoza.
 *
 * Fajl koriste i pretraživač i `proxy.ts`, pa se porede string literali
 * (isti razlog kao `dozvole.ts`). Servisni ulaz je `src/lib/protokol/status.ts`,
 * koji ove funkcije re-eksportuje (CLAUDE.md pravilo 9).
 *
 * Statusi i članovi akata:
 *  - korisnik — punoletan, nije verifikovan (Pravilnik čl. 2, 28; dokaz čl. 4 st. 3);
 *  - član bez potvrde — verifikovan uvođenjem, nije potvrđen (Pravilnik čl. 28a;
 *    dokaz čl. 3, 5a);
 *  - član Kola — potvrđen (Pravilnik čl. 29);
 *  - čuvar Kola — potvrđen i drži ZRNO (Pravilnik čl. 30);
 *  - osnivač — uvek potvrđen, čuvar Kola (dokaz čl. 14, 15; Pravilnik čl. 82);
 *  - dete na čekanju / dete sa roditeljem / dete Kola (deca čl. 4a, 4c, 5, 6).
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
  /** Trenutak gašenja naloga (Pravilnik čl. 34); vidi `prestaoStatus`. */
  deaktiviranAt?: Date | string | null;
};

/**
 * Status učesnika je PRESTAO (Pravilnik čl. 33; Uslovi čl. 26, 28, 29): nalog je
 * isključen (`EXCLUDED`) ili ugašen (`deaktiviranAt`). Takav nalog nema status
 * učesnika — ni verifikovanost, ni potvrđenost, ni položaj čuvara, pa ni osnivač.
 * Veze koje je dao ostaju (dokaz stvarnosti čl. 16), ali njemu ne daju ništa.
 *
 * 🔴 Suspenzija (`SUSPENDED`) NIJE prestanak: učesnik zadržava status (čl. 33 st. 4,
 * Uslovi čl. 27 st. 2).
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

/** Čuvar Kola: čuvar ili osnivač (dokaz čl. 10 — nadzornik; Pravilnik čl. 30). */
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
  // 1. Pravilnik 28 st. 2; deca 4c, 13 st. 4 — dete na čekanju vidi kao gost,
  //    dete sa roditeljem bez pseudonima oglašivača (osim prijatelja).
  PREGLED_OGLASA: [...ODRASLI, ...DECA],
  // 2. Pravilnik 28 st. 2; Uslovi 14, 16; deca 4c, 13 st. 4
  OBJAVA_OGLASA: [...ODRASLI, "DETE_KOLA"],
  // 3. Pravilnik 28 st. 4, 40a; deca 14 st. 1
  DOPRINOS_PRVI_OGLAS: [...ODRASLI],
  // 4. Pravilnik 28 st. 3; Uslovi 14; deca 4c, 14 st. 9
  PREPIS: [...ODRASLI, "DETE_KOLA"],
  // 5. Uslovi 14; deca 4c t. 2, 18 — dete sa roditeljem vidi samo prijatelje
  PRICAONICA: [...ODRASLI, "DETE_SA_RODITELJEM", "DETE_KOLA"],
  // 6. Uslovi 14, 16 st. 4; deca 12 st. 6 — korisnik samo povodom oglasa (≤ 3
  //    dnevno), dete sa roditeljem samo prijateljima, dete Kola po čl. 12
  POKRETANJE_RAZGOVORA: [...ODRASLI, "DETE_SA_RODITELJEM", "DETE_KOLA"],
  // 7. Pravilnik 28 st. 5; Uslovi 14, 17 st. 5
  KONTAKT_OGLASIVACA: [...VERIFIKOVANI],
  // 8. Pravilnik 67 st. 3; Uslovi 17 st. 3–4 — korisnik vidi samo iznos i vreme
  EVIDENCIJA_PSEUDONIMI: [...VERIFIKOVANI],
  // 9. Pravilnik 67; Uslovi 17 st. 3, 6; donacije 5a — ime, iznos, datum; bez pseudonima
  LISTA_DONACIJA: [...ODRASLI],
  // 10. Uslovi 17 st. 3 (korisnik vidi sužen); deca 15b za decu
  PUN_PROFIL_DRUGOG: [...VERIFIKOVANI],
  // 11. Pravilnik 28 st. 4, 28a st. 3 — korisnik samo 40a, donacija, pokroviteljstvo
  SVI_KANALI_DOPRINOSA: [...VERIFIKOVANI],
  // 12. dokaz 4a; Uslovi 14 st. 6, 16b
  ULAZ_NA_SPISAK: ["KORISNIK"],
  // 12a. dokaz 4a, 5c st. 3 (set 4.8.3) — član bez potvrde traži razgovor radi potvrde
  ZAHTEV_RADI_POTVRDE: ["CLAN_BEZ_POTVRDE"],
  // 13. dokaz 3 st. 3, 5a st. 3, 14 st. 3; deca 15 — član bez potvrde prima samo
  //     potvrdu od člana Kola; osnivač nikad
  PRIMA_VERIFIKACIJU: ["KORISNIK", "CLAN_BEZ_POTVRDE"],
  // 14. dokaz 5a st. 1–2; Pravilnik 28a st. 2 — član bez potvrde uvek uvodi
  UVODI_POZNANIKA: ["CLAN_BEZ_POTVRDE"],
  // 15. dokaz 5a st. 1; Pravilnik 29 st. 2
  POTVRDJUJE_KORISNIKA: [...POTVRDJENI],
  // 16. dokaz 4a, 5 st. 7, 5a st. 8 t. 1; Uslovi 16b st. 3
  VIDI_SPISAK_ZA_POZIV: [...POTVRDJENI],
  // 17. dokaz 5a st. 3–4, 8 t. 2; Pravilnik 28a st. 4
  POTVRDJUJE_CLANA_BEZ_POTVRDE: [...POTVRDJENI],
  // 17a. dokaz 5c st. 1, 4a (set 4.8.3) — samo čuvar Kola, i zahtev radi potvrde vidi samo on
  POTVRDJUJE_TELEFONOM: [...CUVARI],
  // 18. deca 5 st. 4, 6 st. 3–4; dokaz 5a st. 8 t. 2 — ne drugi roditelj (domensko)
  POTVRDJUJE_POSTOJANJE_DETETA: [...POTVRDJENI],
  // 19. deca 6 st. 2, 8
  TRAZI_POTVRDU_POSTOJANJA: [...POTVRDJENI],
  // 20. deca 4, 4b st. 6, 5 st. 1
  OTVARA_NALOG_DETETU: [...ODRASLI],
  // 21. deca 4c t. 3, 5 st. 2–4 — status roditelja
  DETE_POSTAJE_DETE_KOLA: [...POTVRDJENI],
  // 22. programi 4 st. 2, 13; dokaz 5a st. 8 t. 2 — ako ga je potvrdio ili lično zna
  POTVRDJUJE_USLOVE_PROGRAMA: [...POTVRDJENI],
  // 23. programi 4 st. 1, 13 — dete Kola preko roditelja
  PRIJAVA_NA_PROGRAM: [...VERIFIKOVANI, "DETE_KOLA"],
  // 24. Uslovi 17a st. 1
  PREPORUKA: [...POTVRDJENI],
  // 25. dokaz 10 st. 2, 5a st. 8 t. 5; Pravilnik 30 st. 2
  NADZOR: [...CUVARI],
  // 26. Pravilnik 19 st. 1–2, 28a; deca 15 — član bez potvrde ostaje to što jeste
  ZRNO_UPIS: [...VERIFIKOVANI],
  // 27. Pravilnik 20 st. 2, 29 st. 3; dokaz 5a st. 7, 8 t. 4
  ZRNO_AKTIVIRANJE: [...CUVARI],
  // 28. Pravilnik 20 st. 2, 21, 30 st. 3 — korisniku je ZRNO zamrznuto
  ZRNO_OTPIS: ["CLAN_BEZ_POTVRDE", ...CUVARI],
  // 29. Pravilnik 47; Gornje Kolo 14 — daje i prima
  DELEGIRANJE: [...CUVARI],
  // 30. Pravilnik 45, 46; Gornje Kolo 4, 10 — uz aktivno ZRNO (domensko)
  GLAS: [...CUVARI],
  // 31. Uslovi 22a st. 2; nabavke 4
  NABAVKA: [...VERIFIKOVANI],
  // 32. Uslovi 22a st. 6; nabavke 30–30g
  VAUCER: [...VERIFIKOVANI],
  // 33. donacije 13e
  POKROVITELJSTVO_DOBRIMA: [...VERIFIKOVANI],
  // 34. donacije 3, 8 — donacija i novčano pokroviteljstvo
  DONACIJA: [...ODRASLI],
  // 35. zadruge 2, 7
  ZADRUGAR: [...VERIFIKOVANI],
  // 36. operativni 9
  OPERATIVNI_IZVRSILAC: [...VERIFIKOVANI],
  // 37. operativni 16 (Faza 2)
  OPERATIVNI_VERIFIKACIJA: [...CUVARI],
  // 38. gazd. 4a t. 1–4, 4b; dokaz 4a t. 4 — korisnik i član bez potvrde kao
  //     nosilac, bez članova; izvod se ne prilaže (set 4.8.3; domensko)
  GAZDINSTVO_RPG: [...ODRASLI],
  // 39. gazd. 4a (set 4.8.3) — isto kao upisano gazdinstvo
  GAZDINSTVO_VAN_RPG: [...ODRASLI],
  // 40. gazd. 7 st. 2, 9 st. 1, 9a — kad gazdinstvo sme imati članove (domensko)
  POZIV_U_GAZDINSTVO: [...POTVRDJENI],
  // 41. gazd. 7a, 8 — status POZVANOG u trenutku odobrenja
  PRISTUPANJE_GAZDINSTVU: [...POTVRDJENI],
  // 42. gazd. 9 st. 1, 9a — korisnik i član bez potvrde samo kao podnosilac (domensko)
  UPRAVLJANJE_GAZDINSTVOM: [...ODRASLI],
  // 43. deca 4e st. 1
  PRIJAVA_LAZNOG_RODITELJSTVA: [...ODRASLI, ...DECA],
  // 44. deca 7 st. 2, 15a st. 1
  UPIS_SKOLE: ["DETE_SA_RODITELJEM", "DETE_KOLA"],
  // 45. deca 15a st. 2–3
  SPISAK_SKOLE: ["DETE_KOLA"],
  // 46. deca 14a, 14b st. 2 — 500 POEN tek kad su obe strane dete Kola (domensko)
  PRIJATELJSTVO: [...DECA],
};

/** Statusni preduslov radnje (tabela 1.5). */
export function sme(radnja: Radnja, s: StatusUcesnika): boolean {
  return DOZVOLE[radnja].includes(s);
}
