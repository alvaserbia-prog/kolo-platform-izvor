import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { sesija } from "@/lib/sesija";
import { jeAdmin, mozeNadzor } from "@/lib/dozvole";

// Autentifikovane stranice su iza prijave (bot ih ne može dohvatiti — proxy
// preusmerava na /login). Zato su `noindex` i NEMAJU canonical: bez ovoga su
// nasleđivale root canonical `/` (Lighthouse SEO: „canonical pokazuje na
// homepage umesto na odgovarajuću stranicu"). `canonical: null` uklanja nasleđeni.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await sesija();
  if (!session) redirect("/");

  // `session.user` već nosi `tipKorisnika` i `admin` (jwt/session callback), pa
  // nadzor/admin status izvodimo iz sesije — bez dodatnog DB poziva po renderu.
  const jeNadzornik = mozeNadzor(session.user);

  return (
    <AppShell
      verified={session.user.verified}
      isAdmin={jeAdmin(session.user)}
      jeNadzornik={jeNadzornik}
    >
      {children}
    </AppShell>
  );
}
