"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Pseudonim from "@/components/Pseudonim";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import AdminLogotip from "./AdminLogotip";
import { klaseDugmeta } from "@/components/ui/Dugme";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useDijalog } from "@/components/ui/Dijalog";

/**
 * Admin → Pokrovitelji → Upisi (Pravilnik o pokroviteljstvu i donacijama čl. 16–18).
 *
 * Fondacija naziv, matični broj i zastupnika upoređuje sa registrom privrednih
 * subjekata (dugme „Otvori u APR-u" + MB za kopiranje + 🔴 OBAVEZNA potvrda za
 * pravno lice i preduzetnika), beleži da je poređenje izvršeno i upis odobrava ili
 * odbija uz obrazloženje. Isto za izmenu naziva odnosno MB (čl. 18 st. 2). Gazdinstvo
 * se ne poredi sa APR-om. Iz odobrenog upisa korisnik podnosi prijave; prijava
 * dobrima i uslugama se posle toga proverava samo na cenovnik.
 */
type Upis = {
  id: string;
  vrsta: "FIRMA" | "GAZDINSTVO";
  status: "NA_PROVERI" | "ODOBREN" | "ODBIJEN";
  vlasnikPseudonim: string;
  naziv: string;
  pravniOblik: string | null;
  adresaSedista: string | null;
  maticniBroj: string | null;
  pib: string | null;
  bpg: string | null;
  imePrezime: string | null;
  zastupnikFunkcija: string | null;
  odnosPremaDavaocu: string | null;
  kontaktEmail: string | null;
  kontaktTelefon: string | null;
  logoUrl: string | null;
  mapaMesto: string | null;
  mapaAdresa: string | null;
  izjavaAdresaAt: string | null;
  izjavaOvlascenjaAt: string | null;
  potvrdaEvidentiranjaAt: string | null;
  aprProveraAt: string | null;
  odbijenoRazlog: string | null;
  izmenaNaziv: string | null;
  izmenaMaticniBroj: string | null;
  izmenaLogoUrl: string | null;
  izmenaPodnetaAt: string | null;
  obrisanAt: string | null;
  uklonjenSaRangListeAt: string | null;
  naListiZabrane: boolean;
  createdAt: string;
};

export default function PokroviteljUpisiTab() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-pokroviteljstvo-upisi"],
    queryFn: async (): Promise<{ upisi: Upis[]; aprUrl: string }> => {
      const r = await fetch("/api/admin/pokroviteljstvo/upisi");
      if (!r.ok) throw new Error("Greška pri učitavanju");
      return r.json();
    },
  });
  const [apr, setApr] = useState<Record<string, boolean>>({});
  const [radi, setRadi] = useState<string | null>(null);
  const { dijalog, unesi, obavesti } = useDijalog();
  const upisi = data?.upisi ?? [];
  const datum = (d: string | null) => (d ? new Date(d).toLocaleDateString(intlTag(locale)) : "—");

  async function radnja(kljuc: string, url: string, body: unknown) {
    setRadi(kljuc);
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setRadi(null);
    if (!r.ok) await obavesti(d.error ?? t("greska_generalna"));
    await refetch();
  }

  async function odbij(u: Upis, izmena: boolean) {
    const razlog = await unesi({
      poruka: izmena ? t("upisi_izmena_odbij_prompt") : t("upisi_odbij_prompt"),
      opasno: true,
      dugme: t("pokr_prijave_odbij_btn"),
    });
    if (!razlog?.trim()) return;
    void radnja(u.id, izmena ? `/api/admin/pokroviteljstvo/upisi/${u.id}/izmena` : `/api/admin/pokroviteljstvo/upisi/${u.id}/odbij`,
      izmena ? { odobri: false, razlog: razlog.trim() } : { razlog: razlog.trim() });
  }

  const STATUS: Record<Upis["status"], string> = {
    NA_PROVERI: t("upisi_status_na_proveri"),
    ODOBREN: t("upisi_status_odobren"),
    ODBIJEN: t("upisi_status_odbijen"),
  };

  if (isLoading) return <p className="text-sm text-kolo-muted">{t("dobra_ucitavanje")}</p>;

  return (
    <div className="space-y-3">
      {dijalog}
      <p className="text-xs text-kolo-muted">{t("upisi_uvod")}</p>
      {upisi.length === 0 && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica"><PraznoStanje naslov={t("upisi_nema")} /></div>
      )}
      {upisi.map((u) => {
        const firma = u.vrsta === "FIRMA";
        const potvrda = apr[u.id] === true;
        const izmenaRegistra = firma && !!(u.izmenaNaziv || u.izmenaMaticniBroj);
        const aprAlat = (mb: string | null) => firma && data?.aprUrl && (
          <div className="flex flex-wrap items-center gap-2">
            <a href={data.aprUrl} target="_blank" rel="noreferrer noopener"
              className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
              {t("dobra_apr_otvori")}
            </a>
            <span className="text-xs text-kolo-muted">
              {t("pokr_prijave_mb")} <span className="font-mono select-all text-kolo-text">{mb}</span>
            </span>
            <button type="button" onClick={() => void navigator.clipboard?.writeText(mb ?? "")} className={klaseDugmeta({ varijanta: "tiho", velicina: "sm" })}>
              {t("dobra_apr_kopiraj")}
            </button>
          </div>
        );
        return (
          <div key={u.id} className={`bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica p-4 space-y-2 ${u.obrisanAt ? "opacity-70" : ""}`}>
            <div className="flex items-start gap-3">
              <LogotipPokrovitelja url={u.logoUrl} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-kolo-text">
                  {u.naziv}{" "}
                  <span className="text-kolo-muted font-normal">
                    · {firma ? `PIB ${u.pib ?? "—"} · ${t("pokr_prijave_mb")} ${u.maticniBroj ?? "—"}` : `${t("dobra_gazdinstvo")} · BPG ${u.bpg ?? "—"}`}
                  </span>
                </p>
                {firma && <p className="text-xs text-kolo-muted">{t("upis_pravni_oblik")}: {u.pravniOblik ? t(`pravni_oblik_${u.pravniOblik}`) : "—"} · {t("pokr_prijave_sediste")}: {u.adresaSedista ?? "—"}</p>}
                <p className="text-xs text-kolo-muted">
                  {firma ? t("pokr_prijave_zastupnik") : t("dobra_nosilac")}: {u.imePrezime ?? "—"}
                  {u.odnosPremaDavaocu && ` (${t(`upisi_odnos_${u.odnosPremaDavaocu}`)}${u.zastupnikFunkcija ? `, ${u.zastupnikFunkcija}` : ""})`}
                  {" · "}{t.rich("upisi_vodi", { pseudonim: u.vlasnikPseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })}
                </p>
                <p className="text-xs text-kolo-muted">{t("dobra_kontakt")}: {u.kontaktEmail ?? "—"} · {u.kontaktTelefon ?? "—"}</p>
                <p className="text-xs text-kolo-muted">
                  {t("upisi_mapa")}: {u.mapaMesto ?? "—"}{u.mapaAdresa ? `, ${u.mapaAdresa}` : ""}
                  {u.izjavaAdresaAt ? ` · ${t("upisi_izjava_adresa_data")}` : ` · ${t("upisi_izjava_adresa_nema")}`}
                </p>
                <p className="text-xs text-kolo-muted">
                  {u.izjavaOvlascenjaAt && `${t("dobra_izjava_ovlascenje_data")} · `}
                  {u.potvrdaEvidentiranjaAt && `${t("dobra_potvrda_evidentiranja_data")} · `}
                  {u.aprProveraAt ? `${t("pokr_prijave_apr_uporedjen")} (${datum(u.aprProveraAt)})` : ""}
                </p>
                <p className="text-xs mt-1">
                  <span className={`font-semibold ${u.status === "ODOBREN" ? "text-kolo-green-700" : u.status === "ODBIJEN" ? "text-kolo-danger" : "text-kolo-gold-700"}`}>
                    {STATUS[u.status]}
                  </span>
                  {u.status === "ODBIJEN" && u.odbijenoRazlog && <span className="text-kolo-muted"> — {u.odbijenoRazlog}</span>}
                  {u.naListiZabrane && <span className="text-kolo-danger"> · {t("upisi_na_listi_zabrane")}</span>}
                  {u.obrisanAt && <span className="text-kolo-muted"> · {t("upisi_obrisan", { datum: datum(u.obrisanAt) })}</span>}
                  {u.uklonjenSaRangListeAt && <span className="text-kolo-muted"> · {t("upisi_uklonjen_sa_rang_liste")}</span>}
                </p>
                <AdminLogotip izvor="UPIS" id={u.id} url={u.izmenaLogoUrl ?? u.logoUrl} onUklonjen={() => void refetch()} />
              </div>
            </div>

            {u.status === "NA_PROVERI" && !u.obrisanAt && (
              <div className="space-y-2 border-t border-kolo-border pt-2">
                {aprAlat(u.maticniBroj)}
                {firma ? (
                  <label className="flex items-start gap-2 text-sm text-kolo-text">
                    <input type="checkbox" className="mt-0.5" checked={potvrda} onChange={(e) => setApr((s) => ({ ...s, [u.id]: e.target.checked }))} />
                    {t("pokr_prijave_apr_cekiraj")}
                  </label>
                ) : (
                  <p className="text-xs text-kolo-muted">{t("dobra_gazdinstvo_bez_apr")}</p>
                )}
                <div className="flex gap-2">
                  <button disabled={(firma && !potvrda) || radi === u.id}
                    onClick={() => radnja(u.id, `/api/admin/pokroviteljstvo/upisi/${u.id}/odobri`, { aprUporedjeno: potvrda })}
                    className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
                    {t("upisi_odobri")}
                  </button>
                  <button onClick={() => odbij(u, false)} disabled={radi === u.id}
                    className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                    {t("pokr_prijave_odbij_btn")}
                  </button>
                </div>
              </div>
            )}

            {u.izmenaPodnetaAt && !u.obrisanAt && (
              <div className="space-y-2 border-t border-kolo-border pt-2">
                <p className="text-sm font-semibold text-kolo-text">{t("upisi_izmena_naslov")}</p>
                {u.izmenaNaziv && <p className="text-xs text-kolo-text">{t("upisi_izmena_naziv", { naziv: u.izmenaNaziv })}</p>}
                {u.izmenaMaticniBroj && <p className="text-xs text-kolo-text">{t("upisi_izmena_mb", { mb: u.izmenaMaticniBroj })}</p>}
                {u.izmenaLogoUrl && (
                  <div className="flex items-center gap-2 text-xs text-kolo-text">{t("upisi_izmena_logo")} <LogotipPokrovitelja url={u.izmenaLogoUrl} velicina={32} /></div>
                )}
                {izmenaRegistra && aprAlat(u.izmenaMaticniBroj ?? u.maticniBroj)}
                {izmenaRegistra && (
                  <label className="flex items-start gap-2 text-sm text-kolo-text">
                    <input type="checkbox" className="mt-0.5" checked={potvrda} onChange={(e) => setApr((s) => ({ ...s, [u.id]: e.target.checked }))} />
                    {t("pokr_prijave_apr_cekiraj")}
                  </label>
                )}
                <div className="flex gap-2">
                  <button disabled={(izmenaRegistra && !potvrda) || radi === u.id}
                    onClick={() => radnja(u.id, `/api/admin/pokroviteljstvo/upisi/${u.id}/izmena`, { odobri: true, aprUporedjeno: potvrda })}
                    className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
                    {t("upisi_izmena_odobri")}
                  </button>
                  <button onClick={() => odbij(u, true)} disabled={radi === u.id}
                    className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                    {t("pokr_prijave_odbij_btn")}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
