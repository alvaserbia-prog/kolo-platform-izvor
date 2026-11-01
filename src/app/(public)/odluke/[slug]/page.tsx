import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "@/i18n/navigation";
import { pageMetadata } from "@/lib/seo";
import { ODLUKE, nadjiOdluku, ucitajOdluku } from "@/lib/odluke-fondacije";

export function generateStaticParams() {
  return ODLUKE.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = nadjiOdluku(slug);
  if (!o) return {};
  const t = await getTranslations("odluke");
  return pageMetadata({
    title: `${t(`stavke.${o.slug}.naziv`)} · KOLO`,
    description: t(`stavke.${o.slug}.opis`),
    path: `/odluke/${o.slug}`,
  });
}

export default async function OdlukaStranica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = nadjiOdluku(slug);
  if (!o) notFound();
  const locale = await getLocale();
  const t = await getTranslations("odluke");
  const sadrzaj = await ucitajOdluku(o);

  return (
    <div className="max-w-uska mx-auto pb-16">
      <div className="mb-8">
        <Link href="/odluke" className="text-sm text-kolo-green-700 hover:underline">{t("nazad")}</Link>
        <h1 className="kolo-naslov text-kolo-green-900 mt-3">{t(`stavke.${o.slug}.naziv`)}</h1>
        <p className="text-sm text-kolo-muted mt-2">{t("broj_datum", { broj: o.broj, datum: o.doneta })}</p>
        <p className="text-sm text-kolo-muted">{t("objavljena", { datum: o.objavljena })}</p>
        {!locale.startsWith("sr") && (
          <p className="text-sm text-kolo-muted mt-3 italic">{t("samo_srpski")}</p>
        )}
      </div>

      <article
        className="
          text-sm text-kolo-text leading-relaxed text-body
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-kolo-green-900 [&_h1]:mb-6 [&_h1]:mt-8
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-kolo-green-900 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-kolo-border
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-kolo-green-900 [&_h3]:mb-3 [&_h3]:mt-6
          [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
          [&_li]:leading-relaxed
          [&_strong]:font-semibold [&_strong]:text-kolo-text
          [&_em]:italic
        "
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{sadrzaj}</ReactMarkdown>
      </article>
    </div>
  );
}
