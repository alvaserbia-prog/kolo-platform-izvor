"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import ProveraVaucera from "@/components/pokroviteljstvo/ProveraVaucera";
import type { OdnosPremaDavaocu } from "@/lib/pokroviteljstvo-dobrima-pravila";
import NovcanaPrijava from "../NovcanaPrijava";
import PrijavaDobra from "../PrijavaDobra";
import PrijavaPartnerstva from "../PrijavaPartnerstva";
import PartnerstvoUpisa from "./PartnerstvoUpisa";
import UgovoriUpisa, { IskorisceniVauceri } from "./UgovoriUpisa";
import ZaposleniUpisa from "./ZaposleniUpisa";
import PodaciUpisa from "./PodaciUpisa";
import Dugme from "@/components/ui/Dugme";
import Segmenti from "@/components/ui/Segmenti";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Stranica from "@/components/ui/Stranica";

export type UpisZaProfil = {
  id: string;
  vrsta: "FIRMA" | "GAZDINSTVO";
  status: "NA_PROVERI" | "ODOBREN" | "ODBIJEN";
  naziv: string;
  logoUrl: string | null;
  adresaSedista: string | null;
  maticniBroj: string | null;
  pib: string | null;
  bpg: string | null;
  imePrezime: string | null;
  odnosPremaDavaocu: OdnosPremaDavaocu | null;
  zastupnikFunkcija: string | null;
  kontaktEmail: string | null;
  kontaktTelefon: string | null;
  mapaMesto: string | null;
  mapaAdresa: string | null;
  mapaLat: number | null;
  mapaLng: number | null;
  imaIzjavuAdrese: boolean;
  odbijenoRazlog: string | null;
  izmenaNaziv: string | null;
  izmenaMaticniBroj: string | null;
  izmenaLogoUrl: string | null;
  izmenaNaProveri: boolean;
  izmenaOdbijenaRazlog: string | null;
};

type KodNespremnosti = "NIJE_ODOBREN" | "ZABRANA" | "NEPOTPUN" | "NIJE_UCESNIK";
type Tab = "ugovori" | "partnerstvo" | "vauceri" | "zaposleni" | "podaci";
const TABOVI: Tab[] = ["ugovori", "partnerstvo", "vauceri", "zaposleni", "podaci"];

/**
 * Stranica pokrovitelja — upis (donacije čl. 16) koji korisnik vodi.
 *
 * 🔴 „Doniraj novac" i „Doniraj robu ili usluge" su dostupni samo iz odobrenog
 * upisa (server ponovo proverava u obe rute). Novčano pokroviteljstvo daje pravno
 * lice, preduzetnik ili nosilac registrovanog gazdinstva (čl. 15, set 4.7.9); lista
 * zabrane zatvara samo nov ugovor o pokroviteljstvu dobrima i uslugama (čl. 35 st. 5).
 */
export default function UpisProfil({
  upis,
  naListiZabrane,
  novac,
  dobra,
  partnerstvo,
}: {
  upis: UpisZaProfil;
  naListiZabrane: boolean;
  novac: KodNespremnosti | null;
  dobra: KodNespremnosti | null;
  /** Set 5.1.2 — prijava partnerstva (donacije čl. 41 st. 1). */
  partnerstvo: KodNespremnosti | null;
}) {
  const t = useTranslations("postaniPokrovitelj");
  const sp = useSearchParams();
  const pocetni = TABOVI.includes(sp.get("tab") as Tab) ? (sp.get("tab") as Tab) : "ugovori";
  const [tab, setTab] = useState<Tab>(pocetni);
  const [panel, setPanel] = useState<"novac" | "dobra" | "partnerstvo" | null>(null);
  const [osvezi, setOsvezi] = useState(0);
  const posle = useCallback(() => { setPanel(null); setTab("ugovori"); setOsvezi((n) => n + 1); }, []);
  const poslePartnerstva = useCallback(() => { setPanel(null); setTab("partnerstvo"); setOsvezi((n) => n + 1); }, []);

  const STATUS: Record<UpisZaProfil["status"], string> = {
    NA_PROVERI: t("upis_status_na_proveri"),
    ODOBREN: t("upis_status_odobren"),
    ODBIJEN: t("upis_status_odbijen"),
  };
  const RAZLOG: Record<KodNespremnosti, string> = {
    NIJE_ODOBREN: t("razlog_nije_odobren"),
    ZABRANA: t("razlog_zabrana"),
    NEPOTPUN: t("razlog_nepotpun"),
    NIJE_UCESNIK: t("razlog_nije_ucesnik"),
  };
  const NASLOV_TABA: Record<Tab, string> = {
    ugovori: t("tab_ugovori"),
    partnerstvo: t("tab_partnerstvo"),
    vauceri: t("tab_vauceri"),
    zaposleni: t("tab_zaposleni"),
    podaci: t("tab_podaci"),
  };

  return (
    <Stranica>
      <NaslovStranice
        nazad={{ href: "/postani-pokrovitelj", oznaka: t("naslov") }}
        slika={<LogotipPokrovitelja url={upis.logoUrl} velicina={64} />}
        naslov={upis.naziv}
        opis={
          <>
            {upis.vrsta === "GAZDINSTVO" ? t("upis_vrsta_gazdinstvo") : t("upis_vrsta_firma")}
            {" · "}
            <span className={upis.status === "ODOBREN" ? "text-kolo-green-700 font-semibold" : upis.status === "ODBIJEN" ? "text-kolo-danger font-semibold" : "text-kolo-gold-700 font-semibold"}>
              {STATUS[upis.status]}
            </span>
            {upis.izmenaNaProveri && ` · ${t("upis_izmena_na_proveri")}`}
          </>
        }
      />
      {upis.status === "ODBIJEN" && upis.odbijenoRazlog && (
        <p className="text-xs text-kolo-danger">{t("odbijena_razlog")} {upis.odbijenoRazlog}</p>
      )}
      {naListiZabrane && <p className="text-xs text-kolo-danger">{t("razlog_zabrana")}</p>}

      <div className="flex flex-wrap gap-2">
        <Dugme onClick={() => setPanel(panel === "novac" ? null : "novac")} disabled={!!novac}>
          {t("doniraj_novac")}
        </Dugme>
        <Dugme varijanta="sekundarno" onClick={() => setPanel(panel === "dobra" ? null : "dobra")} disabled={!!dobra}>
          {t("doniraj_dobra")}
        </Dugme>
        <Dugme varijanta="sekundarno" onClick={() => setPanel(panel === "partnerstvo" ? null : "partnerstvo")} disabled={!!partnerstvo}>
          {t("partnerstvo_dugme")}
        </Dugme>
      </div>
      {(novac || dobra) && (
        <p className="text-xs text-kolo-muted">
          {novac && dobra && novac === dobra ? RAZLOG[novac] : [novac && `${t("doniraj_novac")}: ${RAZLOG[novac]}`, dobra && `${t("doniraj_dobra")}: ${RAZLOG[dobra]}`].filter(Boolean).join(" · ")}
        </p>
      )}

      {panel === "novac" && !novac && <NovcanaPrijava upisId={upis.id} onPoslato={posle} />}
      {panel === "partnerstvo" && !partnerstvo && <PrijavaPartnerstva upisId={upis.id} onPoslato={poslePartnerstva} />}
      {panel === "dobra" && !dobra && <PrijavaDobra upisId={upis.id} mesto={upis.mapaMesto} adresa={upis.mapaAdresa} onPoslato={posle} />}

      <nav className="overflow-x-auto">
        <Segmenti
          oznaka={upis.naziv}
          opcije={TABOVI.map((x) => ({ vrednost: x, oznaka: <span className="whitespace-nowrap">{NASLOV_TABA[x]}</span> }))}
          vrednost={tab}
          onPromena={setTab}
        />
      </nav>

      {tab === "ugovori" && <UgovoriUpisa key={osvezi} upisId={upis.id} />}
      {tab === "partnerstvo" && <PartnerstvoUpisa key={osvezi} upisId={upis.id} />}
      {tab === "vauceri" && (
        <div className="space-y-4">
          <ProveraVaucera onRealizovano={() => setOsvezi((n) => n + 1)} />
          <IskorisceniVauceri key={osvezi} upisId={upis.id} />
        </div>
      )}
      {tab === "zaposleni" && <ZaposleniUpisa upisId={upis.id} />}
      {tab === "podaci" && <PodaciUpisa upis={upis} />}
    </Stranica>
  );
}
