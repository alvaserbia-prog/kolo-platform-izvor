import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { pageMetadata } from "@/lib/seo";
import { ucitajPravniDokument } from "@/lib/pravni-dokument";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pravne");
  return pageMetadata({
    title: t("meta_whitepaper_title"),
    description: t("meta_whitepaper_desc"),
    path: "/whitepaper",
  });
}

export default async function WhitepaperPage() {
  const locale = await getLocale();
  const t = await getTranslations("pravne");
  const sadrzaj = await ucitajPravniDokument("whitepaper_5_0_0.md", locale);

  return (
    <div className="max-w-uska mx-auto pb-16">

      <div className="mb-8">
        <p className="text-xs text-kolo-muted mb-1">{t("dokumentacija")}</p>
        <h1 className="kolo-naslov text-kolo-green-900">
          {t("whitepaper.naslov")}
        </h1>
        <p className="text-sm text-kolo-muted mt-2">{t("verzija")} {t("whitepaper.ver")}</p>
        <div className="mt-4 flex gap-3 text-sm flex-wrap">
          <span className="text-kolo-muted">{t("viditeI")}</span>
          <Link href="/kako-funkcionise" className="text-kolo-green-700 hover:underline">{t("link.oSistemu")}</Link>
          <Link href="/pravilnik" className="text-kolo-green-700 hover:underline">{t("link.pravilnik")}</Link>
        </div>
      </div>

      <article
        className="
          text-sm text-kolo-text leading-relaxed text-body [&>h1:first-child]:hidden
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-kolo-green-900 [&_h1]:mb-6 [&_h1]:mt-8
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-kolo-green-900 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-kolo-border
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-kolo-green-900 [&_h3]:mb-3 [&_h3]:mt-6
          [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-kolo-text [&_h4]:mb-2 [&_h4]:mt-4
          [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
          [&_li]:leading-relaxed
          [&_strong]:font-semibold [&_strong]:text-kolo-text
          [&_em]:italic
          [&_a]:text-kolo-green-700 [&_a]:underline
          [&_hr]:my-6 [&_hr]:border-kolo-border
          [&_blockquote]:border-l-4 [&_blockquote]:border-kolo-green-700 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-kolo-muted [&_blockquote]:my-4
          [&_code]:bg-kolo-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
          [&_table]:w-full [&_table]:my-4 [&_table]:text-sm
          [&_th]:text-left [&_th]:font-semibold [&_th]:p-2 [&_th]:border-b [&_th]:border-kolo-border [&_th]:bg-kolo-bg
          [&_td]:p-2 [&_td]:border-b [&_td]:border-kolo-border [&_td]:align-top
        "
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{sadrzaj}</ReactMarkdown>
      </article>

      <div className="mt-10 pt-6 border-t border-kolo-border flex flex-wrap gap-4 text-sm text-kolo-muted">
        <Link href="/kako-funkcionise" className="text-kolo-green-700 hover:underline">
          ← {t("link.oSistemu")}
        </Link>
        <Link href="/" className="hover:text-kolo-green-700 transition-colors">
          {t("nazadNaPocetnu")}
        </Link>
      </div>
    </div>
  );
}
