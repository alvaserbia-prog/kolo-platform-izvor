import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
 * Pokroviteljstvo (Pravilnik o pokroviteljstvu i donacijama čl. 15–36).
 *
 * Kratko objašnjenje (novac; roba i usluge), „Moje firme i gazdinstva" — upisi u
 * evidenciju pokrovitelja koje korisnik vodi (čl. 16) — i dugme za nov upis. Iz
 * odobrenog upisa se, na stranici pokrovitelja, podnose prijave. Zaposleni koga je
 * pokrovitelj odredio ovde vidi „Firme za koje potvrđujem vaučere" i proveru koda.
 *
 * Adresa `/postani-pokrovitelj` ostaje (stari linkovi iz obaveštenja i mejlova).
 */
export default async function PokroviteljstvoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const t = await getTranslations("postaniPokrovitelj");

  const [upisi, davaoci] = await Promise.all([mojiUpisi(session.user.id), davaociZaposlenog(session.user.id)]);
  const zivi = upisi.filter((u) => !u.obrisanAt);
  const obrisani = upisi.filter((u) => u.obrisanAt);
  // Maloletni korisnik upis ne vrši (čl. 16 st. 1). Potvrda stvarnosti nije uslov
  // (set 4.8.0): novčano pokroviteljstvo i samo potvrđuje podnosioca (dokaz
  // stvarnosti čl. 8 st. 1 t. 3); dobra i usluge i dalje traže potvrdu (ruta `dobra`).
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
          {/* Nalaz građana (24.10.2026): „Šta ja dobijam?“ — samo ono što je tačno (donacije čl. 26). */}
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
            vodio upis pokrovitelj se uklanja i sa nje (čl. 18 st. 4). */}
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

      {/* Pokroviteljstvo nema tabelu nivoa: koeficijent je 1,00 za novac i za dobra i
          usluge (donacije čl. 22, set 5.0.0, izmena 28.10.2026). Tabela nivoa živi samo na ekranu Donacije. */}
      <p className="text-xs text-kolo-muted">{t("nivoi_napomena")}</p>
    </div>
  );
}
