"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Zajednički prozor za potvrdu, unos razloga i poruku — umesto sistemskih
 * `confirm`/`prompt`/`alert` pregledača (sitan tekst, bez oblikovanja, na
 * telefonu jednoredno polje). Koristi se kao kuka:
 *
 *   const { dijalog, potvrdi, unesi, obavesti } = useDijalog();
 *   if (!(await potvrdi({ poruka: "…", opasno: true }))) return;
 *   const razlog = await unesi({ poruka: "…", oznaka: "Razlog" }); // null = odustao
 *   …
 *   return <>{dijalog}…</>;
 */
type Zahtev =
  | { vrsta: "potvrdi"; naslov?: ReactNode; poruka: ReactNode; opasno?: boolean; dugme?: string; razresi: (v: boolean) => void }
  | { vrsta: "unesi"; naslov?: ReactNode; poruka: ReactNode; oznaka?: string; pocetno?: string; opasno?: boolean; dugme?: string; opciono?: boolean; razresi: (v: string | null) => void }
  | { vrsta: "obavesti"; naslov?: ReactNode; poruka: ReactNode; razresi: () => void };

type BezRazresi<T> = T extends unknown ? Omit<T, "razresi" | "vrsta"> : never;

export function useDijalog() {
  const [zahtev, setZahtev] = useState<Zahtev | null>(null);

  const potvrdi = useCallback(
    (o: BezRazresi<Extract<Zahtev, { vrsta: "potvrdi" }>>) =>
      new Promise<boolean>((razresi) => setZahtev({ vrsta: "potvrdi", ...o, razresi })),
    [],
  );
  const unesi = useCallback(
    (o: BezRazresi<Extract<Zahtev, { vrsta: "unesi" }>>) =>
      new Promise<string | null>((razresi) => setZahtev({ vrsta: "unesi", ...o, razresi })),
    [],
  );
  const obavesti = useCallback(
    (poruka: ReactNode, naslov?: ReactNode) =>
      new Promise<void>((razresi) => setZahtev({ vrsta: "obavesti", poruka, naslov, razresi })),
    [],
  );

  const dijalog = zahtev ? <ProzorDijaloga zahtev={zahtev} zatvori={() => setZahtev(null)} /> : null;
  return { dijalog, potvrdi, unesi, obavesti };
}

function ProzorDijaloga({ zahtev, zatvori }: { zahtev: Zahtev; zatvori: () => void }) {
  const t = useTranslations("common");
  const id = useId();
  const [tekst, setTekst] = useState(zahtev.vrsta === "unesi" ? zahtev.pocetno ?? "" : "");
  const prvoRef = useRef<HTMLTextAreaElement | HTMLButtonElement | null>(null);

  const odustani = useCallback(() => {
    if (zahtev.vrsta === "potvrdi") zahtev.razresi(false);
    else if (zahtev.vrsta === "unesi") zahtev.razresi(null);
    else zahtev.razresi();
    zatvori();
  }, [zahtev, zatvori]);

  const prihvati = () => {
    if (zahtev.vrsta === "potvrdi") zahtev.razresi(true);
    else if (zahtev.vrsta === "unesi") {
      // Prazan unos prolazi samo kad je razlog opcion (`opciono: true`).
      if (!tekst.trim() && !zahtev.opciono) return;
      zahtev.razresi(tekst.trim());
    } else zahtev.razresi();
    zatvori();
  };

  useEffect(() => {
    prvoRef.current?.focus();
    const naTaster = (e: KeyboardEvent) => {
      if (e.key === "Escape") odustani();
    };
    window.addEventListener("keydown", naTaster);
    return () => window.removeEventListener("keydown", naTaster);
  }, [odustani]);

  const opasno = zahtev.vrsta !== "obavesti" && zahtev.opasno;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={odustani}>
      <div
        role={zahtev.vrsta === "obavesti" ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={`${id}-naslov`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4"
      >
        <h2 id={`${id}-naslov`} className="text-base font-semibold text-kolo-text">
          {zahtev.naslov ?? (zahtev.vrsta === "obavesti" ? t("dijalog_obavestenje") : t("dijalog_potvrda"))}
        </h2>
        <div className="text-sm leading-relaxed text-kolo-text">{zahtev.poruka}</div>
        {zahtev.vrsta === "unesi" && (
          <div>
            <label htmlFor={`${id}-unos`} className="mb-1.5 block text-sm font-medium text-kolo-text">
              {zahtev.oznaka ?? t("dijalog_razlog")}
            </label>
            <textarea
              id={`${id}-unos`}
              ref={(el) => { prvoRef.current = el; }}
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-kolo-border px-3 py-2 text-sm outline-none focus:border-kolo-green-700"
            />
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {zahtev.vrsta !== "obavesti" && (
            <button
              type="button"
              onClick={odustani}
              className="min-h-10 rounded-xl border border-kolo-border bg-white px-4 text-sm font-semibold text-kolo-text hover:bg-kolo-bg"
            >
              {t("odustani")}
            </button>
          )}
          <button
            type="button"
            ref={zahtev.vrsta === "unesi" ? undefined : (el) => { prvoRef.current = el; }}
            onClick={prihvati}
            disabled={zahtev.vrsta === "unesi" && !zahtev.opciono && !tekst.trim()}
            className={`min-h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${
              opasno ? "bg-kolo-danger hover:bg-kolo-danger/90" : "bg-kolo-green-700 hover:bg-kolo-green-800"
            }`}
          >
            {zahtev.vrsta === "obavesti" ? t("u_redu") : zahtev.dugme ?? t("potvrdi")}
          </button>
        </div>
      </div>
    </div>
  );
}
