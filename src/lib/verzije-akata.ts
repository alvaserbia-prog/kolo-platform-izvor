/**
 * Verzije akata koje sistem trenutno servira — JEDAN izvor istine.
 *
 * ČISTA datoteka, bez ijednog `import`-a: uvozi je i server (stranice `/uslovi` i
 * `/privatnost`, zapis pristanka) i pretraživač (prikaz verzije uz kvačicu pri
 * registraciji).
 *
 * ─── Zašto postoji ──────────────────────────────────────────────────────────
 *
 * Do seta 4.6.3 verzija Uslova i Politike nije postojala nigde u kodu — ime fajla
 * je bilo otkucano u samoj stranici (`ucitajPravniDokument("politika_4_6_1.md")`),
 * a broj verzije živeo je odvojeno u `messages` labelama. Zapis pristanka mora da
 * kaže NA KOJU verziju je čovek pristao, pa bi treća prepisana kopija istog broja
 * bila treće mesto koje se razilazi — isti kvar koji je u CLAUDE.md već tri puta
 * opisan („ne prepisivati tabele u ekrane").
 *
 * 🟢 Zašto je dovoljno snimiti broj, a ne ceo tekst akta: pravilo bumpovanja
 * obezbeđuje da objavljen fajl nikad ne promeni sadržaj — šifra u imenu fajla JESTE
 * objava. `politika_4_6_7.md` zato i za deset godina govori ono što je govorio na
 * dan davanja pristanka.
 *
 * 🔴 Pri svakom bumpu Uslova ili Politike menja se i ovo. Zaključano testom
 * `pristanak-izvor.test.ts`, koji traži da fajl sa ovim imenom postoji na svih pet
 * jezika i da se broj verzije poklapa sa imenom fajla.
 */

export type Akt = {
  /** Broj verzije, kako se upisuje u zapis pristanka. */
  verzija: string;
  /** Ime fajla u `dokumentacija 4.1/` (i u svakom `<jezik>/` podfolderu). */
  fajl: string;
};

export const AKT_USLOVI: Akt = {
  // 4.7.2 — nov čl. 16a (gazdinstvo, mapa, oznaka DOMAĆE koju Fondacija ne
  // jemči); čl. 28: lažna izjava o gazdinstvu isključuje sve članove; čl. 37a:
  // odluke o gazdinstvu među predmetima prigovora.
  // 4.7.0 — čl. 5: Modul Zadruga je aktiviran (Pravilnik o zadrugama); verifikovani
  // korisnik može da učestvuje kao zadrugar.
  // 4.7.7 — čl. 13 i 17: „trajno pravo" i „dnevni tempo" umesto kapaciteta; čl. 31:
  // prestanak statusa je pseudonimizacija, ne anonimizacija.
  // 4.6.9 — čl. 21 st. 2: zabrana oglasa čiji je predmet POEN ili ZRNO upućuje i
  // na čl. 16 Pravilnika (Fondacija ne posreduje u zamenama POEN-a za novac).
  // 4.6.8 — čl. 16: evidentiranje POEN-a ne menja poresku kvalifikaciju posla, a
  // obaveza računa ostaje (R-05); čl. 17: ime uz javnu donaciju se povlači.
  // 4.6.6 — R-01: čl. 14 — prepis POEN-a otvoren članu sa utvrđenim identitetom
  // 4.6.4 — R-07: čl. 18 („iznos u POEN-ima" umesto „cena"), nov stav u čl. 20
  // (obaveze onoga ko nudi), dva nova stava u čl. 21 (dobra čiji je promet
  // ograničen; zabrana za maloletnog korisnika) i nov čl. 22b (odnos prema
  // propisima o zaštiti potrošača).
  // 4.7.8 — čl. 22a: vaučer iz raspodele dobara i usluga iz pokroviteljstva; čl. 37a:
  // prigovor zbog neizvršenja obaveze iz vaučera (vrsta, oznaka, rok).
  // 4.8.0 — čl. 15: verifikovani korisnik je potvrđen jednom važećom verifikacijom
  // (indeks stvarnosti ukinut); čl. 16: pravilo o jednoj potvrdi umesto
  // anti-cirkularnog pravila; nov čl. 17a (preporuka člana).
  // 4.8.1 — čl. 14, 16, 17, 17a, 18: neverifikovani korisnik postavlja i potražnju,
  // bez limita oglasa, piše u Pričaonici, pokreće do tri razgovora dnevno povodom
  // oglasa, prepisuje POEN i vidi sužen profil; nov čl. 16b (zahtev za razgovor);
  // preporuku daje samo verifikovani.
  // 4.8.3 — učesnik u Kolu; potvrda telefonom i spisak povezanih (čl. 16, 16b);
  // gazdinstvo prijavljuje svako, bez izvoda.
  // 4.8.2 — statusi (korisnik, član bez potvrde, član Kola, čuvar Kola), spisak za
  // poziv umesto zahteva za razgovor, uvođenje u Kolo; ceo set nosi istu šifru.
  // 4.8.4 — čl. 4 (elementi e-novca koji nedostaju), čl. 8, 16b, 28 i 37a: spisak za
  // poziv sa imenom, mestom i brojem, poređenje, utvrđenje višestrukog naloga.
  // 4.8.5 — registar 2026-10, oblasti U–S (objava posle seta 4.8.4): čl. 1 (ciljna
  // teritorija), 16b (poziv obavlja član Kola), 20 (propisi), 28 (lažna izjava o
  // gazdinstvu — samo ko je lagao ili znao).
  verzija: "4.8.5",
  fajl: "uslovi_koriscenja_4_8_5.md",
};

export const AKT_POLITIKA: Akt = {
  // 4.7.7 — 4.5 i 4.14: ime donatora u evidenciji identiteta samo kad ga potvrđuje
  // izvod; osnov zadržavanja posle prestanka učešća je legitimni interes; 4.5 bez
  // rečenice o „jedinoj tački" (od 4.7.3 postoji evidencija identiteta).
  // 4.7.5 — 4.5 i 4.14: pokroviteljstvo — sedište, MB, PIB i zastupnik; ime zastupnika
  // u evidenciji identiteta; ranglista samo nazivom.
  // 4.7.4 — 4.13: izvod iz RPG se ne traži; BPG se navodi kad je gazdinstvo upisano.
  // 4.7.3 — nov 4.14: evidencija identiteta (osnov: ugovor); čl. 3, 4.5, 4.12, 4.13,
  // 6, 10, 11 i 14 usklađeni — više ne stoji da veza pseudonima i imena ne postoji.
  // 4.7.2 — 4.13: podaci o gazdinstvu i javna mapa (osnov: ugovor); čl. 6 i 10.
  // 4.7.0 — 4.12: podaci zadrugara (ime i prezime koje dostavlja zadruga, uz
  // pristanak); čl. 6, 10 i 11 — vidljivost, rok čuvanja, brisanje.
  // 4.6.8 — 4.5, čl. 11 i 13: ime uz javnu donaciju se povlači i briše gašenjem naloga.
  // 4.7.6 — 4.13: adresa gazdinstva se čuva uz prijavu i vidi je samo
  // administratorski tim; pretraga tačke ide Nominatim-u iz pretraživača.
  // 4.7.8 — 4.5 (pokroviteljstvo dobrima i uslugama), nov 4.15 (vaučeri iz
  // raspodele; davalac ne vidi imaoca), čl. 8 i 10.
  // 4.8.0 — 4.2, 4.6 i čl. 6: potvrđenost umesto indeksa stvarnosti; socijalni
  // program traži potvrdu jednog verifikatora; nov 4.16 (preporuke), čl. 6 i 10.
  // 4.8.1 — nov 4.17 (zahtev za razgovor); 4.8 i čl. 6: vidljivost za
  // neverifikovanog korisnika; 4.13 i čl. 10: telefon člana gazdinstva.
  // 4.8.3 — zahtev člana bez potvrde za razgovor radi potvrde (4.17); izvod iz
  // Registra se ne prikuplja (4.13); spisak povezanih umesto automatske potvrde lanca.
  // 4.8.2 — spisak za poziv (ime i telefon vidi član Kola, beleži se ko je
  // otvarao), izvod iz RPG do odluke o prijavi, potvrda uplatom ukinuta.
  // 4.8.4 — 4.5 (bez izjave o poreklu), 4.14 (peti slučaj, poređenje), 4.17 i čl. 10:
  // ime, mesto i broj ostaju uz nalog i porede se; utvrđenje višestrukog naloga.
  // 4.8.5 — registar 2026-10, oblasti U–B: čl. 2 (ciljna teritorija), čl. 8 (Google
  // prijava, push, OpenStreetMap, rezervne kopije), zadružni admin, DPIA kod direktora.
  verzija: "4.8.5",
  fajl: "politika_4_8_5.md",
};

/**
 * Verzija teksta kojim se traži pristanak na analitičke kolačiće.
 *
 * 🔴 Nije verzija akta nego samog obaveštenja u banneru. Podiže se kad se tekst
 * promeni ili kad se promeni ono na šta se pristaje (drugi alat, druga svrha) —
 * i tada se svi koji su odlučivali po starom tekstu pitaju ponovo. Bez toga
 * „pristao je" prestaje da znači išta posle prve izmene.
 */
export const VERZIJA_PRISTANKA_KOLACICI = "1";
