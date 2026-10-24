"use client";

/**
 * Mali crtež navigacije uz uputstvo u vodiču dobrodošlice: pokazuje GDE se
 * nalazi stranica o kojoj korak govori, sa crvenim prstenom oko mesta.
 *
 * Zašto crtež a ne slika ekrana: slika sadrži nazive stavki, pa bi je trebalo
 * praviti za svaki jezik i za obe veličine ekrana (~50 slika), i zastarela bi
 * pri svakoj izmeni menija. Ovde se nazivi čitaju iz istog `nav`/`header`
 * prostora imena koji koriste Sidebar i Header, pa crtež ne može da se
 * razmimoiđe sa stvarnim menijem ni na jednom jeziku.
 *
 * Prsten je CSS okvir (zaobljen, blago zarotiran), ne SVG putanja — tako
 * obuhvata stavku ma koliko njen naziv bio dug u prevodu.
 */
import { useTranslations } from "next-intl";

/** Ključ stavke u `nav` prostoru imena (isti koji koristi Sidebar). */
export type NavStavka = "verifikacija" | "novcanik" | "pijaca" | "pocetna" | "gazdinstva";

export type Gde =
  | { vrsta: "meni"; stavka: NavStavka; grupa?: "grupa_poverenje" | "grupa_razmena" }
  | { vrsta: "profil" };

/** Crveni prsten oko mesta — pill oblik za redove, krug za avatar. */
function Prsten({ krug }: { krug?: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute border-2 border-kolo-danger ${
        krug ? "-inset-1 rounded-full" : "-inset-x-1.5 -inset-y-1 rounded-full -rotate-1"
      }`}
    />
  );
}

/** Prazan red menija (bez teksta) — samo da se vidi da stavka stoji u spisku. */
function PrazanRed({ sirina }: { sirina: string }) {
  return <div className={`mx-1.5 h-1.5 rounded-full bg-white/15 ${sirina}`} />;
}

export default function GdeSeNalazi({ gde }: { gde: Gde }) {
  const t = useTranslations("dobrodosli");
  const tNav = useTranslations("nav");
  const tHeader = useTranslations("header");

  const okvir =
    "mt-3 inline-flex items-center gap-3 rounded-xl border border-dashed border-kolo-border bg-kolo-bg px-3 py-3";

  if (gde.vrsta === "profil") {
    return (
      <div className={okvir}>
        <div className="w-[150px] flex-none overflow-hidden rounded-lg border border-kolo-border bg-white">
          {/* gornja traka: ☰ (samo na telefonu) · logo · profilna slika */}
          <div className="flex h-7 items-center justify-between border-b border-kolo-border px-2">
            <span className="flex flex-col gap-[2.5px]" aria-hidden>
              <span className="block h-[1.8px] w-3 rounded bg-kolo-text/70" />
              <span className="block h-[1.8px] w-3 rounded bg-kolo-text/70" />
              <span className="block h-[1.8px] w-3 rounded bg-kolo-text/70" />
            </span>
            <span className="text-[11px] font-bold tracking-[0.18em] text-kolo-green-700">KOLO</span>
            <span className="relative flex-none">
              <span className="block h-3.5 w-3.5 rounded-full bg-kolo-green-500" />
              <Prsten krug />
            </span>
          </div>
          <div className="flex flex-col gap-1.5 p-2" aria-hidden>
            <div className="h-1.5 rounded-full bg-kolo-border" />
            <div className="h-1.5 w-1/2 rounded-full bg-kolo-border" />
            <div className="h-6 rounded bg-kolo-green-100" />
          </div>
        </div>
        <p className="max-w-[20ch] text-xs leading-snug text-kolo-muted">
          {t("gde_profil", { akcija: tHeader("podesi_profil") })}
        </p>
      </div>
    );
  }

  return (
    <div className={okvir}>
      <div className="w-[136px] flex-none rounded-lg bg-kolo-green-900 p-1.5">
        <div className="px-1.5 pb-2 pt-0.5 text-[11px] font-bold tracking-[0.2em] text-white/90">
          KOLO
        </div>
        <PrazanRed sirina="mb-1.5" />
        <PrazanRed sirina="mb-1.5 w-3/4" />
        {gde.grupa && (
          <div className="mt-1.5 border-t border-white/10 px-1.5 pb-1 pt-2 text-[11px] uppercase tracking-[0.14em] text-white/45">
            {tNav(gde.grupa)}
          </div>
        )}
        <div className="relative mx-0.5">
          <div className="truncate rounded-md bg-white/15 px-1.5 py-1 text-[11px] font-semibold text-white">
            {tNav(gde.stavka)}
          </div>
          <Prsten />
        </div>
        <PrazanRed sirina="mt-2 mb-0.5 w-5/6" />
      </div>
      <p className="max-w-[20ch] text-xs leading-snug text-kolo-muted">
        {gde.grupa ? t("gde_meni_grupa", { grupa: tNav(gde.grupa) }) : t("gde_meni")}
      </p>
    </div>
  );
}
