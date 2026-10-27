"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Dugme, { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";

export type MojZahtevNaSpisku = {
  osnov: string;
  telefon: string;
  createdAt?: string;
} | null;

/**
 * „Želim da me neko nazove" — kartica za KORISNIKA (dokaz stvarnosti čl. 8
 * i 9; set 4.8.2). Zamenjuje karticu „Tvoj put do potvrde": potvrda uplatom i
 * izvodom iz registra je ukinuta, pa su ovde samo spisak za poziv i njegovi osnovi.
 *
 * - `osnovi`: osnovi van zahteva koje je Fondacija utvrdila (DONACIJA,
 *   POKROVITELJSTVO, GAZDINSTVO_RPG — `osnoviZaSpisak`); po njima se na spisak ulazi
 *   samo sa brojem i pristankom.
 * - `mojZahtev`: upis na spisku, ako postoji (`mojZahtev`).
 *
 * Pre ulaska korisnik se obaveštava ko će ga zvati i šta će taj videti (čl. 9 st.
 * 4); pristanak se daje u obrascu na `/kontaktiraj-nas`. Povlačenje je ovde.
 *
 * `radiPotvrde` (set 4.8.3; čl. 16): ista kartica za ČLANA BEZ POTVRDE — „Želim da me
 * neko nazove radi potvrde". Zove čuvar Kola. Kad uslovi iz čl. 16 st. 1 nisu
 * ispunjeni, kartica kaže koji uslov nedostaje i od kog dana će biti ispunjen.
 */
export type UslovPrikaz = { ok: true } | { ok: false; uslov: string; odDana: string | null };

export default function ZelimDaMeNekoNazove({
  osnovi,
  mojZahtev,
  radiPotvrde = false,
  uslov,
}: {
  osnovi: string[];
  mojZahtev: MojZahtevNaSpisku;
  radiPotvrde?: boolean;
  uslov?: UslovPrikaz;
}) {
  const t = useTranslations("spisak");
  const router = useRouter();
  const [moj, setMoj] = useState<MojZahtevNaSpisku>(mojZahtev);
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  async function povuci() {
    setRadi(true);
    setGreska(null);
    const r = await fetch("/api/zahtev-razgovor", { method: "DELETE" });
    setRadi(false);
    if (!r.ok) {
      setGreska(t("nazove_greska"));
      return;
    }
    setMoj(null);
    setPoruka(t("nazove_povucen"));
    router.refresh();
  }

  const dodatni = osnovi.filter((o) => o !== "ZAHTEV");
  const zakljucano = radiPotvrde && uslov && !uslov.ok ? uslov : null;

  return (
    <div id="nazove" className="rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-5 space-y-3 scroll-mt-20">
      <h2 className="text-sm font-semibold text-kolo-text">
        {radiPotvrde ? t("nazove_potvrda_naslov") : t("nazove_naslov")}
      </h2>
      <p className="text-sm text-kolo-muted">{radiPotvrde ? t("nazove_potvrda_opis") : t("nazove_opis")}</p>
      <p className="text-sm text-kolo-text">
        {radiPotvrde ? t("nazove_potvrda_obavestenje") : t("nazove_obavestenje")}
      </p>
      {!radiPotvrde && <p className="text-xs text-kolo-muted">{t("nazove_ne_potvrdjuje")}</p>}
      {zakljucano && (
        <Obavestenje vrsta="info">
          {zakljucano.uslov === "TRIDESET_DANA" && zakljucano.odDana
            ? t("nazove_potvrda_uslov_dani", { datum: new Date(zakljucano.odDana).toLocaleDateString("sr-RS") })
            : t(`nazove_potvrda_uslov_${zakljucano.uslov.toLowerCase()}`)}
        </Obavestenje>
      )}

      {moj ? (
        <div className="space-y-2 rounded-kontrola bg-kolo-green-50 px-4 py-3">
          <p className="text-sm text-kolo-text">{t("nazove_na_spisku", { telefon: moj.telefon })}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={moj.osnov === "ZAHTEV" ? "/kontaktiraj-nas" : `/kontaktiraj-nas?osnov=${moj.osnov}`}
              className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
            >
              {t("nazove_izmeni")}
            </Link>
            <Dugme varijanta="sekundarno" velicina="sm" onClick={povuci} disabled={radi}>
              {t("nazove_povuci")}
            </Dugme>
          </div>
        </div>
      ) : zakljucano ? null : (
        <div className="space-y-3">
          {dodatni.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-kolo-muted">{t("nazove_osnovi")}</p>
              <ul className="flex flex-wrap gap-2">
                {dodatni.map((o) => (
                  <li key={o}>
                    <Link
                      href={`/kontaktiraj-nas?osnov=${o}`}
                      className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                    >
                      {t(`osnov_${o.toLowerCase()}`)} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link
            href="/kontaktiraj-nas"
            className={klaseDugmeta()}
          >
            {radiPotvrde ? t("nazove_potvrda_dugme") : t("nazove_dugme")}
          </Link>
        </div>
      )}
      {poruka && <Obavestenje vrsta="uspeh">{poruka}</Obavestenje>}
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
    </div>
  );
}
