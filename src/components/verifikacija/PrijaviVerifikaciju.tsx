"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Dugme from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";

/**
 * Diskretna prijava: „nešto nije u redu sa mojom verifikacijom".
 * Šalje /api/verifikacija/prijavi → upisuje RizikNalaz (OTVOREN) u Nadzor i javi
 * superadminu. Bez automatske radnje — korektiv je čovek.
 */
export default function PrijaviVerifikaciju() {
  const t = useTranslations("verifikacija");
  const [otvoreno, setOtvoreno] = useState(false);
  const [razlog, setRazlog] = useState("");
  const [radnja, setRadnja] = useState(false);
  const [poslato, setPoslato] = useState(false);

  async function posalji() {
    setRadnja(true);
    const res = await fetch("/api/verifikacija/prijavi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razlog: razlog.trim() || undefined }),
    });
    setRadnja(false);
    if (res.ok) {
      setPoslato(true);
      setOtvoreno(false);
      setRazlog("");
    }
  }

  if (poslato) {
    return (
      <p className="text-xs text-kolo-green-700 mt-2">{t("prijava_poslata")}</p>
    );
  }

  if (!otvoreno) {
    return (
      <button
        onClick={() => setOtvoreno(true)}
        className="inline-flex min-h-10 items-center text-xs text-kolo-muted underline hover:text-kolo-text mt-2"
      >
        {t("prijava_link")}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={razlog}
        onChange={(e) => setRazlog(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder={t("prijava_placeholder")}
        aria-label={t("prijava_placeholder")}
        className={KLASE_UNOSA + " resize-none"}
      />
      <div className="flex gap-2">
        <Dugme varijanta="sekundarno" velicina="sm" onClick={posalji} disabled={radnja}>
          {radnja ? "..." : t("prijava_dugme")}
        </Dugme>
        <Dugme varijanta="tiho" velicina="sm" onClick={() => { setOtvoreno(false); setRazlog(""); }} disabled={radnja}>
          {t("dugme_otkazi")}
        </Dugme>
      </div>
    </div>
  );
}
