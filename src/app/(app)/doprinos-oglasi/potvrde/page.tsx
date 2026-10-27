import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  imaUlazZaPotvrde,
  pregledZaPotvrdu,
  rokIzjasnjavanja,
  ROK_CELINA_DANA,
  ROK_ODOBRAVANJA_DANA,
  ROK_PRIMEDBE_DANA,
  ROK_ZAVRSNE_DANA,
} from "@/lib/protokol/operativni-postupak";
import PotvrdeZadataka from "./PotvrdeZadataka";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("doprinosOglasi");
  return { title: t("potvrde_naslov") };
}

/**
 * Potvrde zadataka — ulaz za čuvare Kola i lice koje UO ovlasti (operativni 5.0
 * čl. 13 st. 1; #51). Sve što čeka izjašnjavanje, sa rokom iz akta (čl. 12 st. 3,
 * 15 st. 2, 16 st. 1, 18 st. 2). Rok samo određuje red; dejstva nema.
 */
export default async function PotvrdePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!(await imaUlazZaPotvrde(session.user.id))) redirect("/doprinos-oglasi");
  const p = await pregledZaPotvrdu();
  const iso = (d: Date) => d.toISOString();
  return (
    <PotvrdeZadataka
      prijave={p.prijave.map((x) => ({
        id: x.id,
        pseudonim: x.user.pseudonim,
        oglasId: x.oglas.id,
        naslov: x.oglas.title,
        plan: x.planIzvrsenja,
        uslov: x.oglas.kvalifikacioniUslov,
        ispunjenost: x.ispunjenostUslova,
        rok: iso(rokIzjasnjavanja(x.createdAt, ROK_ODOBRAVANJA_DANA)),
      }))}
      izvrsenja={p.izvrsenja.map((x) => ({
        id: x.id,
        pseudonim: x.user.pseudonim,
        oglasId: x.oglas.id,
        naslov: x.oglas.title,
        zadruzni: x.oglas.zadruzni,
        obustavljeno: x.oglas.obustavljenoAt != null,
        datum: iso(x.date),
        celina: x.celina,
        predlozeniPoen: x.predlozeniPoen,
        opis: x.description,
        dokaz: x.dokaz,
        rok: iso(rokIzjasnjavanja(x.dopunaAt ?? x.createdAt, ROK_CELINA_DANA)),
      }))}
      zavrsne={p.zavrsne.map((x) => ({
        id: x.id,
        pseudonim: x.user.pseudonim,
        oglasId: x.oglas.id,
        naslov: x.oglas.title,
        saCelinama: x.oglas.brojCelina != null && !x.oglas.zadruzni,
        rok: iso(rokIzjasnjavanja(x.zavrsetakAt ?? new Date(), ROK_ZAVRSNE_DANA)),
      }))}
      primedbe={p.primedbe.map((x) => ({
        id: x.id,
        oglasId: x.oglas.id,
        naslov: x.oglas.title,
        predmet: x.predmet,
        tekst: x.tekst,
        rok: iso(rokIzjasnjavanja(x.createdAt, ROK_PRIMEDBE_DANA)),
      }))}
    />
  );
}
