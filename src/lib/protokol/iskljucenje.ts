import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { jeSuperadmin } from "@/lib/dozvole";
import { ugasiOznakeNaloga, poslediceIzlaskaNaloga } from "./izlaz-naloga";
import { sacuvajNegativanZapisPriPrestanku } from "./negativan-zapis-prestanak";

/**
 * Isključenje korisnika iz sistema (Uslovi čl. 32): prestanak statusa odlukom
 * Fondacije (Pravilnik čl. 32).
 *
 * Izdvojeno iz rute `/api/admin/korisnici/[id]/iskljuci` kad je uvedeno drugo
 * mesto koje isključuje — poništenje odobrenja gazdinstva isključuje SVE članove
 * (Pravilnik o gazdinstvima čl. 20). Dva mesta sa sopstvenom kopijom koraka bi se
 * razišla pri prvoj izmeni.
 *
 * 🔴 Sve što prestankom statusa mora da se ugasi (keš statusa, spisak za poziv,
 * preporuke, evidencija identiteta, zadruga, delegiranje, programi…) gasi
 * `ugasiOznakeNaloga`, u ISTOJ transakciji sa upisom `EXCLUDED`; posledice idu VAN
 * nje (`poslediceIzlaskaNaloga`). Isto zovu gašenje naloga i utvrđenje da iza
 * naloga ne stoji stvarna osoba. Brana: `__tests__/izlaz-naloga-izvor.test.ts`.
 *
 * Vraća `false` kad nema šta da se uradi (nema naloga, već isključen, admin).
 */
export async function iskljuciKorisnika(adminId: string, userId: string, razlog: string): Promise<boolean> {
  const korisnik = await prisma.user.findUnique({
    where: { id: userId },
    select: { admin: true, status: true, pseudonim: true },
  });
  if (!korisnik || jeSuperadmin(korisnik) || korisnik.status === "EXCLUDED") return false;

  const izlaz = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        status: "EXCLUDED",
        suspendedAt: new Date(),
        suspendedReason: razlog || "Isključenje (Pravilnik čl. 32)",
      },
    });
    // 🔴 Negativan zapis pri isključenju (Pravilnik čl. 33 st. 7): PRE brisanja imena u
    // `ugasiOznakeNaloga` čuva se odvojeno, sa iznosom, mestom i brojem, pet godina.
    await sacuvajNegativanZapisPriPrestanku(tx, userId, "ISKLJUCENJE");
    return ugasiOznakeNaloga(tx, userId);
  });
  await poslediceIzlaskaNaloga(userId, izlaz);

  await logAdminAkcija(adminId, "KORISNIK_ISKLJUCEN", userId, `${korisnik.pseudonim}${razlog ? ": " + razlog : ""}`);
  return true;
}
