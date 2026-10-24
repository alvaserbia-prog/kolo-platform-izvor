"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { profilHref } from "@/lib/profil-link";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";
import Obavestenje from "@/components/ui/Obavestenje";
import { useDijalog } from "@/components/ui/Dijalog";

type Nalog = { id: string; pseudonim: string; mesto: string | null; naSpisku: boolean };
type Grupa = { osnov: "TELEFON" | "IME"; nalozi: Nalog[] };
type Predmet = {
  id: string;
  utvrdjenoAt: string;
  zadrzani: string;
  ugaseni: string;
  obrazlozenje: string;
  otpisano: number;
  iskljucen: boolean;
  predmetOtvoren: boolean;
  predmetBeleska: string | null;
  primaoci: { pseudonim: string; poen: number }[];
};

/**
 * Admin → Potvrde → „Mogući višestruki nalozi" (dokaz stvarnosti čl. 4a i 4b; set
 * 4.8.4; registar 2026-10, N4-M2 i N4-M3). Samo superadmin — ruta odbija ostale, pa
 * se tada ne prikazuje ništa.
 *
 * 🔴 Grupa nije odluka: isti broj dele ukućani, isto ime imenjaci. Odluka je
 * „Utvrdi" — uz obrazloženje bira se nalog koji lice zadržava; drugi prestaje, neto
 * prepis sa njega se otpisuje (osmi osnov, zapis sme u minus) i otvara se nadzorni
 * predmet nad primaocima njegovih prepisa, bez dejstva na njih dok se ništa ne utvrdi.
 * 🔴 Ime i broj se ovde ne prikazuju — samo pseudonimi, mesta i osnov poklapanja.
 */
export default function VisestrukiNalozi() {
  const t = useTranslations("admin");
  const [grupe, setGrupe] = useState<Grupa[] | null>(null);
  const [predmeti, setPredmeti] = useState<Predmet[]>([]);
  const [zabranjeno, setZabranjeno] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [radi, setRadi] = useState(false);
  const { dijalog, unesi, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    const r = await fetch("/api/admin/visestruki-nalozi", { cache: "no-store" });
    if (r.status === 403) {
      setZabranjeno(true);
      return;
    }
    if (!r.ok) {
      setGreska(t("greska_generalna"));
      return;
    }
    const d = await r.json();
    setGrupe(d.grupe ?? []);
    setPredmeti(d.predmeti ?? []);
  }, [t]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function posalji(url: string, body: unknown) {
    setRadi(true);
    setGreska(null);
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setRadi(false);
    if (!r.ok) setGreska((await r.json().catch(() => ({}))).error ?? t("greska_generalna"));
    await ucitaj();
  }

  async function utvrdi(zadrzani: Nalog, ugaseni: Nalog) {
    const obrazlozenje = await unesi({
      poruka: t("visestruki_utvrdi_prompt", { zadrzani: zadrzani.pseudonim, ugaseni: ugaseni.pseudonim }),
      opasno: true,
      dugme: t("visestruki_utvrdi"),
    });
    if (!obrazlozenje?.trim()) return;
    const iskljuci = await potvrdi({ poruka: t("visestruki_iskljuci_pitanje"), dugme: t("visestruki_iskljuci_da") });
    await posalji("/api/admin/visestruki-nalozi", {
      zadrzaniId: zadrzani.id,
      ugaseniId: ugaseni.id,
      obrazlozenje: obrazlozenje.trim(),
      iskljuci,
    });
  }

  async function zatvori(p: Predmet) {
    const beleska = await unesi({ poruka: t("visestruki_predmet_zatvori_prompt"), dugme: t("visestruki_predmet_zatvori") });
    if (!beleska?.trim()) return;
    await posalji(`/api/admin/visestruki-nalozi/${p.id}/zatvori`, { beleska: beleska.trim() });
  }

  if (zabranjeno) return null;

  return (
    <Kartica className="space-y-4">
      {dijalog}
      <h3 className="text-sm font-semibold text-kolo-text">{t("visestruki_naslov")}</h3>
      <p className="text-xs text-kolo-muted">{t("visestruki_opis")}</p>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      {grupe && grupe.length === 0 && <p className="text-sm text-kolo-muted">{t("visestruki_prazno")}</p>}
      {grupe && grupe.length > 0 && (
        <ul className="divide-y divide-kolo-border">
          {grupe.map((g, i) => (
            <li key={i} className="py-3 space-y-2">
              <p className="text-xs font-semibold text-kolo-gold-700">
                {g.osnov === "TELEFON" ? t("visestruki_osnov_telefon") : t("visestruki_osnov_ime")}
              </p>
              <ul className="space-y-1">
                {g.nalozi.map((n) => (
                  <li key={n.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <Link href={profilHref(n)} className="font-semibold text-kolo-green-700 hover:underline">{n.pseudonim}</Link>
                    <span className="text-xs text-kolo-muted">
                      {n.mesto ?? t("visestruki_mesto_nepoznato")}
                      {n.naSpisku ? ` · ${t("visestruki_na_spisku")}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {g.nalozi.flatMap((z) =>
                  g.nalozi
                    .filter((u) => u.id !== z.id)
                    .map((u) => (
                      <button
                        key={`${z.id}-${u.id}`}
                        disabled={radi}
                        onClick={() => utvrdi(z, u)}
                        className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                      >
                        {t("visestruki_zadrzi", { zadrzani: z.pseudonim, ugaseni: u.pseudonim })}
                      </button>
                    )),
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {predmeti.length > 0 && (
        <div className="space-y-2 border-t border-kolo-border pt-3">
          <h4 className="text-sm font-semibold text-kolo-text">{t("visestruki_predmeti_naslov")}</h4>
          <p className="text-xs text-kolo-muted">{t("visestruki_predmeti_opis")}</p>
          <ul className="divide-y divide-kolo-border">
            {predmeti.map((p) => (
              <li key={p.id} className="py-3 space-y-1 text-sm">
                <p className="text-kolo-text">
                  {t("visestruki_predmet_red", {
                    zadrzani: p.zadrzani,
                    ugaseni: p.ugaseni,
                    datum: new Date(p.utvrdjenoAt).toLocaleDateString("sr-RS"),
                    poen: p.otpisano,
                  })}
                  {p.iskljucen ? ` · ${t("visestruki_iskljucen")}` : ""}
                </p>
                <p className="text-xs text-kolo-muted">{p.obrazlozenje}</p>
                {p.primaoci.length > 0 ? (
                  <ul className="text-xs text-kolo-muted">
                    {p.primaoci.map((x, i) => (
                      <li key={i}>
                        {x.pseudonim}: {x.poen.toLocaleString("sr-RS")} POEN
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-kolo-muted">{t("visestruki_bez_primalaca")}</p>
                )}
                {p.predmetOtvoren ? (
                  <button disabled={radi} onClick={() => zatvori(p)} className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
                    {t("visestruki_predmet_zatvori")}
                  </button>
                ) : (
                  <p className="text-xs text-kolo-muted">
                    {t("visestruki_predmet_zatvoren")}{p.predmetBeleska ? ` — ${p.predmetBeleska}` : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Kartica>
  );
}
