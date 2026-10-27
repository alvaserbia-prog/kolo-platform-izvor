import { getTranslations } from "next-intl/server";

/**
 * Crtež KOLO sistema (odluka vlasnika, 22–23.10.2026): u sredini krugovi KOLO
 * Zajednice, a oko njih šest delova u simetriji — gore Fondacija (potpisuje
 * ugovore sa svima), dole Protokol (vodi evidenciju), levo zadruge i
 * gazdinstva (oni koji proizvode u mestu), desno firme i udruženja (oni koji
 * podržavaju). Na telefonu se isti delovi slažu uspravno: Fondacija, krugovi,
 * zadruge, gazdinstva, firme, udruženja, Protokol.
 *
 * 🔴 Crtež NE crta međusobne odnose ni tokove (odluka vlasnika, 23.10.2026):
 * svaki deo nosi tri kratke stavke o tome šta je, bez linija i strelica. Jedina
 * rečenica o odnosima je napomena ispod crteža — „Novac ulazi samo u Fondaciju,
 * a POEN postoji samo u evidenciji Protokola." (Pravilnik čl. 36 i 16) — i
 * ona je obavezna. Ne dodavati veze, tokove ni nove delove bez naloga vlasnika.
 *
 * Krugovi su KOLO Zajednica — „opisni pojam za sveukupnost učesnika sistema"
 * (Pravilnik čl. 2): u centru čuvari Kola (sa aktiviranim ZRNOM čine Gornje
 * Kolo, od javnog otvaranja), oko njih članovi Kola, pa članovi bez potvrde — to
 * je Kolo, krug u lancu potvrda; spolja korisnici i deca (deca su zaseban luk,
 * jer nisu korisnici, Pravilnik čl. 2 i deca čl. 2 st. 2). Delovi oko krugova NISU
 * učesnici: gazdinstvo nema zapis u Protokolu (čl. 39 st. 1), a firma i udruženje su
 * pokrovitelji čiji POEN ide učesniku koji je podneo prijavu.
 */

const CX = 230;
const CY = 230;
// Poluprečnici: centar, članovi Kola, članovi bez potvrde (granica Kola), Zajednica.
const R = [78, 124, 170, 222] as const;

const ZELENA = "#1B6B3A";
const ZELENA_TEKST = "#4B7A5E";
const ZLATNA = "#A07020";
const ZLATNA_TAMNA = "#92600A";

/** Isečak prstena između poluprečnika r1 i r2, od ugla a1 do a2 (stepeni, 0° desno, u smeru kazaljke). */
function isecak(r1: number, r2: number, a1: number, a2: number) {
  const tacka = (r: number, a: number) => {
    const rad = (a * Math.PI) / 180;
    return `${(CX + r * Math.cos(rad)).toFixed(1)} ${(CY + r * Math.sin(rad)).toFixed(1)}`;
  };
  const veliki = a2 - a1 > 180 ? 1 : 0;
  return `M ${tacka(r2, a1)} A ${r2} ${r2} 0 ${veliki} 1 ${tacka(r2, a2)} L ${tacka(r1, a2)} A ${r1} ${r1} 0 ${veliki} 0 ${tacka(r1, a1)} Z`;
}

/** Deo oko krugova — naziv i tri kratke stavke, bez veza prema drugima. */
function Deo({ naslov, stavke, zlatni = false, className = "" }: {
  naslov: string; stavke: string[]; zlatni?: boolean; className?: string;
}) {
  return (
    <div className={`w-full rounded-kartica border-2 px-3 py-3 text-center ${zlatni ? "border-kolo-gold-400 bg-kolo-gold-100" : "border-kolo-green-100 bg-kolo-bg"} ${className}`}>
      <p className={`text-sm font-bold tracking-wide ${zlatni ? "text-kolo-gold-700" : "text-kolo-green-900"}`}>{naslov}</p>
      {stavke.map((r) => (
        <p key={r} className="text-xs text-kolo-muted leading-snug mt-1">{r}</p>
      ))}
    </div>
  );
}

export default async function ArhitekturaSistema() {
  const t = await getTranslations("oSistemu");
  const stavke = (deo: string) => [1, 2, 3].map((n) => t(`svg_${deo}_${n}`));

  return (
    <div className="space-y-4" role="group" aria-label={t("arhitektura_naslov")}>
      <p className="text-center text-lg md:text-xl font-bold tracking-[0.2em] text-kolo-green-900">{t("svg_sistem")}</p>

      {/* Na telefonu jedna kolona; od md tri kolone, sa krugovima u sredini i po
          dva dela sa strane (gore i dole), da šest delova stoji simetrično. */}
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_minmax(0,1fr)] md:items-stretch">

        {/* GORE: Fondacija */}
        <div className="md:col-start-2 md:row-start-1 flex justify-center">
          <Deo className="max-w-xs" naslov={t("svg_fondacija_naslov")} stavke={stavke("fondacija")} />
        </div>

        {/* SREDINA: krugovi KOLO Zajednice */}
        <div className="md:col-start-2 md:row-start-2">
          <svg viewBox="0 0 460 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md mx-auto block" role="img" aria-label={t("svg_kolo_zajednica")}>
            {/* Spoljni prsten: korisnici, sa lukom za decu na dnu. */}
            <circle cx={CX} cy={CY} r={R[3]} fill="#FFFFFF" stroke="#C9D6CE" strokeWidth="1.6" />
            <path d={isecak(R[2], R[3], 60, 120)} fill="#FFF8EC" stroke="#F0C060" strokeWidth="1.4" />
            {/* Kolo: članovi bez potvrde, članovi Kola, čuvari. */}
            <circle cx={CX} cy={CY} r={R[2]} fill="#F0F9F4" stroke={ZELENA} strokeWidth="1.6" strokeDasharray="5 3" />
            <circle cx={CX} cy={CY} r={R[1]} fill="#E3F2E9" stroke="#B3DFC5" strokeWidth="1.4" />
            <circle cx={CX} cy={CY} r={R[0]} fill="#FFFBEB" stroke="#F0C060" strokeWidth="2.2" />

            {/* Centar: čuvari Kola i Gornje Kolo */}
            <text x={CX} y={CY - 20} textAnchor="middle" fill={ZLATNA_TAMNA} fontSize="17" fontWeight="700">{t("svg_cuvari")}</text>
            <text x={CX} y={CY + 1} textAnchor="middle" fill={ZLATNA_TAMNA} fontSize="14" fontWeight="600">{t("svg_gornje_kolo")}</text>
            <text x={CX} y={CY + 18} textAnchor="middle" fill={ZLATNA} fontSize="12">{t("svg_cuvari_opis")}</text>
            {/* Gornje Kolo se uključuje tek sa javnim otvaranjem (1.000.000 POENA). */}
            <text x={CX} y={CY + 34} textAnchor="middle" fill={ZLATNA} fontSize="11">{t("svg_od_otvaranja")}</text>

            {/* Prstenovi — natpis u gornjem delu svakog prstena */}
            <text x={CX} y={CY - 100} textAnchor="middle" fill={ZELENA} fontSize="13" fontWeight="700">{t("svg_clanovi_kola")}</text>
            <text x={CX} y={CY - 86} textAnchor="middle" fill={ZELENA_TEKST} fontSize="12">{t("svg_clanovi_kola_opis")}</text>
            <text x={CX} y={CY - 145} textAnchor="middle" fill={ZELENA} fontSize="13" fontWeight="700">{t("svg_bez_potvrde")}</text>
            <text x={CX} y={CY - 131} textAnchor="middle" fill={ZELENA_TEKST} fontSize="12">{t("svg_bez_potvrde_opis")}</text>
            <text x={CX} y={CY - 199} textAnchor="middle" fill={ZELENA} fontSize="14" fontWeight="700">{t("svg_korisnici")}</text>
            <text x={CX} y={CY - 184} textAnchor="middle" fill={ZELENA_TEKST} fontSize="12">{t("svg_korisnici_opis")}</text>

            {/* Granica Kola — natpis na dnu prstena članova bez potvrde */}
            <text x={CX} y={CY + 152} textAnchor="middle" fill={ZELENA} fontSize="11" fontWeight="700" letterSpacing="1">{t("svg_kolo_krug")}</text>

            {/* Deca — luk na dnu spoljnog prstena */}
            <text x={CX} y={CY + 192} textAnchor="middle" fill={ZLATNA_TAMNA} fontSize="15" fontWeight="700">{t("svg_deca")}</text>
            <text x={CX} y={CY + 208} textAnchor="middle" fill={ZLATNA} fontSize="12">{t("svg_deca_opis")}</text>

            {/* Naziv celih krugova */}
            <text x={CX} y={CY + R[3] + 22} textAnchor="middle" fill={ZELENA} fontSize="16" fontWeight="700" letterSpacing="2">{t("svg_kolo_zajednica")}</text>
            <text x={CX} y={CY + R[3] + 39} textAnchor="middle" fill={ZELENA_TEKST} fontSize="12">{t("svg_svi_ucesnici")}</text>
          </svg>
        </div>

        {/* LEVO: zadruge i gazdinstva — oni koji proizvode u mestu */}
        <div className="md:col-start-1 md:row-start-2 grid gap-3 sm:grid-cols-2 md:grid-cols-1 md:content-between md:justify-items-end md:py-6">
          <Deo className="md:max-w-[13rem]" naslov={t("svg_zadruge")} stavke={stavke("zadruge")} zlatni />
          <Deo className="md:max-w-[13rem]" naslov={t("svg_gazdinstva")} stavke={stavke("gazdinstva")} />
        </div>

        {/* DESNO: firme i udruženja — oni koji podržavaju */}
        <div className="md:col-start-3 md:row-start-2 grid gap-3 sm:grid-cols-2 md:grid-cols-1 md:content-between md:justify-items-start md:py-6">
          <Deo className="md:max-w-[13rem]" naslov={t("svg_firme")} stavke={stavke("firme")} />
          <Deo className="md:max-w-[13rem]" naslov={t("svg_udruzenja")} stavke={stavke("udruzenja")} />
        </div>

        {/* DOLE: Protokol, iste širine kao Fondacija */}
        <div className="md:col-start-2 md:row-start-3 flex justify-center">
          <Deo className="max-w-xs" naslov={t("svg_protokol_naslov")} stavke={stavke("protokol")} zlatni />
        </div>
      </div>

      {/* 🔴 Obavezna napomena (odluka vlasnika, 23.10.2026). */}
      <p className="text-center text-sm font-semibold text-kolo-text">{t("svg_napomena")}</p>
    </div>
  );
}
