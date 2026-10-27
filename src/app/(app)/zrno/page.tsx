import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  glasackaMoc,
  poslednjiKoeficijent,
  MINIMUM_POEN_ZA_UPIS_ZRNA,
  polozajZrna,
  smeAktiviratiZrno,
  smeDelegirati,
  smeOtpisatiZrno,
  smeUpisatiZrno,
} from "@/lib/protokol/zrno";
import { ucitajStatus } from "@/lib/protokol/status";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";
import { dohvatiPredlogeZaPrikaz } from "@/lib/protokol/glasanje";
import { dohvatiFazuStatus } from "@/lib/protokol/faza-sistema";
import { smePodnetiPredlog, vidiPseudonimeGornjegKola } from "@/lib/gornje-kolo-pravila";
import ZrnoKlijent from "./ZrnoKlijent";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("zrno");
  return { title: t("naslov") };
}

export default async function ZrnoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const danas = beogradskiDan();
  const now = new Date();

  const [status, stanje, wallet, upisZahtev, otpisZahtev, statusZahtevi, delegacija, kanal, koeficijent, predlozi] = await Promise.all([
    // Status iz baze (set 4.8.2), ne iz sesije: ZRNO upisuje član bez potvrde i
    // član Kola, aktivira i delegira samo čuvar Kola, korisniku je zamrznuto.
    ucitajStatus(session.user.id),
    prisma.zrnoStanje.findUnique({ where: { userId: session.user.id } }),
    prisma.wallet.findUnique({ where: { userId: session.user.id }, select: { balance: true } }),
    prisma.zrnoUpisZahtev.findUnique({ where: { userId_date: { userId: session.user.id, date: danas } } }),
    prisma.zrnoOtpisZahtev.findUnique({ where: { userId_date: { userId: session.user.id, date: danas } } }),
    prisma.zrnoStatusZahtev.findMany({ where: { userId: session.user.id, status: "PENDING" } }),
    prisma.zrnoDelegacija.findUnique({
      where: { delegatorId: session.user.id },
      include: { delegat: { select: { pseudonim: true } }, zakazaniDelegat: { select: { pseudonim: true } } },
    }),
    prisma.zrnoKanal.findUnique({ where: { id: "singleton" } }),
    poslednjiKoeficijent(),
    // Predlozi Gornjeg Kola — isti prikaz kao `GET /api/glasanje` (zatvara istekle i
    // utvrđuje ishod pre čitanja; Pravilnik o Gornjem Kolu čl. 10 st. 4, 11 st. 2, 19).
    // Pseudonime vide samo učesnici (čl. 9 st. 3, 10 st. 5).
    ucitajStatus(session.user.id).then((s) =>
      dohvatiPredlogeZaPrikaz(session.user.id, vidiPseudonimeGornjegKola(s), now),
    ),
  ]);

  // U Fazi 1 Gornje Kolo ne postoji (Pravilnik čl. 41–42): predlog se ne nudi.
  const faza2 = (await dohvatiFazuStatus()).faza === "FAZA_2";
  const slobodno = stanje?.slobodno ?? 0;
  const aktivno = stanje?.aktivno ?? 0;
  // Glasačka moć ima samo čuvar Kola (Pravilnik čl. 29, 43).
  const st = status ?? "KORISNIK";
  const moc = smeAktiviratiZrno(st) ? glasackaMoc(aktivno) : 0;

  return (
    <ZrnoKlijent
      slobodno={slobodno}
      aktivno={aktivno}
      glasackaMoc={moc}
      poenBalans={wallet?.balance ?? 0}
      koeficijent={koeficijent}
      kanalAktivan={kanal?.isActive ?? false}
      isVerified={session.user.verified}
      polozaj={polozajZrna(st, slobodno + aktivno)}
      jeBezPotvrde={st === "CLAN_BEZ_POTVRDE"}
      smeUpis={smeUpisatiZrno(st)}
      smeOtpis={smeOtpisatiZrno(st)}
      smeAktivirati={smeAktiviratiZrno(st)}
      smeDelegirati={smeDelegirati(st, st)}
      minimumPoenZaUpis={MINIMUM_POEN_ZA_UPIS_ZRNA}
      upisZahtev={upisZahtev ? { poenIznos: upisZahtev.poenIznos, status: upisZahtev.status } : null}
      otpisZahtev={otpisZahtev ? { kolicina: otpisZahtev.kolicina, status: otpisZahtev.status } : null}
      statusZahtevi={statusZahtevi.map((z) => ({ kolicina: z.kolicina, akcija: z.akcija }))}
      delegacija={delegacija ? {
        aktivna: delegacija.delegatId != null,
        delegatPseudonim: delegacija.delegat?.pseudonim ?? null,
        imaZakazano: delegacija.imaZakazano,
        zakazaniPseudonim: delegacija.zakazaniDelegat?.pseudonim ?? null,
      } : null}
      predlozi={predlozi}
      smePredloziti={faza2 && smePodnetiPredlog(st)}
    />
  );
}
