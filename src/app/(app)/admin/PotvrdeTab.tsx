"use client";

/**
 * Potvrde — POEN po potvrdi koji čeka trag stvarnog učešća (dokaz stvarnosti čl. 7),
 * i potvrda člana bez potvrde odlukom Fondacije (čl. 5a st. 3, set 4.8.2).
 *
 * 🔴 Postupak Fondacije za potvrdu postojanja deteta (`PotvrdeDetetaFondacija`) je
 * ukinut setom 4.8.2 — postojanje deteta potvrđuje član Kola (deca čl. 6).
 *
 * Dva odvojena odeljka, namerno razdvojena jer su to dve različite odluke:
 *  1. VENTIL — ručni upis za pojedinačnu potvrdu, uz obavezan razlog. Postoji zbog
 *     ljudi koje četiri uslova ne pokrivaju: onaj ko samo kupuje, stariji član na
 *     programu podrške. Bez njega bi njima i njihovim potvrđivačima POEN čekao zauvek.
 *  2. USKLAĐIVANJE ZATEČENIH — jednokratna prelazna radnja, u dva koraka
 *     (Izračunaj → Sprovedi), gde se broj POENA iz pregleda otkucava rukom.
 *  3. UKLANJANJE PAROVA — čisti istoriju od para „emisija pa povlačenje" koji je
 *     usklađivanje ostavilo za sobom. Isti obrazac u dva koraka, ali se otkucava
 *     broj REDOVA, jer se POEN ovom radnjom ne menja.
 *  4. UKLANJANJE POEN-A ZA NADZOR (set 4.7.5) — nadzor se više ne plaća; zatečeni upisi
 *     dobijaju protivzapis i oba reda se brišu, zabeleženi se gase. Otkucava se POEN.
 *
 * Podaci se učitavaju lenjo, iz taba.
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import Link from "next/link";
import VisestrukiNalozi from "./VisestrukiNalozi";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import { useDijalog } from "@/components/ui/Dijalog";

type Veza = {
  id: string;
  vremenskiZig: string;
  potvrdjivac: { id: string; pseudonim: string };
  potvrdjeni: { id: string; pseudonim: string };
};

type Pregled = {
  sprovedeno: boolean;
  ukupnoUpisanih: number;
  ostaje: number;
  povlaci: number;
  poenPonisten: number;
  pogodjenihLjudi: number;
  ljudiUMinusu: number;
  ukupanMinus: number;
  opticajPre: number;
  opticajPosle: number;
  osnivackiPragPredjen: number | null;
};

type ParoviPregled = {
  sprovedeno: boolean;
  povlacenjaUkupno: number;
  parova: number;
  redova: number;
  neupareni: number;
  pogodjenihLjudi: number;
  ljudiUMinusu: number;
  neslozeniNalozi: number;
  opticaj: number;
  zapisaUkupno: number;
  prepreke: string[];
  ucesnici: { pseudonim: string; parova: number; poen: number; stanje: number }[];
};

type NadzorPregled = {
  sprovedeno: boolean;
  upisa: number;
  poen: number;
  zabelezenihGasi: number;
  obavestenja: number;
  opticajPre: number;
  opticajPosle: number;
  prepreke: string[];
  ucesnici: { pseudonim: string; upisa: number; poen: number; stanjePre: number; stanjePosle: number }[];
};

/**
 * Potvrda člana bez potvrde odlukom Fondacije (dokaz stvarnosti čl. 5a st. 3;
 * Pravilnik čl. 28a st. 4). Samo superadmin, uz obavezno obrazloženje sa pozivom na
 * odluku o merilima. Ne nosi POEN, ne podleže nadzoru; trag ide u audit.
 */
function PotvrdaOdlukomFondacije({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("admin");
  const [pseudonim, setPseudonim] = useState("");
  const [obrazlozenje, setObrazlozenje] = useState("");
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState("");
  const [greska, setGreska] = useState("");
  const { dijalog, potvrdi: pitaj } = useDijalog();

  async function potvrdi() {
    const p = pseudonim.trim().replace(/^@/, "");
    if (!p || obrazlozenje.trim().length < 10) {
      setGreska(t("potvrde_fondacija_nepotpuno"));
      return;
    }
    if (!(await pitaj({ poruka: t("potvrde_fondacija_confirm", { pseudonim: p }), dugme: t("potvrde_fondacija_dugme") }))) return;
    setRadi(true);
    setGreska("");
    setPoruka("");
    try {
      const res = await fetch(`/api/admin/korisnici/${encodeURIComponent(p)}/potvrdi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ obrazlozenje: obrazlozenje.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? t("nadzor_greska"));
      setPoruka(t("potvrde_fondacija_uspeh", { pseudonim: d.pseudonim ?? p, povezani: Number(d.povezani ?? 0) }));
      setPseudonim("");
      setObrazlozenje("");
      onDone?.();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("nadzor_greska"));
    } finally {
      setRadi(false);
    }
  }

  return (
    <section className="space-y-3 rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
      {dijalog}
      <h2 className="text-lg font-semibold text-kolo-text">{t("potvrde_fondacija_naslov")}</h2>
      <p className="text-sm text-kolo-muted">{t("potvrde_fondacija_opis")}</p>
      <input
        className={KLASE_UNOSA + " max-w-xs"}
        placeholder={t("potvrde_fondacija_pseudonim")} aria-label={t("potvrde_fondacija_pseudonim")}
        value={pseudonim}
        onChange={(e) => setPseudonim(e.target.value)}
      />
      <textarea
        className={KLASE_UNOSA}
        rows={2}
        placeholder={t("potvrde_fondacija_obrazlozenje")} aria-label={t("potvrde_fondacija_obrazlozenje")}
        value={obrazlozenje}
        onChange={(e) => setObrazlozenje(e.target.value)}
      />
      <button
        type="button"
        className={klaseDugmeta()}
        disabled={radi}
        onClick={() => void potvrdi()}
      >
        {t("potvrde_fondacija_dugme")}
      </button>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      {poruka && <Obavestenje vrsta="uspeh">{poruka}</Obavestenje>}
    </section>
  );
}

// 🔴 Ovaj tab je bio napisan rečnikom dizajn-sistema koji u projektu NE POSTOJI:
// `kolo-dugme-primarno`, `kolo-dugme-sekundarno` i `kolo-input` nisu definisani ni u
// `globals.css` ni igde drugde (jedina definisana `kolo-` klasa je `.kolo-naslov`).
// Posledica: sva dugmad i polja u ovom tabu bila su gola — bez okvira, boje i stanja
// `disabled`. Ispravljeno 21.09.2026 izričitim Tailwind klasama, istim kakve koriste
// ostali admin tabovi. 🔴 Ne uvoditi te klase nazad dok ih neko zaista ne definiše.
export default function PotvrdeTab({ jeSuperadmin, onDone }: { jeSuperadmin: boolean; onDone?: () => void }) {
  const t = useTranslations("admin");
  const [veze, setVeze] = useState<Veza[]>([]);
  const [poenVerifikator, setPoenVerifikator] = useState(1000);
  const [ucitava, setUcitava] = useState(true);
  const [greska, setGreska] = useState("");
  const [radiId, setRadiId] = useState<string | null>(null);
  const [razlozi, setRazlozi] = useState<Record<string, string>>({});

  const [pregled, setPregled] = useState<Pregled | null>(null);
  const [potvrdaBroja, setPotvrdaBroja] = useState("");
  const [radiUskladjivanje, setRadiUskladjivanje] = useState(false);
  const [poruka, setPoruka] = useState("");

  // Uklanjanje parova — sopstveno stanje, jer je to zasebna odluka od usklađivanja.
  const [parovi, setParovi] = useState<ParoviPregled | null>(null);
  const [potvrdaParova, setPotvrdaParova] = useState("");
  const [radiParove, setRadiParove] = useState(false);
  const [porukaParova, setPorukaParova] = useState("");

  // Uklanjanje POEN-a za nadzor — zasebna odluka (set 4.7.5).
  const [nadzor, setNadzor] = useState<NadzorPregled | null>(null);
  const [potvrdaNadzora, setPotvrdaNadzora] = useState("");
  const [radiNadzor, setRadiNadzor] = useState(false);
  const [porukaNadzora, setPorukaNadzora] = useState("");

  const ucitaj = useCallback(async () => {
    setUcitava(true);
    setGreska("");
    try {
      const res = await fetch("/api/admin/potvrde-na-cekanju");
      if (!res.ok) throw new Error("Učitavanje nije uspelo.");
      const d = await res.json();
      setVeze(d.veze ?? []);
      setPoenVerifikator(d.poenVerifikator ?? 1000);
    } catch (e) {
      setGreska(e instanceof Error ? e.message : "Greška.");
    } finally {
      setUcitava(false);
    }
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function upisi(id: string) {
    const razlog = (razlozi[id] ?? "").trim();
    if (razlog.length < 10) {
      setGreska("Razlog je obavezan i mora imati najmanje 10 znakova.");
      return;
    }
    setRadiId(id);
    setGreska("");
    try {
      const res = await fetch(`/api/admin/potvrde-na-cekanju/${id}/upisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razlog }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.error ?? "Upis nije uspeo.");
      await ucitaj();
      onDone?.();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : "Greška.");
    } finally {
      setRadiId(null);
    }
  }

  async function izracunaj() {
    setRadiUskladjivanje(true);
    setGreska("");
    setPoruka("");
    try {
      const res = await fetch("/api/admin/potvrde-uskladjivanje", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? "Pregled nije uspeo.");
      setPregled(d);
      setPotvrdaBroja("");
    } catch (e) {
      setGreska(e instanceof Error ? e.message : "Greška.");
    } finally {
      setRadiUskladjivanje(false);
    }
  }

  async function sprovedi() {
    if (!pregled) return;
    setRadiUskladjivanje(true);
    setGreska("");
    try {
      const res = await fetch("/api/admin/potvrde-uskladjivanje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ potvrda: Number(potvrdaBroja) }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d?.pregled) setPregled(d.pregled);
        throw new Error(d?.error ?? "Radnja nije izvršena.");
      }
      setPregled(d);
      setPoruka(t("potvrde_sprovedeno"));
      setPotvrdaBroja("");
      await ucitaj();
      onDone?.();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : "Greška.");
    } finally {
      setRadiUskladjivanje(false);
    }
  }

  async function izracunajParove() {
    setRadiParove(true);
    setGreska("");
    setPorukaParova("");
    try {
      const res = await fetch("/api/admin/potvrde-parovi", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? "Pregled nije uspeo.");
      setParovi(d);
      setPotvrdaParova("");
    } catch (e) {
      setGreska(e instanceof Error ? e.message : "Greška.");
    } finally {
      setRadiParove(false);
    }
  }

  async function ukloniParove() {
    if (!parovi) return;
    setRadiParove(true);
    setGreska("");
    try {
      const res = await fetch("/api/admin/potvrde-parovi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ potvrda: Number(potvrdaParova) }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d?.pregled) setParovi(d.pregled);
        throw new Error(d?.error ?? "Radnja nije izvršena.");
      }
      setParovi(d);
      setPorukaParova(t("parovi_sprovedeno", { redova: Number(d.redova).toLocaleString("sr-RS") }));
      setPotvrdaParova("");
      onDone?.();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : "Greška.");
    } finally {
      setRadiParove(false);
    }
  }

  async function izracunajNadzor() {
    setRadiNadzor(true);
    setGreska("");
    setPorukaNadzora("");
    try {
      const res = await fetch("/api/admin/nadzor-poen-uklanjanje", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error ?? "Pregled nije uspeo.");
      setNadzor(d);
      setPotvrdaNadzora("");
    } catch (e) {
      setGreska(e instanceof Error ? e.message : "Greška.");
    } finally {
      setRadiNadzor(false);
    }
  }

  async function ukloniNadzor() {
    if (!nadzor) return;
    setRadiNadzor(true);
    setGreska("");
    try {
      const res = await fetch("/api/admin/nadzor-poen-uklanjanje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ potvrda: Number(potvrdaNadzora) }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d?.pregled) setNadzor(d.pregled);
        throw new Error(d?.error ?? "Radnja nije izvršena.");
      }
      setNadzor(d);
      setPorukaNadzora(t("nadzor_poen_sprovedeno", { poen: Number(d.poen).toLocaleString("sr-RS") }));
      setPotvrdaNadzora("");
      onDone?.();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : "Greška.");
    } finally {
      setRadiNadzor(false);
    }
  }

  const broj = (n: number) => n.toLocaleString("sr-RS");
  const potvrdaTacna = pregled !== null && Number(potvrdaBroja) === pregled.poenPonisten;
  const parovaPotvrdaTacna = parovi !== null && Number(potvrdaParova) === parovi.redova;
  const nadzorPotvrdaTacna =
    nadzor !== null && potvrdaNadzora !== "" && Number(potvrdaNadzora) === nadzor.poen;

  return (
    <div className="space-y-8">
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}

      {/* ── Potvrda člana bez potvrde odlukom Fondacije (čl. 5a st. 3) ────── */}
      {jeSuperadmin && <PotvrdaOdlukomFondacije onDone={onDone} />}

      {/* ── Mogući višestruki nalozi (dokaz stvarnosti čl. 4a, 4b; set 4.8.4) ── */}
      {jeSuperadmin && <VisestrukiNalozi />}

      {/* ── Ventil ─────────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-kolo-text">{t("potvrde_naslov")}</h2>
        <p className="text-sm text-kolo-muted">{t("potvrde_opis")}</p>

        {ucitava ? (
          <p className="text-sm text-kolo-muted">Učitavanje…</p>
        ) : veze.length === 0 ? (
          <p className="text-sm text-kolo-muted">{t("potvrde_prazno")}</p>
        ) : (
          <ul className="space-y-3">
            {veze.map((v) => (
              <li key={v.id} className="rounded-kartica border border-kolo-border bg-kolo-surface p-4 shadow-kartica">
                <p className="text-sm text-kolo-text">
                  <Link href={profilHref(v.potvrdjivac)} className="font-semibold hover:underline">
                    <Pseudonim>{v.potvrdjivac.pseudonim}</Pseudonim>
                  </Link>{" "}
                  → potvrdio{" "}
                  <Link href={profilHref(v.potvrdjeni)} className="font-semibold hover:underline">
                    <Pseudonim>{v.potvrdjeni.pseudonim}</Pseudonim>
                  </Link>{" "}
                  · {new Date(v.vremenskiZig).toLocaleDateString("sr-RS")} · čeka {broj(poenVerifikator)} + {broj(poenVerifikator)} POENA
                </p>
                <textarea
                  className={KLASE_UNOSA + " mt-2"}
                  rows={2}
                  placeholder={t("potvrde_razlog")} aria-label={t("potvrde_razlog")}
                  value={razlozi[v.id] ?? ""}
                  onChange={(e) => setRazlozi((r) => ({ ...r, [v.id]: e.target.value }))}
                />
                <button
                  type="button"
                  className={klaseDugmeta() + " mt-2"}
                  disabled={radiId === v.id}
                  onClick={() => void upisi(v.id)}
                >
                  {t("potvrde_upisi")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Usklađivanje zatečenih ─────────────────────────────────────────── */}
      {jeSuperadmin && (
        <section className="space-y-3 rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
          <h2 className="text-lg font-semibold text-kolo-text">{t("potvrde_uskladjivanje_naslov")}</h2>
          <Obavestenje vrsta="upozorenje">{t("potvrde_uskladjivanje_opis")}</Obavestenje>

          <button
            type="button"
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
            disabled={radiUskladjivanje}
            onClick={() => void izracunaj()}
          >
            {t("potvrde_izracunaj")}
          </button>

          {pregled && (
            <div className="space-y-2 rounded-kontrola bg-kolo-bg p-4 text-sm">
              <p>{t("potvrde_pregled_ukupno")}: <strong>{broj(pregled.ukupnoUpisanih)}</strong></p>
              <p>{t("potvrde_pregled_ostaje")}: <strong>{broj(pregled.ostaje)}</strong></p>
              <p>{t("potvrde_pregled_povlaci")}: <strong>{broj(pregled.povlaci)}</strong></p>
              <p>{t("potvrde_pregled_ponisten")}: <strong>{broj(pregled.poenPonisten)}</strong></p>
              <p>{t("potvrde_pregled_ljudi")}: <strong>{broj(pregled.pogodjenihLjudi)}</strong></p>
              {pregled.ljudiUMinusu > 0 && (
                <p className="text-kolo-danger">
                  {t("potvrde_pregled_minus", {
                    ljudi: broj(pregled.ljudiUMinusu),
                    poen: broj(pregled.ukupanMinus),
                  })}
                </p>
              )}
              <p>
                {t("potvrde_pregled_opticaj")}: <strong>{broj(pregled.opticajPosle)}</strong>{" "}
                (sada {broj(pregled.opticajPre)})
              </p>
              {pregled.osnivackiPragPredjen !== null && (
                <p className="text-kolo-danger">
                  {t("potvrde_pregled_prag", { prag: broj(pregled.osnivackiPragPredjen) })}
                </p>
              )}

              {!pregled.sprovedeno && pregled.povlaci > 0 && (
                <div className="pt-2">
                  <label htmlFor="potvrda-broja-uskladjivanje" className="block text-sm font-medium text-kolo-text">
                    {t("potvrde_potvrda_broja")}
                  </label>
                  <input
                    id="potvrda-broja-uskladjivanje"
                    className="mt-1 w-48 min-h-10 rounded-kontrola border border-kolo-border bg-kolo-surface px-3 py-1.5 text-sm outline-none focus:border-kolo-green-700"
                    inputMode="numeric"
                    value={potvrdaBroja}
                    onChange={(e) => setPotvrdaBroja(e.target.value.replace(/\D/g, ""))}
                  />
                  <button
                    type="button"
                    className={klaseDugmeta() + " ml-2"}
                    disabled={!potvrdaTacna || radiUskladjivanje}
                    onClick={() => void sprovedi()}
                  >
                    {t("potvrde_sprovedi")}
                  </button>
                </div>
              )}
            </div>
          )}

          {poruka && <Obavestenje vrsta="uspeh">{poruka}</Obavestenje>}
        </section>
      )}

      {/* ── Uklanjanje parova emisija+usklađivanje ─────────────────────────── */}
      {jeSuperadmin && (
        <section className="space-y-3 rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
          <h2 className="text-lg font-semibold text-kolo-text">{t("parovi_naslov")}</h2>
          <Obavestenje vrsta="info">{t("parovi_opis")}</Obavestenje>

          <button
            type="button"
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
            disabled={radiParove}
            onClick={() => void izracunajParove()}
          >
            {t("potvrde_izracunaj")}
          </button>

          {parovi && (
            <div className="space-y-2 rounded-kontrola bg-kolo-bg p-4 text-sm">
              <p>{t("parovi_pregled_povlacenja")}: <strong>{broj(parovi.povlacenjaUkupno)}</strong></p>
              <p>{t("parovi_pregled_parova")}: <strong>{broj(parovi.parova)}</strong></p>
              <p>
                {t("parovi_pregled_redova")}: <strong>{broj(parovi.redova)}</strong>{" "}
                {t("parovi_pregled_od_ukupno", { ukupno: broj(parovi.zapisaUkupno) })}
              </p>
              <p>{t("parovi_pregled_ljudi")}: <strong>{broj(parovi.pogodjenihLjudi)}</strong></p>
              {parovi.ljudiUMinusu > 0 && (
                <p className="text-kolo-gold-700">{t("parovi_pregled_minus", { ljudi: broj(parovi.ljudiUMinusu) })}</p>
              )}
              <p className="text-kolo-muted">{t("parovi_pregled_nepromenjeno", { opticaj: broj(parovi.opticaj) })}</p>

              {parovi.ucesnici.length > 0 && (
                <details className="pt-1">
                  <summary className="cursor-pointer text-sm font-medium text-kolo-green-700">
                    {t("parovi_spisak", { ljudi: broj(parovi.ucesnici.length) })}
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {parovi.ucesnici.map((u) => (
                      <li key={u.pseudonim} className="flex items-center gap-2 text-xs">
                        <span className={u.stanje < 0 ? "font-semibold text-kolo-danger" : ""}>
                          <Pseudonim>{u.pseudonim}</Pseudonim>
                        </span>
                        <span className="text-kolo-muted">
                          {t("parovi_spisak_red", {
                            parova: broj(u.parova),
                            poen: broj(u.poen),
                            stanje: broj(u.stanje),
                          })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {/* 🔴 Prepreke se prikazuju umesto dugmeta — ne pored njega. Dugme koje
                  stoji uz crveni tekst poziva da se klikne „ipak". */}
              {parovi.prepreke.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 pt-2 text-kolo-danger">
                  {parovi.prepreke.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : (
                !parovi.sprovedeno &&
                parovi.parova > 0 && (
                  <div className="pt-2">
                    <label htmlFor="potvrda-broja-parovi" className="block text-sm font-medium text-kolo-text">
                      {t("parovi_potvrda_broja")}
                    </label>
                    <input
                      id="potvrda-broja-parovi"
                      className="mt-1 w-48 min-h-10 rounded-kontrola border border-kolo-border bg-kolo-surface px-3 py-1.5 text-sm outline-none focus:border-kolo-green-700"
                      inputMode="numeric"
                      value={potvrdaParova}
                      onChange={(e) => setPotvrdaParova(e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      type="button"
                      className={klaseDugmeta() + " ml-2"}
                      disabled={!parovaPotvrdaTacna || radiParove}
                      onClick={() => void ukloniParove()}
                    >
                      {t("parovi_ukloni")}
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {porukaParova && <Obavestenje vrsta="uspeh">{porukaParova}</Obavestenje>}
        </section>
      )}

      {/* ── Uklanjanje POEN-a za nadzor (set 4.7.5) ────────────────────────── */}
      {jeSuperadmin && (
        <section className="space-y-3 rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
          <h2 className="text-lg font-semibold text-kolo-text">{t("nadzor_poen_naslov")}</h2>
          <Obavestenje vrsta="upozorenje">{t("nadzor_poen_opis")}</Obavestenje>

          <button
            type="button"
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
            disabled={radiNadzor}
            onClick={() => void izracunajNadzor()}
          >
            {t("potvrde_izracunaj")}
          </button>

          {nadzor && (
            <div className="space-y-2 rounded-kontrola bg-kolo-bg p-4 text-sm">
              <p>{t("nadzor_poen_pregled_upisa")}: <strong>{broj(nadzor.upisa)}</strong></p>
              <p>{t("nadzor_poen_pregled_poen")}: <strong>{broj(nadzor.poen)}</strong></p>
              <p>{t("nadzor_poen_pregled_zabelezeno")}: <strong>{broj(nadzor.zabelezenihGasi)}</strong></p>
              <p>{t("nadzor_poen_pregled_obavestenja")}: <strong>{broj(nadzor.obavestenja)}</strong></p>
              <p className="text-kolo-muted">
                {t("nadzor_poen_pregled_opticaj", { pre: broj(nadzor.opticajPre), posle: broj(nadzor.opticajPosle) })}
              </p>

              {nadzor.ucesnici.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {nadzor.ucesnici.map((u) => (
                    <li key={u.pseudonim} className="flex items-center gap-2 text-xs">
                      <Pseudonim>{u.pseudonim}</Pseudonim>
                      <span className="text-kolo-muted">
                        {t("nadzor_poen_red", {
                          upisa: broj(u.upisa),
                          poen: broj(u.poen),
                          pre: broj(u.stanjePre),
                          posle: broj(u.stanjePosle),
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Prepreke umesto dugmeta, ne pored njega. */}
              {nadzor.prepreke.length > 0 ? (
                <ul className="list-disc space-y-1 pl-5 pt-2 text-kolo-danger">
                  {nadzor.prepreke.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : (
                !nadzor.sprovedeno &&
                (nadzor.upisa > 0 || nadzor.zabelezenihGasi > 0 || nadzor.obavestenja > 0) && (
                  <div className="pt-2">
                    <label htmlFor="potvrda-broja-nadzor" className="block text-sm font-medium text-kolo-text">
                      {t("nadzor_poen_potvrda_broja")}
                    </label>
                    <input
                      id="potvrda-broja-nadzor"
                      className="mt-1 w-48 min-h-10 rounded-kontrola border border-kolo-border bg-kolo-surface px-3 py-1.5 text-sm outline-none focus:border-kolo-green-700"
                      inputMode="numeric"
                      value={potvrdaNadzora}
                      onChange={(e) => setPotvrdaNadzora(e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      type="button"
                      className={klaseDugmeta() + " ml-2"}
                      disabled={!nadzorPotvrdaTacna || radiNadzor}
                      onClick={() => void ukloniNadzor()}
                    >
                      {t("nadzor_poen_ukloni")}
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {porukaNadzora && <Obavestenje vrsta="uspeh">{porukaNadzora}</Obavestenje>}
        </section>
      )}
    </div>
  );
}
