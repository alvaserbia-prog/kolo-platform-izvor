import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ucitajStatus } from "@/lib/protokol/status";
import { dohvatiPredlogeZaPrikaz } from "@/lib/protokol/glasanje";
import { dohvatiFazuStatus } from "@/lib/protokol/faza-sistema";
import { glasackaMoc, smeAktiviratiZrno, smePodnetiPredlog, vidiPseudonimeGornjegKola } from "@/lib/gornje-kolo-pravila";
import Stranica from "@/components/ui/Stranica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import GlasanjeKlijent from "./GlasanjeKlijent";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("glasanje");
  return { title: t("naslov") };
}

/**
 * Glasanje u Gornjem Kolu — sopstvena stranica (odluka vlasnika 05.11.2026; do tada
 * je spisak predloga stajao na ZRNU, a `/glasanje` je samo preusmeravao). ZRNO nosi
 * karticu-vezu sa brojem predloga koji čekaju glas.
 */
export default async function GlasanjePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const t = await getTranslations("glasanje");

  // Status iz baze, ne iz sesije (set 4.8.2). Pseudonime vide samo učesnici
  // (Gornje Kolo čl. 9 st. 3, 10 st. 5); glasačku moć ima samo čuvar Kola (čl. 29, 43).
  const status = (await ucitajStatus(session.user.id)) ?? "KORISNIK";
  const [predlozi, stanje, faza] = await Promise.all([
    dohvatiPredlogeZaPrikaz(session.user.id, vidiPseudonimeGornjegKola(status), new Date()),
    prisma.zrnoStanje.findUnique({ where: { userId: session.user.id }, select: { aktivno: true } }),
    dohvatiFazuStatus(),
  ]);
  const moc = smeAktiviratiZrno(status) ? glasackaMoc(stanje?.aktivno ?? 0) : 0;

  return (
    <Stranica>
      <NaslovStranice nazad={{ href: "/zrno", oznaka: t("nazad_zrno") }} naslov={t("naslov")} opis={t("opis_stranice")} />
      {/* U Fazi 1 Gornje Kolo ne postoji (Pravilnik čl. 41–42): predlog se ne nudi. */}
      <GlasanjeKlijent
        predlozi={predlozi}
        mojaGlasackaMoc={moc}
        smePredloziti={faza.faza === "FAZA_2" && smePodnetiPredlog(status)}
      />
    </Stranica>
  );
}
