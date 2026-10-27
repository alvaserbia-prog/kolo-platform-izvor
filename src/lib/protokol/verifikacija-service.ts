/**
 * Servis za izvršenje verifikacije (Pravilnik o dokazu stvarnosti, set 4.8.3,
 * čl. 2, 4–7, 15–17, 19, 21, 28).
 *
 * Verifikacija je POTVRDA ili UVOĐENJE U KOLO (čl. 4 st. 1):
 *  - član Kola, čuvar ili osnivač koji osobu lično zna je POTVRĐUJE → član Kola;
 *  - član Kola posle razgovora telefonom sa korisnikom sa spiska za poziv ga UVODI
 *    (`poPozivu`) → član bez potvrde;
 *  - član bez potvrde UVEK samo uvodi (čl. 4 st. 2) → član bez potvrde.
 *
 * Potvrda člana bez potvrde (čl. 5) NIJE nova verifikacija: ne nastaje
 * nova `VerifikacionaVeza`, ne upisuje se POEN, nego se uz uvođenje beleži
 * `PotvrdaClana` sa načinom potvrde: lično (čl. 5 st. 1 t. 1), čuvar Kola posle razgovora
 * telefonom (čl. 16) ili sa spiska povezanih (čl. 17).
 *
 * 🔴 Automatska potvrda lanca je UKINUTA (set 4.8.3): potvrda nikad ne nastupa
 * automatski. Ko postane član Kola dobija spisak povezanih — jedan nivo naniže (koje je
 * uveo dok je bio bez potvrde) i jedan naviše (ko je njega uveo) — i sa njega lično
 * potvrđuje one koje zna (`potvrdiSaSpiskaPovezanih`). Potvrda uvodioca je izuzetak
 * od čl. 28 i uvek je u nadzoru. Stari zapisi `izvor: LANAC` ostaju.
 *
 * 🔴 Keš statusa (`verified`, `indeksStvarnosti`, `potvrdjenAt`, `tipKorisnika`)
 * ovde se NE piše ručno — samo `preracunajStatusNaloga()` (status.ts).
 *
 * Pattern (CLAUDE.md pravilo 8):
 *   - DB promene unutar prisma.$transaction (atomarno), uz preračun statusa;
 *   - upis POEN-a i posledice promene statusa sekvencijalno VAN transakcije.
 */
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  TOKEN_VAZI_SEKUNDI,
  podlezeNadzoru,
  podlezeNadzoruPotvrda,
  proveriLanacBezKruga,
  type IzvorPotvrdeClana,
  type NacinPotvrdeClana,
  type VrstaVerifikacije,
} from "@/lib/protokol/dokaz-stvarnosti";
import { dnevniTempo, pocetakDana, PRAG_ZAUSTAVLJANJA } from "@/lib/potvrde-dnevno-pravila";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import { Prisma } from "@/generated/prisma/client";
import { probajUpisatiPotvrdu, javiZabelezeno } from "@/lib/protokol/potvrda-poen";
import { probajEvidentiratiGazdinstvo } from "@/lib/protokol/gazdinstvo";
import {
  jeOtvorioPoziv,
  ukloniSaSpiskaPoVerifikaciji,
  uslovRazgovoraRadiPotvrde,
  porukaUslovaRazgovora,
} from "@/lib/protokol/zahtev-razgovor";
import { spisakPovezanih, type Povezan } from "@/lib/potvrda-clana-pravila";
import { PORUKA_DETE_VAN_LANCA, smeULanacPotvrda } from "@/lib/deca-pravila";
import {
  jeCuvar,
  jePotvrdjen,
  jeVerifikovan,
  posledicePromeneStatusa,
  preracunajStatusNaloga,
  sme,
  statusUcesnika,
  type StatusUcesnika,
} from "@/lib/protokol/status";
import { jeSuperadmin } from "@/lib/dozvole";

type Tx = Prisma.TransactionClient;

export class VerifikacijaGreska extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    /** Peta potvrda u danu — potvrđivanje je zaustavljeno (dokaz stvarnosti čl. 21). */
    public zaustavljeno: boolean = false
  ) {
    super(message);
    this.name = "VerifikacijaGreska";
  }
}

/** Najveća dužina slobodne oznake (nadimka) koju verifikator daje verifikovanome. */
export const MAX_OZNAKA_DUZINA = 80;

/**
 * Normalizuje oznaku verifikatora: trimuje, sažima razmake i seče na MAX_OZNAKA_DUZINA.
 * Prazna/whitespace oznaka → null (briše postojeću).
 */
export function normalizujOznaku(oznaka: unknown): string | null {
  if (typeof oznaka !== "string") return null;
  const ocisceno = oznaka.replace(/\s+/g, " ").trim();
  if (ocisceno.length === 0) return null;
  return ocisceno.slice(0, MAX_OZNAKA_DUZINA);
}

/**
 * Generiše jednokratan token za verifikaciju za datog korisnika.
 * Token važi 24 sata. Vraća { token, brojCifara, expiresAt }.
 */
export async function generisiTokenZaVerifikaciju(korisnikId: string) {
  const korisnik = await prisma.user.findUnique({ where: { id: korisnikId } });
  if (!korisnik) {
    throw new VerifikacijaGreska("Korisnik ne postoji", 404);
  }
  // Detetu se kod ne izdaje (Pravilnik o učešću dece čl. 29 st. 2). Ekran `/verifikacija` maloletan nalog i
  // inače preusmerava, ali ekran nije poslednja reč — ruta je dostižna svakome
  // ko zna adresu, a kod koji ništa ne otvara je poziv da se pokuša.
  if (!smeULanacPotvrda(korisnik)) {
    throw new VerifikacijaGreska(PORUKA_DETE_VAN_LANCA, 403);
  }
  // Kod generiše onaj ko verifikaciju prima (tabela dozvola 1.5, red 13): korisnik
  // (od bilo kog verifikovanog) i član bez potvrde (da ga potvrdi član Kola). Član
  // Kola i osnivač ne primaju ništa (čl. 2 st. 2, čl. 29 st. 4).
  if (!sme("PRIMA_VERIFIKACIJU", statusUcesnika(korisnik))) {
    throw new VerifikacijaGreska("Ovaj član je već potvrđen. Stvarnost se potvrđuje jednom.", 409);
  }

  // Generiše unique token i 6-cifren broj
  // Retry pri kolizijama (vrlo retke — 32 bajta hex ima 2^256 prostor)
  for (let pokusaj = 0; pokusaj < 5; pokusaj++) {
    const token = crypto.randomBytes(32).toString("hex");
    const brojCifara = String(Math.floor(100000 + Math.random() * 900000));
    try {
      const expiresAt = new Date(Date.now() + TOKEN_VAZI_SEKUNDI * 1000);
      const zapis = await prisma.verifikacijaToken.create({
        data: {
          token,
          brojCifara,
          korisnikId,
          expiresAt,
        },
      });
      return {
        token: zapis.token,
        brojCifara: zapis.brojCifara,
        expiresAt: zapis.expiresAt,
      };
    } catch (e) {
      // Unique violation — pokušaj ponovo
      if (pokusaj === 4) throw e;
    }
  }
  throw new VerifikacijaGreska("Ne mogu da generišem token, pokušaj ponovo", 500);
}

/** Kako je član Kola upoznao osobu sa spiska za poziv (otvoreno pitanje 1). */
export type NacinVerifikacije = "LICNO" | "TELEFONOM";

/** Ishod: verifikacija (potvrda ili uvođenje) ili potvrda člana bez potvrde. */
export type VrstaIshoda = "POTVRDA" | "UVODJENJE" | "POTVRDA_CLANA";

export type IzvrsiVerifikacijuInput = {
  verifikatorId: string;
  tokenIliBroj: string; // 64-char hex ili 6-cifren broj
  potvrdaPoznavanja: boolean;
  oznaka?: string; // opciona slobodna oznaka (nadimak) za verifikovanog — samo verifikator/UO
  /**
   * Kad je meta na spisku za poziv, a verifikator nije otvarao njen poziv: „Znam ga
   * lično" (potvrda) ili „Upoznali smo se telefonom" (uvođenje u Kolo). Ako je
   * verifikator otvorio poziv te osobe, verifikacija je uvek uvođenje (čl. 12 st. 2).
   */
  nacin?: NacinVerifikacije;
};

export type IzvrsiVerifikacijuRezultat = {
  vrsta: VrstaIshoda;
  /** Verifikaciona veza (kod potvrde člana bez potvrde — uvođenje uz koje se beleži). */
  verifikacijaId: string;
  /** Samo kod potvrde člana bez potvrde. */
  potvrdaClanaId: string | null;
  verifikovaniId: string;
  verifikovaniPseudonim: string;
  verifikatorPseudonim: string;
  /** Interni zapis (≥ 10 = verifikovan). Ne prikazuje se kao procenat. */
  verifikovaniNoviIndeks: number;
  /** Status verifikovanog posle radnje. */
  status: StatusUcesnika;
  /**
   * Koliko ljudi ima na spisku povezanih onaj ko je ovom radnjom postao član Kola
   * (čl. 17). 0 kad nije postao član Kola ili kad je spisak prazan.
   */
  povezani: number;
  /**
   * Koja je ovo verifikacija u danu, ako ide uz upozorenje (3. ili 4. — dokaz
   * stvarnosti čl. 21). `null` kad upozorenja nema.
   */
  upozorenjeDnevno: number | null;
};

type Promena = { userId: string; pre: StatusUcesnika; posle: StatusUcesnika };

/** Rezultat Faze 1 (unutar transakcije). */
type FazaJedan = {
  vrsta: VrstaIshoda;
  verifikacijaId: string;
  potvrdaClanaId: string | null;
  verifikatorId: string;
  verifikatorPseudonim: string;
  verifikovaniId: string;
  verifikovaniPseudonim: string;
  verifikovaniNoviIndeks: number;
  upozorenjeDnevno: number | null;
  /** Promena statusa mete. */
  promena: Promena;
};

const IZBOR_UCESNIKA = {
  id: true,
  pseudonim: true,
  maloletan: true,
  jeOsnivac: true,
  verified: true,
  indeksStvarnosti: true,
  potvrdjenAt: true,
  tipKorisnika: true,
} as const;

/**
 * Broj verifikacija koje je verifikator obavio danas, za dnevni tempo (čl. 21 st. 1):
 * verifikacije (potvrde i uvođenja) i potvrde člana bez potvrde koje je on dao — lično,
 * telefonom i sa spiska povezanih (sve su `izvor: CLAN_KOLA`). Odluka Fondacije i
 * stari zapisi automatske potvrde lanca se ne broje. Ekran `/verifikacija`
 * koristi isti broj, da upozorenje stoji PRE unosa koda.
 */
export async function brojVerifikacijaDanas(
  verifikatorId: string,
  db: Tx | typeof prisma = prisma,
): Promise<number> {
  const od = pocetakDana();
  const [veze, potvrde] = await Promise.all([
    db.verifikacionaVeza.count({ where: { verifikatorId, vremenskiZig: { gte: od } } }),
    db.potvrdaClana.count({
      where: { potvrdioId: verifikatorId, izvor: "CLAN_KOLA", ponistenaAt: null, createdAt: { gte: od } },
    }),
  ]);
  return veze + potvrde;
}

/** Dnevni tempo (čl. 21): baca na petoj, vraća redni broj uz 3. i 4. */
async function proveriTempo(tx: Tx, verifikatorId: string): Promise<number | null> {
  const tempo = dnevniTempo(await brojVerifikacijaDanas(verifikatorId, tx));
  if (!tempo.sme) {
    throw new VerifikacijaGreska(
      // Tekst bez broja: srpska rečenica je ključ prevoda (`kljucGreske`), pa
      // promenljiv deo ne sme da uđe u nju.
      "Peta potvrda u istom danu se ne upisuje — potvrđivanje ti je zaustavljeno do ponoći, a Fondacija je obaveštena. Sve ostalo na platformi radi kao i do sada.",
      429,
      true
    );
  }
  return tempo.upozorenje ? tempo.sledeca : null;
}

/** Lanac bez kruga (čl. 28) — važi i za potvrdu člana bez potvrde (čl. 5 st. 4). */
async function proveriKrug(tx: Tx, verifikatorId: string, metaId: string): Promise<void> {
  const zapisi = await tx.verifikacionaVeza.findMany({
    select: { verifikatorId: true, verifikovaniId: true },
  });
  const lanac = proveriLanacBezKruga(verifikatorId, metaId, zapisi);
  if (!lanac.dozvoljeno) {
    throw new VerifikacijaGreska(lanac.razlog, 403);
  }
}

/**
 * Potvrda člana bez potvrde (čl. 5, 16, 17). NIJE nova verifikacija: nema
 * `verifikacionaVeza.create`, nema POEN-a; beleži se `PotvrdaClana` uz uvođenje kojim
 * je član verifikovan, sa načinom potvrde, i preračunava se status. Potvrđeni silazi
 * sa spiska za poziv (dokaz stvarnosti čl. 12 st. 3). 🔴 Ništa se ne potvrđuje automatski.
 */
async function potvrdiClana(
  tx: Tx,
  ulaz: {
    potvrdjeniId: string;
    izvor: Extract<IzvorPotvrdeClana, "CLAN_KOLA" | "FONDACIJA">;
    potvrdioId: string;
    davalacStatus: StatusUcesnika | null;
    obrazlozenje?: string | null;
    /** Samo uz CLAN_KOLA. */
    nacin?: NacinPotvrdeClana;
    /** Potvrda uvodioca sa spiska povezanih (čl. 17 st. 3). */
    premaUvodiocu?: boolean;
  },
): Promise<{ potvrdaId: string; verifikacijaId: string; promena: Promena }> {
  const uvodjenje = await tx.verifikacionaVeza.findFirst({
    where: {
      verifikovaniId: ulaz.potvrdjeniId,
      vrsta: "UVODJENJE",
      potvrdeClana: { none: { aktivnaKljuc: { not: null } } },
    },
    orderBy: { vremenskiZig: "asc" },
    select: { id: true },
  });
  if (!uvodjenje) {
    throw new VerifikacijaGreska("Ovaj član je već potvrđen. Stvarnost se potvrđuje jednom.", 409);
  }
  const nacin = ulaz.izvor === "CLAN_KOLA" ? ulaz.nacin ?? "LICNO" : null;
  const premaUvodiocu = ulaz.izvor === "CLAN_KOLA" && ulaz.premaUvodiocu === true;
  const potvrda = await tx.potvrdaClana.create({
    data: {
      verifikacijaId: uvodjenje.id,
      potvrdjeniId: ulaz.potvrdjeniId,
      izvor: ulaz.izvor,
      potvrdioId: ulaz.potvrdioId,
      obrazlozenje: ulaz.obrazlozenje ?? null,
      nacin,
      premaUvodiocu,
      podlezeNadzoru: podlezeNadzoruPotvrda(ulaz.davalacStatus, ulaz.izvor, { nacin, premaUvodiocu }),
      aktivnaKljuc: uvodjenje.id,
    },
    select: { id: true },
  });
  // Zahtev radi potvrde (čl. 16 st. 2) više nema svrhu — briše se sa brojem.
  await ukloniSaSpiskaPoVerifikaciji(ulaz.potvrdjeniId, tx);
  const promena = await preracunajStatusNaloga(tx, ulaz.potvrdjeniId);
  return {
    potvrdaId: potvrda.id,
    verifikacijaId: uvodjenje.id,
    promena: { userId: ulaz.potvrdjeniId, ...promena },
  };
}

/**
 * Spisak povezanih (dokaz stvarnosti čl. 17 st. 1): za člana Kola, odnosno osnivača,
 * oni koje je uveo dok je bio član bez potvrde (naniže) i onaj ko je njega uveo
 * (naviše) — samo dok su još članovi bez potvrde. Prazan za svakog ko nije potvrđen.
 * Sastavlja se iz grafa verifikacija; ništa se ne prikuplja.
 */
export async function spisakPovezanihZa(
  userId: string,
  db: Tx | typeof prisma = prisma,
): Promise<(Povezan & { pseudonim: string })[]> {
  const ja = await db.user.findUnique({ where: { id: userId }, select: IZBOR_UCESNIKA });
  if (!ja || ja.maloletan || !jePotvrdjen(statusUcesnika(ja))) return [];
  const [uveo, uvodilac] = await Promise.all([
    db.verifikacionaVeza.findMany({
      where: { verifikatorId: userId, vrsta: "UVODJENJE", verifikatorBezPotvrde: true },
      orderBy: { vremenskiZig: "asc" },
      select: { verifikovaniId: true },
    }),
    db.verifikacionaVeza.findFirst({
      where: { verifikovaniId: userId, vrsta: "UVODJENJE" },
      orderBy: { vremenskiZig: "asc" },
      select: { verifikatorId: true },
    }),
  ]);
  const ids = [...uveo.map((v) => v.verifikovaniId), ...(uvodilac ? [uvodilac.verifikatorId] : [])];
  if (ids.length === 0) return [];
  const ljudi = await db.user.findMany({
    where: { id: { in: ids }, status: "ACTIVE", deaktiviranAt: null },
    select: IZBOR_UCESNIKA,
  });
  const poId = new Map(ljudi.map((l) => [l.id, l]));
  const lista = spisakPovezanih({
    uveo: uveo.map((v) => v.verifikovaniId),
    uvodilac: uvodilac?.verifikatorId ?? null,
    bezPotvrde: (id) => {
      const l = poId.get(id);
      return !!l && !l.maloletan && statusUcesnika(l) === "CLAN_BEZ_POTVRDE";
    },
  });
  return lista.map((p) => ({ ...p, pseudonim: poId.get(p.userId)!.pseudonim }));
}

/**
 * Jezgro verifikacije unutar otvorene transakcije: učita oba učesnika, sprovede SVE
 * provere (statusi, čl. 3, 4, 6; jedna verifikacija, čl. 2; lanac bez kruga, čl. 28;
 * osnivač nije meta, čl. 29; dnevni tempo, čl. 21) i grana po statusu mete:
 *
 *  1. meta je ČLAN BEZ POTVRDE → potvrda člana bez potvrde (samo potvrđen davalac);
 *  2. meta je KORISNIK → verifikacija; vrsta po statusu verifikatora i spisku za poziv;
 *  3. meta je potvrđena ili osnivač → 409/403.
 *
 * Ne dira token — to je stvar pozivaoca.
 */
async function izvrsiJezgroVerifikacije(
  tx: Tx,
  verifikatorId: string,
  verifikovaniId: string,
  oznaka: string | null,
  opcije: {
    /** `false` samo za verifikaciju pri punoletstvu (čl. 21 st. 5). */
    dnevnoPravilo?: boolean;
    nacin?: NacinVerifikacije;
    /** Samo punoletstvo (čl. 7): vrsta koju daje roditelj. */
    vrsta?: VrstaVerifikacije;
  } = {},
): Promise<FazaJedan> {
  const dnevnoPravilo = opcije.dnevnoPravilo !== false;
  if (verifikovaniId === verifikatorId) {
    throw new VerifikacijaGreska("Ne možeš da potvrdiš samog sebe.", 400);
  }

  const verifikator = await tx.user.findUnique({ where: { id: verifikatorId }, select: IZBOR_UCESNIKA });
  if (!verifikator) {
    throw new VerifikacijaGreska("Član koji potvrđuje ne postoji.", 404);
  }
  const verifikovani = await tx.user.findUnique({ where: { id: verifikovaniId }, select: IZBOR_UCESNIKA });
  if (!verifikovani) {
    throw new VerifikacijaGreska("Član koga potvrđuješ ne postoji.", 404);
  }

  // Maloletni nalog ne ulazi u lanac potvrda — ni sa jedne strane (čl. 29 st. 2
  // Pravilnika o učešću dece). Provera stoji PRE svih ostalih.
  if (!smeULanacPotvrda(verifikator) || !smeULanacPotvrda(verifikovani)) {
    throw new VerifikacijaGreska(PORUKA_DETE_VAN_LANCA, 403);
  }

  // Oba su punoletna, pa se status čita bez stanja deteta.
  const statusVerifikatora = statusUcesnika(verifikator);
  const statusMete = statusUcesnika(verifikovani);

  // Korisnik ne verifikuje nikoga (čl. 15 st. 1: verifikator je član Kola, osnivač
  // ili član bez potvrde). 🔴 Imunitet NOSILAC_ZRNA je ukinut — status se čita iz
  // grafa, ne iz `tipKorisnika`.
  if (!jeVerifikovan(statusVerifikatora)) {
    throw new VerifikacijaGreska(
      "Ne možeš da potvrđuješ druge: tebe još niko nije potvrdio.",
      403
    );
  }

  // Osnivač ne može biti verifikovan u lancu potvrda (čl. 29 st. 4).
  if (verifikovani.jeOsnivac) {
    throw new VerifikacijaGreska("Početni član se ne potvrđuje u lancu potvrda.", 403);
  }
  // Jedna potvrda (čl. 2 st. 2): potvrđen član ne prima ništa više.
  if (jePotvrdjen(statusMete)) {
    throw new VerifikacijaGreska("Ovaj član je već potvrđen. Stvarnost se potvrđuje jednom.", 409);
  }

  // ── 1. Potvrda člana bez potvrde (čl. 5) ────────────────────────────
  if (statusMete === "CLAN_BEZ_POTVRDE") {
    if (opcije.vrsta) {
      // Punoletstvo cilja tek punoletnog korisnika, nikad člana bez potvrde.
      throw new VerifikacijaGreska("Ovaj član je već uveden u Kolo.", 409);
    }
    if (!jePotvrdjen(statusVerifikatora)) {
      throw new VerifikacijaGreska(
        "Člana bez potvrde potvrđuje samo član Kola koji ga lično zna.",
        403
      );
    }
    // Potvrda posle razgovora telefonom (čl. 16): kad je verifikator otvorio njegov
    // zahtev radi potvrde, ili sam kaže da su se upoznali telefonom. Daje je samo
    // čuvar Kola, pod uslovima iz čl. 16 st. 1, i uvek ide u nadzor.
    const zahtev = await tx.zahtevZaRazgovor.findUnique({
      where: { userId: verifikovani.id },
      select: { osnov: true },
    });
    const otvorio = zahtev?.osnov === "POTVRDA" && (await jeOtvorioPoziv(verifikatorId, verifikovani.id, tx));
    const telefonom = otvorio || opcije.nacin === "TELEFONOM";
    if (telefonom) {
      if (!jeCuvar(statusVerifikatora)) {
        throw new VerifikacijaGreska(
          "Posle razgovora telefonom člana bez potvrde potvrđuje samo čuvar Kola.",
          403
        );
      }
      const uslov = await uslovRazgovoraRadiPotvrde(verifikovani.id, tx);
      if (!uslov.ok) throw new VerifikacijaGreska(porukaUslovaRazgovora(uslov), 403);
    }
    const upozorenjeDnevno = dnevnoPravilo ? await proveriTempo(tx, verifikatorId) : null;
    await proveriKrug(tx, verifikatorId, verifikovani.id);
    const p = await potvrdiClana(tx, {
      potvrdjeniId: verifikovani.id,
      izvor: "CLAN_KOLA",
      potvrdioId: verifikatorId,
      davalacStatus: statusVerifikatora,
      nacin: telefonom ? "TELEFONOM" : "LICNO",
    });
    return {
      vrsta: "POTVRDA_CLANA",
      verifikacijaId: p.verifikacijaId,
      potvrdaClanaId: p.potvrdaId,
      verifikatorId,
      verifikatorPseudonim: verifikator.pseudonim,
      verifikovaniId: verifikovani.id,
      verifikovaniPseudonim: verifikovani.pseudonim,
      verifikovaniNoviIndeks: verifikovani.indeksStvarnosti,
      upozorenjeDnevno,
      promena: p.promena,
    };
  }

  // ── 2. Meta je korisnik: verifikacija (potvrda ili uvođenje) ──────────────────
  // Jedna verifikacija (čl. 2): ko ima važeću verifikaciju, ne prima drugu. Broje se
  // veze koje stoje — poništena verifikacija je obrisana (čl. 37).
  const vecPrimljenihVerifikacija = await tx.verifikacionaVeza.count({
    where: { verifikovaniId: verifikovani.id },
  });
  if (vecPrimljenihVerifikacija > 0) {
    throw new VerifikacijaGreska(
      "Ovaj član je već potvrđen. Stvarnost se potvrđuje jednom.",
      409
    );
  }

  // Dnevni tempo (čl. 21) — važi i za osnivače, čuvare i članove bez potvrde.
  const upozorenjeDnevno = dnevnoPravilo ? await proveriTempo(tx, verifikatorId) : null;
  await proveriKrug(tx, verifikatorId, verifikovani.id);

  // Vrsta verifikacije (čl. 4 st. 1–2; otvoreno pitanje 1).
  const verifikatorBezPotvrde = statusVerifikatora === "CLAN_BEZ_POTVRDE";
  let vrsta: VrstaVerifikacije;
  let poPozivu = false;
  if (verifikatorBezPotvrde) {
    // Član bez potvrde uvek samo uvodi (čl. 4 st. 2), i pri punoletstvu (čl. 7 st. 2).
    vrsta = "UVODJENJE";
  } else if (opcije.vrsta) {
    // Punoletstvo: roditelj član Kola daje potvrdu (čl. 7 st. 1).
    vrsta = "POTVRDA";
  } else {
    const naSpisku = await tx.zahtevZaRazgovor.findUnique({
      where: { userId: verifikovani.id },
      select: { id: true },
    });
    const otvorio = await jeOtvorioPoziv(verifikatorId, verifikovani.id, tx);
    if (otvorio || (naSpisku && opcije.nacin === "TELEFONOM")) {
      // Uvođenje u Kolo posle razgovora telefonom sa korisnikom sa spiska (čl. 12 st. 2).
      vrsta = "UVODJENJE";
      poPozivu = true;
    } else {
      vrsta = "POTVRDA";
    }
  }

  // Izračunaj redniBroj — najveći postojeći + 1, NE broj veza + 1. Veze se brišu
  // (lažna verifikacija, prestanak statusa, prevođenje naloga), pa broj ume da bude
  // manji od najvećeg rednog broja: tada bi `count + 1` udario u
  // @@unique([verifikatorId, redniBroj]) i potvrda bi pala sa „već postoji".
  const poslednja = await tx.verifikacionaVeza.aggregate({
    where: { verifikatorId },
    _max: { redniBroj: true },
  });
  const redniBroj = (poslednja._max.redniBroj ?? 0) + 1;
  const treboNadzor = podlezeNadzoru({ verifikatorStatus: statusVerifikatora, vrsta, poPozivu });

  // Spisak za poziv: korisnik silazi sa spiska pri SVAKOJ verifikaciji (dokaz stvarnosti čl.
  // 12 st. 3), ne i pri potvrdi člana bez potvrde.
  await ukloniSaSpiskaPoVerifikaciji(verifikovani.id, tx);

  const veza = await tx.verifikacionaVeza.create({
    data: {
      verifikatorId,
      verifikovaniId: verifikovani.id,
      redniBroj,
      podlezeNadzoru: treboNadzor,
      oznakaVerifikatora: oznaka,
      vrsta,
      poPozivu,
      verifikatorBezPotvrde,
    },
  });

  // Status verifikovanog se izvodi iz grafa (jedan pisac keša, status.ts).
  const promena = await preracunajStatusNaloga(tx, verifikovani.id);
  const posle = await tx.user.findUnique({
    where: { id: verifikovani.id },
    select: { indeksStvarnosti: true },
  });

  // Osiguraj wallet za obe strane (POEN po verifikaciji, čl. 19).
  for (const userId of [verifikovani.id, verifikator.id]) {
    const w = await tx.wallet.findUnique({ where: { userId }, select: { id: true } });
    if (!w) await tx.wallet.create({ data: { userId, type: "USER", balance: 0 } });
  }

  return {
    vrsta,
    verifikacijaId: veza.id,
    potvrdaClanaId: null,
    verifikatorId: verifikator.id,
    verifikatorPseudonim: verifikator.pseudonim,
    verifikovaniId: verifikovani.id,
    verifikovaniPseudonim: verifikovani.pseudonim,
    verifikovaniNoviIndeks: posle?.indeksStvarnosti ?? 0,
    upozorenjeDnevno,
    promena: { userId: verifikovani.id, ...promena },
  };
}

/** Mapira Prisma greške iz Faze 1 (serijalizacija/dupli par) u čiste poruke. */
function mapTransakcijaGreska(e: unknown): never {
  if (e instanceof VerifikacijaGreska) throw e;
  const code = e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : undefined;
  if (code === "P2002") {
    throw new VerifikacijaGreska("Ova potvrda već postoji.", 409);
  }
  if (code === "P2034") {
    throw new VerifikacijaGreska("Potvrda je u toku, pokušaj ponovo.", 409);
  }
  throw e;
}

/**
 * Ko je ovom radnjom postao član Kola dobija spisak povezanih (čl. 17 st. 1). Kad
 * spisak nije prazan, javlja mu se gde je. Ne baca. Vraća broj ljudi na spisku.
 */
async function javiSpisakPovezanih(promena: Promena): Promise<number> {
  if (!jePotvrdjen(promena.posle) || jePotvrdjen(promena.pre)) return 0;
  try {
    const lista = await spisakPovezanihZa(promena.userId);
    if (lista.length > 0) {
      await obavesti(promena.userId, {
        tip: "SPISAK_POVEZANIH",
        kljuc: "notifikacije.spisak_povezanih",
        parametri: { broj: lista.length },
        naslov: "Spisak povezanih",
        tekst:
          `Sada si član Kola. Na stranici Potvrde imaš spisak povezanih (${lista.length}): one koje si uveo u Kolo i onoga ko je tebe uveo, ako još nisu potvrđeni. Potvrdi samo one koje lično znaš.`,
        link: "/verifikacija#povezani",
        email: false,
      });
    }
    return lista.length;
  } catch (e) {
    console.error("[verifikacija] spisak povezanih nije javljen", promena.userId, e);
    return 0;
  }
}

/**
 * Faza 2: sve što ide POSLE upisa i VAN transakcije iz Faze 1 — upis POEN-a po
 * verifikaciji (čl. 19; i uvođenje nosi POEN, čl. 4 st. 3), doprinos gazdinstva i
 * posledice promene statusa (ZRNO, deca, gazdinstva).
 *
 * 🔴 Potvrda člana bez potvrde ne nosi POEN (čl. 5 st. 3, 16 st. 3, 17 st. 2):
 * za `POTVRDA_CLANA` se `probajUpisatiPotvrdu` NE zove.
 */
async function dovrsiVerifikaciju(
  fazaJedan: FazaJedan,
  opcije?: { bezUslovaZaPoen?: boolean }
): Promise<IzvrsiVerifikacijuRezultat> {
  const { verifikacijaId, verifikovaniId } = fazaJedan;

  if (fazaJedan.vrsta !== "POTVRDA_CLANA") {
    // 🔴 POEN PO VERIFIKACIJI NE NASTAJE SAMIM ČINOM (dokaz stvarnosti čl. 19): upisuje se
    // kad verifikovani ostvari prvi potvrđen doprinos. Sam čin verifikacije se ne
    // vezuje za uslov. Ne baca: verifikacija je u bazi.
    const upis = await probajUpisatiPotvrdu(verifikacijaId, {
      bezUslova: opcije?.bezUslovaZaPoen === true,
    });
    if (!upis.upisano) {
      await javiZabelezeno(verifikacijaId);
    }
    // Doprinos gazdinstva (Pravilnik o gazdinstvima čl. 16) čeka i verifikaciju. Ne baca.
    await probajEvidentiratiGazdinstvo(verifikovaniId);
  }

  // Posledice promene statusa (ZRNO, deca, gazdinstva). Obaveštenje mete šalje
  // pozivalac (ruta, punoletstvo), pa se ovde isključuje — inače bi stigla dva.
  try {
    await posledicePromeneStatusa(verifikovaniId, fazaJedan.promena.pre, fazaJedan.promena.posle, {
      obavestiUcesnika: false,
    });
  } catch (e) {
    console.error("[verifikacija] posledice promene statusa nisu izvršene", verifikovaniId, e);
  }
  const povezani = await javiSpisakPovezanih(fazaJedan.promena);

  return {
    vrsta: fazaJedan.vrsta,
    verifikacijaId,
    potvrdaClanaId: fazaJedan.potvrdaClanaId,
    verifikovaniId,
    verifikovaniPseudonim: fazaJedan.verifikovaniPseudonim,
    verifikatorPseudonim: fazaJedan.verifikatorPseudonim,
    verifikovaniNoviIndeks: fazaJedan.verifikovaniNoviIndeks,
    status: fazaJedan.promena.posle,
    povezani,
    upozorenjeDnevno: fazaJedan.upozorenjeDnevno,
  };
}

/**
 * Peta potvrda u danu je odbijena (čl. 21 st. 3): Fondacija se obaveštava. Jednom
 * dnevno po članu — ponovljeni pokušaji istog dana ne šalju novo obaveštenje.
 * Ne baca: obaveštenje ne sme da pokvari odgovor korisniku.
 */
async function javiZaustavljanje(verifikatorId: string): Promise<void> {
  try {
    const vec = await prisma.auditLog.findFirst({
      where: {
        akcija: "POTVRDJIVANJE_ZAUSTAVLJENO",
        targetId: verifikatorId,
        createdAt: { gte: pocetakDana() },
      },
      select: { id: true },
    });
    if (vec) return;
    const u = await prisma.user.findUnique({ where: { id: verifikatorId }, select: { pseudonim: true } });
    await logAdminAkcija(verifikatorId, "POTVRDJIVANJE_ZAUSTAVLJENO", verifikatorId, `pokušaj ${PRAG_ZAUSTAVLJANJA}. potvrde u danu`);
    await posaljiAdminAlert(
      "Potvrđivanje zaustavljeno do ponoći",
      `Član „${u?.pseudonim ?? verifikatorId}" je pokušao ${PRAG_ZAUSTAVLJANJA}. potvrdu u istom danu (dokaz stvarnosti čl. 21). Potvrđivanje mu je zaustavljeno do ponoći; ostalo radi. Proceniti da li treba pokrenuti postupak iz Glave IX ili suspenziju po Uslovima.`
    );
  } catch (e) {
    console.error("[verifikacija] obaveštenje o zaustavljanju nije poslato", e);
  }
}

/**
 * Izvršava verifikaciju preko TOKENA (QR / 6-cifren broj) — verifikacija uživo.
 * Token-match + provere (jezgro) + DB upis + POEN emisija.
 *
 * Isti ulaz služi za potvrdu, uvođenje u Kolo i potvrdu člana bez potvrde — vrstu
 * određuje jezgro po statusu obe strane (vidi `izvrsiJezgroVerifikacije`).
 */
export async function izvrsiVerifikaciju(
  input: IzvrsiVerifikacijuInput
): Promise<IzvrsiVerifikacijuRezultat> {
  const { verifikatorId, tokenIliBroj, potvrdaPoznavanja } = input;
  const oznaka = normalizujOznaku(input.oznaka);

  if (!potvrdaPoznavanja) {
    throw new VerifikacijaGreska(
      "Moraš potvrditi da osobu lično poznaješ i da preuzimaš odgovornost za potvrdu.",
      400
    );
  }
  if (!tokenIliBroj || tokenIliBroj.trim().length === 0) {
    throw new VerifikacijaGreska("Kod je obavezan.", 400);
  }

  // Faza 1: DB promene u jednoj transakciji
  // Skini sve whitespace karaktere (razmaci, tab, novi red) — QR ekran prikazuje "384 729"
  const trimmed = tokenIliBroj.replace(/\s+/g, "");

  // K6: SERIALIZABLE izolacija + jedinstven par (verifikatorId, verifikovaniId).
  // Time se sprečava da dve istovremene verifikacije (npr. recipročno A→B i B→A, ili
  // dupli A→B) obe prođu anti-cirkularnu proveru protiv grafa koji još ne sadrži onu
  // drugu vezu. Konflikt serijalizacije (P2034) ili dupli par (P2002) → čista poruka.
  let fazaJedan: FazaJedan;
  try {
    fazaJedan = await prisma.$transaction(async (tx) => {
      // Pronađi token: bilo po 64-char hex ili 6-cifrenom broju
      const token = await tx.verifikacijaToken.findFirst({
        where: {
          OR: [{ token: trimmed }, { brojCifara: trimmed }],
        },
      });
      if (!token) {
        if (process.env.NODE_ENV !== "production") {
          // Dev-only dijagnostika
          const aktivniTokeni = await tx.verifikacijaToken.findMany({
            where: { used: false, expiresAt: { gt: new Date() } },
            select: { brojCifara: true, expiresAt: true, korisnikId: true },
            take: 5,
          });
          console.warn(
            "[verifikacija] Token NIJE pronađen. Unos:",
            JSON.stringify(trimmed),
            "dužina:",
            trimmed.length,
            "Aktivni tokeni u bazi:",
            aktivniTokeni.map((t) => ({
              brojCifara: t.brojCifara,
              istice: t.expiresAt.toISOString(),
            }))
          );
        }
        throw new VerifikacijaGreska(
          `Nevažeći kod (uneseno: "${trimmed}"). Proveri da li si tačno preneo cifre.`,
          404
        );
      }
      if (token.used) {
        throw new VerifikacijaGreska("Kod je već iskorišćen.", 409);
      }
      if (token.expiresAt.getTime() < Date.now()) {
        throw new VerifikacijaGreska(
          "Kod je istekao. Neka osoba generiše novi.",
          410
        );
      }

      const fj = await izvrsiJezgroVerifikacije(tx, verifikatorId, token.korisnikId, oznaka, {
        nacin: input.nacin,
      });

      // Obeleži token kao iskorišćen
      await tx.verifikacijaToken.update({
        where: { id: token.id },
        data: { used: true, usedAt: new Date() },
      });

      return fj;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (e) {
    if (e instanceof VerifikacijaGreska && e.zaustavljeno) {
      await javiZaustavljanje(verifikatorId);
    }
    mapTransakcijaGreska(e);
  }

  return dovrsiVerifikaciju(fazaJedan);
}


/**
 * Verifikacija BEZ jednokratnog koda — jedini put kojim ne upravlja čovek pred
 * ekranom, nego sam sistem.
 *
 * 🔴 Postoji ISKLJUČIVO zbog verifikacije pri punoletstvu (dokaz stvarnosti čl. 7;
 * Pravilnik o učešću dece čl. 35 st. 4): prvi roditelj po redu povezivanja koji je član Kola,
 * odnosno osnivač, daje POTVRDU; ako takvog nema, prvi roditelj član bez potvrde daje
 * UVOĐENJE U KOLO; ako nijedan roditelj nije verifikovan, nalog ostaje korisnik.
 * Pozivalac (`punoletstvo.ts`) bira roditelja i šalje `vrsta`; jezgro vrstu ipak
 * izvodi iz stvarnog statusa roditelja — član bez potvrde uvek samo uvodi (čl. 4 st. 2).
 *
 * 🔴 NE otvarati ovaj put ničemu drugom. Sve ostale verifikacije idu kroz
 * `izvrsiVerifikaciju`, gde jednokratni kod dokazuje da su se dvoje stvarno našli.
 *
 * Provere jezgra ostaju na snazi (lanac bez kruga, čl. 28). Dnevni tempo iz čl. 21 se
 * NE primenjuje (čl. 21 st. 5): verifikaciju daje sistem, ne čovek koji brzo potvrđuje.
 * Pozivalac hvata `VerifikacijaGreska` i preskače tu verifikaciju.
 *
 * 🔴 `bezUslovaZaPoen` — POEN po verifikaciji se upisuje ODMAH, bez traga stvarnog
 * učešća iz dokaza stvarnosti čl. 19 (čl. 19 st. 4). Koristi ga ISKLJUČIVO prelazak u
 * punoletstvo. Ne otvarati ga ničemu drugom.
 */
export async function izvrsiVerifikacijuBezTokena(
  verifikatorId: string,
  verifikovaniId: string,
  oznaka?: string,
  opcije?: { bezUslovaZaPoen?: boolean; vrsta?: VrstaVerifikacije }
): Promise<IzvrsiVerifikacijuRezultat> {
  let fazaJedan: FazaJedan;
  try {
    fazaJedan = await prisma.$transaction(
      async (tx) =>
        izvrsiJezgroVerifikacije(tx, verifikatorId, verifikovaniId, normalizujOznaku(oznaka), {
          dnevnoPravilo: false,
          vrsta: opcije?.vrsta ?? "POTVRDA",
        }),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    mapTransakcijaGreska(e);
  }
  return dovrsiVerifikaciju(fazaJedan, { bezUslovaZaPoen: opcije?.bezUslovaZaPoen });
}

/**
 * Potvrda sa spiska povezanih (dokaz stvarnosti čl. 17): član Kola, odnosno osnivač,
 * označava povezanog koga lično zna — bez koda i bez novog razgovora. Svaka označena
 * osoba je posebna potvrda člana bez potvrde (čl. 5): ulazi u dnevni tempo,
 * podleže nadzoru po čl. 22, ne nosi POEN. Potvrda uvodioca (naviše) je izuzetak od
 * čl. 28 i uvek je u nadzoru (čl. 17 st. 3). Potvrđeni dobija sopstveni spisak.
 */
export async function potvrdiSaSpiskaPovezanih(
  potvrdilacId: string,
  metaId: string,
  potvrdaPoznavanja: boolean,
): Promise<IzvrsiVerifikacijuRezultat> {
  if (!potvrdaPoznavanja) {
    throw new VerifikacijaGreska("Moraš potvrditi da osobu poznaješ lično i da za to odgovaraš.", 400);
  }
  let fazaJedan: FazaJedan;
  try {
    fazaJedan = await prisma.$transaction(
      async (tx) => {
        const ja = await tx.user.findUnique({ where: { id: potvrdilacId }, select: IZBOR_UCESNIKA });
        if (!ja) throw new VerifikacijaGreska("Član koji potvrđuje ne postoji.", 404);
        const statusJa = statusUcesnika(ja);
        if (!jePotvrdjen(statusJa)) {
          throw new VerifikacijaGreska("Spisak povezanih ima samo član Kola.", 403);
        }
        const povezan = (await spisakPovezanihZa(potvrdilacId, tx)).find((p) => p.userId === metaId);
        if (!povezan) {
          throw new VerifikacijaGreska("Ova osoba nije na tvom spisku povezanih.", 404);
        }
        const meta = await tx.user.findUnique({ where: { id: metaId }, select: IZBOR_UCESNIKA });
        if (!meta) throw new VerifikacijaGreska("Član koga potvrđuješ ne postoji.", 404);
        const upozorenjeDnevno = await proveriTempo(tx, potvrdilacId);
        const navise = povezan.smer === "NAVISE";
        // Naniže važi zabrana iz čl. 28; naviše je izuzetak (čl. 17 st. 3).
        if (!navise) await proveriKrug(tx, potvrdilacId, metaId);
        const p = await potvrdiClana(tx, {
          potvrdjeniId: metaId,
          izvor: "CLAN_KOLA",
          potvrdioId: potvrdilacId,
          davalacStatus: statusJa,
          nacin: "SPISAK_POVEZANIH",
          premaUvodiocu: navise,
        });
        return {
          vrsta: "POTVRDA_CLANA" as const,
          verifikacijaId: p.verifikacijaId,
          potvrdaClanaId: p.potvrdaId,
          verifikatorId: potvrdilacId,
          verifikatorPseudonim: ja.pseudonim,
          verifikovaniId: metaId,
          verifikovaniPseudonim: meta.pseudonim,
          verifikovaniNoviIndeks: meta.indeksStvarnosti,
          upozorenjeDnevno,
          promena: p.promena,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof VerifikacijaGreska && e.zaustavljeno) {
      await javiZaustavljanje(potvrdilacId);
    }
    mapTransakcijaGreska(e);
  }
  const rez = await dovrsiVerifikaciju(fazaJedan);
  try {
    await obavesti(metaId, {
      tip: "POTVRDA_CLANA",
      kljuc: "notifikacije.potvrda_sa_spiska_povezanih",
      parametri: { verifikator: rez.verifikatorPseudonim },
      naslov: "Postao si član Kola",
      tekst:
        `„${rez.verifikatorPseudonim}" te je potvrdio sa spiska povezanih, pa si od člana bez potvrde postao član Kola. ` +
        `Na stranici Potvrde imaš i ti spisak povezanih: potvrdi sa njega samo one koje lično znaš. ` +
        `Pripadnost Kolu nije članstvo u Fondaciji. Ako ne poznaješ ovu osobu, prijavi to na stranici Potvrde.`,
      link: "/verifikacija",
    });
  } catch {
    /* obaveštenje ne obara potvrdu */
  }
  return rez;
}

/** Najkraće obrazloženje odluke Fondacije o potvrdi člana bez potvrde. */
export const MIN_OBRAZLOZENJE_FONDACIJE = 10;

/**
 * Potvrda člana bez potvrde odlukom Fondacije (dokaz stvarnosti čl. 5 st. 1 t. 4;
 * Pravilnik čl. 28 st. 3). Fondacija potvrđuje po sopstvenoj odluci, uz obrazloženje;
 * merila posebnom odlukom ne postoje (brisana u setu 4.9.0). Radnju sme samo superadmin,
 * a obrazloženje je obavezno.
 *
 * Nije nova verifikacija i ne nosi POEN; ne ulazi u dnevni tempo i ne podleže nadzoru
 * (čl. 22 st. 2) — trag ide u audit. Potvrđeni dobija spisak povezanih.
 */
export async function potvrdiClanaOdlukomFondacije(
  adminId: string,
  userId: string,
  obrazlozenje: string,
): Promise<IzvrsiVerifikacijuRezultat> {
  const tekst = (obrazlozenje ?? "").trim();
  if (tekst.length < MIN_OBRAZLOZENJE_FONDACIJE) {
    throw new VerifikacijaGreska("Obrazloženje odluke je obavezno (najmanje 10 znakova).", 400);
  }
  let fazaJedan: FazaJedan;
  try {
    fazaJedan = await prisma.$transaction(
      async (tx) => {
        const admin = await tx.user.findUnique({ where: { id: adminId }, select: { id: true, pseudonim: true, admin: true } });
        if (!admin || !jeSuperadmin(admin)) {
          throw new VerifikacijaGreska("Ovu odluku upisuje samo superadmin.", 403);
        }
        const clan = await tx.user.findUnique({ where: { id: userId }, select: IZBOR_UCESNIKA });
        if (!clan) throw new VerifikacijaGreska("Član ne postoji.", 404);
        if (statusUcesnika(clan) !== "CLAN_BEZ_POTVRDE") {
          throw new VerifikacijaGreska("Odlukom Fondacije potvrđuje se samo član bez potvrde.", 409);
        }
        const p = await potvrdiClana(tx, {
          potvrdjeniId: clan.id,
          izvor: "FONDACIJA",
          potvrdioId: admin.id,
          davalacStatus: null,
          obrazlozenje: tekst,
        });
        return {
          vrsta: "POTVRDA_CLANA" as const,
          verifikacijaId: p.verifikacijaId,
          potvrdaClanaId: p.potvrdaId,
          verifikatorId: admin.id,
          verifikatorPseudonim: admin.pseudonim,
          verifikovaniId: clan.id,
          verifikovaniPseudonim: clan.pseudonim,
          verifikovaniNoviIndeks: clan.indeksStvarnosti,
          upozorenjeDnevno: null,
          promena: p.promena,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    mapTransakcijaGreska(e);
  }
  const rez = await dovrsiVerifikaciju(fazaJedan);
  await logAdminAkcija(
    adminId,
    "POTVRDA_CLANA_ODLUKOM_FONDACIJE",
    userId,
    `${rez.verifikovaniPseudonim}: ${tekst}`
  );
  try {
    await obavesti(userId, {
      tip: "POTVRDA_CLANA",
      kljuc: "notifikacije.potvrda_clana_bez_potvrde_fondacija",
      naslov: "Postao si član Kola",
      tekst:
        "Fondacija te je potvrdila svojom odlukom, pa si sada član Kola. Možeš da potvrđuješ ljude koje lično znaš. Pripadnost Kolu nije članstvo u Fondaciji.",
      link: "/verifikacija",
    });
  } catch {
    /* obaveštenje ne obara odluku */
  }
  return rez;
}

/**
 * Postavlja/menja/briše oznaku verifikatora za jednu verifikacionu vezu.
 * Sme je menjati ISKLJUČIVO verifikator koji je obavio tu verifikaciju (vlasnik veze).
 * Prazna oznaka briše postojeću (postavlja na null).
 */
export async function postaviOznakuVerifikatora(input: {
  verifikatorId: string;
  verifikacijaId: string;
  oznaka: string;
}): Promise<{ verifikacijaId: string; oznaka: string | null }> {
  const { verifikatorId, verifikacijaId } = input;
  const oznaka = normalizujOznaku(input.oznaka);

  const veza = await prisma.verifikacionaVeza.findUnique({
    where: { id: verifikacijaId },
    select: { verifikatorId: true },
  });
  if (!veza) {
    throw new VerifikacijaGreska("Potvrda ne postoji.", 404);
  }
  if (veza.verifikatorId !== verifikatorId) {
    throw new VerifikacijaGreska(
      "Oznaku može da menja samo član koji je dao potvrdu.",
      403
    );
  }

  await prisma.verifikacionaVeza.update({
    where: { id: verifikacijaId },
    data: { oznakaVerifikatora: oznaka },
  });

  return { verifikacijaId, oznaka };
}

/**
 * Čisti istekle, neiskorišćene tokene starije od 1h.
 * Poziva se iz cron-a (ili pre svakog generate-a kao garbage collection).
 */
export async function ocistiIstekleTokene(): Promise<{ obrisano: number }> {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const rez = await prisma.verifikacijaToken.deleteMany({
    where: { expiresAt: { lt: cutoff } },
  });
  return { obrisano: rez.count };
}
