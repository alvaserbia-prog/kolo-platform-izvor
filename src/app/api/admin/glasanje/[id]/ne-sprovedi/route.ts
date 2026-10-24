import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { neSprovediOdluku, GlasanjeGreska } from "@/lib/protokol/glasanje";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/glasanje/[id]/ne-sprovedi — UO odbija sprovođenje odluke Gornjeg
// Kola iz razloga sa zatvorene liste (čl. 51 Pravilnika). Zaštitni veto ide zasebnom
// rutom `/veto` — on je privremen i gasi se po čl. 49, ovi razlozi nisu.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Samo admin.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await neSprovediOdluku(id, body?.razlog, String(body?.obrazlozenje ?? ""));
    await logAdminAkcija(session.user.id, "ODLUKA_NIJE_SPROVEDENA", id, `razlog: ${String(body?.razlog ?? "")}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof GlasanjeGreska) return await greska(e.message, e.status);
    throw e;
  }
}
