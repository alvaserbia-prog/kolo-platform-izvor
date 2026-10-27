import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { izracunajDnevniIznos, labelPrograma } from "@/lib/protokol/programi";
import { dnevniLimit as dnevniLimitZa } from "@/lib/programi-iznosi-pravila";
import { dohvatiPotvrdioceUslova } from "@/lib/protokol/program-potvrda";
import { ucitajStatus, sme } from "@/lib/protokol/status";
import { ProgramType } from "@/generated/prisma/client";
import ProgramiKlijent from "./ProgramiKlijent";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("programi");
  return { title: t("naslov") };
}

// PED (operativni doprinos) ide kroz zadatke (/doprinos-oglasi), ne kroz enrollment.
const SVI_TIPOVI: ProgramType[] = [
  "PODRSKA_MAJKAMA", "PODRSKA_STARIJIMA", "POSEBNA_BRIGA", "SKOLOVANJE",
];

export default async function ProgramiPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const danas = new Date();
  danas.setHours(0, 0, 0, 0);

  const [aktivniProgrami, enrollments, protokol, emisijaDanas, status] = await Promise.all([
    prisma.protokolProgram.findMany({ where: { isActive: true } }),
    prisma.programEnrollment.findMany({ where: { userId: session.user.id } }),
    prisma.wallet.findUnique({ where: { id: "banka-singleton" }, select: { balance: true } }),
    prisma.dailyEmissionSummary.findFirst({ where: { date: danas } }),
    ucitajStatus(session.user.id),
  ]);

  // Koliko ljudi će biti zamoljeno da potvrdi — stoji u samom tekstu pristanka
  // (programi čl. 6): pristanak mora da kaže KOLIKO lica saznaje za koji se program
  // korisnik prijavio, jer taj podatak otkriva posebnu kategoriju.
  // Set 4.8.2: to su članovi Kola koji podnosioca lično znaju (programi čl. 5); kad ih
  // nema, potvrđuje Fondacija i pristanak to kaže drugim tekstom.
  const brojVerifikatora = (await dohvatiPotvrdioceUslova(prisma, session.user.id)).length;

  const aktivniTipovi = new Set(aktivniProgrami.map((p) => p.type));

  const programi = SVI_TIPOVI.map((type) => {
    const enrollment = enrollments.find((e) => e.type === type);
    let ocekivaniDnevni = 0;
    if (enrollment?.status === "ACTIVE") {
      ocekivaniDnevni = izracunajDnevniIznos(type, enrollment.metadata, enrollment.dailyAmount, danas);
    }
    return {
      type,
      label: labelPrograma(type),
      programAktivan: aktivniTipovi.has(type),
      enrollment: enrollment
        ? {
            id: enrollment.id,
            status: enrollment.status,
            metadata: enrollment.metadata as Record<string, unknown> | null,
            dailyAmount: enrollment.dailyAmount,
            approvedAt: enrollment.approvedAt?.toISOString() ?? null,
            rejectionReason: enrollment.rejectionReason,
            ocekivaniDnevni,
            isplacenoPoen: enrollment.isplacenoPoen,
          }
        : null,
    };
  });

  const opticaj = protokol ? Math.abs(protokol.balance) : 0;
  // Limit iz obračuna ovog dana kad postoji (računat nad opticajem na početku
  // perioda, operativni čl. 20); inače procena nad tekućim stanjem.
  const dnevniLimit = emisijaDanas?.limit ?? dnevniLimitZa(opticaj);

  // Operativni doprinos (PED) nema enrollment — kartica vodi na zadatke (/doprinos-oglasi).
  const pedAktivan = aktivniTipovi.has("PED");
  const brojAktivnih = (pedAktivan ? 1 : 0) + programi.filter((p) => p.programAktivan).length;

  return (
    <ProgramiKlijent
      programi={programi}
      pedAktivan={pedAktivan}
      brojAktivnih={brojAktivnih}
      isVerified={session.user.verified}
      // Pravo ostvaruje verifikovan učesnik, i član bez potvrde (programi čl. 4).
      // Maloletni korisnik nema pravo na programe podrške (deca čl. 29 st. 4).
      imaPristupProgramima={status != null && sme("PRIJAVA_NA_PROGRAM", status)}
      brojVerifikatora={brojVerifikatora}
      emisioniKontekst={{
        opticaj,
        dnevniLimit,
        emitovanoAm: emisijaDanas?.totalEmitted ?? null,
        zahtevanoAm: emisijaDanas?.totalRequested ?? null,
      }}
    />
  );
}
