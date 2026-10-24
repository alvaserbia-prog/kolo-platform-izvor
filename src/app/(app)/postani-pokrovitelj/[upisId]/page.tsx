import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { upisNaListiZabrane, upisSpremanZaPrijavu } from "@/lib/protokol/upis-pokrovitelja";
import UpisProfil from "./UpisProfil";

export const metadata = { title: "Pokrovitelj — KOLO" };

/**
 * Stranica pokrovitelja (Pravilnik o pokroviteljstvu i donacijama čl. 6a, 7, 13e,
 * 13g st. 6): zaglavlje sa logotipom, nazivom i statusom; „Doniraj novac" i „Doniraj
 * robu ili usluge" (samo iz odobrenog upisa — i firme i registrovanog gazdinstva, set
 * 4.7.9; roba i usluge ne i kad je pokrovitelj na listi zabrane); tabovi Ugovori,
 * Vaučeri, Zaposleni, Podaci.
 *
 * Vidi je SAMO korisnik koji vodi upis — tuđ upis izgleda kao nepostojeći (404).
 */
export default async function UpisPokroviteljaPage({ params }: { params: Promise<{ upisId: string }> }) {
  const { upisId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const u = await prisma.upisPokrovitelja.findUnique({ where: { id: upisId } });
  if (!u || u.vlasnikUserId !== session.user.id || u.obrisanAt) notFound();
  const naListiZabrane = await upisNaListiZabrane(u.id);
  const novac = upisSpremanZaPrijavu(u, { userId: session.user.id, vrstaPrijave: "NOVAC", naListiZabrane });
  const dobra = upisSpremanZaPrijavu(u, { userId: session.user.id, vrstaPrijave: "DOBRA", naListiZabrane });
  // Zašto dugme nije dostupno — kod, a tekst bira ekran iz `messages/`.
  const kod = (vrsta: "NOVAC" | "DOBRA") =>
    u.status !== "ODOBREN" ? "NIJE_ODOBREN"
      : vrsta === "DOBRA" && naListiZabrane ? "ZABRANA"
      : "NEPOTPUN";

  return (
    <UpisProfil
      upis={{
        id: u.id,
        vrsta: u.vrsta,
        status: u.status,
        naziv: u.naziv,
        logoUrl: u.logoUrl,
        adresaSedista: u.adresaSedista,
        maticniBroj: u.maticniBroj,
        pib: u.pib,
        bpg: u.bpg,
        imePrezime: u.imePrezime,
        odnosPremaDavaocu: u.odnosPremaDavaocu,
        zastupnikFunkcija: u.zastupnikFunkcija,
        kontaktEmail: u.kontaktEmail,
        kontaktTelefon: u.kontaktTelefon,
        mapaMesto: u.mapaMesto,
        mapaAdresa: u.mapaAdresa,
        mapaLat: u.mapaLat,
        mapaLng: u.mapaLng,
        imaIzjavuAdrese: !!u.izjavaAdresaAt,
        odbijenoRazlog: u.odbijenoRazlog,
        izmenaNaziv: u.izmenaNaziv,
        izmenaMaticniBroj: u.izmenaMaticniBroj,
        izmenaLogoUrl: u.izmenaLogoUrl,
        izmenaNaProveri: !!u.izmenaPodnetaAt,
        izmenaOdbijenaRazlog: u.izmenaOdbijenaRazlog,
      }}
      naListiZabrane={naListiZabrane}
      novac={novac.ok ? null : kod("NOVAC")}
      dobra={dobra.ok ? null : kod("DOBRA")}
    />
  );
}
