"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { useDijalog } from "@/components/ui/Dijalog";

/**
 * Logotip pokrovitelja u pregledu administratorskog tima (donacije čl. 26 st. 2).
 *
 * 🔴 Moderacija je samo UKLANJANJE, uz obavezan razlog — nikad prepravka ni
 * postavljanje logotipa umesto pokrovitelja (isto pravilo kao za oglase).
 * Uklanjanje skida isti logotip i sa reda pokrovitelja i sa ugovora.
 */
export default function AdminLogotip({
  izvor,
  id,
  url,
  onUklonjen,
}: {
  izvor: "PRIJAVA" | "POKROVITELJ" | "UGOVOR_DOBRA" | "UPIS";
  id: string;
  url: string | null;
  onUklonjen: () => void;
}) {
  const t = useTranslations("admin");
  const [radi, setRadi] = useState(false);
  const { dijalog, unesi, obavesti } = useDijalog();
  if (!url) return null;

  async function ukloni() {
    const razlog = await unesi({ poruka: t("logotip_ukloni_razlog_prompt"), opasno: true, dugme: t("logotip_ukloni_btn") });
    if (razlog === null || razlog.trim().length < 3) return;
    setRadi(true);
    const res = await fetch("/api/admin/pokroviteljstvo/logotip/ukloni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ izvor, id, razlog: razlog.trim() }),
    });
    const d = await res.json().catch(() => ({}));
    setRadi(false);
    if (res.ok) onUklonjen();
    else await obavesti(d.error ?? t("greska_generalna"));
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      {dijalog}
      <LogotipPokrovitelja url={url} velicina={48} />
      <span className="text-xs text-kolo-muted">{t("logotip_oznaka")}</span>
      <button
        type="button"
        onClick={ukloni}
        disabled={radi}
        className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}
      >
        {t("logotip_ukloni_btn")}
      </button>
    </div>
  );
}
