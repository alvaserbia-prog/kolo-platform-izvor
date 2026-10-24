"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Nevidljiva komponenta koja beleži posete stranica u dnevnik aktivnosti
 * (`POST /api/aktivnost`). Renderuje se u root layout-u (unutar Providers-a,
 * jer koristi sesiju) pa pokriva SVE stranice — i (app) grupu i Pijacu sa
 * sopstvenim layout-om i javne stranice.
 *
 * Šalje samo za prijavljene korisnike; gosti se nikad ne beleže. Fire-and-
 * forget — greška u beleženju ne sme da utiče na korišćenje sajta.
 */
export function AktivnostTracker() {
  const pathname = usePathname();
  const { status } = useSession();
  const poslednjaPutanja = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !pathname) return;
    if (pathname === poslednjaPutanja.current) return;
    poslednjaPutanja.current = pathname;
    fetch("/api/aktivnost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ putanja: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname, status]);

  return null;
}
