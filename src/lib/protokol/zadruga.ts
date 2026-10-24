import { prisma } from "@/lib/prisma";
import { Prisma, TransactionType } from "@/generated/prisma/client";
import { emitujPoen } from "./emisija";
import { PROTOKOL_WALLET_ID } from "./zrno";
import { smeDaSalje } from "@/lib/doprinos-pravila";
import { jeNadoknada } from "./nadoknada";
import { razresiNaselje } from "@/lib/naselje";
import { obavesti } from "@/lib/notifikacije";
import { upisiIdentitet, procitajImePrezime } from "./identitet";
import { gdePseudonim } from "@/lib/pseudonim";
import { USLOV_CLANA_U_SPISKU } from "@/lib/clanovi-spisak";
import {
  dospeliPragovi,
  pragLokalitetaZaNovuZadrugu,
  MIN_ZADRUGARA,
  MAX_OPIS,
  OPIS_PO_OSNOVU,
  OPIS_SR,
  TIP_PO_OSNOVU,
  smeBitiZadrugar,
  smePrimitiIzZapisa,
  type OsnovIzZapisa,
  type OsnovUZapis,
  type OsnovZapisa,
} from "@/lib/zadruga-pravila";

export * from "@/lib/zadruga-pravila";

/**
 * Servis Modula Zadruga — Pravilnik o zadrugama (set 4.7.0).
 *
 * 🔴 Krug i zadruga su ISTI kolektivni oblik (čl. 11): zadruga je red u tabeli
 * `Krug` sa `zadruga = true`, sa istim zapisom (`Wallet` tipa `KRUG`) i istim
 * dnevnikom pragova (`KrugBonusLog`). Krug koji se upiše kao zadruga zato nastavlja
 * sa svim što je imao, a prag koji je dostigao kao krug se ne ponavlja.
 *
 * 🔴 Zapis zadruge nikad ne ide u minus (Pravilnik o KOLO sistemu čl. 14 st. 3 —
 * kolektivni oblik nije među šest izuzetaka): skidanje ide `updateMany` sa uslovom
 * `balance >= iznos`, isto kao u `prepis.ts`.
 *
 * 🔴 Svaki zapis nosi osnov (čl. 13) i svoj tip transakcije — nikad `TRANSFER`.
 */

export class ZadrugaGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

function proveri(p: { ok: true } | { ok: false; razlog: string; status: number }) {
  if (!p.ok) throw new ZadrugaGreska(p.razlog, p.status);
}

function ocistiOpis(opis: unknown): string | null {
  if (typeof opis !== "string") return null;
  const s = opis.trim().replace(/\s+/g, " ");
  if (!s) return null;
  if (s.length > MAX_OPIS) throw new ZadrugaGreska(`Opis može imati najviše ${MAX_OPIS} znakova.`);
  return s;
}

/** Aktivna zadruga sa zapisom — ili greška. */
async function ucitajZadrugu(krugId: string) {
  const z = await prisma.krug.findUnique({ where: { id: krugId }, include: { wallet: true } });
  if (!z || !z.zadruga) throw new ZadrugaGreska("Zadruga ne postoji.", 404);
  if (z.prestanakAt || z.status !== "ACTIVE") throw new ZadrugaGreska("Učešće zadruge je prestalo.", 409);
  if (!z.wallet) throw new ZadrugaGreska("Zadruga nema zapis u Protokolu.", 500);
  return { ...z, wallet: z.wallet };
}

/** Čl. 5 — zapis je otvoren kad je evidentiran prvi prag (pet zadrugara). */
async function zapisOtvoren(krugId: string): Promise<boolean> {
  const n = await prisma.krugBonusLog.count({ where: { krugId, threshold: MIN_ZADRUGARA } });
  return n > 0;
}

// ── Osnivanje u sistemu ─────────────────────────────────────────────────────

export type PodaciZadruge = {
  naziv: unknown;
  lokalitet: unknown;
  maticniBroj: unknown;
  pib: unknown;
  adresa?: unknown;
  ugovorAt: unknown;
  opis?: unknown;
  /** Postojeći krug koji se upisuje kao zadruga (čl. 11 st. 3). */
  krugId?: unknown;
};

/**
 * Upis zadruge u sistem (čl. 5): podaci iz registra i dan ugovora o saradnji.
 * Zapis (`Wallet`) nastaje odmah, ali se POEN u njega evidentira tek kad se
 * povežu prvi zadrugari i dostigne prag iz čl. 10.
 */
export async function upisiZadrugu(adminId: string, p: PodaciZadruge) {
  const naziv = typeof p.naziv === "string" ? p.naziv.trim().replace(/\s+/g, " ") : "";
  if (naziv.length < 3) throw new ZadrugaGreska("Naziv zadruge mora imati najmanje 3 znaka.");
  const lokalitet = razresiNaselje(p.lokalitet);
  if (!lokalitet) throw new ZadrugaGreska("Lokalitet mora biti naselje iz šifarnika.");
  const maticniBroj = typeof p.maticniBroj === "string" ? p.maticniBroj.replace(/\s/g, "") : "";
  if (!/^\d{8}$/.test(maticniBroj)) throw new ZadrugaGreska("Matični broj ima osam cifara.");
  const pib = typeof p.pib === "string" ? p.pib.replace(/\s/g, "") : "";
  if (!/^\d{9}$/.test(pib)) throw new ZadrugaGreska("PIB ima devet cifara.");
  const ugovorAt = typeof p.ugovorAt === "string" ? new Date(p.ugovorAt) : null;
  if (!ugovorAt || Number.isNaN(ugovorAt.getTime())) {
    throw new ZadrugaGreska("Unesite dan zaključenja ugovora o saradnji.");
  }
  const adresa = typeof p.adresa === "string" && p.adresa.trim() ? p.adresa.trim() : null;
  const opis = typeof p.opis === "string" && p.opis.trim() ? p.opis.trim() : null;
  const podaci = { zadruga: true, maticniBroj, pib, adresa, ugovorAt, location: lokalitet };

  const krugId = typeof p.krugId === "string" && p.krugId ? p.krugId : null;

  // Čl. 6 st. 2–3 — prva zadruga na lokalitetu traži 50 redovnih članova tog
  // lokaliteta; sledeća ne. Lokalitet člana je mesto iz njegovog naloga (st. 4).
  const naLokalitetu = { equals: lokalitet, mode: "insensitive" as const };
  const postojiZadruga =
    (await prisma.krug.count({
      where: { zadruga: true, prestanakAt: null, status: "ACTIVE", location: naLokalitetu, ...(krugId ? { NOT: { id: krugId } } : {}) },
    })) > 0;
  const potrebno = pragLokalitetaZaNovuZadrugu(postojiZadruga);
  if (potrebno > 0) {
    const redovnih = await prisma.user.count({
      where: {
        ...USLOV_CLANA_U_SPISKU,
        // Isti brojač kao kartica lokacije (`verified`), da ekran i server ne bi
        // za isto mesto rekli dva različita broja (pravilo 14).
        verified: true,
        maloletan: false,
        location: naLokalitetu,
      },
    });
    if (redovnih < potrebno) {
      throw new ZadrugaGreska(
        `Prva zadruga u mestu ${lokalitet} otvara se sa najmanje ${potrebno} redovnih članova iz tog mesta; sada ih ima ${redovnih}.`,
        409,
      );
    }
  }
  let id: string;
  if (krugId) {
    // Krug nastavlja kao zadruga sa istim zapisom i istim dnevnikom pragova.
    const krug = await prisma.krug.findUnique({ where: { id: krugId }, include: { wallet: true } });
    if (!krug) throw new ZadrugaGreska("Krug ne postoji.", 404);
    if (krug.zadruga) throw new ZadrugaGreska("Krug je već upisan kao zadruga.", 409);
    await prisma.krug.update({ where: { id: krugId }, data: { ...podaci, name: naziv } });
    if (!krug.wallet) await prisma.wallet.create({ data: { krugId, type: "KRUG", balance: 0 } });
    id = krugId;
  } else {
    const postoji = await prisma.krug.findUnique({ where: { name: naziv } });
    if (postoji) throw new ZadrugaGreska("Zadruga ili krug sa tim nazivom već postoji.", 409);
    const z = await prisma.$transaction(async (tx) => {
      const nova = await tx.krug.create({ data: { ...podaci, name: naziv, description: opis } });
      await tx.wallet.create({ data: { krugId: nova.id, type: "KRUG", balance: 0 } });
      return nova;
    });
    id = z.id;
  }
  // Zatečeni članovi kruga su zadrugari od trenutka upisa (čl. 11 st. 3).
  await proveriIEvidentirajPragove(id);
  return { id };
}

// ── Zadrugari ───────────────────────────────────────────────────────────────

/**
 * Čl. 7 — povezivanje naloga sa zadrugom. Zadruga dostavlja ime i prezime i
 * pseudonim, za lica koja su na to pristala; dokaz pristanka čuva zadruga, a
 * sprovodilac ga potvrđuje kvačicom (`pristanak`).
 */
export async function dodajZadrugara(
  adminId: string,
  krugId: string,
  p: { pseudonim: unknown; imePrezime: unknown; pristanak: unknown },
) {
  const zadruga = await ucitajZadrugu(krugId);
  if (p.pristanak !== true) {
    throw new ZadrugaGreska("Zadrugar se povezuje samo uz pristanak lica.");
  }
  const ime = procitajImePrezime(p.imePrezime);
  if (!ime.ok) throw new ZadrugaGreska("Unesite ime i prezime zadrugara.");
  const imePrezime = ime.imePrezime;
  if (typeof p.pseudonim !== "string" || !p.pseudonim.trim()) {
    throw new ZadrugaGreska("Unesite pseudonim naloga.");
  }
  const korisnik = await prisma.user.findFirst({
    where: gdePseudonim(p.pseudonim.trim()),
    select: { id: true, pseudonim: true, tipKorisnika: true, maloletan: true, status: true, deaktiviranAt: true },
  });
  if (!korisnik) throw new ZadrugaGreska("Korisnik sa tim pseudonimom ne postoji.", 404);
  proveri(
    smeBitiZadrugar({
      tipKorisnika: korisnik.tipKorisnika,
      maloletan: korisnik.maloletan,
      status: korisnik.status,
      deaktiviran: korisnik.deaktiviranAt !== null,
    }),
  );

  // 🔴 Serializable: „samo u jednoj zadruzi" je provera pa upis, a `KrugClanstvo`
  // nema jedinstven indeks za aktivno članstvo. Pod read committed dva istovremena
  // povezivanja istog naloga u dve zadruge oba prolaze. Sada drugo pada (P2034).
  try {
  await prisma.$transaction(async (tx) => {
    // Čl. 7 st. 3 — samo u jednoj zadruzi (i krug je isti oblik).
    const aktivno = await tx.krugClanstvo.findFirst({ where: { userId: korisnik.id, leftAt: null } });
    if (aktivno) {
      throw new ZadrugaGreska(
        aktivno.krugId === krugId ? "Korisnik je već zadrugar ove zadruge." : "Korisnik je već zadrugar druge zadruge.",
        409,
      );
    }
    // Ime ide u evidenciju identiteta (čl. 31a, set 4.7.3), ne više na članstvo:
    // jedan nalog, jedno ime. `KrugClanstvo.imePrezime` nose samo zatečeni redovi.
    if ((await upisiIdentitet(korisnik.id, imePrezime, "ZADRUGA", tx)) === "RAZLIKUJE_SE") {
      throw new ZadrugaGreska(
        "Uz ovaj nalog je u evidenciji identiteta upisano drugo ime i prezime. Proverite podatke sa zadrugom.",
        409,
      );
    }
    await tx.krugClanstvo.create({
      data: { userId: korisnik.id, krugId, pristanakAt: new Date() },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034") {
      throw new ZadrugaGreska("Isti nalog se upravo povezuje i na drugom mestu. Pokušaj ponovo.", 409);
    }
    throw e;
  }

  await obavesti(korisnik.id, {
    tip: "zadruga_zadrugar",
    kljuc: "notifikacije.zadruga_zadrugar",
    parametri: { zadruga: zadruga.name },
    naslov: "Postao si zadrugar",
    tekst: `Tvoj nalog je povezan sa zadrugom ${zadruga.name}.`,
    link: `/zadruge/${krugId}`,
  });
  await proveriIEvidentirajPragove(krugId);
  return { userId: korisnik.id, pseudonim: korisnik.pseudonim };
}

/**
 * Čl. 9 — prestanak svojstva zadrugara. Ime na članstvu (zatečeni redovi) se briše
 * odmah; veza ostaje pseudonimna, jer je deo istorije pragova (čl. 11: pad broja
 * ništa ne otpisuje). Zapis u evidenciji identiteta ostaje uz nalog (čl. 31a
 * Pravilnika) i briše se tek gašenjem naloga.
 */
export async function ukloniZadrugara(krugId: string, clanstvoId: string) {
  const c = await prisma.krugClanstvo.findUnique({ where: { id: clanstvoId } });
  if (!c || c.krugId !== krugId || c.leftAt) throw new ZadrugaGreska("Zadrugar nije pronađen.", 404);
  await prisma.krugClanstvo.update({
    where: { id: clanstvoId },
    data: { leftAt: new Date(), imePrezime: null, pristanakAt: null },
  });
}

// ── Rast (čl. 10–11) ────────────────────────────────────────────────────────

/**
 * Evidentira sve dostignute a neevidentirane pragove. Poziva se posle svakog
 * povezivanja zadrugara i pri upisu kruga kao zadruge.
 *
 * Prag se prvo rezerviše jedinstvenim redom (`@@unique([krugId, threshold])`) —
 * paralelni poziv dobija P2002 i preskače, pa se svaki prag evidentira tačno jednom.
 * `emitujPoen` otvara sopstvenu transakciju i zato ide van svake druge (pravilo 8).
 */
export async function proveriIEvidentirajPragove(krugId: string) {
  const z = await prisma.krug.findUnique({ where: { id: krugId }, include: { wallet: true } });
  if (!z?.wallet || !z.zadruga || z.prestanakAt) return;
  const [broj, logovi] = await Promise.all([
    prisma.krugClanstvo.count({ where: { krugId, leftAt: null } }),
    prisma.krugBonusLog.findMany({ where: { krugId }, select: { threshold: true } }),
  ]);
  for (const prag of dospeliPragovi(broj, logovi.map((l) => l.threshold))) {
    try {
      await prisma.krugBonusLog.create({ data: { krugId, threshold: prag.clanovi, amount: prag.poen } });
    } catch (e) {
      if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") continue;
      throw e;
    }
    // 🔴 Ako emisija padne, rezervacija praga se vraća — inače bi prag ostao
    // „evidentiran" bez ijednog POEN-a i nikad se ne bi ponovio (čl. 11).
    try {
      await emitujPoen(
        z.wallet.id,
        prag.poen,
        prag.clanovi === MIN_ZADRUGARA ? TransactionType.EMISIJA_KRUG_OSNIVANJE : TransactionType.EMISIJA_KRUG_BONUS,
        `Rast zadruge „${z.name}" — ${prag.clanovi} zadrugara`,
        { kljuc: "transakcije.zadruga_rast", parametri: { zadruga: z.name, clanovi: prag.clanovi } },
      );
    } catch (e) {
      await prisma.krugBonusLog.deleteMany({ where: { krugId, threshold: prag.clanovi } });
      throw e;
    }
  }
}

// ── Zapisi sa osnovom (čl. 13–17) ───────────────────────────────────────────

/**
 * Prepis između dva zapisa, atomski i bez minusa na strani koja daje.
 * Dozvole proverava pozivalac.
 */
async function prepisiSaOsnovom(
  odWalletId: string,
  kaWalletId: string,
  iznos: number,
  osnov: OsnovZapisa,
  parametri: Record<string, string | number>,
  opis: string | null,
) {
  await prisma.$transaction(async (tx) => {
    const skinuto = await tx.wallet.updateMany({
      where: { id: odWalletId, balance: { gte: iznos } },
      data: { balance: { decrement: iznos } },
    });
    if (skinuto.count !== 1) throw new ZadrugaGreska("Na zapisu nema dovoljno POEN-a.");
    await tx.wallet.update({ where: { id: kaWalletId }, data: { balance: { increment: iznos } } });
    await tx.transaction.create({
      data: {
        fromWalletId: odWalletId,
        toWalletId: kaWalletId,
        amount: iznos,
        type: TIP_PO_OSNOVU[osnov] as TransactionType,
        description: opis ? `${OPIS_SR[osnov]}: ${opis}` : OPIS_SR[osnov],
        opisKljuc: OPIS_PO_OSNOVU[osnov],
        // Slobodan opis se ne prevodi (napisao ga je čovek), pa ide u parametar
        // sa svojom crtom — ključ ga samo nadovezuje.
        opisParametri: { ...parametri, opis: opis ? ` — ${opis}` : "" },
      },
    });
  });
}

/**
 * Zapis IZ zapisa zadruge korisniku (prijem dobra, zadružni doprinos, primljena
 * usluga). Sprovodi lice iz administratorskog tima u ime zadruge (čl. 16).
 * Iznos određuje zadruga (čl. 15) — ovde se samo upisuje.
 */
export async function zapisIzZadruge(
  sprovodilacId: string,
  krugId: string,
  p: { osnov: OsnovIzZapisa; pseudonim: unknown; iznos: number; opis: unknown },
) {
  const zadruga = await ucitajZadrugu(krugId);
  if (!(await zapisOtvoren(krugId))) {
    throw new ZadrugaGreska(`Zapis zadruge se otvara sa ${MIN_ZADRUGARA} zadrugara.`, 409);
  }
  const opis = ocistiOpis(p.opis);
  if (typeof p.pseudonim !== "string" || !p.pseudonim.trim()) throw new ZadrugaGreska("Unesite pseudonim primaoca.");
  const primalac = await prisma.user.findFirst({
    where: gdePseudonim(p.pseudonim.trim()),
    select: { id: true, pseudonim: true, maloletan: true, status: true, deaktiviranAt: true, wallet: { select: { id: true } } },
  });
  if (!primalac?.wallet) throw new ZadrugaGreska("Korisnik sa tim pseudonimom ne postoji.", 404);
  proveri(
    smePrimitiIzZapisa(
      { maloletan: primalac.maloletan, aktivan: primalac.status === "ACTIVE" && primalac.deaktiviranAt === null },
      primalac.id === sprovodilacId,
    ),
  );
  await prepisiSaOsnovom(zadruga.wallet.id, primalac.wallet.id, p.iznos, p.osnov, { zadruga: zadruga.name }, opis);
  await obavesti(primalac.id, {
    tip: "zadruga_zapis",
    kljuc: "notifikacije.zadruga_zapis_primljen",
    parametri: { iznos: p.iznos, zadruga: zadruga.name },
    naslov: `Zadruga ti je prepisala ${p.iznos.toLocaleString("sr-RS")} POEN`,
    tekst: `Zadruga ${zadruga.name} ti je prepisala ${p.iznos.toLocaleString("sr-RS")} POEN${opis ? ` — ${opis}` : ""}.`,
    link: "/novcanik",
  });
}

/**
 * Izdavanje dobra DRUGOJ zadruzi (čl. 14 st. 2): POEN ide iz zapisa zadruge koja
 * prima dobro u zapis zadruge koja ga izdaje. Sprovodi administratorski tim, po
 * nalogu obe zadruge.
 */
export async function izdavanjeDrugojZadruzi(
  krugId: string,
  p: { primalacZadrugaId: unknown; iznos: number; opis: unknown },
) {
  const izdaje = await ucitajZadrugu(krugId);
  if (typeof p.primalacZadrugaId !== "string" || p.primalacZadrugaId === krugId) {
    throw new ZadrugaGreska("Izaberite drugu zadrugu.");
  }
  const prima = await ucitajZadrugu(p.primalacZadrugaId);
  if (!(await zapisOtvoren(krugId)) || !(await zapisOtvoren(prima.id))) {
    throw new ZadrugaGreska(`Zapis zadruge se otvara sa ${MIN_ZADRUGARA} zadrugara.`, 409);
  }
  const opis = ocistiOpis(p.opis);
  await prepisiSaOsnovom(prima.wallet.id, izdaje.wallet.id, p.iznos, "IZDAVANJE", { zadruga: izdaje.name, druga: prima.name }, opis);
}

/**
 * Zapis U zapis zadruge od zadrugara (izdato dobro, korišćenje opreme, usluga
 * zadruge). Pokreće ga sam zadrugar — POEN se iz tuđeg zapisa ne skida bez
 * njegove radnje.
 */
export async function zapisUZadrugu(
  userId: string,
  krugId: string,
  p: { osnov: OsnovUZapis; iznos: number; opis: unknown },
) {
  const zadruga = await ucitajZadrugu(krugId);
  if (!(await zapisOtvoren(krugId))) {
    throw new ZadrugaGreska(`Zapis zadruge se otvara sa ${MIN_ZADRUGARA} zadrugara.`, 409);
  }
  const opis = ocistiOpis(p.opis);
  const [korisnik, clanstvo] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { tipKorisnika: true, maloletan: true, wallet: { select: { id: true, balance: true } } },
    }),
    prisma.krugClanstvo.findFirst({ where: { userId, krugId, leftAt: null } }),
  ]);
  if (!korisnik?.wallet) throw new ZadrugaGreska("Nemate zapis u Protokolu.", 500);
  // Čl. 8 — prava u okviru zadruge ima zadrugar te zadruge.
  if (!clanstvo) throw new ZadrugaGreska("Ovo mogu samo zadrugari ove zadruge.", 403);
  if (korisnik.maloletan) {
    throw new ZadrugaGreska("Radnje zadruge ne sprovode se sa nalogom deteta.", 403);
  }
  if (!smeDaSalje(korisnik.tipKorisnika)) {
    throw new ZadrugaGreska("Prepis u tuđi zapis otvara se po potvrdi.", 403);
  }
  if (jeNadoknada(korisnik.wallet.balance)) {
    throw new ZadrugaGreska("Na tvom zapisu stoji nadoknada; prepis je moguć tek kad zapis pređe nulu.");
  }
  await prepisiSaOsnovom(korisnik.wallet.id, zadruga.wallet.id, p.iznos, p.osnov, { zadruga: zadruga.name }, opis);
}

// ── Prestanak učešća (čl. 20; Pravilnik o KOLO sistemu čl. 56) ──────────────

/**
 * Zatvara zapis zadruge: POEN se poništava protivzapisom u korist Protokola
 * (opticaj opada), svojstvo zadrugara prestaje i imena se brišu. Zapisi korisnika
 * nastali ranije ostaju netaknuti.
 */
export async function prestanakZadruge(krugId: string) {
  const zadruga = await ucitajZadrugu(krugId);
  const sada = new Date();
  const ponisteno = await prisma.$transaction(async (tx) => {
    // 🔴 Zaključava zapis pre čitanja: prepis koji stigne između čitanja i umanjenja
    // inače bi ostao u zatvorenom zapisu. Prepis čeka da se ova transakcija završi.
    await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${zadruga.wallet.id} FOR UPDATE`;
    const w = await tx.wallet.findUniqueOrThrow({ where: { id: zadruga.wallet.id } });
    if (w.balance > 0) {
      await tx.wallet.update({ where: { id: w.id }, data: { balance: { decrement: w.balance } } });
      await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: w.balance } } });
      await tx.transaction.create({
        data: {
          fromWalletId: w.id,
          toWalletId: PROTOKOL_WALLET_ID,
          amount: w.balance,
          type: TransactionType.PONISTENJE_ZAPISA_ZADRUGE,
          description: `Prestanak učešća zadruge „${zadruga.name}" — poništenje zapisa`,
          opisKljuc: "transakcije.zadruga_prestanak",
          opisParametri: { zadruga: zadruga.name },
        },
      });
    }
    await tx.krugClanstvo.updateMany({
      where: { krugId, leftAt: null },
      data: { leftAt: sada, imePrezime: null, pristanakAt: null },
    });
    await tx.krug.update({ where: { id: krugId }, data: { prestanakAt: sada, status: "SUSPENDED" } });
    return w.balance;
  });
  return { ponisteno };
}

// ── Prikaz ──────────────────────────────────────────────────────────────────

/**
 * Zadruge u radu, za spisak po lokalitetima (`/zadruge` i kartica „Lokacije" na
 * `/sistem` — jedan upit za oba ekrana). Bez ijednog podatka o zadrugarima osim
 * broja; ime i prezime se ovde ne čita.
 */
export async function zadrugeZaPrikaz() {
  const z = await prisma.krug.findMany({
    where: { zadruga: true, prestanakAt: null, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      location: true,
      _count: { select: { memberships: { where: { leftAt: null } } } },
    },
  });
  return z.map((r) => ({ id: r.id, naziv: r.name, lokalitet: r.location, zadrugara: r._count.memberships }));
}
