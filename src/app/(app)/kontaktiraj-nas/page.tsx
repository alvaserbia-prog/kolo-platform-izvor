import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { ucitajStatus, jeDete, jeVerifikovan } from "@/lib/protokol/status";
import {
  jeOsnovSpiska,
  mojZahtev,
  osnoviZaSpisak,
  podaciZaSpisak,
  uslovRazgovoraRadiPotvrde,
  type OsnovSpiska,
} from "@/lib/protokol/zahtev-razgovor";
import KontaktObrazac from "./KontaktObrazac";
import NaslovStranice from "@/components/ui/NaslovStranice";

/**
 * „Želim da me neko nazove" — ulazak na spisak za poziv (dokaz stvarnosti čl. 4a;
 * Uslovi čl. 16b; set 4.8.3). Ruta ostaje `/kontaktiraj-nas` (CLAUDE.md pravilo 12).
 *
 * KORISNIK dolazi na spisak radi upoznavanja. ČLAN BEZ POTVRDE koji ispunjava uslove
 * iz čl. 5c st. 2 dolazi na spisak radi potvrde (osnov POTVRDA; zove čuvar Kola); ako
 * ih ne ispunjava, vraća se na Potvrde, gde piše koji uslov nedostaje. Član Kola,
 * čuvar i osnivač idu na Potvrde; dete na svoju stranicu.
 * `?osnov=` bira osnov van zahteva (donacija, pokroviteljstvo, gazdinstvo iz RPG) —
 * važi samo ako ga je Fondacija utvrdila, inače je osnov zahtev za razgovor.
 */
export default async function KontaktirajNasPage({
  searchParams,
}: {
  searchParams: Promise<{ osnov?: string | string[] }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const t = await getTranslations("kontakt");

  const status = await ucitajStatus(session.user.id);
  if (!status) redirect("/login");
  if (jeDete(status)) redirect("/prijatelji");
  const radiPotvrde = status === "CLAN_BEZ_POTVRDE";
  if (radiPotvrde) {
    const uslov = await uslovRazgovoraRadiPotvrde(session.user.id);
    if (!uslov.ok) redirect("/verifikacija#nazove");
  } else if (jeVerifikovan(status)) redirect("/verifikacija#zahtevi");

  const [moj, osnovi, profil, sp] = await Promise.all([
    mojZahtev(session.user.id),
    osnoviZaSpisak(session.user.id),
    podaciZaSpisak(session.user.id),
    searchParams,
  ]);
  const trazeni = Array.isArray(sp.osnov) ? sp.osnov[0] : sp.osnov;
  const osnov: OsnovSpiska = radiPotvrde
    ? "POTVRDA"
    : jeOsnovSpiska(trazeni) && osnovi.includes(trazeni)
      ? trazeni
      : moj && moj.osnov !== "ZAHTEV" && osnovi.includes(moj.osnov)
        ? moj.osnov
        : "ZAHTEV";

  return (
    <div className="max-w-xl mx-auto py-6 space-y-5">
      <div className="space-y-2">
        <NaslovStranice
          naslov={radiPotvrde ? t("naslov_potvrda") : t("naslov")}
          opis={
            radiPotvrde ? (
              t("uvod_potvrda")
            ) : osnov === "ZAHTEV" ? (
              t("uvod")
            ) : (
              <>
                {t(`osnov_${osnov.toLowerCase()}`)} {t("uvod_osnov")}
              </>
            )
          }
        />
        <p className="text-sm text-kolo-text">{radiPotvrde ? t("obavestenje_potvrda") : t("obavestenje")}</p>
        <p className="text-xs text-kolo-muted">{t("ne_potvrdjuje")}</p>
      </div>
      <KontaktObrazac
        osnov={osnov}
        pocetno={{
          imePrezime: profil.imePrezime,
          mesto: profil.mesto || moj?.mesto || "",
          opis: moj?.opis ?? "",
          dostupnost: moj?.dostupnost ?? "",
          telefon: profil.telefon || moj?.telefon || "",
        }}
        imeUpisano={profil.imeUpisano}
        poslat={!!moj}
      />
    </div>
  );
}
