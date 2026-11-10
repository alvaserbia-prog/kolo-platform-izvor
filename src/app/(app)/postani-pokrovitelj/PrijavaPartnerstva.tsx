"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import { DOKAZ_MAX_FAJLOVA } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { vrednostPartnerstva, MIN_OPIS } from "@/lib/partnerstvo-pravila";
import Kartica from "@/components/ui/Kartica";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

/**
 * Prijava partnerstva (Pravilnik o pokroviteljstvu i donacijama čl. 41) iz ODOBRENOG upisa:
 * opis usluge, odnosno ustupanja, jedinica mere, predviđeni obim, rok izvršenja, cena po
 * jedinici iz cenovnika, fotografija cenovnika i da li partner obrađuje podatke korisnika.
 * Podaci o partneru su u upisu.
 *
 * 🔴 Na ovom obrascu se ne pominje POEN: vrednost je dinarska (cena koju partner primenjuje u
 * prometu), a doprinos se ne izvodi pred partnerom. Fotografiju cenovnika vidi samo
 * administratorski tim.
 */
const PRIHVATA = "image/jpeg,image/png,image/webp";

export default function PrijavaPartnerstva({ upisId, onPoslato }: { upisId: string; onPoslato: () => void }) {
  const t = useTranslations("postaniPokrovitelj");
  const locale = useLocale();
  const [f, setF] = useState({ opis: "", jedinicaMere: "", obim: "", cenaPoJedinici: "", rokIzvrsenja: "" });
  const [obrada, setObrada] = useState(false);
  const [izjava, setIzjava] = useState(false);
  const [cenovnik, setCenovnik] = useState<File[]>([]);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const postavi = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const vrednost = vrednostPartnerstva(Number(f.obim) || 0, Number(f.cenaPoJedinici) || 0);
  const mozeSlanje =
    izjava && cenovnik.length > 0 && f.opis.trim().length >= MIN_OPIS && !!f.jedinicaMere.trim() &&
    Number(f.obim) > 0 && Number(f.cenaPoJedinici) > 0 && !!f.rokIzvrsenja;

  async function posalji() {
    setGreska(null);
    if (radi) return;
    // Dugme se ne gasi zbog nepotpunog obrasca: klik kaže šta fali (dizajn-sistem.md).
    if (!mozeSlanje) {
      setGreska(t("partnerstvo_fali"));
      return;
    }
    setRadi(true);
    const fd = new FormData();
    fd.append("upisId", upisId);
    for (const [k, v] of Object.entries(f)) fd.append(k, v);
    fd.append("obradaPodataka", obrada ? "true" : "false");
    fd.append("izjavaPodnosioca", izjava ? "true" : "false");
    for (const c of cenovnik) fd.append("cenovnik", c);
    const res = await fetch("/api/pokroviteljstvo/partnerstvo", { method: "POST", body: fd });
    const d = await res.json().catch(() => ({}));
    setRadi(false);
    if (res.ok) onPoslato();
    else setGreska(d.error ?? t("forma_greska_slanja"));
  }

  const polje = KLASE_UNOSA;
  return (
    <Kartica className="space-y-4">
      <NaslovSekcije opis={t("partnerstvo_opis")}>{t("partnerstvo_naslov")}</NaslovSekcije>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Polje className="md:col-span-2" oznaka={t("partnerstvo_opis_label")} pomoc={t("partnerstvo_opis_pomoc")}>
          <textarea value={f.opis} onChange={postavi("opis")} rows={3} className={polje} />
        </Polje>
        <Polje oznaka={t("partnerstvo_jedinica_label")} pomoc={t("partnerstvo_jedinica_pomoc")}>
          <input value={f.jedinicaMere} onChange={postavi("jedinicaMere")} className={polje} />
        </Polje>
        <Polje oznaka={t("partnerstvo_obim_label")}>
          <input type="number" min={0} step="0.01" value={f.obim} onChange={postavi("obim")} className={polje} />
        </Polje>
        <Polje oznaka={t("partnerstvo_cena_label")}>
          <input type="number" min={0} step="0.01" value={f.cenaPoJedinici} onChange={postavi("cenaPoJedinici")} className={polje} />
        </Polje>
        <Polje oznaka={t("partnerstvo_rok_label")}>
          <input type="date" value={f.rokIzvrsenja} onChange={postavi("rokIzvrsenja")} className={polje} />
        </Polje>
      </div>
      <p className="text-sm text-kolo-muted">
        {t("partnerstvo_vrednost", { vrednost: vrednost.toLocaleString(intlTag(locale)) })}
      </p>

      <Polje oznaka={t("dobra_cenovnik_label")}>
        <input type="file" multiple accept={PRIHVATA}
          onChange={(e) => setCenovnik(Array.from(e.target.files ?? []).slice(0, DOKAZ_MAX_FAJLOVA))} className="text-sm" />
      </Polje>
      <p className="text-xs text-kolo-muted">{t("dobra_dokaz_napomena")}</p>

      {/* Ugovor o obradi (čl. 42 st. 3) — uslov prve potvrde izvršenja. */}
      <label className="flex items-start gap-2 text-sm text-kolo-text">
        <input type="checkbox" checked={obrada} onChange={(e) => setObrada(e.target.checked)} className="mt-0.5" />
        {t("partnerstvo_obrada")}
      </label>
      {obrada && <p className="text-xs text-kolo-muted">{t("partnerstvo_obrada_napomena")}</p>}

      <label className="flex items-start gap-2 text-sm text-kolo-text">
        <input type="checkbox" checked={izjava} onChange={(e) => setIzjava(e.target.checked)} className="mt-0.5" />
        {t("partnerstvo_izjava")}
      </label>
      <p className="text-xs text-kolo-muted">{t("partnerstvo_napomena")}</p>

      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      <Dugme onClick={posalji} disabled={radi}>
        {radi ? t("forma_saljem") : t("forma_podnesi")}
      </Dugme>
    </Kartica>
  );
}
