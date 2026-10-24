import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { odobriIzmenuUpisa, odbijIzmenuUpisa, odgovorNaGreskuUpisa } from "@/lib/protokol/upis-pokrovitelja";

// POST /api/admin/pokroviteljstvo/upisi/[id]/izmena — odluka o izmeni naziva, MB
// odnosno logotipa (donacije čl. 6a st. 5): `{ odobri: true, aprUporedjeno }` ili
// `{ odobri: false, razlog }`. Za izmenu naziva ili MB firme poređenje sa registrom
// je obavezno.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    if (body.odobri === true) await odobriIzmenuUpisa(id, session.user.id, { aprUporedjeno: body.aprUporedjeno === true });
    else await odbijIzmenuUpisa(id, session.user.id, typeof body.razlog === "string" ? body.razlog : "");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await odgovorNaGreskuUpisa(e);
  }
}
