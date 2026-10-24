import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deca");
  return { title: t("naslov") };
}

/**
 * Stara adresa ekrana izjašnjenja o postojanju deteta (postupak od 60 dana, ukinut
 * setom 4.8.2). Zahtevi za potvrdu postojanja deteta sada stoje na stranici Potvrde
 * (Pravilnik o učešću dece čl. 6 st. 3). Adresa ostaje zbog starih linkova iz
 * obaveštenja i mejlova (CLAUDE.md pravilo 12).
 */
export default function PotvrdePage() {
  redirect("/verifikacija#postojanje-deteta");
}
