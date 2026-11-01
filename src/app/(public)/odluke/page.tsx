import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import Kartica from "@/components/ui/Kartica";
import { ODLUKE } from "@/lib/odluke-fondacije";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("odluke");
  return pageMetadata({
    title: t("meta_title"),
    description: t("meta_desc"),
    path: "/odluke",
  });
}

/**
 * Odluke Upravnog odbora objavljene po Statutu čl. 21 i 22 st. 4. Akti platforme
 * su na `/pravilnik`; ovde su odluke Fondacije kao pravnog lica. Spisak i datumi
 * su u `src/lib/odluke-fondacije.ts`, naslovi i opisi u `odluke.stavke.<slug>`.
 */
export default async function OdlukeIndex() {
  const t = await getTranslations("odluke");
  const tp = await getTranslations("pravne");

  return (
    <div className="max-w-uska mx-auto pb-16">
      <div className="mb-8">
        <p className="text-xs text-kolo-muted mb-1">{tp("eyebrow")}</p>
        <h1 className="kolo-naslov text-kolo-green-900">{t("naslov")}</h1>
        <p className="text-sm text-kolo-text leading-relaxed mt-3">{t("uvod")}</p>
        <div className="mt-4 flex gap-3 text-sm flex-wrap">
          <span className="text-kolo-muted">{tp("viditeI")}</span>
          <Link href="/statut" className="text-kolo-green-700 hover:underline">{tp("link.statut")}</Link>
          <Link href="/pravilnik" className="text-kolo-green-700 hover:underline">{tp("link.pravilnikJed")}</Link>
        </div>
      </div>

      <ul className="space-y-3">
        {ODLUKE.map((o) => (
          <Kartica as="li" key={o.slug}>
            <Link href={`/odluke/${o.slug}`} className="block">
              <p className="text-xs text-kolo-muted mb-1">
                {t("broj_datum", { broj: o.broj, datum: o.doneta })}
              </p>
              <h2 className="font-bold text-kolo-green-900 text-lg leading-snug mb-2 tracking-tight">
                {t(`stavke.${o.slug}.naziv`)}
              </h2>
              <p className="text-sm text-kolo-muted leading-relaxed">{t(`stavke.${o.slug}.opis`)}</p>
              <p className="text-sm font-medium text-kolo-green-700 mt-3">{tp("otvoriDokument")}</p>
            </Link>
          </Kartica>
        ))}
      </ul>
    </div>
  );
}
