import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { iznosPovracaja, stanjePosle, idUMinus } from "@/lib/razmena-prijava";
import { ROK_IZJASNJENJA_DANA, rokOd, smeOdlucitiORazmeni } from "@/lib/prigovor-pravila";

export * from "@/lib/razmena-prijava";

/**
 * Odlučivanje o prijavi neispunjene razmene (servisne funkcije — sa Prismom).
 * Čista pravila su u `src/lib/razmena-prijava.ts` i odatle se re-eksportuju, pa
 * server ima jedan ulaz.
 *
 * Poništenje ide PROTIVZAPISOM tipa `PONISTENJE_PREPISA`, ne brisanjem reda:
 *  - istorija se ne prepravlja (isti obrazac kao pri prestanku statusa, čl. 34);
 *  - zaseban tip, ne TRANSFER, jer brojač putanje doprinosa razmeni (čl. 40b)
 *    čita transakcije tipa TRANSFER — povraćaj upisan kao TRANSFER bi lažno
 *    otvorio korak 2 onome kome je prepis poništen.
 *
 * Zero-sum ostaje netaknut: POEN se seli između dva korisnička zapisa, Protokol
 * se ne pomera.
 */

export type IshodOdluke =
  | { ok: true; vraceno: number; uMinusu: boolean }
  | { ok: false; razlog: string };

/**
 * Poništi prepis po prijavi.
 *
 * Vraća se CEO prepisani iznos, pa zapis primaoca ume da ode u minus — minus
 * radi isto što i nadoknada iz čl. 20b (nije dug, ne naplaćuje se, POEN-i koji
 * pristignu prvo ga popunjavaju, prepis drugome tek preko nule). Bez toga bi
 * onaj ko brže potroši tuđi POEN prolazio jeftinije od onog ko ga sačuva.
 */
export async function ponistiPrepis(
  prijavaId: string,
  adminId: string,
  odluka: string,
): Promise<IshodOdluke> {
  const prijava = await prisma.prijavaRazmene.findUnique({
    where: { id: prijavaId },
    include: {
      transakcija: true,
      prijavioc: { select: { id: true, pseudonim: true, wallet: { select: { id: true } } } },
      protiv: { select: { id: true, pseudonim: true, wallet: { select: { id: true, balance: true } } } },
    },
  });

  if (!prijava) return { ok: false, razlog: "Prijava ne postoji." };
  if (prijava.status !== "OTVORENA") return { ok: false, razlog: "O prijavi je već odlučeno." };
  if (!prijava.prijavioc.wallet || !prijava.protiv.wallet)
    return { ok: false, razlog: "Jedna od strana nema zapis u Protokolu." };

  // 🔴 Druga strana se izjašnjava PRE odluke (Pravilnik čl. 16 st. 10, set 4.5.4).
  // Odluka gura tuđi zapis u minus; postupak u kome se čuje samo jedna strana za
  // takvu posledicu nije dovoljan. Provera je ovde, u servisu, a ne u ruti — reč
  // je o pravilu, ne o zaštiti ekrana.
  const glas = smeOdlucitiORazmeni({
    izjasnjenjeDo: prijava.izjasnjenjeDo,
    odgovorProtivAt: prijava.odgovorProtivAt,
    sada: new Date(),
  });
  if (!glas.ok) return { ok: false, razlog: glas.razlog };

  const iznos = prijava.transakcija.amount;
  const vraceno = iznosPovracaja(iznos);
  const uMinusu = idUMinus(prijava.protiv.wallet.balance, iznos);
  const stanjeNakon = stanjePosle(prijava.protiv.wallet.balance, iznos);

  try {
    await prisma.$transaction(async (tx) => {
      if (vraceno > 0) {
        // Bez uslova na stanje: minus je ovde dozvoljen ishod, ne greška.
        await tx.wallet.update({
          where: { id: prijava.protiv.wallet!.id },
          data: { balance: { decrement: vraceno } },
        });

        await tx.wallet.update({
          where: { id: prijava.prijavioc.wallet!.id },
          data: { balance: { increment: vraceno } },
        });

        await tx.transaction.create({
          data: {
            fromWalletId: prijava.protiv.wallet!.id,
            toWalletId: prijava.prijavioc.wallet!.id,
            amount: vraceno,
            type: TransactionType.PONISTENJE_PREPISA,
            description: "Poništen prepis po prijavi Fondaciji",
          },
        });
      }

      const zatvoreno = await tx.prijavaRazmene.updateMany({
        where: { id: prijavaId, status: "OTVORENA" },
        data: { status: "PONISTENA", odluka, resioId: adminId, resenAt: new Date(), vraceno },
      });
      if (zatvoreno.count !== 1) throw new Error("VEC_RESENA");
    });
  } catch (e) {
    if (e instanceof Error && e.message === "VEC_RESENA")
      return { ok: false, razlog: "O prijavi je već odlučeno." };
    throw e;
  }

  // Obaveštenja i audit — van transakcije, ne obaraju odluku ako padnu.
  await obavesti(prijava.prijaviocId, {
    tip: "prijava_razmene",
    kljuc: "notifikacije.prijava_razmene_ponistena",
    parametri: { iznos: vraceno, pseudonim: prijava.protiv.pseudonim, odluka },
    naslov: `Vraćeno ti je ${vraceno.toLocaleString("sr-RS")} POEN`,
    tekst: `Fondacija je poništila prepis ka ${prijava.protiv.pseudonim}. Vraćeno ti je ${vraceno.toLocaleString("sr-RS")} POEN. Obrazloženje: ${odluka}`,
    link: "/novcanik",
  });

  // Kad zapis ode u minus, čoveku se to MORA objasniti drugim tekstom: minus
  // menja šta sme sa zapisom (prepis drugome tek preko nule), a nije dug.
  await obavesti(prijava.protivId, {
    tip: "prijava_razmene",
    kljuc: uMinusu ? "notifikacije.prijava_razmene_oduzeto_minus" : "notifikacije.prijava_razmene_oduzeto",
    parametri: {
      iznos: vraceno,
      pseudonim: prijava.prijavioc.pseudonim,
      odluka,
      nadoknada: Math.abs(Math.min(0, stanjeNakon)),
    },
    naslov: "Prepis je poništen",
    tekst: uMinusu
      ? `Fondacija je po prijavi poništila prepis od ${prijava.prijavioc.pseudonim} i sa tvog zapisa je vraćeno ${vraceno.toLocaleString("sr-RS")} POEN. Zapis je time otišao u minus i na njemu stoji nadoknada od ${Math.abs(Math.min(0, stanjeNakon)).toLocaleString("sr-RS")} POENA: nije dug i ne može se naplatiti, POENI koji ti pristignu prvo je popunjavaju, a prepis drugome je moguć kad zapis pređe nulu. Razmena dobara i usluga ti nije ograničena. Obrazloženje: ${odluka}`
      : `Fondacija je po prijavi poništila prepis od ${prijava.prijavioc.pseudonim}. Sa tvog zapisa je vraćeno ${vraceno.toLocaleString("sr-RS")} POEN. Obrazloženje: ${odluka}`,
    link: "/novcanik",
  });

  await logAdminAkcija(
    adminId,
    "PREPIS_PONISTEN",
    prijava.protivId,
    `prijava ${prijavaId}, prepis ${prijava.transakcijaId}, vraćeno ${vraceno}, stanje primaoca posle ${stanjeNakon}; razlog: ${odluka}`,
  );

  await zatvoriPrigovorUzPrijavu(prijava.prigovorId, adminId, odluka, "RESENO");

  return { ok: true, vraceno, uMinusu };
}

/**
 * Odbaci prijavu — prepis ostaje kakav jeste.
 *
 * Obrazloženje je obavezno i ide prijaviocu: odluka bez razloga je za čoveka
 * isto što i ćutanje (isti zahtev kao pri uklanjanju oglasa, Uslovi čl. 25 st. 2).
 */
export async function odbaciPrijavu(
  prijavaId: string,
  adminId: string,
  odluka: string,
): Promise<IshodOdluke> {
  const prijava = await prisma.prijavaRazmene.findUnique({
    where: { id: prijavaId },
    select: {
      id: true, status: true, prijaviocId: true, transakcijaId: true,
      prigovorId: true, izjasnjenjeDo: true, odgovorProtivAt: true,
    },
  });
  if (!prijava) return { ok: false, razlog: "Prijava ne postoji." };
  if (prijava.status !== "OTVORENA") return { ok: false, razlog: "O prijavi je već odlučeno." };

  const glas = smeOdlucitiORazmeni({
    izjasnjenjeDo: prijava.izjasnjenjeDo,
    odgovorProtivAt: prijava.odgovorProtivAt,
    sada: new Date(),
  });
  if (!glas.ok) return { ok: false, razlog: glas.razlog };

  const zatvoreno = await prisma.prijavaRazmene.updateMany({
    where: { id: prijavaId, status: "OTVORENA" },
    data: { status: "ODBACENA", odluka, resioId: adminId, resenAt: new Date(), vraceno: 0 },
  });
  if (zatvoreno.count !== 1) return { ok: false, razlog: "O prijavi je već odlučeno." };

  await obavesti(prijava.prijaviocId, {
    tip: "prijava_razmene",
    kljuc: "notifikacije.prijava_razmene_odbacena",
    parametri: { odluka },
    naslov: "Prijava razmene je razmotrena",
    tekst: `Fondacija je razmotrila tvoju prijavu i prepis ostaje. Obrazloženje: ${odluka}`,
    link: "/novcanik",
  });

  await logAdminAkcija(
    adminId,
    "PRIJAVA_RAZMENE_ODBACENA",
    prijava.prijaviocId,
    `prijava ${prijavaId}, prepis ${prijava.transakcijaId}; razlog: ${odluka}`,
  );

  await zatvoriPrigovorUzPrijavu(prijava.prigovorId, adminId, odluka, "ODBIJENO");

  return { ok: true, vraceno: 0, uMinusu: false };
}

/**
 * Zatvori prigovor kroz koji je slučaj otvoren.
 *
 * 🔴 Odluka o prepisu i odgovor na prigovor su JEDAN čin, ne dva. Da se prigovor
 * zatvara zasebno, administrator bi rešio slučaj u jednom tabu a čoveku bi
 * prigovor visio otvoren u profilu — i dva zapisa o istoj stvari razišla bi se
 * prvi put kad neko zaboravi drugi klik.
 */
async function zatvoriPrigovorUzPrijavu(
  prigovorId: string | null,
  adminId: string,
  odgovor: string,
  status: "RESENO" | "ODBIJENO",
) {
  if (!prigovorId) return;
  await prisma.prigovorNaOdluku.updateMany({
    where: { id: prigovorId, status: { in: ["PENDING", "U_OBRADI"] } },
    data: { status, odgovor, odgovorioId: adminId, odgovorioAt: new Date() },
  });
}

/**
 * Otvori slučaj po prigovoru sa profila (Uslovi čl. 37a).
 *
 * Ulazna tačka je od seta 4.5.4 isključivo profil — dugme uz prepis u istoriji
 * POEN-a je uklonjeno, jer je bilo jedino mesto u sistemu na kome je jedan čovek
 * jednim klikom pokretao obaranje tuđeg zapisa.
 *
 * Ovde se upisuje i rok u kome se druga strana izjašnjava i šalje joj se poziv;
 * bez toga bi `ponistiPrepis` odbijao odluku dok rok ne istekne, a rok nikad ne
 * bi ni počeo.
 */
export async function otvoriPrijavuRazmene(args: {
  transakcijaId: string;
  prijaviocId: string;
  prijaviocPseudonim: string;
  protivId: string;
  opis: string;
  prigovorId: string;
}) {
  const izjasnjenjeDo = rokOd(new Date(), ROK_IZJASNJENJA_DANA);
  const prijava = await prisma.prijavaRazmene.create({
    data: {
      transakcijaId: args.transakcijaId,
      prijaviocId: args.prijaviocId,
      protivId: args.protivId,
      opis: args.opis,
      prigovorId: args.prigovorId,
      izjasnjenjeDo,
    },
    select: { id: true },
  });

  await obavesti(args.protivId, {
    tip: "prijava_razmene",
    kljuc: "notifikacije.prijava_razmene_izjasni",
    parametri: { dana: ROK_IZJASNJENJA_DANA },
    naslov: "Traži se tvoje izjašnjenje",
    tekst:
      `${args.prijaviocPseudonim} je podneo prigovor da razmena povodom koje ti je prepisao POEN nije ispunjena. ` +
      `Imaš ${ROK_IZJASNJENJA_DANA} dana da se izjasniš pre nego što Fondacija odluči. Izjašnjenje se unosi na profilu.`,
    link: "/profil",
  });

  return prijava.id;
}

/** Izjašnjenje druge strane pre odluke (Pravilnik čl. 16 st. 10). */
export async function odgovoriNaPrijavuRazmene(
  prijavaId: string,
  korisnikId: string,
  odgovor: string,
): Promise<IshodOdluke> {
  const p = await prisma.prijavaRazmene.findUnique({
    where: { id: prijavaId },
    select: { id: true, status: true, protivId: true, odgovorProtivAt: true },
  });
  if (!p || p.protivId !== korisnikId) return { ok: false, razlog: "Prijava ne postoji." };
  if (p.status !== "OTVORENA") return { ok: false, razlog: "O prijavi je već odlučeno." };
  if (p.odgovorProtivAt) return { ok: false, razlog: "Već si se izjasnio." };
  if (odgovor.trim().length < 10)
    return { ok: false, razlog: "Izjašnjenje mora imati najmanje 10 znakova." };

  await prisma.prijavaRazmene.updateMany({
    where: { id: prijavaId, status: "OTVORENA", odgovorProtivAt: null },
    data: { odgovorProtiv: odgovor.trim(), odgovorProtivAt: new Date() },
  });
  return { ok: true, vraceno: 0, uMinusu: false };
}
