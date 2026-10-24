import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Host Cloudflare R2 javnog bazena — slike oglasa/avatari. Parsira se iz env-a na
// build-u (na Vercel-u je postavljen; lokalno može faliti → ostaje prazno). Bez
// ovoga Next image optimizacija ne sme da povuče sliku sa R2 (ni preko 308 sa
// `/api/pijaca/slika/...`) pa je ranije korišćen `unoptimized`.
const r2Host = (() => {
  try {
    return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null;
  } catch {
    return null;
  }
})();

// Content-Security-Policy.
//
// Namerno DRŽI `'unsafe-inline'` za skripte: Next.js (App Router/RSC streaming)
// i inline JSON-LD/analitika ubacuju inline `<script>`-ove; nonce/strict-dynamic
// pristup bi zahtevao da svaka ruta postane dinamička (gubitak statičkog keša na
// javnim stranicama) + izmene root layout-a. Ovde se mitigiraju glavni vektori
// (object-src, base-uri, frame-ancestors) bez rušenja postojećeg toka. Domeni za
// skripte/connect prate analitiku (GA, Vercel) iz `Analitika.tsx`.
//
// `form-action` NIJE naveden namerno — kartično plaćanje (NestPay) radi POST
// auto-submit ka eksternom gateway-u banke; `form-action` nema fallback na
// `default-src`, pa izostavljanje znači da se taj POST ne blokira.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com",
  // Nominatim (OpenStreetMap) — pretraga adrese u prijavi gazdinstva; upit ide iz
  // pretraživača, adresa se ne čuva (`src/lib/geokodiranje.ts`).
  // GA4 šalje na regionalne krajnje tačke (`region1.google-analytics.com`), ne na
  // `www.` — do 26.09.2026 je samo `www.` bio dozvoljen, pa je pregledač odbijao
  // gotovo svako slanje i GA je primao skoro ništa.
  "connect-src 'self' https://nominatim.openstreetmap.org https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  // Service worker (Web Push) i PWA manifest — isti origin.
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

// Sigurnosna zaglavlja (Lighthouse Best Practices: HSTS, clickjacking, COOP,
// nosniff, CSP, Permissions-Policy).
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // allow-popups: ne lomi eventualne OAuth popup tokove, a i dalje izoluje prozor.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // Kamera dozvoljena (QR skener verifikacije); ostalo isključeno.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs"],
  // OG slika oglasa (`/pijaca/[id]/opengraph-image`) čita Inter .woff sa diska u
  // Node runtime-u (Prisma ne radi na edge-u) — obezbedi da fontovi uđu u
  // serverless bundle.
  outputFileTracingIncludes: {
    "/pijaca/**": ["./src/app/_fonts/*.woff"],
  },
  images: {
    // AVIF/WebP za manju isporuku slika (Next image optimizacija).
    formats: ["image/avif", "image/webp"],
    // Optimizovane slike (`/_next/image`) keširaju se DUGO. R2 izvor (`r2.dev`)
    // ne šalje koristan `Cache-Control`, pa je Next podrazumevano keširao kratko
    // (Lighthouse „Use efficient cache lifetimes" = ttl 0). Ovim Next drži
    // optimizovanu varijantu 1 godinu bez obzira na izvor → slike Pijace i svaka
    // `next/image` slika se ne preuzimaju iznova pri svakoj poseti.
    minimumCacheTTL: 31536000,
    remotePatterns: r2Host ? [{ protocol: "https", hostname: r2Host }] : [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Bolji tree-shaking barrel-importa → manje „unused JavaScript" u bundle-u.
    optimizePackageImports: ["next-intl", "@tanstack/react-query"],
  },
  // Stare adrese koje su već otišle u obaveštenja (zvonce, push, mejl). Snimljen
  // `link` se ne prepravlja u bazi, pa adresa mora da nastavi da radi ovde.
  // `/pijaca/novi` je do 13.10.2026 slalo obaveštenje „Zabeležen ti je doprinos"
  // potvrđenom članu — ta stranica nikad nije postojala (404).
  async redirects() {
    return [
      { source: "/pijaca/novi", destination: "/pijaca/novi-oglas", permanent: false },
      // Modul Krug je uklonjen (zadruge rade na istoj tabeli `Krug`). Zatečena
      // obaveštenja nose `/krug/<id>` (pravilo 12: stari linkovi moraju da rade).
      { source: "/krug", destination: "/zadruge", permanent: false },
      { source: "/krug/:path*", destination: "/zadruge", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Dug keš za statičke medije iz /public (logo, ikone, fontovi).
      {
        source: "/:all*(png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2)",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
