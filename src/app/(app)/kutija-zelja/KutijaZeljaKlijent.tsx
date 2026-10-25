"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TEKST_MAX, type StanjeZelje } from "@/lib/kutija-zelja-pravila";
import { useDijalog } from "@/components/ui/Dijalog";

type Predlog = {
  id: string;
  tekst: string;
  stanje: "PRIKAZAN" | "ODGOVOREN";
  brojPodrski: number;
  podrzao: boolean;
  moj: boolean;
  odgovor: { tekst: string; datum: string } | null;
};

type MojPredlog = {
  id: string;
  tekst: string;
  stanje: StanjeZelje;
  brojPodrski: number;
  razlogOdbijanja: string | null;
  odgovor: { tekst: string; datum: string } | null;
  datum: string;
};

type Podaci = {
  predlozi: Predlog[];
  moji: MojPredlog[];
  mozePredloziti: boolean;
  razlog: string | null;
};

/**
 * Kutija želja (whitepaper 5.0, pogl. 7) — dete predlaže novu funkciju, igru ili
 * pravilo za dečji prostor i podržava predloge druge dece.
 *
 * 🔴 Ovo nije razgovor: nema komentara ni odgovora među decom. Na ekranu nema imena
 * ni pseudonima autora (server ih i ne šalje). Podrška nije nagrada i nema
 * rang-liste dece — redosled je po broju podrški PREDLOGA, ne dece.
 *
 * Paleta je dečja (`deca-*`, kao na dečjoj početnoj i kod prijatelja); tekst nije
 * manji od `text-sm`, a dugmad nose `.meta-dete`.
 */
export default function KutijaZeljaKlijent({ otvorena }: { otvorena: boolean }) {
  const t = useTranslations("kutijaZelja");
  const [podaci, setPodaci] = useState<Podaci | null>(null);
  const [tekst, setTekst] = useState("");
  const [salje, setSalje] = useState(false);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    try {
      const res = await fetch("/api/deca/kutija-zelja", { cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error);
      setPodaci(d);
    } catch (e) {
      setGreska(e instanceof Error && e.message ? e.message : t("greska_ucitavanje"));
    }
  }, [t]);

  useEffect(() => {
    if (otvorena) void ucitaj();
  }, [otvorena, ucitaj]);

  if (!otvorena) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-center text-3xl font-extrabold text-deca-slezova-600">{t("naslov")}</h1>
        <section className="rounded-3xl border-4 border-deca-narandza-400 bg-white p-6 text-center">
          <p className="text-base text-kolo-text">{t("zatvoreno")}</p>
        </section>
      </div>
    );
  }

  const posalji = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska(null);
    setPoruka(null);
    if (!tekst.trim()) {
      setGreska(t("prazno_polje"));
      return;
    }
    setSalje(true);
    try {
      const res = await fetch("/api/deca/kutija-zelja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tekst }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? t("greska_slanje"));
      setTekst("");
      setPoruka(t("poslato"));
      await ucitaj();
    } catch (e) {
      setGreska(e instanceof Error ? e.message : t("greska_slanje"));
    } finally {
      setSalje(false);
    }
  };

  const podrzi = async (p: Predlog) => {
    setGreska(null);
    const res = await fetch(`/api/deca/kutija-zelja/${p.id}/podrska`, { method: p.podrzao ? "DELETE" : "POST" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setGreska(d.error ?? t("greska_slanje"));
      return;
    }
    setPodaci((s) =>
      s
        ? {
            ...s,
            predlozi: s.predlozi.map((x) => (x.id === p.id ? { ...x, podrzao: d.podrzao, brojPodrski: d.brojPodrski } : x)),
          }
        : s,
    );
  };

  const povuci = async (id: string) => {
    if (!(await potvrdi({ poruka: t("povuci_potvrda"), dugme: t("povuci") }))) return;
    setGreska(null);
    const res = await fetch(`/api/deca/kutija-zelja/${id}`, { method: "DELETE" });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setGreska(d.error ?? t("greska_slanje"));
    await ucitaj();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {dijalog}
      <h1 className="text-center text-3xl font-extrabold text-deca-slezova-600 sm:text-4xl">{t("naslov")}</h1>
      <p className="text-center text-base text-kolo-text">{t("uvod")}</p>

      {/* Nov predlog */}
      <form onSubmit={posalji} className="space-y-3 rounded-3xl border-4 border-deca-sunce-400 bg-white p-5">
        <label htmlFor="nova-zelja" className="block text-lg font-bold text-deca-nebo-600">
          {t("nov_naslov")}
        </label>
        <p className="text-sm text-kolo-muted">{t("nov_pomoc")}</p>
        <textarea
          id="nova-zelja"
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          rows={3}
          maxLength={TEKST_MAX}
          placeholder={t("nov_primer")}
          className="w-full rounded-2xl border-[3px] border-deca-more-400 bg-white px-4 py-3 text-base outline-none focus:border-deca-more-600"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-kolo-muted">{t("znakova", { broj: [...tekst].length, najvise: TEKST_MAX })}</span>
          <button
            type="submit"
            disabled={salje}
            className="meta-dete rounded-full bg-deca-slezova-600 px-6 py-3 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {salje ? t("salje") : t("posalji")}
          </button>
        </div>
        {podaci && !podaci.mozePredloziti && podaci.razlog && (
          <p className="rounded-xl bg-deca-sunce-100 px-3 py-2 text-sm text-deca-sunce-ink">{podaci.razlog}</p>
        )}
        <p className="text-sm text-kolo-muted">{t("napomena")}</p>
      </form>

      {poruka && <p className="rounded-xl bg-deca-trava-100 px-4 py-3 text-base text-kolo-text">{poruka}</p>}
      {greska && (
        <p role="alert" className="rounded-xl bg-deca-korala-100 px-4 py-3 text-base text-kolo-text">
          {greska}
        </p>
      )}

      {/* Predlozi dece — bez autora */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-kolo-text">{t("predlozi_naslov")}</h2>
        {podaci === null ? (
          <p className="text-base text-kolo-muted">{t("ucitavanje")}</p>
        ) : podaci.predlozi.length === 0 ? (
          <p className="rounded-3xl border-[3px] border-deca-more-400 bg-white p-6 text-center text-base text-kolo-muted">
            {t("predlozi_prazno")}
          </p>
        ) : (
          <ul className="space-y-3">
            {podaci.predlozi.map((p) => (
              <li key={p.id} className="rounded-3xl border-[3px] border-deca-more-400 bg-white p-5">
                <p className="whitespace-pre-wrap text-base text-kolo-text">{p.tekst}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-base font-bold tabular-nums text-deca-nebo-600">
                    {t("podrski", { broj: p.brojPodrski })}
                  </span>
                  {p.moj ? (
                    <span className="text-sm text-kolo-muted">{t("tvoj_predlog")}</span>
                  ) : (
                    p.stanje === "PRIKAZAN" && (
                      <button
                        type="button"
                        onClick={() => podrzi(p)}
                        aria-pressed={p.podrzao}
                        className={`meta-dete rounded-full px-5 py-2 text-base font-bold transition ${
                          p.podrzao
                            ? "border-[3px] border-deca-trava-600 bg-white text-deca-trava-600"
                            : "bg-deca-trava-600 text-white hover:opacity-90"
                        }`}
                      >
                        {p.podrzao ? t("povuci_podrsku") : t("podrzi")}
                      </button>
                    )
                  )}
                </div>
                {p.odgovor && <Odgovor tekst={p.odgovor.tekst} naslov={t("odgovor_naslov")} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Moji predlozi — samo dete vidi stanje svojih predloga */}
      {podaci && podaci.moji.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-kolo-text">{t("moji_naslov")}</h2>
          <ul className="space-y-3">
            {podaci.moji.map((m) => (
              <li key={m.id} className="rounded-3xl border-[3px] border-deca-slezova-400 bg-white p-5">
                <p className="text-sm font-bold text-deca-slezova-600">{t(`stanje_${m.stanje}`)}</p>
                <p className="mt-1 whitespace-pre-wrap text-base text-kolo-text">{m.tekst}</p>
                {m.stanje === "ODBIJEN" && m.razlogOdbijanja && (
                  <p className="mt-3 rounded-xl bg-deca-sunce-100 px-3 py-2 text-base text-deca-sunce-ink">
                    {t("razlog", { razlog: m.razlogOdbijanja })}
                  </p>
                )}
                {m.odgovor && <Odgovor tekst={m.odgovor.tekst} naslov={t("odgovor_naslov")} />}
                {(m.stanje === "NA_PREGLEDU" || m.stanje === "PRIKAZAN") && (
                  <button
                    type="button"
                    onClick={() => povuci(m.id)}
                    className="meta-dete mt-3 rounded-full border-[3px] border-deca-korala-400 bg-white px-5 py-2 text-base font-bold text-deca-korala-600 transition hover:opacity-90"
                  >
                    {t("povuci")}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Odgovor({ tekst, naslov }: { tekst: string; naslov: string }) {
  return (
    <div className="mt-3 rounded-2xl bg-deca-nebo-100 p-4">
      <p className="text-sm font-bold text-deca-nebo-600">{naslov}</p>
      <p className="mt-1 whitespace-pre-wrap text-base text-kolo-text">{tekst}</p>
    </div>
  );
}
