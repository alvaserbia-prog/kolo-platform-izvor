"use client";

/**
 * Preporuka člana na profilu (dokaz stvarnosti čl. 20, set 4.8.0).
 *
 * Prikazuje samo BROJ preporuka i, kad posmatrač sme, dugme „Preporučujem ga" /
 * „Povuci preporuku". 🔴 Ko je preporučio se ne prikazuje (Politika 4.16), a dugme
 * „Ne verujem" ne postoji (odluka vlasnika). Odluku da li sme donosi server.
 */
import { useState } from "react";
import { useTranslations } from "next-intl";
import Dugme from "@/components/ui/Dugme";

type Stanje = { broj: number; moja: boolean; smem: boolean };

export default function PreporukaRed({ adresa, pocetno }: { adresa: string; pocetno: Stanje }) {
  const t = useTranslations("profil");
  const [stanje, setStanje] = useState<Stanje>(pocetno);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  async function prebaci() {
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(`/api/preporuke/${encodeURIComponent(adresa)}`, {
        method: stanje.moja ? "DELETE" : "POST",
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) {
        setGreska(d?.error ?? t("preporuka_greska"));
        return;
      }
      setStanje(d as Stanje);
    } finally {
      setRadi(false);
    }
  }

  return (
    <div className="flex justify-between items-center gap-2">
      <dt className="text-kolo-muted">{t("preporuke")}</dt>
      <dd className="text-right flex items-center gap-2">
        <strong className="text-kolo-text">{stanje.broj}</strong>
        {(stanje.smem || stanje.moja) && (
          <Dugme
            onClick={prebaci}
            disabled={radi}
            velicina="sm"
            varijanta={stanje.moja ? "sekundarno" : "primarno"}
          >
            {stanje.moja ? t("preporuka_povuci") : t("preporuka_daj")}
          </Dugme>
        )}
        {greska && <span className="block text-xs text-kolo-danger">{greska}</span>}
      </dd>
    </div>
  );
}
