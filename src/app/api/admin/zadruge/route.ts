import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { upisiZadrugu, ZadrugaGreska, PRAGOVI_RASTA, type PodaciZadruge } from "@/lib/protokol/zadruga";

/**
 * GET  /api/admin/zadruge — sve zadruge sa zadrugarima, zapisom i pragovima
 * POST /api/admin/zadruge — upis zadruge u sistem (Pravilnik o zadrugama čl. 5)
 *
 * 🔴 Ime i prezime zadrugara izlazi SAMO ovde, u administratorski tim (čl. 19,
 * Registar radnji obrade br. 19) — nijedna korisnička ruta ga ne vraća.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const [zadruge, krugovi] = await Promise.all([
    prisma.krug.findMany({
      where: { zadruga: true },
      orderBy: { createdAt: "asc" },
      include: {
        wallet: { select: { balance: true } },
        bonusLogs: { select: { threshold: true, amount: true, createdAt: true }, orderBy: { threshold: "asc" } },
        memberships: {
          where: { leftAt: null },
          orderBy: { joinedAt: "asc" },
          select: {
            id: true,
            imePrezime: true,
            joinedAt: true,
            user: { select: { id: true, pseudonim: true, identitet: { select: { imePrezime: true } } } },
          },
        },
      },
    }),
    // Krug koji se može upisati kao zadruga (čl. 11 st. 3).
    prisma.krug.findMany({ where: { zadruga: false }, select: { id: true, name: true, location: true } }),
  ]);

  return NextResponse.json({
    pragovi: PRAGOVI_RASTA,
    krugovi,
    zadruge: zadruge.map((z) => ({
      id: z.id,
      naziv: z.name,
      lokalitet: z.location,
      maticniBroj: z.maticniBroj,
      pib: z.pib,
      adresa: z.adresa,
      ugovorAt: z.ugovorAt?.toISOString() ?? null,
      prestanakAt: z.prestanakAt?.toISOString() ?? null,
      zapis: z.wallet?.balance ?? 0,
      pragovi: z.bonusLogs.map((b) => ({ clanovi: b.threshold, poen: b.amount, at: b.createdAt.toISOString() })),
      zadrugari: z.memberships.map((m) => ({
        clanstvoId: m.id,
        userId: m.user.id,
        pseudonim: m.user.pseudonim,
        // Evidencija identiteta (set 4.7.3); zatečeni zadrugari nose ime na članstvu.
        imePrezime: m.user.identitet?.imePrezime ?? m.imePrezime,
        od: m.joinedAt.toISOString(),
      })),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  let body: PodaciZadruge;
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  try {
    const { id } = await upisiZadrugu(session.user.id, body);
    await logAdminAkcija(session.user.id, "ZADRUGA_UPISANA", id, String(body.naziv ?? ""));
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    if (e instanceof ZadrugaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
