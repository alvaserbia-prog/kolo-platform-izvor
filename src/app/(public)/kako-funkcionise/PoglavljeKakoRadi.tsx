import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { intlTag } from "@/lib/format";
import { IZNOS_PRVOG_CLANA, IZNOS_OSTALIH_CLANOVA, MAX_CLANOVA_SA_DOPRINOSOM } from "@/lib/gazdinstvo-pravila";
import { MINIMUM_PRIJAVE_POKROVITELJSTVA } from "@/lib/donacija-pravila";
import { PRIJATELJSTVO_POEN } from "@/lib/deca-pravila";
import { MINIMUM_POEN_ZA_UPIS_ZRNA } from "@/lib/protokol/zrno";
import Kartica from "@/components/ui/Kartica";
import ZaglavljePoglavlja from "./ZaglavljePoglavlja";
import ArhitekturaSistema from "./ArhitekturaSistema";

/**
 * Poglavlje 2 — kanali kroz koje POEN nastaje, šta POEN jeste, ZRNO i obračunski
 * koeficijent. Do 22.10.2026 zasebna stranica `/kako-sistem-radi`.
 *
 * Razlog odvajanja od prvih koraka (03.09.2026) i dalje važi: čovek koji prvi put
 * dolazi ne mora da nauči dvadesetak pojmova pre nego što uradi bilo šta. Zato je
 * ovo drugo poglavlje, iza koraka, a ne prvo.
 *
 * „Šta POEN nije" — šest odričnih stavki sa tri zakona — ne stoji ovde nego u
 * poglavlju „Pravila i zakoni" na dnu stranice: čoveku koji je došao da vidi
 * pijacu ta lista proizvodi sumnju koje nije bilo (niko se ne brani od optužbe
 * koja nije postavljena). Ovde ostaje tvrdnja u potvrdnom obliku i sidro.
 */
export default async function PoglavljeKakoRadi() {
  const t = await getTranslations("kakoFunkcionisePage");
  const tc = await getTranslations("common");
  const ts = await getTranslations("oSistemu");
  const locale = await getLocale();
  const broj = (n: number) => n.toLocaleString(intlTag(locale));

  // Kanali iz Pravilnika čl. 15, bez rasta kolektivnih oblika: taj kanal upisuje
  // u zapis zadruge, ne čoveku, pa stoji kao napomena ispod kartica. Kartice nemaju
  // redne brojeve i ne prate redosled iz akta (odluka vlasnika, 23.10.2026): idu
  // redom kojim čovek na njih nailazi — prvo ono što radi sam, pa novac, pa
  // podrška i posebni slučajevi; osnivački doprinos je poslednji. Iznosi se čitaju iz pravila (pravilo 10).
  const kanali = [
    { naslov: t("n1_naslov"), opis: t("n1_opis"), iznos: t("n1_iznos"), zlatna: false },
    { naslov: t("n2_naslov"), opis: t("n2_opis"), iznos: t("n2_iznos"), zlatna: false },
    {
      naslov: t("n9_naslov"),
      opis: t("n9_opis", { prvi: broj(IZNOS_PRVOG_CLANA), ostali: broj(IZNOS_OSTALIH_CLANOVA), max: MAX_CLANOVA_SA_DOPRINOSOM }),
      iznos: t("n9_iznos", { prvi: broj(IZNOS_PRVOG_CLANA), ostali: broj(IZNOS_OSTALIH_CLANOVA) }),
      zlatna: false,
    },
    { naslov: t("n3_naslov"), opis: t("n3_opis"), iznos: t("n3_iznos"), zlatna: false },
    { naslov: t("n6_naslov"), opis: t("n6_opis"), iznos: t("n6_iznos"), zlatna: true },
    { naslov: t("n5_naslov"), opis: t("n5_opis"), iznos: t("n5_iznos_prag", { prag: broj(MINIMUM_PRIJAVE_POKROVITELJSTVA) }), zlatna: false },
    // Socijalni programi stoje iznad dečjeg prostora (odluka vlasnika, 23.10.2026).
    { naslov: t("n4_naslov"), opis: t("n4_opis"), iznos: t("n4_iznos"), zlatna: false },
    // Doprinos dece u dečjem prostoru (čl. 15 t. 9).
    {
      naslov: t("n8_naslov"),
      opis: t("n8_opis_poen", { iznos: broj(PRIJATELJSTVO_POEN) }),
      iznos: t("n8_iznos_poen", { iznos: broj(PRIJATELJSTVO_POEN) }),
      zlatna: false,
    },
    { naslov: t("n7_naslov"), opis: t("n7_opis"), iznos: t("n7_iznos"), zlatna: false, link: { href: "/osnivacki-doprinos", label: t("n7_link") } },
  ].map((k: { naslov: string; opis: string; iznos: string; zlatna: boolean; link?: { href: string; label: string } }) => ({
    ...k,
    boja: k.zlatna ? "bg-kolo-gold-100 text-kolo-gold-700" : "bg-kolo-green-100 text-kolo-green-700",
  }));

  // Broj kanala ide kao CIFRA, ne kao reč — brojna reč bi se sklanjala po jeziku.
  const brojKanala = kanali.length;

  return (
    <section className="space-y-6" aria-labelledby="kako-radi">
      <ZaglavljePoglavlja
        id="kako-radi"
        naslov={t("sistem_hero_naslov")}
        opis={t("sistem_hero_opis")}
      />

      {/* ── KAKO JE SASTAVLJENO (crtež celine pre delova — revizija teksta, uloga 1, 23.10.2026) ─────────────────────────────────────── */}
      <div id="arhitektura" className="space-y-4 scroll-mt-24">
        <h3 className="text-2xl md:text-3xl font-bold text-kolo-green-900 text-center tracking-tight">
          {ts("arhitektura_naslov")}
        </h3>
        <div className="max-w-[680px] mx-auto space-y-4 text-kolo-text text-body leading-relaxed">
          <p>{ts("zajednicko_p1")}</p>
          <p>
            {ts("zajednicko_p2_pre")}<strong className="text-kolo-green-900">{ts("zajednicko_p2_sredina")}</strong>{ts("zajednicko_p2_post")}
          </p>
        </div>

        <Kartica padding="lg" className="md:p-8">
          <ArhitekturaSistema />
        </Kartica>

        {/* Zadruge su deo arhitekture na lokalitetu, ali nisu organ ni deo
            Fondacije (Pravilnik o zadrugama čl. 3–4). */}
        <Kartica padding="lg" className="md:p-7 border-t-4 border-t-kolo-gold-400">
          <h4 className="text-xl font-bold text-kolo-green-900 leading-snug tracking-tight">
            {ts("arhitektura_zadruge_naslov")}
          </h4>
          <p className="text-sm text-kolo-text text-body mt-3 leading-relaxed">
            {ts("arhitektura_zadruge_tekst")}{" "}
            <Link href="/zadruge" className="text-kolo-green-700 hover:underline">
              {ts("arhitektura_zadruge_link")}
            </Link>
          </p>
        </Kartica>
      </div>

      {/* ── KANALI UPISIVANJA POEN-a ────────────────────────────────── */}
      <div className="space-y-6">
        <h3 className="text-2xl md:text-3xl font-bold text-kolo-green-900 tracking-tight text-center">
          {t("evidencija_naslov", { broj: brojKanala })}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          {kanali.map((n) => (
            <Kartica key={n.naslov} className="flex flex-col md:col-span-4">
              <p className="font-semibold text-kolo-text text-base leading-snug">{n.naslov}</p>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full self-start mt-2 ${n.boja}`}>
                {n.iznos}
              </span>
              <p className="text-sm text-kolo-muted leading-relaxed text-body whitespace-pre-line mt-3">{n.opis}</p>
              {n.link && (
                <Link href={n.link.href} className="mt-3 text-sm font-medium text-kolo-green-700 hover:underline">
                  {n.link.label}
                </Link>
              )}
            </Kartica>
          ))}
        </div>

        {/* Zapis zadruge nije lični kanal — POEN u njemu ne pripada nikome lično
            (Pravilnik o zadrugama čl. 10–11), pa stoji ispod kartica, ne u brojaču. */}
        <p className="text-sm text-kolo-muted leading-relaxed max-w-2xl mx-auto text-center">
          {t("kanali_zadruga_napomena")}{" "}
          <Link href="/zadruge" className="text-kolo-green-700 hover:underline">
            {t("kanali_zadruga_link")}
          </Link>
        </p>
      </div>

      {/* ── POEN I ZRNO ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="inline-block bg-kolo-green-100 text-kolo-green-700 text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide uppercase">
          {t("dve_jedinice_tag")}
        </div>
        <div className="grid md:grid-cols-2 gap-4">

          {/* POEN */}
          <Kartica padding="lg" className="md:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-kontrola bg-kolo-green-100 text-kolo-green-700 flex items-center justify-center font-bold text-lg">
                {/* Inicijal se izvodi iz naziva jedinice — na ćirilici/ruskom „П", ne „P". */}
                {tc("poen").charAt(0)}
              </div>
              <div>
                <p className="font-bold text-kolo-green-900 text-lg">{tc("poen")}</p>
                <p className="text-sm text-kolo-muted">{t("poen_jedinica_label")}</p>
              </div>
            </div>

            <p className="text-sm text-kolo-muted leading-relaxed text-body">{t("poen_uvod_zapis")}</p>

            <div>
              <p className="text-sm font-bold tracking-widest text-kolo-muted uppercase mb-2">{t("poen_jeste_naslov")}</p>
              <ul className="space-y-1.5">
                {[t("poen_jeste2"), t("poen_jeste4")].map((s) => (
                  <li key={s} className="flex gap-2 items-start text-base text-kolo-muted">
                    <span className="text-kolo-green-700 mt-0.5 shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-kontrola bg-kolo-bg p-4">
              <p className="text-sm text-kolo-text leading-relaxed text-body mb-3">
                {t("poen_nije_kratko")}
              </p>
              <a
                href="#pravila"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-kolo-green-700 hover:text-kolo-green-900 transition-colors"
              >
                {t("pravna_link")}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <div className="bg-kolo-green-100 rounded-kontrola p-4">
              <p className="text-sm font-semibold text-kolo-green-700 mb-1">{t("zerosum_naslov")}</p>
              <p className="text-sm text-kolo-muted leading-relaxed text-body whitespace-pre-line">
                {t("zerosum_tekst_prepis")}
              </p>
            </div>
          </Kartica>

          {/* ZRNO */}
          <Kartica padding="lg" className="md:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-kontrola bg-kolo-gold-100 text-kolo-gold-700 flex items-center justify-center font-bold text-lg">
                {tc("zrno").charAt(0)}
              </div>
              <div>
                <p className="font-bold text-kolo-green-900 text-lg">{tc("zrno")}</p>
                <p className="text-sm text-kolo-muted">{t("zrno_jedinica_label")}</p>
              </div>
            </div>

            <p className="text-sm text-kolo-muted leading-relaxed text-body">{t("zrno_uvod")}</p>

            <div>
              <p className="text-sm font-bold tracking-widest text-kolo-muted uppercase mb-2">{t("zrno_upis_naslov")}</p>
              <ul className="space-y-1.5">
                {[t("zrno_upis_prag", { prag: broj(MINIMUM_POEN_ZA_UPIS_ZRNA) }), t("zrno_upis2"), t("zrno_upis3"), t("zrno_upis4")].map((s) => (
                  <li key={s} className="flex gap-2 items-start text-base text-kolo-muted">
                    <span className="text-kolo-gold-700 mt-0.5 shrink-0">◆</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-sm font-bold tracking-widest text-kolo-muted uppercase mb-2">{t("zrno_koristi_naslov")}</p>
              <ul className="space-y-1.5">
                {[t("zrno_koristi1"), t("zrno_koristi2"), t("zrno_koristi4"), t("zrno_koristi5")].map((s) => (
                  <li key={s} className="flex gap-2 items-start text-base text-kolo-muted">
                    <span className="text-kolo-gold-700 mt-0.5 shrink-0">◆</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-kolo-gold-100 rounded-kontrola p-4">
              <p className="text-sm font-semibold text-kolo-gold-700 mb-1">{t("koeficijent_naslov")}</p>
              <p className="text-sm text-kolo-muted leading-relaxed text-body whitespace-pre-line">
                {t("koeficijent_tekst")}
              </p>
            </div>
          </Kartica>

        </div>
      </div>
    </section>
  );
}
