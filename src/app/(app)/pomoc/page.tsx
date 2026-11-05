import { getTranslations } from "next-intl/server";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Kartica from "@/components/ui/Kartica";
import Stranica from "@/components/ui/Stranica";

export async function generateMetadata() {
  const t = await getTranslations("pomoc");
  return { title: `${t("naslov")} — KOLO` };
}

/**
 * Pomoć — jedan ulaz za vodič, česta pitanja i prijavu greške (revizija teksta,
 * uloga 1, 23.10.2026). Do tada su stajali na četiri mesta: „?“ u zaglavlju
 * (vodič), „Česta pitanja“ u meniju profila i na dnu bočnog menija, „Prijavi
 * grešku“ u zaglavlju. Na ovu stranicu vode „?“ u zaglavlju i stavka na dnu menija.
 */
export default async function PomocPage() {
  const t = await getTranslations("pomoc");
  const stavke = [
    { href: "/dobrodosli", naslov: t("vodic_naslov"), opis: t("vodic_opis") },
    { href: "/cesto-postavljena-pitanja", naslov: t("faq_naslov"), opis: t("faq_opis") },
    { href: "/kako-funkcionise", naslov: t("kako_naslov"), opis: t("kako_opis") },
    { href: "/bagovi", naslov: t("bagovi_naslov"), opis: t("bagovi_opis") },
  ];
  return (
    <Stranica>
      <NaslovStranice naslov={t("naslov")} opis={t("opis")} />
      <div className="grid gap-3 sm:grid-cols-2">
        {stavke.map((s) => (
          <Kartica key={s.href} href={s.href} className="h-full">
            <p className="font-semibold text-kolo-text">{s.naslov} →</p>
            <p className="mt-1 text-sm text-kolo-muted">{s.opis}</p>
          </Kartica>
        ))}
      </div>
    </Stranica>
  );
}
