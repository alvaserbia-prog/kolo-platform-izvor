import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { dohvatiIliKreirajKanal } from "@/lib/protokol/osnivacki";

/**
 * PATCH  /api/admin/osnivaci/[id] — izmena osnivaca (udeo, redni broj, napomena)
 * DELETE /api/admin/osnivaci/[id] — brisanje osnivaca
 * Oboje samo dok kanal nije aktiviran (brojKoraka = 0) i lista nije zakljucana.
 */

async function proveriPristup() {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, error: "Nije prijavljen.", status: 401 } as const;
  if (!jeSuperadmin(session.user)) return { ok: false, error: "Samo admin.", status: 403 } as const;

  const kanal = await dohvatiIliKreirajKanal();
  if (kanal.brojKoraka > 0) {
    return { ok: false, error: "Kanal je vec aktiviran (broj koraka > 0). Izmena liste osnivaca nije dozvoljena.", status: 409 } as const;
  }
  if (kanal.osnivaciZakljucani) {
    return { ok: false, error: "Lista osnivača je zaključana. Prvo je otključajte.", status: 409 } as const;
  }
  return { ok: true, session } as const;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await proveriPristup();
  if (!auth.ok) return await greska(auth.error, auth.status);

  const { id } = await params;
  const body = await req.json();
  const { udeoBrojilac, udeoImenilac, redniBroj, napomena } = body;

  if (typeof udeoBrojilac !== "number" || typeof udeoImenilac !== "number" || typeof redniBroj !== "number") {
    return await greska("Nedostaju polja.", 400);
  }
  if (udeoBrojilac <= 0 || udeoImenilac <= 0) {
    return await greska("Udeli moraju biti pozitivni.", 400);
  }

  try {
    const osnivac = await prisma.osnivac.update({
      where: { id },
      data: {
        udeoBrojilac,
        udeoImenilac,
        redniBroj,
        napomena: typeof napomena === "string" && napomena.trim() ? napomena.trim() : null,
      },
    });
    await logAdminAkcija(auth.session.user.id, "OSNIVAC_IZMENJEN", osnivac.userId,
      `udeo ${osnivac.udeoBrojilac}/${osnivac.udeoImenilac}, r.br. ${osnivac.redniBroj}`);
    return NextResponse.json({ osnivac });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return await greska("Redni broj je već zauzet drugim osnivačem.", 409);
    }
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return await greska("Osnivač ne postoji.", 404);
    }
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await proveriPristup();
  if (!auth.ok) return await greska(auth.error, auth.status);

  const { id } = await params;
  const osnivac = await prisma.osnivac.delete({ where: { id } });
  await logAdminAkcija(auth.session.user.id, "OSNIVAC_OBRISAN", osnivac.userId,
    `udeo ${osnivac.udeoBrojilac}/${osnivac.udeoImenilac}, r.br. ${osnivac.redniBroj}`);
  return NextResponse.json({ ok: true });
}
