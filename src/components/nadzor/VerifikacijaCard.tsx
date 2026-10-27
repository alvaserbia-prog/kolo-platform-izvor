"use client";

/**
 * Kartica zapisa koji čeka nadzor: verifikacija (potvrda ili uvođenje u Kolo),
 * potvrda člana bez potvrde (i automatska potvrda lanca) ili potvrda postojanja
 * deteta (dokaz stvarnosti čl. 22, set 4.8.2).
 *
 * Do 4.2.0 je imala jedno dugme — „Potvrdi nadzor". Nadzornik koji nešto posumnja
 * nije imao gde to da upiše, pa ni traga o tome nije bilo, a podsticaj (500 POEN
 * samo uz potvrdu) gurao je ka propuštanju. Sada su tri ishoda i svi se plaćaju isto
 * (Pravilnik o dokazu stvarnosti 4.2.0, čl. 7 st. 2 i čl. 11).
 */

import { useState } from "react";
import { intlTag } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import { RAZLOZI, SUBJEKTI, jeSumnja, type Ishod, type Subjekt, type Razlog } from "@/lib/nadzor-pravila";
import type { SignalNadzora } from "@/lib/nadzor-signali-pravila";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

type VrstaPredmeta = "VERIFIKACIJA" | "POTVRDA_CLANA" | "POTVRDA_POSTOJANJA";

type RanijiZapis = { id: string; ishod: string; razlog: string | null; createdAt: string };

type Props = {
  id: string;
  /** Podrazumevano VERIFIKACIJA. */
  vrstaPredmeta?: VrstaPredmeta;
  /** Samo verifikacija: potvrda ili uvođenje u Kolo. */
  vrstaVerifikacije?: "POTVRDA" | "UVODJENJE" | null;
  /** Samo potvrda člana: CLAN_KOLA, FONDACIJA ili LANAC. */
  izvor?: string | null;
  /** Samo potvrda člana: ko je potvrđenog uveo u Kolo. */
  uveo?: { id: string; pseudonim: string } | null;
  /** `null` kod automatske potvrde lanca (nema čoveka koji je dao potvrdu). */
  verifikator: { id: string; pseudonim: string } | null;
  verifikovani: { id: string; pseudonim: string };
  datum: string;
  ranijiZapisi?: RanijiZapis[];
  /** Signali (dokaz stvarnosti čl. 25): gde da nadzornik pogleda prvo. Nisu ishod. */
  signali?: SignalNadzora[];
};

export default function VerifikacijaCard({
  id,
  vrstaPredmeta = "VERIFIKACIJA",
  vrstaVerifikacije = null,
  izvor = null,
  uveo = null,
  verifikator,
  verifikovani,
  datum,
  ranijiZapisi = [],
  signali = [],
}: Props) {
  const locale = useLocale();
  const t = useTranslations("nadzor");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Otvorena forma za ishod koji traži obrazloženje (čl. 24 st. 3).
  const [formaZa, setFormaZa] = useState<Ishod | null>(null);
  const [subjekt, setSubjekt] = useState<Subjekt>("VERIFIKOVANI");
  const [razlog, setRazlog] = useState<Razlog>("ne_poznaju_se");
  const [opis, setOpis] = useState("");

  async function posalji(ishod: Ishod) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/nadzor/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          jeSumnja(ishod)
            ? { vrstaPredmeta, ishod, subjekt, razlog, opis: opis.trim() || null }
            : { vrstaPredmeta, ishod }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("greska"));
        return;
      }
      setFormaZa(null);
      router.refresh();
    } catch {
      setError(t("greska_mreza"));
    } finally {
      setLoading(false);
    }
  }

  const datumLepo = new Date(datum).toLocaleString(intlTag(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-kartica border border-kolo-border bg-kolo-surface p-4 shadow-kartica space-y-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-tight">
          {verifikator ? (
            <Link href={profilHref(verifikator)} className="font-semibold break-all hover:underline">
              @<Pseudonim>{verifikator.pseudonim}</Pseudonim>
            </Link>
          ) : (
            <span className="font-semibold text-kolo-muted">{t("predmet_lanac")}</span>
          )}
          <span className="text-kolo-muted" aria-hidden="true">
            →
          </span>
          <Link href={profilHref(verifikovani)} className="font-semibold break-all hover:underline">
            @<Pseudonim>{verifikovani.pseudonim}</Pseudonim>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-kolo-muted">
          <span className="px-1.5 py-0.5 rounded border border-kolo-border bg-kolo-bg text-kolo-text">
            {vrstaPredmeta === "POTVRDA_POSTOJANJA"
              ? t("predmet_postojanje")
              : vrstaPredmeta === "POTVRDA_CLANA"
                ? izvor === "LANAC"
                  ? t("predmet_potvrda_lanca")
                  : t("predmet_potvrda_clana")
                : vrstaVerifikacije === "UVODJENJE"
                  ? t("predmet_uvodjenje")
                  : t("predmet_potvrda")}
          </span>
          <span className="whitespace-nowrap">{datumLepo}</span>
          {uveo && (
            <span>
              {t("predmet_uveo")} @<Pseudonim>{uveo.pseudonim}</Pseudonim>
            </span>
          )}
        </div>
        {signali.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {signali.map((sg) => (
              <li key={sg.kod} className="text-xs px-2 py-0.5 rounded-full bg-kolo-gold-50 text-kolo-gold-700 border border-kolo-gold-200">
                {sg.kod === "VISE_U_DANU"
                  ? t("signal_vise_u_danu", { redni: sg.redni })
                  : sg.kod === "BEZ_POTVRDE"
                    ? t("signal_bez_potvrde")
                    : sg.kod === "PO_POZIVU"
                      ? t("signal_uvodjenje_sa_spiska")
                      : sg.kod === "LANAC"
                        ? t("signal_lanac", { korak: sg.korak })
                        : sg.kod === "UVODILAC"
                          ? t("signal_uvodilac")
                        : sg.kod === "BEZ_RAZMENE"
                          ? t("signal_bez_razmene", { dana: sg.dana })
                          : t("signal_drugo_mesto")}
              </li>
            ))}
          </ul>
        )}
        {ranijiZapisi.length > 0 && (
          <div className="text-xs text-kolo-gold-700">
            {t("vec_gledali", { broj: ranijiZapisi.length })}
          </div>
        )}
        {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}
      </div>

      {formaZa === null && (
        <div className="grid grid-cols-3 gap-2">
          <Dugme onClick={() => posalji("UREDNO")} disabled={loading} punaSirina className="px-2">
            {t("ishod_uredno")}
          </Dugme>
          <button
            onClick={() => setFormaZa("ZA_PROVERU")}
            disabled={loading}
            type="button"
            className="w-full min-h-10 px-2 rounded-kontrola border border-kolo-gold-200 bg-kolo-gold-50 text-kolo-gold-700 text-sm font-semibold hover:bg-kolo-gold-100 disabled:opacity-50"
          >
            {t("ishod_za_proveru")}
          </button>
          <button
            onClick={() => setFormaZa("SPORNO")}
            disabled={loading}
            type="button"
            className="w-full min-h-10 px-2 rounded-kontrola border border-kolo-danger/30 bg-kolo-danger-light text-kolo-danger text-sm font-semibold hover:bg-kolo-danger-light disabled:opacity-50"
          >
            {t("ishod_sporno")}
          </button>
        </div>
      )}

      {formaZa !== null && (
        <div className="space-y-2 border-t border-kolo-border pt-3">
          <p className="text-xs text-kolo-muted">
            {formaZa === "ZA_PROVERU" ? t("opis_za_proveru") : t("opis_sporno")}
          </p>

          <label className="block text-sm">
            <span className="text-kolo-muted text-xs">{t("polje_subjekt")}</span>
            <select
              value={subjekt}
              onChange={(e) => setSubjekt(e.target.value as Subjekt)}
              className={"mt-1 " + KLASE_UNOSA}
            >
              {SUBJEKTI.map((s) => (
                <option key={s} value={s}>
                  {t(`subjekt_${s.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-kolo-muted text-xs">{t("polje_razlog")}</span>
            <select
              value={razlog}
              onChange={(e) => setRazlog(e.target.value as Razlog)}
              className={"mt-1 " + KLASE_UNOSA}
            >
              {RAZLOZI.map((r) => (
                <option key={r} value={r}>
                  {t(`razlog_${r}`)}
                </option>
              ))}
            </select>
          </label>

          {razlog === "ostalo" && (
            <textarea
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              rows={2}
              placeholder={t("polje_opis")}
              aria-label={t("polje_opis")}
              className={KLASE_UNOSA}
            />
          )}

          <div className="flex gap-2">
            <Dugme onClick={() => posalji(formaZa)} disabled={loading}>
              {loading ? t("saljem") : t("evidentiraj")}
            </Dugme>
            <Dugme varijanta="tiho" onClick={() => setFormaZa(null)}>
              {t("odustani")}
            </Dugme>
          </div>
        </div>
      )}
    </div>
  );
}
