/**
 * Gradiran prikaz evidentiranja po socijalnom programu (Pravilnik o programima
 * podrške čl. 4 st. 4 i st. 5, set 4.6.7).
 *
 * Do tog seta su pojedinačni zapisi socijalnih programa izlazili iz SVIH spiskova,
 * a proverljivost je nosio samo dnevni zbir. Odlukom vlasnika od 25.09.2026. se
 * evidentiranje **prikazuje verifikovanim korisnicima** — pseudonim, naziv programa
 * i iznos; gostu i nepotvrđenom članu ostaje dnevni zbir.
 *
 * 🔴 Pravilo živi na JEDNOM mestu, i to je cela svrha ovog fajla. Iste zapise dižu
 * tri upita (`/sistem`, `/api/pocetna/liste`, `/api/javno/feed`), a njihov razlaz je
 * u ovom projektu već proizveo kvar: uslov o deci je postojao samo u feedu, pa je
 * `/sistem` prikazivao pseudonime dece. Pouka „ekran nije poslednja reč" zapisana je
 * četiri puta — svaki nov spisak transakcija uzima OVE dve funkcije, ne svoju kopiju.
 *
 * 🔴 Ono što se NE prikazuje nikome, ni verifikovanom: **osnov** po kome je pravo
 * ostvareno (čl. 4 st. 5). Program Posebna podrška obuhvata i smanjenu sposobnost i
 * gubitak doma, pa objavljen naziv ne kazuje koji je osnov u pitanju; prikaz osnova
 * bio bi prikaz podatka o zdravlju odnosno o prinudnoj raseljenosti. Zato ni jedna
 * funkcija ispod ne dodiruje `ProgramEnrollment.osnov`.
 */
import { Prisma, ProgramType } from "@/generated/prisma/client";
import { opisTransakcije } from "@/lib/prevod-servera";
import { labelPrograma } from "./programi";

/**
 * Prisma uslov nad `Transaction`: zapisi Protokola, po tome ko gleda.
 *
 * Zapisi Protokola = sve što nije prepis između korisnika (`TRANSFER`).
 *
 * 🔴 Zapis socijalnog programa ulazi u spisak samo verifikovanom posmatraču, i
 * samo ako nosi vezu do prijave. Bez veze se naziv programa ne može izvesti, pa
 * red ne bi mogao da izgleda kako ga čl. 4 st. 4 propisuje — a pseudonim uz
 * neimenovan „socijalni program" je prikaz koji akt ne predviđa. Takvi su zatečeni
 * redovi (veza se ne popunjava naknadno) i oni ostaju u dnevnom zbiru.
 */
export function uslovZapisaProtokola(verifikovan: boolean): Prisma.TransactionWhereInput {
  if (!verifikovan) {
    return { type: { notIn: ["TRANSFER", "EMISIJA_PROGRAM"] } };
  }
  return {
    OR: [
      { type: { notIn: ["TRANSFER", "EMISIJA_PROGRAM"] } },
      { type: "EMISIJA_PROGRAM", enrollmentId: { not: null } },
    ],
  };
}

/**
 * `include` koji uz zapis donosi prijavu na program — samo njen TIP.
 *
 * 🔴 Ne `osnov` i ne `metadata`. Ono što upit ne dovuče, prikaz ne može da oda.
 */
export const VEZA_PROGRAMA = {
  enrollment: { select: { type: true } },
} as const;

/**
 * Opis zapisa u spisku. Za zapis socijalnog programa verifikovani posmatrač dobija
 * NAZIV PROGRAMA, svi ostali opštu oznaku „Socijalni program" iz samog zapisa.
 *
 * 🔴 Naziv se sklapa pri čitanju, iz prijave. U zapis se ne upisuje (vidi
 * `OPIS_SOCIJALNOG_PROGRAMA`): zapis je trajan i ide u GDPR izvoz, pa upisan naziv
 * više nikad ne bi mogao da se suzi ako se odluka o prikazu promeni.
 */
export function opisZapisaProtokola(
  locale: string | null | undefined,
  zapis: {
    type: string;
    opisKljuc: string | null;
    opisParametri: unknown;
    description: string | null;
    enrollment?: { type: ProgramType } | null;
  },
  verifikovan: boolean,
): string | null {
  if (verifikovan && zapis.type === "EMISIJA_PROGRAM" && zapis.enrollment) {
    // Ključ `transakcije.program` postoji na svih pet jezika i već nosi isti oblik
    // („Program {program}") za operativni doprinos — nema potrebe za drugim.
    return opisTransakcije(locale, {
      opisKljuc: "transakcije.program",
      opisParametri: { program: labelPrograma(zapis.enrollment.type) },
      description: `Program ${labelPrograma(zapis.enrollment.type)}`,
    });
  }
  return opisTransakcije(locale, zapis);
}
