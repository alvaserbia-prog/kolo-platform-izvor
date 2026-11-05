import { IstorijaSkeleton } from "./IstorijaTransakcija";
import Stranica from "@/components/ui/Stranica";

// Instant skeleton dok server pripremi karticu (laki upit: stanje POEN).
// Uklanja belu pauzu pri ulasku na /novcanik.
export default function Loading() {
  return (
    <Stranica sirina="siroka">
      {/* Isti oblik kao kartica stanja POEN-a (bez naslova iznad nje). */}
      <div className="h-[11rem] animate-pulse rounded-kartica bg-kolo-green-700 bg-linear-to-br from-kolo-green-700 to-kolo-green-500 opacity-80" />
      <IstorijaSkeleton />
    </Stranica>
  );
}
