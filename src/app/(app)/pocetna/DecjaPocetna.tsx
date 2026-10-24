"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { KarticaSkole } from "@/lib/skola";
import OznakaStatusa from "@/components/OznakaStatusa";
import PrijavaRoditeljstva from "@/components/deca/PrijavaRoditeljstva";
import type { StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import type { NaStaSeCeka } from "@/lib/deca-pravila";

type Oglas = {
  id: string;
  naslov: string;
  opis: string;
  cena: number | null;
  cenaTip: string;
  imaSliku: boolean;
  oglasivac: string;
};

type Poruka = {
  id: string;
  userId: string;
  pseudonim: string;
  avatar: string | null;
  content: string;
  createdAt: string;
};

/**
 * Boje dečjeg prostora.
 *
 * Zelena je boja sistema odraslih; ovde je namerno nema kao vodeće. Dete je svoj
 * ekran nacrtalo bojicama, sa naslovom u kome je svako slovo druge boje — paleta
 * je odatle, ne iz teme platforme.
 *
 * 🔴 Vrednosti su od 31.08.2026. u `globals.css` kao `--color-deca-*`, ne više
 * doslovno u komponenti. Dva razloga, oba stvarna:
 *
 *  1. Zatečena paleta se koristila kao podloga BELOG teksta, a nijedna od osam
 *     boja ne prelazi 4,5 : 1 — „Moji oglasi" je bio na 1,98 : 1. Ispravka mora
 *     da se desi na jednom mestu, a niz je bio prepisan i u `PrijateljiKlijent`.
 *  2. `style={{ backgroundColor }}` ne ume `hover:`, `focus-visible:` ni
 *     `disabled:`, pa se to nadoknađivalo sa `hover:brightness-110` — koje
 *     svetlu boju čini JOŠ svetlijom, tj. pogoršava upravo ono što je palo.
 *
 * Stopa 600 nosi tekst i podlogu dugmeta, 400 je zatečena boja sa crteža (velike
 * površine i okviri), 100 je podloga kartice. Klase su ispisane cele jer Tailwind
 * čita izvor kao tekst — sastavljeno ime klase se ne bi prevelo u CSS.
 */
const BOJE_DECE = [
  { tekst: "text-deca-korala-600",   puno: "bg-deca-korala-600",   okvir: "border-deca-korala-400" },
  { tekst: "text-deca-narandza-600", puno: "bg-deca-narandza-600", okvir: "border-deca-narandza-400" },
  { tekst: "text-deca-sunce-600",    puno: "bg-deca-sunce-600",    okvir: "border-deca-sunce-400" },
  { tekst: "text-deca-trava-600",    puno: "bg-deca-trava-600",    okvir: "border-deca-trava-400" },
  { tekst: "text-deca-more-600",     puno: "bg-deca-more-600",     okvir: "border-deca-more-400" },
  { tekst: "text-deca-nebo-600",     puno: "bg-deca-nebo-600",     okvir: "border-deca-nebo-400" },
  { tekst: "text-deca-slezova-600",  puno: "bg-deca-slezova-600",  okvir: "border-deca-slezova-400" },
  { tekst: "text-deca-roze-600",     puno: "bg-deca-roze-600",     okvir: "border-deca-roze-400" },
];

/** Naslov u kome svako slovo ima svoju boju — kao na crtežu. */
function SareniNaslov({ tekst }: { tekst: string }) {
  return (
    <h1 className="text-center text-4xl font-extrabold tracking-tight break-words sm:text-5xl">
      {[...tekst].map((slovo, i) => (
        <span key={i} className={BOJE_DECE[i % BOJE_DECE.length].tekst}>
          {slovo}
        </span>
      ))}
    </h1>
  );
}

/**
 * Dečja početna — sve na JEDNOM ekranu, po skici koju je nacrtalo dete.
 *
 * 🔴 Radnje stoje na stranici, ne u meniju. Za sedmogodišnjaka meni iza hamburgera
 * ne postoji — postoji ono što vidi pred sobom. Zato su i POEN i dugmad i oglasi i
 * soba ovde, a sidebar je samo rezerva.
 *
 * 🔴 U dečjem prostoru nema teksta ispod `text-sm`. Zatečeno stanje je objašnjenja
 * — opis oglasa, uputstvo uz kod, napomenu o roditeljskom uvidu — držalo na 12 px
 * sivo, dakle baš ono što je detetu koje tek čita najpotrebnije, a najteže za
 * čitanje. Glasni delovi (broj, dugmad) bili su veliki; objašnjenja nisu.
 */
export default function DecjaPocetna({
  pseudonim,
  mojId,
  poen,
  brojPrijatelja,
  poenNaCekanju,
  stanje,
  kod,
  mojihOglasa,
  oglasi,
  chatInicijalno,
  skola,
  status = null,
  naStaSeCeka = null,
  roditelji = [],
}: {
  pseudonim: string;
  mojId: string;
  poen: number;
  brojPrijatelja: number;
  poenNaCekanju: number;
  stanje: "NA_CEKANJU" | "POVEZANO" | "AKTIVNO";
  /** Šestocifreni kod za roditelja; postoji samo dok nalog čeka. */
  kod: string | null;
  mojihOglasa: number;
  oglasi: Oglas[];
  chatInicijalno: Poruka[];
  /** Kartica škole (čl. 7). `null` dok dete nije izabralo školu. */
  skola: KarticaSkole | null;
  /** Status deteta (set 4.8.2) i na šta se čeka — crta ih `OznakaStatusa`. */
  status?: StatusUcesnika | null;
  naStaSeCeka?: NaStaSeCeka | null;
  /** Lica upisana kao roditelji (veza nije zaustavljena) — prijava po čl. 4e. */
  roditelji?: { id: string; pseudonim: string }[];
}) {
  const t = useTranslations("decjaPocetna");
  const tDeca = useTranslations("deca");
  const tSkole = useTranslations("skole");
  const [pretraga, setPretraga] = useState("");
  const cekaRoditelja = stanje === "NA_CEKANJU";
  // Dete sa roditeljem ne objavljuje i ne prepisuje — ni sa roditeljem (deca
  // čl. 4c t. 2, 13 st. 4, 14 poslednji stav). To može tek dete Kola.
  const deteKola = stanje === "AKTIVNO";

  const vidljivi = pretraga.trim()
    ? oglasi.filter((o) =>
        `${o.naslov} ${o.opis}`.toLowerCase().includes(pretraga.trim().toLowerCase()),
      )
    : oglasi;

  /**
   * Ekran deteta koje čeka roditelja (čl. 4c).
   *
   * 🔴 Poruka mora da bude KONKRETNA. POEN je apstraktan sedmogodišnjaku; ne moći
   * odgovoriti drugu koji ti je upravo skenirao kod — to je konkretno. Zato se broj
   * prijatelja koji čekaju stavlja u samu rečenicu.
   */
  if (cekaRoditelja) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <SareniNaslov tekst={t("pozdrav", { pseudonim })} />
        <section className="rounded-3xl border-4 border-deca-narandza-400 bg-white p-6 text-center shadow-sm">
          <h2 className="mt-2 text-xl font-extrabold text-deca-korala-600">{t("ceka_naslov")}</h2>
          <p className="mt-2 text-base text-kolo-text">{t("ceka_opis", { broj: brojPrijatelja })}</p>
          <p className="mt-3 text-sm text-kolo-muted">{t("ceka_uputstvo")}</p>
          {kod && (
            <div className="mt-4 rounded-2xl bg-deca-sunce-100 p-4">
              <p className="text-sm text-deca-sunce-ink">{t("kod_naslov")}</p>
              <p className="mt-1 text-3xl font-extrabold tracking-widest tabular-nums text-deca-nebo-600">
                {kod}
              </p>
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Dugme href="/prijatelji" naslov={t("dugme_prijatelji")} broj={brojPrijatelja} boja="bg-deca-slezova-600" />
          <Dugme href="/profil" naslov={t("dugme_profil")} boja="bg-deca-more-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SareniNaslov tekst={t("pozdrav", { pseudonim })} />

      {/* Dete sa roditeljem: status i na šta se čeka (deca čl. 4c poslednji stav). */}
      {!deteKola && status && (
        <OznakaStatusa varijanta="kartica" status={status} naStaSeCeka={naStaSeCeka} />
      )}

      {/* POEN kao veliki broj — ne iza klika. Dete pita „koliko imam", a ne „gde je
          moj zapis"; odgovor mora da stoji na ekranu.

          🔴 Broj ide kroz `.broj-kartica` (globals.css), ne kroz tvrdu klasu za
          veličinu. Sa `text-6xl` se „1.000.000 POEN" na telefonu od 320 px SEČE —
          strana ne skroluje vodoravno, pa dete vidi „1.000.0". Roditelj po pravilu
          prepisuje okrugle iznose, dakle to nije rubni slučaj. */}
      <section className="broj-kartica rounded-3xl border-4 border-deca-sunce-400 bg-white p-6 text-center shadow-sm">
        <p
          className="broj-kartica-vrednost mt-1 font-extrabold text-deca-nebo-600"
          style={{ ["--znakova" as string]: String(poen.toLocaleString("sr-RS").length) }}
        >
          {poen.toLocaleString("sr-RS")}
        </p>
        <p className="text-base font-bold text-deca-nebo-600">POEN</p>
        {/* „500 na čekanju" stoji uz sam broj: dete tako vidi koliko mu prijatelja
            još nema roditelja koji je redovan član (čl. 14b st. 2).

            🔴 Ovo je najvažnija rečenica na ekranu i bila je ispisana bojom sa
            odnosom 1,98 : 1, dakle praktično nevidljiva. Sada je u žutoj kartici
            sa tamnim tekstom (7,4 : 1) — akcenat „čeka te" u celom prostoru. */}
        {poenNaCekanju > 0 && (
          <p className="mt-3 inline-block rounded-xl bg-deca-sunce-100 px-3 py-2 text-base font-semibold text-deca-sunce-ink">
            {t("na_cekanju", { iznos: poenNaCekanju })}
          </p>
        )}
        {/* Prepis stoji uz sam broj, jer dete traži POEN tu — ne u meniju. Uslov
            je da je roditelj preuzeo nalog (čl. 4c); potvrda roditelja se čeka
            samo za UPIS iz prijateljstava, ne i za prepis (čl. 14). */}
        {deteKola && (
          <div>
            <Link
              href="/novcanik"
              className="meta-dete mt-3 rounded-full bg-deca-slezova-600 px-6 py-3 text-base font-bold text-white transition hover:opacity-90"
            >
              {t("dugme_prepis")}
            </Link>
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Boja od sada pripada ODREDIŠTU, ne položaju u nizu — pijaca je uvek
            korala, prijatelji uvek slezova, poruke uvek more. Detetu koje sporo
            čita boja je brža od reči, ali samo ako se ne menja. */}
        {deteKola && <Dugme href="/pijaca/novi-oglas" naslov={t("dugme_nov_oglas")} boja="bg-deca-korala-600" />}
        <Dugme href="/profil/oglasi" naslov={t("dugme_moji_oglasi")} broj={mojihOglasa} boja="bg-deca-trava-600" />
        <Dugme href="/prijatelji" naslov={t("dugme_prijatelji")} broj={brojPrijatelja} boja="bg-deca-slezova-600" />
        <Dugme href="/poruke" naslov={t("dugme_poruke")} boja="bg-deca-more-600" />
      </div>

      {/* Kartica škole — ovo je mesto na kome ceo mehanizam uspeva ili pada.
          Ne tabela od hiljadu redova nego JEDNA rečenica koju dete prepričava kod
          kuće: „našoj školi fali troje do šestog mesta". Ranglista deci ne daje
          ništa novo — ona postojećoj želji da pripadaju daje pravac. */}
      <SkolaKartica skola={skola} t={tSkole} />

      <div>
        <label htmlFor="pretraga-oglasa" className="sr-only">
          {t("pretraga")}
        </label>
        <input
          id="pretraga-oglasa"
          type="search"
          value={pretraga}
          onChange={(e) => setPretraga(e.target.value)}
          placeholder={t("pretraga")}
          className="w-full rounded-full border-[3px] border-deca-more-400 bg-white px-5 py-3 text-base outline-none focus:border-deca-more-600"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-kolo-text">{t("oglasi_naslov")}</h2>
        {vidljivi.length === 0 ? (
          <p className="rounded-kartica border border-kolo-border bg-kolo-surface p-6 text-center text-base text-kolo-muted shadow-kartica">
            {t("oglasi_prazno")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {vidljivi.map((o, i) => (
              <Link
                key={o.id}
                href={`/pijaca/${o.id}`}
                className={`overflow-hidden rounded-3xl border-[3px] bg-white shadow-sm transition hover:shadow-md ${BOJE_DECE[i % BOJE_DECE.length].okvir}`}
              >
                <div className="flex h-40 items-center justify-center bg-kolo-bg">
                  {o.imaSliku ? (
                    // Slika je za dete koje tek čita sadržaj, ne ukras; ime linka
                    // ionako nosi naslov oglasa, pa slika ostaje bez svog imena da
                    // se naslov ne bi čitao dvaput.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/pijaca/slika/${o.id}/0`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-kolo-muted">{t("bez_slike")}</span>
                  )}
                </div>
                <div className="space-y-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate font-medium text-kolo-text">{o.naslov}</p>
                    {o.cena !== null && (
                      <span className="shrink-0 rounded-full bg-kolo-bg px-2 py-0.5 text-sm font-semibold tabular-nums text-kolo-text">
                        {o.cena.toLocaleString("sr-RS")}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-kolo-muted">{o.opis}</p>
                  <p className="text-sm text-kolo-muted">{o.oglasivac}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <DecjaPricaonica mojId={mojId} inicijalno={chatInicijalno} uvidTekst={tDeca("uvid_obavestenje")} />

      {/* „Ovo nije moj roditelj" (deca čl. 4e st. 1). Na dnu, ne u sredini igre:
          dete mu se vraća kad mu stigne obaveštenje o preuzimanju naloga (čl. 4b). */}
      <PrijavaRoditeljstva deteId={mojId} roditelji={roditelji} varijanta="dete" />
    </div>
  );
}

function Dugme({
  href,
  naslov,
  broj,
  boja,
}: {
  href: string;
  naslov: string;
  broj?: number;
  /** Puna Tailwind klasa podloge (`bg-deca-*-600`) — ne sme se sastavljati. */
  boja: string;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[6rem] flex-col items-center justify-center gap-1 rounded-3xl px-3 py-5 text-center text-base font-bold text-white shadow-sm transition active:scale-[0.98] ${boja}`}
    >
      <span>{naslov}</span>
      {broj !== undefined && <span className="text-2xl font-extrabold tabular-nums">{broj}</span>}
    </Link>
  );
}

/**
 * Dečja Pričaonica.
 *
 * Ista ruta `/api/chat` kao kod odraslih — soba se izvodi iz toga ko je prijavljen,
 * ne bira se parametrom. Zato dete ovde ne može da vidi sobu odraslih ni da napiše
 * u nju, bez obzira šta pošalje.
 *
 * Jedna soba za svu decu, ali **svako vidi samo poruke svojih prijatelja**
 * (čl. 18 st. 3). Posledica koja se dobija besplatno: kad su svi učesnici međusobno
 * prijatelji, sam od sebe nastaje grupni razgovor.
 *
 * 🔴 NEMA odgovora sa citatom. Citat bi pokazao tekst osobe koju čitalac ne poznaje
 * i time zaobišao filter. Ne dodavati citiranje.
 */
function DecjaPricaonica({
  mojId,
  inicijalno,
  uvidTekst,
}: {
  mojId: string;
  inicijalno: Poruka[];
  /** Rečenica o tome ko čita razgovore (čl. 9) — stoji u zaglavlju sobe. */
  uvidTekst: string;
}) {
  const t = useTranslations("decjaPocetna");
  const [poruke, setPoruke] = useState<Poruka[]>(inicijalno);
  const [tekst, setTekst] = useState("");
  const [salje, setSalje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const spisak = useRef<HTMLDivElement | null>(null);
  /** Da li je dete gledalo dno sobe pre nego što je stigla nova poruka. */
  const bioPriDnu = useRef(true);

  useEffect(() => {
    const id = setInterval(async () => {
      const el = spisak.current;
      bioPriDnu.current = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 80 : true;
      try {
        const res = await fetch("/api/chat?limit=50", { cache: "no-store" });
        if (res.ok) setPoruke(await res.json());
      } catch {
        /* tiho — soba se osvežava sledeći put */
      }
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  /**
   * 🔴 Skroluje se SAMO soba, i samo ako je dete već bilo pri njenom dnu.
   *
   * Ranije je stajao `scrollIntoView`, koji pomera sve skrolabilne pretke —
   * uključujući glavni okvir stranice. Svaka poruka koja stigne (soba se pita na
   * 10 sekundi) trgnula bi celu stranu na dno, i kad dete gleda oglase gore. Za
   * dete sa ADHD-om to je prekid pažnje svakih deset sekundi.
   */
  useEffect(() => {
    const el = spisak.current;
    if (el && bioPriDnu.current) el.scrollTop = el.scrollHeight;
  }, [poruke.length]);

  const posalji = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const sadrzaj = tekst.trim();
      if (!sadrzaj) return;
      setSalje(true);
      setGreska(null);
      bioPriDnu.current = true;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: sadrzaj }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
        setTekst("");
        setPoruke((p) => [...p, data]);
      } catch (err) {
        setGreska(err instanceof Error ? err.message : t("greska_slanje"));
      } finally {
        setSalje(false);
      }
    },
    [tekst, t],
  );

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-4 shadow-kartica">
      <h2 className="text-lg font-semibold text-kolo-text">{t("pricaonica_naslov")}</h2>
      <p className="mt-0.5 text-sm text-kolo-muted">{t("pricaonica_opis")}</p>
      {/* Rečenica o roditeljskom uvidu (čl. 9) stoji OVDE, a ne u sredini početne
          strane između kartice škole i oglasa. Tamo je bila najsitniji tekst na
          ekranu i van svakog konteksta; dete je treba tačno kad piše poruku. */}
      <p className="mt-2 rounded-xl bg-kolo-bg px-3 py-2 text-sm text-kolo-muted">{uvidTekst}</p>

      <div
        ref={spisak}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="mt-3 max-h-72 overflow-y-auto rounded-xl bg-kolo-bg p-3"
      >
        {poruke.length === 0 ? (
          <p className="py-6 text-center text-base text-kolo-muted">{t("pricaonica_prazno")}</p>
        ) : (
          <ul className="space-y-2">
            {poruke.map((p) => {
              const moja = p.userId === mojId;
              return (
                <li key={p.id} className={moja ? "text-right" : ""}>
                  {/* 🔴 Sopstvena poruka NE nosi ime. Dete zna ko je, a strana i boja
                      oblačića to već govore; ime je tu samo stajalo kao red teksta
                      koji poslednju poruku lepi uz polje za kucanje. Ime tuđe poruke
                      ostaje — ono jeste podatak, jer u sobi piše više prijatelja. */}
                  {!moja && <span className="text-sm text-kolo-muted">{p.pseudonim}</span>}
                  <p
                    className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 text-base ${
                      moja
                        ? "bg-deca-slezova-600 text-white"
                        : "border border-kolo-border bg-white text-kolo-text"
                    }`}
                  >
                    {p.content}
                  </p>
                  {/* Prijava poruke je UKLONJENA iz dečje sobe (odluka vlasnika,
                      04.09.2026). Dugme je stajalo ovde od 17.08. i vodilo je u
                      admin tab „Prijave"; taj red čekanja nema ko da rešava, pa je
                      obećanje koje ekran ne može da ispuni. Ista ruta i dalje radi
                      u sobi odraslih. Vidi `POST /api/chat/[id]/prijavi`. */}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {greska && (
        <p role="alert" className="mt-2 text-base text-kolo-danger">
          {greska}
        </p>
      )}

      <form onSubmit={posalji} className="mt-3 flex gap-2">
        <label htmlFor="decja-poruka" className="sr-only">
          {t("pricaonica_placeholder")}
        </label>
        <input
          id="decja-poruka"
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          maxLength={1000}
          enterKeyHint="send"
          placeholder={t("pricaonica_placeholder")}
          className="min-w-0 flex-1 rounded-xl border border-kolo-border px-4 py-3 text-base outline-none focus:border-deca-more-600"
        />
        <button
          type="submit"
          disabled={salje || !tekst.trim()}
          className="meta-dete shrink-0 rounded-full bg-deca-korala-600 px-6 py-3 text-base font-bold text-white transition disabled:opacity-50"
        >
          {t("posalji")}
        </button>
      </form>
    </section>
  );
}

/**
 * Kartica škole na dečjoj početnoj.
 *
 * 🔴 Namerno JEDNA rečenica, ne tabela. Nacionalna lista je apstraktna („sedmi smo
 * u Srbiji") i služi ponosu; ono što tera na akciju je koliko FALI do sledećeg
 * mesta — i to je jedini broj koji dete odnese kući. Tabela sa hiljadu škola živi
 * na `/skole`, iza klika.
 *
 * Dete bez izabrane škole vidi poziv da je izabere: bez ovoga polje ostaje
 * neotkriveno, jer se profil retko otvara.
 */
function SkolaKartica({
  skola,
  t,
}: {
  skola: KarticaSkole | null;
  t: (kljuc: string, vrednosti?: Record<string, string | number>) => string;
}) {
  if (!skola) {
    return (
      <section className="rounded-2xl border-[3px] border-deca-trava-400 bg-white p-5 text-center">
        <p className="text-base text-kolo-muted">{t("kartica_bez_skole")}</p>
        <Link
          href="/profil"
          className="meta-dete mt-3 rounded-full bg-deca-trava-600 px-6 py-3 text-base font-bold text-white"
        >
          {t("kartica_dugme")}
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border-[3px] border-deca-trava-400 bg-white p-5">
      <p className="text-sm font-semibold text-kolo-muted">{t("kartica_naslov")}</p>
      <Link
        href={`/skole/${encodeURIComponent(skola.sifra)}`}
        className="mt-1 block text-lg font-extrabold text-kolo-text hover:underline"
      >
        {skola.naziv}
      </Link>
      <p className="text-sm text-kolo-muted">{skola.mesto}</p>

      {/* Škola ulazi na listu tek sa prvim uključenim detetom (vidi `samoSaDecom`).
          Dok čeka roditelja, dete gleda svoju školu van poretka — a ta rečenica je
          upravo poziv da roditelja dovede. */}
      {skola.mestoSkole === null ? (
        <p className="mt-3 text-base font-semibold text-deca-korala-600">{t("kartica_nije_na_listi")}</p>
      ) : (
        <>
          <p className="mt-3 text-base font-semibold text-deca-korala-600">
            {t("mesto_po_broju", { mesto: skola.mestoSkole })}{" "}
            <span className="font-normal text-kolo-muted">
              {t("od_ukupno", { ukupno: skola.ukupnoSkola })}
            </span>
          </p>

          {skola.doSledecegMesta === null ? (
            <p className="mt-1 text-base font-bold text-deca-slezova-600">{t("prvo_mesto")}</p>
          ) : (
            <p className="mt-1 text-base font-bold text-deca-slezova-600">
              {t("fali_do", { broj: skola.doSledecegMesta, mesto: skola.mestoSkole - 1 })}
            </p>
          )}
        </>
      )}

      {skola.mojeMesto !== null && (
        <p className="mt-1 text-sm text-kolo-muted">{t("kartica_ti", { mesto: skola.mojeMesto })}</p>
      )}
    </section>
  );
}
