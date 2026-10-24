"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Segmenti from "@/components/ui/Segmenti";
import LokacijaSearch from "@/components/LokacijaSearch";
import CenaUnos from "@/components/CenaUnos";
import { KATEGORIJE, kategorijaEmoji, kategorijaKljuc } from "@/lib/kategorije";
import { parsirajCenu, type CenaTip } from "@/lib/cena-oglas";
import { IZNOS, oglasIspunjavaMinimum } from "@/lib/doprinos-pravila";
import {
  MAX_SLIKA,
  MAX_UKUPNO,
  oslobodiPregled,
  porukaIzOdgovora,
  pripremiSlike,
  ukupnaVelicina,
  type IzabranaSlika,
} from "@/lib/slika-upload";
import { dogadjaj } from "@/lib/analitika";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";

const MAX_IMAGES = MAX_SLIKA;

/** Veza <label> → <input type="file">; birač otvara pretraživač, ne JavaScript. */
const ID_UNOSA = "pijaca-slike-unos";

export default function NoviOglasForma({
  defaultLocation = "",
  defaultPhone = "",
  initialTip = "PONUDA",
  verifikovan = true,
  maloletan = false,
  gazdinstvo = null,
  uImeGazdinstva = false,
}: {
  defaultLocation?: string;
  defaultPhone?: string;
  initialTip?: "PONUDA" | "POTRAZNJA";
  /** Nepotvrđenom važi sadržinski minimum kao uslov za objavu. */
  verifikovan?: boolean;
  /**
   * 🔴 Maloletnom nalogu se iznad izbora kategorije prikazuje šta ne sme da nudi
   * (Uslovi čl. 21, R-07 mera M-5″). Njegov oglas vide pretežno ili isključivo
   * druga deca, pa je to jedino mesto na kome ta zabrana stiže do publike koju
   * štiti. Deklarativno — filtera reči nema i ne uvodi se (Uslovi čl. 25 st. 1).
   */
  maloletan?: boolean;
  /** Gazdinstvo čiji je korisnik član — nudi se izbor „u ime gazdinstva" (čl. 10). */
  gazdinstvo?: { id: string; naziv: string } | null;
  /** Početni izbor (dolazak sa profila gazdinstva, `?gazdinstvo=`). */
  uImeGazdinstva?: boolean;
}) {
  const t = useTranslations("pijaca");
  const router = useRouter();
  const [tip, setTip] = useState<"PONUDA" | "POTRAZNJA">(initialTip);
  const jePotraznja = tip === "POTRAZNJA";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cenaTip, setCenaTip] = useState<CenaTip>("FIKSNA");
  const [price, setPrice] = useState("");
  const [cenaDo, setCenaDo] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState(defaultLocation);
  const [phone, setPhone] = useState(defaultPhone);
  const [zaGazdinstvo, setZaGazdinstvo] = useState(uImeGazdinstva && !!gazdinstvo);
  const [slike, setSlike] = useState<IzabranaSlika[]>([]);
  const [loading, setLoading] = useState(false);
  const [obrada, setObrada] = useState(false);
  const [error, setError] = useState("");
  const [uspeh, setUspeh] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const slikeRef = useRef<IzabranaSlika[]>([]);

  // Sličice se oslobađaju kad ekran ode — inače blob adrese ostaju u memoriji
  // kartice i posle objave oglasa.
  useEffect(() => {
    slikeRef.current = slike;
  }, [slike]);
  useEffect(() => {
    return () => {
      for (const s of slikeRef.current) oslobodiPregled(s);
    };
  }, []);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const izabrane = Array.from(e.target.files ?? []);
    // Reset vrednosti inputa: na mobilnom ponovni izbor iste slike inače ne okine onChange.
    e.target.value = "";
    if (izabrane.length === 0) return;

    const slobodno = MAX_IMAGES - slike.length;
    if (slobodno <= 0) return;

    setObrada(true);
    setError("");
    try {
      // Zbir se vodi lokalno kroz petlju: `slike` iz stanja je snimak sa početka
      // obrade, a slike stižu jedna po jedna. Samo ovaj rukovalac menja spisak
      // dok obrada traje, pa je lokalni zbir tačan.
      let tekuce = slike;
      let prekoracenje = false;

      // Jedna po jedna, sa sličicom čim je slika gotova. Paralelno dekodiranje je
      // obaralo karticu na iPhone-u (vidi `slika-upload.ts`), a čekanje na sve
      // odjednom je značilo da se do tada ne vidi ništa.
      const { formatOdbijen, velicinaOdbijena } = await pripremiSlike(
        izabrane.slice(0, slobodno),
        (slika) => {
          // Zbir se meri ODMAH, a ne pri slanju: platforma odbija preveliko telo
          // pre nego što ruta krene, pa bi se to inače videlo tek kao neuspelo
          // objavljivanje bez objašnjenja.
          const sledece = [...tekuce, slika];
          if (sledece.length > MAX_IMAGES || ukupnaVelicina(sledece.map((s) => s.file)) > MAX_UKUPNO) {
            oslobodiPregled(slika);
            prekoracenje = true;
            return;
          }
          tekuce = sledece;
          setSlike(sledece);
        },
      );

      // 🔴 Razlog odbijanja mora da se vidi. Ranije je svaka neuspela slika
      // dobijala poruku „prevelika", pa je čovek uzalud tražio manju fotografiju
      // iako je problem bio format (HEIC sa telefona).
      if (prekoracenje) setError(t("slike_ukupno_prevelike"));
      else if (formatOdbijen) setError(t("slika_format"));
      else if (velicinaOdbijena) setError(t("slika_prevelika"));
    } finally {
      setObrada(false);
    }
  }

  function ukloniSliku(i: number) {
    oslobodiPregled(slike[i]);
    setSlike((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Kod potražnje nema iznosa — budžet se dogovara u porukama (cenaTip = DOGOVOR).
  const cena = jePotraznja ? { ok: true } : parsirajCenu(cenaTip, price, cenaDo);

  // Sadržinski minimum (Uslovi 4.1.1) — uslov za objavu SAMO neverifikovanom.
  // Ista funkcija radi i na serveru; ovde je da čovek ne šalje oglas u prazno.
  const minimum = oglasIspunjavaMinimum({
    tip,
    title,
    description,
    category,
    location: location.trim() || null,
    images: slike.map((s) => s.file.name),
  });
  const canSubmit =
    title.trim().length >= 3 && cena.ok && !!category && (verifikovan || minimum.ok);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Dugme se ne gasi zbog nepotpunog oglasa — klik kaže šta fali (pregled
    // izgleda 22.10.2026: ugašeno dugme bez reči je mesto gde ljudi odustaju).
    if (!canSubmit) {
      if (title.trim().length < 3) setError(t("fali_naslov"));
      else if (!category) setError(t("fali_kategorija"));
      else if (!cena.ok) setError(("error" in cena && cena.error) || t("cena_greska_unos"));
      else if (!minimum.ok) setError(minimum.razlog ?? t("greska_objavljivanje"));
      return;
    }
    if (!jePotraznja) {
      const provera = parsirajCenu(cenaTip, price, cenaDo);
      if (!provera.ok) { setError(provera.error ?? t("cena_greska_unos")); return; }
    }

    setLoading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("tip", tip);
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      // Kod potražnje server ignoriše cenu i forsira DOGOVOR; svejedno šaljemo bezbedne vrednosti.
      fd.append("cenaTip", jePotraznja ? "DOGOVOR" : cenaTip);
      fd.append("price", jePotraznja ? "" : price);
      fd.append("cenaDo", jePotraznja ? "" : cenaDo);
      fd.append("category", category);
      fd.append("location", location.trim());
      fd.append("phone", phone.trim());
      if (gazdinstvo && zaGazdinstvo && !jePotraznja) fd.append("gazdinstvoId", gazdinstvo.id);
      slike.forEach((s, i) => fd.append(`slika_${i}`, s.file));

      const res = await fetch("/api/pijaca", { method: "POST", body: fd });

      if (!res.ok) {
        // Odgovor ne mora biti naš JSON: preveliko telo (413) i prekoračeno vreme
        // obara platforma pre rute. Zato se poruka bira ovde, a status se ispisuje
        // da bi prijava kvara imala za šta da se uhvati.
        const poruka = await porukaIzOdgovora(res);
        setError(
          poruka ??
            (res.status === 413
              ? t("slike_ukupno_prevelike")
              : `${t("greska_objavljivanje")} (${res.status})`)
        );
        return;
      }
      await res.json().catch(() => ({}));
      dogadjaj("oglas_objavljen", { tip: tip.toLowerCase(), kategorija: category });
      // Potvrda + redirect na Pijacu (ne direktno na detalj oglasa).
      setUspeh(true);
      setTimeout(() => router.push("/pijaca"), 1800);
    } catch {
      setError(t("greska_slanje"));
    } finally {
      setLoading(false);
    }
  }

  if (uspeh) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-kolo-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-kolo-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="kolo-naslov">{t("uspeh_naslov")}</h1>
        <p className="text-sm text-kolo-muted">{t("uspeh_opis")}</p>
        <button
          onClick={() => router.push("/pijaca")}
          className={klaseDugmeta({ velicina: "lg" })}
        >
          {t("uspeh_dugme")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* „Nazad" u svom redu iznad naslova, kao na ostalim stranicama. */}
      <div className="space-y-2">
        <button onClick={() => router.back()} className="inline-flex min-h-9 items-center text-sm text-kolo-muted hover:text-kolo-green-700 transition-colors">
          {t("nazad")}
        </button>
        <h1 className="kolo-naslov">{jePotraznja ? t("nova_potraznja_naslov") : t("novi_oglas_naslov")}</h1>
      </div>

      {/* Nepotvrđenom se kaže jedino šta dobija i kada — objava mu je otvorena
          (Pravilnik čl. 16 st. 5), pa nema šta da se pravda. Šta oglasu fali po
          sadržinskom minimumu javlja se uz samo dugme (`minimum.razlog` ispod),
          tamo gde čovek i zapne, a ne unapred. */}
      {!verifikovan && (
        <Obavestenje vrsta="upozorenje" naslov={t("neverif_naslov")}>
          <p>
            {t("neverif_opis", { iznos: IZNOS.toLocaleString("sr-RS") })}
          </p>
          {/* Zvezdica: iznos je bezuslovan tek po odobrenju, pa uslov stoji uz
              obećanje, a ne u istoj rečenici sa njim. */}
          <p className="text-xs text-kolo-muted">{t("neverif_napomena")}</p>
        </Obavestenje>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Nudim / Tražim — od seta 4.8.1 i za novog člana (Uslovi čl. 16 st. 5) */}
        {(
        <div>
          <p className="block text-sm font-semibold text-kolo-muted mb-2">{t("tip_oglasa_label")}</p>
          <Segmenti
            oznaka={t("tip_oglasa_label")}
            vrednost={tip}
            onPromena={setTip}
            opcije={[
              { vrednost: "PONUDA", oznaka: t("tip_nudim") },
              { vrednost: "POTRAZNJA", oznaka: t("tip_trazim") },
            ]}
          />
          <p className="mt-1.5 text-xs text-kolo-muted">{jePotraznja ? t("tip_trazim_hint") : t("tip_nudim_hint")}</p>
        </div>
        )}

        {/* U ime gazdinstva ili lični oglas (Pravilnik o gazdinstvima čl. 10) */}
        {gazdinstvo && !jePotraznja && (
          <div>
            <p className="block text-sm font-semibold text-kolo-muted mb-2">{t("gazdinstvo_izbor_label")}</p>
            <Segmenti
              oznaka={t("gazdinstvo_izbor_label")}
              vrednost={zaGazdinstvo ? "da" : "ne"}
              onPromena={(v) => setZaGazdinstvo(v === "da")}
              opcije={[
                { vrednost: "da", oznaka: t("gazdinstvo_u_ime", { naziv: gazdinstvo.naziv }) },
                { vrednost: "ne", oznaka: t("gazdinstvo_licni") },
              ]}
            />
            <p className="mt-1.5 text-xs text-kolo-muted">{zaGazdinstvo ? t("gazdinstvo_u_ime_hint") : t("gazdinstvo_licni_hint")}</p>
          </div>
        )}

        {/* Naslov */}
        <div>
          <label htmlFor="polje-novioglas-1" className="block text-sm font-semibold text-kolo-muted mb-2">{t("naslov_required")}</label>
          <input id="polje-novioglas-1"
            type="text"
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={jePotraznja ? t("naslov_placeholder_potraznja") : t("naslov_placeholder")}
            className={KLASE_UNOSA}
          />
        </div>

        {/* Opis */}
        <div>
          <label htmlFor="polje-novioglas-2" className="block text-sm font-semibold text-kolo-muted mb-2">{t("opis_label")}</label>
          <textarea id="polje-novioglas-2"
            rows={3}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={jePotraznja ? t("opis_placeholder_potraznja") : t("opis_placeholder")}
            className={KLASE_UNOSA + " resize-none"}
          />
        </div>

        {/* Cena — samo kod ponude; kod potražnje se budžet dogovara u porukama */}
        {!jePotraznja && (
          <CenaUnos
            cenaTip={cenaTip}
            setCenaTip={setCenaTip}
            price={price}
            setPrice={setPrice}
            cenaDo={cenaDo}
            setCenaDo={setCenaDo}
            t={t}
          />
        )}

        {/* Kategorija — padajući meni, obavezno polje. Trinaest čipova je u
            obrascu pravilo prelom u tri-četiri reda i guralo ostala polja
            nadole; ovde se bira tačno jedna, pa je meni tačniji oblik. Native
            <select> namerno: na telefonu otvara sistemski birač i ne traži
            sopstveno hvatanje klika izvan panela. Čipovi ostaju na Pijaci i u
            profilu, gde je izbor višestruk. */}
        <div>
          {maloletan && (
            <Obavestenje vrsta="greska" className="mb-3">
              {t("dete_zabranjeno")}
            </Obavestenje>
          )}
          <label htmlFor="kategorija" className="block text-sm font-semibold text-kolo-muted mb-2">
            {t("kategorija_label")}
          </label>
          <select
            id="kategorija"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${KLASE_UNOSA.replace(" text-kolo-text", "")} ${
              category ? "text-kolo-text" : "text-kolo-muted"
            }`}
          >
            <option value="">{t("kategorija_izaberi")}</option>
            {KATEGORIJE.map((slug) => (
              <option key={slug} value={slug} className="text-kolo-text">
                {kategorijaEmoji(slug)} {t(`kategorija_${kategorijaKljuc(slug)}`)}
              </option>
            ))}
          </select>
        </div>

        {/* Lokacija */}
        <div>
          <label htmlFor="polje-novioglas-3" className="block text-sm font-semibold text-kolo-muted mb-2">
            {t("lokacija_label")} <span className="text-kolo-muted font-normal">{t("lokacija_opciono")}</span>
          </label>
          <LokacijaSearch id="polje-novioglas-3" value={location} onChange={setLocation} placeholder={t("lokacija_placeholder")} />
        </div>

        {/* Kontakt telefon */}
        <div>
          <label htmlFor="polje-novioglas-4" className="block text-sm font-semibold text-kolo-muted mb-2">
            {t("kontakt_telefon")} <span className="text-kolo-muted font-normal">{t("lokacija_opciono")}</span>
          </label>
          <input id="polje-novioglas-4"
            type="tel"
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("kontakt_placeholder")}
            className={KLASE_UNOSA}
          />
        </div>

        {/* Slike */}
        <div>
          <p className="block text-sm font-semibold text-kolo-muted mb-2">
            {jePotraznja ? t("slike_label_potraznja") : t("slike_label")} <span className="text-kolo-muted font-normal">{t("slike_do", { max: MAX_IMAGES })}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {slike.map((s, i) => (
              <div key={s.pregled} className="relative w-20 h-20 rounded-xl border border-kolo-border overflow-hidden bg-kolo-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.pregled}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => ukloniSliku(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            {/* 🔴 Dodavanje slike ide preko <label>, ne preko dugmeta koje programski
                klikne skriveni <input>. Na iOS Safariju se birač tako otvori, čovek
                izabere fotografiju — i `change` nikad ne stigne do stranice: nema
                sličica, nema poruke, ostane na obrascu. Isto sa jednom kao sa pet
                slika, pa se ne vidi kao problem sa slikom nego kao „ne radi".
                Uz `<label htmlFor>` birač otvara sam pretraživač, bez ijedne linije
                JavaScripta u tom putu. NE VRAĆATI `onClick={() => fileRef.click()}`. */}
            {slike.length < MAX_IMAGES && (
              <label
                htmlFor={ID_UNOSA}
                aria-disabled={obrada}
                className={`w-20 h-20 rounded-xl border-2 border-dashed border-kolo-border flex flex-col items-center justify-center text-kolo-muted hover:border-kolo-muted transition-colors text-xl cursor-pointer ${obrada ? "opacity-50 pointer-events-none" : ""}`}
              >
                {obrada ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                ) : (
                  "+"
                )}
              </label>
            )}
          </div>
          {/* 🔴 `sr-only`, a NE `hidden`: polje sa `display: none` iOS ume da odseče
              od stranice pa izbor fotografije nigde ne stigne. Ovako je nevidljivo,
              a i dalje je živo polje obrasca. */}
          <input
            id={ID_UNOSA}
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleFiles}
          />
          {slike.length >= MAX_IMAGES && (
            <p className="mt-1.5 text-xs text-kolo-muted">{t("slike_popunjeno", { max: MAX_IMAGES })}</p>
          )}
        </div>

        {error && (
          <Obavestenje vrsta="greska">{error}</Obavestenje>
        )}

        {/* Kad je dugme ugašeno zbog sadržinskog minimuma, mora se videti ŠTA fali —
            inače neverifikovani gleda mrtvo dugme bez objašnjenja. */}
        {!verifikovan && !minimum.ok && title.trim().length >= 3 && (
          <p className="text-sm text-kolo-muted">{minimum.razlog}</p>
        )}

        <button
          type="submit"
          disabled={loading || obrada}
          className={klaseDugmeta({ velicina: "lg", punaSirina: true })}
        >
          {loading ? t("objavljivanje") : jePotraznja ? t("objavi_potraznja") : t("objavi_oglas")}
        </button>
      </form>
    </div>
  );
}
