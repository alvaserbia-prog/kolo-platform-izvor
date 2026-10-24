/**
 * /tabla-jemstva — stara adresa ukinute table zahteva za jemstvo (Pravilnik 4.1.1
 * čl. 32 st. 4). Adresa se ne gasi, jer postoje stari linkovi u notifikacijama i
 * mejlovima, ali od 22.10.2026 (odluka vlasnika) vodi pravo na Potvrde, gde je
 * današnji put u Kolo — ranije je ovde stajao ekran sa objašnjenjem.
 */
import { redirect } from "next/navigation";

export default function TablaJemstvaUkinutaPage() {
  redirect("/verifikacija");
}
