import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProgramType } from "@/generated/prisma/client";
import { okoncajPrijavu } from "@/lib/protokol/program-prijava";
import { labelPrograma } from "@/lib/protokol/programi";
import { obavesti } from "@/lib/notifikacije";

const DOZVOLJENI_TIPOVI: ProgramType[] = [
  "PODRSKA_MAJKAMA", "PODRSKA_STARIJIMA", "POSEBNA_BRIGA", "SKOLOVANJE",
];

/**
 * POST /api/programi/[type]/povuci-pristanak
 *
 * 🔴 Sprovodi čl. 4 st. 3 Pravilnika o programima podrške: „Pristanak se može
 * povući u svakom trenutku, sa posledicom prestanka postupka odnosno automatskog
 * evidentiranja POEN-a." Do ovog seta je to pravo stajalo u pravilniku, dvaput u
 * Politici privatnosti i kao MERA u DPIA — a u kodu nije postojao nijedan način
 * da se iz programa izađe osim gašenja celog naloga. Pristanak je pravni osnov
 * obrade posebnih kategorija podataka; osnov koji se ne može opozvati nije
 * pristanak.
 *
 * Radnju izvodi isključivo sam podnosilac, nad sopstvenom prijavom.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { type } = await params;
  if (!DOZVOLJENI_TIPOVI.includes(type as ProgramType))
    return await greska("Nepoznat tip programa.", 400);
  const programType = type as ProgramType;

  const enrollment = await prisma.programEnrollment.findUnique({
    where: { userId_type: { userId: session.user.id, type: programType } },
  });
  if (!enrollment) return await greska("Nisi prijavljen na ovaj program.", 404);
  // Povlačenje ima predmet samo dok postupak traje ili dok se evidentira.
  if (enrollment.status !== "PENDING" && enrollment.status !== "ACTIVE")
    return await greska("Prijava više nije u toku.", 400);

  await okoncajPrijavu(enrollment.id, {
    status: "INACTIVE",
    razlog: "Pristanak povučen na zahtev korisnika (čl. 4 st. 3).",
    povucenPristanak: true,
  });

  await obavesti(session.user.id, {
    tip: "info",
    kljuc: "notifikacije.program_pristanak_povucen",
    parametri: { program: labelPrograma(programType) },
    naslov: "Pristanak povučen",
    tekst: `Povukao si pristanak za program „${labelPrograma(programType)}". Postupak je prekinut, evidentiranje je prestalo, a uneti podaci su obrisani.`,
    link: "/programi",
    // Isti razlog kao kod zahteva verifikatoru: naziv programa ne izlazi iz
    // Platforme ni kad ide sopstvenom korisniku — mejl i push čita i onaj ko mu
    // uzme telefon ili sanduče.
    spoljni: {
      kljuc: "notifikacije.program_pristanak_povucen_spoljni",
      naslov: "Pristanak povučen",
      tekst: "Povlačenje pristanka je zabeleženo. Detalji su u aplikaciji.",
    },
  });

  return NextResponse.json({ ok: true });
}
