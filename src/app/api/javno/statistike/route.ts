import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { USLOV_CLANA_U_SPISKU } from "@/lib/clanovi-spisak";
import { USLOVI_STATUSA } from "@/lib/admin-clanovi";

export async function GET() {
  const [clanovi, protokol] = await Promise.all([
    // Verifikovani punoletni učesnici sa živim nalogom (CLAUDE.md pravilo 19). 🔴 Dete
    // se nikad ne broji među članovima (set 4.8.2) — `USLOVI_STATUSA` nosi `maloletan: false`.
    prisma.user.count({ where: { AND: [USLOV_CLANA_U_SPISKU, USLOVI_STATUSA.verifikovan] } }),
    prisma.wallet.findUnique({ where: { id: "banka-singleton" }, select: { balance: true } }),
  ]);
  return NextResponse.json({
    clanovi,
    opticaj: protokol ? Math.abs(protokol.balance) : 0,
  });
}
