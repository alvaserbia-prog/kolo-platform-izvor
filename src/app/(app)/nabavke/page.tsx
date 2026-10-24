import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NabavkeKlijent from "./NabavkeKlijent";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nabavke");
  return { title: t("naslov") };
}

/**
 * Registar predloga i kolektivne nabavke.
 *
 * Registar radi i pre ijedne nabavke: on je mapa rupa u zajednici — šta ljudi
 * traže, a niko iznutra ne nudi (Pravilnik o projektima i kolektivnim nabavkama
 * čl. 10, uz čl. 11 koji zabranjuje nabavku onoga što član već nudi na Pijaci).
 */
export default async function NabavkePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <NabavkeKlijent />;
}
