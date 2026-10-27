/**
 * Provera zatvorene grupe (Pravilnik o dokazu stvarnosti čl. 26, set
 * 4.8.2) — ČISTA funkcija, bez Prisme (CLAUDE.md pravilo 9).
 *
 * Prepoznaje grupe članova bez potvrde koji su međusobno uveli jedni druge u Kolo i
 * koji razmenjuju samo unutar grupe, bez razmene sa članom Kola.
 *
 * 🔴 Provera NE PROIZVODI NIKAKVO DEJSTVO: ne menja status, verifikaciju ni zapise,
 * nije ishod nadzora ni tvrdnja da je verifikacija lažna i ne pokreće postupak iz
 * Glave IX. Ne čuva se — računa se pri prikazu i samo se pokazuje Fondaciji, koja
 * članove grupe može pozvati na razgovor.
 */
import { jePotvrdjen, type StatusUcesnika } from "@/lib/status-ucesnika-pravila";

export type VezaGrupe = { verifikatorId: string; verifikovaniId: string; vrsta: "POTVRDA" | "UVODJENJE" };
/** Razmena kao par učesnika (smer nije bitan). */
export type RazmenaGrupe = { aId: string; bId: string };

export type ZatvorenaGrupa = {
  /** Članovi grupe (id), sortirano. */
  clanovi: string[];
  /** Broj razmena unutar grupe. */
  razmenaUnutar: number;
  /** Broj razmena sa učesnicima van grupe koji nisu članovi Kola. */
  razmenaSaOstalima: number;
};

/** Najmanja grupa koja se prikazuje. */
export const MIN_CLANOVA_GRUPE = 2;

/**
 * Povezane komponente nad uvođenjima u Kolo čija su OBA kraja danas članovi bez
 * potvrde. Komponenta je zatvorena grupa kad ima bar jednu razmenu unutar sebe i
 * nijednu razmenu sa članom Kola (član Kola, čuvar, osnivač) van grupe.
 */
export function zatvoreneGrupe(
  veze: VezaGrupe[],
  razmene: RazmenaGrupe[],
  statusi: ReadonlyMap<string, StatusUcesnika>,
): ZatvorenaGrupa[] {
  const bezPotvrde = (id: string) => statusi.get(id) === "CLAN_BEZ_POTVRDE";

  // Union-find nad uvođenjima između dva člana bez potvrde.
  const roditelj = new Map<string, string>();
  const nadji = (x: string): string => {
    let r = x;
    while (roditelj.get(r) !== r) r = roditelj.get(r)!;
    let c = x;
    while (roditelj.get(c) !== r) {
      const n = roditelj.get(c)!;
      roditelj.set(c, r);
      c = n;
    }
    return r;
  };
  for (const v of veze) {
    if (v.vrsta !== "UVODJENJE") continue;
    if (!bezPotvrde(v.verifikatorId) || !bezPotvrde(v.verifikovaniId)) continue;
    for (const id of [v.verifikatorId, v.verifikovaniId]) if (!roditelj.has(id)) roditelj.set(id, id);
    const a = nadji(v.verifikatorId);
    const b = nadji(v.verifikovaniId);
    if (a !== b) roditelj.set(a, b);
  }

  const komponente = new Map<string, string[]>();
  for (const id of roditelj.keys()) {
    const k = nadji(id);
    const lista = komponente.get(k);
    if (lista) lista.push(id);
    else komponente.set(k, [id]);
  }

  const rezultat: ZatvorenaGrupa[] = [];
  for (const clanovi of komponente.values()) {
    if (clanovi.length < MIN_CLANOVA_GRUPE) continue;
    const skup = new Set(clanovi);
    let unutar = 0;
    let saOstalima = 0;
    let saClanomKola = false;
    for (const r of razmene) {
      const uA = skup.has(r.aId);
      const uB = skup.has(r.bId);
      if (!uA && !uB) continue;
      if (uA && uB) {
        unutar++;
        continue;
      }
      const spolja = uA ? r.bId : r.aId;
      const s = statusi.get(spolja);
      if (s && jePotvrdjen(s)) {
        saClanomKola = true;
        break;
      }
      saOstalima++;
    }
    if (saClanomKola || unutar === 0) continue;
    rezultat.push({ clanovi: [...clanovi].sort(), razmenaUnutar: unutar, razmenaSaOstalima: saOstalima });
  }
  return rezultat.sort((a, b) => b.clanovi.length - a.clanovi.length);
}
