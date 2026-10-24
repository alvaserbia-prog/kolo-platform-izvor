import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ucitajUcesnika } from "@/lib/protokol/deca";
import PrijateljiKlijent from "./PrijateljiKlijent";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("prijatelji");
  return { title: t("naslov") };
}

/**
 * Prijatelji — dečja zamena za stranicu Potvrde.
 *
 * Odrasli tu vide indeks stvarnosti i kod za potvrđivanje. Dete nema indeks i
 * nikoga ne potvrđuje (Modul Deca, čl. 15), pa umesto indeksa stoji BROJ
 * PRIJATELJA, a umesto koda za potvrdu kod za povezivanje.
 */
export default async function PrijateljiPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const ja = await ucitajUcesnika(session.user.id);
  // Punoletni koji stigne starim ili deljenim linkom ide na Potvrde (njihov
  // pandan), a ne na 404 (odluka vlasnika 22.10.2026).
  if (!ja?.maloletan) redirect("/verifikacija");
  return <PrijateljiKlijent />;
}
