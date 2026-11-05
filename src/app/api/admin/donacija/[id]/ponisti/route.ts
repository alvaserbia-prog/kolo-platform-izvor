import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { ponistiUnapred, DonacijaUnapredGreska } from "@/lib/protokol/donacija-unapred";

/**
 * POST /api/admin/donacija/[id]/ponisti — Fondacija nije utvrdila prijem donacije
 * unapred (donacije čl. 6 st. 6). `sumnja: true` — postoji osnov sumnje da je potvrda
 * lažna ili tuđa: ograničava se ono što je donator prepisao drugima (st. 7). Isključenje
 * donatora (Uslovi čl. 32 st. 1 t. 9) izriče superadmin posebno, u Admin → Korisnici.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const r = await ponistiUnapred(session.user.id, id, {
      razlog: typeof body.razlog === "string" ? body.razlog : "",
      sumnja: body.sumnja === true,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof DonacijaUnapredGreska) return await greska(e.message, e.status);
    throw e;
  }
}
