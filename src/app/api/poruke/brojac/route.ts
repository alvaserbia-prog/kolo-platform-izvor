import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — broj nepročitanih poruka upućenih trenutnom korisniku.
// Koristi se za crveni badge na ikonici "Poruke" u zaglavlju.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Unauthorized", 401);
  const meId = session.user.id;

  const neprocitano = await prisma.poruka.count({
    where: {
      procitana: false,
      posiljacId: { not: meId },
      konverzacija: { OR: [{ user1Id: meId }, { user2Id: meId }] },
    },
  });

  return NextResponse.json({ neprocitano });
}
