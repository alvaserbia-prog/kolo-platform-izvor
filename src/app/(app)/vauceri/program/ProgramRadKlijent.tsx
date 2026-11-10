"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Stranica from "@/components/ui/Stranica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import Fioka from "@/components/ui/Fioka";
import Ucitavanje from "@/components/ui/Ucitavanje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import OdgovoriHraneForma, { type OdgovoriUnos } from "@/components/lanac/OdgovoriHraneForma";
import { VRSTE_HRANE_PROGRAMA } from "@/lib/lanac-pravila";

/**
 * Radni ekran gazdinstva, objekta i partnera u programu raspodele hrane i lancu (nabavke čl. 39–46,
 * 50). Ovde se ne prikazuje broj POEN-a: doprinos evidentira Protokol, a ugovor ga ne sadrži.
 */
type Poziv = { id: string; naziv: string; opis: string; uslovi: string; rokObradeDana: number };
type Prijava = { id: string; pozivId: string; uloga: string; naziv: string; mesto: string; status: string; razlogOdbijanja: string | null };
type Karika = {
  id: string;
  uloga: "DAVALAC_SIROVINE" | "PARTNER" | "POSLEDNJI";
  naziv: string;
  ugovorTekst: string | null;
  ugovorPrihvacenAt: string | null;
  izvrsenoPrijavljenoAt: string | null;
  izvrsenjeUtvrdjenoAt: string | null;
  lanac: { id: string; vrsta: "PROGRAM_HRANE" | "LANAC"; naziv: string; status: string; spremno: boolean; vrstaHrane: string | null; jedinica: string; nepreuzetiMogu: boolean };
  mozeBeleziPredaju: boolean;
  prvaPredaja: boolean;
  zaPotvrdu: { id: string; kolicina: number; oznakeZivotinja: string | null; obimUsluge: number | null }[];
};
type Rad = { pozivi: Poziv[]; prijave: Prijava[]; karike: Karika[] };

export default function ProgramRadKlijent() {
  const t = useTranslations("lanac");
  const locale = useLocale();
  const [rad, setRad] = useState<Rad | null>(null);
  const [poruka, setPoruka] = useState<{ vrsta: "uspeh" | "greska"; tekst: string } | null>(null);
  const [radi, setRadi] = useState(false);
  const [prijavaZa, setPrijavaZa] = useState<{ poziv: Poziv; uloga: "GAZDINSTVO" | "OBJEKAT" } | null>(null);
  const [forma, setForma] = useState<Record<string, string | boolean>>({});
  const [hrana, setHrana] = useState<OdgovoriUnos>({});
  const [ugovor, setUgovor] = useState<Karika | null>(null);
  const [zapisnikZa, setZapisnikZa] = useState<Karika | null>(null);
  const [kod, setKod] = useState("");
  const [proveraKoda, setProveraKoda] = useState<{ stanje: string; naziv: string | null; pseudonim: string | null } | null>(null);

  const ucitaj = useCallback(async () => {
    const r = await fetch("/api/lanac?rad=1");
    setRad(r.ok ? await r.json() : { pozivi: [], prijave: [], karike: [] });
  }, []);
  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function posalji(telo: Record<string, unknown>, uspeh: string): Promise<boolean> {
    setRadi(true);
    setPoruka(null);
    try {
      const r = await fetch("/api/lanac", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(telo) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setPoruka({ vrsta: "greska", tekst: d.error ?? t("greska") });
        return false;
      }
      setPoruka({ vrsta: "uspeh", tekst: uspeh });
      await ucitaj();
      return true;
    } finally {
      setRadi(false);
    }
  }

  const f = (k: string) => (typeof forma[k] === "string" ? (forma[k] as string) : "");
  const setF = (k: string, v: string | boolean) => setForma((s) => ({ ...s, [k]: v }));
  const imaKarikaPoslednji = rad?.karike.some((k) => k.uloga === "POSLEDNJI") ?? false;

  return (
    <Stranica>
      <NaslovStranice naslov={t("rad_naslov")} opis={t("rad_opis")} nazad={{ href: "/vauceri", oznaka: t("nazad") }} />
      {poruka && <Obavestenje vrsta={poruka.vrsta}>{poruka.tekst}</Obavestenje>}
      {!rad ? (
        <Ucitavanje />
      ) : (
        <>
          <section className="space-y-3">
            <NaslovSekcije opis={t("pozivi_opis")}>{t("pozivi_naslov")}</NaslovSekcije>
            {rad.pozivi.length === 0 && <PraznoStanje kompaktno naslov={t("pozivi_prazno")} />}
            {rad.pozivi.map((p) => (
              <Kartica key={p.id} padding="sm" className="space-y-2">
                <p className="font-semibold text-kolo-text">{p.naziv}</p>
                <p className="whitespace-pre-line text-sm text-kolo-text">{p.opis}</p>
                <p className="whitespace-pre-line text-sm text-kolo-muted">{t("uslovi", { uslovi: p.uslovi, dana: p.rokObradeDana })}</p>
                <div className="flex flex-wrap gap-2">
                  <Dugme velicina="sm" onClick={() => { setForma({}); setHrana({}); setPrijavaZa({ poziv: p, uloga: "GAZDINSTVO" }); }}>{t("prijavi_gazdinstvo")}</Dugme>
                  <Dugme velicina="sm" varijanta="sekundarno" onClick={() => { setForma({}); setPrijavaZa({ poziv: p, uloga: "OBJEKAT" }); }}>{t("prijavi_objekat")}</Dugme>
                </div>
              </Kartica>
            ))}
          </section>

          {rad.prijave.length > 0 && (
            <section className="space-y-2">
              <NaslovSekcije>{t("prijave_naslov")}</NaslovSekcije>
              {rad.prijave.map((p) => (
                <Kartica key={p.id} padding="sm" className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm">
                    <span className="font-medium text-kolo-text">{p.naziv}</span> · {t(`uloga_${p.uloga}`)} · {p.mesto} · {t(`prijava_${p.status}`)}
                    {p.razlogOdbijanja && <span className="block text-kolo-muted">{p.razlogOdbijanja}</span>}
                  </span>
                  {p.status === "NA_PREGLEDU" && (
                    <Dugme velicina="sm" varijanta="tiho" disabled={radi} onClick={() => posalji({ radnja: "povuci-prijavu", id: p.id }, t("prijava_povucena"))}>{t("povuci")}</Dugme>
                  )}
                </Kartica>
              ))}
            </section>
          )}

          <section className="space-y-3">
            <NaslovSekcije>{t("karike_naslov")}</NaslovSekcije>
            {rad.karike.length === 0 && <PraznoStanje kompaktno naslov={t("karike_prazno")} />}
            {rad.karike.map((k) => (
              <Kartica key={k.id} padding="sm" className="space-y-2">
                <p className="font-semibold text-kolo-text">{k.lanac.naziv}</p>
                <p className="text-sm text-kolo-muted">{t(`vrsta_${k.lanac.vrsta}`)} · {t(`karika_${k.uloga}`)} · {k.naziv} · {t(`lanac_status_${k.lanac.status}`)}</p>
                <div className="flex flex-wrap gap-2">
                  {k.ugovorTekst && (
                    <Dugme velicina="sm" varijanta="sekundarno" onClick={() => setUgovor(k)}>
                      {k.ugovorPrihvacenAt ? t("ugovor_procitaj") : t("ugovor_potvrdi")}
                    </Dugme>
                  )}
                  {k.mozeBeleziPredaju && (
                    <Dugme velicina="sm" onClick={() => { setForma({}); setZapisnikZa(k); }}>{t("zapisnik_zabelezi")}</Dugme>
                  )}
                  {k.uloga !== "DAVALAC_SIROVINE" && k.ugovorPrihvacenAt && !k.izvrsenoPrijavljenoAt && k.lanac.vrsta === "LANAC" && (
                    <Dugme velicina="sm" varijanta="sekundarno" disabled={radi} onClick={() => posalji({ radnja: "izvrseno", id: k.id }, t("izvrseno_prijavljeno"))}>{t("izvrseno")}</Dugme>
                  )}
                  {k.uloga === "POSLEDNJI" && k.lanac.status === "VAUCERI_IZDATI" && !k.lanac.spremno && (
                    <Dugme velicina="sm" disabled={radi} onClick={() => posalji({ radnja: "spremno", id: k.lanac.id }, t("spremno_oznaceno"))}>{t("spremno")}</Dugme>
                  )}
                  {k.lanac.nepreuzetiMogu && (
                    <Dugme velicina="sm" varijanta="sekundarno" disabled={radi} onClick={() => posalji({ radnja: "nepreuzeti", id: k.lanac.id }, t("nepreuzeti_preuzeti"))}>{t("nepreuzeti")}</Dugme>
                  )}
                </div>
                {k.lanac.nepreuzetiMogu && <p className="text-xs text-kolo-muted">{t("nepreuzeti_napomena")}</p>}
                {k.zaPotvrdu.map((z) => (
                  <div key={z.id} className="space-y-1 rounded-kontrola bg-kolo-bg px-3 py-2 text-sm">
                    <p>{t("zapisnik_za_potvrdu", { kolicina: z.kolicina.toLocaleString(intlTag(locale)), jedinica: k.lanac.jedinica })}</p>
                    {z.oznakeZivotinja && <p className="text-kolo-muted">{t("zapisnik_oznake", { oznake: z.oznakeZivotinja })}</p>}
                    <Dugme velicina="sm" disabled={radi} onClick={() => posalji({ radnja: "potvrdi-predaju", id: z.id }, t("predaja_potvrdjena"))}>{t("potvrdi_predaju")}</Dugme>
                  </div>
                ))}
              </Kartica>
            ))}
          </section>

          {imaKarikaPoslednji && (
            <section className="space-y-2">
              <NaslovSekcije opis={t("kod_opis")}>{t("kod_naslov")}</NaslovSekcije>
              <div className="flex flex-wrap gap-2">
                <input className={`${KLASE_UNOSA} max-w-xs`} value={kod} onChange={(e) => setKod(e.target.value)} aria-label={t("kod_naslov")} />
                <Dugme varijanta="sekundarno" disabled={radi || !kod} onClick={async () => {
                  const r = await fetch("/api/lanac", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ radnja: "proveri-kod", kod }) });
                  setProveraKoda(r.ok ? await r.json() : null);
                }}>{t("kod_proveri")}</Dugme>
                <Dugme disabled={radi || !kod} onClick={async () => { if (await posalji({ radnja: "potvrdi-preuzimanje", kod }, t("preuzimanje_potvrdjeno"))) { setKod(""); setProveraKoda(null); } }}>{t("kod_potvrdi")}</Dugme>
              </div>
              {proveraKoda && (
                <p className="text-sm">{t(`kod_stanje_${proveraKoda.stanje}`)}{proveraKoda.naziv ? ` · ${proveraKoda.naziv}` : ""}{proveraKoda.pseudonim ? ` · ${proveraKoda.pseudonim}` : ""}</p>
              )}
            </section>
          )}
        </>
      )}

      {prijavaZa && (
        <Fioka naslov={prijavaZa.uloga === "GAZDINSTVO" ? t("prijavi_gazdinstvo") : t("prijavi_objekat")} onZatvori={() => setPrijavaZa(null)}>
          <div className="space-y-3">
            <Polje oznaka={prijavaZa.uloga === "GAZDINSTVO" ? t("naziv_gazdinstva") : t("naziv_objekta")}>
              <input className={KLASE_UNOSA} value={f("naziv")} onChange={(e) => setF("naziv", e.target.value)} />
            </Polje>
            <Polje oznaka={t("mesto")} pomoc={t("mesto_pomoc")}>
              <input className={KLASE_UNOSA} value={f("mesto")} onChange={(e) => setF("mesto", e.target.value)} />
            </Polje>
            <Polje oznaka={t("adresa")}>
              <input className={KLASE_UNOSA} value={f("adresa")} onChange={(e) => setF("adresa", e.target.value)} />
            </Polje>
            {prijavaZa.uloga === "GAZDINSTVO" ? (
              <>
                <Polje oznaka={t("bpg")} pomoc={t("bpg_pomoc")}>
                  <input className={KLASE_UNOSA} inputMode="numeric" value={f("bpg")} onChange={(e) => setF("bpg", e.target.value)} />
                </Polje>
                <OdgovoriHraneForma vrednost={hrana} onPromena={setHrana} vrste={VRSTE_HRANE_PROGRAMA} />
                <Polje oznaka={t("cenovnik_cena")} pomoc={t("cenovnik_cena_pomoc")} opciono={t("opciono")}>
                  <input className={KLASE_UNOSA} inputMode="decimal" value={f("cenovnikCena")} onChange={(e) => setF("cenovnikCena", e.target.value)} />
                </Polje>
              </>
            ) : (
              <>
                <Polje oznaka={t("broj_odobrenja")}>
                  <input className={KLASE_UNOSA} value={f("brojOdobrenja")} onChange={(e) => setF("brojOdobrenja", e.target.value)} />
                </Polje>
                <Polje oznaka={t("usluga_opis")}>
                  <input className={KLASE_UNOSA} value={f("uslugaOpis")} onChange={(e) => setF("uslugaOpis", e.target.value)} />
                </Polje>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Polje oznaka={t("usluga_jedinica")}>
                    <input className={KLASE_UNOSA} value={f("uslugaJedinica")} onChange={(e) => setF("uslugaJedinica", e.target.value)} />
                  </Polje>
                  <Polje oznaka={t("usluga_cena")} pomoc={t("usluga_cena_pomoc")}>
                    <input className={KLASE_UNOSA} inputMode="decimal" value={f("uslugaCena")} onChange={(e) => setF("uslugaCena", e.target.value)} />
                  </Polje>
                </div>
              </>
            )}
            <Polje oznaka={t("cenovnik_url")} opciono={t("opciono")}>
              <input className={KLASE_UNOSA} value={f("cenovnikUrl")} onChange={(e) => setF("cenovnikUrl", e.target.value)} />
            </Polje>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1 size-5" checked={forma.izjava === true} onChange={(e) => setF("izjava", e.target.checked)} />
              <span>{prijavaZa.uloga === "GAZDINSTVO" ? t("izjava_gazdinstvo") : t("izjava_objekat")}</span>
            </label>
            <Dugme punaSirina disabled={radi || forma.izjava !== true} onClick={async () => {
              const ok = await posalji({ radnja: "prijava", id: prijavaZa.poziv.id, uloga: prijavaZa.uloga, ...forma, ...(prijavaZa.uloga === "GAZDINSTVO" ? hrana : {}) }, t("prijava_poslata"));
              if (ok) setPrijavaZa(null);
            }}>{t("posalji_prijavu")}</Dugme>
          </div>
        </Fioka>
      )}

      {ugovor && ugovor.ugovorTekst && (
        <Fioka naslov={t("ugovor_naslov")} onZatvori={() => setUgovor(null)}>
          <div className="space-y-3">
            <pre className="whitespace-pre-wrap font-sans text-sm text-kolo-text">{ugovor.ugovorTekst}</pre>
            {!ugovor.ugovorPrihvacenAt && (
              <Dugme punaSirina disabled={radi} onClick={async () => { if (await posalji({ radnja: "prihvati-ugovor", id: ugovor.id }, t("ugovor_potvrdjen"))) setUgovor(null); }}>
                {t("ugovor_prihvatam")}
              </Dugme>
            )}
          </div>
        </Fioka>
      )}

      {zapisnikZa && (
        <Fioka naslov={t("zapisnik_naslov")} onZatvori={() => setZapisnikZa(null)}>
          <div className="space-y-3">
            <p className="text-sm text-kolo-muted">{t("zapisnik_opis")}</p>
            <Polje oznaka={t("zapisnik_kolicina", { jedinica: zapisnikZa.lanac.jedinica })}>
              <input className={KLASE_UNOSA} inputMode="decimal" value={f("kolicina")} onChange={(e) => setF("kolicina", e.target.value)} />
            </Polje>
            {zapisnikZa.prvaPredaja && zapisnikZa.lanac.vrstaHrane === "MESO" && (
              <Polje oznaka={t("zapisnik_oznake_polje")}>
                <textarea className={KLASE_UNOSA} rows={3} value={f("oznakeZivotinja")} onChange={(e) => setF("oznakeZivotinja", e.target.value)} />
              </Polje>
            )}
            {zapisnikZa.prvaPredaja && zapisnikZa.lanac.vrsta === "PROGRAM_HRANE" && (
              <Polje oznaka={t("zapisnik_obim")} pomoc={t("zapisnik_obim_pomoc")}>
                <input className={KLASE_UNOSA} inputMode="decimal" value={f("obimUsluge")} onChange={(e) => setF("obimUsluge", e.target.value)} />
              </Polje>
            )}
            <Dugme punaSirina disabled={radi} onClick={async () => { if (await posalji({ radnja: "predaja", id: zapisnikZa.lanac.id, ...forma }, t("zapisnik_zabelezen"))) setZapisnikZa(null); }}>
              {t("zapisnik_sacuvaj")}
            </Dugme>
          </div>
        </Fioka>
      )}
    </Stranica>
  );
}
