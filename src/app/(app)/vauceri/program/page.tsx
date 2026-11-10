import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ProgramRadKlijent from "./ProgramRadKlijent";

export const metadata = { title: "Program raspodele hrane — KOLO" };

/**
 * Radni ekran programa raspodele hrane i lanca (nabavke Glave X i XI): javni poziv i prijava
 * gazdinstva, odnosno objekta; ugovori; zapisnik o primopredaji; izvršenje usluge; spremno za
 * preuzimanje; potvrda preuzimanja kodom; preuzimanje nepreuzetih delova.
 */
export default async function ProgramRadPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <ProgramRadKlijent />;
}
