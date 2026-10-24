"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Pseudonim from "@/components/Pseudonim";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { useDijalog } from "@/components/ui/Dijalog";

const QrSkener = dynamic(() => import("@/components/verifikacija/QrSkener"), { ssr: false });

/**
 * Provera i realizacija vaučera (nabavke čl. 30g st. 1, Politika 4.15): unos ili
 * skeniranje koda, stanje, opis, rok i PSEUDONIM imaoca; potvrda predaje.
 *
 * Koriste je korisnik koji vodi upis pokrovitelja (stranica pokrovitelja, tab
 * Vaučeri) i zaposleni koga je on odredio (stranica Pokroviteljstvo). Ovlašćenje
 * proverava server (`ovlascenjeKorisnika`) — za tuđ kod odgovor je „nepoznat kod".
 * 🔴 Ništa drugo o imaocu — ni ime, ni mejl, ni id.
 */
type Provera = {
  stanje: "VAZI" | "ISKORISCEN" | "ISTEKAO" | "NE_VAZI" | "NEPOZNAT";
  opis: string | null;
  vaziDo: string | null;
  pseudonim: string | null;
};

export default function ProveraVaucera({ onRealizovano }: { onRealizovano?: () => void }) {
  const t = useTranslations("vauceri");
  const locale = useLocale();
  const [kod, setKod] = useState("");
  const [provera, setProvera] = useState<Provera | null>(null);
  const [radi, setRadi] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ tekst: string; ok: boolean } | null>(null);
  const [skener, setSkener] = useState(false);
  const { dijalog, potvrdi } = useDijalog();

  const datum = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  async function proveri(k = kod) {
    setPoruka(null);
    setProvera(null);
    if (!k.trim()) return;
    setRadi("provera");
    const r = await fetch("/api/vauceri/provera", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kod: k }),
    });
    setRadi(null);
    if (r.ok) setProvera(await r.json());
    else setPoruka({ tekst: t("greska"), ok: false });
  }

  async function realizuj() {
    if (!(await potvrdi({ poruka: t("realizacija_potvrda") }))) return;
    setRadi("realizacija");
    const r = await fetch("/api/vauceri/realizacija", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kod }),
    });
    const d = await r.json().catch(() => ({}));
    setRadi(null);
    if (r.ok) {
      setPoruka({ tekst: t("realizovano"), ok: true });
      setProvera(null);
      setKod("");
      onRealizovano?.();
    } else setPoruka({ tekst: d.error ?? t("greska"), ok: false });
  }

  const STANJE: Record<Provera["stanje"], string> = {
    VAZI: t("stanje_vazi"),
    ISKORISCEN: t("stanje_iskoriscen"),
    ISTEKAO: t("stanje_istekao"),
    NE_VAZI: t("stanje_ne_vazi"),
    NEPOZNAT: t("stanje_nepoznat"),
  };

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica space-y-3">
      {dijalog}
      <h2 className="text-lg font-semibold">{t("provera_naslov")}</h2>
      <p className="text-sm text-kolo-muted">{t("provera_opis")}</p>
      {poruka && (
        <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.tekst}</Obavestenje>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          value={kod}
          onChange={(e) => setKod(e.target.value.toUpperCase())}
          placeholder={t("kod_placeholder")}
          aria-label={t("kod_placeholder")}
          className="min-w-0 flex-1 min-h-10 px-3 py-2 rounded-kontrola border border-kolo-border bg-kolo-surface text-sm font-mono outline-none focus:border-kolo-green-700"
        />
        <Dugme onClick={() => proveri()} disabled={radi === "provera" || !kod.trim()}>
          {t("proveri")}
        </Dugme>
        <Dugme varijanta="sekundarno" onClick={() => setSkener(true)}>
          {t("skeniraj")}
        </Dugme>
      </div>
      {skener && (
        <QrSkener
          uputstvo={t("skener_uputstvo")}
          onZatvori={() => setSkener(false)}
          onDetektovan={(token) => {
            setSkener(false);
            setKod(token.toUpperCase());
            void proveri(token);
          }}
        />
      )}
      {provera && (
        <div className="rounded-kontrola bg-kolo-bg p-4 space-y-1">
          <p className="text-sm font-semibold text-kolo-text">{STANJE[provera.stanje]}</p>
          {provera.opis && <p className="text-sm text-kolo-text">{provera.opis}</p>}
          {provera.pseudonim && (
            <p className="text-sm text-kolo-text">{t("imalac")} <Pseudonim>{provera.pseudonim}</Pseudonim></p>
          )}
          {provera.vaziDo && <p className="text-xs text-kolo-muted">{t("vazi_do", { datum: datum(provera.vaziDo) })}</p>}
          {provera.stanje === "VAZI" && (
            <div className="pt-2 space-y-2">
              <p className="text-xs text-kolo-muted">{t("racun_napomena")}</p>
              <Dugme onClick={realizuj} disabled={radi === "realizacija"}>
                {t("potvrdi_realizaciju")}
              </Dugme>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
