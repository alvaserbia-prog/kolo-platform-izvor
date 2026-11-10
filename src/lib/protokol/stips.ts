/**
 * Servisni ulaz za STIPS cenu (set 5.1.3). Re-eksportuje čista pravila (CLAUDE.md pravilo 9).
 * `cenaStipsZa` vraća cenu iz POSLEDNJEG biltena objavljenog pre zadatog trenutka u kome je
 * bar jedna pijaca objavila cenu za kategoriju, ili `null` (tada važi cenovnik davaoca).
 *
 * Bilteni se pronalaze sami (`pronadjiNoveBiltene`, cron `/api/cron/stips`), a dominantne cene
 * po pijaci unosi administratorski tim iz PDF-a (`sacuvajCeneBiltena`). 🔴 Prosek se ne čuva —
 * računa se iz redova `StipsCena` (`prosekStips`); uz ugovor ide snimak.
 */
export * from "@/lib/stips-pravila";
import type { StipsIzracun } from "@/lib/stips-pravila";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import {
  STIPS_BILTENI_URL,
  procitajSpisakBiltena,
  procitajPdfBiltena,
  cenaIzPijaca,
  procitajCenuPijace,
  type VrstaBiltena,
} from "@/lib/stips-bilten-pravila";

export async function cenaStipsZa(kategorija: string, preDatuma: Date): Promise<StipsIzracun | null> {
  const k = kategorija.trim();
  if (!k) return null;
  const bilten = await prisma.stipsBilten.findFirst({
    where: { datumObjave: { lte: preDatuma }, cene: { some: { kategorija: k, cena: { gt: 0 } } } },
    orderBy: [{ datumObjave: "desc" }, { pronadjenAt: "desc" }],
    include: { cene: { where: { kategorija: k, cena: { gt: 0 } } } },
  });
  if (!bilten || bilten.cene.length === 0) return null;
  const izracun = cenaIzPijaca(bilten.cene.map((c) => ({ pijaca: c.pijaca, cena: Number(c.cena) })));
  if (!izracun) return null;
  return {
    cena: izracun.cena,
    kategorija: k,
    jedinica: bilten.cene[0].jedinica,
    biltenId: bilten.id,
    biltenBroj: bilten.broj,
    biltenUrl: bilten.url,
    datumObjave: bilten.datumObjave,
    pijace: izracun.pijace,
  };
}

const TIMEOUT_MS = 15_000;

async function preuzmi(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": "KOLO-STIPS/1.0" } });
    if (!r.ok) {
      console.error("[stips] odgovor", r.status, url);
      return null;
    }
    return await r.text();
  } catch (e) {
    console.error("[stips] preuzimanje nije uspelo", url, e);
    return null;
  }
}

/**
 * Cron (`/api/cron/stips`): čita spisak biltena, za svaki bilten koji još nije upisan čita
 * stranicu i vezu na PDF i upisuje `StipsBilten`. Datum objave stranica ne nosi, pa se upisuje
 * dan pronalaska (administratorski tim ga može ispraviti). 🔴 Nikad ne baca — greška mreže se
 * beleži, a posao se ponavlja sledećeg dana.
 */
export async function pronadjiNoveBiltene(sada: Date = new Date()): Promise<{ pronadjeno: number; greska?: string }> {
  try {
    const html = await preuzmi(STIPS_BILTENI_URL);
    if (!html) return { pronadjeno: 0, greska: "spisak biltena nije dostupan" };
    const spisak = procitajSpisakBiltena(html);
    if (spisak.length === 0) return { pronadjeno: 0 };
    const postojeci = await prisma.stipsBilten.findMany({
      where: { OR: spisak.map((b) => ({ vrsta: b.vrsta, broj: b.broj })) },
      select: { vrsta: true, broj: true },
    });
    const ima = new Set(postojeci.map((b) => `${b.vrsta}|${b.broj}`));
    let pronadjeno = 0;
    for (const b of spisak) {
      if (ima.has(`${b.vrsta}|${b.broj}`)) continue;
      const stranica = await preuzmi(b.url);
      const pdfUrl = stranica ? procitajPdfBiltena(stranica) : null;
      try {
        await prisma.stipsBilten.create({
          data: { vrsta: b.vrsta, broj: b.broj, url: b.url, pdfUrl, datumObjave: sada },
        });
        pronadjeno++;
      } catch (e) {
        // Istovremeno pokretanje — jedinstven ključ (vrsta, broj) je već upisan.
        console.error("[stips] upis biltena", b.vrsta, b.broj, e);
      }
    }
    return { pronadjeno };
  } catch (e) {
    console.error("[stips] pronalaženje biltena nije uspelo", e);
    return { pronadjeno: 0, greska: e instanceof Error ? e.message : "greška" };
  }
}

/** Bilteni za administratorski tim, najnoviji prvi, sa brojem unetih cena. */
export async function listaBiltena() {
  const redovi = await prisma.stipsBilten.findMany({
    orderBy: [{ datumObjave: "desc" }, { pronadjenAt: "desc" }],
    take: 120,
    include: { _count: { select: { cene: true } } },
  });
  return redovi.map((b) => ({
    id: b.id,
    vrsta: b.vrsta as VrstaBiltena,
    broj: b.broj,
    datumObjave: b.datumObjave.toISOString(),
    url: b.url,
    pdfUrl: b.pdfUrl,
    brojCena: b._count.cene,
  }));
}

/** Bilten sa unetim cenama (tabela kategorija × pijaca). */
export async function biltenSaCenama(id: string) {
  const b = await prisma.stipsBilten.findUnique({ where: { id }, include: { cene: { orderBy: { kategorija: "asc" } } } });
  if (!b) return null;
  return {
    id: b.id,
    vrsta: b.vrsta as VrstaBiltena,
    broj: b.broj,
    datumObjave: b.datumObjave.toISOString(),
    url: b.url,
    pdfUrl: b.pdfUrl,
    cene: b.cene.map((c) => ({ kategorija: c.kategorija, jedinica: c.jedinica, pijaca: c.pijaca, cena: Number(c.cena) })),
  };
}

/** Kategorije za koje postoji bar jedna uneta cena — izbor uz prihvatanje prijave dobara. */
export async function kategorijeStips(): Promise<string[]> {
  const r = await prisma.stipsCena.findMany({ distinct: ["kategorija"], select: { kategorija: true }, orderBy: { kategorija: "asc" } });
  return r.map((x) => x.kategorija);
}

export class StipsGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

/**
 * Unos dominantnih cena jednog biltena (administratorski tim): za svaku kategoriju jedinica i
 * cene po pijaci; prazno = pijaca nije objavila cenu (red se briše). Datum objave se sme
 * ispraviti. Sve u jednoj transakciji.
 */
export async function sacuvajCeneBiltena(
  id: string,
  adminId: string,
  ulaz: { datumObjave?: unknown; kategorije: unknown },
) {
  const b = await prisma.stipsBilten.findUnique({ where: { id }, select: { id: true } });
  if (!b) throw new StipsGreska("Bilten nije pronađen.", 404);
  let datum: Date | null = null;
  if (typeof ulaz.datumObjave === "string" && ulaz.datumObjave) {
    datum = new Date(ulaz.datumObjave);
    if (Number.isNaN(datum.getTime()) || datum.getTime() > Date.now()) throw new StipsGreska("Datum objave nije ispravan.");
  }
  if (!Array.isArray(ulaz.kategorije)) throw new StipsGreska("Neispravan unos.");
  const upisi: { kategorija: string; jedinica: string; pijaca: string; cena: number }[] = [];
  const brisi: { kategorija: string; pijaca: string }[] = [];
  for (const red of ulaz.kategorije as { kategorija?: unknown; jedinica?: unknown; cene?: unknown }[]) {
    const kategorija = typeof red?.kategorija === "string" ? red.kategorija.trim().replace(/\s+/g, " ") : "";
    const jedinica = typeof red?.jedinica === "string" ? red.jedinica.trim() : "";
    if (kategorija.length < 2 || kategorija.length > 120) throw new StipsGreska("Upiši naziv kategorije kako je naveden u biltenu.");
    if (!jedinica || jedinica.length > 30) throw new StipsGreska(`Upiši jedinicu mere za kategoriju „${kategorija}”.`);
    const cene = red?.cene && typeof red.cene === "object" ? (red.cene as Record<string, unknown>) : {};
    for (const [pijaca, v] of Object.entries(cene)) {
      const p = procitajCenuPijace(v);
      if (!p.ok) throw new StipsGreska(`Cena za „${kategorija}”, ${pijaca} nije ispravna.`);
      if (p.cena == null) brisi.push({ kategorija, pijaca });
      else upisi.push({ kategorija, jedinica, pijaca, cena: p.cena });
    }
  }
  await prisma.$transaction(async (tx) => {
    if (datum) await tx.stipsBilten.update({ where: { id }, data: { datumObjave: datum } });
    for (const d of brisi) await tx.stipsCena.deleteMany({ where: { biltenId: id, kategorija: d.kategorija, pijaca: d.pijaca } });
    for (const u of upisi) {
      await tx.stipsCena.upsert({
        where: { biltenId_kategorija_pijaca: { biltenId: id, kategorija: u.kategorija, pijaca: u.pijaca } },
        create: { biltenId: id, ...u, uneoId: adminId },
        update: { jedinica: u.jedinica, cena: u.cena, uneoId: adminId, unetoAt: new Date() },
      });
    }
  });
  await logAdminAkcija(adminId, "STIPS_CENE_UNETE", id, `cena: ${upisi.length}, uklonjeno: ${brisi.length}`);
}
