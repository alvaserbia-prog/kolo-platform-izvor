"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Kartica from "@/components/ui/Kartica";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { useDijalog } from "@/components/ui/Dijalog";

export type IzvrsenjeZaPotvrdu = {
  id: string;
  obim: number;
  opis: string;
  createdAt: string;
  partner: string;
  usluga: string;
  jedinicaMere: string;
};

/**
 * Izvršenja partnerstva koja čekaju potvrdu lica koje je direktor ovlastio (donacije čl. 43
 * st. 1). Server proverava ovlašćenje i da potvrđivač nije podnosilac ni lice povezano sa
 * partnerom (čl. 43 st. 2).
 */
export default function PotvrdePartnerstva({ izvrsenja }: { izvrsenja: IzvrsenjeZaPotvrdu[] }) {
  const t = useTranslations("postaniPokrovitelj");
  const locale = useLocale();
  const router = useRouter();
  const { dijalog, unesi } = useDijalog();
  const [greska, setGreska] = useState<string | null>(null);
  const [radi, setRadi] = useState<string | null>(null);

  async function odluci(id: string, odluka: "potvrdi" | "odbij") {
    setGreska(null);
    let razlog = "";
    if (odluka === "odbij") {
      const r = await unesi({ poruka: t("partnerstvo_odbij_poruka"), oznaka: t("partnerstvo_odbij_oznaka"), opasno: true });
      if (r === null) return;
      razlog = r;
    }
    setRadi(id);
    const res = await fetch(`/api/pokroviteljstvo/partnerstvo/izvrsenje/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odluka, razlog }),
    });
    const d = await res.json().catch(() => ({}));
    setRadi(null);
    if (!res.ok) setGreska(d.error ?? t("forma_greska_slanja"));
    router.refresh();
  }

  return (
    <Kartica as="section" id="partnerstvo-potvrde" className="space-y-3">
      {dijalog}
      <NaslovSekcije opis={t("partnerstvo_potvrde_opis")}>{t("partnerstvo_potvrde_naslov")}</NaslovSekcije>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      <ul className="space-y-3">
        {izvrsenja.map((i) => (
          <li key={i.id} className="space-y-1 border-t border-kolo-border pt-2 text-sm">
            <p className="font-semibold text-kolo-text">{i.partner} — {i.usluga}</p>
            <p className="text-kolo-text">{i.obim.toLocaleString(intlTag(locale))} {i.jedinicaMere} — {i.opis}</p>
            <div className="flex flex-wrap gap-2">
              <Dugme velicina="sm" onClick={() => odluci(i.id, "potvrdi")} disabled={radi === i.id}>{t("partnerstvo_potvrdi")}</Dugme>
              <Dugme velicina="sm" varijanta="tiho" onClick={() => odluci(i.id, "odbij")} disabled={radi === i.id}>{t("partnerstvo_odbij")}</Dugme>
            </div>
          </li>
        ))}
      </ul>
    </Kartica>
  );
}
