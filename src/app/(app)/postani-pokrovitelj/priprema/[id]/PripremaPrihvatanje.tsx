"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Dugme from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Obavestenje from "@/components/ui/Obavestenje";
import { useDijalog } from "@/components/ui/Dijalog";

type Podaci = {
  naziv: string;
  gazdinstvo: boolean;
  imePrezime: string | null;
  odnos: string | null;
  maticniBroj: string | null;
  pib: string | null;
  bpg: string | null;
  adresaSedista: string | null;
  kontaktTelefon: string | null;
  mapa: string;
  vrstaPrijave: "NOVAC" | "DOBRA" | null;
  vrednostRsd: number | null;
  opisDobra: string | null;
  brojVaucera: number | null;
  cenaPoJedinici: number | null;
  mestoPredaje: string;
  brojCenovnika: number;
};

/**
 * Prihvatanje ili odbijanje upisa i prijave koje je pripremila Fondacija (donacije čl. 16
 * st. 6, čl. 17 st. 4). Izjave iz čl. 17 i izjavu o prikazu adrese daje lice samo; ugovor
 * posle prihvatanja potpisuje kodom sa mejla na stranici pokrovitelja.
 */
export default function PripremaPrihvatanje({
  id,
  podaci,
  trebaIzjavaOvlascenja,
  izjaveUpisaDate,
  jeHrana,
  kljucOvlascenja,
  kljucPotvrde,
}: {
  id: string;
  podaci: Podaci;
  trebaIzjavaOvlascenja: boolean;
  /** Priprema samo prijave iz postojećeg upisa, ili je upis već nastao u prekinutom prihvatanju. */
  izjaveUpisaDate: boolean;
  jeHrana: boolean;
  kljucOvlascenja: string;
  kljucPotvrde: string;
}) {
  const t = useTranslations("postaniPokrovitelj");
  const locale = useLocale();
  const router = useRouter();
  const { dijalog, potvrdi } = useDijalog();
  const [izjavaAdresa, setIzjavaAdresa] = useState(false);
  const [izjavaOvlascenja, setIzjavaOvlascenja] = useState(false);
  const [potvrdaEvidentiranja, setPotvrdaEvidentiranja] = useState(false);
  // Izjave davaoca uz prijavu dobara (donacije čl. 28 st. 3).
  const [izjavaPropisi, setIzjavaPropisi] = useState(false);
  const [izjavaPodataka, setIzjavaPodataka] = useState(false);
  const dobra = podaci.vrstaPrijave === "DOBRA";
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const spremno =
    (izjaveUpisaDate || (izjavaAdresa && potvrdaEvidentiranja && (!trebaIzjavaOvlascenja || izjavaOvlascenja))) &&
    (!dobra || (izjavaPropisi && (!jeHrana || izjavaPodataka)));

  async function posalji(akcija: "prihvati" | "odbij") {
    if (akcija === "odbij" && !(await potvrdi({ poruka: t("priprema_odbij_potvrda"), opasno: true, dugme: t("priprema_odbij") }))) return;
    setRadi(true);
    setGreska(null);
    const r = await fetch(`/api/pokroviteljstvo/priprema/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ akcija, izjavaAdresa, izjavaOvlascenja, potvrdaEvidentiranja, izjavaPropisi, izjavaPodataka }),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(false);
    if (!r.ok) {
      setGreska(d.error ?? t("greska"));
      return;
    }
    router.push(akcija === "prihvati" && d.upisId ? `/postani-pokrovitelj/${d.upisId}` : "/postani-pokrovitelj");
    router.refresh();
  }

  const red = (oznaka: string, vrednost: string | null) =>
    vrednost ? (
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <span className="text-kolo-muted">{oznaka}</span>
        <span className="font-medium text-kolo-text">{vrednost}</span>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      {dijalog}
      <Obavestenje>{t("priprema_napomena")}</Obavestenje>

      <Kartica as="section" className="space-y-2">
        <NaslovSekcije>{podaci.naziv}</NaslovSekcije>
        {red(t("priprema_ime"), podaci.imePrezime)}
        {red(t("priprema_odnos"), podaci.odnos ? t(`priprema_odnos_${podaci.odnos}`) : null)}
        {!podaci.gazdinstvo && red(t("priprema_mb"), podaci.maticniBroj)}
        {!podaci.gazdinstvo && red(t("priprema_pib"), podaci.pib)}
        {!podaci.gazdinstvo && red(t("priprema_sediste"), podaci.adresaSedista)}
        {podaci.gazdinstvo && red(t("priprema_bpg"), podaci.bpg)}
        {red(t("priprema_telefon"), podaci.kontaktTelefon)}
        {red(t("priprema_mapa"), podaci.mapa)}
      </Kartica>

      {podaci.vrstaPrijave && (
        <Kartica as="section" className="space-y-2">
          <NaslovSekcije>{podaci.vrstaPrijave === "NOVAC" ? t("priprema_prijava_novac") : t("priprema_prijava_dobra")}</NaslovSekcije>
          {podaci.vrstaPrijave === "NOVAC" && red(t("priprema_iznos"), podaci.vrednostRsd != null ? `${broj(podaci.vrednostRsd)} RSD` : null)}
          {podaci.vrstaPrijave === "DOBRA" && (
            <>
              {red(t("priprema_opis_dobra"), podaci.opisDobra)}
              {red(t("priprema_broj_vaucera"), podaci.brojVaucera != null ? broj(podaci.brojVaucera) : null)}
              {red(t("priprema_cena"), podaci.cenaPoJedinici != null ? `${broj(podaci.cenaPoJedinici)} RSD` : null)}
              {red(t("priprema_mesto_predaje"), podaci.mestoPredaje)}
              {red(t("priprema_cenovnik"), broj(podaci.brojCenovnika))}
            </>
          )}
          <p className="text-xs text-kolo-muted">{t("priprema_ugovor_napomena")}</p>
        </Kartica>
      )}

      <Kartica as="section" className="space-y-3">
        {izjaveUpisaDate && <p className="text-sm text-kolo-muted">{t("priprema_izjave_upisa_date")}</p>}
        {!izjaveUpisaDate && (
        <label className="flex items-start gap-2 text-sm text-kolo-text">
          <input type="checkbox" className="mt-1" checked={izjavaAdresa} onChange={(e) => setIzjavaAdresa(e.target.checked)} />
          <span>{t("upis_izjava_adresa")}</span>
        </label>
        )}
        {!izjaveUpisaDate && trebaIzjavaOvlascenja && (
          <label className="flex items-start gap-2 text-sm text-kolo-text">
            <input type="checkbox" className="mt-1" checked={izjavaOvlascenja} onChange={(e) => setIzjavaOvlascenja(e.target.checked)} />
            <span>{t(kljucOvlascenja)}</span>
          </label>
        )}
        {!izjaveUpisaDate && (
        <label className="flex items-start gap-2 text-sm text-kolo-text">
          <input type="checkbox" className="mt-1" checked={potvrdaEvidentiranja} onChange={(e) => setPotvrdaEvidentiranja(e.target.checked)} />
          <span>{t(kljucPotvrde)}</span>
        </label>
        )}
        {dobra && (
          <label className="flex items-start gap-2 text-sm text-kolo-text">
            <input type="checkbox" className="mt-1" checked={izjavaPropisi} onChange={(e) => setIzjavaPropisi(e.target.checked)} />
            <span>{t("dobra_izjava_propisi")}</span>
          </label>
        )}
        {dobra && jeHrana && (
          <label className="flex items-start gap-2 text-sm text-kolo-text">
            <input type="checkbox" className="mt-1" checked={izjavaPodataka} onChange={(e) => setIzjavaPodataka(e.target.checked)} />
            <span>{t("dobra_hrana_izjava")}</span>
          </label>
        )}
        {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
        <div className="flex flex-wrap gap-2">
          <Dugme onClick={() => posalji("prihvati")} disabled={!spremno || radi}>
            {t("priprema_prihvati")}
          </Dugme>
          <Dugme varijanta="opasno" onClick={() => posalji("odbij")} disabled={radi}>
            {t("priprema_odbij")}
          </Dugme>
        </div>
      </Kartica>
    </div>
  );
}
