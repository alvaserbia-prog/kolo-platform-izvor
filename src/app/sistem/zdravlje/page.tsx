import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { sesija } from "@/lib/sesija";
import { jeAdmin } from "@/lib/dozvole";
import { intlTag } from "@/lib/format";
import { izracunajPokazatelje, type StanjePokazatelja, type Lampica, type Grupa } from "@/lib/protokol/pokazatelji";
import Stranica from "@/components/ui/Stranica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Kartica from "@/components/ui/Kartica";
import Obavestenje from "@/components/ui/Obavestenje";

/**
 * Zdravlje sistema (odluka vlasnika 25.10.2026): svi pokazatelji zdravlja i
 * koncentracije na jednoj stranici — opis, smernica i lampica stanja. Javna kao i
 * `/sistem` (odluka 3a: zbir svima, i gostu); pokazatelji sa užom vidljivošću
 * (`vidi` u `pokazatelji-pravila.ts`) server ni ne računa za onoga ko ih ne vidi.
 * Zapis: `docs/provera-akata/koncentracija-5-0.md`.
 *
 * 🔴 Na ovoj stranici nema nijednog dinarskog iznosa: nosi pokazatelje POEN-a, pa
 * bi dinar uz njih dao odnos deljenjem (R-01). Z7 je samo procenat.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("zdravlje");
  return pageMetadata({ title: `${t("naslov_stranice")} — KOLO`, description: t("meta_opis"), path: "/sistem/zdravlje" });
}

const BOJA_LAMPICE: Record<Lampica, string> = {
  ZELENO: "bg-kolo-green-500",
  ZUTO: "bg-kolo-gold-400",
  CRVENO: "bg-kolo-danger",
  SIVO: "bg-kolo-border-polje",
};

const GRUPE: Grupa[] = ["ZDRAVLJE", "KONCENTRACIJA"];

function LampicaZnak({ boja, oznaka }: { boja: Lampica; oznaka: string }) {
  return (
    <span
      role="img"
      aria-label={oznaka}
      title={oznaka}
      className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full ${BOJA_LAMPICE[boja]}`}
    />
  );
}

export default async function ZdravljeSistemaPage() {
  const session = await sesija();
  const posmatrac = {
    ucesnik: !!session?.user.verified && !session.user.maloletan,
    admin: jeAdmin(session?.user),
  };
  const [t, locale, pokazatelji] = await Promise.all([
    getTranslations("zdravlje"),
    getLocale(),
    izracunajPokazatelje(posmatrac),
  ]);
  const tag = intlTag(locale);
  const broj = (n: number) => n.toLocaleString(tag, { maximumFractionDigits: 1 });

  const vrednost = (p: StanjePokazatelja) =>
    p.vrednost === null ? "—" : p.jedinica === "PROCENAT" ? `${broj(p.vrednost)}%` : broj(p.vrednost);

  const smernica = (p: StanjePokazatelja) =>
    t(p.smernica.smer === "VISE" ? "smernica_VISE" : "smernica_MANJE", {
      zeleno: broj(p.smernica.zeleno),
      zuto: broj(p.smernica.zuto),
      j: p.jedinica === "PROCENAT" ? "%" : "",
    });

  const razlog = (p: StanjePokazatelja) => {
    if (!p.razlog) return null;
    if (p.razlog === "PREMALO" && p.detalj?.cuvara !== undefined) return t("razlog_PREMALO_moc", { cuvara: p.detalj.cuvara });
    return t(`razlog_${p.razlog}`);
  };

  // Rečenica ispod vrednosti postoji samo za pokazatelje koji imaju ključ `detalj_*`.
  const detalj = (p: StanjePokazatelja) =>
    p.detalj && t.has(`detalj_${p.sifra}`)
      ? t(`detalj_${p.sifra}`, Object.fromEntries(Object.entries(p.detalj).map(([k, v]) => [k, broj(v)])))
      : null;

  const danas = new Date().toLocaleDateString(tag, { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <Stranica sirina="siroka">
      <NaslovStranice
        nazad={{ href: "/sistem", oznaka: t("nazad") }}
        naslov={t("naslov")}
        opis={t("opis")}
      />

      <Kartica className="space-y-3">
        <h2 className="text-sm font-semibold text-kolo-text">{t("lampice_naslov")}</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(["ZELENO", "ZUTO", "CRVENO", "SIVO"] as const).map((l) => (
            <li key={l} className="flex items-center gap-2 text-sm text-kolo-text">
              <LampicaZnak boja={l} oznaka={t(`lampica_${l}`)} />
              {t(`lampica_${l}`)}
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-kolo-muted">{t("bez_dejstva")}</p>
      </Kartica>

      <Obavestenje vrsta="info">{t("faza1")}</Obavestenje>

      {GRUPE.map((g) => (
        <section key={g} className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-kolo-text">{t(`grupa_${g}`)}</h2>
            <p className="text-sm text-kolo-muted">{t(`grupa_${g}_opis`)}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pokazatelji
              .filter((p) => p.grupa === g)
              .map((p) => (
                <Kartica key={p.sifra} as="article" className="flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-1">
                      <LampicaZnak boja={p.lampica} oznaka={t(`lampica_${p.lampica}`)} />
                    </span>
                    <h3 className="text-sm font-semibold text-kolo-text">{t(`naziv_${p.sifra}`)}</h3>
                  </div>
                  <p className="text-2xl font-bold text-kolo-text">{vrednost(p)}</p>
                  {detalj(p) && <p className="text-xs text-kolo-muted">{detalj(p)}</p>}
                  {razlog(p) && <p className="text-xs text-kolo-muted">{razlog(p)}</p>}
                  <p className="text-sm leading-relaxed text-kolo-text">{t(`opis_${p.sifra}`)}</p>
                  <p className="mt-auto text-xs text-kolo-muted">
                    <span className="font-semibold">{t("smernica")}:</span> {smernica(p)}
                  </p>
                  {p.vidi !== "SVI" && (
                    <p className="text-xs text-kolo-gold-700">{t(p.vidi === "ADMIN" ? "samo_admin" : "samo_ucesnik")}</p>
                  )}
                </Kartica>
              ))}
          </div>
        </section>
      ))}

      <p className="text-xs leading-relaxed text-kolo-muted">
        {t("granice")} {t("stanje_na_dan", { datum: danas })}
      </p>
    </Stranica>
  );
}
