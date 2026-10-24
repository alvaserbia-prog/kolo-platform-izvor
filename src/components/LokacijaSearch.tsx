"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { NASELJA_SRBIJE } from "@/lib/naselja-srbije";
import { normalizujNaselje as normalizuj, razresiNaselje } from "@/lib/naselje";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  /** Prosleđuje se polju, da ga `<label htmlFor>` (komponenta `Polje`) veže. */
  id?: string;
  "aria-describedby"?: string;
}

export default function LokacijaSearch({ value, onChange, placeholder = "npr. Sombor", className = "", id, "aria-describedby": opisano }: Props) {
  const tc = useTranslations("common");
  const [query, setQuery] = useState(value);
  const [sugestije, setSugestije] = useState<string[]>([]);
  const [showSugestije, setShowSugestije] = useState(false);
  const [aktivniIndex, setAktivniIndex] = useState(-1);
  const [greska, setGreska] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSugestije(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /**
   * Unos se zaključuje na napuštanju polja: ono što pogađa naselje iz šifarnika
   * upisuje se u KANONSKOM obliku („stanisic" → „Stanišić", „Stanišić (Sombor)"
   * → „Stanišić"), a ono što ne pogađa nijedno naselje dobija vidljivu grešku.
   * Bez ovoga je polje bilo slobodan tekst — padajuća lista je samo predlagala.
   */
  function zakljuciUnos() {
    const s = query.trim();
    if (!s) {
      setGreska(false);
      if (value !== "") onChange("");
      return;
    }
    const naselje = razresiNaselje(s);
    if (naselje) {
      setGreska(false);
      if (naselje !== query) setQuery(naselje);
      if (naselje !== value) onChange(naselje);
    } else {
      // Vrednost se NE briše — čovek vidi šta je otkucao i može da ispravi;
      // isti uslov proverava i server, pa neispravno mesto ne može da se sačuva.
      setGreska(true);
    }
  }

  function handleInput(val: string) {
    setQuery(val);
    onChange(val);
    setAktivniIndex(-1);
    setGreska(false);
    if (val.trim().length < 2) {
      setSugestije([]);
      setShowSugestije(false);
      return;
    }
    const q = normalizuj(val.trim());
    const rezultati = NASELJA_SRBIJE.filter((n) =>
      normalizuj(n).startsWith(q) ||
      normalizuj(n).includes(q)
    ).slice(0, 10);
    setSugestije(rezultati);
    setShowSugestije(true);
  }

  function odaberi(naziv: string) {
    setQuery(naziv);
    onChange(naziv);
    setSugestije([]);
    setShowSugestije(false);
    setAktivniIndex(-1);
    setGreska(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSugestije || sugestije.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const novi = Math.min(aktivniIndex + 1, sugestije.length - 1);
      setAktivniIndex(novi);
      listaRef.current?.children[novi]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const novi = Math.max(aktivniIndex - 1, 0);
      setAktivniIndex(novi);
      listaRef.current?.children[novi]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      if (aktivniIndex >= 0 && aktivniIndex < sugestije.length) {
        e.preventDefault();
        odaberi(sugestije[aktivniIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSugestije(false);
      setAktivniIndex(-1);
    }
  }

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <input
        id={id}
        aria-describedby={opisano}
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) {
            const q = normalizuj(query.trim());
            setSugestije(NASELJA_SRBIJE.filter((n) => normalizuj(n).includes(q)).slice(0, 10));
            setShowSugestije(true);
          }
        }}
        onBlur={zakljuciUnos}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showSugestije && sugestije.length > 0}
        aria-invalid={greska}
        // 16px (text-base): manji font tera iOS Safari da zumira ekran pri fokusu.
        className={`w-full px-4 py-3 rounded-xl border text-base outline-none transition-colors ${
          greska ? "border-kolo-danger/30 focus:border-kolo-danger" : "border-kolo-border focus:border-kolo-green-600"
        }`}
      />
      {showSugestije && sugestije.length > 0 && (
        <ul ref={listaRef} className="absolute z-20 left-0 right-0 mt-1 bg-white border border-kolo-border rounded-xl shadow-lg overflow-y-auto max-h-60">
          {sugestije.map((naziv, i) => (
            <li key={naziv}>
              <button
                type="button"
                onMouseDown={() => odaberi(naziv)}
                onMouseEnter={() => setAktivniIndex(i)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  i === aktivniIndex
                    ? "bg-kolo-green-100 text-kolo-green-800"
                    : "text-kolo-muted hover:bg-kolo-green-50 hover:text-kolo-green-700"
                }`}
              >
                {naziv}
              </button>
            </li>
          ))}
        </ul>
      )}
      {greska && (
        <p role="alert" className="mt-1 text-xs text-kolo-danger">
          {tc("mesto_iz_spiska")}
        </p>
      )}
    </div>
  );
}
