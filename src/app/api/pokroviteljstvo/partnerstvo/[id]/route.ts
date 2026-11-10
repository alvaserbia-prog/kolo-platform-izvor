import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { povuciPrijavuPartnerstva, odgovorNaGreskuPartnerstva } from "@/lib/protokol/partnerstvo";

// DELETE /api/pokroviteljstvo/partnerstvo/[id] — podnosilac povlači prijavu koja čeka odluku.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    await povuciPrijavuPartnerstva(session.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGreskuPartnerstva(e);
  }
}
