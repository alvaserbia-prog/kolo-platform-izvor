import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { zatvoriIstekleIObjaviIshod } from "@/lib/protokol/glasanje";

/**
 * GET /api/cron/glasanje-zatvaranje
 *
 * Zatvara glasanja kojima je istekao rok i objavljuje ishod (Pravilnik o Gornjem
 * Kolu čl. 11 i 13).
 *
 * 🔴 Zašto cron: do ovoga se `zatvoriIstekleIObjaviIshod` zvao ISKLJUČIVO lenjo —
 * iz `GET /api/glasanje`, `GET /api/glasanje/[id]` i sa stranice `/zrno`. Ako posle
 * isteka roka niko ne otvori nijedan od ta tri ekrana, predlog ostaje `ACTIVE`,
 * ishod se ne objavljuje i izvršenje ne može da počne. Čl. 11 kaže „zatvara se
 * automatski" — a u kodu se zatvaralo kad neko naiđe.
 *
 * Ishod se time ne menja: glas nosi glasačku moć zapamćenu u trenutku davanja
 * (`GlasanjeGlas.glasackaGlasova`), pa kašnjenje nije moglo da pomeri rezultat —
 * moglo je samo da ga zadrži. Kod odluka o trošenju dinarskih sredstava (čl. 51a
 * Pravilnika o KOLO sistemu) to zadržavanje blokira ceo postupak nabavke.
 *
 * Lenji pozivi se NE uklanjaju — bezbedni su (idempotentni) i drže ekran tačnim
 * između dva ciklusa crona.
 */
export async function GET(req: NextRequest) {
  // Podrška za oba načina: Vercel Cron (Authorization: Bearer) i manuelni poziv (x-cron-secret)
  const authHeader = req.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const secret = bearerSecret ?? req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return await greska("Neautorizovano.", 401);
  }

  await zatvoriIstekleIObjaviIshod();

  return NextResponse.json({ ok: true });
}
