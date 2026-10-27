"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import DatumRodjenja from "@/components/DatumRodjenja";
import { UZRAST_MIN, UZRAST_PUNOLETSTVO } from "@/lib/deca-pravila";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { useDijalog } from "@/components/ui/Dijalog";

type Poziv = {
  pseudonim: string;
  istekao: boolean;
  iskoriscen: boolean;
  odbijen: boolean;
  brisanjeDo: string;
};

/**
 * Stranica na koju vodi link iz poruke roditelju (Pravilnik o učešću dece čl. 10 i 11).
 *
 * Tri radnje, kao i u poruci: **preuzmi nalog**, **ovo nije moje dete**, **obriši
 * nalog**. Preuzimanje traži prijavu (veza mora da stoji na nečijem nalogu) i datum
 * rođenja deteta; druge dve rade bez prijave — onaj ko drži link je jedina osoba
 * koju sistem u tom trenutku može da pita.
 *
 * 🔴 Na stranici stoji SAMO pseudonim deteta. Adresu je uneo neko treći i niko je
 * nije proverio, pa svaki dodatni podatak može da završi kod osobe koja sa detetom
 * nema veze.
 */
export default function DetePozivPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const t = useTranslations("detePoziv");
  const router = useRouter();
  const { dijalog, potvrdi } = useDijalog();

  const [poziv, setPoziv] = useState<Poziv | null>(null);
  const [ucitava, setUcitava] = useState(true);
  const [datum, setDatum] = useState("");
  const [greska, setGreska] = useState("");
  const [radi, setRadi] = useState(false);
  const [ishod, setIshod] = useState<"preuzet" | "odbijen" | "obrisan" | null>(null);

  // Granice se računaju iz istih konstanti kao na serveru — polje ne prihvata
  // datum koji bi server odbio.
  const danas = new Date();
  const najranije = new Date(danas.getFullYear() - UZRAST_PUNOLETSTVO, danas.getMonth(), danas.getDate() + 1)
    .toISOString()
    .slice(0, 10);
  const najkasnije = new Date(danas.getFullYear() - UZRAST_MIN, danas.getMonth(), danas.getDate())
    .toISOString()
    .slice(0, 10);

  const ucitaj = useCallback(async () => {
    setUcitava(true);
    try {
      const res = await fetch(`/api/deca/poziv/${token}`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? t("nepostoji"));
      setPoziv(await res.json());
      setGreska("");
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("nepostoji"));
    } finally {
      setUcitava(false);
    }
  }, [token, t]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function akcija(vrsta: "preuzmi" | "odbij" | "obrisi") {
    setGreska("");
    setRadi(true);
    try {
      const res = await fetch(`/api/deca/poziv/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ akcija: vrsta, datumRodjenja: datum || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        // Nije prijavljen — preuzimanje traži nalog. Vraća se ovde posle prijave.
        router.push(`/login?callbackUrl=${encodeURIComponent(`/dete-poziv/${token}`)}`);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? t("greska"));
      setIshod(vrsta === "preuzmi" ? "preuzet" : vrsta === "odbij" ? "odbijen" : "obrisan");
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("greska"));
    } finally {
      setRadi(false);
    }
  }

  const okvir = "w-full max-w-md rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica";

  if (ucitava) {
    return <div className={okvir}><p className="text-sm text-kolo-muted">{t("ucitavanje")}</p></div>;
  }

  if (ishod) {
    return (
      <div className={`${okvir} space-y-4`}>
        <h1 className="kolo-naslov text-kolo-text">{t(`ishod_${ishod}_naslov`)}</h1>
        <p className="text-sm text-kolo-muted">{t(`ishod_${ishod}_opis`)}</p>
        {ishod === "preuzet" && (
          <Dugme href="/profil" velicina="lg" punaSirina>
            {t("na_profil")}
          </Dugme>
        )}
      </div>
    );
  }

  if (!poziv) {
    return <div className={okvir}><Obavestenje vrsta="greska">{greska || t("nepostoji")}</Obavestenje></div>;
  }

  if (poziv.iskoriscen) {
    return (
      <div className={`${okvir} space-y-3`}>
        <h1 className="kolo-naslov text-kolo-text">{t("vec_preuzet_naslov")}</h1>
        <p className="text-sm text-kolo-muted">{t("vec_preuzet_opis", { pseudonim: poziv.pseudonim })}</p>
      </div>
    );
  }

  return (
    <div className={`${okvir} space-y-5`}>
      {dijalog}
      <div>
        <h1 className="kolo-naslov text-kolo-text">{t("naslov")}</h1>
        <p className="mt-1 text-sm text-kolo-muted">
          {t("opis", { pseudonim: poziv.pseudonim })}
        </p>
        {/* Za mnoge roditelje ovo je prvi susret sa KOLO sistemom (paket F, F6-1):
            pre datuma i dugmeta „Obriši" mora da stoji šta je KOLO i šta dete ovde radi. */}
        <p className="mt-3 text-sm text-kolo-text">{t("uvod")}</p>
        <Link
          href="/cesto-postavljena-pitanja#deca"
          className="mt-1 inline-block text-sm font-medium text-kolo-green-700 underline underline-offset-2"
        >
          {t("uvod_link")}
        </Link>
      </div>

      {poziv.istekao ? (
        <Obavestenje vrsta="upozorenje">{t("istekao")}</Obavestenje>
      ) : (
        <>
          {/* 🔴 Uputstvo za roditelja koji NIJE na platformi. Dugme ispod ga vodi
              na prijavu, a on nalog nema — bez ovih koraka poruka traži radnju
              koju čovek ne ume da izvrši. Stoji IZNAD dugmeta (paket F, F10-3): ko nema nalog
              je inače prvo kliknuo „Preuzmi" i završio na prijavi. Ulazak u Kolo nije uslov. */}
          <div className="rounded-kontrola bg-kolo-bg px-4 py-3 text-sm text-kolo-muted space-y-1">
            <p className="font-semibold text-kolo-text">{t("nisam_clan_naslov")}</p>
            {/* 🔴 Korak 1 mora da bude ŽIV link, i to sa `callbackUrl`. Dugme
                „Preuzmi nalog" iznad vodi na prijavu, a čovek koji nema nalog
                nema šta tamo da radi; obrazac za registraciju sam po sebi ne zna
                da ga posle vrati na poziv. Bez ovoga se roditelj posle otvaranja
                naloga gubi i mora ponovo da traži poruku u pošti. */}
            <p>
              <Link
                href={`/registracija?callbackUrl=${encodeURIComponent(`/dete-poziv/${token}`)}`}
                className="font-medium text-kolo-green-700 underline underline-offset-2"
              >
                {t("nisam_clan_korak1")}
              </Link>
            </p>
            <p>{t("nisam_clan_korak2")}</p>
            {/* Ulazak u Kolo nije uslov za preuzimanje — zato napomena, ne korak (F3-3). */}
            <p className="pt-1">{t("nisam_clan_kasnije")}</p>
          </div>

          <div>
            <label htmlFor="dete-poziv-datum" className="mb-1.5 block text-sm font-medium text-kolo-text">
              {t("datum_rodjenja")}
            </label>
            <DatumRodjenja
              id="dete-poziv-datum"
              value={datum}
              onChange={setDatum}
              min={najranije}
              max={najkasnije}
              porukaGreske={t("datum_raspon")}
            />
            {/* Datum se posle upisa NE menja (deca čl. 4 st. 2) — to mora da piše pre unosa, ne posle. */}
            <p className="mt-1 text-xs text-kolo-muted">{t("datum_opis")}</p>
          </div>

          <Dugme onClick={() => akcija("preuzmi")} disabled={radi || !datum} velicina="lg" punaSirina>
            {t("dugme_preuzmi")}
          </Dugme>

          {/* Poruka traži saglasnost — mora da kaže i šta se za nju dobija.
              Isti sadržaj stoji i u mejlu; ekran ne sme da bude škrtiji od njega. */}
          <p className="text-xs text-kolo-muted">{t("dobijate")}</p>


          <div className="space-y-2 border-t border-kolo-border pt-4">
            <p className="text-xs text-kolo-muted">{t("nije_moje_uvod")}</p>
            <Dugme varijanta="sekundarno" onClick={() => akcija("odbij")} disabled={radi} punaSirina>
              {t("dugme_nije_moje")}
            </Dugme>
            <Dugme
              varijanta="opasno"
              onClick={async () => {
                if (await potvrdi({ poruka: t("potvrda_brisanja"), opasno: true, dugme: t("dugme_obrisi") })) void akcija("obrisi");
              }}
              disabled={radi}
              punaSirina
            >
              {t("dugme_obrisi")}
            </Dugme>
          </div>
        </>
      )}

      {greska && (
        <Obavestenje vrsta="greska">{greska}</Obavestenje>
      )}
    </div>
  );
}
