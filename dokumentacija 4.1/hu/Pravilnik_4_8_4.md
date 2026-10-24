> **Nem hivatalos fordítás.** A magyar változat kizárólag a könnyebb megértés célját szolgálja. Jogilag a szerb eredeti szöveg kötelező érvényű; bármilyen eltérés esetén a szerb változat az irányadó.

# Szabályzat a KOLO rendszerről

*A KOLO a kölcsönös támogatás rendszere, amely azon a gondolaton alapul, hogy az emberek nyilvántartásba vehetik, mivel járulnak hozzá egymáshoz és a közösséghez. E szabályzat rendezi, hogyan működik ez a rendszer: kik a szereplői, mi az a közjó, amelyet együtt építenek, hogyan kerül nyilvántartásba a hozzájárulás, és hogyan születnek a döntések. A szabályzat kötelező érvényű aktus, amelynek rendelkezései a felhasználók jogait és kötelezettségeit rendezik.*

## I — Általános rendelkezések

### 1. cikk

E szabályzat rendezi a rendszer alapfogalmait, szerkezetét és működési szabályait, mégpedig:

— a közjót mint a rendszer célját — annak fogalmát, tartalmát, licencelését és a hozzájárulás szabályait — valamint a rendszer szereplőit és eszközeit: a KOLO Alapítványt, a KOLO Protokollt és a KOLO Közösséget;

— a POEN-t és a hozzájárulás nyilvántartását;

— a ZRNO-t, az elszámolási együtthatót és a rendszer elszámolási keretét;

— a felhasználói jogállásokat és a valóságbizonyítékot;

— a közjóhoz való hozzájárulást — az alapítói, pénzügyi, működési hozzájárulást és a pártfogást;

— a rendszer fejlődési szakaszait és a rendszer irányítását;

— a rendszer moduljait;

— az átláthatóságot és a személyes adatok védelmét;

— a KOLO rendszer jogi természetét és szerkezeti korlátait;

— a felhasználók felelősségét és kockázatait, valamint a jogviták rendezését;

— e szabályzat módosítását és a származtatott aktusok rendszerét.

E szabályzat a felsorolt területeket kereti szinten rendezi. A részletes paraméterek, táblázatok, eljárások és működési mechanika külön szabályzatokban kerülnek megállapításra, amelyek erre az aktusra hivatkoznak.

A platformhoz való hozzáférés szabályait, a javak és szolgáltatások cseréjére szolgáló tér használatát és a platform technikai használatának egyéb kérdéseit a Felhasználási feltételek rendezik.

### 2. cikk

E szabályzatban az egyes kifejezések a következő jelentéssel bírnak:

**KOLO rendszer** — a közjó részvételi rendszere; olyan funkcionális egész, amelyet a közjó, a rendszer szereplői és eszközei, valamint a felhasználók alkotnak, és amely a közjóhoz való hozzájárulás és az abban való részvétel nyilvántartása céljából szerveződik. A KOLO rendszer nem jogi személy, sem külön jogi kategória.

**Közjó** — valamennyi felhasználó kollektív java; a KOLO rendszer célja. Alkotja a rendszer szoftvere, a rendszer szabályai, a hozzájárulás és a részvétel nyilvántartása, valamint a rendszerben keletkezett tartalom.

**KOLO Alapítvány (Alapítvány)** — a zálogalapokról és alapítványokról szóló törvény alapján létrehozott nonprofit magánjogi személy, zombori (Sombor) székhellyel; a rendszer jogi eszköze, amely őrzi a közjót, de nem tulajdonosa annak.

**KOLO Protokoll (Protokoll)** — a közjó technikai mechanizmusa, amely vezeti a nyilvántartást, kiszámítja az elszámolási együtthatót és alkalmazza a rendszer szabályait; nem rendelkezik jogalanyisággal.

**KOLO Közösség (Közösség)** — leíró fogalom a rendszer felhasználóinak összességére; nem jogi személy, és nem hoz döntéseket.

**Alaprendszer** — a KOLO rendszer elemeinek minimális köre, amely a működés kezdetétől fogva működik; magában foglalja a közjót, a Protokollt, az Alapítványt, a Közösséget, a felhasználókat, a POEN-t, a ZRNO-t, az elszámolási együtthatót, a valóságbizonyítékot és a hozzájárulás nyilvántartásba vételének csatornáit.

**Modul** — olyan bővítmény, amely funkcionalitást ad az alaprendszerhez anélkül, hogy megváltoztatná; saját előfeltételei szerint aktiválódik.

**POEN** — a rendszer belső elszámolási egysége; a Protokoll nyilvántartásában szereplő bejegyzés, amellyel a közjóhoz való hozzájárulás és az abban való részvétel egyéb formái kerülnek nyilvántartásba.

**ZRNO** — a rendszer belső elszámolási egysége, amellyel a Protokoll nyilvántartásában a felhasználó közjóban elfoglalt helyzete kerül nyilvántartásba.

**Elszámolási együttható** — a nyilvántartásba vett POEN-ek teljes számának és a Protokollban a beírásra rendelkezésre álló ZRNO-k számának számszerű aránya.

**Elszámolási időszak** — az az időintervallum, amelynek végén a Protokoll kiszámítja az elszámolási együtthatót, és alkalmazza a ZRNO beírásának és leírásának, valamint a ZRNO állapotváltozásainak szabályait.

**Zéró összegű invariáns** — a rendszer azon tulajdonsága, amely szerint valamennyi POEN-bejegyzés összege, ideértve a Protokoll bejegyzését is, minden pillanatban nulla.

**Valóságbizonyíték** — a felhasználók hitelesítésének személyes ismeretségen vagy hívást követő beszélgetésen alapuló modellje, amellyel a felhasználó valódisága és folytonossága nyer megerősítést. Az egyediség — egy személy, egy fiók — hitelesítéssel nem nyer megerősítést: az a Felhasználási feltételekben foglalt tilalom, a többszörös fiókot pedig az Alapítvány állapítja meg a valóságbizonyítékról szóló szabályzat szerint.

**Megerősítési lánc** — a valóságbizonyíték azon mechanizmusa, amelyben a Kolo-tagok megerősítik azoknak a felhasználóknak a valódiságát, akiket személyesen ismernek, illetve telefonos beszélgetést követően bevezetik a Kolóba a hívási listán szereplő felhasználókat, a megerősítés nélküli tagok pedig bevezetik a Kolóba azokat a felhasználókat, akiket személyesen ismernek.

**Megerősítés** — az a hitelesítés, amellyel a Kolo-tag, illetve az alapító megerősíti annak a felhasználónak a valódiságát, akit személyesen ismer, a valóságbizonyítékról szóló szabályzattal összhangban. Megerősítésnek nevezzük azt a cselekményt is, amellyel a Kolo-tag, illetve az alapító megerősíti azt a megerősítés nélküli tagot, akit személyesen ismer, valamint az a cselekmény, amellyel egy Kolo-őrző telefonos beszélgetést követően megerősíti; ez nem új hitelesítés (28a. cikk).

**Bevezetés a Kolóba** — az a hitelesítés, amellyel a Kolo-tag telefonos beszélgetést követően bevezeti a Kolóba a hívási listán szereplő felhasználót, illetve amellyel a megerősítés nélküli tag bevezeti a Kolóba azt a felhasználót, akit személyesen ismer. A bevezetés a Kolóba a valóságbizonyítékról szóló szabályzat értelmében vett hitelesítés; a valóságért való felelősség és a POEN nyilvántartásba vétele ugyanaz, mint a megerősítésnél.

**Felhasználó** — minden személy, aki fiókkal rendelkezik a platformon, jogállásától függetlenül. Ez egyben a jogszabályok értelmében vett szolgáltatást igénybe vevő is. A felhasználó gyermek, résztvevő vagy, ha egyik sem, csak felhasználó: a Kolóban nem lévő nagykorú felhasználó felhasználói jogállású. A gyermek helyzetét a gyermekek részvételéről szóló szabályzat rendezi.

**Megerősítés nélküli tag** — az a nagykorú felhasználó, akit valaki bevezetett a Kolóba, de akit még nem erősített meg őt személyesen ismerő Kolo-tag. A megerősítés nélküli tag a Kolóhoz tartozik; a Kolóhoz való tartozás nem tagság az Alapítványban. A résztvevő jogaival és kötelezettségeivel rendelkezik. Az Alapítvány aktusainak a Kolo-tagra, illetve a megerősített felhasználóra vonatkozó rendelkezései rá nem alkalmazandók, kivéve, ha az aktus kifejezetten másként rendelkezik.

**Kolo-tag** — az a felhasználó, akinek valódiságát a megerősítési láncban megerősítéssel erősítették meg, a valóságbizonyítékról szóló szabályzattal összhangban. Megerősített felhasználó csak a Kolo-tag, ideértve a Kolo-őrzőt és az alapítót is; a megerősítettség határozza meg a mások valóságának megerősítésére való jogot és azokat az egyéb jogokat, amelyeket az Alapítvány aktusai a Kolo-taghoz kötnek.

**Kolo-őrző** — az a Kolo-tag, akinek a Protokollban ZRNO-t írtak be. Az a megerősítés nélküli tag, akinek ZRNO-t írtak be, nem Kolo-őrző.

**Alapítók** — a kezdeti Kolo-őrzők, akiket a valóságbizonyítékról szóló szabályzat 14. cikke alapján jelöltek ki (82. cikk). E fogalom különbözik az Alapítvány alapítójától és az alapítói hozzájárulásról szóló szabályzat értelmében vett alapítóktól (37. cikk).

**Kolo** — azoknak a felhasználóknak a köre, akiknek a megerősítési láncban érvényes hitelesítés van nyilvántartva: a megerősítés nélküli tagok, a Kolo-tagok és a Kolo-őrzők. A Kolo nem jogi személy, és a Kolóhoz való tartozás nem tagság sem az Alapítványban, sem más jogi személyben.

**Résztvevő** — az a felhasználó, akinek a megerősítési láncban érvényes hitelesítés van nyilvántartva, akár megerősítéssel, akár a Kolóba való bevezetéssel: a megerősítés nélküli tag, a Kolo-tag és a Kolo-őrző, valamint az alapító. A hitelesítés határozza meg a rendszer funkcióihoz való hozzáférést. A „résztvevő” kifejezés e módosítástól kezdve csak azt jelöli, aki a Kolóban van, és a korábbi „Kolo-beli résztvevő”, illetve „hitelesített résztvevő” kifejezést váltja fel. Ahol az e módosítás előtt elfogadott aktus jogállástól függetlenül résztvevőről szól, felhasználót kell érteni, ahol pedig a felhasználóról mint jogállásról szól, a Kolóban nem lévő felhasználót kell érteni.

**Álnév** — az a fióknév, amely alatt a felhasználó látható a rendszerben és a nyilvános nyilvántartásban.

**Alapítói hozzájárulás** — a platform megnyitása előtt végzett munka, amelynek hozzájárulása utólag kerül nyilvántartásba POEN-ben; egyszeri és időben korlátozott.

**Pénzügyi hozzájárulás** — dináros bevétel az Alapítványba természetes személyek adományai, valamint jogi személyek, obrtnikok (egyéni vállalkozók) és bejegyzett mezőgazdasági termelő gazdaságok birtokosainak pártfogása alapján.

**Működési hozzájárulás** — a platformon kívüli tevékenység, amelynek hozzájárulása a végrehajtás hitelesítését követően kerül nyilvántartásba POEN-ben.

**Pártfogó** — az a jogi személy vagy egyéni vállalkozó, amely pénz, áru vagy szolgáltatás adományozásával támogatja az Alapítvány működését, valamint a bejegyzett mezőgazdasági termelő gazdaság birtokosa, aki pénz adományozásával vagy áruval és szolgáltatással nyújtott pártfogással támogatja az Alapítvány működését; nem felhasználója a rendszernek, és nem kap sem POEN-t, sem ZRNO-t.

**Automatikus nyilvántartásba vétel** — a POEN nyilvántartásba vétele a Protokoll automatikus aktusaként, amely a rendszer szabályai szerint hajtódik végre, bármely szereplő mérlegelési döntése nélkül.

**Kör (Krug)** — a rendszer szervezeti egysége, amely közös érdeken vagy tevékenységen alapul; nem rendelkezik jogalanyisággal.

**Szövetkezet** — a rendszer helyi szervezeti egysége területi elven, a szövetkezetekről szóló törvény szerint bejegyezve; teljes jogalanyisággal rendelkezik.

**Kollektív formák** — a rendszer azon szervezeti egységeinek gyűjtőneve, amelyek a felhasználókat tartósabb szerkezetekbe kapcsolják: a Körök és a Szövetkezetek.

**Felső Kolo** — a rendszer irányító testülete, amelyet a ZRNO-t aktivált Kolo-őrzők alkotnak; dönt a rendszer szabályairól.

**Igazgatótanács** — a KOLO Alapítvány testülete, amelynek összetételét, megbízatását és hatáskörét az Alapszabály rendezi.

**Védelmi vétó** — az Alapítvány joga, hogy megtagadja a Felső Kolo olyan határozatának végrehajtását, amely veszélyeztetné az Alapítvány működési és pénzügyi fenntarthatóságát a pénzügyi önállóság elérése előtt.

**Négyzetes szavazás** — a Felső Kolo döntéshozatali mechanizmusa, amelyben a szavazati erő az aktív ZRNO-k számából vont négyzetgyök egész értékével egyenlő.

**Whitepaper** — a KOLO rendszert leíró koncepcionális és nyilvános dokumentum.

Az e cikkben nem meghatározott kifejezések a szabályzat megfelelő fejezeteiben vagy a külön szabályzatokban megállapított jelentéssel bírnak.

### 3. cikk

E szabályzat a KOLO rendszer ernyőjellegű működési aktusa. A külön szabályzatoknak és egyéb származtatott aktusoknak összhangban kell lenniük e szabályzattal.

E szabályzatot a KOLO Alapítvány Igazgatótanácsa fogadja el és módosítja, az e szabályzatban külön rendezett eljárás szerint.

A rendszer nyelve a szerb.

## II — A közjó, a szereplők és az eszközök

### 4. cikk

A KOLO rendszert három elem alkotja: a közjó mint az, amit a felhasználók megosztanak és amihez hozzájárulnak; az Alapítvány mint jogi eszköz, amely biztosítja a rendszer működésének feltételeit; és a Protokoll mint szoftver, amely vezeti a nyilvántartást és alkalmazza a szabályokat. A felhasználók alkotják a Közösséget, de a Közösség nem testület és nem jogi személy — a rendszer irányításában való részvétel a Felső Kolón keresztül valósul meg, e szabályzattal összhangban.

Ez a fejezet rendezi ezen elemek mindegyikét: mi a közjó és milyen feltételek mellett használható, mit tesz az Alapítvány és mit nem tehet, mire képes a Protokoll és mitől van megfosztva.

### 5. cikk

A közjó a KOLO rendszer célja. Alkotja a rendszer szoftvere, a rendszer szabályai, a hozzájárulás és a részvétel nyilvántartása, valamint a rendszerben keletkezett tartalom.

A közjó valamennyi felhasználó kollektív java. Egyetlen felhasználónak, sem az Alapítvány alapítójának, sem az Alapítványnak nincs tulajdonjoga a közjó felett, sem joga rendelkezni vele.

A közjó nem minősül kollektív tulajdonnak a hatályos vagyonjogi kategóriák értelmében. A felhasználók közjóhoz fűződő viszonya részvételi jellegű — a használat és a hozzájárulás joga, nem a rendelkezés joga.

A közjó kollektív jellegét a közjó licencei, az Alapítvány jogi szerkezete — amely a közjót őrzi, de nem tulajdonosa annak — és a rendszer négy elve biztosítja.

### 6. cikk

Az az infrastruktúra, amelyen a rendszer működik — kiszolgálók, adatbázisok, hálózati berendezések és egyéb technikai erőforrások — nem alkotórésze a közjónak. A nyilvántartás mint bejegyzés és a tartalom a közjóhoz tartozik; az adatbázis mint tárolóközeg az infrastruktúrához.

Az infrastruktúra a rendszer működésének működési előfeltétele. Biztosítása és fenntartása az Alapítvány szolgáltatási kötelezettsége.

Az Alapítványnak joga és kötelessége megválasztani, megváltoztatni és fejleszteni az infrastruktúrát. Semmilyen ilyen módosítás nem érinti a közjó jogállását vagy integritását.

### 7. cikk

A rendszer szoftvere a GNU Affero General Public License 3.0 (AGPL-3.0) licenc alatt kerül licencelésre.

A rendszerben keletkező tartalom a Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) licenc alatt kerül licencelésre.

A szoftver és a tartalom szerzőinek személyhez fűződő jogai érintetlenek maradnak, és nem ruházhatók át.

A közjó szoftvere és tartalma nem licencelhető újra korlátozóbb feltételek mellett; kizárólag egyenértékű copyleft, illetve share-alike rendszerű licenccel való felváltás megengedett.

A rendszer márkája — a „KOLO” megnevezés, a logó, a jelkép és a domainek — nem része a közjónak, és kizárólag az Alapítvány ellenőrzése alatt áll.

### 8. cikk

A szoftverhez való hozzájárulások a Developer Certificate of Origin (DCO) feltételei mellett kerülnek elfogadásra, amellyel a hozzájáruló megerősíti azon jogát, hogy a kódot a közjó licence alatt bocsássa rendelkezésre.

A tartalomhoz való hozzájárulások a közjó licencének elfogadása mellett kerülnek elfogadásra.

A hozzájárulások a közjóhoz tartoznak.

### 9. cikk

A KOLO Alapítvány a rendszer jogi eszköze, amely őrzi a közjót, de nem tulajdonosa annak. Az Alapítvány a rendszernek sem tulajdonosa.

Az Alapítvány biztosítja és fenntartja az infrastruktúrát, fogadja a dináros adományokat, finanszírozza a rendszer költségeit és programjait, valamint képviseli a rendszert a jogforgalomban.

Az Alapítvány nem szerez POEN-t vagy ZRNO-t, és nem vesz részt a rendszer elszámolási keretében. Az Alapítvány rendszerhez fűződő viszonya kizárólag dináros eszközökben áll fenn.

Az Alapítvány belső szervezetét, testületeit, megbízatásait és döntéshozatali módját az Alapszabály rendezi.

### 10. cikk

A KOLO Protokoll a közjó technikai mechanizmusa. A Protokoll vezeti a nyilvántartást, kiszámítja az elszámolási együtthatót és alkalmazza a rendszer szabályait.

A Protokoll valamennyi művelete determinisztikus és algoritmikus, mérlegelés nélkül. A Protokoll nem járhat el a rendszer szabályain kívül.

A Protokoll nem rendelkezik jogalanyisággal. A Protokoll nem köt szerződéseket, nem vezet számlákat, nem lép jogviszonyba a felhasználókkal, és nem adatkezelő.

Azokat a szabályokat, amelyek szerint a Protokoll eljár, e szabályzattal összhangban kell megállapítani.

### 11. cikk

A KOLO Közösséget a rendszer valamennyi felhasználója alkotja, akik együtt gondoskodnak a közjóról.

A Közösség nem jogi személy, nincsenek testületei vagy képviselői, és mint egész nem hoz döntéseket.

A rendszer irányításában való részvétel a Felső Kolón keresztül valósul meg, e szabályzattal összhangban.

## III — POEN és a hozzájárulás nyilvántartása

### 12. cikk

A POEN az a mód, ahogyan a rendszer feljegyzi, ki mennyivel járult hozzá és ki mennyit kapott. Minden hozzájárulás, minden adomány, a felhasználók közötti minden javak- vagy szolgáltatáscsere — mind POEN-ben kerül nyilvántartásba. A POEN nem pénz, és nem alakítható pénzzé; belső bejegyzés a rendszerben.

Ez a fejezet rendezi, hogyan keletkezik a POEN, hogyan működik a nyilvántartás, mit jelent, hogy a rendszer egyensúlyban van (zéró összegű), és milyen módokon kerül nyilvántartásba a hozzájárulás.

### 13. cikk

A POEN a rendszer belső elszámolási egysége, amellyel a közjóhoz való hozzájárulás és az abban való részvétel egyéb formái kerülnek nyilvántartásba. A POEN azt szolgálja, hogy a felhasználók tudják, mennyivel járultak hozzá és mennyit cseréltek a rendszerben; a legközelebbi analógia az anyakönyvi bejegyzés — tényt rögzít, de önmagában nem olyan eszköz, amely a rendszeren kívül elkölthető.

Új POEN-bejegyzéseket kizárólag a Protokoll ír be a hozzájárulás nyilvántartásba vételének csatornáin keresztül.

A POEN-nek nincs birtokosa; kizárólag a Protokoll nyilvántartásában szereplő bejegyzésként létezik. A POEN összegei egész számokban fejezendők ki. A POEN nem minősül pénznek, valutának, elektronikus pénznek, fizetési eszköznek, digitális vagyonnak, pénzügyi eszköznek vagy értékpapírnak. A POEN nem konvertálható a rendszeren kívül értékkel bíró eszközzé.

Az előző bekezdés rendelkezése nem puszta megnevezés, hanem a bejegyzés tulajdonságainak következménye. A POEN nem felel meg azoknak az elemeknek, amelyek alapján a digitális vagyont, illetve a virtuális fizetőeszközt meghatározzák:

— vásárlással nem szerezhető meg: az Alapítvány nem adja el és nem bocsátja ki ellenérték fejében, a POEN nyilvántartásba vétele pedig semmilyen juttatásért nem ellenszolgáltatás;

— ellenérték fejében nem ruházható át: a POEN rendszeren kívüli értékért való felkínálását, vételét, eladását és a forgalmában való közvetítést a Felhasználási feltételek tiltják, és az az e feltételek szerinti intézkedéseket vonja maga után;

— nem váltják vissza és nem konvertálják (a jelen szabályzat 71. cikke), így belőle pénzbeli kiút nincs;

— az Alapítvány nem állapítja meg az árát, és nem kínálja piacon: nem tesz közzé POEN–dinár vagy bármely más deviza szerinti arányt, és egyetlen ilyen arányt sem alkalmaz egyetlen saját eljárásában sem. A hirdetésben az összeget maga a felhasználó határozza meg (a Felhasználási feltételek 19. cikke); ha ennek során pénzben kifejezett értékből indul ki, az az ő becslése, amely sem az Alapítványt, sem a másik felet nem kötelezi;

— a Protokoll nyilvántartásán kívül nem létezik, és nem vihető át olyan bejegyzésre, amelyet a Protokoll nem vezet;

— nem szolgál pénztartozás teljesítésére, és nem kínálható fel pénz helyett.

Senki nem köteles POEN-t elfogadni. Az Alapítvány POEN-t nem fogad el, egyetlen saját összegét sem fejezi ki benne, és nem tesz közzé POEN-ben megadott árjegyzéket. A cserénél a POEN-ben kifejezett összeget maguk a felek határozzák meg, és az egyetlen más felhasználót sem kötelez. Az Alapítvány projektjeiben történő javak elosztásakor — ideértve a kollektív beszerzést és az áruval és szolgáltatással nyújtott pártfogásból származó utalványok elosztását is — érvénytelenítésre kerülő POEN-szám a nyilvántartásba vett hozzájárulásból, az adott elosztás szabályai szerint kerül megállapításra; az nem az áru vagy a szolgáltatás ára, nem fejezi ki azok értékét, és nem képez árjegyzéket.

A POEN nem szerezhető meg csere teljesítése céljából. Az adomány jogcímén nyújtott hozzájárulást nem a fizetés pillanatában jegyzik be: a bejegyzés feltételezi, hogy az Alapítvány előbb megállapítja a fizetés beérkezésének tényét és azt a személyt, akinek eszközeiből teljesült (15. cikk és 39. cikk).

A POEN jogcímén az Alapítvány nem nyújt fizetési szolgáltatást, és a POEN-t nem bocsátja ki elektronikus pénzként. Hiányoznak azok az elemek, amelyek alapján a fizetési szolgáltatás és az elektronikus pénz meghatározható:

— a POEN-bejegyzés nem képez követelést sem az Alapítvánnyal, sem bármely más személlyel szemben (72. cikk);

— a POEN-t nem pénzeszközök befizetéséért cserébe bocsátják ki: az adomány jogcímén nyújtott hozzájárulás a rendszer szabályai szerint, az adományozás aktusától függetlenül kerül nyilvántartásba, és nem ellenszolgáltatás a befizetésért (73. cikk);

— az Alapítvány a nyilvántartás egyetlen frissítése során sem fogad, nem tart és nem továbbít a felhasználók pénzeszközeit, a frissítés pedig nem pénzeszközökre, hanem a Protokoll által vezetett nyilvántartásban szereplő bejegyzésre vonatkozik;

— a felhasználók közötti, a jelen szabályzat 16. cikke szerinti nyilvántartás-frissítésért az Alapítvány díjat nem számít fel, és érte semmilyen ellenértéket nem kap;

— a POEN-bejegyzésből nincs kifizetés, visszavásárlás és átváltás (71. cikk);

— az a személy, akinek nincs bejegyzése a Protokoll nyilvántartásában, POEN-t nem kap, és az áruval és szolgáltatással nyújtott pártfogásból származó utalvány juttatója sem kap POEN-t: ő az Alapítvánnyal kötött, harmadik személyek javára szóló saját szerződését teljesíti.

Az előző bekezdésekben foglalt tulajdonságok a felhasználó jövedelmének fogalmára is kihatnak. A POEN bejegyzésével a felhasználó sem pénzt, sem dolgot nem kap; semmi nem kerül át az Alapítvány vagyonából a felhasználó vagyonába, a keletkezett bejegyzés pedig nem tehető pénzzé, nem engedményezhető és nem érvényesíthető. Az Alapítvány a bejegyzés alapján semmilyen jogcímen nem teljesít kifizetést, a POEN pénzben kifejezett értékét nem állapítja meg és nem teszi közzé, és ilyen arányt nem alkalmaz, ezért ezen a jogcímen pénzben kifejezett összeg nem kerül megállapításra.

### 14. cikk

A rendszerben szereplő valamennyi POEN-bejegyzés összege, ideértve a Protokoll bejegyzését is, minden pillanatban nulla. Ez a tulajdonság biztosítja, hogy POEN-t ne lehessen ellenbejegyzés nélkül létrehozni — minden nyilvántartásba vett hozzájárulásnak pontos ellenbejegyzése van a Protokoll nyilvántartásában.

A Protokoll olyan bejegyzést vezet, amely minden pillanatban negatív, és a felhasználóknál, valamint a szervezeti egységeknél nyilvántartásba vett valamennyi POEN ellenbejegyzését képezi.

Egyetlen felhasználónak vagy kollektív formának sem lehet negatív POEN-bejegyzése. Nyolc kivétel van, és azokat itt kimerítően felsoroljuk:

1) **a hamis hitelesítés érvénytelenítése miatti megtérítés**, amelyet a valóságbizonyítékról szóló szabályzat 20b. cikke rendez: ha az érvénytelenítés már elköltött POEN-bejegyzéseket von el, a fedezetlen rész negatív értékbe fordul, és átszáll arra a hitelesítőre, aki a fiókot bevezette;

2) **a nyilvántartás-frissítés érvénytelenítése cserebejelentés alapján**, amelyet e szabályzat 16. cikkének 11. bekezdése rendez: a nyilvántartást ellenbejegyzéssel, a teljes frissítés összegében helyesbítik, és ez akkor is végrehajtásra kerül, ha a címzett bejegyzése ezáltal negatívvá válik;

3) **a gyermektérből származó hozzájárulás leírása**, amelyet a gyermekek részvételéről szóló szabályzat rendez: a barátság megszüntetésekor és a nagykorúság elérésekor leírásra kerül az e szabályzat szerint nyilvántartásba vett hozzájárulás, és a leírás akkor is végrehajtásra kerül, ha a bejegyzés ezáltal negatívvá válik;

4) **a nagykorú fiók kiskorú fiókká alakításából eredő leírás**, amelyet a gyermekek részvételéről szóló szabályzat 4d. cikke rendez: ha az Alapítvány megállapítja, hogy a nagykorúként nyitott fiók mögött kiskorú személy áll, érvénytelenítésre kerül az a hozzájárulás, amely e szabályzat 15. cikke szerinti csatornákon keresztül került az adott fiók javára nyilvántartásba, valamint az a hozzájárulás is, amely más személyek javára az ezen átalakítással megszűnő hitelesítések kapcsán került nyilvántartásba; a leírás akkor is végrehajtásra kerül, ha a bejegyzés ezáltal negatívvá válik, mindenki kizárólag azt téríti vissza, ami e kapcsán a javára nyilvántartásba került, a teher pedig nem száll át más személyre;

5) **a korábban bejegyzett megerősítések összehangolásából eredő leírás**, amelyet a valóságbizonyítékról szóló szabályzat 22a. cikke rendez: ha az említett szabályzat 7. cikke szerinti feltétel bevezetése előtt végzett hitelesítések alapján nyilvántartásba vett hozzájárulás visszakerül a feljegyzett hozzájárulás állapotába, minden érintett személytől leírásra kerül az, ami e hitelesítés kapcsán a javára nyilvántartásba került; a leírás akkor is végrehajtásra kerül, ha a bejegyzés ezáltal negatívvá válik, a teher pedig nem száll át más személyre;

6) **a gazdaság megszűnéséből eredő leírás**, amelyet e szabályzat 40.c cikke és a gazdaságokról szóló szabályzat rendez: ha a jóváhagyott gazdaság megszűnik — mert az Alapítvány megállapította, hogy a gazdaság bejelentésekor vagy a gazdasághoz való csatlakozáskor tett, az adatok valóságáról szóló nyilatkozat hamis, és érvénytelenítette a gazdaság jóváhagyását, vagy a gazdaságokról szóló szabályzatban meghatározott más megszűnési okból —, a gazdaság minden, a megszűnés időpontjában tagnak minősülő tagjától, hamis nyilatkozat esetén pedig minden olyan személytől is, aki abban az időszakban volt a gazdaság tagja, amelyre a hamis nyilatkozat vonatkozik, akkor is, ha időközben kilépett, leírásra kerül az a hozzájárulás, amely e gazdaság alapján a javára nyilvántartásba került; a leírás akkor is végrehajtásra kerül, ha a bejegyzés ezáltal negatívvá válik, mindenki kizárólag azt téríti vissza, ami a javára nyilvántartásba került, a teher pedig nem száll át más személyre;

7) **az áruval és szolgáltatással nyújtott pártfogás nem teljesítéséből eredő leírás**, amelyet a pártfogásról és adományokról szóló szabályzat 13.j cikke rendez: ha az Alapítvány az utalvány birtokosának kifogása alapján megállapítja, hogy a juttató az árut nem adta át, illetve a szolgáltatást nem nyújtotta, és ezt a számára biztosított határidőn belül nem orvosolta, a szerződés felbontásra kerül, és a pártfogási kérelmet benyújtó felhasználótól leírásra kerül az a hozzájárulás, amely e szerződés alapján minden olyan utalványra, amelyet a juttató nem teljesített, a javára nyilvántartásba került; a leírás akkor is végrehajtásra kerül, ha a bejegyzés ezáltal negatívvá válik, a teher pedig nem száll át más személyre;

8) **a többszörös fiók megállapításából eredő leírás**, amelyet a valóságbizonyítékról szóló szabályzat 4b. cikke rendez: ha az Alapítvány megállapítja, hogy két fiók ugyanannak a személynek a fiókja, a megszűnő fiók megszüntetésre kerül, a személy által megtartott fiókról pedig leírásra kerül a megszűnő fiókról a megmaradó fiók javára végrehajtott nyilvántartás-frissítések nettó összege, csökkentve az ellenkező irányú frissítésekkel; a leírás akkor is végrehajtásra kerül, ha a bejegyzés ezáltal negatívvá válik, azoknak a más személyeknek a bejegyzései pedig, akiknek javára a megszűnő fiókról a nyilvántartást frissítették, érintetlenek maradnak.

A negatív bejegyzésre mind a nyolc jogalap esetén ugyanaz a rend vonatkozik: nem tartozás és nem hajtják be, a felhasználóhoz beérkező POEN-ek először azt töltik fel, a nyilvántartás más felhasználó javára történő frissítésének kezdeményezése csak akkor lehetséges, ha a bejegyzés átlépi a nullát, az áruk és szolgáltatások cseréje pedig nincs korlátozva.

A negatív bejegyzésre más jogalap nem hozható létre — sem e szabályzattal e cikk módosítása nélkül, sem bármely más aktussal.

A javak és szolgáltatások cseréje újraosztja a meglévő POEN-eket, és nem változtatja meg azok teljes számát a rendszerben. A POEN-ek teljes száma a hozzájárulás nyilvántartásba vételének csatornáin keresztül történő új bejegyzésekkel, valamint az e szabályzat 14a. cikke értelmében jogalap nélkül végrehajtott érvénytelenítés helyesbítésével növekszik, és az e szabályzatban megállapított jogalapokon történő bejegyzés-érvénytelenítéssel csökken, ideértve a felügyeletért korábban nyilvántartásba vett hozzájárulás egyszeri érvénytelenítését is, amelynek végrehajtását a valóságbizonyítékról szóló szabályzat 22b. cikke rendezi. A POEN-ek teljes számának növelésére más jogalap nincs.

### 14a. cikk

A POEN-bejegyzés akkor is érvénytelenítésre kerül, amikor a felhasználó azt az Alapítvány projektjében való részvételre használja fel, a külön szabályzatban megállapított feltételek szerint.

A felhasználás miatti érvénytelenítés nem a felhasználóval szembeni intézkedés. Nem feltételez szabálytalanságot, nem a felhasználói minőség megszűnésén alapul, és különbözik az e szabályzat 34. cikke szerinti bejegyzés-érvénytelenítéstől, valamint a valóságbizonyítékról szóló szabályzat VIII. fejezete szerinti érvénytelenítéstől.

Az érvénytelenítés a Protokoll javára szóló ellenbejegyzéssel történik. Valamennyi bejegyzés összege továbbra is nulla, a nyilvántartott POEN teljes száma pedig csökken.

A felhasználás miatti érvénytelenítéssel a felhasználó bejegyzése nem mehet át negatív értékbe; kizárólag az a POEN-szám kerül érvénytelenítésre, amely a bejegyzésben megvan. E jogalap nem vezet be új kivételt a 14. cikk (3) bekezdése szerinti, negatív bejegyzésre vonatkozó tilalom alól.

Ha megállapítást nyer, hogy a felhasználás feltétele nem teljesült — hogy a javakat nem vették át, vagy hogy az átvett javak nem voltak alkalmasak arra a célra, amelyre beszerzésre kerültek —, az érvénytelenítést a felhasználó javára szóló ellenbejegyzéssel helyesbítik, az érvénytelenített POEN számában. A helyesbítés nem e szabályzat 15. cikke szerinti csatornán keresztüli új bejegyzés, hanem a jogalap nélkül végrehajtott érvénytelenítés megszüntetése.

A helyesbítés sem ellenszolgáltatás visszatérítése, sem semmiféle kifizetés. A helyesbítés jogcímén a felhasználó az érvénytelenített bejegyzésen kívül semmilyen értéket nem kap, az Alapítvány pedig e jogcímen semmit nem fizet ki és semmit nem kap.

A felhasználás miatti érvénytelenítés feltételeit, eljárását, mértékét és időpontját, valamint a bejelentett hiba szerinti határidőt és eljárást külön szabályzat állapítja meg.

### 15. cikk

Új POEN-bejegyzéseket a Protokoll a hozzájárulás nyilvántartásba vételének következő csatornáin keresztül ír be:

1) működési hozzájárulás;

2) felhasználók hitelesítése a megerősítési láncban;

3) pénzügyi hozzájárulás;

4) pártfogás;

5) a kollektív formák növekedése;

6) szociális programok;

7) alapítói hozzájárulás;

8) a platform tartalmához való hozzájárulás;

9) a gyermekek hozzájárulása a gyermektérben;

10) a gazdaság hozzájárulása.

A 8. pont szerinti csatorna az első hirdetésért járó hozzájárulást (40.a cikk), a 10. pont szerinti csatorna a gazdaság hozzájárulását (40.c cikk) foglalja magában.

Az 1., 3., 4., 7., 8. és 10. pont szerinti csatornákat e szabályzat VI. fejezete rendezi. A 2. pont szerinti csatornát a valóságbizonyítékról szóló szabályzat rendezi. Az e csatorna szerinti POEN-beírás akkor történik, amikor a résztvevő megteszi első megerősített hozzájárulását, az említett szabályzat 7. cikkében megállapított feltételek szerint; a beírásig a hozzájárulás feljegyzett állapotban van, és nem számít bele a nyilvántartásba vett POEN-ek teljes számába. Az 5., 6. és 9. pont szerinti csatornákat a VIII. fejezet rendezi a rendszer moduljaiként; a 9. pont szerinti csatornát közelebbről a gyermekek részvételéről szóló szabályzat rendezi. A 9. pont szerinti csatornán történő nyilvántartásba vétel a Protokoll automatikus aktusa, és nem számít bele a Protokoll Programjainak napi korlátjába; a nyilvántartásba vett POEN beleszámít a nyilvántartásba vett POEN-ek összesített számába, és ezzel a rendszer elszámolási keretébe. Az egyes csatornákra vonatkozó nyilvántartásba vételi paramétereket, feltételeket és korlátozásokat külön szabályzatok állapítják meg, különösen a működési hozzájárulásról szóló szabályzat, a valóságbizonyítékról szóló szabályzat, a pártfogásról és adományokról szóló szabályzat, a szövetkezetekről szóló szabályzat, a gazdaságokról szóló szabályzat, a támogatási programokról szóló szabályzat és az alapítói hozzájárulásról szóló szabályzat.

A pénzügyi hozzájárulás dinárban valósul meg. A pártfogás pénz, áru vagy szolgáltatás adományozásával valósul meg. Az áruval és szolgáltatással nyújtott pártfogás akkor minősül beérkezettnek, amikor az adományozási szerződést aláírták és az utalványokat kiállították, a pártfogásról és adományokról szóló szabályzat feltételei szerint. A dináros eszközök az Alapítványba kerülnek, és nem lépnek be a rendszer elszámolási keretébe. Az adomány vagy a pártfogói hozzájárulás beérkezését követően a Protokoll a megfelelő felhasználó bejegyzésében nyilvántartásba veszi a hozzájárulást POEN-ben, a külön szabályzatban megállapított nyilvántartásba vételi paraméterek szerint. A POEN nyilvántartásba vétele a Protokoll automatikus aktusa, és nem hoz létre szerződéses jogviszonyt az adományozó és az Alapítvány között.

Ebben az eljárásban két döntés elkülönül. A fizetés beérkezésének tényét és azt a személyt, akinek eszközeiből teljesült, az Alapítvány állapítja meg, a befizetőre vonatkozó adatokat a felhasználó fiókjával összevetve; a fizetési közvetítő teljesített terhelésről szóló jelentése önmagában nem indítja el a bejegyzést. Áruval és szolgáltatással nyújtott pártfogás esetén az Alapítvány megállapítja, hogy a szerződést megkötötték, és hogy az árjegyzéket csatolták. A bejegyzett POEN számát a Protokoll automatikusan határozza meg, külön szabályzat paraméterei szerint, és az a rendszer egyetlen szereplőjének mérlegelése alá sem tartozik.

### 16. cikk

A felhasználók a rendszeren belül javakat és szolgáltatásokat cserélnek. Minden cserét a Protokoll a POEN-nyilvántartás frissítésével vesz nyilvántartásba: a javat vagy szolgáltatást nyújtó felhasználó bejegyzése növekszik, a fogadó felhasználó bejegyzése pedig ugyanazzal az összeggel csökken.

A csere újraosztja a meglévő POEN-eket a felhasználók között, és nem növeli azok teljes számát a rendszerben. A Protokoll akkor frissíti a nyilvántartást, amikor a felhasználók lebonyolítják a cserét.

A csere nem fizetési tranzakció. A POEN-nyilvántartás frissítése nem monetáris érték átutalása, és nem minősül fizetésnek a fizetési szolgáltatásokról szóló előírások értelmében.

A csere teljesítéséért, minőségéért, az azzal járó felelősségért és kockázatért az abban részt vevő felhasználók felelnek, a kötelmi jog általános szabályai szerint. Az Alapítvány és a Protokoll nem közvetít a cserében, és nem felel a felhasználók kötelezettségeinek teljesítéséért.

Minden felhasználó cserélhet árut és szolgáltatást. A POEN-nyilvántartás más felhasználó javára történő frissítésének kezdeményezése a résztvevők számára, a Kolóban nem lévő felhasználók számára pedig a 28. cikkben foglalt feltételekkel érhető el.

Tilos és a Felhasználási feltételekben megállapított intézkedéseket vonja maga után az a nyilvántartás-frissítés, amelyet olyan ügylet érdekében hajtanak végre, amellyel a POEN-t a rendszeren kívüli értékért kínálják, veszik, eladják, vagy forgalmában közvetítenek. Az ilyen frissítés e cikk értelmében nem áru- és szolgáltatáscsere.

Az Alapítvány nem közvetít a POEN pénzre történő cseréjében, ilyen cseréket nem szervez, és azokért nem felel. A platform hirdetési terében nem tehető közzé olyan hirdetés, amely a POEN pénzre történő cseréjét kínálja vagy keresi. A POEN felhasználók közötti átvitele a termékek, szolgáltatások és tudás cseréjét, valamint a közösségen belüli kölcsönösség más formáit szolgálja.

A platform hirdetési terében a hirdetések megtekintése — az ajánlat vagy kérés tartalma, a POEN-ben kifejezett összeg, helye és a hirdető álneve — nyilvános és valamennyi látogató számára elérhető a csere hozzáférhetősége érdekében.

Javat vagy szolgáltatást kínáló vagy kereső hirdetés közzététele és a hirdetés kapcsán történő kommunikáció kezdeményezése a felhasználók számára is elérhető, a Felhasználási feltételekben megállapított feltételek és korlátozások mellett. A hirdető elérhetőségi adataihoz való hozzáférés kizárólag résztvevők számára elérhető. A felhasználó válaszolhat abban a beszélgetésben, amelyben részt vesz.

A felhasználó hirdetése látható jelzést visel arról, hogy a hirdető nincs a Kolóban. A jelzés mindazok számára elérhető, akik számára maga a hirdetés is elérhető.

Az a felhasználó, aki más felhasználó javára nyilvántartás-frissítést kezdeményezett, de az a csere, amely miatt ezt tette, nem teljesült, a nyilvántartás-frissítéstől számított harminc napon belül kifogást nyújthat be az Alapítványhoz. A kifogást kizárólag ez a felhasználó nyújthatja be, a saját profiljáról, és nyilvántartás-frissítésenként legfeljebb egyet. A döntés előtt az Alapítvány értesíti a másik felet, és hét napot biztosít neki nyilatkozattételre; ha e határidőn belül nem nyilatkozik, a döntés nyilatkozata nélkül születik meg. Az Alapítvány indokolással dönt, amelyet mindkét féllel közöl; ha megállapítja, hogy a csere nem teljesült, a Protokoll a nyilvántartást ellenbejegyzéssel, a teljes frissítés összegében, a benyújtó bejegyzésének javára helyesbíti. A helyesbítés akkor is végrehajtásra kerül, ha a címzett bejegyzése ezáltal negatívvá válik (14. cikk 3. bekezdés 2. pont). A nyilvántartás helyesbítése nem visszatérítés és nem kifizetés: az Alapítvány e jogcímen semmit nem fizet ki és semmit nem kap. Az a felhasználó, akinek a bejegyzése e döntéssel csökkent, az érvénytelenítéstől számított harminc napon belül kifogást nyújthat be ellene. A kifogásról való döntés a Protokoll nyilvántartásában szereplő bejegyzésre vonatkozik; nem teszi az Alapítványt a csere felévé, nem alapozza meg a felelősségét a felhasználók kötelezettségeinek teljesítéséért, és nem jelent közvetítést a cserében.

A hirdető álneve a hirdetési térben a be nem jelentkezett személyek számára nem kapcsolódik össze a hozzájárulási nyilvántartással, a számlaállással vagy a felhasználói profillal, a Kolóban nem lévő felhasználók számára pedig csak a Felhasználási feltételekben megállapított szűkített profillal, a hozzájárulási nyilvántartás és a számlaállás nélkül. A platform hirdetési terének szabályait a Felhasználási feltételek rendezik.

## IV — ZRNO és az elszámolási keret

### 17. cikk

A ZRNO a másik bejegyzés, amelyet a rendszer a felhasználóról vezet. Míg a POEN a hozzájárulást rögzíti, a ZRNO a helyzetet rögzíti — a közjóban való tartósabb részvétel mértékét, amely alapján a Kolo-őrző szavazatot szerez a rendszer szabályairól való döntéshozatalban. Az elszámolási együttható az a számszerű arány, amely a POEN-t és a ZRNO-t összeköti.

Ez a fejezet rendezi, mi a ZRNO, hogyan kerül beírásra és leírásra, milyen állapotai vannak, miért nem ruházható át, valamint hogyan kerül kiszámításra az elszámolási együttható, és mi az elszámolási időszak.

### 18. cikk

A ZRNO a rendszer belső elszámolási egysége, amellyel a Protokoll nyilvántartásában a felhasználó közjóban elfoglalt helyzete kerül nyilvántartásba. A helyzet a felhasználó hozzájárulásából ered, és szavazatot ad neki a rendszer szabályairól való döntéshozatalban. A ZRNO nem minősül üzletrésznek, részvénynek, értékpapírnak, kollektív befektetési egységnek, befektetési szerződésnek vagy digitális vagyonnak, és nem hordoz osztalékot, kamatot, hozamot vagy a felszámolási maradványhoz való jogot.

A ZRNO-k teljes száma 1.000.000, és sem nem növelhető, sem nem csökkenthető.

Minden pillanatban a ZRNO-k egy része a felhasználóknál van beírva, másik része pedig a Protokollban beírásra rendelkezésre áll; a beírt és a rendelkezésre álló ZRNO-k összege mindig egyenlő a teljes számmal.

A ZRNO-t kizárólag a Protokoll írja be és le, a felhasználó kérelmére és a rendszer szabályai szerint. Az irányítási funkció — a Felső Kolóban való szavazati jog — a beírt és aktivált ZRNO-ból ered; a ZRNO önmagában nem szavazati jog, hanem a helyzet nyilvántartása, amelyből az a jog ered.

### 19. cikk

A ZRNO a résztvevő nyilvántartásában bejegyzett hozzájárulásból íródik be, függetlenül attól, hogy azt a hozzájárulást a 15. cikk szerinti csatornán jegyezték-e be, vagy a nyilvántartás más felhasználókkal folytatott áru- és szolgáltatáscserével növekedett. A ZRNO beírásával a Kolo-tag Kolo-őrzővé válik.

ZRNO-t csak a Kolo-tag, illetve a megerősítés nélküli tag írhat be; a felhasználó nem ír be ZRNO-t. A megerősítés nélküli tag a ZRNO beírásával nem válik Kolo-őrzővé, és a beírt ZRNO-t nem aktiválja, amíg meg nem erősítik (28a. cikk). A Felső Kolóban a szavazat nem a beírt, hanem az aktivált ZRNO-ból ered, olyan Kolo-őrző esetében, akinek valóságát megerősítették (30. cikk és 45. cikk). Annak a felhasználónak a helyzetét, akinek ZRNO-t írtak be, a 30. cikk rendezi.

A ZRNO beírása legalább 20.000 nyilvántartásba vett POEN-t feltételez a ZRNO-t beíró felhasználó bejegyzésében. A felhasználó egy elszámolási időszakban ZRNO beírására legfeljebb nyilvántartásba vett POEN-jeinek 1 %-át fordíthatja.

Az e cikk szerinti feltétel alóli kivételt a rendszer indulásakor átmeneti rendelkezés rendezi (82. cikk).

A ZRNO beírását a ZRNO-t beíró résztvevő kezdeményezi. A Protokoll ellenőrzi a feltételek teljesülését, és végrehajtja a beírást, ha a feltételek teljesülnek. A beírás nem mérlegelési döntés, és azt a rendszer egyetlen szereplője sem hagyja jóvá vagy utasítja el.

A ZRNO beírásakor a Protokoll csökkenti az adott felhasználó nyilvántartásba vett POEN-jeit a folyó elszámolási időszakra érvényes elszámolási együttható szerint.

### 20. cikk

A beírt ZRNO-nak két állapota van: szabad és aktív.

A szabad ZRNO irányítási funkció nélküli beírt ZRNO. A Kolo-őrző aktiválhatja vagy leírhatja a szabad ZRNO-t. Az a megerősítés nélküli tag, akinek ZRNO-t írtak be, a szabad ZRNO-t leírhatja, de nem aktiválhatja (28a. cikk).

Az aktív ZRNO olyan ZRNO, amelyet a Kolo-őrző az irányításban való részvétel céljából aktivált; az aktív ZRNO szavazati jogot ad a Felső Kolóban. Az aktív ZRNO nem írható le, amíg a Kolo-őrző vissza nem állítja szabad állapotba.

A ZRNO állapotai közötti átmenetek és azok hatálya az elszámolási időszak végén állnak be.

### 21. cikk

A Kolo-őrző leírhatja a szabad ZRNO-t — visszaadhatja a Protokollnak. A szabad ZRNO-t az a megerősítés nélküli tag is leírhatja, akinek ZRNO-t írtak be (20. cikk).

A leíráskor a Protokoll POEN-t vesz nyilvántartásba a ZRNO-t leíró felhasználó javára a folyó elszámolási időszakra érvényes elszámolási együttható szerint.

Az aktív ZRNO nem írható le. Az a Kolo-őrző, aki aktív ZRNO-t kíván leírni, előbb köteles azt szabad állapotba visszaállítani.

Az a Kolo-őrző, akinek ZRNO-ja teljes egészében leírásra került, Kolo-taggá válik.

A beírás és a leírás pillanatában érvényes elszámolási együttható közötti különbség nem hozam. Az az egész rendszer nyilvántartási állapotának változásából eredő számtani következmény; egyetlen szereplő sem fizeti ki és nem szavatolja. A leírással nyilvántartásba vett POEN-ek ugyanolyan jogállással bírnak, mint minden más POEN.

### 22. cikk

A ZRNO nem ruházható át másik felhasználóra.

A ZRNO ahhoz a felhasználóhoz kötődik, akinek nyilvántartásában be van jegyezve, és nem ruházható át — sem önmagában, sem a fiókkal együtt.

A ZRNO-ra nincs piac, nincs ZRNO-ár, és nincs lehetőség vele kereskedni.

### 23. cikk

Az elszámolási együttható a nyilvántartásba vett POEN-ek teljes számának és a Protokollban a beírásra rendelkezésre álló ZRNO-k számának számszerű aránya. Az elszámolási együttható megmutatja, hány POEN szükséges egy ZRNO beírásához az adott elszámolási időszakban.

Az elszámolási együtthatót a Protokoll számítja ki, automatikusan és mérlegelés nélkül.

Az elszámolási együttható a nyilvántartásba vett POEN-ek teljes számával változik: az új POEN-bejegyzések beírása felfelé, a nyilvántartásba vett POEN-ek megsemmisítése lefelé mozdítja el. Az együttható nem eleve növekedésre rendelt.

A ZRNO beírása és leírása nem mozdítja el az elszámolási együtthatót. Beíráskor a Protokollban rendelkezésre álló ZRNO-k száma mellett ugyanolyan arányban csökken a nyilvántartásba vett POEN-ek teljes száma is — mivel a beírásra fordított POEN-ek visszakerülnek a Protokollhoz; leíráskor mindkét mennyiség ugyanolyan arányban növekszik. A Kolo-őrző sem saját beírásával, sem saját leírásával nem tudja elmozdítani az együtthatót.

A felhasználók közötti javak- és szolgáltatáscsere nem változtatja meg az együtthatót.

Az elszámolási együttható igazgatási mennyiség. Nem ár, nem árfolyam és nem teljesítménymutató; nem fejezi ki a ZRNO vagy a POEN rendszeren kívüli értékét.

### 24. cikk

Az elszámolási időszak az az időintervallum, amelynek végén a Protokoll kiszámítja az elszámolási együtthatót.

Az elszámolási időszak végén alkalmazandók a ZRNO beírásának és leírásának szabályai, és beállnak a ZRNO állapotai közötti átmenetek.

Az elszámolási időszak huszonnégy óráig tart, éjféltől éjfélig.

### 25. cikk

A Kolo-őrző az elszámolási együtthatóval változó elszámolási rendszerben pozícióval rendelkezik, valamint joga van a Felső Kolón keresztül részt venni a rendszer irányításában.

A Kolo-őrző pozíciójának megváltozása kizárólag a rendszerbeli tevékenység és az elszámolási együttható változásának következményeként áll be. Ez a változás nem hozam, nem szavatolt, és egyetlen szereplő sem fizeti ki.

A pozícióból eredő hasznot a Kolo-őrző kizárólag a rendszeren belül realizálja. A ZRNO-nak és a POEN-nek nincs a rendszeren kívüli értéke, és nem konvertálhatók pénzzé.

Az a Kolo-őrző, aki nem vesz részt aktívan a rendszerben, megtartja nyilvántartásba vett helyzetét; e helyzet esetleges megváltozása más felhasználók rendszerbeli tevékenységének következménye, nem pedig a rendszer egyénre irányuló cselekménye.

A Kolo-őrző helyzete nem minősül befektetésnek. Ez a megállapítás nem az egység nevén és nem azon a kijelentésen alapul, hogy a ZRNO nem befektetési eszköz, hanem azon, hogy hiányoznak belőle azok az elemek, amelyek a befektetést befektetéssé teszik:

1) a ZRNO nem eszközök befektetésével szerezhető meg — a résztvevő bejegyzésében már nyilvántartásba vett hozzájárulásból íródik be; az Alapítvány a ZRNO-t nem adja el, nem kínálja és nem állapít meg rá árat, a beírás nem ellenszolgáltatás, és a ZRNO árának nincs létezése (22. cikk);

2) nincs olyan hozam, amelyet realizálni lehetne — a helyzet változása kizárólag POEN-ekben jelenik meg, amelyeknek nincs a rendszeren kívüli értékük, és sem közvetlenül, sem közvetve nem válthatók vissza és nem konvertálhatók (71. cikk), így az elszámolási együttható különbözete nem hagyhatja el a Protokoll nyilvántartását;

3) nincs más személynek a Kolo-őrző javára irányuló ráfordítása — az elszámolási együttható a nyilvántartás két összegének hányadosa, amelyet a Protokoll automatikusan és mérlegelés nélkül számít ki (23. cikk); senki sem kezeli és nem ígéri, a Kolo-őrző pedig sem saját beírásával, sem saját leírásával nem mozdítja el;

4) a Kolo-őrző nincs elválasztva az irányítástól — az aktivált ZRNO-ból ered a szavazat a Felső Kolóban (45. cikk), így a Kolo-őrző maga dönt a rendszer szabályairól. Aki szavazatot akar, annak aktiválnia kell a ZRNO-t, és ezzel lemond a leírásról, amíg vissza nem állítja szabad állapotba (46. cikk); az irányítási funkció és az elszámolási rugalmasság kölcsönösen kizárják egymást.

Az a felhasználó, akinek ZRNO-t írtak be, de már nincs a Kolóban, a ZRNO-t tartja, de nem írja le (30. cikk). Az a megerősítés nélküli tag, akinek ZRNO-t írtak be, nem aktiválja azt, amíg meg nem erősítik (28a. cikk); ez a korlátozás a valóságbizonyítékból ered, nem pedig az elszámolási rendszerben elfoglalt helyzetből. Azokból az eszközökből, amelyekkel e felhasználó hozzájárulását nyilvántartásba vették, nem keletkezhet több nyilvántartásba vett POEN.

## V — Felhasználói jogállások, valóságbizonyíték és a jogállás megszűnése

### 26. cikk

Ahhoz, hogy a felhasználó cserélhessen, hogy hozzájárulása nyilvántartásba kerülhessen vagy hogy a rendszert irányíthassa, a rendszernek tudnia kell, hogy valós és egyedi személyről van szó. Ez a fejezet rendezi a felhasználó lehetséges jogállásait, azt a módot, ahogyan megerősítést nyer, hogy a felhasználó valós személy, és azt, mi történik, amikor a felhasználó megszűnik a rendszer részének lenni.

A valóságbizonyíték működési elemeit és a jogállás megszűnésének mechanikáját külön szabályzat rendezi.

### 27. cikk

A KOLO rendszerben a nagykorú felhasználó négy jogállás egyikével rendelkezhet: felhasználó, megerősítés nélküli tag, Kolo-tag és Kolo-őrző.

A kiskorú felhasználó nem rendelkezik e cikk szerinti jogállással; helyzetét a gyermekek részvételéről szóló szabályzat rendezi.

A felhasználó a rendszer szabályaiban megállapított feltételek mellett lép át egyik jogállásból a másikba.

A jogállás meghatározza a felhasználó rendszerbeli jogainak és lehetőségeinek terjedelmét.

### 28. cikk

Felhasználói jogállású az a nagykorú felhasználó, aki nincs a Kolóban.

A felhasználónak joga van megtekinteni a rendszer nyilvános tartalmát, ideértve a platform hirdetési terében szereplő hirdetéseket. Cserélhet javakat és szolgáltatásokat, és a platform hirdetési terében javat vagy szolgáltatást kínáló vagy kereső hirdetést tehet közzé, a Felhasználási feltételekből eredő feltételek mellett.

A POEN-nyilvántartás frissítésében a felhasználó fogadóként vesz részt, és kezdeményezheti a nyilvántartás más felhasználó javára történő frissítését. A nyilvántartás frissítésével a bejegyzés a felhasználók számlái között helyeződik át; a POEN-ek teljes száma nem változik (15. cikk). A hitelesítés előtt nyilvántartásba vett POEN-bejegyzések érvényesek maradnak, és nem kerülnek megsemmisítésre.

A felhasználó hozzájárulását a platform tartalmához való hozzájárulás csatornáján jegyzik be (15. cikk 8. pont és 40a. cikk), valamint a pénzügyi hozzájárulás és a pártfogás csatornáján (15. cikk 3. és 4. pont). A többi csatornán hozzájárulást nem jegyeznek be neki.

A felhasználó nem férhet hozzá a hirdetők kapcsolattartási adataihoz. A Platformon keresztüli kommunikációt hirdetés kapcsán kezdeményezi, a Felhasználási feltételekben megállapított terjedelemben, és válaszol abban a beszélgetésben, amelyben részt vesz.

Az a felhasználó, aki egyetlen Kolo-tagot sem ismer, beszélgetési kérelmet nyújthat be, amellyel a Kolo-tagoknak lehetőséget ad arra, hogy megismerkedés céljából felhívják (a Felhasználási feltételek 16b. cikke). A hívási listára a 32. cikk 5. bekezdése szerinti felhasználó is felkerül. A Kolo-tag mindkét esetben a beszélgetést követően bevezetheti őt a Kolóba, mégpedig kizárólag a megerősítési láncban.

### 28a. cikk

*Megerősítés nélküli tag*

A megerősítés nélküli tag az a nagykorú felhasználó, akit valaki bevezetett a Kolóba, de akit még nem erősített meg őt személyesen ismerő Kolo-tag, a valóságbizonyítékról szóló szabályzattal összhangban. A megerősítés nélküli tag a Kolóhoz tartozik (2. cikk), és a Kolóhoz való tartozás nem tagság az Alapítványban.

A Kolóba a Kolo-tag vezet be — a hívási listán szereplő felhasználóval folytatott telefonos beszélgetést követően —, vagy a megerősítés nélküli tag, aki olyan felhasználót vezet be, akit személyesen ismer. Akit megerősítés nélküli tag vezet be, maga is megerősítés nélküli tag.

A megerősítés nélküli tag résztvevő, és megilletik azok a jogok, amelyeket az Alapítvány aktusai a résztvevőhöz kötnek: javakat és szolgáltatásokat cserél, kezdeményezi a POEN-nyilvántartás frissítését, hozzájárulását POEN-ben nyilvántartásba veszik, részt vesz a kollektív formákban, a szociális programokban, a projektekben és a beszerzésekben, és bevezeti a Kolóba azokat a felhasználókat, akiket személyesen ismer. Azokkal a jogokkal, amelyeket az Alapítvány aktusai a Kolo-taghoz, illetve a megerősített felhasználóhoz kötnek, nem rendelkezik, kivéve, ha az aktus kifejezetten másként rendelkezik. Mások valódiságát nem erősíti meg, hanem csak bevezeti őket a Kolóba; nem erősíti meg, hogy más felhasználó teljesíti a támogatási program feltételeit; nem látja a hívási listát, nem ad tagi ajánlást, és nem végzi a hitelesítések felügyeletét. ZRNO-t a 19. cikk feltételei szerint ír be, de nem aktiválja: nincs szavazata, nem tagja a Felső Kolónak, szavazatot nem delegál, és a ZRNO beírásával nem válik Kolo-őrzővé. A szabad ZRNO-t leírhatja (20. cikk). A ZRNO beírásával felkerül a hívási listára a megerősítés céljából, az első helyre, és az Alapítvány köteles biztosítani, hogy egy Kolo-őrző három napon belül felhívja, a valóságbizonyítékról szóló szabályzattal összhangban.

A megerősítés nélküli tag akkor válik Kolo-taggá, amikor őt személyesen ismerő Kolo-tag, illetve alapító, egy Kolo-őrző telefonos beszélgetést követően, ha a megerősítés nélküli tag legalább 30 napja a Kolóban van, és teljesíti a valóságbizonyítékról szóló szabályzat egyéb feltételeit, vagy saját döntése alapján az Alapítvány megerősíti. A javak és szolgáltatások cseréje lehet az a mód, ahogyan megismerkedtek, de nem feltétele a megerősítésnek. A megerősítés nélküli tag megerősítése nem új hitelesítés, és ennek alapján POEN nem kerül nyilvántartásba; ugyanúgy felügyelet alá tartozik, mint a hitelesítés, a valóságbizonyítékról szóló szabályzattal összhangban.

Amikor a felhasználó Kolo-taggá válik, megkapja a kapcsolódók listáját: azokét, akiket megerősítés nélküli tagként bevezetett a Kolóba, és azét, aki őt bevezette, ha ők még megerősítés nélküli tagok. E listáról személyesen megerősíti azokat, akiket ismer; minden ilyen megerősítés a megerősítés nélküli tag megerősítése, felügyelet alá tartozik, és ennek alapján POEN nem kerül nyilvántartásba. A megerősítés nélküli tag soha nem válik automatikusan Kolo-taggá. A részletes feltételeket a valóságbizonyítékról szóló szabályzat állapítja meg.

### 29. cikk

A Kolo-tag az a felhasználó, akinek valódiságát a megerősítési láncban őt személyesen ismerő Kolo-tag, illetve alapító megerősítéssel erősítette meg, vagy akit megerősítés nélküli tagként a 28a. cikk szerint megerősítettek, a valóságbizonyítékról szóló szabályzattal összhangban.

A Kolo-tag cserélhet javakat és szolgáltatásokat, hozzájárulása POEN-ben nyilvántartásba vehető, részt vehet a kollektív formákban és a szociális programokban, megerősítheti azoknak a felhasználóknak a valódiságát, akiket személyesen ismer, a beszélgetést követően bevezetheti a Kolóba a hívási listán szereplő felhasználókat, és megerősítheti azokat a megerősítés nélküli tagokat, akiket személyesen ismer.

A Kolo-tag akkor ír be ZRNO-t, amikor teljesíti a 19. cikk feltételeit, és ezzel Kolo-őrzővé válik. Az a megerősítés nélküli tag, akinek ZRNO-t írtak be, akkor válik Kolo-őrzővé, amikor megerősítik. A ZRNO aktiválása és az abból eredő jogok a megerősítettséghez kötődnek — a Kolo-tag megerősítéséhez, illetve a 28a. cikk szerinti megerősítéshez.

### 30. cikk

A Kolo-őrző az a Kolo-tag, akinek a Protokollban ZRNO-t jegyeztek be. Az első Kolo-őrzők — az alapítók — a rendszer indulásakor e szabályzat átmeneti rendelkezésében megállapított módon jönnek létre (82. cikk).

A Kolo-őrző a Kolo-tag minden jogával rendelkezik. Ezen felül helyet foglal el az elszámolási rendszerben, a ZRNO aktiválásával részt vesz a rendszer irányításában a Felső Kolón keresztül, és a valóságbizonyítékról szóló szabályzattal összhangban végzi a hitelesítések felügyeletét.

Az a Kolo-őrző, akinek valóságmegerősítése megszűnik, felhasználóvá válik. ZRNO-ja beírva és befagyasztva marad: amíg ismét meg nem erősítik, az a felhasználó, akinek ZRNO-t írtak be, nem aktiválja, nem írja le, annak alapján szavazatot nem delegál, és nem tagja a Felső Kolónak; a beírt ZRNO-ból sem szavazat, sem delegálás, sem megerősítési jog nem ered. Amikor valóságát ismét megerősítik, ismét Kolo-őrző, ha pedig csak bevezetik a Kolóba, olyan megerősítés nélküli tag helyzetében van, akinek ZRNO-t írtak be (28a. cikk). Ugyanez vonatkozik arra a megerősítés nélküli tagra is, akinek ZRNO-t írtak be, és akinek a hitelesítése megszűnik. Az a Kolo-őrző, akinek csak a megerősítését érvénytelenítik, de a Kolóba való bevezetése továbbra is érvényes, megerősítés nélküli taggá válik (28a. cikk): ZRNO-ja beírva marad, az aktív ZRNO pedig szabad állapotba kerül; azt ismét aktiválhatja, amikor megerősítik.

Az a Kolo-őrző, akinek ZRNO-ja teljes egészében leírásra került, Kolo-taggá válik.

### 31. cikk

A valóságbizonyíték a felhasználók hitelesítésének személyes ismeretségen vagy hívást követő beszélgetésen alapuló modellje, a valóságbizonyítékról szóló szabályzattal összhangban. Ezzel nyer megerősítést, hogy a felhasználó valós személy, és hogy folytonosan ugyanaz a személy. Az egyediség — egy személy, egy fiók — hitelesítéssel nem nyer megerősítést, mert a hitelesítő az embert ismeri, nem pedig annak más fiókjait: az a Felhasználási feltételekben foglalt tilalom, a többszörös fiókot pedig az Alapítvány állapítja meg a valóságbizonyítékról szóló szabályzat szerint, az adatok összevetése és a személy megkeresése alapján.

A valóságbizonyíték nem igényli személyi okmányok vagy egységes polgári azonosító szám gyűjtését. A hozzájárulási nyilvántartás álnév alatt vezetendő; a felhasználó családi és utóneve, ha azt beszerezték, a 31a. cikk szerinti külön személyazonossági nyilvántartásban vezetendő.

A valódiság hitelesítése személyes adatok kezelése. Ezen adatkezelés jogalapja a felhasználó és az Alapítvány közötti szerződéses jogviszony teljesítése.

### 31a. cikk

*Személyazonossági nyilvántartás*

Az Alapítvány személyazonossági nyilvántartást vezet — olyan nyilvántartást, amelyben a fiók álneve mellett a felhasználó családi és utóneve szerepel. A személyazonossági nyilvántartás a 31. cikk szerinti „egy személy, egy fiók” elvének érvényesítését és annak az alapnak az ellenőrzését szolgálja, amelyen a hozzájárulást nyilvántartásba vették. A hozzájárulási nyilvántartástól elkülönítve vezetendő.

A családi és utónév a következő esetekben kerül be a személyazonossági nyilvántartásba:

1) a gazdaság bejelentésekor és a gazdasághoz való csatlakozáskor — a családi és utónevet maga a gazdaság tagja jegyzi be, a saját fiókjára;

2) a nyilvános adomány beérkezésének megállapításakor — az adományozó családi és utóneve, ha az megegyezik a befizetésről szóló bankszámlakivonatban szereplő befizető nevével;

3) a szövetkezeti tagság megszerzésekor — az a családi és utónév, amelyet a szövetkezet az Alapítvány részére megküld;

4) a pártfogás beérkezésének megállapításakor — a pártfogási kérelmet a jogi személy, illetve az egyéni vállalkozó nevében benyújtó felhasználó családi és utóneve, miután az Alapítvány a nevet, a törzsszámot és a képviselőt összevetette annak a nyilvántartásnak az adataival, amelybe a pártfogót bejegyezték, illetve a bejegyzett mezőgazdasági termelő gazdaság birtokosának családi és utóneve, a birtokos által megadott gazdasági számmal együtt;

5) a hívási listára való felkerüléskor — a családi és utónevet maga a felhasználó jegyzi be, a saját fiókjára, a valóságbizonyítékról szóló szabályzat 4a. cikkével összhangban.

Egy fiókhoz egy családi és utónév vezetendő. A 2. bekezdés szerinti későbbi esetben beszerzett családi és utónév nem lép a már bejegyzett helyébe. Ha attól eltér, a gazdasághoz való csatlakozásra, a szövetkezeti tagság megszerzésére, a pártfogási kérelemre és a hívási listára való felkerülésre csak az eltérés megszüntetése után kerül sor, az adományt pedig nyilvántartásba veszik, és a bejegyzett név marad. A téves bejegyzést a Felhasználási feltételek 37a. cikke szerinti kifogással kell helyesbíteni.

A személyazonossági nyilvántartásba nem kerül be az egységes polgári azonosító szám, a személyi igazolvány száma, sem más okmányok adatai, és okmánymásolatok nem kerülnek megőrzésre. Ha az Alapítvány a családi és utónevet okmánnyal vagy nyilvános nyilvántartással veti össze, csak az összevetés megtörténtének ténye kerül rögzítésre.

A személyazonossági nyilvántartásban szereplő családi és utónév nem kerül be a hozzájárulási nyilvántartásba, és más felhasználók számára nem jelenik meg. Kizárólag az Alapítvány adminisztrátori csoportja és maga a felhasználó számára hozzáférhető, valamint annak a Kolo-tagnak, aki a hívási listán szereplő felhasználót megismerkedés céljából felhívja, a valóságbizonyítékról szóló szabályzat 4a. cikkében megállapított terjedelemben és feltételekkel. A családi és utónevet a többszörös fiókok megelőzése érdekében a más fiókokhoz tartozó nevekkel vetik össze (a valóságbizonyítékról szóló szabályzat 4a. és 4b. cikke); az összevetés során más felhasználó előtt sem a másik fiók neve, sem álneve nem kerül felfedésre. A bejegyzés nem hitelesítés, soha nem erősíti meg a valóságot, és nem változtatja meg a felhasználó jogállását; a valóság kizárólag a megerősítési láncban nyer megerősítést. A bejegyzés nem feltétele a valóságbizonyítéknak és a rendszer funkcióihoz való hozzáférésnek, kivéve a 2. bekezdés szerinti részvételt.

Kiskorú felhasználóra személyazonossági nyilvántartás nem vezetendő.

A családi és utónév a felhasználói jogállás megszűnésével (34. cikk) törlésre kerül a személyazonossági nyilvántartásból.

### 32. cikk

A felhasználó valódisága kizárólag a megerősítési láncon keresztül nyer megerősítést: a Kolo-tagok megerősítik azoknak a felhasználóknak a valódiságát, akiket személyesen ismernek, vagy beszélgetést követően bevezetik őket a Kolóba, a megerősítés nélküli tagok pedig bevezetik a Kolóba azokat a felhasználókat, akiket személyesen ismernek. A felhasználó főszabály szerint azért válik Kolo-taggá, mert valaki, aki már Kolo-tag, ismeri őt, és megerősíti, hogy létezik.

A felhasználó valódiságát egy hitelesítő állapítja meg, egy hitelesítéssel — megerősítéssel vagy a Kolóba való bevezetéssel. A felhasználó vagy a Kolóban van, vagy nem; a Kolóhoz való tartozásnak nincsenek fokozatai, a megerősítés és a Kolóba való bevezetés közötti különbség pedig csak azokat a cselekményeket határozza meg, amelyeket az Alapítvány aktusai a Kolo-taghoz kötnek. A hitelesítés meghatározza a rendszer funkcióihoz való hozzáférést, a megerősítettség pedig a mások valódiságának megerősítésére való jogot is. A hitelesítő által végezhető hitelesítések száma nem korlátozott; a megerősítés ütemét a valóságbizonyítékról szóló szabályzat rendezi.

A megerősítési láncban tett megerősítések összessége alkotja a hitelesítési gráfot. A hitelesítési gráf személyes adatok nyilvántartása; azon az infrastruktúrán vezetendő, amelyen a Protokoll működik, adattakarékosság mellett. A gráf a felügyeleti adatokat is felöleli — a felügyelet eredményét, gyanú kifejezése esetén pedig a gyanú alanyát és az indok kódját is (a valóságbizonyítékról szóló szabályzat 11. cikke). Ezek az adatok nem nyilvánosak, és rájuk a jelen szabályzat 67. cikke alkalmazandó.

A hitelesítés lefolytatásához szükséges kapcsolatot a felhasználó a platform hirdetési terén keresztül létesíti (16. cikk), olyan hirdetés közzétételével, amellyel bemutatkozik a Kolo-tagoknak, valamint a Felhasználási feltételekben megállapított beszélgetési kérelem útján. E út megléte nem változtatja meg az e szabályzatban és a valóságbizonyítékról szóló szabályzatban megállapított hitelesítés természetét, eljárását vagy feltételeit. A közzététel, a tartalom és az adatkezelés szabályait a Felhasználási feltételek és az Adatvédelmi szabályzat állapítják meg.

Legalább 5.000 dinár összegű nyilvános adomány befizetése, a pénzbeli pártfogás és a Mezőgazdasági Gazdaságok Nyilvántartásába bejegyzett gazdaság bejelentése nem erősíti meg a valóságot. Amikor az Alapítvány megállapítja az ilyen befizetés beérkezését, illetve megkapja az ilyen bejelentést, és a befizetőre, a kérelmet benyújtóra, illetve a gazdaság birtokosára vonatkozó adatokat összeveti a fiókkal, a felhasználó felkerül a hívási listára: egy Kolo-tag megismerkedés céljából felhívja, és a beszélgetést követően bevezetheti a Kolóba. Az adomány és a pártfogás alapján történő hozzájárulás-nyilvántartás nem függ a hívástól. A lista, a hívás és a megerősítés feltételeit a valóságbizonyítékról szóló szabályzat állapítja meg.

A megerősítés szabályait és a megerősítési lánccal való visszaélés elleni intézkedéseket külön szabályzat állapítja meg.

### 33. cikk

A felhasználói jogállás kilépéssel, kizárással vagy halállal szűnik meg.

A kilépés a jogállás önkéntes megszűnése a felhasználó elektronikus nyilatkozata alapján, felmondási idő nélkül.

A kizárás a jogállás megszűnése az Alapítvány határozatával, a rendszer szabályainak súlyosabb megsértése miatt.

A felhasználó rendszerfunkciókhoz való hozzáférése felfüggesztéssel ideiglenesen korlátozható; a felfüggesztés ideje alatt a felhasználó megtartja jogállását, de nem használhatja azokat a funkciókat, amelyekre a felfüggesztés vonatkozik.

A jogállás megszűnésének és a felfüggesztésnek az okait, eljárását és mechanikáját minden módozat tekintetében a Felhasználási feltételek rendezik.

### 34. cikk

A jogállás megszűnésével a felhasználó aktív ZRNO-ja szabad állapotba kerül, majd a teljes szabad ZRNO leírásra kerül, és visszakerül a Protokoll rendelkezésre álló ZRNO-i közé. A ZRNO jogállás megszűnésekor történő leírása nem indítja el a POEN elszámolási együttható szerinti nyilvántartásba vételét.

A felhasználó POEN-bejegyzései megsemmisítésre kerülnek, a Protokoll megfelelő ellenbejegyzése pedig ugyanazzal az összeggel csökken. A zéró összegű invariáns fennmarad. Az e szabályzat 14. cikkének 3. bekezdése szerint keletkezett negatív POEN-bejegyzés a jogállás megszűnésével nem semmisül meg, és nem száll át a Protokollra, hanem az e cikk szerinti álnevesített számszerű előzmény mellett marad; ellenkező esetben a rendszerből való kilépés törölné a megtérítést, a terhet pedig a többi felhasználó viselné.

A POEN-bejegyzések megsemmisítése és a ZRNO-k rendelkezésre állóvá tétele mindkét szinten megváltoztatja az elszámolási együtthatót — csökken a számláló (a nyilvántartásba vett POEN-ek összessége) és nő a nevező (a rendelkezésre álló ZRNO-k).

A felhasználó részére pénzbeli térítés nem kerül kifizetésre.

A jogállás megszűnésével megindul a felhasználó adatainak álnevesítése: törlésre kerül az elektronikus cím, az önkéntesen megadott adatok és a személyazonossági nyilvántartásban szereplő családi és utónév (31a. cikk), anonimizálásra kerülnek a felhasználó kapcsolatai a hitelesítési gráfban, a számszerű előzmény pedig olyan álnév alatt marad meg, amely nem utal a névre. Az Alapítvány megőrzi a fiók belső azonosítóját, így a megőrzött bejegyzések továbbra is személyes adatnak minősülnek; azért kerülnek megőrzésre, mert a törléshez való jog nem alkalmazandó, ha az adatkezelés a megőrzésre vonatkozó jogi kötelezettség teljesítéséhez, valamint jogi igények előterjesztéséhez, érvényesítéséhez vagy védelméhez szükséges (az Adatvédelmi szabályzat 11. cikke).

A POEN- és ZRNO-bejegyzések nem öröklődnek vagyoni jogként. A nyilvántartással való eljárást a felhasználó halála esetén a Felhasználási feltételek részletezik.

## VI — Hozzájárulás a közjóhoz

### 35. cikk

A közjó nem keletkezik magától — hozzájárulásból keletkezik. A felhasználók közötti, a meglévő POEN-eket újraosztó javak- és szolgáltatáscserén túl a rendszer új POEN-eket vesz nyilvántartásba az e szabályzat 15. cikkében megállapított csatornákon keresztül. Ez a fejezet e csatornák közül ötöt fejt ki — a működési hozzájárulást, az adományokat, a pártfogást, az alapítói hozzájárulást és a platform tartalmához való hozzájárulást. A felhasználók hitelesítését mint hozzájárulási formát a valóságbizonyítékról szóló szabályzat rendezi. A kollektív formák növekedésének és a szociális programoknak a csatornáit a VIII. fejezet rendezi a rendszer moduljaiként.

A nyilvántartásba vétel paramétereit, eljárásait és korlátozásait külön szabályzatok állapítják meg.

### 36. cikk

A működési hozzájárulás a platformon kívüli tevékenység, amelynek hozzájárulása a végrehajtás hitelesítését követően kerül nyilvántartásba POEN-ben.

Az Alapítvány, a Felső Kolo vagy a Kolo-őrzők olyan feladatot tesznek közzé, amelyet a közjó érdekében el kell végezni. A felhasználó önkéntesen jelentkezik a feladat végrehajtására. A végrehajtást követően a Kolo-őrzők a hozzájárulás nyilvántartásba vétele előtt hitelesítik a végrehajtást. Az 1. szakaszban, amíg a Felső Kolo nem jött létre, a hitelesítési funkciót az Alapítvány Igazgatótanácsának tagjai vagy az Igazgatótanács által felhatalmazott személy látják el, a működési hozzájárulásról szóló szabályzattal összhangban. Valamennyi jelentkezés nyilvánosan látható a rendszer valamennyi felhasználója számára.

A működési hozzájárulás a tevékenységek széles körét ölelheti fel — a helyi rendezvény szervezésétől az infrastruktúrán végzett technikai munkán át a rendszer közösségbeli népszerűsítéséig.

A működési hozzájárulás nem hoz létre munkaviszonyt a munkatörvény 5. cikke értelmében, és nem minősül munkaviszonyon kívüli munkavégzésnek sem — különösen nem vállalkozási szerződésnek. Hiányzik a megrendelő, a megrendelt szolgáltatás és a díjazás: a feladatot nem az Alapítvány nevében rendelik meg, hanem a közjó szükséglete okán teszik közzé, a teljesítő önállóan dönt arról, jelentkezik-e és hogyan végzi el a feladatot, az Alapítvány pedig az elvégzett feladat alapján semmilyen értéket nem kap és semmilyen jogot nem szerez a teljesítővel szemben. Részletesen a működési hozzájárulásról szóló szabályzat rendezi.

A működési hozzájárulás jelentkezési, végrehajtási és hitelesítési eljárását külön szabályzat állapítja meg.

### 37. cikk

Az alapítói hozzájárulás a platform megnyitása előtt végzett munka — a rendszer tervezése, a protokoll elkészítése, valamint a jogi és szervezési előkészítés —, amelynek hozzájárulása utólag kerül nyilvántartásba POEN-ben.

Az alapítói hozzájárulás természeténél fogva olyan működési hozzájárulás, amelyet még a rendszer létezése előtt végeztek el. A Protokoll ezt a hozzájárulást utólag, külön csatornán keresztül veszi nyilvántartásba.

Az alapítói hozzájárulás nyilvántartásba vétele fokozatos, rögzített összegű lépésekben, a POEN-ek teljes számának halmozott növekedéséhez kötve.

Az alapítói hozzájárulás korlátozott. Amikor a Protokoll az előre megállapított felső határig a teljes összeget nyilvántartásba veszi, a csatorna véglegesen bezárul.

Az e csatornán keresztül nyilvántartásba vett POEN-ek az alapítói hozzájárulásról szóló szabályzat értelmében vett alapítók — a platform megnyitása előtt munkát végző természetes személyek — bejegyzéseiben kerülnek rögzítésre, és ugyanolyan jogállással bírnak, mint minden más POEN. Az alapítói hozzájárulás önálló nyilvántartásba vételi csatorna, és nem érinti a működési hozzájárulás korlátját.

Az alapítói hozzájárulás felső határát, a nyilvántartásba vételi lépések összegét és ütemezését, valamint azt a pontot, amelyen a csatorna bezárul, külön szabályzat állapítja meg.

### 38. cikk

A pénzügyi hozzájárulás dináros bevétel az Alapítványba természetes személyek adományai, valamint jogi személyek, egyéni vállalkozók és bejegyzett mezőgazdasági termelő gazdaságok birtokosainak pártfogása alapján.

Mindkét forma ugyanazon az elven nyugszik: az Alapítványnak nyújtott vissza nem térítendő adomány, amelynek hozzájárulása a Protokoll automatikus aktusaként POEN-ben kerül nyilvántartásba. A dináros eszközök az Alapítványba kerülnek, és nem lépnek be a rendszer elszámolási keretébe.

Amikor a dináros bevételek meghaladják az Alapítvány működési költségeit, a többlet a rendszer programjaiba irányul. A többlet elosztásának szabályait az 1. szakaszban az Alapítvány alapítója és az Alapítvány, a 2. szakaszban a Felső Kolo állapítja meg.

### 39. cikk

A természetes személy adománya adományozási szerződés alapján az Alapítványba érkező dináros bevétel.

Az adomány beérkezését az Alapítvány állapítja meg, a befizetőre vonatkozó adatokat a felhasználó fiókjával összevetve. A fizetési közvetítő teljesített terhelésről szóló jelentése nem a beérkezés megállapítása, hanem alap arra, hogy a fizetés bekerüljön ebbe az eljárásba.

A megállapított beérkezést követően a Protokoll a hozzájárulást POEN-ben bejegyzi az adományozó nyilvántartásába, a külön szabályzatban megállapított bejegyzési paraméterek szerint. A POEN bejegyzése a Protokoll automatikus aktusa, és a POEN tekintetében nem hoz létre szerződéses viszonyt az adományozó és az Alapítvány között.

Az Alapítvány az adományozó kérésére a törvénnyel összhangban igazolást állít ki az adományról. Az adomány adójogi kezelése az adományozó jogállásától, az Alapítvány bejegyzett jogállásától és az adományozás idején hatályos adóelőírásoktól függ.

Az adományok nyilvántartásba vételének paramétereit, ideértve az adományok nyilvántartási együtthatóját és az adományszinteket, külön szabályzat állapítja meg.

### 40. cikk

A pártfogó az a jogi személy vagy egyéni vállalkozó, amely pénz, áru vagy szolgáltatás adományozásával támogatja az Alapítvány működését, valamint a bejegyzett mezőgazdasági termelő gazdaság birtokosa, aki pénz adományozásával vagy áruval és szolgáltatással nyújtott pártfogással támogatja az Alapítvány működését. A pártfogó nem felhasználója a rendszernek, és nem kap sem POEN-t, sem ZRNO-t.

A pártfogási hozzájárulás annak a természetes személynek a bejegyzésében kerül nyilvántartásba, aki a rendszer felhasználója — a jogi személy tulajdonosa, illetve maga az egyéni vállalkozó vagy a bejegyzett mezőgazdasági termelő gazdaság birtokosa.

Az Alapítvány és a pártfogó közötti viszonyt adományozási szerződés rendezi. Minden adomány a beérkezés pillanatában kerül nyilvántartásba. Az Alapítvány nyilvántartást vezet a pártfogó és azon felhasználó közötti kapcsolatról, akinek a hozzájárulása nyilvántartásba kerül. A tényleges tulajdonos azonosításának eljárását és a többszörös, valamint közvetett tulajdonlás eseteire vonatkozó szabályokat külön szabályzat állapítja meg.

### 40.a cikk

*A platform tartalmához való hozzájárulás*

A felhasználók által a rendszerben létrehozott tartalom a közjó része, és e szabályzat 7. cikkével összhangban kerül licencelésre. A platform hirdetési tere tartalom nélkül nem tölti be rendeltetését; az a felhasználó, aki azt először tölti meg saját ajánlatával, ezt a hiányt szünteti meg, és ezzel hozzájárul a közjóhoz.

A felhasználó javára 1.000 POEN összegű hozzájárulás kerül nyilvántartásba az első olyan hirdetésért, amellyel javat vagy szolgáltatást kínál, és amely megfelel a Felhasználási feltételekben megállapított tartalmi minimumnak. E hozzájárulás felhasználónként legfeljebb egyszer kerül nyilvántartásba, a közzétett hirdetések számától függetlenül.

A hirdetés azonnal közzétételre kerül, a hozzájárulás pedig a közzététel pillanatában feljegyzésre kerül, és akkor kerül nyilvántartásba a Protokollban, amikor az Alapítvány jóváhagyja a hirdetést. Ez minden felhasználóra vonatkozik, függetlenül attól, hogy a Kolóban van-e.

A nyilvántartásba vételig a hozzájárulás nem minősül POEN-bejegyzésnek, és nem számít bele a rendszerben nyilvántartásba vett POEN-ek teljes számába. Az Alapítvány jóváhagyása nélkül a hozzájárulás nem kerül nyilvántartásba; a felhasználó hitelesítése a megerősítési láncban és a POEN-nyilvántartás javára történő frissítése nem alapozza meg a nyilvántartásba vételt.

Az Alapítvány a jóváhagyásról ésszerű határidőn belül dönt, ellenőrizve, hogy a hirdetés megfelel-e a tartalmi minimumnak, és hogy jószág vagy szolgáltatás tényleges kínálatát jelenti-e. Ha a hozzájárulást nem hagyják jóvá, a felhasználót az indokok megjelölésével értesítik; a hirdetés ezzel nem kerül eltávolításra, a hozzájárulást pedig ugyanazon felhasználó kiegészített vagy új hirdetése kapcsán újra elbírálják.

A jóváhagyás célja annak megakadályozása, hogy a nyilvántartásba vett POEN-ek teljes száma még azelőtt növekedjék, hogy a rendszerben a tényleges részvétel nyoma megjelenne. A jóváhagyással az Alapítvány azt állapítja meg, hogy a feltétel teljesült — hogy a hirdetés megfelel a tartalmi minimumnak és valós ajánlatot jelent —, és nem arról dönt, hogy a felhasználónak nyilvántartásba vesz-e hozzájárulást. A jóváhagyott hirdetés egyben egyike azoknak a hozzájárulási formáknak, amelyek alapján a hitelesítésért nyilvántartott POEN beírásra kerül (a valóságbizonyítékról szóló szabályzat 7. cikke), így egyetlen döntéssel több bejegyzés kerül beírásra.

Ha a hirdetés a Felhasználási feltételek megsértése miatt eltávolításra kerül azelőtt, hogy a hozzájárulás nyilvántartásba került volna, a feljegyzett hozzájárulás megsemmisül. A már nyilvántartásba vett hozzájárulást a hirdetés eltávolítása nem semmisíti meg.

A platform tartalmához való hozzájárulás nyilvántartásba vétele a Protokoll automatikus aktusa, és nem számít bele a működési hozzájárulásról szóló szabályzatban és a támogatási programokról szóló szabályzatban megállapított napi korlátba.

Annak a felhasználónak, aki e bekezdés hatálybalépésének napján a Kolóban volt, és akinek hozzájárulása feljegyzésre került, de nyilvántartásba nem, a hozzájárulás egyszeri alkalommal, azonos összegben kerül nyilvántartásba.

### 40.c cikk

*A gazdaság hozzájárulása*

A platform hirdetési tere csak akkor tölti be rendeltetését, ha benne élelmiszerek és mezőgazdasági termékek állandó kínálata van jelen. Az a gazdaság, amely ilyen kínálattal csatlakozik a rendszerhez, kitölti ezt a teret, és ezzel hozzájárul a közjóhoz.

E szabályzat értelmében gazdaságnak minősül az a háztartás, amely élelmiszert vagy mezőgazdasági termékeket állít elő, függetlenül attól, hogy szerepel-e a Mezőgazdasági Gazdaságok Nyilvántartásában. A gazdaság nem a rendszer felhasználója, nem kollektív forma, és nincs bejegyzése a Protokollban.

Amikor az Alapítvány jóváhagyja a gazdaságot, a gazdaság tagjai javára a csatlakozás sorrendjében hozzájárulás kerül feljegyzésre: az első tag javára 5.000 POEN, a második–hatodik tag javára pedig egyenként 2.000 POEN. A hozzájárulás minden tag javára külön kerül feljegyzésre. Az e cikk szerinti hozzájárulás egy személyt legfeljebb egy gazdaság alapján illet meg: aki olyan gazdaságból lép ki, amely továbbra is fennáll, megtartja az e gazdaság alapján javára feljegyzett, illetve nyilvántartásba vett hozzájárulást, kivéve, ha a gazdaság később hamis nyilatkozat miatt szűnik meg, és azt más gazdaságban nem szerzi meg újra; ha hozzájárulását a gazdaság megszűnésekor megsemmisítették, illetve leírták, a személy azt más gazdaságban újra megszerezheti, kivéve, ha a gazdaság hamis nyilatkozat miatt szűnt meg.

A feljegyzett hozzájárulás akkor kerül nyilvántartásba a tag bejegyzésében, amikor mindkét feltétel teljesül: a tag közzétett olyan hirdetést, amellyel javat vagy szolgáltatást kínál, és amely megfelel a Felhasználási feltételekben megállapított tartalmi minimumnak, továbbá a Kolóban van. A hirdetésre vonatkozó feltételt a gazdasághoz való csatlakozás előtt közzétett hirdetés is teljesíti, akkor is, ha már nincs közzétéve; ha a tagnak az első hirdetésért járó, a 40a. cikk szerinti hozzájárulást már nyilvántartásba vették, a gazdaság hozzájárulása azonnal nyilvántartásba kerül, amint a másik feltétel is teljesül. A nyilvántartásba vételig a hozzájárulás nem minősül POEN-bejegyzésnek, és nem számít bele a rendszerben nyilvántartásba vett POEN-ek teljes számába.

A jóváhagyással az Alapítvány azt állapítja meg, hogy a feltételek teljesültek — hogy a bejelentés teljes, hogy az adatok valóságáról szóló nyilatkozatot megtették, és hogy a bejelentéshez csatolt hirdetések valós kínálatot jelentenek —, és nem arról dönt, hogy a tagnak nyilvántartásba vesz-e hozzájárulást. Az Alapítvány nem ellenőrzi az adatokat az állami nyilvántartásokban, és a bejelentő nyilatkozatára hagyatkozik; a Mezőgazdasági Gazdaságok Nyilvántartásából származó kivonatot nem kell csatolni a bejelentéshez.

Ha a jóváhagyott gazdaság megszűnik — mert az Alapítvány megállapítja, hogy az adatok valóságáról szóló nyilatkozat hamis, és érvényteleníti a gazdaság jóváhagyását, vagy a gazdaságokról szóló szabályzatban meghatározott más megszűnési okból —, a feljegyzett hozzájárulás megsemmisül, az e cikk alapján nyilvántartásba vett hozzájárulás pedig a gazdaság valamennyi, a megszűnés időpontjában tagnak minősülő tagjától leírásra kerül, a 14. cikk (3) bekezdésének 6. pontja szerinti jogalapon. Ha a gazdaság hamis nyilatkozat miatt szűnik meg, a megsemmisítés és a leírás minden olyan személyt is érint, aki abban az időszakban volt a gazdaság tagja, amelyre a hamis nyilatkozat vonatkozik, akkor is, ha időközben kilépett, és mindezen személyekkel szemben kizárást kell alkalmazni; a többi megszűnési ok esetén a korábban kilépett tag hozzájárulását ez nem érinti. Minden érintett személyt értesíteni kell a leírásról és a tőle leírt POEN számáról.

A gazdaság hozzájárulásának nyilvántartásba vétele a Protokoll automatikus aktusa, és nem számít bele a működési hozzájárulásról szóló szabályzatban és a támogatási programokról szóló szabályzatban megállapított napi korlátba.

A bejelentés feltételeit, a tagok csatlakozását, a gazdaság nevében közzétett hirdetéseket, a hazai termelők térképét, a gazdaság megszűnésének okait és a hamis nyilatkozat esetén követendő eljárást a gazdaságokról szóló szabályzat állapítja meg. Az e cikk szerinti tagszám és összegek e szabályzat módosítására vonatkozó eljárásban módosíthatók.

## VII — A rendszer irányítása

### 41. cikk

Minden rendszernek vannak szabályai, és valakinek meg kell alkotnia, módosítania és biztosítania kell azok alkalmazását.

A KOLO rendszer ezt a kérdést progresszív decentralizációval oldja meg — a centralizált irányítástól a decentralizált felé vezető strukturált pályával, mérhető átmeneti feltételekkel. Az irányítás az alapítónál és az Alapítványnál kezdődik, és fokozatosan átkerül a Közösséghez a Felső Kolón keresztül.

A Felső Kolo az Alapítvány külön testülete, amelyet e szabályzat hoz létre, az Igazgatótanácsnak az Alapszabályból eredő azon jogkörén alapulva, hogy szabályzattal tanácsadó és egyéb testületeket hozzon létre, amelyek részt vesznek a döntések előkészítésében, valamint a felhasználók véleményének összegyűjtésére szolgáló mechanizmusokat. Ezzel valósul meg az Alapítványnak az Alapszabályban rögzített célja — a demokratikus döntéshozatalon alapuló gazdasági modellek fejlesztése.

Ez a fejezet rendezi az irányítás két szakaszát, az egyikből a másikba való átmenet feltételeit, a Felső Kolo összetételét és döntéshozatali módját, a szavazatok delegálásának mechanizmusát, az Alapítvány védelmi vétóját és az irányítási hatalom korlátait. A szavazási eljárásokat és a Felső Kolo működésének operatív szabályait a Felső Kolóról szóló szabályzat állapítja meg.

### 42. cikk

A rendszer irányítása két szakaszban zajlik.

Az 1. szakaszban a Protokoll szabályait az alapító állapítja meg az Alapítvánnyal együttműködve. Az 1. szakasz addig tart, amíg a rendszerben nyilvántartásba vett POEN-ek teljes száma el nem éri az 1.000.000-t.

A 2. szakaszban a Felső Kolo válik a rendszer irányító testületévé. Az Alapítvány megtartja szolgáltatási és végrehajtói szerepét.

Az 1. szakaszból a 2. szakaszba való átmenet a küszöb elérésekor automatikusan áll be, és nem igényel külön határozatot.

### 43. cikk

Az 1. szakaszban az alapító mérlegelési jogkörrel rendelkezik a rendszer szabályainak módosítására és a paraméterek első tapasztalatok alapján történő kiigazítására.

Az alapító mérlegelési jogköre nem korlátlan. Az alapító nem módosíthatja a négy elvet, nem változtathatja meg azokat a licenceket, amelyek alatt a közjó közzétételre került, és nem sajátíthatja ki a közjót.

Az alapító mérlegelési jogkörének korlátai e szabályzatba mint az Alapítvány normatív aktusába, és egyidejűleg a rendszer technikai architektúrájába is beépítettek.

A rendszer szabályait az Alapítvány aktusai állapítják meg, amelyeket Igazgatótanácsa fogad el. Az alapító mérlegelési jogköre javaslattétel és az Alapítvány munkájában való részvétel útján érvényesül, az Alapszabállyal összhangban.

### 44. cikk

Az 1. szakaszból a 2. szakaszba való átmenet küszöbe 1.000.000 nyilvántartásba vett POEN a rendszerben.

A küszöb elérése egyidejűleg aktiválja a ZRNO beírásának lehetőségét, és létrehozza a Felső Kolót.

Az Alapítvány Igazgatótanácsa késedelem nélkül elfogad és közzétesz egy aktust, amelyben megállapítja, hogy az átmenet feltételei teljesültek. Ez az aktus deklaratív jellegű — az átmenet a küszöb elérésével áll be, nem az aktus elfogadásával.

Az elszámolási logikában az egymillió nyilvántartásba vett POEN küszöbe a Protokoll bejegyzésének −1.000.000-s állásának felel meg.

### 45. cikk

A Felső Kolo a rendszer irányító testülete, amelyet a ZRNO-t aktivált Kolo-őrzők alkotnak. Aktiválással a ZRNO szavazati erővé válik; a szabad ZRNO nem ad helyet a Felső Kolóban.

A Felső Kolo összetételét nem kinevezés, hanem az e szabályzatban előírt feltétel teljesítése határozza meg: a Kolo-őrző a ZRNO aktiválásával lép be a Felső Kolo összetételébe, és abból akkor lép ki, amikor egyetlen ZRNO-ja sem aktív többé, illetve valóságmegerősítésének megszűnésével (30. cikk). Az a megerősítés nélküli tag, akinek ZRNO-t írtak be, nem tagja a Felső Kolónak, amíg meg nem erősítik (28a. cikk). Mivel az aktív ZRNO-k száma és a szavazati erő folyamatosan változik, a Felső Kolo összetételét és minden Kolo-őrző szavazati erejét a Protokoll nyilvántartásából minden elszámolási időszakra külön kell megállapítani, és azok csak az adott időszak alatt érvényesek.

A Felső Kolo az e szabályzat 44. cikkében meghatározott küszöb elérésével jön létre. Ettől kezdve a ZRNO-t aktivált Kolo-őrzők alkotják, ideértve az alapítókat is.

A Felső Kolo dönt a Protokoll szabályairól, a modulok aktiválásáról és deaktiválásáról, valamint minden olyan kérdésről, amely a közjót érinti, kivéve azokat a kérdéseket, amelyek e szabályzattal összhangban ki vannak véve hatásköréből. A Felső Kolo határozatát az Alapítvány Igazgatótanácsához kell címezni, és azt e szabályzat 51. cikkében megállapított módon kell végrehajtani.

A Felső Kolo nem jogi személy, és nem tartozik az Alapítványnak az Alapszabályban megállapított szervei közé — az Alapítvány szervei az Igazgatótanács és az Igazgató. A Felső Kolo nem képviseli az Alapítványt, nem rendelkezik annak vagyonával, és nem vállal kötelezettséget a nevében. A Felső Kolo határozata nem keletkeztet közvetlenül jogokat vagy kötelezettségeket harmadik személyekkel szemben.

### 46. cikk

A Felső Kolo négyzetes szavazással hoz döntéseket — olyan mechanizmussal, amelyben a szavazati erő a Kolo-őrző aktív ZRNO-inak számából vont négyzetgyök lefelé kerekített egész értékével egyenlő.

A szabad ZRNO nem ad szavazati erőt. Az a Kolo-őrző, aki szavazni kíván, köteles aktiválni a ZRNO-t, amivel lemond a leírás lehetőségéről, amíg azt szabad állapotba vissza nem állítja.

A ZRNO nem fogy el a szavazással. A szavazati erő az aktivált ZRNO-ból ered, nem a POEN-ek számából és nem a dináros adományokból.

A döntések fajtáit, a döntéshozatali küszöböket, a határozatképességet és a szavazási eljárást a Felső Kolóról szóló szabályzat állapítja meg.

### 47. cikk

Azok a Kolo-őrzők, akik nem kívánnak vagy nem tudnak részt venni a szavazásban, szavazataikat más Kolo-őrzőre delegálhatják. A megerősítés nélküli tagnak nincs szavazata, így nem is delegál (28a. cikk).

A delegálás általános — a delegált a delegáló nevében valamennyi kérdésben szavaz, amíg a delegálás tart.

A delegált szavazatok összeadódnak a delegált saját szavazataival.

A delegálás szabályait, ideértve a visszavonás hatásait és a delegálás korlátait, a Felső Kolóról szóló szabályzat állapítja meg.

### 48. cikk

Az Alapítványnak joga van megtagadni a Felső Kolo olyan határozatának végrehajtását, amely veszélyeztetné az Alapítvány működési és pénzügyi fenntarthatóságát azelőtt, hogy elérné a pénzügyi önállóságot — különösen a dináros eszközök elköltéséről szóló határozatokét (ideértve a kollektív beszerzéseket), amelyek rontanák az Alapítvány képességét az alapvető költségek fedezésére és a rendszer infrastruktúrájának fenntartására.

A védelmi vétó nem mérlegelési jellegű. Az Alapítvány köteles minden vétót az Alapítvány fenntarthatóságát fenyegető konkrét veszélyre hivatkozva megindokolni. Az indokolás nélküli vétó olyan visszaélés, amely e szabályzattal összhangban felelősséget von maga után.

### 49. cikk

A védelmi vétó véglegesen és egyirányúan megszűnik, amikor az Alapítvány pénzügyi eszközei elérik a külön szabályzatban megállapított pénzügyi önállósági küszöböt.

A vétó megszűnése visszafordíthatatlan.

A vétó megszűnése nem szünteti meg az Igazgatótanács jogszabályi kötelezettségeit.

### 50. cikk

A Felső Kolo hatalma nem korlátlan. Három korlát van beépítve a rendszerbe.

Az első korlát a négy elv. A Felső Kolo egyetlen határozata sem szüntetheti meg a nem konvertálhatóságot, nem vezethet be vagyoni jogot a bejegyzések felett, nem teheti visszatéríthetővé az adományokat, és nem hagyhatja el az adattakarékosság elvét.

A második korlát az Alapítvány védelmi vétója, amíg hatályban van, valamint az Igazgatótanács jogszabályi kötelezettségei a vétó megszűnése után.

A harmadik korlát a közjó licencei. A Felső Kolo nem cserélheti fel az AGPL-3.0 és a CC BY-SA 4.0 licenceket korlátozóbbakra.

### 51. cikk

A 2. szakaszban az Alapítvány megtartja szolgáltatási szerepét — biztosítja és fenntartja az infrastruktúrát, képviseli a rendszert a jogforgalomban, és végrehajtja a Felső Kolo határozatait. Az Alapítvány a Protokoll szabályairól nem saját belátása szerint dönt, hanem a Felső Kolo határozata szerint jár el, a törvény és az Alapszabály keretei között, az Igazgatótanács jogszabályi felelősségeinek fenntartása mellett.

A Felső Kolo határozatát az Igazgatótanács a megfelelő aktus elfogadásával hajtja végre. Az Igazgatótanács köteles ezt az aktust késedelem nélkül elfogadni, és eközben nem mérlegeli a határozat célszerűségét.

Az Igazgatótanács csak akkor tagadhatja meg a határozat végrehajtását, ha az törvénybe ütközik, az Alapítvány Alapszabályába ütközik, e szabályzat 50. cikke szerint a Felső Kolo hatásköréből kivett kérdésre irányul, vagy a 48. cikk szerinti védelmi vétó alá esik, amíg az fennáll. Más megtagadási ok nem létezik és nem is állapítható meg.

A megtagadást az előző bekezdés szerinti konkrét okra hivatkozva indokolni kell, és azt a határozattal együtt közzé kell tenni, amelyre vonatkozik. A Felső Kolo a határozatot úgy módosíthatja, hogy a megállapított okot elhárítsa, és arról ismét dönthet.

A dináros eszközök elosztása tekintetében a Felső Kolo ajánlásokat intéz az Alapítvány Igazgatótanácsához. Az Igazgatótanács megvizsgálja az ajánlásokat, és a zálogalapokról és alapítványokról szóló törvény szerinti jogszabályi hatáskörén belül alkalmazza őket, minden ajánlásra indokolt választ adva.

### 51a. cikk

Az Alapítvány működési költségeit meghaladó, dinárban meglévő eszközei a közösség javára szolgáló projektekre oszthatók el.

A kollektív beszerzés olyan projekt, amelynek keretében az Alapítvány dinárban meglévő eszközökből harmadik személytől javakat szerez be, a résztvevők pedig azokat egyenlő részekben veszik át, az e szabályzat 14a. cikke szerinti POEN-bejegyzések érvénytelenítése mellett.

A projektről és annak valamennyi paraméteréről a Felső Kolo dönt. A döntés a dinárban meglévő eszközök elosztására vonatkozik, ezért az e szabályzat 51. cikke értelmében az Alapítvány Igazgatótanácsához intézett ajánlás jellegével bír, és a 48. cikk szerinti védelmi vétó alá esik.

A Felső Kolo 2. szakaszban történő megalakulásáig a döntést az Alapítvány Igazgatótanácsa hozza meg, ugyanabban az eljárásban és ugyanolyan közzététellel.

Azzal a harmadik személlyel szemben, akitől a javakat beszerzik, az Alapítvány a vevő és a szerződő fél. E rendelkezés nem érinti azt a szabályt, hogy az Alapítvány nem részese a felhasználók közötti cserének.

A projektekre rendelkezésre álló eszközöket, a beszerzés tárgyának javaslását és kiválasztását, az ajánlatok begyűjtését és a kalkulációt, a jelentkezést, a sorrendet és az átvételt, valamint a bejegyzések érvénytelenítésének mértékét és időpontját külön szabályzat állapítja meg.

### 52. cikk

Az Alapítvány megszűnése esetén a közjó nem szűnik meg létezni. A szoftver és a tartalom a licencek feltételei szerint hozzáférhető marad.

A nyilvántartás és az infrastruktúra arra a jogutódra száll át, amely elfogadja a rendszer elveit, és vállalja a közjó őrzésének kötelezettségét.

Az átruházás szabályait az Alapszabály és az Alapítvány külön aktusa állapítja meg.

## VIII — A rendszer moduljai

### 53. cikk

A KOLO rendszer elválasztja az alaprendszert a moduloktól. Az alapot azon elemek minimális köre alkotja, amelyek nélkül a rendszer nem létezik. A modulok olyan bővítmények, amelyek funkcionalitást adnak az alaphoz, és saját előfeltételeik szerint aktiválódnak.

Ez a fejezet kereti szinten rendezi a modulokat — az egyes modulok operatív szabályait külön szabályzatok állapítják meg.

A modulok között megkülönböztetendők a kollektív formák — a Kör és a Szövetkezet — mint a felhasználókat tartósabb szerkezetekbe kapcsoló szervezeti egységek, valamint a többi modul, amely a részvétel különleges rendjeit rendezi.

### 54. cikk

A modul olyan bővítmény, amely funkcionalitást ad az alaprendszerhez.

A modulok aktiválásának sorrendje a Közösség szükségleteitől függ, és nincs előre megállapítva.

Új modulok az 1. szakaszban az Alapítvány, a 2. szakaszban a Felső Kolo határozatával adhatók hozzá, feltéve hogy nem sértik a rendszer elveit.

A Felső Kolo előző bekezdés szerinti határozatát e szabályzat 51. cikkében megállapított módon kell végrehajtani.

Ha a modul aktiválása személyes adatok új kezelését vezeti be, a modult aktiváló aktust az adatvédelmi hatásvizsgálat előzetes frissítését követően kell elfogadni.

### 55. cikk

A Kör közös érdeken vagy tevékenységen alapuló kollektív forma.

A Körök a felhasználók társulásával jönnek létre. A hatályos törvények szerint bejegyzett meglévő egyesületek és szövetkezetek átvihetik szerkezetüket olyan körbe, amely leképezi összetételüket és szervezetüket.

A Körök ösztönző funkcióval bírnak a növekedési mechanizmuson keresztül — a Protokoll új POEN-eket vesz nyilvántartásba a kör tagjainak számával és a meghatározott küszöbök elérésével összhangban. Az e mechanizmussal keletkezett POEN-ek a kör mint szervezeti egység bejegyzésében kerülnek nyilvántartásba.

A Kör nem rendelkezik jogalanyisággal. Az a egyesület vagy szövetkezet, amely kört alakít, a körtől függetlenül megtartja jogalanyiságát.

A körök alapításának, működésének és megszűnésének szabályait külön szabályzat állapítja meg.

### 56. cikk

A Szövetkezet területi elven alapuló kollektív forma, a szövetkezetekről szóló törvény szerint bejegyezve, teljes jogalanyisággal.

A Szövetkezetnek a rendszeren belül két funkciója van. Az első a helyi koordináció — az a szerkezet, amelyen keresztül az általa lefedett területen zajlik a csere, a kommunikáció és a tevékenységek szervezése. A második a növekedési mechanizmus — a felhasználói létszámküszöbök elérése POEN-ben kerül nyilvántartásba a szövetkezet bejegyzésében, ugyanazon mechanizmus szerint, mint a Köröknél.

Az Alapítvány és a szövetkezet közötti viszonyt együttműködési szerződés szabályozza, miközben a szövetkezet független jogi személyként megtartja teljes önállóságát. A szövetkezet nem válik a közjó egyetlen részének tulajdonosává sem.

A szövetkezetnek mint a szövetkezetekről szóló törvény szerint bejegyzett jogi személynek saját jogszabályi kötelezettségei vannak — üzleti könyvek vezetése, éves beszámolás és a szövetkezeti elvek tiszteletben tartása.

Az a Kör, amelynek tagjai szövetkezetként jegyeztetik be magukat, ugyanazzal a bejegyzéssel szövetkezetként folytatja működését; a tagok számának elért küszöbe csak egyszer kerül nyilvántartásba.

A szövetkezet bejegyzéséből és bejegyzésébe a POEN kizárólag külön szabályzatban megállapított jogcímmel kerülhet át nyilvántartás-frissítéssel; a jogcím nélküli nyilvántartás-frissítés nem megengedett.

A szövetkezetnek a rendszerben való részvétele megszűnésével a szövetkezet bejegyzése lezárul, a benne nyilvántartásba vett POEN pedig a Protokoll javára szóló ellenbejegyzéssel érvénytelenítésre kerül. Az érvénytelenítés kizárólag a bejegyzésben meglévő POEN-számra terjed ki, így a szövetkezet bejegyzése ezáltal nem megy át negatív értékbe, a nyilvántartásba vett POEN-ek összesített száma pedig csökken.

A részvétel feltételeit, a szövetkezeti tagokat, a növekedési küszöböket, a bejegyzés jogcímeit, a javak elosztását és a szövetkezeti hozzájárulást a szövetkezetekről szóló szabályzat állapítja meg.

### 57. cikk

A szociális programok a POEN automatikus nyilvántartásba vételének mechanizmusát jelentik azon felhasználói csoportok számára, amelyeknek a közjóban való szerkezeti részvételét a Protokoll elismeri akkor is, ha az nem egyedi tevékenységekben nyilvánul meg.

Az új POEN-ek minősített csoportok javára történő automatikus nyilvántartásba vétele újraelosztó hatással bír: az új bejegyzések növelik a rendszerben nyilvántartásba vett POEN-ek teljes számát, amivel valamennyi felhasználó számára megváltoztatják az elszámolási együtthatót. Ez a hatás tudatos tervezési döntés — a rendszer elismeri, hogy a természeténél fogva folyamatos és szétterülő részvétel nem vehető nyilvántartásba egyedi tevékenységeken keresztül.

A kezdeti minősített csoportok az anyák (elsődleges gondviselők), az idősebb felhasználók, a nehéz körülmények között élő felhasználók és a tanulmányokat folytató felhasználók. Új csoportok az 1. szakaszban az Alapítvány, a 2. szakaszban a Felső Kolo határozatával adhatók hozzá.

A minősített csoporthoz tartozó résztvevő megadja az e jogállást alátámasztó adatokat; a feltételek teljesülését egy Kolo-tag erősíti meg, a kérelmet pedig az Alapítvány hagyja jóvá, külön szabályzattal összhangban. A jóváhagyást követően a Protokoll automatikusan új POEN-bejegyzéseket ír be az adott támogatott személy javára, konkrét tevékenység szükségessége nélkül.

A szociális programokban való automatikus nyilvántartásba vétel nem térítés — nem fizet meg semmilyen munkát, szolgáltatást vagy más szolgáltatást, és a támogatott személytől cserébe semmit nem kérnek az Alapítvány felé. A programokat az Alapítvány Alapszabálya 6. cikkében megállapított céljainak megvalósítása érdekében hajtják végre, különösen a sérülékeny társadalmi csoportok szociális védelme és szolidáris támogatása, valamint a polgárok kölcsönös segítségnyújtás céljából történő önkéntes társulásának támogatása érdekében, és lehetővé teszik a támogatott személy egyenrangúbb részvételét a rendszerben.

A szociális programok a személyes adatok különleges kategóriáinak hitelesítését igénylik a személyes adatok védelméről szóló törvény értelmében. Ezen adatok kezelésének jogalapja a támogatott személy kifejezett hozzájárulása. A hozzájárulás bármikor visszavonható, aminek következménye a POEN automatikus nyilvántartásba vételének megszűnése.

A minősített csoportokat, a jogállás hitelesítésének feltételeit és a nyilvántartásba vétel paramétereit külön szabályzat állapítja meg. E modul aktiválása az adatvédelmi hatásvizsgálat frissítését igényli.

### 58. cikk

Ez a modul határozza meg a rendszer kiskorú felhasználóira vonatkozó jogok, korlátozások és védelem különleges rendjét, a tizenöt évnél fiatalabb személyekre vonatkozó további korlátozásokkal, a személyes adatok védelméről szóló törvény 16. cikkével összhangban.

A kiskorú személy önállóan is nyithat fiókot, de a fióknak a szülő vagy törvényes képviselő beleegyezéséig csak profilja és személyes találkozáskor kódszkenneléssel kötött barátságai vannak, a rendszer egyéb funkciói és a hozzájárulás nyilvántartásba vétele nélkül (a gyermekek részvételéről szóló szabályzat 4c. cikke). A szülői beleegyezés a részvétel feltétele, nem a fióknyitás feltétele.

A kiskorú felhasználó rendszerbeli tevékenységének terjedelme korlátozott. A kiskorú felhasználó a tizennyolcadik életév betöltéséig nem írhat be ZRNO-t, és nem vehet részt az irányításban a Felső Kolón keresztül.

A kiskorúak adatainak kezelése fokozott követelmények alá esik. A szülő vagy törvényes képviselő beleegyezése az adatkezelés jogi előfeltétele.

A szülő felel a kiskorú felhasználó rendszerbeli cselekményeiért.

A hozzáférés szabályait, az engedélyezett tevékenységek terjedelmét, a csere korlátait, a 15. cikk 9. pontja szerinti hozzájárulást és a kiskorú felhasználók védelmére szolgáló intézkedéseket a **gyermekek részvételéről szóló szabályzat** állapítja meg. E modul aktiválása az adatvédelmi hatásvizsgálat frissítését igényli.

### 59. cikk

Az internacionalizáció a rendszer új régiókra való infrastrukturális kiterjesztése. A rendszer kiterjeszti infrastruktúráját, nyilvántartását és szabályait új területekre, megtartva az egységes Protokollt és a közjó egységes nyilvántartását.

Az új régiókra való terjeszkedés több dimenzióban igényel alkalmazkodást: a célországi joghatóság jogi kerete, a platform nyelvi lokalizációja, a helyi megerősítési lánc kiépítése és esetlegesen helyi szövetkezetek létrehozása.

E modul aktiválásának előfeltétele a stabil, aktív Felső Kolóval rendelkező rendszer, elegendő tapasztalat a rendszer alaprégióban való működésével kapcsolatban, valamint a célországi joghatóságokra vonatkozó jogi elemzés. A terjeszkedésről a Felső Kolo dönt.

Az Európai Unió területére való terjeszkedés az általános adatvédelmi rendelettel való teljes összhangot igényel. A más joghatóságokra való terjeszkedés az adatvédelemre, a digitális vagyonra, az alapítványokra és a szövetkezetekre vonatkozó helyi előírások elemzését igényli.

## IX — Átláthatóság és a személyes adatok védelme

### 60. cikk

A KOLO rendszer természeténél fogva személyes adatokat kezel — hitelesítési gráf, hozzájárulási nyilvántartás, adományokra vonatkozó adatok, valamint egyes modulok összefüggésében az adatok különleges kategóriái. Ugyanakkor a rendszer az adattakarékosság elvén nyugszik, mint a négy elv egyikén.

Ez a fejezet rendezi, hogyan közelít a rendszer az adatvédelemhez: a védelem architektúráját formáló két tervezési döntést, az adatkezelés jogalapját és az Alapítvány adatkezelői helyzetét, a törléshez való jog és a nyilvántartás integritása közötti viszonyt, az Alapítvány kötelezettségeit és a felhasználók jogait. A rendszer a személyes adatok védelméről szóló törvényt alkalmazza.

A technikai és szervezési védelmi intézkedéseket, az Adatvédelmi szabályzatot és a felhasználói jogok gyakorlásának eljárásait külön aktusok állapítják meg.

### 61. cikk

A rendszer adatvédelme a beépített és alapértelmezett adatvédelmen alapul.

Az első tervezési döntés a nyilvántartás álnevessége. A nyilvántartás bejegyzései álnevekhez kötődnek, nem személynevekhez. A felhasználó családi és utóneve kizárólag a személyazonossági nyilvántartásban (31a. cikk) vezetendő, a hozzájárulási nyilvántartástól elkülönítve, és más felhasználók számára nem jelenik meg, kivéve a 31a. cikk 5. bekezdésében meghatározott esetet. Az álnevesség nem anonimitás — az álnevesített adatok személyes adatok maradnak, mivel további információk birtokában azonosított személyhez köthetők.

A második tervezési döntés az adattakarékosság. A platform kizárólag a rendszer működéséhez szükséges adatokat gyűjti. A felhasználó önkéntesen megadhat további adatokat a platform könnyebb használata érdekében, de ez nem feltétele sem a valóságbizonyítéknak, sem a rendszer funkcióihoz való hozzáférésnek.

### 62. cikk

A rendszer kezeli a felhasználók személyes adatait — a platform felhasználóira vonatkozó adatokat, a valóságbizonyíték adatait, a személyazonossági nyilvántartást, az önkéntesen megadott adatokat, a tevékenységi adatokat, az adományokra és a pártfogásra vonatkozó adatokat, valamint egyes modulok összefüggésében az adatok különleges kategóriáit és a kiskorúak adatait.

Az adatkategóriákat, azok terjedelmét, célját és kezelési rendjét az Adatvédelmi szabályzat és az adatkezelési tevékenységek nyilvántartása állapítja meg.

### 63. cikk

A KOLO Alapítvány az adatkezelő — meghatározza az adatkezelés céljait és eszközeit. A Protokoll az adatkezelés technikai eszköze. A személyes adatok kezelése a törvényben megállapított jogalapokon nyugszik; az egyes adatkategóriákra vonatkozó jogalapot az Adatvédelmi szabályzat és az adatkezelési tevékenységek nyilvántartása állapítja meg.

Ha az Alapítvány harmadik személyeket bíz meg az infrastruktúra fenntartásával, e személyek adatfeldolgozók. Az Alapítvány és az adatfeldolgozó közötti viszonyt a törvénnyel összhangban adatfeldolgozási szerződés rendezi.

### 64. cikk

A felhasználó személyes adatai törléséhez való joga és a közjó nyilvántartásának integritása az azonosító és az elszámolási adatok szétválasztásával kerül összehangolásra. Az álnevesítés mechanikáját a jogállás megszűnésekor e szabályzat 34. cikke rendezi.

### 65. cikk

Az Alapítvány köteles az adatkezelés megkezdése előtt adatvédelmi hatásvizsgálatot lefolytatni, adatvédelmi tisztviselőt kinevezni, és a kockázathoz igazodó technikai és szervezési védelmi intézkedéseket alkalmazni.

Az adatok különleges kategóriáinak vagy kiskorúak adatainak kezelését bevezető modulok aktiválása az aktiválás előtt a hatásvizsgálat frissítését igényli.

Ha a rendszer infrastruktúrája a Szerb Köztársaságon kívüli kiszolgálókat is magában foglal, a személyes adatok országon kívülre történő továbbítása a törvénnyel összhangban a határokon átnyúló továbbításra vonatkozó szabályok alá esik.

### 66. cikk

A rendszer felhasználóit megilleti minden jog, amelyet a törvény a személyes adatok védelmével kapcsolatban biztosít számukra. Az Alapítvány hozzáférhető mechanizmust biztosít a kérelmek benyújtására, és a törvényben megállapított határidőkben jár el.

A felhasználói jogok gyakorlásának eljárásait a KOLO rendszer adatvédelmi szabályzata állapítja meg.

### 67. cikk

A hozzájárulási nyilvántartás álneves formában nyilvános. Minden felhasználó ellenőrizheti a nyilvántartás bejegyzéseit és az elszámolási keret konzisztenciáját.

A nyilvántartás átláthatósága biztosítja a rendszer felhasználók általi felügyeletét, és csökkenti a manipuláció lehetőségét.

A nyilvántartás átláthatósága nem terjed ki azokra az adatokra, amelyek közzététele sértené a felhasználók magánéletét — a hitelesítési gráfra, a személyazonossági nyilvántartásra, az önkéntesen megadott adatokra és az adatok különleges kategóriáira. Az álneves hozzájárulási nyilvántartás a résztvevők számára elérhető. A látogatók általános mutatókat (összesítéseket) látnak, a felhasználók pedig ezen felül a tranzakciók összegeit és időbélyegeit is, a felek álneve és a bejegyzések állása nélkül (28. cikk; a Felhasználási feltételek 14. cikke). Kivételesen a felhasználó látja az adománylistát, amelyben a nyilvános adomány adományozója családi és utónevével szerepel, az összeggel és a dátummal együtt, álnév nélkül (a pártfogásról és adományokról szóló szabályzat 5a. cikke). A platform hirdetési terében a hirdetések megtekintése külön kerül rendezésre (16. cikk), és eltér a hozzájárulási nyilvántartástól. Az adatok nyilvános hozzáférhetőségének terjedelmét az Adatvédelmi szabályzat állapítja meg.

A felhasználó minden pillanatban látja saját bejegyzéseit és saját feljegyzett, még nyilvántartásba nem vett hozzájárulását (40.a cikk). A feljegyzett hozzájárulás a többi felhasználó számára nem látható, és a nyilvántartásba vételig nem számít bele a nyilvános összesítésekbe.

## X — A KOLO rendszer jogi természete és a négy elv

### 68. cikk

A KOLO rendszert nem pénzügyi szolgáltatásnak, fizetési szolgáltatásnak vagy befektetési konstrukciónak szánták vagy tervezték. Ez a fejezet rendezi, mi a KOLO és mi nem, és megállapítja azt a négy elvet, amely védi a rendszer jogi helyzetét.

Az elvek biztosítják, hogy a rendszer elszámolási egységei ne válhassanak pénzzé vagy pénzügyi eszközzé, hogy a hozzájárulási nyilvántartás ne válhasson forgalomképes vagyonná, hogy az adományok ne válhassanak jogvásárlássá, és hogy a rendszer ne gyűjtsön olyan adatokat, amelyekre nincs szüksége.

Ezek az elvek nem olyan szabályok, amelyeket a rendszer maga megváltoztathat — ezek azok a határok, amelyeken belül a rendszer létezik. Módosításuk megváltoztatná a rendszer jogi természetét.

### 69. cikk

A KOLO rendszer a közjó részvételi rendszere, amely a szociális és szolidáris gazdaság, valamint a kölcsönösség elvein alapul. A KOLO rendszer nem jogi személy, sem külön jogi kategória.

A KOLO rendszer nem fizetési intézmény, nem digitális vagyon kibocsátója, nem kollektív befektetési konstrukció és nem munkáltató. A rendszer jogi minősítése az e szabályzatban megállapított szerkezeti tulajdonságaiból ered, különösen a négy elvből, valamint a POEN-re, a ZRNO-ra és a működési hozzájárulásra vonatkozó szabályokból.

A felhasználó és az Alapítvány közötti viszony a felhasználási szabályokkal rendezett szerződéses jogviszony. A POEN nyilvántartásba vétele nem ellenszolgáltatás a felhasználó Alapítvány felé fennálló bármely kötelezettségéért.

### 70. cikk

A KOLO rendszer jogi helyzete négy elven nyugszik: a nem konvertálhatóságon, a bejegyzések feletti vagyoni jog hiányán, az adományok és az automatikus nyilvántartásba vétel visszafordíthatatlanságán, valamint az adattakarékosságon.

A négy elv a rendszer szerkezeti korlátja. Ezek egyetlen irányítási döntéssel sem módosíthatók vagy szüntethetők meg, ideértve a Felső Kolo határozatát is.

E szabályzat olyan módosítása, amely a négy elv bármelyikét módosítaná vagy megszüntetné, nem megengedett. A négy elv bármelyikének megsértése megváltoztatja a rendszer jogi természetét.

A négy elvet e fejezet további rendelkezései fejtik ki.

### 71. cikk

A KOLO rendszer egyetlen elszámolási egysége sem konvertálható pénzzé, valutává, sem semmilyen, a rendszeren kívül értékkel bíró eszközzé, sem közvetlenül, sem közvetve.

A konverziós tilalom a közvetett konverziót is magában foglalja, ideértve az elszámolási egység utalványokra, ajándékkártyákra vagy külső értékkel bíró egyéb eszközökre való cseréjét — olyanokra, amelyek pénzzé tehetők, harmadik személyre átruházhatók vagy a birtokos által választott kereskedőnél felhasználhatók.

Az áruval és szolgáltatással nyújtott pártfogásból származó utalványok elosztása nem minősül az előző bekezdés szerinti közvetett konverziónak: az utalványt a juttató az Alapítvánnyal kötött, harmadik személyek javára szóló szerződéssel biztosítja, a juttató POEN-t nem kap, az Alapítvány az elosztás során semmit nem birtokol, nem szerez be és nem fizet ki, az utalvány pedig a birtokos nevére, egyetlen juttatónál meghatározott árura, illetve szolgáltatásra szól, nem ruházható át és nem váltható pénzre. A bejegyzés érvénytelenítése az utalvány átvételekor a 14a. cikk szerinti, felhasználás miatti érvénytelenítés, nem pedig a bejegyzés külső értékkel bíró eszközre való cseréje.

Az Alapítvány nem vásárol vissza sem POEN-t, sem ZRNO-t, és nem biztosítja azok dinárra vagy más fizetési eszközre való átváltását.

### 72. cikk

A felhasználóknak nincs vagyoni joguk a rendszer nyilvántartásában szereplő POEN- és ZRNO-bejegyzések felett. A POEN- és ZRNO-bejegyzések a közjó nyilvántartásában szereplő adatok, nem pedig a felhasználó vagyonában lévő eszközök.

A POEN- és ZRNO-bejegyzések nem ruházhatók át és nem öröklődnek vagyoni jogként.

A nyilvántartásba vett hozzájárulás és a felhasználó nyilvántartásba vett helyzete nem képez követelést az Alapítvánnyal szemben, sem alapot vagyonjogi igényre.

### 73. cikk

Az Alapítványnak nyújtott pénz-, áru- vagy szolgáltatásadomány vissza nem térítendő. Az adományozó az adomány alapján nem szerez visszatérítéshez való jogot, irányítási jogot az Alapítványban, sem részesedést a rendszerben.

A POEN nyilvántartásba vétele a Protokoll automatikus aktusa, amely a rendszer szabályai szerint hajtódik végre. A POEN nyilvántartásba vétele nem ellenszolgáltatás az adományért, sem a felhasználó Alapítvány felé fennálló bármely más kötelezettségéért.

Nem létezik szerződés dinárok POEN-re való cseréjéről. Az adományozási szerződés nem tartalmaz rendelkezéseket a POEN-ről vagy annak nyilvántartásba vételéről.

Az adományozónak nincs szerződéses vagy egyéb követelése az Alapítvánnyal szemben a POEN nyilvántartásba vétele iránt. A POEN nyilvántartásba vétele kizárólag a rendszer szabályai szerint, az adományozás aktusától függetlenül történik.

### 74. cikk

A rendszerben kizárólag a rendszer működéséhez szükséges adatok kerülnek gyűjtésre és kezelésre.

Az Alapítvány a platform felhasználóinak személyes adatait nem saját adatbázisaiban tárolja; ezek az adatok azon az infrastruktúrán maradnak, amelyen a Protokoll működik.

Azokat az adatokat, amelyeket a felhasználó a platform könnyebb használata érdekében önkéntesen ad meg, a felhasználó módosíthatja vagy törölheti; megadásuk nem feltétele sem a valóságbizonyítéknak, sem a rendszer funkcióihoz való hozzáférésnek.

## XI — Felelősség, felhasználói kockázatok és a jogviták rendezése

### 75. cikk

A rendszer minden felhasználója bizonyos kockázatokat vállal és bizonyos felelősséget visel. Ez a fejezet rendezi, ki miért felel a rendszerben, mely kockázatokat kell a felhasználónak a részvétel előtt megértenie, és hogyan kerülnek rendezésre a jogviták.

### 76. cikk

Az Alapítvány felel az infrastruktúra biztosításáért és fenntartásáért, a személyes adatok törvénnyel összhangban történő védelméért, valamint a rendszer szabályainak a szabályzatban megállapított módon való alkalmazásáért.

Az Alapítvány nem felel a felhasználók javak- és szolgáltatáscserében vállalt kötelezettségeinek teljesítéséért. Az Alapítvány nem közvetít a cserében, és nem fél a javakat és szolgáltatásokat cserélő felhasználók közötti jogviszonyban.

Az Alapítvány nem szavatolja, hogy a rendszer megszakítás nélkül fog működni, hogy az infrastruktúrát nem érintik technikai problémák, vagy hogy a nyilvántartás minden biztonsági incidenstől védett lesz. Az Alapítvány köteles ésszerű technikai és szervezési védelmi intézkedéseket tenni.

### 77. cikk

A javak és szolgáltatások cseréjének teljesítéséért, minőségéért és kockázatáért az abban részt vevő felhasználók felelnek, a kötelmi jog általános szabályai szerint.

A felhasználó felel a rendszernek szolgáltatott adatok pontosságáért. A megerősítési láncban a hitelesítő felel a hitelesítés valóságtartalmáért, a valóságbizonyítékra vonatkozó szabályokkal összhangban.

Az a felhasználó, aki visszaél a rendszerrel, a jogállás megszűnésére és felfüggesztésére vonatkozó szabályokkal összhangban álló intézkedések alá esik.

### 78. cikk

A felhasználónak a rendszerben való részvétel előtt meg kell értenie a következő kockázatokat:

A POEN-nek és a ZRNO-nak nincs a rendszeren kívüli értéke, és nem konvertálhatók pénzzé. A nyilvántartásba vett hozzájárulás nem képez követelést az Alapítvánnyal szemben.

Az elszámolási együttható a rendszerbeli tevékenységgel változik. A Kolo-őrző helyzetének megváltozása nem hozam, és nem szavatolt.

Az Alapítvány megszűnhet létezni. Ebben az esetben a közjó őrzésének kötelezettsége és az infrastruktúráért való felelősség az Alapszabállyal összhangban a jogutódra száll, de a rendszer működésének folytonossága nem szavatolt.

A rendszert érinthetik technikai problémák, biztonsági incidensek vagy a működését befolyásoló szabályozási változások.

Az Alapítványnak nyújtott adományok vissza nem térítendők, függetlenül a rendszer további fejlődésétől.

A javak és szolgáltatások rendszeren belüli cseréje adóvonzatokkal járhat a felhasználó számára. Az Alapítvány nem nyújt adótanácsadást. A felhasználó felel saját adókötelezettségeiért.

### 79. cikk

A felhasználók közötti, cserékkel kapcsolatos jogviták a kötelmi jog általános szabályai szerint, az illetékes bíróság előtt kerülnek rendezésre.

A felhasználók és az Alapítvány közötti, a rendszer szabályainak alkalmazásával kapcsolatos jogviták, amikor csak lehetséges, megegyezéssel kerülnek rendezésre. Ha a megegyezés nem lehetséges, a jogvitát a zombori (Sombor) illetékes bíróság rendezi, kivéve ha a törvény a helyi illetékességet másként állapítja meg.

A személyes adatok védelmével kapcsolatos jogviták a törvénnyel összhangban kerülnek rendezésre, ideértve a felhasználó jogát a közérdekű információkkal és a személyes adatok védelmével foglalkozó biztoshoz benyújtott panaszra.

A jogviták rendezésének belső mechanizmusai külön szabályzattal vagy a Felső Kolo határozatával hozhatók létre.

## XII — Záró rendelkezések

### 80. cikk

E szabályzatot a KOLO Alapítvány Igazgatótanácsa fogadja el és módosítja.

Az 1. szakaszban az Igazgatótanács az alapító javaslatára vagy saját kezdeményezésére módosítja a szabályzatot. A 2. szakaszban az Igazgatótanács a Felső Kolo határozata alapján módosítja a szabályzatot, az e szabályzatban megállapított irányítási szabályokkal összhangban.

E szabályzat olyan módosítása, amely a négy elv bármelyikét módosítaná vagy megszüntetné, nem megengedett.

A szabályzat minden módosítása a hatálybalépés előtt olyan határidőben kerül közzétételre a rendszer felhasználói felé, amely lehetővé teszi a módosítások megismerését. A hatálybalépés előtti közzététel minimális határidejét külön szabályzat állapítja meg.

### 81. cikk

E szabályzat ernyőjellegű működési aktus. A külön szabályzatok az e szabályzat által hivatkozott egyes területeket fejtik ki, és összhangban kell lenniük e szabályzattal.

A külön szabályzatok ugyanazon eljárás szerint kerülnek elfogadásra és módosításra, mint e szabályzat, kivéve ha e szabályzat másként rendelkezik.

A Felhasználási feltételek a platformhoz való hozzáférés szabályait, a cseretér használatát és a technikai használat egyéb kérdéseit rendezik, és nem lehetnek ellentétesek e szabályzattal.

Az adatvédelmi szabályzat a felhasználói jogok személyes adatok védelmével kapcsolatos gyakorlásának eljárásait rendezi, és összhangban kell lennie e szabályzattal és a törvénnyel.

Az aktusok hierarchiáját, egymáshoz viszonyított rangjukat és az ellentmondások feloldásának szabályait a KOLO rendszer aktusainak hierarchiájáról szóló szabályzat rendezi.

### 82. cikk — A rendszer indulása (átmeneti rendelkezés)

A rendszer üzembe helyezésekor nincsenek Kolo-tagok, akik megerősíthetnék az első felhasználók valódiságát, sem nyilvántartásba vett POEN-ek, amelyekből ZRNO-t lehetne beírni. Ezért az első Kolo-őrzők — az alapítók — közvetlenül kerülnek megállapításra: az alapítók a valóságbizonyítékról szóló szabályzat 14. cikke alapján kijelölt kezdeti Kolo-őrzők.

Az alapítók a rendszer indulásának egyszeri eseményeként mentesülnek a ZRNO beírásának 19. cikk szerinti feltétele (a nyilvántartásba vett POEN-ek minimuma), valamint a 32. cikk és a valóságbizonyítékról szóló szabályzat azon megerősítési lánc szabályai alól, amelyek korábbi hitelesítő létét feltételezik. Ők képezik a megerősítési lánc kiindulópontját; megerősítettségüket a fiók létrehozásától kezdve és a felügyelet alóli mentességüket a valóságbizonyítékról szóló szabályzat rendezi (VI. fejezet — Kezdeti mechanizmus).

Az alapítók nem képeznek külön jogállást a 27. cikk értelmében: ők a valóságbizonyítékról szóló szabályzatban megállapított jellemzőkkel bíró Kolo-őrzők. Az alapítói minőség nem ad igazgatótanácsi jogosítványokat, és nem teszi a személyt az Igazgatótanács tagjává. A rendszer megszilárdulását követően minden új Kolo-őrző rendes úton szerzi meg jogállását (19., 29. és 30. cikk).

Azoknak a személyeknek a körét, akiknek alapítói hozzájárulását nyilvántartásba veszik, és e hozzájárulás elosztását az alapítói hozzájárulásról szóló szabályzat állapítja meg; ők az említett szabályzat értelmében vett alapítók, akik nem azonosak az e cikk szerinti alapítókkal.

### 83. cikk

E szabályzat a KOLO Alapítvány Igazgatótanácsa általi elfogadás napján lép hatályba.
