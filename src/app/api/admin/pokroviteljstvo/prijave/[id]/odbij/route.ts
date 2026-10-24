import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { odbijPrijavu } from "@/lib/protokol/pokrovitelj";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { jeAdmin } from "@/lib/dozvole";

// POST /api/admin/pokroviteljstvo/prijave/[id]/odbij — Fondacija odbija prijem (čl. 8)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const razlog = (body.razlog ?? "").trim();
  if (!razlog) return await greska("Obrazloženje je obavezno.", 400);

  try {
    const rez = await odbijPrijavu(id, session.user.id, razlog);
    await logAdminAkcija(session.user.id, "POKROVITELJSTVO_ODBIJENO", id, razlog);
    await obavesti(rez.podnosilacId, {
      tip: "pokroviteljstvo_odbijeno",
      kljuc: "notifikacije.pokroviteljstvo_odbijeno",
      parametri: { razlog },
      naslov: "Prijava pokroviteljstva odbijena",
      tekst: `Tvoja prijava pokroviteljstva je odbijena. Razlog: ${razlog}. Možeš da podneseš novu prijavu.`,
      link: "/postani-pokrovitelj",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return await greska(e instanceof Error ? e.message : "Greška.", 400);
  }
}
