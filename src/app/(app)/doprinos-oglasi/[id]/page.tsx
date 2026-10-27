import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeVerifikovan, ucitajStatus } from "@/lib/protokol/status";
import { statusZadatka, zauzimaMesto } from "@/lib/operativni-pravila";
import { iskoriscenostLimita, podaciZadatkaZaUcesnike } from "@/lib/protokol/operativni-postupak";
import OglasDetalj from "./OglasDetalj";
import ZadatakZaUcesnike from "./ZadatakZaUcesnike";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("doprinosOglasi");
  return { title: t("naslov") };
}

/**
 * Stranica zadatka — operativni 5.0 čl. 25. Zadatak sa elementima iz čl. 5 i
 * tekući status vidi svaki korisnik (st. 1); prijave, planove, pseudonime
 * izvršilaca i lica koje potvrđuje, odluke, evidentirani POEN, primedbe i
 * iskorišćenost limita ISKLJUČIVO učesnici (st. 2) — server ih korisniku koji nije
 * u Kolu ni ne učitava. Pseudonim predlagača se ne prikazuje (#52).
 */
export default async function OglasPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;

  const oglas = await prisma.doprinosOglas.findUnique({
    where: { id },
    include: {
      krug: { select: { name: true } },
      prijave: {
        select: {
          id: true,
          userId: true,
          status: true,
          odustaoAt: true,
          zavrsnaOdluka: true,
          zavrsnoObrazlozenje: true,
          zavrsetakAt: true,
          dodelioId: true,
          aktivanKljuc: true,
          planIzvrsenja: true,
          izjavaTekst: true,
          rejectionReason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      evidencije: {
        where: { userId: session.user.id },
        orderBy: { date: "desc" },
        take: 30,
        select: { id: true, date: true, predlozeniPoen: true, celina: true, amount: true, dokaz: true, description: true, status: true, odlukaObrazlozenje: true },
      },
    },
  });

  if (!oglas) notFound();

  const status = await ucitajStatus(session.user.id);
  const ucesnik = status != null && jeVerifikovan(status);
  const moja = oglas.prijave.find((p) => p.userId === session.user.id) ?? null;
  const zaUcesnike = ucesnik ? { ...(await podaciZadatkaZaUcesnike(id)), limit: await iskoriscenostLimita() } : null;

  return (
    <div className="space-y-6">
      <OglasDetalj
        oglas={{
          id: oglas.id,
          title: oglas.title,
          description: oglas.description,
          source: oglas.source as string,
          zadruzni: oglas.zadruzni,
          predlozeniPoen: oglas.predlozeniPoen,
          brojCelina: oglas.brojCelina,
          opisCeline: oglas.opisCeline,
          procenaObima: oglas.procenaObima,
          obrazlozenje: oglas.obrazlozenje,
          saOdobravanjem: oglas.saOdobravanjem,
          odobravanjeObrazlozenje: oglas.odobravanjeObrazlozenje,
          kvalifikacioniUslov: oglas.kvalifikacioniUslov,
          kvalifikacioniObrazlozenje: oglas.kvalifikacioniObrazlozenje,
          positions: oglas.positions,
          deadline: oglas.deadline?.toISOString() ?? null,
          rokIzvrsenja: oglas.rokIzvrsenja?.toISOString() ?? null,
          status: oglas.status as string,
          statusZadatka: statusZadatka(oglas.status, oglas.prijave),
          povucenoObrazlozenje: oglas.povucenoObrazlozenje,
          obustavljeno: oglas.obustavljenoAt != null,
          krugName: oglas.krug?.name ?? null,
          odobreniClanovi: oglas.prijave.filter(zauzimaMesto).length,
          createdAt: oglas.createdAt.toISOString(),
          mojaPrijava: moja
            ? {
                id: moja.id,
                status: moja.status as string,
                ziva: moja.aktivanKljuc != null,
                odustao: moja.odustaoAt != null,
                dodeljena: moja.dodelioId != null,
                zavrsetakAt: moja.zavrsetakAt?.toISOString() ?? null,
                zavrsnaOdluka: moja.zavrsnaOdluka,
                zavrsnoObrazlozenje: moja.zavrsnoObrazlozenje,
                planIzvrsenja: moja.planIzvrsenja,
                izjavaTekst: moja.izjavaTekst,
                rejectionReason: moja.rejectionReason,
                createdAt: moja.createdAt.toISOString(),
              }
            : null,
          mojeEvidencije: oglas.evidencije.map((e) => ({
            id: e.id,
            date: e.date.toISOString(),
            predlozeniPoen: e.predlozeniPoen,
            celina: e.celina,
            amount: e.amount,
            dokaz: e.dokaz,
            description: e.description,
            status: e.status as string,
            odlukaObrazlozenje: e.odlukaObrazlozenje,
          })),
        }}
        isVerified={ucesnik}
      />
      {zaUcesnike && <ZadatakZaUcesnike oglasId={oglas.id} aktivan={oglas.status === "ACTIVE"} podaci={zaUcesnike} />}
    </div>
  );
}
