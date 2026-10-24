/**
 * Izlaz naloga iz sistema — prestanak statusa učesnika (Pravilnik čl. 33, 34;
 * Uslovi čl. 26, 28, 29; dokaz stvarnosti čl. 16, 18, 20).
 *
 * Tri izlaza menjaju status naloga i SVA TRI zovu ovaj modul:
 *  - isključenje (`iskljucenje.ts` → `iskljuciKorisnika`, Uslovi čl. 28; zove ga i
 *    poništenje gazdinstva zbog lažne izjave i prijava lažnog roditeljstva);
 *  - gašenje naloga (`DELETE /api/profil`, istupanje, Uslovi čl. 26);
 *  - utvrđenje da iza naloga ne stoji stvarna osoba (`lazna-verifikacija.ts` →
 *    `ponistiNepostojeciNalog`, dokaz stvarnosti čl. 18, 20).
 *
 * 🔴 Uzrok koji se ovim zatvara: izlazi su menjali `status` naloga, a keš statusa i
 * druge žive oznake ostajali su — ugašen nalog „obrisani-korisnik-…" je i dalje nosio
 * `verified`, indeks 10, `potvrdjenAt` i REGULARNI. Svaki nov izlaz ide kroz
 * `ugasiOznakeNaloga` (u ISTOJ transakciji sa promenom statusa) i
 * `poslediceIzlaskaNaloga` (VAN nje, pravilo 8). Brana:
 * `__tests__/izlaz-naloga-izvor.test.ts`.
 *
 * 🔴 Šta se NE dira (CLAUDE.md pravila 1, 6): transakcije i zapisi POEN-a, veze u
 * grafu koje je nalog DAO (dokaz stvarnosti čl. 16), potvrde člana bez potvrde i
 * potvrde postojanja deteta koje je DAO, nadzorni zapisi i predmeti, zapis otvaranja
 * poziva (čuva se dok postoji nalog pozvanog, Uslovi čl. 16b st. 3). Negativan zapis
 * ovde ne nastaje — otpis pri istupanju iz gazdinstva ide kroz `prestanakGazdinstva`
 * (šesti osnov, Pravilnik čl. 14 st. 3).
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { preracunajStatusNaloga, posledicePromeneStatusa, prestaoStatus, type PromenaStatusa } from "./status";
import { obrisiIdentitet } from "./identitet";
import { obrisiPreporuke } from "./preporuka";
import { KLJUC_ZAHTEV_POTVRDA } from "./program-potvrda";

type Tx = Prisma.TransactionClient;

export type IzlazNaloga = {
  promena: PromenaStatusa;
  /** Čuvari Kola kojima je delegiranje prema ovom nalogu prestalo — dobijaju obaveštenje. */
  delegatori: string[];
  /** Prepisi deteta ka ovom nalogu koji su čekali roditelja i sada su zatvoreni. */
  prepisiDece: { deteId: string; iznos: number }[];
};

/**
 * Gasi sve žive oznake naloga kome je status upravo prestao. Zove se u ISTOJ
 * transakciji u kojoj je nalogu upisan `status = EXCLUDED`, odnosno `deaktiviranAt`
 * (baca ako nije — redosled je deo ugovora).
 *
 * Svaka oznaka i član akta po kome se gasi:
 *  1. keš statusa — `preracunajStatusNaloga` (Pravilnik čl. 33; nalog bez statusa,
 *     i osnivač); veze se ne brišu (dokaz stvarnosti čl. 16);
 *  2. administratorski nivo ADMIN → NONE (admin panel je alat operative, a nalog više
 *     ne učestvuje; superadmin se ne isključuje i ne dira se) i `slotoviPotroseni` → 0
 *     (ukinut brojač, ne sme da preživi kao trag);
 *  3. spisak za poziv — upis i broj telefona se brišu, a poziv koji je ovaj nalog
 *     držao otvoren se oslobađa (Uslovi čl. 16b st. 6, Politika 4.17);
 *  4. preporuke koje je dao i primio (Uslovi čl. 17a st. 5);
 *  5. evidencija identiteta (Pravilnik čl. 31a, 34 st. 5);
 *  6. ime uz javnu donaciju (donacije čl. 5a st. 4) — `uplatilac` i ugovor se ne diraju;
 *  7. predlog za nabavku (nabavke: „predlog se briše i prestankom statusa");
 *  8. zadruga — svojstvo zadrugara prestaje, ime i pristanak se brišu, pristupnice se
 *     odbijaju (Pravilnik o zadrugama čl. 9);
 *  9. ZRNO — zahtevi na čekanju (upis, otpis, promena stanja) se otkazuju, jer lice
 *     bez statusa ne upisuje ni ne otpisuje (Pravilnik čl. 34 st. 1: otpis pri
 *     prestanku ne evidentira POEN); delegiranje OD naloga prestaje, a delegiranje
 *     KA nalogu se gasi pa delegator glasa sam (Gornje Kolo čl. 14: delegat je čuvar);
 *     zatečeno aktivno ZRNO ide u otključavanje kroz `posledicePromeneStatusa`;
 * 10. socijalni programi — prijava na čekanju i aktivna prijava se obustavljaju, uneti
 *     podaci se brišu (programi čl. 4), nedovršene potvrde se zatvaraju; nedovršene
 *     potvrde koje se od OVOG naloga traže za tuđe prijave se brišu (programi čl. 4 st. 2);
 * 11. zahtevi za potvrdu postojanja deteta na čekanju (deca čl. 6) u kojima je nalog
 *     roditelj ili dete — date potvrde ostaju;
 * 12. prepisi deteta koji čekaju roditelja (deca čl. 14), u kojima je nalog dete ili
 *     primalac — zatvaraju se (`ISTEKAO`); ništa nije skinuto, pa se ništa ne vraća;
 * 13. push pretplate — nalog bez statusa ne prima obaveštenja na uređaj.
 */
export async function ugasiOznakeNaloga(tx: Tx, userId: string): Promise<IzlazNaloga> {
  const u = await tx.user.findUnique({
    where: { id: userId },
    select: { status: true, deaktiviranAt: true, admin: true },
  });
  if (!u) throw new Error(`ugasiOznakeNaloga: nalog ${userId} ne postoji`);
  if (!prestaoStatus(u)) {
    throw new Error(`ugasiOznakeNaloga: nalogu ${userId} status nije prestao — prvo se upisuje EXCLUDED ili deaktiviranAt`);
  }
  const sada = new Date();

  // 1. Keš statusa.
  const promena = await preracunajStatusNaloga(tx, userId);

  // 2. Administratorski nivo i ukinut brojač.
  await tx.user.update({
    where: { id: userId },
    // Zadružni admin (U2) gubi nivo i vezu sa zadrugom kao i ADMIN.
    data: {
      slotoviPotroseni: 0,
      ...(u.admin === "ADMIN" ? { admin: "NONE" } : {}),
      ...(u.admin === "ZADRUGA" ? { admin: "NONE", adminZadrugaId: null } : {}),
    },
  });

  // 3. Spisak za poziv.
  await tx.zahtevZaRazgovor.deleteMany({ where: { userId } });
  await tx.zahtevZaRazgovor.updateMany({
    where: { otvorioId: userId },
    data: { otvorioId: null, otvorenDo: null },
  });

  // 4–5. Preporuke i evidencija identiteta.
  await obrisiPreporuke(userId, tx);
  await obrisiIdentitet(userId, tx);

  // 6. Ime uz javnu donaciju.
  await tx.donationRecord.updateMany({
    where: { userId, donatorIme: { not: null } },
    data: { donatorIme: null, imePovucenoAt: sada },
  });

  // 7. Predlog za nabavku.
  await tx.predlogNabavke.deleteMany({ where: { userId } });

  // 8. Zadruga.
  await tx.krugClanstvo.updateMany({
    where: { userId, leftAt: null },
    data: { leftAt: sada, imePrezime: null, pristanakAt: null },
  });
  await tx.krugPristupnica.updateMany({
    where: { userId, status: "PENDING" },
    data: { status: "REJECTED" },
  });

  // 9. ZRNO — zahtevi i delegiranje.
  await tx.zrnoUpisZahtev.updateMany({ where: { userId, status: "PENDING" }, data: { status: "CANCELLED" } });
  await tx.zrnoOtpisZahtev.updateMany({ where: { userId, status: "PENDING" }, data: { status: "CANCELLED" } });
  await tx.zrnoStatusZahtev.updateMany({ where: { userId, status: "PENDING" }, data: { status: "CANCELLED" } });
  await tx.zrnoDelegacija.deleteMany({ where: { delegatorId: userId } });
  const kaNalogu = await tx.zrnoDelegacija.findMany({
    where: { OR: [{ delegatId: userId }, { zakazaniDelegatId: userId }] },
    select: { delegatorId: true, delegatId: true },
  });
  await tx.zrnoDelegacija.updateMany({ where: { delegatId: userId }, data: { delegatId: null } });
  await tx.zrnoDelegacija.updateMany({
    where: { zakazaniDelegatId: userId },
    data: { zakazaniDelegatId: null, imaZakazano: false },
  });
  // Red bez važećeg i bez zakazanog delegata nema više predmet.
  await tx.zrnoDelegacija.deleteMany({
    where: { delegatorId: { in: kaNalogu.map((d) => d.delegatorId) }, delegatId: null, imaZakazano: false },
  });
  const delegatori = kaNalogu.filter((d) => d.delegatId === userId).map((d) => d.delegatorId);

  // 10. Socijalni programi.
  const prijave = await tx.programEnrollment.findMany({
    where: { userId, status: { in: ["PENDING", "ACTIVE"] } },
    select: { id: true },
  });
  if (prijave.length > 0) {
    const ids = prijave.map((p) => p.id);
    await tx.programEnrollment.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "INACTIVE",
        rejectionReason: "Status učesnika je prestao.",
        metadata: Prisma.DbNull,
      },
    });
    // Isto što `zatvoriPostupakPotvrda`, u ovoj transakciji.
    await tx.programPotvrda.deleteMany({ where: { enrollmentId: { in: ids }, status: "CEKA" } });
    for (const id of ids) {
      await tx.notifikacija.deleteMany({
        where: { kljuc: KLJUC_ZAHTEV_POTVRDA, parametri: { path: ["enrollmentId"], equals: id } },
      });
    }
  }
  await tx.programPotvrda.deleteMany({ where: { verifikatorId: userId, status: "CEKA" } });
  await tx.notifikacija.deleteMany({ where: { userId, kljuc: KLJUC_ZAHTEV_POTVRDA } });

  // 11. Zahtevi za potvrdu postojanja deteta na čekanju.
  await tx.potvrdaPostojanjaDeteta.deleteMany({
    where: { OR: [{ roditeljId: userId }, { deteId: userId }], potvrdjenoAt: null },
  });

  // 12. Prepisi deteta koji čekaju roditelja.
  const prepisi = await tx.prepisOdobrenje.findMany({
    where: { status: "CEKA", OR: [{ deteId: userId }, { primalacId: userId }] },
    select: { id: true, deteId: true, iznos: true },
  });
  if (prepisi.length > 0) {
    await tx.prepisOdobrenje.updateMany({
      where: { id: { in: prepisi.map((p) => p.id) }, status: "CEKA" },
      data: { status: "ISTEKAO", odlucenoAt: sada },
    });
  }
  const prepisiDece = prepisi.filter((p) => p.deteId !== userId).map((p) => ({ deteId: p.deteId, iznos: p.iznos }));

  // 13. Push pretplate.
  await tx.pushPretplata.deleteMany({ where: { userId } });

  return { promena, delegatori, prepisiDece };
}

/**
 * Posledice izlaska — VAN transakcije, ne baca (pravilo 8; svaki korak zasebno):
 *
 *  - `posledicePromeneStatusa` za sam nalog, BEZ obaveštenja njemu o statusu: aktivno
 *    ZRNO ide u otključavanje (Pravilnik čl. 34 st. 1), deca roditelja prelaze u
 *    stanje bez živog roditelja (deca čl. 4c), prava u gazdinstvu se osvežavaju;
 *  - gazdinstvo: nalog istupa (član gazdinstva je samo učesnik, gazdinstva čl. 7 st. 1;
 *    pri lažnoj izjavi je gazdinstvo već prestalo, pa ovo ne nalazi ništa);
 *  - vaučeri: uzeti a neiskorišćeni se oslobađaju (nabavke čl. 30f), ovlašćenja
 *    zaposlenih kod davaoca prestaju (donacije čl. 13g st. 6), upis pokrovitelja bez
 *    neiskorišćenih vaučera se briše (donacije čl. 6a st. 6);
 *  - obaveštenja DRUGIMA: delegatorima čije je delegiranje prestalo i deci čiji je
 *    prepis ka ovom nalogu zatvoren.
 */
export async function poslediceIzlaskaNaloga(userId: string, izlaz: IzlazNaloga): Promise<void> {
  try {
    await posledicePromeneStatusa(userId, izlaz.promena.pre, izlaz.promena.posle, { obavestiUcesnika: false });
  } catch (e) {
    console.error("[izlaz] posledice promene statusa", userId, e);
  }

  // Pomoćne funkcije ispod same hvataju greške i ne bacaju.
  const { istupiPriGasenjuNaloga } = await import("./gazdinstvo");
  const { oslobodiPriGasenjuNaloga, opozoviZaposlenePriGasenjuNaloga } = await import("./pokroviteljstvo-dobrima");
  const { obrisiUpisePriGasenjuNaloga } = await import("./upis-pokrovitelja");
  await istupiPriGasenjuNaloga(userId);
  await oslobodiPriGasenjuNaloga(userId);
  await opozoviZaposlenePriGasenjuNaloga(userId);
  await obrisiUpisePriGasenjuNaloga(userId);

  if (izlaz.delegatori.length === 0 && izlaz.prepisiDece.length === 0) return;
  try {
    const { obavesti } = await import("@/lib/notifikacije");
    for (const d of izlaz.delegatori) {
      await obavesti(d, {
        tip: "ZRNO",
        kljuc: "notifikacije.delegiranje_prestalo",
        naslov: "Delegiranje je prestalo",
        tekst:
          "Čuvar Kola kome si delegirao glasačku moć više nema status učesnika, pa je delegiranje prestalo. Glasačka moć ti se vraća; možeš je delegirati drugom čuvaru Kola.",
        link: "/zrno",
        email: false,
      }).catch((e) => console.error("[izlaz] obaveštenje delegatoru", d, e));
    }
    if (izlaz.prepisiDece.length > 0) {
      const primalac = await prisma.user.findUnique({ where: { id: userId }, select: { pseudonim: true } });
      for (const p of izlaz.prepisiDece) {
        await obavesti(p.deteId, {
          tip: "prepis_odbijen",
          kljuc: "notifikacije.prepis_odbijen",
          parametri: { iznos: p.iznos, pseudonim: primalac?.pseudonim ?? "?" },
          naslov: "Prepis nije izvršen",
          tekst: `Prepis od ${p.iznos.toLocaleString("sr-RS")} POENA članu ${primalac?.pseudonim ?? "?"} nije izvršen.`,
          link: "/novcanik",
        }).catch((e) => console.error("[izlaz] obaveštenje detetu", p.deteId, e));
      }
    }
  } catch (e) {
    console.error("[izlaz] obaveštenja drugima nisu poslata", userId, e);
  }
}
