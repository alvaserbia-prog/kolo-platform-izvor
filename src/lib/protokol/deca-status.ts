/**
 * Posledice promene statusa roditelja po njegovu decu (Pravilnik o učešću dece
 * čl. 5, 6, 13; set 4.8.2).
 *
 * Stanje naloga deteta se NE čuva — izvodi se iz položaja roditelja i potvrde
 * postojanja (`stanjeDeteta` u `deca-pravila.ts`). Zato ovde nema upisa stanja:
 *
 *  - kad roditelj postane član Kola (ili ponovo bude potvrđen): obaveštenje da
 *    zatraži potvrdu postojanja za decu za koju je još nije tražio (čl. 13 st. 1),
 *    i osvežavanje prijateljstava dece — ako mu je postojanje već potvrđeno, deca
 *    upravo postaju deca Kola, pa doprinos iz čl. 33 sazreva;
 *  - kad potvrđenost padne: ništa se ne briše (čl. 6 st. 2) — nalog deteta sam
 *    prelazi u „dete sa roditeljem", nalog roditelja se ne dira (čl. 6 st. 2). Već
 *    evidentiran doprinos iz čl. 33 se ne otpisuje.
 *
 * Zove ga `posledicePromeneStatusa()` VAN transakcije; ne baca.
 */
import { jePotvrdjen, type StatusUcesnika } from "@/lib/status-ucesnika-pravila";

export async function posleStatusaRoditelja(
  roditeljId: string,
  pre: StatusUcesnika,
  posle: StatusUcesnika,
): Promise<void> {
  if (jePotvrdjen(pre) === jePotvrdjen(posle)) return;
  try {
    const { prisma } = await import("@/lib/prisma");
    const imaDecu = await prisma.roditeljstvo.count({
      where: { roditeljId, dete: { maloletan: true, deaktiviranAt: null } },
    });
    if (imaDecu === 0) return;

    if (jePotvrdjen(posle)) {
      const { osveziPrijateljstvaDece } = await import("./prijateljstva");
      await osveziPrijateljstvaDece(roditeljId);
      const { javiDaZatraziPotvrdu } = await import("./deca");
      await javiDaZatraziPotvrdu(roditeljId);
    }
    // Pad potvrđenosti: ništa se ne upisuje i ne briše (čl. 6 st. 2).
  } catch (e) {
    console.error("[deca-status] posledice po decu nisu izvršene", roditeljId, e);
  }
}
