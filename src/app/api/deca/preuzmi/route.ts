import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, klijentIP } from "@/lib/rate-limit";
import { DecaGreska } from "@/lib/protokol/deca";
import { parsirajDatumRodjenja, poziviZaEmail, preuzmiKodom } from "@/lib/protokol/deca-poziv";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/deca/preuzmi — pozivi upućeni na imejl prijavljenog korisnika.
 *
 * Primarni put iz čl. 11 st. 1: roditelj koji se registruje istim imejlom koji je
 * dete unelo ne mora ništa da traži — veza mu se sama predloži u „Moja deca".
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const ja = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });
  return NextResponse.json({ pozivi: await poziviZaEmail(ja?.email ?? null) });
}

/**
 * POST /api/deca/preuzmi — preuzimanje pseudonimom i šestocifrenim kodom.
 *
 * 🔴 Istim putem ulazi PRVI roditelj (kad poruka ne stigne ili link istekne) i
 * DRUGI roditelj (uvek). Nema zasebnog obrasca za „drugog roditelja": obojica rade
 * istu radnju i dobijaju ista ovlašćenja.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  // Šest cifara je mali prostor — bez ograničenja bi se pogađao redom.
  const rl = rateLimit(`deca-preuzmi:${session.user.id}:${klijentIP(req)}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return await greska("Previše pokušaja. Pokušaj kasnije.", 429);

  let body: { pseudonim?: unknown; kod?: unknown; datumRodjenja?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  if (typeof body.pseudonim !== "string" || typeof body.kod !== "string") {
    return await greska("Pseudonim deteta i kod su obavezni.", 400);
  }
  const datum = parsirajDatumRodjenja(body.datumRodjenja);
  if (datum === undefined) return await greska("Datum rođenja nije ispravan.", 400);

  try {
    return NextResponse.json(
      await preuzmiKodom(session.user.id, body.pseudonim.trim(), body.kod, datum)
    );
  } catch (e) {
    if (e instanceof DecaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
