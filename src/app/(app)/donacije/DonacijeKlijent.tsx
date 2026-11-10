"use client";

import Link from "next/link";
import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import Dugme, { klaseDugmeta } from "@/components/ui/Dugme";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Stranica from "@/components/ui/Stranica";
import Ucitavanje from "@/components/ui/Ucitavanje";
import NaslovStranice from "@/components/ui/NaslovStranice";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useDijalog } from "@/components/ui/Dijalog";
import { useEffect, useState } from "react";
import { intlTag } from "@/lib/format";
import { useTranslations, useLocale } from "next-intl";
import UplataDonacije from "./UplataDonacije";
import PosaljiPotvrdu from "./PosaljiPotvrdu";

interface Donacija {
  id: string;
  amountRSD: number;
  cumulativeRSD: number;
  level: number;
  poenEmitted: number;
  /** Set 5.0.9: NA_PROVERI = evidentirano unapred, prijem se proverava; PONISTENO = prijem nije utvrđen. */
  status: "PENDING" | "NAPLACENO" | "CONFIRMED" | "NA_PROVERI" | "PONISTENO";
  /** Poseban poziv na broj ove donacije (donacije čl. 4 st. 3); null za stare zapise. */
  pozivNaBroj: string | null;
  potvrdaPoslata: boolean;
  unapred: boolean;
  javno: boolean;
  /** Ime još stoji u listi. */
  imeObjavljeno: boolean;
  /** Potvrđena javna donacija — nudi se prevođenje u anonimnu (donacije čl. 12, set 5.1.2). */
  smePrevestiUAnonimnu: boolean;
  prevedenaUAnonimnu: boolean;
  /** Zatečena javna donacija kojoj je ime povučeno po pravilu pre seta 5.1.2. */
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
  /** Prijem je već utvrđen do praga, pa sledeća javna donacija ide unapred (donacije čl. 6 st. 5). */
  unapredOtvoren: boolean;
}



export default function DonacijeKlijent() {
  const locale = useLocale();
  const t = useTranslations("donacije");
  const tc = useTranslations("common");
  const [data, setData] = useState<DonacijeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [javno, setJavno] = useState(true);
  const [povlacenje, setPovlacenje] = useState<string | null>(null);
  const [povlacenjeGreska, setPovlacenjeGreska] = useState<string | null>(null);
  const [potvrdaZa, setPotvrdaZa] = useState<string | null>(null);
  const { dijalog, potvrdi } = useDijalog();
  useEffect(() => {
    fetch("/api/donacije")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  function osvezi() {
    fetch("/api/donacije").then((r) => r.json()).then(setData).catch(() => {});
  }

  // Prevođenje javne donacije u anonimnu (donacije čl. 12, set 5.1.2). Jednosmerno:
  // ime se briše iz zapisa, a doprinos po toj donaciji se poništava, i u minus
  // (Pravilnik čl. 17 st. 2 t. 11). Pre potvrde ekran kaže tačan broj POEN-a koji se
  // poništava i stanje zapisa posle toga — broj daje server (pregled), ne ekran.
  async function prevediUAnonimnu(id: string) {
    setPovlacenje(id);
    setPovlacenjeGreska(null);
    try {
      const pr = await fetch(`/api/donacije/${id}/povuci-ime`);
      if (!pr.ok) {
        setPovlacenjeGreska(id);
        return;
      }
      const pregled: { ponistava: number; stanjePosle: number; nivoPosle: number } = await pr.json();
      const poruka =
        t("anonimna_potvrda", { iznos: pregled.ponistava.toLocaleString(intlTag(locale)), nivo: pregled.nivoPosle }) +
        (pregled.stanjePosle < 0 ? " " + t("anonimna_potvrda_minus", { stanje: pregled.stanjePosle.toLocaleString(intlTag(locale)) }) : "");
      if (!(await potvrdi({ poruka, opasno: true }))) return;
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

  if (loading) return <Stranica><Ucitavanje className="py-12 text-center" /></Stranica>;
  if (!data) return <Stranica><Obavestenje vrsta="greska">{tc("greska_ucitavanja")}</Obavestenje></Stranica>;

  const sledeci = data.rangTabela.find((r) => r.nivo === data.trenutniNivo + 1);


  return (
    <Stranica>
      {dijalog}
      {/* Zeleno zaglavlje (odluka vlasnika 02.11.2026): rečenica o nepovratnosti,
          nivo i ukupan iznos donacija, radnja vodi na izbor uplate. */}
      <NaslovStranice
        varijanta="istaknuto"
        naslov={t("naslov")}
        opis={t("objasnjenje")}
        brojke={[
          { vrednost: t("nivo", { n: data.trenutniNivo }), oznaka: t("zaglavlje_nivo") },
          { vrednost: `${data.kumulativRSD.toLocaleString(intlTag(locale))} RSD`, oznaka: t("zaglavlje_ukupno") },
        ]}
        radnja={
          <a href="#uplata" className={klaseDugmeta({ varijanta: "sekundarno" })}>
            {t("zaglavlje_doniraj")}
          </a>
        }
      />


      {/* Udruženje ili firma doniraju kao pokrovitelji (C2, zajednica, 24.10.2026). */}
      <p className="text-sm">
        <Link href="/postani-pokrovitelj" className="inline-flex min-h-10 items-center font-semibold text-kolo-green-700 hover:underline">{t("pokrovitelj_link")}</Link>
      </p>

      {/* Vrsta donacije — javna (POEN, ime javno) ili anonimna (bez POEN). */}
      <Kartica className="space-y-2" id="uplata">
        <NaslovSekcije nivo={2}>{t("vidljivost_naslov")}</NaslovSekcije>
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

      {/* Uplata (set 5.0.9): iznos, pa IPS QR ili nalog za prenos sa računa uz poseban
          poziv na broj, pa potvrda o uplati. Kartice i gotovine nema (donacije čl. 4 st. 1). */}
      <UplataDonacije javno={javno} unapredOtvoren={data.unapredOtvoren} onPromena={osvezi} />

      {/* Koeficijent dostignutog nivoa — nivo i ukupan iznos su u zaglavlju. */}
      <Kartica className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-kolo-text">{t("trenutni_kurs")} <span className="font-normal text-kolo-muted">{t("kurs_opis")}</span></p>
          <p className="text-2xl font-bold text-kolo-gold-700">{data.trenutniKurs.toFixed(2)}</p>
        </div>
        <p className="text-xs text-kolo-muted">{t("rang_pojasnjenje")}</p>
        {sledeci && (
          <p className="text-xs text-kolo-muted">
            {t("do_nivoa", { n: sledeci.nivo, kurs: sledeci.kurs.toFixed(2) })}{" "}
            <span className="font-semibold text-kolo-text">
              {(sledeci.do - data.kumulativRSD).toLocaleString(intlTag(locale))} RSD
            </span>
          </p>
        )}
      </Kartica>

      {/* Tabela rangova — sklopljena, otvara se klikom (C2, uloga 1). */}
      <Kartica padding="nema" className="overflow-hidden">
        <details>
        <summary className="flex min-h-11 items-center px-4 py-3 border-b border-kolo-border cursor-pointer text-sm font-semibold text-kolo-text">
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
      <section className="space-y-3">
        <NaslovSekcije>{t("istorija_naslov")}</NaslovSekcije>
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
                        : d.status === "PONISTENO"
                          ? "bg-kolo-border text-kolo-muted"
                          : "bg-kolo-gold-100 text-kolo-gold-700"
                    }`}
                  >
                    {d.status === "CONFIRMED"
                      ? t("potvrdeno")
                      : d.status === "NA_PROVERI"
                        ? t("status_na_proveri")
                        : d.status === "PONISTENO"
                          ? t("status_ponisteno")
                          : d.potvrdaPoslata
                            ? t("status_ceka_fondaciju")
                            : t("status_ceka_uplatu")}
                  </span>
                  {d.pozivNaBroj && d.status === "PENDING" && (
                    <p className="text-xs text-kolo-muted mt-1 font-mono">{d.pozivNaBroj}</p>
                  )}
                  {d.status === "PENDING" && d.pozivNaBroj && !d.potvrdaPoslata && potvrdaZa !== d.id && (
                    <button type="button" onClick={() => setPotvrdaZa(d.id)} className="block ml-auto min-h-9 text-xs font-semibold text-kolo-green-700 underline">
                      {t("potvrda_dugme")}
                    </button>
                  )}
                  {potvrdaZa === d.id && (
                    <div className="mt-2 w-56 text-left">
                      <PosaljiPotvrdu donationId={d.id} onGotovo={() => { setPotvrdaZa(null); osvezi(); }} />
                    </div>
                  )}
                  {(d.status === "CONFIRMED" || d.status === "NA_PROVERI") && d.poenEmitted > 0 && !d.prevedenaUAnonimnu && (
                    <p className="text-xs text-kolo-green-700 mt-1">
                      +{tc("poen_n", { n: d.poenEmitted })}
                    </p>
                  )}
                  {/* Ugovor o donaciji (donacije čl. 14) — samo za zapise koji ga imaju;
                      zatečene donacije su nastale pre uvođenja ugovora. */}
                  {d.imaUgovor && (
                    <a
                      href={`/donacije/${d.id}/ugovor`}
                      className="text-xs text-kolo-muted underline hover:text-kolo-text mt-1 inline-flex min-h-9 items-center"
                    >
                      {t("ugovor_link")}
                    </a>
                  )}
                  {d.smePrevestiUAnonimnu && (
                    <button
                      type="button"
                      onClick={() => prevediUAnonimnu(d.id)}
                      disabled={povlacenje === d.id}
                      className="block ml-auto min-h-9 text-xs text-kolo-muted underline hover:text-kolo-text disabled:opacity-50"
                    >
                      {t("prevedi_u_anonimnu")}
                    </button>
                  )}
                  {d.prevedenaUAnonimnu ? (
                    <p className="text-xs text-kolo-muted mt-1">{t("prevedena_u_anonimnu")}</p>
                  ) : d.imePovuceno ? (
                    <p className="text-xs text-kolo-muted mt-1">{t("ime_povuceno")}</p>
                  ) : null}
                  {povlacenjeGreska === d.id && (
                    <p className="text-xs text-kolo-danger mt-1">{t("anonimna_greska")}</p>
                  )}
                </div>
              </div>
            ))}
          </Kartica>
        )}
      </section>

      {/* Javna lista donacija — javni donatori imenom, anonimni bez imena */}
      <section className="space-y-3">
        <NaslovSekcije opis={t("lista_opis")}>{t("lista_naslov")}</NaslovSekcije>
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
      </section>
    </Stranica>
  );
}
