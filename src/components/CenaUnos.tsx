"use client";

import Segmenti from "@/components/ui/Segmenti";
import type { CenaTip } from "@/lib/cena-oglas";

// Izbor varijante cene (FIKSNA / RASPON / DOGOVOR) + odgovarajuća polja unosa.
// Stanje drži roditeljska forma; komponenta je čisto kontrolisana (controlled).
// `t` je next-intl prevodilac iz namespace-a "pijaca".
export default function CenaUnos({
  cenaTip,
  setCenaTip,
  price,
  setPrice,
  cenaDo,
  setCenaDo,
  t,
}: {
  cenaTip: CenaTip;
  setCenaTip: (v: CenaTip) => void;
  price: string;
  setPrice: (v: string) => void;
  cenaDo: string;
  setCenaDo: (v: string) => void;
  t: (key: string) => string;
}) {
  const tipovi: { val: CenaTip; label: string }[] = [
    { val: "FIKSNA", label: t("cena_tip_fiksna") },
    { val: "RASPON", label: t("cena_tip_raspon") },
    { val: "DOGOVOR", label: t("cena_tip_dogovor") },
  ];

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-kolo-border text-sm tabular-nums outline-none focus:border-kolo-green-500 transition-colors";

  return (
    <div>
      <p className="block text-sm font-semibold text-kolo-muted mb-2">{t("cena_tip_label")}</p>

      {/* Izbor varijante cene. Primer iznosa se u polje ne upisuje (odluka
          vlasnika 22.10.2026): „500" u praznom polju čitao se kao već zadata cena. */}
      <div className="mb-3">
        <Segmenti
          oznaka={t("cena_tip_label")}
          vrednost={cenaTip}
          onPromena={setCenaTip}
          opcije={tipovi.map(({ val, label }) => ({ vrednost: val, oznaka: label }))}
          punaSirina
        />
      </div>

      {/* Polja zavise od izabrane varijante */}
      {cenaTip === "FIKSNA" && (
        <input
          type="number"
          min={1}
          step={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          aria-label={t("cena_tip_fiksna")}
          className={inputCls}
        />
      )}

      {cenaTip === "RASPON" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t("cena_od")}
            aria-label={t("cena_od")}
            className={inputCls}
          />
          <span className="text-kolo-muted">—</span>
          <input
            type="number"
            min={1}
            step={1}
            value={cenaDo}
            onChange={(e) => setCenaDo(e.target.value)}
            placeholder={t("cena_do")}
            aria-label={t("cena_do")}
            className={inputCls}
          />
        </div>
      )}

      {cenaTip === "DOGOVOR" && (
        <p className="text-sm text-kolo-muted bg-kolo-bg rounded-xl px-4 py-3">{t("cena_dogovor_hint")}</p>
      )}

      {/* Orijentir za iznos — bez broja: odnos izvodi učesnik, Fondacija ga ne
          objavljuje (Uslovi čl. 21). Isti tekst stoji u FAQ-u „Kako da odredim
          cenu u POENIMA?". */}
      {cenaTip !== "DOGOVOR" && (
        <p className="mt-2 text-xs text-kolo-muted leading-relaxed">{t("cena_iznos_hint")}</p>
      )}
    </div>
  );
}
