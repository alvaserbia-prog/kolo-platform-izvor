import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeSuperadmin } from "@/lib/dozvole";
import { razresiNaselje, PORUKA_MESTO_IZ_SPISKA } from "@/lib/naselje";
import { procitajLogoUrl } from "@/lib/protokol/logotip-pokrovitelja";
import {
  pripremiPokroviteljstvo,
  listaPripremaZaAdmina,
  odgovorNaGreskuPripreme,
  type PrijavaUPripremi,
} from "@/lib/protokol/priprema-pokroviteljstva";

/**
 * GET  /api/admin/pokroviteljstvo/priprema — pripremljeni upisi i prijave (čekaju i prihvaćeni).
 * POST /api/admin/pokroviteljstvo/priprema — Fondacija na zahtev pokrovitelja priprema upis i,
 *      po želji, prijavu (donacije čl. 16 st. 6, set 5.1.2), multipart: `korisnik` (pseudonim ili
 *      mejl naloga lica iz upisa), `upis` (JSON polja upisa), `mapaMesto`, `logoUrl`,
 *      `aprUporedjeno`, `vrstaPrijave` (NOVAC | DOBRA | prazno), `vrednostRsd` ili polja
 *      predmeta dobara (`predmet`, JSON, sa podacima o hrani) uz `mestoPredaje`/`adresaPredaje`,
 *      dodatna mesta (`dodatnoMesto`/`dodatnaAdresa`), tačke svih mesta (`tackaLat`/`tackaLng`)
 *      i `cenovnik` (fotografije). Uz `postojeciUpisId` priprema se samo prijava iz postojećeg
 *      živog upisa (tada se `korisnik`, `upis` i mapa ne čitaju — prihvata lice koje vodi upis).
 *
 * 🔴 Samo superadmin. Pripremljeno nije upis ni prijava: nastaju tek kad ih lice iz upisa
 * prihvati sa sopstvenog naloga; lice koje priprema ne zastupa pokrovitelja i ne dobija POEN.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  return NextResponse.json({ pripreme: await listaPripremaZaAdmina() });
}

function json(v: FormDataEntryValue | null): Record<string, unknown> | null {
  if (typeof v !== "string" || !v) return null;
  try {
    const o = JSON.parse(v);
    return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user)) return await greska("Pristup odbijen.", 403);
  const fd = await req.formData().catch(() => null);
  if (!fd) return await greska("Neispravan zahtev.", 400);

  const postojeciUpisId = typeof fd.get("postojeciUpisId") === "string" ? String(fd.get("postojeciUpisId")).trim() || null : null;
  const upis = json(fd.get("upis"));
  if (!upis && !postojeciUpisId) return await greska("Nedostaju podaci upisa.", 400);
  const logo = procitajLogoUrl(fd.get("logoUrl") || null);
  if (!logo.ok) return await greska(logo.razlog, 400);

  let prijava: PrijavaUPripremi | null = null;
  const vrsta = fd.get("vrstaPrijave");
  if (vrsta === "NOVAC") {
    prijava = { vrsta: "NOVAC", vrednostRsd: Number(fd.get("vrednostRsd")) };
  } else if (vrsta === "DOBRA") {
    const polja = json(fd.get("predmet"));
    if (!polja) return await greska("Nedostaju podaci prijave dobara.", 400);
    const mestoPredaje = razresiNaselje(fd.get("mestoPredaje"));
    if (!mestoPredaje) return await greska(PORUKA_MESTO_IZ_SPISKA, 400);
    const cenovnici: { nazivFajla: string; contentType: string; sadrzaj: Buffer }[] = [];
    for (const f of fd.getAll("cenovnik")) {
      if (f instanceof File && f.size > 0)
        cenovnici.push({ nazivFajla: f.name || "cenovnik", contentType: f.type, sadrzaj: Buffer.from(await f.arrayBuffer()) });
    }
    // Više mesta predaje (set 5.0.6) i tačke mesta — isto kao u prijavi koju lice samo podnosi.
    const dodatnaMesta = fd.getAll("dodatnoMesto");
    const dodatneAdrese = fd.getAll("dodatnaAdresa");
    const dodatna: { mesto: string; adresa: unknown }[] = [];
    for (let i = 0; i < dodatnaMesta.length; i++) {
      const m = razresiNaselje(dodatnaMesta[i]);
      if (!m) return await greska(PORUKA_MESTO_IZ_SPISKA, 400);
      dodatna.push({ mesto: m, adresa: dodatneAdrese[i] });
    }
    const tackeLat = fd.getAll("tackaLat");
    const tackeLng = fd.getAll("tackaLng");
    const adresaPredaje = fd.get("adresaPredaje");
    prijava = {
      vrsta: "DOBRA",
      polja: {
        ...polja,
        ...(typeof adresaPredaje === "string" ? { adresaPredaje } : {}),
        dodatnaMestaPredaje: dodatna,
        tackePredaje: tackeLat.map((lat, i) => ({ lat, lng: tackeLng[i] })),
      },
      mestoPredaje,
      cenovnici,
    };
  }

  try {
    const r = await pripremiPokroviteljstvo(session.user.id, {
      korisnik: String(fd.get("korisnik") ?? ""),
      postojeciUpisId,
      upis,
      mapaMesto: razresiNaselje(fd.get("mapaMesto")),
      logoUrl: logo.url,
      aprUporedjeno: fd.get("aprUporedjeno") === "true",
      prijava,
    });
    return NextResponse.json({ ok: true, id: r.id }, { status: 201 });
  } catch (e) {
    return await odgovorNaGreskuPripreme(e);
  }
}
