/**
 * Spisak za poziv — „Želim da me neko nazove" (dokaz stvarnosti čl. 8–12;
 * set 4.8.3). Putanja ostaje iz seta 4.8.1 (CLAUDE.md pravilo 12).
 *
 * GET    — član Kola: spisak (bez imena i brojeva telefona; zahteve radi potvrde
 *          samo čuvar); korisnik: sopstveni upis i osnovi van zahteva; član bez
 *          potvrde: sopstveni zahtev radi potvrde, uslovi iz čl. 16 st. 1 i da li je
 *          upisao ZRNO (plutajuća kartica); dete: 403.
 * POST   — korisnik ulazi na spisak ili menja upis (telo nosi `osnov`); član bez
 *          potvrde sa osnovom POTVRDA.
 * DELETE — povlačenje pristanka.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { greska } from "@/lib/greska-api";
import { ucitajStatus, jePotvrdjen } from "@/lib/protokol/status";
import {
  dataPoverljivostPoziva,
  jeOsnovSpiska,
  mojZahtev,
  osnoviZaSpisak,
  posaljiZahtev,
  povuciZahtev,
  smeNaSpisak,
  smeNaSpisakRadiPotvrde,
  spisakZaPoziv,
  upisaoZrno,
  uslovRazgovoraRadiPotvrde,
  ZahtevGreska,
} from "@/lib/protokol/zahtev-razgovor";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const status = await ucitajStatus(session.user.id);
  if (!status) return await greska("Nije prijavljen.", 401);
  try {
    if (jePotvrdjen(status)) {
      const [zahtevi, poverljivost] = await Promise.all([
        spisakZaPoziv(session.user.id),
        dataPoverljivostPoziva(session.user.id),
      ]);
      return NextResponse.json({ clanKola: true, zahtevi, poverljivostData: poverljivost });
    }
    if (smeNaSpisak(status)) {
      const [moj, osnovi] = await Promise.all([mojZahtev(session.user.id), osnoviZaSpisak(session.user.id)]);
      return NextResponse.json({ clanKola: false, moj, osnovi });
    }
    if (smeNaSpisakRadiPotvrde(status)) {
      const [moj, uslov, zrno] = await Promise.all([
        mojZahtev(session.user.id),
        uslovRazgovoraRadiPotvrde(session.user.id),
        upisaoZrno(session.user.id),
      ]);
      return NextResponse.json({ clanKola: false, radiPotvrde: true, moj, uslovOk: uslov.ok, upisaoZrno: zrno });
    }
    return await greska("Spisak za poziv vide samo članovi Kola.", 403);
  } catch (e) {
    if (e instanceof ZahtevGreska) return await greska(e.message, e.status);
    console.error("[GET /api/zahtev-razgovor]", e);
    return await greska("Greška.", 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const body = await req.json().catch(() => ({}));
  const osnov = body.osnov === undefined || body.osnov === null ? "ZAHTEV" : body.osnov;
  if (!jeOsnovSpiska(osnov)) return await greska("Nepoznat osnov.", 400);
  try {
    await posaljiZahtev(session.user.id, {
      osnov,
      imePrezime: typeof body.imePrezime === "string" ? body.imePrezime : "",
      mesto: body.mesto,
      opis: typeof body.opis === "string" ? body.opis : "",
      dostupnost: typeof body.dostupnost === "string" ? body.dostupnost : "",
      telefon: typeof body.telefon === "string" ? body.telefon : "",
      pristanak: body.pristanak === true,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZahtevGreska) return await greska(e.message, e.status);
    console.error("[POST /api/zahtev-razgovor]", e);
    return await greska("Greška.", 500);
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  await povuciZahtev(session.user.id);
  return NextResponse.json({ ok: true });
}
