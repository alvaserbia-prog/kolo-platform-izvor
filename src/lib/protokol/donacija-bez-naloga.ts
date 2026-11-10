/**
 * Donacija novca pravnog lica, preduzetnika ili gazdinstva čiji zastupnik nema nalog
 * (Pravilnik o pokroviteljstvu i donacijama čl. 17 st. 4 i čl. 25 st. 1; Pravilnik o
 * KOLO sistemu čl. 36 st. 5; set 5.1.2).
 *
 * Davalac daje donaciju po ugovoru o donaciji, bez upisa u evidenciju pokrovitelja.
 * Superadmin je unosi posle utvrđenja prijema: naziv, iznos i datum. Naziv i iznos idu
 * na rang-listu pokrovitelja, u deo novčanog doprinosa, uz oznaku da po toj donaciji
 * POEN nije evidentiran.
 *
 * 🔴 NIKAKAV POEN: ovaj modul ne uvozi `emitujPoen`, ne dira `Wallet` ni `Transaction`
 * i ne vezuje unos ni za jedan nalog. 🔴 Robu i usluge bez upisa Fondacija ne prima
 * (čl. 17 st. 4), pa ovde postoji samo novac. Brana: `__tests__/donacija-bez-naloga-izvor.test.ts`.
 */
import { prisma } from "@/lib/prisma";
import { logAdminAkcija } from "@/lib/audit";

export class DonacijaBezNalogaGreska extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const NAZIV_MAX = 200;

export type UnosDonacijeBezNaloga = { naziv: unknown; iznosRSD: unknown; datum: unknown };

/** Ručna provera unosa (bez zod-a). Vraća očišćene vrednosti ili baca grešku. */
export function proveriUnos(u: UnosDonacijeBezNaloga, sada: Date = new Date()): { naziv: string; iznosRSD: number; datum: Date } {
  const naziv = typeof u.naziv === "string" ? u.naziv.trim().replace(/\s+/g, " ") : "";
  if (naziv.length < 2 || naziv.length > NAZIV_MAX) throw new DonacijaBezNalogaGreska("Naziv davaoca je obavezan.");
  const iznosRSD = typeof u.iznosRSD === "number" ? Math.round(u.iznosRSD * 100) / 100 : NaN;
  if (!Number.isFinite(iznosRSD) || iznosRSD <= 0) throw new DonacijaBezNalogaGreska("Iznos mora biti veći od nule.");
  const datum = typeof u.datum === "string" ? new Date(u.datum) : new Date(NaN);
  if (Number.isNaN(datum.getTime())) throw new DonacijaBezNalogaGreska("Datum prijema je obavezan.");
  if (datum.getTime() > sada.getTime() + 24 * 3600 * 1000) throw new DonacijaBezNalogaGreska("Datum prijema ne može biti u budućnosti.");
  return { naziv, iznosRSD, datum };
}

/** Superadmin unosi donaciju posle utvrđenja prijema. Bez POEN-a. */
export async function unesiDonacijuBezNaloga(adminId: string, u: UnosDonacijeBezNaloga) {
  const { naziv, iznosRSD, datum } = proveriUnos(u);
  const red = await prisma.donacijaBezNaloga.create({
    data: { naziv, iznosRSD, datum, kreiraoId: adminId },
  });
  await logAdminAkcija(adminId, "DONACIJA_BEZ_NALOGA_UNETA", red.id, JSON.stringify({ naziv, iznosRSD }));
  return { ...red, iznosRSD: Number(red.iznosRSD) };
}

/** Unos povučen kao greška: red ostaje (istorija), ne prikazuje se i ne ulazi u zbir. */
export async function ukloniDonacijuBezNaloga(adminId: string, id: string) {
  const r = await prisma.donacijaBezNaloga.updateMany({ where: { id, uklonjenoAt: null }, data: { uklonjenoAt: new Date() } });
  if (r.count !== 1) throw new DonacijaBezNalogaGreska("Unos nije pronađen.", 404);
  await logAdminAkcija(adminId, "DONACIJA_BEZ_NALOGA_UKLONJENA", id, "");
}

/** Spisak za admin ekran (živi unosi, najnoviji prvi). */
export async function listaDonacijaBezNaloga() {
  const redovi = await prisma.donacijaBezNaloga.findMany({
    where: { uklonjenoAt: null },
    orderBy: [{ datum: "desc" }, { createdAt: "desc" }],
    select: { id: true, naziv: true, iznosRSD: true, datum: true, createdAt: true },
  });
  return redovi.map((r) => ({ ...r, iznosRSD: Number(r.iznosRSD) }));
}

/**
 * Redovi za rang-listu (čl. 25 st. 1): naziv i zbir iznosa po nazivu davaoca. Samo naziv
 * i iznos — bez datuma, unosioca i ijednog identifikatora lica (čl. 25 st. 2).
 */
export async function rangListaBezNaloga(): Promise<{ naziv: string; rsd: number }[]> {
  const grupe = await prisma.donacijaBezNaloga.groupBy({
    by: ["naziv"],
    where: { uklonjenoAt: null },
    _sum: { iznosRSD: true },
  });
  return grupe.map((g) => ({ naziv: g.naziv, rsd: Number(g._sum.iznosRSD ?? 0) }));
}
