"use client";

import { useTranslations } from "next-intl";
import LokacijaSearch from "@/components/LokacijaSearch";
import Dugme from "@/components/ui/Dugme";

/**
 * Dodatna mesta oglasa na Pijaci (uz glavno mesto): svako je naselje iz šifarnika,
 * bira se kroz `LokacijaSearch`; dugme „Dodaj još jedno mesto" stoji dok ukupan broj
 * mesta (glavno + dodatna) ne dostigne `max`. Proveru radi server (`procitajDodatnaMesta`).
 */
export default function DodatnaMestaPolje({
  mesta,
  onChange,
  max,
}: {
  mesta: string[];
  onChange: (mesta: string[]) => void;
  /** Najviše mesta UKUPNO, sa glavnim. */
  max: number;
}) {
  const t = useTranslations("pijaca");
  return (
    <div className="space-y-2">
      {mesta.map((m, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            <LokacijaSearch
              value={m}
              onChange={(v) => onChange(mesta.map((x, j) => (j === i ? v : x)))}
              placeholder={t("dodatno_mesto_placeholder")}
            />
          </div>
          <Dugme varijanta="tiho" velicina="sm" onClick={() => onChange(mesta.filter((_, j) => j !== i))}>
            {t("ukloni_mesto")}
          </Dugme>
        </div>
      ))}
      {mesta.length < max - 1 && (
        <Dugme varijanta="sekundarno" velicina="sm" onClick={() => onChange([...mesta, ""])}>
          {t("dodaj_mesto")}
        </Dugme>
      )}
    </div>
  );
}
