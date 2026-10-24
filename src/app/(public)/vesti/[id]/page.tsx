import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { getTranslations, getLocale } from "next-intl/server";
import { fmtDatum } from "@/lib/format";

export const revalidate = 600;

/** Sažetak za pretragu i za deljenje: prvih ~160 znakova teksta, bez preloma. */
function sazetak(tekst: string): string {
  const jedanRed = tekst.replace(/\s+/g, " ").trim();
  return jedanRed.length > 160 ? `${jedanRed.slice(0, 157)}…` : jedanRed;
}

async function dohvati(id: string) {
  return prisma.blogPost
    .findUnique({ where: { id }, select: { id: true, title: true, content: true, publishedAt: true } })
    .catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const o = await dohvati(id);
  if (!o) return {};
  // Naslov i opis su iz same vesti — to je ceo razlog zašto vest ima svoju
  // adresu: u pretrazi i pri deljenju stoji ona, a ne opis celog sajta.
  return pageMetadata({ title: o.title, description: sazetak(o.content), path: `/vesti/${o.id}` });
}

export default async function VestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [o, t, locale] = await Promise.all([dohvati(id), getTranslations("vestiPage"), getLocale()]);
  if (!o) notFound();

  return (
    <div className="max-w-uska mx-auto space-y-6 pb-12">
      <article className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-6 md:p-8">
        <p className="text-xs text-kolo-muted mb-1">{fmtDatum(o.publishedAt, locale, { day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className="kolo-naslov text-kolo-green-900 mb-5">
          {o.title}
        </h1>
        <div className="space-y-3">
          {o.content.split("\n\n").map((pasus, i) => (
            <p key={i} className="text-base text-kolo-muted text-body leading-relaxed">
              {pasus}
            </p>
          ))}
        </div>
      </article>

      <div className="text-center">
        <Link href="/vesti" className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("nazad")}
        </Link>
      </div>
    </div>
  );
}
