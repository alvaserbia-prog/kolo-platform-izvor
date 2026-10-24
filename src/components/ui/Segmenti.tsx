"use client";

import type { ReactNode } from "react";

/**
 * Prekidač između dve do četiri vrednosti (Nudim/Tražim, Aktivni/Arhiva…).
 * Pre ovoga isti kontrol je crtan na šest načina, jedan sa crnim aktivnim.
 */
export default function Segmenti<T extends string>({
  opcije,
  vrednost,
  onPromena,
  oznaka,
  punaSirina = false,
}: {
  opcije: { vrednost: T; oznaka: ReactNode }[];
  vrednost: T;
  onPromena: (v: T) => void;
  oznaka: string;
  punaSirina?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={oznaka}
      className={`${punaSirina ? "flex w-full" : "inline-flex"} rounded-kontrola border border-kolo-border bg-kolo-surface p-1 gap-1`}
    >
      {opcije.map((o) => {
        const aktivna = o.vrednost === vrednost;
        return (
          <button
            key={o.vrednost}
            type="button"
            role="radio"
            aria-checked={aktivna}
            onClick={() => onPromena(o.vrednost)}
            className={`${punaSirina ? "flex-1" : ""} min-h-9 rounded-lg px-4 text-sm font-semibold transition-colors ${
              aktivna ? "bg-kolo-green-700 text-white" : "text-kolo-muted hover:text-kolo-text hover:bg-kolo-bg"
            }`}
          >
            {o.oznaka}
          </button>
        );
      })}
    </div>
  );
}
