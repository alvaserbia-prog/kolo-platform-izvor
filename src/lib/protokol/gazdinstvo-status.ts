/**
 * Prava gazdinstva po statusu podnosioca (Pravilnik o gazdinstvima čl. 4a, 9a;
 * set 4.8.2).
 *
 * Gazdinstvo koje je prijavio korisnik ili član bez potvrde (čl. 4a t. 2–3) radi
 * bez članova. Kad podnosilac — prvi član po redu pristupanja — postane član
 * Kola, čuvar ili osnivač, gazdinstvo od tada sme imati članove: postavlja se
 * `Gazdinstvo.smeClanoveOd` ako je null.
 *
 * 🔴 Monotono: pri padu potvrđenosti ništa se ne upisuje i ništa se ne briše
 * (čl. 9a — gazdinstvo nastavlja da radi; prava člana se izvode iz njegovog
 * statusa, `smeUpravljati`/`smePozvati`).
 *
 * Zove ga `posledicePromeneStatusa()` VAN transakcije; ne baca.
 */
import { prisma } from "@/lib/prisma";
import { ucitajStatus, jePotvrdjen } from "./status";

export async function osveziPravaGazdinstvaPoStatusu(userId: string): Promise<void> {
  try {
    const status = await ucitajStatus(userId);
    if (!status || !jePotvrdjen(status)) return;

    // Živa gazdinstva bez prava na članove u kojima je korisnik aktivan član.
    const clanstva = await prisma.clanGazdinstva.findMany({
      where: {
        userId,
        status: { in: ["PRISTUPIO", "ODOBREN"] },
        gazdinstvo: { smeClanoveOd: null, status: { in: ["NACRT", "NA_PREGLEDU", "VRACENO", "ODOBRENO"] } },
      },
      select: { gazdinstvoId: true },
    });
    for (const c of clanstva) {
      // Podnosilac = prvi član po redu pristupanja (čl. 2, čl. 8 st. 3).
      const prvi = await prisma.clanGazdinstva.findFirst({
        where: {
          gazdinstvoId: c.gazdinstvoId,
          pristupioAt: { not: null },
          status: { in: ["PRISTUPIO", "ODOBREN", "ISTUPIO"] },
        },
        orderBy: { pristupioAt: "asc" },
        select: { userId: true },
      });
      if (prvi?.userId !== userId) continue;
      await prisma.gazdinstvo.updateMany({
        where: { id: c.gazdinstvoId, smeClanoveOd: null },
        data: { smeClanoveOd: new Date() },
      });
    }
  } catch (e) {
    console.error("[gazdinstvo-status] osvežavanje prava nije uspelo", { userId, e });
  }
}
