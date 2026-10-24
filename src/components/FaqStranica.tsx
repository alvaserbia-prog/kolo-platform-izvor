"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { getFaqSekcije } from "@/lib/faq-data";
import { useLocale, useTranslations } from "next-intl";
import Kartica from "@/components/ui/Kartica";
import PraznoStanje from "@/components/ui/PraznoStanje";

export default function FaqStranica() {
  const locale = useLocale();
  const t = useTranslations("cestoPage");
  const FAQ_SEKCIJE = useMemo(() => getFaqSekcije(locale), [locale]);

  const [pretraga, setPretraga] = useState("");
  const [otvoreni, setOtvoreni] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setOtvoreni((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtrirano = useMemo(() => {
    const q = pretraga.trim().toLowerCase();
    if (!q) return FAQ_SEKCIJE;
    return FAQ_SEKCIJE.map((s) => ({
      ...s,
      pitanja: s.pitanja.filter(
        (p) =>
          p.pitanje.toLowerCase().includes(q) ||
          p.odgovor.toLowerCase().includes(q)
      ),
    })).filter((s) => s.pitanja.length > 0);
  }, [pretraga, FAQ_SEKCIJE]);

  const ukupnoPrikazano = filtrirano.reduce(
    (sum, s) => sum + s.pitanja.length,
    0
  );

  return (
    <div className="space-y-5">
      {/* Pretraga */}
      <div className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-4">
        <div className="relative">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-kolo-muted"
          >
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.75" />
            <path d="M12 12L15.5 15.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={pretraga}
            onChange={(e) => setPretraga(e.target.value)}
            placeholder={t("pretraga_placeholder")}
            aria-label={t("pretraga_placeholder")}
            className="w-full min-h-11 pl-10 pr-4 py-2.5 border border-kolo-border bg-kolo-surface rounded-kontrola text-base outline-none focus:border-kolo-green-700"
          />
        </div>
        {pretraga.trim() && (
          <div className="mt-2 text-xs text-kolo-muted">
            {ukupnoPrikazano === 0
              ? t("nema_rezultata")
              : `${ukupnoPrikazano}`}
          </div>
        )}
      </div>

      {/* Brzo navigovanje (samo bez pretrage) */}
      {!pretraga.trim() && (
        <div className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica p-5">
          <div className="text-xs uppercase font-semibold text-kolo-muted tracking-wider mb-3">
            {t("brzo_navigovanje")}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
            {FAQ_SEKCIJE.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-sm text-kolo-green-700 hover:text-kolo-green-900 hover:underline transition-colors"
              >
                {s.naslov}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Sekcije sa pitanjima */}
      {filtrirano.length === 0 ? (
        <Kartica>
          <PraznoStanje naslov={t("nema_rezultata")} />
        </Kartica>
      ) : (
        filtrirano.map((sekcija) => (
          <section
            key={sekcija.id}
            id={sekcija.id}
            className="space-y-3 scroll-mt-24"
          >
            <h2
              className="text-xl font-bold text-kolo-green-900 pt-2"
              style={{ letterSpacing: "-0.02em" }}
            >
              {sekcija.naslov}
            </h2>
            <div className="space-y-2">
              {sekcija.pitanja.map((p) => {
                const otvoren = otvoreni.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-expanded={otvoren}
                      onClick={() => toggle(p.id)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-kolo-bg transition-colors"
                    >
                      <span className="font-semibold text-kolo-text text-base leading-snug">
                        {p.pitanje}
                      </span>
                      <span
                        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          otvoren
                            ? "bg-kolo-green-700 text-white"
                            : "bg-kolo-green-100 text-kolo-green-700"
                        }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d={otvoren ? "M2 8L6 4L10 8" : "M2 4L6 8L10 4"}
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                    {otvoren && (
                      <div className="px-5 pb-5">
                        <div className="border-t border-kolo-border pt-4 space-y-3">
                          {p.odgovor.split("\n\n").map((pasus, idx) => (
                            <p
                              key={idx}
                              className="text-base text-kolo-muted leading-relaxed text-body"
                              style={{ lineHeight: "1.75" }}
                            >
                              {pasus}
                            </p>
                          ))}
                          {p.link && (
                            <Link
                              href={p.link.href}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-kolo-green-700 hover:text-kolo-green-900 transition-colors"
                            >
                              {p.link.label}
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
