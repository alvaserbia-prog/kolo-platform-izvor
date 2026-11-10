import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin, jeSuperadmin } from "@/lib/dozvole";
import {
  pregledZaAdmina,
  izvestajLanca,
  predloziObjekte,
  objaviPoziv,
  zatvoriPoziv,
  odluciOPrijavi,
  otvoriPartiju,
  upisiOdlukuLanca,
  potvrdiPredajuFondacija,
  utvrdiIzvrsenje,
  utvrdiIzdavanje,
  oznaciNeispravno,
  predajNepreuzeteUstanovi,
  odgovorNaGreskuLanca,
} from "@/lib/protokol/lanac";

/**
 * Program raspodele hrane i lanac (nabavke Glave X i XI) — admin kapija (operativa).
 *
 * GET  /api/admin/lanac                 → pozivi, prijave, lanci (sa dinarima — admin panel)
 * GET  /api/admin/lanac?izvestaj=<id>   → izveštaj o vrednosti u dinarima (čl. 37 st. 2, čl. 47)
 * GET  /api/admin/lanac?objekti=<id>    → predlog objekata po udaljenosti (čl. 39 st. 3)
 * POST /api/admin/lanac                 → { radnja, ... }
 *
 * 🔴 Odluku o lancu donosi UO (Faza 1), odnosno Gornje Kolo (Faza 2) van platforme; upis vrši
 * operativa i to SAMO superadmin (CLAUDE.md, U1-M5). Kapija „član UO" se ne uvodi.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  try {
    const izvestaj = req.nextUrl.searchParams.get("izvestaj");
    if (izvestaj) return NextResponse.json(await izvestajLanca(izvestaj));
    const objekti = req.nextUrl.searchParams.get("objekti");
    if (objekti) return NextResponse.json({ objekti: await predloziObjekte(objekti) });
    return NextResponse.json(await pregledZaAdmina());
  } catch (e) {
    return await odgovorNaGreskuLanca(e);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) return await greska("Pristup odbijen.", 403);
  const adminId = session.user.id;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof b.id === "string" ? b.id : "";
  try {
    switch (b.radnja) {
      case "poziv": {
        const p = await objaviPoziv(adminId, b);
        return NextResponse.json({ ok: true, id: p.id }, { status: 201 });
      }
      case "zatvori-poziv":
        await zatvoriPoziv(adminId, id);
        return NextResponse.json({ ok: true });
      case "prijava":
        await odluciOPrijavi(adminId, id, {
          prihvati: b.prihvati === true,
          razlog: typeof b.razlog === "string" ? b.razlog : "",
          zadrugaId: typeof b.zadrugaId === "string" && b.zadrugaId ? b.zadrugaId : null,
        });
        return NextResponse.json({ ok: true });
      case "partija": {
        const l = await otvoriPartiju(adminId, b);
        return NextResponse.json({ ok: true, id: l.id }, { status: 201 });
      }
      case "odluka": {
        if (!jeSuperadmin(session.user)) return await greska("Odluku o lancu upisuje samo superadmin.", 403);
        const l = await upisiOdlukuLanca(adminId, b);
        return NextResponse.json({ ok: true, id: l.id }, { status: 201 });
      }
      case "potvrdi-predaju":
        await potvrdiPredajuFondacija(adminId, id);
        return NextResponse.json({ ok: true });
      case "izvrsenje":
        await utvrdiIzvrsenje(adminId, id);
        return NextResponse.json({ ok: true });
      case "izdavanje":
        return NextResponse.json({ ok: true, ...(await utvrdiIzdavanje(adminId, id)) });
      case "neispravno":
        return NextResponse.json({ ok: true, ...(await oznaciNeispravno(adminId, id, typeof b.razlog === "string" ? b.razlog : "")) });
      case "ustanova":
        return NextResponse.json({ ok: true, ...(await predajNepreuzeteUstanovi(adminId, id, typeof b.napomena === "string" ? b.napomena : "")) });
      default:
        return await greska("Nepoznata radnja.", 400);
    }
  } catch (e) {
    return await odgovorNaGreskuLanca(e);
  }
}
