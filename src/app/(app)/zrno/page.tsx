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
import { fazaPredloga, zatvoriIstekleIObjaviIshod } from "@/lib/protokol/glasanje";
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

  // Zatvori istekle predloge i utvrdi ishod pre čitanja (čl. 13)
  await zatvoriIstekleIObjaviIshod(now);

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
    prisma.glasanjePredlog.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { pseudonim: true } }, glasovi: true },
    }),
  ]);

  const slobodno = stanje?.slobodno ?? 0;
  const aktivno = stanje?.aktivno ?? 0;
  // Glasačka moć ima samo čuvar Kola (Pravilnik čl. 30 st. 3, 45).
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
      predlozi={predlozi.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        authorPseudonim: p.author.pseudonim,
        glasanjePocetak: p.glasanjePocetak.toISOString(),
        deadline: p.deadline.toISOString(),
        status: p.status as "ACTIVE" | "CLOSED",
        faza: fazaPredloga(p, now),
        ishodUsvojen: p.ishodUsvojen,
        zaGlasova: p.glasovi.filter((g) => g.za).reduce((s, g) => s + g.glasackaGlasova, 0),
        protiGlasova: p.glasovi.filter((g) => !g.za).reduce((s, g) => s + g.glasackaGlasova, 0),
        mojGlas: p.glasovi.find((g) => g.userId === session.user.id)?.za ?? null,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
