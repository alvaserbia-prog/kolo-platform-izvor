import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { USLOV_CLANA_U_SPISKU } from "@/lib/clanovi-spisak";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Kartica from "@/components/ui/Kartica";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Stranica from "@/components/ui/Stranica";
import ZakljucanModul from "@/components/ui/ZakljucanModul";
import { PRAG_PRVE_ZADRUGE } from "@/lib/zadruga-pravila";
import LokacijeSekcija from "@/components/LokacijeSekcija";
import type { Clan } from "@/components/SistemListe";
import { zadrugeZaPrikaz } from "@/lib/protokol/zadruga";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("zadruge");
  return pageMetadata({ title: `${t("naslov")} — KOLO`, description: t("meta_opis"), path: "/zadruge" });
}

/**
 * Zadruge — po lokalitetima (Pravilnik čl. 50: teritorijalni princip).
 *
 * Stranica nosi spisak lokacija na kojima žive članovi, isti kao kartica
 * „Lokacije" na `/sistem`, i zadruge upisane na svakoj od njih (Pravilnik o
 * zadrugama, set 4.7.0). Radni zapis modela: `docs/zadruge-model.md`.
 *
 * 🔴 Javna je (odluka vlasnika, 18.10.2026), ali gost vidi samo ZBIR po mestu:
 * upit za njega ne čita pseudonim, avatar ni stanje, pa rang-lista lokacije ne
 * može da procuri ni greškom u prikazu. Vidljivost sprovodi server, ne ekran.
 *
 * Dete ne osniva zadrugu i nije zadrugar, pa mu se stranica ne otvara.
 */
export default async function ZadrugePage() {
  const session = await getServerSession(authOptions);
  if (session?.user.maloletan) redirect("/pocetna");

  const t = await getTranslations("zadruge");

  const zadruge = await zadrugeZaPrikaz();

  // 🔴 Korisnik van Kola i gost dobijaju isti zbir po mestu: rang-lista lokacije
  // (pseudonim, avatar, stanje) ide samo verifikovanom (Pravilnik čl. 56).
  if (!session || !session.user.verified) {
    const mesta = await prisma.user.findMany({
      where: USLOV_CLANA_U_SPISKU,
      select: { verified: true, maloletan: true, location: true },
    });
    // Samo ono što zbir traži; identifikator je redni broj, ne id naloga.
    const anonimni: Clan[] = mesta.map((u, i) => ({
      id: String(i),
      pseudonim: "",
      verified: u.verified,
      maloletan: u.maloletan,
      avatar: null,
      balance: 0,
      krug: null,
      rangDonacije: 0,
      location: u.location ?? null,
      createdAt: "",
    }));
    return (
      <Sadrzaj t={t} zadruge={zadruge} zakljucano={!!session}>
        <LokacijeSekcija clanovi={anonimni} verified={false} zadruge={zadruge} bezRangListe={!session} bezUvoda />
      </Sadrzaj>
    );
  }

  const korisnici = await prisma.user.findMany({
    where: USLOV_CLANA_U_SPISKU,
    orderBy: [{ wallet: { balance: "desc" } }],
    select: {
      id: true,
      pseudonim: true,
      verified: true,
      avatar: true,
      location: true,
      createdAt: true,
      maloletan: true,
      wallet: { select: { balance: true } },
    },
  });

  // Prikaz lokacija čita samo lokaciju, potvrđenost i stanje za rang-listu;
  // polja koja `Clan` nosi za druge kartice `/sistem` ovde ostaju prazna.
  const clanovi: Clan[] = korisnici.map((u) => ({
    id: u.id,
    pseudonim: u.pseudonim,
    verified: u.verified,
    maloletan: u.maloletan,
    avatar: u.avatar,
    balance: u.wallet?.balance ?? 0,
    krug: null,
    rangDonacije: 0,
    location: u.location ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <Sadrzaj t={t} zadruge={zadruge}>
      <LokacijeSekcija clanovi={clanovi} verified={session.user.verified} zadruge={zadruge} bezUvoda />
    </Sadrzaj>
  );
}

function Sadrzaj({
  t,
  zadruge,
  zakljucano = false,
  children,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"zadruge">>>;
  zadruge: Awaited<ReturnType<typeof zadrugeZaPrikaz>>;
  /** Prijavljen korisnik koji nije u Kolu: zadrugu koristi ko je u Kolu. */
  zakljucano?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Stranica sirina="siroka">
      {/* Prag prve zadruge čita se iz pravila (`PRAG_PRVE_ZADRUGE`), ne prepisuje. */}
      <NaslovStranice naslov={t("naslov")} opis={t("opis_stranice", { prag: PRAG_PRVE_ZADRUGE })} />
      {zakljucano && <ZakljucanModul poruka={t("zakljucano")} />}
      {zadruge.length > 0 && (
        <section className="space-y-3">
          <NaslovSekcije>{t("upisane_naslov")}</NaslovSekcije>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {zadruge.map((z) => (
              <Kartica key={z.id} href={`/zadruge/${z.id}`} padding="sm">
                <p className="font-semibold text-kolo-text">{z.naziv}</p>
                <p className="text-xs text-kolo-muted mt-0.5">
                  {z.lokalitet} · {t("zadrugara", { n: z.zadrugara })}
                </p>
              </Kartica>
            ))}
          </div>
        </section>
      )}
      {/* Sidro za karticu „Za koga je KOLO" sa naslovne. */}
      <div id="lokacije" className="scroll-mt-24">{children}</div>
      {/* Zajednici (udruženju, mesnoj zajednici) stranica kaže šta da uradi, ne samo
          koliko fali — revizija teksta, uloga 6 (krug 2). Sklopivo, ispod spiska
          (odluka vlasnika 02.11.2026). */}
      <Kartica as="section" padding="nema">
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center px-5 py-3 text-base font-semibold text-kolo-text">
            {t("zajednica_naslov")}
          </summary>
          <div className="space-y-2 px-5 pb-5">
            <ol className="list-decimal pl-5 space-y-1 text-sm text-kolo-text">
              <li>{t("zajednica_korak_1")}</li>
              <li>{t("zajednica_korak_2")}</li>
              <li>{t("zajednica_korak_3", { prag: PRAG_PRVE_ZADRUGE })}</li>
            </ol>
            <p className="text-sm text-kolo-muted">{t("zajednica_napomena")}</p>
          </div>
        </details>
      </Kartica>
      <p className="text-xs text-kolo-muted">
        {t("napomena_pravno")}{" "}
        {t("pravilnik_napomena")}{" "}
        <Link href="/pravilnik/zadruge" className="underline">
          {t("pravilnik_link")}
        </Link>
      </p>
    </Stranica>
  );
}
