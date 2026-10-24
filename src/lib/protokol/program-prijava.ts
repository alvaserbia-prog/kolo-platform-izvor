/**
 * Okončanje prijave na socijalni program.
 *
 * Jedno mesto za sve ishode koji prijavu skidaju sa evidentiranja — odbijanje
 * Fondacije, odbijanje verifikatora, obustava po reviziji ili padu indeksa i
 * povlačenje pristanka. Postoji zato što svaki od tih ishoda mora da uradi tri
 * stvari, a do ovog seta je svaki radio samo prvu.
 */
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { zatvoriPostupakPotvrda } from "./program-potvrda";

/**
 * Prevede prijavu u REJECTED odnosno INACTIVE, **obriše unete podatke** i zatvori
 * postupak potvrda.
 *
 * 🔴 `metadata` se briše, ne zadržava. Registar radnji obrade rok čuvanja ovih
 * podataka vezuje za trajanje osnova (izričit pristanak, čl. 4); kad prijava
 * prestane da važi, osnova nema, a u `metadata` stoje posebne kategorije —
 * datumi rođenja dece, datum rešenja o invaliditetu, naziv ustanove. Bez ovoga
 * ih zauvek zadržava svako ko je odbijen, kome je istekla reverifikacija ili je
 * jednostavno otišao, jer se rok gasio samo povlačenjem pristanka.
 *
 * Ponovna prijava iz REJECTED/INACTIVE ionako iznova unosi podatke i iznova
 * prolazi kroz potvrdu svih verifikatora, pa se brisanjem ne gubi ništa što bi
 * kasnije zatrebalo.
 */
export async function okoncajPrijavu(
  enrollmentId: string,
  opcije: {
    status: "REJECTED" | "INACTIVE";
    razlog: string | null;
    /** Pristanak je povučen — gasi se i sam pristanak, ne samo prijava. */
    povucenPristanak?: boolean;
  },
): Promise<void> {
  await prisma.programEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: opcije.status,
      rejectionReason: opcije.razlog,
      metadata: Prisma.DbNull,
      // 🔴 Pri povlačenju se upisuje TRENUTAK, a `pristanakVerifikatori` ostaje
      // `true` (R-06). Pristanak jeste bio dat, a opoziv po ZZPL čl. 15 st. 3 ne
      // utiče na zakonitost obrade pre opoziva — pa dokaz da je postojao mora da
      // ostane. Do 4.6.3 se logička vrednost gasila, čime je zapis tvrdio da
      // pristanka nikad nije ni bilo. `pristanakTekst` se iz istog razloga ne briše
      // zajedno sa `metadata`: tekst nije podatak o korisniku nego dokaz rukovaoca.
      ...(opcije.povucenPristanak ? { pristanakPovucenAt: new Date() } : {}),
    },
  });
  await zatvoriPostupakPotvrda(enrollmentId);
}
