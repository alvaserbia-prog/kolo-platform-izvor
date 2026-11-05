import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";

/**
 * Kartica: jedan radijus (`rounded-kartica`), jedan okvir, jedna senka.
 *
 * Pre ovoga je bela kartica postojala u 55 kombinacija (pet paddinga, tri
 * sistema senke). Kartica u kartici NE dobija okvir — unutrašnji blok je
 * `bg-kolo-bg rounded-kontrola p-4`, bez ivice.
 *
 * Tonovi: `obicna` (bela), `naglasena` (zelena, za najviše jednu karticu u mreži,
 * npr. ključni broj), `zelena` (svetlozelena podloga — preporuka, korak koji sledi),
 * `opasnost` (crveni okvir — nepovratna radnja, „opasna zona").
 * `href` pravi karticu-link (ceo blok se klikće, hover pojača okvir) — pre ovoga
 * ručno crtan na dvanaest mesta. `klaseKartice()` je za retke slučajeve kad
 * omotač mora biti drugi element (npr. `<button>`).
 */
export type KarticaTon = "obicna" | "naglasena" | "zelena" | "opasnost";
export type KarticaPadding = "sm" | "md" | "lg" | "nema";

const TON: Record<KarticaTon, string> = {
  obicna: "bg-kolo-surface border border-kolo-border",
  naglasena: "bg-kolo-green-700 text-white border border-kolo-green-700",
  zelena: "bg-kolo-green-50 border border-kolo-green-200",
  opasnost: "bg-kolo-surface border border-kolo-danger/40",
};
const PADDING: Record<KarticaPadding, string> = { sm: "p-4", md: "p-5", lg: "p-6", nema: "" };

export function klaseKartice({
  ton = "obicna",
  padding = "md",
  link = false,
}: { ton?: KarticaTon; padding?: KarticaPadding; link?: boolean } = {}) {
  return [
    TON[ton],
    "rounded-kartica shadow-kartica",
    PADDING[padding],
    link ? "block transition-colors hover:border-kolo-green-500" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Kartica({
  padding = "md",
  naglasena = false,
  ton,
  href,
  as: Tag = "div",
  className = "",
  children,
  ...ostalo
}: {
  padding?: KarticaPadding;
  /** Zatečeno ime za `ton="naglasena"`. */
  naglasena?: boolean;
  ton?: KarticaTon;
  href?: string;
  as?: "div" | "section" | "article" | "li";
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const t: KarticaTon = ton ?? (naglasena ? "naglasena" : "obicna");
  if (href) {
    return (
      <Link href={href} className={`${klaseKartice({ ton: t, padding, link: true })} ${className}`.trim()}>
        {children}
      </Link>
    );
  }
  return (
    <Tag {...ostalo} className={`${klaseKartice({ ton: t, padding })} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
