"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Pseudonim from "@/components/Pseudonim";
import AdminLogotip from "./AdminLogotip";
import { KLASE_REDA, klaseTd } from "./tabela";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import { klaseKartice } from "@/components/ui/Kartica";
import { klaseDugmeta } from "@/components/ui/Dugme";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useDijalog } from "@/components/ui/Dijalog";

const GUSTO = klaseTd("levo", { gusto: true });

/**
 * Admin → Pokrovitelji → Dobra i usluge (Pravilnik o pokroviteljstvu i donacijama
 * Glava IV; nabavke Glava VII).
 *
 * Pregled: Fondacija proverava SAMO da je fotografija cenovnika priložena —
 * podatke o davaocu je uporedila sa registrom pri odobrenju upisa (čl. 18 st. 1;
 * Admin → Pokrovitelji → Upisi), pa se prijava prihvata samo iz odobrenog upisa.
 * 🔴 Cenu ne procenjuje, ne upoređuje i ne određuje (čl. 29 st. 2) — samo se
 * prikazuju fotografija cenovnika i cena. Fotografiju otvara samo administratorska ruta.
 *
 * Posle potpisa vaučeri su odmah dostupni članovima (nabavke čl. 32) — raspodele
 * i dodele nema. Raskid po neizvršenju posle prigovora imaoca (čl. 35) upisuje
 * davaoca na listu zabrane; „Skini zabranu" je odluka Fondacije uz obrazloženje.
 */
type Vaucer = {
  id: string;
  kod: string;
  status: "SLOBODAN" | "DODELJEN" | "ISKORISCEN" | "ISTEKAO" | "NEIZVRSEN";
  imalacPseudonim: string | null;
  potvrdioPseudonim: string | null;
  prigovor: string | null;
};

type Ugovor = {
  id: string;
  podnosilacPseudonim: string;
  logoUrl: string | null;
  vrstaDavaoca: "FIRMA" | "GAZDINSTVO";
  bpg: string | null;
  naziv: string;
  pib: string | null;
  maticniBroj: string | null;
  adresaSedista: string | null;
  zastupnikImePrezime: string;
  zastupnikFunkcija: string;
  odnosPremaDavaocu: "ZASTUPNIK" | "PREDUZETNIK" | "VLASNIK" | "JEDAN_OD_VLASNIKA" | "STVARNI_VLASNIK" | "OVLASCENO_LICE" | "NOSILAC_GAZDINSTVA" | null;
  kontaktEmail: string | null;
  kontaktTelefon: string | null;
  izjavaOvlascenjeAt: string | null;
  potvrdaEvidentiranjaAt: string | null;
  /** Upis pokrovitelja odobren uz poređenje sa registrom (donacije čl. 18 st. 1). */
  upisOdobren: boolean;
  vrsta: "DOBRO" | "USLUGA";
  opis: string;
  brojVaucera: number;
  cenaPoJedinici: number;
  vrednostRsd: number;
  rokVazenjaMeseci: number;
  mesto: string;
  adresaPredaje: string | null;
  mestaPrikaz: string[];
  status: "NA_PREGLEDU" | "CEKA_POTPIS" | "POTPISAN" | "ODBIJEN" | "RASKINUT";
  odbijenoRazlog: string | null;
  ugovorTekst: string | null;
  vaziDo: string | null;
  potpisanoAt: string | null;
  kontrolniBroj: string | null;
  koeficijent: number | null;
  poenEvidentirano: number | null;
  zabelezeno: boolean;
  poenaPoVauceru: number | null;
  stipsCena: number | null;
  stipsKategorija: string | null;
  stipsDatumObjave: string | null;
  stipsBiltenBroj: string | null;
  stipsBiltenUrl: string | null;
  stipsJedinica: string | null;
  stipsPijace: { pijaca: string; cena: number }[] | null;
  hranaOdgovori: Record<string, unknown> | null;
  hranaKategorija: string | null;
  hranaKoeficijent: number | null;
  podnosilacPotpisaoAt: string | null;
  naredniDozvoljenAt: string | null;
  naredniDozvolaRazlog: string | null;
  dokazi: { id: string; vrsta: string; nazivFajla: string; contentType: string; velicina: number; izvorRedni: number | null }[];
  vauceri: Vaucer[];
};

type Zabrana = {
  id: string;
  vrstaDavaoca: "FIRMA" | "GAZDINSTVO";
  maticniBroj: string | null;
  bpg: string | null;
  naziv: string;
  razlog: string;
  upisanoAt: string;
  skinutoAt: string | null;
  skidanjeRazlog: string | null;
};

/**
 * STIPS cena uz prihvatanje (donacije čl. 29 st. 1, set 5.1.3): superadmin bira samo kategoriju;
 * cenu, bilten i cene pijaca povlači sistem iz evidencije biltena (Pokrovitelji → STIPS).
 */
type StipsUnos = { stips: boolean; kategorija: string };
const STIPS_PRAZNO: StipsUnos = { stips: false, kategorija: "" };
type StipsPregled = { cena: number; jedinica: string; biltenBroj: string; biltenUrl: string; datumObjave: string; pijace: { pijaca: string; cena: number }[] } | null;

export default function PokroviteljstvoDobraTab({ onDone, superadmin = false }: { onDone?: () => void; superadmin?: boolean }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { data: ugovori = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-pokroviteljstvo-dobra"],
    queryFn: async (): Promise<Ugovor[]> => {
      const r = await fetch("/api/admin/pokroviteljstvo/dobra");
      if (!r.ok) throw new Error("Greška pri učitavanju");
      return r.json();
    },
  });
  const { data: zabrane = [], refetch: refetchZabrane } = useQuery({
    queryKey: ["admin-pokroviteljstvo-zabrane"],
    queryFn: async (): Promise<Zabrana[]> => {
      const r = await fetch("/api/admin/pokroviteljstvo/zabrane");
      if (!r.ok) throw new Error("Greška pri učitavanju");
      return (await r.json()).zabrane ?? [];
    },
  });
  const [radi, setRadi] = useState<string | null>(null);
  const [otvoren, setOtvoren] = useState<string | null>(null);
  const [stipsUnos, setStipsUnos] = useState<Record<string, StipsUnos>>({});
  const stipsZa = (id: string) => stipsUnos[id] ?? STIPS_PRAZNO;
  const postaviStips = (id: string, izmena: Partial<StipsUnos>) =>
    setStipsUnos((s) => ({ ...s, [id]: { ...(s[id] ?? STIPS_PRAZNO), ...izmena } }));
  const { data: stipsKategorije = [] } = useQuery({
    queryKey: ["admin-stips-kategorije"],
    enabled: superadmin,
    queryFn: async (): Promise<string[]> => {
      const r = await fetch("/api/admin/stips");
      if (!r.ok) return [];
      return (await r.json()).kategorije ?? [];
    },
  });
  // Pregled cene koja bi se primenila (poslednji bilten sa cenom za kategoriju).
  const [stipsPregled, setStipsPregled] = useState<Record<string, StipsPregled>>({});
  async function izaberiKategoriju(id: string, kategorija: string) {
    postaviStips(id, { kategorija });
    if (!kategorija) return;
    const r = await fetch(`/api/admin/stips/cena?kategorija=${encodeURIComponent(kategorija)}`);
    const d = await r.json().catch(() => ({}));
    setStipsPregled((s) => ({ ...s, [id]: r.ok ? d.cena ?? null : null }));
  }
  const { dijalog, unesi, obavesti } = useDijalog();

  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const datum = (d: string | null) => (d ? new Date(d).toLocaleDateString(intlTag(locale)) : "—");

  async function radnja(kljuc: string, url: string, body?: unknown) {
    setRadi(kljuc);
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(null);
    if (!r.ok) await obavesti(d.error ?? t("greska_generalna"));
    await Promise.all([refetch(), refetchZabrane()]);
    onDone?.(); // osvežava žuti krug sa brojem na tabu i u sidebaru
    return r.ok ? d : null;
  }

  // Lista zabrane (čl. 35 st. 5) — Fondacija skida davaoca uz obrazloženje.
  async function skiniZabranu(z: Zabrana) {
    const razlog = await unesi({ poruka: t("dobra_zabrana_skini_prompt", { naziv: z.naziv }), dugme: t("dobra_zabrana_skini") });
    if (!razlog?.trim()) return;
    await radnja(z.id, `/api/admin/pokroviteljstvo/zabrane/${z.id}/skini`, { razlog: razlog.trim() });
  }

  // Naredni ugovor bez polovine iskorišćenih vaučera (čl. 29 st. 4, set 4.8.4) —
  // samo odlukom Fondacije, uz obrazloženje; ruta propušta samo superadmina.
  async function dozvoliNaredni(u: Ugovor) {
    const razlog = await unesi({ poruka: t("dobra_naredni_prompt", { naziv: u.naziv }), dugme: t("dobra_naredni_dozvoli") });
    if (!razlog?.trim()) return;
    await radnja(u.id, `/api/admin/pokroviteljstvo/dobra/${u.id}/dozvoli-naredni`, { razlog: razlog.trim() });
  }

  async function odbij(id: string) {
    const razlog = await unesi({ poruka: t("dobra_odbij_prompt"), opasno: true, dugme: t("pokr_prijave_odbij_btn") });
    if (!razlog?.trim()) return;
    await radnja(id, `/api/admin/pokroviteljstvo/dobra/${id}/odbij`, { razlog: razlog.trim() });
  }

  // Raskid ugovora po neizvršenju (čl. 35) — pokreće se sa vaučera o kome je prigovor.
  async function raskid(ugovorId: string, v: Vaucer) {
    const obrazlozenje = await unesi({ poruka: t("dobra_raskid_prompt"), opasno: true, dugme: t("dobra_raskid_btn") });
    if (!obrazlozenje?.trim()) return;
    const d = await radnja(v.id, `/api/admin/pokroviteljstvo/dobra/${ugovorId}/raskid`, {
      vaucerId: v.id,
      obrazlozenje: obrazlozenje.trim(),
    });
    if (d) await obavesti(t("dobra_raskid_uspeh", { otpis: d.otpis, broj: d.uRaskidu, ispravki: d.ispravki }));
  }

  // Zatečene prijave mogu nositi i stare vrste dokaza (računi, potvrda o upisu,
  // snimci izvora) — prikazuju se pod opštim nazivom; nove nose samo cenovnik.
  const DOKAZ: Record<string, string> = { CENOVNIK: t("dobra_dokaz_cenovnik") };
  const ODNOS: Record<NonNullable<Ugovor["odnosPremaDavaocu"]>, string> = {
    ZASTUPNIK: t("dobra_odnos_zastupnik"),
    PREDUZETNIK: t("dobra_odnos_preduzetnik"),
    VLASNIK: t("dobra_odnos_vlasnik"),
    JEDAN_OD_VLASNIKA: t("dobra_odnos_jedan_od_vlasnika"),
    STVARNI_VLASNIK: t("dobra_odnos_stvarni_vlasnik"),
    OVLASCENO_LICE: t("dobra_odnos_ovlasceno_lice"),
    NOSILAC_GAZDINSTVA: t("dobra_odnos_nosilac"),
  };
  const STATUS: Record<Ugovor["status"], string> = {
    NA_PREGLEDU: t("dobra_status_na_pregledu"),
    CEKA_POTPIS: t("dobra_status_ceka_potpis"),
    POTPISAN: t("dobra_status_potpisan"),
    ODBIJEN: t("dobra_status_odbijen"),
    RASKINUT: t("dobra_status_raskinut"),
  };
  const V_STATUS: Record<Vaucer["status"], string> = {
    SLOBODAN: t("dobra_v_slobodan"),
    DODELJEN: t("dobra_v_uzet"),
    ISKORISCEN: t("dobra_v_iskoriscen"),
    ISTEKAO: t("dobra_v_istekao"),
    NEIZVRSEN: t("dobra_v_neizvrsen"),
  };

  if (isLoading) return <p className="text-sm text-kolo-muted">{t("dobra_ucitavanje")}</p>;

  return (
    <div className="space-y-3">
      {dijalog}
      <p className="text-xs text-kolo-muted">{t("dobra_uvod")}</p>
      {ugovori.length === 0 && (
        <div className={klaseKartice({ padding: "nema" })}><PraznoStanje naslov={t("dobra_nema")} /></div>
      )}
      {ugovori.map((u) => {
        const imaCenovnik = u.dokazi.some((d) => d.vrsta === "CENOVNIK");
        const slobodnih = u.vauceri.filter((v) => v.status === "SLOBODAN").length;
        return (
          <div key={u.id} className={`${klaseKartice({ padding: "sm" })} space-y-2`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {u.vrstaDavaoca === "GAZDINSTVO" ? (
                  <>
                    <p className="font-semibold text-kolo-text">
                      {u.naziv} <span className="text-kolo-muted font-normal">· {t("dobra_gazdinstvo")} · BPG {u.bpg}</span>
                    </p>
                    <p className="text-xs text-kolo-muted">
                      {t("dobra_nosilac")}: {u.zastupnikImePrezime}
                      {" · "}{t.rich("pokr_prijave_podneo", { pseudonim: u.podnosilacPseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-kolo-text">
                      {u.naziv} <span className="text-kolo-muted font-normal">· PIB {u.pib} · {t("pokr_prijave_mb")} {u.maticniBroj}</span>
                    </p>
                    <p className="text-xs text-kolo-muted">
                      {t("pokr_prijave_sediste")}: {u.adresaSedista} · {t("dobra_podnosilac")}: {u.zastupnikImePrezime}
                      {u.odnosPremaDavaocu ? `, ${ODNOS[u.odnosPremaDavaocu]}` : ""}
                      {u.odnosPremaDavaocu === "ZASTUPNIK" || !u.odnosPremaDavaocu ? ` (${u.zastupnikFunkcija})` : ""}
                      {" · "}{t.rich("pokr_prijave_podneo", { pseudonim: u.podnosilacPseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })}
                    </p>
                  </>
                )}
                {(u.kontaktEmail || u.kontaktTelefon) && (
                  <p className="text-xs text-kolo-muted">
                    {t("dobra_kontakt")}: {u.kontaktEmail ?? "—"} · {u.kontaktTelefon ?? "—"}
                  </p>
                )}
                <AdminLogotip izvor="UGOVOR_DOBRA" id={u.id} url={u.logoUrl} onUklonjen={() => { void refetch(); }} />
                <p className="text-xs text-kolo-muted">
                  {u.izjavaOvlascenjeAt ? `${t("dobra_izjava_ovlascenje_data")} · ` : ""}
                  {u.potvrdaEvidentiranjaAt ? t("dobra_potvrda_evidentiranja_data") : ""}
                </p>
                <p className="text-sm text-kolo-text mt-1">
                  {u.vrsta === "DOBRO" ? t("dobra_vrsta_dobro") : t("dobra_vrsta_usluga")}: {u.opis}
                </p>
                {u.hranaOdgovori && u.hranaKategorija && (
                  <div className="text-sm text-kolo-muted space-y-1">
                    <p>{t("dobra_hrana_prikaz", {
                      vrsta: t(`dobra_hrana_vrsta_${String(u.hranaOdgovori.vrsta)}`),
                      kategorija: t(`dobra_hrana_kat_${u.hranaKategorija}`),
                      koef: (u.hranaKoeficijent ?? 1).toFixed(2),
                    })}</p>
                    <p className="text-xs">{t("dobra_hrana_odgovori", {
                      odgovori: Object.entries(u.hranaOdgovori).filter(([k, v]) => k !== "vrsta" && v !== null && v !== "").map(([k, v]) => `${k}: ${String(v)}`).join(" · "),
                    })}</p>
                  </div>
                )}
                <p className="text-sm text-kolo-muted">
                  {t("dobra_obim", {
                    broj: u.brojVaucera,
                    cena: broj(u.cenaPoJedinici),
                    vrednost: broj(u.vrednostRsd),
                  })}
                </p>
                <p className="text-xs text-kolo-muted">
                  {u.mestaPrikaz.join("; ")}
                </p>
                <p className="text-xs mt-1">
                  <span className="font-semibold text-kolo-gold-700">{STATUS[u.status]}</span>
                  {u.status === "ODBIJEN" && u.odbijenoRazlog && <span className="text-kolo-muted"> — {u.odbijenoRazlog}</span>}
                </p>
              </div>
              {u.ugovorTekst && (
                <button
                  onClick={() => setOtvoren(otvoren === u.id ? null : u.id)}
                  className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" }) + " shrink-0"}
                >
                  {t("pokr_prijave_detalji_btn")}
                </button>
              )}
            </div>

            {/* Dokaz cene — samo administratorski tim (ruta pod /api/admin/). */}
            <div className="flex flex-wrap gap-2">
              {u.dokazi.map((d) => (
                <a
                  key={d.id}
                  href={`/api/admin/pokroviteljstvo/dobra/${u.id}/dokaz/${d.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                >
                  {DOKAZ[d.vrsta] ?? t("dobra_dokaz_zateceni")}: {d.nazivFajla}
                </a>
              ))}
            </div>

            {otvoren === u.id && u.ugovorTekst && (
              <pre className="text-xs text-kolo-text whitespace-pre-wrap font-sans bg-kolo-bg rounded-kontrola p-4">{u.ugovorTekst}</pre>
            )}

            {u.status === "NA_PREGLEDU" && (
              <div className="space-y-2 border-t border-kolo-border pt-2">
                {/* Fondacija cenu ne upoređuje (čl. 29 st. 2) — prikazuju se samo cena i fotografija cenovnika. */}
                <p className="text-xs text-kolo-muted">{t("dobra_cena_napomena", { cena: broj(u.cenaPoJedinici) })}</p>
                {/* Podatke o davaocu Fondacija je uporedila sa registrom pri odobrenju
                    upisa (čl. 18 st. 1) — ovde se proverava samo cenovnik. */}
                <p className="text-xs text-kolo-muted">{u.upisOdobren ? t("dobra_upis_odobren") : t("dobra_upis_nije_odobren")}</p>
                {u.hranaOdgovori && <p className="text-xs text-kolo-muted">{t("dobra_hrana_proveri")}</p>}
                {u.podnosilacPotpisaoAt && <p className="text-xs text-kolo-muted">{t("dobra_potpisao_podnosilac")}</p>}
                {superadmin && (
                  <div className="space-y-2 rounded-kontrola bg-kolo-bg p-3">
                    <label className="flex items-center gap-2 text-xs text-kolo-text">
                      <input
                        type="checkbox"
                        checked={stipsZa(u.id).stips}
                        onChange={(e) => postaviStips(u.id, { stips: e.target.checked })}
                      />
                      {t("dobra_stips_oznaka")}
                    </label>
                    {stipsZa(u.id).stips && (
                      <div className="space-y-2">
                        <label className="text-xs text-kolo-muted space-y-1 block">
                          <span className="block">{t("dobra_stips_kategorija")}</span>
                          <select value={stipsZa(u.id).kategorija} onChange={(e) => void izaberiKategoriju(u.id, e.target.value)}
                            className="w-full rounded-kontrola border border-kolo-border px-2 py-1 text-sm text-kolo-text">
                            <option value="">—</option>
                            {stipsKategorije.map((k) => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </label>
                        {stipsZa(u.id).kategorija && (
                          stipsPregled[u.id] ? (
                            <p className="text-xs text-kolo-text">
                              {t("dobra_stips_pregled", {
                                cena: broj(stipsPregled[u.id]!.cena), jedinica: stipsPregled[u.id]!.jedinica,
                                bilten: stipsPregled[u.id]!.biltenBroj, datum: datum(stipsPregled[u.id]!.datumObjave),
                              })}{" "}
                              {stipsPregled[u.id]!.pijace.map((p) => `${p.pijaca} ${broj(p.cena)}`).join(", ")}
                            </p>
                          ) : (
                            <p className="text-xs text-kolo-danger">{t("dobra_stips_nema_cene")}</p>
                          )
                        )}
                        <p className="text-xs text-kolo-muted">{t("dobra_stips_napomena")}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    disabled={!u.upisOdobren || !imaCenovnik || radi === u.id}
                    onClick={() => {
                      const st = stipsZa(u.id);
                      return radnja(u.id, `/api/admin/pokroviteljstvo/dobra/${u.id}/prihvati`,
                        st.stips ? { stips: true, stipsKategorija: st.kategorija } : undefined);
                    }}
                    className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}
                  >
                    {t("dobra_prihvati")}
                  </button>
                  <button onClick={() => odbij(u.id)} disabled={radi === u.id}
                    className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                    {t("pokr_prijave_odbij_btn")}
                  </button>
                </div>
              </div>
            )}

            {u.status === "CEKA_POTPIS" && (
              <div className="flex gap-2 border-t border-kolo-border pt-2">
                <p className="text-xs text-kolo-muted flex-1">{t("dobra_ceka_potpis_napomena")}</p>
                <button onClick={() => odbij(u.id)} disabled={radi === u.id}
                  className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                  {t("pokr_prijave_odbij_btn")}
                </button>
              </div>
            )}

            {(u.status === "POTPISAN" || u.status === "RASKINUT") && (
              <div className="space-y-2 border-t border-kolo-border pt-2">
                <p className="text-xs text-kolo-muted">
                  {t(u.zabelezeno ? "dobra_zabelezeno" : "dobra_evidentirano", {
                    poen: broj(u.poenEvidentirano ?? 0),
                    koef: (u.koeficijent ?? 1).toFixed(2),
                    vazi: datum(u.vaziDo),
                  })}
                </p>
                {u.stipsCena != null && (
                  <p className="text-xs text-kolo-muted">
                    {t("dobra_stips_primenjena", {
                      cena: broj(u.stipsCena), kategorija: u.stipsKategorija ?? "", datum: datum(u.stipsDatumObjave),
                      cenovnik: broj(u.cenaPoJedinici), bilten: u.stipsBiltenBroj ?? "—",
                    })}
                    {u.stipsPijace && u.stipsPijace.length > 0 && (
                      <> {u.stipsPijace.map((p) => `${p.pijaca} ${broj(p.cena)}`).join(", ")}</>
                    )}
                    {u.stipsBiltenUrl && (
                      <> · <a href={u.stipsBiltenUrl} target="_blank" rel="noopener noreferrer" className="underline">{t("stips_stranica")}</a></>
                    )}
                  </p>
                )}
                {u.status === "POTPISAN" && (
                  u.naredniDozvoljenAt ? (
                    <p className="text-xs text-kolo-muted">
                      {t("dobra_naredni_dozvoljen", { datum: datum(u.naredniDozvoljenAt) })}
                      {u.naredniDozvolaRazlog ? ` — ${u.naredniDozvolaRazlog}` : ""}
                    </p>
                  ) : (
                    <button onClick={() => dozvoliNaredni(u)} disabled={radi === u.id}
                      className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
                      {t("dobra_naredni_dozvoli")}
                    </button>
                  )
                )}
                <p className="text-xs text-kolo-text">
                  {t("dobra_dostupno", { slobodnih, poen: broj(u.poenaPoVauceru ?? 0) })}
                  {u.kontrolniBroj && (
                    <> · <a href={`/vauceri/davalac/ugovor/${u.id}`} target="_blank" rel="noreferrer" className="underline">{t("dobra_primerak")}</a></>
                  )}
                </p>
                <div className="max-h-64 overflow-auto rounded-kontrola border border-kolo-border">
                  <table className="w-full text-xs">
                    <tbody>
                      {u.vauceri.map((v) => (
                        <tr key={v.id} className={KLASE_REDA}>
                          <td className={`${GUSTO} font-mono`}>{v.kod}</td>
                          <td className={GUSTO}>{V_STATUS[v.status]}</td>
                          <td className={GUSTO}>{v.imalacPseudonim ? <Pseudonim>{v.imalacPseudonim}</Pseudonim> : "—"}</td>
                          <td className={GUSTO}>
                            {v.potvrdioPseudonim && (
                              <>{t("dobra_potvrdio")} <Pseudonim>{v.potvrdioPseudonim}</Pseudonim></>
                            )}
                          </td>
                          <td className={GUSTO}>{v.prigovor ? t("dobra_prigovor", { status: v.prigovor }) : ""}</td>
                          <td className={klaseTd("desno", { gusto: true })}>
                            {u.status === "POTPISAN" && v.prigovor && v.prigovor !== "ODBIJENO" && v.imalacPseudonim && (
                              <button onClick={() => raskid(u.id, v)} disabled={radi === v.id}
                                className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                                {t("dobra_raskid_btn")}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── Lista zabrane (čl. 35 st. 5) ──────────────────────────────────── */}
      <div className={`${klaseKartice({ padding: "sm" })} space-y-2`}>
        <NaslovSekcije nivo={3}>{t("dobra_zabrane_naslov")}</NaslovSekcije>
        <p className="text-xs text-kolo-muted">{t("dobra_zabrane_opis")}</p>
        {zabrane.length === 0 ? (
          <p className="text-xs text-kolo-muted">{t("dobra_zabrane_prazno")}</p>
        ) : (
          zabrane.map((z) => (
            <div key={z.id} className="flex items-start justify-between gap-3 border-t border-kolo-border pt-2 first:border-0 first:pt-0">
              <div className="min-w-0 text-xs">
                <p className="font-semibold text-kolo-text">
                  {z.naziv} <span className="font-normal text-kolo-muted">· {z.vrstaDavaoca === "GAZDINSTVO" ? `BPG ${z.bpg}` : `${t("pokr_prijave_mb")} ${z.maticniBroj}`}</span>
                </p>
                <p className="text-kolo-muted">{datum(z.upisanoAt)} · {z.razlog}</p>
                {z.skinutoAt && (
                  <p className="text-kolo-green-700">{t("dobra_zabrana_skinuta", { datum: datum(z.skinutoAt), razlog: z.skidanjeRazlog ?? "" })}</p>
                )}
              </div>
              {!z.skinutoAt && (
                <button onClick={() => skiniZabranu(z)} disabled={radi === z.id}
                  className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" }) + " shrink-0"}>
                  {t("dobra_zabrana_skini")}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
