"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

export interface Notifikacija {
  id: string;
  tip: string;
  naslov: string;
  tekst: string;
  procitana: boolean;
  link: string | null;
  createdAt: string;
}

export interface DnevniBrojevi {
  pocetna: number;
  novcanik: number;
  pijaca: number;
  adminCekanje: number;
}

export interface MeData {
  balance: number;
  avatar: string | null;
  neprocitanoPoruke: number;
  notifikacije: Notifikacija[];
  notifNeprocitano: number;
  dnevniBrojevi: DnevniBrojevi | null;
  nadzorBroj: number;
  politikaPotrebno: boolean;
  /** Maloletni korisnik (Modul Deca) — navigacija je kraća. */
  maloletan?: boolean;
  /**
   * Stanje naloga maloletnog korisnika (Modul Deca, čl. 4c). `null` kod punoletnog.
   * Zamenilo je raniji `mirovanje` — nije više dva stanja nego tri, i „na čekanju"
   * i „povezano" nose različita ograničenja.
   */
  stanjeDeteta?: "NA_CEKANJU" | "POVEZANO" | "AKTIVNO" | null;
}

export const ME_KEY = ["me"] as const;

async function dohvatiMe(): Promise<MeData> {
  // `no-store`: sadržaj je po korisniku i menja se stalno (balans, badge-evi,
  // pristanak na akte). Keširan odgovor bi vraćao tuđe/zastarelo stanje —
  // npr. „potreban je pristanak" čoveku koji je već pristao.
  const res = await fetch("/api/me", { cache: "no-store" });
  if (!res.ok) throw new Error("Greška pri dohvatanju /api/me");
  return res.json();
}

/**
 * Jedinstveni izvor podataka za „chrome" (Header + Sidebar), keširan kroz React
 * Query. Sve komponente koje pozovu `useMe()` dele ISTU keširanu query instancu
 * (React Query deduplikuje po `ME_KEY`) — umesto ranijih ~6 nezavisnih fetch-eva
 * po navigaciji. Polling na 30s; React Query ga automatski pauzira kada tab nije
 * vidljiv (refetchIntervalInBackground = false po defaultu).
 */
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: dohvatiMe,
    refetchInterval: 30_000,
  });
}

/**
 * Most ka postojećim window event-ima app-a: kada se negde emituje
 * `balans-updated` / `avatar-updated` / `poruke-procitane`, invalidiraj keš
 * `['me']` da se chrome odmah osveži. Montirati jednom (npr. u AppShell).
 */
export function useMeEventBridge() {
  const qc = useQueryClient();
  useEffect(() => {
    const invalidiraj = () => qc.invalidateQueries({ queryKey: ME_KEY });
    window.addEventListener("balans-updated", invalidiraj);
    window.addEventListener("avatar-updated", invalidiraj);
    window.addEventListener("poruke-procitane", invalidiraj);
    return () => {
      window.removeEventListener("balans-updated", invalidiraj);
      window.removeEventListener("avatar-updated", invalidiraj);
      window.removeEventListener("poruke-procitane", invalidiraj);
    };
  }, [qc]);
}

/**
 * Optimistički lokalni patch keša `['me']` (npr. badge na 0 pre potvrde servera).
 *
 * 🔴 `useCallback` NIJE ukras: bez njega se pri svakom iscrtavanju vraća NOVA
 * funkcija. Ko je stavi u zavisnosti nekog `useCallback`/`useEffect`-a dobija
 * efekat koji se okida u krug. Tako je 11.08.2026 ekran za pristanak zvao
 * `/api/politika/prihvati` 3488 puta za tri sata i vidljivo treperio.
 */
export function useMePatch() {
  const qc = useQueryClient();
  return useCallback(
    (delta: Partial<MeData>) =>
      qc.setQueryData<MeData>(ME_KEY, (prev) => (prev ? { ...prev, ...delta } : prev)),
    [qc],
  );
}
