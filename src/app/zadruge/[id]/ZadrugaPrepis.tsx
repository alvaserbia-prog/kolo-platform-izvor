"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { OSNOVI_U_ZAPIS, MAX_OPIS, type OsnovUZapis } from "@/lib/zadruga-pravila";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

/**
 * Zadrugar prepisuje POEN u zapis svoje zadruge, uvek uz osnov (Pravilnik o
 * zadrugama čl. 11): izdato dobro, korišćenje opreme, usluga zadruge. Broj POEN-a
 * određuje zadruga (čl. 14) — zadrugar ga ovde upisuje onako kako ga je zadruga
 * odredila; ekran ne predlaže iznos.
 */
export default function ZadrugaPrepis({ zadrugaId }: { zadrugaId: string }) {
  const t = useTranslations("zadruge");
  const router = useRouter();
  const [osnov, setOsnov] = useState<OsnovUZapis>("IZDAVANJE");
  const [iznos, setIznos] = useState("");
  const [opis, setOpis] = useState("");
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState(false);

  async function posalji() {
    setRadi(true);
    setGreska(null);
    setUspeh(false);
    try {
      const res = await fetch(`/api/zadruge/${zadrugaId}/zapis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ osnov, iznos, opis }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.greska ?? d.error ?? t("greska"));
        return;
      }
      setIznos("");
      setOpis("");
      setUspeh(true);
      router.refresh();
    } finally {
      setRadi(false);
    }
  }

  const polje = KLASE_UNOSA;
  return (
    <Kartica as="section">
      <h2 className="text-sm font-semibold">{t("prepis_naslov")}</h2>
      <p className="text-xs text-kolo-muted mt-1">{t("prepis_opis")}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <select className={polje} aria-label={t("prepis_naslov")} value={osnov} onChange={(e) => setOsnov(e.target.value as OsnovUZapis)}>
          {OSNOVI_U_ZAPIS.map((o) => (
            <option key={o} value={o}>
              {t(`osnov_${o}`)}
            </option>
          ))}
        </select>
        <input className={polje} inputMode="numeric" placeholder={t("prepis_iznos")} aria-label={t("prepis_iznos")} value={iznos}
          onChange={(e) => setIznos(e.target.value)} />
        <input className={polje} placeholder={t("prepis_opis_polje")} aria-label={t("prepis_opis_polje")} value={opis} maxLength={MAX_OPIS}
          onChange={(e) => setOpis(e.target.value)} />
      </div>
      {greska && <Obavestenje vrsta="greska" className="mt-2">{greska}</Obavestenje>}
      {uspeh && <Obavestenje vrsta="uspeh" className="mt-2">{t("prepis_uspeh")}</Obavestenje>}
      <Dugme className="mt-3" onClick={posalji} disabled={radi || !iznos}>
        {t("prepis_dugme")}
      </Dugme>
    </Kartica>
  );
}
