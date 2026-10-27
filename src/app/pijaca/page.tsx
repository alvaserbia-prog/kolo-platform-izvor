import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { parsirajKatParam } from "@/lib/kategorije";
import PijacaKlijent from "@/app/(app)/pijaca/PijacaKlijent";
import {
  smeSaOdraslima,
  smeVidetiPseudonimOglasivaca,
  ucitajUcesnika,
  usloviVidljivostiOglasa,
} from "@/lib/protokol/deca";
import { idPrijatelja } from "@/lib/protokol/prijateljstva";
import Link from "next/link";
import Dugme from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";
import { GAZDINSTVO_ZA_OZNAKU, jeDomace } from "@/lib/protokol/gazdinstvo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pijaca");
  return pageMetadata({
    title: t("meta_title"),
    description: t("meta_desc"),
    path: "/pijaca",
  });
}

export default async function PijacaPage({
  searchParams,
}: {
  searchParams: Promise<{ kat?: string; gazdinstvo?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("pijaca");

  // Predizabrane kategorije iz URL-a (?kat=slug1,slug2) — deljivi linkovi, SSR.
  const { kat, gazdinstvo: gazdinstvoParam } = await searchParams;
  // Oglasi u ime jednog gazdinstva (?gazdinstvo=<id>) — veza „Pijaca" sa kartice na
  // mapi (Pravilnik o gazdinstvima čl. 19). Samo odobreno gazdinstvo; oznaku nosi
  // samo odobren član, kao na profilu gazdinstva (čl. 18 st. 2).
  const gazdinstvoFilter = gazdinstvoParam
    ? await prisma.gazdinstvo.findFirst({
        where: { id: gazdinstvoParam, status: "ODOBRENO" },
        select: { id: true, naziv: true },
      })
    : null;
  const initialKat = parsirajKatParam(kat);

  // Praćene kategorije (čip „Samo praćene") + lokacija iz profila
  // (početna referenca za filter udaljenosti).
  const korisnik = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { location: true, praceneKategorije: { select: { category: true } } },
      })
    : null;
  const pracene = korisnik?.praceneKategorije.map((p) => p.category) ?? [];

  // Vidljivost oglasa maloletnog korisnika (Pravilnik o učešću dece čl. 24).
  //
  // 🔴 Filter mora da stoji OVDE, a ne samo u `GET /api/pijaca`: `PijacaKlijent`
  // ceo spisak dobija kroz props sa servera i dalje filtrira samo u pretraživaču,
  // pa ruta koja isti uslov već sprovodi nije na putu kojim čovek dolazi na Pijacu.
  const posmatrac = session ? await ucitajUcesnika(session.user.id) : null;

  const listings = await prisma.marketplaceListing.findMany({
    where: gazdinstvoFilter
      ? {
          status: "ACTIVE",
          gazdinstvoId: gazdinstvoFilter.id,
          seller: {
            AND: [
              usloviVidljivostiOglasa(posmatrac),
              { clanstvaGazdinstva: { some: { gazdinstvoId: gazdinstvoFilter.id, status: "ODOBREN" } } },
            ],
          },
        }
      : { status: "ACTIVE", seller: usloviVidljivostiOglasa(posmatrac) },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true, title: true, description: true, tip: true,
      cenaTip: true, price: true, cenaDo: true,
      category: true, images: true, location: true, createdAt: true,
      sellerId: true,
      seller: { select: { pseudonim: true, verified: true, maloletan: true } },
      gazdinstvo: GAZDINSTVO_ZA_OZNAKU,
    },
  });

  const isVerified = session?.user?.verified ?? false;

  // Dete sa roditeljem oglase vidi BEZ pseudonima oglašivača, osim oglasa svojih
  // prijatelja, i piše samo prijateljima (Pravilnik o učešću dece čl. 5 st. 1 t. 2).
  const deteSaRoditeljem = !!posmatrac?.maloletan && posmatrac.stanje === "POVEZANO";
  const prijatelji = deteSaRoditeljem && posmatrac ? new Set(await idPrijatelja(posmatrac.id)) : new Set<string>();

  return (
    <>
      {!session && (
        <div className="mb-5 bg-kolo-green-100 border border-kolo-green-500/20 rounded-kartica px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-kolo-green-900">
            {t("gost_tekst")}
          </p>
          <div className="flex gap-2 shrink-0">
            <Dugme href="/login" varijanta="sekundarno">
              {t("prijavi_se")}
            </Dugme>
            <Dugme href="/registracija" varijanta="zlatno">
              {t("registruj_se")}
            </Dugme>
          </div>
        </div>
      )}
      {gazdinstvoFilter && (
        <Kartica padding="nema" className="mb-4 px-5 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-kolo-text">{t("filter_gazdinstvo", { naziv: gazdinstvoFilter.naziv })}</span>
          <Link href="/pijaca" className="inline-flex min-h-9 items-center font-medium text-kolo-green-700 hover:underline">{t("filter_gazdinstvo_sve")}</Link>
        </Kartica>
      )}
      <PijacaKlijent
        listings={listings.map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          tip: l.tip,
          cenaTip: l.cenaTip,
          price: l.price,
          cenaDo: l.cenaDo,
          category: l.category,
          slike: l.images.length,
          location: l.location ?? null,
          createdAt: l.createdAt.toISOString(),
          sellerId: l.sellerId,
          sellerPseudonim: smeVidetiPseudonimOglasivaca(posmatrac, l.sellerId, prijatelji)
            ? l.seller.pseudonim
            : null,
          sellerPrijatelj: deteSaRoditeljem && prijatelji.has(l.sellerId) && l.sellerId !== posmatrac?.id,
          sellerVerified: l.seller.verified,
          sellerMaloletan: l.seller.maloletan,
          domace: jeDomace(l),
        }))}
        isVerified={isVerified}
        prijavljen={!!session?.user}
        posmatracMaloletan={posmatrac?.maloletan ?? false}
        // Dete Kola piše po deca čl. 22; dete sa roditeljem samo prijateljima.
        detePise={!!posmatrac?.maloletan && posmatrac.stanje === "AKTIVNO"}
        deteSaRoditeljem={deteSaRoditeljem}
        deteSmeSaOdraslima={
          // 🔴 Uz prekidač ide i uzrasna granica (deca čl. 22 st. 4): do 15 dete sa
          // punoletnima ne komunicira, pa mu se dugme „Kontaktiraj" na tuđem
          // oglasu ne sme nuditi ni kad je prekidač uključen.
          !!posmatrac && smeSaOdraslima(posmatrac) && posmatrac.dozvolaOdrasli
        }
        initialKat={initialKat}
        pracene={pracene}
        mojaLokacija={korisnik?.location ?? null}
      />
    </>
  );
}
