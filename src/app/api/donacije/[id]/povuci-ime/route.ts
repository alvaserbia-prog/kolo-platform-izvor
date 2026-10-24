import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/donacije/[id]/povuci-ime
 *
 * Povlačenje pristanka na objavljivanje imena uz javnu donaciju (Pravilnik o
 * pokroviteljstvu i donacijama čl. 5a st. 4, Politika 4.5, set 4.6.8).
 *
 * 🔴 Ime se BRIŠE iz zapisa, ne skriva. Jedina svrha `donatorIme` je objava u
 * listi; kad pristanak prestane, prestaje i osnov da se podatak čuva. Podaci o
 * uplati (`uplatilac`) ostaju — oni su računovodstveni zapis, ne objava.
 *
 * 🔴 Ne dira POEN, nivo ni `ugovorTekst`. Osnov upisa je
 * proveren u trenutku evidentiranja, a donacija ostaje pripisana nalogu — u listi
 * stoji iznosom, datumom i pseudonimom. Snimljen ugovor se ne prepisuje (snimljen
 * tekst se ne generiše ponovo).
 *
 * Povlačenje je po donaciji, jer se i pristanak daje po donaciji (čl. 3).
 * Jednosmerno: ime se ne vraća, jer se ne čuva.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;

  // Uslov u samom upitu: samo SOPSTVENA, javna donacija kojoj ime još stoji.
  // Tuđa donacija i već povučeno ime daju isti odgovor (404) — ruta ne otkriva
  // da li tuđa donacija postoji.
  const { count } = await prisma.donationRecord.updateMany({
    where: { id, userId: session.user.id, javno: true, donatorIme: { not: null } },
    data: { donatorIme: null, imePovucenoAt: new Date() },
  });

  if (count === 0) return await greska("Donacija nije pronađena ili ime nije objavljeno.", 404);
  return NextResponse.json({ ok: true });
}
