import Link from "next/link";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";

/**
 * Spisak ljudi čiji se prvi doprinos čeka, uz zabeleženu potvrdu odnosno nadzor.
 *
 * Namerno LINKOVI na profil, a ne goli tekst: podsetiti čoveka znači otići kod njega,
 * pa put do njega mora biti jedan klik — inače spisak samo imenuje problem. Adresa ide
 * kroz `profilHref` (u interfejsu pseudonim, interni id u svemu što se čuva).
 *
 * 🔴 Ne prikazuje ni iznos po čoveku ni datum potvrde. Iznos stoji jednom, u redu
 * iznad: po vezi je uvek isti (1.000 odn. 500), pa bi ponovljen uz svako ime samo
 * sugerisao da se o njemu pregovara. Spisak odgovara na jedno pitanje — koga podsetiti.
 *
 * 🔴 JEDNA definicija za oba ekrana (POEN i Potvrde). Do 21.09.2026 je živela samo u
 * `NovcanikKartice.tsx`, a Potvrde su isti podatak ispisivale kao rečenicu po čoveku
 * („Potvrdio si X — 1.000 POENA ti se upisuje kad…"), pa je spisak od pet potvrda bio
 * pet redova teksta. Ne vraćati taj oblik i ne praviti drugu kopiju ove komponente.
 *
 * Nije klijentska komponenta — uvoze je i `NovcanikKartice` („use client") i serverska
 * stranica `/verifikacija`.
 */
export default function SpisakCekanja({
  ljudi,
}: {
  ljudi: { id: string; pseudonim: string }[];
}) {
  if (ljudi.length === 0) return null;
  return (
    <ul className="mt-1.5 flex flex-wrap gap-1.5">
      {ljudi.map((o) => (
        <li key={o.id}>
          <Link
            href={profilHref({ id: o.id, pseudonim: o.pseudonim })}
            className="inline-block rounded-full border border-kolo-gold-200 bg-kolo-gold-50 px-2.5 py-0.5 text-sm text-kolo-gold-700 hover:bg-kolo-gold-100"
          >
            @<Pseudonim>{o.pseudonim}</Pseudonim>
          </Link>
        </li>
      ))}
    </ul>
  );
}
