"use client";

import { useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Ikone kartica — jedan set, jedna težina linije, jedna boja.
 *
 * Do 03.09.2026. su ovde stajali emodži (🌱🔧👴👵…). Zamenjeni su zato što se
 * emodži na svakom uređaju iscrtava drugačije — na desktopu čita kao
 * improvizacija, a između Windowsa, Androida i Applea nema dva ista prikaza.
 * Ovako kartice izgledaju kao jedan sistem, a ne kao devet slika iz raznih
 * izvora.
 *
 * Sve ikone dele isti viewBox 24×24, `strokeWidth` 1.6 i zaobljene završetke —
 * dodavati nove samo po tom pravilu, inače se set raspada.
 */
const IKONE: Record<string, ReactNode> = {
  // Poljoprivrednici i lokalni proizvođači — list na stabljici
  klica: <><path d="M12 21c0-6 3-11 9-13 0 8-4 13-9 13Z" /><path d="M12 21c0-3-1.4-5.8-4-7.7" /></>,
  // Zanatlije i majstori — ključ
  alat: <><circle cx="8.5" cy="8.5" r="4.5" /><path d="M11.8 11.8 20 20" /></>,
  // Penzioneri — peščani sat (iskustvo, proteklo vreme)
  vreme: <><path d="M7 3h10M7 21h10" /><path d="M7 3c0 4 5 5 5 9s-5 5-5 9" /><path d="M17 3c0 4-5 5-5 9s5 5 5 9" /></>,
  // Domaćice — šerpa sa parom
  kuvanje: <><path d="M4 10h16" /><path d="M5.5 10v5a4 4 0 0 0 4 4h5a4 4 0 0 0 4-4v-5" /><path d="M9 6.5c0-1.5 1-2 1-3M13 6.5c0-1.5 1-2 1-3" /></>,
  // Roditelji — odrasli i dete
  porodica: <><circle cx="8" cy="7" r="3" /><path d="M3 20v-1a5 5 0 0 1 10 0v1" /><circle cx="17.5" cy="11.5" r="2" /><path d="M14.5 20v-.5a3 3 0 0 1 6 0v.5" /></>,
  // Mladi i oni koji tek počinju — izlazak sunca
  pocetak: <><path d="M4 18h16" /><path d="M6.5 18a5.5 5.5 0 0 1 11 0" /><path d="M12 4v2.5M6.2 7.2l1.8 1.8M17.8 7.2 16 9" /></>,
  // Ljudi koji drže do svog kraja — oznaka mesta
  mesto: <><path d="M12 21s6.5-5.7 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.3 12 21 12 21Z" /><circle cx="12" cy="10" r="2.4" /></>,
  // Zadruge i udruženja — tri povezana člana
  mreza: <><circle cx="12" cy="5" r="2.4" /><circle cx="5" cy="17" r="2.4" /><circle cx="19" cy="17" r="2.4" /><path d="M10.6 7.1 6.6 14.9M13.4 7.1l4 7.8M7.4 17h9.2" /></>,
  // Preduzetnici i lokalne firme — poslovna tašna (ista kao „Firme" u meniju)
  firma: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 13h18" /></>,
  // Programeri i istraživači — uglaste zagrade
  kod: <><path d="M9 7 4 12l5 5M15 7l5 5-5 5" /></>,
};

export type KomeIkona = keyof typeof IKONE;

export type KomeKartica = {
  ikona: KomeIkona;
  naslov: string;
  opis: string;
  /** Kartica koja ima kuda da vodi (zajednica → lokacije na `/zadruge`). */
  link?: { href: string; label: string };
};

/**
 * Kartice „Za koga je KOLO?" — prvih `vidljivo` stoji otvoreno, ostatak se
 * otkriva dugmetom.
 *
 * Skrivene kartice se ISCRTAVAJU i samo sakriju CSS-om, ne izbacuju iz DOM-a:
 * tako ceo spisak ostaje u HTML-u koji server pošalje, pa ga pretraživač
 * indeksira i bez klika na dugme.
 *
 * Ikona je dekoracija (`aria-hidden`) — čitač ekrana bi inače pre naslova
 * kartice izgovorio ime slike, što ne nosi nikakav podatak.
 */
export default function KomeKartice({
  kartice,
  vidljivo = 6,
  labelJos,
  labelManje,
}: {
  kartice: KomeKartica[];
  vidljivo?: number;
  labelJos: string;
  labelManje: string;
}) {
  const [prosireno, setProsireno] = useState(false);
  const imaSkrivenih = kartice.length > vidljivo;

  return (
    <>
      {/* Telefon (vlasnik, 24.10.2026): jedna kartica u redu, vodoravno — ikona levo,
          tekst desno, veza u svom redu i nikad ne prelama. U dve uske kolone tekstovi
          različite dužine i veze od tri reči su se lomili svaka na svoj način.
          Od `sm` dve kolone, od `lg` četiri; kartica je tada uspravna, a veza stoji
          pri dnu, pa se veze u istom redu poravnaju. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kartice.map((seg, i) => (
          <div
            key={seg.naslov}
            className={`bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-4 flex flex-row sm:flex-col gap-3 sm:gap-2${
              i >= vidljivo && !prosireno ? " hidden" : ""
            }`}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-kolo-gold-700 shrink-0"
              aria-hidden="true"
            >
              {IKONE[seg.ikona]}
            </svg>
            <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-kolo-text text-base sm:text-sm leading-snug">{seg.naslov}</h3>
              <p className="text-sm sm:text-xs text-kolo-muted leading-relaxed">{seg.opis}</p>
              {seg.link && (
                <Link
                  href={seg.link.href}
                  className="mt-1 sm:mt-auto sm:pt-1 inline-flex min-h-9 items-center self-start whitespace-nowrap lg:whitespace-normal text-sm sm:text-xs font-semibold text-kolo-green-700 hover:text-kolo-green-900 hover:underline"
                >
                  {seg.link.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {imaSkrivenih && (
        <button
          type="button"
          onClick={() => setProsireno((v) => !v)}
          aria-expanded={prosireno}
          className="text-sm font-medium text-kolo-green-700 hover:text-kolo-green-900 transition-colors"
        >
          {prosireno ? labelManje : labelJos} {prosireno ? "↑" : "↓"}
        </button>
      )}
    </>
  );
}
