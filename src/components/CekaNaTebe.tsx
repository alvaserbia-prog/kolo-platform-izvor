"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMe } from "@/hooks/useMe";

/**
 * „Čeka na tebe" — kartica na Početnoj za člana Kola, čuvara i osnivača
 * (odluka vlasnika 22.10.2026). Ono što čeka baš njega bilo je duboko na
 * Potvrdama i u Nadzoru, pa Početna nije imala nijedan zadatak.
 *
 * Brojeve spiska za poziv i potvrda postojanja deteta daje server; nadzor
 * stiže iz `useMe` (isti broj kao uz stavku u meniju). Bez ičega na čekanju
 * kartica se ne crta.
 */
export default function CekaNaTebe({ spisak, postojanjeDeteta }: { spisak: number; postojanjeDeteta: number }) {
  const t = useTranslations("pocetna");
  const { data: me } = useMe();
  const nadzor = me?.nadzorBroj ?? 0;
  const ukupno = spisak + postojanjeDeteta + nadzor;
  if (ukupno === 0) return null;

  const redovi = [
    { broj: spisak, href: "/verifikacija#zahtevi", kljuc: "ceka_spisak" },
    { broj: postojanjeDeteta, href: "/verifikacija#postojanje-deteta", kljuc: "ceka_postojanje" },
    { broj: nadzor, href: "/nadzor", kljuc: "ceka_nadzor" },
  ].filter((r) => r.broj > 0);

  return (
    <section className="rounded-kartica border border-kolo-border bg-kolo-surface p-5 shadow-kartica">
      <h2 className="text-base font-semibold text-kolo-text">{t("ceka_naslov", { broj: ukupno })}</h2>
      <ul className="mt-2 divide-y divide-kolo-border">
        {redovi.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="flex min-h-11 items-center justify-between gap-3 text-sm text-kolo-text hover:text-kolo-green-700">
              <span>{t(r.kljuc)}</span>
              <span className="flex items-center gap-2">
                <span className="rounded-full bg-kolo-gold-100 px-2 py-0.5 text-xs font-semibold text-kolo-gold-700">{r.broj}</span>
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
