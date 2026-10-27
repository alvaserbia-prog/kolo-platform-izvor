"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { UZRAST_MIN, UZRAST_PUNOLETSTVO } from "@/lib/deca-pravila";
import { validanPseudonim } from "@/lib/validacija";
import PrikaziLozinkuDugme from "@/components/PrikaziLozinkuDugme";
import DatumRodjenja from "@/components/DatumRodjenja";
import { klaseDugmeta } from "@/components/ui/Dugme";
import ObavestenjeUi from "@/components/ui/Obavestenje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

type Dete = {
  id: string;
  pseudonim: string;
  godine: number | null;
  dozvolaOdrasli: boolean;
  /** `null` dok je veza zaustavljena po prijavi (čl. 17 st. 2) — tada nema uvida. */
  balans: number | null;
  /** Tri stanja naloga (čl. 5). Roditelj mora da vidi u kom je njegovo dete. */
  stanje: "NA_CEKANJU" | "POVEZANO" | "AKTIVNO";
  /** Veza ovog roditelja je zaustavljena po prijavi lažnog roditeljstva (čl. 17). */
  zaustavljeno: boolean;
  /** Potvrda postojanja deteta ZA OVOG roditelja (čl. 13). */
  postojanje: "NIJE_TRAZENO" | "TRAZENO" | "POTVRDJENO";
  /** Šestocifreni kod kojim ulazi DRUGI roditelj (čl. 11). */
  kod: string | null;
  roditelji: string[];
};

type Poziv = { token: string; deteId: string; pseudonim: string; brisanjeDo: string };

type Korak = "spisak" | "obavestenje" | "obrazac" | "preuzmi";

/**
 * Odeljak „Moja deca" u profilu roditelja (Pravilnik o učešću dece čl. 7).
 *
 * 🔴 Klik na „Dodaj dete" NE otvara obrazac nego EKRAN OBAVEŠTENJA. Redosled je
 * pravno obavezan: obaveštenje o obradi mora prethoditi prikupljanju podataka o
 * detetu, ne pratiti ga. Zato su to dva odvojena koraka, a ne jedan ekran sa
 * tekstom iznad polja.
 */
export default function MojaDeca() {
  const t = useTranslations("deca");
  const [korak, setKorak] = useState<Korak>("spisak");
  const [deca, setDeca] = useState<Dete[] | null>(null);
  const [pozivi, setPozivi] = useState<Poziv[]>([]);
  const [greska, setGreska] = useState<string | null>(null);

  const ucitaj = useCallback(async () => {
    try {
      const res = await fetch("/api/deca", { cache: "no-store" });
      if (res.status === 410) return setDeca([]); // modul nije u radu
      if (!res.ok) throw new Error();
      setDeca((await res.json()).deca);
      // Primarni put iz čl. 11: roditelj koji se registrovao istim imejlom
      // koji je dete unelo ne mora ništa da traži — veza mu se sama predloži.
      const resP = await fetch("/api/deca/preuzmi", { cache: "no-store" });
      if (resP.ok) setPozivi((await resP.json()).pozivi ?? []);
    } catch {
      setGreska(t("greska_ucitavanje"));
    }
  }, [t]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  if (deca === null && !greska) return null;

  return (
    <section id="moja-deca" className="scroll-mt-20 rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica">
      <h2 className="text-lg font-semibold text-kolo-text">{t("naslov")}</h2>
      <p className="mt-1 text-sm text-kolo-muted">{t("podnaslov")}</p>

      {greska && <ObavestenjeUi vrsta="greska" className="mt-3">{greska}</ObavestenjeUi>}

      {korak === "spisak" && (
        <>
          {/* Predlog veze — dete je pri registraciji navelo baš ovu adresu. */}
          {pozivi.length > 0 && (
            <ul className="mt-4 space-y-2">
              {pozivi.map((p) => (
                <li
                  key={p.token}
                  className="rounded-kontrola border-l-4 border-kolo-green-700 bg-kolo-bg px-4 py-3"
                >
                  <p className="text-sm text-kolo-text">
                    {t("poziv_predlog", { pseudonim: p.pseudonim })}
                  </p>
                  <Link
                    href={`/dete-poziv/${p.token}`}
                    className={klaseDugmeta() + " mt-2"}
                  >
                    {t("poziv_dugme")}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {deca && deca.length > 0 && (
            <ul className="mt-4 space-y-2">
              {deca.map((d) => (
                <li key={d.id}>
                  {d.zaustavljeno ? (
                    /* Dok je veza zaustavljena, roditelj nema uvid (čl. 17 st. 2) — samo
                       saznaje da je tako, bez linka na podešavanja deteta. */
                    <div className="rounded-kontrola bg-kolo-bg px-4 py-3">
                      <span className="block truncate font-medium text-kolo-text">{d.pseudonim}</span>
                      <span className="block text-xs text-kolo-muted">{t("veza_zaustavljena")}</span>
                    </div>
                  ) : (
                    <Link
                      href={`/deca/${d.id}`}
                      className="flex items-center justify-between gap-3 rounded-kontrola border border-kolo-border px-4 py-3 transition-colors hover:bg-kolo-bg"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-kolo-text">{d.pseudonim}</span>
                        <span className="block text-xs text-kolo-muted">
                          {d.godine !== null && `${t("godina", { broj: d.godine })} · `}
                          {t(`stanje_${d.stanje.toLowerCase()}`)}
                          {" · "}
                          {d.postojanje === "POTVRDJENO"
                            ? t("postojanje_kratko_potvrdjeno")
                            : d.postojanje === "TRAZENO"
                              ? t("postojanje_kratko_trazeno")
                              : t("postojanje_kratko_nije_trazeno")}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-kolo-muted">
                        {(d.balans ?? 0).toLocaleString("sr-RS")} POEN
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setKorak("obavestenje")}
              className={klaseDugmeta()}
            >
              {t("dugme_dodaj")}
            </button>
            {/* Isti obrazac služi PRVOG roditelja kome poruka nije stigla i DRUGOG
                roditelja (uvek). Nema zasebnog puta za „drugog roditelja": obojica
                rade istu radnju i dobijaju ista ovlašćenja (čl. 11; čl. 2 st. 4). */}
            <button
              type="button"
              onClick={() => setKorak("preuzmi")}
              className={klaseDugmeta({ varijanta: "sekundarno" })}
            >
              {t("dugme_preuzmi")}
            </button>
          </div>
        </>
      )}

      {korak === "preuzmi" && (
        <PreuzmiObrazac
          onGotovo={async () => {
            setKorak("spisak");
            await ucitaj();
          }}
          onOdustani={() => setKorak("spisak")}
        />
      )}

      {korak === "obavestenje" && <Obavestenje onDalje={() => setKorak("obrazac")} onOdustani={() => setKorak("spisak")} />}

      {korak === "obrazac" && (
        <Obrazac
          onGotovo={async () => {
            setKorak("spisak");
            await ucitaj();
          }}
          onOdustani={() => setKorak("spisak")}
        />
      )}
    </section>
  );
}

/** Ekran obaveštenja — prethodi svakom unosu podataka o detetu. */
function Obavestenje({ onDalje, onOdustani }: { onDalje: () => void; onOdustani: () => void }) {
  const t = useTranslations("deca");
  const stavke = [
    t("obavestenje_1"),
    t("obavestenje_2"),
    t("obavestenje_3"),
    t("obavestenje_4"),
  ];
  return (
    <div className="mt-4 rounded-kontrola bg-kolo-bg p-4">
      <h3 className="font-semibold text-kolo-text">{t("obavestenje_naslov")}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-kolo-muted">
        {stavke.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
      {/* Poslednja stavka je jedina koja roditelja nešto košta, pa stoji izdvojeno
          i istaknuto — čovek koji je pročitao neće otvarati naloge nasumično. */}
      <p className="mt-3 rounded-kontrola border-l-4 border-kolo-danger bg-kolo-surface p-3 text-sm text-kolo-text">
        {t("obavestenje_posledica")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDalje}
          className={klaseDugmeta()}
        >
          {t("dugme_razumem")}
        </button>
        <button
          type="button"
          onClick={onOdustani}
          className={klaseDugmeta({ varijanta: "sekundarno" })}
        >
          {t("dugme_odustani")}
        </button>
      </div>
    </div>
  );
}

function Obrazac({ onGotovo, onOdustani }: { onGotovo: () => void; onOdustani: () => void }) {
  const t = useTranslations("deca");
  const [pseudonim, setPseudonim] = useState("");
  const [datum, setDatum] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [prikaziLozinku, setPrikaziLozinku] = useState(false);
  const [greska, setGreska] = useState<string | null>(null);
  const [salje, setSalje] = useState(false);

  // Pravilo pseudonima se proverava i ovde, ne samo na serveru: pseudonimi su
  // ASCII-only u celom sistemu (adresa profila ostaje čitljiva bez procentnog
  // kodiranja, a ćirilični homografi ne mogu da imitiraju tuđe ime). Bez ove
  // provere čovek otkuca „mihađoka", pošalje, i tek onda sazna zašto ne valja.
  const pseudonimLos = pseudonim.length > 0 && !validanPseudonim(pseudonim.trim());

  // Granice se računaju iz istih konstanti kao na serveru — polje ne nudi datum
  // koji bi server odbio.
  const danas = new Date();
  const najranije = new Date(danas.getFullYear() - UZRAST_PUNOLETSTVO, danas.getMonth(), danas.getDate() + 1);
  const najkasnije = new Date(danas.getFullYear() - UZRAST_MIN, danas.getMonth(), danas.getDate());

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setGreska(null);
    if (pseudonimLos) return setGreska(t("pseudonim_pravilo"));
    setSalje(true);
    try {
      const res = await fetch("/api/deca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonim, lozinka, datumRodjenja: datum }),
      });
      // 🔴 `greska()` vraća poruku pod ključem `error`. Čitanje pogrešnog ključa je
      // gutalo svako objašnjenje servera i pokazivalo opštu poruku, pa se iz ekrana
      // nije videlo ni šta je odbijeno ni zašto.
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      onGotovo();
    } catch (err) {
      setGreska(err instanceof Error ? err.message : t("greska_slanje"));
    } finally {
      setSalje(false);
    }
  }

  const polje = `mt-1 ${KLASE_UNOSA}`;

  return (
    <form onSubmit={posalji} className="mt-4 space-y-3 rounded-kontrola bg-kolo-bg p-4">
      <label className="block text-sm">
        <span className="font-medium text-kolo-text">{t("polje_pseudonim")}</span>
        <input
          className={`${polje}${pseudonimLos ? " border-kolo-danger" : ""}`}
          value={pseudonim}
          onChange={(e) => setPseudonim(e.target.value)}
          required
          minLength={3}
          maxLength={30}
          autoComplete="off"
        />
        {pseudonimLos && <span className="mt-1 block text-xs text-kolo-danger">{t("pseudonim_pravilo")}</span>}
      </label>

      <label className="block text-sm">
        <span className="font-medium text-kolo-text">{t("polje_datum")}</span>
        <DatumRodjenja
          value={datum}
          onChange={setDatum}
          min={najranije.toISOString().slice(0, 10)}
          max={najkasnije.toISOString().slice(0, 10)}
          porukaGreske={t("polje_datum_raspon")}
        />
        {/* Datum se posle otvaranja naloga ne menja (čl. 4 st. 2) — to mora da piše ovde,
            a ne posle, jer je roditeljska izjava jedina provera godina u sistemu. */}
        <span className="mt-1 block text-xs text-kolo-danger">{t("polje_datum_upozorenje")}</span>
      </label>

      {/* Jedno polje sa okom, bez ponavljanja: roditelj lozinku ne pamti nego je
          predaje detetu, pa mu treba da je VIDI — a kad je vidi, ponovni unos ne
          proverava ništa što oko već nije pokazalo. */}
      <label className="block text-sm">
        <span className="font-medium text-kolo-text">{t("polje_lozinka")}</span>
        <span className="relative mt-1 block">
          <input
            type={prikaziLozinku ? "text" : "password"}
            className={`${polje} mt-0 pr-12`}
            value={lozinka}
            onChange={(e) => setLozinka(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <PrikaziLozinkuDugme
            prikazan={prikaziLozinku}
            onToggle={() => setPrikaziLozinku((v) => !v)}
            prikaziLabel={t("prikazi_lozinku")}
            sakrijLabel={t("sakrij_lozinku")}
          />
        </span>
        <span className="mt-1 block text-xs text-kolo-muted">{t("polje_lozinka_opis")}</span>
      </label>

      {greska && <ObavestenjeUi vrsta="greska">{greska}</ObavestenjeUi>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={salje}
          className={klaseDugmeta()}
        >
          {salje ? t("dugme_salje") : t("dugme_otvori")}
        </button>
        <button
          type="button"
          onClick={onOdustani}
          className={klaseDugmeta({ varijanta: "sekundarno" })}
        >
          {t("dugme_odustani")}
        </button>
      </div>
    </form>
  );
}

/**
 * Preuzimanje naloga deteta pseudonimom i šestocifrenim kodom (čl. 11).
 *
 * Datum rođenja se traži samo pri PRVOM preuzimanju; drugi roditelj ga ostavlja
 * praznim, jer se posle upisa ne menja (čl. 4 st. 2). Server odbija prazan datum samo kad
 * ga nalog još nema, pa polje ovde nije obavezno.
 */
function PreuzmiObrazac({ onGotovo, onOdustani }: { onGotovo: () => void; onOdustani: () => void }) {
  const t = useTranslations("deca");
  const [pseudonim, setPseudonim] = useState("");
  const [kod, setKod] = useState("");
  const [datum, setDatum] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [salje, setSalje] = useState(false);

  const danas = new Date();
  const najranije = new Date(danas.getFullYear() - UZRAST_PUNOLETSTVO, danas.getMonth(), danas.getDate() + 1);
  const najkasnije = new Date(danas.getFullYear() - UZRAST_MIN, danas.getMonth(), danas.getDate());
  const polje = `mt-1 ${KLASE_UNOSA}`;

  async function posalji(e: React.FormEvent) {
    e.preventDefault();
    setGreska(null);
    setSalje(true);
    try {
      const res = await fetch("/api/deca/preuzmi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudonim, kod, datumRodjenja: datum || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? t("greska_slanje"));
      onGotovo();
    } catch (err) {
      setGreska(err instanceof Error ? err.message : t("greska_slanje"));
    } finally {
      setSalje(false);
    }
  }

  return (
    <form onSubmit={posalji} className="mt-4 space-y-3 rounded-kontrola bg-kolo-bg p-4">
      <p className="text-sm text-kolo-muted">{t("preuzmi_opis")}</p>

      <label className="block text-sm">
        <span className="font-medium text-kolo-text">{t("polje_pseudonim_deteta")}</span>
        <input className={polje} value={pseudonim} onChange={(e) => setPseudonim(e.target.value)} required autoComplete="off" />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-kolo-text">{t("polje_kod")}</span>
        <input
          className={`${polje} tracking-widest tabular-nums`}
          value={kod}
          onChange={(e) => setKod(e.target.value)}
          inputMode="numeric"
          maxLength={7}
          required
          autoComplete="off"
        />
        <span className="mt-1 block text-xs text-kolo-muted">{t("polje_kod_opis")}</span>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-kolo-text">{t("polje_datum_preuzimanje")}</span>
        <DatumRodjenja
          value={datum}
          onChange={setDatum}
          min={najranije.toISOString().slice(0, 10)}
          max={najkasnije.toISOString().slice(0, 10)}
          porukaGreske={t("polje_datum_raspon")}
        />
        <span className="mt-1 block text-xs text-kolo-muted">{t("polje_datum_preuzimanje_opis")}</span>
      </label>

      {greska && <ObavestenjeUi vrsta="greska">{greska}</ObavestenjeUi>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={salje}
          className={klaseDugmeta()}
        >
          {salje ? t("dugme_salje") : t("dugme_preuzmi")}
        </button>
        <button
          type="button"
          onClick={onOdustani}
          className={klaseDugmeta({ varijanta: "sekundarno" })}
        >
          {t("dugme_odustani")}
        </button>
      </div>
    </form>
  );
}
