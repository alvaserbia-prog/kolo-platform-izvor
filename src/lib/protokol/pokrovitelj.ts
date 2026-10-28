import { prisma } from "@/lib/prisma";
import { emitujPoen } from "./emisija";
import { probajEvidentiratiPotvrde } from "./potvrda-poen";
import { imeNaloga, ishodUpisa, upisiIdentitet, PORUKA_DRUGO_IME } from "./identitet";
import { ponudiSpisak, pokroviteljstvoVodiNaSpisak } from "./zahtev-razgovor";
import { VrstaDonacije } from "@/generated/prisma/client";
import { KOEFICIJENT_EVIDENCIJE_POKROVITELJSTVA, poenZaPokroviteljstvo } from "@/lib/donacija-pravila";
import { naRangListi, kljucNovcanogPokrovitelja, upisOdobrenZaPotvrdu } from "@/lib/upis-pokrovitelja-pravila";
import type { VrstaDavaoca } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { FONDACIJA } from "@/lib/donacija-ugovor";

// Koeficijentni model, pragovi i minimum prijave žive u `donacija-pravila.ts`
// (bez Prisme, jer ih uvozi i ekran u pretraživaču). Ovde se re-eksportuju, pa
// server ima jedan ulaz — isti obrazac kao kod donacija.
export {
  MINIMUM_PRIJAVE_POKROVITELJSTVA,
  procitajPrijavuPokroviteljstva,
  KOEFICIJENT_EVIDENCIJE_POKROVITELJSTVA,
  poenZaPokroviteljstvo,
} from "@/lib/donacija-pravila";

/**
 * Evidentira doprinos pokrovitelja i emituje POEN sa koeficijentom 1,00 (donacije
 * čl. 22, set 5.0.0, izmena 28.10.2026; odluka vlasnika 27.10.2026). 🔴 Tabela nivoa iz čl. 8 važi samo
 * za donaciju fizičkog lica: pokrovitelj nema zapis, a doprinos se evidentira u zapisu
 * podnosioca prijave, koji nije pokrovitelj (čl. 22 st. 2), pa se ne uvećava — ni po iznosu, ni po
 * pravnom obliku, ni za gazdinstvo. Kumulativ pokrovitelja (firma po PIB-u, gazdinstvo
 * po BPG-u) vodi se i dalje, ali samo za rang-listu (čl. 21 st. 2, čl. 25); nivo se ne
 * računa, a zatečeni `Pokrovitelj.trenutniNivo` ostaje kao istorija.
 *
 * 🔴 POEN dobija JEDNO lice — ono koje je podnelo prijavu (donacije čl. 20 st. 3, čl. 23
 * st. 2), ne `Pokrovitelj.vlasnik` upisan pri prvoj prijavi. Doprinos se ne raspoređuje
 * na više vlasnika. `primalacId` je zato OBAVEZAN; ručni upis iz admin panela bez
 * prijave ukinut je setom 5.0 (ruta `admin/pokrovitelji/[id]/doprinos` vraća 410).
 *
 * 🔴 Već evidentiran POEN po ranijoj tabeli (fiksni bonusi do 2026-09-08, uvećanje od
 * 20% do 4.6.8, tabela 1,00–2,00 do 28.10.2026) se NE poništava i ne ispravlja (čl. 55).
 */
export async function evidentirajDoprinos(params: {
  pokroviteljId: string;
  rsdIznos: number;
  tip: VrstaDonacije;
  evidentiraoId: string;
  napomena?: string;
  /** Podnosilac prijave pokroviteljstva — jedini u čijem se zapisu evidentira POEN. */
  primalacId: string;
}) {
  const { pokroviteljId, rsdIznos, tip, evidentiraoId, napomena } = params;
  // 🔴 Kumulativ je NOVČANI (čl. 21 st. 2; čl. 33 st. 3). Vrednost dobara i usluga
  // se ne dodaje. Dobra i usluge idu kroz `protokol/pokroviteljstvo-dobrima.ts`.
  if (tip !== "NOVAC") throw new Error("U kumulativ pokrovitelja ulazi samo novčani doprinos.");

  const poen = poenZaPokroviteljstvo(rsdIznos);

  // Korak 1: DB transakcija
  const { bonusId, vlasnikWalletId, vlasnikId } = await prisma.$transaction(async (tx) => {
    const pokrovitelj = await tx.pokrovitelj.findUniqueOrThrow({
      where: { id: pokroviteljId },
      select: { rsdKumulativ: true },
    });
    // Nikad `pokrovitelj.vlasnik` (donacije čl. 23 st. 2): POEN ide podnosiocu prijave.
    const primalac = await tx.user.findUniqueOrThrow({
      where: { id: params.primalacId },
      include: { wallet: true },
    });

    await tx.pokroviteljDoprinos.create({
      data: {
        pokroviteljId,
        rsdIznos: rsdIznos,
        tip,
        evidentiraoId,
        napomena,
      },
    });

    // Kumulativ samo za rang-listu; `trenutniNivo` se više ne upisuje (čl. 22 st. 1).
    await tx.pokrovitelj.update({
      where: { id: pokroviteljId },
      data: { rsdKumulativ: Number(pokrovitelj.rsdKumulativ) + rsdIznos },
    });

    // Kolona `nivo` je iz vremena tabele; pokrovitelj nivo nema, pa se upisuje 0.
    const bonus = poen > 0
      ? await tx.pokroviteljBonusEmisija.create({
          data: { pokroviteljId, vlasnikId: primalac.id, nivo: 0, bonusPoen: poen },
        })
      : null;

    return {
      bonusId: bonus?.id ?? null,
      vlasnikWalletId: primalac.wallet!.id,
      vlasnikId: primalac.id,
    };
  });

  // Korak 2: emisija van transakcije (pravilo 8)
  if (poen > 0) {
    const { transaction } = await emitujPoen(
      vlasnikWalletId,
      poen,
      "EMISIJA_POKROVITELJ",
      `Bonus za pokroviteljstvo iznos ${poen.toLocaleString("sr-RS")}`, { kljuc: "transakcije.pokroviteljstvo", parametri: { iznos: poen } }
    );

    if (bonusId) {
      await prisma.pokroviteljBonusEmisija.update({
        where: { id: bonusId },
        data: { transactionId: transaction.id },
      });
    }

    // Pokroviteljstvo je jedan od četiri traga učešća koji otključavaju POEN po potvrdi
    // (dokaz stvarnosti čl. 19). Doprinos se evidentira u zapisu onoga ko je prijavu
    // podneo (donacije čl. 23 st. 2), pa se i uslov meri njemu.
    // Ne baca: doprinos je već evidentiran.
    await probajEvidentiratiPotvrde(vlasnikId);
  }

  return { poen, koeficijent: KOEFICIJENT_EVIDENCIJE_POKROVITELJSTVA, primalacId: vlasnikId };
}

/**
 * Auto-generisani tekst ugovora o donaciji (čl. 19 st. 4, čl. 20 st. 1). Ne sadrži odredbe o POEN-u.
 */
export function generisiUgovorTekst(p: {
  /** FIRMA (pravno lice, preduzetnik) ili GAZDINSTVO (nosilac registrovanog
   *  poljoprivrednog gazdinstva, čl. 16 st. 4 i 19 st. 4, set 4.7.9). Podrazumevano FIRMA. */
  vrstaDavaoca?: VrstaDavaoca;
  naziv: string;
  pib: string | null;
  maticniBroj: string | null;
  adresaSedista: string | null;
  bpg?: string | null;
  zastupnikImePrezime: string;
  zastupnikFunkcija: string;
  vrstaDonacije: VrstaDonacije;
  vrednostRsd: number;
}): string {
  // Od 2026-09-08 pokroviteljstvo je isključivo NOVAC (čl. 15). `vrstaDonacije`
  // ostaje u potpisu zbog zatečenih prijava — enum nose istorijski zapisi.
  //
  // 🔴 Tekst se snima pri podnošenju i ne generiše ponovo; zatečeni ugovori
  // (bez MB, sedišta i zastupnika) ostaju kakvi su bili.
  //
  // Gazdinstvo (čl. 19 st. 4, čl. 20 st. 1): ugovor zaključuje sam nosilac, uz naziv i
  // broj gazdinstva — umesto sedišta, MB, PIB-a i zastupnika (isto kao ugovor o
  // dobrima i uslugama za gazdinstvo); uplata ide sa računa gazdinstva ili nosioca.
  const datum = new Date().toLocaleDateString("sr-RS");
  const gazdinstvo = p.vrstaDavaoca === "GAZDINSTVO";
  return [
    "UGOVOR O DONACIJI",
    "",
    `Zaključen dana ${datum} između:`,
    gazdinstvo
      ? `1) ${p.zastupnikImePrezime}, nosilac registrovanog poljoprivrednog gazdinstva „${p.naziv}", ` +
        `broj gazdinstva ${p.bpg ?? ""} (u daljem tekstu: Donator), i`
      : `1) ${p.naziv}, sa sedištem na adresi ${p.adresaSedista ?? ""}, matični broj ${p.maticniBroj ?? ""}, PIB ${p.pib ?? ""}, ` +
        `koga zastupa ${p.zastupnikImePrezime}, ${p.zastupnikFunkcija} (u daljem tekstu: Donator), i`,
    `2) ${FONDACIJA} (u daljem tekstu: Primalac).`,
    "",
    gazdinstvo
      ? `Član 1. Donator donira Primaocu novčani iznos od ${p.vrednostRsd.toLocaleString("sr-RS")} RSD, uplatom na račun Primaoca sa računa gazdinstva ili sa sopstvenog računa.`
      : `Član 1. Donator donira Primaocu novčani iznos od ${p.vrednostRsd.toLocaleString("sr-RS")} RSD.`,
    // 🔴 Član 2 i 3 po donacijama 5.0 čl. 19 st. 4 (shodno čl. 14 st. 2; 26.10.2026):
    // izjava o doprinosu bez broja POEN-a, koeficijenta i nivoa, uz izjavu da ga
    // pokrovitelj ne prima. Brana `donacija-ugovor-bez-poena-izvor.test.ts`.
    "Član 2. Donacija je dobrovoljna i bez naknade. Donator donacijom ne pribavlja nijedno dobro ni uslugu, ne stiče potraživanje prema Primaocu, pravo na povraćaj donacije, pravo na otkup POEN-a niti neposredan uticaj u odlučivanju o pravilima sistema. Primalac se obavezuje da donaciju upotrebi isključivo za ostvarivanje ciljeva zbog kojih je osnovan.",
    "Član 3. Doprinos koji se povodom donacije evidentira po pravilima KOLO sistema ne određuje se ovim ugovorom. Taj upis nije protivčinidba za donaciju, Donator na njega nema potraživanje i Donator ga ne prima.",
    "Član 4. Poreske obaveze koje proizlaze iz donacije snosi Donator u skladu sa važećim propisima.",
    // F5-M1 (registar 2026-10): isti način zaključenja kao ugovor o dobrima (donacije čl. 32 st. 1).
    "Član 5. Ugovor se zaključuje elektronskim putem na platformi KOLO, potvrdom podnosioca na platformi i unosom jednokratnog koda dostavljenog na njegovu adresu elektronske pošte. Tako zaključen ugovor punovažan je bez pečata i svojeručnog potpisa. Platforma beleži vreme zaključenja i kontrolni broj teksta i dostavlja Donatoru primerak ugovora za štampu.",
    "",
    gazdinstvo
      ? `Potpisom ${p.zastupnikImePrezime} potvrđuje da je nosilac gazdinstva i da prihvata uslove ugovora.`
      : `Potpisom ${p.zastupnikImePrezime} potvrđuje svoje ovlašćenje da zastupa Donatora i da prihvata uslove ugovora.`,
  ].join("\n");
}

/**
 * Potvrda prijema doprinosa (čl. 20). Pronalazi ili registruje pokrovitelja —
 * pravno lice ili preduzetnika po PIB-u, registrovano gazdinstvo po BPG-u (set 4.7.9) —
 * evidentira doprinos i emituje POEN podnosiocu prijave (čl. 22 i 23).
 * Mora biti pozvana van prisma.$transaction (zbog emitujPoen).
 */
export async function potvrdiPrijavu(prijavaId: string, adminId: string, aprUporedjeno = false) {
  const prijava = await prisma.pokroviteljPrijava.findUnique({ where: { id: prijavaId } });
  if (!prijava) throw new Error("Prijava nije pronađena.");
  if (prijava.status !== "POTPISANA")
    throw new Error("Samo potpisana prijava može biti potvrđena.");

  // 🔴 Maloletni nalog ne podnosi prijavu (set 4.7.7). Prijave podnete pre te brane
  // ne smeju da prođu ni ovde — ni doprinos ni ime u evidenciju identiteta.
  const podnosilac = await prisma.user.findUnique({
    where: { id: prijava.podnosilacId },
    select: { maloletan: true },
  });
  if (!podnosilac || podnosilac.maloletan)
    throw new Error("Prijavu je podneo maloletni korisnik — ne može se potvrditi; odbij je uz obrazloženje.");

  // Upis pokrovitelja (donacije čl. 16–18): Fondacija je naziv, MB i zastupnika
  // uporedila sa registrom PRI ODOBRENJU UPISA (čl. 18 st. 1, čl. 19 st. 3), pa se
  // poređenje ovde ne ponavlja — čita se iz upisa. Obrisan upis ne sprečava potvrdu
  // već potpisane prijave (donacija je možda uplaćena; registar se čuva).
  //
  // Zatečene prijave bez upisa zadržavaju raniji tok: poređenje pri potvrdi.
  //
  // 🔴 Banka potvrđuje firmu, a registar ko je firmu zastupa: tek posle poređenja
  // ime ide u evidenciju identiteta (Pravilnik čl. 31 st. 2). Beleži se samo
  // DA je poređenje izvršeno.
  //
  // 🔴 Registrovano gazdinstvo se ne poredi sa APR-om (čl. 16 st. 4, čl. 18 st. 1): dovoljno je
  // da je upis odobren (čl. 19 st. 3, set 4.7.9). Ime nosioca ide u evidenciju
  // identiteta uz broj gazdinstva koji je naveo (Pravilnik čl. 31 st. 2).
  const gazdinstvo = prijava.vrstaDavaoca === "GAZDINSTVO";
  const upis = prijava.upisId
    ? await prisma.upisPokrovitelja.findUnique({
        where: { id: prijava.upisId },
        select: { id: true, aprProveraAt: true, odlukaAt: true, status: true, vrsta: true },
      })
    : null;
  if (gazdinstvo && (!upis || upis.vrsta !== "GAZDINSTVO" || !upisOdobrenZaPotvrdu(upis)))
    throw new Error("Upis gazdinstva nije odobren — prvo odobri upis.");
  if (!gazdinstvo && prijava.upisId && (!upis || !upisOdobrenZaPotvrdu(upis)))
    throw new Error("Upis pokrovitelja nije odobren uz poređenje sa registrom — prvo odobri upis.");
  const uporedjenoAt = gazdinstvo ? null : (upis?.aprProveraAt ?? (aprUporedjeno ? new Date() : null));
  const zastupnik = prijava.zastupnikImePrezime;
  if (zastupnik) {
    if (!gazdinstvo && !uporedjenoAt)
      throw new Error("Pre potvrde uporedi naziv, matični broj i zastupnika sa podacima APR-a.");
    // Jedan nalog, jedno ime (Pravilnik čl. 31 st. 3) — proverava se PRE evidentiranja,
    // da doprinos ne ode u zapis naloga uz koji stoji drugo ime.
    if (ishodUpisa(await imeNaloga(prijava.podnosilacId), zastupnik) === "RAZLIKUJE_SE")
      throw new Error(PORUKA_DRUGO_IME);
  }

  // Pronađi ili registruj pokrovitelja: pravno lice i preduzetnika po PIB-u,
  // registrovano gazdinstvo po BPG-u. 🔴 Gazdinstvo je sopstveni red sa sopstvenim
  // kumulativom (čl. 22 st. 3) — nikad red firme nosioca ni njegov lični zbir.
  const kljuc = kljucNovcanogPokrovitelja({ vrsta: prijava.vrstaDavaoca, pib: prijava.pib, bpg: prijava.bpg });
  if (!kljuc) throw new Error("Prijava nema PIB, odnosno broj gazdinstva — ne može se potvrditi.");
  let pokrovitelj = await prisma.pokrovitelj.findUnique({ where: kljuc });
  if (!pokrovitelj) {
    pokrovitelj = await prisma.pokrovitelj.create({
      data: {
        naziv: prijava.naziv,
        pib: gazdinstvo ? null : prijava.pib,
        bpg: gazdinstvo ? prijava.bpg : null,
        maticniBroj: prijava.maticniBroj,
        adresa: prijava.adresaSedista,
        vlasnikId: prijava.podnosilacId,
        kreiraoId: adminId,
        upisId: prijava.upisId,
      },
    });
  } else if (prijava.upisId && pokrovitelj.upisId !== prijava.upisId) {
    // Rang-lista čita naziv i logotip iz upisa (čl. 26 st. 2).
    pokrovitelj = await prisma.pokrovitelj.update({ where: { id: pokrovitelj.id }, data: { upisId: prijava.upisId } });
  }

  // 🔴 Brava protiv dvostruke potvrde (dvostruki klik, dva admina): prijava se
  // preuzima uslovnim upisom PRE evidentiranja. Drugi poziv ne nalazi POTPISANU i
  // staje, pa se POEN ne emituje dvaput. Ako evidentiranje padne, prijava se vraća.
  const sada = new Date();
  const preuzeta = await prisma.pokroviteljPrijava.updateMany({
    where: { id: prijavaId, status: "POTPISANA" },
    data: { status: "POTVRDJENA", potvrdioId: adminId, potvrdjenoAt: sada },
  });
  if (preuzeta.count === 0) throw new Error("Prijava je već obrađena.");

  let evidentirano: Awaited<ReturnType<typeof evidentirajDoprinos>>;
  try {
    evidentirano = await evidentirajDoprinos({
    pokroviteljId: pokrovitelj.id,
    rsdIznos: Number(prijava.vrednostRsd),
    tip: prijava.vrstaDonacije,
    evidentiraoId: adminId,
    napomena: `Prijava pokroviteljstva ${prijava.id}`,
    primalacId: prijava.podnosilacId,
    });
  } catch (e) {
    await prisma.pokroviteljPrijava.update({
      where: { id: prijavaId },
      data: { status: "POTPISANA", potvrdioId: null, potvrdjenoAt: null },
    });
    throw e;
  }
  const { poen, primalacId } = evidentirano;

  await prisma.pokroviteljPrijava.update({
    where: { id: prijavaId },
    data: {
      pokroviteljId: pokrovitelj.id,
      ...(zastupnik && uporedjenoAt ? { aprUporedjenAt: uporedjenoAt, aprUporedioId: adminId } : {}),
    },
  });

  // Logotip iz prijave (donacije čl. 26 st. 2) prelazi u evidenciju pokrovitelja:
  // najnoviji potvrđen logotip važi. Prijava bez logotipa ne briše zatečeni.
  if (prijava.logoUrl) {
    await prisma.pokrovitelj.update({ where: { id: pokrovitelj.id }, data: { logoUrl: prijava.logoUrl } });
  }

  // Upis u evidenciju identiteta (Pravilnik čl. 31 st. 2) — van transakcije, jer je
  // doprinos već evidentiran; ne baca, ishod je proveren gore.
  if (zastupnik) {
    await upisiIdentitet(prijava.podnosilacId, zastupnik, "POKROVITELJSTVO").catch((e) => {
      console.error("[pokroviteljstvo] upis u evidenciju identiteta nije uspeo", { prijavaId, e });
    });
  }

  // Spisak za poziv (dokaz stvarnosti čl. 8 st. 1 t. 3, set 4.8.2): utvrđen prijem
  // NOVČANOG pokroviteljstva podnosiocu koji je korisnik NUDI spisak. Dobra i usluge
  // ne vode na spisak (čl. 8 st. 3). Potvrda pokroviteljstvom je ukinuta: prijem ne
  // verifikuje. 🔴 Pokroviteljstvo i POEN po njemu ne zavise od ovoga (čl. 12 st. 1). Ne baca.
  if (
    pokroviteljstvoVodiNaSpisak({
      novcano: prijava.vrstaDonacije === "NOVAC",
      maloletan: podnosilac.maloletan,
    })
  ) {
    await ponudiSpisak(prijava.podnosilacId, "POKROVITELJSTVO");
  }

  return { bonus: poen, vlasnikId: primalacId, pokroviteljId: pokrovitelj.id };
}

/**
 * Odbijanje prijave uz obrazloženje (čl. 20 st. 5). Korisnik može podneti novu prijavu.
 */
export async function odbijPrijavu(prijavaId: string, adminId: string, razlog: string) {
  const prijava = await prisma.pokroviteljPrijava.findUnique({ where: { id: prijavaId } });
  if (!prijava) throw new Error("Prijava nije pronađena.");
  if (prijava.status === "POTVRDJENA" || prijava.status === "ODBIJENA")
    throw new Error("Prijava je već obrađena.");

  await prisma.pokroviteljPrijava.update({
    where: { id: prijavaId },
    data: { status: "ODBIJENA", odbijenoRazlog: razlog, potvrdioId: adminId },
  });

  return { podnosilacId: prijava.podnosilacId };
}

/**
 * Javna rang-lista, deo „novčani doprinos" (čl. 25 st. 1). Naziv i logotip iz upisa
 * pokrovitelja (čl. 26 st. 2), kad je povezan. 🔴 Obrisan upis OSTAJE na rang-listi,
 * sa nazivom i logotipom; uklanja se samo na zahtev korisnika koji je vodio upis
 * (čl. 18 st. 4). 🔴 Samo naziv, logotip i iznos u dinarima — bez nivoa (pokrovitelj
 * ga nema, čl. 22 st. 1, set 5.0.0, izmena 28.10.2026), POEN-a,
 * PIB-a, MB-a, sedišta i podnosioca.
 */
export async function javnaRangListaNovca() {
  const redovi = await prisma.pokrovitelj.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      naziv: true,
      logoUrl: true,
      rsdKumulativ: true,
      createdAt: true,
      upis: { select: { naziv: true, logoUrl: true, uklonjenSaRangListeAt: true } },
    },
    orderBy: { rsdKumulativ: "desc" },
  });
  return redovi
    .filter((p) => naRangListi(p.upis))
    .map(({ upis, ...p }) => ({
      ...p,
      naziv: upis?.naziv ?? p.naziv,
      logoUrl: upis ? upis.logoUrl : p.logoUrl,
      rsdKumulativ: Number(p.rsdKumulativ),
    }));
}
