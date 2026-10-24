import { permanentRedirect } from "next/navigation";

/**
 * `/doniraj` je bila stranica izbora „lično ili u ime firme“, a isti izbor već
 * pravi `/podrzi-kolo` — čovek je birao dvaput (revizija teksta, uloga 1,
 * 23.10.2026). Lično dugme sada vodi pravo na `/donacije`; adresa ostaje kao
 * preusmerenje, da stari linkovi iz mejlova i obaveštenja rade.
 */
export default function DonirajPage() {
  permanentRedirect("/podrzi-kolo");
}
