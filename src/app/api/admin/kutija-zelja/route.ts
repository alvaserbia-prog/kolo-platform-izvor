import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { zeljeZaAdmina } from "@/lib/protokol/kutija-zelja";

/**
 * GET /api/admin/kutija-zelja — predlozi dece za pregled pre prikaza i za odgovor
 * (Admin → Kutija želja).
 *
 * 🔴 Ni ovde se autor ne vraća: za pregled sadržaja (lični podaci, neprimeren
 * sadržaj) i za odgovor autor nije potreban.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  return NextResponse.json(await zeljeZaAdmina());
}
