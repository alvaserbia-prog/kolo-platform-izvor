import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obavesti } from "@/lib/notifikacije";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { labelPrograma } from "@/lib/protokol/programi";
import { okoncajPrijavu } from "@/lib/protokol/program-prijava";
import { ucitajStatus, sme } from "@/lib/protokol/status";

// POST /api/programi/potvrde/[id]/odgovori
// Telo: { potvrdi: boolean, obrazlozenje?: string }
// Verifikator potvrđuje ispunjenost uslova pod punom odgovornošću, ili odbija uz
// obavezno obrazloženje (čl. 5 st. 3–4, set 4.8.0). Dovoljna je potvrda jednog verifikatora;
// odbijanje obara prijavu tek kad niko nije potvrdio i nijedan zahtev više ne čeka
// (više verifikatora ima samo ko je potvrde stekao pre seta 4.8.0, dokaz stvarnosti 4.8.x čl. 22).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const potvrdi = body.potvrdi === true;
  const obrazlozenje = typeof body.obrazlozenje === "string" ? body.obrazlozenje.trim() : "";

  if (!potvrdi && obrazlozenje.length === 0)
    return await greska("Odbijanje zahteva obrazloženje.", 400);

  const potvrda = await prisma.programPotvrda.findUnique({
    where: { id },
    include: {
      enrollment: { select: { id: true, type: true, userId: true, status: true } },
    },
  });
  if (!potvrda) return await greska("Zahtev nije pronađen.", 404);
  if (potvrda.verifikatorId !== session.user.id)
    return await greska("Pristup odbijen.", 403);
  if (potvrda.status !== "CEKA")
    return await greska("Već ste odgovorili na ovaj zahtev.", 400);
  if (potvrda.enrollment.status !== "PENDING")
    return await greska("Prijava više nije na čekanju.", 400);
  // Ispunjenost uslova potvrđuje ČLAN KOLA, odnosno osnivač (programi čl. 5 st. 1–2;
  // dokaz stvarnosti čl. 6 st. 2 t. 2). Ko je u međuvremenu prestao da bude član Kola, više
  // ne odgovara na zahtev.
  const mojStatus = await ucitajStatus(session.user.id);
  if (!mojStatus || !sme("POTVRDJUJE_USLOVE_PROGRAMA", mojStatus))
    return await greska("Ispunjenost uslova potvrđuje član Kola.", 403);

  const programLabel = labelPrograma(potvrda.enrollment.type);
  const verifikatorPseudonim = session.user.pseudonim;

  if (potvrdi) {
    // Prva potvrda čini prijavu spremnom za odluku Fondacije.
    const svePotvrdjeno = await prisma.$transaction(async (tx) => {
      const ranije = await tx.programPotvrda.count({
        where: { enrollmentId: potvrda.enrollment.id, status: "POTVRDJENO" },
      });
      await tx.programPotvrda.update({
        where: { id },
        data: { status: "POTVRDJENO", odgovorAt: new Date(), obrazlozenje: null },
      });
      return ranije === 0;
    });

    if (svePotvrdjeno) {
  // 🔴 Naziv programa NE ide u kanal upozorenja (Telegram + mejl na ADMIN_EMAIL).
  // Iz para „pseudonim + POSEBNA_BRIGA" čita se pripadnost posebnoj kategoriji
  // podataka, a taj kanal ide preko obrađivača u SAD koje Politika navodi samo za
  // uzak obim (čl. 39, 40). Ko odlučuje o prijavi vidi je u admin panelu, gde su
  // uneti podaci ionako otvoreni samo superadminu.
      void posaljiAdminAlert(
        "Prijava spremna za odobravanje",
        `Verifikator je potvrdio — prijava čeka odluku Fondacije.\nDetalji su u admin panelu.`
      );
      await obavesti(potvrda.enrollment.userId, {
        tip: "info",
        kljuc: "notifikacije.svi_verifikatori_potvrdili",
        parametri: { program: programLabel },
        naslov: "Verifikator je potvrdio",
        tekst: `Tvoj verifikator je potvrdio prijavu za program „${programLabel}". Prijava čeka odluku Fondacije.`,
        link: "/programi",
      });
    }

    return NextResponse.json({ ok: true, svePotvrdjeno });
  }

  // Odbijanje — obara prijavu (tvrda blokada) samo ako niko nije potvrdio i niko
  // drugi više ne može (nijedan zahtev ne čeka).
  const obara = await prisma.$transaction(async (tx) => {
    await tx.programPotvrda.update({
      where: { id },
      data: { status: "ODBIJENO", odgovorAt: new Date(), obrazlozenje },
    });
    const josMoze = await tx.programPotvrda.count({
      where: { enrollmentId: potvrda.enrollment.id, status: { in: ["CEKA", "POTVRDJENO"] } },
    });
    return josMoze === 0;
  });
  if (!obara) return NextResponse.json({ ok: true, odbijeno: false });

  // Briše unete podatke i sklanja zahteve preostalim verifikatorima — postupka
  // više nema, pa ni njihovi zahtevi nemaju svrhu. Vidi `okoncajPrijavu`.
  await okoncajPrijavu(potvrda.enrollment.id, {
    status: "REJECTED",
    razlog: `Verifikator nije potvrdio ispunjenost uslova: ${obrazlozenje}`,
  });

  await obavesti(potvrda.enrollment.userId, {
    tip: "info",
    kljuc: "notifikacije.program_odbijen_verifikator",
    parametri: { program: programLabel, obrazlozenje },
    naslov: "Prijava na program odbijena",
    tekst: `Tvoja prijava za program „${programLabel}" je odbijena jer je tvoj verifikator nije potvrdio. Obrazloženje: ${obrazlozenje}`,
    link: "/programi",
  });
  void posaljiAdminAlert(
    "Prijava na program odbijena (verifikator)",
    `Verifikator: ${verifikatorPseudonim}\nObrazloženje: ${obrazlozenje}\nDetalji su u admin panelu.`
  );

  return NextResponse.json({ ok: true, odbijeno: true });
}
