/**
 * Kolektivna nabavka — servisne funkcije (Prisma).
 *
 * Čista pravila žive u `src/lib/nabavka-pravila.ts` i odavde se re-eksportuju, pa
 * server ima jedan ulaz. Osnov: Pravilnik o projektima i kolektivnim nabavkama
 * (set 4.4.1); Pravilnik o KOLO sistemu čl. 14a i 51a.
 */
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import type { NabavkaPrijavaStatus } from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";
import { ROK_NABAVKA_DANA } from "@/lib/prigovor-pravila";
import {
  dohvatiSaldoFondacije,
  dohvatiTrosakPrethodnogMeseca,
  azurirajVetoStatus,
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
  smeUcestvovati,
  utvrdiIzbor,
  predlogIstice,
} from "@/lib/nabavka-pravila";

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
 * Briše predloge izabranog naziva po sprovedenoj nabavci (čl. 32 st. 1).
 *
 * 🔴 Bez ovoga ista reč pobeđuje zauvek: ako tri stotine ljudi napiše „gorivo" i
 * taj upis ostane, gorivo dobija svako sledeće glasanje i registar prestaje da meri
 * išta. Ko i dalje hoće gorivo, upiše ga ponovo — i to je svež signal.
 */
export async function brisiPredlogeNaziva(nazivId: string): Promise<number> {
  const r = await prisma.predlogNabavke.deleteMany({ where: { nazivId } });
  return r.count;
}

/** Čl. 32 st. 1 — predlozi stariji od dvanaest meseci (čisti ih cron). */
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
  vetoAktivan: boolean;
}

/**
 * Sredstva raspoloživa za projekte, sa stanjem zaštitnog veta (čl. 5 i 7).
 *
 * Saldo dolazi iz `fondacija.ts` i već je umanjen za projektni odliv; rezerva se
 * računa isključivo iz OPERATIVNIH troškova — vidi komentar uz `ProjekatTrosak`.
 */
export async function sredstvaZaProjekte(): Promise<SredstvaZaProjekte> {
  const [saldo, trosak, veto] = await Promise.all([
    dohvatiSaldoFondacije(),
    dohvatiTrosakPrethodnogMeseca(),
    azurirajVetoStatus(),
  ]);
  return {
    saldoRSD: saldo.saldo,
    trosakPrethodnogMesecaRSD: trosak,
    rezervaRSD: trosak * MESECI_REZERVE,
    raspolozivoRSD: raspolozivoZaProjekte(saldo.saldo, trosak),
    vetoAktivan: veto.aktivan,
  };
}

// ─── Priprema nabavke (čl. 12, 15, 20) ────────────────────────────────────────

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
 * Čl. 17 — odluka utvrđuje ukupnu količinu, veličinu dela i broj POEN-a po delu.
 *
 * 🔴 Mora se izvršiti PRE prve ponude. To nije formalnost nego jedina brana koja
 * tvrdnju iz čl. 19 čini proverljivom: broj POEN-a ne može biti izveden iz cene
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
    throw new NabavkaGreska("Parametri se utvrđuju pre prikupljanja ponuda (čl. 17 st. 3).", 409);
  }
  if (!validniParametri(ulaz)) {
    throw new NabavkaGreska(
      "Količina, veličina dela i broj POEN-a po delu moraju biti celi brojevi veći od nule, a količina deljiva veličinom dela bez ostatka (čl. 17).",
    );
  }
  if (!ulaz.poenObrazlozenje.trim()) {
    throw new NabavkaGreska("Obrazloženje parametara je obavezno (čl. 17 st. 3).");
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
    throw new NabavkaGreska("Prvo se utvrđuju parametri nabavke, pa se prikupljaju ponude (čl. 17 st. 3).", 409);
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
 * Objavljuje kalkulaciju i otvara prijave (čl. 20).
 *
 * 🔴 Svi brojevi se SNIMAJU na zapis. Po čl. 20 st. 2 kalkulacija se posle objave
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
    throw new NabavkaGreska(`Potrebno je najmanje ${NAJMANJE_PONUDA} ponude pre objave (čl. 15).`);
  }
  const izabrana = n.ponude.find((p) => p.id === ulaz.ponudaId);
  if (!izabrana) throw new NabavkaGreska("Izabrana ponuda ne pripada ovoj nabavci.");

  // Čl. 15 st. 1 — bira se NAJPOVOLJNIJA. Ako izabrana nije najjeftinija, izbor je
  // ili greška ili odluka koju akt ne dopušta; u oba slučaja bolje da padne ovde.
  const najjeftinija = n.ponude.reduce((a, b) => (Number(a.cenaPoJedinici) <= Number(b.cenaPoJedinici) ? a : b));
  if (izabrana.id !== najjeftinija.id) {
    throw new NabavkaGreska("Bira se najpovoljnija ponuda (čl. 15 st. 1).");
  }

  const sredstva = await sredstvaZaProjekte();
  if (sredstva.vetoAktivan) {
    throw new NabavkaGreska("Zaštitni veto Fondacije je na snazi — nabavka se ne sprovodi (čl. 7).", 409);
  }

  if (n.brojJedinica === null || n.velicinaDela === null || n.poenPoDelu === null) {
    throw new NabavkaGreska("Parametri nabavke nisu utvrđeni (čl. 17).", 409);
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
    // Čl. 18 st. 2 — prekoračenje granice nije greška u unosu nego ishod tendera.
    throw new NabavkaGreska(
      "Nabavka se ne sprovodi: ili nema sredstava iznad rezerve, ili ukupan dinarski trošak prelazi gornju granicu iz čl. 8. Sredstva ostaju za narednu nabavku, a nova odluka može utvrditi manju količinu."
    );
  }

  const sada = new Date();
  const preuzimanjeOd = new Date(ulaz.preuzimanjeOd);
  preuzimanjeOd.setHours(0, 0, 0, 0);

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

// ─── Prijava (čl. 21) ─────────────────────────────────────────────────────────

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
  // Čl. 21 st. 2 — prijava ne zavisi od broja POEN-a u zapisu; broj POEN-a
  // određuje samo mesto u redu (čl. 22), a dovoljnost se proverava pri potvrdi (čl. 23).
  if (n.status !== "OBJAVLJENA") throw new NabavkaGreska("Prijave nisu otvorene.");
  if (n.prijaveDo && n.prijaveDo.getTime() <= Date.now()) throw new NabavkaGreska("Rok za prijavu je istekao.");

  try {
    return await prisma.nabavkaPrijava.create({ data: { nabavkaId, userId } });
  } catch {
    throw new NabavkaGreska("Već ste prijavljeni na ovu nabavku.", 409);
  }
}

/** Odustanak — pre poziva i posle njega (čl. 24 st. 1). */
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

// ─── Red i pozivi (čl. 22, 23, 24) ────────────────────────────────────────────

/**
 * Zatvara prijave, snima red i šalje prve pozive (čl. 22).
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

  // Čl. 21 st. 2 i čl. 22 — u red ulazi svaka prijava, bez najmanjeg broja POEN-a.
  // Zapis u minusu ulazi sa nulom; dovoljnost se proverava tek pri potvrdi (čl. 23).
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
 * Popunjava mesta pozivima, prema redu, do broja delova (čl. 23 st. 1).
 *
 * Isti poziv rešava i prvo popunjavanje i svako kasnije oslobađanje mesta — jedno
 * pravilo, tri povoda (odustanak, istek roka, nepreuzimanje). Posebna lista čekanja
 * se ne vodi: red iz čl. 22 se prosto nastavlja preko broja delova.
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
  // Kad period preuzimanja istekne, lanac poziva se zaustavlja (čl. 29).
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
 * Potvrda učešća upisom dana preuzimanja (čl. 23 st. 2).
 *
 * 🔴 Tek tada se POEN REZERVIŠE. Prijava je jeftina i nezavezujuća; obaveza nastaje
 * kad čovek kaže kog dana dolazi. Ko u tom trenutku nema dovoljno POEN-a ne može da
 * potvrdi (st. 4) — inače bi rezervacija pukla i mesto ostalo prazno bez ijednog traga.
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

  const w = await prisma.wallet.findUnique({ where: { userId }, select: { balance: true } });
  if (!w || w.balance < n.poenPoDelu) {
    throw new NabavkaGreska(`Za potvrdu je potrebno ${n.poenPoDelu} POEN.`, 409);
  }

  const danPreuzimanja = new Date(dan);
  danPreuzimanja.setHours(0, 0, 0, 0);

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

// ─── Preuzimanje i poništenje zapisa (čl. 26, 27) ─────────────────────────────

/**
 * Preuzimanje dela i poništenje zapisa PO ISKORIŠĆENJU (čl. 26 i 27).
 *
 * 🔴 POEN se gasi TEK OVDE, ne pri potvrdi. Do preuzimanja je rezervisan, ali
 * postoji — čovek koji nije došao ne sme ništa da izgubi.
 *
 * Protivzapis ide tipom `OTPIS_NABAVKA`, nikad `TRANSFER` ni `PONISTENJE_PREPISA`:
 * ovde se poništava EMISIJA, pa Protokolov minus opada i sa njim ukupan opticaj.
 * Kod prepisa se POEN samo seli između dva korisnička zapisa i opticaj se ne miče.
 *
 * 🔴 Zapis NE SME u minus (čl. 28). Poništava se tačno onoliko koliko je rezervisano,
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
      "Zapis korisnika više ne pokriva rezervisani iznos — poništenje po iskorišćenju ne sme da napravi negativan zapis (čl. 28).",
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
      // Pouka o pravu i roku je obavezan deo obaveštenja (nabavke čl. 30a st. 7):
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

// ─── Plaćanje i zatvaranje (čl. 25, 29, 32) ───────────────────────────────────

/**
 * Beleži plaćanje dobavljaču i otvara period preuzimanja (čl. 25).
 *
 * 🔴 Plaća se TEK sada, kad je poznato koliko je delova potvrđeno. Ako je potvrđeno
 * manje od broja delova iz kalkulacije, kupuje se manje jedinica i plaća srazmerno
 * manje — veličina dela se ne menja (st. 2).
 *
 * Odliv ide u `ProjekatTrosak`, ne u `FondacijaTrosak`: prag za gašenje zaštitnog
 * veta je tri OPERATIVNA troška prethodnog meseca, pa bi nabavka upisana kao
 * operativa podigla taj prag i veto bi se najteže gasio baš kad Fondacija radi.
 */
export async function zabeleziPlacanje(nabavkaId: string, iznosRSD: number, kreiraoId: string) {
  const n = await prisma.nabavka.findUnique({
    where: { id: nabavkaId },
    select: { status: true, naziv: { select: { naziv: true } } },
  });
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (n.status !== "RED_UTVRDJEN") throw new NabavkaGreska("Plaćanje se beleži po utvrđenom redu.");
  if (!(iznosRSD > 0)) throw new NabavkaGreska("Iznos plaćanja mora biti veći od nule.");

  const danas = new Date();
  danas.setHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
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
      data: { status: "PLACENA", placenoAt: new Date(), placenoRSD: iznosRSD },
    });
  });
}

/** Zatvara nabavku i briše predloge izabranog naziva (čl. 32 st. 1). */
export async function zavrsiNabavku(nabavkaId: string) {
  const n = await prisma.nabavka.findUnique({ where: { id: nabavkaId }, select: { status: true, nazivId: true } });
  if (!n) throw new NabavkaGreska("Nabavka nije pronađena.", 404);
  if (n.status === "ZAVRSENA") return 0;
  if (n.status !== "PLACENA") throw new NabavkaGreska("Nabavka se zatvara po isteku perioda preuzimanja.");

  await prisma.nabavka.update({
    where: { id: nabavkaId },
    data: { status: "ZAVRSENA", zavrsenoAt: new Date() },
  });
  return brisiPredlogeNaziva(n.nazivId);
}

/**
 * Obustava nabavke. Sve rezervacije se oslobađaju — POEN se ne gasi (čl. 27 st. 3:
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
    await tx.nabavka.update({
      where: { id: nabavkaId },
      data: { status: "OBUSTAVLJENA", obustavljenoAt: new Date(), obustavaRazlog: r },
    });
  });
}

// ─── Rezervisan POEN u Novčaniku ──────────────────────────────────────────────

/**
 * Koliko je korisniku rezervisano za nabavku. Nula kad rezervacije nema — Novčanik
 * red prikazuje samo kad postoji, po odluci vlasnika.
 */
export async function rezervisanoZaNabavku(userId: string): Promise<number> {
  const r = await prisma.nabavkaPrijava.aggregate({
    where: { userId, status: "POTVRDIO" },
    _sum: { rezervisano: true },
  });
  return r._sum.rezervisano ?? 0;
}

// ─── Noćni posao (čl. 21, 23, 24, 29) ─────────────────────────────────────────

export interface IzvestajObrade {
  prijaveZatvorene: number;
  pozivaIsteklo: number;
  nijePreuzeto: number;
  novihPoziva: number;
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

  // 2) Istekli pozivi → mesto se oslobađa (čl. 24 st. 1).
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

  // 3) Potvrđeni koji nisu došli svog dana (čl. 24 st. 1).
  const potvrdjeni = await prisma.nabavkaPrijava.findMany({
    where: { status: "POTVRDIO", danPreuzimanja: { not: null } },
    select: { id: true, nabavkaId: true, danPreuzimanja: true },
  });
  for (const p of potvrdjeni) {
    if (!p.danPreuzimanja) continue;
    const kraj = new Date(p.danPreuzimanja);
    kraj.setDate(kraj.getDate() + 1);
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

  // 5) Istekao period preuzimanja → nabavka se zatvara (čl. 29, 32).
  const zaZavrsetak = await prisma.nabavka.findMany({
    where: { status: "PLACENA", preuzimanjeDo: { lte: sada } },
    select: { id: true },
  });
  for (const n of zaZavrsetak) {
    try {
      await zavrsiNabavku(n.id);
      izv.zavrsenih += 1;
    } catch (e) {
      console.error("[nabavka] zatvaranje nabavke nije uspelo", n.id, e);
    }
  }

  // 6) Predlozi stariji od dvanaest meseci (čl. 32 st. 1).
  izv.istekliPredlozi = await brisiIstekle(sada);

  return izv;
}

// ─── Izborno glasanje (Gornje Kolo čl. 8 st. 4) ───────────────────────────────

/**
 * Utvrđuje izabran naziv iz zatvorenog izbornog glasanja i otvara nabavku.
 *
 * Zbir glasačke moći se čita iz `GlasanjeGlas.glasackaGlasova` — moći zapamćene u
 * trenutku davanja glasa (Gornje Kolo čl. 6), pa kašnjenje zatvaranja ne može da
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
