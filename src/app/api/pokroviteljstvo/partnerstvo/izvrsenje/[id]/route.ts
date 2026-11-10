import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { potvrdiIzvrsenje, odbijIzvrsenje, odgovorNaGreskuPartnerstva } from "@/lib/protokol/partnerstvo";

// POST /api/pokroviteljstvo/partnerstvo/izvrsenje/[id] — direktor ili lice koje on ovlasti
// potvrđuje ili odbija izvršen deo (donacije čl. 43 st. 1–2). `{ odluka: "potvrdi" }` ili
// `{ odluka: "odbij", razlog }`. Servis proverava ovlašćenje i povezanost sa partnerom.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const superadmin = jeSuperadmin(session.user);
  try {
    if (body.odluka === "potvrdi") {
      await potvrdiIzvrsenje(id, session.user.id, superadmin);
      return NextResponse.json({ ok: true });
    }
    if (body.odluka === "odbij") {
      await odbijIzvrsenje(id, session.user.id, superadmin, typeof body.razlog === "string" ? body.razlog : "");
      return NextResponse.json({ ok: true });
    }
    return await greska("Neispravan zahtev.", 400);
  } catch (e) {
    return await odgovorNaGreskuPartnerstva(e);
  }
}
