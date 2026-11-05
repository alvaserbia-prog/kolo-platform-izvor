"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Zaglavlje stranice: „← roditeljska strana", naslov, opis i radnja, uvek na
 * istom mestu. Pre ovoga je naslov imao šest stilova, a „nazad" pet obrazaca.
 * Serif (`font-citat`) se ovde ne koristi.
 *
 * Dve varijante (odluka vlasnika 02.11.2026, pregled četiri stručnjaka):
 *  - `obicno` — miran naslov (`.kolo-naslov`), za sve stranice na kojima se čita,
 *    popunjava obrazac ili pregleda spisak;
 *  - `istaknuto` — tamnozelena ploča (zeleno zaglavlje): naslov, jedna rečenica,
 *    brojke i radnja. Samo ekrani modula sa ličnim brojem i glavnom radnjom —
 *    zatvoren spisak u `dizajn-ujednaceno-izvor.test.ts` (`ISTAKNUTO`).
 * `skriven` ostavlja naslov samo za čitač ekrana (POEN: zelena kartica stanja JESTE
 * zaglavlje, naslov iznad nje se ne prikazuje). `children` u istaknutoj varijanti
 * ide u ploču (npr. veliki broj i dugmad na POEN-u).
 */
export type Brojka = { vrednost: ReactNode; oznaka: ReactNode };

export default function NaslovStranice({
  naslov,
  opis,
  nazad,
  radnja,
  slika,
  varijanta = "obicno",
  brojke,
  skriven = false,
  children,
}: {
  naslov: ReactNode;
  opis?: ReactNode;
  nazad?: { href?: string; onClick?: () => void; oznaka: ReactNode };
  radnja?: ReactNode;
  slika?: ReactNode;
  varijanta?: "obicno" | "istaknuto";
  brojke?: Brojka[];
  skriven?: boolean;
  children?: ReactNode;
}) {
  const klaseNazad = "print:hidden inline-flex min-h-10 items-center text-sm text-kolo-muted hover:text-kolo-green-700";
  const nazadEl =
    nazad &&
    (nazad.href ? (
      <Link href={nazad.href} className={klaseNazad}>
        ← {nazad.oznaka}
      </Link>
    ) : (
      <button type="button" onClick={nazad.onClick} className={klaseNazad}>
        ← {nazad.oznaka}
      </button>
    ));

  if (skriven) return <h1 className="sr-only">{naslov}</h1>;

  if (varijanta === "istaknuto") {
    return (
      <header className="space-y-2">
        {nazadEl}
        <div className="rounded-kartica bg-kolo-green-900 bg-linear-to-br from-kolo-green-900 to-kolo-green-800 px-5 py-5 text-white shadow-kartica sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {slika && <div className="shrink-0">{slika}</div>}
              <h1 className="min-w-0 text-[1.75rem] font-bold leading-tight tracking-tight text-white">{naslov}</h1>
            </div>
          </div>
          {opis && <p className="mt-2 max-w-xl text-base leading-relaxed text-white/85">{opis}</p>}
          {brojke && brojke.length > 0 && (
            <dl className="mt-4 flex flex-wrap gap-2">
              {brojke.map((b, i) => (
                <div key={i} className="rounded-kontrola bg-white/10 px-3 py-1.5 text-sm">
                  <dt className="sr-only">{b.oznaka}</dt>
                  <dd>
                    <b className="text-lg">{b.vrednost}</b> <span className="text-white/85">{b.oznaka}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
          {radnja && <div className="mt-4">{radnja}</div>}
          {children && <div className="mt-4">{children}</div>}
        </div>
      </header>
    );
  }

  return (
    <header className="space-y-2">
      {nazadEl}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {slika && <div className="shrink-0">{slika}</div>}
          <h1 className="kolo-naslov min-w-0">{naslov}</h1>
        </div>
        {radnja && <div className="shrink-0">{radnja}</div>}
      </div>
      {opis && <p className="max-w-2xl text-sm leading-relaxed text-kolo-muted">{opis}</p>}
    </header>
  );
}
