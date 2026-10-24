import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

// GET /api/pijaca/slika/[listingId]/[idx] — sluzi sliku oglasa (javno)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listingId: string; idx: string }> }
) {
  const { listingId, idx } = await params;
  const index = parseInt(idx);

  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    select: { images: true },
  });

  if (!listing || isNaN(index) || index < 0 || index >= listing.images.length) {
    return new NextResponse("Nije pronađeno", { status: 404 });
  }

  const filePath = listing.images[index];

  // Apsolutni URL — preusmeri na CDN, ALI samo ako pripada našem R2 javnom bazenu.
  // Time se zatvara open-redirect: čak i ako bi neki budući tok upisao tuđi URL u
  // `images[]`, ova ruta neće preusmeravati na proizvoljan host.
  if (/^https?:\/\//i.test(filePath)) {
    const r2Baza = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
    if (r2Baza && filePath.startsWith(r2Baza + "/")) {
      const res = NextResponse.redirect(filePath, 308);
      // Dug keš na redirect-u: next/image (i Vercel CDN) prate ovaj međukorak i
      // bez ovoga pokupe `max-age=0` → optimizovana slika ostaje slabo keširana
      // (Lighthouse „Use efficient cache lifetimes" = ttl 0). Slika oglasa je
      // nepromenljiva (URL sadrži UUID fajla), pa je dug `immutable` keš bezbedan.
      res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return res;
    }
    return new NextResponse("Nedozvoljen izvor slike", { status: 404 });
  }

  // Legacy: slika na lokalnom disku (dev).
  try {
    const absPath = path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);
    const buffer = await readFile(absPath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".png" ? "image/png" :
      ext === ".webp" ? "image/webp" : "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Fajl nije pronađen", { status: 404 });
  }
}
