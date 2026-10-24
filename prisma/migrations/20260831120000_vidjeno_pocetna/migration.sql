-- "Viđeno" vreme za sidebar badge uz „Početna": badge broji nove poruke u
-- Pričaonici i nove objave Fondacije (Vesti) novije od ovog trenutka.
--
-- Zatečeni nalozi ostaju NULL NAMERNO — `izracunajDnevniBrojeve` tada pada na
-- ponoć („novo danas"), isto što već radi za Novčanik i Pijacu. Upis vremena
-- ovde bi ćutke sakrio ono što je stiglo jutros.
ALTER TABLE "User" ADD COLUMN "vidjenoPocetnaAt" TIMESTAMP(3);
