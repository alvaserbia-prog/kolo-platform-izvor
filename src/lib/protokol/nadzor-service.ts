/**
 * Servis za nadzor (Pravilnik o dokazu stvarnosti čl. 22–27; set 4.8.2).
 *
 * Predmet nadzora je jedno od tri (čl. 22, 23 st. 4):
 *  - VERIFIKACIJA — potvrda ili uvođenje u Kolo (`VerifikacionaVeza`);
 *  - POTVRDA_CLANA — potvrda člana bez potvrde, uključujući automatsku potvrdu lanca
 *    (`PotvrdaClana`);
 *  - POTVRDA_POSTOJANJA — potvrda postojanja deteta (`PotvrdaPostojanjaDeteta`).
 *
 * Nadzornik je svaki čuvar Kola (čl. 23 st. 1; `mozeNadzor`). On evidentira ISHOD:
 * uredno / za proveru / sporno (čl. 24).
 *
 * Stvari koje se lako slučajno vrate:
 *  1. Nadzor ima glas — ishod se upisuje i uz sumnju (4.2.0).
 *  2. Nadzor se ne plaća (set 4.7.5): POEN nadzorniku ne nastaje ni za jednu vrstu.
 *  3. Ishod ne dira mogućnost verifikatora da potvrđuje; roka za nadzor nema.
 *  4. Ne nadzire onaj ko je u predmetu učestvovao (čl. 23 st. 3): verifikator i
 *     verifikovani; davalac potvrde, potvrđeni i onaj ko ga je uveo; potvrdilac,
 *     roditelj i dete.
 *  5. Verifikacije koje je obavio član bez potvrde idu PRVE u redu (čl. 25 st. 1).
 *
 * Pattern: DB promene u prisma.$transaction.
 */
import { prisma } from "@/lib/prisma";
import { PotvrdaPoenStatus } from "@/generated/prisma/client";
import { mozeNadzor } from "@/lib/dozvole";
import {
  signaliPotvrde,
  signaliPotvrdeClana,
  sortirajPoSignalima,
  type SignalNadzora,
} from "@/lib/nadzor-signali-pravila";
import { USLOV_RAZMENE } from "@/lib/razmena-brojac-pravila";
import { beogradskiDan } from "@/lib/protokol/obracunski-dan";
import {
  type Ishod,
  type Subjekt,
  type Razlog,
  jeSumnja,
  validirajIshod,
} from "@/lib/nadzor-pravila";

export {
  RAZLOZI,
  SUBJEKTI,
  ISHODI,
  jeSumnja,
  validirajIshod,
} from "@/lib/nadzor-pravila";
export type { Ishod, Subjekt, Razlog } from "@/lib/nadzor-pravila";

export class NadzorGreska extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "NadzorGreska";
  }
}

/** Vrsta predmeta nadzora (čl. 22, 23 st. 4). */
export type VrstaPredmeta = "VERIFIKACIJA" | "POTVRDA_CLANA" | "POTVRDA_POSTOJANJA";
export const VRSTE_PREDMETA: VrstaPredmeta[] = ["VERIFIKACIJA", "POTVRDA_CLANA", "POTVRDA_POSTOJANJA"];

export function jeVrstaPredmeta(v: unknown): v is VrstaPredmeta {
  return typeof v === "string" && (VRSTE_PREDMETA as string[]).includes(v);
}

type Osoba = { id: string; pseudonim: string };

/** Jedna stavka koja čeka nadzor — zajednički oblik za sve tri vrste. */
export type StavkaNadzora = {
  vrstaPredmeta: VrstaPredmeta;
  id: string;
  datum: Date;
  /** Verifikator / ko je potvrdio. `null` kod automatske potvrde lanca. */
  davalac: Osoba | null;
  /** Verifikovani / potvrđeni / roditelj (za potvrdu postojanja deteta). */
  primalac: Osoba;
  /** Samo VERIFIKACIJA. */
  vrstaVerifikacije: "POTVRDA" | "UVODJENJE" | null;
  /** VERIFIKACIJA: uvođenje sa spiska za poziv. */
  poPozivu: boolean;
  /** VERIFIKACIJA: verifikator je u trenutku verifikacije bio član bez potvrde. */
  verifikatorBezPotvrde: boolean;
  /** POTVRDA_CLANA: izvor i korak lanca. */
  izvor: "CLAN_KOLA" | "FONDACIJA" | "LANAC" | null;
  korak: number | null;
  /** POTVRDA_CLANA: potvrda uvodioca sa spiska povezanih (dokaz čl. 17 st. 3). */
  premaUvodiocu: boolean;
  /** POTVRDA_CLANA: ko je potvrđenog uveo u Kolo (za njega i dalje odgovara). */
  uveo: Osoba | null;
  ranijiZapisi: { id: string; ishod: string; razlog: string | null; createdAt: Date }[];
};

export type ObaviNadzorRezultat = {
  vrstaPredmeta: VrstaPredmeta;
  id: string;
  /** = `id` (zadržano zbog starih pozivalaca). */
  verifikacijaId: string;
  ishod: Ishod;
  verifikatorPseudonim: string;
  verifikovaniPseudonim: string;
  nadzornikId: string;
  nadzornikPseudonim: string;
  /** Da li je ovaj nadzornik prvi po ovom predmetu. */
  prviIshod: boolean;
  /** Da li je ovim ishodom otvoren ili ažuriran nadzorni predmet (čl. 27). */
  predmetOtvoren: boolean;
};

/** Neotkriveni ishod: zapis izlazi sa spiska tek kad neko evidentira „uredno". */
const OTVOREN_ISHOD = [
  { nadzorIshod: null },
  { nadzorIshod: { in: ["ZA_PROVERU" as const, "SPORNO" as const] } },
];

/** `kolona` ≠ nadzornik, uz null (Prisma `not` nad nullable kolonom izbacuje null). */
function nijeOn(nadzornikId: string) {
  return { OR: [{ potvrdioId: null }, { potvrdioId: { not: nadzornikId } }] };
}

const LANAC_PSEUDONIM = "lanac";

/**
 * Nadzornik evidentira ishod nadzora nad verifikacijom, potvrdom člana bez potvrde
 * ili potvrdom postojanja deteta.
 */
export async function obaviNadzor(input: {
  /** Podrazumevano VERIFIKACIJA (stari pozivaoci). */
  vrstaPredmeta?: VrstaPredmeta;
  id?: string;
  /** Stari naziv za `id` kod vrste VERIFIKACIJA. */
  verifikacijaId?: string;
  nadzornikId: string;
  ishod: Ishod;
  subjekt?: Subjekt | null;
  razlog?: Razlog | null;
  opis?: string | null;
}): Promise<ObaviNadzorRezultat> {
  const vrstaPredmeta = input.vrstaPredmeta ?? "VERIFIKACIJA";
  const id = input.id ?? input.verifikacijaId;
  const { nadzornikId, ishod } = input;
  if (!id) throw new NadzorGreska("Nedostaje predmet nadzora.", 400);
  if (!jeVrstaPredmeta(vrstaPredmeta)) throw new NadzorGreska("Nepoznata vrsta predmeta nadzora.", 400);

  const validacija = validirajIshod({
    ishod,
    subjekt: input.subjekt,
    razlog: input.razlog,
    opis: input.opis,
  });
  if (!validacija.ok) throw new NadzorGreska(validacija.poruka, 400);

  // Uz „uredno" se obrazloženje ne traži i eventualno poslata polja se odbacuju —
  // da se sumnja ne bi upisala uz ishod koji je ne izražava.
  const sumnja = jeSumnja(ishod);
  const subjekt = sumnja ? (input.subjekt as Subjekt) : null;
  const razlog = sumnja ? (input.razlog as Razlog) : null;
  const opis = sumnja ? (input.opis?.trim() || null) : null;

  const rez = await prisma.$transaction(async (tx) => {
    // ── Predmet: učesnici, da li podleže nadzoru, poslednji ishod ────────────
    let podleze: boolean;
    let poslednjiIshod: string | null;
    let ucesnici: string[];
    let davalacPseudonim: string;
    let primalacPseudonim: string;

    if (vrstaPredmeta === "VERIFIKACIJA") {
      const v = await tx.verifikacionaVeza.findUnique({
        where: { id },
        include: {
          verifikator: { select: { id: true, pseudonim: true } },
          verifikovani: { select: { id: true, pseudonim: true } },
        },
      });
      if (!v) throw new NadzorGreska("Potvrda ne postoji.", 404);
      podleze = v.podlezeNadzoru;
      poslednjiIshod = v.nadzorIshod;
      ucesnici = [v.verifikatorId, v.verifikovaniId];
      davalacPseudonim = v.verifikator.pseudonim;
      primalacPseudonim = v.verifikovani.pseudonim;
    } else if (vrstaPredmeta === "POTVRDA_CLANA") {
      const p = await tx.potvrdaClana.findUnique({
        where: { id },
        include: {
          potvrdio: { select: { pseudonim: true } },
          potvrdjeni: { select: { pseudonim: true } },
          verifikacija: { select: { verifikatorId: true } },
        },
      });
      if (!p || p.ponistenaAt) throw new NadzorGreska("Potvrda ne postoji.", 404);
      podleze = p.podlezeNadzoru;
      poslednjiIshod = p.nadzorIshod;
      ucesnici = [p.potvrdjeniId, p.verifikacija.verifikatorId, ...(p.potvrdioId ? [p.potvrdioId] : [])];
      davalacPseudonim = p.potvrdio?.pseudonim ?? LANAC_PSEUDONIM;
      primalacPseudonim = p.potvrdjeni.pseudonim;
    } else {
      const p = await tx.potvrdaPostojanjaDeteta.findUnique({
        where: { id },
        include: {
          potvrdio: { select: { pseudonim: true } },
          roditelj: { select: { pseudonim: true } },
        },
      });
      if (!p || p.ponistenaAt || !p.potvrdjenoAt) throw new NadzorGreska("Potvrda ne postoji.", 404);
      podleze = p.podlezeNadzoru;
      poslednjiIshod = p.nadzorIshod;
      ucesnici = [p.roditeljId, p.deteId, ...(p.potvrdioId ? [p.potvrdioId] : [])];
      davalacPseudonim = p.potvrdio?.pseudonim ?? "—";
      primalacPseudonim = p.roditelj.pseudonim;
    }

    if (!podleze) {
      throw new NadzorGreska("Ova potvrda ne podleže nadzoru (čl. 22 Pravilnika o dokazu stvarnosti).", 400);
    }
    if (poslednjiIshod === "UREDNO") {
      throw new NadzorGreska("Nadzor nad ovom potvrdom je okončan.", 409);
    }
    // Čl. 23 st. 3: nadzor ne obavlja onaj ko je u predmetu učestvovao.
    if (ucesnici.includes(nadzornikId)) {
      throw new NadzorGreska("Ne možeš da nadziraš potvrdu u kojoj i ti učestvuješ.", 400);
    }

    const nadzornik = await tx.user.findUnique({
      where: { id: nadzornikId },
      select: { id: true, pseudonim: true, tipKorisnika: true, admin: true, maloletan: true, jeOsnivac: true, verified: true, indeksStvarnosti: true, potvrdjenAt: true },
    });
    if (!nadzornik) throw new NadzorGreska("Nadzornik ne postoji.", 404);
    if (!mozeNadzor(nadzornik)) {
      throw new NadzorGreska("Nemaš ovlašćenje za nadzor (samo čuvari Kola, čl. 23).", 403);
    }

    // ── Zapis ishoda: jedan po nadzorniku po predmetu (čl. 23 st. 3) ─────────
    const fk =
      vrstaPredmeta === "VERIFIKACIJA"
        ? { verifikacijaId: id }
        : vrstaPredmeta === "POTVRDA_CLANA"
          ? { potvrdaClanaId: id }
          : { potvrdaPostojanjaId: id };
    const vecGledao = await tx.nadzorZapis.findFirst({ where: { ...fk, nadzornikId }, select: { id: true } });
    if (vecGledao) {
      throw new NadzorGreska("Tvoj ishod nad ovom potvrdom je već upisan.", 409);
    }
    const dosadasnjih = await tx.nadzorZapis.count({ where: fk });
    const prvi = dosadasnjih === 0;

    await tx.nadzorZapis.create({
      data: { ...fk, nadzornikId, ishod, subjekt, razlog, opis, poenEvidentiran: prvi },
    });

    const trag = { nadzornikId, nadzoranAt: new Date(), nadzorIshod: ishod };
    if (vrstaPredmeta === "VERIFIKACIJA") {
      await tx.verifikacionaVeza.update({
        where: { id },
        // `PONISTEN`: nadzor se više ne plaća (4.7.5), pa za ovu vezu 500 nikad ne nastaje.
        data: { ...trag, nadzorPoenStatus: PotvrdaPoenStatus.PONISTEN },
      });
    } else if (vrstaPredmeta === "POTVRDA_CLANA") {
      await tx.potvrdaClana.update({ where: { id }, data: trag });
    } else {
      await tx.potvrdaPostojanjaDeteta.update({ where: { id }, data: trag });
    }

    if (sumnja) {
      // Jedan predmet po zapisu (čl. 27 st. 1): drugi nadzornik koji doda ishod
      // ažurira postojeći. Predmet koji je UO već rešio se NE vraća u OTVOREN.
      const kljuc =
        vrstaPredmeta === "VERIFIKACIJA"
          ? { verifikacijaId: id }
          : vrstaPredmeta === "POTVRDA_CLANA"
            ? { potvrdaClanaId: id }
            : { potvrdaPostojanjaId: id };
      await tx.nadzorniPredmet.upsert({
        where: kljuc,
        create: { ...fk, subjekt: subjekt!, razlog: razlog!, opis },
        update: { subjekt: subjekt!, razlog: razlog!, opis },
      });
    }

    return {
      verifikatorPseudonim: davalacPseudonim,
      verifikovaniPseudonim: primalacPseudonim,
      nadzornikPseudonim: nadzornik.pseudonim,
      prviIshod: prvi,
    };
  });

  // 🔴 Nadzor se ne plaća (dokaz stvarnosti čl. 19 st. 8 i 23 st. 2): POEN nadzorniku ne nastaje.

  return {
    vrstaPredmeta,
    id,
    verifikacijaId: id,
    ishod,
    ...rez,
    nadzornikId,
    predmetOtvoren: sumnja,
  };
}

/**
 * Sve što čeka nadzor ovog nadzornika, iz tri tabele (čl. 22, 23 st. 4).
 *
 * Zapis izlazi sa spiska tek kad neko evidentira „uredno" — dok stoji „za proveru"
 * ostaje vidljiv OSTALIM nadzornicima (čl. 24 st. 2). Ne prikazuju se predmeti u kojima je
 * nadzornik učestvovao (čl. 23 st. 3), ni oni nad kojima je već upisao ishod.
 *
 * Redosled (čl. 25): prvo verifikacije koje je obavio član bez potvrde, zatim stavke
 * sa više signala, a među jednakima najstarija (`sortirajPoSignalima`). Signali samo
 * određuju redosled; ko traži i signale za prikaz, zove `listajZaNadzorSaSignalima`
 * da se ne računaju dvaput.
 */
export async function listajZaNadzor(nadzornikId: string): Promise<StavkaNadzora[]> {
  return (await listajZaNadzorSaSignalima(nadzornikId)).lista;
}

/** Spisak za nadzor, poređan po čl. 25, zajedno sa signalima uz svaku stavku. */
export async function listajZaNadzorSaSignalima(
  nadzornikId: string,
): Promise<{ lista: StavkaNadzora[]; signali: Map<string, SignalNadzora[]> }> {
  const sve = await stavkeZaNadzor(nadzornikId);
  const signali = await signaliZaNadzor(sve);
  return { lista: sortirajPoSignalima(sve, signali), signali };
}

async function stavkeZaNadzor(nadzornikId: string): Promise<StavkaNadzora[]> {
  const [veze, potvrde, postojanja] = await Promise.all([
    prisma.verifikacionaVeza.findMany({
      where: {
        podlezeNadzoru: true,
        verifikatorId: { not: nadzornikId },
        verifikovaniId: { not: nadzornikId },
        nadzorZapisi: { none: { nadzornikId } },
        OR: OTVOREN_ISHOD,
      },
      orderBy: { vremenskiZig: "asc" },
      include: {
        verifikator: { select: { id: true, pseudonim: true } },
        verifikovani: { select: { id: true, pseudonim: true } },
        nadzorZapisi: { select: { id: true, ishod: true, razlog: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.potvrdaClana.findMany({
      where: {
        podlezeNadzoru: true,
        ponistenaAt: null,
        potvrdjeniId: { not: nadzornikId },
        verifikacija: { verifikatorId: { not: nadzornikId } },
        nadzorZapisi: { none: { nadzornikId } },
        AND: [nijeOn(nadzornikId), { OR: OTVOREN_ISHOD }],
      },
      orderBy: { createdAt: "asc" },
      include: {
        potvrdio: { select: { id: true, pseudonim: true } },
        potvrdjeni: { select: { id: true, pseudonim: true } },
        verifikacija: { select: { verifikator: { select: { id: true, pseudonim: true } } } },
        nadzorZapisi: { select: { id: true, ishod: true, razlog: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.potvrdaPostojanjaDeteta.findMany({
      where: {
        podlezeNadzoru: true,
        potvrdjenoAt: { not: null },
        ponistenaAt: null,
        roditeljId: { not: nadzornikId },
        deteId: { not: nadzornikId },
        nadzorZapisi: { none: { nadzornikId } },
        AND: [nijeOn(nadzornikId), { OR: OTVOREN_ISHOD }],
      },
      orderBy: { potvrdjenoAt: "asc" },
      include: {
        potvrdio: { select: { id: true, pseudonim: true } },
        // Samo pseudonim roditelja — dete se nadzorniku ne prikazuje (deca čl. 13 st. 2).
        roditelj: { select: { id: true, pseudonim: true } },
        nadzorZapisi: { select: { id: true, ishod: true, razlog: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    }),
  ]);

  const stavke: StavkaNadzora[] = [
    ...veze.map((v) => ({
      vrstaPredmeta: "VERIFIKACIJA" as const,
      id: v.id,
      datum: v.vremenskiZig,
      davalac: v.verifikator,
      primalac: v.verifikovani,
      vrstaVerifikacije: v.vrsta,
      poPozivu: v.poPozivu,
      verifikatorBezPotvrde: v.verifikatorBezPotvrde,
      izvor: null,
      korak: null,
      premaUvodiocu: false,
      uveo: null,
      ranijiZapisi: v.nadzorZapisi,
    })),
    ...potvrde.map((p) => ({
      vrstaPredmeta: "POTVRDA_CLANA" as const,
      id: p.id,
      datum: p.createdAt,
      davalac: p.potvrdio,
      primalac: p.potvrdjeni,
      vrstaVerifikacije: null,
      // Potvrda čuvara posle razgovora telefonom (dokaz čl. 16) nosi signal „sa spiska".
      poPozivu: p.nacin === "TELEFONOM",
      verifikatorBezPotvrde: false,
      izvor: p.izvor,
      korak: p.korak,
      premaUvodiocu: p.premaUvodiocu,
      uveo: p.verifikacija.verifikator,
      ranijiZapisi: p.nadzorZapisi,
    })),
    ...postojanja.map((p) => ({
      vrstaPredmeta: "POTVRDA_POSTOJANJA" as const,
      id: p.id,
      datum: p.potvrdjenoAt!,
      davalac: p.potvrdio,
      primalac: p.roditelj,
      vrstaVerifikacije: null,
      poPozivu: false,
      verifikatorBezPotvrde: false,
      izvor: null,
      korak: null,
      premaUvodiocu: false,
      uveo: null,
      ranijiZapisi: p.nadzorZapisi,
    })),
  ];
  return stavke;
}

/**
 * @deprecated Stari naziv (do seta 4.8.2 samo verifikacije). Vraća sve tri vrste;
 * koristiti `listajZaNadzor` ili, za broj, `brojVerifikacijaZaNadzor`.
 */
export const listajVerifikacijeZaNadzor = listajZaNadzor;

/**
 * Signali uz stavke koje čekaju nadzor (dokaz stvarnosti čl. 25 st. 2). Računaju se
 * pri prikazu iz postojećih podataka i ne čuvaju se. Vraća mapu id stavke → signali;
 * stavka bez signala ima prazan niz.
 */
export async function signaliZaNadzor(stavke: StavkaNadzora[]): Promise<Map<string, SignalNadzora[]>> {
  const rezultat = new Map<string, SignalNadzora[]>();
  if (stavke.length === 0) return rezultat;

  const veze = stavke.filter((s) => s.vrstaPredmeta === "VERIFIKACIJA" && s.davalac);
  const davaoci = [...new Set(stavke.flatMap((s) => (s.davalac ? [s.davalac.id] : [])))];
  const ljudi = [...new Set([...davaoci, ...veze.map((v) => v.primalac.id)])];

  const [sveVeze, svePotvrde, svaPostojanja, korisnici] = await Promise.all([
    prisma.verifikacionaVeza.findMany({
      where: { verifikatorId: { in: davaoci } },
      select: { verifikatorId: true, vremenskiZig: true },
    }),
    prisma.potvrdaClana.findMany({
      where: { potvrdioId: { in: davaoci }, izvor: "CLAN_KOLA" },
      select: { potvrdioId: true, createdAt: true },
    }),
    prisma.potvrdaPostojanjaDeteta.findMany({
      where: { potvrdioId: { in: davaoci }, potvrdjenoAt: { not: null } },
      select: { potvrdioId: true, potvrdjenoAt: true },
    }),
    prisma.user.findMany({
      where: { id: { in: ljudi } },
      select: { id: true, location: true, wallet: { select: { id: true } } },
    }),
  ]);
  const korisnik = new Map(korisnici.map((k) => [k.id, k]));

  /** Koja je ovo po redu verifikacija ili potvrda davaoca u istom danu (čl. 21 st. 1). */
  const redniUDanu = (davalacId: string, trenutak: Date, saPostojanjem: boolean) => {
    const dan = beogradskiDan(trenutak).getTime();
    const isti = (t: Date) => beogradskiDan(t).getTime() === dan && t <= trenutak;
    let n = sveVeze.filter((x) => x.verifikatorId === davalacId && isti(x.vremenskiZig)).length;
    n += svePotvrde.filter((x) => x.potvrdioId === davalacId && isti(x.createdAt)).length;
    if (saPostojanjem) {
      n += svaPostojanja.filter((x) => x.potvrdioId === davalacId && x.potvrdjenoAt && isti(x.potvrdjenoAt)).length;
    }
    return n;
  };

  for (const s of stavke) {
    if (s.vrstaPredmeta === "POTVRDA_CLANA") {
      rezultat.set(
        s.id,
        signaliPotvrdeClana({
          redniUDanu: s.izvor === "CLAN_KOLA" && s.davalac ? redniUDanu(s.davalac.id, s.datum, false) : null,
          korakLanca: s.izvor === "LANAC" ? s.korak : null,
          telefonom: s.poPozivu,
          premaUvodiocu: s.premaUvodiocu,
        }),
      );
      continue;
    }
    if (s.vrstaPredmeta === "POTVRDA_POSTOJANJA") {
      const n = s.davalac
        ? svaPostojanja.filter(
            (x) =>
              x.potvrdioId === s.davalac!.id &&
              x.potvrdjenoAt &&
              beogradskiDan(x.potvrdjenoAt).getTime() === beogradskiDan(s.datum).getTime() &&
              x.potvrdjenoAt <= s.datum,
          ).length
        : null;
      rezultat.set(s.id, signaliPotvrdeClana({ redniUDanu: n, korakLanca: null }));
      continue;
    }

    const ver = s.davalac ? korisnik.get(s.davalac.id) : undefined;
    const pot = korisnik.get(s.primalac.id);
    const novcanikPot = pot?.wallet?.id;
    const novcanikVer = ver?.wallet?.id;
    const [razmenaPosle, medjusobna] = await Promise.all([
      novcanikPot
        ? prisma.transaction.count({
            where: {
              ...USLOV_RAZMENE,
              createdAt: { gte: s.datum },
              OR: [{ fromWalletId: novcanikPot }, { toWalletId: novcanikPot }],
            },
          })
        : Promise.resolve(0),
      novcanikPot && novcanikVer
        ? prisma.transaction.count({
            where: {
              ...USLOV_RAZMENE,
              OR: [
                { fromWalletId: novcanikPot, toWalletId: novcanikVer },
                { fromWalletId: novcanikVer, toWalletId: novcanikPot },
              ],
            },
          })
        : Promise.resolve(0),
    ]);

    rezultat.set(
      s.id,
      signaliPotvrde({
        redniUDanu: s.davalac ? redniUDanu(s.davalac.id, s.datum, false) : 1,
        verifikatorBezPotvrde: s.verifikatorBezPotvrde,
        uvodjenjeSaSpiska: s.vrstaVerifikacije === "UVODJENJE" && s.poPozivu,
        danaOdPotvrde: Math.floor((Date.now() - s.datum.getTime()) / 86_400_000),
        potvrdjeniRazmenio: razmenaPosle > 0,
        mestoVerifikatora: ver?.location ?? null,
        mestoPotvrdjenog: pot?.location ?? null,
        medjusobnaRazmena: medjusobna > 0,
      }),
    );
  }
  return rezultat;
}

/**
 * Broj stavki koje čekaju nadzor (za badge u sidebar-u) — sve tri vrste.
 */
export async function brojVerifikacijaZaNadzor(nadzornikId: string): Promise<number> {
  const [veze, potvrde, postojanja] = await Promise.all([
    prisma.verifikacionaVeza.count({
      where: {
        podlezeNadzoru: true,
        verifikatorId: { not: nadzornikId },
        verifikovaniId: { not: nadzornikId },
        nadzorZapisi: { none: { nadzornikId } },
        OR: OTVOREN_ISHOD,
      },
    }),
    prisma.potvrdaClana.count({
      where: {
        podlezeNadzoru: true,
        ponistenaAt: null,
        potvrdjeniId: { not: nadzornikId },
        verifikacija: { verifikatorId: { not: nadzornikId } },
        nadzorZapisi: { none: { nadzornikId } },
        AND: [nijeOn(nadzornikId), { OR: OTVOREN_ISHOD }],
      },
    }),
    prisma.potvrdaPostojanjaDeteta.count({
      where: {
        podlezeNadzoru: true,
        potvrdjenoAt: { not: null },
        ponistenaAt: null,
        roditeljId: { not: nadzornikId },
        deteId: { not: nadzornikId },
        nadzorZapisi: { none: { nadzornikId } },
        AND: [nijeOn(nadzornikId), { OR: OTVOREN_ISHOD }],
      },
    }),
  ]);
  return veze + potvrde + postojanja;
}
