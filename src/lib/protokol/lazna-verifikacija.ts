import { prisma } from "@/lib/prisma";
import { PotvrdaPoenStatus, TransactionType, UserStatus } from "@/generated/prisma/client";
import {
  POEN_NADZORNIK,
  POEN_VERIFIKATOR,
  POEN_VERIFIKOVANI,
} from "./dokaz-stvarnosti";
import { podelaTereta } from "./nadoknada";
import { ugasiOznakeNaloga, poslediceIzlaskaNaloga, type IzlazNaloga } from "./izlaz-naloga";
import { jeSuperadmin } from "@/lib/dozvole";
import {
  posledicePromeneStatusa,
  preracunajStatusNaloga,
  type StatusUcesnika,
} from "./status";

type Promena = { userId: string; pre: StatusUcesnika; posle: StatusUcesnika };

const PROTOKOL_WALLET_ID = "banka-singleton";

export class LaznaVerifikacijaGreska extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type Nadoknada = { userId: string; pseudonim: string; iznos: number };

export type PonistavanjeRezultat = {
  /** Pseudonim naloga nad kojim je radnja izvršena (nalog ili verifikovani iz veze). */
  pseudonim: string;
  ponistenoVerifikacija: number;
  /** Učesnici kojima je verifikacija ili potvrda pala — njima ide obaveštenje. */
  pogodjeniKorisnici: string[];
  /** Verifikatori kojima je nastala nadoknada (negativan zapis), radi obaveštenja. */
  nadoknade: Nadoknada[];
};

/**
 * Poništavanje lažne verifikacije (Pravilnik o dokazu stvarnosti, Glava IX; promena iz 4.2.0).
 *
 * 🔴 ŠTA SE PROMENILO U 4.2.0 — ne vraćati na staro:
 *
 *  1. LAŽNOST SE CENI PO ČOVEKU, NE PO VERIFIKATORU (čl. 33). Do 4.2.0 je utvrđenje
 *     jedne lažne verifikacije obaralo SVE verifikacije tog verifikatora, a kod je
 *     išao i dalje od norme — BFS je gurao svakog pogođenog u red bez ijedne provere
 *     i čistio celo podstablo. Stvarni ljudi su gubili status zbog tuđe radnje.
 *     Sada se poništava samo utvrđena verifikacija; ostale se preispituju.
 *
 *  2. KASKADA IDE KROZ NEPOSTOJANJE (čl. 34). Nalog za koji je Upravni odbor utvrdio
 *     da iza njega ne stoji stvarna osoba nikoga ne može poznavati, pa padaju sve
 *     verifikacije koje ga dodiruju — i primljene i obavljene. Kaskada se zaustavlja
 *     na prvom nalogu koji NIJE tako označen. Farma lažnih naloga pada tako što se
 *     označi svaki njen član; nijedan stvaran čovek ne biva pokošen usput.
 *
 *  3. PONIŠTAVA SE SAMO ONO ŠTO JE VERIFIKACIJOM NASTALO (čl. 35). POEN iz razmene,
 *     operativnog doprinosa ili donacije se NE dira; upućivanje na čl. 34 Pravilnika,
 *     koje je brisalo celu istoriju uključujući nepovratne donacije, je iseceno.
 *
 *  4. NADZORNI POEN PADA SAMO UZ ISHOD „UREDNO" (raniji čl. 20a st. 2; od seta 4.7.5 nadzor ne nosi POEN). Ko je sumnju prijavio
 *     i pokazao se u pravu, zadržava svojih 500 — inače bi ga sopstvena ispravna
 *     prijava koštala.
 *
 *  5. U MINUS IDE SAMO VERIFIKATOR (čl. 36, 37). Verifikovani i nadzornik idu najviše
 *     do nule, nepokriveni deo prelazi na verifikatora kao nadoknada.
 *
 * Zero-sum je očuvan: svako poništenje ima tačan protivzapis Protokola, a prenos
 * nepokrivenog dela na verifikatora je običan prenos između dva zapisa.
 */

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Skida `iznos` sa zapisa korisnika u korist Protokola. Dozvoljava minus. */
async function uProtokol(tx: Tx, userId: string, iznos: number, opis: string) {
  if (iznos <= 0) return;
  const w = await tx.wallet.findUnique({ where: { userId } });
  if (!w) return;
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
      type: TransactionType.PONISTENJE_ZAPISA,
      description: opis,
    },
  });
}

/** Trenutno stanje zapisa korisnika (0 ako nema wallet). */
async function stanje(tx: Tx, userId: string): Promise<number> {
  const w = await tx.wallet.findUnique({ where: { userId }, select: { balance: true } });
  return w?.balance ?? 0;
}

/**
 * Poništi jednu verifikacionu vezu: povrat POEN-a iz kanala verifikacije,
 * nadoknada na verifikatoru, brisanje veze i preračun indeksa verifikovanog.
 *
 * Vraća listu nadoknada nastalih ovim poništenjem.
 */
export type PonistavanjeOpcije = {
  /**
   * Opis koji ide u zapise umesto podrazumevanog. Obavezan svuda gde poništenje
   * NIJE utvrđena lažna verifikacija — inače bi čoveku koji nije slagao u zapisu
   * i u GDPR izvozu stajalo da jeste (čl. 35 se poziva samo u svom slučaju).
   */
  opis?: string;
  /**
   * 🔴 Teret se NE prenosi: svaki pogođeni vraća tačno ono što je po toj potvrdi
   * dobio, i njegov zapis sme u minus. Nadoknada iz čl. 36 je posledica UTVRĐENE
   * lažne verifikacije i vezuje se za verifikatora zato što je on uveo nalog koji
   * ne postoji; tamo gde utvrđenja nema, nema ni razloga da jedan čovek nosi tuđe.
   *
   * Koristilo ga je poništenje potvrde zbog neaktivnosti (ukinuto u setu 4.8.2);
   * isti režim Pravilnik čl. 17 st. 2 t. 4 propisuje za prevođenje u maloletni.
   */
  bezNadoknade?: boolean;
};

async function ponistiVezu(
  tx: Tx,
  vezaId: string,
  pogodjeni: Set<string>,
  nadoknade: Map<string, number>,
  promene: Promena[],
  opcije?: PonistavanjeOpcije
): Promise<void> {
  const v = await tx.verifikacionaVeza.findUnique({
    where: { id: vezaId },
    include: {
      verifikator: { select: { id: true, pseudonim: true } },
      verifikovani: { select: { id: true, pseudonim: true, jeOsnivac: true } },
    },
  });
  if (!v) return;

  const opis =
    opcije?.opis ??
    `Poništavanje lažne verifikacije ${v.verifikator.pseudonim} → ${v.verifikovani.pseudonim} (dokaz stvarnosti čl. 35)`;
  const bezNadoknade = opcije?.bezNadoknade === true;

  // 🔴 POEN PO OVOJ POTVRDI MOŽDA NIKAD NIJE NI UPISAN (dokaz stvarnosti čl. 19, set
  // 4.6.4): upis čeka trag stvarnog učešća potvrđenog korisnika. Dok je veza u stanju
  // ZABELEZEN, nema šta da se poništi — protivzapis bi bio LAŽAN: oduzeo bi POEN koji
  // Protokol nikad nije emitovao, gurnuo bi ljude u minus bez ijednog upisa iza toga
  // i pokvario zero-sum. Iz istog razloga tu nema ni nadoknade po čl. 36: ona pokriva
  // nepokriven deo PONIŠTENOG upisa, a poništenja nema.
  //
  // 🔴 Nadzornikovih 500 imaju SVOJE stanje (`nadzorPoenStatus`) i proveravaju se
  // odvojeno — od seta 4.6.5 i ona čekaju isti uslov, ali u svom trenutku.
  //
  // Veza se i tada briše i indeks se preračunava — to je posledica pada potvrde, ne
  // POEN-a. Potvrda zabeležena a neupisana tako naprosto nestaje.
  const poenUpisan = v.poenStatus === PotvrdaPoenStatus.EVIDENTIRAN;

  // 1. Verifikovani — najviše do nule; nepokriveni deo tereti verifikatora (čl. 37 st. 1).
  //    Bez nadoknade: pun iznos, i njegov zapis sme u minus.
  let podelaVerifikovani = { saKorisnika: 0, naVerifikatora: 0 };
  if (poenUpisan) {
    podelaVerifikovani = bezNadoknade
      ? { saKorisnika: POEN_VERIFIKOVANI, naVerifikatora: 0 }
      : podelaTereta(await stanje(tx, v.verifikovaniId), POEN_VERIFIKOVANI);
    await uProtokol(tx, v.verifikovaniId, podelaVerifikovani.saKorisnika, opis);
  }

  // 2. Nadzornik — samo ako je ishod bio „uredno" (raniji čl. 20a st. 2). Ko je evidentirao
  //    „za proveru" ili „sporno" zadržava svojih 500. Pravilo važi u oba režima:
  //    ko je sumnju prijavio i bio u pravu ne sme da prođe gore od onoga ko je ćutao.
  //
  // 🔴 NIJE pod uslovom `poenUpisan` nego pod SVOJIM: od seta 4.6.5 nadzornikovih 500
  // čekaju isti uslov, ali imaju zasebno stanje (`nadzorPoenStatus`), jer nastaju u
  // svom trenutku — pri upisu ishoda nadzora. Veza ume da ima upisan POEN po potvrdi
  // a nadzor koji čeka, i obrnuto; jedno polje to ne bi razlikovalo.
  let podelaNadzornik = { saKorisnika: 0, naVerifikatora: 0 };
  const nadzorUpisan = v.nadzorPoenStatus === PotvrdaPoenStatus.EVIDENTIRAN;
  if (nadzorUpisan && v.podlezeNadzoru && v.nadzornikId && v.nadzorIshod === "UREDNO") {
    podelaNadzornik = bezNadoknade
      ? { saKorisnika: POEN_NADZORNIK, naVerifikatora: 0 }
      : podelaTereta(await stanje(tx, v.nadzornikId), POEN_NADZORNIK);
    await uProtokol(tx, v.nadzornikId, podelaNadzornik.saKorisnika, opis);
  }

  // 3. Verifikator — pun iznos, bez ograničenja.
  //    🔴 Osim kad je ugasio nalog: potvrda je tada ostala (dokaz stvarnosti čl. 30,
  //    set 4.7.5), ali je njegov zapis pri gašenju već poništen u celini (čl. 33 glavnog
  //    Pravilnika), pa bi ovih 1.000 bilo skinuto dvaput. Nadoknada iz koraka 4 ga i
  //    tada tereti — po čl. 36 st. 7 ona ostaje i po prestanku statusa.
  const verifikatorUgasen = await tx.user.findUnique({
    where: { id: v.verifikatorId },
    select: { deaktiviranAt: true },
  });
  if (poenUpisan && !verifikatorUgasen?.deaktiviranAt) {
    await uProtokol(tx, v.verifikatorId, POEN_VERIFIKATOR, opis);
  }

  // 4. Nadoknada — nepokriveni delovi prelaze na verifikatora (čl. 36 st. 2).
  //    U režimu bez nadoknade oba sabirka su nula, pa se ovde ništa ne dešava.
  const teretVerifikatora = podelaVerifikovani.naVerifikatora + podelaNadzornik.naVerifikatora;
  if (teretVerifikatora > 0) {
    await uProtokol(
      tx,
      v.verifikatorId,
      teretVerifikatora,
      `Nadoknada za nepokriveni deo poništenja — ${v.verifikovani.pseudonim} (dokaz stvarnosti čl. 36)`
    );
    nadoknade.set(
      v.verifikatorId,
      (nadoknade.get(v.verifikatorId) ?? 0) + teretVerifikatora
    );
  }

  // 5. Veza pada (sa njom kaskadno i potvrda člana bez potvrde uz nju), pa se status
  //    verifikovanog preračunava iz grafa (status.ts). 🔴 Ukinuto je „status ostaje,
  //    potvrđenost pada": učesnik čija je verifikacija prestala postaje KORISNIK
  //    (dokaz stvarnosti čl. 31 st. 2). Osnivača se to ne tiče (čl. 29, 31 st. 4).
  //    Posledice (ZRNO, deca, gazdinstva, obaveštenje) idu VAN transakcije.
  await tx.verifikacionaVeza.delete({ where: { id: vezaId } });
  const promena = await preracunajStatusNaloga(tx, v.verifikovaniId);
  promene.push({ userId: v.verifikovaniId, ...promena });
  pogodjeni.add(v.verifikovaniId);
}

/**
 * Posledice promene statusa — VAN transakcije, ne baca (status.ts). Obaveštenje o
 * poništenju šalje ruta (`pogodjeniKorisnici`), pa ga posledice ne šalju drugi put.
 */
async function izvrsiPosledice(promene: Promena[]): Promise<void> {
  for (const p of promene) {
    try {
      await posledicePromeneStatusa(p.userId, p.pre, p.posle, { obavestiUcesnika: false });
    } catch (e) {
      console.error("[lazna-verifikacija] posledice promene statusa", p.userId, e);
    }
  }
}

async function skupiNadoknade(nadoknade: Map<string, number>): Promise<Nadoknada[]> {
  if (nadoknade.size === 0) return [];
  const korisnici = await prisma.user.findMany({
    where: { id: { in: [...nadoknade.keys()] } },
    select: { id: true, pseudonim: true },
  });
  return korisnici.map((k) => ({
    userId: k.id,
    pseudonim: k.pseudonim,
    iznos: nadoknade.get(k.id) ?? 0,
  }));
}

/**
 * Poništi JEDNU utvrđenu lažnu verifikaciju, bez kaskade (čl. 33).
 *
 * Koristi se kad je verifikovani stvarna osoba — verifikator je slagao o
 * poznavanju ili kontinuitetu, ili je znao da verifikovani ima drugi nalog.
 * Jedinstvenost verifikator ne jemči (dokaz stvarnosti čl. 14 st. 1, čl. 15 st. 1):
 * za drugi nalog za koji nije znao verifikacija nije lažna (čl. 32 st. 1), a
 * višestruki nalog utvrđuje samo Fondacija po čl. 14. Verifikovanom verifikacija prestaje,
 * pa postaje korisnik (čl. 31 st. 2), gubi POEN-e iz te verifikacije, ali zadržava
 * nalog i verifikacije koje je sam obavio, i može ponovo biti verifikovan (čl. 37).
 */
export async function ponistiVerifikaciju(
  verifikacijaId: string,
  opcije?: PonistavanjeOpcije
): Promise<PonistavanjeRezultat> {
  const veza = await prisma.verifikacionaVeza.findUnique({
    where: { id: verifikacijaId },
    include: { verifikovani: { select: { pseudonim: true } } },
  });
  if (!veza) throw new LaznaVerifikacijaGreska("Potvrda nije pronađena.", 404);

  const pogodjeni = new Set<string>();
  const nadoknade = new Map<string, number>();
  const promene: Promena[] = [];

  await prisma.$transaction(
    async (tx) => {
      await ponistiVezu(tx, verifikacijaId, pogodjeni, nadoknade, promene, opcije);
    },
    { timeout: 30000 }
  );
  await izvrsiPosledice(promene);

  return {
    pseudonim: veza.verifikovani.pseudonim,
    ponistenoVerifikacija: 1,
    pogodjeniKorisnici: [...pogodjeni],
    nadoknade: await skupiNadoknade(nadoknade),
  };
}

/**
 * Utvrđenje da iza naloga ne stoji stvarna osoba, ili da nalog nije jedinstven
 * (čl. 32), i poništavanje svih verifikacija koje taj nalog dodiruju (čl. 34).
 *
 * Nalog koji ne postoji nikoga ne može poznavati, pa su i verifikacije koje je
 * obavio i one koje je primio lažne po prirodi stvari. Kaskada se ne prostire dalje:
 * korisnik kog je takav nalog verifikovao gubi samo tu vezu, a sopstvene verifikacije
 * zadržava. Farma se obara tako što se označi svaki njen član — pri svakom označavanju
 * padnu sve veze tog člana, pa redosled označavanja ne utiče na ishod.
 */
export async function ponistiNepostojeciNalog(
  userId: string
): Promise<PonistavanjeRezultat> {
  const nalog = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, pseudonim: true, admin: true, jeOsnivac: true },
  });
  if (!nalog) throw new LaznaVerifikacijaGreska("Korisnik nije pronađen.", 404);
  if (jeSuperadmin(nalog))
    throw new LaznaVerifikacijaGreska("Ne može se označiti administrator.", 400);

  const pogodjeni = new Set<string>();
  const nadoknade = new Map<string, number>();
  const promene: Promena[] = [];
  let ponisteno = 0;

  const izlaz: IzlazNaloga = await prisma.$transaction(
    async (tx) => {
      const veze = await tx.verifikacionaVeza.findMany({
        where: { OR: [{ verifikatorId: userId }, { verifikovaniId: userId }] },
        select: { id: true },
        orderBy: { vremenskiZig: "asc" },
      });
      for (const v of veze) {
        await ponistiVezu(tx, v.id, pogodjeni, nadoknade, promene);
        ponisteno++;
      }

      // Potvrde člana bez potvrde koje je ovaj nalog DAO padaju iz istog razloga (čl.
      // 34 st. 2; čl. 5 st. 4): nalog koji ne postoji nikoga ne poznaje. Ne brišu se,
      // nego se poništavaju — trag ostaje. Automatske potvrde lanca koje su iz njih
      // proizašle ostaju (raniji čl. 5a st. 5: za njih odgovara onaj ko je uveo; automatska potvrda lanca ukinuta u setu 4.8.3).
      const datePotvrde = await tx.potvrdaClana.findMany({
        where: { potvrdioId: userId, aktivnaKljuc: { not: null } },
        select: { id: true, potvrdjeniId: true },
      });
      for (const p of datePotvrde) {
        await tx.potvrdaClana.update({
          where: { id: p.id },
          data: {
            ponistenaAt: new Date(),
            aktivnaKljuc: null,
            razlogPonistenja: "Utvrđeno da iza naloga koji je dao potvrdu ne stoji stvarna osoba (dokaz stvarnosti čl. 32, 34)",
          },
        });
        const promena = await preracunajStatusNaloga(tx, p.potvrdjeniId);
        promene.push({ userId: p.potvrdjeniId, ...promena });
        pogodjeni.add(p.potvrdjeniId);
        ponisteno++;
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          utvrdjenNepostojeci: new Date(),
          status: UserStatus.EXCLUDED,
          suspendedAt: new Date(),
          suspendedReason:
            "Utvrđeno da iza naloga ne stoji stvarna osoba (Pravilnik o dokazu stvarnosti, čl. 32)",
        },
      });
      // Nalog je isključen (Pravilnik čl. 32): keš statusa se gasi i bez obzira na graf (i
      // osnivaču), a sa njim i ostale žive oznake — evidencija identiteta (Pravilnik čl. 33 st. 4),
      // spisak za poziv, preporuke, zadruga, delegiranje, programi… Jedna funkcija za
      // sva tri izlaza (`izlaz-naloga.ts`).
      return ugasiOznakeNaloga(tx, userId);
    },
    { timeout: 60000 }
  );

  // Posledice idu svima osim samom isključenom nalogu; njegove (ZRNO, deca,
  // gazdinstvo, vaučeri, obaveštenja delegatorima) idu kroz posledice izlaska, bez
  // obaveštenja njemu o statusu.
  await izvrsiPosledice(promene.filter((p) => p.userId !== userId));
  await poslediceIzlaskaNaloga(userId, izlaz);

  // Sam nalog ne treba da dobije obaveštenje o padu indeksa — isključen je.
  pogodjeni.delete(userId);

  return {
    pseudonim: nalog.pseudonim,
    ponistenoVerifikacija: ponisteno,
    pogodjeniKorisnici: [...pogodjeni],
    nadoknade: await skupiNadoknade(nadoknade),
  };
}

/**
 * Poništenje potvrde člana bez potvrde (dokaz stvarnosti čl. 5 st. 4, 31 st. 3,
 * 33 st. 1): potvrđenost prestaje, a učesnik ostaje član bez potvrde dok mu važi
 * uvođenje u Kolo. Aktivno ZRNO ide u otključavanje (posledice, status.ts). POEN-a za
 * vraćanje nema — potvrda ga ne nosi.
 *
 * 🔴 Potvrde iz automatske potvrde lanca koje je ova pokrenula (`lanacOdId`) se NE
 * poništavaju (čl. 33, 34): istinitost se ceni po učesniku.
 */
export async function ponistiPotvrduClana(
  potvrdaClanaId: string,
  adminId: string,
  razlog?: string | null,
): Promise<{ pseudonim: string; potvrdjeniId: string; promena: Promena }> {
  const rez = await prisma.$transaction(async (tx) => {
    const p = await tx.potvrdaClana.findUnique({
      where: { id: potvrdaClanaId },
      select: { id: true, potvrdjeniId: true, ponistenaAt: true, potvrdjeni: { select: { pseudonim: true } } },
    });
    if (!p) throw new LaznaVerifikacijaGreska("Potvrda nije pronađena.", 404);
    if (p.ponistenaAt) throw new LaznaVerifikacijaGreska("Potvrda je već poništena.", 409);
    await tx.potvrdaClana.update({
      where: { id: p.id },
      data: {
        ponistenaAt: new Date(),
        ponistioId: adminId,
        aktivnaKljuc: null,
        razlogPonistenja: razlog?.trim() || "Utvrđena lažna potvrda člana bez potvrde (dokaz stvarnosti čl. 32, 33)",
      },
    });
    const promena = await preracunajStatusNaloga(tx, p.potvrdjeniId);
    return { pseudonim: p.potvrdjeni.pseudonim, potvrdjeniId: p.potvrdjeniId, promena: { userId: p.potvrdjeniId, ...promena } };
  });
  // Obaveštenje šalje ruta (sopstvenim tekstom), pa ga posledice ne šalju drugi put.
  try {
    await posledicePromeneStatusa(rez.potvrdjeniId, rez.promena.pre, rez.promena.posle, { obavestiUcesnika: false });
  } catch (e) {
    console.error("[lazna-verifikacija] posledice poništenja potvrde", rez.potvrdjeniId, e);
  }
  return rez;
}
