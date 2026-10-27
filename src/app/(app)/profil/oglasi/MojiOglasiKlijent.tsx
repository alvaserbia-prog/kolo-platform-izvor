"use client";

import { useState } from "react";
import { intlTag } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Segmenti from "@/components/ui/Segmenti";
import { useTranslations, useLocale } from "next-intl";
import { formatCenaGlavni, prikaziJedinicuCene } from "@/lib/cena-oglas";
import { kategorijaKljuc } from "@/lib/kategorije";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Dugme, { klaseDugmeta } from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";
import PraznoStanje from "@/components/ui/PraznoStanje";

interface Oglas {
  id: string;
  title: string;
  cenaTip: string;
  price: number | null;
  cenaDo: number | null;
  category: string;
  status: string;
  slike: number;
  createdAt: string;
  razmenjenoAt: string | null;
  /** Razlog uklanjanja od strane Fondacije (Uslovi čl. 29 st. 2). */
  uklonjenRazlog: string | null;
}

/** U arhivi je sve što nije aktivno: oglasi koje je oglašivač sklonio (EXPIRED),
 *  zatečeni razmenjeni (RAZMENJEN) i oni koje je uklonila Fondacija (UKLONJEN).
 *  Vratiti se mogu samo prva dva — uklanjanje je odluka Fondacije. */
const MOZE_DA_SE_AKTIVIRA = new Set(["EXPIRED", "RAZMENJEN"]);

export default function MojiOglasiKlijent({ listings }: { listings: Oglas[] }) {
  const locale = useLocale();
  const t = useTranslations("profil");
  const tPijaca = useTranslations("pijaca");
  const router = useRouter();
  const [tab, setTab] = useState<"aktivni" | "arhiva">("aktivni");
  const [radim, setRadim] = useState<string | null>(null);
  const [greske, setGreske] = useState<Record<string, string>>({});

  const aktivni = listings.filter((l) => l.status === "ACTIVE");
  const arhiva = listings.filter((l) => l.status !== "ACTIVE");
  const prikazani = tab === "aktivni" ? aktivni : arhiva;

  async function promeni(id: string, akcija: "deaktiviraj" | "aktiviraj") {
    setRadim(id);
    setGreske((g) => ({ ...g, [id]: "" }));
    const res = await fetch(`/api/pijaca/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ akcija }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setGreske((g) => ({ ...g, [id]: data.error ?? t("akcija_greska") }));
    }
    setRadim(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* „← Profil" iznad naslova, kao na ostalim stranicama (bio je krug bez natpisa). */}
      <NaslovStranice naslov={t("moji_oglasi")} nazad={{ href: "/profil", oznaka: t("nazad_na_profil") }} />

      {/* Tabovi levo, Novi oglas desno — jedan red */}
      <div className="flex items-center gap-2">
        <Segmenti
          oznaka={t("moji_oglasi")}
          vrednost={tab}
          onPromena={setTab}
          opcije={[
            { vrednost: "aktivni", oznaka: <>{t("filter_aktivni")} <span className="font-normal tabular-nums">{aktivni.length}</span></> },
            { vrednost: "arhiva", oznaka: <>{t("filter_arhiva")} <span className="font-normal tabular-nums">{arhiva.length}</span></> },
          ]}
        />
        <Link
          href="/pijaca/novi-oglas"
          className={klaseDugmeta() + " ml-auto whitespace-nowrap"}
        >
          + {t("novi_oglas")}
        </Link>
      </div>

      {/* Lista */}
      {prikazani.length === 0 ? (
        <Kartica>
          {listings.length === 0 ? (
            <PraznoStanje
              naslov={t("nema_oglasa_jos")}
              radnja={<Link href="/pijaca/novi-oglas" className={klaseDugmeta({ varijanta: "sekundarno" })}>{t("objavite_prvi")}</Link>}
            />
          ) : (
            <PraznoStanje naslov={tab === "aktivni" ? t("nema_aktivnih_oglasa") : t("nema_oglasa_arhiva")} />
          )}
        </Kartica>
      ) : (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden divide-y divide-kolo-border shadow-kartica">
          {prikazani.map((l) => (
            <div key={l.id} className="px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/pijaca/${l.id}`} className="font-semibold text-kolo-text text-sm hover:text-kolo-green-700 transition-colors line-clamp-2">
                    {l.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs">
                    <span className="text-kolo-muted">{tPijaca(`kategorija_${kategorijaKljuc(l.category)}`)}</span>
                    <span className="text-kolo-border">·</span>
                    <span className="font-semibold text-kolo-green-700">{formatCenaGlavni(l, t("cena_po_dogovoru"))}{prikaziJedinicuCene(l) ? " POEN" : ""}</span>
                    {l.status === "UKLONJEN" && (
                      <span className="px-1.5 py-0.5 rounded-md font-medium bg-kolo-danger-light text-kolo-danger">{tPijaca("oglas_uklonjen")}</span>
                    )}
                    {tab === "arhiva" && l.status !== "UKLONJEN" && (
                      <span className="text-kolo-muted">· {new Date(l.razmenjenoAt ?? l.createdAt).toLocaleDateString(intlTag(locale))}</span>
                    )}
                  </div>
                  {/* Razlog uklanjanja — vlasnik mora da zna zašto (Uslovi čl. 29 st. 2). */}
                  {l.status === "UKLONJEN" && l.uklonjenRazlog && (
                    <div className="mt-1.5 text-xs text-kolo-danger">
                      {tPijaca("oglas_uklonjen_razlog", { razlog: l.uklonjenRazlog })}
                    </div>
                  )}
                </div>
                {l.status === "ACTIVE" && (
                  <Dugme
                    varijanta="sekundarno"
                    velicina="sm"
                    onClick={() => promeni(l.id, "deaktiviraj")}
                    disabled={radim === l.id}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {radim === l.id ? "…" : t("arhiviraj")}
                  </Dugme>
                )}
                {MOZE_DA_SE_AKTIVIRA.has(l.status) && (
                  <Dugme
                    velicina="sm"
                    onClick={() => promeni(l.id, "aktiviraj")}
                    disabled={radim === l.id}
                    className="shrink-0 whitespace-nowrap"
                  >
                    {radim === l.id ? "…" : t("aktiviraj")}
                  </Dugme>
                )}
              </div>
              {greske[l.id] && <p className="mt-1.5 text-xs text-kolo-danger">{greske[l.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
