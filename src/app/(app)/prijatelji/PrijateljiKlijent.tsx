"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import QrSkener from "@/components/verifikacija/QrSkener";
import { useDijalog } from "@/components/ui/Dijalog";

// Isti obrazac kao na stranici Potvrde: QR se crta tek kad se zatraži kod, pa
// biblioteka ne ulazi u početni bundle.
const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), { ssr: false });

type Prijatelj = {
  /** Id PRIJATELJSTVA (ne korisnika) — po njemu ide raskid. */
  id: string;
  korisnikId: string;
  pseudonim: string;
  avatar: string | null;
  evidentirano: boolean;
  /** Braća i sestre: prijateljstvo radi, samo ne nosi POEN (čl. 14b st. 4). */
  bezPoena: boolean;
  /** Čeka drugu stranu da postane aktivna — „500 na čekanju". */
  naCekanju: boolean;
  /** Stanje naloga druge strane — po njemu se imenuje ko se čeka. */
  drugiStanje: "NA_CEKANJU" | "POVEZANO" | "AKTIVNO";
};

/**
 * Ista paleta kao na dečjoj početnoj — dečji prostor ima svoje boje, ne zelenu.
 * Vrednosti su u `globals.css` (`--color-deca-*`); ovde stoje samo imena klasa.
 * Ranije je ceo niz heksadecimalnih vrednosti bio PREPISAN iz `DecjaPocetna`, pa
 * bi svaka ispravka morala da se uradi dvaput — i propustila bi se drugi put.
 */
const BOJE_DECE = [
  "bg-deca-korala-600",
  "bg-deca-narandza-600",
  "bg-deca-sunce-600",
  "bg-deca-trava-600",
  "bg-deca-more-600",
  "bg-deca-nebo-600",
  "bg-deca-slezova-600",
  "bg-deca-roze-600",
];

export default function PrijateljiKlijent() {
  const t = useTranslations("prijatelji");
  const [broj, setBroj] = useState<number | null>(null);
  const [naCekanju, setNaCekanju] = useState(0);
  const [mojeStanje, setMojeStanje] = useState<"NA_CEKANJU" | "POVEZANO" | "AKTIVNO">("AKTIVNO");
  const [spisak, setSpisak] = useState<Prijatelj[]>([]);
  const [kod, setKod] = useState<string | null>(null);
  const [skenira, setSkenira] = useState(false);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    try {
      const res = await fetch("/api/deca/prijatelji", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBroj(data.broj);
      setNaCekanju(data.poenNaCekanju ?? 0);
      setMojeStanje(data.mojeStanje ?? "AKTIVNO");
      setSpisak(data.prijatelji);
    } catch {
      setGreska(t("greska_ucitavanje"));
    }
  }, [t]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function pokaziKod() {
    setGreska(null);
    setPoruka(null);
    try {
      const res = await fetch("/api/deca/prijatelji/token", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      setKod(data.token);
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("greska_slanje"));
    }
  }

  async function skeniran(token: string) {
    setSkenira(false);
    setGreska(null);
    try {
      const res = await fetch("/api/deca/prijatelji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      setPoruka(t("uspeh", { pseudonim: data.pseudonim }));
      await ucitaj();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("greska_slanje"));
    }
  }

  /**
   * Raskid (čl. 14c). 🔴 Potvrda pre raskida NIJE ukras: otpisuje se 500 POEN i
   * onome ko raskida i onome ko je raskinut, a od 31.08.2026. raskid gasi i
   * zatečene razgovore sa tom osobom — dakle to je i jedini način da dete prekine
   * kontakt. Tekst mora da kaže oboje.
   */
  async function raskini(p: Prijatelj) {
    const pitanje = p.evidentirano
      ? t("raskid_potvrda_poen", { pseudonim: p.pseudonim })
      : t("raskid_potvrda", { pseudonim: p.pseudonim });
    if (!(await potvrdi({ poruka: pitanje, opasno: true, dugme: t("dugme_raskini") }))) return;
    setGreska(null);
    setPoruka(null);
    try {
      const res = await fetch(`/api/deca/prijatelji/${p.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      setPoruka(t("raskid_uspeh", { pseudonim: p.pseudonim }));
      await ucitaj();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("greska_slanje"));
    }
  }

  /**
   * Ko se zapravo čeka za tih 500 POEN.
   *
   * 🔴 Do 31.08.2026. je uz SVAKOG prijatelja pisalo samo „500 na čekanju", jer se
   * `naCekanju` računa kao „nije isplaćeno". Ta oznaka se pali i kad koči SOPSTVENI
   * roditelj — pa je dete čiji roditelj još nije redovan član gledalo spisak od
   * deset drugova i zaključivalo da su svi ostali krivi, dok je jedina prepreka
   * bila u njegovoj kući. Podatak koji to razrešava server je slao sve vreme
   * (`mojeStanje`, `drugiStanje`); klijent ga je odbacivao.
   */
  function koSeCeka(p: Prijatelj): string {
    if (p.bezPoena) return t("oznaka_bez_poena");
    if (p.evidentirano) return t("oznaka_evidentirano");
    const jaKocim = mojeStanje !== "AKTIVNO";
    const onKoci = p.drugiStanje !== "AKTIVNO";
    if (jaKocim && onKoci) return t("oznaka_ceka_oboje");
    if (jaKocim) return t("oznaka_ceka_mene");
    return t("oznaka_ceka_njega", { pseudonim: p.pseudonim });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {dijalog}
      {/* Umesto indeksa stvarnosti — broj prijatelja. */}
      <section className="broj-kartica rounded-3xl border-4 border-deca-slezova-400 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-bold text-deca-nebo-600">{t("naslov")}</h1>
        <p
          className="broj-kartica-vrednost mt-2 font-extrabold text-deca-slezova-600"
          style={{ ["--znakova" as string]: String(Math.max(String(broj ?? 0).length, 2)) }}
        >
          {broj ?? "–"}
        </p>
        {/* „500 na čekanju" uz pseudonim je i namera, ne samo obaveštenje: dete koje
            je aktivno ne dobija ništa dok drugom roditelj ne preuzme nalog. */}
        {naCekanju > 0 && (
          <p className="mt-3 inline-block rounded-xl bg-deca-sunce-100 px-3 py-2 text-base font-semibold text-deca-sunce-ink">
            {t("na_cekanju", { iznos: naCekanju })}
          </p>
        )}
      </section>

      {poruka && (
        <p role="status" className="rounded-xl border border-kolo-green-700 bg-kolo-green-100 p-3 text-base text-kolo-green-800">
          {poruka}
        </p>
      )}
      {greska && (
        <p role="alert" className="text-base text-kolo-danger">
          {greska}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Moj kod. 🔴 Ispod QR-a NEMA broja: broj se izdiktira telefonom, a QR se
            mora pokazati — to je jedino što traži da dvoje budu jedno pored drugog. */}
        <section className="rounded-3xl border-[3px] border-deca-trava-400 bg-white p-6 text-center shadow-sm">
          <h2 className="font-bold text-deca-trava-600">{t("moj_kod")}</h2>
          {kod ? (
            <>
              <div className="mt-3 flex justify-center">
                <QRCodeSVG value={kod} size={176} level="M" />
              </div>
              <p className="mt-3 text-sm text-kolo-muted">{t("kod_uputstvo")}</p>
            </>
          ) : (
            <button
              type="button"
              onClick={pokaziKod}
              className="meta-dete mt-3 rounded-full bg-deca-trava-600 px-6 py-3 text-base font-bold text-white transition hover:opacity-90"
            >
              {t("pokazi_kod")}
            </button>
          )}
        </section>

        <section className="rounded-3xl border-[3px] border-deca-more-400 bg-white p-6 text-center shadow-sm">
          <h2 className="font-bold text-deca-more-600">{t("skeniraj")}</h2>
          <p className="mt-1 text-sm text-kolo-muted">{t("skeniraj_opis")}</p>
          <button
            type="button"
            onClick={() => setSkenira(true)}
            className="meta-dete mt-3 rounded-full bg-deca-more-600 px-6 py-3 text-base font-bold text-white transition hover:opacity-90"
          >
            {t("dugme_skeniraj")}
          </button>
        </section>
      </div>

      {skenira && (
        <QrSkener
          onDetektovan={skeniran}
          onZatvori={() => setSkenira(false)}
          uputstvo={t("skeniraj_opis")}
        />
      )}

      <section className="rounded-3xl border-[3px] border-deca-narandza-400 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-deca-narandza-600">{t("spisak_naslov")}</h2>
        {spisak.length === 0 ? (
          /* Prazno stanje nosi i DUGME za izlaz. Ranije je rečenica opisivala radnju
             („pokaži kod nekome pored sebe"), a dugme je bilo u drugoj kartici iznad. */
          <div className="mt-3 text-center">
            <p className="text-base text-kolo-muted">{t("spisak_prazno")}</p>
            {!kod && (
              <button
                type="button"
                onClick={pokaziKod}
                className="meta-dete mt-3 rounded-full bg-deca-trava-600 px-6 py-3 text-base font-bold text-white transition hover:opacity-90"
              >
                {t("pokazi_kod")}
              </button>
            )}
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {spisak.map((p, i) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-kolo-bg px-3 py-2"
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span
                    className={`truncate rounded-full px-3 py-1.5 text-base font-bold text-white ${BOJE_DECE[i % BOJE_DECE.length]}`}
                  >
                    {p.pseudonim}
                  </span>
                  <span className="text-sm text-kolo-muted">{koSeCeka(p)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => raskini(p)}
                  className="meta-dete shrink-0 rounded-full border border-kolo-border px-4 text-sm font-medium text-kolo-muted transition hover:border-kolo-danger hover:text-kolo-danger"
                >
                  {t("dugme_raskini")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
