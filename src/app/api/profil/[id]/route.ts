import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getLocale } from "next-intl/server";
import { opisTransakcije } from "@/lib/prevod-servera";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin, smeProsireno } from "@/lib/dozvole";
import { razresiKorisnikaIzAdrese } from "@/lib/pseudonim";
import { pristupProfiluDeteta } from "@/lib/protokol/deca";
import { razresiSkolu } from "@/lib/skola";
import { stanjePreporuka } from "@/lib/protokol/preporuka";
import { ucitajStatus } from "@/lib/protokol/status";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id: adresa } = await params;

  // U adresi stoji pseudonim (`/profil/Marko`), ali i dalje rade interni id (stari
  // linkovi, linkovi zapisani u notifikacijama) i napušteni pseudonim (link podeljen
  // pre preimenovanja). Sve troje se ovde svodi na interni id.
  const id = await razresiKorisnikaIzAdrese(adresa);
  if (!id) {
    return await greska("Profil nije pronađen.", 404);
  }

  // Kapija "samo verifikovani vide profile" odnosi se na TUĐE profile (Pravilnik čl. 28–30,
  // 67): nepotvrđen član ne vidi pseudonime/profile drugih. Sopstveni profil korisnik uvek
  // sme da vidi — inače bi klik na "Moj profil" blokirao i njega samog.
  //
  // R-01, mera M-9: članu čiji je identitet utvrđen na donatorskom putu profil se
  // OTVARA, ali OLJUŠTEN — vidi ono što mu treba da bi stupio u kontakt povodom
  // oglasa (pseudonim, oglasi, dugme za kontakt), a ne stanje POEN-a, ZRNO i rang,
  // istoriju i telefon. Isti obrazac kao zatvoren profil maloletnog korisnika:
  // odluka je NA SERVERU, ne u komponenti.
  // 🔴 Od seta 4.8.1 (odluka vlasnika 20.10.2026) sužen pregled dobija i NOV ČLAN:
  // pseudonim, slika, mesto (ako ga je vlasnik odlučio da prikaže), status, od kada
  // je član, aktivni oglasi i broj preporuka (Uslovi čl. 17 st. 2). Stanje POEN-a,
  // istorija, rang, telefon, ime, opis i veza roditelj–dete ostaju potvrđenima.

  // Modul Deca: profil maloletnog korisnika punoletni članovi NE otvaraju
  // (Pravilnik o učešću dece — član o pristupu profilu maloletnog korisnika).
  //
  // 🔴 Provera je OVDE, na serveru, a ne u komponenti: ekran nije poslednja reč, a
  // ovo je jedina odbrana koju dete ima od nepoznatog odraslog. Umesto profila se
  // vraća sadržaj zatvorenog prikaza (200, ne 403) — stranica mora da objasni
  // zašto i da imenuje roditelja, inače izgleda kao kvar.
  const pristup = await pristupProfiluDeteta(
    session.user.id,
    id,
    jeAdmin({ admin: session.user.admin })
  );
  if (!pristup.sme) {
    return NextResponse.json({ zatvoren: pristup.zatvoren });
  }

  // Vlasnik na sopstvenom profilu vidi SVE svoje podatke bez obzira na togglove
  // vidljivosti; togglovi i dalje važe za druge posetioce.
  const jeVlasnik = id === session.user.id;

  const korisnik = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      pseudonim: true,
      // Modul Deca: profil maloletnog korisnika ne prikazuje indeks stvarnosti ni
      // lanac potvrda — dete nikoga ne potvrđuje i njega niko ne potvrđuje (čl. 15).
      maloletan: true,
      verified: true,
      verifiedAt: true,
      location: true,
      telefon: true,
      avatar: true,
      createdAt: true,
      tipKorisnika: true,
      status: true,
      // Škola maloletnog korisnika (čl. 7). Ovde stoji šifra; naziv i mesto se
      // razrešavaju iz šifarnika u aplikaciji, jer sistem o školi ne čuva ništa
      // svoje. Punoletan nalog je nema.
      skolaSifra: true,
      // Veza roditelj–dete je javna u OBA smera (odluka vlasnika): sa deteta se vidi
      // roditelj, sa roditelja se vidi ko su mu deca.
      //
      // 🔴 Posledica koja je svesno prihvaćena: time deca postaju popisiva preko
      // odraslih. Zaštitu tada ne nosi skrivenost nego ZATVOREN PROFIL (vidi
      // `pristupProfiluDeteta`) i roditeljski prekidač iz čl. 10 — spisak pokazuje
      // da dete postoji, ali ni sa jednog reda ne vodi nigde.
      roditeljstvaKaoDete: {
        select: { roditelj: { select: { id: true, pseudonim: true } } },
      },
      roditeljstvaKaoRoditelj: {
        where: { dete: { status: { not: "EXCLUDED" }, deaktiviranAt: null } },
        select: { dete: { select: { id: true, pseudonim: true, avatar: true } } },
      },
      podaci: {
        select: {
          punoIme: true,
          opis: true,
          prikaziLokaciju: true,
          prikaziOpis: true,
          prikaziPunoIme: true,
          prikaziTelefon: true,
          prikaziBilans: true,
          prikaziZrno: true,
          prikaziRangDonacija: true,
          prikaziOglase: true,
        },
      },
      krugClanstva: {
        where: { leftAt: null },
        include: { krug: { select: { id: true, name: true } } },
        take: 1,
      },
      wallet: { select: { id: true, balance: true } },
    },
  });

  if (!korisnik || korisnik.status === "EXCLUDED") {
    return await greska("Profil nije pronađen.", 404);
  }

  const podaci = korisnik.podaci;
  const krug = korisnik.krugClanstva[0]?.krug ?? null;
  const skola = razresiSkolu(korisnik.skolaSifra);

  // Rang donacija — uvek vidljiv
  let rangDonacija: number | null = null;

  {
    const sviDonatori = await prisma.donationRecord.groupBy({
      by: ["userId"],
      where: { status: "CONFIRMED" },
      _sum: { poenEmitted: true },
      orderBy: { _sum: { poenEmitted: "desc" } },
    });
    const idx = sviDonatori.findIndex((d) => d.userId === id);
    if (idx !== -1) rangDonacija = idx + 1;
  }

  // Transakcije — uvek prikazujemo, poslednjih 10
  const { cursor } = Object.fromEntries(req.nextUrl.searchParams);
  const walletId = korisnik.wallet?.id ?? null;
  const transakcije = walletId ? await prisma.transaction.findMany({
    where: {
      OR: [{ fromWalletId: walletId }, { toWalletId: walletId }],
    },
    orderBy: { createdAt: "desc" },
    take: 11,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      amount: true,
      type: true,
      description: true,
      opisKljuc: true,
      opisParametri: true,
      createdAt: true,
      fromWallet: { select: { user: { select: { id: true, pseudonim: true } } } },
      toWallet: { select: { user: { select: { id: true, pseudonim: true } } } },
    },
  }) : [];

  const imaJos = transakcije.length === 11;
  // Opis se prevodi preko ključa na jeziku posmatrača; ključ i parametri ne idu klijentu.
  const locale = await getLocale();
  const transakcijeSlice = (imaJos ? transakcije.slice(0, 10) : transakcije).map(
    ({ opisKljuc, opisParametri, ...t }) => ({
      ...t,
      // Smer se računa PRE maskiranja protivstrane — posle njega se iz zapisa ne vidi.
      izlaz: t.fromWallet?.user?.id === korisnik.id,
      description: opisTransakcije(locale, { opisKljuc, opisParametri, description: t.description }),
    }),
  );
  const nextCursor = imaJos ? transakcijeSlice[9].id : null;

  // V3: neverifikovan korisnik (na sopstvenom profilu — jedini koji ovde dospeva bez
  // punog pristupa) sme da vidi iznose/vremena, ali NE pseudonime druge strane ni
  // stanje računa (Pravilnik čl. 28–30, 67). Maskiramo protivstranu i izostavljamo bilans.
  const punPristup = smeProsireno(session.user);
  // Sužen pregled: nov član gleda TUĐI profil (set 4.8.1). Na sopstvenom
  // profilu se ništa ne sužava — tamo važi zatečeno maskiranje protivstrane.
  const suzen = !punPristup && !jeVlasnik;
  const transakcijeIzlaz = punPristup
    ? transakcijeSlice
    : transakcijeSlice.map((t) => ({
        ...t,
        fromWallet: { user: null },
        toWallet: { user: null },
      }));

  // Oznake verifikatora — vidljive ISKLJUČIVO UO Fondacije (admin), nikad drugim
  // korisnicima (dopuna 3.9.1, Pravilnik o dokazu stvarnosti čl. 31). Admin vidi:
  //  - kako su VERIFIKATORI ovog korisnika označili njega (dolazne oznake), i
  //  - kako je OVAJ korisnik označio one koje je verifikovao (odlazne oznake).
  let adminOznake:
    | {
        dolazne: { pseudonim: string; oznaka: string }[];
        odlazne: { pseudonim: string; oznaka: string }[];
      }
    | null = null;
  if (jeAdmin({ admin: session.user.admin })) {
    const [dolazneRaw, odlazneRaw] = await Promise.all([
      prisma.verifikacionaVeza.findMany({
        where: { verifikovaniId: id, oznakaVerifikatora: { not: null } },
        orderBy: { vremenskiZig: "asc" },
        select: { oznakaVerifikatora: true, verifikator: { select: { pseudonim: true } } },
      }),
      prisma.verifikacionaVeza.findMany({
        where: { verifikatorId: id, oznakaVerifikatora: { not: null } },
        orderBy: { vremenskiZig: "asc" },
        select: { oznakaVerifikatora: true, verifikovani: { select: { pseudonim: true } } },
      }),
    ]);
    adminOznake = {
      dolazne: dolazneRaw.map((v) => ({
        pseudonim: v.verifikator.pseudonim,
        oznaka: v.oznakaVerifikatora as string,
      })),
      odlazne: odlazneRaw.map((v) => ({
        pseudonim: v.verifikovani.pseudonim,
        oznaka: v.oznakaVerifikatora as string,
      })),
    };
  }

  // Oglasi — uvek vidljivi
  const oglasi = await prisma.marketplaceListing.findMany({
    where: { sellerId: id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, title: true, cenaTip: true, price: true, cenaDo: true, category: true, createdAt: true },
  });

  // Preporuka člana (Uslovi čl. 17a): samo BROJ i da li ju je posmatrač dao —
  // spisak onih koji su preporučili ne izlazi iz servera (Politika 4.16).
  // Maloletni korisnik preporuke ne prima, pa je kod njega nema.
  // Preporuku daje samo član Kola, odnosno osnivač (Uslovi čl. 17a st. 1, set 4.8.2).
  const preporuke = korisnik.maloletan ? null : await stanjePreporuka(session.user.id, id, session.user.potvrdjen === true);

  // Status učesnika (set 4.8.2) za `OznakaStatusa` — izvodi se iz jezgra statusa,
  // za dete iz stanja deteta (dete se proverava prvo i nikad nije „korisnik").
  const statusUcesnika = await ucitajStatus(id);

  return NextResponse.json({
    id: korisnik.id,
    pseudonim: korisnik.pseudonim,
    maloletan: korisnik.maloletan,
    preporuke,
    skola: skola ? { sifra: skola.sifra, naziv: skola.naziv, mesto: skola.mesto } : null,
    // 🔴 Veza roditelj–dete se suženom pregledu NE prikazuje (R-03, mera M-5).
    // Uz R-01 je oljušteno sve ostalo (zrno, rang, transakcije, telefon), a ova
    // dva polja su propuštena — pa je čovek koji je samo uplatio novac i koga
    // niko nije potvrdio otvarao tuđi profil i dobijao spisak njegove dece sa
    // pseudonimima i linkovima. Javnost te veze je prihvaćena PREMA POTVRĐENIM
    // članovima, ne prema nalogu bez ijedne potvrde.
    roditelji: suzen ? [] : korisnik.roditeljstvaKaoDete.map((r) => r.roditelj),
    // Roditelj na profilu svog deteta dobija put nazad u podešavanja deteta
    // (`/deca/[id]`). Odluku donosi server, iz iste veze koju čita i ta stranica.
    jaSamRoditelj:
      korisnik.maloletan &&
      korisnik.roditeljstvaKaoDete.some((r) => r.roditelj.id === session.user.id),
    deca: suzen ? [] : korisnik.roditeljstvaKaoRoditelj.map((r) => r.dete),
    verified: korisnik.verified,
    statusUcesnika,
    verifiedAt: suzen ? null : korisnik.verifiedAt,
    status: korisnik.status,
    avatar: korisnik.avatar,
    createdAt: korisnik.createdAt,
    krug: suzen ? null : krug,
    // Opcioni podaci
    lokacija: (jeVlasnik || podaci?.prikaziLokaciju) ? korisnik.location : null,
    opis: (!suzen && (jeVlasnik || podaci?.prikaziOpis)) ? podaci?.opis ?? null : null,
    punoIme: (!suzen && (jeVlasnik || podaci?.prikaziPunoIme)) ? podaci?.punoIme ?? null : null,
    // Telefon ostaje zatvoren i identifikovanom članu: Politika 4.8 obećava da ga
    // vide „isključivo verifikovani korisnici", pa bi širenje prešlo dati pristanak.
    telefon: (!suzen && (jeVlasnik || podaci?.prikaziTelefon)) ? korisnik.telefon : null,
    // POEN balans, rang donacija i oglasi su uvek vidljivi (ne podležu togglu)
    // — osim za neverifikovanog na sopstvenom profilu, kome se stanje računa ne prikazuje (V3).
    bilans: punPristup ? (korisnik.wallet?.balance ?? 0) : null,
    // ZRNO se na profilu više ne prikazuje (odluka vlasnika, 18.10.2026): ZRNO
    // ekran je privremeno uklonjen, pa je broj kod svakog naloga bio nula.
    rangDonacija: suzen ? null : rangDonacija,
    transakcije: suzen ? [] : transakcijeIzlaz,
    nextCursor: suzen ? null : nextCursor,
    suzen,
    oglasi,
    adminOznake,
  });
}
