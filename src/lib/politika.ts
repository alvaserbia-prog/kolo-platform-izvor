import { prisma } from "@/lib/prisma";
import { PRISTANAK_NA_AKTE_TRAZI_SE } from "@/lib/moduli";

/**
 * Da li korisniku treba pristanak na akte (Uslovi čl. 40, Politika čl. 16).
 *
 * 🔴 JEDAN izvor istine za DVA mesta: `/api/me` (odatle `AppShell` zna da li da
 * prikaže ekran) i `GET /api/politika/prihvati` (odatle sam ekran zna šta da
 * prikaže). Ranije je svako mesto imalo svoj upit — isti po tekstu, ali ništa
 * nije garantovalo isti odgovor. Kad bi se razišli, korisnik bi video kako mu
 * kartica „Sistem je unapređen" bljesne i odmah nestane: shell je tvrdio da
 * pristanak nedostaje, a ekran je od servera dobijao da je sve u redu.
 *
 * Redosled je namerno određen do kraja (`efektivnaOd`, pa `createdAt`, pa `id`):
 * `orderBy` samo po `efektivnaOd` je neodređen kad dve verzije dele isti
 * trenutak stupanja na snagu — baza tada sme da vrati bilo koju, i to različitu
 * u dva uzastopna upita. Upravo takav razlaz proizvodi bljesak.
 */
export async function pristanakStatus(userId: string) {
  // Prekidač iz `moduli.ts`: kad se pristanak ne traži, ovo je jedino mesto na
  // kom se to proverava — i shell i sam ekran čitaju odavde, pa ne postoji put
  // kojim bi se ekran ipak pojavio. Verzije i zatečeni pristanci ostaju u bazi.
  if (!PRISTANAK_NA_AKTE_TRAZI_SE) return { potrebno: false as const, verzija: null };

  const najnovija = await prisma.politikaVerzija.findFirst({
    where: { efektivnaOd: { lte: new Date() } },
    orderBy: [{ efektivnaOd: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });

  if (!najnovija) return { potrebno: false as const, verzija: null };

  const prihvaceno = await prisma.politikaPrihvatanje.findUnique({
    where: { userId_verzijaId: { userId, verzijaId: najnovija.id } },
    select: { prihvacen: true },
  });

  return prihvaceno
    ? { potrebno: false as const, verzija: najnovija }
    : { potrebno: true as const, verzija: najnovija };
}
