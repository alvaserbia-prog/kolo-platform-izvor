/**
 * Partnerstvo — servisne funkcije (Prisma).
 *
 * Osnov: Pravilnik o pokroviteljstvu i donacijama Glava VI (čl. 40–45); Pravilnik o KOLO
 * sistemu čl. 19 st. 1 t. 4 i st. 2, čl. 37 st. 5; set 5.1.2.
 *
 * Tok: prijava iz odobrenog upisa pokrovitelja (čl. 41 st. 1–2: opis, jedinica mere, obim,
 * rok, cena iz cenovnika i fotografija cenovnika) → direktor prihvata ili obrazloženo odbija
 * (čl. 41 st. 3); prihvatanjem nastaje ugovor sa SNIMLJENIM tekstom (čl. 42) → zastupnik
 * prijavljuje izvršen deo → direktor ili lice koje on ovlasti potvrđuje (čl. 43 st. 1–2):
 * doprinos se BELEŽI → noćni obračun narednog perioda ga EVIDENTIRA podnosiocu prijave
 * (`EMISIJA_PARTNERSTVO`) → prestanak: zabeleženo se poništava (bez transakcije), a
 * evidentirano ostaje — partnerstvo nije osnov negativnog zapisa (Pravilnik čl. 17 st. 2).
 *
 * 🔴 `emitujPoen()` otvara sopstvenu transakciju i zove se VAN `$transaction` (pravilo 8).
 * 🔴 Uz broj POEN-a se nigde ne prikazuje dinarski iznos (R-01).
 */
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/generated/prisma/client";
import { emitujPoen } from "./emisija";
import { probajEvidentiratiPotvrde } from "./potvrda-poen";
import { imeNaloga, ishodUpisa, upisiIdentitet, PORUKA_DRUGO_IME } from "./identitet";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { gdePseudonim } from "@/lib/pseudonim";
import { upisSpremanZaPrijavu, funkcijaZaUgovor } from "@/lib/upis-pokrovitelja-pravila";
import { FUNKCIJA_NOSIOCA_GAZDINSTVA } from "@/lib/pokroviteljstvo-dobrima-pravila";
import {
  generisiUgovorPartnerstvaTekst,
  jePovezanoLice,
  poenZaIzvrsenje,
  poklapanjaSaDobavljacem,
  smePotvrditiIzvrsenje,
  smePrijavitiIzvrsenje,
  type PredmetPartnerstva,
} from "@/lib/partnerstvo-pravila";

export * from "@/lib/partnerstvo-pravila";

export class PartnerstvoGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

export async function odgovorNaGreskuPartnerstva(e: unknown) {
  const { greska } = await import("@/lib/greska-api");
  if (e instanceof PartnerstvoGreska) return greska(e.message, e.status);
  console.error("[partnerstvo]", e);
  return greska(e instanceof Error ? e.message : "Greška.", 500);
}

export type DokazPartnerstvaUlaz = { nazivFajla: string; contentType: string; sadrzaj: Buffer };

const LINK_UPISA = (upisId: string) => `/postani-pokrovitelj/${upisId}?tab=partnerstvo`;

// ─── Prijava (čl. 41) ────────────────────────────────────────────────────────

/**
 * Prijava partnerstva iz ODOBRENOG upisa koji vodi podnosilac (čl. 41 st. 1), pod uslovima
 * iz čl. 28 st. 1. Podaci o partneru su SNIMAK upisa.
 */
export async function podnesiPrijavuPartnerstva(
  userId: string,
  upisId: string,
  podaci: PredmetPartnerstva,
  dokazi: DokazPartnerstvaUlaz[],
) {
  const korisnik = await prisma.user.findUnique({
    where: { id: userId },
    select: { verified: true, maloletan: true, deaktiviranAt: true },
  });
  if (!korisnik || korisnik.deaktiviranAt) throw new PartnerstvoGreska("Korisnik nije pronađen.", 404);
  if (korisnik.maloletan) throw new PartnerstvoGreska("Prijavu partnerstva ne može podneti maloletni korisnik.", 403);
  if (dokazi.length === 0) throw new PartnerstvoGreska("Priloži fotografiju cenovnika iz koje se vidi cena.");

  const upis = upisId ? await prisma.upisPokrovitelja.findUnique({ where: { id: upisId } }) : null;
  if (!upis) throw new PartnerstvoGreska("Prijava se podnosi iz upisa pokrovitelja u evidenciju.", 400);
  const spreman = upisSpremanZaPrijavu(upis, {
    userId, vrstaPrijave: "PARTNERSTVO", naListiZabrane: false, ucesnik: korisnik.verified,
  });
  if (!spreman.ok) throw new PartnerstvoGreska(spreman.razlog, upis.vlasnikUserId === userId ? 409 : 403);

  // Jedan nalog, jedno ime (Pravilnik čl. 31 st. 3).
  const imePrezime = upis.imePrezime!;
  if (ishodUpisa(await imeNaloga(userId), imePrezime) === "RAZLIKUJE_SE")
    throw new PartnerstvoGreska(PORUKA_DRUGO_IME, 409);

  const firma = upis.vrsta === "FIRMA";
  return prisma.partnerstvo.create({
    data: {
      upisId: upis.id,
      podnosilacId: userId,
      vrstaDavaoca: upis.vrsta,
      naziv: upis.naziv,
      pib: firma ? upis.pib : null,
      maticniBroj: firma ? upis.maticniBroj : null,
      adresaSedista: firma ? upis.adresaSedista : null,
      bpg: firma ? null : upis.bpg,
      zastupnikImePrezime: imePrezime,
      zastupnikFunkcija: firma ? funkcijaZaUgovor(upis) : FUNKCIJA_NOSIOCA_GAZDINSTVA,
      odnosPremaDavaocu: upis.odnosPremaDavaocu!,
      kontaktEmail: upis.kontaktEmail!,
      kontaktTelefon: upis.kontaktTelefon!,
      logoUrl: upis.logoUrl,
      izjavaOvlascenjeAt: upis.izjavaOvlascenjaAt,
      potvrdaEvidentiranjaAt: upis.potvrdaEvidentiranjaAt,
      potvrdaEvidentiranjaTekst: upis.potvrdaEvidentiranjaTekst,
      opis: podaci.opis,
      jedinicaMere: podaci.jedinicaMere,
      cenaPoJedinici: podaci.cenaPoJedinici,
      obim: podaci.obim,
      vrednostRsd: podaci.vrednostRsd,
      rokIzvrsenja: podaci.rokIzvrsenja,
      obradaPodataka: podaci.obradaPodataka,
      izjavaPodnosiocaAt: new Date(),
      dokazi: {
        create: dokazi.map((d) => ({
          nazivFajla: d.nazivFajla.slice(0, 200),
          contentType: d.contentType,
          velicina: d.sadrzaj.length,
          sadrzaj: new Uint8Array(d.sadrzaj),
        })),
      },
    },
    select: { id: true },
  });
}

/** Podnosilac povlači prijavu dok čeka odluku. */
export async function povuciPrijavuPartnerstva(userId: string, id: string) {
  const r = await prisma.partnerstvo.updateMany({
    where: { id, podnosilacId: userId, status: "NA_PREGLEDU" },
    data: { status: "ODBIJENO", odbijenoRazlog: "Prijavu je povukao podnosilac.", odlucenoAt: new Date() },
  });
  if (r.count === 0) throw new PartnerstvoGreska("Prijava nije pronađena ili je već obrađena.", 409);
}

/**
 * Partnerstva upisa koji vodi korisnik, sa izvršenjima. 🔴 Uz dinare (vrednost ugovora) se ne
 * vraća broj POEN-a; zabeležen i evidentiran doprinos korisnik vidi na ekranu POEN.
 */
export async function partnerstvaUpisa(userId: string, upisId: string) {
  const upis = upisId
    ? await prisma.upisPokrovitelja.findUnique({ where: { id: upisId }, select: { vlasnikUserId: true } })
    : null;
  if (!upis || upis.vlasnikUserId !== userId) throw new PartnerstvoGreska("Upis nije pronađen.", 404);
  const redovi = await prisma.partnerstvo.findMany({
    where: { upisId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, opis: true, jedinicaMere: true, cenaPoJedinici: true, obim: true, vrednostRsd: true,
      rokIzvrsenja: true, obradaPodataka: true, dpaZabelezenAt: true, status: true, odbijenoRazlog: true,
      ugovorTekst: true, kontrolniBroj: true, zakljucenoAt: true, prestaloAt: true, prestanakRazlog: true,
      createdAt: true, podnosilacId: true,
      izvrsenja: {
        orderBy: { createdAt: "desc" },
        select: { id: true, obim: true, opis: true, status: true, odbijenoRazlog: true, createdAt: true, potvrdjenoAt: true },
      },
    },
  });
  return redovi.map(({ podnosilacId, ...p }) => ({
    ...p,
    mojaPrijava: podnosilacId === userId,
    cenaPoJedinici: Number(p.cenaPoJedinici),
    obim: Number(p.obim),
    vrednostRsd: Number(p.vrednostRsd),
    rokIzvrsenja: p.rokIzvrsenja.toISOString(),
    dpaZabelezen: !!p.dpaZabelezenAt,
    dpaZabelezenAt: undefined,
    zakljucenoAt: p.zakljucenoAt?.toISOString() ?? null,
    prestaloAt: p.prestaloAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    izvrsenja: p.izvrsenja.map((i) => ({
      ...i,
      obim: Number(i.obim),
      createdAt: i.createdAt.toISOString(),
      potvrdjenoAt: i.potvrdjenoAt?.toISOString() ?? null,
    })),
  }));
}

// ─── Odluka direktora (čl. 41 st. 3, čl. 42, čl. 45) ─────────────────────────

/**
 * Troškovi Fondacije i nabavke u kojima se pominje naziv ili matični broj partnera
 * (čl. 45 st. 1). Samo upozorenje direktoru — izjavu da partner nije plaćeni dobavljač
 * za istu vrstu usluge daje on pri prihvatanju.
 */
async function placeneStavke() {
  const [troskovi, projektni, nabavke] = await Promise.all([
    prisma.fondacijaTrosak.findMany({ select: { id: true, opis: true, datum: true, iznosRSD: true }, orderBy: { datum: "desc" }, take: 2000 }),
    prisma.projekatTrosak.findMany({ select: { id: true, opis: true, datum: true, iznosRSD: true }, orderBy: { datum: "desc" }, take: 2000 }),
    prisma.nabavka.findMany({ where: { dobavljac: { not: null } }, select: { id: true, dobavljac: true, createdAt: true }, take: 2000 }),
  ]);
  return [
    ...troskovi.map((t) => ({ id: `T:${t.id}`, opis: t.opis, datum: t.datum, iznos: Number(t.iznosRSD), izvor: "FONDACIJA" as const })),
    ...projektni.map((t) => ({ id: `P:${t.id}`, opis: t.opis, datum: t.datum, iznos: Number(t.iznosRSD), izvor: "PROJEKAT" as const })),
    ...nabavke.map((n) => ({ id: `N:${n.id}`, opis: n.dobavljac ?? "", datum: n.createdAt, iznos: null, izvor: "NABAVKA" as const })),
  ];
}

export async function upozorenjaDobavljaca(
  p: { naziv: string; maticniBroj: string | null },
  stavke?: Awaited<ReturnType<typeof placeneStavke>>,
) {
  const sve = stavke ?? (await placeneStavke());
  const pogodjeni = new Set(poklapanjaSaDobavljacem(p, sve));
  return sve
    .filter((s) => pogodjeni.has(s.id))
    .slice(0, 20)
    .map((s) => ({ izvor: s.izvor, opis: s.opis, datum: s.datum.toISOString(), iznosRsd: s.iznos }));
}

/** Sve prijave i partnerstva za administratorski tim. Ovde (i samo ovde) idu MB, PIB, BPG i kontakt. */
export async function listaPartnerstavaZaAdmina() {
  const redovi = await prisma.partnerstvo.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true, naziv: true, vrstaDavaoca: true, maticniBroj: true, pib: true, bpg: true,
      zastupnikImePrezime: true, kontaktEmail: true, kontaktTelefon: true,
      opis: true, jedinicaMere: true, cenaPoJedinici: true, obim: true, vrednostRsd: true, rokIzvrsenja: true,
      obradaPodataka: true, dpaZabelezenAt: true, status: true, odbijenoRazlog: true, ugovorTekst: true,
      zakljucenoAt: true, prestaloAt: true, prestanakRazlog: true, ovlascenoLiceId: true, createdAt: true,
      podnosilac: { select: { pseudonim: true } },
      dokazi: { select: { id: true, nazivFajla: true } },
      izvrsenja: {
        orderBy: { createdAt: "desc" },
        select: { id: true, obim: true, opis: true, status: true, odbijenoRazlog: true, poen: true, createdAt: true, potvrdjenoAt: true },
      },
    },
  });
  const ovlasceni = [...new Set(redovi.map((r) => r.ovlascenoLiceId).filter((x): x is string => !!x))];
  const pseudonimi = new Map(
    (ovlasceni.length
      ? await prisma.user.findMany({ where: { id: { in: ovlasceni } }, select: { id: true, pseudonim: true } })
      : []
    ).map((u) => [u.id, u.pseudonim]),
  );
  const stavke = redovi.some((r) => r.status === "NA_PREGLEDU") ? await placeneStavke() : [];
  const izlaz = [];
  for (const r of redovi) {
    izlaz.push({
      ...r,
      podnosilac: r.podnosilac.pseudonim,
      cenaPoJedinici: Number(r.cenaPoJedinici),
      obim: Number(r.obim),
      vrednostRsd: Number(r.vrednostRsd),
      rokIzvrsenja: r.rokIzvrsenja.toISOString(),
      dpaZabelezenAt: r.dpaZabelezenAt?.toISOString() ?? null,
      zakljucenoAt: r.zakljucenoAt?.toISOString() ?? null,
      prestaloAt: r.prestaloAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      ovlascenoLice: r.ovlascenoLiceId ? pseudonimi.get(r.ovlascenoLiceId) ?? null : null,
      upozorenjaDobavljaca: r.status === "NA_PREGLEDU" ? await upozorenjaDobavljaca(r, stavke) : [],
      izvrsenja: r.izvrsenja.map((i) => ({
        ...i,
        obim: Number(i.obim),
        createdAt: i.createdAt.toISOString(),
        potvrdjenoAt: i.potvrdjenoAt?.toISOString() ?? null,
      })),
    });
  }
  return izlaz;
}

/**
 * Prihvatanje prijave (čl. 41 st. 3, čl. 42): samo direktor (superadmin — proverava ruta).
 * Fondacija proverava da je fotografija cenovnika priložena; cenu ne procenjuje, ne upoređuje
 * i ne određuje (čl. 42 st. 2). Direktor izjavljuje da partner nije dobavljač kome Fondacija
 * za istu vrstu usluge plaća (čl. 45 st. 1). Prihvatanjem se ugovor generiše i SNIMA.
 */
export async function prihvatiPartnerstvo(id: string, adminId: string, p: { izjavaNijeDobavljac: boolean }) {
  if (!p.izjavaNijeDobavljac)
    throw new PartnerstvoGreska("Potvrdi da partner nije dobavljač kome Fondacija za istu vrstu usluge plaća (čl. 45 st. 1).");
  const u = await prisma.partnerstvo.findUnique({
    where: { id },
    include: { _count: { select: { dokazi: true } }, upis: { select: { status: true, obrisanAt: true } } },
  });
  if (!u) throw new PartnerstvoGreska("Prijava nije pronađena.", 404);
  if (u.status !== "NA_PREGLEDU") throw new PartnerstvoGreska("Prijava je već obrađena.", 409);
  if (u.upis.status !== "ODOBREN" || u.upis.obrisanAt)
    throw new PartnerstvoGreska("Upis pokrovitelja nije odobren — prvo odobri upis.", 409);
  if (u._count.dokazi === 0) throw new PartnerstvoGreska("Uz prijavu nije priložena fotografija cenovnika.", 409);
  if (ishodUpisa(await imeNaloga(u.podnosilacId), u.zastupnikImePrezime) === "RAZLIKUJE_SE")
    throw new PartnerstvoGreska(PORUKA_DRUGO_IME, 409);

  const sada = new Date();
  const ugovorTekst = generisiUgovorPartnerstvaTekst({
    vrstaDavaoca: u.vrstaDavaoca,
    naziv: u.naziv,
    pib: u.pib,
    maticniBroj: u.maticniBroj,
    adresaSedista: u.adresaSedista,
    bpg: u.bpg,
    zastupnikImePrezime: u.zastupnikImePrezime,
    zastupnikFunkcija: u.zastupnikFunkcija,
    odnosPremaDavaocu: u.odnosPremaDavaocu,
    kontaktEmail: u.kontaktEmail,
    kontaktTelefon: u.kontaktTelefon,
    opis: u.opis,
    jedinicaMere: u.jedinicaMere,
    obim: Number(u.obim),
    cenaPoJedinici: Number(u.cenaPoJedinici),
    vrednostRsd: Number(u.vrednostRsd),
    rokIzvrsenja: u.rokIzvrsenja,
    obradaPodataka: u.obradaPodataka,
    datum: sada,
  });
  const kontrolniBroj = createHash("sha256").update(ugovorTekst, "utf8").digest("hex");
  const r = await prisma.partnerstvo.updateMany({
    where: { id, status: "NA_PREGLEDU" },
    data: {
      status: "PRIHVACENO", ugovorTekst, kontrolniBroj, zakljucenoAt: sada,
      odlucioId: adminId, odlucenoAt: sada, dobavljacIzjavaAt: sada,
    },
  });
  if (r.count === 0) throw new PartnerstvoGreska("Prijava je već obrađena.", 409);

  // Evidencija identiteta (Pravilnik čl. 31 st. 2; donacije čl. 28 st. 4 shodno) — ime lica iz upisa.
  await upisiIdentitet(u.podnosilacId, u.zastupnikImePrezime, "POKROVITELJSTVO").catch((e) =>
    console.error("[partnerstvo] upis u evidenciju identiteta nije uspeo", { id, e }),
  );
  await logAdminAkcija(adminId, "PARTNERSTVO_PRIHVACENO", id, `ugovor zaključen, kontrolni broj ${kontrolniBroj.slice(0, 12)}`);
  await obavesti(u.podnosilacId, {
    tip: "partnerstvo",
    kljuc: "notifikacije.partnerstvo_prihvaceno",
    parametri: { opis: u.opis },
    naslov: "Prijava partnerstva prihvaćena — ugovor zaključen",
    tekst: `Fondacija je prihvatila prijavu partnerstva „${u.opis}“. Ugovor je zaključen; izvršen deo prijavljuješ na stranici pokrovitelja.`,
    link: LINK_UPISA(u.upisId),
  });
  return { kontrolniBroj };
}

/** Odbijanje (čl. 41 st. 3): samo direktor, obrazloženo. */
export async function odbijPartnerstvo(id: string, adminId: string, razlog: string) {
  const r0 = razlog.trim();
  if (r0.length < 5) throw new PartnerstvoGreska("Obrazloženje je obavezno.");
  const u = await prisma.partnerstvo.findUnique({ where: { id }, select: { podnosilacId: true, upisId: true } });
  if (!u) throw new PartnerstvoGreska("Prijava nije pronađena.", 404);
  const r = await prisma.partnerstvo.updateMany({
    where: { id, status: "NA_PREGLEDU" },
    data: { status: "ODBIJENO", odbijenoRazlog: r0, odlucioId: adminId, odlucenoAt: new Date() },
  });
  if (r.count === 0) throw new PartnerstvoGreska("Prijava je već obrađena.", 409);
  await logAdminAkcija(adminId, "PARTNERSTVO_ODBIJENO", id, r0);
  await obavesti(u.podnosilacId, {
    tip: "partnerstvo",
    kljuc: "notifikacije.partnerstvo_odbijeno",
    parametri: { razlog: r0 },
    naslov: "Prijava partnerstva odbijena",
    tekst: `Prijava partnerstva je odbijena. Obrazloženje: ${r0}`,
    link: LINK_UPISA(u.upisId),
  });
}

/** Ugovor o obradi zaključen (čl. 42 st. 3) — uslov prve potvrde kad partner obrađuje podatke. */
export async function zabeleziUgovorOObradi(id: string, adminId: string) {
  const r = await prisma.partnerstvo.updateMany({
    where: { id, obradaPodataka: true, dpaZabelezenAt: null, status: { in: ["NA_PREGLEDU", "PRIHVACENO"] } },
    data: { dpaZabelezenAt: new Date(), dpaZabelezioId: adminId },
  });
  if (r.count === 0) throw new PartnerstvoGreska("Ugovor o obradi je već zabeležen ili nije potreban.", 409);
  await logAdminAkcija(adminId, "PARTNERSTVO_UGOVOR_O_OBRADI", id);
}

/**
 * Lica povezana sa partnerom (čl. 43 st. 2): ko vodi (ili je vodio) upis istog MB, odnosno
 * BPG, ko je podneo prijavu partnerstva ili pokroviteljstva tog partnera, i zaposleni koje
 * je partner odredio.
 */
async function povezanaLica(p: { upisId: string; maticniBroj: string | null; bpg: string | null }) {
  const kljuc = p.maticniBroj ? { maticniBroj: p.maticniBroj } : p.bpg ? { bpg: p.bpg } : null;
  const [upisi, partnerstva, ugovori, zaposleni] = await Promise.all([
    prisma.upisPokrovitelja.findMany({
      where: kljuc ? { OR: [{ id: p.upisId }, kljuc] } : { id: p.upisId },
      select: { id: true, vlasnikUserId: true },
    }),
    prisma.partnerstvo.findMany({
      where: kljuc ? { OR: [{ upisId: p.upisId }, kljuc] } : { upisId: p.upisId },
      select: { podnosilacId: true },
    }),
    prisma.ugovorDobra.findMany({
      where: kljuc ? { OR: [{ upisId: p.upisId }, kljuc] } : { upisId: p.upisId },
      select: { podnosilacId: true },
    }),
    prisma.davalacZaposleni.findMany({
      where: { upis: kljuc ? { OR: [{ id: p.upisId }, kljuc] } : { id: p.upisId } },
      select: { zaposleniUserId: true },
    }),
  ]);
  return {
    vlasniciUpisa: upisi.map((u) => u.vlasnikUserId),
    podnosioci: [...partnerstva.map((x) => x.podnosilacId), ...ugovori.map((x) => x.podnosilacId)],
    zaposleni: zaposleni.map((z) => z.zaposleniUserId),
  };
}

/**
 * Direktor ovlašćuje lice koje potvrđuje izvršenje (čl. 43 st. 1) — po pseudonimu; `null`
 * opoziva. Ovlašćeno lice ne sme biti podnosilac ni lice povezano sa partnerom.
 */
export async function odrediOvlascenoLice(id: string, adminId: string, pseudonimUnos: string | null) {
  const u = await prisma.partnerstvo.findUnique({
    where: { id },
    select: { id: true, status: true, podnosilacId: true, upisId: true, maticniBroj: true, bpg: true },
  });
  if (!u) throw new PartnerstvoGreska("Partnerstvo nije pronađeno.", 404);
  if (u.status !== "PRIHVACENO") throw new PartnerstvoGreska("Lice se ovlašćuje dok partnerstvo traje.", 409);
  const pseudonim = typeof pseudonimUnos === "string" ? pseudonimUnos.trim() : "";
  if (!pseudonim) {
    await prisma.partnerstvo.update({ where: { id }, data: { ovlascenoLiceId: null } });
    await logAdminAkcija(adminId, "PARTNERSTVO_OVLASCENJE_OPOZVANO", id);
    return null;
  }
  const nalog = await prisma.user.findFirst({
    where: gdePseudonim(pseudonim),
    select: { id: true, maloletan: true, deaktiviranAt: true, status: true },
  });
  if (!nalog || nalog.deaktiviranAt || nalog.status !== "ACTIVE") throw new PartnerstvoGreska("Korisnik sa tim pseudonimom nije pronađen.", 404);
  if (nalog.maloletan) throw new PartnerstvoGreska("Maloletni korisnik ne može biti ovlašćen.");
  if (nalog.id === u.podnosilacId || jePovezanoLice(nalog.id, await povezanaLica(u)))
    throw new PartnerstvoGreska("Ovlašćeno lice ne sme biti podnosilac prijave ni lice povezano sa partnerom.");
  await prisma.partnerstvo.update({ where: { id }, data: { ovlascenoLiceId: nalog.id } });
  await logAdminAkcija(adminId, "PARTNERSTVO_OVLASCENJE", id, nalog.id);
  await obavesti(nalog.id, {
    tip: "partnerstvo",
    kljuc: "notifikacije.partnerstvo_ovlascenje",
    naslov: "Ovlašćen si da potvrđuješ izvršenje partnerstva",
    tekst: "Direktor Fondacije te je ovlastio da potvrđuješ izvršene delove jednog partnerstva.",
    link: "/postani-pokrovitelj#partnerstvo-potvrde",
  });
  return nalog.id;
}

// ─── Izvršenje (čl. 43) ──────────────────────────────────────────────────────

/** Zastupnik (lice koje vodi upis) prijavljuje izvršen deo. */
export async function prijaviIzvrsenje(userId: string, partnerstvoId: string, p: { obim: number; opis: string }) {
  const u = await prisma.partnerstvo.findUnique({
    where: { id: partnerstvoId },
    select: {
      id: true, status: true, obim: true, upisId: true, ovlascenoLiceId: true,
      upis: { select: { vlasnikUserId: true } },
      izvrsenja: { where: { status: { in: ["PRIJAVLJENO", "ZABELEZENO", "EVIDENTIRANO"] } }, select: { obim: true } },
    },
  });
  if (!u || u.upis.vlasnikUserId !== userId) throw new PartnerstvoGreska("Partnerstvo nije pronađeno.", 404);
  const zauzetObim = u.izvrsenja.reduce((z, i) => z + Number(i.obim), 0);
  const smem = smePrijavitiIzvrsenje({ status: u.status, obimUgovora: Number(u.obim), zauzetObim, obim: p.obim });
  if (!smem.ok) throw new PartnerstvoGreska(smem.razlog, 409);
  const red = await prisma.izvrsenjePartnerstva.create({
    data: { partnerstvoId, prijavioId: userId, obim: p.obim, opis: p.opis },
    select: { id: true },
  });
  if (u.ovlascenoLiceId) {
    await obavesti(u.ovlascenoLiceId, {
      tip: "partnerstvo",
      kljuc: "notifikacije.partnerstvo_izvrsenje_prijavljeno",
      naslov: "Prijavljen izvršen deo partnerstva",
      tekst: "Partner je prijavio izvršen deo usluge. Potvrdi ga ili odbij uz obrazloženje.",
      link: "/postani-pokrovitelj#partnerstvo-potvrde",
    }).catch(() => {});
  }
  return red;
}

async function izvrsenjeZaOdluku(izvrsenjeId: string, potvrdilacId: string, jeSuperadmin: boolean) {
  const i = await prisma.izvrsenjePartnerstva.findUnique({
    where: { id: izvrsenjeId },
    select: {
      id: true, obim: true, status: true, prijavioId: true, partnerstvoId: true,
      partnerstvo: {
        select: {
          id: true, status: true, podnosilacId: true, upisId: true, maticniBroj: true, bpg: true,
          cenaPoJedinici: true, ovlascenoLiceId: true, obradaPodataka: true, dpaZabelezenAt: true,
        },
      },
    },
  });
  if (!i) throw new PartnerstvoGreska("Izvršenje nije pronađeno.", 404);
  const p = i.partnerstvo;
  if (!jeSuperadmin && p.ovlascenoLiceId !== potvrdilacId) throw new PartnerstvoGreska("Izvršenje nije pronađeno.", 404);
  const povezan = jePovezanoLice(potvrdilacId, await povezanaLica(p));
  return { i, p, povezan };
}

/**
 * Potvrda izvršenog dela (čl. 43 st. 1–2): doprinos u visini vrednosti izvršenog dela sa
 * koeficijentom 1,00 se BELEŽI (`poen` je snimak). Evidentira ga noćni obračun narednog
 * obračunskog perioda (`evidentirajZabelezenoPartnerstvo`). Ovde nema emisije.
 */
export async function potvrdiIzvrsenje(izvrsenjeId: string, potvrdilacId: string, jeSuperadmin: boolean) {
  const { i, p, povezan } = await izvrsenjeZaOdluku(izvrsenjeId, potvrdilacId, jeSuperadmin);
  const smem = smePotvrditiIzvrsenje({
    potvrdilacId, jeSuperadmin, ovlascenoLiceId: p.ovlascenoLiceId, podnosilacId: p.podnosilacId,
    prijavioId: i.prijavioId, povezan, statusPartnerstva: p.status, statusIzvrsenja: i.status,
    obradaPodataka: p.obradaPodataka, dpaZabelezenAt: p.dpaZabelezenAt,
  });
  if (!smem.ok) throw new PartnerstvoGreska(smem.razlog, 403);
  const poen = poenZaIzvrsenje(Number(i.obim), Number(p.cenaPoJedinici));
  const r = await prisma.izvrsenjePartnerstva.updateMany({
    where: { id: izvrsenjeId, status: "PRIJAVLJENO" },
    data: { status: "ZABELEZENO", potvrdioId: potvrdilacId, potvrdjenoAt: new Date(), poen },
  });
  if (r.count === 0) throw new PartnerstvoGreska("Izvršenje je već obrađeno.", 409);
  await logAdminAkcija(potvrdilacId, "PARTNERSTVO_IZVRSENJE_POTVRDJENO", izvrsenjeId, `partnerstvo ${p.id}`);
  await obavesti(p.podnosilacId, {
    tip: "partnerstvo",
    kljuc: "notifikacije.partnerstvo_izvrsenje_potvrdjeno",
    parametri: { poen },
    naslov: "Izvršenje partnerstva potvrđeno",
    tekst: `Izvršen deo partnerstva je potvrđen. Zabeleženo je ${poen.toLocaleString("sr-RS")} POEN; doprinos se evidentira u narednom obračunskom periodu.`,
    link: "/novcanik",
  });
  return { poen };
}

/** Izvršenje nije potvrđeno (razlog obavezan) — za neizvršeni deo doprinos se ne beleži. */
export async function odbijIzvrsenje(izvrsenjeId: string, potvrdilacId: string, jeSuperadmin: boolean, razlog: string) {
  const r0 = razlog.trim();
  if (r0.length < 5) throw new PartnerstvoGreska("Obrazloženje je obavezno.");
  const { i, p, povezan } = await izvrsenjeZaOdluku(izvrsenjeId, potvrdilacId, jeSuperadmin);
  if (potvrdilacId === p.podnosilacId || potvrdilacId === i.prijavioId || povezan)
    throw new PartnerstvoGreska("O izvršenju ne odlučuje podnosilac prijave ni lice povezano sa partnerom.", 403);
  const r = await prisma.izvrsenjePartnerstva.updateMany({
    where: { id: izvrsenjeId, status: "PRIJAVLJENO" },
    data: { status: "ODBIJENO", potvrdioId: potvrdilacId, potvrdjenoAt: new Date(), odbijenoRazlog: r0 },
  });
  if (r.count === 0) throw new PartnerstvoGreska("Izvršenje je već obrađeno.", 409);
  await logAdminAkcija(potvrdilacId, "PARTNERSTVO_IZVRSENJE_ODBIJENO", izvrsenjeId, r0);
  await obavesti(p.podnosilacId, {
    tip: "partnerstvo",
    kljuc: "notifikacije.partnerstvo_izvrsenje_odbijeno",
    parametri: { razlog: r0 },
    naslov: "Izvršenje partnerstva nije potvrđeno",
    tekst: `Prijavljeni izvršen deo nije potvrđen. Obrazloženje: ${r0}`,
    link: LINK_UPISA(p.upisId),
  });
}

/** Izvršenja koja čekaju potvrdu lica koje je direktor ovlastio (čl. 43 st. 1). */
export async function izvrsenjaZaOvlascenog(userId: string) {
  const redovi = await prisma.izvrsenjePartnerstva.findMany({
    where: { status: "PRIJAVLJENO", partnerstvo: { ovlascenoLiceId: userId, status: "PRIHVACENO" } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, obim: true, opis: true, createdAt: true,
      partnerstvo: { select: { naziv: true, opis: true, jedinicaMere: true } },
    },
  });
  return redovi.map((r) => ({
    id: r.id,
    obim: Number(r.obim),
    opis: r.opis,
    createdAt: r.createdAt.toISOString(),
    partner: r.partnerstvo.naziv,
    usluga: r.partnerstvo.opis,
    jedinicaMere: r.partnerstvo.jedinicaMere,
  }));
}

// ─── Prestanak ───────────────────────────────────────────────────────────────

/**
 * Prestanak partnerstva (samo direktor, obrazloženo). Zabeležen, a neevidentiran doprinos se
 * PONIŠTAVA — samo status, bez transakcije, jer zapis još ne postoji. Prijavljena, a
 * nepotvrđena izvršenja se odbijaju. 🔴 Evidentiran doprinos se NE otpisuje: partnerstvo nije
 * među osnovima negativnog zapisa iz Pravilnika čl. 17 st. 2.
 */
export async function prestaniPartnerstvo(id: string, adminId: string, razlog: string) {
  const r0 = razlog.trim();
  if (r0.length < 5) throw new PartnerstvoGreska("Obrazloženje je obavezno.");
  const u = await prisma.partnerstvo.findUnique({ where: { id }, select: { podnosilacId: true, upisId: true, status: true } });
  if (!u) throw new PartnerstvoGreska("Partnerstvo nije pronađeno.", 404);
  const sada = new Date();
  const ponisteno = await prisma.$transaction(async (tx) => {
    const r = await tx.partnerstvo.updateMany({
      where: { id, status: "PRIHVACENO" },
      data: { status: "PRESTALO", prestaloAt: sada, prestanakRazlog: r0, prestanakId: adminId, ovlascenoLiceId: null },
    });
    if (r.count === 0) throw new PartnerstvoGreska("Partnerstvo ne traje.", 409);
    const z = await tx.izvrsenjePartnerstva.updateMany({
      where: { partnerstvoId: id, status: "ZABELEZENO", emisijaTxId: null },
      data: { status: "PONISTENO", ponistenoAt: sada },
    });
    await tx.izvrsenjePartnerstva.updateMany({
      where: { partnerstvoId: id, status: "PRIJAVLJENO" },
      data: { status: "ODBIJENO", odbijenoRazlog: "Partnerstvo je prestalo.", potvrdjenoAt: sada },
    });
    return z.count;
  });
  await logAdminAkcija(adminId, "PARTNERSTVO_PRESTALO", id, `${r0} (poništeno zabeleženih: ${ponisteno})`);
  await obavesti(u.podnosilacId, {
    tip: "partnerstvo",
    kljuc: "notifikacije.partnerstvo_prestalo",
    parametri: { razlog: r0 },
    naslov: "Partnerstvo je prestalo",
    tekst: `Partnerstvo je prestalo. Obrazloženje: ${r0}. Zabeležen, a još neevidentiran doprinos je poništen; evidentiran doprinos ostaje.`,
    link: LINK_UPISA(u.upisId),
  });
  return { ponisteno };
}

// ─── Noćni obračun (čl. 43 st. 1, st. 3; Pravilnik čl. 37 st. 5) ─────────────

/**
 * Zabeležen doprinos po potvrđenom izvršenju pre početka ovog obračunskog perioda evidentira
 * se sada, u zapisu podnosioca prijave, sopstvenim tipom `EMISIJA_PARTNERSTVO`. Automatski
 * akt Protokola, van zajedničkog dnevnog limita. Emisija ide jedna po jedna, van transakcije
 * (pravilo 8); red se preuzima uslovnim upisom, pa dva prolaza ne emituju dvaput. Ako
 * podnosiocu status prestane pre evidentiranja, zabeleženo se poništava.
 */
export async function evidentirajZabelezenoPartnerstvo(doTrenutka: Date = new Date()): Promise<number> {
  const redovi = await prisma.izvrsenjePartnerstva.findMany({
    where: { status: "ZABELEZENO", emisijaTxId: null, potvrdjenoAt: { lt: doTrenutka } },
    select: { id: true, poen: true, partnerstvo: { select: { podnosilacId: true } } },
    orderBy: { potvrdjenoAt: "asc" },
  });
  let evidentirano = 0;
  for (const r of redovi) {
    const poen = r.poen ?? 0;
    const podnosilacId = r.partnerstvo.podnosilacId;
    const preuzet = await prisma.izvrsenjePartnerstva.updateMany({
      where: { id: r.id, status: "ZABELEZENO", emisijaTxId: null },
      data: { status: "EVIDENTIRANO" },
    });
    if (preuzet.count !== 1) continue;
    if (poen <= 0) continue;
    const korisnik = await prisma.user.findUnique({
      where: { id: podnosilacId },
      select: { deaktiviranAt: true, wallet: { select: { id: true } } },
    });
    if (!korisnik || korisnik.deaktiviranAt || !korisnik.wallet) {
      await prisma.izvrsenjePartnerstva.updateMany({
        where: { id: r.id, status: "EVIDENTIRANO", emisijaTxId: null },
        data: { status: "PONISTENO", ponistenoAt: new Date() },
      });
      continue;
    }
    try {
      const { transaction } = await emitujPoen(
        korisnik.wallet.id,
        poen,
        TransactionType.EMISIJA_PARTNERSTVO,
        `Evidentiran doprinos po partnerstvu: ${poen.toLocaleString("sr-RS")} POEN`,
        { kljuc: "transakcije.partnerstvo", parametri: { iznos: poen } },
      );
      await prisma.izvrsenjePartnerstva.update({
        where: { id: r.id },
        data: { emisijaTxId: transaction.id, evidentiranoAt: new Date() },
      });
      evidentirano++;
    } catch (e) {
      console.error("[partnerstvo] evidentiranje zabeleženog nije uspelo", { id: r.id, e });
      await prisma.izvrsenjePartnerstva.updateMany({
        where: { id: r.id, status: "EVIDENTIRANO", emisijaTxId: null },
        data: { status: "ZABELEZENO" },
      });
      continue;
    }
    await obavesti(podnosilacId, {
      tip: "partnerstvo",
      kljuc: "notifikacije.partnerstvo_evidentirano",
      parametri: { poen },
      naslov: "Doprinos po partnerstvu je evidentiran",
      tekst: `Zabeležen doprinos po partnerstvu evidentiran je u obračunskom periodu koji je počeo: ${poen.toLocaleString("sr-RS")} POEN.`,
      link: "/novcanik",
    }).catch(() => {});
    // Partnerstvo je oblik pokroviteljstva (čl. 40 st. 1) — trag učešća. Ne baca.
    await probajEvidentiratiPotvrde(podnosilacId);
  }
  return evidentirano;
}

/** Zabeležen, a neevidentiran doprinos po partnerstvu — red na ekranu POEN, nikad uz stanje. */
export async function zabelezenoPartnerstvo(userId: string): Promise<number> {
  const a = await prisma.izvrsenjePartnerstva.aggregate({
    where: { status: "ZABELEZENO", emisijaTxId: null, partnerstvo: { podnosilacId: userId } },
    _sum: { poen: true },
  });
  return a._sum.poen ?? 0;
}

// ─── Spisak partnera (čl. 44 st. 2) ──────────────────────────────────────────

/**
 * Javni spisak partnera: samo naziv i logotip (čl. 44 st. 2) — bez vrednosti, POEN-a, MB,
 * PIB-a, BPG-a, podnosioca i kontakta. Partner sa bar jednim prihvaćenim partnerstvom;
 * uklonjen sa rang-liste upis se ne prikazuje.
 */
export async function javniSpisakPartnera(): Promise<{ naziv: string; logoUrl: string | null }[]> {
  const redovi = await prisma.partnerstvo.findMany({
    where: { status: { in: ["PRIHVACENO", "PRESTALO"] }, upis: { uklonjenSaRangListeAt: null } },
    orderBy: { zakljucenoAt: "asc" },
    select: { upisId: true, upis: { select: { naziv: true, logoUrl: true } } },
  });
  const vidjeni = new Map<string, { naziv: string; logoUrl: string | null }>();
  for (const r of redovi) if (!vidjeni.has(r.upisId)) vidjeni.set(r.upisId, { naziv: r.upis.naziv, logoUrl: r.upis.logoUrl });
  return [...vidjeni.values()];
}
