import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { dohvatiVetoStatus } from "@/lib/protokol/fondacija";

/**
 * GET /api/javno/veto
 * Javni status Zastitnog veta Fondacije (cl. 48–50 Pravilnika v3.7.5).
 */
export async function GET() {
  try {
    const status = await dohvatiVetoStatus();
    return NextResponse.json(status);
  } catch (e) {
    return await greska(String(e), 500);
  }
}
