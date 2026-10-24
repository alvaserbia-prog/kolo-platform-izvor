"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { intlTag } from "@/lib/format";
import { useMePatch, ME_KEY } from "@/hooks/useMe";
import { AKT_POLITIKA, AKT_USLOVI } from "@/lib/verzije-akata";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";

interface Verzija {
  id: string;
  verzija: string;
  naslov: string;
  efektivnaOd: string;
}

/**
 * Ekran za pristanak na nove akte (Uslovi čl. 40, Politika čl. 16).
 *
 * Koristi se na DVA mesta i namerno je jedna komponenta:
 *   1. kao prekrivač preko app-a (`AppShell`) — redovan put,
 *   2. kao sadržaj stranice `/politika-prihvati` — stari linkovi iz notifikacija
 *      i mejlova.
 *
 * 🔴 Zašto prekrivač, a ne preusmeravanje (izmena 11.08.2026): gejt je ranije na
 * svaku promenu rute radio `router.replace("/politika-prihvati")`. Ko ne bi
 * pritisnuo „Pristajem" nego kliknuo dalje po meniju, bio bi izbačen sa svake
 * stranice — u dnevniku aktivnosti se to vidi kao smenjivanje `/novcanik` ↔
 * `/politika-prihvati` (jedan nalog, 120 pregleda za sat vremena). Uz to je
 * svaki povratak bio prava navigacija: ekran „blicne" i sadržaj se prekine.
 * Prekrivač ne dira rutu, pa nema ni skoka ni petlje — a pristup je jednako
 * zatvoren, jer stoji preko svega dok se ne pristane.
 */
export default function PolitikaPristanak({
  kaoStranica = false,
  onGotovo,
}: {
  /** true = sadržaj stranice `/politika-prihvati`; false = prekrivač u AppShell-u. */
  kaoStranica?: boolean;
  /** Zove se kad pristanak više nije potreban (prihvaćen ili već upisan). */
  onGotovo?: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("politikaPrihvati");
  const qc = useQueryClient();
  const patchMe = useMePatch();

  const [verzija, setVerzija] = useState<Verzija | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prihvatanje, setPrihvatanje] = useState(false);
  const [ucitavanjePuklo, setUcitavanjePuklo] = useState(false);
  // 🔴 DVE kvačice, kao pri registraciji (ZZPL čl. 15 st. 2 — pristanak koji se
  // odnosi na više pitanja mora biti razdvojen). Do R-06 je ovde stajalo jedno
  // dugme za ceo set; iz jednog klika se ne može upisati dokaz da je razdvojenost
  // postojala, a upravo taj dokaz zatečenim nalozima nedostaje.
  const [uslovi, setUslovi] = useState(false);
  const [politika, setPolitika] = useState(false);

  // 🔴 `onGotovo` stiže kao inline funkcija sa stranice, dakle NOVA pri svakom
  // iscrtavanju. U zavisnostima `useCallback`-a ispod bi zato rušio stabilnost
  // i vraćao petlju provera (vidi komentar uz `useEffect`). Zato ide u ref.
  const onGotovoRef = useRef(onGotovo);
  useEffect(() => { onGotovoRef.current = onGotovo; }, [onGotovo]);

  /**
   * Keširani `['me']` (odatle AppShell čita `politikaPotrebno`, poll na 30s) MORA
   * da se ispravi čim pristanak legne — inače bi prekrivač ostao na ekranu do
   * sledećeg poll-a, iako je posao završen.
   */
  const zavrsi = useCallback(() => {
    patchMe({ politikaPotrebno: false });
    qc.invalidateQueries({ queryKey: ME_KEY });
    onGotovoRef.current?.();
  }, [patchMe, qc]);

  const ucitaj = useCallback(() => {
    setUcitavanjePuklo(false);
    setLoading(true);
    // `no-store`: odgovor sme da važi samo u trenutku u kom je dat. Keširan
    // „potreban je pristanak" bi vraćao ekran čoveku koji je već pristao.
    fetch("/api/politika/prihvati", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Neuspeo zahtev");
        return r.json();
      })
      .then((data) => {
        if (!data?.potrebno) {
          zavrsi();
          return;
        }
        setVerzija(data.verzija);
        setLoading(false);
      })
      // Pad zahteva ne sme da nas skloni sa ekrana: gejt bi nas odmah vratio
      // ovamo. Ostajemo i nudimo ponovni pokušaj.
      .catch(() => {
        setUcitavanjePuklo(true);
        setLoading(false);
      });
  }, [zavrsi]);

  // 🔴 Provera se pokreće TAČNO JEDNOM, pri montiranju — namerno prazne
  // zavisnosti, ne `[ucitaj]`. Dok je u zavisnostima stajala funkcija, dovoljno
  // je bilo da se ona ponovo napravi pri iscrtavanju pa da se dobije krug:
  // provera → `setState` → iscrtavanje → provera. U noći 11.08.2026 je tako
  // otišlo 3488 zahteva na `/api/politika/prihvati` za tri sata, a kartica je
  // vidljivo treperila (pojavi se sa odgovorom, nestane sa sledećom proverom).
  // Ponovni pokušaj posle greške ide dugmetom, ne efektom.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { ucitaj(); }, []);

  async function prihvati() {
    if (!verzija) return;
    if (!uslovi || !politika) { setError(t("greska_kvacice")); return; }
    setPrihvatanje(true);
    setError("");
    try {
      const res = await fetch("/api/politika/prihvati", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verzijaId: verzija.id, prihvatamUslove: uslovi, prihvatamPolitiku: politika }),
      });
      if (!res.ok) throw new Error("Neuspeo upis");
      zavrsi();
    } catch {
      setError(t("greska_prihvatanje"));
      setPrihvatanje(false);
    }
  }

  // Omotač: prekrivač preko celog ekrana, odnosno obična stranica.
  // `overflow-y-auto` + `py-8` (umesto centriranja u punoj visini ekrana) drži
  // dugme dostižnim i na niskim telefonima — ranije je karta bila centrirana u
  // `min-h-screen` ispod fiksnog zaglavlja, pa je dno umelo da izađe iz vidika.
  const omot = kaoStranica
    ? "flex items-start justify-center min-h-[60vh] p-4 py-8"
    : "fixed inset-0 z-[100] overflow-y-auto bg-kolo-bg/95 backdrop-blur-sm flex items-start justify-center p-4 py-8 overscroll-contain";

  // 🔴 Prekrivač se NE prikazuje dok se ne potvrdi da je pristanak stvarno
  // potreban. `AppShell` ga montira po `politikaPotrebno` iz keširanog
  // `/api/me`, a ta vrednost ume da bude zastarela (poll na 30s; odgovor koji
  // je krenuo pre upisa pristanka ume da stigne posle njega). Ako bismo tada
  // odmah nacrtali karticu, čovek koji je već pristao vidi kako mu ekran
  // bljesne i nestane. Zato: dok traje provera — ništa. Merodavan je server.
  // Stranica `/politika-prihvati` je otvorena namerno, pa tamo poruka o
  // učitavanju ostaje (prazan ekran bi izgledao kao kvar).
  if (loading) {
    if (!kaoStranica) return null;
    return (
      <div className={omot}>
        <p className="text-kolo-muted text-sm mt-12">{t("ucitavanje")}</p>
      </div>
    );
  }

  if (ucitavanjePuklo) {
    return (
      <div className={omot}>
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-8 max-w-md w-full shadow-kartica text-center">
          <p className="text-sm text-kolo-text mb-4">{t("greska_ucitavanje")}</p>
          <Dugme onClick={ucitaj} velicina="lg" punaSirina>
            {t("dugme_pokusaj_ponovo")}
          </Dugme>
        </div>
      </div>
    );
  }

  return (
    <div className={omot}>
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-5 sm:p-8 max-w-md w-full shadow-kartica">
        <div className="mb-6">
          <h1 className="kolo-naslov mb-2">{t("naslov")}</h1>
          {verzija && (
            <p className="text-sm text-kolo-muted">
              {t("verzija_label")} <strong>{verzija.verzija}</strong>: {verzija.naslov}<br />
              {t("na_snazi_od")} <strong>{new Date(verzija.efektivnaOd).toLocaleDateString(intlTag(locale))}</strong>
            </p>
          )}
        </div>

        <p className="text-sm text-kolo-text mb-4">{t("opis")}</p>

        <p className="text-sm text-kolo-muted mb-6">
          {t("procitajte_na")}{" "}
          <Link href="/pravilnik" target="_blank" className="text-kolo-green-700 underline">
            {t("ovoj_stranici")}
          </Link>
          {t("ne_slazete_se")}
        </p>

        {/* Uz svaki akt stoji i VERZIJA, iz istog izvora iz kog je čita zapis
            pristanka (`verzije-akata.ts`) — pa se to dvoje ne može razići. */}
        <div className="space-y-1 mb-6">
          <label className="flex items-start gap-3 cursor-pointer py-2 min-h-11">
            <input type="checkbox" checked={uslovi} onChange={(e) => setUslovi(e.target.checked)}
              className="mt-0.5 accent-kolo-green-700 w-5 h-5 shrink-0" />
            <span className="text-sm text-kolo-text">
              {t("kvacica_uslovi")}{" "}
              <Link href="/uslovi" target="_blank" className="text-kolo-green-700 underline">{t("uslovi_link")}</Link>{" "}
              <span className="text-kolo-muted">(v{AKT_USLOVI.verzija})</span>
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer py-2 min-h-11">
            <input type="checkbox" checked={politika} onChange={(e) => setPolitika(e.target.checked)}
              className="mt-0.5 accent-kolo-green-700 w-5 h-5 shrink-0" />
            <span className="text-sm text-kolo-text">
              {t("kvacica_uslovi")}{" "}
              <Link href="/privatnost" target="_blank" className="text-kolo-green-700 underline">{t("privatnost_link")}</Link>{" "}
              <span className="text-kolo-muted">(v{AKT_POLITIKA.verzija})</span>
            </span>
          </label>
        </div>

        {error && (
          <Obavestenje vrsta="greska" className="mb-4">{error}</Obavestenje>
        )}

        <Dugme
          onClick={prihvati}
          // Ne gasi se zbog neoznačenih kućica: klik tada kaže šta fali.
          disabled={prihvatanje}
          velicina="lg"
          punaSirina
        >
          {prihvatanje ? t("dugme_prihvatam_loading") : t("dugme_prihvatam")}
        </Dugme>

        {/*
          Izlaz iz gejta. Politika čl. 16 i Uslovi čl. 40 (v4.1.1): ograničenje pristupa
          do prihvatanja ne dira u prava na pristup, prenosivost i brisanje podataka.
          `/profil` je zato izuzet od prekrivača u AppShell-u — link mora da vodi negde
          gde se stvarno stiže, inače je odredba mrtvo slovo.
        */}
        <p className="text-xs text-kolo-muted mt-4 text-center">
          {t("pre_prihvatanja")}{" "}
          <Link href="/profil" className="text-kolo-green-700 underline">
            {t("podesavanja_profila")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
