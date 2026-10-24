/**
 * Potvrda ispunjenosti uslova socijalnih programa (anti-malverzacija).
 *
 * Prijava na socijalni program (Pravilnik o programima podrške čl. 4, set 4.8.2):
 *  - pravo ostvaruje VERIFIKOVAN učesnik (član bez potvrde, član Kola, čuvar Kola,
 *    osnivač) — st. 1;
 *  - izričit pristanak podnosioca pre nego što se od bilo koga zatraži potvrda;
 *  - ispunjenost uslova potvrđuje ČLAN KOLA, odnosno osnivač, koji podnosioca
 *    LIČNO zna — verifikator koji ga je potvrdio, ili drugi član Kola koji ga lično
 *    zna — odnosno Fondacija (st. 2). 🔴 Ne potvrđuje je član Kola koji je
 *    podnosioca samo uveo u Kolo posle razgovora telefonom (dokaz stvarnosti čl.
 *    5a st. 1), ni član bez potvrde (Pravilnik čl. 28a). Potvrđivači ne vide
 *    unete podatke; odbijanje traži obrazloženje.
 *  - Ako ih je više (zatečene višestruke verifikacije, dokaz stvarnosti čl. 22),
 *    potvrda se traži od svih, a dovoljna je potvrda jednog.
 *  - Kad podobnog potvrđivača nema, odlučuje Fondacija uz obrazloženje
 *    (`potvrdiUsloveFondacija`; otvoreno pitanje 18 specifikacije).
 *
 * Tvrda blokada: admin ne može da odobri prijavu dok ispunjenost uslova nije potvrđena.
 */
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { potvrdjenIzPolja } from "@/lib/status-ucesnika-pravila";

/**
 * Ključ obaveštenja kojim se od verifikatora traži potvrda socijalnog programa.
 * Deljen između rute koja ga šalje i `zatvoriPostupakPotvrda`, koja ga po
 * okončanju postupka briše — i zaključan testom, da se ne raziđu.
 */
export const KLJUC_ZAHTEV_POTVRDA = "notifikacije.zahtev_potvrda_programa";

type TxLike = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Ko sme da potvrdi ispunjenost uslova programa za datog učesnika (programi čl. 4
 * st. 2, čl. 13 st. 4; tabela dozvola br. 22). Unija:
 *
 *  - verifikatori veza vrste POTVRDA (potvrdili su ga kao ljudi koji ga lično znaju);
 *  - verifikatori uvođenja koje je obavio član bez potvrde (uvodi samo onoga koga
 *    lično zna, Pravilnik čl. 28a st. 2), a koji su DANAS član Kola;
 *  - članovi Kola koji su ga potvrdili kao člana bez potvrde (`PotvrdaClana`,
 *    izvor CLAN_KOLA, živa).
 *
 * Svi moraju DANAS biti član Kola, čuvar Kola ili osnivač. 🔴 Ne ulaze: uvođenje
 * posle razgovora telefonom (`poPozivu`), član bez potvrde i korisnik. Prazan
 * skup znači da odlučuje Fondacija.
 */
export async function dohvatiPotvrdioceUslova(
  tx: TxLike,
  korisnikId: string
): Promise<string[]> {
  const [veze, potvrde] = await Promise.all([
    tx.verifikacionaVeza.findMany({
      where: {
        verifikovaniId: korisnikId,
        OR: [
          { vrsta: "POTVRDA" },
          { vrsta: "UVODJENJE", poPozivu: false, verifikatorBezPotvrde: true },
        ],
      },
      select: { verifikatorId: true },
    }),
    tx.potvrdaClana.findMany({
      where: { potvrdjeniId: korisnikId, izvor: "CLAN_KOLA", aktivnaKljuc: { not: null }, potvrdioId: { not: null } },
      select: { potvrdioId: true },
    }),
  ]);
  const kandidati = [
    ...new Set([
      ...veze.map((v) => v.verifikatorId),
      ...potvrde.map((p) => p.potvrdioId!),
    ]),
  ].filter((id) => id !== korisnikId);
  if (kandidati.length === 0) return [];
  const korisnici = await tx.user.findMany({
    where: { id: { in: kandidati }, status: "ACTIVE", deaktiviranAt: null },
    select: { id: true, maloletan: true, jeOsnivac: true, verified: true, indeksStvarnosti: true, potvrdjenAt: true },
  });
  const podobni = new Set(korisnici.filter((k) => potvrdjenIzPolja(k)).map((k) => k.id));
  return kandidati.filter((id) => podobni.has(id));
}

/**
 * Fondacija potvrđuje ispunjenost uslova kad podnosilac nema podobnog potvrđivača
 * (programi čl. 4 st. 2 „odnosno Fondacija"). Obrazloženje je obavezno i snima se
 * u potvrdu; upisuje superadmin, jedini koji vidi unete podatke (DPIA 5.6).
 *
 * Potvrda Fondacije nosi `odFondacije = true`, a `verifikatorId` je administrator
 * koji je odluku upisao. Dozvoljeno je samo kad za prijavu nema nijednog zahteva
 * članu Kola.
 */

export async function potvrdiUsloveFondacija(
  enrollmentId: string,
  adminId: string,
  obrazlozenje: string,
): Promise<void> {
  const o = (obrazlozenje ?? "").trim();
  if (o.length < 10) throw new Error("Obrazloženje odluke Fondacije je obavezno.");
  await prisma.$transaction(async (tx) => {
    const postoji = await tx.programPotvrda.count({ where: { enrollmentId } });
    if (postoji > 0) throw new Error("Ispunjenost uslova potvrđuje član Kola kome je zahtev upućen.");
    await tx.programPotvrda.create({
      data: {
        enrollmentId,
        verifikatorId: adminId,
        status: "POTVRDJENO",
        obrazlozenje: o,
        odFondacije: true,
        odgovorAt: new Date(),
      },
    });
  });
}

/**
 * Kreira po jednu potvrdu (CEKA) za svakog verifikatora prijavljenog korisnika.
 * Vraća listu verifikatora kojima treba poslati notifikaciju.
 */
export async function kreirajPotvrde(
  tx: TxLike,
  enrollmentId: string,
  verifikatorIds: string[]
): Promise<void> {
  if (verifikatorIds.length === 0) return;
  const data: Prisma.ProgramPotvrdaCreateManyInput[] = verifikatorIds.map(
    (verifikatorId) => ({ enrollmentId, verifikatorId })
  );
  await tx.programPotvrda.createMany({ data, skipDuplicates: true });
}

/**
 * Zatvori postupak potvrda za prijavu: briše nedovršene (CEKA) potvrde i SVA
 * obaveštenja kojima je od verifikatora tražena potvrda te prijave.
 *
 * 🔴 Zove se pri SVAKOM okončanju postupka — odobrenju, odbijanju (i od strane
 * Fondacije i od strane verifikatora), obustavi i povlačenju pristanka. Bez toga
 * podatak o tome za koji se program neko prijavio ostaje verifikatorima u zvoncetu
 * i u spisku zahteva zauvek, iako postupka više nema; naziv programa otkriva
 * pripadnost posebnoj kategoriji podataka (čl. 4 st. 3, DPIA R11), pa je to
 * obrada koja traje bez svrhe.
 *
 * Nedovršene potvrde se BRIŠU, ne označavaju: bez odgovora nemaju dokaznu
 * vrednost, a odgovorene (POTVRDJENO/ODBIJENO) ostaju — one su trag ko je i šta
 * potvrdio pod punom odgovornošću.
 *
 * 🟡 Obaveštenja poslata pre uvođenja `enrollmentId` u parametre nemaju po čemu
 * da se pogode i ostaju u zvoncetu.
 */
export async function zatvoriPostupakPotvrda(enrollmentId: string): Promise<void> {
  await prisma.programPotvrda.deleteMany({ where: { enrollmentId, status: "CEKA" } });
  await prisma.notifikacija.deleteMany({
    where: {
      kljuc: KLJUC_ZAHTEV_POTVRDA,
      parametri: { path: ["enrollmentId"], equals: enrollmentId },
    },
  });
}
