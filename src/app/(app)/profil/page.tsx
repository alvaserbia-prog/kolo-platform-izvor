import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfilKlijent from "./ProfilKlijent";
import MojaDeca from "@/components/deca/MojaDeca";
import EmailDeteta from "@/components/deca/EmailDeteta";
import IzborSkole from "@/components/deca/IzborSkole";
import { razresiSkolu } from "@/lib/skola";
import { stanjeNaloga } from "@/lib/protokol/deca";
import { getTranslations } from "next-intl/server";
import { prikazStatusa } from "@/lib/status-prikaz";
import { sme } from "@/lib/status-ucesnika-pravila";

export default async function ProfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { wallet: true, podaci: true, praceneKategorije: { select: { category: true } } },
  });
  if (!user) redirect("/login");

  // Status učesnika (set 4.8.2) — izvodi ga jezgro; ekran ga samo crta.
  const prikaz = await prikazStatusa(user.id);

  // Odeljak „Moja deca": nalog detetu otvara i preuzima SVAKI punoletni učesnik,
  // i korisnik (Pravilnik o učešću dece čl. 4, 4b st. 6, 5 st. 1; set 4.8.2). Da li
  // dete postaje dete Kola zavisi od statusa roditelja, ne od prava da otvori nalog.
  const prikaziDecu = !user.maloletan && !!prikaz && sme("OTVARA_NALOG_DETETU", prikaz.status);

  // Izbor škole vidi SAMO maloletni nalog: školu bira sámo dete (Pravilnik o
  // učešću dece, čl. 7), pa ni roditelj ovaj odeljak nema.
  const skola = user.maloletan ? razresiSkolu(user.skolaSifra) : null;

  // Stanje naloga deteta (čl. 4c) — za kod roditelju dok nalog čeka preuzimanje.
  const stanjeDeteta = user.maloletan ? await stanjeNaloga(user.id) : null;

  /**
   * Šestocifreni kod za roditelja — i na profilu, ne samo na dečjoj početnoj.
   *
   * 🔴 Uputstvo detetu i roditeljski tekst su OBA slala po kod „na profil deteta"
   * (`decjaPocetna.ceka_uputstvo`, `deca.polje_kod_opis`), a koda tamo nije bilo.
   * Dete posluša uputstvo, ode na profil, ne nađe ništa — i tu se lanac prekida,
   * na najužem mestu celog modula. Bolje je dovesti kod nego menjati dva teksta.
   */
  const poziv =
    stanjeDeteta === "NA_CEKANJU"
      ? await prisma.roditeljPoziv.findUnique({ where: { deteId: user.id }, select: { kod: true } })
      : null;

  return (
    <>
    <ProfilKlijent
      praceneKategorije={user.praceneKategorije.map((p) => p.category)}
      maloletan={user.maloletan}
      stanjeDeteta={stanjeDeteta}
      status={prikaz?.status ?? null}
      naStaSeCeka={prikaz?.naStaSeCeka ?? null}
      zrno={prikaz?.zrno ?? null}
      mojaDeca={prikaziDecu ? <MojaDeca /> : null}
      user={{
        id: user.id,
        pseudonim: user.pseudonim,
        verified: user.verified,
        verifiedAt: user.verifiedAt?.toISOString() ?? null,
        pseudonimChangedAt: user.pseudonimChangedAt?.toISOString() ?? null,
        balance: user.wallet?.balance ?? 0,
        createdAt: user.createdAt.toISOString(),
        location: user.location ?? null,
        telefon: user.telefon ?? null,
        punoIme: user.podaci?.punoIme ?? null,
        opis: user.podaci?.opis ?? null,
        avatar: user.avatar ?? null,
        prikaziLokaciju: user.podaci?.prikaziLokaciju ?? true,
        prikaziOpis: user.podaci?.prikaziOpis ?? false,
        prikaziPunoIme: user.podaci?.prikaziPunoIme ?? false,
        prikaziTelefon: user.podaci?.prikaziTelefon ?? false,
        prikaziBilans: user.podaci?.prikaziBilans ?? true,
        prikaziZrno: user.podaci?.prikaziZrno ?? true,
        prikaziRangDonacija: user.podaci?.prikaziRangDonacija ?? true,
        prikaziOglase: user.podaci?.prikaziOglase ?? true,
        emailObavestenja: user.emailObavestenja,
      }}
    />
    {poziv && (
      <div className="mx-auto mt-6 max-w-3xl">
        <KodZaRoditelja kod={poziv.kod} />
      </div>
    )}
    {user.maloletan && (
      <div className="mx-auto mt-6 max-w-3xl">
        <EmailDeteta />
      </div>
    )}
    {user.maloletan && (
      <div className="mx-auto mt-6 max-w-3xl">
        <IzborSkole
          pocetna={skola ? { sifra: skola.sifra, naziv: skola.naziv, mesto: skola.mesto } : null}
        />
      </div>
    )}
    </>
  );
}

/**
 * Kartica sa kodom koji roditelj unosi uz pseudonim deteta (čl. 4b, rezervni put).
 * Serverska je i namerno bez ijedne radnje: broj se čita naglas, ne kopira.
 */
async function KodZaRoditelja({ kod }: { kod: string }) {
  const t = await getTranslations("decjaPocetna");
  return (
    <section className="rounded-3xl border-4 border-deca-sunce-400 bg-white p-6 text-center">
      <p className="text-base font-semibold text-deca-sunce-ink">{t("kod_naslov")}</p>
      <p className="mt-1 text-4xl font-extrabold tracking-widest tabular-nums text-deca-nebo-600">
        {kod}
      </p>
      <p className="mt-2 text-sm text-kolo-muted">{t("kod_profil_opis")}</p>
    </section>
  );
}
