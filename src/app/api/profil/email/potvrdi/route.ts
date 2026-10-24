import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { PotvrdaGreska, potvrdiAdresu } from "@/lib/protokol/potvrda-adrese";

/**
 * POST /api/profil/email/potvrdi — potvrda adrese linkom iz poruke.
 *
 * 🔴 POST, ne GET. Klijenti za poštu prefetch-uju linkove, pa bi GET potvrđivao
 * adresu bez ijednog ljudskog klika. Isti razlog kao kod odjave sa obaveštenja.
 *
 * Ne traži prijavu: link stiže u sanduče, a otvara se često na drugom uređaju.
 * Sam token je dokaz da je onaj ko ga drži pristupio toj adresi.
 */
export async function POST(req: NextRequest) {
  // 🔴 Bez gejta za Modul Deca. Do R-06 je potvrda služila samo nalogu deteta, pa
  // je ruta padala na 410 kad je modul ugašen; sada se istim linkom potvrđuje i
  // adresa punoletnog naloga pri registraciji (Uslovi čl. 9), što sa modulom nema
  // veze. Sam tok i dalje odbija nalog koji ne odgovara tokenu.

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }

  try {
    return NextResponse.json(await potvrdiAdresu(body.token));
  } catch (e) {
    if (e instanceof PotvrdaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
