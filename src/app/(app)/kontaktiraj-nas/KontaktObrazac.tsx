"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import LokacijaSearch from "@/components/LokacijaSearch";
import { MAX_DOSTUPNOST, MAX_OPIS_ZAHTEVA } from "@/lib/nov-clan-pravila";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

type Podaci = { imePrezime: string; mesto: string; opis: string; dostupnost: string; telefon: string };

/**
 * Obrazac „Želim da me neko nazove" (dokaz stvarnosti čl. 8 i 9).
 * Pristanak se traži uz svako slanje. Ime i prezime, mesto i broj telefona su
 * obavezni za svaki osnov (set 4.8.4, N4-M2) i ostaju uz nalog: ime u evidenciji
 * identiteta (jednom upisano se ovde ne menja), mesto i broj na profilu. Opis i
 * dostupnost su obavezni samo za osnov ZAHTEV.
 */
export default function KontaktObrazac({
  osnov,
  pocetno,
  poslat: poslatPocetno,
  imeUpisano = false,
}: {
  osnov: string;
  pocetno: Podaci;
  poslat: boolean;
  imeUpisano?: boolean;
}) {
  const t = useTranslations("kontakt");
  const [p, setP] = useState<Podaci>(pocetno);
  const [pristanak, setPristanak] = useState(false);
  const [poslat, setPoslat] = useState(poslatPocetno);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setGreska(null);
    setPoruka(null);
    // Dugme se ne gasi dok saglasnost nije označena — klik kaže šta fali.
    if (!pristanak) { setGreska(t("fali_pristanak")); return; }
    setRadi(true);
    const r = await fetch("/api/zahtev-razgovor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, osnov, pristanak }),
    });
    setRadi(false);
    if (!r.ok) {
      setGreska((await r.json().catch(() => ({}))).error ?? t("greska"));
      return;
    }
    setPoslat(true);
    setPristanak(false);
    setPoruka(poslat ? t("izmenjen") : radiPotvrde ? t("poslat_potvrda") : t("poslat"));
  }

  async function povuci() {
    setRadi(true);
    setGreska(null);
    const r = await fetch("/api/zahtev-razgovor", { method: "DELETE" });
    setRadi(false);
    if (!r.ok) {
      setGreska(t("greska"));
      return;
    }
    setPoslat(false);
    setPoruka(t("povucen"));
  }

  const zahtev = osnov === "ZAHTEV";
  // Zahtev radi potvrde (dokaz čl. 8 st. 4, 16 st. 2): obavezno je samo kada si dostupan.
  const radiPotvrde = osnov === "POTVRDA";
  const oznaka = (kljuc: string, obavezno = zahtev) => (obavezno ? t(kljuc) : `${t(kljuc)} (${t("neobavezno")})`);
  const polje = KLASE_UNOSA;

  return (
    <div className="space-y-4">
      {poslat && (
        <Obavestenje vrsta="uspeh">{radiPotvrde ? t("status_poslat_potvrda") : t("status_poslat")}</Obavestenje>
      )}
      <form onSubmit={posalji} className="space-y-4 rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-5">
        <p className="text-xs text-kolo-muted">{t("profil_napomena")}</p>
        <Polje oznaka={t("ime_prezime")} pomoc={imeUpisano ? t("ime_prezime_upisano") : t("ime_prezime_opis")}>
          <input
            id="kontakt-ime"
            value={p.imePrezime}
            onChange={(e) => setP({ ...p, imePrezime: e.target.value })}
            readOnly={imeUpisano}
            maxLength={100}
            autoComplete="name"
            className={polje}
          />
        </Polje>
        <Polje oznaka={oznaka("mesto", true)}>
          <LokacijaSearch id="polje-kontaktirajn-1" value={p.mesto} onChange={(mesto) => setP({ ...p, mesto })} placeholder={t("mesto_placeholder")} />
        </Polje>
        <Polje oznaka={oznaka("opis")}>
          <textarea
            id="kontakt-opis"
            value={p.opis}
            onChange={(e) => setP({ ...p, opis: e.target.value })}
            maxLength={MAX_OPIS_ZAHTEVA}
            rows={3}
            placeholder={t("opis_placeholder")}
            className={polje}
          />
        </Polje>
        <Polje oznaka={oznaka("dostupnost", zahtev || radiPotvrde)}>
          <input
            id="kontakt-dostupnost"
            value={p.dostupnost}
            onChange={(e) => setP({ ...p, dostupnost: e.target.value })}
            maxLength={MAX_DOSTUPNOST}
            placeholder={t("dostupnost_placeholder")}
            className={polje}
          />
        </Polje>
        <Polje oznaka={t("telefon")} pomoc={t("telefon_opis")}>
          <input
            id="kontakt-telefon"
            type="tel"
            inputMode="tel"
            value={p.telefon}
            onChange={(e) => setP({ ...p, telefon: e.target.value })}
            placeholder="06x xxx xxxx"
            className={polje}
          />
        </Polje>
        <label className="flex items-start gap-2 text-sm text-kolo-text">
          <input
            id="kontakt-pristanak"
            type="checkbox"
            checked={pristanak}
            onChange={(e) => setPristanak(e.target.checked)}
            className="mt-1"
          />
          <span>{radiPotvrde ? t("pristanak_potvrda") : t("pristanak")}</span>
        </label>
        {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
        {poruka && <Obavestenje vrsta="uspeh">{poruka}</Obavestenje>}
        <div className="flex flex-wrap gap-2">
          <Dugme type="submit" disabled={radi}>
            {radi ? "..." : poslat ? t("dugme_izmeni") : t("dugme_posalji")}
          </Dugme>
          {poslat && (
            <Dugme varijanta="sekundarno" onClick={povuci} disabled={radi}>
              {t("dugme_povuci")}
            </Dugme>
          )}
        </div>
      </form>
    </div>
  );
}
