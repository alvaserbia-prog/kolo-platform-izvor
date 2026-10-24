import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Jedno dugme za celu aplikaciju (odluka vlasnika 22.10.2026, pregled izgleda).
 *
 * Pre ovoga je primarno dugme postojalo u 42 kombinacije klasa, sa tri radijusa,
 * pet visina i hover-om koji na 21 mestu nije radio. Varijante:
 *  - `primarno`   — glavna radnja ekrana, zelena;
 *  - `sekundarno` — ravnopravna druga radnja, belo sa okvirom;
 *  - `tiho`       — sporedna radnja, bez okvira;
 *  - `opasno`     — nepovratna radnja (isključenje, brisanje);
 *  - `zlatno`     — SAMO „Pridruži se" (brend-poziv), tamni tekst na zlatnoj.
 *
 * 🔴 Ugašeno dugme zadržava taman tekst (providnost), nikad bledo zeleno sa
 * belim tekstom (ispod 3 : 1). Gde čovek može da ne zna ZAŠTO je ugašeno,
 * dugme se ne gasi — klik pokazuje šta fali.
 *
 * Nije globalna CSS klasa: `kolo-dugme-*` klase su zabranjene (CLAUDE.md).
 */
export type DugmeVarijanta = "primarno" | "sekundarno" | "tiho" | "opasno" | "zlatno";
export type DugmeVelicina = "sm" | "md" | "lg";

const VARIJANTE: Record<DugmeVarijanta, string> = {
  primarno: "bg-kolo-green-700 text-white hover:bg-kolo-green-800",
  sekundarno: "bg-kolo-surface text-kolo-green-700 border border-kolo-border hover:bg-kolo-bg",
  tiho: "bg-transparent text-kolo-green-700 hover:bg-kolo-green-50",
  opasno: "bg-kolo-danger text-white hover:bg-kolo-danger/90",
  zlatno: "bg-kolo-gold-400 text-kolo-green-900 hover:bg-kolo-gold-200",
};

const VELICINE: Record<DugmeVelicina, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
};

export function klaseDugmeta({
  varijanta = "primarno",
  velicina = "md",
  punaSirina = false,
}: { varijanta?: DugmeVarijanta; velicina?: DugmeVelicina; punaSirina?: boolean } = {}) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-kontrola font-semibold transition-colors",
    "disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50",
    VARIJANTE[varijanta],
    VELICINE[velicina],
    punaSirina ? "w-full" : "",
  ].join(" ");
}

type Zajednicko = {
  varijanta?: DugmeVarijanta;
  velicina?: DugmeVelicina;
  punaSirina?: boolean;
  className?: string;
  children: ReactNode;
};

type KaoDugme = Zajednicko & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type KaoLink = Zajednicko & { href: string; target?: string; rel?: string; onClick?: () => void; "aria-label"?: string };

export default function Dugme(props: KaoDugme | KaoLink) {
  const { varijanta, velicina, punaSirina, className = "", children } = props;
  const klase = `${klaseDugmeta({ varijanta, velicina, punaSirina })} ${className}`.trim();
  if (props.href !== undefined) {
    const { href, target, rel, onClick } = props;
    return (
      <Link href={href} target={target} rel={rel} onClick={onClick} aria-label={props["aria-label"]} className={klase}>
        {children}
      </Link>
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { varijanta: _v, velicina: _ve, punaSirina: _p, className: _c, children: _ch, type = "button", ...ostalo } = props;
  return (
    <button type={type} {...ostalo} className={klase}>
      {children}
    </button>
  );
}
