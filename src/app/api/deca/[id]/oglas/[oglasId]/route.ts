import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DecaGreska, ukloniOglasDeteta } from "@/lib/protokol/deca";

/**
 * DELETE /api/deca/[id]/oglas/[oglasId] — roditelj uklanja oglas svog deteta
 * (Pravilnik o Modulu Deca, čl. 10 st. 1).
 *
 * Uklanjanje oglasa je JEDINO ovlašćenje uklanjanja koje roditelj ima. Poruke
 * deteta ne vidi (čl. 9 st. 3), pa ih ni ne uklanja — za to postoji moderacija
 * Fondacije, kao i za svaki drugi sadržaj na Platformi.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; oglasId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id, oglasId } = await params;

  try {
    return NextResponse.json(await ukloniOglasDeteta(session.user.id, id, oglasId));
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
