import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { KutijaGreska, kutijaZaDete, posaljiZelju } from "@/lib/protokol/kutija-zelja";

/**
 * Kutija želja u dečjem prostoru (whitepaper 5.0, pogl. 7).
 *
 * GET  — prikazani predlozi (po broju podrški) i sopstveni predlozi deteta.
 * POST — nov predlog `{ tekst }`; ide na pregled Fondacije pre prikaza.
 *
 * 🔴 Vidljivost sprovodi server (`deteUKutijiIliBaci`): punoletni nalog i dete na
 * čekanju dobijaju 403. Autor predloga se ne vraća — ni kao id.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  try {
    return NextResponse.json(await kutijaZaDete(session.user.id));
  } catch (e) {
    if (e instanceof KutijaGreska) return await greska(e.message, e.status);
    throw e;
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const body = await req.json().catch(() => ({}));
  try {
    return NextResponse.json(await posaljiZelju(session.user.id, body?.tekst));
  } catch (e) {
    if (e instanceof KutijaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
