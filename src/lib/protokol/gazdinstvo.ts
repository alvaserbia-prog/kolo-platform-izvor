import { prisma } from "@/lib/prisma";
import {
  ClanGazdinstvaStatus,
  DoprinosStatus,
  GazdinstvoStatus,
  Prisma,
  TransactionType,
  UlogaUGazdinstvu,
  UpitIzjaveStatus,
} from "@/generated/prisma/client";
import { emitujPoen } from "./emisija";
import { PROTOKOL_WALLET_ID } from "./zrno";
import { iskljuciKorisnika } from "./iskljucenje";
import { ucitajStatus, jePotvrdjen, jeVerifikovan, type StatusUcesnika } from "./status";
import { razresiNaselje, PORUKA_MESTO_IZ_SPISKA } from "@/lib/naselje";
import { obavesti } from "@/lib/notifikacije";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { logAdminAkcija } from "@/lib/audit";
import { gdePseudonim } from "@/lib/pseudonim";
import { oglasIspunjavaMinimum } from "@/lib/doprinos-pravila";
import { ispravanTelefon } from "@/lib/nov-clan-pravila";
import { upisiIdentitet, procitajImePrezime, ishodUpisa, PORUKA_DRUGO_IME } from "./identitet";
import { smeObrisatiUpis } from "@/lib/upis-pokrovitelja-pravila";
import {
  MAX_CLANOVA_SA_DOPRINOSOM,
  MAX_OPIS,
  MIN_OGLASA_UZ_PRIJAVU,
  MIN_OPIS,
  ROK_UPITA_DANA,
  clanoviZaOtpis,
  iznosZaRedniBroj,
  ocistiBpg,
  pristupanjeSmeOdobriti,
  proveriIzvod,
  proveriPrijavu,
  smeBitiClan,
  smeImatiClanove,
  smePozvati,
  smePrijaviti,
  smeSeEvidentirati,
  smeUpravljati,
  tekstIzjave,
  tipIzvoda,
  trebaIzvod,
  type OsnovPrestanka,
  type Provera,
} from "@/lib/gazdinstvo-pravila";

export * from "@/lib/gazdinstvo-pravila";

/**
 * Servis gazdinstava — Pravilnik o KOLO sistemu čl. 40c i Pravilnik o
 * gazdinstvima (set 4.8.2).
 *
 * 🔴 Gazdinstvo nema zapis u Protokolu. Doprinos se BELEŽI pri odobrenju
 * gazdinstva (odnosno kasnijeg pristupanja), a EVIDENTIRA se tek kad član ima
 * objavljen oglas kojim nešto nudi i kad je VERIFIKOVAN u lancu potvrda — za sve
 * članove isto (čl. 40c st. 4). Zabeležen doprinos ne ulazi ni u jedno stanje ni u
 * opticaj.
 *
 * 🔴 Prestanak gazdinstva (gazd. čl. 12a): po SVAKOM osnovu (bez članova,
 * brisanje, lažna izjava) zabeležen doprinos se poništava, a evidentiran otpisuje
 * članovima u trenutku prestanka — kod lažne izjave i ranije istupelima — i SME u
 * minus (šesti osnov, Pravilnik čl. 14 st. 3 t. 6). Otpis ide sopstvenim tipom
 * `OTPIS_GAZDINSTVO` — nikad `TRANSFER` ni `EMISIJA_*`. Jedini put je
 * `prestanakGazdinstva`.
 *
 * 🔴 Ponovno sticanje (Pravilnik čl. 40c st. 3; gazd. čl. 7 st. 3, 12a st. 6):
 * živ doprinos je najviše jedan po licu — drži ga `aktivanKljuc @unique`. Pri
 * poništenju i otpisu `aktivanKljuc` ide na null; istupanje ga ne dira.
 *
 * 🔴 Prava po statusu (čl. 4a, 7, 7a, 9, 9a) se izvode, ne čuvaju; jedino
 * `smeClanoveOd` je monoton zapis (gazdinstvo radi dalje i kad podnosiocu padne
 * potvrđenost). `upravljaId` od seta 4.8.2 znači „lice koje odgovara za izjavu o
 * tačnosti" (čl. 9 st. 2) — ime kolone ostaje (CLAUDE.md pravilo 12).
 *
 * 🔴 Izvod iz Registra (čl. 4b) prilaže samo korisnik ili član bez potvrde kao
 * nosilac upisanog gazdinstva; čuva se u bazi, čita ga samo admin, BRIŠE SE pri
 * svakoj odluci o prijavi. Izvod i odobrenje NE potvrđuju stvarnost (čl. 4a
 * poslednji stav, 4b st. 5) — nosilac-korisnik dolazi samo na spisak za poziv.
 *
 * 🔴 Razgovor (čl. 6a) Fondacija vodi samo sa nosiocem; broj
 * (`Gazdinstvo.telefonZaRazgovor`) vidi samo admin i briše se odlukom.
 *
 * Okidači evidentiranja (`probajEvidentiratiGazdinstvo`) se zovu VAN
 * `prisma.$transaction()` i ne bacaju.
 *
 * 🔴 Evidencija identiteta (set 4.7.3, čl. 4 t. 8 i čl. 7 st. 2): svaki član upisuje
 * SOPSTVENO ime i prezime — podnosilac pri prijavi, pozvani pri prihvatanju poziva.
 * Ime ide u `IdentitetNaloga`, nikad na gazdinstvo, oglas ni zapis POEN-a.
 */

export class GazdinstvoGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

function proveri(p: Provera) {
  if (!p.ok) throw new GazdinstvoGreska(p.razlog, p.status);
}

/** Članstva koja se računaju kao „član gazdinstva" (pristupio uz izjavu). */
const AKTIVNO_CLANSTVO: ClanGazdinstvaStatus[] = [ClanGazdinstvaStatus.PRISTUPIO, ClanGazdinstvaStatus.ODOBREN];
/** Gazdinstva u kojima se još može biti član. */
const ZIVO_GAZDINSTVO: GazdinstvoStatus[] = [
  GazdinstvoStatus.NACRT,
  GazdinstvoStatus.NA_PREGLEDU,
  GazdinstvoStatus.VRACENO,
  GazdinstvoStatus.ODOBRENO,
];
const U_PRIPREMI: GazdinstvoStatus[] = [GazdinstvoStatus.NACRT, GazdinstvoStatus.VRACENO];

const DAN_MS = 24 * 60 * 60 * 1000;

async function statusNaloga(userId: string): Promise<StatusUcesnika> {
  const s = await ucitajStatus(userId);
  if (!s) throw new GazdinstvoGreska("Korisnik ne postoji.", 404);
  return s;
}

async function ucitajKandidata(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, pseudonim: true, maloletan: true, status: true, deaktiviranAt: true },
  });
  if (!u) throw new GazdinstvoGreska("Korisnik ne postoji.", 404);
  proveri(smeBitiClan({ maloletan: u.maloletan, status: u.status, deaktiviran: u.deaktiviranAt !== null }));
  return u;
}

/** Aktivno članstvo korisnika u živom gazdinstvu — najviše jedno (čl. 7 st. 3). */
export async function aktivnoClanstvo(userId: string) {
  return prisma.clanGazdinstva.findFirst({
    where: {
      userId,
      status: { in: AKTIVNO_CLANSTVO },
      gazdinstvo: { status: { in: ZIVO_GAZDINSTVO } },
    },
    select: {
      id: true,
      status: true,
      uloga: true,
      gazdinstvo: { select: { id: true, naziv: true, status: true, upravljaId: true } },
    },
  });
}

/**
 * Podnosilac — prvi član po redu pristupanja (čl. 2, čl. 8 st. 3). Računa se i
 * kad je u međuvremenu istupio, da red ostane isti.
 */
async function podnosilacGazdinstva(gazdinstvoId: string, db: Prisma.TransactionClient | typeof prisma = prisma) {
  const c = await db.clanGazdinstva.findFirst({
    where: {
      gazdinstvoId,
      pristupioAt: { not: null },
      status: { in: [...AKTIVNO_CLANSTVO, ClanGazdinstvaStatus.ISTUPIO] },
    },
    orderBy: { pristupioAt: "asc" },
    select: { userId: true },
  });
  return c?.userId ?? null;
}

/**
 * Prava člana u gazdinstvu, izvedena iz statusa (čl. 7, 9, 9a). Vraća null kad
 * korisnik nije aktivan član ovog gazdinstva.
 */
export async function pravaUGazdinstvu(userId: string, gazdinstvoId: string) {
  const [clan, g] = await Promise.all([
    prisma.clanGazdinstva.findFirst({
      where: { gazdinstvoId, userId, status: { in: AKTIVNO_CLANSTVO } },
      select: { id: true, status: true, uloga: true },
    }),
    prisma.gazdinstvo.findUnique({ where: { id: gazdinstvoId }, select: { smeClanoveOd: true, upravljaId: true } }),
  ]);
  if (!clan || !g) return null;
  const [status, podnosilac] = await Promise.all([statusNaloga(userId), podnosilacGazdinstva(gazdinstvoId)]);
  const smeClanove = smeImatiClanove(g);
  return {
    clanId: clan.id,
    status,
    smeClanove,
    jePodnosilac: podnosilac === userId,
    odgovaraZaIzjavu: g.upravljaId === userId,
    upravlja: smeUpravljati({ clanStatus: clan.status, jePodnosilac: podnosilac === userId, statusUcesnika: status, smeClanove }),
    poziva: smePozvati({ clanStatus: clan.status, statusUcesnika: status, smeClanove }),
  };
}

/**
 * Članstvo kojim korisnik SME da postavi oglas u ime gazdinstva (čl. 9 st. 1, 9a):
 * aktivno članstvo i pravo upravljanja. Pijaca ga koristi umesto golog
 * `aktivnoClanstvo` kad oglas ide u ime gazdinstva.
 */
export async function upravljackoClanstvo(userId: string) {
  const c = await aktivnoClanstvo(userId);
  if (!c) return null;
  const p = await pravaUGazdinstvu(userId, c.gazdinstvo.id);
  return p?.upravlja ? c : null;
}

async function osigurajDaNijeClanDrugde(userId: string, izuzmiGazdinstvoId?: string) {
  const c = await aktivnoClanstvo(userId);
  if (c && c.gazdinstvo.id !== izuzmiGazdinstvoId) {
    throw new GazdinstvoGreska("Lice može biti član samo jednog gazdinstva.", 409);
  }
}

// ─── Prijava ─────────────────────────────────────────────────────────────────

export type PodaciPrijave = {
  naziv: unknown;
  opis: unknown;
  bpg: unknown;
  neregistrovano: unknown;
  naselje: unknown;
  adresa: unknown;
  lat: unknown;
  lng: unknown;
  uloga: unknown;
  /** Ime i prezime podnosioca (čl. 4 t. 8) — traži se samo kad nalog još nema upisano ime. */
  imePrezime?: unknown;
  /**
   * Izjava da je podnosilac saglasan da se adresa prikazuje uz tačku na mapi (čl. 4
   * t. 3) — OBAVEZNA za novu prijavu. 🔴 Nije pristanak koji se povlači: izlaz je
   * samo brisanje gazdinstva (čl. 11).
   */
  izjavaAdresa?: unknown;
  /**
   * Broj telefona NOSIOCA, odnosno podnosioca kad nosilac nema nalog (čl. 4 t. 9),
   * za razgovor iz čl. 6a. Ide na `Gazdinstvo.telefonZaRazgovor`.
   */
  telefon?: unknown;
};

function procitajTelefon(unos: unknown): string {
  const t = typeof unos === "string" ? unos.trim() : "";
  if (!ispravanTelefon(t))
    throw new GazdinstvoGreska("Upiši broj telefona nosioca na koji Fondacija može da pozove pre odobrenja.");
  return t;
}

/**
 * Čl. 6a — admin beleži da je razgovor sa nosiocem obavljen. Sa ostalim članovima
 * Fondacija po ovom članu ne razgovara. Broj ostaje do odluke o prijavi.
 */
export async function oznaciRazgovor(adminId: string, gazdinstvoId: string) {
  const g = await prisma.gazdinstvo.findUnique({ where: { id: gazdinstvoId }, select: { status: true } });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.status === GazdinstvoStatus.ODOBRENO || !ZIVO_GAZDINSTVO.includes(g.status)) {
    throw new GazdinstvoGreska("Razgovor se vodi pre odluke o prijavi.");
  }
  await zabraniSukobInteresa(adminId, gazdinstvoId);
  await prisma.gazdinstvo.update({
    where: { id: gazdinstvoId },
    data: { razgovorObavljenAt: new Date(), razgovorBeleziId: adminId, razgovorSumnja: null },
  });
  // 🔴 Bez broja telefona u opisu (pravilo o minimizaciji).
  await logAdminAkcija(adminId, "GAZDINSTVO_RAZGOVOR_OBAVLJEN", gazdinstvoId);
}

/**
 * Ime člana za evidenciju identiteta. Ako nalog već ima upisano ime, unos nije
 * potreban; ako je unet, mora biti isto ime (jedan nalog, jedno ime).
 */
async function imeClana(userId: string, unos: unknown): Promise<string | null> {
  const upisano = await prisma.identitetNaloga.findUnique({ where: { userId }, select: { imePrezime: true } });
  const prazno = unos === undefined || unos === null || (typeof unos === "string" && !unos.trim());
  if (upisano && prazno) return null;
  const r = procitajImePrezime(unos);
  if (!r.ok) throw new GazdinstvoGreska(r.razlog);
  if (ishodUpisa(upisano?.imePrezime, r.imePrezime) === "RAZLIKUJE_SE") throw new GazdinstvoGreska(PORUKA_DRUGO_IME, 409);
  return upisano ? null : r.imePrezime;
}

function procitajPrijavu(p: PodaciPrijave) {
  const naselje = typeof p.naselje === "string" ? razresiNaselje(p.naselje) : null;
  if (!naselje) throw new GazdinstvoGreska(PORUKA_MESTO_IZ_SPISKA);
  const neregistrovano = p.neregistrovano === true;
  const unos = {
    naziv: typeof p.naziv === "string" ? p.naziv.trim().replace(/\s+/g, " ") : "",
    opis: typeof p.opis === "string" ? p.opis.trim() : "",
    bpg: neregistrovano ? null : ocistiBpg(p.bpg),
    neregistrovano,
    adresa: typeof p.adresa === "string" ? p.adresa.trim().replace(/\s+/g, " ") : "",
    lat: Number(p.lat),
    lng: Number(p.lng),
    uloga: p.uloga === "NOSILAC" ? ("NOSILAC" as const) : p.uloga === "CLAN" ? ("CLAN" as const) : ("" as never),
  };
  proveri(proveriPrijavu(unos));
  return { ...unos, naselje };
}

/**
 * Čl. 4 i 4a — prijava se otvara kao NACRT: podnosilac je prvi član (uz izjavu),
 * pa postavlja oglase u ime gazdinstva i, kad gazdinstvo sme imati članove, poziva
 * članove; na pregled šalje kad ima najmanje tri oglasa (`posaljiNaPregled`).
 *
 * Ko sme da prijavi zavisi od statusa (čl. 4a, `smePrijaviti`). Gazdinstvo sme
 * imati članove od prijave samo kad je podnosilac član Kola ili osnivač
 * (`smeClanoveOd`).
 */
export async function prijaviGazdinstvo(userId: string, p: PodaciPrijave) {
  await ucitajKandidata(userId);
  await osigurajDaNijeClanDrugde(userId);
  const u = procitajPrijavu(p);
  const status = await statusNaloga(userId);
  proveri(smePrijaviti({ status, registrovano: !u.neregistrovano, uloga: u.uloga }));
  if (p.izjavaAdresa !== true)
    throw new GazdinstvoGreska("Potrebna je izjava da si saglasan da se adresa prikazuje uz tačku na mapi.");
  const ime = await imeClana(userId, p.imePrezime);
  const telefon = procitajTelefon(p.telefon);
  const potvrdjen = jePotvrdjen(status);

  const sada = new Date();
  const g = await prisma.$transaction(async (tx) => {
    const g = await tx.gazdinstvo.create({
      data: {
        naziv: u.naziv,
        opis: u.opis,
        bpg: u.bpg,
        neregistrovano: u.neregistrovano,
        naselje: u.naselje,
        adresa: u.adresa,
        lat: u.lat,
        lng: u.lng,
        izjavaAdresaAt: sada,
        // Za izjavu o tačnosti odgovara podnosilac (čl. 9 st. 2).
        upravljaId: userId,
        telefonZaRazgovor: telefon,
        smeClanoveOd: potvrdjen ? sada : null,
      },
      select: { id: true },
    });
    await tx.clanGazdinstva.create({
      data: {
        gazdinstvoId: g.id,
        userId,
        uloga: u.uloga as UlogaUGazdinstvu,
        status: ClanGazdinstvaStatus.PRISTUPIO,
        pristupioAt: sada,
        izjavaTekst: tekstIzjave(u.naziv),
        izjavaAt: sada,
      },
    });
    if (ime) await upisiIdentitet(userId, ime, "GAZDINSTVO", tx);
    return g;
  });
  return g;
}

/**
 * Izmena prijave dok nije odobrena. Podatke iz čl. 4 t. 1–3 (BPG, naziv, mesto,
 * adresa, lokacija) menja SAMO lice koje odgovara za izjavu (čl. 9 st. 2).
 * Uloga mora i dalje ispunjavati čl. 4a. Promena podataka poništava zabeleženo
 * poređenje sa izvodom.
 */
export async function izmeniGazdinstvo(userId: string, gazdinstvoId: string, p: PodaciPrijave) {
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: { upravljaId: true, status: true, izjavaAdresaAt: true, smeClanoveOd: true },
  });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.upravljaId !== userId)
    throw new GazdinstvoGreska("Ove podatke menja samo član koji odgovara za izjavu o tačnosti podataka.", 403);
  // Zatečena prijava bez izjave o adresi daje je pri izmeni (čl. 4 t. 3).
  if (!g.izjavaAdresaAt && p.izjavaAdresa !== true)
    throw new GazdinstvoGreska("Potrebna je izjava da si saglasan da se adresa prikazuje uz tačku na mapi.");
  if (!U_PRIPREMI.includes(g.status)) {
    throw new GazdinstvoGreska("Podaci se menjaju samo dok prijava nije poslata ili kad je vraćena na dopunu.");
  }
  const u = procitajPrijavu(p);
  // Gazdinstvo koje već sme imati članove prijavio je član Kola (čl. 4a t. 1).
  if (!smeImatiClanove(g)) {
    proveri(smePrijaviti({ status: await statusNaloga(userId), registrovano: !u.neregistrovano, uloga: u.uloga }));
  }
  const telefon =
    p.telefon !== undefined && p.telefon !== null && p.telefon !== "" ? procitajTelefon(p.telefon) : undefined;
  const ime = await imeClana(userId, p.imePrezime);
  if (ime) await upisiIdentitet(userId, ime, "GAZDINSTVO");
  await prisma.gazdinstvo.update({
    where: { id: gazdinstvoId },
    data: {
      naziv: u.naziv,
      opis: u.opis,
      bpg: u.bpg,
      neregistrovano: u.neregistrovano,
      naselje: u.naselje,
      adresa: u.adresa,
      lat: u.lat,
      lng: u.lng,
      rpgUporedjenAt: null,
      rpgUporedioId: null,
      ...(telefon ? { telefonZaRazgovor: telefon } : {}),
      ...(g.izjavaAdresaAt ? {} : { izjavaAdresaAt: new Date() }),
    },
  });
  // Uloga podnosioca je deo prijave (čl. 4 t. 4).
  await prisma.clanGazdinstva.updateMany({
    where: { gazdinstvoId, userId },
    data: { uloga: u.uloga as UlogaUGazdinstvu },
  });
}

/**
 * Opis gazdinstva (profil, čl. 9 st. 1) menja svaki član koji upravlja
 * gazdinstvom (`smeUpravljati`), dok gazdinstvo postoji.
 */
export async function izmeniOpis(userId: string, gazdinstvoId: string, opisUnos: unknown) {
  const g = await prisma.gazdinstvo.findUnique({ where: { id: gazdinstvoId }, select: { status: true } });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (!ZIVO_GAZDINSTVO.includes(g.status)) throw new GazdinstvoGreska("Gazdinstvo više nije aktivno.", 409);
  const prava = await pravaUGazdinstvu(userId, gazdinstvoId);
  if (!prava?.upravlja) throw new GazdinstvoGreska("Profil gazdinstva uređuje član gazdinstva koji je član Kola.", 403);
  const opis = typeof opisUnos === "string" ? opisUnos.trim() : "";
  if (opis.length < MIN_OPIS) throw new GazdinstvoGreska("Opiši šta i kako proizvodiš.");
  if (opis.length > MAX_OPIS) throw new GazdinstvoGreska(`Opis može imati najviše ${MAX_OPIS} znakova.`);
  await prisma.gazdinstvo.update({ where: { id: gazdinstvoId }, data: { opis } });
}

/**
 * Gazdinstvo nosioca sa spiska za poziv za koje razgovor radi odobrenja još nije
 * obavljen (čl. 6a st. 2; set 4.8.3). `null` kad takvog nema.
 */
export async function gazdinstvoZaRazgovorSaSpiska(nosilacId: string): Promise<{ id: string; naziv: string } | null> {
  const c = await prisma.clanGazdinstva.findFirst({
    where: {
      userId: nosilacId,
      uloga: UlogaUGazdinstvu.NOSILAC,
      status: { in: AKTIVNO_CLANSTVO },
      gazdinstvo: {
        status: { in: [GazdinstvoStatus.NACRT, GazdinstvoStatus.NA_PREGLEDU, GazdinstvoStatus.VRACENO] },
        razgovorObavljenAt: null,
      },
    },
    select: { gazdinstvo: { select: { id: true, naziv: true } } },
  });
  return c?.gazdinstvo ?? null;
}

/**
 * Jedan razgovor (čl. 6a st. 2; set 4.8.3): član Kola koji je nosioca pozvao sa spiska
 * za poziv beleži i da je razgovor radi odobrenja gazdinstva obavljen, i da li posle
 * njega postoji osnov za sumnju (st. 4). O odobrenju i dalje odlučuje Fondacija.
 * Član gazdinstva ne beleži razgovor za sopstveno gazdinstvo (sukob interesa).
 */
export async function zabeleziRazgovorSaSpiska(clanKolaId: string, nosilacId: string, sumnja: boolean) {
  const { jeOtvorioPoziv } = await import("./zahtev-razgovor");
  if (!(await jeOtvorioPoziv(clanKolaId, nosilacId))) {
    throw new GazdinstvoGreska("Razgovor beleži član Kola koji je otvorio poziv ove osobe.", 403);
  }
  if (!jePotvrdjen(await statusNaloga(clanKolaId))) {
    throw new GazdinstvoGreska("Razgovor sa spiska beleži član Kola.", 403);
  }
  const g = await gazdinstvoZaRazgovorSaSpiska(nosilacId);
  if (!g) throw new GazdinstvoGreska("Nema gazdinstva koje čeka razgovor.", 404);
  await zabraniSukobInteresa(clanKolaId, g.id);
  await prisma.gazdinstvo.update({
    where: { id: g.id },
    data: { razgovorObavljenAt: new Date(), razgovorBeleziId: clanKolaId, razgovorSumnja: sumnja },
  });
  // 🔴 Bez broja telefona i imena u opisu (minimizacija).
  await logAdminAkcija(clanKolaId, "GAZDINSTVO_RAZGOVOR_SA_SPISKA", g.id, sumnja ? "osnov za sumnju" : "bez sumnje");
}

// ─── Izvod iz Registra (čl. 4b) ──────────────────────────────────────────────

/** Da li prijava traži izvod: podnosilac je korisnik ili član bez potvrde, gazdinstvo je u Registru. */
async function prijavaTraziIzvod(gazdinstvoId: string, neregistrovano: boolean): Promise<boolean> {
  if (neregistrovano) return false;
  const podnosilac = await podnosilacGazdinstva(gazdinstvoId);
  if (!podnosilac) return false;
  return trebaIzvod(await statusNaloga(podnosilac), true);
}

/**
 * Otpremanje izvoda (čl. 4b st. 1–2). Prilaže ga lice koje odgovara za izjavu,
 * dok je prijava u pripremi, i samo kad se izvod traži. Pre otpremanja ekran
 * obaveštava šta se iz izvoda koristi i šta treba prekriti. Novi izvod poništava
 * zabeleženo poređenje.
 */
export async function otpremiIzvod(userId: string, gazdinstvoId: string, bajtovi: Uint8Array) {
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: { upravljaId: true, status: true, neregistrovano: true },
  });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.upravljaId !== userId) throw new GazdinstvoGreska("Izvod prilaže podnosilac prijave.", 403);
  if (!U_PRIPREMI.includes(g.status)) throw new GazdinstvoGreska("Izvod se prilaže dok je prijava u pripremi.");
  if (!(await prijavaTraziIzvod(gazdinstvoId, g.neregistrovano))) {
    throw new GazdinstvoGreska("Za ovu prijavu izvod iz Registra se ne traži.");
  }
  proveri(proveriIzvod(bajtovi));
  const contentType = tipIzvoda(bajtovi) as string;
  const sadrzaj = Buffer.from(bajtovi);
  const sada = new Date();
  await prisma.$transaction([
    prisma.izvodRpg.upsert({
      where: { gazdinstvoId },
      create: { gazdinstvoId, sadrzaj, contentType, velicina: bajtovi.length, otpremioId: userId, otpremljenAt: sada },
      update: { sadrzaj, contentType, velicina: bajtovi.length, otpremioId: userId, otpremljenAt: sada },
    }),
    prisma.gazdinstvo.update({ where: { id: gazdinstvoId }, data: { rpgUporedjenAt: null, rpgUporedioId: null } }),
  ]);
}

/** Izvod za pregled prijave — SAMO admin (proverava ruta); svako čitanje ide u audit. */
export async function procitajIzvod(adminId: string, gazdinstvoId: string) {
  const izvod = await prisma.izvodRpg.findUnique({
    where: { gazdinstvoId },
    select: { sadrzaj: true, contentType: true },
  });
  if (!izvod) throw new GazdinstvoGreska("Izvod nije priložen ili je obrisan posle odluke.", 404);
  await logAdminAkcija(adminId, "GAZDINSTVO_IZVOD_PROCITAN", gazdinstvoId);
  return izvod;
}

/**
 * Fondacija je podatke iz prijave (ime nosioca, adresa, BPG) uporedila sa izvodom
 * (čl. 4b st. 3). Beleži se samo da je poređenje izvršeno; kad se podaci ne
 * slažu, prijava se vraća na dopunu (`vratiGazdinstvo`).
 */
export async function oznaciPoredjenje(adminId: string, gazdinstvoId: string) {
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: { status: true, izvodRpg: { select: { id: true } } },
  });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.status !== GazdinstvoStatus.NA_PREGLEDU) throw new GazdinstvoGreska("Prijava nije na pregledu.");
  if (!g.izvodRpg) throw new GazdinstvoGreska("Izvod nije priložen.");
  await zabraniSukobInteresa(adminId, gazdinstvoId);
  await prisma.gazdinstvo.update({
    where: { id: gazdinstvoId },
    data: { rpgUporedjenAt: new Date(), rpgUporedioId: adminId },
  });
  await logAdminAkcija(adminId, "GAZDINSTVO_IZVOD_UPOREDJEN", gazdinstvoId);
}

/**
 * Oglasi koji ispunjavaju uslov čl. 4 t. 7 i čl. 5: ponuda u ime gazdinstva,
 * sadržinski minimum, nije uklonjen, oglašivač je član.
 */
export async function brojOglasaUzPrijavu(gazdinstvoId: string): Promise<number> {
  const oglasi = await prisma.marketplaceListing.findMany({
    where: {
      gazdinstvoId,
      tip: "PONUDA",
      status: "ACTIVE",
      uklonjenAt: null,
      seller: { clanstvaGazdinstva: { some: { gazdinstvoId, status: { in: AKTIVNO_CLANSTVO } } } },
    },
    select: { tip: true, title: true, description: true, category: true, location: true, images: true },
  });
  return oglasi.filter((o) => oglasIspunjavaMinimum(o).ok).length;
}

async function najaviAdminima(naslov: string, tekst: string, link: string, kljuc: string, parametri: Record<string, string>) {
  try {
    const admini = await prisma.user.findMany({
      where: { admin: { in: ["ADMIN", "SUPERADMIN"] }, deaktiviranAt: null },
      select: { id: true },
    });
    await Promise.all(
      admini.map((a) =>
        obavesti(a.id, { tip: "GAZDINSTVO_NA_PREGLEDU", kljuc, parametri, naslov, tekst, link, email: false }),
      ),
    );
    await posaljiAdminAlert(naslov, `${tekst}\n${link}`);
  } catch (e) {
    console.error("[gazdinstvo] javljanje adminima nije uspelo", e);
  }
}

/**
 * Čl. 6 — slanje na pregled; traži najmanje tri oglasa uz prijavu, izvod kad se
 * traži (čl. 4b) i broj za razgovor dok razgovor nije obavljen (čl. 6a).
 *
 * Korisnik koji je nosilac gazdinstva upisanog u Registar podnošenjem prijave
 * dolazi na spisak za poziv (čl. 4a t. 3; dokaz čl. 4a st. 2 t. 4): dobija ponudu
 * „Želim da me neko nazove". 🔴 To NE potvrđuje stvarnost.
 */
export async function posaljiNaPregled(userId: string, gazdinstvoId: string) {
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: {
      upravljaId: true,
      status: true,
      naziv: true,
      neregistrovano: true,
      bpg: true,
      telefonZaRazgovor: true,
      razgovorObavljenAt: true,
      izvodRpg: { select: { id: true } },
    },
  });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.upravljaId !== userId)
    throw new GazdinstvoGreska("Prijavu šalje član koji odgovara za izjavu o tačnosti podataka.", 403);
  if (!U_PRIPREMI.includes(g.status)) {
    throw new GazdinstvoGreska("Prijava je već poslata.");
  }
  const broj = await brojOglasaUzPrijavu(gazdinstvoId);
  if (broj < MIN_OGLASA_UZ_PRIJAVU) {
    throw new GazdinstvoGreska(
      `Uz prijavu je potrebno najmanje ${MIN_OGLASA_UZ_PRIJAVU} oglasa u ime gazdinstva (sada: ${broj}).`,
    );
  }
  if (!g.razgovorObavljenAt && !g.telefonZaRazgovor) {
    throw new GazdinstvoGreska("Upiši broj telefona nosioca za razgovor sa Fondacijom (izmena prijave).");
  }
  if ((await prijavaTraziIzvod(gazdinstvoId, g.neregistrovano)) && !g.izvodRpg) {
    throw new GazdinstvoGreska("Priloži izvod iz Registra poljoprivrednih gazdinstava.");
  }
  await prisma.gazdinstvo.update({
    where: { id: gazdinstvoId },
    data: { status: GazdinstvoStatus.NA_PREGLEDU, podnetoAt: new Date(), razlogVracanja: null },
  });
  await najaviAdminima(
    "Gazdinstvo čeka pregled",
    `Prijava gazdinstva „${g.naziv}“ čeka pregled Fondacije.`,
    "/admin?tab=gazdinstva",
    "notifikacije.gazdinstvo_admin_prijava",
    { naziv: g.naziv },
  );

  // Spisak za poziv (gazd. čl. 4a t. 3; dokaz čl. 4a t. 4): korisnik, nosilac — i za
  // gazdinstvo van Registra (set 4.8.3).
  try {
    const clan = await prisma.clanGazdinstva.findFirst({
      where: { gazdinstvoId, userId, status: { in: AKTIVNO_CLANSTVO } },
      select: { uloga: true },
    });
    if (clan?.uloga === UlogaUGazdinstvu.NOSILAC && (await statusNaloga(userId)) === "KORISNIK") {
      const { ponudiSpisak } = await import("./zahtev-razgovor");
      await ponudiSpisak(userId, "GAZDINSTVO_RPG");
    }
  } catch (e) {
    console.error("[gazdinstvo] ponuda spiska za poziv nije uspela", { userId, e });
  }
}

// ─── Članovi ─────────────────────────────────────────────────────────────────

/**
 * Čl. 7 st. 2 — poziva član gazdinstva koji je član Kola, i samo kad gazdinstvo
 * sme imati članove (čl. 4a). Pozvani može biti svaki punoletan aktivan učesnik;
 * uslov iz čl. 7a se proverava pri odobrenju pristupanja.
 */
export async function pozoviClana(userId: string, gazdinstvoId: string, pseudonim: unknown) {
  if (typeof pseudonim !== "string" || !pseudonim.trim()) throw new GazdinstvoGreska("Upiši pseudonim.");
  const pozivalac = await prisma.clanGazdinstva.findFirst({
    where: { gazdinstvoId, userId, status: { in: AKTIVNO_CLANSTVO } },
    select: { id: true, gazdinstvo: { select: { status: true, naziv: true } } },
  });
  if (!pozivalac) throw new GazdinstvoGreska("Samo član gazdinstva može da poziva.", 403);
  if (!ZIVO_GAZDINSTVO.includes(pozivalac.gazdinstvo.status)) {
    throw new GazdinstvoGreska("U ovo gazdinstvo se više ne može pristupiti.");
  }
  const prava = await pravaUGazdinstvu(userId, gazdinstvoId);
  if (!prava?.smeClanove) {
    throw new GazdinstvoGreska(
      "Gazdinstvo prima članove kada ga je prijavio član Kola, odnosno kada podnosioca potvrdi član Kola koji ga lično zna.",
      403,
    );
  }
  if (!prava.poziva) throw new GazdinstvoGreska("U gazdinstvo poziva član gazdinstva koji je član Kola.", 403);

  const pozvani = await prisma.user.findFirst({
    where: gdePseudonim(pseudonim.trim()),
    select: { id: true, pseudonim: true, maloletan: true, status: true, deaktiviranAt: true },
  });
  if (!pozvani) throw new GazdinstvoGreska("Korisnik sa tim pseudonimom ne postoji.", 404);
  proveri(smeBitiClan({ maloletan: pozvani.maloletan, status: pozvani.status, deaktiviran: pozvani.deaktiviranAt !== null }));
  if (pozvani.id === userId) throw new GazdinstvoGreska("Već si član.");
  await osigurajDaNijeClanDrugde(pozvani.id);

  const postojece = await prisma.clanGazdinstva.findUnique({
    where: { gazdinstvoId_userId: { gazdinstvoId, userId: pozvani.id } },
    select: { id: true, status: true },
  });
  if (postojece && AKTIVNO_CLANSTVO.includes(postojece.status)) throw new GazdinstvoGreska("Već je član.");
  if (postojece?.status === ClanGazdinstvaStatus.POZVAN) throw new GazdinstvoGreska("Poziv je već poslat.");

  const clan = postojece
    ? await prisma.clanGazdinstva.update({
        where: { id: postojece.id },
        data: {
          status: ClanGazdinstvaStatus.POZVAN,
          pozvaoId: userId,
          pozvanAt: new Date(),
          pristupioAt: null,
          odobrenAt: null,
          istupioAt: null,
          izjavaTekst: null,
          izjavaAt: null,
        },
        select: { id: true },
      })
    : await prisma.clanGazdinstva.create({
        data: { gazdinstvoId, userId: pozvani.id, pozvaoId: userId },
        select: { id: true },
      });

  await obavesti(pozvani.id, {
    tip: "GAZDINSTVO_POZIV",
    kljuc: "notifikacije.gazdinstvo_poziv",
    parametri: { naziv: pozivalac.gazdinstvo.naziv },
    naslov: "Poziv u gazdinstvo",
    tekst: `Pozvan si da pristupiš gazdinstvu „${pozivalac.gazdinstvo.naziv}“.`,
    link: `/gazdinstva/${gazdinstvoId}`,
  });
  return clan;
}

/**
 * Nosilac upisanog gazdinstva pri pristupanju daje izjavu iz čl. 4 t. 6 i od tada
 * za nju odgovara on (čl. 9 st. 2). Red pristupanja i evidentiran doprinos se time
 * ne menjaju.
 */
async function nosilacPreuzimaIzjavu(gazdinstvoId: string, userId: string) {
  const g = await prisma.gazdinstvo.findUnique({ where: { id: gazdinstvoId }, select: { neregistrovano: true } });
  if (!g || g.neregistrovano) return;
  await prisma.gazdinstvo.update({ where: { id: gazdinstvoId }, data: { upravljaId: userId } });
  // Otvoren upit o preuzimanju izjave tada nema predmet.
  await prisma.upitIzjaveGazdinstva.updateMany({
    where: { gazdinstvoId, status: UpitIzjaveStatus.CEKA },
    data: { status: UpitIzjaveStatus.ISTEKLA, odgovorAt: new Date() },
  });
}

/**
 * Prihvatanje poziva uz izjavu o tačnosti (čl. 7 st. 2). Pristupanje posle
 * odobrenja gazdinstva čeka pregled Fondacije (čl. 8 st. 1); odbijanje briše poziv.
 * Razgovora sa članom nema (čl. 6a — samo sa nosiocem), pa se broj ne traži.
 */
export async function odgovoriNaPoziv(
  userId: string,
  clanId: string,
  prihvata: boolean,
  uloga: unknown,
  imePrezime?: unknown,
) {
  const clan = await prisma.clanGazdinstva.findUnique({
    where: { id: clanId },
    select: {
      id: true,
      userId: true,
      status: true,
      gazdinstvoId: true,
      gazdinstvo: { select: { naziv: true, status: true } },
    },
  });
  if (!clan || clan.userId !== userId) throw new GazdinstvoGreska("Poziv ne postoji.", 404);
  if (clan.status !== ClanGazdinstvaStatus.POZVAN) throw new GazdinstvoGreska("Poziv više nije otvoren.");

  if (!prihvata) {
    await prisma.clanGazdinstva.delete({ where: { id: clanId } });
    return { pristupio: false };
  }
  await ucitajKandidata(userId);
  if (!ZIVO_GAZDINSTVO.includes(clan.gazdinstvo.status)) {
    throw new GazdinstvoGreska("U ovo gazdinstvo se više ne može pristupiti.");
  }
  await osigurajDaNijeClanDrugde(userId, clan.gazdinstvoId);
  const ime = await imeClana(userId, imePrezime);

  let ulogaClana: UlogaUGazdinstvu = UlogaUGazdinstvu.CLAN;
  if (uloga === "NOSILAC") {
    const vecNosilac = await prisma.clanGazdinstva.count({
      where: { gazdinstvoId: clan.gazdinstvoId, uloga: UlogaUGazdinstvu.NOSILAC, status: { in: AKTIVNO_CLANSTVO } },
    });
    if (vecNosilac > 0) throw new GazdinstvoGreska("Gazdinstvo već ima nosioca.");
    ulogaClana = UlogaUGazdinstvu.NOSILAC;
  }

  const sada = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.clanGazdinstva.update({
      where: { id: clanId },
      data: {
        status: ClanGazdinstvaStatus.PRISTUPIO,
        uloga: ulogaClana,
        pristupioAt: sada,
        izjavaTekst: tekstIzjave(clan.gazdinstvo.naziv),
        izjavaAt: sada,
      },
    });
    if (ime) await upisiIdentitet(userId, ime, "GAZDINSTVO", tx);
  });

  if (clan.gazdinstvo.status === GazdinstvoStatus.ODOBRENO) {
    await najaviAdminima(
      "Pristupanje gazdinstvu čeka pregled",
      `Nov član pristupio je gazdinstvu „${clan.gazdinstvo.naziv}“ i čeka pregled Fondacije.`,
      "/admin?tab=gazdinstva",
      "notifikacije.gazdinstvo_admin_pristupanje",
      { naziv: clan.gazdinstvo.naziv },
    );
  } else if (ulogaClana === UlogaUGazdinstvu.NOSILAC) {
    // Pre odobrenja gazdinstva pristupanje dejstvuje prihvatanjem (čl. 8 st. 1).
    await nosilacPreuzimaIzjavu(clan.gazdinstvoId, userId);
  }
  return { pristupio: true };
}

/**
 * Član koji je pristupio pre seta 4.7.3 nema upisano ime; upisuje ga ovde, jer
 * odobrenje gazdinstva i pristupanja traži ime svakog člana (čl. 6, čl. 8 st. 1).
 */
export async function upisiImeClana(userId: string, gazdinstvoId: string, imePrezime: unknown) {
  const clan = await prisma.clanGazdinstva.findFirst({
    where: { gazdinstvoId, userId, status: { in: AKTIVNO_CLANSTVO } },
    select: { id: true },
  });
  if (!clan) throw new GazdinstvoGreska("Nisi član ovog gazdinstva.", 404);
  const ime = await imeClana(userId, imePrezime);
  if (ime) await upisiIdentitet(userId, ime, "GAZDINSTVO");
}

/** Članovi koji čekaju odluku a nemaju upisano ime — pseudonimi, za poruku adminu. */
async function bezImena(clanIds: string[]): Promise<string[]> {
  const clanovi = await prisma.clanGazdinstva.findMany({
    where: { id: { in: clanIds } },
    select: { user: { select: { pseudonim: true, identitet: { select: { id: true } } } } },
  });
  return clanovi.filter((c) => !c.user.identitet).map((c) => c.user.pseudonim);
}

/**
 * Čl. 9 st. 2 — nosilac upisanog gazdinstva koji je član preuzima izjavu o
 * tačnosti i od tada za nju odgovara. (Ruta `[id]/upravljanje` ostaje zbog starih
 * linkova; upravljanje se od seta 4.8.2 ne čuva nego izvodi.)
 */
export async function preuzmiUpravljanje(userId: string, gazdinstvoId: string) {
  const clan = await prisma.clanGazdinstva.findFirst({
    where: { gazdinstvoId, userId, status: { in: AKTIVNO_CLANSTVO } },
    select: { uloga: true, status: true, gazdinstvo: { select: { neregistrovano: true, status: true } } },
  });
  if (!clan || clan.uloga !== UlogaUGazdinstvu.NOSILAC || clan.gazdinstvo.neregistrovano) {
    throw new GazdinstvoGreska("Izjavu preuzima nosilac gazdinstva upisanog u Registar.", 403);
  }
  if (clan.gazdinstvo.status === GazdinstvoStatus.ODOBRENO && clan.status !== ClanGazdinstvaStatus.ODOBREN) {
    throw new GazdinstvoGreska("Izjavu preuzimaš kada Fondacija odobri tvoje pristupanje.", 403);
  }
  await nosilacPreuzimaIzjavu(gazdinstvoId, userId);
}

// ─── Upit o preuzimanju izjave (čl. 9 st. 3, 11 st. 6) ──────────────────────

/**
 * Upućuje upit sledećem članu po redu pristupanja. Preskaču se članovi koji su u
 * tekućem krugu već odbili ili se nisu izjasnili (krug počinje posle poslednjeg
 * preuzimanja). Kad nema kome — gazdinstvo prestaje (čl. 12a st. 1 t. 1).
 */
async function uputiUpit(gazdinstvoId: string): Promise<void> {
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: { status: true, naziv: true, upravljaId: true },
  });
  if (!g || !ZIVO_GAZDINSTVO.includes(g.status) || g.upravljaId) return;
  const otvoren = await prisma.upitIzjaveGazdinstva.count({ where: { gazdinstvoId, status: UpitIzjaveStatus.CEKA } });
  if (otvoren > 0) return;

  const poslednjePreuzimanje = await prisma.upitIzjaveGazdinstva.findFirst({
    where: { gazdinstvoId, status: UpitIzjaveStatus.PREUZETA },
    orderBy: { odgovorAt: "desc" },
    select: { odgovorAt: true },
  });
  const odbili = await prisma.upitIzjaveGazdinstva.findMany({
    where: {
      gazdinstvoId,
      status: { in: [UpitIzjaveStatus.ODBIJENA, UpitIzjaveStatus.ISTEKLA] },
      ...(poslednjePreuzimanje?.odgovorAt ? { upucenAt: { gt: poslednjePreuzimanje.odgovorAt } } : {}),
    },
    select: { clanId: true },
  });
  const preskoci = new Set(odbili.map((u) => u.clanId));
  const kandidati = await prisma.clanGazdinstva.findMany({
    where: { gazdinstvoId, status: { in: AKTIVNO_CLANSTVO } },
    orderBy: { pristupioAt: "asc" },
    select: { id: true, userId: true },
  });
  const sledeci = kandidati.find((c) => !preskoci.has(c.id));
  if (!sledeci) {
    await prestanakGazdinstva(gazdinstvoId, "BEZ_CLANOVA");
    return;
  }
  await prisma.upitIzjaveGazdinstva.create({
    data: { gazdinstvoId, clanId: sledeci.id, rokDo: new Date(Date.now() + ROK_UPITA_DANA * DAN_MS) },
  });
  await obavesti(sledeci.userId, {
    tip: "GAZDINSTVO_UPIT_IZJAVE",
    kljuc: "notifikacije.gazdinstvo_upit_izjave",
    parametri: { naziv: g.naziv, dana: String(ROK_UPITA_DANA) },
    naslov: "Preuzmi izjavu o gazdinstvu",
    tekst:
      `Član koji je odgovarao za izjavu o tačnosti podataka gazdinstva „${g.naziv}“ više je ne daje. ` +
      `Možeš da je preuzmeš u roku od ${ROK_UPITA_DANA} dana. Ako izjavu ne preuzme nijedan član, ` +
      `gazdinstvo prestaje, a članovima se zabeležen doprinos gazdinstva poništava, odnosno evidentiran otpisuje.`,
    link: `/gazdinstva/${gazdinstvoId}`,
  }).catch((e) => console.error("[gazdinstvo] javljanje upita", e));
}

/** Odgovor na upit (čl. 9 st. 3): preuzimanje izjave ili odbijanje. */
export async function odgovoriNaUpit(userId: string, upitId: string, preuzima: boolean) {
  const upit = await prisma.upitIzjaveGazdinstva.findUnique({
    where: { id: upitId },
    select: {
      id: true,
      status: true,
      gazdinstvoId: true,
      clan: { select: { userId: true, status: true } },
    },
  });
  if (!upit || upit.clan.userId !== userId) throw new GazdinstvoGreska("Upit ne postoji.", 404);
  if (upit.status !== UpitIzjaveStatus.CEKA) throw new GazdinstvoGreska("Upit više nije otvoren.");
  if (!AKTIVNO_CLANSTVO.includes(upit.clan.status)) throw new GazdinstvoGreska("Nisi više član gazdinstva.", 403);
  const sada = new Date();
  const r = await prisma.upitIzjaveGazdinstva.updateMany({
    where: { id: upitId, status: UpitIzjaveStatus.CEKA },
    data: { status: preuzima ? UpitIzjaveStatus.PREUZETA : UpitIzjaveStatus.ODBIJENA, odgovorAt: sada },
  });
  if (r.count !== 1) throw new GazdinstvoGreska("Upit je u međuvremenu promenjen.", 409);
  if (preuzima) {
    await prisma.gazdinstvo.update({ where: { id: upit.gazdinstvoId }, data: { upravljaId: userId } });
    await logAdminAkcija(userId, "GAZDINSTVO_IZJAVA_PREUZETA", upit.gazdinstvoId);
    return { preuzeto: true };
  }
  await uputiUpit(upit.gazdinstvoId);
  return { preuzeto: false };
}

/** Cron: istekli upiti (30 dana bez odgovora) idu sledećem članu ili gazdinstvo prestaje. */
export async function obradiUpite(sada = new Date()) {
  const istekli = await prisma.upitIzjaveGazdinstva.findMany({
    where: { status: UpitIzjaveStatus.CEKA, rokDo: { lt: sada } },
    select: { id: true, gazdinstvoId: true },
    take: 200,
  });
  let obradjeno = 0;
  for (const u of istekli) {
    try {
      const r = await prisma.upitIzjaveGazdinstva.updateMany({
        where: { id: u.id, status: UpitIzjaveStatus.CEKA },
        data: { status: UpitIzjaveStatus.ISTEKLA, odgovorAt: sada },
      });
      if (r.count === 1) {
        await uputiUpit(u.gazdinstvoId);
        obradjeno++;
      }
    } catch (e) {
      console.error("[gazdinstvo] obrada upita nije uspela", { upitId: u.id, e });
    }
  }
  return { istekli: istekli.length, obradjeno };
}

// ─── Istupanje i brisanje (čl. 9 st. 3, 11 st. 5–6) ─────────────────────────

/**
 * Posledica istupanja odnosno brisanja za ekran upozorenja (čl. 11 st. 5;
 * otvoreno pitanje 6): da li je član poslednji i koliko će mu biti otpisano,
 * odnosno poništeno.
 */
export async function posledicaIzlaska(userId: string, gazdinstvoId: string) {
  const [clanova, g, d] = await Promise.all([
    prisma.clanGazdinstva.count({ where: { gazdinstvoId, status: { in: AKTIVNO_CLANSTVO } } }),
    prisma.gazdinstvo.findUnique({ where: { id: gazdinstvoId }, select: { status: true } }),
    prisma.doprinosGazdinstva.findFirst({
      where: { userId, gazdinstvoId, aktivanKljuc: { not: null } },
      select: { iznos: true, status: true },
    }),
  ]);
  const poslednji = clanova <= 1;
  const odobreno = g?.status === GazdinstvoStatus.ODOBRENO;
  return {
    poslednji,
    otpis: poslednji && odobreno && d?.status === DoprinosStatus.EVIDENTIRAN ? d.iznos : 0,
    ponistava: poslednji && odobreno && d?.status === DoprinosStatus.ZABELEZEN ? d.iznos : 0,
  };
}

/**
 * Čl. 9 st. 3 — istupanje. POEN ostaje članu; zabeležen doprinos se i dalje
 * evidentira pod uslovima čl. 8 i ne dira se kad gazdinstvo kasnije prestane,
 * osim zbog lažne izjave.
 *
 *  - Ako istupa POSLEDNJI član, gazdinstvo prestaje (čl. 12a st. 1 t. 1) i on je
 *    „član u trenutku prestanka" — otpis ga pogađa (otvoreno pitanje 6; ekran ga
 *    pre toga upozorava sa iznosom, `posledicaIzlaska`).
 *  - Ako istupa lice koje odgovara za izjavu, sledeći član po redu dobija upit.
 */
export async function istupi(userId: string, gazdinstvoId: string) {
  const clan = await prisma.clanGazdinstva.findFirst({
    where: { gazdinstvoId, userId, status: { in: AKTIVNO_CLANSTVO } },
    select: { id: true },
  });
  if (!clan) throw new GazdinstvoGreska("Nisi član ovog gazdinstva.", 404);
  const ostali = await prisma.clanGazdinstva.count({
    where: { gazdinstvoId, status: { in: AKTIVNO_CLANSTVO }, id: { not: clan.id } },
  });
  if (ostali === 0) {
    await prestanakGazdinstva(gazdinstvoId, "BEZ_CLANOVA", { izvrsilacId: userId });
    return { prestalo: true };
  }
  const sada = new Date();
  await prisma.clanGazdinstva.update({
    where: { id: clan.id },
    data: { status: ClanGazdinstvaStatus.ISTUPIO, istupioAt: sada },
  });
  // Njegov otvoren upit nema više predmet.
  await prisma.upitIzjaveGazdinstva.updateMany({
    where: { clanId: clan.id, status: UpitIzjaveStatus.CEKA },
    data: { status: UpitIzjaveStatus.ODBIJENA, odgovorAt: sada },
  });
  await prisma.gazdinstvo.updateMany({
    where: { id: gazdinstvoId, upravljaId: userId },
    data: { upravljaId: null },
  });
  // Upit ide samo kad gazdinstvo ostane bez lica koje odgovara za izjavu.
  await uputiUpit(gazdinstvoId);
  return { prestalo: false };
}

/** Gašenje naloga: član istupa iz gazdinstva (poziva se iz brisanja naloga, ne baca). */
export async function istupiPriGasenjuNaloga(userId: string) {
  try {
    await prisma.clanGazdinstva.deleteMany({ where: { userId, status: ClanGazdinstvaStatus.POZVAN } });
    const clanstva = await prisma.clanGazdinstva.findMany({
      where: { userId, status: { in: AKTIVNO_CLANSTVO } },
      select: { gazdinstvoId: true },
    });
    for (const c of clanstva) await istupi(userId, c.gazdinstvoId);
  } catch (e) {
    console.error("[gazdinstvo] istupanje pri gašenju naloga nije uspelo", { userId, e });
  }
}

// ─── Adresa na mapi i brisanje gazdinstva (čl. 4 t. 3, čl. 11) ──────────────

/**
 * Izjava o prikazu adrese za gazdinstvo odobreno pre dopune od 20.10.2026 (čl. 11
 * st. 1): daje je lice koje odgovara za izjavu, JEDNOM. 🔴 Nema suprotne radnje —
 * izjava se ne povlači; izlaz je samo brisanje gazdinstva (`obrisiGazdinstvo`).
 */
export async function dajIzjavuOAdresi(userId: string, gazdinstvoId: string) {
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: { upravljaId: true, status: true, izjavaAdresaAt: true },
  });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.upravljaId !== userId)
    throw new GazdinstvoGreska("Izjavu daje član koji odgovara za izjavu o tačnosti podataka.", 403);
  if (!ZIVO_GAZDINSTVO.includes(g.status)) throw new GazdinstvoGreska("Gazdinstvo više nije aktivno.", 409);
  if (g.izjavaAdresaAt) return;
  await prisma.gazdinstvo.updateMany({
    where: { id: gazdinstvoId, izjavaAdresaAt: null },
    data: { izjavaAdresaAt: new Date() },
  });
}

/**
 * Brisanje gazdinstva sa platforme (čl. 11 st. 5–6) — samo lice koje odgovara za
 * izjavu, i samo kad gazdinstvo nema ugovor o pokroviteljstvu dobrima i uslugama
 * sa neiskorišćenim vaučerima.
 *
 *  - Ima li gazdinstvo i druge članove, zahtev ima dejstvo ISTUPANJA tog lica:
 *    ostali dobijaju upit da preuzmu izjavu (čl. 11 st. 6).
 *  - Inače gazdinstvo prestaje (`prestanakGazdinstva(…, "BRISANJE")`): zabeležen
 *    doprinos se poništava, evidentiran otpisuje (čl. 12a). Pre toga ekran
 *    obaveštava o iznosu otpisa (`posledicaIzlaska`).
 */
export async function obrisiGazdinstvo(userId: string, gazdinstvoId: string) {
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: { upravljaId: true, status: true, bpg: true },
  });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.upravljaId !== userId)
    throw new GazdinstvoGreska("Gazdinstvo briše član koji odgovara za izjavu o tačnosti podataka.", 403);
  if (!ZIVO_GAZDINSTVO.includes(g.status)) throw new GazdinstvoGreska("Gazdinstvo više nije aktivno.", 409);

  const sada = new Date();
  const vauceri = await prisma.vaucer.findMany({
    where: {
      ugovor: {
        upis: {
          obrisanAt: null,
          OR: [{ gazdinstvoId }, ...(g.bpg ? [{ vrsta: "GAZDINSTVO" as const, bpg: g.bpg }] : [])],
        },
      },
    },
    select: { status: true, ugovor: { select: { status: true, vaziDo: true } } },
  });
  const smem = smeObrisatiUpis(vauceri, sada);
  if (!smem.ok)
    throw new GazdinstvoGreska(
      "Brisanje nije moguće dok gazdinstvo ima ugovor o pokroviteljstvu dobrima i uslugama sa neiskorišćenim vaučerima.",
      409,
    );

  const drugih = await prisma.clanGazdinstva.count({
    where: { gazdinstvoId, status: { in: AKTIVNO_CLANSTVO }, userId: { not: userId } },
  });
  if (drugih > 0) {
    await istupi(userId, gazdinstvoId);
    return { ishod: "ISTUPIO" as const };
  }
  await prestanakGazdinstva(gazdinstvoId, "BRISANJE", { izvrsilacId: userId });
  return { ishod: "OBRISANO" as const };
}

// ─── Prestanak gazdinstva (čl. 12a) ──────────────────────────────────────────

const OPIS_OTPISA: Record<OsnovPrestanka, string> = {
  BEZ_CLANOVA: "Otpis doprinosa gazdinstva (gazdinstvo prestalo — bez članova)",
  BRISANJE: "Otpis doprinosa gazdinstva (gazdinstvo obrisano)",
  LAZNA_IZJAVA: "Otpis doprinosa gazdinstva (poništeno odobrenje gazdinstva)",
};

const KLJUC_OTPISA: Record<OsnovPrestanka, string> = {
  BEZ_CLANOVA: "notifikacije.gazdinstvo_otpis_bez_clanova",
  BRISANJE: "notifikacije.gazdinstvo_otpis_brisanje",
  LAZNA_IZJAVA: "notifikacije.gazdinstvo_otpis_lazna",
};

const RAZLOG_PRESTANKA: Record<OsnovPrestanka, string> = {
  BEZ_CLANOVA: "izjavu o tačnosti podataka nije preuzeo nijedan član, odnosno u gazdinstvu više nema članova",
  BRISANJE: "gazdinstvo je obrisano sa platforme",
  LAZNA_IZJAVA: "odobrenje je poništeno zbog lažne izjave",
};

/**
 * Otpis evidentiranog doprinosa (Pravilnik čl. 14 st. 3 t. 6). Zapis SME u minus;
 * teret se ne prenosi. Par −X/+X ide u istoj transakciji, sopstvenim tipom.
 * `aktivanKljuc` ide na null — lice doprinos može ponovo steći (čl. 12a st. 6).
 */
async function otpisiDoprinos(doprinosId: string, osnov: OsnovPrestanka): Promise<{ userId: string; iznos: number } | null> {
  return prisma.$transaction(async (tx) => {
    const rez = await tx.doprinosGazdinstva.updateMany({
      where: { id: doprinosId, status: DoprinosStatus.EVIDENTIRAN, otpisanAt: null },
      data: { otpisanAt: new Date(), aktivanKljuc: null },
    });
    if (rez.count !== 1) return null;
    const d = await tx.doprinosGazdinstva.findUniqueOrThrow({
      where: { id: doprinosId },
      select: { userId: true, iznos: true },
    });
    const w = await tx.wallet.findUnique({ where: { userId: d.userId }, select: { id: true } });
    if (!w) throw new GazdinstvoGreska("Član nema zapis u Protokolu.", 500);
    await tx.wallet.update({ where: { id: w.id }, data: { balance: { decrement: d.iznos } } });
    await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: d.iznos } } });
    const t = await tx.transaction.create({
      data: {
        fromWalletId: w.id,
        toWalletId: PROTOKOL_WALLET_ID,
        amount: d.iznos,
        type: TransactionType.OTPIS_GAZDINSTVO,
        description: OPIS_OTPISA[osnov],
        opisKljuc: "transakcije.gazdinstvo_otpis",
      },
      select: { id: true },
    });
    await tx.doprinosGazdinstva.update({ where: { id: doprinosId }, data: { otpisTransakcijaId: t.id } });
    return d;
  });
}

/**
 * Prestanak gazdinstva (gazd. čl. 12a; Pravilnik čl. 40c st. 6) — JEDINI put:
 *
 *  - status UGASENO (bez članova, brisanje), odnosno PONISTENO (lažna izjava);
 *  - brišu se naziv, opis, adresa, lokacija i BPG, tačka nestaje sa mape, oglasi
 *    u ime gazdinstva prestaju da se prikazuju; briše se izvod i broj za razgovor;
 *  - licima iz `clanoviZaOtpis` zabeležen doprinos se poništava, a evidentiran
 *    OTPISUJE (i u minus, šesti osnov). Doprinos ranije istupelih se kod t. 1–2 ne
 *    dira; kod lažne izjave dira se i njihov;
 *  - doprinos za prvi oglas (čl. 40a) se ne dira;
 *  - svako pogođeno lice dobija obaveštenje sa iznosom (CLAUDE.md pravilo 3).
 *
 * Neodobreno gazdinstvo nema doprinosa — samo se zatvara. Vraća pogođena lica
 * (za isključenje kod lažne izjave).
 */
export async function prestanakGazdinstva(
  gazdinstvoId: string,
  osnov: OsnovPrestanka,
  opcije: { izvrsilacId?: string; razlog?: string } = {},
): Promise<{ pogodjeni: string[]; otpisano: number }> {
  const g = await prisma.gazdinstvo.findUnique({ where: { id: gazdinstvoId }, select: { status: true, naziv: true } });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (osnov === "LAZNA_IZJAVA" && g.status !== GazdinstvoStatus.ODOBRENO) {
    throw new GazdinstvoGreska("Poništava se samo odobreno gazdinstvo.");
  }
  if (!ZIVO_GAZDINSTVO.includes(g.status)) throw new GazdinstvoGreska("Gazdinstvo više nije aktivno.", 409);
  const bioOdobreno = g.status === GazdinstvoStatus.ODOBRENO;

  const clanstva = await prisma.clanGazdinstva.findMany({
    where: { gazdinstvoId, izjavaAt: { not: null } },
    select: { userId: true, status: true },
  });
  const pogodjeni = clanoviZaOtpis(osnov, clanstva);
  const sada = new Date();

  const zabelezeni = await prisma.$transaction(async (tx) => {
    const r = await tx.gazdinstvo.updateMany({
      where: { id: gazdinstvoId, status: g.status },
      data: {
        ...(osnov === "LAZNA_IZJAVA"
          ? {
              status: GazdinstvoStatus.PONISTENO,
              ponistenoAt: sada,
              ponistioId: opcije.izvrsilacId ?? null,
              razlogPonistenja: opcije.razlog ?? null,
            }
          : { status: GazdinstvoStatus.UGASENO, ugasenoAt: sada, ...(osnov === "BRISANJE" ? { obrisanoAt: sada } : {}) }),
        // Politika 4.13; gazd. čl. 12a st. 2.
        naziv: "",
        adresa: null,
        opis: "",
        bpg: null,
        lat: null,
        lng: null,
        upravljaId: null,
        telefonZaRazgovor: null,
      },
    });
    if (r.count !== 1) throw new GazdinstvoGreska("Gazdinstvo je u međuvremenu promenjeno.", 409);
    await tx.izvodRpg.deleteMany({ where: { gazdinstvoId } });
    await tx.marketplaceListing.updateMany({
      where: { gazdinstvoId, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });
    const zabelezeni = await tx.doprinosGazdinstva.findMany({
      where: { gazdinstvoId, userId: { in: pogodjeni }, status: DoprinosStatus.ZABELEZEN },
      select: { userId: true, iznos: true },
    });
    await tx.doprinosGazdinstva.updateMany({
      where: { gazdinstvoId, userId: { in: pogodjeni }, status: DoprinosStatus.ZABELEZEN },
      data: { status: DoprinosStatus.PONISTEN, ponistenAt: sada, aktivanKljuc: null },
    });
    await tx.clanGazdinstva.updateMany({
      where: { gazdinstvoId, status: { in: AKTIVNO_CLANSTVO } },
      data: { status: ClanGazdinstvaStatus.ISTUPIO, istupioAt: sada, telefon: null },
    });
    await tx.clanGazdinstva.deleteMany({ where: { gazdinstvoId, status: ClanGazdinstvaStatus.POZVAN } });
    await tx.upitIzjaveGazdinstva.updateMany({
      where: { gazdinstvoId, status: UpitIzjaveStatus.CEKA },
      data: { status: UpitIzjaveStatus.ISTEKLA, odgovorAt: sada },
    });
    return zabelezeni;
  });

  const evidentirani = await prisma.doprinosGazdinstva.findMany({
    where: { gazdinstvoId, userId: { in: pogodjeni }, status: DoprinosStatus.EVIDENTIRAN, otpisanAt: null },
    select: { id: true },
  });
  const otpisi = new Map<string, number>();
  for (const e of evidentirani) {
    const d = await otpisiDoprinos(e.id, osnov);
    if (d) otpisi.set(d.userId, d.iznos);
  }
  const ponisteni = new Map(zabelezeni.map((z) => [z.userId, z.iznos]));

  // Svako pogođeno lice: prestanak, poništenje i iznos otpisa (gazd. čl. 12a st. 5).
  if (bioOdobreno) {
    for (const userId of pogodjeni) {
      const otpis = otpisi.get(userId) ?? 0;
      const ponisteno = ponisteni.get(userId) ?? 0;
      const iznos = otpis.toLocaleString("sr-RS");
      const iznosPonisten = ponisteno.toLocaleString("sr-RS");
      await obavesti(userId, {
        tip: "GAZDINSTVO_OTPIS",
        kljuc: KLJUC_OTPISA[osnov],
        parametri: { naziv: g.naziv, iznos, ponisten: iznosPonisten },
        naslov: "Gazdinstvo je prestalo",
        tekst:
          `Gazdinstvo „${g.naziv}“ je prestalo: ${RAZLOG_PRESTANKA[osnov]}. ` +
          `Poništen ti je zabeležen doprinos gazdinstva od ${iznosPonisten} POEN, a otpisano ti je ${iznos} POEN; ` +
          `zapis može biti negativan (Pravilnik čl. 14 st. 3 t. 6). Doprinos za prvi oglas ostaje.`,
        link: "/novcanik",
      }).catch((err) => console.error("[gazdinstvo] javljanje otpisa", err));
    }
  }

  if (opcije.izvrsilacId) {
    await logAdminAkcija(
      opcije.izvrsilacId,
      `GAZDINSTVO_PRESTANAK_${osnov}`,
      gazdinstvoId,
      `pogođenih ${pogodjeni.length}, otpisa ${otpisi.size}`,
    );
  } else {
    console.info("[gazdinstvo] prestanak", { gazdinstvoId, osnov, pogodjeni: pogodjeni.length, otpisa: otpisi.size });
  }
  return { pogodjeni, otpisano: otpisi.size };
}

// ─── Odluke Fondacije ────────────────────────────────────────────────────────

/**
 * Beleži doprinos članu (čl. 40c st. 3). Red je broj već zabeleženih doprinosa u
 * ovom gazdinstvu + 1 — broje se i PONISTEN redovi, pa se mesto ne oslobađa (čl. 8
 * st. 3); posle šestog se ne beleži. Živ doprinos je jedan po licu: `aktivanKljuc
 * @unique` drži „najviše jedan" i pod istovremenim odlukama, a posle poništenja ili
 * otpisa lice ga može ponovo steći (čl. 7 st. 3, 12a st. 6). Istupio član zadržava
 * živ doprinos i drugde ga ne stiče.
 */
async function zabeleziDoprinos(clanId: string): Promise<boolean> {
  const clan = await prisma.clanGazdinstva.findUnique({
    where: { id: clanId },
    select: { userId: true, gazdinstvoId: true, doprinos: { select: { id: true } } },
  });
  if (!clan || clan.doprinos) return false;
  // Do tri pokušaja: `@@unique([gazdinstvoId, redniBroj])` odbija drugi upis sa istim
  // rednim brojem pod istovremenim odobrenjima; ponovni pokušaj broji iznova. Sudar
  // na `aktivanKljuc` znači „već ima živ doprinos" — `vec` ga hvata u drugom krugu.
  for (let pokusaj = 0; pokusaj < 3; pokusaj++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const vec = await tx.doprinosGazdinstva.findFirst({ where: { aktivanKljuc: clan.userId }, select: { id: true } });
        if (vec) return false;
        const redniBroj = (await tx.doprinosGazdinstva.count({ where: { gazdinstvoId: clan.gazdinstvoId } })) + 1;
        if (redniBroj > MAX_CLANOVA_SA_DOPRINOSOM) return false;
        await tx.doprinosGazdinstva.create({
          data: {
            userId: clan.userId,
            aktivanKljuc: clan.userId,
            gazdinstvoId: clan.gazdinstvoId,
            clanId,
            redniBroj,
            iznos: iznosZaRedniBroj(redniBroj),
          },
        });
        return true;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
      throw e;
    }
  }
  return false;
}

async function javiZabelezen(userId: string, gazdinstvoId: string, naziv: string) {
  const d = await prisma.doprinosGazdinstva.findFirst({
    where: { aktivanKljuc: userId, gazdinstvoId },
    select: { iznos: true, status: true },
  });
  // Lice koje živ doprinos ima u drugom gazdinstvu ovde ga ne dobija (čl. 7 st. 3).
  if (!d || d.status !== DoprinosStatus.ZABELEZEN) return;
  const iznos = d.iznos.toLocaleString("sr-RS");
  await obavesti(userId, {
    tip: "GAZDINSTVO_ODOBRENO",
    kljuc: "notifikacije.gazdinstvo_zabelezen",
    parametri: { naziv, iznos },
    naslov: `Gazdinstvo „${naziv}“ je odobreno`,
    tekst:
      `Zabeležen ti je doprinos gazdinstva od ${iznos} POEN. Evidentira se kad imaš ` +
      `objavljen oglas kojim nešto nudiš i kad si u lancu potvrda — uveden u Kolo ili potvrđen.`,
    link: "/novcanik",
  });
}

/**
 * Sukob interesa: o gazdinstvu ne odlučuje admin koji mu je član ili je pristupio
 * (odobrenjem bi sebi zabeležio doprinos). Isto pravilo kao `smePrimitiIzZapisa`
 * kod zadruge i zabrana „predlagač = verifikator" kod operativnog doprinosa.
 */
async function zabraniSukobInteresa(adminId: string, gazdinstvoId: string) {
  const clan = await prisma.clanGazdinstva.findFirst({
    where: {
      gazdinstvoId,
      userId: adminId,
      status: { in: [ClanGazdinstvaStatus.PRISTUPIO, ClanGazdinstvaStatus.ODOBREN] },
    },
    select: { id: true },
  });
  if (clan) {
    throw new GazdinstvoGreska("Član gazdinstva ne odlučuje o njemu. Odluku donosi drugi član administratorskog tima.", 403);
  }
}

/** Pseudonimi pozvanih članova koji u trenutku odluke nisu član Kola ni osnivač (čl. 7a). */
async function nisuUKolu(clanovi: { userId: string; pseudonim: string }[]): Promise<string[]> {
  const ne: string[] = [];
  for (const c of clanovi) {
    if (!pristupanjeSmeOdobriti(await statusNaloga(c.userId))) ne.push(c.pseudonim);
  }
  return ne;
}

/**
 * Čl. 6 — Fondacija odobrava gazdinstvo; članovima se beleži doprinos po redu.
 *
 * Gazdinstvo se ne odobrava pre nego što (čl. 6 st. 5): svaki član koji je
 * pristupio ima upisano ime; izvod, kad se traži, priložen i poređenje izvršeno;
 * Fondacija obavila razgovor sa nosiocem (čl. 6a). Svaki član osim podnosioca
 * mora u tom trenutku biti član Kola ili osnivač (čl. 7a).
 *
 * Odlukom se brišu izvod i broj za razgovor (čl. 4b st. 4, 6a st. 2); ostaje samo
 * zapis da je poređenje izvršeno. 🔴 Odobrenje NE potvrđuje stvarnost (čl. 4a
 * poslednji stav).
 */
export async function odobriGazdinstvo(adminId: string, gazdinstvoId: string) {
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: {
      status: true,
      naziv: true,
      neregistrovano: true,
      razgovorObavljenAt: true,
      rpgUporedjenAt: true,
      izvodRpg: { select: { id: true } },
    },
  });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.status !== GazdinstvoStatus.NA_PREGLEDU) throw new GazdinstvoGreska("Prijava nije na pregledu.");
  await zabraniSukobInteresa(adminId, gazdinstvoId);
  const broj = await brojOglasaUzPrijavu(gazdinstvoId);
  if (broj < MIN_OGLASA_UZ_PRIJAVU) {
    throw new GazdinstvoGreska(`Prijava nema ${MIN_OGLASA_UZ_PRIJAVU} važeća oglasa (sada: ${broj}). Vrati je na dopunu.`);
  }
  const naCekanju = await prisma.clanGazdinstva.findMany({
    where: { gazdinstvoId, status: ClanGazdinstvaStatus.PRISTUPIO },
    orderBy: { pristupioAt: "asc" },
    select: { id: true, userId: true, user: { select: { pseudonim: true } } },
  });
  const bez = await bezImena(naCekanju.map((c) => c.id));
  if (bez.length > 0) {
    throw new GazdinstvoGreska(`Ime i prezime nije upisano za: ${bez.join(", ")}. Vrati prijavu na dopunu.`);
  }
  if (!g.razgovorObavljenAt) {
    throw new GazdinstvoGreska("Pre odobrenja Fondacija razgovara sa nosiocem (čl. 6a). Označi da je razgovor obavljen.");
  }
  if (await prijavaTraziIzvod(gazdinstvoId, g.neregistrovano)) {
    if (!g.izvodRpg && !g.rpgUporedjenAt) throw new GazdinstvoGreska("Izvod iz Registra nije priložen (čl. 4b).");
    if (!g.rpgUporedjenAt) throw new GazdinstvoGreska("Podaci iz prijave nisu upoređeni sa izvodom (čl. 4b st. 3).");
  }
  const podnosilac = await podnosilacGazdinstva(gazdinstvoId);
  const neUKolu = await nisuUKolu(
    naCekanju.filter((c) => c.userId !== podnosilac).map((c) => ({ userId: c.userId, pseudonim: c.user.pseudonim })),
  );
  if (neUKolu.length > 0) {
    throw new GazdinstvoGreska(
      `Pristupa samo član Kola (čl. 7a). Nisu članovi Kola: ${neUKolu.join(", ")}. Sačekaj potvrdu ili vrati prijavu na dopunu.`,
    );
  }

  const sada = new Date();
  const clanovi = await prisma.$transaction(async (tx) => {
    const promena = await tx.gazdinstvo.updateMany({
      where: { id: gazdinstvoId, status: GazdinstvoStatus.NA_PREGLEDU },
      data: {
        status: GazdinstvoStatus.ODOBRENO,
        odobrenoAt: sada,
        odobrioId: adminId,
        razlogVracanja: null,
        // Broj za razgovor se briše odlukom (čl. 6a st. 2).
        telefonZaRazgovor: null,
      },
    });
    if (promena.count !== 1) throw new GazdinstvoGreska("Prijava je u međuvremenu promenjena.");
    // Izvod se čuva samo do odluke o prijavi (čl. 4b st. 4).
    await tx.izvodRpg.deleteMany({ where: { gazdinstvoId } });
    const clanovi = await tx.clanGazdinstva.findMany({
      where: { gazdinstvoId, status: ClanGazdinstvaStatus.PRISTUPIO },
      orderBy: { pristupioAt: "asc" },
      select: { id: true, userId: true },
    });
    await tx.clanGazdinstva.updateMany({
      where: { gazdinstvoId, status: ClanGazdinstvaStatus.PRISTUPIO },
      data: { status: ClanGazdinstvaStatus.ODOBREN, odobrenAt: sada, telefon: null },
    });
    return clanovi;
  });
  // Red pristupanja (čl. 8 st. 3) — sekvencijalno, da redni broj ne zavisi od trke.
  for (const c of clanovi) await zabeleziDoprinos(c.id);

  await logAdminAkcija(adminId, "GAZDINSTVO_ODOBRENO", gazdinstvoId, g.naziv);

  for (const c of clanovi) {
    await javiZabelezen(c.userId, gazdinstvoId, g.naziv).catch((e) => console.error("[gazdinstvo] javljanje", e));
    await probajEvidentiratiGazdinstvo(c.userId);
  }
}

/**
 * Čl. 6 st. 2, 4b st. 3, 6a st. 3 — vraćanje na dopunu, uz razlog. Vraćanje je
 * odluka o prijavi: izvod i broj za razgovor se brišu (čl. 4b st. 4, 6a st. 2).
 */
export async function vratiGazdinstvo(adminId: string, gazdinstvoId: string, razlog: unknown) {
  const r = typeof razlog === "string" ? razlog.trim() : "";
  if (!r) throw new GazdinstvoGreska("Navedi šta treba dopuniti.");
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: { status: true, naziv: true, upravljaId: true },
  });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.status !== GazdinstvoStatus.NA_PREGLEDU) throw new GazdinstvoGreska("Prijava nije na pregledu.");
  await prisma.$transaction([
    prisma.gazdinstvo.update({
      where: { id: gazdinstvoId },
      data: { status: GazdinstvoStatus.VRACENO, razlogVracanja: r, telefonZaRazgovor: null },
    }),
    prisma.izvodRpg.deleteMany({ where: { gazdinstvoId } }),
  ]);
  await logAdminAkcija(adminId, "GAZDINSTVO_VRACENO", gazdinstvoId, `${g.naziv}: ${r}`);
  if (g.upravljaId) {
    await obavesti(g.upravljaId, {
      tip: "GAZDINSTVO_VRACENO",
      kljuc: "notifikacije.gazdinstvo_vraceno",
      parametri: { naziv: g.naziv, razlog: r },
      naslov: "Prijava gazdinstva vraćena na dopunu",
      tekst: `Prijava gazdinstva „${g.naziv}“ vraćena je na dopunu: ${r}`,
      link: `/gazdinstva/${gazdinstvoId}`,
    });
  }
}

/**
 * Čl. 8 st. 1 — Fondacija pregleda pristupanje posle odobrenja gazdinstva, bez
 * razgovora iz čl. 6a i bez izvoda. Pozvani mora u trenutku odobrenja biti član
 * Kola ili osnivač (čl. 7a).
 */
export async function odlukaOPristupanju(adminId: string, clanId: string, odobri: boolean, razlog?: unknown) {
  const clan = await prisma.clanGazdinstva.findUnique({
    where: { id: clanId },
    select: {
      id: true,
      userId: true,
      status: true,
      uloga: true,
      gazdinstvoId: true,
      gazdinstvo: { select: { status: true, naziv: true } },
    },
  });
  if (!clan) throw new GazdinstvoGreska("Članstvo ne postoji.", 404);
  if (clan.status !== ClanGazdinstvaStatus.PRISTUPIO || clan.gazdinstvo.status !== GazdinstvoStatus.ODOBRENO) {
    throw new GazdinstvoGreska("Pristupanje ne čeka pregled.");
  }
  await zabraniSukobInteresa(adminId, clan.gazdinstvoId);
  if (odobri && (await bezImena([clanId])).length > 0) {
    throw new GazdinstvoGreska("Član nije upisao ime i prezime; pristupanje se ne može odobriti.");
  }
  if (odobri && !pristupanjeSmeOdobriti(await statusNaloga(clan.userId))) {
    throw new GazdinstvoGreska(
      "Pristupa samo član Kola (čl. 7a). Pozvanog prvo treba da potvrdi član Kola koji ga lično zna.",
    );
  }
  if (!odobri) {
    const r = typeof razlog === "string" ? razlog.trim() : "";
    if (!r) throw new GazdinstvoGreska("Razlog je obavezan.");
    await prisma.clanGazdinstva.update({
      where: { id: clanId },
      data: { status: ClanGazdinstvaStatus.ODBIJEN, istupioAt: new Date(), telefon: null },
    });
    await logAdminAkcija(adminId, "GAZDINSTVO_PRISTUPANJE_ODBIJENO", clan.userId, `${clan.gazdinstvo.naziv}: ${r}`);
    await obavesti(clan.userId, {
      tip: "GAZDINSTVO_PRISTUPANJE_ODBIJENO",
      kljuc: "notifikacije.gazdinstvo_pristupanje_odbijeno",
      parametri: { naziv: clan.gazdinstvo.naziv, razlog: r },
      naslov: "Pristupanje gazdinstvu nije odobreno",
      tekst: `Pristupanje gazdinstvu „${clan.gazdinstvo.naziv}“ nije odobreno: ${r}`,
      link: `/gazdinstva/${clan.gazdinstvoId}`,
    });
    return;
  }
  const promena = await prisma.clanGazdinstva.updateMany({
    where: { id: clanId, status: ClanGazdinstvaStatus.PRISTUPIO },
    data: { status: ClanGazdinstvaStatus.ODOBREN, odobrenAt: new Date(), telefon: null },
  });
  if (promena.count !== 1) throw new GazdinstvoGreska("Pristupanje je u međuvremenu promenjeno.");
  if (clan.uloga === UlogaUGazdinstvu.NOSILAC) await nosilacPreuzimaIzjavu(clan.gazdinstvoId, clan.userId);
  await zabeleziDoprinos(clanId);
  await logAdminAkcija(adminId, "GAZDINSTVO_PRISTUPANJE_ODOBRENO", clan.userId, clan.gazdinstvo.naziv);
  await javiZabelezen(clan.userId, clan.gazdinstvoId, clan.gazdinstvo.naziv).catch((e) => console.error("[gazdinstvo] javljanje", e));
  await probajEvidentiratiGazdinstvo(clan.userId);
}

// ─── Evidentiranje ───────────────────────────────────────────────────────────

/**
 * Čl. 40c st. 4 i Pravilnik o gazdinstvima čl. 8 t. 1 — uslov oglasa.
 *
 * Odluka vlasnika (19.10.2026): doprinos se evidentira kada član postavi prvi oglas
 * kojim nudi, a ODMAH ako mu je doprinos za prvi oglas (čl. 40a) već evidentiran —
 * i kada tog oglasa više nema. Zato se pored postojećih oglasa (i isteklih, i
 * razmenjenih) priznaje i evidentiran `DoprinosSadrzaju`: on ostaje i posle brisanja
 * oglasa (`oglasId` SetNull), a činjenica prvog oglasa se time ne gubi.
 */
async function imaObjavljenOglas(userId: string): Promise<boolean> {
  const prvi = await prisma.doprinosSadrzaju.findUnique({ where: { userId }, select: { status: true } });
  if (prvi?.status === DoprinosStatus.EVIDENTIRAN) return true;
  const oglasi = await prisma.marketplaceListing.findMany({
    where: { sellerId: userId, tip: "PONUDA", uklonjenAt: null, status: { not: "UKLONJEN" } },
    select: { tip: true, title: true, description: true, category: true, location: true, images: true },
    take: 20,
  });
  return oglasi.some((o) => oglasIspunjavaMinimum(o).ok);
}

/**
 * Pretvara zabeležen doprinos gazdinstva u zapis POEN-a kad su oba uslova
 * ispunjena: oglas i VERIFIKACIJA u lancu potvrda (Pravilnik čl. 40c st. 4; gazd.
 * čl. 8 st. 2 t. 2). Zove se pri odobrenju, pri objavi i izmeni oglasa, pri
 * verifikaciji (posledice promene statusa) i iz crona `potvrde-uslov`.
 *
 * MORA se zvati VAN `prisma.$transaction()` — `emitujPoen()` otvara sopstvenu.
 * Ne baca.
 */
export async function probajEvidentiratiGazdinstvo(userId: string): Promise<boolean> {
  try {
    const d = await prisma.doprinosGazdinstva.findFirst({
      where: { userId, status: DoprinosStatus.ZABELEZEN, aktivanKljuc: { not: null } },
      select: { id: true, iznos: true, gazdinstvo: { select: { status: true, naziv: true } } },
    });
    // 🔴 Ne „samo ODOBRENO": član koji istupi zadržava zabeležen doprinos i kad
    // gazdinstvo kasnije prestane (čl. 9 st. 3). Doprinos koji prestanak pogađa je
    // već PONISTEN; poništeno gazdinstvo je dodatna brana.
    if (!d || d.gazdinstvo.status === GazdinstvoStatus.PONISTENO) return false;

    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { maloletan: true, status: true, deaktiviranAt: true, wallet: { select: { id: true } } },
    });
    if (!u?.wallet) return false;
    const imaOglas = await imaObjavljenOglas(userId);
    const status = await ucitajStatus(userId);
    if (
      !smeSeEvidentirati({
        verifikovan: status !== null && jeVerifikovan(status),
        imaOglas,
        maloletan: u.maloletan,
        aktivan: u.status === "ACTIVE" && u.deaktiviranAt === null,
      })
    ) {
      return false;
    }

    // Rezerviši prelaz pre emisije — dva okidača u istoj sekundi evidentiraju jednom.
    const rez = await prisma.doprinosGazdinstva.updateMany({
      where: { id: d.id, status: DoprinosStatus.ZABELEZEN },
      data: { status: DoprinosStatus.EVIDENTIRAN, evidentiranAt: new Date() },
    });
    if (rez.count !== 1) return false;

    let transakcijaId: string;
    try {
      const { transaction } = await emitujPoen(
        u.wallet.id,
        d.iznos,
        TransactionType.EMISIJA_GAZDINSTVO,
        "Doprinos gazdinstva",
        { kljuc: "transakcije.doprinos_gazdinstva", parametri: { naziv: d.gazdinstvo.naziv } },
      );
      transakcijaId = transaction.id;
    } catch (e) {
      await prisma.doprinosGazdinstva.updateMany({
        where: { id: d.id, status: DoprinosStatus.EVIDENTIRAN },
        data: { status: DoprinosStatus.ZABELEZEN, evidentiranAt: null },
      });
      console.error("[gazdinstvo] emisija pukla, doprinos vraćen u ZABELEZEN", { userId, e });
      return false;
    }

    await prisma.doprinosGazdinstva.update({ where: { id: d.id }, data: { transakcijaId } });
    await logAdminAkcija(userId, "DOPRINOS_GAZDINSTVA_EVIDENTIRAN", userId, `${d.iznos} POEN`);

    try {
      const iznos = d.iznos.toLocaleString("sr-RS");
      await obavesti(userId, {
        tip: "doprinos_gazdinstva",
        kljuc: "notifikacije.gazdinstvo_evidentiran",
        parametri: { iznos },
        naslov: `Evidentiran ti je doprinos gazdinstva od ${iznos} POEN`,
        tekst: `Doprinos gazdinstva — ${iznos} POEN — evidentiran je u tvom zapisu (Pravilnik čl. 40c).`,
        link: "/novcanik",
      });
      await prisma.doprinosGazdinstva.update({ where: { id: d.id }, data: { obavestenAt: new Date() } });
    } catch (e) {
      console.error("[gazdinstvo] obaveštenje nije poslato", { userId, e });
    }
    return true;
  } catch (e) {
    console.error("[gazdinstvo] evidentiranje nije uspelo", { userId, e });
    return false;
  }
}

/** Zabeležen doprinos za prikaz na ekranu POEN (zaseban red, nikad u zbiru stanja). */
export async function dohvatiZabelezenGazdinstva(userId: string) {
  return prisma.doprinosGazdinstva.findFirst({
    where: { userId, status: DoprinosStatus.ZABELEZEN, aktivanKljuc: { not: null }, gazdinstvo: { status: { not: GazdinstvoStatus.PONISTENO } } },
    select: { iznos: true, gazdinstvo: { select: { id: true, naziv: true } } },
  });
}

// ─── Lažna izjava ────────────────────────────────────────────────────────────

/**
 * Čl. 12 — poništenje odobrenja zbog lažne izjave: prestanak po t. 3 čl. 12a
 * (`prestanakGazdinstva(…, "LAZNA_IZJAVA")`) — poništenje i otpis pogađaju sve
 * članove iz perioda izjave, i ranije istupele (čl. 12 st. 2).
 *
 * 🔴 Isključenje NIJE kolektivno (set 4.8.4, registar 2026-10 U5; čl. 12 st. 3):
 * izriče se samo licima koja superadmin označi — onome ko je dao lažnu izjavu, članu
 * čija je izjava o pristupanju lažna i onome ko je za laž znao. Ostalima se samo
 * otpisuje doprinos gazdinstva, bez isključenja, i mogu ga ponovo steći (čl. 12a).
 * Samo superadmin (isključenje je superadminska odluka).
 */
export async function ponistiZbogLazneIzjave(adminId: string, gazdinstvoId: string, razlog: unknown, iskljuci: unknown = []) {
  const r = typeof razlog === "string" ? razlog.trim() : "";
  if (!r) throw new GazdinstvoGreska("Razlog je obavezan.");
  const g = await prisma.gazdinstvo.findUnique({
    where: { id: gazdinstvoId },
    select: { status: true, naziv: true },
  });
  if (!g) throw new GazdinstvoGreska("Gazdinstvo ne postoji.", 404);
  if (g.status !== GazdinstvoStatus.ODOBRENO) throw new GazdinstvoGreska("Poništava se samo odobreno gazdinstvo.");

  // Za isključenje se sme označiti samo lice koje poništenje pogađa.
  const kandidati = clanoviZaOtpis(
    "LAZNA_IZJAVA",
    await prisma.clanGazdinstva.findMany({ where: { gazdinstvoId, izjavaAt: { not: null } }, select: { userId: true, status: true } }),
  );
  const oznaceni = Array.isArray(iskljuci) ? [...new Set(iskljuci.filter((x): x is string => typeof x === "string"))] : [];
  if (oznaceni.some((id) => !kandidati.includes(id))) {
    throw new GazdinstvoGreska("Isključenje se izriče samo licu koje je bilo član gazdinstva u periodu izjave.");
  }

  const { otpisano } = await prestanakGazdinstva(gazdinstvoId, "LAZNA_IZJAVA", { izvrsilacId: adminId, razlog: r });

  for (const userId of oznaceni) {
    await iskljuciKorisnika(adminId, userId, `Lažna izjava o gazdinstvu (Pravilnik o gazdinstvima čl. 12): ${r}`);
  }
  await logAdminAkcija(adminId, "GAZDINSTVO_PONISTENO", gazdinstvoId, `${g.naziv}: ${r}`);
  return { otpisano, iskljuceno: oznaceni.length };
}

// ─── Prikaz ──────────────────────────────────────────────────────────────────

/**
 * Prisma `select` uz oglas, dovoljan za `jeDomace()`. Jedan izvor za svaki prikaz
 * oglasa (Pijaca, detalj, profil gazdinstva) — oznaka se izvodi, ne čuva.
 */
export const GAZDINSTVO_ZA_OZNAKU = {
  select: {
    id: true,
    status: true,
    clanovi: { where: { status: ClanGazdinstvaStatus.ODOBREN }, select: { userId: true } },
  },
} as const;

/**
 * Tačke za javnu mapu (čl. 11) — samo odobrena gazdinstva, bez BPG-a. 🔴 Adresa ide
 * SAMO uz datu izjavu (čl. 4 t. 3); gazdinstvu odobrenom ranije bez izjave adresa
 * se ne ispisuje. Oglasi odobrenog gazdinstva nose oznaku DOMAĆE (`jeDomace`).
 */
export async function gazdinstvaZaMapu() {
  const lista = await prisma.gazdinstvo.findMany({
    where: { status: GazdinstvoStatus.ODOBRENO, lat: { not: null }, lng: { not: null } },
    orderBy: { odobrenoAt: "desc" },
    select: {
      id: true,
      naziv: true,
      naselje: true,
      opis: true,
      lat: true,
      lng: true,
      adresa: true,
      izjavaAdresaAt: true,
      _count: { select: { oglasi: { where: { status: "ACTIVE", tip: "PONUDA", uklonjenAt: null } } } },
    },
  });
  return lista.map((g) => ({
    id: g.id,
    naziv: g.naziv,
    naselje: g.naselje,
    opis: g.opis.length > 160 ? g.opis.slice(0, 157) + "…" : g.opis,
    lat: g.lat as number,
    lng: g.lng as number,
    adresa: adresaZaMapu(g.adresa, g.izjavaAdresaAt),
    brojOglasa: g._count.oglasi,
  }));
}

/** Adresa uz tačku samo uz izjavu (gazdinstva čl. 4 t. 3 i čl. 11). */
export function adresaZaMapu(adresa: string | null, izjavaAdresaAt: Date | null): string | null {
  return izjavaAdresaAt && adresa ? adresa : null;
}
