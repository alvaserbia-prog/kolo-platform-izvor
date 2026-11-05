"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { profilHref } from "@/lib/profil-link";
import { KLASE_TABELE, KLASE_ZAGLAVLJA, KLASE_REDA, klaseTh, klaseTd } from "./tabela";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";
import Obavestenje from "@/components/ui/Obavestenje";

type Zapis = {
  id: string;
  otvorenoAt: string;
  otvorio: { id: string; pseudonim: string };
  pozvani: { id: string; pseudonim: string };
};

/**
 * „Ko je otvorio ime i broj" — zapis otvaranja poziva sa spiska za poziv (dokaz
 * stvarnosti čl. 10 st. 4; radnja br. 24). Samo superadmin
 * (ruta odbija ostale, pa se tada ne prikazuje ništa). Bez propova; ugrađuje se u
 * `NadzorTab`.
 *
 * 🔴 Zapis nosi samo pseudonime i vreme — nikad ime ni broj.
 */
export default function ZapisiOtvaranja() {
  const t = useTranslations("admin");
  const [zapisi, setZapisi] = useState<Zapis[] | null>(null);
  const [zabranjeno, setZabranjeno] = useState(false);
  const [greska, setGreska] = useState(false);
  const [upit, setUpit] = useState("");

  const ucitaj = useCallback(async (pseudonim: string) => {
    setGreska(false);
    const q = pseudonim.trim() ? `?pseudonim=${encodeURIComponent(pseudonim.trim())}` : "";
    const r = await fetch(`/api/admin/zapisi-otvaranja${q}`, { cache: "no-store" });
    if (r.status === 403) {
      setZabranjeno(true);
      return;
    }
    if (!r.ok) {
      setGreska(true);
      return;
    }
    const d = await r.json();
    setZapisi(d.zapisi ?? []);
  }, []);

  useEffect(() => {
    void ucitaj("");
  }, [ucitaj]);

  if (zabranjeno) return null;

  return (
    <Kartica className="space-y-3">
      <NaslovSekcije nivo={3}>{t("zapisi_otvaranja_naslov")}</NaslovSekcije>
      <p className="text-xs text-kolo-muted">{t("zapisi_otvaranja_opis")}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ucitaj(upit);
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={upit}
          onChange={(e) => setUpit(e.target.value)}
          placeholder={t("zapisi_otvaranja_pretraga")}
          aria-label={t("zapisi_otvaranja_pretraga")}
          className="flex-1 min-w-[12rem] px-3 py-2 rounded-kontrola border border-kolo-border text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
        />
        <button
          type="submit"
          className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
        >
          {t("zapisi_otvaranja_trazi")}
        </button>
      </form>
      {greska && <Obavestenje vrsta="greska">{t("zapisi_otvaranja_greska")}</Obavestenje>}
      {zapisi === null ? null : zapisi.length === 0 ? (
        <p className="text-sm text-kolo-muted">{t("zapisi_otvaranja_prazno")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className={KLASE_TABELE}>
            <thead>
              <tr className={KLASE_ZAGLAVLJA}>
                <th className={klaseTh()}>{t("zapisi_otvaranja_vreme")}</th>
                <th className={klaseTh()}>{t("zapisi_otvaranja_otvorio")}</th>
                <th className={klaseTh()}>{t("zapisi_otvaranja_pozvani")}</th>
              </tr>
            </thead>
            <tbody>
              {zapisi.map((z) => (
                <tr key={z.id} className={KLASE_REDA}>
                  <td className={`${klaseTd()} tabular-nums whitespace-nowrap`}>
                    {new Date(z.otvorenoAt).toLocaleString("sr-RS")}
                  </td>
                  <td className={klaseTd()}>
                    <Link href={profilHref(z.otvorio)} className="text-kolo-green-700 hover:underline">
                      {z.otvorio.pseudonim}
                    </Link>
                  </td>
                  <td className={klaseTd()}>
                    <Link href={profilHref(z.pozvani)} className="text-kolo-green-700 hover:underline">
                      {z.pozvani.pseudonim}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Kartica>
  );
}
