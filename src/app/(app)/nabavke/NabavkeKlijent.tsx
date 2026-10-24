"use client";

import Stranica from "@/components/ui/Stranica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Registar = { nazivId: string; naziv: string; brojKorisnika: number };
type Projekti = { godina: number; utrosenoRSD: number; brojNabavki: number };
type MojaPrijava = { nabavkaId: string; status: string; mesto: number | null };
type Nabavka = {
  id: string;
  naziv: string;
  status: string;
  poenPoDelu: number | null;
  brojDelova: number | null;
  velicinaDela: number | null;
  jedinicaMere: string | null;
  prijaveDo: string | null;
  brojPrijava: number;
  moja: MojaPrijava | null;
};

/**
 * Registar predloga i spisak nabavki.
 *
 * Predlog je JEDNA REČ iz rečnika, jedan po članu (Pravilnik o projektima i
 * kolektivnim nabavkama čl. 9). Registar se prikazuje ZBIRNO, bez pseudonima
 * (čl. 10 st. 2) — služi odlučivanju o tome šta se nabavlja, a ne uvidu u to ko
 * šta traži.
 */
export default function NabavkeKlijent() {
  const t = useTranslations("nabavke");

  const [registar, setRegistar] = useState<Registar[]>([]);
  const [nabavke, setNabavke] = useState<Nabavka[]>([]);
  const [moj, setMoj] = useState<{ naziv: string } | null>(null);
  const [projekti, setProjekti] = useState<Projekti | null>(null);
  const [unos, setUnos] = useState("");
  const [predlozi, setPredlozi] = useState<{ id: string; naziv: string }[]>([]);
  const [ucitava, setUcitava] = useState(true);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ucitaj = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch("/api/nabavke", { cache: "no-store" }),
        fetch("/api/nabavke/predlog", { cache: "no-store" }),
      ]);
      if (a.ok) {
        const d = await a.json();
        setRegistar(d.registar ?? []);
        setNabavke(d.nabavke ?? []);
        setProjekti(d.projekti ?? null);
      }
      if (b.ok) {
        const d = await b.json();
        setMoj(d.predlog ? { naziv: d.predlog.naziv } : null);
      }
    } finally {
      setUcitava(false);
    }
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  // Rečnik ide RUTOM, ne spiskom u paketu: raste sa svakim novim nazivom, a treba
  // samo onome ko upravo bira. Isti razlog kao pretraga škola.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (unos.trim().length < 2) {
      setPredlozi([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/nabavke/nazivi?q=${encodeURIComponent(unos)}`, { cache: "no-store" });
      if (res.ok) setPredlozi((await res.json()).nazivi ?? []);
    }, 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [unos]);

  async function sacuvaj(naziv: string) {
    setRadi(true);
    setGreska(null);
    setPoruka(null);
    try {
      const res = await fetch("/api/nabavke/predlog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naziv }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.greska ?? d.error ?? t("greska_upis"));
        return;
      }
      setUnos("");
      setPredlozi([]);
      setPoruka(t("upisano"));
      await ucitaj();
    } finally {
      setRadi(false);
    }
  }

  async function ukloni() {
    setRadi(true);
    setGreska(null);
    setPoruka(null);
    try {
      await fetch("/api/nabavke/predlog", { method: "DELETE" });
      await ucitaj();
    } finally {
      setRadi(false);
    }
  }

  const aktivne = nabavke.filter((n) => n.status !== "ZAVRSENA");
  const zavrsene = nabavke.filter((n) => n.status === "ZAVRSENA");

  return (
    <Stranica sirina="uska">
      <div>
        <NaslovStranice naslov={t("naslov")} opis={t("uvod")} />
        {/* Zbirni godišnji pregled projekata (čl. 31 st. 4). Evidencija obima, ne
            granica — učestalost nabavki pravilnikom nije ograničena. */}
        {projekti && (
          <p className="mt-2 text-xs text-kolo-muted">
            {t("godisnji_pregled", {
              godina: projekti.godina,
              iznos: projekti.utrosenoRSD.toLocaleString("sr-RS"),
              broj: projekti.brojNabavki,
            })}
          </p>
        )}
      </div>

      {/* ── Nabavke u toku ────────────────────────────────────────────────── */}
      {aktivne.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("nabavke_naslov")}</h2>
          {aktivne.map((n) => (
            <Link
              key={n.id}
              href={`/nabavke/${n.id}`}
              className="block rounded-kartica border border-kolo-green-700 bg-kolo-green-50 p-4 shadow-kartica transition-colors hover:bg-kolo-green-100"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{n.naziv}</span>
                <span className="text-sm text-kolo-muted">{t(`status_${n.status}` as never)}</span>
              </div>
              {n.poenPoDelu !== null && (
                <p className="mt-1 text-sm">
                  {t("kartica_deo", {
                    velicina: n.velicinaDela ?? 0,
                    jedinica: n.jedinicaMere ?? "",
                    poen: n.poenPoDelu.toLocaleString("sr-RS"),
                  })}
                </p>
              )}
              {n.moja && <p className="mt-1 text-sm font-medium">{t(`moja_${n.moja.status}` as never)}</p>}
            </Link>
          ))}
        </section>
      )}

      {/* Redosled (C2, uloga 1, 24.10.2026): prvo nabavke u toku, pa predlog i
          registar predloga, pa završene — ko dođe da vidi šta se nabavlja ne
          počinje od obrasca. */}
      {/* ── Tvoj predlog (čl. 9) ─────────────────────────────────────────── */}
      <Kartica as="section">
        <h2 className="text-lg font-semibold">{t("predlog_naslov")}</h2>
        <p className="mt-1 text-sm text-kolo-muted">{t("predlog_opis")}</p>

        {moj ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-kolo-bg px-3 py-2">
            <span className="font-semibold">{moj.naziv}</span>
            <Dugme varijanta="sekundarno" velicina="sm" onClick={ukloni} disabled={radi}>
              {t("ukloni")}
            </Dugme>
          </div>
        ) : null}

        <div className="mt-3">
          <input
            value={unos}
            onChange={(e) => setUnos(e.target.value)}
            placeholder={t("polje_placeholder")}
            maxLength={40}
            aria-label={t("polje_placeholder")}
            className={KLASE_UNOSA}
          />
          {predlozi.length > 0 && (
            <ul className="mt-2 divide-y divide-kolo-border rounded-xl border border-kolo-border">
              {predlozi.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => sacuvaj(p.naziv)}
                    disabled={radi}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-kolo-bg disabled:opacity-50"
                  >
                    {p.naziv}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {unos.trim().length >= 2 && !predlozi.some((p) => p.naziv.toLowerCase() === unos.trim().toLowerCase()) && (
            <Dugme punaSirina className="mt-2" onClick={() => sacuvaj(unos)} disabled={radi}>
              {moj ? t("zameni", { naziv: unos.trim() }) : t("upisi", { naziv: unos.trim() })}
            </Dugme>
          )}
        </div>

        {greska && <Obavestenje vrsta="greska" className="mt-3">{greska}</Obavestenje>}
        {poruka && <Obavestenje vrsta="uspeh" className="mt-3">{poruka}</Obavestenje>}
      </Kartica>

      {/* ── Registar predloga (čl. 10) ────────────────────────────────────── */}
      <Kartica as="section">
        <h2 className="text-lg font-semibold">{t("registar_naslov")}</h2>

        {ucitava ? (
          <p className="mt-3 text-sm text-kolo-muted">{t("ucitavanje")}</p>
        ) : registar.length === 0 ? (
          <p className="mt-3 text-sm text-kolo-muted">{t("registar_prazan")}</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {registar.map((r, i) => (
              <li
                key={r.nazivId}
                className="flex items-center justify-between gap-3 rounded-xl bg-kolo-bg px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="w-6 shrink-0 text-sm text-kolo-muted">{i + 1}.</span>
                  <span className="truncate font-medium">{r.naziv}</span>
                </span>
                <span className="shrink-0 text-sm text-kolo-muted">
                  {t("broj_clanova", { broj: r.brojKorisnika })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Kartica>

      {zavrsene.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t("zavrsene_naslov")}</h2>
          {zavrsene.map((n) => (
            <Link
              key={n.id}
              href={`/nabavke/${n.id}`}
              className="block rounded-xl border border-kolo-border bg-white px-3 py-2 text-sm transition hover:bg-kolo-bg"
            >
              {n.naziv}
            </Link>
          ))}
        </section>
      )}

      <p className="text-xs text-kolo-muted">{t("pravni_osnov")}</p>
    </Stranica>
  );
}
