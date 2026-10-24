import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { sesija } from "@/lib/sesija";
import { prisma } from "@/lib/prisma";
import { mozeNadzor } from "@/lib/dozvole";
import { izracunajDnevniBrojeve, izracunajNadzorBroj } from "@/lib/chrome-podaci";
import { pristanakStatus } from "@/lib/politika";
import { stanjeNaloga } from "@/lib/protokol/deca";
import { prevedi, type Parametri } from "@/lib/prevod-servera";
import { getLocale } from "next-intl/server";

/**
 * GET /api/me — KONSOLIDOVAN endpoint za ceo „chrome" (Header + Sidebar).
 *
 * Ranije je svaka navigacija palila ~6 odvojenih API poziva (balans, dnevni-
 * brojevi, nadzor, poruke/brojac, notifikacije, politika), svaki kao zasebna
 * serverless invokacija sa svojom proverom sesije. Ovde se sve to računa u
 * JEDNOM zahtevu, sa upitima u paraleli. Klijent (`MeProvider`) ovo zove jednom
 * pri mountu i potom na 30s poll, umesto šest nezavisnih fetch-eva.
 */
export async function GET() {
  const session = await sesija();
  if (!session) return await greska("Unauthorized", 401);

  const meId = session.user.id;
  const nadzornik = mozeNadzor(session.user);

  const [
    wallet,
    user,
    neprocitanoPoruke,
    notifikacije,
    notifNeprocitano,
    pristanak,
    dnevniBrojevi,
    nadzorBroj,
  ] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: meId }, select: { balance: true } }),
    prisma.user.findUnique({
      where: { id: meId },
      select: { avatar: true, vodicVidjenAt: true, maloletan: true },
    }),
    prisma.poruka.count({
      where: {
        procitana: false,
        posiljacId: { not: meId },
        konverzacija: { OR: [{ user1Id: meId }, { user2Id: meId }] },
      },
    }),
    prisma.notifikacija.findMany({
      where: { userId: meId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true, tip: true, naslov: true, tekst: true, procitana: true,
        link: true, createdAt: true, kljuc: true, parametri: true,
      },
    }),
    prisma.notifikacija.count({ where: { userId: meId, procitana: false } }),
    // Isti izvor istine kao `GET /api/politika/prihvati` — dva odvojena upita su
    // umela da se raziđu, pa je ekran za pristanak bljesnuo i odmah nestao.
    pristanakStatus(meId),
    // Badge brojevi se računaju za SVAKOG prijavljenog, ne samo za potvrđene:
    // gornja grupa u sidebaru (Početna, POEN, Pijaca) stoji i novom članu, pa je
    // uslov po potvrdi ostavljao te badge-eve trajno prazne.
    izracunajDnevniBrojeve(meId, session.user),
    nadzornik ? izracunajNadzorBroj(meId, session.user) : Promise.resolve(0),
  ]);

  // Zvonce se prevodi ovde, a ne samo u /api/notifikacije: listu koju Header
  // prikazuje uzima OVAJ endpoint, pa bi bez prevoda svih 120 prevedenih
  // obaveštenja radilo samo za push i mejl, a u zvoncetu bi stajao sačuvan
  // srpski tekst iz pozivnog mesta. Jezik je jezik POSMATRAČA (kolačić) —
  // isto kao u /api/notifikacije. Redovi bez ključa ostaju kakvi jesu.
  const locale = await getLocale();
  const notifikacijePrevedene = notifikacije.map(({ kljuc, parametri, ...n }) => {
    if (!kljuc) return n;
    const p = (parametri ?? undefined) as Parametri | undefined;
    return {
      ...n,
      naslov: prevedi(locale, `${kljuc}_naslov`, p, n.naslov),
      tekst: prevedi(locale, `${kljuc}_tekst`, p, n.tekst),
    };
  });

  return NextResponse.json({
    balance: wallet?.balance ?? 0,
    avatar: user?.avatar ?? null,
    neprocitanoPoruke,
    notifikacije: notifikacijePrevedene,
    notifNeprocitano,
    dnevniBrojevi,
    nadzorBroj,
    politikaPotrebno: pristanak.potrebno,
    // Prva prijava naloga koji vodič još nije video vodi na `/dobrodosli`
    // (obrazac prijave to čita; vidi `LoginForm`).
    vodicPotreban: user?.vodicVidjenAt == null,
    // Modul Deca — navigacija maloletnog korisnika je uža, a nalog koji još čeka
    // roditelja (stanje `NA_CEKANJU`, čl. 4c) nema Pričaonicu, oglase ni poruke.
    maloletan: user?.maloletan ?? false,
    stanjeDeteta: user?.maloletan ? await stanjeNaloga(meId) : null,
  });
}
