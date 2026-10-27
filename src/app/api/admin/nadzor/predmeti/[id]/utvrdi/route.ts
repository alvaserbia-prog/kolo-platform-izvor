/**
 * POST /api/admin/nadzor/predmeti/[id]/utvrdi
 *
 * Upravni odbor utvrđuje lažnu verifikaciju, lažnu potvrdu člana bez potvrde ili
 * lažnu potvrdu postojanja deteta po nadzornom predmetu (Pravilnik o dokazu
 * stvarnosti čl. 32 st. 4, 33; set 4.8.2). Grana po meti predmeta:
 *  — verifikacija → `ponistiVerifikaciju` (verifikovani postaje korisnik, čl. 31);
 *  — potvrda člana → `ponistiPotvrduClana` (ostaje član bez potvrde, čl. 31 st. 3);
 *  — potvrda postojanja deteta → `ponistiPotvrduPostojanja` (deca čl. 13 st. 5).
 *
 * Telo: { nepostojeciNalog: boolean, beleska?: string }
 *
 * `nepostojeciNalog` je odluka o ČOVEKU, ne o verifikaciji, i zato je razdvojena:
 *  — `false` → poništava se samo taj zapis (čl. 33). Verifikovani je stvarna
 *    osoba: gubi POEN-e iz te verifikacije i postaje korisnik, ali zadržava nalog i
 *    sve verifikacije koje je sam obavio, i može ponovo biti verifikovan.
 *  — `true` → utvrđuje se da iza naloga ne stoji stvarna osoba (čl. 34): padaju sve
 *    verifikacije koje taj nalog dodiruje, i primljene i obavljene. Kaskada staje na
 *    prvom stvarnom čoveku.
 *
 * 🔴 Ne uvoditi „poništi sve verifikacije ovog verifikatora" — to je upravo ono što
 * je 4.2.0 uklonila, jer je stvarnim ljudima oduzimalo status zbog tuđe radnje.
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeSuperadmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import {
  ponistiVerifikaciju,
  ponistiNepostojeciNalog,
  ponistiPotvrduClana,
  LaznaVerifikacijaGreska,
  type PonistavanjeRezultat,
} from "@/lib/protokol/lazna-verifikacija";

type PonistiPostojanje = (id: string, adminId: string) => Promise<unknown>;

/**
 * Poništenje potvrde postojanja deteta vodi Modul Deca (`deca.ts`, ugovor P3). Čita
 * se dinamički, da ova ruta ne zavisi od redosleda u kom se moduli dopunjuju.
 */
async function ponistiPostojanje(id: string, adminId: string): Promise<void> {
  const deca = (await import("@/lib/protokol/deca")) as unknown as { ponistiPotvrduPostojanja?: PonistiPostojanje };
  if (typeof deca.ponistiPotvrduPostojanja !== "function") {
    throw new LaznaVerifikacijaGreska("Poništenje potvrde postojanja deteta još nije dostupno.", 501);
  }
  await deca.ponistiPotvrduPostojanja(id, adminId);
}

const PONISTENA_TEKST =
  "Utvrđeno je da je potvrda, odnosno uvođenje u Kolo u tvom lancu potvrda lažno, pa je poništeno. Sada si korisnik. Kad te neko ko te lično zna ponovo potvrdi ili uvede u Kolo, vraća se i status.";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;

  let body: { nepostojeciNalog?: unknown; beleska?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* prazno telo — podrazumeva se poništenje samo tog zapisa */
  }
  const nepostojeciNalog = body.nepostojeciNalog === true;
  const beleska = typeof body.beleska === "string" ? body.beleska.trim() || null : null;

  const predmet = await prisma.nadzorniPredmet.findUnique({
    where: { id },
    include: {
      verifikacija: {
        select: {
          id: true,
          verifikovaniId: true,
          verifikator: { select: { pseudonim: true } },
          verifikovani: { select: { pseudonim: true } },
        },
      },
      potvrdaClana: {
        select: {
          id: true,
          potvrdjeniId: true,
          potvrdio: { select: { pseudonim: true } },
          potvrdjeni: { select: { pseudonim: true } },
        },
      },
      potvrdaPostojanja: {
        select: {
          id: true,
          potvrdio: { select: { pseudonim: true } },
          roditelj: { select: { pseudonim: true } },
        },
      },
    },
  });
  if (!predmet) return await greska("Predmet nije pronađen.", 404);
  if (predmet.status !== "OTVOREN") return await greska("Predmet nije otvoren.", 400);
  if (!predmet.verifikacija && !predmet.potvrdaClana && !predmet.potvrdaPostojanja) {
    return await greska("Predmet se ne odnosi ni na jedan zapis.", 400);
  }
  // Utvrđenje nepostojećeg naloga je odluka o čoveku (čl. 34); kod potvrde postojanja
  // deteta za to postoji poseban institut — prijava lažnog roditeljstva (deca čl. 17).
  if (nepostojeciNalog && predmet.potvrdaPostojanja) {
    return await greska("Kod potvrde postojanja deteta nalog se ne utvrđuje nepostojećim ovim putem.", 400);
  }

  const opisPredmeta = predmet.verifikacija
    ? `verifikacija ${predmet.verifikacija.verifikator.pseudonim} → ${predmet.verifikacija.verifikovani.pseudonim}`
    : predmet.potvrdaClana
      ? `potvrda člana ${predmet.potvrdaClana.potvrdio?.pseudonim ?? "lanac"} → ${predmet.potvrdaClana.potvrdjeni.pseudonim}`
      : `potvrda postojanja deteta ${predmet.potvrdaPostojanja!.potvrdio?.pseudonim ?? "—"} → ${predmet.potvrdaPostojanja!.roditelj.pseudonim}`;

  let rez: PonistavanjeRezultat | null = null;
  let potvrdaPala: string | null = null;
  try {
    // Predmet se zatvara PRE poništenja: cascade na `VerifikacionaVeza` briše i
    // predmet, pa posle poništenja ne bi bilo šta da se ažurira.
    await prisma.nadzorniPredmet.update({
      where: { id },
      data: {
        status: "UTVRDJENA_LAZNA",
        resenById: session.user.id,
        resenAt: new Date(),
        beleska,
      },
    });

    if (predmet.verifikacija) {
      rez = nepostojeciNalog
        ? await ponistiNepostojeciNalog(predmet.verifikacija.verifikovaniId)
        : await ponistiVerifikaciju(predmet.verifikacija.id);
    } else if (predmet.potvrdaClana) {
      if (nepostojeciNalog) {
        rez = await ponistiNepostojeciNalog(predmet.potvrdaClana.potvrdjeniId);
      } else {
        const p = await ponistiPotvrduClana(predmet.potvrdaClana.id, session.user.id, beleska);
        potvrdaPala = p.potvrdjeniId;
      }
    } else {
      await ponistiPostojanje(predmet.potvrdaPostojanja!.id, session.user.id);
    }
  } catch (e) {
    if (e instanceof LaznaVerifikacijaGreska) return await greska(e.message, e.status);
    throw e;
  }

  await logAdminAkcija(
    session.user.id,
    nepostojeciNalog
      ? "NALOG_UTVRDJEN_NEPOSTOJECIM"
      : predmet.verifikacija
        ? "LAZNA_VERIFIKACIJA_UTVRDJENA"
        : predmet.potvrdaClana
          ? "LAZNA_POTVRDA_CLANA_UTVRDJENA"
          : "LAZNA_POTVRDA_POSTOJANJA_UTVRDJENA",
    id,
    `${opisPredmeta}` +
      (rez ? `: poništeno ${rez.ponistenoVerifikacija} verifikacija` : "") +
      (beleska ? ` — ${beleska}` : "")
  );

  if (potvrdaPala) {
    await obavesti(potvrdaPala, {
      tip: "STATUS_PAO",
      kljuc: "notifikacije.status_pao_potvrda",
      naslov: "Potvrda poništena — ponovo si član bez potvrde",
      tekst:
        "Upravni odbor je utvrdio da je potvrda kojom si postao član Kola lažna, pa je poništena. Uvođenje u Kolo ti i dalje važi, pa si ponovo član bez potvrde. Upisano ZRNO ostaje, a aktivno prelazi u slobodno. Član Kola koji te lično zna može ponovo da te potvrdi.",
      link: "/verifikacija",
    });
  }

  for (const uid of rez?.pogodjeniKorisnici ?? []) {
    await obavesti(uid, {
      tip: "VERIFIKACIJA_PONISTENA",
      kljuc: "notifikacije.verifikacija_ponistena",
      naslov: "Potvrda poništena",
      tekst: PONISTENA_TEKST,
      link: "/profil",
    });
  }

  for (const n of rez?.nadoknade ?? []) {
    await obavesti(n.userId, {
      tip: "NADOKNADA",
      kljuc: "notifikacije.nadoknada",
      parametri: { iznos: n.iznos },
      naslov: "Nastala je nadoknada na tvom zapisu",
      tekst: `Poništenjem verifikacije koju si obavio nastala je nadoknada od ${n.iznos} POENA, jer poništeni POENI nisu bili pokriveni. Nadoknada nije dug i ne može se naplatiti; POENI koji ti pristignu prvo je popunjavaju. Razmena dobara i usluga ti nije ograničena.`,
      link: "/novcanik",
    });
  }

  return NextResponse.json({ ok: true, ...(rez ?? {}) });
}
