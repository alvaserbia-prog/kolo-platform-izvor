"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Dugme, { klaseDugmeta } from "@/components/ui/Dugme";

/** Koliko dana „Kasnije" sklanja karticu (odluka vlasnika, set 4.8.3). */
const KASNIJE_DANA = 7;
const KLJUC = "kolo-potvrda-kasnije";
/** Stranice na kojima kartica ne stoji: tamo je isti poziv već na ekranu. */
const BEZ_KARTICE = ["/verifikacija", "/kontaktiraj-nas"];

/**
 * Plutajuća kartica „Želim da me neko nazove radi potvrde" (Pravilnik o dokazu
 * stvarnosti čl. 4a, 5c; set 4.8.3) — na svakoj stranici posle prijave, i na Pijaci.
 *
 * Samo za ČLANA BEZ POTVRDE koji ispunjava uslove iz čl. 5c st. 2 i još nije na
 * spisku. „Kasnije" je sklanja na `KASNIJE_DANA` dana (pamti pretraživač); upisnik
 * ZRNA je ne može skloniti dok ne ostavi broj, jer bez potvrde nema glas (čl. 4a).
 * Korisnik, član Kola i dete je ne vide: server za njih ne vraća `radiPotvrde`.
 */
export default function PlutajucaPotvrda() {
  const t = useTranslations("spisak");
  const pathname = usePathname();
  const { data: session } = useSession();
  const [prikaz, setPrikaz] = useState<{ zrno: boolean } | null>(null);

  const kandidat = !!session?.user && session.user.verified && !session.user.potvrdjen && !session.user.maloletan;

  useEffect(() => {
    if (!kandidat) return;
    let otkazano = false;
    void (async () => {
      try {
        const r = await fetch("/api/zahtev-razgovor", { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (otkazano || !d.radiPotvrde || !d.uslovOk || d.moj) return;
        if (!d.upisaoZrno) {
          let do_ = 0;
          try {
            do_ = Number(localStorage.getItem(KLJUC) ?? 0);
          } catch {
            /* bez skladišta kartica se prikazuje */
          }
          if (do_ > Date.now()) return;
        }
        setPrikaz({ zrno: !!d.upisaoZrno });
      } catch {
        /* kartica nije obavezna za rad stranice */
      }
    })();
    return () => {
      otkazano = true;
    };
  }, [kandidat]);

  if (!prikaz || BEZ_KARTICE.some((p) => pathname?.startsWith(p))) return null;

  function kasnije() {
    try {
      localStorage.setItem(KLJUC, String(Date.now() + KASNIJE_DANA * 24 * 60 * 60 * 1000));
    } catch {
      /* bez skladišta sklanja se samo do sledećeg učitavanja */
    }
    setPrikaz(null);
  }

  return (
    <aside
      role="dialog"
      aria-labelledby="plutajuca-potvrda-naslov"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md rounded-kartica border border-kolo-border bg-kolo-surface p-4 shadow-kartica md:left-auto md:right-6 md:mx-0"
    >
      <h2 id="plutajuca-potvrda-naslov" className="text-sm font-semibold text-kolo-text">
        {t("plutajuca_naslov")}
      </h2>
      <p className="mt-1 text-sm text-kolo-muted">{prikaz.zrno ? t("plutajuca_opis_zrno") : t("plutajuca_opis")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/kontaktiraj-nas" className={klaseDugmeta({ velicina: "sm" })}>
          {t("nazove_potvrda_dugme")}
        </Link>
        {!prikaz.zrno && (
          <Dugme varijanta="sekundarno" velicina="sm" onClick={kasnije}>
            {t("plutajuca_kasnije")}
          </Dugme>
        )}
      </div>
    </aside>
  );
}
