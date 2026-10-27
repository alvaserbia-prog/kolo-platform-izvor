"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Skola } from "@/lib/skola";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

/**
 * Izbor škole maloletnog korisnika (Pravilnik o učešću dece, čl. 26).
 *
 * 🔴 Nema slobodnog unosa. Za razliku od `LokacijaSearch`, koji zatečeni otkucani
 * tekst tolerantno tumači, ovde se šalje ŠIFRA izabrane stavke — ranglista bez
 * jedinstvenog zapisa naziva ne postoji („OŠ Vuk Karadžić" i „Osnovna škola Vuk
 * Karadžić" bile bi dve škole). Otkucani tekst služi samo za pretragu.
 *
 * Pretraga ide na server, a ne kroz šifarnik u paketu: spisak nosi oko 1.600 škola
 * i preko sto kilobajta, a treba samo detetu koje bira školu, jednom.
 */
export default function IzborSkole({
  pocetna,
}: {
  pocetna: { sifra: string; naziv: string; mesto: string } | null;
}) {
  const t = useTranslations("skole");
  const [izabrana, setIzabrana] = useState(pocetna);
  const [upit, setUpit] = useState("");
  const [pogoci, setPogoci] = useState<Skola[]>([]);
  const [otvoreno, setOtvoreno] = useState(false);
  const [poruka, setPoruka] = useState<{ tekst: string; greska: boolean } | null>(null);
  const [salje, setSalje] = useState(false);
  const okvir = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function vanOkvira(e: MouseEvent) {
      if (okvir.current && !okvir.current.contains(e.target as Node)) setOtvoreno(false);
    }
    document.addEventListener("mousedown", vanOkvira);
    return () => document.removeEventListener("mousedown", vanOkvira);
  }, []);

  // Pretraga se odlaže 250 ms — isti razmak kao kod pretrage članova, da kucanje
  // ne pravi jedan zahtev po slovu.
  useEffect(() => {
    const s = upit.trim();
    if (s.length < 2) {
      setPogoci([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/skole/pretraga?q=${encodeURIComponent(s)}`);
        const body = await r.json().catch(() => ({}));
        setPogoci(r.ok ? (body.skole ?? []) : []);
      } catch {
        setPogoci([]);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [upit]);

  async function sacuvaj(sifra: string | null, prikaz: typeof izabrana) {
    setSalje(true);
    setPoruka(null);
    try {
      const r = await fetch("/api/profil/skola", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sifra }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        // Odbijanje zbog roka od 30 dana nosi DATUM sledeće promene — poruka se
        // prikazuje doslovno, jer taj datum je jedino što čoveku treba.
        setPoruka({ tekst: body.error ?? t("greska_ucitavanje"), greska: true });
        return;
      }
      setIzabrana(prikaz);
      setUpit("");
      setPogoci([]);
      setOtvoreno(false);
      setPoruka({ tekst: t("izbor_sacuvano"), greska: false });
    } finally {
      setSalje(false);
    }
  }

  return (
    <div className="rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-5">
      <h2 className="text-base font-semibold text-kolo-text">{t("izbor_naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("izbor_opis")}</p>

      {izabrana && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-kontrola bg-kolo-green-100 px-3 py-2">
          <span className="font-medium text-kolo-text">{izabrana.naziv}</span>
          <span className="text-sm text-kolo-muted">{izabrana.mesto}</span>
          <button
            type="button"
            onClick={() => sacuvaj(null, null)}
            disabled={salje}
            className="ml-auto min-h-11 text-sm text-kolo-muted underline underline-offset-2 hover:text-kolo-text disabled:opacity-50"
          >
            {t("izbor_ukloni")}
          </button>
        </div>
      )}

      <div ref={okvir} className="relative mt-3">
        <input
          type="text"
          value={upit}
          onChange={(e) => {
            setUpit(e.target.value);
            setOtvoreno(true);
          }}
          onFocus={() => setOtvoreno(true)}
          placeholder={t("izbor_placeholder")}
          aria-label={t("izbor_naslov")}
          className={KLASE_UNOSA}
        />

        {otvoreno && upit.trim().length >= 2 && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-kontrola border border-kolo-border bg-kolo-surface shadow-lg">
            {pogoci.length === 0 ? (
              <li className="px-3 py-2 text-sm text-kolo-muted">{t("izbor_nema_pogodaka")}</li>
            ) : (
              pogoci.map((s) => (
                <li key={s.sifra}>
                  <button
                    type="button"
                    disabled={salje}
                    onClick={() =>
                      sacuvaj(s.sifra, { sifra: s.sifra, naziv: s.naziv, mesto: s.mesto })
                    }
                    className="block w-full min-h-11 px-3 py-2 text-left text-sm hover:bg-kolo-green-100 disabled:opacity-50"
                  >
                    <span className="text-kolo-text">{s.naziv}</span>
                    <span className="ml-2 text-kolo-muted">{s.mesto}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <p className="mt-2 text-xs text-kolo-muted">{t("izbor_rok")}</p>

      {poruka && (
        <Obavestenje vrsta={poruka.greska ? "greska" : "uspeh"} className="mt-2">
          {poruka.tekst}
        </Obavestenje>
      )}
    </div>
  );
}
