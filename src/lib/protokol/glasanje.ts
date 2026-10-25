/**
 * Glasanje Gornjeg Kola — obračunski period i utvrđivanje ishoda
 * (Pravilnik o Gornjem Kolu 3.7.6, čl. 8, 9, 11, 13).
 *
 * Obračunski period = ponoć do ponoći (lokalno, konvencija sistema). Predlog
 * otvoren u periodu N stavlja se na glasanje u narednom periodu N+1 i zatvara se
 * na kraju tog perioda. Predlagač ne određuje rok (čl. 11). Ishod se utvrđuje
 * prostom većinom datih glasova; izjednačeno = neusvojeno (čl. 9).
 */
import { prisma } from "@/lib/prisma";
import { IZBOR_STATUSA, statusUcesnika } from "./status";
import { smeUGornjeKolo } from "@/lib/gornje-kolo-pravila";

export type FazaPredloga = "NAJAVLJEN" | "U_TOKU" | "ZATVOREN";

export class GlasanjeGreska extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Da li je učesnik danas u sastavu Gornjeg Kola: čuvar Kola sa najmanje jednim
 * aktivnim ZRNOM (Pravilnik čl. 45; Gornje Kolo čl. 4, 10). Čita se iz baze, ne iz
 * sesije — status se proverava i pri davanju glasa i pri predlogu.
 */
export async function jeUSastavuGornjegKola(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...IZBOR_STATUSA, zrnoStanje: { select: { aktivno: true } } },
  });
  if (!u) return false;
  return smeUGornjeKolo(statusUcesnika(u), u.zrnoStanje?.aktivno ?? 0);
}

/** Period zabrane ponovnog predlaganja iste sadržine (čl. 22). */
export const DANA_PONOVNO_PREDLAGANJE = 30;

/** Normalizacija naslova za poređenje „suštinski istovetne sadržine" (čl. 22). */
export function normalizujNaslov(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Da li postoji neusvojen predlog iste (normalizovane) sadržine zatvoren u
 * poslednjih 30 dana — tada je ponovno predlaganje nedopušteno (čl. 22).
 */
export async function postojiSkoroOdbijen(title: string, now: Date = new Date()): Promise<boolean> {
  const granica = new Date(now.getTime() - DANA_PONOVNO_PREDLAGANJE * 24 * 60 * 60 * 1000);
  const norm = normalizujNaslov(title);
  const odbijeni = await prisma.glasanjePredlog.findMany({
    where: { status: "CLOSED", ishodUsvojen: false, deadline: { gte: granica } },
    select: { title: true },
  });
  return odbijeni.some((o) => normalizujNaslov(o.title) === norm);
}

/**
 * Granice glasanja za predlog otvoren u trenutku `od`:
 * glasanje počinje u ponoć narednog obračunskog perioda i traje tačno jedan period.
 */
export function granicePeriodaGlasanja(od: Date): { glasanjePocetak: Date; deadline: Date } {
  const pocetak = new Date(od);
  pocetak.setHours(0, 0, 0, 0);
  pocetak.setDate(pocetak.getDate() + 1); // ponoć narednog obračunskog perioda (N+1)
  const deadline = new Date(pocetak);
  deadline.setDate(deadline.getDate() + 1); // kraj tog perioda (N+2 ponoć)
  return { glasanjePocetak: pocetak, deadline };
}

/** Ishod po prostoj većini datih glasova; izjednačeno = neusvojeno (čl. 8, 9). */
export function utvrdiIshod(zaZbir: number, protivZbir: number): boolean {
  return zaZbir > protivZbir;
}

/** Faza predloga u datom trenutku (NAJAVLJEN pre početka, U_TOKU tokom perioda, inače ZATVOREN). */
export function fazaPredloga(
  p: { glasanjePocetak: Date; deadline: Date; status: string },
  now: Date = new Date()
): FazaPredloga {
  if (p.status === "CLOSED") return "ZATVOREN";
  if (now < p.glasanjePocetak) return "NAJAVLJEN";
  if (now >= p.deadline) return "ZATVOREN"; // isteklo, biće zatvoreno u bazi
  return "U_TOKU";
}

/**
 * Registar odluka (čl. 21) — nepromenljiv pregled svih zatvorenih predloga sa
 * ishodom i zbirovima glasačke moći. Zatvoreni zapisi se ne menjaju retroaktivno
 * (status CLOSED se postavlja jednom u `zatvoriIstekleIObjaviIshod` i ne dira se).
 */
export async function dohvatiRegistarOdluka() {
  await zatvoriIstekleIObjaviIshod();
  const odluke = await prisma.glasanjePredlog.findMany({
    where: { status: "CLOSED" },
    orderBy: { deadline: "desc" },
    include: {
      author: { select: { pseudonim: true } },
      _count: { select: { glasovi: true } },
      // Samo težine datih glasova, bez glasača i bez smera glasa — za broj čuvara
      // čija moć čini većinu (Pravilnik o Gornjem Kolu nacrt čl. 20 st. 1).
      glasovi: { select: { glasackaGlasova: true } },
    },
  });
  return odluke.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    authorPseudonim: o.author.pseudonim,
    rok: o.deadline.toISOString(),
    ishodUsvojen: o.ishodUsvojen,
    zaZbir: o.zaZbir ?? 0,
    protivZbir: o.protivZbir ?? 0,
    vrsta: o.vrsta,
    izvrsenjeStatus: o.izvrsenjeStatus,
    vetoObrazlozenje: o.vetoObrazlozenje,
    izvrsenjeAkt: o.izvrsenjeAkt,
    odbijanjeRazlog: o.odbijanjeRazlog,
    odbijanjeObrazlozenje: o.odbijanjeObrazlozenje,
    uoOdgovor: o.uoOdgovor,
    uoObrazlozenje: o.uoObrazlozenje,
    brGlasova: o._count.glasovi,
    tezineGlasova: o.glasovi.map((g) => g.glasackaGlasova),
  }));
}

/**
 * Zatvara sve predloge kojima je istekao rok i beleži ishod (prosta većina).
 * Idempotentno — bezbedno za pozivanje pri svakom čitanju.
 */
export async function zatvoriIstekleIObjaviIshod(now: Date = new Date()): Promise<void> {
  const istekli = await prisma.glasanjePredlog.findMany({
    where: { status: "ACTIVE", deadline: { lte: now } },
    include: { glasovi: { select: { za: true, glasackaGlasova: true, userId: true } } },
  });

  // Set 4.8.2 (Gornje Kolo čl. 6 st. 2): glas nosi glasačku moć obračunskog perioda
  // u kome je dat — `GlasanjeGlas.glasackaGlasova`. Zatvaranje već dati glas NE
  // dira: ni otključavanje ZRNA posle ponoći ni kasnija promena statusa ne menjaju
  // moć koju je glas nosio (ranije ograničenje „M2" na trenutno aktivno ZRNO je
  // uklonjeno; uz to je pogrešno sekao i delegiranu moć).
  const trenutnaMoc = (g: { glasackaGlasova: number }) => g.glasackaGlasova;

  for (const p of istekli) {
    // 🔴 `za` je od izbornog glasanja OPCIONO: izborni glas nosi `izbor`, a `za` mu je
    // null. Zato se buckets biraju IZRIČITO (`=== true` / `=== false`) — sa ranijim
    // `filter((g) => !g.za)` svaki izborni glas bi tiho pao u „protiv" i oborio ishod
    // glasanja u kome protiv uopšte ne postoji.
    const izborno = p.vrsta === "IZBOR_NABAVKE";
    const zaZbir = izborno
      ? // Pri izbornom glasanju nema „protiv": zbir je ukupna data moć, a koja je
        // mogućnost pobedila utvrđuje `utvrdiIzborNabavke` iz samih glasova.
        p.glasovi.reduce((s, g) => s + trenutnaMoc(g), 0)
      : p.glasovi.filter((g) => g.za === true).reduce((s, g) => s + trenutnaMoc(g), 0);
    const protivZbir = izborno
      ? 0
      : p.glasovi.filter((g) => g.za === false).reduce((s, g) => s + trenutnaMoc(g), 0);
    const usvojen = utvrdiIshod(zaZbir, protivZbir); // izjednačeno = neusvojeno (čl. 9)
    await prisma.glasanjePredlog.update({
      where: { id: p.id },
      data: {
        status: "CLOSED",
        zaZbir,
        protivZbir,
        ishodUsvojen: usvojen,
        // Usvojena ODLUKA je obavezujuća → izvršenje Fondacije (čl. 17).
        // Usvojena DINARSKA_PREPORUKA nije obavezujuća → čeka obrazložen odgovor UO (čl. 20).
        // IZBOR_NABAVKE je po predmetu dinarsko pitanje (čl. 51a Pravilnika), pa i on
        // ostaje van izvršenja — vrsta se izvodi iz predmeta, ne iz izbora predlagača.
        izvrsenjeStatus: usvojen && p.vrsta === "ODLUKA" ? "ZA_IZVRSENJE" : null,
      },
    });
  }
}

/**
 * Fondacija (UO) beleži da je usvojena odluka sprovedena SVOJIM AKTOM (čl. 51
 * Pravilnika, čl. 17 Gornjeg Kola).
 *
 * 🔴 Oznaka akta je OBAVEZNA. Gornje Kolo nije organ Fondacije — Statut poznaje
 * samo Upravni odbor i Direktora — pa odluku Gornjeg Kola sprovodi UO donošenjem
 * sopstvenog akta. Bez zapisa o tom aktu registar pokazuje samo da je „izvršeno",
 * a ne i da je nadležni organ išta doneo; upravo taj trag je ono što konstrukciju
 * drži u granicama Statuta.
 */
export async function izvrsiOdluku(id: string, akt: string): Promise<void> {
  const a = (akt ?? "").trim();
  if (a.length < 3)
    throw new GlasanjeGreska("Navedi akt Upravnog odbora kojim je odluka sprovedena (čl. 51).");
  const p = await prisma.glasanjePredlog.findUnique({ where: { id }, select: { izvrsenjeStatus: true } });
  if (!p) throw new GlasanjeGreska("Predlog nije pronađen.", 404);
  if (p.izvrsenjeStatus !== "ZA_IZVRSENJE")
    throw new GlasanjeGreska("Izvršenje je moguće samo za usvojenu odluku koja čeka izvršenje.");
  await prisma.glasanjePredlog.update({
    where: { id },
    data: { izvrsenjeStatus: "IZVRSENO", izvrsenjeAkt: a, izvrsenoAt: new Date() },
  });
}

/**
 * UO odbija da sprovede odluku Gornjeg Kola (čl. 51 Pravilnika).
 *
 * 🔴 Razlozi su ZATVORENA LISTA i tip ih sprovodi — celishodnost odluke UO ne ceni.
 * Zaštitni veto NIJE ovde: on ima sopstvenu radnju (`vetoNaIzvrsenje`), jer je
 * privremen i gasi se trajno po čl. 49, dok su ova tri razloga trajna.
 */
export async function neSprovediOdluku(
  id: string,
  razlog: "ZAKON" | "STATUT" | "VAN_NADLEZNOSTI",
  obrazlozenje: string
): Promise<void> {
  if (razlog !== "ZAKON" && razlog !== "STATUT" && razlog !== "VAN_NADLEZNOSTI")
    throw new GlasanjeGreska("Razlog mora biti sa liste iz čl. 51.");
  const o = (obrazlozenje ?? "").trim();
  if (o.length < 10)
    throw new GlasanjeGreska("Odbijanje mora biti obrazloženo pozivanjem na konkretan razlog (čl. 51).");
  const p = await prisma.glasanjePredlog.findUnique({ where: { id }, select: { izvrsenjeStatus: true } });
  if (!p) throw new GlasanjeGreska("Predlog nije pronađen.", 404);
  if (p.izvrsenjeStatus !== "ZA_IZVRSENJE")
    throw new GlasanjeGreska("Odbijanje je moguće samo za odluku koja čeka sprovođenje.");
  await prisma.glasanjePredlog.update({
    where: { id },
    data: {
      izvrsenjeStatus: "NIJE_SPROVEDENO",
      odbijanjeRazlog: razlog,
      odbijanjeObrazlozenje: o,
      odbijanjeAt: new Date(),
    },
  });
}

/**
 * UO daje obrazložen odgovor na usvojenu dinarsku preporuku (čl. 20).
 * Preporuka nije obavezujuća — UO je prihvata ili odbija, uvek uz obrazloženje.
 */
export async function odgovoriNaPreporuku(
  id: string,
  odgovor: "PRIHVACENO" | "ODBIJENO",
  obrazlozenje: string
): Promise<void> {
  const o = (obrazlozenje ?? "").trim();
  if (odgovor !== "PRIHVACENO" && odgovor !== "ODBIJENO")
    throw new GlasanjeGreska("Neispravan odgovor.");
  if (o.length < 10)
    throw new GlasanjeGreska("Odgovor UO mora biti obrazložen (čl. 20).");
  const p = await prisma.glasanjePredlog.findUnique({
    where: { id },
    select: { vrsta: true, status: true, ishodUsvojen: true, uoOdgovor: true },
  });
  if (!p) throw new GlasanjeGreska("Predlog nije pronađen.", 404);
  if (p.vrsta !== "DINARSKA_PREPORUKA" || p.status !== "CLOSED" || p.ishodUsvojen !== true)
    throw new GlasanjeGreska("Odgovor je moguć samo na usvojenu dinarsku preporuku.");
  if (p.uoOdgovor) throw new GlasanjeGreska("UO je već odgovorio na ovu preporuku.");
  await prisma.glasanjePredlog.update({
    where: { id },
    data: { uoOdgovor: odgovor, uoObrazlozenje: o, uoOdgovorAt: new Date() },
  });
}

/**
 * Fondacija (UO) obustavlja izvršenje odluke zaštitnim vetom (čl. 18).
 * Veto mora biti obrazložen — bez obrazloženja predstavlja zloupotrebu.
 */
export async function vetoNaIzvrsenje(id: string, obrazlozenje: string): Promise<void> {
  const o = (obrazlozenje ?? "").trim();
  if (o.length < 10)
    throw new GlasanjeGreska("Zaštitni veto mora imati obrazloženje koje upućuje na konkretnu pretnju održivosti (čl. 18).");
  const p = await prisma.glasanjePredlog.findUnique({ where: { id }, select: { izvrsenjeStatus: true } });
  if (!p) throw new GlasanjeGreska("Predlog nije pronađen.", 404);
  if (p.izvrsenjeStatus !== "ZA_IZVRSENJE")
    throw new GlasanjeGreska("Veto je moguć samo na odluku koja čeka izvršenje.");
  await prisma.glasanjePredlog.update({
    where: { id },
    data: { izvrsenjeStatus: "VETO_OBUSTAVLJENO", vetoObrazlozenje: o, vetoAt: new Date() },
  });
}
