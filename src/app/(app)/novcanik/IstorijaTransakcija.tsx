import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { opisTransakcije } from "@/lib/prevod-servera";
import { PROTOKOL_WALLET_ID } from "@/lib/protokol/zrno";
import IstorijaKlijent from "./IstorijaKlijent";

/**
 * Serverska komponenta sa najtežim upitom novčanika (100 transakcija + ugnežđeni
 * JOIN-ovi). Renderuje se unutar `<Suspense>` u `page.tsx` pa se striminguje
 * ODVOJENO — gornje kartice (stanje POEN/ZRNO) se iscrtaju odmah, bez čekanja.
 */
export default async function IstorijaTransakcija({
  userId,
  walletId,
  pseudonim,
}: {
  userId: string;
  walletId: string;
  pseudonim: string;
}) {
  const transakcije = await prisma.transaction.findMany({
    where: {
      OR: [
        { toWallet: { userId } },
        { fromWallet: { userId } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      fromWallet: { include: { user: { select: { id: true, pseudonim: true } } } },
      toWallet: { include: { user: { select: { id: true, pseudonim: true } } } },
      // Status prijave neispunjene razmene — po njemu se bira da li se uz red
      // nudi dugme za prijavu ili stoji oznaka da je već prijavljeno.
    },
  });

  const locale = await getLocale();
  const txData = transakcije.map((t) => {
    const primio = t.toWallet?.userId
      ? t.toWallet.userId === userId
      : t.toWalletId === walletId;
    // Prepis i njegovo poništenje su jedini zapisi između DVA člana — kod svih
    // ostalih je druga strana Protokol.
    //
    // 🔴 Tip nije dovoljan: sirov `TRANSFER` nosi i vraćanja PROTOKOLU (poništenje
    // potvrde pri brisanju potvrđenog člana, poništenje POEN-a pri prestanku
    // statusa). Takav red je tražio ime člana na novčaniku Protokola, nije ga našao
    // i pokazivao „?" — kao da je POEN otišao nikome. Odlučuje druga strana zapisa.
    const drugiNovcanik = primio ? t.fromWalletId : t.toWalletId;
    const medjuClanovima =
      (t.type === "TRANSFER" || t.type === "PONISTENJE_PREPISA") &&
      drugiNovcanik !== PROTOKOL_WALLET_ID;
    const drugiUser = !medjuClanovima
      ? null
      : primio
      ? t.fromWallet?.user ?? null
      : t.toWallet?.user ?? null;

    return {
      id: t.id,
      amount: t.amount,
      type: t.type,
      description: opisTransakcije(locale, t),
      primio,
      medjuClanovima,
      drugiPseudonim: drugiUser?.pseudonim ?? (medjuClanovima ? "?" : "Protokol"),
      drugiId: drugiUser?.id ?? null,
      createdAt: t.createdAt.toISOString(),
      // Prijavljuje samo pošiljalac (`!primio`) i samo prepis — poništenje se
      // ne prijavljuje ponovo.
    };
  });

  return <IstorijaKlijent transakcije={txData} pseudonim={pseudonim} />;
}

/** Skeleton dok se istorija (Suspense) ne streamuje. */
export function IstorijaSkeleton() {
  return (
    <div>
      <div className="h-5 w-40 bg-kolo-border/60 rounded mb-3 animate-pulse" />
      <div className="flex gap-2 mb-4 flex-wrap">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-24 bg-kolo-border/50 rounded-kontrola animate-pulse" />
        ))}
      </div>
      <div className="bg-kolo-surface rounded-kartica border border-kolo-border shadow-kartica overflow-hidden divide-y divide-kolo-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between">
            <div className="h-4 w-40 bg-kolo-border/50 rounded animate-pulse" />
            <div className="h-4 w-16 bg-kolo-border/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
