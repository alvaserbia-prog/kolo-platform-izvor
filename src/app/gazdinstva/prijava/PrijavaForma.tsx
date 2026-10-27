"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LokacijaSearch from "@/components/LokacijaSearch";
import { koordinateZaMesto } from "@/lib/udaljenost";
import { nadjiAdresu } from "@/lib/geokodiranje";
import { MAX_NAZIV, MAX_OPIS, lokacijaUSrbiji } from "@/lib/gazdinstvo-pravila";
import { MAX_IME_PREZIME, procitajImePrezime } from "@/lib/identitet-pravila";
import { ispravanTelefon } from "@/lib/nov-clan-pravila";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

const MapaGazdinstava = dynamic(() => import("@/components/MapaGazdinstava"), { ssr: false });

type Pocetno = {
  naziv: string;
  opis: string;
  bpg: string;
  neregistrovano: boolean;
  naselje: string;
  adresa: string;
  lat: number | null;
  lng: number | null;
  uloga: "NOSILAC" | "CLAN";
  /** Izjava o prikazu adrese uz tačku na mapi već data (čl. 5 st. 1 t. 3). */
  imaIzjavuAdrese: boolean;
};

/**
 * Forma prijave gazdinstva (Pravilnik o gazdinstvima čl. 5). Tačna lokacija se
 * pronalazi po adresi ili bira klikom na mapu. Adresa je obavezna (čl. 5 st. 1 t. 3) i
 * ispisuje se uz tačku na mapi — uz OBAVEZNU izjavu podnosioca da je saglasan da se
 * adresa prikazuje (dopuna 20.10.2026). 🔴 Izjava se ne povlači; prikaz prestaje
 * samo prestankom gazdinstva (čl. 19 st. 4, Politika čl. 25).
 *
 * Ime i prezime podnosioca (čl. 5 st. 1 t. 8) traži se samo dok nalog nema upisano ime;
 * ide u evidenciju identiteta, ne na gazdinstvo, i ne prikazuje se drugima.
 *
 * Broj telefona (čl. 5 st. 1 t. 9) je broj NOSIOCA, odnosno podnosioca kad nosilac nema
 * nalog — samo za razgovor iz čl. 8; vidi ga samo Fondacija i briše se odlukom.
 *
 * `samoNosilac` (čl. 4 st. 1 t. 2–3; set 4.8.3): korisnik i član bez potvrde prijavljuju
 * gazdinstvo, upisano ili neupisano u Registar, samo kao nosilac; izvod se ne
 * prilaže (čl. 3 st. 3).
 */
export default function PrijavaForma({
  izmenaId,
  pocetno,
  upisanoIme,
  samoNosilac = false,
  trebaTelefon = false,
}: {
  izmenaId?: string;
  pocetno?: Pocetno;
  upisanoIme: string | null;
  samoNosilac?: boolean;
  /** Broj za razgovor još nije ostavljen (nova prijava ili zatečena bez broja). */
  trebaTelefon?: boolean;
}) {
  const t = useTranslations("gazdinstva");
  const router = useRouter();
  const [imePrezime, setImePrezime] = useState("");
  // Broj nosioca za razgovor sa Fondacijom pre odobrenja (čl. 5 st. 1 t. 9, 8).
  const [telefon, setTelefon] = useState("");
  const [naziv, setNaziv] = useState(pocetno?.naziv ?? "");
  const [opis, setOpis] = useState(pocetno?.opis ?? "");
  const [bpg, setBpg] = useState(pocetno?.bpg ?? "");
  const [neregistrovano, setNeregistrovano] = useState(pocetno?.neregistrovano ?? false);
  const [naselje, setNaselje] = useState(pocetno?.naselje ?? "");
  const [tacka, setTacka] = useState<{ lat: number; lng: number } | null>(
    pocetno?.lat != null && pocetno?.lng != null ? { lat: pocetno.lat, lng: pocetno.lng } : null,
  );
  const [uloga, setUloga] = useState<"NOSILAC" | "CLAN">(samoNosilac ? "NOSILAC" : (pocetno?.uloga ?? "NOSILAC"));
  const [izjava, setIzjava] = useState(!!izmenaId);
  const trebaIzjavaAdrese = !pocetno?.imaIzjavuAdrese;
  const [izjavaAdresa, setIzjavaAdresa] = useState(false);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [adresa, setAdresa] = useState(pocetno?.adresa ?? "");
  const [trazi, setTrazi] = useState(false);
  const [porukaAdrese, setPorukaAdrese] = useState<string | null>(null);
  const [pronadjeno, setPronadjeno] = useState<[number, number] | null>(null);

  const centarNaselja = useMemo(() => {
    if (tacka) return null;
    const k = koordinateZaMesto(naselje);
    return k ? ([k[0], k[1]] as [number, number]) : null;
  }, [naselje, tacka]);
  const centar = pronadjeno ?? centarNaselja;

  async function pronadjiNaMapi() {
    if (!adresa.trim() || trazi) return;
    setTrazi(true);
    setPorukaAdrese(null);
    try {
      const t0 = await nadjiAdresu(adresa, naselje);
      if (!t0) {
        setPorukaAdrese(t("adresa_nije_nadjena"));
        return;
      }
      setTacka(t0);
      setPronadjeno([t0.lat, t0.lng]);
      setPorukaAdrese(t("adresa_nadjena"));
    } catch {
      setPorukaAdrese(t("adresa_nije_nadjena"));
    } finally {
      setTrazi(false);
    }
  }

  const spremno =
    (upisanoIme !== null || procitajImePrezime(imePrezime).ok) &&
    (!trebaTelefon || ispravanTelefon(telefon)) &&
    naziv.trim().length >= 2 &&
    opis.trim().length > 0 &&
    (neregistrovano || bpg.trim().length > 0) &&
    naselje.trim().length > 0 &&
    adresa.trim().length >= 3 &&
    tacka !== null &&
    lokacijaUSrbiji(tacka.lat, tacka.lng) &&
    izjava &&
    (!trebaIzjavaAdrese || izjavaAdresa);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    if (!spremno || !tacka) return;
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(izmenaId ? `/api/gazdinstva/${izmenaId}` : "/api/gazdinstva", {
        method: izmenaId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naziv,
          opis,
          bpg: neregistrovano ? "" : bpg,
          neregistrovano,
          naselje,
          adresa,
          lat: tacka.lat,
          lng: tacka.lng,
          uloga,
          ...(trebaIzjavaAdrese ? { izjavaAdresa } : {}),
          ...(upisanoIme === null ? { imePrezime } : {}),
          ...(trebaTelefon ? { telefon } : {}),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.error ?? t("greska"));
        return;
      }
      router.push(`/gazdinstva/${izmenaId ?? d.id}`);
      router.refresh();
    } finally {
      setRadi(false);
    }
  }

  const polje = KLASE_UNOSA;
  const oznaka = "mb-1.5 block text-sm font-medium text-kolo-text";

  return (
    <form onSubmit={posalji} noValidate className="space-y-5 bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica p-5">
      <div>
        <label htmlFor="polje2-prijava-1" className={oznaka}>{t("polje_ime_prezime")}</label>
        {upisanoIme === null ? (
          <input id="polje2-prijava-1"
            className={polje}
            maxLength={MAX_IME_PREZIME}
            autoComplete="name"
            value={imePrezime}
            onChange={(e) => setImePrezime(e.target.value)}
          />
        ) : (
          <p className="text-sm text-kolo-text">{upisanoIme}</p>
        )}
        <p className="mt-1 text-xs text-kolo-muted">{t("polje_ime_prezime_napomena")}</p>
      </div>

      {trebaTelefon && (
        <div>
          <label htmlFor="gaz-telefon" className={oznaka}>{t("polje_telefon")}</label>
          <input
            id="gaz-telefon"
            className={polje}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
          />
          <p className="mt-1 text-xs text-kolo-muted">{t("polje_telefon_napomena")}</p>
        </div>
      )}

      <div>
        <label htmlFor="polje-prijava-1" className={oznaka}>{t("polje_naziv")}</label>
        <input id="polje-prijava-1" className={polje} maxLength={MAX_NAZIV} value={naziv} onChange={(e) => setNaziv(e.target.value)} placeholder={t("polje_naziv_primer")} />
      </div>

      <div>
        <label htmlFor="polje-prijava-2" className={oznaka}>{t("polje_bpg")}</label>
        <input id="polje-prijava-2"
          className={polje}
          inputMode="numeric"
          value={bpg}
          disabled={neregistrovano}
          onChange={(e) => setBpg(e.target.value)}
        />
        <label className="mt-2 flex min-h-9 items-center gap-2 text-sm">
          <input type="checkbox" checked={neregistrovano} onChange={(e) => setNeregistrovano(e.target.checked)} />
          {t("polje_neregistrovano")}
        </label>
        <p className="mt-1 text-xs text-kolo-muted">{t("polje_bpg_napomena")}</p>
      </div>

      <div>
        <p className={oznaka}>{t("polje_uloga")}</p>
        <div className="flex flex-wrap gap-4 text-sm" role="radiogroup" aria-label={t("polje_uloga")}>
          <label className="flex min-h-9 items-center gap-2">
            <input type="radio" checked={uloga === "NOSILAC"} onChange={() => setUloga("NOSILAC")} />
            {t("uloga_nosilac_opis")}
          </label>
          {!samoNosilac && (
            <label className="flex min-h-9 items-center gap-2">
              <input type="radio" checked={uloga === "CLAN"} onChange={() => setUloga("CLAN")} />
              {t("uloga_clan_opis")}
            </label>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="polje-prijava-3" className={oznaka}>{t("polje_opis")}</label>
        <textarea id="polje-prijava-3"
          className={`${polje} min-h-[120px]`}
          maxLength={MAX_OPIS}
          value={opis}
          onChange={(e) => setOpis(e.target.value)}
          placeholder={t("polje_opis_primer")}
        />
      </div>

      <div>
        <label htmlFor="polje-prijava-4" className={oznaka}>{t("polje_naselje")}</label>
        <LokacijaSearch id="polje-prijava-4" value={naselje} onChange={setNaselje} />
      </div>

      <div>
        <label htmlFor="polje2-prijava-2" className={oznaka}>{t("polje_adresa")}</label>
        <div className="mb-2 flex gap-2">
          <input id="polje2-prijava-2"
            className={polje}
            value={adresa}
            onChange={(e) => setAdresa(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void pronadjiNaMapi();
              }
            }}
            placeholder={t("polje_adresa_primer")}
            autoComplete="off"
          />
          <Dugme
            varijanta="sekundarno"
            className="shrink-0 min-h-11"
            onClick={() => void pronadjiNaMapi()}
            disabled={trazi || !adresa.trim()}
          >
            {trazi ? t("adresa_trazim") : t("adresa_pronadji")}
          </Dugme>
        </div>
        <p className="mb-4 text-xs text-kolo-muted">{porukaAdrese ?? t("polje_adresa_napomena")}</p>
        <p className={oznaka}>{t("polje_lokacija")}</p>
        <p className="mb-2 text-xs text-kolo-muted">{t("polje_lokacija_napomena")}</p>
        <MapaGazdinstava
          izbor={tacka}
          onIzbor={setTacka}
          centar={centar}
          zumCentra={pronadjeno ? 17 : 14}
          visina={340}
        />
      </div>

      {trebaIzjavaAdrese && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={izjavaAdresa} onChange={(e) => setIzjavaAdresa(e.target.checked)} />
          <span>{t("izjava_adresa")}</span>
        </label>
      )}

      {!izmenaId && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={izjava} onChange={(e) => setIzjava(e.target.checked)} />
          <span>{t("izjava")}</span>
        </label>
      )}

      {/* Obaveštenje pri prikupljanju podataka: akt koji uređuje prijavu i
          Politika privatnosti (ime, adresa, tačka na mapi — odeljci 4.13 i 4.14). */}
      <p className="text-xs text-kolo-muted">
        {t("pravilnik_napomena")}{" "}
        <Link href="/pravilnik/gazdinstva" className="underline">{t("pravilnik_link")}</Link>{" "}
        {t("privatnost_napomena")}{" "}
        <Link href="/privatnost" className="underline">{t("privatnost_link")}</Link>
      </p>

      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}

      <Dugme type="submit" velicina="lg" punaSirina disabled={radi || !spremno}>
        {izmenaId ? t("sacuvaj") : t("prijava_posalji")}
      </Dugme>
      {!izmenaId && <p className="text-xs text-kolo-muted">{t("prijava_sledeci_korak")}</p>}
    </form>
  );
}
