import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Keširan (po jednom HTTP zahtevu) omotač oko `getServerSession`.
 *
 * React `cache()` memoizuje rezultat u okviru jednog request-a: ako i layout i
 * stranica (i svaka serverska komponenta) pozovu `sesija()`, NextAuth dekodira
 * JWT i izvrši `jwt`/`session` callback-e SAMO JEDNOM, umesto svaki put. Ranije
 * je `getServerSession(authOptions)` pozivan nezavisno u root layout-u, (app)
 * layout-u i stranici — tri puta po renderu, a svaki je (pre throttle-a u
 * auth.ts) radio DB poziv. Gde god je moguće koristiti `sesija()` umesto da se
 * `getServerSession(authOptions)` zove direktno.
 */
export const sesija = cache(() => getServerSession(authOptions));
