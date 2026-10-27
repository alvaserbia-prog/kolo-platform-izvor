"use client";

import { useDijalog } from "@/components/ui/Dijalog";
import { useState } from "react";
import { intlTag } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";

type Osnivac = {
  id: string;
  redniBroj: number;
  udeoBrojilac: number;
  udeoImenilac: number;
  napomena: string | null;
  user: { pseudonim: string; email?: string };
};

type Kanal = {
  brojKoraka: number;
  zatvoren: boolean;
  osnivaciZakljucani: boolean;
};

type Status = {
  ukupnoEvidentirano: number;
  brojKoraka: number;
  ukupnoKoraka?: number;
  zatvoren: boolean;
  poslednjiPrag: number;
  gornjaGranica: number;
  preostalo: number;
  procenatIskoriscenja: number;
  ukupanPoenUSistemu: number;
  sledeciPrag: number;
  osnivaciZakljucani?: boolean;
};

const fmt = (n: number, locale: string) => n.toLocaleString(intlTag(locale));

export default function OsnivaciTab({
  verifikovaniKorisnici,
}: {
  verifikovaniKorisnici: { id: string; pseudonim: string }[];
  onDone: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const { dijalog, potvrdi, obavesti } = useDijalog();
  // Dva odvojena upita: pad statusa kanala ne sme da sakrije listu osnivača
  // (inače lista deluje prazno i admin duplira unos → P2002 na serveru).
  const { data: listaData, isLoading: ucitavanje, error: greskaListe, refetch: refetchLista } = useQuery({
    queryKey: ["admin-osnivaci"],
    queryFn: async (): Promise<{ osnivaci: Osnivac[]; kanal: Kanal | null }> => {
      const res = await fetch("/api/admin/osnivaci");
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? t("osnivaci_greska_ucitavanja"));
      return { osnivaci: d.osnivaci ?? [], kanal: d.kanal ?? null };
    },
  });
  const { data: statusData, error: greskaStatusa, refetch: refetchStatus } = useQuery({
    queryKey: ["admin-osnivacki-status"],
    queryFn: async (): Promise<Status | null> => {
      const res = await fetch("/api/javno/osnivacki-doprinos");
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? t("osnivaci_greska_ucitavanja"));
      return d.status ?? null;
    },
  });
  const refetch = () => Promise.all([refetchLista(), refetchStatus()]);
  const osnivaci = listaData?.osnivaci ?? [];
  const kanal = listaData?.kanal ?? null;
  const status = statusData ?? null;
  const [radnja, setRadnja] = useState<string | null>(null);

  // Revizija kanala doprinosa za prvi oglas (Pravilnik čl. 38) — učitava se NA ZAHTEV:
  // prolazi kroz sve oglase i sve zapise, pa nema razloga da se vrti svaki put
  // kad neko otvori Osnivače.
  type RevizijaStavka = { userId: string; pseudonim: string; oglasId?: string };
  const [revizija, setRevizija] = useState<{
    kvalifikovanih: number;
    saZapisom: number;
    nedostaju: RevizijaStavka[];
    bezMinimuma: Array<RevizijaStavka & { razlog: string }>;
    zabelezenVerifikovan: RevizijaStavka[];
    zabelezenNeverifikovan: number;
    evidentiranBezObavestenja: RevizijaStavka[];
    evidentiranBezTransakcije: RevizijaStavka[];
    ponisten: number;
    evidentiranoPoen: number;
  } | null>(null);

  // Čita, ne menja ništa — prvo se vidi kome doprinos fali, pa se tek onda
  // pokreće ispravka; obrnut redosled bi značio emisiju naslepo.
  async function ucitajReviziju() {
    setRadnja("revizija");
    const res = await fetch("/api/admin/doprinos-sadrzaju/zatecene");
    const d = await res.json().catch(() => ({}));
    setRadnja(null);
    if (res.ok) setRevizija(d);
    else await obavesti(d.error ?? t("greska_generalna"));
  }

  // Forma za dodavanje
  const [userId, setUserId] = useState("");
  const [brojilac, setBrojilac] = useState("");
  const [imenilac, setImenilac] = useState("");
  const [redniBroj, setRedniBroj] = useState("");
  const [napomena, setNapomena] = useState("");
  const [greska, setGreska] = useState("");

  // Inline izmena reda
  const [izmenaId, setIzmenaId] = useState<string | null>(null);
  const [izRedniBroj, setIzRedniBroj] = useState("");
  const [izBrojilac, setIzBrojilac] = useState("");
  const [izImenilac, setIzImenilac] = useState("");
  const [izNapomena, setIzNapomena] = useState("");
  const [greskaIzmene, setGreskaIzmene] = useState("");

  const aktiviran = (kanal?.brojKoraka ?? status?.brojKoraka ?? 0) > 0;
  const zakljucano = kanal?.osnivaciZakljucani ?? status?.osnivaciZakljucani ?? false;
  const izmeneDozvoljene = !aktiviran && !zakljucano;
  const zbirBrojilaca = osnivaci.reduce((s, o) => s + o.udeoBrojilac, 0);
  const zajednickiImenilac = osnivaci[0]?.udeoImenilac ?? 0;
  const sviIstiImenilac = osnivaci.every((o) => o.udeoImenilac === zajednickiImenilac);
  const udeliValidni = osnivaci.length > 0 && sviIstiImenilac && zbirBrojilaca === zajednickiImenilac;

  async function dodaj() {
    setGreska("");
    setRadnja("dodaj");
    const res = await fetch("/api/admin/osnivaci", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        udeoBrojilac: Number(brojilac),
        udeoImenilac: Number(imenilac),
        redniBroj: Number(redniBroj),
        napomena: napomena.trim() || undefined,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setRadnja(null);
    if (res.ok) {
      setUserId(""); setBrojilac(""); setImenilac(""); setRedniBroj(""); setNapomena("");
      await refetch();
    } else {
      setGreska(d.error ?? t("osnivaci_greska_dodavanja"));
    }
  }

  function pocniIzmenu(o: Osnivac) {
    setGreskaIzmene("");
    setIzmenaId(o.id);
    setIzRedniBroj(String(o.redniBroj));
    setIzBrojilac(String(o.udeoBrojilac));
    setIzImenilac(String(o.udeoImenilac));
    setIzNapomena(o.napomena ?? "");
  }

  async function sacuvajIzmenu() {
    if (!izmenaId) return;
    setGreskaIzmene("");
    setRadnja("izmena");
    const res = await fetch(`/api/admin/osnivaci/${izmenaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        udeoBrojilac: Number(izBrojilac),
        udeoImenilac: Number(izImenilac),
        redniBroj: Number(izRedniBroj),
        napomena: izNapomena.trim() || undefined,
      }),
    });
    const d = await res.json().catch(() => ({}));
    setRadnja(null);
    if (res.ok) {
      setIzmenaId(null);
      await refetch();
    } else {
      setGreskaIzmene(d.error ?? t("osnivaci_greska_izmene"));
    }
  }

  async function obrisi(id: string) {
    if (!(await potvrdi({ poruka: t("osnivaci_obrisi_confirm"), opasno: true, dugme: t("osnivaci_obrisi_btn") }))) return;
    setRadnja(id);
    const res = await fetch(`/api/admin/osnivaci/${id}`, { method: "DELETE" });
    setRadnja(null);
    if (res.ok) await refetch();
    else { const d = await res.json().catch(() => ({})); await obavesti(d.error ?? t("greska_generalna")); }
  }

  async function zakljucaj() {
    if (!(await potvrdi({ poruka: t("osnivaci_zakljucaj_confirm") }))) return;
    setRadnja("zakljucaj");
    const res = await fetch("/api/admin/osnivaci/zakljucaj", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setRadnja(null);
    if (res.ok) await refetch();
    else await obavesti(d.error ?? t("greska_generalna"));
  }

  if (ucitavanje) return <p className="text-sm text-kolo-muted">{t("osnivaci_ucitavanje")}</p>;

  const inputCls = "w-full min-h-9 px-2 py-1 rounded-kontrola border border-kolo-border bg-kolo-surface text-sm outline-none focus:border-kolo-green-700";

  return (
    <div className="space-y-6">
      {dijalog}
      {(greskaListe || greskaStatusa) && (
        <Obavestenje vrsta="greska">
          {greskaListe && <p>{t("osnivaci_greska_liste")}: {(greskaListe as Error).message}</p>}
          {greskaStatusa && <p>{t("osnivaci_greska_statusa")}: {(greskaStatusa as Error).message}</p>}
        </Obavestenje>
      )}

      {/* Status kanala */}
      {status && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-kolo-text">{t("osnivaci_kanal_naslov")}</h2>
            {status.zatvoren && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-kolo-bg text-kolo-muted">{t("osnivaci_trajno_zatvoren")}</span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Stat label={t("osnivaci_stat_koraka")} value={`${status.brojKoraka} / ${status.ukupnoKoraka ?? 100}`} />
            <Stat label={t("osnivaci_stat_evidentirano")} value={`${fmt(status.ukupnoEvidentirano, locale)} POEN`} />
            <Stat label={t("osnivaci_stat_preostalo")} value={`${fmt(status.preostalo, locale)} POEN`} />
            <Stat label={t("osnivaci_stat_iskoriscenos")} value={`${status.procenatIskoriscenja}%`} />
            <Stat label={t("osnivaci_stat_poen_u_sistemu")} value={fmt(status.ukupanPoenUSistemu, locale)} />
            <Stat label={t("osnivaci_stat_sledeci_prag")} value={fmt(status.sledeciPrag, locale)} />
          </div>
          <div className="mt-4 h-2 rounded-full bg-kolo-bg overflow-hidden">
            <div className="h-full bg-kolo-green-700" style={{ width: `${Math.min(100, status.procenatIskoriscenja)}%` }} />
          </div>
          {/* Pravilnik o osnivačkom doprinosu čl. 6 st. 2–3: korak se proverava samo na kraju
              obračunskog perioda (noćni obračun), bez ičije odluke — ručnog okidača nema. */}
          <p className="mt-4 text-xs text-kolo-muted">
            {zakljucano ? t("osnivaci_koraci_automatski") : t("osnivaci_evidentiraj_treba_zakljucati")}
          </p>
        </div>
      )}

      {/* Provera kanala doprinosa za prvi oglas (Pravilnik čl. 38) — samo čita. Prelazna
          radnja „Evidentiraj zatečene" (prelazni stav Pravilnika 4.8.5) uklonjena je setom 5.0:
          u važećem aktu za nju nema osnova. */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
        <h2 className="text-base font-semibold text-kolo-text mb-2">{t("doprinos_revizija_naslov")}</h2>
        <p className="text-sm text-kolo-muted mb-4">{t("doprinos_revizija_opis")}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={ucitajReviziju}
            disabled={radnja !== null}
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
          >
            {radnja === "revizija" ? t("doprinos_revizija_loading") : t("doprinos_revizija_btn")}
          </button>
        </div>

        {revizija && (
          <div className="mt-4 rounded-kontrola bg-kolo-bg p-4 space-y-2 text-sm">
            <p className="text-kolo-text">
              {t("doprinos_revizija_zbir", {
                kvalifikovanih: revizija.kvalifikovanih,
                saZapisom: revizija.saZapisom,
                poen: fmt(revizija.evidentiranoPoen, locale),
              })}
            </p>
            <RevizijaRed naslov={t("doprinos_revizija_nedostaju")} stavke={revizija.nedostaju} kritican />
            {/* Nije kvar nego uslov kanala — zato ide sa razlogom, da se vidi šta
                tačno fali oglasu (fotografija, dužina opisa, kategorija, mesto). */}
            {revizija.bezMinimuma.length > 0 && (
              <div className="text-sm">
                <span className="text-kolo-text font-semibold">
                  {revizija.bezMinimuma.length} · {t("doprinos_revizija_bez_minimuma")}
                </span>
                <ul className="mt-1 space-y-0.5">
                  {revizija.bezMinimuma.map((s) => (
                    <li key={s.userId} className="text-xs text-kolo-muted">
                      <Pseudonim>{s.pseudonim}</Pseudonim> — {s.razlog}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <RevizijaRed naslov={t("doprinos_revizija_zabelezen_verifikovan")} stavke={revizija.zabelezenVerifikovan} />
            <RevizijaRed naslov={t("doprinos_revizija_bez_obavestenja")} stavke={revizija.evidentiranBezObavestenja} />
            <RevizijaRed naslov={t("doprinos_revizija_bez_transakcije")} stavke={revizija.evidentiranBezTransakcije} kritican />
            <p className="text-xs text-kolo-muted">
              {t("doprinos_revizija_uredno", {
                ceka: revizija.zabelezenNeverifikovan,
                ponisten: revizija.ponisten,
              })}
            </p>
          </div>
        )}
      </div>

      {/* Lista osnivaca */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-kolo-text">{t("osnivaci_lista_naslov")}</h2>
          <span className={`text-xs font-semibold ${udeliValidni ? "text-kolo-green-700" : "text-kolo-danger"}`}>
            {t("osnivaci_zbir_udela", { zbir: zbirBrojilaca, imenilac: zajednickiImenilac || "—", valid: udeliValidni ? "✓" : "(mora biti 1/1)" })}
          </span>
        </div>

        {osnivaci.length === 0 ? (
          <p className="text-sm text-kolo-muted">
            {greskaListe ? t("osnivaci_lista_nedostupna") : t("osnivaci_nema")}
          </p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[30rem]">
            <thead>
              <tr className="text-left text-kolo-muted border-b border-kolo-border">
                <th className="py-2 font-medium">{t("osnivaci_tbl_rb")}</th>
                <th className="py-2 font-medium">{t("osnivaci_tbl_pseudonim")}</th>
                <th className="py-2 font-medium">{t("osnivaci_tbl_udeo")}</th>
                <th className="py-2 font-medium">{t("osnivaci_tbl_napomena")}</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {osnivaci.map((o) => (
                izmenaId === o.id ? (
                  <tr key={o.id} className="border-b border-kolo-border last:border-0 bg-kolo-bg/50">
                    <td className="py-2 pr-2 w-16">
                      <input type="number" aria-label={t("osnivaci_tbl_rb")} value={izRedniBroj} onChange={(e) => setIzRedniBroj(e.target.value)} className={inputCls} />
                    </td>
                    <td className="py-2 font-medium text-kolo-text"><Pseudonim>{o.user.pseudonim}</Pseudonim></td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-1">
                        <input type="number" aria-label={t("osnivaci_brojilac_label")} value={izBrojilac} onChange={(e) => setIzBrojilac(e.target.value)} className={`${inputCls} w-16`} />
                        <span className="text-kolo-muted">/</span>
                        <input type="number" aria-label={t("osnivaci_imenilac_label")} value={izImenilac} onChange={(e) => setIzImenilac(e.target.value)} className={`${inputCls} w-16`} />
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <input type="text" aria-label={t("osnivaci_tbl_napomena")} value={izNapomena} onChange={(e) => setIzNapomena(e.target.value)} maxLength={200} className={inputCls} />
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={sacuvajIzmenu} disabled={radnja === "izmena" || !izRedniBroj || !izBrojilac || !izImenilac}
                        className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
                        {t("osnivaci_sacuvaj_btn")}
                      </button>
                      <button onClick={() => setIzmenaId(null)} disabled={radnja === "izmena"}
                        className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" }) + " ml-1"}>
                        {t("osnivaci_otkazi_btn")}
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={o.id} className="border-b border-kolo-border last:border-0">
                    <td className="py-2">{o.redniBroj}</td>
                    <td className="py-2 font-medium text-kolo-text"><Pseudonim>{o.user.pseudonim}</Pseudonim></td>
                    <td className="py-2">
                      {o.udeoBrojilac}/{o.udeoImenilac}
                      <span className="text-kolo-muted"> ({Math.round((o.udeoBrojilac / o.udeoImenilac) * 1000) / 10}%)</span>
                    </td>
                    <td className="py-2 text-kolo-muted">{o.napomena ?? "—"}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {izmeneDozvoljene && (
                        <>
                          <button onClick={() => pocniIzmenu(o)} disabled={radnja !== null}
                            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
                            {t("osnivaci_izmeni_btn")}
                          </button>
                          <button onClick={() => obrisi(o.id)} disabled={radnja === o.id}
                            className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" }) + " ml-1"}>
                            {t("osnivaci_obrisi_btn")}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          </div>
        )}

        {greskaIzmene && <Obavestenje vrsta="greska" className="mt-3">{greskaIzmene}</Obavestenje>}

        {aktiviran ? (
          <p className="mt-3 text-xs text-kolo-muted">
            {t("osnivaci_kanal_zakljucan")}
          </p>
        ) : zakljucano ? (
          <div className="mt-4 flex items-center justify-between gap-3 bg-kolo-bg rounded-kontrola px-4 py-3">
            <p className="text-sm text-kolo-text font-medium">🔒 {t("osnivaci_zakljucano_info")}</p>
          </div>
        ) : (
          <div className="mt-4">
            <button
              onClick={zakljucaj}
              disabled={radnja === "zakljucaj" || !udeliValidni || !!greskaListe}
              className={klaseDugmeta()}
            >
              🔒 {t("osnivaci_zakljucaj_btn")}
            </button>
            {!udeliValidni && (
              <p className="mt-2 text-xs text-kolo-muted">{t("osnivaci_zakljucaj_uslov")}</p>
            )}
          </div>
        )}
      </div>

      {/* Forma za dodavanje */}
      {izmeneDozvoljene && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 space-y-4 shadow-kartica">
          <h2 className="text-base font-semibold text-kolo-text">{t("osnivaci_dodaj_naslov")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Polje oznaka={t("osnivaci_korisnik_label")}>
              <select value={userId} onChange={(e) => setUserId(e.target.value)}
                className={KLASE_UNOSA}>
                <option value="">{t("osnivaci_korisnik_placeholder")}</option>
                {verifikovaniKorisnici.map((k) => (
                  <option key={k.id} value={k.id}>{k.pseudonim}</option>
                ))}
              </select>
            </Polje>
            <Polje oznaka={t("osnivaci_redni_broj_label")}>
              <input type="number" value={redniBroj} onChange={(e) => setRedniBroj(e.target.value)}
                className={KLASE_UNOSA} />
            </Polje>
            <Polje oznaka={t("osnivaci_brojilac_label")}>
              <input type="number" value={brojilac} onChange={(e) => setBrojilac(e.target.value)}
                className={KLASE_UNOSA} />
            </Polje>
            <Polje oznaka={t("osnivaci_imenilac_label")}>
              <input type="number" value={imenilac} onChange={(e) => setImenilac(e.target.value)}
                className={KLASE_UNOSA} />
            </Polje>
          </div>
          <Polje oznaka={t("osnivaci_napomena_label")}>
            <input type="text" value={napomena} onChange={(e) => setNapomena(e.target.value)} maxLength={200}
              className={KLASE_UNOSA} />
          </Polje>
          {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
          <button
            onClick={dodaj}
            disabled={radnja === "dodaj" || !!greskaListe || !userId || !brojilac || !imenilac || !redniBroj}
            className={klaseDugmeta()}
          >
            {radnja === "dodaj" ? t("osnivaci_dodajem") : t("osnivaci_dodaj_btn")}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Jedan red revizije. Prazan skup je dobra vest, pa se prikazuje kvačicom umesto
 * da nestane — inače se ne vidi razlika između „provereno, nema nikoga" i
 * „provera nije ni pokrenuta".
 */
function RevizijaRed({
  naslov,
  stavke,
  kritican = false,
}: {
  naslov: string;
  stavke: Array<{ userId: string; pseudonim: string }>;
  kritican?: boolean;
}) {
  const prazan = stavke.length === 0;
  return (
    <div className="text-sm">
      <span className={prazan ? "text-kolo-muted" : kritican ? "text-kolo-danger font-semibold" : "text-kolo-text font-semibold"}>
        {prazan ? "\u2713 " : `${stavke.length} \u00b7 `}
        {naslov}
      </span>
      {!prazan && <span className="text-kolo-muted"> — {stavke.map((s) => s.pseudonim).join(", ")}</span>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-kolo-muted">{label}</p>
      <p className="font-semibold text-kolo-text">{value}</p>
    </div>
  );
}
