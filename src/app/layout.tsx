import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { sesija } from "@/lib/sesija";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale, getTranslations } from "next-intl/server";
import CirilicaProvider from "@/components/CirilicaProvider";
import { Analitika, VercelAnalitika } from "@/components/Analitika";
import { AktivnostTracker } from "@/components/AktivnostTracker";
import { CookieConsent } from "@/components/CookieConsent";
import {
  SITE_URL,
  SITE_NAME,
  IS_PRODUCTION,
  absoluteUrl,
  OG_LOCALE,
  hreflangAlternates,
} from "@/lib/seo";

/** GA4 ekolo.rs. Env `GA_MEASUREMENT_ID` ga menja bez izmene koda. */
const GA_MEASUREMENT_ID = "G-JY214NWCDK";

// Podrazumevani font za latiničke korisnike. "latin-ext" pokriva srpske
// dijakritike (č, ć, š, ž, đ); ćirilica NIJE ovde da ne bi opterećivala
// kritičnu putanju (LCP) — ogromna većina koristi latinicu.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Ćirilica se učitava LENJO — koristi se samo kad je locale "sr-Cyrl".
// `preload: false` znači da latinički korisnici nikad ne preuzimaju ovaj fajl.
// Sadrži sva 3 subseta (jedna koherentna familija pokriva i latinicu i
// ćirilicu) da next/font fallback ne bi "ukrao" ćirilične glifove. Deli isti
// `--font-inter` var jer se primenjuje međusobno isključivo sa `inter`.
const interCirilica = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
  preload: false,
});

// Mono nije above-the-fold LCP tekst — ne preload-uje se da ne troši kritičnu putanju.
// Serif samo za citate (pesma na naslovnoj, „O nama", „O sistemu"). Ranije je
// stajao `Georgia` upisan u stil, koji na Linuxu i Androidu pada na Times.
// Source Serif 4 ima srpsku latinicu i ćirilicu.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin", "latin-ext", "cyrillic"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  // Naslov i opis u <head> (ono što Google prikaže u rezultatima pretrage i što
  // se vidi kad se link deli) idu kroz prevod. Ranije su bili zakucani na
  // srpskom, pa je ruski posetilac na ruskoj stranici dobijao srpski opis.
  const tSeo = await getTranslations("seo");
  const naslov = tSeo("site_naslov");
  const opis = tSeo("site_opis");

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: naslov,
      template: `%s — ${SITE_NAME}`,
    },
    description: opis,
    applicationName: SITE_NAME,
    // PWA manifest — omogućava „Dodaj na početni ekran" (uslov za Web Push na iOS-u).
    manifest: "/manifest.webmanifest",
    // Van produkcije (test/preview) NE indeksirati — sprečava da *.vercel.app
    // kanibalizuje ekolo.rs kao duplikat sadržaja.
    robots: IS_PRODUCTION
      ? { index: true, follow: true }
      : { index: false, follow: false },
    alternates: { canonical: "/", languages: hreflangAlternates("/") },
    verification: {
      google: "ZOi4durEtkkCiW-gVwphcJZu55zu4Q5UxRyl8Q88BdM",
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale] ?? "sr_RS",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: naslov,
      description: opis,
      // og:image obezbeđuje opengraph-image.tsx (dinamička 1200×630) — ne dupliramo ovde.
    },
    twitter: {
      card: "summary_large_image",
      title: naslov,
      description: opis,
    },
    icons: {
      // Favicon je ISTI znak kao u sidebaru i manifestu (odluka vlasnika
      // 06.10.2026). Uprošćen `kolo-znak.svg` (tri kruga oko zrna) je bio favicon
      // od 27.09., ali nije ličio na KOLO ikonicu, pa je vraćen PNG.
      icon: [{ url: "/kolo-icon.png", type: "image/png" }],
      apple: "/kolo-icon.png",
    },
  };
}

/** Organization strukturirani podaci (JSON-LD) — pomaže Google Knowledge panelu.
 *  Opis prima spolja, iz prevoda: ovo je isti tekst koji Google prikazuje uz
 *  rezultat, pa mora da bude na jeziku posetioca. */
function organizationJsonLd(opis: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KOLO",
    url: SITE_URL,
    logo: absoluteUrl("/kolo-logo.png"),
    description: opis,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const tSeo = await getTranslations("seo");

  // Pad autentikacije (nedostupna baza, nedostajuća `NEXTAUTH_SECRET`…) NE sme
  // da obori ceo dokument. Ako `RootLayout` baci, Next ne može serverski da
  // renderuje NIŠTA — ni `error.tsx`, koji živi unutar ovog layout-a — pa šalje
  // prazan HTML i tek na klijentu (posle hidratacije) prikaže `global-error.tsx`.
  // Korisnik do tada gleda belinu, a bez JavaScript-a i trajno.
  // Zato ovde gutamo grešku: layout se renderuje kao da korisnik nije prijavljen,
  // a stranica koja stvarno zavisi od baze pukne sama i pokaže SERVERSKI
  // renderovan ekran „Radimo na sistemu".
  // ⚠️ Guta se SAMO ovde, ne u `sesija()` — rute i stranice koje na osnovu
  // sesije odlučuju o pristupu moraju i dalje da puknu, a ne da tiho tretiraju
  // prijavljenog korisnika kao gosta.
  let session = null;
  try {
    session = await sesija();
  } catch (greska) {
    console.error("[layout] sesija nedostupna — render bez sesije", greska);
  }

  // Google Analytics: samo na ekolo.rs (test i preview ne mešaju podatke sa
  // produkcijom) i nikad za maloletni nalog. Prijavljen nalog čiji token još ne
  // zna odgovor (`maloletan === undefined`) čeka prvo osvežavanje — radije
  // propušten pregled nego merenje deteta.
  const gaId =
    IS_PRODUCTION && (!session?.user || session.user.maloletan === false)
      ? (process.env.GA_MEASUREMENT_ID ?? GA_MEASUREMENT_ID)
      : null;

  // Klijentski i18n payload: NextIntlClientProvider serijalizuje poruke u HTML i
  // šalje ih klijentu na SVAKOJ stranici. Ceo set je ~118KB; ovi namespace-ovi se
  // koriste ISKLJUČIVO u serverskim komponentama (preko `getTranslations`) — javne
  // sadržajne stranice (pravni akti, landing, „o sistemu"…). Izbacujemo ih iz
  // klijentskog providera (~40KB manje) bez uticaja na server render (server čita
  // pun set nezavisno od ovog prop-a). Denylist (ne allowlist): nov namespace se
  // podrazumevano UKLJUČUJE → nema rizika od regresije kad se doda klijentski tekst.
  // VAŽNO: namespace dodati ovde tek pošto se potvrdi da ga NE koristi nijedna
  // klijentska komponenta (`useTranslations`).
  const SERVER_ONLY_NS = new Set([
    "pravne", "landing", "oSistemu", "kakoFunkcionisePage",
    "zajednickoDobroPage", "osnivackiDoprinosPage", "pokroviteljPage", "podrziPage",
  ]);
  const clientMessages = Object.fromEntries(
    Object.entries(messages).filter(([ns]) => !SERVER_ONLY_NS.has(ns)),
  );

  // Ćirilični korisnici dobijaju Inter sa ćirilicom (lenjo, bez preload-a);
  // svi ostali podrazumevani latinički Inter. Obuhvata i "ru" — bez toga bi ruski
  // tekst pao na sistemski fallback font (osnovni Inter nema ćirilične glifove).
  const CIRILICNI_LOCALE = new Set(["sr-Cyrl", "ru"]);
  const fontInter = CIRILICNI_LOCALE.has(locale) ? interCirilica : inter;

  return (
    <html lang={locale} className={`${fontInter.variable} ${jetbrainsMono.variable} ${sourceSerif.variable} h-full`}>
      <body className="h-full antialiased">
        <Script
          id="organization-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd(tSeo("site_opis"))),
          }}
        />
        {/* SVE što zove `useTranslations` MORA biti unutar ovog providera — inače
            next-intl baca praznu grešku i obara SSR cele stranice. CookieConsent
            je bio ispod njega dok je imao zakucan srpski tekst; kad je prebačen na
            prevode, rušio je svaku stranicu (uključujući 404). Ne vaditi ga odavde. */}
        <NextIntlClientProvider messages={clientMessages}>
          <CirilicaProvider />
          <Providers session={session}>
            {/* Dnevnik aktivnosti — beleži posete stranica prijavljenih korisnika. */}
            <AktivnostTracker />
            {children}
          </Providers>
          <CookieConsent />
        </NextIntlClientProvider>
        {/* Vercel Analytics — bez kolačića (cookieless, agregatno), ne zahteva pristanak. */}
        <VercelAnalitika />
        {/* Google Analytics — učitava se SAMO uz pristanak (čl. 7 Politike). */}
        <Analitika gaId={gaId} />
      </body>
    </html>
  );
}
