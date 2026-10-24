import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";

/**
 * GET /api/admin/pokroviteljstvo/dobra/[id]/dokaz/[dokazId] — fajl dokaza cene.
 *
 * 🔴 Dokaz cene (cenovnik, računi izdati drugim licima) vidi SAMO administratorski
 * tim. Zato se ne čuva na javnom R2 skladištu, nego u bazi, i izlazi isključivo
 * kroz ovu rutu, bez keširanja.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; dokazId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id, dokazId } = await params;
  const d = await prisma.dokazCeneDobra.findFirst({
    where: { id: dokazId, ugovorId: id },
    select: { contentType: true, sadrzaj: true, nazivFajla: true },
  });
  if (!d) return await greska("Dokaz nije pronađen.", 404);
  return new NextResponse(Buffer.from(d.sadrzaj), {
    status: 200,
    headers: {
      "Content-Type": d.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(d.nazivFajla)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
