"use client";

/**
 * Imejl adresa maloletnog korisnika — dobrovoljan upis u profilu.
 *
 * Zašto postoji i zašto ide preko potvrde — vidi `lib/protokol/dete-email.ts`.
 * Ovde je bitno samo jedno: ekran nikad ne sme da kaže „sačuvano" dok adresa nije
 * potvrđena, jer do potvrde ona ne radi ništa. Zato stanje ima tri prikaza —
 * upisana, čeka potvrdu, nema je.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

type Stanje = { email: string | null; naCekanju: string | null };

export default function EmailDeteta() {
  const t = useTranslations("emailDeteta");
  const [stanje, setStanje] = useState<Stanje | null>(null);
  const [unos, setUnos] = useState("");
  const [salje, setSalje] = useState(false);
  const [poruka, setPoruka] = useState<{ tekst: string; greska: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profil/email", { cache: "no-store" });
        if (res.ok) setStanje(await res.json());
        else setStanje({ email: null, naCekanju: null });
      } catch {
        setStanje({ email: null, naCekanju: null });
      }
    })();
  }, []);

  async function posalji() {
    setSalje(true);
    setPoruka(null);
    try {
      const res = await fetch("/api/profil/email", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unos }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPoruka({ tekst: data?.error ?? t("greska"), greska: true });
        return;
      }
      setStanje((s) => ({ email: s?.email ?? null, naCekanju: data.email }));
      setUnos("");
      setPoruka({ tekst: t("poslato", { email: data.email }), greska: false });
    } catch {
      setPoruka({ tekst: t("greska"), greska: true });
    } finally {
      setSalje(false);
    }
  }

  async function ukloni() {
    setSalje(true);
    setPoruka(null);
    try {
      const res = await fetch("/api/profil/email", { method: "DELETE" });
      if (!res.ok) {
        setPoruka({ tekst: t("greska"), greska: true });
        return;
      }
      setStanje({ email: null, naCekanju: null });
      setPoruka({ tekst: t("uklonjeno"), greska: false });
    } catch {
      setPoruka({ tekst: t("greska"), greska: true });
    } finally {
      setSalje(false);
    }
  }

  if (!stanje) return null;

  return (
    <div className="rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-5">
      <h2 className="text-base font-semibold text-kolo-text">{t("naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("opis")}</p>

      {stanje.email && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-kontrola bg-kolo-green-100 px-3 py-2">
          <span className="font-medium text-kolo-text">{stanje.email}</span>
          <span className="text-sm text-kolo-green-700">{t("oznaka_potvrdjena")}</span>
          <button
            type="button"
            onClick={ukloni}
            disabled={salje}
            className="ml-auto min-h-11 text-sm text-kolo-muted underline underline-offset-2 hover:text-kolo-text disabled:opacity-50"
          >
            {t("ukloni")}
          </button>
        </div>
      )}

      {stanje.naCekanju && (
        <p className="mt-3 rounded-kontrola bg-kolo-green-100 px-3 py-2 text-sm text-kolo-text">
          {t("ceka_potvrdu", { email: stanje.naCekanju })}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={unos}
          onChange={(e) => setUnos(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("naslov")}
          className={KLASE_UNOSA}
        />
        <Dugme velicina="lg" onClick={posalji} disabled={salje || unos.trim().length < 3} className="shrink-0">
          {salje ? t("dugme_salje") : t("dugme")}
        </Dugme>
      </div>

      <p className="mt-2 text-xs text-kolo-muted">{t("napomena")}</p>

      {poruka && (
        <Obavestenje vrsta={poruka.greska ? "greska" : "uspeh"} className="mt-2">
          {poruka.tekst}
        </Obavestenje>
      )}
    </div>
  );
}
