import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const user = await prisma.user.findUnique({
    where: { memberHash: hash },
    select: { pseudonim: true },
  });
  if (!user) return await greska("Not found", 404);
  return NextResponse.json({ pseudonim: user.pseudonim });
}
