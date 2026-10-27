import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jeAdmin } from "@/lib/dozvole";

/**
 * POST /api/admin/pokrovitelji/[id]/doprinos — ZATVORENO (set 5.0).
 *
 * Do seta 5.0 je administrator ovde ručno upisivao novčani doprinos pokrovitelja,
 * bez prijave i bez ugovora, a POEN je išao korisniku upisanom kao vlasnik
 * pokrovitelja. Donacije 5.0: novčano pokroviteljstvo pokreće korisnik prijavom iz
 * odobrenog upisa (čl. 19 st. 1), ugovor se zaključuje na Platformi (čl. 20 st. 1), a
 * POEN se po potvrdi prijema evidentira u zapisu PODNOSIOCA PRIJAVE (čl. 20 st. 3,
 * čl. 23 st. 2) — nikad vlasniku upisa. Jedini put je Admin → Pokrovitelji →
 * Prijave (`potvrdiPrijavu`). 🔴 Ne vraćati ručni upis: zaobilazio bi prijavu,
 * ugovor i evidenciju identiteta. Brana: `pokrovitelj-rucni-upis-izvor.test.ts`.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !jeAdmin(session.user)) {
    return await greska("Nemate pristup.", 403);
  }
  return await greska(
    "Ručni upis doprinosa pokrovitelja je ukinut. Novčano pokroviteljstvo se evidentira samo po prijavi i potvrdi prijema (Pravilnik o pokroviteljstvu i donacijama čl. 19–20), a POEN dobija podnosilac prijave.",
    410,
  );
}
