"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import { useTranslations } from "next-intl";
import type { TackaGazdinstva } from "@/components/MapaGazdinstava";

const MapaGazdinstava = dynamic(() => import("@/components/MapaGazdinstava"), { ssr: false });

/** Omotač javne mape — prevodi tekst oblačića u pretraživaču. */
export default function MapaJavna({ tacke, visina }: { tacke: TackaGazdinstva[]; visina?: number }) {
  const t = useTranslations("gazdinstva");
  const tekstOglasa = useCallback((n: number) => t("oglasa_n", { n }), [t]);
  return <MapaGazdinstava tacke={tacke} visina={visina} tekstOglasa={tekstOglasa} />;
}
