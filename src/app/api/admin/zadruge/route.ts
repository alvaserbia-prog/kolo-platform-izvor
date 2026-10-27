import { NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin, jeZadruzniAdmin } from "@/lib/dozvole";
import { logAdminAkcija } from "@/lib/audit";
import {
  upisiZadrugu,
  ZadrugaGreska,
  PRAGOVI_RASTA,
  JEDINICE_ZADRUZNOG_DOPRINOSA,
  brojZadrugaraUcesnika,
  najveciDnevniIznos,
  type PodaciZadruge,
} from "@/lib/protokol/zadruga";
import { PARAMETAR_IZNOS_JEDINICE, vazeciParametar } from "@/lib/protokol/operativni-postupak";

/**
 * GET  /api/admin/zadruge — sve zadruge sa zadrugarima, zapisom i pragovima
 * POST /api/admin/zadruge — upis zadruge u sistem (Pravilnik o zadrugama čl. 4)
 *
 * 🔴 Ime i prezime i broj telefona zadrugara izlaze SAMO ovde: administratorskom
 * timu i zadružnom adminu za njegovu zadrugu (čl. 15, 21, Registar radnji obrade
 * br. 19) — nijedna korisnička ruta ih ne vraća.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true, adminZadrugaId: true } });
  // Zadružni admin (U2) vidi samo svoju zadrugu; bez dodeljene zadruge ne vidi ništa.
  const samoSvoja = jeZadruzniAdmin(me);
  if (!jeAdmin(me) && !(samoSvoja && me?.adminZadrugaId)) return await greska("Nemate ovlašćenje.", 403);

  const [zadruge, iznosJedinice] = await Promise.all([
    prisma.krug.findMany({
      where: samoSvoja ? { zadruga: true, id: me!.adminZadrugaId! } : { zadruga: true },
      orderBy: { createdAt: "asc" },
      include: {
        wallet: { select: { balance: true } },
        bonusLogs: { select: { threshold: true, amount: true, createdAt: true }, orderBy: { threshold: "asc" } },
        memberships: {
          where: { leftAt: null },
          orderBy: { joinedAt: "asc" },
          select: {
            id: true,
            imePrezime: true,
            user: { select: { id: true, pseudonim: true, telefon: true, verified: true, identitet: { select: { imePrezime: true } } } },
            joinedAt: true,
          },
        },
        // Zadružni doprinos (operativni 5.0 čl. 23): celine zadruge i njihovi izvršioci.
        doprinosOglasi: {
          where: { zadruzni: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            positions: true,
            predlozeniPoen: true,
            brojCelina: true,
            prijave: { where: { aktivanKljuc: { not: null } }, select: { status: true, user: { select: { pseudonim: true } } } },
          },
        },
      },
    }),
    // Iznos jedinice utvrđuje UO odlukom (operativni čl. 23 st. 4); bez odluke nema iznosa.
    vazeciParametar(PARAMETAR_IZNOS_JEDINICE),
  ]);
  // Zadrugari koji su učesnici (čl. 6 st. 1 — ostali miruju i ne broje se).
  const ucesnika = new Map(await Promise.all(zadruge.map(async (z) => [z.id, await brojZadrugaraUcesnika(z.id)] as const)));

  return NextResponse.json({
    samoSvoja,
    pragovi: PRAGOVI_RASTA,
    jedinice: JEDINICE_ZADRUZNOG_DOPRINOSA,
    iznosJedinice,
    zadruge: zadruge.map((z) => ({
      id: z.id,
      naziv: z.name,
      lokalitet: z.location,
      maticniBroj: z.maticniBroj,
      pib: z.pib,
      adresa: z.adresa,
      ugovorAt: z.ugovorAt?.toISOString() ?? null,
      prestanakAt: z.prestanakAt?.toISOString() ?? null,
      zamrznutoAt: z.zamrznutoAt?.toISOString() ?? null,
      zamrznutoOsnov: z.zamrznutoOsnov,
      zadrugaraUcesnika: ucesnika.get(z.id) ?? 0,
      najveciDnevniIznos: najveciDnevniIznos(ucesnika.get(z.id) ?? 0, iznosJedinice),
      zadaci: z.doprinosOglasi.map((o) => ({
        id: o.id,
        naziv: o.title,
        status: o.status,
        mesta: o.positions,
        predlozeniPoen: o.predlozeniPoen,
        brojCelina: o.brojCelina,
        izvrsioci: o.prijave.map((p) => ({ pseudonim: p.user.pseudonim, prihvatio: p.status === "APPROVED" })),
      })),
      zapis: z.wallet?.balance ?? 0,
      pragovi: z.bonusLogs.map((b) => ({ clanovi: b.threshold, poen: b.amount, at: b.createdAt.toISOString() })),
      zadrugari: z.memberships.map((m) => ({
        clanstvoId: m.id,
        userId: m.user.id,
        pseudonim: m.user.pseudonim,
        // Evidencija identiteta (set 4.7.3); zatečeni zadrugari nose ime na članstvu.
        imePrezime: m.user.identitet?.imePrezime ?? m.imePrezime,
        // Broj sa profila — zadruzi treba za rad sa zadrugarima (odluka vlasnika, U2).
        telefon: m.user.telefon,
        // Čl. 6 st. 1 — dok nije učesnik, svojstvo zadrugara miruje.
        miruje: !m.user.verified,
        od: m.joinedAt.toISOString(),
      })),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true } });
  if (!jeAdmin(me)) return await greska("Nemate ovlašćenje.", 403);
  let body: PodaciZadruge;
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  try {
    const { id } = await upisiZadrugu(session.user.id, body);
    await logAdminAkcija(session.user.id, "ZADRUGA_UPISANA", id, String(body.naziv ?? ""));
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    if (e instanceof ZadrugaGreska) return await greska(e.message, e.status);
    throw e;
  }
}
