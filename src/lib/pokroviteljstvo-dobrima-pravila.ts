/**
 * Pokroviteljstvo dobrima i uslugama — ČISTA pravila (bez Prisme).
 *
 * Osnov: Pravilnik o pokroviteljstvu i donacijama, Glava IV (čl. 27–36);
 * Pravilnik o projektima i kolektivnim nabavkama, Glava VII (čl. 29–34);
 * Pravilnik o KOLO sistemu čl. 17 st. 2 t. 7 i čl. 18. Odluke vlasnika O-1…O-15
 * (19.10.2026) i dopuna od 20.10.2026: odnos podnosioca prema davaocu, kontakt
 * davaoca, cena samo iz fotografije cenovnika (Fondacija cenu ne upoređuje), rok
 * važenja fiksno godinu dana, potpis jednokratnim kodom na mejl, vaučeri se
 * uzimaju slobodno (bez krugova, roka za prijavu i reda), davalac vidi pseudonim
 * imaoca, lista zabrane umesto zabrane od 12 meseci.
 *
 * Zaseban fajl jer ova pravila čita i obrazac u pretraživaču. Servisni sloj
 * (`protokol/pokroviteljstvo-dobrima.ts`) ih re-eksportuje, pa server ima jedan ulaz.
 *
 * ─── Brane koje se mogu izgubiti bez vidljivog kvara ─────────────────────────
 *
 * 🔴 O-6: koeficijent je onaj NIVO KOJI JE POKROVITELJ DOSTIGAO NOVČANIM
 * doprinosom. Vrednost dobara i usluga NIKAD ne ulazi u kumulativ, ne podiže nivo
 * i ne utiče na novčani deo rang-liste — inače bi roba bila jeftiniji put do istog
 * nivoa (razlog ukidanja ×1,20). `koeficijentIzNovca` zato prima SAMO novčani kumulativ.
 *
 * 🔴 O-8: broj POEN-a po vaučeru je deo upisa BEZ uvećanja po koeficijentu,
 * podeljen brojem vaučera. Obrazloženje je NEUTRALNOST OPTICAJA, ne cena. Uz broj
 * POEN-a se nigde ne prikazuje dinarska vrednost (R-01) — brana
 * `vaucer-izvor.test.ts`.
 *
 * 🔴 O-14: podnosilac prijave (i povezana lica, po izjavi) ne uzima vaučere
 * svog davaoca.
 *
 * 🔴 Fondacija cenu ne procenjuje, ne upoređuje i ne određuje (čl. 29 st. 2) —
 * pravila o „najnižoj ceni iz javnih izvora" više nema.
 */

import { nivoZaKumulativ } from "@/lib/donacija-pravila";
import { smeUcestvovati, type UcesnikProvera } from "@/lib/nabavka-pravila";

// ─── Konstante iz akta ────────────────────────────────────────────────────────

/** Čl. 29 st. 3 — najmanja vrednost ugovora (RSD). Važi za svaki ugovor. */
export const MIN_VREDNOST_UGOVORA_RSD = 10_000;

/** Čl. 29 st. 3 — najveća vrednost ugovora (RSD). Važi za svaki ugovor (odluka vlasnika). */
export const MAX_VREDNOST_UGOVORA_RSD = 50_000;

/** Čl. 29 st. 4 — naredni ugovor tek kad je iskorišćeno bar toliko vaučera prethodnog. */
export const UDEO_ISKORISCENIH_ZA_NAREDNI = 0.5;

/**
 * Čl. 29 st. 5 — vaučer važi jednu godinu od izdavanja. Rok se ne bira u
 * prijavi (odluka vlasnika 20.10.2026).
 */
export const ROK_VAZENJA_MESECI = 12;

/** Nabavke čl. 30 st. 2 — najviše dva uzeta, a neiskorišćena vaučera po korisniku. */
export const MAX_AKTIVNIH_VAUCERA_PO_CLANU = 2;

/** Brava na unos: najviše vaučera po ugovoru (protiv omaške u kucanju). */
export const MAX_VAUCERA_PO_UGOVORU = 500;

/**
 * Dokaz cene je SAMO fotografija cenovnika (čl. 28 st. 2 t. 4, čl. 29 st. 2) — jedna ili više.
 * Računi i javni izvori cene se više ne traže.
 */
export const DOKAZ_TIPOVI: readonly string[] = ["image/jpeg", "image/png", "image/webp"];
export const DOKAZ_MAX_BAJTOVA = 2 * 1024 * 1024;
/** Najviše fotografija cenovnika po prijavi. */
export const DOKAZ_MAX_FAJLOVA = 5;

/** Uslovi čl. 40 st. 4 t. 4 — prigovor na vaučer najkasnije toliko dana od isteka roka važenja. */
export const ROK_PRIGOVORA_POSLE_ISTEKA_DANA = 15;

/** Čl. 32 st. 1 — jednokratni kod za potpis: šest cifara, važi 15 minuta, najviše 5 pokušaja. */
export const POTPIS_KOD_CIFARA = 6;
export const POTPIS_KOD_TRAJANJE_MIN = 15;
export const POTPIS_KOD_MAX_POKUSAJA = 5;
/** Novi kod se ne šalje češće od jednom u minutu (zaštita sandučeta davaoca). */
export const POTPIS_KOD_RAZMAK_SEKUNDI = 60;

/**
 * APR — javna objedinjena pretraga registra privrednih subjekata. Pretraga ne
 * prima matični broj kroz adresu, pa admin ekran prikazuje MB za kopiranje
 * (čl. 18 st. 1: Fondacija proverava da podaci odgovaraju registru).
 */
export const APR_PRETRAGA_URL = "https://pretraga.apr.gov.rs/unifiedentitysearch";

// ─── Odnos podnosioca prema davaocu (čl. 16 st. 2 t. 4, čl. 17) ───────────────────────

export const ODNOSI_FIRME = ["ZASTUPNIK", "PREDUZETNIK", "VLASNIK", "JEDAN_OD_VLASNIKA", "STVARNI_VLASNIK", "OVLASCENO_LICE"] as const;
export const ODNOSI_GAZDINSTVA = ["NOSILAC_GAZDINSTVA"] as const;
export type OdnosPremaDavaocu = (typeof ODNOSI_FIRME)[number] | (typeof ODNOSI_GAZDINSTVA)[number];

/**
 * Kako se odnos upisuje u ugovor i u `zastupnikFunkcija` (snimljen tekst ugovora
 * je na srpskom, kao i ostatak ugovora).
 */
export const ODNOS_U_UGOVORU: Record<OdnosPremaDavaocu, string> = {
  ZASTUPNIK: "zakonski zastupnik",
  PREDUZETNIK: "preduzetnik",
  VLASNIK: "vlasnik",
  JEDAN_OD_VLASNIKA: "jedan od vlasnika",
  STVARNI_VLASNIK: "stvarni vlasnik",
  OVLASCENO_LICE: "lice ovlašćeno od nadležnog organa",
  NOSILAC_GAZDINSTVA: "nosilac registrovanog poljoprivrednog gazdinstva",
};

/**
 * Funkcija upisana uz ime nosioca gazdinstva (ugovor, evidencija). Nosilac gazdinstva
 * nije zastupnik pravnog lica — potpisuje u svoje ime.
 */
export const FUNKCIJA_NOSIOCA_GAZDINSTVA = ODNOS_U_UGOVORU.NOSILAC_GAZDINSTVA;

/**
 * Pravni oblik pokrovitelja (donacije čl. 16 st. 2 t. 1) — određuje samo koji odnos
 * podnosilac bira i koje izjave daje. 🔴 Ne utiče na obračun doprinosa: uvećan
 * koeficijent po pravnom obliku je ukinut (17.10.2026) i ne vraća se.
 */
export const PRAVNI_OBLICI = ["PRIVREDNO_DRUSTVO", "PREDUZETNIK", "UDRUZENJE", "ZADRUGA", "USTANOVA", "DRUGO_PRAVNO_LICE"] as const;
export type PravniOblik = (typeof PRAVNI_OBLICI)[number];

export function jePravniOblik(v: unknown): v is PravniOblik {
  return typeof v === "string" && (PRAVNI_OBLICI as readonly string[]).includes(v);
}

/** Odnosi po pravnom obliku: vlasnici samo kod društva, organ ovlašćuje kod ostalih. */
export const ODNOSI_PO_OBLIKU: Record<PravniOblik, readonly OdnosPremaDavaocu[]> = {
  PRIVREDNO_DRUSTVO: ["ZASTUPNIK", "VLASNIK", "JEDAN_OD_VLASNIKA", "STVARNI_VLASNIK"],
  PREDUZETNIK: ["PREDUZETNIK"],
  UDRUZENJE: ["ZASTUPNIK", "OVLASCENO_LICE"],
  ZADRUGA: ["ZASTUPNIK", "OVLASCENO_LICE"],
  USTANOVA: ["ZASTUPNIK", "OVLASCENO_LICE"],
  DRUGO_PRAVNO_LICE: ["ZASTUPNIK", "OVLASCENO_LICE"],
};

/**
 * Članski oblici (čl. 17 st. 1): kod udruženja i zadruge podnosioca, i kad je
 * zakonski zastupnik, ovlašćuje nadležni organ — time pokrovitelj sam bira u čiji
 * zapis ide doprinos, a Fondacija ništa ne raspoređuje.
 */
export function jeClanskiOblik(oblik: PravniOblik | null | undefined): boolean {
  return oblik === "UDRUZENJE" || oblik === "ZADRUGA";
}

/** Kod oblika bez vlasnika podnosilac obaveštava organe i članove, ne vlasnike. */
export function obavestavaOrgane(oblik: PravniOblik | null | undefined): boolean {
  return oblik === "UDRUZENJE" || oblik === "ZADRUGA" || oblik === "USTANOVA" || oblik === "DRUGO_PRAVNO_LICE";
}

/**
 * Koji su odnosi dozvoljeni: gazdinstvo — samo nosilac; pravno lice — po pravnom
 * obliku, kad je poznat (zatečeni upisi ga nemaju, pa važi ceo spisak firme).
 */
export function odnosDozvoljen(vrstaDavaoca: VrstaDavaoca, odnos: unknown, oblik?: PravniOblik | null): odnos is OdnosPremaDavaocu {
  const dozvoljeni: readonly string[] =
    vrstaDavaoca === "GAZDINSTVO" ? ODNOSI_GAZDINSTVA : oblik ? ODNOSI_PO_OBLIKU[oblik] : ODNOSI_FIRME;
  return typeof odnos === "string" && dozvoljeni.includes(odnos);
}

/**
 * Čl. 17 st. 1 — podnosilac koji nije zakonski zastupnik ni preduzetnik izjavljuje
 * da je ovlašćen da u ime davaoca zaključi ugovor. Nosilac gazdinstva potpisuje u
 * svoje ime, pa izjavu ne daje. Kod udruženja i zadruge izjavu o ovlašćenju organa
 * daje i zakonski zastupnik (donacije čl. 17 st. 1).
 */
export function trebaIzjavaOvlascenja(odnos: OdnosPremaDavaocu, oblik?: PravniOblik | null): boolean {
  if (jeClanskiOblik(oblik)) return true;
  return odnos !== "ZASTUPNIK" && odnos !== "PREDUZETNIK" && odnos !== "NOSILAC_GAZDINSTVA";
}

// ─── Vrednost i kvote (čl. 29) ───────────────────────────────────────────────

/** Čl. 29 st. 1 — vrednost = broj vaučera × cena po jedinici, na dve decimale. */
export function vrednostUgovora(brojVaucera: number, cenaPoJedinici: number): number {
  return Math.round(brojVaucera * cenaPoJedinici * 100) / 100;
}

/** Čl. 29 st. 3 — vrednost ugovora mora biti između 10.000 i 50.000 RSD. */
export function uGranicamaVrednosti(vrednostRsd: number): boolean {
  return (
    Number.isFinite(vrednostRsd) &&
    vrednostRsd >= MIN_VREDNOST_UGOVORA_RSD &&
    vrednostRsd <= MAX_VREDNOST_UGOVORA_RSD
  );
}

export type PrethodniUgovor = {
  brojVaucera: number;
  iskorisceno: number;
  vaziDo: Date | null;
};

export type IshodProvere = { ok: true } | { ok: false; razlog: string };

/**
 * Čl. 29 st. 4 i čl. 35 st. 5 — sme li davalac (po matičnom broju, odnosno broju
 * gazdinstva) da podnese novu prijavu.
 *
 * Davalac na listi zabrane ne podnosi prijavu dok ga Fondacija sa liste ne skine
 * (čl. 35 st. 5). Prijava u toku (na pregledu ili čeka potpis) zatvara novu.
 * Prethodni potpisani ugovor dozvoljava novu prijavu kada je iskorišćeno najmanje
 * polovina njegovih vaučera, ili kada je Fondacija odlukom dozvolila naredni ugovor.
 *
 * 🔴 Istek roka važenja više NE otvara naredni ugovor (set 4.8.4, N2-M6): inače bi
 * davalac svake godine zaključio ugovor po sopstvenom cenovniku, bez ijednog
 * iskorišćenog vaučera, a POEN podnosioca bi ostajao. Rok važenja i dalje ograničava
 * obavezu davaoca.
 */
export function smeNoviUgovor(u: {
  uToku: boolean;
  prethodni: (PrethodniUgovor & { naredniDozvoljen?: boolean }) | null;
  /** Da li je davalac na listi zabrane (aktivan red `ZabranaDavaoca`). */
  naListiZabrane: boolean;
  sada: Date;
}): IshodProvere {
  if (u.naListiZabrane)
    return {
      ok: false,
      razlog: "Davalac je na listi zabrane posle raskida ugovora i ne može zaključiti nov ugovor dok ga Fondacija sa liste ne skine.",
    };
  if (u.uToku)
    return { ok: false, razlog: "Za ovog davaoca već postoji prijava u toku." };
  const p = u.prethodni;
  if (!p) return { ok: true };
  if (p.naredniDozvoljen) return { ok: true };
  if (p.brojVaucera > 0 && p.iskorisceno / p.brojVaucera >= UDEO_ISKORISCENIH_ZA_NAREDNI) return { ok: true };
  return {
    ok: false,
    razlog: "Naredni ugovor je moguć kada je iskorišćeno najmanje polovina vaučera prethodnog ugovora, ili kada ga Fondacija odlukom dozvoli.",
  };
}

/**
 * Čl. 35 st. 2 — koji vaučeri raskinutog ugovora ulaze u raskid: svaki koji do
 * raskida nije iskorišćen, bez obzira na to da li je uzet. Vaučer o kome je
 * prigovor (označen kao iskorišćen iako dobro nije predato, nabavke čl. 34 st. 5)
 * ulazi i kada je označen kao iskorišćen. Već ranije otpisan (NEIZVRSEN) ne ulazi.
 */
export function ulaziURaskid(v: { id: string; status: string }, vaucerPrigovoraId: string): boolean {
  if (v.status === "NEIZVRSEN") return false;
  if (v.status === "ISKORISCEN") return v.id === vaucerPrigovoraId;
  return true;
}

/** Čl. 35 st. 2 — ukupan otpis pri raskidu: otpis po vaučeru × broj vaučera koji ulaze u raskid. */
export function otpisPriRaskidu(poenEvidentirano: number, brojVaucera: number, uRaskidu: number): number {
  return otpisPoVauceru(poenEvidentirano, brojVaucera) * Math.max(0, uRaskidu);
}

// ─── Koeficijent i broj POEN-a (čl. 33, nabavke čl. 31) ─────────────────────

/**
 * Čl. 33 st. 2 — koeficijent evidencije iz nivoa koji je pokrovitelj dostigao
 * KUMULATIVNIM NOVČANIM DOPRINOSOM. Bez novčanog doprinosa: 1,00.
 *
 * 🔴 Ulaz je isključivo novčani kumulativ (`Pokrovitelj.rsdKumulativ`). Vrednost
 * ugovora o dobrima se ovde ne dodaje — ni tekućeg ni ranijih (čl. 33 st. 3).
 */
export function koeficijentIzNovca(novcaniKumulativRsd: number | null): number {
  if (novcaniKumulativRsd == null || !Number.isFinite(novcaniKumulativRsd) || novcaniKumulativRsd <= 0) return 1.0;
  return nivoZaKumulativ(novcaniKumulativRsd).kurs;
}

/** Čl. 33 st. 2 — broj evidentiranih POEN-a = vrednost × koeficijent (ceo broj). */
export function poenZaUgovor(vrednostRsd: number, koeficijent: number): number {
  return Math.round(vrednostRsd * koeficijent);
}

/**
 * Nabavke čl. 31 st. 1 (O-8) — broj POEN-a po vaučeru: upis BEZ uvećanja po
 * koeficijentu (koeficijent 1,00), podeljen brojem vaučera.
 */
export const KOEFICIJENT_RASPODELE = 1.0;
export function poenaPoVauceru(vrednostRsd: number, brojVaucera: number): number {
  if (!Number.isInteger(brojVaucera) || brojVaucera <= 0) return 0;
  return Math.round((vrednostRsd * KOEFICIJENT_RASPODELE) / brojVaucera);
}

/**
 * Donacije čl. 35 st. 2 — otpis po vaučeru: broj POEN-a evidentiran po ugovoru
 * (snimak), podeljen brojem vaučera.
 */
export function otpisPoVauceru(poenEvidentirano: number, brojVaucera: number): number {
  if (!Number.isInteger(brojVaucera) || brojVaucera <= 0) return 0;
  return Math.round(poenEvidentirano / brojVaucera);
}

// ─── Rok važenja ──────────────────────────────────────────────────────────────

/** Rok važenja vaučera: `meseci` od izdavanja (potpisa ugovora). */
export function vaziDoOd(izdato: Date, meseci: number = ROK_VAZENJA_MESECI): Date {
  const d = new Date(izdato);
  d.setMonth(d.getMonth() + meseci);
  return d;
}

// ─── Uzimanje vaučera (nabavke čl. 30, 32, 33) ────────────────────────────

/**
 * Nabavke čl. 30 i 33 — sme li korisnik da uzme vaučer:
 *  - korisnik iz čl. 4 nabavki (punoletan, aktivan, indeks ≥ 10%);
 *  - nije podnosilac prijave tog davaoca (donacije čl. 36; povezanost se ne može
 *    proveriti iz evidencije, pa se uz to traži izričita izjava);
 *  - dao je izjavu o nepovezanosti I pristanak na prikaz zapisa o poništenju uz
 *    pseudonim (čl. 33 st. 1) — bez njih se vaučer ne može uzeti;
 *  - nema već dva uzeta, a neiskorišćena vaučera (čl. 30 st. 2);
 *  - ima dovoljno raspoloživih POEN-a (čl. 33 st. 4) — zapis ne ide u minus.
 *
 * Servis istu proveru ponavlja UNUTAR transakcije, nad zaključanim zapisom.
 */
export function smeUzetiVaucer(u: UcesnikProvera & {
  userId: string;
  podnosilacId: string;
  izjavaNepovezan: boolean;
  pristanakPrikaz: boolean;
  aktivnihVaucera: number;
  raspolozivo: number;
  poenaPoVauceru: number;
}): IshodProvere {
  if (u.userId === u.podnosilacId)
    return { ok: false, razlog: "Podnosilac prijave ne uzima vaučere svog davaoca." };
  if (!smeUcestvovati(u))
    return {
      ok: false,
      razlog: "Vaučer uzimaju punoletni korisnici sa aktivnim nalogom i potvrđenom stvarnošću.",
    };
  if (!u.izjavaNepovezan)
    return { ok: false, razlog: "Potrebna je izjava da nisi povezano lice sa davaocem." };
  if (!u.pristanakPrikaz)
    return { ok: false, razlog: "Bez pristanka na prikaz zapisa uz pseudonim vaučer se ne može uzeti." };
  if (u.aktivnihVaucera >= MAX_AKTIVNIH_VAUCERA_PO_CLANU)
    return { ok: false, razlog: "Istovremeno možeš imati najviše dva neiskorišćena vaučera." };
  if (!(u.poenaPoVauceru > 0) || u.raspolozivo < u.poenaPoVauceru)
    return { ok: false, razlog: "Nemaš dovoljno POEN-a za ovaj vaučer." };
  return { ok: true };
}

// ─── Stanje vaučera za davaoca ────────────────────────────────────────────────

/**
 * Stanje vaučera koje davalac vidi kad unese ili skenira kod. Uz stanje davalac
 * vidi opis, rok važenja i PSEUDONIM imaoca (nabavke čl. 34 st. 1) — i ništa
 * drugo o imaocu.
 *
 * POEN je poništen već pri uzimanju (nabavke čl. 33 st. 4), pa stanja „ne može se
 * realizovati" nema: uzet vaučer u roku važi. `NE_VAZI` = vaučer niko nije uzeo
 * ili je prestao zbog raskida ugovora.
 */
export type StanjeZaDavaoca = "VAZI" | "ISKORISCEN" | "ISTEKAO" | "NE_VAZI" | "NEPOZNAT";

export function stanjeZaDavaoca(v: {
  status: string;
  vaziDo: Date | null;
  sada: Date;
} | null): StanjeZaDavaoca {
  if (!v) return "NEPOZNAT";
  if (v.status === "ISKORISCEN") return "ISKORISCEN";
  if (v.status === "ISTEKAO") return "ISTEKAO";
  if (v.status !== "DODELJEN") return "NE_VAZI";
  if (v.vaziDo && v.vaziDo.getTime() <= v.sada.getTime()) return "ISTEKAO";
  return "VAZI";
}

/** Kod vaučera: velika slova i cifre, bez razmaka i crtica — za poređenje unosa. */
export function normalizujKod(kod: unknown): string {
  return typeof kod === "string" ? kod.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

// ─── Zaposleni davaoca (donacije čl. 32 st. 3, nabavke čl. 34 st. 1) ───────

/**
 * Ko sme da potvrdi vaučer: podnosilac prijave ugovora ILI njegov aktivan
 * zaposleni — i niko drugi. Ovlašćenje je vezano za podnosioca (sve njegove
 * ugovore), ne za pojedinačan ugovor.
 *
 * 🔴 Zaposleni ne stiče nijedno drugo ovlašćenje u vezi sa ugovorom: ne vidi
 * ugovor, POEN ni dokaz cene i ne određuje druge zaposlene. Ova provera je JEDINO
 * mesto gde se zaposlenom nešto otvara.
 */
export type OvlascenjeZaVaucer = "PODNOSILAC" | "ZAPOSLENI" | null;

export function ovlascenjeZaVaucer(p: {
  korisnikId: string;
  podnosilacId: string;
  /** Da li korisnik ima aktivno (neopozvano) ovlašćenje kod tog podnosioca i nalog koji ispunjava uslove. */
  aktivanZaposleni: boolean;
}): OvlascenjeZaVaucer {
  if (!p.korisnikId || !p.podnosilacId) return null;
  if (p.korisnikId === p.podnosilacId) return "PODNOSILAC";
  return p.aktivanZaposleni ? "ZAPOSLENI" : null;
}

/** Nalog koji se određuje za zaposlenog davaoca. */
export interface NalogZaposlenog {
  id: string;
  maloletan: boolean;
  status: string;
  deaktiviranAt: Date | null;
  /** Verifikovan korisnik (donacije čl. 32 st. 3). */
  verified: boolean;
}

/**
 * Zaposleni može biti samo VERIFIKOVAN, PUNOLETAN korisnik sa AKTIVNIM nalogom,
 * različit od podnosioca (donacije čl. 32 st. 3). Isti uslov važi i pri
 * određivanju i pri svakoj proveri i potvrdi — nalog koji je u međuvremenu
 * suspendovan, ugašen ili izgubio potvrdu ne potvrđuje.
 */
export function smeBitiZaposleni(n: NalogZaposlenog, davalacUserId: string): IshodProvere {
  if (n.id === davalacUserId) return { ok: false, razlog: "Ne možeš odrediti sebe." };
  if (n.maloletan) return { ok: false, razlog: "Vaučere u ime davaoca potvrđuje samo punoletan korisnik." };
  if (n.deaktiviranAt || n.status !== "ACTIVE")
    return { ok: false, razlog: "Vaučere u ime davaoca potvrđuje samo korisnik sa aktivnim nalogom." };
  if (!n.verified)
    return { ok: false, razlog: "Vaučere u ime davaoca potvrđuje samo verifikovan korisnik." };
  return { ok: true };
}

// ─── Jednokratni kod za potpis (čl. 32 st. 1) ───────────────────────────────

export type StanjeKoda = { hash: string | null; istice: Date | null; pokusaja: number };

/**
 * Da li se uneti kod uopšte sme proveravati: kod je poslat, nije istekao i nije
 * potrošen broj pokušaja. Heš se poredi u servisu (crypto nije za pretraživač).
 */
export function kodSmeDaSeProveri(k: StanjeKoda, sada: Date): IshodProvere {
  if (!k.hash || !k.istice) return { ok: false, razlog: "Prvo zatraži kod za potpis." };
  if (k.pokusaja >= POTPIS_KOD_MAX_POKUSAJA)
    return { ok: false, razlog: "Previše pogrešnih pokušaja. Zatraži novi kod." };
  if (k.istice.getTime() <= sada.getTime()) return { ok: false, razlog: "Kod je istekao. Zatraži novi kod." };
  return { ok: true };
}

/** Unos koda: tačno šest cifara (razmaci se zanemaruju). */
export function ocistiKodPotpisa(unos: unknown): string | null {
  const s = typeof unos === "string" ? unos.replace(/\s/g, "") : "";
  return new RegExp(`^\\d{${POTPIS_KOD_CIFARA}}$`).test(s) ? s : null;
}

/**
 * Tri potvrde pre potpisa (čl. 32 st. 1): ugovor je pročitan, podnosilac je
 * ovlašćen da ga zaključi i saglasan je da se ugovor zaključuje potvrdom na platformi.
 */
export function potvrdePotpisaOk(p: { procitao: unknown; ovlascen: unknown; saglasan: unknown }): boolean {
  return p.procitao === true && p.ovlascen === true && p.saglasan === true;
}

// ─── Prijava (čl. 28) ────────────────────────────────────────────────────────

export type VrstaDavaoca = "FIRMA" | "GAZDINSTVO";

/**
 * Prijava iz odobrenog upisa (čl. 28 st. 2 i 3): samo dobro, odnosno usluga — opis,
 * broj vaučera, cena, mesto i adresa predaje i izjava o propisima. Podaci o davaocu,
 * odnos, kontakt, izjava o ovlašćenju i potvrda o evidentiranju su u UPISU (čl. 16)
 * i u ugovor ulaze kao njegov snimak.
 */
export type PredmetPrijaveDobra = {
  vrsta: "DOBRO" | "USLUGA";
  opis: string;
  brojVaucera: number;
  cenaPoJedinici: number;
  vrednostRsd: number;
  rokVazenjaMeseci: number;
  adresaPredaje: string;
};

const MIN_OPIS = 10;
const MAX_OPIS = 500;
const MIN_ADRESA = 3;
const MAX_ADRESA = 200;
const MAX_EMAIL = 200;

/** BPG — broj poljoprivrednog gazdinstva: dvanaest cifara. */
export function ocistiBpgDavaoca(unos: unknown): string | null {
  const s = typeof unos === "string" ? unos.replace(/\s/g, "") : "";
  return /^\d{12}$/.test(s) ? s : null;
}

/** Adresa elektronske pošte za kontakt sa davaocem. */
export function ocistiKontaktEmail(unos: unknown): string | null {
  const s = typeof unos === "string" ? unos.trim().toLowerCase() : "";
  if (!s || s.length > MAX_EMAIL) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? s : null;
}

/** Broj telefona za kontakt: cifre, razmaci, „+", „/", „-" i zagrade; 6–15 cifara. */
export function ocistiKontaktTelefon(unos: unknown): string | null {
  const s = typeof unos === "string" ? unos.trim().replace(/\s+/g, " ") : "";
  if (!/^\+?[\d\s/()-]+$/.test(s)) return null;
  const cifara = s.replace(/\D/g, "").length;
  return cifara >= 6 && cifara <= 15 ? s : null;
}

const daJe = (v: unknown) => v === true || v === "true";

/**
 * Provera prijave (čl. 28 st. 2 i 3, čl. 29). Mesto (naselje) i fotografije
 * cenovnika proverava ruta — prvo kroz `razresiNaselje`, drugo kroz `proveriDokaze`.
 * Upis (čl. 16) i njegovu spremnost proverava servis (`upisSpremanZaPrijavu`).
 */
export function procitajPredmetDobra(
  b: Record<string, unknown>,
): { ok: true; podaci: PredmetPrijaveDobra } | { ok: false; razlog: string } {
  const tekst = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");
  const vrsta = b.vrsta === "DOBRO" || b.vrsta === "USLUGA" ? b.vrsta : null;
  if (!vrsta) return { ok: false, razlog: "Izaberi da li se daje dobro ili usluga." };

  const opis = tekst(b.opis);
  if (opis.length < MIN_OPIS || opis.length > MAX_OPIS)
    return { ok: false, razlog: "Opiši tačno dobro, odnosno uslugu (od 10 do 500 znakova)." };

  const brojVaucera = Number(b.brojVaucera);
  if (!Number.isInteger(brojVaucera) || brojVaucera < 1 || brojVaucera > MAX_VAUCERA_PO_UGOVORU)
    return { ok: false, razlog: "Broj vaučera mora biti ceo broj između 1 i 500." };

  const cenaPoJedinici = Number(b.cenaPoJedinici);
  if (!Number.isFinite(cenaPoJedinici) || cenaPoJedinici <= 0 || Math.round(cenaPoJedinici * 100) !== cenaPoJedinici * 100)
    return { ok: false, razlog: "Cena po jedinici mora biti pozitivan iznos, najviše na dve decimale." };

  const vrednostRsd = vrednostUgovora(brojVaucera, cenaPoJedinici);
  if (!uGranicamaVrednosti(vrednostRsd))
    return { ok: false, razlog: "Vrednost ugovora (broj vaučera × cena) mora biti između 10.000 i 50.000 dinara." };

  // Čl. 28 st. 2 t. 5 — mesto i adresa predaje, odnosno pružanja (mesto proverava ruta).
  const adresa = tekst(b.adresaPredaje);
  if (adresa.length < MIN_ADRESA || adresa.length > MAX_ADRESA)
    return { ok: false, razlog: "Upiši adresu predaje, odnosno pružanja." };

  // Čl. 28 st. 3 — izjava o propisima.
  if (!daJe(b.izjavaPropisi))
    return { ok: false, razlog: "Potrebna je izjava da davalac ispunjava propise za promet tog dobra, odnosno pružanje te usluge." };

  return {
    ok: true,
    podaci: { vrsta, opis, brojVaucera, cenaPoJedinici, vrednostRsd, rokVazenjaMeseci: ROK_VAZENJA_MESECI, adresaPredaje: adresa },
  };
}

export type VrstaDokaza = "CENOVNIK";

/**
 * Provera priloženog dokaza (čl. 28 st. 2 t. 4): SAMO fotografija cenovnika iz koje se
 * vidi cena — najmanje jedna, za firmu i za gazdinstvo isto. Računi, javni izvori
 * cene i potvrda o upisu gazdinstva se ne traže.
 */
export function proveriDokaze(fajlovi: { vrsta: VrstaDokaza; tip: string; velicina: number }[]): IshodProvere {
  if (fajlovi.length > DOKAZ_MAX_FAJLOVA) return { ok: false, razlog: `Najviše ${DOKAZ_MAX_FAJLOVA} fotografija cenovnika.` };
  for (const f of fajlovi) {
    if (!DOKAZ_TIPOVI.includes(f.tip)) return { ok: false, razlog: "Fotografija cenovnika: JPG, PNG ili WebP." };
    if (f.velicina <= 0 || f.velicina > DOKAZ_MAX_BAJTOVA) return { ok: false, razlog: "Jedna fotografija može biti najviše 2 MB." };
  }
  if (!fajlovi.some((f) => f.vrsta === "CENOVNIK"))
    return { ok: false, razlog: "Priloži fotografiju cenovnika iz koje se vidi cena." };
  return { ok: true };
}

/**
 * Po čemu se davalac prepoznaje za kvotu (čl. 29 st. 4) i listu zabrane (čl. 35
 * st. 5): pravno lice i preduzetnik po matičnom broju, gazdinstvo po BPG.
 */
export function kljucDavaoca(p: { vrstaDavaoca: VrstaDavaoca; maticniBroj: string | null; bpg: string | null }):
  { maticniBroj: string } | { bpg: string } {
  return p.vrstaDavaoca === "GAZDINSTVO" ? { bpg: p.bpg ?? "" } : { maticniBroj: p.maticniBroj ?? "" };
}

// ─── Ugovor (čl. 31) ─────────────────────────────────────────────────────────

/**
 * Tekst ugovora o donaciji dobara odnosno usluga (čl. 31 st. 2, čl. 32 st. 1).
 *
 * 🔴 Ugovor NE sadrži odredbe o POEN-u niti o evidentiranju POEN-a (čl. 31 st. 3,
 * O-3). Generiše se jednom, pri prihvatanju prijave, i SNIMA — ne generiše se
 * ponovo pri čitanju.
 */
export function generisiUgovorDobraTekst(p: {
  vrstaDavaoca?: VrstaDavaoca;
  naziv: string;
  pib: string | null;
  maticniBroj: string | null;
  adresaSedista: string | null;
  bpg?: string | null;
  zastupnikImePrezime: string;
  zastupnikFunkcija: string;
  odnosPremaDavaocu: OdnosPremaDavaocu;
  kontaktEmail: string;
  kontaktTelefon: string;
  vrsta: "DOBRO" | "USLUGA";
  opis: string;
  brojVaucera: number;
  cenaPoJedinici: number;
  vrednostRsd: number;
  mesto: string;
  adresaPredaje: string | null;
  datum: Date;
}): string {
  const rsd = (n: number) => n.toLocaleString("sr-RS", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const gazdinstvo = p.vrstaDavaoca === "GAZDINSTVO";
  const predmet = p.vrsta === "DOBRO" ? "dobro" : "uslugu";
  const predaja = p.vrsta === "DOBRO" ? "preda dobro" : "pruži uslugu";
  const mestoTekst = p.adresaPredaje ? `${p.mesto}, ${p.adresaPredaje}` : p.mesto;
  const odnos = ODNOS_U_UGOVORU[p.odnosPremaDavaocu];
  const podnosilac = p.odnosPremaDavaocu === "ZASTUPNIK"
    ? `${p.zastupnikImePrezime}, ${odnos} (${p.zastupnikFunkcija})`
    : `${p.zastupnikImePrezime}, ${odnos}`;
  return [
    "UGOVOR O DONACIJI DOBARA ODNOSNO USLUGA",
    "(ugovor u korist trećih lica)",
    "",
    `Zaključen dana ${p.datum.toLocaleDateString("sr-RS")} između:`,
    gazdinstvo
      ? `1) ${p.zastupnikImePrezime}, nosilac registrovanog poljoprivrednog gazdinstva „${p.naziv}", ` +
        `broj gazdinstva ${p.bpg ?? ""} (u daljem tekstu: Davalac), i`
      : `1) ${p.naziv}, sa sedištem na adresi ${p.adresaSedista ?? ""}, matični broj ${p.maticniBroj ?? ""}, PIB ${p.pib ?? ""}, ` +
        `koga zastupa ${podnosilac} (u daljem tekstu: Davalac), i`,
    "2) KOLO Fondacije (u daljem tekstu: Fondacija).",
    "",
    `Kontakt Davaoca: adresa elektronske pošte ${p.kontaktEmail}, telefon ${p.kontaktTelefon}.`,
    gazdinstvo
      ? `Ugovor u ime Davaoca zaključuje ${p.zastupnikImePrezime}, nosilac gazdinstva.`
      : `Ugovor u ime Davaoca zaključuje ${p.zastupnikImePrezime}; odnos prema Davaocu: ${odnos}.`,
    "",
    `Član 1. Davalac se obavezuje da bez naknade ${predaja} licima koja uzmu vaučer u raspodeli Fondacije, i to: ${p.opis}.`,
    `Član 2. Davalac izdaje ${p.brojVaucera} vaučera; svaki vaučer glasi na jedno tačno određeno ${predmet} iz člana 1, a ne na novčani iznos. ` +
      `Vrednost donacije iznosi ${rsd(p.vrednostRsd)} dinara (${p.brojVaucera} × ${rsd(p.cenaPoJedinici)} dinara, prema ceni koju Davalac primenjuje u prometu).`,
    `Član 3. Vaučeri važe jednu godinu od izdavanja. Mesto i adresa predaje, odnosno pružanja: ${mestoTekst}.`,
    "Član 4. Donacija je dobrovoljna i bez naknade. Davalac njome ne stiče potraživanje prema Fondaciji niti bilo koju prednost u postupcima Fondacije.",
    `Član 5. Davalac se obavezuje da do isteka roka važenja vaučera drži dobra raspoloživa, odnosno obezbedi termine, i da ${predmet} da u istom kvalitetu kao drugim licima.`,
    "Član 6. Lice kome je vaučer izdat stiče sopstveno pravo da od Davaoca zahteva predaju dobra, odnosno pružanje usluge. Fondacija ne stiče svojinu ni državinu dobara, ne pruža usluge i ne odgovara za ispunjenje obaveze Davaoca. Za kvalitet, nedostatke i bezbednost Davalac odgovara imaocu vaučera neposredno.",
    "Član 7. Davalac se obavezuje da pri predaji dobra, odnosno pružanju usluge izda račun propisan za taj promet, kada je propisan.",
    "Član 8. Poreske obaveze koje proizlaze iz ove donacije snosi Davalac u skladu sa propisima. Fondacija ne pruža poreski savet.",
    "Član 9. Ugovor se zaključuje elektronskim putem na platformi KOLO, potvrdom podnosioca na platformi i unosom jednokratnog koda dostavljenog na njegovu adresu elektronske pošte. Tako zaključen ugovor punovažan je bez pečata i svojeručnog potpisa. Platforma beleži vreme zaključenja i kontrolni broj teksta i dostavlja Davaocu primerak ugovora za štampu.",
    "",
    gazdinstvo
      ? `Potvrdom na platformi ${p.zastupnikImePrezime} potvrđuje da je nosilac navedenog gazdinstva i da prihvata uslove ugovora.`
      : `Potvrdom na platformi ${p.zastupnikImePrezime} potvrđuje da je ovlašćen da u ime Davaoca zaključi ovaj ugovor i da prihvata uslove ugovora.`,
  ].join("\n");
}

// ─── Rang-lista pokrovitelja, deo „Dobra i usluge" (čl. 25 st. 1) ────────────

export type StavkaRangListeDobara = { naziv: string; logoUrl: string | null; vrednostRsd: number };

/**
 * Drugi deo rang-liste pokrovitelja (čl. 25 st. 1): zbir vrednosti potpisanih
 * ugovora o pokroviteljstvu dobrima i uslugama po davaocu (pravno lice i
 * preduzetnik po matičnom broju, gazdinstvo po broju gazdinstva), od većeg ka
 * manjem. Naziv je onaj iz najnovijeg ugovora; gazdinstvo se prikazuje nazivom
 * gazdinstva.
 *
 * Uz naziv ide logotip iz najnovijeg potpisanog ugovora koji ga ima (čl. 26 st. 2).
 *
 * 🔴 Izlaz nosi SAMO naziv, logotip i iznos u dinarima — nikad broj POEN-a, matični
 * broj, PIB, BPG, adresu ni podnosioca (čl. 25 st. 2), ni vezu ka internet
 * stranici (čl. 26 st. 3).
 */
export function rangListaDobara(
  ugovori: { vrstaDavaoca: VrstaDavaoca; maticniBroj: string | null; bpg: string | null; naziv: string; logoUrl?: string | null; vrednostRsd: number; potpisanoAt: Date | null }[],
): StavkaRangListeDobara[] {
  const zbir = new Map<string, { naziv: string; logoUrl: string | null; vrednostRsd: number; poslednji: number; poslednjiLogo: number }>();
  for (const u of ugovori) {
    if (!u.potpisanoAt) continue;
    const k = u.vrstaDavaoca === "GAZDINSTVO" ? `G:${u.bpg ?? u.naziv}` : `F:${u.maticniBroj ?? u.naziv}`;
    const t = u.potpisanoAt.getTime();
    const logo = u.logoUrl ?? null;
    const s = zbir.get(k);
    if (!s) zbir.set(k, { naziv: u.naziv, logoUrl: logo, vrednostRsd: u.vrednostRsd, poslednji: t, poslednjiLogo: logo ? t : -Infinity });
    else {
      s.vrednostRsd = Math.round((s.vrednostRsd + u.vrednostRsd) * 100) / 100;
      if (t > s.poslednji) { s.naziv = u.naziv; s.poslednji = t; }
      if (logo && t > s.poslednjiLogo) { s.logoUrl = logo; s.poslednjiLogo = t; }
    }
  }
  return [...zbir.values()]
    .sort((a, b) => b.vrednostRsd - a.vrednostRsd || a.naziv.localeCompare(b.naziv, "sr"))
    .map(({ naziv, logoUrl, vrednostRsd }) => ({ naziv, logoUrl, vrednostRsd }));
}

// ─── Potvrda o predaji bez naknade (odluka vlasnika 20.10.2026) ──────────────
//
// Davalac realizaciju ne kuca na kasi: vaučer iz Glave IV nije vaučer u smislu
// Zakona o PDV (imalac ništa ne plaća), predaja je promet bez naknade, pa se ne
// izdaje ni fiskalni račun ni e-faktura. Realizaciju u svojim knjigama zatvara
// potvrdom o predaji sa platforme. 🔴 Potvrda ne pominje POEN ni „fiskalni",
// „kasa", „plaćeno", „način plaćanja" — brana `potvrda-predaje-izvor.test.ts`.

/** Mesec potvrde iz parametra `YYYY-MM` (vraća isti ključ); neispravan unos → null. */
export function procitajMesec(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const mesec = Number(m[2]);
  return mesec >= 1 && mesec <= 12 ? `${m[1]}-${m[2]}` : null;
}

/**
 * Ključ meseca `YYYY-MM` za datum, po beogradskom vremenu — isti na serveru (UTC)
 * i u pretraživaču, pa vaučer iskorišćen u ponoć poslednjeg dana ne prelazi u
 * drugi mesec zavisno od toga ko računa.
 */
export function kljucMeseca(d: Date): string {
  const delovi = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit" }).formatToParts(d);
  const g = delovi.find((x) => x.type === "year")?.value ?? "";
  const m = delovi.find((x) => x.type === "month")?.value ?? "";
  return `${g}-${m}`;
}

/** Zbir vrednosti iskorišćenih vaučera po cenovniku iz ugovora (dinari, dve decimale). */
export function zbirPotvrde(brojVaucera: number, cenaPoJedinici: number): number {
  return Math.round(brojVaucera * cenaPoJedinici * 100) / 100;
}
