import AppShell from "@/components/AppShell";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { sesija } from "@/lib/sesija";
import { jeAdmin, jeZadruzniAdmin, mozeNadzor } from "@/lib/dozvole";

/**
 * Zadruge imaju sopstveni raspored, kao i gazdinstva i škole: spisak mesta i
 * napredak ka prvoj zadruzi je zbir bez imena i vidi ga i neprijavljen posetilac,
 * a prijavljen član ga gleda unutar rasporeda sa bočnim menijem. Stranica zadruge
 * (`/zadruge/[id]`) ostaje iza prijave — proxy otvara samo tačnu putanju.
 */
export default async function ZadrugeLayout({ children }: { children: React.ReactNode }) {
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
