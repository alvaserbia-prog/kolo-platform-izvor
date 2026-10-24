// Zaseban modul (bez "use client") da bi server stranica mogla da uveze niz
// kao pravu vrednost — uvoz iz client fajla u produkcijskom SSR build-u daje
// client-reference proxy, pa SEKCIJE.includes puca (digest 3820555452).
export const SEKCIJE = ["pregled", "clanovi", "lokacije", "transakcije", "donacije", "iznos", "faza", "fondacija"] as const;
export type Sekcija = (typeof SEKCIJE)[number];
