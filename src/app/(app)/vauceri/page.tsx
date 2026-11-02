import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VauceriKlijent from "./VauceriKlijent";

export const metadata = { title: "Vaučeri — KOLO" };

/**
 * Raspodela dobara i usluga iz pokroviteljstva (nabavke Glava VII) i
 * „Moji vaučeri". 🔴 Uz broj POEN-a se nigde ne prikazuje dinarska vrednost.
 */
export default async function VauceriPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  // Mesto sa profila — referenca za „Blizu mene" i udaljenost na kartici, kao na Pijaci.
  const ja = await prisma.user.findUnique({ where: { id: session.user.id }, select: { location: true } });
  return <VauceriKlijent mojaLokacija={ja?.location ?? null} />;
}
