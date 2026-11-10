"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { intlTag } from "@/lib/format";

interface Unos {
  id: string;
  naziv: string;
  iznosRSD: number;
  datum: string;
}

/**
 * Donacije pravnih lica, preduzetnika i gazdinstava čiji zastupnik nema nalog
 * (Pravilnik o pokroviteljstvu i donacijama čl. 17 st. 4, čl. 25 st. 1; set 5.1.2).
 * Superadmin posle utvrđenja prijema unosi naziv, iznos i datum; naziv i iznos idu na
 * rang-listu pokrovitelja uz oznaku „bez POEN-a“. 🔴 POEN se ne evidentira.
 */
export default function DonacijeBezNalogaRed() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [podaci, setPodaci] = useState<{ unosi: Unos[]; smeUnos: boolean } | null>(null);
  const [naziv, setNaziv] = useState("");
  const [iznos, setIznos] = useState("");
  const [datum, setDatum] = useState("");
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);

  const ucitaj = useCallback(() => {
    fetch("/api/admin/donacije-bez-naloga")
      .then((r) => (r.ok ? r.json() : null))
      .then(setPodaci)
      .catch(() => setPodaci(null));
  }, []);
  useEffect(() => ucitaj(), [ucitaj]);

  async function posalji(url: string, telo?: unknown) {
    setRadi(true);
    setPoruka(null);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: telo === undefined ? undefined : JSON.stringify(telo),
      });
      const j = await r.json().catch(() => ({}));
      setPoruka({ text: r.ok ? t("bez_naloga_uradjeno") : (j.error ?? t("greska_generalna")), ok: r.ok });
      if (r.ok) {
        setNaziv("");
        setIznos("");
        setDatum("");
        ucitaj();
      }
    } finally {
      setRadi(false);
    }
  }

  if (!podaci) return null;

  return (
    <section className="space-y-2">
      <NaslovSekcije nivo={3} opis={t("bez_naloga_opis")}>{t("bez_naloga_naslov", { n: podaci.unosi.length })}</NaslovSekcije>
      {podaci.smeUnos ? (
        <Kartica className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              className={`${KLASE_UNOSA} flex-1 min-w-48`}
              placeholder={t("bez_naloga_naziv")}
              aria-label={t("bez_naloga_naziv")}
              value={naziv}
              onChange={(e) => setNaziv(e.target.value)}
            />
            <input
              className={`${KLASE_UNOSA} w-36`}
              type="number"
              min={1}
              step="0.01"
              placeholder={t("bez_naloga_iznos")}
              aria-label={t("bez_naloga_iznos")}
              value={iznos}
              onChange={(e) => setIznos(e.target.value)}
            />
            <input
              className={`${KLASE_UNOSA} w-44`}
              type="date"
              aria-label={t("bez_naloga_datum")}
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
            />
            <Dugme
              disabled={radi || !naziv.trim() || !iznos || !datum}
              onClick={() => posalji("/api/admin/donacije-bez-naloga", { naziv, iznosRSD: Number(iznos), datum })}
            >
              {t("bez_naloga_unesi")}
            </Dugme>
          </div>
          <p className="text-xs text-kolo-muted">{t("bez_naloga_napomena")}</p>
        </Kartica>
      ) : (
        <p className="text-xs text-kolo-muted">{t("bez_naloga_samo_superadmin")}</p>
      )}
      {poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
      {podaci.unosi.length === 0 ? (
        <p className="text-sm text-kolo-muted">{t("bez_naloga_prazno")}</p>
      ) : (
        podaci.unosi.map((u) => (
          <Kartica key={u.id} className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-kolo-text">
              <span className="font-semibold">{u.naziv}</span> · {u.iznosRSD.toLocaleString(intlTag(locale))} RSD ·{" "}
              {new Date(u.datum).toLocaleDateString(intlTag(locale))}
            </p>
            {podaci.smeUnos && (
              <Dugme varijanta="sekundarno" disabled={radi} onClick={() => posalji(`/api/admin/donacije-bez-naloga/${u.id}/ukloni`)}>
                {t("bez_naloga_ukloni")}
              </Dugme>
            )}
          </Kartica>
        ))
      )}
    </section>
  );
}
