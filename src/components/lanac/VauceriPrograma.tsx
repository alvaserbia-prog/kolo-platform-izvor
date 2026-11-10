"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Dugme from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Fioka from "@/components/ui/Fioka";
import Obavestenje from "@/components/ui/Obavestenje";

/**
 * Vaučeri programa raspodele hrane i lanca proizvodnje i distribucije (nabavke čl. 43, 47, 52).
 *
 * Za svaku partiju: naziv gazdinstva, objekti, masa, broj vaučera, broj POEN-a po vaučeru i broj
 * preuzetih delova (čl. 47). 🔴 Uz broj POEN-a NIKAD dinarska vrednost — broj POEN-a po vaučeru
 * nije cena (čl. 43 st. 2). Dugme je „Uzmi vaučer", nikad „kupi". Vaučer uzima svaki punoletni
 * korisnik koji ima dovoljno POEN-a; najviše dva neiskorišćena ukupno, jedan po partiji.
 */
type Partija = {
  id: string;
  vrsta: "PROGRAM_HRANE" | "LANAC";
  naziv: string;
  davalac: string;
  objekti: string[];
  mestoPreuzimanja: string;
  masa: number | null;
  jedinica: string;
  brojVaucera: number;
  kolicinaPoVauceru: string;
  poen: number;
  preostalo: number;
  preuzeto: number;
  spremno: boolean;
  otvoreno: boolean;
  ucestvujem: boolean;
};
type Moj = {
  id: string;
  kod: string | null;
  status: string;
  poen: number;
  naziv: string;
  kolicina: string;
  objekat: string;
  mesto: string;
  spremno: boolean;
  rok: string | null;
  pristanakPovucen: boolean;
};

export default function VauceriPrograma() {
  const t = useTranslations("lanac");
  const locale = useLocale();
  const [partije, setPartije] = useState<Partija[] | null>(null);
  const [moji, setMoji] = useState<Moj[]>([]);
  const [izabrana, setIzabrana] = useState<Partija | null>(null);
  const [izjava, setIzjava] = useState(false);
  const [pristanak, setPristanak] = useState(false);
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState<{ vrsta: "uspeh" | "greska"; tekst: string } | null>(null);

  const ucitaj = useCallback(async () => {
    const r = await fetch("/api/lanac");
    if (!r.ok) return setPartije([]);
    const d = await r.json();
    setPartije(d.partije ?? []);
    setMoji(d.moji ?? []);
  }, []);
  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const datum = (s: string | null) => (s ? new Date(s).toLocaleDateString(intlTag(locale)) : "—");

  async function posalji(telo: Record<string, unknown>, uspeh: string) {
    setRadi(true);
    setPoruka(null);
    try {
      const r = await fetch("/api/lanac", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(telo) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setPoruka({ vrsta: "greska", tekst: d.error ?? t("greska") });
      setPoruka({ vrsta: "uspeh", tekst: uspeh });
      setIzabrana(null);
      setIzjava(false);
      setPristanak(false);
      await ucitaj();
    } finally {
      setRadi(false);
    }
  }

  if (partije === null) return null;
  const dostupne = partije.filter((p) => p.otvoreno && p.preostalo > 0 && !p.ucestvujem);
  const objavljene = partije;
  if (objavljene.length === 0 && moji.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="vauceri-programa">
      <NaslovSekcije id="vauceri-programa" opis={t("opis_sekcije")}>{t("naslov_sekcije")}</NaslovSekcije>
      {poruka && <Obavestenje vrsta={poruka.vrsta}>{poruka.tekst}</Obavestenje>}

      {dostupne.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {dostupne.map((p) => (
            <Kartica key={p.id} as="article" padding="sm" className="space-y-1">
              <p className="font-semibold text-kolo-text">{p.naziv}</p>
              <p className="text-sm text-kolo-muted">{t("davalac_objekat", { davalac: p.davalac, objekat: p.objekti.join(", ") })}</p>
              <p className="text-sm text-kolo-muted">{t("kolicina_po_vauceru", { kolicina: p.kolicinaPoVauceru })} · {p.mestoPreuzimanja}</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-lg font-bold text-kolo-green-700">{t("poen_po_vauceru", { poen: broj(p.poen) })}</span>
                <span className="text-sm text-kolo-muted">{t("preostalo", { broj: p.preostalo })}</span>
              </div>
              <Dugme velicina="sm" onClick={() => setIzabrana(p)}>{t("detalj")}</Dugme>
            </Kartica>
          ))}
        </div>
      )}

      {moji.length > 0 && (
        <div className="space-y-2">
          <NaslovSekcije nivo={3}>{t("moji_naslov")}</NaslovSekcije>
          {moji.map((v) => (
            <Kartica key={v.id} padding="sm" className="space-y-1">
              <p className="font-semibold text-kolo-text">{v.naziv}</p>
              <p className="text-sm text-kolo-muted">{t(`status_${v.status}`)} · {v.objekat}, {v.mesto}</p>
              {v.status === "DODELJEN" && (
                <>
                  <p className="text-sm">{v.spremno ? t("spremno_rok", { datum: datum(v.rok) }) : t("nije_spremno")}</p>
                  {v.kod && <p className="font-mono text-lg tracking-widest text-kolo-green-700">{v.kod.slice(0, 5)}-{v.kod.slice(5)}</p>}
                </>
              )}
              {!v.pristanakPovucen && (
                <Dugme velicina="sm" varijanta="tiho" disabled={radi} onClick={() => posalji({ radnja: "povuci-pristanak", id: v.id }, t("pristanak_povucen"))}>
                  {t("povuci_pristanak")}
                </Dugme>
              )}
            </Kartica>
          ))}
        </div>
      )}

      {objavljene.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-kolo-green-700">{t("javnost_naslov")}</summary>
          <ul className="mt-2 space-y-2">
            {objavljene.map((p) => (
              <li key={p.id} className="border-b border-kolo-border pb-2 text-kolo-muted">
                <span className="font-medium text-kolo-text">{p.naziv}</span> — {t("javnost_red", {
                  davalac: p.davalac,
                  objekti: p.objekti.join(", "),
                  masa: p.masa == null ? "—" : `${broj(p.masa)} ${p.jedinica}`,
                  vaucera: p.brojVaucera,
                  poen: broj(p.poen),
                  preuzeto: p.preuzeto,
                })}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-sm text-kolo-muted">
        <Link href="/vauceri/program" className="inline-flex min-h-10 items-center font-medium text-kolo-green-700 underline">{t("rad_link")}</Link>
      </p>

      {izabrana && (
        <Fioka naslov={izabrana.naziv} onZatvori={() => setIzabrana(null)}>
          <div className="space-y-3 text-sm">
            <p>{t("davalac_objekat", { davalac: izabrana.davalac, objekat: izabrana.objekti.join(", ") })}</p>
            <p>{t("mesto_preuzimanja", { mesto: izabrana.mestoPreuzimanja })}</p>
            <p className="text-xl font-bold text-kolo-green-700">{t("poen_po_vauceru", { poen: broj(izabrana.poen) })}</p>
            <ul className="list-disc space-y-1 pl-5 text-kolo-text">
              <li>{t("tacka_ponistenje")}</li>
              <li>{t("tacka_rok")}</li>
              <li>{t("tacka_najvise_dva")}</li>
            </ul>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 size-5" checked={izjava} onChange={(e) => setIzjava(e.target.checked)} />
              <span>{t("izjava_nepovezan")}</span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 size-5" checked={pristanak} onChange={(e) => setPristanak(e.target.checked)} />
              <span>{t("pristanak_prikaz")}</span>
            </label>
            <Dugme
              velicina="lg"
              punaSirina
              disabled={radi || !izjava || !pristanak}
              onClick={() => posalji({ radnja: "uzmi", id: izabrana.id, izjavaNepovezan: izjava, pristanakPrikaz: pristanak }, t("uzet"))}
            >
              {t("uzmi_vaucer")}
            </Dugme>
          </div>
        </Fioka>
      )}
    </section>
  );
}
