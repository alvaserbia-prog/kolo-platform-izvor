"use client";

/**
 * Spiskovi koje dele /sistem i /pocetna — članovi, razmene i zapisi Protokola.
 *
 * 🔴 Jedna komponenta, ne dve kopije. Početna od 2026-09-22 otvara iste spiskove
 * ispod svojih kartica; prepisan spisak bi se razišao sa ovim pri prvoj sledećoj
 * izmeni (isto pravilo po kome se tabele nivoa ne prepisuju u ekrane), a razišao
 * bi se baš na pravilu vidljivosti: pseudonim u evidenciji doprinosa vidi samo
 * potvrđen član (Pravilnik čl. 67, Politika čl. 6), i to pravilo nosi `Ucesnik`.
 */

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { intlTag } from "@/lib/format";
import Pseudonim from "@/components/Pseudonim";
import KorisnikAvatar from "@/components/KorisnikAvatar";
import { profilHref } from "@/lib/profil-link";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Kartica from "@/components/ui/Kartica";
import PraznoStanje from "@/components/ui/PraznoStanje";

export interface Transakcija {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
  /**
   * `null` znači da strana NE SME da se prikaže posmatraču — spisak tada nosi
   * „—". `/api/pocetna/liste` i `/sistem` tako maskiraju strane korisniku van
   * Kola na serveru, pa pseudonimi uopšte ne stignu do pregledača.
   */
  fromPseudonim: string | null;
  fromId: string | null;
  toPseudonim: string | null;
  toId: string | null;
}

export interface Clan {
  id: string;
  pseudonim: string;
  verified: boolean;
  /** Maloletni nalog — nosi svoj pečat, ne „bez potvrde" (vidi ClanRed). */
  maloletan: boolean;
  avatar: string | null;
  balance: number;
  krug: string | null;
  donacijeRSD: number;
  rangDonacije: number;
  location: string | null;
  createdAt: string;
}

// ── Strana u zapisu ───────────────────────────────────────────────────────────

/**
 * Strana u zapisu — pseudonim, „—" ili naziv Protokola.
 *
 * Pseudonim u evidenciji doprinosa vidi SAMO potvrđen član (Pravilnik čl. 67,
 * Politika čl. 6). Nov član vidi vreme, iznos i opis zapisa, a strane ne — i to
 * u sva tri spiska na Sistemu. Do 2026-09-02 su spisak razmena i spisak prepisa
 * to poštovali, a spisak zapisa Protokola nije: linka nije bilo, ali je pseudonim
 * stajao kao običan tekst, pa je pravilo važilo na dva mesta od tri. Otud jedna
 * komponenta za svih šest mesta — da se sledeći put ne razmimoiđu.
 *
 * Sam Protokol nije osoba (`id === null`) i njegovo ime se NE krije: bez njega bi
 * red glasio „— → —" i ne bi značio ništa.
 *
 * 🔴 `pseudonim === null` je treće stanje i znači da ime NIJE ni stiglo do
 * pregledača: ruta `/api/pocetna/liste` strane maskira na serveru, pa nov član
 * pseudonim ne dobija ni u mrežnom odgovoru. Prikaz je isti („—") kao kad
 * maskira `verified`, a razlika je u tome dokle podatak stiže.
 */
export function Ucesnik({
  id,
  pseudonim,
  verified,
  className = "",
}: {
  id: string | null;
  pseudonim: string | null;
  verified: boolean;
  className?: string;
}) {
  if (pseudonim === null) return <span className={`text-kolo-muted ${className}`}>—</span>;
  if (!id) {
    return (
      <span className={`text-kolo-muted truncate ${className}`}>
        <Pseudonim>{pseudonim}</Pseudonim>
      </span>
    );
  }
  if (!verified) return <span className={`text-kolo-muted ${className}`}>—</span>;
  return (
    <Link
      href={profilHref({ id, pseudonim })}
      className={`text-kolo-green-700 hover:underline truncate ${className}`}
    >
      <Pseudonim>{pseudonim}</Pseudonim>
    </Link>
  );
}

// ── Zapisi Protokola ──────────────────────────────────────────────────────────

/**
 * Spisak zapisa Protokola — sve što nije prepis između korisnika.
 *
 * Stoji ispod kartice „Ukupno POENA" i na /sistem i na /pocetna, pa je jedna
 * komponenta: dva prepisa bi se razišla na pravilu vidljivosti iz `Ucesnik`.
 */
export function ProtokolLista({
  protokolTx,
  verified,
}: {
  protokolTx: Transakcija[];
  verified: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("sistem");
  return (
    <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
      <div className="px-5 py-3 border-b border-kolo-border flex justify-between items-center">
        <p className="text-sm font-semibold text-kolo-text">{t("protokol_tx_naslov")}</p>
        <p className="text-xs text-kolo-muted">{protokolTx.length} {t("ukupno")}</p>
      </div>
      {protokolTx.length === 0 ? (
        <div className="p-6 text-center text-sm text-kolo-muted">{t("nema_tx")}</div>
      ) : (
        <>
          <div className="hidden sm:grid grid-cols-[9rem_1fr_1.5rem_1fr_7rem] gap-x-3 px-4 py-2 border-b border-kolo-border bg-kolo-bg">
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("vreme")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("posalje")}</span>
            <span />
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("primalac")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide text-right">{t("iznos")}</span>
          </div>
          {protokolTx.map((tx, i) => (
            <div
              key={tx.id}
              className={`px-4 py-2.5 ${i < protokolTx.length - 1 ? "border-b border-kolo-border/30" : ""}`}
            >
              {/* Desktop grid */}
              <div className="hidden sm:grid grid-cols-[9rem_1fr_1.5rem_1fr_7rem] gap-x-3 items-center">
                <p className="text-sm text-kolo-muted leading-tight">
                  {new Date(tx.createdAt).toLocaleString(intlTag(locale), {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                <div className="min-w-0">
                  <Ucesnik id={tx.fromId} pseudonim={tx.fromPseudonim} verified={verified} className="text-base block" />
                </div>
                <span className="text-base font-bold text-kolo-muted text-center leading-none">→</span>
                <div className="min-w-0">
                  <Ucesnik id={tx.toId} pseudonim={tx.toPseudonim} verified={verified} className="text-base block" />
                </div>
                <span className="text-base font-bold text-kolo-text text-right">
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
              {tx.description && (
                <p className="mt-0.5 text-xs text-kolo-muted/70 truncate sm:pl-[9.75rem]">{tx.description}</p>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Članovi ───────────────────────────────────────────────────────────────────

function RangTooltip({ rang, label }: { rang: number; label: string }) {
  return (
    <span className="relative group/tt inline-block cursor-default">
      <span className="tabular-nums">{rang}</span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-kolo-text text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/tt:opacity-100 transition-opacity pointer-events-none z-20">
        {label}
      </span>
    </span>
  );
}

// ── Članovi ───────────────────────────────────────────────────────────────────

const ClanRed = memo(function ClanRed({
  c,
  t,
  jeZadnji,
}: {
  c: Clan;
  t: ReturnType<typeof useTranslations>;
  jeZadnji: boolean;
}) {
  const tc = useTranslations("common");
  const locale = useLocale();
  return (
    <div className={!jeZadnji ? "border-b border-kolo-border/30" : ""}>
      {/* Desktop red */}
      <div className="hidden sm:grid grid-cols-[1fr_1fr_90px_72px_100px] gap-4 px-5 py-3 items-center text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <KorisnikAvatar avatar={c.avatar} pseudonim={c.pseudonim} userId={c.id} size={28} />
          <Link
            href={profilHref(c)}
            className="font-medium text-kolo-green-700 hover:underline truncate"
          >
            <Pseudonim>{c.pseudonim}</Pseudonim>
          </Link>
          {/* 🔴 Dete dobija SVOJ pečat, ne „?". Maloletni nalog jeste neverifikovan
              i uvek će biti — u lanac potvrda ne sme da uđe (Pravilnik o učešću
              dece čl. 15) — pa bi mu oznaka za novog člana saopštavala nešto što
              se nikad neće promeniti. Isti razlog kao pečat na Pijaci. */}
          {c.maloletan ? (
            <span className="shrink-0 text-[11px] bg-kolo-green-100 text-kolo-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">{t("clan_dete")}</span>
          ) : c.verified ? (
            <span className="shrink-0 text-xs bg-kolo-green-100 text-kolo-green-700 px-1.5 py-0.5 rounded font-medium">✓</span>
          ) : (
            <span className="shrink-0 text-xs bg-kolo-bg text-kolo-muted px-1.5 py-0.5 rounded font-medium">?</span>
          )}
        </div>
        <span className="text-sm text-kolo-muted truncate">{c.location ?? "—"}</span>
        <span className="text-right text-sm font-semibold text-kolo-text">
          {c.balance.toLocaleString(intlTag(locale))}
        </span>
        <div className="flex items-center justify-end gap-1 text-sm text-kolo-muted">
          <RangTooltip
            rang={c.rangDonacije}
            label={`${t("rang_tooltip", { rang: c.rangDonacije, rsd: c.donacijeRSD.toLocaleString(intlTag(locale)) })}`}
          />
        </div>
        <span className="text-right text-sm text-kolo-muted">
          {new Date(c.createdAt).toLocaleDateString(intlTag(locale), {
            day: "2-digit", month: "2-digit", year: "2-digit",
          })}
        </span>
      </div>
      {/* Mobilna kartica */}
      <div className="sm:hidden px-4 py-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <KorisnikAvatar avatar={c.avatar} pseudonim={c.pseudonim} userId={c.id} size={28} />
            <Link href={profilHref(c)} className="font-semibold text-kolo-green-700 hover:underline truncate">
              <Pseudonim>{c.pseudonim}</Pseudonim>
            </Link>
            {c.maloletan ? (
              <span className="text-[11px] bg-kolo-green-100 text-kolo-green-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">{t("clan_dete")}</span>
            ) : c.verified ? (
              <span className="text-xs bg-kolo-green-100 text-kolo-green-700 px-1.5 py-0.5 rounded font-medium">✓</span>
            ) : (
              <span className="text-xs bg-kolo-bg text-kolo-muted px-1.5 py-0.5 rounded font-medium">?</span>
            )}
          </div>
          <span className="text-sm font-bold text-kolo-text">
            {c.balance.toLocaleString(intlTag(locale))} {tc("poen")}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-kolo-muted">
          <span>{t("rang_label")} {c.rangDonacije}</span>
          <span className="ml-auto">
            {new Date(c.createdAt).toLocaleDateString(intlTag(locale), {
              day: "2-digit", month: "2-digit", year: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
});

export function ClanoviSekcija({
  clanovi,
  verified,
}: {
  clanovi: Clan[];
  verified: boolean;
}) {
  const t = useTranslations("sistem");
  const [pretraga, setPretraga] = useState("");

  const filtrirani = useMemo(
    () =>
      clanovi.filter((c) =>
        c.pseudonim.toLowerCase().includes(pretraga.toLowerCase())
      ),
    [clanovi, pretraga]
  );

  if (!verified) {
    return (
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-8 text-center shadow-kartica">
        <p className="text-sm text-kolo-muted mb-3">
          {t("clanovi_pregled_blokiran")}
        </p>
        <Link
          href="/verifikacija"
          className={klaseDugmeta()}
        >
          {t("verifikuj_dugme_link")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={pretraga}
        onChange={(e) => setPretraga(e.target.value)}
        placeholder={t("pretrazi_pseudonim")}
        aria-label={t("pretrazi_pseudonim")}
        className={KLASE_UNOSA}
      />
      <div className="text-xs text-kolo-muted">
        {filtrirani.length} {filtrirani.length === 1 ? t("clan_count_1") : t("clan_count_vise")}
      </div>
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-[1fr_1fr_90px_72px_100px] gap-4 px-5 py-2.5 bg-kolo-bg border-b border-kolo-border text-xs font-semibold text-kolo-muted">
          <span>{t("col_pseudonim")}</span>
          <span>{t("col_lokacija")}</span>
          <span className="text-right">{t("col_balans")}</span>
          <span className="text-right">{t("col_rang")}</span>
          <span className="text-right">{t("col_registracija")}</span>
        </div>
        {filtrirani.length === 0 ? (
          <div className="p-6 text-center text-sm text-kolo-muted">
            {t("nema_rezultata")}
          </div>
        ) : (
          filtrirani.map((c, i) => (
            <ClanRed
              key={c.id}
              c={c}
              t={t}
              jeZadnji={i === filtrirani.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Razmene (prepisi između korisnika) ────────────────────────────────────────

/**
 * Sekcija kartice „Ukupno razmena" — ISKLJUČIVO prepisi između korisnika.
 *
 * Filter (sve | Protokol | između članova) je uklonjen: kartica iznad broji samo
 * prepise, pa je spisak koji uz nju ume da prikaže i zapise Protokola govorio
 * nešto drugo nego broj na koji je čovek kliknuo. Zapisi Protokola imaju svoje
 * mesto — karticu „Ukupno POENA" (opticaj).
 */
export function TransakcijeSekcija({
  razmene,
  verified,
}: {
  razmene: Transakcija[];
  verified: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("sistem");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="ml-auto text-xs text-kolo-muted self-center">
          {t("transakcija_count", { count: razmene.length })}
        </span>
      </div>

      {razmene.length === 0 ? (
        <Kartica>
          <PraznoStanje naslov={t("nema_tx")} />
        </Kartica>
      ) : (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
          {/* Zaglavlje */}
          <div className="hidden sm:grid grid-cols-[9rem_1fr_1.5rem_1fr_7rem] gap-x-3 px-4 py-2 border-b border-kolo-border bg-kolo-bg">
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("vreme")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("posalje")}</span>
            <span />
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide">{t("primalac")}</span>
            <span className="text-xs font-semibold text-kolo-muted uppercase tracking-wide text-right">{t("iznos")}</span>
          </div>
          {razmene.map((tx, i) => (
            <div
              key={tx.id}
              className={`px-4 py-2.5 ${i < razmene.length - 1 ? "border-b border-kolo-border/30" : ""}`}
            >
              {/* Desktop grid */}
              <div className="hidden sm:grid grid-cols-[9rem_1fr_1.5rem_1fr_7rem] gap-x-3 items-center">
                {/* Vreme */}
                <p className="text-sm text-kolo-muted leading-tight">
                  {new Date(tx.createdAt).toLocaleString(intlTag(locale), {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
                {/* Pošiljalac */}
                <div className="min-w-0">
                  <Ucesnik id={tx.fromId} pseudonim={tx.fromPseudonim} verified={verified} className="text-base block" />
                </div>
                {/* Strelica */}
                <span className="text-base font-bold text-kolo-muted text-center leading-none">→</span>
                {/* Primalac */}
                <div className="min-w-0">
                  <Ucesnik id={tx.toId} pseudonim={tx.toPseudonim} verified={verified} className="text-base block" />
                </div>
                {/* Iznos */}
                <span className="text-base font-bold text-kolo-text text-right">
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
              {/* Opis transakcije */}
              {tx.description && (
                <p className="mt-0.5 text-xs text-kolo-muted/70 truncate sm:pl-[9.75rem]">{tx.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
