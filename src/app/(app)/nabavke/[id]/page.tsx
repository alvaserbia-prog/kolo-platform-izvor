import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import NabavkaDetaljKlijent from "./NabavkaDetaljKlijent";

export default async function NabavkaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  return <NabavkaDetaljKlijent id={id} />;
}
