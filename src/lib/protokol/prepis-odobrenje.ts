import { prisma } from "@/lib/prisma";
import { obavesti } from "@/lib/notifikacije";
import { DecaGreska, mojeDeteIliBaci, smeDaPrepise, ucitajUcesnika } from "./deca";
import { izvrsiPrepis, PrepisGreska } from "./prepis";
import { jeNadoknada } from "./nadoknada";
import { ROK_ODOBRENJA_PREPISA_DANA, pragOdobrenja } from "@/lib/deca-pravila";

/**
 * Prepis iz zapisa maloletnog korisnika koji čeka odobrenje roditelja
 * (Pravilnik o učešću dece, čl. 30).
 *
 * ─── Zašto postoji ──────────────────────────────────────────────────────────
 *
 * Prekidač iz čl. 20 st. 2 je saglasnost data UNAPRED, za sve i zauvek. Porodični
 * zakon (čl. 64) traži saglasnost roditelja za KONKRETAN pravni posao, a poslove
 * male vrednosti maloletnik preduzima sam. Prag razdvaja to dvoje: sitna razmena
 * ide bez ikoga, veća čeka roditelja.
 *
 * 🔴 POEN se NE skida pri traženju odobrenja. Red drži nameru; dok roditelj ne
 * odobri, u evidenciji se ništa nije desilo. Skidanje unapred bi tražilo povraćaj
 * pri odbijanju, a povraćaj je protivzapis koji u istoriji izgleda kao poništenje
 * — a ovde ničega nije ni bilo.
 *
 * 🔴 Pokriće se proverava DVAPUT — pri traženju i pri odobrenju. Između ta dva
 * trenutka prolazi do sedam dana, u kojima dete sme da troši.
 */

function rokOdobrenja(sada: Date): Date {
  return new Date(sada.getTime() + ROK_ODOBRENJA_PREPISA_DANA * 24 * 60 * 60 * 1000);
}

/** Traženje odobrenja. Vraća rok do kada roditelj može da se izjasni. */
export async function zatraziOdobrenje(ulaz: {
  deteId: string;
  detePseudonim: string;
  primalacId: string;
  primalacPseudonim: string;
  iznos: number;
  opis?: string | null;
  godine: number | null;
}): Promise<{ naCekanju: true; rokDo: string; prag: number }> {
  const sada = new Date();
  await prisma.prepisOdobrenje.create({
    data: {
      deteId: ulaz.deteId,
      primalacId: ulaz.primalacId,
      iznos: ulaz.iznos,
      opis: ulaz.opis?.trim() || null,
      rokDo: rokOdobrenja(sada),
    },
  });

  const roditelji = await prisma.roditeljstvo.findMany({
    where: { deteId: ulaz.deteId },
    select: { roditeljId: true },
  });
  for (const r of roditelji) {
    await obavesti(r.roditeljId, {
      tip: "prepis_odobrenje",
      kljuc: "notifikacije.prepis_odobrenje",
      parametri: {
        dete: ulaz.detePseudonim,
        iznos: ulaz.iznos,
        pseudonim: ulaz.primalacPseudonim,
        dana: ROK_ODOBRENJA_PREPISA_DANA,
      },
      naslov: "Dete traži odobrenje za prepis POENA",
      tekst:
        `${ulaz.detePseudonim} hoće da prepiše ${ulaz.iznos.toLocaleString("sr-RS")} POEN ` +
        `članu ${ulaz.primalacPseudonim}. Bez tvog odobrenja prepis se ne izvršava, ` +
        `a zahtev ističe za ${ROK_ODOBRENJA_PREPISA_DANA} dana.`,
      link: `/deca/${ulaz.deteId}`,
    }).catch(() => {});
  }

  return {
    naCekanju: true,
    rokDo: rokOdobrenja(sada).toISOString(),
    prag: pragOdobrenja(ulaz.godine),
  };
}

/** Prepisi tog deteta koji čekaju odluku — za prikaz roditelju. */
export async function prepisiNaCekanju(deteId: string) {
  const redovi = await prisma.prepisOdobrenje.findMany({
    where: { deteId, status: "CEKA" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      iznos: true,
      opis: true,
      rokDo: true,
      primalac: { select: { pseudonim: true } },
    },
  });
  return redovi.map((r) => ({
    id: r.id,
    iznos: r.iznos,
    opis: r.opis,
    rokDo: r.rokDo.toISOString(),
    primalac: r.primalac.pseudonim,
  }));
}

/**
 * Odluka roditelja. Odobrenje izvršava prepis odmah; odbijanje ga gasi.
 *
 * 🔴 Stanje se rezerviše uslovnim `updateMany` PRE izvršenja — dva roditelja mogu
 * da pritisnu dugme u istoj sekundi, a prepis sme da se izvrši samo jednom.
 */
export async function odluciOPrepisu(
  roditeljId: string,
  prepisId: string,
  odluka: "ODOBREN" | "ODBIJEN"
) {
  const zapis = await prisma.prepisOdobrenje.findUnique({
    where: { id: prepisId },
    select: { id: true, deteId: true, primalacId: true, iznos: true, opis: true, status: true },
  });
  if (!zapis || zapis.status !== "CEKA") {
    throw new DecaGreska("Zahtev za odobrenje više ne čeka odluku.", 409);
  }
  await mojeDeteIliBaci(roditeljId, zapis.deteId);

  const rezervisano = await prisma.prepisOdobrenje.updateMany({
    where: { id: prepisId, status: "CEKA" },
    data: { status: odluka, odlucioId: roditeljId, odlucenoAt: new Date() },
  });
  if (rezervisano.count === 0) {
    throw new DecaGreska("Zahtev za odobrenje više ne čeka odluku.", 409);
  }

  const [dete, primalac] = await Promise.all([
    prisma.user.findUnique({
      where: { id: zapis.deteId },
      select: { id: true, pseudonim: true, wallet: { select: { id: true, balance: true } } },
    }),
    prisma.user.findUnique({
      where: { id: zapis.primalacId },
      select: { id: true, pseudonim: true, wallet: { select: { id: true } } },
    }),
  ]);

  if (odluka === "ODBIJEN") {
    await javiDetetu(zapis.deteId, "prepis_odbijen", zapis.iznos, primalac?.pseudonim ?? "?");
    return { ok: true, izvrseno: false };
  }

  if (!dete?.wallet || !primalac?.wallet) {
    throw new DecaGreska("Nalog više ne postoji.", 409);
  }
  // Uslov prepisa se proverava PONOVO (set 4.8.2): ako je nalog deteta u međuvremenu
  // prešao u „dete sa roditeljem", ne učestvuje u ažuriranju evidencije POEN-a
  // (Pravilnik o učešću dece čl. 5 st. 1 t. 2, čl. 30 st. 6).
  const [odU, kaU] = await Promise.all([ucitajUcesnika(dete.id), ucitajUcesnika(primalac.id)]);
  const uslov = odU && kaU ? smeDaPrepise(odU, kaU) : { ok: false as const, razlog: "Nalog više ne postoji.", status: 403 as const };
  if (!uslov.ok) {
    await prisma.prepisOdobrenje.update({ where: { id: prepisId }, data: { status: "ISTEKAO" } });
    throw new DecaGreska(uslov.razlog, uslov.status);
  }
  // Pokriće se proverava PONOVO: između traženja i odluke prolazi do sedam dana.
  if (jeNadoknada(dete.wallet.balance) || dete.wallet.balance < zapis.iznos) {
    await prisma.prepisOdobrenje.update({
      where: { id: prepisId },
      data: { status: "ISTEKAO" },
    });
    throw new DecaGreska(
      `Zapis deteta više nema pokriće za ${zapis.iznos.toLocaleString("sr-RS")} POENA. Zahtev je zatvoren.`,
      400
    );
  }

  try {
    await izvrsiPrepis(
      { id: dete.id, pseudonim: dete.pseudonim, walletId: dete.wallet.id },
      { id: primalac.id, pseudonim: primalac.pseudonim, walletId: primalac.wallet.id },
      zapis.iznos,
      zapis.opis
    );
  } catch (e) {
    if (e instanceof PrepisGreska) {
      await prisma.prepisOdobrenje.update({
        where: { id: prepisId },
        data: { status: "ISTEKAO" },
      });
      throw new DecaGreska("Zapis deteta u međuvremenu nema pokriće. Zahtev je zatvoren.", 400);
    }
    throw e;
  }

  await javiDetetu(zapis.deteId, "prepis_odobren", zapis.iznos, primalac.pseudonim);
  return { ok: true, izvrseno: true };
}

async function javiDetetu(
  deteId: string,
  tip: "prepis_odobren" | "prepis_odbijen",
  iznos: number,
  primalac: string
) {
  const odobren = tip === "prepis_odobren";
  await obavesti(deteId, {
    tip,
    kljuc: `notifikacije.${tip}`,
    parametri: { iznos, pseudonim: primalac },
    naslov: odobren ? "Roditelj je odobrio prepis" : "Roditelj nije odobrio prepis",
    tekst: odobren
      ? `Prepis od ${iznos.toLocaleString("sr-RS")} POENA članu ${primalac} je izvršen.`
      : `Prepis od ${iznos.toLocaleString("sr-RS")} POENA članu ${primalac} nije izvršen.`,
    link: "/novcanik",
  }).catch(() => {});
}

/**
 * Istek roka — noćni posao, rok iz čl. 30 st. 4 (7 dana).
 *
 * Ništa se ne vraća jer ništa nije ni skinuto; zahtev samo prestaje da važi.
 */
export async function obradiIstekleOdobrenja(sada: Date = new Date()) {
  const istekli = await prisma.prepisOdobrenje.findMany({
    where: { status: "CEKA", rokDo: { lte: sada } },
    select: { id: true, deteId: true, iznos: true, primalac: { select: { pseudonim: true } } },
  });
  let ugaseno = 0;
  for (const z of istekli) {
    const rez = await prisma.prepisOdobrenje.updateMany({
      where: { id: z.id, status: "CEKA" },
      data: { status: "ISTEKAO", odlucenoAt: sada },
    });
    if (rez.count === 0) continue;
    ugaseno += 1;
    await javiDetetu(z.deteId, "prepis_odbijen", z.iznos, z.primalac.pseudonim);
  }
  return { ugaseno };
}
