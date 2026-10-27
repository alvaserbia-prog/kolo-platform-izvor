"use client";

import { NOVIH_RAZGOVORA_DNEVNO } from "@/lib/nov-clan-pravila";
import { useState, useRef, useEffect } from "react";
import { intlTag } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import CenaUnos from "@/components/CenaUnos";
import PodeliOglas from "@/components/PodeliOglas";
import { formatCenaGlavni, prikaziJedinicuCene, parsirajCenu, type CenaTip } from "@/lib/cena-oglas";
import { kategorijaKljuc, kategorijaEmoji } from "@/lib/kategorije";
import { PRIJAVA_RAZLOZI, type PrijavaRazlogKod } from "@/lib/moderacija";

/** Veza <label> → <input type="file"> pri izmeni oglasa. */
const ID_UNOSA_IZMENA = "pijaca-izmena-slike-unos";
import {
  MAX_SLIKA,
  MAX_UKUPNO,
  oslobodiPregled,
  porukaIzOdgovora,
  pripremiSlike,
  ukupnaVelicina,
  type IzabranaSlika,
} from "@/lib/slika-upload";
import { dogadjaj } from "@/lib/analitika";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";

interface OglasProps {
  id: string;
  title: string;
  description: string;
  tip: string;
  cenaTip: string;
  price: number | null;
  cenaDo: number | null;
  category: string;
  images: string[];
  location: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  sellerId: string;
  /**
   * `null` kad posmatrač pseudonim ne sme da vidi — dete sa roditeljem oglase vidi
   * bez pseudonima oglašivača, osim oglasa prijatelja (Pravilnik o učešću dece
   * čl. 5 st. 1 t. 2). Odluku donosi server.
   */
  sellerPseudonim: string | null;
  sellerVerified: boolean;
  /** Oglašivač je maloletan korisnik — pečat i objašnjenje su drugi (deca čl. 19, 24). */
  sellerMaloletan: boolean;
  /** Oglas u ime odobrenog gazdinstva (Pravilnik o gazdinstvima čl. 18 st. 2) — vodi na profil. */
  domace?: { gazdinstvoId: string; naziv: string } | null;
  isMine: boolean;
  /** Broj pregleda — prikazuje se samo oglašivaču. */
  pregledi: number;
  /** Razlog uklanjanja — šalje se samo vlasniku (Uslovi čl. 29 st. 2). */
  uklonjenRazlog: string | null;
}

interface Props {
  oglas: OglasProps;
  isVerified: boolean;
  /** Prijavljen posetilac sme da prijavi sporan oglas; gost ne. */
  jePrijavljen: boolean;
  /**
   * Da li je i sam posmatrač maloletan.
   *
   * 🔴 Odlučuje SAMO da li se pominje roditeljsko čitanje. Roditelj čita razgovor
   * deteta sa PUNOLETNIM licem (deca čl. 19 st. 3); razgovore između dece ne čita niko. Detetu
   * koje gleda tuđi dečji oglas ta rečenica bi bila neistinita.
   */
  posmatracMaloletan?: boolean;
  /**
   * Sme li posmatrač da POKRENE razgovor povodom oglasa — izračunato na serveru
   * (`smePokrenutiRazgovor`), istom funkcijom koju zove i `POST /api/poruke`.
   *
   * 🔴 Ne izvodi se iz `isVerified`. Maloletni nalog je trajno neverifikovan
   * (deca čl. 29 st. 2), pa je dete na svakom oglasu dobijalo poziv da postane redovan član
   * i link na `/verifikacija` — stranicu koju ne sme ni da otvori — dok mu je ruta
   * razgovor sve vreme dozvoljavala. `isVerified` od sada odlučuje samo o
   * prikazu telefona (Politika čl. 12 st. 2).
   */
  smePisati?: boolean;
  /** Zašto dete ne može da piše; `null` za punoletnog posmatrača. */
  razlogZabrane?: "ceka_odobrenje" | "odrasli_zabranjeni" | "samo_prijatelji" | null;
}

export default function OglasDetalj({
  oglas,
  isVerified,
  jePrijavljen,
  posmatracMaloletan = false,
  smePisati = false,
  razlogZabrane = null,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("pijaca");
  const tc = useTranslations("common");
  const router = useRouter();
  const [activeSlika, setActiveSlika] = useState(0);
  // Slika koja nije stigla se ne crta kao polomljena ikonica sa `alt` tekstom —
  // detalj tada izgleda kao oglas bez slike.
  const [slikaPala, setSlikaPala] = useState(false);
  const [deaktiviranjeLoading, setDeaktiviranjeLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const jePotraznja = oglas.tip === "POTRAZNJA";

  // Zabeleži pregled oglasa — jednom po pretraživaču dnevno, da povratak na
  // isti oglas ne naduvava brojač. Sopstvene preglede odbija server.
  useEffect(() => {
    if (oglas.isMine) return;
    const kljuc = `pregled:${oglas.id}`;
    const danas = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(kljuc) === danas) return;
      localStorage.setItem(kljuc, danas);
    } catch {
      // Privatni režim / blokirano skladište — svejedno prijavi pregled.
    }
    void fetch(`/api/pijaca/${oglas.id}/pregled`, { method: "POST" }).catch(() => {});
  }, [oglas.id, oglas.isMine]);

  async function handleKontakt() {
    setChatLoading(true);
    const res = await fetch("/api/poruke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `oglasId` služi samo prikazu povoda u razgovoru (putanja doprinosa
      // razmeni, koja je beležila upit, ukinuta je setom 4.8.0). Razgovor se otvara i bez njega.
      body: JSON.stringify({ userId: oglas.sellerId, oglasId: oglas.id }),
    });
    setChatLoading(false);
    if (!res.ok) return;
    dogadjaj("kontakt_oglasivaca", { izvor: "oglas" });
    const data = await res.json();
    router.push(`/poruke?k=${data.konverzacijaId}`);
  }

  const imaSlika = oglas.images.length > 0 && !slikaPala;
  const dostupan = oglas.status === "ACTIVE";

  async function handleDeaktiviraj() {
    setDeaktiviranjeLoading(true);
    const res = await fetch(`/api/pijaca/${oglas.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ akcija: "deaktiviraj" }),
    });
    setDeaktiviranjeLoading(false);
    if (res.ok) router.push("/profil/oglasi");
  }

  if (editMode) {
    return (
      <IzmeniOglas
        oglas={oglas}
        onCancel={() => setEditMode(false)}
        onSuccess={() => { setEditMode(false); router.refresh(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link href="/pijaca" className="text-kolo-muted hover:text-kolo-muted transition-colors text-sm">
          {t("nazad_pijaca")}
        </Link>
        <PodeliOglas naslov={oglas.title} />
      </div>

      <div className="bg-kolo-surface rounded-kartica border border-kolo-border overflow-hidden shadow-kartica">
        {/* Slike */}
        {imaSlika ? (
          <div className="space-y-2">
            <div className="w-full bg-kolo-bg flex justify-center">
              {/* Običan <img> (ne next/image): browser uzima prave dimenzije slike,
                  pa okvir ima tačan oblik slike — bez kvadratnih/letterbox traka.
                  Uspravna ide po visini, položena po širini; identično mobilni i desktop. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/pijaca/slika/${oglas.id}/${activeSlika}`}
                alt={oglas.title}
                className="w-auto h-auto max-h-[70vh] max-w-full object-contain"
                onError={() => setSlikaPala(true)}
              />
            </div>
            {oglas.images.length > 1 && (
              <div className="flex gap-2 px-4 pb-2">
                {oglas.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlika(i)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeSlika === i ? "border-kolo-green-500" : "border-transparent"
                    }`}
                  >
                    <Image
                      src={`/api/pijaca/slika/${oglas.id}/${i}`}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-[4/3] bg-kolo-bg flex items-center justify-center text-7xl">
            {kategorijaEmoji(oglas.category)}
          </div>
        )}

        {/* Detalji */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-xs text-kolo-muted font-medium uppercase tracking-wide">
                {t(`kategorija_${kategorijaKljuc(oglas.category)}`)}
              </span>
              <h1 className="kolo-naslov mt-0.5">{oglas.title}</h1>
            </div>
            <div className="shrink-0 text-right">
              {jePotraznja ? (
                <span className="inline-block bg-kolo-gold-100 text-kolo-gold-700 rounded-lg px-3 py-1.5 text-sm font-bold uppercase tracking-wide">
                  {t("trazi_se")}
                </span>
              ) : (
                <>
                  <p className="text-2xl font-bold text-kolo-green-700">{formatCenaGlavni(oglas, t("cena_po_dogovoru"))}</p>
                  {prikaziJedinicuCene(oglas) && <p className="text-sm text-kolo-green-700">{tc("poen")}</p>}
                </>
              )}
            </div>
          </div>

          {oglas.description && (
            <p className="text-sm text-kolo-muted leading-relaxed whitespace-pre-line">{oglas.description}</p>
          )}

          {/* Javna oznaka da oglašivač nije verifikovan (Uslovi 4.1.1). Vide je i
              neprijavljeni posetioci — pregled oglasa je javan, pa i upozorenje
              mora biti. Za razmenu odgovaraju sami korisnici (Pravilnik čl. 20 st. 2).

              🔴 Oglas deteta nosi SVOJU oznaku umesto „bez potvrde": maloletni
              nalog u lanac potvrda ne ulazi (deca čl. 29 st. 2), pa mu manjak potvrde nije
              stanje koje prolazi nego trajno svojstvo — a rečenica o tome ništa
              ne govori onome ko treba da zna da je sa druge strane dete i da
              razgovor čita njegov roditelj (deca čl. 19 st. 3). */}
          {oglas.sellerMaloletan ? (
            // Detetu koje gleda tuđi dečji oglas ostaje sam pečat: ceo tekst nosi
            // napomenu o roditeljskom uvidu, a nju roditelj ima nad razgovorom
            // deteta sa PUNOLETNIM licem (deca čl. 19 st. 3) — razgovore između dece ne čita
            // niko, pa bi ista rečenica detetu bila neistinita.
            posmatracMaloletan ? null : (
              <div className="flex items-start gap-2 text-xs text-kolo-green-700 bg-kolo-green-100 border border-kolo-green-500/20 rounded-xl px-3 py-2">
                <span className="shrink-0 bg-white/95 border-2 border-kolo-green-700 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md rotate-[-6deg]">
                  {t("oznaka_dete")}
                </span>
                <span>{t("oznaka_dete_opis")}</span>
              </div>
            )
          ) : !oglas.sellerVerified ? (
            <div className="flex items-start gap-2 text-xs text-kolo-gold-700 bg-kolo-gold-100 border border-kolo-gold-100 rounded-xl px-3 py-2">
              <span className="shrink-0 bg-white/95 border-2 border-kolo-gold-600 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md rotate-[-6deg]">
                {t("oznaka_neverifikovan")}
              </span>
              <span>{t("oznaka_neverifikovan_opis")}</span>
            </div>
          ) : null}

          {oglas.domace && (
            <div className="flex items-start gap-2 text-xs text-kolo-green-700 bg-kolo-green-100 border border-kolo-green-500/20 rounded-xl px-3 py-2">
              <span className="shrink-0 bg-white/95 text-kolo-green-700 border-2 border-kolo-green-700 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md rotate-[-6deg]">
                {t("oznaka_domace")}
              </span>
              <span>
                {t("oznaka_domace_gazdinstvo")}{" "}
                <Link href={`/gazdinstva/${oglas.domace.gazdinstvoId}`} className="font-semibold underline">
                  {oglas.domace.naziv}
                </Link>
                . {t("oznaka_domace_opis")}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-kolo-muted pt-1 border-t border-kolo-border">
            <span>
              {jePotraznja ? t("narucilac") : t("prodavac")}:{" "}
              {/* Profil maloletnog naloga se punoletnima ne otvara, pa ga ne nudimo kao link. */}
              {oglas.sellerPseudonim === null ? (
                <strong className="text-kolo-muted">{t("oglasivac_skriven")}</strong>
              ) : oglas.sellerMaloletan && !posmatracMaloletan ? (
                <strong className="text-kolo-muted"><Pseudonim>{oglas.sellerPseudonim}</Pseudonim></strong>
              ) : (
                <Link
                  href={profilHref({ id: oglas.sellerId, pseudonim: oglas.sellerPseudonim })}
                  className="font-bold text-kolo-green-700 hover:underline"
                >
                  <Pseudonim>{oglas.sellerPseudonim}</Pseudonim>
                </Link>
              )}
            </span>
            {/* Naselje vodi na Pijacu suženu na to mesto (isti `?mesto=` koji čita filter lokacije). */}
            {oglas.location && (
              <span>
                {t("lokacija")}:{" "}
                <Link
                  href={`/pijaca?mesto=${encodeURIComponent(oglas.location.trim())}`}
                  className="font-bold text-kolo-green-700 hover:underline"
                >
                  {oglas.location}
                </Link>
              </span>
            )}
            <span>{t("objavljeno")}: {new Date(oglas.createdAt).toLocaleDateString(intlTag(locale))}</span>
            {/* Brojač vidi samo oglašivač — povratna informacija njemu, a ne
                javna objava koliko je Pijaca (ne)posećena. */}
            {oglas.isMine && (
              <span>
                {t("pregleda")}: <strong className="text-kolo-muted">{oglas.pregledi}</strong>
              </span>
            )}
          </div>

          {oglas.phone && isVerified && (
            <div className="flex items-center gap-2 bg-kolo-bg rounded-kontrola px-4 py-3">
              <span className="text-xs text-kolo-muted">{t("kontakt_telefon_label")}</span>
              <a href={`tel:${oglas.phone}`} className="text-sm font-semibold text-kolo-green-700 hover:underline">
                {oglas.phone}
              </a>
            </div>
          )}

          {/* Status badge */}
          {oglas.status === "RAZMENJEN" && (
            <div className="bg-kolo-bg rounded-kontrola px-4 py-3 text-center text-sm font-semibold text-kolo-muted">
              {t("oglas_prodat")}
            </div>
          )}
          {oglas.status === "EXPIRED" && (
            <div className="bg-kolo-bg rounded-kontrola px-4 py-3 text-center text-sm font-semibold text-kolo-muted">
              {t("oglas_deaktiviran")}
            </div>
          )}
          {/* Uklonjen oglas — razlog vidi samo vlasnik (Uslovi čl. 29 st. 2). */}
          {oglas.status === "UKLONJEN" && (
            <Obavestenje vrsta="greska" naslov={t("oglas_uklonjen")}>
              {oglas.isMine && oglas.uklonjenRazlog && (
                <>
                  <div>{t("oglas_uklonjen_razlog", { razlog: oglas.uklonjenRazlog })}</div>
                  <div className="text-xs">{t("oglas_uklonjen_prigovor")}</div>
                </>
              )}
            </Obavestenje>
          )}

          {/* Kupac → kontakt prodavca (razmenu članovi dogovaraju međusobno; Protokol ne posreduje) */}
          {dostupan && !oglas.isMine && (
            <div className="space-y-2">
              {smePisati ? (
                <button
                  onClick={handleKontakt}
                  disabled={chatLoading}
                  className={`w-full rounded-kontrola font-semibold text-white transition-colors disabled:opacity-50 ${
                    posmatracMaloletan
                      ? "min-h-[3.25rem] bg-deca-korala-600 py-3.5 text-base hover:opacity-90"
                      : "min-h-12 bg-kolo-green-700 px-5 text-base hover:bg-kolo-green-800"
                  }`}
                >
                  {chatLoading
                    ? "..."
                    : posmatracMaloletan
                      ? /* Detetu se dugme imenuje pseudonimom: sedmogodišnjak ne
                           zna reč „oglašivač", ali zna ime. */
                        t("pisi_detetu", { pseudonim: oglas.sellerPseudonim ?? "" })
                      : jePotraznja
                        ? t("javi_se_narucilac")
                        : t("kontaktiraj_prodavca")}
                </button>
              ) : posmatracMaloletan ? (
                /* Dete koje ne može da piše dobija ISTINIT razlog i kraj koji se
                   vidi — nikad poziv da postane redovan član, jer to za maloletni
                   nalog nije put (deca čl. 29 st. 2). */
                <div className="rounded-xl border border-deca-sunce-400 bg-deca-sunce-100 px-4 py-3">
                  <p className="text-base text-deca-sunce-ink">
                    {razlogZabrane === "ceka_odobrenje"
                      ? t("dete_ceka_odobrenje")
                      : razlogZabrane === "samo_prijatelji"
                        ? t("dete_samo_prijatelji")
                        : t("dete_odrasli_zabranjeni")}
                  </p>
                </div>
              ) : !jePrijavljen ? (
                /* Gost: potvrdu ne može ni da zatraži dok nema nalog, pa mu se
                   nudi korak koji je na njemu — otvaranje naloga. */
                <Obavestenje vrsta="upozorenje">
                  <p>
                    <span className="font-semibold">{t("kontakt_samo_redovni")}</span>{" "}
                    {t("kontakt_gost_opis")}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/registracija"
                      className={klaseDugmeta() + " flex-1"}
                    >
                      {t("registruj_se")}
                    </Link>
                    <Link
                      href="/login"
                      className={klaseDugmeta({ varijanta: "sekundarno" }) + " flex-1"}
                    >
                      {t("prijavi_se")}
                    </Link>
                  </div>
                </Obavestenje>
              ) : (
                /* Nov član koji je danas već pokrenuo dozvoljen broj novih
                   razgovora (Uslovi čl. 14 st. 2, set 4.8.1). Kaže mu se istina
                   i kada može ponovo; u otvorenim razgovorima piše i dalje. */
                <Obavestenje vrsta="upozorenje">
                  <p>{t("kontakt_nov_limit", { broj: NOVIH_RAZGOVORA_DNEVNO })}</p>
                  <Link href="/poruke" className="font-semibold text-kolo-green-700 hover:underline">
                    {t("kontakt_nov_link")}
                  </Link>
                </Obavestenje>
              )}
            </div>
          )}

          {/* Prodavac — upravljanje */}
          {dostupan && oglas.isMine && (
            <div className="pt-2 border-t border-kolo-border flex gap-2">
              <button
                onClick={() => setEditMode(true)}
                className={klaseDugmeta() + " flex-1"}
              >
                {t("izmeni")}
              </button>
              <Link
                href="/profil/oglasi"
                className={klaseDugmeta({ varijanta: "sekundarno" }) + " flex-1"}
              >
                {t("moji_oglasi")}
              </Link>
              <button
                onClick={handleDeaktiviraj}
                disabled={deaktiviranjeLoading}
                className="flex-1 min-h-10 px-3 rounded-kontrola border border-kolo-danger/30 bg-kolo-surface text-kolo-danger text-sm font-semibold hover:bg-kolo-danger-light transition-colors disabled:opacity-60"
              >
                {deaktiviranjeLoading ? "..." : t("ukloni")}
              </button>
            </div>
          )}

          {/* Prijava spornog oglasa (Uslovi čl. 29 st. 2). Otvorena svim
              prijavljenima — pregled oglasa je javan, pa i neverifikovani vidi
              sporan sadržaj i treba da može da ga prijavi. */}
          {dostupan && !oglas.isMine && jePrijavljen && (
            <PrijaviOglas oglasId={oglas.id} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Prijava oglasa ─────────────────────────────────────────────────────────────

// Jedan spisak razloga — isti koji proverava server (`jeRazlogPrijave`).
const RAZLOZI = PRIJAVA_RAZLOZI;

function PrijaviOglas({ oglasId }: { oglasId: string }) {
  const t = useTranslations("pijaca");
  const [otvoreno, setOtvoreno] = useState(false);
  const [razlog, setRazlog] = useState<PrijavaRazlogKod>("ZABRANJENO_DOBRO");
  const [opis, setOpis] = useState("");
  const [salje, setSalje] = useState(false);
  const [poslato, setPoslato] = useState(false);
  const [greska, setGreska] = useState("");

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setSalje(true);
    setGreska("");
    try {
      const res = await fetch(`/api/pijaca/${oglasId}/prijavi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razlog, opis: opis.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? t("prijava_greska"));
        return;
      }
      setPoslato(true);
      setOtvoreno(false);
    } finally {
      setSalje(false);
    }
  }

  if (poslato) {
    return (
      <div className="pt-2 border-t border-kolo-border text-xs text-kolo-muted">
        {t("prijava_poslata")}
      </div>
    );
  }

  if (!otvoreno) {
    return (
      <div className="pt-2 border-t border-kolo-border">
        <button
          onClick={() => setOtvoreno(true)}
          className="inline-flex min-h-9 items-center text-xs text-kolo-muted hover:text-kolo-danger transition-colors"
        >
          {t("prijavi_oglas")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={posalji} className="pt-2 border-t border-kolo-border space-y-2">
      <div className="text-xs font-semibold text-kolo-text">{t("prijavi_oglas")}</div>
      <select
        value={razlog}
        onChange={(e) => setRazlog(e.target.value as (typeof RAZLOZI)[number])}
        aria-label={t("prijavi_oglas")}
        className={KLASE_UNOSA}
      >
        {RAZLOZI.map((r) => (
          <option key={r} value={r}>
            {t(`prijava_razlog_${r.toLowerCase()}`)}
          </option>
        ))}
      </select>
      <textarea
        value={opis}
        onChange={(e) => setOpis(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder={t("prijava_opis_placeholder")}
        aria-label={t("prijava_opis_placeholder")}
        className={KLASE_UNOSA}
      />
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={salje}
          className={klaseDugmeta({ varijanta: "opasno" }) + " flex-1"}
        >
          {salje ? "..." : t("prijava_posalji")}
        </button>
        <button
          type="button"
          onClick={() => setOtvoreno(false)}
          className={klaseDugmeta({ varijanta: "sekundarno" }) + " flex-1"}
        >
          {t("odustani")}
        </button>
      </div>
    </form>
  );
}

// ── Forma za izmenu oglasa ─────────────────────────────────────────────────────

function IzmeniOglas({
  oglas,
  onCancel,
  onSuccess,
}: {
  oglas: OglasProps;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("pijaca");
  const jePotraznja = oglas.tip === "POTRAZNJA";
  const [title, setTitle] = useState(oglas.title);
  const [description, setDescription] = useState(oglas.description);
  const [cenaTip, setCenaTip] = useState<CenaTip>((oglas.cenaTip as CenaTip) ?? "FIKSNA");
  const [price, setPrice] = useState(oglas.price != null ? String(oglas.price) : "");
  const [cenaDo, setCenaDo] = useState(oglas.cenaDo != null ? String(oglas.cenaDo) : "");
  const [location, setLocation] = useState(oglas.location ?? "");
  const [phone, setPhone] = useState(oglas.phone ?? "");
  // indeksi postojećih slika koje treba zadržati
  const [keepIndices, setKeepIndices] = useState<number[]>(
    oglas.images.map((_, i) => i)
  );
  const [noveSlike, setNoveSlike] = useState<IzabranaSlika[]>([]);
  const [loading, setLoading] = useState(false);
  const [obrada, setObrada] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const noveSlikeRef = useRef<IzabranaSlika[]>([]);

  const ukupnoSlika = keepIndices.length + noveSlike.length;

  // Blob adrese sličica se oslobađaju kad obrazac ode sa ekrana.
  useEffect(() => {
    noveSlikeRef.current = noveSlike;
  }, [noveSlike]);
  useEffect(() => {
    return () => {
      for (const s of noveSlikeRef.current) oslobodiPregled(s);
    };
  }, []);

  function ukloniPostojecu(idx: number) {
    setKeepIndices((prev) => prev.filter((i) => i !== idx));
  }

  // Iste pripreme kao pri objavi novog oglasa. Ranije ih ovde NIJE bilo: slika sa
  // telefona išla je u izvornoj veličini, pa je izmena oglasa sa dve fotografije
  // premašivala telo zahteva koje platforma prima i padala bez objašnjenja.
  async function handleNoveSlike(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const slobodno = MAX_SLIKA - keepIndices.length - noveSlike.length;
    if (slobodno <= 0) return;

    setObrada(true);
    setError("");
    try {
      let tekuce = noveSlike;
      let prekoracenje = false;

      const { formatOdbijen, velicinaOdbijena } = await pripremiSlike(
        files.slice(0, slobodno),
        (slika) => {
          const sledece = [...tekuce, slika];
          if (
            keepIndices.length + sledece.length > MAX_SLIKA ||
            ukupnaVelicina(sledece.map((s) => s.file)) > MAX_UKUPNO
          ) {
            oslobodiPregled(slika);
            prekoracenje = true;
            return;
          }
          tekuce = sledece;
          setNoveSlike(sledece);
        },
      );

      if (prekoracenje) setError(t("slike_ukupno_prevelike"));
      else if (formatOdbijen) setError(t("slika_format"));
      else if (velicinaOdbijena) setError(t("slika_prevelika"));
    } finally {
      setObrada(false);
    }
  }

  function ukloniNovu(i: number) {
    oslobodiPregled(noveSlike[i]);
    setNoveSlike((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const titleVal = title.trim();
    if (titleVal.length < 3) { setError(t("naslov_greska")); return; }
    const cena = parsirajCenu(cenaTip, price, cenaDo);
    if (!cena.ok) { setError(cena.error ?? t("cena_greska")); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", titleVal);
      fd.append("description", description.trim());
      fd.append("cenaTip", cenaTip);
      fd.append("price", price);
      fd.append("cenaDo", cenaDo);
      fd.append("location", location.trim());
      fd.append("phone", phone.trim());
      fd.append("keepImages", JSON.stringify(keepIndices));
      noveSlike.forEach((s, i) => fd.append(`nova_slika_${i}`, s.file));

      const res = await fetch(`/api/pijaca/${oglas.id}`, { method: "PATCH", body: fd });
      if (!res.ok) {
        const poruka = await porukaIzOdgovora(res);
        setError(
          poruka ??
            (res.status === 413
              ? t("slike_ukupno_prevelike")
              : `${t("greska_generalna")} (${res.status})`)
        );
        return;
      }
      onSuccess();
    } catch {
      setError(t("greska_cuvanje"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <button type="button" onClick={onCancel} className="inline-flex min-h-9 items-center text-sm text-kolo-muted hover:text-kolo-green-700">
          {t("nazad")}
        </button>
        <h1 className="kolo-naslov">{t("izmeni_oglas_naslov")}</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5 bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
        <Polje oznaka={t("naslov_label")}>
          <input type="text" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)}
            className={KLASE_UNOSA} />
        </Polje>

        <Polje oznaka={t("opis_label")}>
          <textarea rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)}
            className={KLASE_UNOSA + " resize-none"} />
        </Polje>

        {!jePotraznja && (
          <CenaUnos
            cenaTip={cenaTip}
            setCenaTip={setCenaTip}
            price={price}
            setPrice={setPrice}
            cenaDo={cenaDo}
            setCenaDo={setCenaDo}
            t={t}
          />
        )}

        <Polje oznaka={<>{t("lokacija_label")} <span className="text-kolo-muted font-normal">{t("lokacija_opciono")}</span></>}>
          <input type="text" maxLength={60} value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder={t("lokacija_placeholder")}
            className={KLASE_UNOSA} />
        </Polje>

        <Polje oznaka={<>{t("kontakt_telefon")} <span className="text-kolo-muted font-normal">{t("lokacija_opciono")}</span></>}>
          <input type="tel" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder={t("kontakt_placeholder")}
            className={KLASE_UNOSA} />
        </Polje>

        {/* Slike */}
        <div>
          <p className="block text-sm font-semibold text-kolo-muted mb-2">
            {t("slike_label")} <span className="text-kolo-muted font-normal">{t("slike_count", { count: ukupnoSlika })}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Postojeće slike */}
            {oglas.images.map((_, idx) => (
              keepIndices.includes(idx) && (
                <div key={`e-${idx}`} className="relative w-20 h-20 rounded-xl border border-kolo-border overflow-hidden bg-kolo-bg">
                  <Image
                    src={`/api/pijaca/slika/${oglas.id}/${idx}`}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => ukloniPostojecu(idx)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )
            ))}
            {/* Nove slike */}
            {noveSlike.map((s, i) => (
              <div key={s.pregled} className="relative w-20 h-20 rounded-xl border border-kolo-green-100 overflow-hidden bg-kolo-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.pregled} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => ukloniNovu(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            {/* Dodaj novu */}
            {/* Isti razlog kao na obrascu za nov oglas: birač otvara <label>, ne
                programski klik na skriveni <input> (iOS tada ne vrati izbor). */}
            {ukupnoSlika < MAX_SLIKA && (
              <label
                htmlFor={ID_UNOSA_IZMENA}
                aria-disabled={obrada}
                className={`w-20 h-20 rounded-xl border-2 border-dashed border-kolo-border flex items-center justify-center text-kolo-muted hover:border-kolo-muted transition-colors text-xl cursor-pointer ${obrada ? "opacity-50 pointer-events-none" : ""}`}
              >
                {obrada ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                ) : (
                  "+"
                )}
              </label>
            )}
          </div>
          <input id={ID_UNOSA_IZMENA} ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleNoveSlike} />
          {/* Kad je maksimum dostignut, dugme „+" nestane — bez ove rečenice to
              izgleda kao da dodavanje slika ne radi, a ne kao da je popunjeno. */}
          {ukupnoSlika >= MAX_SLIKA && (
            <p className="mt-1.5 text-xs text-kolo-muted">{t("slike_popunjeno", { max: MAX_SLIKA })}</p>
          )}
          <p className="mt-1.5 text-xs text-kolo-muted">{t("slike_hint")}</p>
        </div>

        {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}

        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className={klaseDugmeta({ varijanta: "sekundarno", velicina: "lg" }) + " flex-1"}>
            {t("otkazi_btn")}
          </button>
          <button type="submit" disabled={loading || obrada}
            className={klaseDugmeta({ velicina: "lg" }) + " flex-1"}>
            {loading ? t("cuvam") : t("sacuvaj_izmene")}
          </button>
        </div>
      </form>
    </div>
  );
}
