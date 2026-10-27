"use client";

/**
 * Odluke — nadzorni predmeti koje su otvorili nadzornici
 * (Pravilnik o dokazu stvarnosti čl. 27 i 32). Predmet se odnosi na verifikaciju
 * (potvrdu ili uvođenje u Kolo), potvrdu člana bez potvrde ili potvrdu postojanja
 * deteta (čl. 22 st. 1, set 4.8.2) — prikazuje se vrsta predmeta.
 *
 * Razdvojen je od taba „Nadzor": Nadzor je AUTOMAT (noćni radnik obeležava sumnjive
 * naloge u `RizikNalaz`), a Odluke su LJUDSKA prijava — nadzornik je pogledao
 * konkretnu verifikaciju i evidentirao „za proveru" ili „sporno".
 *
 * 🔴 Panel ne odlučuje — odlučuje Upravni odbor. Dve odluke i ništa treće:
 *   — „nema osnova" → verifikacija ostaje, predmet se briše posle 90 dana;
 *   — „utvrdi lažnu" → poništava se TAJ zapis; ako je utvrđeno i da iza naloga
 *     ne stoji stvarna osoba, padaju sve verifikacije koje taj nalog dodiruju.
 *
 * Status strana se čita sa servera (`statusUcesnika`), ne iz indeksa.
 *
 * Ne dodavati „poništi sve verifikacije ovog verifikatora" — to je upravo ono što je
 * 4.2.0 uklonila, jer je stvarnim ljudima oduzimalo status zbog tuđe radnje (čl. 19).
 */

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { intlTag } from "@/lib/format";
import Pseudonim from "@/components/Pseudonim";
// Prijave lažnog roditeljstva (deca čl. 17) — odluka ovlašćenog lica, isti tab.
import PrijaveRoditeljstva from "./PrijaveRoditeljstva";
import { klaseDugmeta } from "@/components/ui/Dugme";
import { KLASE_UNOSA } from "@/components/ui/Polje";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import Segmenti from "@/components/ui/Segmenti";
import { useDijalog } from "@/components/ui/Dijalog";

type Prikaz = "otvoreni" | "reseni";

interface Zapis {
  id: string;
  ishod: string;
  razlog: string | null;
  subjekt: string | null;
  opis: string | null;
  nadzornik: string;
  createdAt: string;
}

interface Predmet {
  id: string;
  status: string;
  subjekt: string;
  razlog: string;
  opis: string | null;
  otvorenAt: string;
  resenAt: string | null;
  resenBy: string | null;
  beleska: string | null;
  vrstaPredmeta: "VERIFIKACIJA" | "POTVRDA_CLANA" | "POTVRDA_POSTOJANJA";
  predmetId: string;
  vrstaVerifikacije: "POTVRDA" | "UVODJENJE" | null;
  poPozivu: boolean;
  izvor: string | null;
  korak: number | null;
  uveo: string | null;
  /** `null` kod automatske potvrde lanca. */
  verifikator: { id: string; pseudonim: string; status: string } | null;
  verifikovani: {
    id: string;
    pseudonim: string;
    status: string;
    createdAt: string;
    utvrdjenNepostojeci: string | null;
  };
  vremenskiZig: string;
  zapisi: Zapis[];
}

const PRIKAZI: [Prikaz, string][] = [
  ["otvoreni", "Otvoreni"],
  ["reseni", "Rešeni"],
];

// Šifarnik se NE prepisuje ovde — čita se iz `messages.nadzor`, isto odakle ga
// čita i ekran nadzornika. Dok je stajala sopstvena kopija, ta kopija je zaostala
// na terminologiji koju je set 4.2.1 ukinuo („verifikator", „Obrazac verifikacija"),
// pa su dva ekrana istu šifru zvala različito.
const RAZLOG_KLJUC: Record<string, string> = {
  ne_poznaju_se: "razlog_ne_poznaju_se",
  nalog_bez_znakova: "razlog_nalog_bez_znakova",
  dvostruki_nalog: "razlog_dvostruki_nalog",
  obrazac_verifikacija: "razlog_obrazac_verifikacija",
  prijava_verifikovanog: "razlog_prijava_verifikovanog",
  ostalo: "razlog_ostalo",
};

const SUBJEKT_KLJUC: Record<string, string> = {
  VERIFIKATOR: "subjekt_verifikator",
  VERIFIKOVANI: "subjekt_verifikovani",
  OBA: "subjekt_oba",
  DEO_MREZE: "subjekt_deo_mreze",
};

const ISHOD_STIL: Record<string, string> = {
  SPORNO: "bg-kolo-danger-light text-kolo-danger border-kolo-danger/30",
  ZA_PROVERU: "bg-kolo-gold-100 text-kolo-gold-700 border-kolo-gold-200",
  UREDNO: "bg-kolo-green-100 text-kolo-green-700 border-kolo-green-200",
};

const ISHOD_KLJUC: Record<string, string> = {
  SPORNO: "ishod_sporno",
  ZA_PROVERU: "ishod_za_proveru",
  UREDNO: "ishod_uredno",
};

const STATUS_TEKST: Record<string, string> = {
  OTVOREN: "Otvoren",
  UTVRDJENA_LAZNA: "Utvrđena lažna potvrda",
  NEMA_OSNOVA: "Nema osnova",
};

function vrstaKljuc(p: Predmet): string {
  if (p.vrstaPredmeta === "POTVRDA_POSTOJANJA") return "predmet_vrsta_postojanje";
  if (p.vrstaPredmeta === "POTVRDA_CLANA") return p.izvor === "LANAC" ? "predmet_vrsta_lanac" : "predmet_vrsta_potvrda_clana";
  if (p.vrstaVerifikacije === "UVODJENJE") return p.poPozivu ? "predmet_vrsta_uvodjenje_spisak" : "predmet_vrsta_uvodjenje";
  return "predmet_vrsta_potvrda";
}

export default function OdlukeTab() {
  const locale = useLocale();
  const tn = useTranslations("nadzor");
  const ta = useTranslations("admin");
  const statusTekst = (s: string) => ta(`predmet_status_${s.toLowerCase()}`);
  /** Šifra → tekst iz `messages.nadzor`; nepoznata šifra se ispisuje kakva jeste. */
  const sifra = (kljuc: string | undefined, sirovo: string) => (kljuc ? tn(kljuc) : sirovo);
  const [prikaz, setPrikaz] = useState<Prikaz>("otvoreni");
  const [predmeti, setPredmeti] = useState<Predmet[]>([]);
  const [ucitava, setUcitava] = useState(true);
  const [greska, setGreska] = useState("");
  const [radiId, setRadiId] = useState<string | null>(null);
  // Id predmeta čija je forma odluke otvorena, sa upisanom beleškom i markerom.
  const [odlucujeId, setOdlucujeId] = useState<string | null>(null);
  const [beleska, setBeleska] = useState("");
  const [nepostojeci, setNepostojeci] = useState(false);
  const { dijalog, potvrdi } = useDijalog();

  const ucitaj = useCallback(async () => {
    setUcitava(true);
    try {
      const res = await fetch(`/api/admin/nadzor/predmeti?prikaz=${prikaz}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? "Greška pri učitavanju.");
        return;
      }
      setPredmeti(data.predmeti ?? []);
      setGreska("");
    } finally {
      setUcitava(false);
    }
  }, [prikaz]);

  useEffect(() => {
    void ucitaj();
  }, [ucitaj]);

  function zatvoriFormu() {
    setOdlucujeId(null);
    setBeleska("");
    setNepostojeci(false);
  }

  async function posalji(id: string, putanja: string, telo: Record<string, unknown>) {
    setRadiId(id);
    setGreska("");
    try {
      const res = await fetch(`/api/admin/nadzor/predmeti/${id}/${putanja}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telo),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGreska(data.error ?? "Greška.");
        return;
      }
      zatvoriFormu();
      await ucitaj();
    } finally {
      setRadiId(null);
    }
  }

  async function nemaOsnova(id: string) {
    if (!(await potvrdi({ poruka: "Zatvoriti predmet nalazom da za sumnju nema osnova? Potvrda ostaje na snazi.", dugme: "Nema osnova" }))) return;
    await posalji(id, "nema-osnova", { beleska: beleska.trim() || null });
  }

  async function utvrdi(p: Predmet) {
    const opseg = nepostojeci
      ? `Padaju SVE potvrde koje nalog ${p.verifikovani.pseudonim} dodiruje.`
      : p.vrstaPredmeta === "POTVRDA_CLANA"
        ? `Poništava se samo ova potvrda; ${p.verifikovani.pseudonim} ostaje član bez potvrde.`
        : "Poništava se samo ova potvrda.";
    if (
      !(await potvrdi({
        poruka: <span className="whitespace-pre-line">{`Utvrditi lažnu potvrdu?\n\n${opseg}\n\nOvo se ne može poništiti.`}</span>,
        opasno: true,
        dugme: "Utvrdi lažnu potvrdu",
      }))
    )
      return;
    await posalji(p.id, "utvrdi", {
      nepostojeciNalog: nepostojeci,
      beleska: beleska.trim() || null,
    });
  }

  const dat = (s: string) => new Date(s).toLocaleString(intlTag(locale));

  return (
    <div className="space-y-4">
      {dijalog}
      <div>
        <h2 className="text-lg font-semibold text-kolo-text">Odluke o spornim potvrdama</h2>
        <p className="text-sm text-kolo-muted">
          Predmeti koje su otvorili nadzornici ishodom „za proveru" ili „sporno" (čl. 27).
          Predmet sam po sebi ne proizvodi dejstvo prema članu — lažnu potvrdu
          utvrđuje Fondacija (čl. 32).
        </p>
      </div>

      <Segmenti
        oznaka={PRIKAZI.map(([, naziv]) => naziv).join(" / ")}
        vrednost={prikaz}
        onPromena={setPrikaz}
        opcije={PRIKAZI.map(([p, naziv]) => ({ vrednost: p, oznaka: naziv }))}
      />

      {greska && (
        <Obavestenje vrsta="greska">{greska}</Obavestenje>
      )}

      {ucitava ? (
        <div className="rounded-kartica border border-kolo-border bg-kolo-surface p-8 text-center text-kolo-muted shadow-kartica">
          Učitavanje…
        </div>
      ) : predmeti.length === 0 ? (
        <div className="rounded-kartica border border-kolo-border bg-kolo-surface shadow-kartica">
          <PraznoStanje naslov="Nema predmeta." />
        </div>
      ) : (
        <div className="space-y-3">
          {predmeti.map((p) => (
            <div key={p.id} className="rounded-kartica border border-kolo-border bg-kolo-surface p-4 space-y-3 shadow-kartica">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="text-sm">
                  <div className="text-xs font-semibold text-kolo-muted mb-0.5">
                    {ta(vrstaKljuc(p))}
                    {p.korak !== null && ` · ${ta("predmet_korak", { korak: p.korak })}`}
                    {p.uveo && ` · ${ta("predmet_uveo", { pseudonim: p.uveo })}`}
                  </div>
                  <div className="font-medium text-kolo-text">
                    {p.verifikator ? <Pseudonim>{p.verifikator.pseudonim}</Pseudonim> : ta("predmet_lanac")}
                    {" → "}
                    <Pseudonim>{p.verifikovani.pseudonim}</Pseudonim>
                  </div>
                  <div className="text-xs text-kolo-muted mt-0.5">
                    {ta("predmet_datumi", { zapis: dat(p.vremenskiZig), otvoren: dat(p.otvorenAt) })}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full border text-xs ${
                    ISHOD_STIL[p.zapisi.at(-1)?.ishod ?? "ZA_PROVERU"] ?? ISHOD_STIL.ZA_PROVERU
                  }`}
                >
                  {sifra(SUBJEKT_KLJUC[p.subjekt], p.subjekt)} · {sifra(RAZLOG_KLJUC[p.razlog], p.razlog)}
                </span>
              </div>

              {p.opis && <p className="text-sm text-kolo-text">{p.opis}</p>}

              <div className="grid gap-2 sm:grid-cols-2 text-xs text-kolo-muted">
                <div>
                  {ta("predmet_davalac")}: {p.verifikator ? statusTekst(p.verifikator.status) : ta("predmet_lanac")}
                </div>
                <div>
                  {ta("predmet_primalac")}: {statusTekst(p.verifikovani.status)} · {ta("predmet_nalog_od")}{" "}
                  {new Date(p.verifikovani.createdAt).toLocaleDateString(intlTag(locale))}
                  {p.verifikovani.utvrdjenNepostojeci && ` · ${ta("predmet_vec_nepostojeci")}`}
                </div>
              </div>

              <div className="rounded-kontrola bg-kolo-bg p-3 space-y-1">
                {p.zapisi.map((z) => (
                  <div key={z.id} className="text-xs text-kolo-muted">
                    <span className={`px-1.5 py-0.5 rounded border ${ISHOD_STIL[z.ishod]}`}>
                      {sifra(ISHOD_KLJUC[z.ishod], z.ishod)}
                    </span>{" "}
                    {z.nadzornik} · {dat(z.createdAt)}
                    {z.razlog && ` · ${sifra(RAZLOG_KLJUC[z.razlog], z.razlog)}`}
                    {z.opis && ` — ${z.opis}`}
                  </div>
                ))}
              </div>

              {p.status !== "OTVOREN" ? (
                <div className="text-xs text-kolo-muted">
                  {STATUS_TEKST[p.status] ?? p.status}
                  {p.resenBy && ` · ${p.resenBy}`}
                  {p.resenAt && ` · ${dat(p.resenAt)}`}
                  {p.beleska && ` — ${p.beleska}`}
                </div>
              ) : odlucujeId === p.id ? (
                <div className="space-y-2 border-t border-kolo-border pt-3">
                  <textarea
                    value={beleska}
                    onChange={(e) => setBeleska(e.target.value)}
                    placeholder="Beleška uz odluku (opciono) — ide u audit log."
                    aria-label="Beleška uz odluku (opciono) — ide u audit log."
                    rows={2}
                    className={KLASE_UNOSA}
                  />
                  {p.vrstaPredmeta !== "POTVRDA_POSTOJANJA" && (
                  <label className="flex items-start gap-2 text-sm text-kolo-text">
                    <input
                      type="checkbox"
                      checked={nepostojeci}
                      onChange={(e) => setNepostojeci(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      Utvrđeno je i da iza naloga <strong>{p.verifikovani.pseudonim}</strong> ne
                      stoji stvarna osoba, odnosno da nalog nije jedinstven.
                      <span className="block text-xs text-kolo-muted">
                        Bez ovoga pada samo ova potvrda, a onaj koga su potvrdili zadržava
                        status i potvrde koje je sam dao (čl. 33). Sa ovim padaju sve potvrde
                        koje nalog dodiruje, a kaskada staje na prvom stvarnom čoveku (čl. 34).
                      </span>
                    </span>
                  </label>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => utvrdi(p)}
                      disabled={radiId === p.id}
                      className={klaseDugmeta({ varijanta: "opasno", velicina: "sm" })}
                    >
                      Utvrdi lažnu potvrdu
                    </button>
                    <button
                      onClick={() => nemaOsnova(p.id)}
                      disabled={radiId === p.id}
                      className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                    >
                      Nema osnova
                    </button>
                    <button
                      onClick={zatvoriFormu}
                      className={klaseDugmeta({ varijanta: "tiho", velicina: "sm" })}
                    >
                      Odustani
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setOdlucujeId(p.id);
                    setBeleska("");
                    setNepostojeci(false);
                  }}
                  className={klaseDugmeta({ varijanta: "sekundarno", velicina: "sm" })}
                >
                  Odluči
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <PrijaveRoditeljstva />
    </div>
  );
}
