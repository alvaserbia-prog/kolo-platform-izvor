/**
 * Centralni dispečer admin upozorenja.
 * Šalje paralelno na Telegram i email (Resend).
 * NIKAD ne baca grešku — API poziv uvek prolazi čak i ako notifikacija ne uspe.
 *
 * Potrebne env varijable:
 *   TELEGRAM_BOT_TOKEN  — token Telegram bota (od @BotFather)
 *   TELEGRAM_CHAT_ID    — ID četa/kanala gde bot šalje poruke
 *   RESEND_API_KEY      — API ključ sa resend.com
 *   ADMIN_EMAIL         — email adresa admina (primalac)
 *   RESEND_FROM         — pošiljalac (npr. "KOLO <noreply@ekolo.rs>"), opcionalno
 */

async function posaljiTelegram(naslov: string, tekst: string): Promise<void> {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  if (!BOT_TOKEN || !CHAT_ID) return;

  const poruka = `🔔 *${naslov}*\n\n${tekst}`;

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: poruka,
        parse_mode: "Markdown",
      }),
    }
  );

  if (!res.ok) {
    const greskaTekst = await res.text().catch(() => "");
    console.error(`[adminAlert] Telegram HTTP ${res.status}: ${greskaTekst}`);
  }
}

async function posaljiEmail(naslov: string, tekst: string): Promise<void> {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const RESEND_FROM = process.env.RESEND_FROM ?? "KOLO <noreply@ekolo.rs>";
  if (!RESEND_KEY || !ADMIN_EMAIL) return;

  const redovi = tekst
    .split("\n")
    .map((r) => `<tr><td style="padding:4px 0;color:#374151;">${r}</td></tr>`)
    .join("");

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;font-size:18px;color:#111827;">${naslov}</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${redovi}
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
        KOLO Platforma — automatska poruka
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: ADMIN_EMAIL,
      subject: `[KOLO] ${naslov}`,
      html,
    }),
  });

  if (!res.ok) {
    const greskaTekst = await res.text().catch(() => "");
    console.error(`[adminAlert] Resend HTTP ${res.status}: ${greskaTekst}`);
  }
}

/**
 * Pošalji admin upozorenje paralelno na Telegram i email.
 * Pozivaj kao `void posaljiAdminAlert(...)` da ne blokiraš odgovor API rute.
 *
 * @param naslov - Naslov događaja (npr. "Nova verifikacija")
 * @param tekst  - Telo poruke, redovi odvojeni \n
 */
/** Oznaka okruženja iz kog je alert poslat — da se test ne meša sa produkcijom. */
function okruzenjeTag(): string {
  switch (process.env.VERCEL_ENV) {
    case "production":
      return "[PROD]";
    case "preview":
      return "[TEST]";
    default:
      return "[DEV]";
  }
}

export async function posaljiAdminAlert(
  naslov: string,
  tekst: string
): Promise<void> {
  const naslovTag = `${okruzenjeTag()} ${naslov}`;
  try {
    await Promise.all([
      posaljiTelegram(naslovTag, tekst).catch((err) =>
        console.error("[adminAlert] Telegram greška:", err)
      ),
      posaljiEmail(naslovTag, tekst).catch((err) =>
        console.error("[adminAlert] Email greška:", err)
      ),
    ]);
  } catch (err) {
    console.error("[adminAlert] Neočekivana greška:", err);
  }
}
