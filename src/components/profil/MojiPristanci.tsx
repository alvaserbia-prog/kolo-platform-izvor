"use client";

/**
 * Pregled datih pristanaka na profilu (R-06, mera M-10).
 *
 * 🔴 Prikazuje SNIMLJEN tekst, ne današnji. Čovek treba da vidi ono što je tada
 * pročitao — to je ceo smisao snimka. Ako bismo mu pokazali aktuelni tekst,
 * pregled bi tvrdio da je pristao na nešto što mu nikad nije bilo prikazano.
 *
 * Učitava se lenjo, na klik: većina ljudi ovo nikad ne otvori, a zahtev na svako
 * učitavanje profila bio bi posao bez povoda.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";

type Pristanak = {
  vrsta: string;
  verzija: string;
  tekst: string;
  jezik: string;
  datAt: string;
  povucenAt: string | null;
};

export function MojiPristanci() {
  const t = useTranslations("pristanak");
  const [otvoreno, setOtvoreno] = useState(false);
  const [stanje, setStanje] = useState<"pocetno" | "ucitava" | "gotovo" | "greska">("pocetno");
  const [redovi, setRedovi] = useState<Pristanak[]>([]);

  async function ucitaj() {
    if (otvoreno) {
      setOtvoreno(false);
      return;
    }
    setOtvoreno(true);
    if (stanje === "gotovo") return;
    setStanje("ucitava");
    try {
      const res = await fetch("/api/profil/pristanci", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { pristanci: Pristanak[] };
      setRedovi(data.pristanci);
      setStanje("gotovo");
    } catch {
      setStanje("greska");
    }
  }

  return (
    <Kartica padding="lg">
      <h2 className="text-base font-semibold text-kolo-muted mb-2">{t("moji_naslov")}</h2>
      <p className="text-xs text-kolo-muted mb-4">{t("moji_opis")}</p>

      <Dugme varijanta="sekundarno" onClick={ucitaj}>
        {otvoreno ? t("moji_sakrij") : t("moji_prikazi")}
      </Dugme>

      {otvoreno && (
        <div className="mt-4 space-y-3">
          {stanje === "ucitava" && <p className="text-xs text-kolo-muted">{t("moji_ucitavam")}</p>}
          {stanje === "greska" && <p className="text-xs text-kolo-danger">{t("moji_greska")}</p>}
          {stanje === "gotovo" && redovi.length === 0 && (
            <p className="text-xs text-kolo-muted">{t("moji_prazno")}</p>
          )}
          {stanje === "gotovo" &&
            redovi.map((r) => (
              <div
                key={`${r.vrsta}-${r.verzija}`}
                className="rounded-kontrola bg-kolo-bg p-3 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-kolo-text">{t(`vrsta_${r.vrsta}`)}</span>
                  <span className="text-kolo-muted">v{r.verzija}</span>
                  <span className="text-kolo-muted">
                    {new Date(r.datAt).toLocaleDateString("sr-RS")}
                  </span>
                  {r.povucenAt && (
                    <span className="text-kolo-danger">
                      {t("moji_povucen", { datum: new Date(r.povucenAt).toLocaleDateString("sr-RS") })}
                    </span>
                  )}
                </div>
                <p className="text-kolo-muted leading-relaxed">{r.tekst}</p>
              </div>
            ))}
        </div>
      )}
    </Kartica>
  );
}
