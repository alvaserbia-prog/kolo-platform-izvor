import { prisma } from "@/lib/prisma";
import { brojNaPregledu } from "@/lib/protokol/kutija-zelja";

/**
 * Šta u admin panelu čeka radnju operative — jedan izvor za žuti krug sa brojem.
 *
 * Isti račun čitaju i sidebar (`chrome-podaci.ts`, zbir uz „Admin") i sam panel
 * (broj uz odeljak, tab i pod-tab), pa se zbir u sidebaru uvek slaže sa onim što
 * se u panelu vidi: kad sidebar svetli, u panelu postoji tab koji svetli. Broj koji
 * vodi nigde uči ljude da ga ignorišu (zato i Potvrde namerno nemaju broj: zabeležena
 * potvrda ne traži radnju administratora, razrešava se sama).
 *
 * Broji se samo ono što traži radnju Fondacije, nikad ono što čeka drugu stranu
 * (npr. prijava pokroviteljstva koja čeka potpis zastupnika, ugovor koji čeka potpis).
 */
export interface CekanjePokrovitelja {
  /** Upis u evidenciju pokrovitelja čeka poređenje sa registrom (donacije čl. 16 i 18). */
  upisi: number;
  /** Zatražena izmena upisa (naziv, MB, logotip) čeka pregled. */
  izmene: number;
  /** Potpisana prijava novčanog pokroviteljstva čeka potvrdu uplate. */
  prijave: number;
  /** Prijava pokroviteljstva dobrima i uslugama čeka pregled (donacije čl. 29 st. 2). */
  dobra: number;
}

export interface CekanjeAdmina {
  donacije: number;
  programi: number;
  ped: number;
  pokrovitelji: number;
  pokroviteljiPo: CekanjePokrovitelja;
  prigovori: number;
  pijaca: number;
  "prvi-oglasi": number;
  razmene: number;
  gazdinstva: number;
  /** Nabavka sa utvrđenim redom čeka da se zabeleži plaćanje dobavljaču (nabavke čl. 23). */
  nabavke: number;
  "kutija-zelja": number;
  /** Samo superadmin (tab Provere). */
  nadzor: number;
  /** Samo superadmin (tab Odluke): otvoreni nadzorni predmeti i prijave lažnog roditeljstva. */
  odluke: number;
}

export async function brojeviCekanjaAdmina(jeSuperadmin: boolean): Promise<CekanjeAdmina> {
  const [
    donacije, programi, oglasPrijave, oglasEvidencije,
    upisi, izmene, prijave, dobra,
    prigovori, pijaca, prviOglasi, razmene,
    gazdinstvaPrijave, gazdinstvaPristupanja, nabavke, zelje,
    nadzor, predmeti, prijaveRoditeljstva,
  ] = await Promise.all([
    // NAPLACENO (kartica prošla, POEN čeka ljudsku potvrdu) je isti red čekanja (M-4a).
    prisma.donationRecord.count({ where: { status: { in: ["PENDING", "NAPLACENO"] } } }),
    prisma.programEnrollment.count({ where: { status: "PENDING" } }),
    prisma.oglasPrijava.count({ where: { status: "PENDING" } }),
    prisma.oglasEvidencija.count({ where: { status: "PENDING" } }),
    prisma.upisPokrovitelja.count({ where: { status: "NA_PROVERI", obrisanAt: null } }),
    prisma.upisPokrovitelja.count({ where: { izmenaPodnetaAt: { not: null }, obrisanAt: null } }),
    prisma.pokroviteljPrijava.count({ where: { status: "POTPISANA" } }),
    prisma.ugovorDobra.count({ where: { status: "NA_PREGLEDU" } }),
    prisma.prigovorNaOdluku.count({ where: { status: { in: ["PENDING", "U_OBRADI"] } } }),
    // Prijavljeni oglasi na Pijaci — red čekanja za moderaciju (Uslovi čl. 29).
    prisma.prijavaOglasa.count({ where: { status: "OTVORENA" } }),
    // Prvi oglasi naloga bez potvrde — čekaju odobrenje doprinosa (Pravilnik čl. 38).
    prisma.doprinosSadrzaju.count({ where: { status: "ZABELEZEN" } }),
    // Prijave neispunjene razmene — čekaju odluku o poništenju prepisa.
    prisma.prijavaRazmene.count({ where: { status: "OTVORENA" } }),
    // Gazdinstva — prijave i kasnija pristupanja (Pravilnik o gazdinstvima čl. 7 i 9 st. 4).
    prisma.gazdinstvo.count({ where: { status: "NA_PREGLEDU" } }),
    prisma.clanGazdinstva.count({ where: { status: "PRISTUPIO", gazdinstvo: { status: "ODOBRENO" } } }),
    // Ostale faze nabavke ne čekaju Fondaciju: prijave zatvara i pozive vrti noćni
    // posao, a preuzimanje pokreće član koji dođe sa kodom.
    prisma.nabavka.count({ where: { status: "RED_UTVRDJEN" } }),
    brojNaPregledu(),
    jeSuperadmin ? prisma.rizikNalaz.count({ where: { status: "OTVOREN" } }) : Promise.resolve(0),
    jeSuperadmin ? prisma.nadzorniPredmet.count({ where: { status: "OTVOREN" } }) : Promise.resolve(0),
    // Prijava lažnog roditeljstva (deca čl. 17) — odlučuje se u tabu Odluke.
    jeSuperadmin ? prisma.prijavaRoditeljstva.count({ where: { status: "OTVORENA" } }) : Promise.resolve(0),
  ]);

  const pokroviteljiPo = { upisi, izmene, prijave, dobra };
  return {
    donacije,
    programi,
    ped: oglasPrijave + oglasEvidencije,
    pokrovitelji: upisi + izmene + prijave + dobra,
    pokroviteljiPo,
    prigovori,
    pijaca,
    "prvi-oglasi": prviOglasi,
    razmene,
    gazdinstva: gazdinstvaPrijave + gazdinstvaPristupanja,
    nabavke,
    "kutija-zelja": zelje,
    nadzor,
    odluke: predmeti + prijaveRoditeljstva,
  };
}

/** Zbir za žuti krug uz „Admin" u sidebaru — isti brojevi kao u panelu. */
export function zbirCekanja(c: CekanjeAdmina): number {
  const { pokroviteljiPo: _po, ...poTabu } = c;
  void _po;
  return Object.values(poTabu).reduce((z, n) => z + n, 0);
}
