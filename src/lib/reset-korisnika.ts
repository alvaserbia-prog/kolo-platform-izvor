/**
 * Vraćanje zatečenog naloga na stanje sa dana registracije („kao da je prvi put
 * došao na sajt") — alat za probu korisničkog puta bez pravljenja novog naloga.
 *
 * Zašto uopšte postoji: jedini način da se vidi kako platforma izgleda novom
 * čoveku bio je da se otvori nov nalog, a svaki takav nalog ostaje u bazi, ulazi
 * u brojače članova i u levak. Ovo umesto toga vraća POSTOJEĆI nalog na nulu i
 * čuva pristupne podatke (email, lozinku, pseudonim, `memberHash`), pa se čovek
 * prijavljuje istim podacima i zatiče prazan sistem.
 *
 * 🔴 Nalog se NE briše i NE anonimizuje — za to postoji `DELETE /api/profil`
 * (čl. 34, prestanak statusa). Ovde nalog ostaje živ, samo mu se skida sve što
 * je stekao. Zato ovde nema ni protivzapisa u istoriji: zapisi se brišu, a ne
 * poništavaju.
 *
 * Zero-sum ostaje očuvan (čl. 14): koliko se skine sa zapisa korisnika, toliko
 * se vrati na protivzapis Protokola. Isto važi za POEN koji su povodom njegovih
 * verifikacija dobili DRUGI ljudi — te veze padaju, pa im se i POEN vraća
 * Protokolu, indeks preračunava, a slot oslobađa (isti postupak kao pri
 * prestanku statusa).
 *
 * 🔴 Radnja je nepovratna i pogađa i druge naloge (verifikacije, razgovore,
 * oglase). Zato je ograničena na superadmina i traži da se pseudonim otkuca —
 * vidi rutu `POST /api/admin/korisnici/[id]/reset`.
 */
import { prisma } from "@/lib/prisma";
import { istupiPriGasenjuNaloga } from "@/lib/protokol/gazdinstvo";
import {
  ListingStatus,
  PredlogStatus,
  TipKorisnika,
  UserStatus,
} from "@/generated/prisma/client";
import { oboriVerifikacijeNaloga } from "@/lib/protokol/verifikacije-naloga";
import { preracunajStatusNaloga, posledicePromeneStatusa, type PromenaStatusa } from "@/lib/protokol/status";
import { obrisiSaR2 } from "@/lib/skladiste";

const PROTOKOL_WALLET_ID = "banka-singleton";

export class ResetGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.name = "ResetGreska";
    this.status = status;
  }
}

export type ResetRezultat = {
  pseudonim: string;
  /** POEN skinut sa zapisa korisnika i vraćen na protivzapis Protokola. */
  poenVracenProtokolu: number;
  /** POEN skinut drugim korisnicima zbog pada verifikacija ovog naloga. */
  poenVracenOdDrugih: number;
  zrnaOtpisana: number;
  ponistenoVerifikacija: number;
  obrisanoOglasa: number;
  /** Zbir svih obrisanih redova (razgovori, notifikacije, prijave…). */
  obrisanoZapisa: number;
};

/**
 * Vrati nalog na stanje sa dana registracije.
 *
 * @param userId interni ID naloga (ne pseudonim — pseudonim se menja)
 * @throws ResetGreska kad nalog ne sme da se resetuje (admin, osnivač, pokrovitelj…)
 */
export async function resetujNalogNaPrviDan(userId: string): Promise<ResetRezultat> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      zrnoStanje: true,
      osnivacZapis: true,
      podaci: true,
    },
  });
  if (!user) throw new ResetGreska("Korisnik nije pronađen.", 404);

  // ── Brane ──────────────────────────────────────────────────────────────────
  // Nalozi koji nose sistemsku ulogu se ne diraju: resetovanje bi im oduzelo
  // ovlašćenja i pokidalo lanac potvrda (superadmin je koren lanca).
  if (user.admin !== "NONE") {
    throw new ResetGreska("Nalog sa admin ovlašćenjem se ne resetuje. Prvo mu skini admin rolu.", 400);
  }
  if (user.jeOsnivac || user.osnivacZapis) {
    throw new ResetGreska("Nalog početnog člana (osnivača) se ne resetuje.", 400);
  }
  if (user.deaktiviranAt) {
    throw new ResetGreska("Nalog je ugašen — reset ne oživljava obrisan nalog.", 409);
  }

  // Reset obara sve potvrde stvarnosti naloga. Kod roditelja bi to njegovo dete
  // vratilo iz stanja `AKTIVNO` u `POVEZANO` (Modul Deca, čl. 4c) — prestao bi upis
  // POEN-a po prijateljstvima — a postupak potvrde iz čl. 6 ostao bi da visi nad
  // potvrđivačima koji sa detetom nemaju veze. Nalog deteta se briše preko
  // roditeljskog ekrana, ne ovim alatom.
  const brojDece = await prisma.roditeljstvo.count({
    where: { roditeljId: userId, dete: { deaktiviranAt: null } },
  });
  if (brojDece > 0) {
    throw new ResetGreska(
      "Nalog ima povezano dete — reset bi mu oborio potvrde i zaustavio upis POENA na detetovom nalogu.",
      400,
    );
  }
  if (user.maloletan) {
    throw new ResetGreska(
      "Nalog deteta se ne resetuje — briše ga roditelj sa svog profila.",
      400,
    );
  }

  const brojPokrovitelja =
    (await prisma.pokrovitelj.count({ where: { vlasnikId: userId } })) +
    (await prisma.upisPokrovitelja.count({ where: { vlasnikUserId: userId } }));
  if (brojPokrovitelja > 0) {
    throw new ResetGreska("Nalog je vlasnik pokrovitelja — reset bi pokidao evidenciju pokroviteljstva.", 400);
  }

  // Registar odluka Gornjeg Kola je nepromenljiv (Pravilnik o Gornjem Kolu čl. 21),
  // pa se zatvoren predlog ne briše ni zbog reseta test naloga.
  const zatvoreniPredlozi = await prisma.glasanjePredlog.count({
    where: { authorId: userId, status: PredlogStatus.CLOSED },
  });
  if (zatvoreniPredlozi > 0) {
    throw new ResetGreska(
      "Nalog je autor predloga koji je već u registru odluka — registar je nepromenljiv, pa se ovaj nalog ne resetuje.",
      400,
    );
  }

  let obrisanoZapisa = 0;
  const prebroj = (r: { count: number }) => {
    obrisanoZapisa += r.count;
    return r.count;
  };

  // ── 1. Graf verifikacija ───────────────────────────────────────────────────
  // Nalog izlazi iz lanca potvrda sa svim posledicama po druge ljude — vidi
  // `verifikacije-naloga.ts` (isti postupak koristi i prevođenje u maloletni).
  const { ponisteno: ponistenoVerifikacija, poenVracenOdDrugih } =
    await oboriVerifikacijeNaloga(userId);

  // Potvrde člana bez potvrde (dokaz stvarnosti čl. 5a st. 3–5, set 4.8.2) koje je
  // ovaj nalog DAO drugima: padaju zajedno sa njegovim verifikacijama, pa se
  // potvrđenima status preračunava (keš piše samo `preracunajStatusNaloga`).
  // Primljene padaju kaskadno sa vezama iznad, ali se brišu i ovde, za svaki slučaj.
  const pogodjeniPotvrdom = await prisma.potvrdaClana.findMany({
    where: { potvrdioId: userId },
    select: { potvrdjeniId: true },
    distinct: ["potvrdjeniId"],
  });
  prebroj(
    await prisma.potvrdaClana.deleteMany({
      where: { OR: [{ potvrdioId: userId }, { potvrdjeniId: userId }] },
    }),
  );
  const promeneDrugih: { id: string; p: PromenaStatusa }[] = [];
  for (const { potvrdjeniId } of pogodjeniPotvrdom) {
    if (potvrdjeniId === userId) continue;
    const p = await prisma.$transaction((tx) => preracunajStatusNaloga(tx, potvrdjeniId));
    promeneDrugih.push({ id: potvrdjeniId, p });
  }
  // Potvrde postojanja deteta koje je ovaj nalog dao (deca čl. 6, set 4.8.2).
  prebroj(await prisma.potvrdaPostojanjaDeteta.deleteMany({ where: { potvrdioId: userId } }));

  // Nadzori nad tuđim verifikacijama koje ovaj nalog nije dodirivao kao strana
  // (veze su ostale, otpada samo zapis nadzora).
  prebroj(await prisma.nadzorZapis.deleteMany({ where: { nadzornikId: userId } }));
  await prisma.nadzorniPredmet.updateMany({ where: { resenById: userId }, data: { resenById: null } });

  // ── 2. ZRNO ────────────────────────────────────────────────────────────────
  // Otpis bez evidentiranja POEN-a: ZRNA se vraćaju u raspoloživa u Protokolu
  // (imenilac obračunskog koeficijenta), kao pri prestanku statusa (čl. 34 st. 1).
  const zrnaOtpisana = (user.zrnoStanje?.aktivno ?? 0) + (user.zrnoStanje?.slobodno ?? 0);
  await prisma.zrnoDelegacija.updateMany({ where: { delegatId: userId }, data: { delegatId: null } });
  await prisma.zrnoDelegacija.updateMany({
    where: { zakazaniDelegatId: userId },
    data: { zakazaniDelegatId: null, imaZakazano: false },
  });
  prebroj(await prisma.zrnoDelegacija.deleteMany({ where: { delegatorId: userId } }));
  prebroj(await prisma.zrnoUpisZahtev.deleteMany({ where: { userId } }));
  prebroj(await prisma.zrnoOtpisZahtev.deleteMany({ where: { userId } }));
  prebroj(await prisma.zrnoStatusZahtev.deleteMany({ where: { userId } }));
  prebroj(await prisma.zrnoStanje.deleteMany({ where: { userId } }));

  // ── 3. POEN ────────────────────────────────────────────────────────────────
  // Stanje ide na nulu, protivzapis Protokola se pomera za isti iznos (zero-sum).
  // `increment` pokriva i negativno stanje (nadoknada, čl. 20b): tada Protokol
  // ide dublje u minus, koliko je nadoknade otpisano.
  const svezWallet = await prisma.wallet.findUnique({ where: { userId } });
  const balans = svezWallet?.balance ?? 0;
  if (svezWallet) {
    await prisma.$transaction(async (tx) => {
      if (balans !== 0) {
        await tx.wallet.update({ where: { id: svezWallet.id }, data: { balance: 0 } });
        await tx.wallet.update({
          where: { id: PROTOKOL_WALLET_ID },
          data: { balance: { increment: balans } },
        });
      }
      // Istorija se briše, ne poništava — nalog treba da zatekne prazan izvod.
      // Zero-sum se time ne dira: merodavna su stanja zapisa, ne redovi istorije.
      prebroj(
        await tx.transaction.deleteMany({
          where: { OR: [{ fromWalletId: svezWallet.id }, { toWalletId: svezWallet.id }] },
        }),
      );
    });
  }

  // ── 4. Pijaca ──────────────────────────────────────────────────────────────
  // Prijave na oglas i upiti padaju kaskadno uz oglas; poruke i razgovori koji
  // su nastali povodom oglasa gube samo vezu (SetNull).
  const oglasi = await prisma.marketplaceListing.findMany({
    where: { sellerId: userId },
    select: { id: true, images: true },
  });
  const obrisanoOglasa = prebroj(await prisma.marketplaceListing.deleteMany({ where: { sellerId: userId } }));
  // Oglasi drugih ljudi koje je ovaj nalog „kupio" vraćaju se u ponudu.
  await prisma.marketplaceListing.updateMany({
    where: { primalacId: userId },
    data: { primalacId: null, razmenjenoAt: null, status: ListingStatus.ACTIVE },
  });
  prebroj(await prisma.prijavaOglasa.deleteMany({ where: { prijaviocId: userId } }));
  prebroj(await prisma.followedCategory.deleteMany({ where: { userId } }));

  // ── 5. Kanali doprinosa (čl. 40a i 40b) ────────────────────────────────────
  prebroj(await prisma.doprinosSadrzaju.deleteMany({ where: { userId } }));
  prebroj(await prisma.doprinosRazmeni.deleteMany({ where: { userId } }));
  // Gazdinstvo (čl. 40c): prvo istupanje (gazdinstvo bez članova se gasi), pa zapisi.
  await istupiPriGasenjuNaloga(userId);
  prebroj(await prisma.doprinosGazdinstva.deleteMany({ where: { userId } }));
  prebroj(await prisma.clanGazdinstva.deleteMany({ where: { userId } }));

  // ── 6. Programi i doprinos-oglasi ──────────────────────────────────────────
  prebroj(await prisma.programPotvrda.deleteMany({ where: { verifikatorId: userId } }));
  prebroj(await prisma.programEnrollment.deleteMany({ where: { userId } }));
  prebroj(await prisma.oglasEvidencija.deleteMany({ where: { userId } }));
  prebroj(await prisma.oglasPrijava.deleteMany({ where: { userId } }));
  const sopstveniDoprinosOglasi = await prisma.doprinosOglas.findMany({
    where: { createdById: userId },
    select: { id: true },
  });
  if (sopstveniDoprinosOglasi.length > 0) {
    const ids = sopstveniDoprinosOglasi.map((o) => o.id);
    prebroj(await prisma.oglasEvidencija.deleteMany({ where: { oglasId: { in: ids } } }));
    prebroj(await prisma.oglasPrijava.deleteMany({ where: { oglasId: { in: ids } } }));
    prebroj(await prisma.doprinosOglas.deleteMany({ where: { id: { in: ids } } }));
  }

  // ── 7. Komunikacija ────────────────────────────────────────────────────────
  const konverzacije = await prisma.konverzacija.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    select: { id: true },
  });
  if (konverzacije.length > 0) {
    const ids = konverzacije.map((k) => k.id);
    prebroj(await prisma.poruka.deleteMany({ where: { konverzacijaId: { in: ids } } }));
    prebroj(await prisma.konverzacija.deleteMany({ where: { id: { in: ids } } }));
  }
  prebroj(await prisma.chatMessage.deleteMany({ where: { userId } }));
  prebroj(await prisma.notifikacija.deleteMany({ where: { userId } }));
  prebroj(await prisma.pushPretplata.deleteMany({ where: { userId } }));

  // ── 8. Krugovi, glasanje, donacije, prigovori ──────────────────────────────
  prebroj(await prisma.krugClanstvo.deleteMany({ where: { userId } }));
  prebroj(await prisma.krugPristupnica.deleteMany({ where: { userId } }));
  prebroj(await prisma.krugOsnivanjeZahtev.deleteMany({ where: { inicijatorId: userId } }));
  prebroj(await prisma.glasanjeGlas.deleteMany({ where: { userId } }));
  const sopstveniPredlozi = await prisma.glasanjePredlog.findMany({
    where: { authorId: userId },
    select: { id: true },
  });
  if (sopstveniPredlozi.length > 0) {
    const ids = sopstveniPredlozi.map((p) => p.id);
    prebroj(await prisma.glasanjeGlas.deleteMany({ where: { predlogId: { in: ids } } }));
    prebroj(await prisma.glasanjePredlog.deleteMany({ where: { id: { in: ids } } }));
  }
  prebroj(await prisma.donationRecord.deleteMany({ where: { userId } }));
  prebroj(await prisma.pokroviteljPrijava.deleteMany({ where: { podnosilacId: userId } }));
  prebroj(await prisma.prigovorNaOdluku.deleteMany({ where: { userId } }));
  prebroj(await prisma.bug.deleteMany({ where: { userId } }));

  // ── 9. Tragovi naloga ──────────────────────────────────────────────────────
  prebroj(await prisma.verifikacijaToken.deleteMany({ where: { korisnikId: userId } }));
  prebroj(await prisma.passwordResetToken.deleteMany({ where: { userId } }));
  prebroj(await prisma.aktivnostLog.deleteMany({ where: { userId } }));
  prebroj(await prisma.pseudonimIstorija.deleteMany({ where: { userId } }));
  prebroj(await prisma.preporuka.deleteMany({ where: { OR: [{ odId: userId }, { zaId: userId }] } }));
  // Pristanci na akte se brišu jer ih ni nov nalog nema — po prijavi se ponovo
  // prikazuje ekran sa pristankom, isti koji vidi čovek koji se tek registrovao.
  prebroj(await prisma.politikaPrihvatanje.deleteMany({ where: { userId } }));
  prebroj(await prisma.pravilnikPrihvatanje.deleteMany({ where: { userId } }));
  prebroj(await prisma.userPodaci.deleteMany({ where: { userId } }));
  // Nov nalog nema upisano ime (evidencija identiteta, čl. 31a).
  prebroj(await prisma.identitetNaloga.deleteMany({ where: { userId } }));
  // Spisak za poziv (dokaz stvarnosti čl. 4a, set 4.8.2): nov nalog nije na
  // spisku, pa ni zapisa o tome ko je njegove podatke otvarao nema. Zapisi u
  // kojima je OVAJ nalog otvarao tuđe podatke pripadaju pozvanima i ostaju.
  prebroj(await prisma.zahtevZaRazgovor.deleteMany({ where: { userId } }));
  prebroj(await prisma.zapisOtvaranjaPoziva.deleteMany({ where: { pozvaniId: userId } }));
  // Prijave lažnog roditeljstva koje je nalog podneo (deca čl. 4e).
  prebroj(await prisma.prijavaRoditeljstva.deleteMany({ where: { podnosilacId: userId } }));

  // ── 10. Sam nalog ──────────────────────────────────────────────────────────
  // Ostaju: id, email, lozinka, pseudonim, memberHash, donatorskiBroj i wallet —
  // sve ostalo se vraća na podrazumevano. `createdAt` ide na sada, da nalog i u
  // pregledima („član od", levak, brojači novih članova) izgleda kao današnji.
  await prisma.user.update({
    where: { id: userId },
    data: {
      tipKorisnika: TipKorisnika.NEVERIFIKOVAN,
      verified: false,
      verifiedAt: null,
      indeksStvarnosti: 0,
      potvrdjenAt: null,
      slotoviPotroseni: 0,
      utvrdjenNepostojeci: null,
      pocetnaEmisijaIzvrsena: false,
      status: UserStatus.ACTIVE,
      suspendedAt: null,
      suspendedReason: null,
      telefon: null,
      avatar: null,
      vidjenoNovcanikAt: null,
      vidjenoPijacaAt: null,
      // Vodič `/dobrodosli` ponovo čeka na prvoj prijavi — bez ovoga bi reset
      // vratio podatke na nulu, a čovek bi i dalje sleteo pravo na Sistem.
      vodicVidjenAt: null,
      pseudonimChangedAt: null,
      emailObavestenja: true,
      // Nalog treba da zatekne stanje sa dana registracije, a nov nalog školu nema.
      // Uz to se briše i rok od 30 dana — inače bi resetovan nalog nasledio čekanje
      // koje ničim nije zaslužio.
      skolaSifra: null,
      skolaPromenjenaAt: null,
      createdAt: new Date(),
    },
  });
  // Keš statusa iz grafa (koji je sada prazan) — isti pisac kao svuda.
  await prisma.$transaction((tx) => preracunajStatusNaloga(tx, userId));

  // Posledice po druge (pad potvrđenosti onih koje je ovaj nalog potvrdio) — van
  // transakcije, ne bacaju.
  for (const { id, p } of promeneDrugih) {
    await posledicePromeneStatusa(id, p.pre, p.posle);
  }

  // Slike sa R2 tek na kraju — orphan fajl ne sme da obori reset.
  for (const o of oglasi) {
    for (const url of o.images) {
      try {
        await obrisiSaR2(url);
      } catch {
        /* skladište nije merodavno za ishod reseta */
      }
    }
  }
  if (user.avatar) {
    try {
      await obrisiSaR2(user.avatar);
    } catch {
      /* isto */
    }
  }

  return {
    pseudonim: user.pseudonim,
    poenVracenProtokolu: balans,
    poenVracenOdDrugih,
    zrnaOtpisana,
    ponistenoVerifikacija,
    obrisanoOglasa,
    obrisanoZapisa,
  };
}
