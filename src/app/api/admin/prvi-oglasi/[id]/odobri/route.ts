import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { odobriDoprinos } from "@/lib/protokol/doprinos-sadrzaju";

/**
 * POST /api/admin/prvi-oglasi/[id]/odobri
 *
 * Fondacija odobrava doprinos za prvi oglas naloga bez potvrde (čl. 40a st. 4):
 * emituje se 1.000 POEN i korisniku ide obaveštenje. Idempotentno — drugi klik
 * ne emituje po drugi put (prelaz se rezerviše uslovnim update-om).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const rez = await odobriDoprinos(id, session.user.id);
  if (!rez.ok) return await greska(rez.greska ?? "Odobravanje nije uspelo.", 400);
  return NextResponse.json({ ok: true });
}
