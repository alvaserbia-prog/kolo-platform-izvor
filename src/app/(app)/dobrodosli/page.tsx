"use client";

/**
 * /dobrodosli — vodič kroz KOLO za nove korisnike.
 * Prikazuje se jednom, odmah posle registracije (umesto direktnog bacanja na QR),
 * a kasnije je uvek dostupan iz "?" u headeru (tada ceo vodič od početka).
 *
 * Ekrani su definisani u messages/ pod "dobrodosli" (ključevi ekranN_*),
 * pa se tekst menja bez diranja ove komponente. Dodavanje/uklanjanje ekrana =
 * izmena niza EKRANI ispod + odgovarajući ključevi u messages.
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import GdeSeNalazi, { type Gde } from "@/components/dobrodosli/GdeSeNalazi";
import { useMe } from "@/hooks/useMe";
import Dugme from "@/components/ui/Dugme";
import { IZNOS as IZNOS_PRVOG_OGLASA } from "@/lib/doprinos-pravila";
import { POEN_VERIFIKOVANI } from "@/lib/protokol/dokaz-stvarnosti";
import { PRIJATELJSTVO_POEN } from "@/lib/deca-pravila";

/** Akciona veza ekrana: dugme + (opciono) crtež koji pokazuje gde ta stranica
 *  stoji u navigaciji (vidi GdeSeNalazi). Ekran može imati više akcija.
 *
 *  🔴 Dečji ekrani NEMAJU crtež: `GdeSeNalazi` crta meni punoletnog naloga, a
 *  navigacija maloletnog je kraća verzija (Sidebar) — crtež bi pokazivao stavke
 *  kojih dete nema. Zato je `gde` opciono, a ne izmišljen dečji crtež. */
type Akcija = { href: string; ctaKey: string; gde?: Gde };

/** Konfiguracija ekrana: ključevi pasusa u messages + akcione veze.
 *
 *  Pasusi se navode POIMENCE, ne brojem, da bi neki mogao da bude uslovan —
 *  pasus o deci na poslednjem ekranu postoji samo dok Modul Deca radi. Dok je
 *  ovde stajao broj pasusa, uslovan pasus bi tražio i menjanje brojeva ključeva.
 *
 *  Redosled prati stvarni put novog člana: objava ponude (koju sme odmah,
 *  bez ijedne potvrde) pa tek onda potvrda. Raniji vodič je imao sedam ekrana
 *  i dva „puta" kroz koja je svako prolazio linearno, pa je isto pitanje
 *  postavljao dvaput — na prvom i na poslednjem ekranu. */
const EKRANI_ODRASLI: { key: string; pasusi: string[]; akcije?: Akcija[] }[] = [
  // šta je KOLO i šta je POEN — jedini ekran bez radnje
  { key: "ekran1", pasusi: ["ekran1_p1", "ekran1_p2"] },
  // prvi potez: objava ponude. Ide PRE potvrde, jer je to danas glavni put
  // (Uslovi čl. 14 st. 2, Pravilnik čl. 38) i jer isti redosled obećava Početna.
  {
    key: "ekran2",
    pasusi: ["ekran2_p1", "ekran2_p2", "ekran2_p3"],
    akcije: [
      { href: "/pijaca/novi-oglas", ctaKey: "ekran2_cta", gde: { vrsta: "meni", stavka: "pijaca", grupa: "grupa_razmena" } },
      // Gazdinstvo sme da prijavi i nov član (član gazdinstva je punoletan nalog,
      // potvrda nije uslov), a tri oglasa uz prijavu staju u njegov limit od tri.
      { href: "/gazdinstva/prijava", ctaKey: "ekran2_cta_gazdinstvo", gde: { vrsta: "meni", stavka: "gazdinstva", grupa: "grupa_razmena" } },
    ],
  },
  // drugi potez: potvrda. Oba puta (poznaje / ne poznaje nikoga) stoje na
  // JEDNOM ekranu — ranije su bila dva ekrana kroz koja je svako prolazio.
  {
    key: "ekran3",
    pasusi: ["ekran3_p1", "ekran3_p2", "ekran3_p3", "ekran3_p4"],
    akcije: [
      {
        href: "/verifikacija",
        ctaKey: "ekran3_cta",
        gde: { vrsta: "meni", stavka: "verifikacija", grupa: "grupa_poverenje" },
      },
    ],
  },
  // profil, gde je šta, i (dok modul radi) nalog za dete
  {
    key: "ekran4",
    pasusi: ["ekran4_p1", "ekran4_p2"],
    akcije: [
      { href: "/pijaca", ctaKey: "ekran4_cta_pijaca", gde: { vrsta: "meni", stavka: "pijaca", grupa: "grupa_razmena" } },
      { href: "/profil", ctaKey: "ekran4_cta_profil", gde: { vrsta: "profil" } },
    ],
  },
];

/** Vodič za maloletni nalog — isti okvir, drugi tekst i druge rute.
 *
 *  Redosled prati ono što dete stvarno radi: šta je KOLO i šta roditelj treba
 *  da uradi, pa oglas, pa prijateljstva (odakle POENI i dolaze), pa profil i
 *  trošenje POENA. Ključevi su u `dobrodosli`, sa prefiksom `dete`.
 */
const EKRANI_DETE: { key: string; pasusi: string[]; akcije?: Akcija[] }[] = [
  { key: "dete1", pasusi: ["dete1_p1", "dete1_p2", "dete1_p3", "dete1_p4"] },
  {
    key: "dete2",
    pasusi: ["dete2_p1", "dete2_p2", "dete2_p3"],
    akcije: [{ href: "/pijaca/novi-oglas", ctaKey: "dete2_cta" }],
  },
  {
    key: "dete3",
    pasusi: ["dete3_p1", "dete3_p2", "dete3_p3", "dete3_p4"],
    akcije: [{ href: "/prijatelji", ctaKey: "dete3_cta" }],
  },
  {
    key: "dete4",
    pasusi: ["dete4_p1", "dete4_p2", "dete4_p3"],
    akcije: [
      { href: "/pijaca", ctaKey: "dete4_cta_pijaca" },
      { href: "/profil", ctaKey: "dete4_cta_profil" },
    ],
  },
];

/** sessionStorage ključ za korak na koji se korisnik vraća posle CTA odlaska. */
const KLJUC_KORAK = "kolo-dobrodosli-korak";

export default function DobrodosliPage() {
  const t = useTranslations("dobrodosli");
  const router = useRouter();
  // Dete i odrastao dobijaju različit vodič. Čita se iz `/api/me`, ne iz sesije:
  // `maloletan` se ne nalazi u tokenu, a dok odgovor ne stigne prikazuje se
  // vodič za odrasle — to je i podrazumevani slučaj i ne treperi na promeni.
  const { data: me } = useMe();
  const EKRANI = me?.maloletan ? EKRANI_DETE : EKRANI_ODRASLI;
  const [korak, setKorak] = useState(0);
  const [prviPut, setPrviPut] = useState(false);

  // Jednokratni flag iz registracije/OAuth-a: ako postoji, ovo je prvi prolaz
  // (gornje dugme = "Preskoči" → /sistem). Inače je vodič otvoren iz "?"
  // (gornje dugme = "Zatvori" → nazad). Flag čistimo čim ga pročitamo.
  //
  // Uz to vraćamo korak na koji se čovek vratio: CTA dugmad vode van vodiča
  // (npr. na tablu jemstva), a povratak je do sada uvek počinjao od ekrana 1 —
  // ko izađe da pogleda pa se vrati, morao je ponovo da proklikta ceo vodič.
  // Korak upisuje `idiNa` pri odlasku, ovde ga trošimo (pročitaj pa obriši),
  // tako da vodič otvoren iz "?" i dalje kreće od početka.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("kolo-welcome")) {
        setPrviPut(true);
        sessionStorage.removeItem("kolo-welcome");
      }
      const sacuvan = sessionStorage.getItem(KLJUC_KORAK);
      if (sacuvan !== null) {
        sessionStorage.removeItem(KLJUC_KORAK);
        const n = Number(sacuvan);
        if (Number.isInteger(n) && n >= 0 && n < EKRANI.length) setKorak(n);
      }
    } catch {
      /* nedostupan */
    }
    // Zabeleži da je vodič viđen — time prestaje automatsko vođenje ovamo pri
    // prijavi (`User.vodicVidjenAt`). Upis ide pri otvaranju, ne na izlasku: ko
    // zatvori prozor na trećem ekranu, vodič JE video, a i nijedan izlaz iz
    // vodiča ne bi mogao da promakne. Ruta piše samo kad je polje prazno, pa
    // otvaranje iz „?" ne pomera zabeleženi trenutak. Pad se ćutke prelazi —
    // najgore što se dešava jeste da se vodič ponudi i pri sledećoj prijavi.
    void fetch("/api/profil/vodic", { method: "POST" }).catch(() => {});
  }, []);

  /** Odlazak sa vodiča preko CTA dugmeta — zapamti korak radi povratka. */
  function idiNa(href: string) {
    try {
      sessionStorage.setItem(KLJUC_KORAK, String(korak));
    } catch {
      /* nedostupan — u najgorem slučaju vodič kreće od početka, kao ranije */
    }
    router.push(href);
  }

  const ekran = EKRANI[korak];
  const prvi = korak === 0;
  const poslednji = korak === EKRANI.length - 1;
  const oznaka = t(`${ekran.key}_oznaka`);
  // Iznosi se čitaju iz pravila (pravilo 10), ne upisuju u tekst.
  const iznosi = {
    oglas: IZNOS_PRVOG_OGLASA.toLocaleString("sr-RS"),
    potvrda: POEN_VERIFIKOVANI.toLocaleString("sr-RS"),
    prijateljstvo: PRIJATELJSTVO_POEN.toLocaleString("sr-RS"),
  };
  const pasusi = ekran.pasusi.map((k) => t(k, iznosi));

  /**
   * Izlaz iz vodiča.
   *
   * Na prvom prolazu vodi na **Pijacu**, ne na Sistem: prvi potez novog čoveka
   * je objava oglasa (Početna, „put do učešća"), a Sistem je pregled brojeva
   * koji tek registrovanom nalogu ništa ne govori — svi su na nuli.
   * Vodič otvoren iz „?" u zaglavlju se samo zatvara, nazad odakle je otvoren.
   */
  function zatvori() {
    if (prviPut) router.push("/pijaca");
    else router.back();
  }

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      {/* Preskoči (prvi prolaz) / Zatvori (otvoreno iz "?") */}
      <div className="flex justify-end">
        <Dugme varijanta="tiho" velicina="sm" onClick={zatvori}>
          {prviPut ? t("preskoči") : t("zatvori")}
        </Dugme>
      </div>

      {/* Indikator koraka */}
      <div className="flex items-center justify-center gap-2">
        {EKRANI.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === korak ? "w-8 bg-kolo-green-500" : "w-2 bg-kolo-border"
            }`}
          />
        ))}
      </div>

      {/* Kartica u stilu vesti Fondacije */}
      <div className="bg-kolo-surface rounded-kartica shadow-kartica border border-kolo-border p-7 md:p-9">
        <p className="text-xs font-semibold uppercase tracking-wider text-kolo-green-700">
          {t("korak_indikator", { broj: korak + 1, ukupno: EKRANI.length, oznaka })}
        </p>
        <h1 className="kolo-naslov mt-2">{t(`${ekran.key}_naslov`)}</h1>
        <div className="mt-4 space-y-3">
          {pasusi.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-kolo-text text-body">
              {p}
            </p>
          ))}
        </div>

        {/* Akcione veze ekrana: dugme + crtež gde se stranica nalazi u navigaciji */}
        {ekran.akcije?.map((akcija) => (
          <div key={akcija.href} className="mt-5 flex flex-col items-start">
            <Dugme varijanta="sekundarno" onClick={() => idiNa(akcija.href)}>
              {t(akcija.ctaKey)} →
            </Dugme>
            {akcija.gde && <GdeSeNalazi gde={akcija.gde} />}
          </div>
        ))}
      </div>

      {/* Navigacija */}
      <div className="flex items-center justify-between">
        <Dugme
          varijanta="tiho"
          onClick={() => setKorak((k) => Math.max(0, k - 1))}
          disabled={prvi}
          className="disabled:opacity-0"
        >
          {t("nazad")}
        </Dugme>
        {!poslednji && (
          <Dugme onClick={() => setKorak((k) => Math.min(EKRANI.length - 1, k + 1))}>
            {t("dalje")}
          </Dugme>
        )}
      </div>
    </div>
  );
}
