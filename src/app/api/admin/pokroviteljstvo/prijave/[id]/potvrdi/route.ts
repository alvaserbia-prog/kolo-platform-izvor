import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { potvrdiPrijavu } from "@/lib/protokol/pokrovitelj";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { jeAdmin } from "@/lib/dozvole";

// POST /api/admin/pokroviteljstvo/prijave/[id]/potvrdi — Fondacija potvrđuje prijem (čl. 20)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    // `aprUporedjeno`: administrator potvrđuje da je naziv, MB i zastupnika
    // uporedio sa APR-om (Pravilnik čl. 31 st. 4) — beleži se samo činjenica poređenja.
    const rez = await potvrdiPrijavu(id, session.user.id, body.aprUporedjeno === true);
    await logAdminAkcija(session.user.id, "POKROVITELJSTVO_POTVRDJENO", id,
      `Bonus ${rez.bonus.toLocaleString("sr-RS")} POEN (${rez.noviNivoi.length} nivo(a))`);
    await obavesti(rez.vlasnikId, {
      tip: "pokroviteljstvo_potvrdjeno",
      kljuc: rez.bonus > 0
        ? "notifikacije.pokroviteljstvo_potvrdjeno_bonus"
        : "notifikacije.pokroviteljstvo_potvrdjeno",
      parametri: { bonus: rez.bonus },
      naslov: "Pokroviteljstvo potvrđeno",
      tekst: rez.bonus > 0
        ? `Doprinos pokroviteljstva je potvrđen. Evidentirano je ${rez.bonus.toLocaleString("sr-RS")} bonus POEN.`
        : "Doprinos pokroviteljstva je potvrđen i dodat kumulativnom doprinosu.",
      link: "/postani-pokrovitelj",
    });
    return NextResponse.json({ ok: true, ...rez });
  } catch (e) {
    return await greska(e instanceof Error ? e.message : "Greška.", 400);
  }
}
