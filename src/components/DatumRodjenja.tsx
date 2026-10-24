"use client";

/**
 * Unos datuma rođenja — TRI broja (dan, mesec, godina), bez kalendara.
 *
 * 🔴 Zašto ne `<input type="date">`: kalendar se otvara na TEKUĆEM mesecu, a
 * datum rođenja deteta je sedam do osamnaest godina unazad. Da bi se do njega
 * stiglo, treba proklikati preko sto meseci — ili pogoditi sitno polje za godinu
 * u nagaznom prikazu koji svaki pretraživač crta drugačije. Roditelj datum
 * rođenja svog deteta ZNA napamet; brže ga otkuca nego što ga nađe.
 *
 * Godina se kuca cela (2015), ne skraćeno — dvocifreni unos bi tražio pravilo o
 * veku, a ono se u ovom rasponu ionako svodi na jedno.
 *
 * Vraća `YYYY-MM-DD` kad je datum potpun, ispravan kao kalendarski datum i unutar
 * dozvoljenog raspona; inače prazan string. Time se svaka zatečena provera oblika
 * `!datum` ili `required` ponaša isto kao ranije.
 */

import { useEffect, useRef, useState } from "react";

export interface DatumRodjenjaProps {
  value: string;
  onChange: (iso: string) => void;
  /** Najraniji dozvoljen datum (YYYY-MM-DD) — donja granica uzrasta. */
  min?: string;
  /** Najkasniji dozvoljen datum (YYYY-MM-DD) — gornja granica uzrasta. */
  max?: string;
  /** Poruka kad je unos potpun ali van raspona ili nepostojeći datum. */
  porukaGreske?: string;
  id?: string;
}

const dvocifreno = (s: string) => s.replace(/\D/g, "").slice(0, 2);
const cetvorocifreno = (s: string) => s.replace(/\D/g, "").slice(0, 4);

/** Kalendarska provera: 31.02. mora da padne, a `new Date` ga tiho pomeri na mart. */
function sastavi(d: string, m: string, g: string): string | null {
  if (d.length === 0 || m.length === 0 || g.length !== 4) return null;
  const dan = Number(d);
  const mesec = Number(m);
  const godina = Number(g);
  if (!dan || !mesec || !godina) return null;
  if (mesec < 1 || mesec > 12 || dan < 1 || dan > 31) return null;
  const datum = new Date(Date.UTC(godina, mesec - 1, dan));
  if (
    datum.getUTCFullYear() !== godina ||
    datum.getUTCMonth() !== mesec - 1 ||
    datum.getUTCDate() !== dan
  ) {
    return null;
  }
  return `${g}-${String(mesec).padStart(2, "0")}-${String(dan).padStart(2, "0")}`;
}

export default function DatumRodjenja({
  value,
  onChange,
  min,
  max,
  porukaGreske,
  id,
}: DatumRodjenjaProps) {
  // Početno stanje se izvodi iz prosleđene vrednosti, da polje preživi ponovno
  // iscrtavanje forme; posle toga vode tri broja, jer je unos u toku često
  // nepotpun i ne sme da se briše sam.
  const [dan, setDan] = useState(() => (value ? value.slice(8, 10) : ""));
  const [mesec, setMesec] = useState(() => (value ? value.slice(5, 7) : ""));
  const [godina, setGodina] = useState(() => (value ? value.slice(0, 4) : ""));
  const [dirnuto, setDirnuto] = useState(false);

  const mesecRef = useRef<HTMLInputElement>(null);
  const godinaRef = useRef<HTMLInputElement>(null);

  const iso = sastavi(dan, mesec, godina);
  const uRasponu = iso !== null && (!min || iso >= min) && (!max || iso <= max);
  const popunjeno = dan.length > 0 && mesec.length > 0 && godina.length === 4;
  const lose = dirnuto && popunjeno && !uRasponu;

  useEffect(() => {
    const nova = uRasponu && iso ? iso : "";
    if (nova !== value) onChange(nova);
    // `onChange` namerno nije u zavisnostima: inline funkcija iz forme menja se
    // pri svakom iscrtavanju, pa bi efekat sam sebe pozivao u krug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, uRasponu]);

  const polje =
    "rounded-xl border px-3 py-2 text-sm tabular-nums outline-none focus:border-kolo-green-700 " +
    (lose ? "border-kolo-danger" : "border-kolo-border");

  return (
    <div>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={id}
          value={dan}
          onChange={(e) => {
            const v = dvocifreno(e.target.value);
            setDan(v);
            // Skok na sledeće polje tek kad dalje kucanje nema gde da stane:
            // dva znaka, ili prvi znak koji ne može da bude početak dvocifrenog
            // dana (4–9). Bez toga „5" pa „ ← " postaje borba sa fokusom.
            if (v.length === 2 || (v.length === 1 && Number(v) > 3)) mesecRef.current?.focus();
          }}
          onBlur={() => setDirnuto(true)}
          inputMode="numeric"
          placeholder="dd"
          aria-label="dan"
          className={`${polje} w-14 text-center`}
        />
        <span className="text-kolo-muted">.</span>
        <input
          ref={mesecRef}
          value={mesec}
          onChange={(e) => {
            const v = dvocifreno(e.target.value);
            setMesec(v);
            if (v.length === 2 || (v.length === 1 && Number(v) > 1)) godinaRef.current?.focus();
          }}
          onBlur={() => setDirnuto(true)}
          inputMode="numeric"
          placeholder="mm"
          aria-label="mesec"
          className={`${polje} w-14 text-center`}
        />
        <span className="text-kolo-muted">.</span>
        <input
          ref={godinaRef}
          value={godina}
          onChange={(e) => setGodina(cetvorocifreno(e.target.value))}
          onBlur={() => setDirnuto(true)}
          inputMode="numeric"
          placeholder="gggg"
          aria-label="godina"
          className={`${polje} w-20 text-center`}
        />
      </div>
      {lose && porukaGreske && (
        <span className="mt-1 block text-xs text-kolo-danger">{porukaGreske}</span>
      )}
    </div>
  );
}
