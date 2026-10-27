"use client";

import { useState } from "react";
import { intlTag } from "@/lib/format";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Segmenti from "@/components/ui/Segmenti";
import { KLASE_UNOSA } from "@/components/ui/Polje";

type BugStatus = "PRIJAVLJEN" | "U_RADU" | "RESENO" | "ODBIJENO";

interface Bag {
  id: string;
  naslov: string;
  /** Opis i odgovor vidi samo podnosilac i administratorski tim (Politika čl. 32 st. 4). */
  opis: string | null;
  status: BugStatus;
  odgovor: string | null;
  resenoAt: string | null;
  createdAt: string;
  /** `null` kad je prijavilac maloletan, a posmatrač nije on sam ni admin. */
  prijavio: string | null;
  mojBag: boolean;
}

const STATUS_REDOSLED: Record<BugStatus, number> = {
  U_RADU: 0,
  PRIJAVLJEN: 1,
  RESENO: 2,
  ODBIJENO: 3,
};

const STATUS_STIL: Record<BugStatus, string> = {
  PRIJAVLJEN: "bg-kolo-gold-100 text-kolo-gold-700",
  U_RADU: "bg-kolo-info-light text-kolo-info",
  RESENO: "bg-kolo-green-100 text-kolo-green-700",
  ODBIJENO: "bg-kolo-bg text-kolo-muted",
};

const SVI_STATUSI: BugStatus[] = ["PRIJAVLJEN", "U_RADU", "RESENO", "ODBIJENO"];

export default function BagoviKlijent() {
  const locale = useLocale();
  const t = useTranslations("bagovi");
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const jeAdmin = session?.user.admin === "ADMIN" || session?.user.admin === "SUPERADMIN";
  // Maloletni korisnik vidi samo svoje prijave (server ih tako i vraća).
  const samoMoje = session?.user.maloletan === true && !jeAdmin;

  const [naslov, setNaslov] = useState("");
  const [opis, setOpis] = useState("");
  const [slanje, setSlanje] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState(false);

  const queryClient = useQueryClient();
  const { data: bagovi = null, refetch } = useQuery({
    queryKey: ["bagovi"],
    queryFn: async (): Promise<Bag[]> => {
      const r = await fetch("/api/bagovi");
      const d = await r.json();
      return Array.isArray(d) ? d : [];
    },
  });

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setGreska(null);
    setUspeh(false);
    if (naslov.trim().length < 3 || opis.trim().length < 10) {
      setGreska(t("validacija"));
      return;
    }
    setSlanje(true);
    try {
      const r = await fetch("/api/bagovi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naslov, opis }),
      });
      const j = await r.json();
      if (!r.ok) {
        setGreska(j.error ?? tc("greska_ucitavanja"));
        return;
      }
      setNaslov("");
      setOpis("");
      setUspeh(true);
      await refetch();
    } catch {
      setGreska(tc("greska_ucitavanja"));
    } finally {
      setSlanje(false);
    }
  }

  async function promeniStatus(id: string, status: BugStatus) {
    // Optimističko ažuriranje keša (instant promena statusa u UI), kao i ranije.
    queryClient.setQueryData<Bag[] | null>(["bagovi"], (prev) =>
      prev ? prev.map((b) => (b.id === id ? { ...b, status } : b)) : prev
    );
    await fetch(`/api/admin/bagovi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    await refetch();
  }

  const sortirani = bagovi
    ? [...bagovi].sort(
        (a, b) =>
          STATUS_REDOSLED[a.status] - STATUS_REDOSLED[b.status] ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];

  return (
    <div className="space-y-6">
      <NaslovStranice naslov={t("naslov")} opis={t("uvod")} />

      {/* Forma za prijavu */}
      <form onSubmit={posalji} className="bg-kolo-surface rounded-kartica shadow-kartica border border-kolo-border p-5 space-y-3">
        <p className="text-sm font-semibold text-kolo-text">{t("forma_naslov")}</p>
        <input
          type="text"
          value={naslov}
          onChange={(e) => setNaslov(e.target.value)}
          placeholder={t("placeholder_naslov")}
          aria-label={t("placeholder_naslov")}
          maxLength={200}
          className={KLASE_UNOSA}
        />
        <textarea
          value={opis}
          onChange={(e) => setOpis(e.target.value)}
          placeholder={t("placeholder_opis")}
          rows={4}
          maxLength={4000}
          aria-label={t("placeholder_opis")}
          className={KLASE_UNOSA + " resize-y"}
        />
        {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
        {uspeh && <Obavestenje vrsta="uspeh">{t("poslato")}</Obavestenje>}
        <Dugme type="submit" disabled={slanje}>
          {slanje ? tc("saljem") : t("prijavi_btn")}
        </Dugme>
      </form>

      {/* Lista prijava */}
      <div>
        <h2 className="text-base font-semibold text-kolo-text mb-3">{samoMoje ? t("lista_naslov_moje") : t("lista_naslov")}</h2>
        {bagovi === null ? (
          <div className="bg-kolo-surface rounded-kartica shadow-kartica border border-kolo-border p-6 text-center text-sm text-kolo-muted">
            {tc("ucitavanje")}
          </div>
        ) : sortirani.length === 0 ? (
          <Kartica>
            <PraznoStanje naslov={t("nema_prijava")} />
          </Kartica>
        ) : (
          <div className="space-y-3">
            {sortirani.map((b) => (
              <div key={b.id} className="bg-kolo-surface rounded-kartica shadow-kartica border border-kolo-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-kolo-text break-words">{b.naslov}</p>
                    <p className="text-xs text-kolo-muted mt-0.5">
                      {b.prijavio && (
                        <>
                          <Pseudonim>{b.prijavio}</Pseudonim>
                          {b.mojBag && <span className="text-kolo-green-700"> · {t("ti")}</span>}
                          {" · "}
                        </>
                      )}
                      {new Date(b.createdAt).toLocaleDateString(intlTag(locale))}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STIL[b.status]}`}
                  >
                    {t(`status_${b.status}`)}
                  </span>
                </div>

                {b.opis && (
                  <p className="text-sm text-kolo-text mt-2 whitespace-pre-wrap break-words">{b.opis}</p>
                )}

                {b.odgovor && (
                  <div className="mt-3 rounded-kontrola bg-kolo-bg p-3">
                    <p className="text-xs font-semibold text-kolo-muted">{t("odgovor_naslov")}</p>
                    <p className="text-sm text-kolo-text mt-0.5 whitespace-pre-wrap break-words">{b.odgovor}</p>
                  </div>
                )}

                {jeAdmin && (
                  <div className="mt-3 pt-3 border-t border-kolo-border flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-kolo-muted">{t("admin_promeni_status")}</span>
                    <div className="max-w-full overflow-x-auto">
                      <Segmenti
                        oznaka={t("admin_promeni_status")}
                        vrednost={b.status}
                        onPromena={(s) => {
                          if (s !== b.status) void promeniStatus(b.id, s);
                        }}
                        opcije={SVI_STATUSI.map((s) => ({ vrednost: s, oznaka: t(`status_${s}`) }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
