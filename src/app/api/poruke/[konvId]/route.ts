import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zakaziPush } from "@/lib/push";
import { posaljiEmailKorisniku } from "@/lib/email";
import { smeDaKomunicira, ucitajUcesnika } from "@/lib/protokol/deca";
import { PORUKA_RASKINUTO, raskinutoIzmedju, suPrijatelji } from "@/lib/protokol/prijateljstva";
import { obavesti } from "@/lib/notifikacije";

async function getKonv(konvId: string, meId: string) {
  const k = await prisma.konverzacija.findUnique({ where: { id: konvId } });
  if (!k || (k.user1Id !== meId && k.user2Id !== meId)) return null;
  return k;
}

// GET — poruke u konverzaciji (poslednjih 50)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ konvId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Unauthorized", 401);
  const { konvId } = await params;

  const k = await getKonv(konvId, session.user.id);
  if (!k) return await greska("Konverzacija nije pronađena.", 404);

  const drugiId = k.user1Id === session.user.id ? k.user2Id : k.user1Id;
  const [drugiUser, jaUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: drugiId },
      select: { id: true, pseudonim: true, avatar: true, maloletan: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true, maloletan: true },
    }),
  ]);

  // Modul Deca, čl. 9 st. 3: kad punoletni korisnik piše detetu, u razgovoru mu
  // stoji vidljiv natpis da razgovor čita roditelj. To je i odvraćanje i poštenje —
  // ko piše detetu, treba da zna pred kim piše.
  const roditeljCita = (drugiUser?.maloletan ?? false) && !(jaUser?.maloletan ?? false);

  // Razgovor ugašen raskidom prijateljstva — polje za pisanje se ne prikazuje.
  const razgovorZatvoren =
    (drugiUser?.maloletan ?? false) &&
    (jaUser?.maloletan ?? false) &&
    (await raskinutoIzmedju(session.user.id, drugiId));

  const poruke = await prisma.poruka.findMany({
    where: { konverzacijaId: konvId },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      tekst: true,
      posiljacId: true,
      procitana: true,
      createdAt: true,
      // Povod razgovora: kartica oglasa stoji iznad poruke kojom je pokrenut,
      // da se i posle mesec dana zna o čemu se pričalo.
      oglas: { select: { id: true, title: true, images: true } },
    },
  });

  // Označi primljene poruke kao pročitane
  await prisma.poruka.updateMany({
    where: { konverzacijaId: konvId, posiljacId: drugiId, procitana: false },
    data: { procitana: true },
  });

  // Povod koji još čeka na prvu poruku — podsetnik iznad polja za kucanje.
  const cekaPovod = await prisma.konverzacija.findUnique({
    where: { id: konvId },
    select: { povodOglas: { select: { id: true, title: true, images: true, sellerId: true } } },
  });
  const povod =
    cekaPovod?.povodOglas && cekaPovod.povodOglas.sellerId !== session.user.id
      ? { id: cekaPovod.povodOglas.id, naslov: cekaPovod.povodOglas.title, imaSliku: cekaPovod.povodOglas.images.length > 0 }
      : null;

  return NextResponse.json({
    drugiUser,
    roditeljCita,
    razgovorZatvoren,
    povod,
    mojAvatar: jaUser?.avatar ?? null,
    mojPseudonim: session.user.pseudonim,
    poruke: poruke.map((p) => ({
      id: p.id,
      tekst: p.tekst,
      moja: p.posiljacId === session.user.id,
      createdAt: p.createdAt.toISOString(),
      oglas: p.oglas ? { id: p.oglas.id, naslov: p.oglas.title, imaSliku: p.oglas.images.length > 0 } : null,
    })),
  });
}

// POST — pošalji poruku
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ konvId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Unauthorized", 401);
  const { konvId } = await params;

  // Slanje je dozvoljeno svakom UČESNIKU konverzacije (getKonv to proverava).
  // Neverifikovani NE MOŽE da inicira konverzaciju (vidi POST /api/poruke), pa
  // može biti učesnik samo u konverzaciji koju je verifikovani pokrenuo povodom
  // njegovog zahteva za jemstvo (Uslovi čl. 16, Politika čl. 6) — tu sme da uzvrati.
  const k = await getKonv(konvId, session.user.id);
  if (!k) return await greska("Konverzacija nije pronađena.", 404);

  // ── Modul Deca (čl. 12) ───────────────────────────────────────────────────
  //
  // 🔴 Ovlašćenje za pisanje se proverava PRI SVAKOJ PORUCI, ne samo pri otvaranju
  // razgovora. Bez toga bi zatečen razgovor nastavio da radi i pošto roditelj povuče
  // saglasnost — pravila bi važila samo dok neko ne otvori staru prepisku.
  const drugiUcesnikId = k.user1Id === session.user.id ? k.user2Id : k.user1Id;
  const [jaUcesnik, drugiUcesnik] = await Promise.all([
    ucitajUcesnika(session.user.id),
    ucitajUcesnika(drugiUcesnikId),
  ]);
  if (!jaUcesnik || !drugiUcesnik) return await greska("Konverzacija nije pronađena.", 404);
  if (jaUcesnik.maloletan || drugiUcesnik.maloletan) {
    // `smeDaKomunicira` sam odbija nalog koji još čeka roditelja (čl. 4c), a dete
    // sa roditeljem pušta samo prema prijatelju (čl. 4c t. 2, 12 st. 6).
    const prijatelji =
      jaUcesnik.maloletan && drugiUcesnik.maloletan
        ? await suPrijatelji(jaUcesnik.id, drugiUcesnik.id)
        : false;
    const dozvoljeno = smeDaKomunicira(jaUcesnik, drugiUcesnik, prijatelji);
    if (!dozvoljeno.ok) return await greska(dozvoljeno.razlog, dozvoljeno.status);
  }

  // Raskid prijateljstva gasi i zatečeni razgovor (odluka vlasnika, 31.08.2026).
  // Bez ovoga je jedini potez kojim se dete povlači od nekoga koštao 500 POENA i
  // nije prekidao ono zbog čega se povlači.
  if (
    jaUcesnik.maloletan &&
    drugiUcesnik.maloletan &&
    (await raskinutoIzmedju(jaUcesnik.id, drugiUcesnik.id))
  ) {
    return await greska(PORUKA_RASKINUTO, 403);
  }

  const { tekst } = await req.json();
  if (!tekst?.trim()) return await greska("Poruka ne sme biti prazna.", 400);
  if (tekst.trim().length > 1000) return await greska("Poruka je predugačka (max 1000 znakova).", 400);

  // Povod čeka otkad je kliknuto „Kontaktiraj". Troši ga PRVA poruka onoga ko
  // nije vlasnik oglasa — vlasnik odgovara na svoj oglas, njemu kartica ne treba.
  const konvPovod = await prisma.konverzacija.findUnique({
    where: { id: konvId },
    select: { povodOglasId: true, povodOglas: { select: { sellerId: true } } },
  });
  const povodOglasId =
    konvPovod?.povodOglasId && konvPovod.povodOglas?.sellerId !== session.user.id
      ? konvPovod.povodOglasId
      : null;

  const [poruka] = await prisma.$transaction([
    prisma.poruka.create({
      data: {
        konverzacijaId: konvId,
        posiljacId: session.user.id,
        tekst: tekst.trim(),
        oglasId: povodOglasId,
      },
    }),
    prisma.konverzacija.update({
      where: { id: konvId },
      // Povod je iskorišćen — briše se, da ga naredne poruke ne ponove.
      data: { lastMessageAt: new Date(), ...(povodOglasId ? { povodOglasId: null } : {}) },
    }),
  ]);

  // Nove poruke se NE evidentiraju kao notifikacije (zvonce) — nepročitane poruke
  // se broje crvenim badge-om na ikonici "Poruke" (GET /api/poruke/brojac).
  // Push na telefon primaoca (ako je uključio obaveštenja). `zakaziPush` koristi
  // `after()` da push preživi kraj serverless odgovora — inače se funkcija zamrzne
  // pre nego što webpush stigne da pošalje („push nekad ne stigne"). Ne blokira
  // odgovor.
  const primalacId = k.user1Id === session.user.id ? k.user2Id : k.user1Id;
  const isecak = poruka.tekst.length > 120 ? `${poruka.tekst.slice(0, 120)}…` : poruka.tekst;
  zakaziPush(primalacId, {
    naslov: `Nova poruka — ${session.user.pseudonim}`,
    tekst: isecak,
    link: `/poruke?k=${konvId}`,
    tip: "poruka",
  });

  // Email primaocu — samo za PRVU nepročitanu poruku u nizu. Dok primalac ne
  // otvori konverzaciju, dalje poruke ne šalju mejl (inače bi razgovor od deset
  // poruka poslao deset mejlova). Kad pročita, sledeća poruka opet šalje.
  void (async () => {
    try {
      const neprocitane = await prisma.poruka.count({
        where: {
          konverzacijaId: konvId,
          posiljacId: session.user.id,
          procitana: false,
          id: { not: poruka.id },
        },
      });
      if (neprocitane > 0) return;
      await posaljiEmailKorisniku(primalacId, {
        naslov: `Nova poruka — ${session.user.pseudonim}`,
        tekst: isecak,
        link: `/poruke?k=${konvId}`,
        linkTekst: "Otvori poruku",
      });
    } catch (err) {
      console.error("[poruke] Email obaveštenje nije poslato:", err);
    }
  })();

  // Modul Deca, čl. 9 st. 4: roditelj se obaveštava SAMO pri prvom javljanju u
  // novom razgovoru sa punoletnim licem. Svaka poruka bi značila da roditelj prati
  // ritam prepiske, a on je ni ne čita — ono što mu treba je da zna da je razgovor
  // uopšte počeo. Ne baca i ne blokira odgovor.
  void obavestiRoditeljeONovomRazgovoru(konvId, session.user.id, jaUcesnik, drugiUcesnik);

  return NextResponse.json({
    id: poruka.id,
    tekst: poruka.tekst,
    moja: true,
    createdAt: poruka.createdAt.toISOString(),
  });
}

/** Prvo javljanje punoletnog lica u razgovoru sa detetom — roditeljima ide zvonce. */
async function obavestiRoditeljeONovomRazgovoru(
  konvId: string,
  posiljacId: string,
  ja: { maloletan: boolean; roditeljIds: string[] },
  drugi: { id: string; maloletan: boolean; roditeljIds: string[] },
) {
  try {
    if (ja.maloletan === drugi.maloletan) return;
    const dete = ja.maloletan ? { id: posiljacId, roditeljIds: ja.roditeljIds } : drugi;
    const brojPoruka = await prisma.poruka.count({ where: { konverzacijaId: konvId } });
    if (brojPoruka !== 1) return;

    const [deteUser, drugiUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: dete.id }, select: { pseudonim: true } }),
      prisma.user.findUnique({
        where: { id: dete.id === posiljacId ? drugi.id : posiljacId },
        select: { pseudonim: true },
      }),
    ]);
    for (const roditeljId of dete.roditeljIds) {
      await obavesti(roditeljId, {
        tip: "dete_razgovor_odrasli",
        kljuc: "notifikacije.dete_razgovor_odrasli",
        parametri: { dete: deteUser?.pseudonim ?? "", pseudonim: drugiUser?.pseudonim ?? "" },
        naslov: "Nov razgovor tvog deteta sa punoletnim korisnikom",
        tekst: `${deteUser?.pseudonim ?? "Tvoje dete"} vodi razgovor sa korisnikom ${drugiUser?.pseudonim ?? "?"}. Razgovor možeš da pročitaš na profilu deteta.`,
        link: `/deca/${dete.id}`,
      }).catch(() => {});
    }
  } catch (e) {
    console.error("[poruke] Obaveštenje roditelju nije poslato:", e);
  }
}
