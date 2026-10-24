"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";

/**
 * Polje forme: oznaka iznad, polje, pomoć i greška ispod.
 *
 * 🔴 Oznaka je VEZANA za polje (`htmlFor`/`id`): dodir na reč „Email" stavlja
 * kursor u polje, a čitač ekrana čita oznaku, ne samo placeholder. Do sada
 * nijedno polje na registraciji nije imalo pristupačno ime.
 * Dete mora biti jedan element (`input`, `select`, `textarea` ili komponenta
 * koja prosleđuje `id`); id se daje ovde ako ga dete nema.
 */
export const KLASE_UNOSA =
  "w-full min-h-11 rounded-kontrola border border-kolo-border bg-kolo-surface px-4 py-2.5 text-sm text-kolo-text outline-none transition-colors placeholder:text-kolo-muted focus:border-kolo-green-700";

export default function Polje({
  oznaka,
  pomoc,
  greska,
  opciono,
  children,
  className = "",
}: {
  oznaka: ReactNode;
  pomoc?: ReactNode;
  greska?: ReactNode;
  opciono?: ReactNode;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
  className?: string;
}) {
  const auto = useId();
  const id = (isValidElement(children) && children.props.id) || `polje-${auto}`;
  const opisId = pomoc ? `${id}-pomoc` : undefined;
  const greskaId = greska ? `${id}-greska` : undefined;
  const opisano = [opisId, greskaId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-kolo-text">
        {oznaka}
        {opciono && <span className="ml-1 font-normal text-kolo-muted">{opciono}</span>}
      </label>
      {cloneElement(children, {
        id,
        "aria-describedby": opisano,
        "aria-invalid": greska ? true : undefined,
      })}
      {pomoc && <p id={opisId} className="mt-1 text-sm text-kolo-muted">{pomoc}</p>}
      {greska && <p id={greskaId} role="alert" className="mt-1 text-sm text-kolo-danger">{greska}</p>}
    </div>
  );
}
