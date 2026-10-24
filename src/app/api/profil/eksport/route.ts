import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profil/eksport
 * Pravo na prenosivost podataka — čl. 36 ZZPL.
 * Vraća JSON sa svim ličnim podacima korisnika.
 * Zahteva aktivnu sesiju.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const userId = session.user.id;

  const [
    user,
    podaci,
    transakcije,
    zrnoStanje,
    zrnoUpisi,
    zrnoOtpisi,
    zrnoStatusZahtevi,
    zrnoDelegacija,
    glasovi,
    poruke,
    politikaPristanci,
    zapisiPristanka,
    prigovori,
    programEnrollments,
    donacije,
    pokroviteljiBonusi,
    pokroviteljPrijave,
    clanstva,
    identitet,
    clanstvaGazdinstva,
    ugovoriDobra,
    vauceri,
    prijaveRaspodele,
    zaposleniDavaoca,
    zaposlenKodDavaoca,
    potvrdjeniVauceri,
    upisiPokrovitelja,
    preporukeDate,
    preporukaPrimljeno,
    zahtevZaRazgovor,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        pseudonim: true,
        tipKorisnika: true,
        status: true,
        verified: true,
        verifiedAt: true,
        location: true,
        telefon: true,
        memberHash: true,
        emailObavestenja: true,
        createdAt: true,
        deaktiviranAt: true,
      },
    }),
    prisma.userPodaci.findUnique({
      where: { userId },
      select: { punoIme: true, opis: true, updatedAt: true },
    }),
    prisma.transaction.findMany({
      where: {
        OR: [
          { fromWallet: { userId } },
          { toWallet: { userId } },
        ],
      },
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        createdAt: true,
        fromWallet: { select: { userId: true, krugId: true } },
        toWallet: { select: { userId: true, krugId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.zrnoStanje.findUnique({
      where: { userId },
      select: { slobodno: true, aktivno: true, updatedAt: true },
    }),
    prisma.zrnoUpisZahtev.findMany({
      where: { userId },
      select: { id: true, poenIznos: true, date: true, status: true, zrnaUpisana: true, utrosenoPoen: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.zrnoOtpisZahtev.findMany({
      where: { userId },
      select: { id: true, kolicina: true, date: true, status: true, evidentiranoPoen: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.zrnoStatusZahtev.findMany({
      where: { userId },
      select: { id: true, kolicina: true, akcija: true, date: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.zrnoDelegacija.findFirst({
      where: { delegatorId: userId },
      select: { delegatId: true, zakazaniDelegatId: true, imaZakazano: true, createdAt: true },
    }),
    prisma.glasanjeGlas.findMany({
      where: { userId },
      select: { predlogId: true, za: true, glasackaGlasova: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.poruka.findMany({
      where: { posiljacId: userId },
      select: {
        id: true,
        tekst: true,
        procitana: true,
        createdAt: true,
        konverzacija: { select: { user1Id: true, user2Id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.politikaPrihvatanje.findMany({
      where: { userId },
      select: {
        prihvacen: true,
        createdAt: true,
        verzija: { select: { verzija: true, naslov: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Dokaz pristanka (R-06). Izlazi u izvoz jer je to podatak O KORISNIKU — on
    // ima pravo da vidi na šta je pristao, kada i kojim tekstom, isto kao mi.
    prisma.zapisPristanka.findMany({
      where: { userId },
      select: { vrsta: true, verzija: true, tekst: true, jezik: true, datAt: true, povucenAt: true },
      orderBy: { datAt: "desc" },
    }),
    prisma.prigovorNaOdluku.findMany({
      where: { userId },
      select: { id: true, tipOdluke: true, opis: true, status: true, odgovor: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.programEnrollment.findMany({
      where: { userId },
      select: {
        type: true,
        status: true,
        // Osnov po kome je pravo ostvareno (čl. 12). Ne prikazuje se nijednom
        // DRUGOM korisniku (čl. 4 st. 5), ali je podatak o samom podnosiocu i
        // izvozu po pravu na pristup pripada — isti razlog zbog kog tu stoji i
        // tekst pristanka.
        osnov: true,
        dailyAmount: true,
        approvedAt: true,
        createdAt: true,
        // Tekst izričitog pristanka za posebne kategorije (R-06) — korisnik ima
        // pravo da vidi na šta je pristao, ne samo da je pristao.
        pristanakTekst: true,
        pristanakAt: true,
        pristanakPovucenAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.donationRecord.findMany({
      where: { userId },
      select: { amountRSD: true, level: true, poenEmitted: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pokroviteljBonusEmisija.findMany({
      where: { vlasnikId: userId },
      select: { nivo: true, bonusPoen: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    // Prijave pokroviteljstva — od seta 4.7.5 nose ime i funkciju zastupnika
    // (Pravilnik o pokroviteljstvu i donacijama čl. 7), pa ulaze u izvoz.
    prisma.pokroviteljPrijava.findMany({
      where: { podnosilacId: userId },
      select: {
        vrstaDavaoca: true, naziv: true, pib: true, bpg: true, maticniBroj: true, adresaSedista: true,
        zastupnikImePrezime: true, zastupnikFunkcija: true,
        vrednostRsd: true, status: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    // Registar radnji obrade br. 19 — ime i prezime zadrugara ulazi u izvoz.
    prisma.krugClanstvo.findMany({
      where: { userId },
      select: {
        imePrezime: true,
        pristanakAt: true,
        joinedAt: true,
        leftAt: true,
        krug: { select: { name: true, zadruga: true } },
      },
      orderBy: { joinedAt: "desc" },
    }),
    // Registar radnji obrade br. 21 — evidencija identiteta ulazi u izvoz.
    prisma.identitetNaloga.findUnique({
      where: { userId },
      select: { imePrezime: true, izvor: true, upisanAt: true, updatedAt: true },
    }),
    // Registar radnji obrade br. 20 — podaci o gazdinstvu i članstvu ulaze u izvoz.
    prisma.clanGazdinstva.findMany({
      where: { userId },
      select: {
        uloga: true,
        status: true,
        pozvanAt: true,
        pristupioAt: true,
        odobrenAt: true,
        istupioAt: true,
        izjavaTekst: true,
        izjavaAt: true,
        telefon: true,
        razgovorObavljenAt: true,
        doprinos: { select: { redniBroj: true, iznos: true, status: true, evidentiranAt: true, otpisanAt: true } },
        gazdinstvo: {
          select: { naziv: true, naselje: true, adresa: true, lat: true, lng: true, opis: true, bpg: true, neregistrovano: true, status: true },
        },
      },
      orderBy: { pozvanAt: "desc" },
    }),
    // Pokroviteljstvo dobrima i uslugama (donacije Glava IVa) — prijava nosi ime
    // podnosioca, odnos prema davaocu i kontakt davaoca (odnosno ime nosioca
    // gazdinstva i BPG), izjave i potvrdu o evidentiranju (sa snimljenim tekstom),
    // snimljen tekst ugovora, vreme zaključenja i kontrolni broj. Zatečene prijave
    // nose i javne izvore cene. Dokaz cene (fotografija cenovnika) se ne izvozi: to
    // je cenovnik davaoca, ne podatak podnosioca. Heš koda za potpis se ne izvozi.
    prisma.ugovorDobra.findMany({
      where: { podnosilacId: userId },
      select: {
        vrstaDavaoca: true, bpg: true,
        izvori: { orderBy: { redniBroj: "asc" }, select: { redniBroj: true, url: true, datumIzvora: true, cena: true } },
        naziv: true, pib: true, maticniBroj: true, adresaSedista: true,
        zastupnikImePrezime: true, zastupnikFunkcija: true, odnosPremaDavaocu: true,
        kontaktEmail: true, kontaktTelefon: true, izjavaPropisiAt: true, izjavaOvlascenjeAt: true,
        potvrdaEvidentiranjaAt: true, potvrdaEvidentiranjaTekst: true, kontrolniBroj: true,
        vrsta: true, opis: true,
        brojVaucera: true, cenaPoJedinici: true, vrednostRsd: true, mesto: true, adresaPredaje: true,
        status: true, ugovorTekst: true, potpisanoAt: true, vaziDo: true, poenEvidentirano: true, createdAt: true,
        raskinutoAt: true, raskidObrazlozenje: true, raskidOtpis: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vaucer.findMany({
      where: { imalacId: userId },
      select: {
        status: true, dodeljenAt: true, iskoriscenAt: true, ponisteno: true,
        izjavaNepovezanAt: true, pristanakPrikazAt: true, pristanakPrikazTekst: true,
        ugovor: { select: { opis: true, naziv: true, mesto: true, vaziDo: true } },
      },
      orderBy: { dodeljenAt: "desc" },
    }),
    // Zatečene prijave na raspodelu u krugovima (napušteno 20.10.2026) — izvoze se
    // dok postoje.
    prisma.prijavaRaspodele.findMany({
      where: { userId },
      select: { izjavaNepovezanAt: true, ishod: true, createdAt: true, ugovor: { select: { opis: true, naziv: true } } },
      orderBy: { createdAt: "desc" },
    }),
    // Zaposleni davaoca (donacije čl. 13g st. 6): koga je korisnik kao podnosilac
    // odredio i ko je njega odredio — samo pseudonim druge strane i datumi.
    prisma.davalacZaposleni.findMany({
      where: { davalacUserId: userId },
      select: { dodatAt: true, opozvanAt: true, opozvanRazlog: true, zaposleni: { select: { pseudonim: true } } },
      orderBy: { dodatAt: "desc" },
    }),
    prisma.davalacZaposleni.findMany({
      where: { zaposleniUserId: userId },
      select: { dodatAt: true, opozvanAt: true, opozvanRazlog: true, davalac: { select: { pseudonim: true } } },
      orderBy: { dodatAt: "desc" },
    }),
    // Vaučeri čiju je realizaciju korisnik potvrdio — bez ikakvog podatka o imaocu
    // (pseudonim imaoca vidi davalac na svom ekranu; u izvoz potvrdioca ne ide).
    prisma.vaucer.findMany({
      where: { potvrdioId: userId },
      select: { iskoriscenAt: true, ugovor: { select: { opis: true, naziv: true } } },
      orderBy: { iskoriscenAt: "desc" },
    }),
    // Upis pokrovitelja u evidenciju (donacije čl. 6a, Politika 4.5): ime i prezime,
    // odnos, kontakt, mesto i adresa za mapu, izjave (potvrda sa snimljenim tekstom) i
    // status. Ne izvozi se ko je od administratora odlučivao.
    prisma.upisPokrovitelja.findMany({
      where: { vlasnikUserId: userId },
      select: {
        vrsta: true, status: true, naziv: true, adresaSedista: true, maticniBroj: true, pib: true, bpg: true,
        imePrezime: true, zastupnikFunkcija: true, odnosPremaDavaocu: true, kontaktEmail: true, kontaktTelefon: true,
        logoUrl: true, mapaMesto: true, mapaAdresa: true, mapaLat: true, mapaLng: true, izjavaAdresaAt: true,
        izjavaOvlascenjaAt: true, potvrdaEvidentiranjaAt: true, potvrdaEvidentiranjaTekst: true, aprProveraAt: true,
        odbijenoRazlog: true, obrisanAt: true, uklonjenSaRangListeAt: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    // Registar radnji obrade br. 23 — preporuke: koga je korisnik preporučio i
    // koliko je preporuka primio. Ko je njega preporučio ne ulazi ni ovde (Politika 4.16).
    prisma.preporuka.findMany({
      where: { odId: userId },
      select: { createdAt: true, za: { select: { pseudonim: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.preporuka.count({ where: { zaId: userId } }),
    // Spisak za poziv (radnja br. 24, set 4.8.2), dok je korisnik na njemu: osnov,
    // podaci iz zahteva, broj i snimljen pristanak. 🔴 Zapis o tome ko je podatke
    // otvorio (`ZapisOtvaranjaPoziva`) se kroz Platformu NE izvozi (Uslovi čl. 16b
    // st. 3) — daje se na zahtev upućen na privatnost@ekolo.rs.
    prisma.zahtevZaRazgovor.findUnique({
      where: { userId },
      select: {
        osnov: true,
        mesto: true,
        opis: true,
        dostupnost: true,
        telefon: true,
        pristanakTekst: true,
        createdAt: true,
      },
    }),
  ]);

  const eksport = {
    generisanoAt: new Date().toISOString(),
    napomena: "Eksport ličnih podataka u skladu sa čl. 36 Zakona o zaštiti podataka o ličnosti.",
    profil: { ...user, ...podaci },
    transakcije,
    zrno: {
      stanje: zrnoStanje,
      upisi: zrnoUpisi,
      otpisi: zrnoOtpisi,
      statusZahtevi: zrnoStatusZahtevi,
      delegacija: zrnoDelegacija,
    },
    glasanje: glasovi,
    poruke,
    saglasnosti: {
      politikaPristanci,
      zapisiPristanka,
    },
    prigovori,
    programEnrollments,
    donacije: donacije.map((d) => ({ ...d, amountRSD: Number(d.amountRSD) })),
    pokroviteljBonusi: pokroviteljiBonusi,
    pokroviteljPrijave: pokroviteljPrijave.map((p) => ({ ...p, vrednostRsd: Number(p.vrednostRsd) })),
    zadruge: clanstva.map((c) => ({
      naziv: c.krug.name,
      zadruga: c.krug.zadruga,
      imePrezime: c.imePrezime,
      pristanakAt: c.pristanakAt,
      od: c.joinedAt,
      do: c.leftAt,
    })),
    gazdinstva: clanstvaGazdinstva,
    upisiPokrovitelja,
    pokroviteljstvoDobrima: ugovoriDobra.map((u) => ({
      ...u,
      cenaPoJedinici: Number(u.cenaPoJedinici),
      vrednostRsd: Number(u.vrednostRsd),
      izvori: u.izvori.map((i) => ({ ...i, cena: Number(i.cena) })),
    })),
    vauceri,
    prijaveNaRaspodelu: prijaveRaspodele,
    potvrdjivanjeVaucera: {
      odredjeniZaposleni: zaposleniDavaoca.map((z) => ({
        pseudonim: z.zaposleni.pseudonim, dodatAt: z.dodatAt, opozvanAt: z.opozvanAt, opozvanRazlog: z.opozvanRazlog,
      })),
      uImeDavaoca: zaposlenKodDavaoca.map((z) => ({
        pseudonim: z.davalac.pseudonim, dodatAt: z.dodatAt, opozvanAt: z.opozvanAt, opozvanRazlog: z.opozvanRazlog,
      })),
      potvrdjeniVauceri,
    },
    evidencijaIdentiteta: identitet,
    preporuke: {
      date: preporukeDate.map((p) => ({ pseudonim: p.za.pseudonim, datum: p.createdAt })),
      brojPrimljenih: preporukaPrimljeno,
    },
    zahtevZaRazgovor,
  };

  return new NextResponse(JSON.stringify(eksport, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="kolo-podaci-${userId.slice(0, 8)}.json"`,
    },
  });
}
