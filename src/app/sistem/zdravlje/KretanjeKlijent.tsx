"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { intlTag } from "@/lib/format";
import Kartica from "@/components/ui/Kartica";
import Segmenti from "@/components/ui/Segmenti";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { POKAZATELJI, izracunaj, poMesecima, type DanNiza, type SifraPokazatelja } from "@/lib/pokazatelji-pravila";

/**
 * Kretanje pokazatelja sistema: četiri grafikona (vrednost kroz vreme i linija
 * cilja), prekidač dani/meseci, tabela zbirnih brojeva i preuzimanje podataka.
 * Naknadno izračunati dani crtaju se svetlijom linijom i u tabeli nose zvezdicu.
 */
type Razmak = "dani" | "meseci";
const S = 600;
const V = 160;
const GORE = 10;
const DOLE = 150;

const datum = (dan: string) => {
  const [g, m, d] = dan.split("-");
  return `${d}.${m}.${g}.`;
};

function Grafikon({ niz, sifra, cilj }: { niz: DanNiza[]; sifra: SifraPokazatelja; cilj: number }) {
  const t = useTranslations("pokazatelji_sistema");
  const tacke = useMemo(
    () => niz.map((d) => ({ naknadno: d.naknadno, v: izracunaj(d.sirovo).find((p) => p.sifra === sifra)?.vrednost ?? null })),
    [niz, sifra],
  );
  const najvise = Math.max(cilj, ...tacke.map((p) => p.v ?? 0)) * 1.05;
  const x = (i: number) => (tacke.length <= 1 ? S / 2 : (i / (tacke.length - 1)) * S);
  const y = (v: number) => DOLE - (v / najvise) * (DOLE - GORE);

  // Uzastopne tačke iste vrste čine jedan potez; potez počinje od prethodne tačke, da linija nema prekid.
  const potezi: { naknadno: boolean; pts: string[] }[] = [];
  let prethodna: string | null = null;
  for (let i = 0; i < tacke.length; i++) {
    const p = tacke[i];
    if (p.v === null) {
      prethodna = null;
      continue;
    }
    const pt = `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`;
    const tekuci = potezi[potezi.length - 1];
    if (prethodna === null) potezi.push({ naknadno: p.naknadno, pts: [pt] });
    else if (tekuci.naknadno !== p.naknadno) potezi.push({ naknadno: p.naknadno, pts: [prethodna, pt] });
    else tekuci.pts.push(pt);
    prethodna = pt;
  }

  const poslednja = [...tacke].reverse().find((p) => p.v !== null)?.v ?? null;

  return (
    <Kartica as="article" className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-kolo-text">{t(`naziv_${sifra}`)}</h3>
        <p className="shrink-0 text-xs text-kolo-muted">{t("cilj", { cilj: `${cilj}%` })}</p>
      </div>
      <svg viewBox={`0 0 ${S} ${V}`} preserveAspectRatio="none" className="h-36 w-full" role="img"
        aria-label={t("grafikon_opis", { naziv: t(`naziv_${sifra}`), vrednost: poslednja === null ? "—" : `${Math.round(poslednja)}%`, cilj: `${cilj}%` })}>
        <g className="text-kolo-border">
          <line x1="0" x2={S} y1={DOLE} y2={DOLE} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </g>
        <g className="text-kolo-muted">
          <line x1="0" x2={S} y1={y(cilj)} y2={y(cilj)} stroke="currentColor" strokeWidth="1" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        </g>
        <g className="text-kolo-green-700" fill="none" strokeLinejoin="round" strokeLinecap="round">
          {potezi.map((p, i) => (
            <polyline key={i} points={p.pts.join(" ")} stroke="currentColor" strokeWidth="2" opacity={p.naknadno ? 0.4 : 1} vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>
      <div className="flex justify-between text-xs text-kolo-muted">
        <span>{niz.length > 0 ? datum(niz[0].dan) : ""}</span>
        <span>{niz.length > 0 ? datum(niz[niz.length - 1].dan) : ""}</span>
      </div>
    </Kartica>
  );
}

export default function KretanjeKlijent({ niz }: { niz: DanNiza[] }) {
  const t = useTranslations("pokazatelji_sistema");
  const tag = intlTag(useLocale());
  const [razmak, postaviRazmak] = useState<Razmak>("dani");
  const prikaz = useMemo(() => (razmak === "meseci" ? poMesecima(niz) : niz), [niz, razmak]);
  const broj = (n: number) => n.toLocaleString(tag);
  const procenat = (n: number | null) => (n === null ? "—" : `${n.toLocaleString(tag, { maximumFractionDigits: 1 })}%`);
  const imaNaknadnih = niz.some((d) => d.naknadno);
  // Tabela: najnoviji dan prvi.
  const redovi = useMemo(() => [...prikaz].reverse(), [prikaz]);

  if (niz.length === 0) return <p className="text-sm text-kolo-muted">{t("niz_prazan")}</p>;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmenti<Razmak>
          oznaka={t("razmak_oznaka")}
          vrednost={razmak}
          onPromena={postaviRazmak}
          opcije={[
            { vrednost: "dani", oznaka: t("razmak_dani") },
            { vrednost: "meseci", oznaka: t("razmak_meseci") },
          ]}
        />
        <p className="text-xs text-kolo-muted">{t("legenda")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {POKAZATELJI.map((p) => (
          <Grafikon key={p.sifra} niz={prikaz} sifra={p.sifra} cilj={p.cilj} />
        ))}
      </div>

      <Kartica padding="nema" className="overflow-hidden">
        <div className="max-h-[28rem] overflow-auto">
          <table className="w-full min-w-[52rem] text-right text-xs">
            <thead className="sticky top-0 bg-kolo-bg text-kolo-muted">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold">{t("kol_dan")}</th>
                {POKAZATELJI.map((p) => (
                  <th key={p.sifra} scope="col" className="px-3 py-2 font-semibold">{t(`kratko_${p.sifra}`)}</th>
                ))}
                <th scope="col" className="px-3 py-2 font-semibold">{t("kol_korisnici")}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t("kol_ucesnici")}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t("kol_sa_ponudom")}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t("kol_ponude")}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t("kol_razmene")}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t("kol_razmenjeno")}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t("kol_ukupno_poena")}</th>
              </tr>
            </thead>
            <tbody>
              {redovi.map((d) => {
                const p = izracunaj(d.sirovo);
                return (
                  <tr key={d.dan} className="border-t border-kolo-border text-kolo-text">
                    <th scope="row" className="whitespace-nowrap px-3 py-1.5 text-left font-medium">
                      {datum(d.dan)}{d.naknadno ? " *" : ""}
                    </th>
                    {p.map((x) => (
                      <td key={x.sifra} className="px-3 py-1.5">{procenat(x.vrednost)}</td>
                    ))}
                    <td className="px-3 py-1.5">{broj(d.sirovo.korisnici)}</td>
                    <td className="px-3 py-1.5">{broj(d.sirovo.ucesnici)}</td>
                    <td className="px-3 py-1.5">{broj(d.sirovo.korisniciSaPonudom)}</td>
                    <td className="px-3 py-1.5">{broj(d.sirovo.ponude)}</td>
                    <td className="px-3 py-1.5">{broj(d.sirovo.razmene)}</td>
                    <td className="px-3 py-1.5">{broj(d.sirovo.razmenjeniPoen)}</td>
                    <td className="px-3 py-1.5">{broj(d.sirovo.opticaj)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Kartica>

      {imaNaknadnih && <p className="text-xs leading-relaxed text-kolo-muted">{t("naknadno_objasnjenje")}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <a href="/api/javno/pokazatelji?format=csv" className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
          {t("preuzmi_csv")}
        </a>
        <a href="/api/javno/pokazatelji" className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
          {t("preuzmi_json")}
        </a>
        <p className="text-xs text-kolo-muted">{t("preuzmi_opis")}</p>
      </div>
    </>
  );
}
