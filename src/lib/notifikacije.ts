import { prisma } from "./prisma";
import { zakaziPush } from "./push";
import { posaljiEmailKorisniku } from "./email";
import { prevedi, type Parametri } from "./prevod-servera";

export interface NotifikacijaOpcije {
  /**
   * Da li uz zvonce ide i email. Podrazumevano `true` — obaveštenja se šalju kad
   * se desilo nešto što traži pažnju, pa korisnik treba da sazna i van aplikacije.
   * Isključi (`false`) kad je mejl suvišan: primalac isti događaj već dobija
   * drugim kanalom (npr. admin preko `posaljiAdminAlert`).
   *
   * Sam korisnik gasi sve mejlove ovog tipa u profilu (`User.emailObavestenja`)
   * ili linkom iz podnožja mejla — provera je u `posaljiEmailKorisniku`.
   */
  email?: boolean;
  /** Tekst dugmeta u mejlu; podrazumevano „Otvori u aplikaciji". */
  emailDugme?: string;
  /**
   * Koren ključa u `messages/*.json` (traže se `<kljuc>_naslov` i `<kljuc>_tekst`).
   * Kad postoji, zvonce/push/mejl idu na jeziku primaoca. Bez njega ostaje
   * srpski tekst iz `naslov`/`tekst` — zato stara pozivna mesta i dalje rade.
   */
  kljuc?: string;
  /** Vrednosti za `{parametar}` u prevodu. */
  parametri?: Parametri;
  /**
   * Zaseban, NEUTRALAN tekst za kanale VAN aplikacije — mejl (Resend) i push.
   *
   * 🔴 Postoji zbog obaveštenja koja u sebi nose podatak koji ne sme da izađe iz
   * Platforme (naziv socijalnog programa otkriva pripadnost posebnoj kategoriji
   * podataka — Pravilnik o programima podrške čl. 4, DPIA R11). Kad je postavljen,
   * zvonce nosi pun tekst, a mejl i push samo poziv da se obaveštenje otvori u
   * aplikaciji. Bez njega su sva tri kanala ista rečenica.
   *
   * Push je namerno pokriven zajedno sa mejlom: stiže na zaključan ekran telefona,
   * pa je jednako kanal van Platforme.
   */
  spoljni?: { kljuc: string; naslov: string; tekst: string; parametri?: Parametri };
}

export async function posaljiNotifikaciju(
  userId: string,
  tip: string,
  naslov: string,
  tekst: string,
  link?: string,
  opcije?: NotifikacijaOpcije,
) {
  await prisma.notifikacija.create({
    data: { userId, tip, naslov, tekst, link, kljuc: opcije?.kljuc, parametri: opcije?.parametri },
  });
  // Jezik primaoca (ne posmatrača i ne pošiljaoca) — mejl i push idu posle
  // odgovora, van konteksta zahteva, pa se čita iz baze.
  const jezik = opcije?.kljuc || opcije?.spoljni
    ? (await prisma.user.findUnique({ where: { id: userId }, select: { jezik: true } }))?.jezik
    : null;
  const naJeziku = (sufiks: string, rezerva: string) =>
    opcije?.kljuc ? prevedi(jezik, `${opcije.kljuc}_${sufiks}`, opcije.parametri, rezerva) : rezerva;

  const naslovL = naJeziku("naslov", naslov);
  const tekstL = naJeziku("tekst", tekst);

  // Kanali van aplikacije. Podrazumevano ista rečenica kao zvonce; uz `spoljni`
  // dobijaju neutralan tekst koji ne otkriva sadržaj (vidi NotifikacijaOpcije).
  const sp = opcije?.spoljni;
  const spoljniNaslov = sp
    ? prevedi(jezik, `${sp.kljuc}_naslov`, sp.parametri, sp.naslov)
    : naslovL;
  const spoljniTekst = sp
    ? prevedi(jezik, `${sp.kljuc}_tekst`, sp.parametri, sp.tekst)
    : tekstL;

  // Push na telefon/uređaj (ako je korisnik uključio obaveštenja). Ne blokira i
  // ne baca — zvonce u aplikaciji radi nezavisno od push-a. `zakaziPush` koristi
  // `after()` da push preživi kraj serverless odgovora (vidi push.ts).
  zakaziPush(userId, { naslov: spoljniNaslov, tekst: spoljniTekst, link, tip });
  // Email (Resend) — isti tekst kao zvonce, osim kad je postavljen `spoljni`.
  // Takođe ne blokira i ne baca.
  if (opcije?.email !== false) {
    void posaljiEmailKorisniku(userId, {
      naslov: spoljniNaslov,
      tekst: spoljniTekst,
      link,
      linkTekst: opcije?.emailDugme,
    });
  }
}

/**
 * Obaveštenje sa PREVODIVIM tekstom.
 *
 * Srpski tekst i dalje ide u `naslov`/`tekst` (rezerva i stari prikaz), a uz
 * njega se čuva ključ + parametri, pa se rečenica sklapa na jeziku primaoca —
 * i u zvoncetu, i u push-u, i u mejlu.
 *
 * Ključ je koren; poruke se traže kao `<kljuc>_naslov` i `<kljuc>_tekst`.
 */
export async function obavesti(
  userId: string,
  o: {
    tip: string;
    kljuc: string;
    parametri?: Parametri;
    /** Srpski tekst — rezerva ako prevod nedostaje. */
    naslov: string;
    tekst: string;
    link?: string;
  } & NotifikacijaOpcije,
) {
  await posaljiNotifikaciju(userId, o.tip, o.naslov, o.tekst, o.link, {
    email: o.email,
    emailDugme: o.emailDugme,
    kljuc: o.kljuc,
    parametri: o.parametri,
    spoljni: o.spoljni,
  });
}

/**
 * Obavesti sve aktivne admine (UO Fondacije) da se priključio nov korisnik —
 * bez obzira da li je verifikovan ili ne (verifikacija dolazi kasnije).
 */
export async function obavestiAdmineNoviKorisnik(noviUserId: string, pseudonim: string) {
  const admini = await prisma.user.findMany({
    where: { admin: { in: ["ADMIN", "SUPERADMIN"] }, deaktiviranAt: null },
    select: { id: true },
  });
  await Promise.all(
    admini.map((a) =>
      posaljiNotifikaciju(
        a.id,
        "NOV_KORISNIK",
        "Nov korisnik se priključio",
        `Korisnik „${pseudonim}" je upravo napravio nalog.`,
        // Namerno interni id, ne pseudonim: link se ČUVA u bazi i u mejlu, a
        // pseudonim se može promeniti — id ne može. Profil prima oba.
        `/profil/${noviUserId}`,
        // Bez mejla: admini isti događaj već dobijaju preko `posaljiAdminAlert`
        // (email + Telegram) iz rute registracije — inače bi stigao dvaput.
        { email: false },
      ),
    ),
  );
}
