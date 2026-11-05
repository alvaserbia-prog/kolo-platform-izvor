"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { intlTag } from "@/lib/format";

interface NaProveri {
  id: string;
  pseudonim: string;
  amountRSD: number;
  poenEmitted: number;
  pozivNaBroj: string | null;
  evidentiranoAt: string;
  rokDo: string;
  donatorIme: string | null;
  procitano: { iznosRSD: number | null; datum: string | null; racun: string | null; poziv: string | null; platilac: string | null };
  imaPotvrdu: boolean;
}

interface Ogranicenje {
  id: string;
  pseudonim: string;
  maloletan: boolean;
  donatorPseudonim: string;
  primljeno: number;
  iznos: number;
  rokDo: string;
}

/**
 * Red za proveru donacija unapred i ograničenja primljenog iznosa (Pravilnik o
 * pokroviteljstvu i donacijama čl. 6 st. 6–8, set 5.0.9). Rok za proveru je 24 časa
 * i važi vikendom; red je sortiran po roku, a istekao ili blizak rok se ističe.
 * Odluku o ograničenju (otpis primaocu koji je znao) donosi samo superadmin.
 */
export default function DonacijeUnapredRed() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [podaci, setPodaci] = useState<{ naProveri: NaProveri[]; ogranicenja: Ogranicenje[]; smeOdlukuOgranicenja: boolean } | null>(null);
  const [uplatioci, setUplatioci] = useState<Record<string, string>>({});
  const [razlozi, setRazlozi] = useState<Record<string, string>>({});
  const [sumnje, setSumnje] = useState<Record<string, boolean>>({});
  const [poruke, setPoruke] = useState<Record<string, { text: string; ok: boolean }>>({});
  const [radi, setRadi] = useState<string | null>(null);

  const ucitaj = useCallback(() => {
    fetch("/api/admin/donacije-unapred")
      .then((r) => (r.ok ? r.json() : null))
      .then(setPodaci)
      .catch(() => setPodaci(null));
  }, []);
  useEffect(() => ucitaj(), [ucitaj]);

  async function posalji(id: string, url: string, telo: unknown) {
    setRadi(id);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(telo) });
      const j = await r.json().catch(() => ({}));
      setPoruke((p) => ({ ...p, [id]: { text: r.ok ? t("unapred_uradjeno") : (j.error ?? t("unapred_greska")), ok: r.ok } }));
      if (r.ok) ucitaj();
    } finally {
      setRadi(null);
    }
  }

  if (!podaci) return null;
  const sada = Date.now();

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <NaslovSekcije nivo={3} opis={t("unapred_opis")}>{t("unapred_naslov", { n: podaci.naProveri.length })}</NaslovSekcije>
        {podaci.naProveri.length === 0 && <p className="text-sm text-kolo-muted">{t("unapred_prazno")}</p>}
        {podaci.naProveri.map((d) => {
          const preostalo = new Date(d.rokDo).getTime() - sada;
          const istekao = preostalo <= 0;
          const blizu = !istekao && preostalo < 6 * 3600_000;
          return (
            <Kartica key={d.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-kolo-text">
                  {d.pseudonim} · {d.amountRSD.toLocaleString(intlTag(locale))} RSD · {d.poenEmitted.toLocaleString(intlTag(locale))} POEN
                </p>
                <p className={`text-xs font-semibold ${istekao ? "text-kolo-danger" : blizu ? "text-kolo-gold-700" : "text-kolo-muted"}`}>
                  {istekao ? t("unapred_rok_istekao") : t("unapred_rok", { vreme: new Date(d.rokDo).toLocaleString(intlTag(locale)) })}
                </p>
              </div>
              <p className="text-xs text-kolo-muted">
                {t("unapred_procitano", {
                  poziv: d.pozivNaBroj ?? "—",
                  platilac: d.procitano.platilac ?? "—",
                  ime: d.donatorIme ?? "—",
                  datum: d.procitano.datum ? new Date(d.procitano.datum).toLocaleDateString(intlTag(locale)) : "—",
                })}
              </p>
              {d.imaPotvrdu && (
                <a href={`/api/admin/donacija/${d.id}/potvrda`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center text-xs font-semibold text-kolo-green-700 underline">
                  {t("unapred_pogledaj_potvrdu")}
                </a>
              )}
              <div className="flex flex-wrap gap-2">
                <input
                  className={`${KLASE_UNOSA} flex-1 min-w-40`}
                  placeholder={t("donacije_uplatilac_placeholder")}
                  aria-label={t("donacije_uplatilac_placeholder")}
                  value={uplatioci[d.id] ?? ""}
                  onChange={(e) => setUplatioci((u) => ({ ...u, [d.id]: e.target.value }))}
                />
                <Dugme
                  disabled={radi === d.id}
                  onClick={() => posalji(d.id, "/api/admin/donacija", { donationId: d.id, amountRSD: d.amountRSD, uplatilac: uplatioci[d.id] ?? "" })}
                >
                  {t("unapred_utvrdi")}
                </Dugme>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer min-h-9 inline-flex items-center text-kolo-muted">{t("unapred_ponisti_naslov")}</summary>
                <div className="mt-2 space-y-2">
                  <input
                    className={KLASE_UNOSA}
                    placeholder={t("unapred_razlog")}
                    aria-label={t("unapred_razlog")}
                    value={razlozi[d.id] ?? ""}
                    onChange={(e) => setRazlozi((r) => ({ ...r, [d.id]: e.target.value }))}
                  />
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={sumnje[d.id] ?? false} onChange={(e) => setSumnje((s) => ({ ...s, [d.id]: e.target.checked }))} className="mt-0.5" />
                    <span>{t("unapred_sumnja")}</span>
                  </label>
                  <Dugme
                    varijanta="opasno"
                    disabled={radi === d.id}
                    onClick={() => posalji(d.id, `/api/admin/donacija/${d.id}/ponisti`, { razlog: razlozi[d.id] ?? "", sumnja: sumnje[d.id] ?? false })}
                  >
                    {t("unapred_ponisti")}
                  </Dugme>
                </div>
              </details>
              {poruke[d.id] && <Obavestenje vrsta={poruke[d.id].ok ? "uspeh" : "greska"}>{poruke[d.id].text}</Obavestenje>}
            </Kartica>
          );
        })}
      </section>

      {podaci.ogranicenja.length > 0 && (
        <section className="space-y-2">
          <NaslovSekcije nivo={3} opis={t("ogranicenja_opis")}>{t("ogranicenja_naslov", { n: podaci.ogranicenja.length })}</NaslovSekcije>
          {podaci.ogranicenja.map((o) => (
            <Kartica key={o.id} className="space-y-2">
              <p className="text-sm text-kolo-text">
                {t("ogranicenje_red", {
                  pseudonim: o.pseudonim,
                  donator: o.donatorPseudonim,
                  primljeno: o.primljeno.toLocaleString(intlTag(locale)),
                  iznos: o.iznos.toLocaleString(intlTag(locale)),
                  rok: new Date(o.rokDo).toLocaleString(intlTag(locale)),
                })}
                {o.maloletan && <span className="ml-2 text-xs font-semibold text-kolo-gold-700">{t("ogranicenje_dete")}</span>}
              </p>
              {podaci.smeOdlukuOgranicenja ? (
                <div className="flex flex-wrap gap-2">
                  <input
                    className={`${KLASE_UNOSA} flex-1 min-w-40`}
                    placeholder={t("ogranicenje_obrazlozenje")}
                    aria-label={t("ogranicenje_obrazlozenje")}
                    value={razlozi[o.id] ?? ""}
                    onChange={(e) => setRazlozi((r) => ({ ...r, [o.id]: e.target.value }))}
                  />
                  <Dugme varijanta="sekundarno" disabled={radi === o.id} onClick={() => posalji(o.id, `/api/admin/ogranicenja/${o.id}`, { znao: false, obrazlozenje: razlozi[o.id] ?? "" })}>
                    {t("ogranicenje_prestaje")}
                  </Dugme>
                  <Dugme varijanta="opasno" disabled={radi === o.id} onClick={() => posalji(o.id, `/api/admin/ogranicenja/${o.id}`, { znao: true, obrazlozenje: razlozi[o.id] ?? "" })}>
                    {t("ogranicenje_otpis")}
                  </Dugme>
                </div>
              ) : (
                <p className="text-xs text-kolo-muted">{t("ogranicenje_samo_superadmin")}</p>
              )}
              {poruke[o.id] && <Obavestenje vrsta={poruke[o.id].ok ? "uspeh" : "greska"}>{poruke[o.id].text}</Obavestenje>}
            </Kartica>
          ))}
        </section>
      )}
    </div>
  );
}
