"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import PrikaziLozinkuDugme from "@/components/PrikaziLozinkuDugme";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

function jacina(p: string, t: (k: string) => string): { nivo: number; tekst: string; boja: string } {
  if (p.length === 0) return { nivo: 0, tekst: "", boja: "" };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { nivo: 1, tekst: t("lozinka_slaba"), boja: "bg-kolo-danger" };
  if (score <= 2) return { nivo: 2, tekst: t("lozinka_srednja"), boja: "bg-kolo-gold-400" };
  if (score <= 3) return { nivo: 3, tekst: t("lozinka_dobra"), boja: "bg-kolo-green-500" };
  return { nivo: 4, tekst: t("lozinka_jaka"), boja: "bg-kolo-green-700" };
}

export default function ResetLozinkaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const t = useTranslations("resetLozinka");
  const tReg = useTranslations("registracija");

  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [novaLozinka, setNovaLozinka] = useState("");
  const [prikaziLozinku, setPrikaziLozinku] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uspesno, setUspesno] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reset-lozinka?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setTokenStatus(data.valid ? "valid" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setTokenStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const lozinkaJacina = jacina(novaLozinka, tReg);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (novaLozinka.length < 8) {
      setError(t("greska_lozinka_kratka"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reset-lozinka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaLozinka }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("greska_zahtev"));
        return;
      }
      setUspesno(true);
      setTimeout(() => router.push("/login"), 2500);
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

        {tokenStatus === "checking" && (
          <p className="text-sm text-kolo-muted text-center py-4">{t("provera_linka")}</p>
        )}

        {tokenStatus === "invalid" && (
          <div>
            <Obavestenje vrsta="greska" className="mb-5">
              {t("link_nevazeci")}
            </Obavestenje>
            <Dugme href="/zaboravljena-lozinka" velicina="lg" punaSirina>
              {t("trazi_novi_link")}
            </Dugme>
          </div>
        )}

        {tokenStatus === "valid" && uspesno && (
          <div>
            <Obavestenje vrsta="uspeh" className="mb-5">
              {t("uspesno_promenjena")}
            </Obavestenje>
            <p className="text-sm text-kolo-muted text-center">{t("preusmeravanje")}</p>
          </div>
        )}

        {tokenStatus === "valid" && !uspesno && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4" suppressHydrationWarning>
            <div>
              <label htmlFor="polje-token-1" className="block text-sm font-medium text-kolo-text mb-1.5">
                {t("nova_lozinka")}
              </label>
              <div className="relative">
                <input id="polje-token-1"
                  type={prikaziLozinku ? "text" : "password"}
                  autoComplete="new-password"
                  value={novaLozinka}
                  onChange={(e) => setNovaLozinka(e.target.value)}
                  className={`${KLASE_UNOSA} pr-12`}
                  placeholder={t("placeholder_lozinka")}
                  suppressHydrationWarning
                />
                <PrikaziLozinkuDugme
                  prikazan={prikaziLozinku}
                  onToggle={() => setPrikaziLozinku((v) => !v)}
                  prikaziLabel={tReg("prikazi_lozinku")}
                  sakrijLabel={tReg("sakrij_lozinku")}
                />
              </div>
              {novaLozinka.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          n <= lozinkaJacina.nivo ? lozinkaJacina.boja : "bg-kolo-border"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className={`text-xs ${
                      lozinkaJacina.nivo <= 1
                        ? "text-kolo-danger"
                        : lozinkaJacina.nivo <= 2
                        ? "text-kolo-gold-700"
                        : "text-kolo-green-700"
                    }`}
                  >
                    {lozinkaJacina.tekst}
                  </p>
                </div>
              )}
            </div>

            {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}

            <Dugme type="submit" disabled={loading} velicina="lg" punaSirina suppressHydrationWarning>
              {loading ? t("dugme_loading") : t("dugme")}
            </Dugme>
          </form>
        )}
      </Kartica>
    </div>
  );
}
