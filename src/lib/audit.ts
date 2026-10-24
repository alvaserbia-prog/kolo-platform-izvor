import { prisma } from "@/lib/prisma";

/**
 * Upis u audit log privilegovanih akcija (admin/UO, nosioci ZRNA u službenoj
 * ulozi po čl. 36, GDPR pristupi sa table jemstva).
 *
 * Konvencije:
 *  - `akcija`: SCREAMING_SNAKE, srpski trpni oblik (npr. KORISNIK_SUSPENDOVAN).
 *  - `targetId`: objekat akcije — ID korisnika kad akcija pogađa korisnika,
 *    inače ID entiteta (oglas, trošak, predlog...).
 *  - `detalji`: pseudonimi i poslovni podaci su OK; NIKAD lični kontakt
 *    podaci (email, telefon) ni drugi identifikujući podaci.
 *  - Poziva se tek POSLE uspešne izmene, van `prisma.$transaction()`.
 *  - Greška upisa se guta (samo console.error) — audit ne sme da obori akciju.
 */
export async function logAdminAkcija(adminId: string, akcija: string, targetId?: string, detalji?: string) {
  try {
    await prisma.auditLog.create({ data: { adminId, akcija, targetId, detalji } });
  } catch (err) {
    console.error("[AuditLog] Greška pri logovanju:", err);
  }
}
