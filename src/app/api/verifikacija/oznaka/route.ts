/**
 * PATCH /api/verifikacija/oznaka
 *
 * Verifikator postavlja/menja/briše slobodnu oznaku (nadimak) za osobu koju je
 * verifikovao — radi lakšeg praćenja sopstvenog lanca potvrda.
 * Body: { verifikacijaId: string, oznaka: string }  (prazna oznaka briše)
 *
 * Oznaku sme da menja ISKLJUČIVO verifikator koji je obavio tu verifikaciju.
 * Oznaka nije javna: vidljiva je samo verifikatoru i UO Fondacije (admin).
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  postaviOznakuVerifikatora,
  VerifikacijaGreska,
} from "@/lib/protokol/verifikacija-service";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return await greska("Nisi prijavljen.", 401);
  }

  let body: { verifikacijaId?: string; oznaka?: string };
  try {
    body = await req.json();
  } catch {
    return await greska("Nevažeći JSON.", 400);
  }

  const verifikacijaId = typeof body.verifikacijaId === "string" ? body.verifikacijaId : "";
  const oznaka = typeof body.oznaka === "string" ? body.oznaka : "";
  if (!verifikacijaId) {
    return await greska("verifikacijaId je obavezan.", 400);
  }

  try {
    const rez = await postaviOznakuVerifikatora({
      verifikatorId: session.user.id,
      verifikacijaId,
      oznaka,
    });
    return NextResponse.json({ ok: true, oznaka: rez.oznaka });
  } catch (e) {
    if (e instanceof VerifikacijaGreska) {
      return await greska(e.message, e.statusCode);
    }
    console.error("[PATCH /api/verifikacija/oznaka]", e);
    return await greska("Greška servera", 500);
  }
}
