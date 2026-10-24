import { prisma } from "@/lib/prisma";
import { emitujPoen } from "./emisija";
import { probajEvidentiratiPotvrde } from "./potvrda-poen";
import { imeNaloga, ishodUpisa, upisiIdentitet, PORUKA_DRUGO_IME } from "./identitet";
import { ponudiSpisak, pokroviteljstvoVodiNaSpisak } from "./zahtev-razgovor";
import { VrstaDonacije } from "@/generated/prisma/client";
import { nivoPokroviteljstvaZaKumulativ } from "@/lib/donacija-pravila";
import { naRangListi, kljucNovcanogPokrovitelja, upisOdobrenZaPotvrdu } from "@/lib/upis-pokrovitelja-pravila";
import type { VrstaDavaoca } from "@/lib/pokroviteljstvo-dobrima-pravila";

// Koeficijentni model, pragovi i minimum prijave žive u `donacija-pravila.ts`
// (bez Prisme, jer ih uvozi i ekran u pretraživaču). Ovde se re-eksportuju, pa
// server ima jedan ulaz — isti obrazac kao kod donacija.
export {
  MINIMUM_PRIJAVE_POKROVITELJSTVA,
  procitajPrijavuPokroviteljstva,
  nivoPokroviteljstvaZaKumulativ,
  tabelaPokroviteljstvaZaPrikaz,
} from "@/lib/donacija-pravila";

/**
 * Evidentira doprinos pokrovitelja i emituje POEN po ISTOJ tabeli kao donacija
 * fizičkog lica (čl. 10, set 4.6.8). Nivo se računa iz kumulativa pokrovitelja —
 * firme po PIB-u, registrovanog gazdinstva po BPG-u (set 4.7.9) — odvojeno od ličnih
 * donacija onoga ko POEN prima. 🔴 Gazdinstvo nema poseban koeficijent: ista tabela.
 *
 * 🔴 POEN dobija JEDNO lice — ono koje je podnelo prijavu (čl. 11, odluka vlasnika
 * 2026-10-17), ne `Pokrovitelj.vlasnik` upisan pri prvoj prijavi. Doprinos se ne
 * raspoređuje na više vlasnika. `primalacId` izostaje samo kod ručnog upisa iz
 * admin panela, koji nema prijavu; tada POEN ide upisanom vlasniku.
 *
 * 🔴 Već evidentiran POEN po ranijoj tabeli (fiksni bonusi do 2026-09-08, pa
 * uvećanje od 20% do 4.6.8) se NE poništava (prelazna odredba čl. 10).
 */
export async function evidentirajDoprinos(params: {
  pokroviteljId: string;
  rsdIznos: number;
  tip: VrstaDonacije;
  evidentiraoId: string;
  napomena?: string;
  primalacId?: string;
}) {
  const { pokroviteljId, rsdIznos, tip, evidentiraoId, napomena } = params;
  // 🔴 Kumulativ je NOVČANI (čl. 10; čl. 13h st. 3, O-6). Vrednost dobara i usluga
  // se ne dodaje — inače bi roba bila jeftiniji put do višeg nivoa. Dobra i usluge
  // idu kroz `protokol/pokroviteljstvo-dobrima.ts`, koji kumulativ samo čita.
  if (tip !== "NOVAC") throw new Error("U kumulativ pokrovitelja ulazi samo novčani doprinos.");

  // Korak 1: DB transakcija
  const { noviNivoi, vlasnikWalletId, vlasnikId } = await prisma.$transaction(async (tx) => {
    const pokrovitelj = await tx.pokrovitelj.findUniqueOrThrow({
      where: { id: pokroviteljId },
      include: { vlasnik: { include: { wallet: true } } },
    });
    const primalac = params.primalacId
      ? await tx.user.findUniqueOrThrow({
          where: { id: params.primalacId },
          include: { wallet: true },
        })
      : pokrovitelj.vlasnik;

    const stariKumulativ = Number(pokrovitelj.rsdKumulativ);
    const noviKumulativ = stariKumulativ + rsdIznos;

    // Nivo se od sada IZVODI iz kumulativa (ne pamti se kao dostignuće koje ne
    // sme da opadne) — kumulativ ionako samo raste, pa je izvod jednoznačan.
    const { nivo: noviNivo, kurs } = nivoPokroviteljstvaZaKumulativ(noviKumulativ);
    const bonusPoen = Math.round(rsdIznos * kurs);

    await tx.pokroviteljDoprinos.create({
      data: {
        pokroviteljId,
        rsdIznos: rsdIznos,
        tip,
        evidentiraoId,
        napomena,
      },
    });

    await tx.pokrovitelj.update({
      where: { id: pokroviteljId },
      data: {
        rsdKumulativ: noviKumulativ,
        trenutniNivo: noviNivo,
      },
    });

    // Jedan zapis po doprinosu, ne po nivou — koeficijentni model nema „naplatu
    // preskočenih nivoa"; ceo iznos je već pomnožen koeficijentom.
    const noviNivoi: { nivo: number; bonusPoen: number; bonusId: string }[] = [];
    if (bonusPoen > 0) {
      const bonus = await tx.pokroviteljBonusEmisija.create({
        data: {
          pokroviteljId,
          vlasnikId: primalac.id,
          nivo: noviNivo,
          bonusPoen,
        },
      });
      noviNivoi.push({ nivo: noviNivo, bonusPoen, bonusId: bonus.id });
    }

    return {
      noviNivoi,
      vlasnikWalletId: primalac.wallet!.id,
      vlasnikId: primalac.id,
    };
  });

  // Korak 2: Emituj bonus POEN za dostignute nivoe
  const bonusiZbir = noviNivoi.reduce((s, n) => s + n.bonusPoen, 0);

  if (bonusiZbir > 0) {
    const { transaction } = await emitujPoen(
      vlasnikWalletId,
      bonusiZbir,
      "EMISIJA_POKROVITELJ",
      `Bonus za pokroviteljstvo iznos ${bonusiZbir.toLocaleString("sr-RS")}`, { kljuc: "transakcije.pokroviteljstvo", parametri: { iznos: bonusiZbir } }
    );

    // Poveži sve bonus zapise sa istom transakcijom
    for (const { bonusId } of noviNivoi) {
      await prisma.pokroviteljBonusEmisija.update({
        where: { id: bonusId },
        data: { transactionId: transaction.id },
      });
    }

    // Pokroviteljstvo je jedan od četiri traga učešća koji otključavaju POEN po potvrdi
    // (dokaz stvarnosti čl. 7). Doprinos se evidentira u zapisu onoga ko je prijavu
    // podneo (donacije čl. 11), pa se i uslov meri njemu.
    // Ne baca: doprinos je već evidentiran.
    await probajEvidentiratiPotvrde(vlasnikId);
  }

  return { noviNivoi, primalacId: vlasnikId };
}

/**
 * Auto-generisani tekst ugovora o donaciji (čl. 7–8). Ne sadrži odredbe o POEN-u.
 */
export function generisiUgovorTekst(p: {
  /** FIRMA (pravno lice, preduzetnik) ili GAZDINSTVO (nosilac registrovanog
   *  poljoprivrednog gazdinstva, čl. 6 i 7 st. 4, set 4.7.9). Podrazumevano FIRMA. */
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
  // Od 2026-09-08 pokroviteljstvo je isključivo NOVAC (čl. 6). `vrstaDonacije`
  // ostaje u potpisu zbog zatečenih prijava — enum nose istorijski zapisi.
  //
  // 🔴 Tekst se snima pri podnošenju i ne generiše ponovo; zatečeni ugovori
  // (bez MB, sedišta i zastupnika) ostaju kakvi su bili.
  //
  // Gazdinstvo (čl. 7 st. 4, čl. 8 st. 1): ugovor zaključuje sam nosilac, uz naziv i
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
    `2) KOLO Fondacije (u daljem tekstu: Primalac).`,
    "",
    gazdinstvo
      ? `Član 1. Donator donira Primaocu novčani iznos od ${p.vrednostRsd.toLocaleString("sr-RS")} RSD, uplatom na račun Primaoca sa računa gazdinstva ili sa sopstvenog računa.`
      : `Član 1. Donator donira Primaocu novčani iznos od ${p.vrednostRsd.toLocaleString("sr-RS")} RSD.`,
    "Član 2. Donacija je dobrovoljna i bez naknade.",
    "Član 3. Ovaj ugovor ne sadrži odredbe o POENU niti o evidentiranju POENA.",
    "Član 4. Poreske obaveze koje proizlaze iz donacije snosi Donator u skladu sa važećim propisima.",
    // F5-M1 (registar 2026-10): isti način zaključenja kao ugovor o dobrima (čl. 13g st. 4).
    "Član 5. Ugovor se zaključuje elektronskim putem na platformi KOLO, potvrdom podnosioca na platformi i unosom jednokratnog koda dostavljenog na njegovu adresu elektronske pošte. Tako zaključen ugovor punovažan je bez pečata i svojeručnog potpisa. Platforma beleži vreme zaključenja i kontrolni broj teksta i dostavlja Donatoru primerak ugovora za štampu.",
    "",
    gazdinstvo
      ? `Potpisom ${p.zastupnikImePrezime} potvrđuje da je nosilac gazdinstva i da prihvata uslove ugovora.`
      : `Potpisom ${p.zastupnikImePrezime} potvrđuje da je ovlašćen da zastupa Donatora i da prihvata uslove ugovora.`,
  ].join("\n");
}

/**
 * Potvrda prijema doprinosa (čl. 8). Pronalazi ili registruje pokrovitelja —
 * pravno lice ili preduzetnika po PIB-u, registrovano gazdinstvo po BPG-u (set 4.7.9) —
 * evidentira doprinos i emituje POEN podnosiocu prijave (čl. 10 i 11).
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

  // Upis pokrovitelja (donacije čl. 6a): Fondacija je naziv, MB i zastupnika
  // uporedila sa registrom PRI ODOBRENJU UPISA (čl. 6a st. 4, čl. 7 st. 3), pa se
  // poređenje ovde ne ponavlja — čita se iz upisa. Obrisan upis ne sprečava potvrdu
  // već potpisane prijave (donacija je možda uplaćena; registar se čuva).
  //
  // Zatečene prijave bez upisa zadržavaju raniji tok: poređenje pri potvrdi.
  //
  // 🔴 Banka potvrđuje firmu, a registar ko je firmu zastupa: tek posle poređenja
  // ime ide u evidenciju identiteta (Pravilnik čl. 31a st. 2 t. 4). Beleži se samo
  // DA je poređenje izvršeno.
  //
  // 🔴 Registrovano gazdinstvo se ne poredi sa APR-om (čl. 6a st. 2 i 4): dovoljno je
  // da je upis odobren (čl. 7 st. 3, set 4.7.9). Ime nosioca ide u evidenciju
  // identiteta uz broj gazdinstva koji je naveo (Pravilnik čl. 31a st. 2 t. 4).
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
    // Jedan nalog, jedno ime (čl. 31a st. 3) — proverava se PRE evidentiranja,
    // da doprinos ne ode u zapis naloga uz koji stoji drugo ime.
    if (ishodUpisa(await imeNaloga(prijava.podnosilacId), zastupnik) === "RAZLIKUJE_SE")
      throw new Error(PORUKA_DRUGO_IME);
  }

  // Pronađi ili registruj pokrovitelja: pravno lice i preduzetnika po PIB-u,
  // registrovano gazdinstvo po BPG-u. 🔴 Gazdinstvo je sopstveni red sa sopstvenim
  // kumulativom (čl. 10 st. 3) — nikad red firme nosioca ni njegov lični zbir.
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
    // Rang-lista čita naziv i logotip iz upisa (čl. 13 st. 4).
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
  const { noviNivoi, primalacId } = evidentirano;

  await prisma.pokroviteljPrijava.update({
    where: { id: prijavaId },
    data: {
      pokroviteljId: pokrovitelj.id,
      ...(zastupnik && uporedjenoAt ? { aprUporedjenAt: uporedjenoAt, aprUporedioId: adminId } : {}),
    },
  });

  // Logotip iz prijave (donacije čl. 13 st. 4) prelazi u evidenciju pokrovitelja:
  // najnoviji potvrđen logotip važi. Prijava bez logotipa ne briše zatečeni.
  if (prijava.logoUrl) {
    await prisma.pokrovitelj.update({ where: { id: pokrovitelj.id }, data: { logoUrl: prijava.logoUrl } });
  }

  // Upis u evidenciju identiteta (čl. 31a st. 2 t. 4) — van transakcije, jer je
  // doprinos već evidentiran; ne baca, ishod je proveren gore.
  if (zastupnik) {
    await upisiIdentitet(prijava.podnosilacId, zastupnik, "POKROVITELJSTVO").catch((e) => {
      console.error("[pokroviteljstvo] upis u evidenciju identiteta nije uspeo", { prijavaId, e });
    });
  }

  // Spisak za poziv (dokaz stvarnosti čl. 4a st. 2 t. 3, set 4.8.2): utvrđen prijem
  // NOVČANOG pokroviteljstva podnosiocu koji je korisnik NUDI spisak. Dobra i usluge
  // ne vode na spisak (st. 3). Potvrda pokroviteljstvom je ukinuta: prijem ne
  // verifikuje. 🔴 Pokroviteljstvo i POEN po njemu ne zavise od ovoga (st. 6). Ne baca.
  if (
    pokroviteljstvoVodiNaSpisak({
      novcano: prijava.vrstaDonacije === "NOVAC",
      maloletan: podnosilac.maloletan,
    })
  ) {
    await ponudiSpisak(prijava.podnosilacId, "POKROVITELJSTVO");
  }

  const bonus = noviNivoi.reduce((s, n) => s + n.bonusPoen, 0);
  return { noviNivoi, bonus, vlasnikId: primalacId, pokroviteljId: pokrovitelj.id };
}

/**
 * Odbijanje prijave uz obrazloženje (čl. 8). Korisnik može podneti novu prijavu.
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
 * Javna rang-lista, deo „novčani doprinos" (čl. 13 st. 1). Naziv i logotip iz upisa
 * pokrovitelja (čl. 13 st. 4), kad je povezan. 🔴 Obrisan upis OSTAJE na rang-listi,
 * sa nazivom i logotipom; uklanja se samo na zahtev korisnika koji je vodio upis
 * (čl. 6a st. 6). 🔴 Samo naziv, logotip, nivo i iznos u dinarima — bez POEN-a,
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
      trenutniNivo: true,
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
