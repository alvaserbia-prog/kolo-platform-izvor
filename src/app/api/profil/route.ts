import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GazdinstvoStatus, PotvrdaPoenStatus, TransactionType, UserStatus } from "@/generated/prisma/client";
import { obrisiSaR2 } from "@/lib/skladiste";
import { POEN_NADZORNIK, POEN_VERIFIKATOR } from "@/lib/protokol/dokaz-stvarnosti";
import { gdePseudonim, poljaPseudonima } from "@/lib/pseudonim";
import { smeDaSalje } from "@/lib/doprinos-pravila";
import { ugasiOznakeNaloga, poslediceIzlaskaNaloga } from "@/lib/protokol/izlaz-naloga";

const PROTOKOL_WALLET_ID = "banka-singleton";

/**
 * DELETE /api/profil
 * Korisnik zahteva brisanje naloga (čl. 17 ZZPL — pravo na zaborav).
 *
 * Implementacija Pravilnika čl. 33 — Posledice prestanka statusa:
 * — Aktivno ZRNO prelazi u slobodno, a potom se svo slobodno ZRNO otpisuje
 *   i vraća u raspoloživa ZRNA u Protokolu. Otpis NE pokreće evidentiranje POEN-a
 *   prema obračunskom koeficijentu.
 * — Zapisi POEN-a korisnika poništavaju se, protivzapis Protokola se umanjuje
 *   za isti iznos. Zero-sum invarijanta ostaje očuvana.
 * — Brišu se elektronska adresa i dobrovoljno dostavljeni podaci; anonimizuju
 *   se veze korisnika u grafu verifikacija (User entitet postaje anonimni);
 *   numerička istorija zadržava se pod identifikatorom koji više ne omogućava
 *   identifikaciju.
 *
 * Body: { prenesPoen?: string } — pseudonim primaoca preostalih POEN-a (opciono;
 *   ako nije zadat, POEN-i se poništavaju kao po čl. 33 st. 2)
 *
 * Tok:
 * 1. Aktivno ZRNO → slobodno → otpis u Protokol BEZ POEN emisije (čl. 33 st. 1)
 * 2. Anonimizacija grafa verifikacija (čl. 33 st. 4):
 *      — potvrde koje je obrisani DAO ostaju na snazi (dokaz stvarnosti čl. 30,
 *        set 4.7.5): onaj koga je potvrdio zadržava indeks, status i POEN,
 *      — brišu se veze u kojima je obrisani bio POTVRĐENI; POEN emitovan
 *        povodom njih vraća se Protokolu (verifikatoru, nadzorniku — capped na balance),
 *      — veze gde je obrisani bio samo nadzornik ostaju (nadzornikId = null).
 * 3. Poništi POEN balans korisnika (ili prenesi drugom korisniku ako je zadat primalac)
 * 4. Zadruga, gazdinstvo, vaučeri, upis pokrovitelja — zajedničko za sve izlaze
 *    (`ugasiOznakeNaloga` u koraku 5, `poslediceIzlaskaNaloga` posle njega)
 * 5. Obriši aktivne tokene (VerifikacijaToken, PasswordResetToken); anonimizuj User i UserPodaci;
 *    u ISTOJ transakciji `ugasiOznakeNaloga` gasi keš statusa i ostale žive oznake
 * 6. Ukloni oglase i njihov sadržaj (Politika čl. 42 st. 2) — vidi korak 4b
 * 7. Obriši slobodan tekst uz prepise POEN-a (Politika čl. 42 st. 2)
 * 7b. Obriši plan, opis i dokaz operativnog doprinosa, slobodan tekst prigovora i
 *    prijava, prijave grešaka i opis zapisa koji nosi podatak o ličnosti
 *    (`obrisiSadrzajPriPrestanku`; Politika čl. 30 st. 5, 32 st. 7, 38 st. 4, 42 st. 2;
 *    Pravilnik čl. 55 st. 2) — zove ga `ugasiOznakeNaloga` u transakciji koraka 5,
 *    isto kao pri isključenju i nepostojećem nalogu
 * 8. Zadržaj: numerička istorija transakcija, audit log, KrugBonusLog
 *
 * 🔴 Ovo je PSEUDONIMIZACIJA, ne anonimizacija (set 4.5.1, R-14). `User` red
 * ostaje sa svojim `id`, a nov pseudonim je iz njega izveden — Fondacija u
 * svakom trenutku može ponovo da poveže zapis sa osobom. Zapisi zato i dalje
 * jesu podaci o ličnosti; ograničenje brisanja stoji na čl. 30 st. 3 ZZPL-a
 * (zakonska obaveza čuvanja i integritet evidencije), ne na tvrdnji da su
 * prestali to da budu. Ne vraćati raniju formulaciju.
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const userId = session.user.id;

  // Pročitaj telo — opciono ime primaoca preostalih POEN-a
  let primalacPseudonim: string | undefined;
  try {
    const body = await req.json();
    primalacPseudonim = body?.prenesPoen?.trim() || undefined;
  } catch {
    // body nije obavezan
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      zrnoStanje: true,
    },
  });

  if (!user) return await greska("Korisnik nije pronađen.", 404);
  if (user.status === UserStatus.EXCLUDED || user.deaktiviranAt) {
    return await greska("Nalog je već deaktiviran.", 409);
  }

  // --- 1. Otpis ZRNA bez POEN emisije (čl. 33 st. 1) ---
  // Aktivno → slobodno → otpis u Protokol; NE pokreće evidentiranje POEN-a.
  const aktivnaZrna = user.zrnoStanje?.aktivno ?? 0;
  const slobodnaZrna = user.zrnoStanje?.slobodno ?? 0;
  const ukupnoZrna = aktivnaZrna + slobodnaZrna;
  if (ukupnoZrna > 0) {
    await prisma.zrnoStanje.update({
      where: { userId },
      data: { aktivno: 0, slobodno: 0 },
    });
    // ZRNA se implicitno vraćaju u raspoloživa Protokola (zrnaUProtokolu = UKUPNO_ZRNA - kodKorisnika);
    // koeficijent se menja jer imenilac raste — što je u skladu sa čl. 25 (obračunski koeficijent).
  }

  // --- 2. Anonimizacija grafa verifikacija (čl. 33 st. 4) ---
  // 🔴 POTVRDE KOJE JE OBRISANI DAO SE NE DIRAJU (dokaz stvarnosti čl. 30, set 4.7.5;
  // odluka vlasnika 18.10.2026: „potvrđen jednom — ako onaj ko te potvrdio izbriše
  // račun, to tebe ne dotiče"). Veza ostaje važeća i u grafu; njegov pseudonim se
  // pseudonimizuje u koraku 5 kao i svuda. Onaj koga je potvrdio zadržava indeks,
  // status i POEN, a nadzornik svojih 500. Do 4.7.5 su te veze ovde brisane, POEN
  // skidan, a ko nije imao drugu potvrdu vraćan je u NEVERIFIKOVAN — jedan izlazak
  // obarao je sve koje je čovek uveo. Ne vraćati to.
  //
  // Brišu se samo veze u kojima je obrisani bio POTVRĐENI, i POEN emitovan povodom
  // njih vraća se Protokolu: verifikatoru POEN_VERIFIKATOR, nadzorniku POEN_NADZORNIK.
  // Veze gde je obrisani bio nadzornik (a ne strana) ostaju, uz nadzornikId = null.
  // Zero-sum invarijanta očuvana.
  const vezeKaoVerifikovani = await prisma.verifikacionaVeza.findMany({
    where: { verifikovaniId: userId },
  });

  // 🔴 Od seta 4.6.4 POEN po potvrdi čeka trag stvarnog učešća (dokaz stvarnosti
  // čl. 19), pa veza u stanju ZABELEZEN nije ništa ni emitovala. Povraćaj se zato
  // radi SAMO za veze u stanju EVIDENTIRAN — inače bi protivzapis oduzimao POEN
  // koji ne postoji i pokvario zero-sum.
  const jeUpisan = (v: { poenStatus: PotvrdaPoenStatus }) =>
    v.poenStatus === PotvrdaPoenStatus.EVIDENTIRAN;
  // Nadzornikovih 500 imaju svoje stanje — od seta 4.6.5 i ona čekaju isti uslov, ali
  // nastaju u svom trenutku (upis ishoda nadzora).
  const nadzorUpisan = (v: { nadzorPoenStatus: PotvrdaPoenStatus }) =>
    v.nadzorPoenStatus === PotvrdaPoenStatus.EVIDENTIRAN;

  // Helper: skida POEN od jednog korisnika i vraća Protokolu, capped na balance
  // (Pravilnik čl. 17 st. 2: nijedan korisnik ne može imati negativan zapis POEN-a).
  async function vratiPoenProtokolu(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    targetUserId: string,
    iznos: number,
    opis: string
  ) {
    if (iznos <= 0) return;
    const w = await tx.wallet.findUnique({ where: { userId: targetUserId } });
    if (!w) return;
    const stvarno = Math.min(w.balance, iznos);
    if (stvarno <= 0) return;
    await tx.wallet.update({
      where: { id: w.id },
      data: { balance: { decrement: stvarno } },
    });
    await tx.wallet.update({
      where: { id: PROTOKOL_WALLET_ID },
      data: { balance: { increment: stvarno } },
    });
    await tx.transaction.create({
      data: {
        fromWalletId: w.id,
        toWalletId: PROTOKOL_WALLET_ID,
        amount: stvarno,
        type: TransactionType.PONISTENJE_ZAPISA,
        description: opis,
      },
    });
  }

  if (vezeKaoVerifikovani.length > 0) {
    await prisma.$transaction(
      async (tx) => {
        // 2b) Veze gde je obrisani VERIFIKOVANI
        for (const v of vezeKaoVerifikovani) {
          if (jeUpisan(v)) {
            // POEN_VERIFIKATOR se vraća Protokolu
            await vratiPoenProtokolu(
              tx,
              v.verifikatorId,
              POEN_VERIFIKATOR,
              `Poništavanje verifikacije zbog brisanja verifikovanog (čl. 33)`
            );
          }
          // POEN_NADZORNIK se proverava ZASEBNO — svoje stanje, svoj trenutak.
          if (nadzorUpisan(v) && v.podlezeNadzoru && v.nadzornikId) {
            await vratiPoenProtokolu(
              tx,
              v.nadzornikId,
              POEN_NADZORNIK,
              `Poništavanje nadzora zbog brisanja verifikovanog (čl. 33)`
            );
          }
        }

        // 2c) Obriši veze gde je obrisani POTVRĐENI. Veze gde je on verifikator
        // ostaju (dokaz stvarnosti čl. 30).
        await tx.verifikacionaVeza.deleteMany({
          where: { verifikovaniId: userId },
        });
      },
      { timeout: 30_000 }
    );
  }

  // 2d) Veze gde je obrisani bio NADZORNIK (a ne strana) — postavi nadzornikId = null.
  // Van gornjeg bloka: važi i kad obrisani nije bio potvrđen ni od koga.
  await prisma.verifikacionaVeza.updateMany({
    where: { nadzornikId: userId },
    data: { nadzornikId: null },
  });

  // --- 3. Prenesi POEN balans ---
  const svezWallet = await prisma.wallet.findUnique({ where: { userId } });
  const balans = svezWallet?.balance ?? 0;

  // 🔴 Prenos POEN-a drugom korisniku pri gašenju naloga je PREPIS, pa prati
  // ISTO pravilo kao prepis (mera P-2 uz R-01) — nikad svoje (`smeDaSalje`). Da je ovde stroži
  // od `/api/transfer`, gašenje naloga bi bilo jedini put na kome zabrana još
  // važi, a to nije pravilo nego ostatak.
  // 🔴 Maloletni korisnik ne prenosi: brisanjem naloga deteta svi njegovi zapisi
  // POEN-a se poništavaju uz protivzapis Protokola (deca čl. 36 st. 2). Prepis deteta
  // inače ide samo kroz `smeDaPrepise` (Modul Deca), pa gašenje ne sme biti zaobilaznica.
  if (primalacPseudonim && user.maloletan) {
    return await greska(
      "Brisanjem naloga maloletnog korisnika svi zapisi POEN-a se poništavaju uz protivzapis Protokola; prenos drugom korisniku nije moguć.",
      403
    );
  }
  const smeDaPrenese = smeDaSalje(user.tipKorisnika);
  if (primalacPseudonim && !smeDaPrenese) {
    return await greska(
      "Prenos POEN-a pri gašenju naloga je prepis i ide po istom pravilu kao prepis (Uslovi čl. 14 st. 3). Tvoj zapis se poništava uz protivzapis Protokola.",
      403
    );
  }

  // Negativan zapis (nadoknada, čl. 36 Pravilnika o dokazu stvarnosti) se NAMERNO
  // ne dira: po čl. 33 st. 2 Pravilnika o KOLO sistemu ne poništava se prestankom
  // statusa i ne prelazi na Protokol. Kad bi se poništio, istupanje iz sistema bi
  // brisalo nadoknadu, a teret bi pao na sve ostale korisnike.
  if (balans > 0) {
    if (primalacPseudonim && smeDaPrenese) {
      // Prenesi zadatom korisniku
      const primalac = await prisma.user.findFirst({
        where: gdePseudonim(primalacPseudonim),
        include: { wallet: true },
      });

      if (!primalac || !primalac.wallet) {
        return await greska("Primalac POENA nije pronađen.", 400);
      }

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({ where: { userId }, data: { balance: 0 } });
        await tx.wallet.update({ where: { id: primalac.wallet!.id }, data: { balance: { increment: balans } } });
        await tx.transaction.create({
          data: {
            fromWalletId: svezWallet!.id,
            toWalletId: primalac.wallet!.id,
            amount: balans,
            type: TransactionType.TRANSFER,
            description: `Prenos pri deaktivaciji naloga`,
          },
        });
      });
    } else {
      // Poništavanje zapisa POEN-a (čl. 33 st. 2): protivzapis Protokola umanjen,
      // zero-sum invarijanta očuvana.
      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({ where: { userId }, data: { balance: 0 } });
        await tx.wallet.update({ where: { id: PROTOKOL_WALLET_ID }, data: { balance: { increment: balans } } });
        await tx.transaction.create({
          data: {
            fromWalletId: svezWallet!.id,
            toWalletId: PROTOKOL_WALLET_ID,
            amount: balans,
            type: TransactionType.PONISTENJE_ZAPISA,
            description: `Poništavanje POENA pri prestanku statusa (čl. 33 Pravilnika o KOLO sistemu)`,
          },
        });
      });
    }
  }

  // --- 4. Zadruga, gazdinstvo, vaučeri, zaposleni davaoca, upis pokrovitelja ---
  // Zajedničko za sve izlaze iz sistema (isključenje, gašenje, nepostojeći nalog):
  // zadrugu gasi `ugasiOznakeNaloga` u koraku 5 (ime zadrugara se briše, Politika
  // čl. 42, Registar br. 19), a istupanje iz gazdinstva (Registar br. 20), oslobađanje
  // vaučera (nabavke čl. 33), opoziv zaposlenih (donacije čl. 32 st. 3) i brisanje
  // upisa pokrovitelja (donacije čl. 18 st. 4) idu kroz `poslediceIzlaskaNaloga`
  // posle koraka 5, VAN transakcije.

  // --- 4b. Oglasi: uklanjanje sa Pijace + brisanje sadržaja i fotografija ---
  // 🔴 Politika čl. 42 st. 2 (ranije čl. 11) od prve verzije obećava da se brišu „podaci u
  // objavljenim oglasima, uključujući fotografije i broj telefona" — a do seta
  // 4.5.1 ovaj tok oglase NIJE ni dodirivao. Ostajali su `ACTIVE` i javni i
  // gostu, sa opisom u kome ljudi po pravilu ostave telefon, sa mestom i sa
  // fotografijama na R2. Pseudonim `obrisani-korisnik-…` tu ne pomaže: takav
  // sadržaj identifikuje sam.
  const oglasi = await prisma.marketplaceListing.findMany({
    where: { sellerId: userId },
    select: { id: true, images: true },
  });
  if (oglasi.length > 0) {
    await prisma.marketplaceListing.updateMany({
      where: { sellerId: userId },
      data: {
        status: "UKLONJEN",
        title: "",
        description: "",
        location: null,
        images: [],
        uklonjenAt: new Date(),
        uklonjenRazlog: "Nalog je ugašen (čl. 33 Pravilnika, čl. 42 Politike privatnosti).",
      },
    });
    // Fotografije sa R2 — best-effort, ne sme da obori brisanje naloga.
    for (const o of oglasi) {
      for (const slika of o.images) await obrisiSaR2(slika);
    }
  }

  // --- 4c. Slobodan tekst uz prepise POEN-a ---
  // Odluka vlasnika (2026-09-10): opis prepisa ostaje vidljiv svima, ali se
  // BRIŠE kad se nalog ugasi. Meri se uzak krug: samo prepisi između DVA
  // korisnička zapisa u kojima je ugašeni nalog jedna strana. Opisi u kojima je
  // Protokol jedna strana su sistemski (osnov emisije, protivzapisi po čl. 33) —
  // oni nose proverljivost evidencije i ostaju.
  const mojWalletId = user.wallet?.id ?? null;
  if (mojWalletId) {
    // 🔴 `NOT: { fromWalletId: null }` je obavezan: Prisma u `not` filter
    // UKLJUČUJE NULL, a emisije Protokola upravo tako izgledaju (`fromWalletId`
    // je null). Bez ovoga bi se brisali i opisi emisija — osnov po kome je POEN
    // upisan, koji je odlukom uz R-13 namerno javan.
    await prisma.transaction.updateMany({
      where: {
        type: TransactionType.TRANSFER,
        description: { not: null },
        NOT: { fromWalletId: null },
        AND: [
          { fromWalletId: { not: PROTOKOL_WALLET_ID } },
          { toWalletId: { not: PROTOKOL_WALLET_ID } },
          { OR: [{ fromWalletId: mojWalletId }, { toWalletId: mojWalletId }] },
        ],
      },
      data: { description: null },
    });
  }

  // --- 5. Anonimizuj i deaktiviraj u jednoj transakciji ---
  const izlaz = await prisma.$transaction(async (tx) => {
    // Obriši aktivne autentifikacione i verifikacione tokene
    await tx.verifikacijaToken.deleteMany({ where: { korisnikId: userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId } });

    // Obriši dnevnik aktivnosti (poseta stranica) — lični podatak, ne čuva se
    // posle prestanka statusa (za razliku od numeričke istorije transakcija).
    await tx.aktivnostLog.deleteMany({ where: { userId } });

    // Obriši napuštene pseudonime — i oni su trag o nalogu (čl. 33, pseudonimizacija).
    // Posledica: ranija imena ovog naloga postaju slobodna za druge, što je ovde
    // ispravno — nalog više ne postoji, pa nema šta da se zaštiti od preuzimanja.
    await tx.pseudonimIstorija.deleteMany({ where: { userId } });

    // Preporuke (dokaz stvarnosti čl. 20 st. 5), spisak za poziv i broj telefona (dokaz stvarnosti
    // čl. 9 st. 2, 12 st. 3), evidencija identiteta (čl. 31) i ime uz javnu donaciju (donacije
    // čl. 12) gasi `ugasiOznakeNaloga` niže, posle upisa `deaktiviranAt`.
    // Zapis o tome koji je član Kola otvorio ime i broj OVOG naloga čuva se dok
    // postoji nalog pozvanog (dokaz stvarnosti čl. 10 st. 4; radnja br. 24) — briše se sada.
    // Zapisi u kojima je ovaj nalog OTVORIO tuđe podatke pripadaju pozvanima i ostaju.
    await tx.zapisOtvaranjaPoziva.deleteMany({ where: { pozvaniId: userId } });

    // Plan, opis i dokaz operativnog doprinosa, slobodan tekst prigovora i prijava,
    // prijave grešaka, prijave lažnog roditeljstva (🔴 one koje je podneo čuvaju se
    // bez opisa dok postoji nalog deteta — Politika čl. 38 st. 4) i opis zapisa koji
    // nosi podatak o ličnosti (Pravilnik čl. 55 st. 2) briše `ugasiOznakeNaloga` niže
    // (`obrisiSadrzajPriPrestanku`), za sva tri izlaza; fotografije sa R2 briše
    // `poslediceIzlaskaNaloga`.

    // Izvod iz RPG koji je otpremio, odnosno izvod gazdinstva u prijavi kojom
    // upravlja, a o kojoj još nije odlučeno (Pravilnik o gazdinstvima čl. 3 st. 3–4).
    await tx.izvodRpg.deleteMany({
      where: {
        OR: [
          { otpremioId: userId },
          {
            gazdinstvo: {
              upravljaId: userId,
              status: { in: [GazdinstvoStatus.NACRT, GazdinstvoStatus.NA_PREGLEDU, GazdinstvoStatus.VRACENO] },
            },
          },
        ],
      },
    });

    // Anonimizuj lične podatke User entiteta
    await tx.user.update({
      where: { id: userId },
      data: {
        email: null,
        passwordHash: null,
        ...poljaPseudonima(`obrisani-korisnik-${userId.slice(0, 8)}`),
        telefon: null,
        location: null,
        avatar: null,
        oauthProvider: null,
        oauthId: null,
        // Token za odjavu sa mejlova više nema svrhu (email je obrisan) — brišemo
        // ga da ne ostane trajan identifikator vezan za nalog.
        emailOdjavaToken: null,
        // Škola maloletnog korisnika je podatak o detetu i briše se sa ostalima
        // (Pravilnik čl. 33; deca čl. 26 st. 4). Usput ga i vadi iz brojanja na ranglisti — nalog koji je
        // prestao da postoji ne sme da diže broj svoje škole.
        skolaSifra: null,
        skolaPromenjenaAt: null,
        status: UserStatus.EXCLUDED,
        deaktiviranAt: new Date(),
      },
    });

    // Anonimizuj UserPodaci (dobrovoljno uneti podaci — čl. 33 st. 4)
    await tx.userPodaci.updateMany({
      where: { userId },
      data: { punoIme: null, opis: null },
    });

    // Prestanak statusa (čl. 32, 33): keš statusa, spisak za poziv, preporuke,
    // evidencija identiteta (čl. 31), ime uz javnu donaciju (donacije čl. 12;
    // `uplatilac` se ne dira), zadruga, ZRNO zahtevi i delegiranje, programi, push
    // pretplate… — JEDNA funkcija za sva tri izlaza (`izlaz-naloga.ts`).
    // 🔴 Veze koje je nalog DAO ostaju (dokaz stvarnosti čl. 30).
    return ugasiOznakeNaloga(tx, userId);
  });

  // Posledice izlaska — VAN transakcije, ne bacaju (pravilo 8).
  await poslediceIzlaskaNaloga(userId, izlaz);

  // Fotografije dokaza operativnog doprinosa sa R2 (Politika čl. 30 st. 5) briše
  // `poslediceIzlaskaNaloga` (best-effort).

  // Obriši avatar sa R2 (ako je tamo) — sprečava orphan fajlove. Legacy
  // base64/Blob avatari se preskaču unutar obrisiSaR2. Ne sme da obori brisanje.
  await obrisiSaR2(user.avatar);

  return NextResponse.json({ ok: true });
}
