"use client";

import { useState, useEffect, useRef } from "react";
import { intlTag } from "@/lib/format";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/ui/Logo";
import { useTranslations, useLocale } from "next-intl";
import JezikSvitcer from "@/components/JezikSvitcer";
import { raspolozivo } from "@/lib/protokol/nadoknada";
import Pojam from "@/components/Pojam";
import Pseudonim from "@/components/Pseudonim";
import PushObavestenja from "@/components/PushObavestenja";
import { useMe, useMePatch, type Notifikacija } from "@/hooks/useMe";
import { profilHref } from "@/lib/profil-link";

export default function Header({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const { data: session } = useSession();
  const t = useTranslations("header");

  return (
    <header className="shrink-0 bg-kolo-bg flex items-center justify-center sticky top-0 z-30 md:static">
      <div className="relative flex w-full h-14 md:h-16 items-center justify-between bg-kolo-green-900 before:absolute before:top-0 before:bottom-0 before:right-full before:w-screen before:bg-kolo-green-900 before:content-[''] after:absolute after:top-0 after:bottom-0 after:left-full after:w-screen after:bg-kolo-green-900 after:content-['']">

        {/* Leva strana: logo (desktop) / hamburger + logo (mobilno) */}
        <div className="flex items-center shrink-0">
          {/* Desktop: logo + naziv (klikabilno na početnu) + jezik switcher desno od naziva */}
          <div className="hidden md:flex items-center px-4 gap-3 shrink-0">
            <Link href="/pocetna" className="flex items-center gap-2.5 group">
              <Logo tema="tamna" velicina="md" prioritet />
            </Link>
            <JezikSvitcer />
          </div>
          {/* Mobilno: hamburger + logo */}
          <div className="flex md:hidden items-center gap-2 min-[375px]:gap-3 pl-2 pr-1">
            {/* Desno (poruke, zvono, profil) na telefonu: krugovi od 40 px na istoj
                podlozi kao „Meni" — sve što ima podlogu se pritiska; profil bez
                obruča (fotografija ima svoju ivicu), samo tanka svetla ivica. */}
            {/* Meni: puno dugme (blago svetla podloga, bez tankog okvira) sa rečju
                „Meni" — samu ikonicu sa tri crte stariji korisnici ne prepoznaju.
                Oblik dugmeta, ne veličina slova, kaže da se pritiska; logotip uz
                njega je `xs`, pa KOLO nije krupnije od „Meni" (dogovor specijalista). */}
            <button
              onClick={onMenuOpen}
              className="flex h-[42px] items-center gap-2 rounded-full bg-white/12 pl-3 pr-4 text-white hover:bg-white/20 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span className="text-[17px] font-semibold">{t("aria_meni")}</span>
            </button>
            <Link href="/pocetna" className="flex items-center">
              <Logo tema="tamna" velicina="xs" prioritet />
            </Link>
          </div>
        </div>

        {/* Sredina: Prepiši POEN (Prijavi grešku je od 23.10.2026 na stranici Pomoć) */}
        <div className="flex-1 flex justify-start md:justify-center pl-2 md:pl-0">
          <div className="flex items-center gap-3 md:gap-5 md:ml-[1cm]">
            {/* Na telefonu se ne prikazuje: ista radnja stoji krupno na kartici
                POEN, a ovde je bila pilula visoka 26 px. */}
            <Link
              href="/novcanik"
              className="hidden md:inline-flex px-4 py-1.5 bg-kolo-green-600 hover:bg-kolo-green-500 text-white text-sm font-semibold rounded-kontrola border border-white/70 transition-colors whitespace-nowrap"
            >
              {t("upisi_poen")}
            </Link>
          </div>
        </div>

        {/* Desna strana: balans + poruke + notifikacije + profil */}
        <div className="flex items-center gap-1 min-[375px]:gap-1.5 md:gap-3 pr-2 md:px-4">
          {session ? (
            <>
              <BalansHeader />
              <div className="hidden sm:block w-px h-4 bg-white/20" />
              {/* Pomoć — jedan ulaz (vodič, česta pitanja, prijava greške); na telefonu
                  stoji na dnu bočnog menija. */}
              <Link
                href="/pomoc"
                className="w-9 h-9 hidden md:flex items-center justify-center rounded-full text-white/60 ring-2 ring-white/20 hover:text-white hover:ring-white/50 transition-all shrink-0"
                aria-label={t("pomoc")}
                title={t("pomoc")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </Link>
              {/* Poruke ikonica sa badge-om nepročitanih */}
              <PorukeIkona ariaLabel={t("aria_poruke")} />
              {/* Notifikacije */}
              <BellNotifikacije />
              {/* Profilni krug */}
              <ProfilMeni
                userId={session.user.id}
                pseudonim={session.user.pseudonim}
              />
            </>
          ) : (
            <span className="text-white/50 text-sm">{t("ucitavanje")}</span>
          )}
        </div>
      </div>
    </header>
  );
}

function BalansHeader() {
  const locale = useLocale();
  const t = useTranslations("header");
  // Balans dolazi iz keširanog /api/me (React Query) — osvežava ga `balans-updated`
  // event preko useMeEventBridge (montiran u AppShell). Bez zasebnog fetch-a.
  const { data: me } = useMe();
  const balans = me?.balance ?? null;

  return (
    <span className="text-white/60 text-sm hidden sm:inline-flex items-center gap-1">
      <span className="font-semibold text-white text-sm">
        {/* Negativan zapis (nadoknada, čl. 20b) se u zaglavlju prikazuje kao 0 —
            raspoloživo je nula, a sama nadoknada ima svoj red u Novčaniku. */}
        {balans === null ? "..." : raspolozivo(balans).toLocaleString(intlTag(locale))}
      </span>
      <Pojam
        termin="POEN"
        objasnjenje={t("poen_objasnjenje")}
      />
    </span>
  );
}

function ProfilMeni({ userId, pseudonim }: { userId: string; pseudonim: string }) {
  const router = useRouter();
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  // Avatar iz keširanog /api/me; `avatar-updated` event invalidira keš (bridge).
  const { data: me } = useMe();
  const avatar = me?.avatar ?? null;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Resetuj error state kada se avatar prosledi (nova slika)
  useEffect(() => {
    setImageError(false);
  }, [avatar]);

  const inicijal = pseudonim.charAt(0).toUpperCase();

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 md:w-9 md:h-9 rounded-full overflow-hidden ring-1 ring-white/15 md:ring-2 md:ring-white/20 hover:ring-white/50 transition-all shrink-0"
        aria-label={t("aria_profil")}
      >
        {avatar && !imageError ? (
          avatar.startsWith("http") ? (
            // R2 URL → next/image: optimizuje (256→36px, AVIF/WebP) i kešira dugo
            // (minimumCacheTTL), pa se avatar ne preuzima iznova na svakoj stranici.
            <Image
              src={avatar}
              alt={pseudonim}
              width={36}
              height={36}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            // Legacy base64 data: URI — next/image ne optimizuje data URL-ove.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={pseudonim}
              width={36}
              height={36}
              decoding="async"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )
        ) : (
          <div className="w-full h-full bg-kolo-green-700 flex items-center justify-center text-white font-bold text-xs">
            {inicijal}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-auto min-w-max bg-kolo-surface rounded-kartica shadow-xl border border-kolo-border z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-kolo-border">
            <p className="text-sm font-semibold text-kolo-text truncate text-right"><Pseudonim>{pseudonim}</Pseudonim></p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); router.push(profilHref({ id: userId, pseudonim })); }}
              className="w-full text-right px-4 py-2.5 text-sm text-kolo-text hover:bg-kolo-bg transition-colors flex items-center justify-end gap-3"
            >
              {t("moj_profil")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>
              </svg>
            </button>
            <button
              onClick={() => { setOpen(false); router.push("/profil"); }}
              className="w-full text-right px-4 py-2.5 text-sm text-kolo-text hover:bg-kolo-bg transition-colors flex items-center justify-end gap-3"
            >
              {t("podesi_profil")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
            {/* Moje firme — prečica na Pokroviteljstvo (upisi pokrovitelja, donacije čl. 6a).
                Maloletni korisnik upis ne vrši (čl. 6a st. 1), pa mu se prečica ne nudi. */}
            {!me?.maloletan && <button
              onClick={() => { setOpen(false); router.push("/postani-pokrovitelj"); }}
              className="w-full text-right px-4 py-2.5 text-sm text-kolo-text hover:bg-kolo-bg transition-colors flex items-center justify-end gap-3"
            >
              {t("moje_firme")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/>
              </svg>
            </button>}
            {/* Moja deca — ulaz roditelja (paket F, F1-1, F10-1): kartica na profilu, gde
                su deca, poziv deteta i dugmad za otvaranje i preuzimanje naloga. Stoji
                svakom punoletnom, kao „Moje firme" — inače onaj ko tek hoće da doda
                prvo dete nema kuda da uđe. */}
            {me && !me.maloletan && <button
              onClick={() => { setOpen(false); router.push("/profil#moja-deca"); }}
              className="w-full text-right px-4 py-2.5 text-sm text-kolo-text hover:bg-kolo-bg transition-colors flex items-center justify-end gap-3"
            >
              {t("moja_deca")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><path d="M15 20v-1a3.5 3.5 0 0 1 6 0v1"/>
              </svg>
            </button>}
          </div>
          <div className="border-t border-kolo-border" />
          <div className="py-1">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full text-right px-4 py-2.5 text-sm text-kolo-danger hover:bg-kolo-danger-light transition-colors flex items-center justify-end gap-3"
            >
              {t("odjavi_se")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const TIP_BOJA: Record<string, string> = {
  transfer_primljen: "text-kolo-green-700",
  verifikacija_odobrena: "text-kolo-green-700",
  verifikacija_odbijena: "text-kolo-danger",
  preporuka_nagradjeni: "text-kolo-gold-700",
  oglas_kupljen: "text-kolo-green-700",
  info: "text-kolo-muted",
};

function PorukeIkona({ ariaLabel }: { ariaLabel: string }) {
  // Broj nepročitanih iz keširanog /api/me. Stranica /poruke emituje
  // „poruke-procitane" → bridge invalidira keš → badge se osveži.
  const { data: me } = useMe();
  const neprocitano = me?.neprocitanoPoruke ?? 0;

  return (
    <Link
      href="/poruke"
      className="relative w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/20 md:bg-transparent md:text-white/60 md:ring-2 md:ring-white/20 md:hover:bg-transparent md:hover:text-white md:hover:ring-white/50 transition-all shrink-0"
      aria-label={ariaLabel}
    >
      <svg width="18" height="18" className="w-[22px] h-[22px] md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      {neprocitano > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-kolo-danger text-white text-xs font-bold rounded-full ring-2 ring-white flex items-center justify-center leading-none md:top-0.5 md:right-0.5 md:min-w-4 md:h-4 md:px-0 md:text-[11px] md:ring-0">
          {neprocitano > 9 ? "9+" : neprocitano}
        </span>
      )}
    </Link>
  );
}

function BellNotifikacije() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("header");
  const tc = useTranslations("common");
  // Podaci iz keširanog /api/me; lokalni state samo za UI (dropdown/toast).
  const { data: me } = useMe();
  const patchMe = useMePatch();
  const notifikacije = me?.notifikacije ?? [];
  const neprocitano = me?.notifNeprocitano ?? 0;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Notifikacija | null>(null);
  const prevNeprocitanoRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Toast za novo obaveštenje: okida se kada broj nepročitanih poraste između
  // dve osvežene vrednosti keša (/api/me poll ili invalidacija).
  useEffect(() => {
    if (prevNeprocitanoRef.current !== null && neprocitano > prevNeprocitanoRef.current) {
      const najnovija = notifikacije.find((n) => !n.procitana);
      if (najnovija) setToast(najnovija);
    }
    prevNeprocitanoRef.current = neprocitano;
  }, [neprocitano, notifikacije]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  async function oznaciProcitane() {
    setLoading(true);
    // Optimistički u kešu: sve pročitano → badge 0.
    patchMe({ notifNeprocitano: 0, notifikacije: notifikacije.map((n) => ({ ...n, procitana: true })) });
    await fetch("/api/notifikacije", { method: "PATCH" }).catch(() => {});
    setLoading(false);
  }

  async function handleKlik(n: Notifikacija) {
    setOpen(false);
    if (!n.procitana) {
      // Optimistički označi samo ovu kao pročitanu → badge padne za 1.
      patchMe({
        notifNeprocitano: Math.max(0, neprocitano - 1),
        notifikacije: notifikacije.map((x) => (x.id === n.id ? { ...x, procitana: true } : x)),
      });
      fetch("/api/notifikacije", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
    }
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative flex items-center" ref={panelRef}>
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] w-80 bg-kolo-surface rounded-kartica shadow-xl border border-kolo-border p-4 flex items-start gap-3 animate-slide-up"
          onClick={() => { setToast(null); if (toast.link) router.push(toast.link); }}
          style={{ cursor: toast.link ? "pointer" : "default" }}
        >
          <div className="mt-0.5 w-2 h-2 rounded-full bg-kolo-green-700 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${TIP_BOJA[toast.tip] ?? "text-kolo-text"}`}>{toast.naslov}</p>
            <p className="text-xs text-kolo-muted mt-0.5 leading-relaxed line-clamp-2">{toast.tekst}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setToast(null); }} aria-label={tc("zatvori")} className="w-8 h-8 -m-1.5 text-kolo-muted hover:text-kolo-text text-lg leading-none shrink-0">×</button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/20 md:bg-transparent md:text-white/60 md:ring-2 md:ring-white/20 md:hover:bg-transparent md:hover:text-white md:hover:ring-white/50 transition-all shrink-0"
        aria-label={t("aria_notifikacije")}
      >
        <svg width="18" height="18" className="w-[22px] h-[22px] md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {neprocitano > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-kolo-danger text-white text-xs font-bold rounded-full ring-2 ring-white flex items-center justify-center leading-none md:top-0.5 md:right-0.5 md:min-w-4 md:h-4 md:px-0 md:text-[11px] md:ring-0">
            {neprocitano > 9 ? "9+" : neprocitano}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-kolo-surface rounded-kartica shadow-xl border border-kolo-border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-kolo-border">
            <span className="text-sm font-semibold text-kolo-text">{t("obavestenja")}</span>
            {neprocitano > 0 && (
              <button onClick={oznaciProcitane} disabled={loading} className="text-xs text-kolo-green-700 hover:underline disabled:opacity-50">
                {t("oznaci_procitane")}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifikacije.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-kolo-muted">{t("nema_obavestenja")}</div>
            ) : (
              notifikacije.map((n) => (
                <button key={n.id} onClick={() => handleKlik(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-kolo-bg transition-colors border-b border-kolo-border/50 last:border-0 ${!n.procitana ? "bg-kolo-green-100/30" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.procitana && <div className="mt-1.5 w-2 h-2 rounded-full bg-kolo-danger shrink-0" />}
                    <div className={!n.procitana ? "" : "pl-4"}>
                      <p className={`text-sm font-semibold ${TIP_BOJA[n.tip] ?? "text-kolo-text"}`}>{n.naslov}</p>
                      <p className="text-xs text-kolo-muted mt-0.5 leading-relaxed">{n.tekst}</p>
                      <p className="text-[11px] text-kolo-border mt-1">
                        {new Date(n.createdAt).toLocaleString(intlTag(locale), { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          {/* Web Push — uključi obaveštenja na telefonu/uređaju (radi i kad je sajt zatvoren). */}
          <div className="px-4 py-3 border-t border-kolo-border">
            <PushObavestenja />
          </div>
        </div>
      )}
    </div>
  );
}
