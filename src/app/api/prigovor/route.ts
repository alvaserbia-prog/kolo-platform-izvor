import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { jeVrstaPrigovora, krajRokaVaucera, smePodneti, UKINUTE_VRSTE } from "@/lib/prigovor-pravila";
import { smePrijaviti } from "@/lib/razmena-prijava";
import { otvoriPrijavuRazmene } from "@/lib/protokol/prijava-razmene";

/**
 * POST /api/prigovor — korisnik podnosi prigovor na odluku (čl. 38 ZZPL)
 * GET  /api/prigovor — lista sopstvenih prigovora
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const prigovori = await prisma.prigovorNaOdluku.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, tipOdluke: true, predmetId: true, opis: true, status: true,
      odgovor: true, odgovorioAt: true, createdAt: true,
    },
  });

  return NextResponse.json(prigovori);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const body = await req.json().catch(() => ({}));
  const opis: string = typeof body.opis === "string" ? body.opis : "";
  const tipOdluke: unknown = body.tipOdluke;
  const predmetId: string | null =
    typeof body.predmetId === "string" && body.predmetId ? body.predmetId : null;

  if (!jeVrstaPrigovora(tipOdluke)) return await greska("Nepoznat tip odluke.", 400);
  // Ukinute vrste (POTVRDA — postupak od 60 dana, set 4.8.2) ostaju u tipu zbog
  // zatečenih prigovora, ali se nov prigovor te vrste ne prima.
  if (UKINUTE_VRSTE.includes(tipOdluke)) return await greska("Nepoznat tip odluke.", 400);

  // Predmet i rok se razrešavaju PRE opšte provere: „pocetakRoka" zavisi od toga
  // šta je predmet, a za dve vrste zavisi i to sme li se prigovor uopšte podneti.
  let pocetakRoka: Date | null = null;
  /** Gotov kraj roka, kad se rok ne svodi na „početak + dani" (vaučer). */
  let krajRoka: Date | null = null;
  /** Popunjava se samo za RAZMENA kad prigovor podnosi pošiljalac — tada se uz
   *  prigovor otvara i slučaj o kome Fondacija odlučuje (Pravilnik čl. 20 st. 5; Uslovi čl. 40 st. 5). */
  let razmena: { transakcijaId: string; protivId: string } | null = null;

  if (tipOdluke === "RAZMENA") {
    if (!predmetId) return await greska("Izaberi prepis na koji se prigovor odnosi.", 400);
    const tx = await prisma.transaction.findUnique({
      where: { id: predmetId },
      select: {
        id: true,
        type: true,
        createdAt: true,
        fromWallet: { select: { userId: true } },
        toWallet: { select: { userId: true, user: { select: { maloletan: true } } } },
        prijavaRazmene: { select: { id: true, status: true, resenAt: true } },
      },
    });
    if (!tx) return await greska("Prepis ne postoji.", 404);

    const jaSamPosiljalac = tx.fromWallet?.userId === session.user.id;
    const jaSamPrimalac = tx.toWallet?.userId === session.user.id;

    if (jaSamPosiljalac) {
      const [otvorenihPrijava, ja] = await Promise.all([
        prisma.prijavaRazmene.count({
          where: { prijaviocId: session.user.id, status: "OTVORENA" },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { maloletan: true },
        }),
      ]);
      const provera = smePrijaviti({
        tipTransakcije: tx.type,
        posiljaocId: tx.fromWallet?.userId ?? null,
        prijaviocId: session.user.id,
        vecPrijavljena: tx.prijavaRazmene !== null,
        otvorenihPrijava,
        prijaviocMaloletan: ja?.maloletan ?? false,
        // Ni prepis MALOLETNOM primaocu se ne obara kroz Platformu (deca čl. 23 st. 3).
        primalacMaloletan: tx.toWallet?.user?.maloletan ?? false,
        opis,
      });
      if (!provera.ok) return await greska(provera.razlog, 400);
      if (!tx.toWallet?.userId) return await greska("Druga strana nema zapis u Protokolu.", 400);
      razmena = { transakcijaId: tx.id, protivId: tx.toWallet.userId };
      pocetakRoka = tx.createdAt;
    } else if (jaSamPrimalac && tx.prijavaRazmene?.status === "PONISTENA") {
      // Prigovor na sopstvenu odluku Fondacije — zapis primaoca je poništenjem
      // umanjen, moguće i u minus. Ovde se ne otvara nov slučaj: odlučuje se o
      // odluci koja već postoji. Rok teče od PONIŠTENJA, ne od prepisa (Uslovi
      // čl. 40 st. 4) — prepis je mogao biti mesecima ranije.
      pocetakRoka = tx.prijavaRazmene.resenAt ?? tx.createdAt;
    } else {
      return await greska(
        "Prigovor na prepis podnosi onaj ko je POEN prepisao, odnosno onaj kome je prepis poništen.",
        400,
      );
    }
  }

  if (tipOdluke === "NABAVKA") {
    if (!predmetId) return await greska("Izaberi deo na koji se prigovor odnosi.", 400);
    const p = await prisma.nabavkaPrijava.findUnique({
      where: { id: predmetId },
      select: { id: true, userId: true, status: true, preuzetoAt: true, ispravljenoAt: true },
    });
    if (!p || p.userId !== session.user.id) return await greska("Deo ne postoji.", 404);
    if (p.status !== "PREUZEO" || !p.preuzetoAt)
      return await greska("Prigovor se podnosi po preuzimanju dela.", 400);
    if (p.ispravljenoAt) return await greska("Evidencija za ovaj deo je već ispravljena.", 400);
    pocetakRoka = p.preuzetoAt;
  }

  if (tipOdluke === "VAUCER") {
    // Neizvršenje obaveze davaoca iz vaučera (Uslovi čl. 40; donacije čl. 35).
    // Prigovor označava tačno jedan vaučer, i podnosi ga samo njegov imalac. Rok je
    // 30 dana od označavanja kao iskorišćen, odnosno od odbijanja predaje, a
    // najkasnije 15 dana od isteka roka važenja (Uslovi čl. 40 st. 4 t. 4).
    // Odbijanje predaje se dešava kod davaoca i Platforma ga ne beleži, pa se za
    // neiskorišćen vaučer ovde proverava samo krajnja granica.
    if (!predmetId) return await greska("Izaberi vaučer na koji se prigovor odnosi.", 400);
    const v = await prisma.vaucer.findUnique({
      where: { id: predmetId },
      select: { imalacId: true, status: true, iskoriscenAt: true, ugovor: { select: { vaziDo: true } } },
    });
    if (!v || v.imalacId !== session.user.id) return await greska("Vaučer ne postoji.", 404);
    if (!["DODELJEN", "ISKORISCEN", "ISTEKAO"].includes(v.status))
      return await greska("Za ovaj vaučer se prigovor ne može podneti.", 400);
    if (v.ugovor.vaziDo)
      krajRoka = krajRokaVaucera({
        vaziDo: v.ugovor.vaziDo,
        iskoriscenAt: v.status === "ISKORISCEN" ? v.iskoriscenAt : null,
      });
  }

  if (tipOdluke === "VISESTRUKI_NALOG") {
    // Odluka o utvrđenju višestrukog naloga (Uslovi čl. 40 st. 2 t. 9): podnosi je
    // lice sa naloga koji je zadržalo, u roku od 15 dana od obaveštenja (st. 4 t. 3).
    const u = await prisma.utvrdjenjeVisestrukogNaloga.findFirst({
      where: { zadrzaniId: session.user.id },
      orderBy: { utvrdjenoAt: "desc" },
      select: { utvrdjenoAt: true },
    });
    if (!u) return await greska("Za tvoj nalog nije utvrđen višestruki nalog.", 400);
    pocetakRoka = u.utvrdjenoAt;
  }

  const otvorenihIsteVrste = await prisma.prigovorNaOdluku.count({
    where: {
      userId: session.user.id,
      tipOdluke,
      status: { in: ["PENDING", "U_OBRADI"] },
    },
  });

  const provera = smePodneti({
    vrsta: tipOdluke,
    opis,
    predmetId,
    otvorenihIsteVrste,
    pocetakRoka,
    krajRoka,
    sada: new Date(),
  });
  if (!provera.ok) return await greska(provera.razlog, 400);

  // Jedan otvoren prigovor po predmetu — druga žalba nad istim prepisom ili
  // delom nije nov podatak nego ponovljen pritisak (ista brana kao @@unique na
  // PrijavaRazmene.transakcijaId).
  if (predmetId) {
    const vec = await prisma.prigovorNaOdluku.count({
      where: {
        userId: session.user.id,
        predmetId,
        status: { in: ["PENDING", "U_OBRADI"] },
      },
    });
    if (vec > 0) return await greska("O ovom predmetu već imaš otvoren prigovor.", 400);
  }

  const prigovor = await prisma.prigovorNaOdluku.create({
    data: {
      userId: session.user.id,
      opis: opis.trim(),
      tipOdluke,
      predmetId,
    },
  });

  if (razmena) {
    await otvoriPrijavuRazmene({
      transakcijaId: razmena.transakcijaId,
      prijaviocId: session.user.id,
      prijaviocPseudonim: session.user.pseudonim,
      protivId: razmena.protivId,
      opis: opis.trim(),
      prigovorId: prigovor.id,
    });
  }

  void posaljiAdminAlert(
    "Novi prigovor na odluku",
    `Tip: ${tipOdluke}\nKorisnik: ${session.user.pseudonim}`
  );


  return NextResponse.json({ ok: true, id: prigovor.id }, { status: 201 });
}
