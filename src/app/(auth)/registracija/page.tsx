"use client";

import { useState, useEffect, useRef } from "react";
import { AKT_POLITIKA, AKT_RIZICI, AKT_USLOVI } from "@/lib/verzije-akata";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import LokacijaSearch from "@/components/LokacijaSearch";
import PrikaziLozinkuDugme from "@/components/PrikaziLozinkuDugme";
import { dogadjaj } from "@/lib/analitika";

function jacina(p: string, t: (k: string) => string): { nivo: number; tekst: string; boja: string } {
  if (p.length === 0) return { nivo: 0, tekst: "", boja: "" };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { nivo: 1, tekst: t("lozinka_slaba"), boja: "bg-kolo-danger" };
  if (score <= 2) return { nivo: 2, tekst: t("lozinka_srednja"), boja: "bg-kolo-gold-400" };
  if (score <= 3) return { nivo: 3, tekst: t("lozinka_dobra"), boja: "bg-kolo-green-500" };
  return { nivo: 4, tekst: t("lozinka_jaka"), boja: "bg-kolo-green-700" };
}

export default function RegistracijaPage() {
  const router = useRouter();
  // Odakle je čovek došao (npr. poziv za nalog deteta). Bez ovoga bi ga
  // registracija odvela na vodič i poziv bi ostao samo u mejlu.
  const callbackUrl = useSearchParams().get("callbackUrl");
  const t = useTranslations("registracija");
  const [form, setForm] = useState({ email: "", pseudonim: "", password: "" });
  const [prikaziLozinku, setPrikaziLozinku] = useState(false);
  const [mesto, setMesto] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pseudonimStatus, setPseudonimStatus] = useState<"idle" | "checking" | "slobodan" | "zauzet">("idle");
  // Razlog odbijanja sa servera — „zauzet" i „nedozvoljeni znakovi" su različite
  // stvari otkad pseudonim stoji u adresi profila, pa generička poruka zbunjuje.
  const [pseudonimGreska, setPseudonimGreska] = useState<string>("");
  const [uslovi, setUslovi] = useState(false);
  const [privatnost, setPrivatnost] = useState(false);
  // D2-M1: izričita izjava o punoletstvu (snima se uz pristanak na Uslove).
  const [punoletan, setPunoletan] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Live provera pseudonima
  useEffect(() => {
    const p = form.pseudonim.trim();
    if (p.length < 3) { setPseudonimStatus("idle"); return; }
    setPseudonimStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`/api/provjeri-pseudonim?p=${encodeURIComponent(p)}`, { signal: controller.signal });
        const data = await res.json();
        setPseudonimStatus(data.slobodan ? "slobodan" : "zauzet");
        setPseudonimGreska(data.slobodan ? "" : (data.greska ?? ""));
      } catch {
        setPseudonimStatus("idle");
      } finally {
        clearTimeout(timer);
      }
    }, 400);
  }, [form.pseudonim]);

  const lozinkaJacina = jacina(form.password, t);
  // 🔴 Dugme se NE gasi zbog nepotpunog obrasca: ugašeno dugme starijem
  // korisniku ne kaže šta fali i na dodir ne radi ništa. Klik pokreće proveru
  // ispod, a poruka kaže šta treba uraditi. Gasi se samo dok slanje traje.
  const canSubmit = !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.email.includes("@")) { setError(t("greska_email")); return; }
    if (form.pseudonim.trim().length < 3) { setError(t("greska_pseudonim_duljina")); return; }
    if (pseudonimStatus === "zauzet") { setError(t("greska_pseudonim_zauzet")); return; }
    if (pseudonimStatus === "checking") return;
    if (form.password.length < 8) { setError(t("greska_lozinka_duljina")); return; }
    if (!uslovi || !privatnost) { setError(t("greska_uslovi")); return; }
    if (!punoletan) { setError(t("greska_punoletan")); return; }

    setLoading(true);
    const res = await fetch("/api/registracija", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 🔴 Pristanak se šalje serveru i tamo se proverava ponovo (R-06). Kvačica u
      // pretraživaču je obaveštenje čoveku, ne brana — brana je na serveru.
      body: JSON.stringify({ email: form.email, pseudonim: form.pseudonim, password: form.password, location: mesto.trim() || undefined, prihvatamUslove: uslovi, prihvatamPolitiku: privatnost, punoletan }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? t("greska_registracija")); return; }
    dogadjaj("sign_up", { method: "lozinka" });

    const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    // Odredište (npr. „Upiši pokrovitelja“) ne sme da se izgubi ni kad automatska
    // prijava ne uspe (revizija teksta, uloga 10).
    if (result?.error) {
      router.push(`/login?registered=1${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
      return;
    }
    try { sessionStorage.setItem("kolo-welcome", "1"); } catch { /* nedostupan */ }
    router.push(callbackUrl ?? "/dobrodosli");
  }

  return (
    <div className="w-full max-w-sm">
      <Kartica padding="lg">
        <h1 className="kolo-naslov mb-5 text-kolo-text">{t("naslov")}</h1>

        {/* Pravilnik o učešću dece čl. 8: dete se registruje samo, pre nego što je iko od
            njegovih roditelja na platformi. Zaseban obrazac — traži imejl RODITELJA,
            a ne svoj, i ne traži datum rođenja.

            Stoji PRE obrasca i istaknuto je namerno: ovo nije „još jedan link"
            nego skretnica. Dete koje ga ne primeti prođe kroz punoletni obrazac
            i dobije nalog bez roditeljske veze, bez pristanka i van režima iz
            Pravilnika o učešću dece — a to se posle ne ispravlja samo od sebe. */}
          <Link
            href="/registracija/dete"
            className="mb-5 flex min-h-11 items-center justify-between gap-3 rounded-kontrola border border-kolo-green-500 bg-kolo-green-100 px-4 py-3 transition-colors hover:bg-kolo-surface"
          >
            <span className="text-sm text-kolo-text">{t("dete_pitanje")}</span>
            <span className="shrink-0 text-sm font-semibold text-kolo-green-700">{t("dete_link")} →</span>
          </Link>

        {/* Izbor načina pristupanja stoji PRE obrasca: Google preskače ceo
            obrazac (vodi na /oauth/dovrsi), pa dugme između polja preseca
            unos i redosled tabulatora. */}
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

        <div className="relative flex items-center justify-center my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-kolo-border" />
          </div>
          <span className="relative bg-kolo-surface px-3 text-xs text-kolo-muted">{t("ili")}</span>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4" suppressHydrationWarning>
          {/* Email */}
          <Polje oznaka={`${t("email")} *`}>
            <input type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              className={KLASE_UNOSA}
              placeholder={t("placeholder_email")} suppressHydrationWarning />
          </Polje>

          {/* Pseudonim */}
          <div>
            <label htmlFor="registracija-pseudonim" className="block text-sm font-medium text-kolo-text mb-1.5">{t("pseudonim")} *</label>
            <div className="relative">
              <input id="registracija-pseudonim" aria-describedby={pseudonimStatus === "zauzet" ? "registracija-pseudonim-greska" : undefined}
                aria-invalid={pseudonimStatus === "zauzet" ? true : undefined} type="text" autoComplete="username" maxLength={30} value={form.pseudonim} onChange={(e) => set("pseudonim", e.target.value)}
                className={`w-full min-h-11 px-4 py-2.5 pr-9 rounded-kontrola border bg-kolo-surface text-sm text-kolo-text outline-none transition-colors placeholder:text-kolo-muted ${
                  pseudonimStatus === "zauzet" ? "border-kolo-danger/30 focus:border-kolo-danger"
                  : pseudonimStatus === "slobodan" ? "border-kolo-green-500 focus:border-kolo-green-700"
                  : "border-kolo-border focus:border-kolo-green-700"
                }`}
                placeholder={t("placeholder_pseudonim")} suppressHydrationWarning />
              {pseudonimStatus === "checking" && <span className="absolute right-3 top-3.5 text-xs text-kolo-muted">{t("pseudonim_provera")}</span>}
              {pseudonimStatus === "slobodan" && <span className="absolute right-3 top-3 text-kolo-green-700">✓</span>}
              {pseudonimStatus === "zauzet" && <span className="absolute right-3 top-3 text-kolo-danger">✕</span>}
            </div>
            {pseudonimStatus === "zauzet" ? (
              <p id="registracija-pseudonim-greska" role="alert" className="mt-1 text-sm text-kolo-danger">{pseudonimGreska || t("pseudonim_zauzet")}</p>
            ) : (
              <p className="mt-1 text-sm text-kolo-muted">{t("pseudonim_opis")}</p>
            )}
          </div>

          {/* Lozinka */}
          <div>
            <label htmlFor="registracija-lozinka" className="block text-sm font-medium text-kolo-text mb-1.5">{t("lozinka")} *</label>
            <div className="relative">
              <input id="registracija-lozinka" type={prikaziLozinku ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)}
                className={`${KLASE_UNOSA} pr-12`}
                placeholder={t("placeholder_lozinka")} suppressHydrationWarning />
              <PrikaziLozinkuDugme prikazan={prikaziLozinku} onToggle={() => setPrikaziLozinku((v) => !v)}
                prikaziLabel={t("prikazi_lozinku")} sakrijLabel={t("sakrij_lozinku")} />
            </div>
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= lozinkaJacina.nivo ? lozinkaJacina.boja : "bg-kolo-border"}`} />
                  ))}
                </div>
                <p className={`text-sm ${lozinkaJacina.nivo <= 1 ? "text-kolo-danger" : lozinkaJacina.nivo <= 2 ? "text-kolo-gold-700" : "text-kolo-green-700"}`}>
                  {lozinkaJacina.tekst}
                </p>
              </div>
            )}
          </div>

          {/* Mesto (opciono) */}
          <Polje oznaka={t("mesto")} opciono={t("opciono")} pomoc={t("mesto_opis")}>
            <LokacijaSearch value={mesto} onChange={setMesto} placeholder={t("mesto_primer")} />
          </Polje>

          {/* Kvačice.
              🔴 Uz svaki akt stoji i VERZIJA (R-06). Bez nje čovek ne zna na šta
              pristaje, a mi u zapisu pristanka ne bismo mogli da pokažemo da smo
              mu to rekli. Verzija se čita iz `verzije-akata.ts` — istog izvora iz
              kog je čita i zapis, pa se to dvoje ne može razići. */}
          <div className="space-y-1 pt-1">
            <label className="flex items-start gap-3 cursor-pointer py-2 min-h-11">
              <input type="checkbox" checked={punoletan} onChange={(e) => setPunoletan(e.target.checked)}
                className="mt-0.5 accent-kolo-green-700 w-5 h-5 shrink-0" />
              <span className="text-sm text-kolo-text">{t("punoletan")}</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer py-2 min-h-11">
              <input type="checkbox" checked={uslovi} onChange={(e) => setUslovi(e.target.checked)}
                className="mt-0.5 accent-kolo-green-700 w-5 h-5 shrink-0" />
              <span className="text-sm text-kolo-text">
                {t("uslovi")} <Link href="/uslovi" target="_blank" className="text-kolo-green-700 underline">{t("uslovi_link")}</Link>{" "}
                <span className="text-kolo-muted">(v{AKT_USLOVI.verzija})</span>{" "}
                {/* Izjava o rizicima: ista kvačica kao Uslovi (rizici čl. 2 st. 1; odluka vlasnika 12). */}
                {t("i_veznik")} <Link href="/rizici" target="_blank" className="text-kolo-green-700 underline">{t("rizici_link")}</Link>{" "}
                <span className="text-kolo-muted">(v{AKT_RIZICI.verzija})</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer py-2 min-h-11">
              <input type="checkbox" checked={privatnost} onChange={(e) => setPrivatnost(e.target.checked)}
                className="mt-0.5 accent-kolo-green-700 w-5 h-5 shrink-0" />
              <span className="text-sm text-kolo-text">
                {t("uslovi")} <Link href="/privatnost" target="_blank" className="text-kolo-green-700 underline">{t("privatnost_link")}</Link>{" "}
                <span className="text-kolo-muted">(v{AKT_POLITIKA.verzija})</span>
              </span>
            </label>
          </div>

          {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}

          <Dugme type="submit" disabled={!canSubmit} velicina="lg" punaSirina suppressHydrationWarning>
            {loading ? t("dugme_loading") : t("dugme")}
          </Dugme>
        </form>

        <p className="mt-5 text-center text-sm text-kolo-muted">
          {t("vec_imate_nalog")}{" "}
          <Link href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"} className="text-kolo-green-700 font-medium hover:underline">{t("prijavite_se")}</Link>
        </p>
      </Kartica>
    </div>
  );
}
