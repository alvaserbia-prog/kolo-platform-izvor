import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ucitajUcesnika } from "@/lib/protokol/deca";
import { smeUKutiju } from "@/lib/kutija-zelja-pravila";
import KutijaZeljaKlijent from "./KutijaZeljaKlijent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("kutijaZelja");
  return { title: t("naslov") };
}

/**
 * Kutija želja — dečji prostor (whitepaper 5.0, pogl. 7). Punoletni nalog ovde
 * nema šta da vidi i vraća se na početnu; dete na čekanju vidi samo na šta se čeka.
 * Sadržaj čita klijent sa `/api/deca/kutija-zelja`, koji vidljivost sprovodi sam.
 */
export default async function KutijaZeljaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const ja = await ucitajUcesnika(session.user.id);
  if (!ja?.maloletan) redirect("/pocetna");
  const otvorena = smeUKutiju({ maloletan: true, stanje: ja.stanje }).ok;
  return <KutijaZeljaKlijent otvorena={otvorena} />;
}
