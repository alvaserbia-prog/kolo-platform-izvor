/**
 * Čista pravila evidencije identiteta — Pravilnik o KOLO sistemu čl. 31
 * (set 4.7.3). Bez Prisme: uvozi ih i pretraživač.
 *
 * 🔴 Evidencija identiteta je ZASEBNA od evidencije doprinosa: ime i prezime se
 * nikad ne upisuje u zapis POEN-a (opis transakcije), ne prikazuje se drugim
 * korisnicima i čita ga samo administratorski tim, izvoz podataka i brisanje
 * naloga. Brana: `__tests__/identitet-izvor.test.ts`.
 *
 * Ime se upisuje iz pet izvora i samo iz njih: članstvo u gazdinstvu (ime
 * upisuje sam član), javna donacija (ime donatora), svojstvo zadrugara (ime
 * dostavlja zadruga), pokroviteljstvo (ime zastupnika koji podnosi prijavu,
 * upisuje se pri potvrdi prijema, posle poređenja sa APR-om) i ulazak na spisak
 * za poziv (ime upisuje sam korisnik; set 4.8.4, N4-M2). JMBG, broj lične karte
 * ni kopija isprave se ne upisuju.
 */

export type IzvorIdentiteta = "GAZDINSTVO" | "DONACIJA" | "ZADRUGA" | "POKROVITELJSTVO" | "SPISAK_ZA_POZIV";

export const MAX_IME_PREZIME = 100;

export type ProveraImena = { ok: true; imePrezime: string } | { ok: false; razlog: string };

/** Sređuje unos (razmaci) i proverava da ima bar dve reči — ime i prezime. */
export function procitajImePrezime(unos: unknown): ProveraImena {
  const s = typeof unos === "string" ? unos.trim().replace(/\s+/g, " ") : "";
  if (s.length > MAX_IME_PREZIME) return { ok: false, razlog: "Ime i prezime je predugačko." };
  const reci = s.split(" ").filter((r) => /\p{L}/u.test(r));
  if (reci.length < 2 || s.length < 4) return { ok: false, razlog: "Upiši ime i prezime." };
  if (/\d/.test(s)) return { ok: false, razlog: "Ime i prezime ne sadrži cifre." };
  return { ok: true, imePrezime: s };
}

/**
 * Ključ poređenja: bez dijakritika, malim slovima, reči poređane — „Šarić Nikola"
 * i „nikola saric" su isto ime. Isti postupak kao `normalizujUplatioca`, da
 * uplatilac i upisano ime daju isti ključ.
 */
export function kljucImena(ime: string | null | undefined): string | null {
  if (!ime) return null;
  const reci = ime
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort();
  const k = reci.join(" ");
  return k.length >= 3 ? k : null;
}

export function istoIme(a: string | null | undefined, b: string | null | undefined): boolean {
  const ka = kljucImena(a);
  return ka !== null && ka === kljucImena(b);
}

/**
 * Jedan nalog, jedno ime (čl. 31 st. 3): prvi izvor upisuje, kasniji izvor koji
 * donese DRUGO ime ne prepisuje upisano. Gazdinstvo i zadruga tada odbijaju
 * unos, isto kao i prijava pokroviteljstva (ispravka ide prigovorom vrste
 * „Ispravka podatka"); donacija se evidentira,
 * a upisano ime ostaje, jer uplatilac može biti i zajednički račun.
 */
/**
 * `MALOLETAN` — evidencija se za maloletni nalog ne vodi (čl. 31 st. 7). Pozivaoci
 * proveravaju samo `RAZLIKUJE_SE`, pa za njih ovaj ishod znači „ništa nije upisano".
 */
export type IshodUpisa = "UPISANO" | "ISTO" | "RAZLIKUJE_SE" | "MALOLETAN";

export function ishodUpisa(postojece: string | null | undefined, novo: string): IshodUpisa {
  if (!postojece) return "UPISANO";
  return istoIme(postojece, novo) ? "ISTO" : "RAZLIKUJE_SE";
}

export const PORUKA_DRUGO_IME =
  "Uz ovaj nalog je već upisano drugo ime i prezime. Ako je upisano ime netačno, ispravka se traži prigovorom vrste „Ispravka podatka“.";
