"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { profilHref } from "@/lib/profil-link";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";
import Obavestenje from "@/components/ui/Obavestenje";
import { useDijalog } from "@/components/ui/Dijalog";

type Nalaz = {
  redId: string;
  prestaliPseudonim: string;
  iznos: number;
  prestanakAt: string;
  osnovPrestanka: string;
  nalog: { id: string; pseudonim: string; mesto: string | null };
  osnovi: ("TELEFON" | "IME")[];
  istoMesto: boolean;
};

/**
 * Admin → Potvrde → „Negativan zapis prestalog naloga" (Pravilnik čl. 33 st. 7 i
 * čl. 17 st. 2 t. 12; Registar br. 29; set 5.1.2). Samo superadmin — ruta odbija
 * ostale, pa se tada ne prikazuje ništa.
 *
 * 🔴 Nalaz nije odluka i ništa ne blokira. Odluka je „Utvrdi isto lice i prenesi",
 * uz obrazloženje. 🔴 Ime i broj se ovde ne prikazuju.
 */
export default function NegativniZapisi() {
  const t = useTranslations("admin");
  const [nalazi, setNalazi] = useState<Nalaz[] | null>(null);
  const [zabranjeno, setZabranjeno] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [radi, setRadi] = useState(false);
  const { dijalog, unesi } = useDijalog();

  const ucitaj = useCallback(async () => {
    const r = await fetch("/api/admin/negativni-zapisi", { cache: "no-store" });
    if (r.status === 403) {
      setZabranjeno(true);
      return;
    }
    if (!r.ok) {
      setGreska(t("greska_generalna"));
      return;
    }
    const d = await r.json();
    setNalazi(d.nalazi ?? []);
  }, [t]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function prenesi(n: Nalaz) {
    const obrazlozenje = await unesi({
      poruka: t("negativan_prenesi_prompt", { novi: n.nalog.pseudonim, prestali: n.prestaliPseudonim, poen: n.iznos }),
      opasno: true,
      dugme: t("negativan_prenesi", { novi: n.nalog.pseudonim }),
    });
    if (!obrazlozenje?.trim()) return;
    setRadi(true);
    setGreska(null);
    const r = await fetch("/api/admin/negativni-zapisi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redId: n.redId, noviId: n.nalog.id, obrazlozenje: obrazlozenje.trim() }),
    });
    setRadi(false);
    if (!r.ok) setGreska((await r.json().catch(() => ({}))).error ?? t("greska_generalna"));
    await ucitaj();
  }

  // Bez nalaza se odeljak ne prikazuje — nalazi su retki, a prazan okvir je šum.
  if (zabranjeno || !nalazi || (nalazi.length === 0 && !greska)) return null;

  return (
    <Kartica className="space-y-4">
      {dijalog}
      <NaslovSekcije nivo={3}>{t("negativan_naslov")}</NaslovSekcije>
      <p className="text-xs text-kolo-muted">{t("negativan_opis")}</p>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      <ul className="divide-y divide-kolo-border">
        {nalazi.map((n) => (
          <li key={`${n.redId}-${n.nalog.id}`} className="py-3 space-y-2 text-sm">
            <p className="text-kolo-text">
              {t("negativan_red", {
                prestali: n.prestaliPseudonim,
                datum: new Date(n.prestanakAt).toLocaleDateString("sr-RS"),
                poen: n.iznos,
              })}
              {" · "}
              {n.osnovPrestanka === "ISKLJUCENJE" ? t("negativan_iskljucenje") : t("negativan_istupanje")}
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <Link href={profilHref(n.nalog)} className="font-semibold text-kolo-green-700 hover:underline">{n.nalog.pseudonim}</Link>
              <span className="text-xs text-kolo-muted">
                {n.nalog.mesto ?? t("visestruki_mesto_nepoznato")}
                {" · "}
                {n.osnovi.map((o) => (o === "TELEFON" ? t("visestruki_osnov_telefon") : t("visestruki_osnov_ime"))).join(", ")}
                {n.istoMesto ? ` · ${t("negativan_isto_mesto")}` : ""}
              </span>
            </p>
            <button
              disabled={radi}
              onClick={() => prenesi(n)}
              className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
            >
              {t("negativan_prenesi", { novi: n.nalog.pseudonim })}
            </button>
          </li>
        ))}
      </ul>
    </Kartica>
  );
}
