import { getServerSession } from "next-auth";
import { intlTag } from "@/lib/format";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { dohvatiRegistarOdluka } from "@/lib/protokol/glasanje";
import IzvrsenjeKontrole from "./IzvrsenjeKontrole";
import PreporukaOdgovor from "./PreporukaOdgovor";
import { jeAdmin } from "@/lib/dozvole";
import { getTranslations, getLocale } from "next-intl/server";
import Pseudonim from "@/components/Pseudonim";
import Kartica from "@/components/ui/Kartica";
import PraznoStanje from "@/components/ui/PraznoStanje";

export const metadata = { title: "Registar odluka — KOLO" };

// Registar odluka Gornjeg Kola (Pravilnik o Gornjem Kolu 3.7.6, čl. 21).
// Nepromenljiv, javno vidljiv pregled svih zatvorenih predloga sa ishodom.
export default async function RegistarOdlukaPage() {
  const locale = await getLocale();
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const korisnikJeAdmin = jeAdmin(session.user);
  const t = await getTranslations("glasanje");

  const odluke = await dohvatiRegistarOdluka();

  return (
    <div className="space-y-6">
      {/* „Nazad" iznad naslova, kao na ostalim stranicama (bilo je desno u redu naslova). */}
      <div className="space-y-2">
        <Link href="/zrno" className="inline-flex min-h-9 items-center text-sm text-kolo-muted hover:text-kolo-green-700">
          {t("registar_nazad")}
        </Link>
        <h1 className="kolo-naslov">{t("registar_naslov")}</h1>
        <p className="text-sm text-kolo-muted">
          {t("registar_opis")}
        </p>
      </div>

      {odluke.length === 0 ? (
        <Kartica padding="nema">
          <PraznoStanje naslov={t("registar_prazno")} />
        </Kartica>
      ) : (
        <div className="space-y-3">
          {odluke.map((o) => {
            const usvojen = o.ishodUsvojen === true;
            const datum = new Date(o.rok).toLocaleDateString(intlTag(locale), { day: "2-digit", month: "long", year: "numeric" });
            return (
              <Kartica key={o.id} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-kolo-text">{o.title}</p>
                    {o.vrsta === "DINARSKA_PREPORUKA" && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-lg bg-kolo-gold-50 text-kolo-gold-700 font-medium">{t("vrsta_preporuka")}</span>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-lg font-medium ${usvojen ? "bg-kolo-green-100 text-kolo-green-700" : "bg-kolo-bg text-kolo-muted"}`}>
                    {usvojen ? t("usvojeno") : t("neusvojeno")}
                  </span>
                </div>
                <p className="text-xs text-kolo-muted">{t.rich("registar_predlagac", { pseudonim: o.authorPseudonim, ime: (c) => <Pseudonim>{c}</Pseudonim> })} · {t("registar_zatvoreno", { datum })}</p>
                <p className="text-sm text-kolo-muted whitespace-pre-line">{o.description}</p>
                <div className="flex gap-4 text-xs text-kolo-muted pt-1 border-t border-kolo-border">
                  <span>{t("registar_za_zbir", { zbir: o.zaZbir })}</span>
                  <span>{t("registar_protiv_zbir", { zbir: o.protivZbir })}</span>
                  <span>· {t("registar_br_glasaca", { count: o.brGlasova })}</span>
                </div>

                {/* Izvršenje usvojene odluke (čl. 17, 18) */}
                {o.izvrsenjeStatus && (
                  <div className="text-xs">
                    <span className={`inline-block px-2 py-0.5 rounded-lg font-medium ${
                      o.izvrsenjeStatus === "IZVRSENO" ? "bg-kolo-green-100 text-kolo-green-700"
                      : o.izvrsenjeStatus === "VETO_OBUSTAVLJENO" ? "bg-kolo-danger-light text-kolo-danger"
                      : o.izvrsenjeStatus === "NIJE_SPROVEDENO" ? "bg-kolo-bg text-kolo-muted"
                      : "bg-kolo-gold-100 text-kolo-gold-700"
                    }`}>
                      {o.izvrsenjeStatus === "ZA_IZVRSENJE" ? t("izvrsenje_ceka")
                        : o.izvrsenjeStatus === "IZVRSENO" ? t("izvrsenje_izvrseno")
                        : o.izvrsenjeStatus === "NIJE_SPROVEDENO" ? t("izvrsenje_nije_sprovedeno")
                        : t("izvrsenje_veto")}
                    </span>
                    {/* Akt UO kojim je odluka sprovedena (čl. 51) — bez njega registar
                        ne pokazuje da je nadležni organ išta doneo. */}
                    {o.izvrsenjeAkt && (
                      <p className="mt-1 text-kolo-muted">{t("izvrsenje_akt_label")} {o.izvrsenjeAkt}</p>
                    )}
                    {o.odbijanjeRazlog && (
                      <p className="mt-1 text-kolo-muted italic">
                        {t(`odbijanje_razlog_${o.odbijanjeRazlog.toLowerCase()}`)}
                        {o.odbijanjeObrazlozenje ? ` — ${o.odbijanjeObrazlozenje}` : ""}
                      </p>
                    )}
                    {o.vetoObrazlozenje && (
                      <p className="mt-1 text-kolo-muted italic">{t("veto_obrazlozenje_label")} {o.vetoObrazlozenje}</p>
                    )}
                  </div>
                )}

                {korisnikJeAdmin && o.izvrsenjeStatus === "ZA_IZVRSENJE" && <IzvrsenjeKontrole id={o.id} />}

                {/* Usvojena dinarska preporuka — odgovor UO (čl. 20) */}
                {usvojen && o.vrsta === "DINARSKA_PREPORUKA" && (
                  o.uoOdgovor ? (
                    <div className="text-xs">
                      <span className={`inline-block px-2 py-0.5 rounded-lg font-medium ${o.uoOdgovor === "PRIHVACENO" ? "bg-kolo-green-100 text-kolo-green-700" : "bg-kolo-bg text-kolo-muted"}`}>
                        {t("uo_odgovor_label")} {o.uoOdgovor === "PRIHVACENO" ? t("uo_prihvaceno") : t("uo_odbijeno")}
                      </span>
                      {o.uoObrazlozenje && <p className="mt-1 text-kolo-muted italic">{o.uoObrazlozenje}</p>}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-kolo-gold-700 font-medium">{t("uo_ceka_odgovor")}</p>
                      {korisnikJeAdmin && <PreporukaOdgovor id={o.id} />}
                    </>
                  )
                )}
              </Kartica>
            );
          })}
        </div>
      )}
    </div>
  );
}
