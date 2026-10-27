import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";
import { uzrast } from "@/lib/deca-pravila";
import { IZBOR_UCESNIKA, naStaSeCeka, roditeljiIzReda, ucesnikIzReda } from "@/lib/protokol/deca";
import { potvrdjenIzPolja } from "@/lib/status-ucesnika-pravila";
import DeteProfil from "./DeteProfil";
import { prepisiNaCekanju } from "@/lib/protokol/prepis-odobrenje";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deca");
  return { title: t("naslov") };
}

/**
 * Podešavanja deteta — mesto radnji roditelja (Pravilnik o učešću dece čl. 19–21).
 * Klik na dete u „Moja deca" vodi ovde; profil deteta je na `/profil/<pseudonim>`,
 * do koga vodi dugme „Pogledaj profil deteta" (i nazad, dugme na profilu).
 *
 * 🔴 Ovo NIJE nadzorni ekran. Sam profil roditelj gleda isto kao svako drugo dete,
 * na `/profil/<pseudonim>`; ovde su samo radnje koje pripadaju roditelju (odobrenje
 * prepisa, prekidač iz čl. 20 st. 2, izjava, „Ukloni" uz oglas, lozinka, brisanje,
 * „Zatraži potvrdu da imaš dete" i prijava lažnog roditeljstva — set 4.8.2).
 *
 * 🔴 Poruke deteta se NE prikazuju ni ovde ni igde drugde (čl. 19 st. 2–3). Nema ni
 * brojača poruka ni spiska sagovornika — posredno bi se videlo ono što pravilnik
 * izričito uskraćuje.
 */
export default async function DetePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;

  const dete = await prisma.user.findUnique({
    where: { id },
    select: {
      ...IZBOR_UCESNIKA,
      pseudonim: true,
      avatar: true,
      roditeljstvaKaoDete: {
        ...IZBOR_UCESNIKA.roditeljstvaKaoDete,
        select: {
          ...IZBOR_UCESNIKA.roditeljstvaKaoDete.select,
          izjavaAt: true,
          roditelj: {
            select: { ...IZBOR_UCESNIKA.roditeljstvaKaoDete.select.roditelj.select, pseudonim: true },
          },
          // Živ zahtev za potvrdu postojanja ZA OVU vezu (čl. 13), i kad još nije potvrđen.
          potvrdePostojanja: {
            where: { aktivnaKljuc: { not: null } },
            select: { id: true, potvrdjenoAt: true },
            take: 1,
          },
        },
      },
      deaktiviranAt: true,
      createdAt: true,
      dozvolaOdrasli: true,
      email: true,
      wallet: { select: { balance: true } },
    },
  });
  // 404, ne 403 — status 403 bi tuđem roditelju potvrdio da nalog postoji.
  // 🔴 Zaustavljena veza (čl. 17 st. 2) ne daje uvid ni ovlašćenja roditelja.
  const jeMoje =
    dete?.roditeljstvaKaoDete.some((r) => r.roditeljId === session.user.id && !r.zaustavljenaAt) ?? false;
  if (!dete || !dete.maloletan || !jeMoje || dete.deaktiviranAt) {
    notFound();
  }

  const mojaVeza = dete.roditeljstvaKaoDete.find((r) => r.roditeljId === session.user.id);
  // Za stanje deteta broji se samo POTVRĐEN zahtev (čl. 5 st. 1 t. 3).
  const red = {
    ...dete,
    roditeljstvaKaoDete: dete.roditeljstvaKaoDete.map((r) => ({
      ...r,
      potvrdePostojanja: r.potvrdePostojanja.filter((z) => z.potvrdjenoAt !== null),
    })),
  };
  const mojZahtev = mojaVeza?.potvrdePostojanja[0] ?? null;
  const prepisi = await prepisiNaCekanju(dete.id);

  const oglasi = await prisma.marketplaceListing.findMany({
    where: { sellerId: dete.id, uklonjenAt: null, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, price: true, cenaTip: true, images: true, createdAt: true },
  });

  return (
    <DeteProfil
      dete={{
        id: dete.id,
        pseudonim: dete.pseudonim,
        avatar: dete.avatar,
        godine: dete.datumRodjenja ? uzrast(dete.datumRodjenja, beogradskiDan()) : null,
        clanOd: dete.createdAt.toISOString(),
        balans: dete.wallet?.balance ?? 0,
        dozvolaOdrasli: dete.dozvolaOdrasli,
        // Izjava iz čl. 12 nedostaje samo kad je nalog u maloletni preveo
        // administrator (čl. 15); svuda drugde nastaje pri otvaranju odnosno
        // preuzimanju naloga. Od seta 4.8.2 nema roka.
        izjavaNedostaje: Boolean(mojaVeza && !mojaVeza.izjavaAt),
        stanje: ucesnikIzReda(red).stanje,
        naStaSeCeka: naStaSeCeka(roditeljiIzReda(red)),
        // Potvrdu postojanja traži roditelj koji je član Kola ili osnivač (čl. 13 st. 1).
        smeTrazitiPotvrdu: Boolean(mojaVeza && potvrdjenIzPolja(mojaVeza.roditelj)),
        postojanje: mojZahtev ? (mojZahtev.potvrdjenoAt ? "POTVRDJENO" : "TRAZENO") : "NIJE_TRAZENO",
        // Drugi roditelj — za prijavu lažnog roditeljstva (čl. 17 st. 1).
        drugiRoditelji: dete.roditeljstvaKaoDete
          .filter((r) => r.roditeljId !== session.user.id)
          .map((r) => ({ id: r.roditeljId, pseudonim: r.roditelj.pseudonim })),
        // Sama adresa se NE šalje u pretraživač — merodavno je samo da li postoji
        // (čl. 14: adresa služi detetu za povratak u nalog, ne roditelju za uvid).
        imaSvojuAdresu: dete.email !== null,
      }}
      oglasi={oglasi.map((o) => ({
        id: o.id,
        naslov: o.title,
        cena: o.price,
        cenaTip: o.cenaTip,
        imaSliku: o.images.length > 0,
      }))}
      prepisi={prepisi}
    />
  );
}
