"use client";

/**
 * Odjava sa email obaveštenja preko linka iz podnožja mejla — bez prijave.
 *
 * Odjava se izvršava tek na klik (POST), ne na otvaranje stranice: klijenti za
 * poštu ponekad unapred učitavaju linkove, pa bi automatska odjava isključila
 * mejlove korisniku koji ih i dalje želi.
 */

import { useState, use } from "react";
import { useTranslations } from "next-intl";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";

export default function OdjavaObavestenjaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const t = useTranslations("odjavaObavestenja");

  const [stanje, setStanje] = useState<"pocetno" | "salje" | "odjavljen" | "greska">("pocetno");

  async function odjavi() {
    setStanje("salje");
    try {
      const res = await fetch("/api/email/odjava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setStanje(res.ok ? "odjavljen" : "greska");
    } catch {
      setStanje("greska");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Kartica padding="lg">
        <div className="mb-6">
          <h1 className="kolo-naslov text-kolo-text">{t("naslov")}</h1>
          <p className="mt-1 text-base text-kolo-muted">
            {stanje === "odjavljen" ? t("podnaslov_gotovo") : t("podnaslov")}
          </p>
        </div>

        {stanje === "odjavljen" ? (
          <div>
            <Obavestenje vrsta="uspeh" className="mb-5">
              {t("uspesno")}
            </Obavestenje>
            <p className="text-sm text-kolo-muted mb-5">{t("ponovo_uputstvo")}</p>
            <Dugme href="/profil" velicina="lg" punaSirina>
              {t("na_profil")}
            </Dugme>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-kolo-muted">{t("objasnjenje")}</p>
            <p className="text-sm text-kolo-muted">{t("napomena_lozinka")}</p>

            {stanje === "greska" && (
              <Obavestenje vrsta="greska">{t("greska")}</Obavestenje>
            )}

            <Dugme onClick={odjavi} disabled={stanje === "salje"} velicina="lg" punaSirina>
              {stanje === "salje" ? t("dugme_loading") : t("dugme")}
            </Dugme>
          </div>
        )}
      </Kartica>
    </div>
  );
}
