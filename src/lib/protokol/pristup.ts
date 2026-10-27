import { ucitajStatus, jeVerifikovan } from "./status";

/**
 * Funkcionalni pristup (set 4.8.2): operativni doprinos i programi podrške traže
 * VERIFIKOVANOG učesnika — člana bez potvrde, člana Kola, čuvara Kola ili osnivača
 * (Pravilnik o programima podrške čl. 4 st. 1; Pravilnik o operativnom doprinosu
 * čl. 9).
 *
 * 🔴 Imunitet nosioca ZRNA je ukinut setom 4.8.2: status se izvodi iz grafa
 * (`preracunajStatusNaloga`), pa ko nije verifikovan, korisnik je — i bez ovog
 * pristupa, bez obzira na ZRNO. Dete ovde ne prolazi (za maloletnog važi dete
 * Kola preko roditelja, raniji programi čl. 13, i to proverava sama ruta; programi 5.0 čl. 2 st. 3: maloletni nema pravo na programe).
 */
export async function imaFunkcionalniPristup(userId: string): Promise<boolean> {
  const s = await ucitajStatus(userId);
  return s !== null && jeVerifikovan(s);
}
