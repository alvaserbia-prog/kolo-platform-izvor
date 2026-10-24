"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "next-auth";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  // QueryClient se pravi JEDNOM po browseru (useState init), ne na svaki render —
  // inače bi se keš resetovao. Podrazumevana podešavanja keša za ceo app:
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Podaci su „sveži" 30s → navigacija tamo-nazad u tom prozoru NE
            // pravi nov mrežni poziv (služi se iz keša). Ovo je srž ubrzanja:
            // ranije je svaka navigacija refetchovala sve.
            staleTime: 30_000,
            // Keš se drži 5 min posle što ga niko ne koristi, pa povratak na
            // stranicu odmah prikaže stare podatke dok se u pozadini osvežava.
            gcTime: 5 * 60_000,
            // Osveži kad se korisnik vrati na tab (jeftino jer je staleTime kratak).
            refetchOnWindowFocus: true,
            // Ne ponavljaj beskonačno na grešci — jednom je dovoljno.
            retry: 1,
          },
        },
      }),
  );

  // `session` se seeduje sa servera (getServerSession) da useSession() odmah
  // ima podatke — bez toga svaki load kreće u "loading" i pravi mrežni poziv na
  // /api/auth/session, što na sporoj vezi dugo prikazuje "Učitavam...".
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
