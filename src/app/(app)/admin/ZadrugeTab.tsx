"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Obavestenje from "@/components/ui/Obavestenje";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";

type Zadrugar = { clanstvoId: string; userId: string; pseudonim: string; imePrezime: string | null; telefon: string | null; od: string; miruje: boolean };
type ZadatakZadruge = { id: string; naziv: string; status: string; mesta: number; predlozeniPoen: number; brojCelina: number | null; izvrsioci: { pseudonim: string; prihvatio: boolean }[] };
type Zadruga = {
  id: string;
  naziv: string;
  lokalitet: string | null;
  maticniBroj: string | null;
  pib: string | null;
  adresa: string | null;
  ugovorAt: string | null;
  prestanakAt: string | null;
  zamrznutoAt: string | null;
  zamrznutoOsnov: string | null;
  zadrugaraUcesnika: number;
  najveciDnevniIznos: number | null;
  zadaci: ZadatakZadruge[];
  zapis: number;
  pragovi: { clanovi: number; poen: number; at: string }[];
  zadrugari: Zadrugar[];
};

const poen = (n: number) => `${n.toLocaleString("sr-RS")} POEN`;

/**
 * Admin tab „Zadruge" — Pravilnik o zadrugama (set 4.7.0).
 *
 * Radnje u zapisu zadruge sprovodi administratorski tim U IME ZADRUGE, po njenom
 * nalogu (čl. 15). Iznos određuje zadruga (čl. 14) — ekran ga samo upisuje, ne
 * predlaže i ne proverava „da li je primeren".
 *
 * 🔴 Ime i prezime i broj telefona zadrugara se vide SAMO ovde (čl. 15, 21,
 * Registar radnji obrade br. 19); nijedan korisnički ekran ih ne dobija.
 *
 * Zadruge 5.0: zadrugar koji nije učesnik miruje (čl. 6 st. 1); od otkaza ugovora,
 * odnosno pokretanja brisanja, zapis je zamrznut (čl. 22 st. 2); zadružni doprinos
 * (čl. 17; operativni čl. 23) objavljuje Fondacija po predlogu zadruge, a izvršioce
 * dodeljuje zadruga. Upis kruga kao zadruge je brisan u setu 5.0.
 *
 * Zadružni admin (U2) vidi ovaj isti ekran na `/admin/zadruga`, samo za svoju
 * zadrugu (`samoSvoja` iz rute): bez upisa zadruge, prestanka i izdavanja drugoj
 * zadruzi — to ostaje administratorskom timu Fondacije.
 */
export default function ZadrugeTab() {
  const t = useTranslations("admin");
  const [zadruge, setZadruge] = useState<Zadruga[]>([]);
  const [iznosJedinice, setIznosJedinice] = useState<number | null>(null);
  const [samoSvoja, setSamoSvoja] = useState(false);
  const [ucitava, setUcitava] = useState(true);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [otvorena, setOtvorena] = useState<string | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  const [nova, setNova] = useState({ naziv: "", lokalitet: "", maticniBroj: "", pib: "", adresa: "", ugovorAt: "" });
  const prazanZadatak = { title: "", description: "", opisCeline: "", procenaObima: "", poenPoCelini: "", brojCelina: "", obrazlozenje: "", positions: "1", deadline: "", rokIzvrsenja: "" };
  const [zadatak, setZadatak] = useState(prazanZadatak);
  const [dodela, setDodela] = useState<Record<string, string>>({});
  const [osnovZamrzavanja, setOsnovZamrzavanja] = useState("OTKAZ_UGOVORA");
  const [zadrugar, setZadrugar] = useState({ pseudonim: "", imePrezime: "", pristanak: false });
  const [zapis, setZapis] = useState({ osnov: "PRIJEM", pseudonim: "", primalacZadrugaId: "", iznos: "", opis: "" });

  const ucitaj = useCallback(async () => {
    const res = await fetch("/api/admin/zadruge", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setZadruge(d.zadruge ?? []);
      setIznosJedinice(typeof d.iznosJedinice === "number" ? d.iznosJedinice : null);
      setSamoSvoja(Boolean(d.samoSvoja));
    }
    setUcitava(false);
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function posalji(putanja: string, telo?: unknown, metod = "POST") {
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(putanja, {
        method: metod,
        headers: { "Content-Type": "application/json" },
        body: telo ? JSON.stringify(telo) : undefined,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.greska ?? d.error ?? t("zad_greska"));
        return false;
      }
      await ucitaj();
      return true;
    } finally {
      setRadi(false);
    }
  }

  if (ucitava) return <p className="text-sm text-kolo-muted">{t("zad_ucitavanje")}</p>;

  const polje = KLASE_UNOSA;
  const dugme = klaseDugmeta();

  return (
    <div className="space-y-5">
      {dijalog}
      <p className="text-sm text-kolo-muted">{t("zad_uvod")}</p>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}

      {/* ── Spisak zadruga ─────────────────────────────────────────────────── */}
      {zadruge.length === 0 && <p className="text-sm text-kolo-muted">{t("zad_nema")}</p>}
      {zadruge.map((z) => (
        <section key={z.id} className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
          <button
            type="button"
            className="flex w-full flex-wrap items-baseline justify-between gap-2 text-left"
            onClick={() => setOtvorena(otvorena === z.id ? null : z.id)}
          >
            <h3 className="font-semibold">
              {z.naziv} <span className="font-normal text-kolo-muted">· {z.lokalitet}</span>
            </h3>
            <span className="text-sm">
              {t("zad_zadrugara", { n: z.zadrugari.length })} · {poen(z.zapis)}
              {z.prestanakAt && <span className="ml-2 text-kolo-danger">{t("zad_prestala")}</span>}
              {!z.prestanakAt && z.zamrznutoAt && <span className="ml-2 text-kolo-danger">{t("zad_zamrznut")}</span>}
            </span>
          </button>
          <p className="mt-1 text-xs text-kolo-muted">
            {t("zad_mb_pib", { mb: z.maticniBroj ?? "—", pib: z.pib ?? "—" })}
            {z.ugovorAt && ` · ${t("zad_ugovor_od", { datum: new Date(z.ugovorAt).toLocaleDateString("sr-RS") })}`}
          </p>
          <p className="mt-1 text-xs text-kolo-muted">
            {t("zad_pragovi")}: {z.pragovi.length === 0 ? "—" : z.pragovi.map((p) => `${p.clanovi} → ${poen(p.poen)}`).join(" · ")}
          </p>
          <p className="mt-1 text-xs text-kolo-muted">
            {t("zad_ucesnika", { n: z.zadrugaraUcesnika, ukupno: z.zadrugari.length })}
            {" · "}
            {z.najveciDnevniIznos == null ? t("zad_jedinica_nije_utvrdjena") : t("zad_najveci_dnevni", { iznos: poen(z.najveciDnevniIznos) })}
          </p>
          {z.zamrznutoAt && (
            <p className="mt-1 text-xs text-kolo-danger">
              {t("zad_zamrznut_od", { datum: new Date(z.zamrznutoAt).toLocaleDateString("sr-RS"), osnov: t(`zad_osnov_zamrzavanja_${z.zamrznutoOsnov ?? "OTKAZ_UGOVORA"}`) })}
            </p>
          )}

          {otvorena === z.id && !z.prestanakAt && (
            <div className="mt-4 space-y-5">
              {/* Zadrugari (čl. 6, 8) */}
              <div>
                <h4 className="text-sm font-semibold">{t("zad_zadrugari")}</h4>
                <ul className="mt-2 space-y-1 text-sm">
                  {z.zadrugari.map((c) => (
                    <li key={c.clanstvoId} className="flex items-center justify-between gap-3 rounded-kontrola bg-kolo-bg px-3 py-1.5">
                      <span>
                        {c.imePrezime ?? "—"} <span className="text-kolo-muted">({c.pseudonim}{c.telefon ? ` · ${c.telefon}` : ""})</span>
                        {c.miruje && <span className="ml-2 text-xs text-kolo-gold-700">{t("zad_miruje")}</span>}
                      </span>
                      <button
                        disabled={radi}
                        className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" }) + " shrink-0"}
                        onClick={async () => {
                          if (await potvrdi({ poruka: t("zad_ukloni_potvrda", { pseudonim: c.pseudonim }), opasno: true, dugme: t("zad_ukloni") }))
                            void posalji(`/api/admin/zadruge/${z.id}/zadrugari/${c.clanstvoId}`, undefined, "DELETE");
                        }}
                      >
                        {t("zad_ukloni")}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <input className={polje} placeholder={t("zad_pseudonim")} aria-label={t("zad_pseudonim")} value={zadrugar.pseudonim}
                    onChange={(e) => setZadrugar({ ...zadrugar, pseudonim: e.target.value })} />
                  <input className={polje} placeholder={t("zad_ime_prezime")} aria-label={t("zad_ime_prezime")} value={zadrugar.imePrezime}
                    onChange={(e) => setZadrugar({ ...zadrugar, imePrezime: e.target.value })} />
                </div>
                <label className="mt-2 flex items-start gap-2 text-xs text-kolo-muted">
                  <input type="checkbox" checked={zadrugar.pristanak}
                    onChange={(e) => setZadrugar({ ...zadrugar, pristanak: e.target.checked })} />
                  <span>{t("zad_pristanak")}</span>
                </label>
                <button disabled={radi} className={`${dugme} mt-2`}
                  onClick={async () => {
                    if (await posalji(`/api/admin/zadruge/${z.id}/zadrugari`, zadrugar))
                      setZadrugar({ pseudonim: "", imePrezime: "", pristanak: false });
                  }}>
                  {t("zad_dodaj_zadrugara")}
                </button>
              </div>

              {/* Zapis sa osnovom (čl. 11–16) */}
              <div>
                <h4 className="text-sm font-semibold">{t("zad_zapis_naslov")}</h4>
                <p className="mt-1 text-xs text-kolo-muted">{t("zad_zapis_opis")}</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  <select className={polje} aria-label={t("zad_zapis_naslov")} value={zapis.osnov} onChange={(e) => setZapis({ ...zapis, osnov: e.target.value })}>
                    <option value="PRIJEM">{t("zad_osnov_prijem")}</option>
                    <option value="DOPRINOS">{t("zad_osnov_doprinos")}</option>
                    <option value="USLUGA_PRIMLJENA">{t("zad_osnov_usluga")}</option>
                    {!samoSvoja && <option value="IZDAVANJE">{t("zad_osnov_izdavanje_zadruzi")}</option>}
                  </select>
                  {zapis.osnov === "IZDAVANJE" ? (
                    <select className={polje} aria-label={t("zad_izaberi_zadrugu")} value={zapis.primalacZadrugaId}
                      onChange={(e) => setZapis({ ...zapis, primalacZadrugaId: e.target.value })}>
                      <option value="">{t("zad_izaberi_zadrugu")}</option>
                      {zadruge.filter((d) => d.id !== z.id && !d.prestanakAt).map((d) => (
                        <option key={d.id} value={d.id}>{d.naziv}</option>
                      ))}
                    </select>
                  ) : (
                    <input className={polje} placeholder={t("zad_primalac")} aria-label={t("zad_primalac")} value={zapis.pseudonim}
                      onChange={(e) => setZapis({ ...zapis, pseudonim: e.target.value })} />
                  )}
                  <input className={polje} inputMode="numeric" placeholder={t("zad_iznos")} aria-label={t("zad_iznos")} value={zapis.iznos}
                    onChange={(e) => setZapis({ ...zapis, iznos: e.target.value })} />
                  <input className={polje} placeholder={t("zad_opis_zapisa")} aria-label={t("zad_opis_zapisa")} value={zapis.opis} maxLength={200}
                    onChange={(e) => setZapis({ ...zapis, opis: e.target.value })} />
                </div>
                <button disabled={radi} className={`${dugme} mt-2`}
                  onClick={async () => {
                    if (await posalji(`/api/admin/zadruge/${z.id}/zapis`, zapis))
                      setZapis({ ...zapis, pseudonim: "", iznos: "", opis: "" });
                  }}>
                  {t("zad_upisi")}
                </button>
              </div>

              {/* Zadružni doprinos (čl. 17; operativni čl. 23) */}
              <div>
                <h4 className="text-sm font-semibold">{t("zad_zd_naslov")}</h4>
                <p className="mt-1 text-xs text-kolo-muted">{t("zad_zd_opis")}</p>
                {z.zadaci.length > 0 && (
                  <ul className="mt-2 space-y-2 text-sm">
                    {z.zadaci.map((o) => (
                      <li key={o.id} className="rounded-kontrola bg-kolo-bg px-3 py-2">
                        <p className="font-medium">{o.naziv} <span className="text-xs text-kolo-muted">· {o.status === "ACTIVE" ? t("ped_oglas_aktivan") : t("ped_oglas_zatvoren")} · {o.brojCelina ?? "—"} × {o.brojCelina ? poen(Math.floor(o.predlozeniPoen / o.brojCelina)) : "—"}</span></p>
                        <p className="text-xs text-kolo-muted">
                          {o.izvrsioci.length === 0 ? t("zad_zd_bez_izvrsilaca") : o.izvrsioci.map((i) => `${i.pseudonim}${i.prihvatio ? "" : ` (${t("zad_zd_ceka_prihvatanje")})`}`).join(", ")}
                        </p>
                        {o.status === "ACTIVE" && !z.zamrznutoAt && o.izvrsioci.length < o.mesta && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <input className={polje + " max-w-xs"} placeholder={t("zad_pseudonim")} aria-label={t("zad_pseudonim")} value={dodela[o.id] ?? ""}
                              onChange={(e) => setDodela({ ...dodela, [o.id]: e.target.value })} />
                            <button disabled={radi} className={klaseDugmeta({ velicina: "sm" })}
                              onClick={async () => {
                                if (await posalji(`/api/admin/zadruge/${z.id}/zadruzni/${o.id}/dodela`, { pseudonim: dodela[o.id] ?? "" }))
                                  setDodela({ ...dodela, [o.id]: "" });
                              }}>
                              {t("zad_zd_dodeli")}
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {!samoSvoja && !z.zamrznutoAt && (iznosJedinice == null ? (
                  <p className="mt-2 text-xs text-kolo-muted">{t("zad_jedinica_nije_utvrdjena")}</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-kolo-muted">{t("zad_zd_objava")}</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {(["title", "description", "opisCeline", "procenaObima", "obrazlozenje"] as const).map((k) => (
                        <input key={k} className={polje} placeholder={t(`zad_zd_${k}`)} aria-label={t(`zad_zd_${k}`)} value={zadatak[k]}
                          onChange={(e) => setZadatak({ ...zadatak, [k]: e.target.value })} />
                      ))}
                      {(["poenPoCelini", "brojCelina", "positions"] as const).map((k) => (
                        <input key={k} className={polje} inputMode="numeric" placeholder={t(`zad_zd_${k}`)} aria-label={t(`zad_zd_${k}`)} value={zadatak[k]}
                          onChange={(e) => setZadatak({ ...zadatak, [k]: e.target.value })} />
                      ))}
                      {(["deadline", "rokIzvrsenja"] as const).map((k) => (
                        <label key={k} className="block text-xs text-kolo-muted">
                          {t(`zad_zd_${k}`)}
                          <input type="date" lang="sr-RS" className={polje} value={zadatak[k]} onChange={(e) => setZadatak({ ...zadatak, [k]: e.target.value })} />
                        </label>
                      ))}
                    </div>
                    <button disabled={radi} className={dugme}
                      onClick={async () => {
                        if (await posalji(`/api/admin/zadruge/${z.id}/zadruzni`, zadatak)) setZadatak(prazanZadatak);
                      }}>
                      {t("zad_zd_objavi")}
                    </button>
                  </div>
                ))}
              </div>

              {/* Zamrzavanje zapisa (čl. 22 st. 2) — samo administratorski tim Fondacije */}
              {!samoSvoja && !z.zamrznutoAt && <div className="border-t border-kolo-border pt-3 space-y-2">
                <p className="text-xs text-kolo-muted">{t("zad_zamrzavanje_opis")}</p>
                <div className="flex flex-wrap gap-2">
                  <select className={polje + " max-w-xs"} aria-label={t("zad_zamrzavanje")} value={osnovZamrzavanja} onChange={(e) => setOsnovZamrzavanja(e.target.value)}>
                    <option value="OTKAZ_UGOVORA">{t("zad_osnov_zamrzavanja_OTKAZ_UGOVORA")}</option>
                    <option value="BRISANJE_IZ_REGISTRA">{t("zad_osnov_zamrzavanja_BRISANJE_IZ_REGISTRA")}</option>
                  </select>
                  <button disabled={radi} className={klaseDugmeta({ varijanta: "opasno" })}
                    onClick={async () => {
                      if (await potvrdi({ poruka: t("zad_zamrzavanje_potvrda", { naziv: z.naziv }), opasno: true, dugme: t("zad_zamrzavanje") }))
                        void posalji(`/api/admin/zadruge/${z.id}/zamrzavanje`, { osnov: osnovZamrzavanja });
                    }}>
                    {t("zad_zamrzavanje")}
                  </button>
                </div>
              </div>}

              {/* Prestanak (čl. 22) — samo administratorski tim Fondacije */}
              {!samoSvoja && <div className="border-t border-kolo-border pt-3">
                <button disabled={radi} className={klaseDugmeta({ varijanta: "opasno" })}
                  onClick={async () => {
                    if (await potvrdi({ poruka: t("zad_prestanak_potvrda", { naziv: z.naziv, iznos: poen(z.zapis) }), opasno: true, dugme: t("zad_prestanak") }))
                      void posalji(`/api/admin/zadruge/${z.id}/prestanak`);
                  }}>
                  {t("zad_prestanak")}
                </button>
              </div>}
            </div>
          )}
        </section>
      ))}

      {/* ── Upis zadruge (čl. 4) — samo administratorski tim Fondacije ─────── */}
      {!samoSvoja && <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
        <h3 className="font-semibold">{t("zad_upis_naslov")}</h3>
        <p className="mt-1 text-xs text-kolo-muted">{t("zad_upis_opis")}</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input className={polje} placeholder={t("zad_naziv")} aria-label={t("zad_naziv")} value={nova.naziv} onChange={(e) => setNova({ ...nova, naziv: e.target.value })} />
          <input className={polje} placeholder={t("zad_lokalitet")} aria-label={t("zad_lokalitet")} value={nova.lokalitet} onChange={(e) => setNova({ ...nova, lokalitet: e.target.value })} />
          <input className={polje} placeholder={t("zad_mb")} aria-label={t("zad_mb")} value={nova.maticniBroj} onChange={(e) => setNova({ ...nova, maticniBroj: e.target.value })} />
          <input className={polje} placeholder={t("zad_pib")} aria-label={t("zad_pib")} value={nova.pib} onChange={(e) => setNova({ ...nova, pib: e.target.value })} />
          <input className={polje} placeholder={t("zad_adresa")} aria-label={t("zad_adresa")} value={nova.adresa} onChange={(e) => setNova({ ...nova, adresa: e.target.value })} />
          <label className="block text-sm font-medium text-kolo-text">
            {t("zad_ugovor_datum")}
            <input type="date" lang="sr-RS" className={polje} value={nova.ugovorAt} onChange={(e) => setNova({ ...nova, ugovorAt: e.target.value })} />
          </label>
        </div>
        <button disabled={radi} className={`${dugme} mt-3`}
          onClick={async () => {
            if (await posalji("/api/admin/zadruge", nova))
              setNova({ naziv: "", lokalitet: "", maticniBroj: "", pib: "", adresa: "", ugovorAt: "" });
          }}>
          {t("zad_upisi_zadrugu")}
        </button>
      </section>}
    </div>
  );
}
