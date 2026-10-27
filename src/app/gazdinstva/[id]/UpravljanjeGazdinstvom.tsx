"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MAX_IME_PREZIME, procitajImePrezime } from "@/lib/identitet-pravila";
import { MAX_OPIS } from "@/lib/gazdinstvo-pravila";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";

/**
 * Radnje člana gazdinstva (Pravilnik o gazdinstvima čl. 4–25, set 4.8.2):
 * prihvatanje poziva uz izjavu, oglasi uz prijavu, izvod iz Registra, slanje na
 * pregled, pozivanje članova, preuzimanje izjave, upit o preuzimanju izjave,
 * istupanje i brisanje.
 *
 * Prava se izvode na serveru (`pravaUGazdinstvu`) i ovde samo prikazuju:
 *  - `upravlja` — oglasi u ime gazdinstva i profil (čl. 11, 14);
 *  - `poziva` — član Kola, kad gazdinstvo prima članove (čl. 4, 9);
 *  - `odgovaram` — lice koje odgovara za izjavu: podaci iz čl. 5 st. 1 t. 1–3, izvod,
 *    slanje na pregled, izjava o adresi i brisanje (čl. 12, 21).
 *
 * Ime i prezime (čl. 9 st. 3, set 4.7.3) upisuje svaki član za sopstveni nalog.
 * Broj telefona se od člana ne traži — Fondacija razgovara samo sa nosiocem (čl. 8).
 */
export default function UpravljanjeGazdinstvom({
  gazdinstvoId,
  status,
  mojStatus,
  mojaUloga,
  odgovaram,
  upravlja,
  poziva,
  smeClanove,
  uKolu,
  trebaIzvod,
  imaIzvod,
  upit,
  posledica,
  opis,
  imaNosioca,
  registrovano,
  brojOglasa,
  minOglasa,
  clanId,
  pozvani,
  naCekanju,
  imaIme,
  imaIzjavuAdrese,
}: {
  gazdinstvoId: string;
  status: string;
  mojStatus: string;
  mojaUloga: "NOSILAC" | "CLAN";
  /** Odgovara za izjavu o tačnosti (čl. 12). */
  odgovaram: boolean;
  upravlja: boolean;
  poziva: boolean;
  smeClanove: boolean;
  /** Član Kola ili osnivač — uslov pristupanja (čl. 10). */
  uKolu: boolean;
  trebaIzvod: boolean;
  imaIzvod: boolean;
  upit: { id: string; rokDo: string } | null;
  posledica: { poslednji: boolean; otpis: number; ponistava: number } | null;
  opis: string;
  imaNosioca: boolean;
  registrovano: boolean;
  brojOglasa: number;
  minOglasa: number;
  clanId: string;
  pozvani: string[];
  naCekanju: string[];
  imaIme: boolean;
  /** Izjava o prikazu adrese (čl. 5 st. 1 t. 3) — gazdinstva odobrena ranije je nemaju. */
  imaIzjavuAdrese: boolean;
}) {
  const t = useTranslations("gazdinstva");
  const router = useRouter();
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [pseudonim, setPseudonim] = useState("");
  const [izjava, setIzjava] = useState(false);
  const [uloga, setUloga] = useState<"CLAN" | "NOSILAC">("CLAN");
  const [imePrezime, setImePrezime] = useState("");
  const [izjavaAdrese, setIzjavaAdrese] = useState(false);
  const [noviOpis, setNoviOpis] = useState(opis);
  const { dijalog, potvrdi } = useDijalog();
  const imeOk = imaIme || procitajImePrezime(imePrezime).ok;

  async function posalji(putanja: string, telo?: unknown, uspeh?: string) {
    setRadi(true);
    setGreska(null);
    setPoruka(null);
    try {
      const res = await fetch(putanja, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: telo ? JSON.stringify(telo) : undefined,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.error ?? t("greska"));
        return false;
      }
      if (uspeh) setPoruka(uspeh);
      router.refresh();
      return true;
    } finally {
      setRadi(false);
    }
  }

  async function sacuvajOpis() {
    setRadi(true);
    setGreska(null);
    setPoruka(null);
    try {
      const res = await fetch(`/api/gazdinstva/${gazdinstvoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samoOpis: true, opis: noviOpis }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.error ?? t("greska"));
        return;
      }
      setPoruka(t("opis_sacuvan"));
      router.refresh();
    } finally {
      setRadi(false);
    }
  }

  async function obrisi() {
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(`/api/gazdinstva/${gazdinstvoId}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.error ?? t("greska"));
        return;
      }
      router.push("/gazdinstva");
      router.refresh();
    } finally {
      setRadi(false);
    }
  }

  const iznos = (n: number) => n.toLocaleString("sr-RS");
  const upozorenjeIzlaska = posledica?.poslednji
    ? ` ${t("izlazak_poslednji", { otpis: iznos(posledica.otpis), ponisten: iznos(posledica.ponistava) })}`
    : "";

  const kartica = "bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-5 space-y-3";
  const dugme = klaseDugmeta();
  const dugmeSek = klaseDugmeta({ varijanta: "sekundarno" });
  const dugmeOpasno = klaseDugmeta({ varijanta: "opasno" });
  const polje = KLASE_UNOSA;
  const napomena = "rounded-kontrola border-l-4 border-kolo-gold-600 bg-kolo-gold-100 px-4 py-3 text-sm text-kolo-text";

  const poljeImena = (
    <Polje oznaka={t("polje_ime_prezime")} pomoc={t("polje_ime_prezime_napomena")}>
      <input
        className={polje}
        maxLength={MAX_IME_PREZIME}
        autoComplete="name"
        value={imePrezime}
        onChange={(e) => setImePrezime(e.target.value)}
      />
    </Polje>
  );

  // ── Poziv ────────────────────────────────────────────────────────────────
  if (mojStatus === "POZVAN") {
    return (
      <section className={kartica}>
        {dijalog}
        <h2 className="font-semibold text-kolo-green-900">{t("poziv_naslov")}</h2>
        <p className="text-sm text-kolo-text">{t("poziv_tekst")}</p>
        {/* Uslov pristupanja (čl. 10): pozvani je član Kola u trenutku odobrenja. */}
        {!uKolu && <Obavestenje vrsta="upozorenje">{t("poziv_uslov_kolo")}</Obavestenje>}
        {!imaNosioca && (
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex min-h-9 items-center gap-2">
              <input type="radio" checked={uloga === "CLAN"} onChange={() => setUloga("CLAN")} />
              {t("uloga_clan_opis")}
            </label>
            <label className="flex min-h-9 items-center gap-2">
              <input type="radio" checked={uloga === "NOSILAC"} onChange={() => setUloga("NOSILAC")} />
              {t("uloga_nosilac_opis")}
            </label>
          </div>
        )}
        {!imaIme && poljeImena}
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={izjava} onChange={(e) => setIzjava(e.target.checked)} />
          <span>{t("izjava")}</span>
        </label>
        {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={dugme}
            disabled={radi || !izjava || !imeOk}
            onClick={() =>
              posalji(`/api/gazdinstva/pozivi/${clanId}`, { prihvata: true, uloga, ...(imaIme ? {} : { imePrezime }) })
            }
          >
            {t("poziv_prihvati")}
          </button>
          <button
            type="button"
            className={dugmeSek}
            disabled={radi}
            onClick={() => posalji(`/api/gazdinstva/pozivi/${clanId}`, { prihvata: false })}
          >
            {t("poziv_odbij")}
          </button>
        </div>
      </section>
    );
  }

  const uPripremi = status === "NACRT" || status === "VRACENO";
  const zivo = uPripremi || status === "NA_PREGLEDU" || status === "ODOBRENO";

  return (
    <section className={kartica}>
      {dijalog}
      <h2 className="font-semibold text-kolo-green-900">{t("upravljanje_naslov")}</h2>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      {poruka && <Obavestenje vrsta="uspeh">{poruka}</Obavestenje>}

      {/* Upit o preuzimanju izjave (čl. 13, 21 st. 3). */}
      {upit && zivo && (
        <div className={`${napomena} space-y-2`}>
          <p className="font-semibold">{t("upit_naslov")}</p>
          <p>{t("upit_tekst", { rok: new Date(upit.rokDo).toLocaleDateString("sr-RS") })}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={dugme}
              disabled={radi}
              onClick={() => posalji(`/api/gazdinstva/upiti/${upit.id}`, { preuzima: true }, t("upit_preuzeto"))}
            >
              {t("upit_preuzmi")}
            </button>
            <button
              type="button"
              className={dugmeSek}
              disabled={radi}
              onClick={async () => {
                if (await potvrdi({ poruka: t("upit_odbij_potvrda"), dugme: t("upit_odbij") })) void posalji(`/api/gazdinstva/upiti/${upit.id}`, { preuzima: false });
              }}
            >
              {t("upit_odbij")}
            </button>
          </div>
        </div>
      )}

      {!imaIme && zivo && (
        <div className={`${napomena} space-y-2`}>
          <p>{t("ime_nedostaje")}</p>
          {poljeImena}
          <button
            type="button"
            className={dugme}
            disabled={radi || !imeOk}
            onClick={() => posalji(`/api/gazdinstva/${gazdinstvoId}/identitet`, { imePrezime }, t("ime_upisano"))}
          >
            {t("ime_sacuvaj")}
          </button>
        </div>
      )}

      {/* Izjava o prikazu adrese (čl. 19 st. 1) za gazdinstvo odobreno ranije — daje je
          lice koje odgovara za izjavu, jednom. 🔴 Nema „povuci": izlaz je brisanje gazdinstva. */}
      {odgovaram && zivo && !imaIzjavuAdrese && (
        <div className={`${napomena} space-y-2`}>
          <p>{t("adresa_izjava_nedostaje")}</p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={izjavaAdrese} onChange={(e) => setIzjavaAdrese(e.target.checked)} />
            <span>{t("izjava_adresa")}</span>
          </label>
          <button
            type="button"
            className={dugme}
            disabled={radi || !izjavaAdrese}
            onClick={() => posalji(`/api/gazdinstva/${gazdinstvoId}/adresa`, undefined, t("adresa_izjava_data"))}
          >
            {t("adresa_izjava_sacuvaj")}
          </button>
        </div>
      )}

      {mojStatus === "PRISTUPIO" && status === "ODOBRENO" && (
        <p className="text-sm text-kolo-muted">
          {t("pristupanje_na_pregledu")} {!uKolu && t("poziv_uslov_kolo")}
        </p>
      )}
      {status === "NA_PREGLEDU" && <p className="text-sm text-kolo-muted">{t("prijava_na_pregledu")}</p>}

      {/* Izvod iz Registra se od seta 4.8.3 ne prilaže (gazdinstva čl. 3 st. 3, `trebaIzvod()`
          vraća false); ekran za otpremanje je uklonjen, a uslov za slanje na pregled
          i dalje čita `trebaIzvod`, pa vraćanje izvoda ne bi prošlo tiho. */}
      {uPripremi && (upravlja || odgovaram) && (
        <div className="space-y-2">
          <p className="text-sm text-kolo-text">{t("oglasi_uz_prijavu", { n: brojOglasa, min: minOglasa })}</p>
          <div className="flex flex-wrap gap-2">
            {upravlja && (
              <Link href={`/pijaca/novi-oglas?gazdinstvo=${gazdinstvoId}`} className={dugmeSek}>
                {t("postavi_oglas")}
              </Link>
            )}
            {odgovaram && (
              <>
                <Link href={`/gazdinstva/prijava?izmena=${gazdinstvoId}`} className={dugmeSek}>
                  {t("izmeni_podatke")}
                </Link>
                <button
                  type="button"
                  className={dugme}
                  disabled={radi || brojOglasa < minOglasa || (trebaIzvod && !imaIzvod)}
                  onClick={() => posalji(`/api/gazdinstva/${gazdinstvoId}/pregled`, undefined, t("poslato_na_pregled"))}
                >
                  {t("posalji_na_pregled")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {status === "ODOBRENO" && upravlja && (
        <Link href={`/pijaca/novi-oglas?gazdinstvo=${gazdinstvoId}`} className={dugmeSek}>
          {t("postavi_oglas")}
        </Link>
      )}

      {/* Profil gazdinstva (čl. 11) uređuje svaki član koji upravlja. */}
      {zivo && upravlja && !(uPripremi && odgovaram) && (
        <div className="space-y-2 pt-2 border-t border-kolo-border">
          <p className="text-sm font-semibold">{t("opis_naslov")}</p>
          <textarea
            aria-label={t("opis_naslov")}
            className={`${polje} min-h-[100px]`}
            maxLength={MAX_OPIS}
            value={noviOpis}
            onChange={(e) => setNoviOpis(e.target.value)}
          />
          <button type="button" className={dugmeSek} disabled={radi || noviOpis.trim() === opis.trim()} onClick={() => void sacuvajOpis()}>
            {t("opis_sacuvaj")}
          </button>
        </div>
      )}

      {zivo && !upravlja && <p className="text-xs text-kolo-muted">{t("bez_prava_upravljanja")}</p>}

      {zivo && (
        <div className="space-y-2 pt-2 border-t border-kolo-border">
          <p className="text-sm font-semibold">{t("pozovi_naslov")}</p>
          {!smeClanove ? (
            <p className="text-xs text-kolo-muted">{t("pozovi_bez_clanova")}</p>
          ) : !poziva ? (
            <p className="text-xs text-kolo-muted">{t("pozovi_samo_kolo")}</p>
          ) : (
            <>
              <p className="text-xs text-kolo-muted">{t("pozovi_opis")}</p>
              <div className="flex gap-2">
                <input
                  className={polje}
                  aria-label={t("pseudonim_placeholder")}
                  placeholder={t("pseudonim_placeholder")}
                  value={pseudonim}
                  onChange={(e) => setPseudonim(e.target.value)}
                />
                <button
                  type="button"
                  className={`${dugme} shrink-0 min-h-11`}
                  disabled={radi || !pseudonim.trim()}
                  onClick={async () => {
                    if (await posalji(`/api/gazdinstva/${gazdinstvoId}/clanovi`, { pseudonim }, t("poziv_poslat"))) setPseudonim("");
                  }}
                >
                  {t("pozovi")}
                </button>
              </div>
            </>
          )}
          {pozvani.length > 0 && <p className="text-xs text-kolo-muted">{t("pozvani", { spisak: pozvani.join(", ") })}</p>}
          {naCekanju.length > 0 && <p className="text-xs text-kolo-muted">{t("na_cekanju", { spisak: naCekanju.join(", ") })}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-kolo-border">
        {/* Nosilac upisanog gazdinstva preuzima izjavu o tačnosti (čl. 12). */}
        {mojaUloga === "NOSILAC" && registrovano && !odgovaram && zivo && !(status === "ODOBRENO" && mojStatus === "PRISTUPIO") && (
          <button
            type="button"
            className={dugmeSek}
            disabled={radi}
            onClick={() => posalji(`/api/gazdinstva/${gazdinstvoId}/upravljanje`, undefined, t("upravljanje_preuzeto"))}
          >
            {t("preuzmi_upravljanje")}
          </button>
        )}
        <button
          type="button"
          className={dugmeOpasno}
          disabled={radi}
          onClick={async () => {
            if (await potvrdi({ poruka: `${t("istupi_potvrda")}${odgovaram && !posledica?.poslednji ? ` ${t("istupi_upit")}` : ""}${upozorenjeIzlaska}`, opasno: true, dugme: t("istupi") }))
              void posalji(`/api/gazdinstva/${gazdinstvoId}/istupi`);
          }}
        >
          {t("istupi")}
        </button>
        {/* Brisanje gazdinstva sa platforme (čl. 21) — lice koje odgovara za izjavu. */}
        {odgovaram && zivo && (
          <button
            type="button"
            className={dugmeOpasno}
            disabled={radi}
            onClick={async () => {
              const tekst = posledica?.poslednji ? `${t("obrisi_potvrda")}${upozorenjeIzlaska}` : t("obrisi_ima_clanove");
              if (await potvrdi({ poruka: tekst, opasno: true, dugme: t("obrisi") })) void obrisi();
            }}
          >
            {t("obrisi")}
          </button>
        )}
      </div>
    </section>
  );
}
