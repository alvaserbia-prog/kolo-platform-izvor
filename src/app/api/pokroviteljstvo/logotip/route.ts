import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sacuvajLogotip, LogotipGreska } from "@/lib/protokol/logotip-pokrovitelja";

/**
 * POST /api/pokroviteljstvo/logotip — prilaganje logotipa uz prijavu pokroviteljstva
 * (novcem ili dobrima i uslugama; donacije čl. 16 st. 5, 26 st. 2). Multipart, polje
 * `logotip`: JPG, PNG ili WebP, najviše 1 MB. Vraća javni URL koji prijava nosi
 * u polju `logoUrl`.
 *
 * Isti uslov kao za prijavu: potvrđen, punoletan nalog.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Potvrda stvarnosti nije uslov (set 4.8.0): novčano pokroviteljstvo podnosioca
  // ne potvrđuje, nego ga može dovesti na spisak za poziv (dokaz stvarnosti čl. 8 st. 1 t. 3). Ostaje uslov punoletstva.
  const korisnik = await prisma.user.findUnique({ where: { id: session.user.id }, select: { maloletan: true } });
  if (!korisnik || korisnik.maloletan)
    return await greska("Prijavu pokroviteljstva ne može podneti maloletni korisnik.", 403);

  const fd = await req.formData().catch(() => null);
  const fajl = fd?.get("logotip");
  if (!(fajl instanceof File)) return await greska("Izaberi fajl sa logotipom.", 400);

  try {
    const url = await sacuvajLogotip(fajl);
    return NextResponse.json({ ok: true, url }, { status: 201 });
  } catch (e) {
    if (e instanceof LogotipGreska) return await greska(e.message, e.status);
    throw e;
  }
}
