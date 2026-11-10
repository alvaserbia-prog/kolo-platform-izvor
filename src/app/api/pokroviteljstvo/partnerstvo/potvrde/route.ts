import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { izvrsenjaZaOvlascenog } from "@/lib/protokol/partnerstvo";

// GET /api/pokroviteljstvo/partnerstvo/potvrde — izvršenja koja čekaju potvrdu lica koje je
// direktor ovlastio (donacije čl. 43 st. 1). Prazno za svakog drugog.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  return NextResponse.json({ izvrsenja: await izvrsenjaZaOvlascenog(session.user.id) });
}
