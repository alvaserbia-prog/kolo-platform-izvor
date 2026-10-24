import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { registarPredloga, sredstvaZaProjekte, pripremiNabavku, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * GET  /api/admin/nabavke            — sredstva, registar predloga, nabavke
 * POST /api/admin/nabavke {nazivId}  — otvori nabavku po izabranom nazivu
 *
 * Fondacija sprovodi odluku o predmetu nabavke (čl. 12). Otvaranje je NACRT —
 * ništa nije objavljeno i nijedan dinar nije obećan dok se ne prikupe ponude
 * (najmanje tri, čl. 15) i ne objavi kalkulacija (čl. 20).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const [sredstva, registar, nabavke] = await Promise.all([
    sredstvaZaProjekte(),
    registarPredloga(),
    prisma.nabavka.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        naziv: { select: { naziv: true } },
        ponude: { orderBy: { cenaPoJedinici: "asc" } },
        _count: { select: { prijave: true } },
      },
    }),
  ]);

  return NextResponse.json({
    sredstva,
    registar,
    nabavke: nabavke.map((n) => ({
      id: n.id,
      naziv: n.naziv.naziv,
      status: n.status,
      dobavljac: n.dobavljac,
      nabavnaCena: n.nabavnaCena ? Number(n.nabavnaCena) : null,
      brojDelova: n.brojDelova,
      velicinaDela: n.velicinaDela,
      poenPoDelu: n.poenPoDelu,
      brojJedinica: n.brojJedinica,
      jedinicaMere: n.jedinicaMere,
      prijaveDo: n.prijaveDo?.toISOString() ?? null,
      preuzimanjeOd: n.preuzimanjeOd?.toISOString() ?? null,
      preuzimanjeDo: n.preuzimanjeDo?.toISOString() ?? null,
      placenoRSD: n.placenoRSD ? Number(n.placenoRSD) : null,
      brojPrijava: n._count.prijave,
      ponude: n.ponude.map((p) => ({
        id: p.id,
        ponudjac: p.ponudjac,
        cena: Number(p.cenaPoJedinici),
        izabrana: p.izabrana,
        napomena: p.napomena,
      })),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const body = await req.json().catch(() => ({}));
  const nazivId = typeof body.nazivId === "string" ? body.nazivId : "";
  if (!nazivId) return await greska("Izaberite naziv dobra iz registra.", 400);

  try {
    const n = await pripremiNabavku(nazivId, typeof body.predlogId === "string" ? body.predlogId : undefined);
    await logAdminAkcija(session.user.id, "NABAVKA_OTVORENA", n.id, `nazivId=${nazivId}`);
    return NextResponse.json({ ok: true, id: n.id });
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
