import type { Metadata } from "next";

/**
 * Kratka adresa člana (`/m/<hash>`) samo preusmerava na profil, ali hash je
 * trajna oznaka naloga — ne treba da završi u pretrazi. Isti razlog kao kod
 * stranica sa tokenom u `(auth)`.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MLayout({ children }: { children: React.ReactNode }) {
  return children;
}
