import { getServerSession } from "next-auth";
import { greska } from "@/lib/greska-api";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sacuvajNaR2, obrisiSaR2, r2Konfigurisan } from "@/lib/skladiste";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Neautorizovano", 401);

  const { avatar } = await req.json();
  if (!avatar || typeof avatar !== "string") {
    return await greska("Neispravan format.", 400);
  }
  // Klijent šalje data:image/...;base64,<podaci> (iz crop canvasa).
  const match = avatar.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    return await greska("Dozvoljene su samo slike.", 400);
  }
  // ~100KB limit za base64 (kompresovana slika)
  if (avatar.length > 150_000) {
    return await greska("Slika je prevelika.", 400);
  }

  if (!r2Konfigurisan()) {
    return await greska("Skladište slika nije konfigurisano (Cloudflare R2).", 500);
  }

  const mime = match[1];
  // V1: striktna allowlist MIME tipova. Regex `image/[a-zA-Z+]+` bi inače propustio
  // `image/svg+xml` — SVG može da nosi <script> i postaje stored-XSS kada se servira
  // direktno sa R2/poddomena. Dozvoljavamo samo rasterske formate (kao Pijaca rute).
  const DOZVOLJENI_MIME = ["image/jpeg", "image/png", "image/webp"];
  if (!DOZVOLJENI_MIME.includes(mime)) {
    return await greska("Dozvoljeni formati: JPG, PNG, WebP.", 400);
  }
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  const buffer = Buffer.from(match[2], "base64");

  // Jedinstvena putanja po uploadu → URL je nepromenljiv i može da se kešira
  // zauvek (cache-busting je besplatan). Stari objekat brišemo niže.
  const url = await sacuvajNaR2(`avatari/${session.user.id}-${Date.now()}.${ext}`, buffer, mime);

  const prethodni = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatar: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatar: url },
  });

  // Best-effort brisanje starog objekta (samo ako je bio na R2; legacy
  // base64/Blob avatari se preskaču). Ne sme da obori upload.
  await obrisiSaR2(prethodni?.avatar);

  return NextResponse.json({ ok: true, avatar: url });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Neautorizovano", 401);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatar: true },
  });

  return NextResponse.json({ avatar: user?.avatar ?? null });
}
