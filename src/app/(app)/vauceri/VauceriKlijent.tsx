"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import NaslovStranice from "@/components/ui/NaslovStranice";

// Isti QR kao „Moj QR" na ekranu POEN — učitava se lenjo.
const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), { ssr: false });

/**
 * Vaučeri iz pokroviteljstva dobrima i uslugama (nabavke Glava VII).
 *
 * Vaučeri su dostupni od izdavanja; reda i roka za prijavu nema — vaučer uzima
 * korisnik koji ga prvi zatraži (čl. 32). Za uzimanje su obavezne izjava o
 * nepovezanosti i pristanak na prikaz zapisa uz pseudonim (čl. 33 st. 1).
 *
 * 🔴 Na ovom ekranu se uz broj POEN-a NIKAD ne prikazuje dinarska vrednost (cena,
 * vrednost ugovora) — nabavke čl. 31, R-01. Vaučer pokazuje samo: opis,
 * naziv davaoca (uz logotip, ako ga je davalac priložio — donacije čl. 26 st. 2;
 * logotip nikad nije link), mesto i adresu, broj preostalih, rok i broj POEN-a. Brana:
 * `vaucer-izvor.test.ts`. 🔴 Dugme je „Uzmi vaučer" (nabavke čl. 33: vaučer se UZIMA, dobro
 * se PREDAJE), nikad „kupi" ni „plati". Pristanak na prikaz opisa se povlači u „Moji
 * vaučeri" (čl. 33 st. 2): opis i naziv pokrovitelja brišu se iz opisa zapisa, zapis ostaje.
 *
 * `?upis=<id>` (veza „Vaučeri" sa kartice pokrovitelja na mapi) prikazuje samo
 * ponudu tog pokrovitelja, uz vezu ka celoj ponudi.
 */
type Dostupan = {
  id: string;
  upisId: string | null;
  opis: string;
  davalac: string;
  logoUrl: string | null;
  vrsta: "DOBRO" | "USLUGA";
  mesto: string;
  adresaPredaje: string | null;
  vaziDo: string | null;
  poen: number;
  preostalo: number;
};

type MojVaucer = {
  id: string;
  kod: string | null;
  status: "SLOBODAN" | "DODELJEN" | "ISKORISCEN" | "ISTEKAO" | "NEIZVRSEN";
  opis: string;
  davalac: string;
  logoUrl: string | null;
  mesto: string;
  adresaPredaje: string | null;
  vaziDo: string | null;
  poen: number;
  /** Pristanak na prikaz opisa uz pseudonim (nabavke čl. 33 st. 1) i njegovo povlačenje (st. 2). */
  pristanakDat: boolean;
  pristanakPovucenAt: string | null;
};

export default function VauceriKlijent() {
  const t = useTranslations("vauceri");
  const locale = useLocale();
  const [dostupni, setDostupni] = useState<Dostupan[]>([]);
  const [vauceri, setVauceri] = useState<MojVaucer[]>([]);
  const [ucitava, setUcitava] = useState(true);
  const [izjave, setIzjave] = useState<Record<string, boolean>>({});
  const [pristanci, setPristanci] = useState<Record<string, boolean>>({});
  const [radi, setRadi] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ tekst: string; ok: boolean } | null>(null);
  const [otvorenQr, setOtvorenQr] = useState<string | null>(null);
  const upisFilter = useSearchParams().get("upis");
  const prikazani = upisFilter ? dostupni.filter((d) => d.upisId === upisFilter) : dostupni;

  const ucitaj = useCallback(async () => {
    try {
      const r = await fetch("/api/vauceri", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        setDostupni(d.dostupni ?? []);
        setVauceri(d.vauceri ?? []);
      }
    } finally {
      setUcitava(false);
    }
  }, []);

  useEffect(() => { void ucitaj(); }, [ucitaj]);

  const datum = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  async function uzmi(id: string) {
    setPoruka(null);
    setRadi(id);
    const r = await fetch(`/api/vauceri/ugovor/${id}/uzmi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ izjavaNepovezan: izjave[id] === true, pristanakPrikaz: pristanci[id] === true }),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(null);
    setPoruka(r.ok ? { tekst: t("uzet"), ok: true } : { tekst: d.error ?? t("greska"), ok: false });
    if (r.ok) {
      setIzjave((s) => ({ ...s, [id]: false }));
      setPristanci((s) => ({ ...s, [id]: false }));
    }
    await ucitaj();
  }

  async function povuciPristanak(id: string) {
    if (!window.confirm(t("pristanak_povuci_potvrda"))) return;
    setPoruka(null);
    setRadi(id);
    const r = await fetch(`/api/vauceri/${id}/povuci-pristanak`, { method: "POST" });
    const d = await r.json().catch(() => ({}));
    setRadi(null);
    setPoruka(r.ok ? { tekst: t("pristanak_povucen_poruka"), ok: true } : { tekst: d.error ?? t("greska"), ok: false });
    await ucitaj();
  }

  const STATUS: Record<MojVaucer["status"], string> = {
    SLOBODAN: t("status_vazi"),
    DODELJEN: t("status_vazi"),
    ISKORISCEN: t("status_iskoriscen"),
    ISTEKAO: t("status_istekao"),
    NEIZVRSEN: t("status_neizvrsen"),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <NaslovStranice naslov={t("naslov")} opis={t("uvod")} />

      {poruka && (
        <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>
          {poruka.tekst}
        </Obavestenje>
      )}

      {/* ── Dostupni vaučeri (nabavke čl. 32, 33) ───────────────────────── */}
      <Kartica as="section" className="space-y-3">
        <h2 className="text-lg font-semibold">{t("dostupni_naslov")}</h2>
        <p className="text-sm text-kolo-muted">{t("dostupni_opis")}</p>
        {upisFilter && (
          <p className="text-sm text-kolo-muted">
            {t("filter_pokrovitelj")}{" "}
            <Link href="/vauceri" className="font-medium text-kolo-green-700 underline">{t("filter_sve")}</Link>
          </p>
        )}
        {ucitava ? (
          <p className="text-sm text-kolo-muted">{t("ucitavanje")}</p>
        ) : prikazani.length === 0 ? (
          <p className="text-sm text-kolo-muted bg-kolo-bg rounded-kontrola px-3 py-2">{t("dostupni_prazno")}</p>
        ) : (
          prikazani.map((r) => (
            <div key={r.id} id={`ugovor-${r.id}`} className="rounded-kontrola bg-kolo-bg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <LogotipPokrovitelja url={r.logoUrl} />
                <div className="min-w-0">
                  <p className="font-semibold text-kolo-text">{r.opis}</p>
                  <p className="text-sm text-kolo-muted">
                    {t("davalac_mesto", { davalac: r.davalac, mesto: r.adresaPredaje ? `${r.mesto}, ${r.adresaPredaje}` : r.mesto })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-kolo-text">
                {t("poen_po_vauceru", { poen: r.poen.toLocaleString(intlTag(locale)) })}
                {" · "}
                {t("preostalo", { broj: r.preostalo })}
              </p>
              <p className="text-xs text-kolo-muted">{t("vazi_do", { datum: datum(r.vaziDo) })}</p>
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-sm text-kolo-text">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={izjave[r.id] === true}
                    onChange={(e) => setIzjave((s) => ({ ...s, [r.id]: e.target.checked }))}
                  />
                  {t("izjava_nepovezan")}
                </label>
                <label className="flex items-start gap-2 text-sm text-kolo-text">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={pristanci[r.id] === true}
                    onChange={(e) => setPristanci((s) => ({ ...s, [r.id]: e.target.checked }))}
                  />
                  {t("pristanak_prikaz")}
                </label>
                <Dugme
                  onClick={() => uzmi(r.id)}
                  disabled={radi === r.id || izjave[r.id] !== true || pristanci[r.id] !== true}
                >
                  {t("preuzmi_vaucer")}
                </Dugme>
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-kolo-muted">{t("uzimanje_napomena")}</p>
      </Kartica>

      {/* ── Moji vaučeri ─────────────────────────────────────────────────── */}
      <Kartica as="section" className="space-y-3">
        <h2 className="text-lg font-semibold">{t("moji_naslov")}</h2>
        {!ucitava && vauceri.length === 0 && (
          <p className="text-sm text-kolo-muted bg-kolo-bg rounded-kontrola px-3 py-2">{t("moji_prazno")}</p>
        )}
        {vauceri.map((v) => (
          <div key={v.id} className="rounded-kontrola bg-kolo-bg p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <LogotipPokrovitelja url={v.logoUrl} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-kolo-text">{v.opis}</p>
                <p className="text-sm text-kolo-muted">
                  {t("davalac_mesto", { davalac: v.davalac, mesto: v.adresaPredaje ? `${v.mesto}, ${v.adresaPredaje}` : v.mesto })}
                </p>
                <p className="text-xs text-kolo-muted">{t("vazi_do", { datum: datum(v.vaziDo) })}</p>
                <p className="text-sm text-kolo-text">{t("poen_vaucera", { poen: v.poen.toLocaleString(intlTag(locale)) })}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-kolo-gold-700">{STATUS[v.status]}</span>
            </div>
            {v.status === "DODELJEN" && v.kod && (
              <div className="space-y-2">
                <Dugme varijanta="sekundarno" velicina="sm" onClick={() => setOtvorenQr(otvorenQr === v.id ? null : v.id)}>
                  {otvorenQr === v.id ? t("sakrij_qr") : t("prikazi_qr")}
                </Dugme>
                {otvorenQr === v.id && (
                  <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-kontrola border border-kolo-border">
                    <QRCodeSVG value={v.kod} size={180} fgColor="#1B6B3A" bgColor="#FFFFFF" level="M" />
                    <p className="font-mono text-sm font-semibold text-kolo-green-700">{v.kod}</p>
                    <p className="text-xs text-kolo-muted text-center">{t("qr_uputstvo")}</p>
                  </div>
                )}
              </div>
            )}
            {v.pristanakPovucenAt ? (
              <p className="text-xs text-kolo-muted">{t("pristanak_povucen", { datum: datum(v.pristanakPovucenAt) })}</p>
            ) : (
              v.pristanakDat && (
                <Dugme varijanta="sekundarno" velicina="sm" onClick={() => povuciPristanak(v.id)} disabled={radi === v.id}>
                  {t("pristanak_povuci")}
                </Dugme>
              )
            )}
            {(v.status === "DODELJEN" || v.status === "ISKORISCEN" || v.status === "ISTEKAO") && (
              <Link
                href={`/profil?prigovor=VAUCER&predmet=${v.id}`}
                className="inline-flex min-h-9 items-center text-xs font-medium text-kolo-muted underline"
              >
                {t("prigovor_link")}
              </Link>
            )}
          </div>
        ))}
        <p className="text-xs text-kolo-muted">{t("moji_napomena")}</p>
      </Kartica>

      <p className="text-xs text-kolo-muted">
        <Link href="/postani-pokrovitelj" className="underline">{t("davalac_link")}</Link>
      </p>
    </div>
  );
}
