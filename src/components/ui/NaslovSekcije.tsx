import type { ReactNode } from "react";

/**
 * Naslov sekcije unutar stranice — jedan stil za ceo interfejs (pregled izgleda
 * 02.11.2026). Pre ovoga je naslov sekcije postojao u sedam oblika (`text-2xl`,
 * `text-lg`, `text-base` sivo, `text-sm`, bez veličine, `div` velikim slovima…),
 * ponekad kao `<p>` bez semantike. Uvek `h2` (ili `h3` kad je sekcija u sekciji),
 * uz opcioni opis i radnju desno.
 *
 * `varijanta="oznaka"` je sitna oznaka velikim slovima (TVOJ STATUS, grupe na
 * Sistemu) — samo iznad grupe kartica ili brojki, nikad kao naslov kartice sa
 * radnjom (pregled 02.11.2026). Ručno `uppercase tracking-*` se više ne crta.
 */
export default function NaslovSekcije({
  children,
  opis,
  radnja,
  nivo = 2,
  id,
  varijanta = "naslov",
}: {
  varijanta?: "naslov" | "oznaka";
  children: ReactNode;
  opis?: ReactNode;
  radnja?: ReactNode;
  nivo?: 2 | 3;
  id?: string;
}) {
  const H = nivo === 2 ? "h2" : "h3";
  if (varijanta === "oznaka") {
    return (
      <H id={id} className="text-xs font-semibold uppercase tracking-wide text-kolo-muted">
        {children}
      </H>
    );
  }
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <H id={id} className={`${nivo === 2 ? "text-lg" : "text-base"} font-semibold leading-snug text-kolo-text`}>
          {children}
        </H>
        {radnja && <div className="shrink-0">{radnja}</div>}
      </div>
      {opis && <p className="text-sm leading-relaxed text-kolo-muted">{opis}</p>}
    </div>
  );
}
