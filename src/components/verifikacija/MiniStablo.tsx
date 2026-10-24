"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";

/**
 * Mini stablo verifikacija (varijanta A) — gore verifikator, dole verifikovani.
 * Podrazumevano: klikom na pseudonim ide se na /profil/<pseudonim> tog korisnika.
 *
 * Koristi se na dva mesta:
 *  - /verifikacija (sopstveni lanac; podrazumevani tekstovi u prvom licu);
 *  - panel grafa verifikacija (tuđi lanac; `onKlik` bira čvor u grafu umesto
 *    navigacije, a `tekstovi` prebacuju prazna stanja u treće lice).
 */
export type CvorVerifikator = {
  id: string;
  pseudonim: string;
  /** Vrsta verifikacije kojom je ovaj čvor verifikovao nosioca kartice (čl. 5a). */
  vrsta?: "POTVRDA" | "UVODJENJE";
  /** Kod uvođenja: da li je nosilac kartice u međuvremenu potvrđen. */
  potvrdjen?: boolean;
};

export type CvorVerifikovani = {
  id: string;
  pseudonim: string;
  statusNadzora: "ne-podleze" | "ceka-nadzor" | "nadzirano";
  /** Vrsta verifikacije (dokaz stvarnosti čl. 5a, 6): potvrda ili uvođenje u Kolo. */
  vrsta?: "POTVRDA" | "UVODJENJE";
  /** Kod uvođenja: da li je uvedeni u međuvremenu potvrđen (član Kola). */
  potvrdjen?: boolean;
};

/** Oznaka vrste uz čvor: samo uvođenje u Kolo koje još nije potvrđeno se ističe. */
function OznakaVrste({ vrsta, potvrdjen }: { vrsta?: "POTVRDA" | "UVODJENJE"; potvrdjen?: boolean }) {
  const t = useTranslations("verifikacija");
  if (vrsta !== "UVODJENJE") return null;
  return (
    <span className="text-[11px] px-1.5 py-0.5 rounded-md border shrink-0 bg-kolo-surface text-kolo-muted border-kolo-border">
      {potvrdjen ? t("stablo_uveden_potvrdjen") : t("stablo_uveden")}
    </span>
  );
}

type Props = {
  /** `prikaz` je ostatak indeksa (do seta 4.8.0) — ekran ga više ne šalje. */
  ja: { pseudonim: string; prikaz?: string };
  // Korisnik može imati više verifikatora (1 početni + do 10 ličnih = do 100%).
  verifikatori: CvorVerifikator[];
  verifikovani: CvorVerifikovani[];
  jeJaPocetni?: boolean;
  className?: string;
  /** Naslov kartice (podrazumevano „Lanac verifikacija"). */
  naslov?: string;
  /** Ako je zadato, klik na osobu poziva ovo umesto navigacije na profil. */
  onKlik?: (id: string) => void;
  /** Tekstovi praznih stanja (podrazumevano prvo lice — sopstvena kartica). */
  tekstovi?: {
    bezVerifikatora?: string;
    osnivac?: string;
    bezVerifikovanih?: string;
  };
  /** Oznaka nadzora uz verifikovane (podrazumevano da; graf je ne prikazuje). */
  prikaziNadzor?: boolean;
  /**
   * Sopstvena stranica Potvrde (odluka vlasnika, 24.10.2026): koga je nosilac
   * potvrdio stoji JEDNOM, u spisku sa oznakama ispod (`MojeOznake`, sidro
   * `#moje-oznake`), pa se ovde umesto mreže imena ispisuje samo broj i veza.
   */
  verifikovaniIspod?: boolean;
};

/**
 * Oznaka nadzora — stoji sa strane pseudonima.
 * „nadzirano" = zelena kvačica (bez teksta); „čeka nadzor" = zlatna oznaka.
 */
export function StatusBadge({ status }: { status: CvorVerifikovani["statusNadzora"] }) {
  const t = useTranslations("verifikacija");
  if (status === "ne-podleze") return null;
  if (status === "nadzirano") {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className="w-4 h-4 shrink-0 text-kolo-green-700"
      >
        <title>{t("stablo_nadzirano")}</title>
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <span className="text-[11px] px-1.5 py-0.5 rounded-md border shrink-0 bg-kolo-gold-100 text-kolo-gold-700 border-kolo-gold-100">
      {t("stablo_ceka_nadzor")}
    </span>
  );
}

/** Link na profil ili dugme (kada je zadat onKlik) — isti izgled. */
function Stavka({
  id,
  pseudonim,
  onKlik,
  className,
  children,
}: {
  id: string;
  pseudonim: string;
  onKlik?: (id: string) => void;
  className: string;
  children: React.ReactNode;
}) {
  if (onKlik) {
    return (
      <button type="button" onClick={() => onKlik(id)} className={`text-left ${className}`}>
        {children}
      </button>
    );
  }
  return (
    <Link href={profilHref({ id, pseudonim })} className={className}>
      {children}
    </Link>
  );
}

export default function MiniStablo({
  ja,
  verifikatori,
  verifikovani,
  jeJaPocetni,
  className = "",
  naslov,
  onKlik,
  tekstovi,
  prikaziNadzor = true,
  verifikovaniIspod = false,
}: Props) {
  const t = useTranslations("verifikacija");
  // Pozivalac sme da nadjača tekst (`tekstovi`/`naslov`); podrazumevano ide prevod.
  const naslovFinal = naslov ?? t("stablo_naslov");
  const bezVerifikatora = tekstovi?.bezVerifikatora ?? t("stablo_bez_verifikatora");
  const osnivac = tekstovi?.osnivac ?? t("stablo_osnivac");
  const bezVerifikovanih = tekstovi?.bezVerifikovanih ?? t("stablo_bez_verifikovanih");

  return (
    <div className={`rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica ${className}`}>
      <div className="text-sm uppercase tracking-wide text-kolo-muted font-semibold mb-4">
        {naslovFinal}
      </div>

      {/* Gore: verifikatori (može ih biti više) */}
      <div className="flex flex-col items-center gap-2">
        {verifikatori.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-2 max-w-md">
            {verifikatori.map((v) => (
              <Stavka
                key={v.id}
                id={v.id}
                pseudonim={v.pseudonim}
                onKlik={onKlik}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-kolo-bg hover:bg-kolo-green-100 text-sm font-medium"
              >
                @<Pseudonim>{v.pseudonim}</Pseudonim>
                <OznakaVrste vrsta={v.vrsta} potvrdjen={v.potvrdjen} />
              </Stavka>
            ))}
          </div>
        ) : jeJaPocetni ? (
          <div className="px-3 py-1.5 rounded-xl bg-kolo-bg text-sm text-kolo-muted italic">
            {osnivac}
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-kolo-bg text-sm text-kolo-muted italic">
            {bezVerifikatora}
          </div>
        )}
        <div className="text-kolo-muted text-lg">↓</div>

        {/* Sredina: nosilac kartice */}
        <div className="px-4 py-2 rounded-xl bg-kolo-green-700 text-white text-sm font-semibold">
          <Pseudonim>{ja.pseudonim}</Pseudonim>
          {ja.prikaz && <span className="ml-2 text-white/70 text-xs font-mono">{ja.prikaz}</span>}
        </div>

        {/* Dole: koga je verifikovao */}
        {verifikovaniIspod && verifikovani.length > 0 && (
          <>
            <div className="text-kolo-muted text-lg">↓</div>
            <a href="#moje-oznake" className="px-3 py-1.5 rounded-xl bg-kolo-bg hover:bg-kolo-green-100 text-sm font-medium text-kolo-green-700">
              {t("stablo_vidi_ispod", { n: verifikovani.length })}
            </a>
          </>
        )}
        {!verifikovaniIspod && verifikovani.length > 0 && (
          <>
            <div className="text-kolo-muted text-lg">↓</div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {verifikovani.map((v) => (
                <Stavka
                  key={v.id}
                  id={v.id}
                  pseudonim={v.pseudonim}
                  onKlik={onKlik}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-kolo-bg hover:bg-kolo-green-100"
                >
                  <span className="text-sm font-medium truncate">@<Pseudonim>{v.pseudonim}</Pseudonim></span>
                  <OznakaVrste vrsta={v.vrsta} potvrdjen={v.potvrdjen} />
                  {prikaziNadzor && <StatusBadge status={v.statusNadzora} />}
                </Stavka>
              ))}
            </div>
          </>
        )}
        {verifikovani.length === 0 && (
          <>
            <div className="text-kolo-muted text-lg">↓</div>
            <div className="px-3 py-1.5 rounded-xl bg-kolo-bg text-xs text-kolo-muted italic">
              {bezVerifikovanih}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
