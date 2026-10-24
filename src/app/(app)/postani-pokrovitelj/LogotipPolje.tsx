"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import { LOGOTIP_PRIHVATA, proveriLogotip } from "@/lib/logotip-pokrovitelja-pravila";

/**
 * Polje za logotip u prijavi pokroviteljstva (novcem i dobrima i uslugama) —
 * Pravilnik o pokroviteljstvu i donacijama čl. 13 st. 4.
 *
 * Logotip je deo evidencije pokrovitelja (naziv i logotip) i prilaže se kad
 * saradnja počinje; nije obavezan. Fajl odmah ide na skladište, a prijava nosi
 * samo vraćeni URL.
 *
 * 🔴 Copy ne pominje „pravo", „promociju" ni „reklamu" — objavljivanje logotipa je
 * akt Fondacije, ne protivčinidba (čl. 13 st. 4 i 5).
 */
export default function LogotipPolje({
  url,
  onChange,
  napomena,
}: {
  url: string | null;
  onChange: (url: string | null) => void;
  napomena: string;
}) {
  const t = useTranslations("postaniPokrovitelj");
  const [salje, setSalje] = useState(false);
  const [greska, setGreska] = useState("");

  async function izaberi(fajl: File | undefined) {
    setGreska("");
    if (!fajl) return;
    const p = proveriLogotip({ tip: fajl.type, velicina: fajl.size });
    if (!p.ok) {
      setGreska(t("logotip_greska_fajl"));
      return;
    }
    setSalje(true);
    const fd = new FormData();
    fd.append("logotip", fajl);
    const res = await fetch("/api/pokroviteljstvo/logotip", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    setSalje(false);
    if (res.ok && typeof d.url === "string") onChange(d.url);
    else setGreska(d.error ?? t("logotip_greska_slanja"));
  }

  return (
    <div className="md:col-span-2 rounded-xl border border-kolo-border bg-kolo-bg p-4">
      <label className="block text-sm font-medium text-kolo-text mb-1">{t("logotip_label")}</label>
      <p className="text-xs text-kolo-muted mb-3">{napomena}</p>
      <div className="flex flex-wrap items-center gap-3">
        {url && <LogotipPokrovitelja url={url} velicina={56} />}
        <input
          type="file"
          accept={LOGOTIP_PRIHVATA}
          disabled={salje}
          onChange={(e) => {
            void izaberi(e.target.files?.[0]);
            e.target.value = "";
          }}
          className="text-sm"
        />
        {salje && <span className="text-xs text-kolo-muted">{t("logotip_saljem")}</span>}
        {url && !salje && (
          <button type="button" onClick={() => onChange(null)} className="text-xs text-kolo-muted underline">
            {t("logotip_ukloni")}
          </button>
        )}
      </div>
      {greska && <p className="mt-2 text-xs text-kolo-danger">{greska}</p>}
    </div>
  );
}
