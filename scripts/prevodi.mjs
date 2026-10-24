#!/usr/bin/env node
/**
 * DUG PREVODA — meri koliko je srpski original odmakao od prevoda.
 *
 * PRAVILO RADA (odluka vlasnika, 2026-09-13): tokom rada se menja ISKLJUČIVO
 * srpski original — `messages/sr.json` i `src/lib/faq-data.ts`. Prevodi na
 * en/ru/hr/hu rade se NA KRAJU, pre objave na ekolo.rs.
 *
 * 🔴 AKTI SU IZUZETI (odluka vlasnika, 2026-09-13) i ovde se NE mere. Akt se ne
 * menja usput: menja se namernim potezom, a bump ionako dodiruje pet imena
 * fajlova, mapu u `pravilnik/[slug]`, verzijske labele u `messages` i spisak
 * `AKTI` u testu — prevod je tu najmanji deo istog poteza, ne zaseban posao.
 * Uz to bi polovičan bump (sr na novoj šifri, prevod na staroj) značio da
 * `ucitajPravniDokument` TIHO servira srpski tekst engleskom čitaocu — kvar koji
 * se već desio (hr i hu do 4.1.0). Branu nosi `pravni-dokumenti.test.ts`, koji
 * `fs.access`-om traži da svaki akt fizički postoji na svih pet jezika; to je
 * apsolutna provera i jača je od diferencijalnog duga.
 *
 * Ova skripta je brana tog pravila. Bez nje se razlaz ne vidi: paritet KLJUČEVA
 * prolazi i kad je vrednost zastarela, pa prevod tiho govori nešto drugo nego
 * original. Zatečeno stanje pri uvođenju: 204 ključa u en/ru/hu nose tekst od
 * pre izmena na `main`.
 *
 * DVA MODA:
 *   rad     (podrazumevano) — ispiše dug i PROĐE. Svakodnevni rad na `main`.
 *   objava  (`--objava`)    — dug > 0 obara komandu. Pokreće se PRE merge-a
 *                             `main` → `production` („objavi na ekolo.rs").
 *
 * Meri se RAZLIKA prema osnovi (podrazumevano `origin/production`), ne apsolutno
 * stanje: ključ je nov, ili je srpska vrednost izmenjena a prevod ostao isti kao
 * na osnovi. Time se dug tekućeg rada ne meša sa zatečenim stanjem.
 *
 * Kad izmena srpskog NE traži izmenu prevoda (ispravljena interpunkcija, reč koja
 * se ionako ne prevodi), stavka se posle pregleda upisuje u `prevodi-provereno.json`
 * kroz `npm run prevodi:potvrdi`. Pamti se HEŠ srpske vrednosti — čim se srpski
 * ponovo promeni, stavka se sama vraća u dug.
 *
 * Za apsolutno stanje (paritet ključeva, vrednosti ostale na engleskom, `admin`
 * namespace koji se NE prevodi) postoji zaseban alat: `npm run i18n:check`.
 * Dve provere, dve svrhe — ne spajati ih.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const IZVOR = "sr";
const CILJEVI = ["en", "ru", "hr", "hu"];
// Namespace koji se NE prevodi (vidi `check-i18n-parity.mjs` i `src/i18n/request.ts`).
// Ne ulazi u dug — inače bi svaka izmena admin panela tražila prevod koji po
// pravilu ne sme da postoji, pa bi objava stajala na poslu koji se ne radi.
const NEPREVEDENI_NS = ["admin"];
const jeNeprevedeni = (k) => NEPREVEDENI_NS.some((ns) => k === ns || k.startsWith(ns + "."));
const PROVERENO = join(ROOT, "scripts", "prevodi-provereno.json");

const argv = process.argv.slice(2);
const osnovaArg = argv.find((a) => a.startsWith("--osnova="));
const OSNOVA = osnovaArg ? osnovaArg.split("=")[1] : "origin/production";
const potvrdi = argv.includes("--potvrdi");
// `--auto` bira mod po okruženju: production build je strog, sve ostalo izveštava.
const strogo =
  !potvrdi &&
  (argv.includes("--objava") || (argv.includes("--auto") && process.env.VERCEL_ENV === "production"));

const git = (args, tiho = false) =>
  execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: tiho ? ["ignore", "pipe", "ignore"] : undefined,
  });

const hes = (v) => createHash("sha1").update(String(v)).digest("hex").slice(0, 12);

function izOsnove(putanja) {
  try {
    return git(["show", `${OSNOVA}:${putanja}`], true);
  } catch {
    return null; // fajl ne postoji na osnovi — nov je
  }
}

function citaj(putanja) {
  const p = join(ROOT, putanja);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

function leafKeys(obj, prefix = "") {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object" && !Array.isArray(v)) keys = keys.concat(leafKeys(v, prefix + k + "."));
    else keys.push(prefix + k);
  }
  return keys;
}

function flat(tekst) {
  if (tekst == null) return null;
  const obj = JSON.parse(tekst);
  const out = {};
  for (const k of leafKeys(obj)) out[k] = k.split(".").reduce((o, p) => o[p], obj);
  return out;
}

try {
  git(["rev-parse", "--verify", "--quiet", `${OSNOVA}^{commit}`], true);
} catch {
  console.error(`✗ Osnova "${OSNOVA}" nije dostupna u ovom klonu.`);
  console.error(`  Pokreni: git fetch origin production   (ili --osnova=<ref>)`);
  process.exit(strogo ? 1 : 0);
}

const provereno = existsSync(PROVERENO) ? JSON.parse(readFileSync(PROVERENO, "utf8")).stavke ?? {} : {};
const jePotvrdjeno = (id, vrednost) => provereno[id] === hes(vrednost);

const dug = []; // { id, izvor, jezik, opis, kljuc, hesSrpskog }

// --- 1. messages/*.json ---------------------------------------------------
const srSad = flat(citaj(`messages/${IZVOR}.json`));
const srOsn = flat(izOsnove(`messages/${IZVOR}.json`)) ?? {};
const srKljucevi = Object.keys(srSad).filter((k) => !jeNeprevedeni(k));
const dirnuti = srKljucevi.filter((k) => srSad[k] !== srOsn[k]);

for (const jezik of CILJEVI) {
  const ciljSad = flat(citaj(`messages/${jezik}.json`)) ?? {};
  const ciljOsn = flat(izOsnove(`messages/${jezik}.json`)) ?? {};
  for (const k of srKljucevi) {
    const nema = !(k in ciljSad);
    // Zastareo = srpski dirnut, a prevod ostao identičan onome na osnovi (dakle
    // nije prošao kroz prevođenje). Ključ koji tek treba da nastane hvata `nema`.
    const zastareo =
      !nema && k in ciljOsn && ciljSad[k] === ciljOsn[k] && srSad[k] !== srOsn[k] && typeof srSad[k] === "string";
    if (!nema && !zastareo) continue;
    const id = `${jezik}|${k}`;
    if (jePotvrdjeno(id, srSad[k])) continue;
    dug.push({
      id,
      izvor: `messages/${jezik}.json`,
      opis: nema ? "ključ ne postoji u prevodu" : "srpski izmenjen, prevod nije",
      kljuc: k,
      hes: hes(srSad[k]),
    });
  }
}

// --- 2. FAQ ---------------------------------------------------------------
// FAQ živi u .ts fajlovima. Poredi se PO PITANJU i po naslovu odeljka, ne ceo
// fajl: do 23.10.2026 je bilo koja izmena prevoda (npr. samo novi raspored koji
// traži `__tests__/faq-paritet.test.ts`) brisala dug za ceo FAQ tog jezika.
// Pitanje je dug kad je srpsko izmenjeno, a prevod istog broja ostao kakav je bio
// na osnovi (ili ne postoji). Blok koji nosi oznaku „PREVOD: privremeno“ (složen
// iz zatečenih pasusa da bi raspored bio isti) je dug dok se oznaka ne skine.
const OZNAKA_PRIVREMENO = "PREVOD: privremeno";
function faqMapa(tekst) {
  const pitanja = new Map();
  const sekcije = new Map();
  if (tekst == null) return { pitanja, sekcije };
  for (const m of tekst.matchAll(/^ {8}id: (\d+),\n((?: {8}(?:\/\/|link:).*\n)*) {8}pitanje: `((?:\\`|[^`])*)`,\n {8}odgovor: `((?:\\`|[^`])*)`,/gm)) {
    pitanja.set(m[1], { tekst: `${m[3]}\u0000${m[4]}`, privremeno: m[2].includes(OZNAKA_PRIVREMENO) });
  }
  for (const m of tekst.matchAll(/^ {4}id: "([^"]+)",\n {4}naslov: "(.*)",$/gm)) sekcije.set(m[1], m[2]);
  return { pitanja, sekcije };
}
const faqSrSad = faqMapa(citaj("src/lib/faq-data.ts"));
const faqSrOsn = faqMapa(izOsnove("src/lib/faq-data.ts"));
for (const jezik of CILJEVI) {
  const fajl = `src/lib/faq-data-${jezik}.ts`;
  const sad = faqMapa(citaj(fajl));
  const osn = faqMapa(izOsnove(fajl));
  const stavke = [
    ...[...faqSrSad.pitanja].map(([broj, sr]) => {
      const cilj = sad.pitanja.get(broj);
      const zastareo = sr.tekst !== faqSrOsn.pitanja.get(broj)?.tekst && cilj?.tekst === osn.pitanja.get(broj)?.tekst;
      return { kljuc: `#${broj}`, sr: sr.tekst, dug: !cilj || cilj.privremeno || zastareo };
    }),
    ...[...faqSrSad.sekcije].map(([sid, naslov]) => {
      const cilj = sad.sekcije.get(sid);
      const zastareo = naslov !== faqSrOsn.sekcije.get(sid) && cilj === osn.sekcije.get(sid);
      return { kljuc: `odeljak ${sid}`, sr: naslov, dug: cilj == null || zastareo };
    }),
  ];
  for (const s of stavke) {
    if (!s.dug) continue;
    const id = `${jezik}|faq|${s.kljuc}`;
    if (jePotvrdjeno(id, s.sr)) continue;
    dug.push({ id, izvor: fajl, opis: "FAQ: srpski izmenjen, prevod nije", kljuc: s.kljuc, hes: hes(s.sr) });
  }
}

// --- potvrda --------------------------------------------------------------
if (potvrdi) {
  const nove = Object.fromEntries(dug.map((d) => [d.id, d.hes]));
  writeFileSync(
    PROVERENO,
    JSON.stringify(
      {
        _opis:
          "Stavke pregledane pri prevođenju kojima prevod NE treba menjati. Vrednost je heš srpskog teksta — čim se srpski ponovo promeni, stavka se sama vraća u dug. Upisuje `npm run prevodi:potvrdi`; upisati TEK pošto je spisak stvarno pregledan.",
        stavke: { ...provereno, ...nove },
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`✓ Upisano u scripts/prevodi-provereno.json: ${Object.keys(nove).length} stavki (ukupno ${Object.keys({ ...provereno, ...nove }).length}).`);
  process.exit(0);
}

// --- ispis ----------------------------------------------------------------
console.log(`\nDug prevoda — poređenje sa "${OSNOVA}" (mod: ${strogo ? "OBJAVA" : "rad"})\n`);

if (!dug.length) {
  console.log("✓ Nema duga — prevodi prate srpski original.");
  process.exit(0);
}

const grupe = new Map();
for (const d of dug) {
  const g = `${d.izvor} — ${d.opis}`;
  if (!grupe.has(g)) grupe.set(g, []);
  grupe.get(g).push(d.kljuc);
}
for (const [g, lista] of grupe) {
  console.log(`✗ ${g} (${lista.length}):`);
  console.log(`    ${lista.slice(0, 20).join(", ")}${lista.length > 20 ? ` … +${lista.length - 20}` : ""}\n`);
}
console.log(`Ukupno stavki za prevod: ${dug.length}`);

if (strogo) {
  console.error(`\n✗ OBJAVA ZAUSTAVLJENA — prevodi se rade PRE merge-a \`main\` → \`production\`.`);
  console.error(`  Kad izmena srpskog ne traži izmenu prevoda: pregledaj pa \`npm run prevodi:potvrdi\`.`);
  process.exit(1);
}
console.log(`\nRadni mod — prolazi. Pre objave na ekolo.rs pokrenuti \`npm run prevodi:objava\`.`);
