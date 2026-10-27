/**
 * Provera zbira pri upisu para „stanje ±X, zapis X" mimo `emitujPoen()`.
 *
 * 🔴 CLAUDE.md, pravilo 1: `Wallet.balance` je ZASEBAN upisan broj, ne zbir
 * transakcija, a zero-sum (`checkZeroSum` u `emisija.ts`, cron `/api/cron/zero-sum`)
 * sabira STANJA. Zato radnja koja sama piše stanje i zapis (otpis i upis ZRNA,
 * ispravka po nabavci, ispravka po vaučeru) mora JOŠ UNUTAR svoje transakcije da
 * proveri dve stvari:
 *
 *   1. po pogođenom novčaniku: razlika `balance − (Σ ulaz − Σ izlaz)` se NIJE
 *      pomerila — meri se razlika pre i posle, pa zatečen nesklad iz prošlosti
 *      ne obara radnju, obara je samo nesklad koji bi ova radnja napravila
 *      (obrazac: `potvrde-parovi.ts`, `pokroviteljstvo-dobrima.ts` `upisiPar`);
 *   2. zbir svih stanja se nije pomerio (par je +X i −X), a ako zbir nije nula,
 *      ponaša se kao `checkZeroSum`: u razvoju baca, u produkciji alarmira.
 *
 * Protokol (`banka-singleton`) se po novčaniku ne proverava: nosi celu istoriju
 * sistema, pa bi zbir njegovih zapisa bio najskuplji upit u transakciji, a
 * provera zbira svih stanja (tačka 2) ga pokriva.
 */
import type { Prisma } from "@/generated/prisma/client";
import { posaljiAdminAlert } from "@/lib/adminAlert";

type Tx = Prisma.TransactionClient;

const PROTOKOL_WALLET_ID = "banka-singleton";

export class ZbirGreska extends Error {}

/** `balance − (Σ ulaz − Σ izlaz)` za jedan novčanik. */
export async function razlikaStanjaIIstorije(tx: Tx, walletId: string): Promise<number> {
  const [w, ulaz, izlaz] = await Promise.all([
    tx.wallet.findUniqueOrThrow({ where: { id: walletId }, select: { balance: true } }),
    tx.transaction.aggregate({ where: { toWalletId: walletId }, _sum: { amount: true } }),
    tx.transaction.aggregate({ where: { fromWalletId: walletId }, _sum: { amount: true } }),
  ]);
  return w.balance - ((ulaz._sum.amount ?? 0) - (izlaz._sum.amount ?? 0));
}

async function zbirStanja(tx: Tx): Promise<number> {
  const z = await tx.wallet.aggregate({ _sum: { balance: true } });
  return z._sum.balance ?? 0;
}

export type SnimakZbira = {
  walletIds: string[];
  razlike: number[];
  zbirStanja: number;
};

/** Snimak PRE upisa — poziva se u istoj transakciji, pre prve izmene stanja. */
export async function snimiZbir(tx: Tx, walletIds: string[]): Promise<SnimakZbira> {
  const ids = [...new Set(walletIds)].filter((id) => id !== PROTOKOL_WALLET_ID);
  const [razlike, zbir] = await Promise.all([
    Promise.all(ids.map((id) => razlikaStanjaIIstorije(tx, id))),
    zbirStanja(tx),
  ]);
  return { walletIds: ids, razlike, zbirStanja: zbir };
}

/**
 * Provera POSLE upisa, u istoj transakciji. Nesklad koji je napravila ova radnja
 * baca (transakcija se poništava); zatečen nenulti zero-sum alarmira u produkciji.
 */
export async function proveriZbir(tx: Tx, snimak: SnimakZbira, radnja: string): Promise<void> {
  const [razlike, zbir] = await Promise.all([
    Promise.all(snimak.walletIds.map((id) => razlikaStanjaIIstorije(tx, id))),
    zbirStanja(tx),
  ]);
  razlike.forEach((r, i) => {
    if (r !== snimak.razlike[i])
      throw new ZbirGreska(
        `${radnja}: stanje novčanika ${snimak.walletIds[i]} se razišlo sa istorijom — radnja je poništena.`,
      );
  });
  if (zbir !== snimak.zbirStanja)
    throw new ZbirGreska(`${radnja}: zbir svih stanja se pomerio (${snimak.zbirStanja} → ${zbir}) — radnja je poništena.`);
  if (zbir !== 0) {
    const poruka = `Zero-sum narušen! Zbir balansa: ${zbir} (zatečeno, uočeno pri: ${radnja})`;
    if (process.env.NODE_ENV === "production") {
      console.error("[zero-sum]", poruka);
      void posaljiAdminAlert("Zero-sum narušen", poruka);
    } else {
      throw new ZbirGreska(poruka);
    }
  }
}
