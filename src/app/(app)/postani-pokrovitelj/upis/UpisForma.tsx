"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import LokacijaSearch from "@/components/LokacijaSearch";
import { koordinateZaMesto } from "@/lib/udaljenost";
import { nadjiAdresu } from "@/lib/geokodiranje";
import { lokacijaUSrbiji } from "@/lib/gazdinstvo-pravila";
import { MAX_IME_PREZIME } from "@/lib/identitet-pravila";
import {
  ODNOSI_PO_OBLIKU,
  PRAVNI_OBLICI,
  trebaIzjavaOvlascenja,
  ocistiKontaktEmail,
  ocistiKontaktTelefon,
  type OdnosPremaDavaocu,
  type PravniOblik,
} from "@/lib/pokroviteljstvo-dobrima-pravila";
import { kljuceviIzjavaUpisa } from "@/lib/upis-pokrovitelja-pravila";
import LogotipPolje from "../LogotipPolje";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

const MapaGazdinstava = dynamic(() => import("@/components/MapaGazdinstava"), { ssr: false });

type Predlog = {
  gazdinstvoId: string;
  naziv: string;
  bpg: string;
  naselje: string;
  adresa: string | null;
  lat: number | null;
  lng: number | null;
} | null;

/**
 * Obrazac upisa pokrovitelja u evidenciju (Pravilnik o pokroviteljstvu i donacijama
 * čl. 16 i 17) — na jednoj strani.
 *
 * Pravno lice i preduzetnik: naziv, sedište, MB, PIB, odnos prema pokrovitelju, ime
 * i prezime; gazdinstvo: ime i prezime nosioca, naziv i BPG. Za oba: kontakt,
 * logotip, mesto i adresa za mapu (tačka se pronalazi po adresi i može se pomeriti),
 * uz OBAVEZNU izjavu da je pokrovitelj saglasan da se adresa prikazuje — izjava se
 * ne povlači; prikaz prestaje samo brisanjem upisa (čl. 18 st. 4).
 *
 * 🔴 Na obrascu se ne pominje POEN kao vrednost. Ime i prezime ne ide na mapu ni na
 * rang-listu.
 */
export default function UpisForma({
  vrsta,
  upisanoIme,
  predlog,
}: {
  vrsta: "FIRMA" | "GAZDINSTVO";
  upisanoIme: string | null;
  predlog: Predlog;
}) {
  const t = useTranslations("postaniPokrovitelj");
  const tg = useTranslations("gazdinstva");
  const router = useRouter();
  const gazdinstvo = vrsta === "GAZDINSTVO";

  const [f, setF] = useState({
    naziv: "", adresaSedista: "", maticniBroj: "", pib: "", bpg: "", zastupnikFunkcija: "",
    imePrezime: upisanoIme ?? "", kontaktEmail: "", kontaktTelefon: "", mapaMesto: "", mapaAdresa: "",
  });
  const [oblik, setOblik] = useState<PravniOblik | "">("");
  const [odnos, setOdnos] = useState<OdnosPremaDavaocu | "">(gazdinstvo ? "NOSILAC_GAZDINSTVA" : "");
  const [tacka, setTacka] = useState<{ lat: number; lng: number } | null>(null);
  const [pronadjeno, setPronadjeno] = useState<[number, number] | null>(null);
  const [gazdinstvoId, setGazdinstvoId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [izjavaAdresa, setIzjavaAdresa] = useState(false);
  const [izjavaOvlascenja, setIzjavaOvlascenja] = useState(false);
  const [potvrdaEvidentiranja, setPotvrdaEvidentiranja] = useState(false);
  const [trazi, setTrazi] = useState(false);
  const [porukaAdrese, setPorukaAdrese] = useState<string | null>(null);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const postavi = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const oblikIliNull = gazdinstvo || oblik === "" ? null : oblik;
  const trebaOvlascenje = odnos !== "" && trebaIzjavaOvlascenja(odnos, oblikIliNull);
  const kljucevi = kljuceviIzjavaUpisa(oblikIliNull);
  const centarNaselja = useMemo(() => {
    if (tacka) return null;
    const k = koordinateZaMesto(f.mapaMesto);
    return k ? ([k[0], k[1]] as [number, number]) : null;
  }, [f.mapaMesto, tacka]);

  function popuniIzGazdinstva() {
    if (!predlog) return;
    setF((s) => ({ ...s, naziv: predlog.naziv, bpg: predlog.bpg, mapaMesto: predlog.naselje, mapaAdresa: predlog.adresa ?? "" }));
    if (predlog.lat != null && predlog.lng != null) {
      setTacka({ lat: predlog.lat, lng: predlog.lng });
      setPronadjeno([predlog.lat, predlog.lng]);
    }
    setGazdinstvoId(predlog.gazdinstvoId);
  }

  async function pronadji() {
    if (!f.mapaAdresa.trim() || trazi) return;
    setTrazi(true);
    setPorukaAdrese(null);
    try {
      const t0 = await nadjiAdresu(f.mapaAdresa, f.mapaMesto);
      if (!t0) setPorukaAdrese(tg("adresa_nije_nadjena"));
      else {
        setTacka(t0);
        setPronadjeno([t0.lat, t0.lng]);
        setPorukaAdrese(tg("adresa_nadjena"));
      }
    } catch {
      setPorukaAdrese(tg("adresa_nije_nadjena"));
    } finally {
      setTrazi(false);
    }
  }

  const spremno =
    !radi && f.naziv.trim() && f.imePrezime.trim() && odnos !== "" &&
    (gazdinstvo ? f.bpg.trim() : oblik !== "" && f.pib.trim() && f.maticniBroj.trim() && f.adresaSedista.trim() && (odnos !== "ZASTUPNIK" || f.zastupnikFunkcija.trim())) &&
    !!ocistiKontaktEmail(f.kontaktEmail) && !!ocistiKontaktTelefon(f.kontaktTelefon) &&
    f.mapaMesto.trim() && f.mapaAdresa.trim() && tacka && lokacijaUSrbiji(tacka.lat, tacka.lng) &&
    izjavaAdresa && potvrdaEvidentiranja && (!trebaOvlascenje || izjavaOvlascenja);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    if (!spremno || !tacka) return;
    setRadi(true);
    setGreska(null);
    const r = await fetch("/api/pokroviteljstvo/upis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vrsta,
        ...f,
        pravniOblik: oblikIliNull,
        odnosPremaDavaocu: odnos,
        mapaLat: tacka.lat,
        mapaLng: tacka.lng,
        logoUrl,
        gazdinstvoId,
        izjavaAdresa,
        izjavaOvlascenja: trebaOvlascenje && izjavaOvlascenja,
        potvrdaEvidentiranja,
      }),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(false);
    if (!r.ok) {
      setGreska(d.error ?? t("forma_greska_slanja"));
      return;
    }
    router.push(`/postani-pokrovitelj/${d.id}`);
    router.refresh();
  }

  const polje = KLASE_UNOSA;
  const labela = "mb-1.5 block text-sm font-medium text-kolo-text";
  const ODNOS: Record<OdnosPremaDavaocu, string> = {
    ZASTUPNIK: t("dobra_odnos_zastupnik"),
    PREDUZETNIK: t("dobra_odnos_preduzetnik"),
    VLASNIK: t("dobra_odnos_vlasnik"),
    JEDAN_OD_VLASNIKA: t("dobra_odnos_jedan_od_vlasnika"),
    STVARNI_VLASNIK: t("dobra_odnos_stvarni_vlasnik"),
    OVLASCENO_LICE: t("dobra_odnos_ovlasceno_lice"),
    NOSILAC_GAZDINSTVA: t("dobra_odnos_nosilac"),
  };

  return (
    <form onSubmit={posalji} noValidate className="space-y-4 bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica p-5">
      {gazdinstvo && predlog && (
        <Obavestenje
          vrsta="info"
          radnja={
            <Dugme velicina="sm" onClick={popuniIzGazdinstva}>
              {t("upis_predlog_popuni")}
            </Dugme>
          }
        >
          <p>{t("upis_predlog_gazdinstva", { naziv: predlog.naziv })}</p>
        </Obavestenje>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LogotipPolje url={logoUrl} onChange={setLogoUrl} napomena={t("logotip_napomena_upis")} />
        <Polje className="md:col-span-2" oznaka={gazdinstvo ? t("dobra_naziv_gazdinstva_label") : t("forma_naziv_label")}>
          <input value={f.naziv} onChange={postavi("naziv")} className={polje} />
        </Polje>
        {gazdinstvo ? (
          <Polje oznaka={t("dobra_bpg_label")}><input value={f.bpg} onChange={postavi("bpg")} inputMode="numeric" maxLength={12} className={polje} /></Polje>
        ) : (
          <>
            <Polje oznaka={t("forma_pib_label")}><input value={f.pib} onChange={postavi("pib")} inputMode="numeric" maxLength={9} className={polje} /></Polje>
            <Polje oznaka={t("forma_mb_label")}><input value={f.maticniBroj} onChange={postavi("maticniBroj")} inputMode="numeric" maxLength={8} className={polje} /></Polje>
            <Polje className="md:col-span-2" oznaka={t("forma_sediste_label")}><input value={f.adresaSedista} onChange={postavi("adresaSedista")} className={polje} /></Polje>
            <Polje oznaka={t("upis_pravni_oblik_label")}>
              <select
                value={oblik}
                onChange={(e) => {
                  const novi = e.target.value as PravniOblik | "";
                  setOblik(novi);
                  // Odnos zavisi od pravnog oblika: preduzetnik je jedini izbor kod preduzetnika.
                  setOdnos(novi === "PREDUZETNIK" ? "PREDUZETNIK" : "");
                  setIzjavaOvlascenja(false);
                }}
                className={polje}
              >
                <option value="">{t("upis_pravni_oblik_izaberi")}</option>
                {PRAVNI_OBLICI.map((o) => <option key={o} value={o}>{t(`pravni_oblik_${o}`)}</option>)}
              </select>
            </Polje>
            <Polje oznaka={t("upis_odnos_label")}>
              <select value={odnos} onChange={(e) => setOdnos(e.target.value as OdnosPremaDavaocu | "")} disabled={oblik === ""} className={polje}>
                <option value="">{t("dobra_odnos_izaberi")}</option>
                {oblik !== "" && ODNOSI_PO_OBLIKU[oblik].map((o) => <option key={o} value={o}>{ODNOS[o]}</option>)}
              </select>
            </Polje>
            {odnos === "ZASTUPNIK" && (
              <Polje oznaka={t("forma_funkcija_label")}><input value={f.zastupnikFunkcija} onChange={postavi("zastupnikFunkcija")} placeholder={t("forma_funkcija_primer")} className={polje} /></Polje>
            )}
          </>
        )}
        {upisanoIme ? (
          <div>
            <p className={labela}>{gazdinstvo ? t("dobra_nosilac_label") : t("dobra_podnosilac_label")}</p>
            <p className="text-sm text-kolo-text py-2">{upisanoIme}</p>
          </div>
        ) : (
          <Polje oznaka={gazdinstvo ? t("dobra_nosilac_label") : t("dobra_podnosilac_label")}>
            <input value={f.imePrezime} onChange={postavi("imePrezime")} maxLength={MAX_IME_PREZIME} autoComplete="name" className={polje} />
          </Polje>
        )}
        <Polje oznaka={t("upis_kontakt_email_label")}><input type="email" value={f.kontaktEmail} onChange={postavi("kontaktEmail")} autoComplete="email" className={polje} /></Polje>
        <Polje oznaka={t("upis_kontakt_telefon_label")}><input type="tel" value={f.kontaktTelefon} onChange={postavi("kontaktTelefon")} autoComplete="tel" className={polje} /></Polje>
      </div>

      {/* ── Prikaz na mapi (čl. 16, čl. 26 st. 2) ─────────────────────── */}
      <h3 className="text-sm font-semibold text-kolo-text pt-2">{t("upis_mapa_naslov")}</h3>
      <p className="text-xs text-kolo-muted">{t("upis_mapa_opis")}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Polje oznaka={t("upis_mapa_mesto_label")}>
          <LokacijaSearch value={f.mapaMesto} onChange={(v) => setF((s) => ({ ...s, mapaMesto: v }))} />
        </Polje>
        <div>
          <label htmlFor="upis-mapa-adresa" className={labela}>{t("upis_mapa_adresa_label")}</label>
          <div className="flex gap-2">
            <input
              id="upis-mapa-adresa"
              value={f.mapaAdresa}
              onChange={postavi("mapaAdresa")}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void pronadji(); } }}
              className={polje}
              autoComplete="off"
            />
            <Dugme varijanta="sekundarno" className="shrink-0 min-h-11" onClick={() => void pronadji()} disabled={trazi || !f.mapaAdresa.trim()}>
              {trazi ? tg("adresa_trazim") : tg("adresa_pronadji")}
            </Dugme>
          </div>
        </div>
      </div>
      <p className="text-xs text-kolo-muted">{porukaAdrese ?? t("upis_tacka_napomena")}</p>
      <MapaGazdinstava izbor={tacka} onIzbor={setTacka} centar={pronadjeno ?? centarNaselja} zumCentra={pronadjeno ? 17 : 14} visina={300} />

      {/* ── Izjave (čl. 16 i 17) ─────────────────────────────────────── */}
      <label className="flex items-start gap-2 text-sm text-kolo-text">
        <input type="checkbox" className="mt-0.5" checked={izjavaAdresa} onChange={(e) => setIzjavaAdresa(e.target.checked)} />
        {t("upis_izjava_adresa")}
      </label>
      {trebaOvlascenje && (
        <label className="flex items-start gap-2 text-sm text-kolo-text">
          <input type="checkbox" className="mt-0.5" checked={izjavaOvlascenja} onChange={(e) => setIzjavaOvlascenja(e.target.checked)} />
          {t(kljucevi.ovlascenje)}
        </label>
      )}
      <label className="flex items-start gap-2 text-sm text-kolo-text">
        <input type="checkbox" className="mt-0.5" checked={potvrdaEvidentiranja} onChange={(e) => setPotvrdaEvidentiranja(e.target.checked)} />
        {t(kljucevi.potvrda)}
      </label>
      <p className="text-xs text-kolo-muted">{gazdinstvo ? t("upis_napomena_gazdinstvo") : t("upis_napomena_firma")}</p>
      <p className="text-xs text-kolo-muted">
        <Link href="/pravilnik/pokroviteljstvo-donacije" className="underline">{t("upis_pravilnik_link")}</Link>
        {" · "}
        <Link href="/privatnost" className="underline">{t("upis_privatnost_link")}</Link>
      </p>

      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      <Dugme type="submit" velicina="lg" punaSirina disabled={!spremno}>
        {radi ? t("forma_saljem") : t("upis_posalji")}
      </Dugme>
    </form>
  );
}
