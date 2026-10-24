import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Kartica from "@/components/ui/Kartica";
import { PRAG_PRVE_ZADRUGE } from "@/lib/zadruga-pravila";

/**
 * Poglavlje 3 — ko stoji iza KOLA, odakle dolazi i gde je sada. Spaja nekadašnje
 * stranice `/o-nama` i `/o-sistemu` (odluka vlasnika, 22.10.2026): obe su pričale
 * istu priču iz dva ugla, pa su se priča, „zašto baš ovde", spisak akata, česta
 * pitanja i završni poziv ponavljali.
 *
 * Šta je otpalo i gde je sada:
 *  - spisak akata (bio je zastareo, bez zadruga, gazdinstava i nabavki) → `/pravilnik`;
 *  - kartice za donaciju i pokroviteljstvo → `/podrzi-kolo`;
 *  - kartica „Otvori nalog svom detetu" → jedan red u poglavlju 1, sa vezom ka Pitanjima;
 *  - sedište, MB i PIB → poglavlje 4 (`fondacija_tekst`) i futer;
 *  - pet odeljaka o sličnim sistemima i međunarodnom okviru → jedan, „Nismo prvi".
 *
 * Revizija teksta 23.10.2026 (odluka vlasnika): pilula iznad naslova, četiri
 * kartice ispod crteža (Članovi, Gornje Kolo, Protokol, Fondacija — ponavljale su
 * crtež), stavka „Fondacija registrovana" i kartica „Uđi rano" su otpale; vremenska
 * linija ima šest koraka (koraci 6–8 su spojeni u „Mreža zajednica"); okvir
 * socijalne i solidarne ekonomije preseljen je u pravno poglavlje (`okvir_*`).
 *
 * 🔴 U „Nismo prvi" doslovno ostaju rečenica da WIR ima bankarsku dozvolu zato što
 * daje kredit, a KOLO kredit ne daje (`nismo_razlika4`), i rečenica da je razmena
 * dogovor strana, a POEN samo zapis o njoj koji nikoga ni na šta ne obavezuje
 * (`nismo_razlika5`). Rečenicu „Nijedan od njih ne pominje KOLO…" vlasnik je
 * izbacio 23.10.2026; zaštitu od čitanja kao odobrenja sada nosi samo
 * `pravnaPozicija.okvir_merilo` („To ne znači da je KOLO odobrio…").
 */
export default async function PoglavljeKoStojiIza() {
  const t = await getTranslations("oNama");
  const ts = await getTranslations("oSistemu");
  const tk = await getTranslations("kakoFunkcionisePage");

  const faze = [1, 2, 3, 4, 5, 6].map((n) => ({
    r1: t(`faza${n}`),
    r2: t(`faza${n}b`),
    // Prag prve zadruge čita se iz pravila (pravilo 10).
    opis: n === 2 ? t("faza2_opis_prag", { prag: PRAG_PRVE_ZADRUGE }) : t(`faza${n}_opis`),
    prelaz: t(`faza${n}_prelaz`),
    aktivan: n === 2,
  }));

  const stavke = [
    { naslov: t("stavka1_naslov"), tekst: t("stavka1_tekst") },
    { naslov: t("stavka2_naslov"), tekst: t("stavka2_tekst") },
    { naslov: t("stavka3_naslov"), tekst: t("stavka3_tekst") },
    { naslov: t("stavka4_naslov"), tekst: t("stavka4_tekst") },
    { naslov: t("stavka5_naslov"), tekst: t("stavka5_tekst") },
  ];

  const sistemi = [
    { naziv: ts("sistemi_wir_naziv"), podnaslov: ts("sistemi_wir_podnaslov"), opis: ts("nismo_wir") },
    { naziv: ts("sistemi_lets_naziv"), podnaslov: ts("sistemi_lets_podnaslov"), opis: ts("nismo_lets") },
    { naziv: ts("sistemi_sardex_naziv"), podnaslov: ts("sistemi_sardex_podnaslov"), opis: ts("nismo_sardex") },
    { naziv: ts("sistemi_fureai_naziv"), podnaslov: ts("sistemi_fureai_podnaslov"), opis: ts("nismo_fureai") },
  ];

  const razlike = [ts("nismo_razlika1"), ts("nismo_razlika2"), ts("nismo_razlika3"), ts("nismo_razlika4"), ts("nismo_razlika5")];

  // Kako se pomaže znanjem i vremenom. Donacija i pokroviteljstvo imaju svoju
  // stranicu (`/podrzi-kolo`), pa ovde stoji samo put do nje.
  const kartice = [
    { naslov: t("k3_naslov"), tekst: t("k3_tekst"), cta: t("k3_cta"), ctaHref: "mailto:kontakt@ekolo.rs" },
  ];

  const sekundarne = [1, 2, 3, 4, 5].map((n) => ({
    naslov: t(`sek${n}_naslov`),
    tekst: t(`sek${n}_tekst`),
  }));

  const stubovi = [
    { naslov: t("stub1_naslov"), tekst: t("stub1_tekst") },
    { naslov: t("stub3_naslov"), tekst: t("stub3_tekst") },
  ];

  return (
    <section className="space-y-6">

      {/* ── ZAGLAVLJE POGLAVLJA ─────────────────────────────────────── */}
      <header id="ko-stoji-iza" className="scroll-mt-24 bg-kolo-green-900 rounded-kartica p-6 md:p-10 text-white">
        <div className="flex flex-col-reverse md:flex-row md:items-center gap-8 md:gap-12">
          <div className="max-w-[580px]">
            <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-3 tracking-tight">
              {tk("pogl3_naslov")}
            </h2>
            <p className="text-white/70 text-base md:text-lg leading-relaxed">
              {t("hero_opis")}
            </p>
          </div>
          <div className="shrink-0 mx-auto md:ml-auto text-center">
            <div
              className="rounded-full overflow-hidden ring-4 ring-white/10 shadow-xl"
              style={{ width: "160px", height: "160px" }}
            >
              <Image
                src="/nikola-saric-mantil.png"
                alt="Nikola Šarić"
                width={160}
                height={160}
                className="object-cover object-top"
                style={{ width: "160px", height: "160px", display: "block", transform: "scale(1.28)", transformOrigin: "center 22%" }}
              />
            </div>
            <p className="text-white font-semibold text-sm mt-3 leading-tight">{t("hero_potpis_ime")}</p>
            <p className="text-white/70 text-xs leading-tight">{t("hero_potpis_uloga")}</p>
          </div>
        </div>
      </header>

      {/* ── CITAT ───────────────────────────────────────────────────── */}
      <div className="bg-kolo-green-100 rounded-kartica p-6 md:p-8 border-l-4 border-kolo-green-700">
        <div className="max-w-[680px] mx-auto">
          <blockquote className="font-citat text-base md:text-lg text-kolo-text mb-4 text-body leading-relaxed">
            <span className="text-kolo-green-700 font-bold mr-0.5">&bdquo;</span>{t("citat_tekst")}<span className="text-kolo-green-700 font-bold ml-0.5">&ldquo;</span>
          </blockquote>
          <p className="text-sm text-kolo-muted font-medium text-center">Nikola Šarić</p>
        </div>
      </div>

      {/* ── PRIČA: KAKO JE NASTALO KOLO I ZAŠTO BAŠ OVDE ──────────────
          Dve priče sa dve stranice postaju jedna: prvo ko i zašto, pa zašto
          baš Sombor i Bačka. */}
      <Kartica as="div" padding="lg" id="prica" className="md:p-12 scroll-mt-24">
        <div className="max-w-[660px] mx-auto">
          <div className="inline-block bg-kolo-green-100 text-kolo-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            {t("prica_tag")}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-kolo-green-900 mb-8 tracking-tight">
            {t("prica_naslov")}
          </h3>
          <div className="space-y-5 text-kolo-text text-body leading-relaxed">
            <p>{t("prica_p1")}</p>
            <p>{t("prica_p2")}</p>
            <p>{t("prica_p3")}</p>
          </div>
          <h4 className="text-xl font-bold text-kolo-green-900 mt-10 mb-4 tracking-tight">
            {ts("zasto_tag")}
          </h4>
          <div className="space-y-5 text-kolo-text text-body leading-relaxed">
            <p>{ts("zasto_p1")}</p>
            <p>{ts("zasto_p2")}</p>
          </div>
          <blockquote className="font-citat text-base md:text-lg text-kolo-text mt-8 text-body leading-relaxed border-l-4 border-kolo-green-700 pl-4">
            <span className="text-kolo-green-700 font-bold mr-0.5">&bdquo;</span>
            {ts("zasto_citat")}
            <span className="text-kolo-green-700 font-bold ml-0.5">&ldquo;</span>
            <span className="block text-sm text-kolo-muted font-medium mt-2">{ts("zasto_citat_izvor")}</span>
          </blockquote>
        </div>
      </Kartica>

      {/* ── GDE SMO SADA ────────────────────────────────────────────── */}
      <Kartica as="div" padding="lg" id="sta-radimo-sada" className="md:p-12 scroll-mt-24">
        <div className="max-w-[760px] mx-auto">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="inline-block bg-kolo-gold-100 text-kolo-gold-700 text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide uppercase">
              {t("status_tag")}
            </div>
            <span className="text-xs text-kolo-muted font-medium tracking-wide">{t("status_datum")}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-kolo-green-900 mb-3 tracking-tight">
            {t("status_naslov")}
          </h3>
          <p className="text-kolo-muted mb-8 text-body leading-relaxed">{t("status_opis")}</p>

          <div className="relative mb-10 pb-8 border-b border-kolo-border">
            {/* Mobilni — vertikalni redosled */}
            <div className="md:hidden relative">
              <div className="absolute w-0.5 bg-kolo-border" style={{ top: "0.5rem", bottom: "0.5rem", left: "6px" }} />
              <div className="flex flex-col gap-3">
                {faze.map((faza) => (
                  <div key={faza.r1 + faza.r2} className="relative flex items-start gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 relative z-10 shrink-0 mt-1 ${faza.aktivan ? "bg-kolo-green-700 border-kolo-green-700" : "bg-kolo-surface border-kolo-border"}`} />
                    <div className="min-w-0">
                      <p className={`text-sm leading-tight ${faza.aktivan ? "text-kolo-green-700 font-semibold" : "text-kolo-muted"}`}>
                        {faza.r1} {faza.r2}
                        {faza.aktivan && (
                          <span className="ml-2 text-[11px] font-bold text-kolo-green-700">{t("faza_tu_smo_mobilni")}</span>
                        )}
                      </p>
                      <p className="text-xs text-kolo-muted leading-relaxed mt-0.5">{faza.opis}</p>
                      <p className="text-xs text-kolo-muted leading-relaxed mt-1">
                        <span className="font-semibold text-kolo-text">{t("faza_prelaz_oznaka")}</span> {faza.prelaz}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop — horizontalni redosled */}
            <div className="hidden md:block relative pt-5">
              <div className="absolute h-0.5 bg-kolo-border" style={{ top: "calc(1.25rem + 6px)", left: "8.33%", right: "8.33%" }} />
              <div className="relative grid grid-cols-6">
                {faze.map((faza, i) => (
                  <div key={faza.r1 + faza.r2} className="group relative flex flex-col items-center gap-1.5 px-1 cursor-help">
                    {faza.aktivan && (
                      <span className="absolute -top-5 text-[11px] font-bold text-kolo-green-700 whitespace-nowrap">
                        {t("faza_tu_smo_desktop")}
                      </span>
                    )}
                    <div className={`w-3.5 h-3.5 rounded-full border-2 relative z-10 ${faza.aktivan ? "bg-kolo-green-700 border-kolo-green-700" : "bg-kolo-surface border-kolo-border"}`} />
                    <p className={`text-[11px] leading-tight text-center ${faza.aktivan ? "text-kolo-green-700 font-semibold" : "text-kolo-muted"}`}>
                      {faza.r1}<br />{faza.r2}
                    </p>
                    <span className={`pointer-events-none absolute top-full mt-2 ${i === 0 ? "left-0" : i === faze.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"} hidden group-hover:block w-56 z-50 rounded-xl bg-kolo-text text-white text-xs leading-relaxed font-normal text-left p-3 shadow-xl`}>
                      {faza.opis}
                      <span className="block mt-2">
                        <span className="font-semibold">{t("faza_prelaz_oznaka")}</span> {faza.prelaz}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h4 className="text-xl font-bold text-kolo-green-900 mb-3 tracking-tight">{t("otvaranje_naslov")}</h4>
          <p className="text-kolo-muted mb-8 text-body leading-relaxed">{t("otvaranje_opis")}</p>

          <div className="space-y-5">
            {stavke.map((stavka) => (
              <div key={stavka.naslov} className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-kolo-green-700 mt-2.5 shrink-0" />
                <div>
                  <p className="font-semibold text-kolo-text mb-1">{stavka.naslov}</p>
                  <p className="text-sm text-kolo-muted text-body leading-relaxed">{stavka.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Kartica>

      {/* ── NISMO PRVI ──────────────────────────────────────────────────
          Do 22.10.2026 pet odeljaka (~6.000 znakova): „topla voda", četiri
          sistema, „ista familija", međunarodni okvir i „KOLO prema tim
          definicijama". Sada jedan. */}
      <Kartica as="div" padding="lg" id="nismo-prvi" className="md:p-12 scroll-mt-24">
        <div className="max-w-[680px] mx-auto">
          <div className="inline-block bg-kolo-green-100 text-kolo-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            {ts("topla_voda_tag")}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-kolo-green-900 mb-4 tracking-tight">
            {ts("topla_voda_naslov")}
          </h3>
          <p className="text-kolo-text text-body leading-relaxed mb-6">{ts("nismo_uvod")}</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {sistemi.map((s) => (
              <div key={s.naziv} className="bg-kolo-bg rounded-kontrola p-4">
                <p className="font-bold text-kolo-green-900">{s.naziv}</p>
                <p className="text-xs font-semibold tracking-widest text-kolo-muted uppercase mt-0.5 mb-2">{s.podnaslov}</p>
                <p className="text-sm text-kolo-text text-body leading-relaxed">{s.opis}</p>
              </div>
            ))}
          </div>

          <h4 className="text-xl font-bold text-kolo-green-900 mb-3 tracking-tight">{ts("nismo_razlike_naslov")}</h4>
          <ul className="space-y-3">
            {razlike.map((r) => (
              <li key={r} className="flex gap-3 text-kolo-text text-body leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-kolo-green-700 mt-2.5 shrink-0" aria-hidden="true" />
                <span>{r}</span>
              </li>
            ))}
          </ul>

        </div>
      </Kartica>

      {/* ── KAKO MOŽEŠ DA POMOGNEŠ ──────────────────────────────────── */}
      <div id="pomozi" className="space-y-5 scroll-mt-24">
        <Kartica padding="lg" className="md:p-10">
          <div className="inline-block bg-kolo-green-100 text-kolo-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            {t("ukljucivanje_tag")}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-kolo-green-900 mb-3 tracking-tight">
            {t("ukljucivanje_naslov")}
          </h3>
          <p className="text-kolo-muted max-w-[680px] text-body leading-relaxed">{t("ukljucivanje_opis")}</p>
        </Kartica>

        <div className="grid gap-4 md:grid-cols-2">
          {kartice.map((k) => (
            <Kartica key={k.naslov} padding="lg" className="flex flex-col gap-3 border-t-4 border-t-kolo-green-700">
              <h4 className="font-bold text-kolo-green-900 text-lg leading-snug tracking-tight">{k.naslov}</h4>
              <p className="text-sm text-kolo-muted flex-1 text-body leading-relaxed">{k.tekst}</p>
              {k.cta && k.ctaHref && (
                <a href={k.ctaHref} className="text-sm font-semibold text-kolo-green-700 hover:text-kolo-green-900 transition-colors mt-2">
                  {k.cta}
                </a>
              )}
            </Kartica>
          ))}
          <Kartica padding="lg" className="flex flex-col gap-3 border-t-4 border-t-kolo-gold-400">
            <h4 className="font-bold text-kolo-green-900 text-lg leading-snug tracking-tight">{t("podrzi_naslov")}</h4>
            <p className="text-sm text-kolo-muted flex-1 text-body leading-relaxed">{t("podrzi_tekst")}</p>
            <Link href="/podrzi-kolo" className="text-sm font-semibold text-kolo-green-700 hover:text-kolo-green-900 transition-colors mt-2">
              {t("podrzi_cta")}
            </Link>
          </Kartica>
        </div>

        <div className="pt-2">
          <p className="text-xs font-bold tracking-widest text-kolo-muted uppercase mb-3 px-1">{t("sek_tag")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sekundarne.map((k) => (
              <Kartica key={k.naslov} className="flex flex-col gap-2">
                <p className="font-semibold text-kolo-text text-sm leading-snug">{k.naslov}</p>
                <p className="text-xs text-kolo-muted text-body leading-relaxed">{k.tekst}</p>
              </Kartica>
            ))}
          </div>
        </div>
      </div>

      {/* ── KOLO FONDACIJA I KONTAKT ────────────────────────────────── */}
      <Kartica as="div" padding="nema" id="fondacija" className="overflow-hidden scroll-mt-24">
        <div className="p-6 md:p-10 border-b border-kolo-border">
          <div className="inline-block bg-kolo-green-100 text-kolo-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            {t("fondacija_tag")}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-kolo-green-900 tracking-tight">{t("fondacija_naslov")}</h3>
        </div>
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-kolo-border">
          {stubovi.map((stub) => (
            <div key={stub.naslov} className="p-6 md:p-8">
              <p className="text-xs font-bold tracking-widest text-kolo-muted uppercase mb-3">{stub.naslov}</p>
              <p className="text-sm text-kolo-text text-body leading-relaxed">{stub.tekst}</p>
            </div>
          ))}
          <div className="p-6 md:p-8">
            <p className="text-xs font-bold tracking-widest text-kolo-muted uppercase mb-3">{t("kontakt_tag")}</p>
            <p className="text-sm text-kolo-text">
              <a href="mailto:kontakt@ekolo.rs" className="font-medium text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
                kontakt@ekolo.rs
              </a>
            </p>
            <p className="text-sm text-kolo-text mt-1">{t("kontakt_adresa")}</p>
            <p className="text-sm text-kolo-muted leading-relaxed text-body mt-3">{t("kontakt_opis")}</p>
          </div>
        </div>
      </Kartica>

    </section>
  );
}
