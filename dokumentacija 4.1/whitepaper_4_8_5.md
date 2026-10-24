# KOLO Whitepaper

*Participatorni sistem zajedničkog dobra*

# Sažetak

Zajednice koje žele da organizuju sopstvenu razmenu suočavaju se sa tri problema koja nijedan postojeći model ne rešava istovremeno: skaliranje, poverenje i regulatorni okvir. Trampa ne skalira. Vremenske banke i LETS sistemi zahtevaju poverenje koje ne mogu da obezbede kad prerastu lokalnu grupu. Lokalne valute su zbog svojih strukturnih karakteristika podložne kvalifikaciji kao finansijski instrumenti, čime potpadaju pod regulatorne okvire koji im nisu namenjeni. Razvoj digitalne infrastrukture, pojava modela zasnovanih na zajedničkom dobru i institucionalno prepoznavanje socijalne ekonomije na nivou EU i UN-a stvaraju uslove u kojima celovito rešenje postaje izvodljivo.

KOLO je participatorni sistem zajedničkog dobra koji adresira ove probleme evidencijom doprinosa — beleženjem ko je doprineo, koliko i na koji način, kroz formalizovana pravila ugrađena u softver.

U centru sistema je zajedničko dobro — kolektivno dobro svih korisnika nad kojim nijedan pojedinac, uključujući osnivača, nema individualno svojinsko pravo, a koje ne predstavlja kolektivnu svojinu u smislu važećih imovinskopravnih kategorija srpskog prava. Doprinosi i položaj evidentiraju se kroz protokol i njegove dve obračunske jedinice: POEN i ZRNO. Protokol je tehnički mehanizam zajedničkog dobra — vodi evidenciju, obračunava odnose i izvršava pravila koja postavljaju ljudi.

Integritet sistema počiva na modelu dokaza stvarnosti — lancu potvrda zasnovanom na ličnom poznavanju ili na razgovoru posle poziva — u kome učesnici utvrđuju stvarnost i kontinuitet novih korisnika; da isto lice nema drugi nalog verifikator ne jemči, nego to utvrđuje fondacija, poređenjem podataka i obraćanjem licu. Ovaj model je svesna dizajnerska odluka koja minimizira prikupljanje ličnih podataka, u skladu sa principom minimizacije podataka ugrađenim u sistem.

Oko zajedničkog dobra stoje dva aktera. KOLO Fondacija je pravni instrument — pravno lice registrovano u Somboru po Zakonu o zadužbinama i fondacijama, koje daje zajedničkom dobru i protokolu pravni oblik prepoznatljiv državi i pravu, prima dinarske donacije i drži infrastrukturu na kojoj protokol radi. Fondacija nije vlasnik sistema. KOLO Zajednicu čine svi korisnici sistema — oni ga koriste, doprinose mu i zajedno brinu o zajedničkom dobru, a u upravljanju učestvuju kroz Gornje Kolo.

Zajednica finansira Fondaciju dinarskim donacijama. Fondacija troši ta sredstva na infrastrukturu i programe. Dinarska sredstva ne ulaze u interni obračunski sistem — ne postoji konverzija dinara u POEN-e ni POEN-a u dinare. Doprinos donatora se evidentira u POEN-ima, ali ta evidencija nije protivusluga za donaciju — to su dva pravno nezavisna akta (poglavlje 4).

Protokol vodi evidenciju kroz dve obračunske jedinice. POEN evidentira doprinos — zapise upisuje isključivo protokol, korisnici nemaju imovinsko pravo nad njima, a POEN se ne može konvertovati u novac niti koristiti van sistema. ZRNO evidentira položaj — ukupan broj je fiksiran na milion, ZRNO je neprenosivo između korisnika, a čuvar Kola — član Kola kome je ZRNO upisano — može da ga koristi za učešće u upravljanju ili za poziciju u obračunskom sistemu. Obračunski koeficijent između ove dve jedinice je administrativna veličina koju protokol izračunava dnevno (poglavlje 6).

Sistem je modularan. Osnova — Fondacija, protokol, POEN, ZRNO, korisnici, dokaz stvarnosti, finansijski i operativni doprinos — funkcioniše samostalno. Dodatni moduli se aktiviraju prema potrebi i spremnosti sistema. Upravljanje sledi putanju progresivne decentralizacije — od osnivača i fondacije u prvoj fazi, do Gornjeg Kola koje nastaje automatski sa aktivacijom ZRNA kao telo zajednice koje utvrđuje predloge o pravilima sistema, a čine ga čuvari Kola koji su aktivirali ZRNO (poglavlje 10). Sadržaj sistema je licenciran pod CC BY-SA 4.0, softver pod AGPL-3.0.

Fondacija je rukovalac podataka u smislu ZZPL-a — određuje svrhe i sredstva obrade — ali ne čuva lične podatke korisnika platforme u sopstvenim bazama: svi podaci korisnika čuvaju se na infrastrukturi protokola u pseudonimnom obliku. Sistem prikuplja samo podatke neophodne za funkcionisanje, a fondacija obezbeđuje primenu mera zaštite na infrastrukturi na kojoj se podaci nalaze.

Pravna pozicija sistema — uključujući kvalifikaciju po Zakonu o digitalnoj imovini, Zakonu o platnim uslugama i Zakonu o tržištu kapitala — obrazložena je u poglavljima 4 i 6.

Ovaj dokument opisuje arhitekturu sistema, obračunski okvir, organizacionu strukturu, module, upravljanje, podsticajne mehanizme, zaštitu podataka i pravnu poziciju svakog elementa. Namenjen je regulatornim telima, akademskoj zajednici, potencijalnim korisnicima i svakome ko želi da razume šta KOLO jeste — i jednako važno, šta nije.

# 1. Problem

Troškovi koordinacije opadaju sa razvojem digitalne infrastrukture. Raste broj ljudi koji traže modele rada i saradnje izvan klasičnog odnosa poslodavac–zaposleni. Lokalne ekonomije se suočavaju sa fenomenom koji literatura o lokalnim multiplikatorima dokumentuje — vrednost koja nastaje u zajednici napušta je pre nego što se u njoj iskoristi (Sacks, 2002; NEF, 2002). U ovim uslovima, zajednice mogu da preuzmu veću odgovornost za sopstvenu održivost — ali za to im je potreban celovit sistem koji integriše skaliranje, poverenje i regulatornu usklađenost, a koji u postojećim modelima ne postoji.

Zajednice koje žele da organizuju sopstvenu razmenu suočavaju se sa tri problema koja nijedan postojeći model ne rešava istovremeno.

**Skaliranje.** Neposredna razmena — trampa — funkcioniše između dvoje ljudi koji imaju ono što drugom treba, u isto vreme, na istom mestu. Taj uslov se retko ispunjava. Vremenske banke, koje beleže sate rada kao jedinicu razmene, rešavaju problem istovremene potrebe, ali u svom osnovnom obliku pretpostavljaju da je svaki sat rada jednako vredan — sat računovodstva i sat košenja trave (Cahn, 2004). To ograničava složenost razmene koju sistem može da podrži. LETS sistemi (Local Exchange Trading Systems) dozvoljavaju fleksibilniju razmenu unutar zatvorene grupe, ali empirijski ostaju lokalni i mali — kad prerastu određeni broj korisnika, gube koheziju jer se poverenje između članova razređuje (Seyfang, 2006; North, 2007). Lokalne valute i sistemi uzajamnog kredita uvode formalniji oblik, ali zahtevaju institucionalnu podršku i često zavise od konvertibilnosti u nacionalnu valutu, čime ostaju vezane za isti finansijski okvir koji pokušavaju da dopune — Bristolska funta (prestala sa radom 2021) i Sardex na Sardiniji (restrukturiran 2022) ilustruju te granice.

**Poverenje.** Svaki sistem razmene zahteva da korisnici veruju da će njihov doprinos biti priznat i da neće biti iskorišćeni. U malim grupama, poverenje se gradi licem u lice. Kad sistem raste, lično poverenje prestaje da bude dovoljno — potreban je institucionalizovan mehanizam koji zamenjuje poznavanje svakog člana (up. Luhmann, 1979, o razlici između personalnog i sistemskog poverenja). Tradicionalno, tu ulogu preuzima ili država (regulacijom i prinudom) ili tržište (cenom kao signalom i ugovorom kao zaštitom). Postoje i drugi mehanizmi — reputacioni sistemi, socijalni kapital, mrežni efekti — ali nijedan od njih ne daje zajednici skup pravila koji je istovremeno transparentan, predvidiv i primenjuje se bez diskrecije pojedinca. Zajednicama koje žele da organizuju sopstvenu razmenu potreban je upravo takav mehanizam: formalizovana pravila ugrađena u sam sistem.

**Regulatorni okvir.** Čak i kada zajednica reši problem skaliranja i poverenja, suočava se sa pravnim okvirom koji je dizajniran za finansijske instrumente, platne servise i digitalnu imovinu. Svaki interni sistem evidencije koji liči na novac, valutu ili token rizikuje da bude kvalifikovan kao nešto što zahteva dozvolu, nadzor ili usklađenost sa propisima koji nisu namenjeni participatornim sistemima zajedničkog dobra. Lokalne valute i komplementarni sistemi širom Evrope su se suočili sa ovim problemom sa različitim ishodima — Chiemgauer u Nemačkoj funkcioniše u okviru jasnog regulatornog tretmana (Thiel, 2012), WIR u Švajcarskoj je regulisan kao banka (Stodder, 2009), Bristolska funta se ugasila pod operativnim i regulatornim pritiskom. Zajednica koja želi da evidencijom doprinosa organizuje sopstvenu razmenu mora od prvog dana da vodi računa o tome kako će njen sistem biti kvalifikovan u pravnom prometu — ne naknadno, nego kao deo dizajna.

Ova tri problema su međusobno zavisna: rešavanje bilo koja dva bez trećeg ne daje održiv sistem. Sistem koji skalira bez mehanizma poverenja raspada se čim preraste lokalnu grupu. Sistem sa poverenjem ali bez skaliranja ostaje inicijativa bez šireg uticaja. Sistem koji skalira i ima poverenje ali ne adresira regulatorni okvir biva zaustavljen ili ograničen od strane pravnog sistema koji ga ne prepoznaje.

Pokušaji rešavanja ovih problema imaju dugu istoriju. Silvio Gesell je početkom dvadesetog veka predložio Freigeld — novac sa ugrađenim troškom držanja (demurrage), dizajniran da podstiče cirkulaciju umesto akumulacije (Gesell, 1916). Thomas Greco je sistematizovao principe uzajamnog kredita i komplementarnih valuta, pokazujući da zajednice mogu da organizuju razmenu bez bankarskog posredovanja (Greco, 2009). Neo-mutualistička tradicija, razvijena u radovima Kevina Carsona i drugih autora koji spajaju klasični mutualizam Proudhona sa savremenim kooperativnim i digitalnim alatima, tražila je modele u kojima korisnici upravljaju sistemom koji koriste (Carson, 2007) — KOLO izrasta iz te tradicije.

Savremena istraživanja su ponudila parcijalna rešenja. Elinor Ostrom je empirijski pokazala da zajednice mogu da upravljaju zajedničkim dobrima bez privatizacije i bez državne kontrole — pod uslovom da postoje jasna pravila pristupa, doprinosa i odlučivanja (Ostrom, 1990). Yochai Benkler je opisao commons-based peer production kao način organizacije proizvodnje zasnovan na zajedničkim resursima i dobrovoljnom doprinosu, ni tržišni ni državni (Benkler, 2006). Platformski kooperativizam Trebora Scholza prenosi kooperativne principe na digitalne platforme (Scholz, 2016). Otvoreni kooperativizam Kostakisa i Bauwensa kombinuje otvorene protokole, kooperativne strukture i zajedničko dobro u centru (Bauwens, Kostakis i Pazaitis, 2019). Sensorica iz Montreala je razvila Open Value Network — sistem otvorenog evidentiranja doprinosa u kome se svaki doprinos beleži i vrednuje kroz value accounting (Braun i Hummel, 2019). Enspiral iz Novog Zelanda koristi fondaciju za upravljanje infrastrukturom koalicije misijski vođenih entiteta (Enspiral Foundation, 2016).

Svaki od ovih modela rešava deo problema. Nijedan ne rešava sva tri istovremeno. Sistemi uzajamnog kredita teško skaliraju van specifičnih institucionalnih uslova — čak i WIR, najuspešniji primer sa preko 60.000 članova, funkcioniše kao regulisana banka, ne kao participatorni sistem. Benklerov model commons-based peer production ne adresira regulatorni okvir kao element dizajna — konkretni projekti poput Linuxa i Wikipedije rešavaju to ad hoc, kroz pravne entitete koje formiraju naknadno. Ostromovi principi opisuju uslove za upravljanje zajedničkim dobrima, ali ne nude implementacioni okvir za digitalni participatorni sistem. Platformski kooperativi rešavaju vlasništvo ali ne rešavaju evidenciju doprinosa. Otvoreni kooperativizam Kostakisa i Bauwensa integriše otvorene protokole i zajedničko dobro, ali ne adresira regulatornu poziciju sistema u konkretnoj jurisdikciji. Sensoricin Open Value Network nema pravni instrument koji eksplicitno adresira rizik regulatorne kvalifikacije evidencije doprinosa kao finansijskog instrumenta. Enspiralova fondacija rešava pravni oblik, ali bez internog obračunskog sistema i evidencije doprinosa koja bi strukturirala učešće.

Ovi modeli nisu ostali samo u akademskoj sferi. Tokom poslednje decenije, međunarodne institucije su prepoznale socijalnu ekonomiju — širu kategoriju u koju se funkcionalno uklapaju participatorni sistemi zajedničkog dobra — kao legitiman pravac ekonomskog razvoja. Evropska komisija je 2021. usvojila Akcioni plan za socijalnu ekonomiju sa merama za period 2021–2030, a Savet EU je 2023. usvojio Preporuku o okvirnim uslovima za socijalnu ekonomiju. Generalna skupština UN-a je 2023. usvojila prvu rezoluciju o socijalnoj i solidarnoj ekonomiji (A/RES/77/281), a Međunarodna organizacija rada je 2022. formalno definisala ovaj sektor na 110. zasedanju Međunarodne konferencije rada. Za Srbiju, koja usklađuje zakonodavstvo sa pravnom tekovinom EU u procesu pristupanja, ovaj okvir nije apstraktan — to je pravac u kome se kreće regulatorno okruženje u koje Srbija ulazi. Detaljna analiza ovog institucionalnog okvira data je u Prilogu A.

KOLO se pozicionira u institucionalnom pravcu koji EU, UN i ILO aktivno razvijaju — participatorno upravljanje, zajedničko dobro, fondacije i kooperative kao pravni instrumenti. Razlika je u tome što KOLO pokušava da adresira sva tri problema — skaliranje, poverenje i regulatorni okvir — u jednom integrisanom sistemu, sa evidencijom doprinosa kao centralnim mehanizmom.

Poglavlje koje sledi opisuje viziju tog rešenja — šta KOLO jeste, gde se nalazi u odnosu na postojeće modele i na kojim principima počiva.

# 2. Vizija

Pitanje kako organizovati resurse i sisteme koji su važni za više ljudi istovremeno ima tri poznata odgovora — svaki sa sopstvenim ograničenjima.

Prvi je privatna svojina. Neko poseduje resurs, odlučuje o njegovoj upotrebi i snosi posledice te odluke. Ovaj model podstiče efikasnost i odgovornost, ali stvara asimetriju — vlasnik ima kontrolu, svi ostali imaju pristup samo pod njegovim uslovima. Kad se ovaj princip primeni na sisteme razmene, rezultat je platforma čiji vlasnik izvlači vrednost iz interakcija koje stvaraju njeni korisnici.

Drugi je državna svojina. Resurs pripada svima posredno, kroz instituciju koja ga drži u ime građana. Ovaj model obezbeđuje pristup, ali uvodi birokratiju, udaljenost između korisnika i odluke, i zavisnost od političke volje. Kad država preuzme ulogu garanta razmene, rezultat je regulisan finansijski sistem — stabilan, ali spor, skup i nedostupan zajednicama koje žele da organizuju sopstvenu razmenu po sopstvenim pravilima.

Treći je otvoreni pristup bez strukture — ono što je Garrett Hardin nazvao tragedijom zajedničkog dobra (Hardin, 1968). Resurs je dostupan svima, niko ga ne čuva, i svako ima podsticaj da ga iskoristi pre drugih. Ovaj model završava iscrpljivanjem resursa. Hardinov zaključak bio je da zajedničko dobro ne može da opstane bez privatizacije ili državne kontrole — zaključak koji se pokazao netačnim, ali koji je decenijama oblikovao javnu politiku.

Elinor Ostrom je empirijski pokazala da taj zaključak nije tačan (Ostrom, 1990). Zajednice širom sveta — od švajcarskih planinskih pašnjaka do japanskih ribarskih sela — vekovima uspešno upravljaju zajedničkim dobrima, bez privatizacije i bez države. Uslov je da postoje jasna pravila — Ostrom ih je formalizovala kao osam dizajn principa, među kojima su ključni: jasno definisane granice pristupa, pravila usklađena sa lokalnim uslovima, mehanizmi kolektivnog odlučivanja i graduirane sankcije za kršenja. Zajedničko dobro ne propada zato što je zajedničko. Propada kad nema strukturu.

KOLO polazi od ovog uvida. Zajedničko dobro može da bude centar sistema — ne kao apstraktna ideja, nego kao konkretna organizaciona struktura sa pravilima, evidencijom i pravnim oblikom. Arhitektura KOLO sistema je dizajnirana sa ciljem da adresira svih osam Ostrom dizajn principa — ne po analogiji, nego kao strukturni elementi ugrađeni u protokol, upravljanje i pravni okvir sistema. Mapiranje svakog principa na konkretne elemente KOLO arhitekture dato je u Prilogu E.

U KOLO sistemu, zajedničko dobro nije resurs koji se troši — polje koje se ispaša ili riba koja se lovi. To je sistem sam — protokol, pravila, infrastruktura, sadržaj, evidencija doprinosa. Za razliku od klasičnog zajedničkog dobra koje je rivalsko — gde korišćenje jednog umanjuje korist drugog — osnova sistema — softver, pravila, sadržaj, infrastruktura — je nerivalna: korišćenje od strane jednog korisnika ne umanjuje dostupnost za druge (up. Hess i Ostrom, 2007, o digitalnim zajedničkim dobrima). Sistem ima i pozitivan mrežni efekat (up. Katz i Shapiro, 1985) — što ga više ljudi koristi, to je sistem vredniji za sve koji u njemu učestvuju, jer raste broj mogućih razmena, obim evidencije i kapacitet zajedničkog dobra.

Ali nerivalno zajedničko dobro ima svoj problem. Ako je korišćenje besplatno i neograničeno, ko ga održava? Ko finansira infrastrukturu? Ko donosi odluke? Open-source softver, najpoznatiji primer nerivalnog zajedničkog dobra, suočava se sa ovim pitanjima decenijama. Projekti koji opstaju — Linux, Wikipedia, Apache — opstaju jer su razvili strukture upravljanja, finansiranja i odlučivanja. Ali te strukture su nastajale iterativno i post hoc, često kao odgovor na krize, ne kao deo inicijalnog dizajna. Mnogi drugi projekti nisu opstali upravo zato što te strukture nikad nisu uspostavili.

KOLO odgovara na ovo pitanje evidencijom. Sistem beleži ko doprinosi, koliko doprinosi i na koji način doprinosi. Ta evidencija nije privatna svojina korisnika — korisnik nema imovinsko pravo nad zapisom svog doprinosa. Ali evidencija omogućava sistemu da prepozna doprinos, da ga meri i da na osnovu njega strukturira učešće u upravljanju. Evidencija je posledica aktivnosti — protokol beleži da se doprinos dogodio, ali sam zapis nije prenosivo sredstvo niti imovina korisnika.

KOLO se razlikuje od srodnih modela po tome što integriše elemente koje oni rešavaju parcijalno. Za razliku od privatne svojine, niko ne poseduje sistem — ni osnivač, ni fondacija, ni korisnici pojedinačno; zajedničko dobro je dobro svih korisnika, ali ne u smislu kolektivne svojine nad kojom bi imali pravo raspolaganja. Za razliku od državne svojine, sistem ne zavisi od političke volje, budžeta ni birokratije — fondacija je pravni instrument, ne vlasnik, i zajednica finansira fondaciju, ne obrnuto. Za razliku od open-source modela, KOLO ima eksplicitan mehanizam evidencije doprinosa i strukturu upravljanja koja se aktivira na osnovu tog doprinosa — open-source projekat beleži ko je napisao kod, KOLO beleži svaki oblik doprinosa i na osnovu toga strukturira ceo sistem.

Od kripto projekata razlikuje ga to što KOLO nema token koji se trguje na tržištu, nema obećanje finansijskog prinosa i nema spekulativni element — zapisi u protokolu su evidencija, ne imovina, a doprinos je jedini način sticanja pozicije u sistemu. Protokol evidentira doprinos donatora u POEN-ima, ali donacija nije neophodan ni privilegovan put do upisa ZRNA — isti prag važi za sve aktivnosti, uključujući one koje ne zahtevaju nikakvu dinarsku donaciju, a pravni akt donacije i administrativni akt evidencije su odvojeni (poglavlje 4, poglavlje 6). Od platformskog kooperativizma razlikuje ga to što KOLO nije platforma u vlasništvu korisnika koja nudi usluge tržištu — KOLO je interni obračunski sistem u kome se razmena odvija unutar zajednice, a odnos sa spoljnom ekonomijom ide isključivo kroz dinarske donacije fondaciji.

Vizija KOLO sistema je zajedničko dobro sa strukturom. Sistem u kome položaj nije ni altruističan ni spekulativan, nego evidentiran. Sistem u kome doprinos nije nevidljiv, ali ni vlasništvo. Sistem koji ne obećava prinos, ali čija se korist za korisnike menja sa aktivnošću zajednice — ta promena je posledica obračunskog koeficijenta, ne garancija nijednog lica.

Poglavlja koja slede opisuju kako taj dizajn funkcioniše — zajedničko dobro sa pravilima, evidencijom, pravnim oblikom i regulatornom pozicijom.

# 3. Zajedničko dobro i protokol

Zajedničko dobro u KOLO sistemu ima konkretan sadržaj. Čine ga: softver na kome sistem radi, pravila po kojima funkcioniše, evidencija doprinosa svih korisnika i sadržaj koji nastaje unutar sistema. Infrastruktura na kojoj ovi elementi postoje — serveri, baze podataka, mrežna oprema — nije sastavni deo zajedničkog dobra u istom smislu, ali jeste operativni preduslov bez koga zajedničko dobro ne može da funkcioniše; njeno održavanje je servisna obaveza fondacije (poglavlje 5). Sve to zajedno — softver, pravila, evidencija doprinosa, sadržaj — jeste zajedničko dobro. Kolektivno dobro svih korisnika sistema, nad kojim nijedan pojedinac, uključujući osnivača, nema individualno svojinsko pravo, a koje ne predstavlja kolektivnu svojinu u smislu važećih imovinskopravnih kategorija — korisnici nemaju pravo raspolaganja zajedničkim dobrom niti pravo na udeo u njemu. Pojam zajedničkog dobra (commons) u KOLO sistemu odgovara kategoriji koju je Elinor Ostrom definisala kao resurs kojim zajednica upravlja po sopstvenim pravilima, bez privatizacije i bez državne kontrole (Ostrom, 1990), proširenom na digitalne zajedničke resurse u smislu Hess i Ostrom (2007).

Zajedničko dobro nije u svojini nijednog pojedinačnog aktera u sistemu — ni osnivača, ni fondacije, ni korisnika pojedinačno. Svako ko učestvuje u sistemu ima pristup zajedničkom dobru i koristi ga pod jednakim uslovima. Ti uslovi nisu proizvoljni — definisani su pravilima koja postavljaju ljudi i koja se menjaju kroz procese upravljanja opisane u poglavlju 10 ovog dokumenta. Pravni mehanizmi koji obezbeđuju da zajedničko dobro ostane kolektivno — licence AGPL-3.0 za softver i CC BY-SA 4.0 za sadržaj — opisani su u odeljku o licencama na kraju ovog poglavlja.

Zajedničko dobro nije statično. Menja se sa svakom aktivnošću u sistemu — svaka razmena, svaki doprinos, svaka verifikacija dodaje podatke u evidenciju i time ažurira stanje zajedničkog dobra. Svaka takva promena odvija se kroz protokol, čime je obezbeđena konzistentnost i sledljivost.

## Protokol

Protokol je tehnički mehanizam zajedničkog dobra — skup pravila prevedenih u softver koji obavlja četiri funkcije.

Evidencija. Beleži svaku aktivnost u sistemu — ko je doprineo, šta, kada i koliko. Evidencija je trajni zapis stanja zajedničkog dobra.

Obračunavanje. Izračunava obračunski koeficijent između obračunskih jedinica na osnovu stanja evidencije. Koeficijent proizlazi iz unapred definisanih pravila i podataka koje protokol beleži — ne određuje ga nijedno lice.

Primena pravila. Kad učesnik ispuni uslove za upis ZRNA, protokol to izvršava. Kad se odvija razmena, ažurira evidenciju. Kad nastupi obračunski period, izračunava novi koeficijent. Svaka radnja je automatska — protokol primenjuje pravila, ne tumači ih.

Integritet. Obezbeđuje konzistentnost evidencije — ukupni zapisi odgovaraju pravilima, nijedan zapis ne nastaje van definisanih mehanizama, retroaktivna promena istorije evidencije nije moguća. Ovo je dizajnersko pravilo obezbeđeno softverskom arhitekturom centralizovane evidencije (poglavlje 4), a ne svojstvo distribuirane infrastrukture — tehničke mere opisane su u Prilogu D.

Protokol ne donosi odluke o tome koja pravila važe. Pravila postavljaju ljudi — u sadašnjoj fazi osnivač i fondacija, u kasnijoj fazi Gornje Kolo kroz procese opisane u poglavlju 10. Protokol je instrument tih odluka, ne njihov izvor.

Četiri funkcije protokola — evidencija, obračunavanje, primena pravila i čuvanje integriteta — direktno adresiraju nekoliko od osam dizajn principa za upravljanje zajedničkim dobrima koje je formalizovala Elinor Ostrom (1990): jasno definisane granice (verifikacija korisnika, poglavlje 7), pravila usklađena sa lokalnim uslovima (parametri koje postavljaju ljudi, ne algoritam), mehanizmi praćenja (evidencija svake aktivnosti) i graduirane sankcije (definisane u pravilima sistema, poglavlje 7). Detaljno mapiranje svih osam principa na KOLO arhitekturu dato je u Prilogu E.

## Obračunske jedinice protokola

Protokol vodi evidenciju kroz dve obračunske jedinice: POEN i ZRNO.

POEN evidentira doprinos i druge oblike učešća u zajedničkom dobru. Protokol evidentira doprinos kad korisnik doprinese zajedničkom dobru donacijom, pokroviteljstvom, operativnim doprinosom ili verifikacijom korisnika u lancu potvrda — u tim slučajevima zapis se beleži u zapisu doprinosioca. Pored toga, doprinos se evidentira u POEN-ima i kroz rast krugova i zadruga (Moduli 1 i 2, gde se zapisi evidentiraju u zapisu organizacione jedinice) i kroz socijalne programe (Modul 3, automatska evidencija za kvalifikovane grupe korisnika). ZRNO evidentira položaj — učesnik koji ispuni definisane uslove upisuje ZRNO, čime se evidentira njegova pozicija u zajedničkom dobru. Ukupan broj ZRNA raspoloživih za upis je fiksiran. Obe jedinice su zapisi u evidenciji zajedničkog dobra, ne sredstva u vlasništvu korisnika — korisnik nema imovinsko pravo nad njima. Obračunski koeficijent između njih izračunava protokol na osnovu stanja celokupne evidencije; taj koeficijent se menja sa aktivnošću u sistemu i nijedan korisnik ne može da ga kontroliše pojedinačno.

Obračunske jedinice nisu novac, valuta, digitalna imovina ni finansijski instrumenti. Poglavlje 6 detaljno opisuje kako ti zapisi nastaju, kako se koriste, kako se obračunavaju i zašto ne potpadaju pod regulatorne okvire dizajnirane za finansijske instrumente.

## Licence

Softver i sadržaj zajedničkog dobra zaštićeni su licencama koje obezbeđuju da ostanu zajednički. Licence pokrivaju kod i sadržaj — ne evidenciju ni infrastrukturu, čija zaštita počiva na drugim mehanizmima (pravna struktura fondacije, pravila protokola, četiri principa sistema iz poglavlja 4).

Softver sistema je licenciran pod AGPL-3.0 (GNU Affero General Public License, verzija 3.0). Ova licenca znači da je izvorni kod slobodan za korišćenje, modifikaciju i distribuciju, ali svaka modifikovana verzija koja se koristi za pružanje usluga preko mreže mora takođe biti objavljena pod istom licencom. U praksi, to znači da niko ne može da uzme softver KOLO sistema, modifikuje ga i pokrene zatvorenu verziju bez da objavi svoj kod. AGPL-3.0 štiti zajedničko dobro od privatizacije softvera.

Sadržaj sistema je licenciran pod CC BY-SA 4.0 (Creative Commons Attribution-ShareAlike 4.0 International). Ova licenca dozvoljava slobodno korišćenje i preradu sadržaja pod dva uslova: navođenje izvora i licenciranje prerađenog sadržaja pod istom ili kompatibilnom licencom. U praksi, to znači da sadržaj koji nastaje u sistemu može da se koristi van njega, ali ne može da se zatvori — svaka prerada mora ostati otvorena pod istim ili kompatibilnim uslovima.

Izbor ovih dveju licenci nije slučajan. Obe pripadaju porodici copyleft licenci — mehanizama koji koriste autorsko pravo da bi pravno sprečili restriktivno relicenciranje. Copyleft obezbeđuje da svaki derivat ostane dostupan pod istim ili kompatibilnim uslovima, čime su softver i sadržaj zajedničkog dobra pravno zaštićeni od dva najveća rizika: privatizacije softvera i zatvaranja sadržaja.

Za korisnike sistema, ove licence znače da softver i sadržaj koji se koriste unutar sistema ostaju dostupni svima — nijedan akter, ni osnivač, ni fondacija, ni korisnik, ne može da ih relicencira pod restriktivnijim uslovima. Zajedničko dobro u širem smislu — uključujući evidenciju i pravila — zaštićeno je od prisvajanja dodatnim mehanizmima: strukturom fondacije, koja zajedničko dobro čuva, a nije njegov vlasnik i nema pravo raspolaganja njime (poglavlje 5), četiri principa sistema koji se ne mogu ukinuti upravljačkom odlukom (poglavlje 4) i pravilima protokola koja sprečavaju jednostranu promenu evidencije. Ovo nije deklaracija namera, nego skup pravnih i tehničkih mehanizama ugrađenih u temelje sistema. Copyleft licenciranje kao pravna strategija zaštite zajedničkih digitalnih dobara ima osnovu u pravnoj teoriji autorskog prava (Lessig, 2004) i filozofiji slobodnog softvera (Stallman, 2002).

# 4. Šta je KOLO — pravna pozicija sistema

KOLO je participatorni sistem zajedničkog dobra. Ova definicija opisuje pravnu prirodu sistema i određuje njegovo mesto u odnosu na postojeće pravne kategorije.

Participatorni znači da sistem funkcioniše kroz aktivnost svojih korisnika. Svaki zapis u evidenciji sistema nastaje kao posledica konkretne aktivnosti korisnika — razmene, doprinosa, organizovanja, verifikacije. Obračunski koeficijent je administrativna veličina: količnik dva zbira iz evidencije koji protokol izračunava automatski i bez diskrecije; ne izražava vrednost ZRNA, nijedno lice njime ne upravlja niti ga obećava, a čuvar Kola ga ne pomera ni sopstvenim upisom ni sopstvenim otpisom. Čuvar Kola koji drži slobodno ZRNO zadržava evidentiran položaj; sistem ne stvara korist ciljano za neaktivne korisnike, niti bilo koje lice obećava ili garantuje promenu položaja, a koeficijent može i da padne. Čuvar Kola koji želi da učestvuje u upravljanju mora da aktivira ZRNO, čime ga isključuje iz mogućnosti otpisa — upravljačka funkcija zahteva aktivnu odluku i strukturno odricanje od obračunske fleksibilnosti. Eventualna promena pozicije čuvara Kola manifestuje se isključivo u POEN-ima — zapisima u evidenciji koji nemaju eksternu imovinsku vrednost, ne mogu se konvertovati u novac i ne mogu napustiti sistem. Sistem ne predviđa mehanizam kroz koji bi korisnik uložio sredstva i čekao prinos koji ima eksternu vrednost — svaka korist od promene pozicije je intrasistematska. Dinarske donacije fondaciji su nepovratne i bez protivusluge — evidencija doprinosa donatora u POEN-ima je jednostrani administrativni zapis protokola, ne ekvivalent sticanja pozicije u sistemu na osnovu uplate.

Sistem znači da je reč o organizovanom skupu pravila, mehanizama i odnosa koji čine funkcionalnu celinu. KOLO nije platforma u uobičajenom smislu — ne pruža usluge korisnicima u zamenu za naknadu. KOLO nije mreža u smislu slobodnog povezivanja bez strukture. KOLO je sistem sa definisanim pravilima pristupa, evidencije, obračuna i upravljanja.

Zajedničkog dobra znači da sve što sistem proizvodi i čuva jeste kolektivno dobro svih korisnika. Nijedan korisnik nema u svojini deo sistema. Nijedna institucija — uključujući fondaciju — nema sistem u svojini. Zajedničko dobro je kolektivno dobro svih korisnika, ali ne u smislu kolektivne svojine nad kojom bi korisnici imali pravo raspolaganja — čija je zaštita obezbeđena licencama (AGPL-3.0 i CC BY-SA 4.0) i pravnom strukturom fondacije, koja ga čuva, a nije njegov vlasnik.

Ova kategorija — participatorni sistem zajedničkog dobra — ne postoji kao formalna pravna kategorija u srpskom pravu. KOLO ne traži da bude prepoznat kao nova pravna kategorija — koristi postojeće pravne institute upravo zato što ne zahteva novo pravo. Fondacija je registrovana po Zakonu o zadužbinama i fondacijama. Licence su međunarodno priznati pravni instrumenti. Odnos između korisnika i sistema je ugovorne prirode — pristupanjem sistemu korisnik prihvata pravila korišćenja. Istovremeno, kategorija koju KOLO predstavlja nije nepoznata na međunarodnom nivou — Evropska komisija je kroz Akcioni plan za socijalnu ekonomiju (COM(2021) 778 final) i Preporuka Saveta EU o okvirnim uslovima za socijalnu ekonomiju (novembar 2023) aktivno definisala prostor za entitete ovog tipa, što je relevantno za Srbiju u procesu pristupanja EU.

## Četiri principa na kojima počiva pravna pozicija sistema

Pravna pozicija KOLO sistema počiva na četiri principa koji su ugrađeni u dizajn sistema, a ne naknadno dodati kao pravna zaštita.

**Nekonvertibilnost.** Nijedna obračunska jedinica sistema ne može se konvertovati u novac, valutu ni bilo koje sredstvo van sistema — ni neposredno ni posredno, uključujući zamenu za vaučere, poklon kartice ili drugo sredstvo sa spoljnom vrednošću — ono koje se može unovčiti, preneti trećem licu ili iskoristiti kod trgovca po izboru. Raspodela vaučera iz pokroviteljstva dobrima i uslugama to nije: vaučer obezbeđuje davalac ugovorom u korist trećih lica, davalac POEN ne prima, fondacija u raspodeli ništa ne poseduje ni ne plaća, a vaučer glasi na imaoca i na određeno dobro kod jednog davaoca i ne unovčava se; poništenje zapisa pri uzimanju vaučera je poništenje po iskorišćenju. POEN se ne može zameniti za dinare niti izneti iz sistema. ZRNO se ne može prodati, preneti ni unovčiti. Ovo nije ograničenje koje može biti ukinuto odlukom fondacije ili zajednice — to je strukturni element čije bi uklanjanje fundamentalno promenilo pravnu kvalifikaciju sistema.

**Odsustvo imovinskog prava nad zapisima.** Korisnici nemaju imovinsko pravo nad zapisima POEN-a i ZRNA u evidenciji sistema. Zapis POEN-a nije sredstvo u vlasništvu korisnika — to je podatak u evidenciji zajedničkog dobra. ZRNO nije udeo, akcija ni bilo koji oblik imovinskog prava — to je evidencija položaja u zajedničkom dobru (odeljak 6.2). Evidencija je deo zajedničkog dobra. Korisnik ima evidentirani doprinos i evidentiran položaj — ali ti zapisi nisu njegova imovina, ne mogu se preneti na drugo lice i ne mogu se naslediti kao imovinska prava. Čuvar Kola ima poziciju u obračunskom sistemu, ali ta pozicija nije imovinsko pravo — ona je posledica strukture sistema i aktivnosti svih korisnika. Pitanje tretmana evidencije nakon smrti korisnika identifikovano je kao otvoreno pravno pitanje u poglavlju 13.

**Nepovratnost donacija.** Dinarska sredstva koja zajednica daje fondaciji su donacije u smislu važećih propisa. Donacija je nepovratna. Donator ne stiče pravo na povraćaj, ne stiče upravljačko pravo u fondaciji na osnovu donacije i ne stiče udeo u sistemu na osnovu donacije. Protokol evidentira činjenicu donatorskog doprinosa u POEN-ima, ali ta evidencija nije protivusluga za donaciju — to je jednostrani administrativni zapis protokola koji beleži činjenicu doprinosa, istog karaktera kao evidencija bilo kog drugog oblika učešća u sistemu. Donator ne može da uslovi donaciju evidencijom, niti evidencija stvara obavezu fondacije prema donatoru. Ovo razdvajanje je dizajnerska odluka, ne zatečena činjenica — sistem je konstruisan tako da dva akta budu pravno nezavisna. Legitimnost tog razdvajanja ne zavisi od toga da li je nastalo spontano ili je dizajnirano — svaki pravni okvir konstruiše kategorije koje zatim primenjuje (up. Pistor, 2019). Relevantno je da li struktura sistema dosledno sprovodi razdvajanje u praksi, ne da li je razdvajanje performativno po svom poreklu.

**Minimizacija podataka.** Platforma prikuplja samo podatke neophodne za funkcionisanje sistema. Fondacija ne čuva lične podatke korisnika platforme — svi podaci korisnika čuvaju se na infrastrukturi protokola. Korisnik sam odlučuje koje dodatne podatke unosi radi lakšeg korišćenja platforme — unos dodatnih podataka nije uslov za dokaz stvarnosti niti za pristup funkcijama sistema. Ovaj princip je istovremeno regulatorni zahtev (čl. 5 st. 1 t. 3 ZZPL-a) i dizajnerska odluka — sistem koji ne prikuplja podatke koje ne treba da ima ne može da ih izgubi, zloupotrebi niti da bude primoran da ih preda.

Među četiri principa, nekonvertibilnost ima fundamentalnu ulogu u regulatornom pozicioniranju sistema. Argumenti koji isključuju POEN iz definicije digitalne imovine (čl. 2 ZDI), platnog sredstva (ZPS) i elektronskog novca počivaju na tome da POEN nema eksternu vrednost — a ta tvrdnja stoji samo dok ne postoji mehanizam konverzije. Kvalifikacija ZRNA van domašaja investicionog ugovora počiva na tome da eventualna promena pozicije čuvara Kola nema eksternu realizaciju — što opet zavisi od nekonvertibilnosti POEN-a. Nekonvertibilnost je, u tom smislu, princip od koga zavisi pravna posledica ostala tri principa: oni definišu karakter sistema, ali nekonvertibilnost obezbeđuje da taj karakter bude pravno relevantan. Ostala tri principa nisu redundantna — svaki od njih nezavisno doprinosi pravnoj poziciji sistema — ali bez nekonvertibilnosti, kvalifikacija sistema po ZDI, ZPS i ZTK ne bi stajala.

## Šta KOLO nije

Pozitivna definicija sistema — participatorni sistem zajedničkog dobra sa nekonvertibilnim zapisima, bez imovinskog prava korisnika nad evidencijom i sa nepovratnim donacijama — jasno ga razgraničava od pravnih kategorija sa kojima bi mogao biti pomešan.

KOLO nije platforma za trgovanje digitalnom imovinom. Zakon o digitalnoj imovini (čl. 2) definiše digitalnu imovinu kao digitalni zapis vrednosti koji se može digitalno prenositi, čuvati ili njime trgovati, i dalje razlikuje virtuelne valute od digitalnih tokena. Zapisi u KOLO sistemu ne ispunjavaju ni opštu ni posebne definicije: POEN postoji isključivo kao zapis u evidenciji protokola bez nosioca — kad korisnik inicira ažuriranje evidencije, protokol menja sopstvenu bazu, ali ništa ne menja nosioca jer POEN nema nosioca. ZRNO je neprenosivo. Nijedan zapis se ne može čuvati van sistema, njime trgovati niti monetizovati. Ne postoji sekundarno tržište za bilo koji zapis u sistemu.

KOLO nije platni sistem ni pružalac platnih usluga u smislu Zakona o platnim uslugama. Platna transakcija u smislu ZPS-a pretpostavlja prenos monetarne vrednosti između platioca i primaoca — takav prenos u KOLO sistemu ne postoji jer POEN nema monetarnu vrednost i nema nosioca. Korisnik razmenjuje dobra i usluge sa drugim korisnikom, a protokol evidentira tu razmenu ažuriranjem sopstvene baze. Razmena je dobrovoljna, a evidencija je posledica razmene, ne sredstvo kojim se razmena vrši. Nijedan korisnik nema obavezu da prihvati POEN kao ispunjenje bilo čega. POEN nije ni elektronski novac, jer mu nedostaju elementi te definicije: zapis POEN-a nije novčano potraživanje ni prema fondaciji ni prema bilo kom drugom licu; ne izdaje se po prijemu novčanih sredstava, nego se doprinos evidentira po pravilima sistema, a donacija i evidencija su pravno odvojeni akti; ne služi za izvršavanje platnih transakcija; fondacija pri ažuriranju evidencije ne prima, ne drži i ne prenosi novčana sredstva i ažuriranje ne naplaćuje; iz zapisa nema isplate ni otkupa; a lice van evidencije, uključujući davaoca vaučera iz pokroviteljstva dobrima i uslugama, POEN ne prima.

KOLO nije investicioni fond ni kolektivna investiciona šema u smislu Zakona o tržištu kapitala. Član 2 ZTK-a definiše prenosivu hartiju od vrednosti, jedinicu kolektivnog investiranja i finansijski instrument. ZRNO ne ispunjava definiciju prenosive hartije od vrednosti jer je neprenosivo — ne postoji mehanizam prenosa, tržište ni mogućnost trgovanja. ZRNO ne ispunjava definiciju jedinice kolektivnog investiranja jer ne predstavlja učešće u fondu čija vrednost zavisi od imovine u koju su sredstva uložena — ZRNO evidentira položaj u obračunskom sistemu koji nema eksternu imovinsku vrednost. POEN ne ispunjava definiciju finansijskog instrumenta jer nema nosioca, ne može se prenositi i ne može se konvertovati u novac. Nijedan korisnik ne ulaže sredstva u sistem sa očekivanjem finansijskog prinosa. Donacija fondaciji je nepovratna i bez protivusluge (princip nepovratnosti donacija). Eventualna promena pozicije čuvara Kola nije prinos — nastaje samo ako postoji aktivnost korisnika u sistemu, ne isplaćuje je nijedno lice i niko je ne garantuje. Ne postoji obećanje prinosa — ni eksplicitno ni implicitno.

KOLO nije kripto projekat. Ne postoji token koji se emituje, trguje ili lista na berzi. Ne postoji ICO, IDO ni bilo koji oblik javne ponude. Ne postoji blockchain — KOLO koristi centralizovanu evidenciju koju vodi protokol na infrastrukturi koju drži fondacija. Decentralizacija u KOLO sistemu nije tehnička nego upravljačka — progresivni prenos odlučivanja sa osnivača na zajednicu.

Fondacija ne izdaje finansijske instrumente. Registrovana je po Zakonu o zadužbinama i fondacijama kao pravno lice koje ostvaruje opštekorisne ciljeve. Njena uloga u sistemu je servisna — čuva zajedničko dobro, a nije njegov vlasnik; nije izdavalac hartija od vrednosti, operator platnog sistema ni upravljač investicionim fondom.

## Gde se KOLO nalazi

KOLO kombinuje pravne institute iz više postojećih kategorija. Nije privatna kompanija koja maksimizuje profit za vlasnike. Nije državna ustanova koja pruža javnu uslugu. Nije neprofitna organizacija u klasičnom smislu — iako fondacija jeste neprofitna, sistem kao celina je širi od fondacije. Nije kooperativa u smislu Zakona o zadrugama — iako deli principe sa zadružnim pokretom.

KOLO je sistem za koji srpsko pravo nema gotovu kategoriju, ali za koji ima dovoljno pravnih instrumenata da ga opiše i zaštiti. Prostor u kome se KOLO nalazi nije prazan na međunarodnom nivou — kao što je obrazloženo u poglavlju 1, Evropska unija i Ujedinjene nacije aktivno grade institucionalni okvir za socijalnu i solidarnu ekonomiju u koji se KOLO funkcionalno uklapa. Akcioni plan EU za socijalnu ekonomiju (COM(2021) 778 final), Preporuka Saveta EU (2023) i rezolucija Generalne skupštine UN-a A/RES/77/281 (2023) prepoznaju fondacije, kooperative i participatorne sisteme kao legitimne oblike ekonomskog organizovanja — kategorije u koje se KOLO strukturno uklapa. Za Srbiju u procesu pristupanja EU, ovaj okvir nije apstraktan — to je pravac regulatornog razvoja u koji zemlja ulazi.

KOLO ne čeka formalizaciju te kategorije. Koristi postojeće pravne instrumente koji su dovoljni: fondacija daje pravni subjektivitet, licence štite zajedničko dobro, ugovori regulišu odnos sa korisnicima. Četiri principa — nekonvertibilnost, odsustvo imovinskog prava, nepovratnost donacija i minimizacija podataka — obezbeđuju da sistem ne potpadne pod regulatorne okvire namenjene finansijskim instrumentima, platnim servisima i digitalnoj imovini.

## Pravna priroda odnosa korisnik–fondacija

Pristupanjem sistemu korisnik prihvata pravila korišćenja koja čine ugovor o pristupu u smislu čl. 142 Zakona o obligacionim odnosima — ugovor sa unapred utvrđenim uslovima koje korisnik prihvata u celini. Fondacija nije pružalac usluge u smislu Zakona o zaštiti potrošača jer ne pruža uslugu uz naknadu — korisnik ne plaća za korišćenje sistema, a dinarska donacija je nepovratna i bez protivusluge. Odnos korisnika prema fondaciji nije potrošački nego participatoran — korisnik nije klijent koji kupuje uslugu, nego neko ko dobrovoljno prihvata pravila zajedničkog sistema. Pravila korišćenja — objavljena pre registracije i dostupna svim korisnicima — regulišu prava i obaveze obe strane, uključujući uslove pristupa, pravila evidencije, procedure napuštanja sistema i ostvarivanje prava iz poglavlja 12.

Pravna pozicija KOLO sistema nije odbrana od regulacije. To je dizajn koji od samog početka vodi računa o tome gde se sistem nalazi u pravnom poretku — ne naknadno, nego kao strukturni element arhitekture.

# 5. Arhitektura sistema

Arhitektura KOLO sistema ima centar i dva aktera oko njega.

Centar je zajedničko dobro sa protokolom kao svojim tehničkim mehanizmom. Poglavlje 3 opisuje šta zajedničko dobro sadrži — softver, pravila, evidenciju, sadržaj — i kako protokol funkcioniše. U kontekstu arhitekture, zajedničko dobro je ono oko čega se sve ostalo organizuje. Zajedničko dobro nema pravni subjektivitet i ne donosi odluke — postoji kao skup koda, pravila i zapisa na infrastrukturi koju drži fondacija. Infrastruktura nije sastavni deo zajedničkog dobra u istom smislu kao softver, pravila i evidencija, ali jeste operativni preduslov bez koga zajedničko dobro ne može da funkcioniše — njeno održavanje je servisna obaveza fondacije.

Oko centra stoje dva aktera: fondacija i zajednica. Svaki ima jasno definisanu funkciju, jasno definisan odnos prema zajedničkom dobru i jasno definisan odnos prema drugom akteru.

## Fondacija

KOLO Fondacija je pravni instrument sistema. Registrovana je u Somboru po Zakonu o zadužbinama i fondacijama kao pravno lice koje ostvaruje opštekorisne ciljeve.

Zajedničko dobro nema pravni subjektivitet — ne može da zaključi ugovor, drži račun ni stupi u pravni promet. Fondacija mu daje pravni oblik.

Funkcije fondacije su servisne. Fondacija drži infrastrukturu na kojoj protokol radi. Prima dinarske donacije od zajednice i pokrovitelja. Plaća operativne troškove sistema — servere, razvoj, održavanje, pravne usluge. Zastupa sistem u pravnom prometu — potpisuje ugovore, podnosi prijave, komunicira sa regulatornim telima. U Fazi 1, dok se upravljanje ne prenese na Gornje Kolo, osnivač u saradnji sa Fondacijom postavlja pravila Protokola, u skladu sa ograničenjima utvrđenim KOLO Pravilnikom.

Fondacija nije vlasnik sistema. Fondacija čuva zajedničko dobro, a nije njegov vlasnik. Razlika je pravno relevantna: vlasnik ima pravo da raspolaže imovinom po sopstvenoj volji, da je proda ili promeni njenu namenu. Fondacija nema nijedno od tih prava nad zajedničkim dobrom. Licencni mehanizmi opisani u poglavlju 3 — AGPL-3.0 za softver i CC BY-SA 4.0 za sadržaj — pravno sprečavaju fondaciju da privatizuje bilo koji deo zajedničkog dobra. Fondacija može da prestane da postoji, a softver i sadržaj ostaju dostupni po uslovima licenci pod kojima su objavljeni. Evidencija, međutim, zavisi od infrastrukture — kontinuitet njenog čuvanja je operativno pitanje koje fondacija obezbeđuje dok postoji, a u slučaju prestanka fondacije rešava se u skladu sa zakonom i procedurama prenosa opisanim u poglavlju 10.

Fondacija nema udeo u obračunskom sistemu. Fondacija ne stiče POEN-e, ne upisuje ZRNO, ne učestvuje u internom obračunu. Njen odnos sa sistemom je isključivo u dinarskim sredstvima koja prima kao donacije i troši na operativne troškove. Ovo razdvajanje je strukturno — fondacija je pravni instrument, ne korisnik u obračunu.

## Zajednica

KOLO Zajednicu čine svi korisnici sistema, koji zajedno brinu o zajedničkom dobru.

Zajednica nije pravno lice, nema organe ni predstavnike i kao celina ne donosi odluke. Zajednica je skup svih korisnika koji koriste sistem i doprinose mu. Korisnik je i korisnik usluge u smislu propisa, ali nije klijent koji kupuje uslugu od platforme, nego neko čiji odnos prema zajedničkom dobru nije svojinski nego participatoran — pravo korišćenja i doprinosa, sa učešćem u upravljanju koje se stiče pod uslovima opisanim u poglavlju 10. Učesnici čine Kolo; ni Kolo nije pravno lice, a pripadnost Kolu nije članstvo u fondaciji ni u drugom pravnom licu (poglavlje 7).

Zajednica doprinosi zajedničkom dobru na dva načina.

Prvi način je učešće u sistemu. Svaka razmena, svaka aktivnost, svaka verifikacija — sve to ostavlja zapis u evidenciji i time uvećava zajedničko dobro. Protokol evidentira te doprinose u POEN-ima.

Drugi način je finansiranje fondacije. Zajednica daje dinarske donacije fondaciji, koja ta sredstva troši na infrastrukturu i programe sistema. Ovaj finansijski tok je osnova arhitekture sistema, ne modul (detaljna mehanika opisana je u poglavlju 8) — bez njega fondacija ne može da održava infrastrukturu, a bez infrastrukture protokol nema gde da radi.

Zajednica kao celina ne donosi odluke, ali upravljanje sistemom progresivno prelazi na zajednicu. U sadašnjoj fazi, upravljanje je kod osnivača i fondacije. Kako sistem raste i kako se aktiviraju uslovi za formiranje Gornjeg Kola, upravljanje prelazi na Gornje Kolo, koje čine čuvari Kola koji su aktivirali ZRNO. Poglavlje 10 opisuje kako taj prenos funkcioniše. Ovde je dovoljno reći da je arhitektura sistema dizajnirana tako da upravljanje može da pređe sa jednog na drugog nosioca bez promene osnove — zajedničko dobro i protokol ostaju isti, menja se samo ko postavlja pravila.

## Odnos između fondacije i zajednice

Odnos između fondacije i zajednice nije hijerarhijski. Fondacija ne upravlja zajednicom. Zajednica ne upravlja fondacijom — u sadašnjoj fazi nema mehanizam za to, a u kasnijoj fazi taj odnos je posredan, kroz Gornje Kolo (poglavlje 10). Njihov odnos je funkcionalan: zajednica finansira fondaciju dinarskim donacijama, fondacija održava infrastrukturu; zajednica koristi sistem i doprinosi zajedničkom dobru, fondacija ga zastupa u pravnom prometu; zajednica raste, fondacija skalira infrastrukturu prema rastu.

Finansijski tok između zajednice i fondacije je jednosmeran i dinarski — zajednica daje fondaciji donacije u dinarima, fondacija troši na operativne troškove. Dinarska sredstva ne ulaze u interni obračunski sistem. Ovi tokovi su strogo razdvojeni, kao što je obrazloženo u poglavljima 3 i 4.

Doprinos donatora se evidentira u POEN-ima kao jednostrani administrativni zapis protokola — pravna kvalifikacija ovog odnosa obrazložena je u poglavljima 4 i 6.1.

Kad dinarske donacije premaše operativne troškove fondacije, višak se usmerava u programe sistema — kolektivne nabavke, socijalne programe, infrastrukturna ulaganja. Pravila raspoređivanja viška definišu osnivač i fondacija u sadašnjoj fazi, a Gornje Kolo u kasnijoj fazi. Višak se nikad ne distribuira pojedinačnim korisnicima kao prinos, dividenda ni bilo koji oblik individualne dinarske isplate.

## Kako se delovi uklapaju

Zajedničko dobro sa protokolom postoji kao kod i pravila. Fondacija mu daje pravni oblik i infrastrukturu, zajednica mu daje sadržaj, aktivnost i finansiranje. Protokol vodi evidenciju, fondacija zastupa sistem u pravnom prometu, zajednica ga koristi i — progresivno — njime upravlja.

Ova arhitektura je namerno jednostavna. Dva aktera, zajedničko dobro u centru, jasni tokovi. Složenost sistema ne dolazi iz arhitekture nego iz obračunskog okvira i modula koji se dodaju na ovu osnovu. Osnova je stabilna i ne menja se sa dodavanjem modula — svaki modul je proširenje koje radi na istoj infrastrukturi, koristi isti protokol i poštuje ista pravila.

Poglavlje 6 opisuje obračunski okvir — kako protokol upisuje i vodi zapise POEN-a i ZRNA, kako se obračunava koeficijent između njih i zašto nijedan od tih zapisa ne predstavlja finansijski instrument.

# 6. Obračunski okvir

Poglavlje 3 je uvelo POEN i ZRNO konceptualno — POEN evidentira doprinos, ZRNO evidentira položaj. Ovo poglavlje opisuje kako ta evidencija funkcioniše: kako zapisi nastaju, kako se koriste, kako se obračunavaju i zašto ne potpadaju pod regulatorne okvire namenjene finansijskim instrumentima.

Termin „obračunski okvir” je namerno odabran umesto „ekonomski model.” KOLO ne modelira ekonomiju u smislu tržišta, cena i alokacije resursa. KOLO vodi evidenciju doprinosa i položaja kroz obračunske jedinice čije zapise upisuje i održava protokol. Sve što sledi u ovom poglavlju opisuje administrativnu mehaniku evidencije, ne finansijske tokove.

## 6.1 POEN

### Definicija

POEN je interna obračunska jedinica sistema. Zapis POEN-a u evidenciji protokola predstavlja evidentiran doprinos korisnika zajedničkom dobru. POEN je podatak u evidenciji — pravna kvalifikacija onoga što POEN nije detaljno je obrazložena na kraju ovog odeljka, u nastavku analize iz poglavlja 4.

### Kako zapisi nastaju

Zapise POEN-a upisuje isključivo protokol. Nijedan korisnik ne može sam da upiše zapis POEN-a. Nijedna institucija — uključujući fondaciju — ne može da upiše zapis POEN-a van pravila definisanih u protokolu. Zapisi nastaju na osnovu aktivnosti korisnika i pravila koja postavljaju ljudi (u sadašnjoj fazi osnivač i fondacija, u kasnijoj fazi Gornje Kolo).

Protokol ažurira evidenciju POEN-a na dva načina. Korisnik može da inicira ažuriranje evidencije koje smanjuje njegov zapis i uvećava zapis drugog korisnika — bilo kao deo razmene dobara i usluga, bilo bez protivusluge. POEN pri tome ne menja nosioca jer nema nosioca: postoji isključivo kao zapis u evidenciji protokola, a protokol ažurira sopstvenu bazu na osnovu instrukcije korisnika. Ukupan broj POEN-a u sistemu se pri takvom ažuriranju ne menja (zero-sum). Pored ažuriranja postojećih zapisa, protokol upisuje nove zapise POEN-a kroz četiri razdvojena mehanizma. Prvi je doprinos korisnika — donacije fondaciji, pokroviteljstvo pravnih lica i preduzetnika za koje prijavu podnosi korisnik, operativni doprinos i verifikacija korisnika. U svim ovim slučajevima zapis se beleži u zapisu korisnika koji je doprineo. Drugi je rast krugova i zadruga (Moduli 1 i 2): protokol upisuje nove zapise POEN-a u skladu sa brojem članova i dostizanjem definisanih pragova, ali se ti zapisi evidentiraju u zapisu organizacione jedinice, ne pojedinačnih članova. Treći je automatska evidencija u okviru socijalnih programa (Modul 3): protokol upisuje nove zapise POEN-a za kvalifikovane grupe korisnika na osnovu statusa, bez aktivnosti od strane primaoca podrške. Četvrti je osnivački doprinos — naknadna evidencija rada obavljenog pre otvaranja platforme, koju protokol evidentira postupno i do unapred utvrđene granice (odeljak 8.1). Svaka od ovih kategorija ima unapred definisana pravila — koliko POEN-a se evidentira, pod kojim uslovima, sa kojim ograničenjima. Ta pravila su deo protokola i mogu se menjati kroz procese upravljanja opisane u poglavlju 10.

Protokol ne upisuje zapise POEN-a proizvoljno ni diskreciono. Svaki zapis je posledica konkretne aktivnosti korisnika i primene konkretnog pravila. Protokol ne može da upisuje zapise bez aktivnosti, niti može da odstupi od pravila.

### Kako se evidencija ažurira prilikom razmene

Kad dva korisnika razmene dobra ili usluge, protokol ažurira evidenciju oba korisnika — evidentira doprinos davaoca i primanje primaoca. Ukupan broj POEN-a se pri tome ne menja (zero-sum). Ključna razlika u odnosu na platni sistem: korisnik ne drži sredstvo koje prenosi drugom licu. POEN nema nosioca — korisnik inicira ažuriranje evidencije protokola, a ne prenos sredstva.

### Imovinsko pravo

Korisnici nemaju imovinsko pravo nad zapisima POEN-a — ovo je drugi od četiri principa sistema obrazložen u poglavlju 4. Kako je utvrđeno u prethodnim odeljcima, POEN nema nosioca, a ažuriranje evidencije je operacija protokola nad sopstvenom bazom, ne prenos sredstva između dva lica. Korisnik ne može da iznese POEN van sistema, ne može da ga proda za novac niti da nasleđuje zapise drugog korisnika. Kako zapisi nemaju imovinsku vrednost po dizajnu sistema, nemaju nosioca i ne mogu se konvertovati u sredstvo sa eksternom vrednošću, u okviru dizajna sistema ne postoji pravni osnov za potraživanje njihove vrednosti — ovo proizlazi iz same prirode evidencije, ne iz ugovornog ograničenja.

Za razumevanje prirode POEN-a korisna je distinkcija između evidencije i sredstva. Sredstvo (novac, token, prenosiv vaučer ili poklon kartica) ima inherentnu ili dodeljenu vrednost koja se može preneti. Evidencija (matična knjiga, katastarski list, zapisnik) beleži činjenicu bez toga da sama bude vrednost. POEN je bliži drugoj kategoriji — beleži da se doprinos dogodio, ali sam zapis ne predstavlja prenosivu vrednost niti obećanje buduće koristi. Ova distinkcija odgovara razlici koju literatura o komplementarnim valutama pravi između sistema zasnovanih na obračunu (mutual credit, accounting-based) i sistema zasnovanih na sredstvu (token-based) — gde je KOLO eksplicitno u prvoj kategoriji (Greco, 2009; Lietaer, 2001).

### Korišćenje

POEN se koristi unutar sistema za razmenu dobara i usluga između korisnika i kao mera doprinosa na osnovu koje se izračunavaju uslovi za upis ZRNA. POEN se ne može koristiti van sistema — ne postoji mehanizam konverzije u novac ni u bilo koje sredstvo sa spoljnom vrednošću (princip nekonvertibilnosti, poglavlje 4).

### Pravna kvalifikacija

Pravna kvalifikacija POEN-a — isključenje iz kategorija digitalne imovine, platnog sredstva, elektronskog novca i novca — obrazložena je u poglavlju 4. Mehanika opisana u prethodnim odeljcima potkrepljuje tu kvalifikaciju iz perspektive funkcionisanja sistema.

Zakon o digitalnoj imovini (čl. 2) definiše digitalnu imovinu kao digitalni zapis vrednosti koji se može digitalno prenositi, čuvati ili njime trgovati. POEN ne ispunjava funkcionalne pretpostavke te definicije: ne prenosi se u smislu zakona jer nema nosioca — korisnik ne drži POEN i ne predaje ga drugom licu, već inicira ažuriranje evidencije protokola; ne može se čuvati van sistema; ne može se njime trgovati jer ne postoji sekundarno tržište. POEN nije „digitalni zapis vrednosti” jer ne može se konvertovati u novac, ne može se monetizovati van sistema i ne postoji tržište na kome bi se njime trgovalo.

Zakon o platnim uslugama. POEN se ne prenosi između korisnika u smislu zakona jer nema nosioca. Kad korisnik inicira ažuriranje evidencije, protokol menja sopstvenu bazu; ne postoji platna transakcija jer ništa sa monetarnom vrednošću ne menja nosioca. POEN nije ni elektronski novac jer mu nedostaju elementi te definicije (poglavlje 4): nije novčano potraživanje ni prema kome; nije izdat po prijemu sredstava (protokol ga evidentira na osnovu aktivnosti korisnika, ne na osnovu uplate; donacija fondaciji i evidencija doprinosa su pravno odvojeni akti); ne služi za izvršavanje platnih transakcija; ažuriranje se ne naplaćuje; i iz zapisa nema isplate ni otkupa.

## 6.2 ZRNO

### Definicija

ZRNO je evidencija položaja u zajedničkom dobru. Zapis ZRNA u evidenciji protokola znači da je učesnik ispunio uslove za evidentiranje položaja. ZRNO je podatak u evidenciji koji beleži da korisnik kome je upisano učestvuje u zajedničkom dobru na način koji ispunjava definisane uslove — pravna kvalifikacija onoga što ZRNO nije data je na kraju ovog odeljka, u nastavku analize iz poglavlja 4.

Čuvar Kola ima korist od tog statusa. Ta korist je posledica strukture sistema — učešće u upravljanju kroz Gornje Kolo i pozicija u obračunskom sistemu koja se menja sa promenom obračunskog koeficijenta. Ta korist nije garantovana, nije fiksna i ne isplaćuje je nijedno lice.

### Raspoloživost

Ukupan broj ZRNA raspoloživih za upis je fiksiran na milion. Ovaj broj se ne može povećati ni smanjiti. Milion je gornja granica — u svakom trenutku, deo ZRNA je evidentiran kod korisnika, a deo je raspoloživ za evidentiranje u protokolu. Zbir ta dva broja je uvek milion.

Fiksiranost ukupnog broja je pravilo dizajna sistema, ne parametar koji podleže upravljačkoj promeni. Fiksiran broj znači da je ukupan obim evidentiranog položaja u zajedničkom dobru ograničen. Što više korisnika upiše ZRNO, manje je raspoloživo za nove upise, što menja obračunski koeficijent za sve korisnike. Ova mehanika je opisana u odeljku 6.3.

### Upis

ZRNO upisuje samo član Kola, odnosno član bez potvrde, koji upisano ZRNO ne aktivira dok ne bude potvrđen; korisnik, koji nije u Kolu, ZRNO ne upisuje. Upis se izvršava isključivo kroz protokol, na osnovu ispunjenja dva uslova.

Prvi uslov je minimum evidencije: učesnik koji upisuje ZRNO mora imati najmanje dvadeset hiljada POEN-a evidentiranih u sistemu. Ovaj prag obezbeđuje da ZRNO mogu da upišu samo učesnici koji su svojim doprinosom pokazali aktivan položaj u zajedničkom dobru.

Drugi uslov je ograničenje po obračunskom periodu: korisnik može da upiše najviše jedan procenat svog stanja POEN-a po obračunskom periodu. Ovo ograničenje sprečava naglo preuzimanje raspoloživih ZRNA od strane pojedinačnih korisnika i obezbeđuje postupno evidentiranje položaja.

Upis ZRNA je odluka korisnika koja se izvršava kroz protokol kad su uslovi ispunjeni. Protokol ne upisuje ZRNO automatski — korisnik inicira upis, protokol proverava uslove i izvršava upis ako su ispunjeni.

### Stanja ZRNA

Evidentirano ZRNO ima dva stanja: slobodno i aktivno. Sva stanja i prelazi između njih ažuriraju se u ponoć, zajedno sa svim ostalim obračunskim operacijama protokola.

Slobodno ZRNO je upisano ZRNO koje čuvar Kola drži u evidenciji bez upravljačke funkcije. Čuvar Kola može da inicira dve operacije sa slobodnim ZRNOM: aktivaciju — kojom ZRNO prelazi u aktivno stanje i postaje osnov za glasačku moć u Gornjem Kolu — ili otpis — kojim se ZRNO vraća u fond raspoloživih ZRNA u protokolu, a protokol čuvaru Kola evidentira POEN-e po tekućem obračunskom koeficijentu. Čuvar Kola može da otpiše bilo koji broj slobodnih ZRNA — otpis može biti parcijalan. Član bez potvrde kome je upisano ZRNO može slobodno ZRNO da otpiše, ali ne i da ga aktivira.

Aktivno ZRNO je upisano ZRNO koje je čuvar Kola aktivirao za učešće u upravljanju. Aktivno ZRNO daje glasačku moć u Gornjem Kolu — glasačka moć je jednaka kvadratnom korenu iz broja aktivnih ZRNA (poglavlje 10). Aktivno ZRNO ne može da se otpiše — čuvar Kola koji želi da otpiše aktivno ZRNO mora da ga prvo povuče u slobodno stanje, nakon čega može da inicira otpis u sledećem obračunskom periodu.

Ovaj mehanizam uspostavlja strukturni izbor između upravljačke funkcije i obračunske fleksibilnosti. Čuvar Kola koji aktivira ZRNO dobija glasačku moć ali gubi mogućnost otpisa dok ZRNO ne povuče. Čuvar Kola koji drži slobodno ZRNO može da ga otpiše za POEN-e, ali nema glasačku moć. Izbor je isključiv u svakom obračunskom periodu — isto ZRNO ne može istovremeno da služi za glasanje i da bude raspoloživo za otpis.

### Otpis

Čuvar Kola može da inicira otpis slobodnog ZRNA — da ga vrati u fond raspoloživih ZRNA u protokolu. Pri otpisu, protokol evidentira POEN-e čuvaru Kola po tekućem obračunskom koeficijentu. Otpis je suprotna operacija od upisa: pri upisu, korisnik troši POEN-e i upisuje ZRNO; pri otpisu, čuvar Kola vraća ZRNO, a protokol mu evidentira POEN-e. Obe operacije se izvršavaju u ponoć po koeficijentu koji važi za taj obračunski period.

Otpis je isključivo odluka čuvara Kola — protokol ne otpisuje ZRNO automatski niti primorava čuvara Kola da otpiše. Otpis može biti parcijalan — čuvar Kola može da otpiše bilo koji broj slobodnih ZRNA, od jednog do svih. Ne postoji limit otpisa po obračunskom periodu. Aktivno ZRNO ne može da se otpiše — čuvar Kola mora da ga prvo povuče u slobodno stanje, nakon čega može da inicira otpis najranije u sledećem obračunskom periodu. Korisnik kome je upisano ZRNO, a koji više nije u Kolu, ZRNO drži, ali ga ne otpisuje (poglavlje 7).

Obračunski koeficijent u trenutku otpisa može biti viši ili niži od koeficijenta u trenutku upisa. Ako je viši, protokol pri otpisu čuvaru Kola evidentira više POEN-a nego što ih je iskoristio kao osnov upisa. Ako je niži, evidentira manje. Ova razlika nije prinos koji neko isplaćuje ili garantuje — to je aritmetička posledica promene stanja evidencije celokupnog sistema. Nijedna institucija ne garantuje da će koeficijent rasti. POEN-i dobijeni otpisom imaju isti status kao svi drugi POEN-i — zapisi u evidenciji bez eksterne imovinske vrednosti koji se ne mogu konvertovati u novac (poglavlje 4, princip nekonvertibilnosti). Kvalifikacija razlike u evidentiranim POEN-ima kao nečega što nije prinos počiva na ovom lancu: razlika postoji samo u POEN-ima → POEN-i nemaju eksternu imovinsku vrednost → jer ne postoji mehanizam konverzije. Ako bi nekonvertibilnost bila narušena, razlika bi dobila eksternu vrednost i kvalifikacija bi se promenila — što je dodatni razlog zašto je nekonvertibilnost strukturni element sistema, ne parametar koji podleže promeni.

### Neprenosivost

ZRNO se ne može prenositi između korisnika. Ne postoji mehanizam — ni u protokolu ni van njega — kojim bi korisnik mogao da prenese svoj zapis ZRNA drugom korisniku. Ovo nije tehničko ograničenje koje bi se moglo zaobići — ovo je pravilo dizajna sistema. ZRNO je neprenosan zapis vezan za identitet korisnika utvrđen u lancu potvrda — čak i ako bi korisnik pokušao da ustupi pristup nalogu, ZRNO ostaje vezano za fizičku osobu čiju je stvarnost utvrdio verifikator, čime se sprečava funkcionalni transfer. Neprenosivost ZRNA znači da ne postoji tržište za ZRNO, ne postoji cena ZRNA i ne postoji mogućnost špekulacije ZRNOM.

### Pozicija čuvara Kola u obračunskom sistemu

Čuvar Kola ima poziciju u obračunskom sistemu koja se menja sa aktivnošću zajednice kroz obračunski koeficijent (odeljak 6.3). Nijedna institucija tu korist ne isplaćuje niti garantuje — promena pozicije je aritmetička posledica aktivnosti celokupnog sistema, ne garantovani rezultat individualnog položaja. Ako nema aktivnosti korisnika u sistemu, nema ni promene koeficijenta.

### Pravna kvalifikacija

Pravna kvalifikacija ZRNA — isključenje iz kategorija hartija od vrednosti, digitalne imovine i investicionih instrumenata — obrazložena je u poglavlju 4. Mehanika opisana u prethodnim odeljcima — neprenosivost, nepostojanje tržišta, odsustvo dividende ili garantovanog prinosa — potkrepljuje tu kvalifikaciju.

Dopunska analiza potvrđuje isključenje iz kategorije investicionog instrumenta. Korisnik ne ulaže novac u zajednički poduhvat — ZRNO se stiče evidencijom doprinosa u POEN-ima, ne uplatom sredstava, a prag od 20.000 POEN-a može se dostići isključivo razmenom, operativnim programima ili verifikacijom, bez ijednog dinara donacije. Ne postoji očekivanje profita u finansijskom smislu — pozicija u obračunskom sistemu nije prinos. Ne postoji napor drugog lica usmeren na stvaranje koristi za čuvara Kola: obračunski koeficijent je količnik dva zbira iz evidencije koji protokol izračunava automatski i bez diskrecije, nijedno lice njime ne upravlja niti ga obećava, a čuvar Kola ga ne pomera ni sopstvenim upisom ni sopstvenim otpisom — što je fundamentalno drugačiji odnos od odnosa investitor–menadžer. Član bez potvrde, koji upisano slobodno ZRNO sme da otpiše, a ne aktivira ga, ne upravlja sistemom; za njega ipak važe sva tri prethodna razloga — nema ulaganja sredstava, nema prinosa van evidencije i niko ne pomera koeficijent — a glas ne stiče ulogom, nego potvrdom, koja se ne kupuje i ne zavisi od broja ZRNA. Dva specifična aspekta mehanike ZRNA zahtevaju dopunu ove analize.

Lanac donacija–POEN–ZRNO. Korisnik koji donira dinare fondaciji stiče evidenciju u POEN-ima koja ga može približiti pragu za upis ZRNA. Tri elementa razbijaju kvalifikaciju ovog lanca kao investicionog ugovora: donacija je nepovratna i pravno odvojena od evidencije — donator ne može da uslovi donaciju evidencijom niti da zahteva povraćaj; donacija nije neophodan ni privilegovan put do ZRNA — isti prag važi za sve aktivnosti i učesnik može da stigne do praga isključivo razmenom i doprinosom, bez ijednog dinara donacije; odnos između iznosa donacije i broja evidentiranih POEN-a nije fiksna konverziona stopa nego parametar koji se može menjati. Čak i kad bi odnos bio fiksan, donacija je pravno nepovratna i ne stvara obavezu fondacije prema donatoru, čime je prekinut element očekivanja koje bi fundiralo kvalifikaciju kao investicioni ugovor.

Mehanika otpisa. Čuvar Kola koji upiše ZRNO pri jednom obračunskom koeficijentu a otpiše ga pri drugom, dobija drugačiji broj POEN-a od onog koji je iskoristio kao osnov upisa — u oba smera, jer koeficijent raste od upisa novih zapisa POEN-a a pada od njihovog poništenja (odeljak 6.3). Četiri elementa razbijaju kvalifikaciju te razlike kao prinosa: POEN-i evidentirani otpisom nemaju eksternu imovinsku vrednost — ne mogu se konvertovati u novac, izneti iz sistema ni monetizovati (princip nekonvertibilnosti); promena koeficijenta nije garantovana — proizlazi iz stanja evidencije celokupne zajednice, ne iz napora trećih lica u smislu investicionog ugovora; sopstveni upis i otpis koeficijent uopšte ne pomeraju, pa čuvar Kola nema ni instrument ni trenutak kojim bi razliku ostvario; ne postoji izdavalac koji obećava rast koeficijenta niti institucija koja isplaćuje razliku. Dodatno, struktura sistema uspostavlja strukturni izbor koji ograničava čisto pasivno držanje: čuvar Kola koji želi upravljačku korist mora da aktivira ZRNO, čime gubi mogućnost otpisa; čuvar Kola koji želi obračunsku fleksibilnost ne može istovremeno da glasa.

## 6.3 Obračunski koeficijent

### Definicija

Obračunski koeficijent je brojčani odnos između ukupnog broja POEN-a evidentiranih u sistemu i broja ZRNA raspoloživih za upis u protokolu. Protokol ga izračunava jednom dnevno, u ponoć.

### Formula

Obračunski koeficijent = ukupan broj POEN-a evidentiranih u sistemu ÷ broj ZRNA raspoloživih u protokolu.

Oba elementa formule su promenljiva. Ukupan broj POEN-a evidentiranih u sistemu raste sa upisom novih zapisa kroz sva četiri mehanizma — doprinos korisnika (donacije, pokroviteljstvo, operativni doprinos, verifikacija), rast krugova i zadruga, socijalne programe i osnivački doprinos. Razmena dobara i usluga između korisnika ne uvećava ukupan broj POEN-a u sistemu — ona redistribuira postojeće POEN-e između korisnika (zero-sum). Broj ZRNA raspoloživih u protokolu opada kad korisnici upisuju ZRNO — jer se upisano ZRNO evidentira kod čuvara Kola i više nije raspoloživo u protokolu.

### Kako se koeficijent menja

Koeficijent pomeraju isključivo promene ukupnog broja evidentiranih POEN-a — naviše i naniže.

Kad god protokol upiše nove zapise POEN-a — kroz doprinos korisnika (donacije, pokroviteljstvo, operativni doprinos, verifikacija), rast krugova i zadruga, socijalne programe ili osnivački doprinos — brojilac formule raste, bez obzira na to u čijem se zapisu novi POEN-i evidentiraju. To menja obračunski koeficijent naviše.

Kad se evidentirani POEN-i ponište — prestankom statusa korisnika, poništenjem po iskorišćenju u kolektivnoj nabavci, otpisom po raskinutom prijateljstvu u dečjem prostoru ili drugim osnovom utvrđenim pravilnikom — brojilac opada. To menja obračunski koeficijent naniže. Koeficijent, dakle, nije monoton i nije predodređen da raste.

Razmena dobara i usluga ne utiče na koeficijent jer redistribuira postojeće POEN-e bez promene ukupnog broja.

Upis i otpis ZRNA takođe ne pomeraju koeficijent, i to je posledica same formule, a ne pravila koje bi se moglo izmeniti. Pri upisu se imenilac umanjuje za upisana ZRNA, ali se brojilac istovremeno umanjuje za POEN-e koji su tim upisom vraćeni protokolu i izašli iz opticaja — a taj broj je upravo proizvod upisanih ZRNA i važećeg koeficijenta, pa količnik ostaje isti. Pri otpisu oba člana rastu po istom odnosu. Čuvar Kola svojim postupanjem ne može da pomeri sopstveni koeficijent ni u jednom smeru.

Svi ovi efekti su posledica aktivnosti korisnika u sistemu. Nijedan pojedinačni korisnik ne kontroliše koeficijent. Nijedna institucija ne kontroliše koeficijent. Koeficijent je izračunata vrednost koja proizlazi iz ukupnog stanja evidencije svih korisnika u sistemu.

### Šta obračunski koeficijent znači za korisnike

Za učesnika, obračunski koeficijent određuje koliko POEN-a je potrebno za upis jednog ZRNA u datom trenutku. Viši koeficijent znači da je za upis ZRNA potrebno više evidentiranog doprinosa. Korisnik koji je ranije ispunio uslove za upis ZRNA to je učinio pri nižem obračunskom koeficijentu — što znači da je za isti broj ZRNA bilo potrebno manje POEN-a.

Za čuvara Kola, promena obračunskog koeficijenta menja poziciju njegovog evidentiranog položaja u kontekstu sistema. Ta promena nije isplata, nije prinos i nije garantovana — to je aritmetička posledica promene stanja evidencije celokupnog sistema. Eventualna korist od promene pozicije realizuje se isključivo u POEN-ima — zapisima u evidenciji bez eksterne imovinske vrednosti. Čuvar Kola ne može da realizuje promenu pozicije u novcu, valuti ni bilo kom eksternom sredstvu. Korist od položaja je intrasistematska — postoji samo unutar sistema i ima vrednost samo za korisnike sistema koji razmenjuju dobra i usluge unutar njega.

### Šta obračunski koeficijent nije

Obračunski koeficijent je administrativna veličina — nije cena (ne postoji tržište), nije kurs (ne postoji konverzija između dve valute) i nije indeks performansi (ne meri profitabilnost). Protokol ga izračunava na osnovu stanja evidencije i koristi kao parametar za primenu pravila upisa i otpisa ZRNA. Njegov rast ili pad je posledica aktivnosti u sistemu, ne odluke nijednog lica.

Korisnik koji doprinosi sistemu u ranoj fazi — kad je koeficijent nizak — upisuje ZRNO uz manje evidentiranih POEN-a nego korisnik koji to isto čini u kasnijoj fazi sa višim koeficijentom. Pozicija ranog korisnika time odražava njegov doprinos u fazi uspostavljanja sistema. To je posledica uvažavanja ranijeg doprinosa zajedničkom dobru, a ne podsticaj za sticanje položaja: broj POEN-a potreban za upis izračunava protokol iz stanja evidencije, ne odluka kojom bi se rano učešće nagrađivalo, i nijedno lice ne obećava da će taj broj kasnije biti veći.

Pravilo od jedan procenat stanja po obračunskom periodu (odeljak 6.2) ograničava brzinu kojom se raspoloživa ZRNA preuzimaju — čak i kad veliki broj korisnika istovremeno ispuni uslove za upis, ukupan obim upisa po periodu je ograničen na jedan procenat ukupnog stanja svih korisnika koji ispunjavaju uslove za upis. Time se čuva pristup kasnijih korisnika i koeficijent ostaje manje osetljiv na pojedinačne upise novih zapisa POEN-a, jer se broj raspoloživih ZRNA ne iscrpljuje naglo.

# 7. Korisnici i dokaz stvarnosti
KOLO sistem razlikuje četiri statusa punoletnih korisnika: korisnik, član bez potvrde, član Kola i čuvar Kola. Korisnik je svako lice sa nalogom na platformi, bez obzira na status. Statusi se razlikuju po obimu pristupa, evidencije i prava koja iz te evidencije proizlaze. Prelaz između statusa odvija se po unapred definisanim pravilima: verifikacijom i potvrdom u lancu potvrda, odnosno upisom i otpisom ZRNA, koje protokol izvršava kad su uslovi ispunjeni, bez diskrecije bilo kog lica. Maloletni korisnik nema nijedan od ovih statusa; njegov položaj opisan je u poglavlju 9 (Modul 4).

Učesnici — članovi bez potvrde, članovi Kola i čuvari Kola — čine Kolo. Kolo nije pravno lice, a pripadnost Kolu nije članstvo u fondaciji ni u drugom pravnom licu.

## Dokaz stvarnosti

Stvarnost i kontinuitet korisnika potvrđuju se kroz model verifikacije zasnovan na ličnom poznavanju ili na razgovoru posle poziva — lanac potvrda u kome članovi Kola potvrđuju stvarnost korisnika ili ih uvode u Kolo. Model ne zahteva prikupljanje ličnih dokumenata. Korisnik je u Kolu ili nije; verifikacija određuje pristup funkcijama sistema, a potvrđenost i pravo potvrđivanja.

Stvarnost se potvrđuje samo u lancu potvrda. Ko ne poznaje nijednog člana Kola, može dospeti na spisak za poziv: kada sam zatraži razgovor, kada fondacija utvrdi prijem njegove javne donacije od najmanje 5.000 dinara izvršene jednom uplatom ili novčanog pokroviteljstva za koje je podneo prijavu, ili kada kao nosilac prijavi gazdinstvo, upisano ili neupisano u Registar poljoprivrednih gazdinstava. Na isti spisak dolazi i član bez potvrde koji zatraži razgovor radi potvrde; takav zahtev vide samo čuvari Kola. Uplata, pokroviteljstvo i prijava gazdinstva sami po sebi ne potvrđuju stvarnost. Korisnika sa spiska poziva član Kola radi upoznavanja i, ako posle razgovora proceni da ga poznaje dovoljno da za verifikaciju odgovara, uvodi ga u Kolo; razgovor sam po sebi nije verifikacija. Korisnik se unapred obaveštava da će član Kola koji ga pozove videti njegovo ime i prezime i broj telefona. Ti podaci otvaraju se klikom, samo članu Kola koji je poziv otvorio i samo dok je poziv otvoren, a fondacija beleži ko ih je otvorio. Donacija, pokroviteljstvo i doprinos evidentiran po njima ne zavise od poziva.

Dokaz stvarnosti je preduslov za pun pristup sistemu. Bez verifikacije korisnika, sistem ne može da obezbedi integritet evidencije jer ne može da garantuje da iza svakog zapisa stoji stvarna, jedinstvena osoba. Punoletni korisnik se registruje na platformi kao korisnik i odmah učestvuje u razmeni — postavlja oglase, razgovara sa drugim korisnicima i učestvuje u ažuriranju evidencije POEN-a — ali upis ZRNA i programi podrške zahtevaju verifikaciju, a učešće u upravljanju i potvrđivanje drugih zahtevaju i potvrđenost.

### Lanac potvrda

Dokaz stvarnosti funkcioniše kao lanac potvrda u kome članovi Kola potvrđuju korisnike koje lično znaju ili ih posle razgovora uvode u Kolo, a članovi bez potvrde uvode u Kolo korisnike koje lično znaju. Model potvrđuje dve stvari: stvarnost (korisnik postoji kao fizičko lice) i kontinuitet (ista osoba koja je prvobitno verifikovana i dalje koristi nalog). Jedinstvenost — da isto lice nema drugi nalog — verifikator ne može da zna, jer poznaje čoveka, a ne njegove naloge: zato je ne jemči, nego izjavljuje da mu drugi nalog nije poznat. Za korisnike koji dolaze na spisak za poziv ime i prezime, mesto i broj telefona porede se sa podacima uz druge naloge; poklapanje ništa ne blokira, a da su dva naloga nalozi istog lica utvrđuje fondacija, uz obrazloženje i pravo na prigovor.

Stvarnost korisnika utvrđuje jedan verifikator, jednom verifikacijom. Pripadnost Kolu nema stepene: korisnik je u Kolu ili nije. Učesnik je član bez potvrde, član Kola ili čuvar Kola. Potvrđen je samo član Kola: on ima pun pristup svim funkcijama platforme, uključujući pravo da potvrđuje stvarnost drugih. Punoletni korisnik koji je uveden u Kolo, a nije potvrđen, član je bez potvrde.

### Potvrda i uvođenje u Kolo

Verifikacija je potvrda ili uvođenje u Kolo. Potvrdu daje član Kola, odnosno osnivač, čoveku koga lično zna; potvrđeni postaje član Kola. U Kolo uvodi član Kola posle razgovora telefonom sa korisnikom sa spiska za poziv, a član bez potvrde uvodi poznanika koga lično zna; uvedeni postaje član bez potvrde. Koga uvede član bez potvrde, i sam je član bez potvrde. Uvođenje u Kolo nije slabija verifikacija: POEN-i po njemu evidentiraju se po istim pravilima, a dnevni tempo, nadzor i odgovornost za lažnu verifikaciju primenjuju se isto kao kod potvrde.

Član bez potvrde ima prava učesnika — razmenjuje, stiče evidenciju POEN-a, učestvuje u programima podrške, nabavkama, operativnom doprinosu i zadrugama, upisuje ZRNO i slobodno ZRNO može da otpiše — ali ne i prava koja akti vezuju za člana Kola: ne vidi spisak za poziv i ne uvodi u Kolo korisnike sa njega, ne potvrđuje nikoga — ni postojanje deteta, ni druge članove bez potvrde, ni ispunjenost uslova za program podrške — ne daje preporuku člana i ne nadzire. ZRNO upisuje, ali ga ne aktivira: nema glas, nije u Gornjem Kolu i ne delegira. Gazdinstvo prijavljuje kao nosilac, bez članova, a njegovo dete ne postaje dete Kola. Člana bez potvrde potvrđuje član Kola, odnosno osnivač, koji ga lično zna; posle najmanje trideset dana u Kolu, bez usvojene prijave razmene ili oglasa i bez utvrđene lažne verifikacije, može tražiti i razgovor telefonom sa čuvarom Kola, koji ga posle razgovora potvrđuje; fondacija ga može potvrditi i po sopstvenoj odluci. Član bez potvrde koji je upisao ZRNO dolazi na prvo mesto spiska, a fondacija obezbeđuje da ga čuvar Kola pozove u roku od tri dana. Razmena može biti način na koji su se upoznali, ali nije uslov potvrde. Ta potvrda nije nova verifikacija i po njoj se ne upisuju POEN-i; podleže nadzoru kao i verifikacija, a onaj ko je da odgovara za nju kao za verifikaciju. Kad član bez potvrde bude potvrđen, dobija spisak povezanih: one koje je uveo dok je bio bez potvrde i onoga ko je njega uveo, ako su još bez potvrde. Sa spiska lično potvrđuje one koje zna; to je njegova potvrda, za koju odgovara kao za verifikaciju, ide u nadzor i ne donosi POEN-e. Svaki tako potvrđeni dobija svoj spisak, pa se potvrda širi korak po korak, niz lanac i uz njega, ali samo odlukom ljudi koji se znaju. Potvrda se nikad ne dešava automatski.

### Lanac bez kruga

Pošto svaki učesnik koji nije osnivač ima jednog verifikatora, lanac potvrda je stablo: svaki takav korisnik ima tačno jednog prethodnika, a osnivači su njegovi koreni. Verifikator ne može da potvrdi nikoga iz svoje uzlazne linije, pa u lancu ne može nastati zatvorena petlja. Odbrana od koordinirane manipulacije (Douceur, 2002) ne počiva na broju potvrda, već na odgovornosti verifikatora za svaku verifikaciju; na dnevnom tempu potvrđivanja; na nadzoru čuvara Kola; i na tome što zapis POEN-a po verifikaciji nastaje tek kad učesnik ostvari prvi doprinos koji je potvrdila Fondacija odnosno čuvar Kola.

### Bootstrap i nadzor širenja

Svaka mreža verifikacije ima problem pokretanja — ko verifikuje prve korisnike. KOLO koristi polazni mehanizam u kome su osnivači — lica iz osnivačkog jezgra fondacije, upisana u javni registar kao osnivač ili članovi organa fondacije, i lica koja Upravni odbor odredi odlukom uz javno objavljen identitet — potvrđeni bez verifikacije od strane drugih korisnika, čime mogu da uspostave polaznu tačku verifikacionog stabla. Osnivači su jedini čija potvrđenost ne proizlazi iz lanca potvrda.

Nadzor širenja mreže vrše čuvari Kola; u početnoj fazi to su osnivači. Funkcija nadzora proizlazi iz statusa čuvara Kola, bez imenovanja, i ne zavisi od faze sistema. Nadzornik širenja naknadno proverava legitimnost izvršene verifikacije, čime obezbeđuje integritet grafa verifikacija. Verifikacije osnivača i čuvara Kola ne podležu nadzoru, osim uvođenja u Kolo posle razgovora telefonom sa korisnikom sa spiska za poziv, koje nadzoru podleže uvek, i kada ga obavi čuvar Kola; izuzet je samo osnivač. Verifikacije koje obavi član bez potvrde nadzornicima se prikazuju prve u redu nadzora. Fondacija iz podataka koji se već vode prepoznaje i zatvorene grupe — članove bez potvrde koji su uveli jedni druge u Kolo i razmenjuju samo međusobno; provera samo prikazuje grupu Fondaciji i nema dejstvo prema korisniku. Broj verifikacija koje jedan verifikator može da obavi nije ograničen; ograničen je tempo — brzo potvrđivanje većeg broja lica u jednom danu najpre povlači upozorenje, a zatim zaustavljanje potvrđivanja do kraja dana. Data potvrda ne prestaje zato što je lice koje ju je dalo napustilo sistem; poništava je samo utvrđena lažnost.

Protokol evidentira svaki čin verifikacije kao doprinos zajedničkom dobru; nadzor se kao doprinos ne evidentira. Konkretni parametri — pravila dnevnog tempa potvrđivanja, pravila polaznog mehanizma, procedure nadzora širenja i detaljna analiza otpornosti na koordiniranu manipulaciju — definisani su u Pravilniku o dokazu stvarnosti.

### Podaci koji se čuvaju

Platforma čuva minimalni skup podataka: pseudonim naloga, graf verifikacija sa podatkom da li je svaka verifikacija potvrda ili uvođenje u Kolo, podatak o verifikaciji i potvrđenosti, datum pristupanja i email adresu. Ime i prezime vodi se samo u zasebnoj evidenciji identiteta (poglavlje 12), a broj telefona korisnik ostavlja sam, kada pristane na poziv sa spiska za poziv. Fondacija ne čuva podatke o korisnicima platforme. Korisnik može dobrovoljno uneti dodatne podatke radi lakšeg korišćenja platforme, ali to nije uslov za verifikaciju niti za pristup funkcijama sistema.

### Pravna dimenzija dokaza stvarnosti

Graf verifikacija, čak i pseudoniman, predstavlja obradu podataka o ličnosti u širem tumačenju Zakona o zaštiti podataka o ličnosti. Pravni osnov za ovu obradu je izvršenje ugovornog odnosa — korisnik pristupanjem sistemu prihvata pravila koja uključuju nadzor verifikacionog procesa radi očuvanja integriteta sistema. Detalji usklađenosti sa propisima o zaštiti podataka opisani su u poglavlju 12. Tačna mehanika lanca bez kruga, parametri polaznog mehanizma, procedure nadzora širenja i detaljna analiza otpornosti na koordiniranu manipulaciju definisani su u Pravilniku o dokazu stvarnosti.

### Dinarski tok — odvojena identifikacija

Za dinarski tok važe odvojeni mehanizmi identifikacije: verifikacija donatora se obezbeđuje kroz bankovni sistem — fondacija prima donacije sa verifikovanih bankovnih računa; verifikacija pokrovitelja (pravnih lica, preduzetnika i nosilaca registrovanih poljoprivrednih gazdinstava) se obezbeđuje na osnovu ugovora o donaciji sa fondacijom. Ovi mehanizmi se odnose na identifikaciju za potrebe finansijskog toka fondacije, ne na dokaz stvarnosti korisnika, koji se ostvaruje samo u lancu potvrda.

## Korisnik koji nije u Kolu

Status korisnika ima punoletni korisnik registrovan na platformi koji još nije u Kolu. Može da pregleda sistem, da postavlja oglase kojima nudi ili traži dobra i usluge, da razgovara sa drugim korisnicima u obimu utvrđenom Uslovima korišćenja i da učestvuje u ažuriranju evidencije POEN-a kao primalac i kao davalac. Doprinos mu se evidentira kroz doprinos sadržaju platforme, finansijski doprinos i pokroviteljstvo. Nema pristup upravljanju, potvrđivanju drugih ni programima podrške i ne upisuje ZRNO. Ako ne poznaje nijednog člana Kola, može dospeti na spisak za poziv, sa koga ga član Kola poziva radi upoznavanja.

Korisnik postaje član Kola kad član Kola potvrdi njegovu stvarnost i kontinuitet kroz lanac potvrda, čime stiče pun pristup sistemu. Kad ga član Kola posle razgovora, odnosno član bez potvrde koji ga lično zna, uvede u Kolo, postaje član bez potvrde.

## Član bez potvrde

Član bez potvrde je punoletni korisnik koga je neko uveo u Kolo, a koga još nije potvrdio član Kola koji ga lično zna. To je prolazan status: ima prava učesnika, ali ne i prava koja akti vezuju za člana Kola — ne potvrđuje druge, nego ih samo uvodi u Kolo, i ne aktivira ZRNO (odeljak „Potvrda i uvođenje u Kolo”). Pripadnost Kolu, kao ni u drugim statusima, nije članstvo u fondaciji ni u drugom pravnom licu.

## Član Kola

Član Kola je korisnik čija je stvarnost potvrđena potvrdom u lancu potvrda. Član Kola razmenjuje dobra i usluge sa drugim korisnicima unutar sistema. Doprinosi zajedničkom dobru kroz aktivnosti čiji se doprinos evidentira u POEN-ima. Može da donira dinarska sredstva fondaciji, da potvrđuje stvarnost korisnika koje lično zna, da posle razgovora uvodi u Kolo korisnike sa spiska za poziv i da učestvuje u krugovima i zadrugama kad se ti moduli aktiviraju (poglavlje 9).

Član Kola nema ZRNO evidentirano u protokolu. To znači da ili još nije ispunio uslove za upis ZRNA (odeljak 6.2), ili je odlučio da ga ne upiše. Član Kola u potpunosti koristi obračunski okvir — razmenjuje, doprinosi, stiče evidenciju POEN-a — ali nema evidentiran položaj u smislu ZRNA i ne učestvuje u upravljanju kroz Gornje Kolo (poglavlje 10).

Osnovna motivacija člana Kola je neposredna: sistem mu omogućava razmenu dobara i usluga sa drugim korisnicima pod pravilima definisanim u protokolu. Član Kola ima korist od učešća svaki put kad razmeni nešto sa drugim korisnikom. Ta korist nije obećana i nije garantovana — zavisi od toga da li u sistemu postoje drugi korisnici koji nude ono što on traži i traže ono što on nudi. Detaljnija analiza podsticajne strukture data je u poglavlju 11.

## Čuvar Kola

Čuvar Kola je član Kola kome je u protokolu upisano ZRNO. Čuvar Kola je sve što je član Kola — razmenjuje, doprinosi, koristi sistem — ali ima i dodatna prava i dodatnu poziciju u sistemu.

Status čuvara Kola ne oslobađa od dokaza stvarnosti: pristup čuvara Kola, kao i svakog člana Kola, proizlazi iz potvrđene stvarnosti. Čuvar Kola kome verifikacija padne postaje korisnik. ZRNO mu ostaje upisano i zamrznuto: dok ponovo ne bude potvrđen, korisnik kome je upisano ZRNO ne aktivira ga, ne otpisuje ga, ne delegira glas po osnovu njega, nije u sastavu Gornjeg Kola i ne potvrđuje stvarnost drugih. Kada mu stvarnost bude ponovo potvrđena, ponovo je čuvar Kola. Čuvar Kola kome se poništi samo potvrda, a uvođenje u Kolo mu i dalje važi, postaje član bez potvrde: ZRNO mu ostaje upisano, aktivno ZRNO prelazi u slobodno stanje, a ponovo ga može aktivirati kada bude potvrđen. Izuzetak su samo osnivači, čija potvrđenost ne proizlazi iz lanca potvrda. Čuvari Kola vrše funkciju nadzornika širenja za verifikacije drugih članova Kola i članova bez potvrde, kao i za potvrde članova bez potvrde. Broj verifikacija ni za koga nije ograničen; ograničen je samo dnevni tempo, isti za sve verifikatore.

Čuvar Kola, kad se Gornje Kolo uspostavi, učestvuje u upravljanju sistemom aktiviranjem ZRNA. Gornje Kolo je telo zajednice koje čine čuvari Kola koji su aktivirali ZRNO i koje utvrđuje predloge o pravilima protokola, a Upravni odbor fondacije ih usvaja svojim aktom. Mesto i glas u Gornjem Kolu proizlaze isključivo iz aktiviranog ZRNA, ne iz bilo kog drugog osnova; slobodno ZRNO mesto u Gornjem Kolu ne daje. Poglavlje 10 opisuje kako Gornje Kolo funkcioniše.

Čuvar Kola ima položaj u evidenciji koji beleži njegov doprinos — korist, ograničenja i pravna kvalifikacija te pozicije opisani su u odeljcima 6.2 i 6.3.

Motivacija čuvara Kola ima dva aspekta. Neposredna motivacija je ista kao kod člana Kola — razmena i doprinos. Dodatna motivacija je učešće u upravljanju kroz Gornje Kolo i pozicija u obračunskom sistemu. Detaljnija analiza podsticajne strukture za sve statuse korisnika data je u poglavlju 11.

## Kako se postaje čuvar Kola

Član Kola postaje čuvar Kola upisom ZRNA kroz protokol; korisnik ZRNO ne upisuje. Član bez potvrde ZRNO upisuje, ali upisom ne postaje čuvar Kola: to postaje tek kada bude potvrđen. Uslovi upisa su opisani u odeljku 6.2: minimum dvadeset hiljada POEN-a evidentiranih u sistemu i ograničenje od jedan procenat stanja po obračunskom periodu.

Prelaz iz jednog statusa u drugi nije administrativna odluka — nijedan akter u sistemu (fondacija, osnivač, Gornje Kolo) ne odobrava niti odbija upis. Korisnik inicira upis, protokol proverava uslove i izvršava ga ako su ispunjeni. Upis je operacija između korisnika i protokola, bez diskrecije bilo kog lica.

Čuvar Kola može da izgubi taj status otpisom ZRNA po obračunskom koeficijentu u novom obračunskom periodu. Otpis je deo mehanike sistema opisane u odeljku 6.2. Čuvar Kola čije je ZRNO u potpunosti otpisano ponovo postaje član Kola — sa svim pravima člana Kola, bez prava koja proizlaze iz evidentiranog ZRNA. Čuvar Kola kome padne verifikacija postaje korisnik kome je upisano ZRNO, sa posledicama opisanim u prethodnom odeljku.

## Odnos korisnika prema zajedničkom dobru

Svi korisnici imaju pristup zajedničkom dobru — istom softveru, istim pravilima, istoj infrastrukturi — u obimu koji odgovara njihovom statusu. Korisnik ima pristup za pregled i učešće u razmeni; član bez potvrde ima pristup učesnika, bez prava koja akti vezuju za člana Kola; član Kola ima pun pristup za korišćenje i doprinos; čuvar Kola ima pun pristup plus pravo upravljanja i poziciju u obračunskom sistemu. Razlika između statusa nije u prirodi odnosa prema zajedničkom dobru nego u obimu evidencije: čuvar Kola ima evidentiran položaj koji mu daje pravo na upravljanje (pod uslovima iz poglavlja 10) i poziciju u obračunskom sistemu.

Odnos svih korisnika prema zajedničkom dobru je participatoran — pravo korišćenja i doprinosa, ne pravo raspolaganja ni svojinsko pravo (poglavlja 3 i 4).

Uslovi korišćenja zajedničkog dobra su jednaki za sve korisnike istog statusa, transparentni i ugrađeni u protokol. Pravila pristupa i doprinosa definisana su u pravilima korišćenja sistema i mogu se menjati kroz procese upravljanja opisane u poglavlju 10. Jasno definisane granice pristupa i razlikovanje statusa korisnika su strukturni elementi koji odgovaraju prvom od osam dizajn principa za upravljanje zajedničkim dobrima koje je formalizovala Elinor Ostrom (1990) — detaljno mapiranje dato je u Prilogu E.

## Šta korisnici nisu

Korisnici KOLO sistema nisu klijenti platforme. Ne kupuju uslugu od fondacije. Ne plaćaju pretplatu. Fondacija im ne duguje uslugu. Odnos između korisnika i sistema je participatoran — korisnik jeste korisnik usluge u smislu propisa, ali u zajedničkom dobru učestvuje sa pravima korišćenja i doprinosa, ne sa pravom potraživanja usluge.

Korisnici nisu investitori — razlozi su obrazloženi u poglavlju 4 (princip nepovratnosti donacija) i odeljku 6.2 (upis ZRNA na osnovu evidencije doprinosa, ne uplate).

Korisnici nisu zaposleni sistema. Učešće u sistemu je dobrovoljno i ne ispunjava nijedan od tri konstitutivna elementa radnog odnosa iz člana 5 Zakona o radu: ne postoji subordinacija — korisnik nije pod nadzorom niti po uputstvima fondacije ili bilo kog drugog aktera; ne postoji lična obaveza rada — korisnik sam odlučuje da li, kada i koliko učestvuje; ne postoji naknada — evidencija POEN-a nije naknada za rad, nego evidencija doprinosa koja nema eksternu imovinsku vrednost i ne može se konvertovati u novac (poglavlja 4 i 6.1). Specifičan radno-pravni aspekt operativnih programa, gde korisnik preuzima i izvršava konkretne zadatke, razmatra se u odeljku 8.3.

Korisnici su lica koja koriste sistem, doprinose mu prema sopstvenoj odluci i čija se pozicija u sistemu menja sa njihovom aktivnošću i aktivnošću zajednice — u okvirima i sa ograničenjima opisanim u poglavlju 6.

# 8. Doprinos zajedničkom dobru

Zajedničko dobro ne nastaje samo od sebe — nastaje doprinosom korisnika. Pored razmene dobara i usluga između korisnika (koja redistribuira postojeće POEN-e, odeljak 6.1), sistem prepoznaje tri kategorije doprinosa koje uvećavaju ukupan broj POEN-a u sistemu: finansijski doprinos, operativni doprinos i osnivački doprinos. Sve tri su deo osnove sistema — mehanizmi koji funkcionišu od prvog dana i na kojima počiva operativna i obračunska logika sistema. Nisu moduli koji se aktiviraju prema preduslovima, nego konstitutivni elementi sistema: bez finansijskog doprinosa fondacija nema sredstva za infrastrukturu, bez operativnog doprinosa zajednica nema mehanizam za evidentiranje aktivnosti van platforme, a osnivački doprinos evidentira rad obavljen pre nego što je sistem postojao. Za razliku od finansijskog i operativnog doprinosa, koji traju koliko i sistem, osnivački doprinos je jednokratan i vremenski ograničen.

## 8.1 Osnivački doprinos

Osnivački doprinos je rad obavljen pre otvaranja platforme — projektovanje sistema, izrada protokola, pravna i organizaciona priprema. Po svojoj prirodi to je doprinos zajedničkom dobru istog karaktera kao operativni doprinos, ali obavljen pre nego što je sistem postojao, pa nije mogao biti evidentiran u trenutku kad se odvijao. Kroz ovaj kanal protokol taj rani doprinos evidentira naknadno — postupno i do unapred utvrđene gornje granice. Za razliku od finansijskog i operativnog doprinosa, koji traju koliko i sistem, osnivački doprinos je jednokratan: kad protokol evidentira pun iznos, kanal se trajno zatvara.

Protokol ne evidentira osnivački doprinos odjednom, nego ga vezuje za rast sistema — evidentira ga u koracima fiksnog iznosa, prema kumulativnom rastu ukupnog broja POEN-a u sistemu. Ovo je dizajnerska odluka. Svaki upis novih zapisa POEN-a pomera obračunski koeficijent (odeljak 6.3); evidentiranje celog iznosa odjednom proizvelo bi nagli skok koeficijenta, dok vezivanje za rast sistema čini da koeficijent isti nivo dostigne srazmerno rastu. Kanal prati rast kakav god da je njegov tempo: ako ukupan broj POEN-a poraste naglo, koraci se evidentiraju istom brzinom kojom je rast nastupio.

Pošto je korak fiksan, uticaj jednog koraka na koeficijent opada kako sistem raste. Udeo zbirno evidentiranog osnivačkog doprinosa u ukupnom broju POEN-a je druga veličina i ona ne opada: i pragovi i korak izraženi su u fiksnim iznosima, a POEN evidentiran kroz ovaj kanal ulazi u ukupan broj, pa zbirni osnivački doprinos čini između približno jedne petine i približno jedne četvrtine ukupnog broja evidentiranih POEN-a kroz ceo vek kanala — u trenutku zatvaranja približno 24%. Taj udeo ne nosi imovinsko pravo i ne predstavlja potraživanje; krug osnivača je zatvoren i ne može se proširiti, a kanal se po dostizanju gornje granice zatvara trajno.

Gornja granica je mera doprinosa koji je prethodio sistemu: osnivači su u projektovanje, izradu i pravnu i organizacionu pripremu uložili sopstvena novčana sredstva i sopstveno vreme, u periodu u kome nijedan kanal evidentiranja nije radio. Taj rad se ne može evidentirati kroz operativni doprinos ni naknadno — dnevni limit tog kanala iznosi 10% ukupnog broja evidentiranih POEN-a, pa je dok je taj broj nula i limit nula.

Rezultat osnivačkog rada — softver, protokol i dokumentacija sistema — ulazi u zajedničko dobro pod licencama iz poglavlja 3: softver pod AGPL-3.0, sadržaj pod CC BY-SA 4.0. Osnivači po osnovu tog rada ne stiču isključivo pravo na rezultat; on je pod istim uslovima dostupan svim licima, a licence se ne mogu zameniti restriktivnijim.

POEN-i evidentirani kroz ovaj kanal beleže se u zapisima osnivača — fizičkih lica koja su obavila rad pre otvaranja platforme — i imaju isti status kao svi drugi POEN-i: zapisi u evidenciji bez imovinskog prava korisnika, nekonvertibilni i bez eksterne vrednosti (poglavlja 4 i 6.1). Osnivački doprinos ne uspostavlja izuzetak od pravila obračunskog okvira — osnivač koji upisuje ZRNO podleže istom pragu i istom ograničenju po obračunskom periodu kao svaki drugi učesnik koji upisuje ZRNO (odeljak 6.2) — i zaseban je mehanizam evidentiranja koji ne dodiruje limit operativnog doprinosa.

Gornja granica osnivačkog doprinosa, iznos i raspored koraka evidentiranja i tačka na kojoj se kanal zatvara definisani su u Pravilniku.

## 8.2 Finansijski doprinos

Finansijski doprinos je dinarski priliv u fondaciju koji obezbeđuje operativnu održivost sistema. Ovaj odeljak obuhvata dva podmodula: donacije fizičkih lica i pokroviteljstvo pravnih lica, preduzetnika i nosilaca registrovanih poljoprivrednih gazdinstava. Oba koriste isti princip — nepovratna donacija fondaciji čiji se doprinos evidentira u POEN-ima kao jednostrani administrativni zapis protokola. Razlika je u pravnoj prirodi donatora i u regulatornim obavezama koje iz toga proizlaze.

### Donacije fizičkih lica

Poglavlje 5 opisuje finansijski odnos između zajednice i fondacije kao deo osnovne arhitekture sistema — zajednica finansira fondaciju dinarskim donacijama, fondacija troši na infrastrukturu i programe. Ovaj odeljak pokriva pravila, mehanizme i detalje tog odnosa.

Donacije su u dinarima ili drugoj valuti i ne ulaze u interni obračunski sistem (poglavlje 4, princip nekonvertibilnosti). Doprinos donatora se evidentira u POEN-ima po pravilima koja definišu odnos između iznosa donacije i broja evidentiranih zapisa — pravna kvalifikacija tog odnosa obrazložena je u poglavlju 4. Ovaj odeljak pokriva operativnu mehaniku: nivoe donacija, koeficijent evidencije donacija, poreski tretman i pravila raspoređivanja viška.

Kad dinarske donacije premaše operativne troškove fondacije, višak se usmerava u programe sistema. Kolektivne nabavke su zaseban podmodul — fondacija koristi višak sredstava za nabavku dobara ili usluga koje se distribuiraju učesnicima u okviru programskih aktivnosti fondacije. Pravila raspoređivanja viška definišu osnivač i fondacija u sadašnjoj fazi, Gornje Kolo u kasnijoj fazi.

Pravna dimenzija: donacije podležu poreskim propisima koji regulišu donacije fondacijama. Fondacija izdaje potvrdu o donaciji u skladu sa zakonom. Poreski tretman donacije — uključujući eventualna poreska umanjenja za donatora — zavisi od statusa donatora (fizičko ili pravno lice), od registrovanog statusa fondacije i od važećih poreskih propisa u trenutku donacije.

### Pokroviteljstvo pravnih lica, preduzetnika i gazdinstava

Pokrovitelji su pravna lica, preduzetnici i nosioci registrovanih poljoprivrednih gazdinstava koji doniraju novac Fondaciji ili se obavezuju da dobra i usluge bez naknade daju licima koja Fondacija odredi. Ovaj podmodul je most između spoljne ekonomije i KOLO sistema.

Mehanika je sledeća: pravno lice, preduzetnik ili nosilac registrovanog poljoprivrednog gazdinstva uplaćuje donaciju na račun Fondacije, koja sredstva koristi za ciljeve sistema. Doprinos se evidentira u POEN-ima kao jednostrani administrativni zapis protokola, u zapisu korisnika koji je podneo prijavu pokroviteljstva — vlasnika, zakonskog zastupnika ili lica koje je ovlastio nadležni organ pravnog lica, odnosno samog preduzetnika ili nosioca gazdinstva — po istoj tabeli koja važi za donacije fizičkih lica. Pravni oblik davaoca ne utiče na koeficijent evidencije.

Evidencija se vezuje za fizičko lice, ne za samo pravno lice. Pravno lice ne može biti korisnik KOLO sistema — sistem je dizajniran za fizička lica. Lice koje podnosi prijavu mora biti punoletni korisnik sistema; za novčano pokroviteljstvo verifikacija nije uslov, a prijavu pokroviteljstva dobrima i uslugama podnosi učesnik.

Doprinos iz jedne prijave evidentira se u zapisu jednog korisnika i ne raspoređuje se na druge vlasnike, i kada pravno lice ima više vlasnika. Svaka donacija se obračunava u trenutku prijema na osnovu zasebnog ugovora o donaciji. Kumulativni doprinos pokrovitelja vodi se odvojeno od ličnih donacija korisnika, i dva zbira se ne sabiraju; gazdinstvo ima sopstveni zbir, odvojen i od ličnih donacija nosioca i od zbira firme sa kojom je nosilac povezan. Fondacija vodi evidenciju o vezi između pravnog lica i korisnika u čijem zapisu se doprinos evidentira.

Ovo je jedina tačka u sistemu gde spoljna ekonomija direktno utiče na internu evidenciju: pravno lice daje novac, dobra ili usluge, a protokol evidentira doprinos u zapisu fizičkog lica koje je prijavu podnelo. Evidentiranje nije davanje pravnog lica korisniku ni raspodela dobiti i ne stvara imovinsko pravo.

Pravna dimenzija: pokrovitelj je pravno lice ili preduzetnik registrovan u Republici Srbiji, odnosno nosilac registrovanog poljoprivrednog gazdinstva, koji donaciju uplaćuje sa računa gazdinstva ili sa sopstvenog računa. Fondacija proverava pokrovitelja na osnovu ugovora o donaciji i podatka o uplatiocu sa izvoda, dokumentuje vezu između pravnog lica i korisnika u čijem zapisu se doprinos evidentira i vodi računa o potencijalnom riziku od zloupotrebe ove veze. Pokrovitelj po osnovu doprinosa ne stiče prednost u izboru ponude u kolektivnoj nabavci.

Pre prve donacije firma ili gazdinstvo se jednom upisuje u evidenciju pokrovitelja — sa kontakt podacima, logotipom i odnosom korisnika prema njoj — i Fondacija upis proverava; iz upisa se zatim pokreće svaka donacija, novčana ili dobrima i uslugama. Pokroviteljstvo dobrima i uslugama ima drugačiju mehaniku. Davalac ugovorom preuzima obavezu da tačno određena dobra preda, odnosno usluge pruži učesnicima koji uzmu vaučere; Fondacija dobra ne preuzima i ne poseduje, a imalac vaučera ima sopstveno pravo prema davaocu. Prijavu podnosi zastupnik, preduzetnik, vlasnik ili stvarni vlasnik, a za registrovano poljoprivredno gazdinstvo njegov nosilac. Vrednost doprinosa je cena iz cenovnika davaoca, čiju fotografiju prilaže — Fondacija cenu ne procenjuje. Ugovor se zaključuje elektronski, na platformi, potvrdom uz jednokratni kod. Doprinos se evidentira kad je ugovor potpisan i vaučeri izdati, sa koeficijentom koji odgovara nivou koji je pokrovitelj dostigao novčanim doprinosom; dobra i usluge nivo ne podižu, a na rang-listi pokrovitelja vode se u posebnom delu. Vaučer glasi na dobro ili uslugu, ne na iznos, i važi godinu dana. Vaučeri su dostupni učesnicima od izdavanja, bez reda i roka: korisnik uzme vaučer i pri tome mu se poništava broj POEN-a koji se izvodi iz upisa po ugovoru, bez uvećanja po koeficijentu — pa donirana stvar ne povećava ukupan broj POEN-a iznad uvećanja po koeficijentu. Zapis o tome, sa opisom i nazivom davaoca, vidi se u evidenciji uz pseudonim, na šta korisnik pristaje pri uzimanju; vaučer koji ne iskoristi do isteka prestaje, a poništenje ostaje. Davalac i lica sa njim povezana ne uzimaju sopstvene vaučere. Ako davalac ne izvrši obavezu, ugovor se raskida: imaocima neiskorišćenih vaučera poništenje se ispravlja, podnosiocu se otpisuje ono što mu je za sve neizvršene vaučere evidentirano, uključujući uvećanje po koeficijentu, i otpis se izvršava i kada zapis time postane negativan; davalac ne može zaključiti nov ugovor dok ga Fondacija ne skine sa liste zabrane.

## 8.3 Operativni doprinos

Operativni doprinos je aktivnost van platforme čiji se doprinos evidentira u POEN-ima nakon verifikacije. Fondacija, Gornje Kolo ili čuvari Kola objavljuju zadatak koji treba da bude obavljen za zajedničko dobro. Korisnik se dobrovoljno prijavljuje za izvršenje zadatka, a čuvari Kola verifikuju izvršenje pre evidencije doprinosa. U Fazi 1, dok Gornje Kolo nije uspostavljeno, izvršenje verifikuju čuvari Kola i lice koje Upravni odbor ovlasti. Sve prijave su javno vidljive svim korisnicima sistema, čime se obezbeđuje transparentnost. Operativni doprinos može da obuhvati širok spektar aktivnosti — od organizovanja lokalnog događaja, preko tehničkog rada na infrastrukturi, do promocije sistema u zajednici.

Sistem primenjuje limit od 10% ukupnog broja POEN-a evidentiranih u sistemu po obračunskom periodu na količinu POEN-a koja se može evidentirati kroz operativni doprinos, čime štiti evidenciju od inflatornog pritiska. Ovaj parametar podleže promeni kroz procese upravljanja opisane u poglavlju 10. Zadatak se deli na celine — manje delove posla, po pravilu takve da se jedna izvrši u jednom danu, određene prema onome što se njima izvršava, a ne prema vremenu. Predloženi POEN utvrđuje se uz zadatak, za jednu celinu; izvršilac uz dokaz navodi samo koliko je celina izvršio i iznos ne određuje on. Procedura prijave, izvršenja i verifikacije definisana je u Pravilniku.

Isti dnevni limit obuhvata i socijalne programe. Ostali kanali kojima nastaju novi POEN-i nisu pod tim limitom, ali svaki ima sopstvenu granicu: verifikacija, prvi oglas i doprinos gazdinstva evidentiraju se jednom po licu; finansijski doprinos i pokroviteljstvo ograničeni su stvarno primljenim sredstvima, odnosno vrednošću dobara po ugovoru; rast zadruga zatvorenom tabelom pragova; osnivački doprinos gornjom granicom; a doprinos dece u dečjem prostoru otpisuje se pri punoletstvu. Ukupan broj POEN-a koji nastaje van dnevnog limita time je vezan za broj stvarnih lica, za primljena sredstva i za unapred utvrđene granice.

Pravna dimenzija: operativni doprinos ne uspostavlja radni odnos u smislu člana 5 Zakona o radu. Ne postoji subordinacija — korisnik samostalno odlučuje da li se prijavljuje, sam predlaže plan izvršenja i sam određuje način rada; može da odustane od zadatka bez posledica osim izostanka evidencije doprinosa. Ne postoji lična obaveza rada — preuzimanje je dobrovoljno i ne stvara obligaciju u pravnom smislu. Ne postoji naknada — POEN-i koji se evidentiraju nakon verifikovanog izvršenja su zapisi u evidenciji protokola bez eksterne imovinske vrednosti (poglavlja 4 i 6.1). Operativni doprinos nosi veći radno-pravni rizik od drugih oblika učešća jer uključuje definisan zadatak sa uslovima izvršenja, ali odsustvo sva tri elementa iz člana 5 onemogućuje kvalifikaciju kao radni odnos.

# 9. Moduli

KOLO sistem razdvaja osnovu od modula. Osnova — zajedničko dobro, protokol, fondacija, zajednica, POEN, ZRNO, korisnici, dokaz stvarnosti, finansijski i operativni doprinos (poglavlja 3–8) — funkcioniše od prvog dana i čini minimalan skup elemenata bez kojih sistem ne postoji. Moduli su proširenja koja dodaju funkcionalnost osnovi bez da je menjaju. Svaki modul koristi isti protokol, istu evidenciju i ista pravila. Svaki se aktivira prema sopstvenim preduslovima, ne u unapred određenom redosledu.

Modularnost je odluka dizajna. Sistem koji pokušava da uradi sve od prvog dana teško se testira, stabilizuje i prilagođava. Sistem koji počinje sa osnovom i dodaje module može da proveri da li osnova radi pre nego što je optereti, može da testira svaki modul zasebno i može da prilagodi redosled aktiviranja okolnostima.

Redosled modula u ovom poglavlju je logički, ne hronološki. Koji modul se aktivira prvi zavisi od potreba zajednice i odluke fondacije ili Gornjeg Kola.

## Modul 1: Krugovi

Krug je organizaciona jedinica sistema zasnovana na zajedničkom interesu ili delatnosti. Grupa korisnika — poznanika i istomišljenika — koji se udružuju oko konkretne aktivnosti, veštine, profesije ili oblasti radi zajedničkih aktivnosti u sistemu.

Krugovi nastaju odozdo — udruživanjem korisnika. Postojeća udruženja i zadruge registrovane po Zakonu o udruženjima i Zakonu o zadrugama mogu da prenesu svoju strukturu u krug koji preslikava njihov sastav i organizaciju, čime se postojeća organizaciona forma integriše u sistem bez potrebe za ponovnim organizovanjem.

Krugovi imaju podsticajnu funkciju kroz mehanizam rasta — protokol upisuje nove zapise POEN-a u skladu sa brojem članova kruga i dostizanjem definisanih pragova. POEN-i nastali ovim mehanizmom evidentiraju se u zapisu kruga kao organizacione jedinice, ne u zapisima pojedinačnih članova. Ovo je podsticaj za organsko širenje — krug raste kako se širi i njegov položaj u sistemu odražava taj rast.

Krug nema pravni subjektivitet. Krug nije pravno lice, ne može da sklapa ugovore, ne može da drži imovinu. Krug je organizaciona jedinica unutar sistema, ne institucija van njega. Udruženje ili zadruga koja formira krug zadržava svoj pravni subjektivitet nezavisno od kruga — krug je njihova forma unutar protokola, ne zamena za pravni status.

## Modul 2: Zadruge

Zadruga je lokalna organizaciona jedinica sistema zasnovana na teritorijalnom principu — po selu ili gradu u kom se nalazi. Zadruga je osnovna lokalna struktura kroz koju se sistem širi i ukorenjuje u konkretnim zajednicama.

Za razliku od kruga, koji je interesna grupa bez pravnog subjektiviteta, zadruga se registruje po Zakonu o zadrugama i ima pun pravni subjektivitet. To znači da zadruga ima osnivačku skupštinu, statut, registraciju u APR-u i sve obaveze koje Zakon o zadrugama propisuje (čl. 2–12). Zadruga unutar KOLO sistema nije metafora — to je pravno lice čiji zadrugari koriste protokol i učestvuju u sistemu sa svoje teritorije.

Odnos između fondacije i zadruge regulisan je ugovorom o saradnji, pri čemu zadruga zadržava punu autonomiju kao nezavisno pravno lice.

Zadruga ima dve funkcije unutar sistema. Prva je lokalna koordinacija i raspodela dobara na lokalitetu — zadruga je struktura kroz koju se odvija razmena, komunikacija i organizacija aktivnosti u naselju u kome deluje. Korisnici unutar zadruge lakše pronalaze jedni druge i lakše koordiniraju aktivnosti jer dele geografski kontekst. Zadruga prima dobro na raspodelu u ime i za račun zadrugara: korisniku koji je dobro doneo zadruga pri prijemu prepisuje POEN iz svog zapisa, a pri izdavanju dobra zadrugaru ili drugoj zadruzi POEN se prepisuje u zapis zadruge. Broj POEN-a za prijem i izdavanje određuje zadruga, svojim organima i po svojim pravilima — nikad fondacija. Druga je mehanizam rasta — dostizanje pragova broja zadrugara Protokol evidentira u POEN-ima u zapisu zadruge, po istom mehanizmu kao kod Modula 1; svaki prag se evidentira jednom.

Zadruga ne potvrđuje stvarnost korisnika. Stvarnost se potvrđuje samo u lancu potvrda (poglavlje 7), i zadruga u njemu nema posebnu ulogu.

Učešće zadruge u sistemu uređuje se Pravilnikom o zadrugama. Zadrugar je učesnik koga je zadruga primila u članstvo i čiji je nalog povezan sa zadrugom; lice može biti zadrugar samo u jednoj zadruzi. Zadrugar ima sva prava koja mu pripadaju po statusu i, uz njih, prava u okviru zadruge — učešće u raspodeli, u zadružnom doprinosu i u korišćenju opreme i zemljišta zadruge. Svojstvo zadrugara ne daje nijedno dodatno ovlašćenje u sistemu. Krug i zadruga su isti kolektivni oblik pod različitim imenom: krug čiji se članovi upišu kao zadruga nastavlja kao zadruga sa istim zapisom, a pragovi koje je dostigao kao krug ne evidentiraju se ponovo.

Pravna dimenzija: zadruga kao pravno lice registrovano po Zakonu o zadrugama ima sopstvene pravne obaveze — vođenje poslovnih knjiga, godišnje izveštavanje, poštovanje zadružnih principa. Ugovor o saradnji sa fondacijom definiše prava i obaveze obe strane u kontekstu KOLO sistema, uključujući pravila korišćenja protokola i mehanizme koordinacije. Fondacija nema pravo glasa, predlaganja ni saglasnosti u organima zadruge. Zadruga ne postaje vlasnik nijednog dela zajedničkog dobra — odnos zadruge prema zajedničkom dobru je participatoran, isti kao odnos svakog korisnika. Prestankom učešća zadruge u sistemu zapis zadruge se zatvara, a POEN evidentiran u njemu poništava se protivzapisom u korist Protokola.

## Modul 3: Socijalni programi

Socijalni programi su mehanizam automatske evidencije POEN-a za grupe korisnika čije strukturno učešće u zajedničkom dobru protokol prepoznaje iako se ne ispoljava kroz pojedinačne aktivnosti — generacijsko, solidarno ili strukturno. Automatsko evidentiranje novih POEN-a za kvalifikovane grupe ima redistribucioni efekat: novi zapisi uvećavaju ukupan broj evidentiranih POEN-a u sistemu, čime menjaju obračunski koeficijent za sve korisnike. Ovaj efekat je namerna dizajnerska odluka — sistem prepoznaje da učešće koje je po svojoj prirodi kontinuirano i difuzno ne može da se evidentira kroz pojedinačne aktivnosti, i da je redistribucioni trošak tog priznavanja kompromis koji sistem svesno prihvata zarad socijalne kohezije.

Početne kvalifikovane grupe su korisnici čiji doprinos zajedničkom dobru sistem prepoznaje kao kontinuiran. Roditeljstvo čini generacijski doprinos koji se po svojoj prirodi ne može evidentirati kroz pojedinačne aktivnosti. Stariji korisnici su doprinos zajednici dali tokom života — evidencija u POEN-ima je priznanje akumuliranog doprinosa. Osobe sa invaliditetom učestvuju u zajednici pod uslovima koji zahtevaju prilagođavanje, ne ocenu produktivnosti. Studenti ulažu u sopstveni razvoj koji se vraća zajednici — evidencija tokom studiranja je priznanje tog ulaganja. Nove grupe se mogu dodavati prema potrebama zajednice i odluci fondacije ili Gornjeg Kola.

Mehanika je sledeća: učesnik koji pripada kvalifikovanoj grupi unosi dodatne podatke koji potvrđuju taj status — status roditelja, starosnu dob, invaliditet, studentski status; ispunjenost uslova potvrđuje član Kola koji ga lično zna, a prijavu odobrava fondacija. Nakon odobrenja, protokol automatski upisuje nove zapise POEN-a za tog primaoca podrške svakodnevno, bez potrebe za konkretnom aktivnošću. Ovo je kategorija evidentiranja POEN-a pored donacija, dostizanja pragova, operativnog doprinosa, verifikacije i pokroviteljstva. Pravni osnov za automatsko evidentiranje zapisa POEN-a u socijalnim programima je odluka fondacije (u sadašnjoj fazi) ili Gornjeg Kola (u kasnijoj fazi) o pravilima protokola, donesena u okviru ostvarivanja opštekorisnih ciljeva fondacije.

Automatska evidencija u socijalnim programima nije naknada — njome se ne plaća nijedan rad, usluga ni druga činidba, niti se od primaoca podrške zauzvrat traži bilo šta prema fondaciji. Programi se sprovode u ostvarivanju ciljeva fondacije utvrđenih članom 6 Statuta, naročito socijalne zaštite i solidarne podrške ranjivim društvenim grupama, a primaocima podrške omogućavaju ravnopravnije učešće u sistemu.

Pravna dimenzija: socijalni programi zahtevaju verifikaciju posebnih kategorija ličnih podataka — zdravstveno stanje, invaliditet, porodični status, starosna dob, studentski status. Obrada ovih podataka podleže pojačanim zahtevima u skladu sa Zakonom o zaštiti podataka o ličnosti i GDPR-om. Pravni osnov obrade je izričit pristanak primaoca podrške. Pristanak se može povući u svakom trenutku, sa posledicom prestanka automatskog evidentiranja POEN-a. Mere zaštite i prava primalaca podrške u vezi sa posebnim kategorijama podataka opisani su u poglavlju 12.

## Modul 4: Deca

Ovaj modul definiše poseban režim prava, ograničenja i zaštite za maloletne korisnike sistema, sa dodatnim ograničenjima za lica mlađa od petnaest godina u skladu sa čl. 16 ZZPL-a.

Maloletni korisnik nema status korisnika, člana bez potvrde, člana Kola ni čuvara Kola; njegov položaj uređuje Pravilnik o učešću dece. Maloletno lice može samo otvoriti nalog, ali do saglasnosti roditelja ili zakonskog zastupnika nalog ostaje bez pristupa funkcijama sistema i bez evidentiranja doprinosa. Dete prolazi kroz tri stanja: dete na čekanju, čiji roditelj još nije preuzeo nalog; dete sa roditeljem, čiji je roditelj preuzeo nalog, ali nije član Kola (nego korisnik ili član bez potvrde) ili postojanje deteta još nije potvrđeno; i dete Kola, čiji je roditelj član Kola i čije je postojanje potvrđeno. Obim aktivnosti u svakom stanju, dozvoljeni obim razmene i ograničenja koja važe utvrđuje Pravilnik o učešću dece. Dete koje nije dete Kola ne učestvuje u prepisu POEN-a ni u jednom smeru, ni sa roditeljem. Postojanje deteta potvrđuje član Kola koji lično zna roditelja, a zahtev za potvrdu ne vide članovi bez potvrde; po toj potvrdi POEN se ne evidentira, ko lažno potvrdi odgovara kao za lažnu verifikaciju, a ako potvrda ne stigne, roditelju se ništa ne oduzima. Dete ne ulazi u lanac potvrda. Kad postane punoletno, verifikaciju mu automatski daje prvi roditelj, po redu povezivanja, koji je član Kola, i ta verifikacija je potvrda; ako nijedan roditelj nije član Kola, a neki je član bez potvrde, prvi takav roditelj ga uvodi u Kolo; ako nijedan roditelj nije u Kolu, punoletni korisnik nema drugi status osim korisnika. Maloletni korisnik ne može da upiše ZRNO niti da učestvuje u upravljanju kroz Gornje Kolo do navršenih 18 godina — ovo ograničenje štiti integritet Gornjeg Kola od pravnih komplikacija vezanih za poslovnu sposobnost maloletnih lica.

Pravna dimenzija: obrada podataka maloletnih lica podleže pojačanim zahtevima. Saglasnost roditelja ili zakonskog zastupnika je pravni preduslov za obradu. Posebne mere zaštite podataka maloletnih korisnika su deo pravila ovog modula i usklađuju se sa Zakonom o zaštiti podataka o ličnosti i GDPR-om. Zaštita maloletnih korisnika od zloupotrebe, neodgovarajućeg sadržaja i neprimerne interakcije je prioritet dizajna ovog modula.

## Modul 5: Internacionalizacija

Internacionalizacija je infrastrukturno širenje sistema na nove regije. KOLO se ne replicira — ne stvara kopije sistema sa odvojenom evidencijom. Sistem proširuje svoju infrastrukturu, evidenciju i pravila na nove teritorije, zadržavajući jedinstven protokol i jedinstvenu evidenciju zajedničkog dobra.

Širenje na nove regije zahteva prilagodbe u više dimenzija: pravni okvir ciljne jurisdikcije (posebno u pogledu zaštite podataka, poreskog tretmana i statusa fondacije), jezička lokalizacija platforme, uspostavljanje lokalnog lanca potvrda za dokaz stvarnosti i eventualno formiranje lokalnih zadruga (Modul 2) kao organizacionih jedinica na novoj teritoriji.

Preduslov za aktiviranje ovog modula je stabilan sistem sa aktivnim Gornjim Kolom, dovoljno iskustva sa funkcionisanjem sistema u osnovnoj regiji i pravna analiza za ciljne jurisdikcije. Odluku o širenju donosi Gornje Kolo.

Pravna dimenzija: platforma je u osnovnoj regiji namenjena licima koja žive u Republici Srbiji i primenjuje Zakon o zaštiti podataka o ličnosti; prevodi postoje radi nacionalnih manjina i stranaca koji žive u Srbiji. Širenje na teritoriju Evropske unije zahteva punu usklađenost sa GDPR-om, uključujući predstavnika u Uniji, i sa Aktom o digitalnim uslugama. Širenje na druge jurisdikcije zahteva analizu lokalnih propisa o zaštiti podataka, digitalnoj imovini, fondacijama i zadrugama. Međunarodni institucionalni okvir opisan u Prilogu A — posebno Akcioni plan EU za socijalnu ekonomiju i rezolucija UN-a A/RES/77/281 — pruža polazni okvir za pozicioniranje sistema u novim jurisdikcijama.

# 10. Upravljanje

Svaki sistem ima pravila. Neko ta pravila mora da postavi, neko ih mora menjati kad se okolnosti promene i neko mora da obezbedi da se primenjuju konzistentno. Pitanje upravljanja nije da li neko upravlja sistemom — nego ko, kako i pod kojim ograničenjima.

KOLO sistem rešava ovo pitanje progresivnom decentralizacijom — strukturiranom putanjom od centralizovanog ka decentralizovanom upravljanju sa merljivim uslovima prelaza (up. Walden, 2020). Upravljanje počinje centralizovano — kod osnivača i fondacije — i progresivno se prenosi na zajednicu kroz Gornje Kolo.

Decentralizovano upravljanje zahteva tri stvari koje na početku ne postoje: dovoljan broj korisnika da odluke budu reprezentativne, iskustvo sa sistemom da pravila budu testirana u praksi i dokazanu stabilnost osnove pre nego što se upravljanje prenese. Centralizovano upravljanje u osnivačkoj fazi je nužnost dizajna, ne ideološki izbor — svaki složeni sistem počinje sa malim brojem autora koji postavljaju osnovu pre nego što je predaju široj zajednici na upravljanje.

## Dve faze upravljanja

U prvoj fazi, pravila protokola postavlja osnivač u saradnji sa fondacijom. Osnivač ima diskreciju koju kasnije neće imati niko — može da menja pravila brzo i da prilagođava parametre na osnovu prvih iskustava. Ali ta diskrecija nije neograničena — osnivač ne može da promeni četiri principa iz poglavlja 4, ne može da promeni licence pod kojima je zajedničko dobro objavljeno i ne može da prisvoji zajedničko dobro. Ova ograničenja su ugrađena u pravilnik sistema kao normativni akt fondacije, a istovremeno u tehničku arhitekturu sistema — čime su zaštićena i pravno i tehnički. Prva faza traje do trenutka kada ukupan broj POEN-a evidentiranih u sistemu dostigne 1.000.000. U obračunskoj logici, protokol koji upisuje nove zapise POEN-a vodi negativno stanje — svaki novi zapis POEN-a smanjuje stanje protokola za jedan — tako da prag od milion evidentiranih POEN-a odgovara stanju protokola od −1.000.000.

U drugoj fazi, pravila protokola utvrđuju se na predlog Gornjeg Kola, koji Upravni odbor fondacije usvaja svojim aktom. Gornje Kolo nastaje automatski sa aktivacijom ZRNA. Nema zasebnog koraka aktivacije, nema dodatnih preduslova: milion POEN-a je prag koji istovremeno aktivira ZRNO i uspostavlja Gornje Kolo. Jedan prag, jedan prelaz. Gornje Kolo čine čuvari Kola koji su aktivirali ZRNO, uključujući osnivače: aktiviranjem ZRNO prelazi u glasačku moć, a slobodno ZRNO ne daje mesto u Gornjem Kolu. Čuvar Kola ulazi u sastav Gornjeg Kola aktiviranjem ZRNA, a izlazi iz njega kada mu nijedno ZRNO više nije aktivno, odnosno padom potvrde stvarnosti. Pošto se broj aktivnih ZRNA i glasačka moć stalno menjaju, sastav Gornjeg Kola i glasačka moć svakog čuvara Kola utvrđuju se iz evidencije protokola za svaki obračunski period posebno i važe samo tokom tog perioda. Glasanjem utvrđuje predloge o pravilima protokola, o aktiviranju i deaktiviranju modula i o svim pitanjima koja utiču na zajedničko dobro, osim pitanja koja su izuzeta iz njegove nadležnosti u skladu sa pravilnikom sistema. Vrste odluka, pragovi za donošenje odluka, kvorum i postupak glasanja utvrđuju se Pravilnikom o Gornjem Kolu. U pogledu raspoređivanja dinarskih sredstava, Gornje Kolo upućuje preporuke Upravnom odboru fondacije, koji ih razmatra i primenjuje u okviru svojih zakonskih ovlašćenja po Zakonu o zadužbinama i fondacijama — sa obavezom obrazloženog odgovora na svaku preporuku. Fondacija u ovoj fazi zadržava servisnu ulogu — drži infrastrukturu, zastupa sistem u pravnom prometu i sprovodi odluke Gornjeg Kola. Gornje Kolo je telo obrazovano pravilnikom fondacije i ne ubraja se u njene organe utvrđene statutom; odluku Gornjeg Kola usvaja i sprovodi Upravni odbor svojim aktom i pravilnikom se obavezuje da ga donese, a odbiti može samo ako je odluka suprotna zakonu ili statutu, ako zadire u pitanja izuzeta iz nadležnosti Gornjeg Kola ili ako je na snazi zaštitni veto — uvek uz obrazloženje koje se objavljuje i uz navod koji su članovi Upravnog odbora o toj odluci glasali u Gornjem Kolu. Gornje Kolo ne upravlja fondacijom. Time nadležnost ostaje tamo gde je zakon postavlja, a fondacija se sopstvenim aktom obavezuje da po odluci postupi. Fondacija zadržava i zaštitni veto na odluke Gornjeg Kola. Veto se gasi trajno i jednosmerno kada finansijska sredstva Fondacije dostignu prag finansijske samostalnosti utvrđen posebnim pravilnikom.

## Kvadratno glasanje i delegiranje

Gornje Kolo donosi odluke kvadratnim glasanjem (Posner i Weyl, 2018; Lalley i Weyl, 2018) — mehanizmom u kome je glasačka moć jednaka celobrojnoj vrednosti kvadratnog korena iz broja aktivnih ZRNA, zaokruženoj naniže. Slobodno ZRNO ne daje glasačku moć — čuvar Kola koji želi da glasa mora da aktivira ZRNO, čime odustaje od mogućnosti otpisa dok ga ne vrati u slobodno stanje (odeljak 6.2). ZRNO se ne troši glasanjem.

Ovaj mehanizam adresira dva problema klasičnog glasanja: problem većine i problem plutokratije. Kvadratni koren obezbeđuje da glasačka moć raste sporije od broja aktivnih ZRNA — čuvar Kola sa 100 aktivnih ZRNA ima 10 glasova, ne 100 — čime se sprečava koncentracija upravljačke moći. Glasačka moć proizlazi iz aktiviranog ZRNA, ne iz broja POEN-a i ne iz dinarskih donacija.

Čuvari Kola koji ne žele ili ne mogu da učestvuju u svakom glasanju mogu da delegiraju svoje glasove drugom čuvaru Kola (up. Ford, 2002; Blum i Zuber, 2016). Delegiraju se glasovi, ne ZRNO — delegator zadržava ZRNO u svojoj evidenciji i može da povuče delegiranje u svakom trenutku. Delegiranje je opšte — delegat glasa u ime delegatora na sva pitanja dok delegiranje traje. Delegirani glasovi sabiraju se sa sopstvenim glasovima delegata bez ponovne primene kvadratnog korena — delegat koji ima 4 sopstvena glasa (√16 aktivnih ZRNA) i primi 3 delegirana glasa glasa sa ukupno 7 glasova, ne sa √49. Delegiranje adresira problem participacije — obezbeđuje da glasačka moć neaktivnih čuvara Kola bude zastupljena umesto da propada. Neprenosivost ZRNA ostaje potpuna. Pravila delegiranja, uključujući efekte opoziva i ograničenja delegiranja, utvrđuju se Pravilnikom o Gornjem Kolu.

## Zaštitne mere

Gornje Kolo nema neograničenu moć. Tri ograničenja su ugrađena u dizajn sistema.

Prvo ograničenje su četiri principa sistema (poglavlje 4). Nijedna odluka Gornjeg Kola ne može da ukine nekonvertibilnost, da uvede imovinsko pravo nad zapisima, da učini donacije povratnim ili da napusti princip minimizacije podataka. Ovi principi su iznad upravljačke moći Gornjeg Kola jer njihovo ukidanje bi promenilo pravnu prirodu sistema — KOLO bez ovih principa prestaje da bude participatorni sistem zajedničkog dobra i potpada pod regulatorne okvire namenjene finansijskim instrumentima, platnim servisima ili investicionim šemama.

Drugo ograničenje je zaštitni veto fondacije — pravo da odbije izvršenje odluke koja bi ugrozila operativnu i finansijsku održivost fondacije pre nego što ona dostigne finansijsku samostalnost, naročito odluke o trošenju dinarskih sredstava koje bi narušile sposobnost fondacije da pokriva osnovne troškove i održava infrastrukturu sistema. Veto nije diskrecioni — fondacija mora da obrazloži svaki veto pozivanjem na konkretnu pretnju održivosti, a veto bez obrazloženja je zloupotreba koja podleže odgovornosti u skladu sa pravilnikom sistema. Četiri principa, licence zajedničkog dobra i zakonske obaveze Upravnog odbora ostaju zaštićeni nezavisno od veta. Zaštitni veto se gasi trajno i jednosmerno kada finansijska sredstva Fondacije dostignu prag finansijske samostalnosti utvrđen posebnim pravilnikom. Gašenje veta je nepovratno jer je svaki mehanizam koji bi omogućio vraćanje veta istovremeno mehanizam koji bi fondaciji davao mogućnost da ponovo centralizuje upravljanje. Gašenje veta je u interesu fondacije jer prag finansijske samostalnosti označava trenutak u kome fondacija ima dovoljno sredstava za pokretanje programskih aktivnosti koje značajno uvećavaju korisnost sistema za sve korisnike i time jačaju operativnu održivost sistema. Gašenje veta ne ukida zakonske obaveze Upravnog odbora — UO ostaje pravno odgovoran po Zakonu o zadužbinama i fondacijama i ne može da izvrši odluku koja bi kršila važeći zakon, bez obzira na to da li zaštitni veto postoji.

Treće ograničenje su licence (poglavlje 3). Gornje Kolo ne može da zameni AGPL-3.0 i CC BY-SA 4.0 restriktivnijim licencama.

U slučaju prestanka fondacije, zajedničko dobro ne prestaje da postoji — softver i sadržaj ostaju dostupni po uslovima licenci, a evidencija i infrastruktura se prenose na pravnog sledbenika koji prihvata četiri principa sistema i preuzima obavezu čuvanja zajedničkog dobra. Pravila prenosa utvrđuju se Statutom i posebnim aktom Fondacije.

## Šta upravljanje nije

Upravljanje KOLO sistemom nije upravljanje kompanijom. Nema akcionara, nema dividendi, nema odbora direktora koji maksimizuje vrednost za vlasnike.

Upravljanje KOLO sistemom nije upravljanje državom. Nema teritorije, nema prinude, nema monopola na silu. Učešće je dobrovoljno. Korisnik koji se ne slaže sa odlukama Gornjeg Kola zadržava pravo izlaska iz sistema (up. Hirschman, 1970) — u tom slučaju, njegova prava u vezi sa evidencijom ostvaruju se u skladu sa poglavljem 12 (Zaštita podataka).

Upravljanje KOLO sistemom je upravljanje zajedničkim dobrom. Čuvari Kola koji su aktivirali ZRNO — članovi Kola koji imaju evidentiran doprinos i evidentiran položaj — odlučuju o pravilima sistema koji je kolektivno dobro svih korisnika. Njihov odnos prema sistemu je participatoran: pravo korišćenja, doprinosa i učešća u upravljanju, ne pravo raspolaganja. Progresivna decentralizacija obezbeđuje da to upravljačko pravo preuzmu kad su spremni da ga odgovorno koriste.

# 11. Teorija igara i podsticaji

Prethodna poglavlja opisuju šta sistem jeste i kako funkcioniše. Ovo poglavlje analizira zašto funkcioniše — šta motiviše svakog korisnika da učestvuje, zašto je saradnja strukturno povoljnija od zloupotrebe i koji mehanizmi obeshrabruju ponašanje koje bi narušilo integritet sistema. Analiza se oslanja na koncepte iz teorije dizajna mehanizama (mechanism design; Hurwicz, 1960, 1973; Myerson, 1981; Maskin, 1999), upravljanja zajedničkim dobrima (Ostrom, 1990), logike kolektivne akcije (Olson, 1965) i evolucije saradnje u iterativnim interakcijama (Axelrod, 1984).

Ova analiza nije obećanje. Sistem ne garantuje da će svaki korisnik imati korist, ne garantuje da zloupotreba nikad neće biti pokušana i ne garantuje da će svi podsticaji funkcionisati kako je predviđeno. Ova analiza opisuje strukturne podsticaje koji su ugrađeni u dizajn sistema i objašnjava zašto je, na osnovu tih podsticaja, racionalno očekivati da sistem funkcioniše — ali i gde postoje tenzije koje sistem prepoznaje i kojima upravlja. U terminologiji teorije dizajna mehanizama, pitanje je da li je KOLO podsticajno usklađen (incentive-compatible) — da li su pravila sistema dizajnirana tako da racionalno ponašanje svakog korisnika dovodi do poželjnog kolektivnog ishoda (Hurwicz, 1973). Odgovor nije jednostavno „da” — različite aktivnosti u sistemu imaju različite podsticajne profile, a jedno strukturno pitanje — odnos između akumulacije i cirkulacije — zahteva posebnu analizu.

## Podsticaji korisnika sistema

Korisnik sistema ima neposrednu korist od učešća — razmenjuje dobra i usluge sa drugim korisnicima. Što je više korisnika u sistemu, veća je verovatnoća da korisnik pronađe ono što traži i da neko traži ono što on nudi. Ovo je pozitivan mrežni efekat (Katz i Shapiro, 1985) — korisnost sistema za svakog pojedinačnog korisnika raste sa brojem korisnika, čime se smanjuje problem dvostruke koincidencije potreba koji ograničava neposrednu razmenu (Jevons, 1875).

Korisnik sistema ima i drugu motivaciju. Aktivnosti koje predstavljaju doprinos korisnika — donacije, pokroviteljstvo, operativni doprinos i verifikacija korisnika — vode do akumulacije evidencije POEN-a u zapisu korisnika. Akumulirana evidencija POEN-a je preduslov za upis ZRNA — učesnik koji aktivno doprinosi sistemu progresivno se približava pragu na kome može da upiše ZRNO i time stekne pravo učešća u upravljanju i poziciju u obračunskom sistemu (odeljak 6.2).

Ova dva podsticaja — neposredna korist od razmene i dugoročna pozicija kroz akumulaciju — nisu uvek usklađena. Razmena dobara i usluga redistribuira postojeće POEN-e između korisnika (zero-sum, odeljak 6.1) — korisnik koji daje dobro ili uslugu smanjuje sopstveni broj evidentiranih POEN-a, čime smanjuje i sopstvenu sposobnost da upiše ZRNO. Aktivnosti kroz koje nastaju novi POEN-i — donacije, pokroviteljstvo, verifikacija, operativni doprinos — uvećavaju broj evidentiranih POEN-a korisnika bez toga da ga drugi gube. Racionalan korisnik koji želi da maksimizuje sopstvenu poziciju za upis ZRNA ima strukturni podsticaj da favorizuje aktivnosti kroz koje nastaju novi POEN-i nad razmenom koja ih redistribuira. Ova tenzija između akumulacije i cirkulacije — analogna problemu koji literatura o komplementarnim valutama identifikuje kao centralnu dizajnersku dilemu (Gesell, 1916; Lietaer, 2001; Greco, 2009) — zaslužuje posebnu analizu i data je u odeljku „Tenzija između akumulacije i cirkulacije” u nastavku ovog poglavlja.

U ranoj fazi sistema sa malim brojem korisnika, neposredna korist od razmene može biti ograničena. Ovo je klasičan problem pokretanja (cold-start problem) — sistem ima vrednost tek kad ima dovoljno korisnika, ali korisnici nemaju razlog da se pridruže dok sistem nema vrednost. KOLO adresira ovaj problem na dva načina. Prvo, prvi korisnici dolaze iz postojećih socijalnih mreža — kroz lanac potvrda u kome članovi Kola dovode ljude koje lično poznaju, čime se obezbeđuje da rana zajednica ima prethodno uspostavljene odnose poverenja i realne mogućnosti razmene. Drugo, doprinos evidentiran od prvog dana ostaje u evidenciji i kad sistem naraste — rani korisnici imaju poziciju koja odražava njihov doprinos u fazi uspostavljanja sistema. To je položaj u evidenciji, ne vrednost zapisa: POEN nema spoljnu vrednost, a obračunski koeficijent može i da padne (odeljak 6.3). Sistem ne obećava nikakav prinos.

Dovođenje novih korisnika kroz lanac potvrda nema elemente šeme u kojoj se korist stiče uvođenjem drugih. Za ulazak u sistem i za bilo koji status ništa se ne plaća. Iz sistema se ništa ne isplaćuje: POEN se ne može konvertovati u novac. Verifikator i verifikovani evidentiraju po 1.000 POEN-a jednom po osobi i isti iznos za obe strane, i to tek kad verifikovani sam ostvari prvi doprinos; iznos ne raste sa brojem uvedenih, ne prenosi se naviše kroz lanac i onaj ko je verifikovao verifikatora po tom osnovu ne evidentira ništa. Korist korisnika potiče iz razmene i sopstvenog doprinosa, a ne iz broja ljudi koje je uveo.

Ova struktura adresira problem besplatnog jahanja (free-rider problem) koji Olson (1965) identifikuje kao centralnu prepreku kolektivnoj akciji — ali samo na nivou aktivnosti kroz koje nastaju novi POEN-i: korisnik koji donira, verifikuje ili obavlja operativne zadatke istovremeno doprinosi zajedničkom dobru i gradi sopstvenu poziciju. Na nivou razmene, odnos je drugačiji — korisnik koji razmenjuje doprinosi zajedničkom dobru (uvećava obim aktivnosti i čini sistem korisnijim za sve ostale korisnike), ali u istom činu umanjuje sopstveni broj evidentiranih POEN-a. Na nivou finansiranja infrastrukture, problem besplatnog jahanja ostaje — korisnik koji ne donira koristi infrastrukturu koju finansiraju donatori. Ovo je strukturna asimetrija koju sistem ne eliminiše, već ublažava: struktura podsticaja za donatore, opisana u nastavku ovog poglavlja, obezbeđuje da doniranje bude racionalno za korisnike koji aktivno koriste sistem, ali ne primorava nikog da donira.

## Podsticaji verifikatora

Verifikator je član Kola, osnivač ili član bez potvrde koji utvrđuje stvarnost korisnika — potvrdom ili uvođenjem u Kolo, na osnovu ličnog poznavanja ili razgovora posle poziva (poglavlje 7). Verifikator ima dva podsticaja.

Prvi je evidencija doprinosa. Protokol beleži čin verifikacije kao doprinos zajedničkom dobru — po verifikaciji se verifikatoru i verifikovanom evidentira isti, fiksan iznos POEN-a, jednom po verifikovanom licu, i to tek kada verifikovani ostvari prvi potvrđen doprinos. Čin verifikacije je doprinos integritetu sistema jer obezbeđuje da iza zapisa u evidenciji stoji stvarna osoba.

Drugi je širenje mreže. Verifikator koji dovede novog korisnika u sistem širi mrežu razmene koja je korisna i njemu — više potencijalnih partnera za razmenu. Ovaj podsticaj je usklađen sa kolektivnim interesom jer je rast mreže koristan za sve korisnike.

Verifikator ima i strukturno ograničenje — stavlja sopstvenu poziciju u sistemu kao ulog za tačnost verifikacije. Posledice lažne verifikacije obezbeđuju da trošak lažne verifikacije bude veći od koristi od nje: lažna verifikacija se poništava zajedno sa zapisima POEN-a nastalim po njoj, a ono što je na osnovu nje izvučeno iz mreže pada na verifikatora kao nadoknada, koja njegov zapis može oboriti u negativnu vrednost i nije ograničena gornjim iznosom (čl. 20b Pravilnika o dokazu stvarnosti); pored toga, utvrđena lažna verifikacija po pravilu je razlog za isključenje verifikatora, a Fondacija može izreći i suspenziju, po postupku iz Uslova korišćenja i uz pravo na prigovor (čl. 21 Pravilnika o dokazu stvarnosti). Verifikator koji lažno potvrdi rizikuje sopstveni zapis POEN-a i položaj u sistemu. Ova struktura čini da je racionalan izbor verifikatora da potvrdi samo osobe čiju stvarnost zaista poznaje — korist od jedne lažne verifikacije (POEN-i za verifikaciju) je nesrazmerno manja od potencijalnog gubitka (celokupna pozicija u sistemu).

## Podsticaji čuvara Kola

Čuvar Kola ima sve podsticaje korisnika sistema, plus dva dodatna: učešće u upravljanju kroz Gornje Kolo i položaj u evidenciji koji beleži njegov doprinos (poglavlja 6 i 10). Oba su usklađena sa kolektivnim interesom — čuvar Kola i sam u sistemu razmenjuje, pa ima interes da sistem bude dobro vođen. Korist i ograničenja te pozicije kvalifikovani su u odeljku 6.2.

Čuvar Kola ima i mogućnost otpisa — vraćanja slobodnog ZRNA u fond raspoloživih uz evidenciju POEN-a po tekućem obračunskom koeficijentu (odeljak 6.2). Ta mogućnost nije podsticaj: razlika prema broju POEN-a utrošenom pri upisu nastaje u oba smera, nijedno lice je ne obećava, a sopstveni upis i otpis koeficijent ne pomeraju (odeljak 6.3). Eventualna korist je uz to ograničena na interni kapacitet razmene, jer POEN-i ne mogu da napuste sistem. Istovremeno, strukturni izbor između upravljačke funkcije (aktivno ZRNO) i obračunske fleksibilnosti (slobodno ZRNO) sprečava istovremenu realizaciju obe koristi.

Na individualnom nivou, čuvar Kola ima podsticaj da drugi razmenjuju i doprinose, dok sam favorizuje aktivnosti kroz koje nastaju novi POEN-i nad razmenom koja mu smanjuje broj evidentiranih POEN-a. Ova asimetrija je strukturna osobina koja proizlazi iz tenzije između akumulacije i cirkulacije opisane u nastavku ovog poglavlja. Čuvar Kola ne može da ostvari korist od položaja na račun ostalih korisnika u smislu ekstrakcije vrednosti iz sistema — ZRNO se ne može preneti, ne može prodati i ne može unovčiti.

## Podsticaji donatora

Donator daje dinarska sredstva fondaciji nepovratno (poglavlje 4). Neposredan podsticaj je isti kao kod svakog korisnika — koristi sistem i ima korist od njegovog funkcionisanja. Donacija finansira infrastrukturu koja održava sistem koji donator koristi, po logici koja odgovara modelu klubskih dobara (Buchanan, 1965). Razlika u odnosu na klasična klubska dobra je u mehanizmu isključivanja — KOLO ne isključuje korisnike koji ne doniraju iz korišćenja sistema, ali donator stiče evidenciju doprinosa koja ga može približiti pragu za upis ZRNA, dok korisnik koji ne donira taj prag ispunjava isključivo drugim aktivnostima.

U kontekstu tenzije između akumulacije i cirkulacije, donacija ima posebnu podsticajnu osobinu: jedina je aktivnost u sistemu kroz koju za korisnika nastaju novi POEN-i, a istovremeno se finansira infrastruktura zajedničkog dobra. Struktura nepovratnosti funkcioniše kao mehanizam selekcije — privlači korisnike koji su motivisani korišćenjem sistema, ne one koji traže investiciju — doniranje je racionalno samo za korisnike koji zaista koriste sistem i imaju korist od njegovog funkcionisanja (Hurwicz, 1973).

## Položaj pokrovitelja

Pokrovitelj je pravno lice, preduzetnik ili nosilac registrovanog poljoprivrednog gazdinstva koji donira novac Fondaciji ili se obavezuje da dobra i usluge daje licima koja Fondacija odredi (odeljak 8.2). Pokroviteljstvo je javna evidencija — fondacija vodi i objavljuje evidenciju o pokroviteljima kao deo transparentnosti sistema, ne kao uslugu reklamiranja; evidencija sadrži naziv i logotip pokrovitelja i pored njih ne prikazuje ništa drugo, a pokrovitelj ne stiče pravo na promociju ni drugu protivčinidbu. Doprinos se evidentira u zapisu korisnika koji je prijavu podneo, po istoj tabeli kao lična donacija, i nastaje samo ako zajednica primi stvarna sredstva ili ako davalac preuzme obavezu za koju odgovara otpisom.

## Tenzija između akumulacije i cirkulacije

Svaki sistem koji koristi internu obračunsku jedinicu za evidenciju doprinosa suočava se sa fundamentalnim pitanjem: da li podsticajna struktura favorizuje cirkulaciju (razmenu između korisnika) ili akumulaciju (držanje zapisa radi pozicioniranja). Silvio Gesell je početkom dvadesetog veka identifikovao akumulaciju — hoardovanje — kao centralnu prepreku cirkulaciji u sistemima razmene i predložio demurrage (trošak držanja) kao rešenje (Gesell, 1916). LETS sistemi, vremenske banke i lokalne valute suočavaju se sa istim problemom u različitim varijantama — nedovoljna cirkulacija je jedan od empirijski dokumentovanih razloga zašto mnogi komplementarni sistemi ostaju mali ili zamiru (Seyfang, 2006; North, 2007).

KOLO sistem ima ovu tenziju ugrađenu u svoju podsticajnu strukturu i prepoznaje je kao dizajnerski izbor, ne kao nedostatak. Struktura podsticaja je sledeća.

Aktivnosti koje predstavljaju doprinos korisnika — donacije fondaciji, pokroviteljstvo, operativni doprinos i verifikacija korisnika — uvećavaju stanje korisnika i istovremeno doprinose zajedničkom dobru. Za ove aktivnosti, individualni i kolektivni podsticaj su usklađeni: korisnik gradi sopstvenu poziciju i doprinosi sistemu istovremeno.

Razmena dobara i usluga — deklarisana kao centralna aktivnost sistema — redistribuira postojeće POEN-e između korisnika (zero-sum). Korisnik koji daje dobro ili uslugu smanjuje sopstveni broj evidentiranih POEN-a. Za korisnika koji teži upisu ZRNA (minimum 20.000 POEN-a, odeljak 6.2), svaka razmena u kojoj daje više nego što prima odlaže trenutak dostizanja praga. Racionalan korisnik koji maksimizuje sopstvenu poziciju za upis ZRNA ima podsticaj da favorizuje donacije i verifikaciju nad razmenom.

Ova tenzija je svestan dizajnerski izbor sa tri obrazloženja.

Prvo, neposredna korist od razmene postoji nezavisno od evidencije POEN-a. Korisnik koji razmeni sat svog rada za sat tuđeg rada dobio je nešto što mu je potrebno — taj rezultat ima vrednost bez obzira na promenu stanja POEN-a. POEN-i evidentiraju da se razmena dogodila, ali korist od razmene nije u POEN-ima nego u dobru ili usluzi koju je korisnik primio. Korisnik ne razmenjuje zato što želi POEN-e — razmenjuje zato što želi ono što drugi korisnik nudi. Evidencija POEN-a je posledica razmene, ne njen cilj.

Drugo, sistem koji bi nagrađivao cirkulaciju — na primer, upisom bonus POEN-a za svaku razmenu — otvorio bi prostor za lažnu razmenu: dva korisnika bi mogla da razmenjuju napred-nazad bez stvarne razmene dobara ili usluga, samo da bi ostvarila bonuse. Zero-sum priroda razmene je strukturna zaštita od ove vrste manipulacije — kad razmena ne uvećava ukupan broj POEN-a, lažna razmena nema koristi za manipulatora. Sistem svesno bira zaštitu od manipulacije nad podsticanjem cirkulacije.

Treće, tok novca u fond fondacije — koji se zatim troši na infrastrukturu i programe — je za operativnu održivost sistema važniji od cirkulacije POEN-a unutar obračunskog okvira. Podsticajna struktura koja favorizuje donacije nad razmenom usklađuje individualno ponašanje sa operativnom potrebom sistema: korisnik koji donira finansira infrastrukturu koju svi koriste, dok korisnik koji samo razmenjuje koristi infrastrukturu bez doprinosa njenom održavanju.

Ovaj dizajnerski izbor ima posledice koje sistem prepoznaje. Korisnici koji imaju više resursa za doniranje mogu brže da dostignu prag za upis ZRNA od korisnika koji doprinose isključivo razmenom. Ovo nije strukturna nepravda — donacija nije privilegovan put do ZRNA, svi putevi koriste isti prag — ali jeste asimetrija u brzini dostizanja tog praga. Sistem ublažava ovu asimetriju na dva načina: kroz operativni doprinos i verifikaciju nastaju novi POEN-i bez dinarskog troška, čime korisnici bez resursa za doniranje mogu da grade poziciju doprinosom vremena i aktivnosti; kroz socijalne programe (Modul 3, poglavlje 9) automatski nastaju novi POEN-i za kvalifikovane grupe korisnika čiji je doprinos zajedničkom dobru indirektan. Ni jedan od ovih mehanizama ne eliminiše asimetriju potpuno — korisnik koji donira i razmenjuje i verifikuje gradi poziciju brže od korisnika koji samo razmenjuje. Pitanje da li je ova asimetrija prihvatljiva ili zahteva korekciju ostaje otvoreno i rešava se kroz procese upravljanja opisane u poglavlju 10 — parametri koji utiču na odnos između akumulacije i cirkulacije su upravo vrsta pitanja o kojima Gornje Kolo odlučuje na osnovu empirijskog iskustva sa funkcionisanjem sistema.

## Zašto je saradnja strukturno povoljnija od zloupotrebe

Svaki sistem sa evidencijom i obračunom privlači pokušaje zloupotrebe. Ostrom (1990) identifikuje mehanizme praćenja i graduirane sankcije kao ključne dizajn principe za zaštitu zajedničkih dobara. KOLO sistem ima nekoliko strukturnih osobina koje čine zloupotrebu skupljom od saradnje.

Dokaz stvarnosti kao barijera. Kreiranje lažnog profila u KOLO sistemu zahteva da verifikator — član Kola ili član bez potvrde — verifikuje lažnu osobu, čime stavlja sopstvenu poziciju u sistemu kao ulog — graduirane sankcije uključuju zabranu verifikacije, oduzimanje prava na ZRNO i ukidanje naloga. Trošak napada nije falsifikovanje dokumenta, već korupcija stvarne osobe u mreži poverenja, što je nesrazmerno skuplje i rizičnije od kreiranja anonimnog naloga na klasičnoj internet platformi. Zapis POEN-a po verifikaciji nastaje tek kad lažni nalog prođe ljudsku odluku o prvom doprinosu, pa sama lažna verifikacija ne donosi ništa. Ova analiza važi za sistem u kome je graf verifikacija dovoljno gust da korupcija jednog čvora nema sistemski efekat. Kako sistem raste — naročito geografski, van regije gde postoji gusta mreža poznanstava — rizik od koordiniranih lažnih potvrda raste, a težina nadzora čuvara Kola u novim sredinama sa njim. Otvorena pitanja skaliranja dokaza stvarnosti navedena su u poglavlju 13.

Evidencija kao trag. Svaka aktivnost u sistemu se evidentira. Svaka razmena ima dva korisnika. Svaki doprinos ima zapis. Lažna evidencija — dva korisnika koji lažno razmenjuju da bi redistribuirali POEN-e bez stvarne razmene dobara ili usluga — ostavlja trag koji se razlikuje od legitimne aktivnosti po obrascima: razmena uvek između istih korisnika, u istim iznosima, u pravilnim intervalima. S obzirom da razmena ne uvećava ukupan broj POEN-a u sistemu (zero-sum, odeljak 6.1), korist od lažne razmene je ograničena na preraspodelu postojećih zapisa — što znači da jedan od dva korisnika gubi POEN-e da bi ih drugi dobio. Lažna razmena zato zahteva dogovor dva korisnika od kojih jedan pristaje na gubitak, što smanjuje krug mogućih zloupotreba na koordinirane parove sa eksternim motivom.

Ograničenje upisa ZRNA. Maksimum jedan procenat stanja po obračunskom periodu (odeljak 6.2) znači da čak i korisnik sa velikom evidencijom POEN-a ne može da preuzme značajan deo raspoloživih ZRNA naglo. Akumuliranje pozicije u sistemu je postepen proces koji zahteva vreme, čime se smanjuje korist od manipulacije i povećava verovatnoća detekcije pre nego što manipulacija postigne značajan efekat.

Neprenosivost ZRNA. ZRNO se ne može preneti drugom korisniku (odeljak 6.2). Ovo eliminiše celu kategoriju zloupotreba — nema mogućnosti da neko akumulira ZRNO i otuđi ga drugom licu, nema mogućnosti da se upravljačka moć koncentriše prikupljanjem ZRNA, nema mogućnosti da se pozicija u sistemu monetizuje van sistema.

Nekonvertibilnost POEN-a (poglavlje 4) znači da lažna evidencija nema eksternu vrednost. Korisnik koji manipuliše evidencijom može da akumulira POEN-e, ali ne može da ih iznese iz sistema. POEN-i imaju intrasistematsku vrednost — služe za razmenu sa drugim korisnicima unutar sistema — ali ta vrednost je strukturno ograničena na ono što drugi korisnici nude, i korisnik koji podriva integritet sistema istovremeno umanjuje vrednost sopstvene evidencije za sve ostale korisnike. U terminologiji teorije igara, manipulacija evidencije je dominirana strategija — za svaki scenario u kome bi korisnik mogao da manipuliše, legitimno učešće daje jednaku ili veću korist bez rizika od sankcija.

Nekonvertibilnost ne eliminiše mogućnost da korisnici unutar sistema razmenjuju dobra i usluge koje imaju vrednost u spoljnoj ekonomiji — niti je to cilj. Dva korisnika koji razmene sat rada, kilogram meda ili popravku krova kroz sistem obavljaju legitimnu internu razmenu, bez obzira na to što ta dobra i usluge imaju tržišnu vrednost izraženu u dinarima. Protokol evidentira razmenu ažuriranjem zapisa oba korisnika — to je osnovna funkcija sistema opisana u odeljku 6.1. Nekonvertibilnost znači da ne postoji mehanizam kroz koji bi korisnik mogao da iznese POEN-e iz sistema i zameni ih za dinare — ne da dobra i usluge koje se razmenjuju unutar sistema nemaju vrednost van njega. Razlika je u tome gde se vrednost realizuje: korisnik koji primi uslugu ima korist od te usluge, ali POEN-i kojima je razmena evidentirana nemaju sopstvenu eksternu vrednost i ne mogu da napuste sistem.

Transparentnost. Pravila protokola su javna. Evidencija je dostupna korisnicima sistema u pseudonimnom obliku (poglavlje 12). Odluke su obrazložene. U okruženju gde su pravila i evidencija dostupni svim korisnicima, zloupotreba zahteva da svi ostali korisnici ne primete neregularne obrasce — što je sve teže što sistem raste.

Pored strukturnih osobina opisanih u ovom odeljku, sistem ima i aktivne mehanizme zaštite — detekciju anomalija u grafu verifikacija, prijavu razmene i prijavu oglasa, verifikaciju izvršenja operativnih zadataka od strane čuvara Kola i mere protiv koordiniranog delovanja povezanih lica. Konkretni mehanizmi, pravila detekcije i procedure postupanja definisani su u Pravilniku o KOLO sistemu i Pravilniku o dokazu stvarnosti.

## Ravnoteža sistema

Podsticaji u KOLO sistemu su dizajnirani sa ciljem da legitimno učešće bude strukturno povoljniji izbor za svakog korisnika od zloupotrebe ili neparticipacije. U terminologiji teorije dizajna mehanizama, cilj je da legitimno učešće teži ka Nešovom ekvilibrijumu (Nash equilibrium) — stanju u kome nijedan korisnik nema podsticaj da jednostrano promeni strategiju (Nash, 1950). Ova tvrdnja je dizajnerska namera zasnovana na analizi strukturnih podsticaja opisanih u ovom poglavlju — formalna verifikacija zahteva empirijsku analizu ponašanja korisnika nakon početka rada sistema, uključujući zbirne podatke o razmeni, stope zloupotreba i efikasnosti anti-fraud mehanizama.

Korisnik koji legitimno koristi sistem ima neposrednu korist od razmene i moguću dugoročnu korist od akumulirane evidencije. Korisnik koji pokušava da zloupotrebi sistem ulaže napor u manipulaciju čija je eksterna vrednost nula (nekonvertibilnost), čija je intrasistematska vrednost ograničena (zero-sum razmena) i čiji je rizik od detekcije proporcionalan obimu manipulacije (transparentnost evidencije). Donator koji donira sredstva fondaciji finansira infrastrukturu koju koristi, pod uslovima koji su strukturno racionalni samo za korisnike koji zaista koriste sistem — ne za one koji očekuju finansijski povraćaj. Pokrovitelj koji daje realne resurse dobija javnu evidenciju doprinosa u sistemu čija korist zavisi od funkcionisanja sistema.

Podsticajna usklađenost u KOLO sistemu nije uniformna kroz sve aktivnosti. Aktivnosti kroz koje nastaju novi POEN-i — donacije, verifikacija, operativni doprinos — imaju visok stepen usklađenosti individualnog i kolektivnog interesa: korisnik gradi poziciju i doprinosi sistemu istovremeno. Razmena — centralna aktivnost sistema — ima nižu podsticajnu usklađenost: korisnik dobija neposrednu korist (dobro ili uslugu), ali u istom činu umanjuje sopstveni broj evidentiranih POEN-a, što usporava dostizanje praga za upis ZRNA. Sistem prihvata ovu tenziju jer neposredna korist od razmene — mogućnost da dobiješ ono što ti treba od drugog korisnika — postoji nezavisno od evidencije POEN-a i ne zahteva dodatni podsticaj da bi bila korisna. Pitanje da li ovaj dizajnerski izbor proizvodi dovoljnu cirkulaciju u praksi je empirijsko pitanje koje će se rešavati merenjem zbirnog stanja sistema i po potrebi prilagođavanjem parametara sistema kroz procese upravljanja opisane u poglavlju 10.

Sistem nije imun na zloupotrebu. Nijedan sistem nije. Ali sistem u kome je zloupotreba skupa (dokaz stvarnosti, graduirane sankcije), detektabilna (transparentnost evidencije, prijava razmene i prijava oglasa) i strukturno ograničene koristi (nekonvertibilnost, neprenosivost) ima bolje strukturne izglede od sistema koji se oslanja na dobru volju korisnika — problem koji Olson (1965) identifikuje kao centralnu ranjivost sistema kolektivne akcije, a koji Ostrom (1990) rešava upravo kombinacijom jasnih pravila, mehanizama praćenja i graduiranih sankcija.

# 12. Zaštita podataka

KOLO sistem po svojoj prirodi obrađuje lične podatke — graf verifikacija, evidenciju doprinosa, podatke o donacijama i, u kontekstu socijalnih programa i modula za decu, posebne kategorije podataka. Pristup zaštiti podataka je zasnovan na zaštiti po dizajnu i po podrazumevanoj vrednosti (čl. 50 ZZPL-a). Sistem primenjuje Zakon o zaštiti podataka o ličnosti (ZZPL; Sl. glasnik RS, br. 87/2018) i, u meri u kojoj je primenljiv, Opštu uredbu o zaštiti podataka Evropske unije (GDPR; Uredba (EU) 2016/679).

## Tri dizajnerske odluke

Prva je pseudonimnost evidencije. Zapisi u evidenciji su vezani za pseudonime, ne za lična imena. Ime i prezime korisnika vodi se samo u evidenciji identiteta, odvojeno od evidencije doprinosa, i upisuje se samo u pet slučajeva: pri prijavi gazdinstva i pristupanju gazdinstvu, pri javnoj donaciji, pri sticanju svojstva zadrugara, pri potvrdi prijema pokroviteljstva, za zastupnika koji je prijavu podneo, i pri ulasku na spisak za poziv, kada ga upisuje sam korisnik (Pravilnik o KOLO sistemu, čl. 31a). Ne prikazuje se drugim korisnicima, osim članu Kola koji korisnika sa spiska za poziv poziva radi upoznavanja, i to samo dok je poziv otvoren (poglavlje 7), i ne ulazi u zapise POEN-a. Pseudonimnost nije anonimnost (up. ZZPL čl. 4 st. 1 t. 3a) — pseudonimizovani podaci ostaju lični podaci u smislu ZZPL-a jer se, uz dodatne informacije, mogu povezati sa identifikovanom osobom. Rizik od reidentifikacije je proporcionalan gustini grafa i broju verifikacija.

Druga je razdvajanje podataka. Fondacija ne čuva lične podatke korisnika platforme — svi podaci korisnika čuvaju se na infrastrukturi protokola. Fondacija direktno čuva samo bankovnu dokumentaciju donacija (zakonska obaveza finansijskog izveštavanja) i evidenciju o vezi između pravnog lica pokrovitelja i korisnika na čiji zapis u sistemu se doprinos evidentira (poglavlje 8).

Treća je minimizacija — platforma prikuplja samo podatke neophodne za funkcionisanje sistema: pseudonim, email adresu, datum pristupanja, graf verifikacija i podatak o verifikaciji i potvrđenosti. Korisnik može dobrovoljno uneti dodatne podatke radi lakšeg korišćenja platforme, ali to nije uslov za dokaz stvarnosti niti za pristup funkcijama sistema.

## Kategorije podataka

Sistem obrađuje nekoliko kategorija ličnih podataka, uz princip minimizacije ugrađen u dizajn — platforma prikuplja samo podatke neophodne za funkcionisanje, fondacija ne čuva lične podatke korisnika platforme, a korisnik sam odlučuje koje dodatne podatke unosi.

Podaci o korisnicima platforme: pseudonim, email adresa, datum pristupanja. Neophodni za funkcionisanje sistema.

Podaci dokaza stvarnosti: graf verifikacija, uključujući podatak da li je verifikacija potvrda ili uvođenje u Kolo, i podatak o verifikaciji i potvrđenosti. Operativni podaci sistema koji beleže odnose između korisnika i njihovu verifikaciju — bez njih ne može da se obezbedi načelo jedna osoba, jedan nalog.

Dobrovoljno uneti podaci: ime, adresa, kontakt podaci — korisnik sam odlučuje da li ih unosi i može da ih obriše u svakom trenutku.

Podaci o aktivnosti: evidencija razmena i doprinosa u pseudonimnom obliku — zapisi koji čine osnovu obračunskog okvira.

Podaci o donacijama: iznos, datum, identitet donatora — čuva ih fondacija na osnovu zakonske obaveze finansijskog izveštavanja. Identifikacija donatora se obezbeđuje kroz bankovni sistem.

Podaci o pokroviteljstvu: doprinosi pravnih lica i veza između pravnog lica i korisnika na čiji zapis se doprinos evidentira. Ime i prezime korisnika vodi se samo u evidenciji identiteta, odvojeno od evidencije doprinosa, i ne prikazuje se drugim korisnicima, osim u slučaju poziva sa spiska za poziv.

Evidencija identiteta nastaje u pet slučajeva — gazdinstvo, javna donacija, svojstvo zadrugara, pokroviteljstvo (ime zastupnika koji podnosi prijavu) i spisak za poziv (ime upisuje sam korisnik): uz pseudonim naloga vodi se ime i prezime, jedno po nalogu, radi načela jedna osoba, jedan nalog. Ne prikazuje se drugim korisnicima, osim članu Kola koji korisnika sa spiska za poziv poziva radi upoznavanja, dok je poziv otvoren, ne ulazi u zapise POEN-a i briše se gašenjem naloga.

Posebne kategorije podataka mogu nastati u kontekstu socijalnih programa (Modul 3): status roditelja, starosna dob, invaliditet, studentski status. Fondacija ne čuva kopije podnesene dokumentacije — u sistemu ostaje samo minimalni zapis o pripadnosti grupi i datum verifikacije statusa.

Podaci maloletnih lica nastaju aktiviranjem Modula 4: podaci o maloletnim korisnicima, saglasnost roditelja ili zakonskog zastupnika i ograničenja koja važe za maloletnog korisnika.

Podaci zadrugara nastaju aktiviranjem Modula 2: ime i prezime i pseudonim zadrugara, koje uz pristanak lica dostavlja zadruga, radi povezivanja naloga sa zadrugom i brojanja zadrugara za pragove rasta. Ime i prezime ne prikazuje se drugim korisnicima i upisuje se u evidenciju identiteta.

Podaci o gazdinstvu nastaju kada punoletan korisnik prijavi gazdinstvo: naziv, naselje i tačna lokacija, opis proizvodnje, uloga podnosioca, broj poljoprivrednog gazdinstva kada je gazdinstvo upisano u registar i pseudonimi članova. Ime i prezime svakog člana upisuje se u evidenciju identiteta, ne uz gazdinstvo; fondacija podatke u registru ne proverava. Izvod iz registra se ne prilaže. Gazdinstvo, upisano ili neupisano u registar, prijavljuje svaki punoletni korisnik kao nosilac; prijava dovodi korisnika na spisak za poziv (poglavlje 7), ali ne potvrđuje njegovu stvarnost. Odobreno gazdinstvo prikazuje se na javnoj mapi, na kojoj su i pokrovitelji; adresa se ispisuje na osnovu izjave podnosioca date pri prijavi, a broj gazdinstva se ne prikazuje. Prikaz je sastavni deo učešća gazdinstva i uslov doprinosa gazdinstva (Pravilnik o gazdinstvima).

## Pravni osnov obrade

Obrada ličnih podataka zahteva pravni osnov (čl. 12 ZZPL-a). KOLO sistem koristi različite pravne osnove za različite kategorije podataka.

Za podatke o korisnicima platforme i podatke dokaza stvarnosti, pravni osnov je izvršenje ugovornog odnosa (čl. 12 st. 1 t. 2 ZZPL-a) — korisnik pristupanjem sistemu prihvata pravila korišćenja koja čine ugovorni odnos sa fondacijom kao rukovaocem.

Za dobrovoljno unete podatke, pravni osnov je pristanak korisnika (čl. 12 st. 1 t. 1 ZZPL-a).

Za podatke o aktivnosti, pravni osnov je izvršenje ugovornog odnosa dok korisnik učestvuje u sistemu. Nakon što korisnik napusti sistem i zatraži brisanje, identifikacioni podaci se brišu, a zapisi koji ostaju u evidenciji zadržavaju se pod pseudonimom koji ne upućuje na ime; to je pseudonimizacija, a ne anonimizacija, i zadržani zapisi i dalje su lični podaci (odeljak o pravu na brisanje u nastavku).

Za podatke o donacijama, pravni osnov je zakonska obaveza (čl. 12 st. 1 t. 3 ZZPL-a). Za podatke o pokroviteljstvu, pravni osnov je legitimni interes fondacije (čl. 12 st. 1 t. 6 ZZPL-a) i zakonska obaveza vođenja finansijske evidencije.

Za posebne kategorije podataka, pravni osnov je izričit pristanak korisnika (čl. 17 st. 2 t. 1 ZZPL-a). Pristanak se može povući u svakom trenutku, sa posledicom prestanka automatskog evidentiranja POEN-a.

Za podatke maloletnih lica, pravni osnov je pristanak roditelja ili zakonskog zastupnika (čl. 16 ZZPL-a).

## Rukovalac podataka

KOLO Fondacija je rukovalac podataka u smislu ZZPL-a — određuje svrhe i sredstva obrade. Fondacija je rukovalac čak i kad ne čuva podatke korisnika fizički: pravno relevantan kriterijum je određivanje svrhe i sredstava obrade, ne fizičko skladištenje podataka (čl. 2 st. 1 t. 8 ZZPL-a). Protokol je tehničko sredstvo obrade. Ako fondacija angažuje treća lica za održavanje infrastrukture, ta lica su obrađivači podataka u smislu ZZPL-a (čl. 45).

## Tenzija između prava na brisanje i integriteta evidencije

ZZPL (čl. 30) daje korisniku pravo da zahteva brisanje svojih ličnih podataka. KOLO vodi evidenciju doprinosa koja je po dizajnu konzistentna — brisanje zapisa jednog korisnika bi narušilo konzistentnost celokupne evidencije koja je zajedničko dobro svih korisnika. Ova tenzija se rešava razdvajanjem podataka na identifikacione i obračunske: korisnik koji napusti sistem dobija brisanje email adrese i svih dobrovoljno unetih podataka, anonimizaciju veza u grafu verifikacija, dok zapisi u evidenciji ostaju pod pseudonimom koji ne upućuje na ime. To je pseudonimizacija, a ne anonimizacija: Fondacija zadržava interni identifikator naloga, pa zadržani zapisi i dalje predstavljaju lične podatke u smislu ZZPL-a, a čuvaju se zato što pravo na brisanje nije neograničeno (čl. 30 st. 3 ZZPL-a).

## Obaveze fondacije

Fondacija je dužna da sprovede procenu uticaja na zaštitu podataka (DPIA) pre početka obrade (čl. 54 ZZPL-a), da imenuje lice za zaštitu podataka kada za to nastane obaveza iz čl. 56 ZZPL-a (Fondacija ga u ovom trenutku nije odredila) i da primenjuje tehničke i organizacione mere zaštite primerene riziku (čl. 51 ZZPL-a). Modul 3 (Socijalni programi) i Modul 4 (Deca) aktivirani su tek po ažuriranju DPIA, jer uvode obradu posebnih kategorija podataka (čl. 17 ZZPL-a) i podataka maloletnih lica (čl. 16 ZZPL-a). Ako infrastruktura sistema uključuje servere van Republike Srbije, prenos ličnih podataka van zemlje podleže pravilima ZZPL-a o prekograničnom prenosu (čl. 65–69).

Korisnici sistema imaju sva prava koja im ZZPL garantuje — pravo pristupa (čl. 26), ispravke (čl. 29), brisanja (čl. 30), ograničenja obrade (čl. 31), prenosivosti (čl. 36) i prigovora (čl. 37). Fondacija obezbeđuje mehanizam za podnošenje zahteva koji je pristupačan svim korisnicima i odgovara na zahteve u roku od trideset dana od prijema zahteva (čl. 21 st. 3 ZZPL-a), sa mogućnošću produženja za još šezdeset dana uz obaveštenje korisnika o razlozima produženja. Detaljan opis kategorija podataka, pravnih osnova obrade za svaku kategoriju, prava korisnika, tehničkih i organizacionih mera zaštite i pravila prekograničnog prenosa dat je u Politici privatnosti KOLO sistema. Tehničke mere zaštite opisane su u Prilogu D ovog dokumenta.

# 13. Putanja razvoja

KOLO sistem nije gotov proizvod koji se lansira u konačnom obliku. To je sistem koji se gradi postepeno, testira u praksi i prilagođava na osnovu iskustva. Ovo poglavlje opisuje očekivanu putanju tog razvoja — faze, pragove, otvorena pitanja i strukturne limite koje sistem nikad ne prelazi.

Putanja nije fiksiran plan sa datumima. Pragovi su merljivi, ali vreme potrebno da se dosegnu zavisi od brzine rasta zajednice, od kapaciteta fondacije i od okolnosti koje niko ne može da predvidi. Ovo poglavlje opisuje redosled i uslove, ne kalendar. Pristup odgovara onome što literatura o decentralizovanim sistemima opisuje kao dizajniranu putanju sa merljivim uslovima prelaza (up. Walden, 2020).

Putanja ima predoperativnu fazu osnivanja, dve operativne faze sa merljivim pragom prelaza i modularnu fazu u kojoj se sistem razvija po sopstvenim pravilima. Faza osnivanja prethodi operativnom radu sistema. Dve operativne faze su sekvencijalne — druga počinje kad je ispunjen prag prelaza iz prve. Modularna faza nije sekvencijalna — moduli se aktiviraju nezavisno, kad su ispunjeni njihovi sopstveni preduslovi, ne u unapred određenom redosledu.

## Faza osnivanja

Fondacija se registruje u Somboru. Protokol se razvija i testira. Pravila sistema se definišu u prvoj verziji. Licence se postavljaju — AGPL-3.0 za softver, CC BY-SA 4.0 za sadržaj. Whitepaper se objavljuje. Pravna pozicija sistema se uspostavlja.

U ovoj fazi nema korisnika, nema evidencije, nema obračuna. Sistem postoji kao kod, pravila i pravni okvir. Fondacija drži infrastrukturu i priprema se za prijem prvih korisnika.

Preduslovi za početak Faze 1: funkcionalan protokol, registrovana fondacija, objavljen whitepaper, uspostavljena infrastruktura, definisana pravila za dokaz stvarnosti.

## Faza 1: Osnova

U ovoj fazi se aktivira celokupna osnova sistema — svi elementi opisani u poglavljima 3–8.

Protokol počinje da vodi evidenciju. Prvi zapisi POEN-a nastaju kroz prve doprinose korisnika.

Aktivira se dokaz stvarnosti (poglavlje 7). Prva grupa korisnika prolazi verifikaciju kroz lanac potvrda. Osnivači obezbeđuju verifikacioni kapacitet za pokretanje lanca potvrda.

Aktivira se finansijski doprinos (poglavlje 8). Prve donacije počinju da pristižu. Finansijski tok između zajednice i fondacije se uspostavlja u praksi. Fondacija počinje da troši dinarska sredstva na infrastrukturu i programe.

Aktivira se operativni doprinos (poglavlje 8). Korisnici se prijavljuju za zadatke za zajedničko dobro podnošenjem plana izvršenja. Fondacija odobrava planove, a izvršenje celina verifikuju čuvari Kola i lice koje Upravni odbor ovlasti. Po aktiviranju Gornjeg Kola u Fazi 2, zadatke objavljuju i verifikuju čuvari Kola i Gornje Kolo. Limit od 10% ukupnog broja POEN-a evidentiranih u sistemu po obračunskom periodu štiti sistem od inflatornog pritiska; ovaj limit je operativni parametar koji podleže promeni kroz procese upravljanja (poglavlje 10).

Ova faza je operativno najzahtevnija. Sistem se prvi put suočava sa stvarnim korišćenjem. Pravila koja su na papiru delovala logično mogu se pokazati nepraktična, neizbalansirana ili nedovoljno precizna. Osnivač i fondacija u ovoj fazi aktivno prilagođavaju parametre — koliko zapisa POEN-a protokol upisuje za koju aktivnost, kako funkcioniše obračunski period, kako se evidencija prikazuje korisnicima. Broj korisnika je mali — dovoljno da se testira mehanika, nedovoljno da se testira skaliranje. Očekivanje je da prvi korisnici budu lica koja razumeju dizajn sistema i koja prihvataju ograničenja rane verzije.

Prag za prelaz u Fazu 2: ukupan broj POEN-a evidentiranih u sistemu dostigne 1.000.000 — stanje protokola od −1.000.000 POEN (v. poglavlje 10 za objašnjenje obračunske konvencije). Ovim pragom se istovremeno aktivira upis ZRNA i uspostavlja Gornje Kolo kao telo zajednice koje utvrđuje predloge o pravilima sistema.

## Faza 2: ZRNO i Gornje Kolo

Kad ukupan broj POEN-a evidentiranih u sistemu dostigne milion, obračunski koeficijent dostiže minimalnu vrednost od 1 — milion POEN-a podeljeno sa milion raspoloživih ZRNA. Ovaj prag je određen obračunskom mehanikom: pri koeficijentu 1, upis jednog ZRNA zahteva najmanje 1 POEN, čime obračunski odnos između dve jedinice počinje da funkcioniše smisleno. Ovo je okidač za aktivaciju upisa ZRNA — protokol počinje da prima zahteve za upis ZRNA po pravilima opisanim u poglavlju 6.

Aktivacijom ZRNA automatski nastaje Gornje Kolo — čine ga čuvari Kola koji su aktivirali ZRNO. Predloge o pravilima sistema od tada utvrđuju čuvari Kola koji su aktivirali ZRNO, a Upravni odbor Fondacije ih usvaja svojim aktom (poglavlje 10). Nema zasebnog koraka aktivacije Gornjeg Kola: milion POEN-a je prag koji istovremeno aktivira ZRNO, uspostavlja Gornje Kolo i označava prelaz sa osnivačkog upravljanja na upravljanje zajednice. Fondacija zadržava pravnu i servisnu ulogu, kao i zaštitni veto na odluke Gornjeg Kola. Veto se gasi trajno i jednosmerno kada finansijska sredstva Fondacije dostignu prag finansijske samostalnosti utvrđen posebnim pravilnikom.

Prvi članovi Kola dostižu prag od dvadeset hiljada POEN-a i počinju da upisuju ZRNO. Obračunski koeficijent se po prvi put menja na osnovu stvarne aktivnosti. Sistem pored osnivača dobija i prve čuvare Kola koji su status stekli redovnim putem. Osnivači, koji su u Fazi 1 imali nadzornu funkciju, čuvari su Kola od uspostavljanja sistema po prelaznoj odredbi Pravilnika, pa je nadzorna funkcija od početka vezana za status čuvara Kola u skladu sa Pravilnikom o dokazu stvarnosti.

Prag za prelaz u modularnu fazu: dovoljan broj čuvara Kola, dovoljan obim aktivnosti, stabilnost osnove tokom definisanog perioda. Konkretni pragovi se definišu u KOLO Pravilniku ili posebnim pravilnicima i objavljuju javno pre početka Faze 1, čime njihovo ispunjenje postaje verifikabilno od strane svakog korisnika.

## Modularna faza

Modularna faza počinje kad osnova sistema — zajedničko dobro, protokol, fondacija, zajednica, POEN, ZRNO, dokaz stvarnosti, finansijski i operativni doprinos — funkcioniše stabilno i kad postoji dovoljan broj čuvara Kola za aktiviranje upravljačkih mehanizama.

U ovoj fazi, moduli se aktiviraju prema sopstvenim preduslovima, ne u unapred određenom redosledu. Koji modul se aktivira prvi zavisi od potreba zajednice i odluke Gornjeg Kola, koje je u ovoj fazi već aktivno. Moduli su opisani u poglavlju 9; ovde su navedeni sa preduslovima aktivacije.

Krugovi se aktiviraju kad postoji dovoljno korisnika da interesno udruživanje ima smisla — minimalan broj korisnika i pravila formiranja definisani su u pravilniku sistema.

Zadruge su aktivirane Pravilnikom o zadrugama (set 4.7.0). Zadruga ulazi u sistem kad lokalna zajednica ima potrebu za sopstvenom organizacionom jedinicom registrovanom po Zakonu o zadrugama, kad je najmanje pet zadrugara učesnika i kad je zaključen ugovor o saradnji. Prva zadruga na lokalitetu otvara se tek kad u tom mestu ima najmanje pedeset učesnika, i u njenom osnivanju učestvuje Fondacija; svaka sledeća zadruga u istom mestu osniva se na inicijativu korisnika, sa najmanje pet zadrugara. Fondacija pomaže u osnivanju i koordiniše integraciju u sistem.

Socijalni programi se aktiviraju kad sistem ima dovoljno korisnika da automatska evidencija za kvalifikovane grupe ima smisla u kontekstu obračunskog okvira.

Modul Deca se aktivira kad su uspostavljene sve zaštitne mere za maloletne korisnike — saglasnost roditelja ili zakonskog zastupnika, ograničenja aktivnosti, pojačana zaštita podataka (poglavlje 12).

Internacionalizacija se aktivira kad je sistem stabilan sa aktivnim Gornjim Kolom, kad postoji dovoljno iskustva sa funkcionisanjem u osnovnoj regiji i kad je sprovedena pravna analiza za ciljne jurisdikcije. Širenje na teritoriju Evropske unije zahteva, pored pune usklađenosti sa GDPR-om, i procenu uticaja prenosa podataka pre započinjanja obrade podataka korisnika u novoj jurisdikciji.

Modularna faza nema kraj. Sistem nastavlja da se razvija — novi moduli, nova pravila, novi korisnici — pod upravljanjem zajednice, ne osnivača. Prelaz iz Faze 1 u Fazu 2 — aktivacija ZRNA i nastanak Gornjeg Kola — je kraj osnivačkog perioda, ne kraj razvoja.

## Otvorena pitanja

Sistem prepoznaje pitanja na koja trenutno nema konačan odgovor. Ova pitanja su ovde navedena jer je poštenje prema korisnicima i regulatorima važnije od privida kompletnosti.

Nasleđe. Pozicija sistema je da POEN-i i ZRNO nemaju imovinskopravni karakter i da se ne mogu naslediti kao imovina — POEN nema nosioca i ne može se konvertovati u novac, a ZRNO je neprenosivo i vezano za identitet fizičke osobe utvrđen u lancu potvrda. Po saznavanju o smrti korisnika, slobodno ZRNO se vraća u fond raspoloživih ZRNA u protokolu bez evidencije POEN-a, aktivno ZRNO se deaktivira i vraća u fond, a identifikacioni podaci se brišu po proceduri iz poglavlja 12 — zapisi u evidenciji doprinosa ostaju pod identifikatorom koji više ne omogućava identifikaciju. Ova pozicija bi mogla biti osporena s obzirom na to da evidencija ima intrasistematsku upotrebnu vrednost; konačno rešenje može zavisiti od razvoja sudske prakse o statusu digitalnih zapisa u naslednom pravu.

Regionalna federacija. Modul internacionalizacije (poglavlje 9) predviđa širenje sistema sa jedinstvenom evidencijom — ne federaciju nezavisnih sistema. Međutim, zajednice u drugim gradovima ili zemljama mogu želeti da pokrenu sopstveni sistem sa odvojenom evidencijom ali kompatibilnim pravilima. Pitanje da li takvi sistemi mogu biti federisani — da dele pravila ali vode odvojenu evidenciju — i da li bi POEN u jednom sistemu imao efekat u drugom, trenutni dizajn ne adresira. Ovo pitanje postaje relevantno tek kad sistem dostigne obim koji to zahteva i razlikuje se od internacionalizacije koja zadržava jedinstven protokol.

Skaliranje dokaza stvarnosti. Model dokaza stvarnosti — lanac potvrda zasnovan na ličnom poznavanju ili na razgovoru posle poziva (poglavlje 7) — adresira skaliranje verifikacije decentralizovano: svaki član Kola može da potvrđuje korisnike, uz ograničen dnevni tempo potvrđivanja, a čuvari Kola nadziru širenje i obezbeđuju integritet grafa verifikacija. Međutim, otvorena pitanja ostaju. Jedna potvrda olakšava širenje mreže, ali svaki verifikator time postaje jedini oslonac za one koje je uveo. Spisak za poziv otvara put onima koji ne poznaju nikoga, ali razgovor posle poziva slabiji je oslonac od ličnog poznavanja; zato onaj ko je posle razgovora uveden u Kolo ostaje član bez potvrde, sa ograničenim radnjama, dok ga ne potvrdi neko ko ga lično zna. Rizik od koordiniranih lažnih potvrda raste sa veličinom sistema i sa smanjenjem gustine socijalnih veza (up. Douceur, 2002, o Sybil napadima u distribuiranim sistemima). Pitanje kako se obezbeđuje integritet grafa verifikacija sa stotinama hiljada korisnika — posebno u kontekstu geografskog širenja van regije u kojoj postoji gusta mreža poznanstava — ostaje otvoreno i zavisi od iskustva sa ranijim fazama i od mogućih tehničkih nadogradnji modela.

Odnos sa poreskim sistemom. Razmena dobara i usluga unutar KOLO sistema može imati poreske implikacije za korisnike. Ako korisnik razmenjuje uslugu sa drugim korisnikom, da li ta razmena podleže porezu na dohodak? Da li PDV-u? Trenutna pozicija sistema je da su POEN-i evidencija bez imovinske vrednosti, ali poreske vlasti mogu da zauzmu drugačiji stav — naročito ako se razmena unutar sistema kvalifikuje kao trampa u smislu poreskih propisa. Ovo pitanje zahteva pravnu analizu i potencijalno konsultaciju sa poreskim organima. Iskustva komplementarnih sistema u drugim jurisdikcijama — od Chiemgauera u Nemačkoj do WIR-a u Švajcarskoj — pokazuju da poreski tretman značajno varira i da nije moguće pretpostaviti ishod bez formalne analize.

Granice rasta. Postoji li tačka posle koje sistem prestaje da funkcioniše kako je dizajniran? Da li milion ZRNA postaje ograničavajući faktor sa milion korisnika? Da li obračunski koeficijent postaje neupotrebljivo visok sa desetinama miliona evidentiranih POEN-a? Obračunska formula ne postavlja gornju granicu, ali praksa može da otkrije operativna ograničenja koja teorija ne predviđa.

## Strukturni limiti sistema

Sistem tokom celokupne putanje razvoja aktivno održava granice koje ne prelazi — strukturne elemente bez kojih sistem prestaje da bude participatorni sistem zajedničkog dobra.

Četiri principa iz poglavlja 4 — nekonvertibilnost, odsustvo imovinskog prava nad zapisima, nepovratnost donacija i minimizacija podataka — su strukturni limiti koji se ne mogu ukinuti nijednom upravljačkom odlukom. Uz njih, licence zajedničkog dobra (AGPL-3.0 za softver i CC BY-SA 4.0 za sadržaj, poglavlje 3) se ne mogu zameniti restriktivnijim. Prelazak bilo koje od ovih granica menja pravnu prirodu sistema — od participatornog sistema zajedničkog dobra u finansijski instrument, platni servis, investicionu šemu ili instrument nadzora, sa svim regulatornim posledicama koje to nosi. Takva transformacija je nepovratna — zato su granice postavljene kao strukturni elementi arhitekture, ne kao parametri koji podležu upravljačkoj promeni.

Ovi limiti nisu restrikcije nametnute sistemu spolja. To su konstitutivni elementi koji čine sistem onim što jeste — njihovo ukidanje ne bi bilo promena sistema, nego prestanak njegovog postojanja u sadašnjem obliku. Razlika između strukturnih limita i operativnih parametara sistema — koji se mogu i trebaju menjati sa iskustvom — obrazložena je u poglavlju 4.

# 14. Zaključak

Ovaj dokument opisuje arhitekturu, pravnu poziciju, obračunski okvir, organizacionu strukturu, module, upravljačke mehanizme, podsticajnu strukturu, zaštitu podataka i putanju razvoja KOLO sistema — participatornog sistema zajedničkog dobra zasnovanog na evidenciji doprinosa.

Sistem integriše elemente koje postojeći modeli rešavaju parcijalno: evidenciju doprinosa kroz protokol i dve obračunske jedinice (poglavlje 6), dokaz stvarnosti zasnovan na ličnom poznavanju ili na razgovoru posle poziva umesto na prikupljanju ličnih dokumenata (poglavlje 7), progresivnu decentralizaciju upravljanja sa merljivim uslovima prelaza (poglavlje 10), pravni okvir kroz fondaciju kao instrument koji daje sistemu prepoznatljiv oblik u pravnom prometu bez toga da ga poseduje (poglavlje 5) i modularnu arhitekturu koja razdvaja osnovu od proširenja (poglavlje 9).

Četiri principa — nekonvertibilnost POEN-a, odsustvo imovinskog prava nad zapisima, nepovratnost donacija i minimizacija podataka — čine strukturne limite sistema (poglavlje 4). Ovi principi nisu operativni parametri koji podležu upravljačkoj promeni, nego konstitutivni elementi bez kojih sistem prestaje da bude ono što jeste. Njihova funkcija je dvostruka: obezbeđuju da sistem ne može da evoluira u finansijski instrument, platni servis ili investicionu šemu, i istovremeno postavljaju osnov za pravnu kvalifikaciju sistema kao participatornog sistema zajedničkog dobra.

Sistem prepoznaje svoja ograničenja. Tenzija između akumulacije i cirkulacije je svestan dizajnerski izbor sa dokumentovanim posledicama (poglavlje 11). Skaliranje dokaza stvarnosti van regije sa gustom mrežom poznanstava ostaje otvoreno pitanje (poglavlje 13). Odnos sa poreskim sistemom — posebno pitanje da li razmena unutar sistema podleže kvalifikaciji kao trampa — zahteva formalnu analizu i konsultaciju sa nadležnim organima (poglavlje 13). Pitanje nasleđa evidencije nema konačan odgovor. Ova otvorena pitanja su navedena u dokumentu jer je poštenje prema korisnicima i regulatorima deo dizajna sistema, ne nedostatak dokumentacije.

KOLO sistem započinje rad sa objavom ovog dokumenta. Dokumentacija koja sledi — Prilog A (međunarodni institucionalni okvir), Prilog B (tabele parametara), Prilog C (glosar), Prilog D (tehničke i organizacione mere bezbednosti) i Prilog E (mapiranje Ostrom dizajn principa) — pruža dodatni kontekst za pozicioniranje sistema u regulatornom i akademskom okviru.

# Prilog A: Međunarodni institucionalni okvir

KOLO sistem se funkcionalno uklapa u širi institucionalni kontekst koji međunarodne organizacije aktivno razvijaju za socijalnu i solidarnu ekonomiju. Ovaj prilog sumira ključne dokumente tog okvira. Dokumenti nemaju direktnu pravnu snagu u srpskom pravnom sistemu, ali predstavljaju institucionalni okvir koji definiše pravac regulatornog razvoja — relevantno za Srbiju u procesu pristupanja EU.

### Akcioni plan Evropske komisije za socijalnu ekonomiju (COM(2021) 778, decembar 2021)

Strateški dokument koji predviđa mere za period 2021–2030 u tri oblasti: pravni okviri, finansiranje i vidljivost socijalne ekonomije. Komisija prepoznaje fondacije, kooperative i udruženja kao ključne aktere socijalne ekonomije i predviđa mere za prilagođavanje pravnih okvira, poreskih politika i sistema javnih nabavki. Relevantan za KOLO jer potvrđuje da EU aktivno gradi regulatorni prostor za tip entiteta u koji se KOLO funkcionalno uklapa.

### Preporuka Saveta EU o razvoju okvirnih uslova za socijalnu ekonomiju (C/2023/1344, 27. novembar 2023)

Poziva države članice da prilagode pravne okvire, poreske politike, javne nabavke i administrativne strukture potrebama socijalne ekonomije. Države članice se pozivaju da usvoje ili ažuriraju nacionalne strategije za socijalnu ekonomiju. Za Srbiju je relevantna jer proces pristupanja EU podrazumeva usklađivanje sa acquis communautaire, uključujući preporuke u oblasti socijalne ekonomije.

### Rezolucija ILO o dostojanstvenom radu i socijalnoj i solidarnoj ekonomiji (ILC.110/Resolution II, jun 2022)

Prvo formalno priznanje socijalne i solidarne ekonomije u sistemu UN-a. Definisala je sektor i postavila smernice za podršku od strane država članica ILO-a. Srbija je članica ILO-a. Rezolucija definiše entitete socijalne i solidarne ekonomije kroz principe dobrovoljne saradnje, demokratskog upravljanja i primata društvene svrhe nad kapitalom — principe koji su strukturno ugrađeni u KOLO sistem.

### OECD Preporuka o socijalnoj i solidarnoj ekonomiji i socijalnoj inovaciji (OECD/LEGAL/0472, jun 2022)

Preporuka Saveta OECD-a koja poziva države članice da razvijaju pravne okvire, poreske podsticaje i institucionalnu podršku za socijalnu i solidarnu ekonomiju. Naglašava potrebu za prilagođenim regulatornim okvirima koji prepoznaju specifičnosti entiteta socijalne ekonomije — uključujući sisteme evidencije doprinosa, participatorno upravljanje i neprofitno organizovanje.

### Rezolucija Generalne skupštine UN-a A/RES/77/281 (18. april 2023)

Prva rezolucija Generalne skupštine UN-a posvećena socijalnoj i solidarnoj ekonomiji. Definiše socijalnu i solidarnu ekonomiju kao entitete zasnovane na principima dobrovoljne saradnje, uzajamne pomoći, demokratskog upravljanja i primata ljudi i društvene svrhe nad kapitalom. Poziva države članice da razvijaju pravne okvire, fiskalne podsticaje i programe podrške.

### Rezolucija Generalne skupštine UN-a A/RES/79/213 (decembar 2024)

Nastavak i proširenje A/RES/77/281. Potvrđuje ulogu socijalne i solidarne ekonomije u ostvarivanju ciljeva održivog razvoja i poziva na konkretniju institucionalnu podršku na nacionalnom nivou.

### UN Inter-Agency Task Force on Social and Solidarity Economy (UNTFSSE)

Međuagencijski tim koji koordinira podršku socijalnoj i solidarnoj ekonomiji unutar sistema UN-a. EU Akcioni plan eksplicitno navodi saradnju sa UNTFSSE kao prioritet. UNTFSSE objavljuje godišnje izveštaje o stanju sektora i pruža tehničku podršku državama članicama u razvoju regulatornih okvira.

### Relevantnost za KOLO sistem

Svi navedeni dokumenti prepoznaju i podržavaju tip entiteta u koji se KOLO funkcionalno uklapa: participatorni sistemi zasnovani na zajedničkom dobru, sa demokratskim upravljanjem, neprofitnom organizacijom i evidencijom doprinosa kao centralnim mehanizmom. Za Srbiju u procesu pristupanja EU, ovaj okvir definiše pravac regulatornog razvoja u koji zemlja ulazi. KOLO sistem nije dizajniran da se uklopi u ovaj okvir naknadno — principi koji su u njega ugrađeni (poglavlja 2 i 4) se poklapaju sa principima koje ovi dokumenti formalizuju, jer imaju zajedničke intelektualne korene u kooperativnoj i neo-mutualističkoj tradiciji.

### Srpska pravna mapa

Relevantni srpski propisi — Zakon o digitalnoj imovini, Zakon o platnim uslugama, Zakon o tržištu kapitala, Zakon o zadužbinama i fondacijama, Zakon o zaštiti podataka o ličnosti, Zakon o zadrugama, Zakon o sprečavanju pranja novca i finansiranja terorizma, Zakon o radu, Zakon o obligacionim odnosima i poreski propisi — analizirani su u kontekstu svakog elementa sistema u poglavljima 4, 6, 7, 8, 9, 10 i 12. Pravna pozicija sistema u odnosu na svaki od ovih propisa data je na mestu gde je relevantnija za razumevanje konkretnog elementa sistema nego u izolovanom prilogu.

# Prilog B: Tabele parametara

Tabele u ovom prilogu sumarno prikazuju ključne parametre sistema. Svaki parametar je detaljno obrazložen u poglavljima na koja tabele referenciraju. Vrednosti parametara podležu promeni kroz procese upravljanja opisane u poglavlju 10, osim strukturnih limita navedenih u poglavlju 4 koji se ne mogu menjati nijednom upravljačkom odlukom.

### Tabela 1: Parametri POEN-a (poglavlje 6.1)

| **Parametar** | **Vrednost** | **Napomena** |
| --- | --- | --- |
| Pravni karakter | Evidencija doprinosa | Nije novac, valuta, token, platno sredstvo, elektronski novac ni digitalna imovina |
| Nosilac | Ne postoji | POEN postoji isključivo kao zapis u evidenciji protokola |
| Evidentiranje | Isključivo kroz protokol | Na osnovu aktivnosti i pravila definisanih u protokolu |
| Kategorije evidentiranja | Osnova (POEN u zapisu korisnika): donacije, pokroviteljstvo, verifikacija, operativni doprinos. Moduli: rast krugova i zadruga (POEN u zapisu organizacione jedinice), socijalni programi (automatska evidencija po statusu) | Razmena ne uvećava ukupan broj POEN-a — redistribuira postojeće (zero-sum) |
| Konvertibilnost | Nekonvertibilan | Strukturni limit (poglavlje 4) |
| Imovinsko pravo korisnika | Ne postoji | Strukturni limit (poglavlje 4) |
| Korišćenje van sistema | Nije moguće | POEN nema eksternu imovinsku vrednost |

### Tabela 2: Parametri ZRNA (poglavlje 6.2)

| **Parametar** | **Vrednost** | **Napomena** |
| --- | --- | --- |
| Pravni karakter | Evidencija položaja | Nije hartija od vrednosti, udeo, akcija, investicioni ugovor ni digitalna imovina |
| Ukupno raspoloživo | 1.000.000 | Fiksirano u protokolu |
| Prenosivost | Neprenosivo | Nikad, ni u jednoj fazi, ni na koji način |
| Stanja | Slobodno ili aktivno | Slobodno: omogućava otpis; aktivno: omogućava glasanje |
| Minimum POEN-a za upis | 20.000 | Evidentiranih u sistemu |
| Maksimum upisa po periodu | 1% stanja | Po obračunskom periodu |
| Otpis | Po obračunskom koeficijentu | U novom obračunskom periodu, samo za slobodno ZRNO |
| Trgovanje | Nije moguće | Ne postoji tržište ni mehanizam prenosa |
| Dividenda/kamata/prinos | Ne postoji | Niti se garantuje bilo kakva korist |

### Tabela 3: Obračunski koeficijent (poglavlje 6.3)

| **Parametar** | **Vrednost** | **Napomena** |
| --- | --- | --- |
| Formula | Ukupan broj POEN-a ÷ broj ZRNA raspoloživih | Oba elementa promenljiva |
| Karakter | Administrativna veličina | Nije cena, kurs ni indeks performansi |
| Učestalost obračuna | Jednom dnevno | Na kraju obračunskog perioda |
| Ko izračunava | Protokol | Automatski, bez diskrecije |
| Ko kontroliše | Niko pojedinačno | Posledica ukupne aktivnosti |
| Minimalna vrednost za aktivaciju ZRNA | 1 | Dostiže se pri 1.000.000 evidentiranih POEN-a |

### Tabela 4: Statusi korisnika (poglavlje 7)

| **Status** | **Opis** | **Pristup** |
| --- | --- | --- |
| Korisnik | Punoletni korisnik koji nije u Kolu | Pregled sistema, oglasi i razmena, razgovor u obimu iz Uslova korišćenja, učešće u ažuriranju evidencije POEN-a (davalac/primalac), zahtev za razgovor i spisak za poziv |
| Član bez potvrde | Uveden u Kolo, još nije potvrđen | Razmena, evidencija doprinosa, doniranje, programi, nabavke, zadruge, upis i otpis ZRNA, uvođenje poznanika u Kolo; bez potvrđivanja, aktiviranja ZRNA i glasa |
| Član Kola | Jedna važeća potvrda u lancu potvrda | Razmena, evidencija doprinosa, doniranje, potvrđivanje korisnika, uvođenje u Kolo sa spiska za poziv, krugovi i zadruge |
| Čuvar Kola | Član Kola sa upisanim ZRNOM | Sve funkcije člana Kola + upravljanje + pozicija u obračunskom sistemu |

### Tabela 5: Faze upravljanja (poglavlje 10)

| **Faza** | **Nosilac upravljanja** | **Prag prelaza** |
| --- | --- | --- |
| Faza osnivanja | Osnivač | Fondacija registrovana, protokol razvijen, infrastruktura uspostavljena |
| Faza 1 | Osnivač i fondacija | Fondacija registrovana, protokol funkcionalan |
| Faza 2 | Gornje Kolo (čuvari Kola koji su aktivirali ZRNO) | 1.000.000 POEN-a evidentiranih — aktivira ZRNO i Gornje Kolo |

| **Zaštitni mehanizam** | **Uslov** | **Napomena** |
| --- | --- | --- |
| Zaštitni veto fondacije | Aktivan do gašenja | Odbija odluku koja ugrožava operativnu i finansijsku održivost fondacije do finansijske samostalnosti |
| Gašenje veta | Prag finansijske samostalnosti utvrđen posebnim pravilnikom | Trajno i jednosmerno |

### Tabela 6: Moduli (poglavlje 9)

| **Modul** | **Naziv** | **Preduslovi aktiviranja** |
| --- | --- | --- |
| 1 | Krugovi | Dovoljno korisnika za interesno udruživanje |
| 2 | Zadruge | Aktiviran Pravilnikom o zadrugama (set 4.7.0); lokalna potreba, registracija po Zakonu o zadrugama i ugovor o saradnji |
| 3 | Socijalni programi | Dovoljno korisnika za smislenu automatsku evidenciju |
| 4 | Deca | Sve zaštitne mere za maloletne korisnike |
| 5 | Internacionalizacija | Stabilan sistem sa aktivnim Gornjim Kolom, pravna analiza |

*Verifikacija (poglavlje 7), donacije fizičkih lica i pokroviteljstvo pravnih lica (poglavlje 8.2) i operativni doprinos (poglavlje 8.3) deo su osnove sistema koja funkcioniše od prvog dana, ne moduli koji se aktiviraju prema preduslovima.*

# Prilog C: Glosar

Pojmovi su grupisani tematski radi lakšeg snalaženja. Svaka definicija je konzistentna sa definicijom u poglavlju na koje referencira.

### Struktura sistema

**Zajedničko dobro — **Centar KOLO sistema. Kolektivno dobro svih korisnika koje obuhvata softver, pravila, evidenciju i sadržaj. Infrastruktura na kojoj ovi elementi postoje nije sastavni deo zajedničkog dobra u istom smislu, ali jeste operativni preduslov čije je održavanje servisna obaveza fondacije. Nijedan pojedinac, uključujući osnivača, nema individualno svojinsko pravo nad zajedničkim dobrom niti nad njegovim delom. Ne predstavlja kolektivnu svojinu u smislu važećih imovinskopravnih kategorija srpskog prava. Zaštićeno licencama AGPL-3.0 (softver) i CC BY-SA 4.0 (sadržaj). Poglavlje 3.

**Protokol — **Tehnički mehanizam zajedničkog dobra. Softver koji vodi evidenciju, obračunava odnose i primenjuje pravila. Nema pravni subjektivitet. Ne donosi odluke — izvršava pravila koja postavljaju ljudi. Poglavlje 3.

**Fondacija (KOLO Fondacija) — **Pravni instrument sistema. Registrovana u Somboru po Zakonu o zadužbinama i fondacijama. Drži infrastrukturu, prima dinarske donacije, zastupa sistem u pravnom prometu. Čuva zajedničko dobro, a nije njegov vlasnik. Rukovalac podataka u smislu ZZPL-a. Poglavlje 5.

**Zajednica (KOLO Zajednica) — **Svi korisnici sistema, koji zajedno brinu o zajedničkom dobru. Koristi sistem, doprinosi mu i finansira fondaciju dinarskim donacijama; u upravljanju učestvuje kroz Gornje Kolo. Nije pravno lice i kao celina ne donosi odluke. Odnos zajednice prema zajedničkom dobru je participatoran: pravo korišćenja i doprinosa, ne pravo raspolaganja. Poglavlje 5.

**Osnova — **Minimalan skup elemenata bez kojih sistem ne postoji. Obuhvata: zajedničko dobro, protokol, fondaciju, zajednicu, POEN, ZRNO, obračunski koeficijent, dokaz stvarnosti, finansijski doprinos i operativni doprinos. Funkcioniše od prvog dana. Poglavlja 3–8.

**Modul — **Proširenje koje dodaje funkcionalnost osnovi bez da je menja. Svaki modul koristi isti protokol, istu evidenciju i ista pravila. Aktivira se prema sopstvenim preduslovima. Poglavlje 9.

### Obračunski okvir

**POEN — **Interna obračunska jedinica sistema. Evidencija doprinosa i drugih oblika učešća u zajedničkom dobru. Nema nosioca — postoji isključivo kao zapis u evidenciji protokola. Zapise upisuje isključivo protokol. Mehanizmi evidentiranja: doprinos korisnika (donacije, pokroviteljstvo, verifikacija, operativni doprinos) — POEN-i u zapisu korisnika; rast krugova i zadruga (Moduli 1 i 2) — POEN-i u zapisu organizacione jedinice; automatska evidencija u socijalnim programima (Modul 3) — POEN-i u zapisu primaoca podrške po statusu. Razmena ne uvećava ukupan broj POEN-a — redistribuira postojeće (zero-sum). Nije novac, valuta, token, platno sredstvo, elektronski novac ni digitalna imovina. Nekonvertibilan. Poglavlje 6.1.

**ZRNO — **Evidencija položaja u zajedničkom dobru. Ukupno raspoloživo: milion. Upisuje ga samo učesnik — član Kola, odnosno član bez potvrde, koji ga ne aktivira dok ne bude potvrđen; upisuje se i otpisuje isključivo kroz protokol. Neprenosivo između korisnika. Može biti u slobodnom stanju (omogućava otpis) ili aktivnom stanju (omogućava glasanje u Gornjem Kolu). Nije hartija od vrednosti, udeo, akcija, investicioni ugovor ni digitalna imovina. Ne nosi dividendu, kamatu ni garantovani prinos. Poglavlje 6.2.

**Obračunski koeficijent — **Ukupan broj POEN-a evidentiranih u sistemu podeljen brojem ZRNA raspoloživih u protokolu. Izračunava ga protokol jednom dnevno. Administrativna veličina — nije cena, kurs ni indeks performansi. Poglavlje 6.3.

**Obračunski period — **Vremenski interval na čijem kraju protokol izračunava obračunski koeficijent i primenjuje pravila upisa i otpisa ZRNA. Obračunski period traje 24 sata sa zatvaranjem u ponoć — fiksiran element sistema. Poglavlje 6.

**Dva odvojena akta — **Princip da su pravni akt donacije (dinarski tok) i administrativni akt evidencije POEN-a (obračunski tok) dva pravno nezavisna akta. Donacija ne kupuje POEN-e. Evidencija nije protivusluga za donaciju. Poglavlje 4.

### Korisnici

**Korisnik — **Svako lice sa nalogom na platformi, bez obzira na status; korisnik usluge u smislu propisa. Punoletni korisnik ima jedan od četiri statusa — korisnik, član bez potvrde, član Kola ili čuvar Kola; maloletni korisnik nema status, a njegov položaj uređuje Pravilnik o učešću dece. Poglavlje 7.

**Korisnik (status) — **Punoletni korisnik koji nije u Kolu. Može da pregleda sistem, da postavlja oglase i razmenjuje dobra i usluge, da razgovara sa drugim korisnicima u obimu iz Uslova korišćenja i da učestvuje u ažuriranju evidencije POEN-a (kao davalac ili primalac). Doprinos mu se evidentira samo kroz doprinos sadržaju platforme, finansijski doprinos i pokroviteljstvo. Nema pristup upravljanju, potvrđivanju drugih ni programima podrške i ne upisuje ZRNO. Može dospeti na spisak za poziv. Ulazni status. Poglavlje 7.

**Član Kola — **Korisnik čija je stvarnost potvrđena u lancu potvrda, jednom važećom potvrdom. Razmenjuje, doprinosi, stiče evidenciju POEN-a, donira, potvrđuje stvarnost korisnika koje lično zna i uvodi u Kolo korisnike sa spiska za poziv, učestvuje u krugovima i zadrugama. Potpun i legitiman status. Poglavlje 7.

**Član bez potvrde — **Punoletni korisnik koga je neko uveo u Kolo, a koga još nije potvrdio član Kola koji ga lično zna. Pripada Kolu; pripadnost Kolu nije članstvo u fondaciji. Ima prava učesnika, ali ne i prava koja akti vezuju za člana Kola: ne potvrđuje nikoga, nego samo uvodi poznanike u Kolo; potvrdu mu daje član Kola koji ga lično zna, čuvar Kola posle razgovora telefonom ili fondacija; ne vidi spisak za poziv, ne daje preporuku i ne nadzire; ZRNO upisuje, ali ga ne aktivira. Poglavlje 7.

**Čuvar Kola — **Član Kola kome je u protokolu upisano ZRNO. Sve funkcije člana Kola plus učešće u upravljanju kroz Gornje Kolo aktiviranjem ZRNA, pozicija u obračunskom sistemu i funkcija nadzornika širenja. Kome prestane verifikacija, postaje korisnik, a ZRNO mu ostaje upisano i zamrznuto dok ponovo ne bude potvrđen; kome se poništi samo potvrda, postaje član bez potvrde. Poglavlje 7.

**Osnivači — **Početni čuvari Kola, uspostavljeni prelaznom odredbom Pravilnika. Ishodište lanca potvrda; njihova potvrđenost ne proizlazi iz verifikacije. Poglavlje 7.

**Kolo — **Krug učesnika — članova bez potvrde, članova Kola i čuvara Kola. Nije pravno lice; pripadnost Kolu nije članstvo u fondaciji ni u drugom pravnom licu. Poglavlje 7.

### Dokaz stvarnosti

**Dokaz stvarnosti — **Model verifikacije korisnika zasnovan na ličnom poznavanju ili na razgovoru posle poziva. Potvrđuje stvarnost (korisnik postoji kao fizičko lice) i kontinuitet (ista osoba koja je prvobitno verifikovana); jedinstvenost verifikator ne jemči, nego višestruki nalog utvrđuje fondacija. Ne zahteva prikupljanje ličnih dokumenata. Poglavlje 7.

**Lanac potvrda — **Mehanizam dokaza stvarnosti u kome članovi Kola potvrđuju stvarnost korisnika koje lično znaju ili ih posle razgovora uvode u Kolo, a članovi bez potvrde uvode u Kolo poznanike. Jedini način potvrde stvarnosti; izuzetak su samo osnivači. Poglavlje 7.

**Učesnik — **Korisnik kome je u lancu potvrda evidentirana jedna važeća verifikacija, potvrdom ili uvođenjem u Kolo: član bez potvrde, član Kola i čuvar Kola. Pripadnost Kolu nema stepene i određuje pristup funkcijama sistema. Poglavlje 7.

**Potvrđenost — **Svojstvo člana Kola: korisnika kome je stvarnost potvrđena potvrdom, odnosno člana bez potvrde pošto bude potvrđen, i osnivača. Određuje pravo potvrđivanja, aktiviranja ZRNA i druga prava koja akti vezuju za člana Kola. Poglavlje 7.

**Potvrda i uvođenje u Kolo — **Dve vrste verifikacije. Potvrdu daje član Kola, odnosno osnivač, čoveku koga lično zna, i potvrđeni postaje član Kola; uvođenjem u Kolo član Kola posle razgovora uvodi korisnika sa spiska za poziv, odnosno član bez potvrde uvodi poznanika, i uvedeni postaje član bez potvrde. Razlika nije stepen pripadnosti Kolu. Poglavlje 7.

**Spisak za poziv — **Spisak korisnika koji ne poznaju nijednog člana Kola i čekaju poziv radi upoznavanja. Na njega se dolazi zahtevom za razgovor, javnom donacijom od najmanje 5.000 dinara izvršenom jednom uplatom, novčanim pokroviteljstvom ili prijavom gazdinstva upisanog u Registar poljoprivrednih gazdinstava. Dospeće na spisak ne potvrđuje stvarnost. Poglavlje 7.

**Polazni mehanizam (bootstrap) — **Mehanizam pokretanja lanca potvrda u kome su osnivači potvrđeni bez verifikacije od strane drugih korisnika. Poglavlje 7.

**Nadzornik širenja — **Funkcija naknadne provere legitimnosti izvršene verifikacije. Vrše je čuvari Kola, uključujući osnivače; proizlazi iz statusa i ne zavisi od faze sistema. Poglavlje 7.

### Doprinos

**Finansijski doprinos — **Dinarski priliv u fondaciju. Obuhvata donacije fizičkih lica i pokroviteljstvo pravnih lica, preduzetnika i gazdinstava. Poglavlje 8.2.

**Operativni doprinos — **Aktivnost van platforme čiji se doprinos evidentira u POEN-ima nakon verifikacije izvršenja. Nije radni odnos u smislu čl. 5 Zakona o radu. Poglavlje 8.3.

**Pokroviteljstvo — **Donacija novca od strane pravnog lica, preduzetnika ili nosioca registrovanog poljoprivrednog gazdinstva, odnosno pokroviteljstvo dobrima i uslugama. Doprinos se evidentira u zapisu korisnika koji je prijavu podneo, po istoj tabeli kao donacija fizičkog lica. Jedina tačka u sistemu gde spoljna ekonomija direktno utiče na internu evidenciju. Poglavlje 8.2.

**Koeficijent evidencije donacija — **Odnos između iznosa dinarske donacije i broja POEN-a koji se evidentiraju donatoru. Parametar koji se može menjati upravljačkom odlukom. Nije obračunski koeficijent (koji je ukupan broj POEN-a podeljen brojem raspoloživih ZRNA). Poglavlje 8.2.

**Gazdinstvo — **Domaćinstvo koje proizvodi hranu ili poljoprivredne proizvode i nudi ih na Pijaci, upisano ili neupisano u Registar poljoprivrednih gazdinstava. Nije korisnik sistema ni kolektivni oblik i nema zapis u protokolu; članovima odobrenog gazdinstva doprinos se evidentira u ličnim zapisima, a kada gazdinstvo prestane — po bilo kom osnovu — otpisuje se svim njegovim članovima u trenutku prestanka, i kada zapis time postane negativan; kod lažne izjave otpis i isključenje pogađaju i lica koja su bila članovi u periodu na koji se izjava odnosi, i kada su u međuvremenu istupila. Svi članovi gazdinstva koji su članovi Kola jednako njime upravljaju na platformi, a za izjavu o tačnosti podataka odgovara nosilac, odnosno podnosilac kod gazdinstva van registra. Prikazuje se na javnoj mapi domaćih proizvođača. Pravilnik o gazdinstvima.

### Upravljanje

**Gornje Kolo — **Telo zajednice koje utvrđuje predloge o pravilima sistema; Upravni odbor fondacije ih usvaja svojim aktom. Ne upravlja fondacijom. Čine ga čuvari Kola koji su aktivirali ZRNO; sastav i glasačka moć utvrđuju se za svaki obračunski period i važe samo tokom njega. Nastaje automatski sa aktivacijom ZRNA pri pragu od 1.000.000 POEN-a. Odlučuje kvadratnim glasanjem sa mogućnošću delegiranja. Ograničeno četirima principima sistema, zaštitnim vetom fondacije i licencama. Poglavlje 10.

**Progresivna decentralizacija — **Strukturirana putanja od centralizovanog ka decentralizovanom upravljanju. Dve faze sa merljivim pragom prelaza (1.000.000 POEN-a). Poglavlje 10.

**Kvadratno glasanje — **Mehanizam odlučivanja u Gornjem Kolu. Glasačka moć jednaka celobrojnoj vrednosti kvadratnog korena iz broja aktivnih ZRNA, zaokruženoj naniže. Poglavlje 10.

**Delegiranje — **Prenos glasačke moći sa jednog čuvara Kola na drugog. Delegiraju se glasovi, ne ZRNO. Opšte — delegat glasa na sva pitanja. Revokabilno. Delegirani glasovi sabiraju se sa sopstvenim glasovima delegata. Pravila delegiranja, uključujući efekte opoziva i ograničenja delegiranja, utvrđuju se Pravilnikom o Gornjem Kolu. Poglavlje 10.

**Zaštitni veto — **Pravo fondacije da odbije odluku koja ugrožava operativnu i finansijsku održivost fondacije pre dostizanja finansijske samostalnosti. Mora biti obrazložen. Gasi se trajno i jednosmerno kada finansijska sredstva fondacije dostignu prag finansijske samostalnosti utvrđen posebnim pravilnikom. Poglavlje 10.

### Moduli

**Krug — **Organizaciona jedinica zasnovana na zajedničkom interesu ili delatnosti. Nema pravni subjektivitet. Poglavlje 9, Modul 1.

**Zadruga — **Lokalna organizaciona jedinica zasnovana na teritorijalnom principu. Registruje se po Zakonu o zadrugama i ima pun pravni subjektivitet. Dve funkcije: lokalna koordinacija i raspodela dobara na lokalitetu, i podsticajna (mehanizam rasta). Ne potvrđuje stvarnost korisnika. Učešće uređuje Pravilnik o zadrugama. Poglavlje 9, Modul 2.

**Socijalni programi — **Mehanizam automatskog evidentiranja POEN-a za kvalifikovane grupe korisnika čije strukturno učešće u zajedničkom dobru protokol prepoznaje iako se ne ispoljava kroz pojedinačne aktivnosti. Početne grupe: roditelji, stariji korisnici, osobe sa invaliditetom, učenici i studenti. Poglavlje 9, Modul 3.

**Rast krugova i zadruga — **Mehanizam evidentiranja POEN-a aktiviran sa Modulima 1 (Krugovi) i 2 (Zadruge). Protokol upisuje nove zapise POEN-a u skladu sa brojem članova organizacione jedinice i dostizanjem definisanih pragova. POEN-i se evidentiraju u zapisu kruga ili zadruge kao organizacione jedinice, ne u zapisima pojedinačnih članova. Nije doprinos korisnika u smislu ostalih kategorija. Poglavlje 9.

### Strukturni principi

**Nekonvertibilnost — **Strukturni princip sistema. Nijedna obračunska jedinica se ne može konvertovati u novac ni u bilo koje sredstvo sa spoljnom vrednošću. Ne može se ukinuti nijednom upravljačkom odlukom. Poglavlje 4.

**Odsustvo imovinskog prava nad zapisima — **Strukturni princip sistema. Korisnik nema imovinsko pravo nad zapisom svog doprinosa. Zapisi su podaci u evidenciji, ne sredstva. Ne može se ukinuti nijednom upravljačkom odlukom. Poglavlje 4.

**Nepovratnost donacija — **Strukturni princip sistema. Dinarska donacija fondaciji je nepovratna. Donator ne stiče pravo na povraćaj, upravljačko pravo ni udeo u sistemu. Ne može se ukinuti nijednom upravljačkom odlukom. Poglavlje 4.

**Minimizacija podataka — **Strukturni princip sistema. Platforma prikuplja samo podatke neophodne za funkcionisanje sistema. Fondacija ne čuva lične podatke korisnika platforme u sopstvenim bazama. Ne može se ukinuti nijednom upravljačkom odlukom. Poglavlje 4.

# Prilog D: Tehničke i organizacione mere bezbednosti

Ovaj prilog opisuje tehničke i organizacione mere koje fondacija primenjuje na infrastrukturi na kojoj se podaci nalaze, u skladu sa obavezom primene mera primerenih riziku (čl. 51 ZZPL-a). Mere se primenjuju na sve kategorije podataka opisane u poglavlju 12, sa pojačanim merama za posebne kategorije podataka i podatke maloletnih lica. Konkretna implementacija se prilagođava aktuelnom stanju infrastrukture i ažurira sa razvojem sistema.

### Pseudonimizacija i razdvajanje podataka

Zapisi u evidenciji protokola vezani su za pseudonime, ne za lična imena korisnika. Ime i prezime vodi se samo u evidenciji identiteta, zasebnoj evidenciji koju vidi samo administratorski tim fondacije; ime i prezime korisnika sa spiska za poziv vidi i član Kola koji ga poziva, dok je poziv otvoren; u nju se ne upisuju jedinstveni matični broj građana ni podaci iz isprava. Pseudonimizovani podaci ostaju lični podaci u smislu ZZPL-a (čl. 4 st. 1 t. 3a) jer se, uz dodatne informacije, mogu povezati sa identifikovanom osobom.

Fondacija ne čuva lične podatke korisnika platforme — svi podaci korisnika čuvaju se na infrastrukturi protokola. Fondacija direktno čuva samo bankovnu dokumentaciju donacija i evidenciju o vezi između pravnog lica pokrovitelja i korisnika na čiji zapis se doprinos evidentira. Ovo razdvajanje je dizajnerska odluka opisana u poglavlju 12.

### Šifrovanje

Podaci u prenosu se štite TLS enkripcijom, minimalno verzija 1.2. Komunikacija između korisnika i sistema, između komponenti sistema i između sistema i eksternih servisa odvija se isključivo preko šifrovanih kanala.

Podaci u mirovanju se štite enkripcijom na nivou skladištenja. Identifikacioni podaci korisnika (pseudonim, email adresa), podaci o donacijama, podaci o pokroviteljstvu i posebne kategorije podataka šifruju se pre skladištenja. Ključevi za enkripciju čuvaju se odvojeno od šifrovanih podataka, sa kontrolisanim pristupom ključevima.

### Kontrola pristupa

Pristup podacima je zasnovan na principu minimalnog pristupa (čl. 51 st. 2 ZZPL-a) — svaki korisnik sistema, svaki administrator i svaki proces ima pristup samo onim podacima koji su neophodni za obavljanje njegove funkcije.

Administrativni pristup infrastrukturi — hostingu, bazi podataka, repozitorijumu, skladištu slika i email servisu — zahteva višefaktorsku autentifikaciju. Pristup identifikacionim podacima korisnika ograničen je na ovlašćena lica u fondaciji. Pristup evidenciji u protokolu je automatizovan — protokol pristupa podacima po pravilima, bez manuelne intervencije.

Korisnici sistema pristupaju sopstvenim podacima i pseudonimnoj evidenciji drugih korisnika, u obimu koji odgovara njihovom statusu. Korisnici ne mogu da pristupe identifikacionim podacima drugih korisnika osim ako ti korisnici izričito ne odaberu da budu vidljivi. Izuzetak su ime i prezime i broj telefona korisnika sa spiska za poziv: otvaraju se samo članu Kola koji je poziv otvorio i samo dok je poziv otvoren, a beleži se ko ih je otvorio.

Pristup posebnim kategorijama podataka (zdravstveno stanje, invaliditet, roditeljski status, studentski status) ograničen je na proces verifikacije statusa i ne čuva se nakon verifikacije — u sistemu ostaje samo minimalni zapis o pripadnosti grupi i datum verifikacije.

### Evidencija pristupa

Administratorske radnje nad podacima korisnika beleže se u revizijskom dnevniku — ko je radnju izvršio, kada i nad kojim zapisom. Dnevnik je dostupan samo superadministratoru i koristi se za otkrivanje neovlašćenog postupanja. IP adresa i podaci o uređaju uz administratorske radnje se ne beleže.

### Integritet evidencije

Evidencija doprinosa u protokolu je zaštićena od neovlašćene promene. Svaki zapis u evidenciji je vremenski označen. Zapis se ne menja i ne briše: ispravka se izvršava novim protivzapisom, a zbir svih zapisa se svakodnevno proverava (nulti zbir). Ovo je dizajnersko pravilo obezbeđeno softverskom arhitekturom centralizovane evidencije, ne svojstvo distribuirane infrastrukture. Redovne provere konzistentnosti obezbeđuju da evidencija u svakom trenutku odgovara pravilima protokola.

### Zaštita posebnih kategorija podataka

Posebne kategorije podataka nastaju aktiviranjem Modula 3 (Socijalni programi) i Modula 4 (Deca). Obrada ovih podataka podleže pojačanim zahtevima (čl. 17 ZZPL-a).

Fondacija ne čuva kopije podnesene dokumentacije — u sistemu ostaje samo minimalni zapis o pripadnosti kvalifikovanoj grupi i datum verifikacije statusa. Pristup ovim podacima ograničen je na proces verifikacije. Podaci se čuvaju odvojeno od opšte evidencije aktivnosti i zaštićeni su dodatnim nivoom enkripcije.

Podaci maloletnih lica (Modul 4) podležu pojačanoj zaštiti u skladu sa čl. 16 ZZPL-a. Saglasnost roditelja ili zakonskog zastupnika evidentira se i čuva odvojeno. Oba modula aktivirana su tek po ažuriranju procene uticaja na zaštitu podataka (DPIA).

### Procena uticaja na zaštitu podataka (DPIA)

Fondacija sprovodi procenu uticaja na zaštitu podataka pre početka obrade (čl. 54 ZZPL-a). DPIA se ažurira pre aktiviranja svakog modula koji uvodi obradu novih kategorija podataka; tako su aktivirani Modul 3 (posebne kategorije) i Modul 4 (maloletna lica). Rezultati DPIA su dostupni direktoru Fondacije i služe kao osnov za primenu odgovarajućih mera zaštite.

### Bekap i oporavak

Podaci se redovno bekapuju na geografski odvojene lokacije. Bekap uključuje evidenciju protokola, identifikacione podatke i konfiguraciju sistema. Rezervna kopija baze pravi se svakog sata i čuva se na dve odvojene lokacije (14, odnosno 30 dana); postupak oporavka iz kopije je opisan, a njegovo redovno testiranje tek treba uvesti.

Bekap podaci podležu istim merama zaštite kao primarni podaci — šifrovanje, kontrola pristupa, evidencija pristupa.

### Prekogranični prenos podataka

Ako infrastruktura sistema uključuje servere van Republike Srbije, prenos ličnih podataka van zemlje podleže pravilima ZZPL-a o prekograničnom prenosu (čl. 65–69). Fondacija obezbeđuje da prenos podataka u treće zemlje bude zasnovan na adekvatnom nivou zaštite — odlukom o adekvatnosti, odgovarajućim merama zaštite ili odstupanjima predviđenim zakonom. Izbor cloud provajdera uzima u obzir lokaciju servera i primenjiv pravni okvir za zaštitu podataka u jurisdikciji u kojoj se serveri nalaze.

### Upravljanje incidentima

Fondacija ima definisanu proceduru za upravljanje bezbednosnim incidentima. Procedura uključuje: detekciju incidenta, procenu ozbiljnosti, ograničavanje štete, otklanjanje uzroka, obaveštavanje pogođenih korisnika i obaveštavanje Poverenika za informacije od javnog značaja i zaštitu podataka o ličnosti u roku od 72 sata od saznanja za incident (čl. 52 ZZPL-a).

Svaki incident se dokumentuje sa opisom uzroka, pogođenih podataka, preduzetih mera i pouka za sprečavanje budućih incidenata. Ako incident može da prouzrokuje visok rizik za prava i slobode korisnika, fondacija obaveštava pogođene korisnike bez nepotrebnog odlaganja (čl. 53 ZZPL-a).

### Redovno testiranje

Svaka izmena koda pre puštanja u rad prolazi automatske testove, uključujući testove koji nad izvornim kodom proveravaju da pravila sistema i zaštite podataka nisu narušena. Penetraciono testiranje i simulacija incidenata još nisu sprovedeni; Fondacija ih uvodi pre punog pokretanja sistema, a rezultate dokumentuje i koristi za unapređenje mera.

### Fizička bezbednost

Fondacija ne drži sopstvene servere: sistem radi na infrastrukturi obrađivača u oblaku. Fondacija bira provajdere koji imaju sertifikovane fizičke mere zaštite (ISO 27001 ili ekvivalent) i ugovorom reguliše obaveze provajdera u vezi sa bezbednošću, uključujući obaveze iz ugovora o obradi podataka (čl. 45 ZZPL-a).

### Organizacione mere

Lica koja imaju pristup podacima korisnika potpisuju obavezu čuvanja poverljivosti. Fondacija uvodi obuku lica sa administratorskim pristupom o zaštiti podataka i bezbednosti informacija. Jasna podela odgovornosti u domenu bezbednosti. Lice za zaštitu podataka Fondacija određuje kada za to nastane obaveza iz čl. 56 ZZPL-a; do tada pitanja zaštite podataka vodi direktor, a kontakt je privatnost@ekolo.rs. Ako fondacija angažuje treća lica za održavanje infrastrukture, ta lica su obrađivači podataka u smislu ZZPL-a (čl. 45) i odnos se reguliše ugovorom o obradi podataka.

### Razvoj softvera

Softver protokola se razvija po principima bezbednog razvoja i zaštite po dizajnu (čl. 50 ZZPL-a). Kod se pregleda pre puštanja u produkciju. Poznate ranjivosti se prate i otklanjaju u definisanim rokovima. Ažuriranja sistema se primenjuju planski, sa testiranjem u kontrolisanom okruženju pre primene na produkcioni sistem. Izvorni kod je dostupan pod AGPL-3.0 licencom, što omogućava nezavisnu reviziju bezbednosti od strane zajednice i trećih lica.

# Prilog E: Mapiranje Ostrom dizajn principa na KOLO arhitekturu

Elinor Ostrom je na osnovu empirijskog istraživanja zajednica koje uspešno upravljaju zajedničkim dobrima formalizovala osam dizajn principa za dugoročnu održivost institucija kolektivnog upravljanja (Ostrom, 1990). Ovi principi su izvorno formulisani za rivalska zajednička dobra — pašnjake, ribnjake, vodene resurse — gde korišćenje od strane jednog umanjuje dostupnost za druge. KOLO sistem je nerivalno digitalno zajedničko dobro (up. Hess i Ostrom, 2007) — softver, pravila i infrastruktura čije korišćenje od strane jednog korisnika ne umanjuje dostupnost za druge, sa pozitivnim mrežnim efektom koji uvećava korisnost sa brojem korisnika. Ova razlika je bitna jer neki principi dobijaju drugačiji oblik u kontekstu nerivalnog dobra.

Ovaj prilog mapira svaki od osam principa na konkretne elemente KOLO arhitekture.

### Princip 1: Jasno definisane granice (Clearly defined boundaries)

*Ostrom: *Granice zajedničkog dobra i krug korisnika koji imaju pravo pristupa moraju biti jasno definisani.

*KOLO: *Sistem razlikuje četiri statusa punoletnih korisnika sa eksplicitno definisanim pravima pristupa za svaki status. Korisnik ima pristup pregledu sistema, razmeni i učešću u ažuriranju evidencije POEN-a. Član bez potvrde, uveden u Kolo, ima prava učesnika, ali ne potvrđuje druge i ne glasa. Član Kola (potvrđen jednom važećom potvrdom) ima pun pristup razmeni i evidenciji doprinosa. Čuvar Kola ima dodatna prava upravljanja i poziciju u obračunskom sistemu. Prelaz između statusa je definisan pravilima sistema — verifikacijom i potvrdom u lancu potvrda, odnosno upisom ZRNA po merljivim uslovima. Dokaz stvarnosti kroz lanac potvrda (poglavlje 7) obezbeđuje da iza svakog učesnika stoji stvarna, jedinstvena osoba. Granice zajedničkog dobra su definisane licencama (AGPL-3.0 i CC BY-SA 4.0, poglavlje 3) i četirima strukturnim principima (poglavlje 4).

*Poklapanje: *Strukturno. Granice su jasnije nego u većini Ostrom primera jer su ugrađene u softver, ne u društvene konvencije.

### Princip 2: Podudarnost pravila sa lokalnim uslovima (Congruence between appropriation and provision rules and local conditions)

*Ostrom: *Pravila o korišćenju i doprinosu moraju biti prilagođena lokalnim uslovima.

*KOLO: *Pravila protokola postavljaju ljudi, ne algoritam. U Fazi 1, osnivač i fondacija prilagođavaju parametre na osnovu operativnog iskustva. U Fazi 2, Gornje Kolo menja pravila kvadratnim glasanjem. Parametri su operativni i podložni promeni — jedino strukturni limiti (poglavlje 4) su iznad upravljačke moći. Modularna arhitektura (poglavlje 9) omogućava prilagođavanje — moduli se aktiviraju prema potrebama zajednice. Zadruge (Modul 2) kao lokalne organizacione jedinice omogućavaju da se raspodela na lokalitetu organizuje po sopstvenim pravilima zadruge, u okviru pravila sistema.

*Poklapanje: *Strukturno. Mehanizam promene pravila je eksplicitno dizajniran sa razlikovanjem promenljivih parametara i nepromenjljivih principa.

### Princip 3: Kolektivno odlučivanje (Collective-choice arrangements)

*Ostrom: *Većina korisnika na koje utiču pravila može da učestvuje u menjanju tih pravila.

*KOLO: *Gornje Kolo — telo zajednice koje čine čuvari Kola koji su aktivirali ZRNO — kvadratnim glasanjem utvrđuje predloge o pravilima protokola, koje Upravni odbor fondacije usvaja svojim aktom (poglavlje 10). Pravo glasanja proizlazi iz evidentiranog doprinosa — ZRNO se upisuje na osnovu akumulirane evidencije POEN-a, čime glasačka moć pripada čuvarima Kola koji aktivno koriste i doprinose zajedničkom dobru. Svi korisnici sistema, bez obzira na status, učestvuju u procesu odlučivanja kroz inicijative i javnu raspravu pre glasanja. Delegiranje glasova adresira problem participacije.

*Poklapanje: *Strukturno. Pravo glasanja pripada čuvarima Kola, koji aktivno doprinose zajedničkom dobru, dok svi korisnici učestvuju u diskusiji — što odgovara Ostrom primerima gde glasaju aktivni korisnici zajedničkog dobra.

### Princip 4: Nadzor (Monitoring)

*Ostrom: *Nadzornici koji aktivno prate stanje zajedničkog dobra i ponašanje korisnika su odgovorni korisnicima ili su sami korisnici.

*KOLO: *Protokol evidentira svaku aktivnost u sistemu — svaku razmenu, svaki doprinos, svaki čin verifikacije (poglavlja 6 i 7). Evidencija je dostupna korisnicima sistema u pseudonimnom obliku (poglavlje 12). Nadzornici širenja — čuvari Kola, uključujući osnivače — proveravaju legitimnost verifikacija (poglavlje 7). Čuvari Kola verifikuju izvršenje operativnih zadataka (poglavlje 8.3). Transparentnost pravila i evidencije omogućava svakom korisniku da uoči neregularne obrasce.

*Poklapanje: *Strukturno. Nadzor je automatizovan (protokol beleži sve) i decentralizovan (čuvari Kola vrše nadzornu funkciju). Nadzornici su sami korisnici sistema sa evidentiranim doprinosom.

### Princip 5: Graduirane sankcije (Graduated sanctions)

*Ostrom: *Korisnici koji krše pravila dobijaju sankcije proporcionalne ozbiljnosti i kontekstu prekršaja.

*KOLO: *Sistem primenjuje sankcije za kršenja — posebno za lažnu verifikaciju: poništenje lažne verifikacije i zapisa POEN-a nastalih po njoj, nadoknadu na teret verifikatora, koja njegov zapis može oboriti u negativnu vrednost (čl. 20b Pravilnika o dokazu stvarnosti), i suspenziju, odnosno isključenje, po postupku iz Uslova korišćenja i uz pravo na prigovor (čl. 21 Pravilnika o dokazu stvarnosti; poglavlje 7). Nadoknada je srazmerna onome što je na osnovu lažne verifikacije izvučeno iz mreže, a isključenje je mera koja se izriče po pravilu. Verifikator koji lažno potvrdi rizikuje sopstveni zapis POEN-a i položaj u sistemu (poglavlje 11). Nekonvertibilnost obezbeđuje da je interna pozicija jedina stvar koju korisnik može da izgubi — ali za aktivnog korisnika to je značajan gubitak.

*Poklapanje: *Strukturno. Graduiranost je eksplicitna i proporcionalna.

### Princip 6: Mehanizmi za rešavanje sporova (Conflict-resolution mechanisms)

*Ostrom: *Korisnici imaju brz pristup mehanizmima za rešavanje sporova.

*KOLO: *Korisnici mogu da podnose primedbe i žalbe na funkcionisanje sistema fondaciji (u obe faze) i Gornjem Kolu (u Fazi 2). Proces odlučivanja u Gornjem Kolu uključuje period javne rasprave u kome cela zajednica može da komentariše i osporava predloge pre glasanja (poglavlje 10). Četiri principa sistema, licence zajedničkog dobra i zakonske obaveze Upravnog odbora apsolutno ograničavaju odluke, a zaštitni veto fondacije štiti njenu operativnu i finansijsku održivost do finansijske samostalnosti. Korisnik koji se ne slaže sa odlukama zadržava pravo izlaska iz sistema sa ostvarivanjem prava iz poglavlja 12 (up. Hirschman, 1970). Konkretne procedure za podnošenje primedbi i rešavanje sporova definisane su u pravilniku sistema.

*Poklapanje: *Strukturno. Mehanizmi postoje na oba nivoa (fondacija i Gornje Kolo), sa definisanim procedurama u pravilniku sistema.

### Princip 7: Minimalno priznanje prava na organizovanje (Minimal recognition of rights to organize)

*Ostrom: *Spoljna vlast (država) ne osporava pravo korisnika da uspostave sopstvene institucije.

*KOLO: *Fondacija je registrovana po Zakonu o zadužbinama i fondacijama — srpski pravni sistem prepoznaje pravni oblik koji KOLO koristi. Međunarodni institucionalni okvir (Prilog A) — Akcioni plan EU, UN rezolucije, ILO rezolucija, OECD preporuka — aktivno podržava tip entiteta u koji se KOLO funkcionalno uklapa. Srbija u procesu pristupanja EU ulazi u regulatorno okruženje koje prepoznaje socijalnu i solidarnu ekonomiju. Licence (AGPL-3.0 i CC BY-SA 4.0) štite zajedničko dobro od aproprijacije.

*Poklapanje: *Strukturno. Pravni oblik je prepoznat, a međunarodni institucionalni okvir aktivno podržava kategoriju entiteta u koju se KOLO uklapa.

### Princip 8: Ugnježdeni sistemi (Nested enterprises)

*Ostrom: *Za veće sisteme, upravljačke aktivnosti su organizovane u više slojeva ugnježdenih struktura.

*KOLO: *Sistem ima višeslojnu strukturu: korisnici → krugovi i zadruge (kolektivni oblici — interesne grupe, Modul 1, i teritorijalne jedinice, Modul 2) → Gornje Kolo (telo zajednice koje utvrđuje predloge o pravilima) → fondacija (pravni instrument). Svaki sloj ima definisane nadležnosti. Krugovi nemaju pravni subjektivitet. Zadruge imaju pun pravni subjektivitet po Zakonu o zadrugama. Gornje Kolo utvrđuje predloge o pravilima celokupnog sistema. Modul internacionalizacije (Modul 5) predviđa geografsko širenje sa jedinstvenim protokolom.

*Poklapanje: *Strukturno u dizajnu. Modularna arhitektura predviđa ugnježdene slojeve, a funkcionisanje u praksi zavisi od iskustva sa kasnijim fazama sistema.

### Napomena o primenljivosti

Ostrom principi su formulisani na osnovu istraživanja rivalskih zajedničkih dobara — resursa čije korišćenje od strane jednog umanjuje dostupnost za druge. KOLO sistem je pretežno nerivalno zajedničko dobro — softver, pravila i infrastruktura su dostupni svim korisnicima bez umanjenja. Rivalski element postoji na nivou ZRNA (ukupno milion, upis jednog smanjuje raspoložive za ostale) i na nivou razmene (zero-sum redistribucija POEN-a). Ova kombinacija rivalnih i nerivalnih elemenata čini KOLO hibridnim zajedničkim dobrom — kategorijom koju Hess i Ostrom (2007) analiziraju u kontekstu digitalnih zajedničkih dobara.

Mapiranje pokazuje da je KOLO arhitektura dizajnirana sa ciljem da adresira svih osam principa. Poklapanje je strukturno za svih osam — principi su ugrađeni u protokol, upravljanje i pravni okvir sistema kao dizajnerske odluke, ne kao naknadne adaptacije. Pitanje da li dizajn funkcioniše kako je predviđeno je empirijsko — odgovor zavisi od iskustva sa funkcionisanjem sistema u praksi.
