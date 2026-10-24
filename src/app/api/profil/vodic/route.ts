import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { sesija } from "@/lib/sesija";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/profil/vodic — čovek je otvorio vodič `/dobrodosli`.
 *
 * Upisuje `User.vodicVidjenAt` i time gasi automatsko vođenje na vodič pri
 * prijavi. Zove ga sama stranica vodiča pri otvaranju — bez obzira na to da li
 * je stigao sa prijave ili preko „?" u zaglavlju, jer je u oba slučaja viđen.
 *
 * Piše samo kad je polje prazno (`vodicVidjenAt: null` u uslovu), pa ponovljeni
 * pozivi ne pomeraju zabeleženi trenutak prvog dolaska.
 */
export async function POST() {
  const session = await sesija();
  if (!session) return await greska("Nije prijavljen.", 401);

  await prisma.user.updateMany({
    where: { id: session.user.id, vodicVidjenAt: null },
    data: { vodicVidjenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
