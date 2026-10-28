export type FaqPitanje = {
  id: number;
  pitanje: string;
  odgovor: string;
  /** Neobavezan link ispod odgovora — za pitanja na koja postoji stranica sa
   *  punim odgovorom (npr. „piramida ili kripto?“ → /kako-funkcionise#pravila).
   *  Odgovori se iscrtavaju kao čist tekst, bez markdown-a i bez HTML-a, pa
   *  link ne može da stoji u samom tekstu — otud zasebno polje. */
  link?: { href: string; label: string };
};

export type FaqSekcija = {
  id: string;
  naslov: string;
  pitanja: FaqPitanje[];
};

export const FAQ_SEKCIJE: FaqSekcija[] = [
  {
    id: "pocetnici",
    naslov: "Za početnike",
    pitanja: [
      {
        id: 42,
        pitanje: `Ne poznajem nikoga u Kolu, može li me iko potvrditi?`,
        odgovor: `Može. U Kolo te uvodi čovek, a poznanstvo tek treba da nastane.

Izaberi „Želim da me neko nazove“ u meniju. Ostaviš mesto, par reči o sebi, kada si dostupan i broj telefona. Pozvaće te član Kola najkasnije u roku od sedam dana i videće tvoje ime, ako je upisano, i broj. Ako posle razgovora proceni da za tebe može da odgovara, uvodi te u Kolo i postaješ član bez potvrde. Razgovor ga na to ne obavezuje. Ko vidi tvoj broj i šta se pri tom beleži, piše u odeljku Privatnost i izlazak.

Fondacija ti spisak nudi i kad javno doniraš najmanje 5.000 dinara jednom uplatom sa računa na tvoje ime koji ne stoji uz drugi nalog, kad joj stigne novčano pokroviteljstvo po tvojoj prijavi ili kad kao nosilac prijaviš gazdinstvo. Broj telefona i pristanak tada ostavljaš sam. Ni uplata ni prijava ne potvrđuju stvarnost, a donacija, pokroviteljstvo i POEN po njima ne zavise od poziva.

Potvrda može i na daljinu, i iz inostranstva: dovoljno je da te onaj ko potvrđuje zaista poznaje. Poznanstvo često nastaje kroz razmenu: kad nešto razmenite uživo, ta osoba te stvarno poznaje i može da te potvrdi.`,
      },
      {
        id: 43,
        pitanje: `Da li je zaista besplatno, moram li da uplatim ili doniram?`,
        odgovor: `Da. Korišćenje platforme je besplatno i nema plaćenih funkcija. Registracija ne košta ništa: biraš pseudonim, uneseš imejl i lozinku.

Nema pretplate, provizije ni paketa koji se dokupljuje. U Kolo te ne uvodi uplata nego čovek.

Donacija je dobrovoljna i nije uslov ni za šta. Njome pokrivaš troškove Fondacije: server, alate, razvoj, pravne i računovodstvene usluge.

Donacija i POEN su dva odvojena akta. Donacija je jednostrana i nepovratna, njome ne kupuješ ništa. Nezavisno od nje, Protokol upisuje POEN u tvoj zapis po pravilima sistema. POEN nema vrednost van sistema, ne preprodaje se i ne vraća se u novac.

POEN ti se upisuje i bez ijednog dinara. Dobijaš ga kroz dokaz stvarnosti (kad uđeš u Kolo ili ti nekoga uvedeš), prvi oglas, operativni doprinos i razmenu, u kojoj ti druga strana prepiše POEN. A novcem se ne kupuje ni glas u odlukama: glas nosi ZRNO, ne POEN.`,
      },
      {
        id: 44,
        pitanje: `Koji je moj prvi korak i kako dolazim do POENA?`,
        odgovor: `Prvi korak je prvi oglas: objavi ono što imaš ili umeš, i dok još nisi u Kolu. Ne treba ti ni proizvod ni potvrda. Oglas mora imati naslov, opis, fotografiju, kategoriju i mesto. Kad Fondacija odobri tvoj prvi oglas kojim nešto nudiš, upisuje ti se doprinos za prvi oglas, jednom po nalogu.

Drugi korak je ulazak u Kolo. Tebi i onome ko te je potvrdio ili uveo beleži se po 1.000 POENA, a evidentira se kad ostvariš prvi doprinos: odobren oglas, javnu donaciju, pokroviteljstvo koje si prijavio ili izvršen zadatak.

Posle toga POEN dolazi na četiri načina:

• razmena: druga strana ti prepiše POEN za ono što si dao ili uradio, i pre nego što uđeš u Kolo;

• uvođenje i potvrda drugih: po 1.000 POENA tebi i njemu, kad on ostvari prvi doprinos;

• zadaci zajednice: rad po objavljenom zadatku;

• socijalni programi: kad ti Fondacija odobri prijavu, POEN se upisuje svakog dana. Programi su za učesnike.`,
      },
      {
        id: 45,
        pitanje: `Koliko vremena mi oduzima, moram li biti stalno aktivan?`,
        odgovor: `Ne moraš. Ne postoji minimum prijavljivanja, doprinosa ni razmene koji bi morao da ispuniš da bi zadržao nalog.

Uključuješ se koliko želiš i kada želiš. Operativni doprinos, razmena na Pijaci i upis ZRNA su mogućnosti, a ne dužnosti. Nema minimalnog trajanja ni otkaznog roka.

Kad pauziraš, tvoj zapis te čeka. POEN ti ne ističe, ostaje u tvom zapisu dok ga ne prepišeš drugome ili dok ne zatvoriš nalog. Uvođenje roka trajanja POENA bila bi suštinska izmena sistema o kojoj bi odlučivalo Gornje Kolo, a ne Fondacija sama.

Iz sistema izlaziš u svakom trenutku, iz podešavanja profila.`,
      },
      {
        id: 46,
        pitanje: `Šta je pseudonim, moram li otkriti pravo ime ili poslati ličnu kartu?`,
        odgovor: `Pseudonim je ime koje sam biraš i pod kojim te drugi vide. Ne mora imati veze sa tvojim pravim imenom, i bolje je da ga ne sadrži: u maloj sredini pseudonim, mesto i ono što nudiš mogu otkriti ko si.

Pri registraciji tražimo samo pseudonim, imejl i lozinku. Ne tražimo JMBG, ličnu kartu ni fotografiju, ni tada ni pri ulasku u Kolo: tvoju stvarnost potvrđuje čovek koji te zna. Ime i broj telefona možeš sam da pokažeš učesnicima, i to da povučeš kad hoćeš.

Ime i prezime Fondacija upisuje uz pseudonim samo u četiri slučaja: kad prijaviš gazdinstvo ili mu pristupiš, kad javno doniraš, kad postaneš zadrugar i kad potvrdi pokroviteljstvo koje si prijavio. Uz nalog se vodi jedno ime. Ne stoji na profilu i ne ulazi u zapise POENA. Osim Fondacije vide ga još samo lista donacija (ime javnog donatora) i član Kola koji otvori tvoj poziv, ako si tražio da te neko nazove.`,
      },
      {
        id: 76,
        pitanje: `Kako da prepoznam prevaru, šta KOLO nikad neće tražiti od mene?`,
        odgovor: `Ako neko traži nešto sa ovog spiska, to nije Fondacija, to je neko ko se predstavlja kao Fondacija.

Nikad ne tražimo novac za pristup. Registracija i korišćenje su besplatni. Donacija i pokroviteljstvo su dobrovoljni i uplaćuju se isključivo preko zvaničnih kanala na ekolo.rs, nikad na privatni račun i nikad na osnovu poruke koja te požuruje.

Nikad ne tražimo lozinku, PIN ni broj platne kartice. Niko iz Fondacije neće od tebe zatražiti lozinku ni kod iz poruke. Lozinku unosi samo na ekolo.rs, nikad na stranici do koje si došao preko linka iz poruke ili mejla.

Za registraciju i za ulazak u Kolo ne tražimo dokumente. Ni JMBG, ni sliku lične karte ili pasoša. Dokaz stvarnosti počiva na poznanstvu, a ne na ispravama.

POEN se ne unovčava. Ne menja se za dinare, ne preprodaje se i Fondacija ga ne otkupljuje. Svaka ponuda koja obećava zaradu, povraćaj novca ili pretvaranje POENA u dinare je pokušaj prevare, ma ko ti je poslao.

Na Pijaci prepiši POEN tek kad primiš robu ili uslugu. Ako te neko požuruje da prepišeš unapred, odustani od razmene.

Ako naiđeš na bilo šta od ovoga: ne deli podatke, ne klikći na link i piši nam na kontakt@ekolo.rs.`,
      },
      {
        id: 82,
        pitanje: `Razmenjujem sa nekim ko još nije u Kolu, koliki je rizik?`,
        odgovor: `Rizik snosiš ti: ako prepišeš POEN a ne dobiješ ono što je dogovoreno, prepis se ne poništava automatski.

Zato prepiši POEN tek kad primiš robu ili uslugu. To je jedino pravilo koje te stvarno štiti.

Šta znače oznake. Član Kola je onaj čiju je stvarnost potvrdio neko ko ga lično zna, nepoznat tebi, ali ne i mreži. Član bez potvrde je uveden u Kolo, ali ga još nije potvrdio član Kola koji ga lično zna. Za oba neko odgovara: onaj ko ga je potvrdio, odnosno uveo. Korisnik još nije u Kolu, i njegov oglas nosi oznaku da oglašivač nije u lancu potvrda.

Šta radi u tvoju korist. Sistem trajno pamti. Svako ažuriranje evidencije ostaje zabeleženo pod pseudonimom i vidljivo učesnicima, loše ponašanje se ne briše sa naloga.

Ako razmena propadne. Podnesi prigovor Fondaciji sa svog profila, u roku od 30 dana od prepisa, i izaberi baš taj prepis. Druga strana dobija sedam dana da se izjasni, pa Fondacija odlučuje uz obrazloženje koje ide obema stranama. Ako prepis poništi, vraća ti se ceo iznos, i onda kada zapis druge strane time ode u minus. Odluka je na Fondaciji, pa prigovor nije automatski povraćaj.

Za kvalitet, isporuku i ispunjenje dogovora odgovaraš ti sa drugom stranom, po opštim pravilima obligacionog prava; Fondacija i Protokol nisu strana u tom odnosu. U početnoj fazi možeš zatražiti i dobrovoljno posredovanje Fondacije, ono nije obavezujuće, ali često je dovoljno.

Najbolje je da se nađete uživo i razmenu obavite licem u lice. Tako rizik pada, a nastaje i poznanstvo iz kojeg može doći ulazak u Kolo ili potvrda.`,
      },
      {
        id: 83,
        pitanje: `Koliko oglasa mogu da postavim pre nego što uđem u Kolo?`,
        odgovor: `Koliko hoćeš, i ponude i potražnje. Prvi oglas kojim nešto nudiš nosi ti 1.000 POENA: oglas je na Pijaci odmah, a POEN se upisuje kad ga Fondacija odobri. Tvoj oglas dok si korisnik nosi oznaku da oglašivač još nije u lancu potvrda.

Svaki oglas mora imati naslov, opis, fotografiju, kategoriju i mesto. Nema propisane najmanje dužine, piši onoliko koliko treba da čovek razume šta nudiš.

I pre ulaska u Kolo pišeš u Pričaonici, odgovaraš onima koji ti se jave, primaš i prepisuješ POEN i sam pišeš oglašivaču povodom njegovog oglasa, do tri nova razgovora dnevno.

Kad uđeš u Kolo, makar i kao član bez potvrde, otvara ti se:

• razgovor sa svakim korisnikom, bez dnevnog ograničenja

• kontakt telefon sa oglasa i pun pregled evidencije, sa pseudonimima

• programi, nabavke, vaučeri, zadruga i upis ZRNA

Potvrda člana Kola dodaje još potvrđivanje drugih, spisak onih koji žele da ih neko nazove, potvrdu postojanja deteta i ispunjenosti uslova za program, preporuku, aktiviranje ZRNA i glas u Gornjem Kolu.`,
      },
    ],
  },
  {
    id: "ukljucivanje",
    naslov: "Ulazak u Kolo",
    pitanja: [
      {
        id: 7,
        pitanje: `Kako ulazim u Kolo i šta time dobijam?`,
        odgovor: `Ulazak u Kolo nije obavezan: i bez njega objavljuješ oglase, pišeš u Pričaonici i prepisuješ POEN. Kolo otvara ono što traži da iza naloga stoji poznat čovek.

Ulazi se na dva načina. Član Kola koji te lično zna potvrdi da si stvarna osoba, i postaješ član Kola. Ili te uvede poznanik koji je i sam uveden, odnosno član Kola posle razgovora telefonom, i tada si član bez potvrde. U oba slučaja pokažeš ili izdiktiraš svoj kod. Dokumenti se ne traže.

Člana bez potvrde kasnije potvrđuje član Kola koji ga lično zna. Ako takvog nema, posle 30 dana u Kolu, ako ispunjava uslove, može da izabere „Želim da me neko nazove radi potvrde“, pa ga posle razgovora potvrđuje čuvar Kola. Kad postaneš član Kola, dobijaš spisak onih koje si uveo i onoga ko je tebe uveo, i sa njega potvrđuješ one koje lično znaš.

Ulazak otvara kontakt sa oglasa, razgovor bez dnevnog ograničenja, programe, zadrugu, nabavke, vaučere i upis ZRNA. Tebi i onome ko te je potvrdio ili uveo beleži se po 1.000 POENA, a evidentira se kad ostvariš prvi doprinos.`,
      },
      {
        id: 118,
        pitanje: `Koliko ljudi mogu da potvrdim ili uvedem?`,
        odgovor: `Broj nije ograničen, ograničen je tempo. U jednom danu se broje sve tvoje potvrde i uvođenja, i one sa spiska povezanih. Uz treću i četvrtu stiže upozorenje, a peta se ne upisuje i potvrđivanje ti staje do ponoći. Sve ostalo radi kao i inače.`,
      },
      {
        id: 122,
        pitanje: `Kako da uvedem više ljudi?`,
        odgovor: `Svako od vas potvrđuje samo one koje lično zna. U jednom danu sistem prihvata ograničen broj potvrda jedne osobe, pa rasporedite potvrde kroz nekoliko dana. Što vas je više u Kolu, to brže ide.`,
      },
      {
        id: 119,
        pitanje: `Šta ako onaj ko me je potvrdio ode, ili se utvrdi da je potvrda lažna?`,
        odgovor: `Ako onaj ko te je potvrdio ili uveo ugasi nalog, tvoj položaj i POEN ostaju. Poništava ih samo utvrđena lažnost, a ona se ceni po čoveku i ne prenosi se na one koje je taj čovek potvrdio.

Kome se poništi ulazak u Kolo, postaje korisnik: nalog ostaje, a u Kolo ga ponovo može uvesti ili potvrditi neko ko ga lično zna. Kome se poništi samo potvrda, ostaje član bez potvrde.

Ko potvrdi ili uvede nekoga ko nije stvarna osoba, gubi tih 1.000 POENA, i kad ih je već potrošio, pa mu zapis ide u minus. Lažna potvrda je teža povreda Uslova korišćenja i po pravilu povlači isključenje.`,
      },
      {
        id: 8,
        pitanje: `Šta ako sam stranac, mogu li da učestvujem?`,
        odgovor: `Možeš. Državljanstvo i prebivalište nisu uslov, niti se bilo gde upisuju. Pri registraciji biraš pseudonim i unosiš imejl i lozinku; dokumenti se ne traže.

Jedini stvarni uslov za ulazak u Kolo je da te potvrdi ili uvede neko ko te poznaje, a taj neko može biti bilo gde. Ako u mreži još nikoga ne poznaješ, poznanstvo nastalo kroz obavljenu razmenu je punopravan osnov. Možeš i da ostaviš broj preko „Želim da me neko nazove“, pa da te član Kola uvede u Kolo posle razgovora telefonom.

Pravilnik, Uslovi korišćenja i ostali obavezujući akti doneti su na srpskom i ta verzija je merodavna. Prevodi postoje kao pomoć čitaocu.`,
      },
      {
        id: 9,
        pitanje: `Mogu li imati više naloga ili više pseudonima?`,
        odgovor: `Ne. Pravilo je jedan čovek, jedan nalog, i to je uslov korišćenja. Ko otvori drugi nalog, može biti isključen iz sistema.

Drugi nalog uglavnom nema smisla ni pre nego što ga neko primeti. Nalog koji niko nije uveo u Kolo ne vidi kontakt telefone ni evidenciju sa pseudonimima i ne ulazi u programe, nabavke ni ZRNO, a u Kolo ga uvodi čovek koji tvrdi da te poznaje i koji za netačnu tvrdnju odgovara. Ni donacija sa računa koji stoji uz drugi nalog ne vodi na spisak onih koji žele da ih neko nazove.

Nalog koji roditelj otvori svom detetu nije izuzetak od ovog pravila.

Pseudonim je jedan i pod njim te vide ostali korisnici. O njegovoj promeni u sledećem pitanju.`,
      },
      {
        id: 10,
        pitanje: `Mogu li da promenim pseudonim?`,
        odgovor: `Možeš, najviše jednom u trideset dana.

Promena važi odmah. Čim je potvrdiš, ceo tvoj nalog se ostalima prikazuje pod novim pseudonimom, uključujući i istoriju; stari se više ne vidi.

Pseudonim sme da sadrži latinična slova, cifre i znake _ . - bez razmaka i bez slova č, ć, š, ž i đ. Latiničan je i kada sajt čitaš ćirilicom. Stoji i u adresi tvog profila.

Ranije podeljeni linkovi i dalje rade: stara adresa vodi na tvoj profil i posle promene, a napušteni pseudonim ne može da uzme neko drugi, inače bi već podeljen link tiho odveo na drugu osobu.

Sam nalog se time ne menja: lanac potvrda, tvoj položaj u Kolu i evidencija doprinosa ostaju isti, jer je promenjeno samo ime pod kojim se vide.`,
      },
    ],
  },
  {
    id: "pijaca-donacije",
    naslov: "Pijaca",
    pitanja: [
      {
        id: 39,
        pitanje: `Da li je razmena na Pijaci prodaja?`,
        odgovor: `Po Pravilniku KOLO sistema, razmena dobara i usluga između korisnika na Pijaci nije postavljena kao klasična prodaja. Reč je o dogovoru dve strane, jedan daje dobro ili uslugu, drugi mu prepisuje POEN, a POEN nije novac nego evidencija doprinosa zajedničkom dobru.

Prenos POENA u toj razmeni nije plaćanje novcem niti sredstvo plaćanja u smislu Zakona o platnim uslugama. Odnosi povodom razmene (ispunjenje, odgovornost, rizik) uređuju se po opštim pravilima obligacionog prava; Protokol u razmeni ne posreduje.

Ako kroz Pijacu obavljaš delatnost, tvoje poreske i fiskalne obaveze po opštim propisima ostaju, ništa ovde ih ne ukida.`,
      },
      {
        id: 60,
        pitanje: `Kako da odredim iznos u oglasu?`,
        odgovor: `Iznos u POENIMA za svoja dobra i usluge određuješ sam, slobodno. Platforma ga ne utvrđuje, ne ograničava i ne kontroliše, niti iko vrednuje tvoju robu umesto tebe, ti najbolje znaš šta nudiš i koliko vredi.

Zvaničnog odnosa nema i Fondacija ga ne objavljuje. Mnogi korisnici polaze od cene koju to dobro ili uslugu ionako znaju u dinarima — to je tvoja procena, važi za tvoj oglas i ne obavezuje drugu stranu. Fondacija ne garantuje vrednost POENA niti ga otkupljuje.

Ono što se traži jeste poštenje: tačan i jasan opis dobra ili usluge, realna količina i realan iznos u POENIMA, i svi uslovi razmene. Nije dozvoljen lažan ili obmanjujuć sadržaj koji pogrešno predstavlja prirodu, kvalitet ili količinu onoga što nudiš.

Sve ostalo (isporuku, rok, dodatne uslove) dogovaraš direktno sa drugom stranom.

Napomena: ovo važi za razmenu na Pijaci. Zadaci zajednice (operativni doprinos) su drugi kanal, tamo iznos nije slobodan dogovor, nego predloženi POEN, težinski orijentir u dnevnoj raspodeli.`,
      },
      {
        id: 41,
        pitanje: `Da li je moj oglas na Pijaci javno vidljiv?`,
        odgovor: `Da. Sadržaj oglasa (opis, iznos u POENIMA, lokacija i tvoj pseudonim) vidljiv je svim posetiocima, uključujući neregistrovane, da bi razmena bila dostupna i laka za pronalaženje. Dok nisi u Kolu, oglas nosi i vidljivu oznaku da oglašivač još nije u lancu potvrda.

Šta nije javno: tvoj kontakt telefon vide samo učesnici. Da ti piše povodom oglasa može svako ko ima nalog, a ko još nije u Kolu do tri nova razgovora dnevno. Neregistrovanima tvoj pseudonim na oglasu ne vodi ka profilu, a korisnicima vodi samo do suženog profila, bez istorije transakcija.`,
      },
      {
        id: 58,
        pitanje: `Mogu li sa komšijom razmeniti rad-za-rad ili alat-za-usev bez ijednog POENA (trampa)?`,
        odgovor: `Možeš. Direktna trampa (tvoj rad za njegov rad, tvoj alat za njegov usev) privatan je dogovor između tebe i komšije i KOLO ti to ne zabranjuje.

Takva razmena odvija se van sistema: ako uz nju ne ažurirate evidenciju POENA, ostaje vaš lični dogovor i nigde se ne beleži kao tvoj doprinos.

A baš tu je smisao KOLO sistema: da razmena koju biste ionako obavili „od ruke do ruke“ dobije zapis. Kad uz razmenu ažurirate evidenciju, POEN pređe sa zapisa onoga ko je dobro ili uslugu primio na zapis onoga ko ih je dao, i ostaje trag ko je koliko dao zajednici.

Za kvalitet, isporuku i ispunjenje dogovora odgovarate vas dvoje, po opštim pravilima. Fondacija i Protokol se u to ne mešaju i za to ne odgovaraju.`,
      },
      {
        id: 21,
        pitanje: `Ko odgovara ako razmena ne uspe ili roba ima nedostatak?`,
        odgovor: `Razmena na Pijaci je direktan odnos dve strane i privatnopravne je prirode. Za kvalitet, ispravnost i isporuku odgovaraju korisnici koji razmenjuju, onaj ko dobro ili uslugu daje i onaj ko ih prima. Fondacija i Protokol nisu strana u razmeni i ne posreduju u njoj; sve se uređuje po opštim pravilima obligacionog prava, kao kod svake nabavke između dvoje ljudi.

Garanciju, rok i uslove dogovaraš direktno sa drugom stranom pre razmene, što jasnije dogovorite stanje robe, rok i šta ako nešto ne valja, to lakše rešavate problem kasnije. Ako razmenjuješ sa nekim ko robu ili uslugu nudi u okviru delatnosti, važi i zakonska zaštita potrošača; između dva fizička lica važe opšta pravila obligacionog prava.

Sistem nema automatsko storniranje razmene. Ako se dogovorite da se nešto vrati, izvodi se kao novo, dobrovoljno ažuriranje evidencije POENA u suprotnom smeru, kao nova razmena nazad.

Ako nešto pođe naopako, prvo pokušaj da rešiš direktno sa drugom stranom. U početnoj fazi možeš zatražiti i dobrovoljno, neobavezujuće posredovanje Fondacije; ako dogovor ne uspe, ostaje sudska zaštita po opštim pravilima. Uz to, sa svog profila možeš podneti prigovor Fondaciji u roku od 30 dana od prepisa; to nije posredovanje između vas dvoje nego odluka o zapisu, i ako po njoj Fondacija poništi prepis, POEN ti se vraća u celini.`,
      },
    ],
  },
  {
    id: "poen-zrno",
    naslov: "POEN i ZRNO",
    pitanja: [
      {
        id: 1,
        pitanje: `Šta je POEN i ima li vrednost u dinarima?`,
        odgovor: `POEN je zapis u evidenciji Protokola da si zajednici dao nešto vredno, kroz razmenu sa drugima, potvrdu stvarnosti, operativni doprinos, socijalni program, donaciju ili pokroviteljstvo.

POEN postoji samo u Protokolu. Zapis se vodi na Protokolu i ne može se izneti iz sistema. POEN nema oblik u kome bi postojao izvan njega. Ne držiš ga i ne možeš ga predati nikome van sistema.

POEN nije novac. Nije sredstvo plaćanja, nije elektronski novac, nije digitalna imovina, nije finansijski instrument i ne predstavlja dug Fondacije prema tebi. Nema vrednost van sistema: ne menja se za dinare, ne preprodaje se i Fondacija ga ne otkupljuje.

Ima li onda vrednost u dinarima? Nema kurs, i Fondacija nijedan odnos POENA prema dinaru ne objavljuje. Iznos u oglasu određuješ ti sam. Većina ljudi se pri tome snađe tako što pođe od cene koju za to dobro ili uslugu ionako zna — to je tvoja procena, važi za taj oglas, drugu stranu ne obavezuje i nije kurs. Fondacija taj račun ne radi umesto tebe: ne evidentira po njemu doprinos, ne određuje po njemu nijedan iznos iz pravilnika, ne garantuje nikakvu vrednost POENA i ne otkupljuje ga.`,
      },
      {
        id: 2,
        pitanje: `Mogu li unovčiti POEN ili ga prodati za novac?`,
        odgovor: `Ne. POEN ne možeš zameniti za dinare, stranu valutu ni bilo koje drugo sredstvo plaćanja. Fondacija ga ne otkupljuje i ne menja.

POEN i ne postoji izvan Protokola, nema oblik u kome bi mogao da izađe iz sistema.

Ono što možeš: prepisati ga drugom korisniku za obavljenu razmenu dobara, usluga ili znanja (uključujući Pijacu) ili njime upisati ZRNO.

Prodaja POENA za novac zabranjena je Uslovima korišćenja i povlači suspenziju ili isključenje. Fondacija u takvim zamenama ne posreduje i za njih ne odgovara, a svaki prepis ostaje trajno zabeležen u evidenciji.`,
      },
      {
        id: 3,
        pitanje: `Da li POEN ističe?`,
        odgovor: `Ne. POEN ostaje u tvom zapisu dok ga ne prepišeš drugom korisniku ili dok ne obrišeš nalog.

Rok trajanja nije isključen zauvek: mehanizam „starenja“ POENA, koji bi podsticao cirkulaciju umesto gomilanja, bio bi suštinska izmena sistema. O tome bi odlučivalo Gornje Kolo glasanjem. Fondacija to ne može uvesti sama.`,
      },
      {
        id: 4,
        pitanje: `Šta je ZRNO i čemu služi?`,
        odgovor: `ZRNO je zapis odvojen od POENA. Dok POEN beleži šta si dao zajednici, ZRNO beleži tvoj položaj u njoj, i iz tog položaja proizlazi glas u odlukama o pravilima sistema.

Kako se stiče. ZRNO upisuješ POENOM koji već imaš. Koliko je POENA potrebno za jedno ZRNO pokazuje koeficijent. ZRNO možeš i otpisati.

Ko upisuje. ZRNO upisuje učesnik: član Kola i član bez potvrde. Član Kola upisom postaje čuvar Kola. Član bez potvrde može da upiše ZRNO i da otpiše slobodno ZRNO, ali upisom ne postaje čuvar Kola: ZRNO ne aktivira, nema glas i ne delegira ga dok ga ne potvrdi član Kola. Čuvar Kola kome padne mesto u Kolu postaje korisnik i zadržava upisano ZRNO, ali zamrznuto: ne aktivira ga, ne otpisuje ga i ne delegira glas dok ponovo ne bude potvrđen. Ako mu padne samo potvrda, a uvođenje u Kolo važi, postaje član bez potvrde, a aktivno ZRNO prelazi u slobodno.

Kako daje glas. Samo čuvar Kola upisano ZRNO aktivira (zaključava), i tek aktivno ZRNO nosi glasačku moć. Glas može da delegira samo čuvar Kola, i to samo drugom čuvaru Kola. Glas ne raste pravolinijski: broj glasova je kvadratni koren broja aktivnih ZRNA, pa ko ima sto puta više ZRNA ima deset puta više glasova, a ne sto. Tako niko ne može da preuzme odlučivanje gomilanjem.

Šta ZRNO nije. Nije udeo, nije akcija, nije digitalna imovina, nije finansijski instrument. Ne nosi kamatu ni dividendu, niko ti po njemu ništa ne isplaćuje, i ne prepisuje se drugom korisniku. Ono pokazuje tvoj položaj u zajednici, ne koliko ti ona duguje.`,
      },
      {
        id: 5,
        pitanje: `Kakav je odnos prema porezu i fiskalizaciji?`,
        odgovor: `Fondacija ti ne obračunava porez i ne izdaje fiskalne račune u tvoje ime. POEN nije novac ni zakonsko sredstvo plaćanja, a prepis POENA nije platna transakcija u smislu propisa o platnim uslugama.

POEN nije prihod u novcu. Ne isplaćuje se, ne menja se za dinare i ne može izaći iz Protokola. Fondacija ne objavljuje odnos POENA prema dinaru; ako ga ljudi pri dogovoru porede sa dinarskom cenom, to je njihova procena, a ne cena ni kurs. POEN nema tržište na kome bi se utvrđivala vrednost van sistema.

Ali KOLO ti ne ukida obaveze koje već imaš. Ako povremeno daš viškove ili nekome pomogneš, ništa se ne menja. Ako od prodaje robe ili pružanja usluga živiš, važe isti propisi kao i van sistema, bez obzira na to da li se dogovor beleži u POENIMA.

Fondacija ne pruža poreski savet i ti si odgovoran za svoje poreske obaveze. Ako redovno pružaš robu ili uslugu, posavetuj se sa knjigovođom.`,
      },
      {
        id: 40,
        link: { href: "/kako-funkcionise#pravila", label: "Pravna pozicija" },
        pitanje: `Da li je ovo neka piramida ili kripto?`,
        odgovor: `Nije ni jedno ni drugo.

Zašto nije piramida. Piramidalna šema radi tako što pridošlice plaćaju da bi raniji zaradili. Ovde se ulaz ne plaća, POEN se ne kupuje za novac i ne postoji nivo ispod tebe. Kad nekoga potvrdiš ili uvedeš u Kolo, upiše se po 1.000 POENA i tebi i njemu, jednokratno i isto za oboje. Od svega što ta osoba kasnije radi ti nemaš ništa; provizije od tuđih doprinosa nema.

Zašto nije kripto. Kriptovaluta postoji na blokčejn mreži, ima tržišnu cenu i kupuje se i prodaje na berzi. POEN nije token, ne postoji izvan Protokola, ne menja se za dinare i nema tržišnu cenu.

Odakle POEN dolazi. Niko ne može sam sebi upisati POEN. Nastaje jedino tako što ga Protokol upiše po unapred zapisanom pravilu, i svaki upisani POEN ima isti takav minus u evidenciji Protokola. Zato je količina POENA u opticaju uvek tačno jednaka zbiru zabeleženih doprinosa. Ništa ne nastaje ni iz čega.

POEN je zapis o tome šta si dao zajednici, bliži knjigovodstvenoj stavci nego novcu. Vrednost je u mreži ljudi koji razmenjuju rad, dobra i znanje, ne u spekulaciji.`,
      },
      {
        id: 51,
        pitanje: `Šta ako sistem propadne ili Fondacija prestane sa radom, gubim li sve?`,
        odgovor: `Da budemo otvoreni: ako sistem jednog dana stane, tvoj zapis prestaje da vredi kao mogućnost razmene. To jeste gubitak. Ali nije novčani gubitak, i evo zašto.

Nemaš novčano potraživanje, ni sada, ni tada. POEN i ZRNO nisu novac koji leži na tvoje ime ni dug koji ti Fondacija duguje. To su zapisi o tome koliko si doprineo i razmenio u zajednici. Zato nema iznosa koji bi ti neko bio dužan da isplati, ni dok sistem radi, ni ako prestane.

Ono što si već razmenio ostaje tvoje. Rad, dobra i znanje koji su prešli iz ruke u ruku dogodili su se stvarno i njih niko ne poništava. Isto važi i za ljude koje si upoznao.

Fondacijom se niko ne može okoristiti. Po Statutu, u slučaju prestanka rada preostala imovina ne pripada osnivačima ni bilo kome privatno, nego se predaje drugoj fondaciji, zadužbini ili udruženju sa istim ili sličnim ciljevima, sa prednošću za one koji rade u duhu solidarne ekonomije. Niko se ne može obogatiti gašenjem sistema.

Sistem može da nastavi i bez nas. Kod na kome KOLO radi je javan i objavljen na GitHub-u, svako ga može uzeti, pokrenuti i nastaviti. Softver je pod licencom AGPL-3.0, a sadržaj pod CC BY-SA. Ako konkretna organizacija nestane, alat i znanje ostaju. Zajedničko dobro ne prestaje gašenjem jedne organizacije.`,
      },
      {
        id: 52,
        pitanje: `Čemu gornja granica od 1.000.000 ZRNA ako se ZRNO ne može trgovati? Postoji li staking ili prinos?`,
        odgovor: `Čemu granica. Ukupno postoji 1.000.000 ZRNA i taj broj se ne može ni povećati ni smanjiti. Zato se odlučivanje ne može razvodniti: niko ne može naknadno da napravi nova ZRNA i time obezvredi glas onih koji su već tu. Sa svakim upisom broj ZRNA raspoloživih u Protokolu opada — ali istovremeno opada i broj POENA u opticaju, jer POEN kojim je ZRNO upisano odlazi nazad Protokolu. Zato sam upis koeficijent ne pomera.

ZRNO se ne trguje. Ne prepisuje se drugom korisniku i ne izlazi iz Protokola. Ono beleži tvoj položaj u zajedničkom dobru, iz kojeg proizlazi glas u Gornjem Kolu.

Zaključavanje nije staking. Upisano ZRNO zaključavaš samo zato da bi se obračunao tvoj glas, tek aktivno ZRNO nosi glasačku moć. Zaključavanje ti ne donosi ni POEN, ni kamatu, ni bilo kakvu naknadu. Koeficijent se menja isto, bez obzira na to da li ti je ZRNO zaključano ili slobodno; zaključavanjem se ne dobija ništa osim glasa.

Otpis ne vraća isti broj POENA, i to ti kažemo otvoreno. Otpis ide po koeficijentu koji važi u tom trenutku, a koeficijent se do tada mogao promeniti — u oba smera. Raste kad se u sistemu upišu novi POENI kroz kanale doprinosa. Pada kad se POENI ponište — kad neko ugasi nalog, kad se POEN poništi preuzimanjem iz kolektivne nabavke ili kad se raskine prijateljstvo u dečjem prostoru.

Tvoj sopstveni upis i otpis ga ne pomeraju. Pri upisu se istovremeno umanjuju i broj POENA u opticaju i broj raspoloživih ZRNA, pa količnik ostaje isti. Zato ovde nema ni trgovanja ni pravog trenutka za ulazak i izlazak: razlika, ako je bude, aritmetička je posledica onoga što je ceo sistem u međuvremenu zabeležio. Niko je ne obećava, niko je ne garantuje i nijedno lice je ne isplaćuje.

Ali to nije prihod. Razlika postoji isključivo u POENIMA, koji nemaju vrednost van sistema, ne menjaju se za dinare i ne mogu izaći iz Protokola. Nemaš dobit ni prihod u novcu, imaš drugačiji zapis u evidenciji doprinosa. Zato ZRNO ne upisuješ zato što bi ti se to isplatilo, nego zato što hoćeš glas u odlukama.`,
      },
      {
        id: 53,
        pitanje: `Je li upis po potvrdi (1.000 POENA) provizija za regrutovanje ili airdrop koji mogu da farmam?`,
        odgovor: `Ne. To nije provizija za regrutovanje, nije airdrop i ne može se farmati.

Kad te neko potvrdi ili uvede u Kolo, beleži se po 1.000 POENA tebi i njemu. Iznos je fiksan, isti za obe strane i jednokratan po osobi. Onaj ko je potvrdio tvog potvrđivača ne dobija ništa: nema nivoa i ništa ne teče naviše.

Upis čeka tvoj prvi doprinos, a taj uslov je isti za svakoga. Ne postoji da bi se nagradilo dovođenje ljudi, nego da POEN ne bi nastajao bez traga stvarnog učešća. Provizija se, naprotiv, plaća za dovedenu glavu i raste sa onim što dovedeni potroši.

Upis nije naknada ni za rad ni za podatke: kad Fondacija utvrdi da je uslov ispunjen, Protokol ga upisuje po unapred zapisanom pravilu.

Farmanje nema smisla:

• POEN se ne unovčava.

• Jedan čovek, jedan nalog, a potvrda počiva na ličnom poznanstvu.

• Ko potvrdi ili uvede nekoga ko nije stvarna osoba, gubi tih 1.000 POENA, a lažna potvrda po pravilu povlači isključenje.

• Ista osoba ne donosi upis dvaput: kad člana bez potvrde kasnije potvrdi član Kola, novi POEN se ne upisuje.`,
      },
      {
        id: 54,
        pitanje: `Osnivački kanal upisuje do 2.400.000 POENA „osnivačima“, nije li to vrh koji sebi upiše novac?`,
        odgovor: `Ne. Osnivački kanal ne upisuje novac. POEN nije novac, a iznos ne donosi ni vlasništvo ni moć nad sistemom.

Šta se beleži. Rad obavljen pre nego što je platforma postojala: projektovanje sistema, pisanje pravila, pravna i organizaciona priprema, izrada dokumentacije. Uz to i svi finansijski i drugi troškovi nastali do otvaranja računa Fondacije, njih su osnivači snosili lično, jer Fondacija tada nije ni postojala kao subjekt koji može da plati. Sve se to odvijalo dok nije bilo gde da se zabeleži, pa se beleži naknadno, kao i svaki drugi doprinos.

Isti status kao svaki drugi POEN. Nekonvertibilan, bez vrednosti van sistema, bez potraživanja prema Fondaciji. Troškovi se ne refundiraju: osnivači nisu dobili nazad ni dinar od onoga što su uložili, nego zapis u istoj evidenciji u kojoj se beleži i svaki drugi doprinos.

Osnivača je pet i krug je zatvoren. Utvrđeni su unapred internim aktom Fondacije i nijedna kasnija odluka ne može proširiti taj krug.

Tempo nije proizvoljan. Jedan korak od 24.000 POENA upisuje se tek kad ukupan broj POENA u sistemu poraste za narednih 100.000, a u taj prag ulazi i sam osnivački upis. To znači da dok kanal traje, osnivački doprinos čini 24% svakog novoupisanog POENA. Kad se kanal isprazni na 2.400.000, sistem je porastao za 10.000.000 POENA i kanal se trajno i neopozivo zatvara. Odatle nadalje udeo osnivača samo pada, jer sistem nastavlja da raste a kanal više ne radi.

Veći saldo ne daje srazmerno veću moć. U Gornjem Kolu se glasa po kvadratnom korenu: broj glasova je kvadratni koren broja aktivnih ZRNA. Ko ima sto puta više ZRNA ima deset puta više glasova, a ne sto, pa ni najveći saldo POENA ne daje kontrolu nad odlukama.

Šta možeš da proveriš. Ukupan upisan iznos, broj izvršenih koraka i preostalo do granice dostupni su na stranici Osnivački doprinos. Registar osnivača sa pseudonimima i udelima, uključujući to kome je koliko upisano, dostupan je učesnicima.`,
      },
    ],
  },
  {
    id: "podrzi",
    naslov: "Podrži KOLO",
    pitanja: [
      {
        id: 23,
        pitanje: `Kako radi donacija Fondaciji i koliko POENA dobijam?`,
        odgovor: `Donirati može svako ko ima nalog, i pre ulaska u Kolo: uplatom u dinarima na račun Fondacije, karticom ili IPS QR kodom.

Kad Fondacija utvrdi prijem uplate, Protokol ti automatski upisuje POEN: iznos donacije pomnožen koeficijentom evidencije donacija. Koeficijent je 1,00 i raste za 0,10 na svakom pragu ukupnog iznosa tvojih donacija (5.000, 10.000, 20.000, 50.000 dinara i dalje, do 5.000.000 dinara). Najviši je nivo 11, sa koeficijentom 2,00. Kad donacijom pređeš prag, novi koeficijent važi za celu tu donaciju, a dostignuti nivo ostaje trajno. To nije obračunski koeficijent ZRNA.

Koeficijent raste jer veći pojedinačan doprinos ima veći značaj za zajednicu: njime se potreba podmiri odjednom. To nije popust, jer se donacijom ništa ne kupuje i ne stiče se nikakvo pravo prema Fondaciji.

Ime i prezime javnog donatora stoji u listi donacija, uz iznos i datum, bez pseudonima. Anonimna donacija stoji samo iznosom i datumom i po njoj se POEN ne upisuje. Kupovina i prodaja POENA među korisnicima zabranjena je Uslovima korišćenja.

Donacija je nepovratna. Pokriva troškove rada Fondacije, a višak ide u kolektivne nabavke.`,
      },
      {
        id: 74,
        pitanje: `U kojoj valuti doniram, mogu li poslati evre iz inostranstva?`,
        odgovor: `Možeš, donacija se daje uplatom na račun Fondacije, u dinarima ili u drugoj valuti, dakle i evrima iz inostranstva. Plaćanje karticom i IPS QR kodom kroz platformu radi samo u dinarima.

POEN se upisuje po istim pravilima kao za svaku donaciju: iznos × koeficijent evidencije donacija, koji raste sa kumulativnim iznosom do najviše 2,00 (detaljno u pitanju o donacijama). Iznos u stranoj valuti računa se u dinarskoj protivvrednosti.

Fondacija na zahtev izdaje potvrdu o donaciji u skladu sa zakonom.`,
      },
      {
        id: 24,
        pitanje: `Šta su Pokrovitelji i koja je razlika u odnosu na donaciju?`,
        odgovor: `Pokrovitelji su firme, preduzetnici, udruženja i nosioci registrovanih poljoprivrednih gazdinstava koji podržavaju rad Fondacije novcem ili dobrima i uslugama.

Pokrovitelj nema sopstveni nalog: POEN se upisuje na nalog onoga ko je pokrovitelja upisao i podneo prijavu (zakonskog zastupnika, vlasnika ili ovlašćenog lica), odnosno samog preduzetnika ili nosioca gazdinstva. Za novčano pokroviteljstvo nije potrebno da bude u Kolu, a prijavu pokroviteljstva dobrima i uslugama podnosi samo učesnik. Upisuje se samo njemu, i kad firma ima više vlasnika. Koeficijent je 1,00 i za novac i za dobra i usluge, bez obzira na iznos: tabela nivoa važi samo za lične donacije, jer pokrovitelj nema svoj zapis, pa se doprinos upisuje onome ko je podneo prijavu. Zbir donacija firme, odnosno gazdinstva, vodi se odvojeno od tvojih ličnih donacija i ne podiže tvoj nivo. Najmanja prijava je 10.000 RSD.

Firma ne može da ima nalog i ne dobija POEN: nalog se otvara na čoveka, a stvarnost čoveka potvrđuje drugi čovek. Vlasnik firme može da ima svoj nalog kao fizičko lice, nezavisno od pokroviteljstva.

Svi pokrovitelji javno su prikazani na stranici Pokrovitelji, radi transparentnosti i javnog priznanja doprinosa.

Pokroviteljstvo dobrima i uslugama je donacija bez naknade. Fondacija ne izdaje račune i ne pruža poreski savet. Za predaju dobara i pružanje usluga po vaučeru ne izdaje se fiskalni račun ni elektronska faktura; davalac realizaciju dokumentuje potvrdom o predaji koju preuzima sa platforme. Davalac koji je obveznik PDV-a dužan je da na predata dobra i pružene usluge bez naknade obračuna PDV u skladu sa propisima.`,
      },
    ],
  },
  {
    id: "gazdinstva",
    naslov: "Gazdinstva",
    pitanja: [
      {
        id: 103,
        pitanje: `Šta je gazdinstvo u KOLO sistemu i zašto je važno?`,
        odgovor: `Najvažnije što se u zajednici razmenjuje je hrana. Svaki kilogram krompira, litar mleka ili tegla meda uzeti od komšije ostaju u našem kraju, zajedno sa radom koji je u njih uložen i poverenjem između onoga ko proizvodi i onoga ko jede.

Gazdinstvo je domaćinstvo koje proizvodi hranu ili poljoprivredne proizvode i nudi ih na Pijaci. Gazdinstvo nije korisnik sistema i nema svoj zapis u Protokolu: njegovi članovi učestvuju svaki sa svog naloga, a doprinos gazdinstva evidentira se u ličnom zapisu svakog člana.

Odobrena gazdinstva su prikazana na mapi domaćih proizvođača, pa svako može da vidi ko u njegovom mestu ili okolini proizvodi hranu i šta nudi.`,
        link: { href: "/gazdinstva", label: "Mapa domaćih proizvođača" },
      },
      {
        id: 104,
        pitanje: `Da li moram da budem upisan u Registar poljoprivrednih gazdinstava?`,
        odgovor: `Ne. Upis u Registar poljoprivrednih gazdinstava nije uslov. Ako imaš baštu, voćnjak, kokoške, košnice ili praviš domaću hranu i nudiš je drugima, gazdinstvo se može prijaviti i kad nije upisano. Uslovi su isti za upisano i neupisano gazdinstvo, a izvod iz registra se ne prilaže.

Gazdinstvo prijavljuje svaki punoletni korisnik. Član Kola ga prijavljuje kao nosilac ili kao član, sa drugim članovima. Član bez potvrde ili korisnik prijavljuje samo kao nosilac, bez drugih članova; korisniku prijava otvara put na spisak onih koji žele da ih neko nazove (broj telefona i pristanak za spisak ostavlja posebno). Kad ga član Kola sa spiska pozove, isti razgovor važi i za odobrenje gazdinstva. Kad te potvrdi član Kola, gazdinstvo može da primi i članove.

Ako je gazdinstvo upisano, u prijavu upisuješ broj poljoprivrednog gazdinstva (BPG). Izvod iz registra se ne prilaže. Odobrenje gazdinstva ne potvrđuje stvarnost nosioca; ona se potvrđuje samo u lancu potvrda. Fondacija podatke u registru ne proverava, a u ostalom se oslanja na tvoju izjavu. BPG se ne prikazuje drugim korisnicima.

Upis u registar gazdinstvu otvara put ka državnim podsticajima, sajmovima i programima ruralnog razvoja, pa vredi razmisliti o njemu. To je odluka gazdinstva.`,
      },
      {
        id: 105,
        pitanje: `Kako se prijavljuje gazdinstvo i koliko košta?`,
        odgovor: `Prijava je besplatna i radi se sa ličnog naloga: Gazdinstva → Prijavi gazdinstvo.

U prijavu upisuješ naziv gazdinstva, BPG ili oznaku da gazdinstvo nije registrovano, mesto, adresu i tačku na mapi, svoju ulogu (nosilac ili član), opis onoga što proizvodite i kako, i broj telefona nosioca, odnosno svoj kad nosilac nema nalog. Daješ izjavu da su podaci tačni. Ako uz tvoj nalog još nije upisano ime i prezime, prijava ga traži; ono ide u evidenciju identiteta uz tvoj nalog i ne prikazuje se drugima.

Zatim postavljaš najmanje tri oglasa hrane ili poljoprivrednih proizvoda u ime gazdinstva i, ako gazdinstvo može da ima članove, pozivaš članove gazdinstva koje lično znaš. Kad je sve spremno, prijavu šalješ Fondaciji na pregled.

Pre odobrenja Fondacija razgovara sa nosiocem, telefonom ili uživo, da se uveri da gazdinstvo postoji i proizvodi ono što je navedeno; sa ostalim članovima ne razgovara. Razgovor nije potvrda stvarnosti i u njemu se ne traže dokumenti. Broj telefona vidi samo Fondacija, koristi ga samo za taj razgovor i briše ga kad odluči o prijavi; broj za spisak onih koji žele da ih neko nazove ostavlja se posebno. Ako nešto nedostaje, prijava se vraća na dopunu sa objašnjenjem šta treba dopuniti.`,
      },
      {
        id: 106,
        pitanje: `Ko može biti član gazdinstva?`,
        odgovor: `Član gazdinstva je punoletan korisnik koji stalno ili povremeno radi na gazdinstvu. Gazdinstvo može prijaviti nosilac ili član gazdinstva.

Gazdinstvo prima članove kad ga je prijavio član Kola. Gazdinstvo koje je prijavio korisnik ili član bez potvrde prima ih tek kad podnosioca potvrdi član Kola koji ga lično zna, odnosno Fondacija.

Članove poziva svaki član gazdinstva koji je član Kola, i to ljude koje lično zna, upisom pseudonima; za pozvanog odgovara onaj ko ga je pozvao. Pozvani pristupa prihvatanjem poziva, uz izjavu da radi na gazdinstvu i svoje ime i prezime. Pristupanje se odobrava kad je pozvani član Kola; ako nije, potvrdi ga onaj ko ga je pozvao ili drugi član Kola koji ga lično zna. Kad je gazdinstvo već odobreno, svako novo pristupanje pregleda Fondacija.

Gazdinstvom na platformi jednako upravljaju svi članovi gazdinstva koji su članovi Kola, a na isti način njime upravlja i podnosilac koji je korisnik ili član bez potvrde. Član kome prestane potvrda gubi pravo upravljanja i pozivanja dok ponovo ne bude potvrđen; gazdinstvo radi dalje, a njegovo članstvo i doprinos se ne diraju. Za izjavu o tačnosti podataka odgovara jedno lice: nosilac upisanog gazdinstva, odnosno podnosilac kod gazdinstva van registra. Ako je upisano gazdinstvo prijavio član, nosilac pri pristupanju preuzima izjavu.

Lice može biti član samo jednog gazdinstva. Maloletan nalog ne može biti član gazdinstva niti biti pozvan.`,
      },
      {
        id: 107,
        pitanje: `Koliki je doprinos gazdinstva i kada se evidentira?`,
        odgovor: `Kad Fondacija odobri gazdinstvo, članovima se beleži doprinos po redu pristupanja: prvom članu 5.000 POENA, a drugom do šestog članu po 2.000 POENA. Gazdinstvo sa jednim članom ima ukupno 5.000, sa tri člana 9.000, a sa šest ili više članova 15.000 POENA. Članu koji se pridruži kasnije doprinos se beleži kad Fondacija odobri njegovo pristupanje.

Zabeležen doprinos još nije zapis POENA. Evidentira se u tvom zapisu kad su ispunjena oba uslova: da si objavio oglas kojim nešto nudiš, bilo koji, u ime gazdinstva ili lični, i da si u Kolu, potvrđen ili uveden. Računa se i oglas koji si objavio pre pristupanja, pa i onaj koji je u međuvremenu istekao; ako ti je doprinos za prvi oglas već upisan, doprinos gazdinstva se upisuje odmah, čim uđeš u Kolo. Do tada ga vidiš na ekranu POEN kao zabeležen doprinos.

Doprinos gazdinstva lice ima najviše po jednom gazdinstvu. Ko istupi iz gazdinstva koje i dalje postoji, zadržava svoj doprinos i u drugom gazdinstvu ga ne stiče ponovo. Ako ti je doprinos poništen ili otpisan zato što je gazdinstvo prestalo, možeš ga ponovo steći u drugom gazdinstvu, osim kad je gazdinstvo prestalo zbog lažne izjave.`,
      },
      {
        id: 108,
        pitanje: `Šta znači oznaka DOMAĆE na oglasu?`,
        odgovor: `Kad član gazdinstva postavlja oglas, bira da li ga postavlja u ime gazdinstva ili kao lični oglas, na primer kad nudi uslugu ili znanje koje nije vezano za gazdinstvo.

Oglas u ime odobrenog gazdinstva nosi oznaku DOMAĆE i vodi na profil gazdinstva. Oznaka znači samo to da je oglas postavljen u ime gazdinstva koje je pristupilo sistemu. Fondacija ne proverava i ne jemči poreklo, kvalitet ni bezbednost ponuđenog; za to odgovara onaj ko je oglas postavio.

Iznos u oglasu određuje onaj ko oglas postavlja. POEN iz razmene uvek ide u lični zapis onoga ko je oglas postavio; gazdinstvo nema zajednički zapis.`,
      },
      {
        id: 109,
        pitanje: `Da li se na mapi vidi moja adresa?`,
        odgovor: `Vidi se. Odobreno gazdinstvo je na mapi tačkom na tačnoj lokaciji, uz naziv, mesto, opis, oglase i pseudonime članova, a adresa se ispisuje uz izjavu koju daješ u prijavi. Prikaz je uslov doprinosa gazdinstva i traje dok gazdinstvo postoji; to nije pristanak koji se povlači. Tačku po adresi traži servis OpenStreetMap, a možeš je pomeriti klikom na mapu.

Prikaz prestaje kad gazdinstvo prestane, na primer brisanjem. Obrisati ga može lice koje odgovara za izjavu o tačnosti podataka, ako u gazdinstvu nema drugih članova ni neiskorišćenih vaučera. Pri svakom prestanku gazdinstva zabeležen doprinos gazdinstva se poništava, a evidentiran otpisuje svima koji su tada članovi, i kad im zapis ode u minus. Minus nije dug: popunjava ga prvi POEN koji stigne. Pre brisanja vidiš koliko će ti biti otpisano. Doprinos za prvi oglas se ne dira.`,
      },
      {
        id: 110,
        pitanje: `Šta ako je moje gazdinstvo prijavio neko drugi?`,
        odgovor: `Javi se Fondaciji. Prijava tuđeg gazdinstva bez znanja njegovih članova smatra se lažnom izjavom.

Kad Fondacija utvrdi da je izjava lažna, odobrenje gazdinstva se poništava i gazdinstvo prestaje: zabeležen doprinos se poništava, a evidentiran doprinos gazdinstva otpisuje se svima koji su bili članovi u periodu na koji se lažna izjava odnosi, i onima koji su u međuvremenu istupili, i to i kada im zapis time postane negativan. Isključenje iz sistema izriče se samo onome ko je lažnu izjavu dao ili za nju znao; ostalima se samo otpisuje doprinos gazdinstva. Svako na koga se to odnosi dobija obaveštenje i može podneti prigovor.`,
      },
    ],
  },
  {
    id: "zadruge",
    naslov: "Zadruge",
    pitanja: [
      {
        id: 111,
        pitanje: `Šta je zadruga u KOLO sistemu?`,
        odgovor: `Zadruga je mesto gde komšije zajedno primaju i dele ono što proizvedu: doneseš krompir sa svoje bašte, zadruga ti prepiše POEN, a krompir izdaje zadrugaru ili drugoj zadruzi.

Pravno, zadruga je pravno lice upisano u registar po Zakonu o zadrugama koje sa Fondacijom ima zaključen ugovor o saradnji. U sistemu ima sopstveni zapis u Protokolu i deluje na svom lokalitetu, u jednom naselju: prima dobra na raspodelu, izdaje ih zadrugarima i drugim zadrugama, i objavljuje zadatke za zajednicu.

Zadrugom upravljaju zadrugari, preko organa iz zakona i zadružnih pravila. Fondacija nema pravo glasa, predlaganja ni saglasnosti u organima zadruge, i ne stiče nikakvo pravo na njenu imovinu. Zadruga ne postaje vlasnik nijednog dela zajedničkog dobra.`,
      },
      {
        id: 112,
        pitanje: `Kako se osniva zadruga u mom mestu?`,
        odgovor: `Prva zadruga u mestu može se upisati u sistem kad u tom mestu ima najmanje 50 učesnika, članova Kola i članova bez potvrde. U njenom osnivanju učestvuje Fondacija, organizacionom i stručnom podrškom. Napredak svog mesta vidiš na stranici Zadruge.

Kad u mestu već deluje zadruga, svaka sledeća može da se upiše u sistem na inicijativu učesnika, sa najmanje pet zadrugara; uslov od 50 učesnika za nju ne važi.

U oba slučaja zadruga se najpre upisuje u registar po Zakonu o zadrugama, a sa Fondacijom zaključuje ugovor o saradnji. Mesto kome pripadaš je ono koje si naveo u svom nalogu.`,
      },
      {
        id: 113,
        pitanje: `Ko može da bude zadrugar?`,
        odgovor: `Zadrugar može biti isključivo učesnik, član Kola ili član bez potvrde, koga je zadruga primila u članstvo po svojim pravilima. Maloletni nalog se ne povezuje sa zadrugom, a jedno lice može biti zadrugar samo u jednoj zadruzi.

Zadruga Fondaciji dostavlja tvoje ime i prezime i pseudonim, samo ako si na to pristao. Ime i prezime se upisuje u evidenciju identiteta i ne prikazuje se drugim korisnicima.

Zadrugar ima sva prava koja ima u Kolu, a uz njih prava u okviru svoje zadruge: učešće u raspodeli, u zadružnom doprinosu i u korišćenju opreme i zemljišta zadruge. Svojstvo zadrugara ne daje nijedno dodatno ovlašćenje u sistemu.`,
      },
      {
        id: 114,
        pitanje: `Kako izgleda razmena preko zadruge?`,
        odgovor: `Doneseš zadruzi dobro, na primer krompir sa svoje bašte. Zadruga ga prima na raspodelu u ime i za račun zadrugara i pri prijemu ti prepisuje POEN iz svog zapisa. Taj POEN je tvoj: trošiš ga u zadruzi, kod drugih korisnika, ili ga zadržavaš.

Zadruga dobro izdaje zadrugaru ili drugoj zadruzi, i pri izdavanju se POEN vraća u zapis zadruge. Na isti način zadruga beleži korišćenje svoje opreme, mehanizacije ili zemljišta, usluge i zadatke za zajednicu.

Broj POENA za prijem, izdavanje i rad određuje zadruga, svojim organima i po svojim pravilima. Fondacija taj iznos ne određuje, ne preporučuje i ne odobrava.`,
      },
      {
        id: 115,
        pitanje: `Odakle zadruzi POEN u zapisu?`,
        odgovor: `Kad broj zadrugara dostigne pragove iz Pravilnika o zadrugama, Protokol upisuje nove zapise POENA u zapis zadruge. Svaki prag se upisuje samo jednom: ako broj zadrugara kasnije padne, ništa se ne otpisuje, a ponovno dostizanje istog praga ne upisuje se ponovo.

Zapis zadruge ne može biti negativan, pa zadruga raspolaže samo onim što u njemu postoji. Iz zapisa i u njega POEN ide isključivo uz osnov: prijem dobra, izdavanje dobra, zadružni doprinos, korišćenje opreme ili zemljišta i usluga. Slobodnog prepisa nema, ni prema korisniku ni prema drugoj zadruzi.`,
      },
      {
        id: 116,
        pitanje: `Ko vidi zapise zadruge?`,
        odgovor: `Zapise zadruge vide svi učesnici, pod nazivom zadruge, a zadrugari se u njima prikazuju pod pseudonimom. Broj zadrugara i stanje zapisa vidljivi su na stranici zadruge.

Ime i prezime zadrugara nije javno. Vidi ga samo administratorski tim, a ti ga vidiš u izvozu svojih podataka.`,
      },
      {
        id: 117,
        pitanje: `Šta se dešava ako zadruga prestane da učestvuje u sistemu?`,
        odgovor: `Učešće prestaje otkazom ugovora o saradnji ili brisanjem zadruge iz registra. Tada se zapis zadruge zatvara, a POEN koji je u njemu evidentiran poništava se protivzapisom u korist Protokola. POEN nije imovina zadruge i ne prenosi se ni na koga.

POEN u zapisima zadrugara i svih drugih korisnika ostaje netaknut.`,
      },
    ],
  },
  {
    id: "programi",
    naslov: "Socijalni programi i zadaci zajednice",
    pitanja: [
      {
        id: 16,
        pitanje: `Šta su socijalni programi i koji postoje?`,
        odgovor: `Neki oblici učešća ne mogu se evidentirati kao pojedinačne razmene, pa za njih postoje socijalni programi.

Socijalni programi pokrivaju grupe čije je učešće u zajednici stalno i razuđeno: Podrška majkama (i drugim primarnim starateljima), Podrška starijima, Posebna podrška (učesnici u otežanim okolnostima) i Podrška studentima. Kad se tvoja prijava potvrdi, Protokol ti automatski upisuje POEN na dnevnom nivou, bez prijavljivanja pojedinačnih aktivnosti. To nije socijalna pomoć ni naknada, to je način da i takvo učešće dobije ravnopravno mesto u sistemu.

Pored njih, u Programe spadaju i doprinosi: doprinos sadržaju platforme (prvi oglas i gazdinstvo), operativni doprinos (rad za zajedničko dobro kroz objavljene zadatke) i dečji doprinos (učešće dece u dečjem prostoru, opisano u sekciji „Deca i roditelji“). Svaki je objašnjen u posebnom pitanju.

Prijava na socijalne programe otvorena je učesnicima, i članu bez potvrde. Maloletni korisnik nema pravo na programe podrške. Ispunjenost uslova pre odobrenja potvrđuje član Kola koji te lično zna, odnosno Fondacija.`,
      },
      {
        id: 17,
        pitanje: `Ko se može prijaviti za Podršku majkama?`,
        odgovor: `Majka ili drugi primarni staratelj deteta, program prati brigu o detetu, ne isključivo majčinstvo.

Iznos zavisi od broja i uzrasta dece: osnova po detetu opada kako dete raste, a množilac raste sa svakim narednim detetom, pa veće porodice dobijaju srazmerno veću podršku. Tačni iznosi i primeri dati su u posebnom pitanju o iznosima Podrške majkama.

Prijava ide kroz platformu: za svako dete uneseš samo datum rođenja, bez prilaganja dokumenata.`,
      },
      {
        id: 79,
        pitanje: `Koliko POEN dnevno po detetu donosi Podrška majkama i kako broj i uzrast dece utiču na iznos?`,
        odgovor: `Za svako dete polazna dnevna osnova je 2.000 POENA, umanjena za 100 POENA za svaku godinu uzrasta deteta, podrška postepeno opada kako dete raste i prestaje kad dete napuni 20 godina.

Broj dece povećava ukupan iznos, ali ne prostim sabiranjem: svako naredno dete nosi veći množilac. Redni broj deteta određuje se po rođenju, od najstarijeg, a ne po redu kojim su datumi uneti. Prvo dete ×1,00, drugo ×1,20, treće ×1,50, četvrto ×2,00, peto ×3,00, šesto ×4,50, sedmo ×6,00, osmo ×8,00, deveto ×10,00. Tako veće porodice dobijaju srazmerno veću podršku.

Primer: jedno dete od 3 godine ((2.000 − 300) × 1,00 = 1.700 POENA dnevno. Isto dete kao treće po redu) (2.000 − 300) × 1,50 = 2.550 POENA dnevno.

Podrška se upisuje automatski na dnevnom nivou dok status traje, bez prijavljivanja pojedinačnih aktivnosti. Kao i ostali socijalni programi, deli zajednički dnevni okvir, pa se u danima sa mnogo doprinosa iznosi mogu srazmerno umanjiti. Parametri su uređeni Pravilnikom o programima podrške i mogu se menjati njegovom izmenom.`,
      },
      {
        id: 61,
        pitanje: `Šta je „Podrška starijima“, ko ima pravo i kako se prijavljujem?`,
        odgovor: `Podrška starijima je socijalni program za učesnike od 50 godina naviše.

Dnevni iznos raste sa godinama: 1.000 POENA sa navršenih 50, uvećano za 100 POENA za svaku narednu godinu, učesnik od 65 godina ima 2.500 POENA dnevno, a učesnik od 80 godina 4.000 POENA dnevno.

Prijava ide kroz platformu i otvorena je učesnicima; POEN se potom upisuje automatski, na dnevnom nivou, bez prijavljivanja pojedinačnih aktivnosti. Kao i ostali socijalni programi, ni ovo nije socijalna pomoć ni naknada. Protokol time priznaje učešće koje se ne vidi kroz pojedinačne razmene. Bliži uslovi i način potvrđivanja godina uređeni su Pravilnikom o programima podrške.`,
      },
      {
        id: 18,
        pitanje: `Šta je Posebna podrška i kako se prijavljuje?`,
        odgovor: `Posebna podrška je program za učesnike u otežanim okolnostima. Dva su osnova.

Prvi je smanjena sposobnost: imaš rešenje nadležnog organa kojim je utvrđen stepen invaliditeta — uključujući rešenje komisije za procenu radne sposobnosti — ili zbog akutne odnosno hronične bolesti ne možeš ili si bitno ograničen da učestvuješ. Ako je lice sa smanjenom sposobnošću punoletan učesnik, pravo je njegovo; ako nije učesnik, pravo ostvaruje onaj koji se o njemu neposredno stara; ako je maloletno, pravo ostvaruje roditelj, do njegovog punoletstva. Po jednoj takvoj situaciji ide jedan iznos — osnov samo određuje u čiji zapis.

Drugi je gubitak doma: izgubio si dom ili imovinu potrebnu za život u nepogodi, požaru, poplavi ili prinudnoj raseljenosti. Taj osnov traje dvanaest meseci od događaja i gasi se sam.

Pri prijavi se traži samo da rešenje POSTOJI — ne njegov sadržaj, ne stepen, ne ocena radne sposobnosti, ne dijagnoza, ne medicinska dokumentacija. Kod bolesti i kod gubitka doma dokaz je tvoja izjava, bez ijedne isprave, uz potvrdu člana Kola koji te lično zna, odnosno Fondacije.

Iznos je fiksan i iznosi 2.000 POENA dnevno, isti po svim osnovima. Ovaj program se ne isključuje sa Podrškom majkama — prima se i jedno i drugo, i kada je oba povodom istog deteta.

Učesnici vide da primaš Posebnu podršku i koliko, jer se evidencija zajednice može proveriti. Ali NE vide po kom osnovu — a program obuhvata i smanjenu sposobnost i gubitak doma, pa naziv ništa ne kazuje. Osnov vidiš ti i lice koje u Fondaciji obrađuje prijavu.`,
      },
      {
        id: 96,
        pitanje: `Šta je program Podrška studentima i na koga se odnosi?`,
        odgovor: `Podrška studentima je socijalni program za učesnike koji su redovno upisani u visokoškolsku ustanovu. Učenici osnovne i srednje škole nisu obuhvaćeni, a maloletni korisnik nema pravo na programe podrške.

Dnevni iznos je fiksan i iznosi 2.000 POENA, dok prijava važi. Pravo se proverava svakih šest meseci od odobrenja: istekom tog roka prijava prestaje da važi, a ako i dalje studiraš, podnosiš novu prijavu sa novom izjavom.

Prijava ide po istim pravilima kao za druge socijalne programe: kroz platformu, bez prilaganja dokumenata. Dokaz je tvoja izjava pod punom odgovornošću, u kojoj navodiš ustanovu i godinu studija; potvrda o upisu i uverenja se ne traže. Neistinita izjava povlači mere iz Uslova korišćenja i prestanak upisa po ovom programu.`,
      },
      {
        id: 62,
        pitanje: `Šta je „dokaz statusa“ za socijalni program, moram li da prilažem izvod ili dokument deteta?`,
        odgovor: `Ne prilažeš nijedan dokument, ništa se ne skenira niti šalje.

Podatke uneseš u formu na platformi: za Podršku majkama, na primer, samo datum rođenja svakog deteta. Iznos koji ti se upisuje zavisi od broja i uzrasta dece.

Ispunjenost uslova zatim, bez uvida u unete podatke, potvrđuje član Kola koji te lično zna: onaj ko te je potvrdio ili drugi član Kola koji te poznaje. Član Kola koji te je uveo u Kolo ili potvrdio posle razgovora telefonom i član bez potvrde to ne mogu; ako takvog člana Kola nema, ispunjenost uslova utvrđuje Fondacija. Prijavu potom odobrava Fondacija. Uneti podaci nisu javni: vidi ih samo onaj ko obrađuje prijavu. Reč je o osetljivim podacima, pa se obrađuju samo uz tvoj izričit pristanak, a pristanak možeš povući u svakom trenutku, tada prestaje i automatski upis POENA.

Bliži uslovi kojima se potvrđuje status za svaku grupu uređeni su Pravilnikom o programima podrške, objavljenim na sajtu.`,
      },
      {
        id: 20,
        pitanje: `Mogu li biti u više programa istovremeno?`,
        odgovor: `Da, ako ispunjavaš uslove za više programa, majka koja studira može biti i u Podršci majkama i u Podršci studentima. Svaki program se prijavljuje posebno.

Socijalni programi i operativni doprinos dele zajednički dnevni okvir od 10% ukupnog broja POENA u sistemu, kako se ne bi previše POENA upisalo odjednom, kad doprinosa ima više nego što okvir prima, dnevni iznosi se srazmerno umanjuju. Doprinos sadržaju platforme i dečji doprinos ne ulaze u taj okvir.`,
      },
      {
        id: 97,
        pitanje: `Šta je doprinos sadržaju platforme?`,
        odgovor: `Doprinos sadržaju platforme Protokol upisuje za dve stvari.

Prvi oglas: kad objaviš prvi uredan oglas kojim nudiš dobro ili uslugu, upisuje ti se 1.000 POENA, i to kad Fondacija odobri oglas. Ovaj doprinos se upisuje jednom po nalogu, bez obzira na to koliko oglasa kasnije objaviš.

Gazdinstvo: kad tvoje gazdinstvo bude odobreno, odnosno kad mu pristupiš, beleži ti se doprinos gazdinstva (iznos po članu određuje Pravilnik o gazdinstvima, čl. 15). Upisuje se kad objaviš oglas kojim nešto nudiš i kad uđeš u Kolo, potvrdom ili uvođenjem.

Razmena sama po sebi ne upisuje nov POEN: kad nekome prepišeš POEN, on samo prelazi sa tvog zapisa na njegov. Ništa ne prijavljuješ.`,
      },
      {
        id: 19,
        pitanje: `Kako radi operativni doprinos?`,
        odgovor: `Operativni doprinos evidentira rad za zajedničko dobro koji bi inače ostao nevidljiv, volontiranje, brigu o starijima, rad u zajedničkim aktivnostima, kreativne doprinose.

Sve teče kroz objavljen zadatak: neko ga objavi, učesnik (član Kola ili član bez potvrde) se prijavi i izvrši ga, izvršenje se potvrdi, i tek tada Protokol upisuje POEN. U početnoj fazi zadatke objavljuje i izvršenje potvrđuje Fondacija; po aktivaciji upravljanja zajednicom zadatke objavljuju i Gornje Kolo i čuvari Kola, a izvršenje potvrđuju čuvari Kola.

Nema tarife po satu. Uz zadatak stoji predloženi POEN, ali to je težinski orijentir, ne cena, stvarno upisani iznos zavisi od toga koliko doprinosa tog dana deli zajednički dnevni okvir, pa se iznosi srazmerno raspoređuju.`,
      },
      {
        id: 63,
        pitanje: `Postoji li program za nezaposlene ili opštu finansijsku nuždu?`,
        odgovor: `Trenutno ne postoji poseban program za nezaposlenost ni za opštu finansijsku nuždu.

Socijalni programi pokrivaju tačno određene grupe čije je učešće u zajednici stalno i razuđeno, pa se ne može evidentirati kroz pojedinačne razmene: majke i primarne staratelje, starije, osobe sa invaliditetom i one koji se školuju. Nezaposlenost ni siromaštvo nisu među tim grupama, socijalni programi nisu socijalna pomoć ni naknada, nego način da razuđeno učešće dobije ravnopravno mesto u sistemu, a ne oblik podrške zbog finansijskog stanja.

Ako si u finansijskoj nuždi, put do POENA je isti kao za sve: razmena dobara i usluga sa drugima, doprinos za prvi oglas i operativni doprinos, rad za zajedničko dobro kroz objavljene zadatke.

Nove kvalifikovane grupe mogu se dodati kasnije: u prvoj fazi o tome odlučuje Fondacija, a po aktivaciji upravljanja zajednicom. Gornje Kolo. Konkretni budući programi još nisu razrađeni.`,
      },
      {
        id: 64,
        pitanje: `Je li ovo posao? Imam li prihod, ugovor ili zagarantovan mesečni iznos?`,
        odgovor: `Ne. Ovo nije posao u smislu radnog odnosa i nemaš zagarantovan iznos.

Ti odlučuješ da li ćeš se prijaviti na zadatak, kako ćeš ga izvršiti i kojim tempom, i možeš odustati u svakom trenutku, bez posledica. Niko ti ne naređuje i nemaš obavezu da radiš. Zato to nije radni odnos: nema nadređenog, nema obaveze rada, nema plate.

Ne postoji ni ugovor po kome se za urađeno X upisuje tačno Y POENA. Tvoj doprinos i upis POENA su dva odvojena akta: ti doprineseš, a Protokol potom po pravilima upiše POEN. Iz toga ne nastaje potraživanje prema Fondaciji, nemaš od koga da „naplatiš“.

POEN nije plata ni naknada. Uz objavljen zadatak stoji predloženi POEN, ali to je težinski orijentir, ne zagarantovan iznos: koliko će se stvarno upisati zavisi od toga koliko je doprinosa tog dana ušlo u zajednički dnevni okvir, koji se srazmerno deli. Ono što tog dana ne stane u okvir ne prenosi se za sutra i ne stvara obavezu sistema prema tebi.

Ovo je dobrovoljan doprinos zajednici koji se beleži, ne posao sa zagarantovanom mesečnom zaradom.`,
      },
    ],
  },
  {
    id: "deca",
    naslov: "Deca i roditelji",
    pitanja: [
      {
        id: 85,
        pitanje: `Od koliko godina dete može da ima nalog i kako se otvara?`,
        odgovor: `Donja granica je sedam godina. Nalog se otvara na dva načina.

Prvi: ti ga otvaraš iz svog naloga i izjavljuješ da je to tvoje dete. Za to ne moraš da budeš u Kolu. Ti odgovaraš za ono što dete objavi i uradi.

Drugi: dete ga otvara samo i unosi tvoj imejl. Tebi tada stiže poruka u kojoj možeš da preuzmeš nalog, da označiš da to nije tvoje dete ili da nalog obrišeš. Druge dve radnje moguće su i bez prijave na platformu, jer tvoju adresu može upisati bilo ko. U poruci stoji samo pseudonim deteta, nikada ime.

Link iz poruke važi sedam dana. Ako nalog niko ne preuzme u roku od četrnaest dana, briše se. Ako poruka nije stigla, dete u svom profilu ima šestocifreni kod koji možeš uneti umesto linka.

Datum rođenja upisuješ ti, prilikom preuzimanja. Proveri ga pre potvrde, jer se posle upisa ne menja, a od njega zavisi kada nalog prelazi u punoletni.

Nalog deteta je u jednom od tri stanja, a na profilu deteta piše na šta se čeka.

Dete na čekanju: nalog još niko nije preuzeo. Dete ima profil i sklapa prijateljstva uživo, a oglase vidi kao posetilac; nema Pričaonicu, poruke ni oglase.

Dete sa roditeljem: ti si nalog otvorio ili preuzeo. Dete piše svojim prijateljima u Pričaonici i porukama, bira školu i vidi oglase, bez pseudonima oglašivača osim kod prijatelja. Ne objavljuje oglase i ne prepisuje POEN, ni sa tobom.

Dete Kola: ti si član Kola i član Kola koji te lično zna potvrdio je da imaš to dete. Tada nalog radi u punom obimu dečjeg prostora.`,
      },
      {
        id: 101,
        pitanje: `Dete se registrovalo kao punoletno, može li to da se ispravi?`,
        odgovor: `Može. Nalog se ne briše: Fondacija ga na zahtev prevodi u dečji nalog i vezuje za tebe kao roditelja. Piši nam na kontakt@ekolo.rs sa adrese svog naloga i navedi pseudonim deteta.

Nalog time dobija sve zaštite dečjeg režima, zatvoren profil, tvoj prekidač za komunikaciju i razmenu sa punoletnim korisnicima, prijateljstva i dečju Pričaonicu. Gubi ono što po tom režimu detetu ne pripada: potvrde i uvođenja u Kolo koja je primio i dao padaju, ZRNO se otpisuje, a POEN koji mu je Protokol upisao kroz kanale (potvrde, doprinos sadržaju platforme, donacije, programi) se poništava. POEN koji su mu ljudi prepisali ostaje, prepis ne stvara nove POENE nego seli zapis, a dete ga sme imati. Prestaje i članstvo u gazdinstvu: zabeležen doprinos gazdinstva se poništava, a evidentiran otpisuje. Oglasi, poruke i istorija ostaju. Prevedeni nalog je dete sa roditeljem, a dete Kola postaje pod istim uslovima kao svaki drugi.

Zapis pri tom sme da ode u minus, i to sa obe strane: i detetu koje je POEN već potrošilo, i onome ko ga je potvrdio pa mu se ta potvrda poništava. Minus nije dug i ne naplaćuje se, prvi POEN koji pristigne ga popunjava.

Radnja je nepovratna. U punoletni nalog prelazi sam, na dan osamnaestog rođendana, po datumu rođenja koji tada upišeš.`,
      },
      {
        id: 86,
        pitanje: `Nisam u Kolu. Mogu li da preuzmem nalog svog deteta?`,
        odgovor: `Možeš. Za otvaranje i preuzimanje naloga deteta ne moraš da budeš u Kolu.

1. Otvori svoj nalog. Link iz poruke vodi pravo na registraciju.

2. Preuzmi dete i izjavi da je tvoje. Nalog time postaje dete sa roditeljem: dete piše svojim prijateljima, bira školu i vidi oglase, ali ne objavljuje oglase i ne prepisuje POEN, ni sa tobom.

3. Neka te potvrdi član Kola koji te lično zna. Ako te je u Kolo uveo poznanik koji još nije potvrđen ili član Kola posle razgovora telefonom, član si bez potvrde, i tvoje dete time još ne postaje dete Kola.

4. Zatraži potvrdu da imaš dete. Kad si član Kola, zahtev šalješ za svako dete posebno. Vide ga članovi Kola na stranici Potvrde, uz tvoj pseudonim i bez ikakvih podataka o detetu, a potvrđuje ga član Kola koji te lično zna. Drugi roditelj istog deteta potvrdu ne daje, a ni član bez potvrde. Zahtev nema rok i ne donosi POEN nikome. Ako potvrda ne stigne, ništa ti se ne oduzima: tvoj položaj i zapis ostaju, a nalog deteta ostaje dete sa roditeljem.

Kad je postojanje deteta potvrđeno, nalog postaje dete Kola: oglasi, prepisi i POEN iz prijateljstava. Prijateljstva se u međuvremenu sklapaju i beleže, a POEN po njima upisuje se kad su oba deteta deca Kola.`,
      },
      {
        id: 100,
        pitanje: `Dete je zaboravilo lozinku, šta sad?`,
        odgovor: `Dva su puta.

Ako je dete u svom profilu unelo sopstvenu imejl adresu i potvrdilo je klikom na link koji mu je stigao na tu adresu, samo traži novu lozinku kao i svaki drugi korisnik. Ta adresa služi isključivo za to, obaveštenja na nju ne idu.

Ako dete nema svoju adresu, novu lozinku mu postavljaš ti, iz svog profila. Staru lozinku ne moraš da znaš, a dete dobija obaveštenje o novoj lozinki.`,
      },
      {
        id: 87,
        pitanje: `Mogu li oba roditelja da imaju pristup?`,
        odgovor: `Mogu. Drugi roditelj ulazi istim putem kao i prvi i dobija ista ovlašćenja: isti uvid, isto brisanje i iste prekidače. To znači i da svaki od dvoje može sam obrisati detetov nalog.

Detetu je dovoljno da jedan roditelj bude član Kola kome je potvrđeno da ima to dete, pa da nalog bude dete Kola.

Ako lice koje je nalog otvorilo ili preuzelo nije roditelj tog deteta, to Fondaciji može prijaviti dete sa svoje početne („Ovo nije moj roditelj“), drugi roditelj ili bilo koji drugi korisnik sa profila deteta. Fondacija tu vezu odmah zaustavlja dok ne odluči: lice za to vreme nema uvid ni ovlašćenja roditelja. Zaustavljanje nije mera i ne znači da je izjava neistinita. Kad utvrdi da lice nije roditelj, Fondacija vezu ukida, potvrda postojanja deteta data tom licu prestaje da važi, a licu se izriče isključenje iz sistema; ako dete ostane bez roditelja, nalog se ne briše nego postaje dete na čekanju, a rok od četrnaest dana za preuzimanje teče iznova. U suprotnom veza ponovo radi. Licu na koje se prijava odnosi Fondacija ne otkriva ko je prijavu podneo, ni tokom postupka ni posle odluke. Na odluku i podnosilac i to lice mogu podneti prigovor.`,
      },
      {
        id: 88,
        pitanje: `Može li odrasla osoba da priđe mom detetu?`,
        odgovor: `Nezavisno od tvojih podešavanja važi sledeće. Detetov profil je zatvoren za sve punoletne korisnike, a ne samo za neprijavljene posetioce: ko otvori adresu detetovog profila, vidi objašnjenje zašto je zatvoren i ko mu je roditelj, i ništa više, ni stanje, ni školu, ni oglase, ni prijateljstva. Dete se ne pojavljuje ni u pretrazi korisnika. Prijateljstvo se sklapa isključivo skeniranjem QR koda uživo, a kod traje pet minuta i nema broj koji bi se mogao izdiktirati telefonom, pa se prijateljstvo ne može sklopiti na daljinu.

Razgovor sa punoletnim osobama otvara samo roditeljski prekidač u detetovom profilu. Dok je ugašen, odrasla osoba detetu ne može pisati. Ni upaljen prekidač profil ne otvara, on uređuje razgovor i razmenu, ne uvid u nalog. Prekidač deluje tek od navršenih petnaest godina, i samo kad je nalog dete Kola: mlađe dete sa odraslima ne razgovara ni uz tvoju saglasnost.

Ako ga upališ, primenjuju se tri pravila:

• ti čitaš taj razgovor, ali u njemu ne pišeš;

• punoletnom sagovorniku stoji vidljiv natpis da razgovor čita roditelj;

• obaveštenje ti stiže pri prvom javljanju u novom razgovoru, a ne pri svakoj poruci.

Razgovore koje dete vodi sa drugom decom ne čitaš. O tome u sledećem pitanju.`,
      },
      {
        id: 89,
        pitanje: `Šta ja vidim od detetovog naloga?`,
        odgovor: `Uvid ti obuhvata:

• spisak prijatelja sa datumima kada je prijateljstvo sklopljeno;

• spisak razgovora, dakle s kim i koliko, bez sadržaja poruka;

• celu istoriju prepisa POENA;

• sve oglase koje je dete objavilo.

Razgovore između dece ne čitaš. Razlog je taj što u svakom takvom razgovoru učestvuje i tuđe dete, čiji roditelj na uvid nije pristao. Izuzetak je razgovor deteta sa punoletnom osobom, koji čitaš.

Prijateljstva ne odobravaš. Sklapaju se uživo, skeniranjem koda, a ti dobijaš obaveštenje i vidiš spisak.

U svakom trenutku možeš ukloniti oglas, ugasiti prekidač za razgovor sa odraslima i obrisati nalog.`,
      },
      {
        id: 90,
        pitanje: `Šta ako dete dobije neprimerenu poruku?`,
        odgovor: `Reci detetu da ti odmah javi. Ti si prvi kome se javlja, ne platforma.

U Pričaonici dete vidi samo poruke svojih prijatelja. Zato je najbrži potez raskid prijateljstva, čim ga dete raskine, te poruke više ne vidi. Raskid može samo dete, a ako je POEN za to prijateljstvo bio upisan, oba deteta gube po 500.

Ako je poruka takva da treba da je vidimo, piši nam na kontakt@ekolo.rs sa pseudonimom deteta i vremenom poruke. Fondacija poruku može ukloniti i može zatvoriti nalog sa koga je poslata.`,
      },
      {
        id: 91,
        pitanje: `Odgovaram li ja za ono što dete uradi?`,
        odgovor: `Da. Za ono što dete objavi i uradi na platformi odgovaraš ti.

Odgovornost se odnosi na ono što je javno i što možeš videti: oglase, prepise POENA, ponašanje prema drugima. Za sve to imaš uvid i dugme. Privatan razgovor dvoje dece nije tvoj teren, jer nije ni samo tvog deteta.

U svakom trenutku možeš ukloniti oglas, ugasiti razgovor sa odraslima ili obrisati nalog.`,
      },
      {
        id: 92,
        pitanje: `Kako dete stiče POEN?`,
        odgovor: `Na tri načina, i za sva tri nalog mora biti dete Kola: bar jedan roditelj je član Kola i potvrđeno mu je da ima to dete.

Prijateljstvo. To je jedini način na koji se detetu POEN upisuje: za svako sklopljeno prijateljstvo upisuje se po 500 POENA svakom detetu, kad su oba naloga deca Kola. Dok se čeka, obojici stoji natpis da 500 čeka: to je zabeležen doprinos, koji još nije upisan i ne ulazi u stanje. Prijateljstvo dvoje dece istog roditelja sklapa se normalno i vidi se u Pričaonici, ali ne nosi POEN.

Pijaca. Dete Kola objavljuje oglase pod istim uslovima kao ostali korisnici. Kad mu drugo dete za ono što mu je dalo prepiše POEN, to je prepis: postojeći POEN prelazi sa jednog zapisa na drugi.

Prepis od roditelja. Ti i dete Kola prepisujete POEN jedno drugom u oba pravca; veći prepis sa detetovog zapisa čeka tvoje odobrenje. Dok je nalog dete sa roditeljem, prepisa nema ni u jednom smeru. Prepisom se ne stvara nov POEN, nego se postojeći prenosi.

POEN nije novac i nema vrednost izvan sistema.`,
      },
      {
        id: 99,
        pitanje: `Šta je izbor škole i šta donosi ranglista?`,
        odgovor: `Dete u svom profilu bira školu koju pohađa, sa spiska škola u Srbiji, kad ga je roditelj preuzeo; dete na čekanju školu ne bira. Izbor nije uslov za korišćenje naloga, nalog radi i bez njega.

Iz izbora nastaju tri liste: dve nacionalne, po broju uključene dece i po udelu u broju upisanih učenika, odvojeno za osnovne i srednje škole, i jedna unutar same škole, po tekućem stanju POENA. U brojanje ulazi samo dete Kola, a listu unutar škole vidi samo dete Kola iz te iste škole.

Mesto na listi ne donosi POEN. Ni izbor škole, ni prvo mesto, ni bilo šta drugo na listi. Lista pokazuje gde je ko, i ništa preko toga.

Škola se može promeniti najviše jednom u trideset dana. Prva postavka nije promena i ne pokreće taj rok. Istorija ranijih izbora se ne čuva, a škola se briše sa punoletstvom i pri gašenju naloga.`,
      },
      {
        id: 93,
        pitanje: `Šta biva ako se prijateljstvo raskine?`,
        odgovor: `Prijateljstvo raskida samo dete, bilo koje od dvoje. Ti kao roditelj tu radnju nemaš; ostaju ti uklanjanje oglasa, prekidač za razgovor sa odraslima i brisanje naloga.

Pri raskidu se otpisuje po 500 POENA obema stranama, i onoj koja raskida i onoj koja nije. Pre potvrde stoji upozorenje na to, pa se raskid ne dešava slučajno.

Ako je taj POEN u međuvremenu potrošen, zapis odlazi u minus. To nije dug: ništa se ne naplaćuje i ne traži nazad, a prvi POEN koji stigne popunjava ga.

Ako deca kasnije ponovo sklope prijateljstvo, POEN se upisuje ponovo.`,
      },
      {
        id: 94,
        pitanje: `Šta se dešava na osamnaesti rođendan?`,
        odgovor: `Obaveštenje o prelasku stiže mesec dana ranije, i detetu i svim njegovim prijateljima. Na sam dan dešava se sledeće.

Poništava se POEN zarađen prijateljstvima, po 500 za svako prijateljstvo za koje je upis izvršen. Dete sa trideset takvih prijateljstava gubi 15.000 POENA. Otpis pogađa i drugu stranu: svakom od tih prijatelja otpisuje se po 500 za to prijateljstvo, i zbog toga obaveštenje ide i njima. Kao i pri raskidu, zapis sme u minus i to nije dug.

Prijateljstva se brišu. Njihovo mesto zauzima lanac potvrda.

Nalog ulazi u lanac potvrda automatski, preko prvog roditelja po redu povezivanja koji je član Kola: to je potvrda i mladi postaje član Kola. Ako takvog roditelja nema, a neki roditelj je član bez potvrde, prvi takav ga uvodi u Kolo i on postaje član bez potvrde. Ako nijedan roditelj nije u Kolu, postaje korisnik. Drugi roditelj ne preduzima ništa. Kad ga roditelj potvrdi ili uvede u Kolo, po 1.000 POENA upisuje se odmah, i njemu i tom roditelju, bez čekanja na prvi doprinos.

Ostalo se ne dira: POEN koji si prepisao detetu, POEN iz razmene na Pijaci, oglasi i istorija ostaju.`,
      },
      {
        id: 95,
        pitanje: `Kako da obrišem detetov nalog?`,
        odgovor: `Nalog deteta možeš obrisati u svakom trenutku iz svog naloga.

Brisanjem se poništavaju svi POENI na detetovom zapisu i uklanjaju se njegovi oglasi. Prijateljstva prestaju, ali se prijateljima ništa ne otpisuje: svako zadržava svojih 500.

Ako ti je stigla poruka o nalogu koji nisi otvorio i dete nije tvoje, u toj poruci imaš dve radnje koje ne traže prijavu na platformu: da označiš da to nije tvoje dete i da nalog obrišeš. Označavanje bez brisanja ostavlja nalog da i dalje koristi tvoju adresu do isteka roka, pa je brisanje sigurnije.

Nalog koji niko ne preuzme briše se sam posle četrnaest dana.

Podrobnije o svemu ovome piše Pravilnik o učešću dece, na stranici Pravilnik.`,
      },
    ],
  },
  {
    id: "porezi-legalnost",
    naslov: "Porezi i legalnost",
    pitanja: [
      {
        id: 47,
        link: { href: "/kako-funkcionise#pravila", label: "Pravna pozicija" },
        pitanje: `Da li je iko od regulatora (NBS, Poreska, Poverenik) potvrdio da je ovo legalno, ili samo Fondacija tako tvrdi?`,
        odgovor: `Ne. Trenutno ne postoji pisano mišljenje regulatora koje potvrđuje legalnost, ni Narodna banka, ni Poreska uprava, ni Poverenik nisu izdali takvu potvrdu.

Ono na čemu sistem počiva nije nečija dozvola, nego sopstvena pravna konstrukcija. POEN po pravilima nije novac, valuta, elektronski novac, platno sredstvo, finansijski instrument ni digitalna imovina, i ne može se pretvoriti u nešto sa vrednošću van sistema. Ažuriranje evidencije POENA između korisnika nije platna transakcija u smislu propisa o platnim uslugama. Za samu razmenu dobara i usluga važe opšta pravila obligacionog prava, a sporovi se vode pred nadležnim sudom. Pravna pozicija sistema, dakle, proizlazi iz toga kako je sistem postavljen, a ne iz spoljne saglasnosti.

Što se poreza tiče, poreski i fiskalni tretman ovih razmena ne ukida tvoje postojeće obaveze ako obavljaš delatnost. Fondacija ne pruža poreski savet, svoje poreske obaveze snosiš ti.

Za zaštitu ličnih podataka uvek imaš pravo da se obratiš Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti.

Izmene propisa ili novo tumačenje regulatora rizik su koji treba da imaš u vidu pre nego što se uključiš.`,
      },
      {
        id: 50,
        pitanje: `Po čemu se POEN razlikuje od elektronskog novca i nije li donacija u stvari skrivena kupovina POENA?`,
        odgovor: `Elektronski novac ima tri osobine: dobiješ ga kad uplatiš novac, predstavlja tvoje potraživanje prema izdavaocu i možeš ga u svakom trenutku vratiti i dobiti novac nazad. POEN ne ispunjava nijednu od te tri.

POEN se ne upisuje po uplati novca, nego po doprinosu zajednici ili po potvrđenom statusu u nekom od programa. Fondacija ti po osnovu POENA ništa ne duguje i ne otkupljuje ga. POEN ne možeš pretvoriti u dinare ni u bilo koje sredstvo plaćanja van sistema.

Donacija nije skrivena kupovina POENA zato što su to dva pravno nezavisna akta. Prvi je tvoja nepovratna donacija Fondaciji. Drugi je automatski upis POENA koji Protokol izvodi po unapred objavljenim pravilima.

Iz donacije ne nastaje tvoje potraživanje, ni pravo da od Fondacije tražiš upis POENA, ni pravo da tražiš novac nazad. Upis POENA nije protivusluga za donaciju: između ta dva akta ne postoji ugovor, ni dogovor po kome bi za urađeno dobio određen broj POENA.

Fondacija ne objavljuje odnos POENA prema dinaru; iznos u oglasu određuje onaj ko oglas postavlja. Fondacija nikakvu vrednost POENA ne garantuje i ne menja POEN za novac.`,
      },
      {
        id: 98,
        pitanje: `Da li je POEN digitalna imovina (virtuelna valuta ili digitalni token) po Zakonu o digitalnoj imovini?`,
        odgovor: `Nije. Zakon o digitalnoj imovini poznaje dve vrste digitalne imovine (virtuelnu valutu i digitalni token) i POEN ne ispunjava odlike nijedne.

Virtuelna valuta je digitalni zapis vrednosti koji se kupuje, prodaje i prenosi, i kojim se plaća ili ulaže. POEN se ne može kupiti ni prodati: ne nabavlja se novcem, nego nastaje upisom po unapred objavljenim pravilima, kao zapis o doprinosu. Nema vrednost van sistema, nema tržište ni cenu, ne može se preneti van Protokola i Fondacija ga ne otkupljuje. Donacija nije kupovina POENA, to su dva pravno nezavisna akta, objašnjena u posebnom pitanju.

Digitalni token je zapis koji nosi neko imovinsko pravo, udeo, potraživanje, pravo na prinos ili uslugu. POEN ne nosi nijedno: iz njega ne nastaje potraživanje prema Fondaciji ni prema bilo kome, ne daje udeo, kamatu ni prinos, i ne obavezuje nikoga (ni Fondaciju ni druge korisnike) da ti za njega nešto pruži. On beleži činjenicu doprinosa, kao upis u matičnoj knjizi, a upis u knjizi nije imovina.

Iz istih razloga POEN nije ni finansijski instrument. Isto važi i za ZRNO: ne prepisuje se drugom korisniku, nema tržište i ne nosi imovinsko pravo, više o tome u sekciji „POEN i ZRNO“.

Kao i sve ovde, ovo je pravna konstrukcija sistema, a ne potvrda regulatora, rizik izmene propisa ili tumačenja opisan je u prvom pitanju ove sekcije.`,
      },
      {
        id: 48,
        pitanje: `Redovno prodajem viškove (med, rakija, zimnica) ili pružam zanatske usluge, treba li mi račun, PDV ili registrovana delatnost? Ko snosi porez?`,
        odgovor: `KOLO ti ne obračunava porez i ne izdaje fiskalne račune u tvoje ime, ali ti ne ukida obaveze koje već imaš po opštim propisima.

Razmena dobara i usluga među korisnicima nije postavljena kao klasična prodaja, a prenos POENA nije plaćanje novcem u smislu propisa o platnim uslugama. POEN je evidencija doprinosa, ne novac. Zato Protokol ažurira evidenciju POENA, ali ne vodi tvoje poreske knjige niti izdaje račune.

To, međutim, ne znači da si oslobođen propisa. Ako robu ili uslugu pružaš redovno i u obimu koji liči na delatnost, na tebe se primenjuju opšti propisi kao i van platforme. Za pojedina dobra (poput alkoholnih pića ili hrane) postoje i posebni propisi o proizvodnji i prometu, i oni važe i ovde.

Fondacija ne pruža poreski savet i nije strana u tvojoj razmeni: za ispunjenje, kvalitet i rizik odgovarate ti i druga strana po opštim pravilima obligacionog prava, a svoje poreske obaveze snosiš ti.`,
      },
      {
        id: 49,
        pitanje: `Utiče li učešće u KOLO sistemu i POEN na moju penziju ili socijalna davanja?`,
        odgovor: `Sa strane sistema, ne. POEN nije novac, nije zarada ni prihod: to je interni zapis u evidenciji o tome šta si dao zajednici, i ne može se pretvoriti u sredstvo sa vrednošću van sistema. Fondacija ti ni po jednom osnovu ne isplaćuje novac: upisom ne primaš ni novac ni stvar, ništa ne prelazi iz njene imovine u tvoju, a zapis se ne može unovčiti, ustupiti ni naplatiti. Zato po tom osnovu i nema iznosa izraženog u novcu.

Ako ti se POEN upisuje kroz neki od socijalnih programa (na primer kao primarni staratelj, kao stariji ili kao student), ni to nije naknada — njome se ne plaća nijedan rad ni usluga i od tebe se zauzvrat ne traži ništa. To je automatsko ažuriranje evidencije koje takvom učešću daje ravnopravno mesto u sistemu, a program se sprovodi u ostvarivanju ciljeva Fondacije iz njenog statuta.

Treba, međutim, razlikovati POEN od onoga što radiš van sistema. Sve što naplaćuješ u dinarima tvoja je delatnost za koju važe opšti propisi, i to može imati posledice po tvoj status, zavisno od toga šta i u kom obimu radiš.

Fondacija ne pruža poreski ni pravni savet. Ako primaš penziju ili neko socijalno davanje, a nisi siguran kako se ono slaže sa onim što radiš, najsigurnije je da proveriš sa nadležnom službom (PIO) ili sa knjigovođom.`,
      },
      {
        id: 77,
        pitanje: `Da li je Fondacija obveznik propisa o sprečavanju pranja novca (AML/KYC) i identifikuje li donatore?`,
        odgovor: `Fondacija nije finansijska institucija i ne posluje novcem korisnika. POEN nije novac, a razmena među korisnicima nije platna transakcija. Po svojoj delatnosti Fondacija nije među obveznicima koje propisi o sprečavanju pranja novca i finansiranja terorizma nabrajaju.

Donacije se ipak ne primaju anonimno. Primaju se kroz bankarski sistem (uplatom na račun Fondacije ili karticom) sa računa čiji je vlasnik identifikovan, pa identifikaciju uplatioca i proveru porekla sredstava sprovodi banka po svojim propisima. Pokrovitelji su pravna lica i preduzetnici koji se identifikuju ugovorom.

Podatke o donacijama Fondacija čuva u skladu sa propisima o finansijskom izveštavanju i čini ih dostupnim nadležnim organima (uključujući Poresku upravu i Upravu za sprečavanje pranja novca) kad to zakon nalaže.`,
      },
    ],
  },
  {
    id: "zastite",
    naslov: "Zaštite i upravljanje",
    pitanja: [
      {
        id: 26,
        pitanje: `Ko kontroliše KOLO?`,
        odgovor: `Trenutno (Faza 1) sve odluke donosi KOLO Fondacija preko Upravnog odbora.

Kad ukupan broj upisanih POENA dostigne 1.000.000, aktivira se Gornje Kolo, telo koje čine čuvari Kola koji su aktivirali ZRNO, i koje o ključnim sistemskim pitanjima odlučuje glasanjem po kvadratnom korenu.

Od tog trenutka Fondacija ima servisnu ulogu: o pravilima Protokola ne odlučuje po sopstvenom nahođenju, nego Upravni odbor sprovodi odluke Gornjeg Kola i pri tome ne ceni njihovu celishodnost. Odluku može odbiti samo iz razloga koje Pravilnik izričito navodi (suprotnost zakonu ili Statutu, pitanje van nadležnosti Gornjeg Kola), uz obrazloženje koje se objavljuje. O dinarskim sredstvima Gornje Kolo upućuje preporuke, na koje Upravni odbor obrazloženo odgovara.`,
      },
      {
        id: 27,
        pitanje: `Šta sprečava zloupotrebu od strane admina ili osnivača?`,
        odgovor: `Više strukturnih zaštita radi paralelno.

Zero-sum princip, svaki upis POENA uvećava minus Protokola, pa niko ne može stvoriti POEN ni iz čega.

Dnevni okvir programa, socijalni programi i operativni doprinos zajedno ne smeju dnevno upisati više od 10% ukupnog broja POENA u sistemu.

Deterministički upisi. Protokol nema diskrecione odluke: sve je u kodu, po unapred objavljenim pravilima, a kod je javno objavljen i svako ga može proveriti.

Transparentnost, evidencija doprinosa je pseudonimna, istorija zapisa se ne prepravlja (svaka ispravka ide novim zapisom), vidljiva je učesnicima, a neregistrovani vide samo zbirne brojeve.

I konačno, aktivacija Gornjeg Kola: od tada pravila Protokola usvajaju čuvari Kola kroz Gornje Kolo, a Upravni odbor Fondacije ih sprovodi.`,
      },
      {
        id: 28,
        pitanje: `Šta je Gornje Kolo i kada se aktivira?`,
        odgovor: `Gornje Kolo je telo koje čine čuvari Kola koji su aktivirali ZRNO, najviše telo odlučivanja o pravilima sistema. Nije skupština koja se bira: čuvar Kola u njega ulazi aktiviranjem ZRNA, a izlazi kad mu nijedno ZRNO više nije aktivno ili kad mu padne potvrda. Član bez potvrde kome je upisano ZRNO nije u Gornjem Kolu dok ga ne potvrdi član Kola.

Pošto se broj aktivnih ZRNA stalno menja, sastav Gornjeg Kola i glasačka moć svakog čuvara utvrđuju se za svaki dan posebno i važe samo tog dana. Glas nosi moć dana u kome je dat; ko glas izmeni dok glasanje traje, izmenjen glas nosi moć dana izmene. Čuvar Kola može svoj glas delegirati samo drugom čuvaru Kola. Korisnik kome je ZRNO zamrznuto nije u Gornjem Kolu, ne glasa i ne delegira.

Aktivira se automatski kad ukupan broj upisanih POENA dostigne 1.000.000 (u evidenciji Protokola to je stanje od −1.000.000) što je znak da je sistem dovoljno aktivan i da učesnici nose značajnu kolektivnu odgovornost.

Pre toga sve odluke donosi Fondacija; posle toga ključne sistemske odluke (izmene Pravilnika, novi programi, suspenzija programa) donosi Gornje Kolo glasanjem po kvadratnom korenu. Gornje Kolo nije organ Fondacije: odluku upućuje Upravnom odboru, koji je sprovodi.

Predlog može podneti svaki učesnik (član bez potvrde, član Kola, čuvar Kola), i to jedan po jedan: dok postupak o njegovom predlogu traje, novi ne podnosi. Postupak traje tri dana, od ponoći do ponoći. Prvog dana predlog se podnosi i od tada ga vide svi korisnici. Drugog dana čuvari Kola iz Gornjeg Kola mogu da ga podrže; podrška nije glas, ne obavezuje na glas „za“ i ne delegira se, a predlog čuvara Kola iz Gornjeg Kola smatra se podržanim samim podnošenjem. Trećeg dana o podržanom predlogu glasa Gornje Kolo. Predlog koji niko ne podrži zatvara se bez glasanja i upisuje u registar odluka. Fondacija ne odlučuje o tome da li će se o predlogu glasati.

Neusvojen ili nepodržan predlog iste sadržine može se ponovo podneti tek posle 30 dana. Pseudonim predlagača i onih koji su predlog podržali vide samo učesnici, a broj podrški vidi svaki korisnik.`,
      },
      {
        id: 29,
        pitanje: `Šta je glasanje po kvadratnom korenu?`,
        odgovor: `To je način glasanja u kome je glasačka moć čuvara Kola kvadratni koren broja njegovih aktivnih ZRNA, zaokružen naniže: 1 ZRNO daje 1 glas, 100 ZRNA 10 glasova, 10.000 ZRNA 100 glasova.

Cilj je da niko ne može prevagnuti odluku samom količinom ZRNA, uticaj raste mnogo sporije od broja ZRNA, pa odluku pre odnosi širina učešća nego koncentracija moći.`,
      },
      {
        id: 120,
        pitanje: `Šta je nadzor potvrda?`,
        odgovor: `Nadzor je naknadni pregled potvrda i uvođenja. Vrši ga svaki čuvar Kola, nikad u predmetu u kome je sam učestvovao. Pregleda potvrde i uvođenja koje su dali članovi bez potvrde i članovi Kola koji nisu čuvari, svaku potvrdu posle razgovora telefonom i potvrdu onoga ko je potvrđivača uveo. Uvođenje sa spiska za poziv ide u nadzor uvek, osim kad ga da osnivač. Bez nadzora su potvrde i uvođenja osnivača, ostale potvrde i uvođenja čuvara i potvrda koju Fondacija da svojom odlukom. Nadzor ne menja dejstvo potvrde i ne plaća se.`,
      },
    ],
  },
  {
    id: "sporovi",
    naslov: "Sporovi i nepoštovanje pravila",
    pitanja: [
      {
        id: 31,
        pitanje: `Kako se rešavaju sporovi između korisnika?`,
        odgovor: `Spor između korisnika oko razmene rešava se po opštim pravilima obligacionog prava, pred nadležnim sudom. Fondacija nije strana u tom odnosu.

U početnoj fazi možeš zatražiti dobrovoljno, neobavezujuće posredovanje Fondacije. Ako je spor između tebe i same Fondacije, prvo se traži sporazumno rešenje; inače je nadležan sud u Somboru.

Za zaštitu ličnih podataka imaš pravo pritužbe Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti.

Posebni interni mehanizmi rešavanja sporova mogu se uspostaviti kasnije, posebnim pravilnikom ili odlukom Gornjeg Kola; zasad ne postoje.`,
      },
      {
        id: 32,
        pitanje: `Šta se dešava kada se neko ne pridržava pravila?`,
        odgovor: `Sistem ima trajno pamćenje, svako ažuriranje evidencije trajno je zabeleženo pod pseudonimom i vidljivo učesnicima, pa loše ponašanje ostaje vidljivo onima koji učestvuju u sistemu.

Fondacija može privremeno suspendovati nalog (najviše 30 dana, uz pravo korisnika da bude obavešten o razlozima i da se izjasni) ili pri težoj povredi pravila isključiti korisnika.

Isključeni korisnik gubi pristup, POEN i ZRNO se otpisuju Protokolu, lični podaci se brišu, a pseudonim se zamenjuje neutralnom oznakom.`,
      },
      {
        id: 33,
        pitanje: `Mogu li podneti prigovor na odluku Fondacije?`,
        odgovor: `Da. Prigovor sa svog profila može da podnese svaki korisnik, i pre ulaska u Kolo: na prepis povodom razmene, na deo iz kolektivne nabavke, na vaučer, na odluku o potvrdi stvarnosti, na suspenziju i isključenje, na odluku o programu, na odluku o gazdinstvu, njegovom prestanku i otpisu, na odluku po prijavi da neko nije roditelj deteta, na uklonjen oglas, na netačan podatak o sebi i na svaku drugu odluku Fondacije koja se na njega odnosi.

Fondacija mora rešiti prigovor u roku od 30 dana, sa obrazloženjem.

Istovremeno možeš imati najviše tri otvorena prigovora iste vrste.`,
      },
    ],
  },
  {
    id: "privatnost-izlazak",
    naslov: "Privatnost i izlazak",
    pitanja: [
      {
        id: 34,
        pitanje: `Ko sve vidi moj pseudonim i transakcije?`,
        odgovor: `Zavisi od toga ko gleda.

Posetilac bez naloga vidi zbirne brojeve sistema i oglase na Pijaci, bez pojedinačnih transakcija.

Korisnik koji nije u Kolu vidi iznose i vreme ažuriranja evidencije, bez pseudonima strana i bez stanja. Tuđi profil vidi sužen: pseudonim, sliku, mesto ako je prikazano, status, oglase i broj preporuka.

Učesnik vidi pseudonime, sve transakcije sa pseudonimima strana, stanja i profile. Transakcije u kojima učestvuje dete ne vidi niko van dečjeg prostora.

Listu donacija korisnici koji nisu u Kolu i učesnici vide isto: ime javnog donatora, iznos i datum, bez pseudonima.

Oglas na Pijaci (opis, iznos u POENIMA, mesto, pseudonim) vidi svako. Kontakt i vezu sa istorijom vide samo učesnici.`,
      },
      {
        id: 121,
        pitanje: `Ko vidi moj broj kad tražim da me neko nazove?`,
        odgovor: `Spisak vide samo članovi Kola. Ime i broj otvara jedan član Kola, klikom, najduže na deset minuta, i dok su kod njega otvoreni, drugi ih ne vidi. Fondacija beleži ko je tvoje podatke otvorio. Taj zapis vidi samo Fondacija, ne izvozi se kroz platformu, a ti ga dobijaš na zahtev na privatnost@ekolo.rs. Zahtev, ime i broj sa spiska brišu se kad uđeš u Kolo, kad povučeš pristanak ili kad ugasiš nalog.`,
      },
      {
        id: 55,
        pitanje: `Mogu li koristiti sistem bez imena i telefona? Šta gubim?`,
        odgovor: `Da, možeš. Pri registraciji obavezni su samo pseudonim (ime koje sam biraš), imejl i lozinka, ništa više.

Pravo ime i broj telefona nisu uslov za ulazak u Kolo, niti uslov za pristup funkcijama sistema. Ako tražiš da te neko nazove, broj telefona ostavljaš sam, i vidi ga samo član Kola koji otvori tvoje podatke, uz ime i prezime ako je upisano. Ime i prezime traži se samo za četiri stvari: gazdinstvo, javnu donaciju, svojstvo zadrugara i prijavu pokroviteljstva. Tada se upisuje u evidenciju identiteta, uz tvoj pseudonim, i ne prikazuje se drugim korisnicima.

Šta gubiš ako ih ne daš? Praktično samo lakši kontakt: na Pijaci te drugi bez tih podataka teže kontaktiraju i teže dogovarate razmenu uživo.

Ako ipak odlučiš da ih uneseš, sam biraš da li će biti vidljivi učesnicima, i to otkrivanje možeš povući u svakom trenutku, posle čega se podaci više ne prikazuju.

Imejl adresa ti nikada nije javno vidljiva.`,
      },
      {
        id: 56,
        pitanje: `Može li me neko deanonimizovati kombinujući iznose, vreme i učestalost transakcija?`,
        odgovor: `Da. Pseudonimnost nije isto što i anonimnost.

Tvoje transakcije vode se pod pseudonimom, ne pod tvojim imenom. Ali kombinacija iznosa, vremena i učestalosti ažuriranja evidencije može u nekim slučajevima posredno ukazati na to ko si, naročito u maloj sredini gde se ljudi poznaju. Registracijom prihvataš da je javnost pseudonimne evidencije ugrađena u sistem i da se ne može isključiti.

Ipak te štiti nekoliko stvari.

Tvoje ime ne stoji ni u jednom zapisu POENA. Ime i prezime Fondacija vodi samo u zasebnoj evidenciji identiteta, i to samo kad prijaviš gazdinstvo ili mu pristupiš, kad javno doniraš, kad postaneš zadrugar ili kad Fondacija potvrdi pokroviteljstvo koje si prijavio kao zastupnik firme ili preduzetnik. Tu evidenciju vidi administratorski tim, a drugi korisnici ne; jedini izuzetak je član Kola koji otvori tvoje podatke kad si tražio da te neko nazove, i to samo dok je poziv otvoren. Briše se kad ugasiš nalog. JMBG i podaci iz lične karte ne upisuju se nigde. Da li ćeš ime i telefon pokazati drugima (samo učesnicima) biraš sam, a otkrivanje možeš povući u svakom trenutku.

Vidljivost je gradirana: neregistrovani vide samo zbirne brojeve, a pojedinačne transakcije sa pseudonimima vide tek učesnici. Imejl, tehnički logovi i mreža potvrda nikada nisu javni.

Na tebi je i da pseudonim ne sadrži lične podatke koji bi te odali.`,
      },
      {
        id: 35,
        pitanje: `Kako se štiti moja privatnost?`,
        odgovor: `Minimizacija podataka jedan je od četiri nepromenljiva principa sistema, platforma prikuplja samo ono što je neophodno za rad.

U Kolo se ulazi u lancu potvrda: član Kola potvrđuje tvoju stvarnost na osnovu ličnog poznavanja ili te, posle razgovora, uvodi u Kolo, bez prikupljanja ili dostavljanja ličnih dokumenata. Platforma pritom samo tehnički beleži da je potvrda, odnosno uvođenje dato, ne prikuplja lične podatke onoga ko ulazi u Kolo.

Administratorske radnje beleže se u revizijskom dnevniku koji se ne prepravlja. Fondacija ne prodaje podatke i ne deli ih sa trećima za njihove svrhe: obrađuju ih samo pružaoci infrastrukture u ime Fondacije (opisani u Politici privatnosti), a nadležnim organima dostavljaju se samo kad zakon nalaže.

U svakom trenutku možeš zatražiti izvoz svih svojih podataka u JSON formatu, ili brisanjem naloga pokrenuti njihovo brisanje: lični podaci se brišu, a numerička istorija ostaje pod neutralnom oznakom.`,
      },
      {
        id: 78,
        pitanje: `Gde se nalaze serveri i prelaze li moji podaci granicu Srbije?`,
        odgovor: `Prelaze, ali uglavnom ne dalje od Evropske unije. Aplikacija se izvršava i baza podataka se nalazi u Evropskoj uniji, u regionu Frankfurt, a Evropska unija je na listi država koje obezbeđuju primeren nivo zaštite podataka.

Provajderi aplikacije i baze imaju sedište u Sjedinjenim Američkim Državama, pa je moguć pristup iz te zemlje u administrativne i tehničke svrhe (podrška, održavanje, sistemski dnevnici). U Sjedinjenim Američkim Državama obrađuju se slike koje postavljaš, mejlovi koje platforma šalje i, samo uz tvoj pristanak, podaci o posećenosti. Podaci se prenose samo obrađivaču sa kojim je zaključen ugovor o obradi sa standardnim ugovornim klauzulama ili drugim odgovarajućim merama zaštite; obrađivaču bez takvog ugovora ne prenose se. Spisak obrađivača stoji u Politici privatnosti.

Bez obzira na to gde se serveri fizički nalaze, primenjuju se iste tehničke mere: šifrovanje podataka u prenosu i u mirovanju, razdvajanje identifikacionih od obračunskih podataka i pristup po principu minimalne neophodnosti.

Tvoja prava (uvid, ispravka, brisanje, prenosivost i pritužba Povereniku) ostaju ista bez obzira na lokaciju servera.`,
      },
      {
        id: 36,
        pitanje: `Kako izlazim iz sistema?`,
        odgovor: `Brisanje naloga dostupno je u svakom trenutku iz podešavanja profila.

Pre brisanja možeš inicirati ažuriranje evidencije POENA u korist drugog korisnika. Pri prestanku statusa sva ZRNA se otpisuju Protokolu (taj otpis ne pokreće upis POENA) a POEN koji ostane poništava se i vraća Protokolu.

Tvoji lični podaci se brišu (imejl, dobrovoljno uneti podaci, ime i prezime iz evidencije identiteta, oglasi), a pseudonim se zamenjuje neutralnom oznakom; numerička istorija transakcija ostaje, radi matematičke ispravnosti sistema. To je pseudonimizacija, a ne anonimizacija: Fondacija zadržava interni identifikator naloga, pa zadržani zapisi i dalje jesu podaci o ličnosti.

Doprinosi objavljeni pod otvorenim licencama (kod, sadržaj) zadržavaju trajnu atribuciju.`,
      },
      {
        id: 37,
        pitanje: `Šta sa POENOM u slučaju smrti, može li se naslediti?`,
        odgovor: `Ne. POEN i ZRNO nisu nasledna imovina niti potraživanje prema Fondaciji.

Pri smrti korisnika nalog se deaktivira, a POEN i ZRNO se otpisuju Protokolu. Naslednici, porodica i treća lica nemaju imovinsko pravo na njih.

Ovo je suštinska razlika između POENA i finansijske imovine, i jedan od razloga zašto POEN nije novac u pravnom smislu.`,
      },
    ],
  },
  {
    id: "tehnika",
    naslov: "Tehnika i open-source",
    pitanja: [
      {
        id: 71,
        pitanje: `Kakav je sigurnosni model? Je li blockchain? Šta sprečava da neko iskuje POEN ili prepiše istoriju?`,
        odgovor: `Nije blockchain. KOLO koristi centralizovanu evidenciju koju vodi Protokol na infrastrukturi koju drži Fondacija. Decentralizacija ovde nije tehnička nego upravljačka, odlučivanje se vremenom prenosi sa osnivača na zajednicu.

Zaštita od „kovanja“ POENA počiva na zero-sum pravilu: svaki POEN koji postoji upisan je kao isti takav minus u zapisu Protokola. Niko ne može da upiše POEN ni iz čega, jer bi to odmah narušilo ravnotežu koju sistem stalno proverava. Uz to, sve operacije Protokola su determinističke, bez diskrecije, ni admin ne može „ručno“ da doda nekome POEN mimo definisanih kanala.

Što se istorije tiče, svaki zapis je vremenski označen, a istorija se ne prepravlja: ispravke idu novim zapisom u suprotnom smeru, nikad brisanjem ili menjanjem starog. Administratorske radnje beleže se u revizijskom dnevniku, a redovne automatske provere potvrđuju da zbir svih zapisa u svakom trenutku daje nulu, svako odstupanje odmah je vidljivo.

O granicama: ova nepromenljivost je dizajnersko pravilo obezbeđeno softverskom arhitekturom, a ne kriptografska „trustless“ garancija kakvu pruža javni blockchain. Integritet počiva na ispravno napisanom kodu, kontroli pristupa i transparentnosti, ne na tome da matematika čini prevaru nemogućom. Zato su tu i dodatne mere, šifrovanje podataka u prenosu i u mirovanju, redovni bekapi na odvojene lokacije i otvoren kod koji svako može nezavisno da pregleda.`,
      },
      {
        id: 80,
        pitanje: `Gde je javni repozitorijum koda? Mogu li ga preuzeti i sam pokrenuti (self-host)?`,
        odgovor: `Ceo izvorni kod platforme javno je dostupan na GitHub-u: https://github.com/alvaserbia-prog/kolo-platform-izvor

Možeš ga slobodno pregledati, preuzeti i pokrenuti sopstvenu kopiju. Softver je pod licencom AGPL-3.0, koja to izričito dozvoljava, uz jedan uslov: ako svoju kopiju pokreneš kao javni internet servis, moraš i sam učiniti svoj izvorni kod, sa svim izmenama, dostupnim svojim korisnicima pod istom licencom. Tako kod ostaje trajno otvoren.

Za pokretanje su potrebni Node.js okruženje i PostgreSQL baza; osnovna uputstva (instalacija, pokretanje, varijable okruženja) nalaze se u fajlovima README i .env.example u samom repozitorijumu. Doprinosi kodu primaju se uz DCO potpis o poreklu doprinosa, opisan u fajlu CONTRIBUTING.

Dokumentacija i tekstovi sistema licencirani su pod CC BY-SA 4.0, slobodni za korišćenje i adaptaciju uz navođenje autorstva i istu licencu.`,
      },
      {
        id: 69,
        pitanje: `Ako pošaljem PR (doprinos kodom), dobijam li POEN? Je li to operativni doprinos? Mora li me neko potvrditi?`,
        odgovor: `Doprinos kodom spada u operativni doprinos, isti kanal kroz koji se evidentira svaki rad za zajedničko dobro.

Kod i sadržaj su zajedničko dobro: softver je pod licencom AGPL-3.0, sadržaj pod CC BY-SA 4.0. Doprinos kodom prihvata se po principu DCO (potpis „Signed-off-by“), to je potvrda porekla doprinosa, ne prenos autorskih prava na Fondaciju. Tvoja atribucija na doprinosu je trajna i ostaje i ako kasnije obrišeš nalog.

Da bi ti se POEN upisao, treba da budeš u Kolu, kao član Kola ili član bez potvrde, a doprinos ide kroz objavljen zadatak: u početnoj fazi zadatke objavljuje i izvršenje potvrđuje Fondacija, a po aktivaciji upravljanja zajednicom zadatke objavljuju i Gornje Kolo i čuvari Kola, a izvršenje potvrđuju čuvari Kola. Ti se prijaviš, izvršiš zadatak, izvršenje se potvrdi, i tada se POEN upiše.`,
      },
      {
        id: 70,
        pitanje: `Postoji li javni ili developerski API? Mogu li graditi integracije ili botove?`,
        odgovor: `Trenutno ne postoji javni developerski API za gradnju integracija ili botova.

Ono što postoji jeste izvoz tvojih sopstvenih podataka: u svakom trenutku možeš zatražiti sve svoje podatke u strukturisanom, mašinski čitljivom formatu (JSON), to je tvoje zakonsko pravo na prenosivost. Ali to je izvoz tvojih ličnih podataka, ne programerski interfejs nad celim sistemom.

Važno je i zašto: sistem ima gradiranu vidljivost, pseudonime i pojedinačne transakcije vide samo učesnici, a neregistrovani samo zbirne brojeve. Svaki budući API morao bi da poštuje isto pravilo, inače bi zaobišao zaštitu privatnosti.`,
      },
    ],
  },
];

const SVA_PITANJA: FaqPitanje[] = FAQ_SEKCIJE.flatMap((s) => s.pitanja);

export function poBrojevima(brojevi: number[]): FaqPitanje[] {
  return brojevi
    .map((n) => SVA_PITANJA.find((p) => p.id === n))
    .filter((p): p is FaqPitanje => p !== undefined);
}

import { FAQ_SEKCIJE_EN } from "./faq-data-en";
import { FAQ_SEKCIJE_HR } from "./faq-data-hr";
import { FAQ_SEKCIJE_RU } from "./faq-data-ru";
import { FAQ_SEKCIJE_HU } from "./faq-data-hu";

/**
 * Svaki prevedeni jezik ima svoj FAQ set; „sr“ i „sr-Cyrl“ koriste original
 * (ćirilica se izvodi transliteracijom u prikazu, isti podaci).
 *
 * ⚠️ `id` sekcija i pitanja MORAJU biti isti u svim jezicima — `getFaqPoBrojevima`
 * bira pitanja po broju, pa bi razmimoilaženje tiho izbacilo pitanje iz prikaza.
 * Proverava se testom `__tests__/faq-paritet.test.ts`.
 */
const PO_JEZIKU: Record<string, FaqSekcija[]> = {
  en: FAQ_SEKCIJE_EN,
  hr: FAQ_SEKCIJE_HR,
  ru: FAQ_SEKCIJE_RU,
  hu: FAQ_SEKCIJE_HU,
};

/**
 * Returns FAQ sections for a given locale; falls back to Serbian.
 */
export function getFaqSekcije(locale: string): FaqSekcija[] {
  return PO_JEZIKU[locale] ?? FAQ_SEKCIJE;
}

/**
 * Returns selected FAQ questions by ID for a given locale.
 */
export function getFaqPoBrojevima(ids: number[], locale: string): FaqPitanje[] {
  const sekcije = getFaqSekcije(locale);
  const sva = sekcije.flatMap((s) => s.pitanja);
  return ids
    .map((n) => sva.find((p) => p.id === n))
    .filter((p): p is FaqPitanje => p !== undefined);
}
