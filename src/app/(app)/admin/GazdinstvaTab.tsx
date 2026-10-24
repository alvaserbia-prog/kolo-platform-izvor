"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";

/** Član u prikazu: status se izvodi na serveru (set 4.8.2); `uKolu` = uslov iz čl. 7a. */
type KorisnikClan = { pseudonim: string; status: string; uKolu: boolean; identitet: { imePrezime: string } | null };
type Clan = {
  id: string;
  userId: string;
  uloga: "NOSILAC" | "CLAN";
  status: string;
  pristupioAt: string | null;
  izjavaTekst: string | null;
  user: KorisnikClan;
  doprinos: { iznos: number; status: string; redniBroj: number } | null;
};
type Gazdinstvo = {
  id: string;
  naziv: string;
  naselje: string;
  lat: number | null;
  lng: number | null;
  opis: string;
  bpg: string | null;
  adresa: string | null;
  neregistrovano: boolean;
  status: string;
  razlogVracanja: string | null;
  podnetoAt: string | null;
  odobrenoAt: string | null;
  /** Broj nosioca za razgovor (čl. 6a) — samo admin; briše se odlukom. */
  telefonZaRazgovor: string | null;
  razgovorObavljenAt: string | null;
  /** Ko je razgovor zabeležio (admin ili član Kola sa spiska, čl. 6a st. 2). */
  razgovorBeleziId: string | null;
  /** Član Kola posle razgovora sa spiska: postoji osnov za sumnju (čl. 6a st. 4). */
  razgovorSumnja: boolean | null;
  rpgUporedjenAt: string | null;
  smeClanoveOd: string | null;
  izvod: { contentType: string; velicina: number; otpremljenAt: string } | null;
  trebaIzvod: boolean;
  podnosilacUserId: string | null;
  odgovaraZaIzjavu: string | null;
  clanovi: Clan[];
  /** Istupili članovi — i njih pogađa poništenje zbog lažne izjave (čl. 12 st. 2). */
  istupili?: { userId: string; pseudonim: string }[];
  oglasi: { id: string; title: string; category: string; tip: string; seller: { pseudonim: string } }[];
  vazecihOglasa: number;
};
type Pristupanje = {
  id: string;
  uloga: "NOSILAC" | "CLAN";
  pristupioAt: string | null;
  izjavaTekst: string | null;
  user: KorisnikClan;
  gazdinstvo: { id: string; naziv: string; naselje: string };
};

const poen = (n: number) => `${n.toLocaleString("sr-RS")} POEN`;

/**
 * Admin tab „Gazdinstva" — Pravilnik o gazdinstvima (set 4.8.2).
 *
 * Odobrenjem Fondacija UTVRĐUJE da su uslovi ispunjeni (potpuna prijava, data
 * izjava, tri oglasa koji su stvarna ponuda) — ne odlučuje o doprinosu (čl. 40c
 * st. 5). Podatke u državnom registru ne proverava; kad podnosilac koji je
 * korisnik ili član bez potvrde priloži izvod iz Registra, podatke iz prijave
 * poredi sa njim (čl. 4b). Pre odobrenja razgovara SAMO sa nosiocem (čl. 6a);
 * svaki član osim podnosioca mora biti član Kola (čl. 7a).
 *
 * 🔴 Odobrenje i izvod NE potvrđuju stvarnost (čl. 4a poslednji stav, 4b st. 5).
 * 🔴 BPG, izjava o tačnosti, ime i prezime članova, broj za razgovor i izvod se
 * vide SAMO ovde (Registar radnji obrade br. 20 i 21). Izvod i broj se brišu
 * odlukom o prijavi.
 * Poništenje zbog lažne izjave otpisuje doprinos svim članovima, i ranije
 * istupelima (i u minus), i isključuje ih — zato je dugme samo za superadmina.
 */
export default function GazdinstvaTab({ jeSuperadmin }: { jeSuperadmin: boolean }) {
  const t = useTranslations("admin");
  const [gazdinstva, setGazdinstva] = useState<Gazdinstvo[]>([]);
  const [pristupanja, setPristupanja] = useState<Pristupanje[]>([]);
  const [minOglasa, setMinOglasa] = useState(3);
  const [ucitava, setUcitava] = useState(true);
  // Ko se isključuje pri poništenju zbog lažne izjave, po gazdinstvu (čl. 12 st. 3; U5).
  const [iskljuciOznaceni, setIskljuciOznaceni] = useState<Record<string, string[]>>({});
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [razlozi, setRazlozi] = useState<Record<string, string>>({});
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    const res = await fetch("/api/admin/gazdinstva", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      setGazdinstva(d.gazdinstva ?? []);
      setPristupanja(d.pristupanja ?? []);
      setMinOglasa(d.minOglasa ?? 3);
    }
    setUcitava(false);
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  async function posalji(putanja: string, telo?: unknown) {
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(putanja, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: telo ? JSON.stringify(telo) : undefined,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(d.error ?? t("gaz_greska"));
        return false;
      }
      await ucitaj();
      return true;
    } finally {
      setRadi(false);
    }
  }

  if (ucitava) return <p className="text-sm text-kolo-muted">{t("gaz_ucitavanje")}</p>;

  const polje = KLASE_UNOSA;
  const dugme = klaseDugmeta();
  const dugmeSek = klaseDugmeta({ varijanta: "sekundarno" });
  const dugmeOpasno = klaseDugmeta({ varijanta: "opasno" });

  const naPregledu = gazdinstva.filter((g) => g.status === "NA_PREGLEDU");
  const odobrena = gazdinstva.filter((g) => g.status === "ODOBRENO");
  const uPripremi = gazdinstva.filter((g) => g.status === "NACRT" || g.status === "VRACENO");

  const razlog = (k: string) => razlozi[k] ?? "";
  const postaviRazlog = (k: string, v: string) => setRazlozi((r) => ({ ...r, [k]: v }));

  /**
   * Razgovor sa NOSIOCEM pre odobrenja (čl. 6a): broj telefona i oznaka da je
   * razgovor obavljen. Bez oznake nema odobrenja; broj se briše odlukom.
   */
  function Razgovor({ g }: { g: Gazdinstvo }) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{t("gaz_razgovor_nosilac")}</span>
        {g.telefonZaRazgovor ? (
          <span className="select-all font-semibold">{g.telefonZaRazgovor}</span>
        ) : (
          <span className="text-kolo-muted">{t("gaz_telefon_nema")}</span>
        )}
        {g.razgovorObavljenAt ? (
          <span className={g.razgovorSumnja ? "text-kolo-gold-700" : "text-kolo-green-700"}>
            {g.razgovorSumnja === null
              ? t("gaz_razgovor_obavljen")
              : g.razgovorSumnja
                ? t("gaz_razgovor_spisak_sumnja")
                : t("gaz_razgovor_spisak")}
          </span>
        ) : (
          <button
            type="button"
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
            disabled={radi}
            onClick={() => posalji(`/api/admin/gazdinstva/${g.id}/razgovor`)}
          >
            {t("gaz_oznaci_razgovor")}
          </button>
        )}
      </p>
    );
  }

  /**
   * Izvod iz Registra (čl. 4b): otvara se samo ovde, pa se beleži da je poređenje
   * izvršeno. Kad se podaci ne slažu, prijava se vraća na dopunu.
   */
  function Izvod({ g }: { g: Gazdinstvo }) {
    if (!g.trebaIzvod) {
      return g.neregistrovano ? null : <p className="text-sm text-kolo-muted">{t("gaz_izvod_ne_trazi")}</p>;
    }
    return (
      <div className="space-y-1 text-sm">
        <p className="font-semibold">{t("gaz_izvod_naslov")}</p>
        {g.izvod ? (
          <p className="flex flex-wrap items-center gap-2">
            <a className="underline" href={`/api/admin/gazdinstva/${g.id}/izvod`} target="_blank" rel="noreferrer">
              {t("gaz_izvod_otvori")}
            </a>
            {g.rpgUporedjenAt ? (
              <span className="text-kolo-green-700">{t("gaz_uporedjeno")}</span>
            ) : (
              <button
                type="button"
                className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                disabled={radi}
                onClick={() => posalji(`/api/admin/gazdinstva/${g.id}/uporedjen`)}
              >
                {t("gaz_uporedi")}
              </button>
            )}
          </p>
        ) : (
          <Obavestenje vrsta="upozorenje">{t("gaz_izvod_nema")}</Obavestenje>
        )}
        <p className="text-xs text-kolo-muted">{t("gaz_izvod_napomena")}</p>
      </div>
    );
  }

  /** Uslovi odobrenja (čl. 6 st. 5, 7a) — dugme je zaključano dok nisu ispunjeni; server proverava isto. */
  function smeOdobriti(g: Gazdinstvo): boolean {
    if (g.vazecihOglasa < minOglasa) return false;
    if (g.clanovi.some((c) => !c.user.identitet)) return false;
    if (!g.razgovorObavljenAt) return false;
    if (g.trebaIzvod && !g.rpgUporedjenAt) return false;
    return g.clanovi.every((c) => c.status !== "PRISTUPIO" || c.userId === g.podnosilacUserId || c.user.uKolu);
  }

  function Podaci({ g }: { g: Gazdinstvo }) {
    return (
      <div className="mt-2 space-y-2 text-sm">
        <p className="text-kolo-muted">
          {g.naselje}
          {g.adresa && ` · ${g.adresa}`}
          {g.lat !== null && g.lng !== null && (
            <>
              {" · "}
              <a
                className="underline"
                href={`https://www.openstreetmap.org/?mlat=${g.lat}&mlon=${g.lng}#map=17/${g.lat}/${g.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                {t("gaz_lokacija")}
              </a>
            </>
          )}
          {" · "}
          {g.neregistrovano ? t("gaz_neregistrovano") : t("gaz_bpg", { bpg: g.bpg ?? "—" })}
          {!g.smeClanoveOd && ` · ${t("gaz_bez_clanova")}`}
        </p>
        {g.odgovaraZaIzjavu && <p className="text-kolo-muted">{t("gaz_odgovara", { pseudonim: g.odgovaraZaIzjavu })}</p>}
        <p className="whitespace-pre-line">{g.opis}</p>
        <div>
          <p className="font-semibold">{t("gaz_clanovi")}</p>
          <ul className="list-disc pl-5">
            {g.clanovi.map((c) => (
              <li key={c.id}>
                {c.user.pseudonim} ({c.user.identitet?.imePrezime ?? (
                  <span className="text-kolo-danger">{t("gaz_ime_nedostaje")}</span>
                )}) · {c.uloga === "NOSILAC" ? t("gaz_uloga_nosilac") : t("gaz_uloga_clan")}
                {` · ${t(`gaz_status_${c.user.status}`)}`}
                {c.status === "PRISTUPIO" && c.userId !== g.podnosilacUserId && !c.user.uKolu && (
                  <span className="text-kolo-danger">{` · ${t("gaz_nije_u_kolu")}`}</span>
                )}
                {c.doprinos &&
                  ` · ${c.doprinos.redniBroj}. ${poen(c.doprinos.iznos)} (${t(`gaz_doprinos_${c.doprinos.status}`)})`}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">
            {t("gaz_oglasi", { n: g.vazecihOglasa, min: minOglasa })}
          </p>
          <ul className="list-disc pl-5">
            {g.oglasi.map((o) => (
              <li key={o.id}>
                <a className="underline" href={`/pijaca/${o.id}`} target="_blank" rel="noreferrer">
                  {o.title}
                </a>{" "}
                · {o.category} · {o.seller.pseudonim}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dijalog}
      <p className="text-sm text-kolo-muted">{t("gaz_uvod")}</p>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}

      {/* ── Prijave na pregledu (čl. 6) ──────────────────────────────────────── */}
      <section className="space-y-3">
        {/* P3-M1: pregled proverava i zabranjena dobra (gazdinstva čl. 6). */}
        <p className="text-xs text-kolo-muted">{t("zabranjeno_dobro_podsetnik")}</p>
        <h3 className="font-semibold">{t("gaz_na_pregledu", { n: naPregledu.length })}</h3>
        {naPregledu.length === 0 && <p className="text-sm text-kolo-muted">{t("gaz_nema")}</p>}
        {naPregledu.map((g) => (
          <div key={g.id} className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
            <h4 className="font-semibold">{g.naziv}</h4>
            <Podaci g={g} />
            <div className="mt-3 space-y-2">
              <Razgovor g={g} />
              <Izvod g={g} />
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <button
                type="button"
                className={dugme}
                disabled={radi || !smeOdobriti(g)}
                onClick={() => posalji(`/api/admin/gazdinstva/${g.id}/odobri`)}
              >
                {t("gaz_odobri")}
              </button>
              <input
                className={`${polje} max-w-sm`}
                placeholder={t("gaz_razlog_dopune")} aria-label={t("gaz_razlog_dopune")}
                value={razlog(`v-${g.id}`)}
                onChange={(e) => postaviRazlog(`v-${g.id}`, e.target.value)}
              />
              <button
                type="button"
                className={dugmeSek}
                disabled={radi || !razlog(`v-${g.id}`).trim()}
                onClick={() => posalji(`/api/admin/gazdinstva/${g.id}/vrati`, { razlog: razlog(`v-${g.id}`) })}
              >
                {t("gaz_vrati")}
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* ── Kasnija pristupanja (čl. 8 st. 1) ────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">{t("gaz_pristupanja", { n: pristupanja.length })}</h3>
        {pristupanja.length === 0 && <p className="text-sm text-kolo-muted">{t("gaz_nema")}</p>}
        {pristupanja.map((p) => (
          <div key={p.id} className="rounded-kartica border border-kolo-border bg-kolo-surface p-4 text-sm shadow-kartica">
            <p>
              <strong>{p.user.pseudonim}</strong> ({p.user.identitet?.imePrezime ?? (
                <span className="text-kolo-danger">{t("gaz_ime_nedostaje")}</span>
              )}) → {p.gazdinstvo.naziv} ({p.gazdinstvo.naselje}) ·{" "}
              {p.uloga === "NOSILAC" ? t("gaz_uloga_nosilac") : t("gaz_uloga_clan")}
              {` · ${t(`gaz_status_${p.user.status}`)}`}
            </p>
            {!p.user.uKolu && <Obavestenje vrsta="upozorenje" className="mt-2">{t("gaz_nije_u_kolu_pristupanje")}</Obavestenje>}
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <button
                type="button"
                className={dugme}
                disabled={radi || !p.user.identitet || !p.user.uKolu}
                onClick={() => posalji(`/api/admin/gazdinstva/clan/${p.id}`, { odobri: true })}
              >
                {t("gaz_odobri_pristupanje")}
              </button>
              <input
                className={`${polje} max-w-sm`}
                placeholder={t("gaz_razlog")} aria-label={t("gaz_razlog")}
                value={razlog(`p-${p.id}`)}
                onChange={(e) => postaviRazlog(`p-${p.id}`, e.target.value)}
              />
              <button
                type="button"
                className={dugmeSek}
                disabled={radi || !razlog(`p-${p.id}`).trim()}
                onClick={() => posalji(`/api/admin/gazdinstva/clan/${p.id}`, { odobri: false, razlog: razlog(`p-${p.id}`) })}
              >
                {t("gaz_odbij_pristupanje")}
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* ── Odobrena gazdinstva; poništenje zbog lažne izjave (čl. 12) ───────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">{t("gaz_odobrena", { n: odobrena.length })}</h3>
        {odobrena.map((g) => (
          <details key={g.id} className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
            <summary className="cursor-pointer font-semibold">
              {g.naziv} <span className="font-normal text-kolo-muted">· {g.naselje}</span>
            </summary>
            <Podaci g={g} />
            {jeSuperadmin && (
              <div className="mt-4 space-y-2 rounded-kontrola bg-kolo-bg p-4">
                <Obavestenje vrsta="greska">{t("gaz_ponisti_upozorenje")}</Obavestenje>
                <input
                  className={polje}
                  placeholder={t("gaz_razlog")} aria-label={t("gaz_razlog")}
                  value={razlog(`x-${g.id}`)}
                  onChange={(e) => postaviRazlog(`x-${g.id}`, e.target.value)}
                />
                {/* Isključenje nije kolektivno (čl. 12 st. 3; U5): označava se samo ko je lagao ili znao. */}
                <fieldset className="space-y-1 text-sm">
                  <legend className="text-xs text-kolo-muted">{t("gaz_iskljuci_koga")}</legend>
                  {[
                    ...g.clanovi.map((c) => ({ userId: c.userId, pseudonim: c.user.pseudonim, istupio: false })),
                    ...(g.istupili ?? []).map((c) => ({ ...c, istupio: true })),
                  ].map((c) => (
                    <label key={c.userId} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(iskljuciOznaceni[g.id] ?? []).includes(c.userId)}
                        onChange={(e) =>
                          setIskljuciOznaceni((p) => {
                            const bilo = p[g.id] ?? [];
                            return { ...p, [g.id]: e.target.checked ? [...bilo, c.userId] : bilo.filter((x) => x !== c.userId) };
                          })
                        }
                      />
                      <span>{c.pseudonim}{c.istupio ? ` · ${t("gaz_istupio")}` : ""}</span>
                    </label>
                  ))}
                </fieldset>
                <button
                  type="button"
                  className={dugmeOpasno}
                  disabled={radi || !razlog(`x-${g.id}`).trim()}
                  onClick={async () => {
                    if (await potvrdi({ poruka: t("gaz_ponisti_potvrda", { naziv: g.naziv }), opasno: true, dugme: t("gaz_ponisti") })) {
                      void posalji(`/api/admin/gazdinstva/${g.id}/ponisti`, { razlog: razlog(`x-${g.id}`), iskljuci: iskljuciOznaceni[g.id] ?? [] });
                    }
                  }}
                >
                  {t("gaz_ponisti")}
                </button>
              </div>
            )}
          </details>
        ))}
      </section>

      {uPripremi.length > 0 && (
        <section className="space-y-1 text-sm text-kolo-muted">
          <h3 className="font-semibold text-kolo-text">{t("gaz_u_pripremi", { n: uPripremi.length })}</h3>
          {uPripremi.map((g) => (
            <p key={g.id}>
              {g.naziv} · {g.naselje} · {g.status === "VRACENO" ? t("gaz_vraceno") : t("gaz_nacrt")} ·{" "}
              {t("gaz_oglasi", { n: g.vazecihOglasa, min: minOglasa })}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
