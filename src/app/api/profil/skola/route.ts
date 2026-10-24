import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { postaviSkolu, SkolaGreska } from "@/lib/protokol/skole";

/**
 * Izbor škole maloletnog korisnika (Pravilnik o učešću dece, čl. 7).
 *
 * 🔴 Školu bira SÁMO dete — ruta uzima nalog iz sesije i ne prima tuđi id. Ni
 * roditelj je ne postavlja: uvid iz čl. 9 mu daje da vidi i da ukloni sadržaj,
 * ne i da govori u ime deteta.
 *
 * `sifra: null` briše izbor i NE troši rok od 30 dana (vidi `postaviSkolu`).
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const body = await req.json().catch(() => ({}));
  const sifra = typeof body.sifra === "string" ? body.sifra : null;

  try {
    const skola = await postaviSkolu(session.user.id, sifra);
    return NextResponse.json({ ok: true, skola });
  } catch (e) {
    if (e instanceof SkolaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
