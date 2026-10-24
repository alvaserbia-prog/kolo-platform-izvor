import type { ReactNode } from "react";

/**
 * Obaveštenje u tekstu stranice: info, upozorenje, greška, uspeh.
 *
 * Zamenjuje sedam oblika upozorenja (`.box-warning` sa trakom i bez nje, žuti
 * boks sa ivicom, gola narandžasta rečenica, krem boks…) i `.box-info`.
 * 🔴 Tekst je UVEK taman — zlatna i crvena nose podlogu i traku, ne slova
 * (narandžasti tekst na krem podlozi imao je 2,3 : 1).
 */
export type VrstaObavestenja = "info" | "upozorenje" | "greska" | "uspeh";

const TON: Record<VrstaObavestenja, { okvir: string; ikona: string }> = {
  info: { okvir: "bg-kolo-green-50 border-kolo-green-700 text-kolo-text", ikona: "text-kolo-green-700" },
  upozorenje: { okvir: "bg-kolo-gold-100 border-kolo-gold-600 text-kolo-text", ikona: "text-kolo-gold-700" },
  greska: { okvir: "bg-kolo-danger-light border-kolo-danger text-kolo-text", ikona: "text-kolo-danger" },
  uspeh: { okvir: "bg-kolo-green-100 border-kolo-green-700 text-kolo-text", ikona: "text-kolo-green-700" },
};

function Ikona({ vrsta }: { vrsta: VrstaObavestenja }) {
  const zajednicko = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (vrsta === "uspeh")
    return <svg {...zajednicko}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></svg>;
  if (vrsta === "greska")
    return <svg {...zajednicko}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5" /><path d="M12 16h.01" /></svg>;
  if (vrsta === "upozorenje")
    return <svg {...zajednicko}><path d="M12 3.5l9 16H3z" /><path d="M12 10v4" /><path d="M12 17h.01" /></svg>;
  return <svg {...zajednicko}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></svg>;
}

export default function Obavestenje({
  vrsta = "info",
  naslov,
  radnja,
  className = "",
  children,
}: {
  vrsta?: VrstaObavestenja;
  naslov?: ReactNode;
  radnja?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const ton = TON[vrsta];
  return (
    <div
      role={vrsta === "greska" ? "alert" : undefined}
      className={`flex gap-3 rounded-kontrola border-l-4 px-4 py-3 text-sm leading-relaxed ${ton.okvir} ${className}`.trim()}
    >
      <span className={`mt-0.5 shrink-0 ${ton.ikona}`}><Ikona vrsta={vrsta} /></span>
      <div className="min-w-0 flex-1 space-y-1">
        {naslov && <p className="font-semibold">{naslov}</p>}
        {children && <div className="space-y-1">{children}</div>}
        {radnja && <div className="pt-1">{radnja}</div>}
      </div>
    </div>
  );
}
