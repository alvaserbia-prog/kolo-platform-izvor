import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ucitajPravniDokument } from "@/lib/pravni-dokument";
import { pageMetadata } from "@/lib/seo";

/**
 * Fajl i verzija po slug-u. Naziv i opis NISU ovde — čitaju se iz prevoda
 * (`pravne.rb.<slug>.naziv` / `.opis`), pa postoje na svih pet jezika. Ranije
 * su stajali i ovde, u srpskoj kopiji koju nijedna linija nije čitala; ta
 * kopija je zaostala na staroj terminologiji („verifikacija korisnika") i
 * čekala da je neko prepiše kao tačnu.
 */
const PRAVILNICI: Record<string, { fajl: string; verzija: string }> = {
  // 4.8.3 (23.10.2026) — učesnik u Kolu, potvrda telefonom (dokaz čl. 5c), spisak
  // povezanih (čl. 5d), gazdinstva bez izvoda: svi akti osim Statuta, hijerarhije,
  // osnivačkog doprinosa, Gornjeg Kola i izjave o rizicima.
  // 4.8.2 — CEO SET osim Statuta (dogovor o učesnicima i potvrdama, 21.10.2026,
  // `docs/dogovor-ucesnici-i-potvrde-2026-10.md`): statusi korisnik / član bez
  // potvrde / član Kola / čuvar Kola; potvrda i uvođenje u Kolo; spisak za poziv;
  // potvrda uplatom i izvodom iz RPG ukinuta; Gornje Kolo = čuvari sa aktiviranim
  // ZRNOM, sastav dnevno; deca u tri stanja; prestanak gazdinstva (sedam osnova
  // negativnog zapisa). Svi akti dobijaju istu šifru jer se svaki sadržinski menja.
  // 4.4.6 — položaj Gornjeg Kola (R-09): telo obrazovano na osnovu Statuta, nije
  // organ Fondacije; odluku sprovodi UO svojim aktom i dužan je da ga donese osim
  // po zatvorenoj listi razloga (čl. 51). Brisano „izvršna, ne upravljačka".
  // 4.5.2 — čl. 14 st. 3 dobija ČETVRTI izuzetak od zabrane negativnog zapisa:
  // otpis po poništenju potvrde zbog neaktivnosti (čl. 6 Pravilnika o učešću dece).
  // Bez izmene ovog člana taj otpis ne bi imao osnov — st. 6 izričito kaže da se
  // drugi osnov ne može ustanoviti nijednim drugim aktom.
  // 4.5.7 — čl. 14 st. 3 dobija PETI izuzetak: otpis po prevođenju punoletnog naloga
  // u maloletni (čl. 4d Pravilnika o učešću dece). Kod je taj minus pravio od
  // 2026-08-23, a akt ga je izričito zabranjivao — R-20.
  // 4.5.9 — R-02 (Poreska uprava): čl. 13 dobija stav o pojmu prihoda (upisom se
  // ne prima ni novac ni stvar, ništa ne prelazi iz imovine Fondacije, osnovica u
  // novcu se ne utvrđuje); čl. 36 st. 4 sustiže operativni čl. 27 (ni rad van
  // radnog odnosa, naročito ne ugovor o delu); čl. 57 st. 5 briše „nije socijalna
  // pomoć" — ta rečenica je sama zatvarala izuzeće iz čl. 9 ZPDG i protivrečila
  // čl. 6 Statuta. Ostaje „nije naknada".
  // 4.6.2 — R-04: čl. 23 st. 3 je tvrdio da upis i otpis ZRNA pomeraju
  // koeficijent (netačno — oba člana se menjaju u istoj srazmeri, pa je količnik
  // isti); čl. 25 dobija odgovor po elementima testa investicionog ugovora
  // umesto etikete „nije prinos". 🟡 Istog dana su 4.6.0 (R-02) i 4.6.1 (R-03)
  // već objavljeni na `main`-u, pa dva različita događaja objave ne dele šifru.
  // 4.6.4 — R-07 (nelojalna i obmanjujuća poslovna praksa): čl. 16 više ne govori
  // o „ceni" u opisu javnog pregleda oglasa nego o iznosu u POEN-ima. Ista rečenica
  // stoji i u Uslovima čl. 18; da je ispravljena samo tamo, dva akta bi o istoj
  // činjenici govorila različito.
  // 4.6.6 — R-01: čl. 28 — prepis POEN-a otvoren članu sa utvrđenim identitetom.
  // Aktiviranje i otpis ZRNA, glas i potvrđivanje drugih ostaju zatvoreni.
  // 4.6.5 — POEN po potvrdi čeka prvi potvrđen doprinos potvrđenog korisnika
  // (čl. 15 t. 2, upućivanje na čl. 7 dokaza stvarnosti), a odobrenje prvog oglasa
  // iz čl. 40a važi za SVAKOG korisnika, ne samo za nalog bez potvrde.
  // 🟡 Šifru 4.6.4 je istog dana uzeo R-07 na `main`-u, pa dva različita događaja
  // objave ne dele broj — isti postupak kao 4.6.0 naspram 4.5.9.
  // 4.6.9 — čl. 16, nov stav: Fondacija ne posreduje u zamenama POEN-a za novac,
  // oglas za takvu zamenu nije dozvoljen, a prenos POEN-a služi razmeni proizvoda,
  // usluga i znanja i drugim oblicima uzajamnosti.
  // 4.7.0 — Modul Zadruga: čl. 15 upućuje na Pravilnik o zadrugama; čl. 56 dobija
  // krug kao istu jedinicu (prag jednom), osnov za svaki zapis zadruge i
  // poništenje POEN-a zapisa zadruge pri prestanku učešća (osnov za umanjenje
  // ukupnog broja POEN-a iz čl. 14 mora stajati u ovom pravilniku).
  // 4.7.2 — čl. 14 st. 3 dobija SEDMI izuzetak: otpis po poništenju odobrenja
  // gazdinstva (lažna izjava); nov čl. 40c (doprinos gazdinstva u kanalu 8: beleži
  // se pri odobrenju, evidentira kad član ima oglas i potvrdu); čl. 40b više nema
  // zbirnu kapu od 5.000 za ceo kanal 8 (putanja ionako ima pet koraka po 1.000).
  // 4.7.3 — nov čl. 31a (evidencija identiteta: ime i prezime uz pseudonim, iz tri
  // slučaja — gazdinstvo, javna donacija, zadruga; bez JMBG i isprava); čl. 31 st. 2,
  // 34, 40c, 61, 62 i 67 usklađeni.
  // 4.7.4 — čl. 40c st. 5: Fondacija ne proverava podatke u državnim registrima
  // (izvod iz RPG se ne traži).
  // 4.7.5 — čl. 31a st. 2 t. 4: pokroviteljstvo kao četvrti slučaj upisa (ime
  // zastupnika pri potvrdi prijema, posle poređenja sa APR-om); st. 3 i 5.
  // 4.7.7 — čl. 14: osnov za jednokratno poništenje zatečenog doprinosa za nadzor;
  // čl. 31a: ime donatora samo kad ga potvrđuje izvod; čl. 34: pseudonimizacija;
  // „pravo potvrđivanja" umesto kapaciteta.
  // 4.7.8 — čl. 14 st. 3 t. 8: osmi osnov negativnog zapisa (neizvršenje pokroviteljstva
  // dobrima i uslugama); čl. 15: kada je takvo pokroviteljstvo primljeno.
  // 4.7.9 — čl. 2 i 38 (finansijski doprinos), čl. 2 i 40 (pokrovitelj): nosilac
  // registrovanog poljoprivrednog gazdinstva daje i novčano pokroviteljstvo.
  // 4.8.1 — čl. 16, 28, 32 i 67: neverifikovani korisnik postavlja i potražnju,
  // pokreće razgovor povodom oglasa, prepisuje POEN, podnosi zahtev za razgovor i
  // vidi listu donacija bez imena donatora.
  // 4.8.3 — čl. 15: doprinos gazdinstva je zaseban kanal (tačka 10); kanal pod
  // tačkom 8 obuhvata samo doprinos prvim oglasom.
  // 4.8.4 — registar 2026-10, oblast N: čl. 13 (elementi platne usluge i e-novca koji
  // nedostaju; poništenje pri raspodeli nije cenovnik), čl. 14 st. 3 t. 8 (osmi osnov:
  // otpis po utvrđenju višestrukog naloga), čl. 16 st. 11 (ispravka, ne povraćaj),
  // čl. 2, 31 (jedinstvenost se ne jemči verifikacijom), čl. 31a (peti slučaj: spisak
  // za poziv), čl. 71 (raspodela vaučera nije posredna konverzija).
  "kolo-sistem": {
    fajl: "Pravilnik_4_8_4.md",
    verzija: "4.8.4",
  },
  // 4.4.6 — čl. 12 st. 4 više ne prenosi nadležnost za opšte akte na Gornje Kolo
  // (akt nižeg ranga to ne može po sopstvenom čl. 8 st. 2); nov st. 6.
  // 4.6.8 — čl. 3 st. 4: FAQ, ekrani i video ne stvaraju prava ni obaveze, kao
  // ni Whitepaper; čl. 14 više ne nosi neodlučen izbor u uglastim zagradama.
  // 4.7.0 — čl. 7 st. 2: Pravilnik o zadrugama umesto Pravilnika o kolektivnim
  // oblicima; st. 5 više ne nabraja akte koji su doneti (zadruge, deca).
  // 4.7.2 — čl. 7 st. 2: Pravilnik o gazdinstvima.
  "hijerarhija": {
    fajl: "hijerarhija_4_8_3.md",
    verzija: "4.8.3",
  },
  // 4.6.5 — čl. 7: POEN po potvrdi se beleži, a upisuje kad potvrđeni korisnik
  // ostvari prvi potvrđen doprinos (odobren oglas, javna donacija, pokroviteljstvo,
  // operativni doprinos). Isti uslov važi i za nadzornikovih 500, po svom stanju;
  // izuzeto je samo punoletstvo (roditeljske potvrde iz čl. 19 st. 3).
  // 4.7.5 — čl. 8: verifikacioni kapacitet i slotovi su ukinuti; umesto njih dnevni
  // tempo (upozorenje pred 3. i 4. potvrdu u danu, peta se ne evidentira i
  // potvrđivanje staje do kraja dana). Čl. 16–17: prestanak statusa verifikatora ne
  // dira potvrde koje je dao — indeks pada samo poništenjem po Glavi VIII. Čl. 7, 10,
  // 20a, 20b: nadzor se više ne plaća. Šifre 4.7.3 i 4.7.4 su istog dana pripale
  // drugim setovima (evidencija identiteta, gazdinstva), pa ovaj događaj objave nosi
  // narednu slobodnu.
  // 4.7.7 — nov čl. 22b: poništenje zatečenog doprinosa za nadzor — samo živog,
  // protivzapisom koji ostaje u istoriji, bez minusa, uz obaveštenje.
  // 4.8.1 — čl. 5 st. 7: zahtev za razgovor, oznaka verifikacije po zahtevu; čl. 11:
  // signal za prve tri potvrde člana potvrđenog po zahtevu.
  // 4.8.4 — čl. 4a (ime, mesto i broj uslov za spisak, poređenje i oznaka), nov čl. 4b
  // (utvrđivanje višestrukog naloga), čl. 5 i 18 (verifikator ne jemči jedinstvenost).
  "dokaz-stvarnosti": {
    fajl: "dokaz_stvarnosti_4_8_4.md",
    verzija: "4.8.4",
  },
  // 4.4.3 — obrazloženje koeficijenta evidencije (čl. 4) i definicija koeficijenta
  // bez jedinične formulacije „po jednom dinaru" (čl. 2).
  // 4.4.7 — donacija ne daje pravo na dobra iz kolektivne nabavke ni mesto u redu
  // (čl. 4). Petlja donacija → POEN → red za robu vidi se iz OVOG akta, pa brana
  // mora stajati i ovde, ne samo u pravilniku o nabavkama.
  // 4.6.8 — čl. 5a st. 4: ime uz javnu donaciju više NIJE trajno — donator povlači
  // pristanak po donaciji, a gašenje naloga ga briše; donacija ostaje u listi.
  // Isti set (neobjavljen, šifra se ne menja) — čl. 10: pokroviteljstvo po istoj
  // tabeli kao donacija, bez uvećanja od 20%; čl. 11: upis samo podnosiocu prijave;
  // čl. 13: ni donacija ni pokroviteljstvo ne daju prednost u nabavci.
  // 4.7.3 — čl. 5a st. 6: ime donatora javne donacije upisuje se i u evidenciju
  // identiteta; povlačenje pristanka na objavu taj upis ne briše.
  // 4.7.5 — čl. 7: prijava nosi sedište, MB, PIB i zastupnika; ime zastupnika
  // ide u evidenciju identiteta pri potvrdi, posle poređenja sa APR-om; čl. 13:
  // ranglista samo nazivom. (Dopuna je otišla na main posle objave 4.7.3 i 4.7.4,
  // pa je po pouci 1 dobila narednu slobodnu šifru.)
  // 4.7.7 — čl. 7: prijavu podnosi zastupnik sa sopstvenog naloga, maloletni ne;
  // čl. 5a: ime u evidenciji identiteta samo kad ga potvrđuje izvod.
  // 4.7.8 — nova Glava IVa: pokroviteljstvo dobrima i uslugama (ugovor u korist trećih
  // lica, vaučeri, koeficijent dostignut samo novcem, otpis po neizvršenju).
  // 4.7.9 — čl. 1, 6–11 i 13: novčano pokroviteljstvo daje i nosilac registrovanog
  // poljoprivrednog gazdinstva; kumulativ gazdinstva se vodi zasebno (čl. 10).
  // 4.8.0 — čl. 2, 3, 6a, 8 i 13e: upis pokrovitelja i prijavu novčanog
  // pokroviteljstva podnosi punoletni korisnik bez potvrde stvarnosti; javna donacija
  // i novčano pokroviteljstvo potvrđuju stvarnost (dokaz stvarnosti čl. 4a).
  // 4.8.4 — čl. 5b i 13b: bez praga i izjave o poreklu (radi banka), primenu glave
  // prati direktor; čl. 13a (opis strukture), čl. 13f st. 4 (naredni ugovor).
  "pokroviteljstvo-donacije": {
    fajl: "donacije_4_8_4.md",
    verzija: "4.8.4",
  },
  // 4.4.4 — pravna priroda operativnog doprinosa (čl. 27): nema naručioca, nema
  // naknade, rezultat ide u zajedničko dobro pod licencama iz Glave II. Brisan
  // vremenski ekvivalent (čl. 6), upozorenje verifikatora (čl. 13) i gornja
  // granica predloženog POEN-a (raniji čl. 26).
  "operativni": {
  // 4.5.9 — čl. 27 st. 6 (R-02): odbrana više ne pobija samo pojam „naknade" nego
  // nabraja elemente pojma prihoda koji nedostaju.
    fajl: "operativni_4_8_3.md",
    verzija: "4.8.3",
  },
  // 4.4.5 — osnov gornje granice (čl. 5): utrošena sopstvena sredstva i vreme, uz
  // aritmetički razlog zašto taj rad operativni kanal ne može da evidentira (limit
  // je 10% opticaja, a opticaj je bio nula). Čl. 8 više ne tvrdi da udeo opada —
  // opada uticaj JEDNOG koraka, a zbirni udeo stoji na ~19–24%. Čl. 4: rezultat
  // ulazi u zajedničko dobro pod licencama iz Glave II.
  "osnivacki": {
  // 4.5.9 — čl. 4 (R-02): osnivački rad nije naručen posao ni ugovor o delu.
  // Jedini kanal koji sam sebe u aktu naziva radom, pa mu je odbrana bila nužna.
    fajl: "osnivacki_4_8_3.md",
    verzija: "4.8.3",
  },
  // 4.4.6 — statutarni osnov (čl. 2), dinamičan sastav bez imenovanja (čl. 4),
  // sprovođenje odluke aktom UO (čl. 17), izmenu pravilnika donosi UO (čl. 23).
  "gornje-kolo": {
    fajl: "gornje_kolo_4_8_3.md",
    verzija: "4.8.3",
  },
  "programi-podrske": {
  // 4.5.9 — R-02: čl. 2 briše „nije socijalna pomoć"; nov čl. 6a (priroda
  // evidentiranja) — nema isplate, nema prelaza imovine, nije naknada, program se
  // sprovodi u ostvarivanju cilja iz čl. 6 Statuta.
  // 4.6.1 — R-03 (mera M-1): čl. 4 — pojedinačno evidentiranje po programu se ne
  // objavljuje nego dnevni zbir; izostavlja se i iznos, jer se izvodi iz godine
  // rođenja odnosno broja i uzrasta dece i sam bi ih odao.
    fajl: "programi_podrske_4_8_3.md",
    verzija: "4.8.3",
  },
  // Usvojen 4.3.0 — do tada je stajao kao nacrt u `docs/pravilnik-modul-deca.md`.
  // 4.5.2 — postupak potvrde postojanja deteta (R-15, čl. 6 prepisan): izjašnjavaju
  // se OBE strane veze, rok je 60 dana uz podsetnike svima koje bi poništenje
  // oštetilo, svako vraća isključivo svoje (bez nadoknade iz čl. 20b), poništenje
  // nije kvalifikacija neistinite potvrde i protiv njega stoji prigovor.
  // 4.5.3 — uzrasne grupe 7–14 i 15–17 (R-17, čl. 12): do 15 nema ni razmene ni
  // razgovora sa punoletnima i saglasnost to ne otvara; nov čl. 12a (razmena male
  // vrednosti, poslovna sposobnost); čl. 14 — prepis iznad praga čeka roditelja;
  // čl. 10 — roditeljska lozinka samo dok dete nema sopstvenu adresu.
  // 4.5.7 — nov čl. 4d uređuje prevođenje punoletnog naloga u maloletni: ispravka
  // uzrasta, izlazak iz lanca potvrda, poništenje doprinosa iz kanala čl. 15 uz
  // minus na obe strane, obaveštenje i prigovor.
  "ucesce-dece": {
  // 4.5.9 — čl. 14b (R-02): upis iz kanala čl. 15 t. 9 nije naknada i ne donosi
  // maloletnom korisniku ni novac ni stvar.
  // 4.6.1 — R-03 (mera M-4): čl. 15a — spisak dece jedne škole vidi samo
  // punopravno dete te iste škole; nalog koji čeka roditelja ga ne dobija.
  // 4.6.4 — R-07 (mera M-5″): čl. 12a — razmena maloletnog korisnika odnosi se samo
  // na dobra koja po propisima sme da pribavi; zabrana iz Uslova čl. 21 važi i kad
  // razmena nije dogovorena oglasom. Oglas deteta vide pretežno ili isključivo druga
  // deca, pa je to prostor u kome publika nema nijednog odraslog posmatrača.
    // 4.8.1 — čl. 2: obrazloženje izjave o uzrastu usklađeno sa proširenim pristupom
    // novog punoletnog člana.
    // 4.8.3 — čl. 14: ni kanal doprinosa gazdinstva (čl. 15 t. 10 Pravilnika) ne
    // primenjuje se na maloletne učesnike.
    fajl: "ucesce_dece_4_8_3.md",
    verzija: "4.8.3",
  },
  // Nov akt uz set 4.4.1 — osnov u čl. 14a i 51a Pravilnika o KOLO sistemu.
  // 4.4.3 — broj POEN-a po delu je parametar odluke o nabavci (čl. 17), a ne izvod
  // iz maloprodajne vrednosti dobra (čl. 19). Maloprodajna referenca je brisana.
  // 4.4.7 — priroda nabavke (R-10): program iz čl. 7 t. c) Statuta, nije privredna
  // delatnost, zabranjena naknada za ustupljeno dobro (nov čl. 3a); oslobođen deo
  // ide sledećem u redu i ne prodaje se (čl. 29); godišnji zbir projekata (čl. 31).
  "projekti-nabavke": {
  // 4.5.9 — R-02: čl. 19 — poništeni zapis ne prelazi Fondaciji, a zapis koji se
  // poništava je evidencija ranije učinjenog doprinosa, ne jedinica pribavljena
  // radi preuzimanja; čl. 20 — kalkulacija se deli, dinarska strana ide uz čl. 31
  // (inače se odnos POEN:RSD čita deljenjem); nov čl. 21a — godišnja granica
  // dinarske vrednosti preuzetih dobara po korisniku.
  // 4.7.8 — nova Glava VIIIa: raspodela vaučera iz pokroviteljstva; čl. 21a brisan.
    fajl: "projekti_nabavke_4_8_3.md",
    verzija: "4.8.3",
  },
  // Nov akt uz set 4.7.0 — osnov u čl. 56 Pravilnika o KOLO sistemu. Krug i
  // zadruga su isti kolektivni oblik; zapis, pragovi rasta (svaki jednom), osnovi
  // zapisa, raspodela dobara i zadružni doprinos.
  // 4.7.1 — čl. 5 t. 5 i čl. 6: prva zadruga na lokalitetu traži najmanje 50
  // redovnih članova tog lokaliteta i Fondacija učestvuje u osnivanju; svaka
  // sledeća na istom lokalitetu osniva se na inicijativu korisnika, sa 5 zadrugara.
  // 4.7.3 — čl. 7, 9 i 19: ime i prezime zadrugara upisuje se u evidenciju
  // identiteta i ne briše se prestankom svojstva zadrugara.
  "zadruge": {
    fajl: "zadruge_4_8_3.md",
    verzija: "4.8.3",
  },
  // Nov akt uz set 4.7.2 — osnov u čl. 40c Pravilnika o KOLO sistemu. Gazdinstvo
  // nije korisnik ni kolektivni oblik; prijava, članovi (samo punoletni), oglasi u
  // ime gazdinstva i oznaka DOMAĆE, javna mapa, lažna izjava (sedmi osnov minusa).
  // 4.7.3 — čl. 4 t. 8 i čl. 7: ime i prezime svakog člana (za sopstveni nalog);
  // čl. 6: kad je naveden BPG, poređenje sa izvodom iz RPG (izvod se ne čuva).
  // 4.7.4 — čl. 4 t. 1: BPG se navodi kad je gazdinstvo upisano u registar; čl. 6:
  // izvod iz RPG se ne traži, Fondacija se oslanja na izjavu.
  // 4.7.6 — čl. 4 t. 3: adresa gazdinstva je obavezan deo prijave; čl. 11: adresa
  // se ne prikazuje drugim korisnicima, vidi je samo administratorski tim.
  // 4.7.7 — čl. 8 t. 1: računa se i oglas koji više nije objavljen; ako je doprinos za
  // prvi oglas (čl. 40a) već evidentiran, doprinos gazdinstva se evidentira odmah.
  // 4.7.8 — čl. 4 t. 3 i čl. 11: adresa se ispisuje uz tačku na mapi samo uz
  // pristanak podnosioca; na istoj mapi su i pokrovitelji.
  // 4.8.1 — čl. 4 t. 9, čl. 6, nov čl. 6a i čl. 7: broj telefona i razgovor
  // Fondacije sa svakim članom pre odobrenja.
  "gazdinstva": {
    fajl: "gazdinstva_4_8_3.md",
    verzija: "4.8.3",
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = PRAVILNICI[slug];
  if (!p) return { title: "KOLO" };
  const t = await getTranslations("pravne");
  const naziv = t(`rb.${slug}.naziv`);
  return pageMetadata({
    title: `${naziv} — KOLO`,
    description: `${naziv} ${p.verzija}. ${t(`rb.${slug}.opis`)}`,
    path: `/pravilnik/${slug}`,
  });
}

export async function generateStaticParams() {
  return Object.keys(PRAVILNICI).map((slug) => ({ slug }));
}

export default async function PravilnikSlugPage({ params }: Props) {
  const { slug } = await params;
  const p = PRAVILNICI[slug];
  if (!p) notFound();

  const locale = await getLocale();
  const t = await getTranslations("pravne");
  const sadrzaj = await ucitajPravniDokument(p.fajl, locale);

  return (
    <div className="max-w-uska mx-auto pb-16">

      <div className="mb-8">
        <p className="text-xs text-kolo-muted mb-1">
          <Link href="/pravilnik" className="hover:text-kolo-green-700 transition-colors">{t("pravilnik.pravilnici")}</Link>
          {" / "}
          <span>{t(`rb.${slug}.naziv`)}</span>
        </p>
        <h1 className="kolo-naslov text-kolo-green-900">
          {t(`rb.${slug}.naziv`)}
        </h1>
        <p className="text-sm text-kolo-muted mt-2">{t("verzija")} {p.verzija}</p>
      </div>

      <article
        className="
          text-sm text-kolo-text leading-relaxed text-body [&>h1:first-child]:hidden
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-kolo-green-900 [&_h1]:mb-6 [&_h1]:mt-8
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-kolo-green-900 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:pt-4 [&_h2]:border-t [&_h2]:border-kolo-border
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-kolo-green-900 [&_h3]:mb-3 [&_h3]:mt-6
          [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-kolo-text [&_h4]:mb-2 [&_h4]:mt-4
          [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
          [&_li]:leading-relaxed
          [&_strong]:font-semibold [&_strong]:text-kolo-text
          [&_em]:italic
          [&_a]:text-kolo-green-700 [&_a]:underline
          [&_hr]:my-6 [&_hr]:border-kolo-border
          [&_blockquote]:border-l-4 [&_blockquote]:border-kolo-green-700 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-kolo-muted [&_blockquote]:my-4
          [&_code]:bg-kolo-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
          [&_table]:w-full [&_table]:my-4 [&_table]:text-sm
          [&_th]:text-left [&_th]:font-semibold [&_th]:p-2 [&_th]:border-b [&_th]:border-kolo-border [&_th]:bg-kolo-bg
          [&_td]:p-2 [&_td]:border-b [&_td]:border-kolo-border [&_td]:align-top
        "
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{sadrzaj}</ReactMarkdown>
      </article>

      <div className="mt-10 pt-6 border-t border-kolo-border flex flex-wrap gap-4 text-sm text-kolo-muted">
        <Link href="/pravilnik" className="text-kolo-green-700 hover:underline">
          {t("pravilnik.sviPravilnici")}
        </Link>
        <Link href="/" className="hover:text-kolo-green-700 transition-colors">
          {t("nazadNaPocetnu")}
        </Link>
      </div>
    </div>
  );
}
