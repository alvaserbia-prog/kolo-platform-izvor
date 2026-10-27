"use client";

/**
 * Prvi oglasi — odobravanje doprinosa iz Pravilnika čl. 38 za naloge BEZ POTVRDE.
 *
 * Oglas je već objavljen i vidi se na Pijaci; ovde se odlučuje samo o 1.000 POEN.
 * Zato tab nudi „Odobri" i „Odbij", ali NE i uklanjanje oglasa — uklanjanje je
 * moderacija (Uslovi čl. 23, 29) i živi u tabu Pijaca. Dve različite odluke.
 *
 * Odbijanje traži razlog (ide korisniku) i oslobađa kanal: kad čovek dopuni oglas
 * ili objavi bolji, doprinos se ponovo beleži i vraća ovde.
 *
 * Podaci se učitavaju lenjo, iz taba — server stranica šalje samo broj za badge.
 */

import { useState, useEffect, useCallback } from "react";
import { intlTag } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import { useStanjeUAdresi } from "@/hooks/useStanjeUAdresi";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Segmenti from "@/components/ui/Segmenti";
import { useDijalog } from "@/components/ui/Dijalog";

type Prikaz = "cekanje" | "odobreni";

interface Stavka {
  id: string;
  iznos: number;
  status: string;
  okidac: string | null;
  zabelezenAt: string;
  evidentiranAt: string | null;
  korisnik: { id: string; pseudonim: string; tipKorisnika: string; createdAt: string };
  oglas: {
    id: string;
    title: string;
    opis: string;
    category: string;
    location: string | null;
    status: string;
    brojSlika: number;
    createdAt: string;
  } | null;
}

const PRIKAZI: [Prikaz, string][] = [
  ["cekanje", "Na čekanju"],
  ["odobreni", "Odobreni"],
];

export default function PrviOglasiTab({ onDone }: { onDone?: () => void }) {
  const locale = useLocale();
  const ta = useTranslations("admin");
  // Pod-prikaz živi u adresi, da „nazad" sa oglasa ili profila
  // vrati na isti spisak.
  const [prikazIzAdrese, setPrikaz] = useStanjeUAdresi("prikaz", "cekanje");
  const prikaz: Prikaz = PRIKAZI.find(([k]) => k === prikazIzAdrese)?.[0] ?? "cekanje";
  const [stavke, setStavke] = useState<Stavka[]>([]);
  const [ukupnoNaCekanju, setUkupnoNaCekanju] = useState(0);
  const [ucitava, setUcitava] = useState(true);
  const [greska, setGreska] = useState("");
  const [radiId, setRadiId] = useState<string | null>(null);
  // Id doprinosa čija je forma za odbijanje otvorena + upisan razlog.
  const [odbijaId, setOdbijaId] = useState<string | null>(null);
  const [razlog, setRazlog] = useState("");
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    setUcitava(true);
    try {
      const res = await fetch(`/api/admin/prvi-oglasi?prikaz=${prikaz}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? "Greška pri učitavanju.");
        return;
      }
      setStavke(data.stavke ?? []);
      setUkupnoNaCekanju(data.ukupnoNaCekanju ?? 0);
      setGreska("");
    } finally {
      setUcitava(false);
    }
  }, [prikaz]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function odobri(id: string) {
    if (!(await potvrdi({ poruka: "Odobriti doprinos od 1.000 POEN za ovaj oglas? POEN ulazi u opticaj.", dugme: "Odobri 1.000 POEN" }))) return;
    setRadiId(id);
    setGreska("");
    try {
      const res = await fetch(`/api/admin/prvi-oglasi/${id}/odobri`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setGreska(data.error ?? "Greška pri odobravanju.");
      else {
        await ucitaj();
        onDone?.();
      }
    } finally {
      setRadiId(null);
    }
  }

  async function odbij(id: string) {
    if (!razlog.trim()) {
      setGreska("Razlog je obavezan — šalje se korisniku.");
      return;
    }
    setRadiId(id);
    setGreska("");
    try {
      const res = await fetch(`/api/admin/prvi-oglasi/${id}/odbij`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razlog: razlog.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? "Greška pri odbijanju.");
        return;
      }
      setOdbijaId(null);
      setRazlog("");
      await ucitaj();
      onDone?.();
    } finally {
      setRadiId(null);
    }
  }

  return (
    <div className="space-y-4">
      {dijalog}
      {/* Registar 2026-10, P3-M1: odobrenje proverava i zabranjena dobra (Uslovi čl. 19 st. 2). */}
      <p className="text-xs text-kolo-muted">{ta("zabranjeno_dobro_podsetnik")}</p>
      <Obavestenje vrsta="info">
        Prvi oglas članova <strong>bez potvrde</strong>. Oglas je već na Pijaci — ovde se odlučuje
        samo o doprinosu od 1.000 POEN (Pravilnik čl. 38). Odobrenjem POEN ulazi u opticaj, a
        opticaj okida osnivački korak, pa se odobrava oglas koji je stvarna ponuda. Odbijanje ne
        uklanja oglas; korisnik dobija razlog i može da objavi bolji oglas. Potvrđenim članovima
        doprinos se evidentira sam, pri objavi, i ovde se ne pojavljuje.
      </Obavestenje>

      <Segmenti
        oznaka={PRIKAZI.map(([, labela]) => labela).join(" / ")}
        vrednost={prikaz}
        onPromena={setPrikaz}
        opcije={PRIKAZI.map(([kljuc, labela]) => ({
          vrednost: kljuc,
          oznaka: `${labela}${kljuc === "cekanje" && ukupnoNaCekanju > 0 ? ` (${ukupnoNaCekanju})` : ""}`,
        }))}
      />

      {greska && (
        <Obavestenje vrsta="greska">{greska}</Obavestenje>
      )}

      {ucitava ? (
        <div className="text-sm text-kolo-muted py-8 text-center">Učitavanje…</div>
      ) : stavke.length === 0 ? (
        <PraznoStanje
          naslov={prikaz === "cekanje" ? "Nema oglasa koji čekaju odobrenje." : "Još nema odobrenih doprinosa."}
        />
      ) : (
        <div className="space-y-3">
          {stavke.map((s) => (
            <div key={s.id} className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-4">
              <div className="flex gap-4">
                {/* Sličica vodi na sam oglas — odluka se ne donosi po naslovu. */}
                {s.oglas && s.oglas.brojSlika > 0 ? (
                  <Link
                    href={`/pijaca/${s.oglas.id}`}
                    className="shrink-0 relative w-24 h-24 rounded-lg overflow-hidden bg-kolo-bg"
                  >
                    <Image
                      src={`/api/pijaca/slika/${s.oglas.id}/0`}
                      alt={s.oglas.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </Link>
                ) : (
                  <div className="shrink-0 w-24 h-24 rounded-lg bg-kolo-bg flex items-center justify-center text-xs text-kolo-muted text-center px-1">
                    bez slike
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {s.oglas ? (
                        <Link
                          href={`/pijaca/${s.oglas.id}`}
                          className="text-sm font-semibold text-kolo-green-700 hover:underline"
                        >
                          {s.oglas.title}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-kolo-muted">Oglas je obrisan</span>
                      )}
                      <div className="text-xs text-kolo-muted mt-0.5">
                        <Link href={profilHref(s.korisnik)} className="hover:underline">
                          <Pseudonim>{s.korisnik.pseudonim}</Pseudonim>
                        </Link>
                        {s.oglas?.location ? ` · ${s.oglas.location}` : ""}
                        {s.oglas?.category ? ` · ${s.oglas.category}` : ""}
                        {" · "}
                        {new Date(s.zabelezenAt).toLocaleString(intlTag(locale))}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-md bg-kolo-gold-100 text-kolo-gold-700 font-medium">
                      {s.iznos.toLocaleString(intlTag(locale))} POEN
                    </span>
                  </div>

                  {s.oglas?.opis && (
                    <p className="text-xs text-kolo-muted leading-relaxed whitespace-pre-line line-clamp-4">
                      {s.oglas.opis}
                    </p>
                  )}

                  {s.oglas?.status === "UKLONJEN" && (
                    <Obavestenje vrsta="upozorenje">
                      Oglas je uklonjen sa Pijace — doprinos se po pravilu ne odobrava.
                    </Obavestenje>
                  )}

                  {prikaz === "odobreni" ? (
                    <div className="text-xs text-kolo-muted">
                      Evidentirano{" "}
                      {s.evidentiranAt ? new Date(s.evidentiranAt).toLocaleString(intlTag(locale)) : "—"}
                      {s.okidac ? ` · okidač: ${s.okidac}` : ""}
                    </div>
                  ) : odbijaId === s.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={razlog}
                        onChange={(e) => setRazlog(e.target.value)}
                        rows={2}
                        placeholder="Razlog odbijanja — ide korisniku…"
                        aria-label="Razlog odbijanja — ide korisniku…"
                        className={KLASE_UNOSA}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => void odbij(s.id)}
                          disabled={radiId === s.id}
                          className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}
                        >
                          {radiId === s.id ? "Šaljem…" : "Potvrdi odbijanje"}
                        </button>
                        <button
                          onClick={() => {
                            setOdbijaId(null);
                            setRazlog("");
                          }}
                          className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                        >
                          Odustani
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => void odobri(s.id)}
                        disabled={radiId === s.id}
                        className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}
                      >
                        {radiId === s.id ? "Evidentiram…" : "Odobri 1.000 POEN"}
                      </button>
                      <button
                        onClick={() => {
                          setOdbijaId(s.id);
                          setRazlog("");
                          setGreska("");
                        }}
                        className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                      >
                        Odbij
                      </button>
                      {s.oglas && (
                        <Link
                          href={`/pijaca/${s.oglas.id}`}
                          className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                        >
                          Otvori oglas →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
