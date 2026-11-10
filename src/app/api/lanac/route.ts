import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { getLocale } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prevedi } from "@/lib/prevod-servera";
import {
  javnePartije,
  mojiVauceriLanca,
  mojRadULancu,
  uzmiVaucerLanca,
  povuciPristanakLanca,
  prijaviNaPoziv,
  povuciPrijavu,
  prihvatiUgovor,
  prijaviIzvrsenje,
  zabeleziPredaju,
  potvrdiPredaju,
  oznaciSpremno,
  preuzmiNepreuzeteDelove,
  proveriKodLanca,
  potvrdiPreuzimanje,
  odgovorNaGreskuLanca,
} from "@/lib/protokol/lanac";

/**
 * Program raspodele hrane i lanac proizvodnje i distribucije (nabavke Glave X i XI) — ruta
 * korisnika.
 *
 * GET  /api/lanac          → partije (javni podaci po čl. 47) i „Moji vaučeri"
 * GET  /api/lanac?rad=1    → radni ekran gazdinstva, objekta, odnosno partnera
 * POST /api/lanac          → { radnja, ... }
 *
 * 🔴 Uz broj POEN-a po vaučeru ruta NIKAD ne vraća dinarsku vrednost (čl. 43 st. 2, čl. 47).
 * Tekstovi izjava i pristanka sklapaju se OVDE, iz ključa iz kog ih ekran prikazuje, na jeziku
 * prikaza — tekst koji pošalje pretraživač ne bi ništa dokazivao.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  try {
    if (req.nextUrl.searchParams.get("rad") === "1") return NextResponse.json(await mojRadULancu(session.user.id));
    const [partije, moji] = await Promise.all([javnePartije(session.user.id), mojiVauceriLanca(session.user.id)]);
    return NextResponse.json({ partije, moji });
  } catch (e) {
    return await odgovorNaGreskuLanca(e);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const ja = session.user.id;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = typeof b.id === "string" ? b.id : "";
  const jezik = await getLocale();
  try {
    switch (b.radnja) {
      case "uzmi": {
        const r = await uzmiVaucerLanca(
          ja,
          id,
          { izjavaNepovezan: b.izjavaNepovezan === true, pristanakPrikaz: b.pristanakPrikaz === true },
          prevedi(jezik, "lanac.pristanak_prikaz"),
        );
        return NextResponse.json({ ok: true, poen: r.poen }, { status: 201 });
      }
      case "povuci-pristanak":
        await povuciPristanakLanca(ja, id);
        return NextResponse.json({ ok: true });
      case "prijava": {
        const uloga = b.uloga === "OBJEKAT" ? "OBJEKAT" : b.uloga === "GAZDINSTVO" ? "GAZDINSTVO" : null;
        if (!uloga) return await greska("Izaberi da li prijavljuješ gazdinstvo ili objekat.", 400);
        const tekst = prevedi(jezik, uloga === "GAZDINSTVO" ? "lanac.izjava_gazdinstvo" : "lanac.izjava_objekat");
        const p = await prijaviNaPoziv(ja, id, uloga, b, tekst);
        return NextResponse.json({ ok: true, id: p.id }, { status: 201 });
      }
      case "povuci-prijavu":
        await povuciPrijavu(ja, id);
        return NextResponse.json({ ok: true });
      case "prihvati-ugovor":
        await prihvatiUgovor(ja, id);
        return NextResponse.json({ ok: true });
      case "izvrseno":
        await prijaviIzvrsenje(ja, id);
        return NextResponse.json({ ok: true });
      case "predaja": {
        const p = await zabeleziPredaju(ja, id, b);
        return NextResponse.json({ ok: true, id: p.id }, { status: 201 });
      }
      case "potvrdi-predaju":
        await potvrdiPredaju(ja, id);
        return NextResponse.json({ ok: true });
      case "spremno":
        await oznaciSpremno(ja, id);
        return NextResponse.json({ ok: true });
      case "nepreuzeti": {
        const r = await preuzmiNepreuzeteDelove(ja, id);
        return NextResponse.json({ ok: true, delova: r.delovaPreuzeto, ostaje: r.delovaOstaje, istekli: r.istekliPreuzeto });
      }
      case "proveri-kod":
        return NextResponse.json(await proveriKodLanca(ja, String(b.kod ?? "")));
      case "potvrdi-preuzimanje": {
        const r = await potvrdiPreuzimanje(ja, String(b.kod ?? ""));
        return NextResponse.json({ ok: true, naziv: r.naziv });
      }
      default:
        return await greska("Nepoznata radnja.", 400);
    }
  } catch (e) {
    return await odgovorNaGreskuLanca(e);
  }
}
