"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  MIN_LOZINKA,
  UZRAST_SA_ODRASLIMA,
  danaDoIsteka,
  type NaStaSeCeka,
  type StanjeDeteta,
} from "@/lib/deca-pravila";
import { generisiIzjavuRoditelja } from "@/lib/deca-izjava";
import { profilHref } from "@/lib/profil-link";
import OznakaStatusa from "@/components/OznakaStatusa";
import type { StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Prekidac from "@/components/ui/Prekidac";
import { useDijalog } from "@/components/ui/Dijalog";
import { KLASE_UNOSA } from "@/components/ui/Polje";

/** Stanje naloga (čl. 4c) kao status za `OznakaStatusa`. */
function statusIzStanja(stanje: StanjeDeteta): StatusUcesnika {
  return stanje === "AKTIVNO" ? "DETE_KOLA" : stanje === "POVEZANO" ? "DETE_SA_RODITELJEM" : "DETE_NA_CEKANJU";
}

type Dete = {
  id: string;
  pseudonim: string;
  avatar: string | null;
  godine: number | null;
  clanOd: string;
  balans: number;
  dozvolaOdrasli: boolean;
  /** Izjava iz čl. 6 st. 1 još nije data (samo posle prevođenja naloga, čl. 4d). */
  izjavaNedostaje: boolean;
  /** Stanje naloga (čl. 4c) i na šta se čeka (poslednji stav). */
  stanje: StanjeDeteta;
  naStaSeCeka: NaStaSeCeka | null;
  /** Roditelj je član Kola ili osnivač — traži potvrdu postojanja (čl. 6 st. 2). */
  smeTrazitiPotvrdu: boolean;
  /** Potvrda postojanja deteta ZA OVOG roditelja. */
  postojanje: "NIJE_TRAZENO" | "TRAZENO" | "POTVRDJENO";
  /** Drugi roditelj, ako postoji — za prijavu lažnog roditeljstva (čl. 4e st. 1). */
  drugiRoditelji: { id: string; pseudonim: string }[];
  /** Ima li dete sopstvenu potvrđenu adresu (čl. 7a) — tada roditelj ne menja lozinku. */
  imaSvojuAdresu: boolean;
};

/** Prepis iz dečjeg zapisa koji čeka odluku roditelja (čl. 14). */
type Prepis = {
  id: string;
  iznos: number;
  opis: string | null;
  rokDo: string;
  primalac: string;
};

type Oglas = {
  id: string;
  naslov: string;
  cena: number | null;
  cenaTip: string;
  imaSliku: boolean;
};

export default function DeteProfil({
  dete,
  oglasi,
  prepisi,
}: {
  dete: Dete;
  oglasi: Oglas[];
  prepisi: Prepis[];
}) {
  const t = useTranslations("deca");
  const { dijalog, potvrdi } = useDijalog();
  const router = useRouter();
  const [dozvola, setDozvola] = useState(dete.dozvolaOdrasli);
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [skinuti, setSkinuti] = useState<Set<string>>(new Set());
  // Do 15. godine odnos sa punoletnima je zatvoren i saglasnost ga ne otvara
  // (čl. 12 st. 4), pa prekidač nema šta da uključi — ostaje samo objašnjenje.
  const smeSaOdraslima = (dete.godine ?? 0) >= UZRAST_SA_ODRASLIMA;

  async function prebaciDozvolu() {
    setRadi(true);
    setGreska(null);
    const nova = !dozvola;
    try {
      const res = await fetch(`/api/deca/${dete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dozvolaOdrasli: nova }),
      });
      if (!res.ok) throw new Error();
      setDozvola(nova);
    } catch {
      setGreska(t("greska_slanje"));
    } finally {
      setRadi(false);
    }
  }

  async function ukloniOglas(oglasId: string) {
    if (!(await potvrdi({ poruka: t("potvrdi_uklanjanje"), opasno: true, dugme: t("dugme_ukloni") }))) return;
    try {
      const res = await fetch(`/api/deca/${dete.id}/oglas/${oglasId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSkinuti((s) => new Set(s).add(oglasId));
    } catch {
      setGreska(t("greska_slanje"));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {dijalog}
      {/* Zaglavlje podešavanja: ko je dete i put do njegovog profila. Stranica je
          mesto RADNJI roditelja — sam profil deteta je na `/profil/<pseudonim>`. */}
      <p className="text-sm font-medium text-kolo-muted">{t("podesavanja_naslov")}</p>
      <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
        <div className="flex items-center gap-4">
          {dete.avatar ? (
            <Image src={dete.avatar} alt="" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-kolo-bg text-xl font-semibold text-kolo-muted">
              {dete.pseudonim.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="kolo-naslov truncate">{dete.pseudonim}</h1>
            <p className="text-sm text-kolo-muted">
              {/* Stanje deteta, ne opšte „dete" (paket F, F2-8): roditelj na vrhu vidi
                  na šta se čeka. Imenuje ga samo `OznakaStatusa`. */}
              <OznakaStatusa status={statusIzStanja(dete.stanje)} className="mr-2" />
              {dete.godine !== null && t("godina", { broj: dete.godine })}
            </p>
          </div>
          <p className="ml-auto shrink-0 text-right text-lg font-semibold tabular-nums text-kolo-text">
            {dete.balans.toLocaleString("sr-RS")}
            <span className="ml-1 text-xs font-normal text-kolo-muted">POEN</span>
          </p>
        </div>
        <Link
          href={profilHref(dete)}
          className={klaseDugmeta({ varijanta: "sekundarno" }) + " mt-4"}
        >
          {t("pogledaj_profil")}
        </Link>
      </section>

      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}

      {/* Redosled (paket F, F1-3): prvo ono što čeka roditelja (izjava, prepisi),
          pa dete Kola, pa s kim se dete dopisuje (pregled, prekidač i razgovori
          sa odraslima zajedno), pa oglasi i nalog. */}
      <IzjavaRoditelja dete={dete} />

      <PrepisiNaCekanju deteId={dete.id} prepisi={prepisi} />

      <PotvrdaPostojanja dete={dete} />

      <p className="pt-2 text-sm font-medium text-kolo-muted">{t("dopisivanje_naslov")}</p>

      <Pregled deteId={dete.id} />

      {/* Prekidač iz čl. 10 st. 2 — jedina saglasnost koju roditelj daje posle
          otvaranja naloga. Stoji iznad razgovora sa odraslima, koje otvara. */}
      <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold text-kolo-text">{t("prekidac_naslov")}</h2>
            <p className="mt-1 text-sm text-kolo-muted">
              {smeSaOdraslima ? t("prekidac_opis") : t("prekidac_zatvoren")}
            </p>
          </div>
          {smeSaOdraslima && (
            <Prekidac
              ukljuceno={dozvola}
              onPromena={prebaciDozvolu}
              oznaka={t("prekidac_naslov")}
              zauzet={radi}
            />
          )}
        </div>
      </section>

      <Razgovori deteId={dete.id} />

      {/* Oglasi — jedino što roditelj može da ukloni (čl. 10 st. 1). */}
      <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
        <h2 className="font-semibold text-kolo-text">{t("oglasi_naslov")}</h2>
        {oglasi.length === 0 ? (
          <p className="mt-2 text-sm text-kolo-muted">{t("oglasi_prazno")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {oglasi.map((o) => (
              <li
                key={o.id}
                className={`flex items-center justify-between gap-3 rounded-kontrola bg-kolo-bg px-4 py-3 ${
                  skinuti.has(o.id) ? "opacity-50" : ""
                }`}
              >
                <Link href={`/pijaca/${o.id}`} className="min-w-0 flex-1 truncate text-sm text-kolo-text hover:underline">
                  {o.naslov}
                </Link>
                {skinuti.has(o.id) ? (
                  <span className="shrink-0 text-xs text-kolo-muted">{t("oglas_uklonjen")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => ukloniOglas(o.id)}
                    className="shrink-0 min-h-9 rounded-kontrola border border-kolo-border bg-kolo-surface px-3 text-sm font-semibold text-kolo-danger transition-colors hover:bg-kolo-bg"
                  >
                    {t("dugme_ukloni")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-kolo-muted">{t("oglasi_napomena")}</p>
      </section>

      <NovaLozinka deteId={dete.id} imaSvojuAdresu={dete.imaSvojuAdresu} />

      <PrijavaRoditeljstva deteId={dete.id} drugiRoditelji={dete.drugiRoditelji} />

      <BrisanjeNaloga deteId={dete.id} pseudonim={dete.pseudonim} onGotovo={() => router.push("/profil")} />
    </div>
  );
}

type Razgovor = {
  id: string;
  drugi: string;
  poslednja: string;
  poruke: { id: string; tekst: string; odDeteta: boolean; createdAt: string }[];
};

/**
 * Razgovori deteta SA PUNOLETNIM LICIMA (čl. 9 st. 3) — roditelj ih ČITA.
 *
 * 🔴 Razgovore između dece roditelj VIŠE NE ČITA. Nadzor nad dečjim razgovorom
 * dodiruje i tuđe dete, kome njegov roditelj ovaj uvid nije dao; kad roditelj ne
 * čita, taj problem nestaje ceo. Umesto sadržaja stoji „ko i koliko" (v. `Pregled`).
 *
 * 🔴 Nema polja za pisanje. Sa druge strane je odrastao čovek, a taj odnos otvara
 * isključivo prekidač iz čl. 10 — pa bi ubacivanje roditelja u razgovor bilo
 * obraćanje trećem licu iz tuđeg naloga. Punoletnom sagovorniku u razgovoru stoji
 * vidljiv natpis da razgovor čita roditelj.
 */
function Razgovori({ deteId }: { deteId: string }) {
  const t = useTranslations("deca");
  const [razgovori, setRazgovori] = useState<Razgovor[] | null>(null);
  const [otvoren, setOtvoren] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/deca/${deteId}/razgovori`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        setRazgovori((await res.json()).razgovori);
      } catch {
        setGreska(t("greska_ucitavanje"));
      }
    })();
  }, [deteId, t]);

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
      <h2 className="font-semibold text-kolo-text">{t("razgovori_naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("razgovori_opis")}</p>

      {greska && <Obavestenje vrsta="greska" className="mt-2">{greska}</Obavestenje>}
      {razgovori === null && !greska && (
        <p className="mt-2 text-sm text-kolo-muted">{t("ucitavanje")}</p>
      )}
      {razgovori?.length === 0 && (
        <p className="mt-2 text-sm text-kolo-muted">{t("razgovori_prazno")}</p>
      )}

      <ul className="mt-3 space-y-2">
        {razgovori?.map((r) => (
          <li key={r.id} className="rounded-kontrola border border-kolo-border">
            <button
              type="button"
              onClick={() => setOtvoren((o) => (o === r.id ? null : r.id))}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0 truncate text-sm font-medium text-kolo-text">{r.drugi}</span>
              <span className="shrink-0 text-xs text-kolo-muted">
                {new Date(r.poslednja).toLocaleDateString("sr-RS")}
              </span>
            </button>
            {otvoren === r.id && (
              <div className="max-h-64 space-y-2 overflow-y-auto border-t border-kolo-border bg-kolo-bg p-3">
                {r.poruke.length === 0 && (
                  <p className="text-center text-xs text-kolo-muted">{t("razgovori_prazno")}</p>
                )}
                {r.poruke.map((p) => (
                  <div key={p.id} className={p.odDeteta ? "text-right" : ""}>
                    <p
                      className={`inline-block max-w-[85%] rounded-kartica px-3 py-1.5 text-sm ${
                        p.odDeteta ? "bg-kolo-green-700 text-white" : "bg-kolo-surface text-kolo-text"
                      }`}
                    >
                      {p.tekst}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Brisanje naloga deteta (čl. 17). Traži da roditelj OTKUCA pseudonim — klik ne sme
 * da promaši red u spisku, a radnja poništava sav POEN i uklanja sve oglase.
 * Posledica piše na samoj potvrdi, ne sitnim slovima ispod.
 */
function BrisanjeNaloga({
  deteId,
  pseudonim,
  onGotovo,
}: {
  deteId: string;
  pseudonim: string;
  onGotovo: () => void;
}) {
  const t = useTranslations("deca");
  const [otvoreno, setOtvoreno] = useState(false);
  const [uneto, setUneto] = useState("");
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  async function obrisi() {
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(`/api/deca/${deteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonim: uneto }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      onGotovo();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("greska_slanje"));
    } finally {
      setRadi(false);
    }
  }

  return (
    <section className="rounded-kartica border border-kolo-danger/30 bg-kolo-surface p-6 shadow-kartica">
      <h2 className="font-semibold text-kolo-danger">{t("brisanje_naslov")}</h2>
      {!otvoreno ? (
        <button
          type="button"
          onClick={() => setOtvoreno(true)}
          className="mt-3 min-h-10 rounded-kontrola border border-kolo-danger bg-kolo-surface px-4 text-sm font-semibold text-kolo-danger transition-colors hover:bg-kolo-danger-light"
        >
          {t("brisanje_dugme")}
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-kolo-text">{t("brisanje_posledica")}</p>
          <label className="block text-sm">
            <span className="font-medium text-kolo-text">{t("brisanje_otkucaj", { pseudonim })}</span>
            <input
              className={`mt-1 ${KLASE_UNOSA}`}
              value={uneto}
              onChange={(e) => setUneto(e.target.value)}
              autoComplete="off"
            />
          </label>
          {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={radi || uneto.trim().toLowerCase() !== pseudonim.toLowerCase()}
              onClick={obrisi}
              className={klaseDugmeta({ varijanta: "opasno" })}
            >
              {t("brisanje_potvrdi")}
            </button>
            <button
              type="button"
              onClick={() => setOtvoreno(false)}
              className={klaseDugmeta({ varijanta: "sekundarno" })}
            >
              {t("dugme_odustani")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

type Pregledi = {
  prijatelji: { pseudonim: string; od: string; poenEvidentiran: boolean }[];
  razgovori: { id: string; drugi: string; poruka: number; poslednja: string }[];
  /** Kutija želja: samo tekst predloga deteta (odluka vlasnika 25.10.2026). */
  zelje: string[];
};

/**
 * „Ko i koliko" (čl. 9 st. 2) — ono što roditelj dobija UMESTO sadržaja razgovora
 * među decom: spisak prijatelja sa datumima i spisak razgovora bez ijedne poruke.
 *
 * 🔴 Sadržaja ovde nema i nema rute koja bi ga vratila. To nije propust nego mera:
 * razgovor deteta sa drugim detetom dodiruje i tuđe dete.
 */
function Pregled({ deteId }: { deteId: string }) {
  const t = useTranslations("deca");
  const [podaci, setPodaci] = useState<Pregledi | null>(null);
  const [greska, setGreska] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/deca/${deteId}/pregled`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        setPodaci(await res.json());
      } catch {
        setGreska(t("greska_ucitavanje"));
      }
    })();
  }, [deteId, t]);

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
      <h2 className="font-semibold text-kolo-text">{t("pregled_naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("pregled_opis")}</p>

      {greska && <Obavestenje vrsta="greska" className="mt-2">{greska}</Obavestenje>}
      {podaci === null && !greska && <p className="mt-2 text-sm text-kolo-muted">{t("ucitavanje")}</p>}

      {podaci && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-kolo-text">{t("pregled_prijatelji")}</h3>
            {podaci.prijatelji.length === 0 ? (
              <p className="mt-1 text-sm text-kolo-muted">{t("pregled_prijatelji_prazno")}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {podaci.prijatelji.map((p) => (
                  <li key={p.pseudonim} className="flex justify-between gap-2">
                    <span className="truncate text-kolo-text">{p.pseudonim}</span>
                    <span className="shrink-0 text-xs text-kolo-muted">
                      {new Date(p.od).toLocaleDateString("sr-RS")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-kolo-text">{t("pregled_razgovori")}</h3>
            {podaci.razgovori.length === 0 ? (
              <p className="mt-1 text-sm text-kolo-muted">{t("pregled_razgovori_prazno")}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {podaci.razgovori.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span className="truncate text-kolo-text">{r.drugi}</span>
                    <span className="shrink-0 text-xs text-kolo-muted">
                      {t("pregled_poruka", { broj: r.poruka })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Kutija želja: SAMO tekst predloga deteta — bez stanja, odgovora i
              podrški koje je dete dalo drugoj deci. */}
          <div className="sm:col-span-2">
            <h3 className="text-sm font-medium text-kolo-text">{t("pregled_zelje")}</h3>
            {podaci.zelje.length === 0 ? (
              <p className="mt-1 text-sm text-kolo-muted">{t("pregled_zelje_prazno")}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {podaci.zelje.map((z, i) => (
                  <li key={i} className="whitespace-pre-wrap text-kolo-text">{z}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}


/**
 * Nova lozinka detetu (čl. 10 st. 1).
 *
 * 🔴 Stara lozinka se ne traži — roditelj je ne zna, i baš zato ovo postoji.
 * Nalog maloletnog korisnika po pravilu nema imejl, pa mu tok „zaboravljena
 * lozinka" ne stoji na raspolaganju: bez ovog dugmeta zaboravljena lozinka znači
 * trajno zaključan nalog, sa svim prijateljstvima i POEN-om u njemu.
 *
 * Lozinka se prikazuje dok se kuca. Roditelj je smišlja za dete i mora da je
 * pročita naglas — sakriveno polje bi ovde radilo protiv svrhe.
 */
function NovaLozinka({
  deteId,
  imaSvojuAdresu,
}: {
  deteId: string;
  imaSvojuAdresu: boolean;
}) {
  const t = useTranslations("deca");
  const [lozinka, setLozinka] = useState("");
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState<{ tekst: string; greska: boolean } | null>(null);

  async function postavi() {
    setRadi(true);
    setPoruka(null);
    try {
      const res = await fetch(`/api/deca/${deteId}/lozinka`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lozinka }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPoruka({ tekst: data?.error ?? t("greska_slanje"), greska: true });
        return;
      }
      setPoruka({ tekst: t("lozinka_uspeh"), greska: false });
      setLozinka("");
    } catch {
      setPoruka({ tekst: t("greska_slanje"), greska: true });
    } finally {
      setRadi(false);
    }
  }

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
      <h2 className="font-semibold text-kolo-text">{t("lozinka_naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">
        {imaSvojuAdresu ? t("lozinka_ima_adresu") : t("lozinka_opis")}
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row" hidden={imaSvojuAdresu}>
        <input
          type="text"
          value={lozinka}
          onChange={(e) => setLozinka(e.target.value)}
          placeholder={t("lozinka_polje")}
          aria-label={t("lozinka_polje")}
          autoComplete="new-password"
          className={KLASE_UNOSA}
        />
        <button
          type="button"
          onClick={postavi}
          disabled={radi || lozinka.length < MIN_LOZINKA}
          className={klaseDugmeta() + " shrink-0"}
        >
          {t("lozinka_dugme")}
        </button>
      </div>

      <p className="mt-2 text-xs text-kolo-muted">{t("lozinka_pravilo", { broj: MIN_LOZINKA })}</p>

      {poruka && (
        <Obavestenje vrsta={poruka.greska ? "greska" : "uspeh"} className="mt-2">
          {poruka.tekst}
        </Obavestenje>
      )}
    </section>
  );
}

/**
 * Na šta nalog deteta čeka i „Zatraži potvrdu da imaš dete" (Pravilnik o učešću
 * dece čl. 4c poslednji stav, 6 st. 2; set 4.8.2).
 *
 * Dugme vidi samo roditelj koji je član Kola ili osnivač — potvrdu traži on, za
 * svako dete posebno, bez roka. Roditelju koji nije član Kola kaže se šta se čeka;
 * njegova ovlašćenja roditelja time se ne menjaju (čl. 5 st. 3).
 */
function PotvrdaPostojanja({ dete }: { dete: Dete }) {
  const t = useTranslations("deca");
  const router = useRouter();
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);

  async function zatrazi() {
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(`/api/deca/${dete.id}/potvrda-postojanja`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      router.refresh();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("greska_slanje"));
    } finally {
      setRadi(false);
    }
  }

  // Status deteta i na šta se čeka imenuje SAMO `OznakaStatusa` (namespace
  // `status`; brana `oznaka-statusa-izvor.test.ts`).
  const statusDeteta = statusIzStanja(dete.stanje);

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
      <h2 className="font-semibold text-kolo-text">{t("postojanje_naslov")}</h2>
      <OznakaStatusa
        status={statusDeteta}
        varijanta="kartica"
        opis={dete.stanje === "AKTIVNO"}
        naStaSeCeka={dete.naStaSeCeka ?? null}
        className="mt-3 shadow-none"
      />
      {dete.postojanje === "POTVRDJENO" && (
        <p className="mt-2 text-sm text-kolo-green-700">{t("postojanje_potvrdjeno")}</p>
      )}
      {dete.postojanje === "TRAZENO" && (
        <p className="mt-2 text-sm text-kolo-text">{t("postojanje_trazeno")}</p>
      )}
      {dete.postojanje === "NIJE_TRAZENO" &&
        (dete.smeTrazitiPotvrdu ? (
          <>
            <p className="mt-2 text-sm text-kolo-text">{t("postojanje_opis")}</p>
            <button
              type="button"
              disabled={radi}
              onClick={zatrazi}
              className={klaseDugmeta() + " mt-3"}
            >
              {t("postojanje_dugme")}
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-kolo-muted">{t("postojanje_samo_clan_kola")}</p>
            {/* Roditelj koji nije u Kolu ne zna kako da uđe (paket F, F10-2): put je na
                Potvrdama — „Moj kod" i „Želim da me neko nazove". */}
            <Link href="/verifikacija" className="mt-2 inline-block text-sm font-medium text-kolo-green-700 underline underline-offset-2">
              {t("postojanje_kako_u_kolo")}
            </Link>
          </>
        ))}
      {greska && <Obavestenje vrsta="greska" className="mt-2">{greska}</Obavestenje>}
    </section>
  );
}

/**
 * „Prijavi da ovo nije roditelj" (Pravilnik o učešću dece čl. 4e st. 1). Roditelj
 * ovde prijavljuje DRUGOG roditelja istog deteta. Po prijemu Fondacija vezu odmah
 * zaustavlja; prijavljenom licu se ne otkriva ko je prijavu podneo (st. 2–3).
 */
function PrijavaRoditeljstva({
  deteId,
  drugiRoditelji,
}: {
  deteId: string;
  drugiRoditelji: { id: string; pseudonim: string }[];
}) {
  const t = useTranslations("deca");
  const [otvoren, setOtvoren] = useState<string | null>(null);
  const [opis, setOpis] = useState("");
  const [radi, setRadi] = useState(false);
  const [poruka, setPoruka] = useState<{ tekst: string; greska: boolean } | null>(null);
  if (drugiRoditelji.length === 0) return null;

  async function posalji(roditeljId: string) {
    setRadi(true);
    setPoruka(null);
    try {
      const res = await fetch(`/api/deca/${deteId}/prijava-roditeljstva`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roditeljId, opis }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      setPoruka({ tekst: t("prijava_uspeh"), greska: false });
      setOtvoren(null);
      setOpis("");
    } catch (e) {
      setPoruka({ tekst: e instanceof Error ? e.message : t("greska_slanje"), greska: true });
    } finally {
      setRadi(false);
    }
  }

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
      <h2 className="font-semibold text-kolo-text">{t("prijava_naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("prijava_opis")}</p>
      <ul className="mt-3 space-y-2">
        {drugiRoditelji.map((r) => (
          <li key={r.id} className="rounded-kontrola bg-kolo-bg px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-sm text-kolo-text">{r.pseudonim}</span>
              {otvoren !== r.id && (
                <button
                  type="button"
                  onClick={() => setOtvoren(r.id)}
                  className="shrink-0 min-h-9 rounded-kontrola border border-kolo-border bg-kolo-surface px-3 text-sm font-semibold text-kolo-danger transition-colors hover:bg-kolo-bg"
                >
                  {t("prijava_dugme")}
                </button>
              )}
            </div>
            {otvoren === r.id && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={opis}
                  onChange={(e) => setOpis(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={t("prijava_polje")}
                  aria-label={t("prijava_polje")}
                  className={KLASE_UNOSA}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={radi || opis.trim().length < 10}
                    onClick={() => posalji(r.id)}
                    className={klaseDugmeta({ varijanta: "opasno" })}
                  >
                    {t("prijava_posalji")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtvoren(null)}
                    className={klaseDugmeta({ varijanta: "sekundarno" })}
                  >
                    {t("dugme_odustani")}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {poruka && (
        <Obavestenje vrsta={poruka.greska ? "greska" : "uspeh"} className="mt-2">{poruka.tekst}</Obavestenje>
      )}
    </section>
  );
}

/**
 * Izjava roditelja o postojanju deteta (čl. 6 st. 1), kad još nije data.
 *
 * Vidi se samo u jednom slučaju — kad je nalog u maloletni preveo administrator
 * (čl. 4d), pa roditelj izjavu daje po prijemu odluke. Svuda drugde izjava nastaje
 * pri otvaranju odnosno preuzimanju naloga i ovaj blok se ne crta. Od seta 4.8.2
 * izjava nema rok ni posledicu po treća lica.
 *
 * 🔴 Tekst izjave stoji pred čovekom PRE potvrde. Izjava se daje pod punom
 * odgovornošću i snima se — dugme bez teksta bio bi potpis na nevidljiv dokument.
 */
function IzjavaRoditelja({ dete }: { dete: Dete }) {
  const t = useTranslations("deca");
  const router = useRouter();
  const [radi, setRadi] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  if (!dete.izjavaNedostaje) return null;

  const tekst = generisiIzjavuRoditelja({
    pseudonimDeteta: dete.pseudonim,
    godine: dete.godine ?? 0,
  });

  async function posalji() {
    setRadi(true);
    setGreska(null);
    try {
      const res = await fetch(`/api/deca/${dete.id}/izjava`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ potvrda: true }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setGreska(t("greska_slanje"));
    } finally {
      setRadi(false);
    }
  }

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
      <h2 className="text-lg font-medium text-kolo-text">{t("izjava_naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("izjava_opis_bez_roka")}</p>
      <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-kontrola border border-kolo-border bg-kolo-surface p-4 text-sm text-kolo-text">
        {tekst}
      </pre>
      {greska && <Obavestenje vrsta="greska" className="mt-2">{greska}</Obavestenje>}
      <button
        type="button"
        disabled={radi}
        onClick={posalji}
        className={klaseDugmeta() + " mt-3"}
      >
        {t("izjava_dugme")}
      </button>
    </section>
  );
}

/**
 * Prepisi iz dečjeg zapisa koji čekaju odluku roditelja (čl. 14).
 *
 * 🔴 Prikazuje se samo kad ih ima. Prazan odeljak „nema ničega na čekanju" bio bi
 * na profilu svakog deteta svaki dan, a ovo je po prirodi redak događaj.
 */
function PrepisiNaCekanju({ deteId, prepisi }: { deteId: string; prepisi: Prepis[] }) {
  const t = useTranslations("deca");
  const router = useRouter();
  const [radi, setRadi] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  if (prepisi.length === 0) return null;

  async function odluci(id: string, odluka: "ODOBREN" | "ODBIJEN") {
    setRadi(id);
    setGreska(null);
    try {
      const res = await fetch(`/api/deca/prepis/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ odluka }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      router.refresh();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("greska_slanje"));
    } finally {
      setRadi(null);
    }
  }

  return (
    <section className="rounded-kartica border border-kolo-green-700/40 bg-kolo-green-50 p-6 shadow-kartica">
      <h2 className="font-semibold text-kolo-text">{t("prepis_naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("prepis_opis")}</p>
      {greska && <Obavestenje vrsta="greska" className="mt-2">{greska}</Obavestenje>}

      <ul className="mt-3 space-y-3">
        {prepisi.map((p) => (
          <li key={p.id} className="rounded-kontrola bg-kolo-surface p-4">
            <p className="text-sm text-kolo-text">
              {t("prepis_stavka", {
                iznos: p.iznos.toLocaleString("sr-RS"),
                pseudonim: p.primalac,
              })}
            </p>
            {p.opis && <p className="mt-1 text-sm text-kolo-muted">„{p.opis}“</p>}
            <p className="mt-1 text-xs text-kolo-muted">
              {t("prepis_rok", { dana: danaDoIsteka(new Date(p.rokDo), new Date()) })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={radi !== null}
                onClick={() => odluci(p.id, "ODOBREN")}
                className={klaseDugmeta()}
              >
                {t("prepis_odobri")}
              </button>
              <button
                type="button"
                disabled={radi !== null}
                onClick={() => odluci(p.id, "ODBIJEN")}
                className={klaseDugmeta({ varijanta: "sekundarno" })}
              >
                {t("prepis_odbij")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
