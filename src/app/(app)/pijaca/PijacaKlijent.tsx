"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStanjeUAdresi, upisiUAdresu } from "@/hooks/useStanjeUAdresi";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import SlikaOglasa from "@/components/SlikaOglasa";
import Pseudonim from "@/components/Pseudonim";
import CategoryChips from "@/components/CategoryChips";
import { formatCenaGlavni, prikaziJedinicuCene } from "@/lib/cena-oglas";
import { KATEGORIJE, kategorijaKljuc, kategorijaEmoji } from "@/lib/kategorije";
import { koordinateZaMesto, udaljenostKm, type Koordinate } from "@/lib/udaljenost";
import { dogadjaj } from "@/lib/analitika";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Segmenti from "@/components/ui/Segmenti";

interface Listing {
  id: string;
  title: string;
  description: string;
  tip: string;
  cenaTip: string;
  price: number | null;
  cenaDo: number | null;
  category: string;
  slike: number;
  location: string | null;
  createdAt: string;
  sellerId: string;
  /**
   * `null` kad posmatrač pseudonim ne sme da vidi: dete sa roditeljem oglase vidi
   * bez pseudonima oglašivača, osim oglasa svojih prijatelja (Pravilnik o učešću
   * dece čl. 5 st. 1 t. 2). Odluku donosi server.
   */
  sellerPseudonim: string | null;
  /** Oglašivač je prijatelj posmatrača-deteta (deca čl. 32) — dete sa roditeljem mu piše. */
  sellerPrijatelj?: boolean;
  sellerVerified: boolean;
  /** Oglašivač je maloletan korisnik — pečat i objašnjenje su drugi (deca čl. 19, 24). */
  sellerMaloletan: boolean;
  /** Oglas u ime odobrenog gazdinstva (Pravilnik o gazdinstvima čl. 18 st. 2). */
  domace?: boolean;
}

interface Props {
  listings: Listing[];
  isVerified: boolean;
  // Da li je posetilac prijavljen. Bez ovoga je dugme na kartici nudilo
  // verifikaciju i onome ko još nema nalog — korak koji ne može ni da počne.
  prijavljen?: boolean;
  /** Posmatrač je maloletan — dugme na kartici bira se po dečjim pravilima. */
  posmatracMaloletan?: boolean;
  /** Posmatrač je dete sa roditeljem — piše samo prijateljima (deca čl. 5 st. 1 t. 2). */
  deteSaRoditeljem?: boolean;
  /**
   * Dete Kola sme da piše drugoj deci (deca čl. 22). Dete sa roditeljem piše samo
   * prijateljima (`sellerPrijatelj`), dete na čekanju nikome.
   *
   * 🔴 Dugme se NE bira po `isVerified`: maloletni nalog je trajno neverifikovan
   * (deca čl. 29 st. 2), pa je detetu na svakoj kartici stajao poziv da postavi svoj oglas
   * umesto dugmeta „Kontaktiraj" — iako mu ruta razgovor dozvoljava.
   */
  detePise?: boolean;
  /** Prekidač iz deca čl. 20 st. 2 — bez njega dete ne piše punoletnim članovima. */
  deteSmeSaOdraslima?: boolean;
  // Predizabrane kategorije iz URL-a (?kat=slug1,slug2) — validirane na serveru.
  initialKat?: string[];
  // Kategorije koje ulogovani korisnik prati (za čip „Samo praćene").
  pracene?: string[];
  // Lokacija iz profila ulogovanog korisnika — početna referenca za udaljenost.
  mojaLokacija?: string | null;
}

export default function PijacaKlijent({
  listings,
  isVerified,
  prijavljen = true,
  posmatracMaloletan = false,
  detePise = false,
  deteSaRoditeljem = false,
  deteSmeSaOdraslima = false,
  initialKat = [],
  pracene = [],
  mojaLokacija = null,
}: Props) {
  const t = useTranslations("pijaca");
  const router = useRouter();
  // Filteri žive u adresi (vidi `useStanjeUAdresi`): „nazad" sa oglasa vraća
  // isti izbor — tab, pretragu, sort, cenu i mesta — a ne celu Pijacu iznova.
  const [tipIzAdrese, postaviTip] = useStanjeUAdresi("tip", "PONUDA");
  const tipPrikaza: "PONUDA" | "POTRAZNJA" = tipIzAdrese === "POTRAZNJA" ? "POTRAZNJA" : "PONUDA";
  const setTipPrikaza = (v: "PONUDA" | "POTRAZNJA") => postaviTip(v);
  const [selektovaneKat, setSelektovaneKat] = useState<string[]>(initialKat);
  const [pretraga, setPretraga] = useStanjeUAdresi("q");
  const [sort, setSort] = useStanjeUAdresi("sort", "novo");
  const [minCena, setMinCena] = useStanjeUAdresi("od");
  const [maxCena, setMaxCena] = useStanjeUAdresi("do");
  const [showCena, setShowCena] = useState(false);
  const [showSort, setShowSort] = useState(false);
  // Filter lokacije: multi-select lokacija iz samih oglasa; prazan izbor = sve lokacije.
  const [showLokacija, setShowLokacija] = useState(false);
  const searchParams = useSearchParams();
  const [lokacijeIzabrane, postaviLokacije] = useState<string[]>(() => {
    // Isto čitanje kao u `useStanjeUAdresi` (server: kontekst, klijent: adresa).
    const params =
      typeof window === "undefined" ? searchParams : new URLSearchParams(window.location.search);
    const mesto = params.get("mesto");
    return mesto ? mesto.split("|").filter(Boolean) : [];
  });
  const setLokacijeIzabrane = useCallback((next: string[]) => {
    postaviLokacije(next);
    upisiUAdresu({ mesto: next.length > 0 ? next.join("|") : null });
  }, []);
  // Blok čipova kategorija je sklopiv (dugme-strelica desno od tabova).
  // Otvoren je odmah samo kad URL već nosi izabrane kategorije (?kat=).
  const [showKategorije, setShowKategorije] = useState(initialKat.length > 0);
  const [kontaktLoadingId, setKontaktLoadingId] = useState<string | null>(null);
  // „Samo DOMAĆE" — oglasi odobrenih članova gazdinstava (oznaka se izvodi, `jeDomace`).
  const [samoDomace, setSamoDomace] = useState(false);
  // Na telefonu su filteri iza dugmeta „Filteri (n)", pretraga ostaje vidljiva.
  const [filteriOtvoreni, setFilteriOtvoreni] = useState(false);

  // Stanje filtera živi u URL-u (?kat=slug1,slug2) — link je deljiv, a SSR
  // otvara stranicu sa predizabranim čipovima. replaceState ne okida novu
  // server navigaciju (filtriranje je ionako klijentsko).
  const azurirajKategorije = useCallback((next: string[]) => {
    setSelektovaneKat(next);
    const params = new URLSearchParams(window.location.search);
    if (next.length > 0) params.set("kat", next.join(","));
    else params.delete("kat");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, []);

  // „Samo praćene" je aktivno kad je izbor identičan skupu praćenih kategorija.
  const samoPraceneAktivno =
    pracene.length > 0 &&
    selektovaneKat.length === pracene.length &&
    pracene.every((k) => selektovaneKat.includes(k));

  // Filtriranje + sortiranje se računa SAMO kad se promene ulazi — ne na svaki
  // render (npr. otvaranje dropdown-a `showKat`/`showCena` ili kontakt-loading
  // više ne preračunava i ne presortirava celu listu).
  // Brojači za prekidač Ponude | Potražnja (nezavisno od ostalih filtera).
  const brojPonuda = useMemo(() => listings.filter((l) => l.tip !== "POTRAZNJA").length, [listings]);
  const brojPotraznja = useMemo(() => listings.filter((l) => l.tip === "POTRAZNJA").length, [listings]);
  const jePotraznja = tipPrikaza === "POTRAZNJA";

  // Brojači po kategoriji za čipove — aktivni oglasi tekućeg taba (Ponude/Potražnja).
  const brojaciKat = useMemo(() => {
    const brojaci: Record<string, number> = Object.fromEntries(KATEGORIJE.map((k) => [k, 0]));
    for (const l of listings) {
      if (jePotraznja ? l.tip !== "POTRAZNJA" : l.tip === "POTRAZNJA") continue;
      brojaci[l.category] = (brojaci[l.category] ?? 0) + 1;
    }
    return brojaci;
  }, [listings, jePotraznja]);

  // Koordinate lokacije iz profila (centar opštine) — samo za informativni
  // prikaz udaljenosti na kartici; null kad lokacija nije zadata/prepoznata.
  const refKoord = useMemo(() => koordinateZaMesto(mojaLokacija), [mojaLokacija]);

  // Lokacije za padajući meni — izvedene iz aktivnih oglasa tekućeg taba,
  // sa brojem oglasa po lokaciji, sortirane abecedno.
  const lokacijeOpcije = useMemo(() => {
    const brojaci = new Map<string, number>();
    for (const l of listings) {
      if (jePotraznja ? l.tip !== "POTRAZNJA" : l.tip === "POTRAZNJA") continue;
      const lok = l.location?.trim();
      if (!lok) continue;
      brojaci.set(lok, (brojaci.get(lok) ?? 0) + 1);
    }
    return [...brojaci.entries()].sort((a, b) => a[0].localeCompare(b[0], "sr"));
  }, [listings, jePotraznja]);

  const toggleLokacija = useCallback(
    (lok: string) =>
      setLokacijeIzabrane(
        lokacijeIzabrane.includes(lok)
          ? lokacijeIzabrane.filter((x) => x !== lok)
          : [...lokacijeIzabrane, lok],
      ),
    [lokacijeIzabrane, setLokacijeIzabrane],
  );

  const filtrirani = useMemo(() => {
    return listings
      .filter((l) => {
        // Kod potražnje oglasi imaju tip POTRAZNJA; ponude su sve ostalo (uklj. legacy bez tip-a).
        if (jePotraznja ? l.tip !== "POTRAZNJA" : l.tip === "POTRAZNJA") return false;
        // Multi-select kategorije, OR logika: prazan izbor = sve kategorije.
        if (selektovaneKat.length > 0 && !selektovaneKat.includes(l.category)) return false;
        if (pretraga && !l.title.toLowerCase().includes(pretraga.toLowerCase())) return false;
        // „Po dogovoru" (price = null) ne ulazi u numerički filter cene.
        if (minCena && (l.price == null || l.price < Number(minCena))) return false;
        if (maxCena && (l.price == null || l.price > Number(maxCena))) return false;
        // Multi-select lokacije, OR logika: prazan izbor = sve lokacije.
        if (lokacijeIzabrane.length > 0 && !lokacijeIzabrane.includes(l.location?.trim() ?? "")) return false;
        if (samoDomace && !l.domace) return false;
        return true;
      })
      .sort((a, b) => {
        // „Po dogovoru" oglasi idu na kraj pri sortiranju po ceni.
        if (sort === "jeftino") return (a.price ?? Infinity) - (b.price ?? Infinity);
        if (sort === "skupo") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [listings, jePotraznja, selektovaneKat, pretraga, sort, minCena, maxCena, lokacijeIzabrane, samoDomace]);

  // Razmenu članovi dogovaraju međusobno (obligaciono pravo); Protokol ne posreduje.
  // Pijaca samo povezuje kupca i prodavca — otvara 1-na-1 razgovor.
  // useCallback: stabilna referenca → memo-izovane kartice se ne re-renderuju
  // samo zato što se roditelj iznova iscrtao.
  const handleKontakt = useCallback(async (oglasId: string, sellerId: string) => {
    setKontaktLoadingId(oglasId);
    const res = await fetch("/api/poruke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `oglasId` služi samo prikazu povoda u razgovoru (putanja doprinosa
      // razmeni, koja je beležila upit, ukinuta je setom 4.8.0).
      body: JSON.stringify({ userId: sellerId, oglasId }),
    });
    // Odbijen razgovor (npr. korisnik je danas već pokrenuo dozvoljen broj novih
    // razgovora) vodi na detalj oglasa, gde stoji razlog — ne ćuti.
    if (!res.ok) { setKontaktLoadingId(null); router.push(`/pijaca/${oglasId}`); return; }
    dogadjaj("kontakt_oglasivaca", { izvor: "lista" });
    const data = await res.json();
    router.push(`/poruke?k=${data.konverzacijaId}`);
  }, [router]);

  const brojAktivnihFiltera =
    (samoDomace ? 1 : 0) + (lokacijeIzabrane.length > 0 ? 1 : 0) + (minCena || maxCena ? 1 : 0) + (sort !== "novo" ? 1 : 0);

  return (
    <div className="space-y-5 pb-24 md:pb-0">
      {/* Zaglavlje. Objava je otvorena i neverifikovanom (Pravilnik 4.1.1 čl. 16
          st. 5), pa dugme vodi na formu i njemu — samo bez potražnje, koju ne sme
          da objavi. Objašnjenje šta važi za njega stoji ispod.

          🔴 Dugme se prikazuje samo PRIJAVLJENOM. Gostu je stajalo kao i svima,
          a vodilo je na `/pijaca/novi-oglas`, gde ga proxy odbija na `/login` —
          poziv na radnju koju ne može da izvrši. Njemu umesto dugmeta ide traka
          ispod, koja ga zove tamo gde stvarno može da nastavi: na pridruživanje. */}
      <div className="space-y-1">
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h1 className="kolo-naslov">{t("naslov")}</h1>
          </div>
          {prijavljen && (
            <Link
              href={isVerified && jePotraznja ? "/pijaca/novi-oglas?tip=potraznja" : "/pijaca/novi-oglas"}
              className={klaseDugmeta() + " hidden md:inline-flex shrink-0"}
            >
              {isVerified && jePotraznja ? t("nova_potraznja") : t("novi_oglas")}
            </Link>
          )}
        </div>
        {!isVerified && prijavljen && (
          <Link
            href="/pijaca/novi-oglas"
            className="block rounded-kontrola bg-kolo-green-100 text-kolo-green-900 text-sm font-semibold px-4 py-2.5 hover:bg-kolo-green-200 transition-colors"
          >
            {t("traka_neverifikovan")} →
          </Link>
        )}
        {/* Gostu poziv na pridruživanje stoji jednom — u boksu sa dva dugmeta
            iznad (src/app/pijaca/page.tsx); ista rečenica se ovde ne ponavlja. */}
      </div>

      {/* Prekidač: Ponude | Potražnja + dugme-strelica koje otvara/zatvara kategorije */}
      <div className="flex items-center gap-2">
        <Segmenti
          oznaka={t("naslov")}
          vrednost={tipPrikaza}
          onPromena={setTipPrikaza}
          opcije={[
            { vrednost: "PONUDA" as const, oznaka: <>{t("tab_ponude")} <span className="font-normal">({brojPonuda})</span></> },
            { vrednost: "POTRAZNJA" as const, oznaka: <>{t("tab_potraznja")} <span className="font-normal">({brojPotraznja})</span></> },
          ]}
        />

        {/* Strelica na dole — otvara/zatvara čipove kategorija. Kad je blok
            zatvoren a filter aktivan, dugme ostaje zeleno sa brojem izabranih. */}
        <button
          type="button"
          onClick={() => setShowKategorije((v) => !v)}
          aria-expanded={showKategorije}
          aria-label={t("kategorija_filter")}
          className={`inline-flex min-h-10 items-center gap-1 px-3 rounded-kontrola border bg-kolo-surface transition-colors ${
            selektovaneKat.length > 0
              ? "border-kolo-green-700 text-kolo-green-700"
              : "border-kolo-border text-kolo-muted hover:border-kolo-green-700 hover:text-kolo-green-700"
          }`}
        >
          {selektovaneKat.length > 0 && (
            <span className="text-xs font-semibold">{selektovaneKat.length}</span>
          )}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${showKategorije ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Čip filter kategorija — sklopiv blok ispod tabova, iznad grida.
          Multi-select sa OR logikom; stanje u URL-u (?kat=). */}
      {showKategorije && (
        <CategoryChips
          selected={selektovaneKat}
          onChange={azurirajKategorije}
          counts={brojaciKat}
          leadingChip={
            pracene.length > 0
              ? {
                  label: t("samo_pracene"),
                  active: samoPraceneAktivno,
                  onClick: () => azurirajKategorije(samoPraceneAktivno ? [] : [...pracene]),
                }
              : undefined
          }
        />
      )}

      {/* Filteri: levo padajuci meniji (cena + sortiranje), desno pretraga (pola sirine) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Telefon: jedno dugme otvara filtere (pre prvog oglasa trošili su ~230 px). */}
          <button
            type="button"
            onClick={() => setFilteriOtvoreni((v) => !v)}
            aria-expanded={filteriOtvoreni}
            className={`sm:hidden inline-flex min-h-10 items-center justify-center gap-2 rounded-kontrola border bg-kolo-surface px-4 text-sm font-semibold transition-colors ${
              brojAktivnihFiltera > 0 ? "border-kolo-green-700 text-kolo-green-700" : "border-kolo-border text-kolo-text"
            }`}
          >
            {t("filteri")}{brojAktivnihFiltera > 0 ? ` (${brojAktivnihFiltera})` : ""}
          </button>
          {/* LEVO — padajuci meniji */}
          <div className={`${filteriOtvoreni ? "flex" : "hidden"} sm:flex gap-2 flex-wrap items-center`}>
            {!jePotraznja && (
              <button
                type="button"
                onClick={() => setSamoDomace((v) => !v)}
                aria-pressed={samoDomace}
                className={`min-h-10 px-3 rounded-kontrola border text-sm font-medium transition-colors ${
                  samoDomace ? "bg-kolo-green-700 border-kolo-green-700 text-white" : "bg-kolo-surface border-kolo-border text-kolo-text hover:border-kolo-green-500"
                }`}
              >
                {t("samo_domace")}
              </button>
            )}
            {/* Lokacija — dropdown sa multi-select listom lokacija iz oglasa.
                Podrazumevano „Sve lokacije" (prazan izbor = bez filtriranja). */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLokacija((v) => !v)}
                className={`min-h-10 px-3 rounded-kontrola border bg-kolo-surface text-sm transition-colors ${
                  lokacijeIzabrane.length > 0
                    ? "border-kolo-green-700 text-kolo-green-900 font-medium"
                    : "border-kolo-border text-kolo-text hover:border-kolo-green-700"
                }`}
              >
                {lokacijeIzabrane.length === 0
                  ? t("lokacija_sve")
                  : lokacijeIzabrane.length === 1
                    ? lokacijeIzabrane[0].split(",")[0].trim()
                    : `${lokacijeIzabrane[0].split(",")[0].trim()} +${lokacijeIzabrane.length - 1}`}
              </button>
              {showLokacija && (
                <div className="absolute z-20 left-0 mt-1 min-w-[14rem] max-h-72 overflow-y-auto bg-kolo-surface rounded-kontrola border border-kolo-border shadow-lg p-1">
                  <button
                    type="button"
                    onClick={() => setLokacijeIzabrane([])}
                    className={`block w-full min-h-9 text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      lokacijeIzabrane.length === 0
                        ? "bg-kolo-green-100 text-kolo-green-900 font-medium"
                        : "text-kolo-text hover:bg-kolo-bg"
                    }`}
                  >
                    {t("lokacija_sve")}
                  </button>
                  {lokacijeOpcije.map(([lok, broj]) => {
                    const izabrana = lokacijeIzabrane.includes(lok);
                    return (
                      <button
                        key={lok}
                        type="button"
                        onClick={() => toggleLokacija(lok)}
                        className={`flex items-center justify-between gap-2 w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          izabrana ? "bg-kolo-green-100 text-kolo-green-900 font-medium" : "text-kolo-text hover:bg-kolo-bg"
                        }`}
                      >
                        <span className="truncate">
                          {izabrana && <span className="mr-1.5">✓</span>}
                          {lok}
                        </span>
                        <span className="shrink-0 text-xs">({broj})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cena — dropdown sa min/max. Kod potražnje nema iznosa, pa se sakriva. */}
            {!jePotraznja && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCena((v) => !v)}
                className={`min-h-10 px-3 rounded-kontrola border bg-kolo-surface text-sm transition-colors ${
                  minCena || maxCena
                    ? "border-kolo-green-700 text-kolo-green-900 font-medium"
                    : "border-kolo-border text-kolo-text hover:border-kolo-green-700"
                }`}
              >
                {t("cena_filter")}
                {minCena || maxCena ? ` (${minCena || "0"}–${maxCena || "∞"})` : ""}
              </button>
              {showCena && (
                <div className="absolute z-20 left-0 mt-1 bg-kolo-surface rounded-kontrola border border-kolo-border shadow-lg p-3 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder={t("min_poen")}
                    aria-label={t("min_poen")}
                    value={minCena}
                    onChange={(e) => setMinCena(e.target.value)}
                    className="w-24 min-h-10 px-3 rounded-kontrola border border-kolo-border bg-kolo-surface text-sm outline-none focus:border-kolo-green-700 transition-colors"
                  />
                  <span className="text-kolo-border text-xs">—</span>
                  <input
                    type="number"
                    min={0}
                    placeholder={t("max_poen")}
                    aria-label={t("max_poen")}
                    value={maxCena}
                    onChange={(e) => setMaxCena(e.target.value)}
                    className="w-24 min-h-10 px-3 rounded-kontrola border border-kolo-border bg-kolo-surface text-sm outline-none focus:border-kolo-green-700 transition-colors"
                  />
                  {(minCena || maxCena) && (
                    <button type="button" onClick={() => { setMinCena(""); setMaxCena(""); }} className="inline-flex h-9 w-9 items-center justify-center text-sm text-kolo-muted hover:text-kolo-text">
                      ×
                    </button>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Sortiranje — dropdown (isti dizajn kao Cena), default Najnovije. Kod potražnje nema sortiranja po ceni. */}
            {!jePotraznja && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSort((v) => !v)}
                className={`min-h-10 px-3 rounded-kontrola border bg-kolo-surface text-sm transition-colors ${
                  sort !== "novo"
                    ? "border-kolo-green-700 text-kolo-green-900 font-medium"
                    : "border-kolo-border text-kolo-text hover:border-kolo-green-700"
                }`}
              >
                {t(`sort_${sort}`)}
              </button>
              {showSort && (
                <div className="absolute z-20 left-0 mt-1 min-w-[10rem] bg-kolo-surface rounded-kontrola border border-kolo-border shadow-lg p-1">
                  {(["novo", "jeftino", "skupo"] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => { setSort(val); setShowSort(false); }}
                      className={`block w-full min-h-9 text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        sort === val ? "bg-kolo-green-100 text-kolo-green-900 font-medium" : "text-kolo-text hover:bg-kolo-bg"
                      }`}
                    >
                      {t(`sort_${val}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>

          {/* DESNO — pretraga (pola sirine, pomerena desno) */}
          <input
            type="text"
            placeholder={t("pretrazi_placeholder")}
            aria-label={t("pretrazi_placeholder")}
            value={pretraga}
            onChange={(e) => setPretraga(e.target.value)}
            className={KLASE_UNOSA + " sm:w-1/2 sm:ml-auto"}
          />
        </div>
      </div>

      {/* Lista oglasa */}
      {filtrirani.length === 0 ? (
        <div className="bg-kolo-surface rounded-kartica shadow-kartica border border-kolo-border p-10 flex flex-col items-center text-center gap-2">
          <div className="text-kolo-green-500">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-kolo-text">
            {(jePotraznja ? brojPotraznja : brojPonuda) === 0
              ? t(jePotraznja ? "nema_potraznja_naslov" : "nema_oglasa_naslov")
              : t("nema_rezultata_naslov")}
          </p>
          <p className="text-sm text-kolo-muted">
            {(jePotraznja ? brojPotraznja : brojPonuda) === 0
              ? t(jePotraznja ? "nema_potraznja_opis" : "nema_oglasa_opis")
              : t("nema_rezultata_opis")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrirani.map((l, i) => (
            <OglasKartica
              key={l.id}
              oglas={l}
              isVerified={isVerified}
              prijavljen={prijavljen}
              posmatracMaloletan={posmatracMaloletan}
              detePise={detePise}
              deteSaRoditeljem={deteSaRoditeljem}
              deteSmeSaOdraslima={deteSmeSaOdraslima}
              kontaktLoading={kontaktLoadingId === l.id}
              onKontakt={handleKontakt}
              t={t}
              prioritet={i < 2}
              udaljenost={izracunajUdaljenost(refKoord, l.location)}
            />
          ))}
        </div>
      )}

      {/* Plutajuće dugme za novi oglas — uvek dostupno bez skrolovanja na vrh.
          Na mobilnom samo krug sa plusom, na širim ekranima plus + tekst.

          Uslov je PRIJAVLJEN, ne potvrđen: objava je otvorena i novom članu
          (Uslovi čl. 14 st. 2), a dok je stajalo `isVerified`, onaj kome je
          objava prvi potez sistema nije imao dugme — do forme je stizao samo
          preko zaglavlja ili zelene trake. Potražnju i dalje sme samo potvrđen
          član, pa se za ostale putanja i natpis vraćaju na običan oglas. */}
      {prijavljen && (
        <Link
          href={isVerified && jePotraznja ? "/pijaca/novi-oglas?tip=potraznja" : "/pijaca/novi-oglas"}
          aria-label={isVerified && jePotraznja ? t("nova_potraznja") : t("novi_oglas")}
          className="md:hidden fixed right-5 z-40 flex items-center justify-center w-14 h-14 bg-kolo-green-700 text-white rounded-kartica shadow-lg hover:bg-kolo-green-800 active:scale-95 transition-all"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {/* Samo ikonica: natpis nosi aria-label. Na računaru je dugme gore
              desno, pa se plutajuće ne prikazuje (jedno dugme za istu radnju). */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </Link>
      )}
    </div>
  );
}

// Zaokružena udaljenost (km) od referentnog mesta do lokacije oglasa;
// null kad referenca nije zadata ili lokacija oglasa nije prepoznata.
function izracunajUdaljenost(refKoord: Koordinate | null, lokacija: string | null): number | null {
  if (!refKoord) return null;
  const koord = koordinateZaMesto(lokacija);
  if (!koord) return null;
  return Math.round(udaljenostKm(refKoord, koord));
}

// ── Kartica oglasa ─────────────────────────────────────────────────────────────

type TFunction = ReturnType<typeof useTranslations<"pijaca">>;

const OglasKartica = memo(function OglasKartica({
  oglas,
  isVerified,
  prijavljen,
  posmatracMaloletan,
  detePise,
  deteSaRoditeljem,
  deteSmeSaOdraslima,
  kontaktLoading,
  onKontakt,
  t,
  prioritet,
  udaljenost,
}: {
  oglas: Listing;
  isVerified: boolean;
  prijavljen: boolean;
  posmatracMaloletan: boolean;
  detePise: boolean;
  deteSaRoditeljem: boolean;
  deteSmeSaOdraslima: boolean;
  kontaktLoading: boolean;
  onKontakt: (oglasId: string, sellerId: string) => void;
  t: TFunction;
  prioritet: boolean;
  udaljenost: number | null;
}) {
  // Naziv jedinice ide kroz prevod, ne kao literal: na ćirilici i ruskom je
  // „ПОЕН", pa je hardkodovana latinica ostavljala latinicu usred ćiriličnog teksta.
  const tc = useTranslations("common");

  return (
    <div className="bg-kolo-surface rounded-kartica shadow-kartica border border-kolo-border overflow-hidden flex flex-col">
      {/* Slika ili placeholder — ceo blok vodi na oglas */}
      <Link href={`/pijaca/${oglas.id}`} className="relative w-full h-[180px] bg-kolo-bg flex items-center justify-center">
        {oglas.slike > 0 ? (
          // `unoptimized` UKLONJEN: Next sad servira sliku u pravoj veličini (WebP/AVIF),
          // ne original ~1600px za okvir od 180px — glavni krivac za LCP 8.8s na mobilnom.
          // `sizes` opisuje stvarnu širinu (1 kolona mobilno, 2 desktop). Prve 2 kartice
          // (iznad pregiba) dobijaju `priority` da browser odmah povuče LCP sliku.
          <SlikaOglasa
            src={`/api/pijaca/slika/${oglas.id}/0`}
            alt={oglas.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            className="object-contain"
            priority={prioritet}
            rezerva={<span className="text-4xl" aria-hidden="true">{kategorijaEmoji(oglas.category)}</span>}
          />
        ) : (
          <span className="text-4xl">{kategorijaEmoji(oglas.category)}</span>
        )}
        <span className="absolute top-2 left-2 bg-white/90 text-kolo-muted text-xs font-medium px-2 py-0.5 rounded-lg">
          {t(`kategorija_${kategorijaKljuc(oglas.category)}`)}
        </span>
        {/* Pečat da oglašivač nije verifikovan (Uslovi čl. 18 st. 2).
            Vide ga svi kojima je vidljiv i oglas, uključujući neprijavljene.
            Ranije je stajao kao sitan tekst uz pseudonim i lako se previđao.

            🔴 Dete dobija SVOJ pečat, ne „bez potvrde". Maloletni nalog jeste
            neverifikovan i uvek će biti — u lanac potvrda ne sme da uđe (deca čl. 29 st. 2) —
            pa bi mu „bez potvrde" saopštavalo nešto što se nikad neće promeniti,
            i to rečju koja opisuje novog odraslog člana. Ono što sagovorniku
            zaista treba je da je sa druge strane dete. */}
        {/* Pečati se slažu jedan ispod drugog u gornjem desnom uglu. Oznaka
            DOMAĆE je pečat iste vrste kao „bez potvrde", samo zelen (odluka
            vlasnika 20.10.2026) — oglas u ime gazdinstva koje je pristupilo
            sistemu. Fondacija je ne jemči (Uslovi čl. 20 st. 2): ne kaže ništa o
            kvalitetu ni poreklu robe, samo da oglas stoji u ime gazdinstva. */}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5">
          {oglas.sellerMaloletan ? (
            <span className="bg-white/95 text-kolo-green-700 border-2 border-kolo-green-700 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md rotate-[-6deg]">
              {t("oznaka_dete")}
            </span>
          ) : !oglas.sellerVerified ? (
            <span className="bg-white/95 text-kolo-gold-700 border-2 border-kolo-gold-600 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md rotate-[-6deg]">
              {t("oznaka_neverifikovan")}
            </span>
          ) : null}
          {oglas.domace && (
            <span
              className="bg-white/95 text-kolo-green-700 border-2 border-kolo-green-700 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md rotate-[-6deg]"
              title={t("oznaka_domace_opis")}
            >
              {t("oznaka_domace")}
            </span>
          )}
        </div>
      </Link>

      {/* Sadržaj */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            {/* Naslov oglasa je pravi naslov, da čitač ekrana skače po oglasima. */}
            <h3 className="line-clamp-2 text-sm font-semibold text-kolo-text">
              <Link href={`/pijaca/${oglas.id}`} className="hover:text-kolo-green-700 transition-colors">
                {oglas.title}
              </Link>
            </h3>
            <p className="text-xs text-kolo-muted mt-0.5 line-clamp-1">{oglas.description}</p>
          </div>
          {oglas.tip === "POTRAZNJA" ? (
            <span className="shrink-0 bg-kolo-gold-100 text-kolo-gold-700 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide self-start">
              {t("trazi_se")}
            </span>
          ) : (
            <div className="shrink-0 bg-kolo-green-100 rounded-xl px-2.5 py-1.5 text-center">
              <p className="text-base font-bold text-kolo-green-700 leading-none">
                {formatCenaGlavni(oglas, t("cena_po_dogovoru"))}
              </p>
              {prikaziJedinicuCene(oglas) && (
                <p className="text-xs text-kolo-green-700">
                  {tc("poen")}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 mt-auto pt-2 border-t border-kolo-border">
          <span className="text-xs text-kolo-muted truncate min-w-0">
            {oglas.sellerPseudonim !== null ? (
              <Pseudonim>{oglas.sellerPseudonim}</Pseudonim>
            ) : (
              <span>{t("oglasivac_skriven")}</span>
            )}
            {oglas.location && <span className="ml-1">· {oglas.location}</span>}
            {udaljenost != null && (
              <span className="ml-1 text-kolo-green-700 font-medium">· ~{udaljenost} km</span>
            )}
          </span>
          {/* Dete piše drugom detetu bezuslovno (deca čl. 22), a punoletnom članu samo
              uz roditeljski prekidač. Oglas punoletnog mu se ionako ne prikazuje
              dok prekidač stoji isključen, pa je uslov ovde druga brana, ne prva. */}
          {(posmatracMaloletan
            ? detePise
              ? oglas.sellerMaloletan || deteSmeSaOdraslima
              : deteSaRoditeljem && !!oglas.sellerPrijatelj
            // Korisnik prvi piše oglašivaču povodom oglasa, do dnevnog broja novih
            // razgovora (Uslovi čl. 14) — kartica prati detalj oglasa (odluka
            // vlasnika 22.10.2026). Granicu drži server (`/api/poruke`).
            : prijavljen) ? (
            <button
              onClick={() => onKontakt(oglas.id, oglas.sellerId)}
              disabled={kontaktLoading}
              className={`shrink-0 font-semibold text-white transition-colors disabled:opacity-60 ${
                posmatracMaloletan
                  ? "meta-dete rounded-full bg-deca-korala-600 px-4 text-sm hover:opacity-90"
                  : "min-h-10 rounded-kontrola bg-kolo-green-700 px-4 text-sm hover:bg-kolo-green-800"
              }`}
            >
              {kontaktLoading ? "..." : oglas.tip === "POTRAZNJA" ? t("javi_se") : t("kontaktiraj")}
            </button>
          ) : posmatracMaloletan ? (
            /* Detetu se NIKAD ne nudi potvrda kao izlaz — u lanac potvrda ne ulazi
               (deca čl. 29 st. 2). Ostaje istinit razlog, bez dugmeta koje ne vodi nikuda. */
            <span className="shrink-0 text-sm text-kolo-muted">
              {detePise
                ? t("dete_odrasli_kratko")
                : deteSaRoditeljem
                  ? t("dete_samo_prijatelji_kratko")
                  : t("dete_ceka_kratko")}
            </span>
          ) : (
            /* Neverifikovanom se više ne nudi verifikacija kao prvi korak: gost
               nema ni nalog, a prijavljenom je najbliži potez sopstveni oglas —
               kroz njega ga mreža i nađe (dokaz stvarnosti čl. 15 st. 7). */
            <Link
              href={prijavljen ? "/pijaca/novi-oglas" : "/registracija"}
              className="shrink-0 text-xs text-kolo-green-700 font-semibold hover:underline"
            >
              {prijavljen ? t("cta_postavi_oglas") : t("registruj_se")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
});
