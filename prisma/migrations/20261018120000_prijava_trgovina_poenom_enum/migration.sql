-- Nov razlog prijave oglasa: trgovina POEN-om za novac.
--
-- Uslovi čl. 21 st. 2 i čl. 24 st. 2 zabranjuju oglas čiji je predmet zamena
-- POEN-a za novac, a Pravilnik čl. 16 (set 4.6.9) kaže da Fondacija u takvim
-- zamenama ne posreduje. Do sada je takva prijava išla pod „Zabranjeno dobro"
-- ili „Drugo", pa se iz spiska prijava nije videlo o čemu je reč.
--
-- Samo nova vrednost enuma, u zasebnom fajlu (CLAUDE.md, Migracije). Nijedna
-- postojeća prijava se ne prevodi u nov razlog: istorija se ne prepravlja.
ALTER TYPE "PrijavaRazlog" ADD VALUE IF NOT EXISTS 'TRGOVINA_POENOM' BEFORE 'DRUGO';
