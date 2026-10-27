import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obavesti } from "@/lib/notifikacije";
import { labelPrograma, rokReverifikacije } from "@/lib/protokol/programi";
import { potvrdiUsloveFondacija, zatvoriPostupakPotvrda } from "@/lib/protokol/program-potvrda";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";

// POST /api/admin/programi/enrollments/[id]/odobri
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

  const enrollment = await prisma.programEnrollment.findUnique({ where: { id } });
  if (!enrollment) return await greska("Prijava nije pronađena.", 404);
  if (enrollment.status !== "PENDING")
    return await greska("Prijava nije na čekanju.", 400);

  // 🔴 Posebna podrška bez osnova nema pravo (Pravilnik o programima podrške čl. 14
  // st. 1: pravo se ostvaruje po jednom od dva osnova). Odobrena bez osnova, revizija
  // bi je obustavila prvim prolazom (`rokReverifikacije` joj daje rok = trenutak
  // odobrenja), pa se odobrenje odbija pre bilo kakvog upisa.
  if (enrollment.type === "POSEBNA_BRIGA" && enrollment.osnov == null)
    return await greska("Posebna podrška se ne odobrava bez osnova (gubitak doma ili bolest).", 409);

  const body = await req.json().catch(() => ({}));

  // Tvrda blokada (anti-malverzacija, Pravilnik o programima podrške čl. 4 st. 3 i 5,
  // set 4.8.2): odobrava se tek kad je ispunjenost uslova potvrđena — od člana Kola
  // koji podnosioca lično zna, odnosno od Fondacije. Ko ima više potvrđivača po
  // zatečenim verifikacijama (programi čl. 5 st. 3), dovoljna je potvrda jednog.
  //
  // Kad podnosilac nema nijednog podobnog potvrđivača (nijedan zahtev nije upućen),
  // ispunjenost uslova potvrđuje Fondacija: `obrazlozenjeFondacije` je obavezno i
  // snima se u potvrdu (otvoreno pitanje 18).
  const [potvrdjeno, zahteva] = await Promise.all([
    prisma.programPotvrda.count({ where: { enrollmentId: id, status: "POTVRDJENO" } }),
    prisma.programPotvrda.count({ where: { enrollmentId: id } }),
  ]);
  if (potvrdjeno === 0) {
    if (zahteva > 0)
      return await greska("Nije moguće odobriti — član Kola još nije potvrdio ispunjenost uslova.", 409);
    const obrazlozenje = typeof body.obrazlozenjeFondacije === "string" ? body.obrazlozenjeFondacije.trim() : "";
    if (obrazlozenje.length < 10)
      return await greska("Podnosilac nema člana Kola koji ga lično zna — Fondacija potvrđuje ispunjenost uslova uz obrazloženje.", 409);
    try {
      await potvrdiUsloveFondacija(id, session.user.id, obrazlozenje);
    } catch (e) {
      return await greska(e instanceof Error ? e.message : "Potvrda Fondacije nije upisana.", 409);
    }
    await logAdminAkcija(session.user.id, "PROGRAM_USLOVI_POTVRDA_FONDACIJE", enrollment.userId, labelPrograma(enrollment.type));
  }
  const dailyAmount = body.dailyAmount ? Number(body.dailyAmount) : undefined;

  // Reverifikacija statusa (Pravilnik o programima podrške čl. 18, 19).
  //
  // 🔴 Rok se traži od `rokReverifikacije`, ne od broja dana po tipu programa:
  // kod Posebne podrške zavisi od OSNOVA i od podataka u prijavi — gubitak doma
  // traje dvanaest meseci od događaja, akutna bolest šest meseci, a pravo za
  // maloletno lice prestaje njegovim punoletstvom.
  const nextReverifikacija =
    rokReverifikacije(
      { type: enrollment.type, osnov: enrollment.osnov, metadata: enrollment.metadata },
      new Date(),
    ) ?? undefined;

  await prisma.programEnrollment.update({
    where: { id },
    data: {
      status: "ACTIVE",
      approvedById: session.user.id,
      approvedAt: new Date(),
      ...(dailyAmount != null ? { dailyAmount } : {}),
      ...(nextReverifikacija ? { nextReverifikacija } : {}),
    },
  });

  // Postupak je okončan — zahtevi verifikatorima nemaju više svrhu. `metadata`
  // se ovde NE briše: iz nje se računa dnevni iznos dok program traje.
  await zatvoriPostupakPotvrda(id);

  await logAdminAkcija(session.user.id, "PROGRAM_PRIJAVA_ODOBRENA", enrollment.userId, labelPrograma(enrollment.type));

  await obavesti(enrollment.userId, {
    tip: "info",
    kljuc: "notifikacije.program_odobren",
    parametri: { program: labelPrograma(enrollment.type) },
    naslov: "Prijava na program odobrena",
    tekst: `Tvoja prijava na program „${labelPrograma(enrollment.type)}" je odobrena.`,
    link: "/programi",
  });

  return NextResponse.json({ ok: true });
}
