import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { SistemskiEkran } from "@/components/SistemskiEkran";
import { NEMA_STRANICE, normalizujJezik } from "@/lib/ekran-poruke";

export const metadata: Metadata = {
  title: "Stranica nije pronađena",
  robots: { index: false, follow: false },
};

/**
 * 404 — ranije je ovde bila Next-ova podrazumevana crno-bela stranica.
 *
 * Poruka je NAMERNO drugačija od one na padu sistema: pogrešna adresa nije
 * kvar, pa bi „radovi u toku" ovde bilo netačno i bez potrebe bi zabrinulo
 * korisnika. Izgled je isti da sajt ostane jedinstven.
 */
export default async function NotFound() {
  const jezik = normalizujJezik(await getLocale());
  return <SistemskiEkran tekst={NEMA_STRANICE[jezik]} />;
}
