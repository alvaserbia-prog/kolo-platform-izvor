import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import {
  ukloniLogotip,
  procitajRazlogUklanjanja,
  LogotipGreska,
  type IzvorLogotipa,
} from "@/lib/protokol/logotip-pokrovitelja";

const IZVORI: IzvorLogotipa[] = ["PRIJAVA", "POKROVITELJ", "UGOVOR_DOBRA", "UPIS"];

/**
 * POST /api/admin/pokroviteljstvo/logotip/ukloni — moderacija logotipa pokrovitelja
 * (donacije čl. 26 st. 2). Telo: `{ izvor, id, razlog }`.
 *
 * 🔴 Samo uklanjanje, nikad prepravka ni postavljanje logotipa umesto pokrovitelja;
 * razlog je obavezan i ide u audit log i obaveštenje podnosiocu.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);

  const body = await req.json().catch(() => ({}));
  const izvor = body.izvor as IzvorLogotipa;
  if (!IZVORI.includes(izvor)) return await greska("Neispravan izvor logotipa.", 400);
  if (typeof body.id !== "string" || !body.id) return await greska("Nedostaje id.", 400);
  const r = procitajRazlogUklanjanja(body.razlog);
  if (!r.ok) return await greska(r.razlog, 400);

  try {
    await ukloniLogotip(izvor, body.id, r.razlog, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof LogotipGreska) return await greska(e.message, e.status);
    throw e;
  }
}
