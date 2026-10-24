"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";

type Zahtev = { id: string; roditelj: string; trazeno: string | null };

/**
 * Zahtevi za potvrdu postojanja deteta — na stranici Potvrde, sidro
 * `#postojanje-deteta` (Pravilnik o učešću dece čl. 6 st. 3–6; set 4.8.2).
 *
 * Bez propova. Vidi ga SAMO član Kola ili osnivač: ruta drugima vraća 403, pa se
 * komponenta tada ne crta. 🔴 Svaki zahtev nosi ISKLJUČIVO pseudonim roditelja —
 * ni pseudonim, ni uzrast, ni pol, ni školu deteta (čl. 6 st. 3). Sopstveni zahtevi
 * i zahtevi za decu kojoj je posmatrač roditelj se ne prikazuju (drugi roditelj
 * potvrdu ne daje, st. 4).
 *
 * Potvrda mora biti izričita (kućica „Lično znam…"): ko potvrdi dete koje ne
 * postoji odgovara kao za lažnu verifikaciju (st. 6). Bez POEN-a ikome (st. 5).
 */
export default function ZahteviPostojanjaDeteta() {
  const t = useTranslations("deca");
  const [zahtevi, setZahtevi] = useState<Zahtev[] | null>(null);
  const [skriven, setSkriven] = useState(false);
  const [potvrda, setPotvrda] = useState<Record<string, boolean>>({});
  const [radi, setRadi] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ tekst: string; greska: boolean } | null>(null);

  const ucitaj = useCallback(async () => {
    try {
      const res = await fetch("/api/deca/potvrde", { cache: "no-store" });
      if (res.status === 401 || res.status === 403) return setSkriven(true);
      if (!res.ok) throw new Error();
      setZahtevi((await res.json()).zahtevi ?? []);
    } catch {
      setPoruka({ tekst: t("greska_ucitavanje"), greska: true });
    }
  }, [t]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function potvrdi(id: string) {
    setPoruka(null);
    // Dugme se ne gasi dok izjava nije označena — klik kaže šta fali.
    if (!potvrda[id]) { setPoruka({ tekst: t("zahtevi_fali_izjava"), greska: true }); return; }
    setRadi(id);
    try {
      const res = await fetch(`/api/deca/potvrde/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ izjava: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      setPoruka({ tekst: t("zahtevi_uspeh"), greska: false });
      await ucitaj();
    } catch (e) {
      setPoruka({ tekst: e instanceof Error ? e.message : t("greska_slanje"), greska: true });
    } finally {
      setRadi(null);
    }
  }

  if (skriven) return null;

  return (
    <section id="postojanje-deteta" className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
      <h2 className="font-semibold text-kolo-text">{t("zahtevi_naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("zahtevi_opis")}</p>

      {zahtevi === null && !poruka && <p className="mt-3 text-sm text-kolo-muted">{t("ucitavanje")}</p>}
      {zahtevi && zahtevi.length === 0 && <p className="mt-3 text-sm text-kolo-muted">{t("zahtevi_prazno")}</p>}

      {zahtevi && zahtevi.length > 0 && (
        <ul className="mt-3 space-y-3">
          {zahtevi.map((z) => (
            <li key={z.id} className="rounded-kontrola bg-kolo-bg p-4">
              <p className="text-sm text-kolo-text">{t("zahtevi_stavka", { pseudonim: z.roditelj })}</p>
              <label className="mt-2 flex items-start gap-2 text-sm text-kolo-text">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!potvrda[z.id]}
                  onChange={(e) => setPotvrda((p) => ({ ...p, [z.id]: e.target.checked }))}
                />
                <span>{t("zahtevi_izjava", { pseudonim: z.roditelj })}</span>
              </label>
              <Dugme
                disabled={radi !== null}
                onClick={() => potvrdi(z.id)}
                className="mt-3"
              >
                {t("zahtevi_dugme")}
              </Dugme>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-kolo-muted">{t("zahtevi_napomena")}</p>
      {poruka && (
        <Obavestenje vrsta={poruka.greska ? "greska" : "uspeh"} className="mt-2">{poruka.tekst}</Obavestenje>
      )}
    </section>
  );
}
