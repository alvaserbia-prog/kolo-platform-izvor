import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { evidentirajDonaciju, proveriDuplikatUplatioca } from "@/lib/protokol/donacija";
import { prisma } from "@/lib/prisma";
import { gdePseudonim } from "@/lib/pseudonim";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { jeAdmin } from "@/lib/dozvole";
import { rasclaniPozivNaBroj } from "@/lib/placanje/ips-qr";

// POST — potvrdi ili ručno evidentiraj donaciju
/**
 * 🔴 Poruka o potvrđenoj donaciji ne nosi iznos u dinarima (odluka vlasnika
 * 26.10.2026). Dinari i POEN u istoj rečenici daju „cenu" POEN-a deljenjem —
 * isti razlog zbog koga ni ugovor o donaciji ne nosi broj POEN-a. Anonimna
 * donacija ne nosi POEN, pa poruka o evidentiranju izostaje.
 * Brana `donacija-ugovor-bez-poena-izvor.test.ts`.
 */
function porukaDonacije(poen: number) {
  return poen > 0
    ? {
        kljuc: "notifikacije.donacija_potvrdjena",
        tekst: `Tvoja donacija je potvrđena. Evidentirano ti je ${poen.toLocaleString("sr-RS")} POEN.`,
      }
    : { kljuc: "notifikacije.donacija_potvrdjena_anonimna", tekst: "Tvoja donacija je potvrđena." };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Pristup odbijen.", 403);
  }

  const body = await req.json();
  const { pseudonim, pozivNaBroj, amountRSD, donationId } = body;
  // Anonimna donacija (javno=false) ne nosi POEN. Default je javna.
  const javnoBody = body.javno !== false;

  // Uplatilac iz izvoda (Pravilnik o pokroviteljstvu i donacijama, čl. 6 i Glava
  // V). OBAVEZAN je na oba ručna puta: doprinos se evidentira isključivo
  // korisniku čijim je sredstvima uplata izvršena, a poziv na broj je trajan broj
  // člana — bilo ko sa bilo kog računa može da uplati na njega. Bez ovog polja
  // se uplatilac i donator nigde ne porede, pa se treće lice evidentira kao
  // donator. Provera je ljudska (čovek gleda izvod); polje je trag da je urađena.
  const uplatilac = typeof body.uplatilac === "string" ? body.uplatilac.trim() : "";
  const straniPriliv = body.straniPriliv === true;
  // Izričita potvrda da se evidentira i pored poklapanja uplatioca sa drugim
  // nalogom (mera C-1). Bez nje se evidentiranje zaustavlja i vraća nalaz.
  const potvrdiDuplikat = body.potvrdiDuplikat === true;

  if (!amountRSD) {
    return await greska("Iznos je obavezan.", 400);
  }
  if (uplatilac.length < 2) {
    return await greska(
      "Unesite ime uplatioca iz izvoda. Doprinos se evidentira isključivo korisniku čijim je sredstvima uplata izvršena (čl. 6 Pravilnika o pokroviteljstvu i donacijama).",
      400
    );
  }
  const iznos = Number(amountRSD);
  if (isNaN(iznos) || iznos <= 0) {
    return await greska("Iznos mora biti pozitivan broj.", 400);
  }

  if (donationId) {
    // Potvrdi postojeći PENDING zapis
    const donation = await prisma.donationRecord.findUnique({
      where: { id: donationId },
      include: { user: { select: { pseudonim: true, id: true, podaci: { select: { punoIme: true } } } } },
    });
    if (!donation) return await greska("Donacija nije pronađena.", 404);
    if (donation.status === "CONFIRMED") return await greska("Donacija je već potvrđena.", 400);
    // NAPLACENO = kartična uplata je prošla kroz banku, ali POEN još nije
    // evidentiran (mera M-4a). Potvrđuje se istim putem kao najavljena uplata.

    // Vidljivost je određena pri kreiranju zapisa (kartica/forma).
    if (donation.javno && !donation.user.podaci?.punoIme?.trim()) {
      return await greska("Javna donacija zahteva da donator ima uneto ime i prezime u profilu.", 400);
    }

    // Mera C-1: uplatilac je jedini spoljni identitet koji sistem ima, pa je
    // poklapanje sa drugim nalogom najjeftiniji dokaz o dva naloga istog čoveka
    // (Uslovi čl. 8). Ne blokira samo od sebe — traži izričitu ljudsku odluku.
    if (!potvrdiDuplikat) {
      const dup = await proveriDuplikatUplatioca(donation.userId, uplatilac);
      if (dup.sudar) {
        return NextResponse.json(
          {
            error: `Isti uplatilac već stoji uz nalog: ${dup.pseudonimi.join(", ")}. Uslovi čl. 8 zabranjuju više naloga istog lica. Potvrdite izričito ako je uplata sa zajedničkog računa.`,
            duplikat: true,
            pseudonimi: dup.pseudonimi,
          },
          { status: 409 }
        );
      }
    }

    try {
      const result = await evidentirajDonaciju(donation.userId, iznos, {
        existingRecordId: donationId,
        adminId: session.user.id,
        javno: donation.javno,
        uplatilac,
        straniPriliv,
        // Ponuda spiska za poziv po uplati (dokaz stvarnosti čl. 8 st. 1 t. 2) traži jedinstvenog uplatioca.
        uplatilacJedinstven: !potvrdiDuplikat,
      });

      await logAdminAkcija(session.user.id, "DONACIJA_POTVRDJENA", donation.userId,
        `${iznos.toLocaleString("sr-RS")} RSD → ${result.poenEmitted} POEN; uplatilac: ${uplatilac}${straniPriliv ? "; strani priliv" : ""}${potvrdiDuplikat ? "; potvrđeno uprkos poklapanju uplatioca (C-1)" : ""}`);
      await obavesti(donation.userId, {
        tip: "donacija_potvrdjena",
        kljuc: porukaDonacije(result.poenEmitted).kljuc,
        parametri: { poen: result.poenEmitted },
        naslov: "Donacija potvrđena!",
        tekst: porukaDonacije(result.poenEmitted).tekst,
        // Ugovor o donaciji (čl. 14) se isporučuje kroz Platformu — link vodi
        // pravo na njega, ne na spisak donacija.
        link: `/donacije/${result.zapisId}/ugovor`,
      });

      return NextResponse.json({ ok: true, ...result });
    } catch (e: unknown) {
      return await greska(e instanceof Error ? e.message : "Greška.", 400);
    }
  }

  // Ručno evidentiranje uplate iz izvoda — po pozivu na broj (model 97 nad
  // donatorskim brojem; primarni put) ili po pseudonimu (rezerva, npr. uplata
  // bez poziva na broj).
  if (!pseudonim && !pozivNaBroj) {
    return await greska("Poziv na broj, pseudonim ili donationId je obavezan.", 400);
  }

  let user;
  if (pozivNaBroj) {
    const donatorskiBroj = rasclaniPozivNaBroj(String(pozivNaBroj));
    if (donatorskiBroj === null) {
      return await greska("Poziv na broj nije ispravan (kontrolne cifre se ne poklapaju — proverite prepis iz izvoda).", 400);
    }
    user = await prisma.user.findUnique({
      where: { donatorskiBroj },
      include: { podaci: { select: { punoIme: true } } },
    });
  } else {
    user = await prisma.user.findFirst({
      where: gdePseudonim(pseudonim),
      include: { podaci: { select: { punoIme: true } } },
    });
  }
  if (!user) return await greska("Korisnik nije pronađen.", 404);

  if (javnoBody && !user.podaci?.punoIme?.trim()) {
    return await greska("Javna donacija zahteva da donator ima uneto ime i prezime u profilu (ili evidentirajte kao anonimnu).", 400);
  }

  if (!potvrdiDuplikat) {
    const dup = await proveriDuplikatUplatioca(user.id, uplatilac);
    if (dup.sudar) {
      return NextResponse.json(
        {
          error: `Isti uplatilac već stoji uz nalog: ${dup.pseudonimi.join(", ")}. Uslovi čl. 8 zabranjuju više naloga istog lica. Potvrdite izričito ako je uplata sa zajedničkog računa.`,
          duplikat: true,
          pseudonimi: dup.pseudonimi,
        },
        { status: 409 }
      );
    }
  }

  try {
    const result = await evidentirajDonaciju(user.id, iznos, {
      adminId: session.user.id,
      javno: javnoBody,
      uplatilac,
      straniPriliv,
      uplatilacJedinstven: !potvrdiDuplikat,
    });

    await logAdminAkcija(session.user.id, "DONACIJA_RUCNO_EVIDENTIRANA", user.id,
      `${iznos.toLocaleString("sr-RS")} RSD → ${result.poenEmitted} POEN; uplatilac: ${uplatilac}${straniPriliv ? "; strani priliv" : ""}${potvrdiDuplikat ? "; potvrđeno uprkos poklapanju uplatioca (C-1)" : ""}`);
    await obavesti(user.id, {
      tip: "donacija_potvrdjena",
      kljuc: porukaDonacije(result.poenEmitted).kljuc,
      parametri: { poen: result.poenEmitted },
      naslov: "Donacija potvrđena!",
      tekst: porukaDonacije(result.poenEmitted).tekst,
      link: `/donacije/${result.zapisId}/ugovor`,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    return await greska(e instanceof Error ? e.message : "Greška.", 400);
  }
}

// GET — lista svih donacija sa statusom
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Pristup odbijen.", 403);
  }

  const donations = await prisma.donationRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { pseudonim: true } } },
  });

  return NextResponse.json(
    donations.map((d) => ({
      id: d.id,
      pseudonim: d.user.pseudonim,
      amountRSD: Number(d.amountRSD),
      cumulativeRSD: Number(d.cumulativeRSD),
      level: d.level,
      poenEmitted: d.poenEmitted,
      status: d.status,
      referenceNumber: d.referenceNumber,
      confirmedAt: d.confirmedAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
    }))
  );
}
