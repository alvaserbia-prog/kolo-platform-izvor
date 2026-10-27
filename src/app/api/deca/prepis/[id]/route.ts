import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DecaGreska } from "@/lib/protokol/deca";
import { odluciOPrepisu } from "@/lib/protokol/prepis-odobrenje";

/**
 * POST /api/deca/prepis/[id]
 *
 * Odluka roditelja o prepisu iznad praga (Pravilnik o učešću dece, čl. 30 st. 3–4).
 * Odobrenje izvršava prepis odmah; odbijanje ga gasi. Ovlašćenje se proverava u
 * servisu (`mojeDeteIliBaci`), pa tuđe dete vraća 404, ne 403.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await ctx.params;

  let body: { odluka?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  if (body.odluka !== "ODOBREN" && body.odluka !== "ODBIJEN") {
    return await greska("Odluka mora biti ODOBREN ili ODBIJEN.", 400);
  }

  try {
    return NextResponse.json(await odluciOPrepisu(session.user.id, id, body.odluka));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
