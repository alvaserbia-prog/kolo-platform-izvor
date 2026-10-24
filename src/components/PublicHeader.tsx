import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/ui/Logo";
import { klaseDugmeta } from "@/components/ui/Dugme";
import JezikSvitcer from "@/components/JezikSvitcer";
import PublicNav from "@/components/PublicNav";
import { getTranslations } from "next-intl/server";

export default async function PublicHeader() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("javneKomponente");

  return (
    <header className="sticky top-0 z-50 bg-kolo-surface border-b border-kolo-border">
      <div className="max-w-[1140px] mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo tema="svetla" velicina="md" prioritet />
          </Link>
          <div className="hidden md:flex">
            <JezikSvitcer tema="svetla" />
          </div>
        </div>

        {/* Gost na telefonu: „Pridruži se" uvek u zaglavlju. Do sada je stajalo
            samo u otvorenom meniju i u heroju naslovne, pa na ostalim javnim
            stranicama nije bilo ulaza u registraciju iznad prvog ekrana. */}
        {!session && (
          <Link
            href="/registracija"
            className={klaseDugmeta({ varijanta: "zlatno" }) + " md:hidden ml-auto mr-1 px-3"}
          >
            {t("header_priduzi_se")}
          </Link>
        )}

        <PublicNav isLoggedIn={!!session} />

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {session ? (
            <Link
              href="/dashboard"
              className={klaseDugmeta()}
            >
              {t("header_moj_nalog")}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-kolo-green-700 hover:text-kolo-green-900 transition-colors"
              >
                {t("header_prijavi_se")}
              </Link>
              <Link
                href="/registracija"
                className={klaseDugmeta({ varijanta: "zlatno" })}
              >
                {t("header_priduzi_se")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
