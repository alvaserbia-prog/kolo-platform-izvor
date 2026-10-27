"use client";

/**
 * Prijave lažnog roditeljstva (Pravilnik o učešću dece čl. 17; set 4.8.2) — za
 * Admin → Odluke. Bez propova; ugrađuje ga `OdlukeTab`.
 *
 * Po prijemu prijave veza je već zaustavljena (st. 2). Ovlašćeno lice ispituje
 * slučaj i odlučuje: „nema osnova" (zaustavljanje prestaje) ili „veza se ukida"
 * (st. 4; lice se obavezno isključuje, st. 5 — zato tu odluku donosi superadmin).
 * Obrazloženje je obavezno. 🔴 Podnosilac se vidi samo ovde; licu na koje se
 * prijava odnosi Fondacija ga ne otkriva (st. 3).
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { profilHref } from "@/lib/profil-link";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import { useDijalog } from "@/components/ui/Dijalog";

type Prijava = {
  id: string;
  opis: string;
  status: "OTVORENA" | "NEMA_OSNOVA" | "UKINUTA";
  createdAt: string;
  dete: { id: string; pseudonim: string };
  roditelj: { id: string; pseudonim: string };
  podnosilac: { id: string; pseudonim: string };
};

export default function PrijaveRoditeljstva() {
  const t = useTranslations("admin");
  const [prijave, setPrijave] = useState<Prijava[] | null>(null);
  const [obrazlozenja, setObrazlozenja] = useState<Record<string, string>>({});
  const [radi, setRadi] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    const r = await fetch("/api/admin/deca/prijave-roditeljstva", { cache: "no-store" });
    const d = await r.json().catch(() => ({}));
    setPrijave(r.ok ? (d.prijave ?? []) : []);
  }, []);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  const odluci = async (id: string, ishod: "NEMA_OSNOVA" | "UKINUTA") => {
    if (ishod === "UKINUTA" && !(await potvrdi({ poruka: t("roditeljstvo_ukini_potvrda"), opasno: true, dugme: t("roditeljstvo_ukini") }))) return;
    setRadi(id);
    setGreska(null);
    const r = await fetch(`/api/admin/deca/prijave-roditeljstva/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ishod, obrazlozenje: obrazlozenja[id] ?? "" }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setGreska(d.error ?? t("roditeljstvo_greska"));
    setRadi(null);
    await ucitaj();
  };

  return (
    <section className="space-y-3">
      {dijalog}
      <h2 className="text-lg font-semibold text-kolo-text">{t("roditeljstvo_naslov")}</h2>
      <p className="text-sm text-kolo-muted">{t("roditeljstvo_opis")}</p>
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      {prijave === null ? (
        <p className="text-sm text-kolo-muted">{t("roditeljstvo_ucitavanje")}</p>
      ) : prijave.length === 0 ? (
        <p className="text-sm text-kolo-muted">{t("roditeljstvo_prazno")}</p>
      ) : (
        <ul className="space-y-3">
          {prijave.map((p) => (
            <li key={p.id} className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-4">
              <p className="text-sm text-kolo-text">
                {t("roditeljstvo_stavka_dete")}{" "}
                <strong>{p.dete.pseudonim}</strong> · {t("roditeljstvo_stavka_lice")}{" "}
                <Link href={profilHref(p.roditelj)} className="font-semibold text-kolo-green-700 hover:underline">
                  {p.roditelj.pseudonim}
                </Link>
              </p>
              <p className="mt-1 text-xs text-kolo-muted">
                {t("roditeljstvo_stavka_podnosilac")} {p.podnosilac.pseudonim} ·{" "}
                {new Date(p.createdAt).toLocaleDateString("sr-RS")}
              </p>
              <p className="mt-2 whitespace-pre-wrap rounded-kontrola bg-kolo-bg p-3 text-sm text-kolo-text">{p.opis}</p>
              <textarea
                value={obrazlozenja[p.id] ?? ""}
                onChange={(e) => setObrazlozenja((o) => ({ ...o, [p.id]: e.target.value }))}
                rows={2}
                maxLength={2000}
                placeholder={t("roditeljstvo_obrazlozenje")}
                aria-label={t("roditeljstvo_obrazlozenje")}
                className={KLASE_UNOSA + " mt-2"}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={radi !== null || !(obrazlozenja[p.id] ?? "").trim()}
                  onClick={() => odluci(p.id, "NEMA_OSNOVA")}
                  className={klaseDugmeta({ varijanta: "sekundarno", velicina: "md" })}
                >
                  {t("roditeljstvo_nema_osnova")}
                </button>
                <button
                  type="button"
                  disabled={radi !== null || !(obrazlozenja[p.id] ?? "").trim()}
                  onClick={() => odluci(p.id, "UKINUTA")}
                  className={klaseDugmeta({ varijanta: "opasno", velicina: "md" })}
                >
                  {t("roditeljstvo_ukini")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
