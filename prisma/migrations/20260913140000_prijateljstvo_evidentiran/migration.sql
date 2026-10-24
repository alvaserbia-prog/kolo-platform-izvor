-- R-02, mera M-8: „isplata" izlazi iz imena kolona dečjeg kanala.
--
-- Kanal iz čl. 15 t. 9 ne isplaćuje ništa — Protokol upisuje zapis. Ime kolone
-- `poenIsplacen` je u šemi tvrdilo suprotno, i to baš u jedinom kanalu čiji su
-- primaoci maloletnici. Isti razred nalaza kao `zrnaKupljeno`/`poenPlaceno`.
--
-- Samo preimenovanje: podaci se ne diraju, tip ostaje isti, indeksa nad ovim
-- kolonama nema.
ALTER TABLE "Prijateljstvo" RENAME COLUMN "poenIsplacen" TO "poenEvidentiran";
ALTER TABLE "Prijateljstvo" RENAME COLUMN "isplacenAt" TO "evidentiranAt";
