"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import PrikaziLozinkuDugme from "@/components/PrikaziLozinkuDugme";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

export default function LoginForm() {
  const router = useRouter();
  const t = useTranslations("login");
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const callbackUrl = searchParams.get("callbackUrl");
  // NextAuth posle neuspelog OAuth callback-a (npr. „state mismatch" / istekao
  // state cookie) vraća na /login?error=... — bez ovoga korisnik ne vidi
  // nikakvu poruku i deluje kao da je sajt pukao. Poruka je generička jer
  // error kod ovde stiže samo iz OAuth (Google) toka.
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prikaziLozinku, setPrikaziLozinku] = useState(false);
  const [error, setError] = useState("");
  // Kad je prijava odbijena (pogrešan email/lozinka ili nepostojeći nalog),
  // pored poruke pokazujemo upadljiv poziv na registraciju. NE razdvajamo
  // „nema naloga" od „pogrešna lozinka" (sprečava user enumeration).
  const [prikaziRegistraciju, setPrikaziRegistraciju] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Gde ide čovek posle uspešne prijave.
   *
   * Nalog koji vodič još nije video (`vodicVidjenAt` prazan — tek registrovan
   * nalog, ili nalog vraćen na dan registracije) vodi se na `/dobrodosli`, isto
   * kao odmah po registraciji. Do sada je taj „prvi prolaz" postojao samo kao
   * zapis u `sessionStorage`, koji postavlja jedino obrazac za registraciju —
   * pa se pri prijavi vodič nije otvarao nikome.
   *
   * Pad zahteva ne sme da zadrži prijavu: tada se ide na uobičajeno odredište.
   */
  async function prvoOdrediste(): Promise<string> {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) return "/dashboard";
      const me = await res.json();
      if (!me?.vodicPotreban) return "/dashboard";
      // Isti jednokratni znak koji postavlja registracija — vodič po njemu zna
      // da je ovo prvi prolaz (gornje dugme „Preskoči", a ne „Zatvori").
      try {
        sessionStorage.setItem("kolo-welcome", "1");
      } catch {
        /* nedostupan — vodič se i dalje otvara, samo sa dugmetom „Zatvori" */
      }
      return "/dobrodosli";
    } catch {
      return "/dashboard";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPrikaziRegistraciju(false);

    if (!email.trim()) { setError(t("greska_email_obavezan")); return; }
    // Bez znaka „@" unos se čita kao PSEUDONIM — tako se prijavljuje maloletni
    // korisnik, koji imejl nema (Pravilnik o učešću dece čl. 7). Zato ovde više ne stoji
    // uslov da unos mora biti imejl; oblik pseudonima proverava server.
    if (!password) { setError(t("greska_lozinka_obavezna")); return; }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!res || !res.ok || res.error) {
        setError(t("greska_pogresni_podaci"));
        setPrikaziRegistraciju(true);
      } else {
        router.push(callbackUrl ?? (await prvoOdrediste()));
        router.refresh();
      }
    } catch {
      setError(t("greska_prijava"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Kartica padding="lg">
        <div className="mb-6">
          <h1 className="kolo-naslov text-kolo-text">{t("naslov")}</h1>
          {/* Ko na prijavu dođe sa odredištem (npr. „Doniraj“ sa /podrzi-kolo) možda
              još nema nalog — ne pozdravlja se kao da se vraća (revizija teksta, krug 2). */}
          <p className="mt-1 text-base text-kolo-muted">{callbackUrl ? t("podnaslov_odrediste") : t("podnaslov")}</p>
          {callbackUrl && (
            <Link
              href={`/registracija?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="mt-3 inline-flex min-h-9 items-center font-semibold text-kolo-green-700 hover:underline"
            >
              {t("otvori_nalog")} →
            </Link>
          )}
        </div>

        {registered && (
          <Obavestenje vrsta="uspeh" className="mb-5">
            {t("nalog_kreiran")}
          </Obavestenje>
        )}

        {oauthError && !error && (
          <Obavestenje vrsta="greska" className="mb-5">
            {t("greska_oauth")}
          </Obavestenje>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4" suppressHydrationWarning>
          <Polje oznaka={t("email_ili_pseudonim")} pomoc={t("deca_pseudonimom")}>
            <input id="polje-login-1"
              type="text"
              inputMode="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={KLASE_UNOSA}
              placeholder={t("placeholder_email")}
              suppressHydrationWarning
            />
          </Polje>
          <div>
            <label htmlFor="polje-login-2" className="block text-sm font-medium text-kolo-text mb-1.5">
              {t("lozinka")}
            </label>
            <div className="relative">
              <input id="polje-login-2"
                type={prikaziLozinku ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${KLASE_UNOSA} pr-12`}
                placeholder={t("placeholder_lozinka")}
                suppressHydrationWarning
              />
              <PrikaziLozinkuDugme
                prikazan={prikaziLozinku}
                onToggle={() => setPrikaziLozinku((v) => !v)}
                prikaziLabel={t("prikazi_lozinku")}
                sakrijLabel={t("sakrij_lozinku")}
              />
            </div>
          </div>

          {error && (
            <Obavestenje
              vrsta="greska"
              radnja={
                prikaziRegistraciju ? (
                  <Link
                    href={callbackUrl ? `/registracija?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/registracija"}
                    className="inline-flex items-center gap-1 font-semibold text-kolo-green-700 hover:underline"
                  >
                    {t("greska_registruj_cta")} →
                  </Link>
                ) : undefined
              }
            >
              <p>{error}</p>
            </Obavestenje>
          )}

          <Dugme
            type="submit"
            disabled={loading}
            velicina="lg"
            punaSirina
            suppressHydrationWarning
          >
            {loading ? t("dugme_loading") : t("dugme")}
          </Dugme>

          <Dugme
            varijanta="sekundarno"
            velicina="lg"
            punaSirina
            onClick={() =>
              signIn("google", {
                callbackUrl: callbackUrl ? `/oauth/dovrsi?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/oauth/dovrsi",
              })
            }
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.34-8.16 2.34-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
            {t("dugme_google")}
          </Dugme>

          <p className="text-center text-sm">
            <Link href="/zaboravljena-lozinka" className="inline-flex min-h-9 items-center text-kolo-muted hover:text-kolo-green-700 hover:underline">
              {t("zaboravljena_lozinka")}
            </Link>
          </p>
        </form>
      </Kartica>
    </div>
  );
}
