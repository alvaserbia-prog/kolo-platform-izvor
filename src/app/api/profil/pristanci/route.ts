import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dohvatiPristanke } from "@/lib/protokol/pristanak";

/**
 * GET /api/profil/pristanci — šta je korisnik prihvatio, kada i kojim tekstom
 * (R-06, mera M-10).
 *
 * Isti zapis služi dvema stranama: nama kao dokaz pred Poverenikom (ZZPL čl. 15
 * st. 1), a korisniku kao uvid u to na šta je pristao. Zato se prikazuje SNIMLJEN
 * tekst, ne današnji — čovek treba da vidi ono što je tada pročitao.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  return NextResponse.json({ pristanci: await dohvatiPristanke(session.user.id) });
}
