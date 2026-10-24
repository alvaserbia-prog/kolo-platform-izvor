import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { utvrdiIzborNabavke, pripremiNabavku, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/admin/nabavke/izbor/sprovedi { predlogId }
 *
 * Iz zatvorenog izbornog glasanja utvrđuje izabran naziv i otvara nabavku (NACRT).
 *
 * Zbir glasačke moći se čita iz zapamćene moći svakog glasa (Gornje Kolo čl. 6), pa
 * kašnjenje zatvaranja ne može da pomeri ishod.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const b = await req.json().catch(() => ({}));
  const predlogId = String(b.predlogId ?? "");
  if (!predlogId) return await greska("Nedostaje predlog glasanja.", 400);

  const p = await prisma.glasanjePredlog.findUnique({
    where: { id: predlogId },
    select: { vrsta: true, status: true, nabavka: { select: { id: true } } },
  });
  if (!p) return await greska("Glasanje nije pronađeno.", 404);
  if (p.vrsta !== "IZBOR_NABAVKE") return await greska("To nije izborno glasanje o nabavci.", 400);
  if (p.status !== "CLOSED") return await greska("Glasanje još traje.", 409);
  if (p.nabavka) return await greska("Nabavka po ovom glasanju je već otvorena.", 409);

  const izbor = await utvrdiIzborNabavke(predlogId);
  if (!izbor) return await greska("Nijedan glas nije dat — izbor se ne vrši (čl. 9 st. 2).", 409);

  try {
    const n = await pripremiNabavku(izbor.kljuc, predlogId);
    await logAdminAkcija(session.user.id, "NABAVKA_IZBOR_SPROVEDEN", n.id, `nazivId=${izbor.kljuc}, moć=${izbor.moc}`);
    return NextResponse.json({ ok: true, nabavkaId: n.id, nazivId: izbor.kljuc, moc: izbor.moc });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
