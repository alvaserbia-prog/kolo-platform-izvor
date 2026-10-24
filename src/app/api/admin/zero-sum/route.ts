import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const result = await prisma.wallet.aggregate({ _sum: { balance: true } });
  const zbir = result._sum.balance ?? 0;

  return NextResponse.json({ zbir, ok: zbir === 0 });
}
