"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import LokacijaSearch from "@/components/LokacijaSearch";
import { MAX_MESTA_PREDAJE, type TackaMesta } from "@/lib/mesta-pravila";
import { koordinateZaMesto } from "@/lib/udaljenost";
import Dugme from "@/components/ui/Dugme";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

const MapaGazdinstava = dynamic(() => import("@/components/MapaGazdinstava"), { ssr: false });

export type MestoUnos = { mesto: string; adresa: string; tacka: TackaMesta | null };

export const PRAZNO_MESTO: MestoUnos = { mesto: "", adresa: "", tacka: null };

/**
 * Mesta predaje u obrazac (ruta `/api/pokroviteljstvo/dobra` i priprema Fondacije): prvo mesto
 * kao `mesto`/`adresaPredaje`, ostala kao parovi `dodatnoMesto`/`dodatnaAdresa`, a tačke za SVA
 * mesta istim redom kao `tackaLat`/`tackaLng` (prazno = centar naselja).
 */
export function mestaUFormu(fd: FormData, mesta: MestoUnos[], prvoKao = { mesto: "mesto", adresa: "adresaPredaje" }) {
  mesta.forEach((m, i) => {
    if (i === 0) {
      fd.append(prvoKao.mesto, m.mesto.trim());
      fd.append(prvoKao.adresa, m.adresa.trim());
    } else {
      fd.append("dodatnoMesto", m.mesto.trim());
      fd.append("dodatnaAdresa", m.adresa.trim());
    }
    fd.append("tackaLat", m.tacka ? String(m.tacka.lat) : "");
    fd.append("tackaLng", m.tacka ? String(m.tacka.lng) : "");
  });
}

export function mestaPotpuna(mesta: MestoUnos[]): boolean {
  return mesta.length > 0 && mesta.every((m) => m.mesto.trim() && m.adresa.trim());
}

/**
 * Mesta predaje, odnosno pružanja (donacije čl. 28 st. 2 t. 5; više mesta — set 5.0.6), sa
 * tačnom tačkom na mapi po izboru. Bez tačke se na mapi prikazuje centar naselja.
 */
export default function MestaPredajePolja({
  mesta,
  onChange,
}: {
  mesta: MestoUnos[];
  onChange: (m: MestoUnos[]) => void;
}) {
  const t = useTranslations("postaniPokrovitelj");
  const [mapaZa, setMapaZa] = useState<number | null>(null);
  const promeni = (i: number, izmena: Partial<MestoUnos>) => onChange(mesta.map((m, j) => (j === i ? { ...m, ...izmena } : m)));

  return (
    <div className="space-y-3">
      {mesta.map((m, i) => {
        const centar = m.tacka ? null : koordinateZaMesto(m.mesto);
        return (
          <div key={i} className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${i > 0 ? "border-t border-kolo-border pt-3" : ""}`}>
            <Polje oznaka={i === 0 ? t("dobra_mesto_label") : t("dobra_dodatno_mesto_label", { broj: i + 1 })}>
              <LokacijaSearch value={m.mesto} onChange={(v) => promeni(i, { mesto: v, tacka: null })} />
            </Polje>
            <Polje oznaka={t("dobra_adresa_label")}>
              <input value={m.adresa} onChange={(e) => promeni(i, { adresa: e.target.value })} className={KLASE_UNOSA} />
            </Polje>
            <div className="md:col-span-2 flex flex-wrap items-center gap-2">
              <Dugme varijanta="tiho" velicina="sm" onClick={() => setMapaZa(mapaZa === i ? null : i)}>
                {m.tacka ? t("dobra_tacka_izmeni") : t("dobra_tacka_postavi")}
              </Dugme>
              {m.tacka && (
                <Dugme varijanta="tiho" velicina="sm" onClick={() => promeni(i, { tacka: null })}>
                  {t("dobra_tacka_ukloni")}
                </Dugme>
              )}
              {i > 0 && (
                <Dugme varijanta="tiho" velicina="sm" onClick={() => onChange(mesta.filter((_, j) => j !== i))}>
                  {t("dobra_ukloni_mesto")}
                </Dugme>
              )}
            </div>
            {mapaZa === i && (
              <div className="md:col-span-2 space-y-1">
                <p className="text-xs text-kolo-muted">{t("dobra_tacka_napomena")}</p>
                <MapaGazdinstava
                  izbor={m.tacka}
                  onIzbor={(tacka) => promeni(i, { tacka })}
                  centar={m.tacka ? [m.tacka.lat, m.tacka.lng] : centar ? [centar[0], centar[1]] : null}
                  zumCentra={m.tacka ? 17 : 14}
                  visina={260}
                />
              </div>
            )}
          </div>
        );
      })}
      {mesta.length < MAX_MESTA_PREDAJE && (
        <div className="space-y-1">
          <Dugme varijanta="sekundarno" velicina="sm" onClick={() => onChange([...mesta, PRAZNO_MESTO])}>
            {t("dobra_dodaj_mesto")}
          </Dugme>
          <p className="text-xs text-kolo-muted">{t("dobra_vise_mesta_napomena")}</p>
        </div>
      )}
    </div>
  );
}
