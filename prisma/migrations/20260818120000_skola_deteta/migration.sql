-- Škola maloletnog korisnika (Pravilnik o učešću dece, čl. 7 + član o pregledu po
-- školama). Plan: `docs/plan-ranglista-skola.html`.
--
-- Dve kolone i jedan indeks. BEZ backfill-a — nijedan zatečeni nalog nema školu,
-- jer podatak do sada nije ni postojao.
--
-- `skolaSifra` nosi ŠIFRU iz šifarnika `src/lib/skole-srbije.ts`, nikad naziv:
-- isto ime („Vuk Karadžić") nosi preko trideset škola u Srbiji, pa naziv nije
-- jedinstven. Namerno bez strane veze — šifarnik je statičan spisak u aplikaciji,
-- kao i spisak naselja, i sistem o školi ne stvara nijedan sopstveni podatak.
--
-- `skolaPromenjenaAt` nosi rok od 30 dana između dve promene. Ostaje NULL posle
-- PRVE postavke — prva postavka nije promena i ne pokreće rok.

ALTER TABLE "User" ADD COLUMN "skolaSifra" TEXT;
ALTER TABLE "User" ADD COLUMN "skolaPromenjenaAt" TIMESTAMP(3);

-- Prvi član je `maloletan` zato što upit ranglista uvek počinje od njega —
-- punoletan nalog školu nema.
CREATE INDEX "User_maloletan_skolaSifra_idx" ON "User"("maloletan", "skolaSifra");
