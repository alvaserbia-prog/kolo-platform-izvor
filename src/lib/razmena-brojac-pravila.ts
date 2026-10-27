/**
 * Brojač razmena — donji prag, na jednom mestu.
 *
 * „Razmena" u javnim pokazateljima (naslovna, početna, /sistem) nije zaseban
 * zapis nego prepis POEN-a između dva korisnička zapisa (`TRANSFER`). Bez donjeg
 * praga taj brojač meri i simbolične prepise od jednog POEN-a, pa broj na ekranu
 * prestaje da govori o razmeni dobara i usluga — a to je jedino zbog čega tamo i
 * stoji.
 *
 * 🔴 Prag se meri PO PREPISU, ne po zbiru sa istim čovekom: pet prepisa od po
 * 50 POEN nisu jedna razmena od 250, nego pet sitnih koje brojač ne prihvata.
 *
 * 🔴 Ovo je DRUGI prag od `MIN_IZNOS_TRANSAKCIJE` (1.000 POEN) u
 * `doprinos-razmeni-pravila.ts` i ne spajaju se: tamo se odlučuje da li se
 * čoveku upisuje POEN po lestvici nekadašnjeg čl. 40b (putanja ukinuta setom 4.8.0), ovde se samo broji šta se prikazuje.
 * Lestvica nagrađuje, brojač meri — pragovi im se mogu i razići.
 *
 * 🟡 Prepis ispod praga se ne poništava, ne skriva i ne gubi: stoji u istoriji
 * novčanika obe strane i u `/api/javno/feed`. Iz brojača razmena i iz zbira
 * „Razmenjeno POENA" (`/sistem`, isti uslov) izlazi samo kao stavka koja se broji.
 *
 * Fajl je namerno bez ijednog `import`-a i bez Prisme (pravilo 9) — uvoze ga
 * serverske stranice koje same pišu upit.
 */

/** Najmanji prepis koji brojač razmena prihvata kao razmenu. */
export const MIN_POEN_RAZMENE = 100;

/**
 * Uslov po kome se prepis broji kao razmena. Ide u SVAKI upit koji javno
 * prikazuje broj razmena ili njihov spisak — spaja se spread-om, da uslov ostane
 * jedan i kad upit ima svojih (npr. `createdAt` za „danas", `BEZ_DECE` za spisak).
 */
export const USLOV_RAZMENE = {
  type: "TRANSFER" as const,
  amount: { gte: MIN_POEN_RAZMENE },
  // 🔴 Razmena je prepis između DVA ČLANA. Gašenje naloga, lažna verifikacija i
  // brisanje dečjeg naloga su do 06.10.2026. vraćali POEN Protokolu tipom `TRANSFER`
  // (od tada `PONISTENJE_ZAPISA`), pa je brisanje jednog profila dodalo dve
  // „razmene". Zatečeni redovi se ne prepravljaju — ovaj uslov ih drži van brojača. Ključ je `NOT`, a ne `fromWalletId`/`toWalletId`, jer upiti
  // koji ovo spajaju spread-om svoje uslove po novčanicima nose u `AND`.
  // `"banka-singleton"` = `PROTOKOL_WALLET_ID`; fajl je namerno bez importa.
  NOT: [{ fromWalletId: "banka-singleton" }, { toWalletId: "banka-singleton" }],
};
