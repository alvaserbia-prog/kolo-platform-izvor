/**
 * Uklanjanje parova „emisija po potvrdi → usklađivanje" iz istorije.
 *
 * Do seta 4.6.4 se POEN po potvrdi upisivao odmah. Usklađivanje (dokaz stvarnosti
 * čl. 22a) ga je povuklo i vratilo potvrdu u `ZABELEZEN`, pa po nastupanju uslova
 * sledi NOVA emisija. Za isti POEN tako u istoriji stoje TRI reda:
 *
 *   1. EMISIJA_VERIFIKACIJA  +X   upisano po starom pravilu
 *   2. USKLADJIVANJE_POTVRDE −X   povučeno nazad, potvrda vraćena u „zabeleženo"
 *   3. EMISIJA_VERIFIKACIJA  +X   ponovo upisano kad je uslov nastupio
 *
 * Prva dva opisuju POEN koji je celo vreme bio na čekanju — ova radnja ih uklanja.
 * Treći red se NE dira. Odluka vlasnika, 19.09.2026.
 *
 * 🔴 PRELAZNA RADNJA, NE TRAJAN INSTITUT — kao i samo usklađivanje. Sprovodi se
 * jednom, dok sistem još nije zvanično u radu. Za nove potvrde ovaj obrazac ne
 * nastaje: od seta 4.6.4 potvrda kreće iz `ZABELEZEN` i emituje se tačno jednom.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * 🔴 ZAŠTO OVO NE POMERA NIJEDAN BROJ
 * `Wallet.balance` je ZASEBAN UPISAN broj, ne zbir transakcija: `emitujPoen` radi
 * `increment`/`decrement` nad `Wallet` i upisuje zapis, paralelno. Nigde u `src/`
 * nema koda koji balans računa iz zapisa. Zato uklanjanje reda ne menja nijedno
 * stanje, ni opticaj, ni zero-sum (`checkZeroSum` sabira stanja, ne zapise).
 *
 * 🔴 ALI PAR MORA DA ODE CEO. Uklonjena samo jedna polovina pomera zbir zapisa a
 * stanje ostavlja isto — nesklad koji NIJEDNA zatečena provera ne vidi, baš zato
 * što zero-sum gleda stanja. Zato se posle uklanjanja, JOŠ UNUTAR transakcije,
 * proverava da se svako pogođeno stanje i dalje slaže sa zbirom svojih zapisa;
 * ako se ne slaže, sve se poništava.
 *
 * 🔴 UPARIVANJE JE HEURISTIKA, JER JE VEZA OBRISANA. `uskladiZatecenePotvrde` je
 * pri povlačenju upisala `verifikatorTxId`/`verifikovaniTxId`/`nadzorTxId` = null,
 * pa potvrda više ne pokazuje na transakciju kojom je POEN upisan. Par se zato
 * traži po novčaniku + iznosu + redosledu: najstarija neuparena emisija istog
 * iznosa PRE povlačenja. Emisija nastala POSLE povlačenja je ponovni upis (red 3)
 * i namerno se ne dira. Ako ijedno povlačenje ostane bez para — radnja STAJE.
 *
 * 🟡 Identifikatori se ne pomeraju: `Transaction.id` je uuid, ne redni broj.
 * U celoj šemi `autoincrement()` postoji samo na `User.donatorskiBroj`.
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Pregled i sprovođenje idu kroz ISTU funkciju (`suviHod: true/false`) — dve
 * odvojene računice bi se razišle, pa bi čovek pritiskao dugme po brojevima koji
 * ne važe. Isti obrazac kao `potvrde-uskladjivanje.ts`.
 */
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { logAdminAkcija } from "@/lib/audit";

const PROTOKOL_WALLET_ID = "banka-singleton";

/** Emisije kroz koje POEN po potvrdi ulazi: 1.000 + 1.000, odnosno 500 nadzorniku. */
const TIP_EMISIJE = [TransactionType.EMISIJA_VERIFIKACIJA, TransactionType.EMISIJA_NADZOR];

export type ParoviUcesnik = {
  pseudonim: string;
  parova: number;
  /** Zbir POEN-a u parovima ovog naloga — koliko je bilo upisano pa povučeno. */
  poen: number;
  /** Stanje zapisa; uklanjanjem se NE menja. */
  stanje: number;
};

export type ParoviIshod = {
  sprovedeno: boolean;
  /** Ukupno povlačenja u istoriji (USKLADJIVANJE_POTVRDE). */
  povlacenjaUkupno: number;
  /** Koliko ih je upareno sa svojom emisijom. */
  parova: number;
  /** Koliko redova nestaje — uvek `parova × 2`. Ovaj broj se otkucava pri potvrdi. */
  redova: number;
  /**
   * Povlačenja bez para — svako je prepreka.
   *
   * 🟡 Ovde NEMA zasebnog brojača „emisija posle povlačenja": uparivanje ga već
   * isključuje uslovom `e.createdAt < p.createdAt`, pa bi takav brojač uvek bio
   * nula i lažno delovao kao brana. Emisija posle povlačenja je ponovni upis i
   * jednostavno se ne uzima u par.
   */
  neupareni: number;
  pogodjenihLjudi: number;
  ljudiUMinusu: number;
  /** Nalozi kojima se stanje VEĆ SADA ne slaže sa zbirom zapisa — prepreka. */
  neslozeniNalozi: number;
  /** Opticaj; uklanjanjem se NE menja, pa stoji jedan broj, ne „pre i posle". */
  opticaj: number;
  zeroSum: number;
  /** Ukupno zapisa u istoriji pre uklanjanja. */
  zapisaUkupno: number;
  /** Razlozi zbog kojih se radnja ne sme sprovesti. Prazno = sme. */
  prepreke: string[];
  ucesnici: ParoviUcesnik[];
};

type Par = { emisijaId: string; povlacenjeId: string; iznos: number; walletId: string };

/** Klijent koji prima i `prisma` i `tx` — provera se radi pre i posle uklanjanja. */
type Klijent = Pick<typeof prisma, "transaction">;

/** Zbir zapisa po novčaniku: šta je ušlo minus šta je izašlo. */
async function istorijaPoWalletu(klijent: Klijent, walletIds: string[]): Promise<Map<string, number>> {
  const [ulazi, izlazi] = await Promise.all([
    klijent.transaction.groupBy({
      by: ["toWalletId"],
      where: { toWalletId: { in: walletIds } },
      _sum: { amount: true },
    }),
    klijent.transaction.groupBy({
      by: ["fromWalletId"],
      where: { fromWalletId: { in: walletIds } },
      _sum: { amount: true },
    }),
  ]);
  const ulaz = new Map(ulazi.map((u) => [u.toWalletId, u._sum.amount ?? 0]));
  const izlaz = new Map(izlazi.map((i) => [i.fromWalletId ?? "", i._sum.amount ?? 0]));
  return new Map(walletIds.map((id) => [id, (ulaz.get(id) ?? 0) - (izlaz.get(id) ?? 0)]));
}

export async function ukloniParovePotvrde(opcije: {
  suviHod: boolean;
  adminId?: string;
}): Promise<ParoviIshod> {
  const prepreke: string[] = [];

  const [zbirSvih, protokol, zapisaUkupno] = await Promise.all([
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.wallet.findUnique({ where: { id: PROTOKOL_WALLET_ID }, select: { balance: true } }),
    prisma.transaction.count(),
  ]);
  const zeroSum = zbirSvih._sum.balance ?? 0;
  const opticaj = Math.abs(protokol?.balance ?? 0);
  if (zeroSum !== 0) prepreke.push(`Zero-sum nije nula (${zeroSum}) — to je teži problem od ovoga.`);

  const povlacenja = await prisma.transaction.findMany({
    where: { type: TransactionType.USKLADJIVANJE_POTVRDE },
    select: { id: true, amount: true, createdAt: true, fromWalletId: true },
    orderBy: { createdAt: "asc" },
  });

  const prazno: ParoviIshod = {
    sprovedeno: false,
    povlacenjaUkupno: povlacenja.length,
    parova: 0,
    redova: 0,
    neupareni: 0,
    pogodjenihLjudi: 0,
    ljudiUMinusu: 0,
    neslozeniNalozi: 0,
    opticaj,
    zeroSum,
    zapisaUkupno,
    prepreke,
    ucesnici: [],
  };
  if (povlacenja.length === 0) return prazno;

  const walletIds = [...new Set(povlacenja.map((p) => p.fromWalletId).filter((x): x is string => !!x))];

  const emisije = await prisma.transaction.findMany({
    where: { type: { in: TIP_EMISIJE }, toWalletId: { in: walletIds } },
    select: { id: true, amount: true, createdAt: true, toWalletId: true },
    orderBy: { createdAt: "asc" },
  });
  const emisijePoWalletu = new Map<string, typeof emisije>();
  for (const e of emisije) {
    const lista = emisijePoWalletu.get(e.toWalletId) ?? [];
    lista.push(e);
    emisijePoWalletu.set(e.toWalletId, lista);
  }

  // ── Uparivanje ─────────────────────────────────────────────────────────────
  const parovi: Par[] = [];
  const zauzete = new Set<string>();
  let neupareni = 0;

  for (const p of povlacenja) {
    if (!p.fromWalletId) {
      neupareni++;
      continue;
    }
    const kandidati = emisijePoWalletu.get(p.fromWalletId) ?? [];
    // Najstarija neuparena emisija istog iznosa PRE povlačenja. Emisija posle
    // povlačenja je ponovni upis (red 3) i ne sme da se dira.
    const par = kandidati.find(
      (e) => !zauzete.has(e.id) && e.amount === p.amount && e.createdAt < p.createdAt,
    );
    if (!par) {
      neupareni++;
      continue;
    }
    zauzete.add(par.id);
    parovi.push({ emisijaId: par.id, povlacenjeId: p.id, iznos: p.amount, walletId: p.fromWalletId });
  }

  if (neupareni > 0) {
    prepreke.push(
      `${neupareni} povlačenje(a) nema svoju emisiju pre sebe — istorija nije onakva kakvom je pretpostavljamo.`,
    );
  }

  // ── Slaže li se stanje sa istorijom PRE uklanjanja ─────────────────────────
  // 🔴 Protokol ulazi u skup: emisije su išle IZ njega, povlačenja U njega, pa i
  // njegov zbir zapisa mora da ostane nepromenjen.
  const proveravani = [...new Set([...walletIds, PROTOKOL_WALLET_ID])];
  const walleti = await prisma.wallet.findMany({
    where: { id: { in: proveravani } },
    select: { id: true, balance: true, user: { select: { pseudonim: true } } },
  });
  const istorijaPre = await istorijaPoWalletu(prisma, proveravani);
  const neslozeni = walleti.filter((w) => (istorijaPre.get(w.id) ?? 0) !== w.balance);
  if (neslozeni.length > 0) {
    prepreke.push(
      `${neslozeni.length} nalog(a) već sada ima stanje različito od zbira svojih zapisa — razumeti to PRE uklanjanja.`,
    );
  }

  // ── Spisak po čoveku ───────────────────────────────────────────────────────
  const poWalletu = new Map<string, { parova: number; poen: number }>();
  for (const p of parovi) {
    const z = poWalletu.get(p.walletId) ?? { parova: 0, poen: 0 };
    z.parova++;
    z.poen += p.iznos;
    poWalletu.set(p.walletId, z);
  }
  const ucesnici: ParoviUcesnik[] = walleti
    .filter((w) => poWalletu.has(w.id))
    .map((w) => ({
      pseudonim: w.user?.pseudonim ?? "(bez korisnika)",
      parova: poWalletu.get(w.id)!.parova,
      poen: poWalletu.get(w.id)!.poen,
      stanje: w.balance,
    }))
    .sort((a, b) => a.stanje - b.stanje);

  const ishod: ParoviIshod = {
    sprovedeno: false,
    povlacenjaUkupno: povlacenja.length,
    parova: parovi.length,
    redova: parovi.length * 2,
    neupareni,
    pogodjenihLjudi: ucesnici.length,
    ljudiUMinusu: ucesnici.filter((u) => u.stanje < 0).length,
    neslozeniNalozi: neslozeni.length,
    opticaj,
    zeroSum,
    zapisaUkupno,
    prepreke,
    ucesnici,
  };

  if (opcije.suviHod) return ishod;
  if (prepreke.length > 0) return ishod;
  if (parovi.length === 0) return ishod;

  // ── Sprovođenje ────────────────────────────────────────────────────────────
  const zaUklanjanje = parovi.flatMap((p) => [p.emisijaId, p.povlacenjeId]);

  await prisma.$transaction(
    async (tx) => {
      const uklonjeno = await tx.transaction.deleteMany({ where: { id: { in: zaUklanjanje } } });
      if (uklonjeno.count !== zaUklanjanje.length) {
        throw new Error(
          `Uklonjeno ${uklonjeno.count}, očekivano ${zaUklanjanje.length} — radnja je poništena.`,
        );
      }

      // 🔴 Prava brana: par je +X i −X, pa mora ostaviti zbir zapisa nepromenjenim.
      const istorijaPosle = await istorijaPoWalletu(tx, proveravani);
      for (const w of walleti) {
        if ((istorijaPosle.get(w.id) ?? 0) !== w.balance) {
          throw new Error(
            `Nalog ${w.user?.pseudonim ?? w.id}: stanje ${w.balance} se razišlo sa istorijom ` +
              `${istorijaPosle.get(w.id) ?? 0} — radnja je poništena.`,
          );
        }
      }
      const z = await tx.wallet.aggregate({ _sum: { balance: true } });
      if ((z._sum.balance ?? 0) !== 0) throw new Error("Zero-sum narušen — radnja je poništena.");
    },
    { timeout: 120_000 },
  );

  if (opcije.adminId) {
    await logAdminAkcija(
      opcije.adminId,
      "POTVRDE_PAROVI_UKLONJENI",
      undefined,
      `Uklonjeno ${zaUklanjanje.length} zapisa (${parovi.length} parova emisija+usklađivanje) ` +
        `nad ${ucesnici.length} naloga. Stanja, opticaj i zero-sum nepromenjeni — par je +X i −X.`,
    );
  }

  return { ...ishod, sprovedeno: true };
}
