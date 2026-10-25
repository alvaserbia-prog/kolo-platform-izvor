/**
 * Kutija želja u dečjem prostoru — servis (whitepaper 5.0, pogl. 7; odluka vlasnika
 * 25.10.2026). Re-eksportuje čista pravila iz `src/lib/kutija-zelja-pravila.ts`, pa
 * server ima jedan ulaz.
 *
 * Tok: dete šalje predlog (`NA_PREGLEDU`) → Fondacija ga pregleda i prikaže
 * (`PRIKAZAN`) ili odbije uz razlog koji se detetu prikazuje (`ODBIJEN`) → druga deca
 * ga podržavaju, po jedan glas → Fondacija odgovara obrazloženo (`ODGOVOREN`).
 *
 * 🔴 Ovde nema POEN-a ni kanala emisije — predlog ne donosi ništa i ne obavezuje
 * Fondaciju. 🔴 Autor (`autorId`) ne izlazi iz ovog modula ni prema detetu, ni prema
 * roditelju, ni prema adminu. Sve izmene idu u `prisma.$transaction()`; obaveštenja
 * idu posle nje i ne bacaju.
 */
import { prisma } from "@/lib/prisma";
import { Prisma, UserStatus } from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";
import { beogradskiDan } from "./obracunski-dan";
import { ucitajUcesnika } from "./deca";
import {
  STANJA_PRIKAZA,
  ocistiTekst,
  poredak,
  prikaziZelju,
  proveriOdluku,
  proveriTekst,
  smePodrzati,
  smePovuci,
  smePredloziti,
  smeUKutiju,
  type PrikazZelje,
  type RadnjaFondacije,
  type StanjeZelje,
} from "@/lib/kutija-zelja-pravila";

export * from "@/lib/kutija-zelja-pravila";

type Tx = Prisma.TransactionClient;

export class KutijaGreska extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function baci(p: { ok: true } | { ok: false; razlog: string; status: number }) {
  if (!p.ok) throw new KutijaGreska(p.razlog, p.status);
}

/**
 * Proverava da je posmatrač dete koje sme u Kutiju (dete sa roditeljem ili dete
 * Kola, živ nalog). Baca za svaki drugi nalog — punoletni ne dobija ništa.
 */
export async function deteUKutijiIliBaci(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, deaktiviranAt: true, maloletan: true },
  });
  if (!u || u.status !== UserStatus.ACTIVE || u.deaktiviranAt) {
    throw new KutijaGreska("Pristup odbijen.", 403);
  }
  const ucesnik = await ucitajUcesnika(userId);
  baci(smeUKutiju({ maloletan: u.maloletan, stanje: ucesnik?.stanje ?? "NA_CEKANJU" }));
}

const IZBOR_PRIKAZA = {
  id: true,
  tekst: true,
  stanje: true,
  autorId: true,
  createdAt: true,
  podrske: { select: { deteId: true } },
  odgovor: { select: { tekst: true, createdAt: true } },
} as const satisfies Prisma.ZeljaDetetaSelect;

/** Sopstveni predlog autora — on vidi i stanje, razlog odbijanja i odgovor. */
export type MojaZelja = {
  id: string;
  tekst: string;
  stanje: StanjeZelje;
  brojPodrski: number;
  razlogOdbijanja: string | null;
  odgovor: { tekst: string; datum: string } | null;
  datum: string;
};

/**
 * Kutija želja za dete-posmatrača: prikazani predlozi (bez autora) po broju podrški
 * i sopstveni predlozi sa stanjem. `mozePredloziti` kaže da li sme nov predlog.
 */
export async function kutijaZaDete(deteId: string) {
  await deteUKutijiIliBaci(deteId);

  const [prikazani, moji] = await Promise.all([
    prisma.zeljaDeteta.findMany({
      where: { stanje: { in: STANJA_PRIKAZA } },
      select: IZBOR_PRIKAZA,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.zeljaDeteta.findMany({
      where: { autorId: deteId },
      select: { ...IZBOR_PRIKAZA, razlogOdbijanja: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const predlozi: PrikazZelje[] = prikazani
    .map((r) => ({ p: prikaziZelju(r, deteId), datum: r.createdAt.getTime() }))
    .filter((x): x is { p: PrikazZelje; datum: number } => x.p !== null)
    .map((x) => ({ ...x.p, datum: x.datum }))
    .sort(poredak)
    .map(({ datum: _d, ...p }) => p);

  const mojeZelje: MojaZelja[] = moji.map((r) => ({
    id: r.id,
    tekst: r.tekst,
    stanje: r.stanje,
    brojPodrski: r.podrske.length,
    razlogOdbijanja: r.stanje === "ODBIJEN" ? r.razlogOdbijanja : null,
    odgovor: r.odgovor ? { tekst: r.odgovor.tekst, datum: r.odgovor.createdAt.toISOString() } : null,
    datum: r.createdAt.toISOString(),
  }));

  const provera = smePredloziti(await brojeviAutora(deteId));
  return {
    predlozi,
    moji: mojeZelje,
    mozePredloziti: provera.ok,
    razlog: provera.ok ? null : provera.razlog,
  };
}

async function brojeviAutora(deteId: string, db: Tx | typeof prisma = prisma) {
  const [otvorenih, danas] = await Promise.all([
    db.zeljaDeteta.count({ where: { autorId: deteId, stanje: { in: ["NA_PREGLEDU", "PRIKAZAN"] } } }),
    db.zeljaDeteta.count({ where: { autorId: deteId, createdAt: { gte: pocetakDana() } } }),
  ]);
  return { otvorenih, danas };
}

/** Početak današnjeg dana po srpskom vremenu, kao trenutak. */
function pocetakDana(sada: Date = new Date()): Date {
  // `beogradskiDan` vraća UTC ponoć beogradskog datuma; beogradska ponoć je sat
  // (zimi) ili dva (leti) pre nje — uzima se onaj trenutak koji je već taj datum.
  const dan = beogradskiDan(sada);
  for (const sati of [2, 1]) {
    const t = new Date(dan.getTime() - sati * 60 * 60 * 1000);
    if (beogradskiDan(t).getTime() === dan.getTime()) return t;
  }
  return dan;
}

/** Dete šalje nov predlog. Ide na pregled Fondacije; niko ga ne vidi pre toga. */
export async function posaljiZelju(deteId: string, sirovTekst: unknown) {
  await deteUKutijiIliBaci(deteId);
  const tekst = ocistiTekst(sirovTekst);
  baci(proveriTekst(tekst));

  return prisma.$transaction(async (tx) => {
    baci(smePredloziti(await brojeviAutora(deteId, tx)));
    const z = await tx.zeljaDeteta.create({
      data: { autorId: deteId, tekst },
      select: { id: true },
    });
    return { id: z.id };
  });
}

/** Autor povlači svoj otvoren predlog — briše se sa podrškama. */
export async function povuciZelju(deteId: string, zeljaId: string) {
  await deteUKutijiIliBaci(deteId);
  await prisma.$transaction(async (tx) => {
    const z = await tx.zeljaDeteta.findUnique({ where: { id: zeljaId }, select: { autorId: true, stanje: true } });
    if (!z) throw new KutijaGreska("Predlog nije pronađen.", 404);
    baci(smePovuci({ stanje: z.stanje, moj: z.autorId === deteId }));
    await tx.zeljaDeteta.delete({ where: { id: zeljaId } });
  });
  return { ok: true };
}

/** Dete daje podršku (`dajem = true`) ili je povlači. Jedan glas po predlogu. */
export async function podrziZelju(deteId: string, zeljaId: string, dajem: boolean) {
  await deteUKutijiIliBaci(deteId);
  return prisma.$transaction(async (tx) => {
    const z = await tx.zeljaDeteta.findUnique({ where: { id: zeljaId }, select: { autorId: true, stanje: true } });
    if (!z) throw new KutijaGreska("Predlog nije pronađen.", 404);
    baci(smePodrzati({ stanje: z.stanje, moj: z.autorId === deteId }));
    if (dajem) {
      await tx.podrskaZelje.upsert({
        where: { zeljaId_deteId: { zeljaId, deteId } },
        create: { zeljaId, deteId },
        update: {},
      });
    } else {
      await tx.podrskaZelje.deleteMany({ where: { zeljaId, deteId } });
    }
    const brojPodrski = await tx.podrskaZelje.count({ where: { zeljaId } });
    return { podrzao: dajem, brojPodrski };
  });
}

// ── Fondacija (admin panel) ─────────────────────────────────────────────────

/** Red za admin pregled. 🔴 Bez autora — za pregled sadržaja autor nije potreban. */
export type ZeljaZaAdmina = {
  id: string;
  tekst: string;
  stanje: StanjeZelje;
  brojPodrski: number;
  razlogOdbijanja: string | null;
  odgovor: { tekst: string; datum: string } | null;
  datum: string;
};

export async function zeljeZaAdmina() {
  const redovi = await prisma.zeljaDeteta.findMany({
    select: {
      id: true,
      tekst: true,
      stanje: true,
      razlogOdbijanja: true,
      createdAt: true,
      _count: { select: { podrske: true } },
      odgovor: { select: { tekst: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  const svi: (ZeljaZaAdmina & { t: number })[] = redovi.map((r) => ({
    id: r.id,
    tekst: r.tekst,
    stanje: r.stanje,
    brojPodrski: r._count.podrske,
    razlogOdbijanja: r.razlogOdbijanja,
    odgovor: r.odgovor ? { tekst: r.odgovor.tekst, datum: r.odgovor.createdAt.toISOString() } : null,
    datum: r.createdAt.toISOString(),
    t: r.createdAt.getTime(),
  }));
  const bez = ({ t: _t, ...z }: ZeljaZaAdmina & { t: number }) => z;
  return {
    // Na pregledu: najstariji prvi (red čekanja).
    naPregledu: svi.filter((z) => z.stanje === "NA_PREGLEDU").map(bez),
    // Prikazani bez odgovora: po broju podrški — na te Fondacija odgovara.
    prikazani: svi
      .filter((z) => z.stanje === "PRIKAZAN")
      .sort((a, b) => poredak({ brojPodrski: a.brojPodrski, datum: a.t }, { brojPodrski: b.brojPodrski, datum: b.t }))
      .map(bez),
    odgovoreni: svi.filter((z) => z.stanje === "ODGOVOREN").reverse().map(bez),
    odbijeni: svi.filter((z) => z.stanje === "ODBIJEN").reverse().slice(0, 50).map(bez),
  };
}

/** Broj predloga koji čekaju pregled (za broj na tabu). */
export function brojNaPregledu() {
  return prisma.zeljaDeteta.count({ where: { stanje: "NA_PREGLEDU" } });
}

/**
 * Odluka Fondacije: prikaži, odbij uz razlog, ili odgovori na prikazan predlog.
 * Tekst Fondacija ne prepravlja. Autor dobija neutralno obaveštenje posle transakcije.
 */
export async function odluciOZelji(adminId: string, zeljaId: string, radnja: RadnjaFondacije, sirovTekst: unknown) {
  const tekst = typeof sirovTekst === "string" ? sirovTekst.trim() : "";
  const autorId = await prisma.$transaction(async (tx) => {
    const z = await tx.zeljaDeteta.findUnique({ where: { id: zeljaId }, select: { autorId: true, stanje: true } });
    if (!z) throw new KutijaGreska("Predlog nije pronađen.", 404);
    const p = proveriOdluku(z.stanje, radnja, tekst);
    baci(p);
    const sada = new Date();
    // Uslov na stanje u samom upisu: dve odluke u isto vreme ne prolaze obe.
    const upis = await tx.zeljaDeteta.updateMany({
      where: { id: zeljaId, stanje: z.stanje },
      data: {
        stanje: p.novoStanje!,
        ...(radnja === "ODGOVORI" ? {} : { pregledaoId: adminId, pregledanoAt: sada }),
        ...(radnja === "ODBIJ" ? { razlogOdbijanja: tekst } : {}),
      },
    });
    if (upis.count === 0) throw new KutijaGreska("Predlog je u međuvremenu promenjen.", 409);
    if (radnja === "ODGOVORI") {
      await tx.odgovorNaZelju.create({ data: { zeljaId, tekst, odgovorioId: adminId } });
    }
    return z.autorId;
  });

  // Neutralan tekst, bez sadržaja predloga i bez POEN-a.
  const obavestenje = {
    PRIKAZI: {
      tip: "kutija_zelja_prikazan",
      kljuc: "notifikacije.kutija_zelja_prikazan",
      naslov: "Tvoj predlog je u Kutiji želja",
      tekst: "Fondacija je pogledala tvoj predlog i sada ga vide i druga deca.",
    },
    ODBIJ: {
      tip: "kutija_zelja_odbijen",
      kljuc: "notifikacije.kutija_zelja_odbijen",
      naslov: "Tvoj predlog nije stavljen u Kutiju želja",
      tekst: "Fondacija ti je napisala zašto. Pogledaj u Kutiji želja.",
    },
    ODGOVORI: {
      tip: "kutija_zelja_odgovor",
      kljuc: "notifikacije.kutija_zelja_odgovor",
      naslov: "Fondacija je odgovorila na tvoj predlog",
      tekst: "Pogledaj odgovor u Kutiji želja.",
    },
  }[radnja];
  await obavesti(autorId, { ...obavestenje, link: "/kutija-zelja" }).catch((e) =>
    console.error("[kutija-zelja] obaveštenje", zeljaId, e),
  );
  return { ok: true };
}

// ── Roditelj, izvoz, brisanje ───────────────────────────────────────────────

/**
 * Za pregled deteta kod roditelja: SAMO tekst predloga sopstvenog deteta (odluka
 * vlasnika 25.10.2026) — bez stanja, razloga, odgovora i podrški koje je dete dalo.
 * Ovlašćenje (`mojeDeteIliBaci`) proverava pozivalac.
 */
export async function tekstoviZeljaDeteta(deteId: string): Promise<string[]> {
  const r = await prisma.zeljaDeteta.findMany({
    where: { autorId: deteId },
    select: { tekst: true },
    orderBy: { createdAt: "desc" },
  });
  return r.map((z) => z.tekst);
}

/** Za GDPR izvoz deteta: sopstveni predlozi (sa stanjem i odgovorom) i date podrške. */
export async function izvozKutijeZelja(userId: string) {
  const [predlozi, podrske] = await Promise.all([
    prisma.zeljaDeteta.findMany({
      where: { autorId: userId },
      select: {
        tekst: true,
        stanje: true,
        razlogOdbijanja: true,
        createdAt: true,
        pregledanoAt: true,
        odgovor: { select: { tekst: true, createdAt: true } },
        _count: { select: { podrske: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Podrška: koji tekst je dete podržalo i kada — bez autora tog predloga.
    prisma.podrskaZelje.findMany({
      where: { deteId: userId },
      select: { createdAt: true, zelja: { select: { tekst: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    predlozi: predlozi.map(({ _count, ...p }) => ({ ...p, brojPodrski: _count.podrske })),
    podrske: podrske.map((p) => ({ predlog: p.zelja.tekst, datum: p.createdAt })),
  };
}

/**
 * Briše sve predloge deteta (sa podrškama i odgovorima na njih) i sve podrške koje
 * je dete dalo. Zove se u transakciji brisanja naloga deteta, svakog izlaska naloga
 * (`ugasiOznakeNaloga`) i punoletstva — odluka vlasnika 25.10.2026: sve se briše.
 */
export async function obrisiKutijuZelja(tx: Tx, userId: string) {
  await tx.podrskaZelje.deleteMany({ where: { deteId: userId } });
  await tx.zeljaDeteta.deleteMany({ where: { autorId: userId } });
}
