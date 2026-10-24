import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — sačuvaj (ili osveži) Web Push pretplatu trenutnog korisnika.
// Telo: { subscription: PushSubscriptionJSON, userAgent?: string }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Unauthorized", 401);

  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; userAgent?: string };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravno telo.", 400);
  }

  const sub = body.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return await greska("Nepotpuna pretplata.", 400);
  }

  // Upsert po endpoint-u: isti uređaj koji se ponovo pretplati ne pravi duplikat,
  // a vlasništvo se prebacuje na trenutnog korisnika (npr. deljeni uređaj).
  await prisma.pushPretplata.upsert({
    where: { endpoint },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh,
      auth,
      userAgent: typeof body.userAgent === "string" ? body.userAgent.slice(0, 255) : null,
    },
    update: {
      userId: session.user.id,
      p256dh,
      auth,
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE — ukloni pretplatu (korisnik isključio obaveštenja na ovom uređaju).
// Telo: { endpoint: string }
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Unauthorized", 401);

  let endpoint: string | undefined;
  try {
    const body = await req.json();
    endpoint = typeof body?.endpoint === "string" ? body.endpoint : undefined;
  } catch {
    // bez tela → ništa za brisanje
  }
  if (!endpoint) return await greska("Nedostaje endpoint.", 400);

  await prisma.pushPretplata.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
