import AppShell from "@/components/AppShell";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { sesija } from "@/lib/sesija";
import { jeAdmin, jeZadruzniAdmin, mozeNadzor } from "@/lib/dozvole";

/**
 * Gazdinstva imaju sopstveni raspored, kao i Pijaca i škole: mapa domaćih
 * proizvođača je javna (Pravilnik o gazdinstvima čl. 11) i vidi je i neprijavljen
 * posetilac, a prijavljen član je gleda unutar rasporeda sa bočnim menijem.
 */
export default async function GazdinstvaLayout({ children }: { children: React.ReactNode }) {
  const session = await sesija();

  if (session) {
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
      <main className="max-w-4xl mx-auto px-6 py-8 w-full flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
