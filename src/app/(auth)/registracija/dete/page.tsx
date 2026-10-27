"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import PrikaziLozinkuDugme from "@/components/PrikaziLozinkuDugme";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import { MIN_LOZINKA } from "@/lib/deca-pravila";

/**
 * Registracija deteta (Pravilnik o učešću dece čl. 8).
 *
 * 🔴 Zaseban obrazac, ne prekidač u obrascu za odrasle. Traži se drugačiji skup
 * podataka (imejl RODITELJA umesto svog, bez mesta, bez datuma rođenja), a rečenice
 * su pisane detetu. Jedan obrazac koji se granа bio bi duži i za odraslog i za dete.
 *
 * Dete NE unosi datum rođenja — upisuje ga roditelj pri preuzimanju (deca čl. 4 st. 2), jer je
 * roditeljska izjava jedina provera godina kojom sistem raspolaže.
 */
export default function RegistracijaDetetaPage() {
  const router = useRouter();
  const t = useTranslations("registracijaDeteta");
  const [pseudonim, setPseudonim] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [prikaziLozinku, setPrikaziLozinku] = useState(false);
  const [roditeljEmail, setRoditeljEmail] = useState("");
  const [greska, setGreska] = useState("");
  const [salje, setSalje] = useState(false);
  const [kod, setKod] = useState<string | null>(null);

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setGreska("");
    // Dugme se ne gasi zbog nepotpunog obrasca — klik kaže šta fali.
    if (!pseudonim.trim()) { setGreska(t("fali_pseudonim")); return; }
    if (lozinka.length < MIN_LOZINKA) { setGreska(t("fali_lozinka", { broj: MIN_LOZINKA })); return; }
    if (!roditeljEmail.includes("@")) { setGreska(t("fali_email")); return; }
    setSalje(true);
    try {
      const res = await fetch("/api/deca/registracija", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonim, lozinka, roditeljEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? t("greska"));
      // Kod se prikazuje ODMAH, pre prijave: to je rezervni put do roditelja ako
      // poruka ne stigne, a dete ga sa ovog ekrana može odmah pročitati naglas.
      setKod(data.kod);
      await signIn("credentials", { email: pseudonim, password: lozinka, redirect: false });
    } catch (err) {
      setGreska(err instanceof Error ? err.message : t("greska"));
    } finally {
      setSalje(false);
    }
  }

  if (kod) {
    return (
      <Kartica padding="lg" className="w-full max-w-sm space-y-4">
        <h1 className="kolo-naslov text-kolo-text">{t("uspeh_naslov")}</h1>
        <p className="text-sm text-kolo-muted">{t("uspeh_opis", { email: roditeljEmail })}</p>
        <div className="rounded-kontrola bg-kolo-bg p-4 text-center">
          <p className="text-xs text-kolo-muted">{t("kod_naslov")}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-widest tabular-nums text-kolo-text">
            {kod}
          </p>
          <p className="mt-1 text-xs text-kolo-muted">{t("kod_opis")}</p>
        </div>
        <Dugme onClick={() => router.push("/pocetna")} velicina="lg" punaSirina>
          {t("dalje")}
        </Dugme>
      </Kartica>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Kartica padding="lg">
        <h1 className="kolo-naslov text-kolo-text">{t("naslov")}</h1>
        <p className="mt-1 text-sm text-kolo-muted">{t("podnaslov")}</p>

        <form onSubmit={posalji} noValidate className="mt-6 space-y-4">
          <Polje oznaka={t("pseudonim")} pomoc={t("pseudonim_opis")}>
            <input id="polje-dete-1"
              value={pseudonim}
              onChange={(e) => setPseudonim(e.target.value)}
              maxLength={30}
              autoComplete="username"
              placeholder={t("pseudonim_placeholder")}
              className={KLASE_UNOSA}
            />
          </Polje>

          <div>
            <label htmlFor="polje-dete-2" className="mb-1.5 block text-sm font-medium text-kolo-text">{t("lozinka")}</label>
            <div className="relative">
              <input id="polje-dete-2"
                type={prikaziLozinku ? "text" : "password"}
                value={lozinka}
                onChange={(e) => setLozinka(e.target.value)}
                autoComplete="new-password"
                className={`${KLASE_UNOSA} pr-12`}
              />
              <PrikaziLozinkuDugme
                prikazan={prikaziLozinku}
                onToggle={() => setPrikaziLozinku((v) => !v)}
                prikaziLabel={t("prikazi_lozinku")}
                sakrijLabel={t("sakrij_lozinku")}
              />
            </div>
            {/* Pravilo pre unosa, ne tek u grešci (paket F, F10-5). */}
            <p className="mt-1.5 text-sm text-kolo-muted">{t("lozinka_opis", { broj: MIN_LOZINKA })}</p>
          </div>

          <Polje oznaka={t("email_roditelja")} pomoc={t("email_roditelja_opis")}>
            <input id="polje-dete-3"
              type="email"
              value={roditeljEmail}
              onChange={(e) => setRoditeljEmail(e.target.value)}
              placeholder="mama@primer.rs"
              className={KLASE_UNOSA}
            />
          </Polje>

          {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}

          <Dugme
            type="submit"
            disabled={salje}
            velicina="lg"
            punaSirina
          >
            {salje ? t("dugme_salje") : t("dugme")}
          </Dugme>
        </form>

        <p className="mt-5 text-center text-sm text-kolo-muted">
          {t("odrastao")}{" "}
          <Link href="/registracija" className="font-medium text-kolo-green-700 hover:underline">
            {t("odrastao_link")}
          </Link>
        </p>
      </Kartica>
    </div>
  );
}
