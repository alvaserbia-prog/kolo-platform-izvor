import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { labelPrograma } from "@/lib/protokol/programi";
import { ucitajStatus, sme } from "@/lib/protokol/status";

// GET /api/programi/potvrde — zahtevi za potvrdu koje čekaju prijavljenog verifikatora.
// Verifikator NE dobija uvid u osetljive prijavljene podatke (čl. 4) — samo naziv
// programa i pseudonim podnosioca, koga lično poznaje kao svog verifikovanog.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Spisak vidi samo član Kola, odnosno osnivač (programi čl. 4 st. 2).
  const status = await ucitajStatus(session.user.id);
  if (!status || !sme("POTVRDJUJE_USLOVE_PROGRAMA", status)) return NextResponse.json({ potvrde: [] });

  const potvrde = await prisma.programPotvrda.findMany({
    // Zatečeni redovi iz vremena pre `zatvoriPostupakPotvrda`: prijava je
    // odavno rešena, a zahtev je verifikatoru i dalje stajao u spisku i dalje
    // mu pokazivao naziv programa. Filter po stanju prijave to gasi i za njih.
    where: { verifikatorId: session.user.id, status: "CEKA", enrollment: { status: "PENDING" } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      enrollment: {
        select: {
          type: true,
          user: { select: { id: true, pseudonim: true } },
        },
      },
    },
  });

  return NextResponse.json({
    potvrde: potvrde.map((p) => ({
      id: p.id,
      program: labelPrograma(p.enrollment.type),
      podnosilacId: p.enrollment.user.id,
      podnosilacPseudonim: p.enrollment.user.pseudonim,
      datum: p.createdAt.toISOString(),
    })),
  });
}
