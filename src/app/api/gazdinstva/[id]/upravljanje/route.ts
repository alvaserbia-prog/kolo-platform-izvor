import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { preuzmiUpravljanje, GazdinstvoGreska } from "@/lib/protokol/gazdinstvo";

/**
 * POST — nosilac upisanog gazdinstva preuzima izjavu o tačnosti podataka (čl. 12
 * st. 2). Putanja ostaje zbog starih linkova; upravljanje se ne čuva nego izvodi.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    await preuzmiUpravljanje(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GazdinstvoGreska) return await greska(e.message, e.status);
    throw e;
  }
}
