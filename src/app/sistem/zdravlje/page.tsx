import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { danasnjeStanje, nizPoDanima } from "@/lib/protokol/pokazatelji";
import Stranica from "@/components/ui/Stranica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import PokazateljiSistemaKartica from "@/components/PokazateljiSistemaKartica";
import KretanjeKlijent from "./KretanjeKlijent";

/**
 * Kretanje pokazatelja sistema po danima i mesecima (odluka vlasnika 15.11.2026).
 * Adresa je ostala `/sistem/zdravlje` da stare veze rade (pravilo 12); ranija
 * stranica „Zdravlje sistema“ sa lampicama je uklonjena. Javna kao i `/sistem`.
 *
 * 🔴 Samo zbirni brojevi, bez ijednog dinarskog iznosa (R-01) i bez podatka po licu.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pokazatelji_sistema");
  return pageMetadata({ title: `${t("kretanje_naslov")} — KOLO`, description: t("meta_opis"), path: "/sistem/zdravlje" });
}

export default async function KretanjePokazateljaPage() {
  const [t, danas, niz] = await Promise.all([getTranslations("pokazatelji_sistema"), danasnjeStanje(), nizPoDanima()]);
  // Današnji dan još nije zatvoren: na grafikonu je poslednja tačka.
  const saDanasnjim = niz.some((d) => d.dan === danas.dan) ? niz : [...niz, { ...danas, naknadno: false }];

  return (
    <Stranica sirina="siroka">
      <NaslovStranice nazad={{ href: "/sistem", oznaka: t("nazad") }} naslov={t("kretanje_naslov")} opis={t("kretanje_opis")} />
      <PokazateljiSistemaKartica dan={danas.dan} sirovo={danas.sirovo} />
      <KretanjeKlijent niz={saDanasnjim} />
    </Stranica>
  );
}
