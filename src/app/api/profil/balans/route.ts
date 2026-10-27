import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dohvatiZabelezen } from "@/lib/protokol/doprinos-sadrzaju";
import { dohvatiZabelezenGazdinstva } from "@/lib/protokol/gazdinstvo";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const [wallet, user, zabelezenOglas, zabelezenGazdinstva] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { balance: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    }),
    dohvatiZabelezen(session.user.id),
    // Doprinos gazdinstva (Pravilnik o gazdinstvima čl. 15, 16) čeka sopstveni potez — oglas i potvrdu.
    dohvatiZabelezenGazdinstva(session.user.id),
  ]);
  const zabelezenDoprinos = zabelezenOglas + (zabelezenGazdinstva?.iznos ?? 0);

  // `zabelezenDoprinos` ide kao ODVOJENO polje i nikad se ne sabira sa stanjem
  // računa: do evidentiranja to nije zapis POEN-a (Pravilnik čl. 2 st. 4 t. 3), pa bi zbir
  // pokazivao POEN koji u Protokolu ne postoji. Vidi ga samo vlasnik naloga (Pravilnik čl. 56 st. 4).
  return NextResponse.json({
    balance: wallet?.balance ?? 0,
    avatar: user?.avatar ?? null,
    zabelezenDoprinos,
  });
}
