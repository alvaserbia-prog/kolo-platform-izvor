import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { jeKategorija, kategorijaNaziv, type Kategorija } from "@/lib/kategorije";
import type { TipOglasa } from "@/generated/prisma/client";

/**
 * OG slika oglasa (1200×630) za deljenje linka u Viber/Messenger/WhatsApp.
 *
 * Zašto ne direktan R2 URL u `og:image` (raniji pristup): messengeri pri PRVOM
 * deljenju linka ne prikazuju sliku ako `og:image:width/height` nisu poznati
 * (Facebook/Messenger dovlače sliku asinhrono), a Viber ne ume WebP i ne prati
 * pouzdano redirect. File-convention slika rešava sve: fiksne, unapred
 * deklarisane dimenzije (Next emituje og:image:width/height/type), uvek PNG,
 * ista origin adresa bez redirecta.
 *
 * Node runtime (podrazumevano) — Prisma adapter-pg ne radi na edge-u.
 */
export const alt = "Oglas na Pijaci — KOLO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Prva slika oglasa kao data URI za satori. Vraća null kad slike nema, ne može
 * da se dovuče, ili je u formatu koji satori ne ume (WebP) — tada ide
 * brendirana kartica sa naslovom.
 */
async function ucitajFotografiju(images: string[]): Promise<string | null> {
  const prva = images[0];
  if (!prva) return null;
  try {
    let buffer: Buffer;
    let tip: string;
    if (/^https?:\/\//i.test(prva)) {
      const res = await fetch(prva, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      tip = res.headers.get("content-type") ?? "image/jpeg";
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      // Legacy putanja na lokalnom disku (dev fallback).
      buffer = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), prva));
      const ext = path.extname(prva).toLowerCase();
      tip = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    }
    // satori podržava PNG/JPEG/GIF — WebP bi oborio render cele slike.
    if (tip.includes("webp")) return null;
    return `data:${tip};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Boje kartice po kategoriji — svaki oglas bez fotografije dobija pozadinu
 * svoje kategorije, pa se dva podeljena oglasa ne vide kao ista slika. Samo
 * prikaz; tamni tonovi da beo naslov ostane čitljiv i u malom kvadratu.
 */
const BOJA_KATEGORIJE: Record<Kategorija, [string, string]> = {
  "hrana-i-pice": ["#6E2A0C", "#B0521C"],
  "njiva-basta-zivotinje": ["#1F4D1A", "#3F7D2B"],
  "odeca-i-obuca": ["#3B1F5C", "#6B3FA0"],
  "pokucstvo-i-tehnika": ["#1E3A5F", "#2F6497"],
  "rucni-rad-i-pokloni": ["#6B1E3F", "#A63D68"],
  "za-decu": ["#0E5161", "#1C8296"],
  "popravke-i-gradjevina": ["#4A3A12", "#86661C"],
  "prevoz-i-dostava": ["#22313F", "#3D5A73"],
  "pomoc-u-kuci": ["#0F4D45", "#1F8070"],
  "nega-zdravlje-lepota": ["#5C1A4A", "#8E3477"],
  "znanje-i-kreativa": ["#2A2370", "#4A3FB0"],
  "smestaj-i-prostor": ["#5A2A14", "#8C4A25"],
  "ostalo": ["#0F3D20", "#1B6B3A"],
};

/** Ugao dekorativnog prstena — iz id-ja oglasa, da i oglasi iste kategorije
 *  ne budu ista slika. Deterministički: isti oglas uvek ista kartica. */
function ugaoPrstena(id: string): Record<string, string> {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return [
    { top: "-200px", right: "-160px" },
    { bottom: "-200px", right: "-160px" },
    { top: "-200px", left: "-160px" },
    { bottom: "-200px", left: "-160px" },
  ][h % 4];
}

type PodaciKartice = {
  id: string;
  naslov: string;
  tip: TipOglasa;
  kategorija: string;
  mesto: string | null;
};

/**
 * Brendirana kartica (kad oglas nema upotrebljivu fotografiju). Sa `null` ide
 * opšta kartica „Pijaca" bez ijednog podatka o oglasu (nepostojeći oglas i
 * oglas maloletnog korisnika).
 */
async function brendiranaKartica(oglas: PodaciKartice | null) {
  // Literal putanje uz process.cwd() — tako ih @vercel/nft sigurno utrasira u
  // serverless bundle (uz outputFileTracingIncludes u next.config.ts kao pojas).
  const [interRegular, interBold] = await Promise.all([
    readFile(path.join(process.cwd(), "src/app/_fonts/Inter-400.woff")),
    readFile(path.join(process.cwd(), "src/app/_fonts/Inter-700.woff")),
  ]);
  // Kartica se pravi za Facebook/Viber/Gugl, koji ne nose kolačić jezika —
  // jezik je srpski, kao naslov oglasa koji kartica nosi.
  const t = await getTranslations({ locale: "sr", namespace: "pijaca" });

  const [od, do_] = oglas
    ? BOJA_KATEGORIJE[jeKategorija(oglas.kategorija) ? oglas.kategorija : "ostalo"]
    : BOJA_KATEGORIJE.ostalo;
  const naslov = oglas?.naslov ?? "Pijaca";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: `linear-gradient(135deg, ${od} 0%, ${do_} 100%)`,
          color: "#FAFAF8",
          fontFamily: "Inter",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            ...(oglas ? ugaoPrstena(oglas.id) : { top: "-200px", right: "-160px" }),
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            border: "40px solid rgba(245, 184, 66, 0.18)",
            display: "flex",
          }}
        />
        {/* Sadržaj u središnjem kvadratu — Facebook (komentari, mobilni)
            seče karticu na kvadrat iz sredine; vidi app/opengraph-image.tsx. */}
        {oglas ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                padding: "8px 22px",
                borderRadius: "999px",
                background: "#F5B842",
                color: "#1A1A1A",
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "4px",
              }}
            >
              {(oglas.tip === "POTRAZNJA" ? t("tip_trazim") : t("tip_nudim")).toUpperCase()}
            </div>
            <div style={{ display: "flex", marginTop: "18px", fontSize: "28px", color: "#E8F5EC" }}>
              {kategorijaNaziv(oglas.kategorija)}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#F5B842",
                display: "flex",
              }}
            />
            <span style={{ fontSize: "26px", letterSpacing: "7px", color: "#E8F5EC", fontWeight: 700 }}>
              PIJACA
            </span>
          </div>
        )}
        <div
          style={{
            fontSize: naslov.length > 60 ? "44px" : naslov.length > 25 ? "56px" : "72px",
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: "600px",
            marginTop: "32px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {naslov}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "28px", marginTop: "36px" }}>
          {oglas?.mesto && <span style={{ color: "#E8F5EC" }}>{oglas.mesto}</span>}
          {oglas?.mesto && <span style={{ color: "rgba(232, 245, 236, 0.5)" }}>·</span>}
          <span style={{ color: "#F5B842", fontWeight: 700 }}>ekolo.rs</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interBold, weight: 700, style: "normal" },
      ],
    }
  );
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    select: {
      title: true,
      images: true,
      tip: true,
      category: true,
      location: true,
      seller: { select: { maloletan: true } },
    },
  });

  // 🔴 Oglas maloletnog korisnika (Modul Deca, čl. 13) NE sme ni naslovom ni
  // fotografijom u OG karticu. Ova ruta je javna i nema sesiju — ko zna `id`,
  // dobija sliku, a Gugl i svaki program za poruke je pokupe sami. Zato ovde
  // ide ista brendirana kartica kao za nepostojeći oglas: potvrđuje samo da
  // adresa vodi na Pijacu, ništa o detetu. Isti izbor kao prazan `{}` iz
  // `generateMetadata` i `notFound()` na samoj stranici.
  if (!listing || listing.seller.maloletan) return brendiranaKartica(null);

  const foto = await ucitajFotografiju(listing.images);
  if (!foto) {
    return brendiranaKartica({
      id,
      naslov: listing.title.slice(0, 120),
      tip: listing.tip,
      kategorija: listing.category,
      mesto: listing.location?.trim() || null,
    });
  }

  return karticaSaFotografijom(foto);
}

/**
 * Kartica sa fotografijom oglasa. Fotografija se NE seče na 1200×630: Facebook
 * (komentari, mobilni) iz kartice još jednom seče kvadrat iz sredine, pa je od
 * uspravne fotografije sa telefona ostajala uska traka. Zato cela fotografija
 * stoji u središnjem kvadratu 630×630 (contain), a ostatak širine popunjava ista
 * fotografija, zamućena i zatamnjena, da kartica ne bude prazna u širokom prikazu.
 */
function karticaSaFotografijom(foto: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "#0F3D20",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto}
          alt=""
          style={{
            position: "absolute",
            top: "-40px",
            left: "-40px",
            width: "1280px",
            height: "710px",
            objectFit: "cover",
            filter: "blur(28px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.35)",
            display: "flex",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto}
          alt=""
          style={{ width: "630px", height: "630px", objectFit: "contain" }}
        />
      </div>
    ),
    size
  );
}
