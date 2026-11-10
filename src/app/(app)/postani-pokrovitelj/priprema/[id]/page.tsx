import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { pripremaZaKorisnika } from "@/lib/protokol/priprema-pokroviteljstva";
import { jePravniOblik } from "@/lib/pokroviteljstvo-dobrima-pravila";
import { kljuceviIzjavaUpisa } from "@/lib/upis-pokrovitelja-pravila";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Stranica from "@/components/ui/Stranica";
import PripremaPrihvatanje from "./PripremaPrihvatanje";

export async function generateMetadata() {
  const t = await getTranslations("postaniPokrovitelj");
  return { title: `${t("priprema_naslov")} — KOLO` };
}

/**
 * Pregled upisa i prijave koje je pripremila Fondacija (donacije čl. 16 st. 6, čl. 17 st. 4;
 * set 5.1.2). Vidi ga SAMO lice iz upisa kome je pripremljeno; tuđe izgleda kao nepostojeće.
 * Prihvatanjem, uz izjave iz čl. 17, nastaju upis i prijava kao da ih je samo podnelo.
 */
export default async function PripremaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const p = await pripremaZaKorisnika(id, session.user.id);
  if (!p) notFound();
  const t = await getTranslations("postaniPokrovitelj");
  const oblik = p.upis.vrsta !== "GAZDINSTVO" && jePravniOblik(p.upis.pravniOblik) ? p.upis.pravniOblik : null;
  const kljucevi = kljuceviIzjavaUpisa(oblik);
  const tekst = (k: string) => (typeof p.upis[k] === "string" || typeof p.upis[k] === "number" ? String(p.upis[k]) : null);

  return (
    <Stranica>
      <NaslovStranice
        nazad={{ href: "/postani-pokrovitelj", oznaka: t("naslov") }}
        naslov={t("priprema_naslov")}
        opis={t("priprema_uvod")}
      />
      <PripremaPrihvatanje
        id={p.id}
        podaci={{
          naziv: tekst("naziv") ?? "",
          gazdinstvo: p.upis.vrsta === "GAZDINSTVO",
          imePrezime: tekst("imePrezime"),
          odnos: tekst("odnosPremaDavaocu"),
          maticniBroj: tekst("maticniBroj"),
          pib: tekst("pib"),
          bpg: tekst("bpg"),
          adresaSedista: tekst("adresaSedista"),
          kontaktTelefon: tekst("kontaktTelefon"),
          mapa: [p.mapaMesto, tekst("mapaAdresa")].filter(Boolean).join(", "),
          vrstaPrijave: p.vrstaPrijave,
          vrednostRsd: p.vrednostRsd,
          opisDobra: p.predmetDobra && typeof p.predmetDobra.opis === "string" ? p.predmetDobra.opis : null,
          brojVaucera: p.predmetDobra ? Number(p.predmetDobra.brojVaucera) || null : null,
          cenaPoJedinici: p.predmetDobra ? Number(p.predmetDobra.cenaPoJedinici) || null : null,
          mestoPredaje: p.mestaPredaje.join("; "),
          brojCenovnika: p.brojCenovnika,
        }}
        trebaIzjavaOvlascenja={p.trebaIzjavaOvlascenja}
        izjaveUpisaDate={p.samoPrijava || p.upisNastao}
        jeHrana={p.jeHrana}
        kljucOvlascenja={kljucevi.ovlascenje}
        kljucPotvrde={kljucevi.potvrda}
      />
    </Stranica>
  );
}
