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
    // Koeficijent nivoa pokrovitelja (donacije čl. 22 st. 1, set 5.0.8), zapisan kao „1,60".
    const koeficijent = rez.koeficijent.toFixed(2).replace(".", ",");
    // Set 5.0.9: potvrdom se doprinos beleži, a evidentira u narednom obračunskom periodu.
    await logAdminAkcija(session.user.id, "POKROVITELJSTVO_POTVRDJENO", id,
      `Zabeleženo ${rez.bonus.toLocaleString("sr-RS")} POEN (koeficijent ${koeficijent}), evidentira se u narednom obračunskom periodu`);
    await obavesti(rez.vlasnikId, {
      tip: "pokroviteljstvo_potvrdjeno",
      kljuc: rez.bonus > 0
        ? "notifikacije.pokroviteljstvo_potvrdjeno_bonus"
        : "notifikacije.pokroviteljstvo_potvrdjeno",
      parametri: { bonus: rez.bonus, koeficijent },
      naslov: "Pokroviteljstvo potvrđeno",
      tekst: rez.bonus > 0
        ? `Prijem pokroviteljstva je potvrđen. Zabeleženo je ${rez.bonus.toLocaleString("sr-RS")} POEN, sa koeficijentom ${koeficijent}; evidentira se u narednom obračunskom periodu.`
        : "Doprinos pokroviteljstva je potvrđen i dodat kumulativnom doprinosu.",
      link: "/postani-pokrovitelj",
    });
    return NextResponse.json({ ok: true, ...rez });
  } catch (e) {
    return await greska(e instanceof Error ? e.message : "Greška.", 400);
  }
}
