"use client";

/**
 * Prekidač uključeno/isključeno (role="switch"). Za stanje koje se pali i gasi
 * (program aktivan, kanal ZRNA) — umesto para sitnih pilula „Aktiviraj" /
 * „Deaktiviraj" koje nisu pokazivale STANJE, nego samo radnju.
 */
export default function Prekidac({
  ukljuceno,
  onPromena,
  oznaka,
  zauzet = false,
}: {
  ukljuceno: boolean;
  onPromena: () => void;
  /** Šta prekidač radi — čita ga čitač ekrana. */
  oznaka: string;
  zauzet?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ukljuceno}
      aria-label={oznaka}
      title={oznaka}
      onClick={onPromena}
      disabled={zauzet}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
        ukljuceno ? "bg-kolo-green-700" : "bg-kolo-border-polje"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${ukljuceno ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}
