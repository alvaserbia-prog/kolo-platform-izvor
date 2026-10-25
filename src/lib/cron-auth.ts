import type { NextRequest } from "next/server";

/**
 * Provera zakazanog poziva: Vercel Cron šalje GET sa `Authorization: Bearer
 * <CRON_SECRET>`, ručni poziv nosi `x-cron-secret`. Do 25.10.2026 je šest ruta
 * čitalo samo `x-cron-secret`, pa ih Vercel nikad nije pokrenuo.
 */
export function jeCronPoziv(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = bearerSecret ?? req.headers.get("x-cron-secret");
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}
