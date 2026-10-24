import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NoviOglasForma from "./NoviOglasForma";
import { upravljackoClanstvo } from "@/lib/protokol/gazdinstvo";

export default async function NoviOglasPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string; gazdinstvo?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { tip, gazdinstvo: gazdinstvoParam } = await searchParams;

  // Forma je otvorena i neverifikovanom korisniku (Pravilnik 4.1.1 čl. 16 st. 5).
  // Verifikovanost se čita IZ BAZE, ne iz sesije: token se osvežava sa zakašnjenjem,
  // pa bi tek verifikovan korisnik još neko vreme gledao zaključan izbor tipa oglasa.
  const korisnik = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { location: true, telefon: true, verified: true, maloletan: true },
  });
  // Za oglas maloletnog korisnika važe isti uslovi objave kao za svaki drugi —
  // razlikuje se samo vidljivost (Modul Deca, čl. 13 st. 1). Ograničenja za
  // nepotvrđen nalog postoje zbog naloga iza kog niko ne stoji; iza deteta stoje
  // roditelj i svi koji su roditelja potvrdili.
  const verifikovan = (korisnik?.verified ?? false) || (korisnik?.maloletan ?? false);

  // Član gazdinstva bira da li oglas postavlja u ime gazdinstva ili kao lični (čl. 10).
  // Samo član koji upravlja gazdinstvom (čl. 9 st. 1, 9a).
  const clanstvo = await upravljackoClanstvo(session.user.id);
  const gazdinstvo = clanstvo ? { id: clanstvo.gazdinstvo.id, naziv: clanstvo.gazdinstvo.naziv } : null;

  return (
    <NoviOglasForma
      gazdinstvo={gazdinstvo}
      uImeGazdinstva={!!gazdinstvo && gazdinstvoParam === gazdinstvo.id}
      defaultLocation={korisnik?.location ?? ""}
      defaultPhone={korisnik?.telefon ?? ""}
      initialTip={tip?.toUpperCase() === "POTRAZNJA" ? "POTRAZNJA" : "PONUDA"}
      verifikovan={verifikovan}
      // R-07 M-5″: napomena o dobrima koja dete ne sme da nudi (Uslovi čl. 21).
      maloletan={korisnik?.maloletan ?? false}
    />
  );
}
