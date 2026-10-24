import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import Kartica from "@/components/ui/Kartica";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { dohvatiSaldoFondacije } from "@/lib/protokol/fondacija";
import { getLocale } from "next-intl/server";
import { intlTag } from "@/lib/format";

// Zbir sredstava Fondacije osvežava se na deset minuta, kao vesti.
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("podrziPage");
  return pageMetadata({
    title: t("meta_title"),
    description: t("meta_desc"),
    path: "/podrzi-kolo",
  });
}

/**
 * Jedan javni ulaz za podršku (odluka vlasnika, 22.10.2026). Do tada je onaj ko
 * želi da pomogne nailazio na pet ulaza (Doniraj, Donacije, Firme, Postani
 * pokrovitelj, Pokrovitelji) i nije znao koji je njegov.
 *
 * 🔴 Dvoja vrata ostaju DVA ODVOJENA PUTA: donacija i pokroviteljstvo su dva
 * ugovora po dva dela akta (Pravilnik o pokroviteljstvu i donacijama). Uz
 * pokroviteljstvo ne stoji ništa što liči na reklamu ili prednost: naziv i
 * logotip na rang-listi su evidencija, ne pravo pokrovitelja (donacije čl. 13).
 * U vratima piše i „udruženje" — udruženje je pokrovitelj kao i firma.
 *
 * Stranica ništa ne obrađuje: radni ekrani (`/donacije`,
 * `/postani-pokrovitelj`) ostaju gde su i sami traže prijavu.
 */
export default async function PodrziKoloPage() {
  const t = await getTranslations("podrziPage");
  // Kuda ide novac (nalaz građana, 24.10.2026): gost vidi isto što i /api/javno/fondacija.
  const [saldo, locale] = await Promise.all([dohvatiSaldoFondacije(), getLocale()]);
  const rsd = (n: number) => `${Math.round(n).toLocaleString(intlTag(locale))} RSD`;
  const novac = [
    { naziv: t("novac_priliv"), iznos: saldo.ukupanPriliv },
    { naziv: t("novac_rad"), iznos: saldo.operativniOdliv },
    { naziv: t("novac_projekti"), iznos: saldo.projektniOdliv },
    { naziv: t("novac_stanje"), iznos: saldo.saldo },
  ];

  const vrata = [
    {
      naslov: t("licno_naslov"),
      tekst: t("licno_tekst"),
      // Obrazac i lista donacija su na istoj stranici, pa drugi link ne treba.
      glavno: { href: "/donacije", label: t("licno_dugme") },
      ostalo: [],
    },
    {
      naslov: t("firma_naslov"),
      tekst: t("firma_tekst"),
      glavno: { href: "/postani-pokrovitelj", label: t("firma_dugme") },
      ostalo: [
        { href: "/pokrovitelji", label: t("firma_lista") },
        { href: "/firme", label: t("firma_firme") },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <section className="bg-kolo-green-900 rounded-kartica px-6 md:px-8 py-10 text-white">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3 tracking-tight">{t("naslov")}</h1>
        <p className="text-white/70 text-base md:text-lg max-w-2xl">{t("opis")}</p>
      </section>

      <div className="grid md:grid-cols-2 gap-4">
        {vrata.map((v) => (
          <Kartica key={v.naslov} as="section" padding="lg" className="md:p-8 flex flex-col gap-4 border-t-4 border-t-kolo-green-700">
            <h2 className="text-xl md:text-2xl font-bold text-kolo-green-900 tracking-tight">{v.naslov}</h2>
            <p className="text-sm text-kolo-text leading-relaxed text-body flex-1">{v.tekst}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href={v.glavno.href} className={klaseDugmeta()}>
                {v.glavno.label}
              </Link>
              {v.ostalo.map((o) => (
                <Link key={o.href} href={o.href} className="inline-flex min-h-9 items-center text-sm font-medium text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
                  {o.label} →
                </Link>
              ))}
            </div>
          </Kartica>
        ))}
      </div>

      <Kartica as="section" padding="lg" className="md:p-8">
        <h2 className="text-lg font-bold text-kolo-green-900 mb-2 tracking-tight">{t("novac_naslov")}</h2>
        <p className="text-sm text-kolo-muted leading-relaxed text-body mb-4">{t("novac_opis")}</p>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {novac.map((n) => (
            <div key={n.naziv} className="rounded-kontrola bg-kolo-green-50 px-3 py-2">
              <dt className="text-xs text-kolo-muted">{n.naziv}</dt>
              <dd className="text-base font-semibold text-kolo-text tabular-nums">{rsd(n.iznos)}</dd>
            </div>
          ))}
        </dl>
      </Kartica>

      <Kartica padding="lg" className="md:p-8">
        <h2 className="text-lg font-bold text-kolo-green-900 mb-2 tracking-tight">{t("znanje_naslov")}</h2>
        <p className="text-sm text-kolo-muted leading-relaxed text-body mb-3">{t("znanje_tekst")}</p>
        <Link href="/kako-funkcionise#pomozi" className="inline-flex min-h-9 items-center text-sm font-semibold text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
          {t("znanje_link")} →
        </Link>
      </Kartica>

      <p className="text-sm text-kolo-muted leading-relaxed text-center">
        {t("nalog_napomena")}{" "}
        <Link href="/pravilnik/pokroviteljstvo-donacije" className="text-kolo-green-700 hover:underline">
          {t("akt_link")}
        </Link>
      </p>
    </div>
  );
}
