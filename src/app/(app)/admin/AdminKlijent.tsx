"use client";

import { Fragment, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { intlTag } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import type { NadzorNalaz } from "./NadzorTab";
import type { BrojeviClanova, BrojeviStatusa } from "@/lib/admin-clanovi";
import { jeSuperadmin } from "@/lib/dozvole";
import { ADMIN_TABOVI, type Tab } from "./tabovi";
import { useDijalog } from "@/components/ui/Dijalog";
import Segmenti from "@/components/ui/Segmenti";
import Prekidac from "@/components/ui/Prekidac";
import { pocetnoIzAdrese } from "@/hooks/useStanjeUAdresi";
import Pseudonim from "@/components/Pseudonim";
import AdminLogotip from "./AdminLogotip";
import { RANG_TABELA } from "@/lib/donacija-pravila";
import OznakaStatusa from "@/components/OznakaStatusa";
import type { StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import NaslovStranice from "@/components/ui/NaslovStranice";
import StatKartica from "@/components/ui/StatKartica";

// Teški tabovi iz zasebnih fajlova — lazy-load (smanjuje početni admin bundle).
// Svi su `export default`, pa dynamic koristi default export direktno.
const OsnivaciTab = dynamic(() => import("./OsnivaciTab"), { ssr: false });
const PokroviteljPrijaveTab = dynamic(() => import("./PokroviteljPrijaveTab"), { ssr: false });
const PokroviteljstvoDobraTab = dynamic(() => import("./PokroviteljstvoDobraTab"), { ssr: false });
const PokroviteljUpisiTab = dynamic(() => import("./PokroviteljUpisiTab"), { ssr: false });
const NadzorTab = dynamic(() => import("./NadzorTab"), { ssr: false });
const AktivnostTab = dynamic(() => import("./AktivnostTab"), { ssr: false });
const LevakTab = dynamic(() => import("./LevakTab"), { ssr: false });
const ObavestenjaTab = dynamic(() => import("./ObavestenjaTab"), { ssr: false });
const PolitikaTab = dynamic(() => import("./PolitikaTab"), { ssr: false });
const PijacaTab = dynamic(() => import("./PijacaTab"), { ssr: false });
const PrviOglasiTab = dynamic(() => import("./PrviOglasiTab"), { ssr: false });
const PotvrdeTab = dynamic(() => import("./PotvrdeTab"), { ssr: false });
const RazmeneTab = dynamic(() => import("./RazmeneTab"), { ssr: false });
const NabavkeTab = dynamic(() => import("./NabavkeTab"), { ssr: false });
const ZadrugeTab = dynamic(() => import("./ZadrugeTab"), { ssr: false });
const GazdinstvaTab = dynamic(() => import("./GazdinstvaTab"), { ssr: false });
const OdlukeTab = dynamic(() => import("./OdlukeTab"), { ssr: false });

interface KorisnikInfo {
  id: string;
  pseudonim: string;
  email: string | null;
  /** Broj telefona (`User.telefon`). Vidi ga samo UO u admin panelu — vidljivost
      na javnom profilu uređuje zasebno `UserPodaci.prikaziTelefon` i ovaj prikaz
      je ne dira. */
  telefon: string | null;
  location: string | null;
  tipKorisnika: string;
  admin: string;
  verified: boolean;
  /** Status učesnika (set 4.8.2) — izvodi ga server, crta `OznakaStatusa`. */
  statusUcesnika: StatusUcesnika;
  status: string;
  suspendedReason: string | null;
  balance: number;
  createdAt: string;
  /** Maloletni nalog se ne prevodi ponovo — dugme „Prevedi u dete" se tada ne nudi. */
  maloletan: boolean;
}

interface DashboardData {
  korisnici: BrojeviClanova;
  /** Brojevi po statusu; dok ih server ne šalje, red se ne crta. */
  statusi?: BrojeviStatusa;
  krugovi: { ukupno: number; krugra: number };
  finansije: { opticaj: number; protokolBalance: number };
  zrno: { kodKorisnika: number; uProtokolu: number; ukupno: number };
  ukupnoTransakcija: number;
}

interface AuditLogEntry {
  id: string;
  adminPseudonim: string;
  akcija: string;
  targetId: string | null;
  detalji: string | null;
  createdAt: string;
}

interface ProgramInfo {
  type: string;
  label: string;
  isActive: boolean;
  activatedAt: string | null;
}

interface PendingEnrollment {
  id: string;
  pseudonim: string;
  type: string;
  label: string;
  metadata: Record<string, unknown> | null;
  /**
   * Osnov po kome je pravo ostvareno u Posebnoj podršci (čl. 12).
   *
   * 🔴 Ide ISKLJUČIVO superadminu, uz `metadata`: osnov se ne prikazuje nijednom
   * korisniku (čl. 4 st. 5), a „razlaganje po osnovu dostupno je samom korisniku
   * i licu koje u Fondaciji obrađuje prijavu". Bez njega bi superadmin odlučivao
   * ne videvši ono od čega zavisi rok — odlučivanje na slepo, isti razlog zbog
   * kog su mu i uneti podaci otvoreni.
   */
  osnov: string | null;
  /**
   * Nijedan zahtev članu Kola nije upućen (nema ko podnosioca lično zna) —
   * ispunjenost uslova potvrđuje Fondacija uz obrazloženje (programi čl. 4 st. 2).
   */
  cekaFondaciju?: boolean;
  createdAt: string;
}

interface EmisionaSumarija {
  date: string;
  opticaj: number;
  limit: number;
  totalRequested: number;
  totalEmitted: number;
  koeficijent: number;
}

interface AdminProgramiData {
  zrnoKanalAktivan: boolean;
  programi: ProgramInfo[];
  pendingEnrollments: PendingEnrollment[];
  poslednjeEmisije: EmisionaSumarija[];
}

interface AdminOglasItem {
  id: string;
  title: string;
  description: string;
  obrazlozenje: string | null;
  source: string;
  predlozeniPoen: number;
  brojCelina: number | null;
  opisCeline: string | null;
  procenaObima: string | null;
  saOdobravanjem: boolean;
  positions: number;
  deadline: string | null;
  status: string;
  createdByPseudonim: string;
  krugName: string | null;
  ukupnoPrijava: number;
  pendingEvidencija: number;
  createdAt: string;
}

interface AdminPendingPrijava {
  id: string;
  pseudonim: string;
  oglasTitle: string;
  predlozeniPoen: number;
  positions: number;
  planIzvrsenja: string | null;
  izjavaTekst?: string | null;
  createdAt: string;
}

interface AdminPendingOglasEvidencija {
  id: string;
  pseudonim: string;
  oglasTitle: string;
  date: string;
  predlozeniPoen: number;
  celina: number | null;
  description: string;
  dokaz: string | null;
  createdAt: string;
}

interface AdminPedData {
  oglasi: AdminOglasItem[];
  pendingPrijave: AdminPendingPrijava[];
  pendingEvidencije: AdminPendingOglasEvidencija[];
}

interface PokroviteljItem {
  id: string;
  naziv: string;
  /** Firma po PIB-u, registrovano gazdinstvo po BPG-u (donacije čl. 10, set 4.7.9). */
  pib: string | null;
  bpg: string | null;
  vlasnikPseudonim: string;
  logoUrl: string | null;
  rsdKumulativ: number;
  trenutniNivo: number;
  status: string;
  brDoprinosa: number;
  createdAt: string;
}

interface BlogObjavaAdmin {
  id: string;
  title: string;
  content: string;
  authorPseudonim: string;
  publishedAt: string;
  createdAt: string;
}

interface DonacijaItem {
  id: string;
  pseudonim: string;
  amountRSD: number;
  cumulativeRSD: number;
  level: number;
  poenEmitted: number;
  nacinUplate: string;
  referenceNumber: string | null;
  createdAt: string;
  /** PENDING = najavljena uplata; NAPLACENO = kartica naplaćena, POEN čeka potvrdu (M-4a). */
  status: string;
  /** Ime sa naloga — stoji uz polje za uplatioca da bi se to dvoje uporedilo (M-4a). */
  donatorIme: string | null;
}

interface PrigovorItem {
  id: string;
  pseudonim: string;
  opis: string;
  tipOdluke: string;
  predmetId?: string | null;
  status: string;
  createdAt: string;
}

interface AdminKlijentProps {
  users: KorisnikInfo[];
  opticaj: number;
  adminProgrami: AdminProgramiData;
  adminPed: AdminPedData;
  adminPokrovitelji: PokroviteljItem[];
  dashboard: DashboardData;
  auditLogs: AuditLogEntry[];
  verifikovaniKorisnici: { id: string; pseudonim: string }[];
  krugoviLista2: { id: string; name: string }[];
  blogObjave: BlogObjavaAdmin[];
  nadzorNalazi: NadzorNalaz[];
  /** Otvoreni nadzorni predmeti — badge na tabu Odluke (dokaz stvarnosti čl. 11a). */
  otvorenihPredmeta: number;
  pendingDonacije: DonacijaItem[];
  otvoreniPrigovori: PrigovorItem[];
  viewerJeSuperadmin: boolean;
  viewerId: string;
  pocetniTab: Tab;
  /** Otvorene prijave oglasa — badge na tabu Pijaca (Uslovi čl. 25 st. 2). */
  otvorenihPrijavaOglasa: number;
  /** Prvi oglasi koji čekaju odobrenje doprinosa — badge na tabu Prvi oglasi (čl. 40a). */
  prvihOglasaNaCekanju: number;
  otvorenihPrijavaRazmene: number;
}

const adminNivoLabel = (t: ReturnType<typeof useTranslations<"admin">>): Record<string, string> => ({
  NONE: t("admin_nivo_clan"),
  ADMIN: t("admin_nivo_admin"),
  SUPERADMIN: t("admin_nivo_superadmin"),
  ZADRUGA: t("admin_nivo_zadruga"),
});
const ADMIN_NIVOI = ["NONE", "ADMIN", "SUPERADMIN", "ZADRUGA"] as const;

// ACTIVE se namerno NE prikazuje na kartici — to je podrazumevano stanje skoro
// svakog naloga, pa badge samo pravi šum. Vide se samo odstupanja.
const statusBoja: Record<string, string> = {
  SUSPENDED: "bg-kolo-gold-100 text-kolo-gold-700",
  EXCLUDED:  "bg-kolo-danger-light text-kolo-danger",
};

const statusLabel = (t: (k: string) => string): Record<string, string> => ({
  SUSPENDED: t("korisnici_status_suspendovan"),
  EXCLUDED:  t("korisnici_status_iskljucen"),
});


export default function AdminKlijent({ users, opticaj, adminProgrami, adminPed, adminPokrovitelji, dashboard, auditLogs, verifikovaniKorisnici, krugoviLista2, blogObjave, nadzorNalazi, otvorenihPredmeta, pendingDonacije, otvoreniPrigovori, viewerJeSuperadmin, viewerId, pocetniTab, otvorenihPrijavaOglasa, prvihOglasaNaCekanju, otvorenihPrijavaRazmene }: AdminKlijentProps) {
  const router = useRouter();
  const t = useTranslations("admin");
  // Pri povratku (back) sa oglasa ili profila `pocetniTab` stiže iz stabla koje je
  // nastalo pre promene taba, pa bi vraćao na Dashboard — merodavna je adresa.
  // Ista zabrana kao na serveru: tabovi samo za superadmina se drugima ne otvaraju.
  const [tab, postaviTab] = useState<Tab>(() =>
    pocetnoIzAdrese(
      "tab",
      ADMIN_TABOVI.filter(
        (t) => viewerJeSuperadmin || (t !== "audit" && t !== "nadzor" && t !== "odluke" && t !== "aktivnost" && t !== "politika"),
      ),
      pocetniTab,
    ),
  );

  // Aktivan tab u URL-u (?tab=...) bez nove navigacije — povratak (back) sa
  // profila i sl. vraća na isti tab. replaceState: promena taba ne pravi novi
  // unos u istoriji.
  const setTab = (novi: Tab) => {
    postaviTab(novi);
    window.history.replaceState(null, "", novi === "dashboard" ? "/admin" : `/admin?tab=${novi}`);
  };

  const ukupnoPendingProgrami = adminProgrami.pendingEnrollments.length;
  const ukupnoPendingZaposl = adminPed.pendingPrijave.length + adminPed.pendingEvidencije.length;
  const ukupnoPendingDonacije = pendingDonacije.length;
  const ukupnoOtvoreniPrigovori = otvoreniPrigovori.length;

  // Broj stvari na čekanju po tabu. 🔴 Potvrde namerno bez broja: zabeležena
  // potvrda ne traži radnju administratora — sama se razrešava kad potvrđeni
  // ostvari doprinos. Broj koji nikad ne padne na nulu uči ljude da ignorišu i
  // one koji nešto znače. Iz istog razloga ne ulazi ni u sidebar.
  const broj: Partial<Record<Tab, number>> = {
    donacije: ukupnoPendingDonacije,
    programi: ukupnoPendingProgrami,
    ped: ukupnoPendingZaposl,
    pokrovitelji: adminPokrovitelji.length,
    prigovori: ukupnoOtvoreniPrigovori,
    pijaca: otvorenihPrijavaOglasa,
    "prvi-oglasi": prvihOglasaNaCekanju,
    razmene: otvorenihPrijavaRazmene,
    nadzor: nadzorNalazi.length,
    odluke: otvorenihPredmeta,
  };
  const naziv: Record<Tab, string> = {
    dashboard: t("tab_dashboard"),
    korisnici: t("tab_korisnici"),
    vesti: t("tab_vesti"),
    donacije: t("tab_donacije"),
    programi: t("tab_programi"),
    ped: t("tab_ped"),
    pokrovitelji: t("tab_pokrovitelji"),
    prigovori: t("tab_prigovori"),
    pijaca: t("tab_pijaca"),
    "prvi-oglasi": t("tab_prvi_oglasi"),
    potvrde: t("tab_potvrde"),
    razmene: t("tab_razmene"),
    nabavke: t("tab_nabavke"),
    zadruge: t("tab_zadruge"),
    gazdinstva: t("tab_gazdinstva"),
    emisija: t("tab_emisija"),
    osnivaci: t("tab_osnivaci"),
    obavestenja: t("tab_obavestenja"),
    politika: t("tab_politika"),
    audit: t("tab_audit"),
    aktivnost: t("tab_aktivnost"),
    levak: t("tab_levak"),
    nadzor: t("tab_nadzor"),
    odluke: t("tab_odluke"),
  };
  // Tabovi samo za superadmina: cirkularna pošta (obaveštenja), pristanak na
  // nove akte (politika — odluka vlasnika, Uslovi čl. 40), audit, aktivnost,
  // levak, provere i odluke.
  const SAMO_SUPERADMIN: Tab[] = ["obavestenja", "politika", "audit", "aktivnost", "levak", "nadzor", "odluke"];
  const vidljiv = (k: Tab) => viewerJeSuperadmin || !SAMO_SUPERADMIN.includes(k);

  // 24 taba u šest odeljaka (pregled izgleda 22.10.2026): u jednoj traci se na
  // 1280 px videlo 9, a aktivan tab van vidnog dela nije bio označen.
  // Identifikatori u `?tab=` ostaju isti (stari linkovi rade).
  type Grupa = { kljuc: string; oznaka: string; tabovi: Tab[] };
  const GRUPE: Grupa[] = ([
    { kljuc: "pregled", oznaka: t("grupa_pregled"), tabovi: ["dashboard"] },
    { kljuc: "clanovi", oznaka: t("grupa_clanovi"), tabovi: ["korisnici", "potvrde", "osnivaci"] },
    { kljuc: "pijaca", oznaka: t("grupa_pijaca"), tabovi: ["pijaca", "prvi-oglasi", "razmene", "gazdinstva"] },
    { kljuc: "novac", oznaka: t("grupa_novac"), tabovi: ["donacije", "pokrovitelji", "programi", "ped", "nabavke", "zadruge"] },
    { kljuc: "provere", oznaka: t("grupa_provere"), tabovi: ["prigovori", "nadzor", "odluke"] },
    { kljuc: "sistem", oznaka: t("grupa_sistem"), tabovi: ["vesti", "obavestenja", "politika", "audit", "aktivnost", "levak"] },
  ] as Grupa[])
    .map((g) => ({ ...g, tabovi: g.tabovi.filter(vidljiv) }))
    .filter((g) => g.tabovi.length > 0);
  // `emisija` nema svoj podtab (spojena sa Donacijama), ali stara adresa radi.
  const aktivniTab: Tab = tab === "emisija" ? "donacije" : tab;
  const aktivnaGrupa = GRUPE.find((g) => g.tabovi.includes(aktivniTab)) ?? GRUPE[0];
  const brojGrupe = (g: Grupa) => g.tabovi.reduce((z, k) => z + (broj[k] ?? 0), 0);
  const sBrojem = (oznaka: string, n: number) => (n > 0 ? `${oznaka} (${n})` : oznaka);

  return (
    <div className="space-y-6">
      <NaslovStranice naslov={t("panel_naslov")} />

      {/* Tabovi: telefon — jedan padajući izbor sa grupama; računar — odeljci
          pa podtabovi odeljka (prelamaju se, nema skrola, aktivni se uvek vidi). */}
      <div className="md:hidden">
        <label htmlFor="admin-tab" className="sr-only">{t("panel_naslov")}</label>
        <select
          id="admin-tab"
          value={aktivniTab}
          onChange={(e) => setTab(e.target.value as Tab)}
          className={KLASE_UNOSA + " font-medium"}
        >
          {GRUPE.map((g) => (
            <optgroup key={g.kljuc} label={sBrojem(g.oznaka, brojGrupe(g))}>
              {g.tabovi.map((k) => (
                <option key={k} value={k}>{sBrojem(naziv[k], broj[k] ?? 0)}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="hidden md:block space-y-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("panel_naslov")}>
          {GRUPE.map((g) => {
            const aktivna = g.kljuc === aktivnaGrupa.kljuc;
            const n = brojGrupe(g);
            return (
              <button
                key={g.kljuc}
                type="button"
                role="tab"
                aria-selected={aktivna}
                onClick={() => setTab(g.tabovi[0])}
                className={`min-h-10 rounded-kontrola px-4 text-sm font-semibold transition-colors ${
                  aktivna ? "bg-kolo-green-700 text-white" : "bg-kolo-surface border border-kolo-border text-kolo-text hover:border-kolo-green-500"
                }`}
              >
                {g.oznaka}
                {n > 0 && (
                  <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${aktivna ? "bg-white/20" : "bg-kolo-gold-100 text-kolo-gold-700"}`}>{n}</span>
                )}
              </button>
            );
          })}
        </div>
        {aktivnaGrupa.tabovi.length > 1 && (
          <div className="flex flex-wrap gap-x-1 border-b border-kolo-border">
            {aktivnaGrupa.tabovi.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                aria-current={aktivniTab === k ? "page" : undefined}
                className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  aktivniTab === k ? "border-kolo-green-700 text-kolo-green-700" : "border-transparent text-kolo-muted hover:text-kolo-text"
                }`}
              >
                {sBrojem(naziv[k], broj[k] ?? 0)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dashboard — na vrhu ono što traži radnju (ranije samo u brojevima na
          tabovima, od kojih je pola bilo van vidnog dela trake). */}
      {tab === "dashboard" && (
        <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
          <h2 className="text-base font-semibold text-kolo-text">{t("na_cekanju_naslov")}</h2>
          {(Object.keys(broj) as Tab[]).filter((k) => vidljiv(k) && (broj[k] ?? 0) > 0).length === 0 ? (
            <p className="mt-2 text-sm text-kolo-muted">{t("na_cekanju_nista")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-kolo-border">
              {(Object.keys(broj) as Tab[])
                .filter((k) => vidljiv(k) && (broj[k] ?? 0) > 0)
                .map((k) => (
                  <li key={k}>
                    <button
                      type="button"
                      onClick={() => setTab(k)}
                      className="flex w-full min-h-11 items-center justify-between gap-3 text-left text-sm text-kolo-text hover:text-kolo-green-700"
                    >
                      <span>{naziv[k]}</span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-kolo-gold-100 px-2 py-0.5 text-xs font-semibold text-kolo-gold-700">{broj[k]}</span>
                        <span aria-hidden="true">→</span>
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}
      {tab === "dashboard" && <DashboardTab data={dashboard} onRefresh={() => router.refresh()} />}

      {/* Programi */}
      {tab === "programi" && <AdminProgramiTab data={adminProgrami} opticaj={opticaj} sme={viewerJeSuperadmin} onDone={() => router.refresh()} />}

      {/* Evidencija doprinosa */}
      {tab === "ped" && <AdminPedTab data={adminPed} onDone={() => router.refresh()} />}

      {/* Pokrovitelji */}
      {tab === "pokrovitelji" && (
        <AdminPokroviteljiTab
          pokrovitelji={adminPokrovitelji}
          verifikovaniKorisnici={verifikovaniKorisnici}
          krugovi={krugoviLista2}
          onDone={() => router.refresh()}
        />
      )}

      {/* Donacije */}
      {tab === "donacije" && <DonacijeTab donacije={pendingDonacije} onDone={() => router.refresh()} />}

      {/* Prigovori */}
      {tab === "prigovori" && <PrigovoriTab prigovori={otvoreniPrigovori} onDone={() => router.refresh()} />}

      {/* Korisnici */}
      {tab === "korisnici" && <KorisniciTab users={users} onDone={() => router.refresh()} viewerJeSuperadmin={viewerJeSuperadmin} viewerId={viewerId} />}

      {/* Pijaca — moderacija oglasa (Uslovi čl. 21, 25) */}
      {tab === "pijaca" && <PijacaTab />}

      {/* Prvi oglasi — odobravanje doprinosa iz čl. 40a (nalozi bez potvrde). */}
      {tab === "prvi-oglasi" && <PrviOglasiTab onDone={() => router.refresh()} />}

      {/* Potvrde — POEN po potvrdi koji čeka trag učešća (dokaz stvarnosti čl. 7):
          ručni upis kao ventil + jednokratno usklađivanje zatečenih. */}
      {tab === "potvrde" && (
        <PotvrdeTab jeSuperadmin={viewerJeSuperadmin} onDone={() => router.refresh()} />
      )}

      {/* Razmene — prijave neispunjene razmene; odlučuje se o prepisu POEN-a. */}
      {tab === "razmene" && <RazmeneTab onDone={() => router.refresh()} />}

      {/* Nabavke — sprovođenje kolektivne nabavke (Pravilnik čl. 51a). */}
      {tab === "nabavke" && <NabavkeTab onDone={() => router.refresh()} />}
      {tab === "zadruge" && <ZadrugeTab />}
      {tab === "gazdinstva" && <GazdinstvaTab jeSuperadmin={viewerJeSuperadmin} />}


      {/* Finansije */}
      {tab === "emisija" && <DonacijeTab donacije={pendingDonacije} onDone={() => router.refresh()} pocetniNacin="pseudonim" />}

      {/* Nadzor integriteta — automat (samo superadmin) */}
      {tab === "nadzor" && viewerJeSuperadmin && <NadzorTab nalazi={nadzorNalazi} />}

      {/* Odluke — nadzorni predmeti koje su otvorili nadzornici (samo superadmin) */}
      {tab === "odluke" && viewerJeSuperadmin && <OdlukeTab />}

      {/* Osnivači */}
      {tab === "osnivaci" && <OsnivaciTab verifikovaniKorisnici={verifikovaniKorisnici} onDone={() => router.refresh()} />}

      {/* Vesti */}
      {tab === "vesti" && <VestiTab objave={blogObjave} onDone={() => router.refresh()} />}

      {/* Audit log */}
      {tab === "obavestenja" && viewerJeSuperadmin && <ObavestenjaTab />}
      {tab === "politika" && viewerJeSuperadmin && <PolitikaTab />}

      {tab === "audit" && <AuditLogTab logs={auditLogs} onRefresh={() => router.refresh()} />}

      {/* Dnevnik aktivnosti korisnika (samo superadmin) */}
      {tab === "aktivnost" && viewerJeSuperadmin && <AktivnostTab />}

      {/* Levak: agregatni pogled na isti dnevnik aktivnosti — superadmin, kao i Aktivnost. */}
      {tab === "levak" && viewerJeSuperadmin && <LevakTab />}
    </div>
  );
}

// ── Evidencija doprinosa tab ─────────────────────────────────────────────────────────

const sourceLabel = (t: ReturnType<typeof useTranslations<"admin">>): Record<string, string> => ({ FONDACIJA: t("source_fondacija"), KRUG: t("source_krug"), PROJEKAT: t("source_projekat") });
const sourceCls: Record<string, string> = {
  FONDACIJA: "bg-kolo-green-100 text-kolo-green-700",
  KRUG:   "bg-kolo-info-light text-kolo-info",
  PROJEKAT:  "bg-purple-50 text-purple-700",
};

function AdminPedTab({ data, onDone }: { data: AdminPedData; onDone: () => void }) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [view, setView] = useState<"oglasi" | "prijave" | "evidencije" | "novi">("oglasi");
  const [loading, setLoading] = useState<string | null>(null);
  const [poruke, setPoruke] = useState<Record<string, { text: string; ok: boolean }>>({});
  const [izmenaOglas, setIzmenaOglas] = useState<AdminOglasItem | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  async function odobriPrijavu(id: string) {
    setLoading(id);
    const res = await fetch(`/api/admin/doprinos-oglasi/prijave/${id}/odobri`, { method: "POST" });
    const d = await res.json();
    setLoading(null);
    setPoruke((p) => ({ ...p, [id]: { text: res.ok ? t("ped_odobri_loading") : (d.error ?? t("greska_generalna")), ok: res.ok } }));
    if (res.ok) setTimeout(onDone, 1000);
  }

  async function odbijPrijavu(id: string, razlog: string) {
    setLoading(id);
    const res = await fetch(`/api/admin/doprinos-oglasi/prijave/${id}/odbij`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razlog }),
    });
    const d = await res.json();
    setLoading(null);
    setPoruke((p) => ({ ...p, [id]: { text: res.ok ? t("ped_odbijeno_msg") : (d.error ?? t("greska_generalna")), ok: res.ok } }));
    if (res.ok) setTimeout(onDone, 1000);
  }

  async function odobriEvidenciju(id: string) {
    setLoading(id);
    const res = await fetch(`/api/admin/doprinos-oglasi/evidencija/${id}/odobri`, { method: "POST" });
    const d = await res.json();
    setLoading(null);
    setPoruke((p) => ({ ...p, [id]: { text: res.ok ? t("ped_potvrdjeno_msg", { poen: d.predlozeniPoen?.toLocaleString(intlTag(locale)) }) : (d.error ?? t("greska_generalna")), ok: res.ok } }));
    if (res.ok) setTimeout(onDone, 1000);
  }

  async function odbijEvidenciju(id: string) {
    setLoading(id);
    const res = await fetch(`/api/admin/doprinos-oglasi/evidencija/${id}/odbij`, { method: "POST" });
    const d = await res.json();
    setLoading(null);
    setPoruke((p) => ({ ...p, [id]: { text: res.ok ? t("ped_odbijeno_msg") : (d.error ?? t("greska_generalna")), ok: res.ok } }));
    if (res.ok) setTimeout(onDone, 1000);
  }

  async function zatvoriOglas(id: string) {
    if (!(await potvrdi({ poruka: t("novi_oglas_zatvori_oglas_confirm"), opasno: true, dugme: t("ped_zatvori") }))) return;
    setLoading(id);
    const res = await fetch(`/api/admin/doprinos-oglasi/oglasi/${id}/zatvori`, { method: "POST" });
    setLoading(null);
    if (res.ok) onDone();
  }

  const subTabs: [typeof view, string][] = [
    ["oglasi", t("ped_tab_oglasi", { count: data.oglasi.length })],
    ["prijave", `${t("ped_tab_prijave")}${data.pendingPrijave.length > 0 ? ` (${data.pendingPrijave.length})` : ""}`],
    ["evidencije", `${t("ped_tab_evidencije")}${data.pendingEvidencije.length > 0 ? ` (${data.pendingEvidencije.length})` : ""}`],
    ["novi", t("ped_tab_novi")],
  ];

  return (
    <div className="space-y-4">
      {dijalog}
      {/* Podtabovi — zajednički prekidač (Segmenti). */}
      <div className="max-w-full overflow-x-auto">
        <Segmenti
          oznaka={t("tab_ped")}
          vrednost={view}
          onPromena={setView}
          opcije={subTabs.map(([key, label]) => ({ vrednost: key, oznaka: label }))}
        />
      </div>

      {/* Oglasi */}
      {view === "oglasi" && izmenaOglas && (
        <NoviOglasForma
          oglas={izmenaOglas}
          onSuccess={() => { setIzmenaOglas(null); onDone(); }}
          onCancel={() => setIzmenaOglas(null)}
        />
      )}
      {view === "oglasi" && !izmenaOglas && (
        <div className="space-y-3">
          {data.oglasi.length === 0 ? (
            <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica"><PraznoStanje naslov={t("ped_nema_oglasa")} /></div>
          ) : data.oglasi.map((o) => (
            <div key={o.id} className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 shadow-kartica">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${sourceCls[o.source]}`}>{sourceLabel(t)[o.source]}</span>
                    {o.krugName && <span className="text-xs text-kolo-muted">{o.krugName}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded ${o.status === "ACTIVE" ? "bg-kolo-green-100 text-kolo-green-700" : "bg-kolo-bg text-kolo-muted"}`}>
                      {o.status === "ACTIVE" ? t("ped_oglas_aktivan") : t("ped_oglas_zatvoren")}
                    </span>
                  </div>
                  <p className="font-semibold text-kolo-text text-sm">{o.title}</p>
                  <p className="text-xs text-kolo-muted mt-1">
                    {o.predlozeniPoen > 0 ? o.predlozeniPoen.toLocaleString(intlTag(locale)) : t("ped_neograniceno")} {t("ped_predlozeni_poen")}{o.saOdobravanjem ? ` · ${t("ped_oglas_sa_odobravanjem")}` : ""} · {o.positions} {o.positions === 1 ? t("ped_oglas_izvršilac_sing") : t("ped_oglas_izvršilac_pl")} · {o.ukupnoPrijava} {t("ped_oglas_prijava")} · {o.pendingEvidencija} {t("ped_oglas_za_verifikaciju")}
                  </p>
                </div>
                {o.status === "ACTIVE" && (
                  <div className="flex gap-2 shrink-0">
                    {o.ukupnoPrijava === 0 && (
                      <button onClick={() => setIzmenaOglas(o)} disabled={loading === o.id}
                        className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
                        {t("ped_izmeni")}
                      </button>
                    )}
                    <button onClick={() => zatvoriOglas(o.id)} disabled={loading === o.id}
                      className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                      {t("ped_zatvori")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prijave */}
      {view === "prijave" && (
        <div className="space-y-3">
          {data.pendingPrijave.length === 0 ? (
            <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica"><PraznoStanje naslov={t("ped_nema_prijava")} /></div>
          ) : data.pendingPrijave.map((p) => {
            const poruka = poruke[p.id];
            return (
              <div key={p.id} className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 space-y-3 shadow-kartica">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-kolo-text text-sm"><Pseudonim>{p.pseudonim}</Pseudonim></p>
                    <p className="text-xs text-kolo-muted mt-0.5">{p.oglasTitle} · {p.predlozeniPoen > 0 ? p.predlozeniPoen.toLocaleString(intlTag(locale)) : t("ped_neograniceno")} {t("ped_predlozeni_poen")}</p>
                    {p.planIzvrsenja && <p className="text-xs text-kolo-muted mt-1 line-clamp-3"><span className="font-semibold">{t("ped_plan_label")}</span> {p.planIzvrsenja}</p>}
                    {/* Izjava izvršioca (čl. 10 al. 3) — snimljena uz prijavu. */}
                    {p.izjavaTekst && (
                      <details className="mt-1">
                        <summary className="text-xs text-kolo-muted cursor-pointer font-semibold">{t("ped_izjava_label")}</summary>
                        <p className="mt-1 text-xs text-kolo-muted whitespace-pre-line">{p.izjavaTekst}</p>
                      </details>
                    )}
                    <p className="text-xs text-kolo-muted">{new Date(p.createdAt).toLocaleDateString(intlTag(locale))}</p>
                  </div>
                  <div className="flex gap-2">
                    <OdbijForma onOdbij={(r) => odbijPrijavu(p.id, r)} loading={loading === p.id} />
                    <button onClick={() => odobriPrijavu(p.id)} disabled={loading === p.id}
                      className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
                      {loading === p.id ? "..." : t("ped_odobri")}
                    </button>
                  </div>
                </div>
                {poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
              </div>
            );
          })}
        </div>
      )}

      {/* Evidencije */}
      {view === "evidencije" && (
        <div className="space-y-3">
          {data.pendingEvidencije.length === 0 ? (
            <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica"><PraznoStanje naslov={t("ped_nema_evidencija")} /></div>
          ) : data.pendingEvidencije.map((e) => {
            const poruka = poruke[e.id];
            return (
              <div key={e.id} className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 space-y-3 shadow-kartica">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-kolo-text text-sm"><Pseudonim>{e.pseudonim}</Pseudonim></p>
                    <p className="text-xs text-kolo-muted mt-0.5">{e.oglasTitle} · {new Date(e.date).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "short" })}</p>
                    <p className="text-xs text-kolo-muted mt-1 line-clamp-2">{e.description}</p>
                    {e.dokaz && (/\.(jpe?g|png|webp)(\?.*)?$/i.test(e.dokaz) && /^https?:\/\//.test(e.dokaz) ? (
                      // Screenshot dokaz (R2) — sličica koja se otvara u punoj veličini.
                      <a href={e.dokaz} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.dokaz} alt={t("ped_dokaz_label")} className="h-24 rounded-lg border border-kolo-border object-cover" />
                      </a>
                    ) : (
                      <p className="text-xs text-kolo-info mt-1 line-clamp-1">
                        {t("ped_dokaz_label")}{" "}
                        {/^https?:\/\//.test(e.dokaz) ? (
                          <a href={e.dokaz} target="_blank" rel="noopener noreferrer" className="underline break-all">{e.dokaz}</a>
                        ) : e.dokaz}
                      </p>
                    ))}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-kolo-text">{e.predlozeniPoen.toLocaleString(intlTag(locale))} {t("ped_p_predlozeno")}</p>
                    {e.celina != null && <p className="text-xs text-kolo-muted">{t("ped_celina", { broj: e.celina })}</p>}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => odbijEvidenciju(e.id)} disabled={loading === e.id}
                        className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                        {t("krug_odbij")}
                      </button>
                      <button onClick={() => odobriEvidenciju(e.id)} disabled={loading === e.id}
                        className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
                        {loading === e.id ? "..." : t("ped_odobri")}
                      </button>
                    </div>
                  </div>
                </div>
                {poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
              </div>
            );
          })}
        </div>
      )}

      {/* Novi oglas */}
      {view === "novi" && <NoviOglasForma onSuccess={() => { onDone(); setView("oglasi"); }} />}
    </div>
  );
}

function OdbijForma({ onOdbij, loading }: { onOdbij: (razlog: string) => void; loading: boolean }) {
  const t = useTranslations("admin");
  const [show, setShow] = useState(false);
  const [razlog, setRazlog] = useState("");
  if (!show) return (
    <button onClick={() => setShow(true)} className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>{t("krug_odbij")}</button>
  );
  return (
    <div className="flex gap-1 items-center">
      <input type="text" placeholder={t("odbij_razlog_placeholder")} aria-label={t("odbij_razlog_placeholder")} value={razlog} onChange={(e) => setRazlog(e.target.value)}
        className="px-2 py-1.5 rounded-kontrola border border-kolo-border text-xs w-28 bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10" />
      <button onClick={() => { onOdbij(razlog); setShow(false); }} disabled={loading}
        className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>✓</button>
      <button onClick={() => setShow(false)} className={klaseDugmeta({ varijanta: "tiho", velicina: "sm" })}>✕</button>
    </div>
  );
}

function NoviOglasForma({ oglas, onSuccess, onCancel }: { oglas?: AdminOglasItem; onSuccess: () => void; onCancel?: () => void }) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [title, setTitle] = useState(oglas?.title ?? "");
  const [description, setDescription] = useState(oglas?.description ?? "");
  // Celine (čl. 5, 6; S1): POEN za jednu celinu × broj celina = predloženi POEN zadatka.
  const [poenPoCelini, setPoenPoCelini] = useState(oglas?.brojCelina ? String(Math.floor(oglas.predlozeniPoen / oglas.brojCelina)) : "");
  const [brojCelina, setBrojCelina] = useState(oglas?.brojCelina ? String(oglas.brojCelina) : "");
  const [opisCeline, setOpisCeline] = useState(oglas?.opisCeline ?? "");
  const [procenaObima, setProcenaObima] = useState(oglas?.procenaObima ?? "");
  const [obrazlozenje, setObrazlozenje] = useState(oglas?.obrazlozenje ?? "");
  const [saOdobravanjem, setSaOdobravanjem] = useState(oglas?.saOdobravanjem ?? false);
  const [positions, setPositions] = useState(oglas ? String(oglas.positions) : "");
  const [deadline, setDeadline] = useState(oglas?.deadline ? oglas.deadline.slice(0, 10) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const po = Number(poenPoCelini);
  const broj = Number(brojCelina);
  const celineOk = Number.isInteger(po) && po >= 1 && Number.isInteger(broj) && broj >= 1;
  const predlozeni = celineOk ? po * broj : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!celineOk || !opisCeline.trim() || !procenaObima.trim()) { setError(t("novi_oglas_celine_validacija")); return; }
    setLoading(true);
    try {
      const res = await fetch(oglas ? `/api/admin/doprinos-oglasi/oglasi/${oglas.id}` : "/api/admin/doprinos-oglasi/oglasi", {
        method: oglas ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          poenPoCelini: po,
          brojCelina: broj,
          opisCeline: opisCeline.trim(),
          procenaObima: procenaObima.trim(),
          obrazlozenje: obrazlozenje.trim() || undefined,
          saOdobravanjem,
          positions: positions.trim() ? Number(positions) : undefined,
          deadline: deadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("novi_oglas_greska_generalna")); return; }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 space-y-4 shadow-kartica">
      <p className="text-sm font-semibold text-kolo-muted">{oglas ? t("izmena_oglas_naslov_forme") : t("novi_oglas_naslov_forme")}</p>

      <div>
        <label htmlFor="adm-novi-oglas-naziv-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("novi_oglas_naziv_label")}</label>
        <input id="adm-novi-oglas-naziv-label" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("novi_oglas_naziv_placeholder")}
          className={KLASE_UNOSA} />
      </div>

      <div>
        <label htmlFor="adm-novi-oglas-opis-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("novi_oglas_opis_label")}</label>
        <textarea id="adm-novi-oglas-opis-label" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder={t("novi_oglas_opis_placeholder")}
          className={KLASE_UNOSA + " resize-none"} />
      </div>

      <div>
        <label htmlFor="adm-novi-oglas-procena-obima" className="block text-sm font-medium text-kolo-text mb-1.5">{t("novi_oglas_procena_obima_label")}</label>
        <textarea id="adm-novi-oglas-procena-obima" rows={2} value={procenaObima} onChange={(e) => setProcenaObima(e.target.value)}
          placeholder={t("novi_oglas_procena_obima_placeholder")}
          className={KLASE_UNOSA + " resize-none"} />
      </div>

      <div>
        <label htmlFor="adm-novi-oglas-opis-celine" className="block text-sm font-medium text-kolo-text mb-1.5">{t("novi_oglas_opis_celine_label")}</label>
        <input id="adm-novi-oglas-opis-celine" type="text" value={opisCeline} onChange={(e) => setOpisCeline(e.target.value)}
          placeholder={t("novi_oglas_opis_celine_placeholder")}
          className={KLASE_UNOSA} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="adm-novi-oglas-poen-po-celini" className="block text-sm font-medium text-kolo-text mb-1.5">{t("novi_oglas_poen_po_celini_label")}</label>
          <input id="adm-novi-oglas-poen-po-celini" type="number" min={1} step={1} value={poenPoCelini} onChange={(e) => setPoenPoCelini(e.target.value)}
            className={KLASE_UNOSA} />
        </div>
        <div>
          <label htmlFor="adm-novi-oglas-broj-celina" className="block text-sm font-medium text-kolo-text mb-1.5">{t("novi_oglas_broj_celina_label")}</label>
          <input id="adm-novi-oglas-broj-celina" type="number" min={1} step={1} value={brojCelina} onChange={(e) => setBrojCelina(e.target.value)}
            className={KLASE_UNOSA} />
        </div>
      </div>

      <div>
        <label htmlFor="adm-novi-oglas-obrazlozenje-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("novi_oglas_obrazlozenje_label")}</label>
        <input id="adm-novi-oglas-obrazlozenje-label" type="text" value={obrazlozenje} onChange={(e) => setObrazlozenje(e.target.value)}
          placeholder={t("novi_oglas_obrazlozenje_placeholder")}
          className={KLASE_UNOSA} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="adm-novi-oglas-br-izvrilaca-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("novi_oglas_br_izvršilaca_label")}</label>
          <input id="adm-novi-oglas-br-izvrilaca-label" type="number" min={1} value={positions} onChange={(e) => setPositions(e.target.value)}
            placeholder={t("novi_oglas_br_izvršilaca_placeholder")}
            className={KLASE_UNOSA} />
        </div>
        <div>
          <label htmlFor="adm-novi-oglas-rok-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("novi_oglas_rok_label")}</label>
          <input id="adm-novi-oglas-rok-label" type="date" lang="sr-RS" value={deadline} onChange={(e) => setDeadline(e.target.value)}
            className={KLASE_UNOSA} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-kolo-text cursor-pointer">
        <input type="checkbox" checked={saOdobravanjem} onChange={(e) => setSaOdobravanjem(e.target.checked)}
          className="w-4 h-4 accent-kolo-green-700" />
        {t("novi_oglas_sa_odobravanjem_label")}
      </label>

      {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}

      <Obavestenje vrsta="upozorenje">
        {t("novi_oglas_napomena_box", { poen: celineOk ? predlozeni.toLocaleString(intlTag(locale)) : "—", broj: celineOk ? broj : "—", po: celineOk ? po.toLocaleString(intlTag(locale)) : "—" })}
      </Obavestenje>

      <div className="flex gap-2">
        {oglas && onCancel && (
          <button type="button" onClick={onCancel} disabled={loading}
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "lg" }) + " flex-1"}>
            {t("izmena_oglas_otkazi")}
          </button>
        )}
        <button type="submit" disabled={loading || !title.trim() || !description.trim() || !celineOk || !opisCeline.trim() || !procenaObima.trim()}
          className={klaseDugmeta({ varijanta: "primarno", velicina: "lg" }) + " flex-1"}>
          {loading ? (oglas ? t("izmena_oglas_cuvanje") : t("novi_oglas_kreiranje")) : (oglas ? t("izmena_oglas_sacuvaj") : t("novi_oglas_kreiraj"))}
        </button>
      </div>
    </form>
  );
}

// ── Programi tab ──────────────────────────────────────────────────────────────

function AdminProgramiTab({ data, opticaj, sme, onDone }: { data: AdminProgramiData; opticaj: number; sme: boolean; onDone: () => void }) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [loadingToggle, setLoadingToggle] = useState<string | null>(null);
  const [loadingNocna, setLoadingNocna] = useState(false);
  const [nocnaRezultat, setNocnaRezultat] = useState<string | null>(null);
  const [loadingZrno, setLoadingZrno] = useState(false);
  const { dijalog, potvrdi, unesi, obavesti } = useDijalog();
  const dnevniLimit = Math.floor(opticaj * 0.1);

  async function toggleZrnoKanal() {
    setLoadingZrno(true);
    await fetch("/api/admin/zrno/nocna", { method: "PATCH" });
    setLoadingZrno(false);
    onDone();
  }

  async function pokreniZrnoNocnu() {
    if (!(await potvrdi({ poruka: t("programi_zrno_confirm"), dugme: t("programi_zrno_obrada_btn") }))) return;
    setLoadingZrno(true);
    const res = await fetch("/api/admin/zrno/nocna", { method: "POST" });
    const d = await res.json();
    setLoadingZrno(false);
    await obavesti(res.ok ? `ZRNO: kurs ${Number(d.kurs).toFixed(2)}, u Protokolu: ${d.zrnaUProtokolu?.toLocaleString(intlTag(locale))}` : d.error);
    onDone();
  }

  async function toggleProgram(type: string) {
    setLoadingToggle(type);
    const res = await fetch(`/api/admin/programi/${type}/toggle`, { method: "POST" });
    setLoadingToggle(null);
    if (res.ok) onDone();
  }

  async function pokreniNocnu() {
    if (!(await potvrdi({ poruka: t("programi_nocna_confirm"), dugme: t("programi_pokreni_emisiju") }))) return;
    setLoadingNocna(true); setNocnaRezultat(null);
    const res = await fetch("/api/admin/emisija/nocna", { method: "POST" });
    const data = await res.json();
    setLoadingNocna(false);
    if (res.ok) {
      setNocnaRezultat(t("programi_nocna_rezultat", { emitted: data.totalEmitted?.toLocaleString(intlTag(locale)), requested: data.totalRequested?.toLocaleString(intlTag(locale)), koef: Number(data.koeficijent).toFixed(4) }));
      onDone();
    } else {
      setNocnaRezultat(t("programi_greska_prefix", { msg: data.error }));
    }
  }

  async function odobriEnrollment(id: string, dailyAmount?: number) {
    const prijava = data.pendingEnrollments.find((e) => e.id === id);
    let obrazlozenjeFondacije: string | undefined;
    if (prijava?.cekaFondaciju) {
      const unos = await unesi({ poruka: t("programi_fondacija_obrazlozenje_prompt") });
      if (unos === null) return;
      obrazlozenjeFondacije = unos.trim();
    }
    const res = await fetch(`/api/admin/programi/enrollments/${id}/odobri`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(dailyAmount != null ? { dailyAmount } : {}),
        ...(obrazlozenjeFondacije ? { obrazlozenjeFondacije } : {}),
      }),
    });
    if (res.ok) onDone();
    else { const d = await res.json(); await obavesti(d.error); }
  }

  async function odbijEnrollment(id: string) {
    const razlog = await unesi({ poruka: t("programi_odbij_razlog_prompt"), opasno: true, opciono: true });
    if (razlog === null) return;
    const res = await fetch(`/api/admin/programi/enrollments/${id}/odbij`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razlog }),
    });
    if (res.ok) onDone();
  }

  return (
    <div className="space-y-6">
      {dijalog}
      {/* Opticaj + dnevni limit programa */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatKartica oznaka={t("emisija_opticaj_label")} vrednost={opticaj.toLocaleString(intlTag(locale))} />
        <StatKartica
          oznaka={t("emisija_dnevni_limit")}
          vrednost={dnevniLimit.toLocaleString(intlTag(locale))}
          podnaslov={t("emisija_dnevni_limit_sub")}
        />
      </div>

      {/* ZRNO tržište */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border px-5 py-4 flex justify-between items-center shadow-kartica">
        <div>
          <p className="text-sm font-semibold text-kolo-muted">{t("programi_zrno_kanal_naslov")}</p>
          <p className="text-xs text-kolo-muted mt-0.5">
            {data.zrnoKanalAktivan ? t("programi_zrno_aktivno") : t("programi_zrno_neaktivno")}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <button onClick={pokreniZrnoNocnu} disabled={loadingZrno}
            className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
            ▶ {loadingZrno ? "..." : t("programi_zrno_obrada_btn")}
          </button>
          <Prekidac
            ukljuceno={data.zrnoKanalAktivan}
            onPromena={toggleZrnoKanal}
            zauzet={loadingZrno}
            oznaka={data.zrnoKanalAktivan ? t("programi_deaktiviraj") : t("programi_aktiviraj")}
          />
        </div>
      </div>

      {/* Status programa */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
        <div className="px-5 py-3 border-b border-kolo-border flex justify-between items-center">
          <h3 className="text-sm font-semibold text-kolo-muted">{t("programi_status_naslov")}</h3>
          <button onClick={pokreniNocnu} disabled={loadingNocna}
            className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" })}>
            ▶ {loadingNocna ? "..." : t("programi_pokreni_emisiju")}
          </button>
        </div>
        {nocnaRezultat && (
          <div className="px-5 py-3 border-b border-kolo-border">
            <Obavestenje vrsta="uspeh">{nocnaRezultat}</Obavestenje>
          </div>
        )}
        {data.programi.map((p, i) => (
          <div key={p.type} className={`px-5 py-3 flex justify-between items-center ${i < data.programi.length - 1 ? "border-b border-kolo-border" : ""}`}>
            <div>
              <span className="text-sm font-medium text-kolo-text">{p.label}</span>
              {p.activatedAt && p.isActive && (
                <span className="ml-2 text-xs text-kolo-muted">{t("programi_aktiviran_label", { datum: new Date(p.activatedAt).toLocaleDateString(intlTag(locale)) })}</span>
              )}
            </div>
            <Prekidac
              ukljuceno={p.isActive}
              onPromena={() => toggleProgram(p.type)}
              zauzet={loadingToggle === p.type}
              oznaka={`${p.label}: ${p.isActive ? t("programi_deaktiviraj") : t("programi_aktiviraj")}`}
            />
          </div>
        ))}
      </div>

      {/* Pending prijave na programe */}
      {data.pendingEnrollments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-kolo-muted">{t("programi_prijave_naslov", { count: data.pendingEnrollments.length })}</h3>
          {data.pendingEnrollments.map((e) => (
            <EnrollmentKartica key={e.id} e={e} sme={sme} onOdobri={(amt) => odobriEnrollment(e.id, amt)} onOdbij={() => odbijEnrollment(e.id)} />
          ))}
        </div>
      )}

      {data.pendingEnrollments.length === 0 && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica">
          <PraznoStanje naslov={t("programi_nema_zahteva")} />
        </div>
      )}

      {/* Istorija emisija */}
      {data.poslednjeEmisije.length > 0 && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
          <div className="px-5 py-3 border-b border-kolo-border">
            <h3 className="text-sm font-semibold text-kolo-muted">{t("programi_istorija_emisija")}</h3>
          </div>
          {data.poslednjeEmisije.map((s, i) => (
            <div key={s.date} className={`px-5 py-3 flex justify-between items-center text-sm ${i < data.poslednjeEmisije.length - 1 ? "border-b border-kolo-border" : ""}`}>
              <span className="text-kolo-muted">{new Date(s.date).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "short" })}</span>
              <span className="font-semibold text-kolo-green-700">{s.totalEmitted.toLocaleString(intlTag(locale))} P</span>
              {s.koeficijent < 1 && (
                <span className="text-xs text-kolo-gold-700">{t("programi_koef_label", { val: s.koeficijent.toFixed(3) })}</span>
              )}
              <span className="text-xs text-kolo-muted">{t("programi_lim_label", { val: s.limit.toLocaleString(intlTag(locale)) })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EnrollmentKartica({ e, sme, onOdobri, onOdbij }: {
  e: PendingEnrollment;
  /** Superadmin — jedini koji vidi unete podatke i jedini koji odlučuje (DPIA 5.6). */
  sme: boolean;
  onOdobri: (dailyAmount?: number) => void;
  onOdbij: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [dailyAmount, setDailyAmount] = useState("");

  const metaLines = [
    e.osnov ? `osnov: ${e.osnov}` : null,
    e.metadata ? Object.entries(e.metadata).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" · ") : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="bg-kolo-surface rounded-kartica border border-kolo-border px-5 py-4 space-y-3 shadow-kartica">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-kolo-text"><Pseudonim>{e.pseudonim}</Pseudonim></p>
          <p className="text-xs text-kolo-green-700 font-medium">{e.label}</p>
          {metaLines && <p className="text-xs text-kolo-muted mt-0.5">{metaLines}</p>}
        </div>
        <span className="text-xs text-kolo-muted">{new Date(e.createdAt).toLocaleDateString(intlTag(locale))}</span>
      </div>
      {!sme && <p className="text-xs text-kolo-muted">{t("programi_samo_superadmin")}</p>}
      {sme && e.type === "SKOLOVANJE" && (
        <input type="number" min={100} placeholder={t("programi_dnevni_iznos_placeholder")} aria-label={t("programi_dnevni_iznos_placeholder")} value={dailyAmount}
          onChange={(ev) => setDailyAmount(ev.target.value)}
          className={KLASE_UNOSA} />
      )}
      {sme && <div className="flex gap-2">
        <button onClick={() => onOdobri(dailyAmount ? Number(dailyAmount) : undefined)}
          disabled={e.type === "SKOLOVANJE" && !dailyAmount}
          className={klaseDugmeta() + " flex-1"}>
          {t("ped_odobri")}
        </button>
        <button onClick={onOdbij}
          className={klaseDugmeta({ varijanta: "opasno", velicina: "md" }) + " flex-1"}>
          {t("krug_odbij")}
        </button>
      </div>}
    </div>
  );
}

// ── Emisija tab ────────────────────────────────────────────────────────────────

function EmisijaTab({ onSuccess }: { onSuccess: () => void }) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [pseudonim, setPseudonim] = useState("");
  const [amountRSD, setAmountRSD] = useState("");
  // Uplatilac iz izvoda (Pravilnik o pokroviteljstvu i donacijama, čl. 3).
  const [uplatilac, setUplatilac] = useState("");
  const [straniPriliv, setStraniPriliv] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rezultat, setRezultat] = useState<{ poenEmitted: number; noviNivo: number; noviKumulativ: number } | null>(null);
  const [error, setError] = useState("");

  // Autocomplete članova (potencijalni donatori)
  const [predlozi, setPredlozi] = useState<{ id: string; pseudonim: string; status: StatusUcesnika; location?: string | null }[]>([]);
  const [showPredlozi, setShowPredlozi] = useState(false);
  const [aktivniIndex, setAktivniIndex] = useState(-1);
  const [pretragaLoading, setPretragaLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setShowPredlozi(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const traziClanove = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setPredlozi([]); setShowPredlozi(false); return; }
    debounceRef.current = setTimeout(async () => {
      setPretragaLoading(true);
      try {
        const res = await fetch(`/api/korisnici/pretraga?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setPredlozi(Array.isArray(data) ? data : []);
        setShowPredlozi(true);
        setAktivniIndex(-1);
      } finally {
        setPretragaLoading(false);
      }
    }, 250);
  }, []);

  function handlePseudonimInput(val: string) {
    setPseudonim(val);
    traziClanove(val);
  }

  function odaberiClana(k: { pseudonim: string }) {
    setPseudonim(k.pseudonim);
    setShowPredlozi(false);
    setPredlozi([]);
    setAktivniIndex(-1);
  }

  function handlePseudonimKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPredlozi || predlozi.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const novi = Math.min(aktivniIndex + 1, predlozi.length - 1);
      setAktivniIndex(novi);
      listaRef.current?.children[novi]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const novi = Math.max(aktivniIndex - 1, 0);
      setAktivniIndex(novi);
      listaRef.current?.children[novi]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      if (aktivniIndex >= 0 && aktivniIndex < predlozi.length) {
        e.preventDefault();
        odaberiClana(predlozi[aktivniIndex]);
      }
    } else if (e.key === "Escape") {
      setShowPredlozi(false);
      setAktivniIndex(-1);
    }
  }

  async function handleDonacija(e: { preventDefault: () => void }) {
    e.preventDefault();
    setError(""); setRezultat(null);

    if (!pseudonim.trim()) { setError(t("emisija_pseudonim_obavezan")); return; }
    const iznos = Number(amountRSD);
    if (!amountRSD || isNaN(iznos) || iznos <= 0) { setError(t("emisija_iznos_nevalidan")); return; }
    if (uplatilac.trim().length < 2) { setError(t("donacije_uplatilac_obavezan")); return; }

    setLoading(true);
    const res = await fetch("/api/admin/donacija", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pseudonim: pseudonim.trim(),
        amountRSD: iznos,
        uplatilac: uplatilac.trim(),
        straniPriliv,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? t("greska_generalna")); return; }
    setRezultat(data);
    setPseudonim(""); setAmountRSD(""); setUplatilac(""); setStraniPriliv(false);
    onSuccess();
  }

  return (
    <div className="space-y-5">
      {/* Forma za donaciju (na vrhu) */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 shadow-kartica">
        <h3 className="text-sm font-semibold text-kolo-muted mb-4">{t("emisija_donacija_naslov")}</h3>
        <form onSubmit={handleDonacija} noValidate className="space-y-3">
          <div ref={wrapperRef} className="relative">
            <label htmlFor="adm-emisija-pseudonim-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("emisija_pseudonim_label")}</label>
            <div className="relative">
              <input id="adm-emisija-pseudonim-label"
                type="text"
                value={pseudonim}
                onChange={(e) => handlePseudonimInput(e.target.value)}
                onKeyDown={handlePseudonimKeyDown}
                onFocus={() => { if (predlozi.length > 0) setShowPredlozi(true); }}
                placeholder={t("emisija_pseudonim_placeholder")}
                autoComplete="off"
                className={KLASE_UNOSA}
              />
              {pretragaLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-kolo-green-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {showPredlozi && predlozi.length > 0 && (
              <ul ref={listaRef} className="absolute z-30 left-0 right-0 mt-1 bg-kolo-surface border border-kolo-border rounded-kontrola shadow-lg overflow-y-auto max-h-56">
                {predlozi.map((k, i) => (
                  <li key={k.id}>
                    <button
                      type="button"
                      onMouseDown={() => odaberiClana(k)}
                      onMouseEnter={() => setAktivniIndex(i)}
                      className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${i === aktivniIndex ? "bg-kolo-green-100 text-kolo-green-800" : "hover:bg-kolo-green-50 hover:text-kolo-green-700"}`}
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-kolo-text truncate block"><Pseudonim>{k.pseudonim}</Pseudonim></span>
                        {k.location && <span className="text-xs text-kolo-muted">{k.location}</span>}
                      </div>
                      <OznakaStatusa status={k.status} className="shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showPredlozi && pseudonim.trim().length >= 2 && predlozi.length === 0 && !pretragaLoading && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-kolo-surface border border-kolo-border rounded-kontrola shadow-lg px-4 py-3 text-sm text-kolo-muted">
                {t("emisija_nema_clanova")}
              </div>
            )}
          </div>
          <div>
            <label htmlFor="adm-emisija-iznos-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("emisija_iznos_label")}</label>
            <input id="adm-emisija-iznos-label"
              type="number"
              min={1}
              step={0.01}
              value={amountRSD}
              onChange={(e) => setAmountRSD(e.target.value)}
              placeholder="5000"
              className={KLASE_UNOSA + " font-mono"}
            />
          </div>
          {/* Uplatilac iz izvoda (čl. 3) — doprinos ide onome čijim je sredstvima
              uplata izvršena, a poziv na broj je trajan broj člana. */}
          <div>
            <label htmlFor="adm-donacije-uplatilac-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("donacije_uplatilac_label")}</label>
            <input id="adm-donacije-uplatilac-label"
              type="text"
              value={uplatilac}
              onChange={(e) => setUplatilac(e.target.value)}
              placeholder={t("donacije_uplatilac_placeholder")}
              className={KLASE_UNOSA}
            />
            <p className="text-xs text-kolo-muted mt-1">{t("donacije_uplatilac_pomoc")}</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-kolo-muted cursor-pointer">
            <input type="checkbox" checked={straniPriliv} onChange={(e) => setStraniPriliv(e.target.checked)} />
            {t("donacije_strani_priliv")}
          </label>
          {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}
          {rezultat && (
            <Obavestenje vrsta="uspeh" naslov={t("emisija_evidentirana")}>
              {rezultat.poenEmitted > 0 ? (
                <p>{t("emisija_emitovano", { poen: rezultat.poenEmitted.toLocaleString(intlTag(locale)), nivo: rezultat.noviNivo })}</p>
              ) : (
                <p className="text-kolo-muted">{t("emisija_prag_nedostignut")}</p>
              )}
              <p className="text-xs">{t("emisija_kumulativ", { val: rezultat.noviKumulativ.toLocaleString(intlTag(locale)) })}</p>
            </Obavestenje>
          )}
          <button
            type="submit"
            disabled={loading}
            className={klaseDugmeta({ varijanta: "primarno", velicina: "lg" }) + " w-full"}
          >
            {loading ? t("emisija_evidentiram") : t("emisija_btn")}
          </button>
        </form>
      </div>

      {/* Nivoi donacija i koeficijent — cita se iz RANG_TABELA, da se ne prepisuje rucno */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
        <div className="px-4 py-3 border-b border-kolo-border">
          <h3 className="text-sm font-semibold text-kolo-muted">{t("emisija_pragovi_naslov")}</h3>
          <p className="text-xs text-kolo-muted mt-0.5">{t("emisija_pragovi_sub")}</p>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[22rem]">
          <thead>
            <tr className="bg-kolo-bg">
              <th className="px-4 py-2 text-center text-kolo-muted font-medium">{t("emisija_tbl_nivo")}</th>
              <th className="px-4 py-2 text-left text-kolo-muted font-medium">{t("emisija_tbl_kumulativ")}</th>
              <th className="px-4 py-2 text-right text-kolo-muted font-medium">{t("emisija_tbl_bonus")}</th>
            </tr>
          </thead>
          <tbody>
            {RANG_TABELA.map((r) => (
              <tr key={r.nivo} className="border-t border-kolo-border">
                <td className="px-4 py-2 text-center font-medium text-kolo-text">{r.nivo}</td>
                <td className="px-4 py-2 text-kolo-muted">
                  {r.do === 0
                    ? t("emisija_tbl_nivo1")
                    : `${r.do.toLocaleString(intlTag(locale))} RSD`}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-kolo-green-700">
                  {r.kurs.toFixed(2).replace(".", ",")}×
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────

// ── Donacije tab ─────────────────────────────────────────────────────────────

function DonacijeTab({ donacije, onDone, pocetniNacin = "izvod" }: { donacije: DonacijaItem[]; onDone: () => void; pocetniNacin?: "izvod" | "pseudonim" }) {
  // Dve forme za istu radnju (POST /api/admin/donacija) bile su u dva taba
  // (Donacije, Emisija); sada su jedna, sa izborom načina. `?tab=emisija` i dalje
  // radi i otvara drugi način.
  const [nacin, setNacin] = useState<"izvod" | "pseudonim">(pocetniNacin);
  const locale = useLocale();
  const t = useTranslations("admin");
  const [loading, setLoading] = useState<string | null>(null);
  const [poruke, setPoruke] = useState<Record<string, { text: string; ok: boolean }>>({});
  const [duplikati, setDuplikati] = useState<Record<string, boolean>>({});
  const [izvodDuplikat, setIzvodDuplikat] = useState(false);
  // Iznos za potvrdu — prefill iz najave, admin koriguje prema stvarnom prilivu
  // iz izvoda (IPS/uplatnica mogu stići sa drugačijim iznosom od najavljenog).
  const [iznosi, setIznosi] = useState<Record<string, string>>({});

  // Evidentiranje uplate iz izvoda (bez najave) — po pozivu na broj (model 97).
  const [izvodPnb, setIzvodPnb] = useState("");
  const [izvodIznos, setIzvodIznos] = useState("");
  const [izvodAnonimna, setIzvodAnonimna] = useState(false);
  const [izvodUplatilac, setIzvodUplatilac] = useState("");
  const [izvodStrani, setIzvodStrani] = useState(false);
  // Uplatilac i oznaka stranog priliva po redu (potvrda najavljene donacije).
  const [uplatioci, setUplatioci] = useState<Record<string, string>>({});
  const [strani, setStrani] = useState<Record<string, boolean>>({});
  const [izvodLoading, setIzvodLoading] = useState(false);
  const [izvodPoruka, setIzvodPoruka] = useState<{ text: string; ok: boolean } | null>(null);

  async function potvrdi(d: DonacijaItem, potvrdiDuplikat = false) {
    const iznos = Math.round(Number(iznosi[d.id] ?? d.amountRSD));
    if (!Number.isFinite(iznos) || iznos <= 0) {
      setPoruke((p) => ({ ...p, [d.id]: { text: t("emisija_iznos_nevalidan"), ok: false } }));
      return;
    }
    const up = (uplatioci[d.id] ?? "").trim();
    if (up.length < 2) {
      setPoruke((p) => ({ ...p, [d.id]: { text: t("donacije_uplatilac_obavezan"), ok: false } }));
      return;
    }
    setLoading(d.id);
    const res = await fetch("/api/admin/donacija", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donationId: d.id,
        amountRSD: iznos,
        uplatilac: up,
        straniPriliv: strani[d.id] === true,
        potvrdiDuplikat,
      }),
    });
    const data = await res.json();
    setLoading(null);
    // Poklapanje uplatioca sa drugim nalogom (mera C-1) ne blokira samo od sebe —
    // traži izričitu ljudsku odluku, pa se nudi dugme za ponovnu potvrdu.
    setDuplikati((p) => ({ ...p, [d.id]: res.status === 409 && data.duplikat === true }));
    setPoruke((p) => ({ ...p, [d.id]: { text: res.ok ? t("donacije_potvrdjena_msg", { poen: data.poenEmitted?.toLocaleString(intlTag(locale)) }) : (data.error ?? t("greska_generalna")), ok: res.ok } }));
    if (res.ok) setTimeout(onDone, 1200);
  }

  async function evidentirajIzIzvoda(e: { preventDefault: () => void }, potvrdiDuplikat = false) {
    e.preventDefault();
    setIzvodPoruka(null);
    const iznos = Math.round(Number(izvodIznos));
    if (!izvodPnb.trim() || !Number.isFinite(iznos) || iznos <= 0) {
      setIzvodPoruka({ text: t("emisija_iznos_nevalidan"), ok: false });
      return;
    }
    if (izvodUplatilac.trim().length < 2) {
      setIzvodPoruka({ text: t("donacije_uplatilac_obavezan"), ok: false });
      return;
    }
    setIzvodLoading(true);
    const res = await fetch("/api/admin/donacija", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pozivNaBroj: izvodPnb.trim(),
        amountRSD: iznos,
        javno: !izvodAnonimna,
        uplatilac: izvodUplatilac.trim(),
        straniPriliv: izvodStrani,
        potvrdiDuplikat,
      }),
    });
    const data = await res.json();
    setIzvodLoading(false);
    setIzvodDuplikat(res.status === 409 && data.duplikat === true);
    setIzvodPoruka({
      text: res.ok
        ? t("donacije_potvrdjena_msg", { poen: data.poenEmitted?.toLocaleString(intlTag(locale)) })
        : (data.error ?? t("greska_generalna")),
      ok: res.ok,
    });
    if (res.ok) {
      setIzvodPnb(""); setIzvodIznos(""); setIzvodAnonimna(false);
      setIzvodUplatilac(""); setIzvodStrani(false);
      setTimeout(onDone, 1200);
    }
  }

  const nacinLabel = (nacin: string) =>
    nacin === "KARTICA" ? t("donacije_nacin_kartica")
    : nacin === "IPS" ? t("donacije_nacin_ips")
    : t("donacije_nacin_rucno");

  return (
    <div className="space-y-3">
      <Segmenti
        oznaka={t("donacije_nacin")}
        vrednost={nacin}
        onPromena={setNacin}
        opcije={[
          { vrednost: "izvod", oznaka: t("donacije_nacin_izvod") },
          { vrednost: "pseudonim", oznaka: t("donacije_nacin_pseudonim") },
        ]}
      />
      {nacin === "pseudonim" ? (
        <EmisijaTab onSuccess={onDone} />
      ) : (
      /* Uplata iz izvoda — poziv na broj identifikuje člana */
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 shadow-kartica">
        <h3 className="text-sm font-semibold text-kolo-muted mb-1">{t("donacije_izvod_naslov")}</h3>
        <p className="text-xs text-kolo-muted mb-3">{t("donacije_izvod_opis")}</p>
        <form onSubmit={evidentirajIzIzvoda} noValidate className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={izvodPnb}
              onChange={(e) => setIzvodPnb(e.target.value)}
              placeholder={t("donacije_izvod_pnb_placeholder")} aria-label={t("donacije_izvod_pnb_placeholder")}
              className="flex-1 px-3 py-2.5 rounded-kontrola border border-kolo-border text-sm font-mono transition-colors bg-kolo-surface outline-none focus:border-kolo-green-700 min-h-10"
            />
            <div className="relative sm:w-40">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={izvodIznos}
                onChange={(e) => setIzvodIznos(e.target.value)}
                placeholder={t("donacije_izvod_iznos_placeholder")} aria-label={t("donacije_izvod_iznos_placeholder")}
                className={KLASE_UNOSA + " pl-3 pr-12"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-kolo-muted">RSD</span>
            </div>
            <button type="submit" disabled={izvodLoading}
              className={klaseDugmeta()}>
              {izvodLoading ? t("donacije_potvrdjujem") : t("donacije_izvod_evidentiraj")}
            </button>
          </div>
          <div>
            <input
              type="text"
              value={izvodUplatilac}
              onChange={(e) => setIzvodUplatilac(e.target.value)}
              placeholder={t("donacije_uplatilac_placeholder")} aria-label={t("donacije_uplatilac_placeholder")}
              className={KLASE_UNOSA}
            />
            <p className="text-xs text-kolo-muted mt-1">{t("donacije_uplatilac_pomoc")}</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-kolo-muted cursor-pointer">
            <input type="checkbox" checked={izvodAnonimna} onChange={(e) => setIzvodAnonimna(e.target.checked)} />
            {t("donacije_izvod_anonimna")}
          </label>
          <label className="flex items-center gap-2 text-xs text-kolo-muted cursor-pointer">
            <input type="checkbox" checked={izvodStrani} onChange={(e) => setIzvodStrani(e.target.checked)} />
            {t("donacije_strani_priliv")}
          </label>
          {izvodPoruka && <Obavestenje vrsta={izvodPoruka.ok ? "uspeh" : "greska"}>{izvodPoruka.text}</Obavestenje>}
          {izvodDuplikat && (
            <button type="button" onClick={(e) => evidentirajIzIzvoda(e, true)} disabled={izvodLoading}
              className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
              {t("donacije_duplikat_ipak")}
            </button>
          )}
        </form>
      </div>
      )}

      {donacije.length === 0 ? (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica"><PraznoStanje naslov={t("donacije_nema")} /></div>
      ) : donacije.map((d) => {
        const poruka = poruke[d.id];
        return (
          <div key={d.id} className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 space-y-3 shadow-kartica">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-kolo-text text-sm">{d.pseudonim}</p>
                <p className="text-xs text-kolo-muted mt-0.5">
                  {nacinLabel(d.nacinUplate)}
                  {d.referenceNumber ? ` · ${d.referenceNumber}` : ""}
                  {" · "}{new Date(d.createdAt).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                {d.status === "NAPLACENO" && (
                  <p className="text-xs font-semibold text-kolo-gold-700 mt-1">{t("donacije_status_naplaceno")}</p>
                )}
                <p className="text-xs text-kolo-muted mt-1">{t("donacije_kumulativ", { val: d.cumulativeRSD.toLocaleString(intlTag(locale)) })}</p>
              </div>
              <div className="shrink-0 text-right">
                <div className="relative w-32">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={iznosi[d.id] ?? String(d.amountRSD)}
                    onChange={(e) => setIznosi((p) => ({ ...p, [d.id]: e.target.value }))}
                    title={t("donacije_iznos_korekcija")}
                    aria-label={t("donacije_iznos_korekcija")}
                    className={KLASE_UNOSA + " pl-2 pr-10 font-bold text-right"}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-kolo-muted">RSD</span>
                </div>
                <button onClick={() => potvrdi(d)} disabled={loading === d.id}
                  className={klaseDugmeta({ varijanta: "primarno", velicina: "sm" }) + " mt-2"}>
                  {loading === d.id ? t("donacije_potvrdjujem") : t("donacije_potvrdi")}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={uplatioci[d.id] ?? ""}
                onChange={(e) => setUplatioci((p) => ({ ...p, [d.id]: e.target.value }))}
                placeholder={t("donacije_uplatilac_placeholder")} aria-label={t("donacije_uplatilac_placeholder")}
                className={KLASE_UNOSA}
              />
              <p className="text-xs text-kolo-muted">
                {t("donacije_uplatilac_pomoc")}
                {" "}
                <span className="font-semibold text-kolo-text">
                  {t("donacije_donator_nalog", { ime: d.donatorIme ?? "—" })}
                </span>
              </p>
              <label className="flex items-center gap-2 text-xs text-kolo-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={strani[d.id] === true}
                  onChange={(e) => setStrani((p) => ({ ...p, [d.id]: e.target.checked }))}
                />
                {t("donacije_strani_priliv")}
              </label>
            </div>
            {poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
            {duplikati[d.id] && (
              <button onClick={() => potvrdi(d, true)} disabled={loading === d.id}
                className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}>
                {t("donacije_duplikat_ipak")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Prigovori tab ────────────────────────────────────────────────────────────

const prigovorTipLabel = (t: ReturnType<typeof useTranslations<"admin">>): Record<string, string> => ({
  RAZMENA: t("prigovori_tip_razmena"),
  NABAVKA: t("prigovori_tip_nabavka"),
  VERIFIKACIJA: t("prigovori_tip_verifikacija"),
  SUSPENZIJA: t("prigovori_tip_suspenzija"),
  PROGRAM: t("prigovori_tip_program"),
  OGLAS: t("prigovori_tip_oglas"),
  PODACI: t("prigovori_tip_podaci"),
  POTVRDA: t("prigovori_tip_potvrda"),
  RODITELJSTVO: t("prigovori_tip_roditeljstvo"),
  GAZDINSTVO: t("prigovori_tip_gazdinstvo"),
  OSTALO: t("prigovori_tip_ostalo"),
});

function PrigovoriTab({ prigovori, onDone }: { prigovori: PrigovorItem[]; onDone: () => void }) {
  const t = useTranslations("admin");
  if (prigovori.length === 0) {
    return <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica"><PraznoStanje naslov={t("prigovori_nema")} /></div>;
  }
  return (
    <div className="space-y-3">
      {prigovori.map((p) => <PrigovorKartica key={p.id} p={p} onDone={onDone} />)}
    </div>
  );
}

function PrigovorKartica({ p, onDone }: { p: PrigovorItem; onDone: () => void }) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [odgovor, setOdgovor] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);

  // `ispravi` uz usvojen prigovor na deo iz nabavke otklanja poništenje zapisa
  // (nabavke čl. 30a st. 5). Prigovor na PREPIS se ovde NE rešava dugmetom —
  // o njemu se odlučuje u tabu Razmene, koji zatvara i prigovor uz sebe.
  async function posalji(status: "RESENO" | "ODBIJENO" | "U_OBRADI", ispravi = false) {
    setLoading(ispravi ? "ISPRAVKA" : status);
    const res = await fetch(`/api/admin/prigovori/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, odgovor: odgovor.trim(), ispravi }),
    });
    const data = await res.json();
    setLoading(null);
    if (res.ok) {
      setPoruka({ text: t("prigovori_poslato_msg"), ok: true });
      setTimeout(onDone, 1200);
    } else {
      setPoruka({ text: data.error ?? t("greska_generalna"), ok: false });
    }
  }

  return (
    <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 space-y-3 shadow-kartica">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-kolo-info-light text-kolo-info">{prigovorTipLabel(t)[p.tipOdluke] ?? p.tipOdluke}</span>
          {p.status === "U_OBRADI" && <span className="text-xs px-2 py-0.5 rounded bg-kolo-gold-100 text-kolo-gold-700">{t("prigovori_status_u_obradi")}</span>}
        </div>
        <p className="font-semibold text-kolo-text text-sm">{p.pseudonim}</p>
        <p className="text-sm text-kolo-muted mt-1 whitespace-pre-wrap">{p.opis}</p>
        <p className="text-xs text-kolo-muted mt-1">{new Date(p.createdAt).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "long", year: "numeric" })}</p>
      </div>
      <textarea value={odgovor} onChange={(e) => setOdgovor(e.target.value)} rows={2}
        placeholder={t("prigovori_odgovor_placeholder")} aria-label={t("prigovori_odgovor_placeholder")}
        className={KLASE_UNOSA + " resize-none"} />
      {!poruka && p.tipOdluke === "NABAVKA" && p.predmetId && (
        <button onClick={() => posalji("RESENO", true)} disabled={loading !== null || odgovor.trim().length < 10}
          className={klaseDugmeta({ punaSirina: true })}>
          {loading === "ISPRAVKA" ? "..." : t("prigovori_ispravi")}
        </button>
      )}
      {!poruka && (
        <div className="flex gap-2">
          <button onClick={() => posalji("RESENO")} disabled={loading !== null}
            className={klaseDugmeta() + " flex-1"}>
            {loading === "RESENO" ? "..." : t("prigovori_resi")}
          </button>
          <button onClick={() => posalji("ODBIJENO")} disabled={loading !== null}
            className={klaseDugmeta({ varijanta: "opasno", velicina: "md" }) + " flex-1"}>
            {loading === "ODBIJENO" ? "..." : t("krug_odbij")}
          </button>
          {p.status !== "U_OBRADI" && (
            <button onClick={() => posalji("U_OBRADI")} disabled={loading !== null}
              className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}>
              {loading === "U_OBRADI" ? "..." : t("prigovori_u_obradu")}
            </button>
          )}
        </div>
      )}
      {poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
    </div>
  );
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────

function DashboardTab({ data, onRefresh }: { data: DashboardData; onRefresh: () => void }) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [zeroSum, setZeroSum] = useState<{ zbir: number; ok: boolean } | null>(null);
  const [loadingZS, setLoadingZS] = useState(false);

  async function provjeriZeroSum() {
    setLoadingZS(true);
    const res = await fetch("/api/admin/zero-sum");
    if (res.ok) setZeroSum(await res.json());
    setLoadingZS(false);
  }

  return (
    <div className="space-y-5">
      {/* Stanje sistema — samo punoletni nalozi. 🔴 Deca su u sopstvenom odeljku
          ispod i ne mešaju se sa pokazateljima sistema (dete nikad nije korisnik). */}
      <p className="text-sm font-semibold text-kolo-muted">{t("dashboard_sistem_naslov")}</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {([
          [t("dashboard_korisnici_ukupno"), data.korisnici.punoletni.ukupno],
          [t("dashboard_registrovani"), data.korisnici.punoletni.registrovani],
          [t("dashboard_aktivni"), data.korisnici.aktivni],
          [t("dashboard_brisani"), data.korisnici.punoletni.brisani],
          [t("dashboard_suspendovani"), data.korisnici.punoletni.suspendovani],
        ] as [string, number][]).map(([labela, broj]) => (
          <StatKartica key={labela} oznaka={labela} vrednost={broj.toLocaleString(intlTag(locale))} />
        ))}
      </div>
      {/* Učesnici po statusu (set 4.8.2): naziv statusa crta samo `OznakaStatusa`.
          Osnivači su početni čuvari Kola, pa su u kartici čuvara (broj osnivača u
          podnaslovu); u podacima ostaju dva zasebna statusa. */}
      {data.statusi && (
        <>
          <p className="text-sm font-semibold text-kolo-muted">{t("dashboard_status_naslov")}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ["KORISNIK", data.statusi.korisnici],
              ["CLAN_BEZ_POTVRDE", data.statusi.bezPotvrde],
              ["CLAN_KOLA", data.statusi.clanoviKola],
            ] as [StatusUcesnika, number][]).map(([s, broj]) => (
              <StatKartica key={s} oznaka={<OznakaStatusa status={s} />} vrednost={broj.toLocaleString(intlTag(locale))} />
            ))}
            <StatKartica
              oznaka={<OznakaStatusa status="CUVAR_KOLA" />}
              vrednost={(data.statusi.cuvari + data.statusi.osnivaci).toLocaleString(intlTag(locale))}
              podnaslov={t("dashboard_status_cuvari_osnivaci", { broj: data.statusi.osnivaci.toLocaleString(intlTag(locale)) })}
            />
          </div>
          <section className="rounded-kartica border border-kolo-border bg-kolo-bg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-kolo-muted">{t("dashboard_status_deca_naslov")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatKartica oznaka={t("dashboard_deca_ukupno")} vrednost={data.korisnici.deca.toLocaleString(intlTag(locale))} />
              {([
                ["DETE_NA_CEKANJU", data.statusi.deca.naCekanju],
                ["DETE_SA_RODITELJEM", data.statusi.deca.saRoditeljem],
                ["DETE_KOLA", data.statusi.deca.kola],
              ] as [StatusUcesnika, number][]).map(([s, broj]) => (
                <StatKartica key={s} oznaka={<OznakaStatusa status={s} />} vrednost={broj.toLocaleString(intlTag(locale))} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Finansije */}
      <div className="grid grid-cols-2 gap-3">
        <StatKartica oznaka={t("dashboard_opticaj")} vrednost={data.finansije.opticaj.toLocaleString(intlTag(locale))} />
        <StatKartica oznaka={t("dashboard_ukupno_transakcija")} vrednost={data.ukupnoTransakcija.toLocaleString(intlTag(locale))} />
      </div>

      {/* ZRNO */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatKartica oznaka={t("dashboard_zrno_kod_korisnika")} vrednost={data.zrno.kodKorisnika.toLocaleString(intlTag(locale))} />
        <StatKartica oznaka={t("dashboard_zrno_u_protokolu")} vrednost={data.zrno.uProtokolu.toLocaleString(intlTag(locale))} />
        <div className="col-span-2 md:col-span-1">
          <StatKartica oznaka={t("dashboard_ukupno_zrna")} vrednost={data.zrno.ukupno.toLocaleString(intlTag(locale))} />
        </div>
      </div>

      {/* Zero-sum provjera */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border px-5 py-4 flex items-center justify-between gap-4 shadow-kartica">
        <div>
          <p className="text-sm font-semibold text-kolo-muted">{t("dashboard_zero_sum_naslov")}</p>
          {zeroSum && (
            <p className={`text-sm mt-0.5 ${zeroSum.ok ? "text-kolo-green-700" : "text-kolo-danger"}`}>
              {t("dashboard_zero_sum_zbir", { zbir: zeroSum.zbir.toLocaleString(intlTag(locale)), status: zeroSum.ok ? "✓ OK" : "✗ GREŠKA" })}
            </p>
          )}
        </div>
        <button onClick={provjeriZeroSum} disabled={loadingZS}
          className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" }) + " shrink-0"}>
          {loadingZS ? t("dashboard_provjerava") : t("dashboard_provjeri")}
        </button>
      </div>

      <button onClick={onRefresh}
        className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" }) + " w-full"}>
        {t("dashboard_osvjezi")}
      </button>
    </div>
  );
}

// ── Korisnici tab ─────────────────────────────────────────────────────────────

function KorisniciTab({ users, onDone, viewerJeSuperadmin, viewerId }: { users: KorisnikInfo[]; onDone: () => void; viewerJeSuperadmin: boolean; viewerId: string }) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const { dijalog, potvrdi, unesi, obavesti } = useDijalog();
  const [filter, setFilter] = useState("");
  // Filter po statusu. Nazive statusa ispisuje samo `OznakaStatusa`.
  const [poStatusu, setPoStatusu] = useState<"svi" | "KORISNIK" | "CLAN_BEZ_POTVRDE" | "CLAN_KOLA" | "deca" | "suspendovani">("svi");
  const [otvoren, setOtvoren] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [izmeniKorisnik, setIzmeniKorisnik] = useState<KorisnikInfo | null>(null);
  const [uDete, setUDete] = useState<KorisnikInfo | null>(null);

  const q = filter.toLowerCase().trim();
  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const tekst =
          u.pseudonim.toLowerCase().includes(q) ||
          (u.location ?? "").toLowerCase().includes(q) ||
          (u.telefon ?? "").toLowerCase().includes(q);
        if (!tekst) return false;
        const s = u.statusUcesnika;
        switch (poStatusu) {
          // 🔴 Deca su zaseban spisak: „Svi" i „Suspendovani" su samo punoletni nalozi.
          case "svi": return !s.startsWith("DETE_");
          case "suspendovani": return u.status === "SUSPENDED" && !s.startsWith("DETE_");
          case "deca": return s.startsWith("DETE_");
          case "CLAN_KOLA": return s === "CLAN_KOLA" || s === "CUVAR_KOLA" || s === "OSNIVAC";
          default: return s === poStatusu;
        }
      }),
    [users, q, poStatusu]
  );
  const anl = useMemo(() => adminNivoLabel(t), [t]);
  const sl = useMemo(() => statusLabel(t), [t]);

  async function akcija(userId: string, tip: "suspenduj" | "aktiviraj" | "iskljuci" | "lazni-verifikator") {
    if (tip === "iskljuci" && !(await potvrdi({ poruka: t("korisnici_iskljuci_confirm"), opasno: true, dugme: t("korisnici_iskljuci") }))) return;
    if (tip === "lazni-verifikator" && !(await potvrdi({ poruka: t("korisnici_lazni_confirm"), opasno: true, dugme: t("korisnici_lazni_verifikator") }))) return;
    let razlog: string | null = null;
    if (tip === "suspenduj") {
      razlog = await unesi({ poruka: t("korisnici_suspenzija_razlog_prompt"), opasno: true, dugme: t("korisnici_suspenduj") });
      if (razlog === null) return;
    }
    setLoadingId(userId);
    const res = await fetch(`/api/admin/korisnici/${userId}/${tip}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: razlog !== null ? JSON.stringify({ razlog }) : "{}",
    });
    const d = await res.json().catch(() => ({}));
    setLoadingId(null);
    if (res.ok) {
      if (tip === "lazni-verifikator") await obavesti(t("korisnici_ponisteno_msg", { count: d.poistenoVerifikacija ?? 0 }));
      onDone();
    } else {
      await obavesti(d.error ?? t("greska_generalna"));
    }
  }

  // Vraća nalog na dan registracije — za probu kako platforma izgleda novom
  // čoveku, bez otvaranja novog naloga. Nepovratno, pa se pseudonim otkuca:
  // klik ne sme da promaši red u spisku.
  async function resetujNalog(u: KorisnikInfo) {
    const upisano = await unesi({ poruka: t("korisnici_reset_prompt", { pseudonim: u.pseudonim }), oznaka: t("korisnici_reset_oznaka"), opasno: true, dugme: t("korisnici_reset") });
    if (upisano === null) return;
    setLoadingId(u.id);
    const res = await fetch(`/api/admin/korisnici/${u.id}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudonim: upisano }),
    });
    const d = await res.json().catch(() => ({}));
    setLoadingId(null);
    if (res.ok) {
      await obavesti(
        t("korisnici_reset_gotovo", {
          pseudonim: d.pseudonim ?? u.pseudonim,
          poen: (d.poenVracenProtokolu ?? 0).toLocaleString(intlTag(locale)),
          potvrde: d.ponistenoVerifikacija ?? 0,
          oglasi: d.obrisanoOglasa ?? 0,
        }),
      );
      onDone();
    } else {
      await obavesti(d.error ?? t("greska_generalna"));
    }
  }

  // 🔴 Svaka dodela uloge traži potvrdu — i ADMIN (pre je bila jednim dodirom
  // na pilulu od ~22 px; potvrdu je tražio samo SUPERADMIN).
  async function postaviAdminRolu(userId: string, nivo: string) {
    // Zadružni admin (U2) se vezuje za jednu upisanu zadrugu — bira se po nazivu.
    let zadrugaId: string | undefined;
    if (nivo === "ZADRUGA") {
      const r = await fetch("/api/admin/zadruge", { cache: "no-store" });
      const zadruge: { id: string; naziv: string; prestanakAt: string | null }[] =
        r.ok ? ((await r.json()).zadruge ?? []).filter((z: { prestanakAt: string | null }) => !z.prestanakAt) : [];
      if (zadruge.length === 0) {
        await obavesti(t("korisnici_zadruga_nema"));
        return;
      }
      const naziv = await unesi({
        poruka: t("korisnici_zadruga_izbor", { spisak: zadruge.map((z) => z.naziv).join(", ") }),
        dugme: t("admin_nivo_zadruga"),
      });
      if (!naziv?.trim()) return;
      const z = zadruge.find((x) => x.naziv.trim().toLowerCase() === naziv.trim().toLowerCase());
      if (!z) {
        await obavesti(t("korisnici_zadruga_nepoznata"));
        return;
      }
      zadrugaId = z.id;
    }
    const poruka =
      nivo === "SUPERADMIN" ? t("korisnici_superadmin_confirm")
      : nivo === "ADMIN" ? t("korisnici_admin_confirm")
      : nivo === "ZADRUGA" ? t("korisnici_zadruga_confirm")
      : t("korisnici_bez_uloge_confirm");
    if (!(await potvrdi({ poruka, opasno: nivo !== "NONE" }))) return;
    setLoadingId(userId);
    const res = await fetch(`/api/admin/korisnici/${userId}/admin-rola`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nivo, zadrugaId }),
    });
    const d = await res.json().catch(() => ({}));
    setLoadingId(null);
    if (res.ok) onDone();
    else await obavesti(d.error ?? t("greska_generalna"));
  }

  const bezopasno = klaseDugmeta({ varijanta: "sekundarno" });
  const opasno = klaseDugmeta({ varijanta: "opasno" });

  const FILTERI = [
    { kljuc: "svi" as const, oznaka: <>{t("korisnici_filter_svi")}</> },
    { kljuc: "KORISNIK" as const, oznaka: <OznakaStatusa status="KORISNIK" /> },
    { kljuc: "CLAN_BEZ_POTVRDE" as const, oznaka: <OznakaStatusa status="CLAN_BEZ_POTVRDE" /> },
    { kljuc: "CLAN_KOLA" as const, oznaka: <OznakaStatusa status="CLAN_KOLA" /> },
    { kljuc: "suspendovani" as const, oznaka: <>{t("korisnici_status_suspendovan")}</> },
    { kljuc: "deca" as const, oznaka: <>{t("korisnici_filter_deca")}</> },
  ];

  return (
    <div className="space-y-4">
      {dijalog}
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={t("korisnici_pretrazi_placeholder")}
        aria-label={t("korisnici_pretrazi_placeholder")}
        className={KLASE_UNOSA}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("korisnici_filter")}>
        {FILTERI.map((f) => (
          <Fragment key={f.kljuc}>
            {f.kljuc === "deca" && <span aria-hidden="true" className="mx-1 w-px self-stretch bg-kolo-border" />}
            <button
              type="button"
              aria-pressed={poStatusu === f.kljuc}
              onClick={() => setPoStatusu(f.kljuc)}
              className={`inline-flex min-h-10 items-center rounded-kontrola border px-3 text-sm font-medium transition-colors ${
                poStatusu === f.kljuc ? "border-kolo-green-700 ring-2 ring-kolo-green-700/30 bg-kolo-surface" : "border-kolo-border bg-kolo-surface text-kolo-muted hover:border-kolo-green-500"
              }`}
            >
              {f.oznaka}
            </button>
          </Fragment>
        ))}
      </div>

      <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
        {filtered.length === 0 ? (
          <PraznoStanje naslov={t("korisnici_nema")} />
        ) : (
          filtered.map((u, i) => {
            const imaRadnje = !jeSuperadmin(u) || (viewerJeSuperadmin && u.id !== viewerId);
            const otvoreno = otvoren === u.id;
            return (
            <div key={u.id} className={`px-4 py-3 ${i < filtered.length - 1 ? "border-b border-kolo-border" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-kolo-text break-all"><Pseudonim>{u.pseudonim}</Pseudonim></span>
                    {u.status !== "ACTIVE" && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBoja[u.status] ?? "bg-kolo-bg text-kolo-muted"}`}>
                        {sl[u.status] ?? u.status}
                      </span>
                    )}
                    <OznakaStatusa status={u.statusUcesnika} />
                    {u.admin !== "NONE" && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-kolo-green-700 text-white">{anl[u.admin]}</span>
                    )}
                  </div>
                  <p className="text-xs text-kolo-muted mt-0.5">
                    {u.balance.toLocaleString(intlTag(locale))} P
                    {u.location && <span> · {u.location}</span>}
                    {u.suspendedReason && <span className="ml-1 text-kolo-gold-700">— {u.suspendedReason}</span>}
                  </p>
                </div>
                {imaRadnje && (
                  <button
                    type="button"
                    onClick={() => setOtvoren(otvoreno ? null : u.id)}
                    aria-expanded={otvoreno}
                    className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" }) + " shrink-0"}
                  >
                    {t("korisnici_radnje")} {otvoreno ? "▴" : "▾"}
                  </button>
                )}
              </div>

              {/* Radnje su sklopljene: bezopasne gore, opasne ispod crte. Ranije je
                  svaki red imao šest otvorenih dugmadi, „Izmeni" tik uz „Isključi". */}
              {otvoreno && (
                <div className="mt-3 space-y-3 rounded-kontrola bg-kolo-bg p-4">
                  {(u.email || u.telefon) && (
                    <div className="space-y-0.5 text-xs text-kolo-muted">
                      {u.email && <p className="break-all">✉ {u.email}</p>}
                      {u.telefon && (
                        <p>☎ <a href={`tel:${u.telefon.replace(/[^+\d]/g, "")}`} className="hover:text-kolo-green-700">{u.telefon}</a></p>
                      )}
                    </div>
                  )}
                  {!jeSuperadmin(u) && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setIzmeniKorisnik(u)} disabled={loadingId === u.id} className={bezopasno}>
                        {t("korisnici_izmeni")}
                      </button>
                      {u.status === "SUSPENDED" && (
                        <button onClick={() => akcija(u.id, "aktiviraj")} disabled={loadingId === u.id} className={bezopasno}>
                          {t("korisnici_aktiviraj")}
                        </button>
                      )}
                      {/* Ispravka za dete koje se registrovalo kroz punoletni obrazac:
                          nalog se prevodi u maloletni i dobija roditelja. Maloletnom
                          nalogu se ne nudi — prevođenja unazad nema. */}
                      {viewerJeSuperadmin && u.id !== viewerId && u.admin === "NONE"
                        && u.status !== "EXCLUDED" && !u.maloletan && (
                        <button onClick={() => setUDete(u)} disabled={loadingId === u.id} className={bezopasno}>
                          {t("korisnici_u_dete")}
                        </button>
                      )}
                    </div>
                  )}
                  {viewerJeSuperadmin && u.id !== viewerId && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-kolo-muted">{t("korisnici_admin_rola")}</span>
                      {ADMIN_NIVOI.map((nivo) => (
                        <button
                          key={nivo}
                          onClick={() => postaviAdminRolu(u.id, nivo)}
                          disabled={loadingId === u.id || u.admin === nivo}
                          aria-pressed={u.admin === nivo}
                          className={`min-h-9 px-3 rounded-kontrola text-sm font-semibold transition-colors ${
                            u.admin === nivo
                              ? "bg-kolo-green-700 text-white"
                              : "bg-kolo-surface border border-kolo-border text-kolo-muted hover:bg-kolo-bg disabled:opacity-60"
                          }`}
                        >
                          {anl[nivo]}
                        </button>
                      ))}
                    </div>
                  )}
                  {!jeSuperadmin(u) && (
                    <div className="border-t border-kolo-border pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-kolo-muted">{t("korisnici_opasne")}</p>
                      <div className="flex flex-wrap gap-2">
                        {u.status === "ACTIVE" && (
                          <button onClick={() => akcija(u.id, "suspenduj")} disabled={loadingId === u.id} className={opasno}>
                            {t("korisnici_suspenduj")}
                          </button>
                        )}
                        {u.status !== "EXCLUDED" && (
                          <button onClick={() => akcija(u.id, "iskljuci")} disabled={loadingId === u.id} className={opasno}>
                            {t("korisnici_iskljuci")}
                          </button>
                        )}
                        {u.verified && u.status !== "EXCLUDED" && (
                          <button onClick={() => akcija(u.id, "lazni-verifikator")} disabled={loadingId === u.id} className={opasno}>
                            {t("korisnici_lazni_verifikator")}
                          </button>
                        )}
                        {/* Vraćanje naloga na dan registracije — samo superadmin, i
                            samo za tuđ nalog (sopstveni bi se resetovao pod nogama). */}
                        {viewerJeSuperadmin && u.id !== viewerId && u.admin === "NONE" && u.status !== "EXCLUDED" && (
                          <button onClick={() => resetujNalog(u)} disabled={loadingId === u.id} className={opasno}>
                            {t("korisnici_reset")}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })
        )}
      </div>

      {izmeniKorisnik && (
        <IzmeniKorisnikaForma
          korisnik={izmeniKorisnik}
          onClose={() => setIzmeniKorisnik(null)}
          onDone={() => { setIzmeniKorisnik(null); onDone(); }}
        />
      )}

      {uDete && (
        <PrevodUDeteForma
          korisnik={uDete}
          onClose={() => setUDete(null)}
          onDone={() => { setUDete(null); onDone(); }}
        />
      )}
    </div>
  );
}

/**
 * Prevođenje punoletnog naloga u nalog maloletnog korisnika, uz određivanje
 * roditelja (`POST /api/admin/korisnici/[id]/u-dete`).
 *
 * Roditelj se BIRA IZ PRETRAGE, ne kuca. Kucanje je tražilo tačno poklapanje sa
 * aktuelnim pseudonimom, pa nalog čiji je pseudonim u međuvremenu promenjen nije
 * mogao da se nađe po imenu koga se čovek seća. Admin pretraga gleda i napuštena
 * imena i vraća i sam nalog onoga ko pretražuje — roditelj svog deteta je čest
 * slučaj, a opšta pretraga članova sebe namerno izostavlja.
 *
 * Datum rođenja ide kroz `type="date"` (kalendar), ne kroz otkucan tekst.
 */
function PrevodUDeteForma({ korisnik, onClose, onDone }: {
  korisnik: KorisnikInfo;
  onClose: () => void;
  onDone: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [upit, setUpit] = useState("");
  const [rezultati, setRezultati] = useState<{ id: string; pseudonim: string; verified: boolean; indeksStvarnosti: number; staroIme: string | null }[]>([]);
  const [roditelj, setRoditelj] = useState<{ id: string; pseudonim: string } | null>(null);
  const [datumRodjenja, setDatumRodjenja] = useState("");
  const [razumem, setRazumem] = useState(false);
  const [loading, setLoading] = useState(false);
  const [greska, setGreska] = useState("");
  const { dijalog, obavesti } = useDijalog();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = upit.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setRezultati([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/korisnici/pretraga?q=${encodeURIComponent(q)}`);
        setRezultati(res.ok ? await res.json() : []);
      } catch {
        setRezultati([]);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [upit]);

  // Granice kalendara su granice uzrasta iz čl. 2 — datum van njih se ni ne nudi,
  // umesto da ga server odbija posle unosa.
  const danas = new Date();
  const najranije = new Date(danas.getFullYear() - 18, danas.getMonth(), danas.getDate() + 1);
  const najkasnije = new Date(danas.getFullYear() - 7, danas.getMonth(), danas.getDate());
  const isoDan = (d: Date) => d.toISOString().slice(0, 10);

  const moze = !loading && roditelj !== null && datumRodjenja !== "" && razumem;

  async function posalji() {
    if (!roditelj) return;
    setGreska("");
    setLoading(true);
    const res = await fetch(`/api/admin/korisnici/${korisnik.id}/u-dete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudonim: korisnik.pseudonim, roditeljId: roditelj.id, datumRodjenja }),
    });
    const d = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setGreska(d.error ?? t("greska_generalna")); return; }
    await obavesti(
      t("korisnici_u_dete_gotovo", {
        pseudonim: d.pseudonim ?? korisnik.pseudonim,
        roditelj: d.roditeljPseudonim ?? roditelj.pseudonim,
        godine: d.godine ?? 0,
        poen: (d.otpisanoNalogu ?? 0).toLocaleString(intlTag(locale)),
        potvrde: d.ponistenoPotvrda ?? 0,
        minus: d.brojUMinusu ?? 0,
        izjasnjenja: d.brojPotvrdjivaca ?? 0,
      }),
    );
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 bg-black/40">
      {dijalog}
      <div className="bg-kolo-surface rounded-kartica shadow-xl w-full max-w-sm p-6 space-y-4 my-8">
        <div>
          <h3 className="text-base font-semibold text-kolo-text">{t("korisnici_u_dete_naslov")}</h3>
          <p className="text-sm text-kolo-muted mt-0.5"><Pseudonim>{korisnik.pseudonim}</Pseudonim></p>
        </div>

        <p className="text-xs text-kolo-muted bg-kolo-bg rounded-kontrola p-4 whitespace-pre-line">
          {t("korisnici_u_dete_posledice")}
        </p>

        <div>
          <label htmlFor="adm-korisnici-u-dete-roditelj" className="block text-sm font-medium text-kolo-text mb-1.5">{t("korisnici_u_dete_roditelj_label")}</label>
          {roditelj ? (
            <div className="flex items-center justify-between gap-2 rounded-kontrola border border-kolo-green-500 bg-kolo-green-100 px-4 py-3">
              <span className="text-sm font-medium text-kolo-text truncate"><Pseudonim>{roditelj.pseudonim}</Pseudonim></span>
              <button onClick={() => { setRoditelj(null); setUpit(""); }}
                className={klaseDugmeta({ varijanta: "tiho", velicina: "sm" }) + " shrink-0"}>
                {t("korisnici_u_dete_promeni")}
              </button>
            </div>
          ) : (
            <>
              <input
                id="adm-korisnici-u-dete-roditelj"
                type="text"
                value={upit}
                onChange={(e) => setUpit(e.target.value)}
                placeholder={t("korisnici_u_dete_roditelj_placeholder")}
                className={KLASE_UNOSA}
              />
              {rezultati.length > 0 && (
                <ul className="mt-1 max-h-44 overflow-y-auto rounded-kontrola border border-kolo-border divide-y divide-kolo-border">
                  {rezultati.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => setRoditelj({ id: r.id, pseudonim: r.pseudonim })}
                        className="w-full min-h-10 px-3 py-2 text-left hover:bg-kolo-bg transition-colors"
                      >
                        <span className="text-sm text-kolo-text"><Pseudonim>{r.pseudonim}</Pseudonim></span>
                        {r.staroIme && (
                          <span className="block text-xs text-kolo-muted">
                            {t("korisnici_u_dete_ranije", { ime: r.staroIme })}
                          </span>
                        )}
                        <span className="block text-xs text-kolo-muted">
                          {t("korisnici_u_dete_indeks", { potvrdjen: r.indeksStvarnosti > 0 ? "da" : "ne" })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {upit.trim().length >= 2 && rezultati.length === 0 && (
                <p className="mt-1 text-xs text-kolo-muted">{t("korisnici_u_dete_nema_pogodaka")}</p>
              )}
            </>
          )}
        </div>

        <div>
          <label htmlFor="adm-korisnici-u-dete-datum-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("korisnici_u_dete_datum_label")}</label>
          <input id="adm-korisnici-u-dete-datum-label"
            type="date" lang="sr-RS"
            value={datumRodjenja}
            min={isoDan(najranije)}
            max={isoDan(najkasnije)}
            onChange={(e) => setDatumRodjenja(e.target.value)}
            className={KLASE_UNOSA}
          />
          <p className="mt-1 text-xs text-kolo-muted">{t("korisnici_u_dete_datum_opis")}</p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={razumem} onChange={(e) => setRazumem(e.target.checked)}
            className="mt-0.5 accent-kolo-green-700 w-4 h-4 shrink-0" />
          <span className="text-xs text-kolo-muted">{t("korisnici_u_dete_razumem")}</span>
        </label>

        {greska && (
          <Obavestenje vrsta="greska">{greska}</Obavestenje>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" }) + " flex-1"}>
            {t("izmeni_otkazi")}
          </button>
          <button onClick={posalji} disabled={!moze}
            className={klaseDugmeta() + " flex-1"}>
            {loading ? t("korisnici_u_dete_radim") : t("korisnici_u_dete_dugme")}
          </button>
        </div>
      </div>
    </div>
  );
}

function IzmeniKorisnikaForma({ korisnik, onClose, onDone }: {
  korisnik: KorisnikInfo;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("admin");
  const [email, setEmail] = useState(korisnik.email ?? "");
  const [pseudonim, setPseudonim] = useState(korisnik.pseudonim);
  const [loading, setLoading] = useState(false);
  const [greska, setGreska] = useState("");

  async function sacuvaj() {
    setGreska("");
    const data: Record<string, string> = {};
    if (email.trim() !== (korisnik.email ?? "")) data.email = email.trim();
    if (pseudonim.trim() !== korisnik.pseudonim) data.pseudonim = pseudonim.trim();
    if (Object.keys(data).length === 0) { onClose(); return; }

    setLoading(true);
    const res = await fetch(`/api/admin/korisnici/${korisnik.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    setLoading(false);
    if (res.ok) {
      onDone();
    } else {
      setGreska(resData.error ?? t("izmeni_greska_generalna"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-kolo-surface rounded-kartica shadow-xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-kolo-text">{t("izmeni_korisnika_naslov")}</h3>
          <p className="text-sm text-kolo-muted mt-0.5"><Pseudonim>{korisnik.pseudonim}</Pseudonim></p>
        </div>

        <div>
          <label htmlFor="adm-izmeni-email-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("izmeni_email_label")}</label>
          <input id="adm-izmeni-email-label"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={KLASE_UNOSA}
          />
        </div>

        <div>
          <label htmlFor="adm-izmeni-pseudonim-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("izmeni_pseudonim_label")}</label>
          <input id="adm-izmeni-pseudonim-label"
            type="text"
            value={pseudonim}
            onChange={(e) => setPseudonim(e.target.value)}
            maxLength={30}
            className={KLASE_UNOSA}
          />
        </div>

        {greska && (
          <Obavestenje vrsta="greska">{greska}</Obavestenje>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" }) + " flex-1"}>
            {t("izmeni_otkazi")}
          </button>
          <button onClick={sacuvaj} disabled={loading}
            className={klaseDugmeta() + " flex-1"}>
            {loading ? t("izmeni_cuvam") : t("izmeni_sacuvaj")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Admin pokrovitelji tab ────────────────────────────────────────────────────

function AdminPokroviteljiTab({
  pokrovitelji,
  verifikovaniKorisnici,
  krugovi,
  onDone,
}: {
  pokrovitelji: PokroviteljItem[];
  verifikovaniKorisnici: { id: string; pseudonim: string }[];
  krugovi: { id: string; name: string }[];
  onDone: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [subTab, setSubTab] = useState<"upisi" | "lista" | "prijave" | "dobra" | "novi" | "doprinos">("upisi");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);

  // Forma — novi pokrovitelj
  const [noviNaziv, setNoviNaziv] = useState("");
  const [noviPib, setNoviPib] = useState("");
  const [noviAdresa, setNoviAdresa] = useState("");
  const [noviEmail, setNoviEmail] = useState("");
  const [noviTelefon, setNoviTelefon] = useState("");
  const [noviVlasnikId, setNoviVlasnikId] = useState("");
  const [noviKrugId, setNoviKrugId] = useState("");

  // Forma — doprinos
  const [doprinosRsd, setDoprinosRsd] = useState("");
  // Samo NOVAC ulazi u kumulativ (donacije čl. 13h st. 3); dobra i usluge idu kroz
  // pod-tab „Dobra i usluge".
  const [doprinosTip, setDoprinosTip] = useState<"NOVAC">("NOVAC");
  const [doprinosNapomena, setDoprinosNapomena] = useState("");

  async function kreirajPokrovitelja() {
    if (!noviNaziv.trim() || !noviPib.trim() || !noviVlasnikId) {
      setPoruka({ text: t("pokrovitelji_obavezna_polja"), ok: false });
      return;
    }
    setLoading(true);
    setPoruka(null);
    const res = await fetch("/api/admin/pokrovitelji", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        naziv: noviNaziv.trim(),
        pib: noviPib.trim(),
        adresa: noviAdresa.trim() || undefined,
        kontaktEmail: noviEmail.trim() || undefined,
        kontaktTelefon: noviTelefon.trim() || undefined,
        vlasnikId: noviVlasnikId,
        krugId: noviKrugId || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setPoruka({ text: t("pokrovitelji_kreiran_msg"), ok: true });
      setNoviNaziv(""); setNoviPib(""); setNoviAdresa(""); setNoviEmail(""); setNoviTelefon(""); setNoviVlasnikId(""); setNoviKrugId("");
      setTimeout(() => { onDone(); setSubTab("lista"); }, 1200);
    } else {
      setPoruka({ text: data.error ?? t("greska_generalna"), ok: false });
    }
  }

  async function dodajDoprinos() {
    if (!selectedId || !doprinosRsd) return;
    const iznos = parseFloat(doprinosRsd);
    if (isNaN(iznos) || iznos <= 0) {
      setPoruka({ text: t("pokrovitelji_neispravan_iznos"), ok: false });
      return;
    }
    setLoading(true);
    setPoruka(null);
    const res = await fetch(`/api/admin/pokrovitelji/${selectedId}/doprinos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsdIznos: iznos, tip: doprinosTip, napomena: doprinosNapomena.trim() || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      const noviNivoi: { nivo: number; bonusPoen: number }[] = data.noviNivoi ?? [];
      if (noviNivoi.length > 0) {
        const tekst = noviNivoi.map((n: { nivo: number; bonusPoen: number }) => t("pokrovitelji_nivo_bonus", { nivo: n.nivo, bonus: n.bonusPoen.toLocaleString(intlTag(locale)) })).join(", ");
        setPoruka({ text: t("pokrovitelji_doprinos_evidentiran_msg", { nivoi: tekst }), ok: true });
      } else {
        setPoruka({ text: t("pokrovitelji_doprinos_evidentiran_no_nivo"), ok: true });
      }
      setDoprinosRsd(""); setDoprinosNapomena("");
      setTimeout(() => { onDone(); setSubTab("lista"); }, 2000);
    } else {
      setPoruka({ text: data.error ?? t("greska_generalna"), ok: false });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["upisi", "lista", "prijave", "dobra", "novi", "doprinos"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setSubTab(s); setPoruka(null); }}
            aria-pressed={subTab === s}
            className={`min-h-9 px-3 rounded-kontrola text-sm font-medium transition-colors ${
              subTab === s ? "bg-kolo-green-700 text-white" : "bg-kolo-bg text-kolo-muted hover:bg-kolo-border"
            }`}
          >
            {s === "upisi" ? t("pokrovitelji_tab_upisi") : s === "lista" ? t("pokrovitelji_tab_lista", { count: pokrovitelji.length }) : s === "prijave" ? t("pokrovitelji_tab_prijave") : s === "dobra" ? t("pokrovitelji_tab_dobra") : s === "novi" ? t("pokrovitelji_tab_novi") : t("pokrovitelji_tab_doprinos")}
          </button>
        ))}
      </div>

      {poruka && (
        <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>
      )}

      {/* Upis u evidenciju pokrovitelja (donacije čl. 6a) — poređenje sa registrom. */}
      {subTab === "upisi" && <PokroviteljUpisiTab />}
      {subTab === "prijave" && <PokroviteljPrijaveTab onDone={onDone} />}
      {subTab === "dobra" && <PokroviteljstvoDobraTab />}

      {subTab === "lista" && (
        <div className="space-y-2">
          {pokrovitelji.length === 0 ? (
            <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica">
              <PraznoStanje naslov={t("pokrovitelji_nema")} />
            </div>
          ) : (
            pokrovitelji.map((p) => (
              <div key={p.id} className="bg-kolo-surface rounded-kartica border border-kolo-border px-5 py-3 flex items-center justify-between gap-4 shadow-kartica">
                <div className="min-w-0">
                  <div className="font-medium text-kolo-text truncate">{p.naziv}</div>
                  <div className="text-xs text-kolo-muted mt-0.5">
                    {p.bpg
                      ? t.rich("pokrovitelji_bpg_vlasnik", { bpg: p.bpg, vlasnik: p.vlasnikPseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })
                      : t.rich("pokrovitelji_pib_vlasnik", { pib: p.pib ?? "", vlasnik: p.vlasnikPseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })}
                  </div>
                  <AdminLogotip izvor="POKROVITELJ" id={p.id} url={p.logoUrl} onUklonjen={onDone} />
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === "ACTIVE" ? "bg-kolo-green-100 text-kolo-green-700" : "bg-kolo-gold-100 text-kolo-gold-700"}`}>
                    {t("pokrovitelji_nivo", { nivo: p.trenutniNivo })}
                  </span>
                  <div className="text-xs text-kolo-muted mt-0.5">
                    {p.rsdKumulativ.toLocaleString(intlTag(locale))} RSD · {p.brDoprinosa !== 1 ? t("pokrovitelji_doprinos_count_pl", { count: p.brDoprinosa }) : t("pokrovitelji_doprinos_count_sing", { count: p.brDoprinosa })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {subTab === "novi" && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 space-y-4 shadow-kartica">
          <h3 className="font-semibold text-kolo-text">{t("pokrovitelji_novi_naslov")}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="adm-pokrovitelji-naziv-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_naziv_label")}</label>
              <input id="adm-pokrovitelji-naziv-label" value={noviNaziv} onChange={(e) => setNoviNaziv(e.target.value)}
                className={KLASE_UNOSA}
                placeholder={t("pokrovitelji_naziv_placeholder")} />
            </div>
            <div>
              <label htmlFor="adm-pokrovitelji-pib-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_pib_label")}</label>
              <input id="adm-pokrovitelji-pib-label" value={noviPib} onChange={(e) => setNoviPib(e.target.value)}
                className={KLASE_UNOSA}
                placeholder={t("pokrovitelji_pib_placeholder")} />
            </div>
          </div>
          <div>
            <label htmlFor="adm-pokrovitelji-adresa-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_adresa_label")}</label>
            <input id="adm-pokrovitelji-adresa-label" value={noviAdresa} onChange={(e) => setNoviAdresa(e.target.value)}
              className={KLASE_UNOSA}
              placeholder={t("pokrovitelji_adresa_placeholder")} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="adm-pokrovitelji-email-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_email_label")}</label>
              <input id="adm-pokrovitelji-email-label" value={noviEmail} onChange={(e) => setNoviEmail(e.target.value)}
                className={KLASE_UNOSA}
                placeholder="kontakt@firma.rs" />
            </div>
            <div>
              <label htmlFor="adm-pokrovitelji-telefon-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_telefon_label")}</label>
              <input id="adm-pokrovitelji-telefon-label" value={noviTelefon} onChange={(e) => setNoviTelefon(e.target.value)}
                className={KLASE_UNOSA}
                placeholder="+381..." />
            </div>
          </div>
          <div>
            <label htmlFor="adm-pokrovitelji-vlasnik-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_vlasnik_label")}</label>
            <select id="adm-pokrovitelji-vlasnik-label" value={noviVlasnikId} onChange={(e) => setNoviVlasnikId(e.target.value)}
              className={KLASE_UNOSA}>
              <option value="">{t("pokrovitelji_vlasnik_placeholder")}</option>
              {verifikovaniKorisnici.map((k) => (
                <option key={k.id} value={k.id}>{k.pseudonim}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="adm-pokrovitelji-krug-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_krug_label")}</label>
            <select id="adm-pokrovitelji-krug-label" value={noviKrugId} onChange={(e) => setNoviKrugId(e.target.value)}
              className={KLASE_UNOSA}>
              <option value="">{t("pokrovitelji_krug_placeholder")}</option>
              {krugovi.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={kreirajPokrovitelja}
            disabled={loading}
            className={klaseDugmeta() + " w-full"}
          >
            {loading ? t("pokrovitelji_kreiranje") : t("pokrovitelji_kreiraj_btn")}
          </button>
        </div>
      )}

      {subTab === "doprinos" && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 space-y-4 shadow-kartica">
          <h3 className="font-semibold text-kolo-text">{t("pokrovitelji_doprinos_naslov")}</h3>
          <div>
            <label htmlFor="adm-pokrovitelji-doprinos-pokrovitelj-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_doprinos_pokrovitelj_label")}</label>
            <select id="adm-pokrovitelji-doprinos-pokrovitelj-label" value={selectedId ?? ""} onChange={(e) => setSelectedId(e.target.value || null)}
              className={KLASE_UNOSA}>
              <option value="">{t("pokrovitelji_doprinos_select_placeholder")}</option>
              {pokrovitelji.filter((p) => p.status === "ACTIVE").map((p) => (
                <option key={p.id} value={p.id}>
                  {p.naziv} ({t("pokrovitelji_nivo", { nivo: p.trenutniNivo })}, {p.rsdKumulativ.toLocaleString(intlTag(locale))} RSD)
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="adm-pokrovitelji-doprinos-iznos-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_doprinos_iznos_label")}</label>
              <input id="adm-pokrovitelji-doprinos-iznos-label"
                type="number"
                min="1"
                value={doprinosRsd}
                onChange={(e) => setDoprinosRsd(e.target.value)}
                className={KLASE_UNOSA}
                placeholder={t("pokrovitelji_doprinos_iznos_placeholder")}
              />
            </div>
            <div>
              <label htmlFor="adm-pokrovitelji-doprinos-tip-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_doprinos_tip_label")}</label>
              <select id="adm-pokrovitelji-doprinos-tip-label"
                value={doprinosTip}
                onChange={(e) => setDoprinosTip(e.target.value as "NOVAC")}
                className={KLASE_UNOSA}
              >
                <option value="NOVAC">{t("pokrovitelji_doprinos_novac")}</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="adm-pokrovitelji-doprinos-napomena-label" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pokrovitelji_doprinos_napomena_label")}</label>
            <input id="adm-pokrovitelji-doprinos-napomena-label" value={doprinosNapomena} onChange={(e) => setDoprinosNapomena(e.target.value)}
              className={KLASE_UNOSA}
              placeholder={t("pokrovitelji_doprinos_napomena_placeholder")} />
          </div>
          <button
            onClick={dodajDoprinos}
            disabled={loading || !selectedId}
            className={klaseDugmeta() + " w-full"}
          >
            {loading ? t("pokrovitelji_doprinos_evidentiranje") : t("pokrovitelji_doprinos_btn")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Audit log tab ─────────────────────────────────────────────────────────────

function AuditLogTab({ logs, onRefresh }: { logs: AuditLogEntry[]; onRefresh: () => void }) {
  const locale = useLocale();
  const t = useTranslations("admin");
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-kolo-muted">{t("audit_zapisa", { count: logs.length })}</p>
        <button onClick={onRefresh}
          className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}>
          {t("audit_osvjezi")}
        </button>
      </div>

      <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
        {logs.length === 0 ? (
          <PraznoStanje naslov={t("audit_nema")} />
        ) : (
          logs.map((l, i) => (
            <div key={l.id} className={`px-4 py-3 ${i < logs.length - 1 ? "border-b border-kolo-border" : ""}`}>
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-kolo-green-700">{l.akcija}</span>
                    {l.targetId && (
                      <span className="text-xs text-kolo-muted truncate max-w-[120px]">{l.targetId}</span>
                    )}
                  </div>
                  <p className="text-xs text-kolo-muted mt-0.5">
                    <Pseudonim>{l.adminPseudonim}</Pseudonim>
                    {l.detalji && <span className="text-kolo-muted"> — {l.detalji}</span>}
                  </p>
                </div>
                <span className="text-xs text-kolo-muted shrink-0">
                  {new Date(l.createdAt).toLocaleString(intlTag(locale), {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Vesti (blog Fondacije) ────────────────────────────────────────────────────

function VestiTab({ objave, onDone }: { objave: BlogObjavaAdmin[]; onDone: () => void }) {
  const locale = useLocale();
  const t = useTranslations("admin");
  const [editId, setEditId] = useState<string | null>(null);
  const [naslov, setNaslov] = useState("");
  const [sadrzaj, setSadrzaj] = useState("");
  const [datum, setDatum] = useState("");
  const [salje, setSalje] = useState(false);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);
  const { dijalog, potvrdi, obavesti } = useDijalog();

  function resetForma() {
    setEditId(null);
    setNaslov("");
    setSadrzaj("");
    setDatum("");
    setPoruka(null);
  }

  function pocniIzmenu(o: BlogObjavaAdmin) {
    setEditId(o.id);
    setNaslov(o.title);
    setSadrzaj(o.content);
    setDatum(o.publishedAt.slice(0, 16));
    setPoruka(null);
  }

  async function sacuvaj(e: React.FormEvent) {
    e.preventDefault();
    if (!naslov.trim() || !sadrzaj.trim() || salje) return;
    setSalje(true);
    setPoruka(null);

    const url = editId ? `/api/admin/blog/${editId}` : "/api/admin/blog";
    const method = editId ? "PATCH" : "POST";
    const body: { title: string; content: string; publishedAt?: string } = {
      title: naslov.trim(),
      content: sadrzaj.trim(),
    };
    if (datum) body.publishedAt = new Date(datum).toISOString();

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setPoruka({ text: data.error ?? t("greska_generalna"), ok: false });
        return;
      }
      setPoruka({ text: editId ? t("vesti_izmenjena_msg") : t("vesti_sacuvana_msg"), ok: true });
      resetForma();
      setTimeout(onDone, 800);
    } catch {
      setPoruka({ text: t("vesti_mrezna_greska"), ok: false });
    } finally {
      setSalje(false);
    }
  }

  async function obrisi(id: string) {
    if (!(await potvrdi({ poruka: t("vesti_obrisi_confirm"), opasno: true, dugme: t("vesti_obrisi_btn") }))) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (res.ok) {
      onDone();
    } else {
      const data = await res.json();
      await obavesti(data.error ?? t("greska_generalna"));
    }
  }

  return (
    <div className="space-y-5">
      {dijalog}
      {/* Forma */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 shadow-kartica">
        <h3 className="text-sm font-semibold text-kolo-text mb-3">
          {editId ? t("vesti_izmeni_objavu") : t("vesti_nova_objava")}
        </h3>
        <form onSubmit={sacuvaj} className="space-y-3">
          <input
            type="text"
            value={naslov}
            onChange={(e) => setNaslov(e.target.value)}
            placeholder={t("vesti_naslov_placeholder")} aria-label={t("vesti_naslov_placeholder")}
            maxLength={200}
            className={KLASE_UNOSA}
          />
          <textarea
            value={sadrzaj}
            onChange={(e) => setSadrzaj(e.target.value)}
            placeholder={t("vesti_sadrzaj_placeholder")} aria-label={t("vesti_sadrzaj_placeholder")}
            rows={8}
            maxLength={20000}
            className={KLASE_UNOSA + " resize-y"}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-kolo-text">
              {t("vesti_datum_label")}{" "}
              <input
                type="datetime-local"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="ml-1 min-h-10 px-3 py-1 rounded-kontrola border border-kolo-border bg-kolo-surface text-sm font-normal outline-none focus:border-kolo-green-700"
              />
            </label>
            <span className="text-xs text-kolo-muted ml-auto">
              {t("vesti_znakovi", { count: sadrzaj.length })}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!naslov.trim() || !sadrzaj.trim() || salje}
              className={klaseDugmeta()}
            >
              {salje ? "..." : editId ? t("vesti_sacuvaj_izmene") : t("vesti_objavi")}
            </button>
            {editId && (
              <button
                type="button"
                onClick={resetForma}
                className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
              >
                {t("vesti_otkazi")}
              </button>
            )}
          </div>
          {poruka && (
            <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>
          )}
        </form>
      </div>

      {/* Lista postojećih */}
      <div>
        <h3 className="text-sm font-semibold text-kolo-text mb-3">
          {t("vesti_postojece_naslov", { count: objave.length })}
        </h3>
        {objave.length === 0 ? (
          <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica">
            <PraznoStanje naslov={t("vesti_nema")} />
          </div>
        ) : (
          <div className="space-y-2">
            {objave.map((o) => (
              <div
                key={o.id}
                className="bg-kolo-surface rounded-kartica border border-kolo-border p-4 flex items-start gap-4 shadow-kartica"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kolo-text">{o.title}</p>
                  <p className="text-xs text-kolo-muted mt-0.5">
                    {new Date(o.publishedAt).toLocaleString(intlTag(locale), {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}{" "}
                    · <Pseudonim>{o.authorPseudonim}</Pseudonim>
                  </p>
                  <p className="text-xs text-kolo-muted mt-1 line-clamp-2">
                    {o.content.slice(0, 200)}
                    {o.content.length > 200 ? "…" : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => pocniIzmenu(o)}
                    className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                  >
                    {t("vesti_izmeni_btn")}
                  </button>
                  <button
                    onClick={() => obrisi(o.id)}
                    className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}
                  >
                    {t("vesti_obrisi_btn")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
