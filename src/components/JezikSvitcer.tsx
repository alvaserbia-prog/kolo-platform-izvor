"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

// Jezik/pismo se bira preko cookie-a (NEXT_LOCALE) + osvežavanja — bez URL prefiksa
// (projekat koristi ravno stablo ruta; request.ts чita cookie i učitava prevode,
// a ćirilica se izvodi transliteracijom iz "sr").
// Redosled: domaći jezici prvo, engleski poslednji (odluka vlasnika) — engleski
// je međunarodni rezervni izbor, ne jedan od jezika regiona.
const jezici = [
  { kod: "sr", ikona: "/flags/rs.svg", naziv: "Srpski — latinica", kratko: "SR" },
  { kod: "sr-Cyrl", ikona: "/flags/rs-grb.svg", naziv: "Српски — ћирилица", kratko: "СР" },
  { kod: "ru", ikona: "/flags/ru.svg", naziv: "Русский", kratko: "RU" },
  { kod: "hr", ikona: "/flags/hr.svg", naziv: "Hrvatski", kratko: "HR" },
  { kod: "hu", ikona: "/flags/hu.svg", naziv: "Magyar", kratko: "HU" },
  { kod: "en", ikona: "/flags/gb.svg", naziv: "English", kratko: "EN" },
];

function promeniJezik(kod: string) {
  document.cookie = `NEXT_LOCALE=${kod}; path=/; max-age=31536000; SameSite=Lax`;
  // Prijavljenom korisniku trajno upiši izbor (notifikacije/email); gostu no-op.
  fetch("/api/profil/jezik", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jezik: kod }),
  }).catch(() => {});
  window.location.reload();
}

type Props = {
  className?: string;
  /** "tamna" = na zelenoj podlozi (app header, sidebar), "svetla" = na beloj (javni header). */
  tema?: "tamna" | "svetla";
  /** Panel se otvara nagore — za mesta gde switcher stoji na dnu (mobilni meni, drawer). */
  nagore?: boolean;
  /** Sa koje ivice dugmeta se spisak širi. "desno" kad switcher stoji uz desnu ivicu
   *  uskog okvira (mobilni drawer od 256px) — inače bi spisak izašao van njega. */
  poravnaj?: "levo" | "desno";
};

/**
 * Padajući izbor jezika. NIJE red zastavica: red je rastao sa svakim novim
 * jezikom (6 jezika ≈ 205px) i lomio zaglavlje — javni header na 1140px nema
 * toliko mesta pored logotipa, 6 linkova navigacije i dva dugmeta, pa se sadržaj
 * prelamao u dva reda. Dugme ovde ima STALNU širinu (~70px) bez obzira na broj
 * jezika, a spisak se otvara preko sadržaja i skroluje (max-h) — dodavanje
 * sedmog, desetog ili dvadesetog jezika ne dira raspored zaglavlja.
 *
 * `data-no-cyr`: nazivi jezika i skraćenice se NE transliterišu u ćirilicu kada
 * je aktivan locale "sr-Cyrl" (inače bi „Hrvatski" postao „Хрватски"); vidi
 * CirilicaProvider.
 */
export default function JezikSvitcer({
  className = "",
  tema = "tamna",
  nagore = false,
  poravnaj = "levo",
}: Props) {
  const trenutni = useLocale();
  const [otvoren, setOtvoren] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const aktivan = jezici.find((j) => j.kod === trenutni) ?? jezici[0];

  useEffect(() => {
    if (!otvoren) return;
    function naKlik(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOtvoren(false);
    }
    function naEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOtvoren(false);
    }
    document.addEventListener("mousedown", naKlik);
    document.addEventListener("keydown", naEsc);
    return () => {
      document.removeEventListener("mousedown", naKlik);
      document.removeEventListener("keydown", naEsc);
    };
  }, [otvoren]);

  const svetla = tema === "svetla";

  return (
    <div className={`relative ${className}`} ref={ref} data-no-cyr>
      <button
        type="button"
        onClick={() => setOtvoren((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={otvoren}
        aria-label={aktivan.naziv}
        title={aktivan.naziv}
        suppressHydrationWarning
        className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors ${
          svetla
            ? "border border-kolo-border hover:bg-kolo-bg text-kolo-text"
            : "border border-white/25 hover:bg-white/10 text-white/90"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={aktivan.ikona}
          alt=""
          width={24}
          height={18}
          className="block h-[18px] w-6 shrink-0 rounded-[3px] object-cover"
        />
        <span className="text-[11px] font-semibold tracking-wide leading-none">
          {aktivan.kratko}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 opacity-70 transition-transform ${otvoren ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {otvoren && (
        <div
          role="listbox"
          className={`absolute z-[70] min-w-[236px] max-h-[60vh] overflow-y-auto rounded-xl border border-kolo-border bg-white py-1 shadow-xl ${
            poravnaj === "desno" ? "right-0" : "left-0"
          } ${nagore ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {jezici.map((j) => {
            const izabran = j.kod === trenutni;
            return (
              <button
                key={j.kod}
                type="button"
                role="option"
                aria-selected={izabran}
                onClick={() => promeniJezik(j.kod)}
                className={`flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm transition-colors hover:bg-kolo-bg ${
                  izabran ? "font-semibold text-kolo-green-700" : "text-kolo-text"
                }`}
              >
                {/* Kutija je fiksna 24×18 da sve zastavice budu jednake i kad neka
                    bude nacrtana u drugom odnosu stranica. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={j.ikona}
                  alt=""
                  width={24}
                  height={18}
                  className="block h-[18px] w-6 shrink-0 rounded-[3px] object-cover"
                />
                <span className="flex-1 whitespace-nowrap">{j.naziv}</span>
                {/* Mesto za kvačicu se drži i na neizabranim redovima: inače je izabrani
                    red (podebljan + kvačica) najširi, pa mu tekst ide uz samu ivicu. */}
                <span className="w-3.5 shrink-0 flex justify-end" aria-hidden="true">
                  {izabran && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
