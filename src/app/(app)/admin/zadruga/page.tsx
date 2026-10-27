import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jeAdmin, jeZadruzniAdmin } from "@/lib/dozvole";
import ZadrugeTab from "../ZadrugeTab";

/**
 * `/admin/zadruga` — ekran zadružnog admina (Pravilnik o zadrugama čl. 15; registar
 * 2026-10, U2). Lice koje predloži zadruga vidi samo ovo: zapis, zadrugare i radnje
 * svoje zadruge. Ostatak admin panela (`/admin`) mu je zatvoren jer `jeAdmin` za
 * nivo ZADRUGA vraća `false`. Admin koji ovde dođe ide na pun tab „Zadruge".
 */
export default async function ZadruzniAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (jeAdmin(session.user)) redirect("/admin?tab=zadruge");
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { admin: true, adminZadrugaId: true } });
  if (!jeZadruzniAdmin(me) || !me?.adminZadrugaId) redirect("/dashboard");
  const t = await getTranslations("admin");
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-semibold text-kolo-text">{t("zad_admin_naslov")}</h1>
      <ZadrugeTab />
    </div>
  );
}
