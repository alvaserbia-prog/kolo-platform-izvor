import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { povuciPristanak, zabeleziPristanakKolacici } from "@/lib/protokol/pristanak";

/**
 * POST /api/pristanak/kolacici — beleži odluku PRIJAVLJENOG korisnika o analitičkim
 * kolačićima (R-06, mera M-5).
 *
 * 🔴 Neprijavljen posetilac ovde nema šta da traži i zato ruta ćuti umesto da
 * greši: njegova odluka živi isključivo u kolačiću. Serverski zapis po licu tražio
 * bi identifikator posetioca — nov podatak o njemu, prikupljen radi dokazivanja
 * pristanka na obradu. Vidi `cookieConsent.ts`.
 *
 * 🔴 Odbijanje se ne upisuje kao zapis: `ZapisPristanka` je dokaz DATOG pristanka,
 * a odsustvo pristanka se ne dokazuje njegovim zapisivanjem. Odbijanje posle
 * ranijeg prihvatanja upisuje `povucenAt` na postojećem redu (ZZPL čl. 15 st. 3).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  // Gost nije greška — njegovu odluku nosi kolačić.
  if (!session?.user?.id) return NextResponse.json({ ok: true, zabelezeno: false });

  let body: { pristanak?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  const jezik = await getLocale();
  if (body.pristanak === "prihvaceno") {
    await zabeleziPristanakKolacici(session.user.id, jezik);
  } else if (body.pristanak === "odbijeno") {
    await povuciPristanak(session.user.id, "KOLACICI_ANALITIKA");
  } else {
    return await greska("Neispravan zahtev.", 400);
  }

  return NextResponse.json({ ok: true, zabelezeno: true });
}
