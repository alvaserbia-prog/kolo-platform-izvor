import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { sacuvajNaR2, obrisiSaR2, r2Konfigurisan, javnaBazaSkladista } from "@/lib/skladiste";
import {
  LOGOTIP_PREFIKS,
  proveriLogotip,
  prepoznajFormat,
  nastavakZa,
  jeNasLogotip,
} from "@/lib/logotip-pokrovitelja-pravila";

export * from "@/lib/logotip-pokrovitelja-pravila";

/**
 * Logotip pokrovitelja — servisni sloj (Pravilnik o pokroviteljstvu i donacijama
 * čl. 13 st. 4). Čista pravila su u `logotip-pokrovitelja-pravila.ts`.
 *
 * Tok: prijava (novcem ili dobrima i uslugama) šalje fajl na `/api/pokroviteljstvo/
 * logotip`, dobija javni URL i nosi ga u prijavi. Novčana prijava ga pri potvrdi
 * prenosi na red `Pokrovitelj` (najnoviji potvrđen logotip važi); ugovor o
 * pokroviteljstvu dobrima ga drži sam.
 *
 * Moderacija: administratorski tim logotip samo UKLANJA, uz obavezan razlog —
 * nikad ga ne menja niti postavlja umesto pokrovitelja.
 */

export class LogotipGreska extends Error {
  constructor(poruka: string, public status = 400) {
    super(poruka);
  }
}

/** Sačuvaj logotip na R2 i vrati javni URL. Baca `LogotipGreska`. */
export async function sacuvajLogotip(fajl: File): Promise<string> {
  const p = proveriLogotip({ tip: fajl.type, velicina: fajl.size });
  if (!p.ok) throw new LogotipGreska(p.razlog);
  if (!r2Konfigurisan()) throw new LogotipGreska("Skladište slika nije konfigurisano (Cloudflare R2).", 500);
  const bajtovi = Buffer.from(await fajl.arrayBuffer());
  // Stvarni format po sadržaju, ne po onome što je pretraživač prijavio.
  const format = prepoznajFormat(bajtovi);
  if (!format) throw new LogotipGreska("Logotip može biti JPG, PNG ili WebP.");
  return sacuvajNaR2(`${LOGOTIP_PREFIKS}${randomUUID()}.${nastavakZa(format)}`, bajtovi, format);
}

/**
 * URL logotipa iz prijave: prazno → `null`; naš URL → URL; sve drugo → greška.
 */
export function procitajLogoUrl(v: unknown): { ok: true; url: string | null } | { ok: false; razlog: string } {
  if (v === undefined || v === null || v === "") return { ok: true, url: null };
  if (jeNasLogotip(v, javnaBazaSkladista())) return { ok: true, url: v };
  return { ok: false, razlog: "Logotip nije ispravno priložen. Izaberi ga ponovo." };
}

export type IzvorLogotipa = "PRIJAVA" | "POKROVITELJ" | "UGOVOR_DOBRA" | "UPIS";

/**
 * Uklanjanje logotipa (moderacija). Logotip se skida SA SVIH mesta na kojima stoji
 * isti URL — prijava, red pokrovitelja i ugovor — jer bi inače prešao na rang-listu
 * pri sledećoj potvrdi ili ostao na vaučerima. Razlog ide u audit log i u
 * obaveštenje podnosiocu prijave.
 */
export async function ukloniLogotip(izvor: IzvorLogotipa, id: string, razlog: string, adminId: string) {
  const url =
    izvor === "PRIJAVA"
      ? (await prisma.pokroviteljPrijava.findUnique({ where: { id }, select: { logoUrl: true } }))?.logoUrl
      : izvor === "POKROVITELJ"
        ? (await prisma.pokrovitelj.findUnique({ where: { id }, select: { logoUrl: true } }))?.logoUrl
        : izvor === "UPIS"
          ? await (async () => {
              const u = await prisma.upisPokrovitelja.findUnique({ where: { id }, select: { logoUrl: true, izmenaLogoUrl: true } });
              return u?.izmenaLogoUrl ?? u?.logoUrl;
            })()
          : (await prisma.ugovorDobra.findUnique({ where: { id }, select: { logoUrl: true } }))?.logoUrl;
  if (!url) throw new LogotipGreska("Logotip nije pronađen.", 404);

  const [prijave, pokrovitelji, ugovori, upisi] = await Promise.all([
    prisma.pokroviteljPrijava.findMany({ where: { logoUrl: url }, select: { podnosilacId: true } }),
    prisma.pokrovitelj.findMany({ where: { logoUrl: url }, select: { vlasnikId: true } }),
    prisma.ugovorDobra.findMany({ where: { logoUrl: url }, select: { podnosilacId: true } }),
    prisma.upisPokrovitelja.findMany({
      where: { OR: [{ logoUrl: url }, { izmenaLogoUrl: url }] },
      select: { vlasnikUserId: true },
    }),
  ]);
  await prisma.$transaction([
    prisma.pokroviteljPrijava.updateMany({ where: { logoUrl: url }, data: { logoUrl: null } }),
    prisma.pokrovitelj.updateMany({ where: { logoUrl: url }, data: { logoUrl: null } }),
    prisma.ugovorDobra.updateMany({ where: { logoUrl: url }, data: { logoUrl: null } }),
    // Upis (čl. 6a): odobren logotip i logotip na ponovnoj proveri.
    prisma.upisPokrovitelja.updateMany({ where: { logoUrl: url }, data: { logoUrl: null } }),
    prisma.upisPokrovitelja.updateMany({ where: { izmenaLogoUrl: url }, data: { izmenaLogoUrl: null } }),
  ]);

  await logAdminAkcija(adminId, "POKROVITELJ_LOGOTIP_UKLONJEN", id, `${izvor}: ${razlog}`);
  const primaoci = new Set<string>([
    ...prijave.map((p) => p.podnosilacId),
    ...pokrovitelji.map((p) => p.vlasnikId),
    ...ugovori.map((u) => u.podnosilacId),
    ...upisi.map((u) => u.vlasnikUserId),
  ]);
  for (const userId of primaoci) {
    await obavesti(userId, {
      tip: "pokroviteljstvo_logotip_uklonjen",
      kljuc: "notifikacije.pokroviteljstvo_logotip_uklonjen",
      parametri: { razlog },
      naslov: "Logotip je uklonjen",
      tekst: `Fondacija je uklonila logotip iz evidencije pokrovitelja. Razlog: ${razlog}`,
      link: "/postani-pokrovitelj",
    });
  }
  await obrisiSaR2(url);
}
