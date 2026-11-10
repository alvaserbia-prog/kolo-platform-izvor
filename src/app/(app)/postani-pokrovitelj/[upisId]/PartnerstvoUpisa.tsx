"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";

/**
 * Partnerstva pokrovitelja (tab „Partnerstvo", donacije Glava VI): prijave, snimljen ugovor,
 * izvršenja i prijava izvršenog dela (čl. 43).
 *
 * 🔴 Uz vrednost (dinari) se ne prikazuje broj POEN-a — zabeležen i evidentiran doprinos je
 * na ekranu POEN, kod podnosioca prijave.
 */
type Izvrsenje = {
  id: string;
  obim: number;
  opis: string;
  status: "PRIJAVLJENO" | "ZABELEZENO" | "EVIDENTIRANO" | "ODBIJENO" | "PONISTENO";
  odbijenoRazlog: string | null;
  createdAt: string;
};
type Partnerstvo = {
  id: string;
  opis: string;
  jedinicaMere: string;
  cenaPoJedinici: number;
  obim: number;
  vrednostRsd: number;
  rokIzvrsenja: string;
  obradaPodataka: boolean;
  dpaZabelezen: boolean;
  status: "NA_PREGLEDU" | "PRIHVACENO" | "ODBIJENO" | "PRESTALO";
  odbijenoRazlog: string | null;
  ugovorTekst: string | null;
  kontrolniBroj: string | null;
  zakljucenoAt: string | null;
  prestanakRazlog: string | null;
  mojaPrijava: boolean;
  izvrsenja: Izvrsenje[];
};

export default function PartnerstvoUpisa({ upisId }: { upisId: string }) {
  const t = useTranslations("postaniPokrovitelj");
  const locale = useLocale();
  const { dijalog, potvrdi } = useDijalog();
  const [lista, setLista] = useState<Partnerstvo[] | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const [unos, setUnos] = useState<Record<string, { obim: string; opis: string }>>({});
  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const datum = (s: string) => new Date(s).toLocaleDateString(intlTag(locale));

  const ucitaj = useCallback(async () => {
    const r = await fetch(`/api/pokroviteljstvo/partnerstvo?upisId=${encodeURIComponent(upisId)}`);
    const d = await r.json().catch(() => ({}));
    if (r.ok) setLista(d.partnerstva ?? []);
    else setGreska(d.error ?? t("forma_greska_slanja"));
  }, [upisId, t]);
  useEffect(() => { void ucitaj(); }, [ucitaj]);

  const STATUS: Record<Partnerstvo["status"], string> = {
    NA_PREGLEDU: t("partnerstvo_status_na_pregledu"),
    PRIHVACENO: t("partnerstvo_status_prihvaceno"),
    ODBIJENO: t("partnerstvo_status_odbijeno"),
    PRESTALO: t("partnerstvo_status_prestalo"),
  };
  const STATUS_IZVRSENJA: Record<Izvrsenje["status"], string> = {
    PRIJAVLJENO: t("partnerstvo_izvrsenje_prijavljeno"),
    ZABELEZENO: t("partnerstvo_izvrsenje_zabelezeno"),
    EVIDENTIRANO: t("partnerstvo_izvrsenje_evidentirano"),
    ODBIJENO: t("partnerstvo_izvrsenje_odbijeno"),
    PONISTENO: t("partnerstvo_izvrsenje_ponisteno"),
  };

  async function prijavi(p: Partnerstvo) {
    setGreska(null);
    const u = unos[p.id] ?? { obim: "", opis: "" };
    const r = await fetch(`/api/pokroviteljstvo/partnerstvo/${p.id}/izvrsenje`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obim: u.obim, opis: u.opis }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setGreska(d.error ?? t("forma_greska_slanja")); return; }
    setUnos((s) => ({ ...s, [p.id]: { obim: "", opis: "" } }));
    await ucitaj();
  }

  async function povuci(p: Partnerstvo) {
    if (!(await potvrdi({ poruka: t("partnerstvo_povuci_potvrda"), opasno: true, dugme: t("partnerstvo_povuci") }))) return;
    const r = await fetch(`/api/pokroviteljstvo/partnerstvo/${p.id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setGreska(d.error ?? t("forma_greska_slanja"));
    await ucitaj();
  }

  if (lista === null) return greska ? <Obavestenje vrsta="greska">{greska}</Obavestenje> : null;
  return (
    <div className="space-y-3">
      {dijalog}
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      {lista.length === 0 ? (
        <Kartica padding="nema"><PraznoStanje naslov={t("partnerstvo_prazno")} opis={t("partnerstvo_prazno_opis")} /></Kartica>
      ) : (
        lista.map((p) => {
          const zauzeto = p.izvrsenja
            .filter((i) => i.status === "PRIJAVLJENO" || i.status === "ZABELEZENO" || i.status === "EVIDENTIRANO")
            .reduce((z, i) => z + i.obim, 0);
          const u = unos[p.id] ?? { obim: "", opis: "" };
          return (
            <Kartica key={p.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-kolo-text">{p.opis}</p>
                  <p className="text-xs text-kolo-muted">
                    {t("partnerstvo_obim_prikaz", { obim: broj(p.obim), jedinica: p.jedinicaMere, rok: datum(p.rokIzvrsenja) })}
                    {" · "}
                    {t("partnerstvo_vrednost", { vrednost: broj(p.vrednostRsd) })}
                  </p>
                </div>
                <span className="text-xs font-semibold text-kolo-green-700">{STATUS[p.status]}</span>
              </div>
              {p.status === "ODBIJENO" && p.odbijenoRazlog && <p className="text-xs text-kolo-danger">{t("odbijena_razlog")} {p.odbijenoRazlog}</p>}
              {p.status === "PRESTALO" && p.prestanakRazlog && <p className="text-xs text-kolo-muted">{t("partnerstvo_prestanak_razlog")} {p.prestanakRazlog}</p>}
              {p.obradaPodataka && !p.dpaZabelezen && p.status !== "ODBIJENO" && (
                <Obavestenje vrsta="info">{t("partnerstvo_ceka_dpa")}</Obavestenje>
              )}
              {p.status === "NA_PREGLEDU" && p.mojaPrijava && (
                <Dugme varijanta="tiho" velicina="sm" onClick={() => povuci(p)}>{t("partnerstvo_povuci")}</Dugme>
              )}
              {p.ugovorTekst && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-kolo-green-700">{t("partnerstvo_ugovor")}</summary>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-kolo-text">{p.ugovorTekst}</pre>
                  {p.kontrolniBroj && <p className="mt-1 text-xs text-kolo-muted break-all">{t("partnerstvo_kontrolni_broj")} {p.kontrolniBroj}</p>}
                </details>
              )}
              {p.izvrsenja.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {p.izvrsenja.map((i) => (
                    <li key={i.id} className="flex flex-wrap justify-between gap-2 border-t border-kolo-border pt-1">
                      <span className="text-kolo-text">{broj(i.obim)} {p.jedinicaMere} — {i.opis}</span>
                      <span className="text-xs text-kolo-muted">
                        {STATUS_IZVRSENJA[i.status]}
                        {i.odbijenoRazlog ? ` (${i.odbijenoRazlog})` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {p.status === "PRIHVACENO" && (
                <div className="space-y-2 border-t border-kolo-border pt-3">
                  <p className="text-xs text-kolo-muted">
                    {t("partnerstvo_preostalo", { preostalo: broj(Math.max(0, p.obim - zauzeto)), jedinica: p.jedinicaMere })}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-[10rem_1fr] gap-3">
                    <Polje oznaka={t("partnerstvo_izvrsen_obim_label")}>
                      <input type="number" min={0} step="0.01" value={u.obim}
                        onChange={(e) => setUnos((s) => ({ ...s, [p.id]: { ...u, obim: e.target.value } }))} className={KLASE_UNOSA} />
                    </Polje>
                    <Polje oznaka={t("partnerstvo_izvrsen_opis_label")}>
                      <input value={u.opis}
                        onChange={(e) => setUnos((s) => ({ ...s, [p.id]: { ...u, opis: e.target.value } }))} className={KLASE_UNOSA} />
                    </Polje>
                  </div>
                  <Dugme velicina="sm" onClick={() => prijavi(p)}>{t("partnerstvo_prijavi_izvrsenje")}</Dugme>
                </div>
              )}
            </Kartica>
          );
        })
      )}
    </div>
  );
}
