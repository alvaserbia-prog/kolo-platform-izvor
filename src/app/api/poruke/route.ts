import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { smeProsireno } from "@/lib/dozvole";
import { prisma } from "@/lib/prisma";
import { smePokrenutiRazgovor, ucitajUcesnika } from "@/lib/protokol/deca";
import { pocetakDana } from "@/lib/potvrde-dnevno-pravila";
import { PORUKA_RASKINUTO, raskinutoIzmedju, suPrijatelji } from "@/lib/protokol/prijateljstva";

// GET — lista konverzacija za trenutnog korisnika
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Unauthorized", 401);
  const meId = session.user.id;

  const konverzacije = await prisma.konverzacija.findMany({
    where: { OR: [{ user1Id: meId }, { user2Id: meId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      user1: { select: { id: true, pseudonim: true, avatar: true } },
      user2: { select: { id: true, pseudonim: true, avatar: true } },
      poruke: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { tekst: true, posiljacId: true, createdAt: true, procitana: true },
      },
    },
  });

  const data = konverzacije.map((k) => {
    const drugiUser = k.user1Id === meId ? k.user2 : k.user1;
    const poslednja = k.poruke[0] ?? null;
    const neprocitano = k.poruke.filter((p) => !p.procitana && p.posiljacId !== meId).length;
    return {
      id: k.id,
      drugiId: drugiUser.id,
      drugiPseudonim: drugiUser.pseudonim,
      drugiAvatar: drugiUser.avatar,
      poslednjaPorukaIznos: poslednja?.tekst ?? null,
      poslednjaPosiljacJa: poslednja?.posiljacId === meId,
      poslednjeVreme: poslednja?.createdAt.toISOString() ?? k.createdAt.toISOString(),
      neprocitano,
    };
  });

  // `maloletan` ide klijentu da bi ekran znao ŠTA da ponudi umesto pretrage
  // članova: detetu se ne prikazuje rečenica o „redovnim članovima" (za njega je
  // neistinita — piše svakom svom prijatelju), nego spisak njegovih prijatelja.
  const ja = await prisma.user.findUnique({
    where: { id: meId },
    select: { maloletan: true },
  });

  return NextResponse.json({
    konverzacije: data,
    verified: session.user.verified,
    maloletan: ja?.maloletan ?? false,
  });
}

// POST — otvori ili kreiraj konverzaciju sa korisnikom (po userId)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Unauthorized", 401);
  // INICIRANJE razgovora (Uslovi čl. 16 st. 5, set 4.8.1): potvrđen član piše kome
  // hoće; nov član prvi piše samo oglašivaču povodom njegovog oglasa, najviše
  // `NOVIH_RAZGOVORA_DNEVNO` novih razgovora dnevno. U razgovoru koji je neko drugi
  // pokrenuo nov član SME da odgovara — POST /api/poruke/[konvId] proverava samo
  // članstvo u razgovoru.
  const meId = session.user.id;

  // ── Modul Deca (čl. 12) ───────────────────────────────────────────────────
  //
  // Maloletni korisnik JESTE neverifikovan u smislu šeme, ali u dečjem prostoru sme
  // sam da pokrene razgovor. Zato se za parove u kojima ima deteta odlučuje po
  // `smeDaKomunicira`, a opšte pravilo o verifikaciji ostaje za sve ostale.
  const jaUcesnik = await ucitajUcesnika(meId);
  if (!jaUcesnik) return await greska("Nalog ne postoji.", 401);

  // `oglasId` je opcion i šalje se kad razgovor kreće sa stranice oglasa — služi
  // samo prikazu povoda u razgovoru. Razgovor se otvara i bez njega.
  const { userId, oglasId } = await req.json();
  if (!userId || userId === meId)
    return await greska("Neispravan korisnik.", 400);

  const drugiUcesnik = await ucitajUcesnika(userId);
  if (!drugiUcesnik) return await greska("Korisnik ne postoji.", 404);

  // Uvek sortiraj IDs da bi @@unique radio
  const [u1, u2] = [meId, userId].sort();
  const postojeci = await prisma.konverzacija.findUnique({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    select: { id: true },
  });

  // Povod razgovora — prihvata se samo ako oglas stvarno pripada drugoj strani:
  // inače bi se moglo prikačiti bilo šta (i zaobići uslov za novog člana).
  let povodOglasId: string | null = null;
  if (typeof oglasId === "string" && oglasId) {
    const oglas = await prisma.marketplaceListing.findFirst({
      where: { id: oglasId, sellerId: userId },
      select: { id: true },
    });
    povodOglasId = oglas?.id ?? null;
  }

  // `smePokrenutiRazgovor` nosi SVE uslove — potvrđen ili nov član (povod i dnevni
  // limit) za punoletne i `smeDaKomunicira` za parove sa detetom (koji sam odbija
  // nalog što još čeka roditelja). Isti poziv radi i ekran Pijace, pa dugme ne
  // može ponovo postati strože od rute. Već postojeći razgovor se ne broji.
  const potvrdjen = smeProsireno(session.user);
  const pokrenutihDanas =
    potvrdjen || postojeci
      ? 0
      : await prisma.konverzacija.count({ where: { pokrenuoId: meId, createdAt: { gte: pocetakDana() } } });
  // Dete sa roditeljem piše samo svojim prijateljima (Pravilnik o učešću dece
  // čl. 4c t. 2, 12 st. 6) — prijateljstvo se čita samo kad su obe strane deca.
  const prijatelji =
    jaUcesnik.maloletan && drugiUcesnik.maloletan ? await suPrijatelji(jaUcesnik.id, drugiUcesnik.id) : false;
  const dozvoljeno = postojeci
    ? smePokrenutiRazgovor(jaUcesnik, drugiUcesnik, true, undefined, prijatelji)
    : smePokrenutiRazgovor(
        jaUcesnik,
        drugiUcesnik,
        potvrdjen,
        { povodOglasom: povodOglasId !== null, pokrenutihDanas },
        prijatelji,
      );
  if (!dozvoljeno.ok) return await greska(dozvoljeno.razlog, dozvoljeno.status);

  // Raskinut par ne otvara nov razgovor — inače bi se ugašeni razgovor zaobišao
  // u jednom kliku sa oglasa.
  if (
    jaUcesnik.maloletan &&
    drugiUcesnik.maloletan &&
    (await raskinutoIzmedju(jaUcesnik.id, drugiUcesnik.id))
  ) {
    return await greska(PORUKA_RASKINUTO, 403);
  }

  const konv = await prisma.konverzacija.upsert({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    create: { user1Id: u1, user2Id: u2, povodOglasId, pokrenuoId: meId },
    // Klik sa drugog oglasa zamenjuje povod koji još nije iskorišćen; klik bez
    // oglasa (pretraga člana) ne briše onaj koji čeka.
    update: povodOglasId ? { povodOglasId } : {},
    select: { id: true },
  });


  return NextResponse.json({ konverzacijaId: konv.id });
}
