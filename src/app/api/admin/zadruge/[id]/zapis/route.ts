import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import {
  zapisIzZadruge,
  izdavanjeDrugojZadruzi,
  jeOsnovIzZapisa,
  procitajIznos,
  ZadrugaGreska,
} from "@/lib/protokol/zadruga";

/**
 * POST — zapis iz zapisa zadruge, u ime zadruge (Pravilnik o zadrugama čl. 16):
 *  - `{ osnov: PRIJEM | DOPRINOS | USLUGA_PRIMLJENA, pseudonim, iznos, opis }` — korisniku;
 *  - `{ osnov: "IZDAVANJE", primalacZadrugaId, iznos, opis }` — dobro izdato drugoj
 *    zadruzi, POEN ide iz njenog zapisa u zapis ove zadruge (čl. 14 st. 2).
 * Iznos određuje zadruga (čl. 15); ovde se samo upisuje.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  const { id } = await params;
  let body: { osnov?: unknown; pseudonim?: unknown; primalacZadrugaId?: unknown; iznos?: unknown; opis?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  const iznos = procitajIznos(body.iznos);
  if (!iznos) return await greska("Iznos mora biti pozitivan ceo broj.", 400);
  try {
    if (body.osnov === "IZDAVANJE") {
      await izdavanjeDrugojZadruzi(id, { primalacZadrugaId: body.primalacZadrugaId, iznos, opis: body.opis });
    } else if (jeOsnovIzZapisa(body.osnov)) {
      await zapisIzZadruge(session.user.id, id, { osnov: body.osnov, pseudonim: body.pseudonim, iznos, opis: body.opis });
    } else {
      return await greska("Nepoznat osnov zapisa.", 400);
    }
    await logAdminAkcija(session.user.id, "ZADRUGA_ZAPIS", id, `${String(body.osnov)} ${iznos}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZadrugaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
