/**
 * STIPS cena (set 5.1.3; donacije čl. 33 st. 1, nabavke čl. 40 st. 3).
 *
 * Sistem tržišnih informacija poljoprivrede Srbije (STIPS) u nedeljnom biltenu objavljuje
 * DOMINANTNU cenu po pijaci, ne prosek za Republiku Srbiju. Cena za Republiku Srbiju je zato
 * aritmetički prosek dominantnih cena svih pijaca koje su u tom biltenu objavile cenu za tu
 * kategoriju, zaokružen kao u biltenu: ispod 100 dinara na ceo dinar, od 100 do ispod 1.000 na
 * deset dinara, od 1.000 naviše na sto dinara (odluka vlasnika 10.11.2026). Uz cenu se uvek čuvaju bilten
 * (broj, datum, link) i cene pijaca iz kojih je prosek izračunat, da ga svako proveri na STIPS-u.
 * Ako nijedna pijaca nije objavila cenu, cene nema i primenjuje se cenovnik davaoca.
 *
 * Čisto pravilo, bez Prisme (CLAUDE.md pravilo 9).
 */

export interface StipsCenaPijace {
  pijaca: string;
  /** Dominantna cena sa biltena, RSD po jedinici mere iz biltena. */
  cena: number;
}

export interface StipsIzracun {
  /** Prosek zaokružen po `zaokruziStipsCenu`. */
  cena: number;
  kategorija: string;
  jedinica: string;
  biltenId: string;
  biltenBroj: string;
  biltenUrl: string;
  datumObjave: Date;
  pijace: StipsCenaPijace[];
}

/** Granica od koje se zaokružuje na deset dinara. */
export const STIPS_GRANICA_DESETICE = 100;
/** Granica od koje se zaokružuje na sto dinara. */
export const STIPS_GRANICA_STOTINE = 1000;

/** Ispod 100 na ceo dinar, od 100 na deset, od 1.000 na sto dinara (kao u biltenu). */
export function zaokruziStipsCenu(prosek: number): number {
  const naDinar = Math.round(prosek);
  if (naDinar < STIPS_GRANICA_DESETICE) return naDinar;
  const naDeset = Math.round(prosek / 10) * 10;
  if (naDeset < STIPS_GRANICA_STOTINE) return naDeset;
  return Math.round(prosek / 100) * 100;
}

/** Prosek dominantnih cena, zaokružen po `zaokruziStipsCenu`; `null` kad nijedna pijaca nema cenu. */
export function prosekStips(cene: readonly number[]): number | null {
  const vazece = cene.filter((c) => Number.isFinite(c) && c > 0);
  if (vazece.length === 0) return null;
  const zbir = vazece.reduce((a, b) => a + b, 0);
  return zaokruziStipsCenu(zbir / vazece.length);
}
