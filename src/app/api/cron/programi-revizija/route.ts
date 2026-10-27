import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { prisma } from "@/lib/prisma";
import { obavesti } from "@/lib/notifikacije";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { labelPrograma, razlogObustaveProgram } from "@/lib/protokol/programi";
import { okoncajPrijavu } from "@/lib/protokol/program-prijava";
import { ProgramType } from "@/generated/prisma/client";

/**
 * POST /api/cron/programi-revizija
 *
 * Godišnja/periodična revizija socijalnih programa (Pravilnik o programima
 * podrške čl. 18, 19) + zaštita integriteta (anti-malverzacija). Deaktivira ACTIVE
 * prijavu kada:
 *   (a) prođe rok reverifikacije (`nextReverifikacija <= now`) a status nije
 *       ponovo potvrđen — „ako se status pri reviziji ne potvrdi, automatsko
 *       evidentiranje prestaje" (čl. 8 st. 1 t. 2, 18); ili
 *   (b) učesnik prestane da bude verifikovan (set 4.8.2: i čuvar Kola — imunitet
 *       NOSILAC_ZRNA je ukinut; Pravilnik čl. 29) — osnov na kojem je
 *       program odobren više ne važi (programi čl. 8 st. 1 t. 1).
 *
 * Deaktivirana prijava (INACTIVE) prestaje da ulazi u noćnu emisiju. Korisnik može
 * ponovo da se prijavi, čime ponovo prolazi kroz potvrdu verifikatora.
 * Preporučeno: dnevno.
 */
const SOCIJALNI_TIPOVI: ProgramType[] = [
  "PODRSKA_MAJKAMA", "PODRSKA_STARIJIMA", "POSEBNA_BRIGA", "SKOLOVANJE",
];

export async function GET(req: NextRequest) {
  // Podrška za oba načina: Vercel Cron (Authorization: Bearer) i manuelni poziv (x-cron-secret)
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = bearerSecret ?? req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }

  const sada = new Date();

  const aktivne = await prisma.programEnrollment.findMany({
    where: { status: "ACTIVE", type: { in: SOCIJALNI_TIPOVI } },
    include: { user: { select: { id: true, pseudonim: true, verified: true, jeOsnivac: true, indeksStvarnosti: true } } },
  });

  let istekloRevizija = 0;
  let palIndeks = 0;

  for (const en of aktivne) {
    const razlogObustave = razlogObustaveProgram(
      {
        nextReverifikacija: en.nextReverifikacija,
        verified: en.user.verified,
        jeOsnivac: en.user.jeOsnivac,
        indeksStvarnosti: en.user.indeksStvarnosti,
      },
      sada
    );
    if (razlogObustave == null) continue;
    const istekla = razlogObustave === "revizija";

    // 🔴 „revizija" pokriva dva ishoda iz čl. 18, jer su mehanički isti (prošao
    // `nextReverifikacija`), ali se korisniku ne smeju objasniti istim rečima:
    // pravo po osnovu gubitka doma NE podleže reviziji — ono traje dvanaest
    // meseci i prosto istekne. Poruka se zato grana po osnovu.
    const bezRevizije = en.osnov === "GUBITAK_DOMA";

    // Briše i unete podatke — osnov (pristanak uz važeći status) je prestao.
    await okoncajPrijavu(en.id, {
      status: "INACTIVE",
      razlog: istekla
        ? bezRevizije
          ? "Istekao rok od dvanaest meseci po osnovu iz čl. 18 st. 3; pravo prestaje istekom roka, bez revizije."
          : "Istekao rok reverifikacije statusa (čl. 18, 19); status nije ponovo potvrđen."
        : "Verifikacija je prestala — osnov za program više ne važi.",
    });

    if (istekla) istekloRevizija++;
    else palIndeks++;

    const razlog = istekla
      ? bezRevizije
        ? "Istekao je rok od dvanaest meseci za koji se pravo po ovom programu ostvaruje."
        : "Istekao je rok za reviziju statusa, a status nije ponovo potvrđen."
      : "Tvoja verifikacija je prestala da važi, pa je osnov za program prestao da važi.";
    await obavesti(en.user.id, {
      tip: "info",
      kljuc: "notifikacije.program_obustavljen",
      parametri: { program: labelPrograma(en.type), razlog },
      naslov: "Socijalni program privremeno obustavljen",
      tekst: `Program „${labelPrograma(en.type)}" je obustavljen. ${razlog} Možeš ponovo da se prijaviš kada uslovi budu ispunjeni.`,
      link: "/programi",
    });
  }

  const ukupno = istekloRevizija + palIndeks;
  if (ukupno > 0) {
    void posaljiAdminAlert(
      "Revizija socijalnih programa",
      `Obustavljeno ${ukupno} prijava (istekla revizija: ${istekloRevizija}, poništena potvrda: ${palIndeks}).`
    );
  }

  console.log(`[Programi revizija] Obustavljeno: ${ukupno} (revizija ${istekloRevizija}, potvrda ${palIndeks}).`);
  return NextResponse.json({ ok: true, obustavljeno: ukupno, istekloRevizija, palIndeks });
}
