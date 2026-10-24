"use client";

// Prikaz lokacija članova i kolektivnih oblika koji se na njima otključavaju.
// Jedna komponenta za dva ekrana — kartica „Lokacije" na `/sistem` i stranica
// `/zadruge` — da isti grad ne bi na dva mesta imao dva različita broja.
// Zadruge nastaju po lokalitetima (docs/zadruge-model.md, t. 2.10).

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Pseudonim from "@/components/Pseudonim";
import KorisnikAvatar from "@/components/KorisnikAvatar";
import type { Clan } from "@/components/SistemListe";
import { profilHref } from "@/lib/profil-link";
import { MIN_ZADRUGARA, PRAG_PRVE_ZADRUGE } from "@/lib/zadruga-pravila";
import { normalizujLokaciju } from "@/lib/lokacija-kljuc";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Kartica from "@/components/ui/Kartica";
import PraznoStanje from "@/components/ui/PraznoStanje";

/** Zadruga upisana u sistem — prikazuje se na kartici svog lokaliteta. */
export type ZadrugaNaLokaciji = { id: string; naziv: string; lokalitet: string | null; zadrugara: number };

// ── Lokacije članova + otključane opcije ──────────────────────────────────────

// Ključ grupisanja živi u `lokacija-kljuc.ts` — čita ga i server (naslovna).
export { normalizujLokaciju };

interface LokAgg {
  kljuc: string;
  naziv: string;
  ukupno: number;
  verifikovanih: number;
  clanovi: Clan[];
}

// Prva zadruga u mestu otključava se sa 50 REDOVNIH članova sa tog područja;
// svaka sledeća u istom mestu osniva se sa pet zadrugara (Pravilnik o zadrugama
// čl. 5 i 6, set 4.7.1). Brojevi se čitaju iz pravila, ne prepisuju (pravilo 10).
const LOK_PRAG_ZADRUGA = PRAG_PRVE_ZADRUGE;

export default function LokacijeSekcija({
  clanovi,
  verified,
  zadruge = [],
  bezRangListe = false,
  bezUvoda = false,
}: {
  clanovi: Clan[];
  verified: boolean;
  zadruge?: ZadrugaNaLokaciji[];
  /** Gost na `/zadruge` vidi samo zbir po mestu — rang-lista se i ne nudi. */
  bezRangListe?: boolean;
  /** Na `/zadruge` isto kaže opis stranice iznad, pa se uvod ne ponavlja. */
  bezUvoda?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("sistem");
  const [pretraga, setPretraga] = useState("");

  const { lokacije, bezLokacije } = useMemo(() => {
    const mapa = new Map<
      string,
      { ukupno: number; verifikovanih: number; varijante: Map<string, number>; clanovi: Clan[] }
    >();
    let bez = 0;
    for (const c of clanovi) {
      const kljuc = normalizujLokaciju(c.location);
      if (!kljuc) {
        bez++;
        continue;
      }
      let e = mapa.get(kljuc);
      if (!e) {
        e = { ukupno: 0, verifikovanih: 0, varijante: new Map(), clanovi: [] };
        mapa.set(kljuc, e);
      }
      e.ukupno++;
      if (c.verified) e.verifikovanih++;
      // Članovi stižu sortirani po stanju POEN-a (server), pa je redosled
      // dodavanja ujedno i rang lista lokacije.
      e.clanovi.push(c);
      // Zabeleži originalno napisan oblik (npr. „Beograd" vs „beograd") radi prikaza.
      const prikaz = (c.location ?? "").trim().replace(/\s+/g, " ");
      e.varijante.set(prikaz, (e.varijante.get(prikaz) ?? 0) + 1);
    }
    const rezultat: LokAgg[] = Array.from(mapa.entries()).map(([kljuc, e]) => {
      // Prikaži najčešće korišćeni oblik napisa.
      let naziv = kljuc;
      let max = -1;
      for (const [v, n] of e.varijante) {
        if (n > max) {
          max = n;
          naziv = v;
        }
      }
      return { kljuc, naziv, ukupno: e.ukupno, verifikovanih: e.verifikovanih, clanovi: e.clanovi };
    });
    rezultat.sort(
      (a, b) =>
        b.verifikovanih - a.verifikovanih ||
        b.ukupno - a.ukupno ||
        a.naziv.localeCompare(b.naziv, intlTag(locale))
    );
    return { lokacije: rezultat, bezLokacije: bez };
  }, [clanovi]);

  const filtrirane = useMemo(() => {
    const q = pretraga.trim().toLocaleLowerCase(intlTag(locale));
    if (!q) return lokacije;
    return lokacije.filter((l) => l.naziv.toLocaleLowerCase(intlTag(locale)).includes(q));
  }, [lokacije, pretraga]);

  return (
    <div className="space-y-4">
      {/* Objašnjenje koncepta */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-4 md:p-5 shadow-kartica">
        <p className="text-sm text-kolo-text font-semibold">{t("lok_naslov")}</p>
        {!bezUvoda && <p className="text-sm text-kolo-muted mt-1">{t("lok_uvod")}</p>}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-xs text-kolo-muted">
          <span>
            <span className="font-semibold text-kolo-text">{lokacije.length}</span>{" "}
            {t("lok_ukupno_lokacija")}
          </span>
          {bezLokacije > 0 && !bezRangListe && (
            <span>
              <span className="font-semibold text-kolo-text">{bezLokacije}</span>{" "}
              {t("lok_bez_lokacije")}
            </span>
          )}
        </div>
        {/* Legenda otključive opcije */}
        <div className="mt-3 pt-3 border-t border-kolo-border/50">
          <p className="text-xs text-kolo-muted flex items-start gap-2">
            <span className="shrink-0 text-[11px] font-semibold text-kolo-gold-700 bg-kolo-gold-100 px-1.5 py-0.5 rounded">
              {LOK_PRAG_ZADRUGA}+
            </span>
            <span>{t("lok_legenda_zadruga", { prag: LOK_PRAG_ZADRUGA, n: MIN_ZADRUGARA })}</span>
          </p>
        </div>
      </div>

      {lokacije.length === 0 ? (
        <Kartica>
          <PraznoStanje naslov={t("lok_nema")} />
        </Kartica>
      ) : (
        <>
          {lokacije.length > 6 && (
            <input
              type="text"
              value={pretraga}
              onChange={(e) => setPretraga(e.target.value)}
              placeholder={t("lok_pretraga")}
              aria-label={t("lok_pretraga")}
              className={KLASE_UNOSA}
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {filtrirane.map((l) => (
              <LokacijaKartica
                key={l.kljuc}
                l={l}
                t={t}
                verified={verified}
                bezRangListe={bezRangListe}
                zadruge={zadruge.filter((z) => normalizujLokaciju(z.lokalitet) === l.kljuc)}
              />
            ))}
          </div>
          {filtrirane.length === 0 && (
            <div className="text-center text-sm text-kolo-muted py-4">
              {t("nema_rezultata")}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LokacijaKartica({
  l,
  t,
  verified,
  bezRangListe,
  zadruge,
}: {
  l: LokAgg;
  t: ReturnType<typeof useTranslations>;
  verified: boolean;
  bezRangListe: boolean;
  zadruge: ZadrugaNaLokaciji[];
}) {
  const locale = useLocale();
  const [otvoreno, setOtvoreno] = useState(false);

  // Kad u mestu već postoji zadruga, uslov od 50 je ispunjen zauvek za to mesto:
  // sledeća zadruga traži samo pet zadrugara, pa se napredak ne meri ponovo.
  const imaZadrugu = zadruge.length > 0;
  const opcije = [
    imaZadrugu
      ? {
          prag: 0,
          naziv: t("lok_opcija_nova_zadruga"),
          buduci: false,
        }
      : {
          prag: LOK_PRAG_ZADRUGA,
          naziv: t("lok_opcija_zadruga"),
          buduci: false,
        },
  ];

  return (
    <div className="rounded-kartica border border-kolo-border bg-kolo-surface overflow-hidden transition-all hover:border-kolo-green-500 shadow-kartica">
      {/* Klikabilni deo kartice — otvara/zatvara rang listu članova lokacije.
          Rang lista je van button-a jer sadrži linkove ka profilima. */}
      <button
        type="button"
        onClick={() => setOtvoreno((o) => !o)}
        aria-expanded={otvoreno}
        disabled={bezRangListe}
        className={`w-full text-left p-4 md:p-5 ${bezRangListe ? "cursor-default" : "cursor-pointer"}`}
      >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-kolo-text flex items-center gap-1.5 truncate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-kolo-green-700">
              <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.75" />
            </svg>
            <span className="truncate">{l.naziv}</span>
          </p>
          <p className="text-xs text-kolo-muted mt-0.5">
            {t("lok_clanova", { ukupno: l.ukupno, verif: l.verifikovanih })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl md:text-3xl font-bold tabular-nums leading-none text-kolo-text">
            {l.verifikovanih}
          </p>
          <p className="text-[11px] text-kolo-muted mt-0.5">{t("lok_verifikovanih")}</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {opcije.map((o) => {
          const otkljucano = l.verifikovanih >= o.prag;
          const preostalo = Math.max(0, o.prag - l.verifikovanih);
          const pct = o.prag === 0 ? 100 : Math.min(100, Math.round((l.verifikovanih / o.prag) * 100));
          return (
            <div
              key={o.naziv}
              className="rounded-kontrola bg-kolo-bg p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-kolo-text flex items-center gap-1.5">
                  {o.naziv}
                  {o.buduci && (
                    <span className="text-[11px] uppercase tracking-wide font-semibold text-kolo-gold-700 bg-kolo-gold-100 px-1.5 py-0.5 rounded">
                      {t("lok_buduci")}
                    </span>
                  )}
                </span>
                {otkljucano ? (
                  <span className="shrink-0 text-xs font-semibold text-kolo-green-700 bg-kolo-green-100 px-2 py-0.5 rounded-full">
                    ✓ {t("lok_otkljucano")}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-semibold text-kolo-muted">
                    {t("lok_jos", { n: preostalo })}
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 rounded-full mt-2 bg-kolo-border/40">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    otkljucano ? "bg-kolo-green-500" : "bg-kolo-gold-400"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Poziv na rang listu */}
      {!bezRangListe && (
      <div className="mt-3 pt-3 border-t border-kolo-border/50 flex items-center justify-between text-xs font-semibold text-kolo-green-700">
        <span>{t("lok_rang_naslov")}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-transform ${otvoreno ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      )}
      </button>

      {/* Zadruge upisane na ovom lokalitetu — van dugmeta, jer su linkovi. */}
      {zadruge.length > 0 && (
        <div className="border-t border-kolo-border px-4 md:px-5 py-3">
          <p className="text-xs font-semibold text-kolo-muted">{t("lok_zadruge_u_mestu")}</p>
          <ul className="mt-1.5 space-y-1">
            {zadruge.map((z) => (
              <li key={z.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/zadruge/${z.id}`} className="font-medium text-kolo-green-700 hover:underline truncate">
                  {z.naziv}
                </Link>
                <span className="shrink-0 text-xs text-kolo-muted">{t("lok_zadrugara", { n: z.zadrugara })}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Padajuća rang lista članova lokacije (po stanju POEN-a) */}
      {otvoreno && !bezRangListe && (
        verified ? (
          <div className="border-t border-kolo-border">
            <div className="flex items-center justify-between px-4 md:px-5 py-2 bg-kolo-bg text-xs font-semibold text-kolo-muted">
              <span>{t("col_pseudonim")}</span>
              <span>{t("col_balans")}</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {l.clanovi.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center gap-2.5 px-4 md:px-5 py-2.5 text-sm ${
                    i < l.clanovi.length - 1 ? "border-b border-kolo-border/30" : ""
                  }`}
                >
                  <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-kolo-muted">
                    {i + 1}.
                  </span>
                  <KorisnikAvatar avatar={c.avatar} pseudonim={c.pseudonim} userId={c.id} size={26} />
                  <Link
                    href={profilHref(c)}
                    className="font-medium text-kolo-green-700 hover:underline truncate min-w-0"
                  >
                    <Pseudonim>{c.pseudonim}</Pseudonim>
                  </Link>
                  {c.verified ? (
                    <span className="shrink-0 text-xs bg-kolo-green-100 text-kolo-green-700 px-1.5 py-0.5 rounded font-medium">✓</span>
                  ) : (
                    <span className="shrink-0 text-xs bg-kolo-bg text-kolo-muted px-1.5 py-0.5 rounded font-medium">?</span>
                  )}
                  <span className="ml-auto shrink-0 text-sm font-semibold tabular-nums text-kolo-text">
                    {c.balance.toLocaleString(intlTag(locale))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border-t border-kolo-border p-5 text-center">
            <p className="text-sm text-kolo-muted mb-3">{t("clanovi_pregled_blokiran")}</p>
            <Link
              href="/verifikacija"
              className={klaseDugmeta()}
            >
              {t("verifikuj_dugme_link")}
            </Link>
          </div>
        )
      )}
    </div>
  );
}
