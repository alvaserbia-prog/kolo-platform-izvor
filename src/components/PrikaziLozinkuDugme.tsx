"use client";

/**
 * Dugme „oko" za prikaz/skrivanje lozinke. Postavlja se unutar `relative`
 * wrapper-a oko input polja; input treba da ima `pr-12` da tekst ne ide ispod ikone.
 */
export default function PrikaziLozinkuDugme({
  prikazan,
  onToggle,
  prikaziLabel,
  sakrijLabel,
}: {
  prikazan: boolean;
  onToggle: () => void;
  prikaziLabel: string;
  sakrijLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={prikazan ? sakrijLabel : prikaziLabel}
      title={prikazan ? sakrijLabel : prikaziLabel}
      tabIndex={-1}
      className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-kolo-muted hover:text-kolo-text transition-colors"
    >
      {prikazan ? (
        // oko precrtano (sakrij)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      ) : (
        // oko (prikaži)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}
