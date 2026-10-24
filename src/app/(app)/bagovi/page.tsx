import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import BagoviKlijent from "./BagoviKlijent";

export default async function BagoviPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <BagoviKlijent />;
}
