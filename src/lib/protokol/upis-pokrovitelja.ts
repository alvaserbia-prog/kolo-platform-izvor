/**
 * Upis pokrovitelja u evidenciju — servisni sloj (Prisma).
 *
 * Osnov: Pravilnik o pokroviteljstvu i donacijama čl. 16–18 (upis), čl. 19 i 28
 * (prijave iz odobrenog upisa), čl. 26 st. 2 (javni prikaz), čl. 35 st. 5 (lista
 * zabrane uz upis); Politika privatnosti 4.5.
 *
 * Tok: punoletni verifikovani korisnik upisuje pravno lice, preduzetnika ili
 * registrovano gazdinstvo (NA_PROVERI) → Fondacija naziv, MB i zastupnika poredi sa
 * registrom i odobrava (ODOBREN, beleži se samo DA je poređenje izvršeno) ili
 * odbija uz obrazloženje → iz odobrenog upisa korisnik podnosi prijave. Izmena
 * naziva, MB i logotipa ide na ponovnu proveru (do odluke važe ranije odobrene
 * vrednosti); kontakt, sedište i mapa se menjaju odmah.
 *
 * 🔴 Ime i prezime iz upisa NE ide ovde u evidenciju identiteta — tek pri potvrdi
 * prijema donacije (čl. 19 st. 3, čl. 28 st. 4).
 * 🔴 Adresa na mapi: izjava je obavezna i ne povlači se; izlaz je samo brisanje
 * upisa, kad nema neiskorišćenih vaučera. Doprinosi dati do brisanja ostaju na
 * rang-listi; sa nje se pokrovitelj uklanja samo na zahtev korisnika koji je vodio upis.
 *
 * Čista pravila: `@/lib/upis-pokrovitelja-pravila` (re-eksport ispod).
 */
import { prisma } from "@/lib/prisma";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import {
  procitajUpis,
  razvrstajIzmenu,
  smeObrisatiUpis,
  javniPrikazUpisa,
  jeNeiskoriscenVaucer,
  type TackaPokrovitelja,
} from "@/lib/upis-pokrovitelja-pravila";

export * from "@/lib/upis-pokrovitelja-pravila";

export class UpisGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

/** Odgovor rute na izuzetak iz ovog modula. */
export async function odgovorNaGreskuUpisa(e: unknown) {
  const { greska } = await import("@/lib/greska-api");
  if (e instanceof UpisGreska) return greska(e.message, e.status);
  console.error("[upis-pokrovitelja]", e);
  return greska(e instanceof Error ? e.message : "Greška.", 500);
}

/** Živ upis: nije obrisan i nije odbijen — po njemu važi „upisuje se jednom". */
const ZIV = { obrisanAt: null, status: { not: "ODBIJEN" as const } };

/**
 * Isti pokrovitelj se upisuje jednom (čl. 18 st. 2): pravno lice i preduzetnik po
 * matičnom broju i PIB-u, gazdinstvo po BPG-u. Bazu drži i delimičan jedinstveni
 * indeks (MB, BPG); ova provera daje razumljivu poruku.
 */
async function vecUpisan(p: { maticniBroj?: string | null; pib?: string | null; bpg?: string | null }, izuzmi?: string) {
  const ili = [
    ...(p.maticniBroj ? [{ maticniBroj: p.maticniBroj }] : []),
    ...(p.pib ? [{ pib: p.pib }] : []),
    ...(p.bpg ? [{ bpg: p.bpg }] : []),
  ];
  if (ili.length === 0) return false;
  const n = await prisma.upisPokrovitelja.count({
    where: { ...ZIV, OR: ili, ...(izuzmi ? { id: { not: izuzmi } } : {}) },
  });
  return n > 0;
}

/** Prisma P2002 — povreda jedinstvenog indeksa. */
function jeDvostrukiKljuc(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "P2002";
}

const PORUKA_VEC_UPISAN = "Ovaj pokrovitelj je već upisan u evidenciju. Upis vodi korisnik koji ga je izvršio.";

/** Lista zabrane (čl. 35 st. 5) — vezuje se za upis. */
export async function upisNaListiZabrane(upisId: string): Promise<boolean> {
  const z = await prisma.zabranaDavaoca.findFirst({ where: { upisId, skinutoAt: null }, select: { id: true } });
  return !!z;
}

/**
 * Predlog za upis gazdinstva iz modula gazdinstava: korisnik je NOSILAC odobrenog
 * gazdinstva sa BPG-om. Vraća samo njegove sopstvene podatke.
 */
export async function predlogIzGazdinstva(userId: string) {
  const c = await prisma.clanGazdinstva.findFirst({
    where: {
      userId,
      uloga: "NOSILAC",
      status: "ODOBREN",
      gazdinstvo: { status: "ODOBRENO", bpg: { not: null } },
    },
    select: {
      gazdinstvo: { select: { id: true, naziv: true, bpg: true, naselje: true, adresa: true, lat: true, lng: true } },
    },
  });
  if (!c) return null;
  const g = c.gazdinstvo;
  return { gazdinstvoId: g.id, naziv: g.naziv, bpg: g.bpg!, naselje: g.naselje, adresa: g.adresa, lat: g.lat, lng: g.lng };
}

/**
 * Upis (čl. 16–17). `potvrdaTekst` je tekst potvrde o evidentiranju koji je
 * korisniku bio prikazan — ruta ga sklapa na serveru iz istog ključa i on se SNIMA.
 */
export async function upisiPokrovitelja(
  userId: string,
  body: Record<string, unknown>,
  p: { mesto: string | null; logoUrl: string | null; potvrdaTekst: string },
) {
  const korisnik = await prisma.user.findUnique({
    where: { id: userId },
    select: { verified: true, maloletan: true, deaktiviranAt: true },
  });
  if (!korisnik || korisnik.deaktiviranAt) throw new UpisGreska("Korisnik nije pronađen.", 404);
  // Maloletni korisnik upis ne vrši (čl. 16 st. 1); potvrđeno dete ima `verified`.
  if (korisnik.maloletan) throw new UpisGreska("Upis pokrovitelja ne vrši maloletni korisnik.", 403);
  // 🔴 Potvrda stvarnosti NIJE uslov za upis (set 4.8.0): novčano pokroviteljstvo je
  // jedan od dva puta kojim nov član postaje potvrđen (dokaz stvarnosti čl. 8 st. 1 t. 3).
  // Pokroviteljstvo dobrima i uslugama i dalje traži potvrdu (ruta `dobra`).

  const r = procitajUpis(body);
  if (!r.ok) throw new UpisGreska(r.razlog);
  const d = r.podaci;
  if (!p.mesto) throw new UpisGreska("Izaberi mesto iz spiska.");
  // Logotip nije obavezan (donacije čl. 16 st. 5, odluka vlasnika 24.10.2026): bez njega se prikazuje samo naziv.
  if (!p.potvrdaTekst.trim()) throw new UpisGreska("Potrebna je potvrda da si upoznat sa načinom evidentiranja doprinosa.");
  if (await vecUpisan(d)) throw new UpisGreska(PORUKA_VEC_UPISAN, 409);

  // Gazdinstvo iz modula: veza samo kad ga korisnik vodi kao nosilac i BPG se poklapa.
  let gazdinstvoId: string | null = null;
  if (d.vrsta === "GAZDINSTVO" && typeof body.gazdinstvoId === "string") {
    const predlog = await predlogIzGazdinstva(userId);
    if (predlog && predlog.gazdinstvoId === body.gazdinstvoId && predlog.bpg === d.bpg) gazdinstvoId = predlog.gazdinstvoId;
  }

  const sada = new Date();
  let upis: { id: string };
  try {
    upis = await prisma.upisPokrovitelja.create({
      data: {
        vrsta: d.vrsta,
        vlasnikUserId: userId,
        naziv: d.naziv,
        pravniOblik: d.pravniOblik,
        adresaSedista: d.adresaSedista,
        maticniBroj: d.maticniBroj,
        pib: d.pib,
        bpg: d.bpg,
        gazdinstvoId,
        imePrezime: d.imePrezime,
        zastupnikFunkcija: d.zastupnikFunkcija,
        odnosPremaDavaocu: d.odnosPremaDavaocu,
        kontaktEmail: d.kontaktEmail,
        kontaktTelefon: d.kontaktTelefon,
        logoUrl: p.logoUrl,
        mapaMesto: p.mesto,
        mapaAdresa: d.mapaAdresa,
        mapaLat: d.mapaLat,
        mapaLng: d.mapaLng,
        izjavaAdresaAt: sada,
        izjavaOvlascenjaAt: d.izjavaOvlascenja ? sada : null,
        potvrdaEvidentiranjaAt: sada,
        potvrdaEvidentiranjaTekst: p.potvrdaTekst,
      },
      select: { id: true },
    });
  } catch (e) {
    // Delimičan jedinstveni indeks (MB, BPG) — istovremen dvostruki upis.
    if (jeDvostrukiKljuc(e)) throw new UpisGreska(PORUKA_VEC_UPISAN, 409);
    throw e;
  }
  void posaljiAdminAlert("Nov upis pokrovitelja na proveri", `Pokrovitelj: ${d.naziv}`);
  return upis;
}

/** Upisi koje korisnik vodi (i obrisani — radi zahteva za uklanjanje sa rang-liste). */
export async function mojiUpisi(userId: string) {
  const redovi = await prisma.upisPokrovitelja.findMany({
    where: { vlasnikUserId: userId, uklonjenSaRangListeAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, vrsta: true, status: true, naziv: true, logoUrl: true, izmenaPodnetaAt: true, obrisanAt: true,
      odbijenoRazlog: true,
    },
  });
  return redovi.map((u) => ({
    ...u,
    izmenaPodnetaAt: u.izmenaPodnetaAt?.toISOString() ?? null,
    obrisanAt: u.obrisanAt?.toISOString() ?? null,
  }));
}

/** Upis za korisnika koji ga vodi; tuđ ili nepostojeći → 404. */
export async function upisVlasnika(id: string, userId: string) {
  const u = await prisma.upisPokrovitelja.findUnique({ where: { id } });
  if (!u || u.vlasnikUserId !== userId) throw new UpisGreska("Upis nije pronađen.", 404);
  return u;
}

/**
 * Izmena upisa (čl. 18 st. 2). Kontakt, sedište i mapa važe odmah. Naziv, MB i
 * logotip: dok upis nije odobren — menjaju se odmah (upis je ionako na proveri;
 * odbijen upis se time ponovo šalje na proveru); kod odobrenog upisa idu na
 * ponovnu proveru, a do odluke važe ranije odobrene vrednosti.
 */
export async function izmeniUpis(id: string, userId: string, body: Record<string, unknown>, mesto: string | null) {
  const u = await upisVlasnika(id, userId);
  if (u.obrisanAt) throw new UpisGreska("Upis je obrisan.", 409);
  const r = razvrstajIzmenu(body, u, mesto);
  if (!r.ok) throw new UpisGreska(r.razlog);
  const { odmah, naProveru } = r.izmena;
  const sada = new Date();
  if (naProveru.maticniBroj && (await vecUpisan({ maticniBroj: naProveru.maticniBroj }, u.id)))
    throw new UpisGreska(PORUKA_VEC_UPISAN, 409);

  const imaProveru = Object.keys(naProveru).length > 0;
  const odmahSaIzjavom = odmah.mapaAdresa ? { ...odmah, izjavaAdresaAt: sada } : odmah;
  try {
    if (u.status === "ODOBREN") {
      await prisma.upisPokrovitelja.update({
        where: { id },
        data: {
          ...odmahSaIzjavom,
          ...(imaProveru
            ? {
                izmenaNaziv: naProveru.naziv ?? null,
                izmenaMaticniBroj: naProveru.maticniBroj ?? null,
                izmenaLogoUrl: naProveru.logoUrl ?? null,
                izmenaPodnetaAt: sada,
                izmenaOdbijenaRazlog: null,
              }
            : {}),
        },
      });
      if (imaProveru) void posaljiAdminAlert("Izmena upisa pokrovitelja na proveri", `Pokrovitelj: ${u.naziv}`);
    } else {
      await prisma.upisPokrovitelja.update({
        where: { id },
        data: {
          ...odmahSaIzjavom,
          ...naProveru,
          // Odbijen upis se ispravkom ponovo šalje na proveru (čl. 18 st. 1).
          ...(u.status === "ODBIJEN" ? { status: "NA_PROVERI" as const, odbijenoRazlog: null } : {}),
        },
      });
    }
  } catch (e) {
    if (jeDvostrukiKljuc(e)) throw new UpisGreska(PORUKA_VEC_UPISAN, 409);
    throw e;
  }
}

/**
 * Brisanje upisa (čl. 18 st. 4) — samo korisnik koji vodi upis, i samo kad
 * pokrovitelj nema ugovor sa neiskorišćenim vaučerima. Prestaju prikaz na mapi i
 * ponuda vaučera; ugovori i registar ostaju. Prijave koje još nisu potpisane se
 * povlače, a ovlašćenja zaposlenih prestaju. Doprinosi ostaju na rang-listi, osim
 * kad korisnik zatraži i uklanjanje sa nje (`ukloniSaRangListe`).
 */
export async function obrisiUpis(id: string, userId: string, ukloniSaRangListe: boolean) {
  const u = await upisVlasnika(id, userId);
  if (u.obrisanAt) {
    if (ukloniSaRangListe) await ukloniUpisSaRangListe(id, userId);
    return;
  }
  const sada = new Date();
  const vauceri = await prisma.vaucer.findMany({
    where: { ugovor: { upisId: id } },
    select: { status: true, ugovor: { select: { status: true, vaziDo: true } } },
  });
  const smem = smeObrisatiUpis(vauceri, sada);
  if (!smem.ok) throw new UpisGreska(smem.razlog, 409);

  await prisma.$transaction(async (tx) => {
    const r = await tx.upisPokrovitelja.updateMany({
      where: { id, obrisanAt: null },
      data: {
        obrisanAt: sada,
        izmenaNaziv: null, izmenaMaticniBroj: null, izmenaLogoUrl: null, izmenaPodnetaAt: null,
        ...(ukloniSaRangListe ? { uklonjenSaRangListeAt: sada } : {}),
      },
    });
    if (r.count !== 1) throw new UpisGreska("Upis je već obrisan.", 409);
    await tx.ugovorDobra.updateMany({
      where: { upisId: id, status: { in: ["NA_PREGLEDU", "CEKA_POTPIS"] } },
      data: { status: "ODBIJEN", odbijenoRazlog: "Upis pokrovitelja je obrisan.", potpisKodHash: null, potpisKodIstice: null },
    });
    await tx.pokroviteljPrijava.updateMany({
      where: { upisId: id, status: "CEKA_POTPIS" },
      data: { status: "ODBIJENA", odbijenoRazlog: "Upis pokrovitelja je obrisan." },
    });
    await tx.davalacZaposleni.updateMany({
      where: { upisId: id, opozvanAt: null },
      data: { opozvanAt: sada, opozvanRazlog: "BRISANJE_UPISA" },
    });
  });
}

/** Na zahtev korisnika koji je vodio upis — pokrovitelj se uklanja i sa rang-liste (čl. 18 st. 4). */
export async function ukloniUpisSaRangListe(id: string, userId: string) {
  const u = await upisVlasnika(id, userId);
  if (!u.obrisanAt) throw new UpisGreska("Sa rang-liste se uklanja obrisan upis — prvo obriši upis.", 409);
  await prisma.upisPokrovitelja.updateMany({
    where: { id, uklonjenSaRangListeAt: null },
    data: { uklonjenSaRangListeAt: new Date() },
  });
}

/** Gašenje naloga: upisi koji se smeju obrisati se brišu (prestaje prikaz na mapi). Ne baca. */
export async function obrisiUpisePriGasenjuNaloga(userId: string) {
  try {
    const upisi = await prisma.upisPokrovitelja.findMany({
      where: { vlasnikUserId: userId, obrisanAt: null },
      select: { id: true },
    });
    for (const u of upisi) {
      try {
        await obrisiUpis(u.id, userId, false);
      } catch {
        // Upis sa neiskorišćenim vaučerima ostaje — vaučeri moraju moći da se iskoriste.
      }
    }
  } catch (e) {
    console.error("[upis-pokrovitelja] brisanje upisa pri gašenju naloga nije uspelo", userId, e);
  }
}

// ─── Fondacija (čl. 18 st. 1 i 2) ────────────────────────────────────────────

/** Upisi za administratorski tim. Ovde (i samo ovde) idu MB, PIB, BPG, ime i kontakt. */
export async function listaUpisaZaAdmina() {
  const redovi = await prisma.upisPokrovitelja.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 300,
    include: {
      vlasnik: { select: { pseudonim: true } },
      zabrane: { where: { skinutoAt: null }, select: { id: true } },
    },
  });
  return redovi.map((u) => ({
    id: u.id,
    vrsta: u.vrsta,
    status: u.status,
    vlasnikPseudonim: u.vlasnik.pseudonim,
    naziv: u.naziv,
    pravniOblik: u.pravniOblik,
    adresaSedista: u.adresaSedista,
    maticniBroj: u.maticniBroj,
    pib: u.pib,
    bpg: u.bpg,
    imePrezime: u.imePrezime,
    zastupnikFunkcija: u.zastupnikFunkcija,
    odnosPremaDavaocu: u.odnosPremaDavaocu,
    kontaktEmail: u.kontaktEmail,
    kontaktTelefon: u.kontaktTelefon,
    logoUrl: u.logoUrl,
    mapaMesto: u.mapaMesto,
    mapaAdresa: u.mapaAdresa,
    izjavaAdresaAt: u.izjavaAdresaAt?.toISOString() ?? null,
    izjavaOvlascenjaAt: u.izjavaOvlascenjaAt?.toISOString() ?? null,
    potvrdaEvidentiranjaAt: u.potvrdaEvidentiranjaAt?.toISOString() ?? null,
    aprProveraAt: u.aprProveraAt?.toISOString() ?? null,
    odbijenoRazlog: u.odbijenoRazlog,
    izmenaNaziv: u.izmenaNaziv,
    izmenaMaticniBroj: u.izmenaMaticniBroj,
    izmenaLogoUrl: u.izmenaLogoUrl,
    izmenaPodnetaAt: u.izmenaPodnetaAt?.toISOString() ?? null,
    obrisanAt: u.obrisanAt?.toISOString() ?? null,
    uklonjenSaRangListeAt: u.uklonjenSaRangListeAt?.toISOString() ?? null,
    naListiZabrane: u.zabrane.length > 0,
    createdAt: u.createdAt.toISOString(),
  }));
}

/**
 * Odobrenje upisa (čl. 18 st. 1). 🔴 Za pravno lice i preduzetnika obavezna je
 * izričita potvrda da su naziv, MB i zastupnik upoređeni sa registrom privrednih
 * subjekata; beleži se samo DA je poređenje izvršeno. Gazdinstvo se ne poredi sa
 * APR-om (Fondacija može zatražiti potvrdu o upisu u registar kad za to postoji razlog).
 */
export async function odobriUpis(id: string, adminId: string, potvrde: { aprUporedjeno: boolean }) {
  const u = await prisma.upisPokrovitelja.findUnique({ where: { id } });
  if (!u) throw new UpisGreska("Upis nije pronađen.", 404);
  if (u.obrisanAt) throw new UpisGreska("Upis je obrisan.", 409);
  const firma = u.vrsta === "FIRMA";
  if (firma && !potvrde.aprUporedjeno)
    throw new UpisGreska("Pre odobrenja potvrdi da se naziv, matični broj i zastupnik poklapaju sa registrom (APR).");
  if (u.status !== "NA_PROVERI") throw new UpisGreska("Upis je već obrađen.", 409);
  const sada = new Date();
  const r = await prisma.upisPokrovitelja.updateMany({
    where: { id, status: "NA_PROVERI", obrisanAt: null },
    data: {
      status: "ODOBREN", odlukaAt: sada, odlukaAdminId: adminId, odbijenoRazlog: null,
      ...(firma ? { aprProveraAt: sada, aprProverioId: adminId } : {}),
    },
  });
  if (r.count === 0) throw new UpisGreska("Upis je već obrađen.", 409);
  await logAdminAkcija(adminId, "UPIS_POKROVITELJA_ODOBREN", id, firma ? "poređenje sa registrom izvršeno" : "gazdinstvo");
  await obavesti(u.vlasnikUserId, {
    tip: "upis_pokrovitelja",
    kljuc: "notifikacije.upis_pokrovitelja_odobren",
    parametri: { naziv: u.naziv },
    naslov: "Upis pokrovitelja je odobren",
    tekst: `Fondacija je odobrila upis „${u.naziv}". Sada možeš da podneseš prijavu pokroviteljstva.`,
    link: `/postani-pokrovitelj/${id}`,
  });
}

export async function odbijUpis(id: string, adminId: string, razlog: string) {
  const r0 = typeof razlog === "string" ? razlog.trim() : "";
  if (r0.length < 5) throw new UpisGreska("Obrazloženje je obavezno.");
  const u = await prisma.upisPokrovitelja.findUnique({ where: { id }, select: { vlasnikUserId: true, naziv: true, status: true } });
  if (!u) throw new UpisGreska("Upis nije pronađen.", 404);
  const r = await prisma.upisPokrovitelja.updateMany({
    where: { id, status: "NA_PROVERI" },
    data: { status: "ODBIJEN", odbijenoRazlog: r0, odlukaAt: new Date(), odlukaAdminId: adminId },
  });
  if (r.count === 0) throw new UpisGreska("Upis je već obrađen.", 409);
  await logAdminAkcija(adminId, "UPIS_POKROVITELJA_ODBIJEN", id, r0);
  await obavesti(u.vlasnikUserId, {
    tip: "upis_pokrovitelja",
    kljuc: "notifikacije.upis_pokrovitelja_odbijen",
    parametri: { naziv: u.naziv, razlog: r0 },
    naslov: "Upis pokrovitelja je odbijen",
    tekst: `Upis „${u.naziv}" je odbijen. Razlog: ${r0}`,
    link: `/postani-pokrovitelj/${id}`,
  });
}

/** Odobrenje izmene naziva, MB odnosno logotipa (čl. 18 st. 2) — uz poređenje sa registrom kad se menja naziv ili MB firme. */
export async function odobriIzmenuUpisa(id: string, adminId: string, potvrde: { aprUporedjeno: boolean }) {
  const u = await prisma.upisPokrovitelja.findUnique({ where: { id } });
  if (!u || !u.izmenaPodnetaAt) throw new UpisGreska("Izmena nije pronađena.", 404);
  const menjaRegistar = u.vrsta === "FIRMA" && (u.izmenaNaziv || u.izmenaMaticniBroj);
  if (menjaRegistar && !potvrde.aprUporedjeno)
    throw new UpisGreska("Pre odobrenja potvrdi da se novi naziv odnosno matični broj poklapaju sa registrom (APR).");
  if (u.izmenaMaticniBroj && (await vecUpisan({ maticniBroj: u.izmenaMaticniBroj }, u.id)))
    throw new UpisGreska(PORUKA_VEC_UPISAN, 409);
  const sada = new Date();
  await prisma.upisPokrovitelja.update({
    where: { id },
    data: {
      ...(u.izmenaNaziv ? { naziv: u.izmenaNaziv } : {}),
      ...(u.izmenaMaticniBroj ? { maticniBroj: u.izmenaMaticniBroj } : {}),
      ...(u.izmenaLogoUrl ? { logoUrl: u.izmenaLogoUrl } : {}),
      ...(menjaRegistar ? { aprProveraAt: sada, aprProverioId: adminId } : {}),
      izmenaNaziv: null, izmenaMaticniBroj: null, izmenaLogoUrl: null, izmenaPodnetaAt: null, izmenaOdbijenaRazlog: null,
    },
  });
  await logAdminAkcija(adminId, "UPIS_POKROVITELJA_IZMENA_ODOBRENA", id, menjaRegistar ? "poređenje sa registrom izvršeno" : "");
  await obavesti(u.vlasnikUserId, {
    tip: "upis_pokrovitelja",
    kljuc: "notifikacije.upis_pokrovitelja_izmena_odobrena",
    parametri: { naziv: u.izmenaNaziv ?? u.naziv },
    naslov: "Izmena upisa pokrovitelja je odobrena",
    tekst: `Fondacija je odobrila izmenu upisa „${u.izmenaNaziv ?? u.naziv}".`,
    link: `/postani-pokrovitelj/${id}`,
  });
}

export async function odbijIzmenuUpisa(id: string, adminId: string, razlog: string) {
  const r0 = typeof razlog === "string" ? razlog.trim() : "";
  if (r0.length < 5) throw new UpisGreska("Obrazloženje je obavezno.");
  const u = await prisma.upisPokrovitelja.findUnique({ where: { id }, select: { vlasnikUserId: true, naziv: true, izmenaPodnetaAt: true } });
  if (!u || !u.izmenaPodnetaAt) throw new UpisGreska("Izmena nije pronađena.", 404);
  await prisma.upisPokrovitelja.update({
    where: { id },
    data: { izmenaNaziv: null, izmenaMaticniBroj: null, izmenaLogoUrl: null, izmenaPodnetaAt: null, izmenaOdbijenaRazlog: r0 },
  });
  await logAdminAkcija(adminId, "UPIS_POKROVITELJA_IZMENA_ODBIJENA", id, r0);
  await obavesti(u.vlasnikUserId, {
    tip: "upis_pokrovitelja",
    kljuc: "notifikacije.upis_pokrovitelja_izmena_odbijena",
    parametri: { naziv: u.naziv, razlog: r0 },
    naslov: "Izmena upisa pokrovitelja je odbijena",
    tekst: `Izmena upisa „${u.naziv}" je odbijena; važe ranije odobreni podaci. Razlog: ${r0}`,
    link: `/postani-pokrovitelj/${id}`,
  });
}

// ─── Mapa (čl. 26 st. 2; gazdinstva čl. 19) ─────────────────────────────────

export type TackaPokroviteljaSaVaucerima = TackaPokrovitelja & {
  /** Broj slobodnih vaučera važećih ugovora — 🔴 nikad POEN ni dinari. */
  vauceri: number;
  /** Gazdinstvo iz modula gazdinstava sa kojim je upis povezan (spaja se u jednu tačku). */
  gazdinstvoId: string | null;
  /** Firma ili gazdinstvo — spisak „Firme" nosi samo firme. */
  vrsta: "FIRMA" | "GAZDINSTVO";
};

/**
 * Pokrovitelji za javnu mapu: odobreni, neobrisani upisi sa tačkom i izjavom o
 * adresi. Uz svaku tačku samo naziv, logotip, mesto, adresa i broj slobodnih
 * vaučera (čl. 26 st. 2: „uz ponudu vaučera"). 🔴 Bez MB, PIB, BPG, imena i kontakta.
 */
export async function pokroviteljiZaMapu(): Promise<TackaPokroviteljaSaVaucerima[]> {
  const sada = new Date();
  const upisi = await prisma.upisPokrovitelja.findMany({
    where: { status: "ODOBREN", obrisanAt: null, mapaLat: { not: null }, mapaLng: { not: null }, izjavaAdresaAt: { not: null } },
    select: {
      id: true, vrsta: true, status: true, obrisanAt: true, naziv: true, logoUrl: true, gazdinstvoId: true,
      mapaMesto: true, mapaAdresa: true, mapaLat: true, mapaLng: true, izjavaAdresaAt: true,
    },
  });
  const ids = upisi.map((u) => u.id);
  const slobodni = ids.length
    ? await prisma.vaucer.findMany({
        where: { status: "SLOBODAN", ugovor: { upisId: { in: ids }, status: "POTPISAN", vaziDo: { gt: sada } } },
        select: { status: true, ugovor: { select: { upisId: true, status: true, vaziDo: true } } },
      })
    : [];
  const izlaz: TackaPokroviteljaSaVaucerima[] = [];
  for (const u of upisi) {
    const t = javniPrikazUpisa(u);
    if (!t) continue;
    izlaz.push({
      ...t,
      vauceri: slobodni.filter((v) => v.ugovor.upisId === u.id && jeNeiskoriscenVaucer(v, sada)).length,
      gazdinstvoId: u.gazdinstvoId,
      vrsta: u.vrsta,
    });
  }
  return izlaz;
}
