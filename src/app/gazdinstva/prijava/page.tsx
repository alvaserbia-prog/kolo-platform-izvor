import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { sesija } from "@/lib/sesija";
import { prisma } from "@/lib/prisma";
import { aktivnoClanstvo, smeImatiClanove } from "@/lib/protokol/gazdinstvo";
import { ucitajStatus, jePotvrdjen } from "@/lib/protokol/status";
import { imeNaloga } from "@/lib/protokol/identitet";
import PrijavaForma from "./PrijavaForma";
import NaslovStranice from "@/components/ui/NaslovStranice";
import { MIN_OGLASA_UZ_PRIJAVU } from "@/lib/gazdinstvo-pravila";
import Obavestenje from "@/components/ui/Obavestenje";

/**
 * Prijava gazdinstva (Pravilnik o gazdinstvima čl. 4), odnosno izmena prijave
 * dok nije odobrena (`?izmena=<id>`, samo onaj ko upravlja).
 *
 * Ruta je pod javnim prefiksom `/gazdinstva` (mapa je javna), pa sesiju
 * proverava sama. Maloletni nalog ne može biti član gazdinstva.
 *
 * Ko šta sme da prijavi zavisi od statusa (čl. 4a): korisnik i član bez potvrde
 * samo kao nosilac gazdinstva upisanog u Registar, bez članova i uz izvod (čl. 4b).
 * Forma to prikazuje; server (`smePrijaviti`) proverava isto.
 */
export default async function PrijavaGazdinstvaPage({
  searchParams,
}: {
  searchParams: Promise<{ izmena?: string }>;
}) {
  const session = await sesija();
  if (!session) redirect("/login");
  if (session.user.maloletan) redirect("/pocetna");
  const t = await getTranslations("gazdinstva");
  const { izmena } = await searchParams;

  const clanstvo = await aktivnoClanstvo(session.user.id);
  // Sopstveno upisano ime — vidi ga samo vlasnik naloga (evidencija identiteta, čl. 31a).
  const upisanoIme = await imeNaloga(session.user.id);
  const status = await ucitajStatus(session.user.id);
  const samoNosilac = !status || !jePotvrdjen(status);

  if (izmena) {
    const g = await prisma.gazdinstvo.findUnique({
      where: { id: izmena },
      select: {
        id: true, naziv: true, opis: true, bpg: true, neregistrovano: true, naselje: true, adresa: true, lat: true, lng: true,
        izjavaAdresaAt: true, smeClanoveOd: true, telefonZaRazgovor: true, razgovorObavljenAt: true,
        status: true, upravljaId: true,
        clanovi: { where: { userId: session.user.id }, select: { uloga: true } },
      },
    });
    if (!g || g.upravljaId !== session.user.id || (g.status !== "NACRT" && g.status !== "VRACENO")) {
      redirect(`/gazdinstva/${izmena}`);
    }
    return (
      <div className="max-w-[760px] mx-auto pb-16 space-y-4">
        <NaslovStranice naslov={t("izmena_naslov")} />
        <PrijavaForma
          izmenaId={g.id}
          upisanoIme={upisanoIme}
          samoNosilac={samoNosilac && !smeImatiClanove(g)}
          trebaTelefon={!g.telefonZaRazgovor && !g.razgovorObavljenAt}
          pocetno={{
            naziv: g.naziv,
            opis: g.opis,
            bpg: g.bpg ?? "",
            adresa: g.adresa ?? "",
            neregistrovano: g.neregistrovano,
            naselje: g.naselje,
            lat: g.lat,
            lng: g.lng,
            uloga: g.clanovi[0]?.uloga ?? "CLAN",
            imaIzjavuAdrese: !!g.izjavaAdresaAt,
          }}
        />
      </div>
    );
  }

  // Lice može biti član samo jednog gazdinstva (čl. 7 st. 3).
  if (clanstvo) redirect(`/gazdinstva/${clanstvo.gazdinstvo.id}`);

  return (
    <div className="max-w-[760px] mx-auto pb-16 space-y-4">
      <NaslovStranice naslov={t("prijava_naslov")} opis={t("prijava_uvod", { min: MIN_OGLASA_UZ_PRIJAVU })} />
      {samoNosilac && <Obavestenje vrsta="upozorenje">{t("prijava_samo_rpg")}</Obavestenje>}
      <PrijavaForma upisanoIme={upisanoIme} samoNosilac={samoNosilac} trebaTelefon />
    </div>
  );
}
