"use client";

import { useEffect, useState } from "react";
import { SistemskiEkran } from "@/components/SistemskiEkran";
import { PAD_SISTEMA, jezikIzKolacica, type EkranJezik } from "@/lib/ekran-poruke";

/**
 * Granica greške za sve što je UNUTAR `RootLayout`-a — dakle za pad bilo koje
 * stranice ili ugnežđenog layout-a (`(app)`, `(public)`, `pijaca`…). Layout je
 * ovde živ, pa `reset()` može da pokuša ponovni render bez punog reload-a.
 *
 * Ako pukne SAM layout, ovaj boundary se ne prikazuje — tada nastupa
 * `global-error.tsx`. Ista poruka na oba mesta je namerna: korisnik ne treba
 * da razlikuje sloj u kome je greška nastala.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [jezik, postaviJezik] = useState<EkranJezik>("sr");
  useEffect(() => postaviJezik(jezikIzKolacica()), []);

  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <SistemskiEkran tekst={PAD_SISTEMA[jezik]} naDugme={reset} oznakaGreske={error.digest} />
  );
}
