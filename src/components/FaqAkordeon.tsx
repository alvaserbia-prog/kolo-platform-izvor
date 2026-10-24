"use client";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { FaqPitanje } from "@/lib/faq-data";

type Props = {
  pitanja: FaqPitanje[];
};

export default function FaqAkordeon({ pitanja }: Props) {
  const [otvoren, setOtvoren] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {pitanja.map((item, i) => (
        <div key={item.id} className="bg-kolo-surface border border-kolo-border rounded-kartica shadow-kartica overflow-hidden">
          <button
            type="button"
            aria-expanded={otvoren === i}
            onClick={() => setOtvoren(otvoren === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-kolo-bg transition-colors"
          >
            <span className="font-semibold text-kolo-text text-base leading-snug">
              {item.pitanje}
            </span>
            <span
              className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                otvoren === i
                  ? "bg-kolo-green-700 text-white"
                  : "bg-kolo-green-100 text-kolo-green-700"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d={otvoren === i ? "M2 8L6 4L10 8" : "M2 4L6 8L10 4"}
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
          {otvoren === i && (
            <div className="px-5 pb-5">
              <div className="border-t border-kolo-border pt-4 space-y-3">
                {item.odgovor.split("\n\n").map((pasus, idx) => (
                  <p
                    key={idx}
                    className="text-base text-kolo-muted leading-relaxed text-body"
                    style={{ lineHeight: "1.75" }}
                  >
                    {pasus}
                  </p>
                ))}
                {item.link && (
                  <Link
                    href={item.link.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-kolo-green-700 hover:text-kolo-green-900 transition-colors"
                  >
                    {item.link.label}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
