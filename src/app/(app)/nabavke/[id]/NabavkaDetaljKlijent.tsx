"use client";

import { klaseDugmeta } from "@/components/ui/Dugme";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { daniPeriodaPreuzimanja } from "@/lib/nabavka-pravila";

type Moja = {
  status: string;
  mesto: number | null;
  kod: string | null;
  danPreuzimanja: string | null;
  rezervisano: number;
  pozvanAt: string | null;
};
type Detalj = {
  id: string;
  naziv: string;
  status: string;
  jedinicaMere: string | null;
  poenObrazlozenje: string | null;
  brojJedinica: number | null;
  brojDelova: number | null;
  velicinaDela: number | null;
  poenPoDelu: number | null;
  ukupnoPoena: number | null;
  mestoPreuzimanja: string | null;
  preuzimanjeOd: string | null;
  preuzimanjeDo: string | null;
  prijaveDo: string | null;
  obustavaRazlog: string | null;
  brojPrijava: number;
  /** `null` kad posmatrač nije učesnik — spisak dobijaju samo učesnici (nabavke čl. 37 st. 3). */
  preuzeli: { pseudonim: string; mesto: number | null }[] | null;
  moja: Moja | null;
};

const poen = (n: number | null) => (n === null ? "—" : n.toLocaleString("sr-RS"));
// Datumi se ispisuju po srpskom vremenu — obračunski dan, isti kao na serveru.
const dan = (s: string | null) => (s ? new Date(s).toLocaleDateString("sr-RS", { timeZone: "Europe/Belgrade" }) : "—");

/** Dani objavljenog perioda preuzimanja, za birač dana (nabavke čl. 21 st. 2) — iz pravila, po obračunskom danu. */
function daniPerioda(od: string | null, doD: string | null): string[] {
  if (!od || !doD) return [];
  return daniPeriodaPreuzimanja(new Date(od), new Date(doD));
}

/**
 * Kartica jedne nabavke: cela kalkulacija (nabavke čl. 18) i sopstveno mesto u postupku.
 *
 * 🔴 Dinarska strana (ponude, dobavljač, nabavna cena, sredstva, plaćen iznos) NIJE
 * na ovoj kartici (čl. 18 st. 2): objavljuje se u izveštaju o raspolaganju sredstvima
 * Fondacije, odvojeno (čl. 37 st. 2; `/sistem?sekcija=fondacija`). Ovde stoji samo
 * upućivanje. Odbijena mera: dinarski trošak se ne vraća uz broj POEN-a po delu.
 */
export default function NabavkaDetaljKlijent({ id }: { id: string }) {
  const t = useTranslations("nabavke");
  const [n, setN] = useState<Detalj | null>(null);
  const [ucitava, setUcitava] = useState(true);
  const [radi, setRadi] = useState(false);
  const [izabranDan, setIzabranDan] = useState("");
  const [greska, setGreska] = useState<string | null>(null);

  const ucitaj = useCallback(async () => {
    const res = await fetch(`/api/nabavke/${id}`, { cache: "no-store" });
    if (res.ok) setN(await res.json());
    setUcitava(false);
  }, [id]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function posalji(putanja: string, telo?: unknown) {
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(`/api/nabavke/${id}/${putanja}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: telo ? JSON.stringify(telo) : undefined,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.greska ?? d.error ?? t("greska_opsta"));
        return;
      }
      await ucitaj();
    } finally {
      setRadi(false);
    }
  }

  if (ucitava) return <p className="mx-auto max-w-2xl text-sm text-kolo-muted">{t("ucitavanje")}</p>;
  if (!n) return <p className="mx-auto max-w-2xl text-sm text-kolo-muted">{t("nije_nadjena")}</p>;

  const dani = daniPerioda(n.preuzimanjeOd, n.preuzimanjeDo);
  const m = n.moja;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <Link href="/nabavke" className="text-sm text-kolo-muted hover:underline">
          ← {t("nazad")}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{n.naziv}</h1>
        <p className="mt-1 text-sm text-kolo-muted">{t(`status_${n.status}` as never)}</p>
      </div>

      {n.obustavaRazlog && (
        <p className="rounded-xl border border-kolo-danger bg-white p-3 text-sm text-kolo-danger">
          {t("obustavljena", { razlog: n.obustavaRazlog })}
        </p>
      )}

      {/* ── Moje mesto u postupku ─────────────────────────────────────────── */}
      <section className="rounded-kartica border border-kolo-green-700 bg-kolo-green-50 p-5 shadow-kartica">
        {!m && n.status === "OBJAVLJENA" && (
          <>
            <p className="text-sm">{t("prijava_opis", { rok: dan(n.prijaveDo) })}</p>
            <button
              onClick={() => posalji("prijavi")}
              disabled={radi}
              className={`${klaseDugmeta({ punaSirina: true })} mt-3`}
            >
              {t("prijavi_se")}
            </button>
          </>
        )}

        {!m && n.status !== "OBJAVLJENA" && <p className="text-sm">{t("prijave_zatvorene")}</p>}

        {m?.status === "PRIJAVLJEN" && (
          <>
            <p className="text-sm font-medium">
              {m.mesto ? t("cekas_mesto", { mesto: m.mesto }) : t("cekas_red")}
            </p>
            <button
              onClick={() => posalji("odustani")}
              disabled={radi}
              className={`${klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })} mt-3`}
            >
              {t("odustani")}
            </button>
          </>
        )}

        {m?.status === "POZVAN" && (
          <>
            <p className="text-sm font-medium">
              {t("pozvan", { mesto: m.mesto ?? 0, poen: poen(n.poenPoDelu) })}
            </p>
            <p className="mt-1 text-sm text-kolo-muted">{t("pozvan_uputstvo")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {dani.map((d) => (
                <button
                  key={d}
                  onClick={() => setIzabranDan(d)}
                  className={`min-h-10 rounded-kontrola border px-3 text-sm transition-colors ${
                    izabranDan === d
                      ? "border-kolo-green-700 bg-kolo-green-700 text-white"
                      : "border-kolo-border bg-white"
                  }`}
                >
                  {new Date(d).toLocaleDateString("sr-RS", { timeZone: "UTC" })}
                </button>
              ))}
            </div>
            <button
              onClick={() => posalji("potvrdi", { dan: izabranDan })}
              disabled={radi || !izabranDan}
              className={`${klaseDugmeta({ punaSirina: true })} mt-3`}
            >
              {t("potvrdi")}
            </button>
            <button
              onClick={() => posalji("odustani")}
              disabled={radi}
              className={`${klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })} mt-2`}
            >
              {t("odustani")}
            </button>
          </>
        )}

        {m?.status === "POTVRDIO" && (
          <>
            <p className="text-sm font-medium">
              {t("potvrdjeno", { dan: dan(m.danPreuzimanja), mesto: n.mestoPreuzimanja ?? "" })}
            </p>
            <p className="mt-2 inline-block rounded-xl bg-white px-4 py-2 font-mono text-lg font-bold tracking-wider">
              {m.kod}
            </p>
            <p className="mt-2 text-sm text-kolo-muted">{t("kod_uputstvo")}</p>
            <p className="mt-1 text-sm">{t("rezervisano", { poen: poen(m.rezervisano) })}</p>
            <button
              onClick={() => posalji("odustani")}
              disabled={radi}
              className={`${klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })} mt-3`}
            >
              {t("odustani")}
            </button>
          </>
        )}

        {m?.status === "PREUZEO" && <p className="text-sm font-medium">{t("preuzeto", { poen: poen(n.poenPoDelu) })}</p>}
        {m && ["ODUSTAO", "ISTEKAO", "NIJE_PREUZEO"].includes(m.status) && (
          <p className="text-sm">{t(`moja_${m.status}` as never)}</p>
        )}

        {greska && <p className="mt-2 text-sm text-kolo-danger">{greska}</p>}
      </section>

      {/* ── Kalkulacija (čl. 18 st. 1) ────────────────────────────────────── */}
      {/* 🔴 R-02, mera M-11: dinarska strana je IZVUČENA iz ove tabele. Do 4.5.9 su
          `k_poen_po_delu` i `k_placeno` stajali jedan ispod drugog, pa se odnos
          POEN-a prema dinaru dobijao deljenjem — jedino preostalo mesto na kome je
          Fondacija sama objavljivala kurs, posle svega što je R-01 uklonio. Oba
          podatka ostaju javna (čl. 37), samo više nisu u istom dokumentu.
          NE VRAĆATI dinarske redove u ovu tabelu. */}
      {n.poenPoDelu !== null && (
        <section className="rounded-kartica border border-kolo-border bg-white p-5 shadow-kartica">
          <h2 className="text-lg font-semibold">{t("kalkulacija")}</h2>
          <dl className="mt-3 divide-y divide-kolo-border text-sm">
            {[
              [t("k_jedinica"), String(n.brojJedinica ?? "—")],
              [t("k_delova"), String(n.brojDelova ?? "—")],
              [t("k_deo"), `${n.velicinaDela ?? "—"} × ${n.jedinicaMere ?? ""}`],
              [t("k_poen_po_delu"), poen(n.poenPoDelu)],
              [t("k_ukupno_poena"), poen(n.ukupnoPoena)],
              [t("k_mesto"), n.mestoPreuzimanja ?? "—"],
              [t("k_period"), `${dan(n.preuzimanjeOd)} – ${dan(n.preuzimanjeDo)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1.5">
                <dt className="text-kolo-muted">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {n.poenObrazlozenje && (
            <p className="mt-3 text-xs text-kolo-muted">{t("k_obrazlozenje", { obrazlozenje: n.poenObrazlozenje })}</p>
          )}
          <p className="mt-2 text-xs text-kolo-muted">{t("paritet_napomena")}</p>
        </section>
      )}

      {/* ── Dinarska strana: samo upućivanje (čl. 18 st. 2, čl. 37 st. 2) ──── */}
      {n.poenPoDelu !== null && (
        <p className="text-sm text-kolo-muted">
          {t("dinarska_upucivanje")}{" "}
          <Link href="/sistem?sekcija=fondacija" className="font-medium text-kolo-green-700 hover:underline">
            {t("dinarska_link")}
          </Link>
        </p>
      )}

      {/* ── Ko je preuzeo (čl. 37 st. 3) ──────────────────────────────────── */}
      {n.preuzeli && n.preuzeli.length > 0 && (
        <section className="rounded-kartica border border-kolo-border bg-white p-5 shadow-kartica">
          <h2 className="text-lg font-semibold">{t("preuzeli")}</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {n.preuzeli.map((p, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate">{p.pseudonim}</span>
                <span className="shrink-0 text-kolo-muted">{p.mesto}.</span>
              </li>
            ))}
          </ul>
          {/* Broj POEN-a u zapisu se uz spisak NE objavljuje (čl. 37 st. 3). */}
          <p className="mt-2 text-xs text-kolo-muted">{t("preuzeli_napomena")}</p>
        </section>
      )}

      <p className="text-sm text-kolo-muted">{t("broj_prijava", { broj: n.brojPrijava })}</p>
    </div>
  );
}
