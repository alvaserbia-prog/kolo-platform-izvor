"use client";

import { useState, useEffect, useRef, useCallback, memo, Suspense } from "react";
import { intlTag } from "@/lib/format";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import KorisnikAvatar from "@/components/KorisnikAvatar";
import { profilHref } from "@/lib/profil-link";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";

type Konverzacija = {
  id: string;
  drugiId: string;
  drugiPseudonim: string;
  drugiAvatar: string | null;
  poslednjaPorukaIznos: string | null;
  poslednjaPosiljacJa: boolean;
  poslednjeVreme: string;
  neprocitano: number;
};

type Poruka = {
  id: string;
  tekst: string;
  moja: boolean;
  createdAt: string;
  /** Oglas povodom kog je razgovor pokrenut — kartica stoji iznad poruke. */
  oglas?: { id: string; naslov: string; imaSliku: boolean } | null;
};

/**
 * Javi service worker-u da zatvori prikazane push notifikacije ovog razgovora
 * (tag/link = `/poruke?k=<id>`) čim ga korisnik pročita.
 *
 * OS crvenu brojku na ikonici računa iz PRIKAZANIH notifikacija, a one ne
 * nestaju same kad poruku pročitaš u aplikaciji — bez ovoga brojka ostaje.
 * No-op kad service worker ili push nisu aktivni.
 */
function zatvoriNotifikacijeKonverzacije(konvId: string) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((reg) => {
      (reg.active ?? navigator.serviceWorker.controller)?.postMessage({
        type: "zatvori-notifikacije",
        link: `/poruke?k=${konvId}`,
      });
    })
    .catch(() => {});
}

function PorukeContent() {
  const t = useTranslations("poruke");
  const router = useRouter();
  const searchParams = useSearchParams();
  const aktivnaKonvId = searchParams.get("k");

  const [konverzacije, setKonverzacije] = useState<Konverzacija[]>([]);
  const [verified, setVerified] = useState(true);
  /**
   * Maloletni nalog. Njemu se NE prikazuje rečenica o „redovnim članovima":
   * ona je za dete neistinita na svakoj reči — ono nije „nov član" koji čeka
   * potvrdu (u lanac potvrda ne ulazi, čl. 15), sme da piše svakom svom
   * prijatelju, a punoletni članovi mu se po pravilu i ne javljaju jer je
   * roditeljski prekidač podrazumevano isključen. Umesto toga dobija spisak
   * svojih prijatelja kao dugmad — što je i najbolji mogući sadržaj tog mesta.
   */
  const [maloletan, setMaloletan] = useState(false);
  const [prijatelji, setPrijatelji] = useState<{ korisnikId: string; pseudonim: string }[]>([]);
  const [poruke, setPoruke] = useState<Poruka[]>([]);
  const [drugiPseudonim, setDrugiPseudonim] = useState("");
  const [drugiId, setDrugiId] = useState("");
  const [drugiAvatar, setDrugiAvatar] = useState<string | null>(null);
  // Oglas povodom kog je razgovor otvoren, a poruka još nije napisana.
  const [povod, setPovod] = useState<{ id: string; naslov: string; imaSliku: boolean } | null>(null);
  // Modul Deca, čl. 9 st. 3: sa druge strane je dete, a razgovor čita njegov
  // roditelj. Natpis je i odvraćanje i poštenje — ko piše detetu, treba da zna
  // pred kim piše. Server ga postavlja samo punoletnom sagovorniku.
  const [roditeljCita, setRoditeljCita] = useState(false);
  /** Razgovor ugašen raskidom prijateljstva (čl. 14c) — polje za pisanje otpada. */
  const [razgovorZatvoren, setRazgovorZatvoren] = useState(false);
  const [mojAvatar, setMojAvatar] = useState<string | null>(null);
  const [mojPseudonim, setMojPseudonim] = useState("");
  const [mobilniPrikaz, setMobilniPrikaz] = useState<"lista" | "chat">("lista");
  const [tekst, setTekst] = useState("");
  const [slanje, setSlanje] = useState(false);
  const [noviKorisnik, setNoviKorisnik] = useState("");
  const [novaKonvGreska, setNovaKonvGreska] = useState("");
  const [sugestije, setSugestije] = useState<{ id: string; pseudonim: string }[]>([]);
  const [showSugestije, setShowSugestije] = useState(false);
  const [aktivniIndex, setAktivniIndex] = useState(-1);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const sugestijeRef = useRef<HTMLUListElement>(null);

  const ucitajKonverzacije = useCallback(async () => {
    const res = await fetch("/api/poruke");
    if (res.ok) {
      const data = await res.json();
      const nove: Konverzacija[] = data.konverzacije ?? [];
      // Bail-out: ako se lista nije promenila (polling na 5s), NE diraj state —
      // inače bi se cela lista konverzacija re-renderovala svakih 5s bez razloga.
      setKonverzacije((prev) => (istiKonv(prev, nove) ? prev : nove));
      if (typeof data.verified === "boolean") setVerified(data.verified);
      if (typeof data.maloletan === "boolean") setMaloletan(data.maloletan);
    }
  }, []);

  useEffect(() => {
    if (!maloletan) return;
    void (async () => {
      try {
        const res = await fetch("/api/deca/prijatelji", { cache: "no-store" });
        if (res.ok) setPrijatelji((await res.json()).prijatelji ?? []);
      } catch {
        /* tiho — spisak je prečica, razgovori rade i bez njega */
      }
    })();
  }, [maloletan]);

  const ucitajPoruke = useCallback(async (konvId: string) => {
    const res = await fetch(`/api/poruke/${konvId}`);
    if (!res.ok) return;
    const data = await res.json();
    const nove: Poruka[] = data.poruke ?? [];
    // Bail-out: ako nema novih poruka, zadrži istu referencu — time se gasi i
    // re-render svih mehurića i nasilni scroll na dno svakih 5s (vidi efekat).
    setPoruke((prev) => (istePoruke(prev, nove) ? prev : nove));
    setDrugiPseudonim(data.drugiUser?.pseudonim ?? "");
    setDrugiId(data.drugiUser?.id ?? "");
    setDrugiAvatar(data.drugiUser?.avatar ?? null);
    setMojAvatar(data.mojAvatar ?? null);
    setPovod(data.povod ?? null);
    setRoditeljCita(Boolean(data.roditeljCita));
    setRazgovorZatvoren(Boolean(data.razgovorZatvoren));
    setMojPseudonim(data.mojPseudonim ?? "");
    // GET je upravo označio primljene poruke pročitanim — osveži badge u zaglavlju.
    window.dispatchEvent(new Event("poruke-procitane"));
    // I zatvori sistemske push notifikacije ovog razgovora, da crvena brojka na
    // ikonici (desktop/PWA) padne — inače ostaje, jer notifikacija ne nestaje sama.
    zatvoriNotifikacijeKonverzacije(konvId);
  }, []);

  // Inicijalno učitavanje konverzacija
  useEffect(() => {
    ucitajKonverzacije();
  }, [ucitajKonverzacije]);

  // Učitaj poruke kad se promeni aktivna konverzacija
  useEffect(() => {
    if (aktivnaKonvId) {
      ucitajPoruke(aktivnaKonvId);
      // Deep-link (npr. „Kontaktiraj prodavca") otvara konverzaciju direktno —
      // na mobilnom prebaci na chat prikaz, inače ostaje skrivena lista.
      setMobilniPrikaz("chat");
    } else {
      setPoruke([]);
      setDrugiPseudonim("");
      setDrugiId("");
      setDrugiAvatar(null);
      setPovod(null);
    }
  }, [aktivnaKonvId, ucitajPoruke]);

  // Polling za nove poruke (5s)
  useEffect(() => {
    if (!aktivnaKonvId) return;
    const interval = setInterval(() => {
      ucitajPoruke(aktivnaKonvId);
      ucitajKonverzacije();
    }, 5000);
    return () => clearInterval(interval);
  }, [aktivnaKonvId, ucitajPoruke, ucitajKonverzacije]);

  // Scroll na dno pri novim porukama. Zbog bail-out-a u `ucitajPoruke`, `poruke`
  // menja referencu SAMO kad stvarno ima novih poruka — pa se ovo više ne okida
  // (i ne trza skrol) na svaki 5s poll bez promene.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [poruke]);

  // Stabilan handler za otvaranje konverzacije → memo-izovani redovi se ne
  // re-renderuju samo zato što se roditelj iscrtao.
  const otvoriKonv = useCallback((id: string) => {
    router.push(`/poruke?k=${id}`);
    setMobilniPrikaz("chat");
  }, [router]);

  // Zatvori sugestije klikom van
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowSugestije(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleNoviKorisnikChange(val: string) {
    setNoviKorisnik(val);
    setNovaKonvGreska("");
    setShowSugestije(true);
    setAktivniIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSugestije([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/korisnici/pretraga?q=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      setSugestije(Array.isArray(data) ? data : []);
    }, 250);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSugestije || sugestije.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAktivniIndex((prev) => {
        const next = prev < sugestije.length - 1 ? prev + 1 : 0;
        sugestijeRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktivniIndex((prev) => {
        const next = prev > 0 ? prev - 1 : sugestije.length - 1;
        sugestijeRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (aktivniIndex >= 0 && sugestije[aktivniIndex]) {
        otvoriKonverzaciju(sugestije[aktivniIndex].id);
      }
    } else if (e.key === "Escape") {
      setShowSugestije(false);
      setAktivniIndex(-1);
    }
  }

  async function otvoriKonverzaciju(userId: string) {
    setNovaKonvGreska("");
    const res = await fetch("/api/poruke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const d = await res.json();
      setNovaKonvGreska(d.error ?? "—");
      return;
    }
    const data = await res.json();
    setNoviKorisnik("");
    setSugestije([]);
    setShowSugestije(false);
    await ucitajKonverzacije();
    router.push(`/poruke?k=${data.konverzacijaId}`);
    setMobilniPrikaz("chat");
  }

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    if (!tekst.trim() || !aktivnaKonvId || slanje) return;
    setSlanje(true);
    const res = await fetch(`/api/poruke/${aktivnaKonvId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tekst }),
    });
    setSlanje(false);
    if (!res.ok) return;
    const novaPoruka: Poruka = await res.json();
    setPoruke((prev) => [...prev, novaPoruka]);
    setTekst("");
    // Povod je prešao na poruku — podsetnik iznad polja više nije potreban.
    setPovod(null);
    await ucitajKonverzacije();
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      posalji(e as unknown as React.FormEvent);
    }
  }

  // Visina ekrana poruka je FIKSNA i tačno jednaka raspoloživom prostoru — tako
  // polje za pisanje i dugme „Pošalji" uvek stoje na dnu vidljivog ekrana i NE
  // mora se skrolovati na dole da bi se do njih došlo (skroluje samo lista
  // poruka). Odbija se stvarni hrom: Header `h-14` (3.5rem) mobilno, `md:h-16` (4rem) desktop + vertikalni padding
  // `main`-a iz AppShell-a (`py-5` = 2.5rem mobilno, `md:py-6` = 3rem desktop).
  // `dvh` umesto `vh` — na mobilnom je `100vh` visina BEZ URL trake browsera, pa
  // je kutija ispadala viša od vidljivog dela ekrana i unos je bio ispod ivice.
  // Ako se promeni visina Header-a ili padding u AppShell-u, ispraviti i ovde.
  return (
    <div className="flex h-[calc(100dvh_-_6rem)] md:h-[calc(100dvh_-_7rem)] overflow-hidden rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica">
      {/* Leva tabla — lista konverzacija */}
      <div className={`w-full md:w-72 shrink-0 border-r border-kolo-border flex flex-col ${mobilniPrikaz === "chat" ? "hidden md:flex" : "flex"}`}>
        <div className="px-4 py-3 border-b border-kolo-border">
          <h1 className="text-base font-semibold text-kolo-text">{t("naslov")}</h1>
        </div>

        {/* Nova konverzacija — pretraga (samo verifikovani mogu da iniciraju) */}
        {maloletan ? (
          <div className="px-3 py-3 border-b border-kolo-border">
            <p className="text-sm font-semibold text-kolo-text">{t("dete_prijatelji_naslov")}</p>
            {prijatelji.length === 0 ? (
              <p className="mt-1 text-sm text-kolo-muted">{t("dete_prijatelji_prazno")}</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {prijatelji.map((p) => (
                  <li key={p.korisnikId}>
                    <button
                      type="button"
                      onClick={() => otvoriKonverzaciju(p.korisnikId)}
                      className="meta-dete rounded-full bg-deca-slezova-600 px-4 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      {p.pseudonim}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : !verified ? (
          <div className="px-3 py-2 border-b border-kolo-border">
            <p className="text-[11px] text-kolo-muted leading-relaxed">
              {t("neverifikovan_info")}
            </p>
          </div>
        ) : (
        <div className="px-3 py-2 border-b border-kolo-border" ref={searchWrapperRef}>
          <div className="relative">
            <input
              type="text"
              value={noviKorisnik}
              onChange={(e) => handleNoviKorisnikChange(e.target.value)}
              onFocus={() => noviKorisnik.length >= 2 && setShowSugestije(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t("novi_chat")}
              aria-label={t("novi_chat")}
              autoComplete="off"
              className={KLASE_UNOSA}
            />
            {showSugestije && sugestije.length > 0 && (
              <ul ref={sugestijeRef} className="absolute z-20 left-0 right-0 mt-1 bg-kolo-surface border border-kolo-border rounded-kontrola shadow-lg overflow-hidden">
                {sugestije.map((u, i) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onMouseDown={() => otvoriKonverzaciju(u.id)}
                      onMouseEnter={() => setAktivniIndex(i)}
                      className={`w-full min-h-10 text-left px-3 py-2 text-sm transition-colors ${
                        i === aktivniIndex
                          ? "bg-kolo-green-100/50 text-kolo-green-700"
                          : "text-kolo-text hover:bg-kolo-green-100/50 hover:text-kolo-green-700"
                      }`}
                    >
                      <Pseudonim>{u.pseudonim}</Pseudonim>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {novaKonvGreska && <Obavestenje vrsta="greska" className="mt-1">{novaKonvGreska}</Obavestenje>}
        </div>
        )}

        {/* Lista konverzacija */}
        <div className="flex-1 overflow-y-auto">
          {konverzacije.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-kolo-muted whitespace-pre-line">{t("nema_konverzacija")}</p>
          ) : (
            konverzacije.map((k) => (
              <KonverzacijaRed
                key={k.id}
                k={k}
                aktivna={aktivnaKonvId === k.id}
                onOtvori={otvoriKonv}
                t={t}
              />
            ))
          )}
        </div>
      </div>

      {/* Desna tabla — aktivni chat */}
      <div className={`flex-1 flex-col min-w-0 ${mobilniPrikaz === "lista" ? "hidden md:flex" : "flex"}`}>
        {!aktivnaKonvId ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-kolo-muted text-sm">{t("izaberite_konverzaciju")}</p>
          </div>
        ) : (
          <>
            {/* Header chata */}
            <div className="px-4 py-3 border-b border-kolo-border flex items-center gap-3">
              <button
                onClick={() => setMobilniPrikaz("lista")}
                className="md:hidden -ml-2 inline-flex h-10 w-10 items-center justify-center text-kolo-muted hover:text-kolo-text transition-colors shrink-0"
                aria-label={t("nazad")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <KorisnikAvatar
                avatar={drugiAvatar}
                pseudonim={drugiPseudonim}
                userId={drugiId || undefined}
                size={32}
              />
              {drugiId ? (
                <Link href={profilHref({ id: drugiId, pseudonim: drugiPseudonim })} className="text-sm font-semibold text-kolo-green-700 hover:underline">
                  <Pseudonim>{drugiPseudonim}</Pseudonim>
                </Link>
              ) : (
                <span className="text-sm font-semibold text-kolo-text"><Pseudonim>{drugiPseudonim}</Pseudonim></span>
              )}
            </div>

            {/* Poruke */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {poruke.length === 0 && (
                <p className="text-center text-xs text-kolo-muted py-8">{t("pocnite_konverzaciju")}</p>
              )}
              {poruke.map((p) => (
                <PorukaBubble
                  key={p.id}
                  p={p}
                  avatar={p.moja ? mojAvatar : drugiAvatar}
                  pseudonim={p.moja ? mojPseudonim : drugiPseudonim}
                  userId={p.moja ? undefined : drugiId || undefined}
                />
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-kolo-border">
              {/* Povodom čega je razgovor otvoren. Stoji dok se ne napiše prva
                  poruka — tada prelazi na nju, kao kartica iznad teksta. */}
              {roditeljCita && (
                <p className="mb-2 rounded-xl border-l-4 border-kolo-gold-400 bg-kolo-bg px-3 py-2 text-xs text-kolo-text">
                  {t("roditelj_cita")}
                </p>
              )}
              {povod && (
                <a
                  href={`/pijaca/${povod.id}`}
                  className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-kontrola bg-kolo-bg border border-kolo-border hover:bg-kolo-surface transition-colors"
                >
                  {povod.imaSliku ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/pijaca/slika/${povod.id}/0`} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-white" />
                  ) : (
                    <span className="w-8 h-8 rounded-lg bg-white shrink-0 flex items-center justify-center text-sm">🏷️</span>
                  )}
                  <span className="text-xs font-semibold text-kolo-green-700 underline truncate">{povod.naslov}</span>
                </a>
              )}
              {/* Raskid gasi razgovor. Poruke ostaju — trag deteta se ne briše —
                  ali se polje za pisanje ne prikazuje, umesto da dete piše u
                  prazno i dobije grešku tek na „Pošalji". */}
              {razgovorZatvoren ? (
                <p className="rounded-kontrola bg-kolo-bg px-4 py-3 text-sm text-kolo-muted">
                  {t("razgovor_zatvoren")}
                </p>
              ) : (
              <form onSubmit={posalji} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={tekst}
                  onChange={(e) => setTekst(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("napišite_poruku")}
                  aria-label={t("napišite_poruku")}
                  maxLength={1000}
                  rows={1}
                  className={KLASE_UNOSA + " flex-1 resize-none"}
                  style={{ maxHeight: "120px", overflowY: "auto" }}
                />
                <button
                  type="submit"
                  disabled={slanje || !tekst.trim()}
                  className={klaseDugmeta() + " shrink-0"}
                >
                  {slanje ? t("saljem") : t("posalji")}
                </button>
              </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Bail-out poređenja (polling bez promene ne sme da okine re-render) ──────────
function istePoruke(a: Poruka[], b: Poruka[]): boolean {
  return a.length === b.length && a[a.length - 1]?.id === b[b.length - 1]?.id;
}
function istiKonv(a: Konverzacija[], b: Konverzacija[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id || a[i].neprocitano !== b[i].neprocitano || a[i].poslednjeVreme !== b[i].poslednjeVreme) {
      return false;
    }
  }
  return true;
}

// ── Memo-izovane stavke listi ──────────────────────────────────────────────────
type TF = ReturnType<typeof useTranslations<"poruke">>;

const KonverzacijaRed = memo(function KonverzacijaRed({
  k,
  aktivna,
  onOtvori,
  t,
}: {
  k: Konverzacija;
  aktivna: boolean;
  onOtvori: (id: string) => void;
  t: TF;
}) {
  const locale = useLocale();
  return (
    <button
      onClick={() => onOtvori(k.id)}
      className={`w-full text-left px-4 py-3 border-b border-kolo-border/50 last:border-0 hover:bg-kolo-bg transition-colors ${
        aktivna ? "bg-kolo-green-100/40" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar bez linka — red je već <button>, ugnežden link bi bio nevalidan */}
        <KorisnikAvatar avatar={k.drugiAvatar} pseudonim={k.drugiPseudonim} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between mb-0.5 gap-2">
            <span className="text-sm font-semibold text-kolo-text truncate"><Pseudonim>{k.drugiPseudonim}</Pseudonim></span>
            <div className="flex items-center gap-1.5 shrink-0">
              {k.neprocitano > 0 && (
                <span className="w-4 h-4 bg-kolo-green-700 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {k.neprocitano > 9 ? "9+" : k.neprocitano}
                </span>
              )}
              <span className="text-[11px] text-kolo-border">
                {new Date(k.poslednjeVreme).toLocaleString(intlTag(locale), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
          {k.poslednjaPorukaIznos && (
            <p className="text-xs text-kolo-muted truncate">
              {k.poslednjaPosiljacJa ? t("vi") : ""}{k.poslednjaPorukaIznos}
            </p>
          )}
        </div>
      </div>
    </button>
  );
});

const PorukaBubble = memo(function PorukaBubble({
  p,
  avatar,
  pseudonim,
  userId,
}: {
  p: Poruka;
  avatar: string | null;
  pseudonim: string;
  userId?: string;
}) {
  const locale = useLocale();
  return (
    <div className={`flex items-end gap-2 ${p.moja ? "justify-end" : "justify-start"}`}>
      {!p.moja && <KorisnikAvatar avatar={avatar} pseudonim={pseudonim} userId={userId} size={28} />}
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          p.moja
            ? "bg-kolo-green-700 text-white rounded-br-sm"
            : "bg-kolo-bg text-kolo-text border border-kolo-border rounded-bl-sm"
        }`}
      >
        {p.oglas && (
          <a
            href={`/pijaca/${p.oglas.id}`}
            className={`flex items-center gap-2 mb-2 pb-2 border-b rounded-lg ${
              p.moja ? "border-white/25 hover:bg-white/10" : "border-kolo-border hover:bg-white"
            } transition-colors`}
          >
            {p.oglas.imaSliku ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/pijaca/slika/${p.oglas.id}/0`} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 bg-white" />
            ) : (
              <span className="w-9 h-9 rounded-lg bg-white/80 shrink-0 flex items-center justify-center text-base">🏷️</span>
            )}
            <span className={`text-xs font-semibold underline truncate ${p.moja ? "text-white" : "text-kolo-green-700"}`}>
              {p.oglas.naslov}
            </span>
          </a>
        )}
        <p className="whitespace-pre-wrap break-words">{p.tekst}</p>
        <p className={`text-[11px] mt-1 ${p.moja ? "text-white/70" : "text-kolo-border"}`}>
          {new Date(p.createdAt).toLocaleString(intlTag(locale), { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {p.moja && <KorisnikAvatar avatar={avatar} pseudonim={pseudonim} size={28} />}
    </div>
  );
});

export default function PorukeStrana() {
  return (
    <Suspense>
      <PorukeContent />
    </Suspense>
  );
}
