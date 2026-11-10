"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";

type Izvrsenje = {
  id: string;
  obim: number;
  opis: string;
  status: "PRIJAVLJENO" | "ZABELEZENO" | "EVIDENTIRANO" | "ODBIJENO" | "PONISTENO";
  odbijenoRazlog: string | null;
  createdAt: string;
};
type Upozorenje = { izvor: "FONDACIJA" | "PROJEKAT" | "NABAVKA"; opis: string; datum: string; iznosRsd: number | null };
type Partnerstvo = {
  id: string;
  naziv: string;
  vrstaDavaoca: "FIRMA" | "GAZDINSTVO";
  maticniBroj: string | null;
  pib: string | null;
  bpg: string | null;
  zastupnikImePrezime: string;
  kontaktEmail: string;
  kontaktTelefon: string;
  podnosilac: string;
  opis: string;
  jedinicaMere: string;
  cenaPoJedinici: number;
  obim: number;
  vrednostRsd: number;
  rokIzvrsenja: string;
  obradaPodataka: boolean;
  dpaZabelezenAt: string | null;
  status: "NA_PREGLEDU" | "PRIHVACENO" | "ODBIJENO" | "PRESTALO";
  odbijenoRazlog: string | null;
  ugovorTekst: string | null;
  prestanakRazlog: string | null;
  ovlascenoLice: string | null;
  dokazi: { id: string; nazivFajla: string }[];
  upozorenjaDobavljaca: Upozorenje[];
  izvrsenja: Izvrsenje[];
};

/**
 * Admin → Pokrovitelji → Partnerstvo (Pravilnik o pokroviteljstvu i donacijama Glava VI).
 *
 * Prijave, ugovori, ugovor o obradi, ovlašćeno lice, potvrde izvršenja i prestanak. 🔴 Odluke
 * donosi samo direktor (superadmin); admin vidi spisak. Fondacija proverava da je fotografija
 * cenovnika priložena, cenu ne procenjuje (čl. 42 st. 2). Upozorenje o istom dobavljaču je
 * pomoć (čl. 45 st. 1): direktor izjavu daje pri prihvatanju. Broj POEN-a se ovde ne prikazuje (uz dinare).
 */
export default function PokroviteljPartnerstvoTab({ onDone, superadmin }: { onDone?: () => void; superadmin: boolean }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { dijalog, obavesti, potvrdi, unesi } = useDijalog();
  const [izjava, setIzjava] = useState<Record<string, boolean>>({});
  const [ovlasti, setOvlasti] = useState<Record<string, string>>({});
  const { data: lista = [], refetch } = useQuery({
    queryKey: ["admin-partnerstvo"],
    queryFn: async (): Promise<Partnerstvo[]> => {
      const r = await fetch("/api/admin/pokroviteljstvo/partnerstvo");
      if (!r.ok) throw new Error("Greška pri učitavanju");
      return (await r.json()).partnerstva ?? [];
    },
  });
  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const datum = (s: string) => new Date(s).toLocaleDateString(intlTag(locale));

  const STATUS: Record<Partnerstvo["status"], string> = {
    NA_PREGLEDU: t("partnerstvo_status_na_pregledu"),
    PRIHVACENO: t("partnerstvo_status_prihvaceno"),
    ODBIJENO: t("partnerstvo_status_odbijeno"),
    PRESTALO: t("partnerstvo_status_prestalo"),
  };
  const STATUS_IZVRSENJA: Record<Izvrsenje["status"], string> = {
    PRIJAVLJENO: t("partnerstvo_izvrsenje_prijavljeno"),
    ZABELEZENO: t("partnerstvo_izvrsenje_zabelezeno"),
    EVIDENTIRANO: t("partnerstvo_izvrsenje_evidentirano"),
    ODBIJENO: t("partnerstvo_izvrsenje_odbijeno"),
    PONISTENO: t("partnerstvo_izvrsenje_ponisteno"),
  };
  const IZVOR: Record<Upozorenje["izvor"], string> = {
    FONDACIJA: t("partnerstvo_izvor_fondacija"),
    PROJEKAT: t("partnerstvo_izvor_projekat"),
    NABAVKA: t("partnerstvo_izvor_nabavka"),
  };

  async function radnja(id: string, telo: Record<string, unknown>) {
    const r = await fetch(`/api/admin/pokroviteljstvo/partnerstvo/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telo),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) await obavesti(d.error ?? t("greska_generalna"));
    await refetch();
    onDone?.();
    return r.ok;
  }

  async function odbij(p: Partnerstvo) {
    const razlog = await unesi({ poruka: t("partnerstvo_odbij_poruka", { naziv: p.naziv }), oznaka: t("partnerstvo_obrazlozenje"), opasno: true });
    if (razlog !== null) await radnja(p.id, { radnja: "odbij", razlog });
  }
  async function prestanak(p: Partnerstvo) {
    const razlog = await unesi({ poruka: t("partnerstvo_prestanak_poruka", { naziv: p.naziv }), oznaka: t("partnerstvo_obrazlozenje"), opasno: true });
    if (razlog !== null) await radnja(p.id, { radnja: "prestanak", razlog });
  }
  async function izvrsenje(i: Izvrsenje, odluka: "potvrdi" | "odbij") {
    let razlog = "";
    if (odluka === "odbij") {
      const r = await unesi({ poruka: t("partnerstvo_izvrsenje_odbij_poruka"), oznaka: t("partnerstvo_obrazlozenje"), opasno: true });
      if (r === null) return;
      razlog = r;
    } else if (!(await potvrdi({ poruka: t("partnerstvo_izvrsenje_potvrdi_poruka"), dugme: t("partnerstvo_potvrdi") }))) {
      return;
    }
    const r = await fetch(`/api/pokroviteljstvo/partnerstvo/izvrsenje/${i.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odluka, razlog }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) await obavesti(d.error ?? t("greska_generalna"));
    await refetch();
    onDone?.();
  }

  return (
    <div className="space-y-3">
      {dijalog}
      <NaslovSekcije opis={t("partnerstvo_uvod")}>{t("partnerstvo_naslov")}</NaslovSekcije>
      {!superadmin && <Obavestenje vrsta="info">{t("partnerstvo_samo_direktor")}</Obavestenje>}
      {lista.length === 0 ? (
        <Kartica padding="nema"><PraznoStanje naslov={t("partnerstvo_prazno")} /></Kartica>
      ) : (
        lista.map((p) => (
          <Kartica key={p.id} className="space-y-2 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-kolo-text">{p.naziv}</p>
                <p className="text-xs text-kolo-muted">
                  {p.vrstaDavaoca === "FIRMA" ? `MB ${p.maticniBroj ?? "—"} · PIB ${p.pib ?? "—"}` : `BPG ${p.bpg ?? "—"}`}
                  {" · "}{p.zastupnikImePrezime} ({p.podnosilac}) · {p.kontaktEmail} · {p.kontaktTelefon}
                </p>
              </div>
              <span className="text-xs font-semibold text-kolo-green-700">{STATUS[p.status]}</span>
            </div>
            <p className="text-kolo-text">{p.opis}</p>
            <p className="text-xs text-kolo-muted">
              {t("partnerstvo_parametri", {
                obim: broj(p.obim), jedinica: p.jedinicaMere, cena: broj(p.cenaPoJedinici),
                vrednost: broj(p.vrednostRsd), rok: datum(p.rokIzvrsenja),
              })}
            </p>
            {p.dokazi.length > 0 ? (
              <p className="text-xs">
                {p.dokazi.map((d) => (
                  <a key={d.id} href={`/api/admin/pokroviteljstvo/partnerstvo/${p.id}/dokaz/${d.id}`} target="_blank" rel="noreferrer"
                    className="mr-3 font-medium text-kolo-green-700 hover:underline">{d.nazivFajla}</a>
                ))}
              </p>
            ) : (
              <p className="text-xs text-kolo-danger">{t("partnerstvo_bez_cenovnika")}</p>
            )}
            {p.obradaPodataka && (
              <p className="text-xs text-kolo-muted">
                {p.dpaZabelezenAt ? t("partnerstvo_dpa_zabelezen", { datum: datum(p.dpaZabelezenAt) }) : t("partnerstvo_dpa_ceka")}
              </p>
            )}
            {p.odbijenoRazlog && <p className="text-xs text-kolo-danger">{t("partnerstvo_razlog")} {p.odbijenoRazlog}</p>}
            {p.prestanakRazlog && <p className="text-xs text-kolo-muted">{t("partnerstvo_razlog")} {p.prestanakRazlog}</p>}

            {p.status === "NA_PREGLEDU" && (
              <div className="space-y-2 border-t border-kolo-border pt-2">
                {/* Čl. 45 st. 1 — upozorenje, ne odluka. */}
                {p.upozorenjaDobavljaca.length > 0 && (
                  <Obavestenje vrsta="upozorenje" naslov={t("partnerstvo_dobavljac_upozorenje")}>
                    <ul className="list-disc pl-4">
                      {p.upozorenjaDobavljaca.map((u, i) => (
                        <li key={i}>{IZVOR[u.izvor]} · {datum(u.datum)} · {u.opis}{u.iznosRsd != null ? ` · ${broj(u.iznosRsd)} RSD` : ""}</li>
                      ))}
                    </ul>
                  </Obavestenje>
                )}
                {superadmin && (
                  <>
                    <label className="flex items-start gap-2 text-sm text-kolo-text">
                      <input type="checkbox" checked={!!izjava[p.id]} onChange={(e) => setIzjava((s) => ({ ...s, [p.id]: e.target.checked }))} className="mt-0.5" />
                      {t("partnerstvo_izjava_dobavljac")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Dugme velicina="sm" onClick={() => radnja(p.id, { radnja: "prihvati", izjavaNijeDobavljac: !!izjava[p.id] })}>{t("partnerstvo_prihvati")}</Dugme>
                      <Dugme velicina="sm" varijanta="opasno" onClick={() => odbij(p)}>{t("partnerstvo_odbij")}</Dugme>
                    </div>
                  </>
                )}
              </div>
            )}

            {superadmin && p.obradaPodataka && !p.dpaZabelezenAt && (p.status === "NA_PREGLEDU" || p.status === "PRIHVACENO") && (
              <Dugme velicina="sm" varijanta="sekundarno" onClick={() => radnja(p.id, { radnja: "ugovor-o-obradi" })}>{t("partnerstvo_dpa_zabelezi")}</Dugme>
            )}

            {p.ugovorTekst && (
              <details>
                <summary className="cursor-pointer text-xs font-medium text-kolo-green-700">{t("partnerstvo_ugovor")}</summary>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-kolo-text">{p.ugovorTekst}</pre>
              </details>
            )}

            {p.status === "PRIHVACENO" && superadmin && (
              <div className="flex flex-wrap items-end gap-2 border-t border-kolo-border pt-2">
                <label className="text-xs text-kolo-muted space-y-1">
                  <span className="block">{t("partnerstvo_ovlasceno_lice", { lice: p.ovlascenoLice ?? "—" })}</span>
                  <input value={ovlasti[p.id] ?? ""} onChange={(e) => setOvlasti((s) => ({ ...s, [p.id]: e.target.value }))}
                    placeholder={t("partnerstvo_pseudonim")} className={KLASE_UNOSA} />
                </label>
                <Dugme velicina="sm" varijanta="sekundarno" onClick={() => radnja(p.id, { radnja: "ovlasti", pseudonim: ovlasti[p.id] ?? "" })}>
                  {t("partnerstvo_ovlasti")}
                </Dugme>
                <Dugme velicina="sm" varijanta="opasno" onClick={() => prestanak(p)}>{t("partnerstvo_prestanak")}</Dugme>
              </div>
            )}

            {p.izvrsenja.length > 0 && (
              <ul className="space-y-1 border-t border-kolo-border pt-2">
                {p.izvrsenja.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-kolo-text">{broj(i.obim)} {p.jedinicaMere} — {i.opis}</span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-kolo-muted">
                      {STATUS_IZVRSENJA[i.status]}
                      {i.odbijenoRazlog ? ` (${i.odbijenoRazlog})` : ""}
                      {superadmin && i.status === "PRIJAVLJENO" && p.status === "PRIHVACENO" && (
                        <>
                          <Dugme velicina="sm" onClick={() => izvrsenje(i, "potvrdi")}>{t("partnerstvo_potvrdi")}</Dugme>
                          <Dugme velicina="sm" varijanta="tiho" onClick={() => izvrsenje(i, "odbij")}>{t("partnerstvo_odbij")}</Dugme>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Kartica>
        ))
      )}
    </div>
  );
}
