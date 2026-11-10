"use client";

import { useTranslations } from "next-intl";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import {
  VRSTE_GRLA, UDELI_HRANE, ISHRANE_KRAVA, DJUBRENJA, ZASTITE, ZIVOTINJSKE, BILJNE,
  type VrstaHrane,
} from "@/lib/hrana-pravila";

/**
 * Podaci o proizvodnji (donacije čl. 28 st. 2 t. 6) iz kojih Platforma izvodi poreklo hrane, a
 * Fondacija ga utvrđuje (čl. 22 st. 5). Davalac koeficijent ne vidi i ne bira.
 */
export type OdgovoriUnos = Record<string, string | boolean>;

export default function OdgovoriHraneForma({
  vrednost,
  onPromena,
  vrste,
}: {
  vrednost: OdgovoriUnos;
  onPromena: (v: OdgovoriUnos) => void;
  vrste: readonly VrstaHrane[];
}) {
  const t = useTranslations("lanac");
  const v = (k: string) => (typeof vrednost[k] === "string" ? (vrednost[k] as string) : "");
  const set = (k: string, x: string | boolean) => onPromena({ ...vrednost, [k]: x });
  const vrsta = v("vrstaHrane") as VrstaHrane | "";
  const zivotinjska = vrsta !== "" && ZIVOTINJSKE.includes(vrsta);
  const biljna = vrsta !== "" && BILJNE.includes(vrsta);
  const izbor = (k: string, opcije: readonly string[], prefiks: string) => (
    <select className={KLASE_UNOSA} value={v(k)} onChange={(e) => set(k, e.target.value)}>
      <option value="">—</option>
      {opcije.map((o) => <option key={o} value={o}>{t(`${prefiks}_${o}`)}</option>)}
    </select>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Polje oznaka={t("hrana_vrsta")}>{izbor("vrstaHrane", vrste, "hrana_vrsta")}</Polje>
      <Polje oznaka={t("hrana_radnika")} pomoc={t("hrana_radnika_pomoc")}>
        <input className={KLASE_UNOSA} inputMode="numeric" value={v("stalnihRadnika")} onChange={(e) => set("stalnihRadnika", e.target.value)} />
      </Polje>
      <Polje oznaka={t("hrana_opis")} className="sm:col-span-2">
        <input className={KLASE_UNOSA} value={v("opisProizvodnje")} onChange={(e) => set("opisProizvodnje", e.target.value)} />
      </Polje>
      {zivotinjska && (
        <>
          <Polje oznaka={t("hrana_vrsta_grla")}>{izbor("vrstaGrla", VRSTE_GRLA, "grlo")}</Polje>
          <Polje oznaka={t("hrana_broj_grla")}>
            <input className={KLASE_UNOSA} inputMode="numeric" value={v("brojGrla")} onChange={(e) => set("brojGrla", e.target.value)} />
          </Polje>
        </>
      )}
      {(vrsta === "MESO" || vrsta === "JAJA") && <Polje oznaka={t("hrana_udeo")}>{izbor("udeoHrane", UDELI_HRANE, "udeo")}</Polje>}
      {vrsta === "JAJA" && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-5" checked={vrednost.kavezi === true} onChange={(e) => set("kavezi", e.target.checked)} />
          {t("hrana_kavezi")}
        </label>
      )}
      {vrsta === "MLEKO" && <Polje oznaka={t("hrana_ishrana")}>{izbor("ishranaKrava", ISHRANE_KRAVA, "ishrana")}</Polje>}
      {biljna && (
        <>
          <Polje oznaka={t("hrana_povrsina")}>
            <input className={KLASE_UNOSA} inputMode="decimal" value={v("povrsinaHa")} onChange={(e) => set("povrsinaHa", e.target.value)} />
          </Polje>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-5" checked={vrednost.organskiSertifikat === true} onChange={(e) => set("organskiSertifikat", e.target.checked)} />
            {t("hrana_organsko")}
          </label>
          {vrednost.organskiSertifikat !== true && (
            <>
              <Polje oznaka={t("hrana_djubrenje")}>{izbor("djubrenje", DJUBRENJA, "djubrenje")}</Polje>
              <Polje oznaka={t("hrana_zastita")}>{izbor("zastita", ZASTITE, "zastita")}</Polje>
            </>
          )}
        </>
      )}
    </div>
  );
}
