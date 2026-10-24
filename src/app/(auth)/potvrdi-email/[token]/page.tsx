"use client";

/**
 * Potvrda imejl adrese koju je maloletni korisnik upisao — preko linka iz poruke,
 * bez prijave.
 *
 * Potvrda se izvršava tek na klik (POST), ne na otvaranje stranice: klijenti za
 * poštu ponekad unapred učitavaju linkove, pa bi se adresa potvrdila bez ijednog
 * ljudskog klika. Isti razlog kao kod odjave sa obaveštenja.
 */

import { useState, use } from "react";
import { useTranslations } from "next-intl";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";

export default function PotvrdiEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const t = useTranslations("potvrdiEmail");

  const [stanje, setStanje] = useState<"pocetno" | "salje" | "gotovo" | "greska">("pocetno");
  const [poruka, setPoruka] = useState<string | null>(null);

  async function potvrdi() {
    setStanje("salje");
    try {
      const res = await fetch("/api/profil/email/potvrdi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPoruka(data?.error ?? t("greska"));
        setStanje("greska");
        return;
      }
      setStanje("gotovo");
    } catch {
      setPoruka(t("greska"));
      setStanje("greska");
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Kartica padding="lg">
        <div className="mb-6">
          <h1 className="kolo-naslov text-kolo-text">{t("naslov")}</h1>
          <p className="mt-1 text-base text-kolo-muted">
            {stanje === "gotovo" ? t("podnaslov_gotovo") : t("podnaslov")}
          </p>
        </div>

        {stanje === "gotovo" ? (
          <div>
            <Obavestenje vrsta="uspeh" className="mb-5">
              {t("uspesno")}
            </Obavestenje>
            <p className="text-sm text-kolo-muted mb-5">{t("cemu_sluzi")}</p>
            <Dugme href="/pocetna" velicina="lg" punaSirina>
              {t("na_pocetnu")}
            </Dugme>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-kolo-muted">{t("objasnjenje")}</p>
            <p className="text-sm text-kolo-muted">{t("nisi_ti")}</p>

            {stanje === "greska" && (
              <Obavestenje vrsta="greska">{poruka ?? t("greska")}</Obavestenje>
            )}

            <Dugme onClick={potvrdi} disabled={stanje === "salje"} velicina="lg" punaSirina>
              {stanje === "salje" ? t("dugme_loading") : t("dugme")}
            </Dugme>
          </div>
        )}
      </Kartica>
    </div>
  );
}
