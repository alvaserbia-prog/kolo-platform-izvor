import { IstorijaSkeleton } from "./IstorijaTransakcija";
import Stranica from "@/components/ui/Stranica";

// Instant skeleton dok server pripremi karticu (laki upit: stanje POEN).
// Uklanja belu pauzu pri ulasku na /novcanik.
export default function Loading() {
  return (
    <Stranica sirina="siroka">
      {/* Isti oblik kao zeleno zaglavlje POEN-a (bez naslova iznad njega). */}
      <div className="h-[12rem] animate-pulse rounded-kartica bg-kolo-green-900 bg-linear-to-br from-kolo-green-900 to-kolo-green-800 opacity-80" />
      <IstorijaSkeleton />
    </Stranica>
  );
}
