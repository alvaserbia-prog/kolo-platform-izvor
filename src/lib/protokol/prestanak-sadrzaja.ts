/**
 * Brisanje slobodnog teksta, dokaza i opisa pri prestanku statusa — sprovodi
 * `prestanak-sadrzaja-pravila.ts` (Politika čl. 42 st. 2; Pravilnik čl. 55 st. 2).
 *
 * Briše se:
 *  - operativni doprinos: plan izvršenja, opis i dokaz o izvršenju, uključujući
 *    fotografiju u skladištu; snimljena izjava i brojčani podaci ostaju pod
 *    pseudonimom (Politika čl. 30 st. 5);
 *  - opis i drugi slobodan tekst prigovora, prijava oglasa, prijava razmene (i
 *    izjašnjenje druge strane koje je ovaj nalog dao) i prijava lažnog roditeljstva;
 *    odluka i njeno dejstvo ostaju pod pseudonimom (Politika čl. 32 st. 7);
 *  - prijava greške u celini (Politika čl. 32 st. 7);
 *  - prijava lažnog roditeljstva koju je nalog podneo — samo kad nalog deteta više ne
 *    postoji; dok postoji, prijava i odluka se čuvaju bez opisa (Politika čl. 38 st. 4).
 *    Prijave o nalogu koji prestaje (kao detetu) se brišu;
 *  - slobodan tekst uz prepis deteta koji je čekao roditelja i praćene kategorije oglasa;
 *  - opis zapisa koji sadrži podatak o ličnosti (Pravilnik čl. 55 st. 2; Politika
 *    čl. 29 st. 3) — iznos, strane, vreme i vrsta zapisa se ne menjaju.
 *
 * Zove se u ISTOJ transakciji sa pseudonimizacijom naloga; fotografije sa R2 briše
 * pozivalac posle nje (best-effort, ne sme da obori prestanak).
 */
import { Prisma, UserStatus } from "@/generated/prisma/client";
import {
  TIPOVI_OPISA_SA_PODATKOM_O_LICNOSTI,
  sudbinaPrijaveRoditeljstva,
} from "@/lib/prestanak-sadrzaja-pravila";

type Tx = Prisma.TransactionClient;

export type ObrisanSadrzaj = {
  /** Javni URL-ovi fotografija dokaza koje pozivalac briše sa R2 posle transakcije. */
  slike: string[];
};

export async function obrisiSadrzajPriPrestanku(
  tx: Tx,
  userId: string,
  walletId: string | null,
): Promise<ObrisanSadrzaj> {
  // 1. Operativni doprinos (Politika čl. 30 st. 5).
  await tx.oglasPrijava.updateMany({
    where: { userId, planIzvrsenja: { not: null } },
    data: { planIzvrsenja: null },
  });
  const evidencije = await tx.oglasEvidencija.findMany({
    where: { userId, dokaz: { not: null } },
    select: { dokaz: true },
  });
  await tx.oglasEvidencija.updateMany({
    where: { userId },
    data: { dokaz: null, description: "" },
  });

  // 2. Prigovori, prijave oglasa i prijave razmene (Politika čl. 32 st. 7).
  await tx.prigovorNaOdluku.updateMany({ where: { userId }, data: { opis: "" } });
  await tx.prijavaOglasa.updateMany({ where: { prijaviocId: userId }, data: { opis: null } });
  await tx.prijavaRazmene.updateMany({ where: { prijaviocId: userId }, data: { opis: "" } });
  await tx.prijavaRazmene.updateMany({
    where: { protivId: userId, odgovorProtiv: { not: null } },
    data: { odgovorProtiv: null },
  });

  // 3. Prijava greške se briše u celini.
  await tx.bug.deleteMany({ where: { userId } });

  // 4. Prijave lažnog roditeljstva (Politika čl. 38 st. 4).
  await tx.prijavaRoditeljstva.deleteMany({ where: { deteId: userId } });
  const prijave = await tx.prijavaRoditeljstva.findMany({
    where: { podnosilacId: userId },
    select: { id: true, dete: { select: { status: true, deaktiviranAt: true } } },
  });
  const zaBrisanje: string[] = [];
  const zaZadrzati: string[] = [];
  for (const p of prijave) {
    const postoji = p.dete.status !== UserStatus.EXCLUDED && !p.dete.deaktiviranAt;
    (sudbinaPrijaveRoditeljstva(postoji) === "OBRISI" ? zaBrisanje : zaZadrzati).push(p.id);
  }
  if (zaBrisanje.length > 0) await tx.prijavaRoditeljstva.deleteMany({ where: { id: { in: zaBrisanje } } });
  if (zaZadrzati.length > 0) {
    await tx.prijavaRoditeljstva.updateMany({ where: { id: { in: zaZadrzati } }, data: { opis: "" } });
  }

  // 5. Slobodan tekst uz prepis deteta koji je čekao roditelja (Politika čl. 42 st. 2:
  // tekst uz prepis briše se prestankom statusa bilo koje strane) i praćene kategorije
  // oglasa (dobrovoljno uneti podaci).
  await tx.prepisOdobrenje.updateMany({
    where: { OR: [{ deteId: userId }, { primalacId: userId }], opis: { not: null } },
    data: { opis: null },
  });
  await tx.followedCategory.deleteMany({ where: { userId } });

  // 6. Opis zapisa koji sadrži podatak o ličnosti (Pravilnik čl. 55 st. 2).
  if (walletId) {
    await tx.transaction.updateMany({
      where: {
        type: { in: [...TIPOVI_OPISA_SA_PODATKOM_O_LICNOSTI] },
        OR: [{ fromWalletId: walletId }, { toWalletId: walletId }],
      },
      data: { description: null, opisKljuc: null, opisParametri: Prisma.DbNull },
    });
  }

  return { slike: evidencije.map((e) => e.dokaz).filter((d): d is string => !!d) };
}
