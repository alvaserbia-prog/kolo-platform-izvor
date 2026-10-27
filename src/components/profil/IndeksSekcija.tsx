"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import IndeksPrikaz from "@/components/verifikacija/IndeksPrikaz";
import type { StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import MiniStablo, {
  type CvorVerifikator,
  type CvorVerifikovani,
} from "@/components/verifikacija/MiniStablo";

type LanacResponse = {
  korisnik: {
    id: string;
    pseudonim: string;
    jeOsnivac: boolean;
  };
  verifikatori: {
    id: string;
    pseudonim: string;
    datum: string;
    statusNadzora: string;
  }[];
  verifikovani: {
    id: string;
    pseudonim: string;
    datum: string;
    statusNadzora: string;
  }[];
};

/**
 * Sekcija na sopstvenom profilu /profil/[id] — status učesnika i mini stablo (lanac
 * verifikacija). Tuđi lanac se ne prikazuje (Politika čl. 15 st. 7); server ga ne vraća.
 *
 * Status (set 4.8.2) stiže gotov sa servera (`statusUcesnika` iz `/api/profil/[id]`)
 * i crta ga `OznakaStatusa` kroz `IndeksPrikaz`; ovde se ne izvodi iz `tip` ni iz
 * indeksa. Stablo se dohvata iz `/api/verifikacija/lanac/[korisnikId]` samo kad se
 * prikazuje.
 */
export default function IndeksSekcija({
  korisnikId,
  status = null,
  prikaziIndeks = true,
  prikaziStablo = true,
  indeksKaoBadge = false,
  ispuniVisinu = false,
}: {
  korisnikId: string;
  /** Status učesnika sa servera; bez njega se oznaka ne crta. */
  status?: StatusUcesnika | null;
  prikaziIndeks?: boolean;
  prikaziStablo?: boolean;
  indeksKaoBadge?: boolean;
  ispuniVisinu?: boolean;
}) {
  const t = useTranslations("common");
  const [data, setData] = useState<LanacResponse | null>(null);
  // Samo prekidač: kad upit padne, sekcija se ne crta (`if (error) return null`),
  // pa poruka o grešci nema gde da se prikaže — zato boolean, ne tekst.
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!prikaziStablo) return;
    fetch(`/api/verifikacija/lanac/${korisnikId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          setError(true);
          return;
        }
        setData(d);
      })
      .catch(() => setError(true));
  }, [korisnikId, prikaziStablo]);

  if (!prikaziStablo) {
    if (!prikaziIndeks || !status) return null;
    return <IndeksPrikaz status={status} statusKaoBadge={indeksKaoBadge} ispuniVisinu={ispuniVisinu} />;
  }

  if (error) return null;
  if (!data) {
    return (
      <div className={`rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica${ispuniVisinu ? " h-full" : ""}`}>
        <div className="text-sm text-kolo-muted">{t("ucitavanje")}</div>
      </div>
    );
  }

  const verifikatorCvorovi: CvorVerifikator[] = data.verifikatori.map((v) => ({
    id: v.id,
    pseudonim: v.pseudonim,
  }));

  const verifikovaniCvorovi: CvorVerifikovani[] = data.verifikovani.map((v) => ({
    id: v.id,
    pseudonim: v.pseudonim,
    statusNadzora: v.statusNadzora as CvorVerifikovani["statusNadzora"],
  }));

  return (
    <div className={ispuniVisinu ? "flex-1 flex flex-col" : "space-y-4"}>
      {prikaziIndeks && status && (
        <IndeksPrikaz status={status} statusKaoBadge={indeksKaoBadge} ispuniVisinu={ispuniVisinu} />
      )}
      {prikaziStablo && (
        <MiniStablo
          ja={{ pseudonim: data.korisnik.pseudonim }}
          verifikatori={verifikatorCvorovi}
          verifikovani={verifikovaniCvorovi}
          jeJaPocetni={data.korisnik.jeOsnivac}
          className={ispuniVisinu ? "h-full" : ""}
        />
      )}
    </div>
  );
}
