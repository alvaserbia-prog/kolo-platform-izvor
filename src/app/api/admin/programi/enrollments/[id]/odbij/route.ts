import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obavesti } from "@/lib/notifikacije";
import { labelPrograma } from "@/lib/protokol/programi";
import { okoncajPrijavu } from "@/lib/protokol/program-prijava";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/programi/enrollments/[id]/odbij
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  // Odlučuje isključivo superadmin — isto lice koje jedino i vidi unete podatke
  // (DPIA 5.6). Odluka bez uvida u prijavu bila bi odluka na slepo.
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const razlog = (body.razlog ?? "").trim();

  const enrollment = await prisma.programEnrollment.findUnique({ where: { id } });
  if (!enrollment) return await greska("Prijava nije pronađena.", 404);
  if (enrollment.status !== "PENDING")
    return await greska("Prijava nije na čekanju.", 400);

  // Briše i unete podatke i zatvara postupak potvrda — vidi `okoncajPrijavu`.
  await okoncajPrijavu(id, { status: "REJECTED", razlog: razlog || null });

  await logAdminAkcija(session.user.id, "PROGRAM_PRIJAVA_ODBIJENA", enrollment.userId,
    `${labelPrograma(enrollment.type)}${razlog ? ": " + razlog : ""}`);

  await obavesti(enrollment.userId, {
    tip: "info",
    kljuc: razlog ? "notifikacije.program_odbijen_razlog" : "notifikacije.program_odbijen",
    parametri: { program: labelPrograma(enrollment.type), razlog: razlog ?? "" },
    naslov: "Prijava na program odbijena",
    tekst: `Tvoja prijava na program „${labelPrograma(enrollment.type)}" je odbijena.${razlog ? ` Razlog: ${razlog}` : ""}`,
    link: "/programi",
  });

  return NextResponse.json({ ok: true });
}
