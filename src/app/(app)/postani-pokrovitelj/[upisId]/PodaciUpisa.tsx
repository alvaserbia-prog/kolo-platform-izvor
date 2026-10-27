"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import LokacijaSearch from "@/components/LokacijaSearch";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import { koordinateZaMesto } from "@/lib/udaljenost";
import { nadjiAdresu } from "@/lib/geokodiranje";
import { MAX_IME_PREZIME } from "@/lib/identitet-pravila";
import { ODNOSI_FIRME, type OdnosPremaDavaocu } from "@/lib/pokroviteljstvo-dobrima-pravila";
import LogotipPolje from "../LogotipPolje";
import type { UpisZaProfil } from "./UpisProfil";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";

const MapaGazdinstava = dynamic(() => import("@/components/MapaGazdinstava"), { ssr: false });

/**
 * Podaci pokrovitelja (donacije čl. 18 st. 2 i 4).
 *
 * Kontakt, sedište i podaci za mapu menjaju se odmah; naziv, matični broj i
 * logotip idu na ponovnu proveru Fondacije — do odluke važe ranije odobreni. PIB i
 * BPG se ne menjaju (drugi PIB je drugi pokrovitelj).
 *
 * 🔴 Uz novu adresu za mapu ide i nova izjava da se adresa prikazuje — obavezna;
 * izjava se ne povlači. Izlaz je samo brisanje upisa, kad pokrovitelj nema ugovor
 * sa neiskorišćenim vaučerima. Brisanjem prestaju prikaz na mapi i ponuda vaučera;
 * doprinosi ostaju na rang-listi, osim ako korisnik zatraži i uklanjanje sa nje.
 */
export default function PodaciUpisa({ upis }: { upis: UpisZaProfil }) {
  const t = useTranslations("postaniPokrovitelj");
  const tg = useTranslations("gazdinstva");
  const router = useRouter();
  const firma = upis.vrsta === "FIRMA";

  const [f, setF] = useState({
    naziv: upis.izmenaNaziv ?? upis.naziv,
    maticniBroj: upis.izmenaMaticniBroj ?? upis.maticniBroj ?? "",
    adresaSedista: upis.adresaSedista ?? "",
    kontaktEmail: upis.kontaktEmail ?? "",
    kontaktTelefon: upis.kontaktTelefon ?? "",
    imePrezime: "",
    zastupnikFunkcija: "",
    mapaMesto: upis.mapaMesto ?? "",
    mapaAdresa: upis.mapaAdresa ?? "",
  });
  const [odnos, setOdnos] = useState<OdnosPremaDavaocu | "">("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [tacka, setTacka] = useState<{ lat: number; lng: number } | null>(
    upis.mapaLat != null && upis.mapaLng != null ? { lat: upis.mapaLat, lng: upis.mapaLng } : null,
  );
  const [mapaMenjana, setMapaMenjana] = useState(false);
  const [pronadjeno, setPronadjeno] = useState<[number, number] | null>(tacka ? [tacka.lat, tacka.lng] : null);
  const [izjavaAdresa, setIzjavaAdresa] = useState(false);
  const [trazi, setTrazi] = useState(false);
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState<{ tekst: string; ok: boolean } | null>(null);
  const [brisanje, setBrisanje] = useState(false);
  const [ukloniSaRangListe, setUkloniSaRangListe] = useState(false);
  const { dijalog, potvrdi } = useDijalog();

  const postavi = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const postaviMapu = (k: "mapaMesto" | "mapaAdresa") => (v: string) => { setF((s) => ({ ...s, [k]: v })); setMapaMenjana(true); };
  const centar = useMemo(() => {
    if (pronadjeno) return pronadjeno;
    const k = koordinateZaMesto(f.mapaMesto);
    return k ? ([k[0], k[1]] as [number, number]) : null;
  }, [f.mapaMesto, pronadjeno]);
  // Zatečeni upis bez izjave i tačke: podaci za mapu se dopunjuju ovde.
  const trebaIzjava = mapaMenjana || !upis.imaIzjavuAdrese;

  async function pronadji() {
    if (!f.mapaAdresa.trim() || trazi) return;
    setTrazi(true);
    try {
      const t0 = await nadjiAdresu(f.mapaAdresa, f.mapaMesto);
      if (t0) { setTacka(t0); setPronadjeno([t0.lat, t0.lng]); setMapaMenjana(true); }
      else setPoruka({ tekst: tg("adresa_nije_nadjena"), ok: false });
    } catch {
      setPoruka({ tekst: tg("adresa_nije_nadjena"), ok: false });
    } finally {
      setTrazi(false);
    }
  }

  async function sacuvaj() {
    setRadi(true);
    setPoruka(null);
    const telo: Record<string, unknown> = {
      naziv: f.naziv,
      kontaktEmail: f.kontaktEmail,
      kontaktTelefon: f.kontaktTelefon,
      ...(firma ? { maticniBroj: f.maticniBroj, adresaSedista: f.adresaSedista } : {}),
      ...(logoUrl ? { logoUrl } : {}),
      ...(!upis.imePrezime && f.imePrezime.trim() ? { imePrezime: f.imePrezime } : {}),
      ...(!upis.odnosPremaDavaocu && odnos ? { odnosPremaDavaocu: odnos, zastupnikFunkcija: f.zastupnikFunkcija } : {}),
      ...(trebaIzjava && tacka
        ? { mapaMesto: f.mapaMesto, mapaAdresa: f.mapaAdresa, mapaLat: tacka.lat, mapaLng: tacka.lng, izjavaAdresa }
        : {}),
    };
    const r = await fetch(`/api/pokroviteljstvo/upis/${upis.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telo),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(false);
    if (r.ok) {
      setPoruka({ tekst: t("podaci_sacuvano"), ok: true });
      setMapaMenjana(false);
      setIzjavaAdresa(false);
      router.refresh();
    } else setPoruka({ tekst: d.error ?? t("forma_greska_slanja"), ok: false });
  }

  async function obrisi() {
    if (!(await potvrdi({ poruka: ukloniSaRangListe ? t("brisanje_potvrda_rang") : t("brisanje_potvrda"), opasno: true, dugme: t("brisanje_potvrdi") }))) return;
    setRadi(true);
    const r = await fetch(`/api/pokroviteljstvo/upis/${upis.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ukloniSaRangListe }),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(false);
    if (r.ok) {
      router.push("/postani-pokrovitelj");
      router.refresh();
    } else setPoruka({ tekst: d.error ?? t("forma_greska_slanja"), ok: false });
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
    <div className="space-y-5">
      {dijalog}
      <Kartica as="section" className="space-y-4">
        {poruka && (
          <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>
            {poruka.tekst}
          </Obavestenje>
        )}
        {upis.izmenaNaProveri && <Obavestenje vrsta="info">{t("podaci_izmena_na_proveri")}</Obavestenje>}
        {upis.izmenaOdbijenaRazlog && <Obavestenje vrsta="greska">{t("podaci_izmena_odbijena", { razlog: upis.izmenaOdbijenaRazlog })}</Obavestenje>}
        <p className="text-xs text-kolo-muted">{t("podaci_napomena")}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex items-center gap-3">
            <LogotipPokrovitelja url={upis.izmenaLogoUrl ?? upis.logoUrl} velicina={48} />
          </div>
          <LogotipPolje url={logoUrl} onChange={setLogoUrl} napomena={t("logotip_napomena_izmena")} />
          <Polje className="md:col-span-2" oznaka={firma ? t("forma_naziv_label") : t("dobra_naziv_gazdinstva_label")}><input value={f.naziv} onChange={postavi("naziv")} className={polje} /></Polje>
          {firma ? (
            <>
              <div><p className={labela}>{t("forma_pib_label")}</p><p className="text-sm py-2 text-kolo-text">{upis.pib}</p></div>
              <Polje oznaka={t("forma_mb_label")}><input value={f.maticniBroj} onChange={postavi("maticniBroj")} inputMode="numeric" maxLength={8} className={polje} /></Polje>
              <Polje className="md:col-span-2" oznaka={t("forma_sediste_label")}><input value={f.adresaSedista} onChange={postavi("adresaSedista")} className={polje} /></Polje>
            </>
          ) : (
            <div><p className={labela}>{t("dobra_bpg_label")}</p><p className="text-sm py-2 text-kolo-text">{upis.bpg}</p></div>
          )}
          {upis.imePrezime ? (
            <div>
              <p className={labela}>{firma ? t("dobra_podnosilac_label") : t("dobra_nosilac_label")}</p>
              <p className="text-sm py-2 text-kolo-text">{upis.imePrezime}</p>
            </div>
          ) : (
            <Polje oznaka={firma ? t("dobra_podnosilac_label") : t("dobra_nosilac_label")}>
              <input value={f.imePrezime} onChange={postavi("imePrezime")} maxLength={MAX_IME_PREZIME} autoComplete="name" className={polje} />
            </Polje>
          )}
          {firma && !upis.odnosPremaDavaocu && (
            <div>
              <label htmlFor="podaci-odnos" className={labela}>{t("upis_odnos_label")}</label>
              <select id="podaci-odnos" value={odnos} onChange={(e) => setOdnos(e.target.value as OdnosPremaDavaocu | "")} className={polje}>
                <option value="">{t("dobra_odnos_izaberi")}</option>
                {ODNOSI_FIRME.map((o) => <option key={o} value={o}>{ODNOS[o]}</option>)}
              </select>
              {odnos === "ZASTUPNIK" && (
                <input value={f.zastupnikFunkcija} onChange={postavi("zastupnikFunkcija")} placeholder={t("forma_funkcija_primer")} aria-label={t("forma_funkcija_label")} className={`${polje} mt-2`} />
              )}
            </div>
          )}
          <Polje oznaka={t("upis_kontakt_email_label")}><input type="email" value={f.kontaktEmail} onChange={postavi("kontaktEmail")} className={polje} /></Polje>
          <Polje oznaka={t("upis_kontakt_telefon_label")}><input type="tel" value={f.kontaktTelefon} onChange={postavi("kontaktTelefon")} className={polje} /></Polje>
        </div>

        <h3 className="text-sm font-semibold text-kolo-text pt-2">{t("upis_mapa_naslov")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Polje oznaka={t("upis_mapa_mesto_label")}>
            <LokacijaSearch value={f.mapaMesto} onChange={postaviMapu("mapaMesto")} />
          </Polje>
          <div>
            <label htmlFor="podaci-mapa-adresa" className={labela}>{t("upis_mapa_adresa_label")}</label>
            <div className="flex gap-2">
              <input id="podaci-mapa-adresa" value={f.mapaAdresa} onChange={(e) => postaviMapu("mapaAdresa")(e.target.value)} className={polje} autoComplete="off" />
              <Dugme varijanta="sekundarno" className="shrink-0 min-h-11" onClick={() => void pronadji()} disabled={trazi || !f.mapaAdresa.trim()}>
                {trazi ? tg("adresa_trazim") : tg("adresa_pronadji")}
              </Dugme>
            </div>
          </div>
        </div>
        <MapaGazdinstava izbor={tacka} onIzbor={(x) => { setTacka(x); setMapaMenjana(true); }} centar={centar} zumCentra={16} visina={260} />
        {trebaIzjava && (
          <label className="flex items-start gap-2 text-sm text-kolo-text">
            <input type="checkbox" className="mt-0.5" checked={izjavaAdresa} onChange={(e) => setIzjavaAdresa(e.target.checked)} />
            {t("upis_izjava_adresa")}
          </label>
        )}
        <Dugme onClick={sacuvaj} disabled={radi || (trebaIzjava && mapaMenjana && !izjavaAdresa)}>
          {t("podaci_sacuvaj")}
        </Dugme>
      </Kartica>

      {/* Brisanje upisa (čl. 18 st. 4). */}
      <section className="bg-kolo-surface border border-kolo-danger/30 rounded-kartica shadow-kartica p-5 space-y-3">
        <h3 className="text-sm font-semibold text-kolo-danger">{t("brisanje_naslov")}</h3>
        <p className="text-xs text-kolo-muted">{t("brisanje_opis")}</p>
        {!brisanje ? (
          <Dugme varijanta="sekundarno" onClick={() => setBrisanje(true)}>
            {t("brisanje_dugme")}
          </Dugme>
        ) : (
          <div className="space-y-2">
            <label className="flex items-start gap-2 text-sm text-kolo-text">
              <input type="checkbox" className="mt-0.5" checked={ukloniSaRangListe} onChange={(e) => setUkloniSaRangListe(e.target.checked)} />
              {t("brisanje_rang_lista")}
            </label>
            <div className="flex gap-2">
              <Dugme varijanta="opasno" onClick={obrisi} disabled={radi}>
                {t("brisanje_potvrdi")}
              </Dugme>
              <Dugme varijanta="sekundarno" onClick={() => setBrisanje(false)}>
                {t("brisanje_odustani")}
              </Dugme>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
