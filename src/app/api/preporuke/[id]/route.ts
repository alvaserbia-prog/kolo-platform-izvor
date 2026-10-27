/**
 * /api/preporuke/[id] — preporuka člana (dokaz stvarnosti čl. 20, set 4.8.0).
 *
 * POST daje preporuku, DELETE je povlači. `[id]` je adresa profila (pseudonim ili
 * interni id), ista kao u `/profil/[id]`. Preporuka se daje sa profila: važi kapija
 * zatvorenog profila deteta, a preporuku daje samo član Kola, odnosno osnivač
 * (dokaz stvarnosti čl. 20 st. 1; set 4.8.2 — `session.user.potvrdjen`). Servis
 * (`smePreporuciti`) to proverava ponovo iz baze.
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";
import { razresiKorisnikaIzAdrese } from "@/lib/pseudonim";
import { pristupProfiluDeteta } from "@/lib/protokol/deca";
import {
  PreporukaGreska,
  dajPreporuku,
  povuciPreporuku,
  stanjePreporuka,
} from "@/lib/protokol/preporuka";

async function cilj(params: Promise<{ id: string }>) {
  const session = await getServerSession(authOptions);
  if (!session) return { odgovor: await greska("Nije prijavljen.", 401) };
  if (!session.user.potvrdjen) return { odgovor: await greska("Preporuku daje član Kola.", 403) };
  const { id: adresa } = await params;
  const zaId = await razresiKorisnikaIzAdrese(adresa);
  if (!zaId) return { odgovor: await greska("Profil nije pronađen.", 404) };
  const pristup = await pristupProfiluDeteta(session.user.id, zaId, jeAdmin({ admin: session.user.admin }));
  if (!pristup.sme) return { odgovor: await greska("Profil nije pronađen.", 404) };
  return { odId: session.user.id, zaId };
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await cilj(params);
  if ("odgovor" in c) return c.odgovor;
  try {
    await dajPreporuku(c.odId, c.zaId);
  } catch (e) {
    if (e instanceof PreporukaGreska) return await greska(e.message, e.statusCode);
    throw e;
  }
  return NextResponse.json(await stanjePreporuka(c.odId, c.zaId, true));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const c = await cilj(params);
  if ("odgovor" in c) return c.odgovor;
  await povuciPreporuku(c.odId, c.zaId);
  return NextResponse.json(await stanjePreporuka(c.odId, c.zaId, true));
}
