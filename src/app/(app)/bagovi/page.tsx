import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import BagoviKlijent from "./BagoviKlijent";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("bagovi");
  return { title: t("naslov") };
}

export default async function BagoviPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <BagoviKlijent />;
}
