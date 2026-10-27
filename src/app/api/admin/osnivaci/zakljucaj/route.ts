import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { dohvatiIliKreirajKanal } from "@/lib/protokol/osnivacki";

/**
 * POST   /api/admin/osnivaci/zakljucaj — zaključava listu osnivača.
 *   Uslov: bar jedan osnivač, svi sa istim imeniocem, zbir brojilaca = imenilac (100%).
 *   Zaključavanjem se objavljuje odluka o raspodeli (Pravilnik o osnivačkom doprinosu
 *   čl. 8 st. 4): lista mora odgovarati odluci Upravnog odbora pre nego što se zaključa.
 *   Koraci osnivačkog doprinosa se evidentiraju samo nad zaključanom listom.
 * DELETE /api/admin/osnivaci/zakljucaj — 🔴 otključavanja nema. Posle objave odluke o
 *   raspodeli krug osnivača je zatvoren i nijedna kasnija odluka ga ne može proširiti
 *   (čl. 2 st. 3), pa lista ostaje zaključana i dok je broj koraka 0. Brana
 *   `osnivacki-izvor.test.ts`.
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
  return await greska(
    "Odluka o raspodeli je objavljena zaključavanjem liste; krug osnivača je zatvoren i lista se ne otključava (Pravilnik o osnivačkom doprinosu čl. 2 st. 3).",
    409,
  );
}
