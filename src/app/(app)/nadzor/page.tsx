import type { Metadata } from "next";
/**
 * /nadzor — stranica za nadzor.
 * Vidljiva samo čuvarima Kola (dokaz stvarnosti čl. 10 st. 2: nadzornik je svaki
 * čuvar Kola). Predmet je verifikacija, potvrda člana bez potvrde ili potvrda
 * postojanja deteta (čl. 10 st. 1 i 5, set 4.8.2).
 */
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listajZaNadzor, signaliZaNadzor } from "@/lib/protokol/nadzor-service";
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

  const sve = await listajZaNadzor(session.user.id);
  // Svaki zapis ostaje u nadzoru (čl. 10). Redosled: prvo verifikacije koje je
  // obavio član bez potvrde (čl. 11 st. 7), zatim one sa više signala, a među
  // jednakima najstariji.
  const signali = await signaliZaNadzor(sve);
  const lista = [...sve].sort((a, b) => {
    if (a.verifikatorBezPotvrde !== b.verifikatorBezPotvrde) return a.verifikatorBezPotvrde ? -1 : 1;
    const razlika = (signali.get(b.id)?.length ?? 0) - (signali.get(a.id)?.length ?? 0);
    return razlika !== 0 ? razlika : a.datum.getTime() - b.datum.getTime();
  });

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
