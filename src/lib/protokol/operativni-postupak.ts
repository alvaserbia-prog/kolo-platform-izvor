import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { gdePseudonim } from "@/lib/pseudonim";
import { jeCuvar, jeVerifikovan, ucitajStatus } from "./status";
import { beogradskiDan } from "./obracunski-dan";
import { generisiIzjavuIzvrsioca } from "@/lib/operativni-izjava";
import { poenPoCelini, proveriCelineZadatka } from "@/lib/operativni-celine-pravila";
import {
  kljucZivePrijave,
  proveriOdlukuOCelinama,
  proveriPrimedbu,
  proveriZadatak,
  proveriZavrsnu,
  radiNaZadatku,
  smeNovuPrijavu,
  smePotvrdjivati,
  sukobInteresa,
  vaziOdZa,
  vazecaVrednost,
  zatvaraSePoZavrsnoj,
  zauzimaMesto,
  MIN_OBRAZLOZENJA,
  PARAMETAR_IZNOS_JEDINICE,
  PARAMETAR_PRAG_ODOBRAVANJA,
  PARAMETRI_UO,
  type LiceKojePotvrdjuje,
} from "@/lib/operativni-pravila";
import {
  najveciDnevniIznos,
  uMaksimumZadruge,
  zapisZamrznut,
} from "@/lib/zadruga-pravila";
import { brojZadrugaraUcesnika, USLOV_ZADRUGARA_UCESNIKA } from "./zadruga";

export * from "@/lib/operativni-pravila";

/**
 * Postupak operativnog doprinosa — Pravilnik o operativnom doprinosu 5.0
 * (Pravilnik o KOLO sistemu čl. 34; zadruge čl. 17).
 *
 * Jedan ulaz za prijavu, odluke lica koje potvrđuje, odustanak, završnu potvrdu,
 * primedbu i zadružni doprinos — i za ekran Potvrde zadataka (čuvari Kola i lice
 * koje UO ovlasti) i za stare admin rute, koje samo prosleđuju ovamo.
 *
 * 🔴 Potvrda NE emituje POEN: potvrđeno izvršenje (APPROVED) ulazi u raspodelu
 * noćnog obračuna (čl. 19, 21, 22; `izvrsiNocnuEmisiju`). Ovde se samo menjaju
 * stanja zapisa.
 */

export class OperativniGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

const tekst = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// ── Parametri UO ─────────────────────────────────────────────────────────────

/** Važeća vrednost parametra koji UO utvrđuje odlukom, ili `null` (nije utvrđen). */
export async function vazeciParametar(kljuc: string, sada: Date = new Date()): Promise<number | null> {
  const odluke = await prisma.odlukaParametra.findMany({ where: { kljuc } });
  return vazecaVrednost(odluke, kljuc, beogradskiDan(sada));
}

/** Istorija odluka po parametru (za ekran Fondacije i javni prikaz). */
export async function istorijaParametra(kljuc: string) {
  return prisma.odlukaParametra.findMany({
    where: { kljuc },
    orderBy: [{ vaziOd: "desc" }, { createdAt: "desc" }],
    select: { id: true, vrednost: true, vaziOd: true, odluka: true, createdAt: true },
  });
}

/**
 * Upis odluke UO o parametru (samo superadmin; UO odlučuje van platforme, operativa
 * upisuje — CLAUDE.md, „Ko je ko"). Istorija se ne prepravlja: izmena je nov red.
 */
export async function upisiParametar(superadminId: string, p: { kljuc: unknown; vrednost: unknown; odluka: unknown }) {
  if (typeof p.kljuc !== "string" || !(PARAMETRI_UO as readonly string[]).includes(p.kljuc))
    throw new OperativniGreska("Nepoznat parametar.");
  const v = Number(p.vrednost);
  if (!Number.isInteger(v) || v < 1) throw new OperativniGreska("Vrednost je ceo broj POEN-a veći od nule.");
  const odluka = tekst(p.odluka);
  if (odluka.length < 5) throw new OperativniGreska("Navedi odluku Upravnog odbora (broj i datum).");
  const vaziOd = vaziOdZa(p.kljuc, beogradskiDan());
  const red = await prisma.odlukaParametra.create({
    data: { kljuc: p.kljuc, vrednost: v, vaziOd, odluka, upisaoId: superadminId },
  });
  await logAdminAkcija(superadminId, "OPERATIVNI_PARAMETAR", red.id, `${p.kljuc}=${v} od ${vaziOd.toISOString().slice(0, 10)} (${odluka})`);
  return red;
}

// ── Lice koje potvrđuje (čl. 13) ─────────────────────────────────────────────

/** Čuvar Kola i/ili živo ovlašćenje UO. */
export async function ucitajLicePotvrde(userId: string): Promise<LiceKojePotvrdjuje> {
  const [status, ovl] = await Promise.all([
    ucitajStatus(userId),
    prisma.operativnoOvlascenje.findUnique({ where: { userId }, select: { izuzetakPredlagaca: true, opozvanoAt: true } }),
  ]);
  return {
    id: userId,
    jeCuvar: status != null && jeCuvar(status),
    ovlascenje: ovl && !ovl.opozvanoAt ? { izuzetakPredlagaca: ovl.izuzetakPredlagaca } : null,
  };
}

/** Da li korisnik uopšte ima ulaz na ekran Potvrde zadataka. */
export async function imaUlazZaPotvrde(userId: string): Promise<boolean> {
  return smePotvrdjivati(await ucitajLicePotvrde(userId));
}

type OglasZaSukob = { createdById: string; source: string; zadruzni: boolean; krugId: string | null; obustavljenoAt: Date | null };

/** Baca grešku ako lice ne sme da odlučuje u ovom predmetu (čl. 13, 18 st. 2, 23 st. 5). */
async function proveriLice(lice: LiceKojePotvrdjuje, oglas: OglasZaSukob, izvrsilacId: string, dodelioId: string | null) {
  if (!smePotvrdjivati(lice, oglas.zadruzni)) {
    throw new OperativniGreska(
      oglas.zadruzni
        ? "Izvršenje zadružnog doprinosa potvrđuje samo čuvar Kola (čl. 23 st. 5)."
        : "Odlučuju čuvari Kola i lice koje Upravni odbor ovlasti (čl. 13 st. 1).",
      403,
    );
  }
  let radiUImeZadruge = false;
  if (oglas.zadruzni && oglas.krugId) {
    const u = await prisma.user.findUnique({ where: { id: lice.id }, select: { adminZadrugaId: true } });
    radiUImeZadruge = u?.adminZadrugaId === oglas.krugId;
  }
  const razlog = sukobInteresa({
    licaId: lice.id,
    izvrsilacId,
    predlagacId: oglas.createdById,
    izvorFondacija: oglas.source === "FONDACIJA",
    izuzetakPredlagaca: lice.ovlascenje?.izuzetakPredlagaca ?? false,
    zadruzni: oglas.zadruzni,
    dodelioId,
    radiUImeZadruge,
  });
  if (razlog) throw new OperativniGreska(razlog, 403);
}

function proveriObustavu(oglas: { obustavljenoAt: Date | null }) {
  if (oglas.obustavljenoAt)
    throw new OperativniGreska("Potvrda po ovom zadatku je obustavljena odlukom Upravnog odbora dok se ne odluči o primedbi (čl. 18 st. 2).", 409);
}

// ── Objava zadatka (čl. 4–6, 12) ─────────────────────────────────────────────

export type UnosObjave = {
  title: unknown;
  description: unknown;
  poenPoCelini: unknown;
  brojCelina: unknown;
  opisCeline: unknown;
  procenaObima: unknown;
  obrazlozenje: unknown;
  saOdobravanjem?: unknown;
  positions?: unknown;
  deadline: unknown;
  rokIzvrsenja: unknown;
  kvalifikacioniUslov?: unknown;
  kvalifikacioniObrazlozenje?: unknown;
};

/**
 * Provera svih elemenata zadatka iz čl. 5 (celine i ostalo). Prag za režim
 * odobravanja (čl. 12 st. 1 t. 3) primenjuje se samo kad ga je UO utvrdio.
 */
export async function proveriObjavu(u: UnosObjave) {
  const title = tekst(u.title);
  const description = tekst(u.description);
  if (!title || !description) throw new OperativniGreska("Naziv i opis su obavezni.");
  const { poenPoCelini: po, brojCelina, opisCeline, procenaObima } = u;
  const celine = proveriCelineZadatka({ poenPoCelini: po, brojCelina, opisCeline, procenaObima });
  if (!celine.ok) throw new OperativniGreska(celine.greska);
  const ostalo = proveriZadatak(u);
  if (!ostalo.ok) throw new OperativniGreska(ostalo.greska);
  const brMesta = Number(u.positions ?? 1);
  if (!Number.isInteger(brMesta) || brMesta < 1 || brMesta > 1000)
    throw new OperativniGreska("Broj izvršilaca mora biti između 1 i 1000.");
  const prag = await vazeciParametar(PARAMETAR_PRAG_ODOBRAVANJA);
  const poPragu = prag != null && celine.predlozeniPoen > prag;
  return {
    title,
    description,
    celine,
    ostalo,
    positions: brMesta,
    saOdobravanjem: Boolean(u.saOdobravanjem) || poPragu,
  };
}

// ── Prijava (čl. 9–12) ───────────────────────────────────────────────────────

/**
 * Prijava učesnika. Bez odobravanja prijem je automatski (čl. 11 st. 1); sa
 * odobravanjem čeka izričito odobrenje plana (čl. 12 st. 3). Posle odbijanja ili
 * odustanka podnosi se nova (izmenjena) prijava — stara ostaje u istoriji sa svojim
 * obrazloženjem (čl. 12 st. 4, 25 st. 2 t. 3).
 */
export async function podnesiPrijavu(
  userId: string,
  oglasId: string,
  p: { planIzvrsenja: unknown; izjavaPotvrdjena: unknown; ispunjenostUslova?: unknown },
) {
  const status = await ucitajStatus(userId);
  if (!status || !jeVerifikovan(status)) throw new OperativniGreska("Za izvršenje zadatka prijavljuje se učesnik (čl. 9 st. 1–2).", 403);
  const plan = tekst(p.planIzvrsenja);
  if (plan.length < 10) throw new OperativniGreska("Plan izvršenja je obavezan (najmanje 10 znakova).");
  if (p.izjavaPotvrdjena !== true) throw new OperativniGreska("Potrebna je potvrda izjave o pravnoj prirodi operativnog doprinosa.");

  const oglas = await prisma.doprinosOglas.findUnique({ where: { id: oglasId } });
  if (!oglas) throw new OperativniGreska("Zadatak nije pronađen.", 404);
  if (oglas.zadruzni) throw new OperativniGreska("Izvršioca zadružnog doprinosa određuje zadruga; prijava se ne podnosi (čl. 23 st. 2).", 400);
  if (oglas.status !== "ACTIVE") throw new OperativniGreska("Zadatak više nije otvoren.");
  if (oglas.deadline && new Date() > oglas.deadline) throw new OperativniGreska("Rok za prijavu je istekao.");
  const ispunjenost = tekst(p.ispunjenostUslova);
  if (oglas.kvalifikacioniUslov && ispunjenost.length < MIN_OBRAZLOZENJA)
    throw new OperativniGreska("Navedi kako ispunjavaš uslov zadatka (čl. 9 st. 3).");

  const izjavaTekst = generisiIzjavuIzvrsioca({ nazivZadatka: oglas.title, predlozeniPoen: oglas.predlozeniPoen });
  const autoPrijem = !oglas.saOdobravanjem;

  try {
    await prisma.$transaction(
      async (tx) => {
        const ranije = await tx.oglasPrijava.findMany({
          where: { oglasId, userId },
          select: { status: true, odustaoAt: true, zavrsnaOdluka: true },
        });
        if (!smeNovuPrijavu(ranije)) throw new OperativniGreska("Već imaš prijavu za ovaj zadatak.", 409);
        const sve = await tx.oglasPrijava.findMany({ where: { oglasId }, select: { status: true, odustaoAt: true } });
        // Čl. 11 st. 2 — prima se do broja izvršilaca; kasnije prijave se odbijaju.
        if (sve.filter(zauzimaMesto).length >= oglas.positions) throw new OperativniGreska("Sva mesta za izvršioce su popunjena.");
        await tx.oglasPrijava.create({
          data: {
            oglasId,
            userId,
            planIzvrsenja: plan,
            izjavaTekst,
            izjavaAt: new Date(),
            ispunjenostUslova: oglas.kvalifikacioniUslov ? ispunjenost : null,
            status: autoPrijem ? "APPROVED" : "PENDING",
            approvedAt: autoPrijem ? new Date() : null,
            aktivanKljuc: kljucZivePrijave(oglasId, userId),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.code === "P2034"))
      throw new OperativniGreska("Prijava je upravo podneta; osveži stranicu.", 409);
    throw e;
  }
  return { primljen: autoPrijem, naslov: oglas.title };
}

/** Odluka o prijavi u zadatku sa odobravanjem (čl. 12 st. 3–5). Odbijanje se obrazlaže. */
export async function odluciOPrijavi(liceId: string, prijavaId: string, p: { odobri: boolean; razlog?: unknown }) {
  const prijava = await prisma.oglasPrijava.findUnique({ where: { id: prijavaId }, include: { oglas: true } });
  if (!prijava) throw new OperativniGreska("Prijava nije pronađena.", 404);
  if (prijava.status !== "PENDING") throw new OperativniGreska("Prijava nije na čekanju.");
  const lice = await ucitajLicePotvrde(liceId);
  await proveriLice(lice, prijava.oglas, prijava.userId, prijava.dodelioId);
  const razlog = tekst(p.razlog);

  if (!p.odobri) {
    if (razlog.length < MIN_OBRAZLOZENJA) throw new OperativniGreska("Odbijanje mora biti obrazloženo (čl. 12 st. 4).");
    await prisma.oglasPrijava.update({
      where: { id: prijavaId },
      data: { status: "REJECTED", rejectionReason: razlog, approvedById: liceId, approvedAt: new Date(), aktivanKljuc: null },
    });
    await logAdminAkcija(liceId, "DOPRINOS_PRIJAVA_ODBIJENA", prijava.userId, `${prijava.oglas.title}: ${razlog}`);
    await obavesti(prijava.userId, {
      tip: "info",
      kljuc: "notifikacije.prijava_zadatak_odbijena_razlog",
      parametri: { zadatak: prijava.oglas.title, razlog },
      naslov: "Prijava za zadatak odbijena",
      tekst: `Tvoja prijava za zadatak „${prijava.oglas.title}" je odbijena. Razlog: ${razlog}`,
      link: `/doprinos-oglasi/${prijava.oglasId}`,
    });
    return;
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const sve = await tx.oglasPrijava.findMany({ where: { oglasId: prijava.oglasId }, select: { status: true, odustaoAt: true } });
        if (sve.filter(zauzimaMesto).length >= prijava.oglas.positions)
          throw new OperativniGreska(`Zadatak je popunjen — sva mesta su zauzeta (${prijava.oglas.positions}).`);
        await tx.oglasPrijava.update({
          where: { id: prijavaId },
          data: { status: "APPROVED", approvedById: liceId, approvedAt: new Date(), rejectionReason: razlog || null },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034")
      throw new OperativniGreska("Odluka se upravo upisuje na drugom mestu; pokušaj ponovo.", 409);
    throw e;
  }
  await logAdminAkcija(liceId, "DOPRINOS_PRIJAVA_ODOBRENA", prijava.userId, prijava.oglas.title);
  await obavesti(prijava.userId, {
    tip: "info",
    kljuc: "notifikacije.prijava_zadatak_prihvacena",
    parametri: { zadatak: prijava.oglas.title },
    naslov: "Prijava za zadatak prihvaćena!",
    tekst: `Tvoja prijava za zadatak „${prijava.oglas.title}" je prihvaćena. Možeš da počneš sa evidencijom izvršenja.`,
    link: `/doprinos-oglasi/${prijava.oglasId}`,
  });
}

/** Živa primljena prijava izvršioca na zadatku (čl. 11), ili `null`. */
export async function zivaPrijava(oglasId: string, userId: string) {
  return prisma.oglasPrijava.findUnique({ where: { aktivanKljuc: kljucZivePrijave(oglasId, userId) } });
}

// ── Izvršenje celina (čl. 15) ────────────────────────────────────────────────

/**
 * Izjašnjavanje o izvršenju celina: potvrda, odbijanje uz obrazloženje, ili uslovna
 * potvrda uz traženu dopunu (čl. 15 st. 2). Kod zadružnog doprinosa potvrda poštuje
 * najveći dnevni iznos zadruge — višak ne ulazi u raspodelu (zadruge čl. 17 st. 3–4).
 */
export async function odluciOCelinama(liceId: string, evidencijaId: string, p: { odluka: unknown; obrazlozenje?: unknown }) {
  const odl = proveriOdlukuOCelinama(p.odluka, p.obrazlozenje);
  if (!odl.ok) throw new OperativniGreska(odl.greska);
  const ev = await prisma.oglasEvidencija.findUnique({
    where: { id: evidencijaId },
    include: { oglas: true, prijava: { select: { dodelioId: true } } },
  });
  if (!ev) throw new OperativniGreska("Izvršenje nije pronađeno.", 404);
  if (ev.status !== "PENDING") throw new OperativniGreska("Izvršenje nije na čekanju.");
  const lice = await ucitajLicePotvrde(liceId);
  await proveriLice(lice, ev.oglas, ev.userId, ev.prijava.dodelioId);
  proveriObustavu(ev.oglas);
  const sada = new Date();

  if (odl.odluka === "ODBIJ" || odl.odluka === "DOPUNA") {
    await prisma.oglasEvidencija.update({
      where: { id: evidencijaId },
      data: {
        status: odl.odluka === "ODBIJ" ? "REJECTED" : "DOPUNA",
        approvedById: liceId,
        approvedAt: sada,
        odlukaObrazlozenje: odl.obrazlozenje,
      },
    });
    await logAdminAkcija(liceId, odl.odluka === "ODBIJ" ? "DOPRINOS_EVIDENCIJA_ODBIJENA" : "DOPRINOS_EVIDENCIJA_DOPUNA", ev.userId, `${ev.oglas.title}: ${odl.obrazlozenje}`);
    await obavesti(ev.userId, {
      tip: "info",
      kljuc: odl.odluka === "ODBIJ" ? "notifikacije.izvrsenje_odbijeno_razlog" : "notifikacije.izvrsenje_dopuna",
      parametri: { zadatak: ev.oglas.title, razlog: odl.obrazlozenje ?? "" },
      naslov: odl.odluka === "ODBIJ" ? "Izvršenje odbijeno" : "Traži se dopuna dokaza",
      tekst:
        odl.odluka === "ODBIJ"
          ? `Izvršenje celina na zadatku „${ev.oglas.title}" je odbijeno. Razlog: ${odl.obrazlozenje}`
          : `Za izvršenje celina na zadatku „${ev.oglas.title}" traži se dopuna dokaza: ${odl.obrazlozenje}`,
      link: `/doprinos-oglasi/${ev.oglasId}`,
    });
    return { status: odl.odluka === "ODBIJ" ? "REJECTED" : "DOPUNA", predlozeniPoen: ev.predlozeniPoen };
  }

  // Potvrda. Zadružni doprinos: višak iznad dnevnog maksimuma zadruge ne ulazi u raspodelu.
  let uRaspodeli = ev.predlozeniPoen;
  let visak: number | null = null;
  if (ev.oglas.zadruzni) {
    const z = ev.oglas.krugId ? await prisma.krug.findUnique({ where: { id: ev.oglas.krugId } }) : null;
    if (!z || z.prestanakAt) throw new OperativniGreska("Učešće zadruge je prestalo.", 409);
    if (zapisZamrznut(z)) throw new OperativniGreska("Od otkaza ugovora, odnosno pokretanja brisanja zadruge, zadružni doprinos se ne evidentira (zadruge čl. 22 st. 2).", 409);
    const najveci = najveciDnevniIznos(await brojZadrugaraUcesnika(z.id), await vazeciParametar(PARAMETAR_IZNOS_JEDINICE, sada));
    if (najveci == null) throw new OperativniGreska("Iznos jedinice zadružnog doprinosa još nije utvrđen odlukom Upravnog odbora.", 409);
    await prisma.$transaction(
      async (tx) => {
        // Potvrđeno, a još neobračunato u ovom periodu (noćni obračun ih prebacuje u EMITTED).
        const vec = await tx.oglasEvidencija.aggregate({
          where: { status: "APPROVED", oglas: { zadruzni: true, krugId: z.id } },
          _sum: { predlozeniPoen: true },
        });
        const r = uMaksimumZadruge(ev.predlozeniPoen, najveci, vec._sum.predlozeniPoen ?? 0);
        uRaspodeli = r.uRaspodeli;
        visak = r.visak > 0 ? r.visak : null;
        await tx.oglasEvidencija.update({
          where: { id: evidencijaId },
          data: { status: "APPROVED", approvedById: liceId, approvedAt: sada, predlozeniPoen: r.uRaspodeli, visakZadruge: visak },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } else {
    await prisma.oglasEvidencija.update({
      where: { id: evidencijaId },
      data: { status: "APPROVED", approvedById: liceId, approvedAt: sada },
    });
  }
  await logAdminAkcija(liceId, "DOPRINOS_EVIDENCIJA_ODOBRENA", ev.userId, `${ev.oglas.title} (predloženo ${uRaspodeli} POEN${visak ? `, višak ${visak}` : ""})`);
  await obavesti(ev.userId, {
    tip: "info",
    kljuc: "notifikacije.izvrsenje_potvrdjeno",
    parametri: { zadatak: ev.oglas.title, poen: uRaspodeli },
    naslov: "Izvršenje potvrđeno",
    tekst: `Tvoje izvršenje za „${ev.oglas.title}" je potvrđeno (predloženi POEN: ${uRaspodeli.toLocaleString("sr-RS")}). Evidentirani POEN se obračunava na kraju obračunskog perioda srazmerno dnevnom limitu.`,
    link: `/doprinos-oglasi/${ev.oglasId}`,
  });
  return { status: "APPROVED", predlozeniPoen: uRaspodeli, visak };
}

/** Dopuna dokaza posle uslovne potvrde (čl. 15 st. 2 t. 3): zapis se vraća na izjašnjavanje. */
export async function dopuniDokaz(userId: string, evidencijaId: string, p: { dokaz: string | null; description?: unknown }) {
  const ev = await prisma.oglasEvidencija.findUnique({ where: { id: evidencijaId } });
  if (!ev || ev.userId !== userId) throw new OperativniGreska("Izvršenje nije pronađeno.", 404);
  if (ev.status !== "DOPUNA") throw new OperativniGreska("Za ovo izvršenje se ne traži dopuna.");
  const opis = tekst(p.description);
  if (!p.dokaz && opis.length < 10) throw new OperativniGreska("Priloži dopunu dokaza ili je opiši (najmanje 10 znakova).");
  await prisma.oglasEvidencija.update({
    where: { id: evidencijaId },
    data: {
      status: "PENDING",
      dopunaAt: new Date(),
      ...(p.dokaz ? { dokaz: p.dokaz } : {}),
      ...(opis.length >= 10 ? { description: `${ev.description}\n— Dopuna: ${opis}` } : {}),
    },
  });
}

// ── Odustanak i završetak (čl. 16, 17) ───────────────────────────────────────

/**
 * Odustanak izvršioca (čl. 17): bez obrazloženja i bez posledica osim izostanka
 * evidencije za neizvršeni deo. Potvrđene celine ostaju; nepotvrđene se ne
 * potvrđuju. Zadatak se vraća u status „otvoren" (izvodi se iz prijava).
 */
export async function odustani(userId: string, oglasId: string) {
  const p = await zivaPrijava(oglasId, userId);
  if (!p || p.status === "REJECTED") throw new OperativniGreska("Nemaš živu prijavu na ovom zadatku.", 404);
  if (p.zavrsnaOdluka) throw new OperativniGreska("O izvršenju je već završno odlučeno.");
  const sada = new Date();
  await prisma.$transaction([
    prisma.oglasPrijava.update({ where: { id: p.id }, data: { odustaoAt: sada, aktivanKljuc: null } }),
    prisma.oglasEvidencija.updateMany({
      where: { prijavaId: p.id, status: { in: ["PENDING", "DOPUNA"] } },
      data: { status: "REJECTED", odlukaObrazlozenje: "Odustanak izvršioca (čl. 17): nepotvrđeni deo se ne evidentira." },
    }),
  ]);
}

/** Prijava završetka zadatka (čl. 16 st. 1): od nje teče rok od 7 dana za završnu potvrdu. */
export async function prijaviZavrsetak(userId: string, oglasId: string) {
  const p = await zivaPrijava(oglasId, userId);
  if (!p || p.status !== "APPROVED") throw new OperativniGreska("Nisi primljen izvršilac ovog zadatka.", 403);
  if (p.zavrsetakAt) throw new OperativniGreska("Završetak je već prijavljen.");
  await prisma.oglasPrijava.update({ where: { id: p.id }, data: { zavrsetakAt: new Date() } });
}

/**
 * Završna potvrda (čl. 16 st. 2). Izvršen: celine koje do tada nisu potvrđene ulaze
 * u raspodelu perioda završne potvrde (nepotvrđeni zapisi se potvrđuju, a za celine
 * koje nikad nisu prijavljene nastaje red `zavrsna`). Delimično: isto, za navedeni
 * broj celina. Odbijeno: nepotvrđeni zapisi se odbijaju uz obrazloženje.
 */
export async function zavrsnaPotvrda(liceId: string, prijavaId: string, p: { odluka: unknown; obrazlozenje?: unknown; celine?: unknown }) {
  const prijava = await prisma.oglasPrijava.findUnique({ where: { id: prijavaId }, include: { oglas: true } });
  if (!prijava || prijava.status !== "APPROVED" || prijava.odustaoAt) throw new OperativniGreska("Izvršilac nije pronađen.", 404);
  if (!prijava.zavrsetakAt) throw new OperativniGreska("Izvršilac još nije prijavio završetak (čl. 16 st. 1).");
  if (prijava.zavrsnaOdluka) throw new OperativniGreska("O izvršenju je već završno odlučeno.");
  const lice = await ucitajLicePotvrde(liceId);
  await proveriLice(lice, prijava.oglas, prijava.userId, prijava.dodelioId);
  proveriObustavu(prijava.oglas);
  if (prijava.oglas.zadruzni) {
    // Zadružni doprinos ide samo po potvrđenoj celini sa opisom urađenog posla (zadruge
    // čl. 17 st. 5) — završna potvrda ne dodaje nove celine, samo zatvara izvršenje.
    if (p.odluka !== "ODBIJEN" && p.odluka !== "IZVRSEN") throw new OperativniGreska("Nepoznata odluka.");
  }
  // Celine se broje po izvršiocu na zadatku, i preko ranijih prijava (posle odustanka
  // potvrđene celine ostaju, čl. 17 st. 2 — ne prijavljuju se ponovo).
  const agg = await prisma.oglasEvidencija.aggregate({
    where: { userId: prijava.userId, oglasId: prijava.oglasId, status: { not: "REJECTED" } },
    _sum: { celina: true },
  });
  const z = proveriZavrsnu({
    odluka: p.odluka,
    obrazlozenje: p.obrazlozenje,
    celine: p.celine,
    brojCelina: prijava.oglas.zadruzni ? null : prijava.oglas.brojCelina,
    prijavljeneCeline: agg._sum.celina ?? 0,
  });
  if (!z.ok) throw new OperativniGreska(z.greska);
  const sada = new Date();
  const dan = beogradskiDan(sada);
  const po = prijava.oglas.brojCelina ? poenPoCelini(prijava.oglas.predlozeniPoen, prijava.oglas.brojCelina) : 0;

  await prisma.$transaction(async (tx) => {
    if (z.odluka === "ODBIJEN") {
      await tx.oglasEvidencija.updateMany({
        where: { prijavaId, status: { in: ["PENDING", "DOPUNA"] } },
        data: { status: "REJECTED", approvedById: liceId, approvedAt: sada, odlukaObrazlozenje: z.obrazlozenje },
      });
    } else {
      await tx.oglasEvidencija.updateMany({
        where: { prijavaId, status: { in: ["PENDING", "DOPUNA"] } },
        data: { status: "APPROVED", approvedById: liceId, approvedAt: sada },
      });
      if (z.novihCelina > 0 && po > 0) {
        await tx.oglasEvidencija.create({
          data: {
            userId: prijava.userId,
            oglasId: prijava.oglasId,
            prijavaId,
            date: dan,
            zavrsna: true,
            celina: z.novihCelina,
            predlozeniPoen: z.novihCelina * po,
            description: z.odluka === "IZVRSEN" ? "Završna potvrda — izvršen zadatak (čl. 16 st. 2)" : "Završna potvrda — delimično izvršenje (čl. 16 st. 2)",
            status: "APPROVED",
            approvedById: liceId,
            approvedAt: sada,
          },
        });
      }
    }
    await tx.oglasPrijava.update({
      where: { id: prijavaId },
      data: { zavrsnaOdluka: z.odluka, zavrsnaOdlukaAt: sada, zavrsnaOdlukaById: liceId, zavrsnoObrazlozenje: z.obrazlozenje, aktivanKljuc: null },
    });
    const prijave = await tx.oglasPrijava.findMany({
      where: { oglasId: prijava.oglasId },
      select: { status: true, odustaoAt: true, zavrsnaOdluka: true },
    });
    if (zatvaraSePoZavrsnoj({ pozicija: prijava.oglas.positions, prijave, rokZaPrijavu: prijava.oglas.deadline, sada })) {
      await tx.doprinosOglas.update({ where: { id: prijava.oglasId }, data: { status: "CLOSED" } });
    }
  });
  await logAdminAkcija(liceId, "DOPRINOS_ZAVRSNA_POTVRDA", prijava.userId, `${prijava.oglas.title}: ${z.odluka}${z.novihCelina ? ` (+${z.novihCelina} celina)` : ""}`);
  await obavesti(prijava.userId, {
    tip: "info",
    kljuc: "notifikacije.zavrsna_potvrda",
    parametri: { zadatak: prijava.oglas.title },
    naslov: "Završna odluka o zadatku",
    tekst: `Doneta je završna odluka o tvom izvršenju zadatka „${prijava.oglas.title}". Pogledaj je na stranici zadatka.`,
    link: `/doprinos-oglasi/${prijava.oglasId}`,
  });
}

// ── Primedba (čl. 18) ────────────────────────────────────────────────────────

/** Svaki učesnik, dok zadatak traje, podnosi obrazloženu primedbu; dostupna je svim učesnicima. */
export async function podnesiPrimedbu(
  userId: string,
  oglasId: string,
  p: { predmet: unknown; tekst: unknown; prijavaId?: unknown; evidencijaId?: unknown },
) {
  const status = await ucitajStatus(userId);
  if (!status || !jeVerifikovan(status)) throw new OperativniGreska("Primedbu podnosi učesnik (čl. 18 st. 1).", 403);
  const oglas = await prisma.doprinosOglas.findUnique({ where: { id: oglasId }, select: { id: true, status: true } });
  if (!oglas) throw new OperativniGreska("Zadatak nije pronađen.", 404);
  const r = proveriPrimedbu({ predmet: p.predmet, tekst: p.tekst, zadatakTraje: oglas.status === "ACTIVE" });
  if (!r.ok) throw new OperativniGreska(r.greska);
  const prijavaId = typeof p.prijavaId === "string" && p.prijavaId ? p.prijavaId : null;
  const evidencijaId = typeof p.evidencijaId === "string" && p.evidencijaId ? p.evidencijaId : null;
  if (prijavaId && !(await prisma.oglasPrijava.count({ where: { id: prijavaId, oglasId } })))
    throw new OperativniGreska("Prijava ne pripada ovom zadatku.");
  if (evidencijaId && !(await prisma.oglasEvidencija.count({ where: { id: evidencijaId, oglasId } })))
    throw new OperativniGreska("Izvršenje ne pripada ovom zadatku.");
  await prisma.operativnaPrimedba.create({
    data: { oglasId, autorId: userId, predmet: r.predmet, tekst: r.tekst, prijavaId, evidencijaId },
  });
}

/** Izjašnjavanje lica koje potvrđuje o primedbi (čl. 18 st. 2), u roku od 7 dana. */
export async function odluciOPrimedbi(liceId: string, primedbaId: string, p: { odluka: unknown }) {
  const pr = await prisma.operativnaPrimedba.findUnique({ where: { id: primedbaId }, include: { oglas: true, prijava: { select: { userId: true, dodelioId: true } } } });
  if (!pr) throw new OperativniGreska("Primedba nije pronađena.", 404);
  if (pr.odluka) throw new OperativniGreska("O primedbi je već odlučeno.");
  const odluka = tekst(p.odluka);
  if (odluka.length < MIN_OBRAZLOZENJA) throw new OperativniGreska("Izjašnjenje o primedbi se obrazlaže.");
  const lice = await ucitajLicePotvrde(liceId);
  if (pr.autorId === liceId) throw new OperativniGreska("Ne odlučuješ o sopstvenoj primedbi.", 403);
  await proveriLice(lice, pr.oglas, pr.prijava?.userId ?? "", pr.prijava?.dodelioId ?? null);
  await prisma.operativnaPrimedba.update({ where: { id: primedbaId }, data: { odluka, odlukaAt: new Date(), odlukaById: liceId } });
}

// ── Zadatak: povlačenje, obustava, režim odobravanja (čl. 8, 12 st. 2, 18 st. 2) ──

/**
 * Povlačenje zadatka (čl. 8): pre prve prijave bez obrazloženja; zadatak u
 * izvršenju samo iz opravdanih razloga, koji se obrazlažu javno. Potvrđene celine
 * ostaju u raspodeli.
 */
export async function povuciZadatak(adminId: string, oglasId: string, obrazlozenje: unknown) {
  const oglas = await prisma.doprinosOglas.findUnique({
    where: { id: oglasId },
    include: { prijave: { select: { status: true, odustaoAt: true, zavrsnaOdluka: true } } },
  });
  if (!oglas) throw new OperativniGreska("Zadatak nije pronađen.", 404);
  if (oglas.status !== "ACTIVE") throw new OperativniGreska("Zadatak je već zatvoren ili povučen.");
  const o = tekst(obrazlozenje);
  const uIzvrsenju = oglas.prijave.some(radiNaZadatku);
  if (uIzvrsenju && o.length < MIN_OBRAZLOZENJA)
    throw new OperativniGreska("Zadatak u izvršenju povlači se samo uz javno obrazloženje (čl. 8 st. 2).");
  await prisma.doprinosOglas.update({
    where: { id: oglasId },
    data: { status: "CANCELLED", povucenoAt: new Date(), povucenoObrazlozenje: o || null },
  });
  await logAdminAkcija(adminId, "DOPRINOS_OGLAS_POVUCEN", oglasId, `${oglas.title}${o ? `: ${o}` : ""}`);
}

/** UO prebacuje zadatak u režim odobravanja posle objave, uz obrazloženje (čl. 12 st. 2). */
export async function prebaciUOdobravanje(superadminId: string, oglasId: string, obrazlozenje: unknown) {
  const o = tekst(obrazlozenje);
  if (o.length < MIN_OBRAZLOZENJA) throw new OperativniGreska("Odluka o prebacivanju u režim odobravanja se obrazlaže (čl. 12 st. 2).");
  const oglas = await prisma.doprinosOglas.findUnique({ where: { id: oglasId } });
  if (!oglas || oglas.status !== "ACTIVE") throw new OperativniGreska("Zadatak nije otvoren.", 404);
  if (oglas.saOdobravanjem) throw new OperativniGreska("Zadatak je već sa odobravanjem.");
  await prisma.doprinosOglas.update({ where: { id: oglasId }, data: { saOdobravanjem: true, odobravanjeObrazlozenje: o } });
  await logAdminAkcija(superadminId, "DOPRINOS_OGLAS_ODOBRAVANJE", oglasId, o);
}

/**
 * Obustava dalje potvrde i raspodele dok se ne odluči o primedbi (čl. 18 st. 2,
 * odluka UO). Potvrđeno a još neobračunato vraća se na izjašnjavanje, da ne bi
 * ušlo u raspodelu tokom obustave.
 */
export async function obustaviZadatak(superadminId: string, oglasId: string, obrazlozenje: unknown, ukini = false) {
  const oglas = await prisma.doprinosOglas.findUnique({ where: { id: oglasId } });
  if (!oglas) throw new OperativniGreska("Zadatak nije pronađen.", 404);
  if (ukini) {
    if (!oglas.obustavljenoAt) throw new OperativniGreska("Zadatak nije obustavljen.");
    await prisma.doprinosOglas.update({ where: { id: oglasId }, data: { obustavljenoAt: null } });
    await logAdminAkcija(superadminId, "DOPRINOS_OBUSTAVA_UKINUTA", oglasId, oglas.title);
    return;
  }
  const o = tekst(obrazlozenje);
  if (o.length < MIN_OBRAZLOZENJA) throw new OperativniGreska("Obustava se obrazlaže (čl. 18 st. 2).");
  if (oglas.obustavljenoAt) throw new OperativniGreska("Zadatak je već obustavljen.");
  await prisma.$transaction([
    prisma.doprinosOglas.update({ where: { id: oglasId }, data: { obustavljenoAt: new Date(), obustavaObrazlozenje: o } }),
    prisma.oglasEvidencija.updateMany({ where: { oglasId, status: "APPROVED" }, data: { status: "PENDING" } }),
  ]);
  await logAdminAkcija(superadminId, "DOPRINOS_OBUSTAVA", oglasId, o);
}

// ── Ovlašćenje UO (čl. 13 st. 1, 4) ──────────────────────────────────────────

export async function upisiOvlascenje(superadminId: string, p: { pseudonim: unknown; odluka: unknown; izuzetakPredlagaca?: unknown }) {
  if (typeof p.pseudonim !== "string" || !p.pseudonim.trim()) throw new OperativniGreska("Unesi pseudonim.");
  const odluka = tekst(p.odluka);
  if (odluka.length < 5) throw new OperativniGreska("Navedi odluku Upravnog odbora.");
  const u = await prisma.user.findFirst({ where: gdePseudonim(p.pseudonim.trim()), select: { id: true, maloletan: true } });
  if (!u || u.maloletan) throw new OperativniGreska("Nalog nije pronađen.", 404);
  await prisma.operativnoOvlascenje.upsert({
    where: { userId: u.id },
    create: { userId: u.id, odluka, izuzetakPredlagaca: p.izuzetakPredlagaca === true, upisaoId: superadminId },
    update: { odluka, izuzetakPredlagaca: p.izuzetakPredlagaca === true, upisaoId: superadminId, opozvanoAt: null, createdAt: new Date() },
  });
  await logAdminAkcija(superadminId, "OPERATIVNO_OVLASCENJE", u.id, odluka);
}

export async function opozoviOvlascenje(superadminId: string, userId: string) {
  await prisma.operativnoOvlascenje.updateMany({ where: { userId, opozvanoAt: null }, data: { opozvanoAt: new Date() } });
  await logAdminAkcija(superadminId, "OPERATIVNO_OVLASCENJE_OPOZVANO", userId);
}

// ── Zadružni doprinos (operativni čl. 23; zadruge čl. 17) ─────────────────────

/**
 * Objava celine zadružnog doprinosa — Fondacija u ime zajednice, po predlogu
 * zadruge (čl. 23 st. 2). Predloženi POEN za celinu određuje zadruga (st. 3).
 * 🔴 Dok UO ne utvrdi iznos jedinice, zadružni doprinos se ne objavljuje.
 */
export async function objaviZadruzniZadatak(adminId: string, krugId: string, u: UnosObjave) {
  const z = await prisma.krug.findUnique({ where: { id: krugId } });
  if (!z || !z.zadruga) throw new OperativniGreska("Zadruga ne postoji.", 404);
  if (z.prestanakAt || z.status !== "ACTIVE") throw new OperativniGreska("Učešće zadruge je prestalo.", 409);
  if (zapisZamrznut(z)) throw new OperativniGreska("Od otkaza ugovora, odnosno pokretanja brisanja, zadružni doprinos se ne evidentira (zadruge čl. 22 st. 2).", 409);
  if ((await vazeciParametar(PARAMETAR_IZNOS_JEDINICE)) == null)
    throw new OperativniGreska("Iznos jedinice zadružnog doprinosa još nije utvrđen odlukom Upravnog odbora; zadružni doprinos se ne objavljuje.", 409);
  const o = await proveriObjavu({ ...u, saOdobravanjem: false, kvalifikacioniUslov: null });
  const oglas = await prisma.doprinosOglas.create({
    data: {
      title: o.title,
      description: o.description,
      source: "FONDACIJA",
      zadruzni: true,
      krugId,
      predlozeniPoen: o.celine.predlozeniPoen,
      brojCelina: o.celine.brojCelina,
      opisCeline: o.celine.opisCeline,
      procenaObima: o.celine.procenaObima,
      obrazlozenje: o.ostalo.obrazlozenje,
      saOdobravanjem: false,
      positions: o.positions,
      deadline: o.ostalo.deadline,
      rokIzvrsenja: o.ostalo.rokIzvrsenja,
      createdById: adminId,
    },
  });
  await logAdminAkcija(adminId, "ZADRUZNI_DOPRINOS_OBJAVLJEN", oglas.id, `${z.name}: ${o.title} (${o.celine.brojCelina} × ${o.celine.poenPoCelini} POEN)`);
  return { id: oglas.id };
}

/**
 * Dodela celine izvršiocu — određuje je zadruga, a upisuje lice koje radi u ime
 * zadruge ili administratorski tim (čl. 23 st. 2; zadruge čl. 15, 17 st. 2).
 * Izvršilac je zadrugar te zadruge koji je učesnik. Izvršilac dodelu prihvata
 * izjavom (čl. 24 st. 2 t. 3 — preuzimanje je dobrovoljno).
 */
export async function dodeliCelinu(sprovodilacId: string, krugId: string, oglasId: string, pseudonim: unknown) {
  const oglas = await prisma.doprinosOglas.findUnique({ where: { id: oglasId } });
  if (!oglas || !oglas.zadruzni || oglas.krugId !== krugId) throw new OperativniGreska("Zadatak zadruge nije pronađen.", 404);
  if (oglas.status !== "ACTIVE") throw new OperativniGreska("Zadatak više nije otvoren.");
  const z = await prisma.krug.findUnique({ where: { id: krugId } });
  if (!z || z.prestanakAt || zapisZamrznut(z)) throw new OperativniGreska("Zadruga ne evidentira zadružni doprinos.", 409);
  if (typeof pseudonim !== "string" || !pseudonim.trim()) throw new OperativniGreska("Unesi pseudonim zadrugara.");
  const u = await prisma.user.findFirst({ where: gdePseudonim(pseudonim.trim()), select: { id: true } });
  if (!u) throw new OperativniGreska("Korisnik sa tim pseudonimom ne postoji.", 404);
  const clanstvo = await prisma.krugClanstvo.findFirst({ where: { krugId, userId: u.id, ...USLOV_ZADRUGARA_UCESNIKA } });
  if (!clanstvo) throw new OperativniGreska("Izvršilac je zadrugar ove zadruge koji je učesnik (zadruge čl. 6 st. 1, 7).", 403);
  if (u.id === sprovodilacId) throw new OperativniGreska("Ne dodeljuješ celinu sebi.", 403);
  try {
    await prisma.$transaction(
      async (tx) => {
        const sve = await tx.oglasPrijava.findMany({ where: { oglasId }, select: { status: true, odustaoAt: true } });
        if (sve.filter((x) => x.status === "PENDING" || zauzimaMesto(x)).length >= oglas.positions)
          throw new OperativniGreska("Sva mesta na ovom zadatku su dodeljena.");
        await tx.oglasPrijava.create({
          data: { oglasId, userId: u.id, status: "PENDING", dodelioId: sprovodilacId, aktivanKljuc: kljucZivePrijave(oglasId, u.id) },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.code === "P2034"))
      throw new OperativniGreska("Ovom zadrugaru je celina već dodeljena.", 409);
    throw e;
  }
  await obavesti(u.id, {
    tip: "info",
    kljuc: "notifikacije.zadruzni_dodela",
    parametri: { zadatak: oglas.title, zadruga: z.name },
    naslov: "Zadruga ti je dodelila celinu",
    tekst: `Zadruga ${z.name} ti je dodelila celinu „${oglas.title}". Pogledaj je i prihvati ako želiš da je izvršiš.`,
    link: `/doprinos-oglasi/${oglasId}`,
  });
}

/** Izvršilac prihvata dodeljenu celinu izjavom o pravnoj prirodi (čl. 10 st. 1 t. 3, shodno). */
export async function prihvatiDodelu(userId: string, oglasId: string, p: { izjavaPotvrdjena: unknown; planIzvrsenja?: unknown }) {
  const prijava = await zivaPrijava(oglasId, userId);
  if (!prijava || !prijava.dodelioId || prijava.status !== "PENDING") throw new OperativniGreska("Nemaš dodeljenu celinu na ovom zadatku.", 404);
  if (p.izjavaPotvrdjena !== true) throw new OperativniGreska("Potrebna je potvrda izjave o pravnoj prirodi operativnog doprinosa.");
  const oglas = await prisma.doprinosOglas.findUniqueOrThrow({ where: { id: oglasId } });
  await prisma.oglasPrijava.update({
    where: { id: prijava.id },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      izjavaTekst: generisiIzjavuIzvrsioca({ nazivZadatka: oglas.title, predlozeniPoen: oglas.predlozeniPoen }),
      izjavaAt: new Date(),
      planIzvrsenja: tekst(p.planIzvrsenja) || null,
    },
  });
}

// ── Pregled za lice koje potvrđuje (čl. 13; rokovi čl. 12, 15, 16, 18) ────────

/** Sve što čeka izjašnjavanje, sa pseudonimima (lice koje potvrđuje je učesnik). */
export async function pregledZaPotvrdu() {
  const [prijave, izvrsenja, zavrsne, primedbe] = await Promise.all([
    prisma.oglasPrijava.findMany({
      where: { status: "PENDING", dodelioId: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        planIzvrsenja: true,
        izjavaTekst: true,
        ispunjenostUslova: true,
        createdAt: true,
        user: { select: { pseudonim: true } },
        oglas: { select: { id: true, title: true, predlozeniPoen: true, positions: true, kvalifikacioniUslov: true, zadruzni: true } },
      },
    }),
    prisma.oglasEvidencija.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        date: true,
        predlozeniPoen: true,
        celina: true,
        dokaz: true,
        description: true,
        createdAt: true,
        dopunaAt: true,
        user: { select: { pseudonim: true } },
        oglas: { select: { id: true, title: true, zadruzni: true, obustavljenoAt: true } },
      },
    }),
    prisma.oglasPrijava.findMany({
      where: { status: "APPROVED", odustaoAt: null, zavrsnaOdluka: null, zavrsetakAt: { not: null } },
      orderBy: { zavrsetakAt: "asc" },
      select: {
        id: true,
        zavrsetakAt: true,
        user: { select: { pseudonim: true } },
        oglas: { select: { id: true, title: true, brojCelina: true, zadruzni: true } },
      },
    }),
    prisma.operativnaPrimedba.findMany({
      where: { odluka: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, predmet: true, tekst: true, createdAt: true, oglas: { select: { id: true, title: true } } },
    }),
  ]);
  return { prijave, izvrsenja, zavrsne, primedbe };
}

// ── Dostupnost podataka (čl. 25) ─────────────────────────────────────────────

/**
 * Podaci zadatka koji su dostupni ISKLJUČIVO učesnicima (čl. 25 st. 2): prijave i
 * planovi, pseudonimi izvršilaca i lica koje potvrđuje, odluke sa obrazloženjima,
 * evidentirani POEN po izvršiocu, primedbe i odluke o njima. 🔴 Pozivalac proverava
 * da je posmatrač učesnik; korisnik koji nije u Kolu vidi samo zadatak (st. 1).
 * Lični podaci se ne vraćaju (st. 3) — samo pseudonimi.
 */
export async function podaciZadatkaZaUcesnike(oglasId: string) {
  const [prijave, evidencije, primedbe] = await Promise.all([
    prisma.oglasPrijava.findMany({
      where: { oglasId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        status: true,
        planIzvrsenja: true,
        ispunjenostUslova: true,
        rejectionReason: true,
        approvedById: true,
        approvedAt: true,
        odustaoAt: true,
        zavrsetakAt: true,
        zavrsnaOdluka: true,
        zavrsnaOdlukaAt: true,
        zavrsnaOdlukaById: true,
        zavrsnoObrazlozenje: true,
        dodelioId: true,
        createdAt: true,
        user: { select: { pseudonim: true } },
      },
    }),
    prisma.oglasEvidencija.findMany({
      where: { oglasId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        userId: true,
        date: true,
        celina: true,
        predlozeniPoen: true,
        amount: true,
        status: true,
        odlukaObrazlozenje: true,
        approvedById: true,
        zavrsna: true,
        visakZadruge: true,
      },
    }),
    prisma.operativnaPrimedba.findMany({
      where: { oglasId },
      orderBy: { createdAt: "asc" },
      select: { id: true, predmet: true, tekst: true, odluka: true, odlukaAt: true, odlukaById: true, createdAt: true, prijavaId: true, evidencijaId: true },
    }),
  ]);
  const idLica = new Set<string>();
  for (const p of prijave) {
    if (p.approvedById) idLica.add(p.approvedById);
    if (p.zavrsnaOdlukaById) idLica.add(p.zavrsnaOdlukaById);
  }
  for (const e of evidencije) if (e.approvedById) idLica.add(e.approvedById);
  for (const r of primedbe) if (r.odlukaById) idLica.add(r.odlukaById);
  const lica = idLica.size
    ? await prisma.user.findMany({ where: { id: { in: [...idLica] } }, select: { id: true, pseudonim: true } })
    : [];
  const pseudonimLica = (id: string | null) => (id ? lica.find((l) => l.id === id)?.pseudonim ?? null : null);
  const pseudonimIzvrsioca = new Map(prijave.map((p) => [p.userId, p.user.pseudonim]));
  return {
    prijave: prijave.map((p) => ({
      id: p.id,
      pseudonim: p.user.pseudonim,
      status: p.status,
      planIzvrsenja: p.planIzvrsenja,
      ispunjenostUslova: p.ispunjenostUslova,
      obrazlozenje: p.rejectionReason,
      odlucioPseudonim: pseudonimLica(p.approvedById),
      odustao: p.odustaoAt != null,
      zavrsetakAt: p.zavrsetakAt?.toISOString() ?? null,
      zavrsnaOdluka: p.zavrsnaOdluka,
      zavrsnoObrazlozenje: p.zavrsnoObrazlozenje,
      zavrsnuDaoPseudonim: pseudonimLica(p.zavrsnaOdlukaById),
      dodeljena: p.dodelioId != null,
      createdAt: p.createdAt.toISOString(),
    })),
    izvrsenja: evidencije.map((e) => ({
      id: e.id,
      pseudonim: pseudonimIzvrsioca.get(e.userId) ?? null,
      date: e.date.toISOString(),
      celina: e.celina,
      predlozeniPoen: e.predlozeniPoen,
      evidentirano: e.status === "EMITTED" ? e.amount : null,
      status: e.status,
      obrazlozenje: e.odlukaObrazlozenje,
      odlucioPseudonim: pseudonimLica(e.approvedById),
      zavrsna: e.zavrsna,
      visakZadruge: e.visakZadruge,
    })),
    primedbe: primedbe.map((r) => ({
      id: r.id,
      predmet: r.predmet,
      tekst: r.tekst,
      odluka: r.odluka,
      odlucioPseudonim: pseudonimLica(r.odlukaById),
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

/**
 * Čl. 25 st. 2 t. 6 — tekuća iskorišćenost dnevnog limita i podaci o raspodeli za
 * prethodne periode. Tekući period: limit iz opticaja i predloženi POEN potvrđenih
 * izvršenja koja čekaju obračun; dnevni iznosi programa ulaze tek pri obračunu.
 */
export async function iskoriscenostLimita() {
  const [protokol, potvrdjeno, prethodni] = await Promise.all([
    prisma.wallet.findUnique({ where: { id: "banka-singleton" }, select: { balance: true } }),
    prisma.oglasEvidencija.aggregate({ where: { status: "APPROVED" }, _sum: { predlozeniPoen: true } }),
    prisma.dailyEmissionSummary.findMany({
      orderBy: { date: "desc" },
      take: 7,
      select: { date: true, limit: true, totalRequested: true, totalEmitted: true, koeficijent: true },
    }),
  ]);
  const limit = Math.floor(Math.abs(protokol?.balance ?? 0) * 0.1);
  return {
    limit,
    potvrdjenoOperativno: potvrdjeno._sum.predlozeniPoen ?? 0,
    prethodni: prethodni.map((d) => ({
      datum: d.date.toISOString().slice(0, 10),
      limit: d.limit,
      trazeno: d.totalRequested,
      evidentirano: d.totalEmitted,
      koeficijent: Number(d.koeficijent),
    })),
  };
}
