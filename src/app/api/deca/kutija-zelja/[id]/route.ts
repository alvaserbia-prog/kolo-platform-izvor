import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { KutijaGreska, povuciZelju } from "@/lib/protokol/kutija-zelja";

/** DELETE /api/deca/kutija-zelja/[id] — autor povlači svoj otvoren predlog (briše se). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  try {
    return NextResponse.json(await povuciZelju(session.user.id, id));
  } catch (e) {
    if (e instanceof KutijaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
