"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Fioka: prozor sa sadržajem — na telefonu se izvlači odozdo, na većem ekranu
 * stoji na sredini. Za potvrdu, unos razloga i kratku poruku ide `useDijalog()`;
 * Fioka je za sve ostalo (detalj vaučera, QR kod, izbor, isecanje slike).
 *
 * Zatvara se na Escape, klikom van prozora i dugmetom „×"; dok je otvorena,
 * stranica ispod se ne skroluje, a fokus ulazi u prozor. Pre ovoga su postojala
 * četiri ručno crtana prozora (`fixed inset-0`), svaki drugačiji.
 */
export default function Fioka({
  naslov,
  children,
  onZatvori,
  sirina = "md",
}: {
  /** Naslov prozora — čitač ekrana ga izgovara pri otvaranju. */
  naslov: ReactNode;
  children: ReactNode;
  onZatvori: () => void;
  sirina?: "sm" | "md";
}) {
  const t = useTranslations("common");
  const id = useId();
  const prozor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const naTaster = (e: KeyboardEvent) => {
      if (e.key === "Escape") onZatvori();
    };
    window.addEventListener("keydown", naTaster);
    const prethodno = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    prozor.current?.focus();
    return () => {
      window.removeEventListener("keydown", naTaster);
      document.body.style.overflow = prethodno;
    };
  }, [onZatvori]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onZatvori}>
      <div
        ref={prozor}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-naslov`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[92vh] w-full ${sirina === "sm" ? "max-w-sm" : "max-w-lg"} space-y-4 overflow-y-auto rounded-t-kartica bg-kolo-surface p-5 shadow-plutajuce outline-none sm:rounded-kartica`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={`${id}-naslov`} className="min-w-0 pt-1.5 text-lg font-semibold leading-snug text-kolo-text">
            {naslov}
          </h2>
          <button
            type="button"
            onClick={onZatvori}
            aria-label={t("zatvori")}
            className="-mr-2 -mt-1 flex size-10 shrink-0 items-center justify-center rounded-kontrola text-2xl leading-none text-kolo-muted hover:bg-kolo-bg"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
