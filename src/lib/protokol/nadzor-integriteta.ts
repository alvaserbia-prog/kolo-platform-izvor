/**
 * Nadzor integriteta verifikacija — anti-malverzacija, 1. krug.
 *
 * Noćni radnik koji POSMATRA graf verifikacija i tok POEN-a i OBELEŽAVA sumnjive
 * naloge/grupe u tabeli `RizikNalaz`. Sistem NIKAD sam ne preduzima radnju —
 * samo evidentira i (za HITNO) javi superadminu; svako gašenje povlači čovek.
 *
 * 1. krug pokriva pravila koja se računaju iz podataka koje sigurno imamo:
 *   P1/P2 — jedan nalog verifikuje mnogo naloga za 24h (>5 / >10)
 *   P5    — verifikovan verifikacijom koja podleže nadzoru, a bez razmene 7 / 14 / 30
 *           dana posle verifikacije (isti stepenici kao
 *           signal uz nadzor, `nadzor-signali-pravila.ts`); posle 30 dana verifikator se
 *           jednom obaveštava
 *   P9    — isti nadzornik dopunjava istog verifikatora ≥2 puta (samo brojač)
 *   P11   — čuvar Kola (ili osnivač) verifikuje >10 naloga za 7 dana
 *
 * Provera zatvorene grupe (dokaz stvarnosti čl. 11 poslednji stav) NE upisuje se
 * ovde u `RizikNalaz`: računa se pri prikazu (`provera-grupe-pravila.ts`) i nema
 * nikakvo dejstvo.
 *   P12   — roj: ≥5 naloga napravljeno u istom satu, svi verifikovani u 72h
 *
 * Teža pravila (P3/P4 prsten, P7/P8 tok POEN-a, P14/P15 glasanje) dolaze u 2. krug.
 */
import { prisma } from "@/lib/prisma";
import { posaljiNotifikaciju, obavesti } from "@/lib/notifikacije";
import { DANI_BEZ_RAZMENE } from "@/lib/nadzor-signali-pravila";
import { USLOV_RAZMENE } from "@/lib/razmena-brojac-pravila";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { TransactionType } from "@/generated/prisma/client";
import { jeCuvar, statusUcesnika } from "@/lib/status-ucesnika-pravila";

export type Nivo = "INFO" | "UPOZORENJE" | "HITNO";
export type Pravilo = { kod: string; nivo: Nivo; opis: string };

const TEZINA: Record<Nivo, number> = { INFO: 10, UPOZORENJE: 30, HITNO: 60 };
const NIVO_RANG: Record<Nivo, number> = { INFO: 1, UPOZORENJE: 2, HITNO: 3 };

// Pragovi (početne vrednosti — kalibrišu se u tihom radu).
const P1_PRAG = 5; //  >5 verifikacija / 24h  → UPOZORENJE
const P2_PRAG = 10; // >10 verifikacija / 24h → HITNO
const P11_PRAG = 10; // nosilac ZRNA: >10 / 7 dana → HITNO
const P9_PRAG = 2; // isti nadzornik istog verifikatora ≥2 puta
const P12_MIN = 5; // roj: bar 5 naloga u istom satu
const P12_MAX = 30; // iznad ovoga je verovatno bulk/seed, ne roj — preskoči
const P12_VERIF_SATI = 72; // svi verifikovani u 72h od nastanka

const MS = { sat: 3_600_000, dan: 86_400_000 };

function maxNivo(pravila: Pravilo[]): Nivo {
  return pravila.reduce<Nivo>(
    (acc, p) => (NIVO_RANG[p.nivo] > NIVO_RANG[acc] ? p.nivo : acc),
    "INFO"
  );
}
function rizikSkor(pravila: Pravilo[]): number {
  return pravila.reduce((s, p) => s + TEZINA[p.nivo], 0);
}

export type NadzorRezultat = {
  ukupno: number;
  hitno: number;
  upozorenje: number;
  info: number;
  noviHitni: number;
};

/**
 * Pokreni nadzor: izračunaj pravila, upiši OTVORENE nalaze, javi superadminu
 * za NOVE HITNO slučajeve. Vraća sažetak za log/cron odgovor.
 */
export async function pokreniNadzorIntegriteta(): Promise<NadzorRezultat> {
  const sada = Date.now();

  // ── Učitavanje (mreža je rana, pa dovoljno par upita pa račun u JS) ──────────
  const [veze, korisnici, poruke, listinzi, oglasPrijave, walleti] = await Promise.all([
    prisma.verifikacionaVeza.findMany({
      select: { verifikatorId: true, verifikovaniId: true, nadzornikId: true, vremenskiZig: true, podlezeNadzoru: true },
    }),
    prisma.user.findMany({
      where: { deaktiviranAt: null },
      select: {
        id: true, pseudonim: true, tipKorisnika: true, verified: true, verifiedAt: true, createdAt: true,
        maloletan: true, jeOsnivac: true, indeksStvarnosti: true, potvrdjenAt: true,
      },
    }),
    prisma.poruka.findMany({ distinct: ["posiljacId"], select: { posiljacId: true } }),
    prisma.marketplaceListing.findMany({ distinct: ["sellerId"], select: { sellerId: true } }),
    prisma.oglasPrijava.findMany({ distinct: ["userId"], select: { userId: true } }),
    prisma.wallet.findMany({ where: { userId: { not: null } }, select: { id: true, userId: true } }),
  ]);

  const walletIdToUser = new Map(walleti.map((w) => [w.id, w.userId!]));
  const transferOut = await prisma.transaction.findMany({
    where: { type: TransactionType.TRANSFER, fromWalletId: { not: null } },
    distinct: ["fromWalletId"],
    select: { fromWalletId: true },
  });

  // Skupovi „nalog je nešto radio" (za P5).
  const aktivni = new Set<string>();
  poruke.forEach((p) => aktivni.add(p.posiljacId));
  listinzi.forEach((l) => aktivni.add(l.sellerId));
  oglasPrijave.forEach((o) => aktivni.add(o.userId));
  transferOut.forEach((t) => {
    const uid = t.fromWalletId ? walletIdToUser.get(t.fromWalletId) : undefined;
    if (uid) aktivni.add(uid);
  });

  const korisnikById = new Map(korisnici.map((k) => [k.id, k]));
  const pseudonim = (id: string) => korisnikById.get(id)?.pseudonim ?? id;

  // Nalazi po nalogu: subjektId → Pravilo[]
  const poNalogu = new Map<string, Pravilo[]>();
  const dodaj = (subjektId: string, p: Pravilo) => {
    const lista = poNalogu.get(subjektId);
    if (lista) lista.push(p);
    else poNalogu.set(subjektId, [p]);
  };

  // ── P1/P2/P11: broj verifikacija po verifikatoru u prozoru ───────────────────
  const poVerifikatoru = new Map<string, number[]>(); // verifikatorId → [vremenskiZig ms]
  for (const v of veze) {
    const lista = poVerifikatoru.get(v.verifikatorId);
    const t = v.vremenskiZig.getTime();
    if (lista) lista.push(t);
    else poVerifikatoru.set(v.verifikatorId, [t]);
  }
  for (const [verifikatorId, vremena] of poVerifikatoru) {
    const u24 = vremena.filter((t) => sada - t <= MS.dan).length;
    const u7d = vremena.filter((t) => sada - t <= 7 * MS.dan).length;

    if (u24 > P2_PRAG) {
      dodaj(verifikatorId, { kod: "P2", nivo: "HITNO", opis: `Verifikovao ${u24} naloga za 24h (granica >${P2_PRAG})` });
    } else if (u24 > P1_PRAG) {
      dodaj(verifikatorId, { kod: "P1", nivo: "UPOZORENJE", opis: `Verifikovao ${u24} naloga za 24h (granica >${P1_PRAG})` });
    }

    // Čuvar Kola = potvrđen nosilac ZRNA ili osnivač (set 4.8.2). Član bez potvrde
    // koji drži ZRNO nije čuvar — on ide u nadzor po čl. 10 i P1/P2 ga hvataju.
    const k = korisnikById.get(verifikatorId);
    if (k && !k.maloletan && jeCuvar(statusUcesnika(k)) && u7d > P11_PRAG) {
      dodaj(verifikatorId, { kod: "P11", nivo: "HITNO", opis: `Kao čuvar Kola verifikovao ${u7d} naloga za 7 dana (granica >${P11_PRAG})` });
    }
  }

  // ── P9: isti nadzornik dopunjava istog verifikatora ≥2 puta (brojač) ─────────
  const parovi = new Map<string, number>(); // `${nadzornikId}|${verifikatorId}` → broj
  for (const v of veze) {
    if (!v.nadzornikId) continue;
    const k = `${v.nadzornikId}|${v.verifikatorId}`;
    parovi.set(k, (parovi.get(k) ?? 0) + 1);
  }
  for (const [k, broj] of parovi) {
    if (broj < P9_PRAG) continue;
    const [nadzornikId, verifikatorId] = k.split("|");
    dodaj(nadzornikId, {
      kod: "P9",
      nivo: "UPOZORENJE",
      opis: `Kao nadzornik dopunio istog verifikatora (${pseudonim(verifikatorId)}) ${broj} puta (granica ≥${P9_PRAG})`,
    });
  }

  // ── P5: potvrđen, a bez razmene 7 / 14 / 30 dana posle potvrde ─────────────
  // Spojeno sa signalom uz nadzor (odluka vlasnika 20.10.2026): isti stepenici i ista
  // definicija razmene (`USLOV_RAZMENE`), da se „prazan nalog" ne meri na dva načina.
  const razmene = await prisma.transaction.findMany({
    where: { ...USLOV_RAZMENE },
    select: { fromWalletId: true, toWalletId: true, createdAt: true },
  });
  const userToWallet = new Map(walleti.map((w) => [w.userId!, w.id]));
  const razmenioPosle = (userId: string, od: Date) => {
    const w = userToWallet.get(userId);
    if (!w) return false;
    return razmene.some((r) => (r.fromWalletId === w || r.toWalletId === w) && r.createdAt >= od);
  };
  const stepenik = (od: Date) => [...DANI_BEZ_RAZMENE].reverse().find((d) => sada - od.getTime() >= d * MS.dan);
  // Pokriva svakog ko je verifikovan verifikacijom koja podleže nadzoru (čl. 9, 10) —
  // ne više „samo REGULARNI": status se čita iz grafa, ne iz tipa naloga.
  const podNadzorom = new Set(veze.filter((v) => v.podlezeNadzoru).map((v) => v.verifikovaniId));
  for (const k of korisnici) {
    if (!podNadzorom.has(k.id)) continue;
    if (!k.verified || !k.verifiedAt) continue;
    const dana = stepenik(k.verifiedAt);
    if (!dana || razmenioPosle(k.id, k.verifiedAt)) continue;
    dodaj(k.id, {
      kod: "P5",
      nivo: dana >= 14 ? "UPOZORENJE" : "INFO",
      opis: `Potvrđen pre ${dana}+ dana, a nema nijednu razmenu posle potvrde`,
    });
  }

  // Verifikator se jednom obaveštava kad potvrđeni pređe 30 dana bez razmene. Ne baca.
  const najvisiStepenik = DANI_BEZ_RAZMENE[DANI_BEZ_RAZMENE.length - 1];
  const zaJavljanje = await prisma.verifikacionaVeza.findMany({
    where: { bezRazmeneJavljenoAt: null, vremenskiZig: { lte: new Date(sada - najvisiStepenik * MS.dan) } },
    select: { id: true, verifikatorId: true, verifikovaniId: true, vremenskiZig: true },
  });
  for (const v of zaJavljanje) {
    if (!korisnikById.has(v.verifikovaniId) || razmenioPosle(v.verifikovaniId, v.vremenskiZig)) continue;
    const upisano = await prisma.verifikacionaVeza.updateMany({
      where: { id: v.id, bezRazmeneJavljenoAt: null },
      data: { bezRazmeneJavljenoAt: new Date(sada) },
    });
    if (upisano.count === 0) continue;
    await obavesti(v.verifikatorId, {
      tip: "potvrdjeni_bez_razmene",
      kljuc: "notifikacije.potvrdjeni_bez_razmene",
      parametri: { pseudonim: pseudonim(v.verifikovaniId), dana: najvisiStepenik },
      naslov: "Član koga si potvrdio još nije razmenjivao",
      tekst: `${pseudonim(v.verifikovaniId)} ni ${najvisiStepenik} dana posle tvoje potvrde nema nijednu razmenu. Ako ga poznaješ, javi mu se i pomozi mu da počne.`,
      link: "/verifikacija",
    }).catch(() => {});
  }

  // ── P12: roj — ≥5 naloga u istom satu, svi verifikovani u 72h ─────────────────
  const grupe: { clanovi: { id: string; pseudonim: string }[]; pravila: Pravilo[]; rizik: number; nivo: Nivo }[] = [];
  const poSatu = new Map<string, typeof korisnici>();
  for (const k of korisnici) {
    const kljuc = new Date(Math.floor(k.createdAt.getTime() / MS.sat) * MS.sat).toISOString();
    const lista = poSatu.get(kljuc);
    if (lista) lista.push(k);
    else poSatu.set(kljuc, [k]);
  }
  for (const [, clanoviSata] of poSatu) {
    if (clanoviSata.length < P12_MIN || clanoviSata.length > P12_MAX) continue;
    const brzoVerifikovani = clanoviSata.filter(
      (k) => k.verifiedAt && k.verifiedAt.getTime() - k.createdAt.getTime() <= P12_VERIF_SATI * MS.sat
    );
    if (brzoVerifikovani.length < P12_MIN) continue;
    const pravila: Pravilo[] = [
      { kod: "P12", nivo: "HITNO", opis: `Roj: ${brzoVerifikovani.length} naloga napravljeno u istom satu i verifikovano u ${P12_VERIF_SATI}h` },
    ];
    grupe.push({
      clanovi: brzoVerifikovani.map((k) => ({ id: k.id, pseudonim: k.pseudonim })),
      pravila,
      rizik: rizikSkor(pravila),
      nivo: maxNivo(pravila),
    });
  }

  // ── Upis: poštuj CISTO odbacivanja, ne re-spamuj već poznate HITNO ───────────
  const [prethodniOtvoreniRedovi, cistoRedovi] = await Promise.all([
    prisma.rizikNalaz.findMany({ where: { status: "OTVOREN", tip: "NALOG" }, select: { subjektId: true } }),
    prisma.rizikNalaz.findMany({
      where: { status: "CISTO", subjektId: { not: null }, resenAt: { gte: new Date(sada - 30 * MS.dan) } },
      select: { subjektId: true },
    }),
  ]);
  const prethodniOtvoreni = new Set(prethodniOtvoreniRedovi.map((r) => r.subjektId));
  const cistoSubjekti = new Set(cistoRedovi.map((r) => r.subjektId));

  type Red = {
    tip: string; subjektId: string | null; pseudonim: string | null;
    clanovi: string | null; pravila: string; rizik: number; nivo: string;
  };
  const redovi: Red[] = [];
  const noviHitniSubjekti: string[] = [];

  for (const [subjektId, pravila] of poNalogu) {
    if (cistoSubjekti.has(subjektId)) continue; // superadmin već odbacio
    const nivo = maxNivo(pravila);
    redovi.push({
      tip: "NALOG", subjektId, pseudonim: pseudonim(subjektId), clanovi: null,
      pravila: JSON.stringify(pravila), rizik: rizikSkor(pravila), nivo,
    });
    if (nivo === "HITNO" && !prethodniOtvoreni.has(subjektId)) noviHitniSubjekti.push(subjektId);
  }
  let novaHitnaGrupa = 0;
  for (const g of grupe) {
    redovi.push({
      tip: "GRUPA", subjektId: null, pseudonim: null, clanovi: JSON.stringify(g.clanovi),
      pravila: JSON.stringify(g.pravila), rizik: g.rizik, nivo: g.nivo,
    });
    if (g.nivo === "HITNO") novaHitnaGrupa++;
  }

  // Atomarno: obriši stare OTVORENE i upiši nove.
  await prisma.$transaction([
    prisma.rizikNalaz.deleteMany({ where: { status: "OTVOREN" } }),
    prisma.rizikNalaz.createMany({ data: redovi }),
  ]);

  const hitno = redovi.filter((r) => r.nivo === "HITNO").length;
  const upozorenje = redovi.filter((r) => r.nivo === "UPOZORENJE").length;
  const info = redovi.filter((r) => r.nivo === "INFO").length;
  const noviHitni = noviHitniSubjekti.length + novaHitnaGrupa;

  // ── Javi superadminima za NOVE HITNO ─────────────────────────────────────────
  if (noviHitni > 0) {
    const superadmini = await prisma.user.findMany({
      where: { admin: "SUPERADMIN", deaktiviranAt: null },
      select: { id: true },
    });
    await Promise.all(
      superadmini.map((s) =>
        posaljiNotifikaciju(
          s.id,
          "NADZOR_HITNO",
          "Nadzor integriteta: novo HITNO",
          `${noviHitni} novih HITNO nalaza u nadzoru verifikacija. Pogledaj u admin panelu.`,
          "/admin"
        )
      )
    );
    void posaljiAdminAlert(
      "Nadzor integriteta — HITNO",
      `Novih HITNO nalaza: ${noviHitni}\nUkupno otvoreno: ${redovi.length} (HITNO ${hitno}, UPOZORENJE ${upozorenje})`
    );
  }

  return { ukupno: redovi.length, hitno, upozorenje, info, noviHitni };
}
