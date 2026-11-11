import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { prijavaPoKodu, oznaciPreuzeto, dodatniDeoPoKodu, oznaciPreuzetDodatni, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/admin/nabavke/[id]/preuzimanje { kod }
 *
 * Potvrda preuzimanja uz kod (čl. 24) i poništenje zapisa PO ISKORIŠĆENJU (čl. 25).
 *
 * 🔴 POEN se gasi TEK OVDE, ne pri potvrdi. Do preuzimanja je rezervisan, ali
 * postoji — čovek koji nije došao ne sme ništa da izgubi.
 *
 * Isti ulaz važi i za dodatni deo iz dopunskog roka (čl. 26, set 5.1.4): kod se traži prvo
 * među redovnim, pa među dodatnim delovima.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const kod = String(b.kod ?? "").trim();
  if (!kod) return await greska("Unesite kod za preuzimanje.", 400);

  const p = await prijavaPoKodu(id, kod);
  if (!p) {
    const d = await dodatniDeoPoKodu(id, kod);
    if (!d) return await greska("Kod nije pronađen u ovoj nabavci.", 404);
    try {
      await oznaciPreuzetDodatni(d.id);
      await logAdminAkcija(session.user.id, "NABAVKA_PREUZETO_DODATNI", id, `kod=${kod}`);
      return NextResponse.json({ ok: true, pseudonim: d.user.pseudonim, poen: d.rezervisano, dodatni: true });
    } catch (e) {
      if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
      throw e;
    }
  }

  try {
    await oznaciPreuzeto(p.id);
    await logAdminAkcija(session.user.id, "NABAVKA_PREUZETO", id, `kod=${kod}`);
    return NextResponse.json({ ok: true, pseudonim: p.user.pseudonim, poen: p.rezervisano });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
