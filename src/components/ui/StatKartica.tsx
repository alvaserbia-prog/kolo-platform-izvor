import type { ReactNode } from "react";

/**
 * Kartica sa jednim brojem (Sistem, ZRNO, Programi, admin Pregled).
 * Broj se smanjuje sa širinom kartice (`.broj-kartica-vrednost`), nikad se ne
 * prelama. U jednoj mreži najviše JEDNA `istaknuta` kartica.
 */
export default function StatKartica({
  oznaka,
  vrednost,
  podnaslov,
  istaknuta = false,
  dodatak,
}: {
  oznaka: ReactNode;
  vrednost: string;
  podnaslov?: ReactNode;
  istaknuta?: boolean;
  dodatak?: ReactNode;
}) {
  return (
    <div
      className={`broj-kartica rounded-kartica shadow-kartica p-4 flex flex-col gap-1 ${
        istaknuta ? "bg-kolo-green-700 text-white border border-kolo-green-700" : "bg-kolo-surface border border-kolo-border"
      }`}
    >
      <p
        className="broj-kartica-vrednost font-bold"
        style={{ ["--znakova" as string]: vrednost.length }}
      >
        {vrednost}
      </p>
      <p className={`text-sm ${istaknuta ? "text-white/90" : "text-kolo-muted"} flex items-center gap-1`}>
        {oznaka}
        {dodatak}
      </p>
      {podnaslov && <p className={`text-xs ${istaknuta ? "text-white/80" : "text-kolo-muted"}`}>{podnaslov}</p>}
    </div>
  );
}
