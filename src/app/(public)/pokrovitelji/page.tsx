import { javnaRangListaNovca } from "@/lib/protokol/pokrovitelj";
import { intlTag } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";
import { getTranslations, getLocale } from "next-intl/server";
import { javnaRangListaDobara } from "@/lib/protokol/pokroviteljstvo-dobrima";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pokroviteljPage");
  return pageMetadata({
    title: t("meta_title"),
    description: t("meta_desc"),
    path: "/pokrovitelji",
  });
}

export default async function PokroviteljiPage() {
  const locale = await getLocale();
  const t = await getTranslations("pokroviteljPage");

  // Rang-lista u dva odvojena dela (Pravilnik o pokroviteljstvu i donacijama čl. 25
  // st. 1): novčani doprinos i vrednost pokroviteljstva dobrima i uslugama. U oba
  // dela samo naziv (uz logotip, ako ga je pokrovitelj priložio — čl. 26 st. 2) i
  // iznos u dinarima — 🔴 broj POEN-a, adresa, MB, PIB i BPG se ne objavljuju
  // (čl. 25), a logotip nije link (čl. 26 st. 3).
  // Obrisan upis ostaje na rang-listi; uklanja se samo na zahtev (čl. 18 st. 4).
  const [pokrovitelji, dobra] = await Promise.all([javnaRangListaNovca(), javnaRangListaDobara()]);
  const rsd = (n: number) => `${n.toLocaleString(intlTag(locale))} RSD`;

  return (
    <div className="max-w-uska mx-auto pb-16">
      <div className="mb-6">
        <h1 className="kolo-naslov text-kolo-green-900 mb-3">{t("naslov")}</h1>
        <p className="text-kolo-muted leading-relaxed text-body">
          {t("opis")}
        </p>
      </div>

      <h2 className="text-xl font-semibold text-kolo-text mb-3">{t("novcani_naslov")}</h2>
      {pokrovitelji.length === 0 ? (
        <Kartica padding="nema">
          <PraznoStanje naslov={t("prazno_naslov")} />
        </Kartica>
      ) : (
        <div className="space-y-3">
          {pokrovitelji.map((p) => (
            <div
              key={p.id}
              className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex items-center gap-3">
                <LogotipPokrovitelja url={p.logoUrl} />
                <div className="font-semibold text-kolo-text">{p.naziv}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold text-kolo-green-700">
                  {t("nivo")} {p.trenutniNivo}
                </div>
                <div className="text-xs text-kolo-muted mt-0.5">
                  {rsd(Number(p.rsdKumulativ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold text-kolo-text mt-8 mb-1">{t("dobra_naslov")}</h2>
      <p className="text-sm text-kolo-muted mb-3">{t("dobra_opis")}</p>
      {dobra.length === 0 ? (
        <Kartica padding="nema">
          <PraznoStanje naslov={t("dobra_prazno")} />
        </Kartica>
      ) : (
        <div className="space-y-3">
          {dobra.map((d, i) => (
            <div
              key={`${i}-${d.naziv}`}
              className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex items-center gap-3">
                <LogotipPokrovitelja url={d.logoUrl} />
                <div className="font-semibold text-kolo-text">{d.naziv}</div>
              </div>
              <div className="shrink-0 text-sm text-kolo-muted">{rsd(d.vrednostRsd)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-5 bg-kolo-gold-50 border border-kolo-gold-200 rounded-kartica">
        <h2 className="font-semibold text-kolo-gold-700 mb-2">{t("postani_naslov")}</h2>
        <p className="text-sm text-kolo-muted mb-3 text-body">
          {t("postani_opis")}
        </p>
        <Link
          href="/postani-pokrovitelj"
          className={klaseDugmeta({ varijanta: "sekundarno" })}
        >
          {t("postani_cta")}
        </Link>
      </div>
    </div>
  );
}
