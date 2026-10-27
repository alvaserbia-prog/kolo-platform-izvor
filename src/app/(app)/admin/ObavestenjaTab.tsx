"use client";

/**
 * Cirkularna SISTEMSKA obaveštenja — sastavljanje i slanje svim korisnicima.
 *
 * Namena je uska: izmene Uslova/Politike (Uslovi čl. 43, Politika čl. 47),
 * planirani zastoj duži od 24h (Uslovi čl. 36). NIJE kanal za vesti ni bilten —
 * za to je potrebna dopuna Politike i zaseban pristanak korisnika.
 *
 * Slanje ide u porcijama: svaki poziv obradi koliko stigne, pa se ponavlja dok
 * ne prođe cela lista. Zato ekran sam nastavlja dok napredak ne bude 100%.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { intlTag } from "@/lib/format";
import { useTranslations, useLocale } from "next-intl";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import ObavestenjeBoks from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useDijalog } from "@/components/ui/Dijalog";

type Status = "NACRT" | "U_SLANJU" | "POSLATO" | "PREKINUTO";

interface Obavestenje {
  id: string;
  naslov: string;
  tekst: string;
  link: string | null;
  pravniOsnov: string;
  status: Status;
  ukupno: number;
  poslato: number;
  neuspesno: number;
  createdAt: string;
  zavrsenoAt: string | null;
  kreiraoPseudonim: string;
}

export default function ObavestenjaTab() {
  const locale = useLocale();
  const t = useTranslations("admin");
  const { dijalog, potvrdi } = useDijalog();

  const [obavestenja, setObavestenja] = useState<Obavestenje[]>([]);
  const [primalaca, setPrimalaca] = useState(0);
  const [ucitava, setUcitava] = useState(true);

  const [naslov, setNaslov] = useState("");
  const [tekst, setTekst] = useState("");
  const [link, setLink] = useState("");
  const [pravniOsnov, setPravniOsnov] = useState("");
  const [greska, setGreska] = useState("");
  const [poruka, setPoruka] = useState("");
  const [radi, setRadi] = useState(false);

  // Id obaveštenja čije slanje je u toku — dok je postavljen, ekran sam nastavlja.
  const [saljeId, setSaljeId] = useState<string | null>(null);
  const prekinuoRef = useRef(false);

  const ucitaj = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sistemsko-obavestenje");
      if (!res.ok) return;
      const data = await res.json();
      setObavestenja(data.obavestenja ?? []);
      setPrimalaca(data.primalaca ?? 0);
    } finally {
      setUcitava(false);
    }
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function napraviNacrt(e: React.FormEvent) {
    e.preventDefault();
    setGreska("");
    setPoruka("");
    setRadi(true);
    try {
      const res = await fetch("/api/admin/sistemsko-obavestenje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naslov, tekst, link: link || undefined, pravniOsnov }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? t("obav_greska"));
        return;
      }
      setNaslov("");
      setTekst("");
      setLink("");
      setPravniOsnov("");
      setPoruka(t("obav_nacrt_napravljen"));
      await ucitaj();
    } finally {
      setRadi(false);
    }
  }

  async function proba(id: string) {
    setGreska("");
    setPoruka("");
    const res = await fetch(`/api/admin/sistemsko-obavestenje/${id}/proba`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setGreska(data.error ?? t("obav_greska"));
    else setPoruka(t("obav_proba_poslata", { email: data.poslatoNa }));
  }

  /** Zove rutu za slanje u petlji dok ne javi da je gotovo. */
  async function posalji(id: string) {
    if (!(await potvrdi({ poruka: t("obav_potvrda", { broj: primalaca }), dugme: t("obav_posalji") }))) return;
    setGreska("");
    setPoruka("");
    prekinuoRef.current = false;
    setSaljeId(id);
    try {
      for (;;) {
        const res = await fetch(`/api/admin/sistemsko-obavestenje/${id}/posalji`, { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setGreska(data.error ?? t("obav_greska"));
          break;
        }
        await ucitaj();
        if (data.zavrseno || prekinuoRef.current) break;
      }
    } finally {
      setSaljeId(null);
      await ucitaj();
    }
  }

  async function prekini(id: string) {
    prekinuoRef.current = true;
    await fetch(`/api/admin/sistemsko-obavestenje/${id}/prekini`, { method: "POST" });
    await ucitaj();
  }

  const oznakaStatusa: Record<Status, string> = {
    NACRT: t("obav_status_nacrt"),
    U_SLANJU: t("obav_status_u_slanju"),
    POSLATO: t("obav_status_poslato"),
    PREKINUTO: t("obav_status_prekinuto"),
  };

  return (
    <div className="space-y-6">
      {dijalog}
      {/* Upozorenje o dozvoljenoj nameni — stoji iznad forme, ne u dokumentaciji. */}
      <ObavestenjeBoks vrsta="upozorenje" naslov={t("obav_upozorenje_naslov")}>
        <p>{t("obav_upozorenje")}</p>
      </ObavestenjeBoks>

      <form onSubmit={napraviNacrt} className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 space-y-4 shadow-kartica">
        <div>
          <h2 className="text-base font-semibold text-kolo-muted">{t("obav_novo")}</h2>
          <p className="text-xs text-kolo-muted mt-1">{t("obav_primalaca", { broj: primalaca })}</p>
        </div>

        <Polje oznaka={t("obav_naslov_polje")}>
          <input
            value={naslov}
            onChange={(e) => setNaslov(e.target.value)}
            maxLength={150}
            className={KLASE_UNOSA}
            placeholder={t("obav_naslov_placeholder")} aria-label={t("obav_naslov_placeholder")}
          />
        </Polje>

        <Polje oznaka={t("obav_tekst_polje")}>
          <textarea
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            rows={5}
            maxLength={5000}
            className={KLASE_UNOSA}
            placeholder={t("obav_tekst_placeholder")} aria-label={t("obav_tekst_placeholder")}
          />
        </Polje>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Polje oznaka={t("obav_osnov_polje")} pomoc={t("obav_osnov_opis")}>
            <input
              value={pravniOsnov}
              onChange={(e) => setPravniOsnov(e.target.value)}
              maxLength={200}
              className={KLASE_UNOSA}
              placeholder={t("obav_osnov_placeholder")} aria-label={t("obav_osnov_placeholder")}
            />
          </Polje>
          <Polje oznaka={t("obav_link_polje")} pomoc={t("obav_link_opis")}>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className={KLASE_UNOSA}
              placeholder="/uslovi"
            />
          </Polje>
        </div>

        {greska && (
          <ObavestenjeBoks vrsta="greska">{greska}</ObavestenjeBoks>
        )}
        {poruka && (
          <ObavestenjeBoks vrsta="uspeh">{poruka}</ObavestenjeBoks>
        )}

        <button
          type="submit"
          disabled={radi || !naslov.trim() || !tekst.trim() || !pravniOsnov.trim()}
          className={klaseDugmeta()}
        >
          {radi ? t("obav_cuvam") : t("obav_napravi")}
        </button>
      </form>

      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
        <h2 className="text-base font-semibold text-kolo-muted mb-4">{t("obav_lista")}</h2>

        {ucitava ? (
          <p className="text-sm text-kolo-muted">{t("obav_ucitavam")}</p>
        ) : obavestenja.length === 0 ? (
          <PraznoStanje kompaktno naslov={t("obav_nema")} />
        ) : (
          <ul className="space-y-4">
            {obavestenja.map((o) => {
              const procenat = o.ukupno > 0 ? Math.round(((o.poslato + o.neuspesno) / o.ukupno) * 100) : 0;
              const uToku = saljeId === o.id;
              return (
                <li key={o.id} className="bg-kolo-bg rounded-kontrola p-4">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-kolo-text truncate">{o.naslov}</p>
                      <p className="text-xs text-kolo-muted mt-0.5">
                        {o.pravniOsnov} · {o.kreiraoPseudonim} ·{" "}
                        {new Date(o.createdAt).toLocaleDateString(intlTag(locale))}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-kolo-muted shrink-0">
                      {oznakaStatusa[o.status]}
                    </span>
                  </div>

                  <p className="text-sm text-kolo-muted whitespace-pre-wrap mb-3">{o.tekst}</p>

                  {o.status !== "NACRT" && (
                    <div className="mb-3">
                      <div className="h-1.5 rounded-full bg-kolo-border overflow-hidden">
                        <div
                          className="h-full bg-kolo-green-700 transition-all"
                          style={{ width: `${procenat}%` }}
                        />
                      </div>
                      <p className="text-xs text-kolo-muted mt-1">
                        {t("obav_napredak", {
                          poslato: o.poslato,
                          ukupno: o.ukupno,
                          neuspesno: o.neuspesno,
                        })}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => proba(o.id)}
                      className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
                    >
                      {t("obav_proba")}
                    </button>

                    {(o.status === "NACRT" || o.status === "U_SLANJU") && !uToku && (
                      <button
                        type="button"
                        onClick={() => posalji(o.id)}
                        className={klaseDugmeta()}
                      >
                        {o.status === "NACRT" ? t("obav_posalji") : t("obav_nastavi")}
                      </button>
                    )}

                    {uToku && (
                      <>
                        <span className="px-4 py-2 text-sm text-kolo-muted">{t("obav_salje")}</span>
                        <button
                          type="button"
                          onClick={() => prekini(o.id)}
                          className={klaseDugmeta({ varijanta: "opasno", velicina: "md" })}
                        >
                          {t("obav_prekini")}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
