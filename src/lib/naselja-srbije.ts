// Naselja Republike Srbije — popis 2022, bez KiM
// Organizovano po opštinama radi lakšeg održavanja
const RAW: string[] = [
  // ── BEOGRAD ──────────────────────────────────────────────────────────────
  "Beograd", "Zemun", "Novi Beograd", "Zvezdara", "Rakovica", "Čukarica",
  "Voždovac", "Savski venac", "Stari grad", "Vračar", "Palilula",
  // Barajevo
  "Barajevo", "Arnajevo", "Baroševac", "Beljina", "Meljak", "Rožanci",
  "Sibnica", "Šiljakovac", "Vranić",
  // Grocka
  "Grocka", "Begaljica", "Boleč", "Brestovik", "Dražanj", "Dražanj",
  "Kaluđerica", "Lestane", "Pudarci", "Ritopek", "Saraorci", "Vinča",
  // Lazarevac
  "Lazarevac", "Baroševac", "Bistrica", "Junkovac", "Kruševica",
  "Lukavica", "Medoševac", "Mirosaljci", "Petka", "Rudovci",
  "Sokolovo", "Stepojevac", "Šopić", "Vreoci",
  // Mladenovac
  "Mladenovac", "Amerić", "Dubona", "Jagnjilo", "Koraćica",
  "Markovac", "Međulužje", "Rabrovac", "Senaja", "Vlaška",
  // Obrenovac
  "Obrenovac", "Barič", "Draževac", "Grabovac", "Krtinska",
  "Mislođin", "Rvati", "Skela", "Stubline", "Urovci",
  // Sopot
  "Sopot", "Drlupa", "Guberevac", "Mala Ivanča", "Nemenikuće",
  "Parcani", "Rogača", "Slatina",
  // Surčin
  "Surčin", "Boljevci", "Dobanovci", "Jakovo", "Petrovčić",
  "Progar", "Ugrinovci",

  // ── VOJVODINA — SEVERNA BAČKA ────────────────────────────────────────────
  // Subotica
  "Subotica", "Bajmok", "Bikovo", "Čantavir", "Đurđin",
  "Gornji Grad", "Hajdukovo", "Horgoš", "Kelebija", "Ljutovo",
  "Mali Bajmok", "Mala Bosna", "Novi Žednik", "Palić", "Šupljak",
  "Tavankut", "Verušić",
  // Bačka Topola
  "Bačka Topola", "Gunaroš", "Karađorđevo",
  "Mali Iđoš", "Novo Orahovo", "Panonija", "Stara Moravica",
  // Mali Iđoš
  "Lovćenac", "Feketić",
  // Kanjiža
  "Kanjiža", "Adorjan", "Horgoš", "Kikinda", "Orom",
  "Padej", "Torda", "Trešnjevac",
  // Senta
  "Senta", "Bogaraš", "Kevi",
  // Ada
  "Ada", "Mol", "Obornjača", "Sterijino",

  // ── VOJVODINA — ZAPADNA BAČKA ────────────────────────────────────────────
  // Sombor
  "Sombor", "Aleksa Šantić", "Bački Breg", "Bački Monoštor", "Bezdan",
  "Čonoplja", "Doroslovo", "Gakovo", "Karavukovo", "Kljajićevo",
  "Kolut", "Rastina", "Riđica", "Stapar", "Svetozar Miletić",
  "Telečka", "Tovariševo",
  // Apatin
  "Apatin", "Kupusina", "Prigrevica", "Sonta", "Svilojevo",
  // Kula
  "Kula", "Crvenka", "Lipar", "Sivac",
  // Odžaci
  "Odžaci", "Bogojevo", "Bački Brestovac", "Bačko Novo Selo",
  "Deronje", "Karavukovo", "Lalić", "Ratkovo", "Srpski Miletić",

  // ── VOJVODINA — JUŽNA BAČKA ──────────────────────────────────────────────
  // Novi Sad
  "Novi Sad", "Budisava", "Bukovac", "Futog", "Kać",
  "Kisač", "Kovilj", "Ledinci", "Rumenka", "Stepanovićevo",
  "Veternik",
  // Bač
  "Bač", "Bački Petrovac", "Gložan", "Kulpin", "Maglić",
  "Parage", "Selenča",
  // Bačka Palanka
  "Bačka Palanka", "Čelarevo", "Despotovo", "Neštin",
  "Pivnice", "Silbaš", "Tovariševo",
  // Beočin
  "Beočin", "Lug", "Rakovac", "Sviloš", "Susek",
  // Bečej
  "Bečej", "Bačko Gradište", "Bačko Petrovo Selo", "Mileševo",
  // Srbobran
  "Srbobran", "Nadalj", "Turija",
  // Temerin
  "Temerin", "Bački Jarak", "Sirig",
  // Sremski Karlovci
  "Sremski Karlovci",
  // Žabalj
  "Žabalj", "Đurđevo", "Lok", "Čurug",
  // Titel
  "Titel", "Gardinovci", "Lock", "Mošorin", "Vilovo",
  // Inđija
  "Inđija", "Beška", "Čortanovci", "Krčedin", "Maradik",
  "Novi Slankamen", "Popinci", "Stari Slankamen",
  // Irig
  "Irig", "Grgeteg", "Jazak", "Krušedol Prnjavor",
  "Mala Remeta", "Neradin", "Rivica", "Šatrinci", "Vrdnik",
  // Stara Pazova
  "Stara Pazova", "Belegiš", "Golubinci", "Nova Pazova",
  "Novi Banovci", "Putinci", "Sremska Mitrovica",
  // Pećinci
  "Pećinci", "Ašanja", "Kupinovo", "Obrež",
  "Popinci", "Šimanovci",

  // ── VOJVODINA — SREDNJI BANAT ────────────────────────────────────────────
  // Zrenjanin
  "Zrenjanin", "Aradac", "Botoš", "Čenta", "Ečka",
  "Elemir", "Farkaždun", "Jankov Most", "Knićanin",
  "Lazarevo", "Lukićevo", "Melenci", "Mihajlovo",
  "Perlez", "Sakule", "Stajićevo", "Taraš",
  // Novi Bečej
  "Novi Bečej", "Kumane", "Novo Miloševo", "Vranješević",
  // Žitište
  "Žitište", "Banatski Despotovac", "Banatsko Karađorđevo",
  "Hetin", "Međa", "Ravni Topolovac", "Srpski Itebej",
  "Torak", "Torda",
  // Sečanj
  "Sečanj", "Boka", "Busur", "Jaša Tomić",
  "Jarkovac", "Sutjeska",
  // Zrenjanin ostalo
  "Verbica",

  // ── VOJVODINA — SEVERNI BANAT ────────────────────────────────────────────
  // Kikinda
  "Kikinda", "Banatska Topola", "Iđoš", "Nakovo",
  "Novi Kozarci", "Rusko Selo", "Sajan",
  // Čoka
  "Čoka", "Jazovo", "Ostojićevo", "Padej", "Zrenjanin",
  // Nova Crnja
  "Nova Crnja", "Banatska Crnja", "Boka", "Vojvoda Stepa",
  // Novi Kneževac
  "Novi Kneževac", "Banatsko Aranđelovo", "Rabe",
  // Kikinda okrug ostalo
  "Banatska Dubica", "Santrač", "Sanad",

  // ── VOJVODINA — JUŽNI BANAT ──────────────────────────────────────────────
  // Pančevo
  "Pančevo", "Banatsko Novo Selo", "Dolovo", "Glogonj",
  "Jabuka", "Kačarevo", "Omoljica", "Starčevo",
  // Alibunar
  "Alibunar", "Banatski Karlovac", "Dobrica",
  "Ilandža", "Janošik", "Locve", "Nikolinci",
  "Seleuš", "Vladimirovo",
  // Bela Crkva
  "Bela Crkva", "Banatska Palanka", "Banatska Subotica",
  "Crepaja", "Dupljaja", "Jasenovo", "Kajtasovo",
  "Kruščica", "Kusić",
  // Kovin
  "Kovin", "Bavanište", "Deliblato", "Gaj",
  "Mramorak", "Šumarak",
  // Kovačica
  "Kovačica", "Crepaja", "Debeljača", "Idvor",
  "Kačarevo", "Padina", "Uzdin",
  // Opovo
  "Opovo", "Baranda", "Botoš", "Sakule",
  // Plandište
  "Plandište", "Barice", "Gudurica", "Jermenovci",
  "Markovićevo", "Stari Lec", "Veliko Središte",
  // Vršac
  "Vršac", "Gudurica", "Izbište", "Jablanka",
  "Mali Žam", "Markovac", "Mesić",
  "Orešac", "Partoš", "Pavliš", "Potporanj",
  "Vlajkovac", "Vojvoda Bojović",

  // ── VOJVODINA — SREM ─────────────────────────────────────────────────────
  // Sremska Mitrovica
  "Sremska Mitrovica", "Bešenovo", "Čalma", "Divoš",
  "Grgurevci", "Laćarak", "Mačvanska Mitrovica",
  "Manđelos", "Martinci", "Noćaj",
  "Ravnje", "Salašinci", "Zasavica",
  // Ruma
  "Ruma", "Buđanovci", "Donji Petrovci", "Grabovci",
  "Hrtkovci", "Klenak", "Kraljevci", "Nikinci",
  "Platičevo", "Putinci", "Stejanovci", "Vrdnik",
  "Žarkovac",
  // Šid
  "Šid", "Adaševci", "Bačinci", "Batrovci",
  "Berkasovo", "Bingula", "Erdevik", "Gibarac",
  "Ilinci", "Jamena", "Kukujevci",
  "Ljuba", "Molovin", "Morović",
  "Privina Glava", "Sot", "Vašica",
  // Sremska Topola
  "Stara Pazova",

  // ── MAČVANSKI OKRUG ──────────────────────────────────────────────────────
  // Šabac
  "Šabac", "Bela Reka", "Bogosavac", "Drenovac",
  "Dublje", "Glušci", "Jevremovac", "Koceljeva",
  "Lipolist", "Mačvanska Mitrovica", "Majur",
  "Metković", "Miokus", "Nakučani",
  "Orašac", "Petlovača", "Prnjavor", "Ribari",
  "Skiropoj",  "Tabanovići", "Tabanović",
  "Uzveće", "Zminjak",
  // Bogatic
  "Bogatić", "Banovo Polje", "Belotić", "Crna Bara",
  "Glogovac", "Metković", "Salaš Noćajski",
  "Sovljak", "Štitar", "Uzveće",
  // Loznica
  "Loznica", "Banja Koviljača", "Brezjak",
  "Donja Badanja", "Donji Dobrić",
  "Gornja Badanja", "Gornji Dobrić",
  "Koviljača", "Lipnica", "Petnica", "Pilica",
  "Trešnjevica", "Tršić",
  // Vladimirci
  "Vladimirci", "Cerić", "Dvor", "Skradnik",
  // Koceljeva
  "Koceljeva", "Draginje", "Vinoča",
  // Ljubovija
  "Ljubovija", "Gornja Ljuboviđa", "Postenje",
  // Mali Zvornik
  "Mali Zvornik", "Amajić", "Brasina",

  // ── KOLUBARSKI OKRUG ─────────────────────────────────────────────────────
  // Valjevo
  "Valjevo", "Brangović", "Brežđe", "Divčibare",
  "Donji Taor", "Grabovica", "Klinci", "Kotešica",
  "Lelić", "Pambukovica", "Popučke",
  "Pričević", "Ručić", "Stepanje", "Takovo",
  // Lajkovac
  "Lajkovac", "Bogovađa", "Jabučje",
  "Šarbane", "Vreoci",
  // Ljig
  "Ljig", "Bošnjane", "Brajkovac", "Cvetanovac",
  // Mionica
  "Mionica", "Brežđe", "Struganik", "Toplica",
  // Osečina
  "Osečina", "Bratačić", "Dragijevica",
  // Ub
  "Ub", "Brgule", "Kalenić", "Pambukovica",

  // ── ZLATIBORSKI OKRUG ────────────────────────────────────────────────────
  // Užice
  "Užice", "Bioska", "Goračići", "Krčagovo",
  "Pot", "Sevojno", "Stapar", "Turica",
  // Čajetina
  "Čajetina", "Čačak", "Kremna",
  "Sirogojno", "Zlatibor",
  // Arilje
  "Arilje", "Dobrača", "Gradac",
  // Bajina Bašta
  "Bajina Bašta", "Bačevci", "Oskoruša",
  "Perućac", "Rača",
  // Kosjerić
  "Kosjerić", "Mečkovac", "Seča Reka",
  // Ivanjica
  "Ivanjica", "Brasina", "Erčege", "Konjska",
  "Prilike", "Smokovac", "Šume",
  // Nova Varoš
  "Nova Varoš", "Akmačići", "Kokin Brod",
  "Negbina", "Radoinja", "Zlatar",
  // Priboj
  "Priboj", "Banja Pribojska", "Kaluđerske Bare",
  // Prijepolje
  "Prijepolje", "Brodarevo", "Mileševo",
  // Sjenica
  "Sjenica", "Karajukića Bunari", "Rasno",

  // ── MORAVIČKI OKRUG ──────────────────────────────────────────────────────
  // Čačak
  "Čačak", "Bresnica", "Gornja Gorevnica",
  "Kablar", "Konjevići", "Lučani",
  "Mrčajevci", "Preljina", "Prislonica",
  "Trbušica", "Trnavci",
  // Gornji Milanovac
  "Gornji Milanovac", "Brđani", "Grabovica",
  "Konjević", "Rudnik",
  // Lučani
  "Lučani", "Gučа", "Kotraža",
  // Ivanjica (Moravički deo)
  "Šume",

  // ── RAŠKI OKRUG ──────────────────────────────────────────────────────────
  // Novi Pazar
  "Novi Pazar", "Goševo", "Karaula", "Trnava", "Tutin",
  // Kraljevo
  "Kraljevo", "Adrani", "Goč", "Jošanička Banja",
  "Mataruška Banja", "Milatkovići", "Ratina", "Ribnica",
  "Rudan", "Ušće",
  // Raška
  "Raška", "Biljanovac", "Bogutovac", "Brvenica",
  "Kopaonik", "Mur",
  // Vrnjačka Banja
  "Vrnjačka Banja", "Gokčanica", "Lipova",
  // Aleksandrovac
  "Aleksandrovac", "Župa", "Rujišta",
  // Brus
  "Brus", "Blagojevići", "Kuršumlija",

  // ── RASINSKI OKRUG ───────────────────────────────────────────────────────
  // Kruševac
  "Kruševac", "Biljanovac", "Bojanine vode",
  "Dedina", "Globoder", "Jakovljevo",
  "Jasika", "Kukljin", "Laćinak",
  "Lipovica", "Mačkovac", "Nišević",
  "Parunovac", "Pepeljevac", "Rasina",
  "Ribari", "Srnje", "Strojinci",
  "Varvarin", "Velika Drenova",
  // Aleksandrovac (Rasin.)
  "Trnava",
  // Trstenik
  "Trstenik", "Bela Voda", "Bošnjane",
  "Grabovac", "Lozovik", "Milutovac",
  "Strojinci",
  // Ćićevac
  "Ćićevac", "Đunis", "Roćevci",
  // Varvarin
  "Varvarin", "Donja Krupica",

  // ── ŠUMADIJSKI OKRUG ─────────────────────────────────────────────────────
  // Kragujevac
  "Kragujevac", "Aranđelovac", "Beograd", "Bagrdan",
  "Batočina", "Boljkovci", "Bukovik",
  "Cvetanovac", "Dragobraća",
  "Gruža", "Jovanovac", "Konarevo",
  "Markovac", "Mečkovac", "Orašac",
  "Resnik", "Šumarice",
  // Aranđelovac
  "Aranđelovac", "Banja", "Bukovik",
  "Kopljare", "Orašac", "Progoreoci",
  "Trešnje", "Venčane",
  // Batočina
  "Batočina",
  // Knić
  "Knić", "Bečevica", "Grivac",
  // Lapovo
  "Lapovo",
  // Rača
  "Rača", "Borak", "Viševac",
  // Topola
  "Topola", "Karađorđevo", "Oplenac",

  // ── POMORAVSKI OKRUG ─────────────────────────────────────────────────────
  // Jagodina
  "Jagodina", "Bukovik", "Dobra Voda",
  "Glogovac", "Jablanica",
  "Majur", "Miševića Mahala",
  "Prćilovica", "Šanac",
  // Ćuprija
  "Ćuprija", "Batinac", "Mijatovac",
  "Strigulja",
  // Despotovac
  "Despotovac", "Medveđa", "Miliva",
  "Resavica", "Stenjevac", "Virine",
  // Svilajnac
  "Svilajnac", "Grabovac", "Kušiljevo",
  "Markovac", "Roanda",
  // Paraćin
  "Paraćin", "Klačevica", "Potočac",
  "Sikirica", "Šavac",
  // Rekovac
  "Rekovac", "Bačina", "Lučane",
  "Milutovac",

  // ── BORSKI OKRUG ─────────────────────────────────────────────────────────
  // Bor
  "Bor", "Brestovac", "Donja Bela Reka",
  "Gornjane", "Krivelj", "Oštrelj",
  "Slatina", "Šarbanovac", "Tanda",
  "Topla", "Zlot",
  // Kladovo
  "Kladovo", "Brza Palanka", "Donji Milanovac",
  "Grabovica", "Miroč", "Štrbac",
  // Majdanpek
  "Majdanpek", "Debeli Lug", "Donja Bela Reka",
  "Kučevo", "Mosna",
  // Negotin
  "Negotin", "Bukovče", "Jabukovac",
  "Prahovo", "Radujevac", "Rogljevo",
  "Šarkamen", "Zaječar",

  // ── ZAJEČARSKI OKRUG ─────────────────────────────────────────────────────
  // Zaječar
  "Zaječar", "Bogovina", "Grljan",
  "Halovo", "Leskovac", "Lenovac",
  "Metovnica", "Planinica", "Šljivar",
  "Tabakovac", "Veliki Izvor",
  // Boljevac
  "Boljevac", "Lukovo", "Mali Izvor",
  "Rgotina", "Valakonje",
  // Knjaževac
  "Knjaževac", "Balta Berilovac",
  "Basara", "Donja Kamenica",
  "Gornja Kamenica", "Jakovljevo",
  "Svrljiški Timok", "Toponica",
  // Sokobanja
  "Sokobanja", "Bovaništa",
  "Jošanica", "Resnik",

  // ── BRANIČEVSKI OKRUG ────────────────────────────────────────────────────
  // Požarevac
  "Požarevac", "Braničevo", "Burovac",
  "Dragan", "Klenovnik", "Kličevac",
  "Kostolac", "Lučica", "Petka",
  "Trnovo",
  // Golubac
  "Golubac", "Brodica", "Ram",
  "Usje", "Vinci",
  // Kučevo
  "Kučevo", "Brodica",
  "Rabrovo", "Turija",
  // Malo Crniće
  "Malo Crniće", "Batušnica", "Smoljinac",
  // Petrovac na Mlavi
  "Petrovac na Mlavi", "Burovac",
  "Kamenovo", "Manasija", "Ravniška",
  // Žagubica
  "Žagubica", "Bor", "Sige", "Voluja",
  // Žabari
  "Žabari",
  // Velika Plana
  "Velika Plana", "Dobrovo",
  "Krnjevo", "Lozovik",
  // Smederevo
  "Smederevo", "Drugovac", "Kolari",
  "Lipe", "Lunjevac", "Mihajlovac",
  "Šalinac",
  // Smederevska Palanka
  "Smederevska Palanka", "Azanja",
  "Gložane", "Kusadak", "Mramorak",
  "Progorelica",

  // ── NIŠAVSKI OKRUG ───────────────────────────────────────────────────────
  // Niš
  "Niš", "Donje Međurovo", "Gornje Međurovo",
  "Jelašnica", "Kom", "Malča",
  "Medoševac", "Mezgraja", "Nišor",
  "Prosek", "Trupale",
  // Aleksinac
  "Aleksinac", "Aleksinački Bujmir",
  "Biljeg", "Bukovče",
  "Čukurovac", "Donja Petrušа", "Katun",
  "Moravac", "Mozgovo",
  "Subotinac", "Šurovina",
  // Gadžin Han
  "Gadžin Han", "Gornji Barbеš",
  "Toponica",
  // Doljevac
  "Doljevac", "Klisura", "Orljane",
  // Merošina
  "Merošina", "Gornja Lopušnja",
  // Ražanj
  "Ražanj", "Đunis",
  // Svrljig
  "Svrljig", "Burdimo", "Lozan",

  // ── TOPLIČKI OKRUG ───────────────────────────────────────────────────────
  // Prokuplje
  "Prokuplje", "Beloljin",
  "Bresnica", "Đunis", "Mačkovac",
  "Merćez", "Mršane", "Ploča",
  "Pločnik", "Strojinci",
  // Blace
  "Blace", "Donja Koritnica",
  "Gornja Koritnica",
  // Kuršumlija
  "Kuršumlija", "Bela Voda",
  "Đolovo", "Lukovska Banja",
  "Merdare", "Stara Banja",
  // Žitorađa
  "Žitorađa", "Donja Rasnica",

  // ── PIROTSKI OKRUG ───────────────────────────────────────────────────────
  // Pirot
  "Pirot", "Basara", "Koprivštica",
  "Krupac", "Niševac", "Šugrine",
  // Babušnica
  "Babušnica", "Bela Palanka",
  "Donji Striževac", "Donje Vlase",
  // Bela Palanka
  "Bela Palanka", "Dojkinci",
  // Dimitrovgrad
  "Dimitrovgrad", "Brebevnica",
  "Donji Krivodol",

  // ── JABLANIČKI OKRUG ─────────────────────────────────────────────────────
  // Leskovac
  "Leskovac", "Brza", "Dobro Polje",
  "Grdelica", "Lapotince", "Nošpaljevac",
  "Predejane", "Sijarinska Banja",
  "Strojkovce", "Suva Morava",
  "Turkovce", "Vučje",
  // Bojnik
  "Bojnik", "Brestovo",
  // Crna Trava
  "Crna Trava",
  // Lebane
  "Lebane", "Brestovac", "Donja Lokošnica",
  "Gornja Jajina",
  // Medveđa
  "Medveđa",
  // Vlasotince
  "Vlasotince", "Vilje", "Stajkovce",

  // ── PČINJSKI OKRUG ───────────────────────────────────────────────────────
  // Vranje
  "Vranje", "Bujanovac", "Bunuševo",
  "Gare", "Korbeul", "Staničenje",
  "Toponica", "Vrbovac",
  // Bosilegrad
  "Bosilegrad",
  // Bujanovac
  "Bujanovac", "Levosoje",
  "Muhovac",
  // Preševo
  "Preševo",
  // Surdulica
  "Surdulica", "Vlasina Rid",
  // Vladičin Han
  "Vladičin Han", "Masurče",
  "Stajkovce",
  // Vlasinsko jezero
  "Vlasina",

  // ── Ostalo ───────────────────────────────────────────────────────────────
  "Kopaonik", "Zlatibor", "Fruška Gora",
  "Divčibare", "Tara",

  // ── DOPUNA: sela 500+ stanovnika ─────────────────────────────────────────

  // Vojvodina — Senta opština
  "Tornjoš", "Bogaraš", "Kevi",

  // Vojvodina — Kanjiža opština
  "Adorjan", "Horgoš", "Martonoš", "Male Pijace", "Orom",
  "Torda", "Trešnjevac", "Velebit",

  // Vojvodina — Ada opština
  "Utrine", "Ada Međa",

  // Vojvodina — Čoka opština
  "Jazovo", "Ostojićevo",

  // Vojvodina — Novi Kneževac opština
  "Banatsko Aranđelovo", "Rabe", "Srpski Krstur", "Vojvoda Stepa",

  // Vojvodina — Kikinda opština
  "Banatska Topola", "Iđoš", "Nakovo", "Novi Kozarci", "Rusko Selo", "Sajan",

  // Vojvodina — Nova Crnja opština
  "Banatska Crnja", "Vojvoda Stepa", "Međa", "Srpska Crnja",

  // Vojvodina — Bečej opština
  "Bačko Gradište", "Bačko Petrovo Selo", "Mileševo", "Radičević",

  // Vojvodina — Žabalj opština
  "Čurug", "Đurđevo", "Lok",

  // Vojvodina — Titel opština
  "Gardinovci", "Mošorin", "Vilovo",

  // Vojvodina — Srbobran opština
  "Nadalj", "Turija", "Kucura",

  // Vojvodina — Temerin opština
  "Bački Jarak", "Sirig",

  // Vojvodina — Bač opština
  "Bačko Novo Selo", "Selenča", "Vajska", "Plavna",

  // Vojvodina — Bačka Palanka opština
  "Čelarevo", "Despotovo", "Neštin", "Pivnice", "Silbaš",

  // Vojvodina — Odžaci opština
  "Bogojevo", "Bački Brestovac", "Deronje", "Karavukovo",
  "Lalaš", "Ratkovo",

  // Vojvodina — Apatin opština
  "Kupusina", "Prigrevica", "Sonta", "Svilojevo",

  // Vojvodina — Kula opština
  "Crvenka", "Lipar", "Sivac",

  // Vojvodina — Sombor opština (dopuna)
  "Bački Breg", "Bački Monoštor", "Bezdan",
  "Čonoplja", "Doroslovo", "Gakovo",

  // Vojvodina — Novi Sad opština (sela)
  "Budisava", "Bukovac", "Futog", "Kać", "Kisač",
  "Kovilj", "Ledinci", "Rumenka", "Stepanovićevo", "Veternik",

  // Vojvodina — Beočin opština
  "Lug", "Rakovac", "Sviloš", "Susek",

  // Vojvodina — Zrenjanin opština (dopuna sela)
  "Aradac", "Botoš", "Čenta", "Ečka", "Elemir",
  "Jankov Most", "Knićanin", "Lukićevo", "Melenci",
  "Mihajlovo", "Perlez", "Sakule", "Stajićevo", "Taraš",

  // Vojvodina — Novi Bečej opština
  "Kumane", "Novo Miloševo", "Vranješević",

  // Vojvodina — Žitište opština
  "Banatski Despotovac", "Banatsko Karađorđevo",
  "Hetin", "Ravni Topolovac", "Srpski Itebej", "Torak",

  // Vojvodina — Sečanj opština
  "Boka", "Busur", "Jaša Tomić", "Jarkovac", "Sutjeska",

  // Vojvodina — Pančevo opština (sela)
  "Banatsko Novo Selo", "Dolovo", "Glogonj",
  "Jabuka", "Kačarevo", "Omoljica", "Starčevo",

  // Vojvodina — Alibunar opština
  "Banatski Karlovac", "Dobrica",
  "Ilandža", "Janošik", "Locve", "Nikolinci",
  "Seleuš", "Vladimirovo",

  // Vojvodina — Kovin opština
  "Bavanište", "Deliblato", "Gaj",
  "Mramorak", "Šumarak",

  // Vojvodina — Kovačica opština
  "Crepaja", "Debeljača", "Idvor",
  "Padina", "Uzdin",

  // Vojvodina — Bela Crkva opština
  "Banatska Palanka", "Dupljaja", "Jasenovo", "Kajtasovo",
  "Kruščica", "Kusić",

  // Vojvodina — Vršac opština (sela)
  "Gudurica", "Izbište", "Jablanka",
  "Markovac", "Mesić",
  "Orešac", "Partoš", "Pavliš", "Potporanj",
  "Vlajkovac",

  // Vojvodina — Plandište opština
  "Barice", "Jermenovci",
  "Stari Lec", "Veliko Središte",

  // Vojvodina — Sremska Mitrovica opština (sela)
  "Bešenovo", "Čalma", "Divoš",
  "Grgurevci", "Laćarak", "Manđelos",
  "Martinci", "Noćaj", "Ravnje",
  "Salašinci", "Zasavica",

  // Vojvodina — Ruma opština (sela)
  "Buđanovci", "Donji Petrovci", "Grabovci",
  "Hrtkovci", "Klenak", "Kraljevci", "Nikinci",
  "Platičevo", "Stejanovci", "Žarkovac",

  // Vojvodina — Šid opština (sela)
  "Adaševci", "Bačinci", "Batrovci",
  "Berkasovo", "Bingula", "Erdevik", "Gibarac",
  "Ilinci", "Jamena", "Kukujevci",
  "Ljuba", "Molovin", "Morović",
  "Privina Glava", "Sot", "Vašica",

  // Vojvodina — Inđija opština (sela)
  "Beška", "Čortanovci", "Krčedin", "Maradik",
  "Novi Slankamen", "Popinci", "Stari Slankamen",

  // Vojvodina — Irig opština (sela)
  "Grgeteg", "Jazak", "Krušedol Prnjavor",
  "Mala Remeta", "Neradin", "Rivica", "Šatrinci", "Vrdnik",

  // Vojvodina — Stara Pazova opština (sela)
  "Belegiš", "Golubinci",
  "Novi Banovci", "Putinci",

  // Vojvodina — Pećinci opština (sela)
  "Ašanja", "Kupinovo", "Obrež", "Šimanovci",

  // Mačvanski okrug — sela
  // Šabac opština
  "Bela Reka", "Bogosavac", "Drenovac",
  "Dublje", "Glušci", "Jevremovac",
  "Lipolist", "Majur",
  "Orašac", "Petlovača", "Prnjavor", "Ribari",
  "Skiropoj", "Tabanovići", "Uzveće",
  // Bogatić opština
  "Banovo Polje", "Belotić", "Crna Bara",
  "Glogovac", "Salaš Noćajski",
  "Sovljak", "Štitar",
  // Loznica opština
  "Banja Koviljača", "Brezjak",
  "Donja Badanja", "Donji Dobrić",
  "Gornja Badanja", "Gornji Dobrić",
  "Lipnica", "Petnica", "Pilica",
  "Trešnjevica", "Tršić",
  // Ljubovija opština
  "Gornja Ljuboviđa", "Postenje",

  // Kolubarski okrug — sela
  // Valjevo opština
  "Brangović", "Brežđe", "Divčibare",
  "Donji Taor", "Grabovica", "Klinci", "Kotešica",
  "Lelić", "Pambukovica", "Pričević",
  "Ručić", "Stepanje",
  // Osečina opština
  "Bratačić", "Dragijevica",
  // Ub opština
  "Brgule", "Kalenić",

  // Zlatiborski okrug — sela
  // Užice opština
  "Bioska", "Goračići", "Krčagovo",
  "Sevojno", "Turica",
  // Čajetina opština
  "Kremna", "Sirogojno",
  // Bajina Bašta opština
  "Bačevci", "Oskoruša", "Perućac",
  // Nova Varoš opština
  "Akmačići", "Kokin Brod",
  "Negbina", "Radoinja", "Zlatar",
  // Prijepolje opština
  "Brodarevo", "Mileševo",

  // Moravički okrug — sela
  // Čačak opština
  "Bresnica", "Gornja Gorevnica",
  "Kablar", "Konjevići",
  "Mrčajevci", "Preljina", "Prislonica",
  "Trbušica", "Trnavci",
  // Gornji Milanovac opština
  "Brđani", "Rudnik",

  // Raški okrug — sela
  // Kraljevo opština
  "Adrani", "Goč", "Jošanička Banja",
  "Mataruška Banja", "Milatkovići", "Ribnica",
  "Rudan", "Ušće",
  // Raška opština
  "Biljanovac", "Bogutovac", "Brvenica",
  // Vrnjačka Banja opština
  "Gokčanica", "Lipova",
  // Aleksandrovac opština
  "Župa", "Rujišta",

  // Rasinski okrug — sela
  // Kruševac opština
  "Bojanine vode",
  "Dedina", "Globoder", "Jakovljevo",
  "Jasika", "Kukljin", "Laćinak",
  "Lipovica", "Nišević",
  "Parunovac", "Pepeljevac",
  "Srnje", "Strojinci",
  "Velika Drenova",
  // Trstenik opština
  "Bela Voda", "Bošnjane",
  "Grabovac", "Lozovik", "Milutovac",

  // Šumadijski okrug — sela
  // Kragujevac opština
  "Boljkovci", "Bukovik",
  "Dragobraća",
  "Gruža", "Jovanovac", "Konarevo",
  "Šumarice",
  // Aranđelovac opština
  "Banja", "Kopljare",
  "Orašac", "Progoreoci",
  "Trešnje", "Venčane",
  // Topola opština
  "Oplenac",

  // Pomoravski okrug — sela
  // Jagodina opština
  "Dobra Voda",
  "Glogovac", "Jablanica",
  "Majur",
  "Prćilovica", "Šanac",
  // Despotovac opština
  "Miliva", "Resavica", "Stenjevac", "Virine",
  // Paraćin opština
  "Klačevica", "Potočac",
  "Sikirica", "Šavac",

  // Borski okrug — sela
  // Bor opština
  "Brestovac", "Donja Bela Reka",
  "Gornjane", "Krivelj", "Oštrelj",
  "Šarbanovac", "Tanda", "Topla", "Zlot",
  // Kladovo opština
  "Brza Palanka", "Donji Milanovac",
  "Miroč", "Štrbac",
  // Majdanpek opština
  "Debeli Lug", "Mosna",
  // Negotin opština
  "Bukovče", "Jabukovac",
  "Prahovo", "Radujevac", "Rogljevo",
  "Šarkamen",

  // Zaječarski okrug — sela
  // Zaječar opština
  "Bogovina", "Grljan",
  "Halovo", "Lenovac",
  "Metovnica", "Planinica", "Šljivar",
  "Tabakovac", "Veliki Izvor",
  // Boljevac opština
  "Lukovo", "Mali Izvor",
  "Rgotina", "Valakonje",
  // Knjaževac opština
  "Balta Berilovac",
  "Donja Kamenica",
  "Gornja Kamenica",
  "Toponica",
  // Sokobanja opština
  "Bovaništa", "Jošanica",

  // Braničevski okrug — sela
  // Požarevac opština
  "Braničevo", "Burovac",
  "Klenovnik", "Kličevac",
  "Kostolac", "Lučica", "Trnovo",
  // Golubac opština
  "Brodica", "Ram", "Usje", "Vinci",
  // Petrovac na Mlavi opština
  "Kamenovo", "Manasija", "Ravniška",
  // Žagubica opština
  "Sige", "Voluja",
  // Velika Plana opština
  "Dobrovo", "Krnjevo", "Lozovik",
  // Smederevo opština
  "Drugovac", "Kolari",
  "Lipe", "Lunjevac", "Mihajlovac", "Šalinac",
  // Smederevska Palanka opština
  "Azanja", "Gložane", "Kusadak",
  "Progorelica",

  // Nišavski okrug — sela
  // Niš opština
  "Donje Međurovo", "Gornje Međurovo",
  "Jelašnica", "Kom", "Malča",
  "Medoševac", "Mezgraja", "Nišor",
  "Prosek", "Trupale",
  // Aleksinac opština
  "Aleksinački Bujmir",
  "Biljeg", "Bukovče",
  "Čukurovac", "Donja Petrušа", "Katun",
  "Moravac", "Mozgovo",
  "Subotinac", "Šurovina",
  // Svrljig opština
  "Burdimo", "Lozan",

  // Toplički okrug — sela
  // Prokuplje opština
  "Beloljin",
  "Bresnica", "Đunis", "Mačkovac",
  "Merćez", "Mršane", "Ploča",
  "Pločnik",
  // Kuršumlija opština
  "Bela Voda", "Đolovo", "Lukovska Banja",
  "Merdare", "Stara Banja",

  // Pirotski okrug — sela
  // Pirot opština
  "Koprivštica", "Krupac", "Niševac", "Šugrine",
  // Babušnica/Bela Palanka
  "Donji Striževac", "Donje Vlase",
  "Dojkinci",
  // Dimitrovgrad opština
  "Brebevnica", "Donji Krivodol",

  // Jablanički okrug — sela
  // Leskovac opština
  "Brza", "Dobro Polje",
  "Grdelica", "Lapotince", "Nošpaljevac",
  "Predejane", "Sijarinska Banja",
  "Strojkovce", "Turkovce", "Vučje",
  // Lebane opština
  "Brestovac", "Donja Lokošnica",
  "Gornja Jajina",
  // Vlasotince opština
  "Vilje", "Stajkovce",

  // Pčinjski okrug — sela
  // Vranje opština
  "Bunuševo", "Gare", "Korbeul",
  "Staničenje", "Toponica", "Vrbovac",
  // Surdulica opština
  "Vlasina Rid",
  // Vladičin Han opština
  "Masurče",

  // ══════════════════════════════════════════════════════════════════════════
  // BAČKA — KOMPLETAN POPIS NASELJENIH MESTA (svi okruzi sa bačkim opštinama)
  // Severnobački + Zapadnobački + bačke opštine Južnobačkog okruga.
  // Izvor: zvanična naseljena mesta po opštinama (popis), sr. latinica.
  // ══════════════════════════════════════════════════════════════════════════

  // ── SEVERNOBAČKI OKRUG ───────────────────────────────────────────────────
  // Grad Subotica (19)
  "Subotica", "Bajmok", "Bački Vinogradi", "Bačko Dušanovo", "Bikovo",
  "Višnjevac", "Gornji Tavankut", "Donji Tavankut", "Đurđin", "Kelebija",
  "Ljutovo", "Mala Bosna", "Mišićevo", "Novi Žednik", "Palić",
  "Stari Žednik", "Hajdukovo", "Čantavir", "Šupljak",
  // Opština Bačka Topola
  "Bačka Topola", "Bagremovo", "Bajša", "Bački Sokolac", "Gornja Rogatica",
  "Gunaroš", "Zobnatica", "Karađorđevo", "Kavilo", "Krivaja",
  "Mali Beograd", "Mićunovo", "Novo Orahovo", "Njegoševo", "Obornjača",
  "Pačir", "Panonija", "Pobeda", "Svetićevo", "Stara Moravica", "Tomislavci",
  // Opština Mali Iđoš (3)
  "Mali Iđoš", "Lovćenac", "Feketić",

  // ── ZAPADNOBAČKI OKRUG ───────────────────────────────────────────────────
  // Grad Sombor (16)
  "Sombor", "Aleksa Šantić", "Bački Breg", "Bački Monoštor", "Bezdan",
  "Gakovo", "Doroslovo", "Kljajićevo", "Kolut", "Rastina",
  "Riđica", "Svetozar Miletić", "Stanišić", "Stapar", "Telečka", "Čonoplja",
  // Opština Apatin (5)
  "Apatin", "Kupusina", "Prigrevica", "Svilojevo", "Sonta",
  // Opština Kula (7)
  "Kula", "Kruščić", "Lipar", "Nova Crvenka", "Ruski Krstur", "Sivac", "Crvenka",
  // Opština Odžaci (9)
  "Odžaci", "Bački Brestovac", "Bački Gračac", "Bogojevo", "Deronje",
  "Karavukovo", "Lalić", "Ratkovo", "Srpski Miletić",

  // ── JUŽNOBAČKI OKRUG (bačke opštine) ─────────────────────────────────────
  // Grad Novi Sad — bačka naseljena mesta (11)
  "Novi Sad", "Begeč", "Budisava", "Veternik", "Kać", "Kisač",
  "Kovilj", "Rumenka", "Stepanovićevo", "Futog", "Čenej",
  // Opština Bač (6)
  "Bač", "Bačko Novo Selo", "Bođani", "Vajska", "Plavna", "Selenča",
  // Opština Bačka Palanka (14)
  "Bačka Palanka", "Vizić", "Gajdobra", "Despotovo", "Karađorđevo",
  "Mladenovo", "Nova Gajdobra", "Obrovac", "Parage", "Pivnice",
  "Silbaš", "Tovariševo", "Čelarevo", "Neštin",
  // Opština Bački Petrovac (4)
  "Bački Petrovac", "Gložan", "Kulpin", "Maglić",
  // Opština Bečej (5)
  "Bečej", "Bačko Gradište", "Bačko Petrovo Selo", "Mileševo", "Radičević",
  // Opština Vrbas (7)
  "Vrbas", "Bačko Dobro Polje", "Zmajevo", "Kosančić", "Kucura",
  "Ravno Selo", "Savino Selo",
  // Opština Žabalj (4)
  "Žabalj", "Gospođinci", "Đurđevo", "Čurug",
  // Opština Srbobran (3)
  "Srbobran", "Nadalj", "Turija",
  // Opština Temerin (3)
  "Temerin", "Bački Jarak", "Sirig",
  // Opština Titel (6)
  "Titel", "Vilovo", "Gardinovci", "Lok", "Mošorin", "Šajkaš",
  // ── Naselja iz izvoza JISP-a (2025/2026) ────────────────────────────────
  // Sedišta osnovnih škola kojih nije bilo u popisnom spisku iznad — uglavnom
  // sela i prigradska naselja. Dodata su zato što škola čije mesto ne pogađa
  // nijedno naselje tiho ispada iz svega što se kači na lokaciju, a na listi
  // škola i dalje stoji (vidi `scripts/uvezi-skole.mjs`).
  //
  // 🔴 Ovaj blok širi zatečeni obim spiska: gornji deo je popis 2022 BEZ KiM, a
  // ovde su i naselja sa Kosova i Metohije u kojima radi srpski obrazovni sistem
  // (Kosovska Mitrovica, Banjska, Babin Most i druga). Bez njih te škole ne bi
  // mogle ni da uđu u šifarnik, pa ni deca iz njih da izaberu svoju školu.
  //
  // 🟡 Nova naselja NEMAJU koordinate u `naselja-koordinate.ts`, pa im udaljenost
  // na Pijaci ostaje neizračunata dok se koordinate ne dopune. Ništa ne puca —
  // `koordinateZaMesto` vraća null, kao i za druga naselja bez koordinata.
  "Aleksandrovo", "Aleksinački Rudnik", "Babin Most", "Badovinci", "Baljevac", "Banatski Brestovac",
  "Banatsko Veliko Selo", "Banjani", "Banjska", "Bare", "Bašaid", "Belanovica", "Beli Potok",
  "Belo Blato", "Belo Polje", "Belosavci", "Belušić", "Bečmen", "Biljača", "Bivolje",
  "Blaževo", "Bobova", "Bogojevce", "Borča", "Bostane", "Bočar", "Bošnjace", "Božetići",
  "Boževac", "Božica", "Bradarac", "Brankovina", "Bratljevo", "Brekovo", "Brezova",
  "Brnjak", "Brod", "Brzi Brod", "Bunar", "Cerevajka", "Cernica", "Cerovac", "Crkolez",
  "Crkvena Vodica", "Crkvine", "Crnotince", "Crvena Reka", "Darosava", "Debrc", "Dedevci",
  "Delimeđe", "Desimirovac", "Devići", "Deževa", "Divci", "Donja Borina", "Donja Brnjica",
  "Donja Gušterica", "Donja Lopušnja", "Donja Mutnica", "Donja Trepča", "Donja Trnava",
  "Donja Šatornja", "Donje Leskovice", "Donji Bučumet", "Donji Krčin", "Donji Ribnik",
  "Donji Stajevac", "Dragaš", "Draginac", "Dračić", "Dubovac", "Duga Poljana", "Dušanovac",
  "Dvorane", "Džep", "Farkaždin", "Gabrovac", "Glibovac", "Godačica", "Gojbulja",
  "Golobok", "Goraždevac", "Gornja Rapča", "Gornja Trnava", "Gornje Kusce", "Gornji Matejevac",
  "Gornji Prisjan", "Gornji Stepoš", "Gotovuša", "Grace", "Gračanica", "Grebenac",
  "Grošnica", "Guča (varošica)", "Hajdučica", "Hum", "Istočni Mojstir", "Ivanje",
  "Ivanovo", "Jadranska Lešnica", "Janjevo", "Jasenovik", "Kamenica", "Kaona", "Karan",
  "Kasidoli", "Katići", "Kladnica", "Klek", "Klenike", "Klenje", "Klokot", "Klupci",
  "Kobišnica", "Kololeč", "Konak", "Konjuh", "Korbevac", "Korbovo", "Koretište",
  "Kosovo Polje", "Kosovska Kamenica", "Kosovska Mitrovica", "Kostojevići", "Kovačevac",
  "Kovilje", "Krajišnik", "Kratovo", "Krepoljin", "Krupanj", "Kruševo", "Kuzmin",
  "Kušići", "Kuštilj", "Laplje Selo", "Latvica", "Laznica", "Lađevci", "Lece", "Lepina",
  "Leposavić", "Leskova", "Lešak", "Lešnica", "Lipljan", "Lipnički Šor", "Ljuberađa",
  "Lokve", "Loćika", "Lugavčina", "Lukare", "Majilovac", "Mala Krsna", "Mala Plana",
  "Mali Jasenovac", "Manojlovce", "Maršić", "Mačkat", "Melnica", "Metlić", "Međurečje",
  "Miljkovac", "Miloševac", "Miratovac", "Miroševce", "Mokrin", "Mudrakovac", "Natalinci",
  "Nesalce", "Neuzina", "Niška Banja", "Novi Karlovci", "Novo Selo", "Obilić", "Orahovac",
  "Oraovica", "Oreškovica", "Orlovat", "Osaonica", "Osipaonica", "Osojane", "Ostružnica",
  "Ovča", "Padež", "Padinska Skela", "Paralovo", "Parteš", "Pasjane", "Pecka", "Petrovaradin",
  "Pečenjevce", "Plažane", "Plemetina", "Pločica", "Podgorac", "Podujevo", "Podvrška",
  "Popovac", "Požega", "Pranjani", "Prekovce", "Prijevor", "Prilužje", "Radalj",
  "Radinac", "Radljevo", "Radojevo", "Radovnica", "Rajac", "Rajince", "Rajković",
  "Rajčinoviće", "Ralja", "Ranilović", "Ranilug", "Ranovac", "Rataje", "Ratari",
  "Razbojna", "Rašanac", "Raždaginja", "Reljan", "Restelica", "Ribare", "Ribariće",
  "Ripanj", "Rogačica", "Rudna Glava", "Rušanj", "Salaš", "Samaila", "Samoš", "Sedlare",
  "Selevac", "Seljašnica", "Sevce", "Sirča", "Sićevo", "Skobalj", "Skorenovac", "Skržuti",
  "Sočanica", "Srednjevo", "Sremska Kamenica", "Sremčica", "Stalać", "Stari Banovci",
  "Stojnik", "Stopanja", "Stragari", "Strelac", "Strezovce", "Stubal", "Sumrakovac",
  "Supnje", "Sušica", "Svođe", "Tegošnica", "Tekeriš", "Tekija", "Tibužde", "Tomaševac",
  "Trgovište", "Trnjane", "Tubravić", "Tulare", "Tupale", "Turekovac", "Ugljare",
  "Uljma", "Umka", "Umčari", "Urovica", "Varda", "Velika Grabovnica", "Velika Greda",
  "Velika Hoča", "Velika Krsna", "Velika Moštanica", "Velika Reka", "Veliki Crljeni",
  "Veliki Kupci", "Veliki Popović", "Veliki Trnovac", "Veliki Šiljegovac", "Veliko Bonjince",
  "Veliko Gradište", "Veliko Laole", "Veliko Ropotovo", "Veliko Trnjane", "Vinarce",
  "Vitanovac", "Vitina", "Vitkovac", "Vitoševac", "Viča", "Vladimirovac", "Vlajkovci",
  "Vlaole", "Vlase", "Vlasina Okruglica", "Vodanj", "Vojka", "Vojska", "Vraneši",
  "Vranište", "Vranjska Banja", "Vranovo", "Vračev Gaj", "Vražogrnac", "Vrba", "Vrnjci",
  "Vrtogoš", "Vrčin", "Zablaće", "Zubin Potok", "Zupče", "Zvečan", "Zvonce", "Čibutkovica",
  "Čitluk", "Čokot", "Čumić", "Šetonje", "Šilovo", "Šišave", "Štavalj", "Štrpce",
  "Štubik", "Žabare", "Žbevac", "Žerovnica", "Žitkovac", "Žitni Potok", "Preoce", "Stanišor", "Žiča",
];

// Dedupliciraj i sortiraj po abecedi (srpska latinica)
export const NASELJA_SRBIJE: string[] = [...new Set(RAW)].sort((a, b) =>
  a.localeCompare(b, "sr-Latn", { sensitivity: "base" })
);
