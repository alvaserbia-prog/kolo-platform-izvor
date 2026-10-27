"use client";

/**
 * Moderacija Pijace — pregled prijavljenih oglasa i uklanjanje spornih.
 *
 * Pravni osnov: Uslovi korišćenja čl. 22, 23, 24, 28 i 29. Fondacija nije
 * obavezna da unapred pregleda sadržaj (čl. 29 st. 2), pa je podrazumevan
 * prikaz „prijavljeni" — red čekanja koji su napravili sami korisnici.
 *
 * Namerno NEMA izmene tuđeg oglasa: akti daju pravo uklanjanja, ne prepravke.
 * Vlasnik dobija razlog i sam ispravlja i ponovo objavljuje.
 */

import { useState, useEffect, useCallback } from "react";
import { intlTag } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Pseudonim from "@/components/Pseudonim";
import { useStanjeUAdresi } from "@/hooks/useStanjeUAdresi";
import { OBRAZLOZENJE_TRGOVINA_POENOM } from "@/lib/moderacija";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Segmenti from "@/components/ui/Segmenti";
import { useDijalog } from "@/components/ui/Dijalog";

type Prikaz = "prijavljeni" | "aktivni" | "uklonjeni";

interface Prijava {
  id: string;
  razlog: string;
  razlogOpis: string;
  opis: string | null;
  status: string;
  prijaviocPseudonim: string;
  createdAt: string;
}

interface Oglas {
  id: string;
  title: string;
  opis: string;
  category: string;
  location: string | null;
  status: string;
  slika: string | null;
  createdAt: string;
  uklonjenAt: string | null;
  uklonjenRazlog: string | null;
  sellerId: string;
  sellerPseudonim: string;
  prijave: Prijava[];
  otvorenihPrijava: number;
}

const PRIKAZI: [Prikaz, string][] = [
  ["prijavljeni", "Prijavljeni"],
  ["aktivni", "Aktivni"],
  ["uklonjeni", "Uklonjeni"],
];

export default function PijacaTab() {
  const t = useTranslations("admin");
  const locale = useLocale();
  // Pod-prikaz (i pretraga) žive u adresi, da „nazad" sa oglasa ili profila
  // vrati na isti spisak.
  const [prikazIzAdrese, setPrikaz] = useStanjeUAdresi("prikaz", "prijavljeni");
  const prikaz: Prikaz = PRIKAZI.find(([k]) => k === prikazIzAdrese)?.[0] ?? "prijavljeni";
  const [q, setQ] = useStanjeUAdresi("q");
  const [oglasi, setOglasi] = useState<Oglas[]>([]);
  const [otvorenihPrijava, setOtvorenihPrijava] = useState(0);
  const [ucitava, setUcitava] = useState(true);
  const [greska, setGreska] = useState("");
  const [radiId, setRadiId] = useState<string | null>(null);
  // Id oglasa čija je forma za uklanjanje otvorena + upisan razlog.
  const [uklanjaId, setUklanjaId] = useState<string | null>(null);
  const [razlog, setRazlog] = useState("");
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    setUcitava(true);
    try {
      const params = new URLSearchParams({ prikaz });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/pijaca?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? "Greška pri učitavanju.");
        return;
      }
      setOglasi(data.oglasi ?? []);
      setOtvorenihPrijava(data.otvorenihPrijava ?? 0);
      setGreska("");
    } finally {
      setUcitava(false);
    }
  }, [prikaz, q]);

  useEffect(() => {
    void ucitaj();
    // `q` se namerno NE prati — pretraga se okida dugmetom, ne kucanjem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prikaz]);

  async function ukloni(id: string) {
    if (!razlog.trim()) {
      setGreska("Razlog uklanjanja je obavezan — šalje se korisniku (Uslovi čl. 29 st. 2).");
      return;
    }
    setRadiId(id);
    setGreska("");
    try {
      const res = await fetch(`/api/admin/pijaca/${id}/ukloni`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razlog: razlog.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? "Greška pri uklanjanju.");
        return;
      }
      setUklanjaId(null);
      setRazlog("");
      await ucitaj();
    } finally {
      setRadiId(null);
    }
  }

  async function vrati(id: string) {
    if (!(await potvrdi({ poruka: "Vratiti oglas na Pijacu?", dugme: "Vrati na Pijacu" }))) return;
    setRadiId(id);
    setGreska("");
    try {
      const res = await fetch(`/api/admin/pijaca/${id}/vrati`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setGreska(data.error ?? "Greška.");
      else await ucitaj();
    } finally {
      setRadiId(null);
    }
  }

  async function odbaciPrijavu(prijavaId: string) {
    setRadiId(prijavaId);
    setGreska("");
    try {
      const res = await fetch(`/api/admin/pijaca/prijave/${prijavaId}/odbaci`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setGreska(data.error ?? "Greška.");
      else await ucitaj();
    } finally {
      setRadiId(null);
    }
  }

  return (
    <div className="space-y-4">
      {dijalog}
      <Obavestenje vrsta="info">
        Fondacija nije obavezna da unapred pregleda sadržaj (Uslovi čl. 29 st. 2), ali može ukloniti
        oglas koji krši Uslove, Pravilnik ili zakon — uz obavezno obaveštenje korisniku sa razlogom
        (čl. 23 st. 5, čl. 29 st. 2). Oglas se ne prepravlja: vlasnik dobija razlog i sam ispravlja.
      </Obavestenje>

      <div className="flex flex-wrap items-center gap-2">
        <Segmenti
          oznaka={PRIKAZI.map(([, labela]) => labela).join(" / ")}
          vrednost={prikaz}
          onPromena={setPrikaz}
          opcije={PRIKAZI.map(([kljuc, labela]) => ({
            vrednost: kljuc,
            oznaka: `${labela}${kljuc === "prijavljeni" && otvorenihPrijava > 0 ? ` (${otvorenihPrijava})` : ""}`,
          }))}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void ucitaj();
          }}
          className="flex gap-2 ml-auto"
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("pijaca_pretraga_placeholder")}
            aria-label={t("pijaca_pretraga_placeholder")}
            className="min-h-10 px-3 rounded-kontrola border border-kolo-border text-sm w-52 bg-kolo-surface outline-none focus:border-kolo-green-700"
          />
          <button type="submit" className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}>
            {t("pijaca_trazi")}
          </button>
        </form>
      </div>

      {greska && (
        <Obavestenje vrsta="greska">{greska}</Obavestenje>
      )}

      {ucitava ? (
        <div className="text-sm text-kolo-muted py-8 text-center">Učitavanje…</div>
      ) : oglasi.length === 0 ? (
        <PraznoStanje naslov={prikaz === "prijavljeni" ? "Nema prijavljenih oglasa." : "Nema oglasa."} />
      ) : (
        <div className="space-y-3">
          {oglasi.map((o) => (
            <div key={o.id} className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/pijaca/${o.id}`} className="text-sm font-semibold text-kolo-green-700 hover:underline">
                    {o.title}
                  </Link>
                  <div className="text-xs text-kolo-muted mt-0.5">
                    <Pseudonim>{o.sellerPseudonim}</Pseudonim>
                    {o.location ? ` · ${o.location}` : ""} · {new Date(o.createdAt).toLocaleDateString(intlTag(locale))}
                  </div>
                </div>
                {o.status === "UKLONJEN" ? (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-kolo-danger-light text-kolo-danger font-medium">
                    Uklonjen
                  </span>
                ) : o.otvorenihPrijava > 0 ? (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-kolo-gold-100 text-kolo-gold-700 font-medium">
                    {o.otvorenihPrijava} {o.otvorenihPrijava === 1 ? "prijava" : "prijave"}
                  </span>
                ) : null}
              </div>

              {o.opis && (
                <p className="text-xs text-kolo-muted leading-relaxed whitespace-pre-line line-clamp-4">{o.opis}</p>
              )}

              {o.uklonjenRazlog && (
                <div className="text-xs bg-kolo-bg rounded-kontrola px-3 py-2">
                  <span className="text-kolo-muted">Razlog uklanjanja: </span>
                  <span className="text-kolo-text">{o.uklonjenRazlog}</span>
                </div>
              )}

              {o.prijave.length > 0 && (
                <div className="space-y-1.5">
                  {o.prijave.map((p) => (
                    <div key={p.id} className="flex items-start gap-2 text-xs bg-kolo-bg rounded-kontrola px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-kolo-text font-medium">{p.razlogOpis}</div>
                        {p.opis && <div className="text-kolo-muted mt-0.5">{p.opis}</div>}
                        <div className="text-kolo-muted mt-0.5">
                          Prijavio: <Pseudonim>{p.prijaviocPseudonim}</Pseudonim> ·{" "}
                          {new Date(p.createdAt).toLocaleDateString(intlTag(locale))}
                          {p.status !== "OTVORENA" && ` · ${p.status === "RESENA" ? "rešena" : "odbačena"}`}
                        </div>
                      </div>
                      {p.status === "OTVORENA" && (
                        <button
                          onClick={() => odbaciPrijavu(p.id)}
                          disabled={radiId === p.id}
                          className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" }) + " shrink-0"}
                        >
                          Nema povrede
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {o.status === "UKLONJEN" ? (
                <button
                  onClick={() => vrati(o.id)}
                  disabled={radiId === o.id}
                  className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                >
                  {radiId === o.id ? "…" : "Vrati na Pijacu"}
                </button>
              ) : uklanjaId === o.id ? (
                <div className="space-y-2">
                  <textarea
                    value={razlog}
                    onChange={(e) => setRazlog(e.target.value)}
                    rows={2}
                    maxLength={500}
                    autoFocus
                    placeholder={'Razlog uklanjanja — vidi ga korisnik (npr. „Oglas nudi dobro čiji je promet zabranjen, Uslovi čl. 23").'} aria-label={'Razlog uklanjanja — vidi ga korisnik (npr. „Oglas nudi dobro čiji je promet zabranjen, Uslovi čl. 23").'}
                    className={KLASE_UNOSA}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => ukloni(o.id)}
                      disabled={radiId === o.id}
                      className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}
                    >
                      {radiId === o.id ? "…" : "Ukloni i obavesti"}
                    </button>
                    <button
                      onClick={() => {
                        setUklanjaId(null);
                        setRazlog("");
                      }}
                      className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                    >
                      Odustani
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setUklanjaId(o.id);
                    // Prijava zbog trgovine POEN-om dobija standardno obrazloženje.
                    setRazlog(
                      o.prijave.some((p) => p.status === "OTVORENA" && p.razlog === "TRGOVINA_POENOM")
                        ? OBRAZLOZENJE_TRGOVINA_POENOM
                        : "",
                    );
                    setGreska("");
                  }}
                  className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}
                >
                  Ukloni oglas
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
