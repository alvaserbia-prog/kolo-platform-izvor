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
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";
import { pocetakObracunskogDana } from "@/lib/nabavka-pravila";
import { granicePrethodnogMeseca } from "./obracunski-dan";


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
  /** Nabavke cl. 37 st. 5 — ugovori o pokroviteljstvu dobrima i uslugama zakljuceni u godini. */
  brojUgovoraDobra: number;
  vrednostUgovoraDobraRSD: number;
  /** Nabavke cl. 37 st. 5 — vauceri iskorisceni u godini. */
  brojIskoriscenihVaucera: number;
}

/**
 * Zbirni pregled projekata za tekucu kalendarsku godinu (nabavke cl. 37 st. 5):
 * dinari utroseni na projekte, broj sprovedenih nabavki, broj i vrednost ugovora o
 * pokroviteljstvu dobrima i uslugama i broj iskoriscenih vaucera.
 *
 * 🔴 Ovo je EVIDENCIJA OBIMA, ne ogranicenje. Ucestalost nabavki nije ogranicena
 * (odluka vlasnika 2026-09-07) — ali dok se godisnji zbir nigde ne vidi, obimu se
 * prilazi naslepo, ukljucujuci i poreske pragove koji se mere na ono sto Fondacija
 * daje. Broji SAMO `ProjekatTrosak`, nikad `FondacijaTrosak` (operativna rezerva
 * meri iskljucivo operativu). Godina je kalendarska godina po srpskom vremenu.
 */
export async function dohvatiGodisnjiProjektniPregled(
  sada = new Date()
): Promise<GodisnjiProjektniPregled> {
  const godina = beogradskiDan(sada).getUTCFullYear();
  // `datum` je `date` kolona (UTC ponoc), ostalo su trenuci (ponoc po srpskom vremenu).
  const odDana = new Date(Date.UTC(godina, 0, 1));
  const doDana = new Date(Date.UTC(godina + 1, 0, 1));
  const od = pocetakObracunskogDana(new Date(Date.UTC(godina, 0, 1, 12)));
  const doDatuma = pocetakObracunskogDana(new Date(Date.UTC(godina + 1, 0, 1, 12)));

  const [trosakAgg, brojNabavki, ugovoriAgg, brojIskoriscenihVaucera] = await Promise.all([
    prisma.projekatTrosak.aggregate({
      // Meri se po `datum` (dan troska, indeksiran), ne po `createdAt` —
      // trosak se ume evidentirati i naknadno, a godina je godina troska.
      where: { datum: { gte: odDana, lt: doDana } },
      _sum: { iznosRSD: true },
    }),
    prisma.nabavka.count({
      where: { status: "ZAVRSENA", zavrsenoAt: { gte: od, lt: doDatuma } },
    }),
    prisma.ugovorDobra.aggregate({
      where: { potpisanoAt: { gte: od, lt: doDatuma } },
      _count: true,
      _sum: { vrednostRsd: true },
    }),
    prisma.vaucer.count({
      where: { iskoriscenAt: { gte: od, lt: doDatuma } },
    }),
  ]);

  return {
    godina,
    utrosenoRSD: Number(trosakAgg._sum.iznosRSD ?? 0),
    brojNabavki,
    brojUgovoraDobra: ugovoriAgg._count,
    vrednostUgovoraDobraRSD: Number(ugovoriAgg._sum.vrednostRsd ?? 0),
    brojIskoriscenihVaucera,
  };
}

/** Jedna ponuda u dinarskoj strani nabavke (nabavke cl. 14, 37 st. 2). */
export interface DinarskaPonuda {
  ponudjac: string;
  cenaPoJediniciRSD: number;
  izabrana: boolean;
}

/** Dinarska strana jedne nabavke — ide SAMO u izvestaj o sredstvima (nabavke cl. 37 st. 2). */
export interface DinarskaStranaNabavke {
  id: string;
  naziv: string;
  status: string;
  objavljenoAt: string | null;
  ponude: DinarskaPonuda[];
  dobavljac: string | null;
  jedinicaMere: string | null;
  nabavnaCenaRSD: number | null;
  brojJedinica: number | null;
  /** Nabavke cl. 16 st. 1: kolicina × nabavna cena. */
  ukupanTrosakRSD: number | null;
  /** Nabavke cl. 7 — gornja granica trosenja u trenutku objave, uz saldo i rezervu iz kojih je izvedena. */
  gornjaGranicaRSD: number | null;
  saldoRSD: number | null;
  rezervaRSD: number | null;
  placenoRSD: number | null;
}

/** Vrednost ugovora o pokroviteljstvu dobrima i uslugama (nabavke cl. 37 st. 2). */
export interface VrednostUgovoraDobra {
  davalac: string;
  potpisanoAt: string;
  vrednostRSD: number;
  raskinut: boolean;
}

/**
 * Dinarska strana nabavki i vrednost ugovora o dobrima za izvestaj o raspolaganju
 * sredstvima Fondacije (nabavke cl. 37 st. 2; Pravilnik cl. 7 st. 5).
 *
 * 🔴 Ovde NIKAD ne ide broj POEN-a (po delu, ukupno, po vauceru): dinarska strana se
 * objavljuje ODVOJENO od kalkulacije, jer broj POEN-a po delu nije cena dobra (cl. 17)
 * i ne sme se citati kao njen izraz (R-01). Iz dinarske strane se nista ne izostavlja:
 * sve ponude, i one koje nisu izabrane. Brana: `nabavka-dinarska-strana-izvor.test.ts`.
 */
export async function dohvatiDinarskuStranuProjekata(): Promise<{
  nabavke: DinarskaStranaNabavke[];
  ugovoriDobra: VrednostUgovoraDobra[];
}> {
  const [nabavke, ugovori] = await Promise.all([
    prisma.nabavka.findMany({
      where: { objavljenoAt: { not: null } },
      orderBy: { objavljenoAt: "desc" },
      take: 100,
      select: {
        id: true,
        status: true,
        objavljenoAt: true,
        dobavljac: true,
        jedinicaMere: true,
        nabavnaCena: true,
        brojJedinica: true,
        iznosNabavke: true,
        saldoSnimak: true,
        rezervaSnimak: true,
        placenoRSD: true,
        naziv: { select: { naziv: true } },
        ponude: {
          orderBy: { cenaPoJedinici: "asc" },
          select: { ponudjac: true, cenaPoJedinici: true, izabrana: true },
        },
      },
    }),
    prisma.ugovorDobra.findMany({
      where: { potpisanoAt: { not: null }, status: { in: ["POTPISAN", "RASKINUT"] } },
      orderBy: { potpisanoAt: "desc" },
      take: 200,
      select: { naziv: true, potpisanoAt: true, vrednostRsd: true, status: true },
    }),
  ]);

  const broj = (d: { toString(): string } | null) => (d == null ? null : Number(d));

  return {
    nabavke: nabavke.map((n) => {
      const nabavna = broj(n.nabavnaCena);
      return {
        id: n.id,
        naziv: n.naziv.naziv,
        status: n.status,
        objavljenoAt: n.objavljenoAt?.toISOString() ?? null,
        ponude: n.ponude.map((p) => ({
          ponudjac: p.ponudjac,
          cenaPoJediniciRSD: Number(p.cenaPoJedinici),
          izabrana: p.izabrana,
        })),
        dobavljac: n.dobavljac,
        jedinicaMere: n.jedinicaMere,
        nabavnaCenaRSD: nabavna,
        brojJedinica: n.brojJedinica,
        ukupanTrosakRSD:
          nabavna != null && n.brojJedinica != null ? Math.round(n.brojJedinica * nabavna * 100) / 100 : null,
        gornjaGranicaRSD: broj(n.iznosNabavke),
        saldoRSD: broj(n.saldoSnimak),
        rezervaRSD: broj(n.rezervaSnimak),
        placenoRSD: broj(n.placenoRSD),
      };
    }),
    ugovoriDobra: ugovori.map((u) => ({
      davalac: u.naziv,
      potpisanoAt: (u.potpisanoAt as Date).toISOString(),
      vrednostRSD: Number(u.vrednostRsd),
      raskinut: u.status === "RASKINUT",
    })),
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
  // Mesec po srpskom vremenu (Pravilnik čl. 26), ne po zoni servera (UTC): `datum`
  // je `date` kolona, pa se granice daju kao UTC ponoć kalendarskog dana.
  const { od: pocetakPrethodnog, doIskljucivo: pocetakOvogMeseca } = granicePrethodnogMeseca();

  const troskovi = await prisma.fondacijaTrosak.aggregate({
    where: { datum: { gte: pocetakPrethodnog, lt: pocetakOvogMeseca } },
    _sum: { iznosRSD: true },
  });

  return Number(troskovi._sum.iznosRSD ?? 0);
}
