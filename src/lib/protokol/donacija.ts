import { prisma } from "@/lib/prisma";
import { TransactionType, DonationStatus } from "@/generated/prisma/client";
import { upisiIdentitet, procitajImePrezime, istoIme } from "./identitet";
import { emitujPoen } from "./emisija";
import { probajEvidentiratiPotvrde } from "./potvrda-poen";
import { ponudiSpisak, donacijaVodiNaSpisak } from "./zahtev-razgovor";
import {
  izracunajPoenZaDonaciju,
  nivoZaKumulativ,
  normalizujUplatioca,
  PORUKA_DETE_NE_DONIRA,
} from "@/lib/donacija-pravila";
import { generisiUgovorODonaciji } from "@/lib/donacija-ugovor";

// Nivoi, koeficijent i obracun POENA zive u `donacija-pravila.ts` (bez Prisme,
// jer ih uvozi i admin ekran u pretrazivacu). Ovde se re-eksportuju, pa server
// i dalje ima jedan ulaz.
export {
  RANG_TABELA,
  KORAK_KOEFICIJENTA,
  nivoZaKumulativ,
  izracunajPoenZaDonaciju,
  pragZaNivo,
  koeficijentZaNivo,
  tabelaZaPrikaz,
  normalizujUplatioca,
  MAX_KARTICNA_UPLATA_RSD,
  MAX_KARTICNIH_UPLATA_DNEVNO,
} from "@/lib/donacija-pravila";

/**
 * Admin evidentira donaciju i emituje POEN iz Protokola (koeficijentni model).
 * Jedna transakcija sa iznosom = nova donacija × koeficijent nivoa.
 *
 * Javna vs anonimna donacija (Pravilnik o pokroviteljstvu i donacijama čl. 7):
 * - `javno = true` (podrazumevano): evidentira se POEN; ime i prezime donatora
 *   SNIMA se na zapis (`donatorIme`) i prikazuje u listi donacija. Kasnija
 *   izmena profila ga ne menja, ali NIJE trajan: donator ga povlači, a gašenje
 *   naloga ga briše (čl. 12, set 4.6.8). Ulazi u kumulativni nivo.
 * - `javno = false` (anonimna): POEN se NE evidentira (0), zapis NE ulazi u
 *   kumulativni nivo, ime se ne beleži.
 *
 * Napomena: provera „javna donacija zahteva uneto ime i prezime" radi se na
 * ulaznim tačkama (kartično `zapocni`, admin ruta) PRE naplate/potvrde. Ovde se
 * NE baca greška ako ime nedostaje — da naplaćena donacija ne ostane bez POEN-a;
 * `donatorIme` se snima samo kad ime postoji.
 */
export async function evidentirajDonaciju(
  userId: string,
  novaRSD: number,
  options?: {
    existingRecordId?: string;
    adminId?: string;
    javno?: boolean;
    /**
     * Ime uplatioca iz bankovnog izvoda (čl. 6 Pravilnika o pokroviteljstvu i
     * donacijama). Doprinos se evidentira ISKLJUČIVO korisniku čijim je
     * sredstvima uplata izvršena — ovo polje je trag da je to provereno.
     */
    uplatilac?: string | null;
    /** Uplata sa računa otvorenog u inostranstvu (čl. 38 t. 4). */
    straniPriliv?: boolean;
    /**
     * Uplatilac ne stoji uz drugi nalog (mera C-1). Uplata evidentirana „uprkos
     * poklapanju" (zajednički račun) ne potvrđuje stvarnost (dokaz stvarnosti
     * čl. 8 st. 2): dokazuje uplatu, ne jedinstvenost. Izostavljeno znači „nije provereno".
     */
    uplatilacJedinstven?: boolean;
  }
): Promise<{
  poenEmitted: number;
  noviNivo: number;
  noviKumulativ: number;
  kurs: number;
  /** Zapis donacije — pozivna mesta ga koriste za link na ugovor (čl. 14). */
  zapisId: string;
}> {
  const javno = options?.javno ?? true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      podaci: { select: { punoIme: true } },
      // pseudonim ide u ugovor o donaciji (cl. 5b)
      donations: {
        // Samo javne donacije ulaze u kumulativni nivo (anonimne ne nose POEN).
        // Tekući zapis (existingRecordId) se ISKLJUČUJE iz kumulativa — kartični tok
        // ga atomski postavi na CONFIRMED PRE ove funkcije (anti-dupli-callback), pa bi
        // se inače duplo brojao za izračun nivoa.
        where: {
          status: DonationStatus.CONFIRMED,
          javno: true,
          ...(options?.existingRecordId ? { id: { not: options.existingRecordId } } : {}),
        },
        select: { amountRSD: true },
      },
    },
  });

  if (!user) throw new Error("Korisnik nije pronađen.");
  if (!user.wallet) throw new Error("Član nema zapis u Protokolu.");
  if (user.maloletan) throw new Error(PORUKA_DETE_NE_DONIRA);
  // Donirati sme i korisnik koga niko nije uveo u Kolo, i POEN mu se evidentira
  // (R-01, mera M-9). Javna uplata od najmanje `PRAG_POTVRDE_UPLATOM_RSD` mu samo
  // nudi spisak za poziv (dokaz stvarnosti čl. 8, set 4.8.2) — vidi kraj funkcije.

  const dosadaRSD = user.donations.reduce((sum, d) => sum + Number(d.amountRSD), 0);

  const izracun = izracunajPoenZaDonaciju(dosadaRSD, novaRSD);

  // Anonimna donacija ne nosi POEN i ne pomera kumulativni nivo.
  const poen = javno ? izracun.poen : 0;
  const noviKumulativ = javno ? izracun.noviKumulativ : dosadaRSD;
  const noviNivo = javno ? izracun.noviNivo : nivoZaKumulativ(dosadaRSD).nivo;
  const kurs = javno ? izracun.kurs : nivoZaKumulativ(dosadaRSD).kurs;

  // Trajan snapshot imena za javnu donaciju (čl. 7 i 11) — ne menja se kasnije.
  const donatorIme = javno ? user.podaci?.punoIme?.trim() || null : null;

  // Uplatilac iz izvoda (čl. 6). Kad ga pozivno mesto ne prosledi (kartično
  // plaćanje), upisuje se ime samog korisnika — akt traži da platni instrument
  // glasi na donatora, pa je to ono što zapis tvrdi.
  const uplatilac = options?.uplatilac?.trim() || user.podaci?.punoIme?.trim() || null;
  const uplatilacKljuc = normalizujUplatioca(uplatilac);

  // Ugovor o donaciji (čl. 14) — sačinjava se pri potvrdi i SNIMA se na zapis.
  // Jedno mesto za sva tri puta (ručna evidencija, potvrda PENDING zapisa,
  // kartični callback), jer svi prolaze kroz ovu funkciju.
  const zapisId = options?.existingRecordId ?? crypto.randomUUID();
  const ugovorTekst = generisiUgovorODonaciji({
    ime: donatorIme,
    pseudonim: user.pseudonim,
    iznosRSD: novaRSD,
    javno,
    zapisId,
    datum: new Date(),
    uplatilac,
  });

  if (options?.existingRecordId) {
    await prisma.donationRecord.update({
      where: { id: options.existingRecordId },
      data: {
        amountRSD: novaRSD,
        cumulativeRSD: noviKumulativ,
        level: noviNivo,
        poenEmitted: poen,
        javno,
        donatorIme,
        uplatilac,
        uplatilacKljuc,
        straniPriliv: options.straniPriliv ?? false,
        ugovorTekst,
        status: DonationStatus.CONFIRMED,
        confirmedAt: new Date(),
        confirmedById: options.adminId ?? null,
      },
    });
  } else {
    await prisma.donationRecord.create({
      data: {
        id: zapisId,
        userId,
        amountRSD: novaRSD,
        cumulativeRSD: noviKumulativ,
        level: noviNivo,
        poenEmitted: poen,
        javno,
        donatorIme,
        uplatilac,
        uplatilacKljuc,
        straniPriliv: options?.straniPriliv ?? false,
        ugovorTekst,
        status: DonationStatus.CONFIRMED,
        confirmedAt: new Date(),
        confirmedById: options?.adminId ?? null,
      },
    });
  }

  if (poen > 0) {
    // 🔴 IME UPLATIOCA NE IDE U OPIS TRANSAKCIJE (R-03, mera M-3b).
    //
    // Do ovog seta je opis glasio „… — uplatilac: Petar Petrović", uz obrazloženje
    // iz R-19 da je ime ionako u listi donacija. To obrazloženje je palo sa merom
    // M-3a: lista donacija se sužava na redovne članove, a zapis transakcije ide
    // SVAKOM prijavljenom nalogu, uključujući nepotvrđene, kojima je pseudonim
    // strane maskiran (`/api/javno/feed`). Ime i prezime u opisu identifikuje
    // jače nego pseudonim koji je sakriven — opis je time postao širi kanal od
    // onoga na koji je pristanak dat (Uslovi čl. 16).
    //
    // Uplatilac ostaje na `DonationRecord.uplatilac` — tamo mu je mesto po čl. 6 i 38 t. 2
    // (AML trag iz R-19), i vidi ga samo Fondacija.
    await emitujPoen(
      user.wallet.id,
      poen,
      TransactionType.EMISIJA_DONACIJA,
      `Evidentiran doprinos po donaciji: ${poen.toLocaleString("sr-RS")} POEN`,
      { kljuc: "transakcije.donacija", parametri: { iznos: poen } }
    );

    // Javna donacija je jedan od četiri traga učešća koji otključavaju POEN po potvrdi
    // (dokaz stvarnosti čl. 19). 🔴 Stoji UNUTAR `if (poen > 0)`, pa anonimna donacija
    // ne otključava ništa — i to je namerno: POEN za potvrdu je javan zapis u knjizi,
    // pa bi se pojavio a na Pijaci ne bi osvanuo nijedan nov oglas, i posmatrač bi
    // zaključio da je čovek donirao. To je tačno ono što anonimna donacija krije
    // (čl. 7). Anoniman donator otključava nekim od druga tri puta.
    //
    // Ne baca: donacija je već evidentirana i ne sme da padne zbog ovog kanala.
    await probajEvidentiratiPotvrde(userId);
  }

  // Evidencija identiteta (Pravilnik čl. 31, set 4.7.3): javna donacija upisuje ime
  // donatora uz nalog, ako ga nalog još nema. Upisano ime se ne prepisuje — drugo ime
  // uplatioca (npr. zajednički račun) ostaje samo na zapisu donacije. Isti uslov
  // `javno` kao gore: anonimna donacija ne upisuje ništa. Za maloletni nalog se
  // evidencija identiteta ne vodi (čl. 31 st. 7). Ne baca — donacija je već
  // evidentirana.
  //
  // 🔴 Upisuje se samo PROVERENO ime (set 4.7.7): ime sa profila (`donatorIme`) korisnik
  // sam unosi, a proverava ga tek uplatilac iz izvoda. Ako se ne poklapaju — ili izvoda
  // nema — ne upisuje se ništa: netačno ime bi postalo „jedino ime" naloga i kasnije
  // blokiralo gazdinstvo ili zadrugu, a ime uplatioca može biti tuđe (zajednički račun).
  const izvod = options?.uplatilac?.trim() || null;
  if (javno && !user.maloletan && izvod && istoIme(donatorIme, izvod)) {
    const ime = procitajImePrezime(donatorIme);
    if (ime.ok) {
      await upisiIdentitet(userId, ime.imePrezime, "DONACIJA").catch((e) =>
        console.error("[donacija] upis u evidenciju identiteta nije uspeo", { userId, e }),
      );
    }
  }

  // Spisak za poziv (dokaz stvarnosti čl. 8 st. 1 t. 2, st. 3; set 4.8.2): javna
  // donacija od praga, jednom uplatom, uz poklapanje uplatioca sa imenom i bez
  // uplatioca uz drugi nalog, korisniku NUDI spisak — obaveštenje sa linkom na
  // „Želim da me neko nazove". Potvrda uplatom je ukinuta: uplata ne verifikuje.
  // 🔴 ANONIMNA DONACIJA NE VODI NA SPISAK: po njoj se ništa ne pripisuje licu.
  // 🔴 Donacija i POEN po njoj ne zavise od ovoga (čl. 12 st. 1). Ne baca.
  if (
    donacijaVodiNaSpisak({
      javno,
      iznosRsd: novaRSD,
      imeSePoklapa: istoIme(donatorIme, izvod),
      uplatilacJedinstven: options?.uplatilacJedinstven === true,
      maloletan: user.maloletan,
    })
  ) {
    await ponudiSpisak(userId, "DONACIJA");
  }

  return { poenEmitted: poen, noviNivo, noviKumulativ, kurs, zapisId };
}

/**
 * Provera duplikata po uplatiocu (mera C-1 uz R-01).
 *
 * Uplatilac je JEDINI spoljni identitet koji sistem uopšte ima: uplata prolazi
 * kroz banku, koja je identifikaciju već sprovela. Dva naloga sa uplatama istog
 * uplatioca su, po pravilu, isti čovek — što Uslovi čl. 8 zabranjuju, a lanac
 * potvrda ne može da otkrije (verifikator ne zna koliko naloga neko ima).
 *
 * 🔴 Ne blokira samo od sebe — vraća nalaz, a odluku donosi čovek. Legitiman
 * slučaj postoji (uplata sa zajedničkog porodičnog računa), pa bi tvrda zabrana
 * pogađala i njega. Poklapanje zaustavlja evidentiranje dok ga čovek izričito
 * ne potvrdi, i to potvrđivanje ide u revizijski dnevnik.
 */
export async function proveriDuplikatUplatioca(
  userId: string,
  uplatilac: string | null | undefined
): Promise<{ sudar: boolean; pseudonimi: string[] }> {
  const kljuc = normalizujUplatioca(uplatilac);
  if (!kljuc) return { sudar: false, pseudonimi: [] };

  const zapisi = await prisma.donationRecord.findMany({
    where: {
      uplatilacKljuc: kljuc,
      status: DonationStatus.CONFIRMED,
      userId: { not: userId },
    },
    select: { user: { select: { pseudonim: true } } },
    take: 20,
  });
  const pseudonimi = [...new Set(zapisi.map((z) => z.user.pseudonim))];
  return { sudar: pseudonimi.length > 0, pseudonimi };
}
