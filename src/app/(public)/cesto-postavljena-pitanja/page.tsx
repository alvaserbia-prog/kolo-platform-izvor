import type { Metadata } from "next";
import Script from "next/script";
import FaqStranica from "@/components/FaqStranica";
import { getFaqSekcije } from "@/lib/faq-data";
import { getTranslations, getLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cestoPage");
  return pageMetadata({
    title: t("meta_title"),
    description: t("meta_desc"),
    path: "/cesto-postavljena-pitanja",
  });
}

/** Pretvara markdown odgovor u čist tekst za FAQPage schema (Google traži plain). */
function ocistiOdgovor(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [tekst](url) → tekst
    .replace(/[*_`#>]/g, "") // markdown markeri
    .replace(/\s+/g, " ") // višestruki razmaci/novi redovi
    .trim();
}

export default async function CestoPostavljenaPitanjaPage() {
  const locale = await getLocale();
  const t = await getTranslations("cestoPage");
  const faqSekcije = getFaqSekcije(locale);

  /** FAQPage strukturirani podaci — omogućava „rich result" akordeon u Google-u. */
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqSekcije.flatMap((sekcija) =>
      sekcija.pitanja.map((p) => ({
        "@type": "Question",
        name: p.pitanje,
        acceptedAnswer: {
          "@type": "Answer",
          text: ocistiOdgovor(p.odgovor),
        },
      })),
    ),
  };

  return (
    <div className="space-y-6 py-6">
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div>
        <h1
          className="text-3xl font-bold text-kolo-green-900 tracking-tight"
          style={{ letterSpacing: "-0.02em" }}
        >
          {t("naslov")}
        </h1>
        <p className="text-base text-kolo-muted mt-2 leading-relaxed max-w-2xl text-body">
          {t("opis")}
        </p>
      </div>
      <FaqStranica />
    </div>
  );
}
