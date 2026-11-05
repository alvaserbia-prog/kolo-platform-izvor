import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Filter-čip: dugme koje se uključuje i isključuje (`aria-pressed`) — „Blizu mene",
 * kategorije na Pijaci, izbor dana. Za izbor JEDNE od 2–4 vrednosti ide `Segmenti`,
 * za podešavanje `Prekidac`. Visina je dodirna meta od 40 px (dizajn-sistem.md).
 */
export function klaseFiltera(ukljucen: boolean) {
  return `inline-flex min-h-10 items-center gap-1.5 rounded-kontrola border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    ukljucen
      ? "border-kolo-green-700 bg-kolo-green-700 text-white"
      : "border-kolo-border bg-kolo-surface text-kolo-text hover:bg-kolo-bg"
  }`;
}

export default function Filter({
  ukljucen,
  children,
  className = "",
  ...ostalo
}: { ukljucen: boolean; children: ReactNode; className?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed">) {
  return (
    <button type="button" aria-pressed={ukljucen} {...ostalo} className={`${klaseFiltera(ukljucen)} ${className}`.trim()}>
      {children}
    </button>
  );
}
