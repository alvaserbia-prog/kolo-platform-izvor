"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";

/**
 * Lista osoba koje sam verifikovao, sa privatnom oznakom (nadimkom) koju mogu da
 * uredim. Oznaka je vidljiva samo meni (verifikatoru) i UO Fondacije — nije javna.
 * Pravilnik o dokazu stvarnosti, dopuna 3.9.1 (čl. 31).
 */
export type VerifikovanaOsoba = {
  verifikacijaId: string;
  korisnikId: string;
  pseudonim: string;
  oznaka: string | null;
  /**
   * POEN po ovoj potvrdi još nije upisan — čeka prvi potvrđen doprinos potvrđenog
   * člana (dokaz stvarnosti čl. 7). Takav red se obeležava bojom, da se iz spiska
   * vidi koga treba podsetiti da objavi ponudu.
   */
  cekaDoprinos?: boolean;
  /** Vrsta verifikacije (dokaz stvarnosti čl. 5a): potvrda ili uvođenje u Kolo. */
  vrsta?: "POTVRDA" | "UVODJENJE";
  /** Uvedeni je u međuvremenu potvrđen (član Kola). */
  potvrdjen?: boolean;
};

function Red({ osoba }: { osoba: VerifikovanaOsoba }) {
  const t = useTranslations("verifikacija");
  const tc = useTranslations("common");
  const [vrednost, setVrednost] = useState(osoba.oznaka ?? "");
  const [sacuvano, setSacuvano] = useState(osoba.oznaka ?? "");
  const [cuvam, setCuvam] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  const izmenjeno = vrednost.trim() !== (sacuvano ?? "").trim();

  async function sacuvaj() {
    setCuvam(true);
    setGreska(null);
    try {
      const res = await fetch("/api/verifikacija/oznaka", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ verifikacijaId: osoba.verifikacijaId, oznaka: vrednost }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGreska(data.error ?? t("greska_opsta"));
        return;
      }
      setSacuvano(data.oznaka ?? "");
      setVrednost(data.oznaka ?? "");
    } catch {
      setGreska(t("greska_mreza"));
    } finally {
      setCuvam(false);
    }
  }

  // Dve kolone na širem ekranu (ko je to | moja beleška), jedna ispod druge na
  // telefonu. Ranije je sve stajalo u jednom redu koji se lomio na slučajnim
  // mestima: oznake su skakale ispod imena, a polje se sužavalo do neupotrebljivog.
  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)] gap-2 px-4 py-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:items-center sm:gap-4 ${
        osoba.cekaDoprinos ? "bg-kolo-gold-50" : ""
      }`}
    >
      <div className="min-w-0 space-y-1">
        <Link
          href={profilHref({ id: osoba.korisnikId, pseudonim: osoba.pseudonim })}
          className={`block truncate text-sm font-semibold hover:underline ${
            osoba.cekaDoprinos ? "text-kolo-gold-700" : "text-kolo-green-700"
          }`}
        >
          @<Pseudonim>{osoba.pseudonim}</Pseudonim>
        </Link>
        {(osoba.vrsta === "UVODJENJE" || osoba.cekaDoprinos) && (
          <div className="flex flex-wrap gap-1.5">
            {osoba.vrsta === "UVODJENJE" && (
              <span className="rounded-full bg-kolo-bg border border-kolo-border px-2 py-0.5 text-xs text-kolo-muted">
                {osoba.potvrdjen ? t("oznake_uveden_potvrdjen") : t("oznake_uveden")}
              </span>
            )}
            {osoba.cekaDoprinos && (
              <span
                className="rounded-full bg-kolo-gold-200 px-2 py-0.5 text-xs font-semibold text-kolo-gold-700"
                title={t("oznake_ceka_naslov")}
              >
                {t("oznake_ceka")}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={vrednost}
          onChange={(e) => setVrednost(e.target.value)}
          maxLength={80}
          placeholder={t("oznake_ph")}
          aria-label={t("oznake_ph")}
          className="min-w-0 flex-1 min-h-10 px-3 py-2 rounded-kontrola border border-kolo-border bg-kolo-surface text-sm outline-none placeholder:text-kolo-muted focus:border-kolo-green-700 transition-colors"
        />
        <Dugme velicina="sm" onClick={sacuvaj} disabled={!izmenjeno || cuvam} className="shrink-0">
          {cuvam ? "…" : tc("sacuvaj")}
        </Dugme>
      </div>
      {greska && <span className="text-xs text-kolo-danger sm:col-span-2">{greska}</span>}
    </li>
  );
}

/**
 * `rezim="UVODJENJE"` — pogled člana bez potvrde: „Koga si uveo", uz rečenicu da
 * oni mu dolaze na spisak povezanih kad njega neko potvrdi (čl. 5d; ranije automatska potvrda lanca, čl. 5a
 * st. 5).
 */
export default function MojeOznake({
  osobe,
  rezim = "POTVRDA",
}: {
  osobe: VerifikovanaOsoba[];
  rezim?: "POTVRDA" | "UVODJENJE";
}) {
  const t = useTranslations("verifikacija");
  if (osobe.length === 0) return null;
  const uvodjenje = rezim === "UVODJENJE";
  return (
    <Kartica as="section">
      <h2 className="font-semibold text-kolo-text">
        {uvodjenje ? t("oznake_naslov_uvodjenje") : t("oznake_naslov")}
      </h2>
      <p className="mt-1 text-sm text-kolo-muted mb-4">
        {t("oznake_opis")}
        {uvodjenje && <span className="block mt-1">{t("oznake_lanac_napomena")}</span>}
      </p>
      {osobe.some((o) => o.cekaDoprinos) && (
        <Obavestenje vrsta="upozorenje" className="mb-4">
          {t("oznake_ceka_opis", { broj: osobe.filter((o) => o.cekaDoprinos).length })}
        </Obavestenje>
      )}
      <ul className="divide-y divide-kolo-border border border-kolo-border rounded-kontrola overflow-hidden">
        {osobe.map((o) => (
          <Red key={o.verifikacijaId} osoba={o} />
        ))}
      </ul>
    </Kartica>
  );
}
