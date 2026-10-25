// GET /api/cron/nocna-emisija/zima — drugi termin noćnog obračuna (23:00 UTC).
// Isti posao kao /api/cron/nocna-emisija; zaseban put jer Vercel svaki cron
// pokreće jednom dnevno. Koji termin radi odlučuje `jePonocUSrbiji`.
export { GET } from "../route";
