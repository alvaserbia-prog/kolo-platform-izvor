import AppShell from "@/components/AppShell";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { sesija } from "@/lib/sesija";
import { jeAdmin, jeZadruzniAdmin, mozeNadzor } from "@/lib/dozvole";

export default async function PijacaLayout({ children }: { children: React.ReactNode }) {
  const session = await sesija();

  if (session) {
    // `session.user` već nosi tipKorisnika+admin → nadzor status bez DB poziva.
    return (
      <AppShell
        verified={session.user.verified}
        isAdmin={jeAdmin(session.user) || jeZadruzniAdmin(session.user)}
        jeNadzornik={mozeNadzor(session.user)}
      >
        {children}
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-kolo-bg flex flex-col">
      <PublicHeader />
      {/* Isti razmaci kao u `AppShell`-u; širinu daje `Stranica` u samoj stranici
          (`siroka` za Pijacu, `uska` za oglas), pa gost i član vide isti raspored. */}
      <main className="w-full flex-1 px-4 py-5 md:px-8 md:py-6">{children}</main>
      <PublicFooter />
    </div>
  );
}
