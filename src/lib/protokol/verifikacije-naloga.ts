/**
 * Vađenje jednog naloga iz lanca potvrda — sa svim posledicama po druge ljude.
 *
 * Padaju SVE veze koje nalog dodiruje, i primljene i obavljene, i sve potvrde člana
 * bez potvrde koje je taj nalog dao ili primio (deca čl. 4d st. 3). POEN evidentiran
 * povodom veza vraća se Protokolu (nikad ispod nule — čl. 14 st. 3), a status druge
 * strane se preračunava iz grafa (`preracunajStatusNaloga`, set 4.8.2). Isti
 * postupak kao pri prestanku statusa (čl. 34).
 *
 * 🔴 Ovo NIJE utvrđenje lažne potvrde. Tamo se ceni po čoveku i vodi postupak iz
 * Glave VIII dokaza stvarnosti (`lazna-verifikacija.ts`); ovde se nalog samo
 * uklanja iz grafa, bez ijednog utvrđenja o bilo čijem ponašanju. Zato ovu
 * funkciju zovu samo administrativne radnje nad celim nalogom — vraćanje naloga
 * na dan registracije i prevođenje naloga u maloletni.
 */
import { prisma } from "@/lib/prisma";
import { PotvrdaPoenStatus, TransactionType } from "@/generated/prisma/client";
import {
  POEN_NADZORNIK,
  POEN_VERIFIKATOR,
  POEN_VERIFIKOVANI,
} from "@/lib/protokol/dokaz-stvarnosti";
import {
  posledicePromeneStatusa,
  preracunajStatusNaloga,
  type StatusUcesnika,
} from "@/lib/protokol/status";

const PROTOKOL_WALLET_ID = "banka-singleton";

export type IshodObaranja = {
  /** Broj palih veza — i onih koje je nalog dao i onih koje je primio. */
  ponisteno: number;
  /** POEN skinut DRUGIM korisnicima (verifikovanima, verifikatorima, nadzornicima). */
  poenVracenOdDrugih: number;
  /** Ko je ovim otišao u negativan zapis — samo uz `dozvoliMinus`. Njima se javlja. */
  uMinusu: { userId: string; iznos: number }[];
};

export type OpcijeObaranja = {
  /**
   * Sme li tuđi zapis u minus.
   *
   * `false` (podrazumevano) — POEN se skida najviše do nule, kao pri prestanku
   * statusa. Tako radi vraćanje naloga na dan registracije: tamo je reč o probi
   * korisničkog puta i nema razloga da neko treći završi sa negativnim zapisom.
   *
   * `true` — skida se pun iznos i zapis ide u minus. Minus se ponaša isto kao
   * nadoknada (čl. 20b): nije dug, ne naplaćuje se, POEN-i koji pristignu prvo ga
   * popunjavaju, prepis drugome je moguć tek preko nule, razmena nije ograničena.
   * Bez toga bi onaj ko primljeni POEN brže potroši prošao jeftinije od onoga ko
   * ga sačuva — isto pravilo koje već važi za otpis prijateljstva i za poništen
   * prepis po prijavi razmene.
   */
  dozvoliMinus?: boolean;
  /** Opis koji ide u protivzapis (vidi se u istoriji pogođenog čoveka). */
  opis?: string;
  opisKljuc?: string;
  opisParametri?: Record<string, string | number>;
};

/**
 * Obori sve potvrde stvarnosti koje nalog dodiruje.
 *
 * Ne dira sam nalog — pozivalac posle ove radnje sam zove `preracunajStatusNaloga`
 * za njega (i odlučuje o slotovima), jer se to razlikuje od radnje do radnje.
 * Status DRUGIH pogođenih se preračunava ovde, a posledice idu van transakcije.
 */
export async function oboriVerifikacijeNaloga(
  userId: string,
  opcije: OpcijeObaranja = {},
): Promise<IshodObaranja> {
  const vezeKaoVerifikator = await prisma.verifikacionaVeza.findMany({
    where: { verifikatorId: userId },
  });
  const vezeKaoVerifikovani = await prisma.verifikacionaVeza.findMany({
    where: { verifikovaniId: userId },
  });
  // Potvrde člana bez potvrde koje je nalog dao ili primio (deca čl. 4d st. 3).
  const potvrdeClana = await prisma.potvrdaClana.findMany({
    where: { OR: [{ potvrdioId: userId }, { potvrdjeniId: userId }] },
    select: { id: true, potvrdjeniId: true },
  });
  const ponisteno = vezeKaoVerifikator.length + vezeKaoVerifikovani.length;
  let poenVracenOdDrugih = 0;
  const uMinusu: { userId: string; iznos: number }[] = [];
  const promene: { userId: string; pre: StatusUcesnika; posle: StatusUcesnika }[] = [];

  if (ponisteno === 0 && potvrdeClana.length === 0) {
    return { ponisteno, poenVracenOdDrugih, uMinusu };
  }

  await prisma.$transaction(
    async (tx) => {
      /**
       * Skida POEN sa tuđeg zapisa i vraća ga Protokolu.
       *
       * Bez `dozvoliMinus` staje na nuli; sa njim skida pun iznos i pušta zapis u
       * minus, uz protivzapis u istoriji — negativan zapis menja šta čovek sme sa
       * POEN-om i ne sme da se pojavi bez ijednog traga o tome odakle je došao.
       */
      // 🔴 Zove se ISKLJUČIVO za veze u stanju EVIDENTIRAN. Od seta 4.6.4 POEN po
      // potvrdi čeka trag stvarnog učešća (dokaz stvarnosti čl. 7), pa veza u stanju
      // ZABELEZEN nema šta da vrati — Protokol po njoj nije emitovao ništa.
      async function vratiPoenProtokolu(targetUserId: string, iznos: number) {
        if (iznos <= 0) return;
        const w = await tx.wallet.findUnique({ where: { userId: targetUserId } });
        if (!w) return;
        const stvarno = opcije.dozvoliMinus ? iznos : Math.min(w.balance, iznos);
        if (stvarno <= 0) return;
        await tx.wallet.update({ where: { id: w.id }, data: { balance: { decrement: stvarno } } });
        await tx.wallet.update({
          where: { id: PROTOKOL_WALLET_ID },
          data: { balance: { increment: stvarno } },
        });
        poenVracenOdDrugih += stvarno;
        if (opcije.dozvoliMinus) {
          await tx.transaction.create({
            data: {
              fromWalletId: w.id,
              toWalletId: PROTOKOL_WALLET_ID,
              amount: stvarno,
              type: TransactionType.OTPIS_PREVOD_U_MALOLETNI,
              description: opcije.opis ?? "Poništenje POENA iz pale potvrde",
              opisKljuc: opcije.opisKljuc,
              opisParametri: opcije.opisParametri,
            },
          });
          const posle = w.balance - stvarno;
          if (posle < 0) uMinusu.push({ userId: targetUserId, iznos: -posle });
        }
      }

      // 1) Veze u kojima je ovaj nalog VERIFIKATOR — pada verifikovani.
      for (const v of vezeKaoVerifikator) {
        if (v.poenStatus === PotvrdaPoenStatus.EVIDENTIRAN) {
          await vratiPoenProtokolu(v.verifikovaniId, POEN_VERIFIKOVANI);
        }
        // 🔴 Nadzornikovih 500 imaju SVOJE stanje: od seta 4.6.5 čekaju isti uslov,
        // ali nastaju u svom trenutku (upis ishoda), pa se proveravaju odvojeno.
        if (
          v.nadzorPoenStatus === PotvrdaPoenStatus.EVIDENTIRAN &&
          v.podlezeNadzoru && v.nadzornikId && v.nadzorIshod === "UREDNO"
        ) {
          await vratiPoenProtokolu(v.nadzornikId, POEN_NADZORNIK);
        }

        // Status verifikovanog se preračunava posle brisanja veza (korak 3).
      }

      // 2) Veze u kojima je ovaj nalog VERIFIKOVANI — pada verifikator.
      for (const v of vezeKaoVerifikovani) {
        // 🔴 Verifikator koji je ugasio nalog (dokaz stvarnosti čl. 16, set 4.7.5):
        // veza je ostala, ali je njegov zapis pri gašenju već poništen u celini (čl. 34),
        // pa ovih 1.000 tamo više ne postoji. Skidati ih ponovo značilo bi skinuti dvaput
        // — uz `dozvoliMinus` i u minus na zapisu koga više nema.
        const verifikatorUgasen = await tx.user.findUnique({
          where: { id: v.verifikatorId },
          select: { deaktiviranAt: true },
        });
        if (v.poenStatus === PotvrdaPoenStatus.EVIDENTIRAN && !verifikatorUgasen?.deaktiviranAt) {
          await vratiPoenProtokolu(v.verifikatorId, POEN_VERIFIKATOR);
        }
        // Nadzornikovih 500 — vidi napomenu u petlji iznad.
        if (
          v.nadzorPoenStatus === PotvrdaPoenStatus.EVIDENTIRAN &&
          v.podlezeNadzoru && v.nadzornikId && v.nadzorIshod === "UREDNO"
        ) {
          await vratiPoenProtokolu(v.nadzornikId, POEN_NADZORNIK);
        }
      }

      // 3) Obriši potvrde člana i veze (NadzorZapis i NadzorniPredmet padaju kaskadno).
      await tx.potvrdaClana.deleteMany({ where: { id: { in: potvrdeClana.map((p) => p.id) } } });
      await tx.verifikacionaVeza.deleteMany({
        where: { OR: [{ verifikatorId: userId }, { verifikovaniId: userId }] },
      });
      // 4) Tuđe veze i potvrde koje je ovaj nalog nadzirao ostaju — samo bez nadzornika.
      await tx.verifikacionaVeza.updateMany({
        where: { nadzornikId: userId },
        data: { nadzornikId: null },
      });
      await tx.potvrdaClana.updateMany({
        where: { nadzornikId: userId },
        data: { nadzornikId: null },
      });
      // 5) Status drugih pogođenih — iz grafa (jedan pisac keša). Sam nalog ne.
      const pogodjeni = new Set<string>([
        ...vezeKaoVerifikator.map((v) => v.verifikovaniId),
        ...potvrdeClana.map((p) => p.potvrdjeniId),
      ]);
      pogodjeni.delete(userId);
      for (const id of pogodjeni) {
        const promena = await preracunajStatusNaloga(tx, id);
        promene.push({ userId: id, ...promena });
      }
    },
    { timeout: 30_000 },
  );

  for (const p of promene) {
    try {
      await posledicePromeneStatusa(p.userId, p.pre, p.posle);
    } catch (e) {
      console.error("[verifikacije-naloga] posledice promene statusa", p.userId, e);
    }
  }

  return { ponisteno, poenVracenOdDrugih, uMinusu };
}
