/**
 * Zajedničke ulazne validacije (bez eksternih biblioteka).
 */

/** Kanonska forma email-a — jedna ista svuda (registracija, login, reset, OAuth). */
export function normalizujEmail(e: unknown): string {
  return typeof e === "string" ? e.trim().toLowerCase() : "";
}

/** Plitka provera oblika email-a (dovoljno za odbacivanje očiglednog smeća). */
export function validanEmail(e: unknown): e is string {
  const v = normalizujEmail(e);
  return v.length >= 3 && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Samo latinična slova, brojevi i `_ . -`; prvi i poslednji znak slovo ili broj. */
const PSEUDONIM_REGEX = /^[A-Za-z0-9][A-Za-z0-9_.-]*[A-Za-z0-9]$/;

/**
 * Imena koja ne smeju da budu pseudonim.
 *
 * Prvi razlog je tehnički: pseudonim stoji u adresi profila (`/profil/<pseudonim>`),
 * a `/profil/oglasi` je već stranica „moji oglasi" — statička putanja u Next.js-u
 * pobeđuje dinamičku, pa korisnik sa tim pseudonimom nikad ne bi imao profil.
 * Drugi je zaštita od imitacije sistema (Protokol, Fondacija, podrška).
 */
export const REZERVISANI_PSEUDONIMI = new Set([
  // sudaraju se sa postojećim ili očekivanim putanjama
  "oglasi", "profil", "api", "admin", "login", "logout", "registracija",
  "pijaca", "poruke", "sistem", "novcanik", "zrno", "programi", "krug",
  "glasanje", "verifikacija", "nadzor", "pocetna", "uskoro", "nova", "novi",
  // zaštita od imitacije sistema
  "protokol", "banka", "fondacija", "kolo", "podrska", "support", "sistemska",
  // očigledno smeće
  "null", "undefined", "true", "false",
]);

/** Poruka o pravilu — ista svuda gde se pseudonim proverava. */
export const PSEUDONIM_PRAVILO =
  "Pseudonim: 3–30 znakova, samo latinična slova (a–z, A–Z), brojevi i _ . - " +
  "(bez razmaka i bez č, ć, š, ž, đ i ćirilice). Ne sme počinjati ni završavati se sa _ . -";

/**
 * Ključ po kome se pseudonim traži i po kome se čuva jedinstvenost.
 *
 * Velika slova OSTAJU u prikazu (pseudonim se vidi na svakom ekranu, a `nikola`
 * umesto `Nikola` bi pokvario prikaz svuda), ali se poređenje radi bez obzira na
 * veličinu slova: `/profil/nikola` i `/profil/Nikola` vode na isti nalog, i niko
 * ne može da napravi `NIKOLA` pored postojećeg `Nikola`.
 */
export function kljucPseudonima(p: string): string {
  return p.trim().toLowerCase();
}

/**
 * Pseudonim ulazi u adresu profila, pa je skup znakova namerno uzak: 3–30 znakova,
 * samo ASCII slova, brojevi i `_ . -` (ne dva zaredom, ne na krajevima).
 *
 * Zašto bez razmaka i srpskih slova/ćirilice:
 *  - link ostaje čitljiv i pri kopiranju (bez `%20` i `%D0%9C`);
 *  - gasi se imitacija homografima — ćirilično „М" izgleda isto kao latinično „M",
 *    pa bi „Мarko" i „Marko" bila dva vizuelno istovetna naloga.
 *
 * Pravilo važi za nove naloge i za svaku izmenu; nalozi koji su ranije uzeli
 * pseudonim sa starim znakovima nastavljaju da rade neizmenjeni.
 *
 * Rezervisan prefiks `obrisani-korisnik` je zabranjen (imitacija ugašenih naloga).
 */
export function validanPseudonim(p: unknown): p is string {
  if (typeof p !== "string") return false;
  const t = p.trim();
  if (t.length < 3 || t.length > 30) return false;
  if (/[_.-]{2}/.test(t)) return false;
  if (/^obrisani-korisnik/i.test(t)) return false;
  if (REZERVISANI_PSEUDONIMI.has(kljucPseudonima(t))) return false;
  return PSEUDONIM_REGEX.test(t);
}
