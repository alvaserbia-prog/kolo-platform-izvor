/**
 * Upis POEN-a po potvrdi u lancu potvrda — servisni sloj.
 * Osnov: Pravilnik o dokazu stvarnosti čl. 7, Pravilnik o KOLO sistemu čl. 15 t. 2.
 *
 * Čista pravila (koji uslovi postoje i šta namerno NIJE uslov) žive u
 * `@/lib/potvrda-uslov` — bez Prisme, da ih prikaz može uvesti u pretraživaču.
 * Ovde se re-eksportuju, pa server ima jedan ulaz u kanal.
 *
 * 🔴 ZAŠTO JE OVO ZASEBAN MODUL, a ne deo `verifikacija-service.ts`:
 * `verifikacija-service` uvozi `doprinos-sadrzaju`, a `doprinos-sadrzaju` mora da zove
 * `probajEvidentiratiPotvrde` (objava oglasa je jedan od okidača). Da funkcija živi u
 * servisu potvrda, nastao bi ciklus uvoza.
 *
 * Obrazac poziva (obavezan, isti kao kod čl. 40a):
 *   - DB promene u jednoj `prisma.$transaction()`
 *   - `probajEvidentiratiPotvrde()` SEKVENCIJALNO POSLE nje — `emitujPoen()` otvara
 *     sopstvenu transakciju i ne sme da se pozove unutar druge.
 */
import { prisma } from "@/lib/prisma";
import { emitujPoen } from "./emisija";
import { obavesti } from "@/lib/notifikacije";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { logAdminAkcija } from "@/lib/audit";
import { PotvrdaPoenStatus, PotvrdaPoenUslov, TransactionType } from "@/generated/prisma/client";
import { POEN_VERIFIKATOR, POEN_VERIFIKOVANI } from "./dokaz-stvarnosti";
import { uslovPotvrde, BEZ_TRAGA, type TragUcesca, type UslovPotvrde } from "@/lib/potvrda-uslov";

export * from "@/lib/potvrda-uslov";

/**
 * Tipovi emisija koji dokazuju trag učešća. Svaki od njih nastaje tek pošto je neko
 * doprinos POTVRDIO — Fondacija (oglas, donacija, pokroviteljstvo) ili nosilac ZRNA
 * odnosno UO (operativni doprinos).
 *
 * 🔴 Meri se POSTOJANJE EMISIJE, ne postojanje prijave ili zapisa u pratećoj tabeli.
 * Time se anonimna donacija isključuje sama od sebe: za nju se POEN ne evidentira
 * (`donacija.ts`, `if (poen > 0)`), pa `EMISIJA_DONACIJA` transakcija ni ne nastane.
 * Nema posebne provere polja `javno` koja bi mogla da se raziđe sa tim pravilom.
 *
 * 🔴 `EMISIJA_PROGRAM` (socijalni programi), `EMISIJA_OSNIVACKI`, `TRANSFER` i
 * `EMISIJA_RAZMENA` NISU ovde i to je odluka, ne previd — vidi `potvrda-uslov.ts`.
 */
export const TIP_PO_USLOVU: Record<UslovPotvrde, TransactionType> = {
  OGLAS: TransactionType.EMISIJA_SADRZAJ,
  DONACIJA: TransactionType.EMISIJA_DONACIJA,
  POKROVITELJSTVO: TransactionType.EMISIJA_POKROVITELJ,
  OPERATIVNI: TransactionType.EMISIJA_OPERATIVNI,
};

/**
 * Dodatni tipovi koji se računaju u isti uslov. Pokroviteljstvo dobrima i uslugama
 * (donacije Glava IVa) je pokroviteljstvo u smislu čl. 6 st. 1 i ima sopstveni tip
 * emisije, da se brojači ne mešaju sa novcem — ali je isti trag učešća.
 */
export const DODATNI_TIPOVI_PO_USLOVU: Partial<Record<UslovPotvrde, TransactionType[]>> = {
  POKROVITELJSTVO: [TransactionType.EMISIJA_POKROVITELJ_DOBRA],
};

/** Trag učešća korisnika — jedan upit nad istorijom njegovog zapisa. */
export async function dohvatiTragUcesca(userId: string): Promise<TragUcesca> {
  const wallet = await prisma.wallet.findUnique({ where: { userId }, select: { id: true } });
  if (!wallet) return { ...BEZ_TRAGA };

  const nadjeni = await prisma.transaction.findMany({
    where: {
      toWalletId: wallet.id,
      type: { in: [...Object.values(TIP_PO_USLOVU), ...Object.values(DODATNI_TIPOVI_PO_USLOVU).flat()] },
    },
    select: { type: true },
    distinct: ["type"],
  });
  const tipovi = new Set(nadjeni.map((t) => t.type));
  const ima = (u: UslovPotvrde) =>
    tipovi.has(TIP_PO_USLOVU[u]) || (DODATNI_TIPOVI_PO_USLOVU[u] ?? []).some((t) => tipovi.has(t));

  return {
    oglasOdobren: tipovi.has(TIP_PO_USLOVU.OGLAS),
    javnaDonacija: tipovi.has(TIP_PO_USLOVU.DONACIJA),
    pokroviteljstvo: ima("POKROVITELJSTVO"),
    operativniDoprinos: tipovi.has(TIP_PO_USLOVU.OPERATIVNI),
  };
}

type VezaZaUpis = {
  id: string;
  verifikatorId: string;
  verifikovaniId: string;
};

async function podaciZaUpis(vezaId: string) {
  const veza = await prisma.verifikacionaVeza.findUnique({
    where: { id: vezaId },
    select: {
      id: true,
      poenStatus: true,
      nadzorPoenStatus: true,
      nadzoranAt: true,
      nadzornikId: true,
      verifikator: { select: { id: true, pseudonim: true, deaktiviranAt: true, wallet: { select: { id: true } } } },
      verifikovani: { select: { id: true, pseudonim: true, wallet: { select: { id: true } } } },
    },
  });
  return veza;
}

/**
 * Pokušava da upiše POEN za JEDNU potvrdu.
 *
 * `bezUslova` se koristi ISKLJUČIVO za potvrde koje roditelji daju detetu na 18.
 * rođendan (Pravilnik o učešću dece čl. 19 st. 3). Razlog je konkretan: istog dana se
 * detetu poništava POEN evidentiran po prijateljstvima, često u minus — ako bi i te
 * potvrde čekale prvi oglas, rođendan bi se sveo na čist minus bez ijedne protivteže.
 * Ne otvarati ga ničemu drugom.
 *
 * Ne baca: potvrda je već upisana u trenutku poziva i ne sme da padne zbog ovog kanala.
 */
export async function probajUpisatiPotvrdu(
  vezaId: string,
  opcije?: { bezUslova?: boolean; trag?: TragUcesca },
): Promise<{ upisano: boolean; uslov: UslovPotvrde | null }> {
  try {
    const veza = await podaciZaUpis(vezaId);
    if (!veza || veza.poenStatus !== PotvrdaPoenStatus.ZABELEZEN) return { upisano: false, uslov: null };

    const verifikatorWalletId = veza.verifikator.wallet?.id;
    const verifikovaniWalletId = veza.verifikovani.wallet?.id;
    if (!verifikatorWalletId || !verifikovaniWalletId) {
      console.error("[potvrda-poen] strana nema novčanik", { vezaId });
      return { upisano: false, uslov: null };
    }

    const trag = opcije?.trag ?? (await dohvatiTragUcesca(veza.verifikovani.id));
    const uslov = opcije?.bezUslova ? null : uslovPotvrde(trag);
    if (!opcije?.bezUslova && !uslov) return { upisano: false, uslov: null };

    // Prvo REZERVIŠI prelaz (uslovan update nad statusom), pa tek onda emituj. Ako dva
    // okidača stignu istovremeno (odobren oglas i potvrđena donacija u istoj sekundi),
    // samo jedan dobije count === 1 — POEN se upisuje tačno jednom.
    const rezervisano = await prisma.verifikacionaVeza.updateMany({
      where: { id: vezaId, poenStatus: PotvrdaPoenStatus.ZABELEZEN },
      data: {
        poenStatus: PotvrdaPoenStatus.EVIDENTIRAN,
        poenEvidentiranAt: new Date(),
        poenUslov: uslov ? (uslov as PotvrdaPoenUslov) : null,
      },
    });
    if (rezervisano.count !== 1) return { upisano: false, uslov: null };

    // 🔴 Verifikator je u međuvremenu ugasio nalog (dokaz stvarnosti čl. 16 st. 4, set
    // 4.7.5): potvrda je ostala na snazi i potvrđeni dobija svojih 1.000, ali licu čiji
    // je status prestao zapis se ne upisuje — inače bi POEN završio u zapisu koga nema.
    const verifikatorUgasen = veza.verifikator.deaktiviranAt !== null;

    let verifikatorTxId: string | null = null;
    if (!verifikatorUgasen) {
      try {
        const { transaction } = await emitujPoen(
          verifikatorWalletId,
          POEN_VERIFIKATOR,
          TransactionType.EMISIJA_VERIFIKACIJA,
          `Potvrda člana ${veza.verifikovani.pseudonim}`,
          { kljuc: "transakcije.verifikacija", parametri: { pseudonim: veza.verifikovani.pseudonim } },
        );
        verifikatorTxId = transaction.id;
      } catch (e) {
        // Ništa nije emitovano — vrati u ZABELEZEN da ga sledeći okidač pokupi.
        await prisma.verifikacionaVeza.updateMany({
          where: { id: vezaId, poenStatus: PotvrdaPoenStatus.EVIDENTIRAN },
          data: { poenStatus: PotvrdaPoenStatus.ZABELEZEN, poenEvidentiranAt: null, poenUslov: null },
        });
        console.error("[potvrda-poen] prva emisija pukla, potvrda vraćena u ZABELEZEN", { vezaId, e });
        return { upisano: false, uslov: null };
      }
    }

    let verifikovaniTxId: string | null = null;
    try {
      const { transaction } = await emitujPoen(
        verifikovaniWalletId,
        POEN_VERIFIKOVANI,
        TransactionType.EMISIJA_VERIFIKACIJA,
        `Primljena potvrda od ${veza.verifikator.pseudonim}`,
        { kljuc: "transakcije.primljena_verifikacija", parametri: { pseudonim: veza.verifikator.pseudonim } },
      );
      verifikovaniTxId = transaction.id;
    } catch (e) {
      // 🔴 OVDE SE NE VRAĆA U ZABELEZEN. Prva emisija je prošla, pa bi povratak značio
      // da je sledeći okidač emituje DRUGI put. Ostaje EVIDENTIRAN uz glasan incident —
      // isto što je radio zatečeni `emitujPoenZaVerifikaciju` kad emisija pukne posle
      // upisa veze. Ispravlja se ručno, iz admin taba.
      console.error("[potvrda-poen] druga emisija pukla — INCIDENT", { vezaId, verifikatorTxId, e });
      void posaljiAdminAlert(
        "Upis POEN-a po potvrdi je polovičan",
        `Veza ${vezaId}: verifikatoru je upisano ${POEN_VERIFIKATOR}, verifikovanom (${veza.verifikovani.pseudonim}) NIJE. Potrebna ručna ispravka.`,
      );
    }

    await prisma.verifikacionaVeza.update({
      where: { id: vezaId },
      data: { verifikatorTxId, verifikovaniTxId },
    });

    await logAdminAkcija(
      veza.verifikovani.id,
      "POTVRDA_POEN_UPISAN",
      veza.verifikator.id,
      `${POEN_VERIFIKATOR}+${POEN_VERIFIKOVANI} POEN, uslov ${uslov ?? "BEZ_USLOVA"}`,
    );

    await javiUpisan(veza, uslov);
    return { upisano: true, uslov };
  } catch (e) {
    console.error("[potvrda-poen] upis nije uspeo", { vezaId, e });
    return { upisano: false, uslov: null };
  }
}

// 🔴 Nadzor se više NE PLAĆA (odluka vlasnika 18.10.2026, dokaz stvarnosti 4.7.5,
// čl. 7 i 10). `probajUpisatiNadzor` i `EMISIJA_NADZOR` su uklonjeni iz toka; zatečeni
// upisi su obrisani iz evidencije zajedno sa svojim protivzapisom, a zabeleženi
// ugašeni (`nadzorPoenStatus = PONISTEN`). Ne vraćati 500 nadzorniku.

/**
 * Otključava SVE zabeležene potvrde u kojima je dati korisnik potvrđeni.
 *
 * Zove se sa svakog okidača (odobren prvi oglas, potvrđena javna donacija, potvrđeno
 * pokroviteljstvo, verifikovan operativni doprinos) i iz noćnog prolaza.
 *
 * 🔴 Trag se računa JEDNOM i prosleđuje svim vezama — inače bi čovek sa deset primljenih
 * potvrda pokrenuo deset istih upita. Vraća broj upisanih potvrda.
 *
 * MORA se zvati VAN `prisma.$transaction()`. Ne baca.
 */
export async function probajEvidentiratiPotvrde(verifikovaniId: string): Promise<number> {
  try {
    const zabelezene = await prisma.verifikacionaVeza.findMany({
      where: {
        verifikovaniId,
        poenStatus: PotvrdaPoenStatus.ZABELEZEN,
      },
      select: { id: true },
      orderBy: { vremenskiZig: "asc" },
    });
    if (zabelezene.length === 0) return 0;

    const trag = await dohvatiTragUcesca(verifikovaniId);
    if (!uslovPotvrde(trag)) return 0;

    let upisano = 0;
    for (const veza of zabelezene) {
      const ishod = await probajUpisatiPotvrdu(veza.id, { trag });
      if (ishod.upisano) upisano += 1;
    }
    return upisano;
  } catch (e) {
    console.error("[potvrda-poen] grupni upis nije uspeo", { verifikovaniId, e });
    return 0;
  }
}

/** Čovek čiji se prvi doprinos čeka. Ništa preko pseudonima — ekran ga samo imenuje. */
export type CekaDoprinos = { id: string; pseudonim: string };

/**
 * Spisak različitih ljudi, po abecedi. Kod potvrda koje si dao duplikata nema
 * (`@@unique[verifikatorId, verifikovaniId]`); funkcija je ostala iz vremena kad je isti
 * spisak služio i nadzoru, gde ih je bilo.
 */
function razlicitiLjudi(veze: { verifikovani: CekaDoprinos }[]): CekaDoprinos[] {
  const po = new Map<string, CekaDoprinos>();
  for (const v of veze) po.set(v.verifikovani.id, v.verifikovani);
  return [...po.values()].sort((a, b) => a.pseudonim.localeCompare(b.pseudonim, "sr"));
}

/**
 * Zabeležen a neupisan POEN po potvrdama — prikazuje se u POEN ekranu (čl. 67).
 *
 * Uz iznose vraća i SPISAK ljudi čiji se prvi doprinos čeka. Iznos bez imena ne kaže
 * vlasniku naloga šta može da uradi: taj POEN otključava TUĐI potez, pa je jedina
 * radnja koja mu stoji na raspolaganju da podseti baš tog čoveka. Bez spiska broj
 * stoji na ekranu kao nešto što se samo čeka, a čeka se nešto na šta se može uticati.
 *
 * 🔴 Ne otvara nijedan nov podatak: pseudonim onoga koga si potvrdio već stoji u tvom
 * lancu (stranica Potvrde). Vidi ga isključivo vlasnik naloga (čl. 67), kao i sam iznos.
 *
 * 🔴 Za sopstvene potvrde (`kaoPotvrdjeni`) spiska NEMA i ne treba mu: tu se čeka
 * doprinos samog vlasnika naloga, pa je odgovor na „ko" uvek on.
 */
export async function dohvatiZabelezenePotvrde(userId: string): Promise<{
  /** Koliko POEN-a čeka kao potvrđenom (njegovih 1.000 po svakoj potvrdi). */
  kaoPotvrdjeni: number;
  /** Koliko POEN-a čeka kao potvrđivaču — čeka TUĐI potez. */
  kaoPotvrdjivac: number;
  /** Koga si potvrdio a njegov prvi doprinos se čeka. */
  cekamPotvrdjene: CekaDoprinos[];
}> {
  const izborOsobe = { verifikovani: { select: { id: true, pseudonim: true } } } as const;
  const [primljene, obavljene] = await Promise.all([
    prisma.verifikacionaVeza.count({
      where: { verifikovaniId: userId, poenStatus: PotvrdaPoenStatus.ZABELEZEN },
    }),
    prisma.verifikacionaVeza.findMany({
      where: { verifikatorId: userId, poenStatus: PotvrdaPoenStatus.ZABELEZEN },
      select: izborOsobe,
    }),
  ]);
  return {
    kaoPotvrdjeni: primljene * POEN_VERIFIKOVANI,
    // 🔴 Iznos ide po VEZI, ne po čoveku iz spiska — vidi `razlicitiLjudi`.
    kaoPotvrdjivac: obavljene.length * POEN_VERIFIKATOR,
    cekamPotvrdjene: razlicitiLjudi(obavljene),
  };
}

/**
 * Javlja obema stranama da je POEN upisan. Ide POSLE emisije — javlja se o svršenom
 * činu. Ne baca: upis se ne poništava zato što obaveštenje nije prošlo.
 */
async function javiUpisan(
  veza: NonNullable<Awaited<ReturnType<typeof podaciZaUpis>>>,
  uslov: UslovPotvrde | null,
): Promise<void> {
  const iznosVerifikatora = POEN_VERIFIKATOR.toLocaleString("sr-RS");
  const iznosVerifikovanog = POEN_VERIFIKOVANI.toLocaleString("sr-RS");
  try {
    await obavesti(veza.verifikator.id, {
      tip: "potvrda_poen",
      kljuc: "notifikacije.potvrda_poen_potvrdjivac",
      parametri: { pseudonim: veza.verifikovani.pseudonim, iznos: iznosVerifikatora },
      naslov: `Upisan ti je doprinos od ${iznosVerifikatora} POEN`,
      tekst:
        `Član „${veza.verifikovani.pseudonim}", čiju si stvarnost potvrdio, ostvario je ` +
        `svoj prvi doprinos, pa ti je upisano ${iznosVerifikatora} POEN po toj potvrdi.`,
      link: "/novcanik",
    });
    await obavesti(veza.verifikovani.id, {
      tip: "potvrda_poen",
      kljuc: "notifikacije.potvrda_poen_potvrdjeni",
      parametri: { pseudonim: veza.verifikator.pseudonim, iznos: iznosVerifikovanog },
      naslov: `Upisan ti je doprinos od ${iznosVerifikovanog} POEN`,
      tekst:
        `Po potvrdi koju ti je dao član „${veza.verifikator.pseudonim}" upisano ti je ` +
        `${iznosVerifikovanog} POEN.`,
      link: "/novcanik",
    });
  } catch (e) {
    console.error("[potvrda-poen] obaveštenje nije poslato", { vezaId: veza.id, uslov, e });
  }
}

/**
 * Javlja obema stranama da je POEN ZABELEŽEN i šta ga otključava. Zove se u trenutku
 * potvrde, kad uslov još nije ispunjen.
 *
 * 🔴 Bez ovoga potvrda za obe strane izgleda kao kvar: indeks skoči, a POEN-a nema i
 * niko ne kaže zašto.
 */
export async function javiZabelezeno(vezaId: string): Promise<void> {
  try {
    const veza = await podaciZaUpis(vezaId);
    if (!veza) return;
    const iznosVerifikatora = POEN_VERIFIKATOR.toLocaleString("sr-RS");
    const iznosVerifikovanog = POEN_VERIFIKOVANI.toLocaleString("sr-RS");

    await obavesti(veza.verifikator.id, {
      tip: "potvrda_poen",
      kljuc: "notifikacije.potvrda_poen_ceka_potvrdjivac",
      parametri: { pseudonim: veza.verifikovani.pseudonim, iznos: iznosVerifikatora },
      naslov: `Zabeležen ti je doprinos od ${iznosVerifikatora} POEN`,
      tekst:
        `Potvrdio si stvarnost člana „${veza.verifikovani.pseudonim}". ${iznosVerifikatora} POEN ` +
        `upisuje ti se kad on ostvari svoj prvi doprinos — objavi ponudu koju Fondacija odobri, ` +
        `donira, postane pokrovitelj ili izvrši operativni doprinos.`,
      link: "/verifikacija",
    });
    await obavesti(veza.verifikovani.id, {
      tip: "potvrda_poen",
      kljuc: "notifikacije.potvrda_poen_ceka_potvrdjeni",
      parametri: { pseudonim: veza.verifikator.pseudonim, iznos: iznosVerifikovanog },
      naslov: `Zabeležen ti je doprinos od ${iznosVerifikovanog} POEN`,
      tekst:
        `Član „${veza.verifikator.pseudonim}" potvrdio je tvoju stvarnost. ${iznosVerifikovanog} POEN ` +
        `upisuje ti se kad ostvariš svoj prvi doprinos — objavi ponudu koju Fondacija odobri, ` +
        `doniraj, postani pokrovitelj ili izvrši operativni doprinos.`,
      link: "/pijaca/novi-oglas",
    });
  } catch (e) {
    console.error("[potvrda-poen] obaveštenje o čekanju nije poslato", { vezaId, e });
  }
}

export type { VezaZaUpis };
