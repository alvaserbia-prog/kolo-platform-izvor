import AppShell from "@/components/AppShell";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { sesija } from "@/lib/sesija";
import { jeAdmin, mozeNadzor } from "@/lib/dozvole";

/**
 * Sistem ima sopstveni raspored, kao Zadruge i Škole (odluka vlasnika, 24.10.2026):
 * kartice i zbirovi su javni i vidi ih neprijavljen posetilac, a prijavljen ih gleda
 * unutar rasporeda sa bočnim menijem. Spiskove (učesnici, razmene, zapisi, donacije)
 * gostu server ni ne čita — Politika privatnosti čl. 6, gost vidi samo agregat.
 */
export default async function SistemLayout({ children }: { children: React.ReactNode }) {
  const session = await sesija();

  if (session) {
    return (
      <AppShell
        verified={session.user.verified}
        isAdmin={jeAdmin(session.user)}
        jeNadzornik={mozeNadzor(session.user)}
      >
        {children}
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-kolo-bg flex flex-col">
      <PublicHeader />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 w-full flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
