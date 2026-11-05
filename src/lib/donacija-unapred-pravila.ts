/**
 * Uplata sa računa, potvrda o uplati i donacija unapred — čista pravila, bez Prisme
 * (Pravilnik o pokroviteljstvu i donacijama čl. 3, 4, 6 i 20; Pravilnik o KOLO sistemu
 * čl. 17 st. 2 t. 10, čl. 36, 37; set 5.0.9). Uvozi ih i pretraživač (dugmad za iznos).
 *
 * 🔴 Tabele se ne prepisuju u ekrane (CLAUDE.md pravilo 10): iznosi, prag i rokovi se
 * čitaju odavde.
 */

/** Najmanji iznos jedne donacije (donacije čl. 3 st. 1). */
export const MIN_DONACIJA_RSD = 1_000;

/** Ponuđeni iznosi na stranici „Doniraj" (uz „Drugi iznos"). Nisu nivoi i ne nose POEN. */
export const PONUDJENI_IZNOSI_RSD = [1_000, 2_000, 5_000, 10_000, 20_000, 50_000] as const;

/**
 * Donacija unapred otvara se donatoru kome je Fondacija već utvrdila prijem javnih
 * donacija u ukupnom iznosu od najmanje ovoliko (čl. 6 st. 5). Pošto je to i najmanja
 * donacija, prag ispunjava već prva utvrđena donacija — unapred ide tek od druge.
 */
export const PRAG_DONACIJE_UNAPRED_RSD = 1_000;

/** Najviše jedna donacija unapred u obračunskom periodu (čl. 6 st. 5). */
export const DONACIJA_UNAPRED_PO_PERIODU = 1;

/** Fondacija prijem donacije unapred proverava u ovom roku, i vikendom (čl. 6 st. 6). */
export const ROK_PROVERE_SATI = 24;

/** Ograničenje primljenog iznosa traje najduže ovoliko (čl. 6 st. 7; Pravilnik čl. 36 st. 6). */
export const ROK_OGRANICENJA_DANA = 7;

/** Najveća potvrda o uplati koja se prima (posle smanjenja slike u pretraživaču). */
export const MAX_POTVRDA_BAJTOVA = 5 * 1024 * 1024;
export const DOZVOLJENI_TIPOVI_POTVRDE = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

/** Da li donator sme da evidentira donaciju unapred (čl. 6 st. 5). Anonimna nikad. */
export function smeUnapred(p: {
  javno: boolean;
  /** Zbir javnih donacija čiji je prijem Fondacija utvrdila (CONFIRMED). */
  utvrdjenoUkupnoRSD: number;
  /** Koliko je donacija unapred već evidentirano u tekućem obračunskom periodu. */
  unapredUPeriodu: number;
}): boolean {
  if (!p.javno) return false;
  if (p.utvrdjenoUkupnoRSD < PRAG_DONACIJE_UNAPRED_RSD) return false;
  return p.unapredUPeriodu < DONACIJA_UNAPRED_PO_PERIODU;
}

/** Rok do koga Fondacija treba da proveri donaciju unapred (prikaz u admin redu). */
export function rokProvere(evidentiranoAt: Date): Date {
  return new Date(evidentiranoAt.getTime() + ROK_PROVERE_SATI * 3600_000);
}

/** Rok ograničenja primljenog iznosa. */
export function rokOgranicenja(od: Date): Date {
  return new Date(od.getTime() + ROK_OGRANICENJA_DANA * 24 * 3600_000);
}

/**
 * Koliko se ograničava u zapisu primaoca (čl. 6 st. 7): ono što je od donatora primio,
 * najviše do stanja zapisa. Negativan zapis se ne ograničava (nema šta).
 */
export function iznosOgranicenja(primljeno: number, stanje: number): number {
  return Math.max(0, Math.min(primljeno, stanje));
}

/** Ograničenje važi dok je aktivno i rok nije prošao — i bez upisa PRESTALO. */
export function ogranicenjeVazi(o: { status: string; rokDo: Date }, sada = new Date()): boolean {
  return o.status === "AKTIVNO" && o.rokDo.getTime() > sada.getTime();
}

// ─── Čitanje potvrde o uplati (čl. 6 st. 4) ─────────────────────────────────

export type OcekivanoUplata = {
  iznosRSD: number;
  /** Račun Fondacije, 18 cifara. */
  racun: string;
  /** Poziv na broj BEZ modela (kontrola + osnova). */
  pozivNaBroj: string;
  /** Ime i prezime iz evidencije identiteta (ili sa profila), za poređenje sa platiocem. */
  imeDonatora: string | null;
  /** Najranije prihvatljiv datum uplate (pravljenje QR koda / najave). */
  najranije: Date;
};

export type ProcitanaPotvrda = {
  iznosRSD: number | null;
  datum: Date | null;
  racun: string | null;
  pozivNaBroj: string | null;
  platilac: string | null;
};

export type IshodCitanja =
  | { ok: true; procitano: ProcitanaPotvrda; platilacSePoklapa: boolean }
  | { ok: false; razlog: "NECITLJIVO" | "IZNOS" | "RACUN" | "POZIV" | "DATUM"; procitano: ProcitanaPotvrda };

function samoCifre(s: string): string {
  return s.replace(/\D/g, "");
}

/** Mala slova, bez dijakritike — da se „Petrović" i „PETROVIC" poklope. */
export function normalizujTekst(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Svi iznosi u tekstu kao brojevi (1.000,00 · 1000,00 · 1,000.00 · 1 000,00 · 1000). */
export function iznosiUTekstu(tekst: string): number[] {
  const nadjeni: number[] = [];
  const re = /\d{1,3}(?:[.\s ]\d{3})+(?:,\d{2})?|\d{1,3}(?:,\d{3})+(?:\.\d{2})?|\d+(?:[.,]\d{2})?/g;
  for (const m of tekst.match(re) ?? []) {
    let s = m.replace(/[\s ]/g, "");
    if (/,\d{2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
    else if (/\.\d{2}$/.test(s) && s.includes(",")) s = s.replace(/,/g, "");
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, "");
    const n = Number(s);
    if (Number.isFinite(n)) nadjeni.push(n);
  }
  return nadjeni;
}

/** Datumi u tekstu (dd.mm.yyyy, dd/mm/yyyy, yyyy-mm-dd). */
export function datumiUTekstu(tekst: string): Date[] {
  const out: Date[] = [];
  for (const m of tekst.matchAll(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/g)) {
    const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
    if (!Number.isNaN(d.getTime()) && d.getUTCDate() === Number(m[1])) out.push(d);
  }
  for (const m of tekst.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    if (!Number.isNaN(d.getTime())) out.push(d);
  }
  return out;
}

/**
 * Upoređuje tekst pročitan sa potvrde sa onim što donacija očekuje. Ne izvlači podatke
 * „naslepo": traži tačno očekivane vrednosti (račun, poziv na broj, iznos), pa je
 * otporno na raspored koji svaka banka ima drugačiji.
 *
 * 🔴 Ovo je samo uslov da se potvrda PRIHVATI. Prijem i dalje utvrđuje Fondacija
 * iz izvoda (čl. 6 st. 3) — potvrda nije utvrđenje prijema.
 */
export function uporediPotvrdu(tekst: string, ocekivano: OcekivanoUplata, sada = new Date()): IshodCitanja {
  const procitano: ProcitanaPotvrda = { iznosRSD: null, datum: null, racun: null, pozivNaBroj: null, platilac: null };
  const t = tekst ?? "";
  if (t.replace(/\s/g, "").length < 20) return { ok: false, razlog: "NECITLJIVO", procitano };

  const cifre = samoCifre(t);
  // Račun: 18 cifara, sa crticama ili bez (325-9500700238011-82).
  if (cifre.includes(ocekivano.racun)) procitano.racun = ocekivano.racun;
  // Poziv na broj: kontrola + osnova, sa ili bez modela 97 ispred, sa razmacima ili crticama.
  const poziv = samoCifre(ocekivano.pozivNaBroj);
  if (poziv && cifre.includes(poziv)) procitano.pozivNaBroj = poziv;
  // Iznos: mora se pojaviti tačno (na pare).
  if (iznosiUTekstu(t).some((n) => Math.abs(n - ocekivano.iznosRSD) < 0.005)) procitano.iznosRSD = ocekivano.iznosRSD;
  // Datum: najbliži „sada" koji nije pre najave (dan ranije, zbog vremenskih zona) ni posle sutra.
  const od = ocekivano.najranije.getTime() - 24 * 3600_000;
  const doD = sada.getTime() + 24 * 3600_000;
  const datumi = datumiUTekstu(t).filter((d) => d.getTime() >= od && d.getTime() <= doD);
  if (datumi.length) procitano.datum = datumi.sort((a, b) => b.getTime() - a.getTime())[0];
  // Platilac: sve reči imena donatora moraju biti u tekstu potvrde.
  let platilacSePoklapa = false;
  if (ocekivano.imeDonatora) {
    const reci = normalizujTekst(ocekivano.imeDonatora).split(/\s+/).filter((r) => r.length >= 2);
    const nt = normalizujTekst(t);
    platilacSePoklapa = reci.length >= 2 && reci.every((r) => nt.includes(r));
    if (platilacSePoklapa) procitano.platilac = ocekivano.imeDonatora;
  }

  if (!procitano.racun) return { ok: false, razlog: "RACUN", procitano };
  if (!procitano.pozivNaBroj) return { ok: false, razlog: "POZIV", procitano };
  if (procitano.iznosRSD === null) return { ok: false, razlog: "IZNOS", procitano };
  if (!procitano.datum) return { ok: false, razlog: "DATUM", procitano };
  return { ok: true, procitano, platilacSePoklapa };
}
