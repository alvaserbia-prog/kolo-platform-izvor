import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/pokroviteljstvo/prijava/[id]/potpisi — korisnik potpisuje ugovor (čl. 8)
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;
  const prijava = await prisma.pokroviteljPrijava.findUnique({
    where: { id },
    select: { podnosilacId: true, status: true },
  });
  if (!prijava) return await greska("Prijava nije pronađena.", 404);
  if (prijava.podnosilacId !== session.user.id)
    return await greska("Nije vaša prijava.", 403);
  if (prijava.status !== "CEKA_POTPIS")
    return await greska("Prijava nije u stanju čekanja potpisa.", 400);

  await prisma.pokroviteljPrijava.update({
    where: { id },
    data: { status: "POTPISANA", potpisanoAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
