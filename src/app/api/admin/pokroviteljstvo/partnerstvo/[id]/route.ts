import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import {
  prihvatiPartnerstvo,
  odbijPartnerstvo,
  zabeleziUgovorOObradi,
  odrediOvlascenoLice,
  prestaniPartnerstvo,
  odgovorNaGreskuPartnerstva,
} from "@/lib/protokol/partnerstvo";

/**
 * POST /api/admin/pokroviteljstvo/partnerstvo/[id] — odluke direktora o partnerstvu
 * (donacije čl. 41 st. 3, čl. 42, čl. 43 st. 1, čl. 45). 🔴 Samo superadmin.
 *   { radnja: "prihvati", izjavaNijeDobavljac: true }
 *   { radnja: "odbij", razlog }
 *   { radnja: "ugovor-o-obradi" }
 *   { radnja: "ovlasti", pseudonim }   — prazan pseudonim opoziva ovlašćenje
 *   { radnja: "prestanak", razlog }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("O partnerstvu odlučuje direktor Fondacije.", 403);
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const razlog = typeof body.razlog === "string" ? body.razlog : "";
  const adminId = session.user.id;
  try {
    switch (body.radnja) {
      case "prihvati":
        return NextResponse.json({ ok: true, ishod: await prihvatiPartnerstvo(id, adminId, { izjavaNijeDobavljac: body.izjavaNijeDobavljac === true }) });
      case "odbij":
        await odbijPartnerstvo(id, adminId, razlog);
        return NextResponse.json({ ok: true });
      case "ugovor-o-obradi":
        await zabeleziUgovorOObradi(id, adminId);
        return NextResponse.json({ ok: true });
      case "ovlasti":
        await odrediOvlascenoLice(id, adminId, typeof body.pseudonim === "string" ? body.pseudonim : null);
        return NextResponse.json({ ok: true });
      case "prestanak":
        return NextResponse.json({ ok: true, ishod: await prestaniPartnerstvo(id, adminId, razlog) });
      default:
        return await greska("Neispravan zahtev.", 400);
    }
  } catch (e) {
    return await odgovorNaGreskuPartnerstva(e);
  }
}
