import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      pseudonim: string;
      tipKorisnika: string;
      admin: string;
      /**
       * VERIFIKOVAN (set 4.8.2): član bez potvrde, član Kola, čuvar Kola, osnivač
       * — `verified && indeks ≥ 10`.
       */
      verified: boolean;
      /**
       * POTVRĐEN (set 4.8.2): član Kola, čuvar Kola, osnivač —
       * `jeOsnivac || (verified && indeks ≥ 10 && potvrdjenAt)`.
       */
      potvrdjen: boolean;
      /** Maloletni nalog — za njega se GA ne učitava. `undefined` = još nepoznato. */
      maloletan?: boolean;
      oauthPending: boolean;
      // Podaci nedovršene OAuth registracije (još nema reda u bazi)
      pendingEmail?: string;
      pendingProvider?: string;
      pendingOauthId?: string;
      pendingPunoIme?: string;
      pendingAvatar?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    pseudonim: string;
    tipKorisnika: string;
    admin?: string;
    verified: boolean;
    potvrdjen?: boolean;
    maloletan?: boolean;
    oauthPending?: boolean;
    // Markeri/podaci za odloženo kreiranje OAuth naloga (signIn → /oauth/dovrsi)
    needsRegistration?: boolean;
    oauthProvider?: string;
    oauthId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    pseudonim: string;
    tipKorisnika: string;
    admin?: string;
    verified: boolean;
    potvrdjen?: boolean;
    maloletan?: boolean;
    oauthPending?: boolean;
    // Vreme (ms) poslednjeg osvežavanja statusa iz baze — throttle u jwt callbacku
    osvezenoAt?: number;
    // Podaci nedovršene OAuth registracije
    pendingEmail?: string;
    pendingProvider?: string;
    pendingOauthId?: string;
    pendingPunoIme?: string;
    pendingAvatar?: string;
  }
}
