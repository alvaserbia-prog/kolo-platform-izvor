import { randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { emailLayout, esc, posaljiEmailRaw } from "@/lib/email";
import { prevedi } from "@/lib/prevod-servera";
import {
  hesKodaPotpisa,
  kontrolniBrojTeksta,
  zaglavljePrimerka,
} from "./pokroviteljstvo-dobrima";
import {
  kodSmeDaSeProveri,
  ocistiKodPotpisa,
  potvrdePotpisaOk,
  POTPIS_KOD_CIFARA,
  POTPIS_KOD_TRAJANJE_MIN,
  POTPIS_KOD_RAZMAK_SEKUNDI,
} from "@/lib/pokroviteljstvo-dobrima-pravila";

/**
 * Potpis ugovora o NOVČANOM pokroviteljstvu (Pravilnik o pokroviteljstvu i
 * donacijama čl. 8 st. 1, koji upućuje na postupak iz čl. 13g st. 4; registar
 * 2026-10, F5-M1). Isti postupak kao za ugovor o dobrima: tri potvrde (pročitao,
 * ovlašćen, saglasan sa zaključenjem na platformi), jednokratni šestocifreni kod
 * sa mejla, kontrolni broj snimljenog teksta i primerak davaocu i podnosiocu.
 *
 * 🔴 Potpis NE upisuje POEN — kod novca se POEN upisuje tek pri potvrdi prijema
 * uplate (`potvrdiPrijavu`, čl. 8 st. 2). Potpis je dokaz volje i ovlašćenja, ne
 * okidač kanala. 🔴 Ne beleže se IP adresa ni podaci o uređaju.
 */
export class PotpisGreska extends Error {
  status: number;
  constructor(poruka: string, status = 400) {
    super(poruka);
    this.status = status;
  }
}

function istiHes(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Šalje jednokratni kod podnosiocu; u bazi ostaju samo heš, rok i brojač (nula). */
export async function posaljiKodZaPotpisNovca(id: string, userId: string) {
  const p = await prisma.pokroviteljPrijava.findUnique({
    where: { id },
    select: {
      podnosilacId: true, status: true, naziv: true, potpisKodPoslatAt: true,
      podnosilac: { select: { email: true, jezik: true, pseudonim: true } },
    },
  });
  if (!p) throw new PotpisGreska("Prijava nije pronađena.", 404);
  if (p.podnosilacId !== userId) throw new PotpisGreska("Nije vaša prijava.", 403);
  if (p.status !== "CEKA_POTPIS") throw new PotpisGreska("Prijava nije u stanju čekanja potpisa.", 409);
  if (!p.podnosilac.email) throw new PotpisGreska("Nalog nema adresu elektronske pošte na koju bi kod stigao.", 409);
  const sada = new Date();
  if (p.potpisKodPoslatAt && sada.getTime() - p.potpisKodPoslatAt.getTime() < POTPIS_KOD_RAZMAK_SEKUNDI * 1000)
    throw new PotpisGreska("Kod je upravo poslat. Novi kod možeš zatražiti za minut.", 429);
  const kod = String(randomInt(0, 10 ** POTPIS_KOD_CIFARA)).padStart(POTPIS_KOD_CIFARA, "0");
  const istice = new Date(sada.getTime() + POTPIS_KOD_TRAJANJE_MIN * 60 * 1000);
  const r = await prisma.pokroviteljPrijava.updateMany({
    where: { id, status: "CEKA_POTPIS" },
    data: { potpisKodHash: hesKodaPotpisa(id, kod), potpisKodIstice: istice, potpisKodPokusaja: 0, potpisKodPoslatAt: sada },
  });
  if (r.count === 0) throw new PotpisGreska("Prijava nije u stanju čekanja potpisa.", 409);
  const jezik = p.podnosilac.jezik ?? "sr";
  const poslato = await posaljiEmailRaw(
    p.podnosilac.email,
    prevedi(jezik, "postaniPokrovitelj.mejl_kod_naslov"),
    emailLayout({
      naslov: prevedi(jezik, "postaniPokrovitelj.mejl_kod_naslov"),
      pozdrav: p.podnosilac.pseudonim,
      telo: [
        prevedi(jezik, "postaniPokrovitelj.mejl_kod_telo", { naziv: esc(p.naziv) }),
        `<strong style="font-size:22px;letter-spacing:4px;">${kod}</strong>`,
        prevedi(jezik, "vauceri.mejl_kod_rok", { minuta: POTPIS_KOD_TRAJANJE_MIN }),
      ],
      jezik,
    }),
    "potpis-ugovora-novac",
  );
  if (!poslato) throw new PotpisGreska("Kod nije poslat. Pokušaj ponovo za minut.", 502);
  return { istice: istice.toISOString() };
}

/** Potpis: tri potvrde i tačan kod → POTPISANA, vreme i kontrolni broj teksta, primerak. */
export async function potpisiPrijavuNovca(
  id: string,
  userId: string,
  unos: { kod: unknown; procitao: unknown; ovlascen: unknown; saglasan: unknown },
) {
  if (!potvrdePotpisaOk(unos))
    throw new PotpisGreska("Pre potpisa potvrdi da si ugovor pročitao, da si ovlašćen da ga zaključiš i da si saglasan sa zaključenjem na platformi.");
  const kod = ocistiKodPotpisa(unos.kod);
  if (!kod) throw new PotpisGreska("Upiši šestocifreni kod sa mejla.");

  const p = await prisma.pokroviteljPrijava.findUnique({
    where: { id },
    select: {
      podnosilacId: true, status: true, ugovorTekst: true,
      potpisKodHash: true, potpisKodIstice: true, potpisKodPokusaja: true,
      podnosilac: { select: { email: true, jezik: true, pseudonim: true, maloletan: true } },
      upis: { select: { kontaktEmail: true } },
    },
  });
  if (!p) throw new PotpisGreska("Prijava nije pronađena.", 404);
  if (p.podnosilacId !== userId) throw new PotpisGreska("Nije vaša prijava.", 403);
  if (p.status !== "CEKA_POTPIS") throw new PotpisGreska("Prijava nije u stanju čekanja potpisa.", 409);
  if (p.podnosilac.maloletan) throw new PotpisGreska("Ugovor ne može potpisati ovaj nalog.", 403);

  const sada = new Date();
  const smeKod = kodSmeDaSeProveri({ hash: p.potpisKodHash, istice: p.potpisKodIstice, pokusaja: p.potpisKodPokusaja }, sada);
  if (!smeKod.ok) throw new PotpisGreska(smeKod.razlog, 409);
  if (!istiHes(hesKodaPotpisa(id, kod), p.potpisKodHash!)) {
    // Pokušaj se broji atomarno — dva istovremena pogrešna unosa troše dva pokušaja.
    await prisma.pokroviteljPrijava.updateMany({
      where: { id, status: "CEKA_POTPIS" },
      data: { potpisKodPokusaja: { increment: 1 } },
    });
    throw new PotpisGreska("Kod nije tačan.", 400);
  }

  const kontrolniBroj = kontrolniBrojTeksta(p.ugovorTekst);
  const r = await prisma.pokroviteljPrijava.updateMany({
    where: { id, status: "CEKA_POTPIS", potpisKodHash: p.potpisKodHash },
    data: { status: "POTPISANA", potpisanoAt: sada, kontrolniBroj, potpisKodHash: null, potpisKodIstice: null },
  });
  if (r.count === 0) throw new PotpisGreska("Ugovor je već potpisan.", 409);

  await posaljiPrimerak({
    ugovorTekst: p.ugovorTekst,
    potpisanoAt: sada,
    kontrolniBroj,
    kontaktEmail: p.upis?.kontaktEmail ?? null,
    podnosilac: p.podnosilac,
  });
  return { kontrolniBroj };
}

async function posaljiPrimerak(p: {
  ugovorTekst: string;
  potpisanoAt: Date;
  kontrolniBroj: string;
  kontaktEmail: string | null;
  podnosilac: { email: string | null; jezik: string | null; pseudonim: string };
}) {
  const telo = (jezik: string) => [
    esc(zaglavljePrimerka(jezik, p.potpisanoAt, p.kontrolniBroj)),
    ...p.ugovorTekst.split("\n").filter((r) => r.trim()).map((r) => esc(r)),
  ];
  try {
    if (p.kontaktEmail) {
      await posaljiEmailRaw(
        p.kontaktEmail,
        prevedi("sr", "vauceri.mejl_primerak_naslov"),
        emailLayout({
          naslov: prevedi("sr", "vauceri.mejl_primerak_naslov"),
          telo: [prevedi("sr", "postaniPokrovitelj.mejl_primerak_davalac"), ...telo("sr")],
          jezik: "sr",
        }),
        "primerak-ugovora-novac",
      );
    }
    if (p.podnosilac.email && p.podnosilac.email !== p.kontaktEmail) {
      const jezik = p.podnosilac.jezik ?? "sr";
      await posaljiEmailRaw(
        p.podnosilac.email,
        prevedi(jezik, "vauceri.mejl_primerak_naslov"),
        emailLayout({
          naslov: prevedi(jezik, "vauceri.mejl_primerak_naslov"),
          pozdrav: p.podnosilac.pseudonim,
          telo: [prevedi(jezik, "vauceri.mejl_primerak_podnosilac"), ...telo(jezik)],
          jezik,
        }),
        "primerak-ugovora-novac",
      );
    }
  } catch (e) {
    console.error("[pokroviteljstvo] primerak ugovora nije poslat", e);
  }
}
