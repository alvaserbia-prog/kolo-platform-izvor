"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import { klaseKartice } from "@/components/ui/Kartica";
import { klaseDugmeta } from "@/components/ui/Dugme";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useDijalog } from "@/components/ui/Dijalog";
import { PIJACE_STIPS, KATEGORIJE_PREDLOG, cenaIzPijaca, type VrstaBiltena } from "@/lib/stips-bilten-pravila";

type Bilten = { id: string; vrsta: VrstaBiltena; broj: string; datumObjave: string; url: string; pdfUrl: string | null; brojCena: number };
type Red = { kategorija: string; jedinica: string; cene: Record<string, string> };

const POLJE = "w-full rounded-kontrola border border-kolo-border px-2 py-1 text-sm text-kolo-text";

/**
 * Admin → Pokrovitelji → STIPS (set 5.1.3; donacije čl. 29 st. 1). Bilteni koje je pronašao
 * cron, sa vezom na PDF; za izabrani bilten unos dominantnih cena po kategoriji i pijaci
 * (prazno = pijaca nije objavila cenu) i prikaz cene za Republiku Srbiju — aritmetičkog proseka
 * zaokruženog kao u biltenu. Prosek se ne čuva; računa se iz unetih cena.
 */
export default function StipsTab() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { dijalog, obavesti } = useDijalog();
  const { data, refetch } = useQuery({
    queryKey: ["admin-stips"],
    queryFn: async (): Promise<{ bilteni: Bilten[]; kategorije: string[] }> => {
      const r = await fetch("/api/admin/stips");
      if (!r.ok) throw new Error("Greška pri učitavanju");
      return r.json();
    },
  });
  const bilteni = data?.bilteni ?? [];
  const [otvoren, setOtvoren] = useState<Bilten | null>(null);
  const [redovi, setRedovi] = useState<Red[]>([]);
  const [datum, setDatum] = useState("");
  const [radi, setRadi] = useState(false);
  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const dan = (d: string) => new Date(d).toLocaleDateString(intlTag(locale));

  async function otvori(b: Bilten) {
    const r = await fetch(`/api/admin/stips/${b.id}`);
    const d = await r.json().catch(() => null);
    if (!r.ok || !d) {
      await obavesti(d?.error ?? t("greska_generalna"));
      return;
    }
    const po = new Map<string, Red>();
    for (const c of d.cene as { kategorija: string; jedinica: string; pijaca: string; cena: number }[]) {
      const red = po.get(c.kategorija) ?? { kategorija: c.kategorija, jedinica: c.jedinica, cene: {} };
      red.cene[c.pijaca] = String(c.cena);
      po.set(c.kategorija, red);
    }
    for (const k of KATEGORIJE_PREDLOG[b.vrsta] ?? []) if (!po.has(k)) po.set(k, { kategorija: k, jedinica: "din/kg", cene: {} });
    setRedovi([...po.values()]);
    setDatum(d.datumObjave.slice(0, 10));
    setOtvoren(b);
  }

  async function pronadji() {
    setRadi(true);
    const r = await fetch("/api/admin/stips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ akcija: "pronadji" }) });
    const d = await r.json().catch(() => ({}));
    setRadi(false);
    await obavesti(r.ok ? t("stips_pronadjeno", { broj: d.pronadjeno ?? 0 }) : d.error ?? t("greska_generalna"));
    await refetch();
  }

  async function sacuvaj() {
    if (!otvoren) return;
    setRadi(true);
    const r = await fetch(`/api/admin/stips/${otvoren.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datumObjave: datum, kategorije: redovi.filter((x) => x.kategorija.trim()) }),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(false);
    await obavesti(r.ok ? t("stips_sacuvano") : d.error ?? t("greska_generalna"));
    if (r.ok) await refetch();
  }

  const promeni = (i: number, izmena: Partial<Red>) => setRedovi((rs) => rs.map((x, j) => (j === i ? { ...x, ...izmena } : x)));
  const promeniCenu = (i: number, pijaca: string, v: string) =>
    setRedovi((rs) => rs.map((x, j) => (j === i ? { ...x, cene: { ...x.cene, [pijaca]: v } } : x)));

  return (
    <div className="space-y-4">
      {dijalog}
      <section className={klaseKartice({ padding: "md" }) + " space-y-3"}>
        <NaslovSekcije opis={t("stips_opis")}>{t("stips_naslov")}</NaslovSekcije>
        <button onClick={pronadji} disabled={radi} className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
          {t("stips_pronadji")}
        </button>
        {bilteni.length === 0 ? (
          <PraznoStanje naslov={t("stips_prazno")} />
        ) : (
          <ul className="divide-y divide-kolo-border text-sm">
            {bilteni.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  <span className="font-semibold text-kolo-text">{t(`stips_vrsta_${b.vrsta}`)} {b.broj}</span>
                  <span className="text-kolo-muted"> · {dan(b.datumObjave)} · {t("stips_broj_cena", { broj: b.brojCena })}</span>
                </span>
                <span className="flex flex-wrap gap-2">
                  <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-kolo-green-700 underline">{t("stips_stranica")}</a>
                  {b.pdfUrl && <a href={b.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-kolo-green-700 underline">PDF</a>}
                  <button onClick={() => otvori(b)} className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>{t("stips_unos")}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {otvoren && (
        <section className={klaseKartice({ padding: "md" }) + " space-y-3"}>
          <NaslovSekcije opis={t("stips_unos_opis")}>
            {t(`stips_vrsta_${otvoren.vrsta}`)} {otvoren.broj}
          </NaslovSekcije>
          <label className="text-xs text-kolo-muted space-y-1 block max-w-xs">
            <span className="block">{t("stips_datum")}</span>
            <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className={POLJE} />
          </label>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr className="text-left text-kolo-muted">
                  <th className="p-1">{t("stips_kategorija")}</th>
                  <th className="p-1">{t("stips_jedinica")}</th>
                  {PIJACE_STIPS.map((p) => <th key={p} className="p-1 whitespace-nowrap">{p}</th>)}
                  <th className="p-1">{t("stips_prosek")}</th>
                </tr>
              </thead>
              <tbody>
                {redovi.map((r, i) => {
                  const izracun = cenaIzPijaca(PIJACE_STIPS.map((p) => ({ pijaca: p, cena: Number((r.cene[p] ?? "").replace(",", ".")) || 0 })));
                  return (
                    <tr key={i} className="border-t border-kolo-border">
                      <td className="p-1 min-w-40"><input value={r.kategorija} onChange={(e) => promeni(i, { kategorija: e.target.value })} className={POLJE} /></td>
                      <td className="p-1 min-w-20"><input value={r.jedinica} onChange={(e) => promeni(i, { jedinica: e.target.value })} className={POLJE} /></td>
                      {PIJACE_STIPS.map((p) => (
                        <td key={p} className="p-1 min-w-16">
                          <input inputMode="decimal" value={r.cene[p] ?? ""} onChange={(e) => promeniCenu(i, p, e.target.value)} className={POLJE} />
                        </td>
                      ))}
                      <td className="p-1 font-semibold text-kolo-text whitespace-nowrap">
                        {izracun ? `${broj(izracun.cena)} (${izracun.pijace.length})` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-kolo-muted">{t("stips_zaokruzivanje")}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setRedovi((rs) => [...rs, { kategorija: "", jedinica: "din/kg", cene: {} }])}
              className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
              {t("stips_dodaj_kategoriju")}
            </button>
            <button onClick={sacuvaj} disabled={radi} className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
              {t("stips_sacuvaj")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
