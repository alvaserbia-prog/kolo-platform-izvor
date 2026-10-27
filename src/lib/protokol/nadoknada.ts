/**
 * Nadoknada po poništenju lažne verifikacije.
 *
 * Osnov: Pravilnik o dokazu stvarnosti, čl. 35, 36 i 37; izuzetak od
 * zabrane negativnog zapisa POEN-a je u čl. 17 stav 2 Pravilnika o KOLO sistemu.
 *
 * Zašto uopšte postoji: kad se lažnom nalogu poništi 1.000 POEN-a, a on je deo
 * toga već potrošio na tuđu robu, taj deo se nema odakle vratiti. Zbir svih takvih
 * nepokrivenih delova jednak je vrednosti koja je iz mreže stvarno izvučena. Zato
 * nadoknada nije globa nego izravnanje, i zato nema gornju granicu.
 *
 * 🔴 KO SME U MINUS: isključivo verifikator poništene verifikacije. Verifikovani
 * korisnik i nadzornik idu NAJVIŠE do nule, a nepokriveni deo prelazi na verifikatora
 * (čl. 36 st. 2, čl. 37 st. 1). Ko ništa nije skrivio ne ostaje u minusu — bez toga
 * bi pošten čovek kome verifikator bude naknadno oboren ispao dužan.
 *
 * Zero-sum ostaje očuvan: svaki poništeni POEN ima tačan protivzapis Protokola, a
 * prenos nepokrivenog dela na verifikatora je običan prenos između dva zapisa.
 *
 * ─── Svi osnovi negativnog zapisa (Pravilnik čl. 17 st. 2, set 4.8.4) ────────
 * Funkcije `jeNadoknada` / `iznosNadoknade` / `raspolozivo` ispod NE razlikuju
 * osnov: minus JESTE nadoknada, bez obzira odakle je došao. Osnovi su (lista je
 * iscrpna i zatvorena; deveti se ne uvodi bez izmene tog člana):
 *   1. nadoknada po čl. 36 dokaza stvarnosti (poništena lažna verifikacija) — ovaj fajl;
 *   2. poništen prepis po prijavi razmene (`PONISTENJE_PREPISA`);
 *   3. otpis doprinosa iz dečjeg prostora (`OTPIS_PRIJATELJSTVO`, punoletstvo);
 *   4. prevođenje punoletnog naloga u maloletni (`OTPIS_PREVOD_U_MALOLETNI`);
 *   5. otpis po usklađivanju zatečenih potvrda (čl. 39 dokaza stvarnosti);
 *   6. otpis po prestanku gazdinstva (`OTPIS_GAZDINSTVO`, Pravilnik čl. 39, gazdinstva čl. 23);
 *   7. otpis po neizvršenju pokroviteljstva dobrima i uslugama
 *      (`OTPIS_POKROVITELJ_DOBRA`, donacije čl. 35) — `protokol/pokroviteljstvo-dobrima.ts`;
 *   8. otpis neto prepisa sa ugašenog naloga po utvrđenju višestrukog naloga
 *      (`OTPIS_VISESTRUKI_NALOG`, dokaz stvarnosti čl. 14) — `protokol/visestruki-nalog.ts`.
 */

export type PodelaTereta = {
  /** Koliko se skida sa zapisa samog korisnika (nikad ispod nule). */
  saKorisnika: number;
  /** Nepokriveni deo koji prelazi na verifikatora kao nadoknada. */
  naVerifikatora: number;
};

/**
 * Podela poništenog iznosa između korisnika i verifikatora.
 *
 * Korisnik podnosi onoliko koliko ima; ostatak ide verifikatoru. Ako je korisnik
 * već u minusu (ranija nadoknada), sa njega se ne skida ništa — inače bi jedno
 * poništenje gurnulo dva puta isti dug.
 */
export function podelaTereta(stanje: number, iznos: number): PodelaTereta {
  if (iznos <= 0) return { saKorisnika: 0, naVerifikatora: 0 };
  const saKorisnika = Math.max(0, Math.min(stanje, iznos));
  return { saKorisnika, naVerifikatora: iznos - saKorisnika };
}

/** Zapis je u nadoknadi kad je negativan. Nema zasebne kolone — minus JESTE nadoknada. */
export function jeNadoknada(stanje: number): boolean {
  return stanje < 0;
}

/** Preostali iznos nadoknade, kao pozitivan broj (0 kad je nema). */
export function iznosNadoknade(stanje: number): number {
  return stanje < 0 ? -stanje : 0;
}

/**
 * Koliko korisnik zaista može da uputi drugom.
 *
 * Nadoknada ne sprečava razmenu dobara i usluga, ali POEN-i koji pristignu prvo
 * popunjavaju nadoknadu — korisnik raspolaže zapisom tek pošto pređe nulu
 * (čl. 36 st. 5). Za negativno stanje raspoloživo je nula, ne negativan broj.
 */
export function raspolozivo(stanje: number): number {
  return Math.max(0, stanje);
}
