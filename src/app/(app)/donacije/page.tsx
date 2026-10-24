import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DonacijeKlijent from "./DonacijeKlijent";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("donacije");
  return { title: t("naslov") };
}

/**
 * Listu donacija vidi i korisnik (donacije čl. 5a st. 1; Uslovi čl. 17 st. 3, 6):
 * ime, iznos i datum, bez pseudonima — isto kao verifikovani učesnik. Do
 * 22.10.2026 je ova stranica korisnika vraćala na početnu, iako mu `/api/donacije`
 * listu daje. Dete listu ne dobija i to sprovodi server (`/api/donacije`); sa ove
 * stranice se vraća na početnu kao i sa `/doniraj` — do 22.10.2026 ga je ovde
 * držao uslov verifikacije, a bez njega bi videlo obrazac za uplatu.
 */
export default async function DonacijePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.maloletan) redirect("/pocetna");

  return <DonacijeKlijent />;
}
