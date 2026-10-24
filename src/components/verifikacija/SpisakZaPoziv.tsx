"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { BROJ_OTVOREN_MINUTA } from "@/lib/nov-clan-pravila";
import { profilHref } from "@/lib/profil-link";
import { intlTag } from "@/lib/format";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";

type Red = {
  id: string;
  osnov: string;
  mesto: string | null;
  opis: string | null;
  dostupnost: string | null;
  createdAt: string;
  clan: { id: string; pseudonim: string };
  zakljucan: boolean;
  otvorenMeni: boolean;
  otvorenDo: string | null;
  /** Upisnik ZRNA koji traži potvrdu — prvi na spisku (čl. 4a; set 4.8.3). */
  prioritet?: boolean;
  /** Do kada Fondacija obezbeđuje poziv upisniku ZRNA. */
  rokPozivaDo?: string | null;
  /** Naziv gazdinstva koje čeka razgovor radi odobrenja (gazd. čl. 6a st. 2). */
  gazdinstvo?: string | null;
};

type Otvoreno = {
  imePrezime: string | null;
  telefon: string;
  otvorenDo: string;
  /** Poklapanje sa drugim nalozima (N4-M2): mesto drugog naloga, nikad njegov pseudonim. */
  oznake?: { istiTelefon: boolean; istoImeMesta: string[] };
};

/**
 * „Žele da ih neko nazove" — spisak za poziv za člana Kola (dokaz stvarnosti čl.
 * 4a; Uslovi čl. 16b; set 4.8.3). Bez propova; server odbija svakog ko nije član
 * Kola, pa se tada ne prikazuje ništa (član bez potvrde spisak ne vidi). Zahteve
 * radi potvrde (čl. 5c) server šalje samo čuvarima Kola; upisnik ZRNA je prvi.
 * Kod nosioca gazdinstva član Kola posle razgovora beleži i razgovor radi odobrenja
 * gazdinstva (gazd. čl. 6a st. 2) — jedan razgovor.
 *
 * 🔴 Ime i broj dolaze sa servera SAMO u odgovoru na „Otvori ime i broj" i drže se
 * samo u stanju ove komponente dok je poziv otvoren. Sidro `#zahtevi` ostaje zbog
 * starih linkova iz obaveštenja.
 */
export default function SpisakZaPoziv() {
  const t = useTranslations("spisak");
  const locale = useLocale();
  const [redovi, setRedovi] = useState<Red[] | null>(null);
  const [otvoreno, setOtvoreno] = useState<Record<string, Otvoreno>>({});
  const [greska, setGreska] = useState<string | null>(null);
  const [radi, setRadi] = useState<string | null>(null);
  const [sada, setSada] = useState(() => Date.now());
  const [sumnja, setSumnja] = useState<Record<string, boolean>>({});
  const [zabelezeno, setZabelezeno] = useState<Record<string, boolean>>({});

  const ucitaj = useCallback(async () => {
    const r = await fetch("/api/zahtev-razgovor", { cache: "no-store" });
    if (!r.ok) {
      setRedovi(null);
      return;
    }
    const d = await r.json();
    if (!d.clanKola) {
      setRedovi(null);
      return;
    }
    const lista: Red[] = d.zahtevi ?? [];
    setRedovi(lista);
    // Ime i broj se čuvaju samo za pozive koji su posmatraču i dalje otvoreni.
    setOtvoreno((pre) => {
      const ostaje: Record<string, Otvoreno> = {};
      for (const z of lista) if (z.otvorenMeni && pre[z.id]) ostaje[z.id] = pre[z.id];
      return ostaje;
    });
  }, []);

  useEffect(() => {
    void ucitaj();
    const i = setInterval(() => void ucitaj(), 60_000);
    return () => clearInterval(i);
  }, [ucitaj]);

  // Odbrojavanje: kad rok istekne, ime i broj nestaju sa ekrana.
  useEffect(() => {
    if (Object.keys(otvoreno).length === 0) return;
    const i = setInterval(() => {
      const n = Date.now();
      setSada(n);
      setOtvoreno((pre) => {
        const ostaje: Record<string, Otvoreno> = {};
        let promena = false;
        for (const [id, o] of Object.entries(pre)) {
          if (new Date(o.otvorenDo).getTime() > n) ostaje[id] = o;
          else promena = true;
        }
        return promena ? ostaje : pre;
      });
    }, 1_000);
    return () => clearInterval(i);
  }, [otvoreno]);

  async function otvori(id: string) {
    setRadi(id);
    setGreska(null);
    const r = await fetch(`/api/zahtev-razgovor/${id}/broj`, { method: "POST", cache: "no-store" });
    setRadi(null);
    if (!r.ok) {
      setGreska((await r.json().catch(() => ({}))).error ?? null);
      await ucitaj();
      return;
    }
    const o: Otvoreno = await r.json();
    setOtvoreno((pre) => ({ ...pre, [id]: o }));
    setSada(Date.now());
    await ucitaj();
  }

  async function zatvori(id: string) {
    setRadi(id);
    await fetch(`/api/zahtev-razgovor/${id}/broj`, { method: "DELETE" });
    setRadi(null);
    setOtvoreno((pre) => {
      const ostaje = { ...pre };
      delete ostaje[id];
      return ostaje;
    });
    await ucitaj();
  }

  async function zabeleziGazdinstvo(id: string) {
    setRadi(id);
    setGreska(null);
    const r = await fetch(`/api/zahtev-razgovor/${id}/gazdinstvo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sumnja: !!sumnja[id] }),
    });
    setRadi(null);
    if (!r.ok) {
      setGreska((await r.json().catch(() => ({}))).error ?? null);
      return;
    }
    setZabelezeno((pre) => ({ ...pre, [id]: true }));
    await ucitaj();
  }

  if (redovi === null) return null;

  const preostalo = (otvorenDo: string) => {
    const s = Math.max(0, Math.floor((new Date(otvorenDo).getTime() - sada) / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div id="zahtevi" className="rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-5 space-y-3 scroll-mt-20">
      <h2 className="text-sm font-semibold text-kolo-text">{t("naslov")}</h2>
      <p className="text-sm text-kolo-muted">{t("opis_clan_kola", { minuta: BROJ_OTVOREN_MINUTA })}</p>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      {redovi.length === 0 ? (
        <p className="text-sm text-kolo-muted">{t("prazan")}</p>
      ) : (
        <ul className="divide-y divide-kolo-border">
          {redovi.map((z) => {
            const o = otvoreno[z.id];
            return (
              <li key={z.id} className="py-3 space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={profilHref(z.clan)} className="text-sm font-semibold text-kolo-green-700 hover:underline">
                    {z.clan.pseudonim}
                  </Link>
                  <span className="text-xs text-kolo-muted">
                    {t(`osnov_${z.osnov.toLowerCase()}`)}
                    {z.mesto ? ` · ${z.mesto}` : ""}
                  </span>
                </div>
                {z.rokPozivaDo && (
                  <p className={z.prioritet ? "text-xs font-semibold text-kolo-gold-700" : "text-xs text-kolo-muted"}>
                    {t(z.prioritet ? "prioritet_zrno" : "rok_poziva", { datum: new Date(z.rokPozivaDo).toLocaleDateString(intlTag(locale)) })}
                  </p>
                )}
                {z.opis && <p className="text-sm text-kolo-text whitespace-pre-line break-words">{z.opis}</p>}
                {z.dostupnost && (
                  <p className="text-xs text-kolo-muted">
                    {t("dostupan")}: {z.dostupnost}
                  </p>
                )}
                {o ? (
                  <div className="space-y-2 rounded-kontrola bg-kolo-green-50 px-3 py-2">
                    {o.imePrezime ? (
                      <p className="text-sm font-semibold text-kolo-text select-all">{o.imePrezime}</p>
                    ) : (
                      <p className="text-xs text-kolo-muted">{t("ime_nije_upisano")}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={`tel:${o.telefon.replace(/[^0-9+]/g, "")}`}
                        className="text-base font-semibold text-kolo-text select-all"
                      >
                        {o.telefon}
                      </a>
                      <span className="text-xs text-kolo-muted tabular-nums">
                        {t("otvoreno_do", {
                          vreme: new Date(o.otvorenDo).toLocaleTimeString(intlTag(locale), {
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        })}{" "}
                        ({preostalo(o.otvorenDo)})
                      </span>
                      <Dugme varijanta="sekundarno" velicina="sm" onClick={() => zatvori(z.id)} disabled={radi === z.id}>
                        {t("zatvori")}
                      </Dugme>
                    </div>
                    {o.oznake && (o.oznake.istiTelefon || o.oznake.istoImeMesta.length > 0) && (
                      <Obavestenje vrsta="upozorenje">
                        {o.oznake.istiTelefon && <span className="block">{t("oznaka_isti_telefon")}</span>}
                        {o.oznake.istoImeMesta.length > 0 && (
                          <span className="block">
                            {t("oznaka_isto_ime", {
                              mesta: o.oznake.istoImeMesta.map((m) => m || t("oznaka_mesto_nepoznato")).join(", "),
                            })}
                          </span>
                        )}
                        <span className="block text-xs">{t("oznaka_objasnjenje")}</span>
                      </Obavestenje>
                    )}
                    <p className="text-xs text-kolo-muted">
                      {z.osnov === "POTVRDA" ? t("posle_razgovora_potvrda") : t("posle_razgovora")}
                    </p>
                    {z.gazdinstvo && !zabelezeno[z.id] && (
                      <div className="space-y-2 border-t border-kolo-border pt-2">
                        <p className="text-xs text-kolo-text">{t("gazdinstvo_razgovor", { naziv: z.gazdinstvo })}</p>
                        <label className="flex items-start gap-2 text-xs text-kolo-text">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={!!sumnja[z.id]}
                            onChange={(e) => setSumnja((p) => ({ ...p, [z.id]: e.target.checked }))}
                          />
                          <span>{t("gazdinstvo_sumnja")}</span>
                        </label>
                        <Dugme varijanta="sekundarno" velicina="sm" onClick={() => zabeleziGazdinstvo(z.id)} disabled={radi === z.id}>
                          {t("gazdinstvo_zabelezi")}
                        </Dugme>
                      </div>
                    )}
                    {zabelezeno[z.id] && <p className="text-xs text-kolo-green-700">{t("gazdinstvo_zabelezeno")}</p>}
                  </div>
                ) : z.zakljucan ? (
                  <p className="text-xs text-kolo-muted">{t("zakljucan")}</p>
                ) : (
                  <Dugme velicina="sm" onClick={() => otvori(z.id)} disabled={radi === z.id}>
                    {z.otvorenMeni ? t("prikazi_ponovo") : t("otvori")}
                  </Dugme>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
