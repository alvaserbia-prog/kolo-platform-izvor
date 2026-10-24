import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminKlijent from "./AdminKlijent";
import { ADMIN_TABOVI, type Tab } from "./tabovi";
import { labelPrograma } from "@/lib/protokol/programi";
import { ProgramType } from "@/generated/prisma/client";
import { UKUPNO_ZRNA } from "@/lib/protokol/zrno";
import { jeAdmin, jeSuperadmin } from "@/lib/dozvole";
import { brojeviClanova, brojeviStatusa, USLOVI_STATUSA } from "@/lib/admin-clanovi";
import { IZBOR_STATUSA, statusUcesnika, ucitajStatus, type StatusUcesnika } from "@/lib/protokol/status";

const SVI_PROGRAMI: ProgramType[] = ["PED", "PODRSKA_MAJKAMA", "PODRSKA_STARIJIMA", "POSEBNA_BRIGA", "SKOLOVANJE"];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) redirect("/dashboard");
  const viewerJeSuperadmin = jeSuperadmin(session.user);

  // Tab iz URL-a (?tab=...) — back navigacija vraća na isti tab. Audit,
  // Aktivnost i Nadzor su rezervisani za superadmina, pa se za ostale ignorišu.
  const { tab } = await searchParams;
  const pocetniTab: Tab =
    (ADMIN_TABOVI as readonly string[]).includes(tab ?? "") &&
    (viewerJeSuperadmin ||
      (tab !== "audit" && tab !== "nadzor" && tab !== "odluke" && tab !== "aktivnost" && tab !== "politika"))
      ? (tab as Tab)
      : "dashboard";

  const [
    allUsers, protokol,
    adminProgrami, dashboardData, auditLogs, pokroviteljiData, zaposljavanjeData,
    blogObjave, pendingDonacije, otvoreniPrigovori, otvorenihPrijavaOglasa,
    prvihOglasaNaCekanju, otvorenihPrijavaRazmene,
  ] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, pseudonim: true, email: true, telefon: true, location: true, ...IZBOR_STATUSA, admin: true, status: true, suspendedReason: true, createdAt: true, wallet: { select: { balance: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.wallet.findUnique({ where: { id: "banka-singleton" }, select: { balance: true } }),
    Promise.all([
      prisma.zrnoKanal.findUnique({ where: { id: "singleton" } }),
      prisma.protokolProgram.findMany(),
      prisma.programEnrollment.findMany({ where: { status: "PENDING" }, include: { user: { select: { pseudonim: true } }, _count: { select: { potvrde: true } } }, orderBy: { createdAt: "asc" } }),
      prisma.dailyEmissionSummary.findMany({ orderBy: { date: "desc" }, take: 7 }),
    ]),
    Promise.all([
      brojeviClanova(),
      prisma.krug.count({ where: { status: "ACTIVE" } }),
      prisma.krugClanstvo.count({ where: { leftAt: null } }),
      prisma.zrnoStanje.aggregate({ _sum: { slobodno: true, aktivno: true } }),
      prisma.transaction.count(),
    ]),
    // Audit log je samo za superadmina (isto kao /api/admin/audit-log i Nadzor tab)
    viewerJeSuperadmin
      ? prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { admin: { select: { pseudonim: true } } },
        })
      : Promise.resolve([]),
    Promise.all([
      prisma.pokrovitelj.findMany({
        include: {
          vlasnik: { select: { pseudonim: true } },
          _count: { select: { doprinosi: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        // Verifikovani (set 4.8.2): punoletni živi nalozi u Kolu — dete nikad.
        where: { AND: [USLOVI_STATUSA.verifikovan, { deaktiviranAt: null, status: "ACTIVE" }] },
        select: { id: true, pseudonim: true },
        orderBy: { pseudonim: "asc" },
      }),
      prisma.krug.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]),
    Promise.all([
      prisma.doprinosOglas.findMany({
        include: {
          createdBy: { select: { pseudonim: true } },
          krug: { select: { name: true } },
          _count: { select: { prijave: true, evidencije: { where: { status: "PENDING" } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.oglasPrijava.findMany({
        where: { status: "PENDING" },
        include: { user: { select: { pseudonim: true } }, oglas: { select: { title: true, predlozeniPoen: true, positions: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.oglasEvidencija.findMany({
        where: { status: "PENDING" },
        include: { user: { select: { pseudonim: true } }, oglas: { select: { title: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]),
    prisma.blogPost.findMany({
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { pseudonim: true } } },
    }),
    prisma.donationRecord.findMany({
      // NAPLACENO = kartična uplata prošla kroz banku, POEN čeka ljudsku potvrdu
      // (R-01, mera M-4a). Stoji u istom redu čekanja kao najavljena uplata.
      where: { status: { in: ["PENDING", "NAPLACENO"] } },
      include: { user: { select: { pseudonim: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.prigovorNaOdluku.findMany({
      where: { status: { in: ["PENDING", "U_OBRADI"] } },
      include: { user: { select: { pseudonim: true } } },
      orderBy: { createdAt: "asc" },
    }),
    // Badge na tabu Pijaca — sami oglasi se učitavaju lenjo, iz taba.
    prisma.prijavaOglasa.count({ where: { status: "OTVORENA" } }),
    // Badge na tabu Prvi oglasi — doprinosi naloga bez potvrde koji čekaju
    // odobrenje (čl. 40a st. 4). Sam spisak se učitava lenjo, iz taba.
    prisma.doprinosSadrzaju.count({ where: { status: "ZABELEZEN" } }),
    // Badge na tabu Razmene — prijave neispunjene razmene koje čekaju odluku.
    prisma.prijavaRazmene.count({ where: { status: "OTVORENA" } }),
  ]);

  const opticaj = protokol ? Math.abs(protokol.balance) : 0;
  const zrnaKodKorisnika = (dashboardData[3]._sum.slobodno ?? 0) + (dashboardData[3]._sum.aktivno ?? 0);

  // Nadzor integriteta — samo superadmin vidi obeležene naloge/grupe.
  const nadzorRedovi = viewerJeSuperadmin
    ? await prisma.rizikNalaz.findMany({ where: { status: "OTVOREN" }, orderBy: { rizik: "desc" }, take: 200 })
    : [];
  // Badge na tabu Odluke — sami predmeti se učitavaju lenjo, iz taba (čl. 11a).
  const otvorenihPredmeta = viewerJeSuperadmin
    ? await prisma.nadzorniPredmet.count({ where: { status: "OTVOREN" } })
    : 0;
  const nadzorNalazi = nadzorRedovi.map((r) => ({
    id: r.id,
    tip: r.tip,
    subjektId: r.subjektId,
    pseudonim: r.pseudonim,
    clanovi: r.clanovi ? (JSON.parse(r.clanovi) as { id: string; pseudonim: string }[]) : null,
    pravila: JSON.parse(r.pravila) as { kod: string; nivo: string; opis: string }[],
    rizik: r.rizik,
    nivo: r.nivo,
    createdAt: r.createdAt.toISOString(),
  }));


  // Status učesnika (set 4.8.2) za spisak članova. Za dete stanje dolazi iz
  // `deca.ts` (dete se proverava prvo i nikad nije „korisnik"); punoletnom je
  // dovoljan zapis naloga.
  const statusiKorisnika = new Map<string, StatusUcesnika>(
    await Promise.all(
      allUsers
        .filter((u) => u.maloletan)
        .map(async (u) => [u.id, (await ucitajStatus(u.id)) ?? "DETE_NA_CEKANJU"] as [string, StatusUcesnika]),
    ),
  );

  // Učesnici po statusu za Pregled (deca u zasebnoj koloni).
  const statusiBrojevi = await brojeviStatusa();

  return (
    <AdminKlijent
      opticaj={opticaj}
      nadzorNalazi={nadzorNalazi}
      otvorenihPredmeta={otvorenihPredmeta}
      pendingDonacije={pendingDonacije.map((d) => ({
        id: d.id, pseudonim: d.user.pseudonim, amountRSD: Number(d.amountRSD),
        cumulativeRSD: Number(d.cumulativeRSD), level: d.level, poenEmitted: d.poenEmitted,
        nacinUplate: d.nacinUplate, referenceNumber: d.referenceNumber,
        createdAt: d.createdAt.toISOString(),
        status: d.status, donatorIme: d.donatorIme,
      }))}
      otvoreniPrigovori={otvoreniPrigovori.map((p) => ({
        id: p.id, pseudonim: p.user.pseudonim, opis: p.opis, tipOdluke: p.tipOdluke,
        status: p.status, createdAt: p.createdAt.toISOString(),
      }))}
      viewerJeSuperadmin={viewerJeSuperadmin}
      viewerId={session.user.id}
      pocetniTab={pocetniTab}
      otvorenihPrijavaOglasa={otvorenihPrijavaOglasa}
      prvihOglasaNaCekanju={prvihOglasaNaCekanju}
      otvorenihPrijavaRazmene={otvorenihPrijavaRazmene}
      users={allUsers.map((u) => ({
        id: u.id, pseudonim: u.pseudonim, email: u.email, telefon: u.telefon, location: u.location, tipKorisnika: u.tipKorisnika, admin: u.admin, verified: u.verified,
        statusUcesnika: statusiKorisnika.get(u.id) ?? statusUcesnika(u),
        status: u.status, suspendedReason: u.suspendedReason,
        balance: u.wallet?.balance ?? 0, createdAt: u.createdAt.toISOString(), maloletan: u.maloletan,
      }))}
      adminProgrami={{
        zrnoKanalAktivan: adminProgrami[0]?.isActive ?? false,
        programi: SVI_PROGRAMI.map((type) => {
          const bp = adminProgrami[1].find((p) => p.type === type);
          return { type, label: labelPrograma(type), isActive: bp?.isActive ?? false, activatedAt: bp?.activatedAt?.toISOString() ?? null };
        }),
        pendingEnrollments: adminProgrami[2].map((e) => ({
          id: e.id, pseudonim: e.user.pseudonim, type: e.type, label: labelPrograma(e.type),
          // Posebne kategorije — samo superadminu (DPIA 5.6). Vidi /api/admin/programi.
          // 🔴 I osnov: ne prikazuje se nijednom korisniku (čl. 4 st. 5), a licu
          // koje obrađuje prijavu mora — od njega zavisi rok iz čl. 12.
          metadata: viewerJeSuperadmin ? (e.metadata as Record<string, unknown> | null) : null,
          osnov: viewerJeSuperadmin ? e.osnov : null,
          // Set 4.8.2: nema potvrđivača — Fondacija potvrđuje uslove uz obrazloženje.
          cekaFondaciju: e._count.potvrde === 0,
          createdAt: e.createdAt.toISOString(),
        })),
        poslednjeEmisije: adminProgrami[3].map((s) => ({
          date: s.date.toISOString(), opticaj: s.opticaj, limit: s.limit,
          totalRequested: s.totalRequested, totalEmitted: s.totalEmitted, koeficijent: Number(s.koeficijent),
        })),
      }}
      dashboard={{
        korisnici: dashboardData[0],
        statusi: statusiBrojevi,
        krugovi: { ukupno: dashboardData[1], krugra: dashboardData[2] },
        finansije: { opticaj, protokolBalance: protokol?.balance ?? 0 },
        zrno: { kodKorisnika: zrnaKodKorisnika, uProtokolu: UKUPNO_ZRNA - zrnaKodKorisnika, ukupno: UKUPNO_ZRNA },
        ukupnoTransakcija: dashboardData[4],
      }}
      auditLogs={auditLogs.map((l) => ({
        id: l.id, adminPseudonim: l.admin.pseudonim, akcija: l.akcija,
        targetId: l.targetId, detalji: l.detalji, createdAt: l.createdAt.toISOString(),
      }))}
      adminPokrovitelji={pokroviteljiData[0].map((p) => ({
        id: p.id,
        naziv: p.naziv,
        pib: p.pib,
        bpg: p.bpg,
        vlasnikPseudonim: p.vlasnik.pseudonim,
        logoUrl: p.logoUrl,
        rsdKumulativ: Number(p.rsdKumulativ),
        trenutniNivo: p.trenutniNivo,
        status: p.status,
        brDoprinosa: p._count.doprinosi,
        createdAt: p.createdAt.toISOString(),
      }))}
      verifikovaniKorisnici={pokroviteljiData[1]}
      krugoviLista2={pokroviteljiData[2]}
      blogObjave={blogObjave.map((o) => ({
        id: o.id,
        title: o.title,
        content: o.content,
        authorPseudonim: o.author.pseudonim,
        publishedAt: o.publishedAt.toISOString(),
        createdAt: o.createdAt.toISOString(),
      }))}
      adminPed={{
        oglasi: zaposljavanjeData[0].map((o) => ({
          id: o.id, title: o.title, description: o.description, obrazlozenje: o.obrazlozenje,
          source: o.source as string,
          predlozeniPoen: o.predlozeniPoen, saOdobravanjem: o.saOdobravanjem, positions: o.positions,
          deadline: o.deadline?.toISOString() ?? null, status: o.status as string,
          createdByPseudonim: o.createdBy.pseudonim, krugName: o.krug?.name ?? null,
          ukupnoPrijava: o._count.prijave, pendingEvidencija: o._count.evidencije,
          createdAt: o.createdAt.toISOString(),
        })),
        pendingPrijave: zaposljavanjeData[1].map((p) => ({
          id: p.id, pseudonim: p.user.pseudonim, oglasTitle: p.oglas.title,
          predlozeniPoen: p.oglas.predlozeniPoen, positions: p.oglas.positions,
          planIzvrsenja: p.planIzvrsenja,
          createdAt: p.createdAt.toISOString(),
        })),
        pendingEvidencije: zaposljavanjeData[2].map((e) => ({
          id: e.id, pseudonim: e.user.pseudonim, oglasTitle: e.oglas.title,
          date: e.date.toISOString(), predlozeniPoen: e.predlozeniPoen,
          description: e.description, dokaz: e.dokaz, createdAt: e.createdAt.toISOString(),
        })),
      }}
    />
  );
}
