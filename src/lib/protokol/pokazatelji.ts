/**
 * Pokazatelji zdravlja i koncentracije (`/sistem/zdravlje`). Formule, smernice i
 * prag malog broja su u `src/lib/pokazatelji-pravila.ts`; ovde se samo čita baza.
 *
 * 🔴 Merenje samo nad živim (CLAUDE.md pravilo 19, `docs/merenje-stanja.md`); dete
 * ne ulazi ni u jedan pokazatelj — u razmenu i aktivnost ne, a u koncentraciju po
 * prirodi ne (nema ZRNO). 🔴 Ništa odavde ne vraća identifikator lica, i nijedan
 * upit ne grupiše prepise po paru strana (praćenje obrazaca prepisa je odbijena
 * mera); iz prepisa se čita samo da li je strana osnivač i koliko je različitih
 * strana bilo. 🔴 Pokazatelji nemaju dejstvo: ovaj modul ne poziva nijedan servis
 * koji menja stanje; piše samo sopstveni snimak (`PokazateljDan`) i oznaku stalne
 * ponude gazdinstva (`ponudaNeprekidnoOd`). Brana: `__tests__/koncentracija-izvor.test.ts`.
 */
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { USLOV_CLANA_U_SPISKU } from "@/lib/clanovi-spisak";
import { USLOVI_STATUSA } from "@/lib/admin-clanovi";
import { USLOV_RAZMENE } from "@/lib/razmena-brojac-pravila";
import { normalizujLokaciju } from "@/lib/lokacija-kljuc";
import { MIN_ZADRUGARA } from "@/lib/zadruga-pravila";
import { glasackaMoc, razresiGlasackuMoc, smeAktiviratiZrno } from "@/lib/gornje-kolo-pravila";
import { IZBOR_STATUSA, statusUcesnika } from "./status";
import { stanjeSpiskaZaPoziv } from "./zahtev-razgovor";
import { danObracuna, prethodniDan } from "./obracunski-dan";
import {
  DANA_STALNE_PONUDE,
  MIN_LICA_U_ZBIRU,
  MIN_SASTAV_ZA_MOC,
  POKAZATELJI,
  PROZOR_DANA,
  PROZOR_ULASKA_DANA,
  deoNajvecih,
  efektivanBroj,
  iskaziAkoDovoljno,
  lampica,
  najmanjiBrojZaVecinu,
  procenat,
  smeVidetiPokazatelj,
  type DefinicijaPokazatelja,
  type Lampica,
  type SifraPokazatelja,
} from "@/lib/pokazatelji-pravila";

export * from "@/lib/pokazatelji-pravila";

const PROTOKOL_WALLET_ID = "banka-singleton";
const DAN_MS = 24 * 3600 * 1000;

/** Zašto je lampica siva. */
export type RazlogSivog = "PREMALO" | "FAZA_1" | "NEMA_PODATAKA" | "KANAL_NIJE_POCEO";

export type StanjePokazatelja = DefinicijaPokazatelja & {
  vrednost: number | null;
  lampica: Lampica;
  razlog: RazlogSivog | null;
  /** Brojevi za rečenicu ispod vrednosti (npr. „x od y“); samo kad je vrednost iskazana. */
  detalj: Record<string, number> | null;
};

const ZIV_PUNOLETAN = { ...USLOV_CLANA_U_SPISKU, maloletan: false } as const;
/** Tipovi upisa kroz kanal doprinosa (Protokol → zapis); otpis ZRNA i ispravke nisu kanal. */
const KANALI_UPISA = Object.values(TransactionType).filter((t) => t.startsWith("EMISIJA_"));
const DINARSKI_KANALI = new Set(["EMISIJA_DONACIJA", "EMISIJA_POKROVITELJ", "EMISIJA_POKROVITELJ_DOBRA"]);

type Rezultat = { vrednost: number | null; razlog?: RazlogSivog; detalj?: Record<string, number> };
const sivo = (razlog: RazlogSivog): Rezultat => ({ vrednost: null, razlog });

/**
 * Sva stanja pokazatelja koje posmatrač sme da vidi, u redosledu iz `POKAZATELJI`.
 */
export async function izracunajPokazatelje(
  posmatrac: { ucesnik: boolean; admin: boolean },
  sada: Date = new Date(),
): Promise<StanjePokazatelja[]> {
  const vidljivi = POKAZATELJI.filter((p) => smeVidetiPokazatelj(p.vidi, posmatrac));
  const r = await racunaj(new Set(vidljivi.map((p) => p.sifra)), sada);
  return vidljivi.map((p) => {
    const x = r.get(p.sifra) ?? sivo("NEMA_PODATAKA");
    const vrednost = x.vrednost;
    return {
      ...p,
      vrednost,
      lampica: vrednost === null ? "SIVO" : lampica(vrednost, p.smernica),
      razlog: vrednost === null ? (x.razlog ?? "NEMA_PODATAKA") : null,
      detalj: vrednost === null ? null : (x.detalj ?? null),
    };
  });
}

async function racunaj(trazeno: Set<SifraPokazatelja>, sada: Date): Promise<Map<SifraPokazatelja, Rezultat>> {
  const out = new Map<SifraPokazatelja, Rezultat>();
  const od30 = new Date(sada.getTime() - PROZOR_DANA * DAN_MS);
  const od90 = new Date(sada.getTime() - PROZOR_ULASKA_DANA * DAN_MS);

  const punoletnih = await prisma.user.count({ where: ZIV_PUNOLETAN });

  // ── Z1, Z2: razmena (30 dana), obe strane žive i punoletne ─────────────────
  if (trazeno.has("Z1") || trazeno.has("Z2")) {
    const razmene = await prisma.transaction.findMany({
      where: {
        ...USLOV_RAZMENE,
        createdAt: { gte: od30 },
        fromWallet: { user: ZIV_PUNOLETAN },
        toWallet: { user: ZIV_PUNOLETAN },
      },
      select: {
        fromWallet: { select: { user: { select: { id: true, jeOsnivac: true } } } },
        toWallet: { select: { user: { select: { id: true, jeOsnivac: true } } } },
      },
    });
    const ukupno = razmene.length;
    const neosnivacke = razmene.filter((t) => !t.fromWallet?.user?.jeOsnivac && !t.toWallet?.user?.jeOsnivac).length;
    out.set(
      "Z1",
      ukupno < MIN_LICA_U_ZBIRU ? sivo("PREMALO") : { vrednost: procenat(neosnivacke, ukupno), detalj: { deo: neosnivacke, ukupno } },
    );
    // Samo BROJ različitih strana — ko sa kim, ne čita se i ne vraća.
    const strane = new Set<string>();
    for (const t of razmene) {
      if (t.fromWallet?.user) strane.add(t.fromWallet.user.id);
      if (t.toWallet?.user) strane.add(t.toWallet.user.id);
    }
    out.set(
      "Z2",
      punoletnih < MIN_LICA_U_ZBIRU
        ? sivo("PREMALO")
        : { vrednost: procenat(strane.size, punoletnih), detalj: { deo: strane.size, ukupno: punoletnih } },
    );
  }

  // ── Z3: put ulaska u Kolo (90 dana) ────────────────────────────────────────
  if (trazeno.has("Z3")) {
    const uslov = { vremenskiZig: { gte: od90 }, verifikovani: ZIV_PUNOLETAN };
    const [ukupno, poPozivu] = await Promise.all([
      prisma.verifikacionaVeza.count({ where: uslov }),
      prisma.verifikacionaVeza.count({ where: { ...uslov, poPozivu: true } }),
    ]);
    out.set(
      "Z3",
      ukupno < MIN_LICA_U_ZBIRU ? sivo("PREMALO") : { vrednost: procenat(poPozivu, ukupno), detalj: { deo: poPozivu, ukupno } },
    );
  }

  // ── Z4: spisak za poziv ────────────────────────────────────────────────────
  if (trazeno.has("Z4")) {
    const { naSpisku, zakasnelih } = await stanjeSpiskaZaPoziv(sada);
    out.set(
      "Z4",
      naSpisku === 0 ? sivo("NEMA_PODATAKA") : { vrednost: procenat(zakasnelih, naSpisku), detalj: { deo: zakasnelih, ukupno: naSpisku } },
    );
  }

  // ── Z5: gazdinstva sa stalnom ponudom ─────────────────────────────────────
  if (trazeno.has("Z5")) {
    const gazd = { status: "ODOBRENO" as const, obrisanoAt: null };
    const [ukupno, stalnih] = await Promise.all([
      prisma.gazdinstvo.count({ where: gazd }),
      prisma.gazdinstvo.count({
        where: { ...gazd, ponudaNeprekidnoOd: { lte: new Date(sada.getTime() - DANA_STALNE_PONUDE * DAN_MS) } },
      }),
    ]);
    out.set(
      "Z5",
      ukupno < MIN_LICA_U_ZBIRU ? sivo("PREMALO") : { vrednost: procenat(stalnih, ukupno), detalj: { deo: stalnih, ukupno } },
    );
  }

  // ── Z6: zadruge sa dovoljno zadrugara (zadrugar koji nije učesnik miruje) ──
  if (trazeno.has("Z6")) {
    const zadruge = await prisma.krug.findMany({
      where: { zadruga: true, prestanakAt: null, status: "ACTIVE" },
      select: {
        _count: {
          select: {
            memberships: { where: { leftAt: null, user: { AND: [USLOV_CLANA_U_SPISKU, USLOVI_STATUSA.verifikovan] } } },
          },
        },
      },
    });
    const dovoljno = zadruge.filter((z) => z._count.memberships >= MIN_ZADRUGARA).length;
    out.set(
      "Z6",
      zadruge.length === 0
        ? sivo("NEMA_PODATAKA")
        : { vrednost: procenat(dovoljno, zadruge.length), detalj: { deo: dovoljno, ukupno: zadruge.length } },
    );
  }

  // ── Z7: deo projekata u odlivu Fondacije (tekuća godina; samo procenat) ────
  if (trazeno.has("Z7")) {
    const god = sada.getFullYear();
    const uGodini = { datum: { gte: new Date(god, 0, 1), lt: new Date(god + 1, 0, 1) } };
    const [proj, oper] = await Promise.all([
      prisma.projekatTrosak.aggregate({ where: uGodini, _sum: { iznosRSD: true } }),
      prisma.fondacijaTrosak.aggregate({ where: uGodini, _sum: { iznosRSD: true } }),
    ]);
    const p = Number(proj._sum.iznosRSD ?? 0);
    const o = Number(oper._sum.iznosRSD ?? 0);
    // 🔴 Iskazuje se samo procenat — dinarski iznos ne stoji na ovoj stranici,
    // koja nosi i pokazatelje POEN-a (odnos se ne sme dobiti deljenjem).
    out.set("Z7", p + o === 0 ? sivo("NEMA_PODATAKA") : { vrednost: procenat(p, p + o) });
  }

  // ── Z8: mesta sa dovoljno aktivnih naloga ──────────────────────────────────
  if (trazeno.has("Z8")) {
    const mesta = await prisma.user.findMany({ where: ZIV_PUNOLETAN, select: { location: true } });
    const poMestu = new Map<string, number>();
    for (const m of mesta) {
      const k = normalizujLokaciju(m.location);
      if (k) poMestu.set(k, (poMestu.get(k) ?? 0) + 1);
    }
    const dovoljna = [...poMestu.values()].filter((n) => n >= MIN_LICA_U_ZBIRU).length;
    out.set("Z8", { vrednost: dovoljna, detalj: { ukupno: poMestu.size } });
  }

  // ── Z9: aktivni 30 dana ────────────────────────────────────────────────────
  if (trazeno.has("Z9")) {
    const aktivni = await prisma.aktivnostLog.findMany({
      where: { createdAt: { gte: od30 }, user: ZIV_PUNOLETAN },
      distinct: ["userId"],
      select: { userId: true },
    });
    out.set(
      "Z9",
      punoletnih < MIN_LICA_U_ZBIRU
        ? sivo("PREMALO")
        : { vrednost: procenat(aktivni.length, punoletnih), detalj: { deo: aktivni.length, ukupno: punoletnih } },
    );
  }

  // ── Z10: nalozi u nadoknadi (admin) ────────────────────────────────────────
  if (trazeno.has("Z10")) {
    const uMinusu = await prisma.user.count({ where: { ...ZIV_PUNOLETAN, wallet: { balance: { lt: 0 } } } });
    out.set(
      "Z10",
      punoletnih === 0 ? sivo("NEMA_PODATAKA") : { vrednost: procenat(uMinusu, punoletnih), detalj: { deo: uMinusu, ukupno: punoletnih } },
    );
  }

  // ── Z11: nabavke u kojima je odlučivalo prvenstvo ──────────────────────────
  if (trazeno.has("Z11")) {
    const nabavke = await prisma.nabavka.findMany({
      where: { brojDelova: { not: null }, status: { in: ["RED_UTVRDJEN", "PLACENA", "ZAVRSENA"] } },
      select: { brojDelova: true, _count: { select: { prijave: true } } },
    });
    const prepunjene = nabavke.filter((n) => n._count.prijave > (n.brojDelova ?? 0)).length;
    out.set(
      "Z11",
      nabavke.length === 0
        ? sivo("NEMA_PODATAKA")
        : { vrednost: procenat(prepunjene, nabavke.length), detalj: { deo: prepunjene, ukupno: nabavke.length } },
    );
  }

  // ── K1, K2: zapisi POEN-a živih punoletnih ─────────────────────────────────
  if (trazeno.has("K1") || trazeno.has("K2")) {
    const zapisi = await prisma.wallet.findMany({
      where: { user: ZIV_PUNOLETAN },
      select: { balance: true, user: { select: { jeOsnivac: true } } },
    });
    const pozitivna = zapisi.filter((w) => w.balance > 0);
    const ukupno = pozitivna.reduce((s, w) => s + w.balance, 0);
    out.set("K1", { vrednost: deoNajvecih(pozitivna.map((w) => w.balance), 10), razlog: "PREMALO" });
    const osnivacki = pozitivna.filter((w) => w.user?.jeOsnivac);
    const zbirOsnivaca = osnivacki.reduce((s, w) => s + w.balance, 0);
    out.set("K2", { vrednost: iskaziAkoDovoljno(osnivacki.length, procenat(zbirOsnivaca, ukupno)), razlog: "PREMALO" });
  }

  // ── K3: osnivački kanal ────────────────────────────────────────────────────
  if (trazeno.has("K3")) {
    const [kanal, protokol] = await Promise.all([
      prisma.osnivackiKanal.findUnique({ where: { id: "singleton" }, select: { ukupnoEvidentirano: true, brojKoraka: true } }),
      prisma.wallet.findUnique({ where: { id: PROTOKOL_WALLET_ID }, select: { balance: true } }),
    ]);
    const opticaj = Math.abs(protokol?.balance ?? 0);
    out.set(
      "K3",
      !kanal || kanal.brojKoraka === 0
        ? sivo("KANAL_NIJE_POCEO")
        : { vrednost: procenat(kanal.ukupnoEvidentirano, opticaj), detalj: { koraka: kanal.brojKoraka } },
    );
  }

  // ── K4, K4D: sastav evidentiranog doprinosa po kanalu (bruto upis) ─────────
  if (trazeno.has("K4") || trazeno.has("K4D")) {
    // Samo strana Protokola (upis kroz kanal) — nijedan par korisnik–korisnik.
    const poTipu = await prisma.transaction.groupBy({
      by: ["type"],
      where: { fromWalletId: PROTOKOL_WALLET_ID, type: { in: KANALI_UPISA } },
      _sum: { amount: true },
    });
    const iznosi = poTipu.map((g) => ({ tip: String(g.type), iznos: g._sum.amount ?? 0 }));
    const dinarski = iznosi.filter((x) => DINARSKI_KANALI.has(x.tip)).reduce((s, x) => s + x.iznos, 0);
    const ostali = iznosi.filter((x) => !DINARSKI_KANALI.has(x.tip));
    const zbirOstalih = ostali.reduce((s, x) => s + x.iznos, 0);
    const najveci = ostali.reduce((m, x) => Math.max(m, x.iznos), 0);
    // 🔴 Javni K4 se računa BEZ dinarskih kanala i u imeniocu — inače bi se iz njega
    // i opticaja izveo deo POEN-a iz donacija (odluka vlasnika 2a: tačno samo admin).
    out.set("K4", zbirOstalih === 0 ? sivo("NEMA_PODATAKA") : { vrednost: procenat(najveci, zbirOstalih) });
    out.set("K4D", dinarski + zbirOstalih === 0 ? sivo("NEMA_PODATAKA") : { vrednost: procenat(dinarski, dinarski + zbirOstalih) });
  }

  // ── K5: upisano ZRNO ───────────────────────────────────────────────────────
  if (trazeno.has("K5")) {
    const stanja = await prisma.zrnoStanje.findMany({
      where: { user: ZIV_PUNOLETAN },
      select: { slobodno: true, aktivno: true },
    });
    const upisano = stanja.map((s) => s.slobodno + s.aktivno).filter((x) => x > 0);
    const zbir = upisano.reduce((s, x) => s + x, 0);
    out.set(
      "K5",
      upisano.length === 0
        ? sivo("FAZA_1")
        : { vrednost: deoNajvecih(upisano, 5), razlog: "PREMALO", detalj: { upisano: zbir, imalaca: upisano.length } },
    );
  }

  // ── K6–K9: glasačka moć perioda (posle delegiranja) ────────────────────────
  if (["K6", "K7", "K8", "K9"].some((s) => trazeno.has(s as SifraPokazatelja))) {
    const moc = await mocPerioda();
    const k = ["K6", "K7", "K8", "K9"] as const;
    if (!moc) {
      for (const s of k) out.set(s, sivo("FAZA_1"));
    } else if (moc.cuvara < MIN_SASTAV_ZA_MOC) {
      for (const s of k) out.set(s, { ...sivo("PREMALO"), detalj: { cuvara: moc.cuvara } });
    } else {
      const glasaci = moc.posleDelegiranja.filter((m) => m > 0);
      const ukupno = glasaci.reduce((s, m) => s + m, 0);
      const ef = efektivanBroj(glasaci);
      out.set("K6", { vrednost: najmanjiBrojZaVecinu(glasaci), detalj: { glasaca: glasaci.length } });
      out.set("K7", { vrednost: ef === null ? null : procenat(ef, glasaci.length), detalj: { efektivno: Math.round((ef ?? 0) * 10) / 10, glasaca: glasaci.length } });
      out.set("K8", { vrednost: moc.ublazavanje });
      out.set("K9", { vrednost: procenat(moc.delegirano, ukupno), detalj: { delegiralo: moc.delegiralo } });
    }
  }

  // ── K10: poslednje zatvoreno glasanje ──────────────────────────────────────
  if (trazeno.has("K10")) {
    const predlog = await prisma.glasanjePredlog.findFirst({
      where: { status: "CLOSED" },
      orderBy: { deadline: "desc" },
      select: { glasovi: { select: { glasackaGlasova: true } } },
    });
    if (!predlog) out.set("K10", sivo("FAZA_1"));
    else {
      const tezine = predlog.glasovi.map((g) => g.glasackaGlasova).filter((x) => x > 0);
      out.set(
        "K10",
        tezine.length < MIN_SASTAV_ZA_MOC
          ? sivo("PREMALO")
          : { vrednost: najmanjiBrojZaVecinu(tezine), detalj: { glasaca: tezine.length } },
      );
    }
  }

  return out;
}

/**
 * Glasačka moć za tekući obračunski period, zbirno: koliko je čuvara u sastavu,
 * moć svakoga ko glasa lično posle delegiranja (bez identiteta), koliko je moći
 * delegirano i koliko koren ublažava kod najvećih. `null` dok Gornje Kolo ne postoji.
 */
async function mocPerioda(): Promise<{
  cuvara: number;
  posleDelegiranja: number[];
  delegirano: number;
  delegiralo: number;
  ublazavanje: number | null;
} | null> {
  const kanal = await prisma.zrnoKanal.findUnique({ where: { id: "singleton" }, select: { isActive: true } });
  if (!kanal?.isActive) return null;

  const [stanja, delegacije] = await Promise.all([
    prisma.zrnoStanje.findMany({
      where: { aktivno: { gt: 0 }, user: ZIV_PUNOLETAN },
      select: { userId: true, aktivno: true, user: { select: { id: true, ...IZBOR_STATUSA } } },
    }),
    prisma.zrnoDelegacija.findMany({ where: { delegatId: { not: null } }, select: { delegatorId: true, delegatId: true } }),
  ]);
  const sastav = stanja.filter((s) => smeAktiviratiZrno(statusUcesnika(s.user)));
  const cuvari = new Set(sastav.map((s) => s.userId));
  const baza = new Map<string, number>();
  for (const s of sastav) baza.set(s.userId, glasackaMoc(s.aktivno));
  const next = new Map<string, string>();
  for (const d of delegacije) next.set(d.delegatorId, d.delegatId!);

  const posle = sastav.map((s) => razresiGlasackuMoc(next, baza, s.userId, cuvari));
  let delegirano = 0;
  sastav.forEach((s, i) => {
    if (posle[i] > 0) delegirano += posle[i] - (baza.get(s.userId) ?? 0);
  });
  const delegiralo = sastav.filter((s) => next.has(s.userId)).length;

  // K8: deo moći 5 najvećih (pre delegiranja) kao procenat njihovog dela aktivnog ZRNA.
  let ublazavanje: number | null = null;
  if (sastav.length >= 10) {
    const poZrnu = [...sastav].sort((a, b) => b.aktivno - a.aktivno);
    const zbirZrna = poZrnu.reduce((s, x) => s + x.aktivno, 0);
    const zbirMoci = poZrnu.reduce((s, x) => s + (baza.get(x.userId) ?? 0), 0);
    const vrh = poZrnu.slice(0, 5);
    const deoZrna = vrh.reduce((s, x) => s + x.aktivno, 0) / zbirZrna;
    const deoMoci = vrh.reduce((s, x) => s + (baza.get(x.userId) ?? 0), 0) / zbirMoci;
    ublazavanje = deoZrna > 0 ? Math.round((deoMoci / deoZrna) * 1000) / 10 : null;
  }

  return { cuvara: sastav.length, posleDelegiranja: posle, delegirano, delegiralo, ublazavanje };
}

// ── Noćni obračun ─────────────────────────────────────────────────────────────

/** Uslov „gazdinstvo danas ima ponudu“: bar jedan odobren član, živ, sa aktivnim oglasom kojim nudi. */
const IMA_PONUDU = {
  clanovi: {
    some: {
      status: "ODOBREN" as const,
      istupioAt: null,
      user: { ...ZIV_PUNOLETAN, listings: { some: { status: "ACTIVE" as const, tip: "PONUDA" as const } } },
    },
  },
};

/**
 * Stanje „stalne ponude“ gazdinstava (Z5), jednom dnevno: gazdinstvu koje danas ima
 * ponudu, a nema upisan početak, upisuje se današnji dan; gazdinstvu bez ponude
 * početak se briše. Dan bez ponude prekida niz.
 */
export async function azurirajStalnuPonudu(sada: Date = new Date()): Promise<{ pocelo: number; prekinuto: number }> {
  const odobreno = { status: "ODOBRENO" as const, obrisanoAt: null };
  const [pocelo, prekinuto] = await Promise.all([
    prisma.gazdinstvo.updateMany({
      where: { ...odobreno, ponudaNeprekidnoOd: null, ...IMA_PONUDU },
      data: { ponudaNeprekidnoOd: sada },
    }),
    prisma.gazdinstvo.updateMany({
      where: { ponudaNeprekidnoOd: { not: null }, OR: [{ NOT: IMA_PONUDU }, { NOT: odobreno }] },
      data: { ponudaNeprekidnoOd: null },
    }),
  ]);
  return { pocelo: pocelo.count, prekinuto: prekinuto.count };
}

/**
 * Dnevni snimak svih pokazatelja (`PokazateljDan`), sa vrednošću i lampicom — bez
 * ijednog identifikatora lica. Isti dan se ne upisuje dvaput (ponovljen cron).
 */
export async function zapisiDnevniSnimak(datum: Date, sada: Date = new Date()): Promise<number> {
  const stanja = await izracunajPokazatelje({ ucesnik: true, admin: true }, sada);
  const vrednosti = Object.fromEntries(stanja.map((p) => [p.sifra, { v: p.vrednost, l: p.lampica }]));
  // Snimak nosi dan koji se upravo završio (obračunski dan po srpskom vremenu).
  const dan = prethodniDan(danObracuna(datum));
  await prisma.pokazateljDan.upsert({ where: { date: dan }, create: { date: dan, vrednosti }, update: {} });
  return stanja.length;
}
