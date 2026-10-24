"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import UspehKartica from "@/components/UspehKartica";
import { dogadjaj } from "@/lib/analitika";
import { dnevniTempo, PRAG_ZAUSTAVLJANJA } from "@/lib/potvrde-dnevno-pravila";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

// Dinamički import — html5-qrcode koristi DOM i ne sme da se izvršava na serveru
const QrSkener = dynamic(() => import("./QrSkener"), { ssr: false });

type Mod = "izbor" | "skener" | "broj";
type Nacin = "LICNO" | "TELEFONOM";
type Rezim = "POTVRDA" | "UVODJENJE";

/**
 * Forma za izvršavanje verifikacije (dokaz stvarnosti čl. 5, 5a; set 4.8.2).
 * Korisnik bira između skeniranja kamerom ili ručnog unosa 6-cifrenog broja.
 *
 * Dva režima (vrstu na kraju ipak određuje server po statusu obe strane):
 *  - `POTVRDA` — član Kola, čuvar ili osnivač: „Potvrdi". Uz to bira „Znam ga
 *    lično" ili „Upoznali smo se telefonom" (osoba sa spiska za poziv → uvođenje).
 *    Istim kodom potvrđuje i člana bez potvrde koga lično zna.
 *  - `UVODJENJE` — član bez potvrde: „Uvedi u Kolo" poznanika (čl. 5a st. 2).
 *
 * 🔴 Upozorenje iz dokaza stvarnosti čl. 8 („PRE treće i pre četvrte potvrde u
 * danu") stoji IZNAD forme, pre unosa koda — ne tek u odgovoru posle upisa.
 * `potvrdaDanas` dolazi sa servera; posle svake potvrde `router.refresh()` ga osveži.
 */
export default function VerifikujNekoga({
  mozeDaVerifikuje,
  potvrdaDanas,
  rezim = "POTVRDA",
}: {
  mozeDaVerifikuje: boolean;
  potvrdaDanas: number;
  /** `UVODJENJE` za člana bez potvrde (čl. 5a st. 2); podrazumevano `POTVRDA`. */
  rezim?: Rezim;
}) {
  const t = useTranslations("verifikacija");
  const router = useRouter();
  const [mod, setMod] = useState<Mod>("izbor");
  const [tokenIliBroj, setTokenIliBroj] = useState("");
  const [oznaka, setOznaka] = useState("");
  const [potvrdjeno, setPotvrdjeno] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState<string | null>(null);
  const [uspehUpozorenje, setUspehUpozorenje] = useState<number | null>(null);
  const [uspehVrsta, setUspehVrsta] = useState<string | null>(null);
  const [nacin, setNacin] = useState<Nacin>("LICNO");
  const tempo = dnevniTempo(potvrdaDanas);
  const uvodjenje = rezim === "UVODJENJE";
  const naslov = uvodjenje ? t("vn_naslov_uvodjenje") : t("vn_naslov");

  if (!mozeDaVerifikuje) {
    return (
      <div className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
        <div className="text-sm uppercase tracking-wide text-kolo-muted font-semibold mb-2">
          {naslov}
        </div>
        <p className="text-sm text-kolo-muted">{t("vn_nema_prava")}</p>
      </div>
    );
  }

  if (!tempo.sme && !uspeh) {
    return (
      <div className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
        <div className="text-sm uppercase tracking-wide text-kolo-muted font-semibold mb-3">
          {naslov}
        </div>
        <Obavestenje vrsta="upozorenje">
          {t("vn_zaustavljeno", { danas: potvrdaDanas })}
        </Obavestenje>
      </div>
    );
  }

  async function posaji(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUspeh(null);
    if (!potvrdjeno) {
      setError(t("vn_potvrdi_obavezno"));
      return;
    }
    const ocisceno = tokenIliBroj.replace(/\s+/g, "");
    setLoading(true);
    try {
      const res = await fetch("/api/verifikacija", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: ocisceno,
          potvrdaPoznavanja: true,
          oznaka: oznaka.trim() || undefined,
          nacin: uvodjenje ? undefined : nacin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("greska_opsta"));
        return;
      }
      dogadjaj("potvrda_data");
      setUspeh(data.verifikovaniPseudonim);
      setUspehUpozorenje(typeof data.upozorenjeDnevno === "number" ? data.upozorenjeDnevno : null);
      setUspehVrsta(typeof data.vrsta === "string" ? data.vrsta : null);
      setNacin("LICNO");
      setTokenIliBroj("");
      setOznaka("");
      setPotvrdjeno(false);
      setMod("izbor");
      router.refresh();
    } catch {
      setError(t("greska_mreza"));
    } finally {
      setLoading(false);
    }
  }

  if (uspeh) {
    return (
      <UspehKartica
        naslov={t("vn_uspeh_naslov")}
        opis={
          <>
            <span className="font-semibold text-kolo-text">@{uspeh}</span>{" "}
            {uspehVrsta === "UVODJENJE"
              ? t("vn_uspeh_opis_uvodjenje")
              : uspehVrsta === "POTVRDA_CLANA"
                ? t("vn_uspeh_opis_potvrda_clana")
                : t("vn_uspeh_opis")}
            {uspehUpozorenje !== null && (
              <span className="block mt-2 text-kolo-gold-700">
                {t("vn_upozorenje_posle", { redni: uspehUpozorenje, prag: PRAG_ZAUSTAVLJANJA })}
              </span>
            )}
          </>
        }
        dugmeTekst={t("vn_uspeh_dugme")}
        onDugme={() => {
          setUspeh(null);
          setUspehUpozorenje(null);
          setUspehVrsta(null);
          setMod("izbor");
        }}
      />
    );
  }

  return (
    <div className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
      <div className="text-sm uppercase tracking-wide text-kolo-muted font-semibold mb-3">
        {naslov}
      </div>

      {tempo.upozorenje && (
        <Obavestenje vrsta="upozorenje" className="mb-3">
          {t("vn_upozorenje_dnevno", { redni: tempo.sledeca, prag: PRAG_ZAUSTAVLJANJA })}
        </Obavestenje>
      )}

      {mod === "izbor" && (
        <>
          <p className="text-sm text-kolo-muted mb-3">
            {uvodjenje ? t("vn_uputstvo_uvodjenje") : t("vn_uputstvo")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Dugme velicina="lg" onClick={() => setMod("skener")}>
              {t("vn_dugme_skener")}
            </Dugme>
            <Dugme velicina="lg" varijanta="sekundarno" onClick={() => setMod("broj")}>
              {t("vn_dugme_broj")}
            </Dugme>
          </div>
        </>
      )}

      {mod === "skener" && (
        <>
          <QrSkener
            onDetektovan={(token) => {
              setTokenIliBroj(token);
              setMod("broj"); // posle skena prelazimo na potvrdni ekran
            }}
            onZatvori={() => setMod("izbor")}
          />
        </>
      )}

      {mod === "broj" && (
        <form onSubmit={posaji} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            value={tokenIliBroj}
            onChange={(e) => setTokenIliBroj(e.target.value)}
            placeholder={t("vn_ph_token")}
            aria-label={t("vn_ph_token")}
            className={KLASE_UNOSA + " text-base font-mono tracking-wider"}
            autoFocus
            required
          />
          <div>
            <input
              type="text"
              value={oznaka}
              onChange={(e) => setOznaka(e.target.value)}
              maxLength={80}
              placeholder={t("vn_ph_oznaka")}
              aria-label={t("vn_ph_oznaka")}
              aria-describedby="vn-oznaka-napomena"
              className={KLASE_UNOSA}
            />
            <p id="vn-oznaka-napomena" className="text-xs text-kolo-muted mt-1">
              {t("vn_oznaka_napomena")}
            </p>
          </div>
          {!uvodjenje && (
            <fieldset className="space-y-1">
              <legend className="text-xs text-kolo-muted mb-1">{t("vn_nacin_naslov")}</legend>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="nacin"
                  checked={nacin === "LICNO"}
                  onChange={() => setNacin("LICNO")}
                  className="mt-0.5"
                />
                <span>{t("vn_nacin_licno")}</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="nacin"
                  checked={nacin === "TELEFONOM"}
                  onChange={() => setNacin("TELEFONOM")}
                  className="mt-0.5"
                />
                <span>{t("vn_nacin_telefonom")}</span>
              </label>
              <p className="text-xs text-kolo-muted">{t("vn_nacin_napomena")}</p>
            </fieldset>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={potvrdjeno}
              onChange={(e) => setPotvrdjeno(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              {uvodjenje ? t("vn_potvrda_uvodjenje") : nacin === "TELEFONOM" ? t("vn_potvrda_telefonom") : t("vn_potvrda")}
            </span>
          </label>
          <div className="flex gap-2">
            <Dugme type="submit" disabled={loading || !potvrdjeno || tokenIliBroj.trim().length < 6}>
              {loading ? t("vn_saljem") : uvodjenje ? t("vn_dugme_uvedi") : t("vn_dugme_potvrdi")}
            </Dugme>
            <Dugme
              varijanta="sekundarno"
              onClick={() => {
                setMod("izbor");
                setError(null);
              }}
            >
              {t("vn_nazad")}
            </Dugme>
          </div>
          {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}
        </form>
      )}
    </div>
  );
}
