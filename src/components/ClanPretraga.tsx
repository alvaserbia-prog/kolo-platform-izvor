"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import OznakaStatusa from "@/components/OznakaStatusa";
import type { StatusUcesnika } from "@/lib/status-ucesnika-pravila";

interface Korisnik {
  id: string;
  pseudonim: string;
  /** Status učesnika (set 4.8.2) — izvodi ga server, crta `OznakaStatusa`. */
  status: StatusUcesnika;
  location?: string | null;
}

export default function ClanPretraga() {
  const router = useRouter();
  const t = useTranslations("common");
  const [query, setQuery] = useState("");
  const [rezultati, setRezultati] = useState<Korisnik[]>([]);
  const [show, setShow] = useState(false);
  const [aktivniIndex, setAktivniIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const trazi = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setRezultati([]);
      setShow(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/korisnici/pretraga?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setRezultati(data);
        setShow(true);
        setAktivniIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    trazi(val);
  }

  function odaberi(korisnik: Korisnik) {
    setQuery("");
    setShow(false);
    setRezultati([]);
    router.push(profilHref(korisnik));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!show || rezultati.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const novi = Math.min(aktivniIndex + 1, rezultati.length - 1);
      setAktivniIndex(novi);
      listaRef.current?.children[novi]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const novi = Math.max(aktivniIndex - 1, 0);
      setAktivniIndex(novi);
      listaRef.current?.children[novi]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      if (aktivniIndex >= 0 && aktivniIndex < rezultati.length) {
        e.preventDefault();
        odaberi(rezultati[aktivniIndex]);
      }
    } else if (e.key === "Escape") {
      setShow(false);
      setAktivniIndex(-1);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("pretrazi_clanove")}
          autoComplete="off"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-kolo-border text-sm outline-none focus:border-kolo-green-600 transition-colors bg-white"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kolo-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-kolo-green-600 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {show && rezultati.length > 0 && (
        <ul
          ref={listaRef}
          className="absolute z-30 left-0 right-0 mt-1 bg-white border border-kolo-border rounded-xl shadow-lg overflow-y-auto max-h-64"
        >
          {rezultati.map((k, i) => (
            <li key={k.id}>
              <button
                type="button"
                onMouseDown={() => odaberi(k)}
                onMouseEnter={() => setAktivniIndex(i)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${
                  i === aktivniIndex
                    ? "bg-kolo-green-100 text-kolo-green-800"
                    : "hover:bg-kolo-green-50 hover:text-kolo-green-700"
                }`}
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-kolo-text truncate block"><Pseudonim>{k.pseudonim}</Pseudonim></span>
                  {k.location && (
                    <span className="text-xs text-kolo-muted">{k.location}</span>
                  )}
                </div>
                <OznakaStatusa status={k.status} className="shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {show && query.trim().length >= 2 && rezultati.length === 0 && !loading && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-kolo-border rounded-xl shadow-lg px-4 py-3 text-sm text-kolo-muted">
          Nema rezultata za &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
