"use client";

import { useState, useEffect, useMemo } from "react";
import { intlTag } from "@/lib/format";
import OznakaStatusa, { type ZrnoPolozaj } from "@/components/OznakaStatusa";
import type { StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import Link from "next/link";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { useTranslations, useLocale } from "next-intl";
import PageOpis from "@/components/PageOpis";
import Pojam from "@/components/Pojam";
import Pseudonim from "@/components/Pseudonim";

import {
  ClanoviSekcija,
  ProtokolLista,
  TransakcijeSekcija,
  Ucesnik,
  type Clan,
  type Transakcija,
} from "@/components/SistemListe";

import { SEKCIJE, type Sekcija } from "./sekcije";
import { pocetnoIzAdrese } from "@/hooks/useStanjeUAdresi";
import { profilHref } from "@/lib/profil-link";
import { PRAG_PRVE_ZADRUGE } from "@/lib/zadruga-pravila";
import LokacijeSekcija, { normalizujLokaciju, type ZadrugaNaLokaciji } from "@/components/LokacijeSekcija";

interface FondTx {
  id: string;
  datum: string;
  smer: "PRILIV" | "ODLIV";
  kategorija: string;
  opis: string;
  userId: string | null;
  iznosRSD: number;
}

interface EmisijaChart {
  date: string;
  emitted: number;
  limit: number;
}

interface ProgramPregled {
  datum: string;
  program: string;
  label: string;
  korisnika: number;
  poen: number;
}

interface DonacijaItem {
  id: string;
  /**
   * Ime i prezime donatora javne donacije (donacije čl. 5a st. 1). 🔴 Pseudonim i
   * veza ka profilu se u listi ne prikazuju nikome; kod anonimne donacije i kod
   * povučenog imena `null` (R-03, M-3c; čl. 5a st. 4).
   */
  ime: string | null;
  anonimno: boolean;
  /** 🔴 Bez broja POEN-a i nivoa — RSD i POEN u istom redu daju odnos (R-01;
   *  odluka vlasnika 25.10.2026). POEN se vidi u zapisima Protokola, uz pseudonim. */
  amountRSD: number;
  confirmedAt: string;
}

interface PokroviteljItem {
  id: string;
  naziv: string;
  logoUrl: string | null;
  rsdKumulativ: number;
  trenutniNivo: number;
}

interface Props {
  pseudonim: string;
  /** Neprijavljen posetilac: vidi kartice i zbirove, spiskovi su mu zatvoreni. */
  gost?: boolean;
  verified: boolean;
  opticaj: number;
  protokolBalance: number;
  ukupnoKorisnika: number;
  verifikovanih: number;
  /** Maloletni nalozi u stanju AKTIVNO (dete Kola) — nikad `verified`. */
  aktivneDece: number;
  /** Korisnici: punoletni živi nalozi koji nisu u Kolu (dete se ovde ne broji). */
  korisnika: number;
  /** Status posmatrača (set 4.8.2) — crta ga `OznakaStatusa`. */
  status?: StatusUcesnika | null;
  zrno?: ZrnoPolozaj;
  ukupnoTransakcija: number;
  danasEmitovano: number;
  danasLimit: number;
  danasKorisnika: number;
  danasTransakcija: number;
  ukupnoVerifikacija: number;
  danasVerifikacija: number;
  racunFondacije: number;
  ukupnoDonacija: number;
  danasDonacija: number;
  ukupanIznosTx: number;
  danasIznosTx: number;
  donacije: DonacijaItem[];
  pokrovitelji: PokroviteljItem[];
  emisijeChart: EmisijaChart[];
  /** Dnevni zbir po socijalnom programu (R-03, M-1) — stoji umesto pojedinačnih redova. */
  programiPregled: ProgramPregled[];
  /** Zapisi Protokola — sve što nije prepis između korisnika. */
  protokolTx: Transakcija[];
  /** Prepisi između korisnika (TRANSFER) — kartica „Ukupno razmena". */
  razmene: Transakcija[];
  clanovi: Clan[];
  pocetnaSekcija: Sekcija;
  zadruge: ZadrugaNaLokaciji[];
  /** Pokazatelji zajednice za kartice (raspored od 24.10.2026). */
  pokazatelji: Pokazatelji;
}

export interface Pokazatelji {
  aktivni7: number;
  aktivni30: number;
  /** Čuvari Kola i osnivači (osnivači su početni čuvari Kola). */
  cuvara: number;
  ponuda: number;
  potraznja: number;
  vauceraPreuzeto: number;
  vauceraIskorisceno: number;
  gazdinstava: number;
  clanovaGazdinstava: number;
  firmi: number;
  firmiSaVaucerima: number;
  skola: number;
}

const CILJ_OPTICAJ = 1_000_000;

export default function SistemKlijent({
  pseudonim,
  gost = false,
  verified,
  opticaj,
  protokolBalance,
  ukupnoKorisnika,
  verifikovanih,
  aktivneDece,
  korisnika,
  status = null,
  zrno = null,
  ukupnoTransakcija,
  danasEmitovano,
  danasLimit,
  danasKorisnika,
  danasTransakcija,
  racunFondacije,
  ukupnoDonacija,
  danasDonacija,
  ukupanIznosTx,
  danasIznosTx,
  donacije,
  emisijeChart,
  protokolTx,
  programiPregled,
  razmene,
  clanovi,
  pocetnaSekcija,
  zadruge,
  pokazatelji: pk,
}: Props) {
  const locale = useLocale();
  // Adresa je merodavna i pri povratku (back) — vidi `pocetnoIzAdrese`.
  const [sekcija, postaviSekciju] = useState<Sekcija>(() =>
    pocetnoIzAdrese("sekcija", SEKCIJE, pocetnaSekcija),
  );
  const t = useTranslations("sistem");

  // Aktivna sekcija se ogleda u URL-u (?sekcija=...) bez nove navigacije,
  // da povratak (back) sa profila vrati korisnika na istu sekciju, a ne na
  // „Pregled". replaceState — promena sekcije ne pravi novi unos u istoriji.
  const setSekcija = (s: Sekcija) => {
    postaviSekciju(s);
    window.history.replaceState(null, "", s === "pregled" ? "/sistem" : `/sistem?sekcija=${s}`);
  };

  // Kartica „Učesnici" (24.10.2026): veliki broj su verifikovani punoletni (član
  // bez potvrde, član Kola, čuvar, osnivač); ispod je ukupno korisnika — učesnici
  // i korisnici van Kola, prebrojani zasebno. 🔴 Deca nisu ni u jednom od ta dva
  // broja (dete nikad nije „korisnik"); deca Kola su na kartici „Škole".
  const ukupnoKorisnikaBezDece = verifikovanih + korisnika;

  const zeroSum = opticaj + protokolBalance === 0;
  const faza2 = opticaj >= CILJ_OPTICAJ;
  const fazaPct = Math.min((opticaj / CILJ_OPTICAJ) * 100, 100);

  const brojLokacija = useMemo(() => {
    const skup = new Set<string>();
    for (const c of clanovi) {
      const kljuc = normalizujLokaciju(c.location);
      if (kljuc) skup.add(kljuc);
    }
    return skup.size;
  }, [clanovi]);

  // Napredak do prve zadruge: mesto sa najviše učesnika (član bez potvrde, član
  // Kola, čuvar, osnivač — isti broj kao na kartici lokacije i `/zadruge`).
  const najviseUMestu = useMemo(() => {
    const po = new Map<string, number>();
    for (const c of clanovi) {
      const kljuc = normalizujLokaciju(c.location);
      if (kljuc && c.verified && !c.maloletan) po.set(kljuc, (po.get(kljuc) ?? 0) + 1);
    }
    return Math.max(0, ...po.values());
  }, [clanovi]);

  return (
    <div className="space-y-6">
      {/* Sopstveni naslov: sa pozdravom „Zdravo, X" stranica se nije razlikovala
          od Početne, pa čovek nije video da je promenio stranicu. Pozdrav ostaje
          samo na Početnoj. */}
      <h1 className="kolo-naslov">{t("naslov_stranice")}</h1>
      <PageOpis>
        {gost ? t("opis_gost") : t("opis_stranice")}
      </PageOpis>

      {/* Kartica statusa (set 4.8.2) korisniku i članu bez potvrde. Korisniku je
          put u Kolo poznanik ili „Želim da me neko nazove" (dokaz stvarnosti čl.
          4a; Uslovi čl. 16b) — uplata više ne potvrđuje stvarnost, pa prag
          donacije ovde ne stoji. Prvi oglas ostaje kao drugi potez (čl. 40a).
          Članu bez potvrde kartica nosi obavezne rečenice (Pravilnik čl. 28a). */}
      {(status === "KORISNIK" || status === "CLAN_BEZ_POTVRDE") && (
        // Na Sistemu kratko: puna kartica (sa sledećim korakom i obaveznim
        // rečenicama) stoji na Početnoj, Profilu i Potvrdama — ovde je samo
        // ponavljanje koje gura brojke ispod prvog ekrana.
        <OznakaStatusa varijanta="kratko" status={status} />
      )}

      {/* Zdravlje sistema (odluka vlasnika 25.10.2026): svi pokazatelji zdravlja i
          koncentracije sa lampicama žive na zasebnoj stranici, ne u ovoj mreži. */}
      <div className="flex justify-end">
        <Link href="/sistem/zdravlje" className="inline-flex min-h-10 items-center text-sm font-medium text-kolo-green-700 hover:underline">
          {t("zdravlje_link")} →
        </Link>
      </div>

      {/* Kartice pokazatelja (odluka vlasnika, 24.10.2026): četiri reda po četiri,
          naslovi redova idu redom bočnog menija. Kartica sa nulom zadržava mesto i
          naslov, a umesto nule nosi rečenicu i vezu — kad stigne prvi zapis, sama
          prelazi na broj. Račun Fondacije je izuzetak: stanje novca stoji kao broj
          i kad je nula. Ukupno POENA i Račun Fondacije su na suprotnim krajevima
          poslednjeg reda — iz dva broja jedan do drugog čitalo bi se „pokriće". */}
      <RedPokazatelja naslov={t("red_kolo")}>
        <Pokazatelj
          aktivan={sekcija === "clanovi"} onClick={() => setSekcija("clanovi")}
          label={t("kartica_ucesnici")} broj={verifikovanih}
          podnaslov={t("ucesnici_ukupno", { n: ukupnoKorisnikaBezDece.toLocaleString(intlTag(locale)) })}
        />
        <Pokazatelj
          label={t("kartica_aktivni")} broj={pk.aktivni7}
          podnaslov={t("aktivni_30", { n: pk.aktivni30.toLocaleString(intlTag(locale)) })}
        />
        <Pokazatelj label={t("kartica_cuvari")} broj={pk.cuvara} />
        <Pokazatelj
          aktivan={sekcija === "lokacije"} onClick={() => setSekcija("lokacije")}
          label={t("kartica_lokacije")} broj={brojLokacija} podnaslov={t("kartica_lokacije_opis")}
        />
      </RedPokazatelja>

      <RedPokazatelja naslov={t("red_razmena")}>
        <Pokazatelj
          href="/pijaca" label={t("kartica_oglasi")} broj={pk.ponuda + pk.potraznja}
          podnaslov={t("oglasi_tip", { ponuda: pk.ponuda, potraznja: pk.potraznja })}
        />
        <Pokazatelj
          aktivan={sekcija === "transakcije"} onClick={() => setSekcija("transakcije")}
          label={t("kartica_razmene")} broj={ukupnoTransakcija} danas={danasTransakcija}
        />
        <Pokazatelj
          aktivan={sekcija === "iznos"} onClick={() => setSekcija("iznos")}
          label={t("kartica_razmenjeno")} broj={ukupanIznosTx} danas={danasIznosTx}
        />
        {pk.vauceraPreuzeto > 0 ? (
          <Pokazatelj
            href="/vauceri" label={t("kartica_vauceri")} broj={pk.vauceraPreuzeto}
            podnaslov={t("vauceri_iskorisceno", { n: pk.vauceraIskorisceno })}
          />
        ) : (
          <Pokazatelj href="/firme" label={t("kartica_vauceri")} tekst={t("nula_vauceri")} />
        )}
      </RedPokazatelja>

      <RedPokazatelja naslov={t("red_zajednica")}>
        {pk.gazdinstava > 0 ? (
          <Pokazatelj
            href="/gazdinstva" label={t("kartica_gazdinstva")} broj={pk.gazdinstava}
            podnaslov={t("gazdinstva_clanova", { n: pk.clanovaGazdinstava })}
          />
        ) : (
          <Pokazatelj href="/gazdinstva" label={t("kartica_gazdinstva")} tekst={t("nula_gazdinstva")} />
        )}
        {pk.firmi > 0 ? (
          <Pokazatelj
            href="/firme" label={t("kartica_firme")} broj={pk.firmi}
            podnaslov={t("firme_vauceri", { n: pk.firmiSaVaucerima })}
          />
        ) : (
          <Pokazatelj href="/firme" label={t("kartica_firme")} tekst={t("nula_firme")} />
        )}
        {zadruge.length > 0 ? (
          <Pokazatelj href="/zadruge" label={t("kartica_zadruge")} broj={zadruge.length} />
        ) : (
          <Pokazatelj
            href="/zadruge" label={t("kartica_zadruge")}
            tekst={t("nula_zadruge", { n: najviseUMestu, prag: PRAG_PRVE_ZADRUGE })}
          />
        )}
        {pk.skola > 0 ? (
          <Pokazatelj
            href="/skole" label={t("kartica_skole")} broj={pk.skola}
            podnaslov={t("skole_deca", { n: aktivneDece })}
          />
        ) : (
          <Pokazatelj href="/skole" label={t("kartica_skole")} tekst={t("nula_skole")} />
        )}
      </RedPokazatelja>

      <RedPokazatelja naslov={t("red_evidencija")}>
        <Pokazatelj
          aktivan={sekcija === "pregled"} onClick={() => setSekcija("pregled")}
          label={<Pojam termin={t("kartica_opticaj")} objasnjenje={t("kartica_opticaj_opis")} />}
          broj={opticaj} danas={danasEmitovano}
          podnaslov={
            zeroSum ? (
              <span className="inline-flex items-center gap-1.5">
                <span>✓</span>
                <Pojam termin={<span>{t("zero_sum_ok")}</span>} objasnjenje={t("zero_sum_ok_opis")} />
              </span>
            ) : (
              <span>✗ {t("zero_sum_greska")}</span>
            )
          }
        />
        <Pokazatelj
          aktivan={sekcija === "faza"} onClick={() => setSekcija("faza")}
          label={<Pojam termin={t("faza_sistema")} objasnjenje={t("faza_sistema_opis")} />}
          tekstVelik={faza2 ? t("faza_2") : t("faza_1")}
          traka={fazaPct}
          podnaslov={faza2 ? t("gornje_kolo_aktivno") : t("do_gornjeg_kola", { pct: fazaPct.toFixed(1) })}
        />
        {ukupnoDonacija > 0 ? (
          <Pokazatelj
            aktivan={sekcija === "donacije"} onClick={() => setSekcija("donacije")}
            label={t("kartica_donacije")} broj={ukupnoDonacija} danas={danasDonacija}
          />
        ) : (
          <Pokazatelj href="/podrzi-kolo" label={t("kartica_donacije")} tekst={t("nula_donacije")} />
        )}
        <Pokazatelj
          aktivan={sekcija === "fondacija"} onClick={() => setSekcija("fondacija")}
          label={<Pojam termin={t("kartica_racun_fondacije")} objasnjenje={t("kartica_racun_fondacije_opis")} />}
          broj={racunFondacije} podnaslov={t("racun_dinara")}
        />
      </RedPokazatelja>

      {/* Separator */}
      <div className="border-t border-kolo-border" />

      {/* Sekcija sadržaj */}
      {/* Gost: spiskovi su zatvoreni (Politika privatnosti čl. 6) — server ih za njega
          ni ne čita, a ovde stoji jedna rečenica i put unutra. */}
      {gost && (sekcija === "clanovi" || sekcija === "transakcije" || sekcija === "iznos" || sekcija === "donacije") && (
        <ZatvorenoGostu />
      )}
      {sekcija === "pregled" && (
        <PregledSekcija
          gost={gost}
          verified={verified}
          danasEmitovano={danasEmitovano}
          danasLimit={danasLimit}
          emisijeChart={emisijeChart}
          protokolTx={protokolTx}
          programiPregled={programiPregled}
        />
      )}
      {!gost && sekcija === "clanovi" && (
        <ClanoviSekcija clanovi={clanovi} verified={verified} />
      )}
      {sekcija === "lokacije" && (
        <LokacijeSekcija clanovi={clanovi} verified={verified} zadruge={zadruge} bezRangListe={gost} />
      )}
      {!gost && sekcija === "transakcije" && (
        <TransakcijeSekcija razmene={razmene} verified={verified} />
      )}
      {!gost && sekcija === "donacije" && (
        <DonacijeSekcija donacije={donacije} verified={!status?.startsWith("DETE_")} />
      )}
      {!gost && sekcija === "iznos" && (
        <IznosSekcija
          ukupanIznosTx={ukupanIznosTx}
          danasIznosTx={danasIznosTx}
          razmene={razmene}
          verified={verified}
        />
      )}
      {sekcija === "faza" && <FazaSekcija opticaj={opticaj} />}
      {sekcija === "fondacija" && <FondacijaSekcija />}
    </div>
  );
}

// ── Račun Fondacije — transakcije sa bankovnog računa (priliv/odliv, RSD) ──────
function FondacijaSekcija() {
  const locale = useLocale();
  const t = useTranslations("sistem");
  const [stavke, setStavke] = useState<FondTx[] | null>(null);

  useEffect(() => {
    let aktivno = true;
    fetch("/api/javno/fondacija/transakcije")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (aktivno) setStavke(d?.stavke ?? []); })
      .catch(() => { if (aktivno) setStavke([]); });
    return () => { aktivno = false; };
  }, []);

  if (stavke === null) {
    return (
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-8 text-center text-sm text-kolo-muted shadow-kartica">
        {t("fondacija_ucitavanje")}
      </div>
    );
  }
  if (stavke.length === 0) {
    return (
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-8 text-center text-sm text-kolo-muted shadow-kartica">
        {t("fondacija_nema_tx")}
      </div>
    );
  }

  const datum = (iso: string) =>
    new Date(iso).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "2-digit", year: "2-digit" });

  return (
    <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
      <div className="hidden sm:grid grid-cols-[1fr_140px_110px] gap-4 px-5 py-2.5 bg-kolo-bg border-b border-kolo-border text-xs font-semibold text-kolo-muted">
        <span>{t("fondacija_col_opis")}</span>
        <span className="text-right">{t("fondacija_col_iznos")}</span>
        <span className="text-right">{t("col_datum")}</span>
      </div>
      {stavke.map((s, i) => (
        <div key={s.id} className={i < stavke.length - 1 ? "border-b border-kolo-border/30" : ""}>
          {/* Desktop */}
          <div className="hidden sm:grid grid-cols-[1fr_140px_110px] gap-4 px-5 py-3 items-center text-sm">
            <div className="min-w-0">
              {s.userId ? (
                <Link href={profilHref({ id: s.userId, pseudonim: s.opis })} className="font-medium text-kolo-green-700 hover:underline truncate block">
                  <Pseudonim>{s.opis}</Pseudonim>
                </Link>
              ) : (
                <p className="text-kolo-text truncate">{s.opis}</p>
              )}
              <p className="text-xs text-kolo-muted">{s.kategorija}</p>
            </div>
            <span className={`text-right font-semibold ${s.smer === "PRILIV" ? "text-kolo-green-700" : "text-kolo-danger"}`}>
              {s.smer === "PRILIV" ? "+" : "−"}{s.iznosRSD.toLocaleString(intlTag(locale))}
            </span>
            <span className="text-right text-kolo-muted">{datum(s.datum)}</span>
          </div>
          {/* Mobilna */}
          <div className="sm:hidden px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              {s.userId ? (
                <Link href={profilHref({ id: s.userId, pseudonim: s.opis })} className="text-sm font-medium text-kolo-green-700 hover:underline truncate block">
                  <Pseudonim>{s.opis}</Pseudonim>
                </Link>
              ) : (
                <p className="text-sm text-kolo-text truncate">{s.opis}</p>
              )}
              <p className="text-xs text-kolo-muted">{s.kategorija} · {datum(s.datum)}</p>
            </div>
            <span className={`shrink-0 text-sm font-bold ${s.smer === "PRILIV" ? "text-kolo-green-700" : "text-kolo-danger"}`}>
              {s.smer === "PRILIV" ? "+" : "−"}{s.iznosRSD.toLocaleString(intlTag(locale))}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Faza (preslikano sa /o-nama) ──────────────────────────────────────────────

/**
 * Faza sistema — sedam koraka razvoja, grupisanih u DVE faze iz Pravilnika.
 *
 * Dva reda pojmova su se do sada mešala: „faza" u ovom spisku znači korak
 * razvoja (Pripremna, Testiranje, Kritična masa…), a „Faza 1 / Faza 2" u
 * Pravilniku znači ko odlučuje — Fondacija, odnosno Gornje Kolo. Zato su
 * koraci sada podeljeni: prva tri su Faza 1, poslednja četiri Faza 2. Granica
 * pada tačno tamo gde treba i po sadržaju: četvrti korak („Potpuno aktivan
 * sistem") je onaj u kome odlučivanje ide kroz Gornje Kolo.
 *
 * Uz korake stoji i traka napretka do praga od 1.000.000 POENA, koja je do
 * 2026-09-03 stajala uz spisak zapisa Protokola. Prag JESTE prelaz iz Faze 1
 * u Fazu 2, pa mu je mesto ovde.
 */
function FazaSekcija({ opticaj }: { opticaj: number }) {
  const locale = useLocale();
  const t = useTranslations("oNama");
  const ts = useTranslations("sistem");
  const tc = useTranslations("common");
  const opticajPct = Math.min((opticaj / CILJ_OPTICAJ) * 100, 100);
  const uFazi2 = opticaj >= CILJ_OPTICAJ;

  const faze = [
    { r1: t("faza1"), r2: t("faza1b"), opis: t("faza1_opis"), aktivan: false, grupa: 1 },
    { r1: t("faza2"), r2: t("faza2b"), opis: t("faza2_opis"), aktivan: true, grupa: 1 },
    { r1: t("faza3"), r2: t("faza3b"), opis: t("faza3_opis"), aktivan: false, grupa: 1 },
    { r1: t("faza4"), r2: t("faza4b"), opis: t("faza4_opis"), aktivan: false, grupa: 2 },
    { r1: t("faza5"), r2: t("faza5b"), opis: t("faza5_opis"), aktivan: false, grupa: 2 },
    { r1: t("faza6"), r2: t("faza6b"), opis: t("faza6_opis"), aktivan: false, grupa: 2 },
    { r1: t("faza7"), r2: t("faza7b"), opis: t("faza7_opis"), aktivan: false, grupa: 2 },
  ];

  const grupe = [
    { broj: 1, naslov: ts("faza_1"), span: "col-span-3" },
    { broj: 2, naslov: ts("faza_2"), span: "col-span-4" },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 md:p-6 shadow-kartica">
        <span className="text-xs text-kolo-muted font-medium tracking-wide">{t("status_datum")}</span>
        <h2 className="text-xl md:text-2xl font-bold text-kolo-green-900 mt-1 mb-3" style={{ letterSpacing: "-0.02em" }}>
          {t("status_naslov")}
        </h2>
        {/* Rečenica „Prva je iza nas, u drugoj smo sada" (`oNama.status_opis`) je
            uklonjena 2026-09-03: otkako su koraci grupisani u Fazu 1 i Fazu 2,
            ona govori o KORACIMA, a čita se kao da govori o fazama — a mi smo u
            drugom koraku, dakle i dalje u Fazi 1. Na `/o-nama` rečenica ostaje:
            tamo grupisanja nema, pa nema ni dvosmislenosti. */}

        {/* Timeline */}
        <div className="relative mt-8">
          {/* Mobilni — vertikalni redosled, jedan blok po fazi */}
          <div className="md:hidden space-y-5">
            {grupe.map((grupa) => (
              <div key={grupa.broj}>
                <div
                  className={`rounded-xl px-3 py-2.5 mb-3 ${
                    uFazi2 === (grupa.broj === 2)
                      ? "bg-kolo-green-100 text-kolo-green-700"
                      : "bg-kolo-bg text-kolo-muted"
                  }`}
                >
                  <p className="text-sm font-bold tracking-wide">{grupa.naslov}</p>
                </div>
                <div className="relative">
                  <div
                    className="absolute w-0.5 bg-kolo-border"
                    style={{ top: "0.5rem", bottom: "0.5rem", left: "6px" }}
                  />
                  <div className="flex flex-col gap-3">
                    {faze.filter((f) => f.grupa === grupa.broj).map((faza) => (
                      <div key={faza.r1 + faza.r2} className="relative flex items-start gap-3">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 relative z-10 shrink-0 mt-1 ${faza.aktivan ? "bg-kolo-green-700 border-kolo-green-700" : "bg-white border-kolo-border"}`} />
                        <div className="min-w-0">
                          <p className={`text-sm leading-tight ${faza.aktivan ? "text-kolo-green-700 font-semibold" : "text-kolo-muted"}`}>
                            {faza.r1} {faza.r2}
                            {faza.aktivan && (
                              <span className="ml-2 text-[11px] font-bold text-kolo-green-700">{t("faza_tu_smo_mobilni")}</span>
                            )}
                          </p>
                          <p className="text-xs text-kolo-muted leading-relaxed mt-0.5">{faza.opis}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop — horizontalni redosled */}
          <div className="hidden md:block relative">
            {/* Zaglavlje grupa — ista mreža od sedam kolona, pa se granica
                između 3. i 4. koraka poklapa sa granicom između faza. */}
            <div className="grid grid-cols-7 mb-4">
              {grupe.map((grupa) => (
                <div
                  key={grupa.broj}
                  className={`${grupa.span} mx-1 rounded-xl px-3 py-2.5 text-center ${
                    uFazi2 === (grupa.broj === 2)
                      ? "bg-kolo-green-100 text-kolo-green-700"
                      : "bg-kolo-bg text-kolo-muted"
                  }`}
                >
                  <p className="text-sm font-bold tracking-wide">{grupa.naslov}</p>
                </div>
              ))}
            </div>
            {/* pt-5 drži prostor za oznaku „tu smo" iznad prvog kruga; linija ide
                kroz sredinu krugova, pa se meri od vrha OVOG omotača, ne od
                zaglavlja grupa iznad njega. */}
            <div className="relative pt-5">
              <div
                className="absolute h-0.5 bg-kolo-border"
                style={{ top: "calc(1.25rem + 6px)", left: "7.14%", right: "7.14%" }}
              />
              <div className="relative grid grid-cols-7">
                {faze.map((faza) => (
                  <div key={faza.r1 + faza.r2} className="group relative flex flex-col items-center gap-1.5 px-1 cursor-help">
                    {faza.aktivan && (
                      <span className="absolute -top-5 text-[11px] font-bold text-kolo-green-700 whitespace-nowrap">
                        {t("faza_tu_smo_desktop")}
                      </span>
                    )}
                    <div className={`w-3.5 h-3.5 rounded-full border-2 relative z-10 ${faza.aktivan ? "bg-kolo-green-700 border-kolo-green-700" : "bg-white border-kolo-border"}`} />
                    <p className={`text-[11px] leading-tight text-center ${faza.aktivan ? "text-kolo-green-700 font-semibold" : "text-kolo-muted"}`}>
                      {faza.r1}<br />{faza.r2}
                    </p>
                    <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 z-50 rounded-xl bg-kolo-text text-white text-xs leading-relaxed font-normal text-left p-3 shadow-xl">
                      {faza.opis}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Napredak do Faze 2 — prag iz Pravilnika (1.000.000 evidentiranih
            POENA) je granica između dve grupe koraka iznad, pa traka stoji
            odmah ispod njih. */}
        <div className="mt-8 pt-5 border-t border-kolo-border">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-kolo-text">
              <Pojam
                termin={ts("rast_opticaja")}
                objasnjenje={ts("rast_opticaja_objasnjenje")}
              />
            </p>
            <p className="text-xs text-kolo-muted">
              {ts("rast_opticaja_cilj", { cilj: CILJ_OPTICAJ.toLocaleString(intlTag(locale)) })}
            </p>
          </div>
          <div className="w-full h-3 bg-kolo-bg rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-kolo-green-500 rounded-full transition-all"
              style={{ width: `${opticajPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-kolo-muted">
            <span>
              {ts("rast_opticaja_trenutno")}{" "}
              <strong className="text-kolo-text">
                {opticaj.toLocaleString(intlTag(locale))} {tc("poen")}
              </strong>
            </span>
            <span className="font-medium text-kolo-green-700">
              {opticajPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Kartica pokazatelja ───────────────────────────────────────────────────────

/** Red kartica sa malim naslovom: četiri kolone na računaru, dve na telefonu. */
function RedPokazatelja({ naslov, children }: { naslov: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-kolo-muted">{naslov}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">{children}</div>
    </section>
  );
}

/**
 * Jedna kartica: broj (ili `tekstVelik`), a kad zapisa još nema — `tekst` umesto
 * nule. Klik otvara sekciju ispod (`onClick`) ili vodi na stranicu (`href`);
 * kartica bez ijednog od ta dva je samo pokazatelj.
 */
function Pokazatelj({
  label, broj, tekst, tekstVelik, danas = 0, podnaslov, traka, aktivan = false, onClick, href,
}: {
  label: React.ReactNode;
  broj?: number;
  tekst?: string;
  tekstVelik?: string;
  danas?: number;
  podnaslov?: React.ReactNode;
  traka?: number;
  aktivan?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("sistem");
  // Uniformno na telefonu (vlasnik, 24.10.2026): ista visina u redu, naslov ima
  // rezervisana dva reda, vrednost je na istom mestu, a podnaslov pri dnu — pa
  // kartica sa brojem i kartica sa rečenicom stoje poravnato jedna pored druge.
  const klase = `flex flex-col h-full min-h-[9rem] md:min-h-[10.5rem] rounded-kartica shadow-kartica p-3.5 md:p-5 text-left transition-colors border ${
    aktivan
      ? "bg-kolo-green-700 border-kolo-green-700 text-white"
      : onClick || href
        ? "bg-kolo-surface border-kolo-border hover:border-kolo-green-500"
        : "bg-kolo-surface border-kolo-border"
  }`;
  const sadrzaj = (
    <>
      <p className={`text-sm md:text-base font-semibold leading-tight min-h-[2.5em] md:min-h-0 mb-1 ${aktivan ? "text-white/70" : "text-kolo-muted"}`}>{label}</p>
      {tekst ? (
        <p className={`text-sm md:text-base font-medium leading-snug ${aktivan ? "text-white" : "text-kolo-green-700"}`}>{tekst}</p>
      ) : (
        <p className={`text-2xl md:text-4xl font-bold tabular-nums leading-tight ${aktivan ? "text-white" : "text-kolo-text"}`}>
          {tekstVelik ?? (broj ?? 0).toLocaleString(intlTag(locale))}
        </p>
      )}
      {danas > 0 && (
        <span className={`self-start inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${aktivan ? "bg-white/20 text-white/80" : "bg-kolo-green-100 text-kolo-green-700"}`}>
          +{danas.toLocaleString(intlTag(locale))} {t("danas")}
        </span>
      )}
      {traka !== undefined && (
        <div className={`w-full h-1.5 rounded-full mt-2 ${aktivan ? "bg-white/20" : "bg-kolo-bg"}`}>
          <div
            className={`h-1.5 rounded-full transition-all ${aktivan ? "bg-white/70" : "bg-kolo-green-500"}`}
            style={{ width: `${traka}%` }}
          />
        </div>
      )}
      {podnaslov && (
        <div className={`text-xs mt-auto pt-1 leading-snug ${aktivan ? "text-white/60" : "text-kolo-muted"}`}>{podnaslov}</div>
      )}
    </>
  );
  if (href) return <Link href={href} className={klase}>{sadrzaj}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={`w-full ${klase}`}>{sadrzaj}</button>;
  return <div className={klase}>{sadrzaj}</div>;
}

// ── Zatvoreno gostu ───────────────────────────────────────────────────────────

/** Spisak koji gost ne vidi: jedna rečenica i put unutra (bez objašnjenja zašto). */
function ZatvorenoGostu() {
  const t = useTranslations("sistem");
  return (
    <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 md:p-8 text-center shadow-kartica">
      <p className="text-sm text-kolo-muted mb-4">{t("gost_zatvoreno")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/registracija" className={klaseDugmeta({ varijanta: "zlatno" })}>{t("gost_pridruzi")}</Link>
        <Link href="/login" className={klaseDugmeta({ varijanta: "sekundarno" })}>{t("gost_prijavi")}</Link>
      </div>
    </div>
  );
}

// ── Pregled ───────────────────────────────────────────────────────────────────

function PregledSekcija({
  gost,
  verified,
  danasEmitovano,
  danasLimit,
  emisijeChart,
  protokolTx,
  programiPregled,
}: {
  gost: boolean;
  verified: boolean;
  danasEmitovano: number;
  danasLimit: number;
  emisijeChart: EmisijaChart[];
  protokolTx: Transakcija[];
  programiPregled: ProgramPregled[];
}) {
  const locale = useLocale();
  const t = useTranslations("sistem");
  const tc = useTranslations("common");
  const maxEmitted = Math.max(...emisijeChart.map((e) => e.emitted), 1);

  return (
    <div className="space-y-5">
      {/* Traka „Napredak do Faze 2" preseljena je u sekciju Faza sistema (2026-09-03):
          prag od 1.000.000 POENA je granica između Faze 1 i Faze 2, pa stoji tamo
          gde su faze i nabrojane, a ne uz spisak zapisa Protokola. */}
      {/* Socijalni programi — dnevni zbir po programu.
          🔴 Stoji UMESTO pojedinačnih emisija, koje su merom M-1 (R-03) izašle iz
          spiska ispod: naziv programa je posebna kategorija po ZZPL čl. 17, a
          iznos sam invertuje godište (Podrška starijima: 1000 + 100 × (godine −
          50)) i broj i uzrast dece (Podrška majkama). Zbir uz broj korisnika to
          ne odaje, a proverljivost ostaje potpuna — zbir agregata plus ostali
          kanali daju promenu opticaja. */}
      {programiPregled.length > 0 && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
          <div className="px-5 py-3 border-b border-kolo-border">
            <p className="text-sm font-semibold text-kolo-text">{t("programi_zbir_naslov")}</p>
            <p className="text-xs text-kolo-muted mt-0.5">{t("programi_zbir_opis")}</p>
          </div>
          <div className="hidden sm:grid grid-cols-[9rem_1fr_7rem_7rem] gap-x-3 px-4 py-2 border-b border-kolo-border bg-kolo-bg">
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("col_datum")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("programi_zbir_program")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide text-right">{t("programi_zbir_korisnika")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide text-right">{tc("poen")}</span>
          </div>
          {programiPregled.map((r, i) => (
            <div
              key={`${r.datum}-${r.program}`}
              className={`px-4 py-2.5 ${i < programiPregled.length - 1 ? "border-b border-kolo-border/30" : ""}`}
            >
              <div className="hidden sm:grid grid-cols-[9rem_1fr_7rem_7rem] gap-x-3 items-center text-sm">
                <span className="text-kolo-muted">
                  {new Date(r.datum).toLocaleDateString(intlTag(locale), {
                    day: "2-digit", month: "2-digit", year: "2-digit",
                  })}
                </span>
                <span className="text-kolo-text">{r.label}</span>
                <span className="text-right text-kolo-muted">{r.korisnika}</span>
                <span className="text-right font-bold text-kolo-text">
                  {r.poen.toLocaleString(intlTag(locale))}
                </span>
              </div>
              <div className="sm:hidden space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-kolo-text">{r.label}</span>
                  <span className="text-sm font-bold text-kolo-text">
                    {r.poen.toLocaleString(intlTag(locale))} {tc("poen")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-kolo-muted">
                  <span>
                    {new Date(r.datum).toLocaleDateString(intlTag(locale), {
                      day: "2-digit", month: "2-digit", year: "2-digit",
                    })}
                  </span>
                  <span className="ml-auto">{t("programi_zbir_korisnika")}: {r.korisnika}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Zapisi Protokola — ista komponenta koju otvara kartica na /pocetna. Gostu
          se ne čitaju; vidi dnevni zbir programa iznad i zbir na kartici. */}
      {gost ? <ZatvorenoGostu /> : <ProtokolLista protokolTx={protokolTx} verified={verified} />}

      {/* Grafikon emisija — samo za verifikovane */}
      {verified && emisijeChart.length > 0 && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 shadow-kartica">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-semibold text-kolo-text">
              {t("emisija_14_dana")}
            </p>
            <p className="text-xs text-kolo-muted">
              {t("emisija_limit_danas", { limit: danasLimit.toLocaleString(intlTag(locale)) })}
            </p>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {emisijeChart.map((e) => {
              const pct = (e.emitted / maxEmitted) * 100;
              return (
                <div
                  key={e.date}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div
                    className="w-full bg-kolo-green-500 rounded-t-sm relative"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-kolo-text text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                      {e.emitted.toLocaleString(intlTag(locale))}
                    </div>
                  </div>
                  <span className="text-[11px] text-kolo-muted rotate-45 origin-left translate-y-1">
                    {e.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-kolo-muted mt-4">
            {t("emisija_danas")}{" "}
            <strong className="text-kolo-text">
              {danasEmitovano.toLocaleString(intlTag(locale))} {tc("poen")}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Donacije ──────────────────────────────────────────────────────────────────

function DonacijeSekcija({
  donacije,
  verified,
}: {
  donacije: DonacijaItem[];
  verified: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("sistem");

  // Lista donacija je ista korisniku i verifikovanom (set 4.8.2; donacije čl. 5a
  // st. 1); zaključana je samo detetu (`verified` ovde znači „nije dete").
  if (!verified) {
    return (
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-8 text-center shadow-kartica">
        <p className="text-sm text-kolo-muted">
          {t("donacije_pregled_blokiran")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {donacije.length === 0 ? (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-8 text-center text-sm text-kolo-muted shadow-kartica">
          {t("nema_donacija")}
        </div>
      ) : (<>
      <p className="text-xs text-kolo-muted">{t("prikazanih_donacija", { count: donacije.length })}</p>
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
        <div className="hidden sm:grid grid-cols-[1fr_120px_110px] gap-4 px-5 py-2.5 bg-kolo-bg border-b border-kolo-border text-xs font-semibold text-kolo-muted">
          <span>{t("col_donator")}</span>
          <span className="text-right">RSD</span>
          <span className="text-right">{t("col_datum")}</span>
        </div>
        {donacije.map((d, i) => (
          <div key={d.id} className={i < donacije.length - 1 ? "border-b border-kolo-border/30" : ""}>
            {/* Desktop */}
            <div className="hidden sm:grid grid-cols-[1fr_120px_110px] gap-4 px-5 py-3 items-center text-sm">
              {d.anonimno ? (
                <span className="font-medium text-kolo-muted truncate">{t("donacija_anonimna")}</span>
              ) : (
                <span className="font-medium text-kolo-text truncate">{d.ime ?? "—"}</span>
              )}
              <span className="text-right">
                {d.amountRSD.toLocaleString(intlTag(locale))}
              </span>
              <span className="text-right text-kolo-muted">
                {new Date(d.confirmedAt).toLocaleDateString(intlTag(locale), {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                })}
              </span>
            </div>
            {/* Mobilna kartica */}
            <div className="sm:hidden px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                {d.anonimno ? (
                  <span className="font-semibold text-kolo-muted">{t("donacija_anonimna")}</span>
                ) : (
                  <span className="font-semibold text-kolo-text">{d.ime ?? "—"}</span>
                )}
                <span className="text-sm font-bold text-kolo-text">
                  {d.amountRSD.toLocaleString(intlTag(locale))} RSD
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-kolo-muted">
                <span className="ml-auto">
                  {new Date(d.confirmedAt).toLocaleDateString(intlTag(locale), {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      </>)}

      {/* Rang-lista pokrovitelja ima jedan dom, `/pokrovitelji`; ovde stoji samo
          veza (revizija teksta, uloga 1, 23.10.2026). */}
      <div className="text-center">
        <Link href="/pokrovitelji" className="text-sm font-medium text-kolo-green-700 hover:underline">
          {t("ranglista_pokrovitelja")} →
        </Link>
      </div>
    </div>
  );
}

// ── Iznos transakcija ─────────────────────────────────────────────────────────

function IznosSekcija({
  ukupanIznosTx,
  danasIznosTx,
  razmene,
  verified,
}: {
  ukupanIznosTx: number;
  danasIznosTx: number;
  razmene: Transakcija[];
  verified: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("sistem");
  const transferi = razmene;
  const ukupnoTransferi = transferi.reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 shadow-kartica">
          <p className="text-xs text-kolo-muted mb-1">{t("ukupno_prometa")}</p>
          <p className="text-2xl font-bold text-kolo-text">
            {ukupanIznosTx.toLocaleString(intlTag(locale))}
          </p>
          <p className="text-xs text-kolo-muted mt-1">{t("poen_izmedju_clanova")}</p>
        </div>
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 shadow-kartica">
          <p className="text-xs text-kolo-muted mb-1">{t("danas")}</p>
          <p className="text-2xl font-bold text-kolo-text">
            {danasIznosTx.toLocaleString(intlTag(locale))}
          </p>
          <p className="text-xs text-kolo-muted mt-1">{t("poen_izmedju_clanova")}</p>
        </div>
      </div>
      {transferi.length > 0 && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
          <div className="px-5 py-2.5 bg-kolo-bg border-b border-kolo-border flex justify-between items-center">
            <p className="text-xs font-semibold text-kolo-muted">
              {t("poslednjih_transfera", { count: transferi.length })}
            </p>
            <p className="text-xs text-kolo-muted">
              {t("ukupno_poen", { iznos: ukupnoTransferi.toLocaleString(intlTag(locale)) })}
            </p>
          </div>
          <div className="hidden sm:grid grid-cols-[7rem_1fr_1rem_1fr_6rem] gap-x-3 px-5 py-2 border-b border-kolo-border bg-kolo-bg/50 text-xs font-semibold text-kolo-muted">
            <span>{t("vreme")}</span>
            <span>{t("posalje")}</span>
            <span />
            <span>{t("primalac")}</span>
            <span className="text-right">{t("iznos")}</span>
          </div>
          {transferi.slice(0, 20).map((tx, i) => (
            <div
              key={tx.id}
              className={`px-4 sm:px-5 py-2.5 ${
                i < Math.min(transferi.length, 20) - 1 ? "border-b border-kolo-border/30" : ""
              }`}
            >
              {/* Desktop grid */}
              <div className="hidden sm:grid grid-cols-[7rem_1fr_1rem_1fr_6rem] gap-x-3 items-center text-sm">
                <span className="text-xs text-kolo-muted">
                  {new Date(tx.createdAt).toLocaleString(intlTag(locale), {
                    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                <Ucesnik id={tx.fromId} pseudonim={tx.fromPseudonim} verified={verified} />
                <span className="text-kolo-muted text-center">→</span>
                <Ucesnik id={tx.toId} pseudonim={tx.toPseudonim} verified={verified} />
                <span className="font-semibold text-kolo-text text-right">
                  {tx.amount.toLocaleString(intlTag(locale))}
                </span>
              </div>
              {/* Mobilna kartica */}
              <div className="sm:hidden space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1 flex items-center gap-1.5 text-sm">
                    <Ucesnik id={tx.fromId} pseudonim={tx.fromPseudonim} verified={verified} />
                    <span className="text-kolo-muted shrink-0">→</span>
                    <Ucesnik id={tx.toId} pseudonim={tx.toPseudonim} verified={verified} />
                  </div>
                  <span className="font-bold text-kolo-text shrink-0 text-sm">{tx.amount.toLocaleString(intlTag(locale))}</span>
                </div>
                <p className="text-xs text-kolo-muted">
                  {new Date(tx.createdAt).toLocaleString(intlTag(locale), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

