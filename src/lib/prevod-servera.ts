import sr from "../../messages/sr.json";
import en from "../../messages/en.json";
import ru from "../../messages/ru.json";
import hr from "../../messages/hr.json";
import hu from "../../messages/hu.json";
import { lat2cyr } from "./lat2cyr";
import { fmtBroj } from "./format";

/**
 * Prevod poruka NA SERVERU, van next-intl konteksta zahteva.
 *
 * Zašto ne `getTranslations`: mejlovi i push idu kao `void` posle odgovora, kad
 * kontekst zahteva više ne postoji, a jezik se čita iz baze (`User.jezik`), ne
 * iz kolačića posmatrača. Ovde je zato namerno običan lookup nad JSON-om.
 *
 * Podržava samo `{parametar}` zamenu — obaveštenja nemaju množinu ni izbore.
 * Ako zatreba puna ICU sintaksa, koristiti next-intl tamo gde kontekst postoji.
 */
// 🔴 Svih pet jezika iz `src/i18n/routing.ts`. Do 14.09.2026. su ovde stajala samo
// `sr`, `en` i `ru`, pa su hrvatski i mađarski korisnici dobijali SRPSKI tekst u
// svakoj poruci greške i u svakom obaveštenju — isti kvar koji je do 4.1.0 pogađao
// same akte, jer ih loader nije mapirao. Uz tekst pristanka to više nije samo
// neuredno: ZZPL čl. 15 st. 2 traži da pristanak bude na jasnom i razumljivom
// jeziku onoga ko ga daje.
const PORUKE: Record<string, unknown> = { sr, en, ru, hr, hu };

/** Vrednost po putanji "a.b.c", ili undefined. */
function dohvati(izvor: unknown, put: string): string | undefined {
  const v = put.split(".").reduce<unknown>(
    (o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined),
    izvor,
  );
  return typeof v === "string" ? v : undefined;
}

export type Parametri = Record<string, string | number>;

/**
 * Vrati prevedenu poruku. Redosled: traženi jezik → srpski → `rezerva`.
 *
 * `sr-Cyrl` nema svoj fajl — koristi srpski tekst i transliteruje ga, isto kao
 * što `CirilicaProvider` radi u pregledaču.
 */
export function prevedi(
  locale: string | null | undefined,
  kljuc: string,
  parametri?: Parametri | null,
  rezerva?: string,
): string {
  const cirilica = locale === "sr-Cyrl";
  const jezik = cirilica ? "sr" : (locale ?? "sr");
  const sablon = dohvati(PORUKE[jezik], kljuc) ?? dohvati(PORUKE.sr, kljuc) ?? rezerva;
  if (sablon === undefined) return rezerva ?? kljuc;

  // Brojevi se formatiraju po jeziku primaoca (sr 1.000 · en 1,000 · ru 1 000),
  // zato pozivna mesta prosleđuju SIROV broj, a ne već sklopljen tekst.
  //
  // Parametar koji počinje sa "@" je i sam KLJUČ i prevodi se ugnežđeno — npr.
  // naziv kategorije Pijace ("@pijaca.kategorija_hrana"). Bez toga bi u rusko
  // obaveštenje ušao srpski naziv kategorije.
  const popunjen = parametri
    ? sablon.replace(/\{(\w+)\}/g, (celo, ime: string) => {
        if (!(ime in parametri)) return celo;
        const v = parametri[ime];
        if (typeof v === "number") return fmtBroj(v, jezik);
        const s = String(v);
        if (!s.startsWith("@")) return s;
        const ugnezden = s.slice(1);
        return dohvati(PORUKE[jezik], ugnezden) ?? dohvati(PORUKE.sr, ugnezden) ?? ugnezden;
      })
    : sablon;

  return cirilica ? lat2cyr(popunjen) : popunjen;
}

/**
 * Opis transakcije za prikaz. Stavka sa ključem se prevodi (pa i stari redovi
 * dobijaju važeću formulaciju), stavka bez ključa — stari redovi i nekonvertovana
 * pozivna mesta — prikazuje sačuvan srpski `description`.
 */
export function opisTransakcije(
  locale: string | null | undefined,
  t: { opisKljuc: string | null; opisParametri: unknown; description: string | null },
): string | null {
  if (!t.opisKljuc) return t.description;
  return prevedi(locale, t.opisKljuc, (t.opisParametri ?? undefined) as Parametri | undefined, t.description ?? "");
}
