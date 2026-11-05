"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { MAX_POTVRDA_BAJTOVA } from "@/lib/donacija-unapred-pravila";

/**
 * Slanje potvrde o uplati (Pravilnik o pokroviteljstvu i donacijama čl. 6 st. 4, set 5.0.9).
 * Slika se pre slanja smanjuje i pretvara u JPEG u pretraživaču (i HEIC sa iPhone-a, koji
 * pretraživač ume da prikaže), pa server dobija čitljivu sliku od najviše ~2 MB. PDF ide
 * kakav jeste. Platforma potvrdu čita na našem serveru, bez spoljnog servisa.
 */

type Ishod =
  | { stanje: "UNAPRED"; poen: number }
  | { stanje: "CEKA_FONDACIJU"; razlogBezUnapred: string }
  | { stanje: "ODBIJENA"; razlog: string };

async function pripremi(fajl: File): Promise<Blob> {
  if (fajl.type === "application/pdf") return fajl;
  const url = URL.createObjectURL(fajl);
  try {
    const slika = await new Promise<HTMLImageElement>((ok, ne) => {
      const s = new Image();
      s.onload = () => ok(s);
      s.onerror = ne;
      s.src = url;
    });
    const max = 2200;
    const k = Math.min(1, max / Math.max(slika.width, slika.height));
    const c = document.createElement("canvas");
    c.width = Math.round(slika.width * k);
    c.height = Math.round(slika.height * k);
    c.getContext("2d")!.drawImage(slika, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, ne) => c.toBlob((b) => (b ? ok(b) : ne(new Error("jpeg"))), "image/jpeg", 0.9));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PosaljiPotvrdu({
  donationId,
  url = "/api/donacije/potvrda",
  onGotovo,
}: {
  /** Zapis donacije, odnosno prijave pokroviteljstva (tada `url` nosi id prijave). */
  donationId: string;
  url?: string;
  onGotovo: () => void;
}) {
  const t = useTranslations("donacije");
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState<{ vrsta: "uspeh" | "info" | "greska"; tekst: string } | null>(null);

  async function izabran(e: React.ChangeEvent<HTMLInputElement>) {
    const fajl = e.target.files?.[0];
    e.target.value = "";
    if (!fajl) return;
    setPoruka(null);
    setRadi(true);
    try {
      const blob = await pripremi(fajl);
      if (blob.size > MAX_POTVRDA_BAJTOVA) {
        setPoruka({ vrsta: "greska", tekst: t("potvrda_prevelika") });
        return;
      }
      const forma = new FormData();
      forma.append("donationId", donationId);
      forma.append("fajl", blob, fajl.type === "application/pdf" ? "potvrda.pdf" : "potvrda.jpg");
      const r = await fetch(url, { method: "POST", body: forma });
      const j = (await r.json().catch(() => ({}))) as Ishod & { error?: string };
      if (!r.ok) {
        setPoruka({ vrsta: "greska", tekst: j.error ?? t("potvrda_greska") });
        return;
      }
      if (j.stanje === "UNAPRED") {
        setPoruka({ vrsta: "uspeh", tekst: t("potvrda_unapred", { poen: j.poen }) });
        onGotovo();
      } else if (j.stanje === "CEKA_FONDACIJU") {
        setPoruka({ vrsta: "info", tekst: t("potvrda_ceka_fondaciju") });
        onGotovo();
      } else {
        setPoruka({ vrsta: "greska", tekst: t(`potvrda_odbijena_${j.razlog.toLowerCase()}`) });
      }
    } catch {
      setPoruka({ vrsta: "greska", tekst: t("potvrda_greska") });
    } finally {
      setRadi(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="sr-only">{t("potvrda_dugme")}</span>
        <input type="file" accept="application/pdf,image/*" onChange={izabran} disabled={radi} className="hidden" id={`potvrda-${donationId}`} />
        <Dugme punaSirina disabled={radi} onClick={() => document.getElementById(`potvrda-${donationId}`)?.click()}>
          {radi ? t("potvrda_citam") : t("potvrda_dugme")}
        </Dugme>
      </label>
      <p className="text-xs text-kolo-muted">{t("potvrda_uputstvo")}</p>
      {poruka && <Obavestenje vrsta={poruka.vrsta}>{poruka.tekst}</Obavestenje>}
    </div>
  );
}
