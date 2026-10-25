"use client";

/**
 * Kutija želja — Admin (whitepaper 5.0, pogl. 7; odluka vlasnika 25.10.2026).
 *
 * Fondacija svaki predlog deteta pregleda PRE prikaza: prikazuje ga drugoj deci ili
 * ga odbija uz razlog koji se detetu prikazuje (jednostavnim jezikom). Predlog se
 * ne prepravlja — ako ima lični podatak ili neprimeren sadržaj, odbija se, a dete
 * može da pošalje nov. Na prikazane predloge, redom po broju podrški, Fondacija
 * odgovara obrazloženo: šta će uraditi, šta neće i zašto.
 *
 * 🔴 Autor se ni ovde ne vidi — server ga ne šalje.
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import { ODGOVOR_MAX, RAZLOG_MAX } from "@/lib/kutija-zelja-pravila";

type Zelja = {
  id: string;
  tekst: string;
  stanje: "NA_PREGLEDU" | "PRIKAZAN" | "ODBIJEN" | "ODGOVOREN";
  brojPodrski: number;
  razlogOdbijanja: string | null;
  odgovor: { tekst: string; datum: string } | null;
  datum: string;
};

type Podaci = { naPregledu: Zelja[]; prikazani: Zelja[]; odgovoreni: Zelja[]; odbijeni: Zelja[] };

export default function KutijaZeljaTab({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("admin");
  const [podaci, setPodaci] = useState<Podaci | null>(null);
  const [tekstovi, setTekstovi] = useState<Record<string, string>>({});
  const [radi, setRadi] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  const ucitaj = useCallback(async () => {
    const r = await fetch("/api/admin/kutija-zelja", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    setPodaci(r.ok ? d : { naPregledu: [], prikazani: [], odgovoreni: [], odbijeni: [] });
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  const odluci = async (id: string, radnja: "PRIKAZI" | "ODBIJ" | "ODGOVORI") => {
    setRadi(id);
    setGreska(null);
    const r = await fetch(`/api/admin/kutija-zelja/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ radnja, tekst: tekstovi[id] ?? "" }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setGreska(d.error ?? t("kutija_greska"));
    else setTekstovi((s) => ({ ...s, [id]: "" }));
    setRadi(null);
    await ucitaj();
    onDone?.();
  };

  const polje = (id: string, oznaka: string, max: number) => (
    <textarea
      value={tekstovi[id] ?? ""}
      onChange={(e) => setTekstovi((s) => ({ ...s, [id]: e.target.value }))}
      rows={3}
      maxLength={max}
      placeholder={oznaka}
      aria-label={oznaka}
      className={KLASE_UNOSA + " mt-2"}
    />
  );

  const datum = (iso: string) => new Date(iso).toLocaleDateString("sr-RS");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-kolo-text">{t("kutija_naslov")}</h2>
        <p className="mt-1 text-sm text-kolo-muted">{t("kutija_opis")}</p>
      </div>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      {podaci === null ? (
        <p className="text-sm text-kolo-muted">{t("kutija_ucitavanje")}</p>
      ) : (
        <>
          <div className="space-y-3">
            <h3 className="font-semibold text-kolo-text">{t("kutija_na_pregledu", { broj: podaci.naPregledu.length })}</h3>
            <p className="text-sm text-kolo-muted">{t("kutija_pregled_uputstvo")}</p>
            {podaci.naPregledu.length === 0 && <p className="text-sm text-kolo-muted">{t("kutija_prazno")}</p>}
            {podaci.naPregledu.map((z) => (
              <Kartica key={z.id}>
                <p className="text-xs text-kolo-muted">{datum(z.datum)}</p>
                <p className="mt-1 whitespace-pre-wrap rounded-kontrola bg-kolo-bg p-3 text-sm text-kolo-text">{z.tekst}</p>
                {polje(z.id, t("kutija_razlog_polje"), RAZLOG_MAX)}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={radi !== null}
                    onClick={() => odluci(z.id, "PRIKAZI")}
                    className={klaseDugmeta({ varijanta: "primarno", velicina: "md" })}
                  >
                    {t("kutija_prikazi")}
                  </button>
                  <button
                    type="button"
                    disabled={radi !== null}
                    onClick={() => odluci(z.id, "ODBIJ")}
                    className={klaseDugmeta({ varijanta: "opasno", velicina: "md" })}
                  >
                    {t("kutija_odbij")}
                  </button>
                </div>
              </Kartica>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-kolo-text">{t("kutija_prikazani", { broj: podaci.prikazani.length })}</h3>
            <p className="text-sm text-kolo-muted">{t("kutija_odgovor_uputstvo")}</p>
            {podaci.prikazani.length === 0 && <p className="text-sm text-kolo-muted">{t("kutija_prazno")}</p>}
            {podaci.prikazani.map((z) => (
              <Kartica key={z.id}>
                <p className="text-xs text-kolo-muted">
                  {t("kutija_podrski", { broj: z.brojPodrski })} · {datum(z.datum)}
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded-kontrola bg-kolo-bg p-3 text-sm text-kolo-text">{z.tekst}</p>
                {polje(z.id, t("kutija_odgovor_polje"), ODGOVOR_MAX)}
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={radi !== null}
                    onClick={() => odluci(z.id, "ODGOVORI")}
                    className={klaseDugmeta({ varijanta: "primarno", velicina: "md" })}
                  >
                    {t("kutija_odgovori")}
                  </button>
                </div>
              </Kartica>
            ))}
          </div>

          {podaci.odgovoreni.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-kolo-text">{t("kutija_odgovoreni", { broj: podaci.odgovoreni.length })}</h3>
              {podaci.odgovoreni.map((z) => (
                <Kartica key={z.id}>
                  <p className="text-xs text-kolo-muted">{t("kutija_podrski", { broj: z.brojPodrski })}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-kolo-text">{z.tekst}</p>
                  {z.odgovor && (
                    <p className="mt-2 whitespace-pre-wrap rounded-kontrola bg-kolo-bg p-3 text-sm text-kolo-text">
                      {z.odgovor.tekst}
                    </p>
                  )}
                </Kartica>
              ))}
            </div>
          )}

          {podaci.odbijeni.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-kolo-text">{t("kutija_odbijeni", { broj: podaci.odbijeni.length })}</h3>
              {podaci.odbijeni.map((z) => (
                <Kartica key={z.id}>
                  <p className="whitespace-pre-wrap text-sm text-kolo-text">{z.tekst}</p>
                  {z.razlogOdbijanja && (
                    <p className="mt-2 text-sm text-kolo-muted">{t("kutija_razlog", { razlog: z.razlogOdbijanja })}</p>
                  )}
                </Kartica>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
