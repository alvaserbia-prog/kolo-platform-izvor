import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { dohvatiIliKreirajKanal } from "@/lib/protokol/osnivacki";

/**
 * POST   /api/admin/osnivaci/zakljucaj — zakljucava listu osnivaca.
 *   Uslov: bar jedan osnivac, svi sa istim imeniocem, zbir brojilaca = imenilac (100%).
 *   Koraci osnivackog doprinosa se evidentiraju samo nad zakljucanom listom.
 * DELETE /api/admin/osnivaci/zakljucaj — otkljucava listu za izmene,
 *   dozvoljeno samo dok kanal nije aktiviran (brojKoraka = 0).
 */

async function proveriAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { ok: false, error: "Nije prijavljen.", status: 401 } as const;
  if (!jeSuperadmin(session.user)) return { ok: false, error: "Samo admin.", status: 403 } as const;
  return { ok: true, session } as const;
}

export async function POST() {
  const auth = await proveriAdmin();
  if (!auth.ok) return await greska(auth.error, auth.status);

  const kanal = await dohvatiIliKreirajKanal();
  if (kanal.osnivaciZakljucani) {
    return await greska("Lista osnivača je već zaključana.", 409);
  }

  const osnivaci = await prisma.osnivac.findMany({ orderBy: { redniBroj: "asc" } });
  if (osnivaci.length === 0) {
    return await greska("Nema definisanih osnivača — nema šta da se zaključa.", 400);
  }

  const imenilac = osnivaci[0].udeoImenilac;
  const sviIstiImenilac = osnivaci.every((o) => o.udeoImenilac === imenilac);
  const zbirBrojilaca = osnivaci.reduce((s, o) => s + o.udeoBrojilac, 0);
  if (!sviIstiImenilac || zbirBrojilaca !== imenilac) {
    return NextResponse.json({
      error: `Udeli nisu potpuni: zbir je ${zbirBrojilaca}/${imenilac}, mora biti tačno ${imenilac}/${imenilac} (100%).`,
    }, { status: 400 });
  }

  await prisma.osnivackiKanal.update({
    where: { id: "singleton" },
    data: { osnivaciZakljucani: true, osnivaciZakljucaniAt: new Date() },
  });
  await logAdminAkcija(auth.session.user.id, "OSNIVACI_ZAKLJUCANI", undefined,
    `${osnivaci.length} osnivača, zbir ${zbirBrojilaca}/${imenilac}`);
  return NextResponse.json({ ok: true, poruka: "Lista osnivača je zaključana." });
}

export async function DELETE() {
  const auth = await proveriAdmin();
  if (!auth.ok) return await greska(auth.error, auth.status);

  const kanal = await dohvatiIliKreirajKanal();
  if (kanal.brojKoraka > 0) {
    return NextResponse.json({
      error: "Kanal je već aktiviran (broj koraka > 0) — lista se više ne može otključati.",
    }, { status: 409 });
  }

  await prisma.osnivackiKanal.update({
    where: { id: "singleton" },
    data: { osnivaciZakljucani: false, osnivaciZakljucaniAt: null },
  });
  await logAdminAkcija(auth.session.user.id, "OSNIVACI_OTKLJUCANI");
  return NextResponse.json({ ok: true, poruka: "Lista osnivača je otključana." });
}
