import { getServerSession } from "next-auth";
import { intlTag } from "@/lib/format";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { tabelaPokroviteljstvaZaPrikaz } from "@/lib/donacija-pravila";
import { mojiUpisi } from "@/lib/protokol/upis-pokrovitelja";
import { davaociZaposlenog } from "@/lib/protokol/pokroviteljstvo-dobrima";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import ProveraVaucera from "@/components/pokroviteljstvo/ProveraVaucera";
import UkloniSaRangListe from "./UkloniSaRangListe";
import Kartica from "@/components/ui/Kartica";
import { klaseDugmeta } from "@/components/ui/Dugme";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Obavestenje from "@/components/ui/Obavestenje";

export const metadata = { title: "Pokroviteljstvo — KOLO" };

/**
 * Pokroviteljstvo (Pravilnik o pokroviteljstvu i donacijama čl. 6–13l).
 *
 * Kratko objašnjenje (novac; roba i usluge), „Moje firme i gazdinstva" — upisi u
 * evidenciju pokrovitelja koje korisnik vodi (čl. 6a) — i dugme za nov upis. Iz
 * odobrenog upisa se, na stranici pokrovitelja, podnose prijave. Zaposleni koga je
 * pokrovitelj odredio ovde vidi „Firme za koje potvrđujem vaučere" i proveru koda.
 *
 * Adresa `/postani-pokrovitelj` ostaje (stari linkovi iz obaveštenja i mejlova).
 */
export default async function PokroviteljstvoPage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const t = await getTranslations("postaniPokrovitelj");
  const td = await getTranslations("donacije");

  const [upisi, davaoci] = await Promise.all([mojiUpisi(session.user.id), davaociZaposlenog(session.user.id)]);
  const zivi = upisi.filter((u) => !u.obrisanAt);
  const obrisani = upisi.filter((u) => u.obrisanAt);
  // Maloletni korisnik upis ne vrši (čl. 6a st. 1). Potvrda stvarnosti nije uslov
  // (set 4.8.0): novčano pokroviteljstvo i samo potvrđuje podnosioca (dokaz
  // stvarnosti čl. 4a); dobra i usluge i dalje traže potvrdu (ruta `dobra`).
  const smeUpis = !session.user.maloletan;

  const STATUS: Record<string, string> = {
    NA_PROVERI: t("upis_status_na_proveri"),
    ODOBREN: t("upis_status_odobren"),
    ODBIJEN: t("upis_status_odbijen"),
  };

  return (
    <div className="space-y-6">
      <div>
        <NaslovStranice naslov={t("naslov")} opis={t("opis")} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Kartica padding="sm">
            <p className="text-sm font-semibold text-kolo-text">{t("objasnjenje_novac_naslov")}</p>
            <p className="mt-1 text-sm text-kolo-muted">{t("objasnjenje_novac")}</p>
          </Kartica>
          <Kartica padding="sm">
            <p className="text-sm font-semibold text-kolo-text">{t("objasnjenje_dobra_naslov")}</p>
            <p className="mt-1 text-sm text-kolo-muted">{t("objasnjenje_dobra")}</p>
          </Kartica>
          {/* Nalaz građana (24.10.2026): „Šta ja dobijam?“ — samo ono što je tačno (donacije čl. 13). */}
          <Kartica padding="sm" className="sm:col-span-2">
            <p className="text-sm font-semibold text-kolo-text">{t("sta_dobija_naslov")}</p>
            <p className="mt-1 text-sm text-kolo-muted">{t("sta_dobija_tekst")}</p>
          </Kartica>
        </div>
      </div>

      {!session.user.verified && !session.user.maloletan && (
        <Obavestenje
          vrsta="upozorenje"
          naslov={t("verifikacija_potrebna")}
          radnja={
            <Link href="/verifikacija" className="text-sm font-semibold text-kolo-green-700 underline">
              {t("verifikacija_link")}
            </Link>
          }
        >
          <p>{t("verifikacija_opis")}</p>
        </Obavestenje>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-kolo-text">{t("moje_firme_naslov")}</h2>
          {smeUpis && (
            <Link
              href="/postani-pokrovitelj/upis"
              className={klaseDugmeta()}
            >
              {t("upis_dugme")}
            </Link>
          )}
        </div>
        {zivi.length === 0 ? (
          <p className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-5 text-sm text-kolo-muted">
            {smeUpis ? t("moje_firme_prazno") : t("upis_samo_punoletni")}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {zivi.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/postani-pokrovitelj/${u.id}`}
                  className="flex items-center gap-3 rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-4 hover:border-kolo-green-500 transition-colors"
                >
                  <LogotipPokrovitelja url={u.logoUrl} velicina={48} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-kolo-text truncate">{u.naziv}</span>
                    <span className="block text-xs text-kolo-muted">
                      {u.vrsta === "GAZDINSTVO" ? t("upis_vrsta_gazdinstvo") : t("upis_vrsta_firma")}
                    </span>
                    <span className={`block text-xs font-semibold mt-1 ${u.status === "ODOBREN" ? "text-kolo-green-700" : u.status === "ODBIJEN" ? "text-kolo-danger" : "text-kolo-gold-700"}`}>
                      {STATUS[u.status]}
                      {u.izmenaPodnetaAt && ` · ${t("upis_izmena_na_proveri")}`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {/* Obrisan upis: doprinosi ostaju na rang-listi; na zahtev korisnika koji je
            vodio upis pokrovitelj se uklanja i sa nje (čl. 6a st. 6). */}
        {obrisani.length > 0 && (
          <div className="rounded-kontrola bg-kolo-bg p-4 space-y-2">
            <p className="text-sm font-semibold text-kolo-text">{t("obrisani_naslov")}</p>
            <p className="text-xs text-kolo-muted">{t("obrisani_opis")}</p>
            <ul className="space-y-2">
              {obrisani.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-kolo-text">{u.naziv}</span>
                  <UkloniSaRangListe upisId={u.id} naziv={u.naziv} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {davaoci.length > 0 && (
        <section className="space-y-3">
          <Kartica className="space-y-2">
            <h2 className="font-semibold text-kolo-text">{t("potvrdjujem_naslov")}</h2>
            <p className="text-sm text-kolo-muted">{t("potvrdjujem_opis")}</p>
            <ul className="space-y-2">
              {davaoci.map((d) => (
                <li key={d.upisId} className="flex items-center gap-3 text-sm text-kolo-text">
                  <LogotipPokrovitelja url={d.logoUrl} velicina={32} />
                  {d.naziv}
                </li>
              ))}
            </ul>
          </Kartica>
          <ProveraVaucera />
        </section>
      )}

      <p className="text-sm">
        <Link href="/pokrovitelji" className="font-medium text-kolo-green-700 hover:underline">{t("ranglista_link")}</Link>
      </p>

      {/* Ista tabela kao na ekranu Donacije (čl. 10 — pokroviteljstvo ide po tabeli
          donacije fizičkog lica). Čita se iz pravila, ne prepisuje se ovde. */}
      <details className="bg-kolo-surface rounded-kartica shadow-kartica border border-kolo-border overflow-hidden">
        <summary className="px-4 py-3 min-h-11 cursor-pointer text-sm font-semibold text-kolo-text">{td("tabela_naslov")}</summary>
        <div className="overflow-x-auto border-t border-kolo-border">
          <table className="w-full min-w-[280px] text-sm">
            <thead>
              <tr className="bg-kolo-bg border-b border-kolo-border">
                <th className="px-4 py-2 text-left text-xs font-medium text-kolo-muted">{td("tabela_nivo")}</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-kolo-muted">{td("tabela_do")}</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-kolo-muted">{td("tabela_kurs")}</th>
              </tr>
            </thead>
            <tbody>
              {tabelaPokroviteljstvaZaPrikaz().map((r) => (
                <tr key={r.nivo} className="border-b border-kolo-border last:border-0">
                  <td className="px-4 py-2.5 font-medium text-kolo-text">{r.nivo}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-kolo-muted">
                    {r.do >= 1_000_000_000
                      ? "1 mlrd"
                      : r.do >= 1_000_000
                      ? `${(r.do / 1_000_000).toFixed(0)} mil`
                      : r.do.toLocaleString(intlTag(locale))}
                  </td>
                  <td className="px-4 py-2.5 text-right text-kolo-muted">{r.kurs.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 border-t border-kolo-border text-xs text-kolo-muted">{t("nivoi_napomena")}</p>
      </details>
    </div>
  );
}
