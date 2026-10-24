import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { otpremiIzvod, GazdinstvoGreska, MAX_IZVOD_BAJTOVA } from "@/lib/protokol/gazdinstvo";

/**
 * POST — otpremanje izvoda iz Registra poljoprivrednih gazdinstava (Pravilnik o
 * gazdinstvima čl. 4b st. 1–2), `multipart/form-data` sa poljem `fajl` (PDF, JPG
 * ili PNG, najviše 5 MB). Prilaže ga podnosilac koji je korisnik ili član bez
 * potvrde, za gazdinstvo upisano u Registar.
 *
 * 🔴 Izvod čita samo admin (`GET /api/admin/gazdinstva/[id]/izvod`) i briše se pri
 * odluci o prijavi. Ova ruta ga nikad ne vraća.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const forma = await req.formData().catch(() => null);
  const fajl = forma?.get("fajl");
  if (!fajl || typeof fajl === "string") return await greska("Izaberi fajl sa izvodom.", 400);
  if (fajl.size > MAX_IZVOD_BAJTOVA) return await greska("Izvod može imati najviše 5 MB.", 400);
  try {
    await otpremiIzvod(session.user.id, id, new Uint8Array(await fajl.arrayBuffer()));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
