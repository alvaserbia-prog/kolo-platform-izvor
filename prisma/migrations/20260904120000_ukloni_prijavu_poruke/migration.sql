-- Uklanjanje prijave poruke iz Pričaonice (odluka vlasnika, 04.09.2026).
--
-- Prijava je uklonjena iz OBE sobe zajedno sa modelom. Povod je dečja soba: red
-- čekanja u admin tabu „Prijave" nema ko da rešava, pa je dugme bilo obećanje
-- koje se ne ispunjava. Uz to su iz akata brisane odredbe koje su prijavu
-- uređivale — Pravilnik o učešću dece čl. 18a i pasus čl. 25 Uslova korišćenja
-- (set 4.4.2), pa mehanizam više nema ni pravni osnov ni ekran.
--
-- 🔴 Za razliku od gašenja Kruga, ovde se BRIŠU I PODACI. To je namerno i
-- bezopasno po zero-sum: `PrijavaPoruke` ne nosi nijedan zapis POEN-a, nema
-- Wallet i ne ulazi u opticaj. Brišu se samo prijave, ne i poruke — moderacija
-- Pričaonice ostaje netaknuta (`ChatMessage.uklonjenoAt` i
-- `DELETE /api/admin/chat/[id]`), pa Fondacija i dalje može da ukloni sadržaj
-- po čl. 25 Uslova; izgubljen je samo korisnički signal, ne i poluga.
--
-- Enum `PrijavaPorukeRazlog` odlazi sa tabelom jer ga nijedan drugi model ne
-- koristi. `PrijavaOglasaStatus` OSTAJE — nosi ga `PrijavaOglasa` (prijava
-- oglasa na Pijaci), koja je drugi institut i ne dira se.

DROP TABLE IF EXISTS "PrijavaPoruke";
DROP TYPE IF EXISTS "PrijavaPorukeRazlog";
