import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { intlTag } from "@/lib/format";
import { MINIMUM_POEN_ZA_UPIS_ZRNA } from "@/lib/protokol/zrno";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";
import ZaglavljePoglavlja from "./ZaglavljePoglavlja";

/**
 * Poglavlje 4 — pravna kvalifikacija POEN-a i ZRNA. Do 22.10.2026 zasebna
 * stranica `/pravna-pozicija`.
 *
 * 🔴 Stoji POSLEDNJE, ispod završnog poziva i van sidrenog menija na vrhu
 * stranice (odluka vlasnika, 22.10.2026). Razlog je isti kao kad je izdvojena
 * (03.09.2026): regulatoru i novinaru je ova argumentacija neophodna, ali čoveku
 * koji je došao da vidi pijacu lista „POEN nije…" proizvodi sumnju koje nije
 * bilo. Do nje vode sidro `#pravila`, futer i stara adresa.
 *
 * 🔴 Odredbe se navode PO BROJU ČLANA i usklađene su sa Pravilnikom 5.0.0
 * (26.10.2026): čl. 12 i 16 (POEN), 21 (kvalifikacija ZRNA), 24 (neprenosivost),
 * 25 (obračunski koeficijent), 27 (položaj čuvara Kola nije ulaganje), 12 i 33
 * (ne nasleđuje se), 36 (dinar ulazi u Fondaciju), 44 (glasanje po kvadratnom korenu), 9
 * (sistem nije platna institucija), 11 (nekonvertibilnost), 14 (donacija nije
 * protivusluga). Do 23.10.2026 su brojevi u `zasto3` i `zasto6` bili zamenjeni. Pri svakom bumpu seta akata proveriti da numeracija nije
 * pomerena — pogrešan broj člana na javnoj pravnoj strani gori je od nenavedenog.
 *
 * 🟡 Lista `poen_nije1..6` namerno se čita iz namespace-a `kakoFunkcionisePage`,
 * odakle je i preseljena: isti tekst, bez drugog prevoda koji bi vremenom
 * odlutao od prvog.
 */
export default async function PoglavljePravila() {
  const t = await getTranslations("pravnaPozicija");
  const tk = await getTranslations("kakoFunkcionisePage");
  const td = await getTranslations("oNama");
  const locale = await getLocale();

  const poenNije = [
    tk("poen_nije1"), tk("poen_nije2"), tk("poen_nije3"),
    tk("poen_nije4"), tk("poen_nije5"), tk("poen_nije6"),
  ];
  const zrnoNije = [
    t("zrno_nije1"), t("zrno_nije2"), t("zrno_nije3"),
    t("zrno_nije4"), t("zrno_nije5"), t("zrno_nije6"),
  ];
  // Šest odredaba koje obaraju čitanje ZRNA kao investicionog instrumenta.
  // 🔴 `zasto2` NE tvrdi da dinarskog ulaza nema — donacija u dinarima postoji i
  // nosi evidentiran POEN. Tvrdi ono što akti stvarno kažu: da su to dva pravno
  // nezavisna akta, da dinar ulazi u Fondaciju a ne u obračunski okvir (čl. 36)
  // i da evidentiranje nije protivusluga (čl. 14).
  const razlozi = [1, 2, 3, 4, 5, 6].map((n) => ({
    naslov: t(`zasto${n}_naslov`),
    tekst: t(`zasto${n}_tekst`),
  }));
  // Provera po propisima — uz zaključak i razlog (Whitepaper pogl. 4 i 6):
  // zaključak bez razloga na pravnoj strani ne vredi ništa.
  const propisi = [
    { naslov: t("zdi_naslov"), tekst: t("zdi_tekst") },
    { naslov: t("zps_naslov"), tekst: t("zps_tekst") },
    { naslov: t("ztk_naslov"), tekst: t("ztk_tekst") },
    // 🔴 Poreski odeljak (R-02): Poreska uprava je regulator koji najpre zaista dođe.
    { naslov: t("porez_naslov"), tekst: t("porez_tekst") },
    // 🔴 Zaštita potrošača (R-07): regulator sa NAJNIŽIM pragom za dolazak; prvo
    // pitanje je da li je Fondacija uopšte trgovac.
    { naslov: t("zzp_naslov"), tekst: t("zzp_tekst") },
  ];
  // Dva mesta koja mehanika sama otvara. Stoje u poglavlju, ne u fusnoti: ko ih
  // uoči sam, a ne nađe odgovor, zaključiće da odgovora nema.
  const sporno = [
    // Prag za upis ZRNA čita se iz pravila (pravilo 10).
    { naslov: t("sporno1_naslov"), tekst: t("sporno1_tekst_prag", { prag: MINIMUM_POEN_ZA_UPIS_ZRNA.toLocaleString(intlTag(locale)) }) },
    { naslov: t("sporno2_naslov"), tekst: t("sporno2_tekst") },
  ];
  // Pun spisak akata živi na jednom mestu (`/pravilnik`); ovde samo oni na koje
  // se poglavlje poziva i put do svih.
  const dokumenti = [
    { href: "/pravilnik", label: t("svi_akti") },
    { href: "/pravilnik/kolo-sistem", label: td("dok_pravilnik_kolo") },
    { href: "/whitepaper", label: td("dok_whitepaper") },
    { href: "/statut", label: td("dok_statut") },
    { href: "/rizici", label: td("dok_rizici") },
  ];

  return (
    <section className="space-y-6">
      <ZaglavljePoglavlja
        id="pravila"
        oznaka={t("hero_tag")}
        naslov={t("hero_naslov")}
        opis={t("hero_opis")}
      />

      <Kartica as="div" padding="lg" className="md:p-8">
        <p className="text-base text-kolo-text leading-relaxed text-body">{t("uvod")}</p>
      </Kartica>

      {/* ── DVE LISTE, SIMETRIČNO ──────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { naslov: t("poen_naslov"), uvod: t("poen_uvod"), stavke: poenNije },
          { naslov: t("zrno_naslov"), uvod: t("zrno_uvod"), stavke: zrnoNije },
        ].map((blok) => (
          <Kartica key={blok.naslov} padding="lg" className="md:p-8">
            <h3 className="text-xl font-bold text-kolo-green-900 mb-2 tracking-tight">{blok.naslov}</h3>
            <p className="text-sm text-kolo-muted leading-relaxed text-body mb-4">{blok.uvod}</p>
            <ul className="space-y-2">
              {blok.stavke.map((s) => (
                <li key={s} className="flex gap-2 items-start text-base text-kolo-muted">
                  <span className="text-kolo-danger mt-0.5 shrink-0" aria-hidden="true">✕</span>
                  {s}
                </li>
              ))}
            </ul>
          </Kartica>
        ))}
      </div>

      {/* ── ZAŠTO TO NIJE SAMO IZJAVA ──────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-kolo-green-900 tracking-tight">{t("zasto_naslov")}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {razlozi.map((r) => (
            <Kartica key={r.naslov}>
              <p className="font-semibold text-kolo-text text-base mb-1.5">{r.naslov}</p>
              <p className="text-sm text-kolo-muted leading-relaxed text-body">{r.tekst}</p>
            </Kartica>
          ))}
        </div>
      </div>

      {/* ── PROVERA PO PROPISIMA ───────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-kolo-green-900 mb-1 tracking-tight">{t("propisi_naslov")}</h3>
          <p className="text-sm text-kolo-muted leading-relaxed text-body">{t("propisi_uvod")}</p>
        </div>
        <div className="space-y-3">
          {propisi.map((z) => (
            <Kartica key={z.naslov} className="md:p-6">
              <p className="font-semibold text-kolo-green-900 text-base mb-2">{z.naslov}</p>
              <p className="text-sm text-kolo-muted leading-relaxed text-body whitespace-pre-line">{z.tekst}</p>
            </Kartica>
          ))}
        </div>
      </div>

      {/* ── OKVIR SOCIJALNE I SOLIDARNE EKONOMIJE ─────────────────────
          Do 23.10.2026 u „Nismo prvi" (poglavlje 3). Čitalac ovog spiska je
          regulator, ne posetilac koji je došao po priču. 🔴 `okvir_merilo`
          nosi zaštitu od čitanja spiska kao odobrenja javnog tela. */}
      <Kartica className="md:p-6">
        <h3 className="text-2xl font-bold text-kolo-green-900 mb-3 tracking-tight">{t("okvir_naslov")}</h3>
        <div className="space-y-3 text-sm text-kolo-muted leading-relaxed text-body">
          <p>{t("okvir_tekst")}</p>
          <p>{t("okvir_merilo")}</p>
        </div>
      </Kartica>

      {/* ── DVA MESTA KOJA IZGLEDAJU SPORNO ────────────────────────── */}
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-kolo-green-900 mb-1 tracking-tight">{t("sporno_naslov")}</h3>
          <p className="text-sm text-kolo-muted leading-relaxed text-body">{t("sporno_uvod")}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {sporno.map((s) => (
            <Kartica key={s.naslov} className="md:p-6 border-l-4 border-l-kolo-gold-400">
              <p className="font-semibold text-kolo-text text-base mb-2">{s.naslov}</p>
              <p className="text-sm text-kolo-muted leading-relaxed text-body">{s.tekst}</p>
            </Kartica>
          ))}
        </div>
      </div>

      {/* ── NOSEĆI PRINCIP ─────────────────────────────────────────── */}
      <div className="bg-kolo-green-100 rounded-kartica p-6 md:p-8">
        <h3 className="text-xl font-bold text-kolo-green-900 mb-2 tracking-tight">{t("principi_naslov")}</h3>
        <p className="text-sm text-kolo-text leading-relaxed text-body">{t("principi_tekst")}</p>
      </div>

      {/* ── FONDACIJA I LICENCE ────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Kartica padding="lg" className="md:p-8">
          <h3 className="text-xl font-bold text-kolo-green-900 mb-2 tracking-tight">{t("fondacija_naslov")}</h3>
          <p className="text-sm text-kolo-muted leading-relaxed text-body">{t("fondacija_tekst")}</p>
        </Kartica>
        <Kartica padding="lg" className="md:p-8">
          <h3 className="text-xl font-bold text-kolo-green-900 mb-2 tracking-tight">{t("licence_naslov")}</h3>
          <p className="text-sm text-kolo-muted leading-relaxed text-body mb-3">{t("licence_tekst")}</p>
          <Link href="/zajednicko-dobro" className="text-sm font-medium text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
            {td("cta_licence")} →
          </Link>
        </Kartica>
      </div>

      {/* ── GDE PIŠE DETALJNO ──────────────────────────────────────── */}
      <Kartica padding="lg" className="md:p-8">
        <h3 className="text-xl font-bold text-kolo-green-900 mb-2 tracking-tight">{t("gde_naslov")}</h3>
        <p className="text-sm text-kolo-muted leading-relaxed text-body mb-4">{t("gde_uvod")}</p>
        <div className="flex flex-wrap gap-2">
          {dokumenti.map((d) => (
            <Link key={d.href} href={d.href} className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
              {d.label}
            </Link>
          ))}
        </div>
      </Kartica>
    </section>
  );
}
