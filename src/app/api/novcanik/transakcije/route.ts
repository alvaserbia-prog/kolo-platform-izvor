import { NextRequest, NextResponse } from "next/server";
import { greska } from "@/lib/greska-api";
import { getLocale } from "next-intl/server";
import { opisTransakcije } from "@/lib/prevod-servera";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROTOKOL_WALLET_ID } from "@/lib/protokol/zrno";

const TIP_LABELA: Record<string, string> = {
  TRANSFER: "Upis POENA",
  EMISIJA_VERIFIKACIJA: "Potvrda",
  EMISIJA_NADZOR: "Nadzor potvrde",
  EMISIJA_SADRZAJ: "Prvi oglas",
  EMISIJA_DONACIJA: "Donacija",
  EMISIJA_POKROVITELJ: "Pokrovitelj",
  EMISIJA_KRUG_OSNIVANJE: "Osnivanje krugovi",
  EMISIJA_KRUG_BONUS: "Bonus krugovi",
  EMISIJA_PROGRAM: "Program",
  UPIS_ZRNO: "Upis ZRNA",
  OTPIS_ZRNO: "Otpis ZRNA",
  ZADRUGA_PRIJEM: "Zadruga — prijem dobra",
  ZADRUGA_IZDAVANJE: "Zadruga — izdavanje dobra",
  ZADRUGA_DOPRINOS: "Zadružni doprinos",
  ZADRUGA_OPREMA: "Zadruga — oprema",
  ZADRUGA_USLUGA: "Zadruga — usluga",
  EMISIJA_GAZDINSTVO: "Doprinos gazdinstva",
  OTPIS_GAZDINSTVO: "Otpis doprinosa gazdinstva",
  EMISIJA_POKROVITELJ_DOBRA: "Pokroviteljstvo dobrima i uslugama",
  PONISTENJE_VAUCER: "Vaučer",
  ISPRAVKA_VAUCER: "Ispravka evidencije — vaučer",
  OTPIS_POKROVITELJ_DOBRA: "Otpis po neizvršenju vaučera",
  OTPIS_VISESTRUKI_NALOG: "Otpis po utvrđenju višestrukog naloga",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return await greska("Nije prijavljen.", 401);

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    select: { id: true, balance: true },
  });
  if (!wallet) return await greska("Nema zapisa u Protokolu.", 404);

  const filter = req.nextUrl.searchParams.get("filter") ?? "sve";

  // Dohvati transakcije zavisno od filtera
  const where =
    filter === "primljeno"
      ? { toWalletId: wallet.id, type: "TRANSFER" as const }
      : filter === "poslato"
      ? { fromWalletId: wallet.id, type: "TRANSFER" as const }
      : filter === "emisije"
      ? { toWalletId: wallet.id, NOT: { type: "TRANSFER" as const } }
      : { OR: [{ toWalletId: wallet.id }, { fromWalletId: wallet.id }] };

  const txs = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      fromWallet: { include: { user: { select: { pseudonim: true } }, krug: { select: { name: true } } } },
      toWallet: { include: { user: { select: { pseudonim: true } }, krug: { select: { name: true } } } },
    },
  });

  // Opis se prevodi na jeziku posmatrača. Stavke bez ključa (stare i one iz
  // nekonvertovanih kanala) prikazuju sačuvan srpski `description`.
  const locale = await getLocale();
  const result = txs.map((t) => {
    const primio = t.toWalletId === wallet.id;
    const drugiPseudonim =
      primio
        ? (t.fromWallet?.user?.pseudonim ?? t.fromWallet?.krug?.name ?? "Protokol")
        : (t.toWallet?.user?.pseudonim ?? t.toWallet?.krug?.name ?? (t.toWalletId === PROTOKOL_WALLET_ID ? "Protokol" : "?"));

    return {
      id: t.id,
      amount: t.amount,
      type: t.type,
      typeLabel: TIP_LABELA[t.type] ?? t.type,
      description: opisTransakcije(locale, t),
      primio,
      drugiPseudonim,
      createdAt: t.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ balance: wallet.balance, transakcije: result });
}
