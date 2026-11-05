import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin, jeSuperadmin } from "@/lib/dozvole";
import { rokProvere } from "@/lib/donacija-unapred-pravila";

/**
 * GET /api/admin/donacije-unapred — red za proveru (donacije čl. 6 st. 6, set 5.0.9):
 * donacije unapred koje čekaju utvrđenje prijema (rok 24 časa, i vikendom) i aktivna
 * ograničenja primljenog iznosa (čl. 6 st. 7–8). Pseudonim, iznos, rok i pročitani
 * podaci; ime platioca vidi samo administratorski tim (Registar radnji obrade br. 5).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);

  const [naProveri, ogranicenja] = await Promise.all([
    prisma.donationRecord.findMany({
      where: { status: "NA_PROVERI" },
      orderBy: { evidentiranoUnapredAt: "asc" },
      include: { user: { select: { pseudonim: true } }, potvrda: { select: { id: true, mime: true } } },
    }),
    prisma.ogranicenjePrimljenog.findMany({
      where: { status: "AKTIVNO" },
      orderBy: { rokDo: "asc" },
      include: { donation: { select: { user: { select: { pseudonim: true } } } } },
    }),
  ]);
  const pseudonimi = new Map(
    (await prisma.user.findMany({ where: { id: { in: ogranicenja.map((o) => o.userId) } }, select: { id: true, pseudonim: true, maloletan: true } }))
      .map((u) => [u.id, u]),
  );

  return NextResponse.json({
    smeOdlukuOgranicenja: jeSuperadmin(session.user),
    naProveri: naProveri.map((d) => {
      const od = d.evidentiranoUnapredAt ?? d.createdAt;
      return {
        id: d.id,
        pseudonim: d.user.pseudonim,
        amountRSD: Number(d.amountRSD),
        poenEmitted: d.poenEmitted,
        pozivNaBroj: d.referenceNumber,
        evidentiranoAt: od.toISOString(),
        rokDo: rokProvere(od).toISOString(),
        donatorIme: d.donatorIme,
        procitano: {
          iznosRSD: d.potvrdaIznosRSD === null ? null : Number(d.potvrdaIznosRSD),
          datum: d.potvrdaDatum?.toISOString() ?? null,
          racun: d.potvrdaRacun,
          poziv: d.potvrdaPoziv,
          platilac: d.potvrdaPlatilac,
        },
        imaPotvrdu: d.potvrda !== null,
      };
    }),
    ogranicenja: ogranicenja.map((o) => ({
      id: o.id,
      pseudonim: pseudonimi.get(o.userId)?.pseudonim ?? "—",
      maloletan: pseudonimi.get(o.userId)?.maloletan ?? false,
      donatorPseudonim: o.donation.user.pseudonim,
      primljeno: o.primljeno,
      iznos: o.iznos,
      rokDo: o.rokDo.toISOString(),
    })),
  });
}
