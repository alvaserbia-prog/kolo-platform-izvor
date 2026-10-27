/**
 * Preporuka člana — čista pravila (dokaz stvarnosti čl. 20, set 4.8.0; odluka vlasnika
 * 20.10.2026). Bez Prisme; servis `protokol/preporuka.ts` ih re-eksportuje.
 *
 * 🔴 Preporuka NE daje ništa: ni POEN, ni pristup, ni prednost oglasu, i ne ulazi u
 * lanac potvrda. Ako bi ijedno od toga počelo da zavisi od broja preporuka, postala
 * bi druga potvrda bez odgovornosti (i nov kanal emisije, za koji Pravilnik čl. 19 nema osnov).
 * 🔴 „Ne verujem" ne postoji — ni javno ni kao prijava (odluka vlasnika).
 * 🔴 Drugima se prikazuje samo BROJ; ko je koga preporučio ne vidi niko osim onoga
 * ko je preporuku dao (Politika čl. 18).
 */

export type UcesnikPreporuke = {
  id: string;
  maloletan: boolean;
  /** Nalog je aktivan (status ACTIVE, bez `deaktiviranAt`). */
  aktivan: boolean;
  /**
   * Član Kola, čuvar Kola ili osnivač (set 4.8.2). Preporuku daje samo takav
   * učesnik; član bez potvrde i korisnik je ne daju (dokaz stvarnosti čl. 20 st. 1;
   * čl. 6 st. 2 t. 3). Za onoga ko prima nije uslov.
   */
  potvrdjen: boolean;
};

export type OdlukaPreporuke = { ok: true } | { ok: false; razlog: string };

/**
 * Sme li `od` da preporuči `za` (dokaz stvarnosti čl. 20 st. 1). Da li je posmatraču profil
 * dostupan odlučuje kapija profila (`smeProsireno`, `pristupProfiluDeteta`), ne ovo.
 *
 * Daje: punoletni član Kola, odnosno osnivač. Prima: punoletan učesnik.
 */
export function smePreporuciti(od: UcesnikPreporuke, za: UcesnikPreporuke): OdlukaPreporuke {
  if (od.id === za.id) return { ok: false, razlog: "Ne možeš da preporučiš sebe." };
  if (od.maloletan) return { ok: false, razlog: "Dete ne daje preporuke." };
  if (!od.potvrdjen) return { ok: false, razlog: "Preporuku daje član Kola." };
  if (za.maloletan) return { ok: false, razlog: "Preporučuje se samo punoletan član." };
  if (!od.aktivan || !za.aktivan) return { ok: false, razlog: "Nalog nije aktivan." };
  return { ok: true };
}
