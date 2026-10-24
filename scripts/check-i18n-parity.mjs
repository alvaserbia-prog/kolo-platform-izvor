#!/usr/bin/env node
/**
 * Provera pariteta i18n ključeva: sr.json je izvor istine; en.json, hu.json i
 * (opciono) ostali moraju imati ISTE leaf ključeve — ni manje ni više.
 * Pada (exit 1) ako neki ključ nedostaje ili je višak. Pozvati iz CI i lokalno.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGES = join(ROOT, "messages");
const IZVOR = "sr";
// sr-Cyrl nema fajl (transliteracija), ne proverava se.
// Namespace "admin" u ru.json OSTAJE srpski po odluci vlasnika; to ne remeti
// paritet jer se porede KLJUČEVI, ne vrednosti. NE dodavati izuzetke ovde —
// time bi se izgubila zaštita nad ostalim namespace-ovima.
const CILJEVI = ["en", "ru", "hr", "hu"];

function leafKeys(obj, prefix = "") {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys = keys.concat(leafKeys(v, prefix + k + "."));
    } else {
      keys.push(prefix + k);
    }
  }
  return keys;
}

function load(locale) {
  return JSON.parse(readFileSync(join(MESSAGES, `${locale}.json`), "utf8"));
}

function flat(locale) {
  const obj = load(locale);
  const out = {};
  for (const k of leafKeys(obj)) {
    out[k] = k.split(".").reduce((o, p) => o[p], obj);
  }
  return out;
}

/**
 * Vrednosti koje SMEJU biti iste kao engleske — nisu neprevedene, nego se ne
 * prevode: lična imena, nazivi brendova, oznake i puka interpunkcija. Držati
 * spisak kratkim; sve ostalo što je identično engleskom je propušten prevod.
 */
const DOZVOLJENO_ISTO_KAO_EN = new Set([
  "oSistemu.topla_voda_citat_izvor",
  "oSistemu.margaret_izvor",
  // Oznaka jedinice uz cenu na javnoj početnoj: „1.500 POEN" na srpskom, „1.500 P"
  // na ostalim jezicima. Skraćeno namerno, nije propušten prevod.
  "landing.pijaca_poen",
  // Naslovi stranica čiji se naziv ne prevodi („DPIA", „Whitepaper"); razlika
  // prema srpskom je samo separator (· naspram —), pa hu slučajno ispadne
  // identičan engleskom.
  "pravne.meta_dpia_title",
  "pravne.meta_whitepaper_title",
  // „{prvi} / {ostali} POEN" — samo parametri i jedinica, pa je mađarski isti kao engleski.
  "kakoFunkcionisePage.n9_iznos",
]);

/**
 * Namespace-ovi koji se NE prevode — postoje ISKLJUČIVO u `sr.json`, a
 * `src/i18n/request.ts` ih dodaje svakom drugom jeziku pri učitavanju poruka.
 *
 * `admin` = panel UO Fondacije: terminologija mu preslikava akte, a merodavan je
 * srpski original. Uz to akti namerno razdvajaju institute koje prevod lako slepi
 * u jednu reč (prigovor / prijava razmene / prijava oglasa / nadzorni predmet), pa
 * bi loš prevod vodio ka odluci po pogrešnom institutu.
 *
 * 🔴 Do 2026-09-13 je namespace stajao u sva četiri prevoda i tražio identičnu
 * srpsku vrednost. To se nije održavalo: bio je NAPOLA preveden (177 od 450
 * ključeva u en/ru/hu, 80 u hr), pa je isti red tabova glasio „Overview, Members,
 * … Razmene, Nabavke" — noviji ekrani su ulazili na srpskom jer ih niko ne
 * prevodi. Izostavljanjem iz prevoda razlika fizički ne može da nastane.
 */
const NEPREVEDENI_NS = ["admin"];
const jeNeprevedeni = (k) => NEPREVEDENI_NS.some((ns) => k === ns || k.startsWith(ns + "."));

// Ključevi koji se od ciljnih jezika OČEKUJU. Neprevedeni namespace nije među
// njima — u prevodu ne sme ni da postoji (proverava se zasebno, ispod).
const izvorKeys = new Set(leafKeys(load(IZVOR)).filter((k) => !jeNeprevedeni(k)));
const srV = flat(IZVOR);
const enV = flat("en");
let greske = 0;

for (const cilj of CILJEVI) {
  const ciljKeys = new Set(leafKeys(load(cilj)));
  const nedostaje = [...izvorKeys].filter((k) => !ciljKeys.has(k));
  const visak = [...ciljKeys].filter((k) => !izvorKeys.has(k));
  if (nedostaje.length || visak.length) {
    greske++;
    console.error(`\n✗ ${cilj}.json nije usklađen sa ${IZVOR}.json:`);
    if (nedostaje.length)
      console.error(`  Nedostaje (${nedostaje.length}): ${nedostaje.slice(0, 30).join(", ")}${nedostaje.length > 30 ? " …" : ""}`);
    if (visak.length)
      console.error(`  Višak (${visak.length}): ${visak.slice(0, 30).join(", ")}${visak.length > 30 ? " …" : ""}`);
  } else {
    console.log(`✓ ${cilj}.json — paritet OK (${ciljKeys.size} ključeva)`);
  }

  // Paritet ključeva NE hvata neprevedenu vrednost. Mađarski je tako godinu dana
  // vukao 893 engleske rečenice (34% fajla) uz „paritet OK" — ključ je postojao,
  // sadržaj je bio engleski. Vrednost identična engleskoj, a različita od srpske,
  // znači da je red prekopiran iz en.json i nikad preveden.
  if (cilj !== "en") {
    const ciljV = flat(cilj);
    const neprevedeno = [...ciljKeys].filter(
      (k) =>
        !DOZVOLJENO_ISTO_KAO_EN.has(k) &&
        typeof enV[k] === "string" &&
        ciljV[k] === enV[k] &&
        ciljV[k] !== srV[k],
    );
    if (neprevedeno.length) {
      greske++;
      console.error(
        `\n✗ ${cilj}.json — ${neprevedeno.length} vrednost(i) je ostalo na engleskom: ${neprevedeno.slice(0, 20).join(", ")}${neprevedeno.length > 20 ? " …" : ""}`,
      );
      console.error(`  Prevedi ih, ili dodaj u DOZVOLJENO_ISTO_KAO_EN ako se namerno ne prevode (imena, brendovi).`);
    }
  }

  // Obrnut smer: namespace koji se ne prevodi ne sme ni da POSTOJI u prevodu.
  // Ranije se tražila identična srpska vrednost; time je ista rečenica živela pet
  // puta i razilazila se pri svakoj zameni. Sada je nema — `request.ts` je dodaje.
  const visakNS = [...ciljKeys].filter(jeNeprevedeni);
  if (visakNS.length) {
    greske++;
    console.error(
      `\n✗ ${cilj}.json — ${visakNS.length} ključ(eva) iz [${NEPREVEDENI_NS.join(", ")}] ne sme da postoji u prevodu: ${visakNS.slice(0, 20).join(", ")}${visakNS.length > 20 ? " …" : ""}`,
    );
    console.error(`  Obriši ih — taj namespace živi samo u ${IZVOR}.json, a dodaje ga src/i18n/request.ts.`);
  }
}

if (greske) {
  console.error(`\n${greske} jezik(a) nije usklađeno. Dopuni/ukloni ključeve.`);
  process.exit(1);
}
console.log("\nSvi jezici usklađeni sa izvorom.");
