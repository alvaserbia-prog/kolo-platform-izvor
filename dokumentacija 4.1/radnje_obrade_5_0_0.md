# Registar radnji obrade podataka o ličnosti

Ovaj registar je evidencija radnji obrade iz člana 47 Zakona o zaštiti podataka o ličnosti („Službeni glasnik RS“, broj 87/2018; u daljem tekstu: ZZPL), koju KOLO Fondacija vodi kao rukovalac, u skladu sa članom 54 Pravilnika o KOLO sistemu i članom 9 Pravilnika o hijerarhiji akata KOLO sistema. Izrazi iz Pravilnika o KOLO sistemu imaju isto značenje u ovom registru. Registar se primenjuje zajedno sa Politikom privatnosti i Procenom uticaja na zaštitu podataka o ličnosti.

## Podaci o rukovaocu

| **Rukovalac** | KOLO Fondacija |
| --- | --- |
| **Sedište** | Šetalište 16, 25000 Sombor, Republika Srbija |
| **Matični broj** | 28836627 |
| **PIB** | 115840443 |
| **Kontakt za zaštitu podataka** | privatnost@ekolo.rs |
| **Lice za zaštitu podataka** | Fondacija procenjuje da li je obavezna da odredi lice za zaštitu podataka. Po toj proceni uslovi iz člana 56 stav 2 ZZPL-a nisu ispunjeni: Fondacija nije organ vlasti, a njene osnovne aktivnosti, u sadašnjem obimu, ne obuhvataju redovan i sistematski nadzor lica u velikoj meri niti obradu posebnih vrsta podataka u velikoj meri. Procena se preispituje najmanje jednom godišnje i pri svakoj značajnoj promeni broja korisnika ili obima obrade posebnih vrsta podataka. Dok lice nije određeno, za zaštitu podataka odgovara direktor Fondacije, a zahtevi se upućuju na privatnost@ekolo.rs. |

## Zajedničke odredbe

| **Infrastruktura** | Vercel Inc. (izvršavanje aplikacije, region Frankfurt, Evropska unija) i Neon Inc. (baza podataka, region u Evropskoj uniji), obrađivači na osnovu ugovora o obradi. Podaci o ličnosti čuvaju se na infrastrukturi koju obezbeđuje Fondacija, kod obrađivača sa kojima je zaključen ugovor o obradi. |
| --- | --- |
| **Rezervna kopija** | Kopija cele baze pravi se svakog sata i čuva kod GitHub Inc. (14 dana) i na Google Drive nalogu Fondacije kod Google LLC (30 dana). Obuhvata podatke svih radnji iz ovog registra. |
| **Prenos u treću zemlju** | Podaci u bazi ne napuštaju Evropsku uniju, koja obezbeđuje primereni nivo zaštite. Vercel Inc. i Neon Inc. su društva iz Sjedinjenih Američkih Država, pa je moguć pristup iz treće zemlje u administrativne i tehničke svrhe. Prenos u Sjedinjene Američke Države vrši se za rezervnu kopiju (GitHub Inc., Google LLC), slike i priloge (Cloudflare, Inc., servis Cloudflare R2; u bazu se upisuje samo internet-adresa), elektronsku poštu koju Platforma šalje (Resend, Inc.), upozorenja Fondaciji (Telegram Messenger Inc.) i merenje posećenosti po pristanku (Google). Svaki prenos vrši se obrađivaču sa ugovorom o obradi koji sadrži standardne ugovorne klauzule, uz mere iz Politike privatnosti. |
| **Opšte mere zaštite** | TLS enkripcija u prenosu (najmanje verzija 1.2), enkripcija u mirovanju na nivou infrastrukture, kontrola pristupa po načelu najmanje neophodnosti, višefaktorska autentifikacija za pristup infrastrukturi, revizijski dnevnik administrativnih radnji. |
| **Prestanak statusa** | Prestankom statusa korisnika brišu se elektronska adresa, dobrovoljno uneti podaci, ime i prezime iz evidencije identiteta, sadržaj i fotografije oglasa i slobodan tekst koji je korisnik uneo, pseudonimizuju se veze u evidenciji lanca potvrda, a numerička istorija zadržava se pod pseudonimom koji ne upućuje na ime (član 33 Pravilnika o KOLO sistemu). Pseudonimizacija nije anonimizacija: Fondacija zadržava interni identifikator naloga, pa zadržani zapisi ostaju podaci o ličnosti. |
| **Izvoz podataka** | Podaci iz svih radnji ulaze u izvoz podataka korisnika, osim kada je kod radnje navedeno drugačije. |

U kolonama „Primaoci / obrađivači“ i „Prenos u treću zemlju“ navodi se samo ono što dodaje zajedničkim odredbama.

**Radnja obrade br. 1 — Registracija i upravljanje nalogom**

| **Svrha obrade** | Otvaranje i vođenje naloga, prijava na sistem, oporavak pristupa, sistemska obaveštenja i bezbednost pristupa. |
| --- | --- |
| **Kategorije lica** | Korisnici; lica koja prijave smrt korisnika (član 34 Uslova korišćenja). |
| **Kategorije podataka** | Pseudonim i raniji pseudonimi naloga, elektronska adresa i podatak da je potvrđena, lozinka (samo u heširanom obliku), izjava o punoletstvu, datum otvaranja naloga, izabrani jezik, status naloga, obaveštenja u nalogu i pretplata na obaveštenja na uređaju (adresa servisa za obaveštenja pretraživača i oznaka pretraživača). Pri prijavi smrti: elektronska adresa i navodi lica koje prijavljuje i, kada je zatražen, dokaz o smrti; brišu se kada postupak bude okončan, a zadržava se samo zapis da je status prestao smrću. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a): prihvatanjem Uslova korišćenja zasniva se ugovorni odnos; zapis o prihvatanju vodi se u radnji br. 18, a bez njega se nalog ne otvara. |
| **Primaoci / obrađivači** | Infrastruktura. Pri prijavi Google nalogom: Google LLC (provera identiteta pri prijavi). Elektronska pošta: Resend, Inc. Obaveštenje na uređaj ide preko servisa za obaveštenja pretraživača. |
| **Prenos u treću zemlju** | Google LLC pri prijavi Google nalogom i Resend, Inc. za poruke elektronskom poštom. |
| **Rok čuvanja** | Dok nalog postoji; po prestanku statusa: zajedničke odredbe. Raniji pseudonim briše se kada ga korisnik ponovo izabere i gašenjem naloga. Pretplata na obaveštenja briše se izlaskom iz sistema. |
| **Mere zaštite** | Heširanje lozinke; potvrda adrese linkom, koja nije uslov za korišćenje naloga; uz zapis o prihvatanju akata ne beleže se IP adresa ni podaci o uređaju. |

**Radnja obrade br. 2 — Dokaz stvarnosti**

| **Svrha obrade** | Ostvarivanje načela jedna osoba, jedan nalog i očuvanje integriteta evidencije zajedničkog dobra kroz lanac potvrda (Pravilnik o dokazu stvarnosti). |
| --- | --- |
| **Kategorije lica** | Korisnici koji se verifikuju; članovi Kola, osnivači i članovi bez potvrde koji verifikuju; članovi Kola, osnivači i čuvari Kola koji potvrđuju članove bez potvrde. |
| **Kategorije podataka** | Evidencija lanca potvrda u pseudonimnom obliku: pseudonim verifikatora i verifikovanog, vrsta verifikacije (potvrda ili uvođenje u Kolo), podatak da je uvođenje usledilo posle razgovora sa korisnikom sa spiska za poziv, vremenski žig, izjava verifikatora da mu drugi nalog verifikovanog nije poznat; status i potvrđenost; potvrda člana bez potvrde: ko ju je dao, odnosno da ju je dala Fondacija uz obrazloženje, način (lično poznanstvo, razgovor telefonom sa čuvarom Kola, spisak povezanih) i trenutak. Spisak povezanih sastavlja se iz evidencije lanca potvrda i ne prikuplja nove podatke. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a). |
| **Primaoci / obrađivači** | Infrastruktura. Verifikator i verifikovani vide sopstvene veze; nadzornici (čuvari Kola) vide verifikacije koje podležu nadzoru (radnja br. 14). |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Dok nalog postoji. Prestankom statusa veze korisnika u evidenciji lanca potvrda se pseudonimizuju, a verifikacije koje je korisnik dao ostaju. |
| **Mere zaštite** | Pseudonimizacija; razdvajanje identifikacionih od obračunskih podataka; potvrda nikad ne nastupa automatski. |
| **Napomena** | Evidencija lanca potvrda, i u pseudonimnom obliku, jeste obrada podataka o ličnosti. Stvarnost se potvrđuje samo u lancu potvrda. Javna donacija, novčano pokroviteljstvo i prijava gazdinstva korisnika samo stavljaju na spisak za poziv (radnja br. 24). |

**Radnja obrade br. 3 — Dobrovoljno uneti podaci**

| **Svrha obrade** | Lakše korišćenje platforme i komunikacija među korisnicima, po izboru korisnika. |
| --- | --- |
| **Kategorije lica** | Korisnici koji dobrovoljno unesu dodatne podatke. |
| **Kategorije podataka** | Ime i prezime, broj telefona, mesto, profilna slika i opis, kategorije oglasa koje korisnik prati; pri prijavi Google nalogom i ime i slika sa tog naloga. |
| **Pravni osnov** | Pristanak (član 12 stav 1 tačka 1 ZZPL-a). Unos nije uslov za dokaz stvarnosti ni za pristup funkcijama sistema. |
| **Primaoci / obrađivači** | Infrastruktura; profilna slika kod Cloudflare, Inc. (Cloudflare R2). Podaci koje korisnik odabere da budu vidljivi dostupni su učesnicima. |
| **Prenos u treću zemlju** | Profilna slika (Cloudflare R2). |
| **Rok čuvanja** | Do povlačenja pristanka, odnosno brisanja od strane korisnika; prestankom statusa brišu se u celosti. Mesto i broj telefona ostavljeni za spisak za poziv korisnik menja, ali ih ne briše, dok nalog postoji (radnja br. 24). |
| **Mere zaštite** | Korisnik podatke menja i briše u svakom trenutku; profilna slika briše se iz skladišta sa nalogom. |

**Radnja obrade br. 4 — Evidencija doprinosa (POEN i ZRNO)**

| **Svrha obrade** | Vođenje evidencije zajedničkog dobra i obračunskog okvira sistema: zapisi POEN-a, zabeležen doprinos, upis, stanja i otpis ZRNA; izračunavanje zbirnih pokazatelja stanja sistema i koncentracije (član 56 stav 5 Pravilnika o KOLO sistemu). |
| --- | --- |
| **Kategorije lica** | Korisnici koji učestvuju u razmeni i doprinose; zadrugari kao strane zapisa zadruge. |
| **Kategorije podataka** | Iznos i vreme svakog zapisa, tip zapisa i osnov po kome je upisan, pseudonimi strana, slobodan tekst koji korisnik unese uz prepis, zabeležen doprinos, stanje zapisa; upisano, aktivno i slobodno ZRNO, zahtevi za upis i otpis i dnevni obračunski koeficijent. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a) dok korisnik učestvuje u sistemu. Posle prestanka statusa numerička istorija zadržava se po osnovu legitimnog interesa Fondacije (član 12 stav 1 tačka 6 ZZPL-a): odbrana pravnih zahteva i očuvanje integriteta evidencije, jer je svaki zapis ujedno deo zapisa druge strane i protivzapisa Protokola. Pravo na brisanje se tada ne primenjuje u meri u kojoj je obrada nužna radi podnošenja, ostvarivanja ili odbrane pravnog zahteva (član 30 stav 3 ZZPL-a). Zakonska obaveza čuvanja postoji samo za dinarske zapise o donacijama i pokroviteljstvu (radnje br. 5 i 6). |
| **Primaoci / obrađivači** | Infrastruktura. Evidencija je u pseudonimnom obliku dostupna učesnicima (iznosi, vreme i pseudonimi strana). Korisniku koji nije u Kolu dostupni su iznosi i vreme, bez pseudonima i stanja zapisa. Zapis u kome je strana maloletni korisnik ne prikazuje se nijednom posmatraču. Zabeležen doprinos vidi samo korisnik kome je zabeležen. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Dok nalog postoji. Posle prestanka statusa numerička istorija čuva se pod pseudonimom 10 godina, a potom se anonimizuje i trajno ostaje kao anonimna; slobodan tekst uz prepis i opis zapisa sa podatkom o ličnosti brišu se prestankom statusa, odnosno povlačenjem pristanka. |
| **Mere zaštite** | Pseudonimizacija; integritet evidencije (pravilo nultog zbira sa automatskom proverom, atomaran upis, vremensko označavanje zapisa); naziv programa podrške i ime ne upisuju se u opis zapisa; zbirni pokazatelj se ne iskazuje kada obuhvata manje od pet lica, ne sadrži pseudonim i ne odnosi se na prepise između korisnika, a njegov dnevni snimak ne sadrži podatke o ličnosti. |

**Radnja obrade br. 5 — Donacije fizičkih lica**

| **Svrha obrade** | Evidentiranje donacija u skladu sa propisima o računovodstvu i finansijskom izveštavanju, provera da se uplatilac i donator poklapaju i sprečavanje zloupotrebe sistema radi pranja novca ili finansiranja terorizma. |
| --- | --- |
| **Kategorije lica** | Donatori: fizička lica. |
| **Kategorije podataka** | Iznos i datum donacije, podatak o uplatiocu iz bankovnog izvoda, oznaka da je uplata izvršena sa računa otvorenog u inostranstvu, vrsta donacije (javna ili anonimna), kod plaćanja karticom izjava da platni instrument glasi na donatora, tekst ugovora o donaciji (ugovor ne sadrži broj POEN-a, koeficijent ni nivo). Identifikaciju uplatioca i proveru porekla sredstava sprovodi banka; izjava o poreklu sredstava se ne prikuplja. |
| **Pravni osnov** | Zakonska obaveza (član 12 stav 1 tačka 3 ZZPL-a) za dinarske zapise o donacijama; za podatak o uplatiocu: legitimni interes Fondacije (član 12 stav 1 tačka 6 ZZPL-a), radi provere da se uplatilac i donator poklapaju. Isto poklapanje je uslov da javna donacija od najmanje 5.000 dinara, izvršena jednom uplatom, korisniku donese ponudu za spisak za poziv (radnja br. 24). |
| **Primaoci / obrađivači** | Infrastruktura (zapis o donaciji sa tekstom ugovora); poslovna banka Fondacije i, pri plaćanju karticom, njen posrednik za plaćanje na internetu (Republika Srbija); revizor, kada je propisan. |
| **Prenos u treću zemlju** | Ne. Kartično plaćanje obrađuje se u Republici Srbiji. |
| **Rok čuvanja** | 10 godina od nastanka, u skladu sa Zakonom o računovodstvu i poreskim propisima. Brisanje pre isteka tog roka ne primenjuje se, u skladu sa članom 30 stav 3 ZZPL-a. |
| **Mere zaštite** | Bankovna dokumentacija čuva se odvojeno od podataka Platforme; mere iz Glave V Pravilnika o pokroviteljstvu i donacijama. |

**Radnja obrade br. 6 — Pokroviteljstvo**

| **Svrha obrade** | Upis pokrovitelja u evidenciju, zaključenje i izvršenje ugovora o pokroviteljstvu novcem, odnosno dobrima i uslugama, rang-lista pokrovitelja i finansijsko izveštavanje. |
| --- | --- |
| **Kategorije lica** | Zastupnici pravnih lica, preduzetnici i nosioci registrovanih poljoprivrednih gazdinstava koji podnose prijavu; korisnici kojima se doprinos evidentira. |
| **Kategorije podataka** | Naziv, adresa sedišta, matični broj i PIB pokrovitelja, odnosno ime i prezime, naziv i broj gazdinstva nosioca; ime i prezime i funkcija zastupnika; podatak da je Fondacija naziv, matični broj i zastupnika uporedila sa registrom privrednih subjekata; upis pokrovitelja, pravni oblik, kontakt adresa elektronske pošte i broj telefona i status upisa; mesto i adresa za prikaz na mapi i izjava o saglasnosti sa prikazom adrese; logotip, ako je priložen; podaci o doprinosu i veza pokrovitelja sa korisnikom koji je podneo prijavu. Kod dobara i usluga i: opis, broj vaučera, cena po jedinici, kontakt podaci davaoca, odnos podnosioca prema davaocu, fotografija cenovnika davaoca, izjava o ovlašćenju i potvrda podnosioca da je upoznat sa načinom evidentiranja, vreme zaključenja i kontrolni broj teksta ugovora, rok, mesto, kapacitet i izjava davaoca. Ime i prezime zastupnika upisuje se i u evidenciju identiteta (radnja br. 21). |
| **Pravni osnov** | Izvršenje ugovora sa pokroviteljem (član 12 stav 1 tačka 2 ZZPL-a), uključujući prikaz na mapi kao deo učešća zatraženog upisom; za podatke o zastupniku: legitimni interes Fondacije (član 12 stav 1 tačka 6 ZZPL-a); za računovodstvenu dokumentaciju: zakonska obaveza (član 12 stav 1 tačka 3 ZZPL-a). |
| **Primaoci / obrađivači** | Infrastruktura; logotip kod Cloudflare, Inc. (Cloudflare R2); revizor, kada je propisan. Na rang-listi prikazuju se naziv, logotip i zbir doprinosa, a na vaučerima naziv i logotip; na mapi naziv, logotip, mesto, adresa (uz izjavu) i vaučeri. Fotografiju cenovnika vidi samo administratorski tim. |
| **Prenos u treću zemlju** | Logotip (Cloudflare R2). |
| **Rok čuvanja** | 10 godina, u skladu sa Zakonom o računovodstvu. Upis pokrovitelja briše se na zahtev, ako nema ugovora sa neiskorišćenim vaučerima; donacije tada ostaju na rang-listi osim na zahtev. |
| **Mere zaštite** | Na rang-listi samo naziv, bez adrese, matičnog broja i PIB-a; adresa na mapi samo uz izjavu. |
| **Napomena** | Test srazmernosti legitimnog interesa: podaci o zastupniku ograničeni su na ono što valjan ugovor traži, a podnosilac je unapred obavešten, pa interes Fondacije preteže. Utvrđen prijem novčanog pokroviteljstva podnosiocu donosi ponudu za spisak za poziv (radnja br. 24). |

**Radnja obrade br. 7 — Tehnički podaci, dnevnici i merenje posećenosti**

| **Svrha obrade** | Bezbednost platforme, sprečavanje zloupotreba, otkrivanje neovlašćenog pristupa, tehnička podrška i merenje posećenosti. |
| --- | --- |
| **Kategorije lica** | Korisnici i posetioci. |
| **Kategorije podataka** | IP adresa, podaci o uređaju i pretraživaču, vreme pristupa; dnevnik aktivnosti prijavljenih korisnika (koja je stranica otvorena i kada); revizijski dnevnik administrativnih radnji (ko je radnju izvršio, nad kojim zapisom i kada); podaci o posećenosti. |
| **Pravni osnov** | Legitimni interes (član 12 stav 1 tačka 6 ZZPL-a); za Google Analytics: pristanak posetioca (član 12 stav 1 tačka 1 ZZPL-a). |
| **Primaoci / obrađivači** | Infrastruktura; merenje bez kolačića: Vercel Inc.; Google Analytics: Google Ireland Limited, odnosno Google LLC. Dnevnike vidi samo administratorski tim; dnevnik aktivnosti: samo superadministrator. |
| **Prenos u treću zemlju** | Google LLC, samo po pristanku. |
| **Rok čuvanja** | Tehnički logovi, dnevnik aktivnosti i revizijski dnevnik: 12 meseci; dnevnik aktivnosti briše se i gašenjem naloga. Podaci o posećenosti kod Google-a: 14 meseci. |
| **Mere zaštite** | Kolačić za merenje ne postavlja se pre pristanka; Google-u se šalju adrese stranica i događaji korišćenja bez pseudonima, identifikatora naloga, iznosa i naziva programa, a stranice administratorskog panela se izuzimaju; merenje bez kolačića ne prati posetioca između sajtova; za maloletni nalog događaji se ne šalju; ime i prezime i broj telefona ne upisuju se u revizijski dnevnik. |

**Radnja obrade br. 8 — Automatizovano odlučivanje**

| **Svrha obrade** | Evidentiranje POEN-a po kanalima, obračunski koeficijent ZRNA, raspodela u okviru dnevnog limita i automatsko evidentiranje po programima podrške. |
| --- | --- |
| **Kategorije lica** | Korisnici. |
| **Kategorije podataka** | Podaci o doprinosima, parametri obračunskog okvira, podaci o pripadnosti kvalifikovanoj grupi (radnja br. 10). |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a); za programe podrške: izričit pristanak (član 17 stav 2 tačka 1 ZZPL-a). |
| **Primaoci / obrađivači** | Infrastruktura. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Kao za radnju br. 4. |
| **Mere zaštite** | Javna deterministička formula; pravo na objašnjenje logike, ljudski uvid i prigovor (član 38 ZZPL-a). Status korisnika se nikad ne menja automatski. |
| **Napomena** | Ove obrade mogu značajno uticati na lice u smislu člana 38 ZZPL-a. |

**Radnja obrade br. 9 — Oglasi**

| **Svrha obrade** | Objavljivanje ponude i potražnje radi razmene dobara i usluga na Pijaci i uspostavljanje kontakta povodom oglasa. |
| --- | --- |
| **Kategorije lica** | Korisnici koji objavljuju oglas. |
| **Kategorije podataka** | Pseudonim oglašivača, vrsta oglasa, naslov i opis dobra ili usluge, kategorija, iznos ili „po dogovoru“, mesto (naselje iz šifarnika), fotografije koje korisnik prilaže i, po izboru, broj telefona; oznaka da oglašivač nije u Kolu. |
| **Pravni osnov** | Pristanak (član 12 stav 1 tačka 1 ZZPL-a), dat objavom oglasa, uz upozorenje da je oglas javno vidljiv. Povlači se uklanjanjem oglasa, bez posledica po status. |
| **Primaoci / obrađivači** | Infrastruktura; fotografije kod Cloudflare, Inc. (Cloudflare R2). Oglas je javno dostupan, i neprijavljenim licima, i indeksiraju ga pretraživači. Broj telefona dostupan je samo učesnicima. Oglas maloletnog korisnika prikazuje se samo onima kojima je dostupan po Pravilniku o učešću dece. |
| **Prenos u treću zemlju** | Fotografije (Cloudflare R2). |
| **Rok čuvanja** | Dok korisnik oglas ne ukloni, odnosno dok oglas ne bude uklonjen po Uslovima korišćenja; prestankom statusa oglasi i fotografije se brišu. |
| **Mere zaštite** | Sadržinski minimum o dobru ili usluzi, ne o osobi (fotografija lica i ime nisu traženi); broj telefona nije javan; oznaka da oglašivač nije u Kolu. |

**Radnja obrade br. 10 — Programi podrške (posebne vrste podataka)**

| **Svrha obrade** | Automatsko evidentiranje doprinosa učesnicima koji pripadaju kvalifikovanim grupama, uz potvrdu ispunjenosti uslova (Pravilnik o programima podrške). |
| --- | --- |
| **Kategorije lica** | Učesnici koji se prijave na program; članovi Kola i osnivači od kojih se traži potvrda ispunjenosti uslova. Kod Posebne podrške i lice o kome se podnosilac neposredno stara, kada samo nije korisnik: obrađuje se samo da postoji lice kome je potrebna stalna pomoć i, kada je maloletno, datum kada navršava 18 godina, bez imena. Kod Podrške majkama i deca podnosioca koja sama nisu korisnici: samo datum rođenja, bez imena. |
| **Kategorije podataka** | Status roditelja i datumi rođenja dece; starosna dob; postojanje rešenja kojim je utvrđen stepen invaliditeta, uključujući rešenje komisije za procenu radne sposobnosti, sa datumom i datumom isteka, bez broja, organa, stepena, ocene, dijagnoze i medicinske dokumentacije, odnosno izjava o akutnoj ili hroničnoj bolesti, bez dijagnoze; izjava o gubitku doma; izjava o studiranju (ustanova i godina studija); osnov unutar programa; tekst datog pristanka; zahtevi za potvrdu i odgovori (potvrđeno, odnosno odbijeno uz obrazloženje), odnosno potvrda Fondacije uz obrazloženje. Kopije isprava se ne prikupljaju. |
| **Pravni osnov** | Izričit pristanak podnosioca (član 17 stav 2 tačka 1 ZZPL-a), dat pre prijave i pre traženja potvrde. Za podatak o detetu koje nije korisnik: saglasnost roditelja, odnosno zakonskog zastupnika (član 16 ZZPL-a), koju daje podnosilac. |
| **Primaoci / obrađivači** | Infrastruktura. Unete podatke vidi i o prijavi odlučuje samo superadministrator. Članovi Kola od kojih se traži potvrda primaju samo naziv programa i pseudonim podnosioca, bez unetih podataka. Učesnici vide pojedinačni zapis uz pseudonim primaoca podrške, naziv programa i iznos; neprijavljena lica i korisnici koji nisu u Kolu vide samo dnevni zbir po programu. Osnov unutar programa ne prikazuje se nijednom korisniku. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama; upozorenje Fondaciji i elektronska pošta ne sadrže podatke iz prijave. |
| **Rok čuvanja** | Uneti podaci čuvaju se dok prijava važi i brišu se kada prestane: povlačenjem pristanka, odbijanjem, obustavom pri reviziji ili prestankom statusa. Odgovori na zahtev za potvrdu čuvaju se uz prijavu; nedovršeni zahtevi i obaveštenja o njima brišu se okončanjem postupka. Zapis o evidentiranom POEN-u ostaje u evidenciji (radnja br. 4). |
| **Mere zaštite** | Izričit pristanak koji navodi koliko će lica biti zamoljeno, da ta lica saznaju o kom je programu reč, kako se prikazuje evidentiranje i šta se iz iznosa može izvesti; potvrdu daje samo član Kola, odnosno osnivač, koji podnosioca lično zna, a ne član bez potvrde ni član Kola koji ga je uveo u Kolo, odnosno potvrdio, posle razgovora telefonom, odnosno Fondacija kada zahtev nije upućen nijednom članu Kola (dovoljna je potvrda jednog); obaveštenje o zahtevu samo unutar Platforme: mejl i poruka na uređaj ne nose naziv programa ni pseudonim; povlačenje pristanka uz sam program, uz brisanje unetih podataka; osnov se ne prikazuje nikome, a naziv programa ne upisuje se u opis zapisa; dan sa jednim primaocem podrške se ne objavljuje. |

**Radnja obrade br. 11 — Maloletni korisnici**

| **Svrha obrade** | Učešće maloletnih korisnika u sistemu pod posebnim režimom i evidentiranje njihovog doprinosa (Pravilnik o učešću dece). |
| --- | --- |
| **Kategorije lica** | Maloletni korisnici od navršenih 7 do navršenih 18 godina; roditelji, odnosno zakonski zastupnici; članovi Kola i osnivači koji potvrđuju postojanje deteta; podnosioci prijave lažnog roditeljstva i lica na koja se ona odnosi. |
| **Kategorije podataka** | Pseudonim; podaci za pristup nalogu; elektronska adresa roditelja koju unosi maloletno lice i poziv roditelju; sopstvena elektronska adresa maloletnog korisnika, ako je navede i potvrdi; datum rođenja koji upisuje roditelj, odnosno koji je upisan odlukom o prevođenju punoletnog naloga u maloletni; veza sa najviše dva roditelja i saglasnost; stanje deteta (dete na čekanju, dete sa roditeljem, dete Kola); prijateljstva sa datumima; poruke u dečjoj Pričaonici i u razgovorima; zapisi POEN-a; oglasi; škola; zahtev za odobrenje prepisa iznad praga; zahtev roditelja za potvrdu postojanja deteta i potvrda (ko ju je dao i kada); obaveštenje o preuzimanju naloga; prijava lažnog roditeljstva (podnosilac, lice na koje se odnosi, maloletni korisnik, vreme, navodi), zaustavljanje veze i odluka. |
| **Pravni osnov** | Za maloletnog korisnika mlađeg od 15 godina: saglasnost roditelja (član 16 ZZPL-a), sa dodatnim ograničenjima. Za maloletnog korisnika koji je navršio 15 godina: izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a), u kome je on ugovorna strana, a saglasnost roditelja uslov je njegovog učešća. Za adresu roditelja i podatke maloletnog korisnika do preuzimanja naloga: legitimni interes (član 12 stav 1 tačka 6 ZZPL-a) radi pribavljanja saglasnosti. Za prijavu lažnog roditeljstva i postupak po njoj: legitimni interes: zaštita maloletnog korisnika od lica koje nije njegov roditelj. |
| **Primaoci / obrađivači** | Infrastruktura; Resend, Inc. (jedna poruka roditelju). Drugi maloletni korisnici vide poruke svojih prijatelja. Roditelj vidi prijateljstva i spisak razgovora bez sadržaja, a sadržaj samo razgovora sa punoletnim licem. Roditelj deteta Kola dobija obaveštenje kada se dete sprijatelji sa detetom koje nije dete Kola, bez sadržaja razgovora. Zahtev za potvrdu postojanja deteta vide članovi Kola i osnivači, samo uz pseudonim roditelja. Pregled dece jedne škole vidi samo dete Kola iste škole. O prijavi lažnog roditeljstva odlučuje ovlašćeno lice Fondacije. |
| **Prenos u treću zemlju** | Poruka roditelju (Resend, Inc.). |
| **Rok čuvanja** | Dok nalog postoji. Nalog koji roditelj ne preuzme u roku od 14 dana briše se, zajedno sa adresom roditelja i pozivom. Prijateljstva se brišu sticanjem punoletstva i brisanjem naloga. Sopstvena adresa: dok je maloletni korisnik ne ukloni ili mu ne prestane status; nepotvrđena adresa gubi dejstvo posle 24 sata. Škola se briše prelaskom u punoletni nalog i prestankom statusa; ranije izabrane škole se ne čuvaju. Zahtev i potvrda postojanja deteta: dok postoji veza roditelja i deteta. Prijava lažnog roditeljstva, zaustavljanje i odluka: dok postoji nalog maloletnog korisnika. |
| **Mere zaštite** | Do preuzimanja naloga obrađuje se samo ono što je potrebno za kontakt sa roditeljem; Pričaonica, škola, oglasi, komunikacija sa punoletnima i evidentiranje POEN-a tada su zatvoreni; maloletni korisnik sam briše nalog koji čeka; u poruci roditelju samo pseudonim; primalac poruke ima dve radnje za prekid obrade bez prijave; dete Kola tek kada je roditelj član Kola, odnosno osnivač, i kada postojanje deteta potvrdi član Kola, odnosno osnivač, koji roditelja lično zna; ako potvrda ne stigne, roditelju se ništa ne oduzima; roditelj ne čita razgovore između maloletnih korisnika, a punoletnom sagovorniku se prikazuje da razgovor čita roditelj; dečja Pričaonica filtrirana prijateljstvima, bez odgovora sa citatom; profil maloletnog korisnika nije dostupan punoletnima; pregled po školama zbirni i bez podataka o ličnosti; sopstvena adresa upisuje se tek po potvrdi i na nju se ne šalju obaveštenja; obaveštenje o svakom preuzimanju naloga; po prijavi lažnog roditeljstva veza se odmah zaustavlja, a podnosilac se ne otkriva licu na koje se prijava odnosi. Detaljna procena: Procena uticaja, mere za maloletne korisnike. |

**Radnja obrade br. 12 — Nadzor integriteta**

| **Svrha obrade** | Otkrivanje obrazaca koji ukazuju na zloupotrebu (lažne ili umnožene verifikacije, višestruki nalozi, slivanje POEN-a), radi očuvanja verodostojnosti verifikacija, evidencije i glasanja. |
| --- | --- |
| **Kategorije lica** | Korisnici, kroz evidenciju lanca potvrda i evidenciju doprinosa. |
| **Kategorije podataka** | Bez prikupljanja novih podataka. Obrađuju se evidencija lanca potvrda (vrsta, nadzor, vremenski žigovi), vreme nastanka naloga, metapodaci evidencije POEN-a (tip, iznos, vreme), postojanje poruka, oglasa i razmena kao da/ne, bez sadržaja, mesto, status i potvrđenost. Izvedeni zapis: nalaz (pseudonim ili grupa pseudonima, oznake pravila, ocena, status). |
| **Pravni osnov** | Legitimni interes Fondacije (član 12 stav 1 tačka 6 ZZPL-a): zaštita sistema od zloupotrebe i očuvanje integriteta evidencije i glasanja. |
| **Primaoci / obrađivači** | Infrastruktura. Nalaze vide samo superadministratori. Kanal upozorenja (Telegram Messenger Inc., Resend, Inc.) prima samo zbirne brojeve. |
| **Prenos u treću zemlju** | Kanal upozorenja, samo zbirni brojevi. |
| **Rok čuvanja** | Otvoren nalaz: dok se ne reši ljudskim pregledom; rešen ili odbačen: najduže 12 meseci. Prestankom statusa nalazi vezani za korisnika se brišu. |
| **Mere zaštite** | Sistem ne donosi automatske odluke (član 38 ZZPL-a): samo označava, a meru donosi ovlašćeno lice; pravila daju težinu odsustvu stvarne aktivnosti, a ne gustini veza; nalaz se može odbaciti; pravo na prigovor (član 37 ZZPL-a). Provera zatvorene grupe radi nad istim podacima, ne proizvodi dejstvo prema korisniku i samo prikazuje grupu Fondaciji. |
| **Napomena** | Test srazmernosti: obrada ne uvodi nove podatke, radi nad pseudonimima, ne odlučuje i podleže ljudskom pregledu i prigovoru, pa interes Fondacije i ostalih korisnika preteže nad zadiranjem u prava lica. |

**Radnja obrade br. 13 — Lista donacija**

| **Svrha obrade** | Javno priznanje javnih donacija i proverljivost evidencije prema zajednici. |
| --- | --- |
| **Kategorije lica** | Donatori koji su izabrali javnu donaciju. |
| **Kategorije podataka** | Ime i prezime, iznos i datum donacije. |
| **Pravni osnov** | Pristanak (član 12 stav 1 tačka 1 ZZPL-a), dat izborom javne donacije, za svaku donaciju posebno. |
| **Primaoci / obrađivači** | Infrastruktura. Lista je dostupna punoletnim korisnicima: kod javne donacije ime, iznos i datum, bez pseudonima i bez veze ka profilu; kod anonimne samo iznos i datum. Pseudonim donatora vide samo učesnici, u evidenciji doprinosa. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Ime se objavljuje i čuva uz zapis donacije dok donator ne povuče pristanak, odnosno do prestanka statusa; tada se uklanja iz liste i briše iz zapisa donacije, a donacija ostaje u listi iznosom i datumom (član 12 Pravilnika o pokroviteljstvu i donacijama). Iznos, datum i podaci o uplati čuvaju se po radnji br. 5. |
| **Mere zaštite** | Izbor po pojedinačnoj donaciji, uz upozorenje; povlačenje na ekranu donacija, za svaku donaciju posebno; ime se ne upisuje u opis zapisa POEN-a. |
| **Napomena** | Za anonimnu donaciju POEN se ne evidentira zato što se upis koji se ne može pripisati nijednom licu ne može proveriti (član 7 stav 3 Pravilnika o pokroviteljstvu i donacijama), a ne zato što Fondacija objavljivanje postavlja kao uslov. |

**Radnja obrade br. 14 — Nadzor verifikacija i nadzorni predmet**

| **Svrha obrade** | Upis ishoda nadzora nad verifikacijom i potvrdom i vođenje nadzornog predmeta, radi utvrđivanja lažne verifikacije (članovi 22–27 i 32 Pravilnika o dokazu stvarnosti). |
| --- | --- |
| **Kategorije lica** | Verifikator i verifikovani iz nadzirane verifikacije; nadzornik. |
| **Kategorije podataka** | Bez prikupljanja novih podataka od korisnika. Uz verifikacioni zapis: ishod nadzora (uredno, za proveru, sporno), subjekt sumnje, šifra razloga sa zatvorene liste i, samo uz razlog „ostalo“, kratak opis nadzornika; signali koji određuju redosled računaju se pri prikazu i ne čuvaju se. Nadzorni predmet: isti podaci uz oznaku zapisa i belešku uz odluku. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a): nadzor je deo mehanizma verifikacije po kome korisnik pristupa sistemu. |
| **Primaoci / obrađivači** | Infrastruktura. Ishod nadzora vide nadzornici (čuvari Kola), u obimu potrebnom za nadzor istog zapisa; nadzorni predmet: samo superadministratori. Verifikator, verifikovani i drugi korisnici ih ne vide. Kanal upozorenja prima pseudonim i šifru razloga, bez opisa. |
| **Prenos u treću zemlju** | Kanal upozorenja (Telegram Messenger Inc., Resend, Inc.). |
| **Rok čuvanja** | Predmet zatvoren nalazom da za sumnju nema osnova briše se po isteku 90 dana od zatvaranja. Ishod nadzora deli sudbinu verifikacionog zapisa. Prestankom statusa: kao evidencija lanca potvrda. |
| **Mere zaštite** | Zatvoren šifarnik razloga; nadzor ne obavlja onaj ko je u verifikaciji učestvovao; predmet ne proizvodi dejstvo prema korisniku: lažnu verifikaciju utvrđuje Fondacija odlukom, uz pravo na prigovor (nema automatizovanog odlučivanja u smislu člana 38 ZZPL-a); brisanje neosnovane sumnje po roku, bez zahteva lica. |
| **Napomena** | Za obavljen nadzor POEN se ne evidentira. Nadzor ne utiče na mogućnost verifikatora da dalje verifikuje. |

**Radnja obrade br. 15 — prestala**

Radnja je prestala; broj se ne dodeljuje drugoj radnji.

**Radnja obrade br. 16 — Kolektivna nabavka**

| **Svrha obrade** | Utvrđivanje potreba koje se ne mogu zadovoljiti unutar sistema, odlučivanje o kolektivnoj nabavci (član 47 Pravilnika o KOLO sistemu) i njeno sprovođenje: prijava, red i preuzimanje dela. |
| --- | --- |
| **Kategorije lica** | Učesnici koji podnesu predlog za nabavku ili se prijave na nabavku. Maloletni korisnici nisu obuhvaćeni. |
| **Kategorije podataka** | Predlog: pseudonim, naziv dobra iz rečnika naziva, vreme upisa. Učešće: prijava, mesto u redu, dan preuzimanja, kod za preuzimanje, vreme preuzimanja. Broj POEN-a po kome se utvrđuje red očitava se iz radnje br. 4. Isprave i izjave o delatnosti, imovini ili prilikama korisnika se ne traže. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a). Predlog i prijava su dobrovoljni. |
| **Primaoci / obrađivači** | Infrastruktura. Dobavljaču se dostavlja samo spisak kodova za preuzimanje, bez ijednog podatka o licu. Registar predloga objavljuje se zbirno, bez pseudonima. Spisak onih koji su preuzeli deo, sa pseudonimom i mestom u redu, dostupan je učesnicima, bez broja POEN-a. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Predlog se briše izborom drugog naziva, uklanjanjem, sprovođenjem nabavke tog naziva i najkasnije po isteku 12 meseci od upisa. Podaci o učešću i preuzimanju čuvaju se 10 godina, uz računovodstvenu dokumentaciju nabavke; prestankom statusa se pseudonimizuju. |
| **Mere zaštite** | Kod je jednokratan i vezan za jednu prijavu; utvrđivanje reda je primena objavljenih pravila i ne dira status, pa nema automatizovanog odlučivanja u smislu člana 38 ZZPL-a; protiv reda je dopušten prigovor (član 36 Pravilnika o projektima i kolektivnim nabavkama), o kome odlučuje čovek. |

**Radnja obrade br. 17 — Komunikacija između korisnika**

| **Svrha obrade** | Razgovori jedan na jedan, pre svega povodom oglasa, i zajednički prostor za razgovor (Pričaonica). |
| --- | --- |
| **Kategorije lica** | Korisnici koji učestvuju u razgovoru, odnosno pišu u Pričaonici. |
| **Kategorije podataka** | Razgovori: pseudonimi strana, sadržaj poruka, vreme slanja i pročitanosti, oglas povodom koga je razgovor pokrenut i ko ga je pokrenuo. Pričaonica: pseudonim, sadržaj poruke, soba (punoletni, odnosno dečja), vreme; kod uklonjene poruke: ko ju je uklonio, kada i razlog. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a). |
| **Primaoci / obrađivači** | Infrastruktura; Resend, Inc. (isečak nove poruke od 120 znakova u obaveštenju elektronskom poštom). Razgovor vidi samo druga strana; roditelj maloletnog korisnika čita njegov razgovor sa punoletnim licem (radnja br. 11). Poruke u Pričaonici vide prijavljeni korisnici iste sobe; u dečjoj sobi maloletni korisnik vidi poruke svojih prijatelja. Fondacija sadržaj vidi samo radi uklanjanja sadržaja po članu 29 Uslova korišćenja. |
| **Prenos u treću zemlju** | Isečak poruke u obaveštenju elektronskom poštom (Resend, Inc.). |
| **Rok čuvanja** | Poruke u razgovoru brišu se kada bar jedna strana ugasi nalog, odnosno kada od poslednje poruke prođu 24 meseca. Poruke u Pričaonici brišu se posle 30 dana. |
| **Mere zaštite** | Razgovor je zatvoren za treća lica; sadržaj ne ulazi u javne prikaze ni agregate; korisnik koji nije u Kolu prvi piše samo oglašivaču povodom oglasa, uz dnevno ograničenje novih razgovora; sadržaj poruke ne prepisuje se u revizijski dnevnik pri uklanjanju; punoletnom sagovorniku maloletnog korisnika prikazuje se da razgovor čita roditelj. |

**Radnja obrade br. 18 — Dokaz pristanka i zasnivanja ugovornog odnosa**

| **Svrha obrade** | Dokazivanje da je lice dalo pristanak za obrade čiji je to osnov i da je prihvatanjem Uslova korišćenja zasnovan ugovorni odnos (član 15 stav 1 ZZPL-a). |
| --- | --- |
| **Kategorije lica** | Korisnici; roditelji, odnosno zakonski zastupnici maloletnih korisnika. |
| **Kategorije podataka** | Vrsta prihvaćenog akta, odnosno pristanka, oznaka verzije, tekst koji je bio prikazan, jezik prikaza, trenutak davanja i, ako je do njega došlo, trenutak povlačenja. IP adresa, podaci o uređaju i drugi identifikatori se ne beleže. |
| **Pravni osnov** | Zakonska obaveza (član 12 stav 1 tačka 3 ZZPL-a): teret dokazivanja pristanka iz člana 15 stav 1 ZZPL-a. |
| **Primaoci / obrađivači** | Infrastruktura. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Dok traje obrada za koju je pristanak dat i posle toga dok se po tom osnovu može isticati ili osporavati pravni zahtev. Povlačenjem pristanka zapis se ne briše, nego se u njemu beleži trenutak povlačenja (član 15 stav 3 ZZPL-a). |
| **Mere zaštite** | Zapis nastaje u istoj atomskoj radnji kojom i nalog; provera na strani rukovaoca; prihvatanje svakog akta beleži se odvojeno; verzija upućuje na objavljen tekst koji se ne menja. |
| **Napomena** | Za pristanak na kolačiće koji nisu neophodni zapis uz nalog vodi se samo za prijavljenog korisnika; za neprijavljenog posetioca odluka se beleži samo u kolačiću, uz verziju obaveštenja. |

**Radnja obrade br. 19 — Zadrugari i lice koje radi u ime zadruge**

| **Svrha obrade** | Povezivanje naloga učesnika sa zadrugom, utvrđivanje broja zadrugara za pragove rasta zapisa zadruge (Pravilnik o zadrugama) i rad lica koje zadruga predloži sa zapisom i zadrugarima te zadruge. |
| --- | --- |
| **Kategorije lica** | Učesnici koje je zadruga primila u članstvo i koji su pristali da zadruga Fondaciji dostavi njihove podatke; lice koje zadruga predloži za rad u njeno ime (zadružni administrator). Maloletni korisnici nisu obuhvaćeni. |
| **Kategorije podataka** | Zadrugar: ime i prezime (upisuje se u evidenciju identiteta, radnja br. 21), pseudonim, naziv zadruge, trenutak povezivanja i prestanka svojstva zadrugara. Zadružni administrator: pseudonim, zadruga za koju je ovlašćen, trenutak dodele i opoziva ovlašćenja i radnje koje je izvršio u zapisu zadruge. Izvor podataka o zadrugaru je zadruga. |
| **Pravni osnov** | Zadrugar: pristanak (član 12 stav 1 tačka 1 ZZPL-a) da zadruga Fondaciji dostavi ime i prezime i pseudonim; povlačenjem pristanka svojstvo zadrugara prestaje, a POEN u zapisu ostaje njegov. Zadružni administrator: izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a), na osnovu ovlašćenja koje je prihvatio. |
| **Primaoci / obrađivači** | Infrastruktura. Ime i prezime i broj telefona sa profila zadrugara dostupni su administratorskom timu i zadružnom administratoru, samo za zadrugare njegove zadruge. Zapisi zadruge dostupni su učesnicima pod nazivom zadruge, a zadrugari pod pseudonimom. Kada zadruga pomaže u sporu između korisnika, podatke joj daju same strane i zadruga je za njih rukovalac; Fondacija joj ne dostavlja podatke o korisnicima (član 18 Pravilnika o zadrugama). |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Veza naloga sa zadrugom i trenuci povezivanja i prestanka zadržavaju se pod pseudonimom radi provere već evidentiranih pragova; prestankom statusa dele sudbinu evidencije doprinosa (radnja br. 4). Ime i prezime: po radnji br. 21. Podaci o ovlašćenju zadružnog administratora: dok postoji njegov nalog; radnje u revizijskom dnevniku: po radnji br. 7. |
| **Mere zaštite** | Ime ne ulazi ni u jedan prikaz drugim korisnicima; zadružni administrator ima zasebnu ulogu vezanu za jednu zadrugu, radi samo u njenom zapisu i sa njenim zadrugarima, ne vidi ostatak administratorskog panela ni posebne vrste podataka i pre ovlašćenja potpisuje izjavu o poverljivosti. |
| **Napomena** | Svojstvo zadrugara ne daje dodatno ovlašćenje u sistemu, a zadruga ne potvrđuje stvarnost korisnika. |

**Radnja obrade br. 20 — Gazdinstva i mapa domaćih proizvođača**

| **Svrha obrade** | Prikaz odobrenog gazdinstva na mapi i na profilu gazdinstva, povezivanje oglasa sa gazdinstvom (oznaka DOMAĆE) i utvrđivanje uslova za doprinos gazdinstva (Pravilnik o gazdinstvima). |
| --- | --- |
| **Kategorije lica** | Punoletni korisnici koji prijave gazdinstvo ili mu pristupe. Maloletni korisnici nisu obuhvaćeni (član 29 Pravilnika o učešću dece). |
| **Kategorije podataka** | Naziv, naselje, adresa i tačna lokacija gazdinstva, opis proizvodnje, uloga podnosioca (nosilac ili član), broj poljoprivrednog gazdinstva (BPG) ili oznaka da gazdinstvo nije upisano u Registar poljoprivrednih gazdinstava, pseudonimi članova, red i trenutak pristupanja, ko je koga pozvao, izjava o tačnosti podataka i izjava člana da na gazdinstvu radi (trenutak i tekst), izjava o prikazu adrese; broj telefona nosioca za razgovor pre odobrenja i podatak da je razgovor obavljen, ko ga je zabeležio i da li je naveden osnov za sumnju (član 8 Pravilnika o gazdinstvima); lice koje odgovara za izjavu o tačnosti, upit članu da je preuzme, odgovor i trenutak (član 12 Pravilnika o gazdinstvima); odluke Fondacije o prijavi, pristupanju i poništenju i podatak o prestanku gazdinstva i njegovom osnovu (članovi 22 i 23 Pravilnika o gazdinstvima); trenutak od kog bar jedan član gazdinstva neprekidno ima aktivan oglas kojim nudi (za zbirni pokazatelj stalne ponude; briše se danom bez ponude). |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a); prikaz na mapi je deo učešća gazdinstva i uslov doprinosa gazdinstva (član 19 Pravilnika o gazdinstvima). |
| **Primaoci / obrađivači** | Infrastruktura. Naziv, opis, adresa i lokacija, oglasi gazdinstva i pseudonimi članova javni su svima; adresa se ispisuje na osnovu izjave podnosioca, koja je deo prijave. BPG, izjava o tačnosti i broj telefona nosioca dostupni su samo administratorskom timu. Mapa koristi javne kartografske podloge, kojima se lokacija ne dostavlja kao podatak vezan za korisnika; pretraga adrese pri prijavi ide iz pretraživača podnosioca servisu OpenStreetMap Foundation (Nominatim, Ujedinjeno Kraljevstvo). |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama; upit za pretragu adrese podnosilac šalje sam, iz svog pretraživača. |
| **Rok čuvanja** | Broj telefona nosioca briše se odlukom o prijavi; ostali podaci: dok je gazdinstvo odobreno i ima bar jednog člana. Prestankom gazdinstva, po svakom osnovu, naziv, opis, adresa, lokacija i BPG se brišu, a tačka se uklanja sa mape. Istupanjem i gašenjem naloga član prestaje da se prikazuje. Veza člana sa gazdinstvom, red pristupanja, izjava o tačnosti i podatak o prestanku zadržavaju se pod pseudonimom, radi pravila o jednom gazdinstvu, otpisa pri prestanku i postupka po lažnoj izjavi; prestankom statusa dele sudbinu evidencije doprinosa (radnja br. 4). |
| **Mere zaštite** | Samo punoletni nalozi; prijavu i svako pristupanje Fondacija pregleda pre prikaza; izvod iz Registra poljoprivrednih gazdinstava se ne prikuplja i BPG se ne proverava u registru; Fondacija razgovara samo sa nosiocem i broj telefona ostalih članova ne prikuplja. |
| **Napomena** | Gazdinstvo nema zapis u Protokolu; zapisi doprinosa gazdinstva vode se u radnji br. 4, a ime i prezime članova u radnji br. 21. Razgovor sa nosiocem služi odobrenju gazdinstva, ne potvrdi stvarnosti. Prijava gazdinstva nosiocu koji je korisnik donosi ponudu za spisak za poziv (radnja br. 24); broj za spisak nosilac ostavlja posebno, kada pristane na poziv. |

**Radnja obrade br. 21 — Evidencija identiteta**

| **Svrha obrade** | Ostvarivanje načela jedna osoba, jedan nalog i provera osnova po kome je doprinos evidentiran (član 31 Pravilnika o KOLO sistemu), uključujući poređenje imena uz različite naloge i proveru pri pozivu sa spiska za poziv (radnja br. 24). |
| --- | --- |
| **Kategorije lica** | Punoletni korisnici koji prijave gazdinstvo ili mu pristupe, čija je javna donacija utvrđena, koji steknu svojstvo zadrugara, kojima je utvrđen prijem pokroviteljstva po prijavi koju su podneli, ili koji ulaze na spisak za poziv. Maloletni korisnici nisu obuhvaćeni. |
| **Kategorije podataka** | Ime i prezime, pseudonim naloga, slučaj prvog upisa (gazdinstvo, javna donacija, zadruga, pokroviteljstvo, spisak za poziv), trenutak upisa i izmene. Jedinstveni matični broj građana, broj lične karte i podaci iz drugih isprava se ne obrađuju, a kopije isprava se ne čuvaju. Izvor: sam korisnik (gazdinstvo, pokroviteljstvo, spisak za poziv), zapis javne donacije i zadruga. |
| **Pravni osnov** | Upis: izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a): ime se upisuje radi učešća koje je korisnik sam zatražio. Zadržavanje posle prestanka tog učešća i poređenje sa drugim nalozima: legitimni interes Fondacije (član 12 stav 1 tačka 6 ZZPL-a) da isto lice ne vodi više naloga i da se osnov evidentiranog doprinosa može proveriti. |
| **Primaoci / obrađivači** | Infrastruktura. Ime ne prikazuje se drugim korisnicima i ne upisuje se u evidenciju doprinosa; dostupno je administratorskom timu, samom korisniku, zadružnom administratoru za zadrugare njegove zadruge (radnja br. 19) i članu Kola koji korisnika poziva sa spiska za poziv: klikom i samo dok je poziv otvoren (radnja br. 24). |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Dok nalog postoji; briše se prestankom statusa. Prestanak svojstva zadrugara, istupanje iz gazdinstva i povlačenje pristanka na objavljivanje imena uz javnu donaciju ne brišu upis. |
| **Mere zaštite** | Odvojena evidencija; jedno ime po nalogu: drugačije ime ne prepisuje upisano; ispravka samo po prigovoru; ime se ne upisuje u opis zapisa POEN-a, obaveštenja ni revizijski dnevnik; zatečena imena se ne prenose retroaktivno. |
| **Napomena** | Upis nije verifikacija i nikad ne potvrđuje stvarnost. Test srazmernosti: ime se ne koristi ni u koju drugu svrhu, ne obrađuje se nijedan podatak iz isprava i briše se prestankom statusa, pa interes Fondacije preteže; lice može podneti prigovor. |

**Radnja obrade br. 22 — Vaučeri iz pokroviteljstva dobrima i uslugama**

| **Svrha obrade** | Raspodela vaučera: uzimanje vaučera i poništenje zapisa POEN-a pri uzimanju, prikaz zapisa o poništenju, potvrda iskorišćenja kod davaoca, zaštita prava imaoca prema davaocu i odlučivanje po prigovoru (Glava IV Pravilnika o pokroviteljstvu i donacijama, Glava VII Pravilnika o projektima i kolektivnim nabavkama). |
| --- | --- |
| **Kategorije lica** | Učesnici koji uzmu vaučer; lica koja davalac odredi da u njegovo ime potvrđuju vaučere. Maloletni korisnici nisu obuhvaćeni. |
| **Kategorije podataka** | Izjava imaoca da nije lice povezano sa davaocem i pristanak na prikaz zapisa o poništenju; vaučer i njegov kod; vreme uzimanja; broj POEN-a poništen pri uzimanju; opis dobra, odnosno usluge i naziv davaoca u zapisu o poništenju; vreme iskorišćenja i ko ga je potvrdio; prigovor i odluka; za lice koje je davalac odredio: davalac, vreme određivanja i opoziva i potvrđeni vaučeri. Kada se vaučer odnosi na uslugu iz koje se može zaključiti nešto o zdravlju, opis je podatak o zdravlju. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a); za prikaz zapisa o poništenju sa opisom uz pseudonim i za uvid davaoca u pseudonim imaoca: pristanak (član 12 stav 1 tačka 1 ZZPL-a), odnosno izričit pristanak za podatke o zdravlju (član 17 stav 2 tačka 1 ZZPL-a), dat pri uzimanju vaučera. |
| **Primaoci / obrađivači** | Infrastruktura. Administratorski tim; davalac i lica koja je odredio (opis, važenje i pseudonim imaoca); učesnici kojima je dostupna evidencija (zapis o poništenju sa opisom i nazivom davaoca uz pseudonim). |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | 10 godina od isteka roka važenja vaučera, uz računovodstvenu dokumentaciju; zapis o poništenju ostaje u evidenciji doprinosa, a povlačenjem pristanka opis dobra, odnosno usluge i naziv davaoca brišu se iz opisa zapisa (član 33 stav 2 Pravilnika o projektima i kolektivnim nabavkama). |
| **Mere zaštite** | Pristanak se traži pre uzimanja, uz upozorenje da prikaz može otkriti podatke o imaocu, i o zdravlju; uzimanje je dobrovoljno; vaučer je imenski i neprenosiv; vaučere potvrđuju samo lica koja je davalac odredio. Vaučer se uzima bez reda: nema automatizovanog odlučivanja u smislu člana 38 ZZPL-a; o prigovoru odlučuje čovek. |

**Radnja obrade br. 23 — Preporuke**

| **Svrha obrade** | Prikaz broja primljenih preporuka i sprečavanje da isti član Kola istog korisnika preporuči više puta (član 20 Pravilnika o dokazu stvarnosti). |
| --- | --- |
| **Kategorije lica** | Punoletni članovi Kola i osnivači koji daju preporuku i punoletni korisnici koji je primaju. |
| **Kategorije podataka** | Pseudonim onoga ko preporučuje, pseudonim preporučenog i vreme. Bez teksta, ocene i obrazloženja. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a). |
| **Primaoci / obrađivači** | Infrastruktura. Drugima se prikazuje samo broj; ko je koga preporučio vidi samo onaj ko je preporuku dao. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Dok se preporuka ne povuče; briše se prestankom statusa onoga ko ju je dao, odnosno primio. |
| **Mere zaštite** | Samo broj; jedna po paru; maloletni korisnik je ne daje i ne prima; član bez potvrde je ne daje. Preporuka ne proizvodi zapis POEN-a i ne utiče na status, pristup ni prikaz oglasa. |

**Radnja obrade br. 24 — Spisak za poziv i sprečavanje višestrukih naloga**

| **Svrha obrade** | Da korisnik koji ne poznaje nijednog člana Kola bude pozvan radi upoznavanja, posle kog ga član Kola može uvesti u Kolo, i da član bez potvrde koji ispunjava uslove bude pozvan od čuvara Kola radi potvrde (članovi 8–13 i 16 Pravilnika o dokazu stvarnosti); provera da član Kola razgovara sa licem koje je na spisak dospelo; utvrđivanje zloupotrebe imena i broja; sprečavanje višestrukih naloga: poređenje imena i broja sa podacima uz druge naloge i utvrđivanje višestrukog naloga (član 14 Pravilnika o dokazu stvarnosti). |
| --- | --- |
| **Kategorije lica** | Korisnici koji podnesu zahtev za razgovor, odnosno prihvate ponudu za spisak posle javne donacije od najmanje 5.000 dinara izvršene jednom uplatom (uz poklapanje imena uplatioca), posle utvrđenog prijema novčanog pokroviteljstva ili posle prijave gazdinstva kao nosilac; članovi bez potvrde koji podnesu zahtev radi potvrde; članovi Kola koji poziv otvore. Maloletni korisnici nisu obuhvaćeni. |
| **Kategorije podataka** | Pseudonim i osnov dospeća na spisak; kod zahteva radi potvrde i podatak da je podnosilac upisao ZRNO; mesto, kratak opis čime se bavi i vreme dostupnosti; ime i prezime (u evidenciju identiteta, radnja br. 21), mesto i broj telefona koje korisnik sam upisuje pre ulaska na spisak; oznaka poklapanja broja, odnosno imena, sa drugim nalogom i mesto tog naloga; odluka o utvrđenju višestrukog naloga sa obrazloženjem i iznosom otpisa i nadzorni predmet uz nju, sa pseudonimima primalaca prepisa i zbirom prepisa; tekst pristanka i obaveštenja i vreme davanja; kod kog je člana Kola poziv otvoren i do kada; zapis o tome koji je član Kola podatke otvorio i kada; trenutak izjave o poverljivosti člana Kola. |
| **Pravni osnov** | Izričit pristanak (član 12 stav 1 tačka 1 ZZPL-a): korisnik pristaje na poziv i sam ostavlja broj, pošto je obavešten da će ga pozvati član Kola i da će taj član videti njegovo ime i broj; pristanak se povlači u svakom trenutku, bez posledica po status, donaciju, pokroviteljstvo, gazdinstvo i doprinos po njima. Za čuvanje imena, mesta i broja posle poziva, poređenje sa drugim nalozima i utvrđivanje višestrukog naloga: legitimni interes Fondacije (član 12 stav 1 tačka 6 ZZPL-a) da isto lice ne vodi više naloga. Za zapis o tome ko je podatke otvorio: legitimni interes da se zloupotreba imena i broja može utvrditi iz sistema. |
| **Primaoci / obrađivači** | Infrastruktura; obaveštenje na uređaj preko servisa za obaveštenja pretraživača. Spisak (pseudonim, osnov, mesto, opis, vreme dostupnosti) vide članovi Kola, a zahtev radi potvrde samo čuvari Kola; članovi bez potvrde ga ne vide. Ime i broj otvaraju se klikom, samo članu Kola koji je poziv otvorio i dok je poziv otvoren; član Kola ih obrađuje po ovlašćenju Fondacije, samo radi tog razgovora, a ne kao samostalan primalac. Uz ime i broj član Kola vidi oznaku poklapanja i mesto drugog naloga, ali ne i njegov pseudonim; oba naloga, odluku o utvrđenju, nadzorni predmet i zapis o otvaranju vidi samo administratorski tim. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Korisnik se uklanja sa spiska, a podaci iz zahteva brišu se, kada uđe u Kolo, kada član bez potvrde bude potvrđen, kada povuče pristanak, odnosno zahtev, i prestankom statusa. Podatak o tekućem otvaranju briše se zatvaranjem poziva. Zapis o otvaranju čuva se dok postoji nalog pozvanog. Mesto i broj čuvaju se dok postoji nalog; ime: po radnji br. 21. Odluka o utvrđenju višestrukog naloga i nadzorni predmet čuvaju se dok postoji nalog koji je lice zadržalo. |
| **Mere zaštite** | Ime i broj skriveni do otvaranja; poziv je u isto vreme otvoren kod jednog člana Kola, a jedan član Kola drži jedan otvoren poziv; pre prvog otvaranja član Kola izjavljuje da podatke ne beleži i nikome ne prosleđuje; ime i broj ne upisuju se u obaveštenja, revizijski dnevnik ni mejl, a broj sa spiska ne prikazuje se nigde drugde; zloupotreba je povreda Uslova korišćenja (član 28); poređenje ništa ne blokira, a o višestrukom nalogu odlučuje Fondacija uz obrazloženje i prigovor; zapis o otvaranju ne izvozi se kroz Platformu, a korisnik ga dobija na zahtev upućen na privatnost@ekolo.rs. Na osnovu spiska i poređenja ne donosi se automatska odluka u smislu člana 38 ZZPL-a. |
| **Napomena** | Test srazmernosti: zapis o otvaranju sadrži samo pseudonime i vreme, vidi ga samo administratorski tim, a korisnik i član Kola o njemu su unapred obavešteni; poređenje ne otkriva ime ni pseudonim drugog lica i ne proizvodi dejstvo bez odluke. Dospeće na spisak i razgovor nisu verifikacija; donacija, pokroviteljstvo i gazdinstvo ne zavise od poziva. |

**Radnja obrade br. 25 — Glasanje i delegiranje u Gornjem Kolu**

| **Svrha obrade** | Utvrđivanje sastava i glasačke moći Gornjeg Kola za svaki obračunski period, predlaganje, glasanje, delegiranje glasačke moći, sprovođenje odluka i vođenje registra odluka (članovi 43–46 Pravilnika o KOLO sistemu, Pravilnik o Gornjem Kolu). Obrada se vrši od Faze 2. |
| --- | --- |
| **Kategorije lica** | Čuvari Kola sa aktiviranim ZRNOM; učesnici koji podnesu predlog; čuvari Kola koji predlog podrže; delegatori i delegati; članovi Upravnog odbora čiji se glas navodi u aktu Upravnog odbora. |
| **Kategorije podataka** | Pseudonim predlagača, naslov i obrazloženje predloga, pseudonimi čuvara Kola koji su predlog podržali i broj podrški, vrsta odluke, vreme glasanja; glas svakog člana (za, protiv, odnosno izbor) sa glasačkom moći u trenutku glasanja; veza delegatora i delegata i zakazana promena; zbirovi i ishod; podaci o sprovođenju, odbijanju i odgovoru Upravnog odbora. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a): učešće u Gornjem Kolu sadržina je odnosa po kome čuvar Kola koristi sistem. Za navođenje glasa člana Upravnog odbora u aktu Upravnog odbora: legitimni interes Fondacije (član 12 stav 1 tačka 6 ZZPL-a): proverljivost postupanja organa Fondacije (član 46 stav 5 Pravilnika o KOLO sistemu). |
| **Primaoci / obrađivači** | Infrastruktura. Predlozi, broj podrški, zbirovi i registar odluka dostupni su korisnicima; pseudonime predlagača i čuvara Kola koji su predlog podržali vide samo učesnici (član 19 Pravilnika o Gornjem Kolu). Pojedinačni glas i delegiranje ne objavljuju se. U aktu Upravnog odbora navodi se kako su njegovi članovi glasali. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama. |
| **Rok čuvanja** | Registar odluka čuva se za vreme trajanja sistema i ne sadrži pojedinačne glasove. Pojedinačni glasovi čuvaju se dok postoji nalog; prestankom statusa se pseudonimizuju. Delegiranje prestaje i briše se opozivom i izlaskom iz sistema. |
| **Mere zaštite** | Pojedinačni glas se ne objavljuje; glasačka moć je ⌊√a⌋ aktiviranog ZRNA, pa iz zbira ne proizlazi stanje pojedinca; ishod se utvrđuje primenom objavljenih pravila, a odluku sprovodi Upravni odbor aktom: nema automatizovanog odlučivanja u smislu člana 38 ZZPL-a; u aktu Upravnog odbora članovi se navode imenom, bez pseudonima. |

**Radnja obrade br. 26 — Operativni doprinos**

| **Svrha obrade** | Objava zadataka za zajedničko dobro, prijava i prijem izvršioca, potvrda izvršenja i evidentiranje POEN-a u okviru dnevnog limita (Pravilnik o operativnom doprinosu). |
| --- | --- |
| **Kategorije lica** | Učesnici koji se prijave na zadatak; izvršioci kojima zadruga dodeli celinu zadružnog doprinosa; lica koja potvrđuju izvršenje; predlagači zadataka; učesnici koji podnesu primedbu. |
| **Kategorije podataka** | Pseudonim podnosioca, plan izvršenja, snimljen tekst izjave izvršioca o pravnoj prirodi operativnog doprinosa i trenutak izjave, status prijave i obrazloženje odbijanja; za svako izvršenje: dan, broj celina, opis, dokaz o izvršenju (fotografija ili link), predloženi i evidentirani POEN, ko je izvršenje potvrdio i kada; za zadružni doprinos i zadruga koja je celinu dodelila (član 23 Pravilnika o operativnom doprinosu); primedbe i odluke o njima. |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a). Snimljen tekst izjave čuva se i po osnovu legitimnog interesa Fondacije (član 12 stav 1 tačka 6 ZZPL-a): dokaz pravne prirode doprinosa i odbrana pravnih zahteva. |
| **Primaoci / obrađivači** | Infrastruktura; fotografija dokaza kod Cloudflare, Inc. (Cloudflare R2). Prijave i planovi, pseudonimi izvršioca i lica koje potvrđuje, odluke, evidentirani POEN-i i primedbe dostupni su samo učesnicima (član 25 Pravilnika o operativnom doprinosu); dokaz vide lica koja potvrđuju izvršenje i administratorski tim. Kanal upozorenja Fondaciji prima naziv zadatka, pseudonim i predloženi POEN. |
| **Prenos u treću zemlju** | Fotografija dokaza (Cloudflare R2) i kanal upozorenja (Telegram Messenger Inc.). |
| **Rok čuvanja** | Dok nalog postoji. Prestankom statusa brišu se plan izvršenja, opis i dokaz o izvršenju, uključujući fotografiju u skladištu; snimljena izjava i numerički podaci o izvršenju zadržavaju se pod pseudonimom, kao evidencija doprinosa (radnja br. 4). |
| **Mere zaštite** | Izvršilac i lice koje potvrđuje prikazuju se samo pod pseudonimom; lični podaci se ne objavljuju kroz kanal operativnog doprinosa; dokaz se odnosi na izvršen posao, a ne na lice; lice koje potvrđuje ne odlučuje u stvari u kojoj je u sukobu interesa; raspodela u okviru dnevnog limita je primena objavljene formule, bez automatizovanog odlučivanja o statusu. |

**Radnja obrade br. 27 — Prigovori, prijave i moderacija**

| **Svrha obrade** | Odlučivanje po prigovoru na odluku (član 40 Uslova korišćenja), po prijavi oglasa i po prijavi neispunjene razmene; uklanjanje sadržaja, suspenzija i isključenje (Uslovi korišćenja); prijava greške na Platformi. |
| --- | --- |
| **Kategorije lica** | Podnosioci prigovora i prijava; lica na koja se prijava ili odluka odnosi; korisnici koji prijave grešku. |
| **Kategorije podataka** | Vrsta i predmet prigovora, opis, status, odgovor, ko je odlučio i kada; prijava oglasa (razlog sa zatvorene liste, opis, podnosilac, oglas, odluka); prijava razmene (prepis, podnosilac i druga strana, opis, izjašnjenje druge strane, odluka i iznos ispravke); odluka o uklanjanju sadržaja, suspenziji ili isključenju sa razlogom; prijava greške (naslov, opis, odgovor). |
| **Pravni osnov** | Izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a); za podatke o licu na koje se prijava odnosi: legitimni interes Fondacije (član 12 stav 1 tačka 6 ZZPL-a) da sprovodi pravila sistema i štiti ostale korisnike. |
| **Primaoci / obrađivači** | Infrastruktura. Prigovore, prijave i predmete vidi administratorski tim. Oglašivaču se ne otkriva ko je prijavio oglas; kod prijave razmene druga strana prepisa poziva se da se izjasni i saopštava joj se obrazloženje odluke. Podnosilac dobija odluku sa obrazloženjem. Spisak prijava grešaka, sa naslovom, pseudonimom prijavioca i statusom, vide prijavljeni punoletni korisnici; kanal upozorenja Fondaciji prima naslov prijave greške i pseudonim. |
| **Prenos u treću zemlju** | Kanal upozorenja (Telegram Messenger Inc.). |
| **Rok čuvanja** | Dok postoji nalog podnosioca; prestankom statusa opis i drugi slobodan tekst se brišu, a odluka i njeno dejstvo zadržavaju se pod pseudonimom, radi odbrane pravnih zahteva. Prijava greške briše se prestankom statusa. Ispravka zapisa POEN-a ostaje u evidenciji (radnja br. 4). |
| **Mere zaštite** | O svakoj odluci odlučuje čovek, uz obrazloženje; podnosilac prijave oglasa se ne otkriva; sadržaj uklonjene poruke ne prepisuje se u revizijski dnevnik; razlozi sa zatvorene liste; radnje beleže se u revizijskom dnevniku. |

**Radnja obrade br. 28 — Kutija želja (dečji prostor)**

| **Svrha obrade** | Učešće maloletnih korisnika u oblikovanju dečjeg prostora predlozima i podrškom (Pravilnik o učešću dece, član 28). |
| --- | --- |
| **Kategorije lica** | Maloletni korisnici u stanju dete sa roditeljem i dete Kola; njihovi roditelji (samo kao primaoci teksta predloga svog deteta). |
| **Kategorije podataka** | Tekst predloga, podrška (koji je predlog maloletni korisnik podržao), stanje predloga, razlog odbijanja i odgovor Fondacije. |
| **Pravni osnov** | Kao za radnju br. 11: za maloletnog korisnika mlađeg od 15 godina saglasnost roditelja (član 16 ZZPL-a); za maloletnog korisnika koji je navršio 15 godina izvršenje ugovora (član 12 stav 1 tačka 2 ZZPL-a). |
| **Primaoci / obrađivači** | Infrastruktura. Administratorski tim pregleda predlog pre prikaza, bez podatka o autoru. Druga deca vide tekst predloga bez autora; roditelj samo tekst predloga svog deteta. Autor se ne prikazuje nikome. |
| **Prenos u treću zemlju** | Samo po zajedničkim odredbama; obaveštenja ne sadrže tekst predloga. |
| **Rok čuvanja** | Dok postoji nalog maloletnog korisnika. Brisanjem naloga i sticanjem punoletstva brišu se predlozi, sa podrškama i odgovorom, i podrške koje je maloletni korisnik dao. |
| **Mere zaštite** | Pregled pre prikaza i odbijanje bez prepravke; autor se ne prikazuje ni administratorskom timu; nema komentara ni rang-liste dece; obaveštenja bez teksta; Google Analytics se ne učitava. Izvoz podataka obuhvata predloge i podrške. |

## Završne odredbe

Registar se ažurira pri svakoj promeni radnje obrade ili tehničkih i organizacionih mera zaštite, a nova radnja upisuje se zajedno sa izmenom Procene uticaja na zaštitu podataka o ličnosti. Registar je dostupan Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti na zahtev.

Ovaj registar stupa na snagu danom donošenja.
