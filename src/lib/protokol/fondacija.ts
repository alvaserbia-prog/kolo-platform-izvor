/**
 * Fondacija — transparentnost sredstava.
 *
 * Sredstva Fondacije = priliv (donacije + pokroviteljstvo, oba u RSD) - odliv
 * (operativni troskovi + projektni odliv)
 *
 * 🔴 Zastitni veto je uklonjen (odluka vlasnika 25.10.2026): bio je dupla brana uz
 * operativnu rezervu nabavke, a gasio se jednom zauvek. Tabela `SistemskiVeto` i
 * vrednost `VETO_OBUSTAVLJENO` ostaju kao istorija; radnja veta se ne vraca.
 *
 * Inicijalne vrednosti = 0 (po dogovoru sa vlasnikom 2026-05-24).
 */

import { prisma } from "@/lib/prisma";


export interface FondacijaSaldo {
  ukupanPriliv: number;        // RSD
  donacije: number;            // RSD (potvrdjene)
  pokroviteljstvo: number;     // RSD
  ukupanOdliv: number;         // RSD (operativni troskovi + projekti)
  operativniOdliv: number;     // RSD (samo FondacijaTrosak)
  projektniOdliv: number;      // RSD (samo ProjekatTrosak — kolektivne nabavke)
  saldo: number;               // RSD (priliv - odliv)
}

export async function dohvatiSaldoFondacije(): Promise<FondacijaSaldo> {
  const [donacijeAgg, pokroviteljstvoAgg, troskoviAgg, projektiAgg] = await Promise.all([
    prisma.donationRecord.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { amountRSD: true },
    }),
    prisma.pokroviteljDoprinos.aggregate({
      _sum: { rsdIznos: true },
    }),
    prisma.fondacijaTrosak.aggregate({
      _sum: { iznosRSD: true },
    }),
    prisma.projekatTrosak.aggregate({
      _sum: { iznosRSD: true },
    }),
  ]);

  const donacije = Number(donacijeAgg._sum.amountRSD ?? 0);
  const pokroviteljstvo = Number(pokroviteljstvoAgg._sum.rsdIznos ?? 0);
  const operativniOdliv = Number(troskoviAgg._sum.iznosRSD ?? 0);
  const projektniOdliv = Number(projektiAgg._sum.iznosRSD ?? 0);
  const ukupanOdliv = operativniOdliv + projektniOdliv;
  const ukupanPriliv = donacije + pokroviteljstvo;

  return {
    ukupanPriliv,
    donacije,
    pokroviteljstvo,
    ukupanOdliv,
    operativniOdliv,
    projektniOdliv,
    saldo: ukupanPriliv - ukupanOdliv,
  };
}

export interface GodisnjiProjektniPregled {
  godina: number;
  utrosenoRSD: number;   // zbir ProjekatTrosak za tekucu kalendarsku godinu
  brojNabavki: number;   // broj sprovedenih (zavrsenih) nabavki u toj godini
}

/**
 * Zbirni pregled projekata za tekucu kalendarsku godinu (Pravilnik o projektima
 * i kolektivnim nabavkama cl. 31).
 *
 * 🔴 Ovo je EVIDENCIJA OBIMA, ne ogranicenje. Ucestalost nabavki nije ogranicena
 * (odluka vlasnika 2026-09-07) — ali dok se godisnji zbir nigde ne vidi, obimu se
 * prilazi naslepo, ukljucujuci i poreske pragove koji se mere na ono sto Fondacija
 * daje. Broji SAMO `ProjekatTrosak`, nikad `FondacijaTrosak` (prag za gasenje veta
 * meri iskljucivo operativu).
 */
export async function dohvatiGodisnjiProjektniPregled(
  sada = new Date()
): Promise<GodisnjiProjektniPregled> {
  const godina = sada.getFullYear();
  const od = new Date(godina, 0, 1);
  const doDatuma = new Date(godina + 1, 0, 1);

  const [trosakAgg, brojNabavki] = await Promise.all([
    prisma.projekatTrosak.aggregate({
      // Meri se po `datum` (dan troska, indeksiran), ne po `createdAt` —
      // trosak se ume evidentirati i naknadno, a godina je godina troska.
      where: { datum: { gte: od, lt: doDatuma } },
      _sum: { iznosRSD: true },
    }),
    prisma.nabavka.count({
      where: { status: "ZAVRSENA", zavrsenoAt: { gte: od, lt: doDatuma } },
    }),
  ]);

  return {
    godina,
    utrosenoRSD: Number(trosakAgg._sum.iznosRSD ?? 0),
    brojNabavki,
  };
}

/**
 * Operativni trosak Fondacije za prethodni KALENDARSKI mesec — reper za
 * operativnu rezervu kolektivne nabavke (nabavke cl. 5).
 * Vraca 0 dok ne postoji nijedan zapis za prethodni mesec.
 *
 * 🔴 Broji SAMO `FondacijaTrosak` — nikad `ProjekatTrosak`. Rezerva je
 * `trosak × 3`, pa bi nabavka od 200.000 RSD upisana kao operativa podigla rezervu za
 * 600.000 RSD; sledeca nabavka bi bila najteza bas u mesecima kada Fondacija najvise
 * radi. Rezerva mora da meri operativu, ne aktivnost.
 * Zato kolektivne nabavke imaju sopstveni model (vidi `ProjekatTrosak` u semi).
 */
export async function dohvatiTrosakPrethodnogMeseca(): Promise<number> {
  const danas = new Date();
  const pocetakOvogMeseca = new Date(danas.getFullYear(), danas.getMonth(), 1);
  const pocetakPrethodnog = new Date(danas.getFullYear(), danas.getMonth() - 1, 1);

  const troskovi = await prisma.fondacijaTrosak.aggregate({
    where: { datum: { gte: pocetakPrethodnog, lt: pocetakOvogMeseca } },
    _sum: { iznosRSD: true },
  });

  return Number(troskovi._sum.iznosRSD ?? 0);
}
