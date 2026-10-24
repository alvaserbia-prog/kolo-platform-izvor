import type { ReactNode } from "react";

/**
 * Omotač sadržaja stranice sa jednom od dve širine: `uska` za forme i tekst,
 * `siroka` za mreže, tabele i Pijacu. Pre ovoga je postojalo sedam širina, pa
 * je sadržaj „skakao" pri prelasku između stranica.
 */
export default function Stranica({
  sirina = "uska",
  children,
  className = "",
}: {
  sirina?: "uska" | "siroka";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${sirina === "uska" ? "max-w-uska" : "max-w-siroka"} w-full space-y-6 pb-16 ${className}`.trim()}>
      {children}
    </div>
  );
}
