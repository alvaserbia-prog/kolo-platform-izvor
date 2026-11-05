"use client";

import { useTranslations } from "next-intl";

/** „Učitavanje…" — jedna oznaka umesto ručnih `<p>{t("ucitavanje")}</p>` po stranicama. */
export default function Ucitavanje({ className = "" }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <p role="status" className={`text-sm text-kolo-muted ${className}`.trim()}>
      {t("ucitavanje")}
    </p>
  );
}
