"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Obavestenje from "@/components/ui/Obavestenje";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { PARAMETRI_UO } from "@/lib/operativni-pravila";

type Istorija = { id: string; vrednost: number; vaziOd: string; odluka: string };
type Parametar = { vazece: number | null; istorija: Istorija[] };
type Ovlascenje = { userId: string; pseudonim: string | null; odluka: string; izuzetakPredlagaca: boolean; od: string };

/**
 * Odluke UO za operativni doprinos koje upisuje superadmin (UO odlučuje van
 * platforme, operativa upisuje):
 *  - iznos jedinice zadružnog doprinosa (operativni 5.0 čl. 23 st. 4) i prag za
 *    režim odobravanja (čl. 12 st. 1 t. 3) — 🔴 bez podrazumevane vrednosti;
 *  - lica koja UO ovlasti da potvrđuju izvršenje (čl. 13 st. 1, 4).
 */
export default function OperativniUoTab() {
  const t = useTranslations("admin");
  const [parametri, setParametri] = useState<Record<string, Parametar>>({});
  const [ovlascenja, setOvlascenja] = useState<Ovlascenje[] | null>(null);
  const [unos, setUnos] = useState<Record<string, { vrednost: string; odluka: string }>>({});
  const [novo, setNovo] = useState({ pseudonim: "", odluka: "", izuzetakPredlagaca: false });
  const [greska, setGreska] = useState<string | null>(null);
  const [radi, setRadi] = useState(false);

  const ucitaj = useCallback(async () => {
    const r = await fetch("/api/admin/doprinos-oglasi/parametri", { cache: "no-store" });
    if (r.ok) setParametri((await r.json()).parametri ?? {});
    const o = await fetch("/api/admin/doprinos-oglasi/ovlascenja", { cache: "no-store" });
    setOvlascenja(o.ok ? (await o.json()).ovlascenja ?? [] : null);
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function posalji(putanja: string, metod: string, telo?: unknown) {
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(putanja, { method: metod, headers: { "Content-Type": "application/json" }, body: telo ? JSON.stringify(telo) : undefined });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setGreska(d.error ?? d.greska ?? t("greska_generalna")); return false; }
      await ucitaj();
      return true;
    } finally {
      setRadi(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-kolo-muted">{t("opuo_uvod")}</p>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}

      {PARAMETRI_UO.map((k) => {
        const p = parametri[k];
        const u = unos[k] ?? { vrednost: "", odluka: "" };
        return (
          <section key={k} className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica space-y-2">
            <h3 className="font-semibold">{t(`opuo_${k}`)}</h3>
            <p className="text-xs text-kolo-muted">{t(`opuo_${k}_opis`)}</p>
            <p className="text-sm">{p?.vazece == null ? t("opuo_nije_utvrdjen") : t("opuo_vazece", { vrednost: p.vazece.toLocaleString("sr-RS") })}</p>
            {p && p.istorija.length > 0 && (
              <ul className="text-xs text-kolo-muted space-y-0.5">
                {p.istorija.map((r) => <li key={r.id}>{t("opuo_istorija_red", { vrednost: r.vrednost.toLocaleString("sr-RS"), od: r.vaziOd, odluka: r.odluka })}</li>)}
              </ul>
            )}
            <div className="grid gap-2 md:grid-cols-2">
              <input className={KLASE_UNOSA} inputMode="numeric" placeholder={t("opuo_vrednost")} aria-label={t("opuo_vrednost")} value={u.vrednost}
                onChange={(e) => setUnos({ ...unos, [k]: { ...u, vrednost: e.target.value } })} />
              <input className={KLASE_UNOSA} placeholder={t("opuo_odluka")} aria-label={t("opuo_odluka")} value={u.odluka}
                onChange={(e) => setUnos({ ...unos, [k]: { ...u, odluka: e.target.value } })} />
            </div>
            <button disabled={radi} className={klaseDugmeta({ velicina: "sm" })}
              onClick={async () => {
                if (await posalji("/api/admin/doprinos-oglasi/parametri", "POST", { kljuc: k, vrednost: u.vrednost, odluka: u.odluka }))
                  setUnos({ ...unos, [k]: { vrednost: "", odluka: "" } });
              }}>
              {t("opuo_upisi")}
            </button>
          </section>
        );
      })}

      <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica space-y-2">
        <h3 className="font-semibold">{t("opuo_ovlascenja")}</h3>
        <p className="text-xs text-kolo-muted">{t("opuo_ovlascenja_opis")}</p>
        {ovlascenja == null ? (
          <p className="text-xs text-kolo-muted">{t("opuo_samo_superadmin")}</p>
        ) : (
          <>
            {ovlascenja.length === 0 ? <p className="text-sm text-kolo-muted">{t("opuo_nema_ovlascenja")}</p> : (
              <ul className="space-y-1 text-sm">
                {ovlascenja.map((o) => (
                  <li key={o.userId} className="flex items-center justify-between gap-3 rounded-kontrola bg-kolo-bg px-3 py-1.5">
                    <span>{o.pseudonim ?? "—"} <span className="text-xs text-kolo-muted">· {o.odluka}{o.izuzetakPredlagaca ? ` · ${t("opuo_izuzetak")}` : ""}</span></span>
                    <button disabled={radi} className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}
                      onClick={() => void posalji(`/api/admin/doprinos-oglasi/ovlascenja?userId=${encodeURIComponent(o.userId)}`, "DELETE")}>
                      {t("opuo_opozovi")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-2 md:grid-cols-2">
              <input className={KLASE_UNOSA} placeholder={t("zad_pseudonim")} aria-label={t("zad_pseudonim")} value={novo.pseudonim} onChange={(e) => setNovo({ ...novo, pseudonim: e.target.value })} />
              <input className={KLASE_UNOSA} placeholder={t("opuo_odluka")} aria-label={t("opuo_odluka")} value={novo.odluka} onChange={(e) => setNovo({ ...novo, odluka: e.target.value })} />
            </div>
            <label className="flex items-start gap-2 text-xs text-kolo-muted">
              <input type="checkbox" checked={novo.izuzetakPredlagaca} onChange={(e) => setNovo({ ...novo, izuzetakPredlagaca: e.target.checked })} />
              <span>{t("opuo_izuzetak_opis")}</span>
            </label>
            <button disabled={radi} className={klaseDugmeta({ velicina: "sm" })}
              onClick={async () => {
                if (await posalji("/api/admin/doprinos-oglasi/ovlascenja", "POST", novo)) setNovo({ pseudonim: "", odluka: "", izuzetakPredlagaca: false });
              }}>
              {t("opuo_ovlasti")}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
