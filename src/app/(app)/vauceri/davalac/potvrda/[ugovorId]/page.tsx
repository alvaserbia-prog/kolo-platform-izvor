import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin } from "@/lib/dozvole";
import { intlTag } from "@/lib/format";
import { kljucMeseca, procitajMesec, zbirPotvrde } from "@/lib/pokroviteljstvo-dobrima-pravila";
import UgovorAkcije from "@/app/(app)/donacije/[id]/ugovor/UgovorAkcije";
import Kartica from "@/components/ui/Kartica";

export async function generateMetadata() {
  const t = await getTranslations("vauceri");
  return { title: `${t("potvrda_naslov")} — KOLO` };
}

/**
 * Potvrda o predaji dobara odnosno pružanju usluga bez naknade (odluka vlasnika
 * 20.10.2026) — za jedan vaučer (`?vaucer=`) ili zbirno po ugovoru za mesec
 * (`?mesec=YYYY-MM`, po beogradskom vremenu). Davalac njome realizaciju zatvara u
 * svojim knjigama: predaja po vaučeru je promet bez naknade, pa se ne izdaje ni
 * fiskalni račun ni e-faktura.
 *
 * Sadrži podatke davaoca iz SNIMKA ugovora, datum i kontrolni broj ugovora, i za
 * svaki iskorišćen vaučer oznaku, opis, količinu, vreme potvrde, pseudonim imaoca
 * i onoga ko je potvrdio (Politika 4.15 i čl. 8 — davalac vidi pseudonim imaoca),
 * te vrednost po cenovniku iz ugovora. 🔴 Bez POEN-a i bez reči o kasi i plaćanju
 * (brana `potvrda-predaje-izvor.test.ts`).
 *
 * Preuzima je samo korisnik koji vodi upis (odnosno podnosilac ugovora) i
 * administratorski tim; zaposleni davaoca ne. Tuđ ugovor izgleda kao nepostojeći.
 */
export default async function PotvrdaPredajePage({
  params,
  searchParams,
}: {
  params: Promise<{ ugovorId: string }>;
  searchParams: Promise<{ mesec?: string; vaucer?: string }>;
}) {
  const { ugovorId } = await params;
  const sp = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const [t, locale] = await Promise.all([getTranslations("vauceri"), getLocale()]);

  const u = await prisma.ugovorDobra.findUnique({
    where: { id: ugovorId },
    select: {
      podnosilacId: true, upisId: true, upis: { select: { vlasnikUserId: true } },
      vrstaDavaoca: true, naziv: true, adresaSedista: true, maticniBroj: true, pib: true, bpg: true,
      opis: true, cenaPoJedinici: true, potpisanoAt: true, kontrolniBroj: true,
    },
  });
  const smeDaVidi =
    !!u && (u.podnosilacId === session.user.id || u.upis?.vlasnikUserId === session.user.id || jeAdmin(session.user));
  if (!u || !smeDaVidi || !u.potpisanoAt || !u.kontrolniBroj) notFound();

  const mesec = procitajMesec(sp.mesec);
  const vaucerId = typeof sp.vaucer === "string" ? sp.vaucer : null;
  if (!mesec && !vaucerId) notFound();

  const svi = await prisma.vaucer.findMany({
    where: { ugovorId, status: "ISKORISCEN", ...(vaucerId ? { id: vaucerId } : {}) },
    orderBy: { iskoriscenAt: "asc" },
    select: {
      kod: true, iskoriscenAt: true,
      imalac: { select: { pseudonim: true } },
      potvrdio: { select: { pseudonim: true } },
    },
  });
  const stavke = svi.filter((v) => v.iskoriscenAt && (!mesec || kljucMeseca(v.iskoriscenAt) === mesec));
  if (vaucerId && stavke.length === 0) notFound();

  const cena = Number(u.cenaPoJedinici);
  const tag = intlTag(locale);
  const dinari = (x: number) => x.toLocaleString(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const vreme = (d: Date) =>
    d.toLocaleString(tag, { timeZone: "Europe/Belgrade", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const datum = (d: Date) => d.toLocaleDateString(tag, { timeZone: "Europe/Belgrade", day: "2-digit", month: "2-digit", year: "numeric" });
  const gazdinstvo = u.vrstaDavaoca === "GAZDINSTVO";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href={u.upisId ? `/postani-pokrovitelj/${u.upisId}?tab=vauceri` : "/postani-pokrovitelj"} className="inline-flex min-h-9 items-center text-sm text-kolo-muted hover:text-kolo-green-700">
          ← {t("primerak_nazad")}
        </Link>
        <UgovorAkcije labela={t("primerak_stampaj")} />
      </div>

      <Kartica padding="lg" className="space-y-4 text-sm text-kolo-text print:border-0 print:shadow-none print:rounded-none">
        <h1 className="text-base font-bold text-center uppercase tracking-wide">{t("potvrda_naslov")}</h1>

        <div className="space-y-0.5">
          <p><span className="font-semibold">{t("potvrda_davalac")}:</span> {u.naziv}</p>
          {gazdinstvo ? (
            <p>{t("potvrda_bpg")}: {u.bpg ?? "—"}</p>
          ) : (
            <>
              {u.adresaSedista && <p>{t("potvrda_sediste")}: {u.adresaSedista}</p>}
              <p>{t("potvrda_mb")}: {u.maticniBroj ?? "—"} · {t("potvrda_pib")}: {u.pib ?? "—"}</p>
            </>
          )}
          <p>{t("potvrda_ugovor", { datum: datum(u.potpisanoAt), broj: u.kontrolniBroj })}</p>
          <p>{vaucerId ? t("potvrda_pojedinacna") : t("potvrda_period", { mesec: mesec ?? "" })}</p>
        </div>

        {stavke.length === 0 ? (
          <p className="text-kolo-muted">{t("potvrda_nema")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-kolo-border text-left">
                  <th className="py-1.5 pr-2">{t("potvrda_kol_oznaka")}</th>
                  <th className="py-1.5 pr-2">{t("potvrda_kol_opis")}</th>
                  <th className="py-1.5 pr-2 text-right">{t("potvrda_kol_kolicina")}</th>
                  <th className="py-1.5 pr-2">{t("potvrda_kol_vreme")}</th>
                  <th className="py-1.5 pr-2">{t("potvrda_kol_imalac")}</th>
                  <th className="py-1.5 pr-2">{t("potvrda_kol_potvrdio")}</th>
                  <th className="py-1.5 text-right">{t("potvrda_kol_vrednost")}</th>
                </tr>
              </thead>
              <tbody>
                {stavke.map((v) => (
                  <tr key={v.kod} className="border-b border-kolo-border/60 align-top">
                    <td className="py-1.5 pr-2 font-mono">{v.kod}</td>
                    <td className="py-1.5 pr-2">{u.opis}</td>
                    <td className="py-1.5 pr-2 text-right">1</td>
                    <td className="py-1.5 pr-2 whitespace-nowrap">{vreme(v.iskoriscenAt!)}</td>
                    <td className="py-1.5 pr-2">{v.imalac?.pseudonim ?? "—"}</td>
                    <td className="py-1.5 pr-2">{v.potvrdio?.pseudonim ?? "—"}</td>
                    <td className="py-1.5 text-right whitespace-nowrap">{dinari(cena)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="py-2 pr-2" colSpan={6}>{t("potvrda_zbir", { n: stavke.length })}</td>
                  <td className="py-2 text-right whitespace-nowrap">{dinari(zbirPotvrde(stavke.length, cena))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p>{t("potvrda_tekst")}</p>
        <p className="text-xs text-kolo-muted">{t("potvrda_izdato", { datum: datum(new Date()) })}</p>
      </Kartica>
    </div>
  );
}
