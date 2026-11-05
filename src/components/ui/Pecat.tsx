import type { ReactNode } from "react";

/**
 * Pečat — kratka oznaka velikim slovima, nakrivljena kao pečat na flajeru
 * (DOMAĆE i „bez potvrde" na Pijaci, NOVO i „još 3" na vaučeru, status kupona).
 * Pre ovoga je isti oblik ručno prepisan na šest mesta. Zlatni tekst je samo
 * `gold-700`, `gold-600` samo okvir (dizajn-sistem.md).
 */
export type PecatTon = "zeleni" | "zlatni" | "sivi";

const TON: Record<PecatTon, string> = {
  zeleni: "border-kolo-green-700 text-kolo-green-700",
  zlatni: "border-kolo-gold-600 text-kolo-gold-700",
  sivi: "border-kolo-border text-kolo-muted",
};

export function klasePecata(ton: PecatTon = "zlatni") {
  return `inline-block rotate-[-6deg] rounded-md border-2 bg-kolo-surface/95 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${TON[ton]}`;
}

export default function Pecat({ children, ton = "zlatni", className = "" }: { children: ReactNode; ton?: PecatTon; className?: string }) {
  return <span className={`${klasePecata(ton)} ${className}`.trim()}>{children}</span>;
}
