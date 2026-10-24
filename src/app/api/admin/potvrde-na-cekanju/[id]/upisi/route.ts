import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { probajUpisatiPotvrdu } from "@/lib/protokol/potvrda-poen";

/**
 * POST /api/admin/potvrde-na-cekanju/[id]/upisi
 *
 * VENTIL uz dokaz stvarnosti čl. 7: Fondacija upisuje POEN po potvrdi i kad
 * uslov nije ispunjen, za slučajeve koje četiri uslova ne pokrivaju — čovek koji samo
 * kupuje, stariji član na programu podrške, neko ko doprinosi na način koji sistem ne
 * meri. Bez ventila bi takva potvrda ostala zabeležena zauvek, i to ne samo njemu
 * nego i onome ko ga je potvrdio.
 *
 * 🔴 RAZLOG JE OBAVEZAN i ide u revizijski dnevnik. Ovo je odluka čoveka koja stvara
 * POEN mimo pravila, pa mora da ostavi trag zbog koga je doneta.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !jeAdmin(session.user)) return await greska("Neautorizovano.", 401);

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const razlog = typeof body?.razlog === "string" ? body.razlog.trim() : "";
  if (razlog.length < 10) {
    return await greska("Razlog je obavezan i mora imati najmanje 10 znakova.", 400);
  }

  const ishod = await probajUpisatiPotvrdu(id, { bezUslova: true });
  if (!ishod.upisano) {
    return await greska("Upis nije uspeo — potvrda ne postoji ili je POEN već upisan.", 409);
  }

  await logAdminAkcija(session.user.id, "POTVRDA_POEN_UPISAN_RUCNO", id, razlog);
  return NextResponse.json({ ok: true });
}
