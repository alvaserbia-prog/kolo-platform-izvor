"use client";

import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import { useState, useCallback, memo } from "react";
import { intlTag } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";

interface Predlog {
  id: string;
  title: string;
  description: string;
  authorPseudonim: string;
  glasanjePocetak: string;
  deadline: string;
  status: "ACTIVE" | "CLOSED";
  faza: "NAJAVLJEN" | "U_TOKU" | "ZATVOREN";
  ishodUsvojen: boolean | null;
  zaGlasova: number;
  protiGlasova: number;
  mojGlas: boolean | null;
  createdAt: string;
}

interface Props {
  predlozi: Predlog[];
  mojaGlasackaMoc: number;
}

export default function GlasanjeKlijent({ predlozi, mojaGlasackaMoc }: Props) {
  const t = useTranslations("glasanje");
  const router = useRouter();
  const [showNovi, setShowNovi] = useState(false);
  const onRefresh = useCallback(() => router.refresh(), [router]);

  return (
    <div className="space-y-6">
      {/* Glasanje je deo stranice ZRNO (grupa „Glas u Gornjem Kolu"), pa naslov nije
          naslov stranice nego podnaslov u toj grupi (C2, urednik, 24.10.2026). */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-kolo-muted">{t("naslov")}</h2>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/glasanje/registar" className="inline-flex min-h-9 items-center text-sm text-kolo-green-700 hover:underline">
              {t("registar_link")}
            </Link>
            {mojaGlasackaMoc > 0 && (
              <span className="text-xs bg-kolo-gold-100 text-kolo-gold-700 border border-kolo-gold-600 px-3 py-1.5 rounded-kontrola font-medium">
                {t("glasova_badge", { count: mojaGlasackaMoc })}
              </span>
            )}
            {mojaGlasackaMoc > 0 && (
              <Dugme onClick={() => setShowNovi((v) => !v)}>
                {t("novi_predlog")}
              </Dugme>
            )}
          </div>
      </div>

      {mojaGlasackaMoc === 0 && (
        <Obavestenje vrsta="upozorenje">
          {t("nema_zrna")}{" "}
          <Link href="/zrno" className="underline font-medium">{t("idi_na_zrno")}</Link>
        </Obavestenje>
      )}

      {showNovi && (
        <NoviPredlogForma onSuccess={() => { setShowNovi(false); router.refresh(); }} onCancel={() => setShowNovi(false)} />
      )}

      {predlozi.length === 0 ? (
        <Kartica padding="nema">
          <PraznoStanje naslov={t("nema_predloga")} />
        </Kartica>
      ) : (
        <div className="space-y-3">
          {predlozi.map((p) => (
            <PredlogKartica key={p.id} p={p} mojaGlasackaMoc={mojaGlasackaMoc} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Kartica predloga ──────────────────────────────────────────────────────────

const PredlogKartica = memo(function PredlogKartica({ p, mojaGlasackaMoc, onRefresh }: { p: Predlog; mojaGlasackaMoc: number; onRefresh: () => void }) {
  const locale = useLocale();
  const t = useTranslations("glasanje");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState<boolean | null>(null);
  const [poruka, setPoruka] = useState<string | null>(null);

  const ukupno = p.zaGlasova + p.protiGlasova;
  const zaProc = ukupno > 0 ? Math.round((p.zaGlasova / ukupno) * 100) : 0;
  const uToku = p.faza === "U_TOKU";
  const najavljen = p.faza === "NAJAVLJEN";

  // Oznaka statusa: najavljen / u toku / ishod po zatvaranju
  const statusLabel = najavljen
    ? t("najavljeno")
    : uToku
      ? t("u_toku")
      : p.ishodUsvojen === true
        ? t("usvojeno")
        : p.ishodUsvojen === false
          ? t("neusvojeno")
          : t("zatvoreno");
  const statusZelen = uToku || p.ishodUsvojen === true;

  async function glasaj(za: boolean) {
    setLoading(za); setPoruka(null);
    const res = await fetch(`/api/glasanje/${p.id}/glasaj`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ za }),
    });
    const data = await res.json();
    setLoading(null);
    if (res.ok) { onRefresh(); }
    else { setPoruka(data.error ?? tc("greska_ucitavanja")); }
  }

  return (
    <Kartica className="space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-kolo-text">{p.title}</p>
          <p className="text-xs text-kolo-muted mt-0.5">
            <Pseudonim>{p.authorPseudonim}</Pseudonim> · {new Date(p.createdAt).toLocaleDateString(intlTag(locale))}
          </p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-lg font-medium ${statusZelen ? "bg-kolo-green-100 text-kolo-green-700" : "bg-kolo-bg text-kolo-muted"}`}>
          {statusLabel}
        </span>
      </div>

      <p className="text-sm text-kolo-muted line-clamp-2">{p.description}</p>

      {/* Rezultati */}
      {ukupno > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-kolo-muted">
            <span>{t("za_glasova", { count: p.zaGlasova, pct: zaProc })}</span>
            <span>{t("protiv_glasova", { count: p.protiGlasova })}</span>
          </div>
          <div className="h-2 bg-kolo-bg rounded-full overflow-hidden">
            <div className="h-full bg-kolo-green-500 rounded-full transition-all" style={{ width: `${zaProc}%` }} />
          </div>
        </div>
      )}

      {/* Moj glas */}
      {p.mojGlas !== null && (
        <p className="text-xs text-kolo-gold-700 font-medium">
          {t("moj_glas", { glas: p.mojGlas ? t("za") : t("protiv"), moc: mojaGlasackaMoc })}
        </p>
      )}

      {/* Akcije — glasanje samo dok je U_TOKU */}
      {uToku && mojaGlasackaMoc > 0 && (
        <div className="flex gap-2">
          <Dugme varijanta={p.mojGlas === true ? "primarno" : "sekundarno"} punaSirina className="flex-1" onClick={() => glasaj(true)} disabled={loading !== null}>
            {loading === true ? "..." : t("za")}
          </Dugme>
          <Dugme varijanta={p.mojGlas === false ? "opasno" : "sekundarno"} punaSirina className="flex-1" onClick={() => glasaj(false)} disabled={loading !== null}>
            {loading === false ? "..." : t("protiv")}
          </Dugme>
        </div>
      )}

      {najavljen && (
        <p className="text-xs text-kolo-muted">{t("glasanje_pocinje", { datum: new Date(p.glasanjePocetak).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "long", year: "numeric" }) })}</p>
      )}
      {uToku && (
        <p className="text-xs text-kolo-muted">{t("rok")} {new Date(p.deadline).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "long", year: "numeric" })}</p>
      )}

      {poruka && <Obavestenje vrsta="greska">{poruka}</Obavestenje>}
    </Kartica>
  );
});

// ── Nova predlog forma ────────────────────────────────────────────────────────

function NoviPredlogForma({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const t = useTranslations("glasanje");
  const tc = useTranslations("common");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vrsta, setVrsta] = useState<"ODLUKA" | "DINARSKA_PREPORUKA">("ODLUKA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (title.trim().length < 5) { setError(t("np_greska_naslov")); return; }
    if (description.trim().length < 20) { setError(t("np_greska_opis")); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/glasanje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), vrsta }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? tc("greska_ucitavanja")); return; }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Kartica className="space-y-3">
      <p className="text-sm font-semibold text-kolo-muted">{t("novi_predlog_naslov")}</p>
      <input type="text" placeholder={t("naslov_placeholder")} aria-label={t("naslov_placeholder")} value={title} onChange={(e) => setTitle(e.target.value)}
        className={KLASE_UNOSA} />
      <textarea rows={3} placeholder={t("opis_placeholder")} aria-label={t("opis_placeholder")} value={description} onChange={(e) => setDescription(e.target.value)}
        className={`${KLASE_UNOSA} resize-none`} />
      <Polje oznaka={t("vrsta_label")}>
        <select value={vrsta} onChange={(e) => setVrsta(e.target.value as "ODLUKA" | "DINARSKA_PREPORUKA")}
          className={KLASE_UNOSA}>
          <option value="ODLUKA">{t("vrsta_odluka")}</option>
          <option value="DINARSKA_PREPORUKA">{t("vrsta_preporuka")}</option>
        </select>
      </Polje>
      <p className="text-xs text-kolo-muted bg-kolo-bg rounded-kontrola px-3 py-2">{t("period_info")}</p>
      {error && <Obavestenje vrsta="greska">{error}</Obavestenje>}
      <div className="flex gap-2">
        <Dugme varijanta="sekundarno" className="flex-1" onClick={onCancel}>{tc("otkazi")}</Dugme>
        <Dugme className="flex-1" onClick={handleSubmit} disabled={loading}>
          {loading ? "..." : t("objavi")}
        </Dugme>
      </div>
    </Kartica>
  );
}
