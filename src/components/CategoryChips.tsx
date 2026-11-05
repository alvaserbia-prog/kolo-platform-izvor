"use client";

import { useTranslations } from "next-intl";
import { KATEGORIJE, kategorijaKljuc } from "@/lib/kategorije";
import Filter from "@/components/ui/Filter";

// Čipovi kategorija Pijace — višestruki izbor (filter na Pijaci, praćene
// kategorije u profilu). Svih 13 kategorija je stalno vidljivo u flex-wrap
// rasporedu; čip je zajednički `Filter` (40 px, ista težina fonta kao ostali
// filteri na Pijaci — pregled izgleda 02.11.2026).
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
    <div className="flex flex-wrap gap-2" role="group">
      {leadingChip && (
        <Filter ukljucen={leadingChip.active} onClick={leadingChip.onClick}>
          {leadingChip.label}
        </Filter>
      )}
      {KATEGORIJE.map((slug) => {
        const aktivna = selected.includes(slug);
        const broj = counts?.[slug] ?? 0;
        const prigusena = counts !== undefined && broj === 0 && !aktivna;
        return (
          <Filter
            key={slug}
            ukljucen={aktivna}
            onClick={() => toggle(slug)}
            className={prigusena ? "opacity-50" : ""}
          >
            {t(`kategorija_${kategorijaKljuc(slug)}`)}
            {counts !== undefined && <span className="font-normal opacity-80">({broj})</span>}
          </Filter>
        );
      })}
    </div>
  );
}
