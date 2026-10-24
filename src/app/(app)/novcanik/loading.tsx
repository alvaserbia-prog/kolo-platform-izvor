import { IstorijaSkeleton } from "./IstorijaTransakcija";

// Instant skeleton dok server pripremi karticu (laki upit: stanje POEN).
// Uklanja belu pauzu pri ulasku na /novcanik.
export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="bg-kolo-green-700 bg-linear-to-br from-kolo-green-700 to-kolo-green-500 rounded-2xl p-6 shadow-lg h-[7.5rem] animate-pulse opacity-80" />
      <IstorijaSkeleton />
    </div>
  );
}
