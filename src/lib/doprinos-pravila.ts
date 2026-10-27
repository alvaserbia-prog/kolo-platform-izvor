/**
 * Pravila doprinosa sadržaju platforme — ČISTE funkcije, bez baze.
 * Osnov: Pravilnik o KOLO sistemu čl. 38, Uslovi korišćenja čl. 18–19.
 *
 * Izdvojeno iz `src/lib/protokol/doprinos-sadrzaju.ts` (koji radi sa Prismom) zato
 * što ova pravila koristi i FORMA OGLASA u pretraživaču. Da su u istom modulu,
 * `import` iz klijentske komponente povukao bi Prisma klijent u browser bundle.
 * Servisni modul ih re-eksportuje, pa server ima jedan ulaz.
 */

/** Iznos jednokratnog doprinosa (čl. 38 st. 1). */
export const IZNOS = 1000;

/**
 * `status` razdvaja dve vrste odbijanja, jer nisu ista stvar:
 *  - 400 — oglas ne ispunjava sadržinski minimum (popravlja se dopunom oglasa);
 *  - 403 — korisniku to nije dozvoljeno (potražnja, prekoračen broj oglasa).
 */
export type Provera = { ok: true } | { ok: false; razlog: string; status: 400 | 403 };

/** Polja oglasa od kojih zavisi sadržinski minimum. */
export type OglasMinimum = {
  tip: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  images: string[];
};

/**
 * Sadržinski minimum iz Uslova: naslov, opis, bar jedna fotografija, kategorija
 * i mesto. Naslov i opis moraju POSTOJATI, ali im dužina nije uslov.
 *
 * 🔴 Brojčani prag dužine je UKINUT (odluka vlasnika, 2026-08-13). Ranije je
 * tražio opis od 40 znakova, čime je odbijao i sasvim uredan kratak oglas
 * („Med, 1 kg") i time uskraćivao doprinos ljudima koji su Pijacu popunili
 * stvarnim sadržajem. Traži se prisustvo, ne obim. Ne vraćati brojčani prag bez
 * izričitog naloga; ako ikad ponovo bude uslov, ovde je jedino mesto gde se dodaje.
 *
 * Minimum ima dve uloge i one se ne poklapaju:
 *  - USLOV ZA OBJAVU važi samo za neverifikovanog korisnika (vidi `smeDaPostaviOglas`);
 *  - USLOV ZA DOPRINOS važi za svakoga (Pravilnik čl. 38 st. 1; Uslovi čl. 18 st. 1), pa i za verifikovanog.
 * Verifikovanom se, dakle, oglas ispod minimuma i dalje objavljuje — samo mu se
 * povodom njega ne beleži doprinos.
 */
export function oglasIspunjavaMinimum(oglas: OglasMinimum): Provera {
  if (!(oglas.title ?? "").trim())
    return { ok: false, razlog: "Naslov je obavezan.", status: 400 };
  if (!(oglas.description ?? "").trim())
    return { ok: false, razlog: "Opis je obavezan.", status: 400 };
  if (oglas.images.length === 0)
    return { ok: false, razlog: "Oglas mora imati bar jednu fotografiju.", status: 400 };
  if (!oglas.category)
    return { ok: false, razlog: "Kategorija je obavezna.", status: 400 };
  if (!oglas.location)
    return { ok: false, razlog: "Mesto je obavezno.", status: 400 };
  return { ok: true };
}

/**
 * Sme li korisnik da objavi ovaj oglas.
 *
 * Potvrđen član — bez ograničenja (zatečeno ponašanje se ne dira).
 * Nov član — od seta 4.8.1 (odluka vlasnika 20.10.2026) sme i potražnju i više od
 * tri aktivna oglasa (Uslovi čl. 14 st. 2); od njega se pri objavi traži samo
 * sadržinski minimum, jer iza naloga još niko ne jemči za sadržaj.
 *
 * 🔴 Ne vraćati ograničenje na ponudu ni broj aktivnih oglasa bez naloga vlasnika.
 */
export function smeDaPostaviOglas(input: {
  verifikovan: boolean;
  oglas: OglasMinimum;
}): Provera {
  if (input.verifikovan) return { ok: true };
  return oglasIspunjavaMinimum(input.oglas);
}

/**
 * Sme li korisnik da inicira ažuriranje evidencije POEN-a u korist drugog.
 *
 * 🔴 Od seta 4.8.1 (odluka vlasnika 20.10.2026) prepis je otvoren i novom članu
 * (Uslovi čl. 14 st. 3): prepis samo seli zapis koji već postoji i ukupan broj
 * POEN-a ne menja (Pravilnik čl. 17 st. 5). Ono što čeka potvrdu je NASTANAK zapisa — POEN po
 * potvrdi (dokaz stvarnosti čl. 19) i doprinos gazdinstva (Pravilnik čl. 39) — a ne njegovo
 * kretanje. Dečji parovi idu kroz `smeDaPrepise` (Modul Deca) pre ove provere, a
 * nadoknada kroz `jeNadoknada`.
 *
 * Argumenti ostaju da bi odluka i dalje stajala na jednom mestu i da bi pozivna
 * mesta (prepis, gašenje naloga, zadruga, ekran POEN) ostala ista ako se pravilo
 * ikad ponovo suzi. Ne uvoditi drugu proveru prepisa mimo ove funkcije.
 */
export function smeDaSalje(_tipKorisnika: string, _identitetUtvrdjen = false): boolean {
  return true;
}
