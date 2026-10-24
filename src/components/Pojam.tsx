"use client";

/**
 * Pojam — inline tooltip uz stručni pojam.
 * Prikazuje mali "ⓘ" pored teksta; objašnjenje iskoči na hover (desktop)
 * ili na klik/tap (mobilno). Namenjeno novajlijama da razumeju termine
 * poput "Opticaj", "zero-sum", "Indeks stvarnosti", "ZRNO"...
 */
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function Pojam({
  termin,
  objasnjenje,
}: {
  termin: React.ReactNode;
  objasnjenje: string;
}) {
  const t = useTranslations("pojam");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center gap-1">
      {termin}
      {/* Trigger je <span> (a ne <button>) da bi mogao da se ugnezdi i unutar dugmeta-kartice bez nevalidnog HTML-a */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); } }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label={t("aria_sta_je", { termin: typeof termin === "string" ? termin : "?" })}
        aria-expanded={open}
        // Krug je 18 px, ali dodirna površina je ~42 px (nevidljiv `before:`), da se
        // prstom pogađa. Boja je boja okolnog teksta (`text-current`): sa sivom je
        // na zelenoj kartici „Ukupno POENA" imao 1,18 : 1.
        className="relative inline-flex items-center justify-center w-[18px] h-[18px] rounded-full border border-current text-[11px] font-bold leading-none text-current opacity-90 hover:opacity-100 transition-opacity align-middle cursor-help select-none before:absolute before:-inset-3 before:content-['']"
      >
        i
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full mt-1.5 z-50 w-64 max-w-[80vw] rounded-xl bg-kolo-text text-white text-sm leading-relaxed font-normal normal-case tracking-normal p-3 shadow-xl"
        >
          {objasnjenje}
        </span>
      )}
    </span>
  );
}
