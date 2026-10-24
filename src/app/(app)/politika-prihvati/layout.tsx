import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("politikaPrihvati");
  return { title: t("naslov") };
}

/** Stranica je klijentska, pa naslov kartice nosi ovaj raspored; sadržaj prolazi nepromenjen. */
export default function Raspored({ children }: { children: React.ReactNode }) {
  return children;
}
