import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prikazKoda } from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * GET /api/vauceri — dostupni vaučeri po ugovoru i „Moji vaučeri" za prijavljenog
 * člana (nabavke čl. 32): za svaki ugovor opis, naziv davaoca, mesto i adresa,
 * broj preostalih vaučera, broj POEN-a po vaučeru i rok važenja.
 *
 * 🔴 Uz broj POEN-a se NIKAD ne vraća dinarska vrednost (cena, vrednost ugovora) —
 * nabavke čl. 31 st. 2, R-01. Vrednost ugovora se objavljuje samo u izveštaju.
 * Brana: `vaucer-izvor.test.ts`.
 *
 * 🔴 Podnosilac ne vidi vaučere svog davaoca kao dostupne (donacije čl. 36).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const ja = session.user.id;
  const sada = new Date();

  const [dostupni, moji] = await Promise.all([
    prisma.ugovorDobra.findMany({
      where: {
        status: "POTPISAN",
        podnosilacId: { not: ja },
        vaziDo: { gt: sada },
        vauceri: { some: { status: "SLOBODAN" } },
        // Obrisan upis: prestaje ponuda vaučera (donacije čl. 18 st. 4). Korisnik koji
        // vodi upis ne vidi vaučere svog pokrovitelja kao dostupne (čl. 36).
        OR: [{ upisId: null }, { upis: { obrisanAt: null, vlasnikUserId: { not: ja } } }],
      },
      orderBy: { potpisanoAt: "desc" },
      select: {
        id: true, opis: true, naziv: true, logoUrl: true, vrsta: true, mesto: true, adresaPredaje: true,
        vaziDo: true, poenaPoVauceru: true, upisId: true,
        upis: { select: { naziv: true, logoUrl: true } },
        _count: { select: { vauceri: { where: { status: "SLOBODAN" } } } },
      },
    }),
    prisma.vaucer.findMany({
      where: { imalacId: ja },
      orderBy: { dodeljenAt: "desc" },
      take: 50,
      select: {
        id: true, kod: true, status: true, ponisteno: true, pristanakPrikazAt: true, pristanakPovucenAt: true,
        ugovor: {
          select: {
            opis: true, naziv: true, logoUrl: true, mesto: true, adresaPredaje: true, vaziDo: true, poenaPoVauceru: true,
            upis: { select: { naziv: true, logoUrl: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    dostupni: dostupni.map((o) => ({
      id: o.id,
      upisId: o.upisId,
      opis: o.opis,
      // Naziv i logotip iz upisa pokrovitelja (donacije čl. 26 st. 2) — logotip nikad link.
      davalac: o.upis?.naziv ?? o.naziv,
      logoUrl: o.upis ? o.upis.logoUrl : o.logoUrl,
      vrsta: o.vrsta,
      mesto: o.mesto,
      adresaPredaje: o.adresaPredaje,
      vaziDo: o.vaziDo?.toISOString() ?? null,
      // Broj POEN-a po vaučeru (nabavke čl. 31) snima se pri potpisu ugovora.
      poen: o.poenaPoVauceru ?? 0,
      preostalo: o._count.vauceri,
    })),
    vauceri: moji.map((v) => ({
      id: v.id,
      kod: v.status === "DODELJEN" ? prikazKoda(v.kod) : null,
      status: v.status,
      opis: v.ugovor.opis,
      davalac: v.ugovor.upis?.naziv ?? v.ugovor.naziv,
      logoUrl: v.ugovor.upis ? v.ugovor.upis.logoUrl : v.ugovor.logoUrl,
      mesto: v.ugovor.mesto,
      adresaPredaje: v.ugovor.adresaPredaje,
      vaziDo: v.ugovor.vaziDo?.toISOString() ?? null,
      // Broj POEN-a poništen pri uzimanju (nabavke čl. 33 st. 4) — snimak sa vaučera.
      poen: v.ponisteno || (v.ugovor.poenaPoVauceru ?? 0),
      // Pristanak na prikaz opisa uz pseudonim i njegovo povlačenje (nabavke čl. 33 st. 1–2).
      pristanakDat: v.pristanakPrikazAt !== null,
      pristanakPovucenAt: v.pristanakPovucenAt?.toISOString() ?? null,
    })),
  });
}
