import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";

/**
 * GET /api/admin/donacija/[id]/potvrda — potvrda o uplati koju je donator poslao
 * (donacije čl. 6 st. 4). Vidi je SAMO administratorski tim; ne kešira se. Briše se
 * odlukom o prijemu, odnosno poništenjem (Registar radnji obrade br. 5).
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const p = await prisma.potvrdaUplate.findFirst({
    where: { OR: [{ donationId: id }, { prijavaId: id }] },
    select: { sadrzaj: true, mime: true },
  });
  if (!p) return await greska("Potvrda ne postoji (obrisana je odlukom ili nije poslata).", 404);
  return new NextResponse(Buffer.from(p.sadrzaj), {
    headers: { "Content-Type": p.mime, "Cache-Control": "no-store, private", "Content-Disposition": "inline" },
  });
}
