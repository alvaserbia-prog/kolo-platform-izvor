import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MIN_IPS_RSD,
  ipsAktivno,
  dohvatiIpsConfig,
  pozivNaBrojZaClana,
  sklopiIpsString,
} from "@/lib/placanje/ips-qr";

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
 * POST — generiše dinamički IPS QR za donaciju. Poziv na broj je TRAJNI broj
 * člana (model 97 nad donatorskim brojem — isti kao za klasičnu uplatnicu);
 * kreira/ažurira PENDING najavu donacije i vraća IPS string (za QR) + podatke
 * za prikaz. POEN se NE emituje ovde — admin potvrđuje priliv po pozivu na
 * broj u admin panelu (kao i kod ručne uplate).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Donirati sme i član koga niko nije potvrdio (R-01, mera M-9).

  const cfg = dohvatiIpsConfig();
  if (!cfg || !ipsAktivno()) {
    return NextResponse.json(
      { error: "IPS plaćanje trenutno nije konfigurisano. Koristite uplatu na račun.", nedostupno: true },
      { status: 503 }
    );
  }

  let body: { iznosRSD?: unknown; javno?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  const iznosRSD = Math.round(Number(body.iznosRSD));
  if (!Number.isFinite(iznosRSD) || iznosRSD < MIN_IPS_RSD || iznosRSD > cfg.maxRSD) {
    return NextResponse.json(
      {
        error: `Iznos mora biti između ${MIN_IPS_RSD.toLocaleString("sr-RS")} i ${cfg.maxRSD.toLocaleString(
          "sr-RS"
        )} RSD. Veće iznose uplatite klasičnom uplatom ili karticom.`,
      },
      { status: 400 }
    );
  }

  // Javna donacija (default) nosi POEN i javno ime; anonimna ne nosi POEN.
  const javno = body.javno !== false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      donatorskiBroj: true,
      wallet: { select: { id: true } },
      podaci: { select: { punoIme: true } },
    },
  });
  if (!user?.wallet) {
    return await greska("Član nema zapis u Protokolu.", 400);
  }

  // Javna donacija zahteva uneto ime i prezime (čl. 5a) — provera PRE generisanja.
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

  // Trajni poziv na broj člana (model 97 nad donatorskim brojem) — isti za sve
  // uplate ovog korisnika, pa se priliv u izvodu uparuje direktno sa članom.
  const pozivNaBroj = pozivNaBrojZaClana(user.donatorskiBroj);

  // Jedna aktivna IPS najava po korisniku: postojeći PENDING zapis se ažurira
  // (novi iznos/vrsta) umesto da se gomilaju napušteni zapisi. Iznos najave je
  // ionako samo podsetnik — admin pri potvrdi upisuje iznos iz izvoda.
  const postojeca = await prisma.donationRecord.findFirst({
    where: { userId: user.id, status: "PENDING", nacinUplate: "IPS" },
    select: { id: true },
  });
  if (postojeca) {
    await prisma.donationRecord.update({
      where: { id: postojeca.id },
      data: { amountRSD: iznosRSD, javno, referenceNumber: pozivNaBroj, createdAt: new Date() },
    });
  } else {
    await prisma.donationRecord.create({
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
        referenceNumber: pozivNaBroj,
      },
    });
  }

  const ipsString = sklopiIpsString({ cfg, iznosRSD, pozivNaBroj });

  return NextResponse.json({
    ipsString,
    racun: cfg.racun,
    primalac: cfg.primalac,
    svrha: cfg.svrha,
    iznosRSD,
    model: "97",
    pozivNaBroj,
  });
}
