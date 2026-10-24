import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pristanakStatus } from "@/lib/politika";
import { oba, PORUKA_PRISTANAK_OBAVEZAN } from "@/lib/pristanak";
import { upisiPristankeRegistracije } from "@/lib/protokol/pristanak";
import { getLocale } from "next-intl/server";

/**
 * GET /api/politika/prihvati — vraća najnoviju verziju politike koju korisnik NIJE prihvatio
 * POST /api/politika/prihvati — korisnik prihvata verziju politike
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  // Isti izvor istine kao `/api/me` — vidi `pristanakStatus`. Dva odvojena upita
  // su umela da se raziđu, pa je ekran za pristanak bljesnuo i nestao.
  const { potrebno, verzija } = await pristanakStatus(session.user.id);

  return NextResponse.json(potrebno ? { potrebno, verzija } : { potrebno: false });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const userId = session.user.id;
  const body = await req.json();
  const { verzijaId, prihvatamUslove, prihvatamPolitiku } = body;

  if (!verzijaId) {
    return await greska("verzijaId je obavezno.", 400);
  }

  // 🔴 Server proverava isto što i ekran (R-06). Do tada je gejt primao goli
  // `verzijaId` i upisivao prihvatanje — dakle pristanak je mogao da nastane
  // zahtevom koji nijedna kvačica nije pratila. Pretraživač nikad nije poslednja
  // reč; isto pravilo važi i na registraciji.
  if (!oba(prihvatamUslove, prihvatamPolitiku)) {
    return await greska(PORUKA_PRISTANAK_OBAVEZAN, 400);
  }

  const verzija = await prisma.politikaVerzija.findUnique({ where: { id: verzijaId } });
  if (!verzija) return await greska("Verzija nije pronađena.", 404);

  const jezik = await getLocale();

  // 🔴 Gejt je za ZATEČENE naloge JEDINO mesto na kome dokaz pristanka može da
  // nastane — njima se ne može napraviti unazad (retroaktivno upisan pristanak bio
  // bi netačan dokument). Zato ovde ne ide samo `PolitikaPrihvatanje`, koje
  // otključava ekran, nego i `ZapisPristanka` sa snimljenim tekstom i verzijom,
  // isti kakav nov čovek dobija pri registraciji. Oba u istoj transakciji: nalog
  // koji je prošao gejt a nema zapis je tačno stanje koje se uklanja.
  await prisma.$transaction(async (tx) => {
    await tx.politikaPrihvatanje.upsert({
      where: { userId_verzijaId: { userId, verzijaId } },
      update: { prihvacen: true, createdAt: new Date() },
      create: { userId, verzijaId, prihvacen: true },
    });
    await upisiPristankeRegistracije(tx, userId, jezik, "gejt");
  });

  return NextResponse.json({ ok: true });
}
