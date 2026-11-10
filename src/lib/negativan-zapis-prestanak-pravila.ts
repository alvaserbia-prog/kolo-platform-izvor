/**
 * Negativan zapis pri prestanku statusa — čista pravila (Pravilnik o KOLO sistemu
 * čl. 17 st. 2 t. 12 i čl. 33 st. 7; Uslovi korišćenja čl. 33 st. 3; Politika
 * privatnosti čl. 42 st. 7; Registar radnji obrade br. 29; set 5.1.2). Bez Prisme.
 *
 * 🔴 Red se čuva SAMO kad je zapis u trenutku prestanka statusa negativan, i samo
 * pri istupanju ili isključenju (ne pri smrti, ne kod naloga iza koga ne stoji
 * stvarna osoba, ne kod maloletnog naloga, za koga se evidencija identiteta i ne vodi —
 * Pravilnik čl. 31 st. 7). Brisanje naloga u minusu se NE zabranjuje (Uslovi čl. 33 st. 3).
 *
 * 🔴 Rok je pet godina od prestanka statusa; po isteku, odnosno po prenosu, red se briše.
 *
 * 🔴 Poređenje NIŠTA NE BLOKIRA (kao `visestruki-nalog-pravila.ts`): nalaz vidi samo
 * superadmin, a o istom licu odlučuje samo Fondacija, uz obrazloženje.
 */
import { kljucImena, kljucTelefona } from "./visestruki-nalog-pravila";

export { MIN_OBRAZLOZENJE } from "./visestruki-nalog-pravila";

/** Rok čuvanja od prestanka statusa (Pravilnik čl. 33 st. 7). */
export const ROK_CUVANJA_GODINA = 5;

/** Izlazi pri kojima se red čuva (Pravilnik čl. 33 st. 7: „istupanjem ili isključenjem"). */
export type OsnovPrestanka = "ISTUPANJE" | "ISKLJUCENJE";

/** Da li se pri prestanku statusa red čuva. Samo negativan zapis punoletnog naloga. */
export function trebaSacuvati(p: { stanje: number; maloletan: boolean }): boolean {
  return !p.maloletan && p.stanje < 0;
}

/** Trenutak isteka roka: prestanak + pet godina. */
export function istekCuvanja(prestanakAt: Date): Date {
  const d = new Date(prestanakAt);
  d.setFullYear(d.getFullYear() + ROK_CUVANJA_GODINA);
  return d;
}

export function istekao(istice: Date, sada: Date = new Date()): boolean {
  return istice.getTime() <= sada.getTime();
}

export type SacuvaniRed = {
  id: string;
  prestanakAt: Date;
  istice: Date;
  imePrezime: string | null;
  telefon: string | null;
  mesto: string | null;
};

export type NoviNalog = {
  id: string;
  createdAt: Date;
  imePrezime: string | null;
  telefon: string | null;
  mesto: string | null;
};

export type OsnovPoklapanja = "TELEFON" | "IME";

export type Poklapanje = { redId: string; nalogId: string; osnovi: OsnovPoklapanja[]; istoMesto: boolean };

/**
 * Poklapanja sačuvanih redova sa nalozima otvorenim POSLE prestanka (Pravilnik čl. 33
 * st. 7: „ako isto lice u tom roku otvori nov nalog"). Isti ključevi kao poređenje
 * višestrukih naloga (`kljucImena`, `kljucTelefona`). Istekli redovi se ne porede.
 * Mesto samo ne čini poklapanje (dele ga svi iz mesta) — prikazuje se uz ime ili broj.
 * Čista funkcija; ništa ne blokira.
 */
export function poklapanja(sacuvani: SacuvaniRed[], nalozi: NoviNalog[], sada: Date = new Date()): Poklapanje[] {
  const rezultat: Poklapanje[] = [];
  for (const r of sacuvani) {
    if (istekao(r.istice, sada)) continue;
    const kt = kljucTelefona(r.telefon);
    const ki = kljucImena(r.imePrezime);
    if (!kt && !ki) continue;
    for (const n of nalozi) {
      if (n.createdAt.getTime() < r.prestanakAt.getTime()) continue;
      const osnovi: OsnovPoklapanja[] = [];
      if (kt && kljucTelefona(n.telefon) === kt) osnovi.push("TELEFON");
      if (ki && kljucImena(n.imePrezime) === ki) osnovi.push("IME");
      if (osnovi.length === 0) continue;
      const istoMesto = !!r.mesto && !!n.mesto && r.mesto.trim().toLowerCase() === n.mesto.trim().toLowerCase();
      rezultat.push({ redId: r.id, nalogId: n.id, osnovi, istoMesto });
    }
  }
  return rezultat;
}
