/**
 * Pričaonica — koja soba je čija i ko šta u njoj vidi (Modul Deca, čl. 12, 18).
 *
 * ─── Zašto ovo stoji na jednom mestu ────────────────────────────────────────
 *
 * Soba se IZVODI iz uzrasta onoga ko je prijavljen, ne bira se parametrom: dete
 * uvek dobija dečju sobu, punoletni sobu odraslih, pa ne postoji adresa kojom bi
 * odrasli ušao među decu ni obrnuto. To pravilo je od uvođenja dečje sobe
 * (14.08.2026) stajalo ispravno u `GET /api/chat` — a Početna je istu Pričaonicu
 * čitala SOPSTVENIM upitom, sa `where: { uklonjenoAt: null }` i bez ijedne reči o
 * sobi. Posledica: prvih sto poruka koje odrastao član vidi pri otvaranju ekrana
 * bile su MEŠANE, sa dečjim među njima; tek osvežavanje (koje ide kroz rutu) ih je
 * prestajalo donositi. Isti kvar koji je već zapisan kod oglasa deteta — pravilo
 * je bilo tačno, ali ga nije sprovodio svaki prikaz.
 *
 * Zato ovde stoji JEDAN ulaz koji vraća gotov uslov nad `ChatMessage`, pa ni
 * sledeći prikaz Pričaonice nema šta da izvodi sam.
 *
 * ─── Dvostruka brava nad sobom odraslih ─────────────────────────────────────
 *
 * Uslov traži i `soba: ODRASLI` i da AUTOR danas nije maloletan. Kolona `soba` se
 * upisuje u trenutku pisanja i sama po sebi ne pokriva dva zatečena slučaja:
 * poruke starije od kolone (migracija ih je sve ostavila u sobi odraslih, kako i
 * piše u njenom komentaru) i nalog koji je Fondacija naknadno prevela u maloletni
 * (čl. 4d) — tu je reč o detetu koje je promašilo dečji ulaz, pa su mu reči ostale
 * među odraslima iako tu nikad nisu smele da budu. Uslov nad autorom ih sklanja
 * bez brisanja ijednog reda.
 *
 * 🔴 Suprotan smer NE traži ništa: kad dete napuni 18, `punoletstvo.ts` briše
 * prijateljstva, pa njegove dečje poruke ostaju bez ijednog gledaoca sem njega.
 */
import { ChatSoba, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { idPrijatelja, smeUSobu } from "@/lib/protokol/prijateljstva";

/** Soba prijavljenog korisnika. Izvodi se iz uzrasta, ne bira se. */
export async function sobaKorisnika(userId: string): Promise<ChatSoba> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { maloletan: true },
  });
  return u?.maloletan ? ChatSoba.DECA : ChatSoba.ODRASLI;
}

/**
 * Uslov nad porukama koje korisnik sme da vidi u svojoj sobi.
 *
 * Vraća `null` kad korisnik sobu ne vidi uopšte — nalog deteta koje još čeka
 * roditelja (čl. 4c). Nije prazan uslov nego izostanak upita: ekran deteta na
 * tom mestu objašnjava šta mu Pričaonicu otvara.
 *
 * `bezSvojih` služi badge-u uz Početnu: brojati i sopstvene poruke dalo bi broj
 * koji se ne može spustiti.
 *
 * ─── Dečja soba: svako vidi samo poruke SVOJIH PRIJATELJA (čl. 18 st. 3) ────
 *
 * Jedna soba za svu decu, ali filtrirana grafom prijateljstava. Posledica koja se
 * dobija besplatno: kad su svi učesnici međusobno prijatelji, sam od sebe nastaje
 * grupni razgovor — graf pravi sobe umesto nas.
 *
 * 🟡 Poznata i PRIHVAĆENA posledica: kad Milica napiše poruku, vide je svi njeni
 * prijatelji; Ana odgovori, i taj odgovor vidi Petar, koji je Milicin prijatelj a
 * Anu ne poznaje — pa mu Anina poruka stoji bez povoda. To nije greška.
 *
 * 🔴 Zato u dečjoj sobi NEMA odgovora sa citatom. Citat bi Petru pokazao Milicin
 * tekst i zaobišao ovaj filter. Ne dodavati citiranje.
 */
export async function usloviSobe(
  userId: string,
  soba: ChatSoba,
  opcije: { bezSvojih?: boolean } = {},
): Promise<Prisma.ChatMessageWhereInput | null> {
  // Uklonjene poruke (Uslovi čl. 25 st. 2) nestaju iz sobe za sve — i za autora.
  if (soba === ChatSoba.DECA) {
    if (!(await smeUSobu(userId))) return null;
    // `idPrijatelja` vraća i sam nalog, pa se svoje poruke vide i pre prvog
    // prijatelja — inače se posle slanja na ekranu ne desi ništa.
    const autori = (await idPrijatelja(userId)).filter(
      (id) => !opcije.bezSvojih || id !== userId,
    );
    if (autori.length === 0) return null;
    return { uklonjenoAt: null, soba: ChatSoba.DECA, userId: { in: autori } };
  }

  return usloviSobeOdraslih(userId, opcije);
}

/**
 * Soba odraslih — izdvojena jer taj uslov NIKAD nije prazan, pa pozivaocu ne
 * treba provera na `null` ni asertacija nad tipom.
 */
export function usloviSobeOdraslih(
  userId: string,
  opcije: { bezSvojih?: boolean } = {},
): Prisma.ChatMessageWhereInput {
  return {
    uklonjenoAt: null,
    soba: ChatSoba.ODRASLI,
    user: { maloletan: false },
    ...(opcije.bezSvojih ? { userId: { not: userId } } : {}),
  };
}
