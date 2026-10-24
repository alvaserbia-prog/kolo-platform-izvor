import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { razresiSkolu } from "@/lib/skola";
import SkolaKlijent from "./SkolaKlijent";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("skole");
  return { title: t("naslov") };
}

export default async function SkolaPage({
  params,
}: {
  params: Promise<{ sifra: string }>;
}) {
  const { sifra } = await params;
  // Šifra se proverava već ovde, da nepostojeća adresa da 404 umesto praznog
  // ekrana koji tek posle učitavanja kaže da škole nema.
  if (!razresiSkolu(sifra)) notFound();
  return <SkolaKlijent sifra={sifra} />;
}
