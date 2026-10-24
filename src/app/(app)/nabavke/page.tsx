import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NabavkeKlijent from "./NabavkeKlijent";

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
