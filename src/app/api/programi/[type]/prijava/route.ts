import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OsnovPodrske, ProgramType } from "@/generated/prisma/client";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { obavesti } from "@/lib/notifikacije";
import { ucitajStatus, sme } from "@/lib/protokol/status";
import {
  dohvatiPotvrdioceUslova,
  kreirajPotvrde,
  zatvoriPostupakPotvrda,
  KLJUC_ZAHTEV_POTVRDA,
} from "@/lib/protokol/program-potvrda";
import { labelPrograma } from "@/lib/protokol/programi";
import { getLocale } from "next-intl/server";
import { prevedi } from "@/lib/prevod-servera";

// PED (operativni doprinos) ne ide kroz enrollment — prijava se vrši na konkretan
// zadatak kroz /api/doprinos-oglasi/[id]/prijavi (Pravilnik o operativnom doprinosu).
const DOZVOLJENI_TIPOVI: ProgramType[] = [
  "PODRSKA_MAJKAMA", "PODRSKA_STARIJIMA", "POSEBNA_BRIGA", "SKOLOVANJE",
];

/**
 * Vrste dokaza u okviru osnova smanjene sposobnosti (čl. 12).
 *
 * 🔴 Nisu osnovi i ne smeju postati kolona ni oznaka na ekranu: razdvojeni od
 * osnova, odali bi da je reč o zdravlju. Žive u `metadata`, koju vidi samo lice
 * što obrađuje prijavu. Postoje zato što od njih zavisi rok — pravo po rešenju
 * podleže godišnjoj reviziji, a zbog akutne bolesti traje šest meseci.
 */
const DOKAZI_SPOSOBNOSTI = ["RESENJE", "BOLEST_AKUTNA", "BOLEST_HRONICNA"];

// POST /api/programi/[type]/prijava — prijava na socijalni program.
// Pravo ostvaruje VERIFIKOVAN učesnik — i član bez potvrde (Pravilnik o programima
// podrške čl. 4 st. 1; Pravilnik čl. 28a st. 3; set 4.8.2). Anti-malverzaciju nosi
// ostatak čl. 4: izričit pristanak i potvrda ispunjenosti uslova od člana Kola koji
// podnosioca lično zna (`dohvatiPotvrdioceUslova`), odnosno od Fondacije, pre nego
// što Fondacija odobri. Za maloletnog prijavu podnosi roditelj (čl. 13 st. 4).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);
  // Status iz baze, ne iz sesije. Dete samo ne podnosi prijavu (programi čl. 13
  // st. 4: za maloletnog prijavu podnosi roditelj).
  const status = await ucitajStatus(session.user.id);
  if (!status || !sme("PRIJAVA_NA_PROGRAM", status) || status === "DETE_KOLA")
    return await greska("Na program se prijavljuje verifikovan učesnik.", 403);

  const { type } = await params;
  if (!DOZVOLJENI_TIPOVI.includes(type as ProgramType))
    return await greska("Nepoznat tip programa.", 400);

  const programType = type as ProgramType;

  // Proveri da program postoji i da je aktivan
  const program = await prisma.protokolProgram.findUnique({ where: { type: programType } });
  if (!program?.isActive)
    return await greska("Program nije aktivan.", 400);

  const korisnik = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pseudonim: true },
  });
  if (!korisnik) return await greska("Korisnik ne postoji.", 404);

  const body = await req.json().catch(() => ({}));

  // Izričit pristanak da verifikatori budu zamoljeni da potvrde ispunjenost uslova.
  if (body.pristanakVerifikatori !== true)
    return await greska("Potreban je pristanak da vaši verifikatori potvrde ispunjenost uslova.", 400);

  // Proveri duplikat — ponovna prijava dozvoljena samo iz REJECTED ili INACTIVE
  // (odbijena, odnosno obustavljena reverizijom/padom indeksa).
  const vec = await prisma.programEnrollment.findUnique({
    where: { userId_type: { userId: session.user.id, type: programType } },
  });
  const mozeReapply = vec != null && (vec.status === "REJECTED" || vec.status === "INACTIVE");
  if (vec && !mozeReapply)
    return await greska("Već ste prijavljeni na ovaj program.", 400);

  const metadata = buildMetadata(programType, body);

  // Osnov je obavezan samo za Posebnu podršku — jedini program sa više osnova
  // (čl. 12). Za ostale ostaje `null`.
  //
  // 🔴 Osnov se upisuje u sopstvenu kolonu, a NE PRIKAZUJE se nijednom korisniku
  // (čl. 4 st. 5). Postoji zato što od njega zavisi trajanje prava: gubitak doma
  // traje dvanaest meseci od događaja bez revizije, smanjena sposobnost podleže
  // godišnjoj reviziji.
  let osnov: OsnovPodrske | null = null;
  if (programType === "POSEBNA_BRIGA") {
    if (body.osnov !== "SMANJENA_SPOSOBNOST" && body.osnov !== "GUBITAK_DOMA")
      return await greska("Izaberi osnov po kome ostvaruješ pravo.", 400);
    osnov = body.osnov as OsnovPodrske;

    // 🔴 Datum događaja je uslov, ne podatak uz prijavu: pravo po osnovu gubitka
    // doma „traje dvanaest meseci OD DOGAĐAJA" (čl. 12), pa se rok bez njega ne
    // može izračunati, a prijava posle isteka tog roka ne bi mogla ništa da
    // donese — bila bi odobrena i istog dana obustavljena revizijom, što na
    // ekranu izgleda kao kvar. Odbija se odmah, sa razlogom.
    if (osnov === "GUBITAK_DOMA") {
      const dogadjaj = new Date(String(body.datumDogadjaja ?? ""));
      if (Number.isNaN(dogadjaj.getTime()))
        return await greska("Unesi datum događaja.", 400);
      const dana = (Date.now() - dogadjaj.getTime()) / (24 * 60 * 60 * 1000);
      if (dana < 0) return await greska("Datum događaja ne može biti u budućnosti.", 400);
      if (dana > 365)
        return await greska(
          "Pravo po osnovu gubitka doma traje dvanaest meseci od događaja, a taj rok je istekao.",
          400,
        );
    }
  }

  // Ko potvrđuje ispunjenost uslova: članovi Kola koji podnosioca lično znaju
  // (čl. 4 st. 2). Uvoditelj telefonom i član bez potvrde ne ulaze. Prazan skup
  // nije prepreka — tada odlučuje Fondacija, uz obrazloženje.
  const verifikatori = await dohvatiPotvrdioceUslova(prisma, session.user.id);

  // Tekst izričitog pristanka, SKLOPLJEN NA SERVERU (R-06).
  //
  // 🔴 Do seta 4.6.3 se snimalo samo `pristanakVerifikatori: true`. Logička
  // vrednost dokazuje DA je pristanak dat, ali ne i NA ŠTA — a ovde je reč o
  // izričitom pristanku za posebne kategorije podataka (ZZPL čl. 17 st. 2 t. 1),
  // gde je sadržina pristanka ceo njegov domet. Tekst se uz to menjao (10.09.2026,
  // R-13) i nosi broj verifikatora različit za svakog čoveka.
  //
  // 🔴 Sklapa se ovde, iz istog ključa iz kog ga ekran prikazuje, a ne prima se od
  // klijenta: tekst koji šalje pretraživač dokazuje samo šta je pretraživač poslao.
  const jezik = await getLocale();
  const pristanakTekst =
    verifikatori.length > 0
      ? prevedi(jezik, "programi.pristanak_tekst", { broj: verifikatori.length })
      : prevedi(jezik, "programi.pristanak_tekst_fondacija");
  const pristanakAt = new Date();

  // Ponovna prijava: raščisti zatečen postupak (nedovršene potvrde + obaveštenja
  // ranijeg kruga), da verifikatorima ne ostanu dva zahteva za istu prijavu.
  if (mozeReapply && vec) await zatvoriPostupakPotvrda(vec.id);

  // Kreiranje/obnova prijave + potvrda za verifikatore — atomarno.
  const enrollmentId = await prisma.$transaction(async (tx) => {
    let enrollmentId: string;
    if (mozeReapply && vec) {
      const enr = await tx.programEnrollment.update({
        where: { id: vec.id },
        data: {
          status: "PENDING",
          metadata,
          osnov,
          pristanakVerifikatori: true,
          // 🔴 Ponovna prijava upisuje NOV pristanak — ne zadržava stari. Tekst se
          // u međuvremenu mogao promeniti, a i broj verifikatora se menja.
          pristanakTekst,
          pristanakAt,
          pristanakJezik: jezik,
          rejectionReason: null,
          approvedAt: null,
          approvedById: null,
        },
      });
      enrollmentId = enr.id;
      // Reapply: ukloni stare potvrde pre kreiranja novih.
      await tx.programPotvrda.deleteMany({ where: { enrollmentId } });
    } else {
      const enr = await tx.programEnrollment.create({
        data: {
          userId: session.user.id,
          type: programType,
          metadata,
          osnov,
          pristanakVerifikatori: true,
          pristanakTekst,
          pristanakAt,
          pristanakJezik: jezik,
        },
      });
      enrollmentId = enr.id;
    }
    await kreirajPotvrde(tx, enrollmentId, verifikatori);
    return enrollmentId;
  });

  // Notifikacija svakom verifikatoru.
  //
  // 🔴 Naziv programa ide ISKLJUČIVO u zvonce, unutar Platforme. Mejl (Resend) i
  // push dobijaju neutralan tekst kroz `spoljni` — bez pseudonima i bez programa.
  // Do 4.4.9 su akti tvrdili da se obaveštavanje verifikatora vrši „isključivo
  // unutar platforme (in-app notifikacija)", a `obavesti` je isti tekst slao i
  // mejlom i push-om; tvrdnja je od ovog seta istinita. Verifikator po čl. 4
  // Pravilnika o programima podrške potvrđuje baš taj program, pa naziv mora da
  // vidi — ali u aplikaciji, ne u tuđem sandučetu i ne na zaključanom ekranu.
  //
  // `enrollmentId` u parametrima ne ulazi ni u jednu rečenicu — nosi ga da bi
  // `zatvoriPostupakPotvrda` mogla da obriše obaveštenje kad se postupak okonča.
  for (const verifikatorId of verifikatori) {
    await obavesti(verifikatorId, {
      tip: "info",
      kljuc: KLJUC_ZAHTEV_POTVRDA,
      parametri: {
        pseudonim: korisnik.pseudonim,
        program: labelPrograma(programType),
        enrollmentId,
      },
      naslov: "Zahtev za potvrdu socijalnog programa",
      tekst: `Korisnik ${korisnik.pseudonim} se prijavio za program „${labelPrograma(programType)}" i navodi tebe kao verifikatora. Potvrdi ispunjenost uslova ili obrazloži odbijanje.`,
      link: "/programi/potvrde",
      spoljni: {
        kljuc: "notifikacije.zahtev_potvrda_spoljni",
        naslov: "Nov zahtev čeka tvoj odgovor",
        tekst: "Neko te je naveo kao osobu koja ga poznaje. Otvori KOLO da vidiš zahtev.",
      },
    });
  }

  // 🔴 Naziv programa NE ide u kanal upozorenja (Telegram + mejl na ADMIN_EMAIL).
  // Iz para „pseudonim + POSEBNA_BRIGA" čita se pripadnost posebnoj kategoriji
  // podataka, a taj kanal ide preko obrađivača u SAD koje Politika navodi samo za
  // uzak obim (čl. 8, 9). Ko odlučuje o prijavi vidi je u admin panelu, gde su
  // uneti podaci ionako otvoreni samo superadminu.
  void posaljiAdminAlert(
    "Nova prijava na program",
    verifikatori.length > 0
      ? `Učesnik: ${korisnik.pseudonim}\nČeka potvrdu ${verifikatori.length} člana Kola.\nDetalji su u admin panelu.`
      : `Učesnik: ${korisnik.pseudonim}\nNema člana Kola koji ga lično zna — ispunjenost uslova potvrđuje Fondacija.\nDetalji su u admin panelu.`
  );

  return NextResponse.json({ ok: true, brojVerifikatora: verifikatori.length });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMetadata(type: ProgramType, body: Record<string, unknown>): any {
  switch (type) {
    case "PODRSKA_MAJKAMA": {
      // Minimizacija (čl. 14): čuva se SAMO datum rođenja deteta (za uzrast i redni
      // broj u obračunu). Ime deteta se ne prikuplja — nije potrebno ni za šta.
      const deca = (body.deca as { datumRodjenja: string }[]) ?? [];
      return { deca: deca.map((d) => ({ datumRodjenja: d.datumRodjenja })) };
    }
    case "PODRSKA_STARIJIMA":
      return { datumRodjenja: body.datumRodjenja as string };
    case "POSEBNA_BRIGA": {
      // Dva osnova (čl. 12, set 4.6.7): smanjena sposobnost i gubitak doma.
      //
      // Minimizacija (čl. 14) je ista kao pre: kad se pravo ostvaruje po rešenju,
      // beleži se SAMO datum rešenja i opcioni datum isteka — ne broj, ne organ,
      // ne stepen invaliditeta, ne ocena radne sposobnosti, ne dijagnoza i nikakva
      // medicinska dokumentacija. Uzima se POSTOJANJE rešenja, ne njegov sadržaj.
      //
      // 🔴 `dokaz` stoji u `metadata`, a ne u koloni `osnov`: razlika rešenje /
      // akutna bolest / hronična bolest je bliža podatku o zdravlju od samog
      // osnova, a `metadata` vidi isključivo lice koje obrađuje prijavu (čl. 4).
      // Potrebna je jer od nje zavisi rok — akutna bolest traje šest meseci.
      //
      // 🔴 Od lica o kome se korisnik stara beleži se SAMO datum punoletstva, i
      // samo kad je maloletno: čl. 12 traži da pravo tada prestane punoletstvom
      // tog lica, a ništa više o njemu se „ne unosi u prijavu preko onoga što je
      // neophodno za utvrđivanje osnova". Identitet i stanje tog lica se ne traže.
      if (body.osnov === "GUBITAK_DOMA") {
        return { datumDogadjaja: (body.datumDogadjaja as string) ?? "" };
      }
      const dokaz = DOKAZI_SPOSOBNOSTI.includes(body.dokaz as string)
        ? (body.dokaz as string)
        : "RESENJE";
      return {
        dokaz,
        datumResenja: dokaz === "RESENJE" ? ((body.datumResenja as string) ?? "") : "",
        datumIsteka: dokaz === "RESENJE" ? ((body.datumIsteka as string) ?? "") : "",
        punoletstvoAt: (body.punoletstvoAt as string) ?? "",
      };
    }
    case "SKOLOVANJE":
      return { ustanova: (body.ustanova as string)?.trim() ?? "", program: (body.program as string)?.trim() ?? "" };
    default:
      return null;
  }
}
