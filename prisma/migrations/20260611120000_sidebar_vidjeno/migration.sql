-- Sidebar badge "viđeno" vremena: badge za Novčanik/Pijaca broji samo stavke
-- novije od ovog trenutka. Postavlja se kad korisnik otvori odgovarajući tab,
-- pa badge ide na 0 i vraća se tek kad stigne nešto novo.
ALTER TABLE "User" ADD COLUMN "vidjenoNovcanikAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "vidjenoPijacaAt" TIMESTAMP(3);
