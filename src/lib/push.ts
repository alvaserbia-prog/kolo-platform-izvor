import { after } from "next/server";
import webpush from "web-push";
import { prisma } from "./prisma";

/**
 * Web Push slanje (browser Push API + VAPID).
 *
 * Potrebne env varijable (Vercel, sva okruženja):
 *   VAPID_PUBLIC_KEY          — javni VAPID ključ (isti kao NEXT_PUBLIC_VAPID_PUBLIC_KEY)
 *   VAPID_PRIVATE_KEY         — privatni VAPID ključ (TAJNA, samo server)
 *   VAPID_SUBJECT             — "mailto:..." kontakt (opciono, default ispod)
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY — javni ključ izložen klijentu (za pretplatu)
 *
 * Bez ključeva funkcija tiho prolazi (no-op) — kao adminAlert, NIKAD ne baca,
 * da slanje notifikacije/poruke ne padne ako push nije konfigurisan.
 */

export interface PushPayload {
  naslov: string;
  tekst: string;
  link?: string;
  tip?: string;
}

let konfigurisan = false;

function konfigurisi(): boolean {
  if (konfigurisan) return true;
  const pub = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:podrska@ekolo.rs";
  webpush.setVapidDetails(subject, pub, priv);
  konfigurisan = true;
  return true;
}

/** Da li je push uopšte konfigurisan na ovom okruženju (za izlaganje statusa). */
export function pushKonfigurisan(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  return Boolean(pub && process.env.VAPID_PRIVATE_KEY);
}

/**
 * Zakaži slanje push obaveštenja POSLE što API odgovor ode klijentu.
 *
 * 🔴 Na Vercel serverless-u je „pošalji i zaboravi" (`void posaljiPush(...)`)
 * nepouzdano: čim se `NextResponse` vrati, funkcija sme da se zamrzne ili ugasi
 * pre nego što `webpush.sendNotification()` završi mrežni poziv ka push servisu
 * (FCM/Apple) — otud „push nekad ne stigne". `after()` drži funkciju živom dok
 * se posao ne završi, bez blokiranja odgovora.
 *
 * Van request scope-a (skripte, cron van route-handlera) `after` baca — tada
 * fallback na staro ponašanje.
 */
export function zakaziPush(userId: string, payload: PushPayload): void {
  try {
    after(() => posaljiPush(userId, payload));
  } catch {
    void posaljiPush(userId, payload);
  }
}

/**
 * Pošalji push obaveštenje na SVE uređaje korisnika.
 * Iz route handlera preferiraj `zakaziPush(...)` (vidi iznad); ovu funkciju
 * zovi direktno samo kad push već awaituješ (npr. u skripti).
 * Mrtve pretplate (404/410) se automatski brišu iz baze.
 */
export async function posaljiPush(userId: string, payload: PushPayload): Promise<void> {
  try {
    if (!konfigurisi()) return;

    const pretplate = await prisma.pushPretplata.findMany({ where: { userId } });
    if (pretplate.length === 0) return;

    const body = JSON.stringify({
      naslov: payload.naslov,
      tekst: payload.tekst,
      link: payload.link ?? "/pocetna",
      tip: payload.tip ?? "info",
    });

    await Promise.all(
      pretplate.map(async (p) => {
        try {
          await webpush.sendNotification(
            { endpoint: p.endpoint, keys: { p256dh: p.p256dh, auth: p.auth } },
            body,
          );
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          // 404/410 = pretplata više ne postoji (korisnik odjavio push / promenio browser).
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushPretplata.delete({ where: { id: p.id } }).catch(() => {});
          } else {
            console.error(`[push] HTTP ${statusCode ?? "?"}:`, (err as { body?: string })?.body ?? err);
          }
        }
      }),
    );
  } catch (err) {
    console.error("[push] Neočekivana greška:", err);
  }
}
