"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import { kljucMeseca } from "@/lib/pokroviteljstvo-dobrima-pravila";
import Pseudonim from "@/components/Pseudonim";
import Kartica from "@/components/ui/Kartica";
import Dugme, { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";

/**
 * Ugovori pokrovitelja (tab „Ugovori"): novčane prijave (donacije čl. 7–8) i ugovori
 * o pokroviteljstvu dobrima i uslugama (čl. 13g), sa potpisom.
 *
 * Novčani ugovor se potpisuje potvrdom; ugovor o dobrima i uslugama — ceo snimljen
 * tekst, tri potvrde i jednokratni kod na mejl (čl. 13g st. 4); posle potpisa
 * primerak za štampu (`/vauceri/davalac/ugovor/[id]`).
 * 🔴 Uz vrednost ugovora (dinari) se ne prikazuje broj POEN-a.
 */
type NovcanaPrijava = {
  id: string;
  vrednostRsd: number;
  ugovorTekst: string;
  status: "CEKA_POTPIS" | "POTPISANA" | "POTVRDJENA" | "ODBIJENA";
  odbijenoRazlog: string | null;
  createdAt: string;
};

type UgovorDobra = {
  id: string;
  vrsta: "DOBRO" | "USLUGA";
  opis: string;
  brojVaucera: number;
  vrednostRsd: number;
  mesto: string;
  adresaPredaje: string | null;
  status: "NA_PREGLEDU" | "CEKA_POTPIS" | "POTPISAN" | "ODBIJEN" | "RASKINUT";
  odbijenoRazlog: string | null;
  ugovorTekst: string | null;
  vaziDo: string | null;
  kontrolniBroj: string | null;
  mojPotpis: boolean;
  vauceri: { slobodno: number; dodeljeno: number; iskorisceno: number; isteklo: number };
};

type Potpis = { procitao: boolean; ovlascen: boolean; saglasan: boolean; kod: string; kodPoslat: boolean };
const prazanPotpis: Potpis = { procitao: false, ovlascen: false, saglasan: false, kod: "", kodPoslat: false };

export default function UgovoriUpisa({ upisId }: { upisId: string }) {
  const t = useTranslations("vauceri");
  const tp = useTranslations("postaniPokrovitelj");
  const locale = useLocale();
  const [novcane, setNovcane] = useState<NovcanaPrijava[]>([]);
  const [dobra, setDobra] = useState<UgovorDobra[]>([]);
  const [ucitava, setUcitava] = useState(true);
  const [otvoren, setOtvoren] = useState<string | null>(null);
  const [radi, setRadi] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ tekst: string; ok: boolean } | null>(null);
  const [potpis, setPotpis] = useState<Record<string, Potpis>>({});
  const [potpisOtvoren, setPotpisOtvoren] = useState<string | null>(null);
  const { dijalog } = useDijalog();

  const ucitaj = useCallback(async () => {
    try {
      const [rn, rd] = await Promise.all([
        fetch(`/api/pokroviteljstvo/prijava?upisId=${encodeURIComponent(upisId)}`, { cache: "no-store" }),
        fetch(`/api/pokroviteljstvo/dobra?upisId=${encodeURIComponent(upisId)}`, { cache: "no-store" }),
      ]);
      if (rn.ok) setNovcane((await rn.json()).prijave ?? []);
      if (rd.ok) setDobra((await rd.json()).ugovori ?? []);
    } finally {
      setUcitava(false);
    }
  }, [upisId]);
  useEffect(() => { void ucitaj(); }, [ucitaj]);

  const rsd = (n: number) => n.toLocaleString(intlTag(locale));
  const datum = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
  const p = (id: string) => potpis[id] ?? prazanPotpis;
  const postaviPotpis = (id: string, izmena: Partial<Potpis>) =>
    setPotpis((s) => ({ ...s, [id]: { ...(s[id] ?? prazanPotpis), ...izmena } }));

  // Čl. 13g st. 4 — jednokratni kod na adresu elektronske pošte podnosioca. Isti
  // postupak važi i za novčano pokroviteljstvo (čl. 8 st. 1; F5-M1).
  async function posaljiKod(id: string, vrsta: "dobra" | "prijava" = "dobra") {
    setPoruka(null);
    setRadi(`kod-${id}`);
    const r = await fetch(`/api/pokroviteljstvo/${vrsta}/${id}/kod`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setRadi(null);
    if (r.ok) {
      postaviPotpis(id, { kodPoslat: true });
      setPoruka({ tekst: t("kod_poslat"), ok: true });
    } else setPoruka({ tekst: d.error ?? t("greska"), ok: false });
  }

  async function potpisiDobra(id: string, vrsta: "dobra" | "prijava" = "dobra") {
    const x = p(id);
    setPoruka(null);
    setRadi(id);
    const r = await fetch(`/api/pokroviteljstvo/${vrsta}/${id}/potpisi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kod: x.kod, procitao: x.procitao, ovlascen: x.ovlascen, saglasan: x.saglasan }),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(null);
    if (r.ok) {
      setPotpisOtvoren(null);
      setPotpis((s) => ({ ...s, [id]: prazanPotpis }));
    }
    setPoruka(r.ok ? { tekst: t("potpisano"), ok: true } : { tekst: d.error ?? t("greska"), ok: false });
    await ucitaj();
  }

  // Isti potpis za ugovor o dobrima i o novčanom pokroviteljstvu (čl. 13g st. 4; F5-M1).
  const potpisBlok = (id: string, tekst: string, vrsta: "dobra" | "prijava") => (
                <div className="space-y-3 border-t border-kolo-border pt-3">
                  <pre className="text-xs text-kolo-text whitespace-pre-wrap font-sans bg-kolo-bg rounded-kontrola p-4 max-h-96 overflow-auto">{tekst}</pre>
                  <label className="flex items-start gap-2 text-sm text-kolo-text">
                    <input type="checkbox" className="mt-0.5" checked={p(id).procitao} onChange={(e) => postaviPotpis(id, { procitao: e.target.checked })} />
                    {t("potpis_procitao")}
                  </label>
                  <label className="flex items-start gap-2 text-sm text-kolo-text">
                    <input type="checkbox" className="mt-0.5" checked={p(id).ovlascen} onChange={(e) => postaviPotpis(id, { ovlascen: e.target.checked })} />
                    {t("potpis_ovlascen")}
                  </label>
                  <label className="flex items-start gap-2 text-sm text-kolo-text">
                    <input type="checkbox" className="mt-0.5" checked={p(id).saglasan} onChange={(e) => postaviPotpis(id, { saglasan: e.target.checked })} />
                    {t("potpis_saglasan")}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Dugme varijanta="sekundarno" onClick={() => posaljiKod(id, vrsta)}
                      disabled={radi === `kod-${id}` || !p(id).procitao || !p(id).ovlascen || !p(id).saglasan}>
                      {p(id).kodPoslat ? t("posalji_kod_ponovo") : t("posalji_kod")}
                    </Dugme>
                    <input value={p(id).kod}
                      onChange={(e) => postaviPotpis(id, { kod: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                      inputMode="numeric" autoComplete="one-time-code" placeholder={t("kod_potpisa_placeholder")}
                      aria-label={t("kod_potpisa_placeholder")}
                      className={`${KLASE_UNOSA.replace("w-full", "w-32")} font-mono`} />
                    <Dugme onClick={() => potpisiDobra(id, vrsta)}
                      disabled={radi === id || p(id).kod.length !== 6 || !p(id).procitao || !p(id).ovlascen || !p(id).saglasan}>
                      {t("potpisi_kodom")}
                    </Dugme>
                  </div>
                  <p className="text-xs text-kolo-muted">{t("potpis_napomena")}</p>
                </div>
  );

  const STATUS_NOVAC: Record<NovcanaPrijava["status"], string> = {
    CEKA_POTPIS: tp("status_ceka_potpis"),
    POTPISANA: tp("status_potpisana"),
    POTVRDJENA: tp("status_potvrdjena"),
    ODBIJENA: tp("status_odbijena"),
  };
  const STATUS_DOBRA: Record<UgovorDobra["status"], string> = {
    NA_PREGLEDU: t("ugovor_na_pregledu"),
    CEKA_POTPIS: t("ugovor_ceka_potpis"),
    POTPISAN: t("ugovor_potpisan"),
    ODBIJEN: t("ugovor_odbijen"),
    RASKINUT: t("ugovor_raskinut"),
  };

  if (ucitava) return <p className="text-sm text-kolo-muted">{t("ucitavanje")}</p>;

  return (
    <div className="space-y-5">
      {dijalog}
      {poruka && (
        <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>
          {poruka.tekst}
        </Obavestenje>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-kolo-text">{tp("ugovori_novac_naslov")}</h2>
        {novcane.length === 0 ? (
          <p className="text-sm text-kolo-muted bg-kolo-bg rounded-kontrola px-3 py-2">{tp("moje_prijave_prazno")}</p>
        ) : (
          novcane.map((n) => (
            <Kartica key={n.id} padding="sm" className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-kolo-text">{rsd(n.vrednostRsd)} RSD</p>
                  <p className="text-xs text-kolo-muted">{datum(n.createdAt)}</p>
                  <p className="text-xs font-semibold text-kolo-gold-700 mt-1">{STATUS_NOVAC[n.status]}</p>
                  {n.status === "ODBIJENA" && n.odbijenoRazlog && (
                    <p className="text-xs text-kolo-danger">{tp("odbijena_razlog")} {n.odbijenoRazlog}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Dugme varijanta="sekundarno" velicina="sm" onClick={() => setOtvoren(otvoren === n.id ? null : n.id)}>
                    {otvoren === n.id ? tp("sakrij_ugovor") : tp("prikazi_ugovor")}
                  </Dugme>
                  {n.status === "CEKA_POTPIS" && (
                    <Dugme velicina="sm" onClick={() => setPotpisOtvoren(potpisOtvoren === n.id ? null : n.id)}>
                      {tp("potpisi")}
                    </Dugme>
                  )}
                </div>
              </div>
              {otvoren === n.id && potpisOtvoren !== n.id && (
                <pre className="text-xs text-kolo-text whitespace-pre-wrap font-sans bg-kolo-bg rounded-kontrola p-4">{n.ugovorTekst}</pre>
              )}
              {n.status === "CEKA_POTPIS" && potpisOtvoren === n.id && potpisBlok(n.id, n.ugovorTekst, "prijava")}
            </Kartica>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-kolo-text">{tp("ugovori_dobra_naslov")}</h2>
        {dobra.length === 0 ? (
          <p className="text-sm text-kolo-muted bg-kolo-bg rounded-kontrola px-3 py-2">{t("ugovori_prazno")}</p>
        ) : (
          dobra.map((u) => (
            <Kartica key={u.id} padding="sm" className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-kolo-text">{u.opis}</p>
                  <p className="text-sm text-kolo-muted">{u.mesto}{u.adresaPredaje ? `, ${u.adresaPredaje}` : ""}</p>
                  <p className="text-sm text-kolo-muted">{t("ugovor_vrednost", { broj: u.brojVaucera, vrednost: rsd(u.vrednostRsd) })}</p>
                  {u.status === "POTPISAN" && (
                    <p className="text-xs text-kolo-muted">
                      {t("ugovor_stanje_vaucera", u.vauceri)} · {t("vazi_do", { datum: datum(u.vaziDo) })}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-kolo-gold-700 mt-1">{STATUS_DOBRA[u.status]}</p>
                  {u.status === "ODBIJEN" && u.odbijenoRazlog && (
                    <p className="text-xs text-kolo-danger">{t("odbijeno_razlog", { razlog: u.odbijenoRazlog })}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {u.ugovorTekst && (
                    <Dugme varijanta="sekundarno" velicina="sm" onClick={() => setOtvoren(otvoren === u.id ? null : u.id)}>
                      {otvoren === u.id ? t("sakrij_ugovor") : t("prikazi_ugovor")}
                    </Dugme>
                  )}
                  {u.status === "CEKA_POTPIS" && u.mojPotpis && (
                    <Dugme velicina="sm" onClick={() => setPotpisOtvoren(potpisOtvoren === u.id ? null : u.id)}>
                      {t("potpisi")}
                    </Dugme>
                  )}
                  {u.kontrolniBroj && (
                    <Link href={`/vauceri/davalac/ugovor/${u.id}`}
                      className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
                      {t("primerak_link")}
                    </Link>
                  )}
                </div>
              </div>
              {otvoren === u.id && u.ugovorTekst && potpisOtvoren !== u.id && (
                <pre className="text-xs text-kolo-text whitespace-pre-wrap font-sans bg-kolo-bg rounded-kontrola p-4">{u.ugovorTekst}</pre>
              )}
              {u.status === "CEKA_POTPIS" && potpisOtvoren === u.id && u.ugovorTekst && potpisBlok(u.id, u.ugovorTekst, "dobra")}
            </Kartica>
          ))
        )}
      </section>
    </div>
  );
}

/**
 * Iskorišćeni vaučeri pokrovitelja — beleže se kod davaoca uz PSEUDONIM imaoca i
 * pseudonim onoga ko je potvrdio (nabavke čl. 30g st. 1, Politika 4.15). 🔴 Ništa
 * drugo o imaocu.
 */
export function IskorisceniVauceri({ upisId }: { upisId: string }) {
  const t = useTranslations("vauceri");
  const locale = useLocale();
  const [redovi, setRedovi] = useState<{ id: string; ugovorId: string; opis: string; iskoriscenAt: string | null; pseudonim: string | null; potvrdio: string | null }[]>([]);

  useEffect(() => {
    let ziv = true;
    fetch(`/api/pokroviteljstvo/dobra?upisId=${encodeURIComponent(upisId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { iskorisceni: [] }))
      .then((d) => { if (ziv) setRedovi(d.iskorisceni ?? []); })
      .catch(() => {});
    return () => { ziv = false; };
  }, [upisId]);

  const datum = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  return (
    <Kartica as="section" className="space-y-2">
      <h2 className="text-lg font-semibold">{t("iskorisceni_naslov", { broj: redovi.length })}</h2>
      {redovi.length === 0 ? null : (
        <>
          {/* Potvrda o predaji bez naknade — zbirno po ugovoru za mesec ili po vaučeru
              (odluka vlasnika 20.10.2026). Mesec se računa po beogradskom vremenu. */}
          <p className="text-xs text-kolo-muted">{t("potvrda_objasnjenje")}</p>
          <div className="flex flex-wrap gap-2">
            {[...new Map(
              redovi
                .filter((i) => i.iskoriscenAt)
                .map((i) => {
                  const m = kljucMeseca(new Date(i.iskoriscenAt!));
                  return [`${i.ugovorId}|${m}`, { ugovorId: i.ugovorId, mesec: m, opis: i.opis }] as const;
                }),
            ).values()].map((g) => (
              <Link
                key={`${g.ugovorId}|${g.mesec}`}
                href={`/vauceri/davalac/potvrda/${g.ugovorId}?mesec=${g.mesec}`}
                className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
              >
                {t("potvrda_mesec", { mesec: g.mesec })} · {g.opis}
              </Link>
            ))}
          </div>
          <ul className="space-y-1 text-sm">
            {redovi.map((i) => (
              <li key={i.id} className="text-kolo-text">
                {datum(i.iskoriscenAt)} · {i.opis} · {i.pseudonim ? <Pseudonim>{i.pseudonim}</Pseudonim> : "—"}
                {i.potvrdio && <> · {t("potvrdio")} <Pseudonim>{i.potvrdio}</Pseudonim></>}
                {" · "}
                <Link href={`/vauceri/davalac/potvrda/${i.ugovorId}?vaucer=${i.id}`} className="text-xs text-kolo-green-700 underline">
                  {t("potvrda_jedan")}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Kartica>
  );
}
