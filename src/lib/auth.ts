import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { WalletType } from "@/generated/prisma/client";
import { FUNKCIONALNI_PRAG_INDEKSA } from "@/lib/protokol/dokaz-stvarnosti";
import { normalizujEmail } from "@/lib/validacija";
import { potvrdjenIzPolja } from "@/lib/status-ucesnika-pravila";
import { rateLimit, klijentIP } from "@/lib/rate-limit";

/**
 * K5: `session.user.verified` se izvodi iz oba uslova (`verified` i indeks ≥ 10),
 * pa kapije po celom kodu uskraćuju pristup čim keš statusa kaže da nalog nije
 * verifikovan. Od seta 4.8.2 keš piše samo `preracunajStatusNaloga()`.
 */
function imaPunPristup(verified: boolean, indeksStvarnosti: number): boolean {
  return verified && indeksStvarnosti >= FUNKCIONALNI_PRAG_INDEKSA;
}

/**
 * Set 4.8.2: `session.user.verified` znači VERIFIKOVAN (član bez potvrde, član
 * Kola, čuvar Kola, osnivač). `potvrdjen` je uži skup — član Kola, čuvar Kola,
 * osnivač (Pravilnik čl. 28). Jedno pravilo: `potvrdjenIzPolja`.
 */
const jePotvrdjenNalog = potvrdjenIzPolja;

// Koliko često jwt callback sme da osveži status (admin/verified/pseudonim) iz
// baze. Između intervala se koriste vrednosti iz JWT-a, bez DB poziva — vidi
// objašnjenje u jwt callbacku. 5 min = razuman kompromis brzina/svežina.
const OSVEZI_INTERVAL_MS = 5 * 60 * 1000;


function generateMemberHash(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let hash = "";
  for (let i = 0; i < 8; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export async function uniqueMemberHash(): Promise<string> {
  let hash = generateMemberHash();
  while (await prisma.user.findUnique({ where: { memberHash: hash } })) {
    hash = generateMemberHash();
  }
  return hash;
}

// Da li cookie-ji idu sa `Secure` + `__Secure-` prefiksom — isto pravilo kojim
// NextAuth v4 bira svoje default-e (https baza → secure). Lokalni dev (http)
// mora bez prefiksa, inače browser odbija cookie.
const koristiSecureCookies = (
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
).startsWith("https://");

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  cookies: {
    // OAuth state cookie: NextAuth v4 default traje 15 min (900s). Korisnik koji
    // na Google ekranu za izbor naloga provede duže (zaključan telefon, pauza)
    // vraća se sa isteklim cookie-jem → „State cookie was missing" i prijava
    // pada. Produženo na 1h; ostala podešavanja identična v4 default-u.
    state: {
      name: `${koristiSecureCookies ? "__Secure-" : ""}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: koristiSecureCookies,
        maxAge: 60 * 60,
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Lozinka", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Polje se i dalje zove `email`, ali prima DVE stvari — imejl ili pseudonim
        // (ime ključa je deo NextAuth ugovora i ne menja se).
        //
        // Bez znaka „@" unos se čita kao PSEUDONIM. Heuristika je sigurna jer
        // `validanPseudonim` ne dopušta „@" u pseudonimu, pa se ta dva skupa ne seku.
        //
        // Maloletni korisnik imejl NEMA — nalog mu otvara roditelj i predaje mu
        // lozinku (Modul Deca, čl. 7), pa je ovo za njega jedini put do prijave.
        const unos = credentials.email.trim();
        const jeImejl = unos.includes("@");
        const kljuc = jeImejl ? normalizujEmail(unos) : unos.toLowerCase();

        // ── Ograničenje pokušaja ────────────────────────────────────────────
        //
        // 🔴 Ključ nosi I IP, ne samo nalog. Otkad se prijava otvara i pseudonimom,
        // identifikator je JAVAN — svako vidi tuđi pseudonim na svakom ekranu. Da je
        // brojač samo po nalogu, bilo ko bi sa deset pogrešnih pokušaja zaključao
        // tuđu prijavu na petnaest minuta, a čovek bi sa ispravnom lozinkom dobijao
        // „pogrešni podaci" i ne bi imao pojma zašto.
        //
        // Uz to stoje dve šire ograde: jedan IP ne sme da preliva pokušaje po mnogo
        // naloga, a nijedan nalog ne sme da primi neograničeno pokušaja ni sa mnogo
        // adresa (drugi prag je namerno visok — čovek ga nikad ne dodirne).
        const ip = klijentIP({
          headers: {
            get: (n: string) =>
              (req?.headers as Record<string, string> | undefined)?.[n] ?? null,
          },
        });
        const PROZOR = 15 * 60 * 1000;
        if (!rateLimit(`login:${kljuc}:${ip}`, 10, PROZOR).ok) return null;
        if (!rateLimit(`login-ip:${ip}`, 30, PROZOR).ok) return null;
        if (!rateLimit(`login-nalog:${kljuc}`, 100, PROZOR).ok) return null;

        const user = jeImejl
          ? await prisma.user.findUnique({ where: { email: kljuc } })
          : await prisma.user.findUnique({ where: { pseudonimLower: kljuc } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        if (user.status !== "ACTIVE") return null;

        return {
          id: user.id,
          email: user.email,
          pseudonim: user.pseudonim,
          tipKorisnika: user.tipKorisnika,
          admin: user.admin,
          verified: imaPunPristup(user.verified, user.indeksStvarnosti),
          potvrdjen: jePotvrdjenNalog(user),
          oauthPending: user.oauthPending,
          maloletan: user.maloletan,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Credentials — provera je u authorize()
      if (account?.provider === "credentials") return true;

      // OAuth (Google / Facebook) — email u kanonskoj formi (bez duplikata vs credentials nalog)
      const email = normalizujEmail(user.email);
      if (!email) return false;

      const provider = account!.provider;
      const oauthId = account!.providerAccountId;

      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        // Nalog postoji — samo ažuriraj oauthProvider/oauthId ako nisu postavljeni
        if (!existing.oauthProvider) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { oauthProvider: provider, oauthId },
          });
        }
        if (existing.status !== "ACTIVE") return false;
        user.id = existing.id;
        user.pseudonim = existing.pseudonim;
        user.tipKorisnika = existing.tipKorisnika;
        user.admin = existing.admin;
        user.verified = imaPunPristup(existing.verified, existing.indeksStvarnosti);
        user.potvrdjen = jePotvrdjenNalog(existing);
        user.oauthPending = existing.oauthPending;
        user.maloletan = existing.maloletan;
        return true;
      }

      // Novi korisnik — NE pravimo nalog u bazi dok ne dovrši registraciju na
      // /oauth/dovrsi (izbor pseudonima). Do tada podatke nosimo kroz JWT, pa
      // napušteni pokušaji ne ostavljaju „nalog-duh" u bazi. Sam nalog kreira
      // ruta /api/oauth/dovrsi pri izboru pseudonima.
      user.oauthPending = true;
      user.needsRegistration = true;
      user.oauthProvider = provider;
      user.oauthId = oauthId;
      user.email = email; // kanonska forma (već normalizovana iznad)
      // user.name / user.image dolaze iz Google profila (punoIme/avatar)
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        if (user.needsRegistration) {
          // Nedovršena OAuth registracija — nema reda u bazi; podaci žive u tokenu.
          token.id = undefined;
          token.oauthPending = true;
          token.pendingEmail = user.email ?? undefined;
          token.pendingProvider = user.oauthProvider;
          token.pendingOauthId = user.oauthId;
          token.pendingPunoIme = user.name ?? undefined;
          token.pendingAvatar = user.image ?? undefined;
        } else {
          token.id = user.id;
          token.pseudonim = user.pseudonim;
          token.tipKorisnika = user.tipKorisnika;
          token.admin = user.admin;
          token.verified = user.verified;
          token.potvrdjen = user.potvrdjen ?? false;
          token.oauthPending = user.oauthPending ?? false;
          token.maloletan = user.maloletan;
          token.osvezenoAt = Date.now(); // sveže iz authorize() — preskoči odmah refetch
        }
      } else if (trigger === "update" && (session as { userId?: string } | undefined)?.userId) {
        // /oauth/dovrsi je upravo kreirao nalog — preuzmi pravi id i očisti pending podatke.
        const noviId = (session as { userId: string }).userId;
        const dbUser = await prisma.user.findUnique({
          where: { id: noviId },
          select: { verified: true, indeksStvarnosti: true, potvrdjenAt: true, jeOsnivac: true, oauthPending: true, tipKorisnika: true, admin: true, pseudonim: true, maloletan: true },
        });
        if (dbUser) {
          token.id = noviId;
          token.pseudonim = dbUser.pseudonim;
          token.tipKorisnika = dbUser.tipKorisnika;
          token.admin = dbUser.admin;
          token.verified = imaPunPristup(dbUser.verified, dbUser.indeksStvarnosti);
          token.potvrdjen = jePotvrdjenNalog(dbUser);
          token.oauthPending = dbUser.oauthPending;
          token.maloletan = dbUser.maloletan;
          token.osvezenoAt = Date.now();
          token.pendingEmail = undefined;
          token.pendingProvider = undefined;
          token.pendingOauthId = undefined;
          token.pendingPunoIme = undefined;
          token.pendingAvatar = undefined;
        }
      } else if (token.id) {
        // Osveži admin/verified/tipKorisnika iz baze — ali NE na svaki zahtev.
        // Ranije je ovo bio `findUnique` po SVAKOM pozivu (a `getServerSession`
        // se zove u 100+ fajlova, više puta po renderu), pa je svaki klik radio
        // nekoliko trans-atlantskih DB poziva i kočio sajt 2–3s. Sada se osvežava
        // najviše jednom u OSVEZI_INTERVAL_MS; između toga se koriste vrednosti
        // iz JWT-a. Posledica: promena admin/verified/pseudonim statusa se vidi
        // sa zakašnjenjem do tog intervala (npr. novom adminu /admin proradi za
        // ≤ par minuta umesto odmah) — prihvatljiv kompromis za brzinu.
        // IZUZETAK: `trigger === "update"` (klijent pozvao `useSession().update()`)
        // zaobilazi interval — tok koji mora ODMAH da vidi promenu (npr. korisnik
        // upravo verifikovan → sme da postavlja oglase bez re-logina) eksplicitno
        // forsira refetch, pa se nov status upiše u JWT cookie bez odjave.
        const sada = Date.now();
        const osvezenoAt = (token.osvezenoAt as number | undefined) ?? 0;
        if (trigger === "update" || sada - osvezenoAt > OSVEZI_INTERVAL_MS) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { verified: true, indeksStvarnosti: true, potvrdjenAt: true, jeOsnivac: true, oauthPending: true, tipKorisnika: true, admin: true, pseudonim: true, status: true, maloletan: true },
            });
            if (dbUser && dbUser.status !== "ACTIVE") {
              // Suspenzija/isključenje (Uslovi čl. 31, 32) ranije je blokiralo samo
              // NOVO prijavljivanje (`authorize`), pa je već prijavljen korisnik
              // nastavljao da radi — i da postavlja oglase — dok mu JWT ne istekne.
              // Poništenje `id` ovde vraća null sesiju → čista odjava.
              token.id = undefined;
            } else if (dbUser) {
              token.admin = dbUser.admin;
              // K5: pun pristup zavisi od indeksa ≥ 10%, ne samo od `verified`.
              token.verified = imaPunPristup(dbUser.verified, dbUser.indeksStvarnosti);
              token.potvrdjen = jePotvrdjenNalog(dbUser);
              token.tipKorisnika = dbUser.tipKorisnika;
              token.pseudonim = dbUser.pseudonim;
              token.oauthPending = dbUser.oauthPending;
              token.maloletan = dbUser.maloletan;
              token.osvezenoAt = sada;
            } else {
              // Token nosi `id` koga više NEMA u bazi (obrisan nalog ili je baza
              // reseed-ovana), a JWT cookie i dalje živi u browseru. Ako ostavimo
              // token, korisnik „izgleda prijavljen" ali svaki UPIS puca: insert →
              // FK prekršaj na userId (P2003), update → red ne postoji (P2025),
              // što se na klijentu vidi kao „network error". Poništi `id` → session
              // callback vraća null → korisnik se čisto preusmerava na prijavu.
              token.id = undefined;
            }
          } catch {
            // zadrži postojeće vrednosti iz JWT-a (tranzijentna DB greška)
          }
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Sesija čiji korisnik više ne postoji u bazi — jwt callback je očistio
      // `token.id`. Vrati null da `getServerSession` da null → (app)/layout
      // preusmerava na prijavu (čista odjava umesto 500 pri svakom upisu).
      // Izuzetak: nedovršena OAuth registracija legitimno nema `id` dok korisnik
      // ne izabere pseudonim na /oauth/dovrsi (nosi `oauthPending`).
      if (!token.id && !token.oauthPending) {
        return null as unknown as typeof session;
      }

      session.user.id = token.id as string;
      session.user.pseudonim = token.pseudonim;
      session.user.tipKorisnika = token.tipKorisnika as string;
      session.user.admin = (token.admin as string) ?? "NONE";
      session.user.verified = (token.verified as boolean) ?? false;
      session.user.potvrdjen = (token.potvrdjen as boolean) ?? false;
      // `undefined` = token izdat pre ovog polja; tretira se kao nepoznato, pa
      // layout do prvog osvežavanja ne učitava GA (vidi `Analitika.tsx`).
      session.user.maloletan = token.maloletan as boolean | undefined;
      session.user.oauthPending = (token.oauthPending as boolean) ?? false;
      // Nedovršena OAuth registracija — izloži podatke koje /api/oauth/dovrsi
      // koristi za kreiranje naloga (nalog još ne postoji u bazi).
      if (token.oauthPending && !token.id) {
        session.user.pendingEmail = token.pendingEmail;
        session.user.pendingProvider = token.pendingProvider;
        session.user.pendingOauthId = token.pendingOauthId;
        session.user.pendingPunoIme = token.pendingPunoIme;
        session.user.pendingAvatar = token.pendingAvatar;
      }
      return session;
    },
  },
};
