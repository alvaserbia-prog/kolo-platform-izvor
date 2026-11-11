import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { zatraziDodatniDeo, odustaniOdDodatnog, NabavkaGreska } from "@/lib/protokol/nabavka";

/**
 * POST /api/nabavke/[id]/dodatni  { radnja: "zatrazi" } | { radnja: "odustani", deoId }
 *
 * Dopunski rok (nabavke čl. 26, set 5.1.4): korisnik koji je u nabavci preuzeo deo traži
 * dodatni deo iz nepreuzetih delova. Dodela ide po redu iz čl. 20, po jedan deo po korisniku
 * u svakom krugu (noćni posao); zahtev se ponavlja posle dodele kruga. Odustankom se povlači
 * zahtev, odnosno oslobađa rezervacija dodeljenog dela.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  try {
    if (b.radnja === "zatrazi") {
      const d = await zatraziDodatniDeo(session.user.id, id);
      return NextResponse.json({ ok: true, id: d.id }, { status: 201 });
    }
    if (b.radnja === "odustani" && typeof b.deoId === "string") {
      await odustaniOdDodatnog(session.user.id, b.deoId);
      return NextResponse.json({ ok: true });
    }
    return await greska("Nepoznata radnja.", 400);
  } catch (e) {
    if (e instanceof NabavkaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
