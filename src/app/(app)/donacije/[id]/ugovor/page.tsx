import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UgovorAkcije from "./UgovorAkcije";
import Kartica from "@/components/ui/Kartica";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("donacije");
  return { title: t("naslov") };
}

/**
 * Ugovor o donaciji (Pravilnik o pokroviteljstvu i donacijama, čl. 14).
 *
 * Prikazuje se SNIMLJEN tekst sa zapisa donacije — nikad se ne generiše ponovo
 * pri čitanju. Vidi ga isključivo sam donator (čl. 56 Pravilnika o KOLO
 * sistemu): dokument nosi ime i iznos. Ugovori sačinjeni od 26.10.2026. ne nose
 * broj POEN-a; zatečeni ga nose i prikazuju se kakvi su snimljeni.
 */
export default async function UgovorODonacijiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const t = await getTranslations("donacije");

  const donacija = await prisma.donationRecord.findUnique({
    where: { id },
    select: { userId: true, ugovorTekst: true },
  });

  // Tuđa donacija i donacija bez ugovora izgledaju isto — 404. Poruka „nemaš
  // pristup" bi potvrdila da zapis postoji.
  if (!donacija || donacija.userId !== session.user.id || !donacija.ugovorTekst) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/donacije" className="inline-flex min-h-9 items-center text-sm text-kolo-muted hover:text-kolo-green-700">
          ← {t("ugovor_nazad")}
        </Link>
        <UgovorAkcije labela={t("ugovor_stampaj")} />
      </div>

      <Kartica padding="lg" className="print:border-0 print:shadow-none print:rounded-none">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-kolo-text">
          {donacija.ugovorTekst}
        </pre>
      </Kartica>

      <p className="text-xs text-kolo-muted print:hidden">{t("ugovor_napomena")}</p>
    </div>
  );
}
