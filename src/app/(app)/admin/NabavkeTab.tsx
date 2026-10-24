"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useDijalog } from "@/components/ui/Dijalog";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";

type Ponuda = { id: string; ponudjac: string; cena: number; izabrana: boolean; napomena: string | null };
type Nabavka = {
  id: string;
  naziv: string;
  status: string;
  dobavljac: string | null;
  nabavnaCena: number | null;
  brojDelova: number | null;
  velicinaDela: number | null;
  poenPoDelu: number | null;
  brojJedinica: number | null;
  jedinicaMere: string | null;
  prijaveDo: string | null;
  preuzimanjeOd: string | null;
  preuzimanjeDo: string | null;
  placenoRSD: number | null;
  brojPrijava: number;
  ponude: Ponuda[];
};
type Sredstva = {
  saldoRSD: number;
  trosakPrethodnogMesecaRSD: number;
  rezervaRSD: number;
  raspolozivoRSD: number;
  vetoAktivan: boolean;
};
type Registar = { nazivId: string; naziv: string; brojKorisnika: number };

const rsd = (n: number | null) => (n === null ? "—" : `${Math.round(n).toLocaleString("sr-RS")} RSD`);

/**
 * Admin tab „Nabavke" — sprovođenje kolektivne nabavke (Pravilnik o projektima i
 * kolektivnim nabavkama).
 *
 * Nije moderacija (tab „Pijaca"), nije prigovor (tab „Prigovori") i nije odluka o
 * prepisu POEN-a (tab „Razmene"). Ovde se troše dinarska sredstva i gasi POEN po
 * iskorišćenju — zaseban posao, zaseban tab.
 *
 * Sve što ekran računa dolazi sa servera: kalkulacija se snima na zapis pri objavi
 * (čl. 20 st. 2), pa se posle ne menja.
 */
export default function NabavkeTab({ onDone }: { onDone?: () => void }) {
  const t = useTranslations("admin");
  const { dijalog, unesi } = useDijalog();
  const [sredstva, setSredstva] = useState<Sredstva | null>(null);
  const [registar, setRegistar] = useState<Registar[]>([]);
  const [nabavke, setNabavke] = useState<Nabavka[]>([]);
  const [ucitava, setUcitava] = useState(true);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);

  // Obrasci
  const [ponudjac, setPonudjac] = useState("");
  const [cena, setCena] = useState("");
  const [kolicina, setKolicina] = useState("");
  const [velicinaDela, setVelicinaDela] = useState("");
  const [poenPoDelu, setPoenPoDelu] = useState("");
  const [obrazlozenje, setObrazlozenje] = useState("");
  const [jedinica, setJedinica] = useState("");
  const [mesto, setMesto] = useState("");
  const [odKad, setOdKad] = useState("");
  const [iznosPlacanja, setIznosPlacanja] = useState("");
  const [kod, setKod] = useState("");

  const ucitaj = useCallback(async () => {
    const res = await fetch("/api/admin/nabavke", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setSredstva(d.sredstva);
      setRegistar(d.registar ?? []);
      setNabavke(d.nabavke ?? []);
    }
    setUcitava(false);
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function posalji(putanja: string, telo?: unknown, metod = "POST") {
    setRadi(true);
    setGreska(null);
    setPoruka(null);
    try {
      const res = await fetch(putanja, {
        method: metod,
        headers: { "Content-Type": "application/json" },
        body: telo ? JSON.stringify(telo) : undefined,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.greska ?? d.error ?? t("nab_greska"));
        return null;
      }
      await ucitaj();
      onDone?.();
      return d;
    } finally {
      setRadi(false);
    }
  }

  if (ucitava) return <p className="text-sm text-kolo-muted">{t("nab_ucitavanje")}</p>;

  const uToku = nabavke.find((n) => n.status !== "ZAVRSENA" && n.status !== "OBUSTAVLJENA");

  return (
    <div className="space-y-5">
      {dijalog}
      {/* ── Sredstva (čl. 5) ───────────────────────────────────────────────── */}
      <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
        <h3 className="font-semibold">{t("nab_sredstva_naslov")}</h3>
        <dl className="mt-2 divide-y divide-kolo-border text-sm">
          {sredstva &&
            [
              [t("nab_saldo"), rsd(sredstva.saldoRSD)],
              [t("nab_trosak_meseca"), rsd(sredstva.trosakPrethodnogMesecaRSD)],
              [t("nab_rezerva"), `− ${rsd(sredstva.rezervaRSD)}`],
              [t("nab_raspolozivo"), rsd(sredstva.raspolozivoRSD)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1.5">
                <dt className="text-kolo-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
        </dl>
        {sredstva?.vetoAktivan && (
          <Obavestenje vrsta="greska" className="mt-2">
            {t("nab_veto")}
          </Obavestenje>
        )}
        <p className="mt-2 text-xs text-kolo-muted">
          {t("nab_odliv_napomena")}
        </p>
      </section>

      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      {poruka && <Obavestenje vrsta="uspeh">{poruka}</Obavestenje>}

      {/* ── Registar i otvaranje nabavke (čl. 12) ──────────────────────────── */}
      {!uToku && (
        <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
          <h3 className="font-semibold">{t("nab_registar_naslov")}</h3>
          <p className="mt-1 text-sm text-kolo-muted">
            {t("nab_registar_opis")}
          </p>
          {registar.length === 0 ? (
            <p className="mt-3 text-sm text-kolo-muted">{t("nab_registar_prazan")}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {registar.map((r) => (
                <li key={r.nazivId} className="flex items-center justify-between gap-3 rounded-kontrola bg-kolo-bg px-3 py-2">
                  <span className="truncate">
                    {r.naziv} <span className="text-kolo-muted">{t("nab_clanova", { n: r.brojKorisnika })}</span>
                  </span>
                  <button
                    onClick={() => posalji("/api/admin/nabavke", { nazivId: r.nazivId })}
                    disabled={radi}
                    className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" }) + " shrink-0"}
                  >
                    {t("nab_otvori")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── Nabavka u toku ─────────────────────────────────────────────────── */}
      {uToku && (
        <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{uToku.naziv}</h3>
            <span className="text-sm text-kolo-muted">{uToku.status}</span>
          </div>
          <p className="mt-1 text-sm text-kolo-muted">{t("nab_prijavljenih", { n: uToku.brojPrijava })}</p>

          {/* Ponude (čl. 15) */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold">{t("nab_ponude", { n: uToku.ponude.length })}</h4>
            <ul className="mt-2 space-y-1 text-sm">
              {uToku.ponude.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-kontrola bg-kolo-bg px-3 py-1.5">
                  <span>
                    {p.izabrana ? "✓ " : ""}
                    {p.ponudjac} — {rsd(p.cena)}
                  </span>
                  {uToku.status === "NACRT" && (
                    <button
                      onClick={() => posalji(`/api/admin/nabavke/${uToku.id}/ponuda`, { ponudaId: p.id }, "DELETE")}
                      disabled={radi}
                      className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}
                    >
                      {t("nab_obrisi")}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {uToku.status === "NACRT" && uToku.poenPoDelu === null && (
              <Obavestenje vrsta="upozorenje" className="mt-2">
                {t("nab_ponude_tek")}
              </Obavestenje>
            )}

            {uToku.status === "NACRT" && uToku.poenPoDelu !== null && (
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  value={ponudjac}
                  onChange={(e) => setPonudjac(e.target.value)}
                  placeholder={t("nab_ponudjac")}
                  aria-label={t("nab_ponudjac")}
                  className="min-w-[10rem] flex-1 rounded-kontrola border border-kolo-border px-3 py-1.5 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
                />
                <input
                  value={cena}
                  onChange={(e) => setCena(e.target.value)}
                  placeholder={t("nab_cena_jedinice")}
                  aria-label={t("nab_cena_jedinice")}
                  inputMode="decimal"
                  className="w-40 rounded-kontrola border border-kolo-border px-3 py-1.5 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
                />
                <button
                  onClick={async () => {
                    const r = await posalji(`/api/admin/nabavke/${uToku.id}/ponuda`, {
                      ponudjac,
                      cena: Number(cena),
                    });
                    if (r) {
                      setPonudjac("");
                      setCena("");
                    }
                  }}
                  disabled={radi || !ponudjac || !cena}
                  className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}
                >
                  {t("nab_dodaj")}
                </button>
              </div>
            )}
          </div>

          {/* Parametri odluke (čl. 17) — PRE prikupljanja ponuda */}
          {uToku.status === "NACRT" && uToku.poenPoDelu === null && (
            <div className="mt-4 rounded-kontrola bg-kolo-bg p-4">
              <h4 className="text-sm font-semibold">{t("nab_parametri_naslov")}</h4>
              <p className="mt-1 text-xs text-kolo-muted">
                {t("nab_parametri_opis")}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <input
                  value={kolicina}
                  onChange={(e) => setKolicina(e.target.value)}
                  placeholder={t("nab_kolicina")}
                  aria-label={t("nab_kolicina")}
                  inputMode="numeric"
                  className="rounded-kontrola border border-kolo-border px-3 py-1.5 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
                />
                <input
                  value={velicinaDela}
                  onChange={(e) => setVelicinaDela(e.target.value)}
                  placeholder={t("nab_velicina_dela")}
                  aria-label={t("nab_velicina_dela")}
                  inputMode="numeric"
                  className="rounded-kontrola border border-kolo-border px-3 py-1.5 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
                />
                <input
                  value={poenPoDelu}
                  onChange={(e) => setPoenPoDelu(e.target.value)}
                  placeholder={t("nab_poen_po_delu")}
                  aria-label={t("nab_poen_po_delu")}
                  inputMode="numeric"
                  className="rounded-kontrola border border-kolo-border px-3 py-1.5 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
                />
              </div>
              <input
                value={obrazlozenje}
                onChange={(e) => setObrazlozenje(e.target.value)}
                placeholder={t("nab_obrazlozenje")}
                  aria-label={t("nab_obrazlozenje")}
                className={KLASE_UNOSA + " mt-2"}
              />
              <button
                onClick={async () => {
                  const r = await posalji(`/api/admin/nabavke/${uToku.id}/parametri`, {
                    kolicina: Number(kolicina),
                    velicinaDela: Number(velicinaDela),
                    poenPoDelu: Number(poenPoDelu),
                    poenObrazlozenje: obrazlozenje,
                  });
                  if (r) setPoruka(t("nab_parametri_uspeh"));
                }}
                disabled={radi || !kolicina || !velicinaDela || !poenPoDelu || !obrazlozenje}
                className={klaseDugmeta() + " mt-2 w-full"}
              >
                {t("nab_utvrdi")}
              </button>
            </div>
          )}

          {/* Objava kalkulacije (čl. 15, 18, 20) */}
          {uToku.status === "NACRT" && uToku.poenPoDelu !== null && uToku.ponude.length >= 3 && (
            <div className="mt-4 rounded-kontrola bg-kolo-bg p-4">
              <h4 className="text-sm font-semibold">{t("nab_objava_naslov")}</h4>
              <p className="mt-1 text-xs text-kolo-muted">
                {t("nab_objava_opis")}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <input
                  value={jedinica}
                  onChange={(e) => setJedinica(e.target.value)}
                  placeholder={t("nab_jedinica")}
                  aria-label={t("nab_jedinica")}
                  className="rounded-kontrola border border-kolo-border px-3 py-1.5 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
                />
                <input
                  value={mesto}
                  onChange={(e) => setMesto(e.target.value)}
                  placeholder={t("nab_mesto")}
                  aria-label={t("nab_mesto")}
                  className="rounded-kontrola border border-kolo-border px-3 py-1.5 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
                />
                <input
                  type="date" lang="sr-RS"
                  aria-label={t("nab_preuzimanje_od")}
                  value={odKad}
                  onChange={(e) => setOdKad(e.target.value)}
                  className="rounded-kontrola border border-kolo-border px-3 py-1.5 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
                />
              </div>
              <button
                onClick={async () => {
                  const najjeftinija = [...uToku.ponude].sort((a, b) => a.cena - b.cena)[0];
                  const r = await posalji(`/api/admin/nabavke/${uToku.id}/objavi`, {
                    ponudaId: najjeftinija?.id,
                    jedinicaMere: jedinica,
                    mestoPreuzimanja: mesto,
                    preuzimanjeOd: odKad,
                  });
                  if (r) setPoruka(t("nab_objava_uspeh"));
                }}
                disabled={radi || !jedinica || !mesto || !odKad}
                className={klaseDugmeta() + " mt-2 w-full"}
              >
                {t("nab_objavi")}
              </button>
            </div>
          )}

          {/* Kalkulacija posle objave */}
          {uToku.poenPoDelu !== null && (
            <dl className="mt-4 divide-y divide-kolo-border text-sm">
              {[
                [t("nab_k_dobavljac"), uToku.dobavljac ?? "—"],
                [t("nab_k_cena"), rsd(uToku.nabavnaCena)],
                [t("nab_kolicina"), `${uToku.brojJedinica ?? "—"} × ${uToku.jedinicaMere ?? ""}`],
                [t("nab_k_delova"), `${uToku.brojDelova ?? "—"} × ${uToku.velicinaDela ?? "—"}`],
                [t("nab_poen_po_delu"), (uToku.poenPoDelu ?? 0).toLocaleString("sr-RS")],
                [t("nab_k_placeno"), rsd(uToku.placenoRSD)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-1.5">
                  <dt className="text-kolo-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Zatvaranje prijava (čl. 22) */}
          {uToku.status === "OBJAVLJENA" && (
            <button
              onClick={() => posalji(`/api/admin/nabavke/${uToku.id}/zatvori-prijave`)}
              disabled={radi}
              className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" }) + " mt-3 w-full"}
            >
              {t("nab_zatvori")}
            </button>
          )}

          {/* Plaćanje (čl. 25) */}
          {uToku.status === "RED_UTVRDJEN" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                value={iznosPlacanja}
                onChange={(e) => setIznosPlacanja(e.target.value)}
                placeholder={t("nab_placeno_dobavljacu")}
                  aria-label={t("nab_placeno_dobavljacu")}
                inputMode="decimal"
                className="min-w-[12rem] flex-1 rounded-kontrola border border-kolo-border px-3 py-1.5 text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
              />
              <button
                onClick={() => posalji(`/api/admin/nabavke/${uToku.id}/plati`, { iznosRSD: Number(iznosPlacanja) })}
                disabled={radi || !iznosPlacanja}
                className={klaseDugmeta()}
              >
                {t("nab_zabelezi_placanje")}
              </button>
            </div>
          )}

          {/* Preuzimanje uz kod (čl. 26, 27) */}
          {uToku.status === "PLACENA" && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                <input
                  value={kod}
                  onChange={(e) => setKod(e.target.value)}
                  placeholder={t("nab_kod")}
                  aria-label={t("nab_kod")}
                  className="min-w-[12rem] flex-1 rounded-kontrola border border-kolo-border px-3 py-1.5 font-mono text-sm bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
                />
                <button
                  onClick={async () => {
                    const r = await posalji(`/api/admin/nabavke/${uToku.id}/preuzimanje`, { kod });
                    if (r) {
                      setKod("");
                      setPoruka(t("nab_preuzeto", { pseudonim: r.pseudonim, poen: r.poen }));
                    }
                  }}
                  disabled={radi || !kod}
                  className={klaseDugmeta()}
                >
                  {t("nab_potvrdi_preuzimanje")}
                </button>
              </div>
              <p className="mt-1 text-xs text-kolo-muted">
                {t("nab_preuzimanje_napomena")}
              </p>
            </div>
          )}

          <button
            onClick={async () => {
              const razlog = (await unesi({ poruka: t("nab_obustava_razlog"), opasno: true, dugme: t("nab_obustavi") })) ?? "";
              if (razlog.trim().length >= 10) void posalji(`/api/admin/nabavke/${uToku.id}/obustavi`, { razlog });
              else if (razlog) setGreska(t("nab_obustava_kratko"));
            }}
            disabled={radi}
            className={klaseDugmeta({ varijanta: "opasno" }) + " mt-4"}
          >
            {t("nab_obustavi")}
          </button>
        </section>
      )}

      {/* ── Ranije nabavke ─────────────────────────────────────────────────── */}
      {nabavke.filter((n) => n.status === "ZAVRSENA" || n.status === "OBUSTAVLJENA").length > 0 && (
        <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
          <h3 className="font-semibold">{t("nab_ranije")}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {nabavke
              .filter((n) => n.status === "ZAVRSENA" || n.status === "OBUSTAVLJENA")
              .map((n) => (
                <li key={n.id} className="flex justify-between gap-3">
                  <span>{n.naziv}</span>
                  <span className="text-kolo-muted">
                    {n.status} · {rsd(n.placenoRSD)}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
