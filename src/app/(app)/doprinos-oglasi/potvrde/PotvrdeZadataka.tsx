"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { intlTag } from "@/lib/format";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import NaslovStranice from "@/components/ui/NaslovStranice";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Pseudonim from "@/components/Pseudonim";
import { rokProsao } from "@/lib/operativni-pravila";

type Prijava = { id: string; pseudonim: string; oglasId: string; naslov: string; plan: string | null; uslov: string | null; ispunjenost: string | null; rok: string };
type Izvrsenje = { id: string; pseudonim: string; oglasId: string; naslov: string; zadruzni: boolean; obustavljeno: boolean; datum: string; celina: number | null; predlozeniPoen: number; opis: string; dokaz: string | null; rok: string };
type Zavrsna = { id: string; pseudonim: string; oglasId: string; naslov: string; saCelinama: boolean; rok: string };
type Primedba = { id: string; oglasId: string; naslov: string; predmet: string; tekst: string; rok: string };

/**
 * Ekran lica koje potvrđuje (operativni 5.0 čl. 12, 13, 15, 16, 18). Server proverava
 * ulogu i sukob interesa pri svakoj odluci (`operativni-postupak.ts`); ekran samo
 * nudi radnje. Odbijanje, uslovna potvrda i završna odluka osim „izvršen" traže
 * obrazloženje.
 */
export default function PotvrdeZadataka({ prijave, izvrsenja, zavrsne, primedbe }: { prijave: Prijava[]; izvrsenja: Izvrsenje[]; zavrsne: Zavrsna[]; primedbe: Primedba[] }) {
  const t = useTranslations("doprinosOglasi");
  const locale = useLocale();
  const router = useRouter();
  const [poruke, setPoruke] = useState<Record<string, { text: string; ok: boolean }>>({});
  const [obrazlozenja, setObrazlozenja] = useState<Record<string, string>>({});
  const [celine, setCeline] = useState<Record<string, string>>({});
  const [radi, setRadi] = useState<string | null>(null);
  const datum = (d: string) => new Date(d).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "short", year: "numeric" });

  async function posalji(kljuc: string, putanja: string, telo: unknown) {
    setRadi(kljuc);
    try {
      const res = await fetch(putanja, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(telo) });
      const d = await res.json().catch(() => ({}));
      setPoruke((p) => ({ ...p, [kljuc]: { text: res.ok ? t("potvrde_upisano") : d.error ?? t("greska"), ok: res.ok } }));
      if (res.ok) setTimeout(() => router.refresh(), 800);
    } finally {
      setRadi(null);
    }
  }

  const rokOznaka = (rok: string) => (
    <span className={`text-xs ${rokProsao(rok) ? "text-kolo-danger" : "text-kolo-muted"}`}>
      {rokProsao(rok) ? t("potvrde_rok_prosao", { datum: datum(rok) }) : t("potvrde_rok", { datum: datum(rok) })}
    </span>
  );
  const obrazlozenjePolje = (k: string) => (
    <textarea rows={2} className={`${KLASE_UNOSA} resize-none`} placeholder={t("potvrde_obrazlozenje")} aria-label={t("potvrde_obrazlozenje")}
      value={obrazlozenja[k] ?? ""} onChange={(e) => setObrazlozenja((o) => ({ ...o, [k]: e.target.value }))} />
  );
  const poruka = (k: string) => (poruke[k] ? <Obavestenje vrsta={poruke[k].ok ? "uspeh" : "greska"}>{poruke[k].text}</Obavestenje> : null);
  const zadatakLink = (id: string, naslov: string) => (
    <Link href={`/doprinos-oglasi/${id}`} className="text-sm font-semibold text-kolo-text hover:text-kolo-green-700">{naslov}</Link>
  );
  const nista = prijave.length + izvrsenja.length + zavrsne.length + primedbe.length === 0;

  return (
    <div className="space-y-6">
      <NaslovStranice nazad={{ href: "/doprinos-oglasi", oznaka: t("naslov") }} naslov={t("potvrde_naslov")} opis={t("potvrde_opis")} />
      {nista && <Kartica padding="nema"><PraznoStanje naslov={t("potvrde_nista")} /></Kartica>}

      {izvrsenja.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t("potvrde_izvrsenja")}</h2>
          {izvrsenja.map((e) => (
            <Kartica key={e.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {zadatakLink(e.oglasId, e.naslov)}
                {rokOznaka(e.rok)}
              </div>
              <p className="text-sm"><Pseudonim>{e.pseudonim}</Pseudonim> · {datum(e.datum)}{e.celina != null ? ` · ${t("ev_celina", { broj: e.celina })}` : ""} · {t("ev_iznos_predlozeno", { iznos: e.predlozeniPoen.toLocaleString(intlTag(locale)) })}</p>
              {e.zadruzni && <p className="text-xs text-kolo-muted">{t("potvrde_zadruzni")}</p>}
              <p className="text-xs text-kolo-muted whitespace-pre-line">{e.opis}</p>
              {e.dokaz && /^https?:\/\//.test(e.dokaz) && <a href={e.dokaz} target="_blank" rel="noopener noreferrer" className="text-xs underline break-all">{t("dokaz_label")}</a>}
              {e.obustavljeno ? <Obavestenje vrsta="upozorenje">{t("obustavljeno")}</Obavestenje> : (
                <>
                  {obrazlozenjePolje(e.id)}
                  <div className="flex flex-wrap gap-2">
                    <Dugme velicina="sm" disabled={radi === e.id} onClick={() => posalji(e.id, `/api/doprinos-oglasi/potvrde/izvrsenje/${e.id}`, { odluka: "POTVRDI", obrazlozenje: obrazlozenja[e.id] })}>{t("potvrde_potvrdi")}</Dugme>
                    <Dugme velicina="sm" varijanta="sekundarno" disabled={radi === e.id} onClick={() => posalji(e.id, `/api/doprinos-oglasi/potvrde/izvrsenje/${e.id}`, { odluka: "DOPUNA", obrazlozenje: obrazlozenja[e.id] })}>{t("potvrde_dopuna")}</Dugme>
                    <Dugme velicina="sm" varijanta="opasno" disabled={radi === e.id} onClick={() => posalji(e.id, `/api/doprinos-oglasi/potvrde/izvrsenje/${e.id}`, { odluka: "ODBIJ", obrazlozenje: obrazlozenja[e.id] })}>{t("potvrde_odbij")}</Dugme>
                  </div>
                </>
              )}
              {poruka(e.id)}
            </Kartica>
          ))}
        </section>
      )}

      {prijave.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t("potvrde_prijave")}</h2>
          {prijave.map((p) => (
            <Kartica key={p.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {zadatakLink(p.oglasId, p.naslov)}
                {rokOznaka(p.rok)}
              </div>
              <p className="text-sm"><Pseudonim>{p.pseudonim}</Pseudonim></p>
              {p.plan && <p className="text-xs text-kolo-muted whitespace-pre-line"><span className="font-semibold">{t("uc_plan")}:</span> {p.plan}</p>}
              {p.uslov && <p className="text-xs text-kolo-muted"><span className="font-semibold">{t("uslov_label")}:</span> {p.uslov} — {p.ispunjenost ?? "—"}</p>}
              {obrazlozenjePolje(p.id)}
              <div className="flex flex-wrap gap-2">
                <Dugme velicina="sm" disabled={radi === p.id} onClick={() => posalji(p.id, `/api/doprinos-oglasi/potvrde/prijava/${p.id}`, { odobri: true, razlog: obrazlozenja[p.id] })}>{t("potvrde_odobri_plan")}</Dugme>
                <Dugme velicina="sm" varijanta="opasno" disabled={radi === p.id} onClick={() => posalji(p.id, `/api/doprinos-oglasi/potvrde/prijava/${p.id}`, { odobri: false, razlog: obrazlozenja[p.id] })}>{t("potvrde_odbij")}</Dugme>
              </div>
              {poruka(p.id)}
            </Kartica>
          ))}
        </section>
      )}

      {zavrsne.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t("potvrde_zavrsne")}</h2>
          {zavrsne.map((z) => (
            <Kartica key={z.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {zadatakLink(z.oglasId, z.naslov)}
                {rokOznaka(z.rok)}
              </div>
              <p className="text-sm"><Pseudonim>{z.pseudonim}</Pseudonim></p>
              {obrazlozenjePolje(z.id)}
              {z.saCelinama && (
                <input type="number" min={0} step={1} className={KLASE_UNOSA} placeholder={t("potvrde_delimicno_celine")} aria-label={t("potvrde_delimicno_celine")}
                  value={celine[z.id] ?? ""} onChange={(e) => setCeline((c) => ({ ...c, [z.id]: e.target.value }))} />
              )}
              <div className="flex flex-wrap gap-2">
                <Dugme velicina="sm" disabled={radi === z.id} onClick={() => posalji(z.id, `/api/doprinos-oglasi/potvrde/zavrsna/${z.id}`, { odluka: "IZVRSEN", obrazlozenje: obrazlozenja[z.id] })}>{t("zavrsna_dugme_IZVRSEN")}</Dugme>
                {z.saCelinama && (
                  <Dugme velicina="sm" varijanta="sekundarno" disabled={radi === z.id} onClick={() => posalji(z.id, `/api/doprinos-oglasi/potvrde/zavrsna/${z.id}`, { odluka: "DELIMICNO", obrazlozenje: obrazlozenja[z.id], celine: celine[z.id] })}>{t("zavrsna_dugme_DELIMICNO")}</Dugme>
                )}
                <Dugme velicina="sm" varijanta="opasno" disabled={radi === z.id} onClick={() => posalji(z.id, `/api/doprinos-oglasi/potvrde/zavrsna/${z.id}`, { odluka: "ODBIJEN", obrazlozenje: obrazlozenja[z.id] })}>{t("zavrsna_dugme_ODBIJEN")}</Dugme>
              </div>
              {poruka(z.id)}
            </Kartica>
          ))}
        </section>
      )}

      {primedbe.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t("uc_primedbe")}</h2>
          {primedbe.map((r) => (
            <Kartica key={r.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {zadatakLink(r.oglasId, r.naslov)}
                {rokOznaka(r.rok)}
              </div>
              <p className="text-xs text-kolo-muted">{t(`primedba_predmet_${r.predmet}`)}</p>
              <p className="text-sm whitespace-pre-line">{r.tekst}</p>
              {obrazlozenjePolje(r.id)}
              <Dugme velicina="sm" disabled={radi === r.id} onClick={() => posalji(r.id, `/api/doprinos-oglasi/potvrde/primedba/${r.id}`, { odluka: obrazlozenja[r.id] })}>{t("potvrde_izjasni")}</Dugme>
              {poruka(r.id)}
            </Kartica>
          ))}
        </section>
      )}
    </div>
  );
}
