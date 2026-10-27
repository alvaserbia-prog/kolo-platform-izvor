/**
 * Prevođenje zatečenog punoletnog naloga u nalog maloletnog korisnika, uz
 * određivanje roditelja — administrativna ispravka koju sprovodi Fondacija.
 *
 * ─── Zašto postoji ──────────────────────────────────────────────────────────
 *
 * `maloletan` se inače upisuje na tačno dva mesta, oba pri stvaranju naloga:
 * kad roditelj otvori nalog iz svog profila (`deca.ts`) i kad se dete registruje
 * samo (`deca-poziv.ts`). Dete koje promaši dečji ulaz i prođe kroz punoletni
 * obrazac zato ostaje odrastao nalog zauvek: preuzimanje ga odbija
 * (`poveziRoditelja` traži `maloletan: true`), pa se ni roditelj ne može upisati.
 *
 * Posledice tog promašaja nisu simetrične — nalog gubi zaštite a dobija
 * ovlašćenja: profil mu je otvoren svakom potvrđenom članu (`smeDaVidiProfilDeteta`
 * gleda `maloletan`), izlazi u pretrazi korisnika, i može ući u lanac potvrda,
 * koji je maloletnom korisniku zabranjen (čl. 29 st. 2 Pravilnika o učešću dece). Jedini
 * lek do sada bio je da se nalog ugasi i otvori ponovo.
 *
 * ─── Šta ovo radi, i zašto baš to ───────────────────────────────────────────
 *
 * Prevođenje je SMER SUPROTAN od punoletstva (`punoletstvo.ts`), pa mora da uradi
 * ono što bi punoletstvo poništilo:
 *
 *  1. **Nalog izlazi iz lanca potvrda** — padaju sve potvrde koje dodiruje, u oba
 *     smera, sa vraćanjem POEN-a Protokolu i preračunom tuđih indeksa i zona
 *     (`oboriVerifikacijeNaloga`). 🔴 Ovo NIJE utvrđenje lažne potvrde: niko nije
 *     slagao, nego je pogrešno upisan uzrast. Zato ne ide kroz Glavu IX dokaza
 *     stvarnosti i nema postupka pred UO — ali poništenje POEN-a jeste puno, i na
 *     tuđoj strani (vidi ispod).
 *  2. **Poništava se sve što je Protokol upisao nalogu** — vidi odeljak ispod.
 *  3. **ZRNO se otpisuje** — maloletni korisnik ga ne drži i ne glasa (Pravilnik čl. 52 st. 2;
 *     deca čl. 29 st. 1). ZRNA se vraćaju u raspoloživa u Protokolu, kao pri prestanku
 *     statusa (Pravilnik čl. 33 st. 1).
 *  4. **Zabeleženi doprinosi se brišu** — kanali iz Pravilnika čl. 38 i ukinutog čl. 40b se na maloletne
 *     korisnike ne primenjuju (deca čl. 33 st. 1). `probajEvidentirati` NEMA proveru
 *     uzrasta (nju nosi beleženje), pa bi zabeležen red bez ovoga kasnije emitovao
 *     1.000 POEN detetu — na prvi primljen POEN.
 *  5. **Programi se gase** — prijave na programe podrške i na operativni doprinos
 *     prestaju (deca čl. 16 st. 1). Uneti podaci programa se brišu i postupak potvrda
 *     se zatvara (Politika čl. 27 st. 10). Bez ovoga bi prijava stajala ACTIVE do
 *     noćne revizije i dotle isplaćivala.
 *  6. **Veza sa roditeljem i poziv za drugog roditelja** — nalog je „dete sa
 *     roditeljem" (deca čl. 15 st. 1); roditelj izjavu daje po prijemu odluke, bez roka.
 *  7. **Gazdinstvo** (deca čl. 16 st. 4) — nalog prestaje da bude član gazdinstva;
 *     zabeležen doprinos gazdinstva se poništava, a evidentiran otpisuje „po stavu
 *     2". Vidi odeljak ispod.
 *
 * 🔴 **Doprinos gazdinstva se NE otpisuje dvaput.** Evidentiran doprinos
 * gazdinstva je emisija Protokola (`EMISIJA_GAZDINSTVO`), pa je već u neto emisiji
 * iz koraka 2 — „otpisuje se po stavu 2" znači upravo to. Zato ovde nema zasebnog
 * `OTPIS_GAZDINSTVO`: red doprinosa se samo zatvara (`otpisanAt`, `aktivanKljuc =
 * null`) u ISTOJ transakciji sa protivzapisom `OTPIS_PREVOD_U_MALOLETNI`, na koji
 * pokazuje `otpisTransakcijaId`. Zatvaranje ide PRE istupanja: istupanje
 * poslednjeg člana pokreće prestanak gazdinstva (gazd. čl. 22–23), koji bi inače
 * otpisao isti doprinos još jednom. Istupanje ide kroz `istupi()` iz
 * `gazdinstvo.ts`, pa upit sledećem članu (gazd. čl. 13) i prestanak (čl. 22)
 * ostaju tamo gde jesu.
 *
 * 🔴 **Poništava se SVE što je Protokol upisao tom nalogu** — potvrde, doprinos
 * sadržaju i razmeni, donacije, programi, pokroviteljstvo, osnivački. To su
 * kanali iz čl. 19 Pravilnika o KOLO sistemu, a maloletni korisnik ih ne koristi
 * (Pravilnik o učešću dece čl. 33 st. 1, čl. 29): POEN je upisan pod pretpostavkom
 * da je nalog punoletan, i ta pretpostavka pada zajedno sa uzrastom.
 *
 * 🔴 **POEN koji su mu ljudi PREPISALI ostaje.** Prepis nije emisija — ničim ne
 * menja ukupan broj POEN-a nego seli zapis sa čoveka na čoveka (Pravilnik čl. 17, 20), i
 * dete ga sme imati (roditelj mu prepisuje bezuslovno, deca čl. 30 st. 1). Zato se poništava
 * NETO emisija: sve što je stiglo od Protokola, umanjeno za sve što je Protokolu
 * vraćeno (upis ZRNA, raniji otpisi). Ko je taj POEN već potrošio, tome zapis ide
 * u MINUS — inače bi onaj ko brže potroši prošao jeftinije od onoga ko sačuva, što
 * je isto pravilo koje već važi za otpis prijateljstva (deca čl. 34) i za poništen
 * prepis po prijavi razmene. Minus JESTE nadoknada (dokaz stvarnosti čl. 36): nije dug, ne
 * naplaćuje se, POEN-i koji pristignu prvo ga popunjavaju.
 *
 * 🔴 **Isto važi i za DRUGE ljude** kojima je POEN upisan povodom palih potvrda —
 * i njima se skida pun iznos, pa i oni mogu u minus (`dozvoliMinus`). Odluka
 * vlasnika 2026-08-23. Posledicu treba znati: čovek koji je uredno potvrdio
 * poznanika može završiti sa negativnim zapisom zbog tuđe omaške u uzrastu, pa
 * mu ide protivzapis u istoriju i obaveštenje — minus se ne sme pojaviti bez reči.
 *
 * 🟡 Vraćanje naloga na dan registracije (`reset-korisnika.ts`) i dalje staje na
 * nuli: tamo je reč o probi korisničkog puta, ne o poništenju emisije.
 *
 * Otpis pri punoletstvu (deca čl. 35 st. 2) meri se po `Prijateljstvo.poenEvidentiran`, a
 * ovaj nalog nijedno prijateljstvo nema — pa mu se na 18. rođendan neće poništiti
 * ništa što ovde nije nastalo.
 *
 * 🔴 **Oglasi, poruke i istorija OSTAJU.** Dete sme da ima oglase i razgovore.
 * Posledica koju treba znati: postojeći razgovori sa punoletnim licima od sada
 * potpadaju pod deca čl. 19 — roditelj ih čita, a sagovorniku se prikazuje natpis o
 * tome. Sagovornik to nije mogao da zna dok je pisao.
 *
 * ─── Ograničenja ────────────────────────────────────────────────────────────
 *
 * Samo SUPERADMIN (ruta `POST /api/admin/korisnici/[id]/u-dete`). Roditelj se bira
 * iz pretrage, ne kuca — tačno poklapanje po pseudonimu nije nalazilo nalog čije je
 * ime u međuvremenu promenjeno.
 * Radnja je nepovratna: povratak u punoletni nalog vodi isključivo `punoletstvo.ts`,
 * na dan punoletstva.
 */
import { prisma } from "@/lib/prisma";
import { obrisiPreporuke } from "./preporuka";
import {
  ClanGazdinstvaStatus,
  DoprinosStatus,
  EnrollmentStatus,
  OglasPrijavaStatus,
  Prisma,
  TransactionType,
  UserStatus,
} from "@/generated/prisma/client";
import { KLJUC_ZAHTEV_POTVRDA } from "./program-potvrda";
import { obavesti } from "@/lib/notifikacije";
import { oboriVerifikacijeNaloga } from "@/lib/protokol/verifikacije-naloga";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";
import { poljaPozivaZaRoditeljskiUlaz } from "@/lib/protokol/deca-poziv";
import { preracunajStatusNaloga } from "@/lib/protokol/status";
import { istupi } from "@/lib/protokol/gazdinstvo";
import {
  type Provera,
  uzrast,
  uzrastZaModul,
} from "@/lib/deca-pravila";

export class PrevodGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.name = "PrevodGreska";
    this.status = status;
  }
}

/** Nalog koji se prevodi, sveden na ono što odluka traži. */
export type NalogZaPrevod = {
  maloletan: boolean;
  admin: string;
  jeOsnivac: boolean;
  deaktiviran: boolean;
  /** Ima li nalog svoje dete — maloletni korisnik ne može biti roditelj. */
  imaDecu: boolean;
  /**
   * Ima li nalog već upisanog roditelja.
   *
   * 🔴 Provera stoji zbog REDOSLEDA: koraci 1–5 (pad potvrda, poništenje emisije,
   * otpis ZRNA) su upisani pre nego što se stvori veza sa roditeljem, pa bi sudar na
   * `@@unique([deteId, roditeljId])` ostavio nalog obran a nepovezan. Punoletan
   * nalog roditelja ne bi trebalo da ima — `punoletstvo.ts` te redove briše pri
   * prelasku — ali cena greške je takva da se ne oslanja na „ne bi trebalo".
   */
  imaRoditelja: boolean;
  /** Vlasnik pokrovitelja (pravno lice / preduzetnik) — donacije čl. 16 st. 1 traži punoletnog. */
  vlasnikPokrovitelja: boolean;
};

/** Nalog izabran za roditelja. */
export type RoditeljZaPrevod = {
  id: string;
  maloletan: boolean;
  aktivan: boolean;
};

/**
 * ČISTA provera — bez baze, da se ista pravila mogu testirati i pročitati na
 * jednom mestu. Uzrast se prosleđuje već izračunat.
 */
export function proveriPrevodUMaloletni(
  nalog: NalogZaPrevod,
  roditelj: RoditeljZaPrevod,
  deteId: string,
  godine: number,
): Provera {
  if (nalog.deaktiviran) return { ok: false, razlog: "Nalog je ugašen.", status: 400 };
  if (nalog.maloletan) return { ok: false, razlog: "Nalog je već maloletan.", status: 400 };
  if (nalog.admin !== "NONE") {
    return {
      ok: false,
      razlog: "Nalog ima admin ovlašćenje. Prvo mu skini admin rolu.",
      status: 400,
    };
  }
  // Početni korisnik je ishodište lanca potvrda (dokaz stvarnosti čl. 29) — indeks
  // mu je fiksno 100% i ne može biti verifikovan. Maloletni nalog je suprotnost
  // toga u svakoj tački, pa se ta dva svojstva ne mogu naći na istom nalogu.
  if (nalog.jeOsnivac) {
    return { ok: false, razlog: "Nalog početnog korisnika (osnivača) se ne prevodi.", status: 400 };
  }
  if (nalog.imaDecu) {
    return {
      ok: false,
      razlog: "Nalog je upisan kao roditelj — maloletni korisnik ne može biti roditelj.",
      status: 400,
    };
  }
  if (nalog.vlasnikPokrovitelja) {
    return { ok: false, razlog: "Nalog je vlasnik pokrovitelja.", status: 400 };
  }
  if (nalog.imaRoditelja) {
    return { ok: false, razlog: "Nalog već ima upisanog roditelja.", status: 400 };
  }

  if (roditelj.id === deteId) {
    return { ok: false, razlog: "Nalog ne može biti sam sebi roditelj.", status: 400 };
  }
  if (roditelj.maloletan) {
    return { ok: false, razlog: "Dete ne može biti roditelj.", status: 403 };
  }
  if (!roditelj.aktivan) return { ok: false, razlog: "Nalog roditelja nije aktivan.", status: 403 };

  // 🔴 Indeks stvarnosti roditelja se NAMERNO ne traži. Otvaranje naloga iz
  // roditeljskog profila ga traži (deca čl. 7) jer tamo roditelj svojom potvrđenošću
  // stoji iza novog naloga; ovde nalog već postoji i samo dobija roditelja — isto
  // što radi preuzimanje kod deteta koje se registrovalo samo, koje indeks takođe
  // ne traži. Ako roditelj nije redovan član, dete prosto stoji u stanju
  // `POVEZANO` i POEN mu se ne upisuje, dok se roditelj ne potvrdi.

  return uzrastZaModul(godine);
}

const PROTOKOL_WALLET_ID = "banka-singleton";

/**
 * Koliko je Protokol NETO upisao ovom nalogu: sve što je stiglo od Protokola,
 * umanjeno za sve što mu je vraćeno.
 *
 * 🔴 Meri se iz ISTORIJE, ne iz stanja. Stanje ne razlikuje POEN koji je nastao
 * emisijom od POEN-a koji je čovek dobio prepisom, a upravo ta razlika odlučuje
 * šta se poništava (Pravilnik čl. 19 — kanali) a šta ostaje (čl. 17, 20 — prepis).
 *
 * Oduzimanje vraćenog je bitno u oba smera: ko je POEN dao Protokolu (upis ZRNA)
 * više ga nema, pa mu se ne sme skinuti dvaput; a ranije otpise (raskid, poništenje)
 * ne treba ponavljati. Ko je POEN prepisao DRUGOM ČOVEKU, taj u zbir ne ulazi — i
 * baš zato takav nalog ovde ide u minus, što je i namera pravila.
 */
async function netoEmisijaNaloga(userId: string): Promise<number> {
  const wallet = await prisma.wallet.findUnique({ where: { userId }, select: { id: true } });
  if (!wallet) return 0;

  const [primljeno, vraceno] = await Promise.all([
    prisma.transaction.aggregate({
      where: { fromWalletId: PROTOKOL_WALLET_ID, toWalletId: wallet.id },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { fromWalletId: wallet.id, toWalletId: PROTOKOL_WALLET_ID },
      _sum: { amount: true },
    }),
  ]);

  return (primljeno._sum.amount ?? 0) - (vraceno._sum.amount ?? 0);
}

/**
 * Poništi emisiju sa zapisa naloga, uz protivzapis Protokola, i u istoj
 * transakciji zatvori evidentiran doprinos gazdinstva (deca čl. 16 st. 4).
 *
 * 🔴 Zapis SME u minus — vidi zaglavlje. Isti obrazac kao otpis prijateljstva
 * (`prijateljstva.ts`): opticaj opada, zero-sum ostaje očuvan.
 *
 * 🔴 Evidentiran doprinos gazdinstva je već u `iznos` (neto emisija), pa se red
 * samo zatvara — bez sopstvenog `OTPIS_GAZDINSTVO`, koji bi ga skinuo dvaput. Kad
 * neto emisije nema (sve je već vraćeno Protokolu), red se zatvara bez
 * protivzapisa: po stavu 2 tada nema šta da se otpiše.
 *
 * @returns broj zatvorenih evidentiranih doprinosa gazdinstva
 */
async function otpisiEmisijuNalogu(userId: string, iznos: number): Promise<number> {
  return prisma.$transaction(async (tx) => {
    let transakcijaId: string | null = null;
    if (iznos > 0) {
      const w = await tx.wallet.findUnique({ where: { userId }, select: { id: true } });
      if (!w) throw new PrevodGreska("Nalog nema zapis u Protokolu.", 500);
      await tx.wallet.update({ where: { id: w.id }, data: { balance: { decrement: iznos } } });
      await tx.wallet.update({
        where: { id: PROTOKOL_WALLET_ID },
        data: { balance: { increment: iznos } },
      });
      const t = await tx.transaction.create({
        data: {
          fromWalletId: w.id,
          toWalletId: PROTOKOL_WALLET_ID,
          amount: iznos,
          type: TransactionType.OTPIS_PREVOD_U_MALOLETNI,
          description: "Poništenje POENA upisanih kroz kanale (nalog preveden u dečji)",
          opisKljuc: "transakcije.prevod_u_maloletni_otpis",
        },
        select: { id: true },
      });
      transakcijaId = t.id;
    }
    const gazd = await tx.doprinosGazdinstva.updateMany({
      where: { userId, status: DoprinosStatus.EVIDENTIRAN, otpisanAt: null },
      data: { otpisanAt: new Date(), aktivanKljuc: null, otpisTransakcijaId: transakcijaId },
    });
    return gazd.count;
  });
}

/**
 * Deca čl. 16 st. 4 — nalog prestaje da bude član gazdinstva. Poziv koji nije
 * prihvaćen se briše; iz svakog članstva se istupa kroz `istupi()` (gazd. čl. 13
 * st. 1), pa upit sledećem članu i prestanak gazdinstva bez članova (čl. 22)
 * idu svojim putem. Doprinos je pre toga već poništen odnosno zatvoren, pa ga
 * eventualni prestanak ne dira.
 *
 * Ne baca: prevođenje je u ovom trenutku već upisano, a neuspelo istupanje se
 * beleži i vraća u broju, da ga administrator vidi.
 */
async function istupiIzGazdinstava(userId: string): Promise<{ istupio: number; neuspelo: number }> {
  await prisma.clanGazdinstva.deleteMany({ where: { userId, status: ClanGazdinstvaStatus.POZVAN } });
  const clanstva = await prisma.clanGazdinstva.findMany({
    where: { userId, status: { in: [ClanGazdinstvaStatus.PRISTUPIO, ClanGazdinstvaStatus.ODOBREN] } },
    select: { gazdinstvoId: true },
  });
  let istupio = 0;
  let neuspelo = 0;
  for (const c of clanstva) {
    try {
      await istupi(userId, c.gazdinstvoId);
      istupio++;
    } catch (e) {
      neuspelo++;
      console.error("[prevod-u-maloletni] istupanje iz gazdinstva nije uspelo", {
        userId,
        gazdinstvoId: c.gazdinstvoId,
        e,
      });
    }
  }
  return { istupio, neuspelo };
}

export type PrevodRezultat = {
  pseudonim: string;
  roditeljPseudonim: string;
  godine: number;
  ponistenoPotvrda: number;
  /** Poništena neto emisija sa zapisa samog naloga. */
  otpisanoNalogu: number;
  poenVracenOdDrugih: number;
  /** Koliko je DRUGIH ljudi ovim otišlo u negativan zapis. */
  brojUMinusu: number;
  zrnaOtpisana: number;
  obrisanoZabelezenih: number;
  ugasenoProgramaPrijava: number;
  /** Deca čl. 16 st. 4 — poništeni zabeleženi doprinosi gazdinstva. */
  ponistenoDoprinosaGazdinstva: number;
  /** Deca čl. 16 st. 4 — evidentirani doprinosi gazdinstva zatvoreni otpisom po st. 2. */
  otpisanoDoprinosaGazdinstva: number;
  /** Gazdinstva iz kojih je nalog istupio. */
  istupioIzGazdinstava: number;
  /** Istupanja koja nisu uspela (zabeležena u logu) — traže ručnu proveru. */
  neuspelaIstupanja: number;
  /** @deprecated Postupak potvrde od 60 dana je ukinut (set 4.8.2); uvek 0. */
  brojPotvrdjivaca: number;
};

/**
 * Prevedi punoletan nalog u maloletni i upiši mu roditelja.
 *
 * @param userId nalog koji se prevodi
 * @param roditeljId nalog koji postaje roditelj
 * @param datumRodjenja upisuje se odmah (deca čl. 15 st. 1) — posle se ne menja
 */
export async function prevediUMaloletni(
  userId: string,
  roditeljId: string,
  datumRodjenja: Date,
): Promise<PrevodRezultat> {
  const [nalog, roditelj] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        pseudonim: true,
        maloletan: true,
        admin: true,
        jeOsnivac: true,
        deaktiviranAt: true,
        zrnoStanje: { select: { aktivno: true, slobodno: true } },
        osnivacZapis: { select: { id: true } },
        _count: {
          select: {
            roditeljstvaKaoRoditelj: true,
            roditeljstvaKaoDete: true,
            vlasnikPokrovitelja: true,
            upisiPokrovitelja: { where: { obrisanAt: null } },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: roditeljId },
      select: {
        id: true,
        pseudonim: true,
        email: true,
        maloletan: true,
        status: true,
        deaktiviranAt: true,
        indeksStvarnosti: true,
      },
    }),
  ]);
  if (!nalog) throw new PrevodGreska("Korisnik nije pronađen.", 404);
  if (!roditelj) throw new PrevodGreska("Nalog roditelja nije pronađen.", 404);

  const godine = uzrast(datumRodjenja, beogradskiDan());
  const provera = proveriPrevodUMaloletni(
    {
      maloletan: nalog.maloletan,
      admin: nalog.admin,
      jeOsnivac: nalog.jeOsnivac || nalog.osnivacZapis !== null,
      deaktiviran: nalog.deaktiviranAt !== null,
      imaDecu: nalog._count.roditeljstvaKaoRoditelj > 0,
      imaRoditelja: nalog._count.roditeljstvaKaoDete > 0,
      vlasnikPokrovitelja: nalog._count.vlasnikPokrovitelja > 0 || nalog._count.upisiPokrovitelja > 0,
    },
    {
      id: roditelj.id,
      maloletan: roditelj.maloletan,
      aktivan: roditelj.status === UserStatus.ACTIVE && roditelj.deaktiviranAt === null,
    },
    nalog.id,
    godine,
  );
  if (!provera.ok) throw new PrevodGreska(provera.razlog, provera.status);

  // ── 0. Zabeležen doprinos gazdinstva (deca čl. 16 st. 4) ──────────────────────
  //
  // Poništava se PRE čitanja neto emisije: inače bi okidač evidentiranja
  // (`probajEvidentiratiGazdinstvo`) mogao da ga emituje između čitanja i otpisa,
  // pa bi ta emisija ostala detetu.
  const ponistenGazd = await prisma.doprinosGazdinstva.updateMany({
    where: { userId, status: DoprinosStatus.ZABELEZEN },
    data: { status: DoprinosStatus.PONISTEN, ponistenAt: new Date(), aktivanKljuc: null },
  });

  // ── 1. Izlazak iz lanca potvrda ────────────────────────────────────────────
  //
  // Neto emisija se čita PRE svega ostalog: čim se upiše sopstveni protivzapis iz
  // koraka 2, isti zbir bi ga uračunao i drugo pokretanje ne bi bilo idempotentno.
  const netoEmisija = await netoEmisijaNaloga(userId);

  const { ponisteno, poenVracenOdDrugih, uMinusu } = await oboriVerifikacijeNaloga(userId, {
    // 🔴 Poništenje je puno na svim stranama (odluka vlasnika 2026-08-23): ko je
    // primljeni POEN već potrošio, ide u minus. Vraćanje naloga na dan registracije
    // i dalje staje na nuli — tamo je reč o probi, ne o poništenju emisije.
    dozvoliMinus: true,
    opis: `Poništenje POENA iz pale potvrde (nalog ${nalog.pseudonim} preveden u dečji)`,
    opisKljuc: "transakcije.prevod_u_maloletni_potvrda",
    opisParametri: { pseudonim: nalog.pseudonim },
  });
  await prisma.nadzorZapis.deleteMany({ where: { nadzornikId: userId } });
  await prisma.nadzorniPredmet.updateMany({
    where: { resenById: userId },
    data: { resenById: null },
  });
  await prisma.verifikacijaToken.deleteMany({ where: { korisnikId: userId } });

  // ── 2. Poništenje svega što je Protokol upisao ovom nalogu ────────────────
  // Zapis SME u minus — vidi obrazloženje u zaglavlju. Prepisi od drugih ljudi
  // nisu emisija i u zbir ne ulaze, pa ostaju detetu. Evidentiran doprinos
  // gazdinstva je deo te emisije i zatvara se u istoj transakciji (deca čl. 16 st. 4).
  const otpisanoGazd = await otpisiEmisijuNalogu(userId, Math.max(netoEmisija, 0));

  // ── 2a. Istupanje iz gazdinstva (deca čl. 16 st. 4) ─────────────────────────────
  // Posle zatvaranja doprinosa — prestanak gazdinstva bez članova ga više ne nalazi.
  const gazdIstupanje = await istupiIzGazdinstava(userId);

  // ── 3. ZRNO ────────────────────────────────────────────────────────────────
  // Otpis bez evidentiranja POEN-a: ZRNA se vraćaju u raspoloživa u Protokolu
  // (imenilac obračunskog koeficijenta), jer se raspoloživo računa kao razlika do
  // `UKUPNO_ZRNA` — brisanjem reda se vraćaju sama.
  const zrnaOtpisana = (nalog.zrnoStanje?.aktivno ?? 0) + (nalog.zrnoStanje?.slobodno ?? 0);
  await prisma.zrnoDelegacija.updateMany({ where: { delegatId: userId }, data: { delegatId: null } });
  await prisma.zrnoDelegacija.updateMany({
    where: { zakazaniDelegatId: userId },
    data: { zakazaniDelegatId: null, imaZakazano: false },
  });
  await prisma.zrnoDelegacija.deleteMany({ where: { delegatorId: userId } });
  await prisma.zrnoUpisZahtev.deleteMany({ where: { userId } });
  await prisma.zrnoOtpisZahtev.deleteMany({ where: { userId } });
  await prisma.zrnoStatusZahtev.deleteMany({ where: { userId } });
  await prisma.zrnoStanje.deleteMany({ where: { userId } });

  // ── 4. Zabeleženi doprinosi (Pravilnik čl. 38 i ukinuti čl. 40b) ────────────────────────────────
  const [sadrzaj, razmena] = await Promise.all([
    prisma.doprinosSadrzaju.deleteMany({ where: { userId, status: DoprinosStatus.ZABELEZEN } }),
    prisma.doprinosRazmeni.deleteMany({ where: { userId, status: DoprinosStatus.ZABELEZEN } }),
  ]);
  const obrisanoZabelezenih = sadrzaj.count + razmena.count;

  // ── 5. Programi i operativni doprinos ─────────────────────────────────────
  // Prevođenjem prestaju prijave na programe podrške i na operativni doprinos
  // (deca čl. 16 st. 1). 🔴 Prestanak prijave BRIŠE unete podatke programa
  // (`metadata` — zdravlje, deca; Politika čl. 27 st. 10) i zatvara postupak
  // potvrda (isto što `zatvoriPostupakPotvrda`, ovde u jednoj transakciji) — do
  // 5.0 se samo menjao status, pa su podaci ostajali posle prestanka prijave.
  const ugaseno = await prisma.$transaction(async (tx) => {
    const prijave = await tx.programEnrollment.findMany({
      where: { userId, status: { in: [EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE] } },
      select: { id: true },
    });
    const ids = prijave.map((p) => p.id);
    if (ids.length > 0) {
      await tx.programEnrollment.updateMany({
        where: { id: { in: ids } },
        data: {
          status: EnrollmentStatus.INACTIVE,
          rejectionReason: "Nalog je preveden u nalog maloletnog korisnika.",
          metadata: Prisma.DbNull,
        },
      });
      await tx.programPotvrda.deleteMany({ where: { enrollmentId: { in: ids }, status: "CEKA" } });
      for (const id of ids) {
        await tx.notifikacija.deleteMany({
          where: { kljuc: KLJUC_ZAHTEV_POTVRDA, parametri: { path: ["enrollmentId"], equals: id } },
        });
      }
    }
    // Maloletni korisnik ne potvrđuje ispunjenost uslova tuđe prijave (programi čl. 5):
    // zahtevi upućeni ovom nalogu se zatvaraju.
    await tx.programPotvrda.deleteMany({ where: { verifikatorId: userId, status: "CEKA" } });
    await tx.notifikacija.deleteMany({ where: { userId, kljuc: KLJUC_ZAHTEV_POTVRDA } });
    // Prijave na operativni doprinos prestaju (deca čl. 16 st. 1); evidentirano ostaje.
    await tx.oglasPrijava.updateMany({
      where: { userId, status: { in: [OglasPrijavaStatus.PENDING, OglasPrijavaStatus.APPROVED] } },
      data: { status: OglasPrijavaStatus.REJECTED, rejectionReason: "Nalog je preveden u nalog maloletnog korisnika." },
    });
    return { count: ids.length };
  });

  // ── 6. Nalog, roditelj i poziv za drugog roditelja ───────────────────────
  //
  // Prevedeni nalog je „dete sa roditeljem" (deca čl. 15 st. 1). Roditelj izjavu iz
  // čl. 12 st. 1 daje po prijemu odluke, sa profila deteta — 🔴 bez roka i bez
  // posledice po treća lica (set 4.8.2). Postupak potvrde od šezdeset dana je
  // ukinut: u „dete Kola" nalog prelazi kad je roditelj član Kola i kad mu član
  // Kola potvrdi postojanje deteta (čl. 5 st. 1 t. 3, čl. 13).
  const sada = new Date();

  await prisma.$transaction(async (tx) => {
    // Maloletni korisnik ne daje i ne prima preporuke (dokaz stvarnosti čl. 20 st. 1).
    await obrisiPreporuke(userId, tx);
    await tx.user.update({
      where: { id: userId },
      data: {
        maloletan: true,
        datumRodjenja,
        slotoviPotroseni: 0,
        // Prekidač iz deca čl. 20 st. 2 kreće ugašen — odnos sa punoletnim licima
        // otvara roditelj, a ne zatečeno stanje naloga.
        dozvolaOdrasli: false,
        // Punoletstvo se računa iznova iz upisanog datuma; oba stuba moraju biti
        // prazna da bi ga `punoletstvo.ts` uopšte uzeo u obzir.
        punoletstvoNajavaAt: null,
        punoletstvoObradjenAt: null,
      },
    });
    // 🔴 Status (`verified`, indeks, `potvrdjenAt`, `tipKorisnika`) se ne upisuje
    // ručno — piše ga samo `preracunajStatusNaloga` (set 4.8.2). Za maloletni nalog
    // daje NEVERIFIKOVAN, bez indeksa i bez potvrđenosti (deca čl. 29 st. 2).
    await preracunajStatusNaloga(tx, userId);

    await tx.roditeljstvo.create({
      data: { deteId: userId, roditeljId: roditelj.id },
    });

    // Kod kojim ulazi DRUGI roditelj (deca čl. 11 st. 1). Nastaje i ovde, iako poziva
    // nema — inače bi drugi roditelj mogao da uđe samo kod dece koja su se
    // registrovala sama, što je razlika bez razloga.
    await tx.roditeljPoziv.deleteMany({ where: { deteId: userId } });
    await tx.roditeljPoziv.create({
      data: { deteId: userId, ...poljaPozivaZaRoditeljskiUlaz(roditelj.email, sada) },
    });
  });

  // ── 7. Javljanja (van transakcije — pad pošte ne obara prevođenje) ─────────
  await obavesti(userId, {
    tip: "nalog_preveden_u_maloletni",
    kljuc: "notifikacije.nalog_preveden_u_maloletni",
    parametri: { roditelj: roditelj.pseudonim, iznos: netoEmisija > 0 ? netoEmisija : 0 },
    naslov: "Nalog je preveden u dečji",
    tekst:
      `Tvoj nalog sada radi po pravilima za maloletne korisnike, a kao roditelj je upisan ${roditelj.pseudonim}. ` +
      `Poništeno ti je ${netoEmisija > 0 ? netoEmisija : 0} POENA upisanih kroz kanale; POEN koji su ti drugi prepisali ostaje.`,
    link: "/novcanik",
  }).catch(() => {});

  // Onima koji su otišli u minus javlja se posebno: negativan zapis menja šta
  // čovek sme sa POEN-om (prepis drugome je moguć tek preko nule), pa se ne sme
  // pojaviti bez reči. Isti obrazac kao kod poništenog prepisa po prijavi razmene.
  //
  // Isti čovek ume da bude pogođen dvaput (i kao strana i kao nadzornik). Drugi
  // zapis je izračunat POSLE prvog skidanja, pa nosi ukupan minus — zato se
  // prepisuje, ne sabira.
  const minusPoCoveku = new Map<string, number>();
  for (const m of uMinusu) minusPoCoveku.set(m.userId, m.iznos);
  for (const [pogodjeniId, iznos] of minusPoCoveku) {
    await obavesti(pogodjeniId, {
      tip: "potvrda_pala_minus",
      kljuc: "notifikacije.potvrda_pala_minus",
      parametri: { pseudonim: nalog.pseudonim, iznos },
      naslov: "Potvrda je pala, zapis je u minusu",
      tekst: `Nalog ${nalog.pseudonim} je preveden u dečji, pa je potvrda povodom koje ti je upisan POEN pala. Tvoj zapis je sada u minusu za ${iznos} POEN — POEN-i koji pristignu prvo popunjavaju taj minus.`,
      link: "/novcanik",
    }).catch(() => {});
  }

  await obavesti(roditelj.id, {
    tip: "roditeljstvo_upisano",
    kljuc: "notifikacije.roditeljstvo_upisano_izjava",
    parametri: { pseudonim: nalog.pseudonim },
    naslov: "Roditelj si na prevedenom nalogu",
    tekst:
      `Nalog ${nalog.pseudonim} je preveden u dečji. Roditelj si na tom nalogu. ` +
      `Daj izjavu o postojanju deteta na profilu deteta.`,
    link: `/deca/${userId}`,
  }).catch(() => {});

  // Roditelju koji je član Kola ili osnivač — poziv da zatraži potvrdu postojanja.
  const { javiDaZatraziPotvrdu } = await import("./deca");
  await javiDaZatraziPotvrdu(roditelj.id).catch(() => {});

  return {
    pseudonim: nalog.pseudonim,
    roditeljPseudonim: roditelj.pseudonim,
    godine,
    ponistenoPotvrda: ponisteno,
    otpisanoNalogu: netoEmisija > 0 ? netoEmisija : 0,
    poenVracenOdDrugih,
    brojUMinusu: minusPoCoveku.size,
    zrnaOtpisana,
    obrisanoZabelezenih,
    ugasenoProgramaPrijava: ugaseno.count,
    ponistenoDoprinosaGazdinstva: ponistenGazd.count,
    otpisanoDoprinosaGazdinstva: otpisanoGazd,
    istupioIzGazdinstava: gazdIstupanje.istupio,
    neuspelaIstupanja: gazdIstupanje.neuspelo,
    brojPotvrdjivaca: 0,
  };
}
