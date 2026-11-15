import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { intlTag } from "@/lib/format";
import { klaseKartice } from "@/components/ui/Kartica";
import { izracunaj, ponudjaca, type Boja, type SirovoStanje } from "@/lib/pokazatelji-pravila";

/**
 * Pokazatelji sistema — jedna široka kartica sa četiri bara (odluka vlasnika
 * 15.11.2026). Pun bar = ispunjen cilj; boja po ostvarenosti (`boja()` u pravilima).
 * Stoji na vrhu `/sistem` i na `/sistem/zdravlje` (Kretanje pokazatelja).
 *
 * 🔴 Samo zbirni brojevi (`SirovoStanje`); pokazatelji se ne sabiraju u jedan broj;
 * boja nema dejstvo. Bez dinarskog iznosa (R-01).
 */
const BOJA_BARA: Record<Boja, string> = {
  ZELENO: "bg-kolo-green-500",
  ZUTO: "bg-kolo-gold-400",
  CRVENO: "bg-kolo-danger",
  SIVO: "bg-kolo-border-polje",
};

export default function PokazateljiSistemaKartica({
  dan,
  sirovo,
  vezaKretanje = false,
}: {
  /** Dan na koji se stanje odnosi, `GGGG-MM-DD`. */
  dan: string;
  sirovo: SirovoStanje;
  /** Veza ka stranici sa kretanjem po danima (na samoj toj stranici se ne crta). */
  vezaKretanje?: boolean;
}) {
  const t = useTranslations("pokazatelji_sistema");
  const tag = intlTag(useLocale());
  const broj = (n: number) => n.toLocaleString(tag);
  const procenat = (n: number | null) => (n === null ? "—" : `${Math.round(n).toLocaleString(tag)}%`);
  const [g, m, d] = dan.split("-");
  const stanje = izracunaj(sirovo);

  const detalj: Record<string, string> = {
    PONUDA: t("detalj_PONUDA", { deo: broj(sirovo.korisniciSaPonudom), ukupno: broj(sirovo.korisnici) }),
    RAZMENE: t("detalj_RAZMENE", { razmene: broj(sirovo.razmene), korisnici: broj(sirovo.korisnici) }),
    KRUZENJE: t("detalj_KRUZENJE", { razmenjeno: broj(sirovo.razmenjeniPoen), ukupno: broj(sirovo.opticaj) }),
    GLASOVI: !sirovo.faza2
      ? t("detalj_GLASOVI_faza1")
      : sirovo.glasoviOstalih === null || sirovo.glasoviOsnivaca === null
        ? t("detalj_GLASOVI_nepoznato")
        : t("detalj_GLASOVI", { ostali: broj(sirovo.glasoviOstalih), osnivaci: broj(sirovo.glasoviOsnivaca) }),
  };

  return (
    <section className={`${klaseKartice({ padding: "nema" })} p-4 md:p-6`} aria-labelledby="pokazatelji-sistema-naslov">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="pokazatelji-sistema-naslov" className="text-lg font-semibold text-kolo-text">{t("naslov")}</h2>
        <p className="text-xs text-kolo-muted">{t("stanje_na_dan", { datum: `${d}.${m}.${g}.` })}</p>
      </div>

      <ul className="mt-4 space-y-5">
        {stanje.map((p) => (
          <li key={p.sifra}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
              <h3 className="text-sm font-semibold text-kolo-text">{t(`naziv_${p.sifra}`)}</h3>
              <p className="text-sm text-kolo-text">
                <span className="text-base font-bold">{procenat(p.vrednost)}</span>
                <span className="text-kolo-muted"> · {t("cilj", { cilj: `${p.cilj}%` })}</span>
              </p>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, Math.round(p.ostvarenost ?? 0))}
                aria-label={t("ostvareno", { procenat: procenat(p.ostvarenost) })}
                className="h-3 flex-1 overflow-hidden rounded-full bg-kolo-bg"
              >
                <div
                  className={`h-full rounded-full ${BOJA_BARA[p.boja]}`}
                  style={{ width: `${Math.min(100, Math.max(0, p.ostvarenost ?? 0))}%` }}
                />
              </div>
              <p className="w-28 shrink-0 text-right text-xs font-medium text-kolo-text">
                {t("ostvareno", { procenat: procenat(p.ostvarenost) })}
              </p>
            </div>
            <p className="mt-1 text-xs text-kolo-muted">{detalj[p.sifra]}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-kolo-border pt-4 text-xs md:grid-cols-4">
        <div>
          <dt className="text-kolo-muted">{t("broj_ucesnici")}</dt>
          <dd className="text-sm font-semibold text-kolo-text">{broj(sirovo.ucesnici)}</dd>
        </div>
        <div>
          <dt className="text-kolo-muted">{t("broj_ponude")}</dt>
          <dd className="text-sm font-semibold text-kolo-text">{broj(sirovo.ponude)}</dd>
        </div>
        <div>
          <dt className="text-kolo-muted">{t("broj_ponudjaci")}</dt>
          <dd className="text-sm font-semibold text-kolo-text">
            {broj(ponudjaca(sirovo))}
            <span className="font-normal text-kolo-muted">
              {" "}
              {t("ponudjaci_sastav", { gazdinstva: broj(sirovo.ponudjaciGazdinstva), pojedinci: broj(sirovo.ponudjaciPojedinci) })}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-kolo-muted">{t("broj_ponude_hrane")}</dt>
          <dd className="text-sm font-semibold text-kolo-text">{broj(sirovo.ponudeHrane)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-kolo-muted">{t("napomena")}</p>

      {vezaKretanje && (
        <div className="mt-3 flex justify-end">
          <Link href="/sistem/zdravlje" className="inline-flex min-h-10 items-center text-sm font-medium text-kolo-green-700 hover:underline">
            {t("kretanje_link")} →
          </Link>
        </div>
      )}
    </section>
  );
}
