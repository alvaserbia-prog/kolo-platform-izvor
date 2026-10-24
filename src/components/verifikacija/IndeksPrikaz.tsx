/**
 * Kartica statusa na stranici Potvrde i na profilu (set 4.8.2). Ime komponente
 * je interno i ostaje (CLAUDE.md pravilo 12); indeks se ne prikazuje — ni broj
 * ni „potvrđen/nepotvrđen" kao lestvica. Naziv statusa, opis i obavezne rečenice
 * crta isključivo `OznakaStatusa`, a status stiže gotov sa servera
 * (`statusUcesnika`), pa ova komponenta ne izvodi ništa iz `tipKorisnika`.
 */
import OznakaStatusa, { type ZrnoPolozaj } from "@/components/OznakaStatusa";
import type { StatusUcesnika } from "@/lib/status-ucesnika-pravila";
import type { NaStaSeCeka } from "@/lib/deca-pravila";

type Props = {
  status: StatusUcesnika;
  podnaslov?: string;
  /** Učesnik gleda sopstveni status — kartica nosi naslov „Tvoj status". */
  svoj?: boolean;
  /** Profil drugog: samo oznaka, centrirana u kartici (bez opisa). */
  statusKaoBadge?: boolean;
  /** Kartica popunjava punu visinu roditelja (h-full), sadržaj centriran. */
  ispuniVisinu?: boolean;
  naStaSeCeka?: NaStaSeCeka | null;
  zrno?: ZrnoPolozaj;
  children?: React.ReactNode;
};

export default function IndeksPrikaz({
  status,
  podnaslov,
  svoj,
  statusKaoBadge,
  ispuniVisinu,
  naStaSeCeka,
  zrno,
  children,
}: Props) {
  if (statusKaoBadge) {
    return (
      <div
        className={`rounded-kartica border border-kolo-border bg-kolo-surface p-6 shadow-kartica flex items-center justify-center${
          ispuniVisinu ? " h-full" : ""
        }`}
      >
        <OznakaStatusa status={status} className="text-sm px-3 py-1.5" />
      </div>
    );
  }

  return (
    <OznakaStatusa
      status={status}
      varijanta="kartica"
      svoj={svoj}
      podnaslov={podnaslov}
      naStaSeCeka={naStaSeCeka}
      zrno={zrno}
      // „Želim da me neko nazove" na Potvrdama ima sopstvenu karticu ispod — ne dvaput.
      vezaNazove={false}
      className={ispuniVisinu ? "h-full" : ""}
    >
      {children}
    </OznakaStatusa>
  );
}
