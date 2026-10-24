import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prevedi, type Parametri } from "@/lib/prevod-servera";

// GET — lista notifikacija za trenutnog korisnika
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Unauthorized", 401);

  const redovi = await prisma.notifikacija.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true, tip: true, naslov: true, tekst: true, procitana: true,
      link: true, createdAt: true, kljuc: true, parametri: true,
    },
  });

  // Zvonce se prevodi na jeziku POSMATRAČA (kolačić), za razliku od mejla/push-a
  // koji idu na jeziku iz naloga. Redovi bez ključa (stari, i pozivna mesta koja
  // još nisu prebačena) prikazuju sačuvan srpski tekst.
  const locale = await getLocale();
  const notifikacije = redovi.map(({ kljuc, parametri, ...n }) => {
    if (!kljuc) return n;
    const p = (parametri ?? undefined) as Parametri | undefined;
    return {
      ...n,
      naslov: prevedi(locale, `${kljuc}_naslov`, p, n.naslov),
      tekst: prevedi(locale, `${kljuc}_tekst`, p, n.tekst),
    };
  });

  const neprocitano = await prisma.notifikacija.count({
    where: { userId: session.user.id, procitana: false },
  });

  return NextResponse.json({ notifikacije, neprocitano });
}

// PATCH — označi pročitane: { id } → samo tu notifikaciju, bez tela → sve
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Unauthorized", 401);

  let id: string | undefined;
  try {
    const body = await req.json();
    id = typeof body?.id === "string" ? body.id : undefined;
  } catch {
    // bez tela → označi sve
  }

  await prisma.notifikacija.updateMany({
    where: { userId: session.user.id, procitana: false, ...(id ? { id } : {}) },
    data: { procitana: true },
  });

  return NextResponse.json({ ok: true });
}
