"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

export default function ZaboravljenaLozinkaPage() {
  const t = useTranslations("zaboravljenaLozinka");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [poslato, setPoslato] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError(t("greska_email_obavezan"));
      return;
    }
    if (!email.includes("@")) {
      setError(t("greska_email_neispravan"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/zaboravljena-lozinka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("greska_zahtev"));
        return;
      }
      setPoslato(true);
    } catch {
      setError(t("greska_zahtev"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Kartica padding="lg">
        <div className="mb-7">
          <h1 className="kolo-naslov text-kolo-text">{t("naslov")}</h1>
          <p className="mt-1 text-base text-kolo-muted">{t("podnaslov")}</p>
        </div>

        {poslato ? (
          <div>
            <Obavestenje vrsta="uspeh" className="mb-5">
              {t("poslato_poruka")}
            </Obavestenje>
            <p className="text-sm text-kolo-muted mb-5">{t("poslato_napomena")}</p>
            <Dugme href="/login" varijanta="sekundarno" velicina="lg" punaSirina>
              {t("nazad_na_login")}
            </Dugme>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4" suppressHydrationWarning>
            <Polje oznaka={t("email")}>
              <input id="polje-zaboravljena-1"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={KLASE_UNOSA}
                placeholder={t("placeholder_email")}
                suppressHydrationWarning
              />
            </Polje>

            {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}

            <Dugme type="submit" disabled={loading} velicina="lg" punaSirina suppressHydrationWarning>
              {loading ? t("dugme_loading") : t("dugme")}
            </Dugme>

            <p className="text-center text-sm text-kolo-muted">
              <Link href="/login" className="inline-flex min-h-9 items-center text-kolo-green-700 font-medium hover:underline">
                {t("nazad_na_login")}
              </Link>
            </p>
          </form>
        )}
      </Kartica>
    </div>
  );
}
