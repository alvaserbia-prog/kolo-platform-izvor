import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MojiOglasiKlijent from "./MojiOglasiKlijent";

export default async function MojiOglasiPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const listings = await prisma.marketplaceListing.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true,
      cenaTip: true, price: true, cenaDo: true, category: true,
      status: true, images: true, createdAt: true, razmenjenoAt: true,
      uklonjenRazlog: true,
    },
  });

  return (
    <MojiOglasiKlijent
      listings={listings.map((l) => ({
        id: l.id,
        title: l.title,
        cenaTip: l.cenaTip,
        price: l.price,
        cenaDo: l.cenaDo,
        category: l.category,
        status: l.status,
        slike: l.images.length,
        createdAt: l.createdAt.toISOString(),
        razmenjenoAt: l.razmenjenoAt?.toISOString() ?? null,
        uklonjenRazlog: l.uklonjenRazlog,
      }))}
    />
  );
}
