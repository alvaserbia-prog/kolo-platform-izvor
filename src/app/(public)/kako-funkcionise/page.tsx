import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import Kartica from "@/components/ui/Kartica";
import Obavestenje from "@/components/ui/Obavestenje";
import { klaseDugmeta } from "@/components/ui/Dugme";
import PoglavljeKakoRadi from "./PoglavljeKakoRadi";
import PoglavljeKoStojiIza from "./PoglavljeKoStojiIza";
import PoglavljePravila from "./PoglavljePravila";

/** Stavka sidrenog menija na tamnozelenoj podlozi — `Dugme` nema tamnu varijantu. */
const SIDRO =
  "inline-flex items-center min-h-10 px-4 rounded-kontrola border border-white/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors";

/**
 * Jedna stranica koja objašnjava KOLO (odluka vlasnika, 22.10.2026). Do tada je
 * isto objašnjavalo pet stranica: Kako funkcioniše, Kako sistem radi, O sistemu,
 * O nama i Pravna pozicija. Sada su to četiri poglavlja jedne celine:
 *
 *   1. Šta da uradiš   (`#uradi`)        — koraci, nalog deteta, poziv
 *   2. Kako radi       (`#kako-radi`)    — kanali, POEN, ZRNO, koeficijent
 *   3. Ko stoji iza    (`#ko-stoji-iza`) — priča, arhitektura, gde smo, nismo prvi, Fondacija
 *   — završni poziv —
 *   4. Pravna pozicija (`#pravila`)      — šta POEN i ZRNO nisu, propisi, akti
 *
 * Redosled odgovara redosledu pitanja: prvo „šta da uradim", pa „kako to radi",
 * pa „ko ste vi". 🔴 Pravno poglavlje je POSLEDNJE, ispod završnog poziva i van
 * sidrenog menija — razlog u `PoglavljePravila.tsx`.
 *
 * Stare adrese preusmeravaju na sidra (vidi `page.tsx` u njihovim folderima), pa
 * linkovi iz mejlova, obaveštenja i sa mreža rade i dalje (CLAUDE.md pravilo 12).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("kakoFunkcionisePage");
  return pageMetadata({
    title: t("meta_title"),
    description: t("meta_desc"),
    path: "/kako-funkcionise",
  });
}

export default async function KakoFunkcionisePage() {
  const t = await getTranslations("kakoFunkcionisePage");
  const tn = await getTranslations("oNama");

  const koraci = [
    { br: "1", naslov: t("k1_naslov"), opis: t("k1_opis"), detalj: t("k1_detalj") },
    { br: "2", naslov: t("k2_naslov"), opis: t("k2_opis"), detalj: t("k2_detalj") },
    { br: "3", naslov: t("k3_naslov"), opis: t("k3_opis"), detalj: t("k3_detalj"), istaknut: true },
    { br: "4", naslov: t("k4_naslov"), opis: t("k4_opis"), detalj: t("k4_detalj") },
    { br: "5", naslov: t("k5_naslov"), opis: t("k5_opis"), detalj: t("k5_detalj") },
  ];

  // Sidreni meni nosi prva tri poglavlja. Pravno poglavlje namerno nije u njemu.
  const sidra = [
    { href: "#uradi", label: t("pogl1") },
    { href: "#kako-radi", label: t("pogl2") },
    { href: "#ko-stoji-iza", label: t("pogl3") },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* ── ZAGLAVLJE STRANICE I SIDRENI MENI ──────────────────────── */}
      <section className="bg-kolo-green-900 rounded-kartica px-6 md:px-8 py-10 text-white">
        <div className="inline-block bg-white/10 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 tracking-wide uppercase">
          {t("hero_tag")}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3 tracking-tight">
          {t("hero_naslov")}
        </h1>
        <p className="text-white/70 text-base md:text-lg max-w-2xl">
          {t("hero_opis")}
        </p>
        <nav aria-label={t("sidra_aria")} className="mt-6 flex flex-wrap gap-2">
          {sidra.map((s) => (
            <a key={s.href} href={s.href} className={SIDRO}>
              {s.label}
            </a>
          ))}
        </nav>
      </section>

      {/* ── POGLAVLJE 1: ŠTA DA URADIŠ ──────────────────────────────── */}
      <Kartica as="section" padding="lg" id="uradi" className="md:p-8 scroll-mt-24">
        <div className="text-center mb-6">
          <div className="inline-block bg-kolo-green-100 text-kolo-green-700 text-sm font-bold px-5 py-2 rounded-full tracking-wide uppercase">
            {t("pogl1")}
          </div>
        </div>

        {/* Desktop: olimpijski raspored 3 + 2. `items-start`: kartice se ne
            izjednačavaju po visini — korak sa više teksta ostavljao je ostalima
            ~350 px praznine sa pilulom na dnu. */}
        <div className="hidden md:grid md:grid-cols-6 gap-3 items-start">
          {koraci.map((k, i) => (
            <div
              key={k.br}
              className={`md:col-span-2 ${i === 3 ? "md:col-start-2" : ""} rounded-kontrola p-5 flex flex-col ${k.istaknut ? "border-2 border-kolo-gold-400 bg-kolo-gold-100/40" : "bg-kolo-bg"}`}
            >
              <div className={`w-9 h-9 rounded-kontrola flex items-center justify-center text-base font-bold mb-3 ${k.istaknut ? "bg-kolo-gold-400 text-kolo-green-900" : "bg-kolo-green-100 text-kolo-green-700"}`}>
                {k.br}
              </div>
              <p className="font-semibold text-kolo-text text-base mb-1.5">{k.naslov}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full self-start mb-2 ${k.istaknut ? "bg-kolo-gold-400 text-kolo-green-900" : "bg-kolo-green-100 text-kolo-green-700"}`}>
                {k.detalj}
              </span>
              <p className="text-sm text-kolo-muted leading-relaxed whitespace-pre-line">{k.opis}</p>
            </div>
          ))}
        </div>

        {/* Mobilni: vertikalno; broj u redu sa naslovom, tekst preko pune širine. */}
        <div className="md:hidden space-y-3">
          {koraci.map((k) => (
            <div key={k.br} className={`rounded-kontrola p-4 ${k.istaknut ? "border-2 border-kolo-gold-400 bg-kolo-gold-100/40" : "bg-kolo-bg"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-kontrola flex items-center justify-center text-base font-bold shrink-0 ${k.istaknut ? "bg-kolo-gold-400 text-kolo-green-900" : "bg-kolo-green-100 text-kolo-green-700"}`}>
                  {k.br}
                </div>
                <p className="font-semibold text-kolo-text text-base">{k.naslov}</p>
              </div>
              <div>
                <p className="text-sm text-kolo-muted leading-relaxed mb-2 whitespace-pre-line">{k.opis}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${k.istaknut ? "bg-kolo-gold-400 text-kolo-green-900" : "bg-kolo-green-100 text-kolo-green-700"}`}>
                  {k.detalj}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Odgovornost za potvrdu — NIJE šesti korak, pa namerno stoji van
            merdevina: bez rednog broja i bez oznake u uglu. */}
        <Obavestenje vrsta="upozorenje" className="mt-6">
          <p>
            <strong className="text-kolo-green-900">{t("odgovornost_naslov")}</strong>{" "}
            {t("odgovornost_tekst")}
          </p>
        </Obavestenje>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link href="/registracija" className={klaseDugmeta({ varijanta: "zlatno", velicina: "lg" })}>
            {t("cta_registracija")}
          </Link>
          <Link href="/pijaca" className={klaseDugmeta({ varijanta: "sekundarno", velicina: "lg" })}>
            {t("cta_pijaca")}
          </Link>
        </div>

        {/* Nalog deteta je jedan red ispod poziva, ne pasus između upozorenja i
            dugmeta (odluka vlasnika, 22.10.2026): tiče se samo roditelja, a ceo
            pasus je prekidao put do registracije. Odgovor je u Pitanjima. */}
        <p className="mt-5 text-center text-sm text-kolo-muted">
          {t("dete_red")}{" "}
          <Link href="/cesto-postavljena-pitanja#deca" className="font-semibold text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
            {t("dete_link")}
          </Link>
        </p>
      </Kartica>

      {/* ── POGLAVLJE 2: KAKO RADI ──────────────────────────────────── */}
      <PoglavljeKakoRadi />

      {/* ── POGLAVLJE 3: KO STOJI IZA ───────────────────────────────── */}
      <PoglavljeKoStojiIza />

      {/* ── ZAVRŠNI POZIV ───────────────────────────────────────────── */}
      <section className="bg-kolo-green-700 rounded-kartica p-6 md:p-10 text-center text-white">
        <p className="text-xs font-semibold tracking-widest uppercase text-kolo-gold-400 mb-3">{tn("cta_eyebrow")}</p>
        <p className="text-white/70 text-sm md:text-base mb-7 max-w-xl mx-auto leading-relaxed">
          {tn("cta_opis")}<br />
          {tn("cta_opis2")}
        </p>
        <div className="flex justify-center mb-6">
          <Link
            href="/registracija"
            className={`${klaseDugmeta({ varijanta: "zlatno", velicina: "lg" })} w-full sm:w-auto`}
          >
            {tn("cta_registracija")}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          <Link href="/cesto-postavljena-pitanja" className="text-white/60 hover:text-white transition-colors underline underline-offset-4">
            {t("faq_link")}
          </Link>
        </div>
      </section>

      {/* ── POGLAVLJE 4: PRAVNA POZICIJA ────────────────────────────── */}
      <PoglavljePravila />

      <div className="text-center">
        <a
          href="#"
          className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-kolo-green-700 hover:text-kolo-green-900 transition-colors"
        >
          {t("na_vrh")} ↑
        </a>
      </div>
    </div>
  );
}
