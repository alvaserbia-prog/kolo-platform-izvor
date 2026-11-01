"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import LokacijaSearch from "@/components/LokacijaSearch";
import { MAX_MESTA_PREDAJE } from "@/lib/mesta-pravila";
import {
  MIN_VREDNOST_UGOVORA_RSD,
  MAX_VREDNOST_UGOVORA_RSD,
  DOKAZ_MAX_FAJLOVA,
  vrednostUgovora,
  uGranicamaVrednosti,
} from "@/lib/pokroviteljstvo-dobrima-pravila";
import { VRSTE_HRANE, VRSTE_GRLA, UDELI_HRANE, ISHRANE_KRAVA, DJUBRENJA, ZASTITE, ZIVOTINJSKE, BILJNE, type VrstaHrane } from "@/lib/hrana-pravila";
import Kartica from "@/components/ui/Kartica";
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
  vrsta: "DOBRO" as "DOBRO" | "USLUGA", opis: "", brojVaucera: "", cenaPoJedinici: "", mesto: "", adresaPredaje: "",
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
  const [f, setF] = useState({ ...prazno, mesto: mesto ?? "", adresaPredaje: adresa ?? "" });
  const [dodatna, setDodatna] = useState<{ mesto: string; adresa: string }[]>([]);
  const promeniDodatno = (i: number, izmena: Partial<{ mesto: string; adresa: string }>) =>
    setDodatna((d) => d.map((m, j) => (j === i ? { ...m, ...izmena } : m)));
  const [izjavaPropisi, setIzjavaPropisi] = useState(false);
  // Set 5.0.2 — hrana: podaci o proizvodnji i izjava o njihovoj tačnosti (donacije čl. 28 st. 2 t. 6 i st. 3).
  const [jeHrana, setJeHrana] = useState(false);
  const [h, setH] = useState<Record<string, string>>({ vrstaHrane: "", opisProizvodnje: "", stalnihRadnika: "", vrstaGrla: "", brojGrla: "", povrsinaHa: "", plastenikHa: "", udeoHrane: "", ishranaKrava: "", djubrenje: "", zastita: "" });
  const [kavezi, setKavezi] = useState(false);
  const [organski, setOrganski] = useState(false);
  const ph = (k: string) => (e: { target: { value: string } }) => setH((s) => ({ ...s, [k]: e.target.value }));
  const vh = h.vrstaHrane as VrstaHrane | "";
  const zivotinjska = !!vh && ZIVOTINJSKE.includes(vh);
  const biljna = !!vh && BILJNE.includes(vh);
  const [izjavaPodataka, setIzjavaPodataka] = useState(false);
  const [cenovnik, setCenovnik] = useState<File[]>([]);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const postavi = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const vrednost = vrednostUgovora(Number(f.brojVaucera) || 0, Number(f.cenaPoJedinici) || 0);
  const vrednostOk = uGranicamaVrednosti(vrednost);

  async function posalji() {
    setGreska(null);
    setRadi(true);
    const fd = new FormData();
    fd.append("upisId", upisId);
    for (const [k, v] of Object.entries(f)) fd.append(k, v);
    for (const m of dodatna) {
      fd.append("dodatnoMesto", m.mesto.trim());
      fd.append("dodatnaAdresa", m.adresa.trim());
    }
    fd.append("izjavaPropisi", izjavaPropisi ? "true" : "false");
    if (jeHrana && f.vrsta === "DOBRO") {
      fd.append("jeHrana", "true");
      for (const [k, v] of Object.entries(h)) fd.append(k, v);
      fd.append("kavezi", kavezi ? "true" : "false");
      fd.append("organskiSertifikat", organski ? "true" : "false");
      fd.append("izjavaPodataka", izjavaPodataka ? "true" : "false");
    }
    for (const c of cenovnik) fd.append("cenovnik", c);
    const res = await fetch("/api/pokroviteljstvo/dobra", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    setRadi(false);
    if (res.ok) onPoslato();
    else setGreska(d.error ?? t("forma_greska_slanja"));
  }

  const polje = KLASE_UNOSA;
  const hranaOk = !jeHrana || f.vrsta !== "DOBRO" || (!!vh && h.opisProizvodnje.trim().length >= 5 && h.stalnihRadnika !== "" && izjavaPodataka);
  const mozeSlanje = !radi && izjavaPropisi && hranaOk && vrednostOk && cenovnik.length > 0 && !!f.mesto.trim() && !!f.adresaPredaje.trim() && dodatna.every((m) => m.mesto.trim() && m.adresa.trim()) && f.opis.trim().length >= 10;

  return (
    <Kartica className="space-y-4">
      <h2 className="font-semibold text-kolo-text">{t("dobra_naslov")}</h2>
      <p className="text-sm text-kolo-muted">{t("dobra_opis")}</p>
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
        <Polje oznaka={t("dobra_mesto_label")}>
          <LokacijaSearch value={f.mesto} onChange={(v) => setF((s) => ({ ...s, mesto: v }))} />
        </Polje>
        <Polje oznaka={t("dobra_adresa_label")}><input value={f.adresaPredaje} onChange={postavi("adresaPredaje")} className={polje} /></Polje>
        {/* Set 5.0.6 — više mesta predaje, odnosno pružanja (donacije čl. 28 st. 2 t. 5). */}
        {dodatna.map((m, i) => (
          <div key={i} className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-kolo-border pt-3">
            <Polje oznaka={t("dobra_dodatno_mesto_label", { broj: i + 2 })}>
              <LokacijaSearch value={m.mesto} onChange={(v) => promeniDodatno(i, { mesto: v })} />
            </Polje>
            <Polje oznaka={t("dobra_adresa_label")}>
              <input value={m.adresa} onChange={(e) => promeniDodatno(i, { adresa: e.target.value })} className={polje} />
            </Polje>
            <div className="md:col-span-2">
              <Dugme varijanta="tiho" velicina="sm" onClick={() => setDodatna((d) => d.filter((_, j) => j !== i))}>
                {t("dobra_ukloni_mesto")}
              </Dugme>
            </div>
          </div>
        ))}
      </div>
      {dodatna.length < MAX_MESTA_PREDAJE - 1 && (
        <div className="space-y-1">
          <Dugme varijanta="sekundarno" velicina="sm" onClick={() => setDodatna((d) => [...d, { mesto: "", adresa: "" }])}>
            {t("dobra_dodaj_mesto")}
          </Dugme>
          <p className="text-xs text-kolo-muted">{t("dobra_vise_mesta_napomena")}</p>
        </div>
      )}

      {/* Set 5.0.2 — hrana (donacije čl. 22 st. 5, čl. 28 st. 2 t. 6): davalac daje samo podatke o
          proizvodnji, a poreklo utvrđuje Fondacija pri prihvatanju prijave. */}
      {f.vrsta === "DOBRO" && (
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm text-kolo-text">
            <input type="checkbox" checked={jeHrana} onChange={(e) => setJeHrana(e.target.checked)} className="mt-0.5" />
            {t("dobra_hrana_oznaka")}
          </label>
          {jeHrana && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Polje oznaka={t("dobra_hrana_vrsta_label")}>
                <select value={h.vrstaHrane} onChange={ph("vrstaHrane")} className={polje}>
                  <option value="">—</option>
                  {VRSTE_HRANE.map((v) => <option key={v} value={v}>{t(`dobra_hrana_vrsta_${v}`)}</option>)}
                </select>
              </Polje>
              <Polje oznaka={t("dobra_hrana_radnici_label")} pomoc={t("dobra_hrana_radnici_pomoc")}>
                <input type="number" min={0} value={h.stalnihRadnika} onChange={ph("stalnihRadnika")} className={polje} />
              </Polje>
              <Polje className="md:col-span-2" oznaka={t("dobra_hrana_opis_label")} pomoc={t("dobra_hrana_opis_pomoc")}>
                <textarea value={h.opisProizvodnje} onChange={ph("opisProizvodnje")} rows={2} className={polje} />
              </Polje>
              {zivotinjska && (
                <>
                  <Polje oznaka={t("dobra_hrana_grla_vrsta_label")}>
                    <select value={h.vrstaGrla} onChange={ph("vrstaGrla")} className={polje}>
                      <option value="">—</option>
                      {VRSTE_GRLA.map((v) => <option key={v} value={v}>{t(`dobra_hrana_grla_${v}`)}</option>)}
                    </select>
                  </Polje>
                  <Polje oznaka={t("dobra_hrana_grla_broj_label")}>
                    <input type="number" min={1} value={h.brojGrla} onChange={ph("brojGrla")} className={polje} />
                  </Polje>
                </>
              )}
              {(vh === "MESO" || vh === "JAJA") && (
                <Polje className="md:col-span-2" oznaka={t("dobra_hrana_udeo_label")}>
                  <select value={h.udeoHrane} onChange={ph("udeoHrane")} className={polje}>
                    <option value="">—</option>
                    {UDELI_HRANE.map((v) => <option key={v} value={v}>{t(`dobra_hrana_udeo_${v}`)}</option>)}
                  </select>
                </Polje>
              )}
              {vh === "JAJA" && (
                <label className="md:col-span-2 flex items-start gap-2 text-sm text-kolo-text">
                  <input type="checkbox" checked={kavezi} onChange={(e) => setKavezi(e.target.checked)} className="mt-0.5" />
                  {t("dobra_hrana_kavezi")}
                </label>
              )}
              {vh === "MLEKO" && (
                <Polje className="md:col-span-2" oznaka={t("dobra_hrana_krave_label")}>
                  <select value={h.ishranaKrava} onChange={ph("ishranaKrava")} className={polje}>
                    <option value="">—</option>
                    {ISHRANE_KRAVA.map((v) => <option key={v} value={v}>{t(`dobra_hrana_krave_${v}`)}</option>)}
                  </select>
                </Polje>
              )}
              {biljna && (
                <>
                  <Polje oznaka={t("dobra_hrana_ha_label")}>
                    <input type="number" min={0} step="0.01" value={h.povrsinaHa} onChange={ph("povrsinaHa")} className={polje} />
                  </Polje>
                  {vh === "POVRCE" && (
                    <Polje oznaka={t("dobra_hrana_plastenik_label")}>
                      <input type="number" min={0} step="0.01" value={h.plastenikHa} onChange={ph("plastenikHa")} className={polje} />
                    </Polje>
                  )}
                  <label className="md:col-span-2 flex items-start gap-2 text-sm text-kolo-text">
                    <input type="checkbox" checked={organski} onChange={(e) => setOrganski(e.target.checked)} className="mt-0.5" />
                    {t("dobra_hrana_organski")}
                  </label>
                  {!organski && (
                    <>
                      <Polje oznaka={t("dobra_hrana_djubrenje_label")}>
                        <select value={h.djubrenje} onChange={ph("djubrenje")} className={polje}>
                          <option value="">—</option>
                          {DJUBRENJA.map((v) => <option key={v} value={v}>{t(`dobra_hrana_djubrenje_${v}`)}</option>)}
                        </select>
                      </Polje>
                      <Polje oznaka={t("dobra_hrana_zastita_label")}>
                        <select value={h.zastita} onChange={ph("zastita")} className={polje}>
                          <option value="">—</option>
                          {ZASTITE.map((v) => <option key={v} value={v}>{t(`dobra_hrana_zastita_${v}`)}</option>)}
                        </select>
                      </Polje>
                    </>
                  )}
                </>
              )}
              <label className="md:col-span-2 flex items-start gap-2 text-sm text-kolo-text">
                <input type="checkbox" checked={izjavaPodataka} onChange={(e) => setIzjavaPodataka(e.target.checked)} className="mt-0.5" />
                {t("dobra_hrana_izjava")}
              </label>
            </div>
          )}
        </div>
      )}

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
      <Dugme onClick={posalji} disabled={!mozeSlanje}>
        {radi ? t("forma_saljem") : t("forma_podnesi")}
      </Dugme>
    </Kartica>
  );
}
