import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import {
  dohvatiNestpayConfig,
  verifikujOdgovor,
  uspesnoPlacanje,
} from "@/lib/placanje/nestpay";

/**
 * Povratna (callback) tačka na koju NestPay (Banca Intesa / OTP) POST-uje
 * rezultat 3D Secure plaćanja. Ovo je cross-site POST iz domena banke — sesija
 * korisnika ovde NIJE dostupna, pa se identitet utvrđuje preko `oid` → zapis
 * donacije, a autentičnost poruke preko verifikacije HASH-a (tajni store key).
 *
 * Tok: verifikuj HASH → nađi zapis po oid → proveri iznos → (idempotentno)
 * prevedi zapis u NAPLACENO → preusmeri korisnika na stranicu rezultata.
 *
 * 🔴 POEN SE OVDE NE EVIDENTIRA (R-01, mera M-4a). Detekcija je automatska,
 * potvrda je ljudska: zapis čeka u admin tabu dok čovek ne uporedi uplatioca sa
 * nalogom i ne potvrdi ga kroz `POST /api/admin/donacija`. Do te izmene je
 * callback banke zvao `evidentirajDonaciju` odmah, pa između uplate i upisa
 * POEN-a nije bilo nijedne ljudske odluke — a to je tačno ono što se čita kao
 * pribavljanje digitalne imovine uz naknadu, u realnom vremenu, po objavljenoj
 * tabeli. Ne vraćati automatsko evidentiranje: to je projektantska odluka uz
 * R-01, ne privremeno rešenje.
 */
export async function POST(req: NextRequest) {
  const base =
    process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const rezultat = (ishod: "uspeh" | "neuspeh" | "greska") =>
    NextResponse.redirect(`${base.replace(/\/$/, "")}/donacije?placanje=${ishod}`, 303);

  let params: Record<string, string> = {};
  try {
    const form = await req.formData();
    for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : "";
  } catch {
    return rezultat("greska");
  }

  const oid = params["oid"] ?? params["ReturnOid"] ?? "";
  if (!oid) return rezultat("greska");

  const zapis = await prisma.donationRecord.findUnique({
    where: { oid },
    select: { id: true, userId: true, amountRSD: true, status: true, provajder: true, javno: true },
  });
  if (!zapis) return rezultat("greska");

  // Verifikacija potpisa odgovora ključem TAČNO onog provajdera kojim je zapis kreiran.
  const cfg = dohvatiNestpayConfig(zapis.provajder ?? undefined);
  if (!cfg || !verifikujOdgovor(params, cfg.storeKey)) {
    return rezultat("greska");
  }

  // Idempotencija: naplaćen ili već potvrđen zapis se ne dira ponovo.
  if (zapis.status === "NAPLACENO" || zapis.status === "CONFIRMED") {
    return rezultat("uspeh");
  }

  if (!uspesnoPlacanje(params)) {
    await prisma.donationRecord.update({
      where: { id: zapis.id },
      data: { bankRef: `NEUSPEH:${params["ProcReturnCode"] ?? params["Response"] ?? "?"}` },
    });
    return rezultat("neuspeh");
  }

  // Iznos iz odgovora mora da se poklapa sa iznosom iz zapisa (anti-tampering).
  const vraceniIznos = Math.round(Number(params["amount"]));
  const ocekivaniIznos = Math.round(Number(zapis.amountRSD));
  if (!Number.isFinite(vraceniIznos) || vraceniIznos !== ocekivaniIznos) {
    await prisma.donationRecord.update({
      where: { id: zapis.id },
      data: { bankRef: "NEUSPEH:IZNOS_NE_ODGOVARA" },
    });
    return rezultat("greska");
  }

  // ATOMSKA IDEMPOTENCIJA: preuzmi zapis iz PENDING u NAPLACENO jednim uslovnim
  // upitom. Banke znaju da pošalju callback više puta (mrežni retry); samo jedan
  // poziv može da preuzme zapis — ostali otpadaju (count !== 1).
  const preuzeto = await prisma.donationRecord.updateMany({
    where: { id: zapis.id, status: "PENDING" },
    data: {
      status: "NAPLACENO",
      bankRef: params["AuthCode"] || params["TransId"] || "OK",
    },
  });
  if (preuzeto.count !== 1) {
    // Drugi (paralelni) callback je već preuzeo ovaj zapis.
    return rezultat("uspeh");
  }

  // Bez ovog javljanja zapis bi čekao u admin tabu a niko ne bi znao da čeka —
  // ista greška koja je jednom već napravljena kod prvih oglasa (čl. 40a).
  void posaljiAdminAlert(
    "Kartična donacija naplaćena — čeka potvrdu",
    `Iznos: ${ocekivaniIznos.toLocaleString("sr-RS")} RSD\nZapis: ${zapis.id}\n` +
      "POEN nije evidentiran. Uporedite uplatioca sa nalogom i potvrdite u admin tabu Donacije."
  );

  return rezultat("uspeh");
}
