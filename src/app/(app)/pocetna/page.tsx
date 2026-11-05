import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import OznakaStatusa from "@/components/OznakaStatusa";
import { prikazStatusa } from "@/lib/status-prikaz";
import CekaNaTebe from "@/components/CekaNaTebe";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PocetnaKlijent from "./PocetnaKlijent";
import { jeAdmin } from "@/lib/dozvole";
import { ChatSoba } from "@/generated/prisma/client";
import { cekaRoditelja, usloviVidljivostiOglasa, ucitajUcesnika, zahteviPostojanjaZaPotvrdu } from "@/lib/protokol/deca";
import { dohvatiPrijatelje } from "@/lib/protokol/prijateljstva";
import { usloviSobe, usloviSobeOdraslih } from "@/lib/protokol/pricaonica";
import { smeUPricaonicu } from "@/lib/deca-pravila";
import DecjaPocetna from "./DecjaPocetna";
import { karticaSkoleZaDete } from "@/lib/protokol/skole";
import { klaseDugmeta } from "@/components/ui/Dugme";
import Kartica from "@/components/ui/Kartica";

// Naslov kartice pregledača (iza „ — KOLO" iz korenskog šablona); tekst iz prevoda.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("pocetna") };
}

export default async function PocetnaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Maloletni korisnik dobija SVOJU početnu. Ista ruta namerno: klik na logo vodi
  // svakoga „kući", pa dete tako ne završi u Pričaonici odraslih.
  //
  // Sve stoji na JEDNOM ekranu — POEN, dugmad, oglasi i soba — po skici koju je
  // nacrtalo dete. Za sedmogodišnjaka meni iza hamburgera ne postoji; postoji ono
  // što vidi pred sobom.
  const ja = await ucitajUcesnika(session.user.id);
  // Status učesnika (set 4.8.2): jezgro ga izvodi, ekran ga samo crta.
  const prikaz = await prikazStatusa(session.user.id);
  if (ja?.maloletan) {
    // Nalog koji još čeka roditelja (deca čl. 27 st. 2) nema Pričaonicu. Ne prazna soba nego
    // NIJEDNA poruka ne stiže do klijenta — filter je i na serveru, ne samo u
    // prikazu, jer je to bezbednosno pravilo a ne ukras.
    const soba = smeUPricaonicu(ja.stanje);
    // Isti uslov koji sprovodi `GET /api/chat` — ekran i ruta ne smeju da imaju
    // dva različita pojma o tome ko šta vidi (vidi `protokol/pricaonica.ts`).
    const usloviDecje = soba ? await usloviSobe(ja.id, ChatSoba.DECA) : null;
    // Šestocifreni kod stoji na ekranu deteta koje čeka: to je rezervni put do
    // roditelja kad poruka ne stigne, i dete ga sa ekrana može pročitati naglas.
    const poziv = soba
      ? null
      : await prisma.roditeljPoziv.findUnique({
          where: { deteId: ja.id },
          select: { kod: true },
        });
    const [zapis, prijatelji, oglasi, mojihOglasa, chatDeca, karticaSkole, mojiRoditelji] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId: ja.id }, select: { balance: true } }),
      dohvatiPrijatelje(ja.id),
      prisma.marketplaceListing.findMany({
        where: { status: "ACTIVE", seller: usloviVidljivostiOglasa(ja) },
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          id: true, title: true, description: true, price: true, cenaTip: true,
          images: true, seller: { select: { pseudonim: true } },
        },
      }),
      prisma.marketplaceListing.count({ where: { sellerId: ja.id, status: "ACTIVE" } }),
      // Svako vidi SAMO poruke svojih prijatelja (deca čl. 27 st. 3) — jedna soba,
      // filtrirana grafom prijateljstava.
      usloviDecje
        ? prisma.chatMessage.findMany({
            where: usloviDecje,
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { user: { select: { id: true, pseudonim: true, avatar: true } } },
          })
        : Promise.resolve([]),
      // Kartica škole (deca čl. 26). `null` dok dete nije izabralo školu ili dok
      // zvaničan spisak škola nije uvezen.
      karticaSkoleZaDete(ja.id),
      // Lica upisana kao roditelji — za prijavu lažnog roditeljstva (deca čl. 17
      // st. 1). Zaustavljena veza je već kod Fondacije, pa se ne nudi ponovo.
      prisma.roditeljstvo.findMany({
        where: { deteId: ja.id, zaustavljenaAt: null },
        orderBy: { createdAt: "asc" },
        select: { roditelj: { select: { id: true, pseudonim: true } } },
      }),
    ]);

    return (
      <DecjaPocetna
        skola={karticaSkole}
        pseudonim={session.user.pseudonim}
        mojId={ja.id}
        poen={zapis?.balance ?? 0}
        brojPrijatelja={prijatelji.broj}
        poenNaCekanju={prijatelji.poenNaCekanju}
        stanje={ja.stanje}
        status={prikaz?.status ?? null}
        naStaSeCeka={prikaz?.naStaSeCeka ?? null}
        kod={poziv?.kod ?? null}
        mojihOglasa={mojihOglasa}
        roditelji={mojiRoditelji.map((r) => r.roditelj)}
        oglasi={oglasi.map((o) => ({
          id: o.id,
          naslov: o.title,
          opis: o.description,
          cena: o.price,
          cenaTip: o.cenaTip,
          imaSliku: o.images.length > 0,
          oglasivac: o.seller.pseudonim,
        }))}
        chatInicijalno={chatDeca
          .map((p) => ({
            id: p.id,
            userId: p.user.id,
            pseudonim: p.user.pseudonim,
            avatar: p.user.avatar,
            content: p.content,
            createdAt: p.createdAt.toISOString(),
            izmenjeno: p.izmenjenoAt !== null,
          }))
          .reverse()}
      />
    );
  }

  // Korisniku Početna kaže jedan red: da nije u Kolu i kuda dalje (odluka vlasnika
  // 02.11.2026). Pun tekst o spisku za poziv („Želim da me neko nazove") stoji samo
  // na Potvrdama, gde se na spisak i ulazi — tamo je vidljiv pre klika.
  const jeKorisnik = prikaz?.status === "KORISNIK";

  // Članu Kola, čuvaru i osnivaču Početna kaže šta čeka baš njega (spisak za
  // poziv, potvrda postojanja deteta; nadzor dodaje klijent iz `useMe`).
  const jePotvrdjen =
    prikaz?.status === "CLAN_KOLA" || prikaz?.status === "CUVAR_KOLA" || prikaz?.status === "OSNIVAC";
  const [naSpisku, postojanjeDeteta] = jePotvrdjen
    ? await Promise.all([
        // Broj, ne spisak: `spisakZaPoziv` usput čisti istekla otvaranja (upis), a
        // Početna se otvara često. Isti uslov kao spisak na Potvrdama.
        prisma.zahtevZaRazgovor.count({
          where: {
            userId: { not: session.user.id },
            user: { status: "ACTIVE", deaktiviranAt: null, maloletan: false },
          },
        }),
        zahteviPostojanjaZaPotvrdu(session.user.id).then((r) => r.length).catch(() => 0),
      ])
    : [0, 0];
  // Roditelju, bilo kog statusa, Početna kaže i šta čeka njega kao roditelja
  // (paket F, F1-2). Dete ovde ne stiže — ono ima svoju početnu iznad.
  const mojaAdresa = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  const roditelj = await cekaRoditelja(session.user.id, mojaAdresa?.email ?? null);
  const tPocetna = await getTranslations("pocetna");
  const tCommon = await getTranslations("common");

  // Brojke zajednice (korisnici, oglasi, razmene, ukupno POEN-a) više nisu na
  // Početnoj — ostaju na /sistem (odluka vlasnika 02.11.2026).
  const [blogObjave, chatPoruke] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: { author: { select: { pseudonim: true } } },
    }),
    // 🔴 Soba se MORA navesti i ovde. Bez toga je prvih sto poruka koje odrastao
    // član vidi pri otvaranju ekrana mešano sa dečjom sobom — pravilo je stajalo
    // tačno u `GET /api/chat`, a ovaj upit je za njega znao ništa.
    prisma.chatMessage.findMany({
      where: usloviSobeOdraslih(session.user.id),
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, pseudonim: true, verified: true, avatar: true } } },
    }),
  ]);

  const blog = blogObjave.map((o) => ({
    id: o.id,
    title: o.title,
    content: o.content,
    authorPseudonim: o.author.pseudonim,
    publishedAt: o.publishedAt.toISOString(),
  }));

  const chat = chatPoruke
    .map((p) => ({
      id: p.id,
      userId: p.user.id,
      pseudonim: p.user.pseudonim,
      verified: p.user.verified,
      avatar: p.user.avatar,
      content: p.content,
      createdAt: p.createdAt.toISOString(),
      izmenjeno: p.izmenjenoAt !== null,
    }))
    .reverse();

  return (
    <PocetnaKlijent
      pseudonim={session.user.pseudonim}
      currentUserId={session.user.id}
      blog={blog}
      chatInicijalno={chat}
      jeAdminViewer={jeAdmin(session.user)}
      // Po statusu (set 4.8.2; odluka vlasnika 02.11.2026): korisniku jedan red
      // „Još nisi u Kolu." sa putem na Potvrde; članu bez potvrde kartica sa
      // obaveznim rečenicama (Pravilnik čl. 2, 28; dokaz stvarnosti čl. 6; Uslovi
      // čl. 2). Član Kola, čuvar i osnivač dobijaju samo „Čeka na tebe".
      karticaStatusa={
        jeKorisnik ? (
          <div className="space-y-4">
            <Kartica padding="sm" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-medium text-kolo-text">{tPocetna("nisi_u_kolu")}</p>
              <Link href="/verifikacija" className="inline-flex min-h-10 items-center text-sm font-semibold text-kolo-green-700 hover:underline">
                {tCommon("kako_u_kolo")} →
              </Link>
            </Kartica>
            <CekaNaTebe roditelj={roditelj} />
          </div>
        ) : prikaz?.status === "CLAN_BEZ_POTVRDE" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <OznakaStatusa varijanta="kartica" svoj status={prikaz.status} zrno={prikaz.zrno}>
              {/* Sledeći korak kao dugme, ne kao poslednja rečenica kartice. */}
              <Link href="/verifikacija" className={klaseDugmeta() + " mt-4"}>
                {tPocetna("dugme_pokazi_kod")}
              </Link>
            </OznakaStatusa>
            <CekaNaTebe roditelj={roditelj} />
          </div>
        ) : jePotvrdjen ? (
          <CekaNaTebe spisak={naSpisku} postojanjeDeteta={postojanjeDeteta} roditelj={roditelj} />
        ) : null
      }
    />
  );
}
