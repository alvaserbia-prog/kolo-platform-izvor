"use client";

import Obavestenje from "@/components/ui/Obavestenje";
import Kartica from "@/components/ui/Kartica";
import Dugme, { klaseDugmeta } from "@/components/ui/Dugme";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";
import { useState, useCallback, memo } from "react";
import { intlTag } from "@/lib/format";
import Link from "next/link";
import {
  MAJKE_OSNOVICA, MAJKE_UMANJENJE_PO_GODINI, MAJKE_TRAJANJE_GODINA,
  STARIJI_OSNOVICA, STARIJI_PO_GODINI, STARIJI_OD_GODINA,
  POSEBNA_PODRSKA_DNEVNO, SKOLOVANJE_DNEVNO,
} from "@/lib/programi-iznosi-pravila";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import DatumRodjenja from "@/components/DatumRodjenja";

type EnrollmentStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "REJECTED";

interface ProgramInfo {
  type: string;
  label: string;
  programAktivan: boolean;
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    metadata: Record<string, unknown> | null;
    dailyAmount: number | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    ocekivaniDnevni: number;
    /** Zbir evidentiranog POEN-a po ovom programu (R-03, mera M-1). */
    isplacenoPoen: number;
  } | null;
}

interface EmisioniKontekst {
  opticaj: number;
  dnevniLimit: number;
  emitovanoAm: number | null;
  zahtevanoAm: number | null;
}

interface Props {
  programi: ProgramInfo[];
  pedAktivan: boolean;
  brojAktivnih: number;
  isVerified: boolean;
  imaPristupProgramima: boolean;
  /** Koliko će ljudi biti zamoljeno da potvrdi — ide u tekst pristanka (čl. 4 st. 3). */
  brojVerifikatora: number;
  emisioniKontekst: EmisioniKontekst;
}

function useStatusBadge(): Record<EnrollmentStatus, { label: string; cls: string }> {
  const t = useTranslations("programi");
  return {
    PENDING:  { label: t("status_na_cekanju"), cls: "bg-kolo-gold-100 text-kolo-gold-700 border-kolo-gold-100" },
    ACTIVE:   { label: t("status_aktivan"),    cls: "bg-kolo-green-100 text-kolo-green-700 border-kolo-green-100" },
    INACTIVE: { label: t("status_neaktivan"),  cls: "bg-kolo-bg text-kolo-muted border-kolo-border" },
    REJECTED: { label: t("status_odbijen"),    cls: "bg-kolo-danger-light text-kolo-danger border-kolo-danger/20" },
  };
}


export default function ProgramiKlijent({ programi, pedAktivan, brojAktivnih, isVerified, imaPristupProgramima, brojVerifikatora, emisioniKontekst }: Props) {
  const locale = useLocale();
  const t = useTranslations("programi");
  const tc = useTranslations("common");
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean; for: string } | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  const totalOcekivano = programi.reduce((s, p) => s + (p.enrollment?.ocekivaniDnevni ?? 0), 0);

  const prijavi = useCallback(async (type: string, metadata?: Record<string, unknown>) => {
    setLoading(true); setPoruka(null);
    const res = await fetch(`/api/programi/${type}/prijava`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata ?? {}),
    });
    const data = await res.json();
    setLoading(false);
    setPoruka({ text: res.ok ? t("prijava_podneta") : (data.error ?? tc("greska_ucitavanja")), ok: res.ok, for: type });
    if (res.ok) { setActiveProgram(null); setTimeout(() => router.refresh(), 1200); }
  }, [t, tc, router]);

  const onExpand = useCallback((type: string) => {
    setActiveProgram((prev) => (prev === type ? null : type));
  }, []);

  // Povlačenje pristanka (čl. 4 st. 3). Potvrda je obavezna: radnja prekida
  // postupak, gasi evidentiranje i BRIŠE unete podatke — ponovna prijava kreće
  // iz početka, uključujući potvrdu svih verifikatora.
  const povuci = useCallback(async (type: string) => {
    if (!(await potvrdi({ poruka: t("povuci_potvrda"), opasno: true, dugme: t("povuci_pristanak") }))) return;
    setLoading(true); setPoruka(null);
    const res = await fetch(`/api/programi/${type}/povuci-pristanak`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setPoruka({ text: res.ok ? t("povuci_uspeh") : (data.error ?? tc("greska_ucitavanja")), ok: res.ok, for: type });
    if (res.ok) setTimeout(() => router.refresh(), 1200);
  }, [t, tc, router, potvrdi]);


  return (
    <div className="space-y-6">
      {dijalog}
      <NaslovStranice
        naslov={t("naslov")}
        opis={t("uvod")}
        radnja={
          totalOcekivano > 0 ? (
            <div className="bg-kolo-green-100 rounded-kontrola px-4 py-2 text-center">
              <p className="text-sm font-bold text-kolo-green-700">{totalOcekivano.toLocaleString(intlTag(locale))}</p>
              <p className="text-xs text-kolo-green-700">{tc("poen_dan")}</p>
            </div>
          ) : undefined
        }
      />

      {/* Ko ne može da se prijavi, to vidi PRE statistike (ranije je stajalo ispod). */}
      {!isVerified && <Obavestenje vrsta="upozorenje">{t("nije_verifikovan")}</Obavestenje>}
      {isVerified && !imaPristupProgramima && <Obavestenje vrsta="upozorenje">{t("nepun_indeks")}</Obavestenje>}

      <div className="space-y-3">
        {programi.map((p) => (
          <ProgramKartica
            key={p.type}
            p={p}
            isVerified={isVerified}
            imaPristupProgramima={imaPristupProgramima}
            loading={loading}
            poruka={poruka?.for === p.type ? poruka : null}
            expanded={activeProgram === p.type}
            onExpand={onExpand}
            onPrijavi={prijavi}
            onPovuci={povuci}
            brojVerifikatora={brojVerifikatora}
          />
        ))}
      </div>
      {/* Brojke sistema (dnevni okvir) i kartica operativnog doprinosa su sklonjene
          (C2, uloga 1, 24.10.2026): brojke služe obračunu, ne čoveku, a Zadaci imaju
          svoju stranicu. Ostaje jedan red-veza. */}
      <p className="text-sm text-kolo-muted">
        <Link href="/doprinos-oglasi" className="font-semibold text-kolo-green-700 hover:underline">{t("zadaci_link")}</Link>
      </p>
    </div>
  );
}

// ── Kartica programa ───────────────────────────────────────────────────────────

const ProgramKartica = memo(function ProgramKartica({
  p, isVerified, imaPristupProgramima, loading, poruka, expanded, onExpand, onPrijavi, onPovuci, brojVerifikatora,
}: {
  p: ProgramInfo;
  isVerified: boolean;
  imaPristupProgramima: boolean;
  loading: boolean;
  poruka: { text: string; ok: boolean } | null;
  expanded: boolean;
  onExpand: (type: string) => void;
  onPrijavi: (type: string, meta?: Record<string, unknown>) => void;
  onPovuci: (type: string) => void;
  brojVerifikatora: number;
}) {
  const locale = useLocale();
  const t = useTranslations("programi");
  const tc = useTranslations("common");
  const statusBadge = useStatusBadge();
  const enStatus = p.enrollment?.status;

  // Socijalni programi traže indeks stvarnosti od najmanje 10% — jedna primljena
  // potvrda (čl. 4 Pravilnika o programima podrške, set 4.3.1). Anti-malverzaciju
  // nosi potvrda svih verifikatora podnosioca, ne visina indeksa.
  const mozePrijaviti = isVerified && imaPristupProgramima && p.programAktivan;

  const handleExpand = useCallback(() => onExpand(p.type), [onExpand, p.type]);
  const handlePrijavi = useCallback((meta?: Record<string, unknown>) => onPrijavi(p.type, meta), [onPrijavi, p.type]);
  const handlePovuci = useCallback(() => onPovuci(p.type), [onPovuci, p.type]);

  return (
    <Kartica padding="nema" className="overflow-hidden">
      <div className="px-5 py-4 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-kolo-text">{p.label}</p>
            {!p.programAktivan && (
              <span className="text-xs bg-kolo-bg text-kolo-muted px-2 py-0.5 rounded-lg">{tc("neaktivan")}</span>
            )}
            {enStatus && (
              <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${statusBadge[enStatus].cls}`}>
                {statusBadge[enStatus].label}
              </span>
            )}
          </div>
          {enStatus === "ACTIVE" && p.enrollment!.ocekivaniDnevni > 0 && (
            <p className="text-sm text-kolo-green-700 font-medium mt-1">
              {p.enrollment!.ocekivaniDnevni.toLocaleString(intlTag(locale))} {tc("poen_dan")}
            </p>
          )}
          {/* Lično razlaganje po programu (R-03, mera M-1). Opis transakcije više
              ne imenuje program — naziv je posebna kategorija po ZZPL čl. 17 i
              zapis je trajan — pa korisnik sopstveni zbir vidi ovde, gde mu je i
              kontekst. Vidi ga isključivo vlasnik naloga. */}
          {p.enrollment && p.enrollment.isplacenoPoen > 0 && (
            <p className="text-xs text-kolo-muted mt-0.5">
              {t("isplaceno_ukupno", {
                iznos: p.enrollment.isplacenoPoen.toLocaleString(intlTag(locale)),
              })}
            </p>
          )}
          <p className="text-xs text-kolo-muted mt-0.5">{opisPrograma(p.type, t)}</p>
        </div>

        {/* Akcija dugme */}
        <div className="ml-4 shrink-0">
          {!enStatus && mozePrijaviti && (
            <Dugme velicina="sm" onClick={handleExpand}>
              {t("prijavi_se")}
            </Dugme>
          )}
          {enStatus === "REJECTED" && mozePrijaviti && (
            <Dugme varijanta="sekundarno" velicina="sm" onClick={handleExpand}>
              {t("pokusaj_ponovo")}
            </Dugme>
          )}
          {/* Povlačenje pristanka — pravo iz čl. 4 st. 3, dostupno dok postupak
              traje (PENDING) i dok se evidentira (ACTIVE). */}
          {(enStatus === "PENDING" || enStatus === "ACTIVE") && (
            <Dugme varijanta="sekundarno" velicina="sm" onClick={handlePovuci} disabled={loading}>
              {t("povuci_pristanak")}
            </Dugme>
          )}
        </div>
      </div>

      {/* Expanded — forma za prijavu */}
      {expanded && (
        <div className="border-t border-kolo-border px-5 py-4">
          <PrijavnaForma
            type={p.type}
            loading={loading}
            brojVerifikatora={brojVerifikatora}
            onSubmit={handlePrijavi}
            onCancel={handleExpand}
          />
          {poruka && (
            <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"} className="mt-3">
              {poruka.text}
            </Obavestenje>
          )}
        </div>
      )}

      {poruka && !expanded && (
        <div className={`border-t border-kolo-border px-5 py-3 text-xs ${poruka.ok ? "text-kolo-green-700" : "text-kolo-danger"}`}>
          {poruka.text}
        </div>
      )}

      {enStatus === "REJECTED" && p.enrollment?.rejectionReason && !expanded && (
        <div className="border-t border-kolo-border px-5 py-3 text-xs text-kolo-danger">
          {t("razlog_odbijanja")} {p.enrollment.rejectionReason}
        </div>
      )}
    </Kartica>
  );
});

// ── Forme za prijavu ───────────────────────────────────────────────────────────

function PrijavnaForma({ type, loading, brojVerifikatora, onSubmit, onCancel }: {
  type: string;
  loading: boolean;
  brojVerifikatora: number;
  onSubmit: (meta?: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("programi");
  const tc = useTranslations("common");
  const [datumRodjenja, setDatumRodjenja] = useState("");
  const [datumResenja, setDatumResenja] = useState("");
  const [datumIsteka, setDatumIsteka] = useState("");
  // Posebna podrška ima dva osnova (Pravilnik o programima podrške čl. 12).
  //
  // 🔴 Osnov se ovde BIRA, ali se nigde ne prikazuje drugim korisnicima (čl. 4
  // st. 5): program obuhvata i smanjenu sposobnost i gubitak doma, pa objavljen
  // naziv programa ne kazuje koji je osnov u pitanju. Prikaz osnova bio bi prikaz
  // podatka o zdravlju, odnosno o prinudnoj raseljenosti.
  const [osnov, setOsnov] = useState<"SMANJENA_SPOSOBNOST" | "GUBITAK_DOMA">("SMANJENA_SPOSOBNOST");
  // Rešenje / akutna / hronična bolest — od ovoga zavisi ROK (akutna traje šest
  // meseci), a ne prikaz. Ostaje u prijavi, koju vidi samo lice što je obrađuje.
  const [dokaz, setDokaz] = useState<"RESENJE" | "BOLEST_AKUTNA" | "BOLEST_HRONICNA">("RESENJE");
  const [punoletstvoAt, setPunoletstvoAt] = useState("");
  const [datumDogadjaja, setDatumDogadjaja] = useState("");
  const [ustanova, setUstanova] = useState("");
  const [program, setProgram] = useState("");
  const [deca, setDeca] = useState<{ datumRodjenja: string }[]>([{ datumRodjenja: "" }]);
  const [pristanak, setPristanak] = useState(false);

  function handleSubmit() {
    const baza = { pristanakVerifikatori: pristanak };
    if (type === "PODRSKA_STARIJIMA") { onSubmit({ ...baza, datumRodjenja }); return; }
    if (type === "POSEBNA_BRIGA") {
      if (osnov === "GUBITAK_DOMA") { onSubmit({ ...baza, osnov, datumDogadjaja }); return; }
      onSubmit({ ...baza, osnov, dokaz, datumResenja, datumIsteka, punoletstvoAt });
      return;
    }
    if (type === "SKOLOVANJE") { onSubmit({ ...baza, ustanova, program }); return; }
    if (type === "PODRSKA_MAJKAMA") { onSubmit({ ...baza, deca: deca.filter(d => d.datumRodjenja) }); return; }
  }

  return (
    <div className="space-y-3">
      {type === "PODRSKA_STARIJIMA" && (
        /* Datum rođenja se KUCA, ne bira iz kalendara: kalendar se otvara na
            tekućem mesecu, a ovaj datum je decenijama unazad. */
        <Polje oznaka={t("datum_rodjenja")} pomoc={t("starijima_napomena")}>
          <DatumRodjenja value={datumRodjenja} onChange={setDatumRodjenja} />
        </Polje>
      )}

      {type === "POSEBNA_BRIGA" && (
        <div className="space-y-3">
          <div>
            <p className="block text-sm font-medium text-kolo-text mb-1.5">{t("posebna_briga_osnov")}</p>
            <div className="space-y-1" role="radiogroup" aria-label={t("posebna_briga_osnov")}>
              {([
                ["SMANJENA_SPOSOBNOST", t("posebna_briga_osnov_sposobnost")],
                ["GUBITAK_DOMA", t("posebna_briga_osnov_dom")],
              ] as const).map(([vrednost, naziv]) => (
                <label key={vrednost} className="flex min-h-9 items-center gap-2 cursor-pointer">
                  <input type="radio" name="osnov" checked={osnov === vrednost}
                    onChange={() => setOsnov(vrednost)} className="shrink-0" />
                  <span className="text-sm text-kolo-text">{naziv}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-kolo-muted mt-1">{t("posebna_briga_osnov_napomena")}</p>
          </div>

          {osnov === "SMANJENA_SPOSOBNOST" && (
            <>
              <div>
                <p className="block text-sm font-medium text-kolo-text mb-1.5">{t("posebna_briga_dokaz")}</p>
                <div className="space-y-1" role="radiogroup" aria-label={t("posebna_briga_dokaz")}>
                  {([
                    ["RESENJE", t("posebna_briga_dokaz_resenje")],
                    ["BOLEST_AKUTNA", t("posebna_briga_dokaz_akutna")],
                    ["BOLEST_HRONICNA", t("posebna_briga_dokaz_hronicna")],
                  ] as const).map(([vrednost, naziv]) => (
                    <label key={vrednost} className="flex min-h-9 items-center gap-2 cursor-pointer">
                      <input type="radio" name="dokaz" checked={dokaz === vrednost}
                        onChange={() => setDokaz(vrednost)} className="shrink-0" />
                      <span className="text-sm text-kolo-text">{naziv}</span>
                    </label>
                  ))}
                </div>
              </div>

              {dokaz === "RESENJE" ? (
                <>
                  <Polje oznaka={t("posebna_briga_datum_resenja")}>
                    <input type="date" value={datumResenja} onChange={(e) => setDatumResenja(e.target.value)}
                      className={KLASE_UNOSA} />
                  </Polje>
                  <Polje oznaka={t("posebna_briga_datum_isteka")}>
                    <input type="date" value={datumIsteka} onChange={(e) => setDatumIsteka(e.target.value)}
                      className={KLASE_UNOSA} />
                  </Polje>
                  <p className="text-xs text-kolo-muted">{t("posebna_briga_napomena2")}</p>
                </>
              ) : (
                <p className="text-xs text-kolo-muted">{t("posebna_briga_dokaz_izjava")}</p>
              )}

              {/* Pravo za maloletno lice prestaje njegovim punoletstvom (čl. 12).
                  🔴 Od tog lica se traži SAMO taj datum — ne ime, ne stanje, ne
                  dijagnoza: „identitet lica o kome se korisnik stara i njegovo
                  stanje ne unose se u prijavu preko onoga što je neophodno za
                  utvrđivanje osnova". */}
              <Polje oznaka={t("posebna_briga_punoletstvo")} pomoc={t("posebna_briga_punoletstvo_napomena")}>
                <input type="date" value={punoletstvoAt} onChange={(e) => setPunoletstvoAt(e.target.value)}
                  className={KLASE_UNOSA} />
              </Polje>
            </>
          )}

          {osnov === "GUBITAK_DOMA" && (
            <Polje oznaka={t("posebna_briga_datum_dogadjaja")} pomoc={t("posebna_briga_dom_napomena")}>
              <input type="date" value={datumDogadjaja} onChange={(e) => setDatumDogadjaja(e.target.value)}
                className={KLASE_UNOSA} />
            </Polje>
          )}
        </div>
      )}

      {type === "SKOLOVANJE" && (
        <div className="space-y-2">
          <input type="text" placeholder={t("ustanova")} aria-label={t("ustanova")} value={ustanova} onChange={(e) => setUstanova(e.target.value)}
            className={KLASE_UNOSA} />
          <input type="text" placeholder={t("smer")} aria-label={t("smer")} value={program} onChange={(e) => setProgram(e.target.value)}
            className={KLASE_UNOSA} />
          <p className="text-xs text-kolo-muted">{t("skolovanje_napomena")}</p>
        </div>
      )}

      {type === "PODRSKA_MAJKAMA" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-kolo-muted">{t("deca_naslov")}</p>
          {deca.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-kolo-muted w-16 shrink-0">{t("dete_ime", { n: i + 1 })}</span>
              <DatumRodjenja
                value={d.datumRodjenja}
                onChange={(iso) => setDeca((prev) => prev.map((x, j) => (j === i ? { datumRodjenja: iso } : x)))}
              />
              {deca.length > 1 && (
                <button type="button" onClick={() => setDeca((prev) => prev.filter((_, j) => j !== i))}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-kontrola text-kolo-danger hover:bg-kolo-danger-light text-lg leading-none">×</button>
              )}
            </div>
          ))}
          {deca.length < 10 && (
            <Dugme varijanta="tiho" velicina="sm" onClick={() => setDeca((prev) => [...prev, { datumRodjenja: "" }])}>
              {t("dodaj_dete")}
            </Dugme>
          )}
          <p className="text-xs text-kolo-muted">{t("majkama_napomena")}</p>
        </div>
      )}

      {/* Pristanak — pravni osnov obrade posebnih kategorija podataka (čl. 4).
          🔴 Tekst mora da imenuje ONO ŠTO SE ZAISTA DEŠAVA: koliko ljudi saznaje
          za koji se program prijavljuješ i da zapis o evidentiranju POEN-a po tom
          programu vide verifikovani učesnici uz pseudonim. Pristanak koji ne
          pokriva stvarno otkrivanje nije pristanak na tu obradu. */}
      <label className="flex items-start gap-2 pt-2 cursor-pointer">
        <input type="checkbox" checked={pristanak} onChange={(e) => setPristanak(e.target.checked)}
          className="mt-0.5 shrink-0" />
        <span className="text-xs text-kolo-muted">
          {brojVerifikatora > 0
            ? t("pristanak_tekst", { broj: brojVerifikatora })
            : t("pristanak_tekst_fondacija")}
        </span>
      </label>

      <div className="flex gap-2 pt-1">
        <Dugme varijanta="sekundarno" className="flex-1" onClick={onCancel}>{tc("otkazi")}</Dugme>
        <Dugme className="flex-1" onClick={handleSubmit} disabled={loading || !pristanak}>
          {loading ? "..." : t("posalji_prijavu")}
        </Dugme>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function opisPrograma(type: string, t: (key: string, v?: Record<string, string | number>) => string): string {
  const fmt = (n: number) => n.toLocaleString("sr-RS");
  const mapa: Record<string, string> = {
    // Iznosi se čitaju iz pravila (pravilo 10), ne prepisuju u tekst.
    PODRSKA_MAJKAMA:   t("opis_majkama_n", { osnovica: fmt(MAJKE_OSNOVICA), umanjenje: fmt(MAJKE_UMANJENJE_PO_GODINI), trajanje: MAJKE_TRAJANJE_GODINA }),
    PODRSKA_STARIJIMA: t("opis_starijima_n", { osnovica: fmt(STARIJI_OSNOVICA), poGodini: fmt(STARIJI_PO_GODINI), od: STARIJI_OD_GODINA }),
    POSEBNA_BRIGA:     t("opis_posebna_briga_n", { iznos: fmt(POSEBNA_PODRSKA_DNEVNO) }),
    SKOLOVANJE:        t("opis_skolovanje_n", { iznos: fmt(SKOLOVANJE_DNEVNO) }),
  };
  return mapa[type] ?? "";
}
