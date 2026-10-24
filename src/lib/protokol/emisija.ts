import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { posaljiAdminAlert } from "@/lib/adminAlert";

const PROTOKOL_WALLET_ID = "banka-singleton";

/**
 * Emituje POEN iz Protokola na wallet korisnika.
 * Protokol ide u minus, korisnik prima POEN.
 * Mora se zvati unutar prisma.$transaction ako je deo šire operacije.
 */
/**
 * `opis` nosi ključ + parametre da bi se stavka u istoriji mogla prikazati na
 * jeziku posmatrača. `description` i dalje ide u bazu kao gotov srpski tekst —
 * rezerva, i ono što vide stari redovi i nekonvertovana pozivna mesta.
 */
export type OpisTransakcije = {
  kljuc: string;
  parametri?: Record<string, string | number>;
};

/**
 * Veze zapisa do onoga iz čega je nastao.
 *
 * 🔴 `enrollmentId` je veza, ne naziv programa (set 4.6.7, R-03). Čl. 4 st. 4
 * Pravilnika o programima podrške traži da se evidentiranje po programu prikaže
 * verifikovanim korisnicima uz naziv programa, a čl. 4 st. 5 da se osnov ne
 * prikaže nikome. Naziv se zato izvodi iz prijave pri čitanju, dok opis zapisa
 * i dalje glasi samo „Socijalni program": zapis je trajan i ide u GDPR izvoz.
 */
export type VezeZapisa = {
  enrollmentId?: string | null;
};

export async function emitujPoen(
  toWalletId: string,
  amount: number,
  type: TransactionType,
  description?: string,
  opis?: OpisTransakcije,
  veze?: VezeZapisa,
) {
  if (amount <= 0) throw new Error("Iznos emisije mora biti pozitivan.");

  return prisma.$transaction(async (tx) => {
    // Protokol ide u minus
    const protokol = await tx.wallet.update({
      where: { id: PROTOKOL_WALLET_ID },
      data: { balance: { decrement: amount } },
    });

    // Korisnik prima POEN
    const wallet = await tx.wallet.update({
      where: { id: toWalletId },
      data: { balance: { increment: amount } },
    });

    // Evidentira transakciju
    const tx_ = await tx.transaction.create({
      data: {
        fromWalletId: PROTOKOL_WALLET_ID,
        toWalletId,
        amount,
        type,
        description,
        opisKljuc: opis?.kljuc,
        opisParametri: opis?.parametri,
        enrollmentId: veze?.enrollmentId ?? null,
      },
    });

    // Zero-sum se proverava UVEK (i u produkciji). U dev-u nesklad obara transakciju
    // (rana detekcija); u produkciji se NE baca — latentni nesklad iz prošlosti ne sme
    // da zablokira sve buduće emisije — već se glasno loguje i šalje admin alarm.
    await checkZeroSum(tx);

    return { protokol, wallet, transaction: tx_ };
  });
}

/**
 * Zero-sum provera: zbir svih balansa mora biti 0.
 * Dev: baca grešku (rollback emisije). Produkcija: alarmira, ne baca.
 */
async function checkZeroSum(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) {
  const result = await tx.wallet.aggregate({ _sum: { balance: true } });
  const sum = result._sum.balance ?? 0;
  if (sum !== 0) {
    const poruka = `Zero-sum narušen! Zbir balansa: ${sum}`;
    if (process.env.NODE_ENV === "production") {
      console.error("[zero-sum]", poruka);
      void posaljiAdminAlert("Zero-sum narušen", poruka);
    } else {
      throw new Error(poruka);
    }
  }
}
