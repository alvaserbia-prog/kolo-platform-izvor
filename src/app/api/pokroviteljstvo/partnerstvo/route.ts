import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proveriDokaze } from "@/lib/pokroviteljstvo-dobrima-pravila";
import {
  procitajPrijavuPartnerstva,
  podnesiPrijavuPartnerstva,
  partnerstvaUpisa,
  odgovorNaGreskuPartnerstva,
  type DokazPartnerstvaUlaz,
} from "@/lib/protokol/partnerstvo";

/**
 * GET  /api/pokroviteljstvo/partnerstvo?upisId= — partnerstva upisa koji vodi prijavljeni
 *      korisnik, sa izvršenjima. 🔴 Uz vrednost (dinari) se ne vraća broj POEN-a.
 * POST /api/pokroviteljstvo/partnerstvo — prijava partnerstva (donacije čl. 41) iz ODOBRENOG
 *      upisa, multipart: `upisId`, opis, jedinica mere, cena po jedinici, obim, rok izvršenja,
 *      obrada podataka, izjava podnosioca + `cenovnik` (fotografija cenovnika, obavezna).
 *      Podaci o partneru se ovde NE primaju — snimak su upisa.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  try {
    const partnerstva = await partnerstvaUpisa(session.user.id, req.nextUrl.searchParams.get("upisId") ?? "");
    return NextResponse.json({ partnerstva });
  } catch (e) {
    return await odgovorNaGreskuPartnerstva(e);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const fd = await req.formData().catch(() => null);
  if (!fd) return await greska("Neispravan zahtev.", 400);

  const polja: Record<string, unknown> = {};
  for (const k of ["opis", "jedinicaMere", "cenaPoJedinici", "obim", "rokIzvrsenja", "obradaPodataka", "izjavaPodnosioca"]) {
    const v = fd.get(k);
    if (typeof v === "string") polja[k] = v;
  }
  const upisId = fd.get("upisId");
  if (typeof upisId !== "string" || !upisId) return await greska("Prijava se podnosi iz upisa pokrovitelja u evidenciju.", 400);

  const provera = procitajPrijavuPartnerstva(polja);
  if (!provera.ok) return await greska(provera.razlog, 400);

  // Fotografija cenovnika iz koje se vidi cena (čl. 41 st. 2) — ista pravila kao kod dobara.
  const fajlovi: File[] = [];
  for (const f of fd.getAll("cenovnik")) if (f instanceof File && f.size > 0) fajlovi.push(f);
  const dokaz = proveriDokaze(fajlovi.map((f) => ({ vrsta: "CENOVNIK" as const, tip: f.type, velicina: f.size })));
  if (!dokaz.ok) return await greska(dokaz.razlog, 400);
  const dokazi: DokazPartnerstvaUlaz[] = [];
  for (const f of fajlovi) {
    dokazi.push({ nazivFajla: f.name || "cenovnik", contentType: f.type, sadrzaj: Buffer.from(await f.arrayBuffer()) });
  }

  try {
    const p = await podnesiPrijavuPartnerstva(session.user.id, upisId, provera.podaci, dokazi);
    return NextResponse.json({ ok: true, id: p.id }, { status: 201 });
  } catch (e) {
    return await odgovorNaGreskuPartnerstva(e);
  }
}
