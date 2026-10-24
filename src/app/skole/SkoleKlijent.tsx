"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import type { RedSkole, RedSkoleSaProcentom, TipSkole } from "@/lib/skola";
import Kartica from "@/components/ui/Kartica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Segmenti from "@/components/ui/Segmenti";

/**
 * Nacionalne rang-liste škola — po broju uključene dece i po udelu uključenosti.
 *
 * Dve liste stoje RAVNOPRAVNO i nijedna nije glavna. Na listi po broju uvek vode
 * velike gradske škole, prosto zato što imaju hiljadu đaka; lista po udelu meri
 * koliki DEO škole učestvuje, i tek tu selo može da pobedi grad. To nije tehnički
 * detalj nego priča: „škola iz Stanišića prva u Srbiji" je vest koju ljudi šalju
 * jedni drugima, a „Beograd prvi po broju" je očekivano stanje.
 *
 * Osnovne i srednje škole se prikazuju odvojeno — u jednoj listi bi gimnazija sa
 * devetsto đaka pregazila seosku osnovnu školu i po broju i po procentu.
 */
export default function SkoleKlijent() {
  const t = useTranslations("skole");
  const locale = useLocale();
  const [tip, setTip] = useState<TipSkole>("OSNOVNA");

  const { data, isLoading, error } = useQuery({
    queryKey: ["skole", tip],
    queryFn: async () => {
      const r = await fetch(`/api/skole?tip=${tip}`);
      if (!r.ok) throw new Error(t("greska_ucitavanje"));
      return (await r.json()) as {
        spisakPrazan?: boolean;
        poBroju?: RedSkole[];
        poProcentu?: RedSkoleSaProcentom[];
      };
    },
  });

  const broj = (n: number) => n.toLocaleString(intlTag(locale));

  return (
    <div className="space-y-6">
      <NaslovStranice naslov={t("naslov")} opis={t("podnaslov")} />

      <Segmenti
        oznaka={t("naslov")}
        opcije={(["OSNOVNA", "SREDNJA"] as const).map((v) => ({
          vrednost: v,
          oznaka: t(v === "OSNOVNA" ? "tab_osnovne" : "tab_srednje"),
        }))}
        vrednost={tip}
        onPromena={setTip}
      />

      {isLoading && <p className="text-sm text-kolo-muted">…</p>}
      {error && <Obavestenje vrsta="greska">{t("greska_ucitavanje")}</Obavestenje>}

      {/* Dok zvaničan spisak škola nije uvezen, stranica ne puca — samo nema šta
          da pokaže. Vidi `src/lib/skole-srbije.ts`. */}
      {data?.spisakPrazan && (
        <Kartica padding="nema">
          <PraznoStanje naslov={t("spisak_prazan")} />
        </Kartica>
      )}

      {data?.poBroju && data.poProcentu && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Tabela
            naslov={t("lista_broj")}
            opis={t("lista_broj_opis")}
            prazno={t("nema_skola")}
            kolone={[t("kol_skola"), t("kol_dece")]}
            redovi={data.poBroju.map((r) => ({
              sifra: r.sifra,
              naziv: r.naziv,
              mesto: r.mesto,
              vrednost: broj(r.dece),
              napomena: null,
            }))}
          />
          <Tabela
            naslov={t("lista_procenat")}
            opis={t("lista_procenat_opis")}
            prazno={t("nema_skola")}
            kolone={[t("kol_skola"), t("kol_udeo")]}
            redovi={data.poProcentu.map((r) => ({
              sifra: r.sifra,
              naziv: r.naziv,
              mesto: r.mesto,
              // 🔴 Uz procenat UVEK ide i sam odnos. Praga prikaza nema (odluka
              // vlasnika), pa škola sa 12 upisanih i jednim detetom daje 8,3% i
              // seda na vrh — niko se ne sklanja sa liste, ali čitalac mora da
              // vidi koliko taj broj teži.
              vrednost:
                r.procenat === null ? "—" : `${r.procenat.toFixed(1).replace(".", ",")}%`,
              napomena:
                r.procenat === null
                  ? t("bez_broja_ucenika")
                  : `${broj(r.dece)} / ${broj(r.ucenika as number)}`,
            }))}
          />
        </div>
      )}

      <p className="text-xs text-kolo-muted">{t("napomena")}</p>
    </div>
  );
}

function Tabela({
  naslov,
  opis,
  prazno,
  kolone,
  redovi,
}: {
  naslov: string;
  opis: string;
  prazno: string;
  kolone: [string, string];
  redovi: {
    sifra: string;
    naziv: string;
    mesto: string;
    vrednost: string;
    napomena: string | null;
  }[];
}) {
  return (
    <Kartica as="section" padding="nema">
      <div className="border-b border-kolo-border px-5 py-4">
        <h2 className="text-sm font-semibold text-kolo-text">{naslov}</h2>
        <p className="mt-0.5 text-xs text-kolo-muted">{opis}</p>
      </div>

      {redovi.length === 0 ? (
        <PraznoStanje kompaktno naslov={prazno} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-kolo-muted">
                <th className="px-5 py-2 font-medium">#</th>
                <th className="px-2 py-2 font-medium">{kolone[0]}</th>
                <th className="px-5 py-2 text-right font-medium">{kolone[1]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kolo-border">
              {redovi.map((r, i) => (
                <tr key={r.sifra}>
                  <td className="px-5 py-2.5 tabular-nums text-kolo-muted">{i + 1}</td>
                  <td className="px-2 py-2.5">
                    <Link
                      href={`/skole/${encodeURIComponent(r.sifra)}`}
                      className="inline-flex min-h-9 items-center text-kolo-text hover:text-kolo-green-700 hover:underline"
                    >
                      {r.naziv}
                    </Link>
                    <span className="block text-xs text-kolo-muted">{r.mesto}</span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <span className="tabular-nums font-medium text-kolo-text">{r.vrednost}</span>
                    {r.napomena && (
                      <span className="block text-xs text-kolo-muted">{r.napomena}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Kartica>
  );
}
