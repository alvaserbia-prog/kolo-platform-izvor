/**
 * Jednokratno usklađivanje zatečenih potvrda sa pravilom iz dokaza stvarnosti čl. 7.
 *
 * Do seta 4.6.4 se POEN po potvrdi upisivao ODMAH, bez ijednog traga da je potvrđeni
 * išta doprineo. Ova radnja zatečene potvrde dovodi na isto pravilo koje od tog seta
 * važi za nove: ko nije ostvario nijedan doprinos, POEN mu se vraća u „zabeleženo" i
 * upisaće se kad uslov nastupi.
 *
 * Osnov: čl. 22a Pravilnika o dokazu stvarnosti; izuzetak od zabrane negativnog zapisa
 * je čl. 14 stav 3 tačka 6 Pravilnika o KOLO sistemu.
 *
 * 🔴 PRELAZNA RADNJA, NE TRAJAN INSTITUT. Sprovodi se jednom, dok sistem još nije
 * zvanično u radu — posle puštanja u rad ovakva ispravka bila bi znatno skuplja i
 * tražila bi drugačiji postupak.
 *
 * 🔴 POVLAČI SE PUN IZNOS — ZAPIS SME U MINUS (odluka vlasnika, 17.09.2026, posle
 * uvida u spisak po članu: „ne vidim da iko ima minus a trebalo bi jer su neki uzimali
 * a uopšte nisu postavili svoj oglas"). Ranija varijanta je kapirala na nulu; to je
 * odbačeno jer daje ishod suprotan cilju radnje — ko je POEN već potrošio zadržao bi
 * ga, a ko ga je sačuvao vratio bi ga celog, pa bi usklađivanje nagradilo upravo ono
 * ponašanje zbog kog se sprovodi. Isto pravilo već važi kod otpisa prijateljstva,
 * poništenog prepisa po prijavi razmene i prevoda u maloletni.
 *
 * 🟢 Minus se sam popunjava baš ponašanjem koje se traži: zabeleženi doprinos od
 * 1.000 ostaje, pa kad čovek objavi oglas i Fondacija ga odobri, upisuje mu se 1.000
 * po čl. 40a i 1.000 po potvrdi — dakle 2.000, čime se minus od 1.000 gasi i čovek
 * završava tamo gde bi i bio. Zato ovo nije sankcija nego pomeren trenutak upisa.
 *
 * 🔴 TERET SE NE PRENOSI NI NA KOGA. Svako vraća isključivo ono što je povodom te
 * potvrde njemu bilo evidentirano; nadoknada iz čl. 20b se ne primenjuje (tamo
 * nepokriveni deo prelazi na verifikatora, ovde ne prelazi nikome).
 *
 * 🔴 NADZORNIKOVIH 500 SE POVLAČE ISTO (odluka vlasnika, 16.09.2026). Od seta 4.6.5 i
 * ona čekaju isti uslov, samo imaju svoje stanje (`nadzorPoenStatus`), jer nastaju u
 * svom trenutku — pri upisu ishoda nadzora. Zato se i ovde proveravaju odvojeno: veza
 * ume da ima upisan POEN po potvrdi a nadzor koji čeka, i obrnuto.
 *
 * 🔴 USLOV SE MERI BLAGO, i to je namerno: računa se SVAKI evidentiran doprinos po
 * čl. 40a, bez obzira kojim je okidačem nastao. Zatečeni oglasi potvrđenih članova
 * nikad nisu prolazili kroz odobrenje, jer se ono tada nije tražilo — traženje
 * odobrenja unazad bilo bi kažnjavanje po pravilu koje u tom trenutku nije postojalo.
 * `dohvatiTragUcesca` upravo to i radi: gleda postojanje emisije, ne način nastanka.
 *
 * Radnja je DUGME, ne migracija: protivzapis mora kroz zapis transakcije (zero-sum i
 * revizijski trag), a pad opticaja je trenutak koji bira čovek — isti razlog iz kog je
 * `evidentirajZateceneVerifikovane` dugme.
 */
import { prisma } from "@/lib/prisma";
import { PotvrdaPoenStatus, TransactionType } from "@/generated/prisma/client";
import { POEN_NADZORNIK, POEN_VERIFIKATOR, POEN_VERIFIKOVANI } from "./dokaz-stvarnosti";
import { dohvatiTragUcesca, uslovPotvrde } from "./potvrda-poen";
import { PRAG_SKOK } from "./osnivacki";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";

const PROTOKOL_WALLET_ID = "banka-singleton";

export type UskladjivanjeUcesnik = {
  id: string;
  pseudonim: string;
  uloga: "potvrdjivac" | "potvrdjeni" | "nadzornik";
  /** Stanje zapisa pre cele radnje. */
  stanje: number;
  /** Koliko mu se po ovoj stavci oduzima — uvek pun iznos. */
  oduzeto: number;
};

export type UskladjivanjeIshod = {
  sprovedeno: boolean;
  /** Sve potvrde kojima je POEN upisan. */
  ukupnoUpisanih: number;
  /** Od toga: koliko ostaje, jer potvrđeni ima trag učešća. */
  ostaje: number;
  /** Od toga: koliko se povlači u „zabeleženo". */
  povlaci: number;
  /** Zbir koji se poništava — pun iznos, bez kapiranja. */
  poenPonisten: number;
  pogodjenihLjudi: number;
  /** Koliko ljudi time prelazi u negativan zapis (čl. 14 st. 3 t. 6). */
  ljudiUMinusu: number;
  /** Zbir negativnih stanja posle radnje, kao pozitivan broj. */
  ukupanMinus: number;
  opticajPre: number;
  opticajPosle: number;
  /** Prag osnivačkog koraka koji pad opticaja prelazi unazad, ako ga prelazi. */
  osnivackiPragPredjen: number | null;
  ucesnici: UskladjivanjeUcesnik[];
};

async function opticaj(): Promise<number> {
  const w = await prisma.wallet.findUnique({
    where: { id: PROTOKOL_WALLET_ID },
    select: { balance: true },
  });
  return Math.abs(w?.balance ?? 0);
}

/**
 * Pregled ili sprovođenje — ISTA funkcija, jer dve odvojene računice se razilaze,
 * a čovek bi onda pritiskao dugme po brojevima koji ne važe.
 *
 * 🔴 Sprovođenje NE veruje snimku iz pregleda nego računa iznova: između dva klika
 * prolazi vreme i stanja se menjaju.
 */
export async function uskladiZatecenePotvrde(opcije: {
  suviHod: boolean;
  adminId?: string;
}): Promise<UskladjivanjeIshod> {
  const upisane = await prisma.verifikacionaVeza.findMany({
    // Veza ulazi u obradu ako je upisan bilo koji od tri iznosa po njoj.
    where: {
      OR: [
        { poenStatus: PotvrdaPoenStatus.EVIDENTIRAN },
        { nadzorPoenStatus: PotvrdaPoenStatus.EVIDENTIRAN },
      ],
    },
    select: {
      id: true,
      verifikatorId: true,
      verifikovaniId: true,
      poenStatus: true,
      nadzorPoenStatus: true,
      nadzornikId: true,
      nadzorIshod: true,
      podlezeNadzoru: true,
      nadzornik: { select: { pseudonim: true } },
      verifikator: { select: { pseudonim: true } },
      verifikovani: { select: { pseudonim: true } },
    },
    orderBy: { vremenskiZig: "asc" },
  });

  // Trag učešća se računa PO ČOVEKU, ne po vezi — jedan potvrđeni ume da ima više
  // primljenih potvrda, a upit nad istorijom je isti za sve njih.
  const tragPoKorisniku = new Map<string, boolean>();
  for (const v of upisane) {
    if (tragPoKorisniku.has(v.verifikovaniId)) continue;
    const trag = await dohvatiTragUcesca(v.verifikovaniId);
    tragPoKorisniku.set(v.verifikovaniId, uslovPotvrde(trag) !== null);
  }

  const zaPovlacenje = upisane.filter((v) => tragPoKorisniku.get(v.verifikovaniId) === false);

  // Stanja svih pogođenih, jednim upitom. Računa se KUMULATIVNO i sme u minus: čovek
  // sa dve potvrde koje padaju vraća oba iznosa bez obzira na to šta na zapisu ima.
  const idevi = new Set<string>();
  for (const v of zaPovlacenje) {
    if (v.poenStatus === PotvrdaPoenStatus.EVIDENTIRAN) {
      idevi.add(v.verifikatorId);
      idevi.add(v.verifikovaniId);
    }
    if (v.nadzorPoenStatus === PotvrdaPoenStatus.EVIDENTIRAN && v.nadzornikId) {
      idevi.add(v.nadzornikId);
    }
  }
  const walleti = await prisma.wallet.findMany({
    where: { userId: { in: [...idevi] } },
    select: { userId: true, balance: true },
  });
  const pocetnoStanje = new Map<string, number>();
  for (const w of walleti) if (w.userId) pocetnoStanje.set(w.userId, w.balance);
  const preostalo = new Map(pocetnoStanje);

  const ucesnici: UskladjivanjeUcesnik[] = [];
  let poenPonisten = 0;

  function obracunaj(
    userId: string,
    pseudonim: string,
    uloga: UskladjivanjeUcesnik["uloga"],
    iznos: number,
  ) {
    preostalo.set(userId, (preostalo.get(userId) ?? 0) - iznos);
    poenPonisten += iznos;
    ucesnici.push({
      id: userId,
      pseudonim,
      uloga,
      stanje: pocetnoStanje.get(userId) ?? 0,
      oduzeto: iznos,
    });
    return iznos;
  }

  const planPoVezi = zaPovlacenje.map((v) => {
    const poenUpisan = v.poenStatus === PotvrdaPoenStatus.EVIDENTIRAN;
    const nadzorUpisan =
      v.nadzorPoenStatus === PotvrdaPoenStatus.EVIDENTIRAN && v.nadzornikId !== null;
    return {
      veza: v,
      poenUpisan,
      nadzorUpisan,
      odVerifikatora: poenUpisan
        ? obracunaj(v.verifikatorId, v.verifikator.pseudonim, "potvrdjivac", POEN_VERIFIKATOR)
        : 0,
      odVerifikovanog: poenUpisan
        ? obracunaj(v.verifikovaniId, v.verifikovani.pseudonim, "potvrdjeni", POEN_VERIFIKOVANI)
        : 0,
      odNadzornika: nadzorUpisan
        ? obracunaj(v.nadzornikId!, v.nadzornik?.pseudonim ?? "", "nadzornik", POEN_NADZORNIK)
        : 0,
    };
  });

  let ljudiUMinusu = 0;
  let ukupanMinus = 0;
  for (const stanjePosle of preostalo.values()) {
    if (stanjePosle < 0) {
      ljudiUMinusu += 1;
      ukupanMinus += -stanjePosle;
    }
  }

  const pre = await opticaj();
  const posle = pre - poenPonisten;
  // Pad opticaja ne poništava već upaljene osnivačke korake — ali sledeći čeka da
  // opticaj ponovo naraste. Čovek to mora da vidi PRE nego što pritisne dugme.
  const pragPre = Math.floor(pre / PRAG_SKOK);
  const pragPosle = Math.floor(posle / PRAG_SKOK);
  const osnivackiPragPredjen = pragPosle < pragPre ? pragPre * PRAG_SKOK : null;

  const ishod: UskladjivanjeIshod = {
    sprovedeno: false,
    ukupnoUpisanih: upisane.length,
    ostaje: upisane.length - zaPovlacenje.length,
    povlaci: zaPovlacenje.length,
    poenPonisten,
    pogodjenihLjudi: new Set(ucesnici.map((u) => u.id)).size,
    ljudiUMinusu,
    ukupanMinus,
    opticajPre: pre,
    opticajPosle: posle,
    osnivackiPragPredjen,
    ucesnici,
  };

  if (opcije.suviHod) return ishod;

  // ── Sprovođenje ────────────────────────────────────────────────────────────
  for (const { veza, poenUpisan, nadzorUpisan, odVerifikatora, odVerifikovanog, odNadzornika } of planPoVezi) {
    await prisma.$transaction(async (tx) => {
      // Rezerviši prelaz — ako je u međuvremenu nešto otključalo pa opet oborilo,
      // uslovan update sprečava dvostruko povlačenje. Dva iznosa, dva stanja.
      let ista = 0;
      if (poenUpisan) {
        const v1 = await tx.verifikacionaVeza.updateMany({
          where: { id: veza.id, poenStatus: PotvrdaPoenStatus.EVIDENTIRAN },
          data: {
            poenStatus: PotvrdaPoenStatus.ZABELEZEN,
            poenEvidentiranAt: null,
            poenUslov: null,
            verifikatorTxId: null,
            verifikovaniTxId: null,
          },
        });
        ista += v1.count;
      }
      if (nadzorUpisan) {
        const v2 = await tx.verifikacionaVeza.updateMany({
          where: { id: veza.id, nadzorPoenStatus: PotvrdaPoenStatus.EVIDENTIRAN },
          data: {
            nadzorPoenStatus: PotvrdaPoenStatus.ZABELEZEN,
            nadzorPoenEvidentiranAt: null,
            nadzorTxId: null,
          },
        });
        ista += v2.count;
      }
      if (ista === 0) return;

      for (const [userId, iznos] of [
        [veza.verifikatorId, poenUpisan ? odVerifikatora : 0],
        [veza.verifikovaniId, poenUpisan ? odVerifikovanog : 0],
        [veza.nadzornikId ?? "", nadzorUpisan ? odNadzornika : 0],
      ] as const) {
        if (!userId) continue;
        if (iznos <= 0) continue;
        const w = await tx.wallet.findUnique({ where: { userId }, select: { id: true } });
        if (!w) continue;
        // 🔴 Pun iznos, bez kapiranja — zapis sme u minus (čl. 14 st. 3 t. 6).
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
            type: TransactionType.USKLADJIVANJE_POTVRDE,
            description: "Usklađivanje zatečene potvrde sa čl. 7 — POEN se vraća u zabeleženo",
            opisKljuc: "transakcije.uskladjivanje_potvrde",
          },
        });
      }
    });
  }

  // Javljanje ide POSLE upisa i po ČOVEKU, ne po vezi — ko je pogođen dvaput ne sme
  // da dobije dve poruke o istoj radnji. 🔴 Ko je otišao u minus dobija DRUGU poruku:
  // minus menja šta sme sa zapisom i ne sme da se pojavi bez reči.
  const poCoveku = new Map<string, number>();
  for (const u of ucesnici) poCoveku.set(u.id, (poCoveku.get(u.id) ?? 0) + u.oduzeto);
  const stanjaPosle = await prisma.wallet.findMany({
    where: { userId: { in: [...poCoveku.keys()] } },
    select: { userId: true, balance: true },
  });
  const stanjePoCoveku = new Map<string, number>();
  for (const w of stanjaPosle) if (w.userId) stanjePoCoveku.set(w.userId, w.balance);

  for (const [userId, iznos] of poCoveku) {
    if (iznos <= 0) continue;
    const stanje = stanjePoCoveku.get(userId) ?? 0;
    const minus = stanje < 0 ? -stanje : 0;
    try {
      await obavesti(userId, {
        tip: "potvrda_poen",
        kljuc: minus > 0 ? "notifikacije.potvrda_uskladjena_minus" : "notifikacije.potvrda_uskladjena",
        parametri: { iznos: iznos.toLocaleString("sr-RS"), minus: minus.toLocaleString("sr-RS") },
        naslov: "Doprinos po potvrdi vraćen u zabeleženo",
        tekst:
          minus > 0
            ? `Pravilo je izmenjeno: POEN po potvrdi upisuje se kad potvrđeni član ostvari svoj prvi ` +
              `doprinos. Sa tvog zapisa je zato vraćeno ${iznos.toLocaleString("sr-RS")} POENA i tvoj ` +
              `zapis je sada u minusu ${minus.toLocaleString("sr-RS")} POENA. To nije dug i ne ` +
              `naplaćuje se — POENI koji ti pristignu prvo ga popunjavaju, razmena dobara i usluga ` +
              `ti nije ograničena, a prepis drugome je moguć kad zapis pređe nulu. Zabeleženi ` +
              `doprinos ostaje i upisuje se čim uslov bude ispunjen.`
            : `Pravilo je izmenjeno: POEN po potvrdi upisuje se kad potvrđeni član ostvari svoj prvi ` +
              `doprinos. Sa tvog zapisa je zato vraćeno ${iznos.toLocaleString("sr-RS")} POENA i stoji ` +
              `zabeleženo. Upisuje se čim uslov bude ispunjen.`,
        link: "/novcanik",
      });
    } catch (e) {
      console.error("[potvrde-usklađivanje] obaveštenje nije poslato", { userId, e });
    }
  }

  await logAdminAkcija(
    opcije.adminId ?? "sistem",
    "POTVRDE_USKLADJENE",
    undefined,
    `povučeno ${zaPovlacenje.length} potvrda, poništeno ${poenPonisten} POEN, pogođenih ${ishod.pogodjenihLjudi}, u minusu ${ljudiUMinusu} (ukupno ${ukupanMinus})`,
  );

  return { ...ishod, sprovedeno: true };
}
