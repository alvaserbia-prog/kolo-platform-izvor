"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { filtriraj, type FilterMape, type TackaMape } from "@/lib/mapa-pravila";
import type { TekstoviMape } from "@/components/MapaDomacih";
import Segmenti from "@/components/ui/Segmenti";

const MapaDomacih = dynamic(() => import("@/components/MapaDomacih"), { ssr: false });

/**
 * Jedna javna mapa gazdinstava i pokrovitelja (Pravilnik o gazdinstvima čl. 19) sa
 * filterom Sve / Gazdinstva / Firme. Tekst kartice se prevodi u pretraživaču.
 */
export default function MapaZajednicka({ tacke, prijavljen }: { tacke: TackaMape[]; prijavljen: boolean }) {
  const t = useTranslations("gazdinstva");
  const [filter, setFilter] = useState<FilterMape>("SVE");
  const vidljive = useMemo(() => filtriraj(tacke, filter), [tacke, filter]);
  const tekstovi: TekstoviMape = useMemo(
    () => ({
      domace: t("mapa_domace"),
      pijaca: t("mapa_pijaca"),
      vauceri: (n: number) => t("mapa_vauceri_n", { n }),
      nemaVaucera: t("mapa_nema_vaucera"),
      preuzmi: t("mapa_preuzmi_vaucer"),
      prijaviSe: t("mapa_prijavi_se_vaucer"),
      grupa: (n: number) => t("mapa_grupa_n", { n }),
    }),
    [t],
  );
  const CIPOVI: { k: FilterMape; tekst: string }[] = [
    { k: "SVE", tekst: t("mapa_filter_sve") },
    { k: "GAZDINSTVA", tekst: t("mapa_filter_gazdinstva") },
    { k: "FIRME", tekst: t("mapa_filter_firme") },
  ];
  return (
    <div className="space-y-2">
      <Segmenti
        oznaka={t("mapa_filter_oznaka")}
        opcije={CIPOVI.map((c) => ({ vrednost: c.k, oznaka: c.tekst }))}
        vrednost={filter}
        onPromena={setFilter}
      />
      <MapaDomacih tacke={vidljive} prijavljen={prijavljen} tekstovi={tekstovi} />
    </div>
  );
}
