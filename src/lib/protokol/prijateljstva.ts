/**
 * Prijateljstva maloletnih korisnika (Modul Deca, čl. 14a–14c).
 *
 * Deca se povezuju skeniranjem QR koda, uživo. Kod NEMA izgovorivi broj kao onaj
 * za potvrdu stvarnosti — broj se može izdiktirati telefonom, a QR se mora POKAZATI.
 * To je jedina brana koja traži da dvoje stvarno budu jedno pored drugog.
 *
 * ─── 500 POEN, ali tek kad su OBE strane aktivne ────────────────────────────
 *
 * 🔴 Ovo je izmena nosivog pravila prve verzije modula: u dečjem prostoru sada
 * NASTAJU zapisi POEN-a, pa emisija ulazi u opticaj i pomera prag osnivačkog koraka
 * i obračunski koeficijent ZRNA. Ranija rečenica „u dečjem prostoru ne nastaje
 * nijedan nov zapis POEN-a" više NE važi.
 *
 * Obostrano čekanje je i CELA odbrana od farmovanja. Broj dece po roditelju nije
 * ograničen, pa bi jedan čovek inače otvorio deset naloga, upario ih međusobno
 * (45 parova = 45.000 POEN) i prekidačem iz čl. 10 prepisao sve sebi. Lažni nalozi
 * nikad ne postaju deca Kola — a nalog je dete Kola tek kad je roditelj ČLAN KOLA,
 * dakle čovek koga je neko treći potvrdio u stvarnom svetu, i kad je član Kola koji
 * ga lično zna potvrdio da ima to dete (čl. 4c t. 3, set 4.8.2). Nema šta da se izvuče. Uz to, prijateljstvo dece istog roditelja se sklapa normalno ali
 * NE nosi POEN (čl. 14b st. 4) — inače bi šestoro dece jednog čoveka dalo petnaest
 * parova bez ijednog stranca.
 *
 * Dok jedna strana čeka, obe vide „500 na čekanju" sa pseudonimom prijatelja. To je
 * i namera: Mihajlo koji je dete Kola ne dobija ništa dok Milica ne postane dete
 * Kola, pa Mihajlo gnjavi Milicu, a Milica gnjavi tatu.
 */
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { emitujPoen } from "./emisija";
import { obavesti } from "@/lib/notifikacije";
import { IZBOR_UCESNIKA, ucesnikIzReda } from "./deca";
import { PRIJATELJSTVO_POEN, smeUPricaonicu, prijateljstvoNosiPoen } from "@/lib/deca-pravila";

const PROTOKOL_WALLET_ID = "banka-singleton";

/**
 * Koliko traje kod za povezivanje.
 *
 * Kratko namerno: kod koji živi satima može da se fotografiše i iskoristi daleko od
 * deteta, čime se gubi jedini uslov — da se vide uživo.
 */
export const TOKEN_VAZI_SEKUNDI = 5 * 60;

export class PrijateljGreska extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Par se uvek čuva sortirano, pa jedinstveni indeks pokriva oba smera. */
function par(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}

/** Generiše jednokratni kod za povezivanje. Stari kodovi istog deteta se poništavaju. */
export async function generisiToken(korisnikId: string) {
  const dete = await prisma.user.findUnique({
    where: { id: korisnikId },
    select: { maloletan: true },
  });
  if (!dete?.maloletan) throw new PrijateljGreska("Ova mogućnost je za decu.", 403);

  // Jedan živ kod po detetu — inače bi svaki prikaz ekrana ostavljao još jedan
  // upotrebljiv kod za sobom.
  await prisma.prijateljToken.updateMany({
    where: { korisnikId, iskoriscen: false },
    data: { iskoriscen: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const zapis = await prisma.prijateljToken.create({
    data: {
      token,
      korisnikId,
      expiresAt: new Date(Date.now() + TOKEN_VAZI_SEKUNDI * 1000),
    },
    select: { token: true, expiresAt: true },
  });
  return zapis;
}

/**
 * Povezuje dvoje dece na osnovu skeniranog koda.
 *
 * Obe strane moraju biti maloletne: prijateljstvo je odnos unutar dečjeg prostora,
 * a odnos deteta i punoletnog korisnika uređuje prekidač iz čl. 10, ne ovo.
 *
 * 🔴 Radi i za dete na čekanju — to je jedino što ono i sme (čl. 4c). Prijateljstva
 * su razlog zbog kog ono uopšte ostaje na platformi dok mu roditelj ne preuzme nalog.
 */
export async function poveziPoTokenu(skenerId: string, token: string) {
  const zapis = await prisma.prijateljToken.findUnique({
    where: { token },
    select: { korisnikId: true, expiresAt: true, iskoriscen: true },
  });
  if (!zapis || zapis.iskoriscen || zapis.expiresAt < new Date()) {
    throw new PrijateljGreska("Kod nije važeći. Zamoli druga da pokaže nov.", 400);
  }
  if (zapis.korisnikId === skenerId) {
    throw new PrijateljGreska("To je tvoj kod.", 400);
  }

  const [a, b] = await Promise.all([
    prisma.user.findUnique({
      where: { id: skenerId },
      select: { ...IZBOR_UCESNIKA, pseudonim: true, deaktiviranAt: true },
    }),
    prisma.user.findUnique({
      where: { id: zapis.korisnikId },
      select: { ...IZBOR_UCESNIKA, pseudonim: true, deaktiviranAt: true },
    }),
  ]);
  if (!a || !b || a.deaktiviranAt || b.deaktiviranAt) {
    throw new PrijateljGreska("Kod nije važeći.", 400);
  }
  if (!a.maloletan || !b.maloletan) {
    throw new PrijateljGreska("Prijatelji se dodaju samo među decom.", 403);
  }

  const [aId, bId] = par(a.id, b.id);
  const postojece = await prisma.prijateljstvo.findUnique({
    where: { aId_bId: { aId, bId } },
    select: { id: true, raskinutAt: true },
  });

  let prijateljstvoId: string;
  if (postojece && !postojece.raskinutAt) {
    // Kod se ipak troši, da se isti QR ne vrti u krug.
    await prisma.prijateljToken.update({ where: { token }, data: { iskoriscen: true } });
    throw new PrijateljGreska(`Već ste prijatelji sa ${b.pseudonim}.`, 409);
  }

  if (postojece) {
    // Obnova raskinutog para (čl. 14c st. 5) — POEN se upisuje ponovo. Zajedno sa
    // otpisom pri raskidu, ciklus raskini–obnovi daje TAČNO NULU; bez toga bi bio
    // beskonačna kasa iz jednog jedinog prijateljstva.
    await prisma.$transaction([
      prisma.prijateljstvo.update({
        where: { id: postojece.id },
        data: { raskinutAt: null, raskinuoId: null, createdAt: new Date() },
      }),
      prisma.prijateljToken.update({ where: { token }, data: { iskoriscen: true } }),
    ]);
    prijateljstvoId = postojece.id;
  } else {
    const kreirano = await prisma.$transaction(async (tx) => {
      const p = await tx.prijateljstvo.create({ data: { aId, bId }, select: { id: true } });
      await tx.prijateljToken.update({ where: { token }, data: { iskoriscen: true } });
      return p;
    });
    prijateljstvoId = kreirano.id;
  }

  // Čl. 14a st. 4: kad dete Kola sklopi prijateljstvo sa detetom koje nije dete
  // Kola, roditelj deteta Kola se o tome obaveštava — bez uvida u razgovore.
  await javiRoditeljimaDetetaKola(ucesnikIzReda(a), a.pseudonim, ucesnikIzReda(b), b.pseudonim);

  // Isplata ide VAN transakcije — `emitujPoen` otvara sopstvenu. Ne baca: veza je
  // upisana i ne sme da padne zbog kanala, a neizvršeno evidentiranje se nadoknađuje pri
  // svakoj sledećoj promeni stanja (i noćnim poslom).
  const evidentiranje = await probajEvidentirati(prijateljstvoId);

  return { pseudonim: b.pseudonim, evidentirano: evidentiranje };
}

/**
 * Obaveštenje roditeljima deteta Kola o prijateljstvu sa detetom koje nije dete Kola
 * (čl. 14a st. 4). 🔴 Bez uvida u razgovore (čl. 9 st. 2) — samo pseudonim
 * prijatelja. Ne baca.
 */
async function javiRoditeljimaDetetaKola(
  a: { stanje: string; roditeljIds: string[] },
  aPseudonim: string,
  b: { stanje: string; roditeljIds: string[] },
  bPseudonim: string,
) {
  const parovi: [typeof a, string, string][] = [];
  if (a.stanje === "AKTIVNO" && b.stanje !== "AKTIVNO") parovi.push([a, aPseudonim, bPseudonim]);
  if (b.stanje === "AKTIVNO" && a.stanje !== "AKTIVNO") parovi.push([b, bPseudonim, aPseudonim]);
  for (const [dete, dPseudonim, prijatelj] of parovi) {
    for (const roditeljId of dete.roditeljIds) {
      await obavesti(roditeljId, {
        tip: "prijateljstvo_ne_kola",
        kljuc: "notifikacije.prijateljstvo_ne_kola",
        parametri: { dete: dPseudonim, pseudonim: prijatelj },
        naslov: "Novo prijateljstvo tvog deteta",
        tekst: `${dPseudonim} je sklopio/la prijateljstvo sa ${prijatelj}, čiji nalog još nije dete Kola.`,
        link: "/profil",
        email: false,
      }).catch(() => {});
    }
  }
}

// ── Isplata (čl. 14b) ─────────────────────────────────────────────────────────

/** Učitava oba učesnika prijateljstva u obliku koji čista pravila razumeju. */
async function ucesniciPrijateljstva(prijateljstvoId: string) {
  const p = await prisma.prijateljstvo.findUnique({
    where: { id: prijateljstvoId },
    select: {
      id: true,
      poenEvidentiran: true,
      raskinutAt: true,
      a: { select: { ...IZBOR_UCESNIKA, pseudonim: true, deaktiviranAt: true } },
      b: { select: { ...IZBOR_UCESNIKA, pseudonim: true, deaktiviranAt: true } },
    },
  });
  if (!p) return null;
  return { ...p, ucesnikA: ucesnikIzReda(p.a), ucesnikB: ucesnikIzReda(p.b) };
}

/**
 * Upisuje 500 POEN obema stranama, ako su uslovi ispunjeni. Idempotentno.
 *
 * Prelaz se REZERVIŠE uslovnim `updateMany` pre emisije (`poenEvidentiran: false` →
 * `true`); ako emisija pukne, rezervacija se vraća. Bez toga bi dva uporedna poziva
 * (skeniranje i noćni posao u istom trenutku) isplatila isti par dvaput.
 *
 * Ne baca — pozivna mesta su verifikacija, preuzimanje naloga i skeniranje koda, i
 * nijedno ne sme da padne zbog ovog kanala.
 */
export async function probajEvidentirati(prijateljstvoId: string): Promise<boolean> {
  try {
    const p = await ucesniciPrijateljstva(prijateljstvoId);
    if (!p || p.poenEvidentiran || p.raskinutAt) return false;
    if (p.a.deaktiviranAt || p.b.deaktiviranAt) return false;
    if (!prijateljstvoNosiPoen(p.ucesnikA, p.ucesnikB)) return false;

    const rezervisano = await prisma.prijateljstvo.updateMany({
      where: { id: prijateljstvoId, poenEvidentiran: false, raskinutAt: null },
      data: { poenEvidentiran: true, evidentiranAt: new Date() },
    });
    if (rezervisano.count === 0) return false;

    try {
      for (const [ko, drugi] of [
        [p.a, p.b],
        [p.b, p.a],
      ] as const) {
        const w = await dohvatiWallet(ko.id);
        await emitujPoen(
          w,
          PRIJATELJSTVO_POEN,
          TransactionType.EMISIJA_PRIJATELJSTVO,
          `Prijateljstvo sa ${drugi.pseudonim}`,
          { kljuc: "transakcije.prijateljstvo", parametri: { pseudonim: drugi.pseudonim } }
        );
      }
    } catch (e) {
      // 🔴 Rezervacija se NE vraća. Emisije su dve i idu jedna za drugom, svaka u
      // sopstvenoj transakciji — ako druga pukne, prva je već upisana. Vraćanjem
      // rezervacije bi sledeći prolaz emitovao ponovo i prva strana bi dobila 1.000
      // umesto 500. Nesklad se prijavljuje Fondaciji i ispravlja se ručno; manja je
      // šteta da jednoj strani 500 nedostaje nego da druga dobije dvaput.
      console.error("[prijateljstva] INCIDENT: evidentiranje puklo posle rezervacije", {
        prijateljstvoId,
        error: e,
      });
      const { posaljiAdminAlert } = await import("@/lib/adminAlert");
      void posaljiAdminAlert(
        "Isplata prijateljstva pukla nasred posla",
        `Prijateljstvo ${prijateljstvoId} je obeleženo kao isplaćeno, ali jedna od dve ` +
          `emisije od ${PRIJATELJSTVO_POEN} POEN nije prošla. Proveriti zapise obe strane.`
      );
      throw e;
    }

    for (const [ko, drugi] of [
      [p.a, p.b],
      [p.b, p.a],
    ] as const) {
      await obavesti(ko.id, {
        tip: "prijateljstvo_poen",
        kljuc: "notifikacije.prijateljstvo_poen",
        parametri: { pseudonim: drugi.pseudonim, iznos: PRIJATELJSTVO_POEN },
        naslov: `Upisano ti je ${PRIJATELJSTVO_POEN} POENA`,
        tekst: `Prijateljstvo sa ${drugi.pseudonim} donelo ti je ${PRIJATELJSTVO_POEN} POENA.`,
        link: "/novcanik",
      }).catch(() => {});
    }
    return true;
  } catch (e) {
    console.error("[prijateljstva] Isplata nije uspela", prijateljstvoId, e);
    return false;
  }
}

/**
 * Prolazi kroz sva neisplaćena prijateljstva jednog deteta i isplaćuje ona koja su
 * sazrela. Zove se kad dete može da pređe u `AKTIVNO` (dete Kola) — kad je
 * roditelju potvrđeno postojanje deteta i kad roditelj postane član Kola.
 */
export async function osveziPrijateljstvaDeteta(deteId: string): Promise<number> {
  try {
    const redovi = await prisma.prijateljstvo.findMany({
      where: {
        OR: [{ aId: deteId }, { bId: deteId }],
        poenEvidentiran: false,
        raskinutAt: null,
      },
      select: { id: true },
    });
    let evidentirano = 0;
    for (const r of redovi) {
      if (await probajEvidentirati(r.id)) evidentirano += 1;
    }
    return evidentirano;
  } catch (e) {
    console.error("[prijateljstva] Osvežavanje deteta nije uspelo", deteId, e);
    return 0;
  }
}

/**
 * Isto, za svu decu jednog roditelja.
 *
 * 🔴 Zove se iz `posleStatusaRoditelja` (deca-status.ts): kad roditelj postane član
 * Kola, njegova deca kojoj je postojanje potvrđeno prelaze u `AKTIVNO`, a time i
 * TUĐA prijateljstva sazrevaju. Bez ovog poziva
 * bi 500 POEN visilo dok neko ne skenira nov kod.
 */
export async function osveziPrijateljstvaDece(roditeljId: string): Promise<number> {
  try {
    const deca = await prisma.user.findMany({
      where: { maloletan: true, deaktiviranAt: null, roditeljstvaKaoDete: { some: { roditeljId } } },
      select: { id: true },
    });
    let ukupno = 0;
    for (const d of deca) ukupno += await osveziPrijateljstvaDeteta(d.id);
    return ukupno;
  } catch (e) {
    console.error("[prijateljstva] Osvežavanje dece nije uspelo", roditeljId, e);
    return 0;
  }
}

// ── Raskid (čl. 14c) ─────────────────────────────────────────────────────────

/**
 * Otpis 500 POEN sa jednog zapisa, uz protivzapis Protokola.
 *
 * 🔴 ZAPIS SME U MINUS. Ovo je TREĆI izuzetak od zabrane negativnog zapisa POEN-a
 * (Pravilnik čl. 14 st. 3), uz nadoknadu po čl. 20b Pravilnika o dokazu stvarnosti i
 * poništen prepis po prijavi razmene. Minus se ponaša isto kao nadoknada: nije dug,
 * ne naplaćuje se, POEN-i koji pristignu prvo ga popunjavaju, prepis drugome je
 * moguć tek preko nule, a razmena dobara i usluga nije ograničena.
 *
 * Bez minusa bi postojao ovakav potez: sklopi prijateljstvo, dobij 500, odmah
 * prepiši roditelju, raskini — otpis pada na prazan račun; pa obnovi par i ponovi.
 * To bi bila beskonačna kasa iz jednog jedinog prijateljstva. Sa minusom ciklus daje
 * tačno nulu, pa je i obnavljanje para bezopasno.
 */
async function otpisiPoen(korisnikId: string, iznos: number, opis: string, kljuc: string, parametri: Record<string, string | number>) {
  if (iznos <= 0) return;
  await prisma.$transaction(async (tx) => {
    const w = await tx.wallet.findUnique({ where: { userId: korisnikId }, select: { id: true } });
    if (!w) throw new Error(`Korisnik ${korisnikId} nema zapis u Protokolu.`);
    await tx.wallet.update({ where: { id: w.id }, data: { balance: { decrement: iznos } } });
    await tx.wallet.update({
      where: { id: PROTOKOL_WALLET_ID },
      data: { balance: { increment: iznos } },
    });
    await tx.transaction.create({
      data: {
        fromWalletId: w.id,
        toWalletId: PROTOKOL_WALLET_ID,
        amount: iznos,
        type: TransactionType.OTPIS_PRIJATELJSTVO,
        description: opis,
        opisKljuc: kljuc,
        opisParametri: parametri,
      },
    });
  });
}

/**
 * Raskid prijateljstva (čl. 14c).
 *
 * 🔴 Raskinuti može SAMO DETE — bilo koje od dvoje. Roditelj nema raskid; njemu
 * ostaju brisanje naloga, uklanjanje oglasa i prekidač za odrasle. Raskid je odnos
 * među decom i o njemu odlučuju deca.
 *
 * Otpisuje se 500 POEN OBEMA stranama, i onome ko raskida i onome ko je raskinut.
 * Prijateljstvo je imalo cenu i ta cena se vraća; onaj ko je POEN već potrošio ne
 * oseti otpis odmah nego kroz minus — kazna je trenutna za štedišu, odložena za
 * onoga ko je brz, ali od nje niko ne beži.
 */
export async function raskiniPrijateljstvo(korisnikId: string, prijateljstvoId: string) {
  const p = await prisma.prijateljstvo.findUnique({
    where: { id: prijateljstvoId },
    select: {
      id: true,
      aId: true,
      bId: true,
      poenEvidentiran: true,
      raskinutAt: true,
      a: { select: { pseudonim: true, maloletan: true } },
      b: { select: { pseudonim: true, maloletan: true } },
    },
  });
  if (!p || (p.aId !== korisnikId && p.bId !== korisnikId)) {
    throw new PrijateljGreska("Prijateljstvo nije pronađeno.", 404);
  }
  if (p.raskinutAt) throw new PrijateljGreska("Prijateljstvo je već raskinuto.", 409);

  // Rezerviši raskid uslovno — dva uporedna klika ne smeju da otpišu dvaput.
  const rezervisano = await prisma.prijateljstvo.updateMany({
    where: { id: prijateljstvoId, raskinutAt: null },
    data: { raskinutAt: new Date(), raskinuoId: korisnikId, poenEvidentiran: false },
  });
  if (rezervisano.count === 0) throw new PrijateljGreska("Prijateljstvo je već raskinuto.", 409);

  const drugiId = p.aId === korisnikId ? p.bId : p.aId;
  const jaPseudonim = p.aId === korisnikId ? p.a.pseudonim : p.b.pseudonim;
  const drugiPseudonim = p.aId === korisnikId ? p.b.pseudonim : p.a.pseudonim;

  if (p.poenEvidentiran) {
    await otpisiPoen(
      korisnikId,
      PRIJATELJSTVO_POEN,
      `Raskinuto prijateljstvo sa ${drugiPseudonim}`,
      "transakcije.prijateljstvo_raskid",
      { pseudonim: drugiPseudonim }
    );
    await otpisiPoen(
      drugiId,
      PRIJATELJSTVO_POEN,
      `Raskinuto prijateljstvo sa ${jaPseudonim}`,
      "transakcije.prijateljstvo_raskid",
      { pseudonim: jaPseudonim }
    );
  }

  await obavesti(drugiId, {
    tip: "prijateljstvo_raskinuto",
    kljuc: p.poenEvidentiran
      ? "notifikacije.prijateljstvo_raskinuto_poen"
      : "notifikacije.prijateljstvo_raskinuto",
    parametri: { pseudonim: jaPseudonim, iznos: PRIJATELJSTVO_POEN },
    naslov: "Prijateljstvo je raskinuto",
    tekst: p.poenEvidentiran
      ? `Prijateljstvo sa ${jaPseudonim} je raskinuto. Otpisano ti je ${PRIJATELJSTVO_POEN} POENA.`
      : `Prijateljstvo sa ${jaPseudonim} je raskinuto.`,
    link: "/prijatelji",
  }).catch(() => {});

  return { ok: true, otpisano: p.poenEvidentiran ? PRIJATELJSTVO_POEN : 0 };
}

/**
 * Otpis pri prelasku u punoletstvo (čl. 19 st. 2). Otpisuje SAMO drugoj strani —
 * detetu koje postaje punoletno se otpisuje zbirno, u jednom zapisu, pa se ne
 * meša sa ovim.
 */
export async function otpisiPrijateljuPriPunoletstvu(
  prijateljId: string,
  punoletniPseudonim: string
) {
  await otpisiPoen(
    prijateljId,
    PRIJATELJSTVO_POEN,
    `Prijatelj ${punoletniPseudonim} je postao punoletan`,
    "transakcije.prijateljstvo_punoletstvo",
    { pseudonim: punoletniPseudonim }
  );
}

/** Zbirni otpis onome ko postaje punoletan (čl. 19 st. 2). */
export async function otpisiPunoletnom(korisnikId: string, iznos: number, broj: number) {
  await otpisiPoen(
    korisnikId,
    iznos,
    `Poništenje POENA iz ${broj} prijateljstava (punoletstvo)`,
    "transakcije.prijateljstvo_punoletstvo_zbirno",
    { broj }
  );
}

// ── Prikaz ────────────────────────────────────────────────────────────────────

/**
 * Spisak prijatelja i njihov broj, sa stanjem isplate.
 *
 * `naCekanju` je ono što drugu treba da vidi: „500 na čekanju" uz pseudonim, pa zna
 * koga da gnjavi. `bezPoena` je za braću i sestre — njihovo prijateljstvo radi, samo
 * ne nosi POEN.
 */
export async function dohvatiPrijatelje(korisnikId: string) {
  const [ja, redovi] = await Promise.all([
    prisma.user.findUnique({ where: { id: korisnikId }, select: IZBOR_UCESNIKA }),
    prisma.prijateljstvo.findMany({
      where: { OR: [{ aId: korisnikId }, { bId: korisnikId }], raskinutAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        poenEvidentiran: true,
        a: { select: { ...IZBOR_UCESNIKA, pseudonim: true, avatar: true, deaktiviranAt: true } },
        b: { select: { ...IZBOR_UCESNIKA, pseudonim: true, avatar: true, deaktiviranAt: true } },
      },
    }),
  ]);
  const jaUcesnik = ja ? ucesnikIzReda(ja) : null;

  const prijatelji = redovi
    .map((r) => ({ red: r, drugi: r.a.id === korisnikId ? r.b : r.a }))
    // Ugašen nalog ispada iz spiska, ali se red ne briše — prijateljstvo je bilo.
    .filter((x) => !x.drugi.deaktiviranAt)
    .map((x) => {
      const drugiUcesnik = ucesnikIzReda(x.drugi);
      const braca =
        jaUcesnik !== null &&
        jaUcesnik.roditeljIds.some((r) => drugiUcesnik.roditeljIds.includes(r));
      return {
        id: x.red.id,
        korisnikId: x.drugi.id,
        pseudonim: x.drugi.pseudonim,
        avatar: x.drugi.avatar,
        od: x.red.createdAt.toISOString(),
        evidentirano: x.red.poenEvidentiran,
        bezPoena: braca,
        // Zašto čeka: jedna strana još nije dete Kola (čl. 14b st. 2).
        naCekanju: !x.red.poenEvidentiran && !braca,
        drugiStanje: drugiUcesnik.stanje,
      };
    });

  return {
    broj: prijatelji.length,
    mojeStanje: jaUcesnik?.stanje ?? "NA_CEKANJU",
    // Koliko POEN-a čeka na drugu stranu — broj koji stoji na dečjem ekranu.
    poenNaCekanju: prijatelji.filter((p) => p.naCekanju).length * PRIJATELJSTVO_POEN,
    prijatelji,
  };
}

/** Da li su dvoje prijatelji — koristi se za vidljivost u dečjoj sobi. */
export async function suPrijatelji(x: string, y: string): Promise<boolean> {
  const [aId, bId] = par(x, y);
  return (
    (await prisma.prijateljstvo.count({ where: { aId, bId, raskinutAt: null } })) > 0
  );
}

/**
 * Da li je prijateljstvo između dvoje dece RASKINUTO i nije obnovljeno.
 *
 * 🔴 Raskid gasi i zatečene razgovore (odluka vlasnika, 31.08.2026). Do tada je
 * raskid sklanjao osobu iz Pričaonice, ali je razgovor u četiri oka nastavljao da
 * radi kao da se ništa nije desilo — pa je jedini potez kojim dete prekida kontakt
 * koštao 500 POENA i nije prekidao ono zbog čega se povlači.
 *
 * Provera se veže za RASKINUT red, ne za odsustvo prijateljstva: dvoje dece koja
 * nikad nisu bila prijatelji smeju da se dopisuju povodom oglasa (čl. 12). Kad se
 * par obnovi, aktivan red postoji i razgovor ponovo radi — kao i POEN.
 */
export const PORUKA_RASKINUTO =
  "Prijateljstvo je raskinuto, pa razgovor više ne radi. Ako se pomirite, skenirajte kod ponovo.";

export async function raskinutoIzmedju(x: string, y: string): Promise<boolean> {
  const [aId, bId] = par(x, y);
  const red = await prisma.prijateljstvo.findUnique({
    where: { aId_bId: { aId, bId } },
    select: { raskinutAt: true },
  });
  return !!red?.raskinutAt;
}

/**
 * Id-evi svih prijatelja — Pričaonica po njima filtrira poruke (čl. 18 st. 3).
 * Uvek uključuje i samog korisnika: svoje poruke čovek vidi i pre nego što ima ijednog
 * prijatelja, inače mu se posle slanja ne desi ništa na ekranu.
 */
export async function idPrijatelja(korisnikId: string): Promise<string[]> {
  const redovi = await prisma.prijateljstvo.findMany({
    where: { OR: [{ aId: korisnikId }, { bId: korisnikId }], raskinutAt: null },
    select: { aId: true, bId: true },
  });
  const skup = new Set<string>([korisnikId]);
  for (const r of redovi) skup.add(r.aId === korisnikId ? r.bId : r.aId);
  return [...skup];
}

/** Dohvata (ili pravi) zapis u Protokolu. Dete ga ima od registracije, ovo je rezerva. */
async function dohvatiWallet(korisnikId: string): Promise<string> {
  const w = await prisma.wallet.findUnique({ where: { userId: korisnikId }, select: { id: true } });
  if (w) return w.id;
  const nov = await prisma.wallet.create({
    data: { userId: korisnikId, type: "USER", balance: 0 },
    select: { id: true },
  });
  return nov.id;
}

/** Da li nalog uopšte sme da bude u Pričaonici (čl. 18 st. 2). */
export async function smeUSobu(korisnikId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: korisnikId }, select: IZBOR_UCESNIKA });
  return u ? smeUPricaonicu(ucesnikIzReda(u).stanje) : false;
}
