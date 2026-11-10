"use client";

import { useTranslations } from "next-intl";
import { VRSTE_HRANE, VRSTE_GRLA, UDELI_HRANE, ISHRANE_KRAVA, DJUBRENJA, ZASTITE, ZIVOTINJSKE, BILJNE, type VrstaHrane } from "@/lib/hrana-pravila";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

/** Podaci o proizvodnji hrane (donacije čl. 22 st. 4–8, čl. 28 st. 2 t. 6) — stanje obrasca. */
export type HranaUnos = {
  jeHrana: boolean;
  polja: Record<string, string>;
  kavezi: boolean;
  organski: boolean;
  izjavaPodataka: boolean;
};

export const PRAZNA_HRANA: HranaUnos = {
  jeHrana: false,
  polja: { vrstaHrane: "", opisProizvodnje: "", stalnihRadnika: "", vrstaGrla: "", brojGrla: "", povrsinaHa: "", plastenikHa: "", udeoHrane: "", ishranaKrava: "", djubrenje: "", zastita: "" },
  kavezi: false,
  organski: false,
  izjavaPodataka: false,
};

/**
 * Polja koja čita `procitajPredmetDobra` (isto pravilo za prijavu i pripremu Fondacije).
 * Prazan objekat kad predmet nije hrana.
 */
export function hranaUPolja(h: HranaUnos): Record<string, string> {
  if (!h.jeHrana) return {};
  return {
    jeHrana: "true",
    ...h.polja,
    kavezi: h.kavezi ? "true" : "false",
    organskiSertifikat: h.organski ? "true" : "false",
    izjavaPodataka: h.izjavaPodataka ? "true" : "false",
  };
}

/** Obrazac je dovoljno popunjen za slanje (konačnu proveru radi server). */
export function hranaSpremna(h: HranaUnos): boolean {
  return !h.jeHrana || (!!h.polja.vrstaHrane && h.polja.opisProizvodnje.trim().length >= 5 && h.polja.stalnihRadnika !== "" && h.izjavaPodataka);
}

/**
 * Hrana (set 5.0.2–5.0.7; donacije čl. 22 st. 5, čl. 28 st. 2 t. 6): davalac daje samo podatke o
 * proizvodnji, a kategoriju i koeficijent izvodi sistem, poreklo utvrđuje Fondacija pri
 * prihvatanju prijave. Isti deo stoji u prijavi i u pripremi Fondacije.
 */
export default function HranaPolja({ h, onChange }: { h: HranaUnos; onChange: (h: HranaUnos) => void }) {
  const t = useTranslations("postaniPokrovitelj");
  const polje = KLASE_UNOSA;
  const ph = (k: string) => (e: { target: { value: string } }) => onChange({ ...h, polja: { ...h.polja, [k]: e.target.value } });
  const vh = h.polja.vrstaHrane as VrstaHrane | "";
  const zivotinjska = !!vh && ZIVOTINJSKE.includes(vh);
  const biljna = !!vh && BILJNE.includes(vh);

  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 text-sm text-kolo-text">
        <input type="checkbox" checked={h.jeHrana} onChange={(e) => onChange({ ...h, jeHrana: e.target.checked })} className="mt-0.5" />
        {t("dobra_hrana_oznaka")}
      </label>
      {h.jeHrana && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Polje oznaka={t("dobra_hrana_vrsta_label")}>
            <select value={h.polja.vrstaHrane} onChange={ph("vrstaHrane")} className={polje}>
              <option value="">—</option>
              {VRSTE_HRANE.map((v) => <option key={v} value={v}>{t(`dobra_hrana_vrsta_${v}`)}</option>)}
            </select>
          </Polje>
          <Polje oznaka={t("dobra_hrana_radnici_label")} pomoc={t("dobra_hrana_radnici_pomoc")}>
            <input type="number" min={0} value={h.polja.stalnihRadnika} onChange={ph("stalnihRadnika")} className={polje} />
          </Polje>
          <Polje className="md:col-span-2" oznaka={t("dobra_hrana_opis_label")} pomoc={t("dobra_hrana_opis_pomoc")}>
            <textarea value={h.polja.opisProizvodnje} onChange={ph("opisProizvodnje")} rows={2} className={polje} />
          </Polje>
          {zivotinjska && (
            <>
              <Polje oznaka={t("dobra_hrana_grla_vrsta_label")}>
                <select value={h.polja.vrstaGrla} onChange={ph("vrstaGrla")} className={polje}>
                  <option value="">—</option>
                  {VRSTE_GRLA.map((v) => <option key={v} value={v}>{t(`dobra_hrana_grla_${v}`)}</option>)}
                </select>
              </Polje>
              <Polje oznaka={t("dobra_hrana_grla_broj_label")}>
                <input type="number" min={1} value={h.polja.brojGrla} onChange={ph("brojGrla")} className={polje} />
              </Polje>
            </>
          )}
          {(vh === "MESO" || vh === "JAJA") && (
            <Polje className="md:col-span-2" oznaka={t("dobra_hrana_udeo_label")}>
              <select value={h.polja.udeoHrane} onChange={ph("udeoHrane")} className={polje}>
                <option value="">—</option>
                {UDELI_HRANE.map((v) => <option key={v} value={v}>{t(`dobra_hrana_udeo_${v}`)}</option>)}
              </select>
            </Polje>
          )}
          {vh === "JAJA" && (
            <label className="md:col-span-2 flex items-start gap-2 text-sm text-kolo-text">
              <input type="checkbox" checked={h.kavezi} onChange={(e) => onChange({ ...h, kavezi: e.target.checked })} className="mt-0.5" />
              {t("dobra_hrana_kavezi")}
            </label>
          )}
          {vh === "MLEKO" && (
            <Polje className="md:col-span-2" oznaka={t("dobra_hrana_krave_label")}>
              <select value={h.polja.ishranaKrava} onChange={ph("ishranaKrava")} className={polje}>
                <option value="">—</option>
                {ISHRANE_KRAVA.map((v) => <option key={v} value={v}>{t(`dobra_hrana_krave_${v}`)}</option>)}
              </select>
            </Polje>
          )}
          {biljna && (
            <>
              <Polje oznaka={t("dobra_hrana_ha_label")}>
                <input type="number" min={0} step="0.01" value={h.polja.povrsinaHa} onChange={ph("povrsinaHa")} className={polje} />
              </Polje>
              {vh === "POVRCE" && (
                <Polje oznaka={t("dobra_hrana_plastenik_label")}>
                  <input type="number" min={0} step="0.01" value={h.polja.plastenikHa} onChange={ph("plastenikHa")} className={polje} />
                </Polje>
              )}
              <label className="md:col-span-2 flex items-start gap-2 text-sm text-kolo-text">
                <input type="checkbox" checked={h.organski} onChange={(e) => onChange({ ...h, organski: e.target.checked })} className="mt-0.5" />
                {t("dobra_hrana_organski")}
              </label>
              {!h.organski && (
                <>
                  <Polje oznaka={t("dobra_hrana_djubrenje_label")}>
                    <select value={h.polja.djubrenje} onChange={ph("djubrenje")} className={polje}>
                      <option value="">—</option>
                      {DJUBRENJA.map((v) => <option key={v} value={v}>{t(`dobra_hrana_djubrenje_${v}`)}</option>)}
                    </select>
                  </Polje>
                  <Polje oznaka={t("dobra_hrana_zastita_label")}>
                    <select value={h.polja.zastita} onChange={ph("zastita")} className={polje}>
                      <option value="">—</option>
                      {ZASTITE.map((v) => <option key={v} value={v}>{t(`dobra_hrana_zastita_${v}`)}</option>)}
                    </select>
                  </Polje>
                </>
              )}
            </>
          )}
          <label className="md:col-span-2 flex items-start gap-2 text-sm text-kolo-text">
            <input type="checkbox" checked={h.izjavaPodataka} onChange={(e) => onChange({ ...h, izjavaPodataka: e.target.checked })} className="mt-0.5" />
            {t("dobra_hrana_izjava")}
          </label>
        </div>
      )}
    </div>
  );
}
