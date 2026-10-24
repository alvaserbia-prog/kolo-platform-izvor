import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sesija } from "@/lib/sesija";
import NovcanikKartice from "./NovcanikKartice";
import IstorijaTransakcija, { IstorijaSkeleton } from "./IstorijaTransakcija";
import { dohvatiZabelezen } from "@/lib/protokol/doprinos-sadrzaju";
import { dohvatiZabelezenePotvrde } from "@/lib/protokol/potvrda-poen";
import { ucitajUcesnika } from "@/lib/protokol/deca";
import { smePrepis as smePrepisDeteta } from "@/lib/deca-pravila";
import { smeDaSalje as smePrepisPravilo } from "@/lib/doprinos-pravila";
import { rezervisanoZaNabavku } from "@/lib/protokol/nabavka";
import { dohvatiZabelezenGazdinstva } from "@/lib/protokol/gazdinstvo";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("novcanik") };
}

export default async function NovcanikPage({
  searchParams,
}: {
  searchParams: Promise<{ plati?: string; primalac?: string; iznos?: string; description?: string }>;
}) {
  // `sesija()` je keširan po request-u (deli rezultat sa (app) layout-om — bez
  // dodatnog dekodiranja JWT-a / DB poziva).
  const session = await sesija();
  if (!session) redirect("/login");
  const tNav = await getTranslations("nav");
  const { plati, primalac, iznos, description } = await searchParams;

  // Laki upiti potrebni za gornju karticu (stanje POEN). ZRNO kartica je
  // privremeno uklonjena iz Novčanika (ostaje dostupna preko sidebara /zrno).
  const [wallet, dbUser, zabelezenOglas, rezervisano,
    zabelezenePotvrde, zabelezenGazdinstva,
  ] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: { id: true, balance: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { memberHash: true, tipKorisnika: true, maloletan: true },
    }),
    // Zabeležen doprinos vidi SAMO vlasnik naloga (Pravilnik čl. 67) i nikad se
    // ne sabira sa stanjem — do evidentiranja to nije zapis POEN-a (čl. 40a st. 3).
    dohvatiZabelezen(session.user.id),
    // Rezervisano za kolektivnu nabavku (čl. 23 st. 2). Zaseban red, nikad sabran
    // sa stanjem: do preuzimanja POEN nije poništen (čl. 27 st. 3).
    rezervisanoZaNabavku(session.user.id),
    // POEN po potvrdama koji čeka prvi doprinos (dokaz stvarnosti čl. 7). Dva
    // broja, jer čekaju različite stvari: tvoj prvi doprinos i tuđi.
    dohvatiZabelezenePotvrde(session.user.id),
    // Doprinos gazdinstva (čl. 40c st. 4) čeka sopstveni potez člana — objavljen
    // oglas i potvrdu — pa ide u red „čeka tebe", ne „čeka Fondaciju".
    dohvatiZabelezenGazdinstva(session.user.id),
    // 🔴 Za vaučere nema reda „rezervisano": POEN se poništava pri dodeli (nabavke
    // čl. 30f), pa je već van stanja.
  ]);
  const zabelezenDoprinos = zabelezenOglas;
  const maloletan = dbUser?.maloletan ?? false;

  // Detetu se stanje naloga čita iz veze sa roditeljem (čl. 4c), a ne iz tipa
  // korisnika — vidi napomenu uz `smeDaSalje` ispod.
  const stanjeDeteta = dbUser?.maloletan ? (await ucitajUcesnika(session.user.id))?.stanje : null;
  // 🔴 Pravilo se NE prepisuje u ekran — čita se iz `smeDaSalje` (`doprinos-pravila`),
  // isto mesto kroz koje odlučuje `/api/transfer`. Do seta 4.6.6 je ovde stajao
  // prepisan uslov `tipKorisnika !== "NEVERIFIKOVAN"`, pa je ekran ostao stroži od
  // rute.
  const smePrepis = dbUser?.maloletan
    ? smePrepisDeteta(stanjeDeteta ?? "NA_CEKANJU")
    : smePrepisPravilo(dbUser?.tipKorisnika ?? "NEVERIFIKOVAN");

  return (
    <div className="space-y-6">
      {/* Naslov stranice za čitač ekrana i za onoga ko stigne iz obaveštenja —
          vizuelno ga nosi kartica POEN, pa se ne crta dvaput. */}
      <h1 className="sr-only">{tNav("novcanik")}</h1>
      {/* Maloletni nalog ne ulazi u lanac potvrda (čl. 15 Pravilnika o učešću dece),
          pa po toj osnovi nema šta da čeka. */}
      <NovcanikKartice
        balance={wallet?.balance ?? 0}
        pseudonim={session.user.pseudonim}
        memberHash={dbUser?.memberHash ?? ""}
        platiPseudonim={plati ?? primalac}
        prefillIznos={iznos}
        prefillOpis={description}
        zabelezenDoprinos={maloletan ? 0 : zabelezenDoprinos}
        zabelezenGazdinstvo={maloletan ? 0 : (zabelezenGazdinstva?.iznos ?? 0)}
        zabelezenePotvrdeMoje={maloletan ? 0 : zabelezenePotvrde.kaoPotvrdjeni}
        zabelezenePotvrdeTudje={maloletan ? 0 : zabelezenePotvrde.kaoPotvrdjivac}
        // Spisak ljudi čiji se prvi doprinos čeka — bez njega iznos ne kaže šta
        // vlasnik naloga može da uradi (POEN otključava TUĐI potez, pa je jedina
        // radnja podsetiti baš tog čoveka).
        cekamPotvrdjene={maloletan ? [] : zabelezenePotvrde.cekamPotvrdjene}
        // Maloletni nalog ne učestvuje u nabavci (čl. 4), pa reda ni nema.
        rezervisanoNabavka={maloletan ? 0 : rezervisano}
        maloletan={maloletan}
        // Nov član u ažuriranju evidencije učestvuje samo kao primalac (čl. 28
        // st. 2) — dugme za upis mu se ne prikazuje, uz objašnjenje zašto. Član čiji
        // je identitet utvrđen povodom javne donacije prepis SME (čl. 28 st. 6).
        //
        // 🔴 Maloletni korisnik je IZUZETAK i mora se rešavati posebno. On je
        // `NEVERIFIKOVAN` u smislu šeme i to ostaje do punoletstva, jer dete
        // nikoga ne potvrđuje i niko ne potvrđuje njega (čl. 15) — pa bi ga opšte
        // pravilo trajno ostavilo bez prepisa. U dečjem prostoru prepis uređuje
        // čl. 14 i traži samo da nalog radi, tj. da ga je roditelj preuzeo
        // (stanje „povezano"); to isto radi i `/api/transfer`, koji za svaki par
        // sa detetom odlučuje po `smeDaPrepise`. Ekran je do sada bio stroži od
        // rute: dugmeta nije bilo ni detetu u stanju „aktivno".
        smeDaSalje={smePrepis}
        razlogZabrane={dbUser?.maloletan ? "ceka_roditelja" : "neverifikovan"}
      />

      {/* Istorija transakcija je najteži upit (100 redova + ugnežđeni JOIN-ovi):
          striminguje se odvojeno da kartice ne čekaju na nju. */}
      <Suspense fallback={<IstorijaSkeleton />}>
        <IstorijaTransakcija
          userId={session.user.id}
          walletId={wallet?.id ?? ""}
          pseudonim={session.user.pseudonim}
        />
      </Suspense>
    </div>
  );
}
