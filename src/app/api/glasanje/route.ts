import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  rokoviPredloga,
  zatvoriIstekleIObjaviIshod,
  postojiSkoroOdbijen,
  imaPredlogUPostupku,
  jeUSastavuGornjegKola,
  dohvatiPredlogeZaPrikaz,
} from "@/lib/protokol/glasanje";
import { dohvatiFazuStatus } from "@/lib/protokol/faza-sistema";
import { ucitajStatus } from "@/lib/protokol/status";
import { smePodnetiPredlog, vidiPseudonimeGornjegKola } from "@/lib/gornje-kolo-pravila";

// GET /api/glasanje — lista predloga. Predlozi, broj podrški i zbirovi su dostupni
// korisnicima; pseudonime predlagača i onih koji su podržali vide samo učesnici
// (Pravilnik o Gornjem Kolu čl. 9 st. 3, 10 st. 5, 19 st. 2).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const status = await ucitajStatus(session.user.id);
  const predlozi = await dohvatiPredlogeZaPrikaz(session.user.id, vidiPseudonimeGornjegKola(status));
  return NextResponse.json({ predlozi });
}

// POST /api/glasanje — podnošenje predloga (Pravilnik o Gornjem Kolu čl. 9)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  // Gornje Kolo postoji tek u Fazi 2 (Pravilnik čl. 41–42; Gornje Kolo čl. 3)
  const faza = await dohvatiFazuStatus();
  if (faza.faza !== "FAZA_2")
    return await greska("Gornje Kolo postoji tek u Fazi 2.", 403);

  // Predlog podnosi svaki učesnik (Pravilnik čl. 43 st. 2; Gornje Kolo čl. 9 st. 1).
  // Status se čita iz baze.
  const status = await ucitajStatus(session.user.id);
  if (!status || !smePodnetiPredlog(status))
    return await greska("Predlog podnosi učesnik: član bez potvrde, član Kola ili čuvar Kola.", 403);

  const body = await req.json();
  const title = (body.title ?? "").trim();
  const description = (body.description ?? "").trim();
  // Oznaka predlagača; vrsta odluke se određuje po predmetu (Gornje Kolo čl. 6 st. 2).
  const vrsta = body.vrsta === "DINARSKA_PREPORUKA" ? "DINARSKA_PREPORUKA" : "ODLUKA";

  if (!title || title.length < 5)
    return await greska("Naslov mora imati najmanje 5 znakova.", 400);
  if (!description || description.length < 20)
    return await greska("Opis mora imati najmanje 20 znakova.", 400);

  const now = new Date();
  await zatvoriIstekleIObjaviIshod(now);

  // Najviše jedan predlog o kome postupak još traje (čl. 9 st. 2)
  if (await imaPredlogUPostupku(session.user.id))
    return await greska("Već imaš predlog o kome postupak traje. Novi možeš podneti kad se on zatvori (čl. 9 Pravilnika o Gornjem Kolu).", 409);

  // Neusvojen ili nepodržan predlog iste sadržine ne sme ponovo pre 30 dana (čl. 13)
  if (await postojiSkoroOdbijen(title, now))
    return await greska("Predlog iste sadržine je nedavno zatvoren bez usvajanja. Ponovo se može podneti tek po isteku 30 dana (čl. 13 Pravilnika o Gornjem Kolu).", 400);

  // Rok ne određuje predlagač: podrška u narednom periodu, glasanje u periodu posle nje (čl. 10, 11)
  const rokovi = rokoviPredloga(now);

  // Predlog čuvara Kola u sastavu Gornjeg Kola smatra se podržanim njegovim podnošenjem (čl. 10 st. 1)
  const podrzanPodnosenjem = await jeUSastavuGornjegKola(session.user.id);

  const predlog = await prisma.$transaction(async (tx) => {
    const p = await tx.glasanjePredlog.create({
      data: { title, description, vrsta, authorId: session.user.id, ...rokovi },
    });
    if (podrzanPodnosenjem) {
      await tx.glasanjePodrska.create({
        data: { predlogId: p.id, userId: session.user.id, podnosenjem: true },
      });
    }
    return p;
  });

  return NextResponse.json({ ok: true, id: predlog.id, podrzanPodnosenjem });
}
