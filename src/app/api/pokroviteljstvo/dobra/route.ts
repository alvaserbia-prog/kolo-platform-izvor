import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razresiNaselje, PORUKA_MESTO_IZ_SPISKA } from "@/lib/naselje";
import {
  procitajPredmetDobra,
  proveriDokaze,
  podnesiPrijavu,
  iskorisceniVauceriUpisa,
  odgovorNaGresku,
  type DokazUlaz,
} from "@/lib/protokol/pokroviteljstvo-dobrima";

/**
 * GET  /api/pokroviteljstvo/dobra?upisId= — ugovori o pokroviteljstvu dobrima i
 *      uslugama upisa koji vodi prijavljeni korisnik (stranica pokrovitelja), uz
 *      iskorišćene vaučere sa pseudonimom imaoca i pseudonimom onoga ko je potvrdio
 *      (nabavke čl. 34 st. 1–2).
 * POST /api/pokroviteljstvo/dobra — prijava (donacije čl. 28) iz ODOBRENOG upisa
 *      (čl. 18 st. 3), multipart: `upisId`, opis, broj vaučera, cena, mesto i adresa
 *      predaje, izjava o propisima + `cenovnik` (jedna ili više fotografija
 *      cenovnika). Podaci o davaocu se ovde NE primaju — snimak su upisa.
 *
 * 🔴 Stranica pokrovitelja ne dobija kodove vaučera ni bilo šta o imaocima osim
 * pseudonima uz iskorišćen vaučer — nikad id, ime ni mejl.
 * 🔴 Uz vrednost ugovora (dinari) se ovde ne vraća broj POEN-a.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const upisId = req.nextUrl.searchParams.get("upisId") ?? "";
  const upis = upisId
    ? await prisma.upisPokrovitelja.findUnique({ where: { id: upisId }, select: { vlasnikUserId: true } })
    : null;
  // Ugovore vidi samo korisnik koji vodi upis — zaposleni ih ne vidi (čl. 32 st. 3).
  if (!upis || upis.vlasnikUserId !== session.user.id) return await greska("Upis nije pronađen.", 404);

  const ugovori = await prisma.ugovorDobra.findMany({
    where: { upisId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, naziv: true, vrsta: true, opis: true, brojVaucera: true, vrednostRsd: true, podnosilacId: true,
      mesto: true, adresaPredaje: true, logoUrl: true, status: true, odbijenoRazlog: true, ugovorTekst: true, potpisanoAt: true,
      kontrolniBroj: true, vaziDo: true, createdAt: true, potpisKodIstice: true,
    },
  });
  const ids = ugovori.map((u) => u.id);
  const [stanja, iskorisceni] = await Promise.all([
    prisma.vaucer.groupBy({
      by: ["ugovorId", "status"],
      where: { ugovorId: { in: ids } },
      _count: { _all: true },
    }),
    iskorisceniVauceriUpisa(upisId),
  ]);

  return NextResponse.json({
    ugovori: ugovori.map(({ podnosilacId, ...u }) => {
      const broj = (s: string) =>
        stanja.find((x) => x.ugovorId === u.id && x.status === s)?._count._all ?? 0;
      return {
        ...u,
        // Potpisuje samo podnosilac prijave (čl. 32 st. 1).
        mojPotpis: podnosilacId === session.user.id,
        vrednostRsd: Number(u.vrednostRsd),
        potpisanoAt: u.potpisanoAt?.toISOString() ?? null,
        vaziDo: u.vaziDo?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        potpisKodIstice: u.potpisKodIstice?.toISOString() ?? null,
        vauceri: {
          slobodno: broj("SLOBODAN"),
          dodeljeno: broj("DODELJEN"),
          iskorisceno: broj("ISKORISCEN"),
          isteklo: broj("ISTEKAO") + broj("NEIZVRSEN"),
        },
      };
    }),
    iskorisceni,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  if (!session.user.verified)
    return await greska("Samo verifikovani korisnici mogu pokrenuti pokroviteljstvo.", 403);

  const fd = await req.formData().catch(() => null);
  if (!fd) return await greska("Neispravan zahtev.", 400);

  const polja: Record<string, unknown> = {};
  for (const k of ["vrsta", "opis", "brojVaucera", "cenaPoJedinici", "adresaPredaje", "izjavaPropisi"]) {
    const v = fd.get(k);
    if (typeof v === "string") polja[k] = v;
  }
  const upisId = fd.get("upisId");
  if (typeof upisId !== "string" || !upisId) return await greska("Prijava se podnosi iz upisa pokrovitelja u evidenciju.", 400);
  const provera = procitajPredmetDobra(polja);
  if (!provera.ok) return await greska(provera.razlog, 400);

  const mesto = razresiNaselje(fd.get("mesto"));
  if (!mesto) return await greska(PORUKA_MESTO_IZ_SPISKA, 400);

  // Dokaz cene je SAMO fotografija cenovnika (čl. 28 st. 2 t. 4), za firmu i gazdinstvo.
  const fajlovi: File[] = [];
  for (const f of fd.getAll("cenovnik")) if (f instanceof File && f.size > 0) fajlovi.push(f);
  const dokaz = proveriDokaze(fajlovi.map((f) => ({ vrsta: "CENOVNIK" as const, tip: f.type, velicina: f.size })));
  if (!dokaz.ok) return await greska(dokaz.razlog, 400);

  const dokazi: DokazUlaz[] = [];
  for (const f of fajlovi) {
    dokazi.push({
      vrsta: "CENOVNIK",
      nazivFajla: f.name || "cenovnik",
      contentType: f.type,
      sadrzaj: Buffer.from(await f.arrayBuffer()),
    });
  }

  try {
    const u = await podnesiPrijavu(session.user.id, upisId, provera.podaci, mesto, dokazi);
    return NextResponse.json({ ok: true, id: u.id }, { status: 201 });
  } catch (e) {
    return await odgovorNaGresku(e);
  }
}
