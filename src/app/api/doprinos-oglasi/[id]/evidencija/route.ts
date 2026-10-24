import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { imaFunkcionalniPristup } from "@/lib/protokol/pristup";
import { sacuvajNaR2, r2Konfigurisan } from "@/lib/skladiste";

const DOKAZ_MAX_SIZE = 5 * 1024 * 1024; // 5MB, isto kao slike na Pijaci
const DOKAZ_TIPOVI = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// POST /api/doprinos-oglasi/[id]/evidencija — unos dnevnog izvršenja.
// Prima multipart/form-data (dokaz = screenshot koji ide na R2) ili JSON
// (legacy, dokaz kao tekstualni link).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije autorizovano.", 401);
  if (!(await imaFunkcionalniPristup(session.user.id)))
    return await greska("Potrebno je da te neko potvrdi u lancu potvrda.", 403);

  const { id: oglasId } = await params;

  let date: unknown, predlozeniPoen: unknown, description: unknown, dokaz: unknown;
  let dokazSlika: File | null = null;
  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    if (!fd) return await greska("Neispravan zahtev.", 400);
    date = fd.get("date");
    predlozeniPoen = fd.get("predlozeniPoen");
    description = fd.get("description");
    const f = fd.get("dokazSlika");
    if (f instanceof File && f.size > 0) dokazSlika = f;
  } else {
    const body = await req.json().catch(() => ({}));
    ({ date, predlozeniPoen, description, dokaz } = body);
  }

  if (dokazSlika) {
    if (dokazSlika.size > DOKAZ_MAX_SIZE)
      return await greska("Screenshot dokaza može biti najviše 5MB.", 400);
    if (!DOKAZ_TIPOVI.includes(dokazSlika.type))
      return await greska("Dozvoljeni formati dokaza: JPG, PNG, WebP.", 400);
    if (!r2Konfigurisan())
      return await greska("Skladište slika nije konfigurisano — dokaz trenutno nije moguće priložiti.", 503);
  }

  // Validacije
  if (!date || !predlozeniPoen || !description) return await greska("Nedostaju podaci.", 400);
  const predlozeni = Number(predlozeniPoen);
  if (!Number.isInteger(predlozeni) || predlozeni < 1) return await greska("Predloženi POEN mora biti pozitivan ceo broj.", 400);
  if (typeof description !== "string" || description.trim().length < 10) return await greska("Opis mora imati najmanje 10 znakova.", 400);

  // Datum — max 3 dana unazad
  const datumEv = new Date(String(date));
  datumEv.setHours(0, 0, 0, 0);
  const danas = new Date(); danas.setHours(0, 0, 0, 0);
  const razlikaMs = danas.getTime() - datumEv.getTime();
  const razlikaDana = Math.floor(razlikaMs / (1000 * 60 * 60 * 24));
  if (razlikaDana < 0 || razlikaDana > 3) return await greska("Evidencija moguća max 3 dana unazad.", 400);

  // Oglas i primljena prijava
  const oglas = await prisma.doprinosOglas.findUnique({ where: { id: oglasId } });
  if (!oglas || oglas.status !== "ACTIVE") return await greska("Zadatak nije aktivan.", 400);

  // Predloženi POEN pojedinačnog dnevnog izvršenja ne sme premašiti predloženi POEN
  // celog zadatka. Osnov je čl. 11 (raspodela predloženog POEN-a po dnevnim
  // izvršenjima), a NE raniji čl. 26 — gornja granica je brisana setom 4.4.4, jer
  // se pozivala na odluku UO koja nikad nije doneta.
  //
  // Granica od 10.000.000 nije iz akta: to je brava na unos, protiv omaške u
  // kucanju. Zadatak sa predlozeniPoen = 0 nema drugog ograničenja.
  if (predlozeni > 10_000_000)
    return await greska("Predloženi POEN dnevnog izvršenja ne može preći 10.000.000.", 400);
  if (oglas.predlozeniPoen > 0 && predlozeni > oglas.predlozeniPoen)
    return await greska(`Predloženi POEN dnevnog izvršenja ne može preći ${oglas.predlozeniPoen.toLocaleString("sr-RS")} (maksimalni POEN zadatka).`, 400);

  const prijava = await prisma.oglasPrijava.findUnique({
    where: { oglasId_userId: { oglasId, userId: session.user.id } },
  });
  if (!prijava || prijava.status !== "APPROVED") return await greska("Vaša prijava za ovaj zadatak nije primljena.", 403);

  // Provera duplikata za isti dan
  const postoji = await prisma.oglasEvidencija.findUnique({
    where: { userId_oglasId_date: { userId: session.user.id, oglasId, date: datumEv } },
  });
  if (postoji) return await greska("Evidencija za taj dan je već uneta.", 400);

  // Kumulativni predloženi POEN svih dnevnih izvršenja (osim odbijenih) ne sme preći
  // predloženi POEN zadatka (čl. 11 — raspodela predloženog POEN-a po dnevnim izvršenjima).
  // Zadatak sa predlozeniPoen = 0 nema kumulativno ograničenje.
  if (oglas.predlozeniPoen > 0) {
    const agg = await prisma.oglasEvidencija.aggregate({
      where: { userId: session.user.id, oglasId, status: { not: "REJECTED" } },
      _sum: { predlozeniPoen: true },
    });
    const dosadasnji = agg._sum.predlozeniPoen ?? 0;
    if (dosadasnji + predlozeni > oglas.predlozeniPoen)
      return await greska(`Zbir predloženog POENA po dnevnim izvršenjima (${(dosadasnji + predlozeni).toLocaleString("sr-RS")}) prelazi maksimalni POEN zadatka (${oglas.predlozeniPoen.toLocaleString("sr-RS")}).`, 400);
  }

  // Dokaz: screenshot → R2 (javni URL u bazu), ili legacy tekstualni link.
  let dokazUrl: string | null = typeof dokaz === "string" && dokaz.trim() ? dokaz.trim() : null;
  if (dokazSlika) {
    const ext = dokazSlika.type === "image/png" ? ".png" : dokazSlika.type === "image/webp" ? ".webp" : ".jpg";
    const buffer = Buffer.from(await dokazSlika.arrayBuffer());
    dokazUrl = await sacuvajNaR2(`dokazi/${oglasId}/${randomUUID()}${ext}`, buffer, dokazSlika.type);
  }

  await prisma.oglasEvidencija.create({
    data: {
      userId: session.user.id,
      oglasId,
      prijavaId: prijava.id,
      date: datumEv,
      predlozeniPoen: predlozeni,
      dokaz: dokazUrl,
      description: description.trim(),
    },
  });

  void posaljiAdminAlert(
    "Novo dnevno izvršenje (operativni doprinos)",
    `Zadatak: ${oglas.title}\nKorisnik: ${session.user.pseudonim}\nPredloženi POEN: ${predlozeni.toLocaleString("sr-RS")}`
  );

  return NextResponse.json({ ok: true, predlozeniPoen: predlozeni });
}
