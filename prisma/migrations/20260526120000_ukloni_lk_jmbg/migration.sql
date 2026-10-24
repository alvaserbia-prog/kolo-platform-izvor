-- Uklanjanje LK/JMBG verifikacije
-- Dokaz stvarnosti se sprovodi isključivo kroz lanac jemstva (VerifikacionaVeza),
-- bez prikupljanja lične karte ni JMBG-a. Stari model ručne/upload verifikacije
-- (VerificationRequest) i odvojeni pristanak za obradu lk/JMBG (VerifikacijaPristanak)
-- se uklanjaju zajedno sa pratećim enum-om.

DROP TABLE IF EXISTS "VerificationRequest";
DROP TABLE IF EXISTS "VerifikacijaPristanak";
DROP TYPE IF EXISTS "VerificationStatus";
