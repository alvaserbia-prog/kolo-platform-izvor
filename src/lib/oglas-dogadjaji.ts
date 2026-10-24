// Događaji Pijace — obaveštenja o novim oglasima.
//
// Kad neko objavi oglas, korisnici koji prate tu kategoriju (`FollowedCategory`,
// čipovi u profilu) dobijaju zvonce + push + mejl sa linkom na oglas. Bez ovoga
// je objava oglasa bila „u prazno": niko ne sazna da je oglas stigao, oglašivač
// ne dobije nijedan odziv, pa drugi oglas i ne postavi.
//
// Oglašivač se nikad ne obaveštava o sopstvenom oglasu.

import { prisma } from "./prisma";
import { obavesti } from "./notifikacije";
import { kategorijaNaziv, kategorijaKljuc } from "./kategorije";

// Gornja granica primalaca u jednom pozivu — objava oglasa ne sme da visi dok
// se šalju hiljade obaveštenja. Iznad ove granice višak se preskače i beleži u
// log (tada je vreme za pravi red poslova, ne za tiho odsecanje).
const MAX_PRIMALACA = 500;
// Koliko obaveštenja ide uporedo (svako je DB upis + push + mejl).
const PORCIJA = 10;

export interface NoviOglasDogadjaj {
  listingId: string;
  category: string;
  /** Oglašivač — izuzet iz obaveštenja. */
  sellerId: string;
  naslov: string;
  tip: "PONUDA" | "POTRAZNJA";
}

export async function emitujNoviOglas(dogadjaj: NoviOglasDogadjaj): Promise<void> {
  // Obaveštenje ne sme da probije vidljivost iz Modula Deca (čl. 13): dečji oglas
  // se ne javlja punoletnima dok roditelj ne otvori prekidač, a oglas punoletnog
  // ne javlja se detetu pod istim uslovom. Bez ovoga bi zvonce vodilo na stranicu
  // koja tom čoveku vraća 404 — i usput odalo da oglas postoji.
  const oglasivac = await prisma.user.findUnique({
    where: { id: dogadjaj.sellerId },
    select: { maloletan: true, dozvolaOdrasli: true },
  });
  const oglasDeteta = oglasivac?.maloletan ?? false;
  const primaocUslov = oglasDeteta
    ? oglasivac?.dozvolaOdrasli
      ? {} // dete sa saglasnošću — oglas sme i punoletnima
      : { maloletan: true }
    : { OR: [{ maloletan: false }, { maloletan: true, dozvolaOdrasli: true }] };

  const pratioci = await prisma.followedCategory.findMany({
    where: {
      category: dogadjaj.category,
      userId: { not: dogadjaj.sellerId },
      user: { deaktiviranAt: null, status: "ACTIVE", ...primaocUslov },
    },
    select: { userId: true },
    take: MAX_PRIMALACA + 1,
  });

  if (pratioci.length > MAX_PRIMALACA) {
    console.warn(
      `[pijaca] oglas ${dogadjaj.listingId}: kategoriju „${dogadjaj.category}" prati više od ` +
        `${MAX_PRIMALACA} korisnika — obavešteno prvih ${MAX_PRIMALACA}.`,
    );
  }
  const primaoci = pratioci.slice(0, MAX_PRIMALACA);
  if (primaoci.length === 0) return;

  const naziv = kategorijaNaziv(dogadjaj.category);
  const naslov =
    dogadjaj.tip === "POTRAZNJA" ? `Nova potražnja: ${naziv}` : `Nov oglas: ${naziv}`;
  const tekst =
    dogadjaj.tip === "POTRAZNJA"
      ? `Neko traži: „${dogadjaj.naslov}". Kategoriju „${naziv}" pratiš na Pijaci.`
      : `„${dogadjaj.naslov}" je objavljeno u kategoriji „${naziv}", koju pratiš na Pijaci.`;
  const link = `/pijaca/${dogadjaj.listingId}`;

  for (let i = 0; i < primaoci.length; i += PORCIJA) {
    await Promise.all(
      primaoci.slice(i, i + PORCIJA).map((p) =>
        obavesti(p.userId, {
          tip: "NOV_OGLAS",
          kljuc: dogadjaj.tip === "POTRAZNJA"
            ? "notifikacije.nov_oglas_potraznja"
            : "notifikacije.nov_oglas_ponuda",
          // "@" = ugnežđen ključ: naziv kategorije se prevodi na jeziku primaoca,
          // inače bi Rus dobio srpski naziv kategorije usred ruske rečenice.
          parametri: {
            naslov: dogadjaj.naslov,
            kategorija: `@pijaca.kategorija_${kategorijaKljuc(dogadjaj.category)}`,
          },
          naslov,
          tekst,
          link,
          emailDugme: "Pogledaj oglas",
        }).catch((e) => {
          // Jedan neuspeo primalac ne sme da zaustavi ostale.
          console.error("[pijaca] obaveštenje o oglasu nije poslato", p.userId, e);
        }),
      ),
    );
  }
}
