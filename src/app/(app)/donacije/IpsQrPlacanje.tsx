"use client";

import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useEffect, useState } from "react";
import { intlTag } from "@/lib/format";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";

// QR biblioteka se učitava tek kad zatreba (posle „Generiši") — van početnog
// bundle-a donacija (manje „unused JavaScript" / TBT na učitavanju stranice).
const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), {
  ssr: false,
});

interface IpsInfo {
  konfigurisan: boolean;
  racun?: string;
  primalac?: string;
  minRSD?: number;
  maxRSD?: number;
}

interface IpsRezultat {
  ipsString: string;
  racun: string;
  primalac: string;
  svrha: string;
  iznosRSD: number;
  model: string;
  pozivNaBroj: string;
}

/**
 * IPS QR plaćanje donacije — instant dinarska uplata skeniranjem mobilnom
 * bankom. Generiše dinamički QR (iznos + poziv na broj). POEN se evidentira
 * tek nakon što Fondacija potvrdi priliv (kao i kod uplate na račun).
 *
 * Dok račun Fondacije nije podešen (env), GET vraća konfigurisan=false i
 * prikazuje se napomena „uskoro" — bez greške.
 */
export default function IpsQrPlacanje({ javno }: { javno: boolean }) {
  const locale = useLocale();
  const t = useTranslations("donacije");
  const [info, setInfo] = useState<IpsInfo | null>(null);
  const [iznos, setIznos] = useState("");
  const [loading, setLoading] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [rezultat, setRezultat] = useState<IpsRezultat | null>(null);

  useEffect(() => {
    fetch("/api/donacije/ips")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ konfigurisan: false }));
  }, []);

  async function generisi() {
    setGreska(null);
    const n = Math.round(Number(iznos));
    const min = info?.minRSD ?? 100;
    if (!Number.isFinite(n) || n < min) {
      setGreska(t("ips_min_iznos", { min: min.toLocaleString(intlTag(locale)) }));
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/donacije/ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iznosRSD: n, javno }),
      });
      const j = await r.json();
      if (!r.ok) {
        setGreska(j.error ?? t("ips_greska"));
        return;
      }
      setRezultat(j as IpsRezultat);
    } catch {
      setGreska(t("karticno_greska_komunikacije"));
    } finally {
      setLoading(false);
    }
  }

  if (!info) return null; // tih dok se učitava info

  return (
    <Kartica className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-kolo-text">{t("ips_naslov")}</p>
        <p className="text-xs text-kolo-muted mt-0.5">{t("ips_opis")}</p>
      </div>

      {!rezultat ? (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="numeric"
                min={info.minRSD ?? 100}
                step={100}
                value={iznos}
                onChange={(e) => setIznos(e.target.value)}
                placeholder={t("karticno_iznos_placeholder")}
                aria-label={t("karticno_iznos_placeholder")}
                className={`${KLASE_UNOSA} pr-12`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-kolo-muted">RSD</span>
            </div>
            <Dugme onClick={generisi} disabled={loading || !info.konfigurisan} className="min-h-11">
              {loading ? t("ips_generisem") : t("ips_generisi")}
            </Dugme>
          </div>
          {/* Račun još nije otvoren/podešen → forma je pripremljena, dugme neaktivno. */}
          {!info.konfigurisan && (
            <Obavestenje vrsta="upozorenje">{t("ips_uskoro")}</Obavestenje>
          )}
          {info.konfigurisan && info.maxRSD && (
            <p className="text-xs text-kolo-muted">
              {t("ips_limit", { max: info.maxRSD.toLocaleString(intlTag(locale)) })}
            </p>
          )}
          {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
        </>
      ) : (
        <div className="space-y-4">
          {/* QR kod */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-kartica bg-white p-3 border border-kolo-border">
              <QRCodeSVG value={rezultat.ipsString} size={208} level="M" />
            </div>
            <p className="text-xs text-kolo-muted text-center max-w-xs">{t("ips_skeniraj_uputstvo")}</p>
          </div>

          {/* Detalji uplate (i za ručni unos ako QR ne radi) */}
          <div className="space-y-2 text-sm border-t border-kolo-border pt-4">
            <div className="flex justify-between">
              <span className="text-kolo-muted">{t("primalac")}</span>
              <span className="font-medium text-kolo-text text-right">{rezultat.primalac}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kolo-muted">{t("racun")}</span>
              <span className="font-mono text-kolo-text">{rezultat.racun}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kolo-muted">{t("ips_iznos_label")}</span>
              <span className="font-semibold text-kolo-text">{rezultat.iznosRSD.toLocaleString(intlTag(locale))} RSD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kolo-muted">{t("ips_poziv_na_broj")}</span>
              <span className="font-mono text-kolo-text">
                {t("ips_model")} {rezultat.model} · {rezultat.pozivNaBroj}
              </span>
            </div>
          </div>

          <Obavestenje vrsta="info">{t("ips_napomena_potvrda")}</Obavestenje>

          <Dugme
            varijanta="sekundarno"
            punaSirina
            onClick={() => {
              setRezultat(null);
              setIznos("");
            }}
          >
            {t("ips_novi")}
          </Dugme>
        </div>
      )}
    </Kartica>
  );
}
