"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Pseudonim from "@/components/Pseudonim";
import { profilHref } from "@/lib/profil-link";
import Kartica from "@/components/ui/Kartica";
import Dugme from "@/components/ui/Dugme";
import NaslovStranice from "@/components/ui/NaslovStranice";
import Obavestenje from "@/components/ui/Obavestenje";
import PraznoStanje from "@/components/ui/PraznoStanje";
import { KLASE_UNOSA } from "@/components/ui/Polje";

type Stavka = {
  id: string;
  program: string;
  podnosilacId: string;
  podnosilacPseudonim: string;
};

export default function PotvrdeKlijent({ stavke }: { stavke: Stavka[] }) {
  const t = useTranslations("programi");
  const [lista, setLista] = useState(stavke);
  const [poruka, setPoruka] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  function ukloni(id: string) {
    setLista((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-5">
      <NaslovStranice naslov={t("potvrde_naslov")} opis={t("potvrde_opis")} />

      {lista.length === 0 ? (
        <Kartica padding="nema">
          <PraznoStanje naslov={t("potvrde_prazno")} />
        </Kartica>
      ) : (
        <div className="space-y-3">
          {lista.map((s) => (
            <PotvrdaKartica
              key={s.id}
              stavka={s}
              poruka={poruka?.id === s.id ? poruka : null}
              onGotovo={(text, ok) => {
                setPoruka({ id: s.id, text, ok });
                if (ok) setTimeout(() => ukloni(s.id), 1200);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PotvrdaKartica({
  stavka,
  poruka,
  onGotovo,
}: {
  stavka: Stavka;
  poruka: { text: string; ok: boolean } | null;
  onGotovo: (text: string, ok: boolean) => void;
}) {
  const t = useTranslations("programi");
  const [odbijam, setOdbijam] = useState(false);
  const [obrazlozenje, setObrazlozenje] = useState("");
  const [loading, setLoading] = useState(false);

  async function posalji(potvrdi: boolean) {
    if (!potvrdi && obrazlozenje.trim().length === 0) {
      onGotovo(t("potvrda_obrazlozenje_obavezno"), false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/programi/potvrde/${stavka.id}/odgovori`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ potvrdi, obrazlozenje: obrazlozenje.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      onGotovo(potvrdi ? t("potvrda_potvrdeno") : t("potvrda_odbijeno"), true);
    } else {
      onGotovo(data.error ?? t("potvrda_greska"), false);
    }
  }

  return (
    <Kartica className="space-y-3">
      <div>
        <p className="font-semibold text-kolo-text">{stavka.program}</p>
        <p className="text-sm text-kolo-muted">
          {t("potvrda_podnosilac")}{" "}
          <Link href={profilHref({ id: stavka.podnosilacId, pseudonim: stavka.podnosilacPseudonim })} className="text-kolo-green-700 hover:underline">
            @<Pseudonim>{stavka.podnosilacPseudonim}</Pseudonim>
          </Link>
        </p>
      </div>

      {!odbijam ? (
        <div className="flex gap-2">
          <Dugme className="flex-1" onClick={() => posalji(true)} disabled={loading}>
            {loading ? "..." : t("potvrda_dugme_potvrdi")}
          </Dugme>
          <Dugme varijanta="sekundarno" onClick={() => setOdbijam(true)} disabled={loading}>
            {t("potvrda_dugme_odbij")}
          </Dugme>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            rows={2}
            value={obrazlozenje}
            onChange={(e) => setObrazlozenje(e.target.value)}
            placeholder={t("potvrda_obrazlozenje_placeholder")}
            aria-label={t("potvrda_obrazlozenje_placeholder")}
            className={`${KLASE_UNOSA} resize-none`}
          />
          <div className="flex gap-2">
            <Dugme varijanta="sekundarno" className="flex-1" onClick={() => setOdbijam(false)} disabled={loading}>
              {t("potvrda_nazad")}
            </Dugme>
            <Dugme varijanta="opasno" className="flex-1" onClick={() => posalji(false)} disabled={loading}>
              {loading ? "..." : t("potvrda_posalji_odbijanje")}
            </Dugme>
          </div>
        </div>
      )}

      {poruka && (
        <Obavestenje vrsta={poruka.ok ? "uspeh" : "greska"}>
          {poruka.text}
        </Obavestenje>
      )}
    </Kartica>
  );
}
