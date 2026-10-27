/**
 * GET /api/admin/provere/zatvorene-grupe — provera zatvorene grupe (Pravilnik o
 * dokazu stvarnosti čl. 26, set 4.8.2).
 *
 * Grupe članova bez potvrde koji su jedni druge uveli u Kolo i razmenjuju samo
 * unutar grupe, bez razmene sa članom Kola. Računa se pri svakom pozivu iz grafa
 * verifikacija i evidencije POEN-a; ne čuva se.
 *
 * 🔴 Provera nema nikakvo dejstvo prema učesniku (ne menja status, verifikaciju ni
 * zapise, nije ishod nadzora). Vidi je samo superadmin; Fondacija članove grupe može
 * pozvati na razgovor.
 */
import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { USLOV_RAZMENE } from "@/lib/razmena-brojac-pravila";
import { statusUcesnika, type StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import { zatvoreneGrupe } from "@/lib/provera-grupe-pravila";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);

  const veze = await prisma.verifikacionaVeza.findMany({
    where: { vrsta: "UVODJENJE" },
    select: { verifikatorId: true, verifikovaniId: true, vrsta: true },
  });
  const uGrafu = [...new Set(veze.flatMap((v) => [v.verifikatorId, v.verifikovaniId]))];
  if (uGrafu.length === 0) return NextResponse.json({ grupe: [] });

  const korisnici = await prisma.user.findMany({
    where: { id: { in: uGrafu }, maloletan: false },
    select: {
      id: true, pseudonim: true, maloletan: true, jeOsnivac: true, verified: true,
      indeksStvarnosti: true, potvrdjenAt: true, tipKorisnika: true,
      wallet: { select: { id: true } },
    },
  });
  const statusi = new Map<string, StatusUcesnika>(korisnici.map((k) => [k.id, statusUcesnika(k)]));
  const bezPotvrde = korisnici.filter((k) => statusi.get(k.id) === "CLAN_BEZ_POTVRDE");
  const novcanici = bezPotvrde.flatMap((k) => (k.wallet ? [k.wallet.id] : []));

  const transakcije = novcanici.length
    ? await prisma.transaction.findMany({
        where: { ...USLOV_RAZMENE, OR: [{ fromWalletId: { in: novcanici } }, { toWalletId: { in: novcanici } }] },
        select: { fromWalletId: true, toWalletId: true },
      })
    : [];
  // Novčanici druge strane — da se zna da li je to član Kola.
  const sviNovcanici = [...new Set(transakcije.flatMap((t) => [t.fromWalletId, t.toWalletId]).filter((w): w is string => !!w))];
  const vlasnici = await prisma.wallet.findMany({
    where: { id: { in: sviNovcanici }, userId: { not: null } },
    select: {
      id: true,
      user: {
        select: {
          id: true, maloletan: true, jeOsnivac: true, verified: true,
          indeksStvarnosti: true, potvrdjenAt: true, tipKorisnika: true,
        },
      },
    },
  });
  const vlasnik = new Map<string, string>();
  for (const w of vlasnici) {
    if (!w.user) continue;
    vlasnik.set(w.id, w.user.id);
    if (!statusi.has(w.user.id) && !w.user.maloletan) statusi.set(w.user.id, statusUcesnika(w.user));
  }
  const razmene = transakcije.flatMap((t) => {
    const a = t.fromWalletId ? vlasnik.get(t.fromWalletId) : undefined;
    const b = t.toWalletId ? vlasnik.get(t.toWalletId) : undefined;
    return a && b ? [{ aId: a, bId: b }] : [];
  });

  const pseudonim = new Map(korisnici.map((k) => [k.id, k.pseudonim]));
  const grupe = zatvoreneGrupe(veze, razmene, statusi).map((g) => ({
    clanovi: g.clanovi.map((id) => ({ id, pseudonim: pseudonim.get(id) ?? id })),
    razmenaUnutar: g.razmenaUnutar,
    razmenaSaOstalima: g.razmenaSaOstalima,
  }));
  return NextResponse.json({ grupe });
}
