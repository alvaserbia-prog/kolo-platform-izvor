import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { sesija } from "@/lib/sesija";
import { prisma } from "@/lib/prisma";
import { gazdinstvaZaMapu, aktivnoClanstvo, pravaUGazdinstvu } from "@/lib/protokol/gazdinstvo";
import { MIN_OGLASA_UZ_PRIJAVU } from "@/lib/gazdinstvo-pravila";
import Kartica from "@/components/ui/Kartica";
import { klaseDugmeta } from "@/components/ui/Dugme";
import NaslovStranice from "@/components/ui/NaslovStranice";
import PraznoStanje from "@/components/ui/PraznoStanje";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("gazdinstva");
  return { title: `${t("naslov")} — KOLO`, description: t("meta_opis") };
}

/**
 * Gazdinstva — spisak odobrenih gazdinstava po naseljima i put do mape `/mapa`
 * (Pravilnik o gazdinstvima čl. 19 st. 2: na istoj mapi prikazuju se i pokrovitelji).
 * Prijavljenom članu i njegovo gazdinstvo, pozivi i prijava.
 *
 * Maloletni nalog ne može biti član gazdinstva (Pravilnik o učešću dece čl. 29 st. 3),
 * a profil gazdinstva vodi na oglase punoletnih — pa mu se stranica ne otvara.
 */
export default async function GazdinstvaPage() {
  const session = await sesija();
  if (session?.user.maloletan) redirect("/pocetna");
  const t = await getTranslations("gazdinstva");

  const [tacke, clanstvo, pozivi] = await Promise.all([
    gazdinstvaZaMapu(),
    session ? aktivnoClanstvo(session.user.id) : Promise.resolve(null),
    session
      ? prisma.clanGazdinstva.findMany({
          where: { userId: session.user.id, status: "POZVAN" },
          select: { id: true, gazdinstvo: { select: { id: true, naziv: true, naselje: true } } },
        })
      : Promise.resolve([]),
  ]);

  // Član koji upravlja gazdinstvom (čl. 11, 14 — izvodi se iz statusa,
  // `smeUpravljati`) donira iz upisa pokrovitelja: postojeći upis vezan za ovo
  // gazdinstvo, ili nov upis popunjen iz gazdinstva.
  let donirajHref: string | null = null;
  const prava = session && clanstvo ? await pravaUGazdinstvu(session.user.id, clanstvo.gazdinstvo.id) : null;
  if (session && clanstvo && prava?.upravlja) {
    const upis = await prisma.upisPokrovitelja.findFirst({
      where: { vlasnikUserId: session.user.id, gazdinstvoId: clanstvo.gazdinstvo.id, obrisanAt: null, status: { not: "ODBIJEN" } },
      select: { id: true },
    });
    donirajHref = upis ? `/postani-pokrovitelj/${upis.id}` : "/postani-pokrovitelj/upis?vrsta=GAZDINSTVO";
  }

  // Spisak po naseljima — mapa je slika zajednice, spisak je put do oglasa.
  const poNaseljima = new Map<string, typeof tacke>();
  for (const g of tacke) {
    const l = poNaseljima.get(g.naselje) ?? [];
    l.push(g);
    poNaseljima.set(g.naselje, l);
  }
  const naselja = [...poNaseljima.keys()].sort((a, b) => a.localeCompare(b, "sr"));

  return (
    <div className="max-w-[1000px] mx-auto pb-16 space-y-6">
      <NaslovStranice naslov={t("naslov")} opis={t("uvod")} />

      {/* Moje gazdinstvo / pozivi / prijava */}
      {session && (
        <div className="space-y-3">
          {pozivi.map((p) => (
            <Link
              key={p.id}
              href={`/gazdinstva/${p.gazdinstvo.id}`}
              className="block rounded-kontrola border-l-4 border-kolo-gold-600 bg-kolo-gold-100 px-4 py-3 text-sm text-kolo-text hover:bg-kolo-gold-200 transition-colors"
            >
              {t("poziv_kartica", { naziv: p.gazdinstvo.naziv, naselje: p.gazdinstvo.naselje })}
            </Link>
          ))}
          {clanstvo ? (
            <>
              <Link
                href={`/gazdinstva/${clanstvo.gazdinstvo.id}`}
                className="block rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica px-5 py-4 text-sm hover:border-kolo-green-500 transition-colors"
              >
                <span className="font-semibold">{t("moje_gazdinstvo")}:</span> {clanstvo.gazdinstvo.naziv} ·{" "}
                {t(`status_${clanstvo.gazdinstvo.status}`)}
              </Link>
              {/* Doniranje u ime gazdinstva ide kroz upis pokrovitelja (donacije
                  čl. 16), koji vodi samo nosilac — upis se popunjava podacima
                  gazdinstva, pa se gazdinstvo ne unosi dvaput. */}
              {donirajHref && (
                <Link href={donirajHref} className="inline-flex min-h-9 items-center text-sm font-medium text-kolo-green-700 hover:underline">
                  {t("doniraj_u_ime")}
                </Link>
              )}
            </>
          ) : (
            <Kartica className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-kolo-text">
                {/* Iznosi stoje u FAQ-u i na /kako-funkcionise; ovde samo da doprinos postoji
                    i kad se evidentira (revizija teksta, krug 2). */}
                {t("prijavi_poziv")}
              </p>
              <Link
                href="/gazdinstva/prijava"
                className={`${klaseDugmeta()} shrink-0`}
              >
                {t("prijavi_dugme")}
              </Link>
            </Kartica>
          )}
        </div>
      )}

      {/* Gost: kako se postaje deo mape — tri koraka iz Pravilnika o gazdinstvima
          (čl. 4–7). Odobrenje utvrđuje potpunost prijave, ne proverava gazdinstvo. */}
      {!session && (
        <Kartica>
          <p className="text-sm font-semibold text-kolo-text">{t("gost_koraci_naslov")}</p>
          <ol className="mt-2 space-y-1 text-sm text-kolo-text list-decimal list-inside">
            <li>{t("gost_korak_1")}</li>
            <li>{t("gost_korak_2", { min: MIN_OGLASA_UZ_PRIJAVU })}</li>
            <li>{t("gost_korak_3")}</li>
          </ol>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/gazdinstva/prijava")}`}
            className={`${klaseDugmeta()} mt-3`}
          >
            {t("gost_dugme")}
          </Link>
        </Kartica>
      )}

      {/* Mapa gazdinstava i pokrovitelja ima sopstvenu stranicu `/mapa` (odluka
          vlasnika 20.10.2026) — ovde se ne ponavlja, da bi mapa bila jedna. */}
      <Link
        href="/mapa"
        className={klaseDugmeta({ varijanta: "sekundarno" })}
      >
        {t("pogledaj_mapu")}
      </Link>

      {tacke.length === 0 ? (
        <Kartica padding="nema">
          <PraznoStanje kompaktno naslov={t("nema_gazdinstava")} />
        </Kartica>
      ) : (
        <div className="space-y-5">
          {naselja.map((n) => (
            <section key={n}>
              <h2 className="text-sm font-semibold text-kolo-green-900 mb-2">{n}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {poNaseljima.get(n)!.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={`/gazdinstva/${g.id}`}
                      className="block rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-4 hover:border-kolo-green-500 transition-colors"
                    >
                      <p className="font-semibold text-kolo-text">{g.naziv}</p>
                      <p className="mt-1 text-xs text-kolo-muted line-clamp-2">{g.opis}</p>
                      <p className="mt-2 text-xs text-kolo-green-700">{t("oglasa_n", { n: g.brojOglasa })}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Ograda uz oznaku DOMAĆE (Pravilnik o gazdinstvima): do 23.10.2026 stajala je
          i na naslovnoj; sada je tamo gde se oznaka vidi — ovde, na profilu
          gazdinstva i na oglasu. */}
      <p className="text-xs text-kolo-muted">{t("domace_napomena")}</p>

      <p className="text-xs text-kolo-muted">
        {t("pravilnik_napomena")}{" "}
        <Link href="/pravilnik/gazdinstva" className="underline">
          {t("pravilnik_link")}
        </Link>
      </p>
    </div>
  );
}
