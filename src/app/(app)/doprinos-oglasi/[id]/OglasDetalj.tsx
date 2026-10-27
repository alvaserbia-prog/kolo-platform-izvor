"use client";

import { useState } from "react";
import { intlTag } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { generisiIzjavuIzvrsioca } from "@/lib/operativni-izjava";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import Obavestenje from "@/components/ui/Obavestenje";
import Polje, { KLASE_UNOSA } from "@/components/ui/Polje";
import { useDijalog } from "@/components/ui/Dijalog";

interface MojaPrijava {
  id: string;
  status: string;
  /** Živa prijava (na čekanju ili primljena, bez odustanka i završne odluke). */
  ziva: boolean;
  odustao: boolean;
  /** Zadružni doprinos: celinu je dodelila zadruga (operativni čl. 23 st. 2). */
  dodeljena: boolean;
  zavrsetakAt: string | null;
  zavrsnaOdluka: string | null;
  zavrsnoObrazlozenje: string | null;
  planIzvrsenja: string | null;
  izjavaTekst?: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface EvidencijaItem {
  id: string;
  date: string;
  predlozeniPoen: number;
  celina: number | null;
  amount: number;
  dokaz: string | null;
  description: string;
  status: string;
  odlukaObrazlozenje: string | null;
}

interface OglasData {
  id: string;
  title: string;
  description: string;
  source: string;
  zadruzni: boolean;
  predlozeniPoen: number;
  brojCelina: number | null;
  opisCeline: string | null;
  procenaObima: string | null;
  obrazlozenje: string | null;
  saOdobravanjem: boolean;
  odobravanjeObrazlozenje: string | null;
  kvalifikacioniUslov: string | null;
  kvalifikacioniObrazlozenje: string | null;
  positions: number;
  deadline: string | null;
  rokIzvrsenja: string | null;
  status: string;
  statusZadatka: string;
  povucenoObrazlozenje: string | null;
  obustavljeno: boolean;
  krugName: string | null;
  odobreniClanovi: number;
  createdAt: string;
  mojaPrijava: MojaPrijava | null;
  mojeEvidencije: EvidencijaItem[];
}

const sourceCls: Record<string, string> = {
  FONDACIJA: "bg-kolo-green-100 text-kolo-green-700",
  KRUG: "bg-kolo-info-light text-kolo-info",
  PROJEKAT: "bg-purple-50 text-purple-700",
};

export default function OglasDetalj({ oglas, isVerified }: { oglas: OglasData; isVerified: boolean }) {
  const locale = useLocale();
  const t = useTranslations("doprinosOglasi");
  const router = useRouter();
  const [loadingPrijava, setLoadingPrijava] = useState(false);
  const [plan, setPlan] = useState("");
  const [izjava, setIzjava] = useState(false);
  const [ispunjenost, setIspunjenost] = useState("");
  const [poruka, setPoruka] = useState<{ text: string; ok: boolean } | null>(null);
  const { dijalog, potvrdi } = useDijalog();

  const aktivan = oglas.status === "ACTIVE";
  const moja = oglas.mojaPrijava;
  const ziva = moja?.ziva ?? false;
  // Posle odbijanja ili odustanka podnosi se izmenjena prijava (operativni 5.0 čl. 12
  // st. 4, 17). Zadružni doprinos nema prijave — izvršioca određuje zadruga (čl. 23).
  const mozePrijaviti = isVerified && aktivan && !ziva && !oglas.zadruzni;
  const imaPrimljenuPrijavu = ziva && moja?.status === "APPROVED";
  const cekaPrihvatanje = ziva && moja?.status === "PENDING" && moja.dodeljena;
  const radi = imaPrimljenuPrijavu && !moja?.zavrsetakAt && !moja?.zavrsnaOdluka;

  async function radnja(putanja: string, telo?: unknown) {
    setPoruka(null);
    const res = await fetch(putanja, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: telo ? JSON.stringify(telo) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setPoruka({ text: data.error ?? t("greska"), ok: false }); return; }
    router.refresh();
  }
  const mestaPopunjena = oglas.odobreniClanovi >= oglas.positions;

  const sourceLabel: Record<string, string> = {
    FONDACIJA: t("source_fondacija"),
    KRUG: t("source_krug"),
    PROJEKAT: t("source_projekat"),
  };

  const evStatusBadge: Record<string, { label: string; cls: string }> = {
    PENDING:  { label: t("ev_ceka_verifikaciju"), cls: "text-kolo-gold-700" },
    DOPUNA:   { label: t("ev_dopuna"),            cls: "text-kolo-gold-700" },
    APPROVED: { label: t("ev_potvrdeno"),         cls: "text-kolo-info" },
    REJECTED: { label: t("ev_odbijeno"),          cls: "text-kolo-danger" },
    EMITTED:  { label: t("ev_evidentirano"),      cls: "text-kolo-green-700" },
  };

  async function prijavi() {
    // Plan izvršenja je obavezan uz svaku prijavu (operativni čl. 10) — on je zapis o
    // tome da je izvršilac sam odredio način rada.
    if (plan.trim().length < 10) {
      setPoruka({ text: t("plan_min10"), ok: false });
      return;
    }
    if (!izjava) {
      setPoruka({ text: t("izjava_obavezna"), ok: false });
      return;
    }
    setLoadingPrijava(true); setPoruka(null);
    const res = await fetch(`/api/doprinos-oglasi/${oglas.id}/prijavi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planIzvrsenja: plan.trim(), izjavaPotvrdjena: true, ispunjenostUslova: ispunjenost.trim() || undefined }),
    });
    const data = await res.json();
    setLoadingPrijava(false);
    setPoruka({
      text: res.ok
        ? (data.primljen ? t("prijava_primljena_izvršilac") : t("prijava_podneta_ceka"))
        : (data.error ?? t("greska")),
      ok: res.ok,
    });
    if (res.ok) setTimeout(() => router.refresh(), 1200);
  }

  return (
    <div className="space-y-6">
      {dijalog}
      <div className="flex items-center gap-3">
        <Link href="/doprinos-oglasi" className="inline-flex min-h-9 items-center text-kolo-muted hover:text-kolo-green-700 text-sm transition-colors">← {t("naslov")}</Link>
      </div>

      {/* Header */}
      <Kartica padding="lg" className="space-y-4">
        <div>
          <div className="flex justify-between items-center gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${sourceCls[oglas.source] ?? "bg-kolo-bg text-kolo-muted"}`}>
                {sourceLabel[oglas.source] ?? oglas.source}
              </span>
              {oglas.krugName && <span className="text-xs text-kolo-muted">{oglas.krugName}</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {oglas.saOdobravanjem && <span className="text-xs bg-kolo-info-light text-kolo-info px-2 py-0.5 rounded-lg">{t("sa_odobravanjem")}</span>}
              {oglas.zadruzni && <span className="text-xs bg-kolo-info-light text-kolo-info px-2 py-0.5 rounded-lg">{t("zadruzni_oznaka")}</span>}
              <span className="text-xs bg-kolo-bg text-kolo-muted px-2 py-0.5 rounded-lg">{t(`status_zadatka_${oglas.statusZadatka}`)}</span>
            </div>
          </div>
          <h1 className="kolo-naslov">{oglas.title}</h1>
          <p className="text-sm text-kolo-muted mt-2 leading-relaxed whitespace-pre-line">{oglas.description}</p>
        </div>

        {oglas.obrazlozenje && (
          <div className="bg-kolo-bg rounded-kontrola p-3 text-sm text-kolo-muted">
            <span className="font-semibold text-kolo-text">{t("obrazlozenje_label")}: </span>{oglas.obrazlozenje}
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
          <div className="bg-kolo-bg rounded-kontrola p-3 text-center">
            <p className="font-semibold text-kolo-text">{oglas.odobreniClanovi}/{oglas.positions}</p>
            <p className="text-xs text-kolo-muted mt-0.5">{t("izvršilaca")}</p>
          </div>
          <div className="bg-kolo-bg rounded-kontrola p-3 text-center">
            <p className="font-semibold text-kolo-green-700">{oglas.predlozeniPoen > 0 ? `${oglas.predlozeniPoen.toLocaleString(intlTag(locale))} P` : t("neograniceno")}</p>
            <p className="text-xs text-kolo-muted mt-0.5">{t("predlozeni_tezina")}</p>
          </div>
        </div>

        {oglas.brojCelina != null && oglas.opisCeline && (
          <div className="text-sm text-kolo-muted bg-kolo-bg rounded-kontrola p-3 space-y-1">
            <p><span className="font-semibold text-kolo-text">{t("celina_opis_label")}: </span>{oglas.opisCeline}</p>
            <p>{t("celine_info", { po: Math.floor(oglas.predlozeniPoen / oglas.brojCelina).toLocaleString(intlTag(locale)), broj: oglas.brojCelina })}</p>
          </div>
        )}

        {oglas.procenaObima && (
          <p className="text-sm text-kolo-muted"><span className="font-semibold text-kolo-text">{t("procena_obima_label")}: </span>{oglas.procenaObima}</p>
        )}

        {oglas.deadline && (
          <p className="text-xs text-kolo-muted">
            {t("rok_za_prijavu")}: <strong className="text-kolo-muted">{new Date(oglas.deadline).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "long", year: "numeric" })}</strong>
          </p>
        )}
        {oglas.rokIzvrsenja && (
          <p className="text-xs text-kolo-muted">
            {t("rok_za_izvrsenje")}: <strong className="text-kolo-muted">{new Date(oglas.rokIzvrsenja).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "long", year: "numeric" })}</strong>
          </p>
        )}

        {/* Kvalifikacioni filter i obrazloženje (čl. 9 st. 3), odluka UO o odobravanju
            (čl. 12 st. 2) i javno obrazloženje povlačenja (čl. 8 st. 2). */}
        {oglas.kvalifikacioniUslov && (
          <div className="bg-kolo-bg rounded-kontrola p-3 text-sm text-kolo-muted">
            <p><span className="font-semibold text-kolo-text">{t("uslov_label")}: </span>{oglas.kvalifikacioniUslov}</p>
            {oglas.kvalifikacioniObrazlozenje && <p className="mt-1 text-xs">{oglas.kvalifikacioniObrazlozenje}</p>}
          </div>
        )}
        {oglas.odobravanjeObrazlozenje && <Obavestenje vrsta="info">{t("odobravanje_odluka", { obrazlozenje: oglas.odobravanjeObrazlozenje })}</Obavestenje>}
        {oglas.povucenoObrazlozenje && <Obavestenje vrsta="upozorenje">{t("povuceno_obrazlozenje", { obrazlozenje: oglas.povucenoObrazlozenje })}</Obavestenje>}
        {oglas.obustavljeno && <Obavestenje vrsta="upozorenje">{t("obustavljeno")}</Obavestenje>}

        {/* Status prijave */}
        {oglas.mojaPrijava && !oglas.mojaPrijava.odustao && !oglas.mojaPrijava.zavrsnaOdluka && (
          <Obavestenje vrsta={
            oglas.mojaPrijava.status === "APPROVED" ? "uspeh" :
            oglas.mojaPrijava.status === "REJECTED" ? "greska" :
            "info"
          }>
            {oglas.mojaPrijava.status === "APPROVED" && t("status_primljen_izvršilac")}
            {oglas.mojaPrijava.status === "PENDING" && (oglas.mojaPrijava.dodeljena ? t("status_dodela_ceka") : t("status_prijava_ceka"))}
            {oglas.mojaPrijava.status === "REJECTED" && (
              <span>{t("status_prijava_odbijena")}{oglas.mojaPrijava.rejectionReason ? ` ${t("razlog")}: ${oglas.mojaPrijava.rejectionReason}` : ""} {aktivan && !oglas.zadruzni ? t("izmenjena_prijava") : ""}</span>
            )}
          </Obavestenje>
        )}
        {oglas.mojaPrijava?.odustao && <Obavestenje vrsta="info">{t("status_odustao")}</Obavestenje>}
        {oglas.mojaPrijava?.zavrsetakAt && !oglas.mojaPrijava.zavrsnaOdluka && <Obavestenje vrsta="info">{t("status_zavrsetak_prijavljen")}</Obavestenje>}
        {oglas.mojaPrijava?.zavrsnaOdluka && (
          <Obavestenje vrsta={oglas.mojaPrijava.zavrsnaOdluka === "ODBIJEN" ? "greska" : "uspeh"}>
            {t(`zavrsna_${oglas.mojaPrijava.zavrsnaOdluka}`)}{oglas.mojaPrijava.zavrsnoObrazlozenje ? ` ${t("razlog")}: ${oglas.mojaPrijava.zavrsnoObrazlozenje}` : ""}
          </Obavestenje>
        )}

        {/* Prihvatanje dodeljene celine zadružnog doprinosa (čl. 23 st. 2; čl. 24 st. 2 t. 3). */}
        {cekaPrihvatanje && (
          <div className="rounded-kontrola bg-kolo-bg p-4 space-y-3">
            <p className="text-xs font-semibold text-kolo-muted">{t("izjava_naslov")}</p>
            <p className="text-xs text-kolo-muted whitespace-pre-line leading-relaxed">
              {generisiIzjavuIzvrsioca({ nazivZadatka: oglas.title, predlozeniPoen: oglas.predlozeniPoen })}
            </p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={izjava} onChange={(e) => setIzjava(e.target.checked)} className="mt-0.5 accent-kolo-green-700" />
              <span className="text-xs text-kolo-text">{t("izjava_potvrda")}</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Dugme onClick={() => radnja(`/api/doprinos-oglasi/${oglas.id}/prihvati`, { izjavaPotvrdjena: true })} disabled={!izjava}>{t("prihvati_dodelu")}</Dugme>
              <Dugme varijanta="sekundarno" onClick={() => radnja(`/api/doprinos-oglasi/${oglas.id}/odustani`)}>{t("odbij_dodelu")}</Dugme>
            </div>
          </div>
        )}

        {/* Izvršilac: prijava završetka (čl. 16 st. 1) i odustanak (čl. 17). */}
        {radi && aktivan && (
          <div className="flex flex-wrap gap-2">
            <Dugme varijanta="sekundarno" onClick={async () => {
              if (await potvrdi({ poruka: t("zavrsetak_potvrda"), dugme: t("prijavi_zavrsetak") })) void radnja(`/api/doprinos-oglasi/${oglas.id}/zavrsetak`);
            }}>{t("prijavi_zavrsetak")}</Dugme>
            <Dugme varijanta="tiho" onClick={async () => {
              if (await potvrdi({ poruka: t("odustanak_potvrda"), dugme: t("odustani"), opasno: true })) void radnja(`/api/doprinos-oglasi/${oglas.id}/odustani`);
            }}>{t("odustani")}</Dugme>
          </div>
        )}

        {/* Snimljena izjava (operativni čl. 10 st. 1 t. 3). Prikazuje se tekst SA PRIJAVE, ne
            ponovo generisan — dokument mora da govori ono što je govorio tada.
            Zatečene prijave nemaju izjavu i tada ovaj odeljak izostaje. */}
        {oglas.mojaPrijava?.izjavaTekst && (
          <details className="rounded-kontrola bg-kolo-bg px-4 py-3">
            <summary className="min-h-9 flex items-center text-xs font-semibold text-kolo-muted cursor-pointer">{t("izjava_naslov")}</summary>
            <p className="mt-2 text-xs text-kolo-muted whitespace-pre-line leading-relaxed">{oglas.mojaPrijava.izjavaTekst}</p>
          </details>
        )}

        {/* Akcije */}
        <div className="pt-1 space-y-3">
          {!isVerified && aktivan && (
            <Obavestenje vrsta="upozorenje">{t("potreban_indeks")}</Obavestenje>
          )}
          {mozePrijaviti && mestaPopunjena && (
            <p className="text-sm text-kolo-muted">{t("mesta_popunjena")}</p>
          )}
          {mozePrijaviti && !mestaPopunjena && (
            <>
              {oglas.kvalifikacioniUslov && (
                <Polje oznaka={t("ispunjenost_label")}>
                  <textarea rows={2} value={ispunjenost} onChange={(e) => setIspunjenost(e.target.value)}
                    className={`${KLASE_UNOSA} resize-none`} />
                </Polje>
              )}
              <Polje oznaka={t("plan_label")}>
                <textarea rows={3} value={plan} onChange={(e) => setPlan(e.target.value)}
                  placeholder={t("plan_placeholder")}
                  className={`${KLASE_UNOSA} resize-none`} />
              </Polje>
              {/* Izjava o pravnoj prirodi (operativni čl. 10 st. 1 t. 3). Tekst stoji VIDLJIV iznad
                  potvrde, ne kao link na pravilnik — potvrđuje se ono što se pročita. */}
              <div className="rounded-kontrola bg-kolo-bg p-4">
                <p className="text-xs font-semibold text-kolo-muted mb-2">{t("izjava_naslov")}</p>
                <p className="text-xs text-kolo-muted whitespace-pre-line leading-relaxed">
                  {generisiIzjavuIzvrsioca({ nazivZadatka: oglas.title, predlozeniPoen: oglas.predlozeniPoen })}
                </p>
                <label className="mt-3 flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={izjava} onChange={(e) => setIzjava(e.target.checked)}
                    className="mt-0.5 accent-kolo-green-700" />
                  <span className="text-xs text-kolo-text">{t("izjava_potvrda")}</span>
                </label>
              </div>
              <Dugme velicina="lg" punaSirina onClick={prijavi} disabled={loadingPrijava || !izjava}>
                {loadingPrijava ? t("saljem_prijavu") : t("prijavi_se_sa_planom")}
              </Dugme>
            </>
          )}
          {poruka && (
            <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>
              {poruka.text}
            </Obavestenje>
          )}
        </div>
      </Kartica>

      {/* Forma za evidenciju dnevnog izvršenja */}
      {radi && aktivan && (
        <EvidencijaForma
          oglasId={oglas.id}
          maxPredlozeni={oglas.predlozeniPoen}
          celine={oglas.brojCelina != null ? {
            broj: oglas.brojCelina,
            poPoCelini: Math.floor(oglas.predlozeniPoen / oglas.brojCelina),
            preostalo: oglas.brojCelina - oglas.mojeEvidencije.filter((e) => e.status !== "REJECTED").reduce((z, e) => z + (e.celina ?? 0), 0),
          } : null}
          onSuccess={() => router.refresh()}
        />
      )}

      {/* Istorija izvršenja */}
      {oglas.mojeEvidencije.length > 0 && (
        <Kartica padding="nema" className="overflow-hidden">
          <div className="px-5 py-3 border-b border-kolo-border">
            <h3 className="text-sm font-semibold text-kolo-muted">{t("moja_dnevna_izvrsenja")}</h3>
          </div>
          {oglas.mojeEvidencije.map((e, i) => {
            const badge = evStatusBadge[e.status];
            return (
              <div key={e.id} className={`px-5 py-3 flex justify-between items-center gap-3 ${i < oglas.mojeEvidencije.length - 1 ? "border-b border-kolo-border" : ""}`}>
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  {e.dokaz && /\.(jpe?g|png|webp)(\?.*)?$/i.test(e.dokaz) && /^https?:\/\//.test(e.dokaz) && (
                    <a href={e.dokaz} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={e.dokaz} alt={t("dokaz_label")} className="h-10 w-10 rounded-lg border border-kolo-border object-cover" />
                    </a>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-kolo-text">{new Date(e.date).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "short", year: "numeric" })}</p>
                    <p className="text-xs text-kolo-muted mt-0.5 line-clamp-1">{e.celina != null ? `${t("ev_celina", { broj: e.celina })} · ` : ""}{e.description}</p>
                    {e.odlukaObrazlozenje && <p className="text-xs text-kolo-muted mt-0.5">{t("razlog")}: {e.odlukaObrazlozenje}</p>}
                    {e.status === "DOPUNA" && <DopunaForma oglasId={oglas.id} evId={e.id} onSuccess={() => router.refresh()} />}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-kolo-text">
                    {e.status === "EMITTED"
                      ? t("ev_iznos_evidentirano", { iznos: e.amount.toLocaleString(intlTag(locale)) })
                      : t("ev_iznos_predlozeno", { iznos: e.predlozeniPoen.toLocaleString(intlTag(locale)) })}
                  </p>
                  <p className={`text-xs font-medium ${badge?.cls ?? ""}`}>{badge?.label}</p>
                </div>
              </div>
            );
          })}
        </Kartica>
      )}
    </div>
  );
}

// ── Forma za unos dnevnog izvršenja ─────────────────────────────────────────────

function EvidencijaForma({ oglasId, maxPredlozeni, celine, onSuccess }: {
  oglasId: string;
  maxPredlozeni: number;
  /** Zadatak sa celinama (operativni čl. 6 i 15; S1): izvršilac navodi broj celina, iznos ne bira. NULL = zatečen zadatak. */
  celine: { broj: number; poPoCelini: number; preostalo: number } | null;
  onSuccess: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("doprinosOglasi");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [predlozeniPoen, setPredlozeniPoen] = useState("");
  const [brojCelina, setBrojCelina] = useState("1");
  const [description, setDescription] = useState("");
  const [dokazSlika, setDokazSlika] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const brojIzvrsenih = Number(brojCelina);
  const predlozeni = celine
    ? (Number.isInteger(brojIzvrsenih) && brojIzvrsenih > 0 ? brojIzvrsenih * celine.poPoCelini : 0)
    : Number(predlozeniPoen);

  // Max datum = danas, min datum = 3 dana unazad
  const maxDate = new Date().toISOString().split("T")[0];
  const minDateObj = new Date(); minDateObj.setDate(minDateObj.getDate() - 3);
  const minDate = minDateObj.toISOString().split("T")[0];

  async function handleSubmit() {
    setError("");
    if (celine) {
      if (!Number.isInteger(brojIzvrsenih) || brojIzvrsenih < 1) { setError(t("ev_greska_celina")); return; }
      if (brojIzvrsenih > celine.preostalo) { setError(t("ev_greska_celina_max", { broj: celine.preostalo })); return; }
    } else {
      if (!predlozeniPoen || !Number.isInteger(predlozeni) || predlozeni < 1) { setError(t("ev_greska_poen_pozitivan")); return; }
      if (maxPredlozeni > 0 && predlozeni > maxPredlozeni) { setError(t("ev_greska_poen_max", { max: maxPredlozeni.toLocaleString(intlTag(locale)) })); return; }
    }
    if (!description.trim() || description.trim().length < 10) { setError(t("ev_greska_opis_min10")); return; }
    if (dokazSlika) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(dokazSlika.type)) { setError(t("ev_greska_dokaz_format")); return; }
      if (dokazSlika.size > 5 * 1024 * 1024) { setError(t("ev_greska_dokaz_velicina")); return; }
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("date", date);
      if (celine) fd.append("celina", String(brojIzvrsenih));
      else fd.append("predlozeniPoen", String(predlozeni));
      fd.append("description", description.trim());
      if (dokazSlika) fd.append("dokazSlika", dokazSlika);
      const res = await fetch(`/api/doprinos-oglasi/${oglasId}/evidencija`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? t("greska")); return; }
      setSuccess(true);
      setDescription(""); setPredlozeniPoen(""); setBrojCelina("1"); setDokazSlika(null);
      setTimeout(onSuccess, 1200);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Obavestenje vrsta="uspeh">
        {t("ev_uspeh")}
      </Obavestenje>
    );
  }

  return (
    <Kartica className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <h3 className="text-sm font-semibold text-kolo-muted">{celine ? t("evidentiraj_celine") : t("evidentiraj_dnevno")}</h3>
        {predlozeni > 0 && (
          <span className="text-sm font-bold text-kolo-green-700">{t("ev_iznos_predlozeno", { iznos: predlozeni.toLocaleString(intlTag(locale)) })}</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Polje oznaka={t("datum")}>
          <input type="date" value={date} min={minDate} max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            className={KLASE_UNOSA} />
        </Polje>
        {celine ? (
          <div>
            <label htmlFor="ev-broj-celina" className="mb-1.5 block text-sm font-medium text-kolo-text">{t("broj_celina_label")}</label>
            <input id="ev-broj-celina" type="number" min={1} max={celine.preostalo} step={1} value={brojCelina}
              onChange={(e) => setBrojCelina(e.target.value)}
              className={KLASE_UNOSA} />
            <p className="mt-1 text-xs text-kolo-muted">{t("celine_preostalo", { broj: celine.preostalo })}</p>
            {/* Definiciona rečenica uz polje: celina je deo posla, iznos nije izvršiočev. */}
            <p className="mt-1.5 text-[11px] leading-snug text-kolo-muted">{t("celine_napomena")}</p>
          </div>
        ) : (
          <div>
            <label htmlFor="ev-predlozeni-poen" className="mb-1.5 block text-sm font-medium text-kolo-text">{maxPredlozeni > 0 ? t("predlozeni_poen_max", { max: maxPredlozeni.toLocaleString(intlTag(locale)) }) : t("predlozeni_poen_bez_max")}</label>
            <input id="ev-predlozeni-poen" type="number" min={1} max={maxPredlozeni > 0 ? maxPredlozeni : undefined} step={1} value={predlozeniPoen}
              onChange={(e) => setPredlozeniPoen(e.target.value)}
              placeholder={t("predlozeni_poen_placeholder")}
              className={KLASE_UNOSA} />
            {/* Definiciona rečenica uz samo polje — isti posao koji
                `novcanik.send_napomena` radi za prepis. Bez nje polje za unos
                iznosa čita se kao fakturisanje rada. */}
            <p className="mt-1.5 text-[11px] leading-snug text-kolo-muted">{t("predlozeni_napomena")}</p>
          </div>
        )}
      </div>

      <Polje oznaka={t("opis_izvrsenja_label")}>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder={t("opis_izvrsenja_placeholder")}
          className={`${KLASE_UNOSA} resize-none`} />
      </Polje>

      <Polje oznaka={t("dokaz_label")} pomoc={t("dokaz_napomena")}>
        <input type="file" accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setDokazSlika(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-kolo-muted file:mr-3 file:px-4 file:py-2 file:rounded-kontrola file:border-0 file:bg-kolo-green-100 file:text-kolo-green-700 file:text-xs file:font-semibold file:cursor-pointer" />
      </Polje>
      {/* DPIA 5.0 (operativni doprinos): dokaz o poslu, ne o licu — upozorenje uz polje za dokaz. */}
      <Obavestenje vrsta="upozorenje">{t("dokaz_upozorenje")}</Obavestenje>

      {error &&<Obavestenje vrsta="greska">{error}</Obavestenje>}

      <Dugme velicina="lg" punaSirina onClick={handleSubmit} disabled={loading}>
        {loading ? t("saljem") : celine ? t("posalji_celine") : t("posalji_dnevno")}
      </Dugme>
    </Kartica>
  );
}

// ── Dopuna dokaza posle uslovne potvrde (operativni 5.0 čl. 15 st. 2 t. 3) ─────────

function DopunaForma({ oglasId, evId, onSuccess }: { oglasId: string; evId: string; onSuccess: () => void }) {
  const t = useTranslations("doprinosOglasi");
  const [opis, setOpis] = useState("");
  const [slika, setSlika] = useState<File | null>(null);
  const [greska, setGreska] = useState("");
  const [salje, setSalje] = useState(false);

  async function posalji() {
    setGreska("");
    setSalje(true);
    try {
      const fd = new FormData();
      fd.append("description", opis.trim());
      if (slika) fd.append("dokazSlika", slika);
      const res = await fetch(`/api/doprinos-oglasi/${oglasId}/evidencija/${evId}/dopuna`, { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setGreska(d.error ?? t("greska")); return; }
      onSuccess();
    } finally {
      setSalje(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea rows={2} value={opis} onChange={(e) => setOpis(e.target.value)} placeholder={t("dopuna_placeholder")}
        aria-label={t("dopuna_placeholder")} className={`${KLASE_UNOSA} resize-none`} />
      <input type="file" accept="image/jpeg,image/png,image/webp" aria-label={t("dokaz_label")}
        onChange={(e) => setSlika(e.target.files?.[0] ?? null)} className="w-full text-xs text-kolo-muted" />
      {greska && <Obavestenje vrsta="greska">{greska}</Obavestenje>}
      <Dugme velicina="sm" onClick={posalji} disabled={salje}>{t("posalji_dopunu")}</Dugme>
    </div>
  );
}
