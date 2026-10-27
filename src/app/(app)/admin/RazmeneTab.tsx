"use client";

/**
 * Razmene — prijave da razmena povodom prepisa POEN-a nije ispunjena.
 *
 * Odluka je jedna od dve: poništi prepis (protivzapis) ili odbaci prijavu. Obe
 * traže obrazloženje, jer obe idu čoveku.
 *
 * 🔴 Poništenje vraća CEO prepisani iznos i zapis primaoca sme u minus (odluka
 * vlasnika 2026-08-15) — minus radi isto što i nadoknada iz čl. 36 dokaza stvarnosti. Zato uz
 * svaku stavku stoji stanje primaoca i stanje POSLE poništenja: odluka se
 * donosi znajući da li čoveka ostavlja u nadoknadi.
 *
 * Ovo NIJE moderacija (uklanjanje oglasa je tab „Pijaca") i nije prigovor na
 * odluku Fondacije (tab „Prigovori"). Tri različite odluke, tri taba.
 */

import { useState, useEffect, useCallback } from "react";
import { intlTag } from "@/lib/format";
import { useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import { iznosPovracaja, stanjePosle, idUMinus } from "@/lib/razmena-prijava";
import { useStanjeUAdresi } from "@/hooks/useStanjeUAdresi";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import Segmenti from "@/components/ui/Segmenti";
import { useDijalog } from "@/components/ui/Dijalog";

type Prikaz = "otvorene" | "resene";

interface Stavka {
  id: string;
  opis: string;
  status: string;
  odluka: string | null;
  vraceno: number | null;
  createdAt: string;
  resenAt: string | null;
  prepis: { id: string; iznos: number; opis: string | null; createdAt: string };
  prijavioc: { id: string; pseudonim: string };
  protiv: { id: string; pseudonim: string; tipKorisnika: string; stanje: number };
}

const PRIKAZI: [Prikaz, string][] = [
  ["otvorene", "Otvorene"],
  ["resene", "Rešene"],
];

export default function RazmeneTab({ onDone }: { onDone?: () => void }) {
  const locale = useLocale();
  // Pod-prikaz živi u adresi, da „nazad" sa oglasa ili profila
  // vrati na isti spisak.
  const [prikazIzAdrese, setPrikaz] = useStanjeUAdresi("prikaz", "otvorene");
  const prikaz: Prikaz = PRIKAZI.find(([k]) => k === prikazIzAdrese)?.[0] ?? "otvorene";
  const [stavke, setStavke] = useState<Stavka[]>([]);
  const [ukupnoOtvorenih, setUkupnoOtvorenih] = useState(0);
  const [ucitava, setUcitava] = useState(true);
  const [greska, setGreska] = useState("");
  const [radiId, setRadiId] = useState<string | null>(null);
  // Prijava čija je forma otvorena, koja odluka se piše i tekst obrazloženja.
  const [odluka, setOdluka] = useState<{ id: string; vrsta: "ponisti" | "odbaci" } | null>(null);
  const [tekst, setTekst] = useState("");
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    setUcitava(true);
    try {
      const res = await fetch(`/api/admin/prijave-razmene?prikaz=${prikaz}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? "Greška pri učitavanju.");
        return;
      }
      setStavke(data.stavke ?? []);
      setUkupnoOtvorenih(data.ukupnoOtvorenih ?? 0);
      setGreska("");
    } finally {
      setUcitava(false);
    }
  }, [prikaz]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function posalji(s: Stavka, vrsta: "ponisti" | "odbaci") {
    if (tekst.trim().length < 10) {
      setGreska("Obrazloženje je obavezno — ide korisniku i u revizijski dnevnik.");
      return;
    }
    if (vrsta === "ponisti") {
      const nakon = stanjePosle(s.protiv.stanje, s.prepis.iznos);
      const poruka = idUMinus(s.protiv.stanje, s.prepis.iznos)
        ? `Poništiti prepis i vratiti ${iznosPovracaja(s.prepis.iznos).toLocaleString("sr-RS")} POEN? Zapis primaoca time ide u minus — ostaje mu nadoknada od ${Math.abs(nakon).toLocaleString("sr-RS")} POEN.`
        : `Poništiti prepis i vratiti ${iznosPovracaja(s.prepis.iznos).toLocaleString("sr-RS")} POEN?`;
      if (!(await potvrdi({ poruka, opasno: true, dugme: "Poništi prepis" }))) return;
    }
    setRadiId(s.id);
    setGreska("");
    try {
      const res = await fetch(`/api/admin/prijave-razmene/${s.id}/${vrsta}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odluka: tekst.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? "Greška pri odlučivanju.");
        return;
      }
      setOdluka(null);
      setTekst("");
      await ucitaj();
      onDone?.();
    } finally {
      setRadiId(null);
    }
  }

  const datum = (iso: string) =>
    new Date(iso).toLocaleString(intlTag(locale), {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Belgrade",
    });

  return (
    <div className="space-y-4">
      {dijalog}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Segmenti
          oznaka={PRIKAZI.map(([, labela]) => labela).join(" / ")}
          vrednost={prikaz}
          onPromena={setPrikaz}
          opcije={PRIKAZI.map(([kljuc, labela]) => ({
            vrednost: kljuc,
            oznaka: `${labela}${kljuc === "otvorene" && ukupnoOtvorenih > 0 ? ` (${ukupnoOtvorenih})` : ""}`,
          }))}
        />
        <p className="text-xs text-kolo-muted max-w-xl">
          Poništenje vraća ceo prepisani iznos i zapis primaoca ume da ode u minus — tada na njemu
          stoji nadoknada: nije dug, popunjavaju je POENI koji pristignu, a prepis drugome je
          moguć tek preko nule. Za razmenu odgovaraju sami korisnici; ovo je odluka Fondacije o
          prepisu, ne presuda o razmeni.
        </p>
      </div>

      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}

      {ucitava ? (
        <p className="text-sm text-kolo-muted">Učitavanje…</p>
      ) : stavke.length === 0 ? (
        <p className="text-sm text-kolo-muted">
          {prikaz === "otvorene" ? "Nema otvorenih prijava." : "Nema rešenih prijava."}
        </p>
      ) : (
        <div className="space-y-3">
          {stavke.map((s) => {
            const nakon = stanjePosle(s.protiv.stanje, s.prepis.iznos);
            const uMinus = idUMinus(s.protiv.stanje, s.prepis.iznos);
            return (
              <div key={s.id} className="bg-kolo-surface rounded-kartica border border-kolo-border p-4 space-y-3 shadow-kartica">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                  <a href={profilHref(s.prijavioc)} className="font-semibold text-kolo-green-700 hover:underline">
                    <Pseudonim>{s.prijavioc.pseudonim}</Pseudonim>
                  </a>
                  <span className="text-kolo-muted">prepisao/la</span>
                  <span className="font-bold text-kolo-text">{s.prepis.iznos.toLocaleString("sr-RS")} POEN</span>
                  <span className="text-kolo-muted">→</span>
                  <a href={profilHref(s.protiv)} className="font-semibold text-kolo-green-700 hover:underline">
                    <Pseudonim>{s.protiv.pseudonim}</Pseudonim>
                  </a>
                  <span className="text-xs text-kolo-muted">({datum(s.prepis.createdAt)})</span>
                </div>

                {s.prepis.opis && (
                  <p className="text-xs text-kolo-muted">Opis prepisa: „{s.prepis.opis}"</p>
                )}

                <p className="text-sm text-kolo-text bg-kolo-bg rounded-kontrola px-3 py-2">{s.opis}</p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-kolo-muted">
                  <span>Prijavljeno: {datum(s.createdAt)}</span>
                  <span>
                    Stanje primaoca: <strong className="text-kolo-text">{s.protiv.stanje.toLocaleString("sr-RS")}</strong>
                  </span>
                  <span>
                    Posle poništenja:{" "}
                    <strong className={uMinus ? "text-kolo-danger" : "text-kolo-green-700"}>
                      {nakon.toLocaleString("sr-RS")} POEN
                    </strong>
                    {uMinus && " (nadoknada)"}
                  </span>
                </div>

                {s.status !== "OTVORENA" ? (
                  <div className="text-xs text-kolo-muted border-t border-kolo-border pt-2 space-y-1">
                    <p>
                      <strong className="text-kolo-text">
                        {s.status === "PONISTENA" ? "Prepis poništen" : "Prijava odbačena"}
                      </strong>
                      {s.resenAt ? ` · ${datum(s.resenAt)}` : ""}
                      {s.status === "PONISTENA" && s.vraceno !== null
                        ? ` · vraćeno ${s.vraceno.toLocaleString("sr-RS")} POEN`
                        : ""}
                    </p>
                    {s.odluka && <p>Obrazloženje: {s.odluka}</p>}
                  </div>
                ) : odluka?.id === s.id ? (
                  <div className="space-y-2 border-t border-kolo-border pt-3">
                    <textarea
                      value={tekst}
                      onChange={(e) => setTekst(e.target.value)}
                      rows={3}
                      placeholder="Obrazloženje — ide korisniku i u revizijski dnevnik."
                      aria-label="Obrazloženje — ide korisniku i u revizijski dnevnik."
                      className={KLASE_UNOSA}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => posalji(s, odluka.vrsta)}
                        disabled={radiId === s.id}
                        className={klaseDugmeta()}
                      >
                        {odluka.vrsta === "ponisti" ? "Poništi prepis" : "Odbaci prijavu"}
                      </button>
                      <button
                        onClick={() => { setOdluka(null); setTekst(""); }}
                        className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
                      >
                        Odustani
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 border-t border-kolo-border pt-3">
                    <button
                      onClick={() => { setOdluka({ id: s.id, vrsta: "ponisti" }); setTekst(""); setGreska(""); }}
                      className={klaseDugmeta()}
                    >
                      Poništi prepis
                    </button>
                    <button
                      onClick={() => { setOdluka({ id: s.id, vrsta: "odbaci" }); setTekst(""); setGreska(""); }}
                      className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
                    >
                      Odbaci prijavu
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
