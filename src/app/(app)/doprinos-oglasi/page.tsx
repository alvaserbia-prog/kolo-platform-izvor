import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DoprinosOglasiKlijent from "./DoprinosOglasiKlijent";
import { statusZadatka, zauzimaMesto } from "@/lib/operativni-pravila";
import { imaUlazZaPotvrde } from "@/lib/protokol/operativni-postupak";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("doprinosOglasi");
  return { title: t("naslov") };
}

export default async function DoprinosOglasiPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Pseudonim predlagača se ne čita (operativni 5.0 čl. 25; #52): zadatak objavljuje
  // Fondacija u ime zajednice.
  const [oglasiRaw, mojePrijaveRaw, ulazZaPotvrde] = await Promise.all([
    prisma.doprinosOglas.findMany({
      where: { status: "ACTIVE" },
      include: {
        krug: { select: { name: true } },
        prijave: { select: { status: true, odustaoAt: true, zavrsnaOdluka: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.oglasPrijava.findMany({
      where: { userId: session.user.id, aktivanKljuc: { not: null } },
      select: { oglasId: true, status: true },
    }),
    imaUlazZaPotvrde(session.user.id),
  ]);

  const prijaveMap = Object.fromEntries(mojePrijaveRaw.map((p) => [p.oglasId, p.status]));

  const oglasi = oglasiRaw.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    source: o.source as string,
    predlozeniPoen: o.predlozeniPoen,
    saOdobravanjem: o.saOdobravanjem,
    positions: o.positions,
    deadline: o.deadline?.toISOString() ?? null,
    rokIzvrsenja: o.rokIzvrsenja?.toISOString() ?? null,
    statusZadatka: statusZadatka(o.status, o.prijave) as string,
    zadruzni: o.zadruzni,
    krugName: o.krug?.name ?? null,
    odobreniClanovi: o.prijave.filter(zauzimaMesto).length,
    createdAt: o.createdAt.toISOString(),
    mojaPrijava: (prijaveMap[o.id] ?? null) as string | null,
  }));

  return (
    <DoprinosOglasiKlijent
      oglasi={oglasi}
      isVerified={session.user.verified}
      ulazZaPotvrde={ulazZaPotvrde}
    />
  );
}
