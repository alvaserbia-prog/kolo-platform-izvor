import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { dohvatiIliKreirajKanal } from "@/lib/protokol/osnivacki";

async function proveriAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, status: 401, error: "Nije prijavljen." } as const;
  if (!jeSuperadmin(session.user)) return { ok: false, status: 403, error: "Samo admin." } as const;
  return { ok: true, session } as const;
}

/**
 * GET /api/admin/osnivaci — lista
 * POST /api/admin/osnivaci — dodaj osnivaca
 *   body: { userId, udeoBrojilac, udeoImenilac, redniBroj, napomena? }
 */

export async function GET() {
  const auth = await proveriAdmin();
  if (!auth.ok) return await greska(auth.error, auth.status);

  const [osnivaci, kanal] = await Promise.all([
    prisma.osnivac.findMany({
      include: { user: { select: { pseudonim: true, email: true } } },
      orderBy: { redniBroj: "asc" },
    }),
    dohvatiIliKreirajKanal(),
  ]);
  return NextResponse.json({
    osnivaci,
    kanal: {
      brojKoraka: kanal.brojKoraka,
      zatvoren: kanal.zatvoren,
      osnivaciZakljucani: kanal.osnivaciZakljucani,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await proveriAdmin();
  if (!auth.ok) return await greska(auth.error, auth.status);

  const body = await req.json();
  const { userId, udeoBrojilac, udeoImenilac, redniBroj, napomena } = body;

  if (!userId || typeof udeoBrojilac !== "number" || typeof udeoImenilac !== "number" || typeof redniBroj !== "number") {
    return await greska("Nedostaju polja.", 400);
  }
  if (udeoBrojilac <= 0 || udeoImenilac <= 0) {
    return await greska("Udeli moraju biti pozitivni.", 400);
  }

  // Kanal ne sme da bude vec aktiviran (brojKoraka > 0) ako se menja lista osnivaca
  const kanal = await dohvatiIliKreirajKanal();
  if (kanal.brojKoraka > 0) {
    return await greska("Kanal je vec aktiviran (broj koraka > 0). Izmena liste osnivaca nije dozvoljena.", 409);
  }
  if (kanal.osnivaciZakljucani) {
    return await greska("Lista osnivača je zaključana. Prvo je otključajte.", 409);
  }

  try {
    const osnivac = await prisma.osnivac.create({
      data: { userId, udeoBrojilac, udeoImenilac, redniBroj, napomena },
    });

    await logAdminAkcija(auth.session.user.id, "OSNIVAC_DODAT", userId,
      `udeo ${udeoBrojilac}/${udeoImenilac}, r.br. ${redniBroj}`);

    return NextResponse.json({ osnivac });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      const polja = String((e as { meta?: { target?: unknown } }).meta?.target ?? "");
      const poruka = polja.includes("redniBroj")
        ? "Redni broj je već zauzet drugim osnivačem."
        : "Ovaj korisnik je već dodat kao osnivač.";
      return await greska(poruka, 409);
    }
    throw e;
  }
}
