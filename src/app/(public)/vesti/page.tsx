import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { getTranslations, getLocale } from "next-intl/server";
import { fmtDatum } from "@/lib/format";
import Kartica from "@/components/ui/Kartica";
import PraznoStanje from "@/components/ui/PraznoStanje";

/**
 * Javne vesti Fondacije.
 *
 * Do 03.09.2026. su objave postojale samo iza prijave, na `/pocetna`. Spolja se
 * zato nije videlo da se išta dešava — a sajt koji se mesecima ne menja Google
 * prestaje da posećuje. Ovo je ista sadržina (model `BlogPost`, admin ekran
 * nepromenjen), samo dostupna i bez naloga.
 *
 * Svaka vest ima sopstvenu adresu i sopstveni naslov u pretrazi (`/vesti/[id]`)
 * — to je ono zbog čega spisak i postoji: link koji se može poslati.
 */
export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("vestiPage");
  return pageMetadata({ title: t("meta_title"), description: t("meta_desc"), path: "/vesti" });
}

export default async function VestiPage() {
  const t = await getTranslations("vestiPage");
  const locale = await getLocale();

  const objave = await prisma.blogPost
    .findMany({
      orderBy: { publishedAt: "desc" },
      take: 50,
      select: { id: true, title: true, content: true, publishedAt: true },
    })
    .catch(() => []);

  return (
    <div className="space-y-6 pb-12">
      <section className="bg-kolo-green-900 rounded-kartica px-6 md:px-8 py-10 text-white">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2 tracking-tight">
          {t("hero_naslov")}
        </h1>
        <p className="text-white/70 text-base md:text-lg">{t("hero_opis")}</p>
      </section>

      {objave.length === 0 ? (
        <Kartica as="section" padding="nema">
          <PraznoStanje naslov={t("prazno")} />
        </Kartica>
      ) : (
        <div className="space-y-3">
          {objave.map((o) => (
            <Link
              key={o.id}
              href={`/vesti/${o.id}`}
              className="block bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-5 md:p-6 hover:shadow-md transition-shadow"
            >
              <p className="text-xs text-kolo-muted mb-1">{fmtDatum(o.publishedAt, locale, { day: "numeric", month: "long", year: "numeric" })}</p>
              <h2 className="font-bold text-kolo-green-900 text-lg leading-snug mb-2 tracking-tight">
                {o.title}
              </h2>
              <p className="text-sm text-kolo-muted leading-relaxed text-body line-clamp-3">{o.content}</p>
              <p className="text-sm font-medium text-kolo-green-700 mt-3">{t("procitaj")} →</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
