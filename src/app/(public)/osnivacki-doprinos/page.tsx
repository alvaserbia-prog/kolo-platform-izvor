import { getServerSession } from "next-auth";
import { intlTag } from "@/lib/format";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dohvatiStatusKanala, ITERATION_LIMIT, vidljivostUdela } from "@/lib/protokol/osnivacki";
import { pageMetadata } from "@/lib/seo";
import Pseudonim from "@/components/Pseudonim";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import Kartica from "@/components/ui/Kartica";
import PraznoStanje from "@/components/ui/PraznoStanje";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("osnivackiDoprinosPage");
  return pageMetadata({
    title: t("meta_title"),
    description: t("meta_desc"),
    path: "/osnivacki-doprinos",
  });
}

export default async function OsnivackiDoprinosPage() {
  const t = await getTranslations("osnivackiDoprinosPage");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  const fmt = (n: number) => n.toLocaleString(intlTag(locale));

  // Javnost udela (Pravilnik o osnivačkom doprinosu čl. 11): zbirni podaci kanala
  // svima, udeli svim korisnicima (svako sa nalogom), pseudonim i napomena uz udeo
  // samo učesnicima. Pravilo je u `osnivacki-pravila.ts` (`vidljivostUdela`).
  const session = await getServerSession(authOptions);
  const vidljivost = vidljivostUdela({ prijavljen: !!session?.user, ucesnik: !!session?.user?.verified });
  const saPseudonimom = vidljivost === "UDELI_I_PSEUDONIM";

  let status: Awaited<ReturnType<typeof dohvatiStatusKanala>> | null = null;
  try {
    status = await dohvatiStatusKanala();
  } catch {
    status = null;
  }

  const [osnivaci, koraci] = await Promise.all([
    vidljivost === "NISTA"
      ? Promise.resolve([])
      : prisma.osnivac.findMany({
          select: {
            redniBroj: true,
            udeoBrojilac: true,
            udeoImenilac: true,
            // Pseudonim i napomena se korisniku koji nije u Kolu ni ne čitaju.
            napomena: saPseudonimom,
            user: saPseudonimom ? { select: { pseudonim: true } } : false,
          },
          orderBy: { redniBroj: "asc" },
        }),
    prisma.osnivackiKorakLog.findMany({
      select: { brojKoraka: true, prag: true, iznosKoraka: true, createdAt: true },
      orderBy: { brojKoraka: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="max-w-uska mx-auto pb-16">
      <div className="mb-6">
        <h1 className="kolo-naslov text-kolo-green-900 mb-3">{t("naslov")}</h1>
        <p className="text-kolo-muted leading-relaxed text-body">
          {t("opis")}
        </p>
      </div>

      {status && (
        <div className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-kolo-text">{t("stanje_naslov")}</h2>
            {status.zatvoren && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-kolo-bg text-kolo-muted">
                {t("stanje_zatvoreno")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-kolo-muted">{t("izvrseno_koraka")}</div>
              <div className="font-semibold text-kolo-text">{status.brojKoraka} / {ITERATION_LIMIT}</div>
            </div>
            <div>
              <div className="text-xs text-kolo-muted">{t("evidentirano")}</div>
              <div className="font-semibold text-kolo-text">{fmt(status.ukupnoEvidentirano)} {tc("poen")}</div>
            </div>
            <div>
              <div className="text-xs text-kolo-muted">{t("preostalo")}</div>
              <div className="font-semibold text-kolo-text">{fmt(status.preostalo)} {tc("poen")}</div>
            </div>
            <div>
              <div className="text-xs text-kolo-muted">{t("iskorisceno")}</div>
              <div className="font-semibold text-kolo-text">{status.procenatIskoriscenja}%</div>
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-kolo-bg overflow-hidden">
            <div className="h-full bg-kolo-green-700" style={{ width: `${Math.min(100, status.procenatIskoriscenja)}%` }} />
          </div>
        </div>
      )}

      <h2 className="font-semibold text-kolo-text mb-3">{t("osnivaci_naslov")}</h2>
      {vidljivost === "NISTA" ? (
        <Kartica padding="nema" className="mb-8">
          <PraznoStanje naslov={t("registar_blokiran")} />
        </Kartica>
      ) : osnivaci.length === 0 ? (
        <Kartica padding="nema" className="mb-8">
          <PraznoStanje naslov={t("registar_prazan")} />
        </Kartica>
      ) : (
        <div className="space-y-3 mb-8">
          {osnivaci.map((o) => (
            <div key={o.redniBroj} className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica px-5 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-kolo-text">
                  {saPseudonimom && o.user
                    ? <Pseudonim>{o.user.pseudonim}</Pseudonim>
                    : t("osnivac_redni", { broj: o.redniBroj })}
                </div>
                {o.napomena && <div className="text-sm text-kolo-muted mt-0.5">{o.napomena}</div>}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-semibold text-kolo-green-700">
                  {Math.round((o.udeoBrojilac / o.udeoImenilac) * 1000) / 10}%
                </div>
                <div className="text-xs text-kolo-muted mt-0.5">{o.udeoBrojilac}/{o.udeoImenilac}</div>
              </div>
            </div>
          ))}
          {!saPseudonimom && (
            <p className="text-xs text-kolo-muted">{t("pseudonim_samo_ucesnicima")}</p>
          )}
        </div>
      )}

      {koraci.length > 0 && (
        <>
          <h2 className="font-semibold text-kolo-text mb-3">{t("koraci_naslov")}</h2>
          <div className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica overflow-x-auto">
            <table className="w-full text-sm min-w-[34rem]">
              <thead>
                <tr className="text-left text-kolo-muted border-b border-kolo-border">
                  <th className="px-3 sm:px-6 py-3 font-medium">{t("col_korak")}</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">{t("col_prag")}</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">{t("col_iznos")}</th>
                  <th className="px-3 sm:px-6 py-3 font-medium">{t("col_datum")}</th>
                </tr>
              </thead>
              <tbody>
                {koraci.map((k) => (
                  <tr key={k.brojKoraka} className="border-b border-kolo-border last:border-0">
                    <td className="px-3 sm:px-6 py-3 text-kolo-text">{k.brojKoraka}/{ITERATION_LIMIT}</td>
                    <td className="px-3 sm:px-6 py-3 text-kolo-muted">{fmt(k.prag)}</td>
                    <td className="px-3 sm:px-6 py-3 text-kolo-muted">{fmt(k.iznosKoraka)} {tc("poen")}</td>
                    <td className="px-3 sm:px-6 py-3 text-kolo-muted whitespace-nowrap">
                      {new Date(k.createdAt).toLocaleDateString(
                        intlTag(locale),
                        { day: "2-digit", month: "long", year: "numeric" }
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
