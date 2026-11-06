"use client";

import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import Dugme, { klaseDugmeta } from "@/components/ui/Dugme";
import NaslovStranice from "@/components/ui/NaslovStranice";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import ZakljucanModul from "@/components/ui/ZakljucanModul";
import Stranica from "@/components/ui/Stranica";
import Segmenti from "@/components/ui/Segmenti";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";
import { useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { intlTag } from "@/lib/format";
import { najviseZaUpisZrna, PROCENAT_UPISA_ZRNA_PO_PERIODU } from "@/lib/zrno-upis-pravila";
import { glasackaMoc as mocIz } from "@/lib/gornje-kolo-pravila";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

import Pojam from "@/components/Pojam";
import Pseudonim from "@/components/Pseudonim";

interface Props {
  slobodno: number;
  aktivno: number;
  glasackaMoc: number;
  poenBalans: number;
  koeficijent: number;
  kanalAktivan: boolean;
  /** Set 4.8.2: položaj ZRNA koji se objašnjava (`zamrznuto` / `bez_potvrde`). */
  polozaj: "zamrznuto" | "bez_potvrde" | null;
  /** Član bez potvrde: upisom ne postaje čuvar Kola (Pravilnik čl. 22 st. 3, 28 st. 3). */
  jeBezPotvrde: boolean;
  /** Član Kola bez ZRNA: aktivira tek kad upisom postane čuvar Kola (čl. 28 st. 3). */
  jeClanKolaBezZrna: boolean;
  /** Upis: član bez potvrde i član Kola (Pravilnik čl. 22 st. 3). */
  smeUpis: boolean;
  /** Otpis slobodnog: čuvar Kola i član bez potvrde (čl. 23 st. 2, 29 st. 1). */
  smeOtpis: boolean;
  /** Aktiviranje i vraćanje u slobodno: čuvar Kola (čl. 23 st. 2, 29 st. 2). */
  smeAktivirati: boolean;
  /** Delegiranje: čuvar Kola (čl. 44 st. 2; Gornje Kolo čl. 14). */
  smeDelegirati: boolean;
  minimumPoenZaUpis: number;
  /** Prag ukupnog broja POEN-a za prelaz u Fazu 2, od koje je upis otvoren (Pravilnik čl. 41 st. 1, 22 st. 1). */
  pragOtvaranja: number;
  /** Primalac podrške: u periodu upisa ZRNA dnevni iznos programa se ne evidentira (Pravilnik čl. 22 st. 6). */
  jePrimalacPodrske: boolean;
  upisZahtev: { poenIznos: number; status: string } | null;
  otpisZahtev: { kolicina: number; status: string } | null;
  statusZahtevi: { kolicina: number; akcija: string }[];
  delegacija: {
    aktivna: boolean;
    delegatPseudonim: string | null;
    imaZakazano: boolean;
    zakazaniPseudonim: string | null;
  } | null;
  /** Predlozi Gornjeg Kola u glasanju na kojima gledalac još nije glasao. */
  cekaGlas: number;
}

type Radnja = "upis" | "aktiviraj" | "vrati";

/**
 * Ekran ZRNO (Pravilnik čl. 21–24, 28–29, 43–44), preuređen 05.11.2026 (odluka
 * vlasnika, tri stručnjaka): stanje i zahtevi do ponoći u zaglavlju, jedna kartica
 * za promenu sa pregledom ishoda pre potvrde, glas u Gornjem Kolu, a otpis sklopljen
 * na dnu. Spisak predloga je na `/glasanje`; ovde stoji samo kartica-veza.
 *
 * 🔴 Ekran samo prati pravilo — upis, otpis, aktiviranje i delegiranje sprovode
 * rute i noćna obrada. Koeficijent je obračunski (nikad „kurs"), može da padne, a
 * upis ga ne diže (CLAUDE.md, „ZRNO nije ulaganje"); pregled kaže „oko", jer tačan
 * broj određuje koeficijent u ponoć.
 */
export default function ZrnoKlijent(props: Props) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("zrno");
  const onRefresh = useCallback(() => router.refresh(), [router]);
  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const koef = props.koeficijent.toLocaleString(intlTag(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Korisnik koji nije u Kolu ZRNO ne upisuje (čl. 22 st. 3); ako ga ima, zamrznuto je (čl. 29 st. 1).
  const korisnik = !props.smeUpis && !props.jeBezPotvrde;
  const imaZrna = props.slobodno + props.aktivno > 0;
  const ispodMinimuma = props.poenBalans < props.minimumPoenZaUpis;

  // Dugme u zaglavlju vodi na sledeći korak tog čoveka.
  let radnja: ReactNode;
  if (props.kanalAktivan && props.smeAktivirati && props.slobodno > 0) {
    radnja = <a href="#promena" className={klaseDugmeta({ varijanta: "sekundarno" })}>{t("korak_aktiviraj")}</a>;
  } else if (props.glasackaMoc > 0 && props.cekaGlas > 0) {
    radnja = <Link href="/glasanje" className={klaseDugmeta({ varijanta: "sekundarno" })}>{t("korak_glasanje")}</Link>;
  } else if (props.kanalAktivan && props.smeUpis && !ispodMinimuma && !props.upisZahtev) {
    radnja = <a href="#promena" className={klaseDugmeta({ varijanta: "sekundarno" })}>{t("korak_upis")}</a>;
  }

  const glasoviOznaka =
    props.delegacija?.aktivna && props.delegacija.delegatPseudonim
      ? t("glasova_nosi", { n: props.glasackaMoc, pseudonim: props.delegacija.delegatPseudonim })
      : t("glasova_n", { n: props.glasackaMoc });

  return (
    <Stranica>
      <NaslovStranice
        varijanta="istaknuto"
        naslov={t("naslov")}
        opis={t("opis")}
        brojke={[
          { vrednost: broj(props.slobodno), oznaka: t("zaglavlje_slobodno") },
          { vrednost: broj(props.aktivno), oznaka: t("zaglavlje_aktivno") },
          ...(props.glasackaMoc > 0 ? [{ vrednost: broj(props.glasackaMoc), oznaka: glasoviOznaka }] : []),
        ]}
        radnja={radnja}
      >
        <p className="text-sm text-white/85">{t("koeficijent_danas", { koef })}</p>
        {!korisnik && <DoPonoci {...props} onRefresh={onRefresh} />}
      </NaslovStranice>

      {/* Najviše jedno upozorenje (dizajn sistem): dok upis nije otvoren to je prag
          faze (Pravilnik čl. 41 st. 1, 22 st. 1), inače zamrznuto ZRNO (čl. 29 st. 1). */}
      {!props.kanalAktivan ? (
        <Obavestenje vrsta="upozorenje">{t("kanal_neaktivan", { prag: broj(props.pragOtvaranja) })}</Obavestenje>
      ) : props.polozaj === "zamrznuto" ? (
        <Obavestenje vrsta="upozorenje">{t("polozaj_zamrznuto")}</Obavestenje>
      ) : null}

      {/* Korisnik: samo zaključano („ZRNO upisuje ko je u Kolu."), i ništa više. */}
      {korisnik ? (
        !imaZrna && <ZakljucanModul poruka={t("zakljucano_korisnik")} />
      ) : (
        <>
          {props.kanalAktivan && <PromenaZrna {...props} onRefresh={onRefresh} />}
          <GlasSekcija {...props} onRefresh={onRefresh} />
          {props.kanalAktivan && props.smeOtpis && <OtpisSekcija {...props} onRefresh={onRefresh} />}
        </>
      )}
    </Stranica>
  );
}

// ── Do ponoći: zahtevi na čekanju, uz povlačenje ─────────────────────────────

function DoPonoci({ upisZahtev, otpisZahtev, statusZahtevi, onRefresh }: Props & { onRefresh: () => void }) {
  const t = useTranslations("zrno");
  const locale = useLocale();
  const [radi, setRadi] = useState<string | null>(null);
  const broj = (n: number) => n.toLocaleString(intlTag(locale));

  const stavke: { kljuc: string; tekst: string; putanja: string }[] = [];
  if (upisZahtev?.status === "PENDING")
    stavke.push({ kljuc: "upis", tekst: t("ceka_upis", { iznos: broj(upisZahtev.poenIznos) }), putanja: "/api/zrno/upis" });
  if (otpisZahtev?.status === "PENDING")
    stavke.push({ kljuc: "otpis", tekst: t("ceka_otpis", { kolicina: broj(otpisZahtev.kolicina) }), putanja: "/api/zrno/otpis" });
  const zbir = (akcija: string) => statusZahtevi.filter((z) => z.akcija === akcija).reduce((s, z) => s + z.kolicina, 0);
  if (zbir("ZAKLJUCAJ") > 0)
    stavke.push({ kljuc: "zakljucaj", tekst: t("ceka_aktiviranje", { kolicina: broj(zbir("ZAKLJUCAJ")) }), putanja: "/api/zrno/zakljucaj" });
  if (zbir("OTKLJUCAJ") > 0)
    stavke.push({ kljuc: "otkljucaj", tekst: t("ceka_vracanje", { kolicina: broj(zbir("OTKLJUCAJ")) }), putanja: "/api/zrno/otkljucaj" });

  if (stavke.length === 0) return null;

  async function povuci(kljuc: string, putanja: string) {
    setRadi(kljuc);
    await fetch(putanja, { method: "DELETE" }).catch(() => null);
    setRadi(null);
    onRefresh();
  }

  return (
    <div className="mt-3 rounded-kontrola bg-white/10 px-3 py-2.5">
      <p className="text-sm font-semibold text-white">{t("do_ponoci")}</p>
      <ul className="mt-1.5 space-y-1.5">
        {stavke.map((s) => (
          <li key={s.kljuc} className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/90">
            <span>{s.tekst}</span>
            <Dugme varijanta="sekundarno" velicina="sm" onClick={() => void povuci(s.kljuc, s.putanja)} disabled={radi !== null}>
              {radi === s.kljuc ? "..." : t("povuci")}
            </Dugme>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Promena: upis, aktiviranje, vraćanje u slobodno ──────────────────────────

/**
 * Jedna kartica, jedno polje i jedno dugme (Pravilnik čl. 22–23). Pregled ishoda se
 * računa dok čovek kuca, a potvrda ponavlja istu rečenicu. Dugme se ne gasi zbog
 * praznog polja — klik kaže šta fali (docs/dizajn-sistem.md).
 * 🔴 Napomena članu bez potvrde pre upisa se ne uklanja: upisom ne postaje čuvar Kola.
 */
function PromenaZrna(props: Props & { onRefresh: () => void }) {
  const {
    slobodno, aktivno, poenBalans, koeficijent, minimumPoenZaUpis, jePrimalacPodrske,
    upisZahtev, jeBezPotvrde, jeClanKolaBezZrna, smeUpis, smeAktivirati, polozaj, onRefresh,
  } = props;
  const t = useTranslations("zrno");
  const locale = useLocale();
  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const { dijalog, potvrdi } = useDijalog();

  const [radnja, setRadnja] = useState<Radnja>(smeAktivirati && slobodno > 0 ? "aktiviraj" : "upis");
  const [iznos, setIznos] = useState("");
  const [loading, setLoading] = useState(false);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);

  const n = Math.floor(Number(iznos) || 0);
  const maxUpis = najviseZaUpisZrna(poenBalans);
  const ispodMinimuma = poenBalans < minimumPoenZaUpis;

  // Zamrznuto ZRNO se ne menja (čl. 29 st. 1) — to već kaže upozorenje iznad.
  if (polozaj === "zamrznuto") return null;

  // Pregled ishoda (zaokruživanje kao u noćnoj obradi: ZRNO naniže, POEN naviše).
  const upisZrna = Math.floor(Math.min(n, maxUpis) / koeficijent);
  const upisPoen = Math.ceil(upisZrna * koeficijent);
  const posleAkt = aktivno + Math.min(n, slobodno);
  const posleVr = aktivno - Math.min(n, aktivno);

  let sadrzaj: ReactNode;
  let pregled: string | null = null;
  let maks = 0;
  let oznaka = "";
  let dugme = "";
  let putanja = "";
  let telo: Record<string, unknown> = {};

  if (radnja === "upis") {
    if (!smeUpis) sadrzaj = <p className="text-sm text-kolo-muted">{t("upis_samo_u_kolu")}</p>;
    else if (upisZahtev?.status === "PENDING") sadrzaj = <p className="text-sm text-kolo-muted">{t("upis_vec_danas")}</p>;
    else if (ispodMinimuma)
      sadrzaj = <p className="text-sm text-kolo-muted">{t("upis_ispod_minimuma", { min: broj(minimumPoenZaUpis), imas: broj(poenBalans) })}</p>;
    else {
      maks = maxUpis;
      oznaka = t("upis_oznaka");
      dugme = n > 0 ? t("upis_dugme_n", { n: broj(n) }) : t("upis_dugme");
      putanja = "/api/zrno/upis";
      telo = { poenIznos: n };
      if (n > 0) pregled = upisZrna > 0 ? t("upis_pregled", { poen: broj(upisPoen), zrna: broj(upisZrna) }) : t("upis_pregled_nula");
    }
  } else if (radnja === "aktiviraj") {
    if (jeBezPotvrde) sadrzaj = <ZakljucanModul poruka={t("zakljucano_bez_potvrde")} dugme={t("zakljucano_bez_potvrde_dugme")} />;
    else if (jeClanKolaBezZrna || !smeAktivirati) sadrzaj = <p className="text-sm text-kolo-muted">{t("aktiviranje_prvo_upis")}</p>;
    else if (slobodno <= 0) sadrzaj = <p className="text-sm text-kolo-muted">{t("nema_slobodnog")}</p>;
    else {
      maks = slobodno;
      oznaka = t("aktiviraj_oznaka");
      dugme = n > 0 ? t("aktiviraj_dugme_n", { n: broj(Math.min(n, slobodno)) }) : t("aktiviraj_dugme");
      putanja = "/api/zrno/zakljucaj";
      telo = { kolicina: n };
      if (n > 0) pregled = t("pregled_glas", { pre: broj(aktivno), posle: broj(posleAkt), gpre: mocIz(aktivno), gposle: mocIz(posleAkt) });
    }
  } else {
    if (!smeAktivirati) sadrzaj = <p className="text-sm text-kolo-muted">{t("aktiviranje_prvo_upis")}</p>;
    else if (aktivno <= 0) sadrzaj = <p className="text-sm text-kolo-muted">{t("nema_aktivnog")}</p>;
    else {
      maks = aktivno;
      oznaka = t("vrati_oznaka");
      dugme = n > 0 ? t("vrati_dugme_n", { n: broj(Math.min(n, aktivno)) }) : t("vrati_dugme");
      putanja = "/api/zrno/otkljucaj";
      telo = { kolicina: n };
      if (n > 0) pregled = t("pregled_glas", { pre: broj(aktivno), posle: broj(posleVr), gpre: mocIz(aktivno), gposle: mocIz(posleVr) });
    }
  }

  async function posalji() {
    setPoruka(null);
    if (n <= 0) { setPoruka({ text: t("upisi_broj"), ok: false }); return; }
    if (n > maks) { setPoruka({ text: t("najvise_n", { n: broj(maks) }), ok: false }); return; }
    if (!(await potvrdi({ poruka: `${pregled ?? ""} ${t("izvrsava_u_ponoc")}`.trim(), dugme: t("potvrdi") }))) return;
    setLoading(true);
    const res = await fetch(putanja, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(telo) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setPoruka({ text: res.ok ? (data.poruka ?? "") : (data.error ?? t("greska_zahtev")), ok: res.ok });
    if (res.ok) { setIznos(""); setTimeout(onRefresh, 800); }
  }

  const opcije: { vrednost: Radnja; oznaka: string }[] = [
    { vrednost: "upis", oznaka: t("radnja_upis") },
    { vrednost: "aktiviraj", oznaka: t("radnja_aktiviraj") },
    ...(smeAktivirati ? [{ vrednost: "vrati" as Radnja, oznaka: t("radnja_vrati") }] : []),
  ];

  return (
    <Kartica id="promena" className="space-y-4 scroll-mt-20">
      {dijalog}
      <NaslovSekcije>{t("promena_naslov")}</NaslovSekcije>
      <Segmenti
        oznaka={t("promena_naslov")}
        opcije={opcije}
        vrednost={radnja}
        onPromena={(v) => { setRadnja(v); setIznos(""); setPoruka(null); }}
        punaSirina
      />

      {radnja === "upis" && jeBezPotvrde && <Obavestenje vrsta="info">{t("upis_bez_potvrde_napomena")}</Obavestenje>}
      {radnja === "upis" && smeUpis && jePrimalacPodrske && (
        <Obavestenje vrsta="info">{t("upis_primalac_podrske_napomena")}</Obavestenje>
      )}

      {sadrzaj ?? (
        <div className="space-y-3">
          <Polje
            oznaka={oznaka}
            pomoc={
              radnja === "upis"
                ? t("upis_max", { max: broj(maks), procenat: PROCENAT_UPISA_ZRNA_PO_PERIODU })
                : t("najvise_n", { n: broj(maks) })
            }
          >
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={maks}
              value={iznos}
              onChange={(e) => { setIznos(e.target.value); setPoruka(null); }}
              className={KLASE_UNOSA}
            />
          </Polje>
          {pregled && <p className="text-sm text-kolo-text">{pregled}</p>}
          {radnja !== "upis" && (
            <p className="text-xs text-kolo-muted">{t("glasova_formula")}</p>
          )}
          {radnja === "upis" && (
            <p className="text-xs text-kolo-muted">
              <Pojam termin={t("koeficijent")} objasnjenje={t("koeficijent_objasnjenje")} />
            </p>
          )}
          {poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
          <Dugme punaSirina onClick={() => void posalji()} disabled={loading}>
            {loading ? "..." : dugme}
          </Dugme>
          <p className="text-xs text-kolo-muted">{t("izvrsava_u_ponoc")}</p>
        </div>
      )}
      {sadrzaj && poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
    </Kartica>
  );
}

// ── Glas u Gornjem Kolu: delegiranje i kartica ka glasanju ───────────────────

function GlasSekcija({ glasackaMoc: moja, delegacija, smeDelegirati, cekaGlas, onRefresh }: Props & { onRefresh: () => void }) {
  const t = useTranslations("zrno");
  const [pseudonim, setPseudonim] = useState("");
  const [loading, setLoading] = useState(false);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  async function delegiraj() {
    setPoruka(null);
    if (!pseudonim.trim()) { setPoruka({ text: t("upisi_pseudonim"), ok: false }); return; }
    setLoading(true);
    const res = await fetch("/api/zrno/delegiraj", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pseudonim: pseudonim.trim() }) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setPoruka({ text: res.ok ? data.poruka : (data.error ?? t("greska_delegiranje")), ok: res.ok });
    if (res.ok) { setPseudonim(""); setTimeout(onRefresh, 800); }
  }

  async function opozovi() {
    if (!(await potvrdi({ poruka: t("opozovi_pitanje"), opasno: true, dugme: t("opozovi") }))) return;
    setLoading(true);
    await fetch("/api/zrno/delegiraj", { method: "DELETE" });
    setLoading(false);
    setTimeout(onRefresh, 500);
  }

  return (
    <section className="space-y-4">
      {dijalog}
      <NaslovSekcije>
        <Pojam termin={t("glas_naslov")} objasnjenje={t("gornje_kolo_objasnjenje")} />
      </NaslovSekcije>

      <Kartica href="/glasanje" className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium text-kolo-text">
          {moja > 0 && cekaGlas > 0 ? t("glasanje_ceka", { n: cekaGlas }) : t("glasanje_veza")}
        </span>
        <span aria-hidden="true" className="text-kolo-green-700">→</span>
      </Kartica>

      {(smeDelegirati || delegacija) && (
        <Kartica className="space-y-3">
          <NaslovSekcije nivo={3}>{t("delegacija_naslov")}</NaslovSekcije>
          <p className="text-sm text-kolo-muted">{t("delegacija_opis_n", { n: moja })}</p>

          {delegacija ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-kontrola bg-kolo-gold-100 px-4 py-3 text-sm">
              <div>
                {delegacija.aktivna && (
                  <p className="font-medium text-kolo-gold-700">{t("delegat_label")} <Pseudonim>{delegacija.delegatPseudonim}</Pseudonim></p>
                )}
                {delegacija.imaZakazano ? (
                  <p className="mt-0.5 text-xs text-kolo-gold-700">
                    {delegacija.zakazaniPseudonim
                      ? t.rich("zakazana_promena", { pseudonim: delegacija.zakazaniPseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })
                      : t("zakazan_opoziv")}
                  </p>
                ) : (
                  delegacija.aktivna && <p className="mt-0.5 text-xs text-kolo-gold-700">{t("aktivna")}</p>
                )}
              </div>
              <Dugme varijanta="opasno" velicina="sm" onClick={opozovi} disabled={loading}>
                {t("opozovi")}
              </Dugme>
            </div>
          ) : (
            <>
              <Polje oznaka={t("delegat_oznaka")}>
                <input type="text" value={pseudonim} onChange={(e) => { setPseudonim(e.target.value); setPoruka(null); }} className={KLASE_UNOSA} />
              </Polje>
              {poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
              <Dugme punaSirina onClick={() => void delegiraj()} disabled={loading}>
                {loading ? "..." : t("delegiraj")}
              </Dugme>
            </>
          )}
        </Kartica>
      )}
    </section>
  );
}

// ── Otpis: sklopljen na dnu ──────────────────────────────────────────────────

/**
 * Otpis slobodnog ZRNA (čl. 23 st. 2). Razlika se ne krije, ali se ne reklamira:
 * broj POEN-a zavisi od koeficijenta u ponoć, koji se menja u oba smera.
 */
function OtpisSekcija({ slobodno, koeficijent, otpisZahtev, onRefresh }: Props & { onRefresh: () => void }) {
  const t = useTranslations("zrno");
  const locale = useLocale();
  const broj = (n: number) => n.toLocaleString(intlTag(locale));
  const { dijalog, potvrdi } = useDijalog();
  const [kolicina, setKolicina] = useState("");
  const [loading, setLoading] = useState(false);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);
  const n = Math.floor(Number(kolicina) || 0);
  const pregled = n > 0 ? t("otpis_pregled", { zrna: broj(Math.min(n, slobodno)), poen: broj(Math.floor(Math.min(n, slobodno) * koeficijent)) }) : null;

  async function posalji() {
    setPoruka(null);
    if (n <= 0) { setPoruka({ text: t("upisi_broj"), ok: false }); return; }
    if (n > slobodno) { setPoruka({ text: t("najvise_n", { n: broj(slobodno) }), ok: false }); return; }
    if (!(await potvrdi({ poruka: `${pregled ?? ""} ${t("izvrsava_u_ponoc")}`.trim(), dugme: t("potvrdi") }))) return;
    setLoading(true);
    const res = await fetch("/api/zrno/otpis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kolicina: n }) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setPoruka({ text: res.ok ? (data.poruka ?? "") : (data.error ?? t("greska_zahtev")), ok: res.ok });
    if (res.ok) { setKolicina(""); setTimeout(onRefresh, 800); }
  }

  return (
    <details className="group rounded-kartica border border-kolo-border bg-kolo-surface">
      {dijalog}
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-kolo-text">
        {t("otpis_naslov")}
        <span aria-hidden="true" className="text-kolo-muted transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="space-y-3 px-4 pb-4">
        <p className="text-sm text-kolo-muted">{t("otpis_opis_novi")}</p>
        {otpisZahtev?.status === "PENDING" ? (
          <p className="text-sm text-kolo-muted">{t("otpis_vec_danas")}</p>
        ) : slobodno <= 0 ? (
          <p className="text-sm text-kolo-muted">{t("nema_slobodnih")}</p>
        ) : (
          <>
            <Polje oznaka={t("otpis_oznaka")} pomoc={t("najvise_n", { n: broj(slobodno) })}>
              <input type="number" inputMode="numeric" min={1} max={slobodno} value={kolicina}
                onChange={(e) => { setKolicina(e.target.value); setPoruka(null); }} className={KLASE_UNOSA} />
            </Polje>
            {pregled && <p className="text-sm text-kolo-text">{pregled}</p>}
            {poruka && <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>}
            <Dugme varijanta="sekundarno" punaSirina onClick={() => void posalji()} disabled={loading}>
              {loading ? "..." : n > 0 ? t("otpis_dugme_n", { n: broj(Math.min(n, slobodno)) }) : t("otpis_dugme")}
            </Dugme>
          </>
        )}
      </div>
    </details>
  );
}
