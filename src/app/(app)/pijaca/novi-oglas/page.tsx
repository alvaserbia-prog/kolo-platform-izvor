import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NoviOglasForma from "./NoviOglasForma";
import { upravljackoClanstvo } from "@/lib/protokol/gazdinstvo";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pijaca");
  return { title: t("novi_oglas") };
}

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
  // razlikuje se samo vidljivost (Pravilnik o učešću dece čl. 24 st. 1). Ograničenja za
  // nepotvrđen nalog postoje zbog naloga iza kog niko ne stoji; iza deteta stoje
  // roditelj i svi koji su roditelja potvrdili.
  const verifikovan = (korisnik?.verified ?? false) || (korisnik?.maloletan ?? false);

  // Član gazdinstva bira da li oglas postavlja u ime gazdinstva ili kao lični (gazdinstva čl. 18 st. 1).
  // Samo član koji upravlja gazdinstvom (gazdinstva čl. 11, 14).
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
      // R-07 M-5″: napomena o dobrima koja dete ne sme da nudi (Uslovi čl. 23 st. 3).
      maloletan={korisnik?.maloletan ?? false}
    />
  );
}
