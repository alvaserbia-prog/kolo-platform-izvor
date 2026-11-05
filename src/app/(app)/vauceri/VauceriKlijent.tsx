"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import { koordinateZaMesto, udaljenostKm, type Koordinate } from "@/lib/udaljenost";
import { ikonaVaucera, IKONA_DOBRO } from "@/lib/vaucer-ikona-pravila";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import IkonaVaucera from "@/components/IkonaVaucera";
import Dugme, { klaseDugmeta } from "@/components/ui/Dugme";
import { klaseKartice } from "@/components/ui/Kartica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Stranica from "@/components/ui/Stranica";
import Filter from "@/components/ui/Filter";
import Pecat from "@/components/ui/Pecat";
import Fioka from "@/components/ui/Fioka";
import Obavestenje from "@/components/ui/Obavestenje";
import Segmenti from "@/components/ui/Segmenti";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useDijalog } from "@/components/ui/Dijalog";
import Ucitavanje from "@/components/ui/Ucitavanje";
import ZakljucanModul from "@/components/ui/ZakljucanModul";

// Isti QR kao „Moj QR" na ekranu POEN — učitava se lenjo.
const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), { ssr: false });

/**
 * Vaučeri iz pokroviteljstva dobrima i uslugama (nabavke Glava VII).
 *
 * Vaučeri su dostupni od izdavanja; reda i roka za prijavu nema — vaučer uzima
 * korisnik koji ga prvi zatraži (čl. 32). Za uzimanje su obavezne izjava o
 * nepovezanosti i pristanak na prikaz zapisa uz pseudonim (čl. 33 st. 1).
 *
 * Izgled (02.11.2026, po flajeru za firme i gazdinstva): vaučer je vodoravan tiket —
 * levo traka sa ikonom (bira je Platforma po opisu, `vaucer-ikona-pravila.ts`;
 * fotografiju pokrovitelj ne šalje), desno naziv pokrovitelja, opis, mesto i broj
 * POEN-a. Klik otvara fioku sa detaljem, izjavom, pristankom i dugmetom.
 *
 * 🔴 Na ovom ekranu se uz broj POEN-a NIKAD ne prikazuje dinarska vrednost (cena,
 * vrednost ugovora) — nabavke čl. 31, R-01. Vaučer pokazuje samo: opis,
 * naziv pokrovitelja (uz logotip, ako ga je priložio — donacije čl. 26 st. 2;
 * logotip nikad nije link), mesto i adresu, broj preostalih, rok i broj POEN-a. Brana:
 * `vaucer-izvor.test.ts`. 🔴 Dugme je „Uzmi vaučer" (nabavke čl. 33: vaučer se UZIMA, dobro
 * se PREDAJE), nikad „kupi" ni „plati". Pristanak na prikaz opisa se povlači u „Moji
 * vaučeri" (čl. 33 st. 2): opis i naziv pokrovitelja brišu se iz opisa zapisa, zapis ostaje.
 * Poredak je isti za sve pokrovitelje (po vremenu izdavanja, odnosno po udaljenosti) —
 * nijedan pokrovitelj se ne ističe (donacije čl. 26 st. 4).
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
  /** Sva mesta predaje, odnosno pružanja (set 5.0.6). */
  mestaPrikaz: string[];
  vaziDo: string | null;
  poen: number;
  preostalo: number;
  izdatoAt: string | null;
};

type MojVaucer = {
  id: string;
  kod: string | null;
  status: "SLOBODAN" | "DODELJEN" | "ISKORISCEN" | "ISTEKAO" | "NEIZVRSEN";
  opis: string;
  davalac: string;
  logoUrl: string | null;
  vrsta: "DOBRO" | "USLUGA";
  mesto: string;
  adresaPredaje: string | null;
  /** Sva mesta predaje, odnosno pružanja (set 5.0.6). */
  mestaPrikaz: string[];
  vaziDo: string | null;
  poen: number;
  /** Pristanak na prikaz opisa uz pseudonim (nabavke čl. 33 st. 1) i njegovo povlačenje (st. 2). */
  pristanakDat: boolean;
  pristanakPovucenAt: string | null;
};

/** „Blizu mene" — vaučeri sa bar jednim mestom predaje do ove udaljenosti. */
const BLIZU_KM = 30;
/** Zlatni pečat sa brojem preostalih — kad ih je ovoliko ili manje. */
const PECAT_PREOSTALO = 3;
/** Bez zapamćene posete: NOVO je ono što je izdato u poslednjih toliko dana. */
const NOVO_DANA = 7;
const KLJUC_POSETE = "kolo-vauceri-poseta";

export default function VauceriKlijent({ mojaLokacija = null }: { mojaLokacija?: string | null }) {
  const t = useTranslations("vauceri");
  const tz = useTranslations("transakcije");
  const locale = useLocale();
  const { dijalog, potvrdi } = useDijalog();
  const [dostupni, setDostupni] = useState<Dostupan[]>([]);
  const [vauceri, setVauceri] = useState<MojVaucer[]>([]);
  const [ucitava, setUcitava] = useState(true);
  const [izjave, setIzjave] = useState<Record<string, boolean>>({});
  const [pristanci, setPristanci] = useState<Record<string, boolean>>({});
  const [radi, setRadi] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ tekst: string; ok: boolean } | null>(null);
  const [izabran, setIzabran] = useState<string | null>(null);
  const [otvorenQr, setOtvorenQr] = useState<string | null>(null);
  const [pogled, setPogled] = useState<"DOSTUPNI" | "MOJI">("DOSTUPNI");
  const [blizu, setBlizu] = useState(false);
  const [prethodnaPoseta, setPrethodnaPoseta] = useState<number | null>(null);
  const upisFilter = useSearchParams().get("upis");
  // Vaučere uzima ko je u Kolu (član bez potvrde ima isto pravo kao član Kola).
  // Ekran samo kaže unapred; odlučuje ruta `/api/vauceri/ugovor/[id]/uzmi`.
  // Dečji nalog ima sopstvena pravila, pa mu se obrazac zaključanog modula ne prikazuje.
  const { data: sesija } = useSession();
  const zakljucano = Boolean(sesija?.user && !sesija.user.maloletan && !sesija.user.verified);

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

  // NOVO = izdato posle prethodne posete ove stranice (pamti se samo u ovom pregledaču).
  useEffect(() => {
    let ranije: number | null = null;
    try {
      const s = localStorage.getItem(KLJUC_POSETE);
      if (s) ranije = Number(s) || null;
      localStorage.setItem(KLJUC_POSETE, String(Date.now()));
    } catch {
      /* bez skladišta — važi podrazumevani rok */
    }
    setPrethodnaPoseta(ranije ?? Date.now() - NOVO_DANA * 86_400_000);
  }, []);

  const refKoord = useMemo(() => koordinateZaMesto(mojaLokacija), [mojaLokacija]);

  const prikazani = useMemo(() => {
    const sa = (upisFilter ? dostupni.filter((d) => d.upisId === upisFilter) : dostupni).map((d) => ({
      ...d,
      km: najblizeKm(refKoord, d.mestaPrikaz),
    }));
    if (!blizu) return sa;
    return sa
      .filter((d) => d.km !== null && d.km <= BLIZU_KM)
      .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  }, [dostupni, upisFilter, blizu, refKoord]);

  const vazeci = vauceri.filter((v) => v.status === "DODELJEN").length;
  // Zbir preostalih vaučera u celoj ponudi (ne samo u filteru „Blizu mene").
  const ukupnoDostupno = dostupni.reduce((z, d) => z + d.preostalo, 0);

  const datum = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
  const broj = (n: number) => n.toLocaleString(intlTag(locale));

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
      setIzabran(null);
      setPogled("MOJI");
    }
    await ucitaj();
  }

  async function povuciPristanak(id: string) {
    if (!(await potvrdi({ poruka: t("pristanak_povuci_potvrda"), dugme: t("pristanak_povuci"), opasno: true }))) return;
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

  const r = izabran ? prikazani.find((d) => d.id === izabran) ?? null : null;
  const qrVaucer = otvorenQr ? vauceri.find((v) => v.id === otvorenQr) ?? null : null;

  return (
    <Stranica sirina="siroka">
      {dijalog}

      {/* Zeleno zaglavlje (odluka vlasnika 02.11.2026): rečenica i dve brojke, bez
          serifa i bez kosog pečata. Brojke su komadi, nikad POEN uz dinar. */}
      <NaslovStranice
        varijanta="istaknuto"
        naslov={t("naslov")}
        opis={t("uvod")}
        brojke={ucitava ? undefined : [
          { vrednost: broj(ukupnoDostupno), oznaka: t("zaglavlje_dostupno") },
          { vrednost: broj(vazeci), oznaka: t("zaglavlje_moji") },
        ]}
      />

      {zakljucano && <ZakljucanModul poruka={t("zakljucano")} />}

      {poruka && (
        <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>
          {poruka.tekst}
        </Obavestenje>
      )}

      <Segmenti
        oznaka={t("naslov")}
        punaSirina
        vrednost={pogled}
        onPromena={setPogled}
        opcije={[
          { vrednost: "DOSTUPNI", oznaka: t("tab_dostupni") },
          { vrednost: "MOJI", oznaka: t("tab_moji", { broj: vazeci }) },
        ]}
      />

      {pogled === "DOSTUPNI" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter ukljucen={blizu} onClick={() => setBlizu((b) => !b)} disabled={!refKoord}>
              <Pin /> {t("filter_blizu", { km: BLIZU_KM })}
            </Filter>
            {!refKoord && (
              <Link href="/profil" className="inline-flex min-h-10 items-center text-xs text-kolo-muted underline">{t("filter_blizu_bez_mesta")}</Link>
            )}
            {upisFilter && (
              <span className="text-sm text-kolo-muted">
                {t("filter_pokrovitelj")}{" "}
                <Link href="/vauceri" className="font-medium text-kolo-green-700 underline">{t("filter_sve")}</Link>
              </span>
            )}
          </div>

          {ucitava ? (
            <Ucitavanje />
          ) : prikazani.length === 0 ? (
            <PraznoStanje
              ikona={<IkonaVaucera ikona={IKONA_DOBRO} velicina={36} />}
              naslov={blizu ? t("blizu_prazno") : t("dostupni_prazno")}
              opis={t("dostupni_prazno_opis")}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {prikazani.map((d) => (
                <Tiket
                  key={d.id}
                  ikona={ikonaVaucera(d.opis, d.vrsta)}
                  pokrovitelj={d.davalac}
                  logoUrl={d.logoUrl}
                  opis={d.opis}
                  mesto={d.mestaPrikaz.join("; ")}
                  km={d.km}
                  onClick={() => setIzabran(d.id)}
                  pecati={
                    <>
                      {prethodnaPoseta !== null && d.izdatoAt && new Date(d.izdatoAt).getTime() > prethodnaPoseta && (
                        <Pecat>{t("oznaka_novo")}</Pecat>
                      )}
                      {d.preostalo <= PECAT_PREOSTALO && <Pecat>{t("pecat_jos", { broj: d.preostalo })}</Pecat>}
                    </>
                  }
                  dno={
                    <>
                      <span className="rounded-kontrola bg-kolo-green-100 px-3 py-1 text-base font-bold text-kolo-green-700">
                        {t("poen_po_vauceru", { poen: broj(d.poen) })}
                      </span>
                      <span className="text-right text-xs text-kolo-muted">
                        {t("preostalo", { broj: d.preostalo })}
                        <br />
                        {t("vazi_do", { datum: datum(d.vaziDo) })}
                      </span>
                    </>
                  }
                />
              ))}
            </div>
          )}
          <p className="text-sm text-kolo-muted">{t("dostupni_opis")}</p>
        </section>
      ) : (
        <section className="space-y-4">
          {!ucitava && vauceri.length === 0 ? (
            <PraznoStanje
              ikona={<IkonaVaucera ikona={IKONA_DOBRO} velicina={36} />}
              naslov={t("moji_prazno")}
              radnja={
                <Dugme varijanta="sekundarno" velicina="sm" onClick={() => setPogled("DOSTUPNI")}>
                  {t("pogledaj_dostupne")}
                </Dugme>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {vauceri.map((v) => {
                const vazi = v.status === "DODELJEN";
                return (
                  <div key={v.id} className="space-y-1.5">
                    <div className={vazi ? "" : "opacity-60"}>
                      <Tiket
                        ikona={ikonaVaucera(v.opis, v.vrsta)}
                        pokrovitelj={v.davalac}
                        logoUrl={v.logoUrl}
                        opis={v.opis}
                        mesto={v.mestaPrikaz.join("; ")}
                        km={null}
                        tamno={vazi}
                        onClick={vazi && v.kod ? () => setOtvorenQr(v.id) : undefined}
                        pecati={<Pecat ton={vazi ? "zeleni" : "sivi"}>{STATUS[v.status]}</Pecat>}
                        dno={
                          <>
                            <span className="text-xs text-kolo-muted">{t("vazi_do", { datum: datum(v.vaziDo) })}</span>
                            {vazi && v.kod && (
                              <span className={klaseDugmeta({ velicina: "sm" })}>
                                {t("prikazi_qr")}
                              </span>
                            )}
                          </>
                        }
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
                      {v.pristanakPovucenAt ? (
                        <p className="text-xs text-kolo-muted">{t("pristanak_povucen", { datum: datum(v.pristanakPovucenAt) })}</p>
                      ) : (
                        v.pristanakDat && (
                          <button
                            type="button"
                            onClick={() => povuciPristanak(v.id)}
                            disabled={radi === v.id}
                            className="min-h-10 text-xs font-medium text-kolo-muted underline disabled:opacity-50"
                          >
                            {t("pristanak_povuci")}
                          </button>
                        )
                      )}
                      {(v.status === "DODELJEN" || v.status === "ISKORISCEN" || v.status === "ISTEKAO") && (
                        <Link
                          href={`/profil?prigovor=VAUCER&predmet=${v.id}`}
                          className="inline-flex min-h-10 items-center text-xs font-medium text-kolo-muted underline"
                        >
                          {t("prigovor_link")}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-sm text-kolo-muted">{t("moji_napomena")}</p>
        </section>
      )}

      <p className="text-sm text-kolo-muted">
        <Link href="/postani-pokrovitelj" className="inline-flex min-h-10 items-center font-medium text-kolo-green-700 underline">{t("davalac_link")}</Link>
      </p>

      {/* ── Fioka: detalj vaučera, izjava, pristanak, „Uzmi vaučer" ─────────── */}
      {r && (
        <Fioka naslov={r.opis} onZatvori={() => setIzabran(null)}>
          <div className="flex items-center gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-kontrola bg-kolo-gold-100 text-kolo-green-700">
              <IkonaVaucera ikona={ikonaVaucera(r.opis, r.vrsta)} velicina={40} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-kolo-green-700">
                <LogotipPokrovitelja url={r.logoUrl} />
                <span className="min-w-0">{r.davalac}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-kontrola bg-kolo-bg px-4 py-3">
            <span className="text-xl font-bold text-kolo-green-700">{t("poen_po_vauceru", { poen: broj(r.poen) })}</span>
            <span className="text-right text-sm text-kolo-muted">
              {t("preostalo", { broj: r.preostalo })}
              <br />
              {t("vazi_do", { datum: datum(r.vaziDo) })}
            </span>
          </div>

          <div className="space-y-1 text-sm">
            <p className="font-semibold text-kolo-text">{t("detalj_mesta")}</p>
            <ul className="space-y-0.5 text-kolo-muted">
              {r.mestaPrikaz.map((m) => <li key={m} className="flex items-start gap-1.5"><Pin /> {m}</li>)}
            </ul>
          </div>

          <p className="text-xs leading-relaxed text-kolo-muted">{t("detalj_napomena")}</p>

          <ul className="list-disc space-y-1 pl-5 text-sm text-kolo-text">
            <li>{t("tacka_ponistenje")}</li>
            <li>{t("tacka_najvise_dva")}</li>
          </ul>

          {zakljucano ? (
            <ZakljucanModul poruka={t("zakljucano")} />
          ) : (
          <div className="space-y-3 border-t border-kolo-border pt-4">
            <SklopivaIzjava
              naslov={t("izjava_nepovezan_naslov")}
              tekst={t("izjava_nepovezan")}
              oznaceno={izjave[r.id] === true}
              onOznaci={(v) => setIzjave((s) => ({ ...s, [r.id]: v }))}
              otvoriLabela={t("prikazi_tekst")}
            />
            <SklopivaIzjava
              naslov={t("pristanak_prikaz_naslov")}
              tekst={t("pristanak_prikaz")}
              primer={t("pristanak_primer", { zapis: tz("vaucer_uzet", { opis: r.opis, davalac: r.davalac }) })}
              oznaceno={pristanci[r.id] === true}
              onOznaci={(v) => setPristanci((s) => ({ ...s, [r.id]: v }))}
              otvoriLabela={t("prikazi_tekst")}
            />
            <Dugme
              velicina="lg"
              punaSirina
              onClick={() => uzmi(r.id)}
              disabled={radi === r.id || izjave[r.id] !== true || pristanci[r.id] !== true}
            >
              {t("preuzmi_vaucer")}
            </Dugme>
            {(izjave[r.id] !== true || pristanci[r.id] !== true) && (
              <p className="text-center text-xs text-kolo-muted">{t("uzmi_zakljucano")}</p>
            )}
          </div>
          )}
        </Fioka>
      )}

      {/* ── Kod za pokazivanje pokrovitelju ──────────────────────────────── */}
      {qrVaucer && qrVaucer.kod && (
        <Fioka naslov={qrVaucer.opis} onZatvori={() => setOtvorenQr(null)}>
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="flex items-center gap-2 text-sm font-semibold text-kolo-green-700">
              <LogotipPokrovitelja url={qrVaucer.logoUrl} />
              {qrVaucer.davalac}
            </p>
            <div className="rounded-kartica border border-kolo-border bg-white p-4">
              <QRCodeSVG value={qrVaucer.kod} size={240} fgColor="#1B6B3A" bgColor="#FFFFFF" level="M" />
            </div>
            <p className="font-mono text-2xl font-semibold tracking-widest text-kolo-green-700">{qrVaucer.kod}</p>
            <p className="text-sm text-kolo-muted">{qrVaucer.mestaPrikaz.join("; ")}</p>
            <p className="text-xs text-kolo-muted">{t("qr_uputstvo")}</p>
          </div>
        </Fioka>
      )}
    </Stranica>
  );
}

/** Najmanja udaljenost (km) od mesta sa profila do nekog mesta predaje; null kad se ne zna. */
function najblizeKm(ref: Koordinate | null, mesta: string[]): number | null {
  if (!ref) return null;
  let min: number | null = null;
  for (const m of mesta) {
    // Prikaz mesta je „Mesto, adresa" — za koordinate je dovoljno naselje.
    const k = koordinateZaMesto(m.split(",")[0]);
    if (!k) continue;
    const d = udaljenostKm(ref, k);
    if (min === null || d < min) min = d;
  }
  return min === null ? null : Math.round(min);
}

/** Oznaka mesta — ista linijska ikona kao na naslovnoj (`KomeKartice`, „mesto"). */
function Pin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 inline-block shrink-0 align-[-3px]">
      <path d="M12 21s6.5-5.7 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

/**
 * Vaučer kao tiket (flajer za firme i gazdinstva): levo traka sa ikonom, isprekidana
 * linija sa isečenim krajevima, desno naziv pokrovitelja, opis, mesto i dno.
 * Logotip je iste veličine za svakog pokrovitelja i nikad nije link.
 */
function Tiket({
  ikona,
  pokrovitelj,
  logoUrl,
  opis,
  mesto,
  km,
  pecati,
  dno,
  tamno = false,
  onClick,
}: {
  ikona: ReturnType<typeof ikonaVaucera>;
  pokrovitelj: string;
  logoUrl: string | null;
  opis: string;
  mesto: string;
  km: number | null;
  pecati?: ReactNode;
  dno: ReactNode;
  tamno?: boolean;
  onClick?: () => void;
}) {
  const Omot = onClick ? "button" : "div";
  return (
    <Omot
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={`${klaseKartice({ padding: "nema", link: Boolean(onClick) })} relative flex w-full overflow-hidden text-left`}
    >
      <div className={`flex w-24 shrink-0 flex-col items-center justify-center gap-2 py-4 sm:w-28 ${tamno ? "bg-kolo-green-700 text-white" : "bg-kolo-gold-100 text-kolo-green-700"}`}>
        <IkonaVaucera ikona={ikona} velicina={48} />
      </div>
      {/* perforacija sa isečenim krajevima */}
      <div className="relative w-0 border-l-2 border-dashed border-kolo-border" aria-hidden="true">
        <span className="absolute -left-[13px] -top-3 size-6 rounded-full border border-kolo-border bg-kolo-bg" />
        <span className="absolute -bottom-3 -left-[13px] size-6 rounded-full border border-kolo-border bg-kolo-bg" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-kolo-green-700">
          {logoUrl && <LogotipPokrovitelja url={logoUrl} velicina={28} />}
          <span className="truncate">{pokrovitelj}</span>
        </p>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-kolo-text">{opis}</h3>
        <p className="truncate text-sm text-kolo-muted">
          {mesto}
          {km !== null && <span className="ml-1 font-medium text-kolo-green-700">· ~{km} km</span>}
        </p>
        {pecati && <div className="flex flex-wrap gap-2 pt-0.5">{pecati}</div>}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-kolo-border pt-2.5">{dno}</div>
      </div>
    </Omot>
  );
}

/**
 * Izjava, odnosno pristanak sklopljen u jedan red: kućica se štiklira odmah, a pun
 * tekst se otvara strelicom. Tekst je isti onaj koji server snima uz pristanak
 * (`vauceri.pristanak_prikaz`) — ovde se samo sklapa, ne skraćuje.
 */
function SklopivaIzjava({
  naslov,
  tekst,
  primer,
  oznaceno,
  onOznaci,
  otvoriLabela,
}: {
  naslov: string;
  tekst: string;
  /** Šta će tačno pisati uz pseudonim — uvek vidljivo, da korisnik zna na šta pristaje. */
  primer?: string;
  oznaceno: boolean;
  onOznaci: (v: boolean) => void;
  otvoriLabela: string;
}) {
  const [otvoreno, setOtvoreno] = useState(false);
  return (
    <div className="text-sm text-kolo-text">
      <div className="flex items-start gap-2">
        <label className="flex flex-1 items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0"
            checked={oznaceno}
            onChange={(e) => onOznaci(e.target.checked)}
          />
          <span>{naslov}</span>
        </label>
        <button
          type="button"
          onClick={() => setOtvoreno((o) => !o)}
          aria-expanded={otvoreno}
          aria-label={otvoriLabela}
          className="-mt-2 flex min-h-10 min-w-10 shrink-0 items-center justify-center text-kolo-muted"
        >
          <span aria-hidden className={`inline-block transition-transform ${otvoreno ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>
      {primer && <p className="ml-7 mt-1.5 rounded-kontrola bg-kolo-bg px-3 py-2 text-xs leading-relaxed text-kolo-text">{primer}</p>}
      {otvoreno && <p className="ml-7 mt-1 text-xs leading-relaxed text-kolo-muted">{tekst}</p>}
    </div>
  );
}
