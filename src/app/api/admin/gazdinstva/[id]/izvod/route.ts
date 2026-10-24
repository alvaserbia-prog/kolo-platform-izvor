import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { procitajIzvod, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * GET — izvod iz Registra poljoprivrednih gazdinstava za pregled prijave (Pravilnik
 * o gazdinstvima čl. 4b st. 4). 🔴 JEDINA ruta koja čita izvod: samo admin, prikaz
 * u pregledaču (`inline`), bez keširanja. Izvod se briše pri odluci o prijavi.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  try {
    const izvod = await procitajIzvod(session.user.id, id);
    const nastavak = izvod.contentType === "application/pdf" ? "pdf" : izvod.contentType === "image/png" ? "png" : "jpg";
    return new NextResponse(new Uint8Array(izvod.sadrzaj), {
      headers: {
        "Content-Type": izvod.contentType,
        "Content-Disposition": `inline; filename="izvod-rpg.${nastavak}"`,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
