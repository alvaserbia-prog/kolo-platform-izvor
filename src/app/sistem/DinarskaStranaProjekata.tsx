"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { intlTag } from "@/lib/format";
import Kartica from "@/components/ui/Kartica";

type Ponuda = { ponudjac: string; cenaPoJediniciRSD: number; izabrana: boolean };
type Nabavka = {
  id: string;
  naziv: string;
  status: string;
  objavljenoAt: string | null;
  ponude: Ponuda[];
  dobavljac: string | null;
  jedinicaMere: string | null;
  nabavnaCenaRSD: number | null;
  brojJedinica: number | null;
  ukupanTrosakRSD: number | null;
  gornjaGranicaRSD: number | null;
  saldoRSD: number | null;
  rezervaRSD: number | null;
  placenoRSD: number | null;
};
type Ugovor = { davalac: string; potpisanoAt: string; vrednostRSD: number; raskinut: boolean };
type Godisnji = {
  godina: number;
  utrosenoRSD: number;
  brojNabavki: number;
  brojUgovoraDobra: number;
  vrednostUgovoraDobraRSD: number;
  brojIskoriscenihVaucera: number;
};
type Odgovor = { godisnji: Godisnji; nabavke: Nabavka[]; ugovoriDobra: Ugovor[] };

/**
 * Dinarska strana projekata — deo izveštaja o raspolaganju sredstvima Fondacije
 * (nabavke čl. 37 st. 2 i 5; Pravilnik čl. 7 st. 5).
 *
 * 🔴 Ovde se NIKAD ne prikazuje broj POEN-a: dinarska strana stoji odvojeno od
 * kalkulacije nabavke, jer broj POEN-a po delu nije cena dobra (čl. 17; R-01).
 * Odbijena mera: dinarski trošak se ne vraća u tabelu sa brojem POEN-a po delu.
 * Brana: `nabavka-dinarska-strana-izvor.test.ts`.
 */
export default function DinarskaStranaProjekata() {
  const t = useTranslations("nabavke");
  const locale = useLocale();
  const [d, setD] = useState<Odgovor | null>(null);

  useEffect(() => {
    let aktivno = true;
    fetch("/api/javno/fondacija/projekti")
      .then((r) => (r.ok ? r.json() : null))
      .then((x) => { if (aktivno) setD(x); })
      .catch(() => { if (aktivno) setD(null); });
    return () => { aktivno = false; };
  }, []);

  if (!d) return null;

  const rsd = (n: number | null) =>
    n === null ? "—" : `${n.toLocaleString(intlTag(locale), { maximumFractionDigits: 2 })} RSD`;
  const datum = (s: string | null) => (s ? new Date(s).toLocaleDateString(intlTag(locale), { timeZone: "Europe/Belgrade" }) : "—");
  const g = d.godisnji;

  return (
    <div className="mt-6 space-y-4">
      <Kartica as="section">
        <h2 className="text-lg font-semibold">{t("izvestaj_naslov")}</h2>
        <p className="mt-1 text-sm text-kolo-muted">{t("dinarska_opis")}</p>
        <p className="mt-3 text-sm">
          {t("izvestaj_godisnji", {
            godina: g.godina,
            iznos: rsd(g.utrosenoRSD),
            nabavki: g.brojNabavki,
            ugovora: g.brojUgovoraDobra,
            vrednost: rsd(g.vrednostUgovoraDobraRSD),
            vaucera: g.brojIskoriscenihVaucera,
          })}
        </p>
      </Kartica>

      {d.nabavke.map((n) => (
        <Kartica as="section" key={n.id}>
          <h3 className="font-semibold">{t("izvestaj_nabavka", { naziv: n.naziv, datum: datum(n.objavljenoAt) })}</h3>
          <p className="text-xs text-kolo-muted">{t(`status_${n.status}` as never)}</p>
          <dl className="mt-3 divide-y divide-kolo-border text-sm">
            {[
              [t("k_saldo"), rsd(n.saldoRSD)],
              [t("k_rezerva"), `− ${rsd(n.rezervaRSD)}`],
              [t("k_iznos"), rsd(n.gornjaGranicaRSD)],
              [t("k_dobavljac"), n.dobavljac ?? "—"],
              [t("k_nabavna"), `${rsd(n.nabavnaCenaRSD)} / ${n.jedinicaMere ?? ""}`],
              [t("izvestaj_kolicina"), n.brojJedinica === null ? "—" : String(n.brojJedinica)],
              [t("izvestaj_ukupan_trosak"), rsd(n.ukupanTrosakRSD)],
              [t("k_placeno"), rsd(n.placenoRSD)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 py-1.5">
                <dt className="text-kolo-muted">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          {n.ponude.length > 0 && (
            <>
              <h4 className="mt-4 text-sm font-semibold">{t("ponude")}</h4>
              <p className="text-xs text-kolo-muted">{t("ponude_opis")}</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {n.ponude.map((p, i) => (
                  <li
                    key={i}
                    className={`flex items-center justify-between gap-3 rounded-kontrola px-3 py-2 ${
                      p.izabrana ? "bg-kolo-green-100 font-semibold" : "bg-kolo-bg"
                    }`}
                  >
                    <span className="truncate">{p.izabrana ? "✓ " : ""}{p.ponudjac}</span>
                    <span className="shrink-0">{rsd(p.cenaPoJediniciRSD)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Kartica>
      ))}

      {d.ugovoriDobra.length > 0 && (
        <Kartica as="section">
          <h3 className="font-semibold">{t("izvestaj_ugovori_naslov")}</h3>
          <ul className="mt-2 divide-y divide-kolo-border text-sm">
            {d.ugovoriDobra.map((u, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-1.5">
                <span className="truncate">
                  {u.davalac}
                  <span className="text-kolo-muted"> · {datum(u.potpisanoAt)}{u.raskinut ? ` · ${t("izvestaj_raskinut")}` : ""}</span>
                </span>
                <span className="shrink-0 font-medium">{rsd(u.vrednostRSD)}</span>
              </li>
            ))}
          </ul>
        </Kartica>
      )}
    </div>
  );
}
