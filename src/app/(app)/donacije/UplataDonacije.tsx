"use client";

import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Segmenti from "@/components/ui/Segmenti";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useState } from "react";
import { intlTag } from "@/lib/format";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { PONUDJENI_IZNOSI_RSD, MIN_DONACIJA_RSD } from "@/lib/donacija-unapred-pravila";
import { prikazPozivNaBroj } from "@/lib/placanje/ips-qr";
import { dogadjaj } from "@/lib/analitika";
import PosaljiPotvrdu from "./PosaljiPotvrdu";

// QR biblioteka se učitava tek kad zatreba — van početnog bundle-a donacija.
const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), { ssr: false });

interface Najava {
  donationId: string;
  ipsString: string | null;
  racun: string;
  primalac: string | null;
  svrha: string;
  iznosRSD: number;
  model: string;
  pozivNaBroj: string;
}

function formatRacun(racun: string): string {
  const c = racun.replace(/\D/g, "");
  return c.length === 18 ? `${c.slice(0, 3)}-${c.slice(3, 16)}-${c.slice(16)}` : racun;
}

/**
 * Uplata donacije (Pravilnik o pokroviteljstvu i donacijama čl. 3, 4 i 6; set 5.0.9).
 * 1) iznos (ponuđeni ili drugi, najmanje 1.000 RSD); 2) podaci za uplatu sa POSEBNIM
 *    pozivom na broj — IPS QR kod ili nalog za prenos sa računa; 3) potvrda o uplati.
 * Kartice nema, a ni uplate gotovinom (čl. 4 st. 1). Uz iznos ne stoji ni nivo ni broj
 * POEN-a (pravilo A — bez podsticaja).
 */
export default function UplataDonacije({ javno, unapredOtvoren, onPromena }: { javno: boolean; unapredOtvoren: boolean; onPromena: () => void }) {
  const locale = useLocale();
  const t = useTranslations("donacije");
  const [izbor, setIzbor] = useState<number | "drugi" | null>(null);
  const [drugi, setDrugi] = useState("");
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [najava, setNajava] = useState<Najava | null>(null);
  const [nacin, setNacin] = useState<"ips" | "nalog">("ips");
  const [kopirano, setKopirano] = useState(false);

  const iznos = izbor === "drugi" ? Math.round(Number(drugi)) : izbor;

  async function nastavi() {
    setGreska(null);
    if (!iznos || !Number.isFinite(iznos) || iznos < MIN_DONACIJA_RSD) {
      setGreska(t("min_iznos", { min: MIN_DONACIJA_RSD.toLocaleString(intlTag(locale)) }));
      return;
    }
    setRadi(true);
    try {
      const r = await fetch("/api/donacije/ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iznosRSD: iznos, javno }),
      });
      const j = await r.json();
      if (!r.ok) {
        setGreska(j.error ?? t("ips_greska"));
        return;
      }
      const n = j as Najava;
      setNajava(n);
      setNacin(n.ipsString ? "ips" : "nalog");
      // Bez iznosa i bez javnosti donacije.
      dogadjaj("donacija_zapoceta", { kanal: "racun" });
    } catch {
      setGreska(t("greska_komunikacije"));
    } finally {
      setRadi(false);
    }
  }

  function kopiraj() {
    if (!najava) return;
    const tekst = t("kopiraj_tekst_donacija", {
      racun: formatRacun(najava.racun),
      poziv: prikazPozivNaBroj(najava.pozivNaBroj),
      iznos: najava.iznosRSD.toLocaleString(intlTag(locale)),
    });
    navigator.clipboard.writeText(tekst).then(() => {
      setKopirano(true);
      setTimeout(() => setKopirano(false), 2000);
    });
  }

  if (!najava) {
    return (
      <Kartica className="space-y-4">
        <NaslovSekcije nivo={3} opis={t("iznos_opis")}>{t("iznos_naslov")}</NaslovSekcije>
        <div className="grid grid-cols-3 gap-2">
          {PONUDJENI_IZNOSI_RSD.map((n) => (
            <Dugme key={n} varijanta={izbor === n ? "primarno" : "sekundarno"} onClick={() => setIzbor(n)} className="min-h-11">
              {n.toLocaleString(intlTag(locale))}
            </Dugme>
          ))}
        </div>
        <Dugme varijanta={izbor === "drugi" ? "primarno" : "sekundarno"} punaSirina onClick={() => setIzbor("drugi")}>
          {t("drugi_iznos")}
        </Dugme>
        {izbor === "drugi" && (
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={MIN_DONACIJA_RSD}
              step={100}
              value={drugi}
              onChange={(e) => setDrugi(e.target.value)}
              placeholder={t("iznos_placeholder", { min: MIN_DONACIJA_RSD.toLocaleString(intlTag(locale)) })}
              aria-label={t("drugi_iznos")}
              className={`${KLASE_UNOSA} pr-12`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-kolo-muted">RSD</span>
          </div>
        )}
        <Dugme punaSirina onClick={nastavi} disabled={radi || izbor === null}>
          {radi ? t("ips_generisem") : t("nastavi")}
        </Dugme>
        {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      </Kartica>
    );
  }

  return (
    <Kartica className="space-y-4">
      <Segmenti
        oznaka={t("nacin_oznaka")}
        punaSirina
        vrednost={nacin}
        onPromena={setNacin}
        opcije={[
          ...(najava.ipsString ? [{ vrednost: "ips" as const, oznaka: t("nacin_ips") }] : []),
          { vrednost: "nalog" as const, oznaka: t("nacin_nalog") },
        ]}
      />

      {nacin === "ips" && najava.ipsString && (
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-kartica bg-white p-3 border border-kolo-border">
            <QRCodeSVG value={najava.ipsString} size={208} level="M" />
          </div>
          <p className="text-xs text-kolo-muted text-center max-w-xs">{t("ips_skeniraj_uputstvo")}</p>
        </div>
      )}
      {nacin === "nalog" && <p className="text-sm text-kolo-muted">{t("nalog_uputstvo")}</p>}

      <div className="space-y-2 text-sm border-t border-kolo-border pt-4">
        <div className="flex justify-between gap-3">
          <span className="text-kolo-muted">{t("primalac")}</span>
          <span className="font-medium text-kolo-text text-right">{najava.primalac ?? t("primalac_vrednost")}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-kolo-muted">{t("racun")}</span>
          <span className="font-mono text-kolo-text">{formatRacun(najava.racun)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-kolo-muted">{t("ips_iznos_label")}</span>
          <span className="font-semibold text-kolo-text">{najava.iznosRSD.toLocaleString(intlTag(locale))} RSD</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-kolo-muted">{t("svrha")}</span>
          <span className="font-medium text-kolo-text">{t("svrha_vrednost")}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-kolo-muted">{t("ips_poziv_na_broj")}</span>
          <span className="font-mono font-semibold text-kolo-green-700">
            {t("ips_model")} {najava.model} · {prikazPozivNaBroj(najava.pozivNaBroj)}
          </span>
        </div>
      </div>
      <Obavestenje vrsta="info">{t("poziv_ne_menjaj")}</Obavestenje>
      {nacin === "nalog" && (
        <Dugme varijanta="sekundarno" punaSirina onClick={kopiraj}>
          {kopirano ? t("kopirano") : t("kopiraj_btn")}
        </Dugme>
      )}

      <div className="space-y-2 border-t border-kolo-border pt-4">
        <NaslovSekcije nivo={3} opis={javno ? t(unapredOtvoren ? "posle_uplate_unapred" : "posle_uplate_prva") : t("posle_uplate_anonimna")}>
          {t("posle_uplate_naslov")}
        </NaslovSekcije>
        <PosaljiPotvrdu donationId={najava.donationId} onGotovo={onPromena} />
      </div>

      <Dugme
        varijanta="tiho"
        punaSirina
        onClick={() => {
          setNajava(null);
          setIzbor(null);
          setDrugi("");
        }}
      >
        {t("ips_novi")}
      </Dugme>
    </Kartica>
  );
}
