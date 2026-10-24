import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { granicePeriodaGlasanja } from "@/lib/protokol/glasanje";
import { dohvatiFazuStatus } from "@/lib/protokol/faza-sistema";
import { registarPredloga } from "@/lib/protokol/nabavka";

/**
 * POST /api/admin/nabavke/izbor
 *
 * Pokreće izborno glasanje o predmetu nabavke (čl. 12 st. 1, Gornje Kolo čl. 8 st. 4).
 *
 * 🔴 Vrstu `IZBOR_NABAVKE` stvara ISKLJUČIVO server, nikad klijent kroz opšti
 * obrazac predloga: listić tada nije „za/protiv" nego izbor jedne reči iz registra,
 * pa predlog te vrste poslat spolja ne bi imao registar iza sebe.
 *
 * U Fazi 1 Gornje Kolo ne glasa; tada istu odluku donosi Upravni odbor, po istom
 * postupku i uz istu objavu (čl. 12 st. 2) — kroz `POST /api/admin/nabavke`.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);

  const faza = await dohvatiFazuStatus();
  if (faza.faza !== "FAZA_2") {
    return await greska(
      "Gornje Kolo glasa tek u Fazi 2. Do tada predmet nabavke određuje Upravni odbor (čl. 12 st. 2).",
      403
    );
  }

  const registar = await registarPredloga();
  if (registar.length === 0) return await greska("Registar predloga je prazan.", 400);

  const otvoreno = await prisma.glasanjePredlog.findFirst({
    where: { vrsta: "IZBOR_NABAVKE", status: "ACTIVE" },
    select: { id: true },
  });
  if (otvoreno) return await greska("Izborno glasanje o nabavci je već u toku.", 409);

  const { glasanjePocetak, deadline } = granicePeriodaGlasanja(new Date());
  const predlog = await prisma.glasanjePredlog.create({
    data: {
      title: "Izbor predmeta kolektivne nabavke",
      description:
        "Bira se jedan naziv dobra iz registra predloga. Izabran je naziv sa najvećim zbirom glasačke moći; " +
        "pri izjednačenosti prevagne veći broj različitih predlagača, pa raniji upis u registar (čl. 13).",
      vrsta: "IZBOR_NABAVKE",
      authorId: session.user.id,
      glasanjePocetak,
      deadline,
    },
  });

  await logAdminAkcija(session.user.id, "NABAVKA_IZBOR_POKRENUT", predlog.id, `${registar.length} mogućnosti`);
  return NextResponse.json({ ok: true, id: predlog.id, mogucnosti: registar.length });
}
