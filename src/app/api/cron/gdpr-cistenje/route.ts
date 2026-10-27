import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { jeCronPoziv } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { anonimizujPseudonime } from "@/lib/protokol/anonimizacija";

/**
 * POST /api/cron/gdpr-cistenje
 * GDPR data retention cleanup job.
 * Pokreće se mesečno (preporučeno 1. u mesecu u 02:00).
 *
 * Briše poruke u konverzaciji kada je ISPUNJEN BILO KOJI od dva uslova:
 *   — bar jedna strana je ugasila nalog (čl. 13 st. 6 Politike), ili
 *   — poslednja poruka je starija od 24 meseca (čl. 13 st. 6 Politike).
 *
 * 🔴 Do seta 4.5.1 su oba uslova morala da budu ispunjena ISTOVREMENO, i to uz
 * uslov da su ugašena OBA naloga — pa su poruke onoga ko ode ostajale kod
 * sagovornika bez gornje granice, dok i on ne ugasi nalog i dok ne prođu dve
 * godine. I ovaj komentar i CLAUDE.md su pri tom tvrdili „jedna strana ILI 24
 * meseca". Uslov je sada takav kakav je opisan.
 *
 * Briše i zapise dnevnika aktivnosti (AktivnostLog) i revizijskog dnevnika
 * (AuditLog) starije od 12 meseci — Politika čl. 9 st. 3 i 6 (set 5.0).
 *
 * Anonimizuje pseudonim naloga kome je od prestanka statusa prošlo 10 godina
 * (Pravilnik čl. 55 st. 3, Politika čl. 42 st. 6; `protokol/anonimizacija.ts`).
 * Numerička istorija ostaje trajno.
 */
export async function POST(req: NextRequest) {
  if (!jeCronPoziv(req)) {
    return await greska("Neautorizovano.", 401);
  }

  const sada = new Date();
  const dvadesetCetiriMesecaUnazad = new Date(sada);
  dvadesetCetiriMesecaUnazad.setMonth(dvadesetCetiriMesecaUnazad.getMonth() - 24);

  // --- Retencija poruka: ugašen nalog jedne strane ILI 24 meseca ---
  const stareKonverzacije = await prisma.konverzacija.findMany({
    where: {
      OR: [
        { user1: { deaktiviranAt: { not: null } } },
        { user2: { deaktiviranAt: { not: null } } },
        { lastMessageAt: { lte: dvadesetCetiriMesecaUnazad } },
      ],
    },
    select: { id: true },
  });

  let obrPoruke = 0;
  if (stareKonverzacije.length > 0) {
    const ids = stareKonverzacije.map((k) => k.id);
    const deleted = await prisma.poruka.deleteMany({
      where: { konverzacijaId: { in: ids } },
    });
    obrPoruke = deleted.count;
  }

  // --- Retencija dnevnika aktivnosti — 12 meseci (tehnički logovi) ---
  const dvanaestMeseciUnazad = new Date(sada);
  dvanaestMeseciUnazad.setMonth(dvanaestMeseciUnazad.getMonth() - 12);
  const obrAktivnosti = await prisma.aktivnostLog.deleteMany({
    where: { createdAt: { lte: dvanaestMeseciUnazad } },
  });

  // --- Retencija revizijskog dnevnika — 12 meseci (Politika čl. 9 st. 3 i 6) ---
  const obrRevizije = await prisma.auditLog.deleteMany({
    where: { createdAt: { lte: dvanaestMeseciUnazad } },
  });

  // --- Anonimizacija pseudonima 10 godina posle prestanka statusa ---
  const { anonimizovano } = await anonimizujPseudonime(sada);

  console.log(
    `[GDPR Cron] Poruke obrisane: ${obrPoruke}, zapisi aktivnosti obrisani: ${obrAktivnosti.count}, ` +
      `revizijski zapisi obrisani: ${obrRevizije.count}, anonimizovano pseudonima: ${anonimizovano}`,
  );

  return NextResponse.json({
    ok: true,
    porukeObrisane: obrPoruke,
    aktivnostiObrisane: obrAktivnosti.count,
    revizijaObrisana: obrRevizije.count,
    anonimizovano,
  });
}

// GET — Vercel Cron (Authorization: Bearer).
export async function GET(req: NextRequest) {
  return POST(req);
}
