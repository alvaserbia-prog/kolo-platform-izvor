import type { FaqSekcija } from "./faq-data";

/**
 * Magyar GYIK-fordítás.
 *
 * A szóhasználat a messages/hu.json-ban már meghonosodott alakokat követi:
 * POEN, ZRNO, Protokoll, Alapítvány, Kör, Felső Kolo, Piac,
 * megerősítés, valóságindex, patrónus, Igazgatóság.
 *
 * ⚠️ A szakaszok és kérdések `id` értékeinek EGYEZNIÜK KELL a szerb eredetivel
 * (faq-data.ts) — ezekre épül a `getFaqPoBrojevima`, amely egyes kérdéseket más
 * oldalakra emel be.
 */
export const FAQ_SEKCIJE_HU: FaqSekcija[] = [
  {
    id: "pocetnici",
    naslov: "Kezdőknek",
    pitanja: [
      {
        id: 42,
        pitanje: `Senkit sem ismerek a Kolóban — megerősíthet engem bárki?`,
        odgovor: `Igen. A Kolóba egy ember vezet be, az ismeretségnek pedig még létre kell jönnie.

Válaszd a menüben a „Szeretném, ha felhívna valaki” lehetőséget. Megadod a településedet, pár szót magadról, hogy mikor vagy elérhető, és a telefonszámodat. Egy Kolo-tag legkésőbb hét napon belül felhív, és látni fogja a nevedet, ha meg van adva, és a számodat. Ha a beszélgetés után úgy ítéli meg, hogy felelősséget tud vállalni érted, bevezet a Kolóba, és megerősítés nélküli tag leszel. A beszélgetés erre nem kötelezi. Hogy ki látja a számodat, és mit rögzítünk közben, azt a Magánélet és kilépés szakasz írja le.

Az Alapítvány akkor is felajánlja a listát, ha nyilvánosan legalább 5000 dinárt adományozol egy összegben egy olyan, a nevedre szóló számláról, amely nem kapcsolódik másik fiókhoz, ha a bejelentésed alapján pénzbeli pártfogás érkezik hozzá, vagy ha gazdaságvezetőként bejelentesz egy gazdaságot. A telefonszámodat és a hozzájárulásodat ilyenkor magad adod meg. Sem a befizetés, sem a bejelentés nem erősíti meg a valóságot, az adomány, a pártfogás és az utánuk járó POEN pedig nem függ a hívástól.

A megerősítés távolról, akár külföldről is lehetséges: elég, ha az, aki megerősít, valóban ismer. Az ismeretség gyakran cserén keresztül jön létre: ha személyesen cseréltek valamit, az a személy valóban ismer, és megerősíthet.`,
      },
      {
        id: 43,
        pitanje: `Tényleg ingyenes — be kell fizetnem vagy adományoznom valamit?`,
        odgovor: `Igen. A platform használata ingyenes, és nincsenek fizetős funkciók. A regisztráció semmibe sem kerül: választasz egy álnevet, megadod az e-mail-címedet és egy jelszót.

Nincs előfizetés, jutalék vagy pótlólag megvásárolható csomag. A Kolóba nem befizetés vezet be, hanem ember.

Az adomány önkéntes, és semminek sem feltétele. Vele az Alapítvány költségeit fedezed: a szervert, az eszközöket, a fejlesztést, a jogi és könyvelési szolgáltatásokat.

Az adomány és a POEN két külön aktus. Az adomány egyoldalú és visszavonhatatlan, vele semmit sem vásárolsz. Tőle függetlenül a Protokoll a rendszer szabályai szerint POEN-t jegyez be a nyilvántartásodba. A POEN-nek a rendszeren kívül nincs értéke, nem adható tovább pénzért, és nem váltható vissza pénzre.

POEN egyetlen dinár nélkül is rögzül neked. Megkapod a valóságigazolás révén (amikor belépsz a Kolóba, vagy amikor te vezetsz be valakit), az első hirdetésért, működési hozzájárulásért és cseréért, amelyben a másik fél átír neked POEN-t. Pénzzel a döntésekben való szavazat sem vásárolható meg: a szavazatot a ZRNO hordozza, nem a POEN.`,
      },
      {
        id: 44,
        pitanje: `Mi az első lépésem, és hogyan jutok POEN-hez?`,
        odgovor: `Az első lépés az első hirdetés: add fel, amid van, vagy amihez értesz, akár még mielőtt a Kolóba lépnél. Nem kell hozzá sem termék, sem megerősítés. A hirdetésnek címre, leírásra, fényképre, kategóriára és településre van szüksége. Amikor az Alapítvány jóváhagyja az első kínáló hirdetésedet, bejegyezzük neked az első hirdetésért járó hozzájárulást, fiókonként egyszer.

A második lépés a belépés a Kolóba. Neked és annak, aki megerősített vagy bevezetett, 1000-1000 POEN-t jegyzünk fel, amelyet akkor tartunk nyilván, amikor megteszed az első hozzájárulásodat: jóváhagyott hirdetés, nyilvános adomány, általad bejelentett pártfogás vagy elvégzett feladat.

Ezután a POEN négyféleképpen érkezik:

• csere: a másik fél POEN-t vezet át neked azért, amit adtál vagy elvégeztél, még a Kolóba lépés előtt is;

• mások bevezetése és megerősítése: 1000-1000 POEN neked és neki, amikor megteszi első hozzájárulását;

• közösségi feladatok: munka egy közzétett feladat alapján;

• szociális programok: amikor az Alapítvány jóváhagyja a jelentkezésedet, naponta POEN kerül bejegyzésre. A programok a résztvevőknek szólnak.`,
      },
      {
        id: 45,
        pitanje: `Mennyi időmet veszi el — állandóan aktívnak kell lennem?`,
        odgovor: `Nem kell. Nincs olyan minimum belépés, hozzájárulás vagy csere, amelyet teljesítened kellene ahhoz, hogy megtartsd a fiókodat.

Annyit és akkor kapcsolódsz be, amennyit és amikor szeretnél. A működési hozzájárulás, a Piacon folytatott csere és a ZRNO-bejegyzés lehetőségek, nem kötelezettségek. Nincs minimális időtartam és nincs felmondási idő.

Ha szünetet tartasz, a nyilvántartásod megvár. A POEN-ed nem jár le — a nyilvántartásodban marad, amíg át nem írod másnak, vagy amíg be nem zárod a fiókodat. A POEN lejárati idejének bevezetése a rendszer lényegi módosítása lenne, amelyről a Felső Kolo döntene, nem az Alapítvány önmagában.

A rendszerből bármelyik pillanatban kilépsz, a profilbeállításokból.`,
      },
      {
        id: 46,
        pitanje: `Mi az álnév — fel kell fednem a valódi nevemet, vagy el kell küldenem a személyi igazolványomat?`,
        odgovor: `Az álnév egy név, amelyet magad választasz, és amelyen mások látnak. Nem kell, hogy köze legyen a valódi nevedhez, és jobb, ha nem is tartalmazza: egy kis közösségben az álneved, a településed és az, amit kínálsz, elárulhatja, ki vagy.

Regisztrációkor csak álnevet, email-címet és jelszót kérünk. Nem kérünk személyi számot, személyi igazolványt vagy fényképet, sem akkor, sem a Kolóba lépéskor: a valóságodat egy ember erősíti meg, aki ismer. A nevedet és a telefonszámodat magad mutathatod meg a résztvevőknek, és ezt bármikor visszavonhatod.

Az Alapítvány csak négy esetben jegyez be vezeték- és utónevet az álnév mellé: amikor gazdaságot jelentesz be vagy csatlakozol hozzá, amikor nyilvánosan adományozol, amikor szövetkezeti tag leszel, és amikor megerősíti az általad bejelentett pártfogást. Fiókonként egy nevet tartunk nyilván. Nem szerepel a profilodon, és nem kerül a POEN-bejegyzésekbe. Az Alapítványon kívül csak az adományok listájában látható (a nyilvános adományozó neve), valamint az a Kolo-tag látja, aki megnyitja a hívásodat, ha kérted, hogy felhívjanak.`,
      },
      {
        id: 76,
        pitanje: `Hogyan ismerem fel a csalást — mit nem fog tőlem a KOLO soha kérni?`,
        odgovor: `Ha valaki olyasmit kér, ami ezen a listán szerepel, az nem az Alapítvány, hanem valaki, aki az Alapítványnak adja ki magát.

Soha nem kérünk pénzt a hozzáférésért. A regisztráció és a használat ingyenes. Az adomány és a pártfogás önkéntes, és kizárólag az ekolo.rs hivatalos csatornáin keresztül fizethető be, soha nem magánszámlára, és soha nem sürgető üzenet alapján.

Soha nem kérünk jelszót, PIN-kódot vagy bankkártyaszámot. Az Alapítványtól senki sem fogja elkérni a jelszavadat vagy az üzenetben kapott kódot. A jelszót csak az ekolo.rs oldalon add meg, soha nem olyan oldalon, ahová egy üzenetben vagy e-mailben kapott linken keresztül jutottál.

A regisztrációhoz és a Kolóba való belépéshez nem kérünk dokumentumot. Sem személyi számot (JMBG), sem a személyi igazolvány vagy útlevél fényképét. A valóságigazolás az ismeretségen nyugszik, nem iratokon.

A POEN nem váltható pénzre. Nem cserélhető dinárra, nem adható tovább pénzért, és az Alapítvány nem vásárolja vissza. Minden ajánlat, amely nyereséget, pénz-visszatérítést vagy a POEN dinárrá alakítását ígéri, csalási kísérlet, akárki küldte is.

A Piacon csak akkor írd át a POEN-t, amikor megkaptad az árut vagy a szolgáltatást. Ha valaki sürget, hogy előre írd át, állj el a cserétől.

Ha ezek közül bármivel találkozol: ne adj ki adatokat, ne kattints a linkre, és írj nekünk a kontakt@ekolo.rs címre.`,
      },
      {
        id: 82,
        pitanje: `Valakivel cserélek, aki még nincs a Kolóban — mekkora a kockázat?`,
        odgovor: `A kockázatot te viseled: ha átírod a POEN-t, de nem kapod meg, amiben megállapodtatok, az átírás nem semmisül meg automatikusan.

Ezért csak akkor írd át a POEN-t, amikor megkaptad az árut vagy a szolgáltatást. Ez az egyetlen szabály, amely valóban megvéd.

Mit jelentenek a jelölések. Kolo-tag az, akinek a valódiságát olyasvalaki erősítette meg, aki személyesen ismeri — neked ismeretlen, de a hálózatnak nem. A megerősítés nélküli tagot bevezették a Kolóba, de még nem erősítette meg egy őt személyesen ismerő Kolo-tag. Mindkettőért felel valaki: aki megerősítette, illetve aki bevezette. A felhasználó még nincs a Kolóban, és a hirdetésén jelölés mutatja, hogy a hirdető nincs a megerősítési láncban.

Mi szól melletted. A rendszer tartósan emlékszik. A nyilvántartás minden frissítése álnév alatt rögzítve marad és látható a résztvevők számára; a rossz viselkedés nem törlődik a fiókról.

Ha a csere meghiúsul. Nyújts be kifogást az Alapítványhoz a profilodról, az átírástól számított 30 napon belül, és válaszd ki éppen azt az átírást. A másik fél hét napot kap, hogy nyilatkozzon, majd az Alapítvány indokolással dönt, amelyet mindkét fél megkap. Ha az átírást megsemmisíti, a teljes összeg visszakerül hozzád, akkor is, ha a másik fél nyilvántartása ezzel mínuszba kerül. A döntés az Alapítványé, ezért a kifogás nem automatikus visszatérítés.

A minőségért, a szállításért és a megállapodás teljesítéséért te és a másik fél feleltek, a kötelmi jog általános szabályai szerint; az Alapítvány és a Protokoll nem fél ebben a viszonyban. A kezdeti szakaszban az Alapítvány önkéntes közvetítését is kérheted — ez nem kötelező erejű, de gyakran elegendő.

A legjobb, ha személyesen találkoztok, és a cserét szemtől szemben bonyolítjátok le. Így a kockázat csökken, és ismeretség is születik, amelyből belépés a Kolóba vagy megerősítés következhet.`,
      },
      {
        id: 83,
        pitanje: `Hány hirdetést adhatok fel, mielőtt belépek a Kolóba?`,
        odgovor: `Annyit, amennyit akarsz, ajánlatot és keresést is. Az első hirdetés, amellyel kínálsz valamit, 1.000 POEN-t hoz neked: a hirdetés azonnal fent van a Piacon, a POEN pedig akkor rögzül, amikor az Alapítvány jóváhagyja. Amíg felhasználó vagy, a hirdetésed jelölése mutatja, hogy a hirdető még nincs a megerősítési láncban.

Minden hirdetésnek címet, leírást, fényképet, kategóriát és helységet kell tartalmaznia. Előírt legkisebb hossz nincs — annyit írj, amennyi kell ahhoz, hogy az ember megértse, mit kínálsz.

A Kolóba való belépés előtt is írsz a Beszélgetőben, válaszolsz azoknak, akik megkeresnek, kapsz és átírsz POEN-t, és magad is írsz egy hirdetőnek a hirdetése kapcsán, naponta legfeljebb három új beszélgetésben.

Amikor belépsz a Kolóba, akár megerősítés nélküli tagként is, megnyílik előtted:

• beszélgetés bármely felhasználóval, napi korlát nélkül

• a hirdetésen szereplő telefonos elérhetőség és a nyilvántartás teljes áttekintése, álnevekkel

• programok, beszerzések, utalványok, szövetkezet és ZRNO jegyzése

A Kolo-tagként kapott megerősítés ehhez hozzáadja mások megerősítését, azoknak a listáját, akik szeretnék, ha valaki felhívná őket, a gyermek létezésének és a program feltételei teljesülésének megerősítését, az ajánlást, a ZRNO aktiválását és a szavazatot a Felső Koloban.`,
      },
    ],
  },
  {
    id: "ukljucivanje",
    naslov: "Belépés a Kolóba",
    pitanja: [
      {
        id: 7,
        pitanje: `Hogyan lépek be a Kolóba, és mit nyerek vele?`,
        odgovor: `A Kolóba lépés nem kötelező: nélküle is feladsz hirdetéseket, írsz a Beszélgetőben és POEN-t vezetsz át. A Kolo azt nyitja meg, amihez az kell, hogy a fiók mögött ismert ember álljon.

Kétféleképpen lehet belépni. Egy Kolo-tag, aki személyesen ismer, megerősíti, hogy valós személy vagy, és Kolo-taggá válsz. Vagy bevezet egy ismerős, akit szintén bevezettek, illetve egy Kolo-tag telefonos beszélgetés után, és ekkor megerősítés nélküli tag vagy. Mindkét esetben megmutatod vagy lediktálod a kódodat. Dokumentumokat nem kérünk.

A megerősítés nélküli tagot később egy Kolo-tag erősíti meg, aki személyesen ismeri. Ha nincs ilyen, 30 nap Kolóban töltött idő után, ha megfelel a feltételeknek, választhatja a „Szeretném, ha felhívna valaki a megerősítés miatt” lehetőséget, és a beszélgetés után egy Kolo-őrző erősíti meg. Amikor Kolo-tag leszel, megkapod azok listáját, akiket bevezettél, és azét, aki téged bevezetett, és onnan megerősíted azokat, akiket személyesen ismersz.

A belépés megnyitja a hirdetések elérhetőségeit, a napi korlát nélküli beszélgetést, a programokat, a szövetkezetet, a beszerzéseket, az utalványokat és a ZRNO bejegyzését. Neked és annak, aki megerősített vagy bevezetett, 1000-1000 POEN-t jegyzünk fel, amelyet akkor tartunk nyilván, amikor megteszed az első hozzájárulásodat.`,
      },
      {
        id: 118,
        pitanje: `Hány embert erősíthetek meg vagy vezethetek be?`,
        odgovor: `A szám nincs korlátozva, csak az ütem. Egy napon belül minden megerősítésed és bevezetésed számít, a kapcsolódók listájáról származók is. A harmadiknál és a negyediknél figyelmeztetést kapsz, az ötödik nem kerül bejegyzésre, és a megerősítés éjfélig leáll. Minden más a szokásos módon működik.`,
      },
      {
        id: 122,
        pitanje: `Hogyan vezessek be több embert?`,
        odgovor: `Mindenki csak azokat erősíti meg, akiket személyesen ismer. Egy nap alatt a rendszer egy személytől korlátozott számú megerősítést fogad el, ezért osszátok el a megerősítéseket több napra. Minél többen vagytok a Kolóban, annál gyorsabban megy.`,
      },
      {
        id: 119,
        pitanje: `Mi történik, ha az, aki megerősített, távozik, vagy kiderül, hogy a megerősítés hamis?`,
        odgovor: `Ha az, aki megerősített vagy bevezetett, megszünteti a fiókját, a helyzeted és a POEN-ed megmarad. Csak a megállapított hamisság törli őket, ezt pedig személyenként ítélik meg, és nem terjed át azokra, akiket az a személy erősített meg.

Akinek a Kolóba lépését törlik, felhasználó lesz: a fiók megmarad, és a Kolóba ismét bevezetheti vagy megerősítheti valaki, aki személyesen ismeri. Akinek csak a megerősítését törlik, megerősítés nélküli tag marad.

Aki olyasvalakit erősít meg vagy vezet be, aki nem valós személy, elveszíti ezt az 1000 POEN-t akkor is, ha már elköltötte, így a bejegyzése mínuszba kerül. A hamis megerősítés a Felhasználási feltételek súlyos megsértése, és rendszerint kizárással jár.`,
      },
      {
        id: 8,
        pitanje: `Mi van, ha külföldi vagyok — részt vehetek?`,
        odgovor: `Igen. Az állampolgárság és a lakóhely nem feltétel, és sehol sem kerül bejegyzésre. Regisztrációkor álnevet választasz, és megadod az e-mail-címedet és egy jelszót; dokumentumot nem kérnek.

A Kolóba való belépés egyetlen valódi feltétele, hogy megerősítsen vagy bevezessen valaki, aki ismer, és ez a valaki bárhol lehet. Ha a hálózatban még senkit sem ismersz, a lebonyolított csere során kialakult ismeretség teljes értékű alap. Megadhatod a számodat a „Szeretném, ha valaki felhívna” lehetőségen keresztül is, és egy Kolo-tag telefonos beszélgetés után bevezethet a Kolóba.

A Szabályzatot, a Felhasználási feltételeket és a többi kötelező erejű aktust szerb nyelven fogadták el, és ez a változat az irányadó. A fordítások az olvasó segítségére szolgálnak.`,
      },
      {
        id: 9,
        pitanje: `Lehet több fiókom vagy több álnevem?`,
        odgovor: `Nem. A szabály: egy ember, egy fiók, és ez a használat feltétele. Aki második fiókot nyit, kizárható a rendszerből.

A második fióknak többnyire akkor sincs értelme, mielőtt bárki észrevenné. Az a fiók, amelyet senki sem vezetett be a Kolóba, nem látja a telefonos elérhetőségeket és az álnevekkel ellátott nyilvántartást, nem vesz részt programokban, beszerzésekben és nem jegyez ZRNO-t, a Kolóba pedig olyan ember vezeti be, aki azt állítja, hogy ismer, és aki a valótlan állításért felel. Még a más fiókhoz kapcsolódó számláról érkező adomány sem vezet azoknak a listájára, akik szeretnék, ha valaki felhívná őket.

A szülő által a gyermekének nyitott fiók nem kivétel e szabály alól.

Álnév egy van, és ezen látnak a többi felhasználók. A megváltoztatásáról a következő kérdésben olvashatsz.`,
      },
      {
        id: 10,
        pitanje: `Megváltoztathatom az álnevemet?`,
        odgovor: `Igen, legfeljebb harminc naponként egyszer.

A változás azonnal érvényes. Amint megerősíted, az egész fiókod az új álnév alatt jelenik meg mások számára, a korábbi előzményekkel együtt; a régi már nem látható.

Az álnév latin betűket, számjegyeket és a _ . - jeleket tartalmazhatja, szóköz nélkül, és č, ć, š, ž, đ betűk nélkül. Akkor is latin betűs, ha az oldalt cirill betűkkel olvasod. A profilod címében is szerepel.

A korábban megosztott linkek továbbra is működnek: a régi cím a változtatás után is a profilodra vezet, az elhagyott álnevet pedig más nem veheti fel, különben egy már megosztott link csendben egy másik személyhez vezetne.

Maga a fiók ezzel nem változik: a megerősítési lánc, a helyzeted a Kolóban és a hozzájárulások nyilvántartása ugyanaz marad, mert csak a név változott, amelyen látnak.`,
      },
    ],
  },
  {
    id: "pijaca-donacije",
    naslov: "Piac",
    pitanja: [
      {
        id: 39,
        pitanje: `Adásvétel-e a Piacon zajló csere?`,
        odgovor: `A KOLO rendszer szabályzata szerint a javak és szolgáltatások felhasználók közötti cseréje a Piacon nem klasszikus adásvételként van felépítve. Két fél megállapodásáról van szó: az egyik javakat vagy szolgáltatást ad, a másik POEN-t ír át neki, a POEN pedig nem pénz, hanem a közös jóhoz való hozzájárulás nyilvántartása.

A POEN átírása ebben a cserében sem pénzbeli fizetés, sem fizetőeszköz a pénzforgalmi szolgáltatásokra vonatkozó szabályok értelmében. A cserével kapcsolatos viszonyokat — a teljesítést, a felelősséget, a kockázatot — a kötelmi jog általános szabályai rendezik; a Protokoll a cserében nem közvetít.

Ha a Piacon keresztül tevékenységet folytatsz, az általános szabályok szerinti adó- és számlaadási kötelezettségeid megmaradnak — itt semmi nem szünteti meg őket.`,
      },
      {
        id: 60,
        pitanje: `Hogyan határozzam meg a mennyiséget a hirdetésben?`,
        odgovor: `Javaid és szolgáltatásaid POEN-mennyiségét magad határozod meg, szabadon. A platform nem állapítja meg, nem korlátozza és nem ellenőrzi, és senki sem értékeli helyetted az árudat — te tudod a legjobban, mit kínálsz, és mennyit ér.

Hivatalos arány nincs, és az Alapítvány nem is tesz közzé ilyet. Sok felhasználó abból az árból indul ki, amelyet az adott áruért vagy szolgáltatásért amúgy is ismer dinárban — ez a saját becslésed, a te hirdetésedre vonatkozik, és nem köti a másik felet. Az Alapítvány nem szavatolja a POEN értékét, és nem vásárolja vissza.

Amit elvárunk, az a tisztesség: az áru vagy szolgáltatás pontos és világos leírása, valós mennyiség és valós POEN-összeg, valamint a csere minden feltétele. Nem megengedett a hamis vagy megtévesztő tartalom, amely tévesen mutatja be a kínált dolog jellegét, minőségét vagy mennyiségét.

Minden mást (szállítás, határidő, további feltételek) közvetlenül a másik féllel egyeztetsz.

Megjegyzés: ez a Piacon zajló cserére vonatkozik. A közösségi feladatok (operatív hozzájárulás) másik csatorna; ott a mennyiség nem szabad megállapodás, hanem a javasolt POEN, súlyozó támpont a napi elosztásban.`,
      },
      {
        id: 41,
        pitanje: `Nyilvánosan látható-e a hirdetésem a Piacon?`,
        odgovor: `Igen. A hirdetés tartalma (leírás, összeg POEN-ben, helyszín és az álneved) minden látogató számára látható, a nem regisztráltaknak is, hogy a csere elérhető és könnyen megtalálható legyen. Amíg nem vagy a Kolóban, a hirdetésen látható jelölés is mutatja, hogy a hirdető még nincs a megerősítési láncban.

Ami nem nyilvános: a telefonos elérhetőségedet csak a résztvevők látják. A hirdetés kapcsán bárki írhat neked, akinek fiókja van; aki még nincs a Kolóban, naponta legfeljebb három új beszélgetésben. A nem regisztráltak számára az álneved a hirdetésen nem vezet a profilodra, a felhasználók számára pedig csak a szűkített profilodra vezet, a tranzakciók előzményei nélkül.`,
      },
      {
        id: 58,
        pitanje: `Cserélhetek a szomszédommal munkát munkáért vagy szerszámot terményért, egyetlen POEN nélkül (cserekereskedelem)?`,
        odgovor: `Cserélhetsz. A közvetlen cserekereskedelem — a te munkád az ő munkájáért, a te szerszámod az ő terményéért — magánmegállapodás közted és a szomszédod között, és a KOLO ezt nem tiltja.

Az ilyen csere a rendszeren kívül zajlik: ha mellé nem frissítitek a POEN-nyilvántartást, a személyes megállapodásotok marad, és sehol nem rögzül a te hozzájárulásodként.

Márpedig épp ez a KOLO rendszer értelme: hogy az a csere, amelyet amúgy is „kézből kézbe” bonyolítanátok, bejegyzést kapjon. Amikor a csere mellé frissítitek a nyilvántartást, a POEN átkerül annak a bejegyzéséről, aki a javakat vagy a szolgáltatást kapta, annak a bejegyzésére, aki adta — és nyoma marad, ki mennyit adott a közösségnek.

A minőségért, a szállításért és a megállapodás teljesítéséért ti ketten feleltek az általános szabályok szerint — az Alapítvány és a Protokoll ebbe nem avatkozik bele, és ezért nem felel.`,
      },
      {
        id: 21,
        pitanje: `Ki felel, ha a csere meghiúsul, vagy az áru hibás?`,
        odgovor: `A Piacon zajló csere két fél közvetlen viszonya, és magánjogi természetű. A minőségért, a megfelelőségért és a szállításért a cserélő felhasználók felelnek: az, aki a javat vagy szolgáltatást adja, és az, aki kapja. Az Alapítvány és a Protokoll nem fél a cserében, és nem közvetít benne; mindenre a kötelmi jog általános szabályai vonatkoznak, mint bármely két ember közötti beszerzésnél.

A jótállást, a határidőt és a feltételeket a csere előtt közvetlenül a másik féllel egyezteted; minél világosabban megállapodtok az áru állapotáról, a határidőről és arról, mi történik, ha valami nem jó, annál könnyebb később megoldani a problémát. Ha olyasvalakivel cserélsz, aki tevékenysége keretében kínál árut vagy szolgáltatást, a törvényes fogyasztóvédelem is érvényes; két magánszemély között a kötelmi jog általános szabályai érvényesek.

A rendszerben nincs automatikus cseresztornó. Ha megállapodtok, hogy valamit visszaadtok, az a POEN-nyilvántartás új, önkéntes, ellenkező irányú frissítéseként történik, új, visszafelé irányuló cserével.

Ha valami rosszul sül el, először próbáld közvetlenül a másik féllel rendezni. A kezdeti szakaszban kérheted az Alapítvány önkéntes, nem kötelező közvetítését is; ha nem sikerül megegyezni, az általános szabályok szerinti bírósági védelem marad. Ezen felül a profilodról az átvezetéstől számított 30 napon belül kifogást nyújthatsz be az Alapítványhoz; ez nem közvetítés kettőtök között, hanem döntés a bejegyzésről, és ha az Alapítvány ennek alapján törli az átvezetést, a POEN teljes egészében visszakerül hozzád.`,
      },
    ],
  },
  {
    id: "poen-zrno",
    naslov: "POEN és ZRNO",
    pitanja: [
      {
        id: 1,
        pitanje: `Mi az a POEN, és van-e pénzben kifejezett értéke?`,
        odgovor: `A POEN a Protokoll nyilvántartásában szereplő bejegyzés arról, hogy értékeset adtál a közösségnek — más tagokkal folytatott csere, a valóság megerősítése, működési hozzájárulás, szociális program, adomány vagy patronálás útján.

A POEN csak a Protokollban létezik. A bejegyzést a Protokoll vezeti, és nem vihető ki a rendszerből — a POEN-nek nincs olyan formája, amelyben azon kívül létezne. Nem tartod a kezedben, és nem adhatod át senkinek a rendszeren kívül.

A POEN nem pénz. Nem fizetőeszköz, nem elektronikus pénz, nem digitális vagyon, nem pénzügyi eszköz, és nem az Alapítvány feléd fennálló tartozása. A rendszeren kívül nincs értéke: nem váltható dinárra, nem adható tovább, és az Alapítvány nem vásárolja vissza.

Van-e akkor pénzben kifejezett értéke? Árfolyam nincs, és az Alapítvány semmilyen POEN–dinár arányt nem tesz közzé. A hirdetésben az összeget te magad határozod meg. A legtöbben abból indulnak ki, amennyit az adott áruért vagy szolgáltatásért amúgy is tudnak — ez a te becslésed, arra a hirdetésre érvényes, a másik felet nem kötelezi, és nem árfolyam. Az Alapítvány ezt a számítást nem végzi el helyetted: nem vesz nyilvántartásba hozzájárulást annak alapján, nem határoz meg annak alapján szabályzati összeget, a POEN semmilyen értékét nem szavatolja, és nem váltja vissza.`,
      },
      {
        id: 2,
        pitanje: `Készpénzre válthatom vagy eladhatom a POEN-t?`,
        odgovor: `Nem. A POEN nem váltható dinárra, külföldi valutára, sem semmilyen más fizetőeszközre. Az Alapítvány nem vásárolja vissza és nem váltja be.

A POEN a Protokollon kívül nem is létezik — nincs olyan formája, amelyben kiléphetne a rendszerből.

Amit megtehetsz: átírhatod egy másik felhasználónak egy lebonyolított javak-, szolgáltatás- vagy tudáscseréért — a Piacot is beleértve —, vagy ZRNO-t jegyezhetsz be vele.

A POEN pénzért való eladása nem része a rendszernek. A POEN-nek nincs ára, és nincs olyan csatorna, amelyen keresztül az Alapítvány egy ilyen megállapodást elismerne, nyilvántartana vagy védene. Aki így jár el, azt a rendszeren kívül és saját felelősségére teszi — és minden átírás tartósan rögzítve marad a nyilvántartásban.`,
      },
      {
        id: 3,
        pitanje: `Lejár-e a POEN?`,
        odgovor: `Nem. A POEN a nyilvántartásodban marad, amíg át nem írod egy másik felhasználónak, vagy amíg nem törlöd a fiókodat.

A lejárat nincs örökre kizárva: a POEN „öregedésének” mechanizmusa, amely a felhalmozás helyett a forgást ösztönözné, a rendszer lényegi módosítása lenne. Erről a Felső Kolo döntene szavazással — az Alapítvány ezt önmagában nem vezetheti be.`,
      },
      {
        id: 4,
        pitanje: `Mi az a ZRNO, és mire való?`,
        odgovor: `A ZRNO a POEN-től elkülönülő bejegyzés. Míg a POEN azt rögzíti, mit adtál a közösségnek, a ZRNO a benne elfoglalt helyzetedet rögzíti, és ebből a helyzetből fakad a szavazat a rendszer szabályairól hozott döntésekben.

Hogyan szerezhető. ZRNO-t a már meglévő POEN-nel jegyzel. Hogy egy ZRNO-hoz hány POEN szükséges, azt az együttható mutatja. A ZRNO-t le is írhatod.

Ki jegyezhet. ZRNO-t résztvevő jegyez: a Kolo-tag és a megerősítés nélküli tag. A Kolo-tag a jegyzéssel Kolo-őrzővé válik. A megerősítés nélküli tag jegyezhet ZRNO-t és leírhatja a szabad ZRNO-t, de a jegyzéssel nem válik Kolo-őrzővé: a ZRNO-t nem aktiválja, nincs szavazata, és nem ruházza át, amíg meg nem erősíti egy Kolo-tag. Az a Kolo-őrző, akinek megszűnik a helye a Kolóban, felhasználóvá válik, és megtartja a jegyzett ZRNO-t, de befagyasztva: nem aktiválja, nem írja le és nem ruházza át a szavazatát, amíg újra meg nem erősítik. Ha csak a megerősítése szűnik meg, a Kolóba való bevezetése pedig érvényes, megerősítés nélküli taggá válik, az aktív ZRNO pedig szabaddá válik.

Hogyan ad szavazatot. Csak a Kolo-őrző aktiválja (zárolja) a jegyzett ZRNO-t, és csak az aktív ZRNO hordoz szavazóerőt. A szavazatot csak Kolo-őrző ruházhatja át, és csak egy másik Kolo-őrzőre. A szavazat nem lineárisan nő: a szavazatok száma az aktív ZRNO-k számának négyzetgyöke, így akinek százszor több ZRNO-ja van, annak tízszer több szavazata van, nem százszor. Így senki sem veheti át a döntéshozatalt felhalmozással.

Mi nem a ZRNO. Nem üzletrész, nem részvény, nem digitális eszköz, nem pénzügyi eszköz. Nem hoz kamatot vagy osztalékot, senki nem fizet neked utána semmit, és nem írható át másik tagra. Azt mutatja, milyen helyzetben vagy a közösségben, nem azt, hogy az mennyivel tartozik neked.`,
      },
      {
        id: 5,
        pitanje: `Mi a helyzet az adóval és a nyugtaadással?`,
        odgovor: `Az Alapítvány nem számol el helyetted adót, és nem állít ki a nevedben adóügyi nyugtát. A POEN nem pénz és nem törvényes fizetőeszköz, a POEN átírása pedig nem pénzforgalmi művelet a pénzforgalmi szolgáltatásokra vonatkozó szabályok értelmében.

A POEN nem pénzbeli jövedelem. Nem kerül kifizetésre, nem váltható dinárra, és nem hagyhatja el a Protokollt. Az Alapítvány nem tesz közzé POEN–dinár arányt; ha az emberek a megállapodáskor dinárban kifejezett árhoz hasonlítják, az az ő becslésük, nem ár és nem árfolyam — a POEN-nek nincs piaca, amelyen a rendszeren kívüli érték kialakulna.

De a KOLO nem szünteti meg a meglévő kötelezettségeidet. Ha alkalmanként továbbadod a feleslegedet vagy segítesz valakinek, semmi nem változik. Ha áruk értékesítéséből vagy szolgáltatásnyújtásból élsz, ugyanazok a szabályok érvényesek, mint a rendszeren kívül — függetlenül attól, hogy a megállapodás POEN-ben van-e rögzítve.

Az Alapítvány nem ad adótanácsot, és a saját adókötelezettségeidért te felelsz. Ha rendszeresen nyújtasz árut vagy szolgáltatást, kérj tanácsot könyvelőtől.`,
      },
      {
        id: 40,
        pitanje: `Valamiféle piramisjáték vagy kripto ez?`,
        odgovor: `Egyik sem.

Miért nem piramis. A piramisjáték úgy működik, hogy az újonnan érkezők fizetnek, hogy a korábbiak keressenek. Itt a belépés nem kerül pénzbe, a POEN nem vásárolható pénzért, és nincs alattad szint. Amikor valakit megerősítesz vagy bevezetsz a Kolóba, 1.000-1.000 POEN rögzül neked is, neki is, egyszeri alkalommal és mindkettőtöknek ugyanannyi. Abból, amit ez a személy később tesz, neked semmi sem jut; mások hozzájárulásai után nincs jutalék.

Miért nem kripto. A kriptovaluta blokklánc-hálózaton létezik, piaci ára van, és tőzsdén adják-veszik. A POEN nem token, a Protokollon kívül nem létezik, nem cserélhető dinárra, és nincs piaci ára.

Honnan jön a POEN. Senki sem jegyezhet be POEN-t saját magának. Kizárólag úgy keletkezik, hogy a Protokoll egy előre rögzített szabály szerint bejegyzi, és minden bejegyzett POEN-nek pontosan ugyanakkora mínusz felel meg a Protokoll nyilvántartásában. Ezért a forgalomban lévő POEN mennyisége mindig pontosan megegyezik a rögzített hozzájárulások összegével. Semmi sem keletkezik a semmiből.

A POEN annak a feljegyzése, mit adtál a közösségnek — inkább könyvelési tételhez hasonlít, mint pénzhez. Az érték a munkát, javakat és tudást cserélő emberek hálózatában van, nem a spekulációban.`,
      },
      {
        id: 51,
        pitanje: `Mi van, ha a rendszer megbukik vagy az Alapítvány megszűnik — mindent elveszítek?`,
        odgovor: `Legyünk őszinték: ha a rendszer egy nap megáll, a nyilvántartásod megszűnik értéket jelenteni mint cserelehetőség. Ez veszteség. De nem pénzbeli veszteség, és íme, miért.

Nincs pénzbeli követelésed — sem most, sem akkor. A POEN és a ZRNO nem a nevedre álló pénz, és nem is az Alapítvány feléd fennálló tartozása. Ezek bejegyzések arról, mennyit járultál hozzá és mennyit cseréltél a közösségben. Ezért nincs olyan összeg, amellyel bárki tartozna neked — sem amíg a rendszer működik, sem ha megáll.

Amit már elcseréltél, a tiéd marad. A kézről kézre került munka, javak és tudás valóban megtörténtek, és ezeket senki nem érvényteleníti. Ugyanez áll azokra az emberekre is, akiket megismertél.

Az Alapítványból senki nem húzhat hasznot. Az Alapszabály szerint megszűnés esetén a megmaradt vagyon nem az alapítókat és nem is bárkit magánszemélyként illet, hanem azonos vagy hasonló célú másik alapítványnak, közhasznú alapítványnak vagy egyesületnek adják át, elsőbbséget adva azoknak, akik a szolidáris gazdaság szellemében dolgoznak. A rendszer megszüntetésével senki nem gazdagodhat.

A rendszer nélkülünk is folytatódhat. A kód, amelyen a KOLO fut, nyilvános és a GitHubon elérhető — bárki elviheti, elindíthatja és folytathatja. A szoftver AGPL-3.0 licenc alatt áll, a tartalom CC BY-SA alatt. Ha ez a konkrét szervezet eltűnik, az eszköz és a tudás megmarad. A közös jó nem szűnik meg egyetlen szervezet megszűnésével.`,
      },
      {
        id: 52,
        pitanje: `Mire jó az 1.000.000 ZRNO felső korlát, ha a ZRNO-val nem lehet kereskedni? Van staking vagy hozam?`,
        odgovor: `Mire jó a korlát. Összesen 1.000.000 ZRNO létezik, és ez a szám sem nem növelhető, sem nem csökkenthető. Így a döntéshozatal nem hígítható fel: senki nem hozhat létre utólag új ZRNO-t, és nem értéktelenítheti el azok szavazatát, akik már itt vannak. Minden bejegyzéssel csökken a Protokollban rendelkezésre álló ZRNO száma — de ezzel egyidejűleg csökken a forgalomban lévő POEN-ek száma is, mert a ZRNO bejegyzésére fordított POEN visszakerül a Protokollhoz. Ezért maga a bejegyzés nem mozdítja el a koefficienst.

A ZRNO-val nem kereskednek. Nem írható át másik felhasználónak, és nem hagyja el a Protokollt. A közös jóban elfoglalt helyzetedet rögzíti, amelyből a Felső Kolóban való szavazatod ered.

A lezárás nem staking. A bejegyzett ZRNO-t csak azért zárod le, hogy a szavazatod beszámítson — csak az aktív ZRNO hordoz szavazóerőt. A lezárás nem hoz neked sem POEN-t, sem kamatot, sem semmilyen díjazást. A koefficiens ugyanúgy változik, akár le van zárva a ZRNO-d, akár szabad; a lezárással a szavazaton kívül semmit nem nyersz.

A leírás nem ugyanannyi POEN-t ad vissza — ezt is nyíltan megmondjuk. A leírás az adott pillanatban érvényes koefficiens szerint történik, a koefficiens pedig addigra mindkét irányban megváltozhatott. Nő, amikor a rendszerben új POEN-eket jegyeznek be a hozzájárulás csatornáin keresztül. Csökken, amikor POEN-eket megsemmisítenek — amikor valaki megszünteti a fiókját, amikor a POEN a közösségi beszerzésből való átvétellel megsemmisül, vagy amikor a gyermektérben felbomlik egy barátság.

A saját bejegyzésed és leírásod nem mozdítja el. Bejegyzéskor egyszerre csökken a forgalomban lévő POEN-ek száma és a rendelkezésre álló ZRNO-k száma is, így a hányados változatlan marad. Ezért itt nincs sem kereskedés, sem megfelelő pillanat a belépésre és a kilépésre: a különbözet, ha van, annak számtani következménye, amit az egész rendszer időközben rögzített. Senki nem ígéri, senki nem szavatolja, és senki nem fizeti ki.

De ez nem jövedelem. A különbözet kizárólag POEN-ben áll fenn, amelynek a rendszeren kívül nincs értéke, nem váltható dinárra, és nem hagyhatja el a Protokollt. Nincs nyereséged és nincs pénzbeli jövedelmed — más bejegyzésed van a hozzájárulások nyilvántartásában. Ezért a ZRNO-t nem azért jegyzed be, mert megéri, hanem mert szavad akar lenni a döntésekben.`,
      },
      {
        id: 53,
        pitanje: `A megerősítés utáni bejegyzés (1000 POEN) toborzási jutalék vagy airdrop, amit farmolhatok?`,
        odgovor: `Nem. Nem toborzási jutalék, nem airdrop, és nem farmolható.

Amikor valaki megerősít vagy bevezet a Kolóba, neked és neki 1000-1000 POEN-t jegyzünk fel. Az összeg rögzített, mindkét félnek ugyanannyi, és személyenként egyszeri. Aki a megerősítődet megerősítette, semmit sem kap: nincsenek szintek, és semmi sem áramlik felfelé.

A bejegyzés az első hozzájárulásodra vár, és ez a feltétel mindenkire ugyanaz. Nem azért létezik, hogy jutalmazza az emberek behozását, hanem hogy POEN ne keletkezzen a valódi részvétel nyoma nélkül. A jutalékot ezzel szemben fejenként fizetik a behozott emberek után, és azzal nő, amit a behozottak elköltenek.

A bejegyzés nem díjazás sem munkáért, sem adatokért: amikor az Alapítvány megállapítja, hogy a feltétel teljesült, a Protokoll előre rögzített szabály szerint jegyzi be.

A farmolásnak nincs értelme:

• A POEN nem váltható pénzre.

• Egy ember, egy fiók, a megerősítés pedig személyes ismeretségen alapul.

• Aki olyasvalakit erősít meg vagy vezet be, aki nem valós személy, elveszíti ezt az 1000 POEN-t, a hamis megerősítés pedig rendszerint kizárással jár.

• Ugyanaz a személy nem hoz kétszer bejegyzést: amikor egy megerősítés nélküli tagot később egy Kolo-tag megerősít, új POEN nem kerül bejegyzésre.`,
      },
      {
        id: 54,
        pitanje: `Az alapítói csatorna akár 2.400.000 POEN-t rögzít az „alapítóknak” — nem a csúcs írja ez magának a pénzt?`,
        odgovor: `Nem. Az alapítói csatorna nem pénzt jegyez be. A POEN nem pénz, és az összeg sem tulajdont, sem hatalmat nem ad a rendszer felett.

Mit rögzít. A platform létrejötte előtt végzett munkát: a rendszer megtervezését, a szabályok megírását, a jogi és szervezési előkészítést, a dokumentáció elkészítését. Ezen felül az Alapítvány számlájának megnyitásáig felmerült összes pénzügyi és egyéb költséget — ezeket az alapítók személyesen viselték, mert az Alapítvány akkor még nem is létezett olyan alanyként, amely fizetni tudna. Mindez akkor történt, amikor még nem volt hol rögzíteni, ezért utólag rögzítik, mint bármely más hozzájárulást.

Ugyanaz a státusz, mint bármely más POEN-é. Nem átváltható, a rendszeren kívül nincs értéke, nem keletkeztet követelést az Alapítvánnyal szemben. A költségeket nem térítik meg: az alapítók egyetlen dinárt sem kaptak vissza abból, amit befektettek, csak egy bejegyzést ugyanabban a nyilvántartásban, amelyben minden más hozzájárulást is rögzítenek.

Öt alapító van, és a kör zárt. Őket az Alapítvány belső aktusa előre meghatározta, és semmilyen későbbi döntés nem bővítheti ezt a kört.

Az ütem nem önkényes. Egy 24.000 POEN-es lépés csak akkor rögzül, amikor a rendszerben lévő POEN teljes mennyisége a következő 100.000-rel nő, és ebbe a küszöbbe maga az alapítói bejegyzés is beleszámít. Ez azt jelenti, hogy amíg a csatorna működik, az alapítói hozzájárulás minden újonnan bejegyzett POEN 24%-át teszi ki. Amikor a csatorna 2.400.000-ig kiürül, a rendszer 10.000.000 POEN-nel nőtt, és a csatorna véglegesen és visszavonhatatlanul bezárul. Ettől kezdve az alapítók részesedése csak csökken, mert a rendszer tovább nő, a csatorna pedig már nem működik.

A nagyobb egyenleg nem ad arányosan nagyobb hatalmat. A szavazás a Felső Koloban négyzetes: a szavazatok száma az aktív ZRNO-k számának négyzetgyöke. Akinek százszor több ZRNO-ja van, annak tízszer több szavazata van, nem százszor, így a legnagyobb POEN-egyenleg sem ad ellenőrzést a döntések felett.

Mit ellenőrizhetsz. A bejegyzett teljes összeg, a megtett lépések száma és a határig hátralévő rész az Alapítói hozzájárulás oldalon érhető el. Az alapítók nyilvántartása álnevekkel és részesedésekkel, beleértve azt is, kinek mennyit jegyeztek be, a résztvevők számára hozzáférhető.`,
      },
    ],
  },
  {
    id: "podrzi",
    naslov: "A KOLO támogatása",
    pitanja: [
      {
        id: 23,
        pitanje: `Hogyan működik az adomány az Alapítványnak, és mennyi POEN-t kapok?`,
        odgovor: `Bárki adományozhat, akinek fiókja van, akár a Kolóba lépés előtt is: dinárbefizetéssel az Alapítvány számlájára, kártyával vagy IPS QR-kóddal.

Amikor az Alapítvány megállapítja a befizetés beérkezését, a Protokoll automatikusan POEN-t jegyez be neked: az adomány összegét megszorozva az adományok nyilvántartási együtthatójával. Az együttható 1,00, és adományaid teljes összegének minden küszöbénél (5000, 10 000, 20 000, 50 000 dinár és tovább, felső határ nélkül) 0,10-dal nő. Ha egy adománnyal átlépsz egy küszöböt, az új együttható az egész adományra érvényes, az elért szint pedig véglegesen megmarad. Ez nem a ZRNO elszámolási együtthatója.

Az együttható azért nő, mert a nagyobb egyedi hozzájárulás nagyobb jelentőségű a közösség számára: egyszerre fedez egy szükségletet. Ez nem kedvezmény, mert adománnyal semmit sem vásárolsz, és semmilyen jogot nem szerzel az Alapítvánnyal szemben.

A nyilvános adományozó vezeték- és utóneve az adományok listájában szerepel az összeggel és a dátummal, álnév nélkül. A névtelen adomány csak összeggel és dátummal jelenik meg, és utána nem jár POEN. A POEN felhasználók közötti adásvételét a Felhasználási feltételek tiltják.

Az adomány visszafordíthatatlan. Az Alapítvány működési költségeit fedezi, a többlet pedig közösségi beszerzésekre megy.`,
      },
      {
        id: 74,
        pitanje: `Milyen pénznemben adományozok — küldhetek eurót külföldről?`,
        odgovor: `Küldhetsz — az adomány az Alapítvány számlájára történő befizetéssel adható, dinárban vagy más pénznemben, tehát euróban is külföldről. A platformon keresztüli bankkártyás fizetés és az IPS QR-kód csak dinárban működik.

A POEN ugyanazok szerint a szabályok szerint rögzül, mint bármely adománynál: összeg × az adományok nyilvántartási koefficiense, amely a halmozott összeggel nő 11 szinten át (részletesen az adományokról szóló kérdésben). A külföldi pénznemben lévő összeg a dináregyenértéken számít.

Kérésre az Alapítvány a törvénnyel összhangban igazolást állít ki az adományról.`,
      },
      {
        id: 24,
        pitanje: `Kik a Pártfogók, és miben különbözik ez az adománytól?`,
        odgovor: `A pártfogók cégek, egyéni vállalkozók, egyesületek és bejegyzett mezőgazdasági gazdaságok vezetői, akik pénzzel vagy javakkal és szolgáltatásokkal támogatják az Alapítvány munkáját.

A pártfogónak nincs saját fiókja: a POEN annak a fiókjára kerül, aki a pártfogót bejegyezte és a bejelentést benyújtotta (a törvényes képviselő, a tulajdonos vagy a meghatalmazott), illetve magának az egyéni vállalkozónak vagy a gazdaság vezetőjének. Pénzbeli pártfogáshoz nem kell a Kolóban lenni, a javakkal és szolgáltatásokkal való pártfogásra pedig csak résztvevő nyújthat be bejelentést. A POEN csak neki kerül bejegyzésre, akkor is, ha a cégnek több tulajdonosa van. A számítás és az együttható ugyanaz, mint a személyes adományoknál, a cég, illetve a gazdaság adományainak összegét pedig a személyes adományaidtól elkülönítve tartjuk nyilván. A legkisebb bejelentés 10 000 RSD.

Cégnek nem lehet fiókja, és nem kap POEN-t: fiókot emberre nyitunk, egy ember valóságát pedig egy másik ember erősíti meg. A cég tulajdonosának lehet saját fiókja magánszemélyként, a pártfogástól függetlenül.

Minden pártfogó nyilvánosan megjelenik a Pártfogók oldalon, az átláthatóság és a hozzájárulás nyilvános elismerése érdekében.

A javakkal és szolgáltatásokkal való pártfogás ellenérték nélküli adomány. Az Alapítvány nem állít ki számlát, és nem nyújt adótanácsadást. Az utalvány alapján átadott javakról és nyújtott szolgáltatásokról nem állítanak ki nyugtát és elektronikus számlát; az adományozó a teljesítést a platformról letöltött átadási igazolással dokumentálja. Az áfaalany adományozó köteles az ellenérték nélkül átadott javak és nyújtott szolgáltatások után a jogszabályok szerint áfát felszámítani.`,
      },
    ],
  },
  {
    id: "gazdinstva",
    naslov: "Gazdaságok",
    pitanja: [
      {
        id: 103,
        pitanje: `Mi a gazdaság a KOLO rendszerben, és miért fontos?`,
        odgovor: `A legfontosabb, amit a közösségben cserélnek, az élelmiszer. Minden kiló krumpli, liter tej vagy üveg méz, amelyet a szomszédtól veszünk, a mi vidékünkön marad, a belefektetett munkával és a termelő és a fogyasztó közötti bizalommal együtt.

A gazdaság olyan háztartás, amely élelmiszert vagy mezőgazdasági termékeket termel és kínál a Piacon. A gazdaság nem felhasználója a rendszernek, és nincs saját nyilvántartása a Protokollban: tagjai mindegyike a saját fiókjáról vesz részt, a gazdaság hozzájárulását pedig minden tag személyes nyilvántartásában rögzítik.

A jóváhagyott gazdaságok megjelennek a helyi termelők térképén, így mindenki láthatja, ki termel élelmiszert a településén vagy a környékén, és mit kínál.`,
      },
      {
        id: 104,
        pitanje: `Szerepelnem kell a mezőgazdasági termelők nyilvántartásában?`,
        odgovor: `Nem. A mezőgazdasági termelők nyilvántartásába való bejegyzés nem feltétel. Ha van kerted, gyümölcsösöd, tyúkjaid, kaptáraid, vagy házi ételt készítesz és kínálsz másoknak, a gazdaság akkor is bejelenthető, ha nincs bejegyezve. A feltételek ugyanazok a bejegyzett és a be nem jegyzett gazdaságra, és nyilvántartási kivonatot nem kell csatolni.

Gazdaságot bármely nagykorú felhasználó bejelenthet. Kolo-tag gazdaságvezetőként vagy tagként jelenti be, más tagokkal együtt. Megerősítés nélküli tag vagy felhasználó csak gazdaságvezetőként jelentheti be, más tagok nélkül; felhasználónak a bejelentés megnyitja az utat azok listájára, akik szeretnék, ha valaki felhívná őket (a telefonszámot és a listához szükséges hozzájárulást külön adja meg). Amikor egy Kolo-tag a listáról felhívja, ugyanez a beszélgetés a gazdaság jóváhagyásához is számít. Amikor egy Kolo-tag megerősít, a gazdaság tagokat is fogadhat.

Ha a gazdaság be van jegyezve, a bejelentésbe beírod a mezőgazdasági termelő nyilvántartási számát (BPG). Nyilvántartási kivonatot nem kell csatolni. A gazdaság jóváhagyása nem erősíti meg a gazdaságvezető valóságát; az csak a megerősítési láncban erősíthető meg. Az Alapítvány a nyilvántartásban szereplő adatokat nem ellenőrzi, egyébként pedig a nyilatkozatodra támaszkodik. A BPG-t más felhasználók nem látják.

A nyilvántartásba vétel megnyitja a gazdaság előtt az utat az állami támogatások, vásárok és vidékfejlesztési programok felé, ezért érdemes megfontolni. Ez a gazdaság döntése.`,
      },
      {
        id: 105,
        pitanje: `Hogyan lehet bejelenteni a gazdaságot, és mennyibe kerül?`,
        odgovor: `A bejelentés ingyenes, és a személyes fiókról történik: Gazdaságok → Gazdaság bejelentése.

A bejelentésbe beírod a gazdaság nevét, a BPG-t vagy azt a jelölést, hogy a gazdaság nincs bejegyezve, a helységet, a címet és a pontot a térképen, a szerepedet (gazda vagy tag), annak leírását, hogy mit és hogyan termeltek, valamint a gazda telefonszámát, illetve a sajátodat, ha a gazdának nincs fiókja. Nyilatkozol arról, hogy az adatok pontosak. Ha a fiókodhoz még nincs bejegyezve vezeték- és utónév, a bejelentés kéri; ez a fiókodhoz tartozó személyazonossági nyilvántartásba kerül, és másoknak nem jelenik meg.

Ezután legalább három élelmiszer- vagy mezőgazdasági termék-hirdetést adsz fel a gazdaság nevében, és ha a gazdaságnak lehetnek tagjai, meghívod a gazdaság azon tagjait, akiket személyesen ismersz. Amikor minden kész, a bejelentést átnézésre elküldöd az Alapítványnak.

Jóváhagyás előtt az Alapítvány beszél a gazdával, telefonon vagy személyesen, hogy meggyőződjön arról, hogy a gazdaság létezik, és azt termeli, amit megadtak; a többi taggal nem beszél. A beszélgetés nem a valódiság megerősítése, és nem kérnek benne dokumentumot. A telefonszámot csak az Alapítvány látja, csak erre a beszélgetésre használja, és törli, amikor dönt a bejelentésről; azoknak a listájához, akik szeretnék, ha valaki felhívná őket, a számot külön kell megadni. Ha valami hiányzik, a bejelentést kiegészítésre visszaküldik, annak magyarázatával, mit kell kiegészíteni.`,
      },
      {
        id: 106,
        pitanje: `Ki lehet a gazdaság tagja?`,
        odgovor: `A gazdaság tagja olyan nagykorú felhasználó, aki állandóan vagy időnként a gazdaságban dolgozik. A gazdaságot a gazda vagy a gazdaság tagja jelentheti be.

A gazdaság akkor vehet fel tagokat, ha Kolo-tag jelentette be. A felhasználó vagy megerősítés nélküli tag által bejelentett gazdaság csak akkor vesz fel tagokat, amikor a bejelentőt megerősíti egy őt személyesen ismerő Kolo-tag, illetve az Alapítvány.

Tagokat a gazdaság minden olyan tagja meghívhat, aki Kolo-tag, mégpedig olyan embereket, akiket személyesen ismer, az álnevük beírásával; a meghívottért az felel, aki meghívta. A meghívott a meghívás elfogadásával csatlakozik, nyilatkozva arról, hogy a gazdaságban dolgozik, és megadva a vezeték- és utónevét. A csatlakozást akkor hagyják jóvá, ha a meghívott Kolo-tag; ha nem az, megerősíti az, aki meghívta, vagy egy másik Kolo-tag, aki személyesen ismeri. Ha a gazdaságot már jóváhagyták, minden új csatlakozást az Alapítvány néz át.

A gazdaságot a platformon egyenlő módon irányítja a gazdaság minden tagja, aki Kolo-tag, és ugyanígy irányítja az a bejelentő is, aki felhasználó vagy megerősítés nélküli tag. Az a tag, akinek megszűnik a megerősítése, elveszíti az irányítási és meghívási jogot, amíg újra meg nem erősítik; a gazdaság tovább működik, tagságához és hozzájárulásához pedig nem nyúlnak. Az adatok pontosságáról szóló nyilatkozatért egy személy felel: a bejegyzett gazdaság gazdája, illetve a nyilvántartáson kívüli gazdaságnál a bejelentő. Ha a bejegyzett gazdaságot egy tag jelentette be, a gazda a csatlakozáskor átveszi a nyilatkozatot.

Egy személy csak egy gazdaság tagja lehet. Kiskorú fiók nem lehet gazdaság tagja, és nem hívható meg.`,
      },
      {
        id: 107,
        pitanje: `Mekkora a gazdaság hozzájárulása, és mikor kerül nyilvántartásba?`,
        odgovor: `Amikor az Alapítvány jóváhagyja a gazdaságot, a tagoknak a csatlakozás sorrendjében feljegyzik a hozzájárulást: az első tagnak 5.000 POEN-t, a másodiktól a hatodik tagig pedig 2.000-2.000 POEN-t. Az egytagú gazdaságnak összesen 5.000, a háromtagúnak 9.000, a hat- vagy többtagúnak 15.000 POEN jár. A később csatlakozó tagnak akkor jegyzik fel a hozzájárulást, amikor az Alapítvány jóváhagyja a csatlakozását.

A feljegyzett hozzájárulás még nem POEN-bejegyzés. Akkor kerül nyilvántartásba a nyilvántartásodban, amikor mindkét feltétel teljesül: közzétettél egy hirdetést, amellyel kínálsz valamit, bármelyiket, a gazdaság nevében vagy személyeset, és a Kolóban vagy, megerősítve vagy bevezetve. A csatlakozás előtt közzétett hirdetés is számít, még az is, amelyik közben lejárt; ha az első hirdetésért járó hozzájárulásod már rögzült, a gazdaság hozzájárulása azonnal rögzül, amint belépsz a Kolóba. Addig a POEN képernyőn feljegyzett hozzájárulásként látod.

Gazdasági hozzájárulása egy személynek legfeljebb egy gazdaság után lehet. Aki kilép egy továbbra is létező gazdaságból, megtartja a hozzájárulását, és egy másik gazdaságban nem szerzi meg újra. Ha a hozzájárulásodat azért semmisítették meg vagy írták le, mert a gazdaság megszűnt, egy másik gazdaságban újra megszerezheted, kivéve ha a gazdaság hamis nyilatkozat miatt szűnt meg.`,
      },
      {
        id: 108,
        pitanje: `Mit jelent a DOMAĆE jelölés a hirdetésen?`,
        odgovor: `Amikor a gazdaság tagja hirdetést tesz közzé, megválasztja, hogy a gazdaság nevében vagy személyes hirdetésként teszi-e közzé, például ha olyan szolgáltatást vagy tudást kínál, amely nem kapcsolódik a gazdasághoz.

A jóváhagyott gazdaság nevében közzétett hirdetés a DOMAĆE jelölést viseli, és a gazdaság profiljára vezet. A jelölés csak azt jelenti, hogy a hirdetést a rendszerhez csatlakozott gazdaság nevében tették közzé. Az Alapítvány nem ellenőrzi és nem szavatolja a felkínált jószág eredetét, minőségét és biztonságosságát; ezekért a hirdetés közzétevője felel.

A hirdetésben az összeget az határozza meg, aki a hirdetést közzéteszi. A cseréből származó POEN mindig annak a személyes bejegyzésébe kerül, aki a hirdetést közzétette; a gazdaságnak nincs közös bejegyzése.`,
      },
      {
        id: 109,
        pitanje: `Látható a címem a térképen?`,
        odgovor: `Igen. A jóváhagyott gazdaság a térképen a pontos helyén lévő pontként jelenik meg, a nevével, településével, leírásával, hirdetéseivel és a tagok álnevével együtt, a cím pedig a bejelentésben tett nyilatkozatod alapján jelenik meg. A megjelenítés a gazdasági hozzájárulás feltétele, és addig tart, amíg a gazdaság létezik; ez nem visszavonható hozzájárulás. A pontot a cím alapján az OpenStreetMap szolgáltatás keresi meg, te pedig egy kattintással áthelyezheted a térképen.

A megjelenítés akkor ér véget, amikor a gazdaság megszűnik, például törléssel. Törölni az a személy tudja, aki az adatok pontosságáról szóló nyilatkozatért felel, ha a gazdaságban nincsenek más tagok és fel nem használt utalványok. A gazdaság bármely megszűnésekor a feljegyzett gazdasági hozzájárulás törlődik, a nyilvántartottat pedig mindazoknál leírják, akik akkor tagok, akkor is, ha a bejegyzésük mínuszba kerül. A mínusz nem tartozás: az elsőként érkező POEN tölti fel. Törlés előtt látod, mennyit írnak le nálad. Az első hirdetésért járó hozzájárulást nem érinti.`,
      },
      {
        id: 110,
        pitanje: `Mi a teendő, ha a gazdaságomat valaki más jelentette be?`,
        odgovor: `Jelentkezz az Alapítványnál. Más gazdaságának bejelentése a tagjai tudta nélkül hamis nyilatkozatnak minősül.

Amikor az Alapítvány megállapítja, hogy a nyilatkozat hamis, a gazdaság jóváhagyását megsemmisíti, és a gazdaság megszűnik: a feljegyzett hozzájárulást megsemmisítik, a gazdaság nyilvántartásba vett hozzájárulását pedig leírják mindazoktól, akik abban az időszakban voltak tagok, amelyre a hamis nyilatkozat vonatkozik, azoktól is, akik közben kiléptek, mégpedig akkor is, ha a nyilvántartásuk ezzel negatívvá válik. A rendszerből való kizárást csak azzal szemben mondják ki, aki a hamis nyilatkozatot tette vagy tudott róla; a többiektől csak a gazdaság hozzájárulását írják le. Mindenki, akit ez érint, értesítést kap, és kifogást nyújthat be.`,
      },
    ],
  },
  {
    id: "zadruge",
    naslov: "Szövetkezetek",
    pitanja: [
      {
        id: 111,
        pitanje: `Mi a szövetkezet a KOLO rendszerben?`,
        odgovor: `A szövetkezet olyan hely, ahol a szomszédok együtt fogadják és osztják el, amit megtermelnek: beviszed a krumplit a kertedből, a szövetkezet POEN-t vezet át neked, a krumplit pedig kiadja egy szövetkezeti tagnak vagy egy másik szövetkezetnek.

Jogilag a szövetkezet a szövetkezetekről szóló törvény szerint a nyilvántartásba bejegyzett jogi személy, amely együttműködési szerződést kötött az Alapítvánnyal. A rendszerben saját bejegyzése van a Protokollban, és a saját helyén, egy településen működik: javakat fogad elosztásra, kiadja azokat a tagjainak és más szövetkezeteknek, és feladatokat tesz közzé a közösség számára.

A szövetkezetet a tagjai irányítják, a törvényben és a szövetkezeti szabályokban előírt szerveken keresztül. Az Alapítványnak nincs szavazati, javaslattételi vagy egyetértési joga a szövetkezet szerveiben, és semmilyen jogot nem szerez a vagyonára. A szövetkezet nem válik a közjó egyetlen részének tulajdonosává sem.`,
      },
      {
        id: 112,
        pitanje: `Hogyan alakul szövetkezet a településemen?`,
        odgovor: `A település első szövetkezete akkor jegyezhető be a rendszerbe, amikor abban a településen legalább 50 résztvevő van, Kolo-tagok és megerősítés nélküli tagok. Alapításában az Alapítvány szervezési és szakmai támogatással vesz részt. A településed előrehaladását a Szövetkezetek oldalon látod.

Ha a településen már működik szövetkezet, minden további a résztvevők kezdeményezésére jegyezhető be a rendszerbe, legalább öt szövetkezeti taggal; az 50 résztvevőre vonatkozó feltétel rá nem vonatkozik.

Mindkét esetben a szövetkezetet először a szövetkezetekről szóló törvény szerint jegyzik be a nyilvántartásba, az Alapítvánnyal pedig együttműködési szerződést köt. Az a település, amelyhez tartozol, az, amelyet a fiókodban megadtál.`,
      },
      {
        id: 113,
        pitanje: `Ki lehet szövetkezeti tag?`,
        odgovor: `Szövetkezeti tag kizárólag résztvevő lehet, Kolo-tag vagy megerősítés nélküli tag, akit a szövetkezet a saját szabályai szerint felvett a tagjai közé. Kiskorú fiók nem kapcsolható szövetkezethez, és egy személy csak egy szövetkezetben lehet szövetkezeti tag.

A szövetkezet a vezeték- és utónevedet és az álnevedet csak akkor adja át az Alapítványnak, ha ehhez hozzájárultál. A vezeték- és utónév a személyazonossági nyilvántartásba kerül, és a többi felhasználónak nem jelenik meg.

A szövetkezeti tagnak megvan minden joga, amely a Kolóban megilleti, és ezen felül a szövetkezetén belüli jogai: részvétel az elosztásban, a szövetkezeti hozzájárulásban, valamint a szövetkezet felszereléseinek és földjének használatában. A szövetkezeti tagság semmilyen további jogosultságot nem ad a rendszerben.`,
      },
      {
        id: 114,
        pitanje: `Hogyan zajlik a csere a szövetkezeten keresztül?`,
        odgovor: `Javat viszel a szövetkezetnek, például krumplit a kertedből. A szövetkezet azt a tagok nevében és javára veszi át elosztásra, és átvételkor POEN-t ír át neked a saját bejegyzéséből. Ez a POEN a tiéd: felhasználod a szövetkezetben, más felhasználóknál, vagy megtartod.

A szövetkezet a javat szövetkezeti tagnak vagy másik szövetkezetnek adja ki, és kiadáskor a POEN visszakerül a szövetkezet bejegyzésébe. Ugyanígy rögzíti a szövetkezet a felszerelése, gépei vagy földje használatát, a szolgáltatásokat és a közösségi feladatokat.

Az átvételért, a kiadásért és a munkáért járó POEN számát a szövetkezet határozza meg, saját szervein keresztül és saját szabályai szerint. Az Alapítvány ezt az összeget nem határozza meg, nem ajánlja és nem hagyja jóvá.`,
      },
      {
        id: 115,
        pitanje: `Honnan származik a POEN a szövetkezet bejegyzésében?`,
        odgovor: `Amikor a szövetkezeti tagok száma eléri a szövetkezetekről szóló szabályzat küszöbeit, a Protokoll új POEN-bejegyzéseket jegyez be a szövetkezet nyilvántartásába. Minden küszöb csak egyszer rögzül: ha a szövetkezeti tagok száma később csökken, semmit sem írnak le, ugyanannak a küszöbnek az ismételt elérése pedig nem rögzül újra.

A szövetkezet nyilvántartása nem lehet negatív, így a szövetkezet csak azzal rendelkezik, ami benne van. A nyilvántartásból és a nyilvántartásba POEN kizárólag jogalappal kerül: áru átvétele, áru kiadása, szövetkezeti hozzájárulás, felszerelés vagy föld használata és szolgáltatások. Szabad átírás nincs, sem felhasználó, sem másik szövetkezet felé.`,
      },
      {
        id: 116,
        pitanje: `Ki látja a szövetkezet bejegyzéseit?`,
        odgovor: `A szövetkezet bejegyzéseit minden résztvevő látja, a szövetkezet neve alatt, a szövetkezeti tagok pedig álnéven jelennek meg bennük. A szövetkezeti tagok száma és a nyilvántartás egyenlege a szövetkezet oldalán látható.

A szövetkezeti tag vezeték- és utóneve nem nyilvános. Csak az adminisztrációs csapat látja, te pedig az adataid exportjában látod.`,
      },
      {
        id: 117,
        pitanje: `Mi történik, ha a szövetkezet kilép a rendszerből?`,
        odgovor: `A részvétel az együttműködési szerződés felmondásával vagy a szövetkezetnek a nyilvántartásból való törlésével szűnik meg. Ekkor a szövetkezet nyilvántartását lezárják, a benne nyilvántartott POEN-t pedig a Protokoll javára szóló ellenbejegyzéssel megsemmisítik. A POEN nem a szövetkezet vagyona, és senkire sem száll át.

A szövetkezeti tagok és minden más felhasználó nyilvántartásában lévő POEN érintetlen marad.`,
      },
    ],
  },
  {
    id: "programi",
    naslov: "Szociális programok és közösségi feladatok",
    pitanja: [
      {
        id: 16,
        pitanje: `Mik a szociális programok, és melyek léteznek?`,
        odgovor: `A részvétel egyes formái nem rögzíthetők egyedi cserékként, ezért vannak rájuk a szociális programok.

A szociális programok azokat a csoportokat fedik le, amelyek részvétele a közösségben állandó és szétszórt: Anyák Támogatása (és más elsődleges gondviselőké), Idősek Támogatása, Különleges Támogatás (nehéz körülmények között élő felhasználók) és Tanulás. Amint a kérelmedet megerősítik, a Protokoll napi szinten, automatikusan rögzít neked POEN-t, az egyes tevékenységek bejelentése nélkül. Ez nem szociális segély és nem juttatás — ez az a mód, ahogyan az ilyen részvétel is egyenrangú helyet kap a rendszerben.

Rajtuk kívül a Programokhoz tartoznak a hozzájárulások is: a platform tartalmához való hozzájárulás (az első hirdetés és a gazdaság), az működési hozzájárulás (munka a közös jóért közzétett feladatokon keresztül) és a gyerekhozzájárulás (a gyerekek részvétele a gyermektérben, lásd a „Gyerekek és szülők” szakaszt). Mindegyiket külön kérdés magyarázza.

A szociális programokra a résztvevők jelentkezhetnek, a megerősítés nélküli tag is. A feltételek teljesülését a jóváhagyás előtt egy Kolo-tag erősíti meg, aki személyesen ismer, illetve az Alapítvány.`,
      },
      {
        id: 17,
        pitanje: `Ki jelentkezhet az Anyák Támogatására?`,
        odgovor: `Az anya vagy a gyerek más elsődleges gondviselője — a program a gyerekről való gondoskodást követi, nem kizárólag az anyaságot.

Az összeg a gyerekek számától és korától függ: a gyerekenkénti alap csökken, ahogy a gyerek nő, a szorzó pedig minden további gyerekkel emelkedik, így a nagyobb családok arányosan nagyobb támogatást kapnak. A pontos összegek és példák az Anyák Támogatásának összegeiről szóló külön kérdésben szerepelnek.

A kérelem a platformon keresztül megy — a gyerekek adatait űrlapon adod meg, dokumentumok csatolása nélkül.`,
      },
      {
        id: 79,
        pitanje: `Naponta hány POEN-t hoz gyerekenként az Anyák Támogatása, és hogyan hat az összegre a gyerekek száma és kora?`,
        odgovor: `Minden gyerekre a kiinduló napi alap 2.000 POEN, csökkentve 100 POEN-nel a gyerek életkorának minden éve után — a támogatás fokozatosan csökken, ahogy a gyerek nő, és megszűnik, amikor a gyerek betölti a 20. évét.

A gyerekek száma növeli a teljes összeget, de nem egyszerű összeadással: minden további gyerek nagyobb szorzót hordoz. Az első gyerek ×1,00, a második ×1,20, a harmadik ×1,50, a negyedik ×2,00, az ötödik ×3,00, a hatodik ×4,50, a hetedik ×6,00, a nyolcadik ×8,00, a kilencedik ×10,00. Így a nagyobb családok arányosan nagyobb támogatást kapnak.

Példa: egy hároméves gyerek — (2.000 − 300) × 1,00 = 1.700 POEN naponta. Ugyanez a gyerek harmadikként — (2.000 − 300) × 1,50 = 2.550 POEN naponta.

A támogatás automatikusan, napi szinten rögzül, amíg a státusz tart, az egyes tevékenységek bejelentése nélkül. A többi szociális programhoz hasonlóan a közös napi keretet osztja, így a sok hozzájárulást hozó napokon az összegek arányosan csökkenhetnek. A paramétereket a támogatási programokról szóló szabályzat állapítja meg, és annak módosításával változtathatók.`,
      },
      {
        id: 61,
        pitanje: `Mi az „Idősek Támogatása” — ki jogosult és hogyan jelentkezem?`,
        odgovor: `Az Idősek Támogatása szociális program az 50 éves és idősebb résztvevők számára.

A napi összeg az életkorral nő: a betöltött 50. életévtől 1.000 POEN, minden további évvel 100 POEN-nel több — a 65 éves résztvevő napi 2.500 POEN-t, a 80 éves résztvevő napi 4.000 POEN-t kap.

A jelentkezés a platformon keresztül történik, és a résztvevők számára nyitott; a POEN ezután automatikusan, napi szinten rögzül, az egyes tevékenységek bejelentése nélkül. A többi szociális programhoz hasonlóan ez sem szociális segély és nem juttatás. A Protokoll ezzel olyan részvételt ismer el, amely az egyedi cseréken keresztül nem látszik. A részletes feltételeket és az életkor megerősítésének módját a Támogatási programokról szóló szabályzat határozza meg.`,
      },
      {
        id: 18,
        pitanje: `Mi a Különleges Támogatás és hogyan lehet jelentkezni?`,
        odgovor: `A Különleges Támogatás a nehéz körülmények között élő felhasználók programja. Két jogalap van.

Az első a csökkent képesség: van olyan határozatod az illetékes hatóságtól, amely a fogyatékosság fokát megállapította — ideértve a munkaképesség-értékelő bizottság határozatát is —, vagy akut, illetve krónikus betegség miatt nem tudsz részt venni, vagy ebben lényegesen korlátozott vagy. Ha a csökkent képességű személy nagykorú résztvevő, a jogosultság az övé; ha nem résztvevő, azé, aki közvetlenül gondoskodik róla; ha kiskorú, a szülőé, annak nagykorúvá válásáig. Egy ilyen helyzetből egy összeg jár — a jogalap csak azt dönti el, kinek a nyilvántartásába.

A második az otthon elvesztése: elemi csapásban, tűzvészben, árvízben vagy kényszerű lakóhelyelhagyás során elvesztetted otthonodat vagy az élethez szükséges vagyonodat. Ez a jogalap az eseménytől számított tizenkét hónapig tart, és magától megszűnik.

A jelentkezéskor csak azt kérdezzük, LÉTEZIK-e a határozat — nem a tartalmát, nem a fokot, nem a munkaképesség értékelését, nem a diagnózist, nem az orvosi dokumentációt. Betegség és otthonvesztés esetén az igazolás a nyilatkozatod, egyetlen okirat nélkül, egy téged személyesen ismerő Kolo-tag, illetve az Alapítvány megerősítésével.

Az összeg fix, napi 2.000 POEN, minden jogalap esetén ugyanannyi. Ez a program nem zárja ki az Anyák Támogatását — mindkettőt megkapod, akkor is, ha mindkettő ugyanarra a gyerekre vonatkozik.

A résztvevők látják, hogy Különleges Támogatást kapsz, és mennyit, mert a közösség nyilvántartásának ellenőrizhetőnek kell lennie. De NEM látják, milyen jogalapon — a program pedig a csökkent képességet és az otthon elvesztését egyaránt magában foglalja, így a megnevezés semmit nem árul el. A jogalapot te látod, és az a személy, aki a kérelmet az Alapítványnál feldolgozza.`,
      },
      {
        id: 96,
        pitanje: `Mi a Tanulás program, és kikre vonatkozik?`,
        odgovor: `A Tanulás szociális program azoknak, akik tanulnak: általános és középiskolás tanulóknak és egyetemi hallgatóknak.

A napi összeg fix, 2.000 POEN, amíg a jogállás fennáll. A jogállást évente egyszer ellenőrzik; ha a felülvizsgálatkor nem erősítik meg, a bejegyzés megszűnik.

A jelentkezés ugyanazok szerint a szabályok szerint történik, mint a többi szociális programnál: a platformon keresztül, az adatok űrlapba való beírásával (ennél a programnál a beíratott osztály, illetve évfolyam), dokumentumok csatolása nélkül. Gyermek helyett a kérelmet a szülő nyújtja be, és a jogosultság addig tart, amíg a gyerek fiókja Kolo-gyermek.`,
      },
      {
        id: 62,
        pitanje: `Mi a „státusz igazolása” a szociális programnál — be kell nyújtanom anyakönyvi kivonatot vagy a gyerek dokumentumát?`,
        odgovor: `Egyetlen dokumentumot sem csatolsz, semmit nem kell beszkennelni vagy elküldeni.

Az adatokat a platformon egy űrlapba írod be: az Anyák Támogatásánál például a gyerek nevét és születési dátumát. A neked rögzülő összeg a gyerekek számától és életkorától függ.

A feltételek teljesülését ezután, a beírt adatokba való betekintés nélkül egy Kolo-tag erősíti meg, aki személyesen ismer: aki megerősített, vagy egy másik Kolo-tag, aki ismer. Az a Kolo-tag, aki csak telefonos beszélgetés után vezetett be a Kolóba, valamint a megerősítés nélküli tag erre nem jogosult; ha ilyen Kolo-tag nincs, a feltételek teljesülését az Alapítvány állapítja meg. A kérelmet ezután az Alapítvány hagyja jóvá. A beírt adatok nem nyilvánosak: csak az látja őket, aki a kérelmet feldolgozza. Érzékeny adatokról van szó, ezért csak a kifejezett hozzájárulásoddal kezelik őket, a hozzájárulást pedig bármikor visszavonhatod — ekkor a POEN automatikus bejegyzése is megszűnik.

Az egyes csoportok jogállásának megerősítésére vonatkozó részletes feltételeket a honlapon közzétett, Támogatási programokról szóló szabályzat határozza meg.`,
      },
      {
        id: 20,
        pitanje: `Lehetek egyszerre több programban?`,
        odgovor: `Igen, ha több program feltételeinek is megfelelsz — az az anya, aki tanul, lehet az Anyák Támogatásában és a Tanulásban is. Minden programra külön kell jelentkezni.

A szociális programok és a működési hozzájárulás közös napi keretet osztanak, amely a rendszerben lévő POEN teljes mennyiségének 10%-a, hogy ne rögzüljön túl sok POEN egyszerre — ha több a hozzájárulás, mint amennyit a keret befogad, a napi összegek arányosan csökkennek. A platform tartalmához való hozzájárulás és a gyerekhozzájárulás nem tartozik ebbe a keretbe.`,
      },
      {
        id: 97,
        pitanje: `Mi a platform tartalmához való hozzájárulás?`,
        odgovor: `A platform tartalmához való hozzájárulást a Protokoll két dologért jegyzi be.

Első hirdetés: amikor közzéteszed az első szabályos hirdetésedet, amellyel árut vagy szolgáltatást kínálsz, 1.000 POEN rögzül neked, mégpedig akkor, amikor az Alapítvány jóváhagyja a hirdetést. Ez a hozzájárulás fiókonként egyszer rögzül, függetlenül attól, hány hirdetést teszel közzé később.

Gazdaság: amikor a gazdaságodat jóváhagyják, illetve amikor csatlakozol hozzá, feljegyzik neked a gazdaság hozzájárulását (a tagonkénti összeget a KOLO rendszer szabályzatának 40c. cikke határozza meg). Akkor jegyzik be, amikor közzéteszel egy hirdetést, amellyel kínálsz valamit, és amikor belépsz a Kolóba, megerősítéssel vagy bevezetéssel.

A csere önmagában nem jegyez be új POEN-t: amikor valakinek átírsz POEN-t, az csak a te nyilvántartásodból az övébe kerül át. Semmit sem kell bejelentened.`,
      },
      {
        id: 19,
        pitanje: `Hogyan működik a működési hozzájárulás?`,
        odgovor: `Az működési hozzájárulás a közös jóért végzett munkát rögzíti, amely egyébként láthatatlan maradna: önkéntességet, idősekről való gondoskodást, közös tevékenységekben végzett munkát, alkotó hozzájárulásokat.

Minden egy közzétett feladaton keresztül történik: valaki közzéteszi, egy résztvevő (Kolo-tag vagy megerősítés nélküli tag) jelentkezik és elvégzi, a teljesítést megerősítik, és csak ekkor jegyez be a Protokoll POEN-t. A kezdeti szakaszban a feladatokat az Alapítvány teszi közzé, és a teljesítést is ő erősíti meg; a közösségi irányítás aktiválása után a feladatokat a Felső Kolo és a Kolo-őrzők is közzéteszik, a teljesítést pedig a Kolo-őrzők erősítik meg.

Nincs óradíj. A feladat mellett javasolt POEN áll, de ez súlyozási tájékoztató, nem ár — a ténylegesen bejegyzett összeg attól függ, hány hozzájárulás osztozik aznap a közös napi kereten, így az összegek arányosan oszlanak el.`,
      },
      {
        id: 63,
        pitanje: `Van program a munkanélkülieknek vagy általános anyagi szükséghelyzetre?`,
        odgovor: `Jelenleg nincs külön program a munkanélküliségre vagy általános anyagi szükséghelyzetre.

A szociális programok pontosan meghatározott csoportokat fednek le, amelyek részvétele a közösségben állandó és szétszórt, ezért egyedi cseréken keresztül nem rögzíthető: az anyákat és az elsődleges gondviselőket, az időseket, a fogyatékossággal élőket és azokat, akik tanulnak. Sem a munkanélküliség, sem a szegénység nincs e csoportok között — a szociális programok nem szociális segélyek és nem juttatások, hanem azt szolgálják, hogy a szétszórt részvétel egyenrangú helyet kapjon a rendszerben, nem pedig az anyagi helyzet miatti támogatás formái.

Ha anyagi szükséghelyzetben vagy, a POEN-hez vezető út ugyanaz, mint mindenki másnak: javak és szolgáltatások cseréje másokkal, az első hirdetésért járó hozzájárulás és a működési hozzájárulás, vagyis munka a közös jóért közzétett feladatokon keresztül.

Új jogosult csoportok később hozzáadhatók: az első szakaszban erről az Alapítvány dönt, a közösségi irányítás aktiválása után pedig a Felső Kolo. Konkrét jövőbeli programok még nincsenek kidolgozva.`,
      },
      {
        id: 64,
        pitanje: `Munka ez? Van jövedelmem, szerződésem vagy garantált havi összegem?`,
        odgovor: `Nem. Ez nem munka munkaviszony értelmében, és garantált összeged sincs.

Te döntöd el, jelentkezel-e egy feladatra, hogyan végzed el és milyen ütemben — és bármikor visszaléphetsz, következmények nélkül. Senki nem parancsol neked, és nincs munkavégzési kötelezettséged. Ezért ez nem munkaviszony: nincs felettes, nincs munkavégzési kötelezettség, nincs bér.

Nincs olyan szerződés sem, amely szerint az elvégzett X-ért pontosan Y POEN rögzülne. A hozzájárulásod és a POEN rögzítése két különálló aktus: te hozzájárulsz, a Protokoll pedig ezt követően a szabályok szerint rögzít POEN-t. Ebből nem keletkezik követelés az Alapítvánnyal szemben — nincs kitől „behajtanod”.

A POEN nem bér és nem díjazás. A közzétett feladat mellett javasolt POEN áll, de ez súlyozási iránymutató, nem garantált összeg: az, hogy mennyi rögzül ténylegesen, attól függ, hány hozzájárulás került aznap a közös napi keretbe, amely arányosan oszlik el. Ami aznap nem fér bele a keretbe, nem vihető át holnapra, és nem keletkeztet kötelezettséget a rendszer részéről feléd.

Ez a közösségnek nyújtott önkéntes hozzájárulás, amely rögzítésre kerül — nem pedig garantált havi keresettel járó munka.`,
      },
    ],
  },
  {
    id: "deca",
    naslov: "Gyerekek és szülők",
    pitanja: [
      {
        id: 85,
        pitanje: `Hány éves kortól lehet a gyereknek fiókja, és hogyan nyílik meg?`,
        odgovor: `Az alsó korhatár hét év. A fiók kétféleképpen nyitható meg.

Az első: te nyitod meg a saját fiókodból, és kijelented, hogy ez a te gyereked. Ehhez nem kell a Kolóban lenned. Te felelsz azért, amit a gyerek közzétesz és tesz.

A második: a gyerek maga nyitja meg, és megadja az e-mail-címedet. Ekkor üzenetet kapsz, amelyben átveheted a fiókot, jelezheted, hogy ez nem a te gyereked, vagy törölheted a fiókot. Az utóbbi két lépés a platformra való bejelentkezés nélkül is elvégezhető, mert a címedet bárki beírhatja. Az üzenetben csak a gyerek álneve szerepel, soha a neve.

Az üzenetben kapott link hét napig érvényes. Ha a fiókot tizennégy napon belül senki sem veszi át, törlődik. Ha az üzenet nem érkezett meg, a gyerek profiljában van egy hatjegyű kód, amelyet a link helyett megadhatsz.

A születési dátumot te adod meg az átvételkor. Megerősítés előtt ellenőrizd, mert a beírás után nem módosítható, és ettől függ, mikor válik a fiók nagykorúvá.

A gyerek fiókja három állapot egyikében van, és a gyerek profilján olvasható, mire várnak.

Várakozó gyermek: a fiókot még senki sem vette át. A gyereknek van profilja, és személyesen köt barátságokat, a hirdetéseket pedig látogatóként látja; nincs Beszélgető, üzenetek és hirdetések.

Szülős gyermek: te nyitottad meg vagy vetted át a fiókot. A gyerek a barátainak ír a Beszélgetőben és üzenetekben, iskolát választ, és látja a hirdetéseket, a hirdető álneve nélkül, kivéve a barátokét. Nem ad fel hirdetést, és nem ír át POEN-t, veled sem.

Kolo-gyermek: te Kolo-tag vagy, és egy Kolo-tag, aki személyesen ismer, megerősítette, hogy van ilyen gyereked. Ekkor a fiók a gyermektér teljes terjedelmében működik.`,
      },
      {
        id: 101,
        pitanje: `A gyerek nagykorúként regisztrált — helyre lehet ezt hozni?`,
        odgovor: `Igen. A fiók nem törlődik: az Alapítvány kérésre gyermekfiókká alakítja, és hozzád mint szülőhöz kapcsolja. Írj nekünk a kontakt@ekolo.rs címre a fiókod e-mail-címéről, és add meg a gyerek álnevét.

A fiók ezzel megkapja a gyermekmód minden védelmét: zárt profilt, a te kapcsolódat a nagykorú felhasználókkal való kommunikációhoz és cseréhez, barátságokat és a gyermekek Beszélgetőjét. Elveszíti azt, ami e mód szerint a gyereket nem illeti meg: a kapott és adott megerősítések és Kolóba való bevezetések megszűnnek, a ZRNO-t leírják, a Protokoll által a csatornákon keresztül bejegyzett POEN-t (megerősítések, a platform tartalmához való hozzájárulás, adományok, programok) pedig megsemmisítik. Az emberek által átírt POEN megmarad — az átírás nem teremt új POEN-t, csak áthelyezi a bejegyzést, és a gyerek birtokolhatja. Megszűnik a gazdasági tagság is: a gazdaság feljegyzett hozzájárulását megsemmisítik, a nyilvántartásba vettet pedig leírják. A hirdetések, az üzenetek és az előzmények megmaradnak. Az átalakított fiók szülős gyermek, Kolo-gyermekké pedig ugyanolyan feltételekkel válik, mint bármely más.

A nyilvántartás ennek során mínuszba kerülhet, mégpedig mindkét oldalon: annál a gyereknél is, aki a POEN-t már elköltötte, és annál is, aki megerősítette, és akinek ez a megerősítés megsemmisül. A mínusz nem tartozás, és nem hajtják be — az első beérkező POEN kitölti.

A lépés visszafordíthatatlan. A fiók a tizennyolcadik születésnapon magától válik nagykorúvá, az akkor megadott születési dátum szerint.`,
      },
      {
        id: 86,
        pitanje: `Nem vagyok a Kolóban. Átvehetem a gyerekem fiókját?`,
        odgovor: `Igen. A gyerek fiókjának megnyitásához és átvételéhez nem kell a Kolóban lenned.

1. Nyisd meg a saját fiókodat. Az üzenetben kapott link egyenesen a regisztrációhoz vezet.

2. Vedd át a gyereket, és jelentsd ki, hogy a tiéd. A fiók ezzel szülős gyermek lesz: a gyerek a barátainak ír, iskolát választ és látja a hirdetéseket, de nem ad fel hirdetést, és nem ír át POEN-t, veled sem.

3. Erősítsen meg egy Kolo-tag, aki személyesen ismer. Ha a Kolóba egy még meg nem erősített ismerősöd, vagy egy Kolo-tag telefonos beszélgetés után vezetett be, megerősítés nélküli tag vagy, és a gyereked ezzel még nem válik Kolo-gyermekké.

4. Kérd annak megerősítését, hogy van gyereked. Kolo-tagként a kérést minden gyerekre külön küldöd el. A Kolo-tagok látják a Megerősítések oldalon, az álneveddel és a gyerekről szóló adatok nélkül, és egy Kolo-tag erősíti meg, aki személyesen ismer. Ugyanannak a gyereknek a másik szülője nem adhat megerősítést, és a megerősítés nélküli tag sem. A kérésnek nincs határideje, és senkinek sem hoz POEN-t. Ha a megerősítés nem érkezik meg, semmit sem vesznek el tőled: a helyzeted és a nyilvántartásod megmarad, a gyerek fiókja pedig szülős gyermek marad.

Amikor a gyerek létezését megerősítették, a fiók Kolo-gyermekké válik: hirdetések, átírások és barátságokból származó POEN. A barátságok közben is létrejönnek és rögzülnek, az utánuk járó POEN pedig akkor rögzül, amikor mindkét gyerek Kolo-gyermek.`,
      },
      {
        id: 100,
        pitanje: `A gyerek elfelejtette a jelszavát — most mi lesz?`,
        odgovor: `Két út van.

Ha a gyerek megadta a profiljában a saját e-mail-címét, és megerősítette az arra a címre küldött hivatkozásra kattintva, egyszerűen új jelszót kér, mint bármely más felhasználó. Ez a cím kizárólag erre szolgál — értesítéseket nem küldünk rá.

Ha a gyereknek nincs saját címe, az új jelszót te állítod be a saját profilodból. A régit nem kell tudnod, a gyerek pedig értesítést kap az új jelszóról.`,
      },
      {
        id: 87,
        pitanje: `Mindkét szülőnek lehet hozzáférése?`,
        odgovor: `Igen. A második szülő ugyanazon az úton lép be, mint az első, és ugyanazokat a jogosultságokat kapja: ugyanazt a betekintést, ugyanazt a törlési jogot és ugyanazokat a kapcsolókat. Ez azt is jelenti, hogy kettejük közül bármelyik egyedül is törölheti a gyerek fiókját.

A gyereknek elég, ha az egyik szülő olyan Kolo-tag, akinek megerősítették, hogy van ilyen gyereke, és a fiók Kolo-gyermek lesz.

Ha az a személy, aki a fiókot megnyitotta vagy átvette, nem szülője a gyereknek, ezt az Alapítványnak bejelentheti a gyerek a saját kezdőoldaláról („Ez nem a szülőm”), a másik szülő, vagy bármely más felhasználó a gyerek profiljáról. Az Alapítvány ezt a kapcsolatot azonnal felfüggeszti, amíg döntést nem hoz: a személynek ez idő alatt nincs szülői betekintése és jogosultsága. A felfüggesztés nem intézkedés, és nem jelenti azt, hogy a nyilatkozat valótlan. Ha megállapítja, hogy a személy nem szülő, az Alapítvány a kapcsolatot megszünteti, az e személynek adott, a gyerek létezését igazoló megerősítés hatályát veszti, a személyt pedig kizárják a rendszerből; ha a gyerek szülő nélkül marad, a fiók nem törlődik, hanem várakozó gyermek lesz, és az átvételre nyitva álló tizennégy napos határidő újraindul. Ellenkező esetben a kapcsolat újra működik. Az Alapítvány nem fedi fel annak a személynek, akire a bejelentés vonatkozik, hogy ki tette a bejelentést, sem az eljárás alatt, sem a döntés után. A döntés ellen a bejelentő és az érintett személy is kifogást nyújthat be.`,
      },
      {
        id: 88,
        pitanje: `Megközelítheti-e felnőtt a gyerekemet?`,
        odgovor: `A beállításaidtól függetlenül a következők érvényesek. A gyerek profilja minden nagykorú felhasználó előtt zárva van, nem csak a be nem jelentkezett látogatók előtt: aki megnyitja a gyerek profiljának címét, csak magyarázatot lát arról, miért zárt, és ki a szülője, semmi többet — sem az egyenleget, sem az iskolát, sem a hirdetéseket, sem a barátságokat. A gyerek a felhasználók keresésében sem jelenik meg. Barátság kizárólag QR-kód személyes beolvasásával köthető, a kód öt percig érvényes, és nincs olyan száma, amelyet telefonon le lehetne diktálni, így távolról barátság nem köthető.

A nagykorúakkal való beszélgetést csak a gyerek profiljában lévő szülői kapcsoló nyitja meg. Amíg ki van kapcsolva, felnőtt nem írhat a gyereknek. A bekapcsolt kapcsoló sem nyitja meg a profilt — a beszélgetést és a cserét szabályozza, nem a fiókba való betekintést. A kapcsoló csak a betöltött tizenötödik életévtől hat, és csak akkor, ha a fiók Kolo-gyermek: a fiatalabb gyerek a hozzájárulásoddal sem beszélget felnőttekkel.

Ha bekapcsolod, három szabály érvényes:

• te olvasod ezt a beszélgetést, de nem írsz bele;

• a nagykorú beszélgetőpartner látható felirat jelzi, hogy a beszélgetést a szülő olvassa;

• értesítést egy új beszélgetés első megkeresésekor kapsz, nem minden üzenetnél.

A gyerek más gyerekekkel folytatott beszélgetéseit nem olvasod. Erről a következő kérdésben.`,
      },
      {
        id: 89,
        pitanje: `Mit látok a gyerekem fiókjából?`,
        odgovor: `A betekintésed kiterjed:

• a barátok listájára, a barátságkötés dátumaival;

• a beszélgetések listájára, tehát kivel és mennyit, az üzenetek tartalma nélkül;

• a POEN-átírások teljes előzményére;

• minden hirdetésre, amelyet a gyerek közzétett.

A gyerekek egymás közötti beszélgetéseit nem olvasod. Ennek oka, hogy minden ilyen beszélgetésben más gyereke is részt vesz, akinek a szülője a betekintéshez nem járult hozzá. Kivétel a gyerek és nagykorú személy beszélgetése, amelyet olvasol.

A barátságokat nem hagyod jóvá. Személyesen, kód beolvasásával jönnek létre, te pedig értesítést kapsz és látod a listát.

Bármikor eltávolíthatsz hirdetést, kikapcsolhatod a felnőttekkel folytatott beszélgetés kapcsolóját, és törölheted a fiókot.`,
      },
      {
        id: 90,
        pitanje: `Mi van, ha a gyerek nem megfelelő üzenetet kap?`,
        odgovor: `Mondd meg a gyereknek, hogy azonnal szóljon neked. Te vagy az első, akihez fordul, nem a platform.

A Beszélgetőben a gyerek csak a barátai üzeneteit látja. Ezért a leggyorsabb lépés a barátság felbontása: amint a gyerek felbontja, ezeket az üzeneteket többé nem látja. Felbontani csak a gyerek tudja, és ha az adott barátságért POEN rögzült, mindkét gyerek 500-at veszít.

Ha az üzenet olyan, hogy látnunk kell, írj nekünk a kontakt@ekolo.rs címre a gyerek álnevével és az üzenet idejével. Az Alapítvány eltávolíthatja az üzenetet, és lezárhatja azt a fiókot, amelyről küldték.`,
      },
      {
        id: 91,
        pitanje: `Felelek-e azért, amit a gyerek tesz?`,
        odgovor: `Igen. Azért, amit a gyerek a platformon közzétesz és tesz, te felelsz.

A felelősség arra terjed ki, ami nyilvános és amit láthatsz: a hirdetésekre, a POEN-átírásokra, a másokkal szembeni viselkedésre. Mindehhez van betekintésed és gombod is. Két gyerek magánbeszélgetése nem a te tereped, mert nem is csak a te gyerekedé.

Bármikor eltávolíthatsz hirdetést, kikapcsolhatod a felnőttekkel folytatott beszélgetést, vagy törölheted a fiókot.`,
      },
      {
        id: 92,
        pitanje: `Hogyan szerez a gyerek POEN-t?`,
        odgovor: `Háromféleképpen, és mindháromhoz a fióknak Kolo-gyermeknek kell lennie: legalább az egyik szülő Kolo-tag, és megerősítették neki, hogy van ilyen gyereke.

Barátság. Ez az egyetlen mód, ahogyan a gyereknek POEN-t jegyeznek be: minden megkötött barátságért 500-500 POEN rögzül mindkét gyereknek, amikor mindkét fiók Kolo-gyermek. Amíg várni kell, mindkettőjüknél felirat jelzi, hogy 500 várakozik: ez feljegyzett hozzájárulás, amely még nincs bejegyezve, és nem számít bele az egyenlegbe. Ugyanannak a szülőnek két gyereke között a barátság rendesen megköthető és látható a Beszélgetőben, de nem hoz POEN-t.

Piac. A Kolo-gyermek ugyanolyan feltételekkel ad fel hirdetést, mint a többi felhasználó. Amikor egy másik gyerek azért, amit kapott tőle, POEN-t ír át neki, az átírás: a meglévő POEN egyik bejegyzésről a másikra kerül.

Átírás a szülőtől. Te és a Kolo-gyermek mindkét irányban írhattok át egymásnak POEN-t; a gyermek bejegyzéséről induló nagyobb átírás a jóváhagyásodra vár. Amíg a fiók szülős gyermek, egyik irányban sincs átírás. Az átírás nem teremt új POEN-t, csak a meglévőt viszi át.

A POEN nem pénz, és a rendszeren kívül nincs értéke.`,
      },
      {
        id: 99,
        pitanje: `Mi az iskolaválasztás, és mit hoz a rangsor?`,
        odgovor: `A gyerek a profiljában kiválasztja az iskolát, amelybe jár, a szerbiai iskolák listájáról, amikor a szülő átvette; a várakozó gyermek nem választ iskolát. A választás nem feltétele a fiók használatának, a fiók nélküle is működik.

A választásból három lista keletkezik: két országos, a bevont gyerekek száma és a beíratott tanulók számához viszonyított arány szerint, külön az általános és a középiskolák számára, valamint egy az iskolán belül, a POEN aktuális egyenlege szerint. A számításba csak a Kolo-gyermek kerül be, az iskolán belüli listát pedig csak ugyanabból az iskolából való Kolo-gyermek látja.

A listán elfoglalt hely nem hoz POEN-t. Sem az iskola kiválasztása, sem az első hely, sem bármi más a listán. A lista azt mutatja, ki hol áll, és semmi többet.

Az iskola legfeljebb harminc naponként egyszer változtatható. Az első beállítás nem változtatás, és nem indítja el ezt a határidőt. A korábbi választások előzményei nem maradnak meg, az iskola pedig a nagykorúvá váláskor és a fiók megszüntetésekor törlődik.`,
      },
      {
        id: 93,
        pitanje: `Mi történik, ha egy barátság megszűnik?`,
        odgovor: `A barátságot csak gyerek bontja fel, a kettő közül bármelyik. Neked mint szülőnek ez a művelet nincs meg; marad a hirdetés eltávolítása, a felnőttekkel folytatott beszélgetés kapcsolója és a fiók törlése.

Felbontáskor 500-500 POEN íródik le mindkét oldalról — attól is, aki felbontja, és attól is, aki nem. A megerősítés előtt figyelmeztetés áll erről, így a felbontás nem történik véletlenül.

Ha ezt a POEN-t időközben elköltötték, a nyilvántartás mínuszba megy. Ez nem tartozás: semmit nem hajtanak be és nem követelnek vissza, az első beérkező POEN pedig feltölti.

Ha a gyerekek később újra barátságot kötnek, a POEN újra rögzül.`,
      },
      {
        id: 94,
        pitanje: `Mi történik a tizennyolcadik születésnapon?`,
        odgovor: `Az átmenetről szóló értesítés egy hónappal korábban érkezik, a gyereknek és az összes barátjának is. Magán a napon a következő történik.

A barátságokkal szerzett POEN megsemmisül, 500 minden olyan barátságért, amelyért a bejegyzés megtörtént. Az a gyerek, akinek harminc ilyen barátsága van, 15.000 POEN-t veszít. A leírás a másik felet is érinti: mindegyik barátjától 500-at írnak le az adott barátságért, ezért az értesítés nekik is megy. Ahogy a felbontásnál, a nyilvántartás mínuszba kerülhet, és ez nem tartozás.

A barátságok törlődnek. Helyüket a megerősítési lánc veszi át.

A fiók automatikusan bekerül a megerősítési láncba, a kapcsolódás sorrendjében első olyan szülőn keresztül, aki Kolo-tag: ez megerősítés, és a fiatal Kolo-taggá válik. Ha ilyen szülő nincs, de valamelyik szülő megerősítés nélküli tag, az első ilyen bevezeti a Kolóba, és a fiatal megerősítés nélküli taggá válik. Ha egyik szülő sincs a Kolóban, felhasználóvá válik. A másik szülőnek semmit sem kell tennie. Amikor a szülő megerősíti vagy bevezeti a Kolóba, 1.000-1.000 POEN azonnal rögzül neki is és ennek a szülőnek is, az első hozzájárulásra való várakozás nélkül.

A többihez nem nyúlnak: a gyereknek átírt POEN, a Piacon lebonyolított cseréből származó POEN, a hirdetések és az előzmények megmaradnak.`,
      },
      {
        id: 95,
        pitanje: `Hogyan törlöm a gyerekem fiókját?`,
        odgovor: `A gyerek fiókját bármikor törölheted a saját fiókodból.

A törléssel a gyerek nyilvántartásában lévő összes POEN megsemmisül, és a hirdetései eltávolításra kerülnek. A barátságok megszűnnek, de a barátoktól semmit sem írnak le: mindenki megtartja a maga 500-át.

Ha olyan fiókról kaptál üzenetet, amelyet nem te nyitottál, és a gyerek nem a tiéd, ebben az üzenetben két olyan lépésed van, amelyhez nem kell bejelentkezni a platformra: jelezheted, hogy ez nem a te gyereked, és törölheted a fiókot. A jelzés törlés nélkül a határidő lejártáig meghagyja a fiókot, hogy továbbra is a címedet használja, ezért a törlés biztonságosabb.

Az a fiók, amelyet senki sem vesz át, tizennégy nap után magától törlődik.

Mindezekről részletesebben a Gyermekek részvételéről szóló szabályzat ír, a Szabályzat oldalon.`,
      },
    ],
  },
  {
    id: "porezi-legalnost",
    naslov: "Adók és jogszerűség",
    pitanja: [
      {
        id: 47,
        pitanje: `Megerősítette-e bármelyik szabályozó (a Nemzeti Bank, az Adóhivatal, a Biztos), hogy ez jogszerű, vagy csak az Alapítvány állítja?`,
        odgovor: `Nem. Jelenleg nincs olyan írásos szabályozói állásfoglalás, amely a jogszerűséget megerősítené — sem a Nemzeti Bank, sem az Adóhivatal, sem a Biztos nem adott ki ilyen igazolást.

Amin a rendszer nyugszik, az nem valakinek az engedélye, hanem a saját jogi felépítése. A szabályok szerint a POEN nem pénz, nem valuta, nem elektronikus pénz, nem fizetőeszköz, nem pénzügyi eszköz és nem digitális vagyon, és nem alakítható át olyasmivé, aminek a rendszeren kívül értéke van. A POEN-nyilvántartás frissítése a felhasználók között nem pénzforgalmi művelet a pénzforgalmi szolgáltatásokra vonatkozó szabályok értelmében. Magára a javak és szolgáltatások cseréjére a kötelmi jog általános szabályai vonatkoznak, a jogvitákat pedig az illetékes bíróság tárgyalja. A rendszer jogi helyzete tehát abból következik, ahogyan a rendszer fel van építve, nem pedig külső jóváhagyásból.

Ami az adókat illeti, e cserék adó- és számlaadási megítélése nem szünteti meg a meglévő kötelezettségeidet, ha tevékenységet folytatsz. Az Alapítvány nem ad adótanácsot — az adókötelezettségeidet te viseled.

A személyes adatok védelme ügyében mindig jogod van a közérdekű információkért és a személyes adatok védelméért felelős Biztoshoz fordulni.

A jogszabályok változása vagy a szabályozó új értelmezése olyan kockázat, amelyet érdemes szem előtt tartani, mielőtt csatlakozol.`,
      },
      {
        id: 50,
        pitanje: `Miben különbözik a POEN az elektronikus pénztől, és nem rejtett POEN-vásárlás-e valójában az adomány?`,
        odgovor: `Az elektronikus pénznek három ismérve van: akkor kapod, ha pénzt fizetsz be, a kibocsátóval szembeni követelésedet testesíti meg, és bármikor visszaadhatod, hogy visszakapd a pénzed. A POEN egyiknek sem felel meg.

A POEN nem pénz befizetésére rögzül, hanem a közösséghez való hozzájárulásra vagy valamelyik program megerősített jogállására. Az Alapítvány a POEN alapján semmivel nem tartozik neked, és nem is vásárolja vissza. A POEN-t nem alakíthatod dinárrá, sem a rendszeren kívüli bármely fizetőeszközzé.

Az adomány azért nem rejtett POEN-vásárlás, mert ez két jogilag független aktus. Az első a te visszavonhatatlan adományod az Alapítványnak. A második a POEN automatikus rögzítése, amelyet a Protokoll előre közzétett szabályok szerint végez.

Az adományból nem keletkezik követelésed — sem az a jog, hogy az Alapítványtól POEN rögzítését követeld, sem az, hogy visszakérd a pénzt. A POEN rögzítése nem ellenszolgáltatás az adományért: a két aktus között nincs szerződés, sem olyan megállapodás, amely szerint egy elvégzett dologért meghatározott mennyiségű POEN-t kapnál.

Az Alapítvány nem tesz közzé POEN–dinár arányt; a hirdetésben az összeget az határozza meg, aki a hirdetést feladja. Az Alapítvány a POEN semmilyen értékét nem szavatolja, és a POEN-t nem váltja pénzre.`,
      },
      {
        id: 98,
        pitanje: `Digitális vagyon-e a POEN — virtuális valuta vagy digitális token — a digitális vagyonról szóló törvény szerint?`,
        odgovor: `Nem az. A digitális vagyonról szóló törvény a digitális vagyon két fajtáját ismeri — a virtuális valutát és a digitális tokent —, és a POEN egyiknek az ismérveit sem teljesíti.

A virtuális valuta olyan digitális értékfeljegyzés, amelyet adnak-vesznek és átruháznak, és amellyel fizetnek vagy befektetnek. A POEN sem meg nem vásárolható, sem el nem adható: nem pénzért szerezhető meg, hanem előre közzétett szabályok szerinti bejegyzéssel keletkezik, a hozzájárulás feljegyzéseként. A rendszeren kívül nincs értéke, nincs piaca és ára, nem vihető ki a Protokollból, és az Alapítvány nem vásárolja vissza. Az adomány nem POEN-vásárlás — ez két jogilag független aktus, külön kérdésben kifejtve.

A digitális token olyan feljegyzés, amely valamilyen vagyoni jogot hordoz: részesedést, követelést, hozamhoz vagy szolgáltatáshoz való jogot. A POEN egyiket sem hordozza: sem az Alapítvánnyal, sem bárki mással szemben nem keletkezik belőle követelés, nem ad részesedést, kamatot és hozamot, és senkit — sem az Alapítványt, sem más felhasználókat — nem kötelez arra, hogy érte bármit nyújtson neked. A hozzájárulás tényét rögzíti, mint egy anyakönyvi bejegyzés — a könyvbe tett bejegyzés pedig nem vagyon.

Ugyanezen okokból a POEN pénzügyi eszköznek sem minősül. Ugyanez áll a ZRNO-ra: nem írható át másik felhasználónak, nincs piaca és nem hordoz vagyoni jogot — erről bővebben a „POEN és ZRNO” szakaszban.

Mint minden itt, ez is a rendszer jogi felépítése, nem szabályozói megerősítés — a jogszabályok vagy értelmezésük változásának kockázatát e szakasz első kérdése írja le.`,
      },
      {
        id: 48,
        pitanje: `Rendszeresen eladom a feleslegemet (méz, pálinka, befőttek), vagy kézműves szolgáltatást nyújtok — kell-e számla, áfa vagy bejegyzett tevékenység? Ki viseli az adót?`,
        odgovor: `A KOLO nem számol el helyetted adót, és nem állít ki a nevedben adóügyi nyugtát, de nem is szünteti meg azokat a kötelezettségeidet, amelyek az általános szabályok szerint már fennállnak.

A javak és szolgáltatások felhasználók közötti cseréje nem klasszikus adásvételként épül fel, a POEN átírása pedig nem pénzbeli fizetés a pénzforgalmi szolgáltatásokra vonatkozó szabályok értelmében — a POEN a hozzájárulás nyilvántartása, nem pénz. Ezért a Protokoll frissíti a POEN-nyilvántartást, de nem vezeti az adókönyveidet és nem állít ki számlát.

Ez azonban nem jelenti azt, hogy mentesülnél a szabályok alól. Ha az árut vagy a szolgáltatást rendszeresen és tevékenységre emlékeztető mértékben nyújtod, ugyanúgy vonatkoznak rád az általános szabályok, mint a platformon kívül. Egyes javakra — például az alkoholtartalmú italokra vagy az élelmiszerre — külön előállítási és forgalmazási szabályok is vonatkoznak, és azok itt is érvényesek.

Az Alapítvány nem ad adótanácsot, és nem részese a cserédnek: a teljesítésért, a minőségért és a kockázatért te és a másik fél feleltek a kötelmi jog általános szabályai szerint, az adókötelezettségeidet pedig te viseled.`,
      },
      {
        id: 49,
        pitanje: `Hat-e a KOLO rendszerben való részvétel és a POEN a nyugdíjamra vagy a szociális juttatásaimra?`,
        odgovor: `A rendszer felől nézve — nem. A POEN nem pénz, nem kereset és nem jövedelem: belső nyilvántartási bejegyzés arról, mit adtál a közösségnek, és nem alakítható át a rendszeren kívül értékkel bíró eszközzé. Az Alapítvány semmilyen jogcímen nem fizet neked pénzt: a bejegyzéssel sem pénzt, sem dolgot nem kapsz, semmi nem kerül át a vagyonából a tiédbe, a bejegyzés pedig nem tehető pénzzé, nem engedményezhető és nem érvényesíthető. Ezen a jogcímen ezért pénzben kifejezett összeg sincs.

Ha a POEN valamelyik szociális programon keresztül rögzül neked (például elsődleges gondviselőként, idősebb személyként vagy a Tanulás révén), az sem térítés — nem fizet meg semmilyen munkát vagy szolgáltatást, és cserébe semmit nem kérnek tőled. Ez a nyilvántartás automatikus frissítése, amely az ilyen részvételnek egyenrangú helyet ad a rendszerben, a programot pedig az Alapítvány alapszabály szerinti céljainak megvalósítása érdekében hajtják végre.

Meg kell azonban különböztetni a POEN-t attól, amit a rendszeren kívül csinálsz. Mindaz, amiért pénzt kérsz, a te tevékenységed, amelyre az általános szabályok vonatkoznak — és ennek következményei lehetnek a jogállásodra nézve, attól függően, mit és milyen mértékben csinálsz.

Az Alapítvány sem adó-, sem jogi tanácsot nem ad. Ha nyugdíjat vagy valamilyen szociális juttatást kapsz, és nem vagy biztos benne, hogyan fér össze azzal, amit csinálsz, a legbiztosabb, ha az illetékes hivatalnál (a nyugdíjpénztárnál) vagy könyvelőnél ellenőrzöd.`,
      },
      {
        id: 77,
        pitanje: `Az Alapítvány a pénzmosás megelőzéséről szóló szabályok (AML/KYC) kötelezettje-e, és azonosítja-e az adományozókat?`,
        odgovor: `Az Alapítvány nem pénzügyi intézmény, és nem kezeli a felhasználók pénzét — a POEN nem pénz, a felhasználók közötti csere pedig nem pénzforgalmi művelet. Tevékenysége szerint az Alapítvány nincs azon kötelezettek között, amelyeket a pénzmosás és a terrorizmus finanszírozása megelőzéséről szóló szabályok felsorolnak.

Az adományokat ettől függetlenül nem fogadjuk névtelenül. A banki rendszeren keresztül érkeznek — az Alapítvány számlájára történő befizetéssel vagy bankkártyával —, olyan számláról, amelynek tulajdonosa azonosított, így a befizető azonosítását és a pénzeszközök eredetének ellenőrzését a bank végzi a saját szabályai szerint. A patrónusok jogi személyek és egyéni vállalkozók, akiket szerződés azonosít.

Az adományok adatait az Alapítvány a pénzügyi beszámolásra vonatkozó szabályokkal összhangban őrzi, és hozzáférhetővé teszi az illetékes hatóságok — köztük az Adóhivatal és a pénzmosás megelőzéséért felelős hivatal — számára, ha a törvény ezt előírja.`,
      },
    ],
  },
  {
    id: "zastite",
    naslov: "Védelmek és irányítás",
    pitanja: [
      {
        id: 26,
        pitanje: `Ki irányítja a KOLO-t?`,
        odgovor: `Jelenleg (1. fázis) minden döntést a KOLO Alapítvány hoz meg az Igazgatóságon keresztül.

Amint a bejegyzett POEN összmennyisége eléri az 1.000.000-t, aktiválódik a Felső Kolo — az a testület, amelyet a ZRNO-t aktiváló Kolo-őrzők alkotnak, és amely a kulcsfontosságú rendszerkérdésekről négyzetes szavazással dönt.

Ettől a pillanattól az Alapítvány szolgáltató szerepet tölt be: a Protokoll szabályairól nem saját belátása szerint dönt, hanem az Igazgatóság végrehajtja a Felső Kolo döntéseit, és közben nem mérlegeli azok célszerűségét. Döntést csak a Szabályzatban kifejezetten megjelölt okokból utasíthat el (törvénybe vagy az Alapszabályba ütközés, a Felső Kolo hatáskörén kívül eső kérdés, védelmi vétó annak tartama alatt), nyilvánosan közzétett indoklással. A dináreszközökről a Felső Kolo ajánlásokat tesz, amelyekre az Igazgatóság indokoltan válaszol.`,
      },
      {
        id: 27,
        pitanje: `Mi akadályozza meg az adminisztrátor vagy az alapítók visszaélését?`,
        odgovor: `Több szerkezeti védelem működik párhuzamosan.

Zéró összegű elv: minden POEN-bejegyzés növeli a Protokoll mínuszát, így senki sem teremthet POEN-t a semmiből.

A programok napi kerete: a szociális programok és az működési hozzájárulás együtt naponta nem jegyezhet be többet, mint a rendszerben lévő POEN teljes mennyiségének 10%-a.

Determinisztikus bejegyzések. A Protokollnak nincsenek mérlegelésen alapuló döntései: minden a kódban van, előre közzétett szabályok szerint, a kód pedig nyilvános, és bárki ellenőrizheti.

Átláthatóság: a hozzájárulások nyilvántartása álneves, a bejegyzések előzményei nem írhatók át (minden javítás új bejegyzéssel történik), a résztvevők számára látható, a nem regisztráltak pedig csak összesített számokat látnak.

Végül a Felső Kolo aktiválása: ettől kezdve a Protokoll szabályait a Kolo-őrzők fogadják el a Felső Kolón keresztül, az Alapítvány Igazgatósága pedig végrehajtja őket.`,
      },
      {
        id: 28,
        pitanje: `Mi a Felső Kolo, és mikor aktiválódik?`,
        odgovor: `A Felső Kolo az a testület, amelyet a ZRNO-t aktiváló Kolo-őrzők alkotnak — a rendszer szabályairól döntő legfelső testület. Nem választott közgyűlés: a Kolo-őrző a ZRNO aktiválásával lép be, és akkor lép ki, amikor már egyetlen ZRNO-ja sem aktív, vagy amikor megszűnik a megerősítése. Az a megerősítés nélküli tag, akinek ZRNO-t jegyeztek be, nincs a Felső Koloban, amíg egy Kolo-tag meg nem erősíti.

Mivel az aktív ZRNO-k száma folyamatosan változik, a Felső Kolo összetételét és minden Kolo-őrző szavazóerejét minden napra külön állapítják meg, és csak aznap érvényesek. A szavazat annak a napnak az erejét hordozza, amelyen leadták; aki a szavazás tartama alatt módosítja a szavazatát, a módosított szavazat a módosítás napjának erejét hordozza. A Kolo-őrző a szavazatát csak egy másik Kolo-őrzőre ruházhatja át. Az a felhasználó, akinek a ZRNO-ja befagyott, nincs a Felső Koloban, nem szavaz és nem ruház át.

Automatikusan aktiválódik, amikor a bejegyzett POEN összmennyisége eléri az 1.000.000-t (a Protokoll nyilvántartásában ez −1.000.000-es egyenleg), ami azt jelzi, hogy a rendszer kellően aktív, és a résztvevők jelentős közös felelősséget viselnek.

Addig minden döntést az Alapítvány hoz; ezt követően a kulcsfontosságú rendszerdöntéseket (a Szabályzat módosításai, új programok, programok felfüggesztése) a Felső Kolo hozza négyzetes szavazással. A Felső Kolo nem az Alapítvány szerve: döntését az Igazgatóságnak továbbítja, amely végrehajtja.`,
      },
      {
        id: 29,
        pitanje: `Mi az a négyzetes szavazás?`,
        odgovor: `Olyan szavazási mód, amelyben a szavazóerő a ZRNO-k számának négyzetgyökeként nő: 1 ZRNO — 1 szavazat, 100 ZRNO — 10 szavazat, 10.000 ZRNO — 100 szavazat.

A cél, hogy senki ne dönthesse el a kérdést pusztán a ZRNO mennyiségével: a befolyás sokkal lassabban nő, mint a ZRNO száma, így a döntést inkább a részvétel szélessége viszi el, mint a hatalom koncentrációja.`,
      },
      {
        id: 30,
        pitanje: `Mi az Alapítvány védelmi vétója?`,
        odgovor: `Amíg az Alapítvány nem pénzügyileg önálló, megtagadhatja a Felső Kolo olyan döntésének végrehajtását, amely veszélyeztetné a működési és pénzügyi fenntarthatóságát — mindenekelőtt a források elköltéséről szóló döntésekét (a közösségi beszerzéseket is beleértve), amelyek aláásnák az Alapítvány képességét az alapköltségek fedezésére és a rendszer fenntartására.

A vétó nem mérlegelési jogkör: konkrét fenntarthatósági fenyegetésre hivatkozva meg kell indokolni, az indokolás nélküli vétó pedig önmagában visszaélés. Ez nem politikai ellenőrzés, hanem a rendszer folytonosságának védelme.

A vétó véglegesen és egy irányban szűnik meg, amint az Alapítvány forrásai elérik a pénzügyi önállóság küszöbét — az előző havi működési költség háromszorosát, amelyet a Felső Koloról szóló szabályzat állapít meg.`,
      },
      {
        id: 120,
        pitanje: `Mi a megerősítések felügyelete?`,
        odgovor: `A felügyelet a megerősítések és bevezetések utólagos átvizsgálása. Minden Kolo-őrző végzi, soha nem olyan ügyben, amelyben maga is részt vett. Átvizsgálja a megerősítés nélküli tagok és a nem őrző Kolo-tagok által adott megerősítéseket és bevezetéseket, minden telefonos beszélgetés utáni megerősítést, valamint annak megerősítését, aki a megerősítőt bevezette. A hívási listáról történő bevezetés mindig felügyeletre kerül, kivéve, ha alapító adja. Felügyelet nélküliek az alapítók megerősítései és bevezetései, az őrzők egyéb megerősítései és bevezetései, valamint az a megerősítés, amelyet az Alapítvány saját döntésével ad. A felügyelet nem változtat a megerősítés hatályán, és nem jár érte díjazás.`,
      },
      {
        id: 72,
        pitanje: `Mit változtatnak pontosan a Kolo-őrzők a „teljes önigazgatásban”, és mikor kezdődik ez?`,
        odgovor: `Két külön küszöb van, és könnyű összekeverni őket.

Az első küszöb: a Felső Kolo aktiválása. Amikor a rendszerben bejegyzett POEN összmennyisége eléri az 1.000.000-t (ami a Protokoll nyilvántartásában −1.000.000-es egyenlegnek felel meg), automatikusan megnyílik a ZRNO jegyzése, és létrejön a Felső Kolo, az a testület, amelyet a ZRNO-t aktiváló Kolo-őrzők alkotnak. Ettől a pillanattól a Kolo-őrzők négyzetes szavazással döntenek a rendszer szabályairól: a Szabályzat módosításairól, a programokról és más, a közös jót érintő kérdésekről. Az Alapítvány szuverén szervből végrehajtó és szolgáltató szervvé válik, a döntéseket végrehajtja, nem maga hozza.

A második küszöb: a védelmi vétó megszűnése. Amíg az Alapítvány pénzügyileg nem önálló, védelmi vétóval rendelkezik: megtagadhatja a Felső Kolo olyan döntésének végrehajtását, amely veszélyeztetné működési fenntarthatóságát, mindenekelőtt az eszközök elköltéséről szóló döntésekét, például a közös beszerzésekét, mielőtt a fenntarthatóság biztosított. A vétót indokolni kell, nem önkényes. Véglegesen és egyirányúan csak akkor szűnik meg, amikor az Alapítvány eszközei elérik a pénzügyi önállóság küszöbét, az előző havi működési költség háromszorosát, amelyet a Felső Koloról szóló szabályzat határoz meg.

A Felső Kolo aktiválásáig (1. fázis) minden döntést az Alapítvány hoz az Igazgatóságon keresztül.`,
      },
    ],
  },
  {
    id: "sporovi",
    naslov: "Jogviták és a szabályok megsértése",
    pitanja: [
      {
        id: 31,
        pitanje: `Hogyan rendezik a felhasználók közötti jogvitákat?`,
        odgovor: `A felhasználók közötti, cserével kapcsolatos jogvitát a kötelmi jog általános szabályai szerint, az illetékes bíróság rendezi — az Alapítvány nem részese ennek a viszonynak.

A kezdeti szakaszban kérheted az Alapítvány önkéntes, nem kötelező erejű közvetítését. Ha a jogvita közted és maga az Alapítvány között áll fenn, először egyezséget keresünk; ennek hiányában a zombori bíróság illetékes.

A személyes adatok védelme ügyében jogod van panaszt tenni a közérdekű információkért és a személyes adatok védelméért felelős Biztosnál.

Külön belső vitarendezési mechanizmusok később hozhatók létre, külön szabályzattal vagy a Felső Kolo döntésével; egyelőre nincsenek.`,
      },
      {
        id: 32,
        pitanje: `Mi történik, ha valaki nem tartja be a szabályokat?`,
        odgovor: `A rendszer tartósan emlékszik: a nyilvántartás minden frissítése álnév alatt tartósan rögzítve van, és látható a résztvevők számára, így a rossz viselkedés látható marad azok előtt, akik részt vesznek a rendszerben.

Az Alapítvány ideiglenesen felfüggesztheti a fiókot (legfeljebb 30 napra, a felhasználó azon jogával, hogy tájékoztassák az okokról, és nyilatkozhasson), vagy a szabályok súlyosabb megsértése esetén kizárhatja a felhasználót.

A kizárt felhasználó elveszíti a hozzáférését, a POEN-t és a ZRNO-t a Protokoll javára leírják, a személyes adatokat törlik, az álnevet pedig semleges jelölés váltja fel.`,
      },
      {
        id: 33,
        pitanje: `Élhetek kifogással az Alapítvány döntése ellen?`,
        odgovor: `Igen. A profiljáról minden felhasználó benyújthat kifogást, a Kolóba való belépés előtt is: cseréhez kapcsolódó átírásra, közös beszerzésből származó részre, utalványra, a valóság megerősítéséről hozott döntésre, felfüggesztésre és kizárásra, programról hozott döntésre, a gazdaságról, annak megszűnéséről és a leírásról hozott döntésre, arra a döntésre, amely annak a bejelentésnek az alapján született, hogy valaki nem szülője a gyereknek, eltávolított hirdetésre, önmagáról szóló pontatlan adatra, és az Alapítvány minden más, rá vonatkozó döntésére.

Az Alapítványnak 30 napon belül, indokolással kell döntenie a kifogásról.

Egyszerre legfeljebb három azonos fajtájú nyitott kifogásod lehet.`,
      },
    ],
  },
  {
    id: "privatnost-izlazak",
    naslov: "Magánélet és kilépés",
    pitanja: [
      {
        id: 34,
        pitanje: `Ki látja az álnevemet és a tranzakcióimat?`,
        odgovor: `Attól függ, ki nézi.

A fiók nélküli látogató a rendszer összesített számait és a Piac hirdetéseit látja, egyedi tranzakciók nélkül.

A Kolón kívüli felhasználó a nyilvántartás frissítéseinek összegét és idejét látja, a felek álneve és az egyenlegek nélkül. Mások profilját szűkítve látja: álnév, kép, település, ha meg van jelenítve, státusz, hirdetések és az ajánlások száma.

A résztvevő látja az álneveket, az összes tranzakciót a felek álnevével, az egyenlegeket és a profilokat. Azokat a tranzakciókat, amelyekben gyermek vesz részt, senki sem látja a gyermektéren kívül.

Az adományok listáját a Kolón kívüli felhasználók és a résztvevők egyformán látják: a nyilvános adományozó nevét, az összeget és a dátumot, álnév nélkül.

A Piacon lévő hirdetést (leírás, POEN-mennyiség, település, álnév) bárki látja. Az elérhetőséget és az előzményekkel való kapcsolatot csak a résztvevők látják.`,
      },
      {
        id: 121,
        pitanje: `Ki látja a számomat, amikor azt kérem, hogy valaki hívjon fel?`,
        odgovor: `A listát csak a Kolo-tagok látják. A nevet és a számot egy Kolo-tag nyitja meg egy kattintással, legfeljebb tíz percre, és amíg nála nyitva van, más nem látja. Az Alapítvány rögzíti, ki nyitotta meg az adataidat. Ezt a bejegyzést csak az Alapítvány látja, a platformon keresztül nem exportálható, te pedig kérésre megkapod a privatnost@ekolo.rs címen. A kérés, a név és a szám törlődik a listáról, amikor belépsz a Kolóba, amikor visszavonod a hozzájárulásodat, vagy amikor megszünteted a fiókodat.`,
      },
      {
        id: 55,
        pitanje: `Használhatom a rendszert név és telefonszám nélkül? Mit veszítek?`,
        odgovor: `Igen, használhatod. Regisztrációkor csak az álnév (az általad választott név), az e-mail-cím és a jelszó kötelező, semmi más.

A valódi név és a telefonszám nem feltétele sem a Kolóba való belépésnek, sem a rendszer funkcióihoz való hozzáférésnek. Ha kéred, hogy valaki felhívjon, a telefonszámot magad adod meg, és csak az a Kolo-tag látja, aki megnyitja az adataidat, a vezeték- és utónévvel együtt, ha be van jegyezve. Vezeték- és utónevet csak négy dologhoz kérnek: gazdasághoz, nyilvános adományhoz, szövetkezeti tagsághoz és pártfogási bejelentéshez. Ekkor a személyazonossági nyilvántartásba kerül, az álneved mellé, és a többi felhasználónak nem jelenik meg.

Mit veszítesz, ha nem adod meg őket? Gyakorlatilag csak a könnyebb kapcsolattartást: a Piacon ezek nélkül az adatok nélkül nehezebben érnek el, és nehezebben egyeztetitek a személyes cserét.

Ha mégis úgy döntesz, hogy megadod őket, magad választod meg, hogy láthatók legyenek-e a résztvevők számára, és ezt a felfedést bármikor visszavonhatod, ezt követően az adatok már nem jelennek meg.

Az e-mail-címed soha nem látható nyilvánosan.`,
      },
      {
        id: 56,
        pitanje: `Beazonosíthat-e valaki az összegek, az időpontok és a tranzakciók gyakorisága alapján?`,
        odgovor: `Igen. Az álnevesség nem ugyanaz, mint az anonimitás.

A tranzakcióidat álnév alatt vezetik, nem a neveden. Az összegek, az időpontok és a nyilvántartás frissítéseinek gyakorisága azonban bizonyos esetekben közvetve utalhat arra, ki vagy, különösen kis közösségben, ahol az emberek ismerik egymást. A regisztrációval elfogadod, hogy az álneves nyilvántartás nyilvánossága a rendszerbe van építve, és nem kapcsolható ki.

Mégis több dolog véd.

A neved egyetlen POEN-bejegyzésben sem szerepel. A vezeték- és utónevet az Alapítvány csak egy külön személyazonossági nyilvántartásban vezeti, és csak akkor, ha gazdaságot jelentesz be vagy csatlakozol hozzá, ha nyilvánosan adományozol, ha szövetkezeti taggá válsz, vagy ha az Alapítvány megerősíti a pártfogást, amelyet cég képviselőjeként vagy egyéni vállalkozóként jelentettél be. Ezt a nyilvántartást az adminisztrációs csapat látja, a többi felhasználó nem; az egyetlen kivétel az a Kolo-tag, aki megnyitja az adataidat, ha kérted, hogy valaki felhívjon, és ő is csak addig, amíg a hívás nyitva van. A fiókod megszüntetésekor törlődik. Személyi számot (JMBG) és a személyi igazolvány adatait sehol sem jegyzik be. Hogy a nevedet és a telefonszámodat megmutatod-e másoknak (csak a résztvevőknek), magad döntöd el, és a felfedést bármikor visszavonhatod.

A láthatóság fokozatos: a nem regisztráltak csak összesített számokat látnak, az egyes tranzakciókat álnevekkel pedig csak a résztvevők látják. Az e-mail-cím, a technikai naplók és a megerősítések hálózata soha nem nyilvános.

Rajtad is múlik, hogy az álneved ne tartalmazzon olyan személyes adatot, amely elárulna.`,
      },
      {
        id: 35,
        pitanje: `Hogyan védik a magánéletemet?`,
        odgovor: `Az adattakarékosság a rendszer négy megváltoztathatatlan alapelvének egyike — a platform csak azt gyűjti, ami a működéshez elengedhetetlen.

A Kolóba a megerősítési láncon keresztül lehet belépni: egy Kolo-tag személyes ismeretség alapján megerősíti a valódiságodat, vagy beszélgetés után bevezet a Kolóba, személyes dokumentumok gyűjtése vagy átadása nélkül. A platform ennek során csak technikailag rögzíti, hogy a megerősítést, illetve a bevezetést megadták, a Kolóba belépő személyes adatait nem gyűjti.

Az adminisztrátori műveleteket egy át nem írható ellenőrzési naplóban rögzítik. Az Alapítvány nem adja el az adatokat, és nem osztja meg harmadik felekkel azok saját céljaira: csak az infrastruktúra-szolgáltatók kezelik őket az Alapítvány nevében (az Adatvédelmi szabályzatban ismertetve), az illetékes hatóságoknak pedig csak akkor adják ki, ha a törvény előírja.

Bármikor kérheted az összes adatod exportját JSON formátumban, vagy a fiók törlésével elindíthatod a törlésüket: a személyes adatok törlődnek, a numerikus előzmények pedig semleges jelölés alatt megmaradnak.`,
      },
      {
        id: 78,
        pitanje: `Hol vannak a szerverek, és átlépik-e az adataim Szerbia határát?`,
        odgovor: `Igen, de többnyire nem jutnak tovább az Európai Uniónál. Az alkalmazás az Európai Unióban fut, és az adatbázis is ott található, a frankfurti régióban, az Európai Unió pedig azon országok listáján szerepel, amelyek megfelelő szintű adatvédelmet biztosítanak.

Az alkalmazás és az adatbázis szolgáltatóinak székhelye az Amerikai Egyesült Államokban van, így adminisztratív és technikai célokra (támogatás, karbantartás, rendszernaplók) lehetséges a hozzáférés abból az országból. Az Amerikai Egyesült Államokban dolgozzák fel az általad feltöltött képeket, a platform által küldött e-maileket, és csak a hozzájárulásoddal a látogatottsági adatokat. Az adatokat csak olyan adatfeldolgozónak továbbítják, amellyel általános szerződési feltételeket vagy más megfelelő védelmi intézkedéseket tartalmazó adatfeldolgozási szerződést kötöttek; ilyen szerződés nélküli adatfeldolgozónak nem továbbítják. Az adatfeldolgozók listája az Adatvédelmi szabályzatban található.

Függetlenül attól, hol vannak fizikailag a szerverek, ugyanazok a technikai intézkedések érvényesek: az adatok titkosítása továbbítás közben és tároláskor, az azonosító adatok elkülönítése az elszámolási adatoktól, és a hozzáférés a minimális szükségesség elve szerint.

A jogaid (betekintés, helyesbítés, törlés, hordozhatóság és panasz a Biztosnál) a szerverek helyétől függetlenül ugyanazok maradnak.`,
      },
      {
        id: 36,
        pitanje: `Hogyan lépek ki a rendszerből?`,
        odgovor: `A fiók törlése bármikor elérhető a profil beállításaiból.

Törlés előtt kezdeményezheted a POEN-nyilvántartás frissítését egy másik felhasználó javára. A státusz megszűnésekor minden ZRNO-t a Protokoll javára leírnak (ez a leírás nem indít POEN-bejegyzést), a megmaradt POEN-t pedig megsemmisítik, és visszakerül a Protokollhoz.

A személyes adataidat törlik (e-mail-cím, önkéntesen megadott adatok, a személyazonossági nyilvántartásban szereplő vezeték- és utónév, hirdetések), az álnevet pedig semleges jelölés váltja fel; a tranzakciók numerikus előzményei a rendszer matematikai helyessége érdekében megmaradnak. Ez álnevesítés, nem anonimizálás: az Alapítvány megőrzi a fiók belső azonosítóját, így a megőrzött bejegyzések továbbra is személyes adatnak minősülnek.

A nyílt licencek alatt közzétett hozzájárulások (kód, tartalom) tartós attribúciót őriznek meg.`,
      },
      {
        id: 37,
        pitanje: `Mi lesz a POEN-nel halál esetén — örökölhető?`,
        odgovor: `Nem. A POEN és a ZRNO nem örökölhető vagyon, és nem is követelés az Alapítvánnyal szemben.

A felhasználó halálakor a fiók deaktiválódik, a POEN és a ZRNO pedig a Protokollnak íródik le. Az örökösöknek, a családnak és harmadik személyeknek nincs rájuk vagyoni joguk.

Ez a lényegi különbség a POEN és a pénzügyi vagyon között — és egyik oka annak, hogy a POEN jogi értelemben nem pénz.`,
      },
    ],
  },
  {
    id: "tehnika",
    naslov: "Technika és nyílt forráskód",
    pitanja: [
      {
        id: 71,
        pitanje: `Milyen a biztonsági modell? Blokklánc ez? Mi akadályozza meg, hogy valaki POEN-t „verjen” vagy átírja az előzményeket?`,
        odgovor: `Nem blokklánc. A KOLO központosított nyilvántartást használ, amelyet a Protokoll vezet az Alapítvány kezében lévő infrastruktúrán. A decentralizáció itt nem technikai, hanem irányítási: a döntéshozatal idővel az alapítóktól a közösséghez kerül át.

A POEN „verése” elleni védelem a nulla összegű szabályon nyugszik: minden létező POEN ugyanakkora mínuszként van bejegyezve a Protokoll nyilvántartásában. Senki nem rögzíthet POEN-t a semmiből, mert az azonnal megbontaná azt az egyensúlyt, amelyet a rendszer folyamatosan ellenőriz. Ráadásul a Protokoll minden művelete determinisztikus, mérlegelés nélküli — még az adminisztrátor sem adhat valakinek „kézzel” POEN-t a meghatározott csatornákon kívül.

Ami az előzményeket illeti, minden bejegyzés időbélyeget kap, és az előzményeket nem írjuk át: a helyesbítések új, ellentétes irányú bejegyzésként kerülnek be, sosem a régi törlésével vagy módosításával. Az adminisztrátori műveleteket ellenőrzési napló rögzíti, a rendszeres automatikus ellenőrzések pedig igazolják, hogy az összes bejegyzés összege minden pillanatban nulla — bármilyen eltérés azonnal látszik.

A korlátokról: ez a megváltoztathatatlanság tervezési szabály, amelyet a szoftverarchitektúra biztosít, nem pedig olyan kriptográfiai „trustless” garancia, amilyet a nyilvános blokklánc ad. Az integritás a helyesen megírt kódon, a hozzáférés-ellenőrzésen és az átláthatóságon nyugszik, nem azon, hogy a matematika lehetetlenné teszi a csalást. Ezért vannak további intézkedések is — az adatok titkosítása átvitel közben és nyugalmi állapotban, rendszeres, külön helyre készülő biztonsági mentések, és nyílt kód, amelyet bárki függetlenül átnézhet.`,
      },
      {
        id: 80,
        pitanje: `Hol van a nyilvános kódtár? Letölthetem és futtathatom magam (self-host)?`,
        odgovor: `A platform teljes forráskódja nyilvánosan elérhető a GitHubon: https://github.com/alvaserbia-prog/kolo-platform-izvor

Szabadon átnézheted, letöltheted és futtathatod a saját másolatodat. A szoftver AGPL-3.0 licenc alatt áll, amely ezt kifejezetten megengedi — egyetlen feltétellel: ha a másolatodat nyilvános internetes szolgáltatásként üzemelteted, neked is elérhetővé kell tenned a saját forráskódodat, minden módosítással együtt, a felhasználóid számára, ugyanazon licenc alatt. Így marad a kód tartósan nyitott.

A futtatáshoz Node.js környezet és PostgreSQL adatbázis szükséges; az alapvető útmutatás (telepítés, indítás, környezeti változók) a kódtár README és .env.example fájljaiban található. A kódhoz való hozzájárulásokat a hozzájárulás eredetéről szóló DCO-aláírással fogadjuk, amelyet a CONTRIBUTING fájl ír le.

A dokumentáció és a rendszer szövegei CC BY-SA 4.0 licenc alatt állnak — szabadon használhatók és átdolgozhatók a szerzőség feltüntetésével és ugyanazon licenc alatt.`,
      },
      {
        id: 69,
        pitanje: `Ha PR-t küldök (kódhozzájárulást) — kapok POEN-t? Működési hozzájárulás ez? Kell, hogy valaki megerősítsen?`,
        odgovor: `A kóddal való hozzájárulás az működési hozzájáruláshoz tartozik — ugyanahhoz a csatornához, amelyen keresztül a közös jóért végzett minden munkát rögzítenek.

A kód és a tartalom közös jó: a szoftver AGPL-3.0, a tartalom CC BY-SA 4.0 licenc alatt áll. A kóddal való hozzájárulást a DCO elve szerint fogadják el („Signed-off-by” aláírás) — ez a hozzájárulás eredetének megerősítése, nem a szerzői jogok átruházása az Alapítványra. A hozzájáruláson szereplő attribúciód tartós, és akkor is megmarad, ha később törlöd a fiókodat.

Ahhoz, hogy POEN rögzüljön neked, a Kolóban kell lenned, Kolo-tagként vagy megerősítés nélküli tagként, a hozzájárulás pedig közzétett feladaton keresztül történik: a kezdeti szakaszban a feladatokat az Alapítvány teszi közzé, és a teljesítést is ő erősíti meg, a közösségi irányítás aktiválása után a feladatokat a Felső Kolo és a Kolo-őrzők is közzéteszik, a teljesítést pedig a Kolo-őrzők erősítik meg. Jelentkezel, elvégzed a feladatot, a teljesítést megerősítik, és ekkor rögzül a POEN.`,
      },
      {
        id: 70,
        pitanje: `Van nyilvános vagy fejlesztői API? Építhetek integrációkat vagy botokat?`,
        odgovor: `Jelenleg nincs nyilvános fejlesztői API integrációk vagy botok építéséhez.

Ami létezik, az a saját adataid exportja: bármikor kérheted az összes adatodat strukturált, géppel olvasható formátumban (JSON) — ez az adathordozhatósághoz való törvényes jogod. Ez azonban a személyes adataid exportja, nem programozói felület az egész rendszer felett.

Az is fontos, hogy miért: a rendszer fokozatos láthatósággal működik — az álneveket és az egyes tranzakciókat csak a résztvevők látják, a nem regisztráltak pedig csak összesített számokat. Minden jövőbeli API-nak ugyanezt a szabályt kellene betartania, különben megkerülné a magánszféra védelmét.`,
      },
    ],
  },
];
