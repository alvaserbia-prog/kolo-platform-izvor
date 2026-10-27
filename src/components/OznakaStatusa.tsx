/**
 * Oznaka statusa učesnika (set 4.8.2) — JEDINO mesto na ekranu koje imenuje status.
 *
 * Statusi i njihovi nazivi žive u namespace-u `status` (`messages/sr.json`); ključ
 * daje `porukaStatusa()` iz `@/lib/status-ucesnika-pravila`, a status `statusUcesnika()`
 * na serveru. Komponenta NE prima `tipKorisnika`, `verified` ni indeks: ko bi joj
 * predao sirova polja, sam bi izvodio status — a pravilo stoji na jednom mestu.
 * Brana: `__tests__/oznaka-statusa-izvor.test.ts`.
 *
 * 🔴 Dete se proverava PRVO i nikad nije „korisnik" — to drži `statusUcesnika()`
 * (dete na čekanju, dete sa roditeljem, dete Kola), a ovde se dete i boji
 * zasebno. Uz dete kartica kaže na šta se čeka (deca čl. 5 st. 4).
 *
 * 🔴 Lestvica se ne prikazuje kao rang: nema koraka, procenta, „nivoa" ni boje koja
 * raste. Korisnik je jedna boja (još nije u Kolu), svi u Kolu druga, deca treća —
 * status kaže šta ko sme (Pravilnik čl. 2, 28–29), ne ko je „viši".
 *
 * Bez `"use client"`: `useTranslations` radi i u serverskoj komponenti, pa se ista
 * oznaka crta i na serverskim stranicama i u klijentskim ekranima.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { jeDete, porukaStatusa, type StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import type { NaStaSeCeka } from "@/lib/deca-pravila";

/** Položaj ZRNA koji status menja (Pravilnik čl. 22 st. 3, 29). */
export type ZrnoPolozaj = "ZAMRZNUTO" | "BEZ_POTVRDE" | null;

type Props = {
  status: StatusUcesnika;
  /**
   * `oznaka` — samo naziv u pilulici; `kartica` — naziv, opis i ono što status
   * nosi; `kratko` — naziv, jedna rečenica i veza na Potvrde, gde stoji puna
   * kartica (za stranice na kojima je puna kartica samo ponavljanje, npr. Sistem).
   * 🔴 Obavezne rečenice člana bez potvrde nosi SAMO `kartica`; `kratko` se ne
   * koristi tamo gde ih pravilo traži (Profil, Početna, Potvrde).
   */
  varijanta?: "oznaka" | "kartica" | "kratko";
  /** Kartica: naslov „Tvoj status" (samo kad učesnik gleda sebe). */
  svoj?: boolean;
  /** Kartica: opis statusa iz `status.<kljuc>_opis`. Podrazumevano da. */
  opis?: boolean;
  /** Dete: na šta nalog čeka (`naStaSeCeka` iz `deca-pravila`). */
  naStaSeCeka?: NaStaSeCeka | null;
  /** ZRNO korisnika je zamrznuto, odnosno član bez potvrde ga ne aktivira. */
  zrno?: ZrnoPolozaj;
  /** Kartica korisnika: veza „Želim da me neko nazove". */
  vezaNazove?: boolean;
  /** Kartica: sitan tekst ispod naziva (npr. podnaslov stranice Potvrde). */
  podnaslov?: string;
  /** Kartica: dodatni sadržaj na dnu (dugmad stranice koja je crta). */
  children?: ReactNode;
  className?: string;
};

const CEKA_KLJUC: Record<NaStaSeCeka, string> = {
  RODITELJ: "ceka_roditelj",
  RODITELJ_U_KOLO: "ceka_roditelj_u_kolo",
  POTVRDA_POSTOJANJA: "ceka_potvrda_postojanja",
};

function stilOznake(status: StatusUcesnika): string {
  if (jeDete(status)) return "bg-deca-nebo-100 text-deca-nebo-600";
  if (status === "KORISNIK") return "bg-kolo-bg text-kolo-muted border border-kolo-border";
  return "bg-kolo-green-100 text-kolo-green-700";
}

export default function OznakaStatusa({
  status,
  varijanta = "oznaka",
  svoj = false,
  opis = true,
  naStaSeCeka = null,
  zrno = null,
  vezaNazove = false,
  podnaslov,
  children,
  className = "",
}: Props) {
  const t = useTranslations("status");
  const kljuc = porukaStatusa(status);

  const oznaka = (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${stilOznake(status)}${
        varijanta === "oznaka" ? ` ${className}` : ""
      }`}
    >
      {t(kljuc)}
    </span>
  );

  if (varijanta === "oznaka") return oznaka;

  if (varijanta === "kratko") {
    return (
      <section className={`rounded-kartica border border-kolo-border bg-kolo-surface px-5 py-4 shadow-kartica flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
        {oznaka}
        <p className="min-w-0 flex-1 text-sm text-kolo-text">{t(`${kljuc}_opis`)}</p>
        <Link href="/verifikacija" className="inline-flex min-h-10 items-center text-sm font-semibold text-kolo-green-700 hover:underline">
          {t("vise_o_statusu")} →
        </Link>
      </section>
    );
  }

  const ceka = jeDete(status) && status !== "DETE_KOLA" ? naStaSeCeka : null;

  return (
    <section className={`rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica ${className}`}>
      {svoj && <p className="text-xs font-medium uppercase tracking-wide text-kolo-muted mb-2">{t("naslov")}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {oznaka}
        {podnaslov && <span className="text-xs text-kolo-muted">{podnaslov}</span>}
      </div>

      {opis && <p className="mt-3 text-sm text-kolo-text">{t(`${kljuc}_opis`)}</p>}

      {ceka && (
        <div className="mt-3 rounded-xl bg-deca-sunce-100 px-3 py-2 text-sm text-deca-sunce-ink">
          <span className="font-semibold">{t("ceka_naslov")}: </span>
          {t(CEKA_KLJUC[ceka])}
        </div>
      )}

      {/* Obavezne rečenice za člana bez potvrde (Pravilnik čl. 2, 28; Uslovi čl. 2;
          dokaz stvarnosti čl. 6 i 19). Ne skraćuju se i ne sklanjaju iza „više". */}
      {status === "CLAN_BEZ_POTVRDE" && (
        <div className="mt-3 space-y-2 text-sm text-kolo-text">
          <p className="font-medium">{t("bez_potvrde_ne_mozes")}</p>
          <p className="text-kolo-muted">
            {t("bez_potvrde_takodje")}{" "}
            {[
              t("bez_potvrde_ne_spisak"),
              t("bez_potvrde_ne_dete"),
              t("bez_potvrde_ne_preporuka"),
              t("bez_potvrde_ne_zrno"),
            ].join(", ")}
            .
          </p>
          <p>{t("nista_se_ne_placa")}</p>
          <p>{t("uvodilac_ne_dobija")}</p>
          <p>{t("kolo_nije_clanstvo")}</p>
          <p className="font-medium text-kolo-green-700">{t("potvrdi_te_clan_kola")}</p>
        </div>
      )}

      {zrno === "BEZ_POTVRDE" && status === "CLAN_BEZ_POTVRDE" && (
        <p className="mt-3 rounded-xl bg-kolo-gold-100 px-3 py-2 text-sm text-kolo-gold-700">{t("zrno_bez_potvrde")}</p>
      )}
      {zrno === "ZAMRZNUTO" && status === "KORISNIK" && (
        <p className="mt-3 rounded-xl bg-kolo-gold-100 px-3 py-2 text-sm text-kolo-gold-700">{t("zrno_zamrznuto")}</p>
      )}

      {vezaNazove && status === "KORISNIK" && (
        <Link
          href="/kontaktiraj-nas"
          className="mt-4 inline-block rounded-xl bg-kolo-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-kolo-green-900 transition-colors"
        >
          {t("nazove_veza")}
        </Link>
      )}

      {children}
    </section>
  );
}
