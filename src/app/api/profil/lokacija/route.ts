import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razresiNaselje, PORUKA_MESTO_IZ_SPISKA } from "@/lib/naselje";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const body = await req.json();
  const location = typeof body.location === "string" ? body.location.trim() : null;
  const telefon = typeof body.telefon === "string" ? body.telefon.trim() : null;

  if (location !== null && location.length > 80) {
    return await greska("Lokacija je predugačka.", 400);
  }
  if (telefon !== null && !/^[+]?[\d\s\-().]{6,20}$/.test(telefon) && telefon !== "") {
    return await greska("Neispravan format telefona.", 400);
  }

  const trenutni = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { location: true, telefonZaPozivAt: true },
  });

  // Posle ulaska na spisak za poziv mesto i broj se menjaju, ali ne brišu (set 4.8.4,
  // N4-M2; dokaz stvarnosti čl. 4a): porede se sa drugim nalozima radi sprečavanja
  // višestrukih naloga, a brišu se gašenjem naloga.
  if (trenutni?.telefonZaPozivAt && (telefon === "" || location === "")) {
    return await greska("Mesto i broj telefona su uz nalog od ulaska na spisak za poziv. Možeš da ih izmeniš, ali ne i da ih obrišeš.", 409);
  }

  // Novo mesto mora biti JEDNO naselje iz šifarnika (upisuje se kanonski naziv).
  // Zatečena vrednost se ne dira: nalozi upisani dok je polje bilo slobodan tekst
  // ne smeju da ostanu zaključani — izmena telefona ne sme da padne zbog stare
  // lokacije koju korisnik nije ni pipnuo.
  let mesto: string | null = null;
  if (location) {
    if (location === trenutni?.location) {
      mesto = location;
    } else {
      mesto = razresiNaselje(location);
      if (!mesto) return await greska(PORUKA_MESTO_IZ_SPISKA, 400);
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      location: mesto,
      telefon: telefon === "" ? null : telefon,
    },
  });

  return NextResponse.json({ ok: true });
}
