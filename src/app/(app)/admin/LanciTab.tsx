"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import { klaseKartice } from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import Fioka from "@/components/ui/Fioka";
import { useDijalog } from "@/components/ui/Dijalog";
import OdgovoriHraneForma, { type OdgovoriUnos } from "@/components/lanac/OdgovoriHraneForma";
import { VRSTE_HRANE } from "@/lib/hrana-pravila";

/**
 * Admin — program raspodele hrane i lanac proizvodnje i distribucije (nabavke Glave X i XI).
 *
 * Javni poziv i prijave (čl. 39), partija sa predlogom najbližeg objekta (čl. 39 st. 3), upis
 * odluke o lancu (čl. 48–49; samo superadmin — UO, odnosno Gornje Kolo odlučuju van platforme),
 * potvrda predaja i utvrđivanje izvršenja karika (čl. 50 st. 2), utvrđivanje izdavanja (dodatak
 * za distribuciju), neispravna hrana (čl. 45), predaja nepreuzetih delova (čl. 46 st. 4, 52 st. 2)
 * i izveštaj sa vrednošću u dinarima (čl. 37 st. 2, čl. 47) — dinari samo u izveštaju.
 */
type Prijava = {
  id: string; pozivId: string; uloga: string; naziv: string; mesto: string; adresa: string | null; bpg: string | null; brojOdobrenja: string | null;
  status: string; pseudonim: string; hranaKategorija: string | null; uslugaOpis: string | null; uslugaJedinica: string | null; cenovnikUrl: string | null;
};
type Karika = { id: string; redniBroj: number; uloga: string; naziv: string; pseudonim: string; ugovorPrihvacenAt: string | null; izvrsenoPrijavljenoAt: string | null; izvrsenjeUtvrdjenoAt: string | null };
type Predaja = { id: string; odKarikaId: string; doKarikaId: string; kolicina: number; predaoPotvrdioAt: string | null; potvrdaFondacijeAt: string | null };
type Doprinos = { id: string; osnov: string; status: string; iznos: number };
type Lanac = {
  id: string; vrsta: "PROGRAM_HRANE" | "LANAC"; naziv: string; status: string; brojVaucera: number; poenaPoVauceru: number | null; jedinica: string;
  spremnoAt: string | null; odlukaOrgan: string | null; odlukaBroj: string | null; odlukaDatum: string | null;
  karike: Karika[]; predaje: Predaja[]; doprinosi: Doprinos[]; vauceri: Record<string, number>;
};
type Poziv = { id: string; naziv: string; zatvorenAt: string | null; objavljenAt: string };
type Pregled = { pozivi: Poziv[]; prijave: Prijava[]; lanci: Lanac[] };
type KarikaUnos = Record<string, string>;

export default function LanciTab({ jeSuperadmin }: { jeSuperadmin: boolean }) {
  const t = useTranslations("admin");
  const { dijalog, unesi } = useDijalog();
  const [p, setP] = useState<Pregled | null>(null);
  const [poruka, setPoruka] = useState<{ vrsta: "uspeh" | "greska"; tekst: string } | null>(null);
  const [radi, setRadi] = useState(false);
  const [poziv, setPoziv] = useState<Record<string, string>>({});
  const [partija, setPartija] = useState<Record<string, string>>({});
  const [objekti, setObjekti] = useState<{ id: string; naziv: string; mesto: string; km: number | null }[]>([]);
  const [odluka, setOdluka] = useState<Record<string, string>>({ organ: "UPRAVNI_ODBOR" });
  const [hranaLanca, setHranaLanca] = useState<OdgovoriUnos>({});
  const [karike, setKarike] = useState<KarikaUnos[]>([{}, {}]);
  const [izvestaj, setIzvestaj] = useState<Record<string, unknown> | null>(null);

  const ucitaj = useCallback(async () => {
    const r = await fetch("/api/admin/lanac");
    if (r.ok) setP(await r.json());
  }, []);
  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function radnja(telo: Record<string, unknown>): Promise<boolean> {
    setRadi(true);
    setPoruka(null);
    try {
      const r = await fetch("/api/admin/lanac", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(telo) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setPoruka({ vrsta: "greska", tekst: d.error ?? t("lanac_greska") });
        return false;
      }
      setPoruka({ vrsta: "uspeh", tekst: t("lanac_sacuvano") });
      await ucitaj();
      return true;
    } finally {
      setRadi(false);
    }
  }

  async function ucitajObjekte(gazdinstvoId: string) {
    setPartija((s) => ({ ...s, gazdinstvoPrijavaId: gazdinstvoId, objekatPrijavaId: "" }));
    setObjekti([]);
    if (!gazdinstvoId) return;
    const r = await fetch(`/api/admin/lanac?objekti=${encodeURIComponent(gazdinstvoId)}`);
    if (r.ok) {
      const d = await r.json();
      setObjekti(d.objekti ?? []);
      if (d.objekti?.[0]) setPartija((s) => ({ ...s, objekatPrijavaId: d.objekti[0].id }));
    }
  }

  const unos = (stanje: Record<string, string>, set: (f: (s: Record<string, string>) => Record<string, string>) => void, k: string, oznaka: string, tip?: string) => (
    <Polje oznaka={oznaka}>
      {tip === "tekst" ? (
        <textarea className={KLASE_UNOSA} rows={4} value={stanje[k] ?? ""} onChange={(e) => set((s) => ({ ...s, [k]: e.target.value }))} />
      ) : (
        <input className={KLASE_UNOSA} type={tip === "datum" ? "date" : "text"} value={stanje[k] ?? ""} onChange={(e) => set((s) => ({ ...s, [k]: e.target.value }))} />
      )}
    </Polje>
  );

  if (!p) return <p className="text-sm text-kolo-muted">{t("lanac_ucitavanje")}</p>;
  const gazdinstva = p.prijave.filter((x) => x.uloga === "GAZDINSTVO" && x.status === "PRIHVACENA");

  return (
    <div className="space-y-6">
      {dijalog}
      {poruka && <Obavestenje vrsta={poruka.vrsta}>{poruka.tekst}</Obavestenje>}

      {/* ── Javni poziv (čl. 39) ─────────────────────────────────────────── */}
      <section className={`${klaseKartice()} space-y-3`}>
        <NaslovSekcije opis={t("lanac_poziv_opis")}>{t("lanac_poziv_naslov")}</NaslovSekcije>
        {unos(poziv, setPoziv, "naziv", t("lanac_poziv_naziv"))}
        {unos(poziv, setPoziv, "opis", t("lanac_poziv_tekst"), "tekst")}
        {unos(poziv, setPoziv, "uslovi", t("lanac_poziv_uslovi"), "tekst")}
        {unos(poziv, setPoziv, "rokObradeDana", t("lanac_poziv_rok"))}
        <Dugme disabled={radi} onClick={async () => { if (await radnja({ radnja: "poziv", ...poziv })) setPoziv({}); }}>{t("lanac_poziv_objavi")}</Dugme>
        <ul className="space-y-1 text-sm">
          {p.pozivi.map((z) => (
            <li key={z.id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{z.naziv}</span>
              <span className="text-kolo-muted">{z.zatvorenAt ? t("lanac_poziv_zatvoren") : t("lanac_poziv_otvoren")}</span>
              {!z.zatvorenAt && <Dugme velicina="sm" varijanta="tiho" disabled={radi} onClick={() => radnja({ radnja: "zatvori-poziv", id: z.id })}>{t("lanac_poziv_zatvori")}</Dugme>}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Prijave (čl. 39 st. 2) ────────────────────────────────────────── */}
      <section className={`${klaseKartice()} space-y-3`}>
        <NaslovSekcije opis={t("lanac_prijave_opis")}>{t("lanac_prijave_naslov")}</NaslovSekcije>
        {p.prijave.filter((x) => x.status === "NA_PREGLEDU").length === 0 && <p className="text-sm text-kolo-muted">{t("lanac_prijave_prazno")}</p>}
        {p.prijave.filter((x) => x.status === "NA_PREGLEDU").map((x) => (
          <div key={x.id} className="space-y-2 border-b border-kolo-border pb-3 text-sm">
            <p>
              <span className="font-medium">{x.naziv}</span> · {x.uloga === "GAZDINSTVO" ? t("lanac_uloga_gazdinstvo") : t("lanac_uloga_objekat")} · {x.pseudonim} · {x.mesto}{x.adresa ? `, ${x.adresa}` : ""}
            </p>
            <p className="text-kolo-muted">
              {x.bpg ? t("lanac_bpg", { bpg: x.bpg }) : t("lanac_odobrenje", { broj: x.brojOdobrenja ?? "" })}
              {x.hranaKategorija ? ` · ${t("lanac_kategorija", { kategorija: x.hranaKategorija })}` : ""}
              {x.uslugaOpis ? ` · ${x.uslugaOpis} (${x.uslugaJedinica ?? ""})` : ""}
              {x.cenovnikUrl ? <> · <a className="underline" href={x.cenovnikUrl} target="_blank" rel="noreferrer">{t("lanac_cenovnik")}</a></> : null}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {x.uloga === "OBJEKAT" && (
                <input className={`${KLASE_UNOSA} max-w-xs`} placeholder={t("lanac_zadruga_id")} value={partija[`z_${x.id}`] ?? ""} onChange={(e) => setPartija((s) => ({ ...s, [`z_${x.id}`]: e.target.value }))} />
              )}
              <Dugme velicina="sm" disabled={radi} onClick={() => radnja({ radnja: "prijava", id: x.id, prihvati: true, zadrugaId: partija[`z_${x.id}`] ?? "" })}>{t("lanac_prihvati")}</Dugme>
              <input className={`${KLASE_UNOSA} max-w-xs`} placeholder={t("lanac_razlog")} value={partija[`r_${x.id}`] ?? ""} onChange={(e) => setPartija((s) => ({ ...s, [`r_${x.id}`]: e.target.value }))} />
              <Dugme velicina="sm" varijanta="opasno" disabled={radi} onClick={() => radnja({ radnja: "prijava", id: x.id, prihvati: false, razlog: partija[`r_${x.id}`] ?? "" })}>{t("lanac_odbij")}</Dugme>
            </div>
          </div>
        ))}
      </section>

      {/* ── Partija programa (čl. 39 st. 3, 40, 42, 43) ───────────────────── */}
      <section className={`${klaseKartice()} space-y-3`}>
        <NaslovSekcije opis={t("lanac_partija_opis")}>{t("lanac_partija_naslov")}</NaslovSekcije>
        <Polje oznaka={t("lanac_partija_gazdinstvo")}>
          <select className={KLASE_UNOSA} value={partija.gazdinstvoPrijavaId ?? ""} onChange={(e) => ucitajObjekte(e.target.value)}>
            <option value="">—</option>
            {gazdinstva.map((g) => <option key={g.id} value={g.id}>{g.naziv} ({g.mesto})</option>)}
          </select>
        </Polje>
        <Polje oznaka={t("lanac_partija_objekat")} pomoc={t("lanac_partija_objekat_pomoc")}>
          <select className={KLASE_UNOSA} value={partija.objekatPrijavaId ?? ""} onChange={(e) => setPartija((s) => ({ ...s, objekatPrijavaId: e.target.value }))}>
            <option value="">—</option>
            {objekti.map((o) => <option key={o.id} value={o.id}>{o.naziv} ({o.mesto}{o.km != null ? `, ${o.km} km` : ""})</option>)}
          </select>
        </Polje>
        {unos(partija, setPartija, "naziv", t("lanac_partija_naziv"))}
        <div className="grid gap-3 sm:grid-cols-2">
          {unos(partija, setPartija, "brojVaucera", t("lanac_broj_vaucera"))}
          {unos(partija, setPartija, "kolicinaPoVauceru", t("lanac_kolicina_po_vauceru"))}
          {unos(partija, setPartija, "jedinica", t("lanac_jedinica"))}
          {unos(partija, setPartija, "stipsKategorija", t("lanac_stips_kategorija"))}
        </div>
        <Dugme disabled={radi || !partija.gazdinstvoPrijavaId || !partija.objekatPrijavaId} onClick={async () => {
          const { gazdinstvoPrijavaId, objekatPrijavaId, naziv, brojVaucera, kolicinaPoVauceru, jedinica, stipsKategorija } = partija;
          if (await radnja({ radnja: "partija", gazdinstvoPrijavaId, objekatPrijavaId, naziv, brojVaucera, kolicinaPoVauceru, jedinica, stipsKategorija })) { setPartija({}); setObjekti([]); }
        }}>{t("lanac_partija_otvori")}</Dugme>
      </section>

      {/* ── Odluka o lancu (čl. 48–49) — samo superadmin ──────────────────── */}
      {jeSuperadmin && (
        <section className={`${klaseKartice()} space-y-3`}>
          <NaslovSekcije opis={t("lanac_odluka_opis")}>{t("lanac_odluka_naslov")}</NaslovSekcije>
          <Polje oznaka={t("lanac_odluka_organ")}>
            <select className={KLASE_UNOSA} value={odluka.organ} onChange={(e) => setOdluka((s) => ({ ...s, organ: e.target.value }))}>
              <option value="UPRAVNI_ODBOR">{t("lanac_organ_UPRAVNI_ODBOR")}</option>
              <option value="GORNJE_KOLO">{t("lanac_organ_GORNJE_KOLO")}</option>
            </select>
          </Polje>
          <div className="grid gap-3 sm:grid-cols-2">
            {unos(odluka, setOdluka, "brojOdluke", t("lanac_odluka_broj"))}
            {unos(odluka, setOdluka, "datumOdluke", t("lanac_odluka_datum"), "datum")}
          </div>
          {unos(odluka, setOdluka, "tekstOdluke", t("lanac_odluka_tekst"), "tekst")}
          {unos(odluka, setOdluka, "naziv", t("lanac_odluka_roba"))}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-5" checked={odluka.hrana === "da"} onChange={(e) => setOdluka((s) => ({ ...s, hrana: e.target.checked ? "da" : "" }))} />
            {t("lanac_odluka_hrana")}
          </label>
          {odluka.hrana === "da" ? (
            <OdgovoriHraneForma vrednost={hranaLanca} onPromena={setHranaLanca} vrste={VRSTE_HRANE} />
          ) : (
            unos(odluka, setOdluka, "koeficijentSirovine", t("lanac_odluka_koeficijent"))
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {unos(odluka, setOdluka, "stipsKategorija", t("lanac_stips_kategorija"))}
            {unos(odluka, setOdluka, "jedinica", t("lanac_jedinica"))}
            {unos(odluka, setOdluka, "dodatakPct", t("lanac_odluka_dodatak"))}
            {unos(odluka, setOdluka, "brojVaucera", t("lanac_broj_vaucera"))}
            {unos(odluka, setOdluka, "kolicinaPoVauceru", t("lanac_kolicina_po_vauceru"))}
          </div>
          <NaslovSekcije nivo={3} opis={t("lanac_karike_opis")}>{t("lanac_karike_naslov")}</NaslovSekcije>
          {karike.map((k, i) => {
            const setK = (f: (s: Record<string, string>) => Record<string, string>) => setKarike((sve) => sve.map((x, j) => (j === i ? f(x) : x)));
            return (
              <div key={i} className="space-y-2 rounded-kontrola bg-kolo-bg p-3">
                <p className="text-sm font-medium">{i === 0 ? t("lanac_karika_davalac") : i === karike.length - 1 ? t("lanac_karika_poslednji") : t("lanac_karika_partner", { broj: i })}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {unos(k, setK, "pseudonim", t("lanac_karika_pseudonim"))}
                  {unos(k, setK, "naziv", t("lanac_karika_naziv"))}
                  {unos(k, setK, "mestoPredaje", t("lanac_karika_mesto"))}
                  {unos(k, setK, "adresaPredaje", t("lanac_karika_adresa"))}
                  {i === 0 ? unos(k, setK, "cenaPoJedinici", t("lanac_karika_cena_davaoca")) : (
                    <>
                      {unos(k, setK, "uslugaOpis", t("lanac_karika_usluga"))}
                      {unos(k, setK, "jedinica", t("lanac_jedinica"))}
                      {unos(k, setK, "cenaPoJedinici", t("lanac_karika_cena"))}
                      {unos(k, setK, "obim", t("lanac_karika_obim"))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <Dugme velicina="sm" varijanta="sekundarno" onClick={() => setKarike((s) => [...s, {}])}>{t("lanac_karika_dodaj")}</Dugme>
            {karike.length > 2 && <Dugme velicina="sm" varijanta="tiho" onClick={() => setKarike((s) => s.slice(0, -1))}>{t("lanac_karika_ukloni")}</Dugme>}
          </div>
          <Dugme disabled={radi} onClick={async () => {
            const { hrana, ...ostalo } = odluka;
            if (await radnja({ radnja: "odluka", ...ostalo, karike, ...(hrana === "da" ? { hranaOdgovori: hranaLanca, vrstaHrane: hranaLanca.vrstaHrane } : {}) })) {
              setOdluka({ organ: "UPRAVNI_ODBOR" }); setKarike([{}, {}]); setHranaLanca({});
            }
          }}>{t("lanac_odluka_upisi")}</Dugme>
        </section>
      )}

      {/* ── Partije i lanci ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <NaslovSekcije>{t("lanac_lanci_naslov")}</NaslovSekcije>
        {p.lanci.length === 0 && <p className="text-sm text-kolo-muted">{t("lanac_lanci_prazno")}</p>}
        {p.lanci.map((l) => (
          <div key={l.id} className={`${klaseKartice({ padding: "sm" })} space-y-2 text-sm`}>
            <p className="font-semibold">{l.naziv} <span className="font-normal text-kolo-muted">· {l.vrsta === "LANAC" ? t("lanac_vrsta_lanac") : t("lanac_vrsta_program")} · {t(`lanac_status_${l.status}`)}</span></p>
            {l.odlukaOrgan && <p className="text-kolo-muted">{t("lanac_odluka_zapis", { organ: t(`lanac_organ_${l.odlukaOrgan}`), broj: l.odlukaBroj ?? "", datum: l.odlukaDatum ? new Date(l.odlukaDatum).toLocaleDateString("sr-RS") : "" })}</p>}
            <p className="text-kolo-muted">{t("lanac_vauceri_stanje", { broj: l.brojVaucera, poen: l.poenaPoVauceru ?? 0, stanja: Object.entries(l.vauceri).map(([s, n]) => `${s}: ${n}`).join(", ") || "—" })}</p>
            <ul className="space-y-1">
              {l.karike.map((k) => (
                <li key={k.id} className="flex flex-wrap items-center gap-2">
                  <span>{k.redniBroj}. {k.naziv} ({k.pseudonim}) · {k.ugovorPrihvacenAt ? t("lanac_ugovor_potvrdjen") : t("lanac_ugovor_ceka")}</span>
                  {k.uloga !== "DAVALAC_SIROVINE" && k.izvrsenoPrijavljenoAt && !k.izvrsenjeUtvrdjenoAt && (
                    <Dugme velicina="sm" disabled={radi} onClick={() => radnja({ radnja: "izvrsenje", id: k.id })}>{t("lanac_utvrdi_izvrsenje")}</Dugme>
                  )}
                  {k.izvrsenjeUtvrdjenoAt && <span className="text-kolo-muted">{t("lanac_izvrsenje_utvrdjeno")}</span>}
                </li>
              ))}
            </ul>
            {l.predaje.map((pr) => (
              <p key={pr.id} className="flex flex-wrap items-center gap-2">
                <span>{t("lanac_predaja", { kolicina: pr.kolicina, jedinica: l.jedinica })} · {pr.predaoPotvrdioAt ? t("lanac_predaja_potvrdio_predao") : t("lanac_predaja_ceka_predao")}</span>
                {l.vrsta === "LANAC" && pr.predaoPotvrdioAt && !pr.potvrdaFondacijeAt && (
                  <Dugme velicina="sm" disabled={radi} onClick={() => radnja({ radnja: "potvrdi-predaju", id: pr.id })}>{t("lanac_potvrdi_predaju")}</Dugme>
                )}
                {pr.potvrdaFondacijeAt && <span className="text-kolo-muted">{t("lanac_predaja_potvrdjena")}</span>}
              </p>
            ))}
            {l.doprinosi.length > 0 && (
              <p className="text-kolo-muted">{l.doprinosi.map((d) => t("lanac_doprinos", { osnov: t(`lanac_osnov_${d.osnov}`), status: t(`lanac_dstatus_${d.status}`), iznos: d.iznos })).join(" · ")}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {l.vrsta === "LANAC" && (l.status === "VAUCERI_IZDATI" || l.status === "ZATVOREN") && (
                <Dugme velicina="sm" varijanta="sekundarno" disabled={radi} onClick={() => radnja({ radnja: "izdavanje", id: l.id })}>{t("lanac_utvrdi_izdavanje")}</Dugme>
              )}
              {(l.status === "VAUCERI_IZDATI" || l.status === "PRIPREMA") && (
                <Dugme velicina="sm" varijanta="opasno" disabled={radi} onClick={async () => {
                  const razlog = await unesi({ poruka: t("lanac_neispravno_razlog"), opasno: true });
                  if (razlog) void radnja({ radnja: "neispravno", id: l.id, razlog });
                }}>{t("lanac_neispravno")}</Dugme>
              )}
              {l.status === "VAUCERI_IZDATI" && l.spremnoAt && (
                <Dugme velicina="sm" varijanta="sekundarno" disabled={radi} onClick={async () => {
                  const napomena = await unesi({ poruka: t("lanac_ustanova_napomena") });
                  if (napomena) void radnja({ radnja: "ustanova", id: l.id, napomena });
                }}>{t("lanac_ustanova")}</Dugme>
              )}
              <Dugme velicina="sm" varijanta="tiho" onClick={async () => {
                const r = await fetch(`/api/admin/lanac?izvestaj=${l.id}`);
                if (r.ok) setIzvestaj(await r.json());
              }}>{t("lanac_izvestaj")}</Dugme>
            </div>
          </div>
        ))}
      </section>

      {izvestaj && (
        <Fioka naslov={t("lanac_izvestaj")} onZatvori={() => setIzvestaj(null)}>
          <p className="text-sm text-kolo-muted">{t("lanac_izvestaj_napomena")}</p>
          <pre className="whitespace-pre-wrap text-xs text-kolo-text">{JSON.stringify(izvestaj, null, 2)}</pre>
        </Fioka>
      )}
    </div>
  );
}
