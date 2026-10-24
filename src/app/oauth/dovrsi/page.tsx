"use client";

import { useState, useEffect, useRef } from "react";
import { AKT_POLITIKA, AKT_USLOVI } from "@/lib/verzije-akata";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";

/**
 * Odredište sa kog je čovek krenuo na prijavu (npr. „Doniraj“ ili „Upiši
 * pokrovitelja“ sa `/podrzi-kolo`). Do revizije teksta (krug 2) Google prijava ga
 * je gubila. Prima se samo putanja unutar sajta.
 */
function odrediste(): string | null {
  if (typeof window === "undefined") return null;
  const c = new URLSearchParams(window.location.search).get("callbackUrl");
  return c && c.startsWith("/") && !c.startsWith("//") ? c : null;
}

export default function OAuthDovrsiPage() {
  const t = useTranslations("oauthDovrsi");
  // Oznake pristanka su iste kao na registraciji — isti tekst, isti linkovi,
  // pa se uzimaju odatle umesto da se duplira na pet jezika.
  const tReg = useTranslations("registracija");
  const { data: session, update } = useSession();
  const router = useRouter();
  const [pseudonim, setPseudonim] = useState("");
  const [pseudonimStatus, setPseudonimStatus] = useState<"idle" | "checking" | "slobodan" | "zauzet">("idle");
  const [uslovi, setUslovi] = useState(false);
  const [privatnost, setPrivatnost] = useState(false);
  // D2-M1: izričita izjava o punoletstvu (snima se uz pristanak na Uslove).
  const [punoletan, setPunoletan] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect ako nalog nije oauthPending
  useEffect(() => {
    if (session && !session.user.oauthPending) {
      router.replace(odrediste() ?? "/sistem");
    }
  }, [session, router]);

  // Live provera pseudonima
  useEffect(() => {
    const p = pseudonim.trim();
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
      } catch {
        setPseudonimStatus("idle");
      } finally {
        clearTimeout(timer);
      }
    }, 400);
  }, [pseudonim]);

  // Dugme se ne gasi zbog nepotpunog obrasca — klik kaže šta fali (provere ispod).
  const canSubmit = !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pseudonim.trim().length < 3) { setError(t("greska_pseudonim_kratak")); return; }
    if (pseudonimStatus === "zauzet") { setError(t("greska_pseudonim_zauzet")); return; }
    if (pseudonimStatus === "checking") return;
    if (!uslovi || !privatnost) { setError(t("greska_uslovi")); return; }
    if (!punoletan) { setError(tReg("greska_punoletan")); return; }

    setLoading(true);
    const res = await fetch("/api/oauth/dovrsi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudonim: pseudonim.trim(), prihvatamUslove: uslovi, prihvatamPolitiku: privatnost, punoletan }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? t("greska_opsta")); return; }

    // Osveži sesiju: prosledi novi userId da JWT preuzme tek kreiran nalog
    // (do ovog koraka korisnik nije imao red u bazi) i oauthPending → false.
    await update({ userId: data.userId });
    try { sessionStorage.setItem("kolo-welcome", "1"); } catch { /* nedostupan */ }
    router.push(odrediste() ?? "/dobrodosli");
  }

  // Čekanje na sesiju ILI redirect (ako je nalog već dovršen, prikaži loading dok se redirektuje)
  if (!session || !session.user.oauthPending) {
    return (
      <div className="w-full max-w-sm">
        <Kartica padding="lg" className="text-center text-kolo-muted text-sm">
          Učitavanje...
        </Kartica>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Kartica padding="lg">
        <div className="mb-7">
          <h1 className="kolo-naslov text-kolo-text">{t("naslov")}</h1>
          <p className="mt-1 text-sm text-kolo-muted">{t("podnaslov")}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4" suppressHydrationWarning>
          {/* Pseudonim */}
          <div>
            <label htmlFor="polje-dovrsi-1" className="block text-sm font-medium text-kolo-text mb-1.5">Pseudonim *</label>
            <div className="relative">
              <input id="polje-dovrsi-1"
                type="text"
                autoComplete="username"
                maxLength={30}
                value={pseudonim}
                onChange={(e) => setPseudonim(e.target.value)}
                className={`w-full min-h-11 px-4 py-2.5 pr-9 rounded-kontrola border bg-kolo-surface text-sm text-kolo-text outline-none transition-colors placeholder:text-kolo-muted ${
                  pseudonimStatus === "zauzet" ? "border-kolo-danger/30 focus:border-kolo-danger"
                  : pseudonimStatus === "slobodan" ? "border-kolo-green-500 focus:border-kolo-green-700"
                  : "border-kolo-border focus:border-kolo-green-700"
                }`}
                placeholder={t("ph_pseudonim")}
                suppressHydrationWarning
              />
              {pseudonimStatus === "checking" && <span className="absolute right-3 top-3.5 text-xs text-kolo-muted">...</span>}
              {pseudonimStatus === "slobodan" && <span className="absolute right-3 top-3 text-kolo-green-700">✓</span>}
              {pseudonimStatus === "zauzet" && <span className="absolute right-3 top-3 text-kolo-danger">✕</span>}
            </div>
            {pseudonimStatus === "zauzet" && <p className="mt-1 text-xs text-kolo-danger">Ovaj pseudonim je zauzet</p>}
            {pseudonimStatus !== "zauzet" && <p className="mt-1 text-xs text-kolo-muted">Javno vidljiv, ne prikazuje pravo ime</p>}
          </div>

          {/* Checkbox-ovi */}
          <div className="space-y-1 pt-1">
            <label className="flex items-start gap-3 cursor-pointer py-2 min-h-11">
              <input type="checkbox" checked={punoletan} onChange={(e) => setPunoletan(e.target.checked)}
                className="mt-0.5 accent-kolo-green-700 w-5 h-5 shrink-0" />
              <span className="text-sm text-kolo-text">{tReg("punoletan")}</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer py-2 min-h-11">
              <input type="checkbox" checked={uslovi} onChange={(e) => setUslovi(e.target.checked)}
                className="mt-0.5 accent-kolo-green-700 w-5 h-5 shrink-0" />
              <span className="text-sm text-kolo-text">
                {tReg("uslovi")} <a href="/uslovi" target="_blank" className="text-kolo-green-700 underline">{tReg("uslovi_link")}</a>{" "}
                <span className="text-kolo-muted">(v{AKT_USLOVI.verzija})</span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer py-2 min-h-11">
              <input type="checkbox" checked={privatnost} onChange={(e) => setPrivatnost(e.target.checked)}
                className="mt-0.5 accent-kolo-green-700 w-5 h-5 shrink-0" />
              <span className="text-sm text-kolo-text">
                {tReg("uslovi")} <a href="/privatnost" target="_blank" className="text-kolo-green-700 underline">{tReg("privatnost_link")}</a>{" "}
                <span className="text-kolo-muted">(v{AKT_POLITIKA.verzija})</span>
              </span>
            </label>
          </div>

          {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}

          <Dugme type="submit" disabled={!canSubmit} velicina="lg" punaSirina suppressHydrationWarning>
            {loading ? t("cuvanje") : t("zavrsi")}
          </Dugme>
        </form>
      </Kartica>
    </div>
  );
}
