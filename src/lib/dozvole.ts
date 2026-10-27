/**
 * Centralne provere ovlašćenja (uloga).
 *
 * Razdvaja DVE nezavisne ose:
 *   1. Članski tip (TipKorisnika) — šta si u zajednici (zarađuje se).
 *   2. Admin rola (AdminRola)      — šta smeš operativno (dodeljuje se).
 *
 * Dve nezavisne ose:
 *   - Članski tip (TipKorisnika): NEVERIFIKOVAN → REGULARNI → NOSILAC_ZRNA.
 *   - Admin nivo (AdminNivo, kolona `admin`): NONE / ADMIN / SUPERADMIN.
 * `jeAdmin`/`jeSuperadmin` čitaju `admin`; `mozeNadzor`/`jeKorenJemstva`
 * kombinuju članski tip i admin nivo.
 *
 * Modul NE sme da uvozi Prisma client (koristi ga i proxy.ts u edge middleware-u),
 * zato se porede string literali, ne enum vrednosti.
 */
import { potvrdjenIzPolja } from "@/lib/status-ucesnika-pravila";

/** Minimalni oblik koji zadovoljavaju i session.user, i JWT token, i DB korisnik. */
export type KorisnikDozvole = {
  tipKorisnika?: string | null;
  admin?: string | null;
  /** Set 4.8.2: član Kola, čuvar Kola ili osnivač (`session.user.potvrdjen`). */
  potvrdjen?: boolean | null;
  // Sirova polja DB korisnika — kad `potvrdjen` nije dat, izvodi se iz njih.
  maloletan?: boolean | null;
  jeOsnivac?: boolean | null;
  verified?: boolean | null;
  indeksStvarnosti?: number | null;
  potvrdjenAt?: Date | string | null;
};

/** `potvrdjen` iz sesije, ili izveden iz polja DB korisnika (isto pravilo). */
function potvrdjenKorisnik(u?: KorisnikDozvole | null): boolean {
  if (!u) return false;
  if (typeof u.potvrdjen === "boolean") return u.potvrdjen;
  return potvrdjenIzPolja(u);
}

/**
 * Prošireni krug funkcija — prava VERIFIKOVANOG učesnika (set 4.8.2: član bez
 * potvrde, član Kola, čuvar Kola, osnivač; Pravilnik čl. 28; Uslovi čl. 15).
 *
 * 🔴 Potvrda uplatom i registrom je ukinuta setom 4.8.2 (dokaz stvarnosti čl. 8
 * sada vodi samo na spisak za poziv), pa `identitetUtvrdjen` više ne postoji.
 * Radnje koje traže POTVRĐENOG (potvrđivanje drugih, spisak za poziv) čitaju
 * `potvrdjen`; statusni preduslovi su u `DOZVOLE` (`status-ucesnika-pravila.ts`).
 */
export type KorisnikProsireni = {
  verified?: boolean | null;
  potvrdjen?: boolean | null;
  maloletan?: boolean | null;
};

export function smeProsireno(u?: KorisnikProsireni | null): boolean {
  return Boolean(u?.verified);
}

/**
 * Potvrđivanje drugih (dokaz stvarnosti čl. 4 st. 1; Uslovi čl. 15 st. 1):
 * član Kola, čuvar Kola ili osnivač, punoletan.
 */
export function smePotvrdjivati(u?: (KorisnikProsireni & KorisnikDozvole) | null): boolean {
  return potvrdjenKorisnik(u) && !u?.maloletan;
}

const NOSILAC_ZRNA = "NOSILAC_ZRNA";
const ADMIN = "ADMIN";
const SUPERADMIN = "SUPERADMIN";

/** Superadmin — vidi sve, nadzire admine, drži opasne/sistemske poluge. */
export function jeSuperadmin(u?: KorisnikDozvole | null): boolean {
  return u?.admin === SUPERADMIN;
}

/** Admin — svakodnevna operativa (uključuje i superadmina). */
export function jeAdmin(u?: KorisnikDozvole | null): boolean {
  return u?.admin === ADMIN || u?.admin === SUPERADMIN;
}

const ZADRUGA = "ZADRUGA";

/**
 * Zadružni admin — lice koje predloži zadruga (Pravilnik o zadrugama čl. 15;
 * registar 2026-10, U2). 🔴 NIJE admin: `jeAdmin` ga ne pušta nigde, pa van
 * zadruge ne vidi ništa. Radi samo u zadruzi iz `adminZadrugaId`.
 */
export function jeZadruzniAdmin(u?: KorisnikDozvole | null): boolean {
  return u?.admin === ZADRUGA;
}

/**
 * Radnje u zapisu zadruge i nad njenim zadrugarima (zadruge čl. 6, 8, 15): admin u
 * svakoj zadruzi, zadružni admin samo u svojoj.
 */
export function smeRaditiZaZadrugu(
  u: (KorisnikDozvole & { adminZadrugaId?: string | null }) | null | undefined,
  zadrugaId: string,
): boolean {
  if (jeAdmin(u)) return true;
  return jeZadruzniAdmin(u) && !!u?.adminZadrugaId && u.adminZadrugaId === zadrugaId;
}

/**
 * Upis ishoda nadzora — čuvar Kola (dokaz stvarnosti čl. 23 st. 1: nadzornik je
 * svaki čuvar Kola; Uslovi čl. 15 st. 3). Čuvar je potvrđen i `NOSILAC_ZRNA`;
 * član bez potvrde sa ZRNOM ostaje REGULARNI, pa ovde ne prolazi.
 *
 * Admin bez statusa čuvara NE upisuje ishod (set 4.8.2) — za čitanje vidi
 * `mozeCitatiNadzor`.
 */
export function mozeNadzor(u?: KorisnikDozvole | null): boolean {
  return potvrdjenKorisnik(u) && u?.tipKorisnika === NOSILAC_ZRNA;
}

/** Čitanje predmeta i zapisa nadzora: čuvar Kola ili admin (operativa). */
export function mozeCitatiNadzor(u?: KorisnikDozvole | null): boolean {
  return mozeNadzor(u) || jeAdmin(u);
}

/**
 * Glas u Gornjem Kolu (Pravilnik čl. 43, 44; Gornje Kolo čl. 4, 12).
 *
 * Traži aktivirano ZRNO i status čuvara Kola u trenutku glasanja: potvrđen i
 * `NOSILAC_ZRNA`. Glas gubi i onaj kome potvrda bude poništena.
 *
 * 🔴 Ne svoditi na „ima aktivno ZRNO": aktivno ZRNO bivšeg čuvara ide u
 * otključavanje tek na kraju perioda.
 */
export function smeGlasati(
  u: (KorisnikProsireni & KorisnikDozvole) | null | undefined,
  aktivnoZrno: number,
): boolean {
  return aktivnoZrno > 0 && potvrdjenKorisnik(u) && u?.tipKorisnika === NOSILAC_ZRNA;
}

/** Koren lanca potvrda — bootstrap poverenja (superadmin verifikuje prve ljude). */
export function jeKorenJemstva(u?: KorisnikDozvole | null): boolean {
  return jeSuperadmin(u);
}
