import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Lokalno-svesne zamene za next/link i next/navigation: automatski dodaju
// prefiks aktivnog jezika (npr. <Link href="/pijaca"> na /en/ → /en/pijaca).
// Koristiti OVE umesto next/link u javnim (i18n-iziranim) stranicama.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
