/**
 * Partnerstvo — ČISTA pravila (bez Prisme).
 *
 * Osnov: Pravilnik o pokroviteljstvu i donacijama Glava VI (čl. 40–45); Pravilnik o KOLO
 * sistemu čl. 19 st. 1 t. 4 i st. 2, čl. 37 st. 5; set 5.1.2.
 *
 * Zaseban fajl jer ova pravila čita i obrazac u pretraživaču. Servisni sloj
 * (`protokol/partnerstvo.ts`) ih re-eksportuje, pa server ima jedan ulaz.
 *
 * ─── Brane koje se mogu izgubiti bez vidljivog kvara ─────────────────────────
 *
 * 🔴 Koeficijent evidencije partnerstva je 1,00 (čl. 43 st. 1), bez kape (čl. 42 st. 2:
 * „vrednost ugovora o partnerstvu nije ograničena") i van zajedničkog dnevnog limita
 * (čl. 43 st. 3). Doprinos = `Math.round(obim × cena po jedinici × 1,00)` — POEN je ceo broj.
 *
 * 🔴 Ugovor NE sadrži broj POEN-a ni koeficijent (čl. 42 st. 1 → čl. 31 st. 3); sadrži izjavu
 * da se doprinos ne određuje ugovorom, da nije protivčinidba i da na njega niko nema
 * potraživanje, i da Fondacija nema obavezu promocije partnera (čl. 44 st. 2).
 *
 * 🔴 Izvršenje ne potvrđuje podnosilac prijave ni lice povezano sa partnerom (čl. 43 st. 2).
 *
 * 🔴 Partnerstvo NIJE osnov negativnog zapisa (Pravilnik čl. 17 st. 2 je iscrpan): po
 * prestanku se zabeleženo poništava, a evidentirano ostaje.
 */

import { FONDACIJA } from "@/lib/donacija-ugovor";
import { ODNOS_U_UGOVORU, type OdnosPremaDavaocu, type IshodProvere } from "@/lib/pokroviteljstvo-dobrima-pravila";

export type { IshodProvere };

// ─── Konstante iz akta ────────────────────────────────────────────────────────

/** Čl. 43 st. 1 — koeficijent evidencije partnerstva. Nikad se ne menja po nivou ni obliku. */
export const KOEFICIJENT_PARTNERSTVA = 1.0;

export const MIN_OPIS = 10;
export const MAX_OPIS = 1000;
export const MAX_JEDINICA = 40;
export const MIN_OPIS_IZVRSENJA = 5;
export const MAX_OPIS_IZVRSENJA = 1000;
/** Tehnička granica unosa (Decimal(12,2)), ne granica vrednosti iz akta. */
export const MAX_OBIM = 1_000_000;
export const MAX_CENA = 100_000_000;

// ─── Iznosi ───────────────────────────────────────────────────────────────────

const naDveDecimale = (n: number) => Math.round(n * 100) / 100;

/** Vrednost partnerstva (čl. 42 st. 2): obim × cena po jedinici, u dinarima. Nije ograničena. */
export function vrednostPartnerstva(obim: number, cenaPoJedinici: number): number {
  return naDveDecimale(obim * cenaPoJedinici);
}

/**
 * Doprinos koji se BELEŽI potvrdom izvršenog dela (čl. 43 st. 1): vrednost izvršenog dela
 * sa koeficijentom 1,00, zaokružena na ceo broj (pravilo 7: `Math.round`). Bez kape.
 */
export function poenZaIzvrsenje(obim: number, cenaPoJedinici: number): number {
  if (!(obim > 0) || !(cenaPoJedinici > 0)) return 0;
  return Math.round(obim * cenaPoJedinici * KOEFICIJENT_PARTNERSTVA);
}

// ─── Prijava (čl. 41 st. 2) ──────────────────────────────────────────────────

export type PredmetPartnerstva = {
  opis: string;
  jedinicaMere: string;
  cenaPoJedinici: number;
  obim: number;
  vrednostRsd: number;
  rokIzvrsenja: Date;
  obradaPodataka: boolean;
};

const tekst = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
const daJe = (v: unknown) => v === true || v === "true" || v === "on" || v === "1";
const dveDecimale = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;

/**
 * Čita prijavu partnerstva: opis usluge, odnosno ustupanja, jedinica mere, predviđeni obim,
 * rok izvršenja, cena po jedinici iz cenovnika, da li partner obrađuje podatke korisnika i
 * izjava podnosioca. Fotografiju cenovnika proverava ruta (`proveriDokaze`).
 */
export function procitajPrijavuPartnerstva(
  b: Record<string, unknown>,
  sada: Date = new Date(),
): { ok: true; podaci: PredmetPartnerstva } | { ok: false; razlog: string } {
  const opis = tekst(b.opis);
  if (opis.length < MIN_OPIS || opis.length > MAX_OPIS)
    return { ok: false, razlog: `Opiši uslugu, odnosno ustupanje (od ${MIN_OPIS} do ${MAX_OPIS} znakova).` };

  const jedinicaMere = tekst(b.jedinicaMere);
  if (jedinicaMere.length < 1 || jedinicaMere.length > MAX_JEDINICA)
    return { ok: false, razlog: "Upiši jedinicu mere obima (čas, komad, mesec korišćenja i slično)." };

  const cenaPoJedinici = Number(b.cenaPoJedinici);
  if (!Number.isFinite(cenaPoJedinici) || cenaPoJedinici <= 0 || cenaPoJedinici > MAX_CENA || !dveDecimale(cenaPoJedinici))
    return { ok: false, razlog: "Cena po jedinici mora biti pozitivan iznos, najviše na dve decimale." };

  const obim = Number(b.obim);
  if (!Number.isFinite(obim) || obim <= 0 || obim > MAX_OBIM || !dveDecimale(obim))
    return { ok: false, razlog: "Predviđeni obim mora biti pozitivan broj jedinica, najviše na dve decimale." };

  const rok = typeof b.rokIzvrsenja === "string" ? new Date(b.rokIzvrsenja) : null;
  if (!rok || Number.isNaN(rok.getTime())) return { ok: false, razlog: "Upiši rok izvršenja." };
  const danas = new Date(sada);
  danas.setHours(0, 0, 0, 0);
  if (rok.getTime() < danas.getTime()) return { ok: false, razlog: "Rok izvršenja ne može biti u prošlosti." };

  if (!daJe(b.izjavaPodnosioca))
    return {
      ok: false,
      razlog: "Potrebna je izjava da si ovlašćen da u ime partnera podneseš prijavu i da prihvataš uslove ugovora o partnerstvu.",
    };

  return {
    ok: true,
    podaci: {
      opis,
      jedinicaMere,
      cenaPoJedinici,
      obim,
      vrednostRsd: vrednostPartnerstva(obim, cenaPoJedinici),
      rokIzvrsenja: rok,
      obradaPodataka: daJe(b.obradaPodataka),
    },
  };
}

// ─── Izvršenje (čl. 43) ──────────────────────────────────────────────────────

export function procitajIzvrsenje(
  b: Record<string, unknown>,
): { ok: true; podaci: { obim: number; opis: string } } | { ok: false; razlog: string } {
  const obim = Number(b.obim);
  if (!Number.isFinite(obim) || obim <= 0 || obim > MAX_OBIM || !dveDecimale(obim))
    return { ok: false, razlog: "Obim izvršenog dela mora biti pozitivan broj jedinica, najviše na dve decimale." };
  const opis = tekst(b.opis);
  if (opis.length < MIN_OPIS_IZVRSENJA || opis.length > MAX_OPIS_IZVRSENJA)
    return { ok: false, razlog: "Opiši šta je izvršeno." };
  return { ok: true, podaci: { obim, opis } };
}

/**
 * Sme li se prijaviti izvršen deo: partnerstvo je prihvaćeno, a zbir prijavljenih i
 * potvrđenih izvršenja sa ovim ne prelazi ugovoreni obim — za neizvršeni deo doprinos se
 * ne beleži, a deo preko ugovora nije predmet ugovora (čl. 42 st. 1, čl. 43 st. 1).
 */
export function smePrijavitiIzvrsenje(p: {
  status: string;
  obimUgovora: number;
  /** Zbir obima izvršenja koja su PRIJAVLJENA, ZABELEŽENA ili EVIDENTIRANA. */
  zauzetObim: number;
  obim: number;
}): IshodProvere {
  if (p.status !== "PRIHVACENO") return { ok: false, razlog: "Izvršenje se prijavljuje samo dok partnerstvo traje." };
  if (naDveDecimale(p.zauzetObim + p.obim) > naDveDecimale(p.obimUgovora))
    return {
      ok: false,
      razlog: `Zbir prijavljenih izvršenja ne može preći ugovoreni obim (preostalo: ${naDveDecimale(Math.max(0, p.obimUgovora - p.zauzetObim))}).`,
    };
  return { ok: true };
}

/**
 * Lice povezano sa partnerom (čl. 43 st. 2): ko vodi upis tog partnera (i raniji, obrisan
 * upis istog MB, odnosno BPG), ko je podneo prijavu partnerstva ili pokroviteljstva tog
 * partnera, i zaposleni koga je partner odredio.
 */
export function jePovezanoLice(
  userId: string,
  p: { vlasniciUpisa: string[]; podnosioci: string[]; zaposleni: string[] },
): boolean {
  return p.vlasniciUpisa.includes(userId) || p.podnosioci.includes(userId) || p.zaposleni.includes(userId);
}

/**
 * Ko sme da potvrdi izvršen deo (čl. 43 st. 1–2): direktor (superadmin) ili lice koje on
 * ovlasti; nikad podnosilac prijave, onaj ko je izvršenje prijavio, ni lice povezano sa
 * partnerom. Kad partner obrađuje podatke korisnika, ugovor o obradi mora biti zabeležen
 * pre prve potvrde (čl. 42 st. 3).
 */
export function smePotvrditiIzvrsenje(p: {
  potvrdilacId: string;
  jeSuperadmin: boolean;
  ovlascenoLiceId: string | null;
  podnosilacId: string;
  prijavioId: string;
  povezan: boolean;
  statusPartnerstva: string;
  statusIzvrsenja: string;
  obradaPodataka: boolean;
  dpaZabelezenAt: Date | null;
}): IshodProvere {
  if (!p.jeSuperadmin && p.ovlascenoLiceId !== p.potvrdilacId)
    return { ok: false, razlog: "Izvršenje potvrđuje direktor Fondacije ili lice koje on ovlasti." };
  if (p.potvrdilacId === p.podnosilacId || p.potvrdilacId === p.prijavioId)
    return { ok: false, razlog: "Izvršenje ne potvrđuje lice koje je i samo podnosilac prijave." };
  if (p.povezan) return { ok: false, razlog: "Izvršenje ne potvrđuje lice koje je povezano sa partnerom." };
  if (p.statusPartnerstva !== "PRIHVACENO") return { ok: false, razlog: "Partnerstvo ne traje." };
  if (p.statusIzvrsenja !== "PRIJAVLJENO") return { ok: false, razlog: "Izvršenje je već obrađeno." };
  if (p.obradaPodataka && !p.dpaZabelezenAt)
    return { ok: false, razlog: "Partner obrađuje podatke korisnika — pre prve potvrde mora biti zabeležen ugovor o obradi." };
  return { ok: true };
}

// ─── Partner kao dobavljač (čl. 45) ──────────────────────────────────────────

const normalizuj = (s: string) =>
  s
    .toLowerCase()
    .replace(/["„“”'«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Upozorenje uz čl. 45 st. 1: troškovi Fondacije i nabavke u kojima se pominje naziv ili
 * matični broj partnera. Fondacija za dobavljača ne vodi matični broj, pa je ovo samo
 * pomoć direktoru — odluku da partner nije plaćeni dobavljač za istu vrstu usluge daje
 * direktor izjavom pri prihvatanju.
 */
export function poklapanjaSaDobavljacem(
  partner: { naziv: string; maticniBroj: string | null },
  stavke: { id: string; opis: string }[],
): string[] {
  const naziv = normalizuj(partner.naziv);
  const mb = partner.maticniBroj?.trim() || null;
  return stavke
    .filter((s) => {
      const o = normalizuj(s.opis);
      return (naziv.length >= 3 && o.includes(naziv)) || (!!mb && o.includes(mb));
    })
    .map((s) => s.id);
}

// ─── Ugovor (čl. 42) ─────────────────────────────────────────────────────────

/**
 * Tekst ugovora o partnerstvu (čl. 42 st. 1). Generiše se jednom, pri prihvatanju prijave, i
 * SNIMA — ne generiše se ponovo pri čitanju (pravilo 11).
 *
 * 🔴 Ugovor NE sadrži broj POEN-a ni koeficijent evidencije (čl. 42 st. 1 → čl. 31 st. 3).
 */
export function generisiUgovorPartnerstvaTekst(p: {
  vrstaDavaoca: "FIRMA" | "GAZDINSTVO";
  naziv: string;
  pib: string | null;
  maticniBroj: string | null;
  adresaSedista: string | null;
  bpg: string | null;
  zastupnikImePrezime: string;
  zastupnikFunkcija: string;
  odnosPremaDavaocu: OdnosPremaDavaocu;
  kontaktEmail: string;
  kontaktTelefon: string;
  opis: string;
  jedinicaMere: string;
  obim: number;
  cenaPoJedinici: number;
  vrednostRsd: number;
  rokIzvrsenja: Date;
  obradaPodataka: boolean;
  datum: Date;
}): string {
  const rsd = (n: number) => n.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const broj = (n: number) => n.toLocaleString("sr-RS", { maximumFractionDigits: 2 });
  const gazdinstvo = p.vrstaDavaoca === "GAZDINSTVO";
  const odnos = ODNOS_U_UGOVORU[p.odnosPremaDavaocu];
  const podnosilac = p.odnosPremaDavaocu === "ZASTUPNIK"
    ? `${p.zastupnikImePrezime}, ${odnos} (${p.zastupnikFunkcija})`
    : `${p.zastupnikImePrezime}, ${odnos}`;
  return [
    "UGOVOR O PARTNERSTVU",
    "",
    `Zaključen dana ${p.datum.toLocaleDateString("sr-RS")} između:`,
    gazdinstvo
      ? `1) ${p.zastupnikImePrezime}, nosilac registrovanog poljoprivrednog gazdinstva „${p.naziv}", ` +
        `broj gazdinstva ${p.bpg ?? ""} (u daljem tekstu: Partner), i`
      : `1) ${p.naziv}, sa sedištem na adresi ${p.adresaSedista ?? ""}, matični broj ${p.maticniBroj ?? ""}, PIB ${p.pib ?? ""}, ` +
        `koga zastupa ${podnosilac} (u daljem tekstu: Partner), i`,
    `2) ${FONDACIJA} (u daljem tekstu: Fondacija).`,
    "",
    `Kontakt Partnera: adresa elektronske pošte ${p.kontaktEmail}, telefon ${p.kontaktTelefon}.`,
    "",
    `Član 1. Partner se obavezuje da Fondaciji bez naknade pruži uslugu, odnosno ustupi na korišćenje, radi zajedničkog dobra: ${p.opis}. ` +
      `Obim: ${broj(p.obim)} (jedinica mere: ${p.jedinicaMere}). Rok izvršenja: ${p.rokIzvrsenja.toLocaleDateString("sr-RS")}.`,
    `Član 2. Vrednost partnerstva iznosi ${rsd(p.vrednostRsd)} dinara (${broj(p.obim)} × ${rsd(p.cenaPoJedinici)} dinara po jedinici, prema ceni koju Partner primenjuje u prometu). Fondacija cenu ne procenjuje, ne upoređuje i ne određuje.`,
    "Član 3. Usluga je bez naknade. Za nju Partner od Fondacije ne prima novac ni drugu protivčinidbu i njome ne stiče potraživanje prema Fondaciji ni prednost u bilo kom postupku Fondacije.",
    "Član 4. Doprinos koji se povodom ovog ugovora evidentira po pravilima KOLO sistema ne određuje se ovim ugovorom; taj upis nije protivčinidba za uslugu i ni Partner ni podnosilac prijave na njega nemaju potraživanje.",
    "Član 5. Partner se upisuje na spisak partnera nazivom i logotipom. Fondacija nema obavezu da Partnera ističe ili promoviše; kada ga pominje u svojim objavama, čini to po sopstvenoj odluci i u sopstvenom interesu, bez obaveze prema Partneru, i Partner po tom osnovu ne stiče nikakvo pravo.",
    p.obradaPodataka
      ? "Član 6. Partner u izvršenju obrađuje podatke o ličnosti korisnika, pa ugovorne strane uz ovaj ugovor zaključuju i ugovor o obradi podataka o ličnosti. Pre njegovog zaključenja izvršenje se ne potvrđuje."
      : "Član 6. Partner u izvršenju ne obrađuje podatke o ličnosti korisnika. Ako bi izvršenje to zahtevalo, ugovorne strane pre toga zaključuju ugovor o obradi podataka o ličnosti.",
    "Član 7. Izvršenje, odnosno izvršeni deo, potvrđuje direktor Fondacije ili lice koje on ovlasti; izvršenje ne potvrđuje lice koje je i samo podnosilac prijave ili je sa Partnerom povezano.",
    "Član 8. Poreske obaveze koje proizlaze iz ovog partnerstva snosi Partner u skladu sa propisima. Fondacija ne pruža poreski savet.",
    "Član 9. Ugovor se zaključuje elektronskim putem na platformi KOLO. Podnosilac ga prihvata podnošenjem prijave, a Fondacija prihvatanjem prijave; ugovor je zaključen trenutkom prihvatanja. Platforma beleži vreme zaključenja i kontrolni broj teksta.",
    "",
    gazdinstvo
      ? `Podnošenjem prijave ${p.zastupnikImePrezime} je potvrdio da je nosilac navedenog gazdinstva i da prihvata uslove ugovora.`
      : `Podnošenjem prijave ${p.zastupnikImePrezime} je potvrdio svoje ovlašćenje da u ime Partnera zaključi ovaj ugovor i da prihvata uslove ugovora.`,
  ].join("\n");
}
