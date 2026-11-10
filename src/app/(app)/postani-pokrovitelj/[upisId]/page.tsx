import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { upisNaListiZabrane, upisSpremanZaPrijavu, smePrijavuDobaraBezUcesca } from "@/lib/protokol/upis-pokrovitelja";
import UpisProfil from "./UpisProfil";

export const metadata = { title: "Pokrovitelj — KOLO" };

/**
 * Stranica pokrovitelja (Pravilnik o pokroviteljstvu i donacijama čl. 16, 19, 28,
 * 32 st. 3): zaglavlje sa logotipom, nazivom i statusom; „Doniraj novac" i „Doniraj
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
  // Čl. 28 st. 1 (set 5.1.2): pripadnost Kolu se čita iz baze, ne iz tokena.
  const ja = await prisma.user.findUnique({ where: { id: session.user.id }, select: { verified: true } });
  const ucesnik = !!ja?.verified;
  const novac = upisSpremanZaPrijavu(u, { userId: session.user.id, vrstaPrijave: "NOVAC", naListiZabrane });
  const dobra = upisSpremanZaPrijavu(u, { userId: session.user.id, vrstaPrijave: "DOBRA", naListiZabrane, ucesnik });
  // Set 5.1.2 — partnerstvo (donacije čl. 41 st. 1): pod uslovima iz čl. 28 st. 1; lista zabrane ga ne zatvara.
  const partnerstvo = upisSpremanZaPrijavu(u, { userId: session.user.id, vrstaPrijave: "PARTNERSTVO", naListiZabrane, ucesnik });
  // Zašto dugme nije dostupno — kod, a tekst bira ekran iz `messages/`.
  const kod = (vrsta: "NOVAC" | "DOBRA" | "PARTNERSTVO") =>
    u.status !== "ODOBREN" ? "NIJE_ODOBREN"
      : vrsta === "DOBRA" && naListiZabrane ? "ZABRANA"
      : vrsta !== "NOVAC" && !ucesnik && !smePrijavuDobaraBezUcesca(u) ? "NIJE_UCESNIK"
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
      partnerstvo={partnerstvo.ok ? null : kod("PARTNERSTVO")}
    />
  );
}
