import Obavestenje from "@/components/ui/Obavestenje";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MIN_ZADRUGARA, sledeciPrag } from "@/lib/zadruga-pravila";
import { opisTransakcije } from "@/lib/prevod-servera";
import { intlTag } from "@/lib/format";
import { profilHref } from "@/lib/profil-link";
import Kartica from "@/components/ui/Kartica";
import NaslovStranice from "@/components/ui/NaslovStranice";
import StatKartica from "@/components/ui/StatKartica";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Pseudonim from "@/components/Pseudonim";
import ZadrugaPrepis from "./ZadrugaPrepis";

/**
 * Stranica zadruge — Pravilnik o zadrugama (set 4.7.0).
 *
 * 🔴 Zapisi zadruge i spisak zadrugara vidljivi su redovnim članovima (čl. 19),
 * zadrugari pod pseudonimom. Ime i prezime zadrugara se ovde NE čita — upit ga
 * ni ne traži, pa ne može da procuri ni greškom u prikazu.
 */
export default async function ZadrugaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.maloletan) redirect("/pocetna");
  const { id } = await params;

  const z = await prisma.krug.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      location: true,
      zadruga: true,
      maticniBroj: true,
      prestanakAt: true,
      wallet: { select: { id: true, balance: true } },
      bonusLogs: { select: { threshold: true } },
    },
  });
  if (!z || !z.zadruga) notFound();

  const t = await getTranslations("zadruge");
  const locale = await getLocale();
  const verified = session.user.verified;
  const broj = (n: number) => n.toLocaleString(intlTag(locale));

  const [zadrugari, mojeClanstvo, zapisi] = await Promise.all([
    prisma.krugClanstvo.findMany({
      where: { krugId: id, leftAt: null },
      orderBy: { joinedAt: "asc" },
      select: { user: { select: { id: true, pseudonim: true } } },
    }),
    prisma.krugClanstvo.findFirst({ where: { krugId: id, userId: session.user.id, leftAt: null }, select: { id: true } }),
    verified && z.wallet
      ? prisma.transaction.findMany({
          where: { OR: [{ fromWalletId: z.wallet.id }, { toWalletId: z.wallet.id }] },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            amount: true,
            createdAt: true,
            fromWalletId: true,
            description: true,
            opisKljuc: true,
            opisParametri: true,
            fromWallet: { select: { user: { select: { id: true, pseudonim: true } }, krug: { select: { name: true } } } },
            toWallet: { select: { user: { select: { id: true, pseudonim: true } }, krug: { select: { name: true } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  const otvoren = z.bonusLogs.some((b) => b.threshold === MIN_ZADRUGARA);
  const sledeci = sledeciPrag(zadrugari.length);
  const aktivna = !z.prestanakAt;

  return (
    <div className="space-y-6">
      <div>
        <NaslovStranice
          nazad={{ href: "/zadruge", oznaka: t("nazad") }}
          naslov={z.name}
          opis={t("detalj_opis", { lokalitet: z.location ?? "—" })}
        />
        {!aktivna && <Obavestenje vrsta="upozorenje" className="mt-3">{t("prestala")}</Obavestenje>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatKartica oznaka={t("broj_zadrugara")} vrednost={broj(zadrugari.length)} />
        <StatKartica oznaka={t("zapis_zadruge")} vrednost={`${broj(z.wallet?.balance ?? 0)} POEN`} />
        <Kartica padding="sm" className="col-span-2 md:col-span-1">
          <p className="text-xs text-kolo-muted">{t("sledeci_prag")}</p>
          <p className="text-sm font-semibold mt-1">
            {sledeci ? t("sledeci_prag_tekst", { clanovi: sledeci.clanovi, poen: broj(sledeci.poen) }) : t("svi_pragovi")}
          </p>
          {!otvoren && <p className="text-xs text-kolo-muted mt-1">{t("zapis_se_otvara", { n: MIN_ZADRUGARA })}</p>}
        </Kartica>
      </div>

      {mojeClanstvo && aktivna && otvoren && <ZadrugaPrepis zadrugaId={z.id} />}

      {verified ? (
        <>
          <Kartica as="section">
            <h2 className="text-sm font-semibold">{t("zadrugari")}</h2>
            {zadrugari.length === 0 ? (
              <p className="text-sm text-kolo-muted mt-2">{t("nema_zadrugara")}</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {zadrugari.map((c) => (
                  <li key={c.user.id}>
                    <Link href={profilHref(c.user)} className="inline-flex min-h-9 items-center text-sm text-kolo-green-700 hover:underline">
                      <Pseudonim>{c.user.pseudonim}</Pseudonim>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Kartica>

          <Kartica as="section">
            <h2 className="text-sm font-semibold">{t("zapisi")}</h2>
            {zapisi.length === 0 ? (
              <p className="text-sm text-kolo-muted mt-2">{t("nema_zapisa")}</p>
            ) : (
              <ul className="mt-2 divide-y divide-kolo-border/50">
                {zapisi.map((r) => {
                  const izlaz = r.fromWalletId === z.wallet?.id;
                  const druga = izlaz ? r.toWallet : r.fromWallet;
                  const ime = druga?.user?.pseudonim ?? druga?.krug?.name ?? "Protokol";
                  return (
                    <li key={r.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate">{opisTransakcije(locale, r)}</p>
                        <p className="text-xs text-kolo-muted">
                          {izlaz ? "→" : "←"} {ime} · {r.createdAt.toLocaleDateString(intlTag(locale))}
                        </p>
                      </div>
                      <span className={`shrink-0 font-semibold tabular-nums ${izlaz ? "text-kolo-text" : "text-kolo-green-700"}`}>
                        {izlaz ? "−" : "+"}
                        {broj(r.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Kartica>
        </>
      ) : (
        <Kartica padding="nema">
          <PraznoStanje kompaktno naslov={t("samo_redovni")} />
        </Kartica>
      )}
    </div>
  );
}
