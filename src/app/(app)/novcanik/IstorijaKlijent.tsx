"use client";

import { useState, useMemo, memo } from "react";
import { intlTag } from "@/lib/format";
import { useTranslations, useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import Segmenti from "@/components/ui/Segmenti";
import Kartica from "@/components/ui/Kartica";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { klaseDugmeta } from "@/components/ui/Dugme";

export type Transakcija = {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  primio: boolean;
  /** Druga strana je član, ne Protokol (odlučuje server po novčaniku, ne po tipu). */
  medjuClanovima: boolean;
  drugiPseudonim: string;
  drugiId: string | null;
  createdAt: string;
};


type Filter = "sve" | "primljeno" | "poslato" | "emisije";

export default function IstorijaKlijent({ transakcije, pseudonim }: { transakcije: Transakcija[]; pseudonim: string }) {
  const t = useTranslations("novcanik");
  const [filter, setFilter] = useState<Filter>("sve");

  const filtered = useMemo(() => transakcije.filter((tx) => {
    if (filter === "primljeno") return tx.primio && tx.medjuClanovima;
    if (filter === "poslato") return !tx.primio && tx.medjuClanovima;
    if (filter === "emisije") return !tx.medjuClanovima;
    return true;
  }), [transakcije, filter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-kolo-muted">{t("istorija_transakcija")}</h2>
      </div>

      {/* Filteri */}
      <div className="mb-4 max-w-full overflow-x-auto">
        <Segmenti
          oznaka={t("istorija_transakcija")}
          vrednost={filter}
          onPromena={setFilter}
          opcije={([
            ["sve", t("filter_sve")],
            ["primljeno", t("filter_primljeno")],
            ["poslato", t("filter_poslato")],
            ["emisije", t("filter_emisije")],
          ] as [Filter, string][]).map(([vrednost, oznaka]) => ({ vrednost, oznaka }))}
        />
      </div>

      {filtered.length === 0 ? (
        transakcije.length === 0 ? (
          // Sasvim nov korisnik — bez ijedne transakcije: navedi ga šta dalje
          <Kartica>
            <PraznoStanje
              naslov={t("prazno_naslov")}
              opis={t("prazno_opis")}
              radnja={
                <a href="/verifikacija" className={klaseDugmeta({ varijanta: "sekundarno" })}>
                  {t("prazno_verif_link")}
                </a>
              }
            />
          </Kartica>
        ) : (
          <Kartica>
            <PraznoStanje naslov={t("nema_tx_kategorija")} />
          </Kartica>
        )
      ) : (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
          {/* Zaglavlje tabele — desktop */}
          <div className="hidden sm:grid grid-cols-[7rem_4.5rem_1fr_1.5rem_1fr_minmax(0,1.5fr)_7rem] gap-x-3 px-4 py-2 border-b border-kolo-border bg-kolo-bg">
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("col_datum")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("col_vreme")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("col_posiljac")}</span>
            <span />
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("col_primalac")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("col_opis")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide text-right">{t("col_iznos")}</span>
          </div>
          {filtered.map((tx, i) => (
            <TxRed
              key={tx.id}
              t={tx}
              pseudonim={pseudonim}
              jePoslednji={i === filtered.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Red istorije transakcija (memo) ───────────────────────────────────────────
// Izdvojen u zasebnu memo-komponentu da promena filtera NE re-renderuje svaki red
// bez potrebe. `t` je transakcija (kao u originalu); prevodi se ovde ne koriste.

const TxRed = memo(function TxRed({ t, pseudonim, jePoslednji }: { t: Transakcija; pseudonim: string; jePoslednji: boolean }) {
  const locale = useLocale();
  // `t` je transakcija (kao u originalu), pa prevodi idu pod `tr`.
  const tr = useTranslations("novcanik");




  return (
    <div
      className={`px-4 py-2.5 ${!jePoslednji ? "border-b border-kolo-border" : ""}`}
    >
      {/* Desktop prikaz */}
      <div className="hidden sm:grid grid-cols-[7rem_4.5rem_1fr_1.5rem_1fr_minmax(0,1.5fr)_7rem] gap-x-3 items-center">
        {/* Datum — timeZone zaključan da SSR (UTC) i klijent (lokalno) daju isti
            string; inače React hydration mismatch (#418) → suvišno preiscrtavanje. */}
        <p className="text-sm text-kolo-muted leading-tight">
          {new Date(t.createdAt).toLocaleDateString(intlTag(locale), {
            day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Belgrade",
          })}
        </p>
        {/* Vreme */}
        <p className="text-sm text-kolo-muted leading-tight">
          {new Date(t.createdAt).toLocaleTimeString(intlTag(locale), {
            hour: "2-digit", minute: "2-digit", timeZone: "Europe/Belgrade",
          })}
        </p>
        {/* Pošiljalac */}
        <div className="min-w-0">
          {t.primio ? (
            t.drugiId ? (
              <a href={profilHref({ id: t.drugiId, pseudonim: t.drugiPseudonim })} className="text-base text-kolo-green-700 hover:underline truncate block">
                <Pseudonim>{t.drugiPseudonim}</Pseudonim>
              </a>
            ) : (
              <span className="text-base text-kolo-muted truncate block"><Pseudonim>{t.drugiPseudonim}</Pseudonim></span>
            )
          ) : (
            <span className="text-base text-kolo-text font-medium truncate block"><Pseudonim>{pseudonim}</Pseudonim></span>
          )}
        </div>
        {/* Strelica */}
        <span className="text-base font-bold text-kolo-muted text-center leading-none">→</span>
        {/* Primalac */}
        <div className="min-w-0">
          {t.primio ? (
            <span className="text-base text-kolo-text font-medium truncate block"><Pseudonim>{pseudonim}</Pseudonim></span>
          ) : (
            t.drugiId ? (
              <a href={profilHref({ id: t.drugiId, pseudonim: t.drugiPseudonim })} className="text-base text-kolo-green-700 hover:underline truncate block">
                <Pseudonim>{t.drugiPseudonim}</Pseudonim>
              </a>
            ) : (
              <span className="text-base text-kolo-muted truncate block"><Pseudonim>{t.drugiPseudonim}</Pseudonim></span>
            )
          )}
        </div>
        {/* Opis */}
        <p className="text-xs text-kolo-muted truncate" title={t.description ?? undefined}>{t.description}</p>
        {/* Iznos — svaki ulaz zeleno (i od Protokola), dato/upisano crveno */}
        <span className={`text-base font-bold text-right ${t.primio ? "text-kolo-green-700" : "text-kolo-danger"}`}>
          {t.primio ? "+" : "−"}{t.amount.toLocaleString(intlTag(locale))}
        </span>
      </div>

      {/* Mobilna kompaktna kartica */}
      <div className="sm:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              {t.primio ? (
                t.drugiId ? (
                  <a href={profilHref({ id: t.drugiId, pseudonim: t.drugiPseudonim })} className="text-kolo-green-700 hover:underline truncate">
                    <Pseudonim>{t.drugiPseudonim}</Pseudonim>
                  </a>
                ) : (
                  <span className="text-kolo-muted truncate"><Pseudonim>{t.drugiPseudonim}</Pseudonim></span>
                )
              ) : (
                <span className="text-kolo-text font-medium truncate"><Pseudonim>{pseudonim}</Pseudonim></span>
              )}
              <span className="text-kolo-muted shrink-0">→</span>
              {t.primio ? (
                <span className="text-kolo-text font-medium truncate"><Pseudonim>{pseudonim}</Pseudonim></span>
              ) : (
                t.drugiId ? (
                  <a href={profilHref({ id: t.drugiId, pseudonim: t.drugiPseudonim })} className="text-kolo-green-700 hover:underline truncate">
                    <Pseudonim>{t.drugiPseudonim}</Pseudonim>
                  </a>
                ) : (
                  <span className="text-kolo-muted truncate"><Pseudonim>{t.drugiPseudonim}</Pseudonim></span>
                )
              )}
            </div>
            <p className="text-xs text-kolo-muted mt-0.5">
              {new Date(t.createdAt).toLocaleString(intlTag(locale), {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit", timeZone: "Europe/Belgrade",
              })}
            </p>
          </div>
          <span className={`text-sm font-bold text-right shrink-0 ${t.primio ? "text-kolo-green-700" : "text-kolo-danger"}`}>
            {t.primio ? "+" : "−"}{t.amount.toLocaleString(intlTag(locale))}
          </span>
        </div>
        {t.description && (
          <p className="mt-1 text-xs text-kolo-muted truncate">{t.description}</p>
        )}
      </div>

    </div>
  );
});
