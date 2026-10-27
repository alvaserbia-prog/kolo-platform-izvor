"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AKT_USLOVI, AKT_POLITIKA } from "@/lib/verzije-akata";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";
import Obavestenje from "@/components/ui/Obavestenje";

/** „4.7.2" naspram „4.7.6" — poredi brojeve po delovima, ne kao tekst. */
function novijaVerzija(a: string, b: string): string {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? a : b;
  }
  return a;
}

type Verzija = { id: string; verzija: string; naslov: string; efektivnaOd: string; _count: { pristanci: number } };

/**
 * Admin tab „Politika" — kada se od korisnika traži pristanak na nove akte.
 *
 * 🔴 Bump akata NE traži pristanak sam po sebi: ekran „Sistem je unapređen — novi
 * akti" pojavljuje se tek kad ovde nastane nova verzija (`pristanakStatus()` poredi
 * poslednju verziju sa prihvaćenom). Odluku donosi vlasnik — ne za svaki bump,
 * nego kad izmena to traži (nova obrada podataka, uže ili šire pravo). Samo
 * superadmin.
 */
export default function PolitikaTab() {
  const t = useTranslations("admin");
  const [verzije, setVerzije] = useState<Verzija[]>([]);
  const [ucitava, setUcitava] = useState(true);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);
  // Predlog je NOVIJA od dve verzije (Uslovi, Politika) — do seta 4.7.7 je pri
  // razlici uvek predlagao Uslove, pa i kad je Politika bila novija.
  const predlog = novijaVerzija(AKT_USLOVI.verzija, AKT_POLITIKA.verzija);
  const [verzija, setVerzija] = useState(predlog);
  const [naslov, setNaslov] = useState(`Akti KOLO sistema ${predlog}`);
  const [obavesti, setObavesti] = useState(true);
  // Dan stupanja na snagu (GGGG-MM-DD); prazno = od trenutka upisa. Sme u budućnost
  // (Uslovi čl. 43 st. 3, Pravilnik čl. 57 st. 2) — proveru radi server.
  const [efektivnaOd, setEfektivnaOd] = useState("");
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    const res = await fetch("/api/admin/politika", { cache: "no-store" });
    if (res.ok) setVerzije(await res.json());
    setUcitava(false);
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function zatrazi() {
    const poruka = efektivnaOd
      ? t("pol_potvrda_od", { verzija, datum: new Date(efektivnaOd + "T12:00:00").toLocaleDateString("sr-RS") })
      : t("pol_potvrda", { verzija });
    if (!(await potvrdi({ poruka, dugme: t("pol_dugme") }))) return;
    setRadi(true);
    setGreska(null);
    setPoruka(null);
    try {
      const res = await fetch("/api/admin/politika", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verzija, naslov, obavesti, ...(efektivnaOd ? { efektivnaOd } : {}) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.error ?? t("pol_greska"));
        return;
      }
      setPoruka(t("pol_uspeh", { verzija, n: d.obavesteno ?? 0 }));
      await ucitaj();
    } finally {
      setRadi(false);
    }
  }

  if (ucitava) return <p className="text-sm text-kolo-muted">{t("pol_ucitavanje")}</p>;

  // Na snazi je poslednja verzija čiji je dan stupanja prošao; one upisane unapred
  // stoje u istoriji sa oznakom „stupa na snagu".
  const sada = Date.now();
  const poslednja = verzije.find((v) => new Date(v.efektivnaOd).getTime() <= sada);
  const polje = KLASE_UNOSA + " mt-1";

  return (
    <div className="space-y-5">
      {dijalog}
      <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
        <h3 className="font-semibold">{t("pol_naslov")}</h3>
        <p className="mt-1 text-sm text-kolo-muted">{t("pol_uvod")}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <dt className="text-kolo-muted">{t("pol_akti_sada")}</dt>
          <dd className="font-medium">
            {t("pol_uslovi_politika", { uslovi: AKT_USLOVI.verzija, politika: AKT_POLITIKA.verzija })}
          </dd>
          <dt className="text-kolo-muted">{t("pol_trazi_se")}</dt>
          <dd className="font-medium">{poslednja ? poslednja.verzija : "—"}</dd>
        </dl>
        {/* Samo upozorenje: da li se traži pristanak na noviju verziju odlučuje
            vlasnik ispod. Učesnik inače u prozoru za pristanak vidi dva broja. */}
        {poslednja && poslednja.verzija !== predlog && (
          <Obavestenje vrsta="upozorenje" className="mt-3">
            {t("pol_razilazenje", { trazi: poslednja.verzija, sajt: predlog })}
          </Obavestenje>
        )}
      </section>

      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      {poruka && <Obavestenje vrsta="uspeh">{poruka}</Obavestenje>}

      <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
        <h3 className="font-semibold">{t("pol_nova_naslov")}</h3>
        <p className="mt-1 text-xs text-kolo-muted">{t("pol_nova_opis")}</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <label className="block text-sm font-medium text-kolo-text">
            {t("pol_verzija")}
            <input className={polje} value={verzija} onChange={(e) => setVerzija(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-kolo-text">
            {t("pol_naslov_polje")}
            <input className={polje} value={naslov} onChange={(e) => setNaslov(e.target.value)} />
          </label>
          <label className="block text-sm font-medium text-kolo-text">
            {t("pol_efektivna_od")}
            <input type="date" className={polje} value={efektivnaOd} onChange={(e) => setEfektivnaOd(e.target.value)} />
          </label>
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input type="checkbox" checked={obavesti} onChange={(e) => setObavesti(e.target.checked)} />
          <span>{t("pol_obavesti")}</span>
        </label>
        <button
          onClick={zatrazi}
          disabled={radi || !verzija.trim() || !naslov.trim()}
          className={klaseDugmeta() + " mt-3"}
        >
          {t("pol_dugme")}
        </button>
      </section>

      <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
        <h3 className="font-semibold">{t("pol_istorija")}</h3>
        {verzije.length === 0 ? (
          <p className="mt-2 text-sm text-kolo-muted">—</p>
        ) : (
          <ul className="mt-2 divide-y divide-kolo-border text-sm">
            {verzije.map((v) => (
              <li key={v.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <span className="font-medium">{v.verzija}</span> — {v.naslov}
                  {new Date(v.efektivnaOd).getTime() > sada && (
                    <span className="ml-2 text-xs text-kolo-muted">
                      ({t("pol_buduca", { datum: new Date(v.efektivnaOd).toLocaleDateString("sr-RS") })})
                    </span>
                  )}
                </span>
                <span className="text-kolo-muted">
                  {new Date(v.efektivnaOd).toLocaleDateString("sr-RS")} · {t("pol_pristalo", { n: v._count.pristanci })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
