/**
 * Višestruki nalog istog lica (Pravilnik o dokazu stvarnosti čl. 13 i 14; Pravilnik
 * o KOLO sistemu čl. 17 st. 2 t. 8; Uslovi korišćenja čl. 8 i 32; set 4.8.4;
 * registar 2026-10, N4-M2 i N4-M3).
 *
 * Tri dela:
 *  1. `oznakeZaNalog` — šta se poklapa sa drugim nalozima (broj telefona, ime i
 *     prezime). Vidi ga pozivalac uz otvoren poziv: da poklapanje postoji i MESTO
 *     drugog naloga, nikad njegov pseudonim.
 *  2. `moguciVisestrukiNalozi` — isti podatak za superadmina, sa oba naloga.
 *  3. `utvrdiVisestrukiNalog` — odluka Fondacije (samo superadmin, obrazloženje):
 *     ugašeni nalog prestaje, njegov zapis se poništava, neto prepis sa njega na
 *     zadržani nalog otpisuje se tipom `OTPIS_VISESTRUKI_NALOG` (osmi osnov; zapis
 *     SME u minus) i otvara se JEDAN nadzorni predmet nad primaocima prepisa sa
 *     ugašenog naloga.
 *
 * 🔴 Poređenje ništa ne blokira i ništa ne odlučuje (`visestruki-nalog-pravila.ts`).
 * 🔴 Nadzorni predmet nije praćenje prepisa: otvara se samo po utvrđenju, pita samo
 * da li je primalac isto lice ili su prepisi fiktivni, i nema dejstvo na naloge
 * primalaca dok se ništa ne utvrdi. Primalac se ne obaveštava.
 * 🔴 Ime i broj ne idu u obaveštenje, opis transakcije ni audit log.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { TransactionType } from "@/generated/prisma/client";
import { PROTOKOL_WALLET_ID } from "./zrno";
import { iskljuciKorisnika } from "./iskljucenje";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import {
  kljucImena,
  kljucTelefona,
  MIN_OBRAZLOZENJE,
  netoPrepisa,
  oznakeDuplikata,
  type DrugiNalog,
  type OznakeDuplikata,
} from "@/lib/visestruki-nalog-pravila";

export * from "@/lib/visestruki-nalog-pravila";

type Tx = Prisma.TransactionClient;

export class VisestrukiGreska extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Živi punoletni nalozi koji nose broj telefona ili upisano ime (osim datog). */
async function drugiNalozi(osimId: string): Promise<(DrugiNalog & { id: string; pseudonim: string })[]> {
  const nalozi = await prisma.user.findMany({
    where: {
      id: { not: osimId },
      deaktiviranAt: null,
      status: { not: "EXCLUDED" },
      maloletan: false,
      OR: [{ telefon: { not: null } }, { identitet: { isNot: null } }],
    },
    select: { id: true, pseudonim: true, telefon: true, location: true, identitet: { select: { imePrezime: true } } },
  });
  return nalozi.map((n) => ({
    id: n.id,
    pseudonim: n.pseudonim,
    telefon: n.telefon,
    mesto: n.location,
    imePrezime: n.identitet?.imePrezime ?? null,
  }));
}

/**
 * Oznake za nalog sa spiska (N4-M2): da li isti broj telefona ili isto ime i prezime
 * stoje uz drugi nalog. Vraća samo ono što pozivalac sme da vidi.
 */
export async function oznakeZaNalog(userId: string): Promise<OznakeDuplikata> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { telefon: true, identitet: { select: { imePrezime: true } } },
  });
  if (!u) return { istiTelefon: false, istoImeMesta: [] };
  return oznakeDuplikata(
    { telefon: u.telefon, imePrezime: u.identitet?.imePrezime ?? null },
    await drugiNalozi(userId),
  );
}

export type GrupaDuplikata = {
  osnov: "TELEFON" | "IME";
  nalozi: { id: string; pseudonim: string; mesto: string | null; naSpisku: boolean }[];
};

/**
 * Mogući višestruki nalozi za superadmina (Admin → Potvrde): grupe živih naloga sa
 * istim brojem telefona, odnosno istim imenom i prezimenom. Bez imena i broja u
 * odgovoru — samo pseudonimi, mesta i osnov poklapanja.
 */
export async function moguciVisestrukiNalozi(): Promise<GrupaDuplikata[]> {
  const svi = await drugiNalozi("");
  const naSpisku = new Set(
    (await prisma.zahtevZaRazgovor.findMany({ select: { userId: true } })).map((z) => z.userId),
  );
  const grupe = new Map<string, GrupaDuplikata>();
  for (const n of svi) {
    const kljucevi: [GrupaDuplikata["osnov"], string | null][] = [
      ["TELEFON", kljucTelefona(n.telefon)],
      ["IME", kljucImena(n.imePrezime)],
    ];
    for (const [osnov, k] of kljucevi) {
      if (!k) continue;
      const kljuc = `${osnov}:${k}`;
      const g = grupe.get(kljuc) ?? { osnov, nalozi: [] };
      g.nalozi.push({ id: n.id, pseudonim: n.pseudonim, mesto: n.mesto, naSpisku: naSpisku.has(n.id) });
      grupe.set(kljuc, g);
    }
  }
  return [...grupe.values()].filter((g) => g.nalozi.length > 1);
}

/** Zbir zapisa po novčaniku (ulaz − izlaz) — za proveru da par ostaje usklađen. */
async function razlikaStanjaIIstorije(tx: Tx, walletId: string): Promise<number> {
  const [w, ulaz, izlaz] = await Promise.all([
    tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
    tx.transaction.aggregate({ where: { toWalletId: walletId }, _sum: { amount: true } }),
    tx.transaction.aggregate({ where: { fromWalletId: walletId }, _sum: { amount: true } }),
  ]);
  return w.balance - ((ulaz._sum.amount ?? 0) - (izlaz._sum.amount ?? 0));
}

/** Par „korisnik → Protokol" sopstvenim tipom, uz proveru stanja i istorije (pravilo 1). */
async function otpisiUProtokol(tx: Tx, walletId: string, iznos: number, opis: string, opisKljuc: string): Promise<string> {
  const pre = await razlikaStanjaIIstorije(tx, walletId);
  await tx.wallet.update({ where: { id: walletId }, data: { balance: { decrement: iznos } } });
  await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: iznos } } });
  const t = await tx.transaction.create({
    data: {
      fromWalletId: walletId,
      toWalletId: PROTOKOL_WALLET_ID,
      amount: iznos,
      type: TransactionType.OTPIS_VISESTRUKI_NALOG,
      description: opis,
      opisKljuc,
    },
  });
  if ((await razlikaStanjaIIstorije(tx, walletId)) !== pre)
    throw new VisestrukiGreska("Stanje zapisa se ne slaže sa istorijom — radnja je poništena.", 500);
  return t.id;
}

/**
 * Utvrđenje višestrukog naloga (dokaz stvarnosti čl. 14). Poziva ga samo superadmin.
 * `zadrzaniId` je nalog koji lice zadržava, `ugaseniId` nalog koji prestaje.
 * `iskljuci` — lice se isključuje (Uslovi čl. 32) kad je drugi nalog korišćen za
 * sticanje POEN-a ili glasa.
 */
export async function utvrdiVisestrukiNalog(
  adminId: string,
  p: { zadrzaniId: string; ugaseniId: string; obrazlozenje: string; iskljuci?: boolean },
) {
  const obrazlozenje = typeof p.obrazlozenje === "string" ? p.obrazlozenje.trim() : "";
  if (obrazlozenje.length < MIN_OBRAZLOZENJE) throw new VisestrukiGreska("Obrazloženje je obavezno.");
  if (p.zadrzaniId === p.ugaseniId) throw new VisestrukiGreska("Nalog koji ostaje i nalog koji prestaje moraju biti različiti.");

  const [zadrzani, ugaseni] = await Promise.all(
    [p.zadrzaniId, p.ugaseniId].map((id) =>
      prisma.user.findUnique({
        where: { id },
        select: { id: true, pseudonim: true, maloletan: true, deaktiviranAt: true, status: true, wallet: { select: { id: true } } },
      }),
    ),
  );
  if (!zadrzani || !ugaseni) throw new VisestrukiGreska("Nalog nije pronađen.", 404);
  if (zadrzani.maloletan || ugaseni.maloletan) throw new VisestrukiGreska("Utvrđenje se ne odnosi na maloletni nalog.", 409);
  if (zadrzani.deaktiviranAt || zadrzani.status === "EXCLUDED")
    throw new VisestrukiGreska("Nalog koji ostaje mora biti živ.", 409);
  if (await prisma.utvrdjenjeVisestrukogNaloga.findUnique({ where: { ugaseniId: ugaseni.id }, select: { id: true } }))
    throw new VisestrukiGreska("Za ovaj nalog je višestruki nalog već utvrđen.", 409);

  // Nalog koji prestaje (Uslovi čl. 32) — isti put kao svako isključenje.
  await iskljuciKorisnika(adminId, ugaseni.id, `Utvrđen višestruki nalog (dokaz stvarnosti čl. 14): ${obrazlozenje}`);

  const zW = zadrzani.wallet?.id ?? null;
  const uW = ugaseni.wallet?.id ?? null;
  const rezultat = await prisma.$transaction(async (tx) => {
    let otpisano = 0;
    let otpisTxId: string | null = null;
    if (zW && uW) {
      const [sa, na] = await Promise.all([
        tx.transaction.aggregate({ where: { fromWalletId: uW, toWalletId: zW, type: TransactionType.TRANSFER }, _sum: { amount: true } }),
        tx.transaction.aggregate({ where: { fromWalletId: zW, toWalletId: uW, type: TransactionType.TRANSFER }, _sum: { amount: true } }),
      ]);
      otpisano = netoPrepisa(sa._sum.amount ?? 0, na._sum.amount ?? 0);
      if (otpisano > 0)
        otpisTxId = await otpisiUProtokol(
          tx, zW, otpisano,
          "Otpis po utvrđenju višestrukog naloga — prepisi sa ugašenog naloga",
          "transakcije.visestruki_nalog_otpis",
        );
    }
    // Zapis ugašenog naloga se poništava (Pravilnik čl. 33) — sopstvenim tipom, nikad TRANSFER.
    if (uW) {
      const w = await tx.wallet.findUniqueOrThrow({ where: { id: uW }, select: { balance: true } });
      if (w.balance > 0)
        await otpisiUProtokol(tx, uW, w.balance, "Poništenje zapisa ugašenog naloga (višestruki nalog)", "transakcije.visestruki_nalog_ponistenje");
    }
    const red = await tx.utvrdjenjeVisestrukogNaloga.create({
      data: {
        zadrzaniId: zadrzani.id,
        ugaseniId: ugaseni.id,
        ugaseniPseudonim: ugaseni.pseudonim,
        obrazlozenje,
        utvrdioId: adminId,
        otpisano,
        otpisTxId,
        iskljucen: !!p.iskljuci,
      },
    });
    return { id: red.id, otpisano };
  });

  if (p.iskljuci) {
    await iskljuciKorisnika(adminId, zadrzani.id, `Višestruki nalog korišćen za sticanje POEN-a ili glasa: ${obrazlozenje}`);
  }

  try {
    const stanje = zW ? (await prisma.wallet.findUnique({ where: { id: zW }, select: { balance: true } }))?.balance ?? 0 : 0;
    const uMinusu = stanje < 0;
    await obavesti(zadrzani.id, {
      tip: "visestruki_nalog",
      kljuc: rezultat.otpisano > 0
        ? (uMinusu ? "notifikacije.visestruki_nalog_otpis_minus" : "notifikacije.visestruki_nalog_otpis")
        : "notifikacije.visestruki_nalog",
      parametri: { pseudonim: ugaseni.pseudonim, poen: rezultat.otpisano, stanje, obrazlozenje },
      naslov: "Utvrđen je višestruki nalog",
      tekst:
        `Fondacija je utvrdila da je nalog „${ugaseni.pseudonim}" tvoj drugi nalog. Taj nalog je prestao. ` +
        (rezultat.otpisano > 0
          ? `POEN koji je sa njega prepisan na ovaj nalog (${rezultat.otpisano}) je otpisan.` +
            (uMinusu ? ` Tvoj zapis je sada ${stanje} POEN; POEN koji pristigne prvo popunjava minus.` : "")
          : "") +
        ` Na odluku možeš podneti prigovor u roku od 15 dana. Obrazloženje: ${obrazlozenje}`,
      link: "/novcanik",
    });
  } catch (e) {
    console.error("[visestruki-nalog] obaveštenje nije poslato", zadrzani.id, e);
  }

  await logAdminAkcija(adminId, "VISESTRUKI_NALOG_UTVRDJEN", ugaseni.id,
    `zadržan ${zadrzani.pseudonim}, ugašen ${ugaseni.pseudonim}, otpis ${rezultat.otpisano} POEN${p.iskljuci ? ", lice isključeno" : ""}; ${obrazlozenje}`);
  return rezultat;
}

/**
 * Nadzorni predmet nad primaocima prepisa sa ugašenog naloga — spisak za superadmina:
 * pseudonim primaoca i zbir prepisa sa ugašenog naloga (bez naloga koji je lice
 * zadržalo, njega pokriva otpis).
 */
export async function predmetiVisestrukihNaloga() {
  const redovi = await prisma.utvrdjenjeVisestrukogNaloga.findMany({ orderBy: { utvrdjenoAt: "desc" }, take: 200 });
  return Promise.all(
    redovi.map(async (r) => {
      const [uW, zW] = await Promise.all([
        prisma.wallet.findUnique({ where: { userId: r.ugaseniId }, select: { id: true } }),
        prisma.wallet.findUnique({ where: { userId: r.zadrzaniId }, select: { id: true } }),
      ]);
      const prepisi = uW
        ? await prisma.transaction.groupBy({
            by: ["toWalletId"],
            where: { fromWalletId: uW.id, type: TransactionType.TRANSFER, toWalletId: { notIn: [PROTOKOL_WALLET_ID, zW?.id ?? ""] } },
            _sum: { amount: true },
          })
        : [];
      const novcanici = await prisma.wallet.findMany({
        where: { id: { in: prepisi.map((x) => x.toWalletId).filter((x): x is string => !!x) } },
        select: { id: true, user: { select: { id: true, pseudonim: true } } },
      });
      const zadrzani = await prisma.user.findUnique({ where: { id: r.zadrzaniId }, select: { pseudonim: true } });
      return {
        id: r.id,
        utvrdjenoAt: r.utvrdjenoAt.toISOString(),
        zadrzani: zadrzani?.pseudonim ?? "?",
        ugaseni: r.ugaseniPseudonim,
        obrazlozenje: r.obrazlozenje,
        otpisano: r.otpisano,
        iskljucen: r.iskljucen,
        predmetOtvoren: r.predmetOtvoren,
        predmetBeleska: r.predmetBeleska,
        primaoci: prepisi.map((x) => ({
          pseudonim: novcanici.find((w) => w.id === x.toWalletId)?.user?.pseudonim ?? "?",
          poen: x._sum.amount ?? 0,
        })),
      };
    }),
  );
}

/** Zatvaranje nadzornog predmeta (samo superadmin, beleška obavezna). Bez dejstva na primaoce. */
export async function zatvoriPredmetVisestrukog(adminId: string, id: string, beleska: string) {
  const b = typeof beleska === "string" ? beleska.trim() : "";
  if (b.length < MIN_OBRAZLOZENJE) throw new VisestrukiGreska("Beleška je obavezna.");
  const r = await prisma.utvrdjenjeVisestrukogNaloga.updateMany({
    where: { id, predmetOtvoren: true },
    data: { predmetOtvoren: false, predmetBeleska: b, predmetZatvorioId: adminId, predmetZatvorenAt: new Date() },
  });
  if (r.count === 0) throw new VisestrukiGreska("Predmet nije pronađen ili je već zatvoren.", 404);
  await logAdminAkcija(adminId, "VISESTRUKI_NALOG_PREDMET_ZATVOREN", id, b);
}
