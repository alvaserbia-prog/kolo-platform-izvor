"use client";

import { useState, useEffect, useRef } from "react";
import { intlTag } from "@/lib/format";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTranslations, useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import UspehKartica from "@/components/UspehKartica";
import Link from "next/link";
import { jeNadoknada, iznosNadoknade, raspolozivo } from "@/lib/protokol/nadoknada";
import { dogadjaj } from "@/lib/analitika";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import Kartica from "@/components/ui/Kartica";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import Fioka from "@/components/ui/Fioka";
import NaslovStranice from "@/components/ui/NaslovStranice";

/** Puno belo dugme na zelenom zaglavlju (odluka vlasnika 02.11.2026: ne providno). */
const KLASE_BELOG_DUGMETA =
  "inline-flex min-h-11 items-center justify-center rounded-kontrola bg-white px-5 text-sm font-semibold text-kolo-green-800 transition-colors hover:bg-kolo-green-50";

// qrcode.react se deli sa html5-qrcode u isti veliki chunk (~361KB). Učitava se
// LENJO — QR se prikazuje tek kad korisnik otvori karticu za upis POEN-a, pa ne
// opterećuje početni bundle Novčanika.
const QRCodeSVG = dynamic(() => import("qrcode.react").then((m) => m.QRCodeSVG), {
  ssr: false,
});

// Skener kamere (html5-qrcode ~200KB) — učitava se LENJO, tek kad kupac otvori
// skener za plaćanje. Deli isti chunk sa skenerom u verifikaciji.
const QrSkener = dynamic(() => import("@/components/verifikacija/QrSkener"), {
  ssr: false,
});

interface Props {
  /**
   * Maloletni nalog. Menja se SAMO objašnjenje uz minus.
   *
   * 🔴 Zatečeni tekst govori o poništenoj potvrdi i o prijavi razmene — dva
   * instituta koja dete nikad nije dodirnulo. Kod deteta minus nastaje iz
   * raskinutog prijateljstva (deca čl. 34) ili sa osamnaestim rođendanom (deca čl. 35),
   * pa dete koje se posvađalo sa drugaricom čita pasus o postupku Fondacije.
   * Iznos, računica i pravni režim minusa ostaju isti — menja se rečenica.
   */
  maloletan?: boolean;
  balance: number;
  pseudonim: string;
  memberHash: string;
  platiPseudonim?: string;
  prefillIznos?: string;
  prefillOpis?: string;
  /** Doprinos sadržaju koji čeka okidač (0 = nema). Nikad se ne sabira sa stanjem. */
  zabelezenDoprinos?: number;
  /** Doprinos gazdinstva (gazdinstva čl. 16) — čeka sopstveni potez: oglas i potvrdu. */
  zabelezenGazdinstvo?: number;
  /** POEN po potvrdama koji čeka prvi doprinos — tvoj (dokaz stvarnosti čl. 19). */
  zabelezenePotvrdeMoje?: number;
  /** POEN po potvrdama koje si dao — čeka TUĐI prvi doprinos. */
  zabelezenePotvrdeTudje?: number;
  /**
   * Ljudi čiji se prvi doprinos čeka. Iznos sam po sebi ne kaže vlasniku naloga šta
   * može da uradi: taj POEN otključava TUĐI potez, pa je jedina radnja koja mu stoji
   * na raspolaganju da podseti baš tog čoveka.
   *
   * 🔴 Ne otvara nijedan nov podatak — ista imena već stoje na stranici Potvrde;
   * vidi ih isključivo vlasnik naloga (Pravilnik čl. 56). Red za nadzor je uklonjen setom 4.7.5:
   * nadzor se više ne plaća.
   */
  cekamPotvrdjene?: { id: string; pseudonim: string }[];
  /** Rezervisano za kolektivnu nabavku. Nula = reda nema (odluka vlasnika). */
  rezervisanoNabavka?: number;
  /** Zabeleženo novčano pokroviteljstvo koje čeka naredni obračunski period (Pravilnik čl. 37 st. 2, set 5.0.9). */
  zabelezenPokroviteljstvo?: number;
  /** Privremeno ograničen iznos po poništenju donacije unapred (donacije čl. 6 st. 7, set 5.0.9). */
  ogranicenoIznos?: number;
  /** Neverifikovani sme samo da prima — dugme za upis mu se ne prikazuje. */
  smeDaSalje?: boolean;
  /**
   * Zašto dugmeta nema. Detetu se NE sme reći „otvara se po potvrdi": ono potvrdu
   * ne dobija do punoletstva (deca čl. 29 st. 2), pa bi ga uputstvo slalo u prazno. Njegov
   * uslov je da roditelj preuzme nalog.
   */
  razlogZabrane?: "neverifikovan" | "ceka_roditelja";
}

export default function NovcanikKartice({ balance, pseudonim, memberHash, platiPseudonim, prefillIznos, prefillOpis, zabelezenDoprinos = 0, zabelezenGazdinstvo = 0, zabelezenePotvrdeMoje = 0, zabelezenePotvrdeTudje = 0, cekamPotvrdjene = [], rezervisanoNabavka = 0, zabelezenPokroviteljstvo = 0, ogranicenoIznos = 0, smeDaSalje = true, razlogZabrane = "neverifikovan", maloletan = false }: Props) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("novcanik");
  const tc = useTranslations("common");
  // Nadoknada po poništenju lažne verifikacije (dokaz stvarnosti čl. 36). Negativan
  // zapis JESTE nadoknada — nema zasebne kolone. Prikazuje se kao zaseban red, a ne
  // kao „minus stanje", jer nije dug i ne može se naplatiti.
  const uNadoknadi = jeNadoknada(balance);

  // Sme li nalog da prepiše POEN drugome. Spaja dva razloga zabrane koja su se do
  // sada proveravala odvojeno: tip naloga (čl. 30 Pravilnika o učešću
  // dece) i nepokriven zapis (nadoknada po čl. 36 dokaza stvarnosti).
  //
  // 🔴 Obrazac za prepis se NE otvara nalogu koji ne sme da prepisuje. Do ove izmene
  // ga je `?plati=` (skeniran QR ili link iz oglasa) otvarao bez obzira na dozvolu,
  // pa je nov član popunjavao ceo obrazac i tek pri slanju dobijao 403 sa
  // `/api/transfer`. Ista provera stoji i nad skenerom, koji vodi pravo u taj obrazac.
  const smeDaPrepisuje = smeDaSalje && !uNadoknadi;

  const [showSend, setShowSend] = useState(smeDaPrepisuje && !!platiPseudonim);
  const [showQR, setShowQR] = useState(false);
  const [showSkener, setShowSkener] = useState(false);
  // Razlaganje zabeleženog doprinosa po stavkama — zatvoreno dok se ne zatraži.
  const [showStavke, setShowStavke] = useState(false);

  // Zabeleženo se na ekranu sabira u JEDAN broj, a razlaže po tome NA KOGA SE ČEKA.
  // Kanal (oglas, gazdinstvo, potvrda) je podatak o poreklu; vlasnika
  // naloga zanima čiji se potez čeka, jer samo to kaže šta on može da uradi.
  const cekaFondaciju = zabelezenDoprinos;
  const cekaTebe = zabelezenePotvrdeMoje + zabelezenGazdinstvo;
  const cekaDruge = zabelezenePotvrdeTudje;
  // Ne čeka se ničiji potez, nego kraj obračunskog perioda (Pravilnik čl. 37 st. 2).
  const cekaPeriod = zabelezenPokroviteljstvo;
  const zabelezenoUkupno = cekaFondaciju + cekaTebe + cekaDruge + cekaPeriod;

  return (
    <>
      <div className="space-y-3">
        {/* Zeleno zaglavlje POEN-a (odluka vlasnika 02.11.2026): kartica stanja JESTE
            zaglavlje stranice — ista tamnozelena ploča kao na Vaučerima
            (`NaslovStranice varijanta="istaknuto"`), bez vidljivog naslova „POEN" iznad.
            Gore krupno „Na tvom zapisu" i broj, ispod puna bela dugmad.

            🟢 Ploča je zelena SVIMA (odluka vlasnika, 13.10.2026). Ostaje ono što nosi
            pravilo: ko ne sme da prepisuje (dete koje nije dete Kola, nalog u nadoknadi)
            na velikom broju vidi koliko SME da prepiše, dakle nulu, pod naslovom
            „Raspoloživo za prepis", a koliko mu je stvarno evidentirano stoji u redu
            „Na tvom zapisu" odmah ispod ploče. Dugme za prepis i skener mu se ne prikazuju.

            🔴 Pun ton ploče je `bg-kolo-green-900`, a prelaz ide preko njega (`bg-linear-*`,
            nikad stara klasa `gradient-to`, koja daje `in oklab` bez rezerve — ploča je
            ostajala bela, sa belim slovima). Brana: `novcanik-kartica-izvor.test.ts`.

            🟢 „Moj QR" OSTAJE i takvom nalogu, i to namerno: takav nalog sme da PRIMA,
            a QR je način da mu se prepiše POEN za prodato dobro. To mu je ujedno i put do
            potvrde (Pravilnik čl. 38). Skener se sklanja jer vodi u suprotnom smeru — u
            obrazac za prepis DRUGOME. */}
        <NaslovStranice
          varijanta="istaknuto"
          naslov={
            <>
              {/* Jedini h1 stranice; čitač ekrana čuje i ime ekrana. */}
              <span className="sr-only">{tc("poen")}: </span>
              {smeDaPrepisuje ? t("na_zapisu_naslov") : t("raspolozivo_naslov")}
            </>
          }
          opis={t("zaglavlje_opis")}
        >
          <p className="text-4xl font-bold tracking-tight tabular-nums break-words sm:text-5xl">
            {(smeDaSalje ? raspolozivo(balance) : 0).toLocaleString(intlTag(locale))}
            <span className="ml-2 text-lg font-semibold text-white/85">{tc("poen")}</span>
          </p>

          {/* Objašnjenje stoji UZ broj, u istoj ploči — bez njega nula izgleda kao da je
              nešto nestalo. Punoletnom bez prepisa (nalog u nadoknadi) razlog kaže red
              „Nadoknada" ispod ploče. */}
          {!smeDaSalje && razlogZabrane === "ceka_roditelja" && (
            <p className="mt-2 text-sm text-white/85">{t("ceka_roditelja")}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {smeDaPrepisuje && (
              <button type="button" onClick={() => setShowSend(true)} className={KLASE_BELOG_DUGMETA}>
                {t("posalji_poen")}
              </button>
            )}
            {/* Skener otvara obrazac za prepis, pa ga ne vidi ko ne sme da prepisuje. */}
            {smeDaPrepisuje && (
              <button type="button" onClick={() => setShowSkener(true)} className={KLASE_BELOG_DUGMETA}>
                {t("skeniraj_dugme")}
              </button>
            )}
            <button type="button" onClick={() => setShowQR(true)} className={KLASE_BELOG_DUGMETA}>
              {t("moj_qr")}
            </button>
          </div>
        </NaslovStranice>

        {/* Forma za prepis POEN-a stoji ODMAH ispod kartice sa stanjem, a iznad
            redova sa zabeleženim doprinosom i potvrdama. Razlog je redosled
            radnje: dugme je na kartici, pa obrazac mora da se otvori uz njega —
            ranije je stajao ispod svih zabeleženih redova, pa se na dužem ekranu
            klik nije video i delovalo je kao da dugme ne radi. Redovi ispod su
            stanje koje se čita, obrazac je radnja koja se izvodi. */}
        {showSend && (
          <div>
            <SendForma
              onClose={() => setShowSend(false)}
              onSuccess={() => { setShowSend(false); window.dispatchEvent(new Event("balans-updated")); router.refresh(); }}
              initialPseudonim={platiPseudonim}
              initialIznos={prefillIznos}
              initialOpis={prefillOpis}
            />
          </div>
        )}

        {/* Nadoknada (dokaz stvarnosti čl. 36) stoji ISPOD kartice, kao zaseban red. Nije prikazana
            kao negativno stanje jer nije dug: Fondacija po njoj nema potraživanje i
            ne može je naplatiti. Razmena dobara i usluga se njome ne ograničava —
            ograničen je samo upis POENA drugome, dok zapis ne pređe nulu. */}
        {/* Privremeno ograničen iznos (donacije čl. 6 st. 7, set 5.0.9): ostaje u zapisu,
            ali se ne prepisuje, ne koristi u projektu i ne upisuje u ZRNO, najduže 7 dana. */}
        {ogranicenoIznos > 0 && !uNadoknadi && (
          <Obavestenje
            vrsta="upozorenje"
            naslov={
              <span className="flex items-baseline justify-between gap-3">
                <span>{t("ograniceno_naslov")}</span>
                <span className="text-lg font-bold tabular-nums">
                  {ogranicenoIznos.toLocaleString(intlTag(locale))} {tc("poen")}
                </span>
              </span>
            }
          >
            <p>{t("ograniceno_opis")}</p>
          </Obavestenje>
        )}

        {uNadoknadi && (
          <Obavestenje
            vrsta="upozorenje"
            naslov={
              <span className="flex items-baseline justify-between gap-3">
                <span>{t("nadoknada_naslov")}</span>
                <span className="text-lg font-bold tabular-nums">
                  {iznosNadoknade(balance).toLocaleString(intlTag(locale))} {tc("poen")}
                </span>
              </span>
            }
          >
            <p>{t(maloletan ? "nadoknada_opis_dete" : "nadoknada_opis")}</p>
          </Obavestenje>
        )}

        {/* Na tvom zapisu — POEN koji nalog STVARNO ima, ali njime još ne sme da
            raspolaže (čl. 30 Pravilnika o učešću dece za dete koje čeka
            roditelja). Veliki broj iznad pokazuje raspoloživo za
            prepis, dakle nulu; bez ovog reda bi čovek koji je nešto prodao na Pijaci
            pomislio da mu je prodaja nestala. Zapis JESTE njegov i zbir u sistemu ga
            broji — čeka se samo pravo raspolaganja, koje dolazi sa potvrdom.

            🔴 Ovo NIJE isto što i zabeleženo ispod: ovde je POEN upisan u Protokol,
            tamo zapis još ne postoji (Pravilnik čl. 38 st. 2). Dva reda se ne spajaju. */}
        {!smeDaSalje && raspolozivo(balance) > 0 && (
          <Kartica padding="nema" className="px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-kolo-text">{t("na_zapisu_naslov")}</p>
              <p className="text-lg font-bold tabular-nums text-kolo-green-700">
                {raspolozivo(balance).toLocaleString(intlTag(locale))} {tc("poen")}
              </p>
            </div>
            {razlogZabrane === "ceka_roditelja" && (
              <p className="text-sm text-kolo-muted mt-1">{t("na_zapisu_opis_dete")}</p>
            )}
          </Kartica>
        )}

        {/* Zabeležen doprinos — JEDAN broj za sve što čeka uslov, sa razlaganjem na
            klik. Do ove izmene je to bilo pet redova sa skoro istim naslovima
            (doprinos po čl. 38, koraci putanje razmene — ukinuti setom 4.8.0 — potvrde primljene, potvrde
            date, nadzor), pa se iz ekrana nije video odgovor na jedino pitanje koje
            vlasnika naloga zanima: šta treba da se desi da se ovo upiše.

            🔴 Razlaganje ide po tome NA KOGA SE ČEKA, ne po kanalu. Kanal je podatak o
            poreklu; čeka se uvek nečiji potez — Fondacijin, sopstveni ili tuđi — i samo
            to kaže čoveku šta može da uradi. Po kanalu poređani redovi su to skrivali:
            „potvrde koje si dao" i „nadzor" čekaju treća lica i on tu ne može ništa
            osim da ih podseti, a „prvi oglas" čeka UO.

            🔴 Nikad se ne sabira sa stanjem: do okidača to nije zapis POEN-a (čl. 38
            st. 2). Naziv je „Zabeležen doprinos", nikad „POEN na čekanju" — POEN
            postoji isključivo kao zapis u Protokolu (čl. 16 st. 3), a to pravilo čuva
            `potvrda-uslov-izvor.test.ts`.

            🔴 Rezervisano za nabavku NIJE ovde i ne sme da se doda: taj POEN je već
            upisan u zapis, samo je vezan do preuzimanja (nabavke čl. 21 st. 3) — drugi institut
            i drugi ishod. */}
        {zabelezenoUkupno > 0 && (
          <Kartica padding="nema" className="px-5 py-4">
            {/* Zatvoreno stanje nosi SAMO naziv i iznos (odluka vlasnika): rečenica
                objašnjenja je sklonjena, a znak da se red otvara je strelica. Ceo red
                je dugme — meta od jednog reda je na telefonu pouzdanija od male
                strelice, a šta se čeka piše u stavkama koje se otvaraju. */}
            <button
              type="button"
              onClick={() => setShowStavke((v) => !v)}
              aria-expanded={showStavke}
              className="flex w-full items-baseline justify-between gap-3 text-left"
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-kolo-text">
                {t("zabelezen_naslov")}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 opacity-70 transition-transform ${showStavke ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
              <span className="text-lg font-bold tabular-nums text-kolo-green-700">
                {zabelezenoUkupno.toLocaleString(intlTag(locale))} {tc("poen")}
              </span>
            </button>

            {showStavke && (
              <div className="mt-3 space-y-3 border-t border-kolo-border pt-3">
                {cekaFondaciju > 0 && (
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-kolo-text">{t("ceka_fondaciju")}</p>
                      <p className="text-sm font-bold tabular-nums text-kolo-text">
                        {cekaFondaciju.toLocaleString(intlTag(locale))} {tc("poen")}
                      </p>
                    </div>
                    <p className="text-sm text-kolo-muted mt-1">{t("ceka_fondaciju_opis")}</p>
                  </div>
                )}

                {cekaPeriod > 0 && (
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-kolo-text">{t("ceka_period")}</p>
                      <p className="text-sm font-bold tabular-nums text-kolo-text">
                        {cekaPeriod.toLocaleString(intlTag(locale))} {tc("poen")}
                      </p>
                    </div>
                    <p className="text-sm text-kolo-muted mt-1">{t("ceka_period_opis")}</p>
                  </div>
                )}

                {cekaTebe > 0 && (
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-kolo-text">{t("ceka_tebe")}</p>
                      <p className="text-sm font-bold tabular-nums text-kolo-text">
                        {cekaTebe.toLocaleString(intlTag(locale))} {tc("poen")}
                      </p>
                    </div>
                    {zabelezenePotvrdeMoje > 0 && (
                      <p className="text-sm text-kolo-muted mt-1">
                        {t("zabelezene_potvrde_moje", {
                          iznos: zabelezenePotvrdeMoje.toLocaleString(intlTag(locale)),
                        })}
                      </p>
                    )}
                    {/* Put do prvog doprinosa odmah uz broj (simulirani korisnici,
                        24.10.2026) — ista radnja kao na Potvrdama. */}
                    <Link href="/pijaca/novi-oglas" className="mt-1 inline-flex min-h-10 items-center text-sm font-semibold text-kolo-green-700 hover:underline">
                      {t("objavi_ponudu")}
                    </Link>
                    {zabelezenGazdinstvo > 0 && (
                      <p className="text-sm text-kolo-muted mt-1">
                        {t("zabelezen_gazdinstvo", {
                          iznos: zabelezenGazdinstvo.toLocaleString(intlTag(locale)),
                        })}
                      </p>
                    )}
                  </div>
                )}

                {cekaDruge > 0 && (
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-kolo-text">
                        {t("zabelezene_potvrde_naslov")}
                      </p>
                      <p className="text-sm font-bold tabular-nums text-kolo-text">
                        {cekaDruge.toLocaleString(intlTag(locale))} {tc("poen")}
                      </p>
                    </div>
                    {zabelezenePotvrdeTudje > 0 && (
                      <div className="mt-1">
                        <p className="text-sm text-kolo-muted">
                          {t("zabelezene_potvrde_tudje", {
                            iznos: zabelezenePotvrdeTudje.toLocaleString(intlTag(locale)),
                          })}
                        </p>
                        {/* Spisak ljudi stoji jednom — na Potvrdama (odluka vlasnika,
                            24.10.2026); ovde zbir i veza. */}
                        <Link href="/verifikacija#zabelezene" className="mt-1 inline-flex min-h-10 items-center text-sm font-semibold text-kolo-green-700 hover:underline">
                          {t("zabelezene_vidi")}
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* 🔴 Ovde je stajao zaključni pasus sa `zabelezene_potvrde_opis`
                    („Upisuje se kad se pojavi prvi doprinos onoga na koga se potvrda
                    odnosi…"). Sklonjen je odlukom vlasnika 21.09.2026 — red nosi samo
                    kratke tekstove uz stavke. Ključ OSTAJE u `messages/*.json` jer ga
                    traži `potvrda-uslov-izvor.test.ts`; ne brisati ga bez izmene te
                    brane. */}
              </div>
            )}
          </Kartica>
        )}

        {/* Rezervisano za kolektivnu nabavku (Pravilnik o projektima i kolektivnim
            nabavkama čl. 21 st. 3). Zaseban red, NIKAD sabran sa stanjem — isti
            razlog kao zabeležen doprinos. Red se prikazuje samo kad rezervacija
            postoji; do preuzimanja POEN nije poništen (čl. 25 st. 2). */}
        {rezervisanoNabavka > 0 && (
          <Kartica padding="nema" className="px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-kolo-text">{t("rezervisano_nabavka")}</p>
              <p className="text-lg font-bold tabular-nums text-kolo-green-700">
                {rezervisanoNabavka.toLocaleString(intlTag(locale))} {tc("poen")}
              </p>
            </div>
            <p className="text-sm text-kolo-muted mt-1">{t("rezervisano_nabavka_opis")}</p>
          </Kartica>
        )}


      </div>

      {/* QR modal */}
      {showQR && (
        <QRModal pseudonim={pseudonim} memberHash={memberHash} onClose={() => setShowQR(false)} />
      )}

      {/* Skener za plaćanje (kupac skenira QR prodavca) */}
      {showSkener && (
        <SkenerModal onClose={() => setShowSkener(false)} />
      )}
    </>
  );
}

// ── Skener modal (kupac skenira QR prodavca i plaća) ──────────────────────────

function SkenerModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("novcanik");
  const router = useRouter();
  const [greska, setGreska] = useState("");

  function handleDetektovan(tekst: string) {
    setGreska("");
    // QR prodavca kodira URL: .../m/<hash>?amount=..&opis=..  ili
    // .../novcanik?plati=<pseudonim>&iznos=..&description=..
    // Kupac skenira → vodimo ga kroz isti tok plaćanja (formu za upis POEN-a).
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://ekolo.rs";
    let putanja: string | null = null;
    try {
      const url = new URL(tekst.trim(), baseUrl);
      if (url.pathname.startsWith("/m/") || url.pathname.startsWith("/novcanik")) {
        putanja = url.pathname + url.search;
      }
    } catch {
      // nije validan URL
    }
    if (!putanja) {
      setGreska(t("skener_greska_qr"));
      return;
    }
    onClose();
    router.push(putanja);
  }

  return (
    <Fioka naslov={t("skener_naslov")} onZatvori={onClose} sirina="sm">
        <p className="text-sm text-kolo-muted">{t("skener_opis")}</p>
        {greska && (
          <Obavestenje vrsta="greska">{greska}</Obavestenje>
        )}
        <QrSkener
          onDetektovan={handleDetektovan}
          onZatvori={onClose}
          uputstvo={t("skener_uputstvo")}
        />
    </Fioka>
  );
}

// ── Forma za upis POEN-a ──────────────────────────────────────────────────────

function SendForma({ onClose, onSuccess, initialPseudonim, initialIznos, initialOpis }: { onClose: () => void; onSuccess: () => void; initialPseudonim?: string; initialIznos?: string; initialOpis?: string }) {
  const locale = useLocale();
  const t = useTranslations("novcanik");
  const tc = useTranslations("common");
  const [pseudonim, setPseudonim] = useState(initialPseudonim ?? "");
  const [amount, setAmount] = useState(initialIznos ?? "");
  const [description, setDescription] = useState(initialOpis ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sugestije, setSugestije] = useState<string[]>([]);
  const [showSugestije, setShowSugestije] = useState(false);
  const [aktivniIndex, setAktivniIndex] = useState(-1);
  const [uspeh, setUspeh] = useState<{ iznos: number; pseudonim: string; naCekanju: boolean } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSugestije(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handlePseudonimChange(val: string) {
    setPseudonim(val);
    setShowSugestije(true);
    setAktivniIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSugestije([]); return; }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/korisnici/pretraga?q=${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      setSugestije((data as { pseudonim: string }[]).map((u) => u.pseudonim));
    }, 250);
  }

  function odaberi(ps: string) {
    setPseudonim(ps);
    setSugestije([]);
    setShowSugestije(false);
    setAktivniIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSugestije || sugestije.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const novi = Math.min(aktivniIndex + 1, sugestije.length - 1);
      setAktivniIndex(novi);
      listaRef.current?.children[novi]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const novi = Math.max(aktivniIndex - 1, 0);
      setAktivniIndex(novi);
      listaRef.current?.children[novi]?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      if (aktivniIndex >= 0 && aktivniIndex < sugestije.length) {
        e.preventDefault();
        odaberi(sugestije[aktivniIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSugestije(false);
      setAktivniIndex(-1);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pseudonim.trim()) { setError(t("send_greska_pseudonim")); return; }
    const iznos = parseInt(amount, 10);
    if (!amount || isNaN(iznos) || iznos <= 0) { setError(t("send_greska_iznos")); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonim: pseudonim.trim(), amount: iznos, description: description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("send_greska")); return; }
      // Bez iznosa i bez primaoca — samo da se prepis desio.
      dogadjaj("prepis_poen");
      // Prepis iz dečjeg zapisa iznad praga se NE izvršava odmah nego čeka roditelja
      // (Pravilnik o učešću dece, čl. 30). Ekran to mora da kaže — inače dete vidi
      // „prepisano" a POEN se nije pomerio.
      setUspeh({ iznos, pseudonim: pseudonim.trim(), naCekanju: data?.naCekanju === true });
    } catch {
      setError(t("send_greska"));
    } finally {
      setLoading(false);
    }
  }

  if (uspeh) {
    return (
      <UspehKartica
        naslov={uspeh.naCekanju ? t("send_ceka_naslov") : t("send_uspeh_naslov")}
        opis={t(uspeh.naCekanju ? "send_ceka_opis" : "send_uspeh_opis", {
          iznos: uspeh.iznos.toLocaleString(intlTag(locale)),
          pseudonim: uspeh.pseudonim,
        })}
        dugmeTekst={t("send_uspeh_dugme")}
        onDugme={onSuccess}
      />
    );
  }

  return (
    <Kartica>
      <div className="mb-4">
        <NaslovSekcije
          radnja={
            <button type="button" onClick={onClose} aria-label={tc("zatvori")} className="inline-flex h-10 w-10 -m-2 items-center justify-center rounded-kontrola text-kolo-muted hover:text-kolo-text text-xl leading-none">×</button>
          }
        >
          {t("send_naslov")}
        </NaslovSekcije>
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="relative" ref={wrapperRef}>
          <label htmlFor="prepis-pseudonim" className="mb-1.5 block text-sm font-medium text-kolo-text">{t("send_pseudonim")}</label>
          <input
            id="prepis-pseudonim"
            type="text"
            value={pseudonim}
            onChange={(e) => handlePseudonimChange(e.target.value)}
            onFocus={() => pseudonim.length >= 2 && setShowSugestije(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("send_pseudonim_placeholder")}
            autoComplete="off"
            className={KLASE_UNOSA}
          />
          {showSugestije && sugestije.length > 0 && (
            <ul ref={listaRef} className="absolute z-20 left-0 right-0 mt-1 bg-kolo-surface border border-kolo-border rounded-kontrola shadow-lg overflow-hidden">
              {sugestije.map((ps, i) => (
                <li key={ps}>
                  <button
                    type="button"
                    onMouseDown={() => odaberi(ps)}
                    onMouseEnter={() => setAktivniIndex(i)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      i === aktivniIndex
                        ? "bg-kolo-green-100 text-kolo-green-800"
                        : "text-kolo-muted hover:bg-kolo-green-50 hover:text-kolo-green-700"
                    }`}
                  >
                    {ps}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Polje oznaka={t("send_iznos")}>
          <input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("send_iznos_placeholder")}
            className={KLASE_UNOSA + " font-mono"}
          />
        </Polje>
        <Polje oznaka={<>{t("send_opis")} <span className="text-kolo-muted font-normal">({tc("opciono")})</span></>}>
          <input
            type="text"
            maxLength={100}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("send_opis_placeholder")}
            className={KLASE_UNOSA}
          />
        </Polje>
        {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}
        {/* Šta prepis JESTE, rečeno na mestu gde se radi. Reč „prepis" u govoru
            vuče na dve pogrešne strane — „prepisati kuću" (prenos svojine, a POEN
            nije imovinsko pravo, Pravilnik čl. 12 i 16) i „prepisati" kao kopirati (kopija bi
            značila da POEN nastaje ni iz čega, protiv zero-suma). Ova rečenica
            gasi obe. */}
        <p className="text-xs text-kolo-muted leading-snug">{t("send_napomena")}</p>
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "lg" }) + " flex-1"}
          >
            {tc("otkazi")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className={klaseDugmeta({ velicina: "lg" }) + " flex-1"}
          >
            {loading ? t("send_dugme_loading") : t("send_dugme")}
          </button>
        </div>
      </form>
    </Kartica>
  );
}

// ── QR modal ──────────────────────────────────────────────────────────────────

function QRModal({ pseudonim, memberHash, onClose }: { pseudonim: string; memberHash: string; onClose: () => void }) {
  const t = useTranslations("novcanik");
  const tc = useTranslations("common");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://ekolo.rs";
  const [iznos, setIznos] = useState("");
  const [opis, setOpis] = useState("");

  function buildQrValue() {
    if (memberHash) {
      const params = new URLSearchParams();
      if (iznos && parseInt(iznos) > 0) params.set("amount", iznos);
      if (opis.trim()) params.set("opis", opis.trim());
      const qs = params.toString();
      return `${baseUrl}/m/${memberHash}${qs ? `?${qs}` : ""}`;
    } else {
      const params = new URLSearchParams({ plati: pseudonim });
      if (iznos && parseInt(iznos) > 0) params.set("iznos", iznos);
      if (opis.trim()) params.set("description", opis.trim());
      return `${baseUrl}/novcanik?${params.toString()}`;
    }
  }

  const qrValue = buildQrValue();

  function kopiraj() {
    navigator.clipboard.writeText(qrValue).catch(() => {});
  }

  return (
    <Fioka naslov={t("qr_naslov")} onZatvori={onClose} sirina="sm">
        <p className="text-sm text-kolo-muted">{t("qr_opis")}</p>

        <div className="space-y-2 text-left">
          <Polje oznaka={<>{t("qr_iznos")} <span className="text-kolo-muted font-normal">({tc("opciono")})</span></>}>
            <input
              type="number"
              min={1}
              step={1}
              value={iznos}
              onChange={(e) => setIznos(e.target.value)}
              placeholder={t("qr_placeholder_iznos")}
              className={KLASE_UNOSA + " font-mono"}
            />
          </Polje>
          <Polje oznaka={<>{tc("opis")} <span className="text-kolo-muted font-normal">({tc("opciono")})</span></>}>
            <input
              type="text"
              maxLength={100}
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              placeholder={t("qr_placeholder_opis")}
              className={KLASE_UNOSA}
            />
          </Polje>
        </div>

        <div className="flex justify-center p-4 bg-white rounded-kontrola border border-kolo-border">
          <QRCodeSVG
            value={qrValue}
            size={180}
            fgColor="#1B6B3A"
            bgColor="#FFFFFF"
            level="M"
          />
        </div>
        <p className="text-center text-sm font-semibold text-kolo-green-700 font-mono"><Pseudonim>{pseudonim}</Pseudonim></p>
        <div className="flex gap-2">
          <button
            onClick={kopiraj}
            className={klaseDugmeta({ varijanta: "sekundarno" }) + " flex-1"}
          >
            {t("qr_kopiraj")}
          </button>
          <button
            onClick={onClose}
            className={klaseDugmeta() + " flex-1"}
          >
            {tc("zatvori")}
          </button>
        </div>
    </Fioka>
  );
}
