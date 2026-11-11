/**
 * Kolektivna nabavka — servisne funkcije (Prisma).
 *
 * Čista pravila žive u `src/lib/nabavka-pravila.ts` i odavde se re-eksportuju, pa
 * server ima jedan ulaz. Osnov: Pravilnik o projektima i kolektivnim nabavkama
 * (set 4.4.1); Pravilnik o KOLO sistemu čl. 18 i 47.
 */
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import type { NabavkaPrijavaStatus, Prisma } from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";
import { ROK_NABAVKA_DANA } from "@/lib/prigovor-pravila";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";
import {
  dohvatiSaldoFondacije,
  dohvatiTrosakPrethodnogMeseca,
} from "@/lib/protokol/fondacija";
import {
  MESECI_REZERVE,
  raspolozivoZaProjekte,
  ROK_PRIJAVE_DANA,
  ROK_POTVRDE_DANA,
  PERIOD_PREUZIMANJA_DANA,
  NAJMANJE_PONUDA,
  normalizujNaziv,
  ociscenNaziv,
  validanNaziv,
  izracunajKalkulaciju,
  validniParametri,
  brojDelova,
  type ParametriOdluke,
  poredjajRed,
  rokPrijave,
  rokPotvrde,
  krajPeriodaPreuzimanja,
  danJeUPeriodu,
  pocetakObracunskogDana,
  krajDana,
  smeUcestvovati,
  utvrdiIzbor,
  predlogIstice,
  DOPUNSKI_ROK_DANA,
  krajDopunskogRoka,
  dopunskiRokTraje,
  nabavljenihDelova,
  slobodnihDodatnihDelova,
  smeTrazitiDodatniDeo,
  krugDodele,
} from "@/lib/nabavka-pravila";
import { ograniceno } from "./ogranicenje-primljenog";
import { raspolozivo } from "./nadoknada";
import { proveriZbir, snimiZbir } from "./zbir-zapisa";

export * from "@/lib/nabavka-pravila";

const PROTOKOL_WALLET_ID = "banka-singleton";

export class NabavkaGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

// ─── Rečnik naziva i registar predloga (čl. 9 i 10) ───────────────────────────

/**
 * Razrešava naziv u zapis rečnika; stvara nov kad ga nema (čl. 9 st. 2).
 *
 * Jedinstvenost drži baza nad `nazivLower`, pa trka dva korisnika koji istovremeno
 * unose isti nov naziv ne pravi dva zapisa — drugi upit padne na `@unique` i
 * pročita postojeći.
 */
export async function razresiNaziv(naziv: string, kreiraoId?: string) {
  if (!validanNaziv(naziv)) {
    throw new NabavkaGreska("Naziv dobra nije ispravan — od 2 do 40 znakova, bez posebnih simbola.");
  }
  const prikaz = ociscenNaziv(naziv);
  const kljuc = normalizujNaziv(naziv);

  const postojeci = await prisma.nazivDobra.findUnique({ where: { nazivLower: kljuc } });
  if (postojeci) return postojeci;

  try {
    return await prisma.nazivDobra.create({
      data: { naziv: prikaz, nazivLower: kljuc, kreiraoId: kreiraoId ?? null },
    });
  } catch {
    const ponovo = await prisma.nazivDobra.findUnique({ where: { nazivLower: kljuc } });
    if (ponovo) return ponovo;
    throw new NabavkaGreska("Naziv nije mogao da se upiše.", 500);
  }
}

/** Pretraga rečnika za polje pri unosu predloga. */
export async function pretraziNazive(upit: string, limit = 12) {
  const q = normalizujNaziv(upit);
  if (q.length < 2) return [];
  return prisma.nazivDobra.findMany({
    where: { nazivLower: { contains: q } },
    select: { id: true, naziv: true },
    orderBy: { naziv: "asc" },
    take: limit,
  });
}

/**
 * Upisuje ili menja predlog korisnika (čl. 9 st. 3 — jedan aktivan po članu).
 * Nov predlog ZAMENJUJE raniji; jednokratnost drži `userId @unique`, ne kod.
 */
export async function upisiPredlog(userId: string, naziv: string) {
  const korisnik = await prisma.user.findUnique({
    where: { id: userId },
    select: { maloletan: true, deaktiviranAt: true, status: true, verified: true, indeksStvarnosti: true },
  });
  if (!korisnik) throw new NabavkaGreska("Korisnik nije pronađen.", 404);
  if (!smeUcestvovati(korisnik)) {
    throw new NabavkaGreska("Predlog za nabavku podnose punoletni korisnici sa aktivnim nalogom i potvrđenom stvarnošću (čl. 4).", 403);
  }

  const zapis = await razresiNaziv(naziv, userId);
  await prisma.predlogNabavke.upsert({
    where: { userId },
    create: { userId, nazivId: zapis.id },
    update: { nazivId: zapis.id, createdAt: new Date() },
  });
  return zapis;
}

export async function ukloniPredlog(userId: string) {
  await prisma.predlogNabavke.deleteMany({ where: { userId } });
}

export async function mojPredlog(userId: string) {
  return prisma.predlogNabavke.findUnique({
    where: { userId },
    select: { nazivId: true, createdAt: true, naziv: { select: { naziv: true } } },
  });
}

export interface RedPredloga {
  nazivId: string;
  naziv: string;
  brojKorisnika: number;
  unetAt: Date;
}

/**
 * Registar predloga (čl. 10).
 *
 * 🔴 Jedino merilo je BROJ RAZLIČITIH KORISNIKA, ne broj POEN-a predlagača —
 * inače bi jedan član sa velikim zapisom određivao šta ceo sistem kupuje. Isti
 * presedan kao brojanje različitih prijavilaca kod prijave poruke.
 *
 * Prikazuje se zbirno, bez pseudonima: registar služi odlučivanju o tome ŠTA se
 * nabavlja, a ne uvidu u to ko šta traži.
 */
export async function registarPredloga(): Promise<RedPredloga[]> {
  const grupe = await prisma.predlogNabavke.groupBy({
    by: ["nazivId"],
    _count: { userId: true },
  });
  if (grupe.length === 0) return [];

  const nazivi = await prisma.nazivDobra.findMany({
    where: { id: { in: grupe.map((g) => g.nazivId) } },
    select: { id: true, naziv: true, createdAt: true },
  });
  const poId = new Map(nazivi.map((n) => [n.id, n]));

  return grupe
    .map((g) => {
      const n = poId.get(g.nazivId);
      return {
        nazivId: g.nazivId,
        naziv: n?.naziv ?? "—",
        brojKorisnika: g._count.userId,
        unetAt: n?.createdAt ?? new Date(0),
      };
    })
    .sort((a, b) => {
      if (b.brojKorisnika !== a.brojKorisnika) return b.brojKorisnika - a.brojKorisnika;
      return a.unetAt.getTime() - b.unetAt.getTime();
    });
}

/**
 * Briše predloge izabranog naziva po sprovedenoj nabavci (čl. 10 st. 3).
 *
 * 🔴 Bez ovoga ista reč pobeđuje zauvek: ako tri stotine ljudi napiše „gorivo" i
 * taj upis ostane, gorivo dobija svako sledeće glasanje i registar prestaje da meri
 * išta. Ko i dalje hoće gorivo, upiše ga ponovo — i to je svež signal.
 */
export async function brisiPredlogeNaziva(nazivId: string): Promise<number> {
  const r = await prisma.predlogNabavke.deleteMany({ where: { nazivId } });
  return r.count;
}

/** Čl. 10 st. 3 — predlozi stariji od dvanaest meseci (čisti ih cron). */
export async function brisiIstekle(sada = new Date()): Promise<number> {
  const granica = new Date(sada);
  granica.setMonth(granica.getMonth() - 12);
  const r = await prisma.predlogNabavke.deleteMany({ where: { createdAt: { lt: granica } } });
  return r.count;
}

// ─── Sredstva (čl. 5) ─────────────────────────────────────────────────────────

export interface SredstvaZaProjekte {
  saldoRSD: number;
  trosakPrethodnogMesecaRSD: number;
  rezervaRSD: number;
  raspolozivoRSD: number;
}

/**
 * Sredstva raspoloživa za projekte (čl. 5). Zaštitni veto je uklonjen (odluka
 * vlasnika 25.10.2026): kočnica je samo operativna rezerva, koja se meri svakog meseca.
 *
 * Saldo dolazi iz `fondacija.ts` i već je umanjen za projektni odliv; rezerva se
 * računa isključivo iz OPERATIVNIH troškova — vidi komentar uz `ProjekatTrosak`.
 */
export async function sredstvaZaProjekte(): Promise<SredstvaZaProjekte> {
  const [saldo, trosak] = await Promise.all([
    dohvatiSaldoFondacije(),
    dohvatiTrosakPrethodnogMeseca(),
  ]);
  return {
    saldoRSD: saldo.saldo,
    trosakPrethodnogMesecaRSD: trosak,
    rezervaRSD: trosak * MESECI_REZERVE,
    raspolozivoRSD: raspolozivoZaProjekte(saldo.saldo, trosak),
  };
}

// ─── Priprema nabavke (čl. 12, 14, 18) ────────────────────────────────────────

/**
 * Otvara nabavku po izabranom nazivu. Status NACRT — ništa nije objavljeno i
 * nijedan dinar nije obećan dok se ne prikupe ponude i ne objavi kalkulacija.
 */
export async function pripremiNabavku(nazivId: string, glasanjePredlogId?: string) {
  const naziv = await prisma.nazivDobra.findUnique({ where: { id: nazivId }, select: { id: true } });
  if (!naziv) throw new NabavkaGreska("Naziv dobra nije pronađen.", 404);

  const uToku = await prisma.nabavka.findFirst({
    where: { status: { in: ["NACRT", "OBJAVLJENA", "RED_UTVRDJEN", "PLACENA"] } },
    select: { id: true },
  });
  if (uToku) throw new NabavkaGreska("Već postoji nabavka u toku. Prvo je zatvorite.", 409);

  return prisma.nabavka.create({ data: { nazivId, glasanjePredlogId: glasanjePredlogId ?? null } });
}

/**
 * Čl. 13 — odluka utvrđuje ukupnu količinu, veličinu dela i broj POEN-a po delu.
 *
 * 🔴 Mora se izvršiti PRE prve ponude. To nije formalnost nego jedina brana koja
 * tvrdnju iz čl. 17 čini proverljivom: broj POEN-a ne može biti izveden iz cene
 * koja u tom trenutku još ne postoji. Zato `dodajPonudu` odbija ponudu dok
 * parametri nisu utvrđeni, a ovde se odbija izmena kad ponude već postoje.
 */
export async function utvrdiParametre(
  nabavkaId: string,
  ulaz: ParametriOdluke & { poenObrazlozenje: string }
) {
  const n = await prisma.nabavka.findUnique({
    where: { id: nabavkaId },
    select: { status: true, _count: { select: { ponude: true } } },
  });
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (n.status !== "NACRT") throw new NabavkaGreska("Parametri se utvrđuju pre objave kalkulacije.");
  if (n._count.ponude > 0) {
    throw new NabavkaGreska("Parametri se utvrđuju pre prikupljanja ponuda (čl. 13 st. 4).", 409);
  }
  if (!validniParametri(ulaz)) {
    throw new NabavkaGreska(
      "Količina, veličina dela i broj POEN-a po delu moraju biti celi brojevi veći od nule, a količina deljiva veličinom dela bez ostatka (čl. 13 st. 3).",
    );
  }
  if (!ulaz.poenObrazlozenje.trim()) {
    throw new NabavkaGreska("Obrazloženje parametara je obavezno (čl. 13 st. 4).");
  }

  return prisma.nabavka.update({
    where: { id: nabavkaId },
    data: {
      brojJedinica: ulaz.kolicina,
      velicinaDela: ulaz.velicinaDela,
      brojDelova: brojDelova(ulaz.kolicina, ulaz.velicinaDela),
      poenPoDelu: ulaz.poenPoDelu,
      poenObrazlozenje: ulaz.poenObrazlozenje.trim(),
    },
  });
}

export async function dodajPonudu(nabavkaId: string, ponudjac: string, cenaPoJedinici: number, napomena?: string) {
  const n = await prisma.nabavka.findUnique({
    where: { id: nabavkaId },
    select: { status: true, poenPoDelu: true },
  });
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (n.status !== "NACRT") throw new NabavkaGreska("Ponude se dodaju samo dok kalkulacija nije objavljena.");
  if (n.poenPoDelu === null) {
    throw new NabavkaGreska("Prvo se utvrđuju parametri nabavke, pa se prikupljaju ponude (čl. 13 st. 4).", 409);
  }
  if (!ponudjac.trim()) throw new NabavkaGreska("Naziv ponuđača je obavezan.");
  if (!(cenaPoJedinici > 0)) throw new NabavkaGreska("Cena po jedinici mora biti veća od nule.");

  return prisma.nabavkaPonuda.create({
    data: { nabavkaId, ponudjac: ponudjac.trim(), cenaPoJedinici, napomena: napomena?.trim() || null },
  });
}

export async function obrisiPonudu(ponudaId: string) {
  const p = await prisma.nabavkaPonuda.findUnique({
    where: { id: ponudaId },
    select: { nabavka: { select: { status: true } } },
  });
  if (!p) throw new NabavkaGreska("Ponuda nije pronađena.", 404);
  if (p.nabavka.status !== "NACRT") throw new NabavkaGreska("Ponude se menjaju samo dok kalkulacija nije objavljena.");
  await prisma.nabavkaPonuda.delete({ where: { id: ponudaId } });
}

export interface ObjavaUlaz {
  ponudaId: string;
  jedinicaMere: string;
  mestoPreuzimanja: string;
  preuzimanjeOd: Date;
}

/**
 * Objavljuje kalkulaciju i otvara prijave (čl. 18).
 *
 * 🔴 Svi brojevi se SNIMAJU na zapis. Po čl. 18 st. 3 kalkulacija se posle objave
 * ne menja; bez snimka bi se prikazani iznosi menjali sa saldom Fondacije i sa
 * tržišnom cenom, pa bi čovek koji se prijavio video druge brojeve nego onaj koji
 * je odlučivao.
 */
export async function objaviNabavku(nabavkaId: string, ulaz: ObjavaUlaz) {
  const n = await prisma.nabavka.findUnique({
    where: { id: nabavkaId },
    include: { ponude: true },
  });
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (n.status !== "NACRT") throw new NabavkaGreska("Nabavka je već objavljena.");

  if (n.ponude.length < NAJMANJE_PONUDA) {
    throw new NabavkaGreska(`Potrebno je najmanje ${NAJMANJE_PONUDA} ponude pre objave (čl. 14).`);
  }
  const izabrana = n.ponude.find((p) => p.id === ulaz.ponudaId);
  if (!izabrana) throw new NabavkaGreska("Izabrana ponuda ne pripada ovoj nabavci.");

  // Čl. 14 st. 1 — bira se NAJPOVOLJNIJA. Ako izabrana nije najjeftinija, izbor je
  // ili greška ili odluka koju akt ne dopušta; u oba slučaja bolje da padne ovde.
  const najjeftinija = n.ponude.reduce((a, b) => (Number(a.cenaPoJedinici) <= Number(b.cenaPoJedinici) ? a : b));
  if (izabrana.id !== najjeftinija.id) {
    throw new NabavkaGreska("Bira se najpovoljnija ponuda (čl. 14 st. 1).");
  }

  const sredstva = await sredstvaZaProjekte();
  if (n.brojJedinica === null || n.velicinaDela === null || n.poenPoDelu === null) {
    throw new NabavkaGreska("Parametri nabavke nisu utvrđeni (čl. 13).", 409);
  }

  const kalk = izracunajKalkulaciju({
    saldoRSD: sredstva.saldoRSD,
    trosakPrethodnogMesecaRSD: sredstva.trosakPrethodnogMesecaRSD,
    nabavnaCena: Number(izabrana.cenaPoJedinici),
    parametri: {
      kolicina: n.brojJedinica,
      velicinaDela: n.velicinaDela,
      poenPoDelu: n.poenPoDelu,
    },
  });
  if (!kalk) {
    // Čl. 16 st. 2 — prekoračenje granice nije greška u unosu nego ishod tendera.
    throw new NabavkaGreska(
      "Nabavka se ne sprovodi: ili nema sredstava iznad rezerve, ili ukupan dinarski trošak prelazi gornju granicu iz čl. 7. Sredstva ostaju za narednu nabavku, a nova odluka može utvrditi manju količinu."
    );
  }

  const sada = new Date();
  // Prvi dan preuzimanja počinje ponoću po srpskom vremenu (obračunski dan), ne po satu servera.
  const preuzimanjeOd = pocetakObracunskogDana(new Date(ulaz.preuzimanjeOd));

  await prisma.$transaction(async (tx) => {
    await tx.nabavkaPonuda.updateMany({ where: { nabavkaId }, data: { izabrana: false } });
    await tx.nabavkaPonuda.update({ where: { id: izabrana.id }, data: { izabrana: true } });
    await tx.nabavka.update({
      where: { id: nabavkaId },
      data: {
        status: "OBJAVLJENA",
        dobavljac: izabrana.ponudjac,
        nabavnaCena: izabrana.cenaPoJedinici,
        jedinicaMere: ulaz.jedinicaMere.trim(),
        saldoSnimak: sredstva.saldoRSD,
        rezervaSnimak: kalk.rezervaRSD,
        iznosNabavke: kalk.gornjaGranicaRSD,
        mestoPreuzimanja: ulaz.mestoPreuzimanja.trim(),
        preuzimanjeOd,
        preuzimanjeDo: krajPeriodaPreuzimanja(preuzimanjeOd),
        prijaveDo: rokPrijave(sada),
        objavljenoAt: sada,
      },
    });
  });

  return kalk;
}

// ─── Prijava (čl. 19) ─────────────────────────────────────────────────────────

export async function prijaviSe(userId: string, nabavkaId: string) {
  const [korisnik, n] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { maloletan: true, deaktiviranAt: true, status: true, verified: true, indeksStvarnosti: true },
    }),
    prisma.nabavka.findUnique({ where: { id: nabavkaId }, select: { status: true, prijaveDo: true } }),
  ]);
  if (!korisnik) throw new NabavkaGreska("Korisnik nije pronađen.", 404);
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (!smeUcestvovati(korisnik)) {
    throw new NabavkaGreska("U nabavci učestvuju punoletni korisnici sa aktivnim nalogom i potvrđenom stvarnošću (čl. 4).", 403);
  }
  // Čl. 19 st. 2 — prijava ne zavisi od broja POEN-a u zapisu; broj POEN-a
  // određuje samo mesto u redu (čl. 20), a dovoljnost se proverava pri potvrdi (čl. 21).
  if (n.status !== "OBJAVLJENA") throw new NabavkaGreska("Prijave nisu otvorene.");
  if (n.prijaveDo && n.prijaveDo.getTime() <= Date.now()) throw new NabavkaGreska("Rok za prijavu je istekao.");

  try {
    return await prisma.nabavkaPrijava.create({ data: { nabavkaId, userId } });
  } catch {
    throw new NabavkaGreska("Već ste prijavljeni na ovu nabavku.", 409);
  }
}

/** Odustanak — pre poziva i posle njega (čl. 22 st. 1). */
export async function odustani(userId: string, nabavkaId: string) {
  const p = await prisma.nabavkaPrijava.findUnique({
    where: { nabavkaId_userId: { nabavkaId, userId } },
    select: { id: true, status: true, rezervisano: true },
  });
  if (!p) throw new NabavkaGreska("Niste prijavljeni na ovu nabavku.", 404);
  if (p.status === "PREUZEO") throw new NabavkaGreska("Deo je već preuzet.");
  if (["ODUSTAO", "ISTEKAO", "NIJE_PREUZEO"].includes(p.status)) return;

  await prisma.nabavkaPrijava.update({
    where: { id: p.id },
    data: { status: "ODUSTAO", rezervisano: 0, kod: null, danPreuzimanja: null },
  });
  await pozoviSledeceg(nabavkaId);
}

// ─── Red i pozivi (čl. 20, 21, 22) ────────────────────────────────────────────

/**
 * Zatvara prijave, snima red i šalje prve pozive (čl. 20).
 *
 * 🔴 Broj POEN-a se SNIMA. Rolanje poziva traje danima, a ljudi u međuvremenu troše
 * POEN — pri živom rangiranju red bi se premeštao pod nogama onima koji čekaju
 * poziv, i niko ne bi mogao da proveri ishod.
 */
export async function zatvoriPrijaveIUtvrdiRed(nabavkaId: string) {
  const n = await prisma.nabavka.findUnique({
    where: { id: nabavkaId },
    select: { status: true, brojDelova: true },
  });
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (n.status !== "OBJAVLJENA") throw new NabavkaGreska("Red se utvrđuje po zatvaranju prijava.");

  const prijave = await prisma.nabavkaPrijava.findMany({
    where: { nabavkaId, status: "PRIJAVLJEN" },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      user: { select: { createdAt: true, wallet: { select: { balance: true } } } },
    },
  });

  // Čl. 19 st. 2 i čl. 20 — u red ulazi svaka prijava, bez najmanjeg broja POEN-a.
  // Zapis u minusu ulazi sa nulom; dovoljnost se proverava tek pri potvrdi (čl. 21).
  const red = poredjajRed(
    prijave
      .map((p) => ({
        id: p.id,
        userId: p.userId,
        poen: Math.max(0, p.user.wallet?.balance ?? 0),
        prijavljenoAt: p.createdAt,
        nalogOd: p.user.createdAt,
      }))
  );

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < red.length; i++) {
      await tx.nabavkaPrijava.update({
        where: { id: red[i].id },
        data: { poenSnimak: red[i].poen, mesto: i + 1 },
      });
    }
    await tx.nabavka.update({
      where: { id: nabavkaId },
      data: { status: "RED_UTVRDJEN", redUtvrdjenAt: new Date() },
    });
  });

  await pozoviSledeceg(nabavkaId);
  return red.length;
}

/**
 * Popunjava mesta pozivima, prema redu, do broja delova (čl. 21 st. 1).
 *
 * Isti poziv rešava i prvo popunjavanje i svako kasnije oslobađanje mesta — jedno
 * pravilo, tri povoda (odustanak, istek roka, nepreuzimanje). Posebna lista čekanja
 * se ne vodi: red iz čl. 20 se prosto nastavlja preko broja delova.
 */
export async function pozoviSledeceg(nabavkaId: string): Promise<number> {
  const n = await prisma.nabavka.findUnique({
    where: { id: nabavkaId },
    select: {
      status: true,
      brojDelova: true,
      poenPoDelu: true,
      preuzimanjeDo: true,
      naziv: { select: { naziv: true } },
    },
  });
  if (!n || !n.brojDelova) return 0;
  if (n.status !== "RED_UTVRDJEN" && n.status !== "PLACENA") return 0;
  // Kad period preuzimanja istekne, lanac poziva se zaustavlja (čl. 22 st. 2).
  if (n.preuzimanjeDo && n.preuzimanjeDo.getTime() <= Date.now()) return 0;

  const zauzeto = await prisma.nabavkaPrijava.count({
    where: { nabavkaId, status: { in: ["POZVAN", "POTVRDIO", "PREUZEO"] } },
  });
  const slobodno = n.brojDelova - zauzeto;
  if (slobodno <= 0) return 0;

  const sledeci = await prisma.nabavkaPrijava.findMany({
    where: { nabavkaId, status: "PRIJAVLJEN", mesto: { not: null } },
    orderBy: { mesto: "asc" },
    take: slobodno,
    select: { id: true, userId: true, mesto: true },
  });

  const sada = new Date();
  for (const p of sledeci) {
    await prisma.nabavkaPrijava.update({
      where: { id: p.id },
      data: { status: "POZVAN", pozvanAt: sada },
    });
    // Obaveštenje ne sme da obori poziv — kanal može da padne, red ne.
    try {
      await obavesti(p.userId, {
        tip: "NABAVKA",
        kljuc: "nabavka_poziv",
        parametri: { dobro: n.naziv.naziv, poen: n.poenPoDelu ?? 0, mesto: p.mesto ?? 0 },
        naslov: "Ušao si u nabavku",
        tekst: `Nabavka „${n.naziv.naziv}" — za tvoj deo se pri preuzimanju poništava ${n.poenPoDelu ?? 0} POENA. Potvrdi izborom dana preuzimanja u roku od ${ROK_POTVRDE_DANA} dana.`,
        link: `/nabavke/${nabavkaId}`,
      });
    } catch (e) {
      console.error("[nabavka] obaveštenje o pozivu nije poslato", p.userId, e);
    }
  }
  return sledeci.length;
}

function generisiKod(): string {
  const n = Math.floor(Math.random() * 100_000_000);
  const s = n.toString().padStart(8, "0");
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

/**
 * Potvrda učešća upisom dana preuzimanja (čl. 21 st. 2).
 *
 * 🔴 Tek tada se POEN REZERVIŠE. Prijava je jeftina i nezavezujuća; obaveza nastaje
 * kad čovek kaže kog dana dolazi. Ko u tom trenutku nema dovoljno POEN-a ne može da
 * potvrdi (st. 2) — inače bi rezervacija pukla i mesto ostalo prazno bez ijednog traga.
 */
export async function potvrdiUcesce(userId: string, nabavkaId: string, dan: Date) {
  const [p, n] = await Promise.all([
    prisma.nabavkaPrijava.findUnique({
      where: { nabavkaId_userId: { nabavkaId, userId } },
      select: { id: true, status: true, pozvanAt: true },
    }),
    prisma.nabavka.findUnique({
      where: { id: nabavkaId },
      select: { poenPoDelu: true, preuzimanjeOd: true, preuzimanjeDo: true, naziv: { select: { naziv: true } } },
    }),
  ]);
  if (!p) throw new NabavkaGreska("Niste prijavljeni na ovu nabavku.", 404);
  if (!n || !n.poenPoDelu || !n.preuzimanjeOd || !n.preuzimanjeDo) {
    throw new NabavkaGreska("Nabavka nije spremna za potvrdu.", 409);
  }
  if (p.status !== "POZVAN") throw new NabavkaGreska("Potvrda je moguća tek po pozivu.");
  if (p.pozvanAt && rokPotvrde(p.pozvanAt).getTime() <= Date.now()) {
    throw new NabavkaGreska("Rok za odgovor na poziv je istekao.");
  }
  if (!danJeUPeriodu(dan, n.preuzimanjeOd, n.preuzimanjeDo)) {
    throw new NabavkaGreska("Dan preuzimanja mora biti unutar objavljenog perioda preuzimanja.");
  }

  const w = await prisma.wallet.findUnique({ where: { userId }, select: { id: true, balance: true } });
  // Ograničen iznos se ne koristi za učešće u projektu (donacije čl. 6 st. 7, set 5.0.9).
  if (!w || w.balance - (await ograniceno(w.id)) < n.poenPoDelu) {
    throw new NabavkaGreska(`Za potvrdu je potrebno ${n.poenPoDelu} POEN.`, 409);
  }

  const danPreuzimanja = pocetakObracunskogDana(dan);

  await prisma.nabavkaPrijava.update({
    where: { id: p.id },
    data: {
      status: "POTVRDIO",
      potvrdjenoAt: new Date(),
      danPreuzimanja,
      kod: generisiKod(),
      rezervisano: n.poenPoDelu,
    },
  });

  return prisma.nabavkaPrijava.findUnique({
    where: { id: p.id },
    select: { kod: true, danPreuzimanja: true, rezervisano: true },
  });
}

// ─── Preuzimanje i poništenje zapisa (čl. 24, 25) ─────────────────────────────

/**
 * Preuzimanje dela i poništenje zapisa PO ISKORIŠĆENJU (čl. 24 i 25).
 *
 * 🔴 POEN se gasi TEK OVDE, ne pri potvrdi. Do preuzimanja je rezervisan, ali
 * postoji — čovek koji nije došao ne sme ništa da izgubi.
 *
 * Protivzapis ide tipom `OTPIS_NABAVKA`, nikad `TRANSFER` ni `PONISTENJE_PREPISA`:
 * ovde se poništava EMISIJA, pa Protokolov minus opada i sa njim ukupan opticaj.
 * Kod prepisa se POEN samo seli između dva korisnička zapisa i opticaj se ne miče.
 *
 * 🔴 Zapis NE SME u minus (čl. 25 st. 3). Poništava se tačno onoliko koliko je rezervisano,
 * a rezervacija je pri potvrdi proverena prema stanju; ako je stanje u međuvremenu
 * palo (npr. poništenjem lažne potvrde), preuzimanje se odbija umesto da napravi
 * četvrti izuzetak od zabrane negativnog zapisa.
 */
export async function oznaciPreuzeto(prijavaId: string) {
  const p = await prisma.nabavkaPrijava.findUnique({
    where: { id: prijavaId },
    select: {
      id: true,
      userId: true,
      status: true,
      rezervisano: true,
      nabavkaId: true,
      nabavka: { select: { naziv: { select: { naziv: true } } } },
    },
  });
  if (!p) throw new NabavkaGreska("Prijava nije pronađena.", 404);
  if (p.status === "PREUZEO") return;
  if (p.status !== "POTVRDIO") throw new NabavkaGreska("Preuzimanje je moguće tek po potvrdi.");
  if (p.rezervisano <= 0) throw new NabavkaGreska("Nema rezervisanog POEN-a.", 409);

  const w = await prisma.wallet.findUnique({ where: { userId: p.userId }, select: { id: true, balance: true } });
  if (!w) throw new NabavkaGreska("Član nema zapis u Protokolu.", 500);
  if (w.balance < p.rezervisano) {
    throw new NabavkaGreska(
      "Zapis korisnika više ne pokriva rezervisani iznos — poništenje po iskorišćenju ne sme da napravi negativan zapis (čl. 25 st. 3).",
      409
    );
  }

  const iznos = p.rezervisano;
  const dobro = p.nabavka.naziv.naziv;

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({ where: { id: w.id }, data: { balance: { decrement: iznos } } });
    await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: iznos } } });
    await tx.transaction.create({
      data: {
        fromWalletId: w.id,
        toWalletId: PROTOKOL_WALLET_ID,
        amount: iznos,
        type: TransactionType.OTPIS_NABAVKA,
        description: `Kolektivna nabavka — ${dobro}`,
        opisKljuc: "transakcije.nabavka",
        opisParametri: { dobro },
      },
    });
    await tx.nabavkaPrijava.update({
      where: { id: p.id },
      data: { status: "PREUZEO", preuzetoAt: new Date(), rezervisano: 0 },
    });
  });

  try {
    await obavesti(p.userId, {
      tip: "NABAVKA",
      kljuc: "nabavka_preuzeto",
      parametri: { dobro, poen: iznos, dana: ROK_NABAVKA_DANA },
      naslov: "Deo je preuzet",
      // Pouka o pravu i roku je obavezan deo obaveštenja (nabavke čl. 28 st. 2):
      // rok od sedam dana teče od OVOG obaveštenja, pa bez pouke nije zaštita nego zamka.
      tekst:
        `Preuzeo si svoj deo iz nabavke „${dobro}". Poništeno je ${iznos} POEN. ` +
        `Ako deo nisi preuzeo ili nije ispravan, imaš ${ROK_NABAVKA_DANA} dana da podneseš prigovor sa svog profila.`,
      link: `/nabavke/${p.nabavkaId}`,
    });
  } catch (e) {
    console.error("[nabavka] obaveštenje o preuzimanju nije poslato", p.userId, e);
  }
}

/** Pronalazi prijavu po kodu — dobavljač diktira kod, Fondacija ga unosi. */
export async function prijavaPoKodu(nabavkaId: string, kod: string) {
  return prisma.nabavkaPrijava.findFirst({
    where: { nabavkaId, kod: kod.trim() },
    select: {
      id: true,
      status: true,
      danPreuzimanja: true,
      rezervisano: true,
      user: { select: { pseudonim: true } },
    },
  });
}

// ─── Plaćanje i zatvaranje (čl. 23, 26, 10) ───────────────────────────────────

/**
 * Beleži plaćanje dobavljaču i otvara period preuzimanja (čl. 23).
 *
 * 🔴 Plaća se TEK sada, kad je poznato koliko je delova potvrđeno. Ako je potvrđeno
 * manje od broja delova iz kalkulacije, kupuje se manje jedinica i plaća srazmerno
 * manje — veličina dela se ne menja (st. 2).
 *
 * Odliv ide u `ProjekatTrosak`, ne u `FondacijaTrosak`: operativna rezerva je tri
 * OPERATIVNA troška prethodnog meseca, pa bi nabavka upisana kao operativa podigla
 * rezervu i sledeća nabavka bi bila najteža baš kad Fondacija radi.
 */
export async function zabeleziPlacanje(nabavkaId: string, iznosRSD: number, kreiraoId: string) {
  const n = await prisma.nabavka.findUnique({
    where: { id: nabavkaId },
    select: { status: true, naziv: { select: { naziv: true } } },
  });
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (n.status !== "RED_UTVRDJEN") throw new NabavkaGreska("Plaćanje se beleži po utvrđenom redu.");
  if (!(iznosRSD > 0)) throw new NabavkaGreska("Iznos plaćanja mora biti veći od nule.");

  // Dan troška je kalendarski dan po srpskom vremenu, ne po satu servera.
  const danas = beogradskiDan(new Date());

  await prisma.$transaction(async (tx) => {
    // Čl. 23 st. 1 — nabavlja se onoliko delova koliko je potvrđeno; snimak služi dopunskom
    // roku (čl. 26), koji nudi samo delove koji su stvarno nabavljeni.
    const potvrdjenih = await tx.nabavkaPrijava.count({ where: { nabavkaId, status: { in: ["POTVRDIO", "PREUZEO"] } } });
    await tx.projekatTrosak.create({
      data: {
        nabavkaId,
        datum: danas,
        iznosRSD,
        opis: `Kolektivna nabavka — ${n.naziv.naziv}`,
        kreiraoId,
      },
    });
    await tx.nabavka.update({
      where: { id: nabavkaId },
      data: { status: "PLACENA", placenoAt: new Date(), placenoRSD: iznosRSD, nabavljenoDelova: potvrdjenih },
    });
  });
}

/** Zatvara nabavku i briše predloge izabranog naziva (čl. 10 st. 3). */
export async function zavrsiNabavku(nabavkaId: string) {
  const n = await prisma.nabavka.findUnique({ where: { id: nabavkaId }, select: { status: true, nazivId: true } });
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (n.status === "ZAVRSENA") return 0;
  if (n.status !== "PLACENA") throw new NabavkaGreska("Nabavka se zatvara po isteku perioda preuzimanja i dopunskog roka.");

  const sada = new Date();
  await prisma.$transaction(async (tx) => {
    // Čl. 26 (set 5.1.4) — istekom dopunskog roka neiskorišćena rezervacija se oslobađa,
    // a zahtev koji nije dobio deo se zatvara. Delovi koji ni tada ne budu preuzeti idu po
    // čl. 26 st. 1–2 (naredna nabavka, odnosno ustupanje bez naknade) — samo evidencija.
    await tx.nabavkaDodatniDeo.updateMany({
      where: { nabavkaId, status: "DODELJEN" },
      data: { status: "OSLOBODJEN", rezervisano: 0, kod: null, zatvorenoAt: sada },
    });
    await tx.nabavkaDodatniDeo.updateMany({
      where: { nabavkaId, status: "ZATRAZEN" },
      data: { status: "NIJE_DODELJEN", zatvorenoAt: sada },
    });
    await tx.nabavka.update({
      where: { id: nabavkaId },
      data: { status: "ZAVRSENA", zavrsenoAt: sada },
    });
  });
  return brisiPredlogeNaziva(n.nazivId);
}

/**
 * Obustava nabavke. Sve rezervacije se oslobađaju — POEN se ne gasi (čl. 25 st. 2:
 * poništenje nastupa tek u trenutku preuzimanja).
 */
export async function obustaviNabavku(nabavkaId: string, razlog: string) {
  const r = razlog.trim();
  if (r.length < 10) throw new NabavkaGreska("Obustava mora imati obrazloženje.");
  const n = await prisma.nabavka.findUnique({ where: { id: nabavkaId }, select: { status: true } });
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (n.status === "ZAVRSENA" || n.status === "OBUSTAVLJENA") throw new NabavkaGreska("Nabavka je već zatvorena.");

  await prisma.$transaction(async (tx) => {
    await tx.nabavkaPrijava.updateMany({
      where: { nabavkaId, status: { in: ["PRIJAVLJEN", "POZVAN", "POTVRDIO"] } },
      data: { status: "ODUSTAO", rezervisano: 0, kod: null, danPreuzimanja: null },
    });
    await tx.nabavkaDodatniDeo.updateMany({
      where: { nabavkaId, status: { in: ["ZATRAZEN", "DODELJEN"] } },
      data: { status: "ODUSTAO", rezervisano: 0, kod: null, zatvorenoAt: new Date() },
    });
    await tx.nabavka.update({
      where: { id: nabavkaId },
      data: { status: "OBUSTAVLJENA", obustavljenoAt: new Date(), obustavaRazlog: r },
    });
  });
}

// ─── Dopunski rok (čl. 26, set 5.1.4) ─────────────────────────────────────────

/*
 * Posle isteka perioda preuzimanja otvara se dopunski rok od `DOPUNSKI_ROK_DANA` dana.
 * Nepreuzeti delovi nude se korisnicima koji su u toj nabavci preuzeli deo; dodeljuju se po
 * redu iz čl. 20 (red je utvrđen i ne menja se), po JEDAN deo po korisniku u svakom krugu,
 * dok ima delova i zahteva. Krug se izvršava noćnim poslom (`obradiNabavke`).
 *
 * 🔴 Isti režim kao redovan deo: POEN se REZERVIŠE pri dodeli (čl. 21 st. 3 shodno), a
 * poništava pri preuzimanju tipom `OTPIS_NABAVKA` (čl. 25); zapis ne ide u minus (čl. 25
 * st. 3), pa bez dovoljno POEN-a nema dodele. Kod vidi samo korisnik; dobavljaču ide samo
 * spisak kodova (čl. 24 st. 3). Istekom dopunskog roka neiskorišćena rezervacija se oslobađa
 * (`zavrsiNabavku`).
 */

const DODATNI_ZAUZET = ["DODELJEN", "PREUZEO"] as const;

type Db = Prisma.TransactionClient | typeof prisma;

/** Koliko se nepreuzetih delova u dopunskom roku još može dodeliti. */
async function slobodnihDodatnih(db: Db, nabavkaId: string): Promise<number> {
  const n = await db.nabavka.findUniqueOrThrow({
    where: { id: nabavkaId },
    select: { nabavljenoDelova: true, brojDelova: true, placenoRSD: true, nabavnaCena: true, velicinaDela: true },
  });
  const [preuzetoRedovno, zauzetoDodatno] = await Promise.all([
    db.nabavkaPrijava.count({ where: { nabavkaId, status: "PREUZEO" } }),
    db.nabavkaDodatniDeo.count({ where: { nabavkaId, status: { in: [...DODATNI_ZAUZET] } } }),
  ]);
  const nabavljeno = nabavljenihDelova({
    snimak: n.nabavljenoDelova,
    brojDelova: n.brojDelova,
    placenoRSD: n.placenoRSD == null ? null : Number(n.placenoRSD),
    nabavnaCena: n.nabavnaCena == null ? null : Number(n.nabavnaCena),
    velicinaDela: n.velicinaDela,
  });
  return slobodnihDodatnihDelova(nabavljeno, preuzetoRedovno, zauzetoDodatno);
}

/** Poslednji dan dopunskog roka, za tekst obaveštenja (po srpskom vremenu). */
function poslednjiDanDopunskog(preuzimanjeDo: Date): string {
  return new Date(krajDopunskogRoka(preuzimanjeDo).getTime() - 1).toLocaleDateString("sr-RS", { timeZone: "Europe/Belgrade" });
}

/** Stanje dopunskog roka za ekran nabavke: rok, broj slobodnih delova i sopstveni dodatni delovi. */
export async function stanjeDopunskogRoka(nabavkaId: string, userId: string, sada = new Date()) {
  const n = await prisma.nabavka.findUnique({ where: { id: nabavkaId }, select: { status: true, preuzimanjeDo: true } });
  if (!n || !n.preuzimanjeDo) return null;
  const traje = n.status === "PLACENA" && dopunskiRokTraje(n.preuzimanjeDo, sada);
  const [prijava, moji, slobodnih] = await Promise.all([
    prisma.nabavkaPrijava.findUnique({ where: { nabavkaId_userId: { nabavkaId, userId } }, select: { status: true } }),
    prisma.nabavkaDodatniDeo.findMany({
      where: { nabavkaId, userId },
      orderBy: { zatrazenoAt: "asc" },
      select: { id: true, status: true, kod: true, rezervisano: true },
    }),
    traje ? slobodnihDodatnih(prisma, nabavkaId) : Promise.resolve(0),
  ]);
  const otvorenZahtev = moji.some((d) => d.status === "ZATRAZEN");
  return {
    od: n.preuzimanjeDo.toISOString(),
    do: krajDopunskogRoka(n.preuzimanjeDo).toISOString(),
    traje,
    slobodnih,
    otvorenZahtev,
    mozeZatraziti: smeTrazitiDodatniDeo({ statusPrijave: prijava?.status ?? null, rokTraje: traje, slobodnih, otvorenZahtev }).ok,
    // 🔴 Kod samo za dodeljen, a nepreuzet deo — i samo vlasniku (traže se samo sopstveni).
    delovi: moji.map((d) => ({ id: d.id, status: d.status, kod: d.status === "DODELJEN" ? d.kod : null, rezervisano: d.rezervisano })),
  };
}

/** Korisnik koji je preuzeo deo traži dodatni deo (čl. 26, set 5.1.4). */
export async function zatraziDodatniDeo(userId: string, nabavkaId: string) {
  const [korisnik, n, prijava] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { maloletan: true, deaktiviranAt: true, status: true, verified: true, indeksStvarnosti: true },
    }),
    prisma.nabavka.findUnique({ where: { id: nabavkaId }, select: { status: true, preuzimanjeDo: true } }),
    prisma.nabavkaPrijava.findUnique({ where: { nabavkaId_userId: { nabavkaId, userId } }, select: { status: true } }),
  ]);
  if (!korisnik) throw new NabavkaGreska("Korisnik nije pronađen.", 404);
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (!smeUcestvovati(korisnik)) {
    throw new NabavkaGreska("U nabavci učestvuju punoletni korisnici sa aktivnim nalogom i potvrđenom stvarnošću (čl. 4).", 403);
  }
  const traje = n.status === "PLACENA" && dopunskiRokTraje(n.preuzimanjeDo, new Date());

  return prisma.$transaction(async (tx) => {
    // Zahtevi i dodela iste nabavke idu jedan za drugim.
    await tx.$queryRaw`SELECT id FROM "Nabavka" WHERE id = ${nabavkaId} FOR UPDATE`;
    const [otvoren, slobodnih] = await Promise.all([
      tx.nabavkaDodatniDeo.count({ where: { nabavkaId, userId, status: "ZATRAZEN" } }),
      traje ? slobodnihDodatnih(tx, nabavkaId) : Promise.resolve(0),
    ]);
    const s = smeTrazitiDodatniDeo({ statusPrijave: prijava?.status ?? null, rokTraje: traje, slobodnih, otvorenZahtev: otvoren > 0 });
    if (!s.ok) {
      const poruka = {
        NIJE_PREUZEO: "Dodatni deo traži samo korisnik koji je u ovoj nabavci preuzeo deo (čl. 26).",
        ROK: "Dopunski rok nije u toku.",
        NEMA_DELOVA: "Nema više nepreuzetih delova.",
        OTVOREN_ZAHTEV: "Tvoj zahtev čeka dodelu u sledećem krugu.",
      }[s.razlog];
      throw new NabavkaGreska(poruka, 409);
    }
    return tx.nabavkaDodatniDeo.create({ data: { nabavkaId, userId }, select: { id: true, status: true } });
  });
}

/** Korisnik povlači zahtev, odnosno odustaje od dodeljenog dela — rezervacija se oslobađa. */
export async function odustaniOdDodatnog(userId: string, deoId: string) {
  const r = await prisma.nabavkaDodatniDeo.updateMany({
    where: { id: deoId, userId, status: { in: ["ZATRAZEN", "DODELJEN"] } },
    data: { status: "ODUSTAO", rezervisano: 0, kod: null, zatvorenoAt: new Date() },
  });
  if (r.count !== 1) throw new NabavkaGreska("Zahtev nije pronađen ili je već zatvoren.", 404);
}

async function noviKodDodatnog(tx: Prisma.TransactionClient): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const kod = generisiKod();
    const [a, b] = await Promise.all([
      tx.nabavkaPrijava.count({ where: { kod } }),
      tx.nabavkaDodatniDeo.count({ where: { kod } }),
    ]);
    if (a === 0 && b === 0) return kod;
  }
  throw new NabavkaGreska("Kod za preuzimanje nije mogao da se dodeli.", 500);
}

/**
 * Otvaranje dopunskog roka: preuzimaoci se jednom obaveštavaju, ako ima nepreuzetih delova.
 * Obaveštenje ne sme da obori obradu.
 */
export async function otvoriDopunskiRok(nabavkaId: string, sada = new Date()): Promise<number> {
  const r = await prisma.nabavka.updateMany({
    where: { id: nabavkaId, status: "PLACENA", dopunskiOtvorenAt: null },
    data: { dopunskiOtvorenAt: sada },
  });
  if (r.count !== 1) return 0;
  const n = await prisma.nabavka.findUniqueOrThrow({
    where: { id: nabavkaId },
    select: { preuzimanjeDo: true, naziv: { select: { naziv: true } } },
  });
  const slobodnih = await slobodnihDodatnih(prisma, nabavkaId);
  if (slobodnih <= 0 || !n.preuzimanjeDo) return 0;
  const preuzeli = await prisma.nabavkaPrijava.findMany({ where: { nabavkaId, status: "PREUZEO" }, select: { userId: true } });
  const doDana = poslednjiDanDopunskog(n.preuzimanjeDo);
  for (const p of preuzeli) {
    try {
      await obavesti(p.userId, {
        tip: "NABAVKA",
        kljuc: "nabavka_dopunski",
        parametri: { dobro: n.naziv.naziv, delova: slobodnih, do: doDana },
        naslov: "Ostali su nepreuzeti delovi",
        tekst: `U nabavci „${n.naziv.naziv}" ostalo je nepreuzetih delova: ${slobodnih}. Do ${doDana} možeš da zatražiš dodatni deo; delovi se dodeljuju po redu iz nabavke, po jedan u svakom krugu.`,
        link: `/nabavke/${nabavkaId}`,
      });
    } catch (e) {
      console.error("[nabavka] obaveštenje o dopunskom roku nije poslato", p.userId, e);
    }
  }
  return preuzeli.length;
}

/**
 * Jedan krug dodele dodatnih delova (čl. 26, set 5.1.4). Sve u jednoj transakciji uz
 * zaključan zapis nabavke: broj slobodnih delova, raspoloživo po zahtevu i dodela se
 * utvrđuju nad istim stanjem. Pravilo kruga je u `krugDodele` (nabavka-pravila.ts).
 */
export async function dodeliKrugDodatnih(nabavkaId: string, sada = new Date()) {
  const n = await prisma.nabavka.findUnique({
    where: { id: nabavkaId },
    select: { status: true, preuzimanjeDo: true, poenPoDelu: true, naziv: { select: { naziv: true } } },
  });
  if (!n || n.status !== "PLACENA" || !n.poenPoDelu || !n.preuzimanjeDo || !dopunskiRokTraje(n.preuzimanjeDo, sada)) {
    return { dodeljeno: 0, bezPoena: 0, cekaju: 0 };
  }
  const poenPoDelu = n.poenPoDelu;
  const preuzimanjeDo = n.preuzimanjeDo;

  const ishod = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Nabavka" WHERE id = ${nabavkaId} FOR UPDATE`;
    const zahtevi = await tx.nabavkaDodatniDeo.findMany({
      where: { nabavkaId, status: "ZATRAZEN" },
      select: { id: true, userId: true, zatrazenoAt: true },
    });
    const dodeljeni: { userId: string }[] = [];
    if (zahtevi.length === 0) return { dodeljeni, bezPoena: [] as string[], cekaju: 0 };
    const korisnikZahteva = new Map(zahtevi.map((z) => [z.id, z.userId]));
    const prijave = await tx.nabavkaPrijava.findMany({
      where: { nabavkaId, userId: { in: zahtevi.map((z) => z.userId) } },
      select: { userId: true, mesto: true },
    });
    const mesto = new Map(prijave.map((p) => [p.userId, p.mesto]));
    const ulaz = [];
    for (const z of zahtevi) {
      await tx.$queryRaw`SELECT id FROM "Wallet" WHERE "userId" = ${z.userId} FOR UPDATE`;
      const w = await tx.wallet.findUnique({ where: { userId: z.userId }, select: { id: true, balance: true } });
      const r = w ? raspolozivo(w.balance) - (await rezervisanoZaNabavku(z.userId, tx)) - (await ograniceno(w.id, tx)) : 0;
      ulaz.push({ id: z.id, mesto: mesto.get(z.userId) ?? null, zatrazenoAt: z.zatrazenoAt, raspolozivo: r });
    }
    const k = krugDodele(ulaz, await slobodnihDodatnih(tx, nabavkaId), poenPoDelu);
    const maxKrug = await tx.nabavkaDodatniDeo.aggregate({ where: { nabavkaId }, _max: { krug: true } });
    const krug = (maxKrug._max.krug ?? 0) + 1;
    for (const id of k.dodeljeni) {
      await tx.nabavkaDodatniDeo.update({
        where: { id },
        data: { status: "DODELJEN", rezervisano: poenPoDelu, kod: await noviKodDodatnog(tx), krug, dodeljenoAt: sada },
      });
      dodeljeni.push({ userId: korisnikZahteva.get(id)! });
    }
    if (k.bezPoena.length) {
      await tx.nabavkaDodatniDeo.updateMany({
        where: { id: { in: k.bezPoena }, status: "ZATRAZEN" },
        data: { status: "NIJE_DODELJEN", zatvorenoAt: sada },
      });
    }
    return { dodeljeni, bezPoena: k.bezPoena.map((id) => korisnikZahteva.get(id)!), cekaju: k.cekaju.length };
  });

  const doDana = poslednjiDanDopunskog(preuzimanjeDo);
  for (const d of ishod.dodeljeni) {
    try {
      await obavesti(d.userId, {
        tip: "NABAVKA",
        kljuc: "nabavka_dodatni_dodeljen",
        parametri: { dobro: n.naziv.naziv, poen: poenPoDelu, do: doDana },
        naslov: "Dobio si dodatni deo",
        tekst: `Nabavka „${n.naziv.naziv}": dodeljen ti je dodatni deo. Rezervisano je ${poenPoDelu} POEN, koji se poništava pri preuzimanju. Preuzmi ga uz kod sa stranice nabavke do ${doDana}.`,
        link: `/nabavke/${nabavkaId}`,
      });
    } catch (e) {
      console.error("[nabavka] obaveštenje o dodatnom delu nije poslato", d.userId, e);
    }
  }
  for (const userId of ishod.bezPoena) {
    try {
      await obavesti(userId, {
        tip: "NABAVKA",
        kljuc: "nabavka_dodatni_bez_poena",
        parametri: { dobro: n.naziv.naziv, poen: poenPoDelu },
        naslov: "Dodatni deo nije dodeljen",
        tekst: `Nabavka „${n.naziv.naziv}": za dodatni deo je potrebno ${poenPoDelu} POEN kojim raspolažeš, pa deo nije dodeljen. Zahtev možeš da ponoviš.`,
        link: `/nabavke/${nabavkaId}`,
      });
    } catch (e) {
      console.error("[nabavka] obaveštenje o nedodeljenom delu nije poslato", userId, e);
    }
  }
  return { dodeljeno: ishod.dodeljeni.length, bezPoena: ishod.bezPoena.length, cekaju: ishod.cekaju };
}

/** Pronalazi dodatni deo po kodu — dobavljač diktira kod, Fondacija ga unosi. */
export async function dodatniDeoPoKodu(nabavkaId: string, kod: string) {
  return prisma.nabavkaDodatniDeo.findFirst({
    where: { nabavkaId, kod: kod.trim() },
    select: { id: true, status: true, rezervisano: true, user: { select: { pseudonim: true } } },
  });
}

/**
 * Preuzimanje dodatnog dela i poništenje POEN-a po iskorišćenju (čl. 25 i 26) — isti tip
 * `OTPIS_NABAVKA` kao redovan deo. 🔴 Zapis ne sme u minus (čl. 25 st. 3); par i provera
 * zbira po novčaniku u istoj transakciji (pravilo 1, obrazac `potvrde-parovi.ts`).
 */
export async function oznaciPreuzetDodatni(deoId: string) {
  const d = await prisma.nabavkaDodatniDeo.findUnique({
    where: { id: deoId },
    select: { id: true, userId: true, status: true, rezervisano: true, nabavkaId: true, nabavka: { select: { naziv: { select: { naziv: true } } } } },
  });
  if (!d) throw new NabavkaGreska("Dodatni deo nije pronađen.", 404);
  if (d.status === "PREUZEO") return;
  if (d.status !== "DODELJEN") throw new NabavkaGreska("Preuzimanje je moguće samo za dodeljen dodatni deo u dopunskom roku.");
  if (d.rezervisano <= 0) throw new NabavkaGreska("Nema rezervisanog POEN-a.", 409);
  const w = await prisma.wallet.findUnique({ where: { userId: d.userId }, select: { id: true } });
  if (!w) throw new NabavkaGreska("Član nema zapis u Protokolu.", 500);

  const iznos = d.rezervisano;
  const dobro = d.nabavka.naziv.naziv;
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${w.id} FOR UPDATE`;
    const stanje = await tx.wallet.findUniqueOrThrow({ where: { id: w.id }, select: { balance: true } });
    if (stanje.balance < iznos) {
      throw new NabavkaGreska(
        "Zapis korisnika više ne pokriva rezervisani iznos — poništenje po iskorišćenju ne sme da napravi negativan zapis (čl. 25 st. 3).",
        409,
      );
    }
    const r = await tx.nabavkaDodatniDeo.updateMany({
      where: { id: d.id, status: "DODELJEN" },
      data: { status: "PREUZEO", preuzetoAt: new Date(), rezervisano: 0 },
    });
    if (r.count !== 1) throw new NabavkaGreska("Dodatni deo je već zatvoren.", 409);
    const snimak = await snimiZbir(tx, [w.id]);
    await tx.wallet.update({ where: { id: w.id }, data: { balance: { decrement: iznos } } });
    await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: iznos } } });
    await tx.transaction.create({
      data: {
        fromWalletId: w.id,
        toWalletId: PROTOKOL_WALLET_ID,
        amount: iznos,
        type: TransactionType.OTPIS_NABAVKA,
        description: `Kolektivna nabavka — ${dobro} (dodatni deo)`,
        opisKljuc: "transakcije.nabavka_dodatni",
        opisParametri: { dobro },
      },
    });
    await proveriZbir(tx, snimak, "Preuzimanje dodatnog dela nabavke");
  });

  try {
    await obavesti(d.userId, {
      tip: "NABAVKA",
      kljuc: "nabavka_dodatni_preuzet",
      parametri: { dobro, poen: iznos },
      naslov: "Dodatni deo je preuzet",
      tekst: `Preuzeo si dodatni deo iz nabavke „${dobro}". Poništeno je ${iznos} POEN.`,
      link: `/nabavke/${d.nabavkaId}`,
    });
  } catch (e) {
    console.error("[nabavka] obaveštenje o preuzetom dodatnom delu nije poslato", d.userId, e);
  }
}

// ─── Rezervisan POEN u Novčaniku ──────────────────────────────────────────────

/**
 * Koliko je korisniku rezervisano za nabavku. Nula kad rezervacije nema — Novčanik
 * red prikazuje samo kad postoji, po odluci vlasnika.
 */
export async function rezervisanoZaNabavku(
  userId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<number> {
  // 🔴 Jedan izvor za sve koji računaju raspoloživo: redovan deo (čl. 21 st. 3) i dodatni
  // deo u dopunskom roku (čl. 26, set 5.1.4). Ko sabira samo `nabavkaPrijava`, pušta
  // da se rezervisan POEN potroši drugde.
  const [r, d] = await Promise.all([
    db.nabavkaPrijava.aggregate({ where: { userId, status: "POTVRDIO" }, _sum: { rezervisano: true } }),
    db.nabavkaDodatniDeo.aggregate({ where: { userId, status: "DODELJEN" }, _sum: { rezervisano: true } }),
  ]);
  return (r._sum.rezervisano ?? 0) + (d._sum.rezervisano ?? 0);
}

// ─── Noćni posao (čl. 19, 21, 22, 26) ─────────────────────────────────────────

export interface IzvestajObrade {
  prijaveZatvorene: number;
  pozivaIsteklo: number;
  nijePreuzeto: number;
  novihPoziva: number;
  /** Čl. 26 (set 5.1.4) — dodatni delovi dodeljeni u dopunskom roku. */
  dodatnihDodeljeno: number;
  zavrsenih: number;
  istekliPredlozi: number;
}

/**
 * Jedan prolaz kroz sve nabavke u toku.
 *
 * 🔴 Bez ovoga mehanizam stoji: poziv ističe a niko ga ne obara, mesto se ne
 * oslobađa i sledeći u redu nikad ne dobije priliku. Rolanje poziva je jedina stvar
 * u ovom mehanizmu koju ne pokreće ničiji klik.
 */
export async function obradiNabavke(sada = new Date()): Promise<IzvestajObrade> {
  const izv: IzvestajObrade = {
    prijaveZatvorene: 0,
    pozivaIsteklo: 0,
    nijePreuzeto: 0,
    novihPoziva: 0,
    dodatnihDodeljeno: 0,
    zavrsenih: 0,
    istekliPredlozi: 0,
  };

  // 1) Istekle prijave → utvrdi red i pošalji prve pozive.
  const zaZatvaranje = await prisma.nabavka.findMany({
    where: { status: "OBJAVLJENA", prijaveDo: { lte: sada } },
    select: { id: true },
  });
  for (const n of zaZatvaranje) {
    try {
      await zatvoriPrijaveIUtvrdiRed(n.id);
      izv.prijaveZatvorene += 1;
    } catch (e) {
      console.error("[nabavka] zatvaranje prijava nije uspelo", n.id, e);
    }
  }

  // 2) Istekli pozivi → mesto se oslobađa (čl. 22 st. 1).
  const pozvani = await prisma.nabavkaPrijava.findMany({
    where: { status: "POZVAN", pozvanAt: { not: null } },
    select: { id: true, nabavkaId: true, pozvanAt: true },
  });
  const nabavkeZaPopunu = new Set<string>();
  for (const p of pozvani) {
    if (p.pozvanAt && rokPotvrde(p.pozvanAt).getTime() <= sada.getTime()) {
      await prisma.nabavkaPrijava.update({ where: { id: p.id }, data: { status: "ISTEKAO" } });
      nabavkeZaPopunu.add(p.nabavkaId);
      izv.pozivaIsteklo += 1;
    }
  }

  // 3) Potvrđeni koji nisu došli svog dana (čl. 22 st. 1).
  const potvrdjeni = await prisma.nabavkaPrijava.findMany({
    where: { status: "POTVRDIO", danPreuzimanja: { not: null } },
    select: { id: true, nabavkaId: true, danPreuzimanja: true },
  });
  for (const p of potvrdjeni) {
    if (!p.danPreuzimanja) continue;
    // Kraj upisanog dana je ponoć po srpskom vremenu (obračunski dan).
    const kraj = krajDana(p.danPreuzimanja, 0);
    if (kraj.getTime() <= sada.getTime()) {
      await prisma.nabavkaPrijava.update({
        where: { id: p.id },
        data: { status: "NIJE_PREUZEO", rezervisano: 0, kod: null },
      });
      nabavkeZaPopunu.add(p.nabavkaId);
      izv.nijePreuzeto += 1;
    }
  }

  // 4) Popuna oslobođenih mesta — poziv ide sledećem u redu.
  for (const nabavkaId of nabavkeZaPopunu) {
    try {
      izv.novihPoziva += await pozoviSledeceg(nabavkaId);
    } catch (e) {
      console.error("[nabavka] popuna mesta nije uspela", nabavkaId, e);
    }
  }

  // 5) Istekao period preuzimanja → dopunski rok (čl. 26, set 5.1.4): otvaranje i
  //    obaveštenje, pa po jedan krug dodele dodatnih delova u svakom prolazu. Istekom
  //    dopunskog roka nabavka se zatvara (čl. 26, 10 st. 3) i rezervacije se oslobađaju.
  const poIsteku = await prisma.nabavka.findMany({
    where: { status: "PLACENA", preuzimanjeDo: { lte: sada } },
    select: { id: true, preuzimanjeDo: true, dopunskiOtvorenAt: true },
  });
  for (const n of poIsteku) {
    try {
      if (n.preuzimanjeDo && krajDopunskogRoka(n.preuzimanjeDo).getTime() > sada.getTime()) {
        if (!n.dopunskiOtvorenAt) await otvoriDopunskiRok(n.id, sada);
        const k = await dodeliKrugDodatnih(n.id, sada);
        izv.dodatnihDodeljeno += k.dodeljeno;
        continue;
      }
      await zavrsiNabavku(n.id);
      izv.zavrsenih += 1;
    } catch (e) {
      console.error("[nabavka] dopunski rok, odnosno zatvaranje nabavke nije uspelo", n.id, e);
    }
  }

  // 6) Predlozi stariji od dvanaest meseci (čl. 10 st. 3).
  izv.istekliPredlozi = await brisiIstekle(sada);

  return izv;
}

// ─── Izborno glasanje (Gornje Kolo čl. 8 st. 1) ───────────────────────────────

/**
 * Utvrđuje izabran naziv iz zatvorenog izbornog glasanja i otvara nabavku.
 *
 * Zbir glasačke moći se čita iz `GlasanjeGlas.glasackaGlasova` — moći zapamćene u
 * trenutku davanja glasa (Gornje Kolo čl. 12 st. 2), pa kašnjenje zatvaranja ne može da
 * pomeri ishod.
 */
export async function utvrdiIzborNabavke(predlogId: string) {
  const glasovi = await prisma.glasanjeGlas.findMany({
    where: { predlogId, izbor: { not: null } },
    select: { izbor: true, glasackaGlasova: true },
  });
  if (glasovi.length === 0) return null;

  const zbir = new Map<string, number>();
  for (const g of glasovi) {
    if (!g.izbor) continue;
    zbir.set(g.izbor, (zbir.get(g.izbor) ?? 0) + g.glasackaGlasova);
  }
  if (zbir.size === 0) return null;

  const registar = await registarPredloga();
  const poId = new Map(registar.map((r) => [r.nazivId, r]));

  const mogucnosti = [...zbir.entries()].map(([nazivId, moc]) => ({
    kljuc: nazivId,
    moc,
    brojPredlagaca: poId.get(nazivId)?.brojKorisnika ?? 0,
    unetAt: poId.get(nazivId)?.unetAt ?? new Date(0),
  }));

  return utvrdiIzbor(mogucnosti);
}

export type { NabavkaPrijavaStatus };
