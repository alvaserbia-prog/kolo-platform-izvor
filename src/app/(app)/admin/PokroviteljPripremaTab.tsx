"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import { klaseKartice } from "@/components/ui/Kartica";
import { klaseDugmeta } from "@/components/ui/Dugme";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useDijalog } from "@/components/ui/Dijalog";
import { PRAVNI_OBLICI, ODNOSI_PO_OBLIKU, type PravniOblik } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { koordinateZaMesto } from "@/lib/udaljenost";
import type { TackaMesta } from "@/lib/mesta-pravila";
import MestaPredajePolja, { mestaUFormu, PRAZNO_MESTO, type MestoUnos } from "../postani-pokrovitelj/MestaPredajePolja";
import HranaPolja, { PRAZNA_HRANA, hranaUPolja, type HranaUnos } from "../postani-pokrovitelj/HranaPolja";

const MapaGazdinstava = dynamic(() => import("@/components/MapaGazdinstava"), { ssr: false });

/** Živ upis za pripremu samo prijave (iz liste upisa za administratorski tim). */
type ZivUpis = { id: string; naziv: string; status: string; obrisanAt: string | null; vlasnikPseudonim: string };

type Priprema = {
  id: string;
  naziv: string;
  korisnikPseudonim: string;
  vrstaPrijave: "NOVAC" | "DOBRA" | null;
  vrednostRsd: number | null;
  createdAt: string;
  prihvacenoAt: string | null;
  upisId: string | null;
  prijavaId: string | null;
  postojeciUpis: boolean;
  zapocetoNedovrseno: boolean;
};

const POLJE = "w-full rounded-kontrola border border-kolo-border px-2 py-1 text-sm text-kolo-text";

/**
 * Admin → Pokrovitelji → Priprema (Pravilnik o pokroviteljstvu i donacijama čl. 16 st. 6,
 * čl. 17 st. 4, čl. 18 st. 2; set 5.1.2). Samo superadmin.
 *
 * Na zahtev pokrovitelja Fondacija iz dostavljenih podataka priprema upis i, po želji,
 * prijavu za lice iz upisa koje VEĆ IMA nalog (bira se nalog — pseudonim ili mejl). Lice
 * dobija obaveštenje i sa svog naloga prihvata ili odbija; tek prihvatanjem nastaju upis i
 * prijava. 🔴 Lice koje priprema ne zastupa pokrovitelja, ne prihvata umesto njega i ne
 * dobija POEN. Za pravno lice obavezna je potvrda da je izvršeno poređenje sa registrom.
 *
 * Uz izbor „postojeći upis" priprema se samo prijava za pokrovitelja koji već ima živ upis;
 * prihvata je lice koje vodi taj upis. Prijava dobara ima isti deo o hrani i ista mesta
 * predaje (više mesta, tačka na mapi po izboru) kao prijava koju lice samo podnosi.
 */
export default function PokroviteljPripremaTab({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { dijalog, obavesti, potvrdi } = useDijalog();
  const { data: pripreme = [], refetch } = useQuery({
    queryKey: ["admin-pokroviteljstvo-priprema"],
    queryFn: async (): Promise<Priprema[]> => {
      const r = await fetch("/api/admin/pokroviteljstvo/priprema");
      if (!r.ok) throw new Error("Greška pri učitavanju");
      return (await r.json()).pripreme ?? [];
    },
  });
  const [f, setF] = useState<Record<string, string>>({ vrsta: "FIRMA", pravniOblik: "PRIVREDNO_DRUSTVO", odnosPremaDavaocu: "ZASTUPNIK", vrstaPrijave: "", dobraVrsta: "DOBRO" });
  const { data: upisi = [] } = useQuery({
    queryKey: ["admin-pokroviteljstvo-upisi-zivi"],
    queryFn: async (): Promise<ZivUpis[]> => {
      const r = await fetch("/api/admin/pokroviteljstvo/upisi");
      if (!r.ok) throw new Error("Greška pri učitavanju");
      return ((await r.json()).upisi ?? []).filter((u: ZivUpis) => u.status === "ODOBREN" && !u.obrisanAt);
    },
  });
  const [postojeci, setPostojeci] = useState(false);
  const [postojeciUpisId, setPostojeciUpisId] = useState("");
  const [tacka, setTacka] = useState<TackaMesta | null>(null);
  const [mesta, setMesta] = useState<MestoUnos[]>([PRAZNO_MESTO]);
  const [hrana, setHrana] = useState<HranaUnos>(PRAZNA_HRANA);
  const [apr, setApr] = useState(false);
  const [cenovnik, setCenovnik] = useState<File[]>([]);
  const [radi, setRadi] = useState(false);
  const postavi = (k: string) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const gazdinstvo = f.vrsta === "GAZDINSTVO";
  const oblik = (PRAVNI_OBLICI as readonly string[]).includes(f.pravniOblik) ? (f.pravniOblik as PravniOblik) : "PRIVREDNO_DRUSTVO";
  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const centarUpisa = koordinateZaMesto(f.mapaMesto ?? "");

  async function pripremi() {
    setRadi(true);
    const fd = new FormData();
    if (postojeci) fd.append("postojeciUpisId", postojeciUpisId);
    fd.append("korisnik", f.korisnik ?? "");
    fd.append(
      "upis",
      JSON.stringify({
        vrsta: f.vrsta,
        pravniOblik: gazdinstvo ? undefined : f.pravniOblik,
        odnosPremaDavaocu: gazdinstvo ? "NOSILAC_GAZDINSTVA" : f.odnosPremaDavaocu,
        imePrezime: f.imePrezime,
        naziv: f.naziv,
        bpg: gazdinstvo ? f.bpg : undefined,
        pib: gazdinstvo ? undefined : f.pib,
        maticniBroj: gazdinstvo ? undefined : f.maticniBroj,
        adresaSedista: gazdinstvo ? undefined : f.adresaSedista,
        zastupnikFunkcija: gazdinstvo ? undefined : f.zastupnikFunkcija,
        kontaktTelefon: f.kontaktTelefon,
        mapaAdresa: f.mapaAdresa,
        mapaLat: tacka?.lat,
        mapaLng: tacka?.lng,
      }),
    );
    fd.append("mapaMesto", f.mapaMesto ?? "");
    fd.append("aprUporedjeno", apr ? "true" : "false");
    fd.append("vrstaPrijave", f.vrstaPrijave ?? "");
    if (f.vrstaPrijave === "NOVAC") fd.append("vrednostRsd", f.vrednostRsd ?? "");
    if (f.vrstaPrijave === "DOBRA") {
      fd.append(
        "predmet",
        JSON.stringify({
          vrsta: f.dobraVrsta, opis: f.opis, brojVaucera: f.brojVaucera, cenaPoJedinici: f.cenaPoJedinici,
          // Hrana — ista polja i isto pravilo (`procitajPredmetDobra`) kao u prijavi.
          ...(f.dobraVrsta === "DOBRO" ? hranaUPolja(hrana) : {}),
        }),
      );
      mestaUFormu(fd, mesta, { mesto: "mestoPredaje", adresa: "adresaPredaje" });
      for (const c of cenovnik) fd.append("cenovnik", c);
    }
    const r = await fetch("/api/admin/pokroviteljstvo/priprema", { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    setRadi(false);
    if (!r.ok) {
      await obavesti(d.error ?? t("greska_generalna"));
      return;
    }
    await obavesti(t("priprema_poslato"));
    setF({ vrsta: "FIRMA", pravniOblik: "PRIVREDNO_DRUSTVO", odnosPremaDavaocu: "ZASTUPNIK", vrstaPrijave: "", dobraVrsta: "DOBRO" });
    setApr(false);
    setCenovnik([]);
    setTacka(null);
    setMesta([PRAZNO_MESTO]);
    setHrana(PRAZNA_HRANA);
    setPostojeci(false);
    setPostojeciUpisId("");
    await refetch();
    onDone?.();
  }

  async function povuci(p: Priprema) {
    if (!(await potvrdi({ poruka: t("priprema_povuci_potvrda", { naziv: p.naziv }), opasno: true, dugme: t("priprema_povuci") }))) return;
    const r = await fetch(`/api/admin/pokroviteljstvo/priprema/${p.id}`, { method: "DELETE" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) await obavesti(d.error ?? t("greska_generalna"));
    await refetch();
  }

  const unos = (k: string, oznaka: string, tip = "text") => (
    <label className="text-xs text-kolo-muted space-y-1">
      <span className="block">{oznaka}</span>
      <input type={tip} value={f[k] ?? ""} onChange={postavi(k)} className={POLJE} />
    </label>
  );

  return (
    <div className="space-y-4">
      {dijalog}
      <section className={klaseKartice({ padding: "md" }) + " space-y-3"}>
        <NaslovSekcije opis={t("priprema_opis")}>{t("priprema_naslov")}</NaslovSekcije>
        <div className="flex flex-wrap gap-4 text-sm text-kolo-text">
          <label className="flex items-center gap-2">
            <input type="radio" checked={!postojeci} onChange={() => setPostojeci(false)} />
            {t("priprema_nov_upis")}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={postojeci} onChange={() => setPostojeci(true)} />
            {t("priprema_postojeci_upis")}
          </label>
        </div>
        {postojeci ? (
          <label className="text-xs text-kolo-muted space-y-1 block">
            <span className="block">{t("priprema_postojeci_izbor")}</span>
            <select value={postojeciUpisId} onChange={(e) => setPostojeciUpisId(e.target.value)} className={POLJE}>
              <option value="">—</option>
              {upisi.map((u) => <option key={u.id} value={u.id}>{u.naziv} · {u.vlasnikPseudonim}</option>)}
            </select>
            <span className="block">{t("priprema_postojeci_napomena")}</span>
          </label>
        ) : (
        <>
        <div className="grid gap-2 sm:grid-cols-2">
          {unos("korisnik", t("priprema_korisnik"))}
          <label className="text-xs text-kolo-muted space-y-1">
            <span className="block">{t("priprema_vrsta")}</span>
            <select value={f.vrsta} onChange={postavi("vrsta")} className={POLJE}>
              <option value="FIRMA">{t("priprema_vrsta_firma")}</option>
              <option value="GAZDINSTVO">{t("priprema_vrsta_gazdinstvo")}</option>
            </select>
          </label>
          {!gazdinstvo && (
            <>
              <label className="text-xs text-kolo-muted space-y-1">
                <span className="block">{t("priprema_pravni_oblik")}</span>
                <select value={f.pravniOblik} onChange={postavi("pravniOblik")} className={POLJE}>
                  {PRAVNI_OBLICI.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              <label className="text-xs text-kolo-muted space-y-1">
                <span className="block">{t("priprema_odnos")}</span>
                <select value={f.odnosPremaDavaocu} onChange={postavi("odnosPremaDavaocu")} className={POLJE}>
                  {ODNOSI_PO_OBLIKU[oblik].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            </>
          )}
          {unos("imePrezime", t("priprema_ime"))}
          {unos("naziv", t("priprema_naziv"))}
          {gazdinstvo ? unos("bpg", t("priprema_bpg")) : (
            <>
              {unos("pib", t("priprema_pib"))}
              {unos("maticniBroj", t("priprema_mb"))}
              {unos("adresaSedista", t("priprema_sediste"))}
              {f.odnosPremaDavaocu === "ZASTUPNIK" && unos("zastupnikFunkcija", t("priprema_funkcija"))}
            </>
          )}
          {unos("kontaktTelefon", t("priprema_telefon"))}
          {unos("mapaMesto", t("priprema_mapa_mesto"))}
          {unos("mapaAdresa", t("priprema_mapa_adresa"))}
        </div>
        <p className="text-xs text-kolo-muted">{t("priprema_mapa_tacka")}</p>
        <MapaGazdinstava
          izbor={tacka}
          onIzbor={setTacka}
          centar={tacka ? [tacka.lat, tacka.lng] : centarUpisa ? [centarUpisa[0], centarUpisa[1]] : null}
          zumCentra={tacka ? 17 : 14}
          visina={260}
        />
        {!gazdinstvo && (
          <label className="flex items-center gap-2 text-xs text-kolo-text">
            <input type="checkbox" checked={apr} onChange={(e) => setApr(e.target.checked)} />
            {t("priprema_apr")}
          </label>
        )}
        </>
        )}

        <label className="text-xs text-kolo-muted space-y-1 block">
          <span className="block">{t("priprema_prijava")}</span>
          <select value={f.vrstaPrijave} onChange={postavi("vrstaPrijave")} className={POLJE}>
            {!postojeci && <option value="">{t("priprema_prijava_bez")}</option>}
            <option value="NOVAC">{t("priprema_prijava_novac")}</option>
            <option value="DOBRA">{t("priprema_prijava_dobra")}</option>
          </select>
        </label>
        {f.vrstaPrijave === "NOVAC" && <div className="grid gap-2 sm:grid-cols-2">{unos("vrednostRsd", t("priprema_iznos"), "number")}</div>}
        {f.vrstaPrijave === "DOBRA" && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs text-kolo-muted space-y-1">
              <span className="block">{t("priprema_dobro_usluga")}</span>
              <select value={f.dobraVrsta} onChange={postavi("dobraVrsta")} className={POLJE}>
                <option value="DOBRO">{t("priprema_dobro")}</option>
                <option value="USLUGA">{t("priprema_usluga")}</option>
              </select>
            </label>
            {unos("opis", t("priprema_opis_dobra"))}
            {unos("brojVaucera", t("priprema_broj_vaucera"), "number")}
            {unos("cenaPoJedinici", t("priprema_cena"), "number")}
            <div className="sm:col-span-2">
              <MestaPredajePolja mesta={mesta} onChange={setMesta} />
            </div>
            {f.dobraVrsta === "DOBRO" && (
              <div className="sm:col-span-2">
                <HranaPolja h={hrana} onChange={setHrana} />
              </div>
            )}
            <label className="text-xs text-kolo-muted space-y-1 sm:col-span-2">
              <span className="block">{t("priprema_cenovnik")}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                onChange={(e) => setCenovnik(Array.from(e.target.files ?? []))} className="text-sm" />
            </label>
          </div>
        )}
        <p className="text-xs text-kolo-muted">{t("priprema_napomena")}</p>
        <button onClick={pripremi} disabled={radi} className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
          {t("priprema_posalji")}
        </button>
      </section>

      <section className="space-y-2">
        <NaslovSekcije>{t("priprema_spisak")}</NaslovSekcije>
        {pripreme.length === 0 ? (
          <div className={klaseKartice({ padding: "nema" })}>
            <PraznoStanje naslov={t("priprema_prazno")} />
          </div>
        ) : (
          <ul className="space-y-2">
            {pripreme.map((p) => (
              <li key={p.id} className={klaseKartice({ padding: "sm" }) + " flex flex-wrap items-center justify-between gap-2 text-sm"}>
                <span>
                  <span className="font-semibold text-kolo-text">{p.naziv}</span>
                  <span className="text-kolo-muted"> · {p.korisnikPseudonim}</span>
                  {p.vrstaPrijave && (
                    <span className="text-kolo-muted">
                      {" · "}{p.vrstaPrijave === "NOVAC" ? t("priprema_prijava_novac") : t("priprema_prijava_dobra")}
                      {p.vrednostRsd != null ? ` ${broj(p.vrednostRsd)} RSD` : ""}
                    </span>
                  )}
                  {p.postojeciUpis && <span className="text-kolo-muted"> · {t("priprema_postojeci_upis")}</span>}
                  <span className="block text-xs text-kolo-muted">
                    {p.zapocetoNedovrseno ? t("priprema_nedovrseno") + " · " : ""}
                    {p.prihvacenoAt ? t("priprema_prihvaceno", { datum: new Date(p.prihvacenoAt).toLocaleDateString(intlTag(locale)) }) : t("priprema_ceka")}
                  </span>
                </span>
                {!p.prihvacenoAt && !p.zapocetoNedovrseno && (
                  <button onClick={() => povuci(p)} className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                    {t("priprema_povuci")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
