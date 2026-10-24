"use client";

import { useState } from "react";
import { intlTag } from "@/lib/format";
import { useTranslations, useLocale } from "next-intl";
import { MINIMUM_PRIJAVE_POKROVITELJSTVA } from "@/lib/donacija-pravila";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

/**
 * Prijava novčanog pokroviteljstva (Pravilnik o pokroviteljstvu i donacijama čl. 7)
 * iz odobrenog upisa: samo iznos. Ugovor se generiše iz podataka upisa (čl. 7 st.
 * 4) i potpisuje u tabu Ugovori.
 */
export default function NovcanaPrijava({ upisId, onPoslato }: { upisId: string; onPoslato: () => void }) {
  const locale = useLocale();
  const t = useTranslations("postaniPokrovitelj");
  const [vrednost, setVrednost] = useState("");
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState("");
  const minimum = MINIMUM_PRIJAVE_POKROVITELJSTVA.toLocaleString(intlTag(locale));

  async function posalji() {
    setGreska("");
    if (Number(vrednost) < MINIMUM_PRIJAVE_POKROVITELJSTVA) {
      setGreska(t("forma_minimum", { iznos: minimum }));
      return;
    }
    setRadi(true);
    const res = await fetch("/api/pokroviteljstvo/prijava", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upisId, vrednostRsd: Number(vrednost) }),
    });
    const d = await res.json().catch(() => ({}));
    setRadi(false);
    if (res.ok) onPoslato();
    else setGreska(d.error ?? t("forma_greska_slanja"));
  }

  return (
    <Kartica className="space-y-3">
      <h2 className="font-semibold text-kolo-text">{t("forma_naslov")}</h2>
      <p className="text-sm text-kolo-muted">{t("forma_opis")}</p>
      <Polje className="max-w-xs" oznaka={t("forma_vrednost_label")} pomoc={t("forma_minimum_napomena", { iznos: minimum })}>
        <input type="number" value={vrednost} onChange={(e) => setVrednost(e.target.value)}
          className={KLASE_UNOSA} />
      </Polje>
      {/* Ime iz upisa ide u evidenciju identiteta pri potvrdi prijema (čl. 7 st. 3). */}
      <p className="text-xs text-kolo-muted">{t("forma_zastupnik_napomena")}</p>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      <Dugme onClick={posalji} disabled={radi || !vrednost || Number(vrednost) <= 0}>
        {radi ? t("forma_saljem") : t("forma_podnesi")}
      </Dugme>
    </Kartica>
  );
}
