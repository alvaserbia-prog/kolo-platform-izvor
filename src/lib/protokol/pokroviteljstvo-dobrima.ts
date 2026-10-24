/**
 * Pokroviteljstvo dobrima i uslugama — servisne funkcije (Prisma).
 *
 * Osnov: Pravilnik o pokroviteljstvu i donacijama Glava IVa (čl. 13d–13l);
 * Pravilnik o projektima i kolektivnim nabavkama Glava VIIIa (čl. 30b–30g);
 * Pravilnik o KOLO sistemu čl. 14 st. 3 t. 8, čl. 14a i čl. 15 st. 5.
 *
 * Čista pravila žive u `@/lib/pokroviteljstvo-dobrima-pravila` i odavde se
 * re-eksportuju, pa server ima jedan ulaz.
 *
 * Tok: prijava (NA_PREGLEDU) → Fondacija proverava da je fotografija cenovnika
 * priložena i da podaci o davaocu odgovaraju APR-u, cenu NE upoređuje (CEKA_POTPIS,
 * ugovor se generiše i SNIMA) → podnosilac potpisuje na platformi jednokratnim
 * kodom sa mejla (POTPISAN: kontrolni broj teksta, vaučeri izdati, POEN
 * evidentiran podnosiocu, primerak ugovora davaocu) → korisnici uzimaju vaučere
 * slobodno, ko prvi zatraži (PONIŠTENJE POEN-a u korist Protokola pri uzimanju)
 * → davalac potvrđuje realizaciju (vaučer je iskorišćen, POEN se ne pomera) →
 * istek (vaučer prestaje, poništenje se ne ispravlja) → po prigovoru raskid
 * ugovora: neiskorišćeni vaučeri prestaju, imaocima se poništenje ispravlja,
 * podnosiocu se otpisuje (osmi osnov, sme u minus), davalac ide na listu zabrane.
 *
 * 🔴 `emitujPoen()` otvara sopstvenu transakciju i zove se VAN `$transaction`.
 * 🔴 Vrednost ugovora NIKAD ne ulazi u `Pokrovitelj.rsdKumulativ` (čl. 13h st. 3) —
 * ovaj modul `Pokrovitelj` samo čita, nikad ne piše i ne pravi.
 * 🔴 Uz potpis se NE beleže IP adresa ni podaci o uređaju (Politika čl. 4a).
 */
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { TransactionType } from "@/generated/prisma/client";
import { emitujPoen } from "./emisija";
import { probajEvidentiratiPotvrde } from "./potvrda-poen";
import { imeNaloga, ishodUpisa, upisiIdentitet, PORUKA_DRUGO_IME } from "./identitet";
import { raspolozivo } from "./nadoknada";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { gdePseudonim } from "@/lib/pseudonim";
import { bazniUrl, emailLayout, esc, posaljiEmailRaw } from "@/lib/email";
import { prevedi } from "@/lib/prevod-servera";
import {
  generisiUgovorDobraTekst,
  koeficijentIzNovca,
  poenZaUgovor,
  poenaPoVauceru,
  otpisPoVauceru,
  otpisPriRaskidu,
  ulaziURaskid,
  vaziDoOd,
  smeNoviUgovor,
  smeUzetiVaucer,
  kljucDavaoca,
  kodSmeDaSeProveri,
  ocistiKodPotpisa,
  potvrdePotpisaOk,
  type VrstaDokaza,
  stanjeZaDavaoca,
  normalizujKod,
  ovlascenjeZaVaucer,
  smeBitiZaposleni,
  type OvlascenjeZaVaucer,
  type PredmetPrijaveDobra,
  type StanjeZaDavaoca,
  POTPIS_KOD_CIFARA,
  POTPIS_KOD_TRAJANJE_MIN,
  POTPIS_KOD_RAZMAK_SEKUNDI,
  ROK_VAZENJA_MESECI,
  FUNKCIJA_NOSIOCA_GAZDINSTVA,
  rangListaDobara,
} from "@/lib/pokroviteljstvo-dobrima-pravila";
import { upisSpremanZaPrijavu, funkcijaZaUgovor, naRangListi, kljucNovcanogPokrovitelja } from "@/lib/upis-pokrovitelja-pravila";

export * from "@/lib/pokroviteljstvo-dobrima-pravila";

const PROTOKOL_WALLET_ID = "banka-singleton";

export class VaucerGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

type Tx = Prisma.TransactionClient;

// ─── Pomoćno ─────────────────────────────────────────────────────────────────

/** Abeceda bez znakova koji se lako pobrkaju (0/O, 1/I/L). */
const ABECEDA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function noviKod(): string {
  const b = randomBytes(10);
  let s = "";
  for (let i = 0; i < 10; i++) s += ABECEDA[b[i] % ABECEDA.length];
  return s;
}

/** Prikaz koda u grupama od po pet znakova (kod se čuva bez crtice). */
export function prikazKoda(kod: string): string {
  return kod.length === 10 ? `${kod.slice(0, 5)}-${kod.slice(5)}` : kod;
}

/**
 * Heš jednokratnog koda za potpis (čl. 13g st. 4). Kod se NIKAD ne čuva u
 * čistom obliku; heš je vezan za ugovor, pa isti kod ne važi za drugi ugovor.
 */
export function hesKodaPotpisa(ugovorId: string, kod: string): string {
  return createHash("sha256").update(`${ugovorId}:${kod}`).digest("hex");
}

/** Kontrolni broj teksta ugovora (čl. 13g st. 4): SHA-256 snimljenog teksta. */
export function kontrolniBrojTeksta(tekst: string): string {
  return createHash("sha256").update(tekst, "utf8").digest("hex");
}

function istiHes(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Zbir zapisa po novčaniku (ulaz − izlaz). Koristi se da se proveri da par
 * „stanje + zapis" ostaje usklađen UNUTAR transakcije (obrazac:
 * `protokol/potvrde-parovi.ts`). Meri se RAZLIKA pre i posle, pa zatečen nesklad
 * iz prošlosti ne obara radnju — obara je samo nesklad koji bi ova radnja napravila.
 */
async function razlikaStanjaIIstorije(tx: Tx, walletId: string): Promise<number> {
  const [w, ulaz, izlaz] = await Promise.all([
    tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
    tx.transaction.aggregate({ where: { toWalletId: walletId }, _sum: { amount: true } }),
    tx.transaction.aggregate({ where: { fromWalletId: walletId }, _sum: { amount: true } }),
  ]);
  return w.balance - ((ulaz._sum.amount ?? 0) - (izlaz._sum.amount ?? 0));
}

/**
 * Upis para (stanje ±X, zapis X) u postojećoj transakciji, uz proveru da se za
 * korisnički novčanik razlika „stanje − istorija" nije pomerila.
 */
async function upisiPar(
  tx: Tx,
  p: {
    fromWalletId: string;
    toWalletId: string;
    iznos: number;
    type: TransactionType;
    description: string;
    opisKljuc: string;
    opisParametri?: Record<string, string | number>;
  },
): Promise<string> {
  // Proverava se korisnički novčanik (ne Protokol): Protokol nosi celu istoriju
  // sistema, pa bi zbir njegovih zapisa bio najskuplji upit u transakciji, a
  // zero-sum nad stanjima ga ionako pokriva (`checkZeroSum`, cron `/api/cron/zero-sum`).
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
  if (posle.some((v, i) => v !== pre[i]))
    throw new VaucerGreska("Stanje zapisa se ne slaže sa istorijom — radnja je poništena.", 500);
  return t.id;
}

/**
 * Aktivan red liste zabrane (čl. 13j st. 2). Lista se vezuje za UPIS (čl. 6a st. 6);
 * zatečeni redovi bez upisa prepoznaju se po MB, odnosno BPG.
 */
async function aktivnaZabrana(upisId: string, kljuc: { maticniBroj: string } | { bpg: string }) {
  return prisma.zabranaDavaoca.findFirst({
    where: { skinutoAt: null, OR: [{ upisId }, { upisId: null, ...kljuc }] },
    select: { id: true },
  });
}

// ─── Prijava (čl. 13e) ───────────────────────────────────────────────────────

export type DokazUlaz = {
  vrsta: VrstaDokaza;
  nazivFajla: string;
  contentType: string;
  sadrzaj: Buffer;
};

/**
 * Podnošenje prijave (čl. 13e) — iz ODOBRENOG upisa pokrovitelja (čl. 6a st. 6) koji
 * vodi podnosilac. Podaci o davaocu, odnos, kontakt, izjava o ovlašćenju i potvrda o
 * evidentiranju (trenutak i snimljen tekst) prenose se iz upisa kao SNIMAK — ugovor
 * se generiše iz njih i posle se ne menja.
 */
export async function podnesiPrijavu(
  userId: string,
  upisId: string,
  podaci: PredmetPrijaveDobra,
  mesto: string,
  dokazi: DokazUlaz[],
) {
  const korisnik = await prisma.user.findUnique({
    where: { id: userId },
    select: { verified: true, maloletan: true, deaktiviranAt: true },
  });
  if (!korisnik || korisnik.deaktiviranAt) throw new VaucerGreska("Korisnik nije pronađen.", 404);
  if (!korisnik.verified) throw new VaucerGreska("Samo verifikovani korisnici mogu pokrenuti pokroviteljstvo.", 403);
  if (korisnik.maloletan) throw new VaucerGreska("Prijavu pokroviteljstva ne može podneti maloletni korisnik.", 403);

  // 🔴 Upis je uslov prijave (čl. 6a st. 6, čl. 13e st. 1).
  const upis = upisId ? await prisma.upisPokrovitelja.findUnique({ where: { id: upisId } }) : null;
  if (!upis) throw new VaucerGreska("Prijava se podnosi iz upisa pokrovitelja u evidenciju.", 400);
  // Čl. 13f st. 4 i čl. 13j st. 2 — kvota i lista zabrane, po upisu.
  const kljuc = kljucDavaoca({ vrstaDavaoca: upis.vrsta, maticniBroj: upis.maticniBroj, bpg: upis.bpg });
  const [uToku, prethodni, zabrana] = await Promise.all([
    prisma.ugovorDobra.count({
      where: { upisId: upis.id, status: { in: ["NA_PREGLEDU", "CEKA_POTPIS"] } },
    }),
    prisma.ugovorDobra.findFirst({
      where: { upisId: upis.id, status: "POTPISAN" },
      orderBy: { potpisanoAt: "desc" },
      select: { brojVaucera: true, vaziDo: true, naredniDozvoljenAt: true, _count: { select: { vauceri: { where: { status: "ISKORISCEN" } } } } },
    }),
    aktivnaZabrana(upis.id, kljuc),
  ]);
  const spreman = upisSpremanZaPrijavu(upis, { userId, vrstaPrijave: "DOBRA", naListiZabrane: !!zabrana });
  if (!spreman.ok) throw new VaucerGreska(spreman.razlog, upis.vlasnikUserId === userId ? 409 : 403);

  // Jedan nalog, jedno ime (Pravilnik čl. 31a st. 3).
  const imePrezime = upis.imePrezime!;
  if (ishodUpisa(await imeNaloga(userId), imePrezime) === "RAZLIKUJE_SE")
    throw new VaucerGreska(PORUKA_DRUGO_IME, 409);

  const kvota = smeNoviUgovor({
    uToku: uToku > 0,
    prethodni: prethodni
      ? {
          brojVaucera: prethodni.brojVaucera,
          iskorisceno: prethodni._count.vauceri,
          vaziDo: prethodni.vaziDo,
          naredniDozvoljen: !!prethodni.naredniDozvoljenAt,
        }
      : null,
    naListiZabrane: !!zabrana,
    sada: new Date(),
  });
  if (!kvota.ok) throw new VaucerGreska(kvota.razlog, 409);

  const sada = new Date();
  const ugovor = await prisma.ugovorDobra.create({
    data: {
      podnosilacId: userId,
      upisId: upis.id,
      vrstaDavaoca: upis.vrsta,
      naziv: upis.naziv,
      pib: upis.vrsta === "FIRMA" ? upis.pib : null,
      maticniBroj: upis.vrsta === "FIRMA" ? upis.maticniBroj : null,
      adresaSedista: upis.vrsta === "FIRMA" ? upis.adresaSedista : null,
      bpg: upis.vrsta === "GAZDINSTVO" ? upis.bpg : null,
      zastupnikImePrezime: imePrezime,
      zastupnikFunkcija: upis.vrsta === "GAZDINSTVO" ? FUNKCIJA_NOSIOCA_GAZDINSTVA : funkcijaZaUgovor(upis),
      odnosPremaDavaocu: upis.odnosPremaDavaocu,
      kontaktEmail: upis.kontaktEmail,
      kontaktTelefon: upis.kontaktTelefon,
      vrsta: podaci.vrsta,
      opis: podaci.opis,
      brojVaucera: podaci.brojVaucera,
      cenaPoJedinici: podaci.cenaPoJedinici,
      vrednostRsd: podaci.vrednostRsd,
      rokVazenjaMeseci: ROK_VAZENJA_MESECI,
      mesto,
      adresaPredaje: podaci.adresaPredaje,
      logoUrl: upis.logoUrl,
      izjavaPropisiAt: sada,
      // Snimak izjava iz upisa (čl. 6a st. 3).
      izjavaOvlascenjeAt: upis.izjavaOvlascenjaAt,
      potvrdaEvidentiranjaAt: upis.potvrdaEvidentiranjaAt,
      potvrdaEvidentiranjaTekst: upis.potvrdaEvidentiranjaTekst,
      dokazi: {
        create: dokazi.map((d) => ({
          vrsta: d.vrsta,
          nazivFajla: d.nazivFajla.slice(0, 200),
          contentType: d.contentType,
          velicina: d.sadrzaj.length,
          sadrzaj: new Uint8Array(d.sadrzaj),
        })),
      },
    },
    select: { id: true },
  });

  void posaljiAdminAlert("Nova prijava pokroviteljstva dobrima i uslugama", `Davalac: ${upis.naziv}`);
  return ugovor;
}

// ─── Pregled Fondacije (čl. 13f st. 2) ───────────────────────────────────────

/**
 * Prihvatanje prijave. Fondacija proverava SAMO da je fotografija cenovnika
 * priložena — podatke o davaocu je uporedila sa registrom pri odobrenju upisa
 * (čl. 6a st. 4), pa prijava prolazi samo iz odobrenog upisa.
 * 🔴 Cenu ne procenjuje, ne upoređuje i ne određuje (čl. 13f st. 2). Generiše se i
 * SNIMA tekst ugovora (čl. 13g st. 1).
 */
export async function prihvatiPrijavu(id: string, adminId: string) {
  const u = await prisma.ugovorDobra.findUnique({
    where: { id },
    include: {
      _count: { select: { dokazi: { where: { vrsta: "CENOVNIK" } } } },
      upis: { select: { status: true, obrisanAt: true, aprProveraAt: true } },
    },
  });
  if (!u) throw new VaucerGreska("Prijava nije pronađena.", 404);
  const gazdinstvo = u.vrstaDavaoca === "GAZDINSTVO";
  if (!u.upis || u.upis.status !== "ODOBREN" || u.upis.obrisanAt)
    throw new VaucerGreska("Upis pokrovitelja nije odobren — prvo odobri upis (Admin → Pokrovitelji → Upisi).", 409);
  if (u._count.dokazi === 0) throw new VaucerGreska("Uz prijavu nije priložena fotografija cenovnika.", 409);
  if (u.status !== "NA_PREGLEDU") throw new VaucerGreska("Prijava je već obrađena.", 409);
  if (!u.odnosPremaDavaocu || !u.kontaktEmail || !u.kontaktTelefon)
    throw new VaucerGreska("Prijava nema odnos podnosioca prema davaocu ili kontakt davaoca — odbij je uz obrazloženje.", 409);
  if (ishodUpisa(await imeNaloga(u.podnosilacId), u.zastupnikImePrezime) === "RAZLIKUJE_SE")
    throw new VaucerGreska(PORUKA_DRUGO_IME, 409);

  const sada = new Date();
  const ugovorTekst = generisiUgovorDobraTekst({
    vrstaDavaoca: u.vrstaDavaoca,
    bpg: u.bpg,
    naziv: u.naziv,
    pib: u.pib,
    maticniBroj: u.maticniBroj,
    adresaSedista: u.adresaSedista,
    zastupnikImePrezime: u.zastupnikImePrezime,
    zastupnikFunkcija: gazdinstvo ? FUNKCIJA_NOSIOCA_GAZDINSTVA : u.zastupnikFunkcija,
    odnosPremaDavaocu: u.odnosPremaDavaocu,
    kontaktEmail: u.kontaktEmail,
    kontaktTelefon: u.kontaktTelefon,
    vrsta: u.vrsta,
    opis: u.opis,
    brojVaucera: u.brojVaucera,
    cenaPoJedinici: Number(u.cenaPoJedinici),
    vrednostRsd: Number(u.vrednostRsd),
    mesto: u.mesto,
    adresaPredaje: u.adresaPredaje,
    datum: sada,
  });

  const r = await prisma.ugovorDobra.updateMany({
    where: { id, status: "NA_PREGLEDU" },
    data: {
      status: "CEKA_POTPIS",
      ugovorTekst,
      pregledaoId: adminId,
      pregledanoAt: sada,
      // Za firmu se beleži samo DA je poređenje sa registrom izvršeno — pri odobrenju
      // upisa (čl. 6a st. 4); gazdinstvo se ne poredi sa APR-om.
      aprUporedjenAt: gazdinstvo ? null : u.upis.aprProveraAt,
    },
  });
  if (r.count === 0) throw new VaucerGreska("Prijava je već obrađena.", 409);

  await logAdminAkcija(adminId, "POKROVITELJSTVO_DOBRA_PRIHVACENO", id, `vaučera ${u.brojVaucera}`);
  await obavesti(u.podnosilacId, {
    tip: "pokroviteljstvo_dobra",
    kljuc: "notifikacije.pokroviteljstvo_dobra_prihvaceno",
    naslov: "Prijava prihvaćena — ugovor čeka potpis",
    tekst: "Fondacija je prihvatila prijavu pokroviteljstva dobrima i uslugama. Ugovor čeka tvoj potpis.",
    link: "/vauceri/davalac",
  });
}

export async function odbijPrijavuDobra(id: string, adminId: string, razlog: string) {
  const r0 = razlog.trim();
  if (r0.length < 5) throw new VaucerGreska("Obrazloženje je obavezno.");
  const u = await prisma.ugovorDobra.findUnique({ where: { id }, select: { podnosilacId: true, status: true } });
  if (!u) throw new VaucerGreska("Prijava nije pronađena.", 404);
  const r = await prisma.ugovorDobra.updateMany({
    where: { id, status: { in: ["NA_PREGLEDU", "CEKA_POTPIS"] } },
    data: {
      status: "ODBIJEN", odbijenoRazlog: r0, pregledaoId: adminId, pregledanoAt: new Date(),
      potpisKodHash: null, potpisKodIstice: null,
    },
  });
  if (r.count === 0) throw new VaucerGreska("Prijava je već obrađena.", 409);
  await logAdminAkcija(adminId, "POKROVITELJSTVO_DOBRA_ODBIJENO", id, r0);
  await obavesti(u.podnosilacId, {
    tip: "pokroviteljstvo_dobra",
    kljuc: "notifikacije.pokroviteljstvo_dobra_odbijeno",
    parametri: { razlog: r0 },
    naslov: "Prijava pokroviteljstva dobrima i uslugama odbijena",
    tekst: `Prijava je odbijena. Razlog: ${r0}`,
    link: "/vauceri/davalac",
  });
}

// ─── Potpis jednokratnim kodom (čl. 13g st. 4) ───────────────────────────────

/**
 * Šalje jednokratni šestocifreni kod na adresu elektronske pošte podnosioca.
 * U bazi ostaje samo heš koda, rok (15 minuta) i brojač pokušaja (nula).
 * Novi kod poništava prethodni.
 */
export async function posaljiKodZaPotpis(id: string, userId: string) {
  const u = await prisma.ugovorDobra.findUnique({
    where: { id },
    select: {
      podnosilacId: true, status: true, ugovorTekst: true, potpisKodPoslatAt: true, opis: true,
      podnosilac: { select: { email: true, jezik: true, pseudonim: true } },
    },
  });
  if (!u) throw new VaucerGreska("Ugovor nije pronađen.", 404);
  if (u.podnosilacId !== userId) throw new VaucerGreska("Nije vaš ugovor.", 403);
  if (u.status !== "CEKA_POTPIS" || !u.ugovorTekst) throw new VaucerGreska("Ugovor nije u stanju čekanja potpisa.", 409);
  if (!u.podnosilac.email) throw new VaucerGreska("Nalog nema adresu elektronske pošte na koju bi kod stigao.", 409);
  const sada = new Date();
  if (u.potpisKodPoslatAt && sada.getTime() - u.potpisKodPoslatAt.getTime() < POTPIS_KOD_RAZMAK_SEKUNDI * 1000)
    throw new VaucerGreska("Kod je upravo poslat. Novi kod možeš zatražiti za minut.", 429);

  const kod = String(randomInt(0, 10 ** POTPIS_KOD_CIFARA)).padStart(POTPIS_KOD_CIFARA, "0");
  const r = await prisma.ugovorDobra.updateMany({
    where: { id, status: "CEKA_POTPIS" },
    data: {
      potpisKodHash: hesKodaPotpisa(id, kod),
      potpisKodIstice: new Date(sada.getTime() + POTPIS_KOD_TRAJANJE_MIN * 60 * 1000),
      potpisKodPokusaja: 0,
      potpisKodPoslatAt: sada,
    },
  });
  if (r.count === 0) throw new VaucerGreska("Ugovor nije u stanju čekanja potpisa.", 409);

  const jezik = u.podnosilac.jezik ?? "sr";
  const poslato = await posaljiEmailRaw(
    u.podnosilac.email,
    prevedi(jezik, "vauceri.mejl_kod_naslov"),
    emailLayout({
      naslov: prevedi(jezik, "vauceri.mejl_kod_naslov"),
      pozdrav: u.podnosilac.pseudonim,
      telo: [
        prevedi(jezik, "vauceri.mejl_kod_telo", { opis: esc(u.opis) }),
        `<strong style="font-size:22px;letter-spacing:4px;">${kod}</strong>`,
        prevedi(jezik, "vauceri.mejl_kod_rok", { minuta: POTPIS_KOD_TRAJANJE_MIN }),
      ],
      jezik,
    }),
    "potpis-ugovora-dobra",
  );
  if (!poslato) throw new VaucerGreska("Kod nije poslat. Pokušaj ponovo za minut.", 502);
  return { istice: new Date(sada.getTime() + POTPIS_KOD_TRAJANJE_MIN * 60 * 1000).toISOString() };
}

/**
 * Potpis ugovora (čl. 13g st. 4): tri potvrde (pročitao, ovlašćen, saglasan sa
 * zaključenjem potvrdom na platformi) i tačan jednokratni kod.
 *
 * U jednoj transakciji: ugovor prelazi u POTPISAN, beleže se vreme zaključenja i
 * kontrolni broj snimljenog teksta, briše se heš koda, izdaju se vaučeri (SLOBODAN,
 * odmah dostupni — nabavke čl. 30e) i snimaju koeficijent i broj POEN-a. Posle nje,
 * VAN transakcije, `emitujPoen()` evidentira POEN podnosiocu prijave, a primerak
 * ugovora ide davaocu (kontakt mejl) i podnosiocu.
 *
 * 🔴 Koeficijent se čita iz `Pokrovitelj.rsdKumulativ` po PIB-u, odnosno BPG-u
 * gazdinstva — dakle samo iz NOVČANOG doprinosa. Ništa se ne upisuje u kumulativ ni u `PokroviteljDoprinos`.
 * 🔴 Ne beleže se IP adresa ni podaci o uređaju.
 */
export async function potpisiUgovorDobra(
  id: string,
  userId: string,
  unos: { kod: unknown; procitao: unknown; ovlascen: unknown; saglasan: unknown },
  requestOrigin?: string,
) {
  if (!potvrdePotpisaOk(unos))
    throw new VaucerGreska("Pre potpisa potvrdi da si ugovor pročitao, da si ovlašćen da ga zaključiš i da si saglasan sa zaključenjem na platformi.");
  const kod = ocistiKodPotpisa(unos.kod);
  if (!kod) throw new VaucerGreska("Upiši šestocifreni kod sa mejla.");

  const u = await prisma.ugovorDobra.findUnique({ where: { id } });
  if (!u) throw new VaucerGreska("Ugovor nije pronađen.", 404);
  if (u.podnosilacId !== userId) throw new VaucerGreska("Nije vaš ugovor.", 403);
  if (u.status !== "CEKA_POTPIS" || !u.ugovorTekst) throw new VaucerGreska("Ugovor nije u stanju čekanja potpisa.", 409);

  const sada = new Date();
  const smeKod = kodSmeDaSeProveri({ hash: u.potpisKodHash, istice: u.potpisKodIstice, pokusaja: u.potpisKodPokusaja }, sada);
  if (!smeKod.ok) throw new VaucerGreska(smeKod.razlog, 409);
  if (!istiHes(hesKodaPotpisa(id, kod), u.potpisKodHash!)) {
    // Pokušaj se broji atomarno — dva istovremena pogrešna unosa troše dva pokušaja.
    await prisma.ugovorDobra.updateMany({
      where: { id, status: "CEKA_POTPIS" },
      data: { potpisKodPokusaja: { increment: 1 } },
    });
    throw new VaucerGreska("Kod nije tačan.", 400);
  }

  const podnosilac = await prisma.user.findUnique({
    where: { id: userId },
    select: { maloletan: true, email: true, jezik: true, pseudonim: true, wallet: { select: { id: true } } },
  });
  if (!podnosilac || podnosilac.maloletan || !podnosilac.wallet)
    throw new VaucerGreska("Ugovor ne može potpisati ovaj nalog.", 403);
  if (ishodUpisa(await imeNaloga(userId), u.zastupnikImePrezime) === "RAZLIKUJE_SE")
    throw new VaucerGreska(PORUKA_DRUGO_IME, 409);

  // Koeficijent iz novčanog kumulativa (čl. 13h st. 2). Bez novčanog doprinosa 1,00.
  // Novčani pokrovitelj se vodi po PIB-u, a registrovano gazdinstvo po BPG-u (set
  // 4.7.9: gazdinstvo daje i novac) — `kljucNovcanogPokrovitelja`, isti ključ kojim
  // novčana prijava vodi kumulativ. Gazdinstvo bez novčanog doprinosa: 1,00.
  const kljucNovca = kljucNovcanogPokrovitelja({ vrsta: u.vrstaDavaoca, pib: u.pib, bpg: u.bpg });
  const novcano = kljucNovca
    ? await prisma.pokrovitelj.findUnique({ where: kljucNovca, select: { rsdKumulativ: true } })
    : null;
  const koeficijent = koeficijentIzNovca(novcano ? Number(novcano.rsdKumulativ) : null);
  const vrednost = Number(u.vrednostRsd);
  const poen = poenZaUgovor(vrednost, koeficijent);
  const poPoVauceru = poenaPoVauceru(vrednost, u.brojVaucera);
  const vaziDo = vaziDoOd(sada, ROK_VAZENJA_MESECI);
  const kontrolniBroj = kontrolniBrojTeksta(u.ugovorTekst);

  await prisma.$transaction(async (tx) => {
    const r = await tx.ugovorDobra.updateMany({
      where: { id, status: "CEKA_POTPIS", potpisKodHash: u.potpisKodHash },
      data: {
        status: "POTPISAN", potpisanoAt: sada, kontrolniBroj, vaziDo, koeficijent, poenEvidentirano: poen,
        poenaPoVauceru: poPoVauceru, rokVazenjaMeseci: ROK_VAZENJA_MESECI,
        potpisKodHash: null, potpisKodIstice: null,
      },
    });
    if (r.count === 0) throw new VaucerGreska("Ugovor je već potpisan.", 409);
    const kodovi = new Set<string>();
    while (kodovi.size < u.brojVaucera) kodovi.add(noviKod());
    await tx.vaucer.createMany({ data: [...kodovi].map((kod) => ({ ugovorId: id, kod })) });
  });

  // Van transakcije — emitujPoen otvara sopstvenu.
  let transakcijaId: string;
  try {
    const { transaction } = await emitujPoen(
      podnosilac.wallet.id,
      poen,
      TransactionType.EMISIJA_POKROVITELJ_DOBRA,
      `Evidentiran doprinos po pokroviteljstvu dobrima i uslugama: ${poen.toLocaleString("sr-RS")} POEN`,
      { kljuc: "transakcije.pokroviteljstvo_dobra", parametri: { iznos: poen } },
    );
    transakcijaId = transaction.id;
  } catch (e) {
    // Vraćanje u stanje pre potpisa: vaučeri koje još niko nije uzeo se brišu.
    await prisma.$transaction(async (tx) => {
      await tx.vaucer.deleteMany({ where: { ugovorId: id, status: "SLOBODAN" } });
      await tx.ugovorDobra.update({
        where: { id },
        data: {
          status: "CEKA_POTPIS", potpisanoAt: null, kontrolniBroj: null, vaziDo: null, koeficijent: null,
          poenEvidentirano: null, poenaPoVauceru: null,
        },
      });
    });
    throw e;
  }
  await prisma.ugovorDobra.update({ where: { id }, data: { emisijaTxId: transakcijaId } });

  // Evidencija identiteta (čl. 13e st. 8, čl. 31a st. 2 t. 4) — ishod je proveren gore.
  await upisiIdentitet(userId, u.zastupnikImePrezime, "POKROVITELJSTVO").catch((e) =>
    console.error("[pokroviteljstvo-dobra] upis u evidenciju identiteta nije uspeo", { id, e }),
  );
  // Pokroviteljstvo je trag učešća (dokaz stvarnosti čl. 7). Ne baca.
  await probajEvidentiratiPotvrde(userId);

  await obavesti(userId, {
    tip: "pokroviteljstvo_dobra",
    kljuc: "notifikacije.pokroviteljstvo_dobra_potpisano",
    parametri: { poen, broj: u.brojVaucera },
    naslov: "Ugovor potpisan, vaučeri izdati",
    tekst: `Ugovor je potpisan i izdato je ${u.brojVaucera} vaučera. Evidentirano je ${poen.toLocaleString("sr-RS")} POEN.`,
    link: "/vauceri/davalac",
  });

  // Primerak ugovora za štampu (čl. 13g st. 4): davaocu na kontakt mejl i podnosiocu.
  await posaljiPrimerakUgovora({
    id,
    ugovorTekst: u.ugovorTekst,
    potpisanoAt: sada,
    kontrolniBroj,
    kontaktEmail: u.kontaktEmail,
    podnosilac: { email: podnosilac.email, jezik: podnosilac.jezik, pseudonim: podnosilac.pseudonim },
    requestOrigin,
  });

  return { poen, koeficijent, brojVaucera: u.brojVaucera, kontrolniBroj };
}

/** Zaglavlje primerka: „Zaključeno elektronski na Platformi KOLO, dana …, u … časova, kontrolni broj …". */
export function zaglavljePrimerka(jezik: string | null | undefined, potpisanoAt: Date, kontrolniBroj: string): string {
  const vreme = (o: Intl.DateTimeFormatOptions) =>
    potpisanoAt.toLocaleString("sr-RS", { timeZone: "Europe/Belgrade", ...o });
  return prevedi(jezik, "vauceri.primerak_zaglavlje", {
    datum: vreme({ day: "2-digit", month: "2-digit", year: "numeric" }),
    vreme: vreme({ hour: "2-digit", minute: "2-digit", hour12: false }),
    kontrolni: kontrolniBroj,
  });
}

async function posaljiPrimerakUgovora(p: {
  id: string;
  ugovorTekst: string;
  potpisanoAt: Date;
  kontrolniBroj: string;
  kontaktEmail: string | null;
  podnosilac: { email: string | null; jezik: string | null; pseudonim: string };
  requestOrigin?: string;
}) {
  const telo = (jezik: string) => [
    esc(zaglavljePrimerka(jezik, p.potpisanoAt, p.kontrolniBroj)),
    ...p.ugovorTekst.split("\n").filter((r) => r.trim()).map((r) => esc(r)),
  ];
  try {
    if (p.kontaktEmail) {
      // Davalac nije nužno korisnik platforme — dobija ceo tekst u mejlu.
      await posaljiEmailRaw(
        p.kontaktEmail,
        prevedi("sr", "vauceri.mejl_primerak_naslov"),
        emailLayout({
          naslov: prevedi("sr", "vauceri.mejl_primerak_naslov"),
          telo: [prevedi("sr", "vauceri.mejl_primerak_davalac"), ...telo("sr")],
          jezik: "sr",
        }),
        "primerak-ugovora-dobra",
      );
    }
    if (p.podnosilac.email && p.podnosilac.email !== p.kontaktEmail) {
      const jezik = p.podnosilac.jezik ?? "sr";
      await posaljiEmailRaw(
        p.podnosilac.email,
        prevedi(jezik, "vauceri.mejl_primerak_naslov"),
        emailLayout({
          naslov: prevedi(jezik, "vauceri.mejl_primerak_naslov"),
          pozdrav: p.podnosilac.pseudonim,
          telo: [prevedi(jezik, "vauceri.mejl_primerak_podnosilac"), ...telo(jezik)],
          dugme: {
            tekst: prevedi(jezik, "vauceri.mejl_primerak_dugme"),
            link: `${bazniUrl(p.requestOrigin)}/vauceri/davalac/ugovor/${p.id}`,
          },
          jezik,
        }),
        "primerak-ugovora-dobra",
      );
    }
  } catch (e) {
    console.error("[pokroviteljstvo-dobra] primerak ugovora nije poslat", p.id, e);
  }
}

// ─── Uzimanje vaučera (nabavke čl. 30c, 30e, 30f) ────────────────────────────

/**
 * Korisnik uzima vaučer (nabavke čl. 30f). Reda i roka za prijavu nema: vaučer
 * dobija korisnik koji ga prvi zatraži (čl. 30e st. 2).
 *
 * Sve ide u JEDNOJ transakciji:
 *  1. zapis korisnika se zaključava (`FOR UPDATE`), pa dva istovremena uzimanja
 *     istog korisnika ne mogu oba da prođu proveru „najviše dva" ni proveru POEN-a;
 *  2. uslovi se proveravaju nad zaključanim stanjem (`smeUzetiVaucer`): korisnik
 *     iz čl. 4 nabavki, nije podnosilac, izjava i PRISTANAK dati, najviše dva
 *     neiskorišćena vaučera, dovoljno raspoloživih POEN-a (stanje − rezervacije
 *     nabavke) — zapis ne ide u minus;
 *  3. slobodan vaučer se uzima uz `FOR UPDATE SKIP LOCKED` i uslovnim upisom
 *     (`status: "SLOBODAN"`), pa dva korisnika ne mogu uzeti isti vaučer;
 *  4. u zapisu korisnika se poništava broj POEN-a po vaučeru sopstvenim tipom
 *     `PONISTENJE_VAUCER`, u korist Protokola, sa opisom dobra odnosno usluge i
 *     nazivom davaoca (na taj prikaz uz pseudonim korisnik je dao pristanak);
 *  5. uz vaučer se snimaju izjava i pristanak — trenutak i tekst.
 */
export async function uzmiVaucer(
  userId: string,
  ugovorId: string,
  unos: { izjavaNepovezan: boolean; pristanakPrikaz: boolean },
  pristanakTekst: string,
) {
  if (!unos.izjavaNepovezan) throw new VaucerGreska("Potrebna je izjava da nisi povezano lice sa davaocem.", 403);
  if (!unos.pristanakPrikaz || !pristanakTekst.trim())
    throw new VaucerGreska("Bez pristanka na prikaz zapisa uz pseudonim vaučer se ne može uzeti.", 403);

  const sada = new Date();
  const ishod = await prisma.$transaction(async (tx) => {
    const korisnik = await tx.user.findUnique({
      where: { id: userId },
      select: {
        maloletan: true, deaktiviranAt: true, status: true, verified: true, indeksStvarnosti: true,
        wallet: { select: { id: true } },
      },
    });
    if (!korisnik || !korisnik.wallet) throw new VaucerGreska("Korisnik nije pronađen.", 404);
    const walletId = korisnik.wallet.id;
    await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${walletId} FOR UPDATE`;

    const u = await tx.ugovorDobra.findUnique({
      where: { id: ugovorId },
      select: {
        status: true, podnosilacId: true, opis: true, naziv: true, vaziDo: true, vrednostRsd: true,
        brojVaucera: true, poenaPoVauceru: true,
        upis: { select: { vlasnikUserId: true, obrisanAt: true, naziv: true } },
      },
    });
    // Obrisan upis: ponuda vaučera prestaje (donacije čl. 6a st. 6).
    if (!u || u.status !== "POTPISAN" || !u.vaziDo || u.vaziDo.getTime() <= sada.getTime() || u.upis?.obrisanAt)
      throw new VaucerGreska("Vaučeri ovog ugovora nisu dostupni.", 404);
    const poenaPoV = u.poenaPoVauceru ?? poenaPoVauceru(Number(u.vrednostRsd), u.brojVaucera);

    const [w, nab, aktivnih] = await Promise.all([
      tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
      tx.nabavkaPrijava.aggregate({ where: { userId, status: "POTVRDIO" }, _sum: { rezervisano: true } }),
      tx.vaucer.count({ where: { imalacId: userId, status: "DODELJEN" } }),
    ]);
    const provera = smeUzetiVaucer({
      ...korisnik,
      userId,
      // Ni korisnik koji vodi upis ne uzima vaučere svog pokrovitelja (čl. 13k).
      podnosilacId: u.upis?.vlasnikUserId === userId ? userId : u.podnosilacId,
      izjavaNepovezan: unos.izjavaNepovezan,
      pristanakPrikaz: unos.pristanakPrikaz,
      aktivnihVaucera: aktivnih,
      raspolozivo: raspolozivo(w.balance) - (nab._sum.rezervisano ?? 0),
      poenaPoVauceru: poenaPoV,
    });
    if (!provera.ok) throw new VaucerGreska(provera.razlog, 403);

    // Prvi slobodan vaučer; zaključan red koji drugi upravo uzima se preskače.
    const slobodni = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Vaucer"
      WHERE "ugovorId" = ${ugovorId} AND status = 'SLOBODAN'
      ORDER BY "createdAt" ASC, id ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED`;
    const vaucerId = slobodni[0]?.id;
    if (!vaucerId) throw new VaucerGreska("Svi vaučeri ovog ugovora su uzeti.", 409);
    const r = await tx.vaucer.updateMany({
      where: { id: vaucerId, status: "SLOBODAN", imalacId: null },
      data: {
        status: "DODELJEN", imalacId: userId, dodeljenAt: sada, ponisteno: poenaPoV,
        izjavaNepovezanAt: sada, pristanakPrikazAt: sada, pristanakPrikazTekst: pristanakTekst,
      },
    });
    if (r.count !== 1) throw new VaucerGreska("Vaučer je u međuvremenu uzet. Pokušaj ponovo.", 409);

    const txId = await upisiPar(tx, {
      fromWalletId: walletId,
      toWalletId: PROTOKOL_WALLET_ID,
      iznos: poenaPoV,
      type: TransactionType.PONISTENJE_VAUCER,
      description: `Vaučer: ${u.opis} — ${u.naziv}`,
      opisKljuc: "transakcije.vaucer_uzet",
      opisParametri: { opis: u.opis, davalac: u.naziv },
    });
    await tx.vaucer.update({ where: { id: vaucerId }, data: { ponistenjeTxId: txId } });
    return { vaucerId, opis: u.opis, davalac: u.naziv, poen: poenaPoV };
  });

  try {
    await obavesti(userId, {
      tip: "vaucer",
      kljuc: "notifikacije.vaucer_uzet",
      parametri: { opis: ishod.opis, davalac: ishod.davalac, poen: ishod.poen },
      naslov: "Uzeo si vaučer",
      tekst: `Uzeo si vaučer: ${ishod.opis} (${ishod.davalac}). Poništeno je ${ishod.poen} POEN.`,
      link: "/vauceri",
    });
  } catch (e) {
    console.error("[vaucer] obaveštenje o uzimanju nije poslato", userId, e);
  }
  return ishod;
}

// ─── Davalac: provera koda i realizacija (nabavke čl. 30g) ───────────────────

/** Ugovor za proveru ovlašćenja: podnosilac i upis (sa korisnikom koji ga vodi). */
const UGOVOR_ZA_OVLASCENJE = {
  podnosilacId: true,
  upisId: true,
  upis: { select: { vlasnikUserId: true } },
} as const;

/**
 * Šta davalac vidi za uneti kod (nabavke čl. 30g st. 1, Politika 4.15): opis,
 * stanje, rok važenja i PSEUDONIM imaoca. 🔴 Ništa drugo o imaocu — ni id, ni
 * ime, ni mejl, ni evidencija identiteta. Kod tuđeg davaoca se ponaša kao nepoznat.
 */
export async function proveriKodZaDavaoca(korisnikId: string, kodUnos: string): Promise<{
  stanje: StanjeZaDavaoca;
  opis: string | null;
  vaziDo: string | null;
  pseudonim: string | null;
}> {
  const kod = normalizujKod(kodUnos);
  const v = kod
    ? await prisma.vaucer.findUnique({
        where: { kod },
        select: {
          status: true,
          imalac: { select: { pseudonim: true } },
          ugovor: { select: { ...UGOVOR_ZA_OVLASCENJE, opis: true, vaziDo: true } },
        },
      })
    : null;
  // Kod tuđeg davaoca — ili korisnika koji ne vodi upis niti je njegov aktivan
  // zaposleni — ponaša se kao nepoznat.
  if (!v || !(await ovlascenjeKorisnika(korisnikId, v.ugovor)))
    return { stanje: "NEPOZNAT", opis: null, vaziDo: null, pseudonim: null };
  return {
    stanje: stanjeZaDavaoca({ status: v.status, vaziDo: v.ugovor.vaziDo, sada: new Date() }),
    opis: v.ugovor.opis,
    vaziDo: v.ugovor.vaziDo?.toISOString() ?? null,
    pseudonim: v.imalac?.pseudonim ?? null,
  };
}

/**
 * Davalac — korisnik koji vodi upis (odnosno podnosilac ugovora) ili zaposleni koga je
 * odredio za taj upis — potvrđuje predaju dobra odnosno pružanje usluge (nabavke čl.
 * 30g st. 1). Ko je potvrdio, beleži se u `Vaucer.potvrdioId`.
 *
 * 🔴 Potvrdom je vaučer samo ISKORIŠĆEN — POEN se ne pomera, jer je poništen već
 * pri uzimanju (čl. 30f). Nema upisa u istoriju i nema provere stanja imaoca.
 */
export async function potvrdiRealizaciju(korisnikId: string, kodUnos: string) {
  const kod = normalizujKod(kodUnos);
  if (!kod) throw new VaucerGreska("Upiši kod vaučera.");
  const v = await prisma.vaucer.findUnique({
    where: { kod },
    select: {
      id: true, status: true, imalacId: true,
      ugovor: { select: { ...UGOVOR_ZA_OVLASCENJE, id: true, opis: true, naziv: true, vaziDo: true } },
    },
  });
  if (!v || !(await ovlascenjeKorisnika(korisnikId, v.ugovor)))
    throw new VaucerGreska("Nepoznat kod.", 404);
  const stanje = stanjeZaDavaoca({ status: v.status, vaziDo: v.ugovor.vaziDo, sada: new Date() });
  if (stanje !== "VAZI" || !v.imalacId) throw new VaucerGreska("Vaučer se ne može realizovati.", 409);
  // Niko ne potvrđuje sopstveni vaučer (zaposleni koji je i sam imalac).
  if (v.imalacId === korisnikId) throw new VaucerGreska("Sopstveni vaučer ne možeš potvrditi.", 403);
  const opis = v.ugovor.opis;

  // Ko je potvrdio — podnosilac ili zaposleni davaoca (za njegovu potvrdu odgovara davalac).
  const r = await prisma.vaucer.updateMany({
    where: { id: v.id, status: "DODELJEN" },
    data: { status: "ISKORISCEN", iskoriscenAt: new Date(), potvrdioId: korisnikId },
  });
  if (r.count !== 1) throw new VaucerGreska("Vaučer je već iskorišćen.", 409);

  try {
    await obavesti(v.imalacId, {
      tip: "vaucer",
      kljuc: "notifikacije.vaucer_iskoriscen",
      parametri: { opis, dana: 30 },
      naslov: "Vaučer je iskorišćen",
      tekst:
        `Davalac je potvrdio da je vaučer „${opis}" iskorišćen. ` +
        "Ako dobro nisi primio, odnosno usluga nije pružena, možeš da podneseš prigovor sa svog profila.",
      link: "/vauceri",
    });
  } catch (e) {
    console.error("[vaucer] obaveštenje o realizaciji nije poslato", v.imalacId, e);
  }
  return { opis };
}

/**
 * Iskorišćeni vaučeri ugovora jednog upisa, za stranicu pokrovitelja (nabavke čl.
 * 30g st. 1: iskorišćen vaučer se beleži kod davaoca uz pseudonim imaoca). Samo
 * korisniku koji vodi upis — zaposleni ugovore ne vidi. 🔴 Samo pseudonimi imaoca i
 * potvrdioca, nikad id ni ime.
 */
export async function iskorisceniVauceriUpisa(upisId: string) {
  const redovi = await prisma.vaucer.findMany({
    where: { status: "ISKORISCEN", ugovor: { upisId } },
    orderBy: { iskoriscenAt: "desc" },
    take: 500,
    select: {
      id: true,
      ugovorId: true,
      iskoriscenAt: true,
      ugovor: { select: { opis: true } },
      imalac: { select: { pseudonim: true } },
      potvrdio: { select: { pseudonim: true } },
    },
  });
  return redovi.map((r) => ({
    id: r.id,
    ugovorId: r.ugovorId,
    opis: r.ugovor.opis,
    iskoriscenAt: r.iskoriscenAt?.toISOString() ?? null,
    pseudonim: r.imalac?.pseudonim ?? null,
    potvrdio: r.potvrdio?.pseudonim ?? null,
  }));
}

// ─── Zaposleni davaoca (donacije čl. 13g st. 6, nabavke čl. 30g st. 1) ───────

/**
 * Da li korisnik sme da proveri i potvrdi vaučer ugovora: korisnik koji vodi upis
 * pokrovitelja (ili je ugovor podneo), odnosno AKTIVAN zaposleni određen za taj upis
 * (neopozvano ovlašćenje, verifikovan punoletan aktivan nalog u trenutku provere).
 * Niko drugi. Zaposleni se od seta 4.7.8 vezuju za upis (čl. 6a), ne za nalog.
 */
export async function ovlascenjeKorisnika(
  korisnikId: string,
  ugovor: { podnosilacId: string; upisId: string | null; upis?: { vlasnikUserId: string } | null },
): Promise<OvlascenjeZaVaucer> {
  const vodi = ugovor.upis?.vlasnikUserId ?? ugovor.podnosilacId;
  if (korisnikId === ugovor.podnosilacId || korisnikId === vodi)
    return ovlascenjeZaVaucer({ korisnikId, podnosilacId: korisnikId, aktivanZaposleni: false });
  if (!ugovor.upisId) return null;
  const z = await prisma.davalacZaposleni.findFirst({
    where: { upisId: ugovor.upisId, zaposleniUserId: korisnikId, opozvanAt: null, upis: { obrisanAt: null } },
    select: { zaposleni: { select: { id: true, maloletan: true, status: true, deaktiviranAt: true, verified: true } } },
  });
  const aktivanZaposleni = !!z && smeBitiZaposleni(z.zaposleni, vodi).ok;
  return ovlascenjeZaVaucer({ korisnikId, podnosilacId: vodi, aktivanZaposleni });
}

/** Upis koji vodi korisnik, živ (nije obrisan) — inače 403/409. */
async function upisKojiVodi(userId: string, upisId: string) {
  const u = upisId
    ? await prisma.upisPokrovitelja.findUnique({
        where: { id: upisId },
        select: { id: true, vlasnikUserId: true, obrisanAt: true, naziv: true },
      })
    : null;
  if (!u || u.vlasnikUserId !== userId) throw new VaucerGreska("Zaposlene određuje korisnik koji vodi upis pokrovitelja.", 403);
  if (u.obrisanAt) throw new VaucerGreska("Upis pokrovitelja je obrisan.", 409);
  return u;
}

/**
 * Korisnik koji vodi upis određuje korisnika (po pseudonimu) koji u ime pokrovitelja
 * potvrđuje vaučere. 🔴 Određuje SAMO korisnik koji vodi upis — zaposleni ne može
 * odrediti drugog zaposlenog. 🔴 Zaposleni mora biti verifikovan korisnik (donacije
 * čl. 13g st. 6).
 */
export async function odrediZaposlenog(davalacUserId: string, upisId: string, pseudonimUnos: string) {
  const pseudonim = typeof pseudonimUnos === "string" ? pseudonimUnos.trim() : "";
  if (!pseudonim) throw new VaucerGreska("Upiši pseudonim korisnika.");
  const upis = await upisKojiVodi(davalacUserId, upisId);

  const nalog = await prisma.user.findFirst({
    where: gdePseudonim(pseudonim),
    select: { id: true, pseudonim: true, maloletan: true, status: true, deaktiviranAt: true, verified: true },
  });
  if (!nalog) throw new VaucerGreska("Korisnik sa tim pseudonimom nije pronađen.", 404);
  const provera = smeBitiZaposleni(nalog, davalacUserId);
  if (!provera.ok) throw new VaucerGreska(provera.razlog);

  const postoji = await prisma.davalacZaposleni.findFirst({
    where: { upisId: upis.id, zaposleniUserId: nalog.id, opozvanAt: null },
    select: { id: true },
  });
  if (postoji) throw new VaucerGreska("Taj korisnik je već određen.", 409);

  let red: { id: string; dodatAt: Date };
  try {
    red = await prisma.davalacZaposleni.create({
      data: { upisId: upis.id, davalacUserId, zaposleniUserId: nalog.id },
      select: { id: true, dodatAt: true },
    });
  } catch {
    // Delimičan jedinstveni indeks (aktivan par po upisu) — istovremen dvostruki zahtev.
    throw new VaucerGreska("Taj korisnik je već određen.", 409);
  }

  try {
    await obavesti(nalog.id, {
      tip: "vaucer",
      kljuc: "notifikacije.vaucer_zaposleni_dodat",
      parametri: { davalac: upis.naziv },
      naslov: "Potvrđivanje vaučera",
      tekst:
        `Određen si da u ime pokrovitelja „${upis.naziv}" potvrđuješ vaučere. ` +
        "Kod proveravaš i potvrđuješ na stranici Pokroviteljstvo.",
      link: "/postani-pokrovitelj",
    });
  } catch (e) {
    console.error("[vaucer] obaveštenje zaposlenom nije poslato", nalog.id, e);
  }
  return { id: red.id, pseudonim: nalog.pseudonim, dodatAt: red.dodatAt.toISOString() };
}

/** Korisnik koji vodi upis opoziva ovlašćenje — u svakom trenutku, bez obrazloženja. */
export async function opozoviZaposlenog(davalacUserId: string, id: string) {
  const red = await prisma.davalacZaposleni.findFirst({
    where: { id, opozvanAt: null, OR: [{ upis: { vlasnikUserId: davalacUserId } }, { upisId: null, davalacUserId }] },
    select: { id: true, zaposleniUserId: true, upis: { select: { naziv: true } }, davalac: { select: { pseudonim: true } } },
  });
  if (!red) throw new VaucerGreska("Ovlašćenje nije pronađeno.", 404);
  await prisma.davalacZaposleni.update({
    where: { id: red.id },
    data: { opozvanAt: new Date(), opozvanRazlog: "DAVALAC" },
  });
  await obavestiOPrestanku(red.zaposleniUserId, red.upis?.naziv ?? red.davalac.pseudonim);
}

async function obavestiOPrestanku(zaposleniUserId: string, davalac: string) {
  try {
    await obavesti(zaposleniUserId, {
      tip: "vaucer",
      kljuc: "notifikacije.vaucer_zaposleni_opozvan",
      parametri: { davalac },
      naslov: "Potvrđivanje vaučera",
      tekst: `Prestalo je tvoje ovlašćenje da potvrđuješ vaučere u ime pokrovitelja „${davalac}".`,
      link: "/postani-pokrovitelj",
    });
  } catch (e) {
    console.error("[vaucer] obaveštenje o opozivu nije poslato", zaposleniUserId, e);
  }
}

/**
 * Spisak aktivnih zaposlenih upisa, uz broj vaučera koje je svaki potvrdio (za
 * ugovore tog upisa) — davalac odgovara za njihove potvrde. Samo korisniku koji vodi upis.
 */
export async function spisakZaposlenih(davalacUserId: string, upisId: string) {
  const upis = await upisKojiVodi(davalacUserId, upisId);
  const redovi = await prisma.davalacZaposleni.findMany({
    where: { upisId: upis.id, opozvanAt: null },
    orderBy: { dodatAt: "asc" },
    select: { id: true, dodatAt: true, zaposleniUserId: true, zaposleni: { select: { pseudonim: true } } },
  });
  const potvrde = redovi.length
    ? await prisma.vaucer.groupBy({
        by: ["potvrdioId"],
        where: {
          potvrdioId: { in: redovi.map((r) => r.zaposleniUserId) },
          ugovor: { upisId: upis.id },
        },
        _count: { _all: true },
      })
    : [];
  return redovi.map((r) => ({
    id: r.id,
    pseudonim: r.zaposleni.pseudonim,
    dodatAt: r.dodatAt.toISOString(),
    potvrdjeno: potvrde.find((p) => p.potvrdioId === r.zaposleniUserId)?._count._all ?? 0,
  }));
}

/**
 * Pokrovitelji za koje korisnik potvrđuje vaučere — samo naziv i logotip (javni
 * podaci upisa), ništa o ugovorima.
 */
export async function davaociZaposlenog(userId: string) {
  const redovi = await prisma.davalacZaposleni.findMany({
    where: { zaposleniUserId: userId, opozvanAt: null, upis: { obrisanAt: null } },
    orderBy: { dodatAt: "asc" },
    select: { upis: { select: { id: true, naziv: true, logoUrl: true } } },
  });
  return redovi.flatMap((r) => (r.upis ? [{ upisId: r.upis.id, naziv: r.upis.naziv, logoUrl: r.upis.logoUrl }] : []));
}

/**
 * Gašenje naloga bilo koje strane: sva aktivna ovlašćenja prestaju, druga strana
 * se obaveštava. Ne baca.
 */
export async function opozoviZaposlenePriGasenjuNaloga(userId: string) {
  try {
    const redovi = await prisma.davalacZaposleni.findMany({
      where: {
        opozvanAt: null,
        OR: [{ davalacUserId: userId }, { zaposleniUserId: userId }, { upis: { vlasnikUserId: userId } }],
      },
      select: { id: true, zaposleniUserId: true, upis: { select: { naziv: true } }, davalac: { select: { pseudonim: true } } },
    });
    if (redovi.length === 0) return;
    await prisma.davalacZaposleni.updateMany({
      where: { id: { in: redovi.map((r) => r.id) }, opozvanAt: null },
      data: { opozvanAt: new Date(), opozvanRazlog: "GASENJE_NALOGA" },
    });
    // Obaveštava se samo zaposleni čiji je davalac ugasio nalog; davaocu čiji je
    // zaposleni ugasio nalog spisak se sam ažurira.
    for (const r of redovi) {
      if (r.zaposleniUserId !== userId) await obavestiOPrestanku(r.zaposleniUserId, r.upis?.naziv ?? r.davalac.pseudonim);
    }
  } catch (e) {
    console.error("[vaucer] opoziv zaposlenih pri gašenju naloga nije uspeo", userId, e);
  }
}

// ─── Istek (nabavke čl. 30g st. 2) ───────────────────────────────────────────

/**
 * Istekli vaučeri prestaju (nabavke čl. 30g st. 2): poništenje izvršeno pri
 * uzimanju se NE ispravlja i ništa se ne otpisuje (donacije čl. 13j st. 4). Zove
 * se iz noćnog posla nabavki.
 */
export async function obradiVaucere(sada = new Date()): Promise<{ isteklo: number }> {
  const r = await prisma.vaucer.updateMany({
    where: { status: { in: ["SLOBODAN", "DODELJEN"] }, ugovor: { vaziDo: { lte: sada } } },
    data: { status: "ISTEKAO", istekaoAt: sada },
  });
  return { isteklo: r.count };
}

/**
 * Gašenje naloga: uzeti, a neiskorišćeni vaučeri se vraćaju u SLOBODAN, da bi
 * dobro, odnosno usluga ipak stigli do nekog člana. Poništenje izvršeno pri
 * uzimanju se ne ispravlja — zapis ugašenog naloga se ionako poništava (čl. 34).
 */
export async function oslobodiPriGasenjuNaloga(userId: string) {
  try {
    await prisma.vaucer.updateMany({
      where: { imalacId: userId, status: "DODELJEN" },
      data: {
        status: "SLOBODAN", imalacId: null, dodeljenAt: null, ponisteno: 0, ponistenjeTxId: null,
        izjavaNepovezanAt: null, pristanakPrikazAt: null, pristanakPrikazTekst: null,
      },
    });
  } catch (e) {
    console.error("[vaucer] oslobađanje pri gašenju naloga nije uspelo", userId, e);
  }
}

// ─── Raskid po neizvršenju (donacije čl. 13j — osmi osnov) ───────────────────

/**
 * Fondacija je po prigovoru imaoca (Uslovi čl. 37a, vrsta VAUCER) utvrdila da
 * davalac dobro nije predao, odnosno uslugu nije pružio, ni u roku od petnaest
 * dana od poziva — UGOVOR SE RASKIDA (čl. 13j st. 1).
 *
 * Jedna transakcija:
 *  1. ugovor → RASKINUT, a davalac (po MB, odnosno BPG) se upisuje na LISTU
 *     ZABRANE (`ZabranaDavaoca`, čl. 13j st. 2) — nov ugovor nije moguć dok ga
 *     Fondacija sa liste ne skine (`smeNoviUgovor`);
 *  2. svaki vaučer koji do raskida nije iskorišćen (`ulaziURaskid`) prestaje
 *     (NEIZVRSEN), uzet ili ne; imaocu uzetog poništenje izvršeno pri uzimanju
 *     ispravlja se sopstvenim tipom `ISPRAVKA_VAUCER` (nabavke čl. 30g st. 3,
 *     Pravilnik čl. 14a st. 5);
 *  3. podnosiocu se otpisuje `otpisPoVauceru × broj vaučera u raskidu` tipom
 *     `OTPIS_POKROVITELJ_DOBRA` — otpisani iznos obuhvata i uvećanje po
 *     koeficijentu. 🔴 Otpis SME u minus (osmi osnov, čl. 14 st. 3 t. 8) —
 *     kapirati na nulu bi bila greška (pravilo 4). Teret se ne prenosi.
 *
 * Podnosilac dobija SOPSTVENO obaveštenje (pravilo 3: minus se nikad ne pojavljuje
 * bez reči), a svaki imalac čije je poništenje ispravljeno — svoje.
 */
export async function raskiniUgovorDobra(
  ugovorId: string,
  vaucerPrigovoraId: string,
  adminId: string,
  obrazlozenje: string,
) {
  const razlog = typeof obrazlozenje === "string" ? obrazlozenje.trim() : "";
  if (razlog.length < 10) throw new VaucerGreska("Obrazloženje je obavezno — ide podnosiocu i u revizijski dnevnik.");

  const u = await prisma.ugovorDobra.findUnique({
    where: { id: ugovorId },
    select: {
      id: true, status: true, podnosilacId: true, opis: true, brojVaucera: true, poenEvidentirano: true,
      vrstaDavaoca: true, maticniBroj: true, bpg: true, naziv: true, upisId: true,
      podnosilac: { select: { wallet: { select: { id: true } } } },
      vauceri: { select: { id: true, status: true, imalacId: true, ponisteno: true } },
    },
  });
  if (!u) throw new VaucerGreska("Ugovor nije pronađen.", 404);
  if (u.status !== "POTPISAN") throw new VaucerGreska("Raskida se samo potpisan ugovor.", 409);

  // Raskid ide samo po prigovoru imaoca na vaučer OVOG ugovora, koji nije odbijen.
  const vp = u.vauceri.find((v) => v.id === vaucerPrigovoraId);
  if (!vp || !vp.imalacId) throw new VaucerGreska("Raskid se vrši po prigovoru imaoca vaučera ovog ugovora.", 409);
  const prigovor = await prisma.prigovorNaOdluku.findFirst({
    where: { tipOdluke: "VAUCER", predmetId: vp.id, userId: vp.imalacId, status: { not: "ODBIJENO" } },
    select: { id: true },
  });
  if (!prigovor) throw new VaucerGreska("Raskid se vrši samo po prigovoru imaoca vaučera.", 409);

  const podWalletId = u.podnosilac.wallet?.id;
  if (!podWalletId) throw new VaucerGreska("Podnosilac nema zapis u Protokolu.", 500);

  const uRaskidu = u.vauceri.filter((v) => ulaziURaskid(v, vp.id));
  const poVauceru = otpisPoVauceru(u.poenEvidentirano ?? 0, u.brojVaucera);
  const otpis = otpisPriRaskidu(u.poenEvidentirano ?? 0, u.brojVaucera, uRaskidu.length);
  const zaIspravku = uRaskidu.filter((v) => v.imalacId && v.ponisteno > 0);
  const imaoci = await prisma.wallet.findMany({
    where: { userId: { in: zaIspravku.map((v) => v.imalacId!) } },
    select: { id: true, userId: true },
  });
  const opis = u.opis;
  const sada = new Date();
  const ispravljeno: { userId: string; poen: number }[] = [];
  const kljuc = kljucDavaoca(u);

  await prisma.$transaction(async (tx) => {
    const r = await tx.ugovorDobra.updateMany({
      where: { id: u.id, status: "POTPISAN" },
      data: { status: "RASKINUT", raskinutoAt: sada, raskidObrazlozenje: razlog, raskinuoId: adminId, raskidOtpis: otpis },
    });
    if (r.count !== 1) throw new VaucerGreska("Ugovor je u međuvremenu promenio stanje.", 409);

    // Čl. 13j st. 2 — lista zabrane, do odluke Fondacije. Davalac koji je već na
    // listi ne dobija drugi aktivan red.
    // Lista zabrane se vezuje za upis (čl. 6a st. 6).
    const vecNaListi = await tx.zabranaDavaoca.findFirst({
      where: { skinutoAt: null, OR: [...(u.upisId ? [{ upisId: u.upisId }] : []), { ...kljuc }] },
      select: { id: true },
    });
    if (!vecNaListi)
      await tx.zabranaDavaoca.create({
        data: {
          upisId: u.upisId,
          vrstaDavaoca: u.vrstaDavaoca,
          maticniBroj: u.vrstaDavaoca === "FIRMA" ? u.maticniBroj : null,
          bpg: u.vrstaDavaoca === "GAZDINSTVO" ? u.bpg : null,
          naziv: u.naziv,
          ugovorId: u.id,
          razlog,
          upisaoId: adminId,
          upisanoAt: sada,
        },
      });

    for (const v of uRaskidu) {
      const rv = await tx.vaucer.updateMany({
        where: { id: v.id, status: v.status },
        data: { status: "NEIZVRSEN", neizvrsenAt: sada, otpisano: poVauceru },
      });
      if (rv.count !== 1) throw new VaucerGreska("Vaučer je u međuvremenu promenio stanje.", 409);
      const w = v.imalacId && v.ponisteno > 0 ? imaoci.find((x) => x.userId === v.imalacId) : null;
      if (w) {
        const id = await upisiPar(tx, {
          fromWalletId: PROTOKOL_WALLET_ID,
          toWalletId: w.id,
          iznos: v.ponisteno,
          type: TransactionType.ISPRAVKA_VAUCER,
          description: `Ispravka evidencije — vaučer „${opis}"`,
          opisKljuc: "transakcije.vaucer_ispravka",
          opisParametri: { opis },
        });
        await tx.vaucer.update({ where: { id: v.id }, data: { ispravkaTxId: id } });
        ispravljeno.push({ userId: v.imalacId!, poen: v.ponisteno });
      }
    }

    if (otpis > 0) {
      const id = await upisiPar(tx, {
        fromWalletId: podWalletId,
        toWalletId: PROTOKOL_WALLET_ID,
        iznos: otpis,
        type: TransactionType.OTPIS_POKROVITELJ_DOBRA,
        description: `Otpis po raskidu ugovora o pokroviteljstvu dobrima i uslugama — ${opis}`,
        opisKljuc: "transakcije.pokroviteljstvo_dobra_otpis",
        opisParametri: { opis },
      });
      await tx.ugovorDobra.update({ where: { id: u.id }, data: { raskidOtpisTxId: id } });
      await tx.vaucer.updateMany({ where: { id: { in: uRaskidu.map((v) => v.id) } }, data: { otpisTxId: id } });
    }
  });

  const stanje = await prisma.wallet.findUnique({ where: { id: podWalletId }, select: { balance: true } });
  try {
    const uMinusu = (stanje?.balance ?? 0) < 0;
    await obavesti(u.podnosilacId, {
      tip: "pokroviteljstvo_dobra",
      kljuc: uMinusu ? "notifikacije.pokroviteljstvo_dobra_raskid_zabrana_minus" : "notifikacije.pokroviteljstvo_dobra_raskid_zabrana",
      parametri: { opis, poen: otpis, broj: uRaskidu.length, stanje: stanje?.balance ?? 0, obrazlozenje: razlog },
      naslov: uMinusu ? "Ugovor o vaučerima je raskinut: zapis je u minusu" : "Ugovor o vaučerima je raskinut",
      tekst:
        `Fondacija je po prigovoru utvrdila da obaveza iz ugovora „${opis}" nije izvršena i ugovor je raskinut. ` +
        `Vaučeri koji nisu iskorišćeni (${uRaskidu.length}) su prestali i otpisano je ${otpis} POEN.` +
        (uMinusu ? ` Tvoj zapis je sada ${stanje?.balance ?? 0} POEN; POEN koji pristigne prvo popunjava minus.` : "") +
        ` Davalac je upisan na listu zabrane i ne može zaključiti nov ugovor o pokroviteljstvu dobrima i uslugama dok ga Fondacija sa liste ne skine. Obrazloženje: ${razlog}`,
      link: "/vauceri/davalac",
    });
  } catch (e) {
    console.error("[vaucer] obaveštenje o raskidu nije poslato", u.podnosilacId, e);
  }
  for (const i of ispravljeno) {
    try {
      await obavesti(i.userId, {
        tip: "vaucer",
        kljuc: "notifikacije.vaucer_raskid_ispravka",
        parametri: { opis, poen: i.poen },
        naslov: "Vaučer je prestao, poništenje je ispravljeno",
        tekst: `Ugovor za vaučer „${opis}" je raskinut jer davalac nije izvršio obavezu. Vaučer je prestao, a u tvoj zapis je vraćeno ${i.poen} POEN.`,
        link: "/vauceri",
      });
    } catch (e) {
      console.error("[vaucer] obaveštenje imaocu nije poslato", i.userId, e);
    }
  }

  await logAdminAkcija(adminId, "UGOVOR_DOBRA_RASKID", u.id,
    `vaučera u raskidu ${uRaskidu.length}, otpis ${otpis} POEN, ispravki ${ispravljeno.length}; prigovor ${prigovor.id}; lista zabrane; razlog: ${razlog}`);
  return { otpis, uRaskidu: uRaskidu.length, ispravki: ispravljeno.length };
}

// ─── Lista zabrane (donacije čl. 13j st. 2) ──────────────────────────────────

/** Lista zabrane za administratorski tim — aktivni redovi i istorija skidanja. */
export async function listaZabrana() {
  const redovi = await prisma.zabranaDavaoca.findMany({
    orderBy: [{ skinutoAt: { sort: "asc", nulls: "first" } }, { upisanoAt: "desc" }],
    take: 200,
  });
  return redovi.map((z) => ({
    id: z.id,
    vrstaDavaoca: z.vrstaDavaoca,
    maticniBroj: z.maticniBroj,
    bpg: z.bpg,
    naziv: z.naziv,
    razlog: z.razlog,
    upisanoAt: z.upisanoAt.toISOString(),
    skinutoAt: z.skinutoAt?.toISOString() ?? null,
    skidanjeRazlog: z.skidanjeRazlog,
  }));
}

/**
 * Fondacija skida davaoca sa liste zabrane (čl. 13j st. 2), uz obrazloženje.
 * Red ostaje kao istorija; posle toga davalac ponovo sme da podnese prijavu.
 */
export async function skiniZabranu(id: string, adminId: string, obrazlozenje: string) {
  const razlog = typeof obrazlozenje === "string" ? obrazlozenje.trim() : "";
  if (razlog.length < 5) throw new VaucerGreska("Obrazloženje je obavezno.");
  const r = await prisma.zabranaDavaoca.updateMany({
    where: { id, skinutoAt: null },
    data: { skinutoAt: new Date(), skinuoId: adminId, skidanjeRazlog: razlog },
  });
  if (r.count === 0) throw new VaucerGreska("Zabrana nije pronađena ili je već skinuta.", 404);
  await logAdminAkcija(adminId, "ZABRANA_DAVAOCA_SKINUTA", id, razlog);
}

/**
 * Odluka Fondacije da davalac sme da zaključi naredni ugovor iako nije iskorišćena
 * polovina vaučera prethodnog (čl. 13f st. 4, set 4.8.4; N2-M6). Samo superadmin
 * (ruta), obrazloženje obavezno. Odnosi se na poslednji potpisan ugovor.
 */
export async function dozvoliNaredniUgovor(ugovorId: string, adminId: string, obrazlozenje: string) {
  const razlog = typeof obrazlozenje === "string" ? obrazlozenje.trim() : "";
  if (razlog.length < 5) throw new VaucerGreska("Obrazloženje je obavezno.");
  const r = await prisma.ugovorDobra.updateMany({
    where: { id: ugovorId, potpisanoAt: { not: null }, naredniDozvoljenAt: null },
    data: { naredniDozvoljenAt: new Date(), naredniDozvolioId: adminId, naredniDozvolaRazlog: razlog },
  });
  if (r.count === 0) throw new VaucerGreska("Ugovor nije potpisan ili je naredni ugovor već dozvoljen.", 404);
  await logAdminAkcija(adminId, "UGOVOR_DOBRA_NAREDNI_DOZVOLJEN", ugovorId, razlog);
}

/** Odgovor rute na izuzetak iz ovog modula — poruka i status iz `VaucerGreska`. */
export async function odgovorNaGresku(e: unknown) {
  const { greska } = await import("@/lib/greska-api");
  if (e instanceof VaucerGreska) return greska(e.message, e.status);
  console.error("[pokroviteljstvo-dobra]", e);
  return greska(e instanceof Error ? e.message : "Greška.", 500);
}

// ─── Rang-lista pokrovitelja, deo „Dobra i usluge" (donacije čl. 13 st. 1) ───

/**
 * Javna rang-lista pokroviteljstva dobrima i uslugama: zbir vrednosti svih
 * potpisanih ugovora (potpisanih, pa i kasnije raskinutih) po davaocu. 🔴 Bira se
 * samo ono što pravilo `rangListaDobara` treba — nikad `poenEvidentirano`,
 * koeficijent, podnosilac ni kontakt — a izlaz nosi samo naziv i iznos u dinarima.
 */
export async function javnaRangListaDobara() {
  const ugovori = await prisma.ugovorDobra.findMany({
    where: { potpisanoAt: { not: null }, status: { in: ["POTPISAN", "RASKINUT"] } },
    select: {
      vrstaDavaoca: true, maticniBroj: true, bpg: true, naziv: true, logoUrl: true, vrednostRsd: true, potpisanoAt: true,
      upis: { select: { naziv: true, logoUrl: true, uklonjenSaRangListeAt: true } },
    },
  });
  // Naziv i logotip iz upisa (čl. 13 st. 4); obrisan upis ostaje na rang-listi,
  // uklanja se samo na zahtev korisnika koji ga je vodio (čl. 6a st. 6).
  return rangListaDobara(
    ugovori
      .filter((u) => naRangListi(u.upis))
      .map((u) => ({
        vrstaDavaoca: u.vrstaDavaoca,
        maticniBroj: u.maticniBroj,
        bpg: u.bpg,
        naziv: u.upis?.naziv ?? u.naziv,
        logoUrl: u.upis ? u.upis.logoUrl : u.logoUrl,
        vrednostRsd: Number(u.vrednostRsd),
        potpisanoAt: u.potpisanoAt,
      })),
  );
}
