/**
 * Gornje Kolo — postupak predloga, podrške i glasanja i registar odluka
 * (Pravilnik o Gornjem Kolu čl. 7, 9–13, 19; Pravilnik čl. 43–44).
 *
 * Obračunski period = ponoć do ponoći PO SRPSKOM VREMENU (Pravilnik čl. 26;
 * `obracunski-dan.ts`), nikad po zoni servera (UTC). Postupak predloga učesnika:
 *   period N   — podnošenje; predlog je od tada dostupan korisnicima (čl. 9 st. 3);
 *   period N+1 — podrška čuvara Kola u sastavu Gornjeg Kola (čl. 10 st. 1);
 *   period N+2 — glasanje, samo o podržanom predlogu (čl. 11 st. 1).
 * Nepodržan predlog se na kraju perioda podrške zatvara i upisuje u registar kao
 * predlog o kome se nije glasalo (čl. 10 st. 4). Predlagač ne određuje rok.
 * Ishod: prosta većina datih glasova; izjednačeno = neusvojeno (čl. 7 st. 2).
 *
 * Izborno glasanje koje pokreće Fondacija po pravilniku o nabavkama nema fazu
 * podrške (`podrskaPocetak` je null) i glasa se u narednom periodu.
 *
 * 🔴 U Fazi 1 Gornje Kolo ne postoji (Pravilnik čl. 41–42; Gornje Kolo čl. 3):
 * podnošenje, podrška i glas se odbijaju na ruti dok faza nije `FAZA_2`.
 */
import { prisma } from "@/lib/prisma";
import { IZBOR_STATUSA, statusUcesnika } from "./status";
import { smeUGornjeKolo } from "@/lib/gornje-kolo-pravila";
import { pocetakPeriodaPosle } from "./obracunski-dan";
import type { Prisma } from "@/generated/prisma/client";

export type FazaPredloga = "PODNET" | "PODRSKA" | "NAJAVLJEN" | "U_TOKU" | "ZATVOREN";

export class GlasanjeGreska extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Da li je učesnik danas u sastavu Gornjeg Kola: čuvar Kola sa najmanje jednim
 * aktivnim ZRNOM (Pravilnik čl. 43; Gornje Kolo čl. 4, 10, 12). Čita se iz baze,
 * ne iz sesije — status se proverava pri podršci, pri glasu i pri predlogu (da
 * li se predlog smatra podržanim podnošenjem).
 */
export async function jeUSastavuGornjegKola(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...IZBOR_STATUSA, zrnoStanje: { select: { aktivno: true } } },
  });
  if (!u) return false;
  return smeUGornjeKolo(statusUcesnika(u), u.zrnoStanje?.aktivno ?? 0);
}

/** Period zabrane ponovnog predlaganja iste sadržine (čl. 13). */
export const DANA_PONOVNO_PREDLAGANJE = 30;

/** Normalizacija naslova za poređenje „suštinski istovetne sadržine" (čl. 13). */
export function normalizujNaslov(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Da li je predlog iste (normalizovane) sadržine u poslednjih 30 dana zatvoren
 * kao NEUSVOJEN ili kao NEPODRŽAN — tada je ponovno predlaganje nedopušteno
 * (čl. 13). Rok teče od zatvaranja postupka: kraj glasanja (`deadline`), odnosno
 * kraj perioda podrške (`glasanjePocetak`) za predlog koji niko nije podržao.
 */
export async function postojiSkoroOdbijen(title: string, now: Date = new Date()): Promise<boolean> {
  const granica = new Date(now.getTime() - DANA_PONOVNO_PREDLAGANJE * 24 * 60 * 60 * 1000);
  const norm = normalizujNaslov(title);
  const odbijeni = await prisma.glasanjePredlog.findMany({
    where: {
      status: "CLOSED",
      vrsta: { not: "IZBOR_NABAVKE" },
      OR: [
        { ishodUsvojen: false, deadline: { gte: granica } },
        { neglasanjeRazlog: "NEPODRZAN", glasanjePocetak: { gte: granica } },
      ],
    },
    select: { title: true },
  });
  return odbijeni.some((o) => normalizujNaslov(o.title) === norm);
}

/**
 * Učesnik ima najviše jedan predlog o kome postupak još traje (čl. 9 st. 2):
 * podnet, u podršci ili na glasanju. Izborno glasanje Fondacije se ne broji.
 */
export async function imaPredlogUPostupku(userId: string): Promise<boolean> {
  const n = await prisma.glasanjePredlog.count({
    where: { authorId: userId, status: "ACTIVE", vrsta: { not: "IZBOR_NABAVKE" } },
  });
  return n > 0;
}

/**
 * Rokovi postupka za predlog podnet u trenutku `podnetAt` (čl. 10 st. 1, 11 st. 1):
 * podrška u narednom obračunskom periodu, glasanje u periodu posle podrške.
 */
export function rokoviPredloga(podnetAt: Date): { podrskaPocetak: Date; glasanjePocetak: Date; deadline: Date } {
  return {
    podrskaPocetak: pocetakPeriodaPosle(podnetAt, 1),
    glasanjePocetak: pocetakPeriodaPosle(podnetAt, 2),
    deadline: pocetakPeriodaPosle(podnetAt, 3),
  };
}

/**
 * Granice glasanja bez faze podrške (izborno glasanje koje pokreće Fondacija):
 * glasanje počinje u ponoć narednog obračunskog perioda po srpskom vremenu i
 * traje tačno jedan period.
 */
export function granicePeriodaGlasanja(od: Date): { glasanjePocetak: Date; deadline: Date } {
  return { glasanjePocetak: pocetakPeriodaPosle(od, 1), deadline: pocetakPeriodaPosle(od, 2) };
}

/** Ishod po prostoj većini datih glasova; izjednačeno = neusvojeno (čl. 7). */
export function utvrdiIshod(zaZbir: number, protivZbir: number): boolean {
  return zaZbir > protivZbir;
}

/**
 * Zbirovi glasačke moći datih glasova (čl. 7, 8, 19).
 *
 * 🔴 `za` je od izbornog glasanja OPCIONO: izborni glas nosi `izbor`, a `za` mu je
 * null. Grupe se zato biraju IZRIČITO (`=== true` / `=== false`) — sa negacijom polja `za` svaki
 * izborni glas bi tiho pao u „protiv". Pri izbornom glasanju „protiv" ne postoji,
 * pa se iskazuje samo ukupna data moć.
 */
export function zbiroviGlasova(
  glasovi: readonly { za: boolean | null; glasackaGlasova: number }[],
): { za: number; protiv: number; ukupno: number } {
  let za = 0, protiv = 0, ukupno = 0;
  for (const g of glasovi) {
    ukupno += g.glasackaGlasova;
    if (g.za === true) za += g.glasackaGlasova;
    else if (g.za === false) protiv += g.glasackaGlasova;
  }
  return { za, protiv, ukupno };
}

/**
 * Faza predloga u datom trenutku:
 *  - PODNET — period podnošenja (pre perioda podrške);
 *  - PODRSKA — period podrške;
 *  - NAJAVLJEN — glasanje bez faze podrške još nije počelo;
 *  - U_TOKU — glasanje traje (za predlog sa podrškom: samo ako je podržan);
 *  - ZATVOREN — zatvoren, istekao, ili niko ga nije podržao do kraja perioda podrške.
 */
export function fazaPredloga(
  p: {
    glasanjePocetak: Date;
    deadline: Date;
    status: string;
    podrskaPocetak?: Date | null;
    brPodrski?: number;
  },
  now: Date = new Date()
): FazaPredloga {
  if (p.status === "CLOSED") return "ZATVOREN";
  if (p.podrskaPocetak) {
    if (now < p.podrskaPocetak) return "PODNET";
    if (now < p.glasanjePocetak) return "PODRSKA";
    if ((p.brPodrski ?? 0) === 0) return "ZATVOREN"; // nepodržan (čl. 10 st. 4)
  }
  if (now < p.glasanjePocetak) return "NAJAVLJEN";
  if (now >= p.deadline) return "ZATVOREN"; // isteklo, biće zatvoreno u bazi
  return "U_TOKU";
}

// ── Prikaz predloga ─────────────────────────────────────────────────────────

/** Jedan izbor polja za svaki prikaz predloga (lista, detalj, ekran ZRNO). */
export const UKLJUCI_ZA_PRIKAZ = {
  author: { select: { pseudonim: true } },
  glasovi: { select: { userId: true, za: true, izbor: true, glasackaGlasova: true } },
  podrske: { select: { userId: true, podnosenjem: true, user: { select: { pseudonim: true } } }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.GlasanjePredlogInclude;

type PredlogZaPrikaz = Prisma.GlasanjePredlogGetPayload<{ include: typeof UKLJUCI_ZA_PRIKAZ }>;

/**
 * Predlog za prikaz jednom gledaocu. 🔴 Pseudonime predlagača i onih koji su
 * podržali dobija samo učesnik (`vidiPseudonime`, Gornje Kolo čl. 9 st. 3, 10 st. 5,
 * 19 st. 2); broj podrški i zbirovi glasačke moći dostupni su svakom korisniku.
 * Pojedinačan tuđi glas se ne vraća (čl. 19 st. 2) — samo sopstveni.
 */
export function prikazPredloga(p: PredlogZaPrikaz, gledalacId: string, vidiPseudonime: boolean, now: Date = new Date()) {
  const z = zbiroviGlasova(p.glasovi);
  const moj = p.glasovi.find((g) => g.userId === gledalacId);
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    vrsta: p.vrsta,
    izborno: p.vrsta === "IZBOR_NABAVKE",
    authorPseudonim: vidiPseudonime ? p.author.pseudonim : null,
    podrskaPocetak: p.podrskaPocetak ? p.podrskaPocetak.toISOString() : null,
    glasanjePocetak: p.glasanjePocetak.toISOString(),
    deadline: p.deadline.toISOString(),
    status: p.status as "ACTIVE" | "CLOSED",
    faza: fazaPredloga({ ...p, brPodrski: p.podrske.length }, now),
    ishodUsvojen: p.ishodUsvojen,
    neglasanjeRazlog: p.neglasanjeRazlog,
    zaGlasova: z.za,
    protiGlasova: z.protiv,
    ukupnoGlasova: z.ukupno,
    brGlasova: p.glasovi.length,
    brPodrski: p.podrske.length,
    podrzavaoci: vidiPseudonime ? p.podrske.map((x) => x.user.pseudonim) : [],
    mojaPodrska: p.podrske.some((x) => x.userId === gledalacId),
    mojGlas: moj ? moj.za : null,
    mojIzbor: moj ? moj.izbor : null,
    createdAt: p.createdAt.toISOString(),
  };
}

export type PrikazPredloga = ReturnType<typeof prikazPredloga>;

/** Svi predlozi za prikaz (najnoviji prvi), posle zatvaranja isteklih. */
export async function dohvatiPredlogeZaPrikaz(gledalacId: string, vidiPseudonime: boolean, now: Date = new Date()) {
  await zatvoriIstekleIObjaviIshod(now);
  const predlozi = await prisma.glasanjePredlog.findMany({
    orderBy: { createdAt: "desc" },
    include: UKLJUCI_ZA_PRIKAZ,
  });
  return predlozi.map((p) => prikazPredloga(p, gledalacId, vidiPseudonime, now));
}

// ── Podrška ─────────────────────────────────────────────────────────────────

/**
 * Čuvar Kola u sastavu Gornjeg Kola podržava predlog tokom perioda podrške
 * (čl. 10 st. 1–2). Podrška nije glas, ne nosi glasačku moć i ne delegira se —
 * zato se gleda samo lični sastav, ne delegiranje. Faza sistema se proverava na ruti.
 */
export async function podrziPredlog(predlogId: string, userId: string, now: Date = new Date()): Promise<{ brPodrski: number }> {
  const p = await prisma.glasanjePredlog.findUnique({
    where: { id: predlogId },
    select: { status: true, podrskaPocetak: true, glasanjePocetak: true },
  });
  if (!p) throw new GlasanjeGreska("Predlog nije pronađen.", 404);
  if (p.status !== "ACTIVE" || !p.podrskaPocetak || now < p.podrskaPocetak || now >= p.glasanjePocetak)
    throw new GlasanjeGreska("Predlog se podržava samo tokom perioda podrške (čl. 10 Pravilnika o Gornjem Kolu).");
  if (!(await jeUSastavuGornjegKola(userId)))
    throw new GlasanjeGreska("Predlog podržava čuvar Kola sa aktiviranim ZRNOM.", 403);

  return prisma.$transaction(async (tx) => {
    const postoji = await tx.glasanjePodrska.findUnique({
      where: { predlogId_userId: { predlogId, userId } },
      select: { id: true },
    });
    if (postoji) throw new GlasanjeGreska("Već si podržao ovaj predlog.", 409);
    await tx.glasanjePodrska.create({ data: { predlogId, userId } });
    return { brPodrski: await tx.glasanjePodrska.count({ where: { predlogId } }) };
  });
}

// ── Registar ────────────────────────────────────────────────────────────────

/**
 * Registar odluka (čl. 19) — nepromenljiv pregled svih zatvorenih predloga:
 * o kojima se glasalo (ishod, zbirovi, broj podrški) i o kojima se nije glasalo
 * (naslov, predlagač, razlog). Zatvoreni zapisi se ne menjaju retroaktivno
 * (status CLOSED se postavlja jednom u `zatvoriIstekleIObjaviIshod` i ne dira se).
 *
 * 🔴 Pseudonime predlagača i onih koji su podržali dobija samo učesnik (čl. 19 st. 2).
 */
export async function dohvatiRegistarOdluka(vidiPseudonime: boolean) {
  await zatvoriIstekleIObjaviIshod();
  const odluke = await prisma.glasanjePredlog.findMany({
    where: { status: "CLOSED" },
    orderBy: { deadline: "desc" },
    include: {
      author: { select: { pseudonim: true } },
      podrske: { select: { user: { select: { pseudonim: true } } }, orderBy: { createdAt: "asc" } },
      _count: { select: { glasovi: true, podrske: true } },
      // Samo težine datih glasova, bez glasača i bez smera glasa — za broj čuvara
      // čija moć čini većinu (Pravilnik o Gornjem Kolu čl. 19 st. 1).
      glasovi: { select: { glasackaGlasova: true } },
    },
  });
  return odluke.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    authorPseudonim: vidiPseudonime ? o.author.pseudonim : null,
    // Zatvaranje postupka: kraj glasanja, odnosno kraj perioda podrške ako se nije glasalo.
    rok: (o.neglasanjeRazlog ? o.glasanjePocetak : o.deadline).toISOString(),
    glasanjePocetak: o.glasanjePocetak.toISOString(),
    deadline: o.deadline.toISOString(),
    nijeSeGlasalo: o.neglasanjeRazlog != null,
    neglasanjeRazlog: o.neglasanjeRazlog,
    brPodrski: o._count.podrske,
    imaFazuPodrske: o.podrskaPocetak != null,
    podrzavaoci: vidiPseudonime ? o.podrske.map((x) => x.user.pseudonim) : [],
    ishodUsvojen: o.ishodUsvojen,
    zaZbir: o.zaZbir ?? 0,
    protivZbir: o.protivZbir ?? 0,
    vrsta: o.vrsta,
    izborno: o.vrsta === "IZBOR_NABAVKE",
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
 * Zatvara predloge kojima je istekao rok:
 *  1) predlog koji do kraja perioda podrške niko nije podržao — bez glasanja,
 *     uz razlog NEPODRZAN (čl. 10 st. 4);
 *  2) predlog kome je isteklo glasanje — uz ishod po prostoj većini (čl. 7).
 * Idempotentno (`updateMany` uz `status: "ACTIVE"`) — bezbedno pri svakom čitanju
 * i iz cron-a istovremeno.
 */
export async function zatvoriIstekleIObjaviIshod(now: Date = new Date()): Promise<void> {
  await prisma.glasanjePredlog.updateMany({
    where: {
      status: "ACTIVE",
      podrskaPocetak: { not: null },
      glasanjePocetak: { lte: now },
      podrske: { none: {} },
    },
    data: { status: "CLOSED", neglasanjeRazlog: "NEPODRZAN" },
  });

  const istekli = await prisma.glasanjePredlog.findMany({
    where: { status: "ACTIVE", deadline: { lte: now } },
    include: { glasovi: { select: { za: true, glasackaGlasova: true, userId: true } } },
  });

  // Set 4.8.2 (Gornje Kolo čl. 12 st. 2): glas nosi glasačku moć obračunskog perioda
  // u kome je dat — `GlasanjeGlas.glasackaGlasova`. Zatvaranje već dati glas NE
  // dira: ni otključavanje ZRNA posle ponoći ni kasnija promena statusa ne menjaju
  // moć koju je glas nosio (ranije ograničenje „M2" na trenutno aktivno ZRNO je
  // uklonjeno; uz to je pogrešno sekao i delegiranu moć).
  const trenutnaMoc = (g: { glasackaGlasova: number }) => g.glasackaGlasova;

  for (const p of istekli) {
    const izborno = p.vrsta === "IZBOR_NABAVKE";
    const z = zbiroviGlasova(p.glasovi.map((g) => ({ za: g.za, glasackaGlasova: trenutnaMoc(g) })));
    // Pri izbornom glasanju nema „protiv": zbir je ukupna data moć, a koja je
    // mogućnost pobedila utvrđuje `utvrdiIzborNabavke` iz samih glasova.
    const zaZbir = izborno ? z.ukupno : z.za;
    const protivZbir = izborno ? 0 : z.protiv;
    const usvojen = utvrdiIshod(zaZbir, protivZbir); // izjednačeno = neusvojeno (čl. 7 st. 2)
    await prisma.glasanjePredlog.updateMany({
      where: { id: p.id, status: "ACTIVE" },
      data: {
        status: "CLOSED",
        zaZbir,
        protivZbir,
        ishodUsvojen: usvojen,
        // Usvojena ODLUKA je obavezujuća → izvršenje Fondacije (čl. 17).
        // Usvojena DINARSKA_PREPORUKA nije obavezujuća → čeka obrazložen odgovor UO (čl. 18).
        // IZBOR_NABAVKE je po predmetu dinarsko pitanje (čl. 47 Pravilnika), pa i on
        // ostaje van izvršenja — vrsta se izvodi iz predmeta, ne iz izbora predlagača.
        izvrsenjeStatus: usvojen && p.vrsta === "ODLUKA" ? "ZA_IZVRSENJE" : null,
      },
    });
  }
}

/**
 * Fondacija (UO) beleži da je usvojena odluka sprovedena SVOJIM AKTOM (čl. 46
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
    throw new GlasanjeGreska("Navedi akt Upravnog odbora kojim je odluka sprovedena (čl. 46 Pravilnika).");
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
 * UO odbija da sprovede odluku Gornjeg Kola (čl. 46 Pravilnika).
 *
 * 🔴 Razlozi su ZATVORENA LISTA i tip ih sprovodi — celishodnost odluke UO ne ceni.
 * 🔴 Zaštitni veto je uklonjen (odluka vlasnika 25.10.2026): razloga ima tri i
 * četvrti se ne dodaje. Stari zapisi `VETO_OBUSTAVLJENO` ostaju kao istorija.
 */
export async function neSprovediOdluku(
  id: string,
  razlog: "ZAKON" | "STATUT" | "VAN_NADLEZNOSTI",
  obrazlozenje: string
): Promise<void> {
  if (razlog !== "ZAKON" && razlog !== "STATUT" && razlog !== "VAN_NADLEZNOSTI")
    throw new GlasanjeGreska("Razlog mora biti sa liste iz čl. 46 st. 3 Pravilnika.");
  const o = (obrazlozenje ?? "").trim();
  if (o.length < 10)
    throw new GlasanjeGreska("Odbijanje mora biti obrazloženo pozivanjem na konkretan razlog (čl. 46 st. 4 Pravilnika).");
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
 * UO daje obrazložen odgovor na usvojenu dinarsku preporuku (čl. 18).
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
    throw new GlasanjeGreska("Odgovor UO mora biti obrazložen (čl. 18).");
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
