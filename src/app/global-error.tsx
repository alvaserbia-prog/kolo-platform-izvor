"use client";

import { useEffect, useState } from "react";
import { SistemskiEkran } from "@/components/SistemskiEkran";
import { PAD_SISTEMA, htmlLang, jezikIzKolacica, type EkranJezik } from "@/lib/ekran-poruke";

/**
 * POSLEDNJA LINIJA ODBRANE — hvata greške koje su pukle u samom `RootLayout`-u
 * (npr. baza nedostupna pa `sesija()` baci, ili `getMessages()` ne uspe). U tom
 * slučaju `error.tsx` NE pomaže, jer on živi UNUTAR layout-a koji nije ni
 * uspeo da se renderuje. Zato ovaj fajl mora sam da renderuje `<html>`/`<body>`.
 *
 * Posledica: ovde nema fontova iz layout-a, nema `globals.css`, nema i18n
 * providera — sve što `SistemskiEkran` koristi je inline (vidi komentar tamo).
 *
 * U dev režimu Next umesto ovoga prikazuje svoj error overlay; ekran se vidi
 * tek u produkcijskom build-u (`npm run build && npm start`).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Jezik se čita tek posle montiranja: `document.cookie` ne postoji pri SSR-u,
  // a čitanje u renderu bi napravilo neslaganje sa hidratacijom.
  const [jezik, postaviJezik] = useState<EkranJezik>("sr");
  useEffect(() => postaviJezik(jezikIzKolacica()), []);

  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang={htmlLang(jezik)}>
      <body style={{ margin: 0 }}>
        <SistemskiEkran
          tekst={PAD_SISTEMA[jezik]}
          naDugme={reset}
          oznakaGreske={error.digest}
        />
      </body>
    </html>
  );
}
