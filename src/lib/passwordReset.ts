import { randomBytes, createHash } from "crypto";
import { prevedi } from "./prevod-servera";
import { prisma } from "@/lib/prisma";
import { posaljiAdminAlert } from "@/lib/adminAlert";
import { bazniUrl, emailLayout, posaljiEmailRaw } from "@/lib/email";

const TOKEN_BYTES = 32;
const EXPIRY_HOURS = 1;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function kreirajResetToken(userId: string): Promise<string> {
  // Poništi sve aktivne tokene za korisnika
  await prisma.passwordResetToken.updateMany({
    where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return token;
}

export async function posaljiResetEmail(
  email: string,
  token: string,
  pseudonim: string,
  imaLozinku: boolean,
  requestOrigin?: string,
  /**
   * Jezik naloga (`User.jezik`). Ovaj mejl ide čoveku koji NE MOŽE da se prijavi —
   * ako ga ne razume, nalog mu je nepovratan. Zato jedini sistemski mejl koji
   * ne poštuje opt-out ide i na jeziku korisnika (odluka #7 u planu za ruski).
   */
  jezik?: string | null,
): Promise<void> {
  const link = `${bazniUrl(requestOrigin)}/reset-lozinka/${token}`;
  const t = (k: string) => prevedi(jezik, `mejl.${k}`);
  const v = (a: string, b: string) => t(imaLozinku ? a : b);

  const naslov = v("lozinka_reset_naslov", "lozinka_postavi_naslov");
  const subject = v("lozinka_reset_subject", "lozinka_postavi_subject");
  const dugme = v("lozinka_reset_dugme", "lozinka_postavi_dugme");
  const uvod = v("lozinka_reset_uvod", "lozinka_postavi_uvod");
  const pozivNaAkciju = v("lozinka_reset_akcija", "lozinka_postavi_akcija");

  // Sistemski mejl — NE poštuje `emailObavestenja` opt-out (bez njega korisnik
  // ne može da povrati pristup nalogu) i nema link za odjavu u podnožju.
  const html = emailLayout({
    naslov,
    pozdrav: pseudonim,
    telo: [
      `${uvod} ${t("lozinka_ignorisi")}`,
      `${pozivNaAkciju} ${t("lozinka_vazenje")}`,
    ],
    dugme: { tekst: dugme, link },
    jezik,
  });

  const poslat = await posaljiEmailRaw(email, subject, html, "passwordReset");

  if (!poslat) {
    void posaljiAdminAlert(
      "Reset lozinke — Resend greška",
      `Email: ${email}\nTip: ${imaLozinku ? "reset" : "postavljanje"}\nDetalji u logu funkcije.`
    );
    throw new Error("Email nije poslat");
  }

  // Uspešno poslat — admin alert za debugging
  void posaljiAdminAlert(
    "Reset lozinke — email poslat",
    `Za: ${email}\nTip: ${imaLozinku ? "reset" : "postavljanje"}\nLink važi 1h.`
  );
}

export async function verifikujResetToken(token: string): Promise<{ userId: string; tokenId: string } | null> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!record) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;
  return { userId: record.userId, tokenId: record.id };
}

