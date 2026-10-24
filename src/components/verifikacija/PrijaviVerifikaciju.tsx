"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

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
        className="text-xs text-kolo-muted underline hover:text-kolo-text mt-2"
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
        className="w-full px-3 py-2 rounded-lg border border-kolo-border text-sm outline-none focus:border-kolo-green-700 resize-none transition-colors"
      />
      <div className="flex gap-2">
        <button onClick={posalji} disabled={radnja}
          className="px-3 py-1.5 rounded-lg bg-kolo-danger-light text-kolo-danger text-xs font-semibold hover:opacity-80 disabled:opacity-60 transition-opacity">
          {radnja ? "..." : t("prijava_dugme")}
        </button>
        <button onClick={() => { setOtvoreno(false); setRazlog(""); }} disabled={radnja}
          className="px-3 py-1.5 rounded-lg bg-kolo-bg border border-kolo-border text-kolo-muted text-xs font-semibold hover:bg-kolo-border disabled:opacity-60 transition-colors">
          {t("dugme_otkazi")}
        </button>
      </div>
    </div>
  );
}
