import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { davaociZaposlenog } from "@/lib/protokol/pokroviteljstvo-dobrima";
import { mojiUpisi } from "@/lib/protokol/upis-pokrovitelja";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import ProveraVaucera from "@/components/pokroviteljstvo/ProveraVaucera";
import Kartica from "@/components/ui/Kartica";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Stranica from "@/components/ui/Stranica";
import NaslovStranice from "@/components/ui/NaslovStranice";

export async function generateMetadata() {
  const t = await getTranslations("vauceri");
  return { title: `${t("provera_naslov")} — KOLO` };
}

/**
 * Ulaz za proveru vaučera (nabavke čl. 34). Ugovori, potpis, zaposleni i podaci
 * pokrovitelja su od seta 4.7.8 na stranici pokrovitelja (`/postani-pokrovitelj/[id]`);
 * ova adresa ostaje zbog starih linkova iz obaveštenja i mejlova i kao ulaz za
 * zaposlenog (donacije čl. 32 st. 3), koji vidi samo proveru i potvrdu koda.
 */
export default async function DavalacPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const [t, tp] = await Promise.all([getTranslations("vauceri"), getTranslations("postaniPokrovitelj")]);
  const [davaoci, upisi] = await Promise.all([davaociZaposlenog(session.user.id), mojiUpisi(session.user.id)]);
  const moji = upisi.filter((u) => !u.obrisanAt);

  return (
    <Stranica>
      <NaslovStranice naslov={t("davalac_naslov")} opis={t("davalac_uvod")} />

      {moji.length > 0 && (
        <Kartica as="section" className="space-y-2">
          <NaslovSekcije>{tp("moje_firme_naslov")}</NaslovSekcije>
          <ul className="space-y-2">
            {moji.map((u) => (
              <li key={u.id}>
                <Link href={`/postani-pokrovitelj/${u.id}`} className="flex min-h-10 items-center gap-3 text-sm font-medium text-kolo-text hover:underline">
                  <LogotipPokrovitelja url={u.logoUrl} velicina={32} />
                  {u.naziv}
                </Link>
              </li>
            ))}
          </ul>
        </Kartica>
      )}

      {davaoci.length > 0 && (
        <Kartica as="section" className="space-y-2">
          <NaslovSekcije opis={tp("potvrdjujem_opis")}>{tp("potvrdjujem_naslov")}</NaslovSekcije>
          <ul className="space-y-2">
            {davaoci.map((d) => (
              <li key={d.upisId} className="flex items-center gap-3 text-sm text-kolo-text">
                <LogotipPokrovitelja url={d.logoUrl} velicina={32} />
                {d.naziv}
              </li>
            ))}
          </ul>
        </Kartica>
      )}

      {(moji.length > 0 || davaoci.length > 0) ? (
        <ProveraVaucera />
      ) : (
        <p className="text-sm text-kolo-muted bg-kolo-bg rounded-kontrola px-3 py-2">
          {t("ugovori_prazno")}{" "}
          <Link href="/postani-pokrovitelj" className="underline">{t("prijava_link")}</Link>
        </p>
      )}
    </Stranica>
  );
}
