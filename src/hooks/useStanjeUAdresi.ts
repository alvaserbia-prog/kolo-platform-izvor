"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";

// Stanje ekrana (izabran pod-prikaz, upisan filter, otvorena kartica) koje mora
// da preživi povratak (back) sa stranice na koju se sa ovog ekrana kliknulo —
// profil člana, oglas, putanja iz dnevnika. React stanje se pri povratku gubi,
// jer se ekran montira iznova; adresa ostaje. Zato vrednost živi u `?kljuc=`.
//
// replaceState: promena prikaza ne pravi nov unos u istoriji, pa „nazad" vodi
// na prethodnu STRANICU, a ne kroz svaki klik po filterima. Isti obrazac već
// koriste /sistem (`?sekcija=`), admin (`?tab=`) i krug (`?tab=`).
//
// Podrazumevana vrednost se u adresu ne upisuje — čist ekran ima čistu adresu.
export function useStanjeUAdresi(
  kljuc: string,
  podrazumevano = "",
): [string, (vrednost: string) => void] {
  const searchParams = useSearchParams();
  // Na klijentu se čita `window.location`, ne kontekst rutera: `replaceState`
  // se ruteru javlja tek u tranziciji, pa bi ekran montiran odmah posle promene
  // taba (admin) pročitao zaostao parametar prethodnog taba. Pri hidrataciji je
  // adresa ista kao na serveru, pa razlike nema.
  const [vrednost, postaviVrednost] = useState(() => {
    const params =
      typeof window === "undefined"
        ? searchParams
        : new URLSearchParams(window.location.search);
    return params.get(kljuc) ?? podrazumevano;
  });

  const postavi = useCallback(
    (nova: string) => {
      postaviVrednost(nova);
      upisiUAdresu({ [kljuc]: nova === podrazumevano ? null : nova });
    },
    [kljuc, podrazumevano],
  );

  return [vrednost, postavi];
}

/** Upisuje (ili briše, za `null`/"") parametre u tekuću adresu, bez navigacije. */
export function upisiUAdresu(izmene: Record<string, string | null>) {
  const params = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(izmene)) {
    if (v === null || v === "") params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  window.history.replaceState(
    null,
    "",
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
  );
}

/**
 * Početna vrednost ekrana čiji serverski prop (`pocetniTab`, `pocetnaSekcija`)
 * potiče iz adrese. Pri povratku (back) Next vraća stablo iz istorije — ono je
 * nastalo za adresu kakva je bila PRE `replaceState`, pa prop nosi stari tab
 * (npr. „dashboard"), iako adresa kaže `?tab=pijaca`. Na klijentu je zato
 * merodavna adresa; pri hidrataciji je ista kao na serveru, pa razlike nema.
 */
export function pocetnoIzAdrese<T extends string>(
  kljuc: string,
  dozvoljene: readonly T[],
  izProp: T,
): T {
  if (typeof window === "undefined") return izProp;
  const v = new URLSearchParams(window.location.search).get(kljuc);
  return v !== null && (dozvoljene as readonly string[]).includes(v) ? (v as T) : izProp;
}
