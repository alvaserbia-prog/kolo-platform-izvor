"use client";

import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import { klaseDugmeta } from "@/components/ui/Dugme";
import NaslovStranice from "@/components/ui/NaslovStranice";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useState } from "react";
import { intlTag } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

interface OglasItem {
  id: string;
  title: string;
  description: string;
  source: string;
  predlozeniPoen: number;
  saOdobravanjem: boolean;
  positions: number;
  deadline: string | null;
  rokIzvrsenja: string | null;
  statusZadatka: string;
  zadruzni: boolean;
  krugName: string | null;
  odobreniClanovi: number;
  createdAt: string;
  mojaPrijava: string | null;
}

// Srpska promena po broju (bez ICU plural sintakse — lat2cyr transliteracija je ne podržava):
// 1, 21, 31… → „aktivan zadatak"; 2–4, 22–24… → „aktivna zadatka"; ostalo → „aktivnih zadataka".
function brojZadatakaKljuc(n: number): "aktivan_zadatak" | "aktivna_zadatka" | "aktivnih_zadataka" {
  const jed = n % 10, sto = n % 100;
  if (jed === 1 && sto !== 11) return "aktivan_zadatak";
  if (jed >= 2 && jed <= 4 && (sto < 12 || sto > 14)) return "aktivna_zadatka";
  return "aktivnih_zadataka";
}

const sourceCls: Record<string, string> = {
  FONDACIJA: "bg-kolo-green-100 text-kolo-green-700",
  KRUG: "bg-kolo-info-light text-kolo-info",
  PROJEKAT: "bg-purple-50 text-purple-700",
};

export default function DoprinosOglasiKlijent({ oglasi, isVerified, ulazZaPotvrde = false }: { oglasi: OglasItem[]; isVerified: boolean; ulazZaPotvrde?: boolean }) {
  const t = useTranslations("doprinosOglasi");

  const prijavaStatusBadge: Record<string, { label: string; cls: string }> = {
    PENDING:  { label: t("prijava_cekanje"), cls: "bg-kolo-gold-100 text-kolo-gold-700 border-kolo-gold-100" },
    APPROVED: { label: t("primljen_izvršilac"),  cls: "bg-kolo-green-100 text-kolo-green-700 border-kolo-green-100" },
    REJECTED: { label: t("prijava_odbijena"),    cls: "bg-kolo-danger-light text-kolo-danger border-kolo-danger/20" },
  };

  const sourceLabel: Record<string, string> = {
    FONDACIJA: t("source_fondacija"),
    KRUG: t("source_krug"),
    PROJEKAT: t("source_projekat"),
  };

  return (
    <div className="space-y-6">
      <NaslovStranice naslov={t("naslov")} opis={t("opis")} />

      {!isVerified && (
        <Obavestenje vrsta="upozorenje">{t("neVerifikovanInfo")}</Obavestenje>
      )}

      {/* Ulaz za čuvare Kola i lice koje UO ovlasti (operativni 5.0 čl. 13; #51). */}
      {ulazZaPotvrde && (
        <Kartica padding="sm" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-kolo-text">{t("potvrde_ulaz_opis")}</p>
          <Link href="/doprinos-oglasi/potvrde" className={klaseDugmeta({ velicina: "sm" })}>{t("potvrde_ulaz")}</Link>
        </Kartica>
      )}

      <Kartica padding="sm" className="text-center text-sm">
        <p className="text-lg font-bold text-kolo-text">{oglasi.length}</p>
        <p className="text-xs text-kolo-muted mt-0.5">{t(brojZadatakaKljuc(oglasi.length))}</p>
      </Kartica>

      {oglasi.length === 0 ? (
        <Kartica padding="nema">
          <PraznoStanje naslov={t("nema_zadataka")} />
        </Kartica>
      ) : (
        <div className="space-y-3">
          {oglasi.map((oglas) => (
            <OglasKartica key={oglas.id} oglas={oglas} isVerified={isVerified}
              prijavaStatusBadge={prijavaStatusBadge} sourceLabel={sourceLabel} />
          ))}
        </div>
      )}
    </div>
  );
}

function OglasKartica({ oglas, isVerified, prijavaStatusBadge, sourceLabel }: {
  oglas: OglasItem;
  isVerified: boolean;
  prijavaStatusBadge: Record<string, { label: string; cls: string }>;
  sourceLabel: Record<string, string>;
}) {
  const locale = useLocale();
  const t = useTranslations("doprinosOglasi");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);

  const badge = oglas.mojaPrijava ? prijavaStatusBadge[oglas.mojaPrijava] : null;
  // 🔴 Brze prijave sa kartice VIŠE NEMA. Od seta 4.4.4 svaka prijava traži plan
  // izvršenja (operativni čl. 10) i potvrđenu izjavu o pravnoj prirodi (čl. 10 st. 1 t. 3), pa
  // se prijava podnosi isključivo sa stranice zadatka, gde se oboje vidi i unosi.
  const mozePrijaviti = isVerified && !oglas.mojaPrijava && !oglas.zadruzni;

  return (
    <Kartica padding="nema" className="overflow-hidden">
      <div className="px-5 py-5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${sourceCls[oglas.source] ?? "bg-kolo-bg text-kolo-muted"}`}>
                {sourceLabel[oglas.source] ?? oglas.source}
              </span>
              {oglas.krugName && <span className="text-xs text-kolo-muted">{oglas.krugName}</span>}
              <span className="text-xs px-2 py-0.5 rounded-lg bg-kolo-bg text-kolo-muted">{t(`status_zadatka_${oglas.statusZadatka}`)}</span>
              {oglas.zadruzni && <span className="text-xs px-2 py-0.5 rounded-lg bg-kolo-info-light text-kolo-info">{t("zadruzni_oznaka")}</span>}
              {oglas.saOdobravanjem && (
                <span className="text-xs px-2 py-0.5 rounded-lg bg-kolo-info-light text-kolo-info">{t("sa_odobravanjem")}</span>
              )}
              {badge && (
                <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${badge.cls}`}>{badge.label}</span>
              )}
            </div>
            <Link href={`/doprinos-oglasi/${oglas.id}`} className="font-semibold text-kolo-text hover:text-kolo-green-700 transition-colors">
              {oglas.title}
            </Link>
            <p className="text-xs text-kolo-muted mt-2 leading-relaxed line-clamp-2">{oglas.description}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-kolo-green-700">{oglas.predlozeniPoen > 0 ? `${oglas.predlozeniPoen.toLocaleString(intlTag(locale))} P` : t("neograniceno")}</p>
            <p className="text-xs text-kolo-muted mt-0.5">{t("predlozeni_kratko")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <div className="flex items-center gap-4 text-xs text-kolo-muted">
            <span>{oglas.odobreniClanovi}/{oglas.positions} {oglas.positions === 1 ? t("izvršilac_jedan") : t("izvršilaca")}</span>
            {oglas.deadline && (
              <span>{t("rok")}: {new Date(oglas.deadline).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "short" })}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/doprinos-oglasi/${oglas.id}`}
              className={klaseDugmeta({ varijanta: "tiho", velicina: "sm" })}>
              {t("detalji")}
            </Link>
            {mozePrijaviti && (
              <Link href={`/doprinos-oglasi/${oglas.id}`}
                className={klaseDugmeta({ velicina: "sm" })}>
                {t("prijavi_se_sa_planom")}
              </Link>
            )}
            {oglas.mojaPrijava === "APPROVED" && (
              <Link href={`/doprinos-oglasi/${oglas.id}`}
                className={klaseDugmeta({ velicina: "sm" })}>
                {t("evidentiraj_izvrsenje")}
              </Link>
            )}
          </div>
        </div>

        {poruka && (
          <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"} className="mt-3">
            {poruka.text}
          </Obavestenje>
        )}
      </div>
    </Kartica>
  );
}
