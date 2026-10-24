/**
 * Pseudonim kao adresa profila — jedino mesto koje sme da upisuje `pseudonim`
 * i `pseudonimLower` i da vodi računa o napuštenim imenima.
 *
 * Tri pravila koja se ovde sprovode:
 *  1. jedinstvenost ide bez obzira na veličinu slova (`Marko` i `marko` su isto ime);
 *  2. napušteno ime ne može da preuzme neko drugi — inače bi ranije podeljen link
 *     tiho vodio na DRUGU osobu;
 *  3. stari link ostaje živ — napušteno ime i dalje pokazuje na istog čoveka.
 */

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { kljucPseudonima } from "@/lib/validacija";

/** Prisma klijent ili transakcija — helperi rade u oba konteksta. */
type Db = Prisma.TransactionClient | typeof prisma;

/** Zašto pseudonim nije slobodan (ili `null` ako jeste). */
export type Zauzece = "korisnik" | "istorija" | null;

/** Poruka za korisnika po razlogu zauzeća. */
export function porukaZauzeca(z: Exclude<Zauzece, null>): string {
  return z === "korisnik"
    ? "Pseudonim je zauzet."
    : "Pseudonim je neko ranije koristio, pa se ne može uzeti (stari linkovi vode na njega).";
}

/**
 * Da li je pseudonim slobodan — proverava i aktivne naloge i napuštena imena.
 * `osimUserId` izuzima sopstveni nalog (izmena, povratak na svoje staro ime).
 */
export async function proveriZauzece(
  pseudonim: string,
  osimUserId?: string,
  db: Db = prisma
): Promise<Zauzece> {
  const kljuc = kljucPseudonima(pseudonim);

  const korisnik = await db.user.findFirst({
    where: { pseudonimLower: kljuc, ...(osimUserId ? { id: { not: osimUserId } } : {}) },
    select: { id: true },
  });
  if (korisnik) return "korisnik";

  const stari = await db.pseudonimIstorija.findFirst({
    where: { pseudonimLower: kljuc, ...(osimUserId ? { userId: { not: osimUserId } } : {}) },
    select: { id: true },
  });
  if (stari) return "istorija";

  return null;
}

/**
 * Polja za upis pseudonima. Uvek koristiti ovo umesto ručnog `{ pseudonim }` —
 * `pseudonimLower` je nosilac jedinstvenosti i ne sme da se razmimoiđe.
 */
export function poljaPseudonima(pseudonim: string): {
  pseudonim: string;
  pseudonimLower: string;
} {
  const t = pseudonim.trim();
  return { pseudonim: t, pseudonimLower: kljucPseudonima(t) };
}

/**
 * Promena pseudonima: upiše novi i zabeleži stari kao napušten.
 *
 * Ako se korisnik vraća na sopstveno ranije ime, taj red se briše iz istorije —
 * ime opet postaje „aktuelno" i ne stoji dvaput.
 *
 * Poziva se UNUTAR transakcije zajedno sa ostalim izmenama nad nalogom.
 */
export async function promeniPseudonim(
  tx: Prisma.TransactionClient,
  userId: string,
  stari: string,
  novi: string,
  dodatno: Prisma.UserUpdateInput = {}
): Promise<void> {
  const polja = poljaPseudonima(novi);

  await tx.user.update({ where: { id: userId }, data: { ...polja, ...dodatno } });

  // Vraćanje na sopstveno staro ime — ono više nije napušteno.
  await tx.pseudonimIstorija.deleteMany({
    where: { userId, pseudonimLower: polja.pseudonimLower },
  });

  const stariKljuc = kljucPseudonima(stari);
  if (stariKljuc === polja.pseudonimLower) return; // promenjena samo veličina slova

  await tx.pseudonimIstorija.upsert({
    where: { pseudonimLower: stariKljuc },
    create: { userId, pseudonim: stari.trim(), pseudonimLower: stariKljuc },
    update: { userId, pseudonim: stari.trim(), promenjenAt: new Date() },
  });
}

/**
 * Razrešava ono što stoji u adresi `/profil/<...>` u interni id korisnika.
 *
 * Redosled: interni id → aktuelni pseudonim → napušteni pseudonim. Time i najstariji
 * podeljeni linkovi (id) i linkovi od pre preimenovanja i dalje otvaraju isti profil.
 */
export async function razresiKorisnikaIzAdrese(
  parametar: string,
  db: Db = prisma
): Promise<string | null> {
  const kljuc = kljucPseudonima(parametar);
  if (!kljuc) return null;

  const korisnik = await db.user.findFirst({
    where: { OR: [{ id: parametar }, { pseudonimLower: kljuc }] },
    select: { id: true },
  });
  if (korisnik) return korisnik.id;

  const stari = await db.pseudonimIstorija.findUnique({
    where: { pseudonimLower: kljuc },
    select: { userId: true },
  });
  return stari?.userId ?? null;
}

/**
 * Nalaženje korisnika po pseudonimu koji je čovek ukucao (primalac POEN-a, delegat,
 * osnivači Kruga…). Uvek bez obzira na veličinu slova — ko upiše `marko` misli na
 * `Marko`, a drugog `marko` ionako ne može biti.
 */
export function gdePseudonim(pseudonim: string): { pseudonimLower: string } {
  return { pseudonimLower: kljucPseudonima(pseudonim) };
}
