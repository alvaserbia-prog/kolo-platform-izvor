"use client";

/**
 * Tab „Provere" (ključ taba ostaje `nadzor`, pravilo 12) — tri odeljka:
 *  1. Nalazi — noćni nadzor integriteta (`RizikNalaz`);
 *  2. Zatvorene grupe — provera iz dokaza stvarnosti čl. 11 poslednji stav (set
 *     4.8.2): računa se pri prikazu, nema dejstvo; Fondacija članove može pozvati na
 *     razgovor;
 *  3. Ko je otvorio ime i broj — zapis otvaranja poziva (dokaz čl. 4a st. 5;
 *     komponenta `ZapisiOtvaranja`, paket P2).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import ZapisiOtvaranja from "./ZapisiOtvaranja";
import { profilHref } from "@/lib/profil-link";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { useDijalog } from "@/components/ui/Dijalog";

export interface NadzorPravilo {
  kod: string;
  nivo: string;
  opis: string;
}
export interface NadzorNalaz {
  id: string;
  tip: string; // "NALOG" | "GRUPA"
  subjektId: string | null;
  pseudonim: string | null;
  clanovi: { id: string; pseudonim: string }[] | null;
  pravila: NadzorPravilo[];
  rizik: number;
  nivo: string; // "INFO" | "UPOZORENJE" | "HITNO"
  createdAt: string;
}

const NIVO_STIL: Record<string, string> = {
  HITNO: "bg-kolo-danger-light text-kolo-danger border-kolo-danger/30",
  UPOZORENJE: "bg-kolo-gold-100 text-kolo-gold-700 border-kolo-gold-200",
  INFO: "bg-kolo-bg text-kolo-muted border-kolo-border",
};
const NIVO_ZNAK: Record<string, string> = { HITNO: "🔴", UPOZORENJE: "🟠", INFO: "🟡" };

type ZatvorenaGrupa = {
  clanovi: { id: string; pseudonim: string }[];
  razmenaUnutar: number;
  razmenaSaOstalima: number;
};

/** Provera zatvorene grupe — samo prikaz (čl. 11 poslednji stav). */
function ZatvoreneGrupe() {
  const t = useTranslations("admin");
  const [grupe, setGrupe] = useState<ZatvorenaGrupa[] | null>(null);
  const [greska, setGreska] = useState("");

  useEffect(() => {
    let ziv = true;
    fetch("/api/admin/provere/zatvorene-grupe")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!ziv) return;
        if (!r.ok) setGreska(d.error ?? t("nadzor_greska"));
        else setGrupe(d.grupe ?? []);
      })
      .catch(() => ziv && setGreska(t("nadzor_greska")));
    return () => {
      ziv = false;
    };
  }, [t]);

  return (
    <section className="space-y-2">
      <h3 className="text-base font-semibold text-kolo-text">{t("provere_grupe_naslov")}</h3>
      <p className="text-sm text-kolo-muted">{t("provere_grupe_opis")}</p>
      {greska ? (
        <Obavestenje vrsta="greska">{greska}</Obavestenje>
      ) : grupe === null ? (
        <p className="text-sm text-kolo-muted">…</p>
      ) : grupe.length === 0 ? (
        <div className="rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica">
          <PraznoStanje kompaktno naslov={t("provere_grupe_nema")} />
        </div>
      ) : (
        <ul className="divide-y divide-kolo-border rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica">
          {grupe.map((g) => (
            <li key={g.clanovi.map((c) => c.id).join("|")} className="p-3 text-sm space-y-1">
              <div className="text-kolo-muted">
                {t("provere_grupe_red", {
                  clanova: g.clanovi.length,
                  unutar: g.razmenaUnutar,
                  ostali: g.razmenaSaOstalima,
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.clanovi.map((c) => (
                  <Link key={c.id} href={profilHref(c)} className="text-kolo-green-700 hover:underline">
                    <Pseudonim>{c.pseudonim}</Pseudonim>
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function NadzorTab({ nalazi }: { nalazi: NadzorNalaz[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [otvoren, setOtvoren] = useState<string | null>(null);
  const [radim, setRadim] = useState<string | null>(null);
  const { dijalog, potvrdi, obavesti } = useDijalog();

  async function oznaciCisto(id: string) {
    if (!(await potvrdi({ poruka: t("nadzor_oznaci_cisto_confirm"), dugme: t("nadzor_oznaci_cisto") }))) return;
    setRadim(id);
    try {
      const res = await fetch(`/api/admin/nadzor/${id}/cisto`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        await obavesti(j.error ?? t("nadzor_greska"));
      } else {
        router.refresh();
      }
    } finally {
      setRadim(null);
    }
  }

  const hitno = nalazi.filter((n) => n.nivo === "HITNO").length;
  const upoz = nalazi.filter((n) => n.nivo === "UPOZORENJE").length;

  return (
    <div className="space-y-4">
      {dijalog}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-kolo-text">{t("nadzor_naslov")}</h2>
          <p className="text-sm text-kolo-muted">
            {t("nadzor_opis")}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="px-2.5 py-1 rounded-full border border-kolo-danger/30 bg-kolo-danger-light text-kolo-danger">🔴 {hitno}</span>
          <span className="px-2.5 py-1 rounded-full border border-kolo-gold-200 bg-kolo-gold-100 text-kolo-gold-700">🟠 {upoz}</span>
        </div>
      </div>

      {nalazi.length === 0 ? (
        <div className="rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica">
          <PraznoStanje naslov={t("nadzor_nema")} />
        </div>
      ) : (
        <div className="divide-y divide-kolo-border rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica">
          {nalazi.map((n) => {
            const naslov =
              n.tip === "GRUPA" ? t("nadzor_grupa_label", { count: n.clanovi?.length ?? 0 }) : n.pseudonim ?? n.subjektId ?? "—";
            const jeOtvoren = otvoren === n.id;
            return (
              <div key={n.id} className="p-3">
                <button
                  onClick={() => setOtvoren(jeOtvoren ? null : n.id)}
                  className="w-full min-h-10 flex items-center gap-3 text-left"
                >
                  <span className={`shrink-0 px-2 py-0.5 rounded border text-xs font-medium ${NIVO_STIL[n.nivo] ?? NIVO_STIL.INFO}`}>
                    {NIVO_ZNAK[n.nivo] ?? "🟡"} {n.rizik}
                  </span>
                  <span className="font-medium text-kolo-text">{naslov}</span>
                  <span className="flex gap-1 flex-wrap">
                    {n.pravila.map((p) => (
                      <span key={p.kod} className="px-1.5 py-0.5 rounded bg-kolo-bg text-xs text-kolo-muted border border-kolo-border">
                        {p.kod}
                      </span>
                    ))}
                  </span>
                  <span className="ml-auto text-kolo-muted text-sm">{jeOtvoren ? "▴" : "▾"}</span>
                </button>

                {jeOtvoren && (
                  <div className="mt-3 pl-1 space-y-3 text-sm">
                    <ul className="space-y-1">
                      {n.pravila.map((p) => (
                        <li key={p.kod} className="text-kolo-text">
                          <span className="font-medium">{NIVO_ZNAK[p.nivo] ?? "🟡"} {p.kod}</span> — {p.opis}
                        </li>
                      ))}
                    </ul>

                    {n.tip === "GRUPA" && n.clanovi && (
                      <div>
                        <div className="text-kolo-muted mb-1">{t("nadzor_nalozi_u_grupi")}</div>
                        <div className="flex flex-wrap gap-2">
                          {n.clanovi.map((c) => (
                            <Link key={c.id} href={profilHref(c)} className="text-kolo-green-700 hover:underline">
                              <Pseudonim>{c.pseudonim}</Pseudonim>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      {n.subjektId && (
                        <Link
                          href={profilHref({ id: n.subjektId, pseudonim: n.pseudonim })}
                          className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                        >
                          {t("nadzor_otvori_profil")}
                        </Link>
                      )}
                      <button
                        onClick={() => oznaciCisto(n.id)}
                        disabled={radim === n.id}
                        className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                      >
                        {radim === n.id ? "..." : t("nadzor_oznaci_cisto")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ZatvoreneGrupe />

      {/* Ko je otvorio ime i broj korisnika sa spiska za poziv (dokaz čl. 4a st. 5). */}
      <ZapisiOtvaranja />
    </div>
  );
}
