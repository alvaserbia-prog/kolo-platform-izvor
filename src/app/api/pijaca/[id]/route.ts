import { NextRequest, NextResponse } from "next/server";
import { probajEvidentiratiGazdinstvo } from "@/lib/protokol/gazdinstvo";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sacuvajNaR2, obrisiSaR2, r2Konfigurisan } from "@/lib/skladiste";
import { MAX_PO_SLICI, MAX_SLIKA } from "@/lib/slika-upload";
import { parsirajCenu } from "@/lib/cena-oglas";
import { razresiNaselje, PORUKA_MESTO_IZ_SPISKA } from "@/lib/naselje";
import { oglasIspunjavaMinimum, smeDaPostaviOglas, zabeleziDoprinos } from "@/lib/protokol/doprinos-sadrzaju";
import {
  IZBOR_UCESNIKA,
  smeDaVidiOglas,
  smeObjavitiOglas,
  smeVidetiPseudonimOglasivaca,
  stanjeNaloga,
  ucesnikIzReda,
  ucitajUcesnika,
} from "@/lib/protokol/deca";
import { idPrijatelja } from "@/lib/protokol/prijateljstva";
import { PORUKA_CEKA_RODITELJA, PORUKA_NIJE_DETE_KOLA } from "@/lib/deca-pravila";
import { jeAdmin, smeProsireno } from "@/lib/dozvole";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const MAX_IMAGES = MAX_SLIKA;
const MAX_SIZE = MAX_PO_SLICI;

// GET /api/pijaca/[id] — jedan oglas
// Pregled oglasa je javan (Pravilnik čl. 16), ali kontakt oglašivača (telefon)
// vidi samo verifikovani korisnik.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id },
    include: {
      seller: { select: { ...IZBOR_UCESNIKA, pseudonim: true, verified: true } },
    },
  });
  if (!listing) return await greska("Oglas nije pronađen.", 404);

  // Vidljivost oglasa maloletnog korisnika (Modul Deca, čl. 13).
  //
  // 🔴 404, ne 403: status 403 bi potvrdio da oglas postoji, a time i da postoji
  // dete koje ga je objavilo — što je upravo ono što se skriva.
  const posmatrac = session ? await ucitajUcesnika(session.user.id) : null;
  const smem = smeDaVidiOglas(
    posmatrac ? { ...posmatrac, admin: jeAdmin(session?.user) } : null,
    ucesnikIzReda(listing.seller),
  );
  if (!smem) return await greska("Oglas nije pronađen.", 404);

  // Dete sa roditeljem oglas vidi BEZ pseudonima oglašivača, osim oglasa svojih
  // prijatelja (Pravilnik o učešću dece čl. 4c t. 2, 13 st. 4).
  const prijatelji =
    posmatrac?.maloletan && posmatrac.stanje === "POVEZANO" ? await idPrijatelja(posmatrac.id) : [];
  const vidiPseudonim = smeVidetiPseudonimOglasivaca(posmatrac, listing.sellerId, prijatelji);

  // Trag uklanjanja se ne prosipa u javni odgovor: razlog je saopštenje vlasniku
  // (Uslovi čl. 25 st. 2), a ne podatak o kom se obaveštava svet. `uklonioId`
  // ne izlazi nikome — ko je odlučio je stvar audit loga, ne javnog API-ja.
  const { uklonjenRazlog, uklonioId: _uklonioId, seller: _seller, ...javno } = listing;
  const jeVlasnik = listing.sellerId === session?.user?.id;

  return NextResponse.json({
    listing: {
      ...javno,
      // Prodavac se sastavlja izričito: `...listing` bi prosuo roditelje i stanje
      // prekidača iz čl. 10, koji nikoga sa strane ne zanimaju i ne smeju napolje.
      seller: {
        pseudonim: vidiPseudonim ? listing.seller.pseudonim : null,
        verified: listing.seller.verified,
        maloletan: listing.seller.maloletan,
      },
      phone: session?.user?.verified ? listing.phone : null,
      uklonjenRazlog: jeVlasnik ? uklonjenRazlog : null,
    },
  });
}

// PATCH /api/pijaca/[id] — uredi ili deaktiviraj oglas (samo prodavac)
// Prima multipart/form-data ili application/json (za deaktivaciju)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const { id } = await params;
  const listing = await prisma.marketplaceListing.findUnique({ where: { id } });
  if (!listing) return await greska("Oglas nije pronađen.", 404);
  if (listing.sellerId !== session.user.id)
    return await greska("Nemaš pravo da menjaš ovaj oglas.", 403);

  const contentType = req.headers.get("content-type") ?? "";

  // Arhiviranje i vraćanje iz arhive dolaze kao JSON. U arhivi su oglasi koje je
  // oglašivač sam sklonio (EXPIRED) i zatečeni razmenjeni (RAZMENJEN).
  if (contentType.includes("application/json")) {
    const body = await req.json();
    if (body.akcija === "deaktiviraj") {
      if (listing.status !== "ACTIVE") return await greska("Oglas nije aktivan.", 400);
      await prisma.marketplaceListing.update({ where: { id }, data: { status: "EXPIRED" } });
      return NextResponse.json({ ok: true });
    }
    if (body.akcija === "aktiviraj") {
      // 🔴 Oglas koji je uklonila Fondacija (UKLONJEN) se ne vraća — uklanjanje je
      // njena odluka (Uslovi čl. 25 st. 2), ne oglašivačeva arhiva.
      if (listing.status !== "EXPIRED" && listing.status !== "RAZMENJEN")
        return await greska("Ovaj oglas ne može da se vrati iz arhive.", 400);
      // Vraćen oglas ponovo stoji na Pijaci, pa prolazi ISTE uslove objave kao
      // nov (POST /api/pijaca): nalog koji čeka roditelja ne objavljuje, a nov
      // član ima najviše tri aktivna oglasa i samo ponudu — inače bi se arhiva
      // koristila da se zaobiđe kapa.
      // Oglas objavljuje samo dete Kola (Pravilnik o učešću dece čl. 13 st. 4).
      const stanje = await stanjeNaloga(session.user.id);
      if (stanje === "NA_CEKANJU") return await greska(PORUKA_CEKA_RODITELJA, 403);
      if (!smeObjavitiOglas(stanje)) return await greska(PORUKA_NIJE_DETE_KOLA, 403);
      const korisnik = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { verified: true, maloletan: true },
      });
      if (!korisnik) return await greska("Nalog ne postoji.", 401);
      const punaPravaObjave =
        smeProsireno({ verified: korisnik.verified }) ||
        korisnik.maloletan;
      const smem = smeDaPostaviOglas({
        verifikovan: punaPravaObjave,
        oglas: {
          tip: listing.tip,
          title: listing.title,
          description: listing.description,
          category: listing.category,
          location: listing.location,
          images: listing.images,
        },
      });
      if (!smem.ok) return await greska(smem.razlog, smem.status);
      // Menja se samo status; zatečeni `razmenjenoAt`/`primalacId` ostaju kao zapis.
      await prisma.marketplaceListing.update({ where: { id }, data: { status: "ACTIVE" } });
      return NextResponse.json({ ok: true });
    }
    return await greska("Nepoznata akcija.", 400);
  }

  if (listing.status !== "ACTIVE")
    return await greska("Oglas nije aktivan.", 400);

  // Izmena oglasa dolazi kao multipart/form-data
  try {
    const fd = await req.formData();

    const title = (fd.get("title") as string)?.trim();
    const description = (fd.get("description") as string)?.trim() ?? "";
    const priceRaw = fd.get("price") as string;
    const cenaDoRaw = fd.get("cenaDo") as string;
    const cenaTipRaw = fd.get("cenaTip") as string;
    const location = (fd.get("location") as string)?.trim() ?? "";
    const phone = (fd.get("phone") as string)?.trim() ?? "";
    const keepRaw = (fd.get("keepImages") as string) ?? "[]";

    if (!title || title.length < 3)
      return await greska("Naslov mora imati najmanje 3 znaka.", 400);
    if (title.length > 120 || description.length > 4000 || location.length > 80 || phone.length > 40)
      return await greska("Neko polje premašuje dozvoljenu dužinu.", 400);
    // Novo mesto mora biti JEDNO naselje iz šifarnika; zatečena vrednost oglasa
    // upisanog dok je polje bilo slobodan tekst se propušta neizmenjena, da izmena
    // cene ili slika ne padne zbog stare lokacije.
    let mesto: string | null = null;
    if (location) {
      mesto = location === listing.location ? location : razresiNaselje(location);
      if (!mesto) return await greska(PORUKA_MESTO_IZ_SPISKA, 400);
    }
    const cena = parsirajCenu(cenaTipRaw, priceRaw, cenaDoRaw);
    if (!cena.ok)
      return await greska(cena.error, 400);

    // keepImages — niz indeksa postojećih slika koje treba zadržati. Validiramo da je
    // zaista niz brojeva (ne pada na neispravnom JSON-u, ne prihvata ne-niz vrednosti).
    let keepParsed: unknown;
    try { keepParsed = JSON.parse(keepRaw); } catch { keepParsed = []; }
    const keepIndices: number[] = Array.isArray(keepParsed)
      ? keepParsed.filter((x): x is number => Number.isInteger(x))
      : [];
    const zadrzaneSlike = listing.images.filter((_, i) => keepIndices.includes(i));
    const uklonjeneSlike = listing.images.filter((_, i) => !keepIndices.includes(i));

    // Neverifikovanom oglašivaču sadržinski minimum važi i pri IZMENI, ne samo pri
    // objavi — inače bi se zaobišao u dva poteza: objavi pun oglas, pa mu skini
    // slike i skrati opis. Proverava se PRE slanja na R2, da odbijena izmena ne
    // ostavi datoteke za sobom. (Smer oglasa se ovom rutom uopšte ne menja, pa
    // neverifikovani ne može ni da prebaci sopstvenu ponudu u potražnju.)
    const ukupno = zadrzaneSlike.length;
    const brojNovih = Array.from({ length: MAX_IMAGES - ukupno }, (_, i) =>
      fd.get(`nova_slika_${i}`) as File | null,
    ).filter((f) => f && f.size > 0).length;

    const vlasnik = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { verified: true, maloletan: true },
    });
    // Sadržinski minimum se pri IZMENI proverava iz istog razloga iz kog i pri
    // objavi — inače se zaobilazi u dva poteza. Maloletni korisnik je iz njega
    // izuzet kao i potvrđeni (Modul Deca, čl. 13 st. 1: isti uslovi objave,
    // razlikuje se samo vidljivost).
    if (!vlasnik?.verified && !vlasnik?.maloletan) {
      const minimum = oglasIspunjavaMinimum({
        tip: listing.tip,
        title,
        description,
        category: listing.category,
        location: mesto,
        images: Array(ukupno + brojNovih).fill(""),
      });
      if (!minimum.ok) return await greska(minimum.razlog, minimum.status);
    }

    // Nove slike — R2 u produkciji, fallback na lokalni disk za dev. Na
    // serverless-u je disk samo za čitanje, pa nepodešeno skladište mora da se
    // kaže rečenicom, a ne da stigne kao EROFS iz `writeFile`.
    const useR2 = r2Konfigurisan();
    const imaNovih = Array.from({ length: MAX_IMAGES - ukupno }, (_, i) =>
      fd.get(`nova_slika_${i}`) as File | null,
    ).some((f) => f && f.size > 0);
    if (!useR2 && imaNovih && process.env.VERCEL)
      return await greska("Skladište slika nije konfigurisano (Cloudflare R2).", 503);
    const noveSlike: string[] = [];
    for (let i = 0; i < MAX_IMAGES - ukupno; i++) {
      const file = fd.get(`nova_slika_${i}`) as File | null;
      if (!file || file.size === 0) continue;
      if (file.size > MAX_SIZE)
        return await greska("Slika je prevelika (max 5MB).", 400);
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type))
        return await greska(
          "Slika mora biti JPG, PNG ili WebP. Fotografiju sa iPhone-a (HEIC) sačuvaj kao JPG.",
          400,
        );

      const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
      const fname = `${randomUUID()}${ext}`;
      if (useR2) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const url = await sacuvajNaR2(`oglasi/${id}/${fname}`, buffer, file.type);
        noveSlike.push(url);
      } else {
        const dir = path.join(process.cwd(), "storage", "oglasi", id);
        await mkdir(dir, { recursive: true });
        await writeFile(path.join(dir, fname), Buffer.from(await file.arrayBuffer()));
        noveSlike.push(`storage/oglasi/${id}/${fname}`);
      }
    }

    // Best-effort brisanje uklonjenih slika sa R2 (legacy/lokalne se preskaču).
    for (const url of uklonjeneSlike) await obrisiSaR2(url);

    await prisma.marketplaceListing.update({
      where: { id },
      data: {
        title,
        description,
        cenaTip: cena.cenaTip,
        price: cena.price,
        cenaDo: cena.cenaDo,
        location: mesto,
        phone: phone || null,
        images: [...zadrzaneSlike, ...noveSlike],
      },
    });

    // Doprinos sadržaju platforme (čl. 40a) i pri IZMENI, ne samo pri objavi.
    //
    // 🔴 Bez ovoga oglas koji u trenutku objave nije ispunjavao sadržinski minimum
    // (potvrđenom članu se minimum pri objavi ne proverava, pa mu oglas bez
    // fotografije prolazi) nikad ne bi ušao u red čekanja — dopuna izmenom ga ne bi
    // vratila. Isto je važilo i posle odbijanja, iako obaveštenje koje korisnik tada
    // dobije izričito kaže: „Kad ga dopuniš ili objaviš bolji, doprinos se ponovo
    // razmatra." Kod je to obećanje ispunjavao samo za „objavi bolji".
    //
    // Jednokratnost kanala i dalje drži BAZA (`DoprinosSadrzaju.userId @unique`), ne
    // ovaj poziv: ko doprinos već ima — zabeležen ili evidentiran — dobija P2002 i
    // funkcija tiho vraća `false`. Sama proverava tip oglasa, minimum i maloletstvo,
    // pa se ti uslovi ovde ne dupliraju. Van transakcije je i ne baca — evidentiranje
    // vodi u `emitujPoen()`, koji otvara sopstvenu.
    await zabeleziDoprinos(session.user.id, {
      id,
      tip: listing.tip,
      title,
      description,
      category: listing.category,
      location: mesto,
      images: [...zadrzaneSlike, ...noveSlike],
    });
    // Dopunjen oglas može da ispuni i uslov doprinosa gazdinstva (čl. 40c st. 4). Ne baca.
    await probajEvidentiratiGazdinstvo(session.user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/pijaca/[id]]", err);
    return await greska("Interna greška servera.", 500);
  }
}
