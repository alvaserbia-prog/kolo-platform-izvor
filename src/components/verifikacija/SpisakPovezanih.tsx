"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";

type Povezan = { id: string; pseudonim: string; smer: "NANIZE" | "NAVISE" };

/**
 * Spisak povezanih — na stranici Potvrde, sidro `#povezani` (Pravilnik o dokazu
 * stvarnosti čl. 17; set 4.8.3).
 *
 * Bez propova. Član Kola vidi one koje je uveo u Kolo dok je bio član bez potvrde i
 * onoga ko je njega uveo, dok su još članovi bez potvrde. Prazan spisak se ne crta.
 *
 * 🔴 Ništa se ne potvrđuje automatski: svaka osoba se označava posebno, uz izjavu da je
 * potvrđivač lično zna. Svaka označena osoba je posebna potvrda — ulazi u dnevni tempo
 * i u nadzor, bez POEN-a; potvrda uvodioca je uvek u nadzoru (st. 3).
 */
export default function SpisakPovezanih() {
  const t = useTranslations("verifikacija");
  const [lista, setLista] = useState<Povezan[] | null>(null);
  const [znam, setZnam] = useState<Record<string, boolean>>({});
  const [radi, setRadi] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ tekst: string; greska: boolean } | null>(null);

  const ucitaj = useCallback(async () => {
    try {
      const res = await fetch("/api/verifikacija/povezani", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setLista((await res.json()).povezani ?? []);
    } catch {
      setLista([]);
    }
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function potvrdi(p: Povezan) {
    setPoruka(null);
    if (!znam[p.id]) {
      setPoruka({ tekst: t("povezani_fali_izjava"), greska: true });
      return;
    }
    setRadi(p.id);
    try {
      const res = await fetch("/api/verifikacija/povezani", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: p.id, potvrdaPoznavanja: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? t("povezani_greska"));
      setPoruka({ tekst: t("povezani_uspeh", { pseudonim: p.pseudonim }), greska: false });
      await ucitaj();
    } catch (e) {
      setPoruka({ tekst: e instanceof Error ? e.message : t("povezani_greska"), greska: true });
    } finally {
      setRadi(null);
    }
  }

  if (!lista || lista.length === 0) return poruka ? <Obavestenje vrsta={poruka.greska ? "greska" : "uspeh"}>{poruka.tekst}</Obavestenje> : null;

  return (
    <section id="povezani" className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica scroll-mt-20">
      <h2 className="font-semibold text-kolo-text">{t("povezani_naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("povezani_opis")}</p>
      <ul className="mt-3 space-y-3">
        {lista.map((p) => (
          <li key={p.id} className="rounded-kontrola bg-kolo-bg p-4">
            <p className="text-sm text-kolo-text">
              <span className="font-semibold">@{p.pseudonim}</span>{" "}
              <span className="text-kolo-muted">
                {p.smer === "NAVISE" ? t("povezani_smer_navise") : t("povezani_smer_nanize")}
              </span>
            </p>
            <label className="mt-2 flex items-start gap-2 text-sm text-kolo-text">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={!!znam[p.id]}
                onChange={(e) => setZnam((z) => ({ ...z, [p.id]: e.target.checked }))}
              />
              <span>{t("povezani_izjava", { pseudonim: p.pseudonim })}</span>
            </label>
            <Dugme disabled={radi !== null} onClick={() => potvrdi(p)} className="mt-3">
              {t("povezani_dugme")}
            </Dugme>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-kolo-muted">{t("povezani_napomena")}</p>
      {poruka && (
        <Obavestenje vrsta={poruka.greska ? "greska" : "uspeh"} className="mt-2">{poruka.tekst}</Obavestenje>
      )}
    </section>
  );
}
