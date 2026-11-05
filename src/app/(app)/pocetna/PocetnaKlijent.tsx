"use client";

import { useEffect, useRef, useState } from "react";
import { intlTag } from "@/lib/format";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { useDijalog } from "@/components/ui/Dijalog";
import Obavestenje from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Kartica from "@/components/ui/Kartica";
import NaslovSekcije from "@/components/ui/NaslovSekcije";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Stranica from "@/components/ui/Stranica";
import { izmeniPorukuPricaonice, obrisiPorukuPricaonice } from "@/lib/pricaonica-klijent";

interface BlogObjava {
  id: string;
  title: string;
  content: string;
  authorPseudonim: string;
  publishedAt: string;
}

interface ChatPoruka {
  id: string;
  userId: string;
  pseudonim: string;
  verified: boolean;
  avatar: string | null;
  content: string;
  createdAt: string;
  /** Autor je izmenio tekst — uz poruku stoji „izmenjeno". */
  izmenjeno: boolean;
}


interface Props {
  pseudonim: string;
  currentUserId: string;
  blog: BlogObjava[];
  chatInicijalno: ChatPoruka[];
  /** UO Fondacije — može ukloniti spornu poruku iz sobe (Uslovi čl. 29 st. 2). */
  jeAdminViewer: boolean;
  /** Kartica statusa (`OznakaStatusa`) za korisnika i člana bez potvrde — renderuje je server (set 4.8.2). */
  karticaStatusa?: React.ReactNode;
}

export default function PocetnaKlijent({
  pseudonim,
  currentUserId,
  blog,
  chatInicijalno,
  jeAdminViewer,
  karticaStatusa,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("pocetna");
  const { dijalog, potvrdi, unesi } = useDijalog();
  const [poruke, setPoruke] = useState<ChatPoruka[]>(chatInicijalno);
  const [input, setInput] = useState("");
  const [salje, setSalje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  // Sopstvena poruka koja se upravo menja i njen tekst u polju.
  const [menjaId, setMenjaId] = useState<string | null>(null);
  const [menjaTekst, setMenjaTekst] = useState("");
  const [cuva, setCuva] = useState(false);
  const [otvorenaObjava, setOtvorenaObjava] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);


  /**
   * Uklanjanje sporne poruke iz Pričaonice (Uslovi čl. 29 — obuhvata „svu
   * drugu komunikaciju putem Platforme"). Razlog je obavezan jer se šalje autoru.
   * Bez ovoga bi jedina poluga nad spornom porukom bila isključenje korisnika.
   */
  async function ukloniPoruku(id: string) {
    const razlog = (
      await unesi({
        poruka: t("chat_ukloni_razlog"),
        opasno: true,
        dugme: t("chat_ukloni_poruku"),
      })
    )?.trim();
    if (!razlog) return;
    const res = await fetch(`/api/admin/chat/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ razlog }),
    });
    if (res.ok) setPoruke((prev) => prev.filter((p) => p.id !== id));
    else {
      const data = await res.json().catch(() => ({}));
      setGreska(data.error ?? t("greska_uklanjanje"));
    }
  }

  /** Autor menja svoju poruku; uz nju posle stoji „izmenjeno". */
  async function sacuvajIzmenu(id: string) {
    const tekst = menjaTekst.trim();
    if (!tekst || cuva) return;
    setCuva(true);
    setGreska(null);
    const g = await izmeniPorukuPricaonice(id, tekst, t("greska_izmena"));
    setCuva(false);
    if (g) {
      setGreska(g);
      return;
    }
    setPoruke((prev) => prev.map((p) => (p.id === id ? { ...p, content: tekst, izmenjeno: true } : p)));
    setMenjaId(null);
  }

  /** Autor briše svoju poruku — stvarno, ne samo iz prikaza. */
  async function obrisiSvoju(id: string) {
    if (!(await potvrdi({ poruka: t("chat_obrisi_potvrda"), opasno: true, dugme: t("chat_obrisi") }))) return;
    setGreska(null);
    const g = await obrisiPorukuPricaonice(id, t("greska_brisanje"));
    if (g) setGreska(g);
    else setPoruke((prev) => prev.filter((p) => p.id !== id));
  }

  // Skroluj na dno chata pri inicijalizaciji i pri svakoj novoj poruci
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [poruke.length]);

  // Osvežavanje pričaonice (10s — globalna soba, ne treba realtime). Soba se
  // povlači CELA, ne samo „od poslednje": tako do svih stižu i izmene i brisanja
  // starijih poruka, ne samo nove.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok) return;
        setPoruke(await res.json());
      } catch {
        // ignoriši
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  async function posaljiPoruku(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || salje) return;
    setSalje(true);
    setGreska(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGreska(data.error ?? t("greska_slanje"));
        return;
      }
      setPoruke((prev) => [...prev, data.poruka]);
      setInput("");
    } catch {
      setGreska(t("greska_mreza"));
    } finally {
      setSalje(false);
    }
  }

  return (
    <Stranica sirina="siroka">
      {dijalog}
      <h1 className="kolo-naslov-pozdrav">
        {t.rich("dobrodoslice", { pseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })}
      </h1>

      {/* Sledeći korak odmah ispod pozdrava, pre brojki sistema (odluka vlasnika
          22.10.2026; ranije ispod kartica, odluka 20.10.2026): korisniku i članu
          bez potvrde kartica statusa sa dugmetom, članu Kola „Čeka na tebe". */}
      {karticaStatusa}



      {/* Levo Vesti Fondacije, desno Pričaonica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── BLOG / VESTI FONDACIJE ──────────────────────────────────── */}
      <section className="space-y-3">
        <NaslovSekcije>{t("vesti_naslov")}</NaslovSekcije>

        {/* Prozor vesti. Visina je GORNJA granica (na telefonu manja), ne fiksna:
            prazna kutija je zauzimala 640 px sa jednom rečenicom u sredini. */}
        <Kartica padding="nema" className={`overflow-y-auto divide-y divide-kolo-border ${blog.length === 0 ? "" : "max-h-[420px] md:max-h-[640px]"}`}>
          {blog.length === 0 ? (
            <PraznoStanje kompaktno naslov={t("nema_objava")} />
          ) : (
            blog.map((o) => {
              const otvorena = otvorenaObjava === o.id;
              // Vest je kratka: tri reda i „Pročitaj" (odluka vlasnika 02.11.2026).
              const duga = o.content.length > 160 || o.content.includes("\n");
              return (
                <article
                  key={o.id}
                  className="p-5"
                >
                  <h3 className="text-base font-semibold text-kolo-text mb-1">
                    {o.title}
                  </h3>
                  <p className="text-xs text-kolo-muted mb-3">
                    {new Date(o.publishedAt).toLocaleDateString(intlTag(locale), {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <p className={`text-sm text-kolo-text leading-relaxed whitespace-pre-wrap text-body ${duga && !otvorena ? "line-clamp-3" : ""}`}>
                    {o.content}
                  </p>
                  {duga && (
                    <button
                      type="button"
                      aria-expanded={otvorena}
                      onClick={() => setOtvorenaObjava(otvorena ? null : o.id)}
                      className="mt-1 inline-flex min-h-10 items-center text-sm font-medium text-kolo-green-700 hover:underline"
                    >
                      {otvorena ? t("skupi") : t("procitaj_celo")}
                    </button>
                  )}
                </article>
              );
            })
          )}
        </Kartica>
        {blog.length > 0 && (
          <Link href="/vesti" className="inline-flex min-h-10 items-center text-sm font-semibold text-kolo-green-700 hover:underline">
            {t("sve_vesti")} →
          </Link>
        )}
      </section>

      {/* ── PRIČAONICA ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <NaslovSekcije radnja={<span className="text-xs text-kolo-muted">{t("chat_brisanje")}</span>}>
          {t("chat_naslov")}
        </NaslovSekcije>

        {/* Visina: 420 px na telefonu, 640 na računaru; prazna Pričaonica je niska. */}
        <Kartica padding="nema" className={`overflow-hidden flex flex-col ${poruke.length === 0 ? "" : "h-[420px] md:h-[640px]"}`}>
          {/* Spisak poruka */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
          >
            {poruke.length === 0 ? (
              <PraznoStanje kompaktno naslov={t("chat_nema_poruka")} />
            ) : (
              poruke.map((p) => {
                const moja = p.userId === currentUserId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-end gap-2 ${moja ? "justify-end" : "justify-start"}`}
                  >
                    {!moja && <ChatAvatar avatar={p.avatar} pseudonim={p.pseudonim} userId={p.userId} />}
                    <div className={`max-w-[75%] ${moja ? "items-end" : "items-start"} flex flex-col`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Link
                          href={profilHref({ id: p.userId, pseudonim: p.pseudonim })}
                          className="text-xs font-medium text-kolo-green-700 hover:underline"
                        >
                          <Pseudonim>{p.pseudonim}</Pseudonim>
                        </Link>
                        {p.verified && (
                          <span className="text-xs bg-kolo-green-100 text-kolo-green-700 px-1 rounded font-medium">
                            ✓
                          </span>
                        )}
                        <span className="text-xs text-kolo-muted">
                          {new Date(p.createdAt).toLocaleString(intlTag(locale), {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {p.izmenjeno && (
                          <span className="text-xs text-kolo-muted italic">{t("chat_izmenjeno")}</span>
                        )}
                        {jeAdminViewer && (
                          <button
                            onClick={() => ukloniPoruku(p.id)}
                            title={t("chat_ukloni_poruku")}
                            aria-label={t("chat_ukloni_poruku")}
                            className="-my-3 inline-flex size-10 items-center justify-center rounded-kontrola text-xs text-kolo-muted hover:text-kolo-danger transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {menjaId === p.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            sacuvajIzmenu(p.id);
                          }}
                          className="flex w-full flex-col items-end gap-1"
                        >
                          <textarea
                            value={menjaTekst}
                            onChange={(e) => setMenjaTekst(e.target.value)}
                            aria-label={t("chat_izmeni")}
                            maxLength={1000}
                            rows={2}
                            autoFocus
                            className={KLASE_UNOSA + " w-72 max-w-full"}
                          />
                          <div className="flex gap-3 text-xs">
                            <button type="button" onClick={() => setMenjaId(null)} className="inline-flex min-h-10 items-center text-kolo-muted hover:underline">
                              {t("chat_odustani")}
                            </button>
                            <button
                              type="submit"
                              disabled={!menjaTekst.trim() || cuva}
                              className="inline-flex min-h-10 items-center font-medium text-kolo-green-700 hover:underline disabled:opacity-50"
                            >
                              {cuva ? "..." : t("chat_sacuvaj")}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                            moja
                              ? "bg-kolo-green-700 text-white rounded-tr-sm"
                              : "bg-kolo-bg text-kolo-text rounded-tl-sm"
                          }`}
                        >
                          {p.content}
                        </div>
                      )}
                      {moja && menjaId !== p.id && (
                        <div className="flex gap-3 text-xs text-kolo-muted">
                          <button
                            type="button"
                            onClick={() => {
                              setMenjaId(p.id);
                              setMenjaTekst(p.content);
                            }}
                            className="inline-flex min-h-10 items-center hover:text-kolo-green-700 hover:underline"
                          >
                            {t("chat_izmeni")}
                          </button>
                          <button
                            type="button"
                            onClick={() => obrisiSvoju(p.id)}
                            className="inline-flex min-h-10 items-center hover:text-kolo-danger hover:underline"
                          >
                            {t("chat_obrisi")}
                          </button>
                        </div>
                      )}
                    </div>
                    {moja && <ChatAvatar avatar={p.avatar} pseudonim={p.pseudonim} userId={p.userId} />}
                  </div>
                );
              })
            )}
          </div>

          {/* Unos — od seta 4.8.1 piše i nov član (Uslovi čl. 14 st. 2) */}
          <div className="border-t border-kolo-border p-3">
            <form onSubmit={posaljiPoruku} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("chat_placeholder")}
                  aria-label={t("chat_placeholder")}
                  maxLength={1000}
                  className={KLASE_UNOSA + " flex-1"}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || salje}
                  className={klaseDugmeta()}
                >
                  {salje ? "..." : t("chat_posalji")}
                </button>
              </form>
            {greska && (
              <Obavestenje vrsta="greska" className="mt-2">{greska}</Obavestenje>
            )}
          </div>
        </Kartica>
      </section>
      </div>
    </Stranica>
  );
}

// Mali avatar korisnika pored poruke u pričaonici. R2/http URL ili legacy base64;
// fallback = inicijal pseudonima. Klik vodi na javni profil.
function ChatAvatar({
  avatar,
  pseudonim,
  userId,
}: {
  avatar: string | null;
  pseudonim: string;
  userId: string;
}) {
  const inicijal = (pseudonim?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <Link
      href={profilHref({ id: userId, pseudonim })}
      title={pseudonim}
      className="shrink-0 w-7 h-7 rounded-full overflow-hidden bg-kolo-green-500 flex items-center justify-center text-white font-bold text-xs mb-0.5"
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt={pseudonim}
          width={28}
          height={28}
          decoding="async"
          className="w-full h-full object-cover"
        />
      ) : (
        inicijal
      )}
    </Link>
  );
}

