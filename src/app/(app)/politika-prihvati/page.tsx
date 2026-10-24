"use client";

import { useRouter } from "next/navigation";
import PolitikaPristanak from "@/components/PolitikaPristanak";

/**
 * /politika-prihvati — stranica sa ekranom za pristanak na nove akte.
 *
 * Redovan put od 11.08.2026 IDE MIMO ove stranice: `AppShell` prikazuje isti
 * ekran kao prekrivač, bez promene rute (vidi `PolitikaPristanak`). Stranica
 * ostaje zbog linkova zapisanih ranije — u notifikacijama (`/api/admin/politika`)
 * i mejlovima — i zbog onih koji je otvore direktno.
 */

/**
 * Nakon prihvatanja politike: novog korisnika (sveža registracija postavlja flag)
 * vodimo na welcome onboarding, postojećeg korisnika na /sistem.
 */
function odredisteNakonPristanka(): string {
  try {
    if (sessionStorage.getItem("kolo-welcome") === "1") return "/dobrodosli";
  } catch { /* sessionStorage nedostupan */ }
  return "/sistem";
}

export default function PolitikaPrihvatiPage() {
  const router = useRouter();
  return (
    <PolitikaPristanak
      kaoStranica
      onGotovo={() => router.replace(odredisteNakonPristanka())}
    />
  );
}
