"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  OTVORI_PODESAVANJA_EVENT,
  otvoriPodesavanjaKolacica,
  procitajPristanak,
  sacuvajPristanak,
} from "@/lib/cookieConsent";

/**
 * Banner za pristanak na analitičke kolačiće (Politika privatnosti čl. 10).
 *
 * Prikazuje se samo dok korisnik nije odlučio po VAŽEĆOJ verziji teksta. Odluka
 * „Prihvati" omogućava učitavanje analitike (Google Analytics) preko `Analitika`
 * komponente; „Odbij" trajno sprečava njihovo učitavanje. Neophodni (sesijski)
 * kolačići rade nezavisno od ovog izbora.
 *
 * 🔴 Oba dugmeta su jednim klikom i jednako dostupna — „Odbij" nije sakriven u
 * podmeniju niti zahteva dodatni korak. Bez toga pristanak nije slobodno dat i
 * cela mera pada, ma koliko dobar zapis o njoj vodili. Zaključano testom
 * `pristanak-izvor.test.ts`: ne sklanjati „Odbij" iz prvog nivoa.
 *
 * Odluka se pamti u kolačiću (vidi `cookieConsent.ts`), a kod PRIJAVLJENOG
 * korisnika se uz to beleži i uz nalog — bez ijednog novog podatka o posetiocu.
 */
export function CookieConsent() {
  const t = useTranslations("kolacici");
  const [vidljiv, setVidljiv] = useState(false);

  useEffect(() => {
    setVidljiv(procitajPristanak() === null);
    // Link „Podešavanja kolačića" (futer) vraća banner i posle odluke.
    const otvori = () => setVidljiv(true);
    window.addEventListener(OTVORI_PODESAVANJA_EVENT, otvori);
    return () => window.removeEventListener(OTVORI_PODESAVANJA_EVENT, otvori);
  }, []);

  if (!vidljiv) return null;

  function odluci(p: "prihvaceno" | "odbijeno") {
    sacuvajPristanak(p);
    setVidljiv(false);
    // Zapis uz nalog — samo za prijavljenog korisnika; ruta gosta tiho propušta.
    // Ide kao `void`: banner se zatvara odmah, a pad mreže ne sme da zadrži čoveka
    // na ekranu koji je upravo rešio.
    void fetch("/api/pristanak/kolacici", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pristanak: p }),
    }).catch(() => {});
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("aria")}
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-kolo-border bg-white shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <p className="text-sm text-kolo-text leading-relaxed flex-1">
          {t("tekst")}{" "}
          <Link href="/privatnost" className="text-kolo-green-700 hover:underline whitespace-nowrap">
            {t("saznaj_vise")}
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => odluci("odbijeno")}
            className="px-4 py-2 rounded-lg text-sm font-medium text-kolo-green-900 border border-kolo-border hover:bg-kolo-green-100 transition-colors"
          >
            {t("odbij")}
          </button>
          <button
            type="button"
            onClick={() => odluci("prihvaceno")}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-kolo-green-700 hover:bg-kolo-green-900 transition-colors"
          >
            {t("prihvati")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Link koji ponovo otvara banner — mesto na kome se pristanak povlači
 * (Politika čl. 10). Stoji u oba futera.
 */
export function KolaciciPodesavanja({ className }: { className?: string }) {
  const t = useTranslations("kolacici");
  return (
    <button type="button" onClick={otvoriPodesavanjaKolacica} className={className}>
      {t("podesavanja")}
    </button>
  );
}
