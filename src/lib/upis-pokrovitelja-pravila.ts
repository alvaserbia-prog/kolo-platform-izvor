/**
 * Upis pokrovitelja u evidenciju — ČISTA pravila (bez Prisme).
 *
 * Osnov: Pravilnik o pokroviteljstvu i donacijama čl. 16–18 (upis), čl. 19 i čl. 28
 * (prijave iz odobrenog upisa), čl. 26 st. 2 (šta se javno prikazuje), čl. 18 st.
 * 3 (lista zabrane se vezuje za upis).
 *
 * Zaseban fajl jer ova pravila čita i obrazac u pretraživaču. Servisni sloj
 * (`protokol/upis-pokrovitelja.ts`) ih re-eksportuje, pa server ima jedan ulaz.
 *
 * ─── Brane koje se mogu izgubiti bez vidljivog kvara ─────────────────────────
 *
 * 🔴 Prijava pokroviteljstva (novčana i dobrima i uslugama) ide SAMO iz odobrenog
 * upisa koji vodi podnosilac (`upisSpremanZaPrijavu`). Podaci o pokrovitelju u
 * prijavi su snimak upisa, ne unos iz obrasca prijave.
 * 🔴 Isti pokrovitelj se upisuje jednom: najviše jedan živ upis po matičnom broju,
 * odnosno BPG-u (delimičan jedinstveni indeks u bazi + provera u servisu).
 * 🔴 Adresa na mapi NIJE opoziv pristanak (dopuna 20.10.2026): izjava je obavezna
 * pri upisu i nema „povlačenja". Izlaz je samo brisanje upisa, i to kad pokrovitelj
 * nema ugovor sa neiskorišćenim vaučerima (`smeObrisatiUpis`).
 * 🔴 Javno (mapa, rang-lista, vaučeri) idu samo naziv, logotip, mesto i adresa —
 * nikad MB, PIB, BPG, sedište, ime ni kontakt (`javniPrikazUpisa`).
 */

import { procitajImePrezime } from "@/lib/identitet-pravila";
import { lokacijaUSrbiji } from "@/lib/gazdinstvo-pravila";
import {
  ODNOS_U_UGOVORU,
  odnosDozvoljen,
  trebaIzjavaOvlascenja,
  jePravniOblik,
  obavestavaOrgane,
  jeClanskiOblik,
  ocistiBpgDavaoca,
  ocistiKontaktEmail,
  ocistiKontaktTelefon,
  type OdnosPremaDavaocu,
  type VrstaDavaoca,
  type PravniOblik,
  type IshodProvere,
} from "@/lib/pokroviteljstvo-dobrima-pravila";

export type StatusUpisa = "NA_PROVERI" | "ODOBREN" | "ODBIJEN";

const MAX_NAZIV = 200;
const MAX_ADRESA = 200;
const MAX_FUNKCIJA = 100;

const tekst = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
const daJe = (v: unknown) => v === true || v === "true";

export function ocistiPib(v: unknown): string | null {
  const s = tekst(v).replace(/\s/g, "");
  return /^\d{9}$/.test(s) ? s : null;
}

export function ocistiMaticniBroj(v: unknown): string | null {
  const s = tekst(v).replace(/\s/g, "");
  return /^\d{8}$/.test(s) ? s : null;
}

export function ocistiNaziv(v: unknown): string | null {
  const s = tekst(v);
  return s && s.length <= MAX_NAZIV ? s : null;
}

/** Podaci upisa posle provere (mesto za mapu razrešava servis kroz `razresiNaselje`). */
export type PodaciUpisa = {
  vrsta: VrstaDavaoca;
  naziv: string;
  /** Samo FIRMA (čl. 16 st. 2). */
  pravniOblik: PravniOblik | null;
  adresaSedista: string | null;
  maticniBroj: string | null;
  pib: string | null;
  bpg: string | null;
  imePrezime: string;
  zastupnikFunkcija: string | null;
  odnosPremaDavaocu: OdnosPremaDavaocu;
  kontaktEmail: string;
  kontaktTelefon: string;
  mapaAdresa: string;
  mapaLat: number;
  mapaLng: number;
  /** Izjava o ovlašćenju (čl. 17 st. 1) — data samo kad je potrebna. */
  izjavaOvlascenja: boolean;
};

/** Tačka i adresa za mapu (čl. 16 st. 2 t. 3) — zajednička provera za upis i izmenu. */
export function procitajMapu(
  b: Record<string, unknown>,
): { ok: true; mapaAdresa: string; mapaLat: number; mapaLng: number } | { ok: false; razlog: string } {
  const mapaAdresa = tekst(b.mapaAdresa);
  if (mapaAdresa.length < 3 || mapaAdresa.length > MAX_ADRESA)
    return { ok: false, razlog: "Upiši adresu na kojoj se pokrovitelj prikazuje na mapi." };
  const lat = Number(b.mapaLat);
  const lng = Number(b.mapaLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !lokacijaUSrbiji(lat, lng))
    return { ok: false, razlog: "Postavi tačku na mapi (u Srbiji)." };
  return { ok: true, mapaAdresa, mapaLat: lat, mapaLng: lng };
}

/**
 * Provera upisa (čl. 16 st. 2 i 4, čl. 17). Za pravno lice i preduzetnika: naziv, sedište,
 * MB, PIB, odnos prema pokrovitelju, ime i prezime korisnika; za gazdinstvo: ime i
 * prezime nosioca, naziv i BPG. Za oba: kontakt, mesto i adresa za mapu uz OBAVEZNU
 * izjavu o prikazu adrese, potvrda o evidentiranju i, kad treba, izjava o ovlašćenju.
 * Logotip proverava servis (URL našeg skladišta), mesto — `razresiNaselje`.
 */
export function procitajUpis(
  b: Record<string, unknown>,
): { ok: true; podaci: PodaciUpisa } | { ok: false; razlog: string } {
  const vrsta: VrstaDavaoca = b.vrsta === "GAZDINSTVO" ? "GAZDINSTVO" : "FIRMA";
  const gazdinstvo = vrsta === "GAZDINSTVO";

  let pravniOblik: PravniOblik | null = null;
  if (!gazdinstvo) {
    if (!jePravniOblik(b.pravniOblik)) return { ok: false, razlog: "Izaberi pravni oblik pokrovitelja." };
    pravniOblik = b.pravniOblik;
  }

  const odnosUnos = gazdinstvo ? "NOSILAC_GAZDINSTVA" : b.odnosPremaDavaocu;
  if (!odnosDozvoljen(vrsta, odnosUnos, pravniOblik))
    return { ok: false, razlog: "Izaberi svoj odnos prema pokrovitelju." };
  const odnos = odnosUnos;

  const ime = procitajImePrezime(b.imePrezime);
  if (!ime.ok) return { ok: false, razlog: `Ime i prezime: ${ime.razlog}` };

  const naziv = ocistiNaziv(b.naziv);
  if (!naziv) return { ok: false, razlog: gazdinstvo ? "Upiši naziv gazdinstva." : "Upiši naziv pravnog lica ili preduzetnika." };

  let adresaSedista: string | null = null;
  let maticniBroj: string | null = null;
  let pib: string | null = null;
  let bpg: string | null = null;
  let zastupnikFunkcija: string | null = null;
  if (gazdinstvo) {
    bpg = ocistiBpgDavaoca(b.bpg);
    if (!bpg) return { ok: false, razlog: "Broj poljoprivrednog gazdinstva (BPG) ima dvanaest cifara." };
  } else {
    pib = ocistiPib(b.pib);
    if (!pib) return { ok: false, razlog: "PIB ima devet cifara." };
    maticniBroj = ocistiMaticniBroj(b.maticniBroj);
    if (!maticniBroj) return { ok: false, razlog: "Matični broj ima osam cifara." };
    adresaSedista = tekst(b.adresaSedista);
    if (adresaSedista.length < 5 || adresaSedista.length > MAX_ADRESA) return { ok: false, razlog: "Upiši adresu sedišta." };
    if (odnos === "ZASTUPNIK") {
      zastupnikFunkcija = tekst(b.zastupnikFunkcija);
      if (zastupnikFunkcija.length < 2 || zastupnikFunkcija.length > MAX_FUNKCIJA)
        return { ok: false, razlog: "Upiši funkciju zastupnika (npr. direktor)." };
    }
  }

  const kontaktEmail = ocistiKontaktEmail(b.kontaktEmail);
  if (!kontaktEmail) return { ok: false, razlog: "Upiši ispravnu adresu elektronske pošte za kontakt." };
  const kontaktTelefon = ocistiKontaktTelefon(b.kontaktTelefon);
  if (!kontaktTelefon) return { ok: false, razlog: "Upiši ispravan broj telefona za kontakt." };

  const mapa = procitajMapu(b);
  if (!mapa.ok) return mapa;
  // 🔴 Izjava o prikazu adrese je OBAVEZNA (čl. 16 st. 2 t. 3) — nije pristanak koji se povlači.
  if (!daJe(b.izjavaAdresa))
    return { ok: false, razlog: "Potrebna je izjava da je pokrovitelj saglasan da se adresa prikazuje na mapi." };

  const izjavaOvlascenja = daJe(b.izjavaOvlascenja);
  if (trebaIzjavaOvlascenja(odnos, pravniOblik) && !izjavaOvlascenja)
    return {
      ok: false,
      razlog: jeClanskiOblik(pravniOblik)
        ? "Potrebna je izjava da te je nadležni organ pokrovitelja ovlastio da izvršiš upis i zaključuješ ugovore o donaciji."
        : "Potrebna je izjava da si ovlašćen da u ime pokrovitelja zaključuješ ugovore o donaciji.",
    };
  if (!daJe(b.potvrdaEvidentiranja))
    return { ok: false, razlog: "Potrebna je potvrda da si upoznat sa načinom evidentiranja doprinosa." };

  return {
    ok: true,
    podaci: {
      vrsta,
      naziv,
      pravniOblik,
      adresaSedista,
      maticniBroj,
      pib,
      bpg,
      imePrezime: ime.imePrezime,
      zastupnikFunkcija,
      odnosPremaDavaocu: odnos,
      kontaktEmail,
      kontaktTelefon,
      mapaAdresa: mapa.mapaAdresa,
      mapaLat: mapa.mapaLat,
      mapaLng: mapa.mapaLng,
      izjavaOvlascenja: trebaIzjavaOvlascenja(odnos, pravniOblik) && izjavaOvlascenja,
    },
  };
}

/**
 * Ključevi teksta izjave o ovlašćenju i potvrde o evidentiranju (čl. 17) —
 * isti za ekran i za tekst koji server snima: kod oblika bez vlasnika podnosilac
 * obaveštava organe i članove, kod članskih oblika ovlašćuje ga organ.
 */
export function kljuceviIzjavaUpisa(oblik: PravniOblik | null): { ovlascenje: string; potvrda: string } {
  return {
    ovlascenje: jeClanskiOblik(oblik) ? "upis_izjava_ovlascenja_organ" : "upis_izjava_ovlascenja",
    potvrda: obavestavaOrgane(oblik) ? "upis_potvrda_evidentiranja_organi" : "upis_potvrda_evidentiranja",
  };
}

/** Funkcija upisana u ugovor: zastupnik — njegova funkcija; ostali — sam odnos. */
export function funkcijaZaUgovor(u: { odnosPremaDavaocu: OdnosPremaDavaocu | null; zastupnikFunkcija: string | null }): string {
  if (u.odnosPremaDavaocu === "ZASTUPNIK" && u.zastupnikFunkcija) return u.zastupnikFunkcija;
  return u.odnosPremaDavaocu ? ODNOS_U_UGOVORU[u.odnosPremaDavaocu] : (u.zastupnikFunkcija ?? "");
}

export type UpisZaPrijavu = {
  status: StatusUpisa;
  vrsta: VrstaDavaoca;
  vlasnikUserId: string;
  obrisanAt: Date | null;
  naziv: string;
  imePrezime: string | null;
  odnosPremaDavaocu: OdnosPremaDavaocu | null;
  kontaktEmail: string | null;
  kontaktTelefon: string | null;
  maticniBroj: string | null;
  pib: string | null;
  adresaSedista: string | null;
  bpg: string | null;
};

/**
 * Sme li korisnik da podnese prijavu iz upisa (čl. 18 st. 3–4, čl. 19 st. 1, čl. 28
 * st. 1): upis vodi on, odobren je i nije obrisan; podaci za ugovor su potpuni
 * (zatečeni upisi iz ranijih prijava ih ponekad nemaju — dopunjuju se u „Podaci").
 *
 * Novčano pokroviteljstvo daje pravno lice, preduzetnik ili nosilac registrovanog
 * poljoprivrednog gazdinstva (čl. 15 st. 1, set 4.7.9 — odluka vlasnika 20.10.2026), pa
 * iz svakog odobrenog upisa idu obe vrste prijave. Lista zabrane (čl. 35 st. 5)
 * zatvara samo nov ugovor o pokroviteljstvu dobrima i uslugama.
 */
export function upisSpremanZaPrijavu(
  u: UpisZaPrijavu,
  p: { userId: string; vrstaPrijave: "NOVAC" | "DOBRA"; naListiZabrane: boolean },
): IshodProvere {
  if (u.vlasnikUserId !== p.userId) return { ok: false, razlog: "Prijavu podnosi korisnik koji vodi upis pokrovitelja." };
  if (u.obrisanAt) return { ok: false, razlog: "Upis pokrovitelja je obrisan." };
  if (u.status !== "ODOBREN")
    return { ok: false, razlog: "Prijava se podnosi iz odobrenog upisa — sačekaj da Fondacija odobri upis." };
  if (p.vrstaPrijave === "DOBRA" && p.naListiZabrane)
    return {
      ok: false,
      razlog: "Pokrovitelj je na listi zabrane posle raskida ugovora i ne može zaključiti nov ugovor dok ga Fondacija sa liste ne skine.",
    };
  const nedostaje =
    !u.imePrezime || !u.odnosPremaDavaocu || !u.naziv ||
    (u.vrsta === "FIRMA" ? !u.maticniBroj || !u.pib || !u.adresaSedista : !u.bpg) ||
    (p.vrstaPrijave === "DOBRA" && (!u.kontaktEmail || !u.kontaktTelefon));
  if (nedostaje) return { ok: false, razlog: "Upis nema sve podatke potrebne za ugovor — dopuni ih u podacima pokrovitelja." };
  return { ok: true };
}

/**
 * Ključ novčanog pokrovitelja — reda `Pokrovitelj` koji nosi kumulativni novčani
 * doprinos i nivo (donacije čl. 21 i 22): pravno lice i preduzetnik po PIB-u,
 * registrovano poljoprivredno gazdinstvo po BPG-u.
 *
 * 🔴 Gazdinstvo ima SOPSTVENI kumulativ (čl. 22 st. 3, set 4.7.9) — ne sabira se ni
 * sa ličnim donacijama nosioca ni sa firmom sa kojom je nosilac povezan. Isti ključ
 * čita i koeficijent za pokroviteljstvo dobrima i uslugama (čl. 33 st. 2), pa
 * gazdinstvo koje je doniralo novac dobija koeficijent svog novčanog nivoa, a bez
 * novca 1,00. `null` = nema ključa (nepotpun zatečeni zapis) → nema kumulativa.
 */
export function kljucNovcanogPokrovitelja(
  p: { vrsta: VrstaDavaoca; pib: string | null; bpg: string | null },
): { pib: string } | { bpg: string } | null {
  if (p.vrsta === "GAZDINSTVO") return p.bpg ? { bpg: p.bpg } : null;
  return p.pib ? { pib: p.pib } : null;
}

/**
 * Da li je upis odobren tako da se novčana prijava iz njega sme potvrditi (čl. 18
 * st. 1, čl. 19 st. 3): pravno lice i preduzetnik — odobren uz poređenje sa
 * registrom; registrovano gazdinstvo — odobren (sa APR-om se ne poredi).
 */
export function upisOdobrenZaPotvrdu(u: {
  vrsta: VrstaDavaoca;
  status: StatusUpisa;
  aprProveraAt: Date | null;
  odlukaAt: Date | null;
}): boolean {
  if (u.status === "ODBIJEN") return false;
  return u.vrsta === "GAZDINSTVO" ? !!u.odlukaAt : !!u.aprProveraAt;
}

// ─── Izmena upisa (čl. 18 st. 2) ─────────────────────────────────────────────

export type IzmenaUpisa = {
  /** Menja se odmah, bez provere: kontakt, sedište i podaci za mapu. */
  odmah: Partial<{
    kontaktEmail: string;
    kontaktTelefon: string;
    adresaSedista: string;
    mapaMesto: string;
    mapaAdresa: string;
    mapaLat: number;
    mapaLng: number;
    imePrezime: string;
    odnosPremaDavaocu: OdnosPremaDavaocu;
    zastupnikFunkcija: string | null;
  }>;
  /** Ide na ponovnu proveru Fondacije: naziv, matični broj, logotip. */
  naProveru: Partial<{ naziv: string; maticniBroj: string; logoUrl: string }>;
};

/**
 * Razvrstava izmenu na ono što važi odmah i ono što ide na ponovnu proveru. PIB i
 * BPG se ne menjaju (drugi PIB je drugi pokrovitelj — nov upis). Ime i odnos se
 * mogu dopuniti samo dok ih zatečeni upis nema; jednom upisani se ne menjaju, jer
 * su osnov poređenja sa registrom.
 */
export function razvrstajIzmenu(
  b: Record<string, unknown>,
  trenutno: {
    vrsta: VrstaDavaoca;
    naziv: string;
    maticniBroj: string | null;
    logoUrl: string | null;
    imePrezime: string | null;
    odnosPremaDavaocu: OdnosPremaDavaocu | null;
    mapaMesto: string | null;
  },
  mesto: string | null,
): { ok: true; izmena: IzmenaUpisa } | { ok: false; razlog: string } {
  const izmena: IzmenaUpisa = { odmah: {}, naProveru: {} };
  const ima = (k: string) => b[k] !== undefined && b[k] !== null;

  if (ima("kontaktEmail")) {
    const e = ocistiKontaktEmail(b.kontaktEmail);
    if (!e) return { ok: false, razlog: "Upiši ispravnu adresu elektronske pošte za kontakt." };
    izmena.odmah.kontaktEmail = e;
  }
  if (ima("kontaktTelefon")) {
    const t = ocistiKontaktTelefon(b.kontaktTelefon);
    if (!t) return { ok: false, razlog: "Upiši ispravan broj telefona za kontakt." };
    izmena.odmah.kontaktTelefon = t;
  }
  if (ima("adresaSedista") && trenutno.vrsta === "FIRMA") {
    const a = tekst(b.adresaSedista);
    if (a.length < 5 || a.length > MAX_ADRESA) return { ok: false, razlog: "Upiši adresu sedišta." };
    izmena.odmah.adresaSedista = a;
  }
  if (ima("mapaAdresa") || ima("mapaLat") || ima("mapaLng")) {
    const m = procitajMapu(b);
    if (!m.ok) return m;
    if (!mesto && !trenutno.mapaMesto) return { ok: false, razlog: "Izaberi mesto iz spiska." };
    // 🔴 Izjava o prikazu adrese ide uz svaku novu adresu — obavezna, ne povlači se.
    if (!daJe(b.izjavaAdresa))
      return { ok: false, razlog: "Potrebna je izjava da je pokrovitelj saglasan da se adresa prikazuje na mapi." };
    Object.assign(izmena.odmah, { mapaAdresa: m.mapaAdresa, mapaLat: m.mapaLat, mapaLng: m.mapaLng });
    if (mesto) izmena.odmah.mapaMesto = mesto;
  }
  if (ima("imePrezime") && !trenutno.imePrezime) {
    const r = procitajImePrezime(b.imePrezime);
    if (!r.ok) return { ok: false, razlog: `Ime i prezime: ${r.razlog}` };
    izmena.odmah.imePrezime = r.imePrezime;
  }
  if (ima("odnosPremaDavaocu") && !trenutno.odnosPremaDavaocu) {
    if (!odnosDozvoljen(trenutno.vrsta, b.odnosPremaDavaocu)) return { ok: false, razlog: "Izaberi svoj odnos prema pokrovitelju." };
    izmena.odmah.odnosPremaDavaocu = b.odnosPremaDavaocu;
    if (b.odnosPremaDavaocu === "ZASTUPNIK") {
      const f = tekst(b.zastupnikFunkcija);
      if (f.length < 2 || f.length > MAX_FUNKCIJA) return { ok: false, razlog: "Upiši funkciju zastupnika (npr. direktor)." };
      izmena.odmah.zastupnikFunkcija = f;
    }
  }

  if (ima("naziv")) {
    const n = ocistiNaziv(b.naziv);
    if (!n) return { ok: false, razlog: "Upiši naziv." };
    if (n !== trenutno.naziv) izmena.naProveru.naziv = n;
  }
  if (ima("maticniBroj") && trenutno.vrsta === "FIRMA") {
    const mb = ocistiMaticniBroj(b.maticniBroj);
    if (!mb) return { ok: false, razlog: "Matični broj ima osam cifara." };
    if (mb !== trenutno.maticniBroj) izmena.naProveru.maticniBroj = mb;
  }
  if (typeof b.logoUrl === "string" && b.logoUrl && b.logoUrl !== trenutno.logoUrl) izmena.naProveru.logoUrl = b.logoUrl;
  return { ok: true, izmena };
}

// ─── Brisanje upisa (čl. 18 st. 4) i gazdinstva (gazdinstva čl. 21) ───

export type VaucerZaBrisanje = {
  status: string;
  ugovor: { status: string; vaziDo: Date | null };
};

/**
 * Neiskorišćen vaučer (čl. 18 st. 4): vaučer potpisanog ugovora koji nije
 * iskorišćen, nije istekao i nije prestao — slobodan ili uzet, dok važi.
 */
export function jeNeiskoriscenVaucer(v: VaucerZaBrisanje, sada: Date): boolean {
  if (v.status !== "SLOBODAN" && v.status !== "DODELJEN") return false;
  if (v.ugovor.status !== "POTPISAN") return false;
  return !!v.ugovor.vaziDo && v.ugovor.vaziDo.getTime() > sada.getTime();
}

/**
 * Sme li se upis (odnosno gazdinstvo koje je i pokrovitelj) obrisati: samo kad nema
 * ugovora o pokroviteljstvu dobrima i uslugama sa neiskorišćenim vaučerima.
 */
export function smeObrisatiUpis(vauceri: VaucerZaBrisanje[], sada: Date): IshodProvere {
  if (vauceri.some((v) => jeNeiskoriscenVaucer(v, sada)))
    return {
      ok: false,
      razlog: "Brisanje nije moguće dok pokrovitelj ima ugovor o pokroviteljstvu dobrima i uslugama sa neiskorišćenim vaučerima.",
    };
  return { ok: true };
}

// ─── Javni prikaz (čl. 26 st. 2) ─────────────────────────────────────────────

export type TackaPokrovitelja = {
  id: string;
  naziv: string;
  logoUrl: string | null;
  mesto: string;
  adresa: string | null;
  lat: number;
  lng: number;
};

/**
 * Šta o upisu ide na mapu: naziv, logotip, mesto i adresa — 🔴 ništa drugo (čl. 26
 * st. 2). Adresa samo uz datu izjavu (zatečeni upis bez izjave nema ni tačku).
 * Upis koji nije odobren ili je obrisan ne ide na mapu.
 */
export function javniPrikazUpisa(u: {
  id: string;
  status: StatusUpisa;
  obrisanAt: Date | null;
  naziv: string;
  logoUrl: string | null;
  mapaMesto: string | null;
  mapaAdresa: string | null;
  mapaLat: number | null;
  mapaLng: number | null;
  izjavaAdresaAt: Date | null;
}): TackaPokrovitelja | null {
  if (u.status !== "ODOBREN" || u.obrisanAt) return null;
  if (u.mapaLat == null || u.mapaLng == null || !u.mapaMesto || !u.izjavaAdresaAt) return null;
  return {
    id: u.id,
    naziv: u.naziv,
    logoUrl: u.logoUrl,
    mesto: u.mapaMesto,
    adresa: u.mapaAdresa,
    lat: u.mapaLat,
    lng: u.mapaLng,
  };
}

/**
 * Da li se pokrovitelj prikazuje na rang-listi (čl. 18 st. 4): doprinosi dati do
 * brisanja upisa OSTAJU na rang-listi, sa nazivom i logotipom; uklanja se samo na
 * zahtev korisnika koji je vodio upis.
 */
export function naRangListi(u: { uklonjenSaRangListeAt: Date | null } | null): boolean {
  return !u || !u.uklonjenSaRangListeAt;
}
