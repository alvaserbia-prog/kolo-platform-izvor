// Generator za src/lib/naselja-koordinate.ts — koordinate POJEDINAČNIH naselja.
//
// Ulazi (GeoNames, https://www.geonames.org, licenca CC BY 4.0):
//   1. places dump za Srbiju — format "geonames dump" (kolone: geonameid, name,
//      asciiname, alternatenames, lat, lng, ..., country=RS). Dovoljan je i
//      podskup cities500 (mesta > 500 stanovnika).
//   2. postal dump za Srbiju — format "geonames zip" (kolone: country=RS,
//      postal_code, place_name, ..., lat[9], lng[10], accuracy). Pokriva
//      praktično svako naselje sa poštom.
//
// Pokretanje:
//   npx tsx scripts/generisi-naselja-koordinate.ts <places.txt> <postal.txt>
//
// Uparivanje: za svako naselje iz NASELJE_OPSTINA traže se svi kandidati sa
// istim normalizovanim imenom u oba izvora; bira se kandidat NAJBLIŽI centru
// opštine kojoj naselje pripada (razrešava istoimena naselja u različitim
// opštinama), a odbacuje se ako je dalji od MAX_UDALJENOST_KM (zaštita od
// pogrešnog uparivanja). Naselja bez kandidata se preskaču — runtime pada
// nazad na centar opštine (vidi src/lib/udaljenost.ts).

import * as fs from "fs";
import * as path from "path";
import { NASELJE_OPSTINA, OPSTINA_KOORDINATE } from "../src/lib/naselja-geo";

const MAX_UDALJENOST_KM = 60;

function normalizuj(s: string): string {
  return s
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[š]/g, "s")
    .replace(/[ž]/g, "z")
    .replace(/[đ]/g, "d")
    .trim();
}

function udaljenostKm(a: readonly [number, number], b: readonly [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la = (a[0] * Math.PI) / 180;
  const lb = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const [placesPath, postalPath] = process.argv.slice(2);
if (!placesPath || !postalPath) {
  console.error("Upotreba: npx tsx scripts/generisi-naselja-koordinate.ts <places.txt> <postal.txt>");
  process.exit(1);
}

// ime (normalizovano) → lista kandidata [lat, lng]
const kandidati = new Map<string, [number, number][]>();
function dodajKandidata(ime: string, lat: number, lng: number) {
  const n = normalizuj(ime);
  if (!n || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const lista = kandidati.get(n) ?? [];
  // Duplikati na istoj tački (postal + places za isto mesto) ne smetaju izboru.
  lista.push([lat, lng]);
  kandidati.set(n, lista);
}

// Places dump: 1=name, 2=asciiname, 3=alternatenames (zarez), 4=lat, 5=lng, 8=country
for (const linija of fs.readFileSync(placesPath, "utf8").split("\n")) {
  const k = linija.split("\t");
  if (k.length < 9 || k[8] !== "RS") continue;
  const lat = Number(k[4]), lng = Number(k[5]);
  for (const ime of [k[1], k[2], ...(k[3] ?? "").split(",")]) dodajKandidata(ime, lat, lng);
}

// Postal dump: 0=country, 2=place_name, 9=lat, 10=lng
for (const linija of fs.readFileSync(postalPath, "utf8").split("\n")) {
  const k = linija.split("\t");
  if (k.length < 11 || k[0] !== "RS") continue;
  dodajKandidata(k[2], Number(k[9]), Number(k[10]));
}

const opstineNorm = new Map<string, string>(
  Object.keys(OPSTINA_KOORDINATE).map((o) => [normalizuj(o), o])
);

const rezultat: [string, [number, number]][] = [];
let bezKandidata = 0, odbacenoDaleko = 0, preskocenoSudar = 0;

for (const [naselje, opstina] of Object.entries(NASELJE_OPSTINA)) {
  const centarOpstine = OPSTINA_KOORDINATE[opstina];
  if (!centarOpstine) continue;
  const n = normalizuj(naselje);

  // Ime naselja jednako imenu DRUGE opštine (npr. selo Bela Crkva u Krupnju
  // vs opština Bela Crkva) ne sme da pregazi lookup te opštine u INDEKS-u.
  const istoimenaOpstina = opstineNorm.get(n);
  if (istoimenaOpstina && istoimenaOpstina !== opstina) { preskocenoSudar++; continue; }

  const lista = kandidati.get(n);
  if (!lista || lista.length === 0) { bezKandidata++; continue; }

  let najbolji: [number, number] | null = null;
  let najboljaDist = Infinity;
  for (const koord of lista) {
    const d = udaljenostKm(centarOpstine, koord);
    if (d < najboljaDist) { najboljaDist = d; najbolji = koord; }
  }
  if (!najbolji || najboljaDist > MAX_UDALJENOST_KM) { odbacenoDaleko++; continue; }
  rezultat.push([naselje, [Number(najbolji[0].toFixed(4)), Number(najbolji[1].toFixed(4))]]);
}

rezultat.sort((a, b) => a[0].localeCompare(b[0], "sr"));

const izlaz = `// GENERISANO skriptom scripts/generisi-naselja-koordinate.ts — ne uređivati ručno.
// Koordinate POJEDINAČNIH naselja (izvor: GeoNames places + postal dump, CC BY 4.0).
// Pokriva ${rezultat.length}/${Object.keys(NASELJE_OPSTINA).length} naselja iz naselja-geo.ts; ostala
// padaju nazad na centar opštine (vidi src/lib/udaljenost.ts).

export const NASELJE_KOORDINATE: Record<string, readonly [number, number]> = {
${rezultat.map(([ime, [lat, lng]]) => `  ${JSON.stringify(ime)}: [${lat}, ${lng}],`).join("\n")}
};
`;

const izlazPath = path.join(__dirname, "..", "src", "lib", "naselja-koordinate.ts");
fs.writeFileSync(izlazPath, izlaz);
console.log(`Upisano ${rezultat.length} naselja u ${izlazPath}`);
console.log(`Bez kandidata (fallback na opštinu): ${bezKandidata}; odbačeno >${MAX_UDALJENOST_KM} km: ${odbacenoDaleko}; sudar sa imenom opštine: ${preskocenoSudar}`);
