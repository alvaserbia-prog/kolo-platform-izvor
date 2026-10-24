import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { sesija } from "@/lib/sesija";
import { pokroviteljiZaMapu } from "@/lib/protokol/upis-pokrovitelja";
import LogotipPokrovitelja from "@/components/LogotipPokrovitelja";
import Kartica from "@/components/ui/Kartica";
import { klaseDugmeta } from "@/components/ui/Dugme";
import NaslovStranice from "@/components/ui/NaslovStranice";
import PraznoStanje from "@/components/ui/PraznoStanje";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("firme");
  return { title: `${t("naslov")} — KOLO`, description: t("meta_opis") };
}

/**
 * Firme — spisak firmi koje kroz pokroviteljstvo dobrima i uslugama trenutno
 * nude vaučere (meni „Podrži", odluka vlasnika 20.10.2026). Vaučeri prikazuju
 * ponudu po dobru, ovde je ista ponuda po firmi.
 *
 * 🔴 Uz firmu samo naziv, logotip, mesto, adresa i ponuda vaučera (donacije čl. 13
 * st. 4) — bez opisa, reklamnog teksta i veze ka internet stranici, jer
 * pokrovitelj ne stiče promociju. Na spisku je samo firma koja trenutno ima
 * slobodne vaučere: upis bez doprinosa bi bio reklama. Novčani pokrovitelji su
 * na rang-listi (`/pokrovitelji`).
 */
export default async function FirmePage() {
  const session = await sesija();
  if (session?.user.maloletan) redirect("/pocetna");
  const t = await getTranslations("firme");

  const firme = (await pokroviteljiZaMapu())
    .filter((p) => p.vrsta === "FIRMA" && p.vauceri > 0)
    .sort((a, b) => a.mesto.localeCompare(b.mesto, "sr") || a.naziv.localeCompare(b.naziv, "sr"));
  const smeUpis = !!session && session.user.verified;

  return (
    <div className="max-w-[1000px] mx-auto pb-16 space-y-6">
      <NaslovStranice naslov={t("naslov")} opis={t("uvod")} />

      {smeUpis && (
        <Kartica className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-kolo-text">{t("moje_poziv")}</p>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/postani-pokrovitelj" className={klaseDugmeta({ varijanta: "sekundarno" })}>
              {t("moje_firme")}
            </Link>
            <Link href="/postani-pokrovitelj/upis?vrsta=FIRMA" className={klaseDugmeta()}>
              {t("upisi_firmu")}
            </Link>
          </div>
        </Kartica>
      )}

      {firme.length === 0 ? (
        <Kartica padding="nema">
          <PraznoStanje kompaktno naslov={t("nema_firmi")} />
        </Kartica>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {firme.map((f) => (
            <li key={f.id}>
              <Link
                href={`/vauceri?upis=${encodeURIComponent(f.id)}`}
                className="flex items-start gap-3 rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-4 hover:border-kolo-green-500 transition-colors"
              >
                <LogotipPokrovitelja url={f.logoUrl} />
                <div className="min-w-0">
                  <p className="font-semibold text-kolo-text">{f.naziv}</p>
                  <p className="mt-0.5 text-xs text-kolo-muted">{f.adresa ? `${f.adresa}, ${f.mesto}` : f.mesto}</p>
                  <p className="mt-2 text-xs text-kolo-green-700">{t("vaucera_n", { n: f.vauceri })}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm flex flex-wrap gap-x-5 gap-y-1">
        <Link href="/mapa" className="font-medium text-kolo-green-700 hover:underline">{t("link_mapa")}</Link>
        <Link href="/pokrovitelji" className="font-medium text-kolo-green-700 hover:underline">{t("link_rang_lista")}</Link>
      </p>
    </div>
  );
}
