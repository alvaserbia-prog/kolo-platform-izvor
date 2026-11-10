/**
 * Upis i prijava pokroviteljstva koje priprema Fondacija — servisni sloj (Prisma).
 *
 * Osnov: Pravilnik o pokroviteljstvu i donacijama čl. 16 st. 6, čl. 17 st. 4, čl. 18 st. 2,
 * čl. 19 st. 1, čl. 28 st. 1; Pravilnik o KOLO sistemu čl. 37 st. 2 (set 5.1.2).
 *
 * Tok: na zahtev pokrovitelja superadmin iz dostavljenih podataka priprema upis (i, po
 * želji, prijavu novčanog pokroviteljstva ili pokroviteljstva dobrima i uslugama) za lice iz
 * upisa koje VEĆ IMA nalog → to lice dobija obaveštenje, sa sopstvenog naloga pregleda
 * pripremljeno i daje izjave iz čl. 17 → prihvatanjem nastaju upis i prijava kao da ih je
 * samo podnelo (`upisiPokrovitelja`, `podnesiNovcanuPrijavu`, `podnesiPrijavu`), upis od tada
 * vodi ono, a ugovor potpisuje kodom kao i svaki podnosilac. Odbijanjem se pripremljeno briše.
 *
 * 🔴 Lice koje je pripremilo ne zastupa pokrovitelja, ne prihvata umesto njega i po tom
 * osnovu mu se doprinos ne evidentira: prihvata samo `korisnikId`, a ono ne može biti
 * `pripremioId`. Upis i prijava se ne prave pre prihvatanja.
 *
 * Prihvatanje ide u koracima (upis → odobrenje → prijava) kroz postojeće servise, koji sami
 * otvaraju transakcije i šalju obaveštenja, pa jedna zajednička transakcija nije moguća.
 * Zato priprema pamti dokle je stigla (`upisId`, `odobrenoAt`, `prijavaId`), a `prihvacenoAt`
 * se upisuje tek kad su svi koraci prošli: ponovni klik NASTAVLJA od koraka koji je pao, bez
 * dupliranja. Dva istovremena klika razdvaja `prihvatanjeAt` (zastareva posle 2 minuta).
 *
 * Priprema samo prijave (`postojeciUpisId`): pokrovitelj već ima živ upis, pa se priprema samo
 * prijava; prihvata je lice koje vodi taj upis, upis se ne pravi i ne odobrava ponovo.
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { gdePseudonim } from "@/lib/pseudonim";
import { imeNaloga, ishodUpisa, PORUKA_DRUGO_IME } from "./identitet";
import {
  procitajUpis,
  trebaIzjavaOvlascenjaUpisa,
  ODNOSI_IZ_REGISTRA,
  PORUKA_DOBRA_SAMO_UCESNIK,
} from "@/lib/upis-pokrovitelja-pravila";
import { upisSpremanZaPrijavu } from "@/lib/upis-pokrovitelja-pravila";
import { mestaPredaje, prikazMestaPredaje } from "@/lib/mesta-pravila";
import { upisiPokrovitelja, odobriUpis, vecUpisan, PORUKA_VEC_UPISAN, UpisGreska } from "./upis-pokrovitelja";
import { podnesiNovcanuPrijavu, PrijavaPokroviteljstvaGreska } from "./pokrovitelj";
import { podnesiPrijavu, VaucerGreska } from "./pokroviteljstvo-dobrima";
import { procitajPredmetDobra, proveriDokaze, type VrstaDokaza } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { MINIMUM_PRIJAVE_POKROVITELJSTVA } from "@/lib/donacija-pravila";

export class PripremaGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

/** Odgovor rute na izuzetak iz ovog modula i modula koje poziva. */
export async function odgovorNaGreskuPripreme(e: unknown) {
  const { greska } = await import("@/lib/greska-api");
  if (
    e instanceof PripremaGreska ||
    e instanceof UpisGreska ||
    e instanceof PrijavaPokroviteljstvaGreska ||
    e instanceof VaucerGreska
  )
    return greska(e.message, e.status);
  console.error("[priprema-pokroviteljstva]", e);
  return greska(e instanceof Error ? e.message : "Greška.", 500);
}

/** Polja upisa koja priprema čuva — izjave daje lice pri prihvatanju, ne Fondacija. */
const POLJA_UPISA = [
  "vrsta", "pravniOblik", "odnosPremaDavaocu", "imePrezime", "naziv", "bpg", "pib", "maticniBroj",
  "adresaSedista", "zastupnikFunkcija", "kontaktTelefon", "mapaAdresa", "mapaLat", "mapaLng",
] as const;

export type PrijavaUPripremi =
  | { vrsta: "NOVAC"; vrednostRsd: number }
  | {
      vrsta: "DOBRA";
      /** Polja koja čita `procitajPredmetDobra`, sa dodatnim mestima i tačkama mesta predaje. */
      polja: Record<string, unknown>;
      /** Prvo mesto predaje (naselje iz šifarnika); dodatna su u `polja.dodatnaMestaPredaje`. */
      mestoPredaje: string;
      cenovnici: { nazivFajla: string; contentType: string; sadrzaj: Buffer }[];
    };

/**
 * Priprema (čl. 16 st. 6). `korisnik` je pseudonim ili adresa elektronske pošte naloga lica
 * iz upisa. Proverava se sve što se može proveriti pre prihvatanja: podaci upisa, da
 * pokrovitelj nije već upisan, ime uz nalog, iznos, odnosno predmet i cenovnik, i da lice koje
 * nije u Kolu prijavu dobara podnosi samo kao lice iz registra (čl. 28 st. 1).
 */
export async function pripremiPokroviteljstvo(
  adminId: string,
  ulaz: {
    korisnik: string;
    /** Priprema samo prijave za pokrovitelja koji već ima živ upis (tada se `upis` ne čita). */
    postojeciUpisId?: string | null;
    upis: Record<string, unknown> | null;
    mapaMesto: string | null;
    logoUrl: string | null;
    aprUporedjeno: boolean;
    prijava: PrijavaUPripremi | null;
  },
): Promise<{ id: string }> {
  // Priprema samo prijave: lice je ono koje vodi postojeći upis (čl. 16 st. 6).
  const postojeci = ulaz.postojeciUpisId
    ? await prisma.upisPokrovitelja.findUnique({ where: { id: ulaz.postojeciUpisId } })
    : null;
  if (ulaz.postojeciUpisId && (!postojeci || postojeci.obrisanAt || postojeci.status !== "ODOBREN"))
    throw new PripremaGreska("Postojeći upis nije pronađen ili nije odobren.", 404);
  if (postojeci && !ulaz.prijava) throw new PripremaGreska("Uz postojeći upis priprema se prijava — izaberi novac ili dobra.");

  const unos = ulaz.korisnik.trim();
  if (!postojeci && !unos) throw new PripremaGreska("Izaberi nalog lica iz upisa (pseudonim ili adresa elektronske pošte).");
  const korisnik = await prisma.user.findFirst({
    where: postojeci
      ? { id: postojeci.vlasnikUserId }
      : unos.includes("@")
        ? { email: { equals: unos, mode: "insensitive" } }
        : gdePseudonim(unos.replace(/^@/, "")),
    select: { id: true, email: true, maloletan: true, deaktiviranAt: true, status: true, verified: true },
  });
  if (!korisnik || korisnik.deaktiviranAt || korisnik.status !== "ACTIVE")
    throw new PripremaGreska("Nalog nije pronađen. Lice iz upisa mora prvo samo da otvori nalog.", 404);
  if (korisnik.maloletan) throw new PripremaGreska("Upis pokrovitelja ne vrši maloletni korisnik.", 409);
  // 🔴 Lice koje priprema ne zastupa pokrovitelja i ne prihvata umesto njega (čl. 16 st. 6).
  if (korisnik.id === adminId)
    throw new PripremaGreska("Lice koje priprema upis ne može ga pripremiti za sopstveni nalog.", 409);
  if (!korisnik.email) throw new PripremaGreska("Nalog nema adresu elektronske pošte.", 409);

  let podaciUpisa: Record<string, unknown> | null = null;
  let naziv: string;
  let odnosPremaDavaocu: string | null;
  let vrstaUpisa: "FIRMA" | "GAZDINSTVO";
  if (postojeci) {
    naziv = postojeci.naziv;
    odnosPremaDavaocu = postojeci.odnosPremaDavaocu;
    vrstaUpisa = postojeci.vrsta;
    // Prijava iz postojećeg upisa ide istim pravilom kao kad je lice samo podnosi.
    const spreman = upisSpremanZaPrijavu(postojeci, {
      userId: korisnik.id, vrstaPrijave: ulaz.prijava!.vrsta, naListiZabrane: false, ucesnik: korisnik.verified,
    });
    if (!spreman.ok) throw new PripremaGreska(spreman.razlog, 409);
  } else {
    if (!ulaz.mapaMesto) throw new PripremaGreska("Izaberi mesto iz spiska.");
    podaciUpisa = {};
    for (const k of POLJA_UPISA) if (ulaz.upis?.[k] !== undefined) podaciUpisa[k] = ulaz.upis[k];
    // Provera podataka; izjave se ovde samo pretpostavljaju — daje ih lice pri prihvatanju.
    const r = procitajUpis({
      ...podaciUpisa,
      kontaktEmail: korisnik.email,
      izjavaAdresa: true,
      izjavaOvlascenja: true,
      potvrdaEvidentiranja: true,
    });
    if (!r.ok) throw new PripremaGreska(r.razlog);
    const d = r.podaci;
    if (d.vrsta === "FIRMA" && !ulaz.aprUporedjeno)
      throw new PripremaGreska("Potvrdi da su naziv, matični broj i zastupnik upoređeni sa registrom (APR).");
    if (await vecUpisan(d)) throw new PripremaGreska(PORUKA_VEC_UPISAN, 409);
    if (ishodUpisa(await imeNaloga(korisnik.id), d.imePrezime) === "RAZLIKUJE_SE")
      throw new PripremaGreska(PORUKA_DRUGO_IME, 409);
    naziv = d.naziv;
    odnosPremaDavaocu = d.odnosPremaDavaocu;
    vrstaUpisa = d.vrsta;
  }

  const p = ulaz.prijava;
  let predmet: Prisma.InputJsonValue | undefined;
  if (p?.vrsta === "NOVAC") {
    if (!Number.isFinite(p.vrednostRsd) || p.vrednostRsd < MINIMUM_PRIJAVE_POKROVITELJSTVA)
      throw new PripremaGreska(
        `Najmanji iznos pokroviteljstva je ${MINIMUM_PRIJAVE_POKROVITELJSTVA.toLocaleString("sr-RS")} RSD.`,
      );
  } else if (p?.vrsta === "DOBRA") {
    // Izjave davaoca (čl. 28 st. 3) daje lice pri prihvatanju — ovde se samo pretpostavljaju.
    // Isto pravilo kao u prijavi koju lice samo podnosi: hrana, više mesta i tačke mesta.
    const { izjavaPropisi: _ip, izjavaPodataka: _ipd, ...polja } = p.polja;
    void _ip; void _ipd;
    const provera = procitajPredmetDobra({ ...polja, mesto: p.mestoPredaje, izjavaPropisi: true, izjavaPodataka: true });
    if (!provera.ok) throw new PripremaGreska(provera.razlog);
    const dokaz = proveriDokaze(
      p.cenovnici.map((c) => ({ vrsta: "CENOVNIK" as VrstaDokaza, tip: c.contentType, velicina: c.sadrzaj.length })),
    );
    if (!dokaz.ok) throw new PripremaGreska(dokaz.razlog);
    // Čl. 28 st. 1: lice koje nije u Kolu — samo kao zakonski zastupnik, preduzetnik ili nosilac gazdinstva.
    if (!korisnik.verified && !ODNOSI_IZ_REGISTRA.includes(odnosPremaDavaocu as (typeof ODNOSI_IZ_REGISTRA)[number]))
      throw new PripremaGreska(PORUKA_DOBRA_SAMO_UCESNIK, 409);
    predmet = polja as Prisma.InputJsonValue;
  }

  const priprema = await prisma.pripremaPokroviteljstva.create({
    data: {
      korisnikId: korisnik.id,
      pripremioId: adminId,
      postojeciUpisId: postojeci?.id ?? null,
      upisPodaci: podaciUpisa ? (podaciUpisa as Prisma.InputJsonValue) : undefined,
      mapaMesto: postojeci ? null : ulaz.mapaMesto,
      logoUrl: postojeci ? null : ulaz.logoUrl,
      aprUporedjenAt: !postojeci && vrstaUpisa === "FIRMA" ? new Date() : null,
      vrstaPrijave: p?.vrsta ?? null,
      vrednostRsd: p?.vrsta === "NOVAC" ? p.vrednostRsd : null,
      predmetDobra: predmet,
      mestoPredaje: p?.vrsta === "DOBRA" ? p.mestoPredaje : null,
      cenovnici:
        p?.vrsta === "DOBRA"
          ? {
              create: p.cenovnici.map((c) => ({
                nazivFajla: c.nazivFajla.slice(0, 200),
                contentType: c.contentType,
                velicina: c.sadrzaj.length,
                sadrzaj: new Uint8Array(c.sadrzaj),
              })),
            }
          : undefined,
    },
    select: { id: true },
  });
  await logAdminAkcija(
    adminId,
    "POKROVITELJSTVO_PRIPREMLJENO",
    priprema.id,
    `pokrovitelj „${naziv}”${postojeci ? " (postojeći upis)" : ""}, prijava: ${p?.vrsta ?? "bez prijave"}; čeka prihvatanje lica iz upisa`,
  );
  await obavesti(korisnik.id, {
    tip: "upis_pokrovitelja",
    kljuc: "notifikacije.pokroviteljstvo_pripremljeno",
    parametri: { naziv },
    naslov: "Fondacija je pripremila upis pokrovitelja",
    tekst: `Na zahtev pokrovitelja Fondacija je pripremila upis „${naziv}”. Pregledaj ga i, ako je tačan, prihvati sa svog naloga.`,
    link: `/postani-pokrovitelj/priprema/${priprema.id}`,
  });
  return priprema;
}

/** Prihvatanje koje je počelo pre ovoliko vremena smatra se prekinutim (pad servera, zatvoren pretraživač). */
const ZASTARELO_PRIHVATANJE_MS = 2 * 60 * 1000;

/** Naziv pokrovitelja iz pripreme — iz podataka upisa, odnosno iz postojećeg upisa. */
function nazivPripreme(r: { upisPodaci: unknown; postojeciUpis?: { naziv: string } | null }): string {
  if (r.postojeciUpis) return r.postojeciUpis.naziv;
  return String(((r.upisPodaci ?? {}) as Record<string, unknown>).naziv ?? "");
}

/** Pripremljeno koje lice još nije prihvatilo (ili je prihvatanje stalo na pola) — samo njegovo. */
export async function pripremeKorisnika(userId: string) {
  const redovi = await prisma.pripremaPokroviteljstva.findMany({
    where: { korisnikId: userId, prihvacenoAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, upisPodaci: true, postojeciUpisId: true, vrstaPrijave: true, createdAt: true },
  });
  const postojeci = await nazivePostojecih(redovi.map((r) => r.postojeciUpisId));
  return redovi.map((r) => ({
    id: r.id,
    naziv: nazivPripreme({ upisPodaci: r.upisPodaci, postojeciUpis: r.postojeciUpisId ? postojeci.get(r.postojeciUpisId) : null }),
    vrstaPrijave: r.vrstaPrijave,
    createdAt: r.createdAt.toISOString(),
  }));
}

async function nazivePostojecih(ids: (string | null)[]) {
  const sviId = ids.filter((x): x is string => !!x);
  const upisi = sviId.length
    ? await prisma.upisPokrovitelja.findMany({ where: { id: { in: sviId } }, select: { id: true, naziv: true } })
    : [];
  return new Map(upisi.map((u) => [u.id, { naziv: u.naziv }]));
}

/** Pripremljeno za pregled lica iz upisa (bez fotografija cenovnika — samo broj). */
export async function pripremaZaKorisnika(id: string, userId: string) {
  const r = await prisma.pripremaPokroviteljstva.findUnique({
    where: { id },
    include: { _count: { select: { cenovnici: true } } },
  });
  if (!r || r.korisnikId !== userId || r.prihvacenoAt) return null;
  // Priprema samo prijave: prikazuju se podaci postojećeg upisa koji lice vodi.
  let u: Record<string, unknown> = (r.upisPodaci as Record<string, unknown> | null) ?? {};
  let mapaMesto = r.mapaMesto;
  let logoUrl = r.logoUrl;
  if (r.postojeciUpisId) {
    const up = await prisma.upisPokrovitelja.findUnique({ where: { id: r.postojeciUpisId } });
    if (!up) return null;
    u = {
      vrsta: up.vrsta, pravniOblik: up.pravniOblik, odnosPremaDavaocu: up.odnosPremaDavaocu, imePrezime: up.imePrezime,
      naziv: up.naziv, bpg: up.bpg, pib: up.pib, maticniBroj: up.maticniBroj, adresaSedista: up.adresaSedista,
      zastupnikFunkcija: up.zastupnikFunkcija, kontaktTelefon: up.kontaktTelefon, mapaAdresa: up.mapaAdresa,
    };
    mapaMesto = up.mapaMesto;
    logoUrl = up.logoUrl;
  }
  const predmet = (r.predmetDobra as Record<string, unknown> | null) ?? null;
  const dodatna = Array.isArray(predmet?.dodatnaMestaPredaje)
    ? (predmet.dodatnaMestaPredaje as { mesto?: unknown; adresa?: unknown }[])
    : [];
  const mesta = r.mestoPredaje
    ? mestaPredaje({
        mesto: r.mestoPredaje,
        adresaPredaje: typeof predmet?.adresaPredaje === "string" ? predmet.adresaPredaje : null,
        dodatnaMestaPredaje: dodatna.map((m) => String(m?.mesto ?? "")),
        dodatneAdresePredaje: dodatna.map((m) => String(m?.adresa ?? "")),
      }).map(prikazMestaPredaje)
    : [];
  return {
    id: r.id,
    /** Priprema samo prijave iz postojećeg upisa — izjave upisa su već date. */
    samoPrijava: !!r.postojeciUpisId,
    /** Upis je već nastao u ranijem, prekinutom prihvatanju — izjave upisa su date. */
    upisNastao: !!r.upisId,
    upis: u,
    mapaMesto,
    logoUrl,
    vrstaPrijave: r.vrstaPrijave as "NOVAC" | "DOBRA" | null,
    vrednostRsd: r.vrednostRsd == null ? null : Number(r.vrednostRsd),
    predmetDobra: predmet,
    mestoPredaje: r.mestoPredaje,
    mestaPredaje: mesta,
    brojCenovnika: r._count.cenovnici,
    trebaIzjavaOvlascenja: !r.postojeciUpisId && trebaIzjavaOvlascenjaUpisa(u),
    jeHrana: !!predmet && ["true", "on", "1", true].includes(predmet.jeHrana as string),
  };
}

/**
 * Upis koji je nastao u prekinutom prihvatanju, a čiji id priprema nije stigla da zapamti:
 * živ upis istog pokrovitelja (MB, PIB, odnosno BPG) koji vodi isto lice, nastao posle pripreme.
 */
async function upisIzPrekinutogPrihvatanja(userId: string, podaci: Record<string, unknown>, posle: Date) {
  const ili = (["maticniBroj", "pib", "bpg"] as const)
    .filter((k) => typeof podaci[k] === "string" && podaci[k])
    .map((k) => ({ [k]: String(podaci[k]).replace(/\s/g, "") }));
  if (ili.length === 0) return null;
  return prisma.upisPokrovitelja.findFirst({
    where: { vlasnikUserId: userId, obrisanAt: null, status: { not: "ODBIJEN" }, createdAt: { gte: posle }, OR: ili },
    select: { id: true },
  });
}

/** Prijava iz istog upisa, istog podnosioca, nastala posle pripreme i još neobrađena. */
async function prijavaIzPrekinutogPrihvatanja(vrsta: string | null, userId: string, upisId: string, posle: Date) {
  if (vrsta === "NOVAC") {
    const p = await prisma.pokroviteljPrijava.findFirst({
      where: { upisId, podnosilacId: userId, status: "CEKA_POTPIS", createdAt: { gte: posle } },
      select: { id: true },
    });
    return p?.id ?? null;
  }
  if (vrsta === "DOBRA") {
    const u = await prisma.ugovorDobra.findFirst({
      where: { upisId, podnosilacId: userId, status: { in: ["NA_PREGLEDU", "CEKA_POTPIS"] }, createdAt: { gte: posle } },
      select: { id: true },
    });
    return u?.id ?? null;
  }
  return null;
}

/**
 * Prihvatanje (čl. 16 st. 6, čl. 17 st. 4): lice sa sopstvenog naloga daje izjave iz čl. 17,
 * pa nastaju upis (vodi ga ono) i prijava, kao da ih je samo podnelo. Upis je odobren
 * poređenjem koje je Fondacija izvršila pri pripremi (čl. 18 st. 1). Ugovor zatim potpisuje
 * kodom sa mejla, kao i svaki podnosilac (čl. 20 st. 1, čl. 32 st. 1).
 *
 * Koraci se pamte (`upisId`, `odobrenoAt`, `prijavaId`); kad neki padne, ponovni klik nastavlja
 * od njega, a `prihvacenoAt` se upisuje tek na kraju.
 */
export async function prihvatiPripremu(
  id: string,
  userId: string,
  izjave: {
    izjavaAdresa: unknown;
    izjavaOvlascenja: unknown;
    potvrdaEvidentiranja: unknown;
    /** Izjave davaoca uz prijavu dobara (čl. 28 st. 3). */
    izjavaPropisi?: unknown;
    izjavaPodataka?: unknown;
  },
  potvrdaTekst: string,
): Promise<{ upisId: string; prijavaId: string | null }> {
  const r = await prisma.pripremaPokroviteljstva.findUnique({ where: { id }, include: { cenovnici: true } });
  if (!r || r.korisnikId !== userId) throw new PripremaGreska("Pripremljen upis nije pronađen.", 404);
  if (r.prihvacenoAt) throw new PripremaGreska("Pripremljen upis je već prihvaćen.", 409);
  // 🔴 Ko je pripremio ne prihvata umesto pokrovitelja (čl. 16 st. 6).
  if (r.pripremioId === userId) throw new PripremaGreska("Lice koje je pripremilo upis ne može ga prihvatiti.", 403);
  // Predmet prijave dobara i izjave davaoca (čl. 28 st. 3) proveravaju se PRE nego što nastane upis.
  let predmet: ReturnType<typeof procitajPredmetDobra> | null = null;
  if (r.vrstaPrijave === "DOBRA" && r.predmetDobra && r.mestoPredaje && !r.prijavaId) {
    predmet = procitajPredmetDobra({
      ...(r.predmetDobra as Record<string, unknown>),
      mesto: r.mestoPredaje,
      izjavaPropisi: izjave.izjavaPropisi,
      izjavaPodataka: izjave.izjavaPodataka,
    });
    if (!predmet.ok) throw new PripremaGreska(predmet.razlog);
  }

  // Zaključavanje: dva istovremena klika ne idu kroz korake zajedno. Prekinuto prihvatanje
  // (starije od 2 minuta) se preuzima.
  const sada = new Date();
  const preuzet = await prisma.pripremaPokroviteljstva.updateMany({
    where: {
      id,
      prihvacenoAt: null,
      OR: [{ prihvatanjeAt: null }, { prihvatanjeAt: { lt: new Date(sada.getTime() - ZASTARELO_PRIHVATANJE_MS) } }],
    },
    data: { prihvatanjeAt: sada },
  });
  if (preuzet.count !== 1) throw new PripremaGreska("Prihvatanje je već u toku ili je završeno — osveži stranicu.", 409);

  try {
    // Korak 1 — upis (samo kad se ne priprema prijava iz postojećeg upisa).
    let upisId = r.postojeciUpisId ?? r.upisId;
    if (!upisId) {
      const podaci = (r.upisPodaci ?? {}) as Record<string, unknown>;
      try {
        upisId = (
          await upisiPokrovitelja(
            userId,
            {
              ...podaci,
              izjavaAdresa: izjave.izjavaAdresa,
              izjavaOvlascenja: izjave.izjavaOvlascenja,
              potvrdaEvidentiranja: izjave.potvrdaEvidentiranja,
            },
            { mesto: r.mapaMesto, logoUrl: r.logoUrl, potvrdaTekst },
          )
        ).id;
      } catch (e) {
        // Upis je nastao u prekinutom prihvatanju, a id nije zapamćen — nastavlja se sa njim.
        const zatecen = e instanceof UpisGreska && e.status === 409
          ? await upisIzPrekinutogPrihvatanja(userId, podaci, r.createdAt)
          : null;
        if (!zatecen) throw e;
        upisId = zatecen.id;
      }
      await prisma.pripremaPokroviteljstva.update({ where: { id }, data: { upisId } });
    }

    // Korak 2 — odobrenje: poređenje sa registrom izvršeno je pri pripremi; odobrenje beleži
    // lice koje je pripremilo. Postojeći upis je već odobren.
    if (!r.postojeciUpisId && !r.odobrenoAt) {
      const upis = await prisma.upisPokrovitelja.findUnique({ where: { id: upisId }, select: { status: true } });
      if (upis?.status === "NA_PROVERI") await odobriUpis(upisId, r.pripremioId, { aprUporedjeno: !!r.aprUporedjenAt });
      await prisma.pripremaPokroviteljstva.update({ where: { id }, data: { odobrenoAt: new Date() } });
    }

    // Korak 3 — prijava. Prijava koja je nastala u prekinutom prihvatanju, a id nije zapamćen,
    // preuzima se (inače bi kvota „jedan ugovor u toku" zaustavila nastavak).
    let prijavaId: string | null = r.prijavaId ?? (await prijavaIzPrekinutogPrihvatanja(r.vrstaPrijave, userId, upisId, r.createdAt));
    if (!prijavaId && r.vrstaPrijave === "NOVAC" && r.vrednostRsd != null) {
      prijavaId = (await podnesiNovcanuPrijavu(userId, upisId, Number(r.vrednostRsd))).id;
    } else if (!prijavaId && predmet?.ok && r.mestoPredaje) {
      prijavaId = (
        await podnesiPrijavu(
          userId,
          upisId,
          predmet.podaci,
          r.mestoPredaje,
          r.cenovnici.map((c) => ({
            vrsta: "CENOVNIK" as VrstaDokaza,
            nazivFajla: c.nazivFajla,
            contentType: c.contentType,
            sadrzaj: Buffer.from(c.sadrzaj),
          })),
        )
      ).id;
    }
    if (prijavaId && !r.prijavaId) await prisma.pripremaPokroviteljstva.update({ where: { id }, data: { prijavaId } });

    // Kraj — fotografije su prešle uz prijavu; priprema ostaje kao zapis ko je pripremio.
    await prisma.$transaction([
      prisma.pripremaCenovnik.deleteMany({ where: { pripremaId: id } }),
      prisma.pripremaPokroviteljstva.update({ where: { id }, data: { prihvacenoAt: new Date(), prihvatanjeAt: null } }),
    ]);
    void posaljiAdminAlert("Pripremljen upis pokrovitelja je prihvaćen", `Upis: ${upisId}`);
    return { upisId, prijavaId };
  } catch (e) {
    // Zapamćeni koraci ostaju; otključava se, pa ponovni klik nastavlja od koraka koji je pao.
    await prisma.pripremaPokroviteljstva
      .update({ where: { id }, data: { prihvatanjeAt: null } })
      .catch(() => undefined);
    throw e;
  }
}

/** Odbijanje (čl. 16 st. 6): pripremljeno se briše, sa fotografijama cenovnika. */
export async function odbijPripremu(id: string, userId: string) {
  const r = await prisma.pripremaPokroviteljstva.findUnique({
    where: { id },
    select: { korisnikId: true, prihvacenoAt: true },
  });
  if (!r || r.korisnikId !== userId) throw new PripremaGreska("Pripremljen upis nije pronađen.", 404);
  if (r.prihvacenoAt) throw new PripremaGreska("Pripremljen upis je već prihvaćen.", 409);
  // Kad je upis već nastao u prekinutom prihvatanju, pripremljeno se ne briše — nastavlja se.
  const d = await prisma.pripremaPokroviteljstva.deleteMany({ where: { id, prihvacenoAt: null, upisId: null, prihvatanjeAt: null } });
  if (d.count !== 1) throw new PripremaGreska("Prihvatanje je već počelo — pripremljeno se ne može odbiti.", 409);
  void posaljiAdminAlert("Pripremljen upis pokrovitelja je odbijen", "Lice iz upisa je odbilo pripremljen upis; obrisan je.");
}

/** Pregled za superadmina: pripremljeno koje čeka i prihvaćeno (bez fotografija). */
export async function listaPripremaZaAdmina() {
  const redovi = await prisma.pripremaPokroviteljstva.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, upisPodaci: true, postojeciUpisId: true, vrstaPrijave: true, vrednostRsd: true, createdAt: true,
      prihvacenoAt: true, upisId: true, odobrenoAt: true, prijavaId: true, korisnik: { select: { pseudonim: true } },
    },
  });
  const postojeci = await nazivePostojecih(redovi.map((r) => r.postojeciUpisId));
  return redovi.map((r) => ({
    id: r.id,
    naziv: nazivPripreme({ upisPodaci: r.upisPodaci, postojeciUpis: r.postojeciUpisId ? postojeci.get(r.postojeciUpisId) : null }),
    postojeciUpis: !!r.postojeciUpisId,
    /** Prihvatanje je počelo, a nije završeno (lice treba ponovo da klikne „Prihvati"). */
    zapocetoNedovrseno: !r.prihvacenoAt && (!!r.upisId || !!r.odobrenoAt),
    korisnikPseudonim: r.korisnik.pseudonim,
    vrstaPrijave: r.vrstaPrijave,
    vrednostRsd: r.vrednostRsd == null ? null : Number(r.vrednostRsd),
    createdAt: r.createdAt.toISOString(),
    prihvacenoAt: r.prihvacenoAt?.toISOString() ?? null,
    upisId: r.upisId,
    prijavaId: r.prijavaId,
  }));
}

/** Povlačenje pripreme koju lice još nije prihvatilo (superadmin). */
export async function povuciPripremu(id: string, adminId: string) {
  const d = await prisma.pripremaPokroviteljstva.deleteMany({ where: { id, prihvacenoAt: null, upisId: null, prihvatanjeAt: null } });
  if (d.count !== 1) throw new PripremaGreska("Pripremljen upis nije pronađen ili je prihvatanje već počelo.", 409);
  await logAdminAkcija(adminId, "POKROVITELJSTVO_PRIPREMA_POVUCENA", id, "pripremljeno je obrisano pre prihvatanja");
}
