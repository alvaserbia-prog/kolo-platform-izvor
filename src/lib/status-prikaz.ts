/**
 * Podaci za karticu statusa (`OznakaStatusa`, set 4.8.2) — serverski ulaz ekrana.
 *
 * Status se ne izvodi ovde: dolazi iz jezgra (`ucitajStatus` u `protokol/status.ts`,
 * koje za dete čita stanje iz `deca.ts`). Ovde se dodaje samo ono što kartica
 * pored statusa kaže:
 *
 *  - za dete — na šta se čeka (deca čl. 4c poslednji stav), kroz servisnu
 *    funkciju `naStaCekaNalog` iz `protokol/deca.ts` (isti sastojci kao stanje deteta);
 *  - za korisnika sa ZRNOM — da mu je ZRNO zamrznuto (Pravilnik čl. 30 st. 3;
 *    dokaz stvarnosti čl. 4 st. 4);
 *  - za člana bez potvrde sa ZRNOM — da ga ne aktivira (Pravilnik čl. 28a).
 */
import { prisma } from "@/lib/prisma";
import { ucitajStatus, type StatusUcesnika } from "@/lib/protokol/status";
import { naStaCekaNalog } from "@/lib/protokol/deca";
import type { NaStaSeCeka } from "@/lib/deca-pravila";
import type { ZrnoPolozaj } from "@/components/OznakaStatusa";

export type PrikazStatusa = {
  status: StatusUcesnika;
  naStaSeCeka: NaStaSeCeka | null;
  zrno: ZrnoPolozaj;
};

export async function prikazStatusa(userId: string): Promise<PrikazStatusa | null> {
  const status = await ucitajStatus(userId);
  if (!status) return null;

  if (status.startsWith("DETE_")) {
    // Status deteta je merodavan iz jezgra; „na šta se čeka" samo ga objašnjava,
    // pa dete Kola nikad ne dobija razlog čekanja.
    const ceka = status === "DETE_KOLA" ? null : await naStaCekaNalog(userId);
    return { status, naStaSeCeka: ceka, zrno: null };
  }

  let zrno: ZrnoPolozaj = null;
  if (status === "KORISNIK" || status === "CLAN_BEZ_POTVRDE") {
    const z = await prisma.zrnoStanje.findUnique({ where: { userId }, select: { slobodno: true, aktivno: true } });
    if ((z?.slobodno ?? 0) + (z?.aktivno ?? 0) > 0) {
      zrno = status === "KORISNIK" ? "ZAMRZNUTO" : "BEZ_POTVRDE";
    }
  }
  return { status, naStaSeCeka: null, zrno };
}
