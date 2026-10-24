/**
 * Uslov za upis POEN-a po potvrdi u lancu potvrda — ČISTE funkcije, bez baze.
 * Osnov: Pravilnik o dokazu stvarnosti čl. 7, Pravilnik o KOLO sistemu čl. 15 t. 2.
 *
 * Do ove izmene je Protokol upisivao 1.000 + 1.000 **odmah po potvrdi**, automatski,
 * bez ijedne ljudske odluke i bez ijednog traga da je potvrđeni išta uradio. To je bio
 * jedini kanal u sistemu koji tako radi: donaciju potvrđuje čovek iz izvoda, prvi oglas
 * naloga bez potvrde ide kroz odobrenje, dečji kanal traži roditelja koji je redovan
 * član, osnivački je vezan za opticaj. Potvrda — ništa.
 *
 * Sada POEN čeka **trag stvarnog učešća** potvrđenog korisnika. Pravilo je isto ono
 * koje čl. 40a već nosi za nalog bez potvrde („da nalozi čija stvarnost nije potvrđena
 * ne uvećavaju ukupan broj evidentiranih POEN-a pre nego što se u sistemu pojavi trag
 * stvarnog učešća") — ovde se samo dovršava i na kanalu potvrde.
 *
 * 🔴 SAM ČIN POTVRDE SE NE MENJA. Indeks se puni normalno (+10 p.p.), nalog postaje
 * redovan član istog časa, pun pristup odmah. Čeka **samo zapis POEN-a**. Pristup ide
 * iz poverenja (ko je stao iza tebe), POEN iz doprinosa (šta si dao) — ta dva se ne
 * spajaju. Da su spojena, čovek koji tek uđe ne bi mogao ni da se javi nekome kako bi
 * dogovorio razmenu kojom bi uslov ispunio, a socijalni programi i dečji nalozi (koji
 * traže roditelja koji je REDOVAN član) bi stali.
 *
 * 🔴 ZAŠTO USLOV NIJE „evidentiran doprinos po čl. 40a" u ranijem obliku: čl. 40a je do
 * ove izmene imao i okidače VERIFIKACIJA i PRIMLJEN_POEN, pa bi potvrda otključavala
 * čl. 40a, a čl. 40a potvrdu — brana bi bila prazna. Zato su ta dva okidača uklonjena i
 * ostalo je samo ODOBRENJE: oglas otključava tek kad ga čovek iz UO pogleda.
 *
 * Sva četiri uslova imaju isto svojstvo i to je cela definicija: **doprinos koji je
 * neko potvrdio** — Fondacija (oglas, donacija, pokroviteljstvo) ili nosilac ZRNA
 * odnosno UO (operativni doprinos). Nijedan se ne može sam sebi izdati.
 *
 * 🔴 ŠTA NAMERNO NIJE USLOV:
 *  - **prepis POEN-a** — dogovara se privatno i niko ga ne potvrđuje; dva naloga mogu
 *    da ga proizvedu bez ikoga trećeg, pa ne dokazuje ništa;
 *  - **osnivački doprinos** — automatski akt Protokola vezan za opticaj, ne za radnju;
 *  - **socijalni programi** — nisu doprinos nego podrška: korisnik prima, ne daje;
 *  - **anonimna donacija** — 🔴 ne zbog toga što nije doprinos (jeste, i donator JESTE
 *    član sa nalogom — `DonationRecord.userId` je obavezan), nego zbog privatnosti: POEN
 *    za potvrdu je javan zapis u knjizi, pa bi se pojavio a na Pijaci ne bi osvanuo
 *    nijedan nov oglas — posmatrač zaključuje da je donirao. To je tačno ono što
 *    anonimna donacija krije (čl. 5a). Anoniman donator otključava nekim od druga tri
 *    puta i ništa ne gubi.
 *
 * Izdvojeno iz servisnog modula (`src/lib/protokol/potvrda-poen.ts`) zato što ista
 * pravila koristi i PRIKAZ u pretraživaču — bez toga bi `import` iz klijentske
 * komponente povukao Prisma klijent u browser bundle. Isti obrazac kao
 * `doprinos-pravila.ts` i `nabavka-pravila.ts`.
 */

/** Koji je uslov ispunjen — upisuje se na vezu, da se iz zapisa vidi šta ga je otključalo. */
export type UslovPotvrde = "OGLAS" | "DONACIJA" | "POKROVITELJSTVO" | "OPERATIVNI";

/**
 * Trag učešća potvrđenog korisnika. Svako polje je činjenica koju je potvrdio neko
 * drugi, i nijedno ne zavisi od same potvrde — bez toga bi uslov otključavao sam sebe.
 */
export type TragUcesca = {
  /**
   * Doprinos po čl. 40a je EVIDENTIRAN — dakle Fondacija je odobrila prvi oglas.
   * 🔴 Meri se STATUS doprinosa, ne postojanje oglasa: oglas koji formalno ispunjava
   * sadržinski minimum a nije stvarna ponuda ne sme da otključa 3.000 POEN-a.
   */
  oglasOdobren: boolean;
  /** Potvrđena JAVNA donacija (anonimna se ne računa — vidi zaglavlje). */
  javnaDonacija: boolean;
  /** Potvrđeno pokroviteljstvo — Fondacija je potvrdila prijavu i evidentirala doprinos. */
  pokroviteljstvo: boolean;
  /** Verifikovano izvršenje operativnog doprinosa (nosilac ZRNA u Fazi 2, UO u Fazi 1). */
  operativniDoprinos: boolean;
};

/**
 * Prvi ispunjen uslov, ili `null` ako nijedan nije.
 *
 * Redosled u kom se proverava nije pravilo nego samo izbor oznake koja će se upisati
 * kad je ispunjeno više njih odjednom; ni jedan uslov nije jači od drugog.
 */
export function uslovPotvrde(trag: TragUcesca): UslovPotvrde | null {
  if (trag.oglasOdobren) return "OGLAS";
  if (trag.javnaDonacija) return "DONACIJA";
  if (trag.pokroviteljstvo) return "POKROVITELJSTVO";
  if (trag.operativniDoprinos) return "OPERATIVNI";
  return null;
}

/** Ima li korisnik ijedan trag učešća. */
export function imaTragUcesca(trag: TragUcesca): boolean {
  return uslovPotvrde(trag) !== null;
}

/**
 * Prazan trag — koristi se kao polazna vrednost i u testovima, da se dodavanje novog
 * uslova ne bi tiho provuklo kroz objekte koji ga ne navode.
 */
export const BEZ_TRAGA: TragUcesca = {
  oglasOdobren: false,
  javnaDonacija: false,
  pokroviteljstvo: false,
  operativniDoprinos: false,
};
