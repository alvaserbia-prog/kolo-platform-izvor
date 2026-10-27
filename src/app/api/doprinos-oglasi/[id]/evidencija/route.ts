import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { imaFunkcionalniPristup } from "@/lib/protokol/pristup";
import { sacuvajNaR2, r2Konfigurisan } from "@/lib/skladiste";
import { proveriIzvrsenjeCelina } from "@/lib/operativni-celine-pravila";
import { zivaPrijava } from "@/lib/protokol/operativni-postupak";

const DOKAZ_MAX_SIZE = 5 * 1024 * 1024; // 5MB, isto kao slike na Pijaci
const DOKAZ_TIPOVI = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// POST /api/doprinos-oglasi/[id]/evidencija — unos izvršenja (po celinama, čl. 15).
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

  let date: unknown, predlozeniPoen: unknown, celina: unknown, description: unknown, dokaz: unknown;
  let dokazSlika: File | null = null;
  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const fd = await req.formData().catch(() => null);
    if (!fd) return await greska("Neispravan zahtev.", 400);
    date = fd.get("date");
    predlozeniPoen = fd.get("predlozeniPoen");
    celina = fd.get("celina");
    description = fd.get("description");
    const f = fd.get("dokazSlika");
    if (f instanceof File && f.size > 0) dokazSlika = f;
  } else {
    const body = await req.json().catch(() => ({}));
    ({ date, predlozeniPoen, celina, description, dokaz } = body);
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
  if (!date || !description) return await greska("Nedostaju podaci.", 400);
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

  // Živa primljena prijava (čl. 11): ne posle odustanka (čl. 17) ni posle prijave
  // završetka (čl. 16) — tada se o ostatku izjašnjava završnom potvrdom.
  const prijava = await zivaPrijava(oglasId, session.user.id);
  if (!prijava || prijava.status !== "APPROVED") return await greska("Vaša prijava za ovaj zadatak nije primljena.", 403);
  if (prijava.zavrsetakAt) return await greska("Završetak je prijavljen; o ostatku se odlučuje završnom potvrdom (čl. 16).", 400);

  // Dokaz se podnosi jednom za obračunski period (čl. 15 st. 1).
  const postoji = await prisma.oglasEvidencija.findUnique({
    where: { userId_oglasId_date_zavrsna: { userId: session.user.id, oglasId, date: datumEv, zavrsna: false } },
  });
  if (postoji) return await greska("Evidencija za taj dan je već uneta.", 400);

  // Predloženi POEN zapisa (čl. 15 st. 1; S1). Zadatak sa celinama: izvršilac navodi samo
  // broj izvršenih celina, a iznos je broj celina × POEN po celini utvrđen uz
  // zadatak — izvršilac ga ne određuje. Zatečen zadatak bez celina (brojCelina =
  // NULL) radi po starom pravilu dok se ne zatvori: izvršilac predlaže iznos, uz
  // granice zadatka.
  let predlozeni: number;
  let brojIzvrsenihCelina: number | null = null;
  if (oglas.brojCelina != null) {
    const agg = await prisma.oglasEvidencija.aggregate({
      where: { userId: session.user.id, oglasId, status: { not: "REJECTED" } },
      _sum: { celina: true },
    });
    const r = proveriIzvrsenjeCelina({
      celina,
      brojCelinaZadatka: oglas.brojCelina,
      predlozeniPoenZadatka: oglas.predlozeniPoen,
      dosadasnjeCeline: agg._sum.celina ?? 0,
    });
    if (!r.ok) return await greska(r.greska, 400);
    predlozeni = r.predlozeniPoen;
    brojIzvrsenihCelina = r.celina;
  } else {
    predlozeni = Number(predlozeniPoen);
    if (!Number.isInteger(predlozeni) || predlozeni < 1) return await greska("Predloženi POEN mora biti pozitivan ceo broj.", 400);
    // Granica od 10.000.000 nije iz akta: brava na unos, protiv omaške u kucanju.
    if (predlozeni > 10_000_000)
      return await greska("Predloženi POEN dnevnog izvršenja ne može preći 10.000.000.", 400);
    if (oglas.predlozeniPoen > 0) {
      const agg = await prisma.oglasEvidencija.aggregate({
        where: { userId: session.user.id, oglasId, status: { not: "REJECTED" } },
        _sum: { predlozeniPoen: true },
      });
      const dosadasnji = agg._sum.predlozeniPoen ?? 0;
      if (dosadasnji + predlozeni > oglas.predlozeniPoen)
        return await greska(`Zbir predloženog POENA po dnevnim izvršenjima (${(dosadasnji + predlozeni).toLocaleString("sr-RS")}) prelazi maksimalni POEN zadatka (${oglas.predlozeniPoen.toLocaleString("sr-RS")}).`, 400);
    }
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
      celina: brojIzvrsenihCelina,
      dokaz: dokazUrl,
      description: description.trim(),
    },
  });

  void posaljiAdminAlert(
    "Novo izvršenje (operativni doprinos)",
    `Zadatak: ${oglas.title}\nKorisnik: ${session.user.pseudonim}\nPredloženi POEN: ${predlozeni.toLocaleString("sr-RS")}`
  );

  return NextResponse.json({ ok: true, predlozeniPoen: predlozeni });
}
