"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { intlTag } from "@/lib/format";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import Pseudonim from "@/components/Pseudonim";
import { PREDMETI_PRIMEDBE } from "@/lib/operativni-pravila";

type Podaci = {
  prijave: {
    id: string;
    pseudonim: string;
    status: string;
    planIzvrsenja: string | null;
    ispunjenostUslova: string | null;
    obrazlozenje: string | null;
    odlucioPseudonim: string | null;
    odustao: boolean;
    zavrsnaOdluka: string | null;
    zavrsnoObrazlozenje: string | null;
    zavrsnuDaoPseudonim: string | null;
    dodeljena: boolean;
    createdAt: string;
  }[];
  izvrsenja: {
    id: string;
    pseudonim: string | null;
    date: string;
    celina: number | null;
    predlozeniPoen: number;
    evidentirano: number | null;
    status: string;
    obrazlozenje: string | null;
    odlucioPseudonim: string | null;
    zavrsna: boolean;
    visakZadruge: number | null;
  }[];
  primedbe: { id: string; predmet: string; tekst: string; odluka: string | null; odlucioPseudonim: string | null; createdAt: string }[];
  limit: {
    limit: number;
    potvrdjenoOperativno: number;
    prethodni: { datum: string; limit: number; trazeno: number; evidentirano: number; koeficijent: number }[];
  };
};

/**
 * Podaci zadatka dostupni ISKLJUČIVO učesnicima (operativni 5.0 čl. 25 st. 2):
 * prijave i planovi, pseudonimi izvršilaca i lica koje potvrđuje, odluke sa
 * obrazloženjima, evidentirani POEN, primedbe i odluke o njima, iskorišćenost
 * dnevnog limita. Stranica ovu komponentu korisniku koji nije u Kolu ne šalje.
 * Primedbu podnosi svaki učesnik dok zadatak traje (čl. 18).
 */
export default function ZadatakZaUcesnike({ oglasId, aktivan, podaci }: { oglasId: string; aktivan: boolean; podaci: Podaci }) {
  const t = useTranslations("doprinosOglasi");
  const locale = useLocale();
  const router = useRouter();
  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const datum = (d: string) => new Date(d).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "short", year: "numeric" });
  const [predmet, setPredmet] = useState<string>(PREDMETI_PRIMEDBE[0]);
  const [tekst, setTekst] = useState("");
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);
  const [salje, setSalje] = useState(false);

  async function posaljiPrimedbu() {
    setSalje(true);
    setPoruka(null);
    try {
      const res = await fetch(`/api/doprinos-oglasi/${oglasId}/primedba`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predmet, tekst }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setPoruka({ text: d.error ?? t("greska"), ok: false }); return; }
      setTekst("");
      setPoruka({ text: t("primedba_poslata"), ok: true });
      router.refresh();
    } finally {
      setSalje(false);
    }
  }

  return (
    <div className="space-y-4">
      <Kartica as="section">
        <h2 className="text-sm font-semibold">{t("uc_prijave")}</h2>
        {podaci.prijave.length === 0 ? (
          <p className="mt-2 text-sm text-kolo-muted">{t("uc_nema")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-kolo-border/50">
            {podaci.prijave.map((p) => (
              <li key={p.id} className="py-2 text-sm space-y-1">
                <p className="flex flex-wrap items-center gap-2">
                  <Pseudonim>{p.pseudonim}</Pseudonim>
                  <span className="text-xs text-kolo-muted">
                    {p.odustao ? t("uc_odustao") : p.zavrsnaOdluka ? t(`zavrsna_${p.zavrsnaOdluka}`) : t(`uc_prijava_${p.status}`)}
                    {p.dodeljena ? ` · ${t("uc_dodeljena")}` : ""} · {datum(p.createdAt)}
                  </span>
                </p>
                {p.planIzvrsenja && <p className="text-xs text-kolo-muted whitespace-pre-line"><span className="font-semibold">{t("uc_plan")}:</span> {p.planIzvrsenja}</p>}
                {p.ispunjenostUslova && <p className="text-xs text-kolo-muted"><span className="font-semibold">{t("uslov_label")}:</span> {p.ispunjenostUslova}</p>}
                {p.odlucioPseudonim && (
                  <p className="text-xs text-kolo-muted">{t("uc_odlucio", { pseudonim: p.odlucioPseudonim })}{p.obrazlozenje ? ` — ${p.obrazlozenje}` : ""}</p>
                )}
                {p.zavrsnuDaoPseudonim && (
                  <p className="text-xs text-kolo-muted">{t("uc_zavrsnu_dao", { pseudonim: p.zavrsnuDaoPseudonim })}{p.zavrsnoObrazlozenje ? ` — ${p.zavrsnoObrazlozenje}` : ""}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Kartica>

      <Kartica as="section">
        <h2 className="text-sm font-semibold">{t("uc_izvrsenja")}</h2>
        {podaci.izvrsenja.length === 0 ? (
          <p className="mt-2 text-sm text-kolo-muted">{t("uc_nema")}</p>
        ) : (
          <ul className="mt-2 divide-y divide-kolo-border/50">
            {podaci.izvrsenja.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p>
                    {e.pseudonim && <Pseudonim>{e.pseudonim}</Pseudonim>} · {datum(e.date)}
                    {e.celina != null ? ` · ${t("ev_celina", { broj: e.celina })}` : ""}
                    {e.zavrsna ? ` · ${t("uc_zavrsna")}` : ""}
                  </p>
                  <p className="text-xs text-kolo-muted">
                    {t(`uc_ev_${e.status}`)}
                    {e.odlucioPseudonim ? ` · ${t("uc_odlucio", { pseudonim: e.odlucioPseudonim })}` : ""}
                    {e.obrazlozenje ? ` — ${e.obrazlozenje}` : ""}
                  </p>
                  {e.visakZadruge != null && <p className="text-xs text-kolo-muted">{t("uc_visak", { iznos: broj(e.visakZadruge) })}</p>}
                </div>
                <span className="shrink-0 text-right text-xs tabular-nums">
                  {e.evidentirano != null ? t("ev_iznos_evidentirano", { iznos: broj(e.evidentirano) }) : t("ev_iznos_predlozeno", { iznos: broj(e.predlozeniPoen) })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Kartica>

      <Kartica as="section">
        <h2 className="text-sm font-semibold">{t("uc_limit")}</h2>
        <p className="mt-1 text-sm text-kolo-muted">{t("uc_limit_tekuci", { limit: broj(podaci.limit.limit), potvrdjeno: broj(podaci.limit.potvrdjenoOperativno) })}</p>
        {podaci.limit.prethodni.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-kolo-muted">
            {podaci.limit.prethodni.map((d) => (
              <li key={d.datum}>
                {t("uc_limit_dan", { datum: d.datum, limit: broj(d.limit), trazeno: broj(d.trazeno), evidentirano: broj(d.evidentirano), koeficijent: d.koeficijent.toFixed(4) })}
              </li>
            ))}
          </ul>
        )}
      </Kartica>

      <Kartica as="section" className="space-y-3">
        <h2 className="text-sm font-semibold">{t("uc_primedbe")}</h2>
        {podaci.primedbe.length === 0 ? (
          <p className="text-sm text-kolo-muted">{t("uc_nema")}</p>
        ) : (
          <ul className="divide-y divide-kolo-border/50">
            {podaci.primedbe.map((r) => (
              <li key={r.id} className="py-2 text-sm space-y-1">
                <p className="text-xs text-kolo-muted">{t(`primedba_predmet_${r.predmet}`)} · {datum(r.createdAt)}</p>
                <p className="whitespace-pre-line">{r.tekst}</p>
                {r.odluka ? (
                  <p className="text-xs text-kolo-muted">{t("uc_odlucio", { pseudonim: r.odlucioPseudonim ?? "—" })} — {r.odluka}</p>
                ) : (
                  <p className="text-xs text-kolo-gold-700">{t("uc_primedba_ceka")}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        {aktivan && (
          <div className="space-y-2 border-t border-kolo-border pt-3">
            <Polje oznaka={t("primedba_predmet")}>
              <select className={KLASE_UNOSA} value={predmet} onChange={(e) => setPredmet(e.target.value)}>
                {PREDMETI_PRIMEDBE.map((p) => <option key={p} value={p}>{t(`primedba_predmet_${p}`)}</option>)}
              </select>
            </Polje>
            <Polje oznaka={t("primedba_tekst")}>
              <textarea rows={3} value={tekst} onChange={(e) => setTekst(e.target.value)} className={`${KLASE_UNOSA} resize-none`} />
            </Polje>
            {poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
            <Dugme velicina="sm" onClick={posaljiPrimedbu} disabled={salje || tekst.trim().length < 10}>{t("primedba_posalji")}</Dugme>
          </div>
        )}
      </Kartica>
    </div>
  );
}
