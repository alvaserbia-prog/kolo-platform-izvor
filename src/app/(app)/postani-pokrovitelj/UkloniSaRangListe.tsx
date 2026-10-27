"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Dugme from "@/components/ui/Dugme";
import { useDijalog } from "@/components/ui/Dijalog";

/**
 * Zahtev korisnika koji je vodio obrisan upis da se pokrovitelj ukloni i sa
 * rang-liste (donacije čl. 18 st. 4). Bez zahteva doprinosi dati do brisanja ostaju
 * na rang-listi sa nazivom i logotipom.
 */
export default function UkloniSaRangListe({ upisId, naziv }: { upisId: string; naziv: string }) {
  const t = useTranslations("postaniPokrovitelj");
  const router = useRouter();
  const [radi, setRadi] = useState(false);
  const { dijalog, potvrdi, obavesti } = useDijalog();

  async function ukloni() {
    if (!(await potvrdi({ poruka: t("ranglista_ukloni_potvrda", { naziv }), opasno: true, dugme: t("ranglista_ukloni") }))) return;
    setRadi(true);
    const r = await fetch(`/api/pokroviteljstvo/upis/${upisId}/rang-lista`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setRadi(false);
    if (r.ok) router.refresh();
    else await obavesti(d.error ?? t("greska"));
  }

  return (
    <>
      {dijalog}
      <Dugme varijanta="sekundarno" velicina="sm" onClick={ukloni} disabled={radi}>
        {t("ranglista_ukloni")}
      </Dugme>
    </>
  );
}
