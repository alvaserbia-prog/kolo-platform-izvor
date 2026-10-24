"use client";

import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/ui/Logo";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import JezikSvitcer from "@/components/JezikSvitcer";

interface DnevniBrojevi {
  pocetna: number;
  novcanik: number;
  pijaca: number;
  adminCekanje: number;
}

interface SidebarProps {
  /**
   * Verifikovan (set 4.8.2): član bez potvrde, član Kola, čuvar Kola, osnivač —
   * `session.user.verified`. Punoletan nalog koji nije verifikovan je KORISNIK.
   */
  verified: boolean;
  isAdmin: boolean;
  jeNadzornik?: boolean; // čuvar Kola ili osnivač (`mozeNadzor`) — vidi link „Nadzor"
  brojZaNadzor?: number; // badge na sidebar-u
  /** Maloletni korisnik (Modul Deca) — dobija sopstvenu, kraću navigaciju. */
  maloletan?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  dnevniBrojevi?: DnevniBrojevi | null;
}

function jeAktivan(pathname: string, href: string) {
  return pathname === href || (href !== "/sistem" && pathname.startsWith(href + "/"));
}

function BadgePill({ broj }: { broj: number }) {
  return (
    <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-kolo-gold-400 text-black text-xs font-semibold">
      {broj}
    </span>
  );
}

// Ikonice navigacije — inline SVG (isti stil kao u Header-u: 24x24, stroke currentColor).
// Mapiranje ruta → ikonica drži izgled doslednim i bez dodatne zavisnosti.
function NavIkona({ href, mali }: { href: string; mali?: boolean }) {
  const s = mali ? 17 : 20;
  const p = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (href) {
    case "/pocetna":
      return <svg {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>;
    case "/sistem":
      return <svg {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></svg>;
    // Knjiga zapisa, ne novčanik: POEN je zapis u Protokolu, a ne sredstvo koje
    // se drži (Pravilnik čl. 12). Ikonica novčanika je vraćala asocijaciju na
    // novac jaču od same reči u labeli.
    // Zadruga — kuća sa ambarom: lokalno mesto razmene, ne zgrada ustanove.
    case "/zadruge":
      return <svg {...p}><path d="M3 21V10l9-6 9 6v11" /><path d="M9 21v-6h6v6" /><path d="M3 21h18" /><path d="M10 10h4" /></svg>;
    // Mapa — čioda na presavijenoj karti: mesto, ne putanja.
    case "/mapa":
      return <svg {...p}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14" /><path d="M15 6v14" /></svg>;
    // Gazdinstvo — klas: hrana sa njive, a ne zgrada ni ograda.
    case "/gazdinstva":
      return <svg {...p}><path d="M12 22V8" /><path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5Z" /><path d="M12 13c3 0 5-2 5-5-3 0-5 2-5 5Z" /><path d="M12 18c-3 0-5-2-5-5 3 0 5 2 5 5Z" /><path d="M12 18c3 0 5-2 5-5-3 0-5 2-5 5Z" /><path d="M12 8c-1.5-1-2-2.5-1.5-5 1.5.5 2 2 1.5 5Z" /></svg>;
    case "/novcanik":
      return <svg {...p}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v15" /><path d="M4 4.5v15A2.5 2.5 0 0 0 6.5 22H20" /><path d="M20 18H6.5a2.5 2.5 0 0 0 0 4" /><path d="M9 7h7" /><path d="M9 11h7" /></svg>;
    case "/pijaca":
      return <svg {...p}><path d="m2 7 2-4h16l2 4" /><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" /><path d="M2 7h20" /><path d="M9 21v-6h6v6" /></svg>;
    // Kolektivna nabavka — kamion, ne korpa ni paket: korpa/tezga je Pijaca
    // (razmena između članova), a paket je ikonica grupe „Zajedničko dobro".
    // Nabavka je dovoz na veliko od dobavljača, pa je vozilo jedini oblik koji
    // se ne meša ni sa jednim od ta dva.
    case "/nabavke":
      return <svg {...p}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
    // Škola — zgrada sa zastavicom, ne diplomska kapa: kapa čita kao fakultet,
    // a pregled po školama obuhvata osnovne i srednje.
    case "/skole":
      return <svg {...p}><path d="m4 6 7.11-3.55a2 2 0 0 1 1.78 0L20 6" /><path d="M6 5v17" /><path d="M18 5v17" /><path d="m18 10 3.45 1.72a1 1 0 0 1 .55.9V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.38a1 1 0 0 1 .55-.9L6 10" /><circle cx="12" cy="9" r="2" /><path d="M14 22v-4a2 2 0 1 0-4 0v4" /></svg>;
    // Kontaktiraj nas — slušalica: zahtev da te neko od članova pozove.
    case "/kontaktiraj-nas":
      return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>;
    case "/verifikacija":
      return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "/zrno":
      return <svg {...p}><path d="M7 20h10" /><path d="M12 20V11" /><path d="M12 11C9 11 7 9 7 6c3 0 5 2 5 5Z" /><path d="M12 11c0-3 2-5 5-5 0 3-2 5-5 5Z" /></svg>;
    case "/doprinos-oglasi":
      return <svg {...p}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8" /><path d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" /></svg>;
    case "/programi":
      return <svg {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6" /><path d="M9 16h6" /></svg>;
    case "/nadzor":
      return <svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "/doniraj":
    case "/donacije":
    case "/podrzi-kolo":
      return <svg {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z" /></svg>;
    // Vaučer — kupon sa zarezom, ne novčanica: vaučer glasi na dobro, ne na iznos.
    case "/vauceri":
      return <svg {...p}><path d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>;
    // Firma — poslovna tašna: radnja ili preduzeće, a ne tezga (to je Pijaca).
    case "/firme":
      return <svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></svg>;
    case "/postani-pokrovitelj":
      return <svg {...p}><circle cx="12" cy="8" r="6" /><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" /></svg>;
    case "/prijatelji":
      return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "/admin":
      return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9" /></svg>;
  }
}

function NavLink({ href, label, broj, aktivan, zakljucano, opisZakljucano, uvuceno, onClick }: {
  href: string; label: string; broj: number; aktivan: boolean; zakljucano?: boolean; opisZakljucano?: string; uvuceno?: boolean; onClick?: () => void;
}) {
  const uvlaka = uvuceno ? "pl-6" : "px-3";
  // Zaključana stavka (korisniku, odluka vlasnika 22.10.2026): vidi se, zasivljena
  // je i nosi katanac, a vodi na Potvrde — tamo piše kako se ulazi u Kolo. Pravo
  // pristupa i dalje sprovodi server; ovo je samo putokaz.
  if (zakljucano) {
    return (
      <Link
        href="/verifikacija"
        onClick={onClick}
        title={opisZakljucano}
        aria-label={`${label} — ${opisZakljucano}`}
        className={`group relative flex items-center gap-2.5 ${uvlaka} pr-3 py-2 rounded-xl text-base font-medium text-white/40 hover:bg-white/5 hover:text-white/60 transition-all duration-150`}
      >
        <span className="shrink-0 opacity-60"><NavIkona href={href} mali={uvuceno} /></span>
        <span className="flex-1 truncate">{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-2.5 ${uvlaka} pr-3 py-2 rounded-xl text-base font-medium transition-all duration-150 ${
        aktivan ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      {aktivan && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-kolo-gold-400" aria-hidden="true" />
      )}
      <span className={`shrink-0 transition-opacity ${aktivan ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
        <NavIkona href={href} mali={uvuceno} />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {broj > 0 && <BadgePill broj={broj} />}
    </Link>
  );
}

// Ikonica padajuće grupe: Zajednica — ljudi, Zajedničko dobro — paket zajedničkih resursa.
function IkonaGrupe({ vrsta }: { vrsta: "zajednica" | "zajednicko_dobro" }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return vrsta === "zajednica"
    ? <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    : <svg {...p}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;
}

type Stavka = { href: string; label: string; zakljucano?: boolean };

// Padajuća grupa — red sa strelicom otvara i zatvara stavke. Sama je otvorena
// kad je tekuća ruta jedna od njenih stavki; zatvorena nosi zbirni badge.
// Zaključane stavke ostaju u grupi (korisnik ih vidi čim je otvori).
function PadajucaGrupa({ label, vrsta, links, badge, pathname, opisZakljucano, onLinkClick }: {
  label: string;
  vrsta: "zajednica" | "zajednicko_dobro";
  links: Stavka[];
  badge: Record<string, number>;
  pathname: string;
  opisZakljucano: string;
  onLinkClick?: () => void;
}) {
  const nekiAktivan = links.some((l) => jeAktivan(pathname, l.href));
  const [otvoreno, setOtvoreno] = useState(nekiAktivan);
  useEffect(() => {
    if (nekiAktivan) setOtvoreno(true);
  }, [nekiAktivan]);
  const zbirBadge = links.reduce((s, l) => s + (badge[l.href] ?? 0), 0);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOtvoreno((o) => !o)}
        aria-expanded={otvoreno}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-medium transition-all duration-150 ${
          nekiAktivan ? "text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className={`shrink-0 transition-opacity ${nekiAktivan ? "opacity-100" : "opacity-70"}`}>
          <IkonaGrupe vrsta={vrsta} />
        </span>
        <span className="flex-1 text-left truncate">{label}</span>
        {!otvoreno && zbirBadge > 0 && <BadgePill broj={zbirBadge} />}
        <svg
          className={`shrink-0 w-4 h-4 transition-transform duration-200 ${otvoreno ? "rotate-90" : ""}`}
          viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
        >
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
        </svg>
      </button>
      {/* Glatka animacija visine preko grid-rows 0fr→1fr (bez JS merenja) */}
      <div
        inert={!otvoreno}
        className={`grid transition-all duration-200 ease-out ${otvoreno ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5">
            {links.map(({ href, label: l, zakljucano: z }) => (
              <NavLink
                key={href}
                href={href}
                label={l}
                broj={badge[href] ?? 0}
                aktivan={jeAktivan(pathname, href)}
                zakljucano={z}
                opisZakljucano={opisZakljucano}
                uvuceno
                onClick={onLinkClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  verified,
  isAdmin,
  jeNadzornik,
  brojZaNadzor,
  maloletan,
  onLinkClick,
  dnevniBrojevi,
}: {
  verified: boolean;
  isAdmin: boolean;
  jeNadzornik?: boolean;
  brojZaNadzor?: number;
  maloletan?: boolean;
  onLinkClick?: () => void;
  dnevniBrojevi?: DnevniBrojevi | null;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const badge: Record<string, number> = dnevniBrojevi ? {
    "/pocetna": dnevniBrojevi.pocetna,
    "/novcanik": dnevniBrojevi.novcanik,
    "/pijaca": dnevniBrojevi.pijaca,
    "/admin": dnevniBrojevi.adminCekanje,
  } : {};
  if (jeNadzornik && brojZaNadzor && brojZaNadzor > 0) {
    badge["/nadzor"] = brojZaNadzor;
  }

  type Grupa = { label?: string; padajuca?: "zajednica" | "zajednicko_dobro"; links: Stavka[] };

  // Korisniku su ove stavke vidljive, ali zaključane (Uslovi čl. 14, Pravilnik
  // čl. 28): vaučeri, ZRNO, programi, operativni doprinos, nabavka i zadruga
  // otvaraju se tek kad uđe u Kolo. Članu bez potvrde su sve otvorene (čl. 5a st. 8).
  const zakljucano = !verified;

  const adminGrupa: Grupa[] = isAdmin ? [{ links: [{ href: "/admin", label: t("admin") }] }] : [];

  // Isti kostur za korisnika i za člana (odluka vlasnika, 22.10.2026): kad
  // korisnik uđe u Kolo, meni se ne preslaže — samo se otključaju stavke.
  //  - Sistem: samostalna stavka odmah ispod Početne — pregled se gleda često.
  //  - Razmena: POEN, Pijaca, Vaučeri — ono što se radi svaki dan.
  //  - Zajednica (padajuća): oni koji su postali deo Kola i zajednice — gazdinstva,
  //    firme, zadruge, škole — i mapa koja ih pokazuje. Nije geografska
  //    celina: tu se prikazuje i ono što je van mesta korisnika (odluka vlasnika
  //    24.10.2026).
  //  - Podrži KOLO: odmah ispod Zajednice; JEDNA stavka; na stranici se bira lično (donacija) ili kao
  //    firma, udruženje ili registrovano gazdinstvo (pokroviteljstvo u novcu ili u
  //    dobrima i uslugama).
  //  - Poverenje: put kroz Kolo — Potvrde, Nadzor (čuvari), ZRNO (položaj čuvara Kola).
  //    ZRNO stoji uz čuvanje, ne uz dobra i sredstva (ZRNO nije ulaganje, čl. 25).
  //  - Zajedničko dobro (padajuća): ono što zajednica radi za sebe — Zadaci, Nabavke,
  //    Programi.
  //  - „Nadzor" vidi samo čuvar Kola (`jeNadzornik`, dokaz čl. 10 st. 2) — to nije
  //    stavka koja se otključava ulaskom u Kolo, pa je ostali ne vide ni zaključanu.
  const grupe: Grupa[] = maloletan
    ? // Modul Deca — navigacija je KRAĆA VERZIJA, ne filtrirana. Filtrirana bi pri
      // svakoj budućoj izmeni tiho propuštala nove stavke detetu. Potvrde, ZRNO,
      // Doprinos, Programi i Donacije se ne prikazuju jer maloletni korisnik nijedno
      // od toga ne može (čl. 15), a Početna nosi Pričaonicu — sobu punoletnih.
      [
        { links: [
          { href: "/pocetna", label: t("pocetna") },
          { href: "/pijaca", label: t("pijaca") },
          { href: "/novcanik", label: t("novcanik") },
          // Dečja zamena za „Potvrde": dete nikoga ne potvrđuje (čl. 15), pa mu
          // na tom mestu stoje prijatelji.
          { href: "/prijatelji", label: t("prijatelji") },
          // Ranglista škola: detetu je to razlog da dovede druga, pa stavka stoji
          // uz prijatelje, a ne u nekoj dubljoj grupi.
          { href: "/skole", label: t("skole") },
        ] },
      ]
    : [
        { links: [
          { href: "/pocetna", label: t("pocetna") },
          { href: "/sistem", label: t("sistem") },
        ] },
        { label: t("grupa_razmena"), links: [
          { href: "/novcanik", label: t("novcanik") },
          { href: "/pijaca", label: t("pijaca") },
          { href: "/vauceri", label: t("vauceri"), zakljucano },
        ] },
        { label: t("grupa_zajednica"), padajuca: "zajednica", links: [
          { href: "/mapa", label: t("mapa") },
          { href: "/gazdinstva", label: t("gazdinstva") },
          { href: "/firme", label: t("firme") },
          // Zadruge su po lokalitetima (Pravilnik čl. 56, `docs/zadruge-model.md`).
          { href: "/zadruge", label: t("zadruge"), zakljucano },
          // Škole su ovde informativne: broj dece Kola po školi.
          { href: "/skole", label: t("skole") },
        ] },
        { links: [{ href: "/podrzi-kolo", label: t("podrzi") }] },
        // Korisniku su u „Poverenju" dva puta: Potvrde („Moj kod") i „Želim da me
        // neko nazove" — ulaz na spisak za poziv (Uslovi čl. 16b, set 4.8.2).
        { label: t("grupa_poverenje"), links: [
          { href: "/verifikacija", label: t("verifikacija") },
          ...(verified ? [] : [{ href: "/kontaktiraj-nas", label: t("kontaktiraj_nas") }]),
          ...(jeNadzornik ? [{ href: "/nadzor", label: t("nadzor") }] : []),
          { href: "/zrno", label: t("zrno"), zakljucano },
        ] },
        { label: t("grupa_zajednicko_dobro"), padajuca: "zajednicko_dobro", links: [
          { href: "/doprinos-oglasi", label: t("doprinos"), zakljucano },
          // Registar predloga radi i pre ijedne nabavke — on je mapa rupa u
          // zajednici (Pravilnik o projektima i kolektivnim nabavkama čl. 10).
          { href: "/nabavke", label: t("nabavke"), zakljucano },
          { href: "/programi", label: t("programi"), zakljucano },
        ] },
        ...adminGrupa,
      ];

  return (
    <>
      {/* Brending i jezik switcher su u headeru (gore-levo); sidebar je samo navigacija */}
      <nav className="flex-1 pl-1 pr-2.5 pt-4 pb-3 space-y-1 overflow-y-auto">
        {grupe.map((grupa, gi) => (
          // Svaka grupa (osim prve) odvojena je tankom horizontalnom linijom — celine ostaju
          // jasno razdvojene bez obzira na nejednak broj stavki. Imenovane grupe nose i naslov.
          <div key={grupa.label ?? `grupa-${gi}`} className={gi > 0 ? "mt-2 pt-2 border-t border-white/10" : ""}>
            {grupa.padajuca ? (
              <PadajucaGrupa
                label={grupa.label!}
                vrsta={grupa.padajuca}
                links={grupa.links}
                badge={badge}
                pathname={pathname}
                opisZakljucano={t("zakljucano")}
                onLinkClick={onLinkClick}
              />
            ) : (<>
            {grupa.label && (
              <p className="px-3 pt-0.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">
                {grupa.label}
              </p>
            )}
            <div className="space-y-0.5">
              {grupa.links.map(({ href, label, zakljucano: z }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  broj={badge[href] ?? 0}
                  aktivan={jeAktivan(pathname, href)}
                  zakljucano={z}
                  opisZakljucano={t("zakljucano")}
                  onClick={onLinkClick}
                />
              ))}
            </div>
            </>)}
          </div>
        ))}
      </nav>
      <div className="px-3 pb-3 pt-2 border-t border-white/10 space-y-2">
        {/* Poziv „Pridruži se Kolu" samo korisniku.
            🔴 Dete NIKAD nije `verified` (Modul Deca, čl. 15), pa mu se ovaj poziv
            prikazivao uvek i gurao ga na potvrde odraslih — a on nikoga ne potvrđuje
            niti se potvrđuje. Njegovo mesto u mreži su prijatelji. */}
        {!verified && !maloletan && (
          <Link
            href="/verifikacija"
            onClick={onLinkClick}
            className="block w-full text-center px-3 py-2 bg-kolo-gold-400 text-kolo-green-900 text-sm font-semibold rounded-xl hover:bg-kolo-gold-200 transition-colors"
          >
            {t("verifikuj_nalog")}
          </Link>
        )}
        {/* Pomoć — jedan ulaz: vodič, česta pitanja, prijava greške (/pomoc). */}
        <Link
          href="/pomoc"
          onClick={onLinkClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-base font-medium text-white/75 hover:bg-white/10 hover:text-white transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {t("pomoc")}
        </Link>
      </div>
    </>
  );
}

export default function Sidebar({ verified, isAdmin, jeNadzornik, brojZaNadzor, maloletan, mobileOpen, onMobileClose, dnevniBrojevi }: SidebarProps) {
  // Zatvori drawer pri promeni rute
  const pathname = usePathname();
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape zatvara otvoren meni na telefonu.
  useEffect(() => {
    if (!mobileOpen) return;
    const naTaster = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose?.();
    };
    window.addEventListener("keydown", naTaster);
    return () => window.removeEventListener("keydown", naTaster);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-kolo-green-900 flex-col relative self-start sticky top-0 h-[calc(100dvh-4rem)] before:absolute before:top-0 before:bottom-0 before:right-full before:w-screen before:bg-kolo-green-900 before:content-['']">
        <SidebarContent verified={verified} isAdmin={isAdmin} jeNadzornik={jeNadzornik} brojZaNadzor={brojZaNadzor} maloletan={maloletan} dnevniBrojevi={dnevniBrojevi} />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      {/* Zatvoren meni je van ekrana, ali bez `inert` njegovi linkovi i dalje
          primaju fokus tastature i čita ih čitač ekrana (10+ nevidljivih koraka). */}
      <aside
        inert={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-50 w-max min-w-[13rem] max-w-[85vw] bg-kolo-green-900 flex flex-col md:hidden transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer je širok koliko mu sadržaj traži (`w-max`): najduža stavka, mali
            razmak i strelica podmenija — ranijih fiksnih 256px ostavljalo je prazan
            pojas bez razloga. Jezik stoji odmah uz „KOLO" (odluka vlasnika
            20.10.2026), a spisak se širi udesno da ne pređe preko naziva. */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Logo tema="tamna" velicina="md" />
          <JezikSvitcer poravnaj="levo" />
        </div>
        <SidebarContent verified={verified} isAdmin={isAdmin} jeNadzornik={jeNadzornik} brojZaNadzor={brojZaNadzor} maloletan={maloletan} onLinkClick={onMobileClose} dnevniBrojevi={dnevniBrojevi} />
      </aside>
    </>
  );
}
