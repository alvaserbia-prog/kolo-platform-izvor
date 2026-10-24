import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import crypto from "node:crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  placanjeAktivno,
  dohvatiNestpayConfig,
  pripremiZahtev,
} from "@/lib/placanje/nestpay";
import {
  MAX_KARTICNA_UPLATA_RSD,
  MAX_KARTICNIH_UPLATA_DNEVNO,
} from "@/lib/donacija-pravila";

const MIN_RSD = 100;

/**
 * Inicira kartično plaćanje donacije. Kreira PENDING zapis donacije sa
 * jedinstvenim `oid`-om i vraća polja forme koja klijent (auto-)POST-uje na
 * NestPay gateway banke. POEN se NE emituje ovde — niti po povratku banke:
 * callback samo prevodi zapis u NAPLACENO, a POEN nastaje tek ljudskom potvrdom
 * u admin tabu (R-01, mera M-4a).
 *
 * Dve kočnice iz mere M-11, i one mere različite stvari: kapa po jednoj uplati
 * ograničava najgori pojedinačan gubitak po osporenoj transakciji, a brzinska
 * kočnica pokriva *card testing* — proveru ukradenih brojeva nizom sitnih
 * donacija, protiv koje kapa po transakciji ne radi ništa.
 *
 * Potvrda uplate više ne traži potvrđenu stvarnost (mera M-9): donirati sme i
 * član koga niko nije potvrdio. Time se ne otvara ništa drugo — prepis POEN-a,
 * nabavka i socijalni programi ostaju zatvoreni.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  if (!placanjeAktivno()) {
    return NextResponse.json(
      { error: "Kartično plaćanje trenutno nije aktivno. Koristite uplatu na račun.", nedostupno: true },
      { status: 503 }
    );
  }

  const cfg = dohvatiNestpayConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "Platni procesor nije konfigurisan.", nedostupno: true },
      { status: 503 }
    );
  }

  let body: { iznosRSD?: unknown; javno?: unknown; nepovratnost?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  const iznosRSD = Math.round(Number(body.iznosRSD));
  if (!Number.isFinite(iznosRSD) || iznosRSD < MIN_RSD || iznosRSD > MAX_KARTICNA_UPLATA_RSD) {
    return NextResponse.json(
      {
        error: `Iznos mora biti između ${MIN_RSD.toLocaleString("sr-RS")} i ${MAX_KARTICNA_UPLATA_RSD.toLocaleString("sr-RS")} RSD. Veći iznos ide uplatom na račun ili deviznom doznakom.`,
        kapa: MAX_KARTICNA_UPLATA_RSD,
      },
      { status: 400 }
    );
  }

  // Izjava o nepovratnosti (mera M-11) — dokaz u sporu po osporenoj transakciji.
  // Traži se PRE naplate i snima na zapis; posle naplate se ne može pribaviti.
  if (body.nepovratnost !== true) {
    return await greska(
      "Potvrdite da je donacija nepovratna i da njome ne dobijate robu ni uslugu.",
      400
    );
  }

  // Javna donacija (default) nosi POEN i javno ime; anonimna ne nosi POEN.
  const javno = body.javno !== false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      wallet: { select: { id: true } },
      podaci: { select: { punoIme: true } },
    },
  });
  if (!user?.wallet) {
    return await greska("Član nema zapis u Protokolu.", 400);
  }

  // Javna donacija zahteva uneto ime i prezime (čl. 5a) — provera PRE naplate.
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

  // Brzinska kočnica (mera M-11). Broje se SVI kartični zapisi od ponoći, bez
  // obzira na ishod — neuspeli pokušaji su ovde signal, ne izuzetak, jer se
  // ukradeni brojevi kartica proveravaju upravo neuspesima.
  const ponoc = new Date();
  ponoc.setHours(0, 0, 0, 0);
  const danasKartica = await prisma.donationRecord.count({
    where: { userId: user.id, nacinUplate: "KARTICA", createdAt: { gte: ponoc } },
  });
  if (danasKartica >= MAX_KARTICNIH_UPLATA_DNEVNO) {
    return await greska(
      `Dostigli ste dnevno ograničenje kartičnih uplata (${MAX_KARTICNIH_UPLATA_DNEVNO}). Pokušajte sutra ili uplatite na račun.`,
      429
    );
  }

  // Jedinstveni broj porudžbine (oid) — bez separatora, alfanumerički.
  const oid = `KOLO${Date.now().toString(36).toUpperCase()}${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;

  await prisma.donationRecord.create({
    data: {
      userId: user.id,
      amountRSD: iznosRSD,
      cumulativeRSD: 0,
      level: 0,
      poenEmitted: 0,
      javno,
      status: "PENDING",
      nacinUplate: "KARTICA",
      provajder: cfg.provajder,
      oid,
      nepovratnostPotvrdjenaAt: new Date(),
    },
  });

  const base =
    process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const callback = `${base.replace(/\/$/, "")}/api/donacije/placanje/povratak`;

  const { gatewayUrl, fields } = pripremiZahtev(cfg, {
    oid,
    iznosRSD,
    okUrl: callback,
    failUrl: callback,
    email: user.email ?? undefined,
    lang: "sr",
  });

  return NextResponse.json({ gatewayUrl, fields });
}
