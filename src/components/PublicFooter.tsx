import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Logo from "@/components/ui/Logo";
import { getTranslations } from "next-intl/server";
import DrustveneMreze from "@/components/DrustveneMreze";
import { KolaciciPodesavanja } from "@/components/CookieConsent";

export default async function PublicFooter() {
  const t = await getTranslations("javneKomponente");

  return (
    <footer className="border-t border-kolo-border bg-white mt-8">
      <div className="max-w-[1140px] mx-auto px-6 py-8">
        {/* Na telefonu dve kolone veza (brend preko cele širine): u jednoj koloni
            podnožje je bilo dugačko ~1.000 px. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 mb-8">
          {/* Brend */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 h-7 mb-5">
              <Logo tema="svetla" velicina="sm" />
            </div>
            <p className="text-sm text-kolo-muted leading-relaxed mb-2">
              {t("footer_brand_opis").split("\n").map((line, i) => (
                <span key={i}>{line}{i === 0 ? <br /> : null}</span>
              ))}
            </p>
            <div className="-ml-2.5 mt-4">
              <DrustveneMreze />
            </div>
          </div>

          {/* Sistem */}
          <div>
            <p className="text-sm font-bold tracking-widest text-kolo-muted uppercase h-7 flex items-center mb-3">{t("footer_sistem")}</p>
            <ul className="space-y-1 text-sm text-kolo-muted">
              <li><Link href="/kako-funkcionise" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_kako")}</Link></li>
              <li><Link href="/kako-funkcionise#ko-stoji-iza" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_ko_stoji")}</Link></li>
              <li><Link href="/sistem" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_sistem")}</Link></li>
              <li><Link href="/pijaca" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_pijaca")}</Link></li>
              <li><Link href="/gazdinstva" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_gazdinstva")}</Link></li>
              <li><Link href="/mapa" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_mapa")}</Link></li>
              <li><Link href="/zadruge" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_zadruge")}</Link></li>
              <li><Link href="/osnivacki-doprinos" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_osnivacki")}</Link></li>
            </ul>
          </div>

          {/* Zajednica */}
          <div>
            <p className="text-sm font-bold tracking-widest text-kolo-muted uppercase h-7 flex items-center mb-3">{t("footer_zajednica")}</p>
            <ul className="space-y-1 text-sm text-kolo-muted">
              <li><Link href="/vesti" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_vesti")}</Link></li>
              <li><Link href="/cesto-postavljena-pitanja" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_faq")}</Link></li>
              <li><Link href="/podrzi-kolo" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_podrzi")}</Link></li>
              <li><Link href="/pokrovitelji" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_pokrovitelji")}</Link></li>
            </ul>
          </div>

          {/* Pravni okvir */}
          <div>
            <p className="text-sm font-bold tracking-widest text-kolo-muted uppercase h-7 flex items-center mb-3">{t("footer_pravni")}</p>
            <ul className="space-y-1 text-sm text-kolo-muted">
              <li><Link href="/kako-funkcionise#pravila" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_pravna")}</Link></li>
              <li><Link href="/uslovi" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_uslovi")}</Link></li>
              <li><Link href="/privatnost" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_privatnost")}</Link></li>
              <li><Link href="/rizici" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_rizici")}</Link></li>
              <li><Link href="/pravilnik" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">{t("footer_link_pravilnik")}</Link></li>
              <li><KolaciciPodesavanja className="hover:text-kolo-green-700 transition-colors text-left" /></li>
            </ul>
          </div>
        </div>

        {/* Donja traka — pravni identitet, copyright i licence (na svakoj
            strani). Registracioni podaci stoje ovde, a ne u koloni brenda:
            javni su podaci iz Registra zadužbina i fondacija APR i pripadaju
            uz copyright, a kolonu brenda su izdužili preko ostalih triju.
            Broj rešenja se NE objavljuje. */}
        <div className="border-t border-kolo-border pt-5 text-xs text-kolo-muted leading-relaxed text-center space-y-1.5">
          <p>
            {t("footer_fondacija_adresa")}
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">{t("footer_fondacija_brojevi")}</span>
          </p>
          <p>{t("footer_fondacija_registar")}</p>
          <p>
            {t("footer_copyright")}
            {" · "}
            <a href="mailto:kontakt@ekolo.rs" className="inline-flex min-h-9 items-center hover:text-kolo-green-700 transition-colors">kontakt@ekolo.rs</a>
          </p>
          <p>
            {t("footer_softver_label")}: <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer" className="hover:underline">AGPL-3.0</a>
            {" · "}
            {t("footer_sadrzaj_label")}: <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.sr" target="_blank" rel="noopener noreferrer" className="hover:underline">CC BY-SA 4.0</a>
            {" · "}
            <Link href="/zajednicko-dobro" className="text-kolo-green-700 hover:underline">{t("footer_zajednicko_dobro_link")}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
