import AppShell from "@/components/AppShell";
import PublicHeader from "@/components/PublicHeader";
import { sesija } from "@/lib/sesija";
import { jeAdmin, mozeNadzor } from "@/lib/dozvole";

/**
 * Stranice škola imaju sopstveni raspored, kao i Pijaca: nacionalne rang-liste
 * su čist zbir bez ijednog imena i vidi ih i neprijavljen posetilac, a prijavljen
 * član ih gleda unutar uobičajenog rasporeda sa bočnim menijem.
 */
export default async function SkoleLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-kolo-bg">
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
