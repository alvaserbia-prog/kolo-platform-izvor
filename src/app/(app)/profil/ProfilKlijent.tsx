"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MojiPristanci } from "@/components/profil/MojiPristanci";
import { intlTag } from "@/lib/format";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import LokacijaSearch from "@/components/LokacijaSearch";
import Pseudonim from "@/components/Pseudonim";
import CategoryChips from "@/components/CategoryChips";
import PushObavestenja from "@/components/PushObavestenja";
import { useTranslations, useLocale } from "next-intl";
import OznakaStatusa, { type ZrnoPolozaj } from "@/components/OznakaStatusa";
import type { StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import type { NaStaSeCeka } from "@/lib/deca-pravila";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Prekidac from "@/components/ui/Prekidac";
import NaslovStranice from "@/components/ui/NaslovStranice";

const MAX_DISPLAY = 440;

// TIPOVI_ODLUKA labels are defined inside the component using t()

interface ProfilProps {
  user: {
    id: string;
    pseudonim: string;
    verified: boolean;
    verifiedAt: string | null;
    pseudonimChangedAt: string | null;
    balance: number;
    createdAt: string;
    location: string | null;
    telefon: string | null;
    punoIme: string | null;
    opis: string | null;
    avatar: string | null;
    prikaziLokaciju: boolean;
    prikaziOpis: boolean;
    prikaziPunoIme: boolean;
    prikaziTelefon: boolean;
    prikaziBilans: boolean;
    prikaziZrno: boolean;
    prikaziRangDonacija: boolean;
    prikaziOglase: boolean;
    emailObavestenja: boolean;
  };
  praceneKategorije: string[];
  /**
   * Maloletni nalog (Modul Deca).
   *
   * 🔴 Do 31.08.2026. je detetu renderovan CEO odrasli profil, a dečji odeljci su
   * se samo dopisivali ispod njega. Sedmogodišnjak je tako na svom profilu imao
   * polje Telefon sa klizačem vidljivosti, „Prigovor na odluku" sa listom vrsta
   * odluka, GDPR eksport i crveno „Obriši nalog" iza jednog otkucanog pseudonima.
   * Deca tog uzrasta pritiskaju crvena dugmad da vide šta rade.
   */
  maloletan?: boolean;
  /** Stanje naloga deteta (deca čl. 5) — za odeljke koji zavise od preuzimanja naloga. */
  stanjeDeteta?: "NA_CEKANJU" | "POVEZANO" | "AKTIVNO" | null;
  /**
   * Status učesnika (set 4.8.2), izveden na serveru (`prikazStatusa`). Imenuje ga
   * samo `OznakaStatusa`; kartica nosi obavezne rečenice člana bez potvrde, položaj
   * ZRNA i, kod deteta, na šta se čeka.
   */
  status?: StatusUcesnika | null;
  naStaSeCeka?: NaStaSeCeka | null;
  zrno?: ZrnoPolozaj;
  /** Odeljak „Moja deca" — renderuje ga server (`page.tsx`), stoji odmah ispod „Moji oglasi". */
  mojaDeca?: React.ReactNode;
}

/** Predmeti prigovora i izjašnjenja koja se od korisnika traže (Uslovi čl. 40). */
type Predmeti = {
  razmena: { id: string; iznos: number; datum: string; strana: string; smer: "poslao" | "ponisten" }[];
  nabavka: { id: string; dobro: string; datum: string | null }[];
  vaucer?: { id: string; opis: string; davalac: string; vaziDo: string | null }[];
  izjasnjenja: {
    id: string; pseudonim: string; opis: string; iznos: number; datum: string; rokDo: string | null;
  }[];
};

export default function ProfilKlijent({ user, praceneKategorije, maloletan = false, stanjeDeteta = null, mojaDeca = null, status = null, naStaSeCeka = null, zrno = null }: ProfilProps) {
  const locale = useLocale();
  const t = useTranslations("profil");
  const tc = useTranslations("common");
  const router = useRouter();
  const { update } = useSession();

  const TIPOVI_ODLUKA = [
    { value: "RAZMENA", label: t("prigovor_tip_razmena") },
    { value: "NABAVKA", label: t("prigovor_tip_nabavka") },
    { value: "VAUCER", label: t("prigovor_tip_vaucer") },
    { value: "VERIFIKACIJA", label: t("prigovor_tip_verifikacija") },
    { value: "SUSPENZIJA", label: t("prigovor_tip_suspenzija") },
    { value: "PROGRAM", label: t("prigovor_tip_program") },
    { value: "OGLAS", label: t("prigovor_tip_oglas") },
    { value: "PODACI", label: t("prigovor_tip_podaci") },
    // POTVRDA (poništenje potvrde zbog neaktivnosti) je ukinuta setom 4.8.2 i ne nudi se.
    { value: "RODITELJSTVO", label: t("prigovor_tip_roditeljstvo") },
    { value: "GAZDINSTVO", label: t("prigovor_tip_gazdinstvo") },
    // Utvrđenje višestrukog naloga (Uslovi čl. 40 st. 2 t. 9; rok 15 dana, st. 4 t. 3).
    { value: "VISESTRUKI_NALOG", label: t("prigovor_tip_visestruki") },
    { value: "OSTALO", label: t("prigovor_tip_ostalo") },
  ];
  const [avatar, setAvatar] = useState<string | null>(user.avatar);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  // crop modal
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropDisplay, setCropDisplay] = useState({ w: 1, h: 1, scale: 1 });
  const [cropRadius, setCropRadius] = useState(120);
  const [cropZoom, setCropZoom] = useState(1);
  const cropMaxRadiusRef = useRef(120);
  const [circleCenter, setCircleCenter] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; cx: number; cy: number } | null>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);
  const [noviPseudonim, setNoviPseudonim] = useState("");
  const [psError, setPsError] = useState("");
  const [psSuccess, setPsSuccess] = useState("");
  const [novaLozinka, setNovaLozinka] = useState("");
  const [staraLozinka, setStaraLozinka] = useState("");
  const [lzError, setLzError] = useState("");
  const [lzSuccess, setLzSuccess] = useState("");
  const [location, setLocation] = useState(user.location ?? "");
  const [telefon, setTelefon] = useState(user.telefon ?? "");
  const [punoIme, setPunoIme] = useState(user.punoIme ?? "");
  const [opis, setOpis] = useState(user.opis ?? "");
  const [podaciError, setPodaciError] = useState("");
  const [podaciSuccess, setPodaciSuccess] = useState("");
  const [podaciLoading, setPodaciLoading] = useState(false);

  // Kategorije Pijace koje korisnik prati — optimistički upis na tap,
  // uz vraćanje na prethodno stanje ako server odbije.
  const [pracene, setPracene] = useState<string[]>(praceneKategorije);
  const togglePracenje = useCallback(async (next: string[]) => {
    setPracene((prethodno) => {
      const dodata = next.find((k) => !prethodno.includes(k));
      const uklonjena = prethodno.find((k) => !next.includes(k));
      const slug = dodata ?? uklonjena;
      if (!slug) return prethodno;
      fetch("/api/profil/kategorije", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: slug, prati: Boolean(dodata) }),
      })
        .then((res) => { if (!res.ok) setPracene(prethodno); })
        .catch(() => setPracene(prethodno));
      return next;
    });
  }, []);

  // Vidljivost profila
  const [togglei, setTogglei] = useState({
    prikaziLokaciju: user.prikaziLokaciju,
    prikaziOpis: user.prikaziOpis,
    prikaziPunoIme: user.prikaziPunoIme,
    prikaziTelefon: user.prikaziTelefon,
    prikaziBilans: user.prikaziBilans,
    prikaziZrno: user.prikaziZrno,
    prikaziRangDonacija: user.prikaziRangDonacija,
    prikaziOglase: user.prikaziOglase,
  });
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  async function promeniToggle(field: keyof typeof togglei, vrednost: boolean) {
    setToggleLoading(field);
    const noviTogglei = { ...togglei, [field]: vrednost };
    setTogglei(noviTogglei);
    await fetch("/api/profil/podaci", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: vrednost }),
    });
    setToggleLoading(null);
  }

  // Email obaveštenja (opt-out). Zasebno od vidljivosti profila — kolona je na
  // User-u, ne na UserPodaci, pa ide na svoju rutu.
  const [emailObavestenja, setEmailObavestenja] = useState(user.emailObavestenja);
  const [emailLoading, setEmailLoading] = useState(false);

  async function promeniEmailObavestenja(vrednost: boolean) {
    setEmailLoading(true);
    setEmailObavestenja(vrednost);
    const res = await fetch("/api/profil/obavestenja", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailObavestenja: vrednost }),
    }).catch(() => null);
    // Vrati prekidač ako upis nije prošao — da prikaz ne laže o stanju.
    if (!res?.ok) setEmailObavestenja(!vrednost);
    setEmailLoading(false);
  }

  // Prigovor
  const [prigovorTip, setPrigovorTip] = useState("OSTALO");
  const [prigovorPredmet, setPrigovorPredmet] = useState("");
  const [predmeti, setPredmeti] = useState<Predmeti | null>(null);
  const [prigovorOpis, setPrigovorOpis] = useState("");
  const [prigovorError, setPrigovorError] = useState("");
  const [prigovorSuccess, setPrigovorSuccess] = useState("");
  const [prigovorLoading, setPrigovorLoading] = useState(false);

  // Brisanje naloga
  const [brisiModalOpen, setBrisiModalOpen] = useState(false);
  const [brisiPrimalac, setBrisiPrimalac] = useState("");
  const [brisiError, setBrisiError] = useState("");
  const [brisiLoading, setBrisiLoading] = useState(false);

  const mozeMenjatiPseudonim = !user.pseudonimChangedAt ||
    (Date.now() - new Date(user.pseudonimChangedAt).getTime()) > 30 * 24 * 60 * 60 * 1000;

  function selectAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(MAX_DISPLAY / img.width, MAX_DISPLAY / img.height, 1);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const r = Math.min(dw, dh) / 2 - 12;
      cropMaxRadiusRef.current = r;
      setCropDisplay({ w: dw, h: dh, scale });
      setCropZoom(1);
      setCropRadius(r);
      setCircleCenter({ x: dw / 2, y: dh / 2 });
      setCropSrc(url);
    };
    img.src = url;
    e.target.value = "";
  }

  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const pt = "touches" in e ? e.touches[0] : e;
    dragRef.current = { startX: pt.clientX, startY: pt.clientY, cx: circleCenter.x, cy: circleCenter.y };
  }, [circleCenter]);

  const onDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current) return;
    const pt = "touches" in e ? e.touches[0] : e;
    const dx = pt.clientX - dragRef.current.startX;
    const dy = pt.clientY - dragRef.current.startY;
    const r = cropRadius;
    setCircleCenter({
      x: Math.min(cropDisplay.w - r, Math.max(r, dragRef.current.cx + dx)),
      y: Math.min(cropDisplay.h - r, Math.max(r, dragRef.current.cy + dy)),
    });
  }, [cropRadius, cropDisplay]);

  const onDragEnd = useCallback(() => { dragRef.current = null; }, []);

  // Zoom = uvećanje kadra. Veći zoom → manji krug (uzima se manji deo originala koji
  // se skalira na 256px = jači zum). Posle promene ponovo uglavi centar u granice slike.
  const onZoomChange = useCallback((z: number) => {
    const r = cropMaxRadiusRef.current / z;
    setCropZoom(z);
    setCropRadius(r);
    setCircleCenter((c) => ({
      x: Math.min(cropDisplay.w - r, Math.max(r, c.x)),
      y: Math.min(cropDisplay.h - r, Math.max(r, c.y)),
    }));
  }, [cropDisplay]);

  // Zaključaj skrol stranice dok je crop modal otvoren (sprečava pomeranje cele
  // stranice pri prevlačenju kruga na dodirnim ekranima).
  useEffect(() => {
    if (!cropSrc) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [cropSrc]);

  async function confirmCrop() {
    if (!cropSrc || !cropImgRef.current) return;
    setAvatarLoading(true);
    setAvatarError("");

    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const { scale } = cropDisplay;
    const r = cropRadius / scale;
    const cx = circleCenter.x / scale;
    const cy = circleCenter.y / scale;
    ctx.drawImage(cropImgRef.current, cx - r, cy - r, r * 2, r * 2, 0, 0, size, size);

    const base64 = canvas.toDataURL("image/jpeg", 0.82);
    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);

    if (base64.length > 150_000) {
      setAvatarError(t("foto_napomena"));
      setAvatarLoading(false);
      return;
    }

    const res = await fetch("/api/profil/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: base64 }),
    });
    const data = await res.json();
    setAvatarLoading(false);
    if (!res.ok) { setAvatarError(data.error ?? tc("greska_ucitavanja")); return; }
    // Server vraća URL avatara na Vercel Blob-u (ne više base64).
    const noviAvatar = data.avatar ?? base64;
    setAvatar(noviAvatar);
    window.dispatchEvent(new CustomEvent("avatar-updated", { detail: noviAvatar }));
  }

  async function promeniPseudonim(e: React.FormEvent) {
    e.preventDefault();
    setPsError(""); setPsSuccess("");
    if (noviPseudonim.length < 3) { setPsError(t("ps_min_3")); return; }
    const res = await fetch("/api/profil/pseudonim", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudonim: noviPseudonim }),
    });
    const data = await res.json();
    if (!res.ok) { setPsError(data.error); return; }
    setPsSuccess(t("ps_uspeh"));
    setNoviPseudonim("");
    await update();
    router.refresh();
  }

  async function promeniLozinku(e: React.FormEvent) {
    e.preventDefault();
    setLzError(""); setLzSuccess("");
    if (novaLozinka.length < 8) { setLzError(t("lz_greska_duzina")); return; }
    const res = await fetch("/api/profil/lozinka", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staraLozinka, novaLozinka }),
    });
    const data = await res.json();
    if (!res.ok) { setLzError(data.error); return; }
    setLzSuccess(t("lz_uspeh")); setStaraLozinka(""); setNovaLozinka("");
  }

  // Jedinstveno čuvanje svih ličnih podataka (ime/opis idu na /podaci, mesto/telefon na /lokacija).
  async function sacuvajSve(e: React.FormEvent) {
    e.preventDefault();
    setPodaciError(""); setPodaciSuccess("");
    setPodaciLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/profil/podaci", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ punoIme, opis }),
        }),
        fetch("/api/profil/lokacija", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location, telefon }),
        }),
      ]);
      if (!r1.ok || !r2.ok) {
        const neuspeli = !r1.ok ? r1 : r2;
        const greska = await neuspeli.json().catch(() => ({}));
        setPodaciError(greska.error ?? tc("greska_ucitavanja"));
        return;
      }
      setPodaciSuccess(t("sacuvano"));
      router.refresh();
    } finally {
      setPodaciLoading(false);
    }
  }

  async function posaljiPrigovor(e: React.FormEvent) {
    e.preventDefault();
    setPrigovorError(""); setPrigovorSuccess("");
    if (prigovorOpis.trim().length < 10) { setPrigovorError(t("prigovor_opis_min10")); return; }
    setPrigovorLoading(true);
    const res = await fetch("/api/prigovor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opis: prigovorOpis,
        tipOdluke: prigovorTip,
        predmetId: prigovorPredmet || null,
      }),
    });
    const data = await res.json();
    setPrigovorLoading(false);
    if (!res.ok) { setPrigovorError(data.error ?? t("prigovor_greska_slanja")); return; }
    setPrigovorSuccess(t("prigovor_uspeh"));
    setPrigovorOpis("");
    setPrigovorPredmet("");
    ucitajPredmete();
  }

  // Predmeti se učitavaju jednom, pri otvaranju profila: spisak je kratak (samo
  // ono što je u roku) i treba i obrascu i bloku sa izjašnjenjima.
  const ucitajPredmete = useCallback(() => {
    if (maloletan) return;
    fetch("/api/prigovor/predmeti", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setPredmeti(d); })
      .catch(() => {});
  }, [maloletan]);

  useEffect(() => { ucitajPredmete(); }, [ucitajPredmete]);

  // Ulaz sa vaučera („Moji vaučeri"): /profil?prigovor=VAUCER&predmet=<id>. Ulaz u
  // prigovor ostaje profil (Uslovi čl. 40 st. 1) — vaučer samo vodi ovamo sa izabranim
  // predmetom.
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("prigovor") === "VAUCER") {
        setPrigovorTip("VAUCER");
        setPrigovorPredmet(q.get("predmet") ?? "");
      }
    } catch {
      // bez URL parametra obrazac ostaje podrazumevan
    }
  }, []);

  const datumKratak = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

  const predmetiZaTip: { id: string; label: string }[] =
    prigovorTip === "RAZMENA"
      ? (predmeti?.razmena ?? []).map((r) => ({
          id: r.id,
          label:
            r.smer === "poslao"
              ? t("prigovor_predmet_poslao", {
                  datum: datumKratak(r.datum),
                  iznos: r.iznos.toLocaleString(intlTag(locale)),
                  strana: r.strana,
                })
              : t("prigovor_predmet_ponisten", {
                  datum: datumKratak(r.datum),
                  iznos: r.iznos.toLocaleString(intlTag(locale)),
                  strana: r.strana,
                }),
        }))
      : prigovorTip === "NABAVKA"
      ? (predmeti?.nabavka ?? []).map((n) => ({
          id: n.id,
          label: t("prigovor_predmet_deo", { datum: datumKratak(n.datum), dobro: n.dobro }),
        }))
      : prigovorTip === "VAUCER"
      ? (predmeti?.vaucer ?? []).map((v) => ({
          id: v.id,
          label: t("prigovor_predmet_vaucer", { opis: v.opis, davalac: v.davalac, datum: datumKratak(v.vaziDo) }),
        }))
      : [];

  async function posaljiIzjasnjenje(id: string, odgovor: string) {
    const res = await fetch(`/api/prigovor/razmena/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odgovor }),
    });
    if (res.ok) ucitajPredmete();
    return res.ok;
  }

  // Dete čiji nalog čeka preuzimanje briše nalog samo (deca čl. 8 st. 3). Zaseban tok
  // od `obrisiNalog`: tamo se nalog anonimizuje i ostaje, ovde nestaje.
  const [deteBrisiOpen, setDeteBrisiOpen] = useState(false);
  const [deteBrisiLoading, setDeteBrisiLoading] = useState(false);
  const [deteBrisiError, setDeteBrisiError] = useState("");

  async function obrisiDecjiNalog() {
    setDeteBrisiError("");
    setDeteBrisiLoading(true);
    const res = await fetch("/api/deca/nalog", { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeteBrisiLoading(false);
    if (!res.ok) { setDeteBrisiError(data.error ?? t("dete_brisi_greska")); return; }
    await signOut({ callbackUrl: "/" });
  }

  async function obrisiNalog() {
    setBrisiError("");
    setBrisiLoading(true);
    const res = await fetch("/api/profil", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prenesPoen: brisiPrimalac || undefined }),
    });
    const data = await res.json();
    setBrisiLoading(false);
    if (!res.ok) { setBrisiError(data.error ?? t("brisi_greska")); return; }
    await signOut({ callbackUrl: "/" });
  }

  // On/off klizač vidljivosti na kraju polja (pali/gasi prikazivanje na javnom profilu).
  const renderSwitch = (field: keyof typeof togglei) => (
    <Prekidac
      ukljuceno={togglei[field]}
      onPromena={() => promeniToggle(field, !togglei[field])}
      zauzet={toggleLoading === field}
      oznaka={togglei[field] ? t("vidljivo") : t("skriveno")}
    />
  );

  return (
    <div className="space-y-6">
      <NaslovStranice naslov={t("naslov")} />

      {/* Kartica statusa: opis, obavezne rečenice člana bez potvrde (Pravilnik
          čl. 2, 28; dokaz stvarnosti čl. 6; Uslovi čl. 2), položaj ZRNA, a kod deteta
          na šta se čeka (deca čl. 5 st. 4). */}
      {status && (
        <OznakaStatusa varijanta="kartica" svoj status={status} naStaSeCeka={naStaSeCeka} zrno={zrno} vezaNazove />
      )}

      {/* Osnovni podaci sa profilnom slikom u zaglavlju kartice. Slika je 112 px
          (bila je krug od 320 px u zasebnoj kartici i na telefonu je sama zauzimala
          ceo ekran). */}
      <div>
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-kolo-border shrink-0">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={user.pseudonim} className="block w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-kolo-green-700 flex items-center justify-center text-white font-bold text-4xl">
                  <Pseudonim>{user.pseudonim.charAt(0).toUpperCase()}</Pseudonim>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <label className={klaseDugmeta({ varijanta: "sekundarno" }) + " cursor-pointer"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                {avatarLoading ? t("cuvam_sliku") : t("postavi_sliku")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={avatarLoading}
                  onChange={selectAvatar}
                />
              </label>
              <p className="text-xs text-kolo-muted">{t("foto_napomena")}</p>
              {avatarError && <Obavestenje vrsta="greska">{avatarError}</Obavestenje>}
            </div>
          </div>
          <h2 className="text-base font-semibold text-kolo-muted mb-4">{t("osnovi_podaci")}</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-kolo-muted">{t("pseudonim_label")}</dt>
              <dd className="font-medium text-kolo-text"><Pseudonim>{user.pseudonim}</Pseudonim></dd>
            </div>
            {/* Status (set 4.8.2): jedan red, jedna komponenta. Dete se proverava
                prvo (`statusUcesnika`), pa maloletan nalog nikad nije „korisnik". */}
            {status && (
              <div className="flex justify-between items-center">
                <dt className="text-kolo-muted">{t("status_label")}</dt>
                <dd><OznakaStatusa status={status} /></dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-kolo-muted">{t("poen_stanje_label")}</dt>
              <dd className="font-bold text-kolo-green-700">{user.balance.toLocaleString()} {tc("poen")}</dd>
            </div>
            {user.punoIme && (
              <div className="flex justify-between">
                <dt className="text-kolo-muted">{t("ime_prezime_label")}</dt>
                <dd className="text-kolo-muted">{user.punoIme}</dd>
              </div>
            )}
            {user.location && (
              <div className="flex justify-between">
                <dt className="text-kolo-muted">{t("lokacija_label")}</dt>
                <dd className="text-kolo-muted">{user.location}</dd>
              </div>
            )}
            {user.telefon && !maloletan && (
              <div className="flex justify-between">
                <dt className="text-kolo-muted">{t("telefon_label")}</dt>
                <dd className="text-kolo-muted">{user.telefon}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-kolo-muted">{t("registrovan_label")}</dt>
              <dd className="text-kolo-muted">{new Date(user.createdAt).toLocaleDateString(intlTag(locale))}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Podaci i vidljivost — jedan meni: svako polje + on/off klizač prikazivanja na kraju */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
        <h2 className="text-base font-semibold text-kolo-muted mb-1">{t("vidljivost_naslov")}</h2>
        <p className="text-xs text-kolo-muted mb-5">{t("vidljivost_opis")}</p>
        <form onSubmit={sacuvajSve} className="space-y-4">
          {/* Puno ime */}
          <div>
            <label htmlFor="polje2-profil-1" className="block text-sm text-kolo-muted mb-1.5">{t("puno_ime")} <span className="text-kolo-muted">({tc("opciono")})</span></label>
            <div className="flex items-center gap-3">
              <input id="polje2-profil-1"
                type="text"
                value={punoIme}
                onChange={(e) => setPunoIme(e.target.value)}
                placeholder={t("puno_ime_placeholder")}
                maxLength={100}
                className={KLASE_UNOSA + " flex-1 min-w-0"}
              />
              {renderSwitch("prikaziPunoIme")}
            </div>
          </div>
          {/* Opis / zanimanje */}
          <div>
            <label htmlFor="polje2-profil-2" className="block text-sm text-kolo-muted mb-1.5">{t("opis_zanimanje")} <span className="text-kolo-muted">({tc("opciono")})</span></label>
            <div className="flex items-center gap-3">
              <input id="polje2-profil-2"
                type="text"
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                placeholder={t("opis_placeholder")}
                maxLength={200}
                className={KLASE_UNOSA + " flex-1 min-w-0"}
              />
              {renderSwitch("prikaziOpis")}
            </div>
          </div>
          {/* Mesto / lokacija */}
          <div>
            <label htmlFor="polje2-profil-3" className="block text-sm text-kolo-muted mb-1.5">{t("mesto")} <span className="text-kolo-muted">({tc("opciono")})</span></label>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <LokacijaSearch id="polje2-profil-3" value={location} onChange={setLocation} />
              </div>
              {renderSwitch("prikaziLokaciju")}
            </div>
          </div>
          {/* Telefon — maloletnom nalogu se ne nudi. Sistem dete pažljivo štiti od
              kontakta nepoznatih odraslih, a onda mu je na profilu stajalo polje
              kojim svoj broj može da objavi svakome kome je vidljiv. */}
          <div className={maloletan ? "hidden" : ""}>
            <label htmlFor="polje2-profil-4" className="block text-sm text-kolo-muted mb-1.5">{t("telefon")} <span className="text-kolo-muted">({tc("opciono")})</span></label>
            <div className="flex items-center gap-3">
              <input id="polje2-profil-4"
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder={t("telefon_placeholder")}
                className={KLASE_UNOSA + " flex-1 min-w-0"}
              />
              {renderSwitch("prikaziTelefon")}
            </div>
          </div>
          {podaciError && <Obavestenje vrsta="greska">{podaciError}</Obavestenje>}
          {podaciSuccess && <Obavestenje vrsta="uspeh">{podaciSuccess}</Obavestenje>}
          <button
            type="submit"
            disabled={podaciLoading}
            className={klaseDugmeta({ velicina: "lg", punaSirina: true })}
          >
            {podaciLoading ? tc("cuvam") : tc("sacuvaj")}
          </button>
        </form>
      </div>

      {/* Promena pseudonima + Promena lozinke — jedno pored drugog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
          <h2 className="text-base font-semibold text-kolo-muted mb-4">{t("promena_pseudonima")}</h2>
          {mozeMenjatiPseudonim ? (
            <form onSubmit={promeniPseudonim} className="space-y-3">
              <input
                type="text"
                minLength={3}
                maxLength={30}
                placeholder={t("novi_pseudonim")}
                aria-label={t("novi_pseudonim")}
                value={noviPseudonim}
                onChange={(e) => setNoviPseudonim(e.target.value)}
                className={KLASE_UNOSA}
              />
              <p className="text-xs text-kolo-muted">{t("pseudonim_pravilo")}</p>
              {psError && <Obavestenje vrsta="greska">{psError}</Obavestenje>}
              {psSuccess && <Obavestenje vrsta="uspeh">{psSuccess}</Obavestenje>}
              <button type="submit" className={klaseDugmeta({ velicina: "lg", punaSirina: true })}>
                {t("promeni_pseudonim")}
              </button>
            </form>
          ) : (
            <p className="text-sm text-kolo-muted">
              {t("pseudonim_30_dana")}{" "}
              {user.pseudonimChangedAt && (
                <>{t("sledeca_promena")} {new Date(new Date(user.pseudonimChangedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(intlTag(locale))}.</>
              )}
            </p>
          )}
        </div>

        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
          <h2 className="text-base font-semibold text-kolo-muted mb-4">{t("promena_lozinke")}</h2>
          <form onSubmit={promeniLozinku} className="space-y-3">
            <input
              type="password"
              placeholder={t("trenutna_lozinka")}
              aria-label={t("trenutna_lozinka")}
              value={staraLozinka}
              onChange={(e) => setStaraLozinka(e.target.value)}
              className={KLASE_UNOSA}
            />
            <input
              type="password"
              placeholder={t("nova_lozinka")}
              aria-label={t("nova_lozinka")}
              value={novaLozinka}
              onChange={(e) => setNovaLozinka(e.target.value)}
              className={KLASE_UNOSA}
            />
            {lzError && <Obavestenje vrsta="greska">{lzError}</Obavestenje>}
            {lzSuccess && <Obavestenje vrsta="uspeh">{lzSuccess}</Obavestenje>}
            <button type="submit" className={klaseDugmeta({ velicina: "lg", punaSirina: true })}>
              {t("promeni_lozinku")}
            </button>
          </form>
        </div>
      </div>

      {/* Crop modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="bg-kolo-surface rounded-kartica p-6 flex flex-col items-center gap-4 shadow-xl max-w-full">
            <p className="text-sm text-kolo-muted">{t("crop_opis")}</p>
            <div
              className="relative cursor-grab active:cursor-grabbing rounded-xl overflow-hidden select-none"
              style={{ width: cropDisplay.w, height: cropDisplay.h, touchAction: "none" }}
              onMouseDown={onDragStart}
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImgRef}
                src={cropSrc}
                alt=""
                draggable={false}
                style={{ width: cropDisplay.w, height: cropDisplay.h, display: "block", pointerEvents: "none" }}
              />
              <svg
                style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                width={cropDisplay.w}
                height={cropDisplay.h}
              >
                <defs>
                  <mask id="cm">
                    <rect width={cropDisplay.w} height={cropDisplay.h} fill="white" />
                    <circle cx={circleCenter.x} cy={circleCenter.y} r={cropRadius} fill="black" />
                  </mask>
                </defs>
                <rect width={cropDisplay.w} height={cropDisplay.h} fill="black" fillOpacity={0.55} mask="url(#cm)" />
                <circle cx={circleCenter.x} cy={circleCenter.y} r={cropRadius} fill="none" stroke="white" strokeWidth={1.75} strokeDasharray="6 3" />
              </svg>
            </div>
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg leading-none text-kolo-muted select-none" aria-hidden>−</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.02}
                value={cropZoom}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                aria-label={t("crop_zoom")}
                className="flex-1 accent-kolo-green-700 cursor-pointer"
              />
              <span className="text-lg leading-none text-kolo-muted select-none" aria-hidden>＋</span>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); }}
                className={klaseDugmeta({ varijanta: "sekundarno" }) + " flex-1"}
              >
                {tc("otkazi")}
              </button>
              <button
                onClick={confirmCrop}
                disabled={avatarLoading}
                className={klaseDugmeta() + " flex-1"}
              >
                {avatarLoading ? tc("cuvam") : tc("potvrdi")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moji oglasi — kartica sa vidljivim dugmetom za ulaz */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-kartica">
        <div>
          <h2 className="text-base font-semibold text-kolo-muted mb-1">{t("moji_oglasi")}</h2>
          <p className="text-xs text-kolo-muted">{t("moji_oglasi_opis")}</p>
        </div>
        <Link
          href="/profil/oglasi"
          className={klaseDugmeta() + " shrink-0"}
        >
          {t("moji_oglasi_dugme")}
          <span aria-hidden>→</span>
        </Link>
      </div>

      {mojaDeca}

      {/* Kategorije Pijace koje pratim — multi čipovi, optimistički upis na tap.
          Vizuelno identično filteru na Pijaci, bez brojača. */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
        <h2 className="text-base font-semibold text-kolo-muted mb-1">{t("pratim_kategorije_naslov")}</h2>
        <p className="text-xs text-kolo-muted mb-4">{t("pratim_kategorije_opis")}</p>
        <CategoryChips selected={pracene} onChange={togglePracenje} />
      </div>

      {/* Obaveštenja — email prekidač gasi SVE obaveštajne mejlove (mejl za reset
          lozinke ne zavisi od njega jer bez njega nalog nije povratljiv); ispod je
          prekidač za push na ovom uređaju, isti koji stoji u meniju zvonca. */}
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
        <h2 className="text-base font-semibold text-kolo-muted mb-1">{t("email_naslov")}</h2>
        <p className="text-xs text-kolo-muted mb-4">{t("email_opis")}</p>
        <div className="flex justify-between items-center gap-4">
          <div>
            <p className="text-sm font-semibold text-kolo-text">{t("email_toggle")}</p>
            <p className="text-xs text-kolo-muted mt-0.5">{t("email_napomena_lozinka")}</p>
          </div>
          <Prekidac
            ukljuceno={emailObavestenja}
            onPromena={() => promeniEmailObavestenja(!emailObavestenja)}
            zauzet={emailLoading}
            oznaka={emailObavestenja ? t("email_ukljuceno") : t("email_iskljuceno")}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-kolo-border empty:hidden">
          <PushObavestenja varijanta="profil" />
        </div>
      </div>

      {/* Podaci i privatnost — prigovor levo; desno prenosivost (gore) + gašenje (dole).
          Detetu se ne prikazuje: prigovor Fondaciji, GDPR eksport i nepovratno
          gašenje naloga nisu radnje sedmogodišnjaka. Prava po ZZPL-u time nisu
          uskraćena — ostvaruje ih roditelj, koji za dete i odgovara (deca čl. 20 st. 4). */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-start ${maloletan ? "hidden" : ""}`}>
        {/* Prigovor na odluku — levo */}
        <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
          {/* Izjašnjenje pre odluke (Uslovi čl. 40 st. 5) — stoji IZNAD obrasca
              jer je vezano rokom: dok traje, Fondacija ne odlučuje. */}
          {(predmeti?.izjasnjenja.length ?? 0) > 0 && (
            <div className="mb-6 rounded-kontrola border-l-4 border-kolo-gold-600 bg-kolo-gold-100 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-kolo-text">{t("izjasni_naslov")}</h3>
              {predmeti!.izjasnjenja.map((iz) => (
                <Izjasnjenje
                  key={iz.id}
                  stavka={iz}
                  datum={datumKratak(iz.datum)}
                  rok={datumKratak(iz.rokDo)}
                  iznos={iz.iznos.toLocaleString(intlTag(locale))}
                  posalji={posaljiIzjasnjenje}
                />
              ))}
            </div>
          )}
          <h2 className="text-base font-semibold text-kolo-muted mb-2">{t("prigovor_naslov")}</h2>
          <p className="text-xs text-kolo-muted mb-4">
            {t("prigovor_opis")}
          </p>
          <form onSubmit={posaljiPrigovor} className="space-y-3">
            <select
              value={prigovorTip}
              onChange={(e) => setPrigovorTip(e.target.value)}
              aria-label={t("prigovor_naslov")}
              className={KLASE_UNOSA}
            >
              {TIPOVI_ODLUKA.map((tip) => (
                <option key={tip.value} value={tip.value}>{tip.label}</option>
              ))}
            </select>
            {/* Predmet — obavezan za dve vrste (Uslovi čl. 40 st. 3): o prepisu i
                o delu iz nabavke odlučuje se pojedinačno, pa se mora reći o kom. */}
            {(prigovorTip === "RAZMENA" || prigovorTip === "NABAVKA" || prigovorTip === "VAUCER") && (
              predmetiZaTip.length > 0 ? (
                <select
                  value={prigovorPredmet}
                  onChange={(e) => setPrigovorPredmet(e.target.value)}
                  aria-label={t("prigovor_predmet_izaberi")}
                  className={KLASE_UNOSA}
                >
                  <option value="">{t("prigovor_predmet_izaberi")}</option>
                  {predmetiZaTip.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-kolo-muted bg-kolo-bg rounded-kontrola px-3 py-2">
                  {t("prigovor_predmet_prazno")}
                </p>
              )
            )}
            <textarea
              value={prigovorOpis}
              onChange={(e) => setPrigovorOpis(e.target.value)}
              placeholder={t("prigovor_placeholder")}
              aria-label={t("prigovor_placeholder")}
              rows={3}
              maxLength={2000}
              className={KLASE_UNOSA + " resize-none"}
            />
            {prigovorError && <Obavestenje vrsta="greska">{prigovorError}</Obavestenje>}
            {prigovorSuccess && <Obavestenje vrsta="uspeh">{prigovorSuccess}</Obavestenje>}
            <button
              type="submit"
              disabled={prigovorLoading}
              className={klaseDugmeta({ punaSirina: true })}
            >
              {prigovorLoading ? t("saljem") : t("prigovor_dugme")}
            </button>
          </form>
        </div>

        {/* Desno: prenosivost podataka (gore) + gašenje profila (dole) */}
        <div className="space-y-6">
          {/* Pravo na prenosivost podataka */}
          <div className="bg-kolo-surface rounded-kartica border border-kolo-border p-6 shadow-kartica">
            <h2 className="text-base font-semibold text-kolo-muted mb-2">{t("eksport_naslov")}</h2>
            <p className="text-xs text-kolo-muted mb-4">
              {t("eksport_opis")}
            </p>
            <a
              href="/api/profil/eksport"
              download
              className={klaseDugmeta()}
            >
              {t("eksport_dugme")}
            </a>
          </div>

          {/* Šta sam prihvatio i kada (R-06) */}
          <MojiPristanci />

          {/* Gašenje profila (brisanje naloga) */}
          <div className="bg-kolo-surface rounded-kartica border border-kolo-danger/30 p-6 shadow-kartica">
            <h2 className="text-base font-semibold text-kolo-danger mb-2">{t("brisi_naslov")}</h2>
            <p className="text-xs text-kolo-muted mb-4">
              {t("brisi_opis")}
            </p>
        {!brisiModalOpen ? (
          <button
            onClick={() => setBrisiModalOpen(true)}
            className="min-h-10 px-4 rounded-kontrola border border-kolo-danger/30 bg-kolo-surface text-kolo-danger text-sm font-semibold hover:bg-kolo-danger-light transition-colors"
          >
            {t("brisi_dugme")}
          </button>
        ) : (
          <div className="space-y-3 border border-kolo-danger/30 rounded-kontrola p-4 bg-kolo-danger-light">
            <p className="text-sm font-semibold text-kolo-danger">{t("brisi_potvrda_naslov")}</p>
            <div>
              <label htmlFor="polje-profil-1" className="block text-xs text-kolo-muted mb-1.5">
                {t("brisi_primalac_label")} <span className="font-normal">({t("brisi_primalac_napomena")})</span>
              </label>
              <input id="polje-profil-1"
                type="text"
                value={brisiPrimalac}
                onChange={(e) => setBrisiPrimalac(e.target.value)}
                placeholder={t("brisi_primalac_placeholder")}
                className={KLASE_UNOSA}
              />
            </div>
            {brisiError && <Obavestenje vrsta="greska">{brisiError}</Obavestenje>}
            <div className="flex gap-3">
              <button
                onClick={() => { setBrisiModalOpen(false); setBrisiError(""); }}
                className={klaseDugmeta({ varijanta: "sekundarno" }) + " flex-1"}
              >
                {t("odustani")}
              </button>
              <button
                onClick={obrisiNalog}
                disabled={brisiLoading}
                className={klaseDugmeta({ varijanta: "opasno" }) + " flex-1"}
              >
                {brisiLoading ? t("brisem") : t("brisi_potvrdi")}
              </button>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Sopstveni izlaz deteta iz naloga koji čeka preuzimanje (deca čl. 8 st. 3).
          Stoji IZVAN grida iznad, koji je detetu sakriven: prigovor, GDPR eksport
          i anonimizacija punoletnog naloga nisu radnje sedmogodišnjaka, ali izlaz
          iz obrade koja se u tom razdoblju vodi po legitimnom interesu jeste.
          Po preuzimanju naloga blok nestaje — tada nalog briše roditelj. */}
      {maloletan && stanjeDeteta === "NA_CEKANJU" && (
        <div className="bg-kolo-surface rounded-kartica border border-kolo-danger/30 p-6 shadow-kartica">
          <h2 className="text-base font-semibold text-kolo-danger mb-2">{t("dete_brisi_naslov")}</h2>
          <p className="text-xs text-kolo-muted mb-4">{t("dete_brisi_opis")}</p>
          {!deteBrisiOpen ? (
            <button
              onClick={() => setDeteBrisiOpen(true)}
              className="min-h-10 px-4 rounded-kontrola border border-kolo-danger/30 bg-kolo-surface text-kolo-danger text-sm font-semibold hover:bg-kolo-danger-light transition-colors"
            >
              {t("dete_brisi_dugme")}
            </button>
          ) : (
            <div className="space-y-3 border border-kolo-danger/30 rounded-kontrola p-4 bg-kolo-danger-light">
              <p className="text-sm font-semibold text-kolo-danger">{t("dete_brisi_potvrda")}</p>
              {deteBrisiError && (
                <Obavestenje vrsta="greska">{deteBrisiError}</Obavestenje>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeteBrisiOpen(false); setDeteBrisiError(""); }}
                  className={klaseDugmeta({ varijanta: "sekundarno" }) + " flex-1"}
                >
                  {t("odustani")}
                </button>
                <button
                  onClick={obrisiDecjiNalog}
                  disabled={deteBrisiLoading}
                  className={klaseDugmeta({ varijanta: "opasno" }) + " flex-1"}
                >
                  {deteBrisiLoading ? t("brisem") : t("dete_brisi_potvrdi")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Izjašnjenje druge strane o prigovoru na prepis (Uslovi čl. 40 st. 5).
 *
 * Zaseban mali komponent samo zbog sopstvenog stanja teksta — bez njega bi svako
 * kucanje preiscrtavalo ceo profil.
 */
function Izjasnjenje({
  stavka, datum, rok, iznos, posalji,
}: {
  stavka: { id: string; pseudonim: string; opis: string };
  datum: string;
  rok: string;
  iznos: string;
  posalji: (id: string, odgovor: string) => Promise<boolean>;
}) {
  const t = useTranslations("profil");
  const [tekst, setTekst] = useState("");
  const [salje, setSalje] = useState(false);
  const [poslato, setPoslato] = useState(false);

  if (poslato) return <p className="text-xs text-kolo-green-700">{t("izjasni_poslato")}</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-kolo-muted">
        {t("izjasni_opis", { pseudonim: stavka.pseudonim, iznos, datum })}
      </p>
      <p className="text-xs text-kolo-text italic">„{stavka.opis}"</p>
      {rok && <p className="text-xs text-kolo-muted">{t("izjasni_rok", { datum: rok })}</p>}
      <textarea
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={t("izjasni_placeholder")}
        className={KLASE_UNOSA + " resize-none"}
      />
      <button
        type="button"
        disabled={salje || tekst.trim().length < 10}
        onClick={async () => {
          setSalje(true);
          const ok = await posalji(stavka.id, tekst.trim());
          setSalje(false);
          if (ok) setPoslato(true);
        }}
        className={klaseDugmeta({ velicina: "sm" })}
      >
        {t("izjasni_dugme")}
      </button>
    </div>
  );
}
