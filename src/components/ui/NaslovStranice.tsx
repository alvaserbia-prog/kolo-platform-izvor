import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Zaglavlje stranice: „← roditeljska strana", naslov, opis i radnja, uvek na
 * istom mestu. Pre ovoga je naslov imao šest stilova, a „nazad" pet obrazaca.
 * Stil naslova je `.kolo-naslov` (globals.css).
 */
export default function NaslovStranice({
  naslov,
  opis,
  nazad,
  radnja,
}: {
  naslov: ReactNode;
  opis?: ReactNode;
  nazad?: { href: string; oznaka: ReactNode };
  radnja?: ReactNode;
}) {
  return (
    <header className="space-y-2">
      {nazad && (
        <Link href={nazad.href} className="inline-flex min-h-9 items-center text-sm text-kolo-muted hover:text-kolo-green-700">
          ← {nazad.oznaka}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="kolo-naslov min-w-0">{naslov}</h1>
        {radnja && <div className="shrink-0">{radnja}</div>}
      </div>
      {opis && <p className="max-w-2xl text-sm leading-relaxed text-kolo-muted">{opis}</p>}
    </header>
  );
}
