"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import MestaPredajePolja, { mestaUFormu, mestaPotpuna, type MestoUnos } from "./MestaPredajePolja";
import HranaPolja, { PRAZNA_HRANA, hranaUPolja, hranaSpremna, type HranaUnos } from "./HranaPolja";
import {
  MIN_VREDNOST_UGOVORA_RSD,
  MAX_VREDNOST_UGOVORA_RSD,
  DOKAZ_MAX_FAJLOVA,
  vrednostUgovora,
  uGranicamaVrednosti,
} from "@/lib/pokroviteljstvo-dobrima-pravila";
import Kartica from "@/components/ui/Kartica";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

/**
 * Prijava pokroviteljstva dobrima i uslugama (Pravilnik o pokroviteljstvu i
 * donacijama čl. 28) iz ODOBRENOG upisa (čl. 16): samo opis dobra odnosno usluge,
 * broj vaučera, cena, fotografija cenovnika, mesto i adresa predaje (i dodatna mesta,
 * set 5.0.6) i izjava o
 * propisima. Podaci o davaocu, odnos, kontakt, logotip i izjave su u upisu.
 * Dokaz cene je samo fotografija cenovnika; Fondacija cenu ne upoređuje (čl. 29
 * st. 2). Rok važenja je fiksno godinu dana (čl. 29 st. 5) i ne bira se.
 *
 * 🔴 Na ovom obrascu se ne pominje POEN: vrednost je dinarska (cena koju davalac
 * primenjuje u prometu), a broj POEN-a nije cena i ne izvodi se iz nje pred
 * davaocem. Fotografiju cenovnika vidi samo administratorski tim.
 */
const PRIHVATA = "image/jpeg,image/png,image/webp";

const prazno = {
  vrsta: "DOBRO" as "DOBRO" | "USLUGA", opis: "", brojVaucera: "", cenaPoJedinici: "",
};

export default function PrijavaDobra({
  upisId,
  mesto,
  adresa,
  onPoslato,
}: {
  upisId: string;
  /** Mesto i adresa iz upisa (za gazdinstvo preuzeti iz gazdinstva) — ne traže se ponovo, mogu se izmeniti. */
  mesto: string | null;
  adresa: string | null;
  onPoslato: () => void;
}) {
  const t = useTranslations("postaniPokrovitelj");
  const locale = useLocale();
  const [f, setF] = useState(prazno);
  const [mesta, setMesta] = useState<MestoUnos[]>([{ mesto: mesto ?? "", adresa: adresa ?? "", tacka: null }]);
  const [izjavaPropisi, setIzjavaPropisi] = useState(false);
  // Set 5.0.2 — hrana: podaci o proizvodnji i izjava o njihovoj tačnosti (donacije čl. 28 st. 2 t. 6 i st. 3).
  const [hrana, setHrana] = useState<HranaUnos>(PRAZNA_HRANA);
  const [cenovnik, setCenovnik] = useState<File[]>([]);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const postavi = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const vrednost = vrednostUgovora(Number(f.brojVaucera) || 0, Number(f.cenaPoJedinici) || 0);
  const vrednostOk = uGranicamaVrednosti(vrednost);

  async function posalji() {
    setGreska(null);
    if (radi) return;
    // Dugme se ne gasi zbog nepotpunog obrasca: klik kaže šta fali (dizajn-sistem.md).
    if (!mozeSlanje) {
      setGreska(t("dobra_fali"));
      return;
    }
    setRadi(true);
    const fd = new FormData();
    fd.append("upisId", upisId);
    for (const [k, v] of Object.entries(f)) fd.append(k, v);
    mestaUFormu(fd, mesta);
    fd.append("izjavaPropisi", izjavaPropisi ? "true" : "false");
    if (f.vrsta === "DOBRO") for (const [k, v] of Object.entries(hranaUPolja(hrana))) fd.append(k, v);
    for (const c of cenovnik) fd.append("cenovnik", c);
    const res = await fetch("/api/pokroviteljstvo/dobra", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    setRadi(false);
    if (res.ok) onPoslato();
    else setGreska(d.error ?? t("forma_greska_slanja"));
  }

  const polje = KLASE_UNOSA;
  const hranaOk = f.vrsta !== "DOBRO" || hranaSpremna(hrana);
  const mozeSlanje = izjavaPropisi && hranaOk && vrednostOk && cenovnik.length > 0 && mestaPotpuna(mesta) && f.opis.trim().length >= 10;

  return (
    <Kartica className="space-y-4">
      <NaslovSekcije opis={t("dobra_opis")}>{t("dobra_naslov")}</NaslovSekcije>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Polje oznaka={t("dobra_vrsta_label")}>
          <select value={f.vrsta} onChange={postavi("vrsta")} className={polje}>
            <option value="DOBRO">{t("dobra_vrsta_dobro")}</option>
            <option value="USLUGA">{t("dobra_vrsta_usluga")}</option>
          </select>
        </Polje>
        {/* P2 (registar 2026-10): šta ne može biti predmet vaučera — donacije čl. 30. */}
        <Polje className="md:col-span-2" oznaka={t("dobra_opis_label")} pomoc={t("dobra_iskljuceno")}>
          <textarea value={f.opis} onChange={postavi("opis")} rows={2} placeholder={t("dobra_opis_primer")} className={polje} />
        </Polje>
        <Polje oznaka={t("dobra_broj_label")}><input type="number" min={1} value={f.brojVaucera} onChange={postavi("brojVaucera")} className={polje} /></Polje>
        <Polje oznaka={t("dobra_cena_label")}><input type="number" min={0} step="0.01" value={f.cenaPoJedinici} onChange={postavi("cenaPoJedinici")} className={polje} /></Polje>
      </div>
      {/* Set 5.0.6 — više mesta predaje, odnosno pružanja (donacije čl. 28 st. 2 t. 5), sa tačnom tačkom po izboru. */}
      <MestaPredajePolja mesta={mesta} onChange={setMesta} />

      {/* Set 5.0.2 — hrana (donacije čl. 22 st. 5, čl. 28 st. 2 t. 6): davalac daje samo podatke o
          proizvodnji, a poreklo utvrđuje Fondacija pri prihvatanju prijave. */}
      {f.vrsta === "DOBRO" && <HranaPolja h={hrana} onChange={setHrana} />}

      <p className={`text-sm ${vrednostOk || vrednost === 0 ? "text-kolo-muted" : "text-kolo-danger"}`}>
        {t("dobra_vrednost", {
          vrednost: vrednost.toLocaleString(intlTag(locale)),
          min: MIN_VREDNOST_UGOVORA_RSD.toLocaleString(intlTag(locale)),
          max: MAX_VREDNOST_UGOVORA_RSD.toLocaleString(intlTag(locale)),
        })}
      </p>
      <p className="text-xs text-kolo-muted">{t("dobra_rok_napomena")}</p>

      <Polje oznaka={t("dobra_cenovnik_label")}>
        <input type="file" multiple accept={PRIHVATA}
          onChange={(e) => setCenovnik(Array.from(e.target.files ?? []).slice(0, DOKAZ_MAX_FAJLOVA))} className="text-sm" />
      </Polje>
      <p className="text-xs text-kolo-muted">{t("dobra_dokaz_napomena")}</p>

      {/* Izjava o propisima (čl. 28 st. 3). */}
      <label className="flex items-start gap-2 text-sm text-kolo-text">
        <input type="checkbox" checked={izjavaPropisi} onChange={(e) => setIzjavaPropisi(e.target.checked)} className="mt-0.5" />
        {t("dobra_izjava_propisi")}
      </label>
      <p className="text-xs text-kolo-muted">{t("dobra_kvota_napomena")}</p>
      {/* Obaveštenje, ne poreski savet (odluka vlasnika 20.10.2026): predaja po vaučeru
          je promet bez naknade, bez fiskalnog računa i e-fakture. */}
      <p className="text-xs text-kolo-muted">{t("dobra_porezi_napomena")}</p>

      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      <Dugme onClick={posalji} disabled={radi}>
        {radi ? t("forma_saljem") : t("forma_podnesi")}
      </Dugme>
    </Kartica>
  );
}
