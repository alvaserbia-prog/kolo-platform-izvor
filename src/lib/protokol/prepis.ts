import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";

/**
 * Izvršenje prepisa POEN-a između dva korisnička zapisa (Pravilnik čl. 14, 16).
 *
 * Izdvojeno iz `POST /api/transfer` kad je uveden prepis koji čeka odobrenje
 * roditelja (Pravilnik o učešću dece, čl. 14): isti posao tada kreće sa dva mesta
 * — iz rute, i iz odluke roditelja danima kasnije. Dve kopije bi se razišle, a
 * razlaz ovde znači pokvaren zero-sum ili izgubljen okidač kanala.
 *
 * 🔴 Ovde se NE proveravaju dozvole. Ko sme da prepiše kome (čl. 28 st. 2, čl. 12,
 * čl. 14), da li ima pokriće i da li je u nadoknadi — odlučuje pozivalac. Funkcija
 * radi samo ono što joj ime kaže i ATOMSKI: skidanje ide `updateMany` sa uslovom
 * `balance >= iznos`, pa dva paralelna prepisa ne mogu oba da prođu.
 */
export class PrepisGreska extends Error {}

export type StranaPrepisa = { id: string; pseudonim: string; walletId: string };

export async function izvrsiPrepis(
  posiljac: StranaPrepisa,
  primalac: StranaPrepisa,
  iznos: number,
  opis?: string | null
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const skinuto = await tx.wallet.updateMany({
      where: { id: posiljac.walletId, balance: { gte: iznos } },
      data: { balance: { decrement: iznos } },
    });
    if (skinuto.count !== 1) {
      // Stanje se u međuvremenu promenilo (paralelni prepis) — prekini ceo posao.
      throw new PrepisGreska("NEDOVOLJNO_SREDSTAVA");
    }
    await tx.wallet.update({
      where: { id: primalac.walletId },
      data: { balance: { increment: iznos } },
    });
    await tx.transaction.create({
      data: {
        fromWalletId: posiljac.walletId,
        toWalletId: primalac.walletId,
        amount: iznos,
        type: TransactionType.TRANSFER,
        description: opis?.trim() || null,
      },
    });
  });

  // 🔴 PRIMLJEN POEN VIŠE NIJE OKIDAČ ZA ČL. 40a (set 4.6.4). Od tog seta svaki prvi
  // oglas ide na odobrenje Fondacije, pa bi prepis evidentirao doprinos povodom oglasa
  // koji čovek iz UO nikad nije pogledao. Uz to prepis ništa ne dokazuje: dogovaraju ga
  // dve strane privatno, bez ikoga trećeg, pa dva naloga mogu da ga proizvedu sama.
  // Iz istog razloga prepis NIJE ni uslov za upis POEN-a po potvrdi (`potvrda-uslov.ts`).
  // Putanja doprinosa razmeni (čl. 40b) ukinuta je setom 4.8.0 — prepis više nije
  // okidač nijednog kanala.

  // Iznos se NE formatira ovde: broj ide kao parametar, a razdvajač hiljada se
  // bira pri prikazu, po jeziku primaoca (sr 1.000 · en 1,000 · ru 1 000).
  await obavesti(primalac.id, {
    tip: "transfer_primljen",
    kljuc: opis ? "notifikacije.transfer_primljen_poruka" : "notifikacije.transfer_primljen",
    parametri: { iznos, pseudonim: posiljac.pseudonim, poruka: opis ?? "" },
    naslov: `Prepisano ti je ${iznos.toLocaleString("sr-RS")} POEN`,
    tekst: `Prepisano ti je ${iznos.toLocaleString("sr-RS")} POEN u tvoj zapis — od člana ${posiljac.pseudonim}.${opis ? ` Poruka: „${opis}"` : ""}`,
    link: "/novcanik",
  });
}
