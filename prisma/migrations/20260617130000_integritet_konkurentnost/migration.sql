-- K6: isti verifikator ne sme dvaput da verifikuje istog korisnika (anti-inflacija indeksa
-- + zatvaranje race-a na anti-cirkularnoj proveri). Ako postoje duplikati, ova migracija
-- će glasno pasti — duplikate treba prethodno očistiti (na produkciji ih ne bi trebalo biti).
CREATE UNIQUE INDEX "VerifikacionaVeza_verifikatorId_verifikovaniId_key" ON "VerifikacionaVeza"("verifikatorId", "verifikovaniId");

-- Svaki prag rasta kruga se isplaćuje tačno jednom (race-safe rezervacija praga).
CREATE UNIQUE INDEX "KrugBonusLog_krugId_threshold_key" ON "KrugBonusLog"("krugId", "threshold");
