"use client";

import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import NaslovStranice from "@/components/ui/NaslovStranice";
import StatKartica from "@/components/ui/StatKartica";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";
import { useState, useCallback } from "react";
import { intlTag } from "@/lib/format";
import { najviseZaUpisZrna } from "@/lib/zrno-upis-pravila";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import GlasanjeKlijent from "@/app/(app)/glasanje/GlasanjeKlijent";
import type { PrikazPredloga } from "@/lib/protokol/glasanje";

import Pojam from "@/components/Pojam";
import Pseudonim from "@/components/Pseudonim";

// Isti oblik kao `prikazPredloga` (Pravilnik o Gornjem Kolu čl. 9–11, 19).
type Predlog = PrikazPredloga;

interface Props {
  slobodno: number;
  aktivno: number;
  glasackaMoc: number;
  poenBalans: number;
  koeficijent: number;
  kanalAktivan: boolean;
  isVerified: boolean;
  /** Set 4.8.2: položaj ZRNA koji se objašnjava (`zamrznuto` / `bez_potvrde`). */
  polozaj: "zamrznuto" | "bez_potvrde" | null;
  /** Član bez potvrde: upisom ne postaje čuvar Kola (Pravilnik čl. 22 st. 3, 28 st. 3). */
  jeBezPotvrde: boolean;
  /** Upis: član bez potvrde i član Kola (Pravilnik čl. 22 st. 3). */
  smeUpis: boolean;
  /** Otpis slobodnog: čuvar Kola i član bez potvrde (čl. 23 st. 2, 29 st. 1). */
  smeOtpis: boolean;
  /** Aktiviranje i vraćanje u slobodno: čuvar Kola (čl. 23 st. 2, 29 st. 2). */
  smeAktivirati: boolean;
  /** Delegiranje: čuvar Kola (čl. 44 st. 2; Gornje Kolo čl. 14). */
  smeDelegirati: boolean;
  minimumPoenZaUpis: number;
  upisZahtev: { poenIznos: number; status: string } | null;
  otpisZahtev: { kolicina: number; status: string } | null;
  statusZahtevi: { kolicina: number; akcija: string }[];
  delegacija: {
    aktivna: boolean;
    delegatPseudonim: string | null;
    imaZakazano: boolean;
    zakazaniPseudonim: string | null;
  } | null;
  predlozi: Predlog[];
  /** Predlog Gornjem Kolu podnosi svaki učesnik (Gornje Kolo čl. 9 st. 1). */
  smePredloziti: boolean;
}

export default function ZrnoKlijent(props: Props) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("zrno");
  const onRefresh = useCallback(() => router.refresh(), [router]);

  return (
    <div className="space-y-6">
      <NaslovStranice
        naslov={t("naslov")}
        opis={t("opis")}
        radnja={
          props.glasackaMoc > 0 ? (
            <div className="bg-kolo-gold-100 border border-kolo-gold-600 rounded-kontrola px-4 py-2 text-center">
              <p className="text-sm font-bold text-kolo-gold-700">{props.glasackaMoc}</p>
              <p className="text-xs text-kolo-gold-700">{t("glasova")}</p>
            </div>
          ) : undefined
        }
      />

      {/* Stanje */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatKartica
          oznaka={t("slobodno")}
          vrednost={props.slobodno.toLocaleString(intlTag(locale))}
          podnaslov={t("slobodno_opis")}
        />
        <StatKartica
          oznaka={t("aktivno")}
          vrednost={props.aktivno.toLocaleString(intlTag(locale))}
          podnaslov={t("aktivno_opis")}
        />
        <StatKartica
          oznaka={
            <Pojam
              termin={t("koeficijent")}
              objasnjenje={t("koeficijent_objasnjenje")}
            />
          }
          vrednost={props.koeficijent.toLocaleString(intlTag(locale), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          podnaslov={t("koeficijent_opis")}
        />
      </div>

      {/* Glasačka moć formula */}
      {props.aktivno > 0 && (
        <Obavestenje vrsta="info">
          {t("glasacka_moc_formula", { aktivno: props.aktivno, moc: props.glasackaMoc })}
        </Obavestenje>
      )}

      {props.polozaj && (
        <Obavestenje vrsta="upozorenje">
          {t(props.polozaj === "zamrznuto" ? "polozaj_zamrznuto" : "polozaj_bez_potvrde")}
        </Obavestenje>
      )}

      {!props.kanalAktivan && (
        <Obavestenje vrsta="upozorenje">
          {t("kanal_neaktivan")}
        </Obavestenje>
      )}

      {/* Upis / otpis / aktiviranje */}
      <UpisOtpisSekcija {...props} onRefresh={onRefresh} />

      {/* Glasanje sekcija */}
      <GlasanjeKlijent predlozi={props.predlozi} mojaGlasackaMoc={props.glasackaMoc} smePredloziti={props.smePredloziti} />

      {/* Delegacija */}
      <DelegacijaSekcija {...props} onRefresh={onRefresh} />
    </div>
  );
}

// ── Upis, otpis i aktiviranje ─────────────────────────────────

/**
 * Ekran za upis i otpis ZRNA (Pravilnik čl. 21–24).
 *
 * Do R-01 ovog ekrana NIJE bilo — stranica je prikazivala stanja, glasanje i
 * delegaciju, a rute `/api/zrno/{upis,otpis,zakljucaj,otkljucaj}` su postojale bez
 * ijedne ulazne tačke. Upis je odlukom B otvoren i identifikovanom članu, pa je
 * ekran postao neophodan: bez njega to pravo nema gde da se ostvari.
 *
 * Set 4.8.2: ZRNO upisuje član Kola i član bez potvrde (Pravilnik čl. 22 st. 3);
 * član bez potvrde ga ne aktivira dok ne bude potvrđen, ali slobodno ZRNO sme da
 * otpiše (čl. 23 st. 2). Korisniku je upisano ZRNO zamrznuto (čl. 29 st. 1).
 * 🔴 Napomena članu bez potvrde pre upisa se ne uklanja: upisom ne postaje čuvar
 * Kola. Ekran samo prati pravilo — sprovode ga rute i noćna obrada.
 */
function UpisOtpisSekcija({
  slobodno,
  aktivno,
  poenBalans,
  koeficijent,
  kanalAktivan,
  minimumPoenZaUpis,
  upisZahtev,
  otpisZahtev,
  statusZahtevi,
  jeBezPotvrde,
  smeUpis,
  smeOtpis,
  smeAktivirati,
  onRefresh,
}: Props & { onRefresh: () => void }) {
  const t = useTranslations("zrno");
  const locale = useLocale();
  const [poenIznos, setPoenIznos] = useState("");
  const [otpisKolicina, setOtpisKolicina] = useState("");
  const [statusKolicina, setStatusKolicina] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);

  const maxUpis = najviseZaUpisZrna(poenBalans);
  const ispodMinimuma = poenBalans < minimumPoenZaUpis;

  const posalji = useCallback(
    async (putanja: string, telo: Record<string, unknown>, kljuc: string) => {
      setLoading(kljuc);
      setPoruka(null);
      const res = await fetch(putanja, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telo),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(null);
      setPoruka({ text: res.ok ? (data.poruka ?? "") : (data.error ?? t("greska_zahtev")), ok: res.ok });
      if (res.ok) {
        setPoenIznos("");
        setOtpisKolicina("");
        setStatusKolicina("");
        setTimeout(onRefresh, 1200);
      }
    },
    [onRefresh, t]
  );

  if (!kanalAktivan) return null;

  const brojCls = KLASE_UNOSA;
  const napomenaCls = "text-xs px-3 py-2 rounded-kontrola bg-kolo-bg text-kolo-muted";

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-kolo-muted">{t("upravljanje_naslov")}</p>

      {poruka && (
        <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>
      )}

      {/* Dve grupe (C2, uloga 1, 24.10.2026): „Upis i otpis" za svakoga ko upisuje
          ZRNO, a „Glas" (aktiviranje, pa glasanje i delegacija ispod) za čuvara Kola. */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* ── Upis ── */}
        <Kartica className="space-y-3">
          <p className="text-sm font-semibold text-kolo-muted">{t("upis_naslov")}</p>
          <p className="text-xs text-kolo-muted">{t("upis_opis")}</p>

          {jeBezPotvrde ? (
            <Obavestenje vrsta="upozorenje">{t("upis_bez_potvrde_napomena")}</Obavestenje>
          ) : null}
          {!smeUpis ? (
            <p className={napomenaCls}>{t("upis_samo_verifikovan")}</p>
          ) : upisZahtev && upisZahtev.status === "PENDING" ? (
            <Obavestenje vrsta="info">
              {t("upis_na_cekanju", { iznos: upisZahtev.poenIznos.toLocaleString(intlTag(locale)) })}
            </Obavestenje>
          ) : ispodMinimuma ? (
            <p className={napomenaCls}>
              {t("upis_minimum", { min: minimumPoenZaUpis.toLocaleString(intlTag(locale)) })}
            </p>
          ) : (
            <>
              <p className="text-xs text-kolo-muted">
                {t("upis_max", { max: maxUpis.toLocaleString(intlTag(locale)) })}
              </p>
              <input
                type="number"
                min={1}
                max={maxUpis}
                value={poenIznos}
                onChange={(e) => setPoenIznos(e.target.value)}
                placeholder={t("upis_placeholder")}
                aria-label={t("upis_placeholder")}
                className={brojCls}
              />
              <Dugme
                punaSirina
                onClick={() => void posalji("/api/zrno/upis", { poenIznos: Number(poenIznos) }, "upis")}
                disabled={loading !== null || !poenIznos || Number(poenIznos) <= 0}
              >
                {loading === "upis" ? "..." : t("upis_dugme")}
              </Dugme>
            </>
          )}
        </Kartica>

        {/* ── Otpis ── */}
        <Kartica className="space-y-3">
          <p className="text-sm font-semibold text-kolo-muted">{t("otpis_naslov")}</p>
          <p className="text-xs text-kolo-muted">{t("otpis_opis")}</p>
          {!smeOtpis ? (
            <p className={napomenaCls}>{t("otpis_zamrznuto")}</p>
          ) : otpisZahtev && otpisZahtev.status === "PENDING" ? (
            <Obavestenje vrsta="info">
              {t("otpis_na_cekanju", { kolicina: otpisZahtev.kolicina.toLocaleString(intlTag(locale)) })}
            </Obavestenje>
          ) : slobodno <= 0 ? (
            <p className={napomenaCls}>{t("nema_slobodnih")}</p>
          ) : (
            <>
              <p className="text-xs text-kolo-muted">
                {t("otpis_priblizno", {
                  poen: Math.floor(Number(otpisKolicina || 0) * koeficijent).toLocaleString(intlTag(locale)),
                })}
              </p>
              <input
                type="number"
                min={1}
                max={slobodno}
                value={otpisKolicina}
                onChange={(e) => setOtpisKolicina(e.target.value)}
                placeholder={t("otpis_placeholder")}
                aria-label={t("otpis_placeholder")}
                className={brojCls}
              />
              <Dugme
                punaSirina
                onClick={() => void posalji("/api/zrno/otpis", { kolicina: Number(otpisKolicina) }, "otpis")}
                disabled={loading !== null || !otpisKolicina || Number(otpisKolicina) <= 0}
              >
                {loading === "otpis" ? "..." : t("otpis_dugme")}
              </Dugme>
            </>
          )}
        </Kartica>

      </div>

      <p className="pt-2 text-sm font-semibold text-kolo-muted">
        <Pojam termin={t("glas_naslov")} objasnjenje={t("gornje_kolo_objasnjenje")} />
      </p>
      <div className="grid gap-4">
        {/* ── Aktiviranje / deaktiviranje ── */}
        <Kartica className="space-y-3">
          <p className="text-sm font-semibold text-kolo-muted">{t("status_naslov")}</p>
          <p className="text-xs text-kolo-muted">{t("status_opis")}</p>
          {statusZahtevi.length > 0 && (
            <div className="space-y-1">
              {statusZahtevi.map((z, i) => (
                <Obavestenje key={i} vrsta="info">
                  {t("status_na_cekanju", {
                    akcija: z.akcija === "ZAKLJUCAJ" ? t("akcija_aktiviraj") : t("akcija_deaktiviraj"),
                    kolicina: z.kolicina.toLocaleString(intlTag(locale)),
                  })}
                </Obavestenje>
              ))}
            </div>
          )}
          {!smeAktivirati ? (
            <p className={napomenaCls}>{t("aktiviranje_samo_cuvar")}</p>
          ) : slobodno > 0 || aktivno > 0 ? (
            <>
              <input
                type="number"
                min={1}
                value={statusKolicina}
                onChange={(e) => setStatusKolicina(e.target.value)}
                placeholder={t("status_placeholder")}
                aria-label={t("status_placeholder")}
                className={brojCls}
              />
              <div className="grid grid-cols-2 gap-2">
                <Dugme
                  punaSirina
                  onClick={() => void posalji("/api/zrno/zakljucaj", { kolicina: Number(statusKolicina) }, "zakljucaj")}
                  disabled={loading !== null || !statusKolicina || Number(statusKolicina) <= 0 || slobodno <= 0}
                >
                  {loading === "zakljucaj" ? "..." : t("zakljucaj", { max: slobodno })}
                </Dugme>
                <Dugme
                  varijanta="sekundarno"
                  punaSirina
                  onClick={() => void posalji("/api/zrno/otkljucaj", { kolicina: Number(statusKolicina) }, "otkljucaj")}
                  disabled={loading !== null || !statusKolicina || Number(statusKolicina) <= 0 || aktivno <= 0}
                >
                  {loading === "otkljucaj" ? "..." : t("otkljucaj", { max: aktivno })}
                </Dugme>
              </div>
            </>
          ) : (
            <p className={napomenaCls}>{t("nema_zrna")}</p>
          )}
        </Kartica>
      </div>
    </div>
  );
}

// ── Delegacija ────────────────────────────────────────────────────────────────

function DelegacijaSekcija({ glasackaMoc: moja, delegacija, smeDelegirati, onRefresh }: Props & { onRefresh: () => void }) {
  const t = useTranslations("zrno");
  const [pseudonim, setPseudonim] = useState("");
  const [loading, setLoading] = useState(false);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  async function delegiraj() {
    if (!pseudonim.trim()) return;
    setLoading(true); setPoruka(null);
    const res = await fetch("/api/zrno/delegiraj", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pseudonim: pseudonim.trim() }) });
    const data = await res.json();
    setLoading(false);
    setPoruka({ text: res.ok ? data.poruka : (data.error ?? t("greska_delegiranje")), ok: res.ok });
    if (res.ok) { setPseudonim(""); setTimeout(onRefresh, 1200); }
  }

  async function opozovi() {
    if (!(await potvrdi({ poruka: t("opozovi_pitanje"), opasno: true, dugme: t("opozovi") }))) return;
    setLoading(true);
    await fetch("/api/zrno/delegiraj", { method: "DELETE" });
    setLoading(false);
    setTimeout(onRefresh, 500);
  }

  return (
    <div className="space-y-4">
      {dijalog}
      <Kartica className="space-y-3">
        <p className="text-sm font-semibold text-kolo-muted">{t("delegacija_naslov")}</p>
        <p className="text-xs text-kolo-muted">
          {t("delegacija_opis", { moc: moja })}
        </p>

        {delegacija && (
          <div className="bg-kolo-gold-100 rounded-kontrola px-4 py-3 text-sm flex flex-wrap gap-2 justify-between items-center">
            <div>
              {delegacija.aktivna && (
                <p className="font-medium text-kolo-gold-700">{t("delegat_label")} <Pseudonim>{delegacija.delegatPseudonim}</Pseudonim></p>
              )}
              {delegacija.imaZakazano ? (
                <p className="text-xs text-kolo-gold-700 mt-0.5">
                  {delegacija.zakazaniPseudonim
                    ? t.rich("zakazana_promena", { pseudonim: delegacija.zakazaniPseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })
                    : t("zakazan_opoziv")}
                </p>
              ) : (
                delegacija.aktivna && <p className="text-xs text-kolo-gold-700 mt-0.5">{t("aktivna")}</p>
              )}
            </div>
            <Dugme varijanta="opasno" velicina="sm" onClick={opozovi} disabled={loading}>
              {t("opozovi")}
            </Dugme>
          </div>
        )}

        {!delegacija && !smeDelegirati && (
          <p className="text-xs px-3 py-2 rounded-kontrola bg-kolo-bg text-kolo-muted">{t("delegacija_samo_cuvar")}</p>
        )}

        {!delegacija && smeDelegirati && (
          <>
            <input type="text" value={pseudonim} onChange={(e) => setPseudonim(e.target.value)}
              placeholder={t("delegat_placeholder")}
              aria-label={t("delegat_placeholder")}
              className={KLASE_UNOSA} />
            {poruka && (
              <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>{poruka.text}</Obavestenje>
            )}
            <Dugme punaSirina onClick={delegiraj} disabled={loading || !pseudonim.trim()}>
              {loading ? "..." : t("delegiraj")}
            </Dugme>
          </>
        )}
      </Kartica>
    </div>
  );
}
