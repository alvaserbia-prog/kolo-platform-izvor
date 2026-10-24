import type { Metadata } from "next";
import { intlTag } from "@/lib/format";
import Image from "next/image";
import SlikaOglasa from "@/components/SlikaOglasa";
import { kategorijaEmoji } from "@/lib/kategorije";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import KomeKartice from "@/components/KomeKartice";
import DrustveneMreze from "@/components/DrustveneMreze";
import { prisma } from "@/lib/prisma";
import { USLOV_RAZMENE } from "@/lib/razmena-brojac-pravila";
import { usloviVidljivostiOglasa } from "@/lib/protokol/deca";
import { USLOV_CLANA_U_SPISKU } from "@/lib/clanovi-spisak";
import { getTranslations, getLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { formatCenaGlavni, prikaziJedinicuCene } from "@/lib/cena-oglas";
import { KATEGORIJE } from "@/lib/kategorije";
import { PRAG_PRVE_ZADRUGE } from "@/lib/zadruga-pravila";
import Obavestenje from "@/components/ui/Obavestenje";
import { klaseDugmeta } from "@/components/ui/Dugme";

/** Sekundarno dugme na tamnozelenoj podlozi (hero) — `Dugme` nema tamnu varijantu. */
const DUGME_NA_TAMNOM =
  "inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-kontrola border border-white/40 text-base font-semibold text-white hover:bg-white/10 transition-colors";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return pageMetadata({
    title: t("meta_title"),
    description: t("meta_desc"),
    path: "/",
  });
}

async function getPijacaPreview() {
  try {
    const listings = await prisma.marketplaceListing.findMany({
      // Oglas maloletnog korisnika se ovde ne prikazuje nikada (Modul Deca, čl. 13):
      // stranica je javna i keširana, pa se služi neprijavljenom posmatraču — a njemu
      // dečji oglas ne pripada ni uz roditeljsku saglasnost.
      where: { status: "ACTIVE", seller: usloviVidljivostiOglasa(null) },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        cenaTip: true,
        price: true,
        cenaDo: true,
        category: true,
        location: true,
        createdAt: true,
        images: true,
        seller: { select: { pseudonim: true } },
      },
    });

    // Uzmi jedan oglas iz svake kategorije (prvih 6 različitih), onda dopuni najnovijim
    const seen = new Set<string>();
    const result = [];
    for (const l of listings) {
      if (!seen.has(l.category) && result.length < 6) {
        seen.add(l.category);
        result.push(l);
      }
    }
    // Dopuni ako ima manje od 6 različitih kategorija
    if (result.length < 6) {
      for (const l of listings) {
        if (result.length >= 6) break;
        if (!result.find((r) => r.id === l.id)) result.push(l);
      }
    }
    // Prikaz ide redom kojim su kategorije nabrojane u `KATEGORIJE` — hrana,
    // njiva i ručni rad na početku, znanje i kreativa (sajtovi, fotografisanje)
    // pri kraju. Izbor oglasa i dalje bira najnovije po kategoriji; ovo menja
    // samo redosled prikaza, da naslovnu otvara ono što se rukama pravi.
    const redosled = (k: string) => {
      const i = (KATEGORIJE as readonly string[]).indexOf(k);
      return i === -1 ? KATEGORIJE.length : i;
    };
    result.sort((a, b) => redosled(a.category) - redosled(b.category));
    return result;
  } catch {
    return [];
  }
}

// Naslovnu vidi samo gost (prijavljeni se preusmeravaju na /dashboard). Po
// gradiranoj vidljivosti (Politika čl. 6), gost vidi SAMO agregate — ne
// pojedinačne transakcije ni pseudonime. Četiri pokazatelja: verifikovani
// članovi (poverenje), transakcije među članovima (samo tip TRANSFER — bez
// emisija Protokola, i bez prepisa ispod praga iz `USLOV_RAZMENE`), aktivni
// oglasi (pregled oglasa je ionako javan, čl. 16)
// i ukupno evidentiranih POEN-a. Opticaj se računa kao zbir pozitivnih
// stanja (pod zero-sum jednako apsolutnoj vrednosti minusa Protokola) — bez
// zavisnosti od ID-ja Protokol novčanika. Zbir ide preko SVIH ne-Protokol
// novčanika, uključujući negativne (nadoknada čl. 20b, poništen prepis, otpis
// prijateljstva); filtriranje na `balance > 0` bi prikazalo veći opticaj nego
// što ga ima.
async function getAgregati() {
  try {
    const [brojClanova, brojTransfera, brojOglasa, opticajAgg] = await Promise.all([
      // 🔴 Samo živo stanje (CLAUDE.md, pravilo 19; `docs/merenje-stanja.md`):
      // aktivan nalog, a razmena samo kad su obe strane aktivni nalozi. Goli
      // `verified: true` je brojao i ugašene i isključene naloge.
      prisma.user.count({ where: { ...USLOV_CLANA_U_SPISKU, verified: true } }),
      prisma.transaction.count({
        where: {
          ...USLOV_RAZMENE,
          fromWallet: { user: USLOV_CLANA_U_SPISKU },
          toWallet: { user: USLOV_CLANA_U_SPISKU },
        },
      }),
      // 🔴 Isti uslov kao spisak na Pijaci za gosta (`src/app/pijaca/page.tsx`).
      // Goli `status: "ACTIVE"` je brojao i oglase koje Pijaca ne prikazuje (oglas
      // deteta, nalog deteta bez roditelja), pa je naslovna pokazivala više oglasa
      // nego što ih posetilac nađe — a takav broj može da oda da dete ima oglas.
      prisma.marketplaceListing.count({ where: { status: "ACTIVE", seller: usloviVidljivostiOglasa(null) } }),
      prisma.wallet.aggregate({ _sum: { balance: true }, where: { type: { not: "PROTOKOL" } } }),
    ]);
    return {
      brojClanova,
      brojTransfera,
      brojOglasa,
      opticaj: Number(opticajAgg._sum.balance ?? 0),
    };
  } catch {
    return { brojClanova: 0, brojTransfera: 0, brojOglasa: 0, opticaj: 0 };
  }
}

// Sekcija o domaćim proizvođačima se prikazuje tek kad na mapi ima šta da se vidi
// — isti prag kao pregled Pijace (tri). Broje se samo odobrena gazdinstva, jedina
// koja mapa prikazuje (Pravilnik o gazdinstvima čl. 11).
const MIN_GAZDINSTAVA_ZA_SEKCIJU = 3;

async function getBrojGazdinstava() {
  try {
    return await prisma.gazdinstvo.count({ where: { status: "ODOBRENO" } });
  } catch {
    return 0;
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  const locale = await getLocale();
  const t = await getTranslations("landing");

  const [pijacaOglasi, agregati, brojGazdinstava] = await Promise.all([
    getPijacaPreview(),
    getAgregati(),
    getBrojGazdinstava(),
  ]);

  // Ikone su oznake iz seta u `KomeKartice` (ranije emodži — vidi komentar tamo);
  // jezički su neutralne i ostaju u kodu, tekst dolazi iz i18n.
  // Prva kartica govori zajednici kao celini (udruženje, mesna zajednica,
  // zadruga), ostale pojedincu (revizija teksta 23.10.2026). Prag prve zadruge
  // čita se iz pravila (pravilo 10).
  const komeKartice = [
    { ikona: "mreza", naslov: t("kome_udruzenja_naslov"), opis: t("kome_udruzenja_opis", { prag: PRAG_PRVE_ZADRUGE }), link: { href: "/zadruge", label: t("kome_udruzenja_link") } },
    // Veze ka prijavi (odluka vlasnika, 24.10.2026): proizvođaču i domaćici gazdinstvo;
    // firmi upis sa stranice Firme (jedini ulaz za firmu, donacije čl. 6a).
    { ikona: "klica", naslov: t("kome_1_naslov"), opis: t("kome_1_opis"), link: { href: "/gazdinstva", label: t("kome_gazdinstvo_link") } },
    { ikona: "alat", naslov: t("kome_2_naslov"), opis: t("kome_2_opis") },
    { ikona: "vreme", naslov: t("kome_3_naslov"), opis: t("kome_3_opis") },
    { ikona: "kuvanje", naslov: t("kome_4_naslov"), opis: t("kome_4_opis"), link: { href: "/gazdinstva", label: t("kome_gazdinstvo_link") } },
    { ikona: "porodica", naslov: t("kome_5_naslov"), opis: t("kome_5_opis") },
    { ikona: "pocetak", naslov: t("kome_6_naslov"), opis: t("kome_6_opis") },
    // Preduzetnici i lokalne firme (vlasnik, 24.10.2026) umesto „Ljudi koji drže do
    // svog kraja": firma ulazi kao pokrovitelj, upisom sa stranice Firme. Tekst ne
    // obećava promociju ni korist (donacije čl. 13, R-17).
    { ikona: "firma", naslov: t("kome_firme_naslov"), opis: t("kome_firme_opis"), link: { href: "/firme", label: t("kome_firma_link") } },
  ];

  const primerKoraci = [
    { naslov: t("primer_korak_1_naslov"), opis: t("primer_korak_1_opis") },
    { naslov: t("primer_korak_2_naslov"), opis: t("primer_korak_2_opis") },
    { naslov: t("primer_korak_3_naslov"), opis: t("primer_korak_3_opis") },
  ];

  // `dodatak` ima samo treći korak — put za onoga ko još nikoga ne poznaje.
  const kakoKoraci: { br: string; naslov: string; opis: string; dodatak?: string }[] = [
    { br: "1", naslov: t("kako_funkcionise_korak_1_naslov"), opis: t("kako_funkcionise_korak_1_opis") },
    { br: "2", naslov: t("kako_funkcionise_korak_2_naslov"), opis: t("kako_funkcionise_korak_2_opis") },
    { br: "3", naslov: t("kako_funkcionise_korak_3_naslov"), opis: t("kako_funkcionise_korak_3_opis"), dodatak: t("kako_funkcionise_korak_3_dodatak") },
    { br: "4", naslov: t("kako_funkcionise_korak_4_naslov"), opis: t("kako_funkcionise_korak_4_opis") },
  ];

  return (
    <div className="min-h-screen bg-kolo-bg">

      <PublicHeader />

      <div className="max-w-[932px] mx-auto px-6 py-8 space-y-6 pb-20">

        {/* Redosled (odluka vlasnika, 22.10.2026): šta je KOLO → problem → bunar →
            koraci → šta se sada nudi → brojke → za koga → primer → ko je pokrenuo →
            poziv. Pitanja su link uz poziv, napredak ka prvoj zadruzi je na /zadruge,
            a cela priča osnivača u poglavlju „Ko stoji iza" na /kako-funkcionise. */}
        {/* ── SEKCIJA 1 — HERO ─────────────────────────────────────── */}
        <section className="bg-kolo-green-900 rounded-kartica p-6 md:p-12 text-white">
          <div className="grid md:grid-cols-[1fr_360px] gap-10 items-center">
            <div className="max-w-lg">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 tracking-tight">
                {t("hero_naslov")}
              </h1>
              <p className="text-white/90 text-lg md:text-xl leading-relaxed mb-7 whitespace-pre-line">
                {t("hero_podnaslov")}
              </p>
              {/* Glavni poziv je pridruživanje (zlatno, puno); „Kako to radi" je
                  sporedno (odluka vlasnika 22.10.2026 — zlatno je samo za „Pridruži se"). */}
              <div className="flex flex-wrap gap-3">
                <Link href="/registracija"
                  className={klaseDugmeta({ varijanta: "zlatno", velicina: "lg" })}>
                  {t("hero_cta_priduzi")}
                </Link>
                <Link href="/kako-funkcionise"
                  className={DUGME_NA_TAMNOM}>
                  {t("hero_cta_saznaj")} →
                </Link>
              </div>
              {/* „Besplatno" stoji jednom, ovde, a ne u natpisu dugmeta (revizija 23.10.2026). */}
              <p className="mt-3 text-sm text-white/70">{t("hero_besplatno")}</p>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <Image
                src="/kolo-hero-logo.png"
                alt="KOLO"
                width={385}
                height={403}
                priority
                sizes="385px"
                style={{ height: "auto", opacity: 0.97 }}
              />
            </div>
          </div>
        </section>

        {/* ── SEKCIJA 2 — PROBLEM KOJI SVI OSEĆAMO ────────────────── */}
        <section className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica p-6 md:p-8">
          <h2 className="inline-block bg-kolo-green-100 text-kolo-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            {t("problem_naslov")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col gap-3 items-center text-center">
                <p className="font-bold text-kolo-green-900 text-lg leading-snug tracking-tight">{t(`problem_${n}_naslov`)}</p>
                <p className="text-sm text-kolo-muted leading-relaxed">{t(`problem_${n}_opis`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SEKCIJA 3 — ŠTA KOLO MENJA ──────────────────────────────
            Odgovor na tri problema iznad. Slika bunara je izbačena (odluka
            vlasnika 23.10.2026); tri kartice ostaju jer jedine na naslovnoj kažu
            šta je POEN i ko postavlja pravila. */}
        <section className="space-y-6 text-center">
          <h2 className="inline-block bg-kolo-green-100 text-kolo-green-700 text-sm font-bold px-4 py-2 rounded-full tracking-wide uppercase">
            {t("alternativa_naslov")}
          </h2>

          <div className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica px-6 py-5 md:px-8 md:py-6 max-w-2xl mx-auto">
            <p className="text-kolo-green-900 font-bold leading-snug text-lg md:text-xl text-balance tracking-tight">
              {t("alternativa_podnaslov")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica p-6 flex flex-col gap-3 border-t-4 border-t-kolo-green-700">
              <h3 className="font-bold text-kolo-green-900 text-lg leading-snug tracking-tight">
                {t("alternativa_1_naslov")}
              </h3>
              <p className="text-sm text-kolo-text leading-relaxed">{t("alternativa_1_opis")}</p>
            </div>
            <div className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica p-6 flex flex-col gap-3 border-t-4 border-t-kolo-green-700">
              <h3 className="font-bold text-kolo-green-900 text-lg leading-snug tracking-tight">
                {t("alternativa_2_naslov")}
              </h3>
              <p className="text-sm text-kolo-text leading-relaxed">
                {t("alternativa_2_opis_start")}
                <strong className="text-kolo-green-900">{t("alternativa_2_istakni_poen")}</strong>
                {t("alternativa_2_opis_end")}
              </p>
            </div>
            <div className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica p-6 flex flex-col gap-3 border-t-4 border-t-kolo-green-700">
              <h3 className="font-bold text-kolo-green-900 text-lg leading-snug tracking-tight">
                {t("alternativa_3_naslov")}
              </h3>
              <p className="text-sm text-kolo-text leading-relaxed">{t("alternativa_3_opis")}</p>
            </div>
          </div>
        </section>

        {/* ── SEKCIJA 4 — KAKO FUNKCIONIŠE UKRATKO ────────────────── */}
        <section className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica p-6 md:p-8">
          <h2 className="inline-block bg-kolo-green-100 text-kolo-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            {t("kako_funkcionise_naslov")}
          </h2>
          <div className="space-y-0">
            {kakoKoraci.map((k, i, arr) => (
              <div key={k.br} className={`flex gap-5 items-start pt-4 ${i < arr.length - 1 ? "border-b border-kolo-border pb-4" : ""}`}>
                <div className="w-8 h-8 rounded-full bg-kolo-green-900 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {k.br}
                </div>
                <div>
                  <h3 className="font-semibold text-kolo-text text-sm mb-1">{k.naslov}</h3>
                  <p className="text-sm text-kolo-muted leading-relaxed text-body">{k.opis}</p>
                  {k.dodatak && (
                    <p className="text-sm text-kolo-green-700 leading-relaxed text-body mt-1.5">{k.dodatak}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-kolo-border">
            <Link href="/kako-funkcionise" className="text-sm font-medium text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
              {t("kako_funkcionise_link_postupak")} →
            </Link>
          </div>
        </section>

        {/* ── SEKCIJA 5 — PIJACA PREVIEW ──────────────────────────── */}
        {pijacaOglasi.length >= 3 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-kolo-green-900 tracking-tight">
                {t("pijaca_naslov")}
              </h2>
              <div className="flex flex-wrap justify-end gap-x-4 gap-y-1">
                <Link href="/pijaca" className="text-sm font-medium text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
                  {t("pijaca_cta")} →
                </Link>
              </div>
            </div>
            {pijacaOglasi.length < 6 && (
              <p className="text-xs text-kolo-muted">
                {t("pijaca_prazno")}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {pijacaOglasi.map((oglas) => (
                <Link
                  key={oglas.id}
                  href={`/pijaca/${oglas.id}`}
                  className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica overflow-hidden hover:shadow-md transition-shadow flex flex-col group"
                >
                  {/* Slika */}
                  <div className="relative w-full h-44 bg-kolo-bg overflow-hidden">
                    {oglas.images.length > 0 ? (
                      <SlikaOglasa
                        src={`/api/pijaca/slika/${oglas.id}/0`}
                        alt={oglas.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        rezerva={
                          <div className="w-full h-full flex items-center justify-center text-4xl" aria-hidden="true">
                            {kategorijaEmoji(oglas.category)}
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-kolo-muted/30">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4 flex items-start justify-between gap-2">
                    <p className="font-semibold text-kolo-text text-sm leading-snug group-hover:text-kolo-green-700 transition-colors line-clamp-2">
                      {oglas.title}
                    </p>
                    <span className="text-sm font-bold text-kolo-green-700 shrink-0 whitespace-nowrap">
                      {formatCenaGlavni(oglas, t("cena_po_dogovoru"))}{prikaziJedinicuCene(oglas) ? ` ${t("pijaca_poen")}` : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── SEKCIJA 5a — DOMAĆI PROIZVOĐAČI NA MAPI ───────────────
            🔴 Uz oznaku DOMAĆE uvek stoji da je Fondacija ne jemči (Pravilnik o
            gazdinstvima čl. 10, Uslovi čl. 16b). Bez reči „organski", „eko",
            „zdravo" — Fondacija sama ne hvali robu (Uslovi čl. 22b). */}
        {brojGazdinstava >= MIN_GAZDINSTAVA_ZA_SEKCIJU && (
          <section className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica p-6 md:p-8">
            <h2 className="text-xl font-bold text-kolo-green-900 tracking-tight">
              {t("domace_naslov")}
            </h2>
            <p className="text-sm text-kolo-text leading-relaxed mt-3 max-w-2xl">{t("domace_opis")}</p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                href="/gazdinstva"
                className={klaseDugmeta()}
              >
                {t("domace_cta_mapa")}
              </Link>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent("/gazdinstva/prijava")}`}
                className={klaseDugmeta({ varijanta: "sekundarno" })}
              >
                {t("domace_cta_prijava")}
              </Link>
            </div>
          </section>
        )}

        {/* ── SEKCIJA 6 — ŽIVI AGREGATI SISTEMA (samo ako ima ≥10 transakcija) ────────────── */}
        {agregati.brojClanova >= 10 && (
          <section className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica p-6 md:p-8">
            <h2 className="text-xl font-bold text-kolo-green-900 mb-5 text-center tracking-tight">
              {t("statistike_naslov")}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="bg-kolo-bg rounded-kontrola py-5">
                <div className="text-2xl md:text-3xl font-bold text-kolo-green-700 tabular-nums">
                  {agregati.brojClanova.toLocaleString(intlTag(locale))}
                </div>
                <div className="text-xs text-kolo-muted mt-1">{t("statistike_clan")}</div>
              </div>
              <div className="bg-kolo-bg rounded-kontrola py-5">
                <div className="text-2xl md:text-3xl font-bold text-kolo-green-700 tabular-nums">
                  {agregati.brojOglasa.toLocaleString(intlTag(locale))}
                </div>
                <div className="text-xs text-kolo-muted mt-1">{t("statistike_oglas")}</div>
              </div>
              <div className="bg-kolo-bg rounded-kontrola py-5">
                <div className="text-2xl md:text-3xl font-bold text-kolo-green-700 tabular-nums">
                  {agregati.brojTransfera.toLocaleString(intlTag(locale))}
                </div>
                <div className="text-xs text-kolo-muted mt-1">{t("statistike_transfer")}</div>
              </div>
              <div className="bg-kolo-bg rounded-kontrola py-5">
                <div className="text-2xl md:text-3xl font-bold text-kolo-green-700 tabular-nums">
                  {agregati.opticaj.toLocaleString(intlTag(locale))}
                </div>
                <div className="text-xs text-kolo-muted mt-1">{t("statistike_poen_evidentirano")}</div>
              </div>
            </div>
            <p className="text-xs text-kolo-muted mt-4 text-center">{t("statistike_faza")}</p>
            {/* Ulaz u Sistem za posetioca (odluka vlasnika, 24.10.2026): iste brojke,
                ceo pregled sa svim karticama. */}
            <p className="mt-3 text-center">
              <Link href="/sistem" className="inline-flex min-h-9 items-center text-sm font-semibold text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
                {t("statistike_ceo_sistem")}
              </Link>
            </p>

          </section>
        )}

        {/* ── SEKCIJA 7 — ZA KOGA JE KOLO ─────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-kolo-green-900 tracking-tight">
            {t("kome_naslov")}
          </h2>
          <KomeKartice
            kartice={komeKartice}
            vidljivo={komeKartice.length}
            labelJos={t("kome_prikazi_jos")}
            labelManje={t("kome_prikazi_manje")}
          />
        </section>

        {/* ── SEKCIJA 8 — PRIMER IZ PRAKSE ─────────────────────────── */}
        <section className="space-y-4">
          <h2 className="inline-block bg-kolo-green-100 text-kolo-green-700 text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide uppercase">
            {t("primer_naslov")}
          </h2>

          {/* Stupci povezani strelicama po hronologiji.
              Na md+ je red CSS grid sa tri reda (broj / naslov / opis), a kartice
              preuzimaju te iste redove kroz `subgrid` — tako naslovi i tekstovi
              počinju na istoj visini i kad naslov u jednom stupcu prelomi u dva reda. */}
          <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr] md:grid-rows-[auto_auto_1fr] md:items-stretch">
            {primerKoraci.map((k, i) => (
              <div key={k.naslov} className="contents">
                <div className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica p-5 flex flex-col gap-3 items-center text-center md:grid md:grid-rows-subgrid md:row-span-3 md:items-start md:justify-items-center">
                  <span className="w-14 h-14 rounded-full bg-kolo-green-100 text-kolo-green-700 inline-flex items-center justify-center text-2xl font-bold">{i + 1}</span>
                  <h3 className="font-semibold text-kolo-text text-sm">{k.naslov}</h3>
                  <p className="text-kolo-muted leading-relaxed text-xs">{k.opis}</p>
                </div>
                {i < primerKoraci.length - 1 && (
                  <div className="flex items-center justify-center text-kolo-muted shrink-0 md:row-span-3 md:self-center">
                    <svg className="w-6 h-6 rotate-90 md:rotate-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Suptilan most ka zaključku — izvan stubaca */}
          <p className="text-center text-sm text-kolo-muted italic">
            {t("primer_most")}
          </p>

          <Obavestenje vrsta="info" className="w-fit mx-auto">
            <p><strong className="text-kolo-green-900">{t("primer_napomena_bold")}</strong> {t("primer_napomena_1")}</p>
            <p>{t("primer_napomena_2")}</p>
          </Obavestenje>
        </section>

        {/* ── SEKCIJA 9 — KO JE POKRENUO KOLO ──────────────────────
            Sažeto na ime i put do cele priče (odluka vlasnika 22.10.2026): cela
            priča je u poglavlju „Ko stoji iza" na /kako-funkcionise, a skeptiku je
            dovoljno da odmah vidi ime i odakle je čovek. */}
        <section className="border border-kolo-border bg-kolo-surface rounded-kartica shadow-kartica p-5 md:p-6 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden ring-4 ring-kolo-green-100">
            <Image
              src="/nikola-saric-mantil.png"
              alt="Nikola Šarić"
              fill
              sizes="80px"
              className="object-cover object-top"
              style={{ transform: "scale(1.28)", transformOrigin: "center 22%" }}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xs font-semibold tracking-wide uppercase text-kolo-muted">{t("ko_stoji_naslov")}</h2>
            <p className="text-kolo-green-900 font-bold text-lg leading-tight mt-1">
              Nikola Šarić <span className="font-normal text-kolo-muted text-base">· {t("ko_stoji_lokacija")}</span>
            </p>
          </div>
          <Link href="/kako-funkcionise#ko-stoji-iza" className="inline-flex min-h-9 items-center text-sm font-semibold text-kolo-green-700 hover:text-kolo-green-900 transition-colors">
            {t("ko_stoji_fondacija")} →
          </Link>
        </section>

        {/* ── SEKCIJA 10 — CTA ─────────────────────────────────────── */}
        <section className="bg-kolo-green-700 rounded-kartica p-6 md:p-10 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
            {t("cta_naslov")}
          </h2>
          <p className="text-white/90 text-sm md:text-base mb-7 max-w-xl mx-auto leading-relaxed">
            {t("cta_opis")}
          </p>
          {/* Jedno dugme — na telefonu ide u punu širinu, da palac ne promaši. */}
          <div className="flex justify-center">
            <Link
              href="/registracija"
              className={`${klaseDugmeta({ varijanta: "zlatno", velicina: "lg" })} w-full sm:w-auto`}
            >
              {t("cta_priduzi")}
            </Link>
          </div>
          <p className="mt-5">
            <Link href="/cesto-postavljena-pitanja" className="text-sm text-white/80 hover:text-white underline underline-offset-4 transition-colors">
              {t("faq_tease_cta")}
            </Link>
          </p>
          <div className="mt-8 pt-6 border-t border-white/15">
            {/* Mreže idu POSLE dugmeta za pristup, ne u hero: izlaz sa sajta se
                nudi tek kad je poziv na registraciju već pročitan. */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-white/70">{t("cta_mreze")}</p>
              <DrustveneMreze tema="tamna" />
            </div>
          </div>
        </section>

      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <PublicFooter />

    </div>
  );
}
