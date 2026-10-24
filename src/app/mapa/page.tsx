import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { sesija } from "@/lib/sesija";
import { gazdinstvaZaMapu } from "@/lib/protokol/gazdinstvo";
import { pokroviteljiZaMapu } from "@/lib/protokol/upis-pokrovitelja";
import { sastaviTacke } from "@/lib/mapa-pravila";
import MapaZajednicka from "../gazdinstva/MapaZajednicka";
import NaslovStranice from "@/components/ui/NaslovStranice";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mapa");
  return { title: `${t("naslov")} — KOLO`, description: t("meta_opis") };
}

/**
 * Mapa — jedna mapa gazdinstava i pokrovitelja (Pravilnik o gazdinstvima čl. 11;
 * donacije čl. 13 st. 4), sa sopstvenim mestom u meniju odmah ispod Pijace i
 * Vaučera (odluka vlasnika 20.10.2026). Spisak gazdinstava i prijava ostaju na
 * `/gazdinstva`, koja mapu više ne ponavlja.
 *
 * Maloletni nalog se vraća na početnu iz istog razloga kao kod gazdinstava:
 * kartice vode na oglase i vaučere punoletnih.
 */
export default async function MapaPage() {
  const session = await sesija();
  if (session?.user.maloletan) redirect("/pocetna");
  const t = await getTranslations("mapa");
  const tg = await getTranslations("gazdinstva");

  const [gazdinstva, pokrovitelji] = await Promise.all([gazdinstvaZaMapu(), pokroviteljiZaMapu()]);

  return (
    <div className="max-w-[1000px] mx-auto pb-16 space-y-4">
      <NaslovStranice naslov={t("naslov")} opis={t("uvod")} />
      <MapaZajednicka tacke={sastaviTacke(gazdinstva, pokrovitelji)} prijavljen={!!session} />
      <p className="text-xs text-kolo-muted">{tg("mapa_napomena")}</p>
      <p className="text-sm">
        <Link href="/gazdinstva" className="font-medium text-kolo-green-700 hover:underline">
          {t("link_gazdinstva")}
        </Link>
      </p>
    </div>
  );
}
