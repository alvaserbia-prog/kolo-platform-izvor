/**
 * Škola maloletnog korisnika i rangiranje škola — ČISTE funkcije, bez baze.
 *
 * Osnov: Pravilnik o učešću dece (čl. 7 — škola kao podatak koji navodi sámo dete;
 * član o pregledu po školama). Plan: `docs/plan-ranglista-skola.html`.
 *
 * ─── Zašto se škola BIRA sa spiska, a ne kuca ───────────────────────────────
 *
 * Ista greška je u ovom sistemu već jednom napravljena sa mestom stanovanja: polje
 * je bilo slobodan tekst, pa je nastalo „Stanišić (Sombor)" — zapis koji ne pogađa
 * nijedno naselje iz šifarnika. Sa školama bi ishod bio gori, jer ranglista bez
 * jedinstvenog zapisa naziva ne postoji: „OŠ Vuk Karadžić", „Osnovna škola Vuk
 * Karadžić" i „vuk karadzic ns" bile bi tri škole.
 *
 * Zato je razrešavanje ovde JEDNOSTAVNIJE nego kod naselja (`naselje.ts`): tamo je
 * postojao zatečen slobodan tekst koji je trebalo tolerantno protumačiti, ovde
 * slobodnog unosa nema — pretraživač šalje ŠIFRU, a server proverava samo da li ta
 * šifra postoji. Svaka tolerancija na ovom mestu vratila bi problem koji šifarnik
 * i postoji da reši.
 *
 * ─── Zašto je ovo odvojeno od `skole-srbije.ts` ─────────────────────────────
 *
 * Tamo su samo podaci (spisak škola), ovde su pravila. Podaci se uvoze iz zvaničnog
 * izvora skriptom `scripts/uvezi-skole.mjs`; pravila piše čovek. Ovaj modul uvozi i
 * pretraživač (obrazac za izbor škole), pa u njemu ne sme biti Prisme.
 */

import type { Provera } from "./deca-pravila";
import { normalizujNaselje } from "./naselje";
import { SKOLE } from "./skole-srbije";

export type TipSkole = "OSNOVNA" | "SREDNJA";

export type Skola = {
  /**
   * Ključ po kome se škola prepoznaje — iz zvaničnog spiska.
   *
   * 🔴 NIJE naziv. Isto ime („Vuk Karadžić", „Branko Radičević") nosi preko
   * trideset škola u Srbiji, pa naziv nije jedinstven; jedinstven je tek par
   * naziv + mesto, a šifra je jeftinija i stabilnija od para.
   */
  sifra: string;
  naziv: string;
  /**
   * Mesto škole. 🔴 MORA biti kanonsko naselje iz `NASELJA_SRBIJE` — inače se dva
   * spiska tiho razilaze: škola postoji, a mesto joj ne pogađa nijedno naselje, pa
   * ne radi ni pretraga ni bilo šta što se kasnije zakači na lokaciju. Uvozna
   * skripta to proverava i odbija red koji ne prolazi.
   */
  mesto: string;
  tip: TipSkole;
  /**
   * Broj upisanih učenika — potreban ISKLJUČIVO za procentualnu listu.
   *
   * 🔴 `null` je dozvoljena i očekivana vrednost: škola bez poznatog broja učenika
   * ostaje na listi po broju dece, a u procentualnoj stoji sa crticom. Nikad se ne
   * upisuje procena — izmišljen imenilac pravi izmišljen poredak.
   */
  ucenika: number | null;
};

/** Koliko dana mora da prođe između dve promene škole (plan, odeljak 10). */
export const ROK_PROMENE_SKOLE_DANA = 30;

/** Poruka kad šifra ne postoji u spisku. Jedna, na svim mestima. */
export const PORUKA_SKOLA_SA_SPISKA = "Škola se bira sa spiska.";

// ── Šifarnik ──────────────────────────────────────────────────────────────────

// šifra → škola. Gradi se jednom, pri učitavanju modula.
const PO_SIFRI: Map<string, Skola> = new Map(SKOLE.map((s) => [s.sifra, s]));

/**
 * Škola po šifri, ili `null` ako je nema u spisku.
 *
 * Ovo je jedina provera koju server radi nad unetom školom. Namerno je stroga i
 * bez tumačenja — vidi zaglavlje modula.
 */
export function razresiSkolu(sifra: unknown): Skola | null {
  if (typeof sifra !== "string") return null;
  return PO_SIFRI.get(sifra.trim()) ?? null;
}

/** Da li spisak škola uopšte postoji (vidi `skole-srbije.ts`). */
export function skolePostoje(): boolean {
  return SKOLE.length > 0;
}

// Za pretragu: naziv i mesto svedeni na poređivi oblik. `normalizujNaselje` je
// običan normalizator teksta (mala slova, bez dijakritika, sažeti razmaci) i deli
// se namerno — dva različita normalizatora u istoj aplikaciji znače da isti unos
// pogađa naselje a promašuje školu.
const ZA_PRETRAGU: { skola: Skola; kljuc: string }[] = SKOLE.map((skola) => ({
  skola,
  kljuc: `${normalizujNaselje(skola.naziv)} ${normalizujNaselje(skola.mesto)}`,
}));

/**
 * Pretraga škola po nazivu i mestu, za padajuću listu u obrascu.
 *
 * Svaka otkucana reč mora da se pojavi negde u nazivu ili mestu — tako „vuk sombor"
 * pogađa školu „Vuk Karadžić" u Somboru, a ne svih trideset istoimenih.
 */
export function pretraziSkole(
  upit: string,
  opcije: { tip?: TipSkole; limit?: number } = {}
): Skola[] {
  const limit = opcije.limit ?? 20;
  const reci = normalizujNaselje(upit).split(" ").filter(Boolean);
  if (reci.length === 0) return [];

  const pogoci: Skola[] = [];
  for (const { skola, kljuc } of ZA_PRETRAGU) {
    if (opcije.tip && skola.tip !== opcije.tip) continue;
    if (!reci.every((r) => kljuc.includes(r))) continue;
    pogoci.push(skola);
    if (pogoci.length >= limit) break;
  }
  return pogoci;
}

// ── Rok od 30 dana ────────────────────────────────────────────────────────────

/** Trenutak od koga je sledeća promena škole dopuštena. */
export function sledecaPromenaSkole(promenjenaAt: Date): Date {
  return new Date(promenjenaAt.getTime() + ROK_PROMENE_SKOLE_DANA * 24 * 60 * 60 * 1000);
}

/**
 * Da li se škola sme promeniti (plan, odeljak 10).
 *
 * 🔴 PRVA postavka nije promena. Dete koje tek bira školu ne čeka ništa — rok počinje
 * da teče tek od prve izmene, pa je `promenjenaAt === null` uvek dopušteno.
 *
 * Rok ne štiti od zloupotrebe (mesto na listi ne nosi POEN) nego od pomeranja same
 * liste: bez njega bi jedno odeljenje moglo da „upadne" u tuđu školu na dan kad
 * neko gleda rang.
 */
export function smePromenitiSkolu(promenjenaAt: Date | null, sada: Date): Provera {
  if (!promenjenaAt) return { ok: true };
  const sledeca = sledecaPromenaSkole(promenjenaAt);
  if (sada.getTime() >= sledeca.getTime()) return { ok: true };
  return {
    ok: false,
    // Datum, ne „pokušaj kasnije" — čovek mora da zna do kada čeka.
    razlog: `Školu je moguće promeniti najviše jednom u ${ROK_PROMENE_SKOLE_DANA} dana. Sledeća promena je moguća ${sledeca.toLocaleDateString("sr-RS")}.`,
    status: 403,
  };
}

// ── Rangiranje ────────────────────────────────────────────────────────────────

/** Škola sa brojem uključene dece — ulaz u rangiranje. */
export type RedSkole = Skola & { dece: number };

/** Isto, sa izračunatim udelom. `procenat` je `null` kad broj učenika nije poznat. */
export type RedSkoleSaProcentom = RedSkole & { procenat: number | null };

/**
 * Sa liste se prikazuju SAMO škole u kojima učestvuje bar jedno dete (odluka
 * vlasnika, 2026-08-23).
 *
 * 🔴 Ovo je OBRT ranijeg pravila. Do ove izmene je na listi stajao ceo šifarnik od
 * blizu dve hiljade škola, pa je iza prvih nekoliko redova išlo hiljadu i po nula —
 * a nula je bila zamišljena kao poruka („dvadesetoro dece čeka roditelje, vidite
 * svoju nulu"). U spisku te dužine ta poruka se ne čita: ono što se vidi jeste da
 * je lista prazna svuda osim na vrhu. Lista sada pokazuje ko UČESTVUJE.
 *
 * Šta se time gubi i gde je nadoknađeno: škola bez ijednog deteta nema svoj red u
 * poretku, ali njena stranica (`/skole/[sifra]`) i dalje radi po direktnom linku i
 * prikazuje nulu, a dete koje je izabralo tu školu vidi na svojoj početnoj da škola
 * još nije na listi. Prikaz je taj koji se sužava, ne podatak.
 *
 * 🔴 Broji se dete u stanju `AKTIVNO` (vidi `USLOV_AKTIVNO_DETE`), pa škola u kojoj
 * sva deca čekaju roditelje ima nulu i ne ulazi na listu. To i jeste pritisak koji
 * mehanizam vrši: na listu se ulazi tek kad iza deteta stane odrastao član.
 */
export function samoSaDecom(redovi: RedSkole[]): RedSkole[] {
  return redovi.filter((r) => r.dece > 0);
}

/**
 * Udeo uključene dece u broju upisanih učenika, u procentima.
 *
 * Vraća `null` kad imenilac nije poznat ili nema smisla — takva škola u
 * procentualnoj listi stoji sa crticom (vidi `Skola.ucenika`).
 */
export function udeoUkljucenosti(dece: number, ucenika: number | null): number | null {
  if (ucenika === null || ucenika <= 0) return null;
  return (dece / ucenika) * 100;
}

/**
 * Poredak po broju uključene dece, opadajuće.
 *
 * Pri izjednačenom broju odlučuje naziv — poredak mora biti određen do kraja, inače
 * se lista pri svakom osvežavanju drugačije poređa i izgleda kao da se nešto menja.
 */
export function rangirajPoBroju(redovi: RedSkole[]): RedSkole[] {
  return [...redovi].sort(
    (a, b) => b.dece - a.dece || a.naziv.localeCompare(b.naziv, "sr") || a.sifra.localeCompare(b.sifra)
  );
}

/**
 * Poredak po udelu uključenosti, opadajuće.
 *
 * Škole bez poznatog broja učenika se NE rangiraju — idu na kraj, sa crticom umesto
 * procenta. Alternativa bi bila da se izostave, ali onda bi škola nestala sa jedne
 * liste a stajala na drugoj, što izgleda kao greška.
 */
export function rangirajPoProcentu(redovi: RedSkole[]): RedSkoleSaProcentom[] {
  return redovi
    .map((r) => ({ ...r, procenat: udeoUkljucenosti(r.dece, r.ucenika) }))
    .sort((a, b) => {
      if (a.procenat === null && b.procenat === null) {
        return a.naziv.localeCompare(b.naziv, "sr");
      }
      if (a.procenat === null) return 1;
      if (b.procenat === null) return -1;
      return (
        b.procenat - a.procenat ||
        b.dece - a.dece ||
        a.naziv.localeCompare(b.naziv, "sr")
      );
    });
}

/** Gde je jedna škola na već poređanoj listi, i koliko joj fali do mesta iznad. */
export type Pozicija = {
  /** Mesto na listi, počev od 1. */
  mesto: number;
  ukupnoSkola: number;
  /**
   * Koliko još dece treba da bi se preskočila škola tačno iznad.
   *
   * 🔴 `+1` nije greška: izjednačen broj ne preskače, jer poredak pri jednakosti
   * odlučuje po nazivu. Ovo je broj koji čita dete („fali vam 3"), pa mora da bude
   * tačan do jednog deteta.
   *
   * `null` kad je škola već prva.
   */
  doSledecegMesta: number | null;
};

/** Pozicija škole na listi poređanoj po broju dece. */
export function pozicijaPoBroju(poredak: RedSkole[], sifra: string): Pozicija | null {
  const i = poredak.findIndex((r) => r.sifra === sifra);
  if (i < 0) return null;
  return {
    mesto: i + 1,
    ukupnoSkola: poredak.length,
    doSledecegMesta: i === 0 ? null : poredak[i - 1].dece - poredak[i].dece + 1,
  };
}

/** Sadržaj kartice škole na dečjoj početnoj. `null` kad dete nije izabralo školu. */
export type KarticaSkole = {
  sifra: string;
  naziv: string;
  mesto: string;
  brojDece: number;
  /**
   * Mesto škole na nacionalnoj listi po broju dece.
   *
   * `null` kad škola još nije na listi — na nju ulaze samo škole sa bar jednim
   * uključenim detetom (vidi `samoSaDecom`), a dete koje čeka roditelja se ne
   * broji, pa mu škola u tom trenutku nema mesto u poretku.
   */
  mestoSkole: number | null;
  ukupnoSkola: number;
  /** Koliko dece fali do mesta iznad; `null` kad je škola prva. */
  doSledecegMesta: number | null;
  /** Mesto samog deteta unutar svoje škole; `null` ako se ne broji (čeka roditelja). */
  mojeMesto: number | null;
};
