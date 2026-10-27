import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { izracunajGlasove } from "@/lib/protokol/zrno";
import { UKLJUCI_ZA_PRIKAZ, prikazPredloga, zatvoriIstekleIObjaviIshod } from "@/lib/protokol/glasanje";
import { ucitajStatus } from "@/lib/protokol/status";
import { vidiPseudonimeGornjegKola } from "@/lib/gornje-kolo-pravila";

// GET /api/glasanje/[id] — detalji predloga + zbirovi. Pseudonime vide samo učesnici
// (Pravilnik o Gornjem Kolu čl. 9 st. 3, 19 st. 2); izborni glas se ne broji kao
// „protiv" (`zbiroviGlasova`).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;

  // Zatvori istekle i utvrdi ishod (Gornje Kolo čl. 7, 10 st. 4, 19)
  await zatvoriIstekleIObjaviIshod();

  const predlog = await prisma.glasanjePredlog.findUnique({ where: { id }, include: UKLJUCI_ZA_PRIKAZ });
  if (!predlog) return await greska("Predlog nije pronađen.", 404);

  const status = await ucitajStatus(session.user.id);
  const prikaz = prikazPredloga(predlog, session.user.id, vidiPseudonimeGornjegKola(status));

  // Moja glasačka moć (za prikaz)
  const mojGlasoviBroj = await izracunajGlasove(session.user.id);

  return NextResponse.json({ ...prikaz, mojGlasoviBroj });
}
