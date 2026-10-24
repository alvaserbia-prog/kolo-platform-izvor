import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { SistemskiEkran } from "@/components/SistemskiEkran";
import { ODRZAVANJE, normalizujJezik } from "@/lib/ekran-poruke";

// Naslov kartice pregledača na jeziku čitaoca, iz istog skupa kao ekran.
export async function generateMetadata(): Promise<Metadata> {
  const jezik = normalizujJezik(await getLocale());
  return {
    title: ODRZAVANJE[jezik].naslov,
    // Održavanje je privremeno stanje — ne sme da uđe u indeks kao sadržaj sajta.
  robots: { index: false, follow: false },
  };
}

/**
 * PLANIRANO ODRŽAVANJE — ekran koji se namerno uključuje dok se radi na sistemu.
 *
 * Prekidač je env varijabla `ODRZAVANJE=1` (Vercel → Settings → Environment
 * Variables, scope Production za ekolo.rs), a preusmeravanje radi `proxy.ts`.
 * ⚠️ Vercel env varijable se primenjuju na SLEDEĆI deploy — posle uključivanja
 * ili isključivanja treba pokrenuti redeploy (Deployments → Redeploy).
 *
 * Za NEPLANIRAN pad (baza nedostupna, greška u renderu) ne treba dirati ništa —
 * tada se sam od sebe prikaže `global-error.tsx` / `error.tsx` sa istim izgledom.
 */
export default async function OdrzavanjePage() {
  const jezik = normalizujJezik(await getLocale());
  return <SistemskiEkran tekst={ODRZAVANJE[jezik]} />;
}
