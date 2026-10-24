import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { izracunajDnevniIznos, labelPrograma } from "@/lib/protokol/programi";
import { ProgramType } from "@/generated/prisma/client";

// GET /api/programi — status enrollmenta i aktivnih programa za korisnika
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const danas = new Date();
  danas.setHours(0, 0, 0, 0);

  const [aktivniProgrami, enrollments] = await Promise.all([
    prisma.protokolProgram.findMany({ where: { isActive: true } }),
    prisma.programEnrollment.findMany({
      where: { userId: session.user.id },
    }),
  ]);

  const aktivniTipovi = new Set(aktivniProgrami.map((p) => p.type));

  // PED (operativni doprinos) ide kroz zadatke (/doprinos-oglasi), ne kroz enrollment.
  const sviTipovi: ProgramType[] = [
    "PODRSKA_MAJKAMA", "PODRSKA_STARIJIMA", "POSEBNA_BRIGA", "SKOLOVANJE",
  ];

  const rezultati = sviTipovi.map((type) => {
    const enrollment = enrollments.find((e) => e.type === type);
    const isActive = aktivniTipovi.has(type);
    let ocekivaniDnevni = 0;
    if (enrollment?.status === "ACTIVE") {
      ocekivaniDnevni = izracunajDnevniIznos(type, enrollment.metadata, enrollment.dailyAmount, danas);
    }
    return {
      type,
      label: labelPrograma(type),
      programAktivan: isActive,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            metadata: enrollment.metadata,
            dailyAmount: enrollment.dailyAmount,
            approvedAt: enrollment.approvedAt?.toISOString() ?? null,
            rejectionReason: enrollment.rejectionReason,
            ocekivaniDnevni,
            // Lično razlaganje po programu (R-03, mera M-1): opis transakcije
            // više ne imenuje program, pa korisnik sopstveni zbir vidi ovde.
            isplacenoPoen: enrollment.isplacenoPoen,
          }
        : null,
    };
  });

  return NextResponse.json({ programi: rezultati });
}
