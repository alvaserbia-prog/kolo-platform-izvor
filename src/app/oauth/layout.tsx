import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";

/**
 * Ceo ovaj deo je van pretrage.
 *
 * Nije stvar SEO-a nego privatnosti: adrese ovde nose JEDNOKRATNI TOKEN u
 * putanji ({token} za reset lozinke, poziv roditelju i odjavu sa pošte). Takav
 * link ume da procuri — čovek ga nalepi u poruku, klijent za poštu ga učita
 * unapred — a jednom indeksiran, ostaje javan i pošto token istekne.
 *
 * `robots.txt` te putanje takođe zabranjuje, ali on samo traži da se stranica ne
 * OBILAZI; ova oznaka traži da se ne INDEKSIRA i važi i kad je stranica već
 * dohvaćena. Zato oba, ne jedno umesto drugog.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};


export default function OAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-kolo-bg">
      <PublicHeader />
      <div className="flex justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}
