import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";
import { sacuvajNaR2, r2Konfigurisan } from "@/lib/skladiste";
import { OperativniGreska, dopuniDokaz } from "@/lib/protokol/operativni-postupak";

const DOKAZ_MAX_SIZE = 5 * 1024 * 1024;
const DOKAZ_TIPOVI = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * POST — dopuna dokaza posle uslovne potvrde (operativni 5.0 čl. 15 st. 2 t. 3).
 * Prima multipart/form-data: `description` (opis dopune) i/ili `dokazSlika`.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; evId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);
  const { id: oglasId, evId } = await params;
  const fd = await req.formData().catch(() => null);
  if (!fd) return await greska("Neispravan zahtev.", 400);
  const f = fd.get("dokazSlika");
  let dokaz: string | null = null;
  if (f instanceof File && f.size > 0) {
    if (f.size > DOKAZ_MAX_SIZE) return await greska("Screenshot dokaza može biti najviše 5MB.", 400);
    if (!DOKAZ_TIPOVI.includes(f.type)) return await greska("Dozvoljeni formati dokaza: JPG, PNG, WebP.", 400);
    if (!r2Konfigurisan()) return await greska("Skladište slika nije konfigurisano — dokaz trenutno nije moguće priložiti.", 503);
    const ext = f.type === "image/png" ? ".png" : f.type === "image/webp" ? ".webp" : ".jpg";
    dokaz = await sacuvajNaR2(`dokazi/${oglasId}/${randomUUID()}${ext}`, Buffer.from(await f.arrayBuffer()), f.type);
  }
  try {
    await dopuniDokaz(session.user.id, evId, { dokaz, description: fd.get("description") });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof OperativniGreska) return await greska(e.message, e.status);
    throw e;
  }
}
