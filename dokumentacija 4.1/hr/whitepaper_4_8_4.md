> **Neslužbeni prijevod.** Hrvatska verzija dana je isključivo radi lakšeg razumijevanja. Pravno je obvezujući srpski izvornik; u slučaju bilo kakvih odstupanja prednost ima srpska verzija.

# KOLO Whitepaper

*Participativni sustav zajedničkog dobra*

# Sažetak

Zajednice koje žele organizirati vlastitu razmjenu suočavaju se s trima problemima koje nijedan postojeći model ne rješava istodobno: skaliranje, povjerenje i regulatorni okvir. Trampa ne skalira. Vremenske banke i LETS sustavi zahtijevaju povjerenje koje ne mogu osigurati kad prerastu lokalnu skupinu. Lokalne su valute zbog svojih strukturnih obilježja podložne kvalifikaciji kao financijski instrumenti, čime potpadaju pod regulatorne okvire koji im nisu namijenjeni. Razvoj digitalne infrastrukture, pojava modela utemeljenih na zajedničkom dobru i institucionalno prepoznavanje socijalne ekonomije na razini EU-a i UN-a stvaraju uvjete u kojima cjelovito rješenje postaje izvedivo.

KOLO je participativni sustav zajedničkog dobra koji te probleme adresira evidencijom doprinosa — bilježenjem tko je pridonio, koliko i na koji način, kroz formalizirana pravila ugrađena u softver.

U središtu sustava je zajedničko dobro — kolektivno dobro svih korisnika nad kojim nijedan pojedinac, uključujući osnivača, nema individualno vlasničko pravo, a koje ne predstavlja kolektivno vlasništvo u smislu važećih imovinskopravnih kategorija srpskog prava. Doprinosi i položaj evidentiraju se kroz protokol i njegove dvije obračunske jedinice: POEN i ZRNO. Protokol je tehnički mehanizam zajedničkog dobra — vodi evidenciju, obračunava odnose i izvršava pravila koja postavljaju ljudi.

Integritet sustava počiva na modelu dokaza stvarnosti — lancu potvrda utemeljenom na osobnom poznanstvu ili na razgovoru nakon poziva — u kojem sudionici utvrđuju stvarnost i kontinuitet novih korisnika; da ista osoba nema drugi račun verifikator ne jamči, nego to utvrđuje zaklada, usporedbom podataka i obraćanjem osobi. Taj je model svjesna dizajnerska odluka koja minimizira prikupljanje osobnih podataka, u skladu s načelom minimizacije podataka ugrađenim u sustav.

Oko zajedničkog dobra stoje dva aktera. KOLO Zaklada je pravni instrument — pravna osoba registrirana u Somboru po Zakonu o zadužbinama i fondacijama, koja zajedničkom dobru i protokolu daje pravni oblik prepoznatljiv državi i pravu, prima dinarske donacije i drži infrastrukturu na kojoj protokol radi. Zaklada nije vlasnik sustava. KOLO Zajednicu čine svi korisnici sustava — oni ga koriste, doprinose mu i zajedno brinu o zajedničkom dobru, a u upravljanju sudjeluju kroz Gornje Kolo.

Zajednica financira Zakladu dinarskim donacijama. Zaklada troši ta sredstva na infrastrukturu i programe. Dinarska sredstva ne ulaze u interni obračunski sustav — ne postoji konverzija dinara u POEN-e ni POEN-a u dinare. Doprinos donatora evidentira se u POEN-ima, ali ta evidencija nije protuusluga za donaciju — to su dva pravno neovisna akta (poglavlje 4).

Protokol vodi evidenciju kroz dvije obračunske jedinice. POEN evidentira doprinos — zapise upisuje isključivo protokol, korisnici nemaju imovinsko pravo nad njima, a POEN se ne može konvertirati u novac niti koristiti izvan sustava. ZRNO evidentira položaj — ukupan je broj fiksiran na milijun, ZRNO je neprenosivo između korisnika, a čuvar Kola — član Kola kojem je ZRNO upisano — može ga koristiti za sudjelovanje u upravljanju ili za poziciju u obračunskom sustavu. Obračunski koeficijent između tih dviju jedinica administrativna je veličina koju protokol izračunava dnevno (poglavlje 6).

Sustav je modularan. Osnova — Zaklada, protokol, POEN, ZRNO, korisnici, dokaz stvarnosti, financijski i operativni doprinos — funkcionira samostalno. Dodatni se moduli aktiviraju prema potrebi i spremnosti sustava. Upravljanje slijedi putanju progresivne decentralizacije — od osnivača i zaklade u prvoj fazi, do Gornjeg Kola koje nastaje automatski s aktivacijom ZRNA kao upravljačko tijelo sustava koje čine čuvari Kola koji su aktivirali ZRNO (poglavlje 10). Sadržaj sustava licenciran je pod CC BY-SA 4.0, softver pod AGPL-3.0.

Zaklada je voditelj obrade podataka u smislu ZZPL-a — određuje svrhe i sredstva obrade — ali ne čuva osobne podatke korisnika platforme u vlastitim bazama: svi se podaci korisnika čuvaju na infrastrukturi protokola u pseudonimnom obliku. Sustav prikuplja samo podatke nužne za funkcioniranje, a zaklada osigurava primjenu mjera zaštite na infrastrukturi na kojoj se podaci nalaze.

Pravna pozicija sustava — uključujući kvalifikaciju po Zakonu o digitalnoj imovini, Zakonu o platnim uslugama i Zakonu o tržištu kapitala — obrazložena je u poglavljima 4 i 6.

Ovaj dokument opisuje arhitekturu sustava, obračunski okvir, organizacijsku strukturu, module, upravljanje, poticajne mehanizme, zaštitu podataka i pravnu poziciju svakog elementa. Namijenjen je regulatornim tijelima, akademskoj zajednici, potencijalnim korisnicima i svakome tko želi razumjeti što KOLO jest — i jednako važno, što nije.

# 1. Problem

Troškovi koordinacije opadaju s razvojem digitalne infrastrukture. Raste broj ljudi koji traže modele rada i suradnje izvan klasičnog odnosa poslodavac–zaposlenik. Lokalne se ekonomije suočavaju s fenomenom koji literatura o lokalnim multiplikatorima dokumentira — vrijednost koja nastaje u zajednici napušta je prije nego što se u njoj iskoristi (Sacks, 2002; NEF, 2002). U tim uvjetima zajednice mogu preuzeti veću odgovornost za vlastitu održivost — ali za to im je potreban cjelovit sustav koji integrira skaliranje, povjerenje i regulatornu usklađenost, a koji u postojećim modelima ne postoji.

Zajednice koje žele organizirati vlastitu razmjenu suočavaju se s trima problemima koje nijedan postojeći model ne rješava istodobno.

**Skaliranje.** Neposredna razmjena — trampa — funkcionira između dvoje ljudi koji imaju ono što drugom treba, u isto vrijeme, na istom mjestu. Taj se uvjet rijetko ispunjava. Vremenske banke, koje bilježe sate rada kao jedinicu razmjene, rješavaju problem istodobne potrebe, ali u svom osnovnom obliku pretpostavljaju da je svaki sat rada jednako vrijedan — sat računovodstva i sat košnje trave (Cahn, 2004). To ograničava složenost razmjene koju sustav može podržati. LETS sustavi (Local Exchange Trading Systems) dopuštaju fleksibilniju razmjenu unutar zatvorene skupine, ali empirijski ostaju lokalni i mali — kad prerastu određeni broj korisnika, gube koheziju jer se povjerenje između članova razrjeđuje (Seyfang, 2006; North, 2007). Lokalne valute i sustavi uzajamnog kredita uvode formalniji oblik, ali zahtijevaju institucionalnu potporu i često ovise o konvertibilnosti u nacionalnu valutu, čime ostaju vezane za isti financijski okvir koji pokušavaju dopuniti — Bristolska funta (prestala s radom 2021.) i Sardex na Sardiniji (restrukturiran 2022.) ilustriraju te granice.

**Povjerenje.** Svaki sustav razmjene zahtijeva da korisnici vjeruju da će njihov doprinos biti priznat i da neće biti iskorišteni. U malim se skupinama povjerenje gradi licem u lice. Kad sustav raste, osobno povjerenje prestaje biti dovoljno — potreban je institucionaliziran mehanizam koji zamjenjuje poznavanje svakog člana (usp. Luhmann, 1979., o razlici između personalnog i sustavnog povjerenja). Tradicionalno tu ulogu preuzima ili država (regulacijom i prisilom) ili tržište (cijenom kao signalom i ugovorom kao zaštitom). Postoje i drugi mehanizmi — reputacijski sustavi, socijalni kapital, mrežni učinci — ali nijedan od njih ne daje zajednici skup pravila koji je istodobno transparentan, predvidiv i primjenjuje se bez diskrecije pojedinca. Zajednicama koje žele organizirati vlastitu razmjenu potreban je upravo takav mehanizam: formalizirana pravila ugrađena u sam sustav.

**Regulatorni okvir.** Čak i kada zajednica riješi problem skaliranja i povjerenja, suočava se s pravnim okvirom koji je dizajniran za financijske instrumente, platne servise i digitalnu imovinu. Svaki interni sustav evidencije koji nalikuje novcu, valuti ili tokenu riskira da bude kvalificiran kao nešto što zahtijeva dozvolu, nadzor ili usklađenost s propisima koji nisu namijenjeni participativnim sustavima zajedničkog dobra. Lokalne valute i komplementarni sustavi diljem Europe suočili su se s tim problemom s različitim ishodima — Chiemgauer u Njemačkoj funkcionira u okviru jasnog regulatornog tretmana (Thiel, 2012), WIR u Švicarskoj reguliran je kao banka (Stodder, 2009), Bristolska se funta ugasila pod operativnim i regulatornim pritiskom. Zajednica koja želi evidencijom doprinosa organizirati vlastitu razmjenu mora od prvog dana voditi računa o tome kako će njezin sustav biti kvalificiran u pravnom prometu — ne naknadno, nego kao dio dizajna.

Ta su tri problema međusobno ovisna: rješavanje bilo koja dva bez trećeg ne daje održiv sustav. Sustav koji skalira bez mehanizma povjerenja raspada se čim preraste lokalnu skupinu. Sustav s povjerenjem ali bez skaliranja ostaje inicijativa bez šireg utjecaja. Sustav koji skalira i ima povjerenje ali ne adresira regulatorni okvir biva zaustavljen ili ograničen od strane pravnog sustava koji ga ne prepoznaje.

Pokušaji rješavanja tih problema imaju dugu povijest. Silvio Gesell je početkom dvadesetog stoljeća predložio Freigeld — novac s ugrađenim troškom držanja (demurrage), dizajniran da potiče cirkulaciju umjesto akumulacije (Gesell, 1916). Thomas Greco je sistematizirao načela uzajamnog kredita i komplementarnih valuta, pokazujući da zajednice mogu organizirati razmjenu bez bankarskog posredovanja (Greco, 2009). Neomutualistička tradicija, razvijena u radovima Kevina Carsona i drugih autora koji spajaju klasični mutualizam Proudhona sa suvremenim kooperativnim i digitalnim alatima, tražila je modele u kojima korisnici upravljaju sustavom koji koriste (Carson, 2007) — KOLO izrasta iz te tradicije.

Suvremena su istraživanja ponudila parcijalna rješenja. Elinor Ostrom je empirijski pokazala da zajednice mogu upravljati zajedničkim dobrima bez privatizacije i bez državne kontrole — pod uvjetom da postoje jasna pravila pristupa, doprinosa i odlučivanja (Ostrom, 1990). Yochai Benkler je opisao commons-based peer production kao način organizacije proizvodnje utemeljen na zajedničkim resursima i dobrovoljnom doprinosu, ni tržišni ni državni (Benkler, 2006). Platformski kooperativizam Trebora Scholza prenosi kooperativna načela na digitalne platforme (Scholz, 2016). Otvoreni kooperativizam Kostakisa i Bauwensa kombinira otvorene protokole, kooperativne strukture i zajedničko dobro u središtu (Bauwens, Kostakis i Pazaitis, 2019). Sensorica iz Montreala razvila je Open Value Network — sustav otvorenog evidentiranja doprinosa u kojem se svaki doprinos bilježi i vrednuje kroz value accounting (Braun i Hummel, 2019). Enspiral s Novog Zelanda koristi zakladu za upravljanje infrastrukturom koalicije misijski vođenih entiteta (Enspiral Foundation, 2016).

Svaki od tih modela rješava dio problema. Nijedan ne rješava sva tri istodobno. Sustavi uzajamnog kredita teško skaliraju izvan specifičnih institucionalnih uvjeta — čak i WIR, najuspješniji primjer s preko 60.000 članova, funkcionira kao regulirana banka, ne kao participativni sustav. Benklerov model commons-based peer production ne adresira regulatorni okvir kao element dizajna — konkretni projekti poput Linuxa i Wikipedije to rješavaju ad hoc, kroz pravne entitete koje formiraju naknadno. Ostromova načela opisuju uvjete za upravljanje zajedničkim dobrima, ali ne nude implementacijski okvir za digitalni participativni sustav. Platformske zadruge rješavaju vlasništvo ali ne rješavaju evidenciju doprinosa. Otvoreni kooperativizam Kostakisa i Bauwensa integrira otvorene protokole i zajedničko dobro, ali ne adresira regulatornu poziciju sustava u konkretnoj jurisdikciji. Sensoricin Open Value Network nema pravni instrument koji izrijekom adresira rizik regulatorne kvalifikacije evidencije doprinosa kao financijskog instrumenta. Enspiralova zaklada rješava pravni oblik, ali bez internog obračunskog sustava i evidencije doprinosa koja bi strukturirala sudjelovanje.

Ti modeli nisu ostali samo u akademskoj sferi. Tijekom posljednjeg desetljeća međunarodne su institucije prepoznale socijalnu ekonomiju — širu kategoriju u koju se funkcionalno uklapaju participativni sustavi zajedničkog dobra — kao legitiman smjer ekonomskog razvoja. Europska je komisija 2021. usvojila Akcijski plan za socijalnu ekonomiju s mjerama za razdoblje 2021.–2030., a Vijeće EU-a je 2023. usvojilo Preporuku o okvirnim uvjetima za socijalnu ekonomiju. Opća skupština UN-a je 2023. usvojila prvu rezoluciju o socijalnoj i solidarnoj ekonomiji (A/RES/77/281), a Međunarodna organizacija rada je 2022. formalno definirala taj sektor na 110. zasjedanju Međunarodne konferencije rada. Za Srbiju, koja usklađuje zakonodavstvo s pravnom stečevinom EU-a u procesu pristupanja, taj okvir nije apstraktan — to je smjer u kojem se kreće regulatorno okruženje u koje Srbija ulazi. Detaljna analiza tog institucionalnog okvira dana je u Prilogu A.

KOLO se pozicionira u institucionalnom smjeru koji EU, UN i ILO aktivno razvijaju — participativno upravljanje, zajedničko dobro, zaklade i zadruge kao pravni instrumenti. Razlika je u tome što KOLO pokušava adresirati sva tri problema — skaliranje, povjerenje i regulatorni okvir — u jednom integriranom sustavu, s evidencijom doprinosa kao središnjim mehanizmom.

Poglavlje koje slijedi opisuje viziju tog rješenja — što KOLO jest, gdje se nalazi u odnosu na postojeće modele i na kojim načelima počiva.

# 2. Vizija

Pitanje kako organizirati resurse i sustave koji su važni za više ljudi istodobno ima tri poznata odgovora — svaki s vlastitim ograničenjima.

Prvi je privatno vlasništvo. Netko posjeduje resurs, odlučuje o njegovoj uporabi i snosi posljedice te odluke. Taj model potiče učinkovitost i odgovornost, ali stvara asimetriju — vlasnik ima kontrolu, svi ostali imaju pristup samo pod njegovim uvjetima. Kad se to načelo primijeni na sustave razmjene, rezultat je platforma čiji vlasnik izvlači vrijednost iz interakcija koje stvaraju njezini korisnici.

Drugi je državno vlasništvo. Resurs pripada svima posredno, kroz instituciju koja ga drži u ime građana. Taj model osigurava pristup, ali uvodi birokraciju, udaljenost između korisnika i odluke te ovisnost o političkoj volji. Kad država preuzme ulogu jamca razmjene, rezultat je reguliran financijski sustav — stabilan, ali spor, skup i nedostupan zajednicama koje žele organizirati vlastitu razmjenu po vlastitim pravilima.

Treći je otvoreni pristup bez strukture — ono što je Garrett Hardin nazvao tragedijom zajedničkog dobra (Hardin, 1968). Resurs je dostupan svima, nitko ga ne čuva, i svatko ima poticaj da ga iskoristi prije drugih. Taj model završava iscrpljivanjem resursa. Hardinov je zaključak bio da zajedničko dobro ne može opstati bez privatizacije ili državne kontrole — zaključak koji se pokazao netočnim, ali koji je desetljećima oblikovao javnu politiku.

Elinor Ostrom je empirijski pokazala da taj zaključak nije točan (Ostrom, 1990). Zajednice diljem svijeta — od švicarskih planinskih pašnjaka do japanskih ribarskih sela — stoljećima uspješno upravljaju zajedničkim dobrima, bez privatizacije i bez države. Uvjet je da postoje jasna pravila — Ostrom ih je formalizirala kao osam dizajnerskih načela, među kojima su ključna: jasno definirane granice pristupa, pravila usklađena s lokalnim uvjetima, mehanizmi kolektivnog odlučivanja i graduirane sankcije za kršenja. Zajedničko dobro ne propada zato što je zajedničko. Propada kad nema strukturu.

KOLO polazi od tog uvida. Zajedničko dobro može biti središte sustava — ne kao apstraktna ideja, nego kao konkretna organizacijska struktura s pravilima, evidencijom i pravnim oblikom. Arhitektura je KOLO sustava dizajnirana s ciljem da adresira svih osam Ostrominih dizajnerskih načela — ne po analogiji, nego kao strukturni elementi ugrađeni u protokol, upravljanje i pravni okvir sustava. Mapiranje svakog načela na konkretne elemente KOLO arhitekture dano je u Prilogu E.

U KOLO sustavu zajedničko dobro nije resurs koji se troši — polje koje se ispaša ili riba koja se lovi. To je sustav sam — protokol, pravila, infrastruktura, sadržaj, evidencija doprinosa. Za razliku od klasičnog zajedničkog dobra koje je rivalsko — gdje korištenje jednog umanjuje korist drugog — osnova sustava — softver, pravila, sadržaj, infrastruktura — nerivalna je: korištenje od strane jednog korisnika ne umanjuje dostupnost za druge (usp. Hess i Ostrom, 2007., o digitalnim zajedničkim dobrima). Sustav ima i pozitivan mrežni učinak (usp. Katz i Shapiro, 1985) — što ga više ljudi koristi, to je sustav vrjedniji za sve koji u njemu sudjeluju, jer raste broj mogućih razmjena, opseg evidencije i kapacitet zajedničkog dobra.

Ali nerivalno zajedničko dobro ima svoj problem. Ako je korištenje besplatno i neograničeno, tko ga održava? Tko financira infrastrukturu? Tko donosi odluke? Open-source softver, najpoznatiji primjer nerivalnog zajedničkog dobra, suočava se s tim pitanjima desetljećima. Projekti koji opstaju — Linux, Wikipedia, Apache — opstaju jer su razvili strukture upravljanja, financiranja i odlučivanja. Ali te su strukture nastajale iterativno i post hoc, često kao odgovor na krize, ne kao dio inicijalnog dizajna. Mnogi drugi projekti nisu opstali upravo zato što te strukture nikad nisu uspostavili.

KOLO odgovara na to pitanje evidencijom. Sustav bilježi tko doprinosi, koliko doprinosi i na koji način doprinosi. Ta evidencija nije privatno vlasništvo korisnika — korisnik nema imovinsko pravo nad zapisom svog doprinosa. Ali evidencija omogućuje sustavu da prepozna doprinos, da ga mjeri i da na temelju njega strukturira sudjelovanje u upravljanju. Evidencija je posljedica aktivnosti — protokol bilježi da se doprinos dogodio, ali sam zapis nije prenosivo sredstvo niti imovina korisnika.

KOLO se razlikuje od srodnih modela po tome što integrira elemente koje oni rješavaju parcijalno. Za razliku od privatnog vlasništva, nitko ne posjeduje sustav — ni osnivač, ni zaklada, ni korisnici pojedinačno; zajedničko je dobro dobro svih korisnika, ali ne u smislu kolektivnog vlasništva nad kojim bi imali pravo raspolaganja. Za razliku od državnog vlasništva, sustav ne ovisi o političkoj volji, proračunu ni birokraciji — zaklada je pravni instrument, ne vlasnik, i zajednica financira zakladu, ne obrnuto. Za razliku od open-source modela, KOLO ima eksplicitan mehanizam evidencije doprinosa i strukturu upravljanja koja se aktivira na temelju tog doprinosa — open-source projekt bilježi tko je napisao kod, KOLO bilježi svaki oblik doprinosa i na temelju toga strukturira cijeli sustav.

Od kripto projekata razlikuje ga to što KOLO nema token kojim se trguje na tržištu, nema obećanje financijskog prinosa i nema špekulativni element — zapisi u protokolu su evidencija, ne imovina, a doprinos je jedini način stjecanja pozicije u sustavu. Protokol evidentira doprinos donatora u POEN-ima, ali donacija nije nužan ni povlašten put do upisa ZRNA — isti prag vrijedi za sve aktivnosti, uključujući one koje ne zahtijevaju nikakvu dinarsku donaciju, a pravni akt donacije i administrativni akt evidencije su odvojeni (poglavlje 4, poglavlje 6). Od platformskog kooperativizma razlikuje ga to što KOLO nije platforma u vlasništvu korisnika koja nudi usluge tržištu — KOLO je interni obračunski sustav u kojem se razmjena odvija unutar zajednice, a odnos s vanjskom ekonomijom ide isključivo kroz dinarske donacije zakladi.

Vizija je KOLO sustava zajedničko dobro sa strukturom. Sustav u kojem položaj nije ni altruističan ni špekulativan, nego evidentiran. Sustav u kojem doprinos nije nevidljiv, ali ni vlasništvo. Sustav koji ne obećava prinos, ali čija se korist za korisnike mijenja s aktivnošću zajednice — ta je promjena posljedica obračunskog koeficijenta, ne jamstvo nijedne osobe.

Poglavlja koja slijede opisuju kako taj dizajn funkcionira — zajedničko dobro s pravilima, evidencijom, pravnim oblikom i regulatornom pozicijom.

# 3. Zajedničko dobro i protokol

Zajedničko dobro u KOLO sustavu ima konkretan sadržaj. Čine ga: softver na kojem sustav radi, pravila po kojima funkcionira, evidencija doprinosa svih korisnika i sadržaj koji nastaje unutar sustava. Infrastruktura na kojoj ti elementi postoje — poslužitelji, baze podataka, mrežna oprema — nije sastavni dio zajedničkog dobra u istom smislu, ali jest operativni preduvjet bez kojega zajedničko dobro ne može funkcionirati; njezino je održavanje servisna obveza zaklade (poglavlje 5). Sve to zajedno — softver, pravila, evidencija doprinosa, sadržaj — jest zajedničko dobro. Kolektivno dobro svih korisnika sustava, nad kojim nijedan pojedinac, uključujući osnivača, nema individualno vlasničko pravo, a koje ne predstavlja kolektivno vlasništvo u smislu važećih imovinskopravnih kategorija — korisnici nemaju pravo raspolaganja zajedničkim dobrom niti pravo na udio u njemu. Pojam zajedničkog dobra (commons) u KOLO sustavu odgovara kategoriji koju je Elinor Ostrom definirala kao resurs kojim zajednica upravlja po vlastitim pravilima, bez privatizacije i bez državne kontrole (Ostrom, 1990), proširenom na digitalne zajedničke resurse u smislu Hess i Ostrom (2007).

Zajedničko dobro nije u vlasništvu nijednog pojedinačnog aktera u sustavu — ni osnivača, ni zaklade, ni korisnika pojedinačno. Svatko tko sudjeluje u sustavu ima pristup zajedničkom dobru i koristi ga pod jednakim uvjetima. Ti uvjeti nisu proizvoljni — definirani su pravilima koja postavljaju ljudi i koja se mijenjaju kroz procese upravljanja opisane u poglavlju 10 ovog dokumenta. Pravni mehanizmi koji osiguravaju da zajedničko dobro ostane kolektivno — licence AGPL-3.0 za softver i CC BY-SA 4.0 za sadržaj — opisani su u odjeljku o licencama na kraju ovog poglavlja.

Zajedničko dobro nije statično. Mijenja se sa svakom aktivnošću u sustavu — svaka razmjena, svaki doprinos, svaka verifikacija dodaje podatke u evidenciju i time ažurira stanje zajedničkog dobra. Svaka se takva promjena odvija kroz protokol, čime je osigurana konzistentnost i sljedivost.

## Protokol

Protokol je tehnički mehanizam zajedničkog dobra — skup pravila prevedenih u softver koji obavlja četiri funkcije.

Evidencija. Bilježi svaku aktivnost u sustavu — tko je pridonio, što, kada i koliko. Evidencija je trajan zapis stanja zajedničkog dobra.

Obračunavanje. Izračunava obračunski koeficijent između obračunskih jedinica na temelju stanja evidencije. Koeficijent proizlazi iz unaprijed definiranih pravila i podataka koje protokol bilježi — ne određuje ga nijedna osoba.

Primjena pravila. Kad sudionik ispuni uvjete za upis ZRNA, protokol to izvršava. Kad se odvija razmjena, ažurira evidenciju. Kad nastupi obračunsko razdoblje, izračunava novi koeficijent. Svaka je radnja automatska — protokol primjenjuje pravila, ne tumači ih.

Integritet. Osigurava konzistentnost evidencije — ukupni zapisi odgovaraju pravilima, nijedan zapis ne nastaje izvan definiranih mehanizama, retroaktivna promjena povijesti evidencije nije moguća. Ovo je dizajnersko pravilo osigurano softverskom arhitekturom centralizirane evidencije (poglavlje 4), a ne svojstvo distribuirane infrastrukture — tehničke su mjere opisane u Prilogu D.

Protokol ne donosi odluke o tome koja pravila vrijede. Pravila postavljaju ljudi — u sadašnjoj fazi osnivač i zaklada, u kasnijoj fazi Gornje Kolo kroz procese opisane u poglavlju 10. Protokol je instrument tih odluka, ne njihov izvor.

Četiri funkcije protokola — evidencija, obračunavanje, primjena pravila i čuvanje integriteta — izravno adresiraju nekoliko od osam dizajnerskih načela za upravljanje zajedničkim dobrima koja je formalizirala Elinor Ostrom (1990): jasno definirane granice (verifikacija korisnika, poglavlje 7), pravila usklađena s lokalnim uvjetima (parametri koje postavljaju ljudi, ne algoritam), mehanizmi praćenja (evidencija svake aktivnosti) i graduirane sankcije (definirane u pravilima sustava, poglavlje 7). Detaljno mapiranje svih osam načela na KOLO arhitekturu dano je u Prilogu E.

## Obračunske jedinice protokola

Protokol vodi evidenciju kroz dvije obračunske jedinice: POEN i ZRNO.

POEN evidentira doprinos i druge oblike sudjelovanja u zajedničkom dobru. Protokol evidentira doprinos kad korisnik pridonese zajedničkom dobru donacijom, pokroviteljstvom, operativnim doprinosom ili verifikacijom korisnika u lancu potvrda — u tim se slučajevima zapis bilježi u zapisu doprinositelja. Osim toga, doprinos se evidentira u POEN-ima i kroz rast krugova i zadruga (Moduli 1 i 2, gdje se zapisi evidentiraju u zapisu organizacijske jedinice) i kroz socijalne programe (Modul 3, automatska evidencija za kvalificirane skupine korisnika). ZRNO evidentira položaj — sudionik koji ispuni definirane uvjete upisuje ZRNO, čime se evidentira njegova pozicija u zajedničkom dobru. Ukupan broj ZRNA raspoloživih za upis je fiksiran. Obje su jedinice zapisi u evidenciji zajedničkog dobra, ne sredstva u vlasništvu korisnika — korisnik nema imovinsko pravo nad njima. Obračunski koeficijent između njih izračunava protokol na temelju stanja cjelokupne evidencije; taj se koeficijent mijenja s aktivnošću u sustavu i nijedan ga korisnik ne može kontrolirati pojedinačno.

Obračunske jedinice nisu novac, valuta, digitalna imovina ni financijski instrumenti. Poglavlje 6 detaljno opisuje kako ti zapisi nastaju, kako se koriste, kako se obračunavaju i zašto ne potpadaju pod regulatorne okvire dizajnirane za financijske instrumente.

## Licence

Softver i sadržaj zajedničkog dobra zaštićeni su licencama koje osiguravaju da ostanu zajednički. Licence pokrivaju kod i sadržaj — ne evidenciju ni infrastrukturu, čija zaštita počiva na drugim mehanizmima (pravna struktura zaklade, pravila protokola, četiri načela sustava iz poglavlja 4).

Softver sustava licenciran je pod AGPL-3.0 (GNU Affero General Public License, verzija 3.0). Ta licenca znači da je izvorni kod slobodan za korištenje, izmjenu i distribuciju, ali svaka izmijenjena verzija koja se koristi za pružanje usluga preko mreže mora također biti objavljena pod istom licencom. U praksi to znači da nitko ne može uzeti softver KOLO sustava, izmijeniti ga i pokrenuti zatvorenu verziju bez objave vlastitog koda. AGPL-3.0 štiti zajedničko dobro od privatizacije softvera.

Sadržaj sustava licenciran je pod CC BY-SA 4.0 (Creative Commons Attribution-ShareAlike 4.0 International). Ta licenca dopušta slobodno korištenje i preradu sadržaja pod dvama uvjetima: navođenje izvora i licenciranje prerađenog sadržaja pod istom ili kompatibilnom licencom. U praksi to znači da se sadržaj koji nastaje u sustavu može koristiti izvan njega, ali se ne može zatvoriti — svaka prerada mora ostati otvorena pod istim ili kompatibilnim uvjetima.

Izbor tih dviju licenci nije slučajan. Obje pripadaju obitelji copyleft licenci — mehanizama koji koriste autorsko pravo da bi pravno spriječili restriktivno relicenciranje. Copyleft osigurava da svaki derivat ostane dostupan pod istim ili kompatibilnim uvjetima, čime su softver i sadržaj zajedničkog dobra pravno zaštićeni od dvaju najvećih rizika: privatizacije softvera i zatvaranja sadržaja.

Za korisnike sustava te licence znače da softver i sadržaj koji se koriste unutar sustava ostaju dostupni svima — nijedan akter, ni osnivač, ni zaklada, ni korisnik, ne može ih relicencirati pod restriktivnijim uvjetima. Zajedničko dobro u širem smislu — uključujući evidenciju i pravila — zaštićeno je od prisvajanja dodatnim mehanizmima: strukturom zaklade, koja zajedničko dobro čuva, a nije njegov vlasnik i nema pravo raspolaganja njime (poglavlje 5), četirima načelima sustava koja se ne mogu ukinuti upravljačkom odlukom (poglavlje 4) i pravilima protokola koja sprječavaju jednostranu promjenu evidencije. Ovo nije deklaracija namjera, nego skup pravnih i tehničkih mehanizama ugrađenih u temelje sustava. Copyleft licenciranje kao pravna strategija zaštite zajedničkih digitalnih dobara ima osnovu u pravnoj teoriji autorskog prava (Lessig, 2004) i filozofiji slobodnog softvera (Stallman, 2002).

# 4. Što je KOLO — pravna pozicija sustava

KOLO je participativni sustav zajedničkog dobra. Ta definicija opisuje pravnu prirodu sustava i određuje njegovo mjesto u odnosu na postojeće pravne kategorije.

Participativni znači da sustav funkcionira kroz aktivnost svojih korisnika. Svaki zapis u evidenciji sustava nastaje kao posljedica konkretne aktivnosti korisnika — razmjene, doprinosa, organiziranja, verifikacije. Pozicija čuvara Kola u obračunskom sustavu mijenja se s aktivnošću cjelokupne zajednice — obračunski je koeficijent posljedica kolektivne aktivnosti svih korisnika, ne individualne pozicije jednog čuvara Kola. Čuvar Kola koji drži slobodno ZRNO bez vlastite aktivnosti zadržava evidentiran položaj, ali eventualna promjena tog položaja nastaje isključivo kao aritmetička posljedica aktivnosti drugih korisnika u sustavu — sustav ne stvara korist ciljano za neaktivne korisnike, niti bilo koja osoba obećava ili jamči promjenu pozicije. Čuvar Kola koji želi sudjelovati u upravljanju mora aktivirati ZRNO, čime ga isključuje iz mogućnosti otpisa — upravljačka funkcija zahtijeva aktivnu odluku i strukturno odricanje od obračunske fleksibilnosti. Eventualna promjena pozicije čuvara Kola očituje se isključivo u POEN-ima — zapisima u evidenciji koji nemaju vanjsku imovinsku vrijednost, ne mogu se konvertirati u novac i ne mogu napustiti sustav. Sustav ne predviđa mehanizam kroz koji bi korisnik uložio sredstva i čekao prinos koji ima vanjsku vrijednost — svaka je korist od promjene pozicije intrasistemska. Dinarske su donacije zakladi nepovratne i bez protuusluge — evidencija doprinosa donatora u POEN-ima jednostrani je administrativni zapis protokola, ne ekvivalent stjecanja pozicije u sustavu na temelju uplate.

Sustav znači da je riječ o organiziranom skupu pravila, mehanizama i odnosa koji čine funkcionalnu cjelinu. KOLO nije platforma u uobičajenom smislu — ne pruža usluge korisnicima u zamjenu za naknadu. KOLO nije mreža u smislu slobodnog povezivanja bez strukture. KOLO je sustav s definiranim pravilima pristupa, evidencije, obračuna i upravljanja.

Zajedničkog dobra znači da sve što sustav proizvodi i čuva jest kolektivno dobro svih korisnika. Nijedan korisnik nema u vlasništvu dio sustava. Nijedna institucija — uključujući zakladu — nema sustav u vlasništvu. Zajedničko je dobro kolektivno dobro svih korisnika, ali ne u smislu kolektivnog vlasništva nad kojim bi korisnici imali pravo raspolaganja — čija je zaštita osigurana licencama (AGPL-3.0 i CC BY-SA 4.0) i pravnom strukturom zaklade, koja ga čuva, a nije njegov vlasnik.

Ova kategorija — participativni sustav zajedničkog dobra — ne postoji kao formalna pravna kategorija u srpskom pravu. KOLO ne traži da bude prepoznat kao nova pravna kategorija — koristi postojeće pravne institute upravo zato što ne zahtijeva novo pravo. Zaklada je registrirana po Zakonu o zadužbinama i fondacijama. Licence su međunarodno priznati pravni instrumenti. Odnos između korisnika i sustava ugovorne je prirode — pristupanjem sustavu korisnik prihvaća pravila korištenja. Istodobno, kategorija koju KOLO predstavlja nije nepoznata na međunarodnoj razini — Europska je komisija kroz Akcijski plan za socijalnu ekonomiju (COM(2021) 778 final) i Preporuka Vijeća EU-a o okvirnim uvjetima za socijalnu ekonomiju (studeni 2023.) aktivno definirala prostor za entitete tog tipa, što je relevantno za Srbiju u procesu pristupanja EU-u.

## Četiri načela na kojima počiva pravna pozicija sustava

Pravna pozicija KOLO sustava počiva na četirima načelima koja su ugrađena u dizajn sustava, a ne naknadno dodana kao pravna zaštita.

**Nekonvertibilnost.** Nijedna se obračunska jedinica sustava ne može konvertirati u novac, valutu ni bilo koje sredstvo izvan sustava — ni neposredno ni posredno, uključujući zamjenu za vaučere, poklon-kartice ili drugo sredstvo s vanjskom vrijednošću — ono koje se može unovčiti, prenijeti trećoj osobi ili iskoristiti kod trgovca po izboru. Raspodjela vaučera iz pokroviteljstva dobrima i uslugama to nije: vaučer osigurava davatelj ugovorom u korist trećih osoba, davatelj POEN ne prima, zaklada u raspodjeli ništa ne posjeduje ni ne plaća, a vaučer glasi na imatelja i na određeno dobro kod jednog davatelja i ne unovčuje se; poništenje zapisa pri uzimanju vaučera poništenje je po iskorištenju. POEN se ne može zamijeniti za dinare niti iznijeti iz sustava. ZRNO se ne može prodati, prenijeti ni unovčiti. Ovo nije ograničenje koje može biti ukinuto odlukom zaklade ili zajednice — to je strukturni element čije bi uklanjanje temeljito promijenilo pravnu kvalifikaciju sustava.

**Odsutnost imovinskog prava nad zapisima.** Korisnici nemaju imovinsko pravo nad zapisima POEN-a i ZRNA u evidenciji sustava. Zapis POEN-a nije sredstvo u vlasništvu korisnika — to je podatak u evidenciji zajedničkog dobra. ZRNO nije udio, dionica ni bilo koji oblik imovinskog prava — to je evidencija položaja u zajedničkom dobru (odjeljak 6.2). Evidencija je dio zajedničkog dobra. Korisnik ima evidentiran doprinos i evidentiran položaj — ali ti zapisi nisu njegova imovina, ne mogu se prenijeti na drugu osobu i ne mogu se naslijediti kao imovinska prava. Čuvar Kola ima poziciju u obračunskom sustavu, ali ta pozicija nije imovinsko pravo — ona je posljedica strukture sustava i aktivnosti svih korisnika. Pitanje tretmana evidencije nakon smrti korisnika utvrđeno je kao otvoreno pravno pitanje u poglavlju 13.

**Nepovratnost donacija.** Dinarska sredstva koja zajednica daje zakladi donacije su u smislu važećih propisa. Donacija je nepovratna. Donator ne stječe pravo na povrat, ne stječe upravljačko pravo u zakladi na temelju donacije i ne stječe udio u sustavu na temelju donacije. Protokol evidentira činjenicu donatorskog doprinosa u POEN-ima, ali ta evidencija nije protuusluga za donaciju — to je jednostrani administrativni zapis protokola koji bilježi činjenicu doprinosa, istog karaktera kao evidencija bilo kojeg drugog oblika sudjelovanja u sustavu. Donator ne može uvjetovati donaciju evidencijom, niti evidencija stvara obvezu zaklade prema donatoru. To je razdvajanje dizajnerska odluka, ne zatečena činjenica — sustav je konstruiran tako da dva akta budu pravno neovisna. Legitimnost tog razdvajanja ne ovisi o tome je li nastalo spontano ili je dizajnirano — svaki pravni okvir konstruira kategorije koje zatim primjenjuje (usp. Pistor, 2019). Relevantno je provodi li struktura sustava razdvajanje dosljedno u praksi, ne je li razdvajanje performativno po svom podrijetlu.

**Minimizacija podataka.** Platforma prikuplja samo podatke nužne za funkcioniranje sustava. Zaklada ne čuva osobne podatke korisnika platforme — svi se podaci korisnika čuvaju na infrastrukturi protokola. Korisnik sam odlučuje koje dodatne podatke unosi radi lakšeg korištenja platforme — unos dodatnih podataka nije uvjet za dokaz stvarnosti niti za pristup funkcijama sustava. To je načelo istodobno regulatorni zahtjev (čl. 5. st. 1. t. 3. ZZPL-a) i dizajnerska odluka — sustav koji ne prikuplja podatke koje ne treba imati ne može ih izgubiti, zloupotrijebiti niti biti prisiljen predati.

Među četirima načelima, nekonvertibilnost ima temeljnu ulogu u regulatornom pozicioniranju sustava. Argumenti koji isključuju POEN iz definicije digitalne imovine (čl. 2. ZDI), platnog sredstva (ZPS) i elektroničkog novca počivaju na tome da POEN nema vanjsku vrijednost — a ta tvrdnja stoji samo dok ne postoji mehanizam konverzije. Kvalifikacija ZRNA izvan dosega ulagačkog ugovora počiva na tome da eventualna promjena pozicije čuvara Kola nema vanjsku realizaciju — što opet ovisi o nekonvertibilnosti POEN-a. Nekonvertibilnost je, u tom smislu, načelo o kojem ovisi pravna posljedica ostalih triju načela: ona definiraju karakter sustava, ali nekonvertibilnost osigurava da taj karakter bude pravno relevantan. Ostala tri načela nisu suvišna — svako od njih neovisno doprinosi pravnoj poziciji sustava — ali bez nekonvertibilnosti kvalifikacija sustava po ZDI, ZPS i ZTK ne bi stajala.

## Što KOLO nije

Pozitivna definicija sustava — participativni sustav zajedničkog dobra s nekonvertibilnim zapisima, bez imovinskog prava korisnika nad evidencijom i s nepovratnim donacijama — jasno ga razgraničava od pravnih kategorija s kojima bi mogao biti pomiješan.

KOLO nije platforma za trgovanje digitalnom imovinom. Zakon o digitalnoj imovini (čl. 2.) definira digitalnu imovinu kao digitalni zapis vrijednosti koji se može digitalno prenositi, čuvati ili njime trgovati, i dalje razlikuje virtualne valute od digitalnih tokena. Zapisi u KOLO sustavu ne ispunjavaju ni opću ni posebne definicije: POEN postoji isključivo kao zapis u evidenciji protokola bez nositelja — kad korisnik inicira ažuriranje evidencije, protokol mijenja vlastitu bazu, ali ništa ne mijenja nositelja jer POEN nema nositelja. ZRNO je neprenosivo. Nijedan se zapis ne može čuvati izvan sustava, njime trgovati niti monetizirati. Ne postoji sekundarno tržište za bilo koji zapis u sustavu.

KOLO nije platni sustav ni pružatelj platnih usluga u smislu Zakona o platnim uslugama. Platna transakcija u smislu ZPS-a pretpostavlja prijenos monetarne vrijednosti između platitelja i primatelja — takav prijenos u KOLO sustavu ne postoji jer POEN nema monetarnu vrijednost i nema nositelja. Korisnik razmjenjuje dobra i usluge s drugim korisnikom, a protokol evidentira tu razmjenu ažuriranjem vlastite baze. Razmjena je dobrovoljna, a evidencija je posljedica razmjene, ne sredstvo kojim se razmjena obavlja. Nijedan korisnik nema obvezu prihvatiti POEN kao ispunjenje bilo čega. POEN nije ni elektronički novac, jer mu nedostaju elementi te definicije: zapis POEN-a nije novčano potraživanje ni prema zakladi ni prema bilo kojoj drugoj osobi; ne izdaje se po primitku novčanih sredstava, nego se doprinos evidentira po pravilima sustava, a donacija i evidencija pravno su odvojeni akti; ne služi za izvršavanje platnih transakcija; zaklada pri ažuriranju evidencije ne prima, ne drži i ne prenosi novčana sredstva i ažuriranje ne naplaćuje; iz zapisa nema isplate ni otkupa; a osoba izvan evidencije, uključujući davatelja vaučera iz pokroviteljstva dobrima i uslugama, POEN ne prima.

KOLO nije investicijski fond ni kolektivna ulagačka shema u smislu Zakona o tržištu kapitala. Članak 2. ZTK-a definira prenosivi vrijednosni papir, jedinicu kolektivnog ulaganja i financijski instrument. ZRNO ne ispunjava definiciju prenosivog vrijednosnog papira jer je neprenosivo — ne postoji mehanizam prijenosa, tržište ni mogućnost trgovanja. ZRNO ne ispunjava definiciju jedinice kolektivnog ulaganja jer ne predstavlja udio u fondu čija vrijednost ovisi o imovini u koju su sredstva uložena — ZRNO evidentira položaj u obračunskom sustavu koji nema vanjsku imovinsku vrijednost. POEN ne ispunjava definiciju financijskog instrumenta jer nema nositelja, ne može se prenositi i ne može se konvertirati u novac. Nijedan korisnik ne ulaže sredstva u sustav s očekivanjem financijskog prinosa. Donacija zakladi nepovratna je i bez protuusluge (načelo nepovratnosti donacija). Eventualna promjena pozicije čuvara Kola nije prinos — nastaje samo ako postoji aktivnost korisnika u sustavu, ne isplaćuje je nijedna osoba i nitko je ne jamči. Ne postoji obećanje prinosa — ni izričito ni prešutno.

KOLO nije kripto projekt. Ne postoji token koji se emitira, kojim se trguje ili koji se lista na burzi. Ne postoji ICO, IDO ni bilo koji oblik javne ponude. Ne postoji blockchain — KOLO koristi centraliziranu evidenciju koju vodi protokol na infrastrukturi koju drži zaklada. Decentralizacija u KOLO sustavu nije tehnička nego upravljačka — progresivni prijenos odlučivanja s osnivača na zajednicu.

Zaklada ne izdaje financijske instrumente. Registrirana je po Zakonu o zadužbinama i fondacijama kao pravna osoba koja ostvaruje općekorisne ciljeve. Njezina je uloga u sustavu servisna — čuva zajedničko dobro, a nije njegov vlasnik; nije izdavatelj vrijednosnih papira, operator platnog sustava ni upravitelj investicijskim fondom.

## Gdje se KOLO nalazi

KOLO kombinira pravne institute iz više postojećih kategorija. Nije privatna tvrtka koja maksimizira profit za vlasnike. Nije državna ustanova koja pruža javnu uslugu. Nije neprofitna organizacija u klasičnom smislu — iako zaklada jest neprofitna, sustav je kao cjelina širi od zaklade. Nije zadruga u smislu Zakona o zadrugama — iako dijeli načela sa zadružnim pokretom.

KOLO je sustav za koji srpsko pravo nema gotovu kategoriju, ali za koji ima dovoljno pravnih instrumenata da ga opiše i zaštiti. Prostor u kojem se KOLO nalazi nije prazan na međunarodnoj razini — kao što je obrazloženo u poglavlju 1, Europska unija i Ujedinjeni narodi aktivno grade institucionalni okvir za socijalnu i solidarnu ekonomiju u koji se KOLO funkcionalno uklapa. Akcijski plan EU-a za socijalnu ekonomiju (COM(2021) 778 final), Preporuka Vijeća EU-a (2023.) i rezolucija Opće skupštine UN-a A/RES/77/281 (2023.) prepoznaju zaklade, zadruge i participativne sustave kao legitimne oblike ekonomskog organiziranja — kategorije u koje se KOLO strukturno uklapa. Za Srbiju u procesu pristupanja EU-u taj okvir nije apstraktan — to je smjer regulatornog razvoja u koji zemlja ulazi.

KOLO ne čeka formalizaciju te kategorije. Koristi postojeće pravne instrumente koji su dovoljni: zaklada daje pravnu osobnost, licence štite zajedničko dobro, ugovori reguliraju odnos sa korisnicima. Četiri načela — nekonvertibilnost, odsutnost imovinskog prava, nepovratnost donacija i minimizacija podataka — osiguravaju da sustav ne potpadne pod regulatorne okvire namijenjene financijskim instrumentima, platnim servisima i digitalnoj imovini.

## Pravna priroda odnosa korisnik–zaklada

Pristupanjem sustavu korisnik prihvaća pravila korištenja koja čine ugovor o pristupu u smislu čl. 142. Zakona o obligacionim odnosima — ugovor s unaprijed utvrđenim uvjetima koje korisnik prihvaća u cijelosti. Zaklada nije pružatelj usluge u smislu Zakona o zaštiti potrošača jer ne pruža uslugu uz naknadu — korisnik ne plaća za korištenje sustava, a dinarska je donacija nepovratna i bez protuusluge. Odnos korisnika prema zakladi nije potrošački nego participativan — korisnik nije klijent koji kupuje uslugu, nego netko tko dobrovoljno prihvaća pravila zajedničkog sustava. Pravila korištenja — objavljena prije registracije i dostupna svim korisnicima — reguliraju prava i obveze obiju strana, uključujući uvjete pristupa, pravila evidencije, postupke napuštanja sustava i ostvarivanje prava iz poglavlja 12.

Pravna pozicija KOLO sustava nije obrana od regulacije. To je dizajn koji od samog početka vodi računa o tome gdje se sustav nalazi u pravnom poretku — ne naknadno, nego kao strukturni element arhitekture.

# 5. Arhitektura sustava

Arhitektura KOLO sustava ima središte i dva aktera oko njega.

Središte je zajedničko dobro s protokolom kao svojim tehničkim mehanizmom. Poglavlje 3 opisuje što zajedničko dobro sadrži — softver, pravila, evidenciju, sadržaj — i kako protokol funkcionira. U kontekstu arhitekture, zajedničko je dobro ono oko čega se sve ostalo organizira. Zajedničko dobro nema pravnu osobnost i ne donosi odluke — postoji kao skup koda, pravila i zapisa na infrastrukturi koju drži zaklada. Infrastruktura nije sastavni dio zajedničkog dobra u istom smislu kao softver, pravila i evidencija, ali jest operativni preduvjet bez kojega zajedničko dobro ne može funkcionirati — njezino je održavanje servisna obveza zaklade.

Oko središta stoje dva aktera: zaklada i zajednica. Svaki ima jasno definiranu funkciju, jasno definiran odnos prema zajedničkom dobru i jasno definiran odnos prema drugom akteru.

## Zaklada

KOLO Zaklada pravni je instrument sustava. Registrirana je u Somboru po Zakonu o zadužbinama i fondacijama kao pravna osoba koja ostvaruje općekorisne ciljeve.

Zajedničko dobro nema pravnu osobnost — ne može sklopiti ugovor, držati račun ni stupiti u pravni promet. Zaklada mu daje pravni oblik.

Funkcije su zaklade servisne. Zaklada drži infrastrukturu na kojoj protokol radi. Prima dinarske donacije od zajednice i pokrovitelja. Plaća operativne troškove sustava — poslužitelje, razvoj, održavanje, pravne usluge. Zastupa sustav u pravnom prometu — potpisuje ugovore, podnosi prijave, komunicira s regulatornim tijelima. U Fazi 1., dok se upravljanje ne prenese na Gornje Kolo, osnivač u suradnji sa Zakladom postavlja pravila Protokola, u skladu s ograničenjima utvrđenima KOLO Pravilnikom.

Zaklada nije vlasnik sustava. Zaklada čuva zajedničko dobro, a nije njegov vlasnik. Razlika je pravno relevantna: vlasnik ima pravo raspolagati imovinom po vlastitoj volji, prodati je ili promijeniti njezinu namjenu. Zaklada nema nijedno od tih prava nad zajedničkim dobrom. Licencni mehanizmi opisani u poglavlju 3 — AGPL-3.0 za softver i CC BY-SA 4.0 za sadržaj — pravno sprječavaju zakladu da privatizira bilo koji dio zajedničkog dobra. Zaklada može prestati postojati, a softver i sadržaj ostaju dostupni po uvjetima licenci. Evidencija, međutim, ovisi o infrastrukturi — kontinuitet njezina čuvanja operativno je pitanje koje zaklada osigurava dok postoji, a u slučaju prestanka zaklade rješava se u skladu sa zakonom i postupcima prijenosa opisanima u poglavlju 10.

Zaklada nema udio u obračunskom sustavu. Zaklada ne stječe POEN-e, ne upisuje ZRNO, ne sudjeluje u internom obračunu. Njezin je odnos sa sustavom isključivo u dinarskim sredstvima koja prima kao donacije i troši na operativne troškove. To je razdvajanje strukturno — zaklada je pravni instrument, ne korisnik u obračunu.

## Zajednica

KOLO Zajednicu čine svi korisnici sustava, koji zajedno brinu o zajedničkom dobru.

Zajednica nije pravna osoba, nema tijela ni predstavnike i kao cjelina ne donosi odluke. Zajednica je skup svih korisnika koji koriste sustav i doprinose mu. Korisnik je i korisnik usluge u smislu propisa, ali nije klijent koji kupuje uslugu od platforme, nego netko čiji odnos prema zajedničkom dobru nije vlasnički nego participativan — pravo korištenja i doprinosa, sa sudjelovanjem u upravljanju koje se stječe pod uvjetima opisanima u poglavlju 10. Sudionici čine Kolo; ni Kolo nije pravna osoba, a pripadnost Kolu nije članstvo u zakladi ni u drugoj pravnoj osobi (poglavlje 7).

Zajednica doprinosi zajedničkom dobru na dva načina.

Prvi je način sudjelovanje u sustavu. Svaka razmjena, svaka aktivnost, svaka verifikacija — sve to ostavlja zapis u evidenciji i time uvećava zajedničko dobro. Protokol evidentira te doprinose u POEN-ima.

Drugi je način financiranje zaklade. Zajednica daje dinarske donacije zakladi, koja ta sredstva troši na infrastrukturu i programe sustava. Taj je financijski tok osnova arhitekture sustava, ne modul (detaljna mehanika opisana je u poglavlju 8) — bez njega zaklada ne može održavati infrastrukturu, a bez infrastrukture protokol nema gdje raditi.

Zajednica kao cjelina ne donosi odluke, ali upravljanje sustavom progresivno prelazi na zajednicu. U sadašnjoj je fazi upravljanje kod osnivača i zaklade. Kako sustav raste i kako se aktiviraju uvjeti za formiranje Gornjeg Kola, upravljanje prelazi na Gornje Kolo, koje čine čuvari Kola koji su aktivirali ZRNO. Poglavlje 10 opisuje kako taj prijenos funkcionira. Ovdje je dovoljno reći da je arhitektura sustava dizajnirana tako da upravljanje može prijeći s jednog na drugog nositelja bez promjene osnove — zajedničko dobro i protokol ostaju isti, mijenja se samo tko postavlja pravila.

## Odnos između zaklade i zajednice

Odnos između zaklade i zajednice nije hijerarhijski. Zaklada ne upravlja zajednicom. Zajednica ne upravlja zakladom — u sadašnjoj fazi nema mehanizam za to, a u kasnijoj je fazi taj odnos posredan, kroz Gornje Kolo (poglavlje 10). Njihov je odnos funkcionalan: zajednica financira zakladu dinarskim donacijama, zaklada održava infrastrukturu; zajednica koristi sustav i doprinosi zajedničkom dobru, zaklada ga zastupa u pravnom prometu; zajednica raste, zaklada skalira infrastrukturu prema rastu.

Financijski je tok između zajednice i zaklade jednosmjeran i dinarski — zajednica daje zakladi donacije u dinarima, zaklada troši na operativne troškove. Dinarska sredstva ne ulaze u interni obračunski sustav. Ti su tokovi strogo razdvojeni, kao što je obrazloženo u poglavljima 3 i 4.

Doprinos donatora evidentira se u POEN-ima kao jednostrani administrativni zapis protokola — pravna kvalifikacija tog odnosa obrazložena je u poglavljima 4 i 6.1.

Kad dinarske donacije premaše operativne troškove zaklade, višak se usmjerava u programe sustava — kolektivne nabave, socijalne programe, infrastrukturna ulaganja. Pravila raspoređivanja viška definiraju osnivač i zaklada u sadašnjoj fazi, a Gornje Kolo u kasnijoj fazi. Višak se nikad ne distribuira pojedinačnim korisnicima kao prinos, dividenda ni bilo koji oblik individualne dinarske isplate.

## Kako se dijelovi uklapaju

Zajedničko dobro s protokolom postoji kao kod i pravila. Zaklada mu daje pravni oblik i infrastrukturu, zajednica mu daje sadržaj, aktivnost i financiranje. Protokol vodi evidenciju, zaklada zastupa sustav u pravnom prometu, zajednica ga koristi i — progresivno — njime upravlja.

Ta je arhitektura namjerno jednostavna. Dva aktera, zajedničko dobro u središtu, jasni tokovi. Složenost sustava ne dolazi iz arhitekture nego iz obračunskog okvira i modula koji se dodaju na tu osnovu. Osnova je stabilna i ne mijenja se s dodavanjem modula — svaki je modul proširenje koje radi na istoj infrastrukturi, koristi isti protokol i poštuje ista pravila.

Poglavlje 6 opisuje obračunski okvir — kako protokol upisuje i vodi zapise POEN-a i ZRNA, kako se obračunava koeficijent između njih i zašto nijedan od tih zapisa ne predstavlja financijski instrument.

# 6. Obračunski okvir

Poglavlje 3 uvelo je POEN i ZRNO konceptualno — POEN evidentira doprinos, ZRNO evidentira položaj. Ovo poglavlje opisuje kako ta evidencija funkcionira: kako zapisi nastaju, kako se koriste, kako se obračunavaju i zašto ne potpadaju pod regulatorne okvire namijenjene financijskim instrumentima.

Pojam „obračunski okvir” namjerno je odabran umjesto „ekonomski model”. KOLO ne modelira ekonomiju u smislu tržišta, cijena i alokacije resursa. KOLO vodi evidenciju doprinosa i položaja kroz obračunske jedinice čije zapise upisuje i održava protokol. Sve što slijedi u ovom poglavlju opisuje administrativnu mehaniku evidencije, ne financijske tokove.

## 6.1 POEN

### Definicija

POEN je interna obračunska jedinica sustava. Zapis POEN-a u evidenciji protokola predstavlja evidentiran doprinos korisnika zajedničkom dobru. POEN je podatak u evidenciji — pravna kvalifikacija onoga što POEN nije detaljno je obrazložena na kraju ovog odjeljka, u nastavku analize iz poglavlja 4.

### Kako zapisi nastaju

Zapise POEN-a upisuje isključivo protokol. Nijedan korisnik ne može sam upisati zapis POEN-a. Nijedna institucija — uključujući zakladu — ne može upisati zapis POEN-a izvan pravila definiranih u protokolu. Zapisi nastaju na temelju aktivnosti korisnika i pravila koja postavljaju ljudi (u sadašnjoj fazi osnivač i zaklada, u kasnijoj fazi Gornje Kolo).

Protokol ažurira evidenciju POEN-a na dva načina. Korisnik može inicirati ažuriranje evidencije koje smanjuje njegov zapis i uvećava zapis drugog korisnika — bilo kao dio razmjene dobara i usluga, bilo bez protuusluge. POEN pritom ne mijenja nositelja jer ga nema: postoji isključivo kao zapis u evidenciji protokola, a protokol ažurira vlastitu bazu na temelju instrukcije korisnika. Ukupan se broj POEN-a u sustavu pri takvom ažuriranju ne mijenja (zero-sum). Osim ažuriranja postojećih zapisa, protokol upisuje nove zapise POEN-a kroz četiri razdvojena mehanizma. Prvi je doprinos korisnika — donacije zakladi, pokroviteljstvo pravnih osoba i obrtnika za koje prijavu podnosi korisnik, operativni doprinos i verifikacija korisnika. U svim se tim slučajevima zapis bilježi u zapisu korisnika koji je pridonio. Drugi je rast krugova i zadruga (Moduli 1 i 2): protokol upisuje nove zapise POEN-a u skladu s brojem članova i dosezanjem definiranih pragova, ali se ti zapisi evidentiraju u zapisu organizacijske jedinice, ne pojedinačnih članova. Treći je automatska evidencija u okviru socijalnih programa (Modul 3): protokol upisuje nove zapise POEN-a za kvalificirane skupine korisnika na temelju statusa, bez aktivnosti od strane primatelja potpore. Četvrti je osnivački doprinos — naknadna evidencija rada obavljenog prije otvaranja platforme, koju protokol evidentira postupno i do unaprijed utvrđene granice (odjeljak 8.1). Svaka od tih kategorija ima unaprijed definirana pravila — koliko se POEN-a evidentira, pod kojim uvjetima, s kojim ograničenjima. Ta su pravila dio protokola i mogu se mijenjati kroz procese upravljanja opisane u poglavlju 10.

Protokol ne upisuje zapise POEN-a proizvoljno ni diskrecijski. Svaki je zapis posljedica konkretne aktivnosti korisnika i primjene konkretnog pravila. Protokol ne može upisivati zapise bez aktivnosti, niti može odstupiti od pravila.

### Kako se evidencija ažurira prilikom razmjene

Kad dva korisnika razmijene dobra ili usluge, protokol ažurira evidenciju obaju korisnika — evidentira doprinos davatelja i primanje primatelja. Ukupan se broj POEN-a pritom ne mijenja (zero-sum). Ključna je razlika u odnosu na platni sustav: korisnik ne drži sredstvo koje prenosi drugoj osobi. POEN nema nositelja — korisnik inicira ažuriranje evidencije protokola, a ne prijenos sredstva.

### Imovinsko pravo

Korisnici nemaju imovinsko pravo nad zapisima POEN-a — ovo je drugo od četiri načela sustava obrazloženo u poglavlju 4. Kako je utvrđeno u prethodnim odjeljcima, POEN nema nositelja, a ažuriranje je evidencije operacija protokola nad vlastitom bazom, ne prijenos sredstva između dviju osoba. Korisnik ne može iznijeti POEN izvan sustava, ne može ga prodati za novac niti naslijediti zapise drugog korisnika. Kako zapisi nemaju imovinsku vrijednost po dizajnu sustava, nemaju nositelja i ne mogu se konvertirati u sredstvo s vanjskom vrijednošću, u okviru dizajna sustava ne postoji pravni temelj za potraživanje njihove vrijednosti — to proizlazi iz same prirode evidencije, ne iz ugovornog ograničenja.

Za razumijevanje prirode POEN-a korisna je distinkcija između evidencije i sredstva. Sredstvo (novac, token, prenosivi vaučer ili poklon-kartica) ima inherentnu ili dodijeljenu vrijednost koja se može prenijeti. Evidencija (matična knjiga, katastarski list, zapisnik) bilježi činjenicu bez toga da sama bude vrijednost. POEN je bliži drugoj kategoriji — bilježi da se doprinos dogodio, ali sam zapis ne predstavlja prenosivu vrijednost niti obećanje buduće koristi. Ta distinkcija odgovara razlici koju literatura o komplementarnim valutama pravi između sustava utemeljenih na obračunu (mutual credit, accounting-based) i sustava utemeljenih na sredstvu (token-based) — gdje je KOLO izrijekom u prvoj kategoriji (Greco, 2009; Lietaer, 2001).

### Korištenje

POEN se koristi unutar sustava za razmjenu dobara i usluga između korisnika i kao mjera doprinosa na temelju koje se izračunavaju uvjeti za upis ZRNA. POEN se ne može koristiti izvan sustava — ne postoji mehanizam konverzije u novac ni u bilo koje sredstvo s vanjskom vrijednošću (načelo nekonvertibilnosti, poglavlje 4).

### Pravna kvalifikacija

Pravna kvalifikacija POEN-a — isključenje iz kategorija digitalne imovine, platnog sredstva, elektroničkog novca i novca — obrazložena je u poglavlju 4. Mehanika opisana u prethodnim odjeljcima potkrepljuje tu kvalifikaciju iz perspektive funkcioniranja sustava.

Zakon o digitalnoj imovini (čl. 2.) definira digitalnu imovinu kao digitalni zapis vrijednosti koji se može digitalno prenositi, čuvati ili njime trgovati. POEN ne ispunjava funkcionalne pretpostavke te definicije: ne prenosi se u smislu zakona jer nema nositelja — korisnik ne drži POEN i ne predaje ga drugoj osobi, već inicira ažuriranje evidencije protokola; ne može se čuvati izvan sustava; ne može se njime trgovati jer ne postoji sekundarno tržište. POEN nije „digitalni zapis vrijednosti” jer se ne može konvertirati u novac, ne može se monetizirati izvan sustava i ne postoji tržište na kojem bi se njime trgovalo.

Zakon o platnim uslugama. POEN se ne prenosi između korisnika u smislu zakona jer nema nositelja. Kad korisnik inicira ažuriranje evidencije, protokol mijenja vlastitu bazu; ne postoji platna transakcija jer ništa s monetarnom vrijednošću ne mijenja nositelja. POEN nije ni elektronički novac jer mu nedostaju elementi te definicije (poglavlje 4): nije novčano potraživanje ni prema kome; nije izdan po primitku sredstava (protokol ga evidentira na temelju aktivnosti korisnika, ne na temelju uplate; donacija zakladi i evidencija doprinosa pravno su odvojeni akti); ne služi za izvršavanje platnih transakcija; ažuriranje se ne naplaćuje; i iz zapisa nema isplate ni otkupa.

## 6.2 ZRNO

### Definicija

ZRNO je evidencija položaja u zajedničkom dobru. Zapis ZRNA u evidenciji protokola znači da je sudionik ispunio uvjete za evidentiranje položaja. ZRNO je podatak u evidenciji koji bilježi da korisnik kojem je upisano sudjeluje u zajedničkom dobru na način koji ispunjava definirane uvjete — pravna kvalifikacija onoga što ZRNO nije dana je na kraju ovog odjeljka, u nastavku analize iz poglavlja 4.

Čuvar Kola ima korist od tog statusa. Ta je korist posljedica strukture sustava — sudjelovanje u upravljanju kroz Gornje Kolo i pozicija u obračunskom sustavu koja se mijenja s promjenom obračunskog koeficijenta. Ta korist nije zajamčena, nije fiksna i ne isplaćuje je nijedna osoba.

### Raspoloživost

Ukupan je broj ZRNA raspoloživih za upis fiksiran na milijun. Taj se broj ne može ni povećati ni smanjiti. Milijun je gornja granica — u svakom je trenutku dio ZRNA evidentiran kod korisnika, a dio je raspoloživ za evidentiranje u protokolu. Zbroj tih dvaju brojeva uvijek je milijun.

Fiksiranost je ukupnog broja pravilo dizajna sustava, ne parametar koji podliježe upravljačkoj promjeni. Fiksiran broj znači da je ukupan opseg evidentiranog položaja u zajedničkom dobru ograničen. Što više korisnika upiše ZRNO, manje ih je raspoloživo za nove upise, što mijenja obračunski koeficijent za sve korisnike. Ta je mehanika opisana u odjeljku 6.3.

### Upis

ZRNO upisuje samo član Kola, odnosno član bez potvrde, koji upisano ZRNO ne aktivira dok ne bude potvrđen; korisnik, koji nije u Kolu, ZRNO ne upisuje. Upis se izvršava isključivo kroz protokol, na temelju ispunjenja dvaju uvjeta.

Prvi je uvjet minimum evidencije: korisnik koji upisuje ZRNO mora imati najmanje dvadeset tisuća POEN-a evidentiranih u sustavu. Taj prag osigurava da ZRNO mogu upisati samo sudionici koji su svojim doprinosom pokazali aktivan položaj u zajedničkom dobru.

Drugi je uvjet ograničenje po obračunskom razdoblju: korisnik može upisati najviše jedan posto svog stanja POEN-a po obračunskom razdoblju. To ograničenje sprječava naglo preuzimanje raspoloživih ZRNA od strane pojedinačnih korisnika i osigurava postupno evidentiranje položaja.

Upis je ZRNA odluka korisnika koja se izvršava kroz protokol kad su uvjeti ispunjeni. Protokol ne upisuje ZRNO automatski — korisnik inicira upis, protokol provjerava uvjete i izvršava upis ako su ispunjeni.

### Stanja ZRNA

Evidentirano ZRNO ima dva stanja: slobodno i aktivno. Sva se stanja i prijelazi između njih ažuriraju u ponoć, zajedno sa svim ostalim obračunskim operacijama protokola.

Slobodno ZRNO je upisano ZRNO koje čuvar Kola drži u evidenciji bez upravljačke funkcije. Čuvar Kola može inicirati dvije operacije sa slobodnim ZRNOM: aktivaciju — kojom ZRNO prelazi u aktivno stanje i postaje temelj za glasačku moć u Gornjem Kolu — ili otpis — kojim se ZRNO vraća u fond raspoloživih ZRNA u protokolu, a protokol čuvaru Kola evidentira POEN-e po tekućem obračunskom koeficijentu. Čuvar Kola može otpisati bilo koji broj slobodnih ZRNA — otpis može biti djelomičan. Član bez potvrde kojem je upisano ZRNO može slobodno ZRNO otpisati, ali ne i aktivirati.

Aktivno ZRNO je upisano ZRNO koje je čuvar Kola aktivirao za sudjelovanje u upravljanju. Aktivno ZRNO daje glasačku moć u Gornjem Kolu — glasačka je moć jednaka kvadratnom korijenu iz broja aktivnih ZRNA (poglavlje 10). Aktivno se ZRNO ne može otpisati — čuvar Kola koji želi otpisati aktivno ZRNO mora ga prvo povući u slobodno stanje, nakon čega može inicirati otpis u sljedećem obračunskom razdoblju.

Taj mehanizam uspostavlja strukturni izbor između upravljačke funkcije i obračunske fleksibilnosti. Čuvar Kola koji aktivira ZRNO dobiva glasačku moć ali gubi mogućnost otpisa dok ZRNO ne povuče. Čuvar Kola koji drži slobodno ZRNO može ga otpisati za POEN-e, ali nema glasačku moć. Izbor je isključiv u svakom obračunskom razdoblju — isto ZRNO ne može istodobno služiti za glasovanje i biti raspoloživo za otpis.

### Otpis

Čuvar Kola može inicirati otpis slobodnog ZRNA — vratiti ga u fond raspoloživih ZRNA u protokolu. Pri otpisu protokol evidentira POEN-e čuvaru Kola po tekućem obračunskom koeficijentu. Otpis je suprotna operacija od upisa: pri upisu korisnik troši POEN-e i upisuje ZRNO; pri otpisu čuvar Kola vraća ZRNO, a protokol mu evidentira POEN-e. Obje se operacije izvršavaju u ponoć po koeficijentu koji vrijedi za to obračunsko razdoblje.

Otpis je isključivo odluka čuvara Kola — protokol ne otpisuje ZRNO automatski niti prisiljava čuvara Kola da otpiše. Otpis može biti djelomičan — čuvar Kola može otpisati bilo koji broj slobodnih ZRNA, od jednog do svih. Ne postoji limit otpisa po obračunskom razdoblju. Aktivno se ZRNO ne može otpisati — čuvar Kola ga mora prvo povući u slobodno stanje, nakon čega može inicirati otpis najranije u sljedećem obračunskom razdoblju. Korisnik kojem je upisano ZRNO, a koji više nije u Kolu, ZRNO drži, ali ga ne otpisuje (poglavlje 7).

Obračunski koeficijent u trenutku otpisa može biti viši ili niži od koeficijenta u trenutku upisa. Ako je viši, protokol pri otpisu čuvaru Kola evidentira više POEN-a nego što ih je iskoristio kao temelj upisa. Ako je niži, evidentira manje. Ta razlika nije prinos koji netko isplaćuje ili jamči — to je aritmetička posljedica promjene stanja evidencije cjelokupnog sustava. Nijedna institucija ne jamči da će koeficijent rasti. POEN-i dobiveni otpisom imaju isti status kao svi drugi POEN-i — zapisi u evidenciji bez vanjske imovinske vrijednosti koji se ne mogu konvertirati u novac (poglavlje 4, načelo nekonvertibilnosti). Kvalifikacija razlike u evidentiranim POEN-ima kao nečega što nije prinos počiva na tom lancu: razlika postoji samo u POEN-ima → POEN-i nemaju vanjsku imovinsku vrijednost → jer ne postoji mehanizam konverzije. Kad bi nekonvertibilnost bila narušena, razlika bi dobila vanjsku vrijednost i kvalifikacija bi se promijenila — što je dodatni razlog zašto je nekonvertibilnost strukturni element sustava, ne parametar koji podliježe promjeni.

### Neprenosivost

ZRNO se ne može prenositi između korisnika. Ne postoji mehanizam — ni u protokolu ni izvan njega — kojim bi korisnik mogao prenijeti svoj zapis ZRNA drugom korisniku. Ovo nije tehničko ograničenje koje bi se moglo zaobići — ovo je pravilo dizajna sustava. ZRNO je neprenosiv zapis vezan za identitet korisnika utvrđen u lancu potvrda — čak i ako bi korisnik pokušao ustupiti pristup računu, ZRNO ostaje vezano za fizičku osobu čiju je stvarnost utvrdio verifikator, čime se sprječava funkcionalni transfer. Neprenosivost ZRNA znači da ne postoji tržište za ZRNO, ne postoji cijena ZRNA i ne postoji mogućnost špekulacije ZRNOM.

### Pozicija čuvara Kola u obračunskom sustavu

Čuvar Kola ima poziciju u obračunskom sustavu koja se mijenja s aktivnošću zajednice kroz obračunski koeficijent (odjeljak 6.3). Nijedna instituciju tu korist ne isplaćuje niti jamči — promjena je pozicije aritmetička posljedica aktivnosti cjelokupnog sustava, ne zajamčen rezultat individualnog položaja. Ako nema aktivnosti korisnika u sustavu, nema ni promjene koeficijenta.

### Pravna kvalifikacija

Pravna kvalifikacija ZRNA — isključenje iz kategorija vrijednosnih papira, digitalne imovine i ulagačkih instrumenata — obrazložena je u poglavlju 4. Mehanika opisana u prethodnim odjeljcima — neprenosivost, nepostojanje tržišta, odsutnost dividende ili zajamčenog prinosa — potkrepljuje tu kvalifikaciju.

Dopunska analiza potvrđuje isključenje iz kategorije ulagačkog instrumenta. Korisnik ne ulaže novac u zajednički pothvat — ZRNO se stječe evidencijom doprinosa u POEN-ima, ne uplatom sredstava, a prag od 20.000 POEN-a može se doseći isključivo razmjenom, operativnim programima ili verifikacijom, bez ijednog dinara donacije. Ne postoji očekivanje profita u financijskom smislu — pozicija u obračunskom sustavu nije prinos. Eventualna promjena pozicije ne ovisi o naporu trećih osoba, već o aktivnosti cjelokupne zajednice u sustavu, što je temeljno drukčiji odnos od odnosa ulagač–menadžer. Dva specifična aspekta mehanike ZRNA zahtijevaju dopunu te analize.

Lanac donacija–POEN–ZRNO. Korisnik koji donira dinare zakladi stječe evidenciju u POEN-ima koja ga može približiti pragu za upis ZRNA. Tri elementa razbijaju kvalifikaciju tog lanca kao ulagačkog ugovora: donacija je nepovratna i pravno odvojena od evidencije — donator ne može uvjetovati donaciju evidencijom niti zahtijevati povrat; donacija nije nužan ni povlašten put do ZRNA — isti prag vrijedi za sve aktivnosti i sudionik može stići do praga isključivo razmjenom i doprinosom, bez ijednog dinara donacije; odnos između iznosa donacije i broja evidentiranih POEN-a nije fiksna konverzijska stopa nego parametar koji se može mijenjati. Čak i kad bi odnos bio fiksan, donacija je pravno nepovratna i ne stvara obvezu zaklade prema donatoru, čime je prekinut element očekivanja koji bi utemeljio kvalifikaciju kao ulagački ugovor.

Mehanika otpisa. Čuvar Kola koji upiše ZRNO pri jednom obračunskom koeficijentu a otpiše ga pri drugom, dobiva drugačiji broj POEN-a od onoga koji je iskoristio kao temelj upisa — u oba smjera, jer koeficijent raste od upisa novih zapisa POEN-a a pada od njihova poništenja (odjeljak 6.3). Četiri elementa razbijaju kvalifikaciju te razlike kao prinosa: POEN-i evidentirani otpisom nemaju vanjsku imovinsku vrijednost — ne mogu se konvertirati u novac, iznijeti iz sustava ni monetizirati (načelo nekonvertibilnosti); promjena koeficijenta nije zajamčena — proizlazi iz stanja evidencije cjelokupne zajednice, ne iz napora trećih osoba u smislu ulagačkog ugovora; vlastiti upis i otpis koeficijent uopće ne pomiču, pa čuvar Kola nema ni instrument ni trenutak kojim bi razliku ostvario; ne postoji izdavatelj koji obećava rast koeficijenta niti institucija koja isplaćuje razliku. Dodatno, struktura sustava uspostavlja strukturni izbor koji ograničava čisto pasivno držanje: čuvar Kola koji želi upravljačku korist mora aktivirati ZRNO, čime gubi mogućnost otpisa; čuvar Kola koji želi obračunsku fleksibilnost ne može istodobno glasovati.

## 6.3 Obračunski koeficijent

### Definicija

Obračunski koeficijent brojčani je odnos između ukupnog broja POEN-a evidentiranih u sustavu i broja ZRNA raspoloživih za upis u protokolu. Protokol ga izračunava jednom dnevno, u ponoć.

### Formula

Obračunski koeficijent = ukupan broj POEN-a evidentiranih u sustavu ÷ broj ZRNA raspoloživih u protokolu.

Oba su elementa formule promjenjiva. Ukupan broj POEN-a evidentiranih u sustavu raste s upisom novih zapisa kroz sva četiri mehanizma — doprinos korisnika (donacije, pokroviteljstvo, operativni doprinos, verifikacija), rast krugova i zadruga, socijalne programe i osnivački doprinos. Razmjena dobara i usluga između korisnika ne uvećava ukupan broj POEN-a u sustavu — ona preraspodjeljuje postojeće POEN-e između korisnika (zero-sum). Broj ZRNA raspoloživih u protokolu opada kad korisnici upisuju ZRNO — jer se upisano ZRNO evidentira kod čuvara Kola i više nije raspoloživo u protokolu.

### Kako se koeficijent mijenja

Koeficijent pomiču isključivo promjene ukupnog broja evidentiranih POEN-a — naviše i naniže.

Kad god protokol upiše nove zapise POEN-a — kroz doprinos korisnika (donacije, pokroviteljstvo, operativni doprinos, verifikacija), rast krugova i zadruga, socijalne programe ili osnivački doprinos — brojnik formule raste, bez obzira na to u čijem se zapisu novi POEN-i evidentiraju. To mijenja obračunski koeficijent naviše.

Kad se evidentirani POEN-i ponište — prestankom statusa korisnika, poništenjem po iskorištenju u kolektivnoj nabavi, otpisom po raskinutom prijateljstvu u dječjem prostoru ili drugom osnovom utvrđenim pravilnikom — brojnik opada. To mijenja obračunski koeficijent naniže. Koeficijent, dakle, nije monoton i nije predodređen da raste.

Razmjena dobara i usluga ne utječe na koeficijent jer preraspodjeljuje postojeće POEN-e bez promjene ukupnog broja.

Upis i otpis ZRNA također ne pomiču koeficijent, i to je posljedica same formule, a ne pravila koje bi se moglo izmijeniti. Pri upisu se nazivnik umanjuje za upisana ZRNA, ali se brojnik istodobno umanjuje za POEN-e koji su tim upisom vraćeni protokolu i izašli iz optjecaja — a taj je broj upravo umnožak upisanih ZRNA i važećeg koeficijenta, pa kvocijent ostaje isti. Pri otpisu oba člana rastu po istom odnosu. Čuvar Kola svojim postupanjem ne može pomaknuti vlastiti koeficijent ni u jednom smjeru.

Svi su ti učinci posljedica aktivnosti korisnika u sustavu. Nijedan pojedinačni korisnik ne kontrolira koeficijent. Nijedna institucija ne kontrolira koeficijent. Koeficijent je izračunata vrijednost koja proizlazi iz ukupnog stanja evidencije svih korisnika u sustavu.

### Što obračunski koeficijent znači za korisnike

Za sudionika obračunski koeficijent određuje koliko je POEN-a potrebno za upis jednog ZRNA u danom trenutku. Viši koeficijent znači da je za upis ZRNA potrebno više evidentiranog doprinosa. Korisnik koji je ranije ispunio uvjete za upis ZRNA to je učinio pri nižem obračunskom koeficijentu — što znači da je za isti broj ZRNA bilo potrebno manje POEN-a.

Za čuvara Kola promjena obračunskog koeficijenta mijenja poziciju njegova evidentiranog položaja u kontekstu sustava. Ta promjena nije isplata, nije prinos i nije zajamčena — to je aritmetička posljedica promjene stanja evidencije cjelokupnog sustava. Eventualna se korist od promjene pozicije realizira isključivo u POEN-ima — zapisima u evidenciji bez vanjske imovinske vrijednosti. Čuvar Kola ne može realizirati promjenu pozicije u novcu, valuti ni bilo kojem vanjskom sredstvu. Korist je od položaja intrasistemska — postoji samo unutar sustava i ima vrijednost samo za korisnike sustava koji razmjenjuju dobra i usluge unutar njega.

### Što obračunski koeficijent nije

Obračunski je koeficijent administrativna veličina — nije cijena (ne postoji tržište), nije tečaj (ne postoji konverzija između dviju valuta) i nije indeks performansi (ne mjeri profitabilnost). Protokol ga izračunava na temelju stanja evidencije i koristi kao parametar za primjenu pravila upisa i otpisa ZRNA. Njegov je rast ili pad posljedica aktivnosti u sustavu, ne odluke nijedne osobe.

Korisnik koji doprinosi sustavu u ranoj fazi — kad je koeficijent nizak — upisuje ZRNO uz manje evidentiranih POEN-a nego korisnik koji to isto čini u kasnijoj fazi s višim koeficijentom. Pozicija ranog korisnika time odražava njegov doprinos u fazi kad je doprinos bio najvrjedniji za uspostavljanje sustava. To je posljedica uvažavanja ranijeg doprinosa zajedničkom dobru, a ne poticaj za stjecanje položaja: broj POEN-a potreban za upis izračunava protokol iz stanja evidencije, ne odluka kojom bi se rano sudjelovanje nagrađivalo, i nijedna osoba ne obećava da će taj broj kasnije biti veći.

Pravilo od jedan posto stanja po obračunskom razdoblju (odjeljak 6.2) ograničava brzinu kojom se raspoloživa ZRNA preuzimaju — čak i kad velik broj korisnika istodobno ispuni uvjete za upis, ukupan je opseg upisa po razdoblju ograničen na jedan posto ukupnog stanja svih korisnika koji ispunjavaju uvjete za upis. Time se čuva pristup kasnijih korisnika i koeficijent ostaje manje osjetljiv na pojedinačne upise novih zapisa POEN-a, jer se broj raspoloživih ZRNA ne iscrpljuje naglo.

# 7. Korisnici i dokaz stvarnosti
KOLO sustav razlikuje četiri statusa punoljetnih korisnika: korisnik, član bez potvrde, član Kola i čuvar Kola. Korisnik je svaka osoba s računom na platformi, bez obzira na status. Statusi se razlikuju po opsegu pristupa, evidencije i prava koja iz te evidencije proizlaze. Prijelaz između statusa odvija se po unaprijed definiranim pravilima: verifikacijom i potvrdom u lancu potvrda, odnosno upisom i otpisom ZRNA, koje protokol izvršava kad su uvjeti ispunjeni, bez diskrecije bilo koje osobe. Maloljetni korisnik nema nijedan od tih statusa; njegov je položaj opisan u poglavlju 9 (Modul 4).

Sudionici — članovi bez potvrde, članovi Kola i čuvari Kola — čine Kolo. Kolo nije pravna osoba, a pripadnost Kolu nije članstvo u zakladi ni u drugoj pravnoj osobi.

## Dokaz stvarnosti

Stvarnost i kontinuitet korisnika potvrđuju se kroz model verifikacije utemeljen na osobnom poznanstvu ili na razgovoru nakon poziva — lanac potvrda u kojem članovi Kola potvrđuju stvarnost korisnika ili ih uvode u Kolo. Model ne zahtijeva prikupljanje osobnih dokumenata. Korisnik je u Kolu ili nije; verifikacija određuje pristup funkcijama sustava, a potvrđenost i pravo potvrđivanja.

Stvarnost se potvrđuje samo u lancu potvrda. Tko ne poznaje nijednog člana Kola, može dospjeti na popis za poziv: kada sam zatraži razgovor, kada zaklada utvrdi primitak njegove javne donacije od najmanje 5.000 dinara izvršene jednom uplatom ili novčanog pokroviteljstva za koje je podnio prijavu, ili kada kao nositelj prijavi gospodarstvo, upisano ili neupisano u Registar poljoprivrednih gospodarstava. Na isti popis dolazi i član bez potvrde koji zatraži razgovor radi potvrde; takav zahtjev vide samo čuvari Kola. Uplata, pokroviteljstvo i prijava gospodarstva sami po sebi ne potvrđuju stvarnost. Korisnika s popisa za poziv član Kola zove radi upoznavanja i, ako nakon razgovora procijeni da ga poznaje dovoljno da za verifikaciju odgovara, uvodi ga u Kolo; razgovor sam po sebi nije verifikacija. Korisnik se unaprijed obavještava da će član Kola koji ga pozove vidjeti njegovo ime i prezime i broj telefona. Ti se podaci otvaraju klikom, samo članu Kola koji je poziv otvorio i samo dok je poziv otvoren, a zaklada bilježi tko ih je otvorio. Donacija, pokroviteljstvo i doprinos evidentiran po njima ne ovise o pozivu.

Dokaz je stvarnosti preduvjet za pun pristup sustavu. Bez verifikacije korisnika sustav ne može osigurati integritet evidencije jer ne može jamčiti da iza svakog zapisa stoji stvarna, jedinstvena osoba. Punoljetni korisnik registrira se na platformi kao korisnik i odmah sudjeluje u razmjeni — postavlja oglase, razgovara s drugim korisnicima i sudjeluje u ažuriranju evidencije POEN-a — ali upis ZRNA i programi potpore zahtijevaju verifikaciju, a sudjelovanje u upravljanju i potvrđivanje drugih i potvrđenost.

### Lanac potvrda

Dokaz stvarnosti funkcionira kao lanac potvrda u kojem članovi Kola potvrđuju korisnike koje osobno poznaju ili ih nakon razgovora uvode u Kolo, a članovi bez potvrde uvode u Kolo korisnike koje osobno poznaju. Model potvrđuje dvije stvari: stvarnost (korisnik postoji kao fizička osoba) i kontinuitet (ista osoba koja je prvotno verificirana i dalje koristi račun). Jedinstvenost — da ista osoba nema drugi račun — verifikator ne može znati, jer poznaje čovjeka, a ne njegove račune: zato je ne jamči, nego izjavljuje da mu drugi račun nije poznat. Za korisnike koji dolaze na popis za poziv ime i prezime, mjesto i broj telefona uspoređuju se s podacima uz druge račune; podudaranje ništa ne blokira, a da su dva računa računi iste osobe utvrđuje zaklada, uz obrazloženje i pravo na prigovor.

Stvarnost korisnika utvrđuje jedan verifikator, jednom verifikacijom. Pripadnost Kolu nema stupnjeva: korisnik je u Kolu ili nije. Sudionik je član bez potvrde, član Kola ili čuvar Kola. Potvrđen je samo član Kola: on ima pun pristup svim funkcijama platforme, uključujući pravo da potvrđuje stvarnost drugih. Punoljetni korisnik koji je uveden u Kolo, a nije potvrđen, član je bez potvrde.

### Potvrda i uvođenje u Kolo

Verifikacija je potvrda ili uvođenje u Kolo. Potvrdu daje član Kola, odnosno osnivač, čovjeku kojeg osobno poznaje; potvrđeni postaje član Kola. U Kolo uvodi član Kola nakon razgovora telefonom s korisnikom s popisa za poziv, a član bez potvrde uvodi poznanika kojeg osobno poznaje; uvedeni postaje član bez potvrde. Koga uvede član bez potvrde, i sam je član bez potvrde. Uvođenje u Kolo nije slabija verifikacija: POEN-i po njemu evidentiraju se po istim pravilima, a dnevni tempo, nadzor i odgovornost za lažnu verifikaciju primjenjuju se jednako kao kod potvrde.

Član bez potvrde ima prava sudionika — razmjenjuje, stječe evidenciju POEN-a, sudjeluje u programima potpore, nabavama, operativnom doprinosu i zadrugama, upisuje ZRNO i slobodno ZRNO može otpisati — ali ne i prava koja akti vezuju za člana Kola: ne vidi popis za poziv i ne uvodi u Kolo korisnike s njega, ne potvrđuje nikoga — ni postojanje djeteta, ni druge članove bez potvrde, ni ispunjenost uvjeta za program potpore — ne daje preporuku člana i ne nadzire. ZRNO upisuje, ali ga ne aktivira: nema glas, nije u Gornjem Kolu i ne delegira. Gospodarstvo prijavljuje kao nositelj, bez članova, a njegovo dijete ne postaje dijete Kola. Člana bez potvrde potvrđuje član Kola, odnosno osnivač, koji ga osobno poznaje; nakon najmanje trideset dana u Kolu, bez usvojene prijave razmjene ili oglasa i bez utvrđene lažne verifikacije, može tražiti i telefonski razgovor s čuvarom Kola, koji ga nakon razgovora potvrđuje; zaklada ga može potvrditi i po vlastitoj odluci. Član bez potvrde koji je upisao ZRNO dolazi na prvo mjesto popisa, a zaklada osigurava da ga čuvar Kola nazove u roku od tri dana. Razmjena može biti način na koji su se upoznali, ali nije uvjet potvrde. Ta potvrda nije nova verifikacija i po njoj se ne upisuju POEN-i; podliježe nadzoru kao i verifikacija, a onaj tko ju je dao odgovara za nju kao za verifikaciju. Kad član bez potvrde bude potvrđen, dobiva popis povezanih: one koje je uveo dok je bio bez potvrde i onoga tko je njega uveo, ako su još bez potvrde. S popisa osobno potvrđuje one koje poznaje; to je njegova potvrda, za koju odgovara kao za verifikaciju, ide u nadzor i ne donosi POEN-e. Svaki tako potvrđeni dobiva svoj popis, pa se potvrda širi korak po korak, niz lanac i uz njega, ali samo odlukom ljudi koji se poznaju. Potvrda se nikad ne događa automatski.

### Lanac bez kruga

Budući da svaki sudionik koji nije osnivač ima jednog verifikatora, lanac potvrda je stablo: svaki takav korisnik ima točno jednog prethodnika, a osnivači su njegovi korijeni. Verifikator ne može potvrditi nikoga iz svoje uzlazne linije, pa u lancu ne može nastati zatvorena petlja. Obrana od koordinirane manipulacije (Douceur, 2002) ne počiva na broju potvrda, nego na odgovornosti verifikatora za svaku verifikaciju; na dnevnom tempu potvrđivanja; na nadzoru čuvara Kola; i na tome što zapis POEN-a po verifikaciji nastaje tek kad sudionik ostvari prvi doprinos koji je potvrdila Zaklada odnosno čuvar Kola.

### Bootstrap i nadzor širenja

Svaka mreža verifikacije ima problem pokretanja — tko verificira prve korisnike. KOLO koristi polazni mehanizam u kojem su osnivači — osobe iz osnivačke jezgre zaklade, upisane u javni registar kao osnivač ili članovi tijela zaklade, i osobe koje Upravni odbor odredi odlukom uz javno objavljen identitet — potvrđeni bez verifikacije od strane drugih korisnika, čime mogu uspostaviti polaznu točku verifikacijskog stabla. Osnivači su jedini čija potvrđenost ne proizlazi iz lanca potvrda.

Nadzor širenja mreže obavljaju čuvari Kola; u početnoj fazi to su osnivači. Funkcija nadzora proizlazi iz statusa čuvara Kola, bez imenovanja, i ne ovisi o fazi sustava. Nadzornik širenja naknadno provjerava legitimnost izvršene verifikacije, čime osigurava integritet grafa verifikacija. Verifikacije osnivača i čuvara Kola ne podliježu nadzoru, osim uvođenja u Kolo nakon razgovora telefonom s korisnikom s popisa za poziv, koje nadzoru podliježe uvijek, i kada ga obavi čuvar Kola; izuzet je samo osnivač. Verifikacije koje obavi član bez potvrde nadzornicima se prikazuju prve u redu nadzora. Zaklada iz podataka koji se već vode prepoznaje i zatvorene skupine — članove bez potvrde koji su uveli jedni druge u Kolo i razmjenjuju samo međusobno; provjera samo prikazuje skupinu Zakladi i nema učinak prema korisniku. Broj verifikacija koje jedan verifikator može obaviti nije ograničen; ograničen je tempo — brzo potvrđivanje većeg broja osoba u jednom danu najprije povlači upozorenje, a zatim zaustavljanje potvrđivanja do kraja dana. Dana potvrda ne prestaje zato što je osoba koja ju je dala napustila sustav; poništava je samo utvrđena lažnost.

Protokol evidentira svaki čin verifikacije kao doprinos zajedničkom dobru; nadzor se kao doprinos ne evidentira. Konkretni parametri — pravila dnevnog tempa potvrđivanja, pravila polaznog mehanizma, postupci nadzora širenja i detaljna analiza otpornosti na koordiniranu manipulaciju — definirani su u Pravilniku o dokazu stvarnosti.

### Podaci koji se čuvaju

Platforma čuva minimalan skup podataka: pseudonim računa, graf verifikacija s podatkom je li svaka verifikacija potvrda ili uvođenje u Kolo, podatak o verifikaciji i potvrđenosti, datum pristupanja i adresu e-pošte. Ime i prezime vodi se samo u zasebnoj evidenciji identiteta (poglavlje 12), a broj telefona korisnik ostavlja sam, kada pristane na poziv s popisa za poziv. Zaklada ne čuva podatke o korisnicima platforme. Korisnik može dobrovoljno unijeti dodatne podatke radi lakšeg korištenja platforme, ali to nije uvjet za verifikaciju niti za pristup funkcijama sustava.

### Pravna dimenzija dokaza stvarnosti

Graf verifikacija, čak i pseudoniman, predstavlja obradu osobnih podataka u širem tumačenju Zakona o zaštiti podataka o ličnosti. Pravni je temelj za tu obradu izvršenje ugovornog odnosa — korisnik pristupanjem sustavu prihvaća pravila koja uključuju nadzor verifikacijskog procesa radi očuvanja integriteta sustava. Detalji usklađenosti s propisima o zaštiti podataka opisani su u poglavlju 12. Točna mehanika lanca bez kruga, parametri polaznog mehanizma, postupci nadzora širenja i detaljna analiza otpornosti na koordiniranu manipulaciju definirani su u Pravilniku o dokazu stvarnosti.

### Dinarski tok — odvojena identifikacija

Za dinarski tok vrijede odvojeni mehanizmi identifikacije: verifikacija se donatora osigurava kroz bankovni sustav — zaklada prima donacije s verificiranih bankovnih računa; verifikacija pokrovitelja (pravnih osoba, obrtnika i nositelja registriranih poljoprivrednih gospodarstava) osigurava se na temelju ugovora o donaciji sa zakladom. Ti se mehanizmi odnose na identifikaciju za potrebe financijskog toka zaklade, ne na dokaz stvarnosti korisnika, koji se ostvaruje samo u lancu potvrda.

## Korisnik koji nije u Kolu

Status korisnika ima punoljetni korisnik registriran na platformi koji još nije u Kolu. Može pregledati sustav, postavljati oglase kojima nudi ili traži dobra i usluge, razgovarati s drugim korisnicima u opsegu utvrđenom Uvjetima korištenja i sudjelovati u ažuriranju evidencije POEN-a kao primatelj i kao davatelj. Doprinos mu se evidentira kroz doprinos sadržaju platforme, financijski doprinos i pokroviteljstvo. Nema pristup upravljanju, potvrđivanju drugih ni programima potpore i ne upisuje ZRNO. Ako ne poznaje nijednog člana Kola, može dospjeti na popis za poziv, s kojeg ga član Kola zove radi upoznavanja.

Korisnik postaje član Kola kad član Kola potvrdi njegovu stvarnost i kontinuitet kroz lanac potvrda, čime stječe pun pristup sustavu. Kad ga član Kola nakon razgovora, odnosno član bez potvrde koji ga osobno poznaje, uvede u Kolo, postaje član bez potvrde.

## Član bez potvrde

Član bez potvrde je punoljetni korisnik kojeg je netko uveo u Kolo, a kojeg još nije potvrdio član Kola koji ga osobno poznaje. To je prolazan status: ima prava sudionika, ali ne i prava koja akti vezuju za člana Kola — ne potvrđuje druge, nego ih samo uvodi u Kolo, i ne aktivira ZRNO (odjeljak „Potvrda i uvođenje u Kolo”). Pripadnost Kolu, kao ni u drugim statusima, nije članstvo u zakladi ni u drugoj pravnoj osobi.

## Član Kola

Član Kola je korisnik čija je stvarnost potvrđena potvrdom u lancu potvrda. Član Kola razmjenjuje dobra i usluge s drugim korisnicima unutar sustava. Doprinosi zajedničkom dobru kroz aktivnosti čiji se doprinos evidentira u POEN-ima. Može donirati dinarska sredstva zakladi, potvrđivati stvarnost korisnika koje osobno poznaje, nakon razgovora uvoditi u Kolo korisnike s popisa za poziv i sudjelovati u krugovima i zadrugama kad se ti moduli aktiviraju (poglavlje 9).

Član Kola nema ZRNO evidentirano u protokolu. To znači da ili još nije ispunio uvjete za upis ZRNA (odjeljak 6.2), ili je odlučio da ga ne upiše. Član Kola u potpunosti koristi obračunski okvir — razmjenjuje, doprinosi, stječe evidenciju POEN-a — ali nema evidentiran položaj u smislu ZRNA i ne sudjeluje u upravljanju kroz Gornje Kolo (poglavlje 10).

Osnovna je motivacija člana Kola neposredna: sustav mu omogućuje razmjenu dobara i usluga s drugim korisnicima pod pravilima definiranima u protokolu. Član Kola ima korist od sudjelovanja svaki put kad razmijeni nešto s drugim korisnikom. Ta korist nije obećana i nije zajamčena — ovisi o tome postoje li u sustavu drugi korisnici koji nude ono što on traži i traže ono što on nudi. Detaljnija je analiza poticajne strukture dana u poglavlju 11.

## Čuvar Kola

Čuvar Kola je član Kola kojem je u protokolu upisano ZRNO. Čuvar Kola jest sve što je član Kola — razmjenjuje, doprinosi, koristi sustav — ali ima i dodatna prava te dodatnu poziciju u sustavu.

Status čuvara Kola ne oslobađa od dokaza stvarnosti: pristup čuvara Kola, kao i svakog člana Kola, proizlazi iz potvrđene stvarnosti. Čuvar Kola kojem verifikacija padne postaje korisnik. ZRNO mu ostaje upisano i zamrznuto: dok ponovno ne bude potvrđen, korisnik kojem je upisano ZRNO ne aktivira ga, ne otpisuje ga, ne delegira glas na temelju njega, nije u sastavu Gornjeg Kola i ne potvrđuje stvarnost drugih. Kada mu stvarnost bude ponovno potvrđena, ponovno je čuvar Kola. Čuvar Kola kojem se poništi samo potvrda, a uvođenje u Kolo mu i dalje vrijedi, postaje član bez potvrde: ZRNO mu ostaje upisano, aktivno ZRNO prelazi u slobodno stanje, a ponovno ga može aktivirati kada bude potvrđen. Iznimka su samo osnivači, čija potvrđenost ne proizlazi iz lanca potvrda. Čuvari Kola obavljaju funkciju nadzornika širenja za verifikacije drugih članova Kola i članova bez potvrde, kao i za potvrde članova bez potvrde. Broj verifikacija ni za koga nije ograničen; ograničen je samo dnevni tempo, isti za sve verifikatore.

Čuvar Kola, kad se Gornje Kolo uspostavi, sudjeluje u upravljanju sustavom aktiviranjem ZRNA. Gornje Kolo upravno je tijelo sustava koje čine čuvari Kola koji su aktivirali ZRNO i koje odlučuje o pravilima protokola. Mjesto i glas u Gornjem Kolu proizlaze isključivo iz aktiviranog ZRNA, ne iz bilo kojeg drugog temelja; slobodno ZRNO ne daje mjesto u Gornjem Kolu. Poglavlje 10 opisuje kako Gornje Kolo funkcionira.

Čuvar Kola ima poziciju u obračunskom sustavu čija se vrijednost mijenja s aktivnošću zajednice — korist, ograničenja i pravna kvalifikacija te pozicije opisani su u odjeljcima 6.2 i 6.3.

Motivacija čuvara Kola ima dva aspekta. Neposredna je motivacija ista kao kod člana Kola — razmjena i doprinos. Dodatna je motivacija sudjelovanje u upravljanju kroz Gornje Kolo i pozicija u obračunskom sustavu. Detaljnija je analiza poticajne strukture za sve statuse korisnika dana u poglavlju 11.

## Kako se postaje čuvar Kola

Član Kola postaje čuvar Kola upisom ZRNA kroz protokol; korisnik ZRNO ne upisuje. Član bez potvrde ZRNO upisuje, ali upisom ne postaje čuvar Kola: to postaje tek kada bude potvrđen. Uvjeti su upisa opisani u odjeljku 6.2: minimum dvadeset tisuća POEN-a evidentiranih u sustavu i ograničenje od jedan posto stanja po obračunskom razdoblju.

Prijelaz iz jednog statusa u drugi nije administrativna odluka — nijedan akter u sustavu (zaklada, osnivač, Gornje Kolo) ne odobrava niti odbija upis. Korisnik inicira upis, protokol provjerava uvjete i izvršava ga ako su ispunjeni. Upis je operacija između korisnika i protokola, bez diskrecije bilo koje osobe.

Čuvar Kola može izgubiti taj status otpisom ZRNA po obračunskom koeficijentu u novom obračunskom razdoblju. Otpis je dio mehanike sustava opisane u odjeljku 6.2. Čuvar Kola čije je ZRNO u potpunosti otpisano ponovno postaje član Kola — sa svim pravima člana Kola, bez prava koja proizlaze iz evidentiranog ZRNA. Čuvar Kola kojem padne verifikacija postaje korisnik kojem je upisano ZRNO, s posljedicama opisanima u prethodnom odjeljku.

## Odnos korisnika prema zajedničkom dobru

Svi korisnici imaju pristup zajedničkom dobru — istom softveru, istim pravilima, istoj infrastrukturi — u opsegu koji odgovara njihovu statusu. Korisnik ima pristup za pregled i sudjelovanje u razmjeni; član bez potvrde ima pristup sudionika, bez prava koja akti vezuju za člana Kola; član Kola ima pun pristup za korištenje i doprinos; čuvar Kola ima pun pristup plus pravo upravljanja i poziciju u obračunskom sustavu. Razlika između statusa nije u prirodi odnosa prema zajedničkom dobru nego u opsegu evidencije: čuvar Kola ima evidentiran položaj koji mu daje pravo na upravljanje (pod uvjetima iz poglavlja 10) i poziciju u obračunskom sustavu.

Odnos je svih korisnika prema zajedničkom dobru participativan — pravo korištenja i doprinosa, ne pravo raspolaganja ni vlasničko pravo (poglavlja 3 i 4).

Uvjeti korištenja zajedničkog dobra jednaki su za sve korisnike istog statusa, transparentni i ugrađeni u protokol. Pravila pristupa i doprinosa definirana su u pravilima korištenja sustava i mogu se mijenjati kroz procese upravljanja opisane u poglavlju 10. Jasno definirane granice pristupa i razlikovanje statusa korisnika strukturni su elementi koji odgovaraju prvom od osam dizajnerskih načela za upravljanje zajedničkim dobrima koja je formalizirala Elinor Ostrom (1990) — detaljno je mapiranje dano u Prilogu E.

## Što korisnici nisu

Korisnici KOLO sustava nisu klijenti platforme. Ne kupuju uslugu od zaklade. Ne plaćaju pretplatu. Zaklada im ne duguje uslugu. Odnos između korisnika i sustava participativan je — korisnik jest korisnik usluge u smislu propisa, ali u zajedničkom dobru sudjeluje s pravima korištenja i doprinosa, ne s pravom potraživanja usluge.

Korisnici nisu ulagači — razlozi su obrazloženi u poglavlju 4 (načelo nepovratnosti donacija) i odjeljku 6.2 (upis ZRNA na temelju evidencije doprinosa, ne uplate).

Korisnici nisu zaposlenici sustava. Sudjelovanje je u sustavu dobrovoljno i ne ispunjava nijedan od triju konstitutivnih elemenata radnog odnosa iz članka 5. Zakona o radu: ne postoji subordinacija — korisnik nije pod nadzorom niti po uputama zaklade ili bilo kojeg drugog aktera; ne postoji osobna obveza rada — korisnik sam odlučuje hoće li, kada i koliko sudjelovati; ne postoji naknada — evidencija POEN-a nije naknada za rad, nego evidencija doprinosa koja nema vanjsku imovinsku vrijednost i ne može se konvertirati u novac (poglavlja 4 i 6.1). Specifičan radnopravni aspekt operativnih programa, gdje korisnik preuzima i izvršava konkretne zadatke, razmatra se u odjeljku 8.3.

Korisnici su osobe koje koriste sustav, doprinose mu prema vlastitoj odluci i čija se pozicija u sustavu mijenja s njihovom aktivnošću i aktivnošću zajednice — u okvirima i s ograničenjima opisanima u poglavlju 6.

# 8. Doprinos zajedničkom dobru

Zajedničko dobro ne nastaje samo od sebe — nastaje doprinosom korisnika. Osim razmjene dobara i usluga između korisnika (koja preraspodjeljuje postojeće POEN-e, odjeljak 6.1), sustav prepoznaje tri kategorije doprinosa koje uvećavaju ukupan broj POEN-a u sustavu: financijski doprinos, operativni doprinos i osnivački doprinos. Sve su tri dio osnove sustava — mehanizmi koji funkcioniraju od prvog dana i na kojima počiva operativna i obračunska logika sustava. Nisu moduli koji se aktiviraju prema preduvjetima, nego konstitutivni elementi sustava: bez financijskog doprinosa zaklada nema sredstva za infrastrukturu, bez operativnog doprinosa zajednica nema mehanizam za evidentiranje aktivnosti izvan platforme, a osnivački doprinos evidentira rad obavljen prije nego što je sustav postojao. Za razliku od financijskog i operativnog doprinosa, koji traju koliko i sustav, osnivački je doprinos jednokratan i vremenski ograničen.

## 8.1 Osnivački doprinos

Osnivački doprinos rad je obavljen prije otvaranja platforme — projektiranje sustava, izrada protokola, pravna i organizacijska priprema. Po svojoj je prirodi to doprinos zajedničkom dobru istog karaktera kao operativni doprinos, ali obavljen prije nego što je sustav postojao, pa nije mogao biti evidentiran u trenutku kad se odvijao. Kroz taj kanal protokol taj rani doprinos evidentira naknadno — postupno i do unaprijed utvrđene gornje granice. Za razliku od financijskog i operativnog doprinosa, koji traju koliko i sustav, osnivački je doprinos jednokratan: kad protokol evidentira pun iznos, kanal se trajno zatvara.

Protokol ne evidentira osnivački doprinos odjednom, nego ga veže za rast sustava — evidentira ga u koracima fiksnog iznosa, razmjerno kumulativnom rastu ukupnog broja POEN-a u sustavu. To je dizajnerska odluka. Svaki upis novih zapisa POEN-a pomiče obračunski koeficijent (odjeljak 6.3); evidentiranje cijelog iznosa odjednom proizvelo bi nagao skok koeficijenta, dok vezivanje za rast sustava čini da koeficijent istu razinu dosegne razmjerno tom rastu. Kanal prati rast kakav god bio njegov tempo: ako ukupan broj POEN-a poraste naglo, koraci se evidentiraju istom brzinom kojom je rast nastupio.

Budući da je korak fiksan, utjecaj jednog koraka na koeficijent opada kako sustav raste. Udjel zbirno evidentiranog osnivačkog doprinosa u ukupnom broju POEN-a druga je veličina i ona ne opada: i pragovi i korak izraženi su u fiksnim iznosima, a POEN evidentiran kroz ovaj kanal ulazi u ukupan broj, pa zbirni osnivački doprinos čini između približno jedne petine i približno jedne četvrtine ukupnog broja evidentiranih POEN-a kroz cijeli vijek kanala — u trenutku zatvaranja približno 24%. Taj udjel ne nosi imovinsko pravo i ne predstavlja potraživanje; krug osnivača je zatvoren i ne može se proširiti, a kanal se po dostizanju gornje granice zatvara trajno.

Gornja je granica mjera doprinosa koji je prethodio sustavu: osnivači su u projektiranje, izradu i pravnu i organizacijsku pripremu uložili vlastita novčana sredstva i vlastito vrijeme, u razdoblju u kojem nijedan kanal evidentiranja nije radio. Taj se rad ne može evidentirati kroz operativni doprinos ni naknadno — dnevni limit tog kanala iznosi 10% ukupnog broja evidentiranih POEN-a, pa je dok je taj broj nula i limit nula.

Rezultat osnivačkog rada — softver, protokol i dokumentacija sustava — ulazi u zajedničko dobro pod licencijama iz poglavlja 3: softver pod AGPL-3.0, sadržaj pod CC BY-SA 4.0. Osnivači po osnovi tog rada ne stječu isključivo pravo na rezultat; on je pod istim uvjetima dostupan svim osobama, a licencije se ne mogu zamijeniti restriktivnijima.

POEN-i evidentirani kroz taj kanal bilježe se u zapisima osnivača — fizičkih osoba koje su obavile rad prije otvaranja platforme — i imaju isti status kao svi drugi POEN-i: zapisi u evidenciji bez imovinskog prava korisnika, nekonvertibilni i bez vanjske vrijednosti (poglavlja 4 i 6.1). Osnivački doprinos ne uspostavlja iznimku od pravila obračunskog okvira — osnivač koji upisuje ZRNO podliježe istom pragu i istom ograničenju po obračunskom razdoblju kao svaki drugi korisnik koji upisuje ZRNO (odjeljak 6.2) — i zaseban je mehanizam evidentiranja koji ne dodiruje limit operativnog doprinosa.

Gornja granica osnivačkog doprinosa, iznos i raspored koraka evidentiranja te točka na kojoj se kanal zatvara definirani su u Pravilniku.

## 8.2 Financijski doprinos

Financijski doprinos dinarski je priljev u zakladu koji osigurava operativnu održivost sustava. Ovaj odjeljak obuhvaća dva podmodula: donacije fizičkih osoba i pokroviteljstvo pravnih osoba, obrtnika i nositelja registriranih poljoprivrednih gospodarstava. Oba koriste isto načelo — nepovratna donacija zakladi čiji se doprinos evidentira u POEN-ima kao jednostrani administrativni zapis protokola. Razlika je u pravnoj prirodi donatora i u regulatornim obvezama koje iz toga proizlaze.

### Donacije fizičkih osoba

Poglavlje 5 opisuje financijski odnos između zajednice i zaklade kao dio osnovne arhitekture sustava — zajednica financira zakladu dinarskim donacijama, zaklada troši na infrastrukturu i programe. Ovaj odjeljak pokriva pravila, mehanizme i detalje tog odnosa.

Donacije su u dinarima ili drugoj valuti i ne ulaze u interni obračunski sustav (poglavlje 4, načelo nekonvertibilnosti). Doprinos se donatora evidentira u POEN-ima po pravilima koja definiraju odnos između iznosa donacije i broja evidentiranih zapisa — pravna je kvalifikacija tog odnosa obrazložena u poglavlju 4. Ovaj odjeljak pokriva operativnu mehaniku: razine donacija, koeficijent evidencije donacija, porezni tretman i pravila raspoređivanja viška.

Kad dinarske donacije premaše operativne troškove zaklade, višak se usmjerava u programe sustava. Kolektivne su nabave zaseban podmodul — zaklada koristi višak sredstava za nabavu dobara ili usluga koje se distribuiraju sudionicima u okviru programskih aktivnosti zaklade. Pravila raspoređivanja viška definiraju osnivač i zaklada u sadašnjoj fazi, Gornje Kolo u kasnijoj fazi.

Pravna dimenzija: donacije podliježu poreznim propisima koji reguliraju donacije zakladama. Zaklada izdaje potvrdu o donaciji u skladu sa zakonom. Porezni tretman donacije — uključujući eventualna porezna umanjenja za donatora — ovisi o statusu donatora (fizička ili pravna osoba), o registriranom statusu zaklade i o važećim poreznim propisima u trenutku donacije.

### Pokroviteljstvo pravnih osoba, obrtnika i gospodarstava

Pokrovitelji su pravne osobe, obrtnici i nositelji registriranih poljoprivrednih gospodarstava koji doniraju novac Zakladi ili se obvezuju da dobra i usluge bez naknade daju osobama koje Zaklada odredi. Ovaj podmodul most je između vanjske ekonomije i KOLO sustava.

Mehanika je sljedeća: pravna osoba, obrtnik ili nositelj registriranog poljoprivrednog gospodarstva uplaćuje donaciju na račun Zaklade, koja sredstva koristi za ciljeve sustava. Doprinos se evidentira u POEN-ima kao jednostrani administrativni zapis protokola, u zapisu korisnika koji je podnio prijavu pokroviteljstva — vlasnika, zakonskog zastupnika ili osobe koju je ovlastilo nadležno tijelo pravne osobe, odnosno samog obrtnika ili nositelja gospodarstva — po istoj tablici koja vrijedi za donacije fizičkih osoba. Pravni oblik davatelja ne utječe na koeficijent evidencije.

Evidencija se veže za fizičku osobu, a ne za samu pravnu osobu. Pravna osoba ne može biti korisnik KOLO sustava — sustav je osmišljen za fizičke osobe. Osoba koja podnosi prijavu mora biti punoljetni korisnik sustava; za novčano pokroviteljstvo verifikacija nije uvjet, a prijavu pokroviteljstva dobrima i uslugama podnosi sudionik.

Doprinos iz jedne prijave evidentira se u zapisu jednog korisnika i ne raspoređuje se na druge vlasnike, i kada pravna osoba ima više vlasnika. Svaka se donacija obračunava u trenutku primitka na temelju zasebnog ugovora o donaciji. Kumulativni doprinos pokrovitelja vodi se odvojeno od osobnih donacija korisnika i dva se zbroja ne zbrajaju; gospodarstvo ima vlastiti zbroj, odvojen i od osobnih donacija nositelja i od zbroja tvrtke s kojom je nositelj povezan. Zaklada vodi evidenciju o vezi između pravne osobe i korisnika u čijem se zapisu doprinos evidentira.

Ovo je jedina točka u sustavu gdje vanjska ekonomija izravno utječe na internu evidenciju: pravna osoba daje novac, dobra ili usluge, a protokol evidentira doprinos u zapisu fizičke osobe koja je podnijela prijavu. Evidentiranje nije davanje pravne osobe korisniku ni raspodjela dobiti i ne stvara imovinsko pravo.

Pravna dimenzija: pokrovitelj je pravna osoba ili obrtnik registriran u Republici Srbiji, odnosno nositelj registriranog poljoprivrednog gospodarstva, koji donaciju uplaćuje s računa gospodarstva ili s vlastitog računa. Zaklada provjerava pokrovitelja na temelju ugovora o donaciji i podatka o uplatitelju s izvoda, dokumentira vezu između pravne osobe i korisnika u čijem se zapisu doprinos evidentira i vodi računa o mogućem riziku zlouporabe te veze. Pokrovitelj po osnovi doprinosa ne stječe prednost pri izboru ponude u kolektivnoj nabavi.

Prije prve donacije tvrtka ili gospodarstvo jednom se upisuje u registar pokrovitelja — s podacima za kontakt, logotipom i odnosom korisnika prema njoj — i Zaklada upis provjerava; iz upisa se zatim pokreće svaka donacija, novčana ili dobrima i uslugama. Pokroviteljstvo dobrima i uslugama ima drugačiju mehaniku. Davatelj ugovorom preuzima obvezu da točno određena dobra preda, odnosno usluge pruži sudionicima koji uzmu vaučere; Zaklada dobra ne preuzima i ne posjeduje, a imatelj vaučera ima vlastito pravo prema davatelju. Prijavu podnosi zastupnik, obrtnik, vlasnik ili stvarni vlasnik, a za registrirano poljoprivredno gospodarstvo njegov nositelj. Vrijednost doprinosa je cijena iz cjenika davatelja, čiju fotografiju prilaže — Zaklada cijenu ne procjenjuje. Ugovor se sklapa elektronički, na platformi, potvrdom uz jednokratni kod. Doprinos se evidentira kad je ugovor potpisan i vaučeri izdani, s koeficijentom koji odgovara razini koju je pokrovitelj dosegnuo novčanim doprinosom; dobra i usluge razinu ne podižu, a na rang-listi pokrovitelja vode se u posebnom dijelu. Vaučer glasi na dobro ili uslugu, ne na iznos, i vrijedi godinu dana. Vaučeri su dostupni sudionicima od izdavanja, bez redoslijeda i roka: korisnik uzme vaučer i pritom mu se poništava broj POEN-a koji se izvodi iz upisa po ugovoru, bez uvećanja po koeficijentu — pa donirana stvar ne povećava ukupan broj POEN-a iznad uvećanja po koeficijentu. Zapis o tome, s opisom i nazivom davatelja, vidi se u evidenciji uz pseudonim, na što korisnik pristaje pri uzimanju; vaučer koji ne iskoristi do isteka prestaje, a poništenje ostaje. Davatelj i osobe s njim povezane ne uzimaju vlastite vaučere. Ako davatelj ne izvrši obvezu, ugovor se raskida: imateljima neiskorištenih vaučera poništenje se ispravlja, podnositelju se otpisuje ono što mu je za sve neizvršene vaučere evidentirano, uključujući uvećanje po koeficijentu, i otpis se izvršava i kada zapis time postane negativan; davatelj ne može sklopiti nov ugovor dok ga Zaklada ne skine s popisa zabrane.

## 8.3 Operativni doprinos

Operativni doprinos aktivnost je izvan platforme čiji se doprinos evidentira u POEN-ima nakon verifikacije. Zaklada, Gornje Kolo ili čuvari Kola objavljuju zadatak koji treba biti obavljen za zajedničko dobro. Korisnik se dobrovoljno prijavljuje za izvršenje zadatka, a čuvari Kola verificiraju izvršenje prije evidencije doprinosa. U Fazi 1., dok Gornje Kolo nije uspostavljeno, tu funkciju obavljaju članovi Upravnog odbora zaklade. Sve su prijave javno vidljive svim korisnicima sustava, čime se osigurava transparentnost. Operativni doprinos može obuhvatiti širok spektar aktivnosti — od organiziranja lokalnog događaja, preko tehničkog rada na infrastrukturi, do promocije sustava u zajednici.

Sustav primjenjuje limit od 10 % ukupnog broja POEN-a evidentiranih u sustavu po obračunskom razdoblju na količinu POEN-a koja se može evidentirati kroz operativni doprinos, čime štiti evidenciju od inflatornog pritiska. Taj parametar podliježe promjeni kroz procese upravljanja opisane u poglavlju 10. Postupak prijave, izvršenja i verifikacije definiran je u Pravilniku.

Pravna dimenzija: operativni doprinos ne uspostavlja radni odnos u smislu članka 5. Zakona o radu. Ne postoji subordinacija — korisnik samostalno odlučuje prijavljuje li se, sam predlaže plan izvršenja i sam određuje način rada; može odustati od zadatka bez posljedica osim izostanka evidencije doprinosa. Ne postoji osobna obveza rada — preuzimanje je dobrovoljno i ne stvara obvezu u pravnom smislu. Ne postoji naknada — POEN-i koji se evidentiraju nakon verificiranog izvršenja zapisi su u evidenciji protokola bez vanjske imovinske vrijednosti (poglavlja 4 i 6.1). Operativni doprinos nosi veći radnopravni rizik od drugih oblika sudjelovanja jer uključuje definiran zadatak s uvjetima izvršenja, ali odsutnost svih triju elemenata iz članka 5. onemogućuje kvalifikaciju kao radni odnos.

# 9. Moduli

KOLO sustav razdvaja osnovu od modula. Osnova — zajedničko dobro, protokol, zaklada, zajednica, POEN, ZRNO, korisnici, dokaz stvarnosti, financijski i operativni doprinos (poglavlja 3–8) — funkcionira od prvog dana i čini minimalan skup elemenata bez kojih sustav ne postoji. Moduli su proširenja koja dodaju funkcionalnost osnovi bez da je mijenjaju. Svaki modul koristi isti protokol, istu evidenciju i ista pravila. Svaki se aktivira prema vlastitim preduvjetima, ne u unaprijed određenom redoslijedu.

Modularnost je odluka dizajna. Sustav koji pokušava napraviti sve od prvog dana teško se testira, stabilizira i prilagođava. Sustav koji počinje s osnovom i dodaje module može provjeriti radi li osnova prije nego što je optereti, može testirati svaki modul zasebno i može prilagoditi redoslijed aktiviranja okolnostima.

Redoslijed je modula u ovom poglavlju logički, ne kronološki. Koji se modul aktivira prvi ovisi o potrebama zajednice i odluci zaklade ili Gornjeg Kola.

## Modul 1: Krugovi

Krug je organizacijska jedinica sustava utemeljena na zajedničkom interesu ili djelatnosti. Skupina korisnika — poznanika i istomišljenika — koji se udružuju oko konkretne aktivnosti, vještine, profesije ili područja radi zajedničkih aktivnosti u sustavu.

Krugovi nastaju odozdo — udruživanjem korisnika. Postojeće udruge i zadruge registrirane po Zakonu o udruženjima i Zakonu o zadrugama mogu prenijeti svoju strukturu u krug koji preslikava njihov sastav i organizaciju, čime se postojeći organizacijski oblik integrira u sustav bez potrebe za ponovnim organiziranjem.

Krugovi imaju poticajnu funkciju kroz mehanizam rasta — protokol upisuje nove zapise POEN-a u skladu s brojem članova kruga i dosezanjem definiranih pragova. POEN-i nastali tim mehanizmom evidentiraju se u zapisu kruga kao organizacijske jedinice, ne u zapisima pojedinačnih članova. To je poticaj za organsko širenje — krug raste kako se širi i njegov položaj u sustavu odražava taj rast.

Krug nema pravnu osobnost. Krug nije pravna osoba, ne može sklapati ugovore, ne može držati imovinu. Krug je organizacijska jedinica unutar sustava, ne institucija izvan njega. Udruga ili zadruga koja formira krug zadržava svoju pravnu osobnost neovisno o krugu — krug je njihov oblik unutar protokola, ne zamjena za pravni status.

## Modul 2: Zadruge

Zadruga je lokalna organizacijska jedinica sustava utemeljena na teritorijalnom načelu — po selu ili gradu u kojem se nalazi. Zadruga je osnovna lokalna struktura kroz koju se sustav širi i ukorjenjuje u konkretnim zajednicama.

Za razliku od kruga, koji je interesna skupina bez pravne osobnosti, zadruga se registrira po Zakonu o zadrugama i ima punu pravnu osobnost. To znači da zadruga ima osnivačku skupštinu, statut, registraciju u APR-u i sve obveze koje Zakon o zadrugama propisuje (čl. 2.–12.). Zadruga unutar KOLO sustava nije metafora — to je pravna osoba čiji zadrugari koriste protokol i sudjeluju u sustavu sa svog područja.

Odnos između zaklade i zadruge reguliran je ugovorom o suradnji, pri čemu zadruga zadržava punu autonomiju kao neovisna pravna osoba.

Zadruga ima dvije funkcije unutar sustava. Prva je lokalna koordinacija i raspodjela dobara na lokalitetu — zadruga je struktura kroz koju se odvija razmjena, komunikacija i organizacija aktivnosti u naselju u kojem djeluje. Korisnici unutar zadruge lakše pronalaze jedni druge i lakše koordiniraju aktivnosti jer dijele zemljopisni kontekst. Zadruga prima dobro na raspodjelu u ime i za račun zadrugara: korisniku koji je dobro donio zadruga pri primitku prepisuje POEN iz svojeg zapisa, a pri izdavanju dobra zadrugaru ili drugoj zadruzi POEN se prepisuje u zapis zadruge. Broj POEN-a za primitak i izdavanje određuje zadruga, svojim tijelima i po svojim pravilima — nikada zaklada. Druga je mehanizam rasta — dosezanje pragova broja zadrugara Protokol evidentira u POEN-ima u zapisu zadruge, po istom mehanizmu kao kod Modula 1; svaki se prag evidentira jednom.

Zadruga ne potvrđuje stvarnost korisnika. Stvarnost se potvrđuje samo u lancu potvrda (poglavlje 7), i zadruga u njemu nema posebnu ulogu.

Sudjelovanje zadruge u sustavu uređuje se Pravilnikom o zadrugama. Zadrugar je sudionik kojeg je zadruga primila u članstvo i čiji je račun povezan sa zadrugom; osoba može biti zadrugar samo u jednoj zadruzi. Zadrugar ima sva prava koja mu pripadaju po statusu i, uz njih, prava u okviru zadruge — sudjelovanje u raspodjeli, u zadružnom doprinosu i u korištenju opreme i zemljišta zadruge. Svojstvo zadrugara ne daje nikakvo dodatno ovlaštenje u sustavu. Krug i zadruga isti su kolektivni oblik pod različitim imenom: krug čiji se članovi upišu kao zadruga nastavlja kao zadruga s istim zapisom, a pragovi koje je dosegnuo kao krug ne evidentiraju se ponovno.

Pravna dimenzija: zadruga kao pravna osoba registrirana po Zakonu o zadrugama ima vlastite pravne obveze — vođenje poslovnih knjiga, godišnje izvještavanje, poštovanje zadružnih načela. Ugovor o suradnji sa zakladom definira prava i obveze obiju strana u kontekstu KOLO sustava, uključujući pravila korištenja protokola i mehanizme koordinacije. Zaklada nema pravo glasa, predlaganja ni suglasnosti u tijelima zadruge. Zadruga ne postaje vlasnik nijednog dijela zajedničkog dobra — odnos je zadruge prema zajedničkom dobru participativan, isti kao odnos svakog korisnika. Prestankom sudjelovanja zadruge u sustavu zapis zadruge se zatvara, a POEN evidentiran u njemu poništava se protuzapisom u korist Protokola.

## Modul 3: Socijalni programi

Socijalni programi mehanizam su automatske evidencije POEN-a za skupine korisnika čije strukturno sudjelovanje u zajedničkom dobru protokol prepoznaje iako se ne očituje kroz pojedinačne aktivnosti — generacijsko, solidarno ili strukturno. Automatsko evidentiranje novih POEN-a za kvalificirane skupine ima preraspodjelni učinak: novi zapisi uvećavaju ukupan broj evidentiranih POEN-a u sustavu, čime mijenjaju obračunski koeficijent za sve korisnike. Taj je učinak namjerna dizajnerska odluka — sustav prepoznaje da se sudjelovanje koje je po svojoj prirodi kontinuirano i difuzno ne može evidentirati kroz pojedinačne aktivnosti, i da je preraspodjelni trošak tog priznavanja kompromis koji sustav svjesno prihvaća zarad socijalne kohezije.

Početne su kvalificirane skupine korisnici čiji doprinos zajedničkom dobru sustav prepoznaje kao kontinuiran. Roditeljstvo čini generacijski doprinos koji se po svojoj prirodi ne može evidentirati kroz pojedinačne aktivnosti. Stariji su korisnici doprinos zajednici dali tijekom života — evidencija je u POEN-ima priznanje akumuliranog doprinosa. Osobe s invaliditetom sudjeluju u zajednici pod uvjetima koji zahtijevaju prilagodbu, ne ocjenu produktivnosti. Studenti ulažu u vlastiti razvoj koji se vraća zajednici — evidencija je tijekom studiranja priznanje tog ulaganja. Nove se skupine mogu dodavati prema potrebama zajednice i odluci zaklade ili Gornjeg Kola.

Mehanika je sljedeća: sudionik koji pripada kvalificiranoj skupini unosi dodatne podatke koji potvrđuju taj status — status roditelja, životnu dob, invaliditet, studentski status; ispunjenost uvjeta potvrđuje član Kola koji ga osobno poznaje, a prijavu odobrava zaklada. Nakon odobrenja protokol automatski upisuje nove zapise POEN-a za tog primatelja potpore svakodnevno, bez potrebe za konkretnom aktivnošću. To je kategorija evidentiranja POEN-a uz donacije, dosezanje pragova, operativni doprinos, verifikaciju i pokroviteljstvo. Pravni je temelj za automatsko evidentiranje zapisa POEN-a u socijalnim programima odluka zaklade (u sadašnjoj fazi) ili Gornjeg Kola (u kasnijoj fazi) o pravilima protokola, donesena u okviru ostvarivanja općekorisnih ciljeva zaklade.

Automatska evidencija u socijalnim programima nije naknada — njome se ne plaća nijedan rad, usluga ni druga činidba, niti se od primatelja potpore zauzvrat traži bilo što prema zakladi. Programi se provode u ostvarivanju ciljeva zaklade utvrđenih člankom 6. Statuta, osobito socijalne zaštite i solidarne podrške ranjivim društvenim skupinama, a primateljima potpore omogućuju ravnopravnije sudjelovanje u sustavu.

Pravna dimenzija: socijalni programi zahtijevaju verifikaciju posebnih kategorija osobnih podataka — zdravstveno stanje, invaliditet, obiteljski status, životnu dob, studentski status. Obrada tih podataka podliježe pojačanim zahtjevima u skladu sa Zakonom o zaštiti podataka o ličnosti i GDPR-om. Pravni je temelj obrade izričita privola primatelja potpore. Privola se može povući u svakom trenutku, s posljedicom prestanka automatskog evidentiranja POEN-a. Mjere zaštite i prava primatelja potpore u vezi s posebnim kategorijama podataka opisani su u poglavlju 12.

## Modul 4: Djeca

Ovaj modul utvrđuje poseban režim prava, ograničenja i zaštite za maloljetne korisnike sustava, s dodatnim ograničenjima za osobe mlađe od petnaest godina u skladu s čl. 16. ZZPL-a.

Maloljetni korisnik nema status korisnika, člana bez potvrde, člana Kola ni čuvara Kola; njegov položaj uređuje Pravilnik o sudjelovanju djece. Maloljetna osoba može sama otvoriti račun, ali do suglasnosti roditelja ili zakonskog zastupnika račun ostaje bez pristupa funkcijama sustava i bez evidentiranja doprinosa. Dijete prolazi kroz tri stanja: dijete na čekanju, čiji roditelj još nije preuzeo račun; dijete s roditeljem, čiji je roditelj preuzeo račun, ali nije član Kola (nego korisnik ili član bez potvrde) ili postojanje djeteta još nije potvrđeno; i dijete Kola, čiji je roditelj član Kola i čije je postojanje potvrđeno. Opseg aktivnosti u svakom stanju, dopušteni opseg razmjene i ograničenja koja vrijede utvrđuje Pravilnik o sudjelovanju djece. Dijete koje nije dijete Kola ne sudjeluje u prepisu POEN-a ni u jednom smjeru, ni s roditeljem. Postojanje djeteta potvrđuje član Kola koji osobno poznaje roditelja, a zahtjev za potvrdu ne vide članovi bez potvrde; po toj potvrdi POEN se ne evidentira, tko lažno potvrdi odgovara kao za lažnu verifikaciju, a ako potvrda ne stigne, roditelju se ništa ne oduzima. Dijete ne ulazi u lanac potvrda. Kad postane punoljetno, verifikaciju mu automatski daje prvi roditelj, po redu povezivanja, koji je član Kola, i ta je verifikacija potvrda; ako nijedan roditelj nije član Kola, a neki je član bez potvrde, prvi takav roditelj uvodi ga u Kolo; ako nijedan roditelj nije u Kolu, punoljetni korisnik nema drugi status osim statusa korisnika. Maloljetni korisnik ne može upisati ZRNO niti sudjelovati u upravljanju kroz Gornje Kolo do navršenih 18 godina — to ograničenje štiti integritet upravljačkog tijela od pravnih komplikacija vezanih uz poslovnu sposobnost maloljetnih osoba.

Pravna dimenzija: obrada podataka maloljetnih osoba podliježe pojačanim zahtjevima. Suglasnost roditelja ili zakonskog zastupnika pravni je preduvjet za obradu. Posebne mjere zaštite podataka maloljetnih korisnika dio su pravila ovog modula i usklađuju se sa Zakonom o zaštiti podataka o ličnosti i GDPR-om. Zaštita maloljetnih korisnika od zlouporabe, neodgovarajućeg sadržaja i neprimjerene interakcije prioritet je dizajna ovog modula.

## Modul 5: Internacionalizacija

Internacionalizacija je infrastrukturno širenje sustava na nove regije. KOLO se ne replicira — ne stvara kopije sustava s odvojenom evidencijom. Sustav proširuje svoju infrastrukturu, evidenciju i pravila na nova područja, zadržavajući jedinstven protokol i jedinstvenu evidenciju zajedničkog dobra.

Širenje na nove regije zahtijeva prilagodbe u više dimenzija: pravni okvir ciljne jurisdikcije (posebno u pogledu zaštite podataka, poreznog tretmana i statusa zaklade), jezična lokalizacija platforme, uspostavljanje lokalnog lanca potvrda za dokaz stvarnosti i eventualno formiranje lokalnih zadruga (Modul 2) kao organizacijskih jedinica na novom području.

Preduvjet za aktiviranje ovog modula stabilan je sustav s aktivnim Gornjim Kolom, dovoljno iskustva s funkcioniranjem sustava u osnovnoj regiji i pravna analiza za ciljne jurisdikcije. Odluku o širenju donosi Gornje Kolo.

Pravna dimenzija: širenje na područje Europske unije zahtijeva punu usklađenost s GDPR-om. Širenje na druge jurisdikcije zahtijeva analizu lokalnih propisa o zaštiti podataka, digitalnoj imovini, zakladama i zadrugama. Međunarodni institucionalni okvir opisan u Prilogu A — posebno Akcijski plan EU-a za socijalnu ekonomiju i rezolucija UN-a A/RES/77/281 — pruža polazni okvir za pozicioniranje sustava u novim jurisdikcijama.

# 10. Upravljanje

Svaki sustav ima pravila. Netko ta pravila mora postaviti, netko ih mora mijenjati kad se okolnosti promijene i netko mora osigurati da se primjenjuju dosljedno. Pitanje upravljanja nije upravlja li netko sustavom — nego tko, kako i pod kojim ograničenjima.

KOLO sustav rješava to pitanje progresivnom decentralizacijom — strukturiranom putanjom od centraliziranog prema decentraliziranom upravljanju s mjerljivim uvjetima prijelaza (usp. Walden, 2020). Upravljanje počinje centralizirano — kod osnivača i zaklade — i progresivno se prenosi na zajednicu kroz Gornje Kolo.

Decentralizirano upravljanje zahtijeva tri stvari koje na početku ne postoje: dovoljan broj korisnika da odluke budu reprezentativne, iskustvo sa sustavom da pravila budu testirana u praksi i dokazanu stabilnost osnove prije nego što se upravljanje prenese. Centralizirano je upravljanje u osnivačkoj fazi nužnost dizajna, ne ideološki izbor — svaki složeni sustav počinje s malim brojem autora koji postavljaju osnovu prije nego što je predaju široj zajednici na upravljanje.

## Dvije faze upravljanja

U prvoj fazi pravila protokola postavlja osnivač u suradnji sa zakladom. Osnivač ima diskreciju koju kasnije neće imati nitko — može mijenjati pravila brzo i prilagođavati parametre na temelju prvih iskustava. Ali ta diskrecija nije neograničena — osnivač ne može promijeniti četiri načela iz poglavlja 4, ne može promijeniti licence pod kojima je zajedničko dobro objavljeno i ne može prisvojiti zajedničko dobro. Ta su ograničenja ugrađena u pravilnik sustava kao normativni akt zaklade, a istodobno u tehničku arhitekturu sustava — čime su zaštićena i pravno i tehnički. Prva faza traje do trenutka kada ukupan broj POEN-a evidentiranih u sustavu dosegne 1.000.000. U obračunskoj logici, protokol koji upisuje nove zapise POEN-a vodi negativno stanje — svaki novi zapis POEN-a smanjuje stanje protokola za jedan — tako da prag od milijun evidentiranih POEN-a odgovara stanju protokola od −1.000.000.

U drugoj fazi Gornje Kolo postaje upravno tijelo sustava. Gornje Kolo nastaje automatski s aktivacijom ZRNA. Nema zasebnog koraka aktivacije, nema dodatnih preduvjeta: milijun POEN-a prag je koji istodobno aktivira ZRNO i uspostavlja Gornje Kolo. Jedan prag, jedan prijelaz. Gornje Kolo čine čuvari Kola koji su aktivirali ZRNO, uključujući osnivače: aktiviranjem ZRNO prelazi u glasačku moć, a slobodno ZRNO ne daje mjesto u Gornjem Kolu. Čuvar Kola ulazi u sastav Gornjeg Kola aktiviranjem ZRNA, a izlazi iz njega kada mu nijedno ZRNO više nije aktivno, odnosno padom potvrde stvarnosti. Budući da se broj aktivnih ZRNA i glasačka moć stalno mijenjaju, sastav Gornjeg Kola i glasačka moć svakog čuvara Kola utvrđuju se iz evidencije protokola za svako obračunsko razdoblje posebno i vrijede samo tijekom tog razdoblja. Odlučuje o pravilima protokola, o aktiviranju i deaktiviranju modula te o svim pitanjima koja utječu na zajedničko dobro, osim pitanja koja su izuzeta iz njegove nadležnosti u skladu s pravilnikom sustava. Vrste odluka, pragovi za donošenje odluka, kvorum i postupak glasovanja utvrđuju se Pravilnikom o Gornjem Kolu. U pogledu raspoređivanja dinarskih sredstava, Gornje Kolo upućuje preporuke Upravnom odboru zaklade, koji ih razmatra i primjenjuje u okviru svojih zakonskih ovlasti po Zakonu o zadužbinama i fondacijama — s obvezom obrazloženog odgovora na svaku preporuku. Zaklada u ovoj fazi zadržava servisnu ulogu — drži infrastrukturu, zastupa sustav u pravnom prometu i primjenjuje odluke Gornjeg Kola. Gornje Kolo tijelo je obrazovano pravilnikom zaklade i ne ubraja se u njezina tijela utvrđena statutom; odluku Gornjeg Kola provodi Upravni odbor svojim aktom i dužan ga je donijeti, a odbiti može samo ako je odluka suprotna zakonu ili statutu, ako zadire u pitanja izuzeta iz nadležnosti Gornjeg Kola ili ako je na snazi zaštitni veto — uvijek uz obrazloženje koje se objavljuje. Nadležnost time ostaje ondje gdje je zakon postavlja, a zaklada se vlastitim aktom obvezuje postupiti po odluci. Zaklada zadržava i zaštitni veto na odluke Gornjeg Kola. Veto se gasi trajno i jednosmjerno kada financijska sredstva Zaklade dosegnu prag financijske samostalnosti utvrđen posebnim pravilnikom.

## Kvadratno glasovanje i delegiranje

Gornje Kolo donosi odluke kvadratnim glasovanjem (Posner i Weyl, 2018; Lalley i Weyl, 2018) — mehanizmom u kojem je glasačka moć jednaka cjelobrojnoj vrijednosti kvadratnog korijena iz broja aktivnih ZRNA, zaokruženoj naniže. Slobodno ZRNO ne daje glasačku moć — čuvar Kola koji želi glasovati mora aktivirati ZRNO, čime odustaje od mogućnosti otpisa dok ga ne vrati u slobodno stanje (odjeljak 6.2). ZRNO se ne troši glasovanjem.

Taj mehanizam adresira dva problema klasičnog glasovanja: problem većine i problem plutokracije. Kvadratni korijen osigurava da glasačka moć raste sporije od broja aktivnih ZRNA — čuvar Kola sa 100 aktivnih ZRNA ima 10 glasova, ne 100 — čime se sprječava koncentracija upravljačke moći. Glasačka moć proizlazi iz aktiviranog ZRNA, ne iz broja POEN-a i ne iz dinarskih donacija.

Čuvari Kola koji ne žele ili ne mogu sudjelovati u svakom glasovanju mogu delegirati svoje glasove drugom čuvaru Kola (usp. Ford, 2002; Blum i Zuber, 2016). Delegiraju se glasovi, ne ZRNO — delegator zadržava ZRNO u svojoj evidenciji i može povući delegiranje u svakom trenutku. Delegiranje je opće — delegat glasuje u ime delegatora o svim pitanjima dok delegiranje traje. Delegirani se glasovi zbrajaju s vlastitim glasovima delegata bez ponovne primjene kvadratnog korijena — delegat koji ima 4 vlastita glasa (√16 aktivnih ZRNA) i primi 3 delegirana glasa glasuje s ukupno 7 glasova, ne s √49. Delegiranje adresira problem participacije — osigurava da glasačka moć neaktivnih čuvara Kola bude zastupljena umjesto da propada. Neprenosivost ZRNA ostaje potpuna. Pravila delegiranja, uključujući učinke opoziva i ograničenja delegiranja, utvrđuju se Pravilnikom o Gornjem Kolu.

## Zaštitne mjere

Gornje Kolo nema neograničenu moć. Tri su ograničenja ugrađena u dizajn sustava.

Prvo su ograničenje četiri načela sustava (poglavlje 4). Nijedna odluka Gornjeg Kola ne može ukinuti nekonvertibilnost, uvesti imovinsko pravo nad zapisima, učiniti donacije povratnima ili napustiti načelo minimizacije podataka. Ta su načela iznad upravljačke moći Gornjeg Kola jer bi njihovo ukidanje promijenilo pravnu prirodu sustava — KOLO bez tih načela prestaje biti participativni sustav zajedničkog dobra i potpada pod regulatorne okvire namijenjene financijskim instrumentima, platnim servisima ili ulagačkim shemama.

Drugo je ograničenje zaštitni veto zaklade — pravo da odbije izvršenje odluke koja bi ugrozila operativnu i financijsku održivost zaklade prije nego što ona dosegne financijsku samostalnost, osobito odluke o trošenju dinarskih sredstava koje bi narušile sposobnost zaklade da pokriva osnovne troškove i održava infrastrukturu sustava. Veto nije diskrecijski — zaklada mora obrazložiti svaki veto pozivanjem na konkretnu prijetnju održivosti, a veto bez obrazloženja zlouporaba je koja podliježe odgovornosti u skladu s pravilnikom sustava. Četiri načela, licence zajedničkog dobra i zakonske obveze Upravnog odbora ostaju zaštićeni neovisno o vetu. Zaštitni se veto gasi trajno i jednosmjerno kada financijska sredstva Zaklade dosegnu prag financijske samostalnosti utvrđen posebnim pravilnikom. Gašenje je veta nepovratno jer je svaki mehanizam koji bi omogućio vraćanje veta istodobno mehanizam koji bi zakladi davao mogućnost da ponovno centralizira upravljanje. Gašenje je veta u interesu zaklade jer prag financijske samostalnosti označava trenutak u kojem zaklada ima dovoljno sredstava za pokretanje programskih aktivnosti koje znatno uvećavaju korisnost sustava za sve korisnike i time jačaju operativnu održivost sustava. Gašenje veta ne ukida zakonske obveze Upravnog odbora — UO ostaje pravno odgovoran po Zakonu o zadužbinama i fondacijama i ne može izvršiti odluku koja bi kršila važeći zakon, bez obzira na to postoji li zaštitni veto.

Treće su ograničenje licence (poglavlje 3). Gornje Kolo ne može zamijeniti AGPL-3.0 i CC BY-SA 4.0 restriktivnijim licencama.

U slučaju prestanka zaklade zajedničko dobro ne prestaje postojati — softver i sadržaj ostaju dostupni po uvjetima licenci, a evidencija i infrastruktura prenose se na pravnog sljednika koji prihvaća četiri načela sustava i preuzima obvezu čuvanja zajedničkog dobra. Pravila prijenosa utvrđuju se Statutom i posebnim aktom Zaklade.

## Što upravljanje nije

Upravljanje KOLO sustavom nije upravljanje tvrtkom. Nema dioničara, nema dividendi, nema odbora direktora koji maksimizira vrijednost za vlasnike.

Upravljanje KOLO sustavom nije upravljanje državom. Nema područja, nema prisile, nema monopola na silu. Sudjelovanje je dobrovoljno. Korisnik koji se ne slaže s odlukama Gornjeg Kola zadržava pravo izlaska iz sustava (usp. Hirschman, 1970) — u tom se slučaju njegova prava u vezi s evidencijom ostvaruju u skladu s poglavljem 12 (Zaštita podataka).

Upravljanje KOLO sustavom upravljanje je zajedničkim dobrom. Čuvari Kola koji su aktivirali ZRNO — članovi Kola koji imaju evidentiran doprinos i evidentiran položaj — odlučuju o pravilima sustava koji je kolektivno dobro svih korisnika. Njihov je odnos prema sustavu participativan: pravo korištenja, doprinosa i sudjelovanja u upravljanju, ne pravo raspolaganja. Progresivna decentralizacija osigurava da to upravljačko pravo preuzmu kad su spremni odgovorno ga koristiti.

# 11. Teorija igara i poticaji

Prethodna poglavlja opisuju što sustav jest i kako funkcionira. Ovo poglavlje analizira zašto funkcionira — što motivira svakog korisnika da sudjeluje, zašto je suradnja strukturno povoljnija od zlouporabe i koji mehanizmi obeshrabruju ponašanje koje bi narušilo integritet sustava. Analiza se oslanja na koncepte iz teorije dizajna mehanizama (mechanism design; Hurwicz, 1960, 1973; Myerson, 1981; Maskin, 1999), upravljanja zajedničkim dobrima (Ostrom, 1990), logike kolektivne akcije (Olson, 1965) i evolucije suradnje u iterativnim interakcijama (Axelrod, 1984).

Ova analiza nije obećanje. Sustav ne jamči da će svaki korisnik imati korist, ne jamči da zlouporaba nikad neće biti pokušana i ne jamči da će svi poticaji funkcionirati kako je predviđeno. Ova analiza opisuje strukturne poticaje koji su ugrađeni u dizajn sustava i objašnjava zašto je, na temelju tih poticaja, racionalno očekivati da sustav funkcionira — ali i gdje postoje napetosti koje sustav prepoznaje i kojima upravlja. U terminologiji teorije dizajna mehanizama, pitanje je je li KOLO poticajno usklađen (incentive-compatible) — jesu li pravila sustava dizajnirana tako da racionalno ponašanje svakog korisnika dovodi do poželjnog kolektivnog ishoda (Hurwicz, 1973). Odgovor nije jednostavno „da” — različite aktivnosti u sustavu imaju različite poticajne profile, a jedno strukturno pitanje — odnos između akumulacije i cirkulacije — zahtijeva posebnu analizu.

## Poticaji korisnika sustava

Korisnik sustava ima neposrednu korist od sudjelovanja — razmjenjuje dobra i usluge s drugim korisnicima. Što je više korisnika u sustavu, veća je vjerojatnost da će korisnik pronaći ono što traži i da će netko tražiti ono što on nudi. To je pozitivan mrežni učinak (Katz i Shapiro, 1985) — korisnost sustava za svakog pojedinačnog korisnika raste s brojem korisnika, čime se smanjuje problem dvostruke koincidencije potreba koji ograničava neposrednu razmjenu (Jevons, 1875).

Korisnik sustava ima i drugu motivaciju. Aktivnosti koje predstavljaju doprinos korisnika — donacije, pokroviteljstvo, operativni doprinos i verifikacija korisnika — vode do akumulacije evidencije POEN-a u zapisu korisnika. Akumulirana je evidencija POEN-a preduvjet za upis ZRNA — sudionik koji aktivno doprinosi sustavu progresivno se približava pragu na kojem može upisati ZRNO i time steći pravo sudjelovanja u upravljanju i poziciju u obračunskom sustavu (odjeljak 6.2).

Ta dva poticaja — neposredna korist od razmjene i dugoročna pozicija kroz akumulaciju — nisu uvijek usklađena. Razmjena dobara i usluga preraspodjeljuje postojeće POEN-e između korisnika (zero-sum, odjeljak 6.1) — korisnik koji daje dobro ili uslugu smanjuje vlastiti broj evidentiranih POEN-a, čime smanjuje i vlastitu sposobnost da upiše ZRNO. Aktivnosti kroz koje nastaju novi POEN-i — donacije, verifikacija, operativni doprinos, dosezanje pragova — uvećavaju broj evidentiranih POEN-a korisnika bez toga da ga drugi gube. Racionalan korisnik koji želi maksimizirati vlastitu poziciju za upis ZRNA ima strukturni poticaj da favorizira aktivnosti kroz koje nastaju novi POEN-i nad razmjenom koja ih preraspodjeljuje. Ta napetost između akumulacije i cirkulacije — analogna problemu koji literatura o komplementarnim valutama identificira kao središnju dizajnersku dilemu (Gesell, 1916; Lietaer, 2001; Greco, 2009) — zaslužuje posebnu analizu i dana je u odjeljku „Napetost između akumulacije i cirkulacije” u nastavku ovog poglavlja.

U ranoj fazi sustava s malim brojem korisnika neposredna korist od razmjene može biti ograničena. Ovo je klasičan problem pokretanja (cold-start problem) — sustav ima vrijednost tek kad ima dovoljno korisnika, ali korisnici nemaju razlog pridružiti se dok sustav nema vrijednost. KOLO adresira taj problem na dva načina. Prvo, prvi korisnici dolaze iz postojećih socijalnih mreža — kroz lanac potvrda u kojem članovi Kola dovode ljude koje osobno poznaju, čime se osigurava da rana zajednica ima prethodno uspostavljene odnose povjerenja i realne mogućnosti razmjene. Drugo, evidencija POEN-a koja se akumulira od prvog dana zadržava vrijednost i kad sustav naraste — rani korisnici koji su stekli evidenciju pri nižem obračunskom koeficijentu imaju poziciju koja odražava njihov doprinos u fazi kad je doprinos bio najvrjedniji za uspostavljanje sustava. Ta struktura potiče rano sudjelovanje bez toga da obećava prinos — korist ranog korisnika ovisi o tome hoće li sustav zaista narasti, što nije zajamčeno.

Ta struktura adresira problem besplatnog jahanja (free-rider problem) koji Olson (1965) identificira kao središnju prepreku kolektivnoj akciji — ali samo na razini aktivnosti kroz koje nastaju novi POEN-i: korisnik koji donira, verificira ili obavlja operativne zadatke istodobno doprinosi zajedničkom dobru i gradi vlastitu poziciju. Na razini razmjene odnos je drukčiji — korisnik koji razmjenjuje doprinosi zajedničkom dobru (uvećava opseg aktivnosti i čini sustav korisnijim za sve ostale korisnike), ali u istom činu umanjuje vlastiti broj evidentiranih POEN-a. Na razini financiranja infrastrukture problem besplatnog jahanja ostaje — korisnik koji ne donira koristi infrastrukturu koju financiraju donatori. To je strukturna asimetrija koju sustav ne eliminira, već ublažava: struktura poticaja za donatore, opisana u nastavku ovog poglavlja, osigurava da doniranje bude racionalno za korisnike koji aktivno koriste sustav, ali ne prisiljava nikoga da donira.

## Poticaji verifikatora

Verifikator je član Kola, osnivač ili član bez potvrde koji utvrđuje stvarnost korisnika — potvrdom ili uvođenjem u Kolo — na temelju osobnog poznanstva ili razgovora nakon poziva (poglavlje 7). Verifikator ima dva poticaja.

Prvi je evidencija doprinosa. Protokol bilježi čin verifikacije kao doprinos zajedničkom dobru — po verifikaciji se verifikatoru i verificiranome evidentira isti, fiksni iznos POEN-a, jednom po verificiranoj osobi, i to tek kada verificirani ostvari prvi potvrđeni doprinos. Čin je verifikacije doprinos integritetu sustava jer osigurava da iza zapisa u evidenciji stoji stvarna osoba.

Drugi je širenje mreže. Verifikator koji dovede novog korisnika u sustav širi mrežu razmjene koja je korisna i njemu — više potencijalnih partnera za razmjenu. Taj je poticaj usklađen s kolektivnim interesom jer je rast mreže koristan za sve korisnike.

Verifikator ima i strukturno ograničenje — stavlja vlastitu poziciju u sustavu kao ulog za točnost verifikacije. Posljedice lažne verifikacije osiguravaju da trošak lažne verifikacije bude veći od koristi od nje: lažna verifikacija poništava se zajedno sa zapisima POEN-a nastalima po njoj, a ono što je na temelju nje izvučeno iz mreže pada na verifikatora kao nadoknada, koja njegov zapis može oboriti u negativnu vrijednost i nije ograničena gornjim iznosom (čl. 20b Pravilnika o dokazu stvarnosti); osim toga, utvrđena lažna verifikacija u pravilu je razlog za isključenje verifikatora, a Zaklada može izreći i suspenziju, po postupku iz Uvjeta korištenja i uz pravo na prigovor (čl. 21 Pravilnika o dokazu stvarnosti). Verifikator koji lažno potvrdi riskira vlastiti zapis POEN-a i položaj u sustavu. Ta struktura čini da je racionalan izbor verifikatora potvrditi samo osobe čiju stvarnost zaista poznaje — korist od jedne lažne verifikacije (POEN-i za verifikaciju) nerazmjerno je manja od potencijalnog gubitka (cjelokupna pozicija u sustavu).

## Poticaji čuvara Kola

Čuvar Kola ima sve poticaje korisnika sustava, plus dva dodatna: sudjelovanje u upravljanju kroz Gornje Kolo i poziciju u obračunskom sustavu čija se vrijednost mijenja s aktivnošću zajednice (poglavlja 6 i 10). Oba su dodatna poticaja usklađena s kolektivnim interesom — čuvar Kola želi da sustav raste jer njegova pozicija ovisi o kolektivnoj aktivnosti. Korist i ograničenja te pozicije kvalificirani su u odjeljku 6.2.

Čuvar Kola ima i mogućnost otpisa — vraćanja slobodnog ZRNA u fond raspoloživih uz evidenciju POEN-a po tekućem obračunskom koeficijentu (odjeljak 6.2). Ta mogućnost nije poticaj: razlika prema broju POEN-a utrošenom pri upisu nastaje u oba smjera, nijedna je osoba ne obećava, a vlastiti upis i otpis koeficijent ne pomiču (odjeljak 6.3). Eventualna je korist uz to ograničena na interni kapacitet razmjene, jer POEN-i ne mogu napustiti sustav. Istodobno, strukturni izbor između upravljačke funkcije (aktivno ZRNO) i obračunske fleksibilnosti (slobodno ZRNO) sprječava istodobnu realizaciju obiju koristi.

Na individualnoj razini čuvar Kola ima poticaj da drugi razmjenjuju i doprinose, dok sam favorizira aktivnosti kroz koje nastaju novi POEN-i nad razmjenom koja mu smanjuje broj evidentiranih POEN-a. Ta je asimetrija strukturno svojstvo koje proizlazi iz napetosti između akumulacije i cirkulacije opisane u nastavku ovog poglavlja. Čuvar Kola ne može ostvariti korist od položaja na račun ostalih korisnika u smislu ekstrakcije vrijednosti iz sustava — ZRNO se ne može prenijeti, ne može prodati i ne može unovčiti.

## Poticaji donatora

Donator daje dinarska sredstva zakladi nepovratno (poglavlje 4). Neposredan je poticaj isti kao kod svakog korisnika — koristi sustav i ima korist od njegova funkcioniranja. Donacija financira infrastrukturu koja održava sustav koji donator koristi, po logici koja odgovara modelu klupskih dobara (Buchanan, 1965). Razlika u odnosu na klasična klupska dobra jest u mehanizmu isključivanja — KOLO ne isključuje korisnike koji ne doniraju iz korištenja sustava, ali donator stječe evidenciju doprinosa koja ga može približiti pragu za upis ZRNA, dok korisnik koji ne donira taj prag ispunjava isključivo drugim aktivnostima.

U kontekstu napetosti između akumulacije i cirkulacije donacija ima posebno poticajno svojstvo: jedina je aktivnost u sustavu kroz koju za korisnika nastaju novi POEN-i, a istodobno se financira infrastruktura zajedničkog dobra. Struktura nepovratnosti funkcionira kao mehanizam selekcije — privlači korisnike koji su motivirani korištenjem sustava, ne one koji traže ulaganje — doniranje je racionalno samo za korisnike koji zaista koriste sustav i imaju korist od njegova funkcioniranja (Hurwicz, 1973).

## Položaj pokrovitelja

Pokrovitelj je pravna osoba, obrtnik ili nositelj registriranog poljoprivrednog gospodarstva koji donira novac Zakladi ili se obvezuje da dobra i usluge daje osobama koje Zaklada odredi (odjeljak 8.2). Pokroviteljstvo je javna evidencija — zaklada vodi i objavljuje evidenciju o pokroviteljima kao dio transparentnosti sustava, a ne kao uslugu oglašavanja; evidencija sadrži naziv i logotip pokrovitelja i osim njih ne prikazuje ništa drugo, a pokrovitelj ne stječe pravo na promociju ni drugu protučinidbu. Doprinos se evidentira u zapisu korisnika koji je podnio prijavu, po istoj tablici kao osobna donacija, i nastaje samo ako zajednica primi stvarna sredstva ili ako davatelj preuzme obvezu za koju odgovara otpisom.

## Napetost između akumulacije i cirkulacije

Svaki sustav koji koristi internu obračunsku jedinicu za evidenciju doprinosa suočava se s temeljnim pitanjem: favorizira li poticajna struktura cirkulaciju (razmjenu između korisnika) ili akumulaciju (držanje zapisa radi pozicioniranja). Silvio Gesell je početkom dvadesetog stoljeća identificirao akumulaciju — gomilanje — kao središnju prepreku cirkulaciji u sustavima razmjene i predložio demurrage (trošak držanja) kao rješenje (Gesell, 1916). LETS sustavi, vremenske banke i lokalne valute suočavaju se s istim problemom u različitim varijantama — nedovoljna je cirkulacija jedan od empirijski dokumentiranih razloga zašto mnogi komplementarni sustavi ostaju mali ili zamiru (Seyfang, 2006; North, 2007).

KOLO sustav ima tu napetost ugrađenu u svoju poticajnu strukturu i prepoznaje je kao dizajnerski izbor, ne kao nedostatak. Struktura je poticaja sljedeća.

Aktivnosti koje predstavljaju doprinos korisnika — donacije zakladi, pokroviteljstvo, operativni doprinos i verifikacija korisnika — uvećavaju stanje korisnika i istodobno doprinose zajedničkom dobru. Za te su aktivnosti individualni i kolektivni poticaj usklađeni: korisnik gradi vlastitu poziciju i doprinosi sustavu istodobno.

Razmjena dobara i usluga — deklarirana kao središnja aktivnost sustava — preraspodjeljuje postojeće POEN-e između korisnika (zero-sum). Korisnik koji daje dobro ili uslugu smanjuje vlastiti broj evidentiranih POEN-a. Za korisnika koji teži upisu ZRNA (minimum 20.000 POEN-a, odjeljak 6.2), svaka razmjena u kojoj daje više nego što prima odgađa trenutak dosezanja praga. Racionalan korisnik koji maksimizira vlastitu poziciju za upis ZRNA ima poticaj favorizirati donacije i verifikaciju nad razmjenom.

Ta je napetost svjestan dizajnerski izbor s trima obrazloženjima.

Prvo, neposredna korist od razmjene postoji neovisno o evidenciji POEN-a. Korisnik koji razmijeni sat svog rada za sat tuđeg rada dobio je nešto što mu je potrebno — taj rezultat ima vrijednost bez obzira na promjenu stanja POEN-a. POEN-i evidentiraju da se razmjena dogodila, ali korist od razmjene nije u POEN-ima nego u dobru ili usluzi koju je korisnik primio. Korisnik ne razmjenjuje zato što želi POEN-e — razmjenjuje zato što želi ono što drugi korisnik nudi. Evidencija je POEN-a posljedica razmjene, ne njezin cilj.

Drugo, sustav koji bi nagrađivao cirkulaciju — na primjer, upisom bonus POEN-a za svaku razmjenu — otvorio bi prostor za lažnu razmjenu: dva bi korisnika mogla razmjenjivati naprijed-natrag bez stvarne razmjene dobara ili usluga, samo da bi ostvarila bonuse. Zero-sum priroda razmjene strukturna je zaštita od te vrste manipulacije — kad razmjena ne uvećava ukupan broj POEN-a, lažna razmjena nema koristi za manipulatora. Sustav svjesno bira zaštitu od manipulacije nad poticanjem cirkulacije.

Treće, tok novca u fond zaklade — koji se zatim troši na infrastrukturu i programe — za operativnu je održivost sustava važniji od cirkulacije POEN-a unutar obračunskog okvira. Poticajna struktura koja favorizira donacije nad razmjenom usklađuje individualno ponašanje s operativnom potrebom sustava: korisnik koji donira financira infrastrukturu koju svi koriste, dok korisnik koji samo razmjenjuje koristi infrastrukturu bez doprinosa njezinu održavanju.

Taj dizajnerski izbor ima posljedice koje sustav prepoznaje. Korisnici koji imaju više resursa za doniranje mogu brže doseći prag za upis ZRNA od korisnika koji doprinose isključivo razmjenom. To nije strukturna nepravda — donacija nije povlašten put do ZRNA, svi putovi koriste isti prag — ali jest asimetrija u brzini dosezanja tog praga. Sustav ublažava tu asimetriju na dva načina: kroz operativni doprinos i verifikaciju nastaju novi POEN-i bez dinarskog troška, čime korisnici bez resursa za doniranje mogu graditi poziciju doprinosom vremena i aktivnosti; kroz socijalne programe (Modul 3, poglavlje 9) automatski nastaju novi POEN-i za kvalificirane skupine korisnika čiji je doprinos zajedničkom dobru neizravan. Nijedan od tih mehanizama ne eliminira asimetriju potpuno — korisnik koji donira i razmjenjuje i verificira gradi poziciju brže od korisnika koji samo razmjenjuje. Pitanje je li ta asimetrija prihvatljiva ili zahtijeva korekciju ostaje otvoreno i rješava se kroz procese upravljanja opisane u poglavlju 10 — parametri koji utječu na odnos između akumulacije i cirkulacije upravo su vrsta pitanja o kojima Gornje Kolo odlučuje na temelju empirijskog iskustva s funkcioniranjem sustava.

## Zašto je suradnja strukturno povoljnija od zlouporabe

Svaki sustav s evidencijom i obračunom privlači pokušaje zlouporabe. Ostrom (1990) identificira mehanizme praćenja i graduirane sankcije kao ključna dizajnerska načela za zaštitu zajedničkih dobara. KOLO sustav ima nekoliko strukturnih svojstava koja čine zlouporabu skupljom od suradnje.

Dokaz stvarnosti kao barijera. Kreiranje lažnog profila u KOLO sustavu zahtijeva da verifikator — član Kola ili član bez potvrde — verificira lažnu osobu, čime stavlja vlastitu poziciju u sustavu kao ulog — graduirane sankcije uključuju zabranu verifikacije, oduzimanje prava na ZRNO i ukidanje računa. Trošak napada nije krivotvorenje dokumenta, već korupcija stvarne osobe u mreži povjerenja, što je nerazmjerno skuplje i rizičnije od kreiranja anonimnog računa na klasičnoj internetskoj platformi. Zapis POEN-a po verifikaciji nastaje tek kad lažni račun prođe ljudsku odluku o prvom doprinosu, pa sama lažna verifikacija ne donosi ništa. Ta analiza vrijedi za sustav u kojem je graf verifikacija dovoljno gust da korupcija jednog čvora nema sustavni učinak. Kako sustav raste — naročito zemljopisno, izvan regije gdje postoji gusta mreža poznanstava — rizik od koordiniranih lažnih jamstava raste, a s njim i težina nadzora čuvara Kola u novim sredinama. Otvorena su pitanja skaliranja dokaza stvarnosti navedena u poglavlju 13.

Evidencija kao trag. Svaka se aktivnost u sustavu evidentira. Svaka razmjena ima dva korisnika. Svaki doprinos ima zapis. Lažna evidencija — dva korisnika koji lažno razmjenjuju da bi preraspodijelili POEN-e bez stvarne razmjene dobara ili usluga — ostavlja trag koji se razlikuje od legitimne aktivnosti po obrascima: razmjena uvijek između istih korisnika, u istim iznosima, u pravilnim intervalima. S obzirom na to da razmjena ne uvećava ukupan broj POEN-a u sustavu (zero-sum, odjeljak 6.1), korist je od lažne razmjene ograničena na preraspodjelu postojećih zapisa — što znači da jedan od dvaju korisnika gubi POEN-e da bi ih drugi dobio. Lažna razmjena zato zahtijeva dogovor dvaju korisnika od kojih jedan pristaje na gubitak, što smanjuje krug mogućih zlouporaba na koordinirane parove s vanjskim motivom.

Ograničenje upisa ZRNA. Maksimum jedan posto stanja po obračunskom razdoblju (odjeljak 6.2) znači da čak ni korisnik s velikom evidencijom POEN-a ne može naglo preuzeti znatan dio raspoloživih ZRNA. Akumuliranje je pozicije u sustavu postupan proces koji zahtijeva vrijeme, čime se smanjuje korist od manipulacije i povećava vjerojatnost detekcije prije nego što manipulacija postigne znatan učinak.

Neprenosivost ZRNA. ZRNO se ne može prenijeti drugom korisniku (odjeljak 6.2). To eliminira cijelu kategoriju zlouporaba — nema mogućnosti da netko akumulira ZRNO i otuđi ga drugoj osobi, nema mogućnosti da se upravljačka moć koncentrira prikupljanjem ZRNA, nema mogućnosti da se pozicija u sustavu monetizira izvan sustava.

Nekonvertibilnost POEN-a (poglavlje 4) znači da lažna evidencija nema vanjsku vrijednost. Korisnik koji manipulira evidencijom može akumulirati POEN-e, ali ih ne može iznijeti iz sustava. POEN-i imaju intrasistemsku vrijednost — služe za razmjenu s drugim korisnicima unutar sustava — ali je ta vrijednost strukturno ograničena na ono što drugi korisnici nude, i korisnik koji podriva integritet sustava istodobno umanjuje vrijednost vlastite evidencije za sve ostale korisnike. U terminologiji teorije igara, manipulacija je evidencije dominirana strategija — za svaki scenarij u kojem bi korisnik mogao manipulirati, legitimno sudjelovanje daje jednaku ili veću korist bez rizika od sankcija.

Nekonvertibilnost ne eliminira mogućnost da korisnici unutar sustava razmjenjuju dobra i usluge koje imaju vrijednost u vanjskoj ekonomiji — niti je to cilj. Dva korisnika koji razmijene sat rada, kilogram meda ili popravak krova kroz sustav obavljaju legitimnu internu razmjenu, bez obzira na to što ta dobra i usluge imaju tržišnu vrijednost izraženu u dinarima. Protokol evidentira razmjenu ažuriranjem zapisa obaju korisnika — to je osnovna funkcija sustava opisana u odjeljku 6.1. Nekonvertibilnost znači da ne postoji mehanizam kroz koji bi korisnik mogao iznijeti POEN-e iz sustava i zamijeniti ih za dinare — ne da dobra i usluge koje se razmjenjuju unutar sustava nemaju vrijednost izvan njega. Razlika je u tome gdje se vrijednost realizira: korisnik koji primi uslugu ima korist od te usluge, ali POEN-i kojima je razmjena evidentirana nemaju vlastitu vanjsku vrijednost i ne mogu napustiti sustav.

Transparentnost. Pravila su protokola javna. Evidencija je dostupna korisnicima sustava u pseudonimnom obliku (poglavlje 12). Odluke su obrazložene. U okruženju gdje su pravila i evidencija dostupni svim korisnicima, zlouporaba zahtijeva da svi ostali korisnici ne primijete neregularne obrasce — što je sve teže što sustav raste.

Osim strukturnih svojstava opisanih u ovom odjeljku, sustav ima i aktivne mehanizme zaštite — detekciju anomalija u grafu verifikacija, praćenje obrazaca razmjene u pseudonimnom obliku, verifikaciju izvršenja operativnih zadataka od strane čuvara Kola i mjere protiv koordiniranog djelovanja povezanih osoba. Konkretni mehanizmi, pravila detekcije i postupci postupanja definirani su u Pravilniku o KOLO sustavu i Pravilniku o dokazu stvarnosti.

## Ravnoteža sustava

Poticaji su u KOLO sustavu dizajnirani s ciljem da legitimno sudjelovanje bude strukturno povoljniji izbor za svakog korisnika od zlouporabe ili nesudjelovanja. U terminologiji teorije dizajna mehanizama, cilj je da legitimno sudjelovanje teži Nashevu ekvilibriju (Nash equilibrium) — stanju u kojem nijedan korisnik nema poticaj jednostrano promijeniti strategiju (Nash, 1950). Ta je tvrdnja dizajnerska namjera utemeljena na analizi strukturnih poticaja opisanih u ovom poglavlju — formalna verifikacija zahtijeva empirijsku analizu ponašanja korisnika nakon početka rada sustava, uključujući praćenje obrazaca razmjene, stope zlouporaba i učinkovitosti anti-fraud mehanizama.

Korisnik koji legitimno koristi sustav ima neposrednu korist od razmjene i moguću dugoročnu korist od akumulirane evidencije. Korisnik koji pokušava zloupotrijebiti sustav ulaže napor u manipulaciju čija je vanjska vrijednost nula (nekonvertibilnost), čija je intrasistemska vrijednost ograničena (zero-sum razmjena) i čiji je rizik od detekcije proporcionalan opsegu manipulacije (transparentnost evidencije). Donator koji donira sredstva zakladi financira infrastrukturu koju koristi, pod uvjetima koji su strukturno racionalni samo za korisnike koji zaista koriste sustav — ne za one koji očekuju financijski povrat. Pokrovitelj koji daje realne resurse dobiva javnu evidenciju doprinosa u sustavu čija korist ovisi o funkcioniranju sustava.

Poticajna usklađenost u KOLO sustavu nije ujednačena kroz sve aktivnosti. Aktivnosti kroz koje nastaju novi POEN-i — donacije, verifikacija, operativni doprinos — imaju visok stupanj usklađenosti individualnog i kolektivnog interesa: korisnik gradi poziciju i doprinosi sustavu istodobno. Razmjena — središnja aktivnost sustava — ima nižu poticajnu usklađenost: korisnik dobiva neposrednu korist (dobro ili uslugu), ali u istom činu umanjuje vlastiti broj evidentiranih POEN-a, što usporava dosezanje praga za upis ZRNA. Sustav prihvaća tu napetost jer neposredna korist od razmjene — mogućnost da dobiješ ono što ti treba od drugog korisnika — postoji neovisno o evidenciji POEN-a i ne zahtijeva dodatni poticaj da bi bila korisna. Pitanje proizvodi li taj dizajnerski izbor dovoljnu cirkulaciju u praksi empirijsko je pitanje koje će se rješavati praćenjem obrazaca korištenja i po potrebi prilagodbom parametara sustava kroz procese upravljanja opisane u poglavlju 10.

Sustav nije imun na zlouporabu. Nijedan sustav nije. Ali sustav u kojem je zlouporaba skupa (dokaz stvarnosti, graduirane sankcije), detektabilna (transparentnost evidencije, praćenje obrazaca) i strukturno ograničene koristi (nekonvertibilnost, neprenosivost) ima bolje strukturne izglede od sustava koji se oslanja na dobru volju korisnika — problem koji Olson (1965) identificira kao središnju ranjivost sustava kolektivne akcije, a koji Ostrom (1990) rješava upravo kombinacijom jasnih pravila, mehanizama praćenja i graduiranih sankcija.

# 12. Zaštita podataka

KOLO sustav po svojoj prirodi obrađuje osobne podatke — graf verifikacija, evidenciju doprinosa, podatke o donacijama i, u kontekstu socijalnih programa i modula za djecu, posebne kategorije podataka. Pristup zaštiti podataka utemeljen je na zaštiti po dizajnu i po zadanim postavkama (čl. 50. ZZPL-a; GDPR čl. 25.). Sustav primjenjuje Zakon o zaštiti podataka o ličnosti (ZZPL; Sl. glasnik RS, br. 87/2018) i, u mjeri u kojoj je primjenjiva, Opću uredbu o zaštiti podataka Europske unije (GDPR; Uredba (EU) 2016/679).

## Tri dizajnerske odluke

Prva je pseudonimnost evidencije. Zapisi su u evidenciji vezani za pseudonime, ne za osobna imena. Ime i prezime korisnika vodi se samo u evidenciji identiteta, odvojeno od evidencije doprinosa, i upisuje se samo u pet slučajeva: pri prijavi gospodarstva i pristupanju gospodarstvu, pri javnoj donaciji, pri stjecanju svojstva zadrugara, pri potvrdi primitka pokroviteljstva, za zastupnika koji je prijavu podnio, i pri ulasku na popis za poziv, kada ga upisuje sam korisnik (Pravilnik o KOLO sustavu, čl. 31.a). Ne prikazuje se drugim korisnicima, osim članu Kola koji korisnika s popisa za poziv zove radi upoznavanja, i to samo dok je poziv otvoren (poglavlje 7), i ne ulazi u zapise POEN-a. Pseudonimnost nije anonimnost (usp. ZZPL čl. 4. st. 1. t. 3a; GDPR čl. 4(5) i Recital 26) — pseudonimizirani podaci ostaju osobni podaci u smislu ZZPL-a jer se, uz dodatne informacije, mogu povezati s identificiranom osobom. Rizik je od reidentifikacije proporcionalan gustoći grafa i broju verifikacija.

Druga je razdvajanje podataka. Zaklada ne čuva osobne podatke korisnika platforme — svi se podaci korisnika čuvaju na infrastrukturi protokola. Zaklada izravno čuva samo bankovnu dokumentaciju donacija (zakonska obveza financijskog izvještavanja) i evidenciju o vezi između pravne osobe pokrovitelja i korisnika na čiji se zapis u sustavu doprinos evidentira (poglavlje 8).

Treća je minimizacija — platforma prikuplja samo podatke nužne za funkcioniranje sustava: pseudonim, adresu e-pošte, datum pristupanja, graf verifikacija i podatak o verifikaciji i potvrđenosti. Korisnik može dobrovoljno unijeti dodatne podatke radi lakšeg korištenja platforme, ali to nije uvjet za dokaz stvarnosti niti za pristup funkcijama sustava.

## Kategorije podataka

Sustav obrađuje nekoliko kategorija osobnih podataka, uz načelo minimizacije ugrađeno u dizajn — platforma prikuplja samo podatke nužne za funkcioniranje, zaklada ne čuva osobne podatke korisnika platforme, a korisnik sam odlučuje koje dodatne podatke unosi.

Podaci o korisnicima platforme: pseudonim, adresa e-pošte, datum pristupanja. Nužni za funkcioniranje sustava.

Podaci dokaza stvarnosti: graf verifikacija, uključujući podatak je li verifikacija potvrda ili uvođenje u Kolo, i podatak o verifikaciji i potvrđenosti. Operativni podaci sustava koji bilježe odnose između korisnika i njihovu verifikaciju — bez njih se ne može osigurati načelo jedna osoba, jedan račun.

Dobrovoljno uneseni podaci: ime, adresa, kontaktni podaci — korisnik sam odlučuje unosi li ih i može ih obrisati u svakom trenutku.

Podaci o aktivnosti: evidencija razmjena i doprinosa u pseudonimnom obliku — zapisi koji čine osnovu obračunskog okvira.

Podaci o donacijama: iznos, datum, identitet donatora — čuva ih zaklada na temelju zakonske obveze financijskog izvještavanja. Identifikacija se donatora osigurava kroz bankovni sustav.

Podaci o pokroviteljstvu: doprinosi pravnih osoba i veza između pravne osobe i korisnika na čiji se zapis doprinos evidentira. Ime i prezime korisnika vodi se samo u evidenciji identiteta, odvojeno od evidencije doprinosa, i ne prikazuje se drugim korisnicima, osim u slučaju poziva s popisa za poziv.

Evidencija identiteta nastaje u pet slučajeva — gospodarstvo, javna donacija, svojstvo zadrugara, pokroviteljstvo (ime zastupnika koji podnosi prijavu) i popis za poziv (ime upisuje sam korisnik): uz pseudonim računa vodi se ime i prezime, jedno po računu, radi načela jedna osoba, jedan račun. Ne prikazuje se drugim korisnicima, osim članu Kola koji korisnika s popisa za poziv zove radi upoznavanja, dok je poziv otvoren, ne ulazi u zapise POEN-a i briše se gašenjem računa.

Posebne kategorije podataka mogu nastati u kontekstu socijalnih programa (Modul 3): status roditelja, životna dob, invaliditet, studentski status. Zaklada ne čuva preslike podnesene dokumentacije — u sustavu ostaje samo minimalni zapis o pripadnosti skupini i datum verifikacije statusa.

Podaci maloljetnih osoba nastaju aktiviranjem Modula 4: podaci o maloljetnim korisnicima, suglasnost roditelja ili zakonskog zastupnika i ograničenja koja vrijede za maloljetnog korisnika.

Podaci zadrugara nastaju aktiviranjem Modula 2: ime i prezime i pseudonim zadrugara, koje uz privolu osobe dostavlja zadruga, radi povezivanja računa sa zadrugom i brojanja zadrugara za pragove rasta. Ime i prezime ne prikazuje se drugim korisnicima i upisuje se u evidenciju identiteta.

Podaci o gospodarstvu nastaju kada punoljetan korisnik prijavi gospodarstvo: naziv, naselje i točna lokacija, opis proizvodnje, uloga podnositelja, broj poljoprivrednog gospodarstva kada je gospodarstvo upisano u registar i pseudonimi članova. Ime i prezime svakog člana upisuje se u evidenciju identiteta, a ne uz gospodarstvo; zaklada podatke u registru ne provjerava. Izvadak iz registra ne prilaže se. Gospodarstvo, upisano ili neupisano u registar, prijavljuje svaki punoljetni korisnik kao nositelj; prijava dovodi korisnika na popis za poziv (poglavlje 7), ali ne potvrđuje njegovu stvarnost. Odobreno gospodarstvo prikazuje se na javnoj karti, na kojoj su i pokrovitelji; adresa se ispisuje na temelju izjave podnositelja dane pri prijavi, a broj gospodarstva se ne prikazuje. Prikaz je sastavni dio sudjelovanja gospodarstva i uvjet doprinosa gospodarstva (Pravilnik o gospodarstvima).

## Pravni temelj obrade

Obrada osobnih podataka zahtijeva pravni temelj (čl. 12. ZZPL-a). KOLO sustav koristi različite pravne temelje za različite kategorije podataka.

Za podatke o korisnicima platforme i podatke dokaza stvarnosti pravni je temelj izvršenje ugovornog odnosa (čl. 12. st. 1. t. 2. ZZPL-a) — korisnik pristupanjem sustavu prihvaća pravila korištenja koja čine ugovorni odnos sa zakladom kao voditeljem obrade.

Za dobrovoljno unesene podatke pravni je temelj privola korisnika (čl. 12. st. 1. t. 1. ZZPL-a).

Za podatke o aktivnosti pravni je temelj izvršenje ugovornog odnosa dok korisnik sudjeluje u sustavu. Nakon što korisnik napusti sustav i zatraži brisanje, identifikacijski se podaci brišu, a zapisi koji ostaju u evidenciji zadržavaju se pod pseudonimom koji ne upućuje na ime; to je pseudonimizacija, a ne anonimizacija, i zadržani zapisi i dalje su osobni podaci (odjeljak o pravu na brisanje u nastavku).

Za podatke o donacijama pravni je temelj zakonska obveza (čl. 12. st. 1. t. 3. ZZPL-a). Za podatke o pokroviteljstvu pravni je temelj legitimni interes zaklade (čl. 12. st. 1. t. 6. ZZPL-a) i zakonska obveza vođenja financijske evidencije.

Za posebne kategorije podataka pravni je temelj izričita privola korisnika (čl. 17. st. 2. t. 1. ZZPL-a). Privola se može povući u svakom trenutku, s posljedicom prestanka automatskog evidentiranja POEN-a.

Za podatke maloljetnih osoba pravni je temelj privola roditelja ili zakonskog zastupnika (čl. 16. ZZPL-a).

## Voditelj obrade podataka

KOLO Zaklada je voditelj obrade podataka u smislu ZZPL-a — određuje svrhe i sredstva obrade. Zaklada je voditelj obrade čak i kad ne čuva podatke korisnika fizički: pravno je mjerodavan kriterij određivanje svrhe i sredstava obrade, ne fizičko pohranjivanje podataka (čl. 2. st. 1. t. 8. ZZPL-a). Protokol je tehničko sredstvo obrade. Ako zaklada angažira treće osobe za održavanje infrastrukture, te su osobe izvršitelji obrade u smislu ZZPL-a (čl. 45.).

## Napetost između prava na brisanje i integriteta evidencije

ZZPL (čl. 30.) daje korisniku pravo zahtijevati brisanje svojih osobnih podataka. KOLO vodi evidenciju doprinosa koja je po dizajnu konzistentna — brisanje zapisa jednog korisnika narušilo bi konzistentnost cjelokupne evidencije koja je zajedničko dobro svih korisnika. Ta se napetost rješava razdvajanjem podataka na identifikacijske i obračunske: korisnik koji napusti sustav dobiva brisanje adrese e-pošte i svih dobrovoljno unesenih podataka, anonimizaciju veza u grafu verifikacija, dok zapisi u evidenciji ostaju pod pseudonimom koji ne upućuje na ime. To je pseudonimizacija, a ne anonimizacija: Zaklada zadržava interni identifikator računa, pa zadržani zapisi i dalje predstavljaju osobne podatke u smislu ZZPL-a, a čuvaju se zato što pravo na brisanje nije neograničeno (čl. 30. st. 3. ZZPL-a).

## Obveze zaklade

Zaklada je dužna provesti procjenu učinka na zaštitu podataka (DPIA) prije početka obrade (čl. 54. ZZPL-a), imenovati službenika za zaštitu podataka (DPO, čl. 56. ZZPL-a) i primjenjivati tehničke i organizacijske mjere zaštite primjerene riziku (čl. 51. ZZPL-a). Modul 3 (Socijalni programi) i Modul 4 (Djeca) aktivirani su tek nakon ažuriranja DPIA-e, jer uvode obradu posebnih kategorija podataka (čl. 17. ZZPL-a) i podataka maloljetnih osoba (čl. 16. ZZPL-a). Ako infrastruktura sustava uključuje poslužitelje izvan Republike Srbije, prijenos osobnih podataka izvan zemlje podliježe pravilima ZZPL-a o prekograničnom prijenosu (čl. 65.–69.).

Korisnici sustava imaju sva prava koja im ZZPL jamči — pravo pristupa (čl. 26.), ispravka (čl. 29.), brisanja (čl. 30.), ograničenja obrade (čl. 31.), prenosivosti (čl. 36.) i prigovora (čl. 37.). Zaklada osigurava mehanizam za podnošenje zahtjeva koji je pristupačan svim korisnicima i odgovara na zahtjeve u roku od trideset dana od primitka zahtjeva (čl. 21. st. 3. ZZPL-a), s mogućnošću produljenja za još šezdeset dana uz obavijest korisniku o razlozima produljenja. Detaljan opis kategorija podataka, pravnih temelja obrade za svaku kategoriju, prava korisnika, tehničkih i organizacijskih mjera zaštite i pravila prekograničnog prijenosa dan je u Politici privatnosti KOLO sustava. Tehničke su mjere zaštite opisane u Prilogu D ovog dokumenta.

# 13. Putanja razvoja

KOLO sustav nije gotov proizvod koji se lansira u konačnom obliku. To je sustav koji se gradi postupno, testira u praksi i prilagođava na temelju iskustva. Ovo poglavlje opisuje očekivanu putanju tog razvoja — faze, pragove, otvorena pitanja i strukturne limite koje sustav nikad ne prelazi.

Putanja nije fiksiran plan s datumima. Pragovi su mjerljivi, ali vrijeme potrebno da se dosegnu ovisi o brzini rasta zajednice, o kapacitetu zaklade i o okolnostima koje nitko ne može predvidjeti. Ovo poglavlje opisuje redoslijed i uvjete, ne kalendar. Pristup odgovara onome što literatura o decentraliziranim sustavima opisuje kao dizajniranu putanju s mjerljivim uvjetima prijelaza (usp. Walden, 2020).

Putanja ima predoperativnu fazu osnivanja, dvije operativne faze s mjerljivim pragom prijelaza i modularnu fazu u kojoj se sustav razvija po vlastitim pravilima. Faza osnivanja prethodi operativnom radu sustava. Dvije su operativne faze sekvencijalne — druga počinje kad je ispunjen prag prijelaza iz prve. Modularna faza nije sekvencijalna — moduli se aktiviraju neovisno, kad su ispunjeni njihovi vlastiti preduvjeti, ne u unaprijed određenom redoslijedu.

## Faza osnivanja

Zaklada se registrira u Somboru. Protokol se razvija i testira. Pravila se sustava definiraju u prvoj verziji. Licence se postavljaju — AGPL-3.0 za softver, CC BY-SA 4.0 za sadržaj. Whitepaper se objavljuje. Pravna se pozicija sustava uspostavlja.

U toj fazi nema korisnika, nema evidencije, nema obračuna. Sustav postoji kao kod, pravila i pravni okvir. Zaklada drži infrastrukturu i priprema se za primitak prvih korisnika.

Preduvjeti za početak Faze 1.: funkcionalan protokol, registrirana zaklada, objavljen whitepaper, uspostavljena infrastruktura, definirana pravila za dokaz stvarnosti.

## Faza 1.: Osnova

U toj se fazi aktivira cjelokupna osnova sustava — svi elementi opisani u poglavljima 3–8.

Protokol počinje voditi evidenciju. Prvi zapisi POEN-a nastaju kroz prve doprinose korisnika.

Aktivira se dokaz stvarnosti (poglavlje 7). Prva skupina korisnika prolazi verifikaciju kroz lanac potvrda. Osnivači osiguravaju verifikacijski kapacitet za pokretanje lanca potvrda.

Aktivira se financijski doprinos (poglavlje 8). Prve donacije počinju pristizati. Financijski se tok između zajednice i zaklade uspostavlja u praksi. Zaklada počinje trošiti dinarska sredstva na infrastrukturu i programe.

Aktivira se operativni doprinos (poglavlje 8). Korisnici se prijavljuju za zadatke za zajedničko dobro podnošenjem plana izvršenja. Članovi Upravnog odbora zaklade odobravaju planove i verificiraju dnevno izvršenje. Po aktiviranju Gornjeg Kola u Fazi 2. tu funkciju preuzimaju čuvari Kola. Limit od 10 % ukupnog broja POEN-a evidentiranih u sustavu po obračunskom razdoblju štiti sustav od inflatornog pritiska; taj je limit operativni parametar koji podliježe promjeni kroz procese upravljanja (poglavlje 10).

Ta je faza operativno najzahtjevnija. Sustav se prvi put suočava sa stvarnim korištenjem. Pravila koja su na papiru djelovala logično mogu se pokazati nepraktičnima, neuravnoteženima ili nedovoljno preciznima. Osnivač i zaklada u toj fazi aktivno prilagođavaju parametre — koliko zapisa POEN-a protokol upisuje za koju aktivnost, kako funkcionira obračunsko razdoblje, kako se evidencija prikazuje korisnicima. Broj je korisnika malen — dovoljno da se testira mehanika, nedovoljno da se testira skaliranje. Očekivanje je da prvi korisnici budu osobe koje razumiju dizajn sustava i koje prihvaćaju ograničenja rane verzije.

Prag za prijelaz u Fazu 2.: ukupan broj POEN-a evidentiranih u sustavu dosegne 1.000.000 — stanje protokola od −1.000.000 POEN (v. poglavlje 10 za objašnjenje obračunske konvencije). Tim se pragom istodobno aktivira upis ZRNA i uspostavlja Gornje Kolo kao upravljačko tijelo sustava.

## Faza 2.: ZRNO i Gornje Kolo

Kad ukupan broj POEN-a evidentiranih u sustavu dosegne milijun, obračunski koeficijent doseže minimalnu vrijednost od 1 — milijun POEN-a podijeljeno s milijun raspoloživih ZRNA. Taj je prag određen obračunskom mehanikom: pri koeficijentu 1 upis jednog ZRNA zahtijeva najmanje 1 POEN, čime obračunski odnos između dviju jedinica počinje funkcionirati smisleno. To je okidač za aktivaciju upisa ZRNA — protokol počinje primati zahtjeve za upis ZRNA po pravilima opisanima u poglavlju 6.

Aktivacijom ZRNA automatski nastaje Gornje Kolo — upravno tijelo sustava čine čuvari Kola koji su aktivirali ZRNO. Upravljačke nadležnosti prelaze s Upravnog odbora Zaklade na čuvare Kola koji su aktivirali ZRNO (poglavlje 10). Nema zasebnog koraka aktivacije Gornjeg Kola: milijun POEN-a prag je koji istodobno aktivira ZRNO, uspostavlja Gornje Kolo i označava prijelaz s osnivačkog upravljanja na upravljanje zajednice. Zaklada zadržava pravnu i servisnu ulogu, kao i zaštitni veto na odluke Gornjeg Kola. Veto se gasi trajno i jednosmjerno kada financijska sredstva Zaklade dosegnu prag financijske samostalnosti utvrđen posebnim pravilnikom.

Prvi članovi Kola dosežu prag od dvadeset tisuća POEN-a i počinju upisivati ZRNO. Obračunski se koeficijent po prvi put mijenja na temelju stvarne aktivnosti. Sustav osim osnivača dobiva i prve čuvare Kola koji su status stekli redovitim putem. Osnivači, koji su u Fazi 1. imali nadzornu funkciju, čuvari su Kola od uspostavljanja sustava po prijelaznoj odredbi Pravilnika, pa je nadzorna funkcija od početka vezana za status čuvara Kola u skladu s Pravilnikom o dokazu stvarnosti.

Prag za prijelaz u modularnu fazu: dovoljan broj čuvara Kola, dovoljan opseg aktivnosti, stabilnost osnove tijekom definiranog razdoblja. Konkretni se pragovi definiraju u KOLO Pravilniku ili posebnim pravilnicima i objavljuju javno prije početka Faze 1., čime njihovo ispunjenje postaje provjerljivo od strane svakog korisnika.

## Modularna faza

Modularna faza počinje kad osnova sustava — zajedničko dobro, protokol, zaklada, zajednica, POEN, ZRNO, dokaz stvarnosti, financijski i operativni doprinos — funkcionira stabilno i kad postoji dovoljan broj čuvara Kola za aktiviranje upravljačkih mehanizama.

U toj se fazi moduli aktiviraju prema vlastitim preduvjetima, ne u unaprijed određenom redoslijedu. Koji se modul aktivira prvi ovisi o potrebama zajednice i odluci Gornjeg Kola, koje je u toj fazi već aktivno. Moduli su opisani u poglavlju 9; ovdje su navedeni s preduvjetima aktivacije.

Krugovi se aktiviraju kad postoji dovoljno korisnika da interesno udruživanje ima smisla — minimalan broj korisnika i pravila formiranja definirani su u pravilniku sustava.

Zadruge su aktivirane Pravilnikom o zadrugama (set 4.7.0). Zadruga ulazi u sustav kad lokalna zajednica ima potrebu za vlastitom organizacijskom jedinicom registriranom po Zakonu o zadrugama, kad je najmanje pet zadrugara sudionici i kad je sklopljen ugovor o suradnji. Prva zadruga na lokalitetu otvara se tek kad u tom mjestu ima najmanje pedeset sudionika, i u njezinu osnivanju sudjeluje Zaklada; svaka sljedeća zadruga u istom mjestu osniva se na inicijativu korisnika, s najmanje pet zadrugara. Zaklada pomaže u osnivanju i koordinira integraciju u sustav.

Socijalni se programi aktiviraju kad sustav ima dovoljno korisnika da automatska evidencija za kvalificirane skupine ima smisla u kontekstu obračunskog okvira.

Modul Djeca aktivira se kad su uspostavljene sve zaštitne mjere za maloljetne korisnike — suglasnost roditelja ili zakonskog zastupnika, ograničenja aktivnosti, pojačana zaštita podataka (poglavlje 12).

Internacionalizacija se aktivira kad je sustav stabilan s aktivnim Gornjim Kolom, kad postoji dovoljno iskustva s funkcioniranjem u osnovnoj regiji i kad je provedena pravna analiza za ciljne jurisdikcije. Širenje na područje Europske unije zahtijeva, uz punu usklađenost s GDPR-om, i procjenu učinka prijenosa podataka prije započinjanja obrade podataka korisnika u novoj jurisdikciji.

Modularna faza nema kraj. Sustav se nastavlja razvijati — novi moduli, nova pravila, novi korisnici — pod upravljanjem zajednice, ne osnivača. Prijelaz iz Faze 1. u Fazu 2. — aktivacija ZRNA i nastanak Gornjeg Kola — kraj je osnivačkog razdoblja, ne kraj razvoja.

## Otvorena pitanja

Sustav prepoznaje pitanja na koja trenutačno nema konačan odgovor. Ta su pitanja ovdje navedena jer je poštenje prema korisnicima i regulatorima važnije od privida potpunosti.

Nasljeđivanje. Pozicija je sustava da POEN-i i ZRNO nemaju imovinskopravni karakter i da se ne mogu naslijediti kao imovina — POEN nema nositelja i ne može se konvertirati u novac, a ZRNO je neprenosivo i vezano za identitet fizičke osobe utvrđen u lancu potvrda. Po saznanju o smrti korisnika, slobodno se ZRNO vraća u fond raspoloživih ZRNA u protokolu bez evidencije POEN-a, aktivno se ZRNO deaktivira i vraća u fond, a identifikacijski se podaci brišu po postupku iz poglavlja 12 — zapisi u evidenciji doprinosa ostaju pod identifikatorom koji više ne omogućuje identifikaciju. Ta bi pozicija mogla biti osporena s obzirom na to da evidencija ima intrasistemsku uporabnu vrijednost; konačno rješenje može ovisiti o razvoju sudske prakse o statusu digitalnih zapisa u nasljednom pravu.

Regionalna federacija. Modul internacionalizacije (poglavlje 9) predviđa širenje sustava s jedinstvenom evidencijom — ne federaciju neovisnih sustava. Međutim, zajednice u drugim gradovima ili zemljama mogu željeti pokrenuti vlastiti sustav s odvojenom evidencijom ali kompatibilnim pravilima. Pitanje mogu li takvi sustavi biti federirani — da dijele pravila ali vode odvojenu evidenciju — i bi li POEN u jednom sustavu imao učinak u drugom, trenutačni dizajn ne adresira. To pitanje postaje relevantno tek kad sustav dosegne opseg koji to zahtijeva i razlikuje se od internacionalizacije koja zadržava jedinstven protokol.

Skaliranje dokaza stvarnosti. Model dokaza stvarnosti — lanac potvrda utemeljen na osobnom poznanstvu ili na razgovoru nakon poziva (poglavlje 7) — adresira skaliranje verifikacije decentralizirano: svaki član Kola može potvrđivati korisnike, uz ograničen dnevni tempo potvrđivanja, a čuvari Kola nadziru širenje i osiguravaju integritet grafa verifikacija. Međutim, otvorena pitanja ostaju. Jedna potvrda olakšava širenje mreže, ali svaki verifikator time postaje jedini oslonac za one koje je uveo. Popis za poziv otvara put onima koji ne poznaju nikoga, ali razgovor nakon poziva slabiji je oslonac od osobnog poznanstva; zato onaj tko je nakon razgovora uveden u Kolo ostaje član bez potvrde, s ograničenim radnjama, dok ga ne potvrdi netko tko ga osobno poznaje. Rizik od koordiniranih lažnih jamstava raste s veličinom sustava i sa smanjenjem gustoće socijalnih veza (usp. Douceur, 2002., o Sybil napadima u distribuiranim sustavima). Pitanje kako se osigurava integritet grafa verifikacija sa stotinama tisuća korisnika — posebno u kontekstu zemljopisnog širenja izvan regije u kojoj postoji gusta mreža poznanstava — ostaje otvoreno i ovisi o iskustvu s ranijim fazama i o mogućim tehničkim nadogradnjama modela.

Odnos s poreznim sustavom. Razmjena dobara i usluga unutar KOLO sustava može imati porezne implikacije za korisnike. Ako korisnik razmjenjuje uslugu s drugim korisnikom, podliježe li ta razmjena porezu na dohodak? Podliježe li PDV-u? Trenutačna je pozicija sustava da su POEN-i evidencija bez imovinske vrijednosti, ali porezne vlasti mogu zauzeti drukčiji stav — naročito ako se razmjena unutar sustava kvalificira kao trampa u smislu poreznih propisa. To pitanje zahtijeva pravnu analizu i potencijalno konzultaciju s poreznim tijelima. Iskustva komplementarnih sustava u drugim jurisdikcijama — od Chiemgauera u Njemačkoj do WIR-a u Švicarskoj — pokazuju da porezni tretman znatno varira i da nije moguće pretpostaviti ishod bez formalne analize.

Granice rasta. Postoji li točka nakon koje sustav prestaje funkcionirati kako je dizajniran? Postaje li milijun ZRNA ograničavajući čimbenik s milijun korisnika? Postaje li obračunski koeficijent neupotrebljivo visok s desecima milijuna evidentiranih POEN-a? Obračunska formula ne postavlja gornju granicu, ali praksa može otkriti operativna ograničenja koja teorija ne predviđa.

## Strukturni limiti sustava

Sustav tijekom cjelokupne putanje razvoja aktivno održava granice koje ne prelazi — strukturne elemente bez kojih sustav prestaje biti participativni sustav zajedničkog dobra.

Četiri načela iz poglavlja 4 — nekonvertibilnost, odsutnost imovinskog prava nad zapisima, nepovratnost donacija i minimizacija podataka — strukturni su limiti koji se ne mogu ukinuti nijednom upravljačkom odlukom. Uz njih, licence zajedničkog dobra (AGPL-3.0 za softver i CC BY-SA 4.0 za sadržaj, poglavlje 3) ne mogu se zamijeniti restriktivnijima. Prelazak bilo koje od tih granica mijenja pravnu prirodu sustava — od participativnog sustava zajedničkog dobra u financijski instrument, platni servis, ulagačku shemu ili instrument nadzora, sa svim regulatornim posljedicama koje to nosi. Takva je transformacija nepovratna — zato su granice postavljene kao strukturni elementi arhitekture, ne kao parametri koji podliježu upravljačkoj promjeni.

Ti limiti nisu restrikcije nametnute sustavu izvana. To su konstitutivni elementi koji čine sustav onim što jest — njihovo ukidanje ne bi bilo promjena sustava, nego prestanak njegova postojanja u sadašnjem obliku. Razlika između strukturnih limita i operativnih parametara sustava — koji se mogu i trebaju mijenjati s iskustvom — obrazložena je u poglavlju 4.

# 14. Zaključak

Ovaj dokument opisuje arhitekturu, pravnu poziciju, obračunski okvir, organizacijsku strukturu, module, upravljačke mehanizme, poticajnu strukturu, zaštitu podataka i putanju razvoja KOLO sustava — participativnog sustava zajedničkog dobra utemeljenog na evidenciji doprinosa.

Sustav integrira elemente koje postojeći modeli rješavaju parcijalno: evidenciju doprinosa kroz protokol i dvije obračunske jedinice (poglavlje 6), dokaz stvarnosti utemeljen na osobnom poznanstvu ili na razgovoru nakon poziva umjesto na prikupljanju osobnih dokumenata (poglavlje 7), progresivnu decentralizaciju upravljanja s mjerljivim uvjetima prijelaza (poglavlje 10), pravni okvir kroz zakladu kao instrument koji sustavu daje prepoznatljiv oblik u pravnom prometu bez toga da ga posjeduje (poglavlje 5) i modularnu arhitekturu koja razdvaja osnovu od proširenja (poglavlje 9).

Četiri načela — nekonvertibilnost POEN-a, odsutnost imovinskog prava nad zapisima, nepovratnost donacija i minimizacija podataka — čine strukturne limite sustava (poglavlje 4). Ta načela nisu operativni parametri koji podliježu upravljačkoj promjeni, nego konstitutivni elementi bez kojih sustav prestaje biti ono što jest. Njihova je funkcija dvostruka: osiguravaju da sustav ne može evoluirati u financijski instrument, platni servis ili ulagačku shemu, i istodobno postavljaju temelj za pravnu kvalifikaciju sustava kao participativnog sustava zajedničkog dobra.

Sustav prepoznaje svoja ograničenja. Napetost između akumulacije i cirkulacije svjestan je dizajnerski izbor s dokumentiranim posljedicama (poglavlje 11). Skaliranje dokaza stvarnosti izvan regije s gustom mrežom poznanstava ostaje otvoreno pitanje (poglavlje 13). Odnos s poreznim sustavom — posebno pitanje podliježe li razmjena unutar sustava kvalifikaciji kao trampa — zahtijeva formalnu analizu i konzultaciju s nadležnim tijelima (poglavlje 13). Pitanje nasljeđivanja evidencije nema konačan odgovor. Ta su otvorena pitanja navedena u dokumentu jer je poštenje prema korisnicima i regulatorima dio dizajna sustava, ne nedostatak dokumentacije.

KOLO sustav započinje rad s objavom ovog dokumenta. Dokumentacija koja slijedi — Prilog A (međunarodni institucionalni okvir), Prilog B (tablice parametara), Prilog C (glosar), Prilog D (tehničke i organizacijske mjere sigurnosti) i Prilog E (mapiranje Ostrominih dizajnerskih načela) — pruža dodatni kontekst za pozicioniranje sustava u regulatornom i akademskom okviru.

# Prilog A: Međunarodni institucionalni okvir

KOLO se sustav funkcionalno uklapa u širi institucionalni kontekst koji međunarodne organizacije aktivno razvijaju za socijalnu i solidarnu ekonomiju. Ovaj prilog sažima ključne dokumente tog okvira. Dokumenti nemaju izravnu pravnu snagu u srpskom pravnom sustavu, ali predstavljaju institucionalni okvir koji definira smjer regulatornog razvoja — relevantno za Srbiju u procesu pristupanja EU-u.

### Akcijski plan Europske komisije za socijalnu ekonomiju (COM(2021) 778, prosinac 2021.)

Strateški dokument koji predviđa mjere za razdoblje 2021.–2030. u trima područjima: pravni okviri, financiranje i vidljivost socijalne ekonomije. Komisija prepoznaje zaklade, zadruge i udruge kao ključne aktere socijalne ekonomije i predviđa mjere za prilagodbu pravnih okvira, poreznih politika i sustava javne nabave. Relevantan za KOLO jer potvrđuje da EU aktivno gradi regulatorni prostor za tip entiteta u koji se KOLO funkcionalno uklapa.

### Preporuka Vijeća EU-a o razvoju okvirnih uvjeta za socijalnu ekonomiju (C/2023/1344, 27. studenoga 2023.)

Poziva države članice da prilagode pravne okvire, porezne politike, javnu nabavu i administrativne strukture potrebama socijalne ekonomije. Države se članice pozivaju da usvoje ili ažuriraju nacionalne strategije za socijalnu ekonomiju. Za Srbiju je relevantna jer proces pristupanja EU-u podrazumijeva usklađivanje s acquis communautaire, uključujući preporuke u području socijalne ekonomije.

### Rezolucija ILO-a o dostojanstvenom radu i socijalnoj i solidarnoj ekonomiji (ILC.110/Resolution II, lipanj 2022.)

Prvo formalno priznanje socijalne i solidarne ekonomije u sustavu UN-a. Definirala je sektor i postavila smjernice za potporu od strane država članica ILO-a. Srbija je članica ILO-a. Rezolucija definira entitete socijalne i solidarne ekonomije kroz načela dobrovoljne suradnje, demokratskog upravljanja i primata društvene svrhe nad kapitalom — načela koja su strukturno ugrađena u KOLO sustav.

### OECD Preporuka o socijalnoj i solidarnoj ekonomiji i socijalnoj inovaciji (OECD/LEGAL/0472, lipanj 2022.)

Preporuka Vijeća OECD-a koja poziva države članice da razvijaju pravne okvire, porezne poticaje i institucionalnu potporu za socijalnu i solidarnu ekonomiju. Naglašava potrebu za prilagođenim regulatornim okvirima koji prepoznaju specifičnosti entiteta socijalne ekonomije — uključujući sustave evidencije doprinosa, participativno upravljanje i neprofitno organiziranje.

### Rezolucija Opće skupštine UN-a A/RES/77/281 (18. travnja 2023.)

Prva rezolucija Opće skupštine UN-a posvećena socijalnoj i solidarnoj ekonomiji. Definira socijalnu i solidarnu ekonomiju kao entitete utemeljene na načelima dobrovoljne suradnje, uzajamne pomoći, demokratskog upravljanja i primata ljudi i društvene svrhe nad kapitalom. Poziva države članice da razvijaju pravne okvire, fiskalne poticaje i programe potpore.

### Rezolucija Opće skupštine UN-a A/RES/79/213 (prosinac 2024.)

Nastavak i proširenje A/RES/77/281. Potvrđuje ulogu socijalne i solidarne ekonomije u ostvarivanju ciljeva održivog razvoja i poziva na konkretniju institucionalnu potporu na nacionalnoj razini.

### UN Inter-Agency Task Force on Social and Solidarity Economy (UNTFSSE)

Međuagencijski tim koji koordinira potporu socijalnoj i solidarnoj ekonomiji unutar sustava UN-a. Akcijski plan EU-a izrijekom navodi suradnju s UNTFSSE-om kao prioritet. UNTFSSE objavljuje godišnja izvješća o stanju sektora i pruža tehničku potporu državama članicama u razvoju regulatornih okvira.

### Relevantnost za KOLO sustav

Svi navedeni dokumenti prepoznaju i podržavaju tip entiteta u koji se KOLO funkcionalno uklapa: participativni sustavi utemeljeni na zajedničkom dobru, s demokratskim upravljanjem, neprofitnom organizacijom i evidencijom doprinosa kao središnjim mehanizmom. Za Srbiju u procesu pristupanja EU-u taj okvir definira smjer regulatornog razvoja u koji zemlja ulazi. KOLO sustav nije dizajniran da se uklopi u taj okvir naknadno — načela koja su u njega ugrađena (poglavlja 2 i 4) poklapaju se s načelima koja ti dokumenti formaliziraju, jer imaju zajedničke intelektualne korijene u kooperativnoj i neomutualističkoj tradiciji.

### Srpska pravna mapa

Relevantni srpski propisi — Zakon o digitalnoj imovini, Zakon o platnim uslugama, Zakon o tržištu kapitala, Zakon o zadužbinama i fondacijama, Zakon o zaštiti podataka o ličnosti, Zakon o zadrugama, Zakon o sprečavanju pranja novca i finansiranja terorizma, Zakon o radu, Zakon o obligacionim odnosima i porezni propisi — analizirani su u kontekstu svakog elementa sustava u poglavljima 4, 6, 7, 8, 9, 10 i 12. Pravna je pozicija sustava u odnosu na svaki od tih propisa dana na mjestu gdje je relevantnija za razumijevanje konkretnog elementa sustava nego u izoliranom prilogu.

# Prilog B: Tablice parametara

Tablice u ovom prilogu sažeto prikazuju ključne parametre sustava. Svaki je parametar detaljno obrazložen u poglavljima na koja tablice referiraju. Vrijednosti parametara podliježu promjeni kroz procese upravljanja opisane u poglavlju 10, osim strukturnih limita navedenih u poglavlju 4 koji se ne mogu mijenjati nijednom upravljačkom odlukom.

### Tablica 1: Parametri POEN-a (poglavlje 6.1)

| **Parametar** | **Vrijednost** | **Napomena** |
| --- | --- | --- |
| Pravni karakter | Evidencija doprinosa | Nije novac, valuta, token, platno sredstvo, elektronički novac ni digitalna imovina |
| Nositelj | Ne postoji | POEN postoji isključivo kao zapis u evidenciji protokola |
| Evidentiranje | Isključivo kroz protokol | Na temelju aktivnosti i pravila definiranih u protokolu |
| Kategorije evidentiranja | Osnova (POEN u zapisu korisnika): donacije, pokroviteljstvo, verifikacija, operativni doprinos. Moduli: rast krugova i zadruga (POEN u zapisu organizacijske jedinice), socijalni programi (automatska evidencija po statusu) | Razmjena ne uvećava ukupan broj POEN-a — preraspodjeljuje postojeće (zero-sum) |
| Konvertibilnost | Nekonvertibilan | Strukturni limit (poglavlje 4) |
| Imovinsko pravo korisnika | Ne postoji | Strukturni limit (poglavlje 4) |
| Korištenje izvan sustava | Nije moguće | POEN nema vanjsku imovinsku vrijednost |

### Tablica 2: Parametri ZRNA (poglavlje 6.2)

| **Parametar** | **Vrijednost** | **Napomena** |
| --- | --- | --- |
| Pravni karakter | Evidencija položaja | Nije vrijednosni papir, udio, dionica, ulagački ugovor ni digitalna imovina |
| Ukupno raspoloživo | 1.000.000 | Fiksirano u protokolu |
| Prenosivost | Neprenosivo | Nikad, ni u jednoj fazi, ni na koji način |
| Stanja | Slobodno ili aktivno | Slobodno: omogućuje otpis; aktivno: omogućuje glasovanje |
| Minimum POEN-a za upis | 20.000 | Evidentiranih u sustavu |
| Maksimum upisa po razdoblju | 1 % stanja | Po obračunskom razdoblju |
| Otpis | Po obračunskom koeficijentu | U novom obračunskom razdoblju, samo za slobodno ZRNO |
| Trgovanje | Nije moguće | Ne postoji tržište ni mehanizam prijenosa |
| Dividenda/kamata/prinos | Ne postoji | Niti se jamči bilo kakva korist |

### Tablica 3: Obračunski koeficijent (poglavlje 6.3)

| **Parametar** | **Vrijednost** | **Napomena** |
| --- | --- | --- |
| Formula | Ukupan broj POEN-a ÷ broj ZRNA raspoloživih | Oba elementa promjenjiva |
| Karakter | Administrativna veličina | Nije cijena, tečaj ni indeks performansi |
| Učestalost obračuna | Jednom dnevno | Na kraju obračunskog razdoblja |
| Tko izračunava | Protokol | Automatski, bez diskrecije |
| Tko kontrolira | Nitko pojedinačno | Posljedica ukupne aktivnosti |
| Minimalna vrijednost za aktivaciju ZRNA | 1 | Doseže se pri 1.000.000 evidentiranih POEN-a |

### Tablica 4: Statusi korisnika (poglavlje 7)

| **Status** | **Opis** | **Pristup** |
| --- | --- | --- |
| Korisnik | Punoljetni korisnik koji nije u Kolu | Pregled sustava, oglasi i razmjena, razgovor u opsegu iz Uvjeta korištenja, sudjelovanje u ažuriranju evidencije POEN-a (davatelj/primatelj), zahtjev za razgovor i popis za poziv |
| Član bez potvrde | Uveden u Kolo, još nije potvrđen | Razmjena, evidencija doprinosa, doniranje, programi, nabave, zadruge, upis i otpis ZRNA, uvođenje poznanika u Kolo; bez potvrđivanja, aktiviranja ZRNA i glasa |
| Član Kola | Jedna važeća potvrda u lancu potvrda | Razmjena, evidencija doprinosa, doniranje, potvrđivanje korisnika, uvođenje u Kolo s popisa za poziv, krugovi i zadruge |
| Čuvar Kola | Član Kola s upisanim ZRNOM | Sve funkcije člana Kola + upravljanje + pozicija u obračunskom sustavu |

### Tablica 5: Faze upravljanja (poglavlje 10)

| **Faza** | **Nositelj upravljanja** | **Prag prijelaza** |
| --- | --- | --- |
| Faza osnivanja | Osnivač | Zaklada registrirana, protokol razvijen, infrastruktura uspostavljena |
| Faza 1. | Osnivač i zaklada | Zaklada registrirana, protokol funkcionalan |
| Faza 2. | Gornje Kolo (čuvari Kola koji su aktivirali ZRNO) | 1.000.000 POEN-a evidentiranih — aktivira ZRNO i Gornje Kolo |

| **Zaštitni mehanizam** | **Uvjet** | **Napomena** |
| --- | --- | --- |
| Zaštitni veto zaklade | Aktivan do gašenja | Odbija odluku koja ugrožava operativnu i financijsku održivost zaklade do financijske samostalnosti |
| Gašenje veta | Prag financijske samostalnosti utvrđen posebnim pravilnikom | Trajno i jednosmjerno |

### Tablica 6: Moduli (poglavlje 9)

| **Modul** | **Naziv** | **Preduvjeti aktiviranja** |
| --- | --- | --- |
| 1 | Krugovi | Dovoljno korisnika za interesno udruživanje |
| 2 | Zadruge | Aktiviran Pravilnikom o zadrugama (set 4.7.0); lokalna potreba, registracija po Zakonu o zadrugama i ugovor o suradnji |
| 3 | Socijalni programi | Dovoljno korisnika za smislenu automatsku evidenciju |
| 4 | Djeca | Sve zaštitne mjere za maloljetne korisnike |
| 5 | Internacionalizacija | Stabilan sustav s aktivnim Gornjim Kolom, pravna analiza |

*Verifikacija (poglavlje 7), donacije fizičkih osoba i pokroviteljstvo pravnih osoba (poglavlje 8.2) i operativni doprinos (poglavlje 8.3) dio su osnove sustava koja funkcionira od prvog dana, ne moduli koji se aktiviraju prema preduvjetima.*

# Prilog C: Glosar

Pojmovi su grupirani tematski radi lakšeg snalaženja. Svaka je definicija dosljedna definiciji u poglavlju na koje referira.

### Struktura sustava

**Zajedničko dobro — **Središte KOLO sustava. Kolektivno dobro svih korisnika koje obuhvaća softver, pravila, evidenciju i sadržaj. Infrastruktura na kojoj ti elementi postoje nije sastavni dio zajedničkog dobra u istom smislu, ali jest operativni preduvjet čije je održavanje servisna obveza zaklade. Nijedan pojedinac, uključujući osnivača, nema individualno vlasničko pravo nad zajedničkim dobrom niti nad njegovim dijelom. Ne predstavlja kolektivno vlasništvo u smislu važećih imovinskopravnih kategorija srpskog prava. Zaštićeno licencama AGPL-3.0 (softver) i CC BY-SA 4.0 (sadržaj). Poglavlje 3.

**Protokol — **Tehnički mehanizam zajedničkog dobra. Softver koji vodi evidenciju, obračunava odnose i primjenjuje pravila. Nema pravnu osobnost. Ne donosi odluke — izvršava pravila koja postavljaju ljudi. Poglavlje 3.

**Zaklada (KOLO Zaklada) — **Pravni instrument sustava. Registrirana u Somboru po Zakonu o zadužbinama i fondacijama. Drži infrastrukturu, prima dinarske donacije, zastupa sustav u pravnom prometu. Čuva zajedničko dobro, a nije njegov vlasnik. Voditelj obrade podataka u smislu ZZPL-a. Poglavlje 5.

**Zajednica (KOLO Zajednica) — **Svi korisnici sustava, koji zajedno brinu o zajedničkom dobru. Koristi sustav, doprinosi mu i financira zakladu dinarskim donacijama; u upravljanju sudjeluje kroz Gornje Kolo. Nije pravna osoba i kao cjelina ne donosi odluke. Odnos je zajednice prema zajedničkom dobru participativan: pravo korištenja i doprinosa, ne pravo raspolaganja. Poglavlje 5.

**Osnova — **Minimalan skup elemenata bez kojih sustav ne postoji. Obuhvaća: zajedničko dobro, protokol, zakladu, zajednicu, POEN, ZRNO, obračunski koeficijent, dokaz stvarnosti, financijski doprinos i operativni doprinos. Funkcionira od prvog dana. Poglavlja 3–8.

**Modul — **Proširenje koje dodaje funkcionalnost osnovi bez da je mijenja. Svaki modul koristi isti protokol, istu evidenciju i ista pravila. Aktivira se prema vlastitim preduvjetima. Poglavlje 9.

### Obračunski okvir

**POEN — **Interna obračunska jedinica sustava. Evidencija doprinosa i drugih oblika sudjelovanja u zajedničkom dobru. Nema nositelja — postoji isključivo kao zapis u evidenciji protokola. Zapise upisuje isključivo protokol. Mehanizmi evidentiranja: doprinos korisnika (donacije, pokroviteljstvo, verifikacija, operativni doprinos) — POEN-i u zapisu korisnika; rast krugova i zadruga (Moduli 1 i 2) — POEN-i u zapisu organizacijske jedinice; automatska evidencija u socijalnim programima (Modul 3) — POEN-i u zapisu primatelja potpore po statusu. Razmjena ne uvećava ukupan broj POEN-a — preraspodjeljuje postojeće (zero-sum). Nije novac, valuta, token, platno sredstvo, elektronički novac ni digitalna imovina. Nekonvertibilan. Poglavlje 6.1.

**ZRNO — **Evidencija položaja u zajedničkom dobru. Ukupno raspoloživo: milijun. Upisuje ga samo sudionik — član Kola, odnosno član bez potvrde, koji ga ne aktivira dok ne bude potvrđen; upisuje se i otpisuje isključivo kroz protokol. Neprenosivo između korisnika. Može biti u slobodnom stanju (omogućuje otpis) ili aktivnom stanju (omogućuje glasovanje u Gornjem Kolu). Nije vrijednosni papir, udio, dionica, ulagački ugovor ni digitalna imovina. Ne nosi dividendu, kamatu ni zajamčen prinos. Poglavlje 6.2.

**Obračunski koeficijent — **Ukupan broj POEN-a evidentiranih u sustavu podijeljen brojem ZRNA raspoloživih u protokolu. Izračunava ga protokol jednom dnevno. Administrativna veličina — nije cijena, tečaj ni indeks performansi. Poglavlje 6.3.

**Obračunsko razdoblje — **Vremenski interval na čijem kraju protokol izračunava obračunski koeficijent i primjenjuje pravila upisa i otpisa ZRNA. Obračunsko razdoblje traje 24 sata sa zatvaranjem u ponoć — fiksiran element sustava. Poglavlje 6.

**Dva odvojena akta — **Načelo da su pravni akt donacije (dinarski tok) i administrativni akt evidencije POEN-a (obračunski tok) dva pravno neovisna akta. Donacija ne kupuje POEN-e. Evidencija nije protuusluga za donaciju. Poglavlje 4.

### Korisnici

**Korisnik — **Svaka osoba s računom na platformi, bez obzira na status; korisnik usluge u smislu propisa. Punoljetni korisnik ima jedan od četiri statusa — korisnik, član bez potvrde, član Kola ili čuvar Kola; maloljetni korisnik nema status, a njegov položaj uređuje Pravilnik o sudjelovanju djece. Poglavlje 7.

**Korisnik (status) — **Punoljetni korisnik koji nije u Kolu. Može pregledati sustav, postavljati oglase i razmjenjivati dobra i usluge, razgovarati s drugim korisnicima u opsegu iz Uvjeta korištenja i sudjelovati u ažuriranju evidencije POEN-a (kao davatelj ili primatelj). Doprinos mu se evidentira samo kroz doprinos sadržaju platforme, financijski doprinos i pokroviteljstvo. Nema pristup upravljanju, potvrđivanju drugih ni programima potpore i ne upisuje ZRNO. Može dospjeti na popis za poziv. Ulazni status. Poglavlje 7.

**Član Kola — **Korisnik čija je stvarnost potvrđena u lancu potvrda, jednom važećom potvrdom. Razmjenjuje, doprinosi, stječe evidenciju POEN-a, donira, potvrđuje stvarnost korisnika koje osobno poznaje i uvodi u Kolo korisnike s popisa za poziv, sudjeluje u krugovima i zadrugama. Potpun i legitiman status. Poglavlje 7.

**Član bez potvrde — **Punoljetni korisnik kojeg je netko uveo u Kolo, a kojeg još nije potvrdio član Kola koji ga osobno poznaje. Pripada Kolu; pripadnost Kolu nije članstvo u zakladi. Ima prava sudionika, ali ne i prava koja akti vezuju za člana Kola: ne potvrđuje nikoga, nego samo uvodi poznanike u Kolo; potvrdu mu daje član Kola koji ga osobno poznaje, čuvar Kola nakon telefonskog razgovora ili zaklada; ne vidi popis za poziv, ne daje preporuku i ne nadzire; ZRNO upisuje, ali ga ne aktivira. Poglavlje 7.

**Čuvar Kola — **Član Kola kojem je u protokolu upisano ZRNO. Sve funkcije člana Kola plus sudjelovanje u upravljanju kroz Gornje Kolo aktiviranjem ZRNA, pozicija u obračunskom sustavu i funkcija nadzornika širenja. Kome prestane verifikacija, postaje korisnik, a ZRNO mu ostaje upisano i zamrznuto dok ponovno ne bude potvrđen; kome se poništi samo potvrda, postaje član bez potvrde. Poglavlje 7.

**Osnivači — **Početni čuvari Kola, uspostavljeni prijelaznom odredbom Pravilnika. Ishodište lanca potvrda; njihova potvrđenost ne proizlazi iz verifikacije. Poglavlje 7.

**Kolo — **Krug sudionika — članova bez potvrde, članova Kola i čuvara Kola. Nije pravna osoba; pripadnost Kolu nije članstvo u zakladi ni u drugoj pravnoj osobi. Poglavlje 7.

### Dokaz stvarnosti

**Dokaz stvarnosti — **Model verifikacije korisnika utemeljen na osobnom poznanstvu ili na razgovoru nakon poziva. Potvrđuje stvarnost (korisnik postoji kao fizička osoba) i kontinuitet (ista osoba koja je prvotno verificirana); jedinstvenost verifikator ne jamči, nego višestruki račun utvrđuje zaklada. Ne zahtijeva prikupljanje osobnih dokumenata. Poglavlje 7.

**Lanac potvrda — **Mehanizam dokaza stvarnosti u kojem članovi Kola potvrđuju stvarnost korisnika koje osobno poznaju ili ih nakon razgovora uvode u Kolo, a članovi bez potvrde uvode u Kolo poznanike. Jedini način potvrde stvarnosti; iznimka su samo osnivači. Poglavlje 7.

**Sudionik — **Korisnik kojemu je u lancu potvrda evidentirana jedna važeća verifikacija, potvrdom ili uvođenjem u Kolo: član bez potvrde, član Kola i čuvar Kola. Pripadnost Kolu nema stupnjeva i određuje pristup funkcijama sustava. Poglavlje 7.

**Potvrđenost — **Svojstvo člana Kola: korisnika kojemu je stvarnost potvrđena potvrdom, odnosno člana bez potvrde nakon što bude potvrđen, i osnivača. Određuje pravo potvrđivanja, aktiviranja ZRNA i druga prava koja akti vezuju za člana Kola. Poglavlje 7.

**Potvrda i uvođenje u Kolo — **Dvije vrste verifikacije. Potvrdu daje član Kola, odnosno osnivač, čovjeku kojeg osobno poznaje, i potvrđeni postaje član Kola; uvođenjem u Kolo član Kola nakon razgovora uvodi korisnika s popisa za poziv, odnosno član bez potvrde uvodi poznanika, i uvedeni postaje član bez potvrde. Razlika nije stupanj pripadnosti Kolu. Poglavlje 7.

**Popis za poziv — **Popis korisnika koji ne poznaju nijednog člana Kola i čekaju poziv radi upoznavanja. Na njega se dolazi zahtjevom za razgovor, javnom donacijom od najmanje 5.000 dinara izvršenom jednom uplatom, novčanim pokroviteljstvom ili prijavom gospodarstva upisanog u Registar poljoprivrednih gospodarstava. Dospijeće na popis ne potvrđuje stvarnost. Poglavlje 7.

**Polazni mehanizam (bootstrap) — **Mehanizam pokretanja lanca potvrda u kojem su osnivači potvrđeni bez verifikacije od strane drugih korisnika. Poglavlje 7.

**Nadzornik širenja — **Funkcija naknadne provjere legitimnosti izvršene verifikacije. Obavljaju je čuvari Kola, uključujući osnivače; proizlazi iz statusa i ne ovisi o fazi sustava. Poglavlje 7.

### Doprinos

**Financijski doprinos — **Dinarski priljev u zakladu. Obuhvaća donacije fizičkih osoba i pokroviteljstvo pravnih osoba, obrtnika i gospodarstava. Poglavlje 8.2.

**Operativni doprinos — **Aktivnost izvan platforme čiji se doprinos evidentira u POEN-ima nakon verifikacije izvršenja. Nije radni odnos u smislu čl. 5. Zakona o radu. Poglavlje 8.3.

**Pokroviteljstvo — **Donacija novca od strane pravne osobe, obrtnika ili nositelja registriranog poljoprivrednog gospodarstva, odnosno pokroviteljstvo dobrima i uslugama. Doprinos se evidentira u zapisu korisnika koji je podnio prijavu, po istoj tablici kao donacija fizičke osobe. Jedina točka u sustavu gdje vanjska ekonomija izravno utječe na internu evidenciju. Poglavlje 8.2.

**Koeficijent evidencije donacija — **Odnos između iznosa dinarske donacije i broja POEN-a koji se evidentiraju donatoru. Parametar koji se može mijenjati upravljačkom odlukom. Nije obračunski koeficijent (koji je ukupan broj POEN-a podijeljen brojem raspoloživih ZRNA). Poglavlje 8.2.

**Gospodarstvo — **Kućanstvo koje proizvodi hranu ili poljoprivredne proizvode i nudi ih na Pijaci, upisano ili neupisano u Registar poljoprivrednih gospodarstava (državni registar Republike Srbije). Nije korisnik sustava ni kolektivni oblik i nema zapis u protokolu; članovima odobrenog gospodarstva doprinos se evidentira u osobnim zapisima, a kada gospodarstvo prestane — po bilo kojoj osnovi — otpisuje se svim njegovim članovima u trenutku prestanka, i kada zapis time postane negativan; kod lažne izjave otpis i isključenje pogađaju i osobe koje su bile članovi u razdoblju na koje se izjava odnosi, i kada su u međuvremenu istupile. Svi članovi gospodarstva koji su članovi Kola jednako njime upravljaju na platformi, a za izjavu o točnosti podataka odgovara nositelj, odnosno podnositelj kod gospodarstva izvan registra. Prikazuje se na javnoj karti domaćih proizvođača. Pravilnik o gospodarstvima.

### Upravljanje

**Gornje Kolo — **Upravno tijelo sustava. Čine ga čuvari Kola koji su aktivirali ZRNO; sastav i glasačka moć utvrđuju se za svako obračunsko razdoblje i vrijede samo tijekom njega. Nastaje automatski s aktivacijom ZRNA pri pragu od 1.000.000 POEN-a. Odlučuje kvadratnim glasovanjem s mogućnošću delegiranja. Ograničeno četirima načelima sustava, zaštitnim vetom zaklade i licencama. Poglavlje 10.

**Progresivna decentralizacija — **Strukturirana putanja od centraliziranog prema decentraliziranom upravljanju. Dvije faze s mjerljivim pragom prijelaza (1.000.000 POEN-a). Poglavlje 10.

**Kvadratno glasovanje — **Mehanizam odlučivanja u Gornjem Kolu. Glasačka moć jednaka cjelobrojnoj vrijednosti kvadratnog korijena iz broja aktivnih ZRNA, zaokruženoj naniže. Poglavlje 10.

**Delegiranje — **Prijenos glasačke moći s jednog čuvara Kola na drugog. Delegiraju se glasovi, ne ZRNO. Opće — delegat glasuje o svim pitanjima. Opozivo. Delegirani se glasovi zbrajaju s vlastitim glasovima delegata. Pravila delegiranja, uključujući učinke opoziva i ograničenja delegiranja, utvrđuju se Pravilnikom o Gornjem Kolu. Poglavlje 10.

**Zaštitni veto — **Pravo zaklade da odbije odluku koja ugrožava operativnu i financijsku održivost zaklade prije dosezanja financijske samostalnosti. Mora biti obrazložen. Gasi se trajno i jednosmjerno kada financijska sredstva zaklade dosegnu prag financijske samostalnosti utvrđen posebnim pravilnikom. Poglavlje 10.

### Moduli

**Krug — **Organizacijska jedinica utemeljena na zajedničkom interesu ili djelatnosti. Nema pravnu osobnost. Poglavlje 9, Modul 1.

**Zadruga — **Lokalna organizacijska jedinica utemeljena na teritorijalnom načelu. Registrira se po Zakonu o zadrugama i ima punu pravnu osobnost. Dvije funkcije: lokalna koordinacija i raspodjela dobara na lokalitetu, i poticajna (mehanizam rasta). Ne potvrđuje stvarnost korisnika. Sudjelovanje uređuje Pravilnik o zadrugama. Poglavlje 9, Modul 2.

**Socijalni programi — **Mehanizam automatskog evidentiranja POEN-a za kvalificirane skupine korisnika čije strukturno sudjelovanje u zajedničkom dobru protokol prepoznaje iako se ne očituje kroz pojedinačne aktivnosti. Početne skupine: roditelji, stariji korisnici, osobe s invaliditetom, učenici i studenti. Poglavlje 9, Modul 3.

**Rast krugova i zadruga — **Mehanizam evidentiranja POEN-a aktiviran s Modulima 1 (Krugovi) i 2 (Zadruge). Protokol upisuje nove zapise POEN-a u skladu s brojem članova organizacijske jedinice i dosezanjem definiranih pragova. POEN-i se evidentiraju u zapisu kruga ili zadruge kao organizacijske jedinice, ne u zapisima pojedinačnih članova. Nije doprinos korisnika u smislu ostalih kategorija. Poglavlje 9.

### Strukturna načela

**Nekonvertibilnost — **Strukturno načelo sustava. Nijedna se obračunska jedinica ne može konvertirati u novac ni u bilo koje sredstvo s vanjskom vrijednošću. Ne može se ukinuti nijednom upravljačkom odlukom. Poglavlje 4.

**Odsutnost imovinskog prava nad zapisima — **Strukturno načelo sustava. Korisnik nema imovinsko pravo nad zapisom svog doprinosa. Zapisi su podaci u evidenciji, ne sredstva. Ne može se ukinuti nijednom upravljačkom odlukom. Poglavlje 4.

**Nepovratnost donacija — **Strukturno načelo sustava. Dinarska je donacija zakladi nepovratna. Donator ne stječe pravo na povrat, upravljačko pravo ni udio u sustavu. Ne može se ukinuti nijednom upravljačkom odlukom. Poglavlje 4.

**Minimizacija podataka — **Strukturno načelo sustava. Platforma prikuplja samo podatke nužne za funkcioniranje sustava. Zaklada ne čuva osobne podatke korisnika platforme u vlastitim bazama. Ne može se ukinuti nijednom upravljačkom odlukom. Poglavlje 4.

# Prilog D: Tehničke i organizacijske mjere sigurnosti

Ovaj prilog opisuje tehničke i organizacijske mjere koje zaklada primjenjuje na infrastrukturi na kojoj se podaci nalaze, u skladu s obvezom primjene mjera primjerenih riziku (čl. 51. ZZPL-a; GDPR čl. 32.). Mjere se primjenjuju na sve kategorije podataka opisane u poglavlju 12, s pojačanim mjerama za posebne kategorije podataka i podatke maloljetnih osoba. Konkretna se implementacija prilagođava aktualnom stanju infrastrukture i ažurira s razvojem sustava.

### Pseudonimizacija i razdvajanje podataka

Zapisi u evidenciji protokola vezani su za pseudonime, ne za osobna imena korisnika. Ime i prezime vodi se samo u evidenciji identiteta, zasebnoj evidenciji koju vidi samo administratorski tim zaklade; ime i prezime korisnika s popisa za poziv vidi i član Kola koji ga zove, dok je poziv otvoren; u nju se ne upisuju jedinstveni matični broj građana ni podaci iz isprava. Pseudonimizirani podaci ostaju osobni podaci u smislu ZZPL-a (čl. 4. st. 1. t. 3a) jer se, uz dodatne informacije, mogu povezati s identificiranom osobom.

Zaklada ne čuva osobne podatke korisnika platforme — svi se podaci korisnika čuvaju na infrastrukturi protokola. Zaklada izravno čuva samo bankovnu dokumentaciju donacija i evidenciju o vezi između pravne osobe pokrovitelja i korisnika na čiji se zapis doprinos evidentira. To je razdvajanje dizajnerska odluka opisana u poglavlju 12.

### Šifriranje

Podaci u prijenosu štite se TLS enkripcijom, najmanje verzija 1.2. Komunikacija između korisnika i sustava, između komponenti sustava i između sustava i vanjskih servisa odvija se isključivo preko šifriranih kanala.

Podaci u mirovanju štite se enkripcijom na razini pohrane. Identifikacijski podaci korisnika (pseudonim, adresa e-pošte), podaci o donacijama, podaci o pokroviteljstvu i posebne kategorije podataka šifriraju se prije pohrane. Ključevi se za enkripciju čuvaju odvojeno od šifriranih podataka, s kontroliranim pristupom ključevima.

### Kontrola pristupa

Pristup je podacima utemeljen na načelu minimalnog pristupa (čl. 51. st. 2. ZZPL-a) — svaki korisnik sustava, svaki administrator i svaki proces ima pristup samo onim podacima koji su nužni za obavljanje njegove funkcije.

Administrativni pristup infrastrukturi zahtijeva višefaktorsku autentifikaciju. Pristup identifikacijskim podacima korisnika ograničen je na ovlaštene osobe u zakladi. Pristup evidenciji u protokolu je automatiziran — protokol pristupa podacima po pravilima, bez ručne intervencije.

Korisnici sustava pristupaju vlastitim podacima i pseudonimnoj evidenciji drugih korisnika, u opsegu koji odgovara njihovu statusu. Korisnici ne mogu pristupiti identifikacijskim podacima drugih korisnika osim ako ti korisnici izrijekom ne odaberu biti vidljivi. Iznimka su ime i prezime i broj telefona korisnika s popisa za poziv: otvaraju se samo članu Kola koji je poziv otvorio i samo dok je poziv otvoren, a bilježi se tko ih je otvorio.

Pristup posebnim kategorijama podataka (zdravstveno stanje, invaliditet, roditeljski status, studentski status) ograničen je na proces verifikacije statusa i ne čuva se nakon verifikacije — u sustavu ostaje samo minimalni zapis o pripadnosti skupini i datum verifikacije.

### Evidencija pristupa

Svaki se pristup podacima bilježi — tko je pristupio, kad je pristupio, kojim je podacima pristupio i s kojeg uređaja. Evidencija se pristupa čuva u zaštićenom formatu koji se ne može retroaktivno mijenjati. Evidencija je pristupa dostupna službeniku za zaštitu podataka (DPO, čl. 56. ZZPL-a) i koristi se za detekciju neovlaštenog pristupa.

### Integritet evidencije

Evidencija doprinosa u protokolu zaštićena je od neovlaštene promjene. Svaki je zapis u evidenciji vremenski označen i vezan za prethodno stanje evidencije. Retroaktivna promjena zapisa nije moguća bez narušavanja integriteta cjelokupnog lanca evidencije. Ovo je dizajnersko pravilo osigurano softverskom arhitekturom centralizirane evidencije, ne svojstvo distribuirane infrastrukture. Redovite provjere konzistentnosti osiguravaju da evidencija u svakom trenutku odgovara pravilima protokola.

### Zaštita posebnih kategorija podataka

Posebne kategorije podataka nastaju aktiviranjem Modula 3 (Socijalni programi) i Modula 4 (Djeca). Obrada tih podataka podliježe pojačanim zahtjevima (čl. 17. ZZPL-a; GDPR čl. 9.).

Zaklada ne čuva preslike podnesene dokumentacije — u sustavu ostaje samo minimalni zapis o pripadnosti kvalificiranoj skupini i datum verifikacije statusa. Pristup je tim podacima ograničen na proces verifikacije. Podaci se čuvaju odvojeno od opće evidencije aktivnosti i zaštićeni su dodatnom razinom enkripcije.

Podaci maloljetnih osoba (Modul 4) podliježu pojačanoj zaštiti u skladu s čl. 16. ZZPL-a. Suglasnost roditelja ili zakonskog zastupnika evidentira se i čuva odvojeno. Oba modula aktivirana su tek nakon ažuriranja procjene učinka na zaštitu podataka (DPIA).

### Procjena učinka na zaštitu podataka (DPIA)

Zaklada provodi procjenu učinka na zaštitu podataka prije početka obrade (čl. 54. ZZPL-a; GDPR čl. 35.). DPIA se ažurira prije aktiviranja svakog modula koji uvodi obradu novih kategorija podataka; tako su aktivirani Modul 3 (posebne kategorije) i Modul 4 (maloljetne osobe). Rezultati su DPIA-e dostupni DPO-u i služe kao temelj za primjenu odgovarajućih mjera zaštite.

### Sigurnosne kopije i oporavak

Podaci se redovito kopiraju na zemljopisno odvojene lokacije. Sigurnosna kopija uključuje evidenciju protokola, identifikacijske podatke i konfiguraciju sustava. Postupci se oporavka redovito testiraju kako bi se osiguralo da sustav može nastaviti rad nakon gubitka podataka, kvara infrastrukture ili sigurnosnog incidenta.

Podaci sigurnosnih kopija podliježu istim mjerama zaštite kao primarni podaci — šifriranje, kontrola pristupa, evidencija pristupa.

### Prekogranični prijenos podataka

Ako infrastruktura sustava uključuje poslužitelje izvan Republike Srbije, prijenos osobnih podataka izvan zemlje podliježe pravilima ZZPL-a o prekograničnom prijenosu (čl. 65.–69.). Zaklada osigurava da prijenos podataka u treće zemlje bude utemeljen na primjerenoj razini zaštite — odlukom o primjerenosti, odgovarajućim mjerama zaštite ili odstupanjima predviđenima zakonom. Izbor cloud pružatelja uzima u obzir lokaciju poslužitelja i primjenjiv pravni okvir za zaštitu podataka u jurisdikciji u kojoj se poslužitelji nalaze.

### Upravljanje incidentima

Zaklada ima definiran postupak za upravljanje sigurnosnim incidentima. Postupak uključuje: detekciju incidenta, procjenu ozbiljnosti, ograničavanje štete, otklanjanje uzroka, obavještavanje pogođenih korisnika i obavještavanje Povjerenika za informacije od javnog značaja i zaštitu podataka o ličnosti u roku od 72 sata od saznanja za incident (čl. 52. ZZPL-a; GDPR čl. 33.).

Svaki se incident dokumentira s opisom uzroka, pogođenih podataka, poduzetih mjera i pouka za sprječavanje budućih incidenata. Ako incident može prouzročiti visok rizik za prava i slobode korisnika, zaklada obavještava pogođene korisnike bez nepotrebne odgode (čl. 53. ZZPL-a; GDPR čl. 34.).

### Redovito testiranje

Mjere se sigurnosti redovito testiraju. Testiranje uključuje provjeru ranjivosti infrastrukture, penetracijsko testiranje sustava, provjeru usklađenosti sa sigurnosnim politikama i simulaciju incidenata. Rezultati se testiranja dokumentiraju i koriste za unaprjeđenje mjera.

### Fizička sigurnost

Infrastruktura sustava — poslužitelji, mrežna oprema, mediji za sigurnosne kopije — nalazi se u zaštićenim prostorijama s kontroliranim pristupom. Ako zaklada koristi cloud infrastrukturu, bira pružatelje koji imaju certificirane fizičke mjere zaštite (ISO 27001 ili ekvivalent) i ugovorom regulira obveze pružatelja u vezi sa sigurnošću, uključujući obveze iz ugovora o obradi podataka (čl. 45. ZZPL-a).

### Organizacijske mjere

Osobe koje imaju pristup podacima korisnika potpisuju obvezu čuvanja povjerljivosti. Redovita izobrazba zaposlenika i suradnika zaklade o zaštiti podataka i sigurnosti informacija. Jasna podjela odgovornosti u domeni sigurnosti. Službenik za zaštitu podataka (DPO) ima neovisnost i pristup svim informacijama o obradi i sigurnosti podataka (čl. 58. ZZPL-a). Ako zaklada angažira treće osobe za održavanje infrastrukture, te su osobe izvršitelji obrade u smislu ZZPL-a (čl. 45.) i odnos se regulira ugovorom o obradi podataka.

### Razvoj softvera

Softver se protokola razvija po načelima sigurnog razvoja i zaštite po dizajnu (čl. 50. ZZPL-a; GDPR čl. 25.). Kod se pregledava prije puštanja u produkciju. Poznate se ranjivosti prate i otklanjaju u definiranim rokovima. Ažuriranja se sustava primjenjuju planski, s testiranjem u kontroliranom okruženju prije primjene na produkcijski sustav. Izvorni je kod dostupan pod AGPL-3.0 licencom, što omogućuje neovisnu reviziju sigurnosti od strane zajednice i trećih osoba.

# Prilog E: Mapiranje Ostrominih dizajnerskih načela na KOLO arhitekturu

Elinor Ostrom je na temelju empirijskog istraživanja zajednica koje uspješno upravljaju zajedničkim dobrima formalizirala osam dizajnerskih načela za dugoročnu održivost institucija kolektivnog upravljanja (Ostrom, 1990). Ta su načela izvorno formulirana za rivalska zajednička dobra — pašnjake, ribnjake, vodne resurse — gdje korištenje od strane jednog umanjuje dostupnost za druge. KOLO sustav je nerivalno digitalno zajedničko dobro (usp. Hess i Ostrom, 2007) — softver, pravila i infrastruktura čije korištenje od strane jednog korisnika ne umanjuje dostupnost za druge, s pozitivnim mrežnim učinkom koji uvećava korisnost s brojem korisnika. Ta je razlika bitna jer neka načela dobivaju drukčiji oblik u kontekstu nerivalnog dobra.

Ovaj prilog mapira svako od osam načela na konkretne elemente KOLO arhitekture.

### Načelo 1: Jasno definirane granice (Clearly defined boundaries)

*Ostrom: *Granice zajedničkog dobra i krug korisnika koji imaju pravo pristupa moraju biti jasno definirani.

*KOLO: *Sustav razlikuje četiri statusa punoljetnih korisnika s izrijekom definiranim pravima pristupa za svaki status. Korisnik ima pristup pregledu sustava, razmjeni i sudjelovanju u ažuriranju evidencije POEN-a. Član bez potvrde, uveden u Kolo, ima prava sudionika, ali ne potvrđuje druge i ne glasuje. Član Kola (potvrđen jednom važećom potvrdom) ima pun pristup razmjeni i evidenciji doprinosa. Čuvar Kola ima dodatna prava upravljanja i poziciju u obračunskom sustavu. Prijelaz je između statusa definiran pravilima sustava — verifikacijom i potvrdom u lancu potvrda, odnosno upisom ZRNA po mjerljivim uvjetima. Dokaz stvarnosti kroz lanac potvrda (poglavlje 7) osigurava da iza svakog sudionika stoji stvarna, jedinstvena osoba. Granice su zajedničkog dobra definirane licencama (AGPL-3.0 i CC BY-SA 4.0, poglavlje 3) i četirima strukturnim načelima (poglavlje 4).

*Poklapanje: *Strukturno. Granice su jasnije nego u većini Ostrominih primjera jer su ugrađene u softver, ne u društvene konvencije.

### Načelo 2: Podudarnost pravila s lokalnim uvjetima (Congruence between appropriation and provision rules and local conditions)

*Ostrom: *Pravila o korištenju i doprinosu moraju biti prilagođena lokalnim uvjetima.

*KOLO: *Pravila protokola postavljaju ljudi, ne algoritam. U Fazi 1. osnivač i zaklada prilagođavaju parametre na temelju operativnog iskustva. U Fazi 2. Gornje Kolo mijenja pravila kvadratnim glasovanjem. Parametri su operativni i podložni promjeni — jedino su strukturni limiti (poglavlje 4) iznad upravljačke moći. Modularna arhitektura (poglavlje 9) omogućuje prilagodbu — moduli se aktiviraju prema potrebama zajednice. Zadruge (Modul 2) kao lokalne organizacijske jedinice omogućuju da se raspodjela na lokalitetu organizira po vlastitim pravilima zadruge, u okviru pravila sustava.

*Poklapanje: *Strukturno. Mehanizam je promjene pravila izrijekom dizajniran s razlikovanjem promjenjivih parametara i nepromjenjivih načela.

### Načelo 3: Kolektivno odlučivanje (Collective-choice arrangements)

*Ostrom: *Većina korisnika na koje utječu pravila može sudjelovati u mijenjanju tih pravila.

*KOLO: *Gornje Kolo — upravno tijelo koje čine čuvari Kola koji su aktivirali ZRNO — odlučuje o pravilima protokola kvadratnim glasovanjem (poglavlje 10). Pravo glasovanja proizlazi iz evidentiranog doprinosa — ZRNO se upisuje na temelju akumulirane evidencije POEN-a, čime glasačka moć pripada čuvarima Kola koji aktivno koriste i doprinose zajedničkom dobru. Svi korisnici sustava, bez obzira na status, sudjeluju u procesu odlučivanja kroz inicijative i javnu raspravu prije glasovanja. Delegiranje glasova adresira problem participacije.

*Poklapanje: *Strukturno. Pravo glasovanja pripada čuvarima Kola, koji aktivno doprinose zajedničkom dobru, dok svi korisnici sudjeluju u raspravi — što odgovara Ostrominim primjerima gdje glasuju aktivni korisnici zajedničkog dobra.

### Načelo 4: Nadzor (Monitoring)

*Ostrom: *Nadzornici koji aktivno prate stanje zajedničkog dobra i ponašanje korisnika odgovorni su korisnicima ili su sami korisnici.

*KOLO: *Protokol evidentira svaku aktivnost u sustavu — svaku razmjenu, svaki doprinos, svaki čin verifikacije (poglavlja 6 i 7). Evidencija je dostupna korisnicima sustava u pseudonimnom obliku (poglavlje 12). Nadzornici širenja — čuvari Kola, uključujući osnivače — provjeravaju legitimnost verifikacija (poglavlje 7). Čuvari Kola verificiraju izvršenje operativnih zadataka (poglavlje 8.3). Transparentnost pravila i evidencije omogućuje svakom korisniku da uoči neregularne obrasce.

*Poklapanje: *Strukturno. Nadzor je automatiziran (protokol bilježi sve) i decentraliziran (čuvari Kola obavljaju nadzornu funkciju). Nadzornici su sami korisnici sustava s evidentiranim doprinosom.

### Načelo 5: Graduirane sankcije (Graduated sanctions)

*Ostrom: *Korisnici koji krše pravila dobivaju sankcije proporcionalne ozbiljnosti i kontekstu prekršaja.

*KOLO: *Sustav primjenjuje sankcije za kršenja — posebno za lažnu verifikaciju: poništenje lažne verifikacije i zapisa POEN-a nastalih po njoj, nadoknadu na teret verifikatora, koja njegov zapis može oboriti u negativnu vrijednost (čl. 20b Pravilnika o dokazu stvarnosti), i suspenziju, odnosno isključenje, po postupku iz Uvjeta korištenja i uz pravo na prigovor (čl. 21 Pravilnika o dokazu stvarnosti; poglavlje 7). Nadoknada je razmjerna onome što je na temelju lažne verifikacije izvučeno iz mreže, a isključenje je mjera koja se izriče u pravilu. Verifikator koji lažno potvrdi riskira vlastiti zapis POEN-a i položaj u sustavu (poglavlje 11). Nekonvertibilnost osigurava da je interna pozicija jedina stvar koju korisnik može izgubiti — ali je za aktivnog korisnika to znatan gubitak.

*Poklapanje: *Strukturno. Graduiranost je eksplicitna i proporcionalna.

### Načelo 6: Mehanizmi za rješavanje sporova (Conflict-resolution mechanisms)

*Ostrom: *Korisnici imaju brz pristup mehanizmima za rješavanje sporova.

*KOLO: *Korisnici mogu podnositi primjedbe i žalbe na funkcioniranje sustava zakladi (u objema fazama) i Gornjem Kolu (u Fazi 2.). Proces odlučivanja u Gornjem Kolu uključuje razdoblje javne rasprave u kojem cijela zajednica može komentirati i osporavati prijedloge prije glasovanja (poglavlje 10). Četiri načela sustava, licence zajedničkog dobra i zakonske obveze Upravnog odbora apsolutno ograničavaju odluke, a zaštitni veto zaklade štiti njezinu operativnu i financijsku održivost do financijske samostalnosti. Korisnik koji se ne slaže s odlukama zadržava pravo izlaska iz sustava s ostvarivanjem prava iz poglavlja 12 (usp. Hirschman, 1970). Konkretni postupci za podnošenje primjedbi i rješavanje sporova definirani su u pravilniku sustava.

*Poklapanje: *Strukturno. Mehanizmi postoje na objema razinama (zaklada i Gornje Kolo), s definiranim postupcima u pravilniku sustava.

### Načelo 7: Minimalno priznanje prava na organiziranje (Minimal recognition of rights to organize)

*Ostrom: *Vanjska vlast (država) ne osporava pravo korisnika da uspostave vlastite institucije.

*KOLO: *Zaklada je registrirana po Zakonu o zadužbinama i fondacijama — srpski pravni sustav prepoznaje pravni oblik koji KOLO koristi. Međunarodni institucionalni okvir (Prilog A) — Akcijski plan EU-a, UN rezolucije, ILO rezolucija, OECD preporuka — aktivno podržava tip entiteta u koji se KOLO funkcionalno uklapa. Srbija u procesu pristupanja EU-u ulazi u regulatorno okruženje koje prepoznaje socijalnu i solidarnu ekonomiju. Licence (AGPL-3.0 i CC BY-SA 4.0) štite zajedničko dobro od aproprijacije.

*Poklapanje: *Strukturno. Pravni je oblik prepoznat, a međunarodni institucionalni okvir aktivno podržava kategoriju entiteta u koju se KOLO uklapa.

### Načelo 8: Ugniježđeni sustavi (Nested enterprises)

*Ostrom: *Za veće sustave, upravljačke su aktivnosti organizirane u više slojeva ugniježđenih struktura.

*KOLO: *Sustav ima višeslojnu strukturu: korisnici → krugovi i zadruge (kolektivni oblici — interesne skupine, Modul 1, i teritorijalne jedinice, Modul 2) → Gornje Kolo (upravljačko tijelo) → zaklada (pravni instrument). Svaki sloj ima definirane nadležnosti. Krugovi nemaju pravnu osobnost. Zadruge imaju punu pravnu osobnost po Zakonu o zadrugama. Gornje Kolo odlučuje o pravilima cjelokupnog sustava. Modul internacionalizacije (Modul 5) predviđa zemljopisno širenje s jedinstvenim protokolom.

*Poklapanje: *Strukturno u dizajnu. Modularna arhitektura predviđa ugniježđene slojeve, a funkcioniranje u praksi ovisi o iskustvu s kasnijim fazama sustava.

### Napomena o primjenjivosti

Ostromina su načela formulirana na temelju istraživanja rivalskih zajedničkih dobara — resursa čije korištenje od strane jednog umanjuje dostupnost za druge. KOLO sustav pretežno je nerivalno zajedničko dobro — softver, pravila i infrastruktura dostupni su svim korisnicima bez umanjenja. Rivalski element postoji na razini ZRNA (ukupno milijun, upis jednog smanjuje raspoloživa za ostale) i na razini razmjene (zero-sum preraspodjela POEN-a). Ta kombinacija rivalnih i nerivalnih elemenata čini KOLO hibridnim zajedničkim dobrom — kategorijom koju Hess i Ostrom (2007) analiziraju u kontekstu digitalnih zajedničkih dobara.

Mapiranje pokazuje da je KOLO arhitektura dizajnirana s ciljem da adresira svih osam načela. Poklapanje je strukturno za svih osam — načela su ugrađena u protokol, upravljanje i pravni okvir sustava kao dizajnerske odluke, ne kao naknadne adaptacije. Pitanje funkcionira li dizajn kako je predviđeno empirijsko je — odgovor ovisi o iskustvu s funkcioniranjem sustava u praksi.
