import { NextRequest, NextResponse, after } from "next/server";
import { greska } from "@/lib/greska-api";
import { izvrsiNocnuEmisiju } from "@/lib/protokol/programi";
import { izvrsiZrnoOperacije } from "@/lib/protokol/zrno";
import { proveriIAktivirajFazu2 } from "@/lib/protokol/faza-sistema";
import { azurirajStalnuPonudu, zapisiDnevniSnimak } from "@/lib/protokol/pokazatelji";
import { proveriIEvidentirajKorak } from "@/lib/protokol/osnivacki";
import { jePonocUSrbiji } from "@/lib/protokol/obracunski-dan";
import { evidentirajZabelezenoPokroviteljstvo } from "@/lib/protokol/pokrovitelj";
import { evidentirajZabelezenoPokroviteljstvoDobrima } from "@/lib/protokol/pokroviteljstvo-dobrima";
import { evidentirajZabelezenoPartnerstvo } from "@/lib/protokol/partnerstvo";
import { zatvoriIstekla } from "@/lib/protokol/donacija-unapred";
import { evidentirajZabelezenoLanac } from "@/lib/protokol/lanac";
import { pokreniNocniNiz, osnovaNiza } from "@/lib/nocni-niz";

// GET /api/cron/nocna-emisija — Vercel Cron (Authorization: Bearer), zakazan u
// 22:00 i 23:00 UTC (drugi termin kroz /api/cron/nocna-emisija/zima). Radi samo
// termin koji pada u ponoć po srpskom vremenu (Pravilnik čl. 26), drugi preskače.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }
  const datum = new Date();
  if (!jePonocUSrbiji(datum)) {
    return NextResponse.json({ ok: true, preskoceno: "nije ponoć po srpskom vremenu" });
  }
  const odgovor = await nocniObracun(datum, { osnivacki: true });
  // Ponoćni niz (odluka vlasnika 11.11.2026): posle zatvaranja perioda ostali poslovi
  // obračunskog dana idu REDOM, svaki kao zaseban poziv (`nocni-niz-pravila.ts`).
  // Pokreće se i kad obračun vrati grešku — koraci su nezavisni i idempotentni.
  after(() => pokreniNocniNiz(osnovaNiza(req.url)));
  return odgovor;
}

// POST /api/cron/nocna-emisija — manuelni poziv (x-cron-secret), bez provere sata.
// Dvostruki prolaz istog dana sprečava brava dana u `izvrsiNocnuEmisiju`.
// 🔴 Osnivački korak se ovde PRESKAČE: proverava se samo na kraju obračunskog perioda
// (Pravilnik o osnivačkom doprinosu čl. 6 st. 2–3), a ručni poziv može pasti usred
// perioda. Preskočeni prag uhvatiće naredni noćni obračun (GET), koji pali sve
// dostignute korake.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }
  return await nocniObracun(new Date(), { osnivacki: false });
}

async function nocniObracun(datum: Date, opcije: { osnivacki: boolean }) {
  try {
    // 1. ZRNO operacije, pa emisije programa — SEKVENCIJALNO (set 5.0.3).
    // 🔴 Nisu nezavisne: u periodu u kome je primaocu podrške izvršen upis ZRNA dnevni
    // iznos programa se ne evidentira (Pravilnik čl. 22 st. 6), pa emisija programa čita
    // upise koje je ovaj prolaz upravo izvršio. Ne vraćati `Promise.all`.
    const zrno = await izvrsiZrnoOperacije(datum);
    const programi = await izvrsiNocnuEmisiju(datum);

    // 2. Osnivački doprinos (čl. 6 st. 3 Pravilnika o osnivačkom doprinosu). Sekvencijalno,
    // nakon emisija, pre Faze 2 — POEN osnivačkog doprinosa ulazi u kumulativni rast
    // (čl. 6 st. 4). Izolovano: greška ovde ne sme da blokira proveru Faze 2.
    //
    // Evidentira sam, bez ljudske potvrde. Ako je opticaj preskočio više pragova
    // odjednom (velika bulk emisija), `proveriIEvidentirajKorak` pali korake
    // uzastopno dok ne nadoknadi sve preskočene.
    let osnivacki: unknown = null;
    if (!opcije.osnivacki) {
      osnivacki = { preskoceno: "ručni poziv — osnivački korak samo na kraju obračunskog perioda" };
    } else {
      try {
        osnivacki = await proveriIEvidentirajKorak();
      } catch (e) {
        console.error("[CRON] Greška pri osnivačkom doprinosu:", e);
        osnivacki = { error: String(e) };
      }
    }

    // 2a. Set 5.0.9: zabeleženo novčano pokroviteljstvo (od seta 5.1.2 i dobrima i uslugama)
    // evidentira se u narednom obračunskom periodu (Pravilnik čl. 37 st. 1–2), i to samo na
    // stvarnom kraju perioda;
    // pre provere Faze 2, jer ulazi u ukupan broj. Uz to prestaju istekla ograničenja
    // primljenog iznosa (donacije čl. 6 st. 7). Izolovano: ne sme da obori obračun.
    let pokroviteljstvo: unknown = null;
    if (opcije.osnivacki) {
      try {
        pokroviteljstvo = {
          evidentirano: await evidentirajZabelezenoPokroviteljstvo(),
          // Set 5.1.2 (donacije čl. 33 st. 1): i pokroviteljstvo dobrima i uslugama.
          evidentiranoDobra: await evidentirajZabelezenoPokroviteljstvoDobrima(),
          // Set 5.1.2 (donacije čl. 43 st. 1, Pravilnik čl. 37 st. 5): i potvrđeno izvršenje partnerstva.
          evidentiranoPartnerstvo: await evidentirajZabelezenoPartnerstvo(),
          // Set 5.1.2 (nabavke čl. 51 st. 1): beležen doprinos u lancu proizvodnje i distribucije.
          evidentiranoLanac: await evidentirajZabelezenoLanac(),
          ogranicenjaPrestala: await zatvoriIstekla(),
        };
      } catch (e) {
        console.error("[CRON] Greška pri zabeleženom pokroviteljstvu:", e);
        pokroviteljstvo = { error: String(e) };
      }
    }

    // 3. Provera praga Faze 2 (Pravilnik čl. 41) — sekvencijalno, nakon emisija
    // jer obračun zavisi od konačnog stanja Protokola za obračunski period.
    const faza = await proveriIAktivirajFazu2();

    // 4. Pokazatelji zdravlja i koncentracije (`/sistem/zdravlje`): stanje stalne
    // ponude gazdinstava i dnevni snimak. Posle svega, jer mere konačno stanje
    // perioda; izolovano — pokazatelj nema dejstvo i ne sme da obori obračun.
    let pokazatelji: unknown = null;
    try {
      const ponuda = await azurirajStalnuPonudu();
      const snimljeno = await zapisiDnevniSnimak(datum);
      pokazatelji = { ponuda, snimljeno };
    } catch (e) {
      console.error("[CRON] Greška pri pokazateljima:", e);
      pokazatelji = { error: String(e) };
    }

    return NextResponse.json({ ok: true, programi, zrno, osnivacki, pokroviteljstvo, faza, pokazatelji });
  } catch (err) {
    console.error("[CRON] Greška pri nocnoj emisiji:", err);
    return await greska("Greška pri izvršavanju emisije.", 500);
  }
}
