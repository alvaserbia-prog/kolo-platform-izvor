import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { odbijDoprinos } from "@/lib/protokol/doprinos-sadrzaju";

/**
 * POST /api/admin/prvi-oglasi/[id]/odbij  { razlog }
 *
 * Doprinos se ne evidentira — oglas OSTAJE na Pijaci (odbijanje nije moderacija;
 * za uklanjanje spornog oglasa postoji `/api/admin/pijaca/[id]/ukloni`).
 *
 * Razlog je obavezan i ide korisniku. Odbijanje oslobađa kanal: kad korisnik
 * dopuni oglas ili objavi bolji, doprinos se ponovo beleži i vraća u red čekanja.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const razlog = typeof body.razlog === "string" ? body.razlog : "";

  const rez = await odbijDoprinos(id, session.user.id, razlog);
  if (!rez.ok) return await greska(rez.greska ?? "Odbijanje nije uspelo.", 400);
  return NextResponse.json({ ok: true });
}
