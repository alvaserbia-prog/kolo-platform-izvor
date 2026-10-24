"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { intlTag } from "@/lib/format";
import { useTranslations, useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import { useStanjeUAdresi } from "@/hooks/useStanjeUAdresi";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Segmenti from "@/components/ui/Segmenti";

interface PregledRed {
  userId: string;
  pseudonim: string;
  poslednjaAktivnost: string | null;
  brojPoseta: number;
}

interface DnevnikRed {
  id: string;
  userId: string;
  pseudonim: string;
  putanja: string;
  createdAt: string;
}

const TAKE = 200;

// Pauza duža od 30 min između dva klika istog korisnika = nova sesija.
const SESIJA_PAUZA_MS = 30 * 60 * 1000;

interface Sesija {
  key: string;
  userId: string;
  pseudonim: string;
  pocetak: string; // najstariji zapis u sesiji
  kraj: string; // najnoviji zapis u sesiji
  stavke: DnevnikRed[]; // hronološki (od najstarije)
}

/**
 * Grupisanje zapisa (stigli sortirani od najnovijeg) u sesije po korisniku:
 * uzastopni zapisi istog korisnika sa razmakom < 30 min čine jednu sesiju.
 * Rezultat je sortiran po kraju sesije (najskorija prva).
 */
function grupisiUSesije(logs: DnevnikRed[]): Sesija[] {
  const poKorisniku = new Map<string, DnevnikRed[]>();
  for (const l of logs) {
    const niz = poKorisniku.get(l.userId);
    if (niz) niz.push(l);
    else poKorisniku.set(l.userId, [l]);
  }

  const sesije: Sesija[] = [];
  for (const stavke of poKorisniku.values()) {
    // stavke su od najnovije ka najstarijoj (redosled iz API-ja očuvan)
    let tekuca: DnevnikRed[] = [];
    const zatvori = () => {
      if (tekuca.length === 0) return;
      const najnovija = tekuca[0];
      const najstarija = tekuca[tekuca.length - 1];
      sesije.push({
        key: `${najnovija.userId}-${najnovija.createdAt}`,
        userId: najnovija.userId,
        pseudonim: najnovija.pseudonim,
        pocetak: najstarija.createdAt,
        kraj: najnovija.createdAt,
        stavke: [...tekuca].reverse(),
      });
    };
    for (const s of stavke) {
      if (tekuca.length > 0) {
        const prethodna = tekuca[tekuca.length - 1];
        const razmak =
          new Date(prethodna.createdAt).getTime() - new Date(s.createdAt).getTime();
        if (razmak > SESIJA_PAUZA_MS) {
          zatvori();
          tekuca = [];
        }
      }
      tekuca.push(s);
    }
    zatvori();
  }

  sesije.sort((a, b) => new Date(b.kraj).getTime() - new Date(a.kraj).getTime());
  return sesije;
}

const OTVORENE_KLJUC = "admin-aktivnost-otvorene";

function procitajOtvorene(): Set<string> {
  try {
    const sacuvano = sessionStorage.getItem(OTVORENE_KLJUC);
    return new Set(sacuvano ? (JSON.parse(sacuvano) as string[]) : []);
  } catch {
    // sessionStorage nedostupan (SSR, privatni mod) — sve zatvoreno.
    return new Set();
  }
}

function zapamtiOtvorene(otvorene: Set<string>) {
  try {
    sessionStorage.setItem(OTVORENE_KLJUC, JSON.stringify([...otvorene]));
  } catch {
    // bez pamćenja
  }
}

function formatVreme(iso: string | null, locale: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(intlTag(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSat(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(intlTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Admin tab „Aktivnost" (samo superadmin): kad je koji korisnik poslednji put
 * bio aktivan i koje je stranice posećivao. Podaci iz `AktivnostLog` preko
 * `GET /api/admin/aktivnost`.
 */
export default function AktivnostTab() {
  const locale = useLocale();
  const t = useTranslations("admin");
  // Prikaz i filter žive u adresi (`?pogled=dnevnik&q=...`), a otvorene sesije u
  // sessionStorage — da „nazad" sa profila ili posećene putanje vrati admina
  // tačno tamo gde je kliknuo, a ne na prazan „Pregled".
  const [pogled, postaviPogled] = useStanjeUAdresi("pogled", "pregled");
  const view: "pregled" | "dnevnik" = pogled === "dnevnik" ? "dnevnik" : "pregled";
  const setView = (v: "pregled" | "dnevnik") => {
    zapamtiOtvorene(new Set());
    postaviPogled(v);
  };
  const [pregled, setPregled] = useState<PregledRed[] | null>(null);
  const [dnevnik, setDnevnik] = useState<DnevnikRed[]>([]);
  const [otvorene, postaviOtvorene] = useState<Set<string>>(new Set());
  const prebaciOtvorenu = (kljuc: string) => {
    const nove = new Set(otvorene);
    if (nove.has(kljuc)) nove.delete(kljuc);
    else nove.add(kljuc);
    zapamtiOtvorene(nove);
    postaviOtvorene(nove);
  };
  const [imaJos, setImaJos] = useState(false);
  const [aktivanQ, postaviAktivanQ] = useStanjeUAdresi("q");
  const setAktivanQ = (v: string) => {
    zapamtiOtvorene(new Set());
    postaviAktivanQ(v);
  };
  const [q, setQ] = useState(aktivanQ);
  const [loading, setLoading] = useState(false);
  const [greska, setGreska] = useState(false);

  const ucitajPregled = useCallback(async () => {
    setLoading(true);
    setGreska(false);
    try {
      const res = await fetch("/api/admin/aktivnost?view=pregled");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPregled(data.pregled);
    } catch {
      setGreska(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const ucitajDnevnik = useCallback(
    async (filter: string, pre: string | null) => {
      setLoading(true);
      setGreska(false);
      try {
        const params = new URLSearchParams({ view: "dnevnik", take: String(TAKE) });
        if (filter) params.set("q", filter);
        if (pre) params.set("pre", pre);
        const res = await fetch(`/api/admin/aktivnost?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const novi: DnevnikRed[] = data.dnevnik;
        setDnevnik((prev) => (pre ? [...prev, ...novi] : novi));
        // Sveže učitan dnevnik zadržava samo one otvorene sesije koje su i
        // dalje u spisku (npr. posle povratka sa putanje); ostale se zatvaraju.
        if (!pre) {
          const kljucevi = new Set(grupisiUSesije(novi).map((s) => s.key));
          const zadrzane = new Set([...procitajOtvorene()].filter((k) => kljucevi.has(k)));
          zapamtiOtvorene(zadrzane);
          postaviOtvorene(zadrzane);
        }
        setImaJos(novi.length === TAKE);
      } catch {
        setGreska(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (view === "pregled") void ucitajPregled();
    else void ucitajDnevnik(aktivanQ, null);
  }, [view, aktivanQ, ucitajPregled, ucitajDnevnik]);

  function primeniFilter(e: React.FormEvent) {
    e.preventDefault();
    setAktivanQ(q.trim());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmenti
          oznaka={`${t("aktivnost_pregled")} / ${t("aktivnost_dnevnik")}`}
          vrednost={view}
          onPromena={setView}
          opcije={[
            { vrednost: "pregled", oznaka: t("aktivnost_pregled") },
            { vrednost: "dnevnik", oznaka: t("aktivnost_dnevnik") },
          ]}
        />
        <button
          onClick={() =>
            view === "pregled" ? ucitajPregled() : ucitajDnevnik(aktivanQ, null)
          }
          className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
        >
          {t("aktivnost_osvezi")}
        </button>
      </div>

      <p className="text-xs text-kolo-muted">{t("aktivnost_napomena")}</p>

      {greska && (
        <Obavestenje vrsta="greska">{t("aktivnost_greska")}</Obavestenje>
      )}

      {view === "pregled" && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
          {pregled === null || (loading && pregled.length === 0) ? (
            <p className="px-5 py-8 text-center text-sm text-kolo-muted">…</p>
          ) : pregled.length === 0 ? (
            <PraznoStanje kompaktno naslov={t("aktivnost_nema")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-kolo-muted border-b border-kolo-border">
                    <th className="px-4 py-2.5 font-medium">{t("aktivnost_kolona_korisnik")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("aktivnost_kolona_poslednja")}</th>
                    <th className="px-4 py-2.5 font-medium text-right">{t("aktivnost_kolona_poseta")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pregled.map((r) => (
                    <tr key={r.userId} className="border-b border-kolo-border last:border-0">
                      <td className="px-4 py-2.5">
                        {r.pseudonim === "?" ? (
                          <Pseudonim>{r.pseudonim}</Pseudonim>
                        ) : (
                          <Link
                            href={profilHref({ id: r.userId, pseudonim: r.pseudonim })}
                            className="font-semibold text-kolo-green-700 hover:underline"
                          >
                            <Pseudonim>{r.pseudonim}</Pseudonim>
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-kolo-muted">
                        {formatVreme(r.poslednjaAktivnost, locale)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-kolo-muted">{r.brojPoseta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === "dnevnik" && (
        <>
          <form onSubmit={primeniFilter} className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("aktivnost_pretraga_placeholder")} aria-label={t("aktivnost_pretraga_placeholder")}
              className="flex-1 border border-kolo-border rounded-kontrola px-3 py-2 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
            />
            <button
              type="submit"
              className={klaseDugmeta()}
            >
              {t("aktivnost_pretraga_btn")}
            </button>
          </form>

          <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
            {dnevnik.length === 0 ? (
              loading ? (
                <p className="px-5 py-8 text-center text-sm text-kolo-muted">…</p>
              ) : (
                <PraznoStanje kompaktno naslov={t("aktivnost_nema")} />
              )
            ) : (
              grupisiUSesije(dnevnik).map((s, i, sve) => {
                const otvorena = otvorene.has(s.key);
                const istiDan =
                  new Date(s.pocetak).toDateString() === new Date(s.kraj).toDateString();
                return (
                  <div
                    key={s.key}
                    className={i < sve.length - 1 ? "border-b border-kolo-border" : ""}
                  >
                    <button
                      type="button"
                      onClick={() => prebaciOtvorenu(s.key)}
                      className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-kolo-bg transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-kolo-muted text-xs transition-transform ${otvorena ? "rotate-90" : ""}`}
                        >
                          ›
                        </span>
                        <Pseudonim>{s.pseudonim}</Pseudonim>
                        <span className="text-xs text-kolo-muted">
                          {t("aktivnost_sesija_stranica", { count: s.stavke.length })}
                        </span>
                      </div>
                      <span className="text-xs text-kolo-muted shrink-0">
                        {formatVreme(s.pocetak, locale)}
                        {s.stavke.length > 1 && (
                          <> – {istiDan ? formatSat(s.kraj, locale) : formatVreme(s.kraj, locale)}</>
                        )}
                      </span>
                    </button>
                    {otvorena && (
                      <div className="px-4 pb-3 pl-10">
                        {s.stavke.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-baseline gap-3 py-1 border-l-2 border-kolo-border pl-3"
                          >
                            <span className="text-xs text-kolo-muted shrink-0 tabular-nums">
                              {formatSat(r.createdAt, locale)}
                            </span>
                            <Link
                              href={r.putanja}
                              className="font-mono text-xs text-kolo-green-700 hover:underline break-all"
                            >
                              {r.putanja}
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {imaJos && (
            <button
              onClick={() => ucitajDnevnik(aktivanQ, dnevnik[dnevnik.length - 1]?.createdAt ?? null)}
              disabled={loading}
              className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" }) + " w-full"}
            >
              {t("aktivnost_ucitaj_jos")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
