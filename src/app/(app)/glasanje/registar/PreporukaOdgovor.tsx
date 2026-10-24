"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

// Admin (UO) obrazložen odgovor na usvojenu dinarsku preporuku (čl. 20).
export default function PreporukaOdgovor({ id }: { id: string }) {
  const t = useTranslations("glasanje");
  const router = useRouter();
  const [odgovor, setOdgovor] = useState<"PRIHVACENO" | "ODBIJENO">("PRIHVACENO");
  const [obrazlozenje, setObrazlozenje] = useState("");
  const [salje, setSalje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  async function posalji() {
    setSalje(true); setGreska(null);
    const res = await fetch(`/api/admin/glasanje/${id}/odgovor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odgovor, obrazlozenje: obrazlozenje.trim() }),
    });
    setSalje(false);
    if (res.ok) router.refresh();
    else setGreska((await res.json().catch(() => ({}))).error ?? t("greska_generic"));
  }

  return (
    <div className="pt-2 border-t border-kolo-border space-y-2">
      <label htmlFor={`preporuka-odgovor-${id}`} className="block text-xs font-medium text-kolo-muted">{t("preporuka_odgovor_naslov")}</label>
      <div className="flex gap-2">
        <select id={`preporuka-odgovor-${id}`} value={odgovor} onChange={(e) => setOdgovor(e.target.value as "PRIHVACENO" | "ODBIJENO")}
          className={KLASE_UNOSA.replace("w-full", "w-auto")}>
          <option value="PRIHVACENO">{t("uo_prihvaceno")}</option>
          <option value="ODBIJENO">{t("uo_odbijeno")}</option>
        </select>
      </div>
      <textarea rows={2} value={obrazlozenje} onChange={(e) => setObrazlozenje(e.target.value)}
        placeholder={t("preporuka_obrazlozenje_placeholder")}
        aria-label={t("preporuka_obrazlozenje_placeholder")}
        className={`${KLASE_UNOSA} resize-none`} />
      <Dugme velicina="sm" onClick={posalji} disabled={salje || obrazlozenje.trim().length < 10}>
        {salje ? "..." : t("posalji_odgovor")}
      </Dugme>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
    </div>
  );
}
