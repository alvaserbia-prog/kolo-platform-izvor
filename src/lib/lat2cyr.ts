// Transliteracija srpske latinice → ćirilice.
//
// Determinističko preslikavanje, koristi se na dva mesta:
//   1) server-side, nad i18n porukama (`src/i18n/request.ts`) — smanjuje „bljesak"
//      latinice pre nego što klijent preuzme renderovanje;
//   2) client-side, nad celim DOM-om (`src/components/CirilicaProvider.tsx`) —
//      pokriva i tekst zakucan direktno u JSX-u i korisnički sadržaj.
//
// Funkcija je IDEMPOTENTNA: ćirilični ulaz prolazi nepromenjen (ćirilica nema
// preslikavanje), pa višestruko pozivanje (npr. iz MutationObserver-a) ne kvari tekst.
//
// Svesno se NE konvertuju:
//   - URL-ovi i e-mail adrese (klikabilnost / funkcionalnost),
//   - tehničke/licencne skraćenice iz `BELA_LISTA` (ostaju u latinici),
//   - cifre i interpunkcija (nemaju preslikavanje, prolaze nepromenjeni).

// Skraćenice/oznake koje ostaju u latinici (izgledale bi pogrešno u ćirilici).
// Lista je namerno mala i laka za dopunu — dodaj token ovde ako negde „iskoči".
const BELA_LISTA = [
  "QR", "AGPL-3.0", "AGPL", "GPL", "CC BY-SA", "BY-SA", "CC",
  "PDF", "JSON", "API", "URL", "HTML", "CSS", "OAuth", "GDPR",
  "RSD", "EUR", "USD", "ISO", "NestPay", "Vercel", "Neon", "Prisma",
  "Next.js", "TypeScript", "PostgreSQL", "Whitepaper",
  // Strano ime i skraćenice koje su se u ćirilici raspadale u besmislicu:
  // „Гоогле", „ДЦО", „Сигнед-офф-бy", „ЦОНТРИБУТИНГ.мд", „ДПИА".
  "Google", "DCO", "Signed-off-by", "CONTRIBUTING.md", "DPIA",
  // Naziv fascikle u klijentu za poštu — piše se onako kako u klijentu i stoji.
  // Samo veliko „Spam"; obična reč „spam" je odomaćena i ide u ćirilicu.
  "Spam",
  // APR i PIB se u srpskoj ćirilici inače pišu АПР i ПИБ — ovde ostaju u
  // latinici odlukom vlasnika, radi jednoobraznosti sa ostalim skraćenicama.
  "APR", "PIB",
  // Formati slika i oznake granica: „WебП", „Маx", „ЈПГ", „ПНГ".
  "AGPL-3.0-only", "WebP", "JPG", "PNG", "Screenshot", "Max", "max", "Min", "min",
  // Imena sistema i naslovi na engleskom sa javnih stranica. Engleska fraza bez
  // slova q/w/x/y ne izgleda polomljeno — samo tiho postane ćirilična
  // besmislica („Тхе Енд оф Монеy"), pa se cele fraze maskiraju.
  "WIR", "Local Exchange Trading System",
  "Innovation in Exchange and Finance",
  "The End of Money and the Future of Civilization",
  "GNU Affero General Public License", "Google Analytics",
  // Imena proizvoda: „3Д Сецуре" i „Цлоудфларе Р2" su izlazili na ekranu.
  // Sestre po istom pravilu (Vercel, Neon, Prisma, NestPay) su gore.
  "3D Secure", "Cloudflare R2", "Cloudflare",
  // Duži token MORA biti maskiran pre kraćeg koji je njegov početak, inače
  // „AGPL-3.0" pojede početak i ostavi „онлy", a „Google" ostavi „Аналyтицс".
  // Sortiranje to rešava jednom za svagda — red unosa iznad je onda slobodan.
].sort((a, b) => b.length - a.length);

// Strane reči (pozajmljenice) koje ostaju u latinici u SVIM padežnim oblicima.
// Obrasci su case-insensitive; originalni oblik se očuva (maskiranje vraća tekst
// doslovno). Dodaj koren reči ovde da pokriješ sve nastavke odjednom.
const BELA_LISTA_OBRASCI: RegExp[] = [
  // freelancer, freelanceri, freelancera, freelancerima… → ostaje latinica.
  /\bfreelancer[a-z]*\b/gi,
  // blockchain, blockchaina, blockchainu… → ostaje latinica.
  /\bblockchain[a-z]*\b/gi,
  // open source / opensource / open-source (+ nastavci) → ostaje latinica.
  /\bopen[\s-]?source[a-z]*\b/gi,
  // email / e-mail (+ nastavci) — sama reč ostaje latinica (adrese su već zaštićene).
  /\be-?mail[a-z]*\b/gi,
  // chat / Chat soba / chatu… → ostaje latinica (pozajmljenica, „Цхат“ izgleda pogrešno).
  /\bchat[a-z]*\b/gi,
  // browser, browsera, browseru… → „броwсер" je bio vidljiv u porukama o
  // dozvoli za kameru i o obaveštenjima.
  /\bbrowser[a-z]*\b/gi,
  // Sardex, Sardexa, Sardexu… — ime se u srpskom menja po padežima, pa tačan
  // token nije dovoljan.
  /\bsardex[a-z]*\b/gi,
];

// Reči kod kojih digraf NIJE jedno slovo (n+j, d+ž zasebno) — npr. prefiks
// „nad-" + „živeti", ili strane reči. Preslikavaju se kao cela reč.
// Lista je proširiva; za rečnik ove platforme praktično se ne aktivira.
const IZUZECI: Record<string, string> = {
  injekcija: "инјекција",
  injekcije: "инјекције",
  konjunkcija: "конјункција",
  konjugacija: "конјугација",
  tanjug: "Тањуг",
  nadziveti: "надживети",
  nadzivljava: "надживљава",
};

// Osnovno preslikavanje pojedinačnih slova (mala slova; velika se izvode).
const SLOVA: Record<string, string> = {
  a: "а", b: "б", c: "ц", č: "ч", ć: "ћ", d: "д", đ: "ђ", e: "е",
  f: "ф", g: "г", h: "х", i: "и", j: "ј", k: "к", l: "л", m: "м",
  n: "н", o: "о", p: "п", r: "р", s: "с", š: "ш", t: "т", u: "у",
  v: "в", z: "з", ž: "ж",
  // q, w, x, y nemaju standardnu srpsku ćirilicu — ostaju nepromenjeni.
};

const DIGRAFI: Record<string, string> = { dž: "џ", lj: "љ", nj: "њ" };

const SENTINEL_OTV = "";
const SENTINEL_ZATV = "";

// Regexi za tokene koje štitimo od konverzije (maskiramo pre, vraćamo posle).
const RE_URL = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const RE_EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const RE_DOMEN = /\b[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.(?:rs|com|org|net|eu|io|info)\b/g;
// ICU placeholderi ({pseudonim}, {count}) i rich-text/HTML tagovi (<strong>):
// imena argumenata i tagova NE smeju u ćirilicu — inače next-intl ne nalazi
// vrednost po imenu (FORMATTING_ERROR) ni rich tag. Maskira se SAMO oznaka;
// tekst između tagova (npr. <strong>Naslov</strong>) i dalje ide u ćirilicu.
// (Sve poruke koriste proste {ime} placeholdere — bez ugnežđenih { } / ICU plural.)
// Prost argument: `{pseudonim}`, `{count, number}`. Namerno NE hvata granu ICU
// plurala (`{# stranica}`), koja počinje sa `#` — tekst u grani se VIDI na
// ekranu i mora u ćirilicu.
const RE_ICU = /\{\s*[A-Za-z0-9_]+(?:\s*,[^{}]*)?\s*\}/g;
// ICU plural/select ima ugnežđene zagrade, koje prosta maska ne pokriva. Bez
// ovoga su ključne reči odlazile u ćirilicu (`{цоунт, плурал, оне …}`) i
// next-intl više nije umeo da pročita poruku — dakle kvar, ne kozmetika.
const RE_ICU_ZAGLAVLJE = /\{\s*[A-Za-z0-9_]+\s*,\s*(?:plural|select|selectordinal)\s*,/g;
const IMA_ICU_GRANE = /\{\s*[A-Za-z0-9_]+\s*,\s*(?:plural|select|selectordinal)\s*,/;
// Kategorije se maskiraju samo unutar takve poruke: „one" je i srpska reč, pa
// bez te ograde ne bi bilo bezbedno.
const RE_ICU_KATEGORIJA = /(?:\b(?:zero|one|two|few|many|other)|=\d+)\s*(?=\{)/g;
const RE_TAG = /<\/?[A-Za-z][A-Za-z0-9-]*\s*\/?>/g;

function ucinilVelikim(c: string): boolean {
  return c !== c.toLowerCase() && c === c.toUpperCase();
}

/** Transliteriše „čisti" tekst (bez zaštićenih tokena). */
function osnovnaTranslit(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = i + 1 < s.length ? s[i + 1] : "";
    const par = (c + next).toLowerCase();

    if (DIGRAFI[par]) {
      let zn = DIGRAFI[par];
      // Veliko prvo slovo digrafa → veliko ćirilično slovo (Џ/Љ/Њ).
      if (ucinilVelikim(c)) zn = zn.toUpperCase();
      out += zn;
      i++; // potrošili smo dva latinična slova
      continue;
    }

    const malo = c.toLowerCase();
    const mapirano = SLOVA[malo];
    if (mapirano !== undefined) {
      out += ucinilVelikim(c) ? mapirano.toUpperCase() : mapirano;
    } else {
      out += c;
    }
  }
  return out;
}

/** Primeni rečnik izuzetaka (cele reči, case-insensitive uz očuvanje glave reči). */
function primeniIzuzetke(s: string): string {
  return s.replace(/[A-Za-zčćšžđČĆŠŽĐ]+/g, (rec) => {
    const klint = IZUZECI[rec.toLowerCase()];
    if (!klint) return rec;
    // Očuvaj veliko početno slovo ako je original imao.
    if (ucinilVelikim(rec[0])) return klint[0].toUpperCase() + klint.slice(1);
    return klint;
  });
}

/**
 * Transliteriše srpski latinični tekst u ćirilicu.
 * Idempotentno; čuva URL-ove, e-mailove, domene i tokene iz bele liste.
 */
export function lat2cyr(input: string): string {
  if (!input) return input;
  // Brzi izlaz: bez latiničnih slova nema šta da se konvertuje.
  if (!/[A-Za-zčćšžđČĆŠŽĐ]/.test(input)) return input;

  const cuvani: string[] = [];
  const masc = (m: string) => {
    const idx = cuvani.push(m) - 1;
    return SENTINEL_OTV + idx + SENTINEL_ZATV;
  };

  // 1) Maskiraj zaštićene tokene.
  let s = input
    .replace(RE_URL, masc)
    .replace(RE_EMAIL, masc)
    .replace(RE_DOMEN, masc);
  if (IMA_ICU_GRANE.test(s)) s = s.replace(RE_ICU_ZAGLAVLJE, masc).replace(RE_ICU_KATEGORIJA, masc);
  s = s.replace(RE_ICU, masc).replace(RE_TAG, masc);

  // 2) Maskiraj reči iz bele liste (kao cele reči, case-sensitive po unosu).
  for (const token of BELA_LISTA) {
    const re = new RegExp(`(?<![\\wčćšžđ])${escapeRe(token)}(?![\\wčćšžđ])`, "g");
    s = s.replace(re, masc);
  }

  // 2b) Maskiraj obrasce pozajmljenica (sve padežne varijante, case-insensitive).
  for (const re of BELA_LISTA_OBRASCI) {
    s = s.replace(re, masc);
  }

  // 3) Izuzeci (nj/dž koji nisu digraf) pre osnovne konverzije.
  s = primeniIzuzetke(s);

  // 4) Osnovna transliteracija.
  s = osnovnaTranslit(s);

  // 5) Vrati zaštićene tokene.
  s = s.replace(
    new RegExp(SENTINEL_OTV + "(\\d+)" + SENTINEL_ZATV, "g"),
    (_m, i) => cuvani[Number(i)],
  );

  return s;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Rekurzivno transliteriše sve string vrednosti u objektu/nizu (za i18n poruke). */
export function lat2cyrDeep<T>(val: T): T {
  if (typeof val === "string") return lat2cyr(val) as unknown as T;
  if (Array.isArray(val)) return val.map((v) => lat2cyrDeep(v)) as unknown as T;
  if (val && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(val as Record<string, unknown>)) {
      out[k] = lat2cyrDeep((val as Record<string, unknown>)[k]);
    }
    return out as T;
  }
  return val;
}
