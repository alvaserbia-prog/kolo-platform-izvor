import { redirect } from "next/navigation";

/**
 * Stara adresa ekrana izjašnjenja o postojanju deteta (postupak od 60 dana, ukinut
 * setom 4.8.2). Zahtevi za potvrdu postojanja deteta sada stoje na stranici Potvrde
 * (Pravilnik o učešću dece čl. 6 st. 3). Adresa ostaje zbog starih linkova iz
 * obaveštenja i mejlova (CLAUDE.md pravilo 12).
 */
export default function PotvrdePage() {
  redirect("/verifikacija#postojanje-deteta");
}
