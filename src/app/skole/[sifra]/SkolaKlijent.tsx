"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import type { Pozicija, Skola } from "@/lib/skola";
import Kartica from "@/components/ui/Kartica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";

type Odgovor = {
  skola: Skola;
  brojDece: number;
  procenat: number | null;
  pozicijaPoBroju: Pozicija | null;
  mestoPoProcentu: number | null;
  ukupnoSkola: number;
  /** `null` za neprijavljenog posetioca — spisak dece vide samo prijavljeni. */
  deca: { id: string; pseudonim: string; avatar: string | null; poen: number }[] | null;
};

/**
 * Jedna škola: mesto na obe nacionalne liste i spisak njene dece.
 *
 * 🔴 Sa spiska se NE ulazi ni u čiji profil. Klik na dete vodi na zatvoren prikaz
 * (`pristupProfiluDeteta`) — lista pokazuje da dete postoji, ona nije vrata ni u
 * šta. Načelo: do deteta se dolazi samo kroz ono što je dete sámo objavilo.
 */
export default function SkolaKlijent({ sifra }: { sifra: string }) {
  const t = useTranslations("skole");
  const locale = useLocale();

  const { data, isLoading, error } = useQuery({
    queryKey: ["skola", sifra],
    queryFn: async () => {
      const r = await fetch(`/api/skole/${encodeURIComponent(sifra)}`);
      if (!r.ok) throw new Error(t("greska_ucitavanje"));
      return (await r.json()) as Odgovor;
    },
  });

  const broj = (n: number) => n.toLocaleString(intlTag(locale));

  if (isLoading) return <p className="text-sm text-kolo-muted">…</p>;
  if (error || !data) return <Obavestenje vrsta="greska">{t("greska_ucitavanje")}</Obavestenje>;

  const { skola, brojDece, procenat, pozicijaPoBroju: poz, mestoPoProcentu, deca } = data;

  return (
    <div className="space-y-6">
      <NaslovStranice
        nazad={{ href: "/skole", oznaka: t("nazad") }}
        naslov={skola.naziv}
        opis={skola.mesto}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Kartica>
          <p className="text-3xl font-semibold tabular-nums text-kolo-text">{broj(brojDece)}</p>
          <p className="mt-1 text-sm text-kolo-muted">{t("kol_dece")}</p>
          {poz && (
            <p className="mt-3 text-sm text-kolo-text">
              {t("mesto_po_broju", { mesto: poz.mesto })}{" "}
              <span className="text-kolo-muted">{t("od_ukupno", { ukupno: poz.ukupnoSkola })}</span>
            </p>
          )}
          {/* Rečenica koju dete prepričava kod kuće. Broj je tačan do jednog deteta
              (vidi `doSledecegMesta`) — zato i sme da stoji ovako konkretno. */}
          {poz && poz.doSledecegMesta !== null && (
            <p className="mt-1 text-sm font-medium text-kolo-green-700">
              {t("fali_do", { broj: poz.doSledecegMesta, mesto: poz.mesto - 1 })}
            </p>
          )}
          {poz && poz.doSledecegMesta === null && (
            <p className="mt-1 text-sm font-medium text-kolo-green-700">{t("prvo_mesto")}</p>
          )}
        </Kartica>

        <Kartica>
          <p className="text-3xl font-semibold tabular-nums text-kolo-text">
            {procenat === null ? "—" : `${procenat.toFixed(1).replace(".", ",")}%`}
          </p>
          <p className="mt-1 text-sm text-kolo-muted">{t("kol_udeo")}</p>
          {procenat === null ? (
            <p className="mt-3 text-sm text-kolo-muted">{t("bez_broja_ucenika")}</p>
          ) : (
            <>
              <p className="mt-3 text-sm text-kolo-muted">
                {broj(brojDece)} / {broj(skola.ucenika as number)}
              </p>
              {mestoPoProcentu && (
                <p className="mt-1 text-sm text-kolo-text">
                  {t("mesto_po_udelu", { mesto: mestoPoProcentu })}
                </p>
              )}
            </>
          )}
        </Kartica>
      </div>

      <Kartica as="section" padding="nema">
        <div className="border-b border-kolo-border px-5 py-4">
          <h2 className="text-sm font-semibold text-kolo-text">{t("deca_naslov")}</h2>
        </div>

        {deca === null ? (
          // Spisak vidi samo dete (odluka vlasnika). Punoletnom nalogu i gostu se
          // sa servera i ne šalje: pseudonim + sličica + stanje POENA, poređani po
          // iznosu, jesu upravo ono što zatvoren profil deteta krije.
          <PraznoStanje kompaktno naslov={t("deca_samo_deca")} />
        ) : deca.length === 0 ? (
          <PraznoStanje kompaktno naslov={t("deca_prazno")} />
        ) : (
          <ul className="divide-y divide-kolo-border">
            {deca.map((d, i) => (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-6 shrink-0 text-sm tabular-nums text-kolo-muted">{i + 1}</span>
                <Link href={profilHref(d)} className="inline-flex min-h-9 items-center text-sm text-kolo-text hover:underline">
                  <Pseudonim>{d.pseudonim}</Pseudonim>
                </Link>
                <span className="ml-auto text-sm font-medium tabular-nums text-kolo-text">
                  {broj(d.poen)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Kartica>

      <p className="text-xs text-kolo-muted">{t("napomena")}</p>
    </div>
  );
}
