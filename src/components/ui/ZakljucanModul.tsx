"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { klaseDugmeta } from "./Dugme";
import { klaseKartice } from "./Kartica";

/**
 * Poruka za zaključan modul — jedan obrazac umesto žutih upozorenja ili praznog
 * ekrana (pregled 02.11.2026): jedna rečenica ko modul koristi i jedno dugme.
 *
 * 🔴 Rečenica mora tačno da odražava prava (čuvar akata): „… koristi ko je u Kolu"
 * samo gde pravo ima i član bez potvrde (vaučeri, nabavke, programi, zadruge,
 * pokroviteljstvo dobrima, upis ZRNA); gde treba član Kola ili čuvar, rečenica to
 * kaže i dugme vodi na „Kako da me potvrde". Novčano pokroviteljstvo i donacije
 * nikad nisu zaključani; dečji nalog ima sopstvenu poruku.
 */
export default function ZakljucanModul({
  poruka,
  href = "/verifikacija",
  dugme,
}: {
  poruka: ReactNode;
  href?: string;
  /** Podrazumevano „Kako da uđem u Kolo". */
  dugme?: ReactNode;
}) {
  const t = useTranslations("common");
  return (
    <div className={`${klaseKartice({ ton: "zelena", padding: "sm" })} flex flex-wrap items-center justify-between gap-3`}>
      <p className="flex min-w-0 items-start gap-2 text-sm font-medium text-kolo-text">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0 text-kolo-green-700">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <span>{poruka}</span>
      </p>
      <Link href={href} className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
        {dugme ?? t("kako_u_kolo")}
      </Link>
    </div>
  );
}
