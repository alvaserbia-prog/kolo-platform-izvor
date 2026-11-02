/**
 * Ikona vaučera — bira se po rečima iz opisa dobra, odnosno usluge. Crtež je u
 * `src/components/IkonaVaucera.tsx` (linijski set kao na naslovnoj; emodži se ne koriste).
 *
 * Fotografiju dobra pokrovitelj ne šalje: uz vaučer se od pokrovitelja prikazuju
 * samo naziv i logotip (donacije čl. 26 st. 2), pa bi fotografija bila promotivni
 * materijal. Ikonu zato bira Platforma, po opisu, ista za svakog pokrovitelja.
 * Kad nijedna reč ne odgovara, ide opšta ikona po vrsti (DOBRO: poklon / USLUGA: ruka).
 *
 * Reči se porede bez dijakritika i malim slovima, od početka reči („zub" hvata
 * „zuba", „zubni"). Redosled je bitan: prvo poklapanje pobeđuje, pa uže reči idu
 * pre širih („kozji sir" je sir, „pregled zuba" je zub).
 *
 * Čisto pravilo, bez Prisme — uvozi ga i pretraživač.
 */
export type IkonaVaucera =
  | "auto"
  | "bicikl"
  | "bocica"
  | "case"
  | "cekic"
  | "cepanica"
  | "cipela"
  | "cvet"
  | "flasa"
  | "foto"
  | "grozd"
  | "guma"
  | "hleb"
  | "igla"
  | "jabuka"
  | "jagoda"
  | "jaje"
  | "kap"
  | "klas"
  | "klica"
  | "kljuc"
  | "knjiga"
  | "kombi"
  | "krevet"
  | "krigla"
  | "kuca"
  | "laptop"
  | "lotos"
  | "majica"
  | "makaze"
  | "meda"
  | "meso"
  | "metla"
  | "mleko"
  | "munja"
  | "naocare"
  | "nota"
  | "oblacic"
  | "pilula"
  | "poklon"
  | "pribor"
  | "riba"
  | "sapa"
  | "sapun"
  | "sargarepa"
  | "seme"
  | "sir"
  | "solja"
  | "stala"
  | "stampac"
  | "stetoskop"
  | "teg"
  | "tegla"
  | "tegla_meda"
  | "telefon"
  | "torta"
  | "traktor"
  | "ulaznica"
  | "usluga"
  | "vaga"
  | "valjak"
  | "zivina"
  | "zub";

const RECI: [IkonaVaucera, string[]][] = [
  // ── zdravlje i nega ──
  ["zub", ["zub", "stomatolo", "dental", "protez", "plomb", "ortodont"]],
  ["sapa", ["veterin", "ljubimc", "pas ", "psa ", "pse ", "macka", "macke", "macak", "hrana za pse", "hrana za mack"]],
  ["naocare", ["naocar", "optik", "socivo", "dioptrij", "vid "]],
  ["lotos", ["masaz", "fizijatr", "fizikaln", "fizioterap", "kinezi", "miodinam", "rehabilit", "spa ", "wellness", "banj"]],
  ["stetoskop", ["pregled", "lekar", "ordinacij", "ambulant", "medicin", "laborator", "analiz", "ultrazvuk", "ekg"]],
  ["pilula", ["apotek", "lek ", "lekov", "vitamin", "suplement", "caj lekovit"]],
  ["teg", ["joga", "pilates", "medit", "trening", "teretan", "fitnes", "rekreac"]],
  ["bocica", ["manikir", "pedikir", "nokt", "gel lak"]],
  ["bocica", ["kozmeti", "sminkanj", "sminka", "depilac", "tretman lic", "krema"]],
  ["makaze", ["sisanj", "frizer", "frizur", "feniranj", "farbanj kos", "brijanj", "berber", "salon"]],
  // ── hrana i piće ──
  ["torta", ["torta", "torte", "rodjendan"]],
  ["torta", ["kolac", "kolaci", "poslastic", "krofn", "strudl", "baklav"]],
  ["hleb", ["kifl", "pecivo", "kroasan", "burek", "pita", "pite", "gibanic"]],
  ["hleb", ["hleb", "vekn", "pekar", "lepinj", "pogac"]],
  ["klas", ["brasn", "zito", "psenic", "kukuruz", "ovas", "jecam", "zitar"]],
  ["pribor", ["pica", "pizza"]],
  ["pribor", ["rucak", "obrok", "vecera", "dorucak", "restoran", "kuhinj", "jelo", "gulas", "catering"]],
  ["riba", ["riba", "ribe", "saran", "som ", "smudj", "pastrmk", "ribnjak"]],
  ["jaje", ["jaja", "jaje"]],
  ["sir", ["sir ", "sira", "sirev", "kajmak", "urda"]],
  ["mleko", ["mleko", "mleka", "jogurt", "pavlak", "kiselo mleko", "maslac", "puter"]],
  ["zivina", ["pile", "piletin", "pilic", "curetin", "cure ", "patk", "guska"]],
  ["meso", ["slanin", "cvarc", "sunk", "pecenic", "kulen", "kobasic", "suho meso", "suvo meso"]],
  ["meso", ["meso", "mesa", "mesar", "svinj", "govedj", "teletin", "jagnj", "jaretin", "odresc"]],
  ["tegla_meda", ["med ", "meda", "medn", "pcel", "propolis", "sace"]],
  ["case", ["vino", "vina", "vinar", "vinsk"]],
  ["flasa", ["rakij", "sljivovic", "lozovac", "dunjevac", "viljamovk", "liker"]],
  ["krigla", ["pivo", "piva", "pivar"]],
  ["solja", ["kafa", "kafu", "kafe", "espreso"]],
  ["solja", ["caj", "caja", "cajev"]],
  ["solja", ["sok", "sokov", "sirup", "napitak"]],
  ["tegla", ["dzem", "slatko", "ajvar", "zimnic", "kompot", "turšij", "tursij", "pekmez", "kiseli krastav"]],
  ["jabuka", ["jabuk"]],
  ["jabuka", ["krusk", "dunj"]],
  ["jabuka", ["breskv", "kajsij"]],
  ["jabuka", ["tresn", "visnj"]],
  ["jagoda", ["jagod", "malin", "kupin", "borovnic", "ribizl"]],
  ["grozd", ["grozd"]],
  ["jabuka", ["lubenic", "dinj"]],
  ["sargarepa", ["krompir"]],
  ["sargarepa", ["paradajz"]],
  ["sargarepa", ["paprik", "ljut"]],
  ["sargarepa", ["luk ", "luka", "beli luk", "crni luk"]],
  ["sargarepa", ["kupus", "salat", "zelen", "spanac", "blitv", "kelj"]],
  ["sargarepa", ["sargarep", "povrc", "cvekl", "tikv", "krastav"]],
  ["seme", ["orah", "lesnik", "badem", "kikiriki", "semenk", "suncokret"]],
  ["jabuka", ["voce", "voca"]],
  ["seme", ["semen", "seme "]],
  // ── kuća, bašta, imanje ──
  ["cvet", ["cvec", "cvet", "buket", "aranzman", "venac"]],
  ["klica", ["sadnic", "rasad", "presad", "bastov", "basta", "bilj"]],
  ["cepanica", ["drva", "ogrev", "pelet", "briket", "cepanj"]],
  ["traktor", ["oranj", "traktor", "kosidb", "kosenj", "tanjiranj", "setv", "zetv", "mehanizac", "baliranj"]],
  ["stala", ["kokos", "zivin", "jarc", "pilad"]],
  ["stala", ["krav", "stok", "telad", "ovc", "koz", "svinjc"]],
  ["metla", ["ciscenj", "spremanj", "usisavanj", "pranje prozor"]],
  ["metla", ["pranje ves", "peglanj", "hemijsk cisc", "perionic"]],
  ["krevet", ["smestaj", "nocenj", "prenocist", "apartman", "soba ", "sobe ", "konak"]],
  ["kuca", ["kuc", "stan ", "selidb"]],
  ["munja", ["elektricar", "elektro", "struj", "instalac"]],
  ["kap", ["vodoinstal", "cev", "slavin", "bojler", "kanalizac"]],
  ["valjak", ["moler", "krecenj", "farbanj", "fasad"]],
  ["cekic", ["stolar", "namestaj", "drvo", "tesar"]],
  ["cekic", ["zidar", "keramicar", "plocic", "gradjevin", "betonir", "krov"]],
  ["kljuc", ["popravk", "majstor", "bravar", "servis", "odrzavanj", "montaz"]],
  // ── prevoz ──
  ["guma", ["gum", "vulkan"]],
  ["bicikl", ["bicikl", "trotinet"]],
  ["kombi", ["taksi", "prevoz", "voznj", "kombi"]],
  ["auto", ["auto", "vozil", "mehanicar", "tehnick pregled", "pranje kola", "limar"]],
  // ── odeća i lične stvari ──
  ["cipela", ["obuc", "cipel", "patik", "cizm", "sandal", "obucar"]],
  ["igla", ["pletenj", "vunen", "heklan", "vez ", "goblen"]],
  ["igla", ["krojac", "sivenj", "sasiv", "skracivanj", "prepravk"]],
  ["majica", ["odec", "majic", "jakn", "pantalon", "haljin", "dzemper"]],
  ["meda", ["igrack", "beb", "pelen", "decij"]],
  ["sapun", ["sapun", "deterdzent", "higijen", "sampon"]],
  // ── znanje, kultura, tehnika ──
  ["nota", ["muzik", "gitar", "klavir", "pevanj", "harmonik", "tamburic"]],
  ["laptop", ["racunar", "kompjuter", "laptop", "softver", "sajt", "veb ", "web "]],
  ["telefon", ["telefon", "mobiln"]],
  ["foto", ["fotograf", "snimanj", "video"]],
  ["stampac", ["stampanj", "stampa", "fotokopir", "kopiranj"]],
  ["vaga", ["pravn", "advokat", "knjigovod", "racunovod", "savetovanj"]],
  ["oblacic", ["prevod", "jezik", "engleski", "nemacki", "madjarski"]],
  ["knjiga", ["knjig", "cas ", "casov", "casovi", "kurs", "obuk", "skol", "uceni", "instrukc", "radionic", "ucionic"]],
  ["ulaznica", ["pozorist", "bioskop", "koncert", "ulaznic", "predstav", "izlet", "tura "]],
];

/** Mala slova bez dijakritika, reči odvojene razmakom i sa razmakom na oba kraja. */
function normalizuj(s: string): string {
  return (
    " " +
    s
      .toLowerCase()
      .replace(/č|ć/g, "c")
      .replace(/š/g, "s")
      .replace(/ž/g, "z")
      .replace(/đ/g, "dj")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim() +
    " "
  );
}

export const IKONA_DOBRO = "poklon" as const;
export const IKONA_USLUGA = "usluga" as const;

export function ikonaVaucera(opis: string, vrsta: "DOBRO" | "USLUGA"): IkonaVaucera {
  const n = normalizuj(opis);
  for (const [ikona, reci] of RECI) {
    // Reč se traži od početka reči u opisu (ispred nje je razmak).
    if (reci.some((r) => n.includes(" " + r))) return ikona;
  }
  return vrsta === "USLUGA" ? IKONA_USLUGA : IKONA_DOBRO;
}

/** Broj grupa reči (bez opštih) — za proveru da rečnik nije slučajno skraćen. */
export const BROJ_GRUPA = RECI.length;
