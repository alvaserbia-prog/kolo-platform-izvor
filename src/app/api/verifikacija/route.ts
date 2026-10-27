/**
 * POST /api/verifikacija
 *
 * Verifikator izvršava verifikaciju koristeći kod osobe (dokaz stvarnosti čl. 4, 5, 15).
 * Body: { token: string, potvrdaPoznavanja: boolean, oznaka?: string, nacin?: "LICNO" | "TELEFONOM" }
 *   - token: 64-char hex (iz QR-a) ili 6-cifren broj
 *   - potvrdaPoznavanja: mora biti true (lično poznavanje + odgovornost, čl. 15 st. 3, 6)
 *   - nacin: kad je osoba na spisku za poziv — „Znam ga lično" ili „Upoznali smo
 *     se telefonom" (uvođenje u Kolo)
 *
 * Ishod (`vrsta`): POTVRDA (član Kola) · UVODJENJE (član bez potvrde) ·
 * POTVRDA_CLANA (član bez potvrde je potvrđen; bez POEN-a; potvrđeni dobija spisak
 * povezanih, čl. 17 — automatske potvrde lanca nema od seta 4.8.3). Kod verifikacije se POEN beleži za oba (upis čeka prvi doprinos).
 * Dnevni tempo (dokaz stvarnosti čl. 21): uz 3. i 4. potvrdu u danu vraća
 * `upozorenjeDnevno`; peta se odbija sa 429.
 */
import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  izvrsiVerifikaciju,
  VerifikacijaGreska,
} from "@/lib/protokol/verifikacija-service";
import { obavesti } from "@/lib/notifikacije";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return await greska("Nisi prijavljen.", 401);
  }

  // Anti brute-force 6-cifrenog koda: najviše 10 pokušaja u minuti po verifikatoru.
  const rl = rateLimit(`verifikacija:${session.user.id}`, 10, 60_000);
  if (!rl.ok) {
    return await greska(`Previše pokušaja. Sačekaj ${rl.retryAfterSec}s.`, 429);
  }

  let body: { token?: string; potvrdaPoznavanja?: boolean; oznaka?: string; nacin?: string };
  try {
    body = await req.json();
  } catch {
    return await greska("Nevažeći JSON.", 400);
  }

  const tokenIliBroj = typeof body.token === "string" ? body.token : "";
  const potvrdaPoznavanja = body.potvrdaPoznavanja === true;
  const oznaka = typeof body.oznaka === "string" ? body.oznaka : undefined;
  const nacin = body.nacin === "TELEFONOM" ? "TELEFONOM" : body.nacin === "LICNO" ? "LICNO" : undefined;

  try {
    const rez = await izvrsiVerifikaciju({
      verifikatorId: session.user.id,
      tokenIliBroj,
      potvrdaPoznavanja,
      oznaka,
      nacin,
    });

    // Obavesti verifikovanog (zvonce + push + email), sa pozivom na prijavu ako ne
    // poznaje verifikatora (čl. 5 st. 5). Tekst zavisi od ishoda; posledice promene
    // statusa servis izvršava bez sopstvenog obaveštenja, pa stiže samo ovo. Ne
    // blokira odgovor.
    const parametri = { verifikator: rez.verifikatorPseudonim };
    const obavestenje =
      rez.vrsta === "POTVRDA"
        ? {
            kljuc: "notifikacije.potvrda_clan_kola",
            naslov: "Postao si član Kola",
            tekst:
              `„${rez.verifikatorPseudonim}" te je potvrdio, pa si sada član Kola. ` +
              `Možeš da potvrđuješ ljude koje lično znaš. Pripadnost Kolu nije članstvo u Fondaciji. ` +
              `Ako ne poznaješ ovu osobu, prijavi to na stranici Potvrde.`,
          }
        : rez.vrsta === "UVODJENJE"
          ? {
              kljuc: "notifikacije.uvodjenje_u_kolo",
              naslov: "Uveden si u Kolo",
              tekst:
                `„${rez.verifikatorPseudonim}" te je uveo u Kolo, pa si sada član bez potvrde. ` +
                `Kao član bez potvrde ne možeš da potvrđuješ druge ni da glasaš. Ništa se ne plaća. ` +
                `Onaj ko te uvede u Kolo ne dobija ništa dok ti sam ne doprineseš. ` +
                `Pripadnost Kolu nije članstvo u Fondaciji. ` +
                `Član Kola koji te lično zna može da te potvrdi — pokaži mu svoj kod. ` +
                `Ako ne poznaješ ovu osobu, prijavi to na stranici Potvrde.`,
            }
          : {
              kljuc: "notifikacije.potvrda_clana_bez_potvrde",
              naslov: "Postao si član Kola",
              tekst:
                `„${rez.verifikatorPseudonim}" te je potvrdio, pa si od člana bez potvrde postao član Kola. ` +
                `Na stranici Potvrde imaš spisak povezanih: potvrdi sa njega samo one koje lično znaš. ` +
                `Pripadnost Kolu nije članstvo u Fondaciji. Ako ne poznaješ ovu osobu, prijavi to na stranici Potvrde.`,
            };
    void obavesti(rez.verifikovaniId, {
      tip: "VERIFIKOVAN",
      kljuc: obavestenje.kljuc,
      parametri,
      naslov: obavestenje.naslov,
      tekst: obavestenje.tekst,
      link: "/verifikacija",
      emailDugme: "Otvori Potvrde",
    });

    return NextResponse.json({
      verifikacijaId: rez.verifikacijaId,
      verifikovaniPseudonim: rez.verifikovaniPseudonim,
      vrsta: rez.vrsta,
      // Koliko ljudi ima na spisku povezanih onaj ko je sada postao član Kola (čl. 17).
      povezani: rez.povezani,
      // 3. ili 4. potvrda u danu (dokaz stvarnosti čl. 21) — ekran uz uspeh pokazuje
      // i upozorenje da peta zaustavlja potvrđivanje do ponoći.
      upozorenjeDnevno: rez.upozorenjeDnevno,
    });
  } catch (e) {
    if (e instanceof VerifikacijaGreska) {
      return await greska(e.message, e.statusCode);
    }
    console.error("[POST /api/verifikacija]", e);
    return await greska("Greška servera", 500);
  }
}
