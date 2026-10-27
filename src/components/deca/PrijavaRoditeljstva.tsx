"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

/**
 * Prijava lažnog roditeljstva (Pravilnik o učešću dece čl. 17 st. 1) za podnosioca
 * koji NIJE roditelj tog deteta:
 *
 *  - `dete` — maloletni učesnik prijavljuje lice upisano kao njegov roditelj
 *    (dečja početna; obaveštenje o preuzimanju naloga upućuje na ovo, čl. 11);
 *  - `trece` — bilo koji drugi učesnik, sa profila deteta, gde je veza
 *    roditelj–dete ionako javna.
 *
 * Roditelj prijavljuje drugog roditelja iz podešavanja deteta (`DeteProfil`).
 *
 * 🔴 Licu na koje se prijava odnosi podnosilac se ne otkriva (st. 3) — to drži
 * server (`prijaviRoditeljstvo`); ovaj ekran ništa ne šalje tom licu.
 */
export default function PrijavaRoditeljstva({
  deteId,
  roditelji,
  varijanta,
}: {
  deteId: string;
  roditelji: { id: string; pseudonim: string }[];
  varijanta: "dete" | "trece";
}) {
  const t = useTranslations("deca");
  const [otvoren, setOtvoren] = useState<string | null>(null);
  const [opis, setOpis] = useState("");
  const [radi, setRadi] = useState(false);
  const [poslato, setPoslato] = useState<string[]>([]);
  const [poruka, setPoruka] = useState<{ tekst: string; greska: boolean } | null>(null);
  if (roditelji.length === 0) return null;

  const dete = varijanta === "dete";

  async function posalji(roditeljId: string) {
    setRadi(true);
    setPoruka(null);
    try {
      const res = await fetch(`/api/deca/${encodeURIComponent(deteId)}/prijava-roditeljstva`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roditeljId, opis }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      setPoruka({ tekst: dete ? t("prijava_dete_uspeh") : t("prijava_uspeh"), greska: false });
      setPoslato((p) => [...p, roditeljId]);
      setOtvoren(null);
      setOpis("");
    } catch (e) {
      setPoruka({ tekst: e instanceof Error ? e.message : t("greska_slanje"), greska: true });
    } finally {
      setRadi(false);
    }
  }

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-4 shadow-kartica sm:p-6">
      <h2 className={dete ? "text-lg font-semibold text-kolo-text" : "font-semibold text-kolo-text"}>
        {dete ? t("prijava_dete_naslov") : t("prijava_trece_naslov")}
      </h2>
      <p className={`mt-1 text-kolo-muted ${dete ? "text-base" : "text-sm"}`}>
        {dete ? t("prijava_dete_opis") : t("prijava_trece_opis")}
      </p>
      <ul className="mt-3 space-y-2">
        {roditelji.map((r) => (
          <li key={r.id} className="rounded-kontrola bg-kolo-bg px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-kolo-text">
                <Pseudonim>{r.pseudonim}</Pseudonim>
              </span>
              {otvoren !== r.id && !poslato.includes(r.id) && (
                <button
                  type="button"
                  onClick={() => {
                    setOtvoren(r.id);
                    setOpis("");
                    setPoruka(null);
                  }}
                  className={`shrink-0 ${dete ? "min-h-11" : "min-h-9"} rounded-kontrola border border-kolo-border bg-kolo-surface px-3 text-sm font-semibold text-kolo-danger transition-colors hover:bg-kolo-bg`}
                >
                  {dete ? t("prijava_dete_dugme") : t("prijava_dugme")}
                </button>
              )}
            </div>
            {otvoren === r.id && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={opis}
                  onChange={(e) => setOpis(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={dete ? t("prijava_dete_polje") : t("prijava_polje")}
                  aria-label={dete ? t("prijava_dete_polje") : t("prijava_polje")}
                  className={KLASE_UNOSA}
                />
                <div className="flex flex-wrap gap-2">
                  <Dugme
                    varijanta="opasno"
                    velicina={dete ? "lg" : "md"}
                    disabled={radi || opis.trim().length < 10}
                    onClick={() => posalji(r.id)}
                  >
                    {t("prijava_posalji")}
                  </Dugme>
                  <Dugme varijanta="sekundarno" velicina={dete ? "lg" : "md"} onClick={() => setOtvoren(null)}>
                    {t("dugme_odustani")}
                  </Dugme>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {poruka && (
        <Obavestenje vrsta={poruka.greska ? "greska" : "uspeh"} className="mt-2">{poruka.tekst}</Obavestenje>
      )}
    </section>
  );
}
