/**
 * Doprinos sadržaju platforme — osmi kanal evidentiranja POEN-a.
 * Osnov: Pravilnik o KOLO sistemu 4.1.1 čl. 15 tačka 8 i čl. 40a.
 *
 * Suština kanala je u tome što BELEŽENJE i EVIDENTIRANJE nisu isti trenutak:
 *
 *   objavljen oglas  →  ZABELEZEN — oglas je odmah na Pijaci, ali doprinos nije
 *                       zapis POEN-a: ne ulazi ni u jedno stanje, ni u opticaj,
 *                       ni u agregate
 *   pa ODOBRENJE FONDACIJE (čl. 40a)  →  EVIDENTIRAN
 *
 * 🔴 Od seta 4.6.4 odobrenje važi za SVAKI prvi oglas — i potvrđenog i
 * nepotvrđenog člana. Ranije se verifikovanom doprinos evidentirao odmah pri
 * objavi, a čekanje je važilo samo za nalog bez potvrde.
 *
 * Razlog za proširenje: odobren oglas od tog seta otključava i POEN po potvrdi
 * (1.000 verifikatoru i 1.000 verifikovanom, dokaz stvarnosti čl. 7), pa jedan
 * klik upisuje najmanje 3.000 POEN-a. Takav upis ne sme da nastane bez ijedne
 * ljudske odluke, a oglas koji formalno ispunjava sadržinski minimum ne mora biti
 * stvarna ponuda.
 *
 * 🔴 UKLONJENI OKIDAČI `VERIFIKACIJA` I `PRIMLJEN_POEN`. Bez toga bi odobrenje
 * bilo šupljikavo: potvrda bi evidentirala oglas koji čovek iz UO nikad nije
 * pogledao, a uz to bi nastao krug — potvrda otključava čl. 40a, a čl. 40a
 * otključava POEN po potvrdi. Enum vrednosti ostaju u bazi jer ih nose zatečeni
 * zapisi; kod ih više ne koristi.
 *
 * 🔴 Odobrenje NIJE diskreciona odluka da se nekome dâ POEN. Fondacija utvrđuje
 * da je uslov ispunjen — proverava sadržinski minimum i da je reč o stvarnoj
 * ponudi (čl. 40a). Razlika nije stilska: POEN nije naknada i niko o njemu ne
 * odlučuje (Pravilnik čl. 13, operativni čl. 27), pa se ni ovde ne sme pisati
 * ni govoriti da ga Fondacija „dodeljuje".
 *
 * Bez čekanja bi pedeset praznih naloga sa pedeset oglasa naduvalo opticaj — a
 * opticaj okida osnivački korak od 24.000 POEN-a i gasi prelazno ograničenje iz
 * čl. 22 Pravilnika o dokazu stvarnosti.
 *
 * Obrazac poziva (obavezan):
 *   - DB promene u jednoj `prisma.$transaction()`
 *   - `probajEvidentirati()` SEKVENCIJALNO POSLE nje — `emitujPoen()` otvara
 *     sopstvenu transakciju i ne sme da se pozove unutar druge.
 */
import { prisma } from "@/lib/prisma";
import { emitujPoen } from "./emisija";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { DoprinosOkidac, DoprinosStatus, TransactionType } from "@/generated/prisma/client";
import { IZNOS, oglasIspunjavaMinimum, type OglasMinimum } from "@/lib/doprinos-pravila";
import { probajEvidentiratiPotvrde } from "./potvrda-poen";

// Čista pravila (iznos, sadržinski minimum, ko sme da objavi/pošalje) žive u
// `@/lib/doprinos-pravila` — bez Prisme, da ih forma oglasa može uvesti u
// pretraživaču. Ovde se re-eksportuju da server ima jedan ulaz u kanal.
export * from "@/lib/doprinos-pravila";

// ─── Servisne funkcije ───────────────────────────────────────────────────────

/**
 * Beleži doprinos povodom oglasa. Zove se pri OBJAVI i pri IZMENI oglasa:
 * potvrđenom članu se sadržinski minimum pri objavi ne proverava, pa oglas ispod
 * minimuma prolazi bez doprinosa — a dopuna izmenom ga tada vraća u red čekanja.
 * Isto važi posle odbijanja, gde obaveštenje korisniku to izričito i obećava.
 *
 * Idempotentno: jednokratnost kanala po čoveku obezbeđuje jedinstveni indeks nad
 * `userId`, ne kod — ni dve paralelne objave, ni izmena oglasa čiji je doprinos
 * već zabeležen ili evidentiran, ne mogu da zabeleže drugi doprinos.
 *
 * VERIFIKOVANOM korisniku doprinos se odmah i evidentira (čl. 40a st. 3): čekanje
 * postoji da prazan nalog ne naduva opticaj, a nalog čija je stvarnost potvrđena
 * nije prazan nalog. NEVERIFIKOVANOM ostaje zabeležen dok ga Fondacija ne odobri
 * (ili dok ne nastupi verifikacija odn. primljen POEN — st. 4); admin se o tome
 * obaveštava odmah, jer bez toga niko ne bi znao da red čekanja postoji.
 *
 * Ne beleži ništa ako oglas nije ponuda ili ne ispunjava sadržinski minimum.
 * Ne baca: neuspeh beleženja ne sme da obori objavu oglasa koji je već upisan.
 *
 * MORA se zvati VAN `prisma.$transaction()` — evidentiranje vodi u `emitujPoen()`,
 * koji otvara sopstvenu.
 */
export async function zabeleziDoprinos(
  userId: string,
  oglas: OglasMinimum & { id: string },
): Promise<boolean> {
  if (oglas.tip !== "PONUDA") return false;
  if (!oglasIspunjavaMinimum(oglas).ok) return false;

  // 🔴 Modul Deca, čl. 14 st. 1: kanali doprinosa sadržaju i doprinosa razmeni se na
  // maloletne korisnike NE primenjuju. Bez ovoga bi prvi oglas svakog deteta emitovao
  // 1.000 POEN, pa bi dečji nalozi pomerali opticaj — a preko njega osnivački korak
  // od 24.000 POEN-a, koji se pali na svakih 100.000 POEN-a opticaja.
  //
  // Provera stoji OVDE, a ne na pozivnom mestu, da je nova ruta ne bi zaobišla.
  const jeDete = await prisma.user.findUnique({
    where: { id: userId },
    select: { maloletan: true },
  });
  if (jeDete?.maloletan) return false;

  try {
    await prisma.doprinosSadrzaju.create({
      data: { userId, oglasId: oglas.id, iznos: IZNOS },
    });
  } catch (e) {
    // P2002 = kanal je već iskorišćen (ili ga upravo koristi paralelna objava).
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002")
      return false;
    console.error("[doprinos-sadrzaju] beleženje nije uspelo", { userId, oglasId: oglas.id, e });
    return false;
  }

  await logAdminAkcija(userId, "DOPRINOS_SADRZAJU_ZABELEZEN", oglas.id, `${IZNOS} POEN`);

  // 🔴 SVAKI prvi oglas ide na odobrenje — i potvrđenog i nepotvrđenog člana
  // (set 4.6.4, čl. 40a). Do tada se verifikovanom doprinos evidentirao odmah pri
  // objavi, a čekanje je važilo samo za nalog bez potvrde.
  //
  // Razlog za proširenje: od ovog seta odobren oglas otključava i POEN po potvrdi
  // (1.000 verifikatoru i 1.000 verifikovanom, dokaz stvarnosti čl. 7), pa jedan klik
  // upisuje najmanje 3.000 POEN-a. Takav upis ne sme da nastane bez ijedne ljudske
  // odluke, a oglas koji formalno ispunjava sadržinski minimum ne mora biti stvarna
  // ponuda. Odobrenje NIJE diskreciona odluka da se nekome dâ POEN — Fondacija
  // utvrđuje da je uslov ispunjen (čl. 40a: proverava minimum i stvarnu ponudu).
  const korisnik = await prisma.user.findUnique({
    where: { id: userId },
    select: { pseudonim: true },
  });
  await najaviNaCekanju(userId, korisnik?.pseudonim ?? "", oglas.id);

  return true;
}

/**
 * Javlja adminima (UO) da prvi oglas naloga bez potvrde čeka odobrenje.
 *
 * Dva kanala, kao i za novog korisnika: zvonce svakom aktivnom adminu (bez mejla,
 * da isti događaj ne stigne dvaput) + `posaljiAdminAlert` (mejl + Telegram).
 * Bez ovoga bi red čekanja postojao a niko ne bi znao da postoji — čovek bi
 * čekao odobrenje koje niko ne gleda.
 *
 * Ne baca: objava oglasa je već upisana i ne sme da padne zbog obaveštenja.
 */
async function najaviNaCekanju(userId: string, pseudonim: string, oglasId: string): Promise<void> {
  try {
    const admini = await prisma.user.findMany({
      where: { admin: { in: ["ADMIN", "SUPERADMIN"] }, deaktiviranAt: null },
      select: { id: true },
    });
    await Promise.all(
      admini.map((a) =>
        obavesti(a.id, {
          tip: "DOPRINOS_NA_CEKANJU",
          kljuc: "notifikacije.doprinos_na_cekanju",
          parametri: { pseudonim },
          naslov: "Prvi oglas čeka odobrenje",
          tekst: `Korisnik „${pseudonim}" (bez potvrde) objavio je prvi oglas. Doprinos od ${IZNOS} POEN čeka odobrenje.`,
          link: "/admin?tab=prvi-oglasi",
          email: false,
        }),
      ),
    );
    await posaljiAdminAlert(
      "Prvi oglas čeka odobrenje",
      `Korisnik „${pseudonim}" (nalog bez potvrde) objavio je prvi oglas.\n` +
        `Doprinos od ${IZNOS} POEN čeka odobrenje u admin panelu → Prvi oglasi.\n` +
        `Oglas: /pijaca/${oglasId}`,
    );
  } catch (e) {
    console.error("[doprinos-sadrzaju] javljanje adminima nije uspelo", { userId, oglasId, e });
  }
}

/**
 * Fondacija odobrava doprinos za prvi oglas (čl. 40a st. 4) — glavni put za nalog
 * bez potvrde. Emituje 1.000 POEN i javlja korisniku.
 *
 * Idempotentno: prelaz se rezerviše uslovnim `updateMany` u `probajEvidentirati`,
 * pa dva klika ne mogu da emituju dvaput.
 */
export async function odobriDoprinos(
  doprinosId: string,
  adminId: string,
): Promise<{ ok: boolean; greska?: string }> {
  const d = await prisma.doprinosSadrzaju.findUnique({
    where: { id: doprinosId },
    select: { userId: true, status: true },
  });
  if (!d) return { ok: false, greska: "Doprinos ne postoji." };
  if (d.status !== DoprinosStatus.ZABELEZEN)
    return { ok: false, greska: "Doprinos više ne čeka odobrenje." };

  const uspeh = await probajEvidentirati(d.userId, DoprinosOkidac.ODOBRENJE, adminId);
  if (!uspeh) return { ok: false, greska: "Evidentiranje nije uspelo — pokušaj ponovo." };

  await logAdminAkcija(adminId, "DOPRINOS_SADRZAJU_ODOBREN", d.userId, `${IZNOS} POEN`);
  return { ok: true };
}

/**
 * Fondacija odbija doprinos za prvi oglas — oglas ostaje na Pijaci, samo se ne
 * evidentira doprinos. Razlog je OBAVEZAN i ide korisniku.
 *
 * 🔴 Odbijanje BRIŠE zapis, pa kanal ostaje slobodan: čovek ispravi oglas ili
 * objavi bolji i doprinos se ponovo beleži. To NIJE isto što i poništenje zbog
 * povrede Uslova (`ponistiZabelezen`), koje kanal namerno troši — tamo je oglas
 * uklonjen zbog prekršaja, ovde je samo ocenjeno da ne zaslužuje doprinos.
 * Trag ostaje u revizijskom dnevniku (razlog, korisnik, oglas).
 */
export async function odbijDoprinos(
  doprinosId: string,
  adminId: string,
  razlog: string,
): Promise<{ ok: boolean; greska?: string }> {
  const tekst = razlog.trim();
  if (!tekst) return { ok: false, greska: "Razlog je obavezan — šalje se korisniku." };

  const d = await prisma.doprinosSadrzaju.findUnique({
    where: { id: doprinosId },
    select: { userId: true, status: true, oglasId: true },
  });
  if (!d) return { ok: false, greska: "Doprinos ne postoji." };
  if (d.status !== DoprinosStatus.ZABELEZEN)
    return { ok: false, greska: "Doprinos više ne čeka odobrenje." };

  const obrisano = await prisma.doprinosSadrzaju.deleteMany({
    where: { id: doprinosId, status: DoprinosStatus.ZABELEZEN },
  });
  if (obrisano.count !== 1) return { ok: false, greska: "Doprinos više ne čeka odobrenje." };

  await logAdminAkcija(adminId, "DOPRINOS_SADRZAJU_ODBIJEN", d.userId, `${d.oglasId ?? "—"}: ${tekst}`);

  try {
    await obavesti(d.userId, {
      tip: "doprinos_odbijen",
      kljuc: "notifikacije.doprinos_odbijen",
      parametri: { razlog: tekst },
      naslov: "Doprinos za prvi oglas nije odobren",
      tekst:
        `Doprinos sadržaju platforme za tvoj oglas nije odobren. Razlog: ${tekst}\n` +
        `Oglas ostaje na Pijaci. Kad ga dopuniš ili objaviš bolji, doprinos se ponovo razmatra.`,
      link: "/pijaca",
    });
  } catch (e) {
    // Odbijanje je već upisano; neuspelo javljanje ga ne poništava.
    console.error("[doprinos-sadrzaju] obaveštenje o odbijanju nije poslato", { doprinosId, e });
  }
  return { ok: true };
}

/**
 * Poništava zabeležen doprinos kad je oglas uklonjen zbog povrede Uslova pre nego
 * što je doprinos evidentiran (čl. 40a st. 4). Već evidentiran doprinos se NE dira —
 * zapis POEN-a je nastao i ne poništava se unazad.
 *
 * Poništenje ne oslobađa kanal: `userId` ostaje zauzet, pa se doprinos ne može
 * ponovo zaraditi drugim oglasom. To je namerno — inače bi uklanjanje spornog
 * oglasa bilo besplatno.
 */
export async function ponistiZabelezen(oglasId: string, adminId?: string): Promise<boolean> {
  const rez = await prisma.doprinosSadrzaju.updateMany({
    where: { oglasId, status: DoprinosStatus.ZABELEZEN },
    data: { status: DoprinosStatus.PONISTEN, ponistenAt: new Date() },
  });
  if (rez.count === 0) return false;

  if (adminId) await logAdminAkcija(adminId, "DOPRINOS_SADRZAJU_PONISTEN", oglasId);
  return true;
}

/**
 * Javlja korisniku da mu je doprinos evidentiran i pamti da je javljeno.
 *
 * Zašto zaseban `obavestenAt`, a ne `evidentiranAt`: zapis POEN-a ne sme da čeka
 * na obaveštenje (mejl/push idu van transakcije i umeju da padnu), a obaveštenje
 * ne sme da ode dvaput. `EVIDENTIRAN` uz `obavestenAt: null` znači „duguje se
 * javljanje" — to stanje `evidentirajZateceneVerifikovane()` naknadno pokupi.
 *
 * Ne baca: doprinos je već evidentiran u trenutku poziva i ne poništava se zato
 * što obaveštenje nije prošlo.
 */
async function javiEvidentiran(userId: string, doprinosId: string, iznos: number): Promise<boolean> {
  try {
    await obavesti(userId, {
      tip: "doprinos_sadrzaju",
      kljuc: "notifikacije.doprinos_sadrzaju",
      parametri: { iznos: iznos.toLocaleString("sr-RS") },
      naslov: `Evidentiran ti je doprinos od ${iznos.toLocaleString("sr-RS")} POEN`,
      tekst:
        `Za oglas kojim nudiš dobro ili uslugu evidentiran ti je doprinos sadržaju ` +
        `platforme — ${iznos.toLocaleString("sr-RS")} POEN (Pravilnik čl. 40a).`,
      link: "/novcanik",
    });
    await prisma.doprinosSadrzaju.update({
      where: { id: doprinosId },
      data: { obavestenAt: new Date() },
    });
    return true;
  } catch (e) {
    console.error("[doprinos-sadrzaju] obaveštenje nije poslato", { userId, doprinosId, e });
    return false;
  }
}

/**
 * Pokušava da evidentira zabeležen doprinos — poziva se pri verifikaciji i pri
 * svakom primljenom POEN-u. Ako korisnik nema zabeležen doprinos, ne radi ništa.
 *
 * MORA se zvati VAN `prisma.$transaction()` — `emitujPoen()` otvara sopstvenu.
 *
 * Ne baca. Ni verifikacija ni prenos POEN-a ne smeju da puknu zbog ovog kanala;
 * oba su već upisana u trenutku poziva.
 */
export async function probajEvidentirati(
  userId: string,
  okidac: DoprinosOkidac,
  okidacKorisnikId?: string,
): Promise<boolean> {
  try {
    const zabelezen = await prisma.doprinosSadrzaju.findFirst({
      where: { userId, status: DoprinosStatus.ZABELEZEN },
      select: { id: true, iznos: true },
    });
    if (!zabelezen) return false;

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) {
      console.error("[doprinos-sadrzaju] korisnik nema novčanik", { userId });
      return false;
    }

    // Prvo REZERVIŠI prelaz (uslovan update nad statusom), pa tek onda emituj.
    // Ako dva okidača stignu istovremeno (verifikacija i prenos POEN-a u istoj
    // sekundi), samo jedan dobije count === 1 — doprinos se evidentira tačno jednom.
    const rezervisano = await prisma.doprinosSadrzaju.updateMany({
      where: { id: zabelezen.id, status: DoprinosStatus.ZABELEZEN },
      data: {
        status: DoprinosStatus.EVIDENTIRAN,
        okidac,
        okidacKorisnikId: okidacKorisnikId ?? null,
        evidentiranAt: new Date(),
      },
    });
    if (rezervisano.count !== 1) return false;

    let transakcijaId: string;
    try {
      const { transaction } = await emitujPoen(
        wallet.id,
        zabelezen.iznos,
        TransactionType.EMISIJA_SADRZAJ,
        // Opis imenuje konkretnu aktivnost, ne kanal: danas je jedina aktivnost
        // ovog kanala prvi oglas (čl. 40a). Nova aktivnost dobija svoj ključ.
        "Prvi oglas",
        { kljuc: "transakcije.prvi_oglas" },
      );
      transakcijaId = transaction.id;
    } catch (e) {
      // Emisija pukla — vrati doprinos u ZABELEZEN da ga sledeći okidač pokupi.
      // Bez ovoga bi zapis stajao kao evidentiran, a POEN-a ne bi bilo.
      await prisma.doprinosSadrzaju.updateMany({
        where: { id: zabelezen.id, status: DoprinosStatus.EVIDENTIRAN },
        data: {
          status: DoprinosStatus.ZABELEZEN,
          okidac: null,
          okidacKorisnikId: null,
          evidentiranAt: null,
        },
      });
      console.error("[doprinos-sadrzaju] emisija pukla, doprinos vraćen u ZABELEZEN", { userId, e });
      return false;
    }

    await prisma.doprinosSadrzaju.update({
      where: { id: zabelezen.id },
      data: { transakcijaId },
    });

    await logAdminAkcija(
      okidacKorisnikId ?? userId,
      "DOPRINOS_SADRZAJU_EVIDENTIRAN",
      userId,
      `${zabelezen.iznos} POEN, okidač ${okidac}`,
    );

    // Čovek mora da sazna da mu je POEN evidentiran — inače mu se stanje promeni
    // bez ijednog traga u zvoncetu. Ide POSLE emisije, jer se javlja o svršenom činu.
    await javiEvidentiran(userId, zabelezen.id, zabelezen.iznos);

    // Odobren prvi oglas je jedan od četiri traga učešća koji otključavaju POEN po
    // potvrdi (dokaz stvarnosti čl. 7). Ne baca — doprinos je već evidentiran.
    await probajEvidentiratiPotvrde(userId);
    return true;
  } catch (e) {
    console.error("[doprinos-sadrzaju] evidentiranje nije uspelo", { userId, okidac, e });
    return false;
  }
}

/** Zabeležen doprinos koji korisnik vidi u svom novčaniku (čl. 67). */
export async function dohvatiZabelezen(userId: string): Promise<number> {
  const d = await prisma.doprinosSadrzaju.findFirst({
    where: { userId, status: DoprinosStatus.ZABELEZEN },
    select: { iznos: true },
  });
  return d?.iznos ?? 0;
}

export type RevizijaStavka = { userId: string; pseudonim: string; oglasId?: string };

export type RevizijaDoprinosa = {
  /** Korisnika sa bar jednim oglasom koji ispunjava uslove kanala (čl. 40a st. 2). */
  kvalifikovanih: number;
  /** Od toga: koliko ih ima zapis o doprinosu, u bilo kom statusu. */
  saZapisom: number;
  /** 🔴 Kvalifikovan oglas, a zapisa NEMA — zapis se izgubio. */
  nedostaju: RevizijaStavka[];
  /**
   * Ima objavljenu ponudu, ali nijedna ne ispunjava sadržinski minimum — pa mu
   * doprinos nikada nije ni zabeležen. Nije kvar: kanal traži minimum (čl. 40a
   * st. 2). Bez ove stavke takav čovek nigde ne bi bio prikazan, a upravo on je
   * onaj koji „ima oglas a nije dobio POEN".
   */
  bezMinimuma: Array<RevizijaStavka & { razlog: string }>;
  /** Zabeležen kod redovnog člana — duguje mu se evidentiranje (dugme ispod). */
  zabelezenVerifikovan: RevizijaStavka[];
  /** Zabeležen kod člana bez potvrde — čeka odobrenje u tabu „Prvi oglasi". */
  zabelezenNeverifikovan: number;
  /** POEN je upisan, ali čoveku nije javljeno. */
  evidentiranBezObavestenja: RevizijaStavka[];
  /** Evidentiran bez veze na transakciju — trag da je upis transakcije pukao. */
  evidentiranBezTransakcije: RevizijaStavka[];
  /** Poništen jer je oglas uklonjen zbog povrede Uslova (st. 4). */
  ponisten: number;
  /** Zbir POEN-a koji je kroz kanal stvarno evidentiran. */
  evidentiranoPoen: number;
};

/**
 * Revizija kanala: ko je objavio kvalifikovan oglas, a nije dobio svojih 1.000 POEN.
 *
 * ČITA, ne menja ništa — namerno odvojeno od radnji koje emituju POEN. Prvo se
 * vidi šta fali, pa se tek onda pokreće ispravka.
 *
 * Uslov „kvalifikovan oglas" se NE prepisuje u SQL nego se svaki oglas propušta
 * kroz `oglasIspunjavaMinimum` — istu funkciju po kojoj se doprinos i beleži. Da
 * je uslov napisan dvaput, revizija bi mogla da pokaže da je sve u redu upravo
 * zato što ponavlja istu grešku kao i beleženje.
 *
 * Ugašeni nalozi se preskaču: njihovi zapisi se po čl. 34 anonimizuju.
 */
export async function revidirajDoprinose(): Promise<RevizijaDoprinosa> {
  const [oglasi, zapisi] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: { tip: "PONUDA", status: { not: "UKLONJEN" }, seller: { deaktiviranAt: null } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        sellerId: true,
        title: true,
        description: true,
        category: true,
        location: true,
        images: true,
        seller: { select: { pseudonim: true } },
      },
    }),
    prisma.doprinosSadrzaju.findMany({
      where: { user: { deaktiviranAt: null } },
      select: {
        userId: true,
        status: true,
        iznos: true,
        obavestenAt: true,
        transakcijaId: true,
        user: { select: { pseudonim: true, tipKorisnika: true } },
      },
    }),
  ]);

  // Prvi kvalifikovan oglas po korisniku — „prvi oglas kojim nudi" iz čl. 40a.
  const prviKvalifikovan = new Map<string, { oglasId: string; pseudonim: string }>();
  // Ko ima ponudu, ali nijednu koja prolazi minimum — uz razlog prvog pokušaja.
  const paoNaMinimumu = new Map<string, { oglasId: string; pseudonim: string; razlog: string }>();
  for (const o of oglasi) {
    if (prviKvalifikovan.has(o.sellerId)) continue;
    const provera = oglasIspunjavaMinimum({
      tip: "PONUDA",
      title: o.title,
      description: o.description,
      category: o.category,
      location: o.location,
      images: o.images,
    });
    if (provera.ok) {
      prviKvalifikovan.set(o.sellerId, { oglasId: o.id, pseudonim: o.seller.pseudonim });
      paoNaMinimumu.delete(o.sellerId);
    } else if (!paoNaMinimumu.has(o.sellerId)) {
      paoNaMinimumu.set(o.sellerId, {
        oglasId: o.id,
        pseudonim: o.seller.pseudonim,
        razlog: provera.razlog,
      });
    }
  }

  const rez: RevizijaDoprinosa = {
    kvalifikovanih: prviKvalifikovan.size,
    saZapisom: 0,
    nedostaju: [],
    bezMinimuma: [],
    zabelezenVerifikovan: [],
    zabelezenNeverifikovan: 0,
    evidentiranBezObavestenja: [],
    evidentiranBezTransakcije: [],
    ponisten: 0,
    evidentiranoPoen: 0,
  };

  const imaZapis = new Set(zapisi.map((z) => z.userId));
  for (const [userId, o] of prviKvalifikovan) {
    if (imaZapis.has(userId)) rez.saZapisom += 1;
    else rez.nedostaju.push({ userId, pseudonim: o.pseudonim, oglasId: o.oglasId });
  }
  // Ko je pao na minimumu, a nema ni zapis: njemu doprinos nije ni pripao.
  for (const [userId, o] of paoNaMinimumu) {
    if (prviKvalifikovan.has(userId) || imaZapis.has(userId)) continue;
    rez.bezMinimuma.push({ userId, pseudonim: o.pseudonim, oglasId: o.oglasId, razlog: o.razlog });
  }

  for (const z of zapisi) {
    const stavka = { userId: z.userId, pseudonim: z.user.pseudonim };
    if (z.status === DoprinosStatus.ZABELEZEN) {
      if (z.user.tipKorisnika === "NEVERIFIKOVAN") rez.zabelezenNeverifikovan += 1;
      else rez.zabelezenVerifikovan.push(stavka);
    } else if (z.status === DoprinosStatus.EVIDENTIRAN) {
      rez.evidentiranoPoen += z.iznos;
      if (z.obavestenAt === null) rez.evidentiranBezObavestenja.push(stavka);
      if (z.transakcijaId === null) rez.evidentiranBezTransakcije.push(stavka);
    } else {
      rez.ponisten += 1;
    }
  }

  return rez;
}

/**
 * Beleži doprinos onima koji imaju kvalifikovan oglas, a nemaju nijedan zapis.
 *
 * Rupa je stvarna: `zabeleziDoprinos` se zove VAN transakcije i bez ponavljanja,
 * pa oglas objavljen u zahtevu koji pukne na pola ostaje bez doprinosa zauvek, a
 * retroaktivna migracija je pokrila samo oglase zatečene na dan uvođenja kanala.
 *
 * Uzima se PRVI kvalifikovan oglas i uvek se beleži kao ZABELEZEN — evidentiranje
 * ostaje na redovnom putu (dugme za redovne članove, odnosno odobrenje u tabu
 * „Prvi oglasi" za članove bez potvrde). Idempotentno: jedinstveni indeks nad
 * `userId` odbija drugi zapis.
 */
async function zabeleziNedostajuce(): Promise<number> {
  const revizija = await revidirajDoprinose();
  let n = 0;
  for (const s of revizija.nedostaju) {
    if (!s.oglasId) continue;
    try {
      await prisma.doprinosSadrzaju.create({
        data: { userId: s.userId, oglasId: s.oglasId, iznos: IZNOS },
      });
      await logAdminAkcija(s.userId, "DOPRINOS_SADRZAJU_ZABELEZEN", s.oglasId, `${IZNOS} POEN (naknadno)`);
      n += 1;
    } catch (e) {
      if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002")
        continue;
      console.error("[doprinos-sadrzaju] naknadno beleženje nije uspelo", { userId: s.userId, e });
    }
  }
  return n;
}

/**
 * Jednokratno evidentiranje zatečenih doprinosa verifikovanih korisnika
 * (čl. 40a, prelazni stav).
 *
 * Do izmene čl. 40a doprinos je verifikovanom korisniku samo BELEŽEN i čekao je
 * okidač — a verifikacija mu je već bila iza leđa, pa mu je ostajao samo primljen
 * POEN. Ovim se ta grupa razrešava; **neverifikovani se namerno preskaču** — njih
 * rešava odobrenje u tabu „Prvi oglasi", jedan po jedan, ne dugmetom za sve.
 *
 * Ide sekvencijalno kroz `probajEvidentirati` — svaki poziv otvara sopstvenu
 * emisiju, pa se ne sme paralelizovati ni umotati u transakciju. Idempotentno:
 * rezervacija prelaza u `probajEvidentirati` znači da ponovno pokretanje ne može
 * dvaput da evidentira isti doprinos.
 *
 * OPTICAJ SKAČE za 1.000 × broj razrešenih. Pošto se osnivački korak evidentira
 * automatski na svakih 100.000 POEN opticaja, prva noćna emisija posle ovoga može
 * da upali jedan ili više koraka. To je očekivano, nije greška.
 *
 * Uz razrešavanje, dugme NAKNADNO JAVLJA i onima kojima je doprinos već evidentiran
 * a obaveštenje nije otišlo (`EVIDENTIRAN` + `obavestenAt: null`) — to je tačno
 * stanje koje je nastalo prvim pritiskom na dugme, pre nego što je obaveštenje
 * postojalo. Ponovni pritisak je bezopasan: ništa se ne emituje dvaput i nikome
 * se ne javlja dvaput.
 */
export async function evidentirajZateceneVerifikovane(): Promise<{
  naknadnoZabelezeno: number;
  ukupnoZabelezenih: number;
  evidentirano: number;
  preskocenoNeverifikovanih: number;
  poenUOpticaj: number;
  naknadnoObavesteno: number;
}> {
  // Prvo se popuni ono što uopšte nije zabeleženo — bez toga bi razrešavanje
  // preskočilo ljude kojima zapis nikad nije ni nastao.
  const naknadnoZabelezeno = await zabeleziNedostajuce();

  const zabelezeni = await prisma.doprinosSadrzaju.findMany({
    where: { status: DoprinosStatus.ZABELEZEN },
    select: { userId: true, iznos: true, user: { select: { tipKorisnika: true } } },
  });

  let evidentirano = 0;
  let preskoceno = 0;
  let poen = 0;

  for (const d of zabelezeni) {
    if (d.user.tipKorisnika === "NEVERIFIKOVAN") {
      preskoceno += 1;
      continue;
    }
    const uspeh = await probajEvidentirati(d.userId, DoprinosOkidac.OBJAVA);
    if (uspeh) {
      evidentirano += 1;
      poen += d.iznos;
    }
  }

  // Zaostala obaveštenja. Upit ide POSLE petlje, pa hvata i one koje je ona upravo
  // evidentirala a kojima javljanje nije prošlo (mejl/push umeju da padnu).
  const neobavesteni = await prisma.doprinosSadrzaju.findMany({
    where: { status: DoprinosStatus.EVIDENTIRAN, obavestenAt: null },
    select: { id: true, userId: true, iznos: true },
  });
  let naknadnoObavesteno = 0;
  for (const d of neobavesteni) {
    if (await javiEvidentiran(d.userId, d.id, d.iznos)) naknadnoObavesteno += 1;
  }

  return {
    naknadnoZabelezeno,
    ukupnoZabelezenih: zabelezeni.length,
    evidentirano,
    preskocenoNeverifikovanih: preskoceno,
    poenUOpticaj: poen,
    naknadnoObavesteno,
  };
}
