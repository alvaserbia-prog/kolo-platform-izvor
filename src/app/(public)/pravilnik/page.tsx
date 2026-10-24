import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pravne");
  return pageMetadata({
    title: t("meta_pravilnik_title"),
    description: t("meta_pravilnik_desc"),
    path: "/pravilnik",
  });
}

/**
 * Pravilnici u tri grupe, poređane po tome šta čovek prvo treba da pročita.
 *
 * Do 03.09.2026. je ovde stajao ravan spisak od deset akata, svih deset u istoj
 * težini. Ko otvori tu stranu ne zna odakle da počne, pa najčešće ne počne
 * nigde — a prva tri akta odgovaraju na pitanje šta je sistem, dok ostalih
 * sedam razrađuju pojedine delove. Redosled unutar grupa je nepromenjen.
 *
 * Nazivi i opisi samih pravilnika i dalje se čitaju iz `pravne.rb.<slug>`;
 * naslovi grupa iz `pravne.grupa<n>_naslov` i `_opis`.
 */
const GRUPE = [
  { kljuc: "grupa1", slugovi: ["kolo-sistem", "dokaz-stvarnosti", "hijerarhija"] },
  { kljuc: "grupa2", slugovi: ["operativni", "osnivacki", "pokroviteljstvo-donacije", "programi-podrske"] },
  { kljuc: "grupa3", slugovi: ["gornje-kolo", "projekti-nabavke", "zadruge", "gazdinstva", "ucesce-dece"] },
] as const;

export default async function PravilniciIndex() {
  const t = await getTranslations("pravne");

  return (
    <div className="max-w-uska mx-auto pb-16">

      <div className="mb-8">
        <p className="text-xs text-kolo-muted mb-1">{t("eyebrow")}</p>
        <h1 className="kolo-naslov text-kolo-green-900">
          {t("pravilnik.naslov")}
        </h1>
        <p className="text-sm text-kolo-muted mt-2">{t("verzija")} {t("pravilnik.ver")}</p>
        <div className="mt-4 flex gap-3 text-sm flex-wrap">
          <span className="text-kolo-muted">{t("viditeI")}</span>
          <Link href="/statut" className="text-kolo-green-700 hover:underline">{t("link.statut")}</Link>
          <Link href="/whitepaper" className="text-kolo-green-700 hover:underline">{t("link.whitepaper")}</Link>
          <Link href="/privatnost" className="text-kolo-green-700 hover:underline">{t("link.privatnost")}</Link>
          <Link href="/uslovi" className="text-kolo-green-700 hover:underline">{t("link.uslovi")}</Link>
          <Link href="/dpia" className="text-kolo-green-700 hover:underline">{t("link.dpiaKratko")}</Link>
          <Link href="/radnje-obrade" className="text-kolo-green-700 hover:underline">{t("link.radnjeObrade")}</Link>
          <Link href="/rizici" className="text-kolo-green-700 hover:underline">{t("link.rizici")}</Link>
          <Link href="/zajednicko-dobro" className="text-kolo-green-700 hover:underline">{t("link.zajednickoDobro")}</Link>
        </div>
      </div>

      <div className="space-y-8">
        {GRUPE.map((grupa) => (
          <section key={grupa.kljuc} className="space-y-3">
            <div>
              <h2 className="text-sm font-bold tracking-widest text-kolo-muted uppercase">
                {t(`${grupa.kljuc}_naslov`)}
              </h2>
              <p className="text-sm text-kolo-muted leading-relaxed mt-1">
                {t(`${grupa.kljuc}_opis`)}
              </p>
            </div>
            {grupa.slugovi.map((slug) => (
              <Link
                key={slug}
                href={`/pravilnik/${slug}`}
                className="block bg-kolo-surface border border-kolo-border border-t-4 border-t-kolo-green-700 rounded-kartica shadow-kartica p-5 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-kolo-green-900 text-lg leading-snug mb-2 tracking-tight">
                  {t(`rb.${slug}.naziv`)}
                </h3>
                <p className="text-sm text-kolo-muted leading-relaxed">
                  {t(`rb.${slug}.opis`)}
                </p>
                <p className="text-sm font-medium text-kolo-green-700 mt-3">{t("otvoriDokument")}</p>
              </Link>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-kolo-border flex flex-wrap gap-4 text-sm text-kolo-muted">
        <Link href="/" className="hover:text-kolo-green-700 transition-colors">
          {t("nazadNaPocetnu")}
        </Link>
      </div>
    </div>
  );
}
