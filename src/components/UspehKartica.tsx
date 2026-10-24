"use client";

import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";

/**
 * Pun „uspeh" ekran (zeleni krug + kvačica + naslov + opis + dugme),
 * stilski usklađen sa ekranom posle postavljanja oglasa (NoviOglasForma).
 * Renderuje se unutar kartice (Kartica) da legne u layout /verifikacija.
 */
export default function UspehKartica({
  naslov,
  opis,
  dugmeTekst,
  onDugme,
  drugoDugme,
}: {
  naslov: string;
  opis: React.ReactNode;
  dugmeTekst: string;
  onDugme: () => void;
  /** Sporedno dugme (npr. „Zatvori"), ispod glavnog. */
  drugoDugme?: { tekst: string; onKlik: () => void };
}) {
  return (
    <Kartica padding="lg">
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-kolo-green-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-kolo-green-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="kolo-naslov">{naslov}</h2>
        <p className="text-sm text-kolo-muted max-w-sm mx-auto">{opis}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Dugme onClick={onDugme} velicina="lg">
            {dugmeTekst}
          </Dugme>
          {drugoDugme && (
            <Dugme onClick={drugoDugme.onKlik} velicina="lg" varijanta="sekundarno">
              {drugoDugme.tekst}
            </Dugme>
          )}
        </div>
      </div>
    </Kartica>
  );
}
