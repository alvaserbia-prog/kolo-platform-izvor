/**
 * Ispravka evidencije po prijavljenom nedostatku u kolektivnoj nabavci.
 *
 * Osnov: **Pravilnik o projektima i kolektivnim nabavkama čl. 28 i 35** i **Pravilnik
 * o KOLO sistemu čl. 18** (set 4.5.4).
 *
 * 🔴 Ovo NIJE povraćaj cene i tako se ne sme zvati ni u kodu ni u copy-ju.
 * Poništenje po čl. 25 je poništenje **po iskorišćenju**; ako dobro nije bilo
 * upotrebljivo, iskorišćenja nije ni bilo, pa je poništenje izvršeno **bez
 * osnova** i otklanja se. Fondacija po tom osnovu ništa ne isplaćuje i ništa ne
 * prima — time odbrana iz čl. 3 i čl. 17 (davanje je besplatno, nema naknade,
 * nabavka nije privredna delatnost) ostaje netaknuta. Da je ovo povraćaj, ceo
 * R-10 bi pao zajedno sa njim.
 *
 * 🔴 Ukupan broj POEN-a se ovim UVEĆAVA (Protokol ide dublje u minus), a čl. 14
 * je do 4.5.4 govorio da se uvećava „isključivo upisom kroz kanale iz čl. 15".
 * Zato je uz ovu funkciju morao da se bumpuje i glavni Pravilnik — poseban
 * pravilnik nije mogao sam da probije zatvorenu listu. Zero-sum ostaje: koliko
 * se upiše korisniku, toliko Protokol ide u minus.
 */
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { proveriZbir, snimiZbir } from "./zbir-zapisa";

const PROTOKOL_WALLET_ID = "banka-singleton";

export type IshodIspravke =
  | { ok: true; poen: number }
  | { ok: false; razlog: string };

export async function ispraviEvidencijuNabavke(
  prijavaId: string,
  adminId: string,
  obrazlozenje: string,
): Promise<IshodIspravke> {
  if (obrazlozenje.trim().length < 10)
    return { ok: false, razlog: "Obrazloženje je obavezno — ide korisniku i u revizijski dnevnik." };

  const p = await prisma.nabavkaPrijava.findUnique({
    where: { id: prijavaId },
    select: {
      id: true,
      userId: true,
      status: true,
      ispravljenoAt: true,
      nabavkaId: true,
      nabavka: { select: { poenPoDelu: true, naziv: { select: { naziv: true } } } },
      user: { select: { pseudonim: true, wallet: { select: { id: true } } } },
    },
  });
  if (!p) return { ok: false, razlog: "Prijava na nabavku ne postoji." };
  if (p.status !== "PREUZEO")
    return { ok: false, razlog: "Ispravlja se samo poništenje izvršeno pri preuzimanju." };
  if (p.ispravljenoAt) return { ok: false, razlog: "Evidencija je već ispravljena." };
  if (!p.user.wallet) return { ok: false, razlog: "Član nema zapis u Protokolu." };

  // Iznos je SNIMAK sa same nabavke: `rezervisano` je pri preuzimanju vraćeno na
  // nulu, a `poenPoDelu` je broj koji je odluka utvrdila i koji se po čl. 18 st. 3
  // posle objave ne menja.
  const poen = p.nabavka.poenPoDelu;
  if (!poen || poen <= 0) return { ok: false, razlog: "Nabavka nema utvrđen broj POEN-a po delu." };

  const dobro = p.nabavka.naziv.naziv;
  const walletId = p.user.wallet.id;

  const upisano = await prisma.$transaction(async (tx) => {
    const rez = await tx.nabavkaPrijava.updateMany({
      where: { id: p.id, ispravljenoAt: null },
      data: { ispravljenoAt: new Date(), ispravljenoPoen: poen },
    });
    if (rez.count !== 1) return false;

    // Pravilo 1: provera zbira po novčaniku i zero-sum u istoj transakciji.
    const snimak = await snimiZbir(tx, [walletId]);
    await tx.wallet.update({ where: { id: walletId }, data: { balance: { increment: poen } } });
    await tx.wallet.update({
      where: { id: PROTOKOL_WALLET_ID },
      data: { balance: { decrement: poen } },
    });
    await tx.transaction.create({
      data: {
        fromWalletId: PROTOKOL_WALLET_ID,
        toWalletId: walletId,
        amount: poen,
        type: TransactionType.ISPRAVKA_NABAVKA,
        description: `Ispravka evidencije — kolektivna nabavka „${dobro}" (nabavke čl. 35)`,
        opisKljuc: "transakcije.nabavka_ispravka",
        opisParametri: { dobro },
      },
    });
    await proveriZbir(tx, snimak, "Ispravka evidencije po nabavci");
    return true;
  });

  if (!upisano) return { ok: false, razlog: "Evidencija je već ispravljena." };

  try {
    await obavesti(p.userId, {
      tip: "NABAVKA",
      kljuc: "nabavka_ispravka",
      parametri: { dobro, poen, obrazlozenje },
      naslov: "Evidencija je ispravljena",
      tekst:
        `Po tvom prigovoru na deo iz nabavke „${dobro}" poništenje je otklonjeno i u tvoj zapis je vraćeno ` +
        `${poen.toLocaleString("sr-RS")} POEN. Obrazloženje: ${obrazlozenje}`,
      link: `/nabavke/${p.nabavkaId}`,
    });
  } catch (e) {
    console.error("[nabavka] obaveštenje o ispravci nije poslato", p.userId, e);
  }

  await logAdminAkcija(
    adminId,
    "NABAVKA_EVIDENCIJA_ISPRAVLJENA",
    p.userId,
    `prijava ${prijavaId}, nabavka ${p.nabavkaId}, vraćeno ${poen} POEN; razlog: ${obrazlozenje}`,
  );

  return { ok: true, poen };
}
