"use client";

/**
 * Levak — gde ljudi otpadaju na putu od registracije do objavljenog oglasa.
 *
 * Period se bira u dva reda: gore zbirno i pomerajući prozori (poslednjih 7 i
 * 30 dana), ispod pojedinačne nedelje odnosno meseci registracije. Koraci se
 * broje kao „da li je taj čovek to ikad uradio", pa se red starijeg perioda
 * dopunjava i kasnije — prati se sudbina ljudi, ne nedeljni promet.
 *
 * Prebacivanje perioda NE pravi nov zahtev: ruta vraća sve periode odjednom,
 * pa se red bira iz onoga što je već u pretraživaču.
 *
 * Računanje je u `src/lib/levak.ts` (čiste funkcije, testovi), ovde je samo prikaz.
 */

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Obavestenje from "@/components/ui/Obavestenje";
import Segmenti from "@/components/ui/Segmenti";
import StatKartica from "@/components/ui/StatKartica";

interface Korak {
  korak: string;
  broj: number;
  prolaz: number | null;
  udeo: number | null;
}

interface Grupa {
  oznaka: string;
  koraci: Korak[];
  danaDoVerifikacije: number | null;
  danaDoPrvogOglasa: number | null;
}

/** `n:2026-08-31` → „31.8.–6.9." */
function formatNedelja(oznaka: string): string {
  const d = new Date(`${oznaka.slice(2)}T00:00:00Z`);
  const kraj = new Date(d.getTime() + 6 * 24 * 60 * 60 * 1000);
  const dan = (x: Date) =>
    `${x.getUTCDate()}.${x.getUTCMonth() + 1}.`;
  return `${dan(d)}–${dan(kraj)}`;
}

/** `m:2026-08` → „avgust 2026" (po jeziku interfejsa) */
function formatMesec(oznaka: string, locale: string): string {
  const d = new Date(`${oznaka.slice(2)}-01T00:00:00Z`);
  return d.toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
}

export default function LevakTab() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [grupe, setGrupe] = useState<Grupa[] | null>(null);
  const [aktivnostOd, setAktivnostOd] = useState<string | null>(null);
  const [izabrana, setIzabrana] = useState("ukupno");
  // Koja se lista pojedinačnih perioda prikazuje ispod brzog izbora.
  const [vrsta, setVrsta] = useState<"n" | "m">("n");
  const [greska, setGreska] = useState(false);

  useEffect(() => {
    let otkazano = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/levak");
        if (!res.ok) throw new Error();
        const d = await res.json();
        if (otkazano) return;
        setGrupe(d.grupe);
        setAktivnostOd(d.aktivnostOd);
      } catch {
        if (!otkazano) setGreska(true);
      }
    })();
    return () => {
      otkazano = true;
    };
  }, []);

  if (greska) return <Obavestenje vrsta="greska">{t("levak_greska")}</Obavestenje>;
  if (!grupe) return <p className="text-sm text-kolo-muted">{t("levak_ucitavanje")}</p>;

  const grupa = grupe.find((g) => g.oznaka === izabrana) ?? grupe[0];
  const polazna = grupa.koraci[0]?.broj ?? 0;

  const brzi = ["ukupno", "nedelja", "mesec"] as const;
  const pojedinacni = grupe.filter((g) => g.oznaka.startsWith(`${vrsta}:`));
  const oznakaPerioda = (o: string) =>
    o.startsWith("n:") ? formatNedelja(o) : formatMesec(o, locale);

  // Najveći pad u lancu — na njemu je čep, pa ga bojimo.
  let najgoriIndeks = -1;
  let najgoriPad = 0;
  grupa.koraci.forEach((k, i) => {
    // Prolaz preko 100% nije pad (koraci nisu strogo ulančani) — ne učestvuje.
    if (i === 0 || k.prolaz === null || k.prolaz > 100) return;
    const pad = 100 - k.prolaz;
    if (pad > najgoriPad) {
      najgoriPad = pad;
      najgoriIndeks = i;
    }
  });

  return (
    <div className="space-y-5">
      <p className="text-sm text-kolo-muted">{t("levak_opis")}</p>

      {/* Brzi izbor: zbirno + pomerajući prozori. Prozor od 7 dana nije ista
          stvar kao red poslednje nedelje ispod — jedan meri „ovih dana", drugi
          kalendarsku nedelju od ponedeljka. */}
      <div className="flex flex-wrap gap-2">
        {brzi.map((o) => {
          const g = grupe.find((x) => x.oznaka === o);
          if (!g) return null;
          return (
            <button
              key={o}
              onClick={() => setIzabrana(o)}
              className={`min-h-9 px-3 rounded-kontrola text-xs font-semibold transition-colors ${
                o === grupa.oznaka
                  ? "bg-kolo-green-700 text-white"
                  : "bg-kolo-bg border border-kolo-border text-kolo-muted hover:bg-kolo-border"
              }`}
            >
              {t(`levak_period_${o}`)}
            </button>
          );
        })}
      </div>

      {/* Pojedinačni periodi: nedelje ili meseci registracije */}
      <div className="space-y-2">
        <Segmenti
          oznaka={`${t("levak_vrsta_nedelje")} / ${t("levak_vrsta_meseci")}`}
          vrednost={vrsta}
          onPromena={setVrsta}
          opcije={(["n", "m"] as const).map((v) => ({
            vrednost: v,
            oznaka: t(v === "n" ? "levak_vrsta_nedelje" : "levak_vrsta_meseci"),
          }))}
        />

        {pojedinacni.length === 0 ? (
          <p className="text-xs text-kolo-muted">{t("levak_bez_perioda")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pojedinacni.map((g) => (
              <button
                key={g.oznaka}
                onClick={() => setIzabrana(g.oznaka)}
                className={`min-h-9 px-3 rounded-kontrola text-xs font-semibold transition-colors ${
                  g.oznaka === grupa.oznaka
                    ? "bg-kolo-green-700 text-white"
                    : "bg-kolo-bg border border-kolo-border text-kolo-muted hover:bg-kolo-border"
                }`}
              >
                {oznakaPerioda(g.oznaka)}
                <span className="ml-1.5 font-normal opacity-70">
                  {g.koraci[0]?.broj ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Koji je period na tabeli — bez ovoga se posle prebacivanja vrste ne
          vidi da izabrani red pripada drugoj listi. */}
      <p className="text-xs font-semibold text-kolo-text">
        {brzi.includes(grupa.oznaka as (typeof brzi)[number])
          ? t(`levak_period_${grupa.oznaka}`)
          : oznakaPerioda(grupa.oznaka)}
      </p>

      <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-kolo-border text-xs text-kolo-muted">
              <th className="text-left font-medium px-4 py-2.5">{t("levak_kolona_korak")}</th>
              <th className="text-right font-medium px-4 py-2.5 w-20">{t("levak_kolona_ljudi")}</th>
              <th className="text-right font-medium px-4 py-2.5 w-24">{t("levak_kolona_prolaz")}</th>
            </tr>
          </thead>
          <tbody>
            {grupa.koraci.map((k, i) => (
              <tr key={k.korak} className="border-b border-kolo-border last:border-0">
                <td className="px-4 py-2.5">
                  <span className="text-kolo-text">{t(`levak_k_${k.korak}`)}</span>
                  {/* Traka širine srazmerne polaznom broju — levak se vidi na prvi pogled */}
                  <span className="block mt-1 h-1.5 rounded-full bg-kolo-green-500/70" style={{
                    width: polazna > 0 ? `${Math.max(2, Math.round((k.broj / polazna) * 100))}%` : "2%",
                  }} />
                </td>
                <td className="px-4 py-2.5 text-right font-semibold text-kolo-text align-top">{k.broj}</td>
                <td
                  className={`px-4 py-2.5 text-right align-top ${
                    i === najgoriIndeks ? "text-kolo-danger font-semibold" : "text-kolo-muted"
                  }`}
                >
                  {k.udeo === null ? "—" : `${k.udeo}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatKartica oznaka={t("levak_dana_verifikacija")} vrednost={String(grupa.danaDoVerifikacije ?? "—")} />
        <StatKartica oznaka={t("levak_dana_oglas")} vrednost={String(grupa.danaDoPrvogOglasa ?? "—")} />
      </div>

      {/* Dva koraka se čitaju iz dnevnika aktivnosti, koji ne seže pre ovog
          datuma — bez ove napomene bi se stare kohorte čitale kao „niko nije
          ni otvorio stranicu". */}
      {aktivnostOd && (
        <p className="text-xs text-kolo-muted">
          {t("levak_napomena_dnevnik", {
            datum: new Date(aktivnostOd).toLocaleDateString("sr-RS"),
          })}
        </p>
      )}
    </div>
  );
}
