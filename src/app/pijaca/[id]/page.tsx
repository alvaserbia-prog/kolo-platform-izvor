import { getServerSession } from "next-auth";
import { GAZDINSTVO_ZA_OZNAKU, jeDomace } from "@/lib/protokol/gazdinstvo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, SITE_DESCRIPTION, absoluteUrl } from "@/lib/seo";
import OglasDetalj from "../../(app)/pijaca/[id]/OglasDetalj";
import { pocetakDana } from "@/lib/potvrde-dnevno-pravila";
import {
  IZBOR_UCESNIKA,
  smeDaVidiOglas,
  smePokrenutiRazgovor,
  smeVidetiPseudonimOglasivaca,
  ucesnikIzReda,
  ucitajUcesnika,
} from "@/lib/protokol/deca";
import { idPrijatelja } from "@/lib/protokol/prijateljstva";
import { jeAdmin } from "@/lib/dozvole";

// og:image se ovde NE navodi — obezbeđuje ga susedni `opengraph-image.tsx`
// (1200×630 PNG sa fotografijom oglasa, uz og:image:width/height/type), jedini
// oblik koji Viber i Messenger pouzdano prikazuju pri PRVOM deljenju linka.
// Twitter/X bez sopstvene slike pada nazad na og:image.
//
// Ta ruta sprovodi vidljivost oglasa deteta sama za sebe — file-convention
// slika se emituje i kad `generateMetadata` vrati prazno.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    select: { title: true, description: true, seller: { select: { maloletan: true } } },
  });
  if (!listing) return {};

  // Oglas maloletnog korisnika nije javno dostupan (Modul Deca, čl. 13), pa mu
  // naslov i opis ne smeju u zaglavlje stranice ni u OG karticu — odatle ih
  // pokupe Gugl i svaki program za poruke, bez ijedne prijave. Sliku zatvara
  // `opengraph-image.tsx` sopstvenom proverom.
  if (listing.seller.maloletan) return {};

  // Opis sa kartice (početni deo), fallback na opšti opis sistema.
  const opis = (listing.description?.trim() || SITE_DESCRIPTION).slice(0, 200);
  const putanja = `/pijaca/${id}`;

  return {
    title: { absolute: `${listing.title} — ${SITE_NAME}` },
    description: opis,
    alternates: { canonical: putanja },
    openGraph: {
      type: "website",
      url: absoluteUrl(putanja),
      siteName: SITE_NAME,
      title: listing.title,
      description: opis,
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description: opis,
    },
  };
}

/** Da li par već ima razgovor — u njemu nov član sme da piše bez novog limita. */
async function imaRazgovor(a: string, b: string): Promise<boolean> {
  const [user1Id, user2Id] = [a, b].sort();
  const k = await prisma.konverzacija.findUnique({
    where: { user1Id_user2Id: { user1Id, user2Id } },
    select: { id: true },
  });
  return k !== null;
}

/** Koliko je novih razgovora posmatrač danas pokrenuo (dnevni limit novog člana). */
async function pokrenutihDanas(userId: string): Promise<number> {
  return prisma.konverzacija.count({ where: { pokrenuoId: userId, createdAt: { gte: pocetakDana() } } });
}

export default async function OglasPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: {
      seller: { select: { ...IZBOR_UCESNIKA, pseudonim: true, verified: true } },
      gazdinstvo: { select: { ...GAZDINSTVO_ZA_OZNAKU.select, naziv: true } },
    },
  });

  if (!listing) notFound();

  // Vidljivost oglasa maloletnog korisnika (Modul Deca, čl. 13).
  //
  // 🔴 `notFound()`, ne poruka o zabrani: poruka bi potvrdila da oglas postoji, a
  // time i da postoji dete koje ga je objavilo — upravo ono što se skriva. Isti
  // izbor kao 404 u `GET /api/pijaca/[id]`.
  const posmatrac = session ? await ucitajUcesnika(session.user.id) : null;
  const prodavac = ucesnikIzReda(listing.seller);
  const smem = smeDaVidiOglas(
    posmatrac ? { ...posmatrac, admin: jeAdmin(session?.user) } : null,
    prodavac,
  );
  if (!smem) notFound();

  // Dete sa roditeljem oglas vidi BEZ pseudonima oglašivača, osim oglasa svojih
  // prijatelja, i piše samo prijateljima (Pravilnik o učešću dece čl. 4c t. 2, 13 st. 4).
  const deteSaRoditeljem = !!posmatrac?.maloletan && posmatrac.stanje === "POVEZANO";
  const prijatelji = deteSaRoditeljem && posmatrac ? await idPrijatelja(posmatrac.id) : [];
  const vidiPseudonim = smeVidetiPseudonimOglasivaca(posmatrac, listing.sellerId, prijatelji);
  const suPrijatelji = deteSaRoditeljem && prijatelji.includes(listing.sellerId) && listing.sellerId !== posmatrac?.id;

  /**
   * Sme li posmatrač da pokrene razgovor povodom oglasa.
   *
   * 🔴 NE `session.user.verified`. Maloletni nalog je trajno neverifikovan (čl. 15),
   * pa je dete na svakom tuđem oglasu dobijalo poziv da postane redovan član — a
   * ruta `POST /api/poruke` mu razgovor sve vreme dozvoljava. Ista funkcija odlučuje
   * i tamo i ovde, pa se to dvoje više ne može raziće.
   */
  const razgovor = posmatrac
    ? smePokrenutiRazgovor(
        posmatrac,
        prodavac,
        (session?.user?.verified ?? false) || (await imaRazgovor(posmatrac.id, prodavac.id)),
        // Nov član sa stranice oglasa: povod je ovaj oglas (Uslovi čl. 16 st. 5).
        { povodOglasom: true, pokrenutihDanas: await pokrenutihDanas(posmatrac.id) },
        suPrijatelji,
      )
    : ({ ok: false, razlog: "", status: 403 } as const);

  return (
    <OglasDetalj
      oglas={{
        id: listing.id,
        title: listing.title,
        description: listing.description,
        tip: listing.tip,
        cenaTip: listing.cenaTip,
        price: listing.price,
        cenaDo: listing.cenaDo,
        category: listing.category,
        images: listing.images,
        location: listing.location ?? null,
        // Kontakt (telefon) se ne šalje klijentu osim verifikovanima (Politika čl. 6) —
        // ne sme „procuriti" kroz props ni za neverifikovane, čak i da se ne renderuje.
        phone: session?.user?.verified ? (listing.phone ?? null) : null,
        status: listing.status,
        createdAt: listing.createdAt.toISOString(),
        sellerId: listing.seller.id,
        sellerPseudonim: vidiPseudonim ? listing.seller.pseudonim : null,
        sellerVerified: listing.seller.verified,
        sellerMaloletan: listing.seller.maloletan,
        domace: jeDomace({ sellerId: listing.sellerId, gazdinstvo: listing.gazdinstvo })
          ? { gazdinstvoId: listing.gazdinstvo!.id, naziv: listing.gazdinstvo!.naziv }
          : null,
        isMine: listing.seller.id === session?.user?.id,
        pregledi: listing.pregledi,
        // Razlog uklanjanja se saopštava vlasniku (Uslovi čl. 25 st. 2), ne javnosti.
        uklonjenRazlog:
          listing.seller.id === session?.user?.id ? (listing.uklonjenRazlog ?? null) : null,
      }}
      isVerified={session?.user?.verified ?? false}
      jePrijavljen={!!session?.user}
      posmatracMaloletan={posmatrac?.maloletan ?? false}
      smePisati={razgovor.ok}
      razlogZabrane={
        posmatrac?.maloletan && !razgovor.ok
          ? posmatrac.stanje === "AKTIVNO"
            ? "odrasli_zabranjeni"
            : posmatrac.stanje === "POVEZANO"
              ? "samo_prijatelji"
              : "ceka_odobrenje"
          : null
      }
    />
  );
}
