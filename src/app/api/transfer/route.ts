import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gdePseudonim } from "@/lib/pseudonim";
import { smeDaSalje } from "@/lib/protokol/doprinos-sadrzaju";
import { jeNadoknada, iznosNadoknade } from "@/lib/protokol/nadoknada";
import { smeDaPrepise, trebaOdobrenjeRoditelja, ucitajUcesnika } from "@/lib/protokol/deca";
import { izvrsiPrepis, PrepisGreska } from "@/lib/protokol/prepis";
import { zatraziOdobrenje } from "@/lib/protokol/prepis-odobrenje";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  let body: { pseudonim?: string; amount?: unknown; description?: string };
  try {
    body = await req.json();
  } catch {
    return await greska("Neispravan zahtev.", 400);
  }
  const { pseudonim, amount, description } = body;

  // Validacija ulaza
  if (!pseudonim || !amount) {
    return await greska("Primalac i iznos su obavezni.", 400);
  }
  const iznos = Math.floor(Number(amount));
  if (!Number.isInteger(iznos) || iznos <= 0) {
    return await greska("Iznos mora biti pozitivan ceo broj.", 400);
  }

  // Pronađi primaoca
  // Pseudonim se traži bez obzira na veličinu slova — ko ukuca `marko` misli na
  // `Marko`, a drugog `marko` po jedinstvenosti ne može ni biti.
  const primalac = await prisma.user.findFirst({
    where: gdePseudonim(pseudonim),
    include: { wallet: true },
  });
  if (!primalac) {
    return await greska("Korisnik sa tim pseudonimom ne postoji.", 404);
  }
  if (primalac.id === session.user.id) {
    return await greska("Ne možete prepisati POEN samom sebi.", 400);
  }
  if (!primalac.wallet) {
    return await greska("Primalac nema zapis u Protokolu.", 500);
  }

  // Pronađi pošiljaoca
  const posiljac = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { wallet: true },
  });
  if (!posiljac?.wallet) {
    return await greska("Nemate zapis u Protokolu.", 500);
  }
  // Neverifikovani korisnik u ažuriranju evidencije učestvuje ISKLJUČIVO kao
  // primalac (Pravilnik 4.1.1 čl. 28 st. 2). Uslov se vezuje za tip naloga, ne za
  // indeks stvarnosti: ko je jednom verifikovan sme da prepisuje POEN i ako mu indeks
  // kasnije padne. Čita se iz baze, ne iz sesije — token se osvežava sa zakašnjenjem,
  // pa bi tek verifikovan korisnik još neko vreme bio odbijan.
  // ── Modul Deca (čl. 14) ────────────────────────────────────────────────────
  //
  // Kad je bar jedna strana maloletna, o prepisu odlučuje `smeDaPrepise`, a ne opšte
  // pravilo o neverifikovanom nalogu: maloletni korisnik jeste NEVERIFIKOVAN u smislu
  // šeme, ali u dečjem prostoru sme da prepisuje. Zato ova provera ide PRE
  // `smeDaSalje`, i preuzima odluku za sve parove u kojima ima deteta.
  const [odUcesnik, kaUcesnik] = await Promise.all([
    ucitajUcesnika(posiljac.id),
    ucitajUcesnika(primalac.id),
  ]);
  if (!odUcesnik || !kaUcesnik) return await greska("Nalog ne postoji.", 401);
  const jeDecjiPar = odUcesnik.maloletan || kaUcesnik.maloletan;

  if (jeDecjiPar) {
    // `smeDaPrepise` sam odbija nalog koji još čeka roditelja (čl. 4c) i par u kome
    // je dete mlađe od 15 a druga strana punoletna (čl. 12) — oba uslova su deo
    // `Ucesnik`-a, pa nema odvojene provere.
    const dozvoljeno = smeDaPrepise(odUcesnik, kaUcesnik);
    if (!dozvoljeno.ok) return await greska(dozvoljeno.razlog, dozvoljeno.status);
  } else if (!smeDaSalje(posiljac.tipKorisnika)) {
    return await greska(
      "Dok si nov član, POEN može da se prepisuje u tvoj zapis. Prepis u tuđi zapis otvara se po potvrdi.",
      403,
    );
  }
  // Nadoknada (negativan zapis po čl. 20b Pravilnika o dokazu stvarnosti) ne
  // sprečava razmenu dobara i usluga, ali POEN-i koji pristignu prvo popunjavaju
  // nadoknadu — dok zapis ne pređe nulu nema čime da se prepisuje drugome.
  if (jeNadoknada(posiljac.wallet.balance)) {
    return await greska(
      `Na tvom zapisu stoji nadoknada od ${iznosNadoknade(posiljac.wallet.balance)} POENA. ` +
        `POENI koji ti pristignu prvo je popunjavaju; prepis u tuđi zapis je moguć tek kad zapis pređe nulu. ` +
        `Razmena dobara i usluga ti nije ograničena.`,
      400
    );
  }
  if (posiljac.wallet.balance < iznos) {
    return await greska(`Nemate dovoljno POENA. Stanje: ${posiljac.wallet.balance}.`, 400);
  }

  // Prepis iz dečjeg zapisa iznad praga NE ide odmah nego čeka roditelja (Pravilnik
  // o učešću dece, čl. 14). Provera stoji POSLE pokrića — nema smisla tražiti
  // odobrenje za iznos koji ionako ne postoji na zapisu.
  if (trebaOdobrenjeRoditelja(odUcesnik, kaUcesnik, iznos)) {
    return NextResponse.json(
      await zatraziOdobrenje({
        deteId: posiljac.id,
        detePseudonim: posiljac.pseudonim,
        primalacId: primalac.id,
        primalacPseudonim: primalac.pseudonim,
        iznos,
        opis: description,
        godine: odUcesnik.godine,
      })
    );
  }

  // Ažuriranje evidencije 1:1 — bez posrednika, bez provizije; nije prenos monetarne
  // vrednosti (Pravilnik čl. 16). Sam posao živi u `izvrsiPrepis`, jer isti prepis
  // kreće i odavde i iz odluke roditelja danima kasnije (čl. 14 Pravilnika o učešću
  // dece) — dve kopije bi se razišle, a razlaz znači pokvaren zero-sum.
  try {
    await izvrsiPrepis(
      { id: posiljac.id, pseudonim: posiljac.pseudonim, walletId: posiljac.wallet.id },
      { id: primalac.id, pseudonim: primalac.pseudonim, walletId: primalac.wallet!.id },
      iznos,
      description
    );
  } catch (e) {
    if (e instanceof PrepisGreska) return await greska("Nemate dovoljno POENA.", 400);
    throw e;
  }

  return NextResponse.json({ ok: true });
}
