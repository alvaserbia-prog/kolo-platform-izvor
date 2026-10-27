"use client";

import { useState } from "react";
import { intlTag } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import AdminLogotip from "./AdminLogotip";
import { klaseDugmeta } from "@/components/ui/Dugme";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useDijalog } from "@/components/ui/Dijalog";

type Prijava = {
  id: string;
  podnosilacPseudonim: string;
  naziv: string;
  /** FIRMA nosi PIB, MB i sedište; GAZDINSTVO (set 4.7.9) nosi BPG i ime nosioca. */
  vrstaDavaoca: "FIRMA" | "GAZDINSTVO";
  pib: string | null;
  bpg: string | null;
  maticniBroj: string | null;
  adresaSedista: string | null;
  zastupnikImePrezime: string | null;
  zastupnikFunkcija: string | null;
  aprUporedjenAt: string | null;
  upisId: string | null;
  upisOdobren: boolean;
  vrstaDonacije: "NOVAC" | "ROBA" | "USLUGE";
  vrednostRsd: number;
  logoUrl: string | null;
  status: "CEKA_POTPIS" | "POTPISANA" | "POTVRDJENA" | "ODBIJENA";
  odbijenoRazlog: string | null;
  createdAt: string;
};

type Detalji = Prijava & { ugovorTekst: string };

export default function PokroviteljPrijaveTab({ onDone }: { onDone: () => void }) {
  const locale = useLocale();
  const t = useTranslations("admin");

  const STATUS_LABEL: Record<Prijava["status"], string> = {
    CEKA_POTPIS: t("pokr_prijave_status_ceka_potpis"),
    POTPISANA: t("pokr_prijave_status_potpisana"),
    POTVRDJENA: t("pokr_prijave_status_potvrdjena"),
    ODBIJENA: t("pokr_prijave_status_odbijena"),
  };

  const { data: prijave = [], isLoading: ucitavanje, refetch } = useQuery({
    queryKey: ["admin-pokroviteljstvo-prijave"],
    queryFn: async (): Promise<Prijava[]> => {
      const res = await fetch("/api/admin/pokroviteljstvo/prijave");
      if (!res.ok) throw new Error("Greška pri učitavanju prijava");
      return await res.json();
    },
  });
  const [radnja, setRadnja] = useState<string | null>(null);
  const [detalji, setDetalji] = useState<Detalji | null>(null);
  const [aprUporedjeno, setAprUporedjeno] = useState(false);
  const { dijalog, potvrdi: pitaj, unesi, obavesti } = useDijalog();

  async function otvoriDetalje(id: string) {
    const res = await fetch(`/api/admin/pokroviteljstvo/prijave/${id}`);
    if (res.ok) { setAprUporedjeno(false); setDetalji(await res.json()); }
  }

  async function potvrdi(id: string, apr = false) {
    if (!(await pitaj({ poruka: t("pokr_prijave_potvrdi_confirm"), dugme: t("pokr_prijave_potvrdi_btn") }))) return;
    setRadnja(id);
    const res = await fetch(`/api/admin/pokroviteljstvo/prijave/${id}/potvrdi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprUporedjeno: apr }),
    });
    const d = await res.json().catch(() => ({}));
    setRadnja(null);
    await obavesti(res.ok ? t("pokr_prijave_potvrdjeno_msg", { bonus: (d.bonus ?? 0).toLocaleString(intlTag(locale)) }) : (d.error ?? t("greska_generalna")));
    if (res.ok) { setDetalji(null); await refetch(); onDone(); }
  }

  async function odbij(id: string) {
    const razlog = await unesi({ poruka: t("pokr_prijave_odbij_razlog_prompt"), opasno: true, dugme: t("pokr_prijave_odbij_btn") });
    if (razlog === null || !razlog.trim()) return;
    setRadnja(id);
    const res = await fetch(`/api/admin/pokroviteljstvo/prijave/${id}/odbij`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razlog: razlog.trim() }),
    });
    const d = await res.json().catch(() => ({}));
    setRadnja(null);
    if (res.ok) { setDetalji(null); await refetch(); onDone(); }
    else await obavesti(d.error ?? t("greska_generalna"));
  }

  if (ucitavanje) return <p className="text-sm text-kolo-muted">{t("pokr_prijave_ucitavanje")}</p>;
  if (prijave.length === 0)
    return <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica"><PraznoStanje naslov={t("pokr_prijave_nema")} /></div>;

  return (
    <div className="space-y-3">
      {dijalog}
      {prijave.map((p) => (
        <div key={p.id} className="bg-kolo-surface rounded-kartica border border-kolo-border p-4 shadow-kartica">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {p.vrstaDavaoca === "GAZDINSTVO" ? (
                <>
                  <p className="font-semibold text-kolo-text">{p.naziv} <span className="text-kolo-muted font-normal">· {t("pokr_prijave_gazdinstvo")} · BPG {p.bpg}</span></p>
                  {p.zastupnikImePrezime && (
                    <p className="text-xs text-kolo-muted mt-0.5">{t("pokr_prijave_nosilac")}: {p.zastupnikImePrezime}</p>
                  )}
                </>
              ) : (
              <p className="font-semibold text-kolo-text">{p.naziv} <span className="text-kolo-muted font-normal">· PIB {p.pib}{p.maticniBroj && ` · ${t("pokr_prijave_mb")} ${p.maticniBroj}`}</span></p>
              )}
              {p.vrstaDavaoca !== "GAZDINSTVO" && p.zastupnikImePrezime && (
                <p className="text-xs text-kolo-muted mt-0.5">
                  {t("pokr_prijave_sediste")}: {p.adresaSedista} · {t("pokr_prijave_zastupnik")}: {p.zastupnikImePrezime}, {p.zastupnikFunkcija}
                  {p.aprUporedjenAt && ` · ${t("pokr_prijave_apr_uporedjen")}`}
                </p>
              )}
              <p className="text-sm text-kolo-muted mt-0.5">
                {p.vrednostRsd.toLocaleString(intlTag(locale))} RSD · {t.rich("pokr_prijave_podneo", { pseudonim: p.podnosilacPseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })}
              </p>
              <p className="text-xs mt-1">
                <span className={`font-semibold ${p.status === "POTVRDJENA" ? "text-kolo-green-700" : p.status === "ODBIJENA" ? "text-kolo-danger" : "text-kolo-gold-700"}`}>
                  {STATUS_LABEL[p.status]}
                </span>
                {p.status === "ODBIJENA" && p.odbijenoRazlog && <span className="text-kolo-muted"> — {p.odbijenoRazlog}</span>}
              </p>
              {/* Upis (donacije čl. 16 i 18): poređenje sa registrom je izvršeno pri odobrenju upisa. */}
              {p.upisId && p.status === "POTPISANA" && (
                <p className="text-xs text-kolo-muted mt-0.5">{p.upisOdobren ? t("pokr_prijave_upis_odobren") : t("pokr_prijave_upis_nije_odobren")}</p>
              )}
              <AdminLogotip izvor="PRIJAVA" id={p.id} url={p.logoUrl} onUklonjen={() => { void refetch(); onDone(); }} />
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => otvoriDetalje(p.id)}
                className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
                {t("pokr_prijave_detalji_btn")}
              </button>
              {p.status === "POTPISANA" && (
                <>
                  <button onClick={() => (p.zastupnikImePrezime && !p.upisId ? otvoriDetalje(p.id) : potvrdi(p.id))} disabled={radnja === p.id || (!!p.upisId && !p.upisOdobren)}
                    className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
                    {t("pokr_prijave_potvrdi_btn")}
                  </button>
                  <button onClick={() => odbij(p.id)} disabled={radnja === p.id}
                    className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                    {t("pokr_prijave_odbij_btn")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {detalji && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={() => setDetalji(null)}>
          <div className="bg-kolo-surface rounded-kartica shadow-kartica max-w-lg w-full max-h-[85vh] overflow-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-kolo-text">{t("pokr_prijave_ugovor_naslov")}</h3>
            <pre className="text-xs text-kolo-text whitespace-pre-wrap font-sans bg-kolo-bg rounded-kontrola p-4">{detalji.ugovorTekst}</pre>
            {/* Poređenje sa APR-om (Pravilnik čl. 31 st. 4): bez njega se nova prijava
                ne potvrđuje, a ime zastupnika ne ide u evidenciju identiteta. */}
            {detalji.status === "POTPISANA" && !detalji.upisId && (detalji.zastupnikImePrezime ? (
              <div className="space-y-3">
                <label className="flex items-start gap-2 text-sm text-kolo-text">
                  <input type="checkbox" checked={aprUporedjeno} onChange={(e) => setAprUporedjeno(e.target.checked)} className="mt-0.5" />
                  {t("pokr_prijave_apr_cekiraj")}
                </label>
                <button onClick={() => potvrdi(detalji.id, true)} disabled={!aprUporedjeno || radnja === detalji.id}
                  className={klaseDugmeta()}>
                  {t("pokr_prijave_potvrdi_btn")}
                </button>
              </div>
            ) : (
              <p className="text-xs text-kolo-muted">{t("pokr_prijave_zatecena")}</p>
            ))}
            <button onClick={() => setDetalji(null)} className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}>
              {t("pokr_prijave_zatvori")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
