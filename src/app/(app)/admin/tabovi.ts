// Zaseban modul (bez "use client") da bi server stranica mogla da uveze niz
// kao pravu vrednost — uvoz iz client fajla u produkcijskom SSR build-u daje
// client-reference proxy, pa ADMIN_TABOVI.includes puca.
// „nadzor" = automat (RizikNalaz, noćni radnik); na ekranu se tab zove „Provere"
// (set 4.8.2), a identifikator `nadzor` ostaje zbog starih linkova (pravilo 12). „odluke" = ljudska prijava —
// nadzorni predmeti koje su otvorili nadzornici (dokaz stvarnosti 4.2.0, čl. 11a).
// Dva različita posla, namerno dva taba.
// „prvi-oglasi" = odobravanje doprinosa iz čl. 40a za naloge bez potvrde. Nije
// moderacija (to je „pijaca"): oglas ostaje, odlučuje se samo o 1.000 POEN.
// „razmene" = prijave da razmena povodom prepisa POEN-a nije ispunjena. Ni to
// nije moderacija: odlučuje se o zapisu POEN-a, ne o sadržaju oglasa.
// „nabavke" = sprovođenje kolektivne nabavke: ponude, kalkulacija, red, plaćanje i
// potvrda preuzimanja. Nije moderacija („pijaca"), nije prigovor („prigovori") i
// nije odluka o prepisu POEN-a („razmene") — ovde se troše dinarska sredstva i gasi
// POEN po iskorišćenju (Pravilnik čl. 14a i 51a).
// „politika" = kada se traži pristanak na nove akte (nova `PolitikaVerzija`) —
// odluka vlasnika, ne posledica svakog bumpa. Samo superadmin.
// „zadruge" = upis zadruga, zadrugari i zapisi zadruge sa osnovom, u ime zadruge
// po njenom nalogu (Pravilnik o zadrugama čl. 16).
// „gazdinstva" = pregled prijava gazdinstava i kasnijih pristupanja, poništenje
// odobrenja zbog lažne izjave (Pravilnik o gazdinstvima čl. 6, 8, 12).
export const ADMIN_TABOVI = ["dashboard", "programi", "ped", "pokrovitelji", "donacije", "prigovori", "korisnici", "pijaca", "prvi-oglasi", "potvrde", "razmene", "nabavke", "zadruge", "gazdinstva", "emisija", "osnivaci", "vesti", "obavestenja", "politika", "audit", "aktivnost", "levak", "nadzor", "odluke"] as const;
export type Tab = (typeof ADMIN_TABOVI)[number];
