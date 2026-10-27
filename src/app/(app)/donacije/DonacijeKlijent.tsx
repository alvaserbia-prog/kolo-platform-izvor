"use client";

import Link from "next/link";
import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Segmenti from "@/components/ui/Segmenti";
import { RACUN_FONDACIJE } from "@/lib/placanje/racun-fondacije";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";
import { useEffect, useState } from "react";
import { intlTag } from "@/lib/format";
import { useTranslations, useLocale } from "next-intl";
import IpsQrPlacanje from "./IpsQrPlacanje";
import { MAX_KARTICNA_UPLATA_RSD } from "@/lib/donacija-pravila";
import { dogadjaj } from "@/lib/analitika";

interface Donacija {
  id: string;
  amountRSD: number;
  cumulativeRSD: number;
  level: number;
  poenEmitted: number;
  status: "PENDING" | "CONFIRMED";
  javno: boolean;
  /** Ime još stoji u listi — tada se nudi povlačenje (donacije čl. 12). */
  imeObjavljeno: boolean;
  imePovuceno: boolean;
  imaUgovor: boolean;
  createdAt: string;
}

interface JavnaDonacija {
  id: string;
  ime: string | null;
  anonimno: boolean;
  /** Javna donacija kojoj je donator povukao ime, ili je nalog ugašen. */
  imePovuceno: boolean;
  /** 🔴 Lista nosi ime, iznos i datum — nikad pseudonim ni vezu ka profilu
   *  (donacije čl. 11, set 4.8.2); ruta šalje oba polja kao `null`. */
  pseudonim: null;
  userId: null;
  /** 🔴 Bez broja POEN-a i nivoa — RSD i POEN u istom redu daju odnos (R-01). */
  amountRSD: number;
  createdAt: string;
}

interface RangRed {
  nivo: number;
  do: number;
  kurs: number;
}

interface DonacijeData {
  trenutniNivo: number;
  trenutniKurs: number;
  kumulativRSD: number;
  donatorskiBroj: number;
  pozivNaBroj: string; // trajni broj člana za uplate, prikaz "42-15" (model 97)
  racun: string | null; // iz IPS konfiguracije (18 cifara) — null dok se račun ne otvori
  donacije: Donacija[];
  listaZakljucana: boolean;
  listaDonacija: JavnaDonacija[];
  rangTabela: RangRed[];
}


/** Prikaz računa 18 cifara u standardnom obliku 3-13-2. */
function formatRacun(racun: string): string {
  const c = racun.replace(/\D/g, "");
  return c.length === 18 ? `${c.slice(0, 3)}-${c.slice(3, 16)}-${c.slice(16)}` : racun;
}

export default function DonacijeKlijent() {
  const locale = useLocale();
  const t = useTranslations("donacije");
  const tc = useTranslations("common");
  const [data, setData] = useState<DonacijeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [kopirano, setKopirano] = useState(false);
  const [iznosKartica, setIznosKartica] = useState("");
  // Plaćanje karticom i IPS još nisu uključeni — podrazumevano je uplatnica.
  const [nacin, setNacin] = useState<"ips" | "kartica" | "uplatnica">("uplatnica");
  const [javno, setJavno] = useState(true);
  const [karticaLoading, setKarticaLoading] = useState(false);
  const [karticaGreska, setKarticaGreska] = useState<string | null>(null);
  // Izjava o nepovratnosti (R-01, mera M-11) — traži se PRE naplate i snima se
  // na zapis donacije kao dokaz u sporu po osporenoj kartičnoj transakciji.
  const [nepovratnost, setNepovratnost] = useState(false);
  const [ishod, setIshod] = useState<"uspeh" | "neuspeh" | "greska" | null>(null);
  const [povlacenje, setPovlacenje] = useState<string | null>(null);
  const [povlacenjeGreska, setPovlacenjeGreska] = useState<string | null>(null);
  const { dijalog, potvrdi } = useDijalog();
  useEffect(() => {
    fetch("/api/donacije")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
    const p = new URLSearchParams(window.location.search).get("placanje");
    if (p === "uspeh" || p === "neuspeh" || p === "greska") setIshod(p);
  }, []);

  async function zapocniKarticno() {
    setKarticaGreska(null);
    const iznos = Math.round(Number(iznosKartica));
    if (!Number.isFinite(iznos) || iznos < 100) {
      setKarticaGreska(t("karticno_min_iznos"));
      return;
    }
    if (iznos > MAX_KARTICNA_UPLATA_RSD) {
      setKarticaGreska(t("karticno_kapa", { max: MAX_KARTICNA_UPLATA_RSD.toLocaleString(intlTag(locale)) }));
      return;
    }
    if (!nepovratnost) {
      setKarticaGreska(t("karticno_nepovratnost_obavezna"));
      return;
    }
    setKarticaLoading(true);
    try {
      const r = await fetch("/api/donacije/placanje/zapocni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iznosRSD: iznos, javno, nepovratnost: true }),
      });
      const j = await r.json();
      if (!r.ok) {
        setKarticaGreska(j.error ?? t("karticno_nije_moguce"));
        return;
      }
      // Bez iznosa i bez javnosti donacije.
      dogadjaj("donacija_zapoceta", { kanal: "kartica" });
      // Auto-submit forme ka NestPay gateway-u banke (preusmeravanje na 3D stranicu).
      const forma = document.createElement("form");
      forma.method = "POST";
      forma.action = j.gatewayUrl;
      for (const [k, v] of Object.entries(j.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        forma.appendChild(input);
      }
      document.body.appendChild(forma);
      forma.submit();
    } catch {
      setKarticaGreska(t("karticno_greska_komunikacije"));
      setKarticaLoading(false);
    }
  }

  // Povlačenje imena iz liste (donacije čl. 12). Jednosmerno — ime se briše iz
  // zapisa, pa se pre slanja traži potvrda.
  async function povuciIme(id: string) {
    if (!(await potvrdi({ poruka: t("povuci_ime_potvrda"), opasno: true }))) return;
    setPovlacenje(id);
    setPovlacenjeGreska(null);
    try {
      const r = await fetch(`/api/donacije/${id}/povuci-ime`, { method: "POST" });
      if (!r.ok) {
        setPovlacenjeGreska(id);
        return;
      }
      const sveze = await fetch("/api/donacije").then((x) => x.json());
      setData(sveze);
    } catch {
      setPovlacenjeGreska(id);
    } finally {
      setPovlacenje(null);
    }
  }

  if (loading) return <div className="max-w-xl mx-auto py-12 text-center text-kolo-muted text-sm">{tc("ucitavanje")}</div>;
  if (!data) return <div className="max-w-xl mx-auto py-12 text-center text-kolo-danger text-sm">{tc("greska_ucitavanja")}</div>;

  const sledeci = data.rangTabela.find((r) => r.nivo === data.trenutniNivo + 1);

  const prikazRacuna = formatRacun(data.racun || RACUN_FONDACIJE);

  function kopirajPodatke() {
    const tekst = t("kopiraj_tekst", { racun: prikazRacuna, poziv: data!.pozivNaBroj });
    navigator.clipboard.writeText(tekst).then(() => {
      setKopirano(true);
      setTimeout(() => setKopirano(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {dijalog}
      <NaslovStranice naslov={t("naslov")} />

      {/* Ishod kartičnog plaćanja (povratak sa gateway-a) */}
      {ishod === "uspeh" && (
        <Obavestenje vrsta="uspeh">{t("placanje_uspeh")}</Obavestenje>
      )}
      {ishod === "neuspeh" && (
        <Obavestenje vrsta="upozorenje">{t("placanje_neuspeh")}</Obavestenje>
      )}
      {ishod === "greska" && (
        <Obavestenje vrsta="greska">{t("placanje_greska")}</Obavestenje>
      )}

      {/* Beta napomena */}
      <Obavestenje vrsta="upozorenje" naslov={t("beta_naslov")}>
        <p>{t("beta_opis")}</p>
      </Obavestenje>

      {/* Objašnjenje */}
      <Kartica>
        <p className="text-sm text-kolo-muted">{t("objasnjenje")}</p>
      </Kartica>

      {/* Udruženje ili firma doniraju kao pokrovitelji (C2, zajednica, 24.10.2026). */}
      <p className="text-sm">
        <Link href="/postani-pokrovitelj" className="font-semibold text-kolo-green-700 hover:underline">{t("pokrovitelj_link")}</Link>
      </p>

      {/* Vrsta donacije — javna (POEN, ime javno) ili anonimna (bez POEN); važi za IPS i karticu */}
      <Kartica className="space-y-2">
        <p className="text-sm font-semibold text-kolo-text">{t("vidljivost_naslov")}</p>
        <label className={`flex items-start gap-2 rounded-kontrola border p-3 cursor-pointer transition-colors ${javno ? "border-kolo-green-700/50 bg-kolo-green-100/40" : "border-kolo-border"}`}>
          <input type="radio" name="vidljivost" checked={javno} onChange={() => setJavno(true)} className="mt-0.5" />
          <span className="text-xs">
            <span className="font-semibold text-kolo-text">{t("vidljivost_javna")}</span>
            <span className="block text-kolo-muted mt-0.5">{t("vidljivost_javna_opis")}</span>
          </span>
        </label>
        <label className={`flex items-start gap-2 rounded-kontrola border p-3 cursor-pointer transition-colors ${!javno ? "border-kolo-green-700/50 bg-kolo-green-100/40" : "border-kolo-border"}`}>
          <input type="radio" name="vidljivost" checked={!javno} onChange={() => setJavno(false)} className="mt-0.5" />
          <span className="text-xs">
            <span className="font-semibold text-kolo-text">{t("vidljivost_anonimna")}</span>
            <span className="block text-kolo-muted mt-0.5">{t("vidljivost_anonimna_opis")}</span>
          </span>
        </label>
        {javno && (
          <Obavestenje vrsta="upozorenje">{t("vidljivost_upozorenje")}</Obavestenje>
        )}
      </Kartica>

      {/* Način plaćanja (C2, uloga 1, 24.10.2026): tri načina kao jezičci, vidi se
          samo izabrani — ranije su sva tri stajala jedan ispod drugog. */}
      <Segmenti
        oznaka={t("nacin_oznaka")}
        punaSirina
        vrednost={nacin}
        onPromena={setNacin}
        opcije={[
          { vrednost: "ips", oznaka: t("nacin_ips") },
          { vrednost: "kartica", oznaka: t("nacin_kartica") },
          { vrednost: "uplatnica", oznaka: t("nacin_uplatnica") },
        ]}
      />

      {/* IPS QR — instant dinarska uplata skeniranjem mobilnom bankom */}
      {nacin === "ips" && <IpsQrPlacanje javno={javno} />}

      {/* Kartično plaćanje (Banca Intesa / OTP — NestPay) */}
      {nacin === "kartica" && (
      <Kartica className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-kolo-text">{t("karticno_naslov")}</p>
          <p className="text-xs text-kolo-muted mt-0.5">
            {t("karticno_opis")}
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="numeric"
              min={100}
              step={100}
              max={MAX_KARTICNA_UPLATA_RSD}
              value={iznosKartica}
              onChange={(e) => setIznosKartica(e.target.value)}
              placeholder={t("karticno_iznos_placeholder")}
              aria-label={t("karticno_iznos_placeholder")}
              className={`${KLASE_UNOSA} pr-12`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-kolo-muted">RSD</span>
          </div>
          <Dugme onClick={zapocniKarticno} disabled={karticaLoading} className="min-h-11">
            {karticaLoading ? t("karticno_otvaram") : t("karticno_plati")}
          </Dugme>
        </div>
        <label className="flex items-start gap-2 text-xs text-kolo-muted cursor-pointer">
          <input
            type="checkbox"
            checked={nepovratnost}
            onChange={(e) => setNepovratnost(e.target.checked)}
            className="mt-0.5"
          />
          <span>{t("karticno_nepovratnost")}</span>
        </label>
        <p className="text-xs text-kolo-muted">
          {t("karticno_kapa_napomena", { max: MAX_KARTICNA_UPLATA_RSD.toLocaleString(intlTag(locale)) })}
        </p>
        {karticaGreska && <Obavestenje vrsta="greska">{karticaGreska}</Obavestenje>}
        {/* Čl. 3 Pravilnika o pokroviteljstvu i donacijama: doprinos se evidentira
            isključivo onome čijim je sredstvima uplata izvršena. Kod kartice se
            uplatilac ne vidi iz izvoda, pa izjavu daje sam donator. */}
        <p className="text-xs text-kolo-muted">{t("karticno_sopstvena_kartica")}</p>
      </Kartica>
      )}

      {/* Instrukcije za uplatu */}
      {nacin === "uplatnica" && (
      <Kartica className="space-y-4">
        <p className="text-sm font-semibold text-kolo-text">{t("instrukcije")}</p>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-kolo-muted">{t("primalac")}</span>
            <span className="font-medium text-kolo-text">{t("primalac_vrednost")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-kolo-muted">{t("racun")}</span>
            <span className="font-mono text-kolo-text">{prikazRacuna}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-kolo-muted">{t("svrha")}</span>
            <span className="font-medium text-kolo-text">{t("svrha_vrednost")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-kolo-muted">{t("model")}</span>
            <span className="font-mono text-kolo-text">97</span>
          </div>
          <div className="flex justify-between">
            <span className="text-kolo-muted">{t("poziv_na_broj")}</span>
            <span className="font-mono font-semibold text-kolo-green-700">{data.pozivNaBroj}</span>
          </div>
        </div>
        <Obavestenje vrsta="info">{t("vas_broj_opis")}</Obavestenje>
        {/* Kad se upisuje POEN — isto kao kod IPS-a i kartice (mera M-4a). */}
        {javno && <p className="text-xs text-kolo-muted">{t("uplatnica_poen")}</p>}
        <div className="pt-2 border-t border-kolo-border">
          <p className="text-xs text-kolo-muted mb-3">{t("napomena_uplata")}</p>
          <Dugme punaSirina onClick={kopirajPodatke}>
            {kopirano ? t("kopirano") : t("kopiraj_btn")}
          </Dugme>
        </div>
      </Kartica>
      )}

      {/* Rang */}
      <Kartica>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-kolo-text">{t("vas_rang")}</p>
            <p className="text-3xl font-bold text-kolo-green-700 mt-1">{t("nivo", { n: data.trenutniNivo })}</p>
            <p className="text-xs text-kolo-muted mt-0.5">
              {t("kumulativ")} {data.kumulativRSD.toLocaleString(intlTag(locale))} RSD
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-kolo-muted">{t("trenutni_kurs")}</p>
            <p className="text-2xl font-bold text-kolo-gold-700">{data.trenutniKurs.toFixed(2)}</p>
            <p className="text-xs text-kolo-muted">{t("kurs_opis")}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-kolo-border space-y-1">
          <p className="text-xs text-kolo-muted">{t("rang_pojasnjenje")}</p>
          {sledeci && (
            <p className="text-xs text-kolo-muted">
              {t("do_nivoa", { n: sledeci.nivo, kurs: sledeci.kurs.toFixed(2) })}{" "}
              <span className="font-semibold text-kolo-text">
                {(sledeci.do - data.kumulativRSD).toLocaleString(intlTag(locale))} RSD
              </span>
            </p>
          )}
        </div>
      </Kartica>

      {/* Tabela rangova — sklopljena, otvara se klikom (C2, uloga 1). */}
      <Kartica padding="nema" className="overflow-hidden">
        <details>
        <summary className="px-4 py-3 border-b border-kolo-border cursor-pointer text-sm font-semibold text-kolo-text">
          {t("tabela_naslov")}
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-sm">
            <thead>
              <tr className="bg-kolo-bg border-b border-kolo-border">
                <th className="px-4 py-2 text-left text-xs font-medium text-kolo-muted">{t("tabela_nivo")}</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-kolo-muted">{t("tabela_do")}</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-kolo-muted">{t("tabela_kurs")}</th>
              </tr>
            </thead>
            <tbody>
              {data.rangTabela.map((r) => {
                const active = r.nivo === data.trenutniNivo;
                return (
                  <tr
                    key={r.nivo}
                    className={`border-b border-kolo-border last:border-0 ${active ? "bg-kolo-green-100/50" : ""}`}
                  >
                    <td className={`px-4 py-2.5 font-medium ${active ? "text-kolo-green-900" : "text-kolo-text"}`}>
                      {r.nivo}
                      {active && <span className="ml-2 text-xs text-kolo-green-700 font-semibold">{t("vas_nivo_oznaka")}</span>}
                    </td>
                    <td className={`px-4 py-2.5 text-right text-xs ${active ? "text-kolo-green-900" : "text-kolo-muted"}`}>
                      {r.do.toLocaleString(intlTag(locale))}
                    </td>
                    <td className={`px-4 py-2.5 text-right ${active ? "text-kolo-green-700 font-semibold" : "text-kolo-muted"}`}>
                      {r.kurs.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </details>
      </Kartica>

      {/* Istorija donacija */}
      <div>
        <h2 className="text-base font-semibold text-kolo-text mb-3">{t("istorija_naslov")}</h2>
        {data.donacije.length === 0 ? (
          <Kartica padding="nema">
            <PraznoStanje kompaktno naslov={t("nema_donacija")} />
          </Kartica>
        ) : (
          <Kartica padding="nema" className="overflow-hidden">
            {data.donacije.map((d, i) => (
              <div
                key={d.id}
                className={`px-4 py-3 flex items-center justify-between ${i < data.donacije.length - 1 ? "border-b border-kolo-border" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium text-kolo-text">
                    {d.amountRSD.toLocaleString(intlTag(locale))} RSD
                  </p>
                  <p className="text-xs text-kolo-muted mt-0.5">
                    {new Date(d.createdAt).toLocaleDateString(intlTag(locale))} · {t("nivo", { n: d.level })}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${
                      d.status === "CONFIRMED"
                        ? "bg-kolo-green-100 text-kolo-green-700"
                        : "bg-kolo-gold-100 text-kolo-gold-700"
                    }`}
                  >
                    {d.status === "CONFIRMED" ? t("potvrdeno") : t("ceka_potvrdu")}
                  </span>
                  {d.status === "CONFIRMED" && (
                    <p className="text-xs text-kolo-green-700 mt-1">
                      +{d.poenEmitted.toLocaleString(intlTag(locale))} {tc("poen")}
                    </p>
                  )}
                  {/* Ugovor o donaciji (donacije čl. 14) — samo za zapise koji ga imaju;
                      zatečene donacije su nastale pre uvođenja ugovora. */}
                  {d.imaUgovor && (
                    <a
                      href={`/donacije/${d.id}/ugovor`}
                      className="text-xs text-kolo-muted underline hover:text-kolo-text mt-1 inline-block"
                    >
                      {t("ugovor_link")}
                    </a>
                  )}
                  {d.imeObjavljeno && (
                    <button
                      type="button"
                      onClick={() => povuciIme(d.id)}
                      disabled={povlacenje === d.id}
                      className="block ml-auto min-h-9 text-xs text-kolo-muted underline hover:text-kolo-text disabled:opacity-50"
                    >
                      {t("povuci_ime")}
                    </button>
                  )}
                  {d.imePovuceno && (
                    <p className="text-xs text-kolo-muted mt-1">{t("ime_povuceno")}</p>
                  )}
                  {povlacenjeGreska === d.id && (
                    <p className="text-xs text-kolo-danger mt-1">{t("povuci_ime_greska")}</p>
                  )}
                </div>
              </div>
            ))}
          </Kartica>
        )}
      </div>

      {/* Javna lista donacija — javni donatori imenom, anonimni bez imena */}
      <div>
        <h2 className="text-base font-semibold text-kolo-text mb-1">{t("lista_naslov")}</h2>
        <p className="text-xs text-kolo-muted mb-3">{t("lista_opis")}</p>
        {data.listaZakljucana ? (
          <Kartica padding="nema">
            <PraznoStanje kompaktno naslov={t("lista_zakljucana")} />
          </Kartica>
        ) : data.listaDonacija.length === 0 ? (
          <Kartica padding="nema">
            <PraznoStanje kompaktno naslov={t("lista_prazno")} />
          </Kartica>
        ) : (
          <Kartica padding="nema" className="overflow-hidden">
            {data.listaDonacija.map((d, i) => (
              <div
                key={d.id}
                className={`px-4 py-3 flex items-center justify-between ${i < data.listaDonacija.length - 1 ? "border-b border-kolo-border" : ""}`}
              >
                <div>
                  <p className="text-sm font-medium text-kolo-text">
                    {d.anonimno
                      ? t("lista_anoniman")
                      : d.ime || (d.imePovuceno ? t("lista_ime_povuceno") : t("lista_anoniman"))}
                  </p>
                  <p className="text-xs text-kolo-muted mt-0.5">
                    {new Date(d.createdAt).toLocaleDateString(intlTag(locale))} · {d.amountRSD.toLocaleString(intlTag(locale))} RSD
                  </p>
                </div>
              </div>
            ))}
          </Kartica>
        )}
      </div>

    </div>
  );
}
