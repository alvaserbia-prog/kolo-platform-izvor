import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { zaglavljePrimerka } from "@/lib/protokol/pokroviteljstvo-dobrima";
import UgovorAkcije from "@/app/(app)/donacije/[id]/ugovor/UgovorAkcije";
import Kartica from "@/components/ui/Kartica";

export async function generateMetadata() {
  const t = await getTranslations("vauceri");
  return { title: `${t("ugovor_naslov")} — KOLO` };
}

/**
 * Primerak zaključenog ugovora o pokroviteljstvu dobrima i uslugama za štampu
 * (donacije čl. 32 st. 1): zaglavlje „Zaključeno elektronski na Platformi KOLO,
 * dana …, u … časova, kontrolni broj …" i SNIMLJEN tekst — nikad se ne generiše
 * ponovo pri čitanju.
 *
 * Vidi ga podnosilac prijave i administratorski tim. Zaposleni davaoca ga ne vidi
 * (donacije čl. 32 st. 3). Tuđ ili nepotpisan ugovor izgleda isto — 404.
 */
export default async function PrimerakUgovoraDobraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const [t, locale] = await Promise.all([getTranslations("vauceri"), getLocale()]);

  const u = await prisma.ugovorDobra.findUnique({
    where: { id },
    select: { podnosilacId: true, ugovorTekst: true, potpisanoAt: true, kontrolniBroj: true },
  });
  if (
    !u || !u.ugovorTekst || !u.potpisanoAt || !u.kontrolniBroj ||
    (u.podnosilacId !== session.user.id && !jeAdmin(session.user))
  ) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href="/postani-pokrovitelj" className="inline-flex min-h-9 items-center text-sm text-kolo-muted hover:text-kolo-green-700">
          ← {t("primerak_nazad")}
        </Link>
        <UgovorAkcije labela={t("primerak_stampaj")} />
      </div>

      <Kartica padding="lg" className="space-y-4 print:border-0 print:shadow-none print:rounded-none">
        <p className="text-xs text-kolo-muted break-all">{zaglavljePrimerka(locale, u.potpisanoAt, u.kontrolniBroj)}</p>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-kolo-text">{u.ugovorTekst}</pre>
      </Kartica>
    </div>
  );
}
