"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { KolaciciPodesavanja } from "@/components/CookieConsent";

// Svedena traka na dnu platforme. Prijavljen član inače nema klik do akata na
// koje je pristao (Uslovi, Politika, Pravilnik, Izjava o rizicima), do kontakta
// ni do licenci. Tekst dele sa `PublicFooter` (`javneKomponente.footer_*`), da se
// ne razilaze. Registracioni podaci Fondacije ovde namerno ne stoje (odluka
// vlasnika, 26.09.2026) — samo naziv.
//
// Ekrani pune visine (`/poruke`) je nemaju: tamo bi pravila drugi skrol.
const BEZ_TRAKE = ["/poruke"];

export default function AppFooter() {
  const t = useTranslations("javneKomponente");
  const pathname = usePathname();
  if (BEZ_TRAKE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  // Vrsta veze ima najmanje 40 px visine (dodirna površina), iako je tekst sitan.
  const link = "inline-flex min-h-10 items-center hover:text-kolo-green-700 transition-colors";

  return (
    <footer className="border-t border-kolo-border mx-4 md:mx-8 mt-6 py-5 text-xs text-kolo-muted leading-relaxed text-center space-y-1.5">
      <nav className="flex flex-wrap justify-center gap-x-4">
        <Link href="/uslovi" className={link}>{t("footer_link_uslovi")}</Link>
        <Link href="/privatnost" className={link}>{t("footer_link_privatnost")}</Link>
        <Link href="/pravilnik" className={link}>{t("footer_link_pravilnik")}</Link>
        <Link href="/rizici" className={link}>{t("footer_link_rizici")}</Link>
        <Link href="/cesto-postavljena-pitanja" className={link}>{t("footer_link_faq")}</Link>
        <KolaciciPodesavanja className={link} />
        <a href="mailto:kontakt@ekolo.rs" className={link}>kontakt@ekolo.rs</a>
      </nav>
      <p>
        {t("footer_copyright")}
        {" · "}
        {t("footer_softver_label")}: <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" className="hover:underline">AGPL-3.0</a>
        {" · "}
        {t("footer_sadrzaj_label")}: <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.sr" target="_blank" rel="noopener noreferrer" className="hover:underline">CC BY-SA 4.0</a>
      </p>
    </footer>
  );
}
