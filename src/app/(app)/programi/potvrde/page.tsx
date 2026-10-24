import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { labelPrograma } from "@/lib/protokol/programi";
import PotvrdeKlijent from "./PotvrdeKlijent";
import { ucitajStatus, sme } from "@/lib/protokol/status";

// Zahtevi za potvrdu socijalnih programa koje čeka prijavljeni verifikator.
// Verifikator NE vidi osetljive prijavljene podatke (čl. 4) — potvrđuje na osnovu
// ličnog poznavanja osobe koju je verifikovao.
export default async function PotvrdePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Spisak vidi samo član Kola, odnosno osnivač (programi čl. 4 st. 2; set 4.8.2).
  const status = await ucitajStatus(session.user.id);
  if (!status || !sme("POTVRDJUJE_USLOVE_PROGRAMA", status)) return <PotvrdeKlijent stavke={[]} />;

  const potvrde = await prisma.programPotvrda.findMany({
    // Zatečeni redovi iz vremena pre `zatvoriPostupakPotvrda`: prijava je
    // odavno rešena, a zahtev je verifikatoru i dalje stajao u spisku i dalje
    // mu pokazivao naziv programa. Filter po stanju prijave to gasi i za njih.
    where: { verifikatorId: session.user.id, status: "CEKA", enrollment: { status: "PENDING" } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      enrollment: {
        select: { type: true, user: { select: { id: true, pseudonim: true } } },
      },
    },
  });

  const stavke = potvrde.map((p) => ({
    id: p.id,
    program: labelPrograma(p.enrollment.type),
    podnosilacId: p.enrollment.user.id,
    podnosilacPseudonim: p.enrollment.user.pseudonim,
  }));

  return <PotvrdeKlijent stavke={stavke} />;
}
