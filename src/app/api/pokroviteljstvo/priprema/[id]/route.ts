import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prevedi } from "@/lib/prevod-servera";
import { jePravniOblik } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { kljuceviIzjavaUpisa } from "@/lib/upis-pokrovitelja-pravila";
import {
  pripremaZaKorisnika,
  prihvatiPripremu,
  odbijPripremu,
  odgovorNaGreskuPripreme,
} from "@/lib/protokol/priprema-pokroviteljstva";

/**
 * POST /api/pokroviteljstvo/priprema/[id] — lice iz upisa, sa sopstvenog naloga, prihvata
 * (`akcija: "prihvati"`, uz izjave iz čl. 17) ili odbija (`akcija: "odbij"`) upis i prijavu koje
 * je pripremila Fondacija (donacije čl. 16 st. 6, čl. 17 st. 4; set 5.1.2). Prihvatanjem
 * nastaju upis i prijava kao da ih je samo podnelo; odbijanjem se pripremljeno briše.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    if (body.akcija === "odbij") {
      await odbijPripremu(id, session.user.id);
      return NextResponse.json({ ok: true });
    }
    if (body.akcija !== "prihvati") return await greska("Neispravan zahtev.", 400);
    const p = await pripremaZaKorisnika(id, session.user.id);
    if (!p) return await greska("Pripremljen upis nije pronađen.", 404);
    // Tekst potvrde o evidentiranju (čl. 17 st. 2–3) — sklopljen na serveru iz istog ključa
    // iz kog ga ekran prikazuje, i snima se uz upis.
    const oblik = p.upis.vrsta !== "GAZDINSTVO" && jePravniOblik(p.upis.pravniOblik) ? p.upis.pravniOblik : null;
    const potvrdaTekst = prevedi(await getLocale(), `postaniPokrovitelj.${kljuceviIzjavaUpisa(oblik).potvrda}`);
    const r = await prihvatiPripremu(
      id,
      session.user.id,
      {
        izjavaAdresa: body.izjavaAdresa,
        izjavaOvlascenja: body.izjavaOvlascenja,
        potvrdaEvidentiranja: body.potvrdaEvidentiranja,
        izjavaPropisi: body.izjavaPropisi,
        izjavaPodataka: body.izjavaPodataka,
      },
      potvrdaTekst,
    );
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return await odgovorNaGreskuPripreme(e);
  }
}
