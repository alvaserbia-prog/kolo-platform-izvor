/**
 * Prekidači koji važe za ceo sistem.
 *
 * Fajl je bez ijednog `import`-a namerno — uvoze ga i serverske i klijentske
 * komponente.
 *
 * ─── Istorija: prekidači modula su uklonjeni (20.10.2026) ──────────────────
 *
 * Ovde su stajali `KRUG_AKTIVAN`, `POKROVITELJSTVO_AKTIVNO` i `MODUL_DECA_AKTIVAN`.
 * Pokroviteljstvo (novcem i dobrima i uslugama) i Modul Deca su trajno u radu, pa
 * se uslovljavanje izgubilo — njihove stranice, rute, navigacija i FAQ više ne
 * zavise ni od čega. Modul Krug je uklonjen: zamenile su ga zadruge, koje rade nad
 * ISTOM tabelom `Krug` (red sa `zadruga = true`) i bez prekidača.
 *
 * 🔴 **Ne brisati tabele ni podatke Kruga.** `Krug` ima sopstveni `Wallet`, čiji
 * balans ulazi u opticaj (`osnivacki.ts`). Brisanje redova bi oborilo zero-sum i
 * pomerilo pragove osnivačkog koraka. Iz istog razloga ostaju i enum vrednosti
 * `WalletType.KRUG`, `TransactionType.EMISIJA_KRUG_OSNIVANJE`, `EMISIJA_KRUG_BONUS`
 * i `EMISIJA_POKROVITELJ` — istorijske transakcije ih nose. Stari linkovi
 * `/krug/...` iz zatečenih obaveštenja preusmeravaju se na `/zadruge`
 * (`next.config.ts`).
 */

/**
 * Ekran „Sistem je unapređen — novi akti" pri prijavi (Uslovi čl. 40, Politika čl. 16).
 *
 * `false` = od korisnika se NE traži pristanak; prekrivač se nikad ne prikazuje,
 * a `/politika-prihvati` propušta dalje. Odluka vlasnika 11.08.2026: akti su doneti
 * i punovažni danom donošenja, sistem još nije zvanično u radu, pa ekran samo smeta
 * ljudima koji prvi put dolaze.
 *
 * 🔴 **Mehanizam se NE briše, samo se ne traži.** Verzije i pristanci
 * (`PolitikaVerzija`, `PolitikaPrihvatanje`) ostaju u bazi, zajedno sa svime što
 * je do sada upisano — postojeći pristanci su dokaz i ne smeju da se izgube.
 *
 * 🔴 **ROK OD 15 DANA JE UKINUT setom 4.3.0** (odluka vlasnika 17.08.2026). Uslovi
 * čl. 40 i Politika čl. 16 sada glase: izmene stupaju na snagu danom donošenja, a
 * obaveštenje se šalje bez odlaganja. Nema više roka koji bi trebalo odbrojavati —
 * `true` znači samo „prikaži ekran i upiši pristanak", uz nov red `PolitikaVerzija`.
 * Ne vraćati rok u komentare ni u copy: akti ga više ne poznaju.
 *
 * 🔴 **UPALJEN 14.09.2026 zbog ZATEČENIH naloga (odluka vlasnika, uz R-06).**
 * Od tog dana registracija i OAuth upisuju `ZapisPristanka` i `PolitikaPrihvatanje`
 * u istoj transakciji u kojoj nastaje nalog (`upisiPristankeRegistracije`), pa nov
 * čovek pristanak daje kvačicom i ekran NE vidi. Ostaju nalozi otvoreni pre te
 * izmene — za njih dokaz pristanka ne postoji i ne može se napraviti unazad, pa se
 * traži pri prvoj narednoj prijavi. To je jedini put kojim se taj dug naplaćuje.
 *
 * 🔴 **Prekidač se NE gasi dok gejt radi svoj posao.** Gašenje bi zatečene naloge
 * vratilo u stanje bez dokaza pristanka, a ekran im se više nikad ne bi pojavio.
 * Uz to: svaka naredna izmena akata traži nov red `PolitikaVerzija` (Uslovi čl. 40,
 * Politika čl. 16) — bez njega ekran ćuti jer je zatečena verzija već prihvaćena.
 */
export const PRISTANAK_NA_AKTE_TRAZI_SE = true;
