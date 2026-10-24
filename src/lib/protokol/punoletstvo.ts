/**
 * Prelazak maloletnog naloga u punoletni (Modul Deca, čl. 19) — noćni posao.
 *
 * Osamnaesti rođendan menja tri stvari, i sve tri se dešavaju istog dana:
 *
 *  1. **Poništava se POEN zarađen prijateljstvima** — broj živih isplaćenih
 *     prijateljstava × 500, i to NA OBE STRANE. Milica sa 30 takvih gubi 15.000, a
 *     svakom od tih 30 drugova se briše po 500. I ona i njeni drugovi smeju u
 *     minus, po istom pravilu nadoknade kao kod raskida.
 *  2. **Dete dobija verifikaciju od roditelja** — jednu (set 4.8.2): prvi roditelj
 *     po redu povezivanja koji je član Kola ili osnivač daje potvrdu; ako takvog
 *     nema, prvi član bez potvrde daje uvođenje u Kolo; ako nijedan roditelj nije
 *     verifikovan, punoletni je korisnik (čl. 19 st. 3; dokaz stvarnosti čl. 5b).
 *  3. **Prijateljstva se brišu.** Bila su mehanizam dečjeg prostora; njihovo mesto
 *     zauzima lanac potvrda.
 *
 * ─── Zašto se POEN poništava ────────────────────────────────────────────────
 *
 * Uravnoteženje kanala. Prijateljstvo nosi 500 za trideset sekundi u istoj
 * prostoriji; potvrda stvarnosti nosi 1.000, ali traži da tvrdiš tuđi identitet i da
 * izgubiš sopstvenu potvrdu ako slažeš. Bez poništenja bi onaj ko krene sa 17 godina
 * odradio godinu jeftinog kanala, ušao u 18. sa zalihom, i povrh toga dobio ceo
 * skupi kanal — isti čovek, godina razlike, trajno drugačija pozicija.
 *
 * 🔴 SVE OSTALO OSTAJE. POEN koji je roditelj prepisao detetu i POEN dobijen u
 * razmeni sa drugom decom se ne diraju. Briše se tačno ono što je zarađeno
 * prijateljstvom, ništa više.
 */
import { prisma } from "@/lib/prisma";
import { obavesti } from "@/lib/notifikacije";
import { logAdminAkcija } from "@/lib/audit";
import { beogradskiDan } from "./obracunski-dan";
import {
  otpisiPrijateljuPriPunoletstvu,
  otpisiPunoletnom,
} from "./prijateljstva";
import { izvrsiVerifikacijuBezTokena } from "./verifikacija-service";
import { jePotvrdjen, statusUcesnika } from "@/lib/status-ucesnika-pravila";
import {
  NAJAVA_PUNOLETSTVA_DANA,
  PRIJATELJSTVO_POEN,
  UZRAST_PUNOLETSTVO,
  datumPunoletstva,
  danaDoIsteka,
  jePunoletan,
  otpisPriPunoletstvu,
  vremeZaNajavuPunoletstva,
} from "@/lib/deca-pravila";

export type IshodPunoletstva = {
  pregledano: number;
  obradjeno: number;
  najavljeno: number;
};

/**
 * Jedan prolaz: prvo najave (mesec dana ranije), pa obrade (na sam dan i posle).
 *
 * Posao je idempotentan i nadoknađuje: `punoletstvoNajavaAt` i
 * `punoletstvoObradjenAt` čuvaju da se ni obaveštenje ni otpis ne ponove, a obrađuju
 * se SVI zatečeni slučajevi, ne samo današnji. Bez toga bi jedno preskočeno
 * pokretanje ostavilo osamnaestogodišnjaka u dečjem prostoru zauvek.
 */
export async function obradiPunoletstva(sada: Date = beogradskiDan()): Promise<IshodPunoletstva> {
  const kandidati = await prisma.user.findMany({
    where: {
      maloletan: true,
      deaktiviranAt: null,
      datumRodjenja: { not: null },
      punoletstvoObradjenAt: null,
    },
    select: {
      id: true,
      pseudonim: true,
      datumRodjenja: true,
      punoletstvoNajavaAt: true,
    },
  });

  let obradjeno = 0;
  let najavljeno = 0;

  for (const k of kandidati) {
    if (jePunoletan(k.datumRodjenja, sada)) {
      try {
        await prevediUPunoletni(k.id);
        obradjeno += 1;
      } catch (e) {
        console.error("[punoletstvo] Prelaz nije uspeo", k.id, e);
      }
      continue;
    }
    if (!k.punoletstvoNajavaAt && vremeZaNajavuPunoletstva(k.datumRodjenja, sada)) {
      try {
        await najaviPunoletstvo(k.id, k.pseudonim, k.datumRodjenja!, sada);
        najavljeno += 1;
      } catch (e) {
        console.error("[punoletstvo] Najava nije uspela", k.id, e);
      }
    }
  }

  return { pregledano: kandidati.length, obradjeno, najavljeno };
}

/**
 * Najava mesec dana ranije (čl. 19 st. 6) — detetu i SVAKOM njegovom prijatelju.
 *
 * Prijatelji se obaveštavaju zato što i njima odlazi po 500 POEN. Bez toga je
 * iznenađenje na najgorem mogućem mestu: čoveku nestane POEN, a nigde ne piše zašto.
 */
async function najaviPunoletstvo(
  deteId: string,
  pseudonim: string,
  datumRodjenja: Date,
  sada: Date
) {
  const prijateljstva = await prisma.prijateljstvo.findMany({
    where: { OR: [{ aId: deteId }, { bId: deteId }], raskinutAt: null, poenEvidentiran: true },
    select: { aId: true, bId: true },
  });
  const iznos = otpisPriPunoletstvu(prijateljstva.length);
  const dana = danaDoIsteka(datumPunoletstva(datumRodjenja), sada);

  // Stub se upisuje PRE slanja — dva uporedna pokretanja ne smeju da pošalju dvaput,
  // a neposlato obaveštenje je manja šteta od poplave obaveštenja.
  const rezervisano = await prisma.user.updateMany({
    where: { id: deteId, punoletstvoNajavaAt: null },
    data: { punoletstvoNajavaAt: new Date() },
  });
  if (rezervisano.count === 0) return;

  await obavesti(deteId, {
    tip: "punoletstvo_najava",
    kljuc: "notifikacije.punoletstvo_najava",
    parametri: { dana, iznos, broj: prijateljstva.length },
    naslov: `Za ${dana} dana puniš ${UZRAST_PUNOLETSTVO}`,
    tekst:
      `Tog dana biće ti otpisano ${iznos.toLocaleString("sr-RS")} POEN iz ${prijateljstva.length} prijateljstava, ` +
      `a prijateljstva će biti zatvorena. Zauzvrat te potvrđuje roditelj i sam počinješ da potvrđuješ druge.`,
    link: "/prijatelji",
  }).catch(() => {});

  for (const p of prijateljstva) {
    const drugiId = p.aId === deteId ? p.bId : p.aId;
    await obavesti(drugiId, {
      tip: "punoletstvo_najava_prijatelj",
      kljuc: "notifikacije.punoletstvo_najava_prijatelj",
      parametri: { pseudonim, dana, iznos: PRIJATELJSTVO_POEN },
      naslov: "Prijatelj uskoro puni 18",
      tekst: `${pseudonim} za ${dana} dana puni ${UZRAST_PUNOLETSTVO}. Tada se vaše prijateljstvo zatvara i biće ti otpisano ${PRIJATELJSTVO_POEN} POEN.`,
      link: "/prijatelji",
    }).catch(() => {});
  }
}

/**
 * Sam prelaz. Redosled je bitan i nije proizvoljan:
 *
 *  1. otpis (dok se još zna koja su prijateljstva bila isplaćena),
 *  2. brisanje prijateljstava,
 *  3. prevođenje naloga u punoletni,
 *  4. potvrde od roditelja — TEK NA KRAJU, jer jezgro verifikacije odbija maloletni
 *     nalog kao metu i jer bi potvrda pre otpisa dala 1.000 POEN koji bi otpis odmah
 *     pojeo.
 */
async function prevediUPunoletni(deteId: string) {
  const dete = await prisma.user.findUnique({
    where: { id: deteId },
    select: {
      id: true,
      pseudonim: true,
      // Red povezivanja: najranija veza prva (čl. 19 st. 3). Uz roditelja se čita
      // položaj — prvi član Kola/osnivač daje potvrdu, a ako ga nema, prvi član bez
      // potvrde daje uvođenje (set 4.8.2; dokaz stvarnosti čl. 5b).
      roditeljstvaKaoDete: {
        select: {
          roditeljId: true,
          zaustavljenaAt: true,
          roditelj: {
            select: {
              maloletan: true,
              jeOsnivac: true,
              verified: true,
              indeksStvarnosti: true,
              potvrdjenAt: true,
              tipKorisnika: true,
              status: true,
              deaktiviranAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!dete) return;

  // Rezerviši prelaz — dva uporedna pokretanja ne smeju da otpišu dvaput.
  const rezervisano = await prisma.user.updateMany({
    where: { id: deteId, punoletstvoObradjenAt: null, maloletan: true },
    data: { punoletstvoObradjenAt: new Date() },
  });
  if (rezervisano.count === 0) return;

  // ── 1. Otpis (čl. 19 st. 2) ────────────────────────────────────────────────
  //
  // Broje se SAMO živa isplaćena prijateljstva. Ne broje se: raskinuta (njihovih 500
  // je već otpisano — inače bi isti POEN bio oduzet dvaput), prijateljstva sa braćom
  // i sestrama (nikad nisu nosila POEN) i prijateljstva na čekanju (druga strana
  // nikad nije postala aktivna). Sve tri grupe nosi jedno polje: `poenEvidentiran`.
  const isplacena = await prisma.prijateljstvo.findMany({
    where: { OR: [{ aId: deteId }, { bId: deteId }], raskinutAt: null, poenEvidentiran: true },
    select: { aId: true, bId: true },
  });
  const iznos = otpisPriPunoletstvu(isplacena.length);

  if (iznos > 0) {
    await otpisiPunoletnom(deteId, iznos, isplacena.length);
    for (const p of isplacena) {
      const drugiId = p.aId === deteId ? p.bId : p.aId;
      try {
        await otpisiPrijateljuPriPunoletstvu(drugiId, dete.pseudonim);
        await obavesti(drugiId, {
          tip: "punoletstvo_otpis_prijatelj",
          kljuc: "notifikacije.punoletstvo_otpis_prijatelj",
          parametri: { pseudonim: dete.pseudonim, iznos: PRIJATELJSTVO_POEN },
          naslov: "Prijatelj je postao punoletan",
          tekst: `${dete.pseudonim} ima ${UZRAST_PUNOLETSTVO} godina. Vaše prijateljstvo je zatvoreno i otpisano ti je ${PRIJATELJSTVO_POEN} POEN.`,
          link: "/prijatelji",
        }).catch(() => {});
      } catch (e) {
        console.error("[punoletstvo] Otpis prijatelju nije uspeo", drugiId, e);
      }
    }
  }

  // ── 2. i 3. Prijateljstva odlaze, nalog postaje punoletan (čl. 19 st. 1 i 4) ──
  await prisma.$transaction(async (tx) => {
    await tx.prijateljstvo.deleteMany({ where: { OR: [{ aId: deteId }, { bId: deteId }] } });
    await tx.prijateljToken.deleteMany({ where: { korisnikId: deteId } });
    await tx.roditeljPoziv.deleteMany({ where: { deteId } });
    // Veza sa roditeljem gubi dejstvo — punoletno lice nema roditeljski prekidač,
    // niti roditelj nad njim ima ijedno ovlašćenje iz čl. 10.
    await tx.roditeljstvo.deleteMany({ where: { deteId } });
    await tx.roditeljstvoPotvrda.deleteMany({ where: { deteId, status: "CEKA" } });
    await tx.roditeljstvoPotvrdaFondacije.deleteMany({ where: { deteId, status: "CEKA" } });
    // Potvrde postojanja deteta (čl. 6) gube predmet punoletstvom; padaju i
    // kaskadno sa vezom iznad, ali se brišu izričito da redosled ne zavisi od šeme.
    await tx.potvrdaPostojanjaDeteta.deleteMany({ where: { deteId } });
    await tx.user.update({
      where: { id: deteId },
      data: {
        maloletan: false,
        dozvolaOdrasli: false,
        // 🔴 Škola se briše OVDE. Bez toga punoletan čovek zauvek ostaje u brojanju
        // svoje osnovne škole — kvar koji se ne primeti mesecima, jer nigde ne puca:
        // ranglista prosto pokazuje broj koji je za jedno veći nego što jeste.
        // Škola svake godine gubi maturante i to je ispravno.
        skolaSifra: null,
        skolaPromenjenaAt: null,
      },
    });
  });

  // ── 4. Verifikacija od roditelja (čl. 19 st. 3, set 4.8.2) ─────────────────
  //
  // Po redu povezivanja: prvi roditelj koji je ČLAN KOLA ili OSNIVAČ daje POTVRDU
  // (punoletni postaje član Kola). Ako takvog nema, prvi roditelj koji je ČLAN BEZ
  // POTVRDE daje UVOĐENJE (punoletni postaje član bez potvrde; dokaz čl. 5b). Drugi
  // roditelj ne daje ništa. Ako nijedan roditelj nije verifikovan, punoletni ostaje
  // korisnik. Položaj se čita PRE brisanja veza (korak 2–3), a zaustavljena veza
  // (čl. 4e) ne daje ovlašćenja roditelja, pa ni verifikaciju.
  //
  // 🔴 POEN po ovoj verifikaciji upisuje se ODMAH, bez uslova iz dokaza stvarnosti
  // čl. 7: istog dana se detetu poništava POEN evidentiran po prijateljstvima
  // (korak 1), često u minus, a tek punoletan čovek tog dana nije ništa skrivio.
  const kandidati = dete.roditeljstvaKaoDete
    .filter((v) => !v.zaustavljenaAt && v.roditelj.status === "ACTIVE" && !v.roditelj.deaktiviranAt)
    .map((v) => ({ roditeljId: v.roditeljId, status: statusUcesnika(v.roditelj) }));
  const potvrdilac = kandidati.find((k) => jePotvrdjen(k.status));
  const uvodilac = potvrdilac ? null : kandidati.find((k) => k.status === "CLAN_BEZ_POTVRDE");
  const izbor = potvrdilac
    ? { roditeljId: potvrdilac.roditeljId, vrsta: "POTVRDA" as const }
    : uvodilac
      ? { roditeljId: uvodilac.roditeljId, vrsta: "UVODJENJE" as const }
      : null;

  let potvrda = 0;
  let ishod: "POTVRDA" | "UVODJENJE" | "KORISNIK" = "KORISNIK";
  if (izbor) {
    try {
      await izvrsiVerifikacijuBezTokena(izbor.roditeljId, deteId, undefined, {
        bezUslovaZaPoen: true,
        vrsta: izbor.vrsta,
      });
      potvrda = 1;
      ishod = izbor.vrsta;
    } catch (e) {
      console.warn("[punoletstvo] Verifikacija od roditelja nije upisana", izbor.roditeljId, deteId, e);
    }
  }

  await obavesti(deteId, {
    tip: "punoletstvo",
    kljuc: `notifikacije.punoletstvo_${ishod.toLowerCase()}`,
    parametri: { iznos, broj: isplacena.length, potvrda },
    naslov: "Nalog je prešao u punoletni",
    tekst:
      `Otpisano ti je ${iznos.toLocaleString("sr-RS")} POEN iz ${isplacena.length} prijateljstava. ` +
      (ishod === "POTVRDA"
        ? `Roditelj te je potvrdio, pa si sada član Kola.`
        : ishod === "UVODJENJE"
          ? `Roditelj te je uveo u Kolo, pa si sada član bez potvrde. Član Kola koji te lično zna može da te potvrdi — pokaži mu svoj kod.`
          : `Nijedan roditelj nije u Kolu, pa si sada korisnik. Član Kola koji te lično zna može da te potvrdi — pokaži mu svoj kod.`),
    link: "/verifikacija",
  }).catch(() => {});

  // Trag u revizijskom dnevniku: radnju izvodi sam sistem, pa je „admin" nalog koji
  // je obrađen — ovo je jedan od retkih ne-admin zapisa, kao i kanal doprinosa.
  await logAdminAkcija(
    deteId,
    "DETE_POSTALO_PUNOLETNO",
    deteId,
    `prijateljstava: ${isplacena.length}, otpisano: ${iznos} POEN, ` +
      `verifikacija od roditelja: ${ishod} (${potvrda}/${dete.roditeljstvaKaoDete.length})`
  ).catch(() => {});
}

/** Koliko dana ostaje do punoletstva — za prikaz na profilu deteta. */
export function danaDoPunoletstva(datumRodjenja: Date | null, sada: Date): number | null {
  if (!datumRodjenja) return null;
  const dan = datumPunoletstva(datumRodjenja);
  if (dan.getTime() <= sada.getTime()) return 0;
  return danaDoIsteka(dan, sada);
}

export { NAJAVA_PUNOLETSTVA_DANA };
