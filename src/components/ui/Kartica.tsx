import type { HTMLAttributes, ReactNode } from "react";

/**
 * Kartica: jedan radijus (`rounded-kartica`), jedan okvir, jedna senka.
 *
 * Pre ovoga je bela kartica postojala u 55 kombinacija (pet paddinga, tri
 * sistema senke). Kartica u kartici NE dobija okvir — unutrašnji blok je
 * `bg-kolo-bg rounded-kontrola p-4`, bez ivice.
 *
 * `naglasena` je za najviše jednu karticu u mreži (npr. ključni broj).
 */
export default function Kartica({
  padding = "md",
  naglasena = false,
  as: Tag = "div",
  className = "",
  children,
  ...ostalo
}: {
  padding?: "sm" | "md" | "lg" | "nema";
  naglasena?: boolean;
  as?: "div" | "section" | "article" | "li";
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const p = { sm: "p-4", md: "p-5", lg: "p-6", nema: "" }[padding];
  const ton = naglasena
    ? "bg-kolo-green-700 text-white border border-kolo-green-700"
    : "bg-kolo-surface border border-kolo-border";
  return (
    <Tag {...ostalo} className={`${ton} rounded-kartica shadow-kartica ${p} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
