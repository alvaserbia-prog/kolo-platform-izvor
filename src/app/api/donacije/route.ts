import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nivoZaKumulativ, tabelaZaPrikaz } from "@/lib/protokol/donacija";
import { dohvatiIpsConfig, pozivNaBrojZaClana, prikazPozivNaBroj } from "@/lib/placanje/ips-qr";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Donirati sme i korisnik (donacije čl. 3 st. 1). Lista TUĐIH donacija (čl. 11; Uslovi
  // čl. 16 st. 5; Pravilnik čl. 56 st. 2) ide korisniku i verifikovanom učesniku
  // ISTO: ime i prezime donatora javne donacije, iznos i datum — BEZ pseudonima.
  // 🔴 Dete listu ne dobija (dečji prostor nije javan; tabela dozvola br. 9).
  // Sopstvene donacije vidi svako — to je njegov podatak.
  const dete = session.user.maloletan === true;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      memberHash: true,
      donatorskiBroj: true,
      donations: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountRSD: true,
          cumulativeRSD: true,
          level: true,
          poenEmitted: true,
          status: true,
          javno: true,
          // Da li ime još stoji u listi — ekran po tome nudi povlačenje (čl. 12).
          donatorIme: true,
          imePovucenoAt: true,
          createdAt: true,
          // Ne salje se ceo tekst ugovora u listu — samo da li postoji, pa
          // ekran zna da li da ponudi link (cl. 5b).
          ugovorTekst: true,
        },
      },
    },
  });

  if (!user) return await greska("Korisnik nije pronađen.", 404);

  // Rang/nivo se računa samo iz javnih donacija (anonimne ne nose POEN).
  const totalRSD = user.donations
    .filter((d) => d.status === "CONFIRMED" && d.javno)
    .reduce((s, d) => s + Number(d.amountRSD), 0);
  const { nivo, kurs } = nivoZaKumulativ(totalRSD);

  // ── Lista donacija ──────────────────────────────────────────────────────────
  //
  // 🔴 Set 4.8.2 (donacije čl. 11 st. 1; Uslovi čl. 16 st. 5): lista je ista za
  // korisnika i za verifikovanog učesnika — ime i prezime donatora javne donacije,
  // iznos i datum. Pseudonim donatora i veza ka profilu se u listi NE prikazuju
  // NIKOME (ni verifikovanom); pseudonim se vidi samo u pregledu transakcija POEN-a,
  // dostupnom verifikovanima. Zato se `user` ovde i ne čita — pseudonim ne stiže
  // ni u mrežni odgovor. Brana: `__tests__/donator-ime-izvor.test.ts`.
  //
  // 🔴 Anonimna donacija ULAZI u listu, ali samo iznosom (mera M-3c). Do ovog seta
  // je bila skrivena ovde a prikazana na `/sistem` SA PSEUDONIMOM — dakle jedini
  // ekran na kome se videla odavao je upravo ono što anonimnost obećava. Sada je
  // obrnuto: iznos ulazi u zbir svuda, a lice nigde.
  //
  // Ime se čita iz `donatorIme` snimljenog na zapisu (čl. 11 st. 2) — ne iz profila,
  // pa ga kasnija izmena profila ne menja.
  //
  // 🔴 Od seta 4.6.8 ime NIJE trajno (čl. 12): donator ga povlači, a gašenje
  // naloga ga briše. Donacija kojoj je ime povučeno OSTAJE u listi — iznosom i
  // datumom — jer je upis POEN-a i dalje pripisan nalogu. Ispadanje iz liste bi
  // menjalo zbir koji lista pokazuje.
  const javneDonacije = dete ? [] : await prisma.donationRecord.findMany({
        where: {
          status: "CONFIRMED",
          // Anonimne prolaze; ime im je null i ne prikazuje se.
          OR: [
            { javno: false },
            { javno: true, donatorIme: { not: null } },
            { javno: true, imePovucenoAt: { not: null } },
          ],
        },
        orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }],
        take: 50,
        // 🔴 Bez broja POEN-a i bez nivoa (odluka vlasnika 25.10.2026): iznos u
        // dinarima i broj POEN-a u istom redu daju odnos deljenjem (R-01) — isto
        // zbog čega ugovor o donaciji ne nosi broj POEN-a. Donator svoj broj vidi
        // u sopstvenoj evidenciji. Brana: `koncentracija-izvor.test.ts`.
        select: {
          id: true,
          amountRSD: true,
          donatorIme: true,
          imePovucenoAt: true,
          javno: true,
          confirmedAt: true,
          createdAt: true,
        },
      });

  // Trajni broj za uplate (model 97 nad donatorskim brojem) — isti za IPS QR i
  // klasičnu uplatnicu. Račun iz IPS konfiguracije kad je podešen (jedan izvor
  // istine); dok nije, klijent prikazuje placeholder.
  const ipsCfg = dohvatiIpsConfig();
  const pozivNaBroj = prikazPozivNaBroj(pozivNaBrojZaClana(user.donatorskiBroj));

  return NextResponse.json({
    trenutniNivo: nivo,
    trenutniKurs: kurs,
    kumulativRSD: totalRSD,
    donatorskiBroj: user.donatorskiBroj,
    pozivNaBroj,
    racun: ipsCfg?.racun ?? null,
    donacije: user.donations.map((d) => ({
      id: d.id,
      amountRSD: Number(d.amountRSD),
      cumulativeRSD: Number(d.cumulativeRSD),
      level: d.level,
      poenEmitted: d.poenEmitted,
      status: d.status,
      javno: d.javno,
      imeObjavljeno: d.javno && d.donatorIme !== null,
      imePovuceno: d.imePovucenoAt !== null,
      imaUgovor: d.ugovorTekst !== null,
      createdAt: d.createdAt.toISOString(),
    })),
    // Nepotvrđenom članu lista ne stiže prazna nego ZAKLJUČANA — prazan spisak bi
    // rekao da donacija nema, što nije isto.
    listaZakljucana: dete,
    listaDonacija: javneDonacije.map((d) => ({
      id: d.id,
      // Ime, iznos i datum — isto korisniku i verifikovanom (čl. 11 st. 1).
      ime: d.javno ? d.donatorIme : null,
      anonimno: !d.javno,
      imePovuceno: d.javno && d.imePovucenoAt !== null,
      // 🔴 Pseudonim i veza ka profilu se u listi ne prikazuju nikome (čl. 11 st. 1).
      pseudonim: null,
      userId: null,
      amountRSD: Number(d.amountRSD),
      createdAt: (d.confirmedAt ?? d.createdAt).toISOString(),
    })),
    // Tabela staje na nivou 11 (čl. 8 st. 3) — šalju se svi redovi do
    // `NAJVISI_NIVO`.
    rangTabela: tabelaZaPrikaz(),
  });
}
