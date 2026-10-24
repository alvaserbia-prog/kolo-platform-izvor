"use client";

import { useTranslations } from "next-intl";
import { KATEGORIJE, kategorijaKljuc } from "@/lib/kategorije";

// Čipovi kategorija Pijace — višestruki izbor (filter na Pijaci, praćene
// kategorije u profilu). Svih 13 kategorija je stalno vidljivo u flex-wrap
// rasporedu; veličina čipa prati dugmad prekidača Ponude|Potražnja
// (px-4 py-1.5, zahtev vlasnika).
// Forma za objavu oglasa NE koristi čipove — tamo se bira tačno jedna
// kategorija, pa stoji padajući meni (raniji mod „single" je uklonjen).
// `counts` (samo filter): prikazuje broj u čipu; kategorija sa 0 oglasa je
// prigušena, ali i dalje klikabilna.

export interface LeadingChip {
  label: string;
  active: boolean;
  onClick: () => void;
}

interface Props {
  selected: string[];
  onChange: (next: string[]) => void;
  counts?: Record<string, number>;
  // Poseban čip ispred kategorija (npr. „Samo praćene" na Pijaci).
  leadingChip?: LeadingChip;
}

export default function CategoryChips({ selected, onChange, counts, leadingChip }: Props) {
  const t = useTranslations("pijaca");

  function toggle(slug: string) {
    onChange(
      selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug]
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5" role="group">
      {leadingChip && (
        <button
          type="button"
          onClick={leadingChip.onClick}
          aria-pressed={leadingChip.active}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            leadingChip.active
              ? "bg-kolo-green-700 text-white"
              : "bg-kolo-surface border border-kolo-gold-600/40 text-kolo-gold-700 hover:border-kolo-gold-600"
          }`}
        >
          {leadingChip.label}
        </button>
      )}
      {KATEGORIJE.map((slug) => {
        const aktivna = selected.includes(slug);
        const broj = counts?.[slug] ?? 0;
        const prigusena = counts !== undefined && broj === 0 && !aktivna;
        return (
          <button
            key={slug}
            type="button"
            onClick={() => toggle(slug)}
            aria-pressed={aktivna}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              aktivna
                ? "bg-kolo-green-700 text-white"
                : `bg-kolo-surface border border-kolo-border text-kolo-text hover:border-kolo-green-700 ${
                    prigusena ? "opacity-50" : ""
                  }`
            }`}
          >
            {t(`kategorija_${kategorijaKljuc(slug)}`)}
            {counts !== undefined && <span className="opacity-70"> ({broj})</span>}
          </button>
        );
      })}
    </div>
  );
}
