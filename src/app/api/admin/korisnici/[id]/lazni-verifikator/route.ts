import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAkcija } from "@/lib/audit";
import { obavesti } from "@/lib/notifikacije";
import {
  ponistiNepostojeciNalog,
  LaznaVerifikacijaGreska,
} from "@/lib/protokol/lazna-verifikacija";
import { jeSuperadmin } from "@/lib/dozvole";

// POST — Upravni odbor utvrđuje da iza naloga ne stoji stvarna osoba, odnosno da
// nalog nije jedinstven (Pravilnik o dokazu stvarnosti 4.2.0, čl. 18).
//
// 🔴 Do 4.2.0 je ova ruta obarala CELO podstablo verifikatora — stvarni ljudi su
// gubili status zbog tuđe radnje. Sada padaju samo verifikacije koje ovaj nalog
// dodiruju (primljene i obavljene, čl. 20), a kaskada staje na prvom stvarnom
// čoveku: on gubi tu jednu vezu i može ponovo biti verifikovan (čl. 20c).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !jeSuperadmin(session.user))
    return await greska("Pristup odbijen.", 403);

  const { id } = await params;

  try {
    const rez = await ponistiNepostojeciNalog(id);

    await logAdminAkcija(
      session.user.id,
      "NALOG_UTVRDJEN_NEPOSTOJECIM",
      id,
      `${rez.pseudonim}: poništeno ${rez.ponistenoVerifikacija} verifikacija`
    );

    for (const uid of rez.pogodjeniKorisnici) {
      await obavesti(uid, {
        tip: "VERIFIKACIJA_PONISTENA",
        kljuc: "notifikacije.verifikacija_ponistena",
        naslov: "Potvrda poništena",
        tekst:
          "Utvrđeno je da je potvrda, odnosno uvođenje u Kolo u tvom lancu potvrda lažno, pa je poništeno. Sada si korisnik. Kad te neko ko te lično zna ponovo potvrdi ili uvede u Kolo, vraća se i status.",
        link: "/profil",
      });
    }

    // Nadoknada je poseban događaj i tiče se drugog čoveka od onog iznad —
    // verifikatora kome je nepokriveni deo prešao na zapis (čl. 20b).
    for (const n of rez.nadoknade) {
      await obavesti(n.userId, {
        tip: "NADOKNADA",
        kljuc: "notifikacije.nadoknada",
        parametri: { iznos: n.iznos },
        naslov: "Nastala je nadoknada na tvom zapisu",
        tekst: `Poništenjem verifikacije koju si obavio nastala je nadoknada od ${n.iznos} POENA, jer poništeni POENI nisu bili pokriveni. Nadoknada nije dug i ne može se naplatiti; POENI koji ti pristignu prvo je popunjavaju. Razmena dobara i usluga ti nije ograničena.`,
        link: "/novcanik",
      });
    }

    return NextResponse.json({ ok: true, ...rez });
  } catch (e) {
    if (e instanceof LaznaVerifikacijaGreska)
      return await greska(e.message, e.status);
    throw e;
  }
}
