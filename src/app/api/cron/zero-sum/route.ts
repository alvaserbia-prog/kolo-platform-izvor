import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";

// GET /api/cron/zero-sum — dnevna provera zero-sum invarijante (zbir svih balansa
// = 0). Do seta 4.8.0 je ovde išla i resinhronizacija keša zabranjene zone;
// zona i krug poznanstava su ukinuti, pa i keš.
export async function GET(req: NextRequest) {
  // Podrška za oba načina: Vercel Cron (Authorization: Bearer) i manuelni poziv (x-cron-secret)
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = bearerSecret ?? req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }

  const result = await prisma.wallet.aggregate({ _sum: { balance: true } });
  const zbir = result._sum.balance ?? 0;

  if (zbir !== 0) {
    console.error(`[ZERO-SUM ALARM] Zbir svih balansa nije 0! Zbir: ${zbir} | ${new Date().toISOString()}`);
    // Alarm ide i van logova (Telegram i mejl) — dnevna provera koja samo loguje
    // ostaje nevidljiva dok neko sam ne pogleda.
    await posaljiAdminAlert(
      "Zero-sum narušen (dnevna provera)",
      `Zbir svih stanja nije nula: ${zbir}.\nProveriti poslednje radnje koje pišu stanje mimo emitujPoen().`,
    );
    return NextResponse.json({ ok: false, zbir }, { status: 500 });
  }

  return NextResponse.json({ ok: true, zbir: 0 });
}
