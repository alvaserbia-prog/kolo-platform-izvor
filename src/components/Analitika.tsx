"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import {
  CONSENT_EVENT,
  procitajPristanak,
  type Pristanak,
} from "@/lib/cookieConsent";
import { obrisiGaKolacice } from "@/lib/analitika";
import { ocistiAdresu, ocistiPutanju } from "@/lib/analitika-putanja";

/** Rok GA kolačića — ne duže od odluke o pristanku (365 dana, `cookieConsent.ts`). */
const GA_KOLACIC_SEKUNDI = 365 * 24 * 60 * 60;

/**
 * Google Analytics — ISKLJUČIVO uz pristanak (Politika privatnosti čl. 7).
 *
 * `gaId` dolazi iz serverskog layout-a i je `null`:
 *  - van produkcije (test i preview ne smeju da mešaju podatke sa ekolo.rs),
 *  - za maloletni nalog (dete mlađe od 15 ne može samo da da pristanak, ZZPL čl. 16).
 * Bez ID-a se ne učitava ništa, ma šta pisalo u kolačiću.
 *
 * 🔴 Pregled stranice šaljemo SAMI (`send_page_view: false`), sa adresom
 * očišćenom od tokena i pseudonima (`analitika-putanja.ts`). Automatsko brojanje
 * promene stranice u GA („Page changes based on browser history events") zato
 * mora biti ISKLJUČENO u GA administraciji — inače svaki pregled ide dvaput, a
 * jedan od ta dva nosi neočišćenu adresu.
 *
 * Povlačenje pristanka gasi GA odmah, bez osvežavanja: `consent update` →
 * `ga-disable-<ID>` → brisanje `_ga` kolačića. Već učitana skripta inače
 * ostaje živa do sledećeg učitavanja stranice.
 */
export function Analitika({ gaId }: { gaId: string | null }) {
  const [pristanak, setPristanak] = useState<Pristanak | null>(null);
  const pathname = usePathname();
  const inicijalizovano = useRef(false);
  const prethodna = useRef<string | null>(null);

  useEffect(() => {
    setPristanak(procitajPristanak());
    const handler = (e: Event) => setPristanak((e as CustomEvent<Pristanak>).detail);
    window.addEventListener(CONSENT_EVENT, handler);
    return () => window.removeEventListener(CONSENT_EVENT, handler);
  }, []);

  // Uključivanje / gašenje po odluci.
  useEffect(() => {
    const zastavica = gaId ? `ga-disable-${gaId}` : null;
    const w = window as unknown as Record<string, unknown>;

    if (pristanak === "prihvaceno" && gaId) {
      if (zastavica) w[zastavica] = false;
      if (!inicijalizovano.current) {
        window.dataLayer = window.dataLayer || [];
        // gtag MORA da gura `arguments`, ne niz — tako ga gtag.js prepoznaje.
        window.gtag = function gtag() {
          // eslint-disable-next-line prefer-rest-params
          window.dataLayer!.push(arguments);
        };
        // Consent Mode v2, osnovna varijanta: skripta se ionako ne učitava pre
        // pristanka. Reklamni signali ostaju odbijeni trajno — Google Ads se ne koristi.
        window.gtag("consent", "default", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
        window.gtag("consent", "update", { analytics_storage: "granted" });
        window.gtag("js", new Date());
        window.gtag("config", gaId, {
          send_page_view: false,
          page_location: ocistiAdresu(location.href, location.origin) ?? location.origin,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          cookie_expires: GA_KOLACIC_SEKUNDI,
        });
        inicijalizovano.current = true;
      } else {
        window.gtag?.("consent", "update", { analytics_storage: "granted" });
      }
      return;
    }

    if (pristanak === "odbijeno") {
      if (inicijalizovano.current) window.gtag?.("consent", "update", { analytics_storage: "denied" });
      if (zastavica) w[zastavica] = true;
      obrisiGaKolacice();
    }
  }, [pristanak, gaId]);

  // Pregled stranice pri svakoj promeni putanje (App Router ne učitava stranicu ponovo).
  useEffect(() => {
    if (pristanak !== "prihvaceno" || !gaId || !inicijalizovano.current || !window.gtag) return;
    const putanja = ocistiPutanju(pathname);
    const adresa = ocistiAdresu(location.href, location.origin);
    const izvor = prethodna.current ?? (document.referrer ? ocistiAdresu(document.referrer, location.origin) : null);
    // I događaji na stranici bez merenja moraju da nose očišćenu adresu, ne pravu.
    window.gtag("set", {
      page_location: adresa ?? `${location.origin}/[bez-merenja]`,
      page_referrer: izvor ?? "",
      page_title: putanja ?? "[bez-merenja]",
    });
    if (putanja === null || adresa === null) return;
    window.gtag("event", "page_view", {
      page_location: adresa,
      page_referrer: izvor ?? "",
      // Naslov stranice ume da nosi pseudonim („Profil — X") i kasni za navigacijom,
      // pa se umesto njega šalje šablon putanje.
      page_title: putanja,
    });
    prethodna.current = adresa;
  }, [pathname, pristanak, gaId]);

  if (pristanak !== "prihvaceno" || !gaId) return null;

  // lazyOnload: skripta dolazi u idle vremenu posle load-a, da ne otima glavnu nit
  // tokom hidracije (Total Blocking Time). Pozivi pre toga čekaju u `dataLayer`.
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />;
}

/**
 * Vercel Analytics — bez kolačića, po legitimnom interesu (Politika čl. 7), pa
 * se učitava bez pristanka. I on beleži adresu, pa kroz isto čišćenje:
 * tokeni i pseudonimi ne izlaze ni ovuda.
 */
export function VercelAnalitika() {
  return (
    <Analytics
      beforeSend={(e: BeforeSendEvent) => {
        const url = ocistiAdresu(e.url, location.origin);
        return url ? { ...e, url } : null;
      }}
    />
  );
}
