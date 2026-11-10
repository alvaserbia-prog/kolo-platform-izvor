/**
 * Program raspodele hrane i lanac proizvodnje i distribucije — servis (Prisma). JEDAN MOTOR.
 *
 * Osnov: Pravilnik o projektima i kolektivnim nabavkama Glava X (čl. 38–47) i Glava XI
 * (čl. 48–52); Pravilnik o pokroviteljstvu i donacijama čl. 22 st. 4–8 i Glava VI; Pravilnik o
 * KOLO sistemu čl. 17 st. 2 t. 9, čl. 18, čl. 37 st. 4, čl. 39 st. 5.
 *
 * Program (Glava X) = lanac sa dve karike:
 *   javni poziv → prijave gazdinstava (RPG) i objekata → Fondacija prihvata → partija (za
 *   gazdinstvo se predlaže najbliži objekat) → ugovori (snimljen tekst) → objekat beleži zapisnik
 *   (masa sa vage, oznake životinja, obim usluge) → nosilac potvrđuje predaju → Protokol ODMAH
 *   evidentira doprinos gazdinstva (čl. 41) → vaučeri izdati (čl. 43 st. 1) → korisnici uzimaju
 *   (poništenje, `PONISTENJE_VAUCER_LANAC`) → objekat označi spremno (obaveštenje, rok 15 dana)
 *   → Fondacija utvrdi izvršenje usluge → Protokol evidentira doprinos objekta (čl. 42 st. 3) →
 *   objekat potvrđuje preuzimanje kodom → istek bez ispravke → po isteku roka objekat preuzima
 *   delove bez uzetog vaučera uz otpis po DEVETOM osnovu (čl. 46) → ostatak Fondacija predaje.
 *
 * Lanac (Glava XI):
 *   superadmin upisuje odluku UO (Faza 1), odnosno Gornjeg Kola (Faza 2) — zapis se ne menja →
 *   partneri prihvataju ugovore, beleže predaje (prima beleži, predaje potvrđuje), Fondacija
 *   potvrđuje svaku kariku → doprinos se BELEŽI (sirovina pri predaji, usluga po utvrđenom
 *   izvršenju, dodatak po utvrđenom izdavanju) → Protokol ga evidentira u NAREDNOM obračunskom
 *   periodu (noćni obračun, `evidentirajZabelezenoLanac`) → posle evidentiranja sirovine vaučeri
 *   → nepreuzeto Fondacija predaje kroz program podrške ili ustanovi, BEZ otpisa.
 *
 * 🔴 `emitujPoen()` otvara sopstvenu transakciju i zove se VAN `$transaction` (pravilo 8).
 * 🔴 Sopstveni tipovi transakcija, nikad `TRANSFER` (pravilo 5).
 * 🔴 Par +X/−X (poništenje, ispravka, otpis) ide ceo u istoj transakciji, uz proveru da se
 *    razlika „stanje − istorija" korisničkog zapisa ne pomeri (obrazac `potvrde-parovi.ts`).
 * 🔴 Uz broj POEN-a po vaučeru nikad dinarska vrednost; dinari samo u izveštaju (čl. 47).
 */
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { TransactionType, Prisma as PrismaVrednosti } from "@/generated/prisma/client";
import { emitujPoen } from "./emisija";
import { raspolozivo } from "./nadoknada";
import { ograniceno } from "./ogranicenje-primljenog";
import { imeNaloga } from "./identitet";
import { dohvatiFazuStatus } from "./faza-sistema";
import { cenaStipsZa } from "./stips";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { razresiNaselje } from "@/lib/naselje";
import { gdePseudonim } from "@/lib/pseudonim";
import type { Kategorija, VrstaHrane, OdgovoriHrane } from "@/lib/hrana-pravila";
import { procitajOdgovoreHrane, koeficijentIzOdgovora } from "@/lib/hrana-pravila";
import {
  generisiUgovorDonacijeTekst,
  generisiUgovorUslugeTekst,
  objektiPoUdaljenosti,
  organZaFazu,
  partijaZaZamenu,
  planLanca,
  planProgramaHrane,
  poenaPoVauceruIzDoprinosa,
  procitajOdlukuLanca,
  procitajPartiju,
  procitajPoziv,
  procitajPrijavuGazdinstva,
  procitajPrijavuObjekta,
  procitajZapisnik,
  rasporediOtpis,
  rokZaNepreuzeteIstekao,
  smeUzetiVaucerLanca,
  stanjeVauceraLanca,
  uzimanjeOtvoreno,
  vaucerIstekao,
  vrednostPredatog,
  vrednostRobe,
  vrednostUsluge,
  doprinosSirovine,
  doprinosUslugeObjekta,
  doprinosUslugePartnera,
  dodatakZaIzdato,
  otpisNepreuzetihDelova,
  normalizujKod,
  rokPreuzimanja,
  KOEFICIJENT_PARTNERA,
  type StanjeVauceraLanca,
  type UlogaKarike,
} from "@/lib/lanac-pravila";

export * from "@/lib/lanac-pravila";

const PROTOKOL_WALLET_ID = "banka-singleton";

export class LanacGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

export async function odgovorNaGreskuLanca(e: unknown) {
  const { greska } = await import("@/lib/greska-api");
  if (e instanceof LanacGreska) return greska(e.message, e.status);
  console.error("[lanac]", e);
  return greska(e instanceof Error ? e.message : "Greška.", 500);
}

type Tx = Prisma.TransactionClient;

// ─── Pomoćno ─────────────────────────────────────────────────────────────────

const ABECEDA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function noviKod(): string {
  const b = randomBytes(10);
  let s = "";
  for (let i = 0; i < 10; i++) s += ABECEDA[b[i] % ABECEDA.length];
  return s;
}

/** Zbir zapisa po novčaniku (ulaz − izlaz) naspram stanja (obrazac `potvrde-parovi.ts`). */
async function razlikaStanjaIIstorije(tx: Tx, walletId: string): Promise<number> {
  const [w, ulaz, izlaz] = await Promise.all([
    tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
    tx.transaction.aggregate({ where: { toWalletId: walletId }, _sum: { amount: true } }),
    tx.transaction.aggregate({ where: { fromWalletId: walletId }, _sum: { amount: true } }),
  ]);
  return w.balance - ((ulaz._sum.amount ?? 0) - (izlaz._sum.amount ?? 0));
}

/**
 * Par (stanje ±X, zapis X) u postojećoj transakciji. Razlika „stanje − istorija" korisničkog
 * zapisa ne sme da se pomeri — inače se cela radnja poništava.
 */
async function upisiParLanca(
  tx: Tx,
  p: {
    fromWalletId: string;
    toWalletId: string;
    iznos: number;
    type: TransactionType;
    description: string | null;
    opisKljuc: string | null;
    opisParametri?: Record<string, string | number>;
  },
): Promise<string> {
  const korisnicki = [p.fromWalletId, p.toWalletId].filter((id) => id !== PROTOKOL_WALLET_ID);
  const pre = await Promise.all(korisnicki.map((id) => razlikaStanjaIIstorije(tx, id)));
  await tx.wallet.update({ where: { id: p.fromWalletId }, data: { balance: { decrement: p.iznos } } });
  await tx.wallet.update({ where: { id: p.toWalletId }, data: { balance: { increment: p.iznos } } });
  const t = await tx.transaction.create({
    data: {
      fromWalletId: p.fromWalletId,
      toWalletId: p.toWalletId,
      amount: p.iznos,
      type: p.type,
      description: p.description,
      opisKljuc: p.opisKljuc,
      opisParametri: p.opisParametri,
    },
  });
  const posle = await Promise.all(korisnicki.map((id) => razlikaStanjaIIstorije(tx, id)));
  if (posle.some((v, i) => v !== pre[i])) throw new LanacGreska("Stanje zapisa se ne slaže sa istorijom — radnja je poništena.", 500);
  return t.id;
}

/** Zapis u kome se evidentira doprinos karike: zapis zadruge (Pravilnik čl. 37 st. 4) ili korisnika. */
async function walletKarike(k: { userId: string; zadrugaId: string | null }): Promise<string | null> {
  const w = k.zadrugaId
    ? await prisma.wallet.findUnique({ where: { krugId: k.zadrugaId }, select: { id: true } })
    : await prisma.wallet.findUnique({ where: { userId: k.userId }, select: { id: true } });
  return w?.id ?? null;
}

async function punoletanAktivan(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, maloletan: true, status: true, deaktiviranAt: true, pseudonim: true },
  });
  if (!u || u.maloletan || u.status !== "ACTIVE" || u.deaktiviranAt) return null;
  return u;
}

async function obavestiTiho(userId: string, o: Parameters<typeof obavesti>[1]) {
  try {
    await obavesti(userId, o);
  } catch (e) {
    console.error("[lanac] obaveštenje nije poslato", userId, o.kljuc, e);
  }
}

const dec = (v: unknown): number => (v == null ? 0 : Number(v));

// ─── Javni poziv (čl. 39) ────────────────────────────────────────────────────

export async function objaviPoziv(adminId: string, body: Record<string, unknown>) {
  const r = procitajPoziv(body);
  if (!r.ok) throw new LanacGreska(r.razlog);
  const p = await prisma.lanacPoziv.create({ data: { ...r.poziv, objavioId: adminId } });
  await logAdminAkcija(adminId, "LANAC_POZIV_OBJAVLJEN", p.id, r.poziv.naziv);
  return p;
}

export async function zatvoriPoziv(adminId: string, id: string) {
  const r = await prisma.lanacPoziv.updateMany({ where: { id, zatvorenAt: null }, data: { zatvorenAt: new Date() } });
  if (r.count !== 1) throw new LanacGreska("Poziv nije pronađen ili je već zatvoren.", 404);
  await logAdminAkcija(adminId, "LANAC_POZIV_ZATVOREN", id);
}

/**
 * Prijava gazdinstva, odnosno objekta na poziv (čl. 39 st. 2). Prijavljuje punoletni korisnik sa
 * aktivnim nalogom — nosilac gazdinstva upisanog u RPG, odnosno lice koje deluje u ime objekta
 * (Uslovi čl. 14 st. 4). Jedna živa prijava po ulozi i pozivu. Izjava se snima sa tekstom.
 */
export async function prijaviNaPoziv(
  userId: string,
  pozivId: string,
  uloga: "GAZDINSTVO" | "OBJEKAT",
  body: Record<string, unknown>,
  izjavaTekst: string,
) {
  const u = await punoletanAktivan(userId);
  if (!u) throw new LanacGreska("Prijavu podnosi punoletni korisnik sa aktivnim nalogom.", 403);
  const poziv = await prisma.lanacPoziv.findUnique({ where: { id: pozivId }, select: { zatvorenAt: true } });
  if (!poziv || poziv.zatvorenAt) throw new LanacGreska("Poziv nije otvoren.", 404);
  const mesto = razresiNaselje(body.mesto);
  if (!mesto) throw new LanacGreska("Izaberi mesto iz spiska naselja.");
  const postoji = await prisma.lanacPrijava.findFirst({
    where: { pozivId, userId, uloga, status: { in: ["NA_PREGLEDU", "PRIHVACENA"] } },
    select: { id: true },
  });
  if (postoji) throw new LanacGreska("Već imaš prijavu na ovaj poziv.", 409);
  const sada = new Date();
  if (uloga === "GAZDINSTVO") {
    const r = procitajPrijavuGazdinstva(body);
    if (!r.ok) throw new LanacGreska(r.razlog);
    const p = r.prijava;
    return prisma.lanacPrijava.create({
      data: {
        pozivId, uloga, userId, naziv: p.naziv, mesto, adresa: p.adresa, bpg: p.bpg,
        hranaOdgovori: p.odgovori as unknown as Prisma.InputJsonValue, hranaKategorija: p.kategorija, hranaKoeficijent: p.koeficijent,
        cenovnikCena: p.cenovnikCena, cenovnikUrl: p.cenovnikUrl, izjavaAt: sada, izjavaTekst,
      },
    });
  }
  const r = procitajPrijavuObjekta(body);
  if (!r.ok) throw new LanacGreska(r.razlog);
  const p = r.prijava;
  return prisma.lanacPrijava.create({
    data: {
      pozivId, uloga, userId, naziv: p.naziv, mesto, adresa: p.adresa, brojOdobrenja: p.brojOdobrenja,
      uslugaOpis: p.uslugaOpis, uslugaJedinica: p.uslugaJedinica, uslugaCena: p.uslugaCena, cenovnikUrl: p.cenovnikUrl,
      izjavaAt: sada, izjavaTekst,
    },
  });
}

export async function povuciPrijavu(userId: string, id: string) {
  const r = await prisma.lanacPrijava.updateMany({ where: { id, userId, status: "NA_PREGLEDU" }, data: { status: "POVUCENA" } });
  if (r.count !== 1) throw new LanacGreska("Prijava se ne može povući.", 409);
}

/**
 * Fondacija prihvata, odnosno odbija prijavu (čl. 39 st. 2: ulazi svako ko ispunjava uslove).
 * Za objekat koji je zadruga Fondacija upisuje zadrugu (doprinos u zapis zadruge, Pravilnik
 * čl. 37 st. 4). Odbijanje je obrazloženo.
 */
export async function odluciOPrijavi(
  adminId: string,
  id: string,
  p: { prihvati: boolean; razlog?: string; zadrugaId?: string | null },
) {
  const pr = await prisma.lanacPrijava.findUnique({ where: { id }, select: { status: true, userId: true, uloga: true, naziv: true } });
  if (!pr || pr.status !== "NA_PREGLEDU") throw new LanacGreska("Prijava nije na pregledu.", 409);
  if (pr.userId === adminId) throw new LanacGreska("O sopstvenoj prijavi ne odlučuješ.", 403);
  const razlog = (p.razlog ?? "").trim();
  if (!p.prihvati && razlog.length < 5) throw new LanacGreska("Odbijanje mora biti obrazloženo.");
  let zadrugaId: string | null = null;
  if (p.prihvati && p.zadrugaId && pr.uloga === "OBJEKAT") {
    const z = await prisma.krug.findFirst({ where: { id: p.zadrugaId, zadruga: true }, select: { id: true } });
    if (!z) throw new LanacGreska("Zadruga nije pronađena.", 404);
    zadrugaId = z.id;
  }
  await prisma.lanacPrijava.update({
    where: { id },
    data: {
      status: p.prihvati ? "PRIHVACENA" : "ODBIJENA", odlucioId: adminId, odlukaAt: new Date(),
      razlogOdbijanja: p.prihvati ? null : razlog, zadrugaId,
    },
  });
  await logAdminAkcija(adminId, p.prihvati ? "LANAC_PRIJAVA_PRIHVACENA" : "LANAC_PRIJAVA_ODBIJENA", id, p.prihvati ? undefined : razlog);
  await obavestiTiho(pr.userId, {
    tip: "lanac",
    kljuc: p.prihvati ? "notifikacije.lanac_prijava_prihvacena" : "notifikacije.lanac_prijava_odbijena",
    parametri: { naziv: pr.naziv, razlog },
    naslov: p.prihvati ? "Prijava na poziv je prihvaćena" : "Prijava na poziv je odbijena",
    tekst: p.prihvati
      ? `Prijava „${pr.naziv}" na poziv programa raspodele hrane je prihvaćena.`
      : `Prijava „${pr.naziv}" na poziv programa raspodele hrane je odbijena. Obrazloženje: ${razlog}`,
    link: "/vauceri/program",
  });
}

/** Čl. 39 st. 3: predlog objekata za partiju gazdinstva, od najbližeg. */
export async function predloziObjekte(gazdinstvoPrijavaId: string) {
  const g = await prisma.lanacPrijava.findUnique({ where: { id: gazdinstvoPrijavaId }, select: { pozivId: true, mesto: true, uloga: true } });
  if (!g || g.uloga !== "GAZDINSTVO") throw new LanacGreska("Prijava gazdinstva nije pronađena.", 404);
  const objekti = await prisma.lanacPrijava.findMany({
    where: { pozivId: g.pozivId, uloga: "OBJEKAT", status: "PRIHVACENA" },
    select: { id: true, naziv: true, mesto: true, adresa: true, uslugaOpis: true },
  });
  return objektiPoUdaljenosti(g.mesto, objekti);
}

// ─── Partija programa (čl. 40, 42, 43) ───────────────────────────────────────

/**
 * Fondacija otvara partiju: gazdinstvo i objekat iz prihvaćenih prijava, opis, broj vaučera na
 * jednake količine i STIPS kategorija. Platforma generiše i snima ugovor o donaciji (čl. 40) i
 * ugovor o usluzi objekta (čl. 42); Fondacija pri zaključenju utvrđuje poreklo (donacije čl. 22
 * st. 5) — koeficijent hrane se snima uz partiju i obe karike.
 */
export async function otvoriPartiju(
  adminId: string,
  body: Record<string, unknown> & { gazdinstvoPrijavaId?: unknown; objekatPrijavaId?: unknown },
) {
  const r = procitajPartiju(body);
  if (!r.ok) throw new LanacGreska(r.razlog);
  const [g, o] = await Promise.all([
    prisma.lanacPrijava.findUnique({ where: { id: String(body.gazdinstvoPrijavaId ?? "") } }),
    prisma.lanacPrijava.findUnique({ where: { id: String(body.objekatPrijavaId ?? "") } }),
  ]);
  if (!g || g.uloga !== "GAZDINSTVO" || g.status !== "PRIHVACENA") throw new LanacGreska("Izaberi prihvaćenu prijavu gazdinstva.");
  if (!o || o.uloga !== "OBJEKAT" || o.status !== "PRIHVACENA" || o.pozivId !== g.pozivId)
    throw new LanacGreska("Izaberi prihvaćenu prijavu objekta sa istog poziva.");
  if (g.userId === adminId || o.userId === adminId) throw new LanacGreska("Ne otvaraš partiju u kojoj učestvuješ.", 403);
  if (g.hranaKoeficijent == null || !g.hranaOdgovori) throw new LanacGreska("Prijava gazdinstva nema podatke o proizvodnji.", 409);
  const odgovori = g.hranaOdgovori as unknown as OdgovoriHrane;
  const koef = Number(g.hranaKoeficijent);
  const sada = new Date();
  const imeNosioca = (await imeNaloga(g.userId)) ?? (await prisma.user.findUnique({ where: { id: g.userId }, select: { pseudonim: true } }))?.pseudonim ?? "";
  const imeZastupnika = (await imeNaloga(o.userId)) ?? (await prisma.user.findUnique({ where: { id: o.userId }, select: { pseudonim: true } }))?.pseudonim ?? "";
  const mestoObjekta = o.adresa ? `${o.mesto}, ${o.adresa}` : o.mesto;
  const ugovorDonacije = generisiUgovorDonacijeTekst({
    vrsta: "PROGRAM_HRANE", datum: sada, davalac: g.naziv, bpg: g.bpg, nosilac: imeNosioca, roba: r.partija.naziv,
    hrana: { vrsta: odgovori.vrsta as VrstaHrane, kategorija: g.hranaKategorija as Kategorija }, mestoPredaje: mestoObjekta,
    objekat: o.naziv, stipsKategorija: r.partija.stipsKategorija,
  });
  const ugovorUsluge = generisiUgovorUslugeTekst({
    vrsta: "PROGRAM_HRANE", datum: sada, partner: o.naziv, zastupnik: imeZastupnika, roba: r.partija.naziv,
    uslugaOpis: o.uslugaOpis ?? "", jedinica: o.uslugaJedinica ?? "", cenaPoJedinici: dec(o.uslugaCena), obim: null,
    mestoPredaje: mestoObjekta, izdajeKorisnicima: true, dodatakPct: null,
  });
  const lanac = await prisma.$transaction(async (tx) => {
    const l = await tx.lanac.create({
      data: {
        vrsta: "PROGRAM_HRANE", pozivId: g.pozivId, naziv: r.partija.naziv, vrstaHrane: odgovori.vrsta,
        stipsKategorija: r.partija.stipsKategorija, jedinica: r.partija.jedinica, brojVaucera: r.partija.brojVaucera,
        kolicinaPoVauceru: r.partija.kolicinaPoVauceru, koeficijentSirovine: koef, objavljenAt: sada, kreiraoId: adminId,
      },
    });
    await tx.lanacKarika.createMany({
      data: [
        {
          lanacId: l.id, redniBroj: 1, uloga: "DAVALAC_SIROVINE", prijavaId: g.id, userId: g.userId, naziv: g.naziv,
          mestoPredaje: o.mesto, adresaPredaje: o.adresa, cenaPoJedinici: g.cenovnikCena, koeficijent: koef, ugovorTekst: ugovorDonacije,
        },
        {
          lanacId: l.id, redniBroj: 2, uloga: "POSLEDNJI", prijavaId: o.id, userId: o.userId, zadrugaId: o.zadrugaId, naziv: o.naziv,
          mestoPredaje: o.mesto, adresaPredaje: o.adresa, uslugaOpis: o.uslugaOpis, jedinica: o.uslugaJedinica,
          cenaPoJedinici: o.uslugaCena, koeficijent: koef, izdajeKorisnicima: true, ugovorTekst: ugovorUsluge,
        },
      ],
    });
    return l;
  });
  await logAdminAkcija(adminId, "LANAC_PARTIJA_OTVORENA", lanac.id, r.partija.naziv);
  for (const uid of [g.userId, o.userId]) {
    await obavestiTiho(uid, {
      tip: "lanac",
      kljuc: "notifikacije.lanac_ugovor_ceka",
      parametri: { naziv: r.partija.naziv },
      naslov: "Ugovor čeka tvoju potvrdu",
      tekst: `Fondacija je otvorila partiju „${r.partija.naziv}". Pročitaj ugovor i potvrdi ga na platformi.`,
      link: "/vauceri/program",
    });
  }
  return lanac;
}

// ─── Odluka o lancu (čl. 48–49) — samo superadmin, upis operative ───────────

/**
 * Upis odluke o lancu koju je doneo UO (Faza 1), odnosno Gornje Kolo (Faza 2): organ mora
 * odgovarati tekućoj fazi. Zapis odluke (organ, broj, datum, tekst) snima se jednom i posle se
 * ne menja; objavljuje se upisom, pre nego što počne da se primenjuje (čl. 48 st. 2).
 * Za hranu se koeficijent sirovine izvodi iz podataka o proizvodnji davaoca (donacije čl. 22).
 */
export async function upisiOdlukuLanca(adminId: string, body: Record<string, unknown>) {
  const sada = new Date();
  let koeficijentHrane: number | null = null;
  let hrana: { vrsta: VrstaHrane; kategorija: Kategorija } | null = null;
  if (body.hranaOdgovori && typeof body.hranaOdgovori === "object") {
    const o = procitajOdgovoreHrane(body.hranaOdgovori as Record<string, unknown>);
    if (!o.ok) throw new LanacGreska(o.razlog);
    const k = koeficijentIzOdgovora(o.odgovori);
    koeficijentHrane = k.koeficijent;
    hrana = { vrsta: o.odgovori.vrsta, kategorija: k.kategorija };
  }
  const r = procitajOdlukuLanca(body, { sada, koeficijentHrane });
  if (!r.ok) throw new LanacGreska(r.razlog);
  const od = r.odluka;
  const faza = await dohvatiFazuStatus();
  if (od.organ !== organZaFazu(faza.faza))
    throw new LanacGreska(faza.faza === "FAZA_2" ? "U Fazi 2 odluku o lancu donosi Gornje Kolo." : "U Fazi 1 odluku o lancu donosi Upravni odbor.");

  // Pseudonim → nalog: punoletni korisnik sa aktivnim nalogom, u čijem zapisu se evidentira doprinos.
  const korisnici: { id: string; pseudonim: string }[] = [];
  for (const k of od.karike) {
    const u = await prisma.user.findFirst({ where: gdePseudonim(k.pseudonim), select: { id: true } });
    const ok = u ? await punoletanAktivan(u.id) : null;
    if (!ok) throw new LanacGreska(`Korisnik „${k.pseudonim}" nije pronađen ili nema aktivan punoletan nalog.`, 404);
    if (ok.id === adminId) throw new LanacGreska("Ne upisuješ lanac u kome učestvuješ.", 403);
    korisnici.push({ id: ok.id, pseudonim: ok.pseudonim });
  }
  const tekstovi = await Promise.all(
    od.karike.map(async (k, i) => {
      const ime = (await imeNaloga(korisnici[i].id)) ?? korisnici[i].pseudonim;
      const sledeci = od.karike[i + 1];
      if (k.uloga === "DAVALAC_SIROVINE")
        return generisiUgovorDonacijeTekst({
          vrsta: "LANAC", datum: sada, davalac: k.naziv, bpg: null, nosilac: ime, roba: od.naziv, hrana,
          mestoPredaje: sledeci?.mestoPredaje ?? k.mestoPredaje, objekat: sledeci?.naziv ?? "", stipsKategorija: od.stipsKategorija,
        });
      return generisiUgovorUslugeTekst({
        vrsta: "LANAC", datum: sada, partner: k.naziv, zastupnik: ime, roba: od.naziv, uslugaOpis: k.uslugaOpis ?? "",
        jedinica: k.jedinica ?? "", cenaPoJedinici: k.cenaPoJedinici ?? 0, obim: k.obim,
        mestoPredaje: k.adresaPredaje ? `${k.mestoPredaje}, ${k.adresaPredaje}` : k.mestoPredaje,
        izdajeKorisnicima: k.uloga === "POSLEDNJI", dodatakPct: od.dodatakPct,
      });
    }),
  );
  const lanac = await prisma.$transaction(async (tx) => {
    const l = await tx.lanac.create({
      data: {
        vrsta: "LANAC", naziv: od.naziv, vrstaHrane: od.vrstaHrane, stipsKategorija: od.stipsKategorija, jedinica: od.jedinica,
        brojVaucera: od.brojVaucera, kolicinaPoVauceru: od.kolicinaPoVauceru, koeficijentSirovine: od.koeficijentSirovine,
        dodatakDistribucijePct: od.dodatakPct, odlukaOrgan: od.organ, odlukaBroj: od.broj, odlukaDatum: od.datum,
        odlukaTekst: od.tekst, odlukaUpisaoId: adminId, odlukaUpisanaAt: sada, objavljenAt: sada, kreiraoId: adminId,
      },
    });
    await tx.lanacKarika.createMany({
      data: od.karike.map((k, i) => ({
        lanacId: l.id, redniBroj: i + 1, uloga: k.uloga, userId: korisnici[i].id, naziv: k.naziv, mestoPredaje: k.mestoPredaje,
        adresaPredaje: k.adresaPredaje, uslugaOpis: k.uslugaOpis, jedinica: k.jedinica, cenaPoJedinici: k.cenaPoJedinici, obim: k.obim,
        koeficijent: k.uloga === "DAVALAC_SIROVINE" ? (od.koeficijentSirovine ?? 1) : KOEFICIJENT_PARTNERA,
        izdajeKorisnicima: k.uloga === "POSLEDNJI", ugovorTekst: tekstovi[i],
      })),
    });
    return l;
  });
  await logAdminAkcija(adminId, "LANAC_ODLUKA_UPISANA", lanac.id, `${od.organ} br. ${od.broj} od ${od.datum.toISOString().slice(0, 10)}`);
  for (const k of korisnici) {
    await obavestiTiho(k.id, {
      tip: "lanac",
      kljuc: "notifikacije.lanac_ugovor_ceka",
      parametri: { naziv: od.naziv },
      naslov: "Ugovor čeka tvoju potvrdu",
      tekst: `Fondacija je objavila lanac „${od.naziv}". Pročitaj ugovor i potvrdi ga na platformi.`,
      link: "/vauceri/program",
    });
  }
  return lanac;
}

// ─── Karika: ugovor, predaja, izvršenje ──────────────────────────────────────

export async function prihvatiUgovor(userId: string, karikaId: string) {
  const r = await prisma.lanacKarika.updateMany({
    where: { id: karikaId, userId, ugovorPrihvacenAt: null, ugovorTekst: { not: null }, lanac: { status: "PRIPREMA" } },
    data: { ugovorPrihvacenAt: new Date() },
  });
  if (r.count !== 1) throw new LanacGreska("Ugovor se ne može potvrditi.", 409);
}

async function karikeLanca(lanacId: string) {
  return prisma.lanacKarika.findMany({ where: { lanacId }, orderBy: { redniBroj: "asc" } });
}

/**
 * Zapisnik o primopredaji (čl. 40 st. 2, čl. 50 st. 2): beleži ga karika koja robu PRIMA, za
 * sledeću nezabeleženu predaju u lancu. Za predaju sirovine snima se cena: poslednja prosečna
 * STIPS cena za kategoriju objavljena pre predaje (`cenaStipsZa`), inače cena iz cenovnika
 * davaoca (čl. 40 st. 3). 🔴 Snimak (cena, bilten, pijace) se čuva uz predaju i ne računa ponovo.
 */
export async function zabeleziPredaju(userId: string, lanacId: string, body: Record<string, unknown>) {
  const l = await prisma.lanac.findUnique({ where: { id: lanacId }, select: { id: true, vrsta: true, status: true, vrstaHrane: true, stipsKategorija: true } });
  if (!l || l.status === "PRESTAO" || l.status === "ZATVOREN") throw new LanacGreska("Lanac nije aktivan.", 404);
  const karike = await karikeLanca(lanacId);
  const predaje = await prisma.lanacPredaja.findMany({ where: { lanacId }, select: { odKarikaId: true } });
  const zabelezene = new Set(predaje.map((p) => p.odKarikaId));
  const i = karike.findIndex((k, idx) => idx < karike.length - 1 && !zabelezene.has(k.id));
  if (i < 0) throw new LanacGreska("Sve predaje u lancu su zabeležene.", 409);
  const od = karike[i];
  const doK = karike[i + 1];
  if (doK.userId !== userId) throw new LanacGreska("Predaju beleži karika koja robu prima.", 403);
  if (!od.ugovorPrihvacenAt || !doK.ugovorPrihvacenAt) throw new LanacGreska("Ugovori obe strane moraju biti potvrđeni.", 409);
  const program = l.vrsta === "PROGRAM_HRANE";
  const prvaPredaja = i === 0;
  const z = procitajZapisnik(body, {
    traziOznake: prvaPredaja && program && l.vrstaHrane === "MESO",
    traziObim: prvaPredaja && program,
  });
  if (!z.ok) throw new LanacGreska(z.razlog);
  const sada = new Date();

  let cena: { izvor: "STIPS" | "CENOVNIK"; cena: number; biltenId: string | null; snimak: Prisma.InputJsonValue | null } | null = null;
  if (prvaPredaja) {
    const s = l.stipsKategorija ? await cenaStipsZa(l.stipsKategorija, sada) : null;
    if (s) {
      const zapis = s as unknown as Record<string, unknown>;
      cena = {
        izvor: "STIPS",
        cena: Number(zapis.cena),
        biltenId: zapis.biltenId == null ? null : String(zapis.biltenId),
        snimak: JSON.parse(JSON.stringify(s)) as Prisma.InputJsonValue,
      };
    } else if (od.cenaPoJedinici != null && Number(od.cenaPoJedinici) > 0) {
      cena = { izvor: "CENOVNIK", cena: Number(od.cenaPoJedinici), biltenId: null, snimak: null };
    } else {
      throw new LanacGreska("Nema STIPS cene za kategoriju, a davalac nema cenu iz cenovnika — predaja se ne može vrednovati.", 409);
    }
    if (!(cena.cena > 0)) throw new LanacGreska("Cena za vrednovanje predaje nije ispravna.", 409);
  }

  const predaja = await prisma.$transaction(async (tx) => {
    const p = await tx.lanacPredaja.create({
      data: {
        lanacId, odKarikaId: od.id, doKarikaId: doK.id, kolicina: z.zapisnik.kolicina, oznakeZivotinja: z.zapisnik.oznakeZivotinja,
        obimUsluge: z.zapisnik.obimUsluge, predaoId: od.userId, primioId: doK.userId, zabelezenoAt: sada,
        ...(cena
          ? {
              cenaIzvor: cena.izvor, cenaPoJedinici: cena.cena, vrednostRsd: vrednostPredatog(z.zapisnik.kolicina, cena.cena),
              stipsKategorija: cena.izvor === "STIPS" ? l.stipsKategorija : null, stipsBiltenId: cena.biltenId,
              ...(cena.snimak ? { stipsSnimak: cena.snimak } : {}),
            }
          : {}),
      },
    });
    // Program: obim usluge objekta iz zapisnika — iz njega se računa doprinos objekta (čl. 42 st. 3).
    if (prvaPredaja && program) await tx.lanacKarika.update({ where: { id: doK.id }, data: { obim: z.zapisnik.obimUsluge } });
    return p;
  });
  await obavestiTiho(od.userId, {
    tip: "lanac",
    kljuc: "notifikacije.lanac_zapisnik_ceka",
    parametri: {},
    naslov: "Zapisnik o primopredaji čeka tvoju potvrdu",
    tekst: "Zabeležen je zapisnik o primopredaji. Proveri masu i podatke i potvrdi predaju na platformi.",
    link: "/vauceri/program",
  });
  return predaja;
}

/**
 * Karika koja je robu PREDALA potvrđuje zapisnik. U programu je to predaja (čl. 41): Protokol
 * ODMAH evidentira doprinos gazdinstva i Fondacija izdaje vaučere (čl. 43 st. 1). U lancu
 * predaja čeka da je Fondacija potvrdi (čl. 50 st. 2).
 */
export async function potvrdiPredaju(userId: string, predajaId: string) {
  const p = await prisma.lanacPredaja.findUnique({
    where: { id: predajaId },
    include: { lanac: { select: { id: true, vrsta: true, naziv: true, koeficijentSirovine: true } } },
  });
  if (!p || p.predaoId !== userId) throw new LanacGreska("Zapisnik nije pronađen.", 404);
  const r = await prisma.lanacPredaja.updateMany({ where: { id: predajaId, predaoPotvrdioAt: null }, data: { predaoPotvrdioAt: new Date() } });
  if (r.count !== 1) throw new LanacGreska("Zapisnik je već potvrđen.", 409);
  if (p.lanac.vrsta === "PROGRAM_HRANE" && p.vrednostRsd != null) {
    await evidentirajPredajuPrograma(predajaId);
  }
}

/** Program, čl. 41 i 43 st. 1: doprinos gazdinstva pri predaji, pa vaučeri. */
async function evidentirajPredajuPrograma(predajaId: string) {
  const p = await prisma.lanacPredaja.findUniqueOrThrow({ where: { id: predajaId } });
  const l = await prisma.lanac.findUniqueOrThrow({ where: { id: p.lanacId } });
  const karike = await karikeLanca(l.id);
  const g = karike.find((k) => k.id === p.odKarikaId)!;
  const koef = Number(g.koeficijent);
  const vrednost = dec(p.vrednostRsd);
  const iznos = doprinosSirovine(vrednost, koef);
  const walletId = await walletKarike(g);
  if (!walletId || iznos <= 0) throw new LanacGreska("Zapis davaoca nije pronađen.", 409);
  const d = await prisma.lanacDoprinos.create({
    data: { lanacId: l.id, karikaId: g.id, osnov: "SIROVINA", walletId, userId: g.zadrugaId ? null : g.userId, zadrugaId: g.zadrugaId, vrednostRsd: vrednost, koeficijent: koef, iznos },
  });
  const ok = await evidentirajDoprinos(d.id);
  if (ok) await izdajVaucere(l.id);
}

/**
 * Lanac (čl. 50 st. 2, čl. 51 st. 1): Fondacija utvrđuje da je predaja izvršena. Za predaju
 * sirovine doprinos davaoca se BELEŽI (vrednost × koeficijent iz odluke); evidentira ga Protokol
 * u narednom obračunskom periodu.
 */
export async function potvrdiPredajuFondacija(adminId: string, predajaId: string) {
  const p = await prisma.lanacPredaja.findUnique({ where: { id: predajaId }, include: { lanac: { select: { vrsta: true, naziv: true } } } });
  if (!p || p.lanac.vrsta !== "LANAC") throw new LanacGreska("Zapisnik lanca nije pronađen.", 404);
  if (!p.predaoPotvrdioAt) throw new LanacGreska("Predaju još nije potvrdila karika koja je robu predala.", 409);
  if (p.predaoId === adminId || p.primioId === adminId) throw new LanacGreska("Ne potvrđuješ predaju u kojoj učestvuješ.", 403);
  const k = await prisma.lanacKarika.findUniqueOrThrow({ where: { id: p.odKarikaId } });
  await prisma.$transaction(async (tx) => {
    const r = await tx.lanacPredaja.updateMany({ where: { id: predajaId, potvrdaFondacijeAt: null }, data: { potvrdaFondacijeAt: new Date(), potvrdioId: adminId } });
    if (r.count !== 1) throw new LanacGreska("Predaja je već potvrđena.", 409);
    if (k.uloga === "DAVALAC_SIROVINE" && p.vrednostRsd != null) {
      const walletId = k.zadrugaId
        ? (await tx.wallet.findUnique({ where: { krugId: k.zadrugaId }, select: { id: true } }))?.id
        : (await tx.wallet.findUnique({ where: { userId: k.userId }, select: { id: true } }))?.id;
      if (!walletId) throw new LanacGreska("Zapis davaoca nije pronađen.", 409);
      const koef = Number(k.koeficijent);
      await tx.lanacDoprinos.create({
        data: {
          lanacId: p.lanacId, karikaId: k.id, osnov: "SIROVINA", walletId, userId: k.zadrugaId ? null : k.userId, zadrugaId: k.zadrugaId,
          vrednostRsd: dec(p.vrednostRsd), koeficijent: koef, iznos: doprinosSirovine(dec(p.vrednostRsd), koef),
        },
      });
    }
  });
  await logAdminAkcija(adminId, "LANAC_PREDAJA_POTVRDJENA", predajaId);
  if (k.uloga === "DAVALAC_SIROVINE") await obavestiOZabelezenom(k.userId, p.lanac.naziv);
}

async function obavestiOZabelezenom(userId: string, naziv: string) {
  await obavestiTiho(userId, {
    tip: "lanac",
    kljuc: "notifikacije.lanac_zabelezeno",
    parametri: { naziv },
    naslov: "Doprinos u lancu je zabeležen",
    tekst: `Tvoj doprinos u lancu „${naziv}" je zabeležen; Protokol ga evidentira u narednom obračunskom periodu.`,
    link: "/novcanik",
  });
}

/** Partner, odnosno objekat, javlja da je usluga izvršena (Fondacija potom utvrđuje). */
export async function prijaviIzvrsenje(userId: string, karikaId: string) {
  const r = await prisma.lanacKarika.updateMany({
    where: { id: karikaId, userId, uloga: { not: "DAVALAC_SIROVINE" }, izvrsenoPrijavljenoAt: null, ugovorPrihvacenAt: { not: null } },
    data: { izvrsenoPrijavljenoAt: new Date() },
  });
  if (r.count !== 1) throw new LanacGreska("Izvršenje se ne može prijaviti.", 409);
}

/**
 * Fondacija utvrđuje izvršenje usluge karike (čl. 42 st. 3; čl. 51 st. 1; donacije čl. 43 st. 2:
 * ne utvrđuje lice koje je i samo karika).
 *  - Program: Protokol ODMAH evidentira doprinos objekta = cenovnik × obim iz zapisnika ×
 *    koeficijent hrane.
 *  - Lanac: doprinos partnera = vrednost usluge iz odluke × 1,00 se BELEŽI.
 */
export async function utvrdiIzvrsenje(adminId: string, karikaId: string) {
  const k = await prisma.lanacKarika.findUnique({ where: { id: karikaId }, include: { lanac: { select: { vrsta: true, naziv: true, status: true } } } });
  if (!k || k.uloga === "DAVALAC_SIROVINE") throw new LanacGreska("Karika nije pronađena.", 404);
  if (k.userId === adminId) throw new LanacGreska("Ne utvrđuješ izvršenje sopstvene usluge.", 403);
  if (!k.izvrsenoPrijavljenoAt) throw new LanacGreska("Karika još nije prijavila izvršenje.", 409);
  if (k.lanac.status === "PRESTAO") throw new LanacGreska("Partija je prestala.", 409);
  const program = k.lanac.vrsta === "PROGRAM_HRANE";
  // Program: usluga se vrednuje na partiji — tek pošto je predaja (i obim u zapisniku) potvrđena.
  if (program) {
    const predaja = await prisma.lanacPredaja.findFirst({ where: { lanacId: k.lanacId, doKarikaId: k.id, predaoPotvrdioAt: { not: null } } });
    if (!predaja || k.obim == null) throw new LanacGreska("Predaja na partiji još nije potvrđena.", 409);
  }
  const vrednost = vrednostUsluge(dec(k.cenaPoJedinici), dec(k.obim));
  const iznos = program ? doprinosUslugeObjekta(vrednost, Number(k.koeficijent)) : doprinosUslugePartnera(vrednost);
  const walletId = await walletKarike(k);
  if (!walletId) throw new LanacGreska("Zapis karike nije pronađen.", 409);
  const d = await prisma.$transaction(async (tx) => {
    const r = await tx.lanacKarika.updateMany({ where: { id: karikaId, izvrsenjeUtvrdjenoAt: null }, data: { izvrsenjeUtvrdjenoAt: new Date(), izvrsenjeUtvrdioId: adminId } });
    if (r.count !== 1) throw new LanacGreska("Izvršenje je već utvrđeno.", 409);
    if (iznos <= 0) return null;
    return tx.lanacDoprinos.create({
      data: {
        lanacId: k.lanacId, karikaId: k.id, osnov: "USLUGA", walletId, userId: k.zadrugaId ? null : k.userId, zadrugaId: k.zadrugaId,
        vrednostRsd: vrednost, koeficijent: program ? Number(k.koeficijent) : KOEFICIJENT_PARTNERA, iznos,
      },
    });
  });
  await logAdminAkcija(adminId, "LANAC_IZVRSENJE_UTVRDJENO", karikaId);
  // Program evidentira odmah (van transakcije, pravilo 8); lanac čeka naredni obračunski period.
  if (d && program) await evidentirajDoprinos(d.id);
  else if (d) await obavestiOZabelezenom(k.userId, k.lanac.naziv);
}

/**
 * Lanac (čl. 51 st. 1): kada Fondacija utvrdi da je roba izdata, poslednjem partneru se beleži
 * dodatak za distribuciju — procenat vrednosti izdate robe, za vaučere iskorišćene od prethodnog
 * utvrđenja.
 */
export async function utvrdiIzdavanje(adminId: string, lanacId: string) {
  const l = await prisma.lanac.findUnique({ where: { id: lanacId } });
  if (!l || l.vrsta !== "LANAC") throw new LanacGreska("Lanac nije pronađen.", 404);
  const karike = await karikeLanca(lanacId);
  const poslednji = karike.find((k) => k.uloga === "POSLEDNJI");
  if (!poslednji) throw new LanacGreska("Lanac nema poslednjeg partnera.", 409);
  if (poslednji.userId === adminId) throw new LanacGreska("Ne utvrđuješ sopstveno izdavanje.", 403);
  const prvaPredaja = await prisma.lanacPredaja.findFirst({ where: { lanacId, odKarikaId: karike[0].id } });
  const vrednostR = vrednostRobe(
    dec(prvaPredaja?.vrednostRsd),
    karike.filter((k) => k.uloga !== "DAVALAC_SIROVINE").map((k) => vrednostUsluge(dec(k.cenaPoJedinici), dec(k.obim))),
  );
  const walletId = await walletKarike(poslednji);
  if (!walletId) throw new LanacGreska("Zapis poslednjeg partnera nije pronađen.", 409);
  const ishod = await prisma.$transaction(async (tx) => {
    const vauceri = await tx.lanacVaucer.findMany({ where: { lanacId, status: "ISKORISCEN", izdavanjeUtvrdjenoAt: null }, select: { id: true } });
    if (vauceri.length === 0) throw new LanacGreska("Nema novih izdatih delova.", 409);
    await tx.lanacVaucer.updateMany({ where: { id: { in: vauceri.map((v) => v.id) } }, data: { izdavanjeUtvrdjenoAt: new Date() } });
    const pct = dec(l.dodatakDistribucijePct);
    const iznos = dodatakZaIzdato(vrednostR, l.brojVaucera, vauceri.length, pct);
    if (iznos <= 0) return { izdato: vauceri.length, iznos: 0 };
    const vrednostIzdate = Math.round(((vrednostR * vauceri.length) / l.brojVaucera) * 100) / 100;
    await tx.lanacDoprinos.create({
      data: {
        lanacId, karikaId: poslednji.id, osnov: "DISTRIBUCIJA", walletId, userId: poslednji.zadrugaId ? null : poslednji.userId,
        zadrugaId: poslednji.zadrugaId, vrednostRsd: vrednostIzdate, koeficijent: pct / 100, iznos,
      },
    });
    return { izdato: vauceri.length, iznos };
  });
  await logAdminAkcija(adminId, "LANAC_IZDAVANJE_UTVRDJENO", lanacId, `${ishod.izdato}`);
  if (ishod.iznos > 0) await obavestiOZabelezenom(poslednji.userId, l.naziv);
  return ishod;
}

// ─── Evidentiranje (Protokol) ────────────────────────────────────────────────

const OPIS_OSNOVA: Record<string, { lanac: string; program: string; tekst: string }> = {
  SIROVINA: { lanac: "transakcije.lanac_sirovina", program: "transakcije.program_hrane_gazdinstvo", tekst: "Doprinos davaoca sirovine" },
  USLUGA: { lanac: "transakcije.lanac_usluga", program: "transakcije.program_hrane_usluga", tekst: "Doprinos za uslugu" },
  DISTRIBUCIJA: { lanac: "transakcije.lanac_distribucija", program: "transakcije.lanac_distribucija", tekst: "Dodatak za distribuciju" },
};

/**
 * Jedan zabeležen doprinos → emisija (van transakcije, pravilo 8). Red se preuzima uslovnim
 * upisom (`evidentiranAt`), pa dva prolaza ne emituju dvaput; neuspeh vraća red na čekanje.
 * Tip: program `EMISIJA_PROGRAM_HRANE`, lanac `EMISIJA_LANAC`.
 */
async function evidentirajDoprinos(id: string): Promise<boolean> {
  const sada = new Date();
  const preuzet = await prisma.lanacDoprinos.updateMany({ where: { id, status: "ZABELEZEN", evidentiranAt: null }, data: { evidentiranAt: sada } });
  if (preuzet.count !== 1) return false;
  const d = await prisma.lanacDoprinos.findUniqueOrThrow({ where: { id }, include: { lanac: { select: { vrsta: true, naziv: true } } } });
  const program = d.lanac.vrsta === "PROGRAM_HRANE";
  const opis = OPIS_OSNOVA[d.osnov];
  try {
    const { transaction } = await emitujPoen(
      d.walletId,
      d.iznos,
      program ? TransactionType.EMISIJA_PROGRAM_HRANE : TransactionType.EMISIJA_LANAC,
      `${opis.tekst} — ${program ? "program raspodele hrane" : "lanac proizvodnje i distribucije"}: ${d.lanac.naziv}`,
      { kljuc: program ? opis.program : opis.lanac, parametri: { naziv: d.lanac.naziv, iznos: d.iznos } },
    );
    await prisma.lanacDoprinos.update({ where: { id }, data: { status: "EVIDENTIRAN", emisijaTxId: transaction.id } });
  } catch (e) {
    console.error("[lanac] evidentiranje nije uspelo", id, e);
    await prisma.lanacDoprinos.updateMany({ where: { id, status: "ZABELEZEN" }, data: { evidentiranAt: null } });
    return false;
  }
  if (d.userId) {
    await obavestiTiho(d.userId, {
      tip: "lanac",
      kljuc: "notifikacije.lanac_evidentirano",
      parametri: { naziv: d.lanac.naziv, poen: d.iznos },
      naslov: "Doprinos je evidentiran",
      tekst: `Protokol je evidentirao tvoj doprinos u „${d.lanac.naziv}": ${d.iznos.toLocaleString("sr-RS")} POEN.`,
      link: "/novcanik",
    });
  }
  return true;
}

/**
 * Noćni obračun (čl. 51 st. 1): beležen doprinos lanca iz ranijih obračunskih perioda evidentira
 * se sada. Posle evidentiranja doprinosa sirovine izdaju se vaučeri lanca (shodno čl. 43 st. 1).
 * Zaostali zabeleženi doprinos programa (emisija nije uspela) evidentira se istim prolazom.
 */
export async function evidentirajZabelezenoLanac(doTrenutka: Date = new Date()): Promise<number> {
  const redovi = await prisma.lanacDoprinos.findMany({
    where: { status: "ZABELEZEN", evidentiranAt: null, zabelezenAt: { lt: doTrenutka } },
    select: { id: true, lanacId: true, osnov: true },
    orderBy: { zabelezenAt: "asc" },
  });
  let n = 0;
  const zaVaucere = new Set<string>();
  for (const r of redovi) {
    if (await evidentirajDoprinos(r.id)) {
      n++;
      if (r.osnov === "SIROVINA") zaVaucere.add(r.lanacId);
    }
  }
  for (const id of zaVaucere) {
    try {
      await izdajVaucere(id);
    } catch (e) {
      console.error("[lanac] izdavanje vaučera nije uspelo", id, e);
    }
  }
  return n;
}

/**
 * Izdavanje vaučera (čl. 43 st. 1–2, čl. 52 st. 1): kada je doprinos davaoca evidentiran.
 * Broj POEN-a po vaučeru = zbir doprinosa partije ÷ broj vaučera, zaokruženo (snima se).
 */
async function izdajVaucere(lanacId: string) {
  const l = await prisma.lanac.findUniqueOrThrow({ where: { id: lanacId } });
  if (l.status !== "PRIPREMA") return;
  const karike = await karikeLanca(lanacId);
  const sirovina = await prisma.lanacDoprinos.findFirst({ where: { lanacId, osnov: "SIROVINA", status: "EVIDENTIRAN" } });
  if (!sirovina) return;
  const prva = await prisma.lanacPredaja.findFirst({ where: { lanacId, odKarikaId: karike[0].id } });
  let poenaPoV: number;
  if (l.vrsta === "PROGRAM_HRANE") {
    const objekat = karike.find((k) => k.uloga === "POSLEDNJI")!;
    const plan = planProgramaHrane({
      vrednostPredatog: dec(prva?.vrednostRsd),
      koeficijentHrane: Number(karike[0].koeficijent),
      vrednostUslugeObjekta: vrednostUsluge(dec(objekat.cenaPoJedinici), dec(objekat.obim)),
      brojVaucera: l.brojVaucera,
    });
    // Doprinos gazdinstva je već evidentiran — broj se uzima iz upisa, ne računa ponovo.
    poenaPoV = poenaPoVauceruIzDoprinosa([sirovina.iznos, plan.objekat], l.brojVaucera);
  } else {
    const plan = planLanca({
      vrednostSirovine: dec(prva?.vrednostRsd),
      koeficijentSirovine: Number(karike[0].koeficijent),
      vrednostiUsluga: karike.filter((k) => k.uloga !== "DAVALAC_SIROVINE").map((k) => vrednostUsluge(dec(k.cenaPoJedinici), dec(k.obim))),
      dodatakPct: dec(l.dodatakDistribucijePct),
      brojVaucera: l.brojVaucera,
    });
    poenaPoV = poenaPoVauceruIzDoprinosa([sirovina.iznos, ...plan.usluge, plan.dodatak], l.brojVaucera);
  }
  if (!(poenaPoV > 0)) return;
  await prisma.$transaction(async (tx) => {
    const r = await tx.lanac.updateMany({ where: { id: lanacId, status: "PRIPREMA" }, data: { status: "VAUCERI_IZDATI", poenaPoVauceru: poenaPoV, vauceriIzdatiAt: new Date() } });
    if (r.count !== 1) return;
    const kodovi = new Set<string>();
    while (kodovi.size < l.brojVaucera) kodovi.add(noviKod());
    await tx.lanacVaucer.createMany({ data: [...kodovi].map((kod) => ({ lanacId, kod })) });
  });
}

// ─── Uzimanje vaučera (čl. 43 st. 3–4) ───────────────────────────────────────

/**
 * Korisnik uzima vaučer partije, odnosno lanca. Sve u JEDNOJ transakciji: zapis se zaključava,
 * uslovi se proveravaju nad zaključanim stanjem (najviše dva neiskorišćena — računajući i
 * vaučere pokroviteljstva dobrima — i jedan iz partije; dovoljno raspoloživih POEN-a, bez minusa),
 * slobodan vaučer se uzima uz `SKIP LOCKED`, a broj POEN-a po vaučeru poništava se sopstvenim
 * tipom `PONISTENJE_VAUCER_LANAC` u korist Protokola.
 */
export async function uzmiVaucerLanca(
  userId: string,
  lanacId: string,
  unos: { izjavaNepovezan: boolean; pristanakPrikaz: boolean },
  pristanakTekst: string,
) {
  if (!unos.pristanakPrikaz || !pristanakTekst.trim()) throw new LanacGreska("Bez pristanka na prikaz zapisa uz pseudonim vaučer se ne može uzeti.", 403);
  const sada = new Date();
  const ishod = await prisma.$transaction(async (tx) => {
    const korisnik = await tx.user.findUnique({
      where: { id: userId },
      select: { maloletan: true, deaktiviranAt: true, status: true, wallet: { select: { id: true } } },
    });
    if (!korisnik || !korisnik.wallet) throw new LanacGreska("Korisnik nije pronađen.", 404);
    const walletId = korisnik.wallet.id;
    await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${walletId} FOR UPDATE`;
    const l = await tx.lanac.findUnique({ where: { id: lanacId }, select: { status: true, neispravnoAt: true, spremnoAt: true, poenaPoVauceru: true, naziv: true } });
    if (!l || !uzimanjeOtvoreno(l, sada) || !l.poenaPoVauceru) throw new LanacGreska("Vaučeri ove partije nisu dostupni.", 404);
    const [w, nab, jeKarika, aktivniDobra, aktivniLanac, aktivniIzPartije] = await Promise.all([
      tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
      tx.nabavkaPrijava.aggregate({ where: { userId, status: "POTVRDIO" }, _sum: { rezervisano: true } }),
      tx.lanacKarika.count({ where: { lanacId, userId } }),
      tx.vaucer.count({ where: { imalacId: userId, status: "DODELJEN" } }),
      tx.lanacVaucer.count({ where: { imalacId: userId, status: "DODELJEN" } }),
      tx.lanacVaucer.count({ where: { imalacId: userId, lanacId, status: "DODELJEN" } }),
    ]);
    const provera = smeUzetiVaucerLanca({
      ...korisnik,
      jeKarika: jeKarika > 0,
      izjavaNepovezan: unos.izjavaNepovezan,
      pristanakPrikaz: unos.pristanakPrikaz,
      aktivnihUkupno: aktivniDobra + aktivniLanac,
      aktivnihIzPartije: aktivniIzPartije,
      raspolozivo: raspolozivo(w.balance) - (nab._sum.rezervisano ?? 0) - (await ograniceno(walletId, tx)),
      poenaPoVauceru: l.poenaPoVauceru,
    });
    if (!provera.ok) throw new LanacGreska(provera.razlog, 403);
    const slobodni = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "LanacVaucer"
      WHERE "lanacId" = ${lanacId} AND status = 'SLOBODAN'
      ORDER BY "createdAt" ASC, id ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED`;
    const vaucerId = slobodni[0]?.id;
    if (!vaucerId) throw new LanacGreska("Svi vaučeri ove partije su uzeti.", 409);
    const r = await tx.lanacVaucer.updateMany({
      where: { id: vaucerId, status: "SLOBODAN", imalacId: null },
      data: {
        status: "DODELJEN", imalacId: userId, dodeljenAt: sada, ponisteno: l.poenaPoVauceru,
        izjavaNepovezanAt: sada, pristanakPrikazAt: sada, pristanakPrikazTekst: pristanakTekst,
      },
    });
    if (r.count !== 1) throw new LanacGreska("Vaučer je u međuvremenu uzet. Pokušaj ponovo.", 409);
    const txId = await upisiParLanca(tx, {
      fromWalletId: walletId,
      toWalletId: PROTOKOL_WALLET_ID,
      iznos: l.poenaPoVauceru,
      type: TransactionType.PONISTENJE_VAUCER_LANAC,
      description: `Vaučer programa: ${l.naziv}`,
      opisKljuc: "transakcije.vaucer_lanca_uzet",
      opisParametri: { naziv: l.naziv },
    });
    await tx.lanacVaucer.update({ where: { id: vaucerId }, data: { ponistenjeTxId: txId } });
    return { vaucerId, naziv: l.naziv, poen: l.poenaPoVauceru };
  });
  await obavestiTiho(userId, {
    tip: "vaucer",
    kljuc: "notifikacije.vaucer_lanca_uzet",
    parametri: { naziv: ishod.naziv, poen: ishod.poen },
    naslov: "Uzeo si vaučer",
    tekst: `Uzeo si vaučer: ${ishod.naziv}. Poništeno je ${ishod.poen} POEN. Obavestićemo te kada je hrana spremna za preuzimanje.`,
    link: "/vauceri",
  });
  return ishod;
}

/** Shodno čl. 33 st. 2: povlačenjem pristanka opis se briše iz zapisa o poništenju; zapis ostaje. */
export async function povuciPristanakLanca(userId: string, vaucerId: string) {
  const v = await prisma.lanacVaucer.findUnique({ where: { id: vaucerId }, select: { imalacId: true, ponistenjeTxId: true, ispravkaTxId: true, pristanakPovucenAt: true } });
  if (!v || v.imalacId !== userId) throw new LanacGreska("Vaučer nije pronađen.", 404);
  if (v.pristanakPovucenAt) throw new LanacGreska("Pristanak je već povučen.", 409);
  await prisma.$transaction(async (tx) => {
    const r = await tx.lanacVaucer.updateMany({ where: { id: vaucerId, imalacId: userId, pristanakPovucenAt: null }, data: { pristanakPovucenAt: new Date() } });
    if (r.count !== 1) throw new LanacGreska("Pristanak je već povučen.", 409);
    // Vaučer prenet sa neispravne partije deli zapis o poništenju sa prethodnim — briše se isti opis.
    const ids = [v.ponistenjeTxId, v.ispravkaTxId].filter((x): x is string => !!x);
    if (ids.length)
      await tx.transaction.updateMany({
        where: { id: { in: ids }, type: { in: [TransactionType.PONISTENJE_VAUCER_LANAC, TransactionType.ISPRAVKA_VAUCER_LANAC] } },
        data: { description: null, opisKljuc: null, opisParametri: PrismaVrednosti.DbNull },
      });
  });
}

// ─── Spremno, preuzimanje, istek (čl. 44) ────────────────────────────────────

/** Objekat, odnosno poslednji partner, označava da je hrana spremna; imaoci se obaveštavaju. */
export async function oznaciSpremno(userId: string, lanacId: string) {
  const k = await prisma.lanacKarika.findFirst({ where: { lanacId, userId, uloga: "POSLEDNJI" }, include: { lanac: { select: { naziv: true, vrsta: true } } } });
  if (!k) throw new LanacGreska("Samo objekat koji izdaje hranu označava da je spremna.", 403);
  const sada = new Date();
  const r = await prisma.lanac.updateMany({ where: { id: lanacId, status: "VAUCERI_IZDATI", spremnoAt: null, neispravnoAt: null }, data: { spremnoAt: sada } });
  if (r.count !== 1) throw new LanacGreska("Partija nije u stanju u kome se označava spremnost.", 409);
  // Program: obrada je izvršena — objekat time javlja izvršenje usluge (Fondacija utvrđuje).
  if (k.lanac.vrsta === "PROGRAM_HRANE" && !k.izvrsenoPrijavljenoAt)
    await prisma.lanacKarika.update({ where: { id: k.id }, data: { izvrsenoPrijavljenoAt: sada } });
  const imaoci = await prisma.lanacVaucer.findMany({ where: { lanacId, status: "DODELJEN" }, select: { imalacId: true } });
  for (const v of imaoci) {
    if (!v.imalacId) continue;
    await obavestiTiho(v.imalacId, {
      tip: "vaucer",
      kljuc: "notifikacije.lanac_spremno",
      parametri: { naziv: k.lanac.naziv, objekat: k.naziv, dana: 15 },
      naslov: "Hrana je spremna za preuzimanje",
      tekst: `Hrana po tvom vaučeru („${k.lanac.naziv}") spremna je za preuzimanje u objektu „${k.naziv}". Preuzmi je u roku od 15 dana.`,
      link: "/vauceri",
    });
  }
}

/** Šta objekat vidi kad unese kod: stanje, opis i pseudonim imaoca — ništa drugo. */
export async function proveriKodLanca(userId: string, kodUnos: string): Promise<{ stanje: StanjeVauceraLanca; naziv: string | null; pseudonim: string | null }> {
  const kod = normalizujKod(kodUnos);
  const v = kod ? await prisma.lanacVaucer.findUnique({ where: { kod }, include: { lanac: { select: { naziv: true, spremnoAt: true, karike: { where: { uloga: "POSLEDNJI" }, select: { userId: true } } } } } }) : null;
  if (!v || !v.lanac.karike.some((k) => k.userId === userId)) return { stanje: "NEPOZNAT", naziv: null, pseudonim: null };
  const imalac = v.imalacId ? await prisma.user.findUnique({ where: { id: v.imalacId }, select: { pseudonim: true } }) : null;
  return { stanje: stanjeVauceraLanca({ status: v.status, spremnoAt: v.lanac.spremnoAt, dodeljenAt: v.dodeljenAt, sada: new Date() }), naziv: v.lanac.naziv, pseudonim: imalac?.pseudonim ?? null };
}

/** Objekat potvrđuje preuzimanje (čl. 44 st. 2). POEN se ne pomera — poništen je pri uzimanju. */
export async function potvrdiPreuzimanje(userId: string, kodUnos: string) {
  const kod = normalizujKod(kodUnos);
  if (!kod) throw new LanacGreska("Upiši kod vaučera.");
  const v = await prisma.lanacVaucer.findUnique({ where: { kod }, include: { lanac: { select: { naziv: true, spremnoAt: true, karike: { where: { uloga: "POSLEDNJI" }, select: { userId: true } } } } } });
  if (!v || !v.lanac.karike.some((k) => k.userId === userId)) throw new LanacGreska("Nepoznat kod.", 404);
  if (v.imalacId === userId) throw new LanacGreska("Sopstveni vaučer ne možeš potvrditi.", 403);
  const stanje = stanjeVauceraLanca({ status: v.status, spremnoAt: v.lanac.spremnoAt, dodeljenAt: v.dodeljenAt, sada: new Date() });
  if (stanje !== "VAZI" || !v.imalacId) throw new LanacGreska("Vaučer se ne može iskoristiti.", 409);
  const r = await prisma.lanacVaucer.updateMany({ where: { id: v.id, status: "DODELJEN" }, data: { status: "ISKORISCEN", iskoriscenAt: new Date(), potvrdioId: userId } });
  if (r.count !== 1) throw new LanacGreska("Vaučer je već iskorišćen.", 409);
  await obavestiTiho(v.imalacId, {
    tip: "vaucer",
    kljuc: "notifikacije.vaucer_lanca_iskoriscen",
    parametri: { naziv: v.lanac.naziv },
    naslov: "Hrana je preuzeta",
    tekst: `Objekat je potvrdio da si preuzeo hranu po vaučeru „${v.lanac.naziv}".`,
    link: "/vauceri",
  });
  return { naziv: v.lanac.naziv };
}

/** Cron: uzet vaučer čiji je rok preuzimanja prošao prestaje, poništenje se ne ispravlja (čl. 44 st. 3). */
export async function obradiVaucereLanca(sada = new Date()): Promise<{ isteklo: number }> {
  const kandidati = await prisma.lanacVaucer.findMany({
    where: { status: "DODELJEN", lanac: { spremnoAt: { not: null } } },
    select: { id: true, dodeljenAt: true, lanac: { select: { spremnoAt: true } } },
  });
  const istekli = kandidati.filter((v) => vaucerIstekao(v.lanac.spremnoAt, v.dodeljenAt, sada)).map((v) => v.id);
  if (istekli.length === 0) return { isteklo: 0 };
  const r = await prisma.lanacVaucer.updateMany({ where: { id: { in: istekli }, status: "DODELJEN" }, data: { status: "ISTEKAO", istekaoAt: sada } });
  return { isteklo: r.count };
}

// ─── Zamena i ispravka (čl. 45) ──────────────────────────────────────────────

/**
 * Hrana nije ispravna: svaki uzet, a neiskorišćen vaučer prenosi se na drugu partiju iste vrste
 * (bez novog poništenja); ako takve partije nema, vaučer prestaje, a poništenje se ispravlja
 * protivzapisom `ISPRAVKA_VAUCER_LANAC` (čl. 35; Pravilnik čl. 18 st. 5). Slobodni vaučeri
 * prestaju. Doprinosi se ne otpisuju (čl. 41 st. 2).
 */
export async function oznaciNeispravno(adminId: string, lanacId: string, razlog: string) {
  const razlogT = razlog.trim();
  if (razlogT.length < 5) throw new LanacGreska("Upiši razlog.");
  const l = await prisma.lanac.findUnique({ where: { id: lanacId } });
  if (!l || l.neispravnoAt) throw new LanacGreska("Partija nije pronađena ili je već označena.", 404);
  const sada = new Date();
  await prisma.lanac.update({ where: { id: lanacId }, data: { neispravnoAt: sada, neispravnoRazlog: razlogT, status: "PRESTAO" } });
  await prisma.lanacVaucer.updateMany({ where: { lanacId, status: "SLOBODAN" }, data: { status: "PRESTAO", prestaoAt: sada } });
  const uzeti = await prisma.lanacVaucer.findMany({ where: { lanacId, status: "DODELJEN" } });
  let preneto = 0;
  let ispravljeno = 0;
  for (const v of uzeti) {
    if (!v.imalacId) continue;
    const imalacId = v.imalacId;
    const kandidati = l.vrstaHrane
      ? await prisma.lanac.findMany({
          where: { id: { not: lanacId }, vrstaHrane: l.vrstaHrane, status: "VAUCERI_IZDATI", neispravnoAt: null },
          orderBy: { vauceriIzdatiAt: "asc" },
          select: { id: true, status: true, neispravnoAt: true, spremnoAt: true },
        })
      : [];
    const otvoreni = kandidati.filter((k) => uzimanjeOtvoreno(k, sada));
    const opis = await Promise.all(
      otvoreni.map(async (k) => ({
        lanacId: k.id,
        slobodnih: await prisma.lanacVaucer.count({ where: { lanacId: k.id, status: "SLOBODAN" } }),
        imalacVecIma: (await prisma.lanacVaucer.count({ where: { lanacId: k.id, imalacId, status: "DODELJEN" } })) > 0,
      })),
    );
    const cilj = partijaZaZamenu(opis);
    const prenet = cilj
      ? await prisma.$transaction(async (tx) => {
          const slob = await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM "LanacVaucer" WHERE "lanacId" = ${cilj} AND status = 'SLOBODAN'
            ORDER BY "createdAt" ASC, id ASC LIMIT 1 FOR UPDATE SKIP LOCKED`;
          if (!slob[0]) return false;
          await tx.lanacVaucer.update({
            where: { id: slob[0].id },
            data: {
              status: "DODELJEN", imalacId, dodeljenAt: sada, ponisteno: v.ponisteno, ponistenjeTxId: v.ponistenjeTxId, prenetIzId: v.id,
              izjavaNepovezanAt: v.izjavaNepovezanAt, pristanakPrikazAt: v.pristanakPrikazAt, pristanakPrikazTekst: v.pristanakPrikazTekst,
              pristanakPovucenAt: v.pristanakPovucenAt,
            },
          });
          await tx.lanacVaucer.update({ where: { id: v.id }, data: { status: "PRENET", prestaoAt: sada } });
          return true;
        })
      : false;
    if (prenet) {
      preneto++;
      await obavestiTiho(imalacId, {
        tip: "vaucer",
        kljuc: "notifikacije.vaucer_lanca_prenet",
        parametri: { naziv: l.naziv },
        naslov: "Vaučer je prenet na drugu partiju",
        tekst: `Hrana iz partije „${l.naziv}" nije ispravna. Tvoj vaučer je prenet na drugu partiju iste vrste.`,
        link: "/vauceri",
      });
      continue;
    }
    // Zamene nema: vaučer prestaje, poništenje se ispravlja (Protokol → imalac).
    const w = await prisma.wallet.findUnique({ where: { userId: imalacId }, select: { id: true } });
    if (!w || v.ponisteno <= 0) continue;
    await prisma.$transaction(async (tx) => {
      const r = await tx.lanacVaucer.updateMany({ where: { id: v.id, status: "DODELJEN" }, data: { status: "PRESTAO", prestaoAt: sada } });
      if (r.count !== 1) return;
      const txId = await upisiParLanca(tx, {
        fromWalletId: PROTOKOL_WALLET_ID,
        toWalletId: w.id,
        iznos: v.ponisteno,
        type: TransactionType.ISPRAVKA_VAUCER_LANAC,
        description: v.pristanakPovucenAt ? null : `Ispravka evidencije — vaučer programa: ${l.naziv}`,
        opisKljuc: v.pristanakPovucenAt ? null : "transakcije.vaucer_lanca_ispravka",
        opisParametri: v.pristanakPovucenAt ? undefined : { naziv: l.naziv },
      });
      await tx.lanacVaucer.update({ where: { id: v.id }, data: { ispravkaTxId: txId } });
    });
    ispravljeno++;
    await obavestiTiho(imalacId, {
      tip: "vaucer",
      kljuc: "notifikacije.vaucer_lanca_ispravka",
      parametri: { naziv: l.naziv, poen: v.ponisteno },
      naslov: "Ispravka evidencije po vaučeru",
      tekst: `Hrana iz partije „${l.naziv}" nije ispravna, a druge partije iste vrste nema. Vaučer je prestao, a poništenje je ispravljeno: ${v.ponisteno} POEN.`,
      link: "/novcanik",
    });
  }
  await logAdminAkcija(adminId, "LANAC_NEISPRAVNO", lanacId, `${razlogT} (preneto ${preneto}, ispravljeno ${ispravljeno})`);
  return { preneto, ispravljeno };
}

// ─── Nepreuzeti delovi (čl. 46, čl. 52 st. 2) ────────────────────────────────

/**
 * Program, čl. 46: po isteku roka objekat preuzima nepreuzete delove.
 *  - Deo čiji je vaučer uzet i istekao: otpisa nema (POEN je već poništen).
 *  - Deo za koji vaučer nije uzet: licu u čijem zapisu je evidentiran doprinos za uslugu na toj
 *    partiji otpisuje se broj POEN-a po vaučeru, najviše do visine tog doprinosa (umanjeno za ono
 *    što je po ovom osnovu već otpisano), i kada zapis postane negativan — DEVETI osnov
 *    (`OTPIS_NEPREUZETO_PROGRAM`). Preko te granice deo se preuzima samo uz poništenje iz
 *    zapisa koji objekat ima (`PONISTENJE_VAUCER_LANAC`), bez minusa. Lice se obaveštava uz osnov i
 *    iznos, a o minusu posebno (pravilo 3).
 * Lanac nema ovu radnju: nepreuzete delove Fondacija predaje (`predajNepreuzeteUstanovi`).
 */
export async function preuzmiNepreuzeteDelove(userId: string, lanacId: string) {
  const l = await prisma.lanac.findUnique({ where: { id: lanacId } });
  if (!l || l.vrsta !== "PROGRAM_HRANE") throw new LanacGreska("Partija programa nije pronađena.", 404);
  const objekat = await prisma.lanacKarika.findFirst({ where: { lanacId, uloga: "POSLEDNJI" } });
  if (!objekat || objekat.userId !== userId) throw new LanacGreska("Nepreuzete delove preuzima objekat partije.", 403);
  const sada = new Date();
  if (l.status !== "VAUCERI_IZDATI" || !rokZaNepreuzeteIstekao(l.spremnoAt, sada)) throw new LanacGreska("Rok za preuzimanje još nije istekao.", 409);
  const walletId = await walletKarike(objekat);
  if (!walletId) throw new LanacGreska("Zapis objekta nije pronađen.", 409);
  const poenaPoV = l.poenaPoVauceru ?? 0;

  const ishod = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${walletId} FOR UPDATE`;
    // Istekli uzeti delovi — bez otpisa.
    const istekli = await tx.lanacVaucer.updateMany({
      where: { lanacId, status: "ISTEKAO", nepreuzetIshod: null },
      data: { nepreuzetIshod: "OBJEKAT", nepreuzetAt: sada },
    });
    const bezVaucera = await tx.lanacVaucer.findMany({ where: { lanacId, status: "SLOBODAN" }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true } });
    const [usluga, vecOtpisano, w, nab] = await Promise.all([
      tx.lanacDoprinos.aggregate({ where: { lanacId, karikaId: objekat.id, osnov: "USLUGA", status: "EVIDENTIRAN" }, _sum: { iznos: true } }),
      tx.lanacVaucer.aggregate({ where: { lanacId }, _sum: { otpisano: true } }),
      tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
      objekat.zadrugaId ? Promise.resolve({ _sum: { rezervisano: 0 } }) : tx.nabavkaPrijava.aggregate({ where: { userId, status: "POTVRDIO" }, _sum: { rezervisano: true } }),
    ]);
    const o = otpisNepreuzetihDelova({
      delovaBezVaucera: bezVaucera.length,
      poenaPoVauceru: poenaPoV,
      doprinosZaUsluguNaPartiji: usluga._sum.iznos ?? 0,
      vecOtpisano: vecOtpisano._sum.otpisano ?? 0,
      raspolozivo: raspolozivo(w.balance) - (nab._sum.rezervisano ?? 0) - (await ograniceno(walletId, tx)),
      zapisZadruge: !!objekat.zadrugaId,
    });
    const preuzeti = bezVaucera.slice(0, o.delovaPreuzeto);
    const poDelu = rasporediOtpis(o.otpis, preuzeti.length, poenaPoV);
    let otpisTxId: string | null = null;
    if (o.otpis > 0) {
      // 🔴 Deveti osnov (Pravilnik čl. 17 st. 2 t. 9): zapis SME u minus — bez kapiranja na nulu.
      otpisTxId = await upisiParLanca(tx, {
        fromWalletId: walletId,
        toWalletId: PROTOKOL_WALLET_ID,
        iznos: o.otpis,
        type: TransactionType.OTPIS_NEPREUZETO_PROGRAM,
        description: `Otpis po preuzimanju nepreuzetih delova u programu raspodele hrane: ${l.naziv}`,
        opisKljuc: "transakcije.otpis_nepreuzeto",
        opisParametri: { naziv: l.naziv, delova: preuzeti.length },
      });
    }
    if (o.ponistenje > 0) {
      await upisiParLanca(tx, {
        fromWalletId: walletId,
        toWalletId: PROTOKOL_WALLET_ID,
        iznos: o.ponistenje,
        type: TransactionType.PONISTENJE_VAUCER_LANAC,
        description: `Poništenje za nepreuzete delove u programu raspodele hrane: ${l.naziv}`,
        opisKljuc: "transakcije.nepreuzeto_ponistenje",
        opisParametri: { naziv: l.naziv },
      });
    }
    for (let i = 0; i < preuzeti.length; i++) {
      await tx.lanacVaucer.update({
        where: { id: preuzeti[i].id },
        data: { status: "NEPREUZET", nepreuzetIshod: "OBJEKAT", nepreuzetAt: sada, otpisano: poDelu[i] || null, otpisTxId: poDelu[i] ? otpisTxId : null },
      });
    }
    const stanje = await tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } });
    return { ...o, istekliPreuzeto: istekli.count, stanjePosle: stanje.balance };
  });

  if (ishod.otpis > 0 && !objekat.zadrugaId) {
    await obavestiTiho(userId, {
      tip: "lanac",
      kljuc: ishod.stanjePosle < 0 ? "notifikacije.lanac_otpis_minus" : "notifikacije.lanac_otpis",
      parametri: { naziv: l.naziv, poen: ishod.otpis, stanje: ishod.stanjePosle },
      naslov: ishod.stanjePosle < 0 ? "Zapis je otpisom postao negativan" : "Otpis po preuzimanju nepreuzetih delova",
      tekst:
        `Po preuzimanju nepreuzetih delova partije „${l.naziv}" otpisano je ${ishod.otpis} POEN (Pravilnik o KOLO sistemu, čl. 17 st. 2 t. 9; Pravilnik o projektima i kolektivnim nabavkama, čl. 46).` +
        (ishod.stanjePosle < 0 ? ` Tvoj zapis je sada negativan (${ishod.stanjePosle} POEN); POEN koji pristigne prvo popunjava taj iznos.` : ""),
      link: "/novcanik",
    });
  }
  await zatvoriAkoJeGotovo(lanacId);
  return ishod;
}

/**
 * Delove koje objekat ne preuzme (program, čl. 46 st. 4), odnosno koje niko ne preuzme (lanac,
 * čl. 52 st. 2), Fondacija predaje kroz program podrške ili ustanovi socijalne zaštite i ne
 * prodaje ih. 🔴 Samo evidencija — bez otpisa i bez upisa POEN-a.
 */
export async function predajNepreuzeteUstanovi(adminId: string, lanacId: string, napomena: string) {
  const l = await prisma.lanac.findUnique({ where: { id: lanacId } });
  if (!l) throw new LanacGreska("Lanac nije pronađen.", 404);
  const sada = new Date();
  if (!rokZaNepreuzeteIstekao(l.spremnoAt, sada)) throw new LanacGreska("Rok za preuzimanje još nije istekao.", 409);
  const [slobodni, istekli] = await prisma.$transaction([
    prisma.lanacVaucer.updateMany({ where: { lanacId, status: "SLOBODAN" }, data: { status: "NEPREUZET", nepreuzetIshod: "USTANOVA", nepreuzetAt: sada } }),
    prisma.lanacVaucer.updateMany({ where: { lanacId, status: "ISTEKAO", nepreuzetIshod: null }, data: { nepreuzetIshod: "USTANOVA", nepreuzetAt: sada } }),
  ]);
  await logAdminAkcija(adminId, "LANAC_NEPREUZETO_PREDATO", lanacId, `${slobodni.count + istekli.count} delova; ${napomena.trim().slice(0, 300)}`);
  await zatvoriAkoJeGotovo(lanacId);
  return { delova: slobodni.count + istekli.count };
}

async function zatvoriAkoJeGotovo(lanacId: string) {
  const otvoreno = await prisma.lanacVaucer.count({
    where: { lanacId, OR: [{ status: { in: ["SLOBODAN", "DODELJEN"] } }, { status: "ISTEKAO", nepreuzetIshod: null }] },
  });
  if (otvoreno === 0) await prisma.lanac.updateMany({ where: { id: lanacId, status: "VAUCERI_IZDATI" }, data: { status: "ZATVOREN", zatvorenAt: new Date() } });
}

/** Gašenje naloga: uzet vaučer se oslobađa, kao kod vaučera pokroviteljstva dobrima. */
export async function oslobodiVaucereLancaPriGasenjuNaloga(userId: string) {
  try {
    await prisma.lanacVaucer.updateMany({
      where: { imalacId: userId, status: "DODELJEN" },
      data: {
        status: "SLOBODAN", imalacId: null, dodeljenAt: null, ponisteno: 0, ponistenjeTxId: null,
        izjavaNepovezanAt: null, pristanakPrikazAt: null, pristanakPrikazTekst: null,
      },
    });
  } catch (e) {
    console.error("[lanac] oslobađanje vaučera pri gašenju naloga nije uspelo", userId, e);
  }
}

// ─── Pregledi ─────────────────────────────────────────────────────────────────

/**
 * Javnost programa (čl. 47, shodno i lanac): po partiji naziv gazdinstva, objekti, masa, broj
 * vaučera, broj POEN-a po vaučeru i broj preuzetih delova. 🔴 Bez dinara — vrednost u dinarima
 * objavljuje se samo u izveštaju (čl. 37 st. 2).
 */
export async function javnePartije(userId: string | null) {
  const sada = new Date();
  const lanci = await prisma.lanac.findMany({
    where: { status: { in: ["VAUCERI_IZDATI", "ZATVOREN", "PRESTAO"] } },
    orderBy: { vauceriIzdatiAt: "desc" },
    take: 100,
    select: {
      id: true, vrsta: true, naziv: true, jedinica: true, brojVaucera: true, kolicinaPoVauceru: true, poenaPoVauceru: true, status: true,
      spremnoAt: true, neispravnoAt: true, odlukaOrgan: true, odlukaBroj: true, odlukaDatum: true,
      karike: { orderBy: { redniBroj: "asc" }, select: { uloga: true, naziv: true, mestoPredaje: true, adresaPredaje: true, userId: true } },
      predaje: { orderBy: { zabelezenoAt: "asc" }, take: 1, select: { kolicina: true } },
      _count: { select: { vauceri: { where: { status: "SLOBODAN" } } } },
    },
  });
  const preuzeto = await prisma.lanacVaucer.groupBy({ by: ["lanacId"], where: { status: "ISKORISCEN", lanacId: { in: lanci.map((l) => l.id) } }, _count: { _all: true } });
  const mapaPreuzeto = new Map(preuzeto.map((p) => [p.lanacId, p._count._all]));
  return lanci.map((l) => ({
    id: l.id,
    vrsta: l.vrsta,
    naziv: l.naziv,
    davalac: l.karike.find((k) => k.uloga === "DAVALAC_SIROVINE")?.naziv ?? "",
    objekti: l.karike.filter((k) => k.uloga !== "DAVALAC_SIROVINE").map((k) => k.naziv),
    mestoPreuzimanja: (() => {
      const p = l.karike.find((k) => k.uloga === "POSLEDNJI");
      return p ? (p.adresaPredaje ? `${p.mestoPredaje}, ${p.adresaPredaje}` : p.mestoPredaje) : "";
    })(),
    masa: l.predaje[0] ? Number(l.predaje[0].kolicina) : null,
    jedinica: l.jedinica,
    brojVaucera: l.brojVaucera,
    kolicinaPoVauceru: l.kolicinaPoVauceru,
    poen: l.poenaPoVauceru ?? 0,
    preostalo: l._count.vauceri,
    preuzeto: mapaPreuzeto.get(l.id) ?? 0,
    spremno: !!l.spremnoAt,
    otvoreno: uzimanjeOtvoreno(l, sada),
    ucestvujem: !!userId && l.karike.some((k) => k.userId === userId),
    odluka: l.odlukaOrgan ? { organ: l.odlukaOrgan, broj: l.odlukaBroj, datum: l.odlukaDatum?.toISOString() ?? null } : null,
  }));
}

/** „Moji vaučeri" programa i lanca — bez dinara. */
export async function mojiVauceriLanca(userId: string) {
  const v = await prisma.lanacVaucer.findMany({
    where: { imalacId: userId },
    orderBy: { dodeljenAt: "desc" },
    take: 50,
    select: {
      id: true, kod: true, status: true, ponisteno: true, dodeljenAt: true, pristanakPovucenAt: true,
      lanac: { select: { naziv: true, kolicinaPoVauceru: true, spremnoAt: true, karike: { where: { uloga: "POSLEDNJI" }, select: { naziv: true, mestoPredaje: true, adresaPredaje: true } } } },
    },
  });
  return v.map((x) => {
    const p = x.lanac.karike[0];
    const rok = x.dodeljenAt ? rokPreuzimanja(x.lanac.spremnoAt, x.dodeljenAt) : null;
    return {
      id: x.id,
      kod: x.status === "DODELJEN" ? x.kod : null,
      status: x.status,
      poen: x.ponisteno,
      naziv: x.lanac.naziv,
      kolicina: x.lanac.kolicinaPoVauceru,
      objekat: p?.naziv ?? "",
      mesto: p ? (p.adresaPredaje ? `${p.mestoPredaje}, ${p.adresaPredaje}` : p.mestoPredaje) : "",
      spremno: !!x.lanac.spremnoAt,
      rok: rok?.toISOString() ?? null,
      pristanakPovucen: !!x.pristanakPovucenAt,
    };
  });
}

/** Karike i prijave korisnika (gazdinstvo, objekat, partner) — radni ekran. */
export async function mojRadULancu(userId: string) {
  const [pozivi, prijave, karike] = await Promise.all([
    prisma.lanacPoziv.findMany({ where: { zatvorenAt: null }, orderBy: { objavljenAt: "desc" }, select: { id: true, naziv: true, opis: true, uslovi: true, rokObradeDana: true, objavljenAt: true } }),
    prisma.lanacPrijava.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, pozivId: true, uloga: true, naziv: true, mesto: true, status: true, razlogOdbijanja: true, createdAt: true } }),
    prisma.lanacKarika.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        lanac: {
          select: {
            id: true, vrsta: true, naziv: true, status: true, spremnoAt: true, brojVaucera: true, vrstaHrane: true, jedinica: true,
            karike: { orderBy: { redniBroj: "asc" }, select: { id: true, redniBroj: true, uloga: true, naziv: true, userId: true, ugovorPrihvacenAt: true } },
            predaje: { orderBy: { zabelezenoAt: "asc" }, select: { id: true, odKarikaId: true, doKarikaId: true, kolicina: true, oznakeZivotinja: true, obimUsluge: true, predaoId: true, primioId: true, predaoPotvrdioAt: true, potvrdaFondacijeAt: true, zabelezenoAt: true } },
            _count: { select: { vauceri: { where: { OR: [{ status: "SLOBODAN" }, { status: "ISTEKAO", nepreuzetIshod: null }] } } } },
          },
        },
      },
    }),
  ]);
  const sada = new Date();
  return {
    pozivi,
    prijave,
    karike: karike.map((k) => {
      const l = k.lanac;
      const zabelezene = new Set(l.predaje.map((p) => p.odKarikaId));
      const iSledece = l.karike.findIndex((x, idx) => idx < l.karike.length - 1 && !zabelezene.has(x.id));
      const sledecaPrima = iSledece >= 0 ? l.karike[iSledece + 1] : null;
      return {
        id: k.id,
        uloga: k.uloga as UlogaKarike,
        naziv: k.naziv,
        ugovorTekst: k.ugovorTekst,
        ugovorPrihvacenAt: k.ugovorPrihvacenAt?.toISOString() ?? null,
        izvrsenoPrijavljenoAt: k.izvrsenoPrijavljenoAt?.toISOString() ?? null,
        izvrsenjeUtvrdjenoAt: k.izvrsenjeUtvrdjenoAt?.toISOString() ?? null,
        lanac: {
          id: l.id, vrsta: l.vrsta, naziv: l.naziv, status: l.status, spremno: !!l.spremnoAt, vrstaHrane: l.vrstaHrane, jedinica: l.jedinica,
          nepreuzetiMogu: l.vrsta === "PROGRAM_HRANE" && k.uloga === "POSLEDNJI" && l.status === "VAUCERI_IZDATI" && rokZaNepreuzeteIstekao(l.spremnoAt, sada) && l._count.vauceri > 0,
        },
        mozeBeleziPredaju: !!sledecaPrima && sledecaPrima.userId === userId && l.status === "PRIPREMA",
        prvaPredaja: iSledece === 0,
        zaPotvrdu: l.predaje.filter((p) => p.predaoId === userId && !p.predaoPotvrdioAt).map((p) => ({ id: p.id, kolicina: Number(p.kolicina), oznakeZivotinja: p.oznakeZivotinja, obimUsluge: p.obimUsluge == null ? null : Number(p.obimUsluge) })),
      };
    }),
  };
}

/** Admin pregled: pozivi, prijave na pregledu, lanci sa karikama i predajama. */
export async function pregledZaAdmina() {
  const [pozivi, prijave, lanci] = await Promise.all([
    prisma.lanacPoziv.findMany({ orderBy: { objavljenAt: "desc" }, take: 50 }),
    prisma.lanacPrijava.findMany({ where: { status: { in: ["NA_PREGLEDU", "PRIHVACENA"] } }, orderBy: { createdAt: "asc" }, take: 200 }),
    prisma.lanac.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        karike: { orderBy: { redniBroj: "asc" } },
        predaje: { orderBy: { zabelezenoAt: "asc" } },
        doprinosi: { orderBy: { zabelezenAt: "asc" } },
        _count: { select: { vauceri: true } },
      },
    }),
  ]);
  const ids = new Set<string>([...prijave.map((p) => p.userId), ...lanci.flatMap((l) => l.karike.map((k) => k.userId))]);
  const korisnici = await prisma.user.findMany({ where: { id: { in: [...ids] } }, select: { id: true, pseudonim: true } });
  const ps = new Map(korisnici.map((u) => [u.id, u.pseudonim]));
  const vauceriPoStatusu = await prisma.lanacVaucer.groupBy({ by: ["lanacId", "status"], where: { lanacId: { in: lanci.map((l) => l.id) } }, _count: { _all: true } });
  return {
    pozivi,
    prijave: prijave.map((p) => ({ ...p, pseudonim: ps.get(p.userId) ?? "", hranaKoeficijent: p.hranaKoeficijent == null ? null : Number(p.hranaKoeficijent), cenovnikCena: p.cenovnikCena == null ? null : Number(p.cenovnikCena), uslugaCena: p.uslugaCena == null ? null : Number(p.uslugaCena) })),
    lanci: lanci.map((l) => ({
      ...l,
      koeficijentSirovine: l.koeficijentSirovine == null ? null : Number(l.koeficijentSirovine),
      dodatakDistribucijePct: l.dodatakDistribucijePct == null ? null : Number(l.dodatakDistribucijePct),
      karike: l.karike.map((k) => ({ ...k, pseudonim: ps.get(k.userId) ?? "", cenaPoJedinici: k.cenaPoJedinici == null ? null : Number(k.cenaPoJedinici), obim: k.obim == null ? null : Number(k.obim), koeficijent: Number(k.koeficijent) })),
      predaje: l.predaje.map((p) => ({ ...p, kolicina: Number(p.kolicina), obimUsluge: p.obimUsluge == null ? null : Number(p.obimUsluge), cenaPoJedinici: p.cenaPoJedinici == null ? null : Number(p.cenaPoJedinici), vrednostRsd: p.vrednostRsd == null ? null : Number(p.vrednostRsd) })),
      doprinosi: l.doprinosi.map((d) => ({ ...d, vrednostRsd: Number(d.vrednostRsd), koeficijent: Number(d.koeficijent) })),
      vauceri: Object.fromEntries(vauceriPoStatusu.filter((v) => v.lanacId === l.id).map((v) => [v.status, v._count._all])),
    })),
  };
}

/**
 * Izveštaj (čl. 37 st. 2, čl. 47): vrednost u dinarima — predato (masa × cena, izvor cene i STIPS
 * snimak), usluge i dodatak — uz zbir evidentiranih doprinosa i poništenja. Samo za admin panel i
 * izveštaj o raspolaganju sredstvima Fondacije, nikad uz broj POEN-a na ekranu korisnika.
 */
export async function izvestajLanca(lanacId: string) {
  const l = await prisma.lanac.findUnique({
    where: { id: lanacId },
    include: { karike: { orderBy: { redniBroj: "asc" } }, predaje: { orderBy: { zabelezenoAt: "asc" } }, doprinosi: true },
  });
  if (!l) throw new LanacGreska("Lanac nije pronađen.", 404);
  const [ponisteno, ispravljeno, otpisano] = await Promise.all([
    prisma.lanacVaucer.aggregate({ where: { lanacId, ponistenjeTxId: { not: null }, prenetIzId: null }, _sum: { ponisteno: true } }),
    prisma.lanacVaucer.aggregate({ where: { lanacId, ispravkaTxId: { not: null } }, _sum: { ponisteno: true } }),
    prisma.lanacVaucer.aggregate({ where: { lanacId }, _sum: { otpisano: true } }),
  ]);
  return {
    naziv: l.naziv,
    vrsta: l.vrsta,
    predaje: l.predaje.map((p) => ({ kolicina: Number(p.kolicina), cenaIzvor: p.cenaIzvor, cenaPoJedinici: p.cenaPoJedinici == null ? null : Number(p.cenaPoJedinici), vrednostRsd: p.vrednostRsd == null ? null : Number(p.vrednostRsd), stipsKategorija: p.stipsKategorija, stipsBiltenId: p.stipsBiltenId, stipsSnimak: p.stipsSnimak })),
    usluge: l.karike.filter((k) => k.uloga !== "DAVALAC_SIROVINE").map((k) => ({ naziv: k.naziv, vrednostRsd: vrednostUsluge(dec(k.cenaPoJedinici), dec(k.obim)) })),
    doprinosi: l.doprinosi.map((d) => ({ osnov: d.osnov, status: d.status, vrednostRsd: Number(d.vrednostRsd), iznos: d.iznos })),
    ponisteno: ponisteno._sum.ponisteno ?? 0,
    ispravljeno: ispravljeno._sum.ponisteno ?? 0,
    otpisano: otpisano._sum.otpisano ?? 0,
  };
}

/** GDPR izvoz (Politika; ZZPL čl. 36): prijave, karike sa ugovorom, zapisnici i vaučeri korisnika. */
export async function eksportLanca(userId: string) {
  const [prijave, karike, predaje, vauceri] = await Promise.all([
    prisma.lanacPrijava.findMany({
      where: { userId },
      select: { uloga: true, naziv: true, mesto: true, adresa: true, bpg: true, brojOdobrenja: true, hranaOdgovori: true, hranaKategorija: true, cenovnikCena: true, uslugaOpis: true, uslugaJedinica: true, uslugaCena: true, izjavaAt: true, izjavaTekst: true, status: true, createdAt: true },
    }),
    prisma.lanacKarika.findMany({
      where: { userId },
      select: { uloga: true, naziv: true, mestoPredaje: true, ugovorTekst: true, ugovorPrihvacenAt: true, izvrsenoPrijavljenoAt: true, izvrsenjeUtvrdjenoAt: true, lanac: { select: { naziv: true, vrsta: true } } },
    }),
    prisma.lanacPredaja.findMany({
      where: { OR: [{ predaoId: userId }, { primioId: userId }] },
      select: { kolicina: true, oznakeZivotinja: true, obimUsluge: true, zabelezenoAt: true, predaoPotvrdioAt: true, cenaIzvor: true, cenaPoJedinici: true, vrednostRsd: true, lanac: { select: { naziv: true } } },
    }),
    prisma.lanacVaucer.findMany({
      where: { imalacId: userId },
      select: { status: true, dodeljenAt: true, ponisteno: true, iskoriscenAt: true, izjavaNepovezanAt: true, pristanakPrikazAt: true, pristanakPrikazTekst: true, pristanakPovucenAt: true, lanac: { select: { naziv: true } } },
    }),
  ]);
  return {
    prijave: prijave.map((p) => ({ ...p, cenovnikCena: p.cenovnikCena == null ? null : Number(p.cenovnikCena), uslugaCena: p.uslugaCena == null ? null : Number(p.uslugaCena) })),
    karike,
    zapisnici: predaje.map((p) => ({ ...p, kolicina: Number(p.kolicina), obimUsluge: p.obimUsluge == null ? null : Number(p.obimUsluge), cenaPoJedinici: p.cenaPoJedinici == null ? null : Number(p.cenaPoJedinici), vrednostRsd: p.vrednostRsd == null ? null : Number(p.vrednostRsd) })),
    vauceri,
  };
}
