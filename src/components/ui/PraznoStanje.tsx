import type { ReactNode } from "react";

/**
 * Prazno stanje liste: ikonica, naslov, opis i jedna radnja — visine po
 * sadržaju. Prazne kartice su ranije zauzimale 450–640 px sa jednom
 * rečenicom u sredini i gurale korisne radnje ispod prvog ekrana.
 */
export default function PraznoStanje({
  naslov,
  opis,
  radnja,
  ikona,
  kompaktno = false,
}: {
  naslov: ReactNode;
  opis?: ReactNode;
  radnja?: ReactNode;
  ikona?: ReactNode;
  kompaktno?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center gap-2 ${kompaktno ? "py-4" : "py-8"}`}>
      <div className="text-kolo-green-500" aria-hidden="true">
        {ikona ?? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 9h18" />
          </svg>
        )}
      </div>
      <p className="text-sm font-semibold text-kolo-text">{naslov}</p>
      {opis && <p className="max-w-xs text-sm text-kolo-muted">{opis}</p>}
      {radnja && <div className="mt-1">{radnja}</div>}
    </div>
  );
}
