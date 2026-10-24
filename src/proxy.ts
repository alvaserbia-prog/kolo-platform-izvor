import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { jeAdmin, jeZadruzniAdmin } from "@/lib/dozvole";

/**
 * Stranice koje nose JEDNOKRATNI TOKEN u putanji i moraju da rade BEZ prijave.
 *
 * 🔴 Ovo nije popuštanje nego ispravka: sve tri stranice su i napravljene za
 * čoveka koji u tom trenutku nije prijavljen — roditelja koji tek dobija poruku o
 * detetu, dete koje otvara poštu na tuđem telefonu, primaoca koji hoće da se
 * odjavi. Dok su bile van ovog spiska, proxy ih je slao na `/login` pre nego što
 * se stranica iscrta, pa su:
 *  - „Ovo nije moje dete" i „Obriši nalog" (Pravilnik o učešću dece čl. 4b st. 4)
 *    bili nedostupni upravo osobi kojoj su namenjeni — onome ko nije član a čiju
 *    je adresu dete pogrešno unelo;
 *  - uputstvo „Ako još niste na KOLU" stajalo na stranici koju neregistrovan
 *    roditelj nikad nije video;
 *  - potvrda imejl adrese deteta padala u najčešćem slučaju (pošta se otvara na
 *    uređaju na kome nalog nije prijavljen).
 *
 * Pristup ostaje zatvoren tamo gde treba: sam token je dokaz da čovek drži poruku,
 * a radnje koje traže nalog (preuzimanje deteta) proveravaju sesiju u SVOJOJ ruti,
 * ne u proxy-ju — `POST /api/deca/poziv/[token]` vraća 401 za `preuzmi`, a
 * propušta `odbij` i `obrisi`.
 *
 * Sve tri su uz to `noindex` (v. `app/(auth)/layout.tsx`) i u `robots.txt`.
 */
const JAVNE_TOKEN_RUTE = ["/dete-poziv", "/potvrdi-email", "/odjava-obavestenja"];

export const JAVNE_RUTE = [
  ...JAVNE_TOKEN_RUTE,
  "/", "/pijaca", "/kako-funkcionise", "/kako-sistem-radi", "/pravna-pozicija", "/vesti", "/uslovi",
  "/privatnost", "/m", "/politika-prihvati", "/pokrovitelji", "/o-nama", "/o-sistemu",
  "/cesto-postavljena-pitanja", "/pravilnik", "/statut", "/uskoro", "/odrzavanje",
  "/whitepaper", "/dpia", "/radnje-obrade", "/rizici", "/osnivacki-doprinos", "/zajednicko-dobro",
  // Jedan javni ulaz za podršku (donacija i pokroviteljstvo); radni ekrani traže prijavu.
  "/podrzi-kolo",
  // Mapa i profili gazdinstava su javni (Pravilnik o gazdinstvima čl. 11); prijava
  // i upravljanje traže sesiju i to proveravaju same stranice i rute.
  "/gazdinstva",
  // Jedna mapa gazdinstava i pokrovitelja (donacije čl. 13 st. 4) — javna kao i gazdinstva.
  "/mapa",
  // Spisak firmi sa vaučerima — javan kao mapa (donacije čl. 13 st. 4).
  "/firme",
];

/**
 * Rute koje su javne SAMO na tačnoj putanji — podrute im ostaju zatvorene.
 *
 * 🔴 Zašto zaseban spisak: `JAVNE_RUTE` se poklapa i po prefiksu (`r + "/"`), pa
 * bi `/skole` upisano tamo otvorilo i `/skole/<šifra>`. Pravilnik o učešću dece
 * čl. 15a razlikuje dva pregleda i daje im različit obim: zbirni pregled je čist
 * zbir bez ijednog podatka o ličnosti, dok se pojedinačna škola — gde se vide
 * pseudonimi dece te škole — daje „prijavljenima". Jedan spisak sa poklapanjem
 * po prefiksu ne ume da napravi tu razliku.
 *
 * Do ove ispravke su OBA pregleda bila zatvorena: `src/app/skole/layout.tsx` ima
 * granu za gosta sa `PublicHeader`, ali je proxy slao na `/login` pre nego što
 * se stranica iscrta, pa ta grana nikad nije dolazila na red.
 *
 * `/zadruge` je ista podela: spisak mesta je zbir bez imena i javan je, a stranica
 * zadruge nosi zapise i zadrugare pod pseudonimom i vide je redovni članovi
 * (Pravilnik o zadrugama čl. 19).
 */
// `/sistem` (odluka vlasnika, 24.10.2026): kartice i zbirovi su javni, a spiskove
// gostu stranica ni ne čita (Politika privatnosti čl. 6).
export const JAVNE_TACNE_RUTE = ["/skole", "/zadruge", "/sistem"];

/**
 * Prvi segment svake stranice koja postoji u `src/app` (uključujući one u
 * grupama ruta). Gost na adresi čiji prvi segment NIJE ovde dobija stranicu
 * 404 umesto forme za prijavu — pogrešno prepisan link iz poruke inače izgleda
 * kao da traži nalog. Zatvorene stranice i dalje vode na `/login`.
 *
 * 🔴 Nova stranica na vrhu → dopisati segment. Brana:
 * `__tests__/proxy-nepoznata-ruta-izvor.test.ts` poredi spisak sa `src/app`.
 */
export const POZNATI_SEGMENTI = [
  "admin", "bagovi", "cesto-postavljena-pitanja", "dashboard", "deca", "dete-poziv",
  "dobrodosli", "donacije", "doniraj", "doprinos-oglasi", "dpia", "firme", "gazdinstva",
  "glasanje", "kako-funkcionise", "kako-sistem-radi", "kontaktiraj-nas", "login", "m",
  "mapa", "nabavke", "nadzor", "novcanik", "o-nama", "o-sistemu", "oauth",
  "odjava-obavestenja", "odrzavanje", "osnivacki-doprinos", "pijaca", "pocetna",
  "podrzi-kolo", "pokrovitelji", "politika-prihvati", "pomoc", "poruke", "postani-pokrovitelj", "potvrdi-email",
  "pravilnik", "pravilnik-prihvati", "pravna-pozicija", "prijatelji", "privatnost",
  "profil", "programi", "radnje-obrade", "registracija", "reset-lozinka", "rizici",
  "sistem", "skole", "statut", "tabla-jemstva", "uskoro", "uslovi", "vauceri",
  "verifikacija", "vesti", "whitepaper", "zaboravljena-lozinka", "zadruge",
  "zajednicko-dobro", "zrno",
];

const ZAKLJUCANE_ULAZNE_RUTE = [
  "/login", "/registracija", "/oauth",
  "/zaboravljena-lozinka", "/reset-lozinka",
];

/**
 * Prekidač za PLANIRANO održavanje. Uključuje se env varijablom `ODRZAVANJE=1`
 * (Vercel → Environment Variables, scope Production) + redeploy — env se
 * primenjuje tek na sledeći build.
 *
 * Namerno je env varijabla, a NE zapis u bazi: održavanje se najčešće uključuje
 * upravo zbog radova na bazi, pa prekidač ne sme da zavisi od nje.
 *
 * Za NEPLANIRAN pad ovo se ne dira — tada nastupa `app/global-error.tsx`.
 */
const ODRZAVANJE_UKLJUCENO = process.env.ODRZAVANJE === "1";

const PRESKOCI = [
  "/login", "/registracija", "/oauth",
  "/zaboravljena-lozinka", "/reset-lozinka",
  "/api/", "/_next", "/favicon.ico", "/icon.png",
  "/kolo-logo.png", "/kolo-icon.png", "/kolo-hero-logo.png", "/nikola-saric.png", "/nikola-saric-mantil.png", "/flags/",
  // SEO/metadata rute — moraju biti javno dostupne pretraživačima (inače bi
  // bot pri pristupu /sitemap.xml ili /robots.txt bio preusmeren na /login).
  "/sitemap.xml", "/robots.txt", "/opengraph-image", "/twitter-image", "/manifest.webmanifest",
];

/**
 * Vraća odgovor za režim održavanja, ili `null` ako zahtev treba pustiti dalje.
 *
 * Šta NE zaključava:
 * - `/api/*`, `_next/*` i statičke fajlove — isključeni su na nivou `matcher`-a,
 *   pa cron rute (noćna emisija, istek table jemstva) rade i tokom održavanja,
 *   a sam ekran može da učita logo i CSS;
 * - admine (UO) — inače vlasnik ne bi mogao da proveri sajt dok traju radovi.
 *   Provera ide preko JWT-a (`getToken`), bez upita u bazu, pa važi i kad je
 *   baza ta koja je nedostupna;
 * - `/login` i `/oauth` — bez njih bi admin koji NIJE već prijavljen ostao
 *   zaključan napolju čim uključi održavanje, jer se obilaznica oslanja na
 *   postojeći kolačić sesije. Običan korisnik se sme prijaviti, ali ga posle
 *   prijave svejedno dočeka ekran održavanja.
 *
 * ⚠️ Odgovor je HTTP 200, ne 503: `NextResponse.rewrite` preuzima status
 * odredišne rute i ne može ga nadjačati. Zato stranica nosi `noindex`
 * (metadata + `X-Robots-Tag`), da privremeni ekran ne uđe u indeks umesto
 * pravog sadržaja. `Retry-After` ostaje kao signal keševima i botovima.
 */
async function odrzavanjeOdgovor(req: NextRequest, pathname: string) {
  const propusti =
    pathname === "/odrzavanje" ||
    pathname === "/login" ||
    pathname.startsWith("/oauth");
  if (propusti) return null;

  // Ako čitanje tokena pukne (npr. nedostaje `NEXTAUTH_SECRET`), NE puštamo
  // grešku iz middleware-a — ona bi oborila SVAKI zahtev i umesto lepog ekrana
  // dala Vercel-ovu stranicu greške. Neuspela provera znači „nije admin".
  let token = null;
  try {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch (greska) {
    console.error("[odrzavanje] provera admina neuspela", greska);
  }
  if (jeAdmin({ admin: token?.admin as string | undefined })) return null;

  const url = req.nextUrl.clone();
  url.pathname = "/odrzavanje";
  url.search = "";
  const odgovor = NextResponse.rewrite(url);
  odgovor.headers.set("Retry-After", "3600");
  odgovor.headers.set("Cache-Control", "no-store");
  odgovor.headers.set("X-Robots-Tag", "noindex");
  return odgovor;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ODRZAVANJE_UKLJUCENO) {
    const odgovor = await odrzavanjeOdgovor(req, pathname);
    if (odgovor) return odgovor;
  }

  if (PRESKOCI.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const isJavna =
    JAVNE_RUTE.some((r) => pathname === r || pathname.startsWith(r + "/")) ||
    JAVNE_TACNE_RUTE.includes(pathname);
  if (isJavna) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const prviSegment = pathname.split("/")[1] ?? "";
    if (!POZNATI_SEGMENTI.includes(prviSegment)) return NextResponse.next();
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Nedovršena OAuth registracija (nalog još ne postoji u bazi, nema token.id):
  // pusti samo na /oauth/dovrsi (već u PRESKOCI), sve ostalo preusmeri tamo dok
  // korisnik ne izabere pseudonim. Sprečava da sesija bez id-a odluta na stranice
  // koje očekuju validan nalog.
  if (token.oauthPending) {
    return NextResponse.redirect(new URL("/oauth/dovrsi", req.url));
  }

  // Fallback na POCETNI tip za stare JWT-ove (pre uvođenja `admin` polja);
  // ukloniti u koraku 7 kad svi tokeni nose `admin`.
  const adminPristup =
    jeAdmin({ admin: token.admin as string | undefined }) ||
    token.tipKorisnika === "POCETNI";
  // Zadružni admin (U2) prolazi samo na `/admin/zadruga`; stranica i rute same
  // proveravaju da radi u svojoj zadruzi.
  const zadruzniPristup =
    jeZadruzniAdmin({ admin: token.admin as string | undefined }) &&
    (pathname === "/admin/zadruga" || pathname.startsWith("/admin/zadruga/"));
  if (pathname.startsWith("/admin") && !adminPristup && !zadruzniPristup) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Isključi iz proxy-ja sve što on ionako samo propušta (NextResponse.next):
  // API rute, Next interne fajlove, statičke medije (png/svg/woff…) i SEO/metadata
  // rute (manifest/robots/sitemap/og-image). Ranije ih je matcher hvatao, pa ih je
  // funkcija kratko-spajala kroz PRESKOCI — ali se PRE toga IZVRŠAVALA i trošila
  // Fluid Active CPU (proxy je bio najveći potrošač: /api/pijaca/slika/… i
  // /manifest.webmanifest su nepotrebno išli kroz runtime). Isključenjem na nivou
  // matchera funkcija se za njih UOPŠTE ne poziva. Bezbedno: auth na /api rutama je
  // u samim handlerima, ne u proxy-ju (proxy je za /api ionako vraćao next()).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|opengraph-image|twitter-image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2)$).*)",
  ],
};
