import { permanentRedirect } from "next/navigation";

/**
 * Stara adresa. Od 22.10.2026 je ovo poglavlje „Kako radi" jedne stranice
 * `/kako-funkcionise` (odluka vlasnika: pet stranica koje su objašnjavale isti
 * sistem postale su jedna celina). Adresa ostaje zbog linkova iz mejlova,
 * obaveštenja, akata i sa mreža (CLAUDE.md pravilo 12).
 */
export default function Preusmerenje() {
  permanentRedirect("/kako-funkcionise#kako-radi");
}
