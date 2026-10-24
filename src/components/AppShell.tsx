"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PolitikaPristanak from "./PolitikaPristanak";
import PlutajucaPotvrda from "./PlutajucaPotvrda";
import AppFooter from "./AppFooter";
import { useMe, useMeEventBridge, useMePatch, ME_KEY } from "@/hooks/useMe";
import { useSkrolPamcenje } from "@/hooks/useSkrolPamcenje";
import { useTranslations } from "next-intl";

interface AppShellProps {
  verified: boolean;
  isAdmin: boolean;
  jeNadzornik?: boolean;
  children: React.ReactNode;
}

export default function AppShell({ verified, isAdmin, jeNadzornik, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const tc = useTranslations("common");
  const pathname = usePathname();
  const qc = useQueryClient();
  // Back/forward vraća poziciju skrola sadržaja (skrol je u div-u ispod, ne na
  // window-u, pa browser/Next restauracija ne važi).
  const skrolRef = useSkrolPamcenje<HTMLDivElement>();

  // Jedan keširan izvor za ceo chrome (balans, badge-evi, notifikacije, nadzor,
  // politika) — deli se sa Header-om kroz React Query keš. Ranije: 6 fetch-eva.
  useMeEventBridge();
  const { data: me } = useMe();
  const patchMe = useMePatch();

  const dnevniBrojevi = me?.dnevniBrojevi ?? null;
  const brojZaNadzor = me?.nadzorBroj ?? 0;

  // Gejt za pristanak na nove akte (Uslovi čl. 40, Politika čl. 16).
  //
  // 🔴 Prekrivač, NE preusmeravanje (izmena 11.08.2026). Ranije je gejt na svaku
  // promenu rute radio `router.replace("/politika-prihvati")`. Dve posledice, obe
  // viđene u dnevniku aktivnosti: (a) ko ne bi pritisnuo „Pristajem" nego kliknuo
  // dalje po meniju, bio bi izbačen sa svake stranice — smenjivanje `/novcanik` ↔
  // `/politika-prihvati` u krug; (b) kad bi server već znao za pristanak, a
  // keširani `['me']` još ne, ekran je „blicao" između dve rute dok poll ne stigne.
  // Prekrivač ne dira rutu, pa nijedno od toga nije moguće — a pristup je jednako
  // zatvoren, jer stoji preko svega dok se ne pristane.
  //
  // `/profil` je namerno izuzet: Politika čl. 16 i Uslovi čl. 40 (v4.1.1) izričito
  // kažu da ograničenje pristupa do prihvatanja NE dira u pravo na pristup,
  // prenosivost i brisanje podataka. Ta prava se ostvaruju upravo na podešavanjima
  // profila (eksport + gašenje naloga), a ekran za prihvatanje na njih i linkuje.
  //
  // Poređenje je TAČNO `/profil`, ne `startsWith`: `/profil/<pseudonim>` je tuđi javni
  // profil, a `/profil/oglasi` moji oglasi — to nisu prava iz ZZPL-a i ostaju iza gejta.
  //
  // `/politika-prihvati` je izuzet jer sama stranica već prikazuje isti ekran.
  const prikaziPristanak =
    !!me?.politikaPotrebno &&
    pathname !== "/politika-prihvati" &&
    pathname !== "/profil";

  // Kad korisnik otvori Novčanik/Pijaca → označi "viđeno" (badge ide na 0).
  // Optimistički nuliramo lokalno (setQueryData), pa serveru javimo da pomeri
  // "viđeno" vreme i invalidiramo keš da se uskladi.
  useEffect(() => {
    const sekcija =
      pathname.startsWith("/pocetna") ? "pocetna" :
      pathname.startsWith("/novcanik") ? "novcanik" :
      pathname.startsWith("/pijaca") ? "pijaca" :
      null;
    if (!sekcija) return;

    patchMe(
      dnevniBrojevi
        ? { dnevniBrojevi: { ...dnevniBrojevi, [sekcija]: 0 } }
        : {},
    );
    fetch("/api/dnevni-brojevi/vidjeno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sekcija }),
    })
      .then(() => qc.invalidateQueries({ queryKey: ME_KEY }))
      .catch(() => {});
  // Pokreće se na promenu rute; dnevniBrojevi namerno van deps (čita se sveža
  // vrednost samo radi optimističkog nulovanja).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="min-h-full md:h-full bg-kolo-bg text-kolo-text flex flex-col overflow-x-clip">
      {/* Prvi element za tastaturu i čitač ekrana: bez njega je do sadržaja
          trebalo 21 pritiskanje Tab-a (zaglavlje + ceo meni). */}
      <a
        href="#sadrzaj"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-kolo-gold-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-kolo-green-900"
      >
        {tc("preskoci_na_sadrzaj")}
      </a>
      <Header onMenuOpen={() => setMobileOpen(true)} />
      {/* Na računaru skrol je u ovom div-u, na punoj širini viewporta → skrolbar
          je uz desnu ivicu ekrana. Na TELEFONU se skroluje cela stranica: adresna
          traka se tada skuplja, dodir na statusnu traku vraća na vrh, a „nazad"
          pamti mesto (unutrašnji skrol je to kvario i hvatao prst). */}
      <div ref={skrolRef} className="md:flex-1 md:min-h-0 md:overflow-y-auto">
      <div className="flex w-full min-w-0">
        <Sidebar
          verified={verified}
          isAdmin={isAdmin}
          jeNadzornik={jeNadzornik}
          brojZaNadzor={brojZaNadzor}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          maloletan={me?.maloletan ?? false}
          dnevniBrojevi={dnevniBrojevi}
        />
        <main id="sadrzaj" tabIndex={-1} className="flex-1 min-w-0 outline-none">
          <div className="px-4 py-5 md:px-8 md:py-6">
            {children}
          </div>
          <AppFooter />
        </main>
      </div>
      </div>
      {prikaziPristanak && <PolitikaPristanak />}
      {/* Član bez potvrde: „Želim da me neko nazove radi potvrde" (dokaz čl. 4a, 5c). */}
      {!prikaziPristanak && <PlutajucaPotvrda />}
    </div>
  );
}
