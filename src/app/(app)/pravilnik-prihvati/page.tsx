"use client";

import { useState, useEffect } from "react";
import { intlTag } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";

interface Verzija {
  id: string;
  verzija: string;
  naslov: string;
  efektivnaOd: string;
}

export default function PravilnikPrihvatiPage() {
  const locale = useLocale();
  const t = useTranslations("pravilnikPrihvati");
  const router = useRouter();
  const [verzija, setVerzija] = useState<Verzija | null>(null);
  const [loading, setLoading] = useState(true);
  const [prihvatanje, setPrihvatanje] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/pravilnik/prihvati")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.potrebno) {
          router.replace("/sistem");
          return;
        }
        setVerzija(data.verzija);
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [router]);

  async function prihvati() {
    if (!verzija) return;
    setPrihvatanje(true);
    setError("");
    const res = await fetch("/api/pravilnik/prihvati", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verzijaId: verzija.id }),
    });
    if (!res.ok) {
      setError(t("greska_prihvatanje"));
      setPrihvatanje(false);
      return;
    }
    router.replace("/sistem");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-kolo-bg">
        <p className="text-kolo-muted text-sm">{t("ucitavanje")}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-kolo-bg p-4">
      <Kartica padding="lg" className="max-w-md w-full">
        <div className="mb-6">
          <h1 className="kolo-naslov mb-2">{t("naslov")}</h1>
          {verzija && (
            <p className="text-sm text-kolo-muted">
              {t("verzija_label")} <strong>{verzija.verzija}</strong>: {verzija.naslov}<br />
              {t("na_snazi_od")} <strong>{new Date(verzija.efektivnaOd).toLocaleDateString(intlTag(locale))}</strong>
            </p>
          )}
        </div>

        <p className="text-sm text-kolo-text mb-4">
          {t("opis")}
        </p>

        <p className="text-sm text-kolo-muted mb-6">
          {t("procitajte_na")}{" "}
          <Link href="/pravilnik" target="_blank" className="text-kolo-green-700 underline">
            {t("ovoj_stranici")}
          </Link>
          {t("ne_slazete_se")}
        </p>

        {error && (
          <Obavestenje vrsta="greska" className="mb-4">{error}</Obavestenje>
        )}

        <Dugme velicina="lg" punaSirina onClick={prihvati} disabled={prihvatanje}>
          {prihvatanje ? t("dugme_prihvatam_loading") : t("dugme_prihvatam")}
        </Dugme>
      </Kartica>
    </div>
  );
}
