import type { Metadata } from "next";
/**
 * /nadzor — stranica za nadzor.
 * Vidljiva samo čuvarima Kola (dokaz stvarnosti čl. 23: nadzornik je svaki
 * čuvar Kola). Predmet je verifikacija, potvrda člana bez potvrde ili potvrda
 * postojanja deteta (čl. 22 st. 1, set 4.8.2).
 */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listajZaNadzorSaSignalima } from "@/lib/protokol/nadzor-service";
import { mozeNadzor } from "@/lib/dozvole";
import VerifikacijaCard from "@/components/nadzor/VerifikacijaCard";
import { getTranslations } from "next-intl/server";
import Kartica from "@/components/ui/Kartica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import PraznoStanje from "@/components/ui/PraznoStanje";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("nadzor") };
}

export default async function NadzorPage() {
  const t = await getTranslations("nadzor");
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tipKorisnika: true, maloletan: true, jeOsnivac: true, verified: true, indeksStvarnosti: true, potvrdjenAt: true },
  });
  if (!user || !mozeNadzor(user)) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h1 className="kolo-naslov mb-2">{t("nema_ovlascenja_naslov")}</h1>
        <p className="text-kolo-muted">
          {t("nema_ovlascenja_opis")}
        </p>
      </div>
    );
  }

  // Svaki zapis ostaje u nadzoru (čl. 22). Redosled (čl. 25): prvo verifikacije koje
  // je obavio član bez potvrde, zatim one sa više signala, a među jednakima
  // najstariji — isti redosled vraća i `/api/nadzor`.
  const { lista, signali } = await listajZaNadzorSaSignalima(session.user.id);

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <NaslovStranice naslov={t("page_naslov")} opis={t("page_opis")} />

      {lista.length === 0 ? (
        <Kartica padding="nema">
          <PraznoStanje naslov={t("prazna_lista")} />
        </Kartica>
      ) : (
        <div className="space-y-3">
          {lista.map((v) => (
            <VerifikacijaCard
              key={`${v.vrstaPredmeta}-${v.id}`}
              id={v.id}
              vrstaPredmeta={v.vrstaPredmeta}
              vrstaVerifikacije={v.vrstaVerifikacije}
              izvor={v.izvor}
              uveo={v.uveo}
              verifikator={v.davalac}
              verifikovani={v.primalac}
              datum={v.datum.toISOString()}
              signali={signali.get(v.id) ?? []}
              ranijiZapisi={v.ranijiZapisi.map((z) => ({
                id: z.id,
                ishod: z.ishod,
                razlog: z.razlog,
                createdAt: z.createdAt.toISOString(),
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
