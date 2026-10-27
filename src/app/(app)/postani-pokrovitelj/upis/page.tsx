import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { imeNaloga } from "@/lib/protokol/identitet";
import { predlogIzGazdinstva } from "@/lib/protokol/upis-pokrovitelja";
import UpisForma from "./UpisForma";
import NaslovStranice from "@/components/ui/NaslovStranice";

export async function generateMetadata() {
  const t = await getTranslations("postaniPokrovitelj");
  return { title: `${t("upis_naslov")} — KOLO` };
}

/**
 * Upis pokrovitelja u evidenciju (donacije čl. 16): izbor — pravno lice odnosno
 * preduzetnik ili registrovano poljoprivredno gazdinstvo — pa obrazac na jednoj
 * strani. Upis vrši punoletni verifikovani korisnik sa sopstvenog naloga.
 *
 * Za gazdinstvo: ako je korisnik nosilac odobrenog gazdinstva sa BPG-om u modulu
 * gazdinstava, nudi se popuna naziva, BPG-a, mesta, adrese i tačke iz njega.
 */
export default async function UpisPage({ searchParams }: { searchParams: Promise<{ vrsta?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.maloletan) redirect("/postani-pokrovitelj");
  const t = await getTranslations("postaniPokrovitelj");
  const { vrsta } = await searchParams;

  if (vrsta !== "FIRMA" && vrsta !== "GAZDINSTVO") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <NaslovStranice
          nazad={{ href: "/postani-pokrovitelj", oznaka: t("naslov") }}
          naslov={t("upis_naslov")}
          opis={t("upis_uvod")}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/postani-pokrovitelj/upis?vrsta=FIRMA" className="rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-5 hover:border-kolo-green-500 transition-colors">
            <p className="font-semibold text-kolo-text">{t("upis_vrsta_firma")}</p>
            <p className="mt-1 text-sm text-kolo-muted">{t("upis_vrsta_firma_opis")}</p>
          </Link>
          <Link href="/postani-pokrovitelj/upis?vrsta=GAZDINSTVO" className="rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica p-5 hover:border-kolo-green-500 transition-colors">
            <p className="font-semibold text-kolo-text">{t("upis_vrsta_gazdinstvo")}</p>
            <p className="mt-1 text-sm text-kolo-muted">{t("upis_vrsta_gazdinstvo_opis")}</p>
          </Link>
        </div>
      </div>
    );
  }

  const [upisanoIme, predlog] = await Promise.all([
    imeNaloga(session.user.id),
    vrsta === "GAZDINSTVO" ? predlogIzGazdinstva(session.user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <NaslovStranice
        nazad={{ href: "/postani-pokrovitelj/upis", oznaka: t("upis_naslov") }}
        naslov={vrsta === "GAZDINSTVO" ? t("upis_vrsta_gazdinstvo") : t("upis_vrsta_firma")}
      />
      <UpisForma vrsta={vrsta} upisanoIme={upisanoIme} predlog={predlog} />
    </div>
  );
}
