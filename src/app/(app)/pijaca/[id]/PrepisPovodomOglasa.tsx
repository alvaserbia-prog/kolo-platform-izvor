"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { klaseDugmeta } from "@/components/ui/Dugme";

/**
 * „Prepiši POEN" uz oglas — prečica do postojećeg prepisa na ekranu POEN
 * (`/novcanik?plati=…`), isti tok kao QR oglašivača. Prepis ne ide kroz oglas i
 * ne zavisi od njega; dugme samo popunjava primaoca i opis.
 *
 * 🔴 Pre prepisa stoji upozorenje: prepis je konačan, ne donosi stvar sam po sebi,
 * dogovara se sa oglašivačem, a problem ide u prijavu razmene. Reč „plaćanje" i
 * „kupovina" se ne koriste (POEN nije platno sredstvo). „Ne prikazuj više" pamti
 * se SAMO na uređaju (odluka vlasnika 27.10.2026) — na novom uređaju upozorenje
 * se pojavi ponovo, i to je namerno.
 *
 * Iznos se upisuje samo kad oglas ima jednu tačnu cenu; kod raspona i „po
 * dogovoru" polje ostaje prazno, jer iznos određuju strane, ne platforma.
 */
const KLJUC_SKRIVENO = "prepis-oglas-upozorenje-skriveno";

export default function PrepisPovodomOglasa({
  pseudonim,
  naslov,
  iznos,
}: {
  pseudonim: string;
  naslov: string;
  /** Tačna cena oglasa; `null` za raspon i „po dogovoru". */
  iznos: number | null;
}) {
  const t = useTranslations("pijaca");
  const tc = useTranslations("common");
  const router = useRouter();
  const id = useId();
  const [otvoren, setOtvoren] = useState(false);
  const [nePrikazuj, setNePrikazuj] = useState(false);
  const dugmeRef = useRef<HTMLButtonElement | null>(null);

  const params = new URLSearchParams({ plati: pseudonim, description: naslov });
  if (iznos != null) params.set("iznos", String(iznos));
  const putanja = `/novcanik?${params.toString()}`;

  function naKlik() {
    let skriveno = false;
    try {
      skriveno = localStorage.getItem(KLJUC_SKRIVENO) === "1";
    } catch {
      // Blokirano skladište — upozorenje se tada uvek prikazuje.
    }
    if (skriveno) router.push(putanja);
    else setOtvoren(true);
  }

  function nastavi() {
    if (nePrikazuj) {
      try {
        localStorage.setItem(KLJUC_SKRIVENO, "1");
      } catch {
        // Ne pamti se — sledeći put upozorenje opet stoji.
      }
    }
    setOtvoren(false);
    router.push(putanja);
  }

  useEffect(() => {
    if (!otvoren) return;
    dugmeRef.current?.focus();
    const naTaster = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOtvoren(false);
    };
    window.addEventListener("keydown", naTaster);
    return () => window.removeEventListener("keydown", naTaster);
  }, [otvoren]);

  return (
    <>
      <button type="button" onClick={naKlik} className={klaseDugmeta({ varijanta: "sekundarno" }) + " w-full"}>
        {t("prepisi_poen")}
      </button>

      {otvoren && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setOtvoren(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-naslov`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-kolo-surface p-5 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id={`${id}-naslov`} className="text-base font-semibold text-kolo-text">
                {t("prepis_upozorenje_naslov")}
              </h2>
              <button
                type="button"
                onClick={() => setOtvoren(false)}
                aria-label={tc("zatvori")}
                className="-mt-1 -mr-1 h-8 w-8 shrink-0 rounded-full text-kolo-muted hover:bg-kolo-bg"
              >
                ✕
              </button>
            </div>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-kolo-text">
              <li>{t("prepis_upozorenje_konacan")}</li>
              <li>{t("prepis_upozorenje_dogovor")}</li>
              <li>{t("prepis_upozorenje_preuzimanje")}</li>
              <li>{t("prepis_upozorenje_prijava")}</li>
            </ul>
            <label className="flex items-center gap-2 text-sm text-kolo-text">
              <input
                type="checkbox"
                checked={nePrikazuj}
                onChange={(e) => setNePrikazuj(e.target.checked)}
                className="h-4 w-4 accent-kolo-green-700"
              />
              {t("prepis_upozorenje_ne_prikazuj")}
            </label>
            <button ref={dugmeRef} type="button" onClick={nastavi} className={klaseDugmeta() + " w-full"}>
              {t("prepis_upozorenje_dalje")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
