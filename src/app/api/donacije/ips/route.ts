import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MIN_IPS_RSD,
  ipsAktivno,
  dohvatiIpsConfig,
  pozivNaBrojZaDonaciju,
  sklopiIpsString,
} from "@/lib/placanje/ips-qr";
import { PORUKA_DETE_NE_DONIRA } from "@/lib/donacija-pravila";
import { RACUN_FONDACIJE } from "@/lib/placanje/racun-fondacije";

/**
 * GET — informacije za prikaz IPS sekcije (da li je konfigurisano + javni
 * podaci primaoca i limiti). Dok račun nije podešen, `konfigurisan=false` i
 * klijent prikaže poruku „uskoro".
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const cfg = dohvatiIpsConfig();
  if (!cfg || !ipsAktivno()) {
    return NextResponse.json({ konfigurisan: false });
  }
  return NextResponse.json({
    konfigurisan: true,
    racun: cfg.racun,
    primalac: cfg.primalac,
    minRSD: MIN_IPS_RSD,
    maxRSD: cfg.maxRSD,
  });
}

/**
 * POST — najava donacije (set 5.0.9). Svaka donacija dobija POSEBAN poziv na broj
 * (donacije čl. 4 st. 3): model 97 nad "1" + redni broj zapisa. Vraća podatke za uplatu
 * (primalac, račun, iznos, svrha, poziv na broj) i, kad je IPS podešen, IPS string za
 * QR. Bez IPS-a radi nalog za prenos sa računa — isti podaci, bez QR koda.
 * POEN se ovde NE evidentira: donator posle uplate šalje potvrdu (`/api/donacije/potvrda`).
 *
 * 🔴 Najava bez poslate potvrde se ponovo koristi (novi iznos, isti poziv na broj), da se
 * ne gomilaju napušteni zapisi. Najava za koju je potvrda poslata se ne dira.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Donirati sme i korisnik koga niko nije uveo u Kolo (R-01, mera M-9).

  const cfg = dohvatiIpsConfig();
  const ips = cfg && ipsAktivno() ? cfg : null;

  let body: { iznosRSD?: unknown; javno?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  const iznosRSD = Math.round(Number(body.iznosRSD));
  const max = ips?.maxRSD ?? Number.MAX_SAFE_INTEGER;
  if (!Number.isFinite(iznosRSD) || iznosRSD < MIN_IPS_RSD) {
    return await greska(`Najmanji iznos donacije je ${MIN_IPS_RSD.toLocaleString("sr-RS")} RSD (Pravilnik o pokroviteljstvu i donacijama čl. 3).`, 400);
  }

  // Javna donacija (default) nosi POEN i javno ime; anonimna ne nosi POEN.
  const javno = body.javno !== false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      maloletan: true,
      wallet: { select: { id: true } },
      podaci: { select: { punoIme: true } },
    },
  });
  if (!user?.wallet) {
    return await greska("Član nema zapis u Protokolu.", 400);
  }
  if (user.maloletan) return await greska(PORUKA_DETE_NE_DONIRA, 403);

  // Javna donacija zahteva uneto ime i prezime (čl. 7 st. 1) — provera PRE najave.
  if (javno && !user.podaci?.punoIme?.trim()) {
    return NextResponse.json(
      {
        error:
          "Za javnu donaciju (sa POEN) unesite ime i prezime u profilu, ili izaberite anonimnu donaciju (bez POENA).",
        trebaPunoIme: true,
      },
      { status: 400 }
    );
  }

  const postojeca = await prisma.donationRecord.findFirst({
    where: { userId: user.id, status: "PENDING", nacinUplate: "IPS", potvrdaPoslataAt: null, potvrdaHash: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, pozivBroj: true },
  });
  const zapis = postojeca
    ? await prisma.donationRecord.update({
        where: { id: postojeca.id },
        data: { amountRSD: iznosRSD, javno, createdAt: new Date() },
        select: { id: true, pozivBroj: true },
      })
    : await prisma.donationRecord.create({
        data: {
          userId: user.id,
          amountRSD: iznosRSD,
          cumulativeRSD: 0,
          level: 0,
          poenEmitted: 0,
          javno,
          status: "PENDING",
          nacinUplate: "IPS",
          provajder: "IPS",
        },
        select: { id: true, pozivBroj: true },
      });
  const pozivNaBroj = pozivNaBrojZaDonaciju(zapis.pozivBroj);
  await prisma.donationRecord.update({ where: { id: zapis.id }, data: { referenceNumber: pozivNaBroj } });

  // QR samo dok je iznos u granici instant plaćanja; iznad nje ide nalog za prenos.
  const ipsString = ips && iznosRSD <= max ? sklopiIpsString({ cfg: ips, iznosRSD, pozivNaBroj }) : null;

  return NextResponse.json({
    donationId: zapis.id,
    ipsString,
    racun: ips?.racun ?? RACUN_FONDACIJE,
    primalac: ips?.primalac ?? null,
    svrha: ips?.svrha ?? "Donacija",
    iznosRSD,
    model: "97",
    pozivNaBroj,
  });
}
