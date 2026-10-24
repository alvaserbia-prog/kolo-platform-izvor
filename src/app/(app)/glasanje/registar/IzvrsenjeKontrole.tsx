"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

/**
 * Kontrole Upravnog odbora nad usvojenom odlukom koja čeka sprovođenje (čl. 51
 * Pravilnika, čl. 17 Gornjeg Kola).
 *
 * 🔴 Tri različite radnje, namerno razdvojene:
 *  - „sproveo" traži OZNAKU AKTA UO — Gornje Kolo nije organ Fondacije, pa se
 *    odluka sprovodi aktom UO i taj akt mora ostati u registru;
 *  - „ne sprovodi" traži razlog sa ZATVORENE liste iz čl. 51 (zakon, Statut,
 *    van nadležnosti) uz obrazloženje;
 *  - „zaštitni veto" je zaseban institut (čl. 48) — privremen, gasi se po čl. 49.
 */
type Razlog = "ZAKON" | "STATUT" | "VAN_NADLEZNOSTI";
const RAZLOZI: Razlog[] = ["ZAKON", "STATUT", "VAN_NADLEZNOSTI"];

export default function IzvrsenjeKontrole({ id }: { id: string }) {
  const t = useTranslations("glasanje");
  const router = useRouter();
  const [radnja, setRadnja] = useState<"izvrsi" | "veto" | "odbij" | null>(null);
  const [forma, setForma] = useState<"akt" | "veto" | "odbij" | null>(null);
  const [akt, setAkt] = useState("");
  const [obrazlozenje, setObrazlozenje] = useState("");
  const [razlog, setRazlog] = useState<Razlog>("ZAKON");
  const [greska, setGreska] = useState<string | null>(null);

  function zatvori() {
    setForma(null); setAkt(""); setObrazlozenje(""); setRazlog("ZAKON");
  }

  async function posalji(put: string, telo: unknown, koja: "izvrsi" | "veto" | "odbij") {
    setRadnja(koja); setGreska(null);
    const res = await fetch(`/api/admin/glasanje/${id}/${put}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telo),
    });
    setRadnja(null);
    if (res.ok) { zatvori(); router.refresh(); }
    else setGreska((await res.json().catch(() => ({}))).error ?? t("greska_generic"));
  }

  return (
    <div className="pt-2 border-t border-kolo-border space-y-2">
      {forma === null && (
        <div className="flex flex-wrap gap-2">
          <Dugme velicina="sm" onClick={() => setForma("akt")} disabled={radnja !== null}>
            {t("oznaci_izvrseno")}
          </Dugme>
          <Dugme varijanta="sekundarno" velicina="sm" onClick={() => setForma("odbij")} disabled={radnja !== null}>
            {t("ne_sprovodi")}
          </Dugme>
          <Dugme varijanta="opasno" velicina="sm" onClick={() => setForma("veto")} disabled={radnja !== null}>
            {t("zastitni_veto")}
          </Dugme>
        </div>
      )}

      {forma === "akt" && (
        <div className="space-y-2">
          <input value={akt} onChange={(e) => setAkt(e.target.value)}
            placeholder={t("izvrsenje_akt_placeholder")}
            aria-label={t("izvrsenje_akt_placeholder")}
            className={KLASE_UNOSA} />
          <p className="text-xs text-kolo-muted">{t("izvrsenje_akt_napomena")}</p>
          <div className="flex gap-2">
            <Dugme velicina="sm" onClick={() => posalji("izvrsi", { akt: akt.trim() }, "izvrsi")}
              disabled={radnja !== null || akt.trim().length < 3}>
              {radnja === "izvrsi" ? "..." : t("potvrdi_izvrseno")}
            </Dugme>
            <Dugme varijanta="tiho" velicina="sm" onClick={zatvori}>
              {t("otkazi_veto")}
            </Dugme>
          </div>
        </div>
      )}

      {forma === "odbij" && (
        <div className="space-y-2">
          <select value={razlog} onChange={(e) => setRazlog(e.target.value as Razlog)}
            aria-label={t("ne_sprovodi")}
            className={KLASE_UNOSA}>
            {RAZLOZI.map((r) => (
              <option key={r} value={r}>{t(`odbijanje_razlog_${r.toLowerCase()}`)}</option>
            ))}
          </select>
          <textarea rows={2} value={obrazlozenje} onChange={(e) => setObrazlozenje(e.target.value)}
            placeholder={t("odbijanje_obrazlozenje_placeholder")}
            aria-label={t("odbijanje_obrazlozenje_placeholder")}
            className={`${KLASE_UNOSA} resize-none`} />
          <div className="flex gap-2">
            <Dugme varijanta="sekundarno" velicina="sm" onClick={() => posalji("ne-sprovedi", { razlog, obrazlozenje: obrazlozenje.trim() }, "odbij")}
              disabled={radnja !== null || obrazlozenje.trim().length < 10}>
              {radnja === "odbij" ? "..." : t("potvrdi_ne_sprovodi")}
            </Dugme>
            <Dugme varijanta="tiho" velicina="sm" onClick={zatvori}>
              {t("otkazi_veto")}
            </Dugme>
          </div>
        </div>
      )}

      {forma === "veto" && (
        <div className="space-y-2">
          <textarea rows={2} value={obrazlozenje} onChange={(e) => setObrazlozenje(e.target.value)}
            placeholder={t("veto_obrazlozenje_placeholder")}
            aria-label={t("veto_obrazlozenje_placeholder")}
            className={`${KLASE_UNOSA} resize-none`} />
          <div className="flex gap-2">
            <Dugme varijanta="opasno" velicina="sm" onClick={() => posalji("veto", { obrazlozenje: obrazlozenje.trim() }, "veto")}
              disabled={radnja !== null || obrazlozenje.trim().length < 10}>
              {radnja === "veto" ? "..." : t("potvrdi_veto")}
            </Dugme>
            <Dugme varijanta="tiho" velicina="sm" onClick={zatvori}>
              {t("otkazi_veto")}
            </Dugme>
          </div>
        </div>
      )}

      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
    </div>
  );
}
