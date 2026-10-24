"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Pseudonim from "@/components/Pseudonim";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";

/**
 * Zaposleni pokrovitelja (donacije čl. 6a i 13g st. 6, nabavke čl. 30g st. 1).
 *
 * Korisnik koji vodi upis ovde određuje verifikovane korisnike koji u ime
 * pokrovitelja potvrđuju vaučere i opoziva ih. Ovlašćenje se vezuje za UPIS.
 * 🔴 Pseudonimi ovde su pseudonimi ZAPOSLENIH — nikad imaoca vaučera. Zaposleni ne
 * dobija ništa o ugovoru.
 */
type Zaposleni = { id: string; pseudonim: string; dodatAt: string; potvrdjeno: number };

export default function ZaposleniUpisa({ upisId }: { upisId: string }) {
  const t = useTranslations("vauceri");
  const locale = useLocale();
  const [zaposleni, setZaposleni] = useState<Zaposleni[]>([]);
  const [unos, setUnos] = useState("");
  const [radi, setRadi] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ tekst: string; ok: boolean } | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    const r = await fetch(`/api/vauceri/zaposleni?upisId=${encodeURIComponent(upisId)}`, { cache: "no-store" });
    if (!r.ok) return;
    setZaposleni((await r.json()).zaposleni ?? []);
  }, [upisId]);
  useEffect(() => { void ucitaj(); }, [ucitaj]);

  const datum = (d: string) =>
    new Date(d).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "2-digit", year: "numeric" });

  async function odredi() {
    if (!unos.trim()) return;
    setRadi("dodaj");
    setPoruka(null);
    const r = await fetch("/api/vauceri/zaposleni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upisId, pseudonim: unos.trim() }),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(null);
    if (r.ok) {
      setUnos("");
      setPoruka({ tekst: t("zaposleni_dodat"), ok: true });
      await ucitaj();
    } else setPoruka({ tekst: d.error ?? t("greska"), ok: false });
  }

  async function opozovi(z: Zaposleni) {
    if (!(await potvrdi({ poruka: t("zaposleni_opoziv_potvrda", { pseudonim: z.pseudonim }), opasno: true, dugme: t("zaposleni_opozovi") }))) return;
    setRadi(z.id);
    setPoruka(null);
    const r = await fetch(`/api/vauceri/zaposleni/${z.id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    setRadi(null);
    if (r.ok) {
      setPoruka({ tekst: t("zaposleni_opozvan"), ok: true });
      await ucitaj();
    } else setPoruka({ tekst: d.error ?? t("greska"), ok: false });
  }

  return (
    <Kartica as="section" className="space-y-3">
      {dijalog}
      <h2 className="text-lg font-semibold">{t("zaposleni_naslov")}</h2>
      <p className="text-sm text-kolo-muted">{t("zaposleni_opis")}</p>
      {poruka && (
        <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>
          {poruka.tekst}
        </Obavestenje>
      )}
      <div className="flex gap-2">
        <input
          value={unos}
          onChange={(e) => setUnos(e.target.value)}
          placeholder={t("zaposleni_placeholder")}
          aria-label={t("zaposleni_placeholder")}
          className={`${KLASE_UNOSA} min-w-0 flex-1`}
        />
        <Dugme className="min-h-11 shrink-0" onClick={odredi} disabled={radi === "dodaj" || !unos.trim()}>
          {t("zaposleni_dodaj")}
        </Dugme>
      </div>
      {zaposleni.length === 0 ? (
        <p className="text-sm text-kolo-muted bg-kolo-bg rounded-kontrola px-3 py-2">{t("zaposleni_prazno")}</p>
      ) : (
        <ul className="divide-y divide-kolo-border rounded-kontrola border border-kolo-border">
          {zaposleni.map((z) => (
            <li key={z.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-kolo-text"><Pseudonim>{z.pseudonim}</Pseudonim></p>
                <p className="text-xs text-kolo-muted">{t("zaposleni_stanje", { datum: datum(z.dodatAt), broj: z.potvrdjeno })}</p>
              </div>
              <Dugme varijanta="opasno" velicina="sm" className="shrink-0" onClick={() => opozovi(z)} disabled={radi === z.id}>
                {t("zaposleni_opozovi")}
              </Dugme>
            </li>
          ))}
        </ul>
      )}
    </Kartica>
  );
}
